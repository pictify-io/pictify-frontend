import backend from '../service/backend';

const createImagePublic = async ({ html, width, height, selector, url, fileExtension }) => {
	const response = await backend.post('/image/public', {
		html,
		width,
		height,
		selector,
		url,
		fileExtension
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

const createOgImage = async ({ template, heading, description, logo, apiKey }) => {
	const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
	const response = await backend.post('/image/og-image', {
		template,
		heading,
		description,
		logo
	}, { headers });
	return response;
};

const getOgImageTemplates = async (apiKey) => {
	const config = apiKey ? { headers: { Authorization: `Bearer ${apiKey}` } } : {};
	const response = await backend.get('/templates/type/og-image', config);
	return response;
};

const checkApiHealth = async () => {
	try {
		await backend.get('/healthcheck');
		return true;
	} catch (error) {
		return false;
	}
};

export { createGifPublic, createImagePublic, createOgImage, getOgImageTemplates, checkApiHealth };
