import backend from '../service/backend';

/**
 * Integrations API - Functions for managing webhook subscriptions and connector configs
 * Used for automation platform integrations (Zapier, Make, n8n, etc.)
 */

// ============== Webhook Subscription APIs ==============

/**
 * Create a new webhook subscription
 * @param {Object} subscription - Subscription configuration
 * @param {string} subscription.event - Event type (render.completed, render.failed, etc.)
 * @param {string} subscription.targetUrl - URL to receive webhooks
 * @param {string} [subscription.platform] - Platform (zapier, make, n8n, pipedream, custom)
 * @param {Object} [subscription.filters] - Filters (templateId, bindingId)
 * @returns {Promise<Object>} - Created subscription with secret
 */
const createWebhookSubscription = async (subscription) => {
	const response = await backend.post('/webhook-subscriptions', subscription);
	return response;
};

/**
 * Get all webhook subscriptions for current user
 * @param {Object} [params] - Query params
 * @param {string} [params.event] - Filter by event type
 * @param {string} [params.status] - Filter by status (active, paused, failed)
 * @param {string} [params.platform] - Filter by platform
 * @param {number} [params.page] - Page number
 * @param {number} [params.limit] - Items per page
 * @returns {Promise<Object>} - { subscriptions, pagination }
 */
const getWebhookSubscriptions = async (params = {}) => {
	const queryParams = new URLSearchParams();
	if (params.event) queryParams.append('event', params.event);
	if (params.status) queryParams.append('status', params.status);
	if (params.platform) queryParams.append('platform', params.platform);
	if (params.page) queryParams.append('page', params.page);
	if (params.limit) queryParams.append('limit', params.limit);

	const query = queryParams.toString();
	const url = query ? `/webhook-subscriptions?${query}` : '/webhook-subscriptions';
	const response = await backend.get(url);
	return response;
};

/**
 * Get a single webhook subscription by ID
 * @param {string} id - Subscription UID
 * @returns {Promise<Object>} - Subscription details
 */
const getWebhookSubscription = async (id) => {
	const response = await backend.get(`/webhook-subscriptions/${id}`);
	return response;
};

/**
 * Update a webhook subscription
 * @param {string} id - Subscription UID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated subscription
 */
const updateWebhookSubscription = async (id, updates) => {
	const response = await backend.put(`/webhook-subscriptions/${id}`, updates);
	return response;
};

/**
 * Delete a webhook subscription
 * @param {string} id - Subscription UID
 * @returns {Promise<Object>} - Deletion confirmation
 */
const deleteWebhookSubscription = async (id) => {
	const response = await backend.delete(`/webhook-subscriptions/${id}`);
	return response;
};

/**
 * Pause a webhook subscription
 * @param {string} id - Subscription UID
 * @returns {Promise<Object>} - Updated subscription
 */
const pauseWebhookSubscription = async (id) => {
	const response = await backend.post(`/webhook-subscriptions/${id}/pause`, {});
	return response;
};

/**
 * Resume a webhook subscription
 * @param {string} id - Subscription UID
 * @returns {Promise<Object>} - Updated subscription
 */
const resumeWebhookSubscription = async (id) => {
	const response = await backend.post(`/webhook-subscriptions/${id}/resume`, {});
	return response;
};

/**
 * Get webhook subscription stats
 * @returns {Promise<Object>} - Stats for subscriptions and queue
 */
const getWebhookStats = async () => {
	const response = await backend.get('/webhook-subscriptions/stats');
	return response;
};

// ============== Connector Config APIs ==============

/**
 * Create a new connector config (storage destination)
 * @param {Object} config - Connector configuration
 * @param {string} config.type - Provider type (s3, gcs, cloudinary, imagekit)
 * @param {string} config.name - Display name
 * @param {Object} config.credentials - Provider credentials
 * @param {Object} [config.config] - Provider-specific config (bucket, region, etc.)
 * @returns {Promise<Object>} - Created connector config
 */
const createConnectorConfig = async (config) => {
	const response = await backend.post('/connector-configs', config);
	return response;
};

/**
 * Get all connector configs for current user
 * @param {Object} [params] - Query params
 * @param {string} [params.type] - Filter by provider type
 * @param {number} [params.page] - Page number
 * @param {number} [params.limit] - Items per page
 * @returns {Promise<Object>} - { connectors, pagination }
 */
const getConnectorConfigs = async (params = {}) => {
	const queryParams = new URLSearchParams();
	if (params.type) queryParams.append('type', params.type);
	if (params.page) queryParams.append('page', params.page);
	if (params.limit) queryParams.append('limit', params.limit);

	const query = queryParams.toString();
	const url = query ? `/connector-configs?${query}` : '/connector-configs';
	const response = await backend.get(url);
	return response;
};

/**
 * Get a single connector config by ID
 * @param {string} id - Connector UID
 * @returns {Promise<Object>} - Connector details
 */
const getConnectorConfig = async (id) => {
	const response = await backend.get(`/connector-configs/${id}`);
	return response;
};

/**
 * Update a connector config
 * @param {string} id - Connector UID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated connector
 */
const updateConnectorConfig = async (id, updates) => {
	const response = await backend.put(`/connector-configs/${id}`, updates);
	return response;
};

/**
 * Delete a connector config
 * @param {string} id - Connector UID
 * @returns {Promise<Object>} - Deletion confirmation
 */
const deleteConnectorConfig = async (id) => {
	const response = await backend.delete(`/connector-configs/${id}`);
	return response;
};

/**
 * Test a connector config (validate credentials)
 * @param {string} id - Connector UID
 * @returns {Promise<Object>} - { success, message, details }
 */
const testConnectorConfig = async (id) => {
	const response = await backend.post(`/connector-configs/${id}/test`, {});
	return response;
};

/**
 * Get connector config stats
 * @returns {Promise<Object>} - Stats by provider type
 */
const getConnectorStats = async () => {
	const response = await backend.get('/connector-configs/stats');
	return response;
};

/**
 * Get credential requirements for a provider type
 * @param {string} type - Provider type (s3, gcs, cloudinary, imagekit)
 * @returns {Promise<Object>} - { type, credentials, configOptions }
 */
const getCredentialRequirements = async (type) => {
	const response = await backend.get(`/connector-configs/requirements/${type}`);
	return response;
};

// ============== Platform Info ==============

/**
 * Available webhook events
 */
const WEBHOOK_EVENTS = [
	{ value: 'render.completed', label: 'Render Completed', description: 'When a template render completes successfully' },
	{ value: 'render.failed', label: 'Render Failed', description: 'When a template render fails' },
	{ value: 'binding.updated', label: 'Binding Updated', description: 'When a binding is refreshed with new data' },
	{ value: 'binding.failed', label: 'Binding Failed', description: 'When a binding fails to refresh' },
];

/**
 * Available platforms
 */
const PLATFORMS = [
	{ value: 'zapier', label: 'Zapier' },
	{ value: 'make', label: 'Make (Integromat)' },
	{ value: 'n8n', label: 'n8n' },
	{ value: 'pipedream', label: 'Pipedream' },
	{ value: 'custom', label: 'Custom Webhook' },
];

/**
 * Available storage providers
 */
const STORAGE_PROVIDERS = [
	{ value: 's3', label: 'Amazon S3', description: 'AWS S3 or S3-compatible storage' },
	{ value: 'gcs', label: 'Google Cloud Storage', description: 'Google Cloud Storage buckets' },
	{ value: 'cloudinary', label: 'Cloudinary', description: 'Cloudinary media management' },
	{ value: 'imagekit', label: 'ImageKit', description: 'ImageKit.io CDN' },
];

export {
	// Webhook Subscription APIs
	createWebhookSubscription,
	getWebhookSubscriptions,
	getWebhookSubscription,
	updateWebhookSubscription,
	deleteWebhookSubscription,
	pauseWebhookSubscription,
	resumeWebhookSubscription,
	getWebhookStats,
	// Connector Config APIs
	createConnectorConfig,
	getConnectorConfigs,
	getConnectorConfig,
	updateConnectorConfig,
	deleteConnectorConfig,
	testConnectorConfig,
	getConnectorStats,
	getCredentialRequirements,
	// Constants
	WEBHOOK_EVENTS,
	PLATFORMS,
	STORAGE_PROVIDERS,
};
