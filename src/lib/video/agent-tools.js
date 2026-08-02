/**
 * The tool table an AI copilot uses to edit a timeline scene.
 *
 * ── Why tools and not "generate me a scene graph" ─────────────────────────
 *
 * The Remotion side of the studio regenerates a whole composition per edit,
 * which is fine when the composition IS the artefact. A timeline scene is not:
 * the user positioned those clips, and regenerating the graph throws that away
 * every time they ask for a colour change. Free-form generation also broke
 * layout badly enough on the Remotion path that strict JSON had to be removed
 * to fix it.
 *
 * So the model proposes OPERATIONS. Each is validated against the live document
 * and applied on its own, which means a bad call costs one operation instead of
 * the scene.
 *
 * ── The unit boundary is the whole design ─────────────────────────────────
 *
 * Tools take FRACTIONS of the composition (0..1) for geometry and SECONDS for
 * time. Internally the engine wants pixels against a canvas whose size the
 * model does not reliably know, and MICROSECONDS. Every unit bug in this
 * codebase — fades in ms next to display in µs, keyframe duration, caption
 * timings — came from that conversion happening in more than one place. Here it
 * happens once, in `toPx` and `toUs`, and the tools above them are unitless.
 *
 * A model asked for pixels will confidently place a title at y=1700 on a
 * 1080x1920 canvas and put it underneath the caption bar. Asked for 0.1, it
 * puts it near the top, on any canvas.
 */

import { createEffectClip } from './effect-params.js';
import { fadePatch } from './clip-style.js';
import { speedPatch, MIN_SPEED, MAX_SPEED } from './clip-speed.js';
import { writeKeyframes } from './keyframes.js';
import { toGradientFill } from './gradients.js';
import { ASPECT_PRESETS } from './scene-settings.js';
import {
	VARIABLE_NAME_RE,
	findBindingTarget,
	bindingTargetsForClip,
	bindingsForClip,
	makeDefinition
} from './variables.js';

const SECOND = 1_000_000;

/** Fraction of a dimension to whole pixels. */
const toPx = (fraction, extent) => Math.round(Math.max(0, Math.min(1, fraction)) * extent);

/** Seconds to microseconds. */
const toUs = (seconds) => Math.max(0, Math.round(Number(seconds) * SECOND));

const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);

const clampFraction = (value) => Math.max(0, Math.min(1, Number(value)));

/**
 * A compact view of the document for the model.
 *
 * The full scene graph is tens of kilobytes of ids, matrices and engine
 * bookkeeping, most of which the model cannot act on and all of which it pays
 * for. This is what it can actually reference: what each clip IS, WHERE it is
 * in fractions, and WHEN — plus the id, because every tool addresses by id.
 */
export const describeDocument = (projectJson) => {
	const settings = projectJson?.settings || {};
	const width = settings.width || 1080;
	const height = settings.height || 1920;
	const frac = (value, extent) => Math.round((value / extent) * 100) / 100;
	const secs = (us) => Math.round((us / SECOND) * 10) / 10;

	const clips = Object.values(projectJson?.clips || {}).map((clip) => {
		const t = clip.transform || {};
		const d = clip.timing?.display || {};
		const style = clip.style || {};

		const entry = {
			id: clip.id,
			type: clip.type,
			name: clip.name || clip.type,
			startS: secs(d.from || 0),
			durationS: secs((d.to || 0) - (d.from || 0))
		};

		if (Number.isFinite(t.x)) {
			entry.x = frac(t.x, width);
			entry.y = frac(t.y, height);
			entry.width = frac(t.width, width);
			entry.height = frac(t.height, height);
			// Layering, because it decides what covers what — and an Effect below
			// its content renders nothing at all.
			if (Number.isFinite(t.zIndex)) entry.layer = t.zIndex;
			if (t.flip?.x || t.flip?.y) entry.flipped = true;
			if (Number.isFinite(t.opacity) && t.opacity !== 1) entry.opacity = t.opacity;
		}

		if (typeof clip.text === 'string') entry.text = clip.text;
		if (style.color) entry.color = style.color;
		if (style.fill) entry.fill = style.fill;
		// Font size as a fraction of the shorter side, matching what add_text takes.
		if (Number.isFinite(style.fontSize)) {
			entry.size = Math.round((style.fontSize / Math.min(width, height)) * 1000) / 1000;
		}
		if (style.stroke?.width > 0) entry.outlined = true;
		if (style.shadow) entry.shadowed = true;

		/*
		 * What a clip IS, not just where it sits.
		 *
		 * Without these the model is reasoning about anonymous rectangles: it
		 * cannot tell an Image from the one already showing the logo, cannot see
		 * that a clip is already animated before adding a second animation, and
		 * cannot know an Effect's key well enough to replace it.
		 */
		if (typeof clip.src === 'string' && clip.src) {
			// Truncated: a signed S3 URL is hundreds of characters of noise, and
			// what matters is that there IS media and roughly which.
			entry.media = clip.src.startsWith('data:')
				? 'embedded'
				: clip.src.split('/').pop().split('?')[0].slice(0, 48);
		}
		if (clip.effectKey) entry.effectKey = clip.effectKey;
		if (clip.transitionKey) entry.transitionKey = clip.transitionKey;

		// Animation: the preset names if it came from a preset, otherwise a
		// summary of the hand-authored keyframes.
		const preset = clip.metadata?.pictify?.animation;
		if (preset?.inPreset || preset?.outPreset || preset?.emphasisPreset) {
			entry.animation = {
				in: preset.inPreset || undefined,
				out: preset.outPreset || undefined,
				emphasis: preset.emphasisPreset || undefined
			};
		} else if (clip.animations?.[0]?.params) {
			const params = clip.animations[0].params;
			const stops = Object.keys(params);
			const props = new Set();
			for (const stop of Object.values(params)) {
				for (const prop of Object.keys(stop || {})) props.add(prop);
			}
			entry.keyframes = { at: stops, animating: [...props] };
		}

		if (clip.type === 'Caption' && Array.isArray(clip.caption?.words)) {
			entry.words = clip.caption.words.length;
		}
		if (Number.isFinite(clip.timing?.playbackRate) && clip.timing.playbackRate !== 1) {
			entry.speed = clip.timing.playbackRate;
		}
		if (clip.timing?.fadeIn?.duration || clip.timing?.fadeOut?.duration) {
			entry.fades = {
				inMs: clip.timing.fadeIn?.duration || 0,
				outMs: clip.timing.fadeOut?.duration || 0
			};
		}
		if (clip.metadata?.pictify?.fit) entry.textFit = clip.metadata.pictify.fit;
		if (Number.isFinite(clip.volume) && clip.volume !== 1) entry.volume = clip.volume;
		if (clip.locked) entry.locked = true;

		return entry;
	});

	return {
		canvas: { width, height, fps: settings.fps || 30 },
		durationS: secs(settings.duration || 0),
		background: settings.backgroundColor || undefined,
		clips
	};
};

/**
 * The user's own media, so the agent can reach for it before searching stock.
 *
 * Without this it has no idea a logo has already been uploaded, and answers
 * "add our logo" with a stock search for the word "logo" — which returns
 * somebody else's.
 *
 * @param {Array<{uid?: string, kind: string, name: string, url: string}>} library
 */
export const describeMedia = (library, limit = 30) =>
	(library || [])
		.slice(0, limit)
		.map((item) => ({
			// The agent references media by NAME, since uids are not stable across
			// sessions and the name is what the user would say out loud.
			name: item.name,
			kind: item.kind,
			source: item.source || 'library'
		}));

/**
 * What the model is allowed to name.
 *
 * Effect keys, animation presets and transition keys all come from the ENGINE's
 * registries, which cannot be imported here — they pull in PixiJS and this
 * module has to stay loadable under `node --test`. So the caller passes them in
 * and the validators check against them.
 *
 * That has a second, more important effect: the same lists go to the model. A
 * model guessing "sparkle" as an effect fails validation every time; a model
 * handed the real 51 names picks one that exists.
 *
 * `animations` is entrance/exit presets; `emphasis` is the looping presets
 * (pulse, wiggle…), kept separate because the two are validated for different
 * parameters and merging them would let an emphasis preset pass as an
 * entrance. `fonts` is family names ("Inter"), not PostScript names — the
 * family is what a person would say, and the caller resolves the file.
 *
 * @typedef {{effects?: string[], animations?: string[], emphasis?: string[], transitions?: string[], fonts?: string[]}} Vocabulary
 */

/**
 * Catalogue lookup, for the discovery tools.
 *
 * The alternative was pasting the catalogues into every prompt. They are 51
 * effects, 123 animation presets and 68 transitions — thousands of tokens on
 * every turn, nearly all of them naming things the user did not ask about, paid
 * for whether the request mentions an effect or not.
 *
 * So the model LOOKS THINGS UP instead. It asks for "film" and gets `oldFilm`
 * and `filmStripPro` back, then calls add_effect with a name that exists. The
 * cost is one extra round trip on the requests that need it, and nothing at all
 * on the ones that do not.
 *
 * Matching is substring, case-insensitive, and capped: "e" should not return
 * the entire catalogue and undo the point of the exercise.
 */
export const searchCatalogue = (values, query, limit = 25) => {
	const all = values || [];
	const needle = String(query || '').trim().toLowerCase();
	const matched = needle ? all.filter((name) => name.toLowerCase().includes(needle)) : all;
	// A search that matches nothing falls back to the head of the list rather
	// than an empty array: the model asked for something, and "here is what
	// exists" is more useful than "no".
	const results = matched.length ? matched : all;
	return { total: results.length, names: results.slice(0, limit) };
};

const inVocabulary = (values, name) =>
	// No list supplied means the caller cannot check, so do not block the call —
	// the panel validates again before applying.
	!values?.length || values.includes(name);

/**
 * A model-chosen id for a clip it is about to add.
 *
 * The add tools return no id, so a model composing a scene in one turn had no
 * way to style what it just created — it invented ids like "text_1" and every
 * follow-up call failed. Letting it NAME the clip closes that loop: add with
 * id "title", then set_font on "title" in the same turn. The caller applies
 * calls one at a time against the live document, so by the time the styling
 * call is validated the clip is real.
 */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;
const idProblem = (doc, id) => {
	if (id === undefined || id === null || id === '') return null;
	if (typeof id !== 'string' || !ID_PATTERN.test(id))
		return 'id must be 1-40 letters, numbers, dashes or underscores.';
	if (doc.clips?.[id]) return `A clip with id ${id} already exists — pick another.`;
	return null;
};

/** Read a dotted path off a clip ('style.colors.0'), for binding defaults. */
const readPath = (clip, target) =>
	String(target)
		.split('.')
		.reduce((node, key) => (node == null ? undefined : node[key]), clip);

const ID_PARAM = 'string, optional — an id you choose, so later calls in this turn can address the new clip';

/**
 * The tools, in the order they appear to the model.
 *
 * Each declares its parameters for the schema the model is given, a `validate`
 * that runs against the live document, and an `apply` that returns an
 * operation for the caller to perform through the engine. Nothing here touches
 * the engine directly — the executor stays pure so it can be tested.
 */
export const TOOLS = [
	/*
	 * Discovery. These READ; they change nothing.
	 *
	 * The executor returns them as `query` operations for the caller to answer,
	 * and the caller then asks the model again with the results. That loop is
	 * what keeps the catalogues out of the prompt.
	 */
	{
		name: 'list_effects',
		description:
			'Look up available visual effects by keyword before using add_effect. Returns real effect keys.',
		params: { query: 'string, e.g. "film" or "glitch"' },
		validate: () => null,
		apply: (doc, args) => ({ op: 'query', list: 'effects', query: String(args.query || '') })
	},
	{
		name: 'list_animations',
		description:
			'Look up entrance and exit animation presets by keyword before using set_animation.',
		params: { query: 'string, e.g. "fade" or "slide"' },
		validate: () => null,
		apply: (doc, args) => ({ op: 'query', list: 'animations', query: String(args.query || '') })
	},
	{
		name: 'list_transitions',
		description: 'Look up transition keys by keyword before using add_transition.',
		params: { query: 'string, e.g. "wipe" or "zoom"' },
		validate: () => null,
		apply: (doc, args) => ({ op: 'query', list: 'transitions', query: String(args.query || '') })
	},
	{
		name: 'list_fonts',
		description:
			'Look up available font families by keyword before using set_font. Returns real family names.',
		params: { query: 'string, e.g. "serif" or "mono" — empty lists popular ones' },
		validate: () => null,
		apply: (doc, args) => ({ op: 'query', list: 'fonts', query: String(args.query || '') })
	},
	{
		name: 'set_text',
		description: "Change a text clip's words.",
		params: { clipId: 'string', text: 'string' },
		validate: (doc, args) => {
			const clip = doc.clips?.[args.clipId];
			if (!clip) return `No clip with id ${args.clipId}.`;
			if (clip.type !== 'Text' && clip.type !== 'Caption') return `${clip.type} clips have no text.`;
			if (typeof args.text !== 'string') return 'text must be a string.';
			return null;
		},
		apply: (doc, args) => ({ op: 'update', clipId: args.clipId, patch: { text: args.text } })
	},
	{
		name: 'set_color',
		description: 'Set a text colour or a shape fill. Hex, like #ff0000.',
		params: { clipId: 'string', color: 'string' },
		validate: (doc, args) => {
			const clip = doc.clips?.[args.clipId];
			if (!clip) return `No clip with id ${args.clipId}.`;
			if (!/^#[0-9a-f]{3,8}$/i.test(String(args.color || ''))) return 'color must be a hex value.';
			return null;
		},
		apply: (doc, args) => {
			const clip = doc.clips[args.clipId];
			// Text and Shape use DIFFERENT colour keys, and writing the wrong one
			// lands on the clip and is never read.
			const key = clip.type === 'Shape' ? 'fill' : 'color';
			return {
				op: 'update',
				clipId: args.clipId,
				patch: { style: { ...(clip.style || {}), [key]: args.color } }
			};
		}
	},
	{
		name: 'move_clip',
		description:
			'Move a clip. x and y are fractions of the canvas from the top left, so 0.5 is the middle.',
		params: { clipId: 'string', x: 'number 0-1', y: 'number 0-1' },
		validate: (doc, args) => {
			const clip = doc.clips?.[args.clipId];
			if (!clip) return `No clip with id ${args.clipId}.`;
			if (num(args.x) === null || num(args.y) === null) return 'x and y must be numbers.';
			return null;
		},
		apply: (doc, args) => {
			const clip = doc.clips[args.clipId];
			const { width, height } = doc.settings || {};
			return {
				op: 'update',
				clipId: args.clipId,
				patch: {
					transform: {
						...clip.transform,
						x: toPx(clampFraction(args.x), width || 1080),
						y: toPx(clampFraction(args.y), height || 1920)
					}
				}
			};
		}
	},
	{
		name: 'resize_clip',
		description: 'Resize a clip. width and height are fractions of the canvas.',
		params: { clipId: 'string', width: 'number 0-1', height: 'number 0-1' },
		validate: (doc, args) => {
			const clip = doc.clips?.[args.clipId];
			if (!clip) return `No clip with id ${args.clipId}.`;
			if (num(args.width) === null || num(args.height) === null)
				return 'width and height must be numbers.';
			if (Number(args.width) <= 0 || Number(args.height) <= 0)
				return 'width and height must be greater than zero.';
			return null;
		},
		apply: (doc, args) => {
			const clip = doc.clips[args.clipId];
			const { width, height } = doc.settings || {};
			return {
				op: 'update',
				clipId: args.clipId,
				patch: {
					transform: {
						...clip.transform,
						width: Math.max(1, toPx(clampFraction(args.width), width || 1080)),
						height: Math.max(1, toPx(clampFraction(args.height), height || 1920))
					}
				}
			};
		}
	},
	{
		name: 'set_timing',
		description: 'Set when a clip appears and how long it lasts, in seconds.',
		params: { clipId: 'string', startS: 'number', durationS: 'number' },
		validate: (doc, args) => {
			if (!doc.clips?.[args.clipId]) return `No clip with id ${args.clipId}.`;
			if (num(args.startS) === null || num(args.durationS) === null)
				return 'startS and durationS must be numbers.';
			if (Number(args.durationS) <= 0) return 'durationS must be greater than zero.';
			return null;
		},
		apply: (doc, args) => {
			const clip = doc.clips[args.clipId];
			const from = toUs(args.startS);
			const span = Math.max(1, toUs(args.durationS));
			return {
				op: 'update',
				clipId: args.clipId,
				patch: {
					// The whole timing object: core.clip.update merges only one level
					// deep, so a partial display would lose its sibling key.
					timing: {
						...clip.timing,
						display: { from, to: from + span },
						duration: span
					}
				}
			};
		}
	},
	{
		name: 'delete_clip',
		description: 'Remove a clip from the scene.',
		params: { clipId: 'string' },
		validate: (doc, args) =>
			doc.clips?.[args.clipId] ? null : `No clip with id ${args.clipId}.`,
		apply: (doc, args) => ({ op: 'remove', clipId: args.clipId })
	},
	/*
	 * Scene-level tools. Without these the agent literally cannot finish a
	 * composition: it can place every clip perfectly and still ship a video
	 * that runs four seconds too long over a default background.
	 */
	{
		name: 'set_background',
		description: 'Set the scene background colour. Hex, like #111827.',
		params: { color: 'string hex' },
		validate: (doc, args) =>
			/^#[0-9a-f]{3,8}$/i.test(String(args.color || '')) ? null : 'color must be a hex value.',
		apply: (doc, args) => ({ op: 'settings', patch: { backgroundColor: args.color } })
	},
	{
		name: 'set_scene_duration',
		description:
			'Set the total scene duration in seconds. Match it to the end of the last clip — no dead air.',
		params: { durationS: 'number' },
		validate: (doc, args) => {
			if (num(args.durationS) === null) return 'durationS must be a number.';
			if (Number(args.durationS) <= 0) return 'durationS must be greater than zero.';
			return null;
		},
		apply: (doc, args) => ({ op: 'settings', patch: { duration: toUs(args.durationS) } })
	},
	{
		name: 'set_layer',
		description:
			'Set what covers what. Background media 0-1, shapes 2-10, text 20-40, full-frame effects 900.',
		params: { clipId: 'string', layer: 'integer' },
		validate: (doc, args) => {
			if (!doc.clips?.[args.clipId]) return `No clip with id ${args.clipId}.`;
			if (num(args.layer) === null) return 'layer must be a number.';
			return null;
		},
		apply: (doc, args) => {
			const clip = doc.clips[args.clipId];
			return {
				op: 'update',
				clipId: args.clipId,
				patch: {
					transform: {
						...clip.transform,
						zIndex: Math.max(0, Math.min(1000, Math.round(Number(args.layer))))
					}
				}
			};
		}
	},
	{
		name: 'set_opacity',
		description: 'Set a clip’s opacity, 0 (invisible) to 1 (solid).',
		params: { clipId: 'string', opacity: 'number 0-1' },
		validate: (doc, args) => {
			if (!doc.clips?.[args.clipId]) return `No clip with id ${args.clipId}.`;
			if (num(args.opacity) === null) return 'opacity must be a number.';
			return null;
		},
		apply: (doc, args) => {
			const clip = doc.clips[args.clipId];
			return {
				op: 'update',
				clipId: args.clipId,
				patch: {
					transform: { ...clip.transform, opacity: clampFraction(args.opacity) }
				}
			};
		}
	},
	{
		name: 'set_fades',
		description:
			'Fade a clip in and/or out, durations in seconds. Use 0 to clear a fade.',
		params: { clipId: 'string', fadeInS: 'number', fadeOutS: 'number' },
		validate: (doc, args) => {
			if (!doc.clips?.[args.clipId]) return `No clip with id ${args.clipId}.`;
			if (num(args.fadeInS ?? 0) === null || num(args.fadeOutS ?? 0) === null)
				return 'fadeInS and fadeOutS must be numbers.';
			return null;
		},
		apply: (doc, args) => {
			const clip = doc.clips[args.clipId];
			/*
			 * fadePatch owns the seconds→MILLISECONDS boundary (fades are the one
			 * timing field the engine reads in ms) and clamps the pair so the
			 * ramps cannot cross. Applied sequentially so the second fade sees
			 * the first one's clamp.
			 */
			const afterIn = { ...clip, ...fadePatch(clip, 'in', Math.round(Number(args.fadeInS ?? 0) * 1000)) };
			const patch = fadePatch(afterIn, 'out', Math.round(Number(args.fadeOutS ?? 0) * 1000));
			return { op: 'update', clipId: args.clipId, patch };
		}
	},
	{
		name: 'set_font_size',
		description:
			'Set a text clip’s type size, as a fraction of the shorter canvas side. Titles 0.055-0.09, supporting text 0.03-0.045.',
		params: { clipId: 'string', size: 'number 0-1' },
		validate: (doc, args) => {
			const clip = doc.clips?.[args.clipId];
			if (!clip) return `No clip with id ${args.clipId}.`;
			if (clip.type !== 'Text' && clip.type !== 'Caption')
				return `${clip.type} clips have no type size.`;
			if (num(args.size) === null || Number(args.size) <= 0)
				return 'size must be a number greater than zero.';
			return null;
		},
		apply: (doc, args) => {
			const clip = doc.clips[args.clipId];
			const { width = 1080, height = 1920 } = doc.settings || {};
			const fontSize = Math.max(
				12,
				Math.round(clampFraction(args.size) * Math.min(width, height))
			);
			return {
				op: 'update',
				clipId: args.clipId,
				patch: {
					style: { ...(clip.style || {}), fontSize },
					// The box grows with the type, or the bigger text wraps inside
					// yesterday's box and shows as one squashed line.
					transform: {
						...clip.transform,
						height: Math.max(Number(clip.transform?.height) || 0, Math.round(fontSize * 1.6))
					}
				}
			};
		}
	},
	{
		name: 'add_effect',
		description:
			'Apply a visual effect over the whole frame for a stretch of time. Use one of the listed effect keys.',
		params: { effectKey: 'string', startS: 'number', durationS: 'number', id: ID_PARAM },
		validate: (doc, args, vocabulary) => {
			if (typeof args.effectKey !== 'string' || !args.effectKey) return 'effectKey is required.';
			if (!inVocabulary(vocabulary?.effects, args.effectKey))
				return `No effect called ${args.effectKey}.`;
			return idProblem(doc, args.id);
		},
		apply: (doc, args) => ({
			op: 'add',
			// createEffectClip owns the z-index that puts an effect ABOVE the
			// content it shades — below it, the effect renders nothing at all.
			clip: {
				...(args.id ? { id: args.id } : {}),
				...createEffectClip({
					key: args.effectKey,
					fromUs: toUs(args.startS ?? 0),
					durationUs: toUs(args.durationS ?? 3)
				})
			}
		})
	},
	{
		name: 'set_animation',
		description:
			'Give a clip an entrance, exit and/or looping emphasis animation, by preset name from the list.',
		params: {
			clipId: 'string',
			inPreset: 'string or empty',
			outPreset: 'string or empty',
			emphasisPreset: 'string or empty — a looping animation like a pulse'
		},
		validate: (doc, args, vocabulary) => {
			if (!doc.clips?.[args.clipId]) return `No clip with id ${args.clipId}.`;
			for (const key of ['inPreset', 'outPreset']) {
				const value = args[key];
				if (value && !inVocabulary(vocabulary?.animations, value))
					return `No animation called ${value}.`;
			}
			// Checked against its OWN list: an emphasis preset loops for the whole
			// clip, and letting one pass as an entrance (or the reverse) produces
			// motion nobody asked for.
			if (args.emphasisPreset && !inVocabulary(vocabulary?.emphasis, args.emphasisPreset))
				return `No emphasis animation called ${args.emphasisPreset}.`;
			if (!args.inPreset && !args.outPreset && !args.emphasisPreset)
				return 'Give at least one preset.';
			return null;
		},
		// Resolved by the caller: composing presets into keyframes needs the
		// engine's preset registry, which this module cannot import.
		apply: (doc, args) => ({
			op: 'animate',
			clipId: args.clipId,
			inPreset: args.inPreset || '',
			outPreset: args.outPreset || '',
			emphasisPreset: args.emphasisPreset || ''
		})
	},
	{
		name: 'add_transition',
		description:
			'Blend from the previous clip into this one. Use a transition key from the list.',
		params: { clipId: 'string', transitionKey: 'string', durationS: 'number' },
		validate: (doc, args, vocabulary) => {
			if (!doc.clips?.[args.clipId]) return `No clip with id ${args.clipId}.`;
			if (!args.transitionKey) return 'transitionKey is required.';
			if (!inVocabulary(vocabulary?.transitions, args.transitionKey))
				return `No transition called ${args.transitionKey}.`;
			return null;
		},
		// Also caller-resolved: a transition is its own clip joining a PAIR, and
		// finding the previous clip needs the track order.
		apply: (doc, args) => ({
			op: 'transition',
			clipId: args.clipId,
			transitionKey: args.transitionKey,
			durationUs: toUs(args.durationS ?? 0.6)
		})
	},
	{
		name: 'add_stock',
		description:
			'Search the stock library and place the first good match. kind is "image" or "video".',
		params: { kind: 'image or video', query: 'string', startS: 'number', durationS: 'number', id: ID_PARAM },
		validate: (doc, args) => {
			if (args.kind !== 'image' && args.kind !== 'video') return 'kind must be image or video.';
			if (typeof args.query !== 'string' || !args.query.trim()) return 'query is required.';
			return idProblem(doc, args.id);
		},
		// The only tool that needs the network. Resolved by the caller, which
		// owns the stock client; planning stays synchronous and pure.
		apply: (doc, args) => ({
			op: 'stock',
			kind: args.kind,
			query: args.query.trim(),
			fromUs: toUs(args.startS ?? 0),
			durationUs: toUs(args.durationS ?? 5),
			id: args.id || ''
		})
	},
	{
		name: 'add_media',
		description:
			"Place one of the user's own uploaded media items, by the name shown in the media list. Prefer this over add_stock when something suitable is already uploaded.",
		params: { name: 'string', startS: 'number', durationS: 'number', id: ID_PARAM },
		validate: (doc, args) => {
			if (typeof args.name !== 'string' || !args.name.trim()) return 'name is required.';
			return idProblem(doc, args.id);
		},
		// Resolved by the caller, which holds the media library.
		apply: (doc, args) => ({
			op: 'media',
			name: args.name.trim(),
			fromUs: toUs(args.startS ?? 0),
			durationUs: toUs(args.durationS ?? 5),
			id: args.id || ''
		})
	},
	{
		name: 'add_shape',
		description:
			'Add a rectangle — solid, or a gradient when gradientTo is given. A transparent-to-dark gradient behind text is the standard scrim over video. Geometry is fractions of the canvas. Hex colours may carry alpha (#00000000 is fully transparent).',
		params: {
			x: 'number 0-1',
			y: 'number 0-1',
			width: 'number 0-1',
			height: 'number 0-1',
			fill: 'string hex',
			gradientTo: 'string hex or empty — makes the fill a gradient from fill to this',
			gradientAngle: 'number degrees, default 180 (top to bottom)',
			opacity: 'number 0-1, default 1',
			radius: 'number 0-1',
			startS: 'number',
			durationS: 'number',
			id: ID_PARAM
		},
		validate: (doc, args) => {
			for (const key of ['x', 'y', 'width', 'height']) {
				if (num(args[key]) === null) return `${key} must be a number.`;
			}
			if (Number(args.width) <= 0 || Number(args.height) <= 0)
				return 'width and height must be greater than zero.';
			if (args.gradientTo && !/^#[0-9a-f]{3,8}$/i.test(String(args.gradientTo)))
				return 'gradientTo must be a hex value.';
			return idProblem(doc, args.id);
		},
		apply: (doc, args) => {
			const { width = 1080, height = 1920 } = doc.settings || {};
			const from = toUs(args.startS ?? 0);
			const span = Math.max(1, toUs(args.durationS ?? 5));
			const w = Math.max(1, toPx(clampFraction(args.width), width));
			const h = Math.max(1, toPx(clampFraction(args.height), height));
			const base = /^#[0-9a-f]{3,8}$/i.test(String(args.fill || '')) ? args.fill : '#3b82f6';
			/*
			 * A gradient rides IN the fill string as CSS — the one representation
			 * ShapeClip round-trips, because it rebuilds `style` from a fixed key
			 * list on deserialize and would drop any separate descriptor key.
			 * toGradientFill owns the format.
			 */
			const fill = args.gradientTo
				? toGradientFill({
						type: 'linear',
						angle: Number.isFinite(Number(args.gradientAngle)) ? Number(args.gradientAngle) : 180,
						colors: [base, args.gradientTo]
					})
				: base;
			return {
				op: 'add',
				clip: {
					...(args.id ? { id: args.id } : {}),
					type: 'Shape',
					name: args.gradientTo ? 'Gradient' : 'Shape',
					shapeType: 'rectangle',
					src: 'shape://rectangle',
					timing: {
						display: { from, to: from + span },
						trim: { from: 0, to: span },
						duration: span,
						playbackRate: 1
					},
					transform: {
						// Centred on the point, like add_text: x is where the shape
						// should BE, not where its left edge goes.
						x: toPx(clampFraction(args.x), width) - Math.round(w / 2),
						y: toPx(clampFraction(args.y), height) - Math.round(h / 2),
						width: w,
						height: h,
						angle: 0,
						opacity: args.opacity !== undefined ? clampFraction(args.opacity) : 1,
						zIndex: 2
					},
					style: {
						fill,
						fillOpacity: 1,
						borderRadius: Math.round(clampFraction(args.radius ?? 0) * Math.min(w, h))
					},
					metadata: {},
					locked: false
				}
			};
		}
	},
	{
		name: 'add_text',
		description:
			'Add a text clip. x and y are fractions of the canvas; size is a fraction of the canvas height.',
		params: {
			text: 'string',
			x: 'number 0-1',
			y: 'number 0-1',
			size: 'number 0-1',
			color: 'string hex',
			startS: 'number',
			durationS: 'number',
			id: ID_PARAM
		},
		validate: (doc, args) => {
			if (typeof args.text !== 'string' || !args.text.trim()) return 'text is required.';
			if (num(args.x) === null || num(args.y) === null) return 'x and y must be numbers.';
			return idProblem(doc, args.id);
		},
		apply: (doc, args) => {
			const { width = 1080, height = 1920 } = doc.settings || {};
			const from = toUs(args.startS ?? 0);
			const span = Math.max(1, toUs(args.durationS ?? 5));
			// Sized off the SHORTER side so type reads the same on portrait and
			// landscape, which is how starters.js does it.
			const fontSize = Math.max(
				12,
				Math.round(clampFraction(args.size ?? 0.05) * Math.min(width, height))
			);
			const boxWidth = Math.round(width * 0.86);
			return {
				op: 'add',
				clip: {
					...(args.id ? { id: args.id } : {}),
					type: 'Text',
					name: args.text.slice(0, 24) || 'Text',
					text: args.text,
					timing: {
						display: { from, to: from + span },
						trim: { from: 0, to: span },
						duration: span,
						playbackRate: 1
					},
					transform: {
						x: toPx(clampFraction(args.x), width) - Math.round(boxWidth / 2),
						y: toPx(clampFraction(args.y), height),
						width: boxWidth,
						height: Math.round(fontSize * 1.6),
						angle: 0,
						opacity: 1,
						zIndex: 20
					},
					style: {
						fontSize,
						fontFamily: 'Inter-Bold',
						color: /^#[0-9a-f]{3,8}$/i.test(String(args.color || '')) ? args.color : '#ffffff',
						align: 'center'
					},
					metadata: {},
					locked: false
				}
			};
		}
	},
	{
		name: 'set_font',
		description:
			'Set a text clip’s font, by family name from list_fonts. One display family plus one body family is plenty for a whole video.',
		params: { clipId: 'string', family: 'string, e.g. "Playfair Display"' },
		validate: (doc, args, vocabulary) => {
			const clip = doc.clips?.[args.clipId];
			if (!clip) return `No clip with id ${args.clipId}.`;
			if (clip.type !== 'Text' && clip.type !== 'Caption') return `${clip.type} clips have no font.`;
			if (typeof args.family !== 'string' || !args.family.trim()) return 'family is required.';
			if (!inVocabulary(vocabulary?.fonts, args.family)) return `No font called ${args.family}.`;
			return null;
		},
		// Resolved by the caller: a font is a FILE, and applying one means
		// loading it into the engine's font manager before the style points at
		// it — pointing first paints the fallback font forever.
		apply: (doc, args) => ({ op: 'font', clipId: args.clipId, family: args.family.trim() })
	},
	{
		name: 'set_volume',
		description: 'Set how loud a video or audio clip plays, 0 (muted) to 1 (full).',
		params: { clipId: 'string', volume: 'number 0-1' },
		validate: (doc, args) => {
			const clip = doc.clips?.[args.clipId];
			if (!clip) return `No clip with id ${args.clipId}.`;
			if (clip.type !== 'Video' && clip.type !== 'Audio')
				return `${clip.type} clips make no sound.`;
			if (num(args.volume) === null) return 'volume must be a number.';
			return null;
		},
		// Top-level on the clip, not in style: that is where the engine's own
		// volume control writes it.
		apply: (doc, args) => ({
			op: 'update',
			clipId: args.clipId,
			patch: { volume: clampFraction(args.volume) }
		})
	},
	{
		name: 'ken_burns',
		description:
			'Give a full-frame video or image slow, continuous motion — the standard way to keep a still from sitting dead. Replaces any animation preset on the clip.',
		params: {
			clipId: 'string',
			move: 'push_in, pull_out, pan_left or pan_right',
			strength: 'subtle, medium or strong — default subtle'
		},
		validate: (doc, args) => {
			const clip = doc.clips?.[args.clipId];
			if (!clip) return `No clip with id ${args.clipId}.`;
			if (clip.type !== 'Video' && clip.type !== 'Image' && clip.type !== 'Backdrop')
				return `ken_burns is for media, not ${clip.type} clips.`;
			if (!['push_in', 'pull_out', 'pan_left', 'pan_right'].includes(args.move))
				return 'move must be push_in, pull_out, pan_left or pan_right.';
			return null;
		},
		apply: (doc, args) => {
			const clip = doc.clips[args.clipId];
			const display = clip.timing?.display || {};
			const durationUs = Math.max(1, (display.to || 0) - (display.from || 0));
			/*
			 * Deliberately gentle numbers. Ken Burns reads as production value at
			 * 6% and as a screensaver at 30% — and every move keeps enough scale
			 * that the frame edges never show.
			 */
			const strength = { subtle: 1, medium: 2, strong: 3 }[args.strength] || 1;
			const zoom = 1 + 0.06 * strength;
			const drift = Math.round((Number(clip.transform?.width) || 1080) * 0.03 * strength);

			const frames =
				args.move === 'push_in'
					? [
							{ at: 0, props: { scale: 1 } },
							{ at: 1, props: { scale: zoom } }
						]
					: args.move === 'pull_out'
						? [
								{ at: 0, props: { scale: zoom } },
								{ at: 1, props: { scale: 1 } }
							]
						: [
								// Pans hold a fixed zoom so the drifting edge never
								// exposes the background behind the media.
								{ at: 0, props: { scale: zoom, x: 0 } },
								{ at: 1, props: { scale: zoom, x: args.move === 'pan_left' ? -drift : drift } }
							];

			/*
			 * The engine gives a clip ONE animation slot, so this replaces any
			 * preset — and the preset's metadata flag has to go with it, or the
			 * clip reports having a preset it no longer plays.
			 */
			const pictify = { ...(clip.metadata?.pictify || {}) };
			delete pictify.animation;
			return {
				op: 'update',
				clipId: args.clipId,
				patch: {
					animations: writeKeyframes(frames, durationUs),
					metadata: { ...(clip.metadata || {}), pictify }
				}
			};
		}
	},
	{
		name: 'add_captions',
		description:
			'Transcribe the speech in a video or audio clip and add word-timed caption clips. Use once per spoken clip.',
		params: { clipId: 'string — the clip whose speech to caption' },
		validate: (doc, args) => {
			const clip = doc.clips?.[args.clipId];
			if (!clip) return `No clip with id ${args.clipId}.`;
			if (clip.type !== 'Video' && clip.type !== 'Audio')
				return `${clip.type} clips have no speech to caption.`;
			// The transcription service fetches the file itself, so a blob: or
			// data: URL from an unfinished upload cannot be captioned.
			if (!/^https?:\/\//.test(String(clip.src || '')))
				return 'That clip has not finished uploading, so it cannot be transcribed yet.';
			return null;
		},
		// Resolved by the caller, which owns the transcription service.
		apply: (doc, args) => ({ op: 'captions', clipId: args.clipId })
	},
	{
		name: 'set_speed',
		description: `Play a video or audio clip faster or slower, ${MIN_SPEED}x to ${MAX_SPEED}x. The clip's length on the timeline rescales to match.`,
		params: { clipId: 'string', speed: 'number, 1 is normal — 0.5 is half speed' },
		validate: (doc, args) => {
			const clip = doc.clips?.[args.clipId];
			if (!clip) return `No clip with id ${args.clipId}.`;
			if (clip.type !== 'Video' && clip.type !== 'Audio')
				return `${clip.type} clips have no playback speed.`;
			if (num(args.speed) === null || Number(args.speed) <= 0)
				return 'speed must be a number greater than zero.';
			return null;
		},
		apply: (doc, args) => {
			const clip = doc.clips[args.clipId];
			// speedPatch owns the retiming: the display window rescales around a
			// fixed start, and 1x -> 2x -> 1x returns the original length.
			return { op: 'update', clipId: args.clipId, patch: speedPatch(clip, Number(args.speed)) };
		}
	},
	{
		name: 'set_trim',
		description:
			'Choose where in the SOURCE file a video or audio clip starts playing, in seconds. The clip keeps its place and length on the timeline; only which part of the footage plays changes.',
		params: { clipId: 'string', sourceStartS: 'number — seconds into the source file' },
		validate: (doc, args) => {
			const clip = doc.clips?.[args.clipId];
			if (!clip) return `No clip with id ${args.clipId}.`;
			if (clip.type !== 'Video' && clip.type !== 'Audio')
				return `${clip.type} clips have no source to trim.`;
			if (num(args.sourceStartS) === null || Number(args.sourceStartS) < 0)
				return 'sourceStartS must be a number, zero or more.';
			return null;
		},
		apply: (doc, args) => {
			const clip = doc.clips[args.clipId];
			const timing = clip.timing || {};
			const display = timing.display || {};
			const from = toUs(args.sourceStartS);
			// The amount of SOURCE the clip consumes: its timeline span scaled by
			// how fast it plays. A 4s window at 2x eats 8s of footage.
			const rate = Number(timing.playbackRate) > 0 ? Number(timing.playbackRate) : 1;
			const span = Math.max(1, Math.round(((display.to || 0) - (display.from || 0)) * rate));
			return {
				op: 'update',
				clipId: args.clipId,
				patch: {
					// The whole timing object: core.clip.update merges one level deep.
					timing: { ...timing, trim: { from, to: from + span } }
				}
			};
		}
	},
	{
		name: 'make_variable',
		description:
			"Turn part of a clip into a render-time variable — 'parameterise this template' so the API, workflows and batches can fill it per render. target 'text' swaps the clip's words for a {{token}} and keeps the current words as the default; other targets bind a field. The variable keeps rendering the current value until a caller overrides it.",
		params: {
			clipId: 'string',
			name: 'string — identifier like recipientName (letters, digits, underscore, no spaces)',
			target:
				"what to parameterise: 'text', or one of: src, style.color, style.fill, style.background.color, style.colors.0, style.colors.1, style.colors.2, transform.opacity, timing.display.from, timing.display.to",
			description: 'string, optional — shown as help text on the render form'
		},
		validate: (doc, args) => {
			const clip = doc.clips?.[args.clipId];
			if (!clip) return `No clip with id ${args.clipId}.`;
			if (!VARIABLE_NAME_RE.test(String(args.name || '')))
				return 'name must be an identifier: letters, digits and underscores, not starting with a digit.';
			if (args.target === 'text') {
				if (clip.type !== 'Text' && clip.type !== 'Caption')
					return `${clip.type} clips have no text — pick a binding target instead.`;
				return null;
			}
			const targetDef = findBindingTarget(args.target);
			if (!targetDef)
				return `Unknown target ${args.target}. Use 'text' or one of the listed binding targets.`;
			if (!bindingTargetsForClip(clip.type).includes(targetDef))
				return `${clip.type} clips cannot bind ${args.target}.`;
			return null;
		},
		apply: (doc, args) => {
			const clip = doc.clips[args.clipId];
			const name = String(args.name);
			const description = typeof args.description === 'string' ? args.description.slice(0, 500) : '';

			if (args.target === 'text') {
				/*
				 * The current words BECOME the default, so the template renders
				 * identically until a caller overrides the variable — turning a
				 * design into a template must never change what it looks like.
				 */
				const definition = { ...makeDefinition(name, 'text', clip.text || ''), description };
				return {
					op: 'variable',
					clipId: args.clipId,
					patch: { text: `{{${name}}}` },
					define: definition
				};
			}

			const targetDef = findBindingTarget(args.target);
			const raw = readPath(clip, args.target);
			// Timing binds in SECONDS (the one unit callers can reason about);
			// the stored value is microseconds.
			const defaultValue =
				targetDef.unit === 'seconds' && Number.isFinite(Number(raw))
					? Math.round((Number(raw) / SECOND) * 100) / 100
					: raw ?? '';
			const definition = {
				...makeDefinition(name, targetDef.typeFor(clip.type), defaultValue),
				description
			};
			// One binding per target: re-parameterising a field replaces its
			// previous variable rather than stacking two writers on one slot.
			const bindings = [
				...bindingsForClip(clip).filter((b) => b?.target !== args.target),
				{ target: args.target, variable: name }
			];
			return {
				op: 'variable',
				clipId: args.clipId,
				patch: {
					metadata: {
						...(clip.metadata || {}),
						pictify: { ...(clip.metadata?.pictify || {}), bindings }
					}
				},
				define: definition
			};
		}
	},
	{
		name: 'set_canvas_size',
		description: `Change the canvas aspect: ${ASPECT_PRESETS.map((p) => `${p.id} (${p.ratio})`).join(', ')}. Existing clips keep their pixel positions, so change this FIRST, before placing anything.`,
		params: { aspect: `string: ${ASPECT_PRESETS.map((p) => p.id).join(', ')}` },
		validate: (doc, args) =>
			ASPECT_PRESETS.some((preset) => preset.id === args.aspect)
				? null
				: `aspect must be one of: ${ASPECT_PRESETS.map((p) => p.id).join(', ')}.`,
		apply: (doc, args) => {
			const preset = ASPECT_PRESETS.find((entry) => entry.id === args.aspect);
			return { op: 'settings', patch: { width: preset.width, height: preset.height } };
		}
	}
];

export const toolByName = (name) => TOOLS.find((tool) => tool.name === name) || null;

/** The tool table as a schema to hand the model. */
export const toolSchema = () =>
	TOOLS.map((tool) => ({
		name: tool.name,
		description: tool.description,
		params: tool.params
	}));

/**
 * Validate and resolve a list of tool calls into engine operations.
 *
 * Every call is checked against the document BEFORE any is applied, and a
 * failure is reported per call rather than aborting the batch: a model that
 * gets four edits right and one wrong should land the four. The caller applies
 * the operations and owns undo.
 *
 * @param {object} projectJson - the live document
 * @param {Array<{name: string, args: object}>} calls
 * @returns {{operations: Array, errors: Array<{name: string, error: string}>}}
 */
export const planToolCalls = (projectJson, calls, vocabulary = {}) => {
	const doc = projectJson || {};
	const operations = [];
	const errors = [];

	for (const call of calls || []) {
		const tool = toolByName(call?.name);
		if (!tool) {
			errors.push({ name: call?.name || '(unnamed)', error: 'Unknown tool.' });
			continue;
		}
		const args = call.args || {};
		const problem = tool.validate(doc, args, vocabulary);
		if (problem) {
			errors.push({ name: tool.name, error: problem });
			continue;
		}
		operations.push({ tool: tool.name, ...tool.apply(doc, args) });
	}

	return { operations, errors };
};

/** A short, human sentence for what a batch did, for the chat transcript. */
export const summarizeOperations = (operations) => {
	// Lookups are not edits: a turn that only looked things up changed nothing.
	const changes = (operations || []).filter((op) => op.op !== 'query');
	if (!changes.length) return 'Nothing changed.';
	const counts = changes.reduce((acc, op) => {
		acc[op.op] = (acc[op.op] || 0) + 1;
		return acc;
	}, {});
	const parts = [];
	if (counts.add) parts.push(`added ${counts.add} clip${counts.add === 1 ? '' : 's'}`);
	if (counts.update) parts.push(`changed ${counts.update} clip${counts.update === 1 ? '' : 's'}`);
	if (counts.remove) parts.push(`removed ${counts.remove} clip${counts.remove === 1 ? '' : 's'}`);
	if (counts.animate) parts.push(`animated ${counts.animate} clip${counts.animate === 1 ? '' : 's'}`);
	if (counts.transition) parts.push(`added ${counts.transition} transition${counts.transition === 1 ? '' : 's'}`);
	if (counts.stock) parts.push(`added ${counts.stock} stock clip${counts.stock === 1 ? '' : 's'}`);
	if (counts.media) parts.push(`placed ${counts.media} media item${counts.media === 1 ? '' : 's'}`);
	if (counts.font) parts.push(`changed ${counts.font} font${counts.font === 1 ? '' : 's'}`);
	if (counts.captions) parts.push(`captioned ${counts.captions} clip${counts.captions === 1 ? '' : 's'}`);
	if (counts.variable)
		parts.push(`parameterised ${counts.variable} field${counts.variable === 1 ? '' : 's'}`);
	if (counts.settings) parts.push(`adjusted the scene`);
	return `${parts.join(', ').replace(/^./, (c) => c.toUpperCase())}.`;
};
