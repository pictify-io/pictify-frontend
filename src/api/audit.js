import backend from '../service/backend';

/**
 * Fetch audit logs with filtering and pagination
 * @param {Object} options - Query options
 * @param {string} [options.category] - Filter by category (image, gif, template, batch, auth, api)
 * @param {string} [options.action] - Filter by action
 * @param {string} [options.status] - Filter by status (success, failure, pending)
 * @param {string} [options.resourceType] - Filter by resource type
 * @param {string} [options.resourceId] - Filter by resource ID
 * @param {string} [options.startDate] - Filter logs after this date
 * @param {string} [options.endDate] - Filter logs before this date
 * @param {number} [options.limit=50] - Number of logs to fetch
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Promise<Object>} - Logs and pagination info
 */
export async function fetchAuditLogs(options = {}) {
	const params = {};

	if (options.category) params.category = options.category;
	if (options.action) params.action = options.action;
	if (options.status) params.status = options.status;
	if (options.resourceType) params.resourceType = options.resourceType;
	if (options.resourceId) params.resourceId = options.resourceId;
	if (options.startDate) params.startDate = options.startDate;
	if (options.endDate) params.endDate = options.endDate;
	if (options.limit) params.limit = options.limit;
	if (options.offset) params.offset = options.offset;

	return backend.get('/audit/logs', { params });
}

/**
 * Fetch audit summary statistics
 * @param {Object} options - Query options
 * @param {string} [options.startDate] - Start date for summary
 * @param {string} [options.endDate] - End date for summary
 * @returns {Promise<Object>} - Summary statistics
 */
export async function fetchAuditSummary(options = {}) {
	const params = {};

	if (options.startDate) params.startDate = options.startDate;
	if (options.endDate) params.endDate = options.endDate;

	return backend.get('/audit/summary', { params });
}

/**
 * Fetch a specific audit log entry
 * @param {string} logId - Audit log ID
 * @returns {Promise<Object>} - Audit log entry
 */
export async function fetchAuditLogById(logId) {
	return backend.get(`/audit/logs/${logId}`);
}

/**
 * Fetch all logs for a specific resource
 * @param {string} resourceId - Resource ID (template uid, image uid, etc.)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Logs for the resource
 */
export async function fetchResourceLogs(resourceId, options = {}) {
	const params = {};

	if (options.limit) params.limit = options.limit;
	if (options.offset) params.offset = options.offset;

	return backend.get(`/audit/resource/${resourceId}`, { params });
}

/**
 * Export audit logs
 * @param {Object} options - Export options
 * @param {string} [options.format='json'] - Export format (json or csv)
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.action] - Filter by action
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.startDate] - Start date
 * @param {string} [options.endDate] - End date
 * @param {number} [options.limit=1000] - Max records to export
 * @returns {Promise<Object|string>} - Exported data
 */
export async function exportAuditLogs(options = {}) {
	const params = {};

	if (options.format) params.format = options.format;
	if (options.category) params.category = options.category;
	if (options.action) params.action = options.action;
	if (options.status) params.status = options.status;
	if (options.startDate) params.startDate = options.startDate;
	if (options.endDate) params.endDate = options.endDate;
	if (options.limit) params.limit = options.limit;

	return backend.get('/audit/export', { params });
}
