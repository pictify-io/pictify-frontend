<script>
	/**
	 * Studio top bar (board `FM8-0`, S1 save states).
	 *
	 * Carries the one fact every other surface in campaigns also names: the
	 * REVISION. Setup, Review and the proof caption all say "rev n", and they
	 * have to agree, so the number is displayed from server state and never
	 * incremented locally in anticipation of a save.
	 */
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import { saveState as saveStateOf } from './save-states.js';

	export let designName = 'Untitled design';
	export let breadcrumb = null;
	export let revision = 1;
	/** 'saved' | 'saving' | 'unsaved' | 'offline' | 'conflict' | 'ai' */
	export let saveState = 'saved';
	export let format = 'PNG';
	export let width = 1200;
	export let height = 800;
	/**
	 * Opens the Versions panel. The revision label IS the affordance — there is
	 * no second button — because the number is what a buyer is looking at when
	 * the question "what changed?" occurs to them.
	 */
	export let onRevisionClick = null;
	export let versionsOpen = false;

	export let canUndo = false;
	export let canRedo = false;
	/** Campaign context only. Null on the standalone route. */
	export let onUseThisDesign = null;
	export let useDisabled = false;
	export let onBack = null;
	export let onUndo = null;
	export let onRedo = null;
	export let onPreview = null;

	$: state = saveStateOf(saveState);
</script>

<header
	class="flex flex-wrap items-center gap-4 border-b border-brand-rule bg-brand-paper px-4 py-3"
>
	<button
		type="button"
		on:click={onBack}
		class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-btn border border-brand-rule text-brand-slate"
		aria-label="Back">‹</button
	>

	<div class="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
		{#if breadcrumb}
			<span class="truncate font-sans text-[13.5px] text-brand-mute">{breadcrumb}</span>
			<span class="font-sans text-[13.5px] text-brand-mute" aria-hidden="true">/</span>
		{/if}
		<span class="truncate font-sans text-[16px] font-bold text-brand-ink">{designName}</span>
		<span class="flex flex-shrink-0 items-center gap-2">
			<StatusSquare tone={state.tone} label={state.label} />
			{#if onRevisionClick}
				<button
					type="button"
					on:click={onRevisionClick}
					aria-expanded={versionsOpen}
					class="rounded-btn font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute underline-offset-2 hover:text-brand-ink hover:underline"
					>· Rev {revision}</button
				>
			{:else}
				<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute"
					>· Rev {revision}</span
				>
			{/if}
		</span>
	</div>

	<div class="flex flex-shrink-0 items-center gap-3">
		<span class="flex items-center rounded-btn border border-brand-rule">
			<button
				type="button"
				on:click={onUndo}
				disabled={!canUndo}
				class="h-8 w-9 font-sans text-[14px] text-brand-slate disabled:text-brand-rule"
				aria-label="Undo">↰</button
			>
			<span class="h-5 w-px bg-brand-rule" aria-hidden="true" />
			<button
				type="button"
				on:click={onRedo}
				disabled={!canRedo}
				class="h-8 w-9 font-sans text-[14px] text-brand-slate disabled:text-brand-rule"
				aria-label="Redo">↱</button
			>
		</span>

		<span
			class="rounded-btn border border-brand-rule px-2.5 py-1.5 font-mono text-[11px] text-brand-slate"
			>{format} · {width} × {height}</span
		>

		<button
			type="button"
			on:click={onPreview}
			class="flex h-9 items-center rounded-btn border border-brand-rule px-3.5 font-sans text-[13.5px] text-brand-slate"
			>Preview</button
		>

		{#if onUseThisDesign}
			<!-- The one plum primary on this screen. Disabled shows a rule square
			     rather than opacity, so "cannot yet" is legible rather than faint. -->
			<button
				type="button"
				on:click={onUseThisDesign}
				disabled={useDisabled}
				class="flex h-9 items-center gap-2.5 rounded-btn px-4 font-sans text-[13.5px] {useDisabled
					? 'cursor-not-allowed bg-brand-subtle text-brand-mute'
					: 'bg-brand-plum text-white'}"
			>
				Use this design
				<span
					class="block h-2 w-2 {useDisabled ? 'bg-brand-rule' : 'bg-brand-field'}"
					aria-hidden="true"
				/>
			</button>
		{/if}
	</div>
</header>
