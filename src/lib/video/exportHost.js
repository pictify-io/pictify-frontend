/**
 * Client-side video export — renders a timeline document to mp4 in the
 * browser using @openvideo/engine-pixi's Compositor (PixiJS + WebCodecs).
 *
 * Why this exists alongside the server bridge:
 *   - It works on the user's GPU, costs the server nothing, and returns a file
 *     in seconds rather than queueing behind a headless Chromium.
 *   - It is the same engine the canvas preview already runs, so what the user
 *     sees is what they get.
 *
 * The server render (POST /video/templates/:uid/render) stays the path for the
 * public API and for bulk workflow runs, and is the fallback when the browser
 * has no WebCodecs. Both consume the same document with the same values
 * applied — src/lib/video/variables.js on this side, the mirrored
 * service/openvideo-variables.js on the other.
 *
 * Browser-only. Always import dynamically from onMount, never at the top level
 * of a component that may run in SSR (same contract as editorHost.js).
 */
import { Compositor } from '@openvideo/engine-pixi';

const MICROSECONDS_PER_SECOND = 1_000_000;

/**
 * Can this browser encode video? Chrome/Edge yes; Safari partially; Firefox
 * historically not. Check before offering the option, and fall back to the
 * server render when false.
 *
 * @param {Object} [dimensions] - { width, height }
 * @returns {Promise<boolean>}
 */
export const isClientExportSupported = async (dimensions = {}) => {
	try {
		return await Compositor.isSupported({
			width: dimensions.width,
			height: dimensions.height
		});
	} catch (error) {
		return false;
	}
};

const compositorFor = async (projectJson) => {
	const settings = projectJson?.settings || {};
	const compositor = new Compositor({
		width: settings.width || 1080,
		height: settings.height || 1920,
		fps: settings.fps || 30,
		bitrate: settings.bitrate || 8_000_000,
		backgroundColor: settings.backgroundColor || '#000000'
	});
	await compositor.loadFromJSON(projectJson);
	return compositor;
};

/**
 * Render a document to an mp4 Blob.
 *
 * @param {Object} projectJson - a document with values ALREADY applied
 * @param {Object} [options]
 * @param {Function} [options.onProgress] - called with 0..1
 * @param {AbortSignal} [options.signal] - cancels the export
 * @returns {Promise<Blob>}
 */
export const exportProjectToBlob = async (projectJson, { onProgress, signal } = {}) => {
	const compositor = await compositorFor(projectJson);

	const handleProgress = (value) => {
		if (typeof onProgress === 'function') onProgress(Math.min(1, Math.max(0, value)));
	};
	compositor.on?.('export:progress', handleProgress);

	try {
		const stream = compositor.output();
		const reader = stream.getReader();
		const chunks = [];
		let total = 0;

		// eslint-disable-next-line no-constant-condition
		while (true) {
			if (signal?.aborted) {
				await reader.cancel().catch(() => {});
				throw new DOMException('Export cancelled', 'AbortError');
			}
			const { done, value } = await reader.read();
			if (done) break;
			if (value) {
				chunks.push(value);
				total += value.length;
			}
		}

		if (!total) throw new Error('The export produced an empty file.');
		handleProgress(1);
		return new Blob(chunks, { type: 'video/mp4' });
	} finally {
		compositor.off?.('export:progress', handleProgress);
		try {
			compositor.destroy();
		} catch (error) {
			// Teardown is best-effort — never break the page over it.
		}
	}
};

/**
 * Render one frame to a PNG data URL. Used for the template's poster
 * thumbnail, so the list stops showing identical unlabelled cards.
 *
 * @param {Object} projectJson
 * @param {number} [timeUs] - microseconds into the timeline
 * @returns {Promise<string>} a data: URL
 */
export const snapshotFrame = async (projectJson, timeUs = 0) => {
	const compositor = await compositorFor(projectJson);
	try {
		return await compositor.snapshot(Math.round(timeUs / 1000));
	} finally {
		try {
			compositor.destroy();
		} catch (error) {
			// as above
		}
	}
};

/**
 * A small JPEG thumbnail of one frame, as a data URL.
 *
 * The template list previously showed identical unlabelled cards. A poster
 * fixes that, but a full-size 1080×1920 PNG data URL is ~1MB of string on
 * every list response, so downscale first: ~320px wide JPEG lands around
 * 20-30KB, which is cheap enough to store on the template and send in a list.
 *
 * @param {Object} projectJson
 * @param {Object} [options]
 * @param {number} [options.timeUs] - which frame
 * @param {number} [options.maxWidth]
 * @param {number} [options.quality]
 * @returns {Promise<string>} a data: URL, or '' if a frame can't be produced
 */
export const snapshotThumbnail = async (
	projectJson,
	{ timeUs = 0, maxWidth = 320, quality = 0.72 } = {}
) => {
	let dataUrl;
	try {
		dataUrl = await snapshotFrame(projectJson, timeUs);
	} catch (error) {
		return '';
	}
	if (!dataUrl) return '';

	try {
		const image = await new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = dataUrl;
		});
		const scale = Math.min(1, maxWidth / (image.width || maxWidth));
		const canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(image.width * scale));
		canvas.height = Math.max(1, Math.round(image.height * scale));
		const ctx = canvas.getContext('2d');
		// JPEG has no alpha — paint a base so transparent frames aren't black-on-black.
		ctx.fillStyle = projectJson?.settings?.backgroundColor || '#000000';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL('image/jpeg', quality);
	} catch (error) {
		return '';
	}
};

export { MICROSECONDS_PER_SECOND };
