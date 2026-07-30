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
 * Rewrite a Remotion composition from a natural-language instruction.
 *
 * The CURRENT source is sent, not the saved one: the studio compiles live, so
 * what is on screen is usually ahead of the last save.
 *
 * The result is compile-gated server-side, so a rewrite that does not build
 * comes back 422 with the compiler's own errors instead of replacing working
 * code with broken code.
 *
 * @param {Object} payload - { tsx, instruction, width, height, fps, durationInFrames }
 * @returns {Promise<{tsx: string, schemaJson: Array, changed: boolean}>}
 *   422 { errors: [...] } — the rewrite did not compile
 *   402 { code: 'quota_exceeded' } · 503 { code: 'ai_unavailable' }
 */
const editVideoTemplateCode = async (payload) => {
	const response = await backend.post('/video/templates/edit', payload);
	return response;
};

/**
 * Copy a template. The natural way to make a variant — a seasonal cut, or a
 * safe copy before an edit you are not sure about.
 *
 * The copy is always a draft, whatever the source was: a duplicate is by
 * definition unreviewed, and inheriting `published` would put an unedited copy
 * straight into whatever consumes published templates.
 *
 * @param {string} uid
 * @param {Object} [options]
 * @param {string} [options.name] - defaults to "<source name> (copy)"
 * @returns {Promise<Object>} - { template }
 */
const duplicateVideoTemplate = async (uid, { name } = {}) => {
	const response = await backend.post(`/video/templates/${uid}/duplicate`, name ? { name } : {});
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

/**
 * The user's uploaded footage and audio, newest first.
 *
 * Uploads used to be fire-and-forget: the file reached S3 and the URL worked
 * forever, but nothing wrote it down, so reopening the studio showed an empty
 * Media panel and the same clip got uploaded again.
 *
 * @param {Object} [options]
 * @param {'video'|'audio'|'image'} [options.kind] - filter to one kind
 * @param {number} [options.limit] - capped at 200 by the backend
 * @returns {Promise<Array>} - [{ uid, kind, name, url, mimeType, bytes, createdAt }]
 */
const listVideoMedia = async ({ kind, limit } = {}) => {
	const params = new URLSearchParams();
	if (kind) params.set('kind', kind);
	if (limit) params.set('limit', String(limit));
	const query = params.toString();
	const response = await backend.get(`/video/media${query ? `?${query}` : ''}`);
	return response?.media || [];
};

/**
 * Remove an item from the library.
 *
 * Soft delete: the S3 object stays. Templates reference media by URL, so
 * destroying the file would break videos the user already made — including
 * ones they can't see from the studio, like a scheduled workflow's.
 *
 * @param {string} uid
 */
const deleteVideoMedia = async (uid) => backend.delete(`/video/media/${uid}`);

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
	editVideoTemplateCode,
	duplicateVideoTemplate,
	uploadVideoMedia,
	listVideoMedia,
	deleteVideoMedia
};
