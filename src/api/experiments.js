import backend from '../service/backend';

/**
 * Experiments API - Functions for managing A/B test experiments
 * Experiments allow comparing template variants to optimize performance
 */

/**
 * Create a new experiment
 * @param {Object} data - Experiment configuration
 * @param {string} data.name - Experiment name
 * @param {string} data.type - Experiment type (e.g. 'ab', 'multivariate')
 * @param {string} data.templateUid - Template UID to experiment on
 * @param {Array} [data.variants] - Variant configurations
 * @param {Object} [data.settings] - Experiment settings (duration, traffic split, etc)
 * @returns {Promise<Object>} - Created experiment
 */
const createExperiment = async (data) => {
	const response = await backend.post('/experiments', data);
	return response;
};

/**
 * List experiments with optional filtering
 * @param {Object} [params] - Query parameters
 * @param {string} [params.type] - Filter by experiment type
 * @param {string} [params.status] - Filter by status (draft/running/paused/completed)
 * @param {string} [params.templateUid] - Filter by template UID
 * @param {number} [params.page] - Page number for pagination
 * @param {number} [params.limit] - Items per page
 * @returns {Promise<Object>} - List of experiments with pagination info
 */
const getExperiments = async (params = {}) => {
	const queryParams = new URLSearchParams();
	if (params.type) queryParams.append('type', params.type);
	if (params.status) queryParams.append('status', params.status);
	if (params.templateUid) queryParams.append('templateUid', params.templateUid);
	if (params.page) queryParams.append('page', params.page);
	if (params.limit) queryParams.append('limit', params.limit);

	const query = queryParams.toString();
	const url = query ? `/experiments?${query}` : '/experiments';
	const response = await backend.get(url);
	return response;
};

/**
 * Get a single experiment by UID
 * @param {string} uid - Experiment UID
 * @returns {Promise<Object>} - Experiment details
 */
const getExperiment = async (uid) => {
	const response = await backend.get(`/experiments/${uid}`);
	return response;
};

/**
 * Update an experiment
 * @param {string} uid - Experiment UID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated experiment
 */
const updateExperiment = async (uid, updates) => {
	const response = await backend.put(`/experiments/${uid}`, updates);
	return response;
};

/**
 * Delete an experiment (soft delete)
 * @param {string} uid - Experiment UID
 * @returns {Promise<Object>} - Deletion confirmation
 */
const deleteExperiment = async (uid) => {
	const response = await backend.delete(`/experiments/${uid}`);
	return response;
};

/**
 * Start an experiment (transition to running state)
 * @param {string} uid - Experiment UID
 * @returns {Promise<Object>} - Updated experiment
 */
const startExperiment = async (uid) => {
	const response = await backend.post(`/experiments/${uid}/start`, {});
	return response;
};

/**
 * Pause a running experiment
 * @param {string} uid - Experiment UID
 * @returns {Promise<Object>} - Updated experiment
 */
const pauseExperiment = async (uid) => {
	const response = await backend.post(`/experiments/${uid}/pause`, {});
	return response;
};

/**
 * Complete an experiment and declare a winner
 * @param {string} uid - Experiment UID
 * @param {string} winnerVariantId - UID of the winning variant
 * @returns {Promise<Object>} - Completed experiment with winner info
 */
const completeExperiment = async (uid, winnerVariantId) => {
	const response = await backend.post(`/experiments/${uid}/complete`, { winnerVariantId });
	return response;
};

/**
 * Duplicate an experiment
 * @param {string} uid - Experiment UID to duplicate
 * @returns {Promise<Object>} - Newly created duplicate experiment
 */
const duplicateExperiment = async (uid) => {
	const response = await backend.post(`/experiments/${uid}/duplicate`, {});
	return response;
};

/**
 * Get analytics for an experiment
 * @param {string} uid - Experiment UID
 * @returns {Promise<Object>} - Analytics data (impressions, clicks, conversions per variant)
 */
const getExperimentAnalytics = async (uid) => {
	const response = await backend.get(`/experiments/${uid}/analytics`);
	return response;
};

/**
 * Get experiment quota and limits for current user/plan
 * @returns {Promise<Object>} - Quota info (max experiments, active count, etc)
 */
const getExperimentQuota = async () => {
	const response = await backend.get('/experiments/quota');
	return response;
};

/**
 * Check if an experiment slug is available
 * @param {string} slug - Slug to check
 * @returns {Promise<Object>} - { available: boolean }
 */
const checkSlugAvailability = async (slug) => {
	const response = await backend.get(`/experiments/check-slug?slug=${encodeURIComponent(slug)}`);
	return response;
};

export {
	createExperiment,
	getExperiments,
	getExperiment,
	updateExperiment,
	deleteExperiment,
	startExperiment,
	pauseExperiment,
	completeExperiment,
	duplicateExperiment,
	getExperimentAnalytics,
	getExperimentQuota,
	checkSlugAvailability
};
