/**
 * Transitions for the video studio.
 *
 * A transition is its own clip: `type: 'Transition'` with a `transitionKey`
 * plus `fromClipId` / `toClipId`. At load, the engine resolves those ids to
 * sprites and renders the blend across the clip's display window.
 *
 * REQUIRES patches/@openvideo+engine-pixi+1.3.2.patch. Upstream,
 * Compositor.addSprite pushes `await clip.clone()` and clone() mints a fresh
 * id, so fromClipId/toClipId resolved to nothing and every transition rendered
 * as a hard cut — silently, with no error. The patch carries identity across
 * the clone.
 *
 * ── Why this is authored from the properties panel ─────────────────────
 *
 * The obvious home is a drag target between two clips on the timeline, but the
 * timeline is a vendored canvas and drag-drop into it is a much larger job than
 * the feature is worth. A transition always joins a clip to the one before it,
 * so "Transition in" on the selected clip expresses the same thing with a
 * dropdown, and reads naturally next to the clip's other properties.
 */
import { TRANSITION_CATALOG } from '@openvideo/core';

/** Default blend length. Long enough to read, short enough not to eat a clip. */
export const DEFAULT_TRANSITION_US = 600_000;
export const MIN_TRANSITION_US = 100_000;

/** Category display order — plainest first, so the useful ones are not buried. */
const CATEGORY_ORDER = [
	'fade',
	'wipe',
	'slide',
	'zoom',
	'blur',
	'geometric',
	'distort',
	'stylized',
	'glitch'
];

const label = (name) => name.replace(/^./, (c) => c.toUpperCase());

/**
 * Catalog as flat {value,label,category} options, ordered by category. Only
 * transitions the Pixi engine implements are offered — the catalog also carries
 * entries for other providers, which would render nothing.
 *
 * The category rides along because the picker groups by it. It used to be
 * dropped after sorting, which meant the UI could only ever show one flat list
 * of 68 even though the catalog knew better.
 */
export const TRANSITION_OPTIONS = () => {
	const supported = (TRANSITION_CATALOG || []).filter(
		(t) => !t.supportedProviders || t.supportedProviders.includes('engine-pixi')
	);
	const byCategory = new Map();
	for (const t of supported) {
		const list = byCategory.get(t.category) || [];
		list.push({ value: t.key, label: t.name || label(t.key), category: t.category });
		byCategory.set(t.category, list);
	}
	const ordered = [];
	for (const category of CATEGORY_ORDER) {
		const list = byCategory.get(category);
		if (!list) continue;
		list.sort((a, b) => a.label.localeCompare(b.label));
		ordered.push(...list);
		byCategory.delete(category);
	}
	// Anything in a category we did not anticipate still gets offered.
	for (const list of byCategory.values()) ordered.push(...list);
	return ordered;
};

export const transitionByKey = (key) =>
	(TRANSITION_CATALOG || []).find((t) => t.key === key) || null;

/** Clips on the same track as `clip`, ordered by start time. */
const siblingsOnTrack = (clips, tracks, clip) => {
	const track = (tracks || []).find((t) => (t.clips || []).includes(clip.id));
	const ids = track ? track.clips : Object.keys(clips || {});
	return ids
		.map((id) => clips[id])
		.filter((c) => c && c.type !== 'Transition')
		.sort((a, b) => (a.timing?.display?.from ?? 0) - (b.timing?.display?.from ?? 0));
};

/**
 * The clip immediately before `clip` on its track — the one a transition would
 * blend FROM. Null when the clip is first, in which case there is nothing to
 * transition from and the control should say so.
 */
export const previousClip = (clips, tracks, clip) => {
	if (!clip) return null;
	const ordered = siblingsOnTrack(clips, tracks, clip);
	const index = ordered.findIndex((c) => c.id === clip.id);
	return index > 0 ? ordered[index - 1] : null;
};

/** The Transition clip that blends INTO `clip`, if one exists. */
export const incomingTransition = (clips, clip) =>
	Object.values(clips || {}).find(
		(c) => c?.type === 'Transition' && c.toClipId === clip?.id
	) || null;

/**
 * Build a Transition clip centred on the cut between two clips.
 *
 * The engine re-centres it on load (display.from = toClip.from - duration/2),
 * but setting it here keeps the timeline honest before any reload.
 */
export const createTransitionClip = ({ fromClip, toClip, key, durationUs }) => {
	const duration = Math.max(MIN_TRANSITION_US, Math.round(durationUs || DEFAULT_TRANSITION_US));
	const cut = toClip.timing?.display?.from ?? 0;
	const from = Math.max(0, cut - duration / 2);

	return {
		type: 'Transition',
		name: transitionByKey(key)?.name || key,
		transitionKey: key,
		// Mandatory: a clip with an empty src is dropped on import.
		src: `transition://${key}`,
		fromClipId: fromClip.id,
		toClipId: toClip.id,
		timing: {
			display: { from, to: from + duration },
			trim: { from: 0, to: duration },
			duration,
			playbackRate: 1
		},
		transform: {
			x: 0,
			y: 0,
			width: toClip.transform?.width ?? 0,
			height: toClip.transform?.height ?? 0,
			angle: 0,
			opacity: 1,
			// Above both clips it blends, so it is not occluded by either.
			zIndex: Math.max(fromClip.transform?.zIndex ?? 0, toClip.transform?.zIndex ?? 0) + 1
		},
		metadata: {},
		locked: false
	};
};

/** Seconds for the UI, microseconds in the document. */
export const toSeconds = (us) => Math.round(((us || 0) / 1_000_000) * 10) / 10;
export const toMicroseconds = (seconds) => Math.round((Number(seconds) || 0) * 1_000_000);
