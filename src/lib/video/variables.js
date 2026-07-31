/**
 * Variables for timeline video templates — the browser half.
 *
 * Mirrors html-to-gif/service/openvideo-variables.js. The backend is the
 * authority at render time; this module powers the studio: auto-detecting
 * tokens, describing what a clip can bind to, previewing filled values on the
 * live canvas, and applying values for a client-side (WebCodecs) export.
 *
 * Two ways a value reaches the scene, exactly as on the server:
 *
 *   1. TOKENS — a text clip's `text` contains `{{variableName}}`. Same syntax
 *      as every other Pictify template. Auto-detected and auto-declared.
 *
 *   2. BINDINGS — `clip.metadata.pictify.bindings = [{ target, variable }]`
 *      for fields that can't hold a token: an image src, a color, an opacity,
 *      a clip's in/out point.
 *
 * Three engine facts this module is written around (see @openvideo/core):
 *
 *   a. `core.clip.update` deep-merges only style/caption/timing/transform, and
 *      only one level deep — so a timing patch must carry the whole `display`
 *      object or the sibling key is lost. buildClipPatch does that.
 *   b. `core.clip.update` SHALLOW-assigns everything else, so writing metadata
 *      replaces the entire metadata object. Always read-modify-write.
 *   c. An Image/Video/Audio clip with an empty `src` is DROPPED on import.
 *      A bound media clip must always carry a real URL — which is why an
 *      image variable's `defaultValue` doubles as its design-time placeholder.
 */

import { applyFit } from './text-fit.js';

// Token names must be valid identifiers — the same rule VARIABLE_NAME_RE
// enforces below. A looser token pattern would let {{2024total}} be detected
// but never declarable, so it would render as a literal brace pair forever.
export const TOKEN_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

/** Mirrors the backend cap. */
export const MAX_VALUE_LENGTH = 5000;
export const MICROSECONDS_PER_SECOND = 1_000_000;

/** Canonical variable vocabulary — same list the backend normalizes to. */
export const VARIABLE_TYPES = [
	{ value: 'text', label: 'Text', hint: 'Any string — names, headlines, dates' },
	{ value: 'image', label: 'Image URL', hint: 'A public https:// image' },
	{ value: 'color', label: 'Color', hint: 'Hex, rgb() or a CSS color name' },
	{ value: 'video', label: 'Video URL', hint: 'A public https:// mp4 or webm' },
	{ value: 'audio', label: 'Audio URL', hint: 'A public https:// mp3 or wav' },
	{ value: 'number', label: 'Number', hint: 'Opacity, seconds, counts' }
];

export const MEDIA_TYPES = new Set(['image', 'video', 'audio']);

/**
 * Every binding target the renderer honours. Keep in lockstep with
 * BINDING_TARGETS in the backend service — a target the server doesn't know
 * is silently ignored at render time, which reads to the user as a bug.
 */
export const BINDING_TARGETS = [
	{
		target: 'src',
		label: 'Media source',
		clipTypes: ['Image', 'Video', 'Audio'],
		typeFor: (clipType) =>
			clipType === 'Video' ? 'video' : clipType === 'Audio' ? 'audio' : 'image'
	},
	// Text and Shape use DIFFERENT colour keys, and binding the wrong one fails
	// silently — the value lands on the clip and nothing reads it.
	//   Text  -> style.color            (properties-panel.tsx writes this)
	//   Shape -> style.fill             (ShapeClip.drawShape reads this)
	// A flat `style.backgroundColor` is dead for both: the engine's text
	// background is the nested style.background.color.
	{
		target: 'style.color',
		label: 'Text color',
		clipTypes: ['Text'],
		typeFor: () => 'color'
	},
	{
		target: 'style.fill',
		label: 'Fill color',
		clipTypes: ['Shape'],
		typeFor: () => 'color'
	},
	{
		target: 'style.background.color',
		label: 'Text background',
		clipTypes: ['Text'],
		typeFor: () => 'color'
	},
	{
		target: 'style.colors.0',
		label: 'Gradient start',
		clipTypes: ['Backdrop'],
		typeFor: () => 'color'
	},
	{
		target: 'style.colors.1',
		label: 'Gradient end',
		clipTypes: ['Backdrop'],
		typeFor: () => 'color'
	},
	{
		target: 'style.colors.2',
		label: 'Gradient third stop',
		clipTypes: ['Backdrop'],
		typeFor: () => 'color'
	},
	{
		target: 'transform.opacity',
		label: 'Opacity',
		clipTypes: null,
		typeFor: () => 'number'
	},
	{
		target: 'timing.display.from',
		label: 'Start time (seconds)',
		clipTypes: null,
		unit: 'seconds',
		typeFor: () => 'number'
	},
	{
		target: 'timing.display.to',
		label: 'End time (seconds)',
		clipTypes: null,
		unit: 'seconds',
		typeFor: () => 'number'
	}
];

/** Bindable targets for a given clip type, in menu order. */
export const bindingTargetsForClip = (clipType) =>
	BINDING_TARGETS.filter((t) => !t.clipTypes || t.clipTypes.includes(clipType));

export const findBindingTarget = (target) => BINDING_TARGETS.find((t) => t.target === target);

/** `{ name: value }` → the same string with every known token replaced. */
export const replaceTokens = (text, values) => {
	if (typeof text !== 'string' || text.indexOf('{{') === -1) return text;
	return text.replace(TOKEN_RE, (match, name) =>
		Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
	);
};

/** The clips of an exported document, as an array whatever shape it is in. */
export const clipList = (projectJson) => {
	const clips = projectJson?.clips;
	if (Array.isArray(clips)) return clips;
	return Object.values(clips || {});
};

/**
 * Every `{{token}}` a document's text clips use, in first-seen order.
 * @param {Object} projectJson
 * @returns {string[]}
 */
export const detectTokens = (projectJson) => {
	const found = [];
	const seen = new Set();
	const scan = (text) => {
		if (typeof text !== 'string') return;
		for (const match of text.matchAll(TOKEN_RE)) {
			if (!seen.has(match[1])) {
				seen.add(match[1]);
				found.push(match[1]);
			}
		}
	};
	for (const clip of clipList(projectJson)) scan(clip?.text);
	scan(projectJson?.settings?.backgroundColor);
	return found;
};

/** Every variable name referenced by a clip binding, in first-seen order. */
export const detectBoundVariables = (projectJson) => {
	const found = [];
	const seen = new Set();
	for (const clip of clipList(projectJson)) {
		const bindings = clip?.metadata?.pictify?.bindings;
		if (!Array.isArray(bindings)) continue;
		for (const binding of bindings) {
			if (typeof binding?.variable === 'string' && !seen.has(binding.variable)) {
				seen.add(binding.variable);
				found.push(binding.variable);
			}
		}
	}
	return found;
};

/** Everything the document references, tokens first. */
export const detectReferences = (projectJson) => [
	...new Set([...detectTokens(projectJson), ...detectBoundVariables(projectJson)])
];

/** Bindings declared on one clip. */
export const bindingsForClip = (clip) => clip?.metadata?.pictify?.bindings || [];

/** The binding on `clip` for `target`, if any. */
export const bindingFor = (clip, target) =>
	bindingsForClip(clip).find((b) => b?.target === target) || null;

// ── Definitions ──────────────────────────────────────────────────────────

export const VARIABLE_NAME_RE = /^[a-zA-Z_][\w]*$/;

/**
 * Turn `recipientName` into `Recipient Name` for labels and placeholders.
 * Every word is capitalised, not just the first — these render as field labels
 * and as the replacement text when a variable is deleted, so "Recipient name"
 * would read like a typo.
 */
export const humanizeName = (name) =>
	String(name)
		.replace(/[_-]+/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.trim()
		.replace(/\b\w/g, (c) => c.toUpperCase());

/** A fresh definition with the product's canonical shape. */
export const makeDefinition = (name, type = 'text', defaultValue = '') => ({
	name,
	type,
	defaultValue,
	description: '',
	validation: { required: false }
});

/** Has the user actually touched this definition since we auto-added it? */
export const isPristine = (definition) =>
	!!definition &&
	(definition.type === 'text' || !definition.type) &&
	!definition.defaultValue &&
	!definition.description &&
	!definition.validation?.required;

/**
 * Reconcile declared definitions against what the document references.
 *
 * Auto-declares tokens the author typed, and prunes ones they deleted — but
 * only when the definition is still pristine and was auto-added in the first
 * place, so a variable someone configured is never silently lost. A name the
 * user explicitly deleted stays deleted while its token is still on the
 * canvas (otherwise it would resurrect on the next keystroke).
 *
 * @param {Array} definitions - current variableDefinitions
 * @param {string[]} referenced - detectReferences(projectJson)
 * @param {Object} state
 * @param {string[]} state.autoAdded - names this session auto-declared
 * @param {Set<string>} state.explicitlyDeleted - names the user removed
 * @returns {{definitions: Array, autoAdded: string[], added: string[], removed: string[]}}
 */
export const reconcileDefinitions = (
	definitions = [],
	referenced = [],
	{ autoAdded = [], explicitlyDeleted = new Set() } = {}
) => {
	const declaredNames = new Set(definitions.map((d) => d?.name).filter(Boolean));
	const referencedSet = new Set(referenced);
	const nextAutoAdded = new Set(autoAdded);

	const added = [];
	const next = [...definitions];

	for (const name of referenced) {
		if (declaredNames.has(name)) continue;
		if (explicitlyDeleted.has(name)) continue;
		if (!VARIABLE_NAME_RE.test(name)) continue;
		next.push(makeDefinition(name));
		declaredNames.add(name);
		nextAutoAdded.add(name);
		added.push(name);
	}

	const removed = [];
	const kept = next.filter((definition) => {
		const name = definition?.name;
		if (!name) return false;
		const orphan = !referencedSet.has(name);
		if (orphan && nextAutoAdded.has(name) && isPristine(definition)) {
			nextAutoAdded.delete(name);
			removed.push(name);
			return false;
		}
		return true;
	});

	return {
		definitions: kept,
		autoAdded: [...nextAutoAdded].filter((name) => kept.some((d) => d.name === name)),
		added,
		removed
	};
};

/**
 * Merge declared defaults under caller values. Empty means "not supplied" —
 * the authored document value stays, same rule as the backend.
 */
export const resolveValues = (definitions = [], values = {}) => {
	const resolved = {};
	for (const definition of definitions) {
		if (!definition?.name) continue;
		const supplied = values[definition.name];
		const hasSupplied = supplied !== undefined && supplied !== null && supplied !== '';
		const raw = hasSupplied ? supplied : definition.defaultValue;
		if (raw === undefined || raw === null || raw === '') continue;
		resolved[definition.name] =
			definition.type === 'number' ? Number(raw) : raw;
	}
	return resolved;
};

/** Which declared, required variables still have no value. */
export const missingRequired = (definitions = [], values = {}) =>
	definitions
		.filter((d) => d?.validation?.required)
		.filter((d) => {
			const supplied = values[d.name];
			const hasSupplied = supplied !== undefined && supplied !== null && supplied !== '';
			return !hasSupplied && !d.defaultValue;
		})
		.map((d) => d.name);

// ── Applying values ──────────────────────────────────────────────────────

const shapeForTarget = (target, value, binding) => {
	if (target === 'transform.opacity') {
		const num = Number(value);
		return Number.isFinite(num) ? Math.min(1, Math.max(0, num)) : undefined;
	}
	if (target === 'timing.display.from' || target === 'timing.display.to') {
		const num = Number(value);
		if (!Number.isFinite(num)) return undefined;
		const spec = binding || findBindingTarget(target);
		const micros = spec?.unit === 'seconds' ? num * MICROSECONDS_PER_SECOND : num;
		return Math.max(0, Math.round(micros));
	}
	return value;
};

/**
 * Build the update patch for one clip — and the patch that undoes it.
 *
 * Written for `core.clip.update`'s merge rules: nested groups are rebuilt in
 * full from the live clip so a one-level merge can't drop a sibling key.
 *
 * @param {Object} clip - the live clip
 * @param {Object} resolved - { name: value }
 * @returns {{patch: Object, restore: Object}|null} null when nothing changes
 */
export const buildClipPatch = (clip, resolved) => {
	if (!clip) return null;
	const patch = {};
	const restore = {};

	if (typeof clip.text === 'string') {
		const replaced = replaceTokens(clip.text, resolved);
		if (replaced !== clip.text) {
			patch.text = replaced;
			restore.text = clip.text;
		}
	}

	for (const binding of bindingsForClip(clip)) {
		const spec = findBindingTarget(binding?.target);
		if (!spec) continue;
		if (spec.clipTypes && !spec.clipTypes.includes(clip.type)) continue;
		if (!Object.prototype.hasOwnProperty.call(resolved, binding.variable)) continue;

		const value = shapeForTarget(binding.target, resolved[binding.variable], {
			...spec,
			...binding
		});
		if (value === undefined) continue;

		if (binding.target === 'src') {
			if (clip.src === value) continue;
			patch.src = value;
			restore.src = clip.src;
		} else if (binding.target === 'style.background.color') {
			// Nested one level deeper than the generic style.* branch handles.
			const current = clip.style?.background || {};
			if (current.color === value) continue;
			patch.style = {
				...(patch.style || clip.style || {}),
				background: { ...current, color: value }
			};
			restore.style = {
				...(restore.style || clip.style || {}),
				background: { ...current }
			};
		} else if (/^style\.colors\.\d+$/.test(binding.target)) {
			// An indexed gradient stop. The generic style.* branch below would
			// write the literal key "colors.0", which the engine ignores — while
			// the server writes the array element properly. Handle it explicitly
			// so the preview and the render agree.
			const index = Number(binding.target.split('.')[2]);
			const current = Array.isArray(clip.style?.colors) ? clip.style.colors : [];
			if (current[index] === value) continue;
			const nextColors = [...(patch.style?.colors || current)];
			nextColors[index] = value;
			patch.style = { ...(patch.style || clip.style || {}), colors: nextColors };
			restore.style = { ...(restore.style || clip.style || {}), colors: [...current] };
		} else if (binding.target.startsWith('style.')) {
			const key = binding.target.slice('style.'.length);
			if (clip.style?.[key] === value) continue;
			patch.style = { ...(patch.style || clip.style || {}), [key]: value };
			restore.style = { ...(restore.style || clip.style || {}), [key]: clip.style?.[key] };
		} else if (binding.target === 'transform.opacity') {
			if (clip.transform?.opacity === value) continue;
			patch.transform = { ...(patch.transform || clip.transform || {}), opacity: value };
			restore.transform = {
				...(restore.transform || clip.transform || {}),
				opacity: clip.transform?.opacity
			};
		} else if (binding.target.startsWith('timing.display.')) {
			const key = binding.target.slice('timing.display.'.length);
			const currentDisplay = clip.timing?.display || {};
			if (currentDisplay[key] === value) continue;
			const patchedDisplay = { ...(patch.timing?.display || currentDisplay), [key]: value };
			patch.timing = { ...(clip.timing || {}), display: patchedDisplay };
			restore.timing = { ...(clip.timing || {}), display: { ...currentDisplay } };
		}
	}

	return Object.keys(patch).length ? { patch, restore } : null;
};

/**
 * Every clip patch needed to show `values` on the live canvas.
 * Used by the studio's Fill-values preview mode.
 *
 * @param {Object} projectJson - editor.exportProject()
 * @param {Object} values - { name: value }
 * @param {Array} definitions
 * @returns {Array<{clipId: string, patch: Object, restore: Object}>}
 */
export const computeOverlayPatches = (projectJson, values = {}, definitions = []) => {
	const resolved = resolveValues(definitions, values);
	const patches = [];
	for (const clip of clipList(projectJson)) {
		const built = buildClipPatch(clip, resolved);
		if (built && clip.id) patches.push({ clipId: clip.id, ...built });
	}
	return patches;
};

/**
 * Apply values to a whole document, returning a NEW one. Used by the
 * client-side export path, where the exported document is handed to the
 * compositor rather than to the live store.
 *
 * @returns {Object} a new projectJson
 */
export const applyVariables = (projectJson, values = {}, definitions = []) => {
	const resolved = resolveValues(definitions, values);
	const next = structuredClone(projectJson);

	for (const clip of clipList(next)) {
		if (!clip || typeof clip !== 'object') continue;
		const built = buildClipPatch(clip, resolved);
		if (built) Object.assign(clip, built.patch);

		/*
		 * Fit the substituted text to its box.
		 *
		 * Runs on every clip, not just the ones that changed: a clip can inherit
		 * a long value through a binding rather than a token, and a template
		 * whose author set "shrink" expects it to hold either way.
		 *
		 * This happens HERE, at substitution, so the browser export and the
		 * server render — which share no measurement code — bake in the same
		 * answer. See text-fit.js.
		 */
		const fitted = applyFit(clip);
		if (fitted) Object.assign(clip, fitted);
	}

	if (typeof next?.settings?.backgroundColor === 'string') {
		next.settings.backgroundColor = replaceTokens(next.settings.backgroundColor, resolved);
	}
	return next;
};

// ── Writing bindings back onto a clip ────────────────────────────────────

/**
 * Read-modify-write a clip's binding list.
 *
 * `core.clip.update` shallow-assigns unknown keys, so passing a bare
 * `{ metadata: { pictify: … } }` would erase whatever else lives on metadata
 * (the vendored text presets use it). Always start from the live value.
 *
 * @param {Object} clip - the live clip
 * @param {string} target - a BINDING_TARGETS target
 * @param {string|null} variable - the variable name, or null to unbind
 * @returns {Object} the `metadata` value to pass to core.clip.update
 */
export const withBinding = (clip, target, variable) => {
	const metadata = clip?.metadata || {};
	const pictify = metadata.pictify || {};
	const existing = Array.isArray(pictify.bindings) ? pictify.bindings : [];
	const spec = findBindingTarget(target);

	const without = existing.filter((b) => b?.target !== target);
	const bindings = variable
		? [...without, { target, variable, ...(spec?.unit ? { unit: spec.unit } : {}) }]
		: without;

	return { ...metadata, pictify: { ...pictify, bindings } };
};

/**
 * Drop every binding that points at a variable which no longer exists, so a
 * deleted variable can't leave a dangling reference in a saved document.
 *
 * @param {Object} projectJson - a document that is safe to mutate (a clone)
 * @param {Set<string>|string[]} liveNames
 * @returns {number} how many bindings were dropped
 */
export const pruneBindings = (projectJson, liveNames) => {
	const names = liveNames instanceof Set ? liveNames : new Set(liveNames);
	let dropped = 0;
	for (const clip of clipList(projectJson)) {
		const bindings = clip?.metadata?.pictify?.bindings;
		if (!Array.isArray(bindings) || !bindings.length) continue;
		const kept = bindings.filter((b) => names.has(b?.variable));
		if (kept.length !== bindings.length) {
			dropped += bindings.length - kept.length;
			clip.metadata.pictify.bindings = kept;
		}
	}
	return dropped;
};

/**
 * Remove `{{name}}` tokens from a document's text clips, replacing each with
 * the variable's default (or its humanized name, so the clip never goes
 * blank). Called when the user deletes a variable that is still referenced.
 *
 * @param {Object} projectJson - a document that is safe to mutate (a clone)
 * @param {string} name
 * @param {string} [replacement]
 * @returns {number} how many clips changed
 */
export const stripToken = (projectJson, name, replacement) => {
	const value = replacement || humanizeName(name);
	const re = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g');
	let changed = 0;
	for (const clip of clipList(projectJson)) {
		if (typeof clip?.text !== 'string' || !re.test(clip.text)) continue;
		re.lastIndex = 0;
		clip.text = clip.text.replace(re, value);
		changed += 1;
	}
	return changed;
};
