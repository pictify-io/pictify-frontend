<script>
	/**
	 * A tool page, as an editor. TS-5a / TS-7 (boards TS-03 `KW3-0`, TS-05, TS-06).
	 *
	 * ONE component for every tool on this layout. What differs between them is
	 * data — the gallery, the source block, the canvas size, which tab opens —
	 * so it is props, not a copy per tool. The alternative is nine editors that
	 * start identical and drift, and the first thing to drift is always the
	 * quota handling, which is the part that must not.
	 *
	 * Replaces a tool's old "pick a template, fill some fields, generate" block
	 * with the studio itself: the visitor edits the thing directly, with no
	 * account and nothing to install.
	 *
	 * THE PAGE OPENS ALREADY DRAWN. A default template with sample text, one
	 * element selected, the templates panel populated. Nothing here ever shows a
	 * first-time visitor an empty state — that is the difference between a tool
	 * that demonstrates itself and one that asks you to imagine it.
	 *
	 * THE SERVER OWNS THE COUNTERS. Downloads and AI edits both read their
	 * remaining count from the response, never from a local tally: counting in
	 * the browser is exactly what made the old "5 free today" a number rather
	 * than a limit.
	 */
	import { onMount, tick } from 'svelte';
	import EmbeddedStudio from './EmbeddedStudio.svelte';
	import SourceBlock from './SourceBlock.svelte';
	import AiLock from '$lib/components/studio/v2/AiLock.svelte';
	import { stageFromAgentEvent } from '$lib/tools/agent-stage.js';
	import StudioStage from '$lib/components/studio/v2/StudioStage.svelte';
	import SelectionRail from '$lib/components/studio/v2/SelectionRail.svelte';
	import { editor } from '$lib/components/studio/v2/editor-store.js';
	import { extractInputs, typeFor, defaultSampleFor } from '$lib/utils/template-tokens.js';
	import { createImagePublic, getGuestRenderQuota } from '../../../api/image.js';
	import { editGuestTemplate } from '../../../api/template.js';
	import { getWebsiteInfo } from '../../../api/tools/og-image.js';
	import { newDraftId, saveDraft, latestDraft } from '$lib/tools/editor-draft.js';
	import { writeInstruction } from '$lib/tools/write-instruction.js';
	import { tokeniseTemplate } from '$lib/tools/tokenise-template.js';
	import { inspectPastedHtml, reportLines } from '$lib/components/studio/v2/paste-report.js';
	import CodePane from '$lib/components/studio/v2/CodePane.svelte';
	import { nodeForOffset, rangeForNode } from '$lib/components/studio/v2/code-map.js';
	import { downloadFile } from '$lib/utils/download.js';
	import { analytics } from '$lib/telemetry.js';
	import { toast } from '../../../store/toast.store';

	/** `[{ key, name, category, html }]` — the tool's gallery, already fetched. */
	export let templates = [];
	export let width = 1200;
	export let height = 630;
	/** Which SOURCES kind sits at the top of Say it. */
	export let sourceKind = 'og';
	/** For analytics and nothing else. */
	export let toolName = 'og_image_generator';
	export let leftPanel = 'templates';
	export let opensIn = 'design';
	export let defaultTab = 'say';
	export let bulkLeadIn = null;
	export let downloadName = 'image';
	/** The formats this tool offers; the first is the primary. */
	export let formats = ['png', 'jpg', 'webp'];
	/**
	 * `{ side, percent, label }` — a dashed guide drawn OVER the canvas, never
	 * into the design. LinkedIn covers the left of a banner with the profile
	 * photo, and a banner that looks right in the editor and is half-hidden on
	 * the profile is the whole failure mode of the tool.
	 */
	export let safeZone = null;
	/**
	 * Samples a page can supply for tokens its templates carry but cannot
	 * describe — the certificates, whose `render(values)` names its inputs but
	 * whose markup has no ids for the tokeniser to read.
	 */
	export let initialSamples = {};
	/**
	 * The document a code-first tool opens on, when it has no gallery.
	 *
	 * Not a blank canvas: an empty stage gives a visitor nothing to change and
	 * nothing to render, so the first thing they do is leave. A short, entirely
	 * self-contained document is something they can edit a word of and see move.
	 */
	export let starterHtml = '';

	const AI_LIMIT = 3;

	let activeTemplate = null;
	// Seeded from the props, not hardcoded: these are BOUND to the embed, so a
	// literal here silently overrides `opensIn` / `defaultTab` and the
	// certificate tool opens on Say it instead of Inputs.
	let mode = opensIn === 'code' ? 'code' : 'design';
	let panel = defaultTab;
	let stageApi = null;
	let selection = null;
	let draftId = null;

	let fetchingUrl = false;
	let urlError = null;
	let instruction = '';
	let receipt = null;
	let aiBusy = false;
	/** Where the agent has got to, so a 20-second wait is not a blank spinner. */
	let aiStage = 'read';
	let aiError = null;
	let aiLeft = AI_LIMIT;

	let sampleValues = { ...initialSamples };

	/* ── code-first tools (TS-10) ───────────────────────────────────────── */
	/*
	 * The same pane the studio uses, on the same store, for the same reason it
	 * exists there: the buffer is the visitor's RAW TEXT while they are typing,
	 * and rewriting it under the caret is the one thing a code pane must never
	 * do. So `codeBuffer` is a plain local, written in exactly two places —
	 * here when the document changed by some means other than typing, and in
	 * `onCodeChange` from the keystroke itself.
	 */
	let codeBuffer = '';
	let codeCaretLine = null;
	/*
	 * The document as it stood the last time the buffer was written FROM it.
	 * Everything that changes the document some other way — a drag on the
	 * canvas, an AI edit, the starter loading — has to regenerate the buffer,
	 * or the next keystroke commits stale text over the real document. In the
	 * full studio that moment is "entering Code"; here the pane never closes,
	 * so the trigger is the document moving without us.
	 *
	 * NOT `localSeq`. `load()` resets the counter, so a starter arriving after
	 * the first flush lands on the same seq the empty state had and the pane
	 * stays blank — measured, a 0-character buffer over a rendered canvas.
	 * The html itself is the thing that actually changed.
	 */
	let lastBufferedHtml = null;
	$: if (leftPanel === 'code' && $editor.html !== lastBufferedHtml && !$editor.operation) {
		// Never mid-run: the AI owns the document until it finishes.
		codeBuffer = editor.serialize().html;
		lastBufferedHtml = codeBuffer;
	}

	$: codeValid = editor.codeIsRenderable(codeBuffer);
	$: codeVariableCount = new Set(
		[...String(codeBuffer || '').matchAll(/\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g)].map((m) => m[1])
	).size;
	$: codeSelectedLine = selection?.id
		? (rangeForNode(codeBuffer, selection.id)?.line ?? null)
		: codeCaretLine;

	/*
	 * WHAT WE CHANGED, before it is saved rather than after it renders wrong.
	 * Someone pasting a working page from their own site cannot see what will
	 * not survive the trip — the logo on their CDN is cached and same-origin in
	 * the tab they copied it from, and simply absent here.
	 */
	$: pasteReport = codeBuffer.trim() ? inspectPastedHtml(codeBuffer) : null;
	$: pasteLines = pasteReport && !pasteReport.ok ? reportLines(pasteReport) : [];

	function onCodeChange(event) {
		codeBuffer = event.detail.html;
		editor.setHtmlFromCode(codeBuffer);
		/*
		 * Read back from the store rather than assuming `codeBuffer` landed:
		 * a half-typed document is not renderable, so `html` deliberately holds
		 * the last good one. Recording what the document ACTUALLY is keeps the
		 * regenerate guard quiet until something other than typing moves it.
		 */
		lastBufferedHtml = $editor.html;
	}

	/** Caret → element: the code half of one shared selection. */
	function onCodeCaret(event) {
		codeCaretLine = event.detail.line;
		const id = nodeForOffset(codeBuffer, event.detail.offset);
		if (id && id !== selection?.id) stageApi?.selectById(id);
	}
	let downloadsLeft = null;
	let downloadsLimit = 5;
	let rendering = false;
	let format = formats[0] || 'png';

	$: html = $editor.html || '';
	$: variables = extractInputs(html).map((name) => ({ name, type: typeFor(name) }));

	/**
	 * Sample values, pre-filled the first time each token appears.
	 *
	 * An empty Inputs column asks the visitor to invent test data before they
	 * can see what the design does with it, and an empty variable renders as a
	 * hole — the card looks broken and they blame the template. So a token gets
	 * a plausible placeholder the moment it exists, and anything they type
	 * afterwards is theirs: `??=` here rather than an overwrite, or the field
	 * would fight the person typing in it.
	 */
	$: if (variables.length) {
		let added = false;
		for (const v of variables) {
			if (sampleValues[v.name] === undefined) {
				// Only for tokens a template did not bring a sample for — a variable
				// someone added by hand, or one the AI introduced.
				sampleValues[v.name] = defaultSampleFor(v.name, v.type);
				added = true;
			}
		}
		// One assignment, so Svelte sees it once rather than per key.
		if (added) sampleValues = { ...sampleValues };
	}

	/** Keys the visitor has actually typed in, so a template swap keeps them. */
	const touched = new Set();
	const setSample = (name, value) => {
		touched.add(name);
		sampleValues = { ...sampleValues, [name]: value };
	};

	/* ── draft ─────────────────────────────────────────────────────────── */
	/*
	 * Write-through on every commit. `localSeq` is the store's own change
	 * counter, so this fires when the document actually moved rather than on
	 * every store notification.
	 */
	let lastSaved = -1;
	$: if (draftId && $editor.localSeq !== lastSaved && $editor.html) {
		lastSaved = $editor.localSeq;
		saveDraft(draftId, {
			html: $editor.html,
			width,
			height,
			format,
			templateKey: activeTemplate,
			tool: toolName
		});
	}

	onMount(async () => {
		// A draft the visitor left behind beats the default template — but only
		// if it is recent; `loadDraft` flags anything older than 30 days and we
		// leave that alone rather than resurrecting it under them.
		const existing = latestDraft(toolName);
		if (existing && !existing.stale && existing.draft.html) {
			draftId = existing.id;
			activeTemplate = existing.draft.templateKey ?? templates[0]?.key ?? null;
			editor.load({ html: existing.draft.html, revision: 1 });
		} else {
			draftId = newDraftId();
			if (templates.length) useTemplate(templates[0], { silent: true });
			else if (starterHtml) editor.load({ html: starterHtml, revision: 1 });
		}
		await tick();
		refreshQuota();
		analytics?.trackToolOpened?.({ tool_name: toolName, mode: 'editor' });
	});

	async function refreshQuota() {
		const q = await getGuestRenderQuota();
		if (!q) return; // unknown stays unknown; the meter draws nothing
		downloadsLeft = q.remaining;
		downloadsLimit = q.limit ?? 5;
	}

	/* ── templates ─────────────────────────────────────────────────────── */
	/**
	 * Swap the layout, keep the values.
	 *
	 * A re-render of the chosen template, NOT a fresh AI run: picking a layout
	 * should cost nothing and take no time. The values the visitor has already
	 * put in are carried across by re-running the current instruction only if
	 * they ask for it — the URL field stays filled so "Make it" re-runs on the
	 * new layout.
	 */
	function useTemplate(template, { silent = false } = {}) {
		if (!template?.html) return;
		activeTemplate = template.key;

		/*
		 * TOKENISED ON THE WAY IN. These templates were built to be driven by DOM
		 * surgery — `#template-heading` and friends — so they ship prose where a
		 * template wants variables. Converting here means Inputs has something to
		 * show, Save produces a template with a real API contract, and the files
		 * themselves stay readable standalone HTML for everything else that reads
		 * them.
		 */
		const { html: tokenised, samples } = tokeniseTemplate(template.html);
		editor.load({ html: tokenised, revision: 1 });

		/*
		 * The design's own words become the samples — a better default than
		 * anything a generic table could invent, and the canvas looks exactly as
		 * its designer intended on first paint.
		 *
		 * VALUES THE VISITOR HAS ALREADY SET WIN, because swapping a layout must
		 * keep their text (board TS-03: "Your text and colours stay"). Only
		 * tokens they have not touched take the new template's sample.
		 */
		const merged = { ...initialSamples, ...samples };
		for (const [key, value] of Object.entries(sampleValues)) {
			if (touched.has(key) && value !== undefined) merged[key] = value;
		}
		sampleValues = merged;
		if (!silent) {
			analytics?.track?.('tool_editor_template_pick', {
				tool_name: toolName,
				template: template.key
			});
		}
	}

	/* ── URL → an instruction the visitor can see and edit ──────────────── */
	/**
	 * Writes the instruction rather than running something hidden.
	 *
	 * The point of putting it in the composer is that the visitor can read what
	 * we asked for, change it and run it again. A URL box that silently produced
	 * a card would give them no way to steer the second attempt.
	 */
	/**
	 * Run whatever the source block collected.
	 *
	 * When it carries a URL we read the page first and let the writer fold the
	 * branding in; otherwise the instruction the block already composed is what
	 * runs. Either way the sentence is in the composer where it can be edited.
	 */
	async function runSource({ kind, values, instruction: written }) {
		const target = String(values?.url || '').trim();
		if (!target) {
			instruction = written;
			await runAi();
			return;
		}
		await makeFromUrl(target, kind, values);
	}

	async function makeFromUrl(value, kind = sourceKind, values = {}) {
		const target = String(value || '').trim();
		if (!target || fetchingUrl || aiBusy) return;
		fetchingUrl = true;
		urlError = null;
		let info = null;
		try {
			info = await getWebsiteInfo(target);
		} catch {
			info = null;
		}
		fetchingUrl = false;

		if (!info) {
			// Still write an instruction from the URL alone: a page we could not
			// read is not a reason to leave the visitor with an empty composer.
			urlError = 'We could not read that page. Edit the instruction below and run it anyway.';
		}
		instruction = writeInstruction(kind, { ...values, url: target }, info);
		analytics?.track?.('tool_editor_url_prompt', {
			tool_name: toolName,
			resolved: Boolean(info)
		});
		await runAi();
	}

	async function runAi() {
		const text = instruction.trim();
		if (!text || aiBusy) return;
		if (aiLeft <= 0) return;
		aiBusy = true;
		aiError = null;
		aiStage = 'read';

		/*
		 * Streamed, so the visitor watches the agent work instead of a spinner.
		 * Twenty-plus seconds of nothing on a public page is where people leave,
		 * and it is the same progress the signed-in studio shows.
		 */
		await editGuestTemplate(
			{ html: $editor.html, instruction: text, width, height },
			{
				// Keep the last stage when a frame maps to nothing, rather than
				// snapping back to the start.
				onStage: (s) => (aiStage = stageFromAgentEvent(s) || aiStage),
				onDone: (res) => {
					if (!res?.html) {
						aiError = 'That change did not go through. Try describing it differently.';
						return;
					}
					editor.commit('ai edit', res.html, { source: 'ai' });
					receipt = res.receipt || null;
					// The SERVER's number, not a decrement of ours.
					if (typeof res.remaining === 'number') aiLeft = res.remaining;
					analytics?.track?.('tool_editor_ai_edit', { tool_name: toolName, remaining: aiLeft });
				},
				onError: (err) => {
					// A quota refusal arrives before the stream and carries its own
					// status; it swaps the composer for the signup card rather than
					// reading as a failure.
					if (err?.status === 429) {
						aiLeft = 0;
						aiError = err?.message || "You've used today's free AI edits.";
					} else {
						aiError = err?.message || 'That change did not go through.';
					}
				}
			}
		);
		aiBusy = false;
	}

	/* ── download ──────────────────────────────────────────────────────── */
	async function download() {
		if (rendering) return;
		rendering = true;
		try {
			/*
			 * Substituted before rendering. The visitor is looking at their sample
			 * values, and a download that came back with `{{name}}` printed on it
			 * would be a different thing from the one on screen.
			 */
			const source = substitute(stageApi?.serialize?.() || $editor.html, sampleValues);
			/*
			 * `fileExtension` is what makes this a PDF rather than a picture of
			 * one. The public image route takes it and runs the same engine — it
			 * is how the invoice tool has always produced PDFs, and it means the
			 * guest render counter covers them too.
			 */
			const { image } = await createImagePublic({
				html: source,
				width,
				height,
				fileExtension: format
			});
			if (!image?.url) {
				toast.set({ message: 'That render came back empty. Try again.', type: 'error', duration: 4000 });
				return;
			}
			await downloadFile(image.url, `${downloadName}.${format}`);
			analytics?.track?.('tool_editor_download', { tool_name: toolName, format });
		} catch (err) {
			if (err?.status === 429) {
				downloadsLeft = 0;
				toast.set({
					message: "You've used today's free downloads. Sign up to keep going.",
					type: 'error',
					duration: 5000
				});
			} else {
				toast.set({ message: 'Failed to generate image. Please try again.', type: 'error', duration: 4000 });
			}
		} finally {
			rendering = false;
			refreshQuota();
		}
	}

	/** `{{token}}` only, escaped — the same rule the stage preview uses. */
	const substitute = (source, values) =>
		String(source || '').replace(/\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g, (m, key) => {
			const value = values[key];
			if (value === null || value === undefined || value === '') return m;
			return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		});

	function save() {
		analytics?.track?.('tool_editor_save_click', { tool_name: toolName });
		// The draft id travels so the account it lands in gets THIS document.
		window.location.href = `/signup?intent=template-editor&draft=${encodeURIComponent(draftId || '')}`;
	}
</script>

<EmbeddedStudio
	{templates}
	{activeTemplate}
	{formats}
	{leftPanel}
	{opensIn}
	{defaultTab}
	{bulkLeadIn}
	thumbSourceWidth={width}
	thumbSourceHeight={height}
	bind:mode
	bind:panel
	{format}
	{downloadsLeft}
	{downloadsLimit}
	busy={rendering}
	canUndo={$editor.canUndo}
	canRedo={$editor.canRedo}
	on:pick={(e) => useTemplate(e.detail.template)}
	on:undo={() => editor.undo()}
	on:redo={() => editor.redo()}
	on:download={download}
	on:save={save}
	on:format={(e) => (format = e.detail.format)}
	on:expand={() => (window.location.hash = 'editor')}
>
	<svelte:fragment slot="code">
		<CodePane
			html={codeBuffer}
			busy={aiBusy}
			selectedLine={codeSelectedLine}
			variableCount={codeVariableCount}
			valid={codeValid}
			fileLabel="{downloadName}.html"
			on:change={onCodeChange}
			on:caret={onCodeCaret}
		/>
		{#if pasteLines.length}
			<div
				class="flex max-h-[184px] flex-col gap-2 overflow-auto border-t border-brand-rule bg-brand-paper p-3"
			>
				<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
					What we changed · {pasteLines.length}
				</p>
				{#each pasteLines as line (line.label)}
					<p class="flex items-start gap-2">
						<span
							class="mt-1 block h-2 w-2 flex-shrink-0 {line.tone === 'alarm'
								? 'bg-brand-alarm'
								: 'bg-brand-field'}"
							aria-hidden="true"
						/>
						<span class="min-w-0">
							<span class="block font-sans text-[12px] font-medium leading-4 text-brand-ink"
								>{line.label}</span
							>
							<span class="block font-sans text-[11.5px] leading-4 text-brand-slate"
								>{line.detail}</span
							>
						</span>
					</p>
				{/each}
			</div>
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="canvas">
		{#if aiBusy}
			<!--
				The same lock the studio uses: the design stays on screen underneath
				so the visitor can compare, and the stages say what is happening
				rather than that something is.
			-->
			<div class="absolute inset-0 z-20 flex items-center justify-center bg-brand-canvas/85">
				<AiLock stage={aiStage} fromRevision={1} />
			</div>
		{/if}
		{#if html}
			<StudioStage
				bind:api={stageApi}
				{html}
				{width}
				{height}
				editable={mode === 'design'}
				selectOnly={mode === 'code'}
				imagePolicy="any"
				{safeZone}

				{sampleValues}
				on:selection={(e) => (selection = e.detail || null)}
				on:transaction={(e) => editor.commit(e.detail.label, e.detail.html)}
			/>
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="url-band">
		<SourceBlock
			kind={sourceKind}
			busy={fetchingUrl || aiBusy}
			error={urlError}
			enabled={aiLeft > 0}
			on:make={(e) => runSource(e.detail)}
		/>
	</svelte:fragment>

	<svelte:fragment slot="say">
		<div class="flex flex-col gap-2 p-3">
			{#if receipt?.note}
				<div class="bg-brand-subtle p-2.5">
					<p class="font-mono text-[9.5px] uppercase tracking-[0.06em] text-brand-mute">
						You · written from the page · edit it
					</p>
					<p class="mt-1 font-sans text-[12.5px] leading-[17px] text-brand-ink">{receipt.note}</p>
				</div>
			{/if}
			<textarea
				bind:value={instruction}
				rows="3"
				disabled={aiBusy || aiLeft <= 0}
				placeholder="Describe a change…"
				class="w-full rounded-[5px] border border-brand-rule px-2.5 py-2 font-sans text-[13px] text-brand-ink placeholder:text-brand-mute disabled:bg-brand-subtle"
			/>
			{#if aiLeft > 0}
				<button
					type="button"
					on:click={runAi}
					disabled={!instruction.trim() || aiBusy}
					class="h-9 rounded-[5px] bg-brand-ink font-sans text-[13px] text-white disabled:opacity-40"
					>{aiBusy ? 'Working…' : 'Run it'}</button
				>
				<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
					{aiLeft} AI edit{aiLeft === 1 ? '' : 's'} left today · <a
						href="/signup?intent=template-editor"
						class="text-brand-royal underline">Sign up for more</a
					>
				</p>
			{:else}
				<!-- At zero the composer becomes the signup, and everything else on
				     the page keeps working. -->
				<div class="border border-brand-rule p-3">
					<p class="font-sans text-[13px] font-medium text-brand-ink">
						That's today's free AI edits.
					</p>
					<p class="mt-1 font-sans text-[12.5px] leading-[17px] text-brand-slate">
						You can still edit by hand and download. Sign up to keep describing changes.
					</p>
					<a
						href="/signup?intent=template-editor"
						class="mt-2 inline-flex h-9 items-center rounded-btn bg-brand-ink px-3.5 font-sans text-[13px] text-white"
						>Sign up free</a
					>
				</div>
			{/if}
			{#if aiError}
				<p class="flex items-start gap-1.5">
					<span class="mt-1 block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
					<span class="font-sans text-[12px] leading-[16px] text-brand-slate">{aiError}</span>
				</p>
			{/if}
		</div>
	</svelte:fragment>

	<svelte:fragment slot="selection">
		<SelectionRail
			{selection}
			variables={variables.map((v) => (typeof v === 'string' ? v : v.name))}
			on:style={(e) => stageApi?.setStyle(e.detail.id, e.detail.patch, e.detail.label)}
			on:text={(e) => stageApi?.setText(e.detail.id, e.detail.text)}
			on:lock={(e) => stageApi?.toggleLock(e.detail.id)}
			on:duplicate={() => stageApi?.duplicateSelected()}
			on:remove={() => stageApi?.removeSelected()}
		/>
	</svelte:fragment>

	<svelte:fragment slot="inputs">
		<div class="flex flex-col gap-3 p-3">
			<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
				{variables.length}
				{variables.length === 1 ? 'variable' : 'variables'}
			</p>
			{#each variables as v (v.name)}
				<label class="flex flex-col gap-1">
					<span class="flex items-center gap-2">
						<span class="font-mono text-[12px] text-brand-ink">{v.name}</span>
						<span
							class="rounded-btn border border-brand-rule px-1.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-brand-mute"
							>{v.type}</span
						>
					</span>
					<input
						type={v.type === 'color' ? 'color' : 'text'}
						value={sampleValues[v.name] ?? ''}
						on:input={(e) => setSample(v.name, e.currentTarget.value)}
						placeholder={v.type === 'image' ? 'https://…/logo.png' : 'Sample value'}
						class="h-8 rounded-btn border border-brand-rule px-2 font-sans text-[13px] text-brand-ink outline-none focus:border-brand-ink"
					/>
				</label>
			{:else}
				<p class="font-sans text-[13px] leading-[19px] text-brand-mute">
					No variables yet. Add <span class="font-mono">&#123;&#123;name&#125;&#125;</span> to the
					design and it appears here.
				</p>
			{/each}
			{#if variables.length}
				<p class="font-sans text-[12px] leading-[16px] text-brand-mute">
					Preview shows these values. They become the API contract when you save this as a
					template.
				</p>
			{/if}
		</div>
	</svelte:fragment>

	<svelte:fragment slot="signup">
		<a
			href="/signup?intent=template-editor"
			class="flex h-9 items-center rounded-btn bg-brand-ink px-4 font-sans text-[13px] font-semibold text-white shadow-[3px_3px_0_0_var(--brand-pink,#E61C80)]"
			>Sign up to keep downloading</a
		>
	</svelte:fragment>
</EmbeddedStudio>
