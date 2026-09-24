<script>
	/**
	 * The "New template" menu. Board CF-01 (Paper, page 04 · row 04·E).
	 *
	 * Image and video are different engines with different editors, so the
	 * choice comes before an editor opens. Rows are grouped by what comes out,
	 * each a shape glyph + title + one line; the cost is shown on the only row
	 * that spends credits.
	 *
	 * Dispatches `choose` with one of: 'html' | 'video_prompt' | 'video_manual'.
	 */
	import { createEventDispatcher } from 'svelte';

	export let atCap = false;

	const dispatch = createEventDispatcher();

	let open = false;
	let rootEl;

	function toggle() {
		if (atCap) {
			// At the cap every option ends in the same upgrade prompt, so the
			// menu would only be a detour.
			dispatch('choose', 'html');
			return;
		}
		open = !open;
	}

	function choose(kind) {
		open = false;
		dispatch('choose', kind);
	}

	function onWindowClick(event) {
		if (open && rootEl && !rootEl.contains(event.target)) open = false;
	}

	const ROW =
		'flex w-full items-center gap-3.5 px-4 py-2.5 text-left hover:bg-brand-subtle focus:bg-brand-subtle focus:outline-none';
	const GROUP = 'px-4 pb-1.5 pt-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute';
</script>

<svelte:window on:click={onWindowClick} on:keydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="relative" bind:this={rootEl}>
	{#if atCap}
		<button
			type="button"
			on:click={toggle}
			class="flex items-center gap-2 rounded-btn border-[1.5px] border-brand-rule px-[18px] py-2.5 opacity-75 hover:opacity-100"
			title="Template limit reached"
		>
			<span class="block h-2 w-2 border-[1.5px] border-brand-slate" aria-hidden="true"></span>
			<span class="font-sans text-[13.5px] font-semibold text-brand-slate">New template</span>
		</button>
	{:else}
		<button
			type="button"
			on:click={toggle}
			aria-haspopup="menu"
			aria-expanded={open}
			class="flex items-center gap-2.5 rounded-btn bg-brand-ink px-[18px] py-2.5 font-sans text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 {open
				? 'outline outline-[3px] outline-offset-2 outline-brand-field'
				: ''}"
		>
			New template
			<svg
				width="10"
				height="10"
				viewBox="0 0 10 10"
				fill="none"
				aria-hidden="true"
				class="transition-transform {open ? '' : 'rotate-180'}"
			>
				<path
					d="M2 6.5 L5 3.5 L8 6.5"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	{/if}

	{#if open}
		<div
			role="menu"
			class="absolute right-0 top-full z-30 mt-3 flex w-[408px] max-w-[calc(100vw-32px)] flex-col rounded-[10px] border-[1.5px] border-brand-ink bg-white py-1.5 shadow-[5px_5px_0_theme(colors.brand.field)]"
		>
			<span class={GROUP}>Image · PDF</span>
			<button type="button" role="menuitem" class={ROW} on:click={() => choose('html')}>
				<span class="relative block h-10 w-10 flex-shrink-0" aria-hidden="true">
					<span
						class="absolute left-[18px] top-0.5 block h-7 w-5 rounded-[2px] border-[1.5px] border-brand-mute bg-white"
					></span>
					<span
						class="absolute left-0.5 top-3.5 block h-5 w-[30px] rounded-[2px] border-[1.5px] border-brand-ink bg-brand-powder"
					></span>
				</span>
				<span class="flex min-w-0 flex-1 flex-col gap-0.5">
					<span class="font-sans text-[14px] font-semibold text-brand-ink">Image or PDF</span>
					<span class="font-sans text-[12.5px] leading-4 text-brand-slate"
						>HTML with &#123;&#123;inputs&#125;&#125; · PNG, JPG, PDF</span
					>
				</span>
				<span class="w-[76px] flex-shrink-0"></span>
			</button>

			<div class="mt-1.5 border-t border-brand-rule">
				<span class="block {GROUP} pt-3">Video · MP4</span>
				<button type="button" role="menuitem" class={ROW} on:click={() => choose('video_prompt')}>
					<span class="relative block h-10 w-10 flex-shrink-0" aria-hidden="true">
						<span
							class="absolute left-2.5 top-0.5 block h-[34px] w-5 rounded-[3px] border-[1.5px] border-brand-ink bg-brand-press"
						></span>
						<span class="absolute left-[26px] top-0 block h-2.5 w-2.5 rotate-45 bg-brand-pink"></span>
					</span>
					<span class="flex min-w-0 flex-1 flex-col gap-0.5">
						<span class="font-sans text-[14px] font-semibold text-brand-ink">Describe it</span>
						<span class="font-sans text-[12.5px] leading-4 text-brand-slate"
							>AI builds the scene. Refine by prompt.</span
						>
					</span>
					<span class="flex w-[76px] flex-shrink-0 justify-end">
						<span
							class="rounded-[3px] bg-brand-rose px-1.5 py-[3px] font-mono text-[9.5px] tracking-[0.06em] text-brand-ink"
							>5 CREDITS</span
						>
					</span>
				</button>
				<button type="button" role="menuitem" class={ROW} on:click={() => choose('video_manual')}>
					<span
						class="flex h-10 w-10 flex-shrink-0 flex-col justify-center gap-1 px-[3px]"
						aria-hidden="true"
					>
						<span class="block h-[7px] w-[26px] rounded-[2px] border-[1.5px] border-brand-ink bg-brand-rose"
						></span>
						<span class="block h-[7px] w-[34px] rounded-[2px] border-[1.5px] border-brand-ink bg-brand-sky"
						></span>
						<span class="block h-[7px] w-[18px] rounded-[2px] border-[1.5px] border-brand-ink bg-brand-field"
						></span>
					</span>
					<span class="flex min-w-0 flex-1 flex-col gap-0.5">
						<span class="font-sans text-[14px] font-semibold text-brand-ink">Build it by hand</span>
						<span class="font-sans text-[12.5px] leading-4 text-brand-slate"
							>Text, media and shapes on a timeline</span
						>
					</span>
					<span class="w-[76px] flex-shrink-0"></span>
				</button>
			</div>
		</div>
	{/if}
</div>
