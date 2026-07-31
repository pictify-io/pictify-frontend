/**
 * Composition settings: canvas size, frame rate, export quality, project name.
 *
 * These live on `project.settings` rather than on any clip, which is why they
 * appear when NOTHING is selected. That is the one discoverable place for them:
 * a "canvas" tab people never open is where settings go to be missed.
 *
 * ── Only levers that do something ─────────────────────────────────────────
 *
 * Every control here changes the rendered output:
 *
 *   width / height  read by the engine and the renderer
 *   fps             read by both
 *   bitrate         `service/openvideo-renderer.js` reads
 *                   `projectJson.settings.bitrate`, defaulting to 8 Mbps
 *
 * Container format is deliberately absent. The renderer hardcodes `mp4`, so a
 * format selector would be a control that silently does nothing — worse than
 * not offering the choice.
 */

/** Matches the backend's own bounds, so the studio cannot build an unrenderable size. */
export const MIN_DIMENSION = 16;
export const MAX_DIMENSION = 4096;
export const MIN_FPS = 1;
export const MAX_FPS = 60;

/** The frame rates worth offering. 24 reads as film, 30 as video, 60 as smooth. */
export const FPS_OPTIONS = [24, 25, 30, 50, 60];

/**
 * Canvas presets, named by where the video goes rather than by ratio. "9:16"
 * means nothing to most people; "Reels / TikTok / Shorts" is the actual choice
 * being made.
 */
export const ASPECT_PRESETS = [
	{ id: 'portrait', label: 'Reels, TikTok, Shorts', ratio: '9:16', width: 1080, height: 1920 },
	{ id: 'square', label: 'Feed post', ratio: '1:1', width: 1080, height: 1080 },
	{ id: 'vertical', label: 'Feed video', ratio: '4:5', width: 1080, height: 1350 },
	{ id: 'landscape', label: 'YouTube, embeds', ratio: '16:9', width: 1920, height: 1080 }
];

/**
 * Quality presets as bitrates.
 *
 * Named by outcome, not by number: nobody knows whether 8,000,000 is a lot. The
 * middle one is the renderer's own default, so choosing "Standard" is a no-op
 * rather than a change of behaviour.
 */
export const QUALITY_PRESETS = [
	{ id: 'draft', label: 'Draft', hint: 'Smallest file, quickest render', bitrate: 4_000_000 },
	{ id: 'standard', label: 'Standard', hint: 'The default', bitrate: 8_000_000 },
	{ id: 'high', label: 'High', hint: 'Best for detailed footage', bitrate: 16_000_000 }
];

export const DEFAULT_BITRATE = 8_000_000;

const clamp = (value, min, max, fallback) => {
	const n = Math.round(Number(value));
	if (!Number.isFinite(n)) return fallback;
	return Math.min(max, Math.max(min, n));
};

/**
 * Which canvas preset the current size is, or null for a custom size.
 *
 * Matched on exact dimensions rather than on ratio: 1080x1920 and 720x1280 are
 * both 9:16, but only one is the preset, and showing "Reels" selected while the
 * canvas is 720 wide would be a lie about what is about to render.
 */
export const matchAspectPreset = (width, height) =>
	ASPECT_PRESETS.find((preset) => preset.width === width && preset.height === height) || null;

/** Which quality preset a bitrate is, or null when it was set by hand. */
export const matchQualityPreset = (bitrate) =>
	QUALITY_PRESETS.find((preset) => preset.bitrate === (bitrate || DEFAULT_BITRATE)) || null;

/**
 * The settings a canvas preset implies.
 *
 * @param {string} presetId
 * @returns {{width: number, height: number}|null}
 */
export const aspectPatch = (presetId) => {
	const preset = ASPECT_PRESETS.find((p) => p.id === presetId);
	return preset ? { width: preset.width, height: preset.height } : null;
};

/** Swap width and height, keeping whichever preset that lands on. */
export const rotatePatch = (settings) => ({
	width: clamp(settings?.height, MIN_DIMENSION, MAX_DIMENSION, 1080),
	height: clamp(settings?.width, MIN_DIMENSION, MAX_DIMENSION, 1920)
});

/**
 * A validated settings patch.
 *
 * Every field is clamped rather than rejected. A width typed as 99999 is a
 * fat-fingered 999, and snapping to the maximum keeps the canvas usable; the
 * alternative is an input that refuses to change with no explanation.
 *
 * @param {object} current - the project's settings
 * @param {object} changes - partial settings
 */
export const settingsPatch = (current = {}, changes = {}) => {
	const patch = {};

	if (changes.width !== undefined) {
		patch.width = clamp(changes.width, MIN_DIMENSION, MAX_DIMENSION, current.width || 1080);
	}
	if (changes.height !== undefined) {
		patch.height = clamp(changes.height, MIN_DIMENSION, MAX_DIMENSION, current.height || 1920);
	}
	if (changes.fps !== undefined) {
		patch.fps = clamp(changes.fps, MIN_FPS, MAX_FPS, current.fps || 30);
	}
	if (changes.bitrate !== undefined) {
		// One tenth of the draft preset up to four times the high one: below that
		// the video is unwatchable, above it the file is enormous for no gain.
		patch.bitrate = clamp(changes.bitrate, 400_000, 64_000_000, current.bitrate || DEFAULT_BITRATE);
	}
	if (changes.backgroundColor !== undefined && typeof changes.backgroundColor === 'string') {
		patch.backgroundColor = changes.backgroundColor;
	}

	return patch;
};

/** Settings as the panel wants to show them, with defaults filled in. */
export const readSettings = (settings = {}) => ({
	width: settings.width || 1080,
	height: settings.height || 1920,
	fps: settings.fps || 30,
	bitrate: settings.bitrate || DEFAULT_BITRATE,
	backgroundColor: settings.backgroundColor || '#000000'
});

/**
 * Roughly how large the export will be, in megabytes.
 *
 * A bitrate slider with no consequence attached is a number nobody can reason
 * about. Bitrate is bits per second, so this is deliberately an estimate — it
 * ignores audio and container overhead, and says "about".
 *
 * @param {number} bitrate - bits per second
 * @param {number} durationUs - composition length in microseconds
 */
export const estimatedSizeMb = (bitrate, durationUs) => {
	const seconds = Math.max(0, Number(durationUs) || 0) / 1_000_000;
	const bytes = ((Number(bitrate) || DEFAULT_BITRATE) / 8) * seconds;
	return Math.round((bytes / (1024 * 1024)) * 10) / 10;
};
