import { analytics } from '$lib/analytics.js';
import { toast } from '../../store/toast.store';

/**
 * Save a generated file to disk from a (possibly cross-origin) URL.
 *
 * A plain `<a download>` silently breaks for our results: browsers ignore the
 * download attribute on cross-origin URLs, and the CDN serves generated files
 * with `Content-Disposition: inline`, so the click navigates the tab to the
 * image and the user loses their editor state. Fetching to a blob and saving
 * via an object URL downloads reliably and keeps the user on the page.
 *
 * Fires `content_downloaded` only after the file has actually been saved, so
 * the metric counts real downloads rather than clicks. If the fetch fails
 * (e.g. missing CORS headers), falls back to opening the file in a new tab so
 * the editor state survives, and does NOT fire the event.
 *
 * @param {string} url - Source URL (CDN URL or a blob/object URL)
 * @param {string} filename - Suggested filename, extension included
 * @param {Object} [tracking] - { tool_name, content_type } for content_downloaded
 * @returns {Promise<boolean>} true if the file was saved
 */
export async function downloadFile(url, filename, tracking = {}) {
	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
		const blob = await response.blob();
		const objectUrl = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = objectUrl;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
		if (tracking.tool_name) {
			analytics.trackDownload({
				content_type: tracking.content_type || 'image',
				format: filename.split('.').pop() || 'png',
				tool_name: tracking.tool_name
			});
		}
		return true;
	} catch {
		// By now the await has consumed the click's user activation, so a popup
		// blocker may refuse the tab. window.open returns null when blocked;
		// surface that instead of letting the button appear to do nothing.
		const opened = window.open(url, '_blank', 'noopener');
		if (!opened) {
			toast.set({
				message: 'Download failed. Right-click the image and choose "Save image as".',
				type: 'error',
				duration: 5000
			});
		}
		return false;
	}
}
