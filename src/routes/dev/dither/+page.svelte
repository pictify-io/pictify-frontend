<script>
	/**
	 * Dither shader picker — dev-only.
	 *
	 * Every candidate for the two shader placements, live, side by side, each
	 * labeled with its exact configuration. Pick by number ("band 3, hero 2").
	 * Needs a browser with WebGL2; each tile degrades to its plain ground.
	 */
	import DitherField from '$lib/components/DitherField.svelte';

	const bands = [
		{ n: 1, note: 'current', shape: 'wave', type: '4x4', pxSize: 4, speed: 0.35, front: '#D8F34A', ground: 'bg-white' },
		{ n: 2, note: 'finer, faster', shape: 'wave', type: '8x8', pxSize: 3, speed: 0.5, front: '#D8F34A', ground: 'bg-white' },
		{ n: 3, note: 'ripple', shape: 'ripple', type: '4x4', pxSize: 5, speed: 0.25, front: '#D8F34A', ground: 'bg-white' },
		{ n: 4, note: 'halftone dots', shape: 'dots', type: '2x2', pxSize: 6, speed: 0.3, front: '#D8F34A', ground: 'bg-white' },
		{ n: 5, note: 'simplex noise', shape: 'simplex', type: '4x4', pxSize: 4, speed: 0.4, front: '#D8F34A', ground: 'bg-white' },
		{ n: 6, note: 'swirl', shape: 'swirl', type: '4x4', pxSize: 5, speed: 0.2, front: '#D8F34A', ground: 'bg-white' },
		{ n: 7, note: 'ink on lime', shape: 'wave', type: '4x4', pxSize: 4, speed: 0.35, front: 'rgba(0,0,0,0.16)', ground: 'bg-brand-field' },
		{ n: 8, note: 'sphere sweep', shape: 'sphere', type: '8x8', pxSize: 4, speed: 0.3, front: '#D8F34A', ground: 'bg-white' }
	];

	const heroes = [
		{ n: 1, note: 'current', shape: 'simplex', type: '4x4', pxSize: 6, speed: 0.12, front: 'rgba(0,0,0,0.06)' },
		{ n: 2, note: 'coarser, darker', shape: 'simplex', type: '8x8', pxSize: 8, speed: 0.1, front: 'rgba(0,0,0,0.1)' },
		{ n: 3, note: 'warp', shape: 'warp', type: '4x4', pxSize: 6, speed: 0.15, front: 'rgba(0,0,0,0.08)' },
		{ n: 4, note: 'halftone dots', shape: 'dots', type: '4x4', pxSize: 8, speed: 0.1, front: 'rgba(0,0,0,0.08)' },
		{ n: 5, note: 'ripple', shape: 'ripple', type: '8x8', pxSize: 6, speed: 0.12, front: 'rgba(0,0,0,0.08)' },
		{ n: 6, note: 'slow swirl', shape: 'swirl', type: '4x4', pxSize: 8, speed: 0.08, front: 'rgba(0,0,0,0.08)' }
	];
</script>

<svelte:head>
	<title>Dither picker | dev</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex max-w-[1200px] flex-col gap-12 px-8 py-14">
	<div class="flex flex-col gap-2">
		<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-mute">Dev — shader picker</span>
		<h1 class="font-display text-[40px] font-extrabold tracking-[-0.03em] text-brand-ink">
			Pick the dither.
		</h1>
		<p class="max-w-[560px] font-sans text-[15px] leading-[22px] text-brand-slate">
			Live candidates for the two placements. Reply with the numbers — "band 3, hero 2" — and
			they get wired in. Anything can be mixed: any shape at any size, speed or ink.
		</p>
	</div>

	<section class="flex flex-col gap-5">
		<h2 class="font-display text-2xl font-bold tracking-[-0.03em] text-brand-ink">
			Generating screen — the band
		</h2>
		<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
			{#each bands as b (b.n)}
				<div class="flex flex-col gap-2">
					<div class="overflow-hidden rounded-tile border border-brand-rule {b.ground} p-4">
						<DitherField
							colorFront={b.front}
							shape={b.shape}
							type={b.type}
							pxSize={b.pxSize}
							speed={b.speed}
							class="relative h-12 w-full"
						/>
					</div>
					<span class="font-mono text-[11px] text-brand-mute">
						band {b.n} — {b.note} · {b.shape} · {b.type} · px {b.pxSize} · speed {b.speed}
					</span>
				</div>
			{/each}
		</div>
	</section>

	<section class="flex flex-col gap-5">
		<h2 class="font-display text-2xl font-bold tracking-[-0.03em] text-brand-ink">
			Hero — the breathing field
		</h2>
		<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
			{#each heroes as h (h.n)}
				<div class="flex flex-col gap-2">
					<div class="relative h-64 overflow-hidden rounded-tile bg-brand-field">
						<DitherField
							colorFront={h.front}
							shape={h.shape}
							type={h.type}
							pxSize={h.pxSize}
							speed={h.speed}
							class="absolute inset-0"
						/>
						<span class="absolute left-5 top-5 font-display text-[28px] font-extrabold tracking-[-0.03em] text-brand-ink">
							Templated media
						</span>
					</div>
					<span class="font-mono text-[11px] text-brand-mute">
						hero {h.n} — {h.note} · {h.shape} · {h.type} · px {h.pxSize} · speed {h.speed} · ink {h.front}
					</span>
				</div>
			{/each}
		</div>
	</section>
</div>
