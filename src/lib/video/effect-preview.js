/**
 * Preview families for the effects picker.
 *
 * The panel lists 51 effects and their real thumbnails are unavailable: the
 * engine points `previewStatic`/`previewDynamic` at a CDN that answers 403, so
 * every tile renders as an empty box. A grid of 51 identical boxes labelled
 * "Slit Scan" and "Warp Transition" is not a picker, it is a guessing game.
 *
 * So each tile animates the CHARACTER of its effect on hover — does it shift
 * colour, jitter, blur, pulse, warp — using CSS over a sample swatch. This is
 * the same approach the motion picker already uses (see motion-preview.js);
 * effects are a second vocabulary onto the same idea.
 *
 * These previews are deliberately approximate. Running the real shader in 51
 * live WebGL contexts inside a panel is the kind of thing that makes an editor
 * feel slow for no gain. What a user needs from a picker is character — enough
 * to narrow 51 down to three and try those for real.
 *
 * ── Rules, not an exhaustive table ────────────────────────────────────────
 *
 * The motion picker maps every motion by name in one table because its
 * catalogue is fixed. This catalogue is NOT: it comes from the engine at run
 * time and grows on every bump, so a table would silently give each new effect
 * no preview at all. Instead the mapping is an ORDERED list of keyword rules,
 * which is still one reviewable block and still covers effects that do not
 * exist yet. `OVERRIDES` handles the handful whose names would otherwise match
 * the wrong rule.
 */

/** The families a tile can render, each with matching CSS in effects-preview.css. */
export const EFFECT_FAMILIES = [
	'color',
	'glitch',
	'blur',
	'pixel',
	'flash',
	'zoom',
	'warp',
	'spin',
	'mask',
	'fade'
];

const DEFAULT_FAMILY = 'color';

/*
 * Effects whose name matches a rule that describes the wrong thing.
 *
 * `chromatic` contains no keyword from any rule but is a channel split;
 * `slitScan` reads as a scan line but is a warp; `shine` and `laser` are light
 * sweeps rather than colour shifts. Each entry here is a name that lies.
 */
const OVERRIDES = {
	chromatic: 'glitch',
	slitScan: 'warp',
	slitScanGlitch: 'glitch',
	shine: 'flash',
	laser: 'flash',
	sparks: 'flash',
	spring: 'zoom',
	cameraMove: 'spin',
	filmStripPro: 'pixel',
	tvScanlines: 'pixel',
	halftone: 'pixel',
	hdr: 'color',
	hdrV2: 'color',
	inverseAperture: 'mask',
	paperBreakReveal: 'mask',
	curtainOpen: 'mask',
	vignette: 'mask',
	perspectiveSingle: 'spin',
	mirrorTile: 'spin'
};

/*
 * Ordered keyword rules. FIRST match wins, so the more specific keyword has to
 * come first: `pixelateTransition` must reach `pixel` before `transition` sends
 * it anywhere else, and `waveDistort` should read as a warp either way.
 */
const RULES = [
	/*
	 * Colour first. It has to outrank `scale`, because "grayscale" ends in it
	 * and was being previewed as a zoom — the one collision in the whole
	 * catalogue, and invisible until you look at the tile. Colour keywords are
	 * distinctive enough that nothing else matches them.
	 */
	[/invert|gray|grey|sepia|duotone|tritone|hue|colou?r/i, 'color'],
	[/glitch/i, 'glitch'],
	[/rgb/i, 'glitch'],
	[/pixelate/i, 'pixel'],
	[/blur|focus/i, 'blur'],
	[/flash|blink|pulse|neon/i, 'flash'],
	[/zoom|scale/i, 'zoom'],
	[/spin|rotat|swirl/i, 'spin'],
	[/wave|sine|distort|warp/i, 'warp'],
	[/fade/i, 'fade']
];

/**
 * The preview family for an effect key.
 *
 * @param {string} effectKey - as it comes from the engine registry, e.g. "rgbShift"
 * @returns {string} one of EFFECT_FAMILIES
 */
export const effectFamily = (effectKey) => {
	const key = String(effectKey || '');
	if (!key) return DEFAULT_FAMILY;
	if (OVERRIDES[key]) return OVERRIDES[key];

	for (const [pattern, family] of RULES) {
		if (pattern.test(key)) return family;
	}
	return DEFAULT_FAMILY;
};

/**
 * The full preview descriptor for a tile.
 *
 * Returned as an object rather than a bare string so the tile has one thing to
 * spread, and so a later family that needs a direction or a delay can be added
 * without touching every call site.
 *
 * @param {string} effectKey
 * @returns {{family: string, className: string}}
 */
export const effectPreviewSpec = (effectKey) => {
	const family = effectFamily(effectKey);
	return { family, className: `ovfx-preview ovfx-${family}` };
};
