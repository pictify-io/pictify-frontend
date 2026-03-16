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

export { getImages, getGifs, getPdfs };
