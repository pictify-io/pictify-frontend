<script>
	/**
	 * Video studio topbar — the same object as the image studio's StudioTopBar,
	 * so moving between the two surfaces does not feel like moving between two
	 * products. Identity on the left, what-you-get and the one commitment on
	 * the right.
	 *
	 * Deliberately NOT here: undo/redo (they live on the timeline toolbar, next
	 * to the thing they undo), an inputs button (inputs are a rail, always
	 * visible), and a separate export button (Render is the render surface;
	 * browser export is an option inside it, not a competing verb).
	 */
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let name = 'Untitled video';
	/** 'timeline' | 'tsx' */
	export let kind = 'timeline';
	/** 'saved' | 'saving' | 'dirty' | 'error' */
	export let saveState = 'saved';
	export let width = 1080;
	export let height = 1920;
	export let fps = 30;
	export let durationInFrames = 150;
	export let format = 'mp4';
	export let rendering = false;
	export let renderDisabled = false;
	export let backHref = '/dashboard/template?type=video';

	let renaming = false;
	let draftName = name;

	// Kind is permanent — a timeline scene and a Remotion composition are
	// different documents, not two views of one. The chip states which you are
	// in; it is not a toggle.
	$: kindLabel = kind === 'tsx' ? 'CODE' : 'TIMELINE';
	$: kindTint = kind === 'tsx' ? 'bg-brand-rose' : 'bg-brand-sky';

	$: seconds = fps > 0 ? durationInFrames / fps : 0;
	$: duration = `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
	$: meta = `${format.toUpperCase()} · ${width}×${height} · ${duration} · ${Math.round(fps)} FPS`;

	/*
	 * The chip is the truth about the SERVER, not about intent. Autosave makes
	 * that distinction load-bearing: with no Save button this is the only thing
	 * telling the user their work exists somewhere other than this tab, so a
	 * failure has to say it failed and say what happens next.
	 */
	$: saveLabel =
		saveState === 'failed'
			? "COULDN'T SAVE"
			: saveState === 'error'
				? "COULDN'T SAVE — RETRYING"
			: saveState === 'saving'
				? 'SAVING…'
				: saveState === 'dirty'
					? 'UNSAVED'
					: 'SAVED';

	function commitName() {
		renaming = false;
		const next = draftName.trim();
		if (next && next !== name) dispatch('rename', { name: next });
		else draftName = name;
	}
</script>

<header class="flex flex-shrink-0 items-center gap-3 bg-brand-canvas px-5 py-3">
	<a
		href={backHref}
		aria-label="Back to templates"
		class="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg border border-brand-rule bg-brand-paper text-brand-slate hover:border-brand-ink hover:text-brand-ink"
	>
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</a>

	{#if renaming}
		<input
			bind:value={draftName}
			on:blur={commitName}
			on:keydown={(e) => {
				if (e.key === 'Enter') commitName();
				if (e.key === 'Escape') {
					draftName = name;
					renaming = false;
				}
			}}
			class="min-w-0 flex-shrink rounded-btn border-[1.5px] border-brand-ink bg-brand-paper px-2 py-1 font-display text-[17px] font-bold text-brand-ink outline-none"
		/>
	{:else}
		<button
			type="button"
			on:click={() => {
				draftName = name;
				renaming = true;
			}}
			class="min-w-0 truncate font-display text-[17px] font-bold text-brand-ink hover:underline"
			title="Rename"
		>
			{name}
		</button>
	{/if}

	<span
		class="flex-shrink-0 rounded-btn border border-brand-ink px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] text-brand-ink {kindTint}"
	>
		{kindLabel}
	</span>

	<span class="flex flex-shrink-0 items-center gap-1.5">
		<span
			class="block h-[7px] w-[7px] {saveState === 'error' || saveState === 'failed'
				? 'bg-brand-alarm'
				: saveState === 'saving'
					? 'animate-pulse bg-brand-field'
					: saveState === 'dirty'
						? 'bg-brand-mute'
						: 'bg-brand-proof'}"
			aria-hidden="true"
		></span>
		<span class="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">{saveLabel}</span>
	</span>

	<span class="flex-1"></span>

	<span class="flex-shrink-0 rounded-btn border border-brand-rule bg-brand-paper px-3 py-1.5 font-mono text-[11px] tracking-[0.04em] text-brand-slate">
		{meta}
	</span>

	<button
		type="button"
		on:click={() => dispatch('render')}
		disabled={rendering || renderDisabled}
		class="flex flex-shrink-0 items-center gap-2 rounded-btn bg-brand-press px-4 py-2 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
	>
		{rendering ? 'Rendering…' : 'Render'}
		<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
	</button>
</header>
