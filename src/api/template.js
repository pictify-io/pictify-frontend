import backend from '../service/backend';

const getTemplate = async ({ type, variables }) => {
	const url = `/fe/template?type=${type}&variables=${JSON.stringify(variables)}`;
	const response = await backend.get(url);
	return response;
};

const getTemplates = async ({ page = 1, limit = 12, sort = 'newest', outputFormat = 'all', hasDynamicLink } = {}) => {
	try {
		const params = new URLSearchParams({
			page: page.toString(),
			limit: limit.toString(),
			sort,
			outputFormat
		});

		if (hasDynamicLink !== undefined) {
			params.append('hasDynamicLink', hasDynamicLink.toString());
		}

		const response = await backend.get(`/templates?${params}`);
		return response;
	} catch (error) {
		return null;
	}
};

const getTemplateById = async (uid) => {
	try {
		const response = await backend.get(`/templates/${uid}`);
		return response;
	} catch (error) {
		return null;
	}
};

const createTemplate = async (template) => {
	try {
		const response = await backend.post('/templates', template);
		return response;
	} catch (error) {
		return null;
	}
};

const updateTemplate = async (template) => {
	try {
		const response = await backend.put(`/templates/${template.uid}`, template);
		return response;
	} catch (error) {
		return null;
	}
};

const deleteTemplate = async (uid) => {
	try {
		const response = await backend.delete(`/templates/${uid}`);
		return response;
	} catch (error) {
		return null;
	}
};

const searchTemplates = async (search, { page = 1, limit = 12 } = {}) => {
	try {
		const response = await backend.get(`/templates/search?q=${encodeURIComponent(search)}&page=${page}&limit=${limit}`);
		return response;
	} catch (error) {
		return null;
	}
};

const getTemplatesForType = async (type) => {
	try {
		const response = await backend.get(`/templates/type/${type}`);
		return response;
	} catch (error) {
		return null;
	}
};

/**
 * Render a template with variable values
 * @param {string} uid - Template UID
 * @param {Object} variables - Variable key-value pairs
 * @param {Object} options - Render options (format, quality)
 * @returns {Promise<Object>} - { url, width, height, format }
 */
const renderTemplate = async (uid, variables = {}, options = {}) => {
	try {
		const headers = { ...(options.headers || {}) };

		// Add API key authorization if provided
		if (options.apiKey) {
			headers['Authorization'] = `Bearer ${options.apiKey}`;
		}

		const body = {
			variables,
			format: options.format || 'png',
			quality: options.quality || 0.9
		};

		// Add dimension overrides for custom size rendering
		if (options.width && options.height) {
			body.width = options.width;
			body.height = options.height;
		}

		const response = await backend.post(`/templates/${uid}/render`, body, {
			headers
		});
		return response;
	} catch (error) {
		console.error('Error rendering template:', error);
		throw error;
	}
};

/**
 * Render a template at multiple sizes in one request
 * @param {string} uid - Template UID
 * @param {Object} variables - Variable key-value pairs
 * @param {Array} sizes - Array of { width, height, label? } or { preset }
 * @param {Object} options - Render options (format, quality, apiKey)
 * @returns {Promise<Object>} - { results, errors, totalSizes, totalErrors }
 */
const renderTemplateMultiSize = async (uid, variables = {}, sizes = [], options = {}) => {
	try {
		const headers = { ...(options.headers || {}) };

		if (options.apiKey) {
			headers['Authorization'] = `Bearer ${options.apiKey}`;
		}

		const response = await backend.post(`/templates/${uid}/multi-size-render`, {
			variables,
			sizes,
			format: options.format || 'png',
			quality: options.quality || 0.9
		}, {
			headers
		});
		return response;
	} catch (error) {
		console.error('Error multi-size rendering template:', error);
		throw error;
	}
};

/**
 * Get template variables definition
 * @param {string} uid - Template UID
 * @returns {Promise<Object>} - { templateUid, templateName, variables }
 */
const getTemplateVariables = async (uid) => {
	try {
		const response = await backend.get(`/templates/${uid}/variables`);
		return response;
	} catch (error) {
		console.error('Error fetching template variables:', error);
		return null;
	}
};

/**
 * Batch render a template with multiple variable sets
 * @param {string} uid - Template UID
 * @param {Array} variableSets - Array of variable objects
 * @param {Object} options - Render options
 * @returns {Promise<Object>} - { batchId, status, totalItems }
 */
const batchRenderTemplate = async (uid, variableSets, options = {}) => {
	try {
		const response = await backend.post(`/templates/${uid}/batch-render`, {
			variableSets,
			format: options.format || 'png',
			quality: options.quality || 0.9,
			concurrency: options.concurrency || 5
		}, {
			headers: options.headers || {}
		});
		return response;
	} catch (error) {
		console.error('Error batch rendering template:', error);
		throw error;
	}
};

/**
 * Get batch job results
 * @param {string} batchId - Batch job ID
 * @returns {Promise<Object>} - { batchId, status, progress, results, errors } or throws error
 */
const getBatchJobResults = async (batchId) => {
	const response = await backend.get(`/templates/batch/${batchId}/results`);
	return response;
};

/**
 * Cancel a batch job
 * @param {string} batchId - Batch job ID
 * @returns {Promise<Object>} - { batchId, status, message }
 */
const cancelBatchJob = async (batchId) => {
	try {
		const response = await backend.post(`/templates/batch/${batchId}/cancel`, {});
		return response;
	} catch (error) {
		console.error('Error cancelling batch job:', error);
		return null;
	}
};

/**
 * Batch render a template from a CSV URL
 * Backend downloads and parses the CSV - no row limit
 * Uses the unified batch-render endpoint with CSV mode
 * @param {string} uid - Template UID
 * @param {string} csvUrl - URL to the CSV file
 * @param {Object} mappings - Map of CSV column names to template variable names
 * @param {Object} options - Render options
 * @returns {Promise<Object>} - { batchId, status, totalItems }
 */
const batchRenderFromCsv = async (uid, csvUrl, mappings, options = {}) => {
	try {
		const response = await backend.post(`/templates/${uid}/batch-render`, {
			csvUrl,
			mappings,
			format: options.format || 'png',
			quality: options.quality || 0.9,
			concurrency: options.concurrency || 5
		}, {
			headers: options.headers || {}
		});
		return response;
	} catch (error) {
		console.error('Error batch rendering from CSV:', error);
		throw error;
	}
};

/**
 * Upload a CSV file for batch rendering
 * @param {File} file - The CSV file to upload
 * @returns {Promise<Object>} - { url, filename, size }
 */
const uploadCsvForBatch = async (file) => {
	try {
		const formData = new FormData();
		formData.append('file', file);
		const response = await backend.postFormData('/templates/upload-csv', formData);
		return response;
	} catch (error) {
		console.error('Error uploading CSV:', error);
		throw error;
	}
};

/**
 * Regenerate template thumbnail
 * @param {string} uid - Template UID
 * @returns {Promise<Object>} - { message, thumbnail }
 */
const regenerateThumbnail = async (uid) => {
	try {
		const response = await backend.post(`/templates/${uid}/regenerate-thumbnail`, {});
		return response;
	} catch (error) {
		console.error('Error regenerating thumbnail:', error);
		return null;
	}
};

/**
 * Regenerate all thumbnails
 * @returns {Promise<Object>} - { message, success, failed, skipped }
 */
const regenerateAllThumbnails = async () => {
	try {
		const response = await backend.post('/templates/regenerate-thumbnails', {});
		return response;
	} catch (error) {
		console.error('Error regenerating all thumbnails:', error);
		return null;
	}
};

// Expression Engine APIs
const validateExpression = async (expression) => {
	try {
		const response = await backend.post('/templates/expression/validate', { expression });
		return response;
	} catch (error) {
		console.error('Error validating expression:', error);
		return null;
	}
};

const testExpression = async (expression, variables = {}) => {
	try {
		const response = await backend.post('/templates/expression/test', { expression, variables });
		return response;
	} catch (error) {
		console.error('Error testing expression:', error);
		return null;
	}
};

const interpolateText = async (text, variables = {}) => {
	try {
		const response = await backend.post('/templates/expression/interpolate', { text, variables });
		return response;
	} catch (error) {
		console.error('Error interpolating text:', error);
		return null;
	}
};

const getExpressionFunctions = async () => {
	try {
		const response = await backend.get('/templates/expression/functions');
		return response;
	} catch (error) {
		console.error('Error fetching expression functions:', error);
		return null;
	}
};

// Public Templates APIs
const getPublicTemplates = async (params = {}) => {
	try {
		const queryParams = new URLSearchParams();
		if (params.category) queryParams.append('category', params.category);
		if (params.type) queryParams.append('type', params.type);
		if (params.tag) queryParams.append('tag', params.tag);
		if (params.search) queryParams.append('search', params.search);
		if (params.sort) queryParams.append('sort', params.sort);
		if (params.page) queryParams.append('page', params.page);
		if (params.limit) queryParams.append('limit', params.limit);

		const response = await backend.get(`/public/templates?${queryParams}`);
		return response;
	} catch (error) {
		console.error('Error fetching public templates:', error);
		return null;
	}
};

const getPublicTemplate = async (uid) => {
	try {
		const response = await backend.get(`/public/templates/${uid}`);
		return response;
	} catch (error) {
		console.error('Error fetching public template:', error);
		return null;
	}
};

const forkTemplate = async (uid) => {
	try {
		const response = await backend.post(`/public/templates/${uid}/fork`, {});
		return response;
	} catch (error) {
		console.error('Error forking template:', error);
		return null;
	}
};

// PDF Operations
const renderPdf = async (templateUid, variables = {}, options = {}) => {
	try {
		const response = await backend.post('/pdf/render', {
			templateUid,
			variables,
			options
		}, {
			headers: options.headers || {}
		});
		return response;
	} catch (error) {
		console.error('Error rendering PDF:', error);
		throw error;
	}
};

const renderMultiPagePdf = async (templateUid, variableSets = [], options = {}) => {
	try {
		const response = await backend.post('/pdf/multi-page', {
			templateUid,
			variableSets,
			options
		}, {
			headers: options.headers || {}
		});
		return response;
	} catch (error) {
		console.error('Error rendering multi-page PDF:', error);
		throw error;
	}
};

export {
	getTemplate,
	getTemplates,
	getTemplateById,
	createTemplate,
	updateTemplate,
	deleteTemplate,
	searchTemplates,
	getTemplatesForType,
	renderTemplate,
	renderTemplateMultiSize,
	getTemplateVariables,
	// New exports
	batchRenderTemplate,
	batchRenderFromCsv,
	uploadCsvForBatch,
	getBatchJobResults,
	cancelBatchJob,
	regenerateThumbnail,
	regenerateAllThumbnails,
	validateExpression,
	testExpression,
	interpolateText,
	getExpressionFunctions,
	getPublicTemplates,
	getPublicTemplate,
	forkTemplate,
	renderPdf,
	renderMultiPagePdf
};
