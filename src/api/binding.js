import backend from '../service/backend';

/**
 * Binding API - Functions for managing template bindings (dynamic assets)
 * Bindings connect templates to data sources for auto-updating images
 */

// ============== Data Source APIs ==============

/**
 * Create a new data source
 * @param {Object} dataSource - Data source configuration
 * @param {string} dataSource.name - Display name
 * @param {string} dataSource.type - 'http' | 'webhook' | 'static'
 * @param {string} [dataSource.url] - URL for HTTP sources
 * @param {string} [dataSource.method] - HTTP method (GET/POST)
 * @param {Object} [dataSource.headers] - HTTP headers
 * @param {Object} [dataSource.credentials] - Auth credentials
 * @returns {Promise<Object>} - Created data source
 */
const createDataSource = async (dataSource) => {
	const response = await backend.post('/data-sources', dataSource);
	return response;
};

/**
 * Get all data sources for current user
 * @returns {Promise<Array>} - List of data sources
 */
const getDataSources = async () => {
	const response = await backend.get('/data-sources');
	return response;
};

/**
 * Get a single data source by ID
 * @param {string} id - Data source UID
 * @returns {Promise<Object>} - Data source details
 */
const getDataSource = async (id) => {
	const response = await backend.get(`/data-sources/${id}`);
	return response;
};

/**
 * Update a data source
 * @param {string} id - Data source UID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated data source
 */
const updateDataSource = async (id, updates) => {
	const response = await backend.put(`/data-sources/${id}`, updates);
	return response;
};

/**
 * Delete a data source
 * @param {string} id - Data source UID
 * @returns {Promise<Object>} - Deletion confirmation
 */
const deleteDataSource = async (id) => {
	const response = await backend.delete(`/data-sources/${id}`);
	return response;
};

/**
 * Test a data source configuration (fetch sample data)
 * @param {Object} dataSource - Data source config to test
 * @returns {Promise<Object>} - { success, data, duration, error }
 */
const testDataSource = async (dataSource) => {
	const response = await backend.post('/data-sources/test', dataSource);
	return response;
};

// ============== Binding APIs ==============

/**
 * Create a new binding (connect template to data source)
 * @param {Object} binding - Binding configuration
 * @param {string} binding.templateId - Template UID
 * @param {string} binding.dataSourceId - Data source UID (or null for static)
 * @param {Object} binding.mapping - Variable to JSONPath mapping
 * @param {Object} [binding.defaults] - Default values for variables
 * @param {Object} [binding.refreshPolicy] - TTL and caching config
 * @param {Object} [binding.outputConfig] - Format, quality, dimensions
 * @returns {Promise<Object>} - Created binding with dynamic URL
 */
const createBinding = async (binding) => {
	const response = await backend.post('/bindings', binding);
	return response;
};

/**
 * Get all bindings for current user
 * @param {Object} [params] - Query params
 * @param {string} [params.templateId] - Filter by template
 * @param {string} [params.status] - Filter by status (active/paused)
 * @returns {Promise<Array>} - List of bindings
 */
const getBindings = async (params = {}) => {
	const queryParams = new URLSearchParams();
	if (params.templateId) queryParams.append('templateId', params.templateId);
	if (params.status) queryParams.append('status', params.status);

	const query = queryParams.toString();
	const url = query ? `/bindings?${query}` : '/bindings';
	const response = await backend.get(url);
	return response;
};

/**
 * Get a single binding by ID
 * @param {string} id - Binding UID
 * @returns {Promise<Object>} - Binding details
 */
const getBinding = async (id) => {
	const response = await backend.get(`/bindings/${id}`);
	return response;
};

/**
 * Get bindings for a specific template
 * @param {string} templateId - Template UID
 * @returns {Promise<Array>} - List of bindings for template
 */
const getBindingsForTemplate = async (templateId) => {
	const response = await backend.get(`/bindings?templateId=${templateId}`);
	return response;
};

/**
 * Update a binding
 * @param {string} id - Binding UID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated binding
 */
const updateBinding = async (id, updates) => {
	const response = await backend.put(`/bindings/${id}`, updates);
	return response;
};

/**
 * Delete a binding
 * @param {string} id - Binding UID
 * @returns {Promise<Object>} - Deletion confirmation
 */
const deleteBinding = async (id) => {
	const response = await backend.delete(`/bindings/${id}`);
	return response;
};

/**
 * Pause a binding (stops auto-refresh)
 * @param {string} id - Binding UID
 * @returns {Promise<Object>} - Updated binding
 */
const pauseBinding = async (id) => {
	const response = await backend.post(`/bindings/${id}/pause`, {});
	return response;
};

/**
 * Resume a paused binding
 * @param {string} id - Binding UID
 * @returns {Promise<Object>} - Updated binding
 */
const resumeBinding = async (id) => {
	const response = await backend.post(`/bindings/${id}/resume`, {});
	return response;
};

/**
 * Force refresh a binding (invalidate cache and re-render)
 * @param {string} id - Binding UID
 * @returns {Promise<Object>} - Render result with new URL
 */
const refreshBinding = async (id) => {
	const response = await backend.post(`/bindings/${id}/refresh`, {});
	return response;
};

/**
 * Get binding render stats
 * @param {string} id - Binding UID
 * @returns {Promise<Object>} - Stats (lastRender, nextRefresh, errors, etc)
 */
const getBindingStats = async (id) => {
	const response = await backend.get(`/bindings/${id}/stats`);
	return response;
};

// ============== Render APIs ==============

/**
 * Get the rendered image URL for a binding
 * This calls the public render endpoint
 * @param {string} bindingId - Binding UID
 * @param {string} [format='png'] - Output format
 * @returns {Promise<Object>} - { url, width, height, format, cached }
 */
const getBindingImageUrl = async (bindingId, format = 'png') => {
	const response = await backend.get(`/b/${bindingId}.${format}/url`);
	return response;
};

/**
 * Preview a binding with test data (without saving)
 * @param {Object} config - Binding config to preview
 * @param {string} config.templateId - Template UID
 * @param {Object} config.mapping - Variable mapping
 * @param {Object} config.testData - Sample data to render with
 * @returns {Promise<Object>} - { url, width, height }
 */
const previewBinding = async (config) => {
	const response = await backend.post('/bindings/preview', config);
	return response;
};

// ============== Webhook APIs ==============

/**
 * Generate a webhook URL for a binding
 * @param {string} bindingId - Binding UID
 * @returns {Promise<Object>} - { webhookUrl, webhookSecret }
 */
const generateWebhook = async (bindingId) => {
	const response = await backend.post(`/bindings/${bindingId}/webhook`, {});
	return response;
};

/**
 * Regenerate webhook secret
 * @param {string} bindingId - Binding UID
 * @returns {Promise<Object>} - { webhookUrl, webhookSecret }
 */
const regenerateWebhookSecret = async (bindingId) => {
	const response = await backend.post(`/bindings/${bindingId}/webhook/regenerate`, {});
	return response;
};

export {
	// Data Source APIs
	createDataSource,
	getDataSources,
	getDataSource,
	updateDataSource,
	deleteDataSource,
	testDataSource,
	// Binding APIs
	createBinding,
	getBindings,
	getBinding,
	getBindingsForTemplate,
	updateBinding,
	deleteBinding,
	pauseBinding,
	resumeBinding,
	refreshBinding,
	getBindingStats,
	// Render APIs
	getBindingImageUrl,
	previewBinding,
	// Webhook APIs
	generateWebhook,
	regenerateWebhookSecret
};
