<script>
	/**
	 * One rendered artifact in the proof wall. Deliberately not a "card" — it is
	 * the render itself, sitting on the section ground with a catalogue label
	 * beneath. No border, no shadow.
	 */
	import { onDestroy } from 'svelte';
	import { inView } from '$lib/actions/inView.js';

	export let tile;
	/** 'tall' for the first wall row, 'short' for the second. */
	export let size = 'tall';

	// The last tile is the one still working. Its count climbs while it is on
	// screen, which is what turns the wall from a screenshot into a running job.
	// Parsed from the copy so the starting number stays owned by the tile data.
	let printed = Number(String(tile.title).replace(/[^0-9]/g, '')) || 0;
	let timer;

	function startTicking() {
		if (timer) return;
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
		timer = setInterval(() => {
			printed += 1 + Math.floor(printed % 3);
		}, 2600);
	}

	onDestroy(() => clearInterval(timer));

	$: heights =
		size === 'tall'
			? 'h-[128px] lg:h-[158px] 2xl:h-[190px]'
			: 'h-[96px] lg:h-[120px] 2xl:h-[146px]';
</script>

<!--
	Width comes from the wall row, which is sized off the viewport so it always
	bleeds past both page edges. min-w keeps the label pair from crushing.
-->
<div class="flex w-full min-w-[168px] flex-col gap-2 lg:min-w-[212px] lg:gap-2.5">
	<div
		class="relative flex flex-col rounded-tile p-[13px] lg:p-4 {heights} {tile.align ??
			'justify-end'} {tile.bg} {tile.ring ?? ''}"
		use:inView
		on:enter={tile.done ? startTicking : undefined}
	>
		{#if tile.done}
			<!--
				Marching ants. A dashed ring can't animate, so the working tile draws its
				own outline and runs the dash offset — the standard "in progress" read,
				and the only tile on the wall that has not finished.
			-->
			<svg class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
				<rect
					class="ants"
					x="1"
					y="1"
					width="calc(100% - 2px)"
					height="calc(100% - 2px)"
					rx="11"
					fill="none"
					stroke="#C9CBD1"
					stroke-width="2"
					stroke-dasharray="7 6"
				/>
			</svg>
		{/if}
		<span
			class="font-mono text-[8px] uppercase tracking-[0.14em] lg:text-[9px] {tile.labelClass}"
		>
			{tile.label}
		</span>
		<span
			class="font-display font-bold tracking-[-0.02em] {tile.titleClass} {tile.titleSize ??
				'text-[16px] leading-[1.05] lg:text-[19px]'}"
		>
			{#if tile.done}+{printed.toLocaleString('en-GB')}{:else}{tile.title}{/if}
		</span>
		{#if tile.rule}
			<span class="mt-1 h-0.5 w-7 {tile.rule}"></span>
		{/if}
		{#if tile.sub}
			<span class="mt-1 font-sans text-[11px] {tile.subClass}">{tile.sub}</span>
		{/if}
	</div>
	<div class="flex items-center justify-between">
		<span class="font-mono text-[10px] text-brand-mute lg:text-[11px]">{tile.row}</span>
		<span
			class="font-mono text-[10px] lg:text-[11px] {tile.done
				? 'text-brand-proof'
				: 'text-brand-ink'}"
		>
			{tile.format}
		</span>
	</div>
</div>

<style>
	.ants {
		animation: ants 1.4s linear infinite;
	}

	@keyframes ants {
		to {
			stroke-dashoffset: -26;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ants {
			animation: none;
		}
	}
</style>
