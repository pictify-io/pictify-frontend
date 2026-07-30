/**
 * Control descriptors for template variables.
 *
 * A variable is a render-time input. What it needs on screen depends on what it
 * IS: a colour wants a swatch, a font size wants a slider with sane bounds, an
 * alignment wants three buttons, a logo wants the media picker. Rendering all
 * of them as a text box — which is what happens today for everything the
 * generator emits — makes a no-code surface that is really a code surface with
 * extra steps.
 *
 * The machinery for typed values already exists end to end: VideoTemplate
 * declares text/image/color/video/audio/number, and the panel renders pickers
 * for several of them. What was missing is the shape in between — a composition
 * saying "this number is a slider from 12 to 200" or "these three fields belong
 * to Brand" — and a generator that bothers to say it.
 *
 * This module is the single place that decides what control a field gets, so
 * the answer is the same whether the field came from a zod schema, a plain
 * object schema, or a variable the user declared by hand in the panel.
 */

/** Controls the panel knows how to render. */
export const CONTROLS = ['text', 'textarea', 'color', 'number', 'slider', 'select', 'toggle', 'media'];

/** Variable types the backend persists (VideoTemplate.VARIABLE_TYPES). */
const MEDIA_TYPES = ['image', 'video', 'audio'];

/*
 * Sliders need bounds, and a composition that declares a number without them is
 * the common case. These are per-role defaults rather than one global range: a
 * font size and an opacity are both numbers and share nothing else.
 *
 * Matched on the field NAME because that is the only signal available — a bare
 * z.number() carries nothing else. A wrong guess costs a slider with an
 * unhelpful range, which is still better than a text box.
 */
const NUMBER_ROLES = [
	[/opacity|alpha/i, { min: 0, max: 1, step: 0.05 }],
	[/scale|zoom/i, { min: 0.1, max: 3, step: 0.05 }],
	[/rotation|angle|rotate/i, { min: -180, max: 180, step: 1 }],
	[/fontsize|textsize|size$/i, { min: 8, max: 240, step: 1 }],
	[/radius|round/i, { min: 0, max: 200, step: 1 }],
	[/duration|delay|seconds/i, { min: 0, max: 30, step: 0.1 }],
	[/count|repeat|columns|rows/i, { min: 1, max: 24, step: 1 }],
	[/percent|progress/i, { min: 0, max: 100, step: 1 }]
];

const numberRole = (name) => {
	for (const [pattern, bounds] of NUMBER_ROLES) {
		if (pattern.test(String(name || ''))) return bounds;
	}
	return null;
};

/** Long-form copy wants room to type; a headline does not. */
const LONG_TEXT = /body|paragraph|description|summary|caption|subtitle|quote|bio|about/i;

const humanize = (name) =>
	String(name || '')
		.replace(/[_-]+/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/^./, (c) => c.toUpperCase());

/**
 * The control a field should render as.
 *
 * @param {Object} field - { name, type, default/defaultValue, min, max, step,
 *   options, group, label, description }
 * @returns {Object} a descriptor the panel can render without further guessing
 */
export const controlFor = (field = {}) => {
	const name = String(field.name || '');
	const type = String(field.type || 'text').toLowerCase();
	const label = field.label || humanize(name);
	const group = typeof field.group === 'string' && field.group.trim() ? field.group.trim() : null;
	const description = typeof field.description === 'string' ? field.description : '';
	const base = { name, label, group, description, type };

	// An explicit option list always wins: a field with choices is a select
	// whatever its underlying type says.
	const options = normalizeOptions(field.options);
	if (options.length) {
		return { ...base, control: 'select', options };
	}

	if (type === 'color') return { ...base, control: 'color' };
	if (MEDIA_TYPES.includes(type)) return { ...base, control: 'media', accept: type };
	if (type === 'boolean' || type === 'toggle') return { ...base, control: 'toggle' };

	if (type === 'number') {
		const explicit = hasBounds(field);
		const role = explicit ? null : numberRole(name);
		const bounds = explicit
			? { min: num(field.min), max: num(field.max), step: num(field.step) ?? 1 }
			: role;
		// Without bounds a slider has nothing to slide between, so a plain number
		// input is the honest fallback rather than an invented 0-100.
		return bounds
			? { ...base, control: 'slider', min: bounds.min, max: bounds.max, step: bounds.step ?? 1 }
			: { ...base, control: 'number' };
	}

	return { ...base, control: LONG_TEXT.test(name) ? 'textarea' : 'text' };
};

const num = (value) => {
	const n = Number(value);
	return Number.isFinite(n) ? n : undefined;
};

const hasBounds = (field) => num(field.min) !== undefined && num(field.max) !== undefined;

/**
 * Options accept either bare values or {value,label} pairs, because a schema
 * author writing `options: ['left','center','right']` should not have to know
 * about the richer form.
 */
export const normalizeOptions = (options) => {
	if (!Array.isArray(options)) return [];
	return options
		.map((option) => {
			if (option && typeof option === 'object') {
				const value = option.value ?? option.name;
				if (value === undefined || value === null) return null;
				return { value: String(value), label: String(option.label ?? humanize(String(value))) };
			}
			if (option === undefined || option === null || option === '') return null;
			return { value: String(option), label: humanize(String(option)) };
		})
		.filter(Boolean);
};

/**
 * Group fields into sections for the panel, preserving first-seen order.
 *
 * Ungrouped fields collect under a null group rendered first, so a composition
 * that declares no groups looks exactly as it does today rather than growing a
 * pointless "Other" heading.
 */
export const groupControls = (controls = []) => {
	const groups = [];
	const index = new Map();
	for (const control of controls) {
		const key = control?.group || null;
		if (!index.has(key)) {
			const group = { group: key, controls: [] };
			index.set(key, group);
			groups.push(group);
		}
		index.get(key).controls.push(control);
	}
	// An ungrouped block belongs above the named sections: it is the template's
	// own top-level inputs, not a leftover bucket.
	groups.sort((a, b) => (a.group === null ? -1 : b.group === null ? 1 : 0));
	return groups;
};
