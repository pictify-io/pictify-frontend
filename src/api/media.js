import backend from '../service/backend';

const getImages = async (token) => {
	try {
		// backend.defaults.headers.common['Authorization'] = `Bearer ${token}`;

		const response = await backend.get('/image');
		return response.data;
	} catch (error) {
		return null;
	}
};

const getGifs = async (token) => {
	try {
		// backend.defaults.headers.common['Authorization'] = `Bearer ${token}`;

		const response = await backend.get('/gif');
		return response.data;
	} catch (error) {
		return null;
	}
};

export { getImages, getGifs };
