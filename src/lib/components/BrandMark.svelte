<script>
	/**
	 * The Pictify mark: the bolt, in a rounded ink tile.
	 *
	 * One definition for every surface. The v2 redesign drew the mark twice and
	 * they drifted — the landing wordmark became two offset squares, the
	 * dashboard rail a single square — so the product had three logos counting
	 * the bolt the old dashboard still used. This is the bolt, kept, in the v2
	 * palette.
	 *
	 * The path is the same lightning bolt the v1 dashboard carried. It is filled
	 * rather than stroked because at 24px a 3px stroke closes up the notch and
	 * the shape stops reading as a bolt.
	 */

	/** Rendered size in px. The artwork is a square. */
	export let size = 24;
	/** On a dark ground: the tile goes white and the bolt ink. */
	export let inverted = false;
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 28 28"
	fill="none"
	aria-hidden="true"
	class="flex-shrink-0"
>
	<rect x="1.5" y="1.5" width="25" height="25" rx="7" fill={inverted ? '#FFFFFF' : '#000000'} />
	<!--
		translate(5,5) scale(0.75) centres the 24-grid bolt in the 28-grid tile:
		the path's own box is x 4–20, y 3–21, so its centre lands on 14,14.
	-->
	<g transform="translate(5, 5) scale(0.75)">
		<path d="M13 10V3L4 14h7v7l9-11h-7z" fill={inverted ? '#000000' : '#D8F34A'} />
	</g>
</svg>
