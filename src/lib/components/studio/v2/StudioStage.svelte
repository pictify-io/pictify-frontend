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

	export let html = '';
	export let width = 1200;
	export let height = 800;
	export let zoom = 'fit';
	/** Read-only in Preview data and Rendered proof. */
	export let editable = true;
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
	let selection = null;
	let status = null;
	let containerWidth = 0;
	let lastHtml = null;

	$: scale =
		zoom === '50%'
			? 0.5
			: zoom === '100%'
			? 1
			: containerWidth
			? Math.min(1, containerWidth / width)
			: 0.5;

	/**
	 * Rebuild the frame only when the html actually changes, and never while the
	 * buyer is mid-gesture — reloading the document under a drag loses both the
	 * selection and the gesture.
	 */
	$: if (frame && html !== lastHtml) {
		lastHtml = html;
		mount(html);
	}

	async function mount(source) {
		if (stage) {
			stage.destroy();
			stage = null;
		}
		const doc = frame.contentDocument;
		const substituted = editable ? source : substitute(source, sampleValues);
		doc.open();
		doc.write(
			`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}</style></head><body>${cleanHtml(
				substituted
			)}</body></html>`
		);
		doc.close();

		if (!editable) return;
		try {
			stage = await attachStage(frame, {
				width,
				height,
				onTransaction: (label, next) => dispatch('transaction', { label, html: next }),
				onSelection: (s) => {
					selection = s?.count ? s : null;
					dispatch('selection', s);
				},
				onStatus: (message) => (status = message)
			});
			api = stage;
			dispatch('ready');
		} catch (err) {
			api = null;
			status = 'The stage could not start. Reload to try again.';
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
		<iframe
			bind:this={frame}
			title="Design stage"
			class="absolute left-0 top-0 origin-top-left border-0"
			style="width:{width}px;height:{height}px;transform:scale({scale})"
		/>
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
