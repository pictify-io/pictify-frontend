import backend from '../service/backend';

const getTemplate = async ({ type, variables }) => {
	const url = `/fe/template?type=${type}&variables=${JSON.stringify(variables)}`;
	const response = await backend.get(url);
	return response;
};

const getTemplates = async () => {
	try {
		const response = await backend.get('/templates');
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

const searchTemplates = async (search) => {
	try {
		const response = await backend.get(`/templates/search?q=${search}`);
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

export {
	getTemplate,
	getTemplates,
	getTemplateById,
	createTemplate,
	updateTemplate,
	deleteTemplate,
	searchTemplates,
	getTemplatesForType
};
