import backend from '../service/backend';

/**
 * Video templates API — ONE noun for video, discriminated by `kind`.
 *
 *   kind: 'timeline' — a scene graph authored in the visual studio.
 *                      Body lives on `projectJson`.
 *   kind: 'tsx'      — a Remotion scene authored in Code mode.
 *                      Body lives on `tsx`.
 *
 * Both kinds share one uid namespace, one variables contract
 * (`variableDefinitions`) and one render endpoint, so nothing downstream —
 * the render page, workflows, the public API — has to care how a template was
 * authored.
 *
 * Base path: /video/templates
 */

/**
 * Create a video template.
 * @param {Object} payload - { name, kind, projectJson|tsx, variableDefinitions,
 *                             width, height, fps, durationInFrames, status?, posterUrl? }
 * @returns {Promise<Object>} - { template } (422 -> { errors: [...] })
 */
const createVideoTemplate = async (payload) => {
	const response = await backend.post('/video/templates', payload);
	return response;
};

/**
 * Update a video template. Send only what changed.
 * @param {string} uid
 * @param {Object} payload - { name?, projectJson?|tsx?, variableDefinitions?,
 *                             width?, height?, fps?, durationInFrames?, status?, posterUrl? }
 * @returns {Promise<Object>} - { template } (422 -> { errors: [...] })
 */
const updateVideoTemplate = async (uid, payload) => {
	const response = await backend.put(`/video/templates/${uid}`, payload);
	return response;
};

/**
 * List video templates. Bodies (tsx/projectJson) are omitted — fetch one
 * template to get its document.
 * @returns {Promise<Object>} - { templates }
 */
const getVideoTemplates = async () => {
	const response = await backend.get('/video/templates');
	return response;
};

/**
 * Get one video template, including its document.
 * @param {string} uid
 * @returns {Promise<Object>} - { template }
 */
const getVideoTemplate = async (uid) => {
	const response = await backend.get(`/video/templates/${uid}`);
	return response;
};

/**
 * Delete a video template.
 * @param {string} uid
 * @returns {Promise<Object>} - { success }
 */
const deleteVideoTemplate = async (uid) => {
	const response = await backend.delete(`/video/templates/${uid}`);
	return response;
};

/**
 * The template's render contract, without its body — mirrors
 * GET /templates/:uid/variables on the image side.
 * @param {string} uid
 * @returns {Promise<Object>} - { templateUid, templateName, kind, variables, referenced }
 */
const getVideoTemplateVariables = async (uid) => {
	const response = await backend.get(`/video/templates/${uid}/variables`);
	return response;
};

/**
 * Render a single PNG still of one frame. Code-mode templates only —
 * timeline templates preview live in the browser instead.
 * @param {string} uid
 * @param {Object} payload - { variables, frame }
 * @returns {Promise<Object>} - { url } (422 -> { errors: [...] }, 501 for timeline)
 */
const previewVideoTemplateFrame = async (uid, payload) => {
	const response = await backend.post(`/video/templates/${uid}/preview`, payload);
	return response;
};

/**
 * Render the full mp4 server-side (slow — can take minutes).
 * @param {string} uid
 * @param {Object} payload - { variables }
 * @returns {Promise<Object>} - { url, durationInFrames }
 *   422 { message, code: 'invalid_variable' } — a value failed validation
 *   402 { code: 'quota_exceeded' }
 *   501 { code: 'render_bridge_not_installed' } — export from the studio instead
 */
const renderVideoTemplate = async (uid, payload) => {
	const response = await backend.post(`/video/templates/${uid}/render`, payload);
	return response;
};

/**
 * Generate a Code-mode template with AI.
 * @param {Object} payload - { prompt, brandColor, width, height, durationSeconds }
 * @returns {Promise<Object>} - { template, previewUrl }
 */
const generateVideoTemplate = async (payload) => {
	const response = await backend.post('/video/templates/generate', payload);
	return response;
};

/**
 * Upload footage or audio for the timeline studio.
 *
 * The studio must never persist a blob: URL — it dies on reload and a server
 * render can't fetch it. Images keep going through brand assets; this is the
 * home for video/audio.
 *
 * @param {File} file
 * @param {Object} [options]
 * @param {string} [options.purpose] - 'render' marks a finished export, which
 *   the backend meters exactly like a server render. Omit for source footage.
 * @param {string} [options.templateUid] - attribution for the usage record
 * @returns {Promise<Object>} - { media: { url, kind, mimeType, name, bytes } }
 *   415 unsupported_media_type, 413 file_too_large, 402 quota_exceeded
 */
const uploadVideoMedia = async (file, { purpose, templateUid } = {}) => {
	const formData = new FormData();
	// The file must come last: the backend reads the fields off `file.fields`,
	// which only carries the parts busboy has already parsed.
	if (purpose) formData.append('purpose', purpose);
	if (templateUid) formData.append('templateUid', templateUid);
	formData.append('file', file);
	const response = await backend.postFormData('/video/media', formData);
	return response;
};

export {
	createVideoTemplate,
	updateVideoTemplate,
	getVideoTemplates,
	getVideoTemplate,
	deleteVideoTemplate,
	getVideoTemplateVariables,
	previewVideoTemplateFrame,
	renderVideoTemplate,
	generateVideoTemplate,
	uploadVideoMedia
};
