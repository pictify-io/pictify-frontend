<script>
	/**
	 * A live dither field — the pixel motif, actually rendering.
	 *
	 * Runs @paper-design/shaders' dithering fragment on a WebGL canvas. The
	 * static clusters say "a raster"; this one says "a raster being made", so it
	 * belongs only where work is genuinely happening (the generating screen) or
	 * where the page is allowed one breathing surface (the hero field). It is
	 * decoration: no motion preference means no canvas at all, and a lost WebGL
	 * context just leaves the ground colour underneath.
	 */
	import { onMount } from 'svelte';

	/** CSS colours. Back defaults to transparent so the ground shows through. */
	export let colorBack = 'rgba(0, 0, 0, 0)';
	export let colorFront = '#000000';
	/** simplex | warp | dots | wave | ripple | swirl | sphere */
	export let shape = 'simplex';
	/** random | 2x2 | 4x4 | 8x8 — Bayer sizes; 4x4 reads most like riso. */
	export let type = '4x4';
	/** Dither cell size in px (0.5–20). */
	export let pxSize = 4;
	/** Animation speed multiplier; keep well under 1 — this is a surface, not a show. */
	export let speed = 0.2;
	/** Fixed start frame so SSR/hydration and re-mounts look identical. */
	export let frame = 0;

	let className = '';
	export { className as class };

	let host;

	onMount(() => {
		// Reduced motion: mount nothing. A frozen dither frame reads as dirt.
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

		let mount;
		let cancelled = false;

		(async () => {
			try {
				const m = await import('@paper-design/shaders');
				if (cancelled) return;
				mount = new m.ShaderMount(
					host,
					m.ditheringFragmentShader,
					{
						u_colorBack: m.getShaderColorFromString(colorBack),
						u_colorFront: m.getShaderColorFromString(colorFront),
						u_shape: m.DitheringShapes[shape] ?? m.DitheringShapes.simplex,
						u_type: m.DitheringTypes[type] ?? m.DitheringTypes['4x4'],
						u_pxSize: pxSize,
						u_fit: 0,
						u_scale: 1,
						u_rotation: 0,
						u_originX: 0.5,
						u_originY: 0.5,
						u_offsetX: 0,
						u_offsetY: 0,
						u_worldWidth: 0,
						u_worldHeight: 0
					},
					undefined,
					speed,
					frame
				);
				// The vanilla mount sets the canvas's drawing-buffer size but not
				// its CSS size; unstyled it renders at the 300×150 canvas default.
				const canvas = mount.canvasElement;
				canvas.style.position = 'absolute';
				canvas.style.inset = '0';
				canvas.style.width = '100%';
				canvas.style.height = '100%';
				canvas.style.display = 'block';
			} catch {
				// No WebGL, blocked canvas, whatever — the ground colour stands in.
				// ShaderMount prepends its canvas before probing for a context, so
				// a failed mount leaves a 300×150 orphan behind; take it with us.
				host?.querySelector('canvas')?.remove();
			}
		})();

		return () => {
			cancelled = true;
			mount?.dispose();
		};
	});
</script>

<div bind:this={host} class="pointer-events-none {className}" aria-hidden="true"></div>
