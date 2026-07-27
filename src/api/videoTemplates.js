import backend from '../service/backend';

/**
 * Video templates API (Remotion-style TSX scenes).
 * Base path: /video/templates
 */

/**
 * Create a video template.
 * @param {Object} payload - { name, tsx, width, height, fps, durationInFrames, status? }
 * @returns {Promise<Object>} - { template } (422 -> { errors: [...] })
 */
const createVideoTemplate = async (payload) => {
	const response = await backend.post('/video/templates', payload);
	return response;
};

/**
 * Update a video template.
 * @param {string} uid
 * @param {Object} payload - { name, tsx, width, height, fps, durationInFrames, status? }
 * @returns {Promise<Object>} - { template } (422 -> { errors: [...] })
 */
const updateVideoTemplate = async (uid, payload) => {
	const response = await backend.put(`/video/templates/${uid}`, payload);
	return response;
};

/**
 * List video templates.
 * @returns {Promise<Object>} - { templates }
 */
const getVideoTemplates = async () => {
	const response = await backend.get('/video/templates');
	return response;
};

/**
 * Get one video template.
 * @param {string} uid
 * @returns {Promise<Object>} - { template }
 */
const getVideoTemplate = async (uid) => {
	const response = await backend.get(`/video/templates/${uid}`);
	return response;
};

/**
 * Render a single PNG still of one frame.
 * @param {string} uid
 * @param {Object} payload - { variables, frame }
 * @returns {Promise<Object>} - { url } (422 -> { errors: [...] })
 */
const previewVideoTemplateFrame = async (uid, payload) => {
	const response = await backend.post(`/video/templates/${uid}/preview`, payload);
	return response;
};

/**
 * Render the full mp4 (slow — can take up to ~3 minutes).
 * @param {string} uid
 * @param {Object} payload - { variables }
 * @returns {Promise<Object>} - { url }
 */
const renderVideoTemplate = async (uid, payload) => {
	const response = await backend.post(`/video/templates/${uid}/render`, payload);
	return response;
};

/**
 * Generate a template with AI.
 * @param {Object} payload - { prompt, brandColor, width, height, durationSeconds }
 * @returns {Promise<Object>} - { template, previewUrl }
 */
const generateVideoTemplate = async (payload) => {
	const response = await backend.post('/video/templates/generate', payload);
	return response;
};

export {
	createVideoTemplate,
	updateVideoTemplate,
	getVideoTemplates,
	getVideoTemplate,
	previewVideoTemplateFrame,
	renderVideoTemplate,
	generateVideoTemplate
};
