import backend from '../service/backend';

/**
 * Video projects API (OpenVideo timeline documents).
 * Base path: /video/projects
 *
 * A project's `projectJson` is the OpenVideo IProject scene graph
 * ({ settings, tracks, clips }) exported verbatim from the editor.
 */

/**
 * Create a video project.
 * @param {Object} payload - { name, projectJson }
 * @returns {Promise<Object>} - { project }
 */
const createVideoProject = async (payload) => {
	const response = await backend.post('/video/projects', payload);
	return response;
};

/**
 * Update a video project.
 * @param {string} uid
 * @param {Object} payload - { name?, projectJson? }
 * @returns {Promise<Object>} - { project }
 */
const updateVideoProject = async (uid, payload) => {
	const response = await backend.put(`/video/projects/${uid}`, payload);
	return response;
};

/**
 * List video projects (without the heavy projectJson body).
 * @returns {Promise<Object>} - { projects }
 */
const getVideoProjects = async () => {
	const response = await backend.get('/video/projects');
	return response;
};

/**
 * Get one video project (includes projectJson).
 * @param {string} uid
 * @returns {Promise<Object>} - { project }
 */
const getVideoProject = async (uid) => {
	const response = await backend.get(`/video/projects/${uid}`);
	return response;
};

/**
 * Delete a video project.
 * @param {string} uid
 * @returns {Promise<Object>} - { success }
 */
const deleteVideoProject = async (uid) => {
	const response = await backend.delete(`/video/projects/${uid}`);
	return response;
};

/**
 * Render the project's timeline to mp4 on the server.
 * Returns 501 with an explanatory message until the
 * @openvideo/video-renderer bridge is installed on the backend.
 * @param {string} uid
 * @returns {Promise<Object>} - { url } (501 -> { message, code })
 */
const renderVideoProject = async (uid) => {
	const response = await backend.post(`/video/projects/${uid}/render`, {});
	return response;
};

export {
	createVideoProject,
	updateVideoProject,
	getVideoProjects,
	getVideoProject,
	deleteVideoProject,
	renderVideoProject
};
