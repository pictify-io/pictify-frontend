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

	const clips = Object.values(projectJson?.clips || {}).map((clip) => {
		const t = clip.transform || {};
		const d = clip.timing?.display || {};
		const entry = {
			id: clip.id,
			type: clip.type,
			name: clip.name || clip.type,
			startS: Math.round(((d.from || 0) / SECOND) * 10) / 10,
			durationS: Math.round((((d.to || 0) - (d.from || 0)) / SECOND) * 10) / 10
		};
		if (Number.isFinite(t.x)) {
			entry.x = Math.round((t.x / width) * 100) / 100;
			entry.y = Math.round((t.y / height) * 100) / 100;
			entry.width = Math.round((t.width / width) * 100) / 100;
			entry.height = Math.round((t.height / height) * 100) / 100;
		}
		if (typeof clip.text === 'string') entry.text = clip.text;
		if (clip.style?.color) entry.color = clip.style.color;
		if (clip.style?.fill) entry.fill = clip.style.fill;
		return entry;
	});

	return {
		canvas: { width, height, fps: settings.fps || 30 },
		durationS: Math.round(((settings.duration || 0) / SECOND) * 10) / 10,
		clips
	};
};

/**
 * The tools, in the order they appear to the model.
 *
 * Each declares its parameters for the schema the model is given, a `validate`
 * that runs against the live document, and an `apply` that returns an
 * operation for the caller to perform through the engine. Nothing here touches
 * the engine directly — the executor stays pure so it can be tested.
 */
export const TOOLS = [
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
export const planToolCalls = (projectJson, calls) => {
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
		const problem = tool.validate(doc, args);
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
	if (!operations?.length) return 'Nothing changed.';
	const counts = operations.reduce((acc, op) => {
		acc[op.op] = (acc[op.op] || 0) + 1;
		return acc;
	}, {});
	const parts = [];
	if (counts.add) parts.push(`added ${counts.add} clip${counts.add === 1 ? '' : 's'}`);
	if (counts.update) parts.push(`changed ${counts.update} clip${counts.update === 1 ? '' : 's'}`);
	if (counts.remove) parts.push(`removed ${counts.remove} clip${counts.remove === 1 ? '' : 's'}`);
	return `${parts.join(', ').replace(/^./, (c) => c.toUpperCase())}.`;
};
