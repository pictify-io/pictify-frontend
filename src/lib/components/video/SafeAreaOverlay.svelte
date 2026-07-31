<script>
	/**
	 * Safe-area guides drawn over the editing canvas.
	 *
	 * Reels, TikTok and Shorts paint their own interface across the video —
	 * caption and handle along the bottom, action buttons up the right. Anything
	 * placed in those bands is covered in the feed, and without guides the only
	 * way to find out is to publish.
	 *
	 * ── Why the geometry is computed rather than CSS-inset ────────────────
	 *
	 * The Pixi canvas fills its wrapper and letterboxes the composition inside
	 * it, so the video rect is NOT the canvas rect. Insetting the overlay by a
	 * percentage of the canvas would draw the guides in the wrong place on every
	 * viewport where the aspect ratios differ — which is most of them. The
	 * contained rect is recomputed whenever the wrapper resizes.
	 *
	 * Purely advisory: `pointer-events: none` throughout, so it never intercepts
	 * a drag on the clip underneath.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { safeAreaFor } from '$lib/video/safe-areas.js';

	/** The element the Pixi canvas fills. */
	export let host = null;
	export let compositionWidth = 1080;
	export let compositionHeight = 1920;

	let hostWidth = 0;
	let hostHeight = 0;
	let observer;

	const measure = () => {
		if (!host) return;
		const rect = host.getBoundingClientRect();
		hostWidth = rect.width;
		hostHeight = rect.height;
	};

	onMount(() => {
		measure();
		if (typeof ResizeObserver !== 'undefined' && host) {
			observer = new ResizeObserver(measure);
			observer.observe(host);
		}
	});

	onDestroy(() => observer?.disconnect());

	// The composition as drawn: scaled to fit, centred, letterboxed.
	$: scale =
		hostWidth && hostHeight
			? Math.min(hostWidth / compositionWidth, hostHeight / compositionHeight)
			: 0;
	$: videoWidth = compositionWidth * scale;
	$: videoHeight = compositionHeight * scale;
	$: videoLeft = (hostWidth - videoWidth) / 2;
	$: videoTop = (hostHeight - videoHeight) / 2;

	$: preset = safeAreaFor(compositionWidth, compositionHeight);

	// Insets are fractions of the COMPOSITION, applied to the drawn rect.
	$: guideLeft = videoLeft + videoWidth * preset.left;
	$: guideTop = videoTop + videoHeight * preset.top;
	$: guideWidth = videoWidth * (1 - preset.left - preset.right);
	$: guideHeight = videoHeight * (1 - preset.top - preset.bottom);
</script>

{#if scale > 0}
	<div class="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
		<!--
			The guide box itself. A dashed outline rather than a shaded mask: a
			tint over the unsafe bands changes how the composition reads, and
			judging colour against a fake overlay is worse than no guide at all.
		-->
		<div
			class="absolute rounded-[2px] border border-dashed border-brand-accent/70"
			style="left:{guideLeft}px; top:{guideTop}px; width:{guideWidth}px; height:{guideHeight}px;"
		></div>

		<div
			class="absolute rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-accent"
			style="left:{guideLeft}px; top:{Math.max(videoTop + 2, guideTop - 16)}px;"
		>
			Safe area · {preset.label}
		</div>
	</div>
{/if}
