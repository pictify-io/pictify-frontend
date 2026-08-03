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

/**
 * All-time workflow totals for the dashboard summary cards. Separate from
 * listWorkflowRuns because that endpoint caps at 20 runs.
 * @returns {Promise<Object>} - { totalRuns, documentsRendered, documentsDelivered }
 */
const getWorkflowStats = async () => {
	try {
		const response = await backend.get('/workflow/stats');
		return response?.stats || { totalRuns: 0, documentsRendered: 0, documentsDelivered: 0 };
	} catch (error) {
		// A stats outage must not blank the dashboard.
		return { totalRuns: 0, documentsRendered: 0, documentsDelivered: 0 };
	}
};

/**
 * Re-send one row's delivery email (bounce recovery). Reuses the rendered
 * deliverable; optionally corrects the recipient address first.
 * @param {string} runUid
 * @param {number} index - Row index within the run
 * @param {string} [email] - Corrected recipient address
 * @returns {Promise<Object>} - { item: { index, deliveryStatus, error }, counts }
 */
const resendWorkflowItem = async (runUid, index, email) => {
	const response = await backend.post(
		`/workflow/${runUid}/items/${index}/resend`,
		email ? { email } : {}
	);
	return response;
};

/**
 * Compose the delivery email for one row — powers the composer's live
 * preview. Server-side so the preview shows exactly what recipients get.
 * @param {Object} payload - { delivery, row, url, outputFormat }
 * @returns {Promise<Object>} - { subject, html, from, replyTo }
 */
const previewWorkflowEmail = async (payload) => {
	const response = await backend.post('/workflow/email-preview', payload);
	return response;
};

/**
 * Send the composed email to the signed-in user's own address (test send).
 * @param {Object} payload - { delivery, row, url, outputFormat }
 * @returns {Promise<Object>} - { sent, to }
 */
const testWorkflowEmail = async (payload) => {
	const response = await backend.post('/workflow/email-test', payload);
	return response;
};

export {
	createWorkflowRun,
	getWorkflowRun,
	listWorkflowRuns,
	getWorkflowStats,
	previewWorkflow,
	previewWorkflowEmail,
	testWorkflowEmail,
	createWorkflowHook,
	listWorkflowHooks,
	resendWorkflowItem
};
