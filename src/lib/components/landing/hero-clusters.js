/**
 * The hero deco cells, defined once.
 *
 * The same resolving-raster motif runs across pricing, the alternatives index
 * and its slug pages, blogs and the tool pages. It was copied into each of
 * them, so a change to the motif meant finding four identical arrays and
 * editing them in step — and the fifth copy, the landing Hero's, had already
 * drifted.
 *
 * Each cell is `[column, row, colour]`. Colours are PixelCluster's names, not
 * hex.
 *
 * The landing `Hero.svelte` keeps its own baseline run on purpose: it is a
 * longer twelve-column variant tuned to that band's width, not a stale copy of
 * this one.
 */

/** Top-right cluster, cut by the band's right edge. */
export const HERO_CLUSTER = [
	[0, 2, 'blue'],
	[1, 0, 'blue'],
	[1, 3, 'pink'],
	[2, 1, 'blue'],
	[2, 2, 'ink'],
	[2, 4, 'sky'],
	[3, 0, 'ink'],
	[3, 2, 'blue'],
	[3, 3, 'blue'],
	[4, 1, 'blue'],
	[4, 2, 'ink'],
	[4, 3, 'ink'],
	[4, 4, 'blue'],
	[5, 0, 'ink'],
	[5, 1, 'ink'],
	[5, 2, 'blue'],
	[5, 3, 'ink'],
	[5, 4, 'ink']
];

/** The sparse run that sits on the band's bottom edge. */
export const BASELINE_RUN = [
	[0, 0, 'blue'],
	[2, 0, 'ink'],
	[3, 1, 'blue'],
	[5, 0, 'sky'],
	[6, 1, 'blue'],
	[8, 0, 'pink'],
	[9, 1, 'blue']
];
