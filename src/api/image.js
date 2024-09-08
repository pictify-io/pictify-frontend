import backend from '../service/backend';

const createImagePublic = async ({ html, width, height, selector, url }) => {
	const response = await backend.post('/image/public', {
		html,
		width,
		height,
		selector,
		url
	});
	return response;
};

const createGifPublic = async ({ html, width, height, duration }) => {
	const response = await backend.post('/gif/public', {
		html,
		width,
		height,
		duration
	});
	return response;
};

export { createGifPublic, createImagePublic };
