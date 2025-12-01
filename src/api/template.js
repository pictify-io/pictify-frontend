import backend from '../service/backend';

const getTemplate = async ({ type, variables }) => {
	const url = `/fe/template?type=${type}&variables=${JSON.stringify(variables)}`;
	const response = await backend.get(url);
	return response;
};

const getTemplates = async ({ page = 1, limit = 12, sort = 'newest' } = {}) => {
	try {
		const response = await backend.get(`/templates?page=${page}&limit=${limit}&sort=${sort}`);
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
		const response = await backend.post(`/templates/${uid}/render`, {
			variables,
			format: options.format || 'png',
			quality: options.quality || 0.9
		}, {
			headers: options.headers || {}
		});
		return response;
	} catch (error) {
		console.error('Error rendering template:', error);
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
	getTemplateVariables
};
