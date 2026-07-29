import backend from '../service/backend';

/**
 * Workflow runs API (certificate packs etc.).
 * Base path: /workflow
 */

/**
 * Create a workflow run.
 * @param {Object} payload - { packType, templateUid, rows, columnMapping, delivery }
 * @returns {Promise<Object>} - { run: { uid } }
 */
const createWorkflowRun = async (payload) => {
	const response = await backend.post('/workflow', payload);
	return response;
};

/**
 * Get a workflow run with items.
 * @param {string} uid
 * @returns {Promise<Object>} - { run: { uid, status, counts, items } }
 */
const getWorkflowRun = async (uid) => {
	const response = await backend.get(`/workflow/${uid}`);
	return response;
};

/**
 * List all workflow runs.
 * @returns {Promise<Object>} - { runs: [...] }
 */
const listWorkflowRuns = async () => {
	const response = await backend.get('/workflow');
	return response;
};

/**
 * Render a single preview for one row.
 *
 * `outputFormat` is REQUIRED for a video template: the backend validates the
 * template/format pairing and rejects a video template asked for png with
 * 400 output_format_mismatch.
 *
 * @param {Object} payload - { templateUid, row, columnMapping, outputFormat }
 * @returns {Promise<Object>} - { url }
 */
const previewWorkflow = async (payload) => {
	const response = await backend.post('/workflow/preview', payload);
	return response;
};

/**
 * Create a workflow webhook hook.
 * @param {Object} payload - { name, templateUid, columnMapping, delivery }
 * @returns {Promise<Object>} - { hook: { uid, path, url, ... } }
 */
const createWorkflowHook = async (payload) => {
	const response = await backend.post('/workflow/hooks', payload);
	return response;
};

/**
 * List workflow webhook hooks with stats.
 * @returns {Promise<Object>} - { hooks: [...] }
 */
const listWorkflowHooks = async () => {
	const response = await backend.get('/workflow/hooks');
	return response;
};

export {
	createWorkflowRun,
	getWorkflowRun,
	listWorkflowRuns,
	previewWorkflow,
	createWorkflowHook,
	listWorkflowHooks
};
