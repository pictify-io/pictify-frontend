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

export { getImages, getGifs, getPdfs, getVideos };
