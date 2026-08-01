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
 * @typedef {{effects?: string[], animations?: string[], transitions?: string[]}} Vocabulary
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
	{
		name: 'add_effect',
		description:
			'Apply a visual effect over the whole frame for a stretch of time. Use one of the listed effect keys.',
		params: { effectKey: 'string', startS: 'number', durationS: 'number' },
		validate: (doc, args, vocabulary) => {
			if (typeof args.effectKey !== 'string' || !args.effectKey) return 'effectKey is required.';
			if (!inVocabulary(vocabulary?.effects, args.effectKey))
				return `No effect called ${args.effectKey}.`;
			return null;
		},
		apply: (doc, args) => ({
			op: 'add',
			// createEffectClip owns the z-index that puts an effect ABOVE the
			// content it shades — below it, the effect renders nothing at all.
			clip: createEffectClip({
				key: args.effectKey,
				fromUs: toUs(args.startS ?? 0),
				durationUs: toUs(args.durationS ?? 3)
			})
		})
	},
	{
		name: 'set_animation',
		description:
			'Give a clip an entrance and/or exit animation, by preset name from the list.',
		params: { clipId: 'string', inPreset: 'string or empty', outPreset: 'string or empty' },
		validate: (doc, args, vocabulary) => {
			if (!doc.clips?.[args.clipId]) return `No clip with id ${args.clipId}.`;
			for (const key of ['inPreset', 'outPreset']) {
				const value = args[key];
				if (value && !inVocabulary(vocabulary?.animations, value))
					return `No animation called ${value}.`;
			}
			if (!args.inPreset && !args.outPreset) return 'Give at least one preset.';
			return null;
		},
		// Resolved by the caller: composing presets into keyframes needs the
		// engine's preset registry, which this module cannot import.
		apply: (doc, args) => ({
			op: 'animate',
			clipId: args.clipId,
			inPreset: args.inPreset || '',
			outPreset: args.outPreset || ''
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
		params: { kind: 'image or video', query: 'string', startS: 'number', durationS: 'number' },
		validate: (doc, args) => {
			if (args.kind !== 'image' && args.kind !== 'video') return 'kind must be image or video.';
			if (typeof args.query !== 'string' || !args.query.trim()) return 'query is required.';
			return null;
		},
		// The only tool that needs the network. Resolved by the caller, which
		// owns the stock client; planning stays synchronous and pure.
		apply: (doc, args) => ({
			op: 'stock',
			kind: args.kind,
			query: args.query.trim(),
			fromUs: toUs(args.startS ?? 0),
			durationUs: toUs(args.durationS ?? 5)
		})
	},
	{
		name: 'add_media',
		description:
			"Place one of the user's own uploaded media items, by the name shown in the media list. Prefer this over add_stock when something suitable is already uploaded.",
		params: { name: 'string', startS: 'number', durationS: 'number' },
		validate: (doc, args) => {
			if (typeof args.name !== 'string' || !args.name.trim()) return 'name is required.';
			return null;
		},
		// Resolved by the caller, which holds the media library.
		apply: (doc, args) => ({
			op: 'media',
			name: args.name.trim(),
			fromUs: toUs(args.startS ?? 0),
			durationUs: toUs(args.durationS ?? 5)
		})
	},
	{
		name: 'add_shape',
		description: 'Add a coloured rectangle. Geometry is fractions of the canvas.',
		params: {
			x: 'number 0-1',
			y: 'number 0-1',
			width: 'number 0-1',
			height: 'number 0-1',
			fill: 'string hex',
			radius: 'number 0-1',
			startS: 'number',
			durationS: 'number'
		},
		validate: (doc, args) => {
			for (const key of ['x', 'y', 'width', 'height']) {
				if (num(args[key]) === null) return `${key} must be a number.`;
			}
			if (Number(args.width) <= 0 || Number(args.height) <= 0)
				return 'width and height must be greater than zero.';
			return null;
		},
		apply: (doc, args) => {
			const { width = 1080, height = 1920 } = doc.settings || {};
			const from = toUs(args.startS ?? 0);
			const span = Math.max(1, toUs(args.durationS ?? 5));
			const w = Math.max(1, toPx(clampFraction(args.width), width));
			const h = Math.max(1, toPx(clampFraction(args.height), height));
			return {
				op: 'add',
				clip: {
					type: 'Shape',
					name: 'Shape',
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
						opacity: 1,
						zIndex: 2
					},
					style: {
						fill: /^#[0-9a-f]{3,8}$/i.test(String(args.fill || '')) ? args.fill : '#3b82f6',
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
			durationS: 'number'
		},
		validate: (doc, args) => {
			if (typeof args.text !== 'string' || !args.text.trim()) return 'text is required.';
			if (num(args.x) === null || num(args.y) === null) return 'x and y must be numbers.';
			return null;
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
	return `${parts.join(', ').replace(/^./, (c) => c.toUpperCase())}.`;
};
