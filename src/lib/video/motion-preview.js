/**
 * Preview families for transitions and animations.
 *
 * The pickers show ~120 motions between them. A label alone does not tell you
 * what "Butterfly Wave Scrawler" or "Polka Dots Curtain" does, so each tile
 * animates the SHAPE of its motion: which direction it travels, whether it
 * scales, whether it reveals through a mask.
 *
 * These previews are deliberately approximate. Rendering the real blend would
 * mean 68 live engine instances in a popover, which is the kind of thing that
 * makes an editor feel slow for no gain. What a user actually needs from a
 * picker is direction and character — enough to narrow 68 down to three, then
 * try those on the real clip. The tile is a signpost, not a rehearsal.
 *
 * A family is chosen per motion here, in one table, rather than each tile
 * guessing from its own label. That keeps the mapping reviewable: you can read
 * this file and see exactly which motions claim to look alike.
 */

/**
 * The families a tile can render. Ordered roughly by how common they are, so
 * the fallback at the bottom is the rare case rather than the default.
 */
export const PREVIEW_FAMILIES = [
	'fade',
	'wipe',
	'slide',
	'zoom',
	'blur',
	'reveal',
	'distort',
	'spin',
	'glitch'
];

const DEFAULT_FAMILY = 'fade';

/*
 * Transition categories come from @openvideo/core's own catalog, so this map is
 * a translation between two vocabularies rather than a guess. `geometric`
 * covers mask-based reveals (circles, shapes, dots) which read very differently
 * from a linear wipe, so it gets its own family.
 */
const TRANSITION_CATEGORY_FAMILY = {
	fade: 'fade',
	wipe: 'wipe',
	slide: 'slide',
	zoom: 'zoom',
	blur: 'blur',
	geometric: 'reveal',
	distort: 'distort',
	stylized: 'spin',
	glitch: 'glitch'
};

/**
 * The preview family for a transition.
 * @param {{category?: string, key?: string}} transition
 */
export const transitionFamily = (transition) => {
	const byCategory = TRANSITION_CATEGORY_FAMILY[transition?.category];
	if (byCategory) return byCategory;
	// A catalog entry with no category still has a key, and the key usually says
	// what it does. Better a reasonable guess than every uncategorised blend
	// rendering as a crossfade.
	return familyFromName(transition?.key);
};

/*
 * Ordered longest-token-first where tokens overlap: "slideUp" contains "up",
 * and "zoomOutBlur" contains both "zoom" and "blur". First match wins, so the
 * more specific descriptor has to come first or everything collapses into the
 * generic families.
 */
const NAME_FAMILY_RULES = [
	[/glitch|scrawl|noise|static/i, 'glitch'],
	[/blur/i, 'blur'],
	[/circle|iris|shape|dots|polka|pixel|mask|crop|clock|radial/i, 'reveal'],
	[/wipe|curtain|door|barn|split|bars|blinds/i, 'wipe'],
	[/spin|rotate|swirl|twist|roll|flip/i, 'spin'],
	[/wave|ripple|warp|distort|squeeze|stretch|elastic|skew/i, 'distort'],
	[/zoom|scale|pop|punch|grow|shrink/i, 'zoom'],
	[/slide|push|move|drift|enter|exit|left|right|up|down/i, 'slide'],
	[/fade|dissolve|opacity/i, 'fade']
];

/**
 * Best-guess family from a motion's key or label.
 * Exported because the animation presets have no category to read.
 */
export const familyFromName = (name) => {
	const text = String(name || '');
	for (const [pattern, family] of NAME_FAMILY_RULES) {
		if (pattern.test(text)) return family;
	}
	return DEFAULT_FAMILY;
};

/*
 * Direction matters more than family for animations: "Slide In Left" and
 * "Slide In Right" are the same family and the same shape, and telling them
 * apart is the entire reason you opened the picker.
 */
const DIRECTION_RULES = [
	[/left/i, 'left'],
	[/right/i, 'right'],
	[/up|top|north/i, 'up'],
	[/down|bottom|south/i, 'down']
];

/** 'left' | 'right' | 'up' | 'down' | null */
export const directionFromName = (name) => {
	const text = String(name || '');
	for (const [pattern, direction] of DIRECTION_RULES) {
		if (pattern.test(text)) return direction;
	}
	return null;
};

/*
 * Split camelCase into words so "out" can be matched as a whole token.
 * `slideOutLeft` -> "slide out left". Testing /out$/ instead would only catch
 * `fadeOut` and miss every directional exit, and a bare /out/ would count
 * "outline" as an exit.
 */
const words = (value) =>
	String(value || '')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.toLowerCase();

export const isExitMotion = (value) => /\bout\b|\bexit\b/.test(words(value));

/**
 * Everything a tile needs to draw itself.
 *
 * @param {Object} motion - { value|key, label, category? }
 * @returns {{family: string, direction: string|null, reverse: boolean}}
 */
export const previewSpec = (motion) => {
	const name = motion?.label || motion?.value || motion?.key || '';
	const family = motion?.category
		? transitionFamily({ category: motion.category, key: motion.value || motion.key })
		: familyFromName(name);
	return {
		family,
		direction: directionFromName(name),
		// An exit plays the entrance backwards. Encoding it here means one CSS
		// animation per family instead of two near-identical keyframe sets that
		// can drift apart.
		reverse: isExitMotion(motion?.value || motion?.key || motion?.label)
	};
};

/**
 * Group flat {value,label,category} options into sections for the picker.
 *
 * Order is preserved from the input, because the catalog is already sorted with
 * the plainest categories first — a picker that opens on "glitch" is a picker
 * that buries the fade everyone actually wants.
 *
 * @param {Array} options
 * @returns {Array<{category: string, label: string, options: Array}>}
 */
export const groupByCategory = (options) => {
	const groups = [];
	const index = new Map();
	for (const option of options || []) {
		const category = option?.category || 'other';
		if (!index.has(category)) {
			const group = { category, label: categoryLabel(category), options: [] };
			index.set(category, group);
			groups.push(group);
		}
		index.get(category).options.push(option);
	}
	return groups;
};

const CATEGORY_LABELS = {
	fade: 'Fade',
	wipe: 'Wipe',
	slide: 'Slide',
	zoom: 'Zoom',
	blur: 'Blur',
	geometric: 'Shapes',
	distort: 'Distort',
	stylized: 'Stylised',
	glitch: 'Glitch',
	other: 'Other'
};

export const categoryLabel = (category) =>
	CATEGORY_LABELS[category] || String(category || '').replace(/^./, (c) => c.toUpperCase());

/**
 * Filter options by a search string, matching label or value.
 * Case- and separator-insensitive: "wave scrawl" finds "butterflyWaveScrawler".
 */
export const filterMotions = (options, query) => {
	const needle = String(query || '')
		.toLowerCase()
		.replace(/[\s_-]/g, '');
	if (!needle) return options || [];
	return (options || []).filter((option) => {
		const haystack = `${option?.label || ''}${option?.value || ''}`
			.toLowerCase()
			.replace(/[\s_-]/g, '');
		return haystack.includes(needle);
	});
};
