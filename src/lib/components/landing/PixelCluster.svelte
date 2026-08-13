<script>
	/**
	 * Decorative pixel cluster. The page's signature motif: raster squares that
	 * read as an image resolving. Always positioned to be cut by a section edge —
	 * the clipping is the point, so the field reads as a window onto something
	 * larger rather than a bounded box.
	 *
	 * Colours come from the decorative-fill tokens only. These are never
	 * interactive surfaces.
	 */
	import { onMount } from 'svelte';
	import { inView } from '$lib/actions/inView.js';

	/** Cell size in px. */
	export let cell = 20;
	/**
	 * Grid occupancy. Each entry is [col, row, fill] where fill is a token key.
	 * @type {Array<[number, number, string]>}
	 */
	export let cells = [];
	/**
	 * Which corner or edge the raster resolves from. Point this at the edge the
	 * cluster bleeds off, so the sweep runs inward, with the page.
	 * @type {'w' | 'e' | 'nw' | 'ne' | 'sw' | 'se'}
	 */
	export let origin = 'w';
	/** Set false for clusters that should never animate. */
	export let animate = true;
	/**
	 * Idle re-render: one cell in every `cycle` keeps working after the reveal,
	 * blinking through other colours from this cluster's own palette.
	 *
	 * Off by default, and opt-in at exactly one cluster per section. Every
	 * cluster cycling at once competes with itself — one live field per band
	 * reads as the render still working; six reads as a fault.
	 */
	export let cycle = 0;
	/** Extra classes — position the cluster with these. */
	let className = '';
	export { className as class };

	const fills = {
		blue: 'var(--pc-blue)',
		powder: 'var(--pc-powder)',
		pink: 'var(--pc-pink)',
		sky: 'var(--pc-sky)',
		field: 'var(--pc-field)',
		ink: 'var(--pc-ink)'
	};

	/**
	 * Head start before the sweep begins. The hero's clusters fire on load, so
	 * without this they finish before the page has finished painting and the
	 * whole move is missed.
	 */
	export let delay = 0;

	const STEP = 55;
	const MAX_DELAY = 1100;

	// Deterministic offset so the sweep reads as a raster resolving rather than a
	// clean diagonal wipe. Must not be random: SSR and hydration have to agree.
	const jitter = (col, row) => (((col * 73 + row * 149) % 7) / 7) * 34;

	$: cols = cells.length ? Math.max(...cells.map(([c]) => c)) + 1 : 0;
	$: rows = cells.length ? Math.max(...cells.map(([, r]) => r)) + 1 : 0;

	$: distance = (col, row) => {
		switch (origin) {
			case 'e':
				return cols - 1 - col;
			case 'nw':
				return col + row;
			case 'ne':
				return cols - 1 - col + row;
			case 'sw':
				return col + (rows - 1 - row);
			case 'se':
				return cols - 1 - col + (rows - 1 - row);
			default:
				return col;
		}
	};

	$: delayOf = (col, row) =>
		Math.round(delay + Math.min(distance(col, row) * STEP + jitter(col, row), MAX_DELAY));

	// The colours a cycling cell blinks through are taken from this cluster's own
	// palette, so an alternate can never clash with the section it sits on — a
	// lime cell on the lime hero would simply vanish.
	$: palette = [...new Set(cells.map(([, , f]) => f))];

	$: altOf = (base, i, k) => {
		if (palette.length < 2) return fills[base] ?? fills.blue;
		let idx = (i + k) % palette.length;
		for (let n = 0; n < palette.length && palette[idx] === base; n++) {
			idx = (idx + 1) % palette.length;
		}
		return fills[palette[idx]] ?? fills[base];
	};

	// Duration and start offset both vary per cell. Without that the whole page
	// blinks on one beat, which reads as a glitch rather than as work happening.
	const cycleDur = (i) => 5200 + (i % 5) * 940;
	$: cycleStart = (col, row, i) => delayOf(col, row) + 800 + ((i * 1330) % 5600);

	// Armed on the client only, so server-rendered markup and no-JS both show the
	// finished cluster rather than an empty box.
	let armed = false;
	let revealed = false;
	onMount(() => {
		if (!animate) return;
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
		armed = true;
	});
</script>

<svg
	class="pointer-events-none absolute {className}"
	class:armed
	class:revealed
	width={cols * cell}
	height={rows * cell}
	viewBox="0 0 {cols * cell} {rows * cell}"
	fill="none"
	aria-hidden="true"
	use:inView={{ rootMargin: '10000px 0px 0px 0px' }}
	on:enter={() => (revealed = true)}
	style="--pc-blue:#0078BF; --pc-powder:#D3E7F6; --pc-pink:#FF48B0; --pc-sky:#A9D7F2; --pc-field:#D8F34A; --pc-ink:#000000;"
>
	{#each cells as [col, row, fill], i (i)}
		<rect
			x={col * cell}
			y={row * cell}
			width={cell}
			height={cell}
			fill={fills[fill] ?? fills.blue}
			fill-opacity={fill.endsWith('-soft') ? 0.5 : 1}
			style="--d:{delayOf(col, row)}ms; --cd:{cycleStart(col, row, i)}ms; --cdur:{cycleDur(
				i
			)}ms; --c0:{fills[fill] ?? fills.blue}; --c1:{altOf(fill, i, 1)}; --c2:{altOf(fill, i, 2)}"
			data-cycle={cycle > 0 && i % cycle === cycle - 1 ? '' : undefined}
		/>
	{/each}
</svg>

<style>
	rect {
		/* Scale from each square's own centre, not the SVG's origin. */
		transform-box: fill-box;
		transform-origin: center;
	}

	.armed rect {
		opacity: 0;
	}

	/*
	 * `scale` rather than `transform`, so nothing here can clobber a transform
	 * set on the same element from a utility class.
	 */
	.armed.revealed rect {
		animation: cell-in 520ms cubic-bezier(0.16, 1, 0.3, 1) var(--d) both;
	}

	/*
	 * The cycle carries no backwards fill, so during its long delay the reveal
	 * still owns the cell. Both touch opacity; the later one wins once live.
	 */
	.armed.revealed rect[data-cycle] {
		animation:
			cell-in 520ms cubic-bezier(0.16, 1, 0.3, 1) var(--d) both,
			cell-cycle var(--cdur) steps(1, end) var(--cd) infinite;
	}

	@keyframes cell-in {
		from {
			opacity: 0;
			scale: 0.25;
			translate: 0 -16px;
		}
		to {
			opacity: 1;
			scale: 1;
			translate: 0 0;
		}
	}

	/*
	 * A cell re-rendering: it drops out, comes back in a different colour, settles.
	 * `steps(1, end)` makes each change a hard cut — a raster snapping to a new
	 * value, not a soft crossfade. Most of the cycle is spent at rest.
	 */
	@keyframes cell-cycle {
		0%,
		68% {
			fill: var(--c0);
			opacity: 1;
		}
		72% {
			fill: var(--c0);
			opacity: 0.15;
		}
		76% {
			fill: var(--c1);
			opacity: 1;
		}
		84% {
			fill: var(--c2);
			opacity: 1;
		}
		90% {
			fill: var(--c1);
			opacity: 0.35;
		}
		96%,
		100% {
			fill: var(--c0);
			opacity: 1;
		}
	}

	/*
	 * The global reduced-motion rule collapses durations but leaves delays, which
	 * would stall a 600ms-delayed cell. Drop the choreography outright instead.
	 */
	@media (prefers-reduced-motion: reduce) {
		.armed rect,
		.armed.revealed rect,
		.armed.revealed rect[data-cycle] {
			animation: none;
			opacity: 1;
			scale: 1;
			translate: none;
			fill: var(--c0);
		}
	}
</style>
