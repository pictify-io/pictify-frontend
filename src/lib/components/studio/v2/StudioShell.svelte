<script>
	/**
	 * The three-column studio shell. B01-1 (board `FM8-0`).
	 *
	 * Built ALONGSIDE the existing TemplateStudio rather than replacing it. The
	 * handoff says "extend", but B06-3 requires the shipped platform studio and
	 * its AI path to keep working, and rewriting the component they both run on
	 * is the surest way to break one while testing the other. This shell mounts
	 * on the campaign-context route; /template-workspace keeps the studio it has
	 * until the new one has been through B06.
	 *
	 * Three modes, ONE stage (locked decision 1): Design edits the DOM, Preview
	 * data shows the same DOM with sample substitution and no editing, Rendered
	 * proof shows a server render of an exact revision. They are modes rather
	 * than panes because the buyer must never be comparing two different things
	 * and thinking they are the same thing.
	 */
	import { createEventDispatcher } from 'svelte';
	import StudioTopBarV2 from './StudioTopBarV2.svelte';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import CardPreview from '$lib/components/campaigns/CardPreview.svelte';
	import { saveState as saveStateOf } from './save-states.js';

	export let design = { name: 'Untitled design', html: '', width: 1200, height: 800, revision: 1 };
	export let format = 'PNG';
	export let saveState = 'saved';
	export let breadcrumb = null;
	export let campaignContext = false;
	export let useDisabled = true;
	/** `{ revision, url, at, stale }` — null until B05 wires proofs. */
	export let proof = null;

	/*
	 * History comes in as props rather than being read from the editor store
	 * here, because the shell is also used by surfaces that have no store — and
	 * a shell that reached for a singleton would work in the studio and break
	 * everywhere else.
	 */
	export let canUndo = false;
	export let canRedo = false;
	export let onUndo = null;
	export let onRedo = null;

	/** Versions opens from the revision label; the panel itself is a slot. */
	export let onRevisionClick = null;
	export let versionsOpen = false;
	export let statusNote = null;
	/** True when an approved edition is frozen against this design (S6). */
	export let editionApproved = false;

	const dispatch = createEventDispatcher();

	/** 1 / 2 / 3 select the modes (locked decision 1, keyboard map in B01-4). */
	const MODES = [
		{ key: 'design', label: 'Design' },
		{ key: 'preview', label: 'Preview data' },
		{ key: 'proof', label: 'Rendered proof' }
	];
	let mode = 'design';

	const LEFT_TABS = [
		{ key: 'say', label: 'Say it' },
		{ key: 'layers', label: 'Layers' }
	];
	const RIGHT_TABS = [
		{ key: 'selection', label: 'Selection' },
		{ key: 'inputs', label: 'Inputs' },
		{ key: 'brand', label: 'Brand' }
	];
	let leftTab = 'say';
	let rightTab = 'selection';

	let zoom = 'fit';
	const ZOOMS = ['fit', '50%', '100%'];

	/**
	 * B01-4 — the keyboard map.
	 *
	 * Typing is checked FIRST. A description containing "1" must not change the
	 * mode mid-sentence, and an editor whose shortcuts fire inside its own text
	 * fields is worse than one with no shortcuts at all.
	 */
	function onKey(event) {
		if (event.target instanceof HTMLElement) {
			const tag = event.target.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) {
				// Escape still works while typing: it is how you get out.
				if (event.key === 'Escape') event.target.blur();
				return;
			}
		}
		if (event.metaKey || event.ctrlKey || event.altKey) return;

		// The popover is the innermost layer, so Escape closes it before it means
		// anything else — otherwise Escape would deselect on the stage behind a
		// panel the buyer is looking at.
		if (event.key === 'Escape' && versionsOpen) {
			onRevisionClick?.();
			event.preventDefault();
			return;
		}

		const index = ['1', '2', '3'].indexOf(event.key);
		if (index >= 0) {
			mode = MODES[index].key;
			event.preventDefault();
			return;
		}
		if (event.key === 'Escape') {
			dispatch('deselect');
			event.preventDefault();
		}
	}

	/**
	 * B01-4 — live-region announcements.
	 *
	 * Mode, save state and stale-proof changes are all conveyed visually by a
	 * chip or an underline moving. A screen reader user gets none of that, and
	 * on a screen whose whole job is "are you sure about what you are about to
	 * send", silently changing what the stage is showing is not acceptable.
	 *
	 * `polite` rather than `assertive`: these interrupt nothing urgent, and an
	 * assertive region would talk over the buyer mid-instruction.
	 */
	let announcement = '';
	let announceTimer;
	function announce(message) {
		clearTimeout(announceTimer);
		// Re-announce an identical message by clearing first; some readers skip
		// a region whose text has not changed.
		announcement = '';
		announceTimer = setTimeout(() => (announcement = message), 60);
	}

	const MODE_LABEL = {
		design: 'Design mode. The canvas is editable.',
		preview: 'Preview data mode. Sample values shown, editing is off.',
		proof: 'Rendered proof mode. Showing a server render.'
	};
	let lastMode = mode;
	$: if (mode !== lastMode) {
		lastMode = mode;
		announce(MODE_LABEL[mode]);
	}

	let lastSaveState = saveState;
	$: if (saveState !== lastSaveState) {
		lastSaveState = saveState;
		announce(saveStateOf(saveState).label);
	}

	/**
	 * A proof of an older revision is STALE, not current. Saying so on the
	 * status line rather than only in the proof tab means a buyer editing in
	 * Design mode still knows the render they last looked at no longer matches.
	 */
	$: proofStale = Boolean(proof && proof.revision !== design.revision);
</script>

<svelte:window on:keydown={onKey} />

<div class="relative flex h-screen flex-col overflow-hidden bg-brand-canvas">
	<!-- Visually hidden, deliberately not `hidden`: a hidden region is not read. -->
	<p aria-live="polite" class="sr-only">{announcement}</p>

	<StudioTopBarV2
		designName={design.name}
		{breadcrumb}
		revision={design.revision}
		{saveState}
		{format}
		width={design.width}
		height={design.height}
		{canUndo}
		{canRedo}
		onUndo={() => onUndo?.()}
		onRedo={() => onRedo?.()}
		{onRevisionClick}
		{versionsOpen}
		onUseThisDesign={campaignContext ? () => dispatch('use') : null}
		{useDisabled}
		onBack={() => dispatch('back')}
		onPreview={() => (mode = 'preview')}
	/>

	{#if versionsOpen}
		<!--
			A click anywhere else closes it. Rendered before the panel and behind
			it, so the panel's own buttons are never intercepted by the catcher.
			Not focusable and not announced: Escape is the keyboard equivalent, so
			this exists only for the pointer. It starts BELOW the top bar so the
			revision label that opened the panel is still clickable — a trigger
			covered by its own dismiss layer cannot be pressed a second time.
		-->
		<div
			class="absolute inset-x-0 bottom-0 top-[54px] z-20"
			role="presentation"
			on:click={() => onRevisionClick?.()}
		/>
		<div class="absolute left-4 top-[54px] z-30 shadow-[4px_4px_0_0_rgba(0,0,0,0.08)]">
			<slot name="versions" />
		</div>
	{/if}

	{#if editionApproved}
		<!--
			S6. The buyer is editing a design an approved edition is already
			frozen against. Saying so BEFORE they change anything is the whole
			point: after the fact it is an explanation, before it is a choice.
		-->
		<div
			class="flex flex-wrap items-center gap-2.5 border-b border-brand-rule bg-brand-field px-4 py-2.5"
		>
			<span class="block h-2 w-2 flex-shrink-0 bg-brand-ink" aria-hidden="true" />
			<p class="font-sans text-[13px] text-brand-ink">
				This design is used by an approved edition. Saving a change starts a new revision, and that
				edition’s approval no longer applies — it has to be approved again before it can generate.
			</p>
		</div>
	{/if}

	<div class="flex min-h-0 flex-1 gap-4 p-4">
		<!-- LEFT: Say it | Layers -->
		<aside
			class="hidden w-[280px] flex-shrink-0 flex-col rounded-md border border-brand-rule bg-brand-paper lg:flex"
		>
			<div class="flex flex-shrink-0 gap-1.5 border-b border-brand-rule p-3">
				{#each LEFT_TABS as tab (tab.key)}
					<button
						type="button"
						on:click={() => (leftTab = tab.key)}
						class="h-8 rounded-[5px] px-3 font-mono text-[10.5px] uppercase tracking-[0.06em] {leftTab ===
						tab.key
							? 'bg-brand-field font-semibold text-brand-ink'
							: 'border border-brand-rule text-brand-slate'}"
						aria-pressed={leftTab === tab.key}>{tab.label}</button
					>
				{/each}
			</div>
			<div class="min-h-0 flex-1 overflow-y-auto p-3.5">
				<slot name="left" {leftTab}>
					<p class="font-sans text-[13.5px] text-brand-slate">
						Describe a change. It starts from what you see now.
					</p>
				</slot>
			</div>
			<div class="flex-shrink-0 border-t border-brand-rule p-3.5">
				<slot name="composer" />
				<!-- Said where the instruction is typed, because that is where a
				     buyer would otherwise paste a customer row to "show" the AI. -->
				<p class="mt-2 font-sans text-[12px] text-brand-mute">
					Uses sample values only. Don’t paste customer data.
				</p>
			</div>
		</aside>

		<!-- CENTRE: one stage, three modes -->
		<main class="flex min-w-0 flex-1 flex-col rounded-md border border-brand-rule bg-brand-paper">
			<div class="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-brand-rule p-3">
				<span class="flex items-center rounded-btn border border-brand-rule p-0.5">
					{#each MODES as m (m.key)}
						<button
							type="button"
							on:click={() => (mode = m.key)}
							class="h-8 rounded-[5px] px-3 font-sans text-[13px] {mode === m.key
								? 'bg-brand-ink font-semibold text-white'
								: 'text-brand-slate'}"
							aria-pressed={mode === m.key}>{m.label}</button
						>
					{/each}
				</span>

				<!--
					The add-element tools belong to Design mode and nothing else. In
					Preview and Proof the row carries that mode's own controls instead
					of four disabled buttons, which read as broken rather than as
					out of scope.
				-->
				<span class="flex flex-1 items-center gap-2">
					{#if mode === 'design'}
						{#each ['Text', 'Image', 'Shape', 'Field'] as tool (tool)}
							<button
								type="button"
								on:click={() => dispatch('add', { kind: tool.toLowerCase() })}
								class="h-8 rounded-btn border border-brand-rule px-2.5 font-sans text-[13px] text-brand-slate"
								>+ {tool}</button
							>
						{/each}
					{:else}
						<slot name="toolbar" {mode} />
					{/if}
				</span>

				<span class="flex items-center rounded-btn border border-brand-rule p-0.5">
					{#each ZOOMS as z (z)}
						<button
							type="button"
							on:click={() => (zoom = z)}
							class="h-8 rounded-[5px] px-2.5 font-mono text-[11px] uppercase {zoom === z
								? 'bg-brand-subtle font-semibold text-brand-ink'
								: 'text-brand-slate'}"
							aria-pressed={zoom === z}>{z}</button
						>
					{/each}
				</span>
			</div>

			<!-- `relative` so the AI lock can cover the stage and nothing else. -->
			<div
				class="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-brand-canvas p-8"
			>
				<slot name="stage" {mode} {zoom}>
					{#if mode === 'proof'}
						{#if proof?.url}
							<img
								src={proof.url}
								alt="Rendered proof of revision {proof.revision}"
								class="max-w-full"
							/>
						{:else}
							<p class="font-sans text-[13.5px] text-brand-mute">
								No proof yet. Render one to see exactly what the server produces.
							</p>
						{/if}
					{:else}
						<!-- Design and Preview share the stage; only substitution differs. -->
						<CardPreview
							html={design.html}
							width={design.width}
							height={design.height}
							displayWidth={Math.min(600, design.width)}
							values={mode === 'design' ? {} : undefined}
						/>
					{/if}
				</slot>
			</div>

			<div
				class="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-t border-brand-rule px-3.5 py-2.5"
			>
				<span>
					{#if proofStale}
						<!--
							Both numbers, because "re-proof after your next save" was wrong
							whenever the design was already saved — which is the usual way
							a proof goes stale.
						-->
						<StatusSquare
							tone="blocked"
							label={`Proof is rev ${proof.revision} · design is rev ${design.revision} · re-proof before you use this design`}
						/>
					{:else if statusNote}
						<StatusSquare tone="current" label={statusNote} />
					{:else}
						<span class="font-sans text-[13px] text-brand-mute">Ready</span>
					{/if}
				</span>
				<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute">
					{zoom} · {design.width} × {design.height}
				</span>
			</div>
		</main>

		<!-- RIGHT: Selection | Inputs | Brand -->
		<aside
			class="hidden w-[300px] flex-shrink-0 flex-col rounded-md border border-brand-rule bg-brand-paper xl:flex"
		>
			<div class="flex flex-shrink-0 gap-1.5 border-b border-brand-rule p-3">
				{#each RIGHT_TABS as tab (tab.key)}
					<button
						type="button"
						on:click={() => (rightTab = tab.key)}
						class="h-8 rounded-[5px] px-2.5 font-mono text-[10.5px] uppercase tracking-[0.06em] {rightTab ===
						tab.key
							? 'bg-brand-field font-semibold text-brand-ink'
							: 'border border-brand-rule text-brand-slate'}"
						aria-pressed={rightTab === tab.key}>{tab.label}</button
					>
				{/each}
			</div>
			<div class="min-h-0 flex-1 overflow-y-auto p-3.5">
				<slot name="right" {rightTab}>
					<!-- Nothing selected → the document, then Brand (locked decision 3). -->
					<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">Document</p>
					<dl class="mt-2 border-t border-brand-rule">
						{#each [['Size', `${design.width} × ${design.height}`], ['Format', format], ['Revision', `rev ${design.revision}`]] as [label, value] (label)}
							<div
								class="flex items-baseline justify-between gap-3 border-b border-brand-rule py-2"
							>
								<dt class="font-sans text-[13px] text-brand-slate">{label}</dt>
								<dd class="font-mono text-[11.5px] text-brand-ink">{value}</dd>
							</div>
						{/each}
					</dl>
					<p class="mt-4 font-sans text-[13px] text-brand-mute">
						Select something on the canvas to edit it, or use the tools above the stage.
					</p>
				</slot>
			</div>
		</aside>
	</div>
</div>
