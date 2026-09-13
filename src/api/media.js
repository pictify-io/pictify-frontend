import backend from '../service/backend';

const getImages = async ({ limit = 12, offset = 0 } = {}) => {
	try {
		const response = await backend.get(`/image?limit=${limit}&offset=${offset}`);
		return response;
	} catch (error) {
		return { images: [], pagination: { total: 0, limit, offset, hasMore: false } };
	}
};

const getGifs = async ({ limit = 12, offset = 0 } = {}) => {
	try {
		const response = await backend.get(`/gif?limit=${limit}&offset=${offset}`);
		return response;
	} catch (error) {
		return { gifs: [], pagination: { total: 0, limit, offset, hasMore: false } };
	}
};

const getPdfs = async ({ limit = 12, offset = 0 } = {}) => {
	try {
		const response = await backend.get(`/pdf?limit=${limit}&offset=${offset}`);
		return response;
	} catch (error) {
		return { pdfs: [], pagination: { total: 0, limit, offset, hasMore: false } };
	}
};

/**
 * Rendered videos. The backend records finished exports under kind 'render'
 * (source clips uploaded into the studio use the 'video'/'audio'/'image' kinds
 * and are deliberately excluded here — this gallery shows work you made, not
 * material you uploaded). Normalized to the { videos, pagination } shape the
 * other media types return.
 */
const getVideos = async ({ limit = 12, offset = 0 } = {}) => {
	try {
		const response = await backend.get(`/video/media?kind=render&limit=${limit}&offset=${offset}`);
		return {
			videos: response?.media || [],
			pagination: response?.pagination || { total: 0, limit, offset, hasMore: false }
		};
	} catch (error) {
		return { videos: [], pagination: { total: 0, limit, offset, hasMore: false } };
	}
};

/**
 * Every render, all four formats, newest first — the Renders page's only read.
 *
 * Merging happens server-side because the four collections can't be paginated
 * as one from here: page 2 of four independent lists is not page 2 of the feed.
 * The response also carries the chip counts, the 14-day daybook and the monthly
 * quota, all of which have to agree with the list they sit above.
 */
const getRenders = async ({
	format = 'ALL',
	template = null,
	source = null,
	window = null,
	limit = 24,
	offset = 0
} = {}) => {
	const params = new URLSearchParams({ format, limit: String(limit), offset: String(offset) });
	// 'month' scopes the counts to the billing month — the billing meter's
	// per-format breakdown reads the same endpoint as the Renders chips so the
	// two can never report different numbers for the same question.
	if (window) params.set('window', window);
	if (template) params.set('template', template);
	if (source) params.set('source', source);
	// The daybook is bucketed in the viewer's zone so its bars line up with the
	// day headers in the grid, which are grouped locally.
	try {
		params.set('tz', Intl.DateTimeFormat().resolvedOptions().timeZone);
	} catch {
		// No Intl timezone available — the server falls back to UTC.
	}
	return backend.get(`/render?${params.toString()}`);
};

/**
 * Per-caller render totals for the Callers page. Counts only attributed rows —
 * the response carries `windowStart` and `unattributed` so the page can state
 * what the numbers do and don't cover instead of implying full history.
 */
const getCallers = async () => backend.get('/render/callers');

export { getImages, getGifs, getPdfs, getVideos, getRenders, getCallers };
