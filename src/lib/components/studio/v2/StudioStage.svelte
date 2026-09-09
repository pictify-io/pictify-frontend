<script>
	/**
	 * The editable stage. B02-1.
	 *
	 * The design lives in an IFRAME, not in the dashboard's DOM. That is a
	 * security boundary, not a layout convenience: this markup is written by the
	 * buyer or by the AI agent, and rendering it inline would let it run script
	 * in our origin. The frame is same-origin (the editor has to reach into it)
	 * but carries no scripts of its own — the serializer strips anything the
	 * editor added, and DOMPurify strips script, iframe, object, form and
	 * friends on the way in.
	 *
	 * The selection chrome — context bar and tag — is drawn OUTSIDE the frame,
	 * in this document, so it can never be serialized into the design.
	 */
	import { onDestroy, createEventDispatcher } from 'svelte';
	import { attachStage, cleanHtml } from './stage.js';
	import { splitDocument } from './document-shell.js';
	import { toStageHtml, checkRoundTrip, LOGIC_CHROME_CSS } from './logic.js';
	import { writePreviewDocument } from './preview-document.js';

	export let html = '';
	export let width = 1200;
	export let height = 800;
	export let zoom = 'fit';
	/** Read-only in Preview data and Rendered proof. */
	export let editable = true;
	/**
	 * Code mode: the canvas is a live view of the text, so it SELECTS but does
	 * not drag, resize or edit in place (PS-2). Distinct from `editable`, which
	 * being false used to mean "do not attach at all" — that is what made Code
	 * mode a canvas nothing responded to.
	 */
	export let selectOnly = false;
	export let sampleValues = {};
	/**
	 * The live stage API, bound outward so the rails can drive the canvas.
	 * Every canvas action has a rail equivalent (locked decision 3), and the
	 * rails cannot honour that without a handle on the stage.
	 */
	export let api = null;

	const dispatch = createEventDispatcher();

	let frame;
	let stage = null;
	/** The loaded document's shell, so edits are saved back into it, not instead of it. */
	let shell = null;
	/** Set when the Handlebars will not round-trip: the canvas goes read-only. */
	let logicBlocked = false;
	/** The last html this stage emitted, so it can recognise its own output. */
	let lastEmitted = null;
	let lastViewKey = null;
	/** Draw the else-branches too. Off by default — the renderer shows one branch. */
	export let showElse = false;
	/**
	 * `({ html, variables, width, height }) => { dataUrl } | { error }`.
	 *
	 * Supplied by the route rather than imported, because the campaign context
	 * mounts this same component against a different endpoint — and because a
	 * component that reaches for the network on its own cannot be tested
	 * without one.
	 */
	export let renderPreview = null;
	/**
	 * `assets` (default) or `any`. Widens ONLY `img-src`, and only where the
	 * author and the viewer are the same person — the public tool editor, whose
	 * whole point is using a logo from a host we cannot enumerate. See
	 * preview-document.js.
	 */
	export let imagePolicy = 'assets';

	/** `{ status, dataUrl, error }` for the server-rendered Preview. */
	let serverProof = { status: 'idle', dataUrl: null, error: null };
	/** Guards against a slow response overwriting a newer one. */
	let previewSeq = 0;
	let selection = null;
	let status = null;
	let containerWidth = 0;
	let lastKey = null;

	$: scale =
		zoom === '50%'
			? 0.5
			: zoom === '100%'
			? 1
			: containerWidth
			? Math.min(1, containerWidth / width)
			: 0.5;

	/**
	 * Rebuild the frame only when what it shows actually changes, and never
	 * while the buyer is mid-gesture — reloading the document under a drag
	 * loses both the selection and the gesture.
	 *
	 * "What it shows" is the html AND whether it is editable AND, when it is
	 * not, the sample values substituted into it. Keying on html alone was a
	 * bug measured on the dev harness (/dev/stage): switching to Preview data
	 * with unchanged html never rebuilt the frame, so the preview showed raw
	 * {{tokens}} instead of the sample, and the editor stayed attached and
	 * selectable under a mode that is meant to be read-only. Changing the
	 * sample also did nothing until the html changed.
	 */
	/*
	 * Split in two so an html change can be told apart from a mode change.
	 * Everything except the document goes in `viewKey`.
	 */
	$: viewKey = JSON.stringify([editable, selectOnly, showElse, imagePolicy, editable ? null : sampleValues]);
	$: mountKey = JSON.stringify([html, viewKey]);
	$: if (frame && mountKey !== lastKey) {
		/*
		 * A REMOUNT IS SKIPPED WHEN THE DOCUMENT IS THE STAGE'S OWN LAST OUTPUT.
		 *
		 * Every rail edit went rail -> setStyle -> commit -> onTransaction ->
		 * editor.commit -> `html` changes -> this remounted the frame, which
		 * destroyed the stage, nulled the selection and dropped the rail back to
		 * Document. describe() had already run, so the rail flashed the new
		 * value and then vanished: "node selection is not reactive".
		 *
		 * The DOM already shows this html — the stage is what produced it — so
		 * there is nothing to rebuild. Only edits from somewhere else (AI, the
		 * code pane, undo/redo) rebuild, and those restore the selection below.
		 */
		const selfEmitted = stage && html === lastEmitted && viewKey === lastViewKey;
		lastKey = mountKey;
		lastViewKey = viewKey;
		if (!selfEmitted) mount(html);
	}

	async function mount(source) {
		// Survives the rebuild: an edit from the AI, the code pane or undo has to
		// put the buyer back where they were, not at nothing selected.
		const keepId = selection?.count === 1 ? selection.id : null;
		if (stage) {
			stage.destroy();
			stage = null;
		}
		// A read-only mount has no editor: the rails must not keep driving a
		// stage that is gone, and a stale selection must not outlive it.
		api = null;
		if (selection) dispatch('selection', null);
		selection = null;
		status = null;
		// Select-only shows the AUTHORED markup, tokens and all — it is a view of
		// the code, and substituting values would show something the text does
		// not say.
		/*
		 * A saved template is usually a whole document, and the parts outside
		 * `<body>` carry the canvas size, the page background and the webfont.
		 * Split them off, mount the body, and hand the shell to both the frame
		 * (so the design looks like itself) and the stage (so `serialize` puts
		 * it back).
		 */
		shell = splitDocument(source);

		/*
		 * THE GATE. A template whose Handlebars does not survive the round trip
		 * is shown, but not edited: the studio saves what it mounted, so
		 * dragging something in a document it cannot put back together would
		 * write a broken template over a working one. Read-only and a reason
		 * beats a silent rewrite.
		 */
		const gate = checkRoundTrip(shell.body);
		logicBlocked = !gate.wellFormed;
		const staged = logicBlocked ? { html: shell.body } : toStageHtml(shell.body);

		/*
		 * PREVIEW OF A DOCUMENT WITH LOGIC IS RENDERED BY THE SERVER.
		 *
		 * `substitute` replaces `{{token}}` and nothing else — it cannot evaluate
		 * `{{#if}}`, and it cannot call a helper, so `{{uppercase (slice
		 * firstName 0 1)}}` stayed on the canvas as thirty-three literal
		 * characters in a one-character avatar. Preview means "what the
		 * recipient gets", and the only thing that knows that is the renderer.
		 *
		 * Documents WITHOUT logic keep the client path: it is instant, it costs
		 * no quota and no round trip, and for a design whose only dynamic parts
		 * are plain tokens it produces the same answer.
		 */
		const previewMode = !editable && !selectOnly;
		if (previewMode && staged.blocks.length && renderPreview) {
			runServerPreview(source);
			return;
		}
		serverProof = { status: 'idle', dataUrl: null, error: null };

		// Preview substitutes sample values; Design and Code show the authored
		// markup. Either way the logic is WRAPPED, so a condition draws as a
		// chip on the canvas instead of as `{{#if firstName}}` in the sentence.
		const substituted =
			editable || selectOnly ? staged.html : substitute(staged.html, sampleValues);
		const doc = writePreviewDocument(frame, cleanHtml(substituted), {
			css: `html,body{margin:0;padding:0}${LOGIC_CHROME_CSS}`,
			shell,
			images: imagePolicy
		});
		if (!doc) {
			status = 'The stage could not start. Reload to try again.';
			return;
		}
		// Chips are authoring chrome: never in Preview, which is meant to be
		// what the buyer's recipient will actually receive.
		doc.documentElement.setAttribute(
			'data-pictify-chrome',
			(editable || selectOnly) && !logicBlocked ? 'on' : 'off'
		);
		doc.documentElement.setAttribute('data-pictify-else', showElse ? 'show' : 'hide');

		if (logicBlocked) {
			status = gate.reason
				? `This template's logic could not be read (${gate.reason}). Showing it read-only — edit it in Code.`
				: "This template's logic could not be read. Showing it read-only — edit it in Code.";
			return;
		}

		if (!editable && !selectOnly) return;
		try {
			stage = await attachStage(frame, {
				selectOnly: selectOnly && !editable,
				shell,
				width,
				height,
				onTransaction: (label, next) => {
					lastEmitted = next;
					dispatch('transaction', { label, html: next });
				},
				onSelection: (s) => {
					/*
					 * NORMALISED ONCE, AND THE SAME VALUE GOES OUT.
					 *
					 * A deselect arrives from describe() as `{ count: 0, ids: [] }`,
					 * which is truthy. This component reduced that to null for its
					 * own use but dispatched the raw object, so every consumer doing
					 * the obvious `e.detail || null` kept a "selection" with nothing
					 * in it — and SelectionRail then read `one.blocked` off null and
					 * threw. The component and its consumers have to mean the same
					 * thing by "selected".
					 */
					const next = s?.count ? s : null;
					selection = next;
					dispatch('selection', next);
				},
				onStatus: (message) => (status = message)
			});
			api = stage;
			// Only if the element is still there — an undo that removed it must
			// not leave a selection pointing at nothing.
			if (keepId) stage.selectById(keepId);
			dispatch('ready');
		} catch (err) {
			api = null;
			status = 'The stage could not start. Reload to try again.';
		}
	}

	/**
	 * Ask the server what this design actually renders to.
	 *
	 * Sends the WHOLE document, shell included — the renderer is given what a
	 * real render would be given, not the body the canvas happens to mount.
	 */
	async function runServerPreview(source) {
		const seq = ++previewSeq;
		serverProof = { status: 'loading', dataUrl: null, error: null };
		try {
			const res = await renderPreview({
				html: source,
				variables: sampleValues,
				width,
				height
			});
			// A stale response must never overwrite a newer one: the buyer can
			// change a value while a render is in flight.
			if (seq !== previewSeq) return;
			// The api wrappers return null on failure rather than throwing, so an
			// unchecked caller would show an empty frame as if it were a result.
			serverProof = res?.dataUrl
				? { status: 'ok', dataUrl: res.dataUrl, error: null }
				: {
						status: 'error',
						dataUrl: null,
						error: res?.error || 'The renderer returned nothing.'
					};
		} catch (err) {
			if (seq !== previewSeq) return;
			serverProof = {
				status: 'error',
				dataUrl: null,
				error: err?.data?.error || err?.message || 'This design could not be rendered.'
			};
		}
	}

	/** Same {{token}}-only substitution as CardPreview, and escaped for the same reason. */
	const substitute = (source, values) =>
		String(source || '').replace(/\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g, (m, key) => {
			const value = values[key];
			if (value === null || value === undefined) return '';
			return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		});

	function onKey(event) {
		if (!stage || !editable || !selection) return;
		const target = event.target;
		if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.isContentEditable))
			return;

		const step = event.shiftKey ? 10 : 1;
		const nudges = {
			ArrowLeft: [-step, 0],
			ArrowRight: [step, 0],
			ArrowUp: [0, -step],
			ArrowDown: [0, step]
		};
		if (nudges[event.key]) {
			event.preventDefault();
			stage.nudge(...nudges[event.key]);
			return;
		}
		if (event.key === 'Backspace' || event.key === 'Delete') {
			event.preventDefault();
			stage.removeSelected();
		}
	}

	onDestroy(() => {
		stage?.destroy();
		api = null;
	});
</script>

<svelte:window on:keydown={onKey} />

<div class="flex w-full flex-col items-center" bind:clientWidth={containerWidth}>
	<div
		class="relative overflow-hidden border border-brand-rule bg-white shadow-[4px_4px_0_0_rgba(0,0,0,0.08)]"
		style="width:{Math.round(width * scale)}px;height:{Math.round(height * scale)}px"
	>
		<!--
			`allow-same-origin` and nothing else. The stage needs same-origin access
			because the editor reads and writes `contentDocument` directly — a full
			`sandbox=""` would break every drag. Everything else stays off, so a
			script that got past the sanitizer still cannot run, and the document
			cannot navigate the page it is embedded in.

			Chrome logs "Blocked script execution … the document's frame is
			sandboxed and the 'allow-scripts' permission is not set" once per mount.
			That line is the sandbox working, not a fault: it is emitted for any
			sandboxed frame without `allow-scripts`, and the editor is unaffected
			because its code runs in the parent. Do not add `allow-scripts` to
			quieten it — that is the whole control.
		-->
		<iframe
			bind:this={frame}
			title="Design stage"
			sandbox="allow-same-origin"
			class="absolute left-0 top-0 origin-top-left border-0"
			style="width:{width}px;height:{height}px;transform:scale({scale})"
		/>

		{#if serverProof.status !== 'idle'}
			<!--
				Covers the frame rather than replacing it: the iframe keeps its
				document, so leaving Preview does not pay for a remount.
			-->
			<div class="absolute inset-0 flex items-center justify-center bg-white">
				{#if serverProof.status === 'ok'}
					<img src={serverProof.dataUrl} alt="Server render of this design" class="h-full w-full" />
				{:else if serverProof.status === 'loading'}
					<p class="font-sans text-[13px] text-brand-mute">Rendering this design…</p>
				{:else}
					<p class="max-w-[80%] text-center font-sans text-[13px] text-brand-alarm">
						{serverProof.error}
					</p>
				{/if}
			</div>
		{/if}
	</div>

	{#if selection?.count === 1}
		<!--
			The tag names what is selected in the design's own vocabulary — the
			element, the field it binds, and its size. "Heading · field:
			account_name · 300 × 34" is checkable; "div selected" is not.
		-->
		<div class="mt-3 flex flex-wrap items-center gap-2">
			<span class="bg-brand-royal px-2 py-1 font-mono text-[10.5px] text-white">
				{selection.tag}{selection.bindings?.length
					? ` · field: ${selection.bindings.join(', ')}`
					: ''} · {selection.width} × {selection.height}
			</span>
			{#if selection.role === 'flex'}
				<!-- Said out loud, because a drag here offsets rather than moves. -->
				<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute"
					>Flows with its group</span
				>
			{/if}
		</div>

		<div class="mt-2 flex flex-wrap items-center gap-1 rounded-btn bg-brand-ink p-1">
			{#if selection.leaf && !selection.bindings?.length}
				<button
					type="button"
					on:click={() => dispatch('edit-text')}
					class="h-8 rounded-[4px] px-2.5 font-sans text-[12.5px] text-white hover:bg-white/15"
					>Edit text</button
				>
			{/if}
			<button
				type="button"
				on:click={() => stage?.selectParent()}
				class="h-8 rounded-[4px] px-2.5 font-sans text-[12.5px] text-white hover:bg-white/15"
				>Select parent</button
			>
			<button
				type="button"
				on:click={() => stage?.duplicateSelected()}
				class="h-8 rounded-[4px] px-2.5 font-sans text-[12.5px] text-white hover:bg-white/15"
				>Duplicate</button
			>
			<button
				type="button"
				on:click={() => stage?.removeSelected()}
				class="h-8 rounded-[4px] px-2.5 font-sans text-[12.5px] text-white hover:bg-white/15"
				>Delete</button
			>
		</div>
	{:else if selection?.count > 1}
		<p class="mt-3 font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute">
			{selection.count} selected
		</p>
	{/if}

	{#if status}
		<p class="mt-2 max-w-[520px] text-center font-sans text-[12.5px] text-brand-slate">{status}</p>
	{/if}
</div>
