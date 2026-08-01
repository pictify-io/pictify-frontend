/**
 * Turning shader uniforms into editable controls, and effect clips into patches.
 *
 * Split out from `effects.js` so it can be tested. That module imports
 * `@openvideo/engine-pixi` for the registry, which drags in PixiJS and WebGL and
 * cannot load under `node --test`; everything here is arithmetic over plain
 * objects, which is the part worth pinning anyway.
 *
 * ── Choosing a control from a uniform ─────────────────────────────────────
 *
 * A uniform is `{value, type}` where `type` is a GLSL type name. The control is
 * chosen from the RUNTIME VALUE rather than that string: the vocabulary differs
 * between shaders and gains members between engine versions, whereas a
 * JavaScript number is a number. The type string is not consulted at all.
 *
 * Anything not recognised — matrices, texture samplers, arrays longer than two
 * — is skipped. A disabled row per unsupported uniform would bury the handful
 * that actually work under a wall of dead controls.
 */

/** How long a dropped effect lasts before anyone drags it. */
export const DEFAULT_EFFECT_US = 3_000_000;
export const MIN_EFFECT_US = 100_000;

/**
 * "oldFilm" / "old_film" -> "Old film", for keys with no label of their own.
 *
 * Sentence case, not Title Case: these sit in a grid beside the engine's own
 * labels, which are sentence case, and a mix of the two reads as a bug.
 */
export const prettyLabel = (key) =>
	String(key || '')
		.replace(/[_-]+/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.toLowerCase()
		.replace(/^./, (c) => c.toUpperCase())
		.trim();

/**
 * A uniform's name as a control label.
 *
 * Shader uniforms are conventionally prefixed `u` — `uIntensity`, `uDirection`
 * — which surfaces in the panel as "U Intensity" and reads as a typo. The
 * prefix is stripped only when what follows starts with a capital, so a uniform
 * genuinely called `use` or `up` keeps its name.
 */
export const paramLabel = (name) => {
	const stripped = String(name || '').replace(/^u(?=[A-Z])/, '');
	return stripped
		.replace(/[_-]+/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.toLowerCase()
		.replace(/^./, (c) => c.toUpperCase())
		.trim();
};

export const isVec2 = (value) =>
	Array.isArray(value) && value.length === 2 && value.every((n) => typeof n === 'number');

export const isColor = (value) => typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value);

/**
 * A usable slider range for a uniform that does not declare one.
 *
 * Most shader uniforms are normalised to 0..1, but plenty are not: a pixelate
 * size or a blur kernel is tens or hundreds. A fixed 0..1 track would pin those
 * to the far right and make the slider look broken, so the range is anchored on
 * the default value instead.
 */
export const rangeFor = (value) => {
	const magnitude = Math.abs(value);
	if (magnitude <= 1) return { min: value < 0 ? -1 : 0, max: 1, step: 0.01 };
	const max = Math.ceil(magnitude * 3);
	return { min: value < 0 ? -max : 0, max, step: max > 50 ? 1 : 0.1 };
};

/**
 * Control descriptors for a uniform map.
 *
 * @param {Record<string, {value: any, type?: string}>} uniforms
 * @returns {Array<{name: string, kind: 'number'|'boolean'|'vec2'|'color', value: any, min?: number, max?: number, step?: number}>}
 */
export const specsFromUniforms = (uniforms) => {
	if (!uniforms || typeof uniforms !== 'object') return [];

	const specs = [];
	for (const [name, uniform] of Object.entries(uniforms)) {
		const value = uniform?.value;

		if (typeof value === 'number' && Number.isFinite(value)) {
			specs.push({ name, kind: 'number', value, ...rangeFor(value) });
		} else if (typeof value === 'boolean') {
			specs.push({ name, kind: 'boolean', value });
		} else if (isColor(value)) {
			specs.push({ name, kind: 'color', value });
		} else if (isVec2(value)) {
			specs.push({ name, kind: 'vec2', value });
		}
	}
	return specs;
};

/**
 * How high a new effect sits.
 *
 * An effect shades everything BELOW it, so one added at the default z-index
 * lands under the content and does nothing at all — the clip appears on the
 * timeline, the controls work, and the canvas is unchanged. That reads as a
 * broken feature rather than as a layering mistake, and it is not something a
 * first-time user would think to check.
 *
 * 900 clears the caption band (50) and anything hand-authored, while leaving
 * room above for a clip deliberately pushed to the front.
 */
export const EFFECT_Z_INDEX = 900;

/**
 * A clip payload for a new effect.
 *
 * `values` starts empty on purpose. An absent value means "use the shader's own
 * default", so writing them all out would freeze today's defaults into every
 * saved template and silently override tomorrow's.
 */
export const createEffectClip = ({
	key,
	label,
	fromUs = 0,
	durationUs = DEFAULT_EFFECT_US,
	zIndex = EFFECT_Z_INDEX
} = {}) => {
	const duration = Math.max(MIN_EFFECT_US, Math.round(Number(durationUs) || DEFAULT_EFFECT_US));
	const from = Math.max(0, Math.round(Number(fromUs) || 0));
	return {
		type: 'Effect',
		name: label || prettyLabel(key),
		effectKey: key,
		values: {},
		timing: {
			display: { from, to: from + duration },
			trim: { from: 0, to: duration },
			duration,
			playbackRate: 1
		},
		/*
		 * A COMPLETE transform, even though an effect covers the whole frame.
		 *
		 * Only a z-index looks sufficient — the engine fills the rest in when it
		 * builds the sprite — but the partial object round-trips through save and
		 * import, and anything downstream that reads `transform.width` off a clip
		 * gets undefined. The studio's own starters always write the full shape;
		 * this now matches them.
		 */
		transform: {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			angle: 0,
			opacity: 1,
			zIndex: Number.isFinite(zIndex) ? zIndex : EFFECT_Z_INDEX
		},
		metadata: {},
		locked: false
	};
};

/** The clip's values, with shader defaults filled in for display. */
export const readEffectValues = (clip, specs) => {
	const stored = clip?.values || {};
	const values = {};
	for (const spec of specs || []) {
		values[spec.name] = stored[spec.name] !== undefined ? stored[spec.name] : spec.value;
	}
	return values;
};

/**
 * A patch setting one uniform, clamped to its control's range.
 *
 * A value equal to the shader default is REMOVED rather than written, so a
 * saved template carries only what someone actually changed. Without that,
 * touching a slider and putting it back leaves the old default pinned in the
 * document forever.
 *
 * @returns {{values: object}|null} null when the value is not usable
 */
export const effectValuePatch = (clip, specs, name, value) => {
	const spec = (specs || []).find((s) => s.name === name);
	if (!spec) return null;

	let next = value;
	if (spec.kind === 'number') {
		const n = Number(value);
		if (!Number.isFinite(n)) return null;
		next = Math.min(spec.max, Math.max(spec.min, n));
	} else if (spec.kind === 'boolean') {
		next = Boolean(value);
	} else if (spec.kind === 'vec2') {
		if (!isVec2(value)) return null;
	} else if (spec.kind === 'color') {
		if (!isColor(value)) return null;
	}

	const values = { ...(clip?.values || {}) };
	if (JSON.stringify(next) === JSON.stringify(spec.value)) {
		delete values[name];
	} else {
		values[name] = next;
	}
	return { values };
};

/** Reset every uniform back to the shader's defaults. */
export const resetEffectValues = () => ({ values: {} });
