import { writable } from 'svelte/store';
import {
	getTemplates,
	getTemplateById,
	updateTemplate,
	deleteTemplate,
	createTemplate,
	searchTemplates,
	getTemplatesForType
} from '../api/template';

export const template = writable({
	uid: null,
	name: null,
	html: null,
	grapeJSData: null,
	width: null,
	height: null,
	variables: null,
	createdAt: null,
	type: null
});

export const templates = writable([]);

// Actions
export const getTemplatesAction = async () => {
	try {
		const response = await getTemplates();
		if (!response?.templates) {
			templates.set([]);
			return;
		}
		templates.set(response.templates);
	} catch (error) {
		console.error('Error fetching templates:', error);
		templates.set([]);
	}
};

export const getTemplateAction = async (uid) => {
	try {
		template.set({
			uid: null,
			name: null,
			html: null,
			variables: null,
			createdAt: null,
			grapeJSData: null,
			width: null,
			height: null,
			type: null
		});

		const response = await getTemplateById(uid);
		if (!response?.template) {
			return null;
		}

		template.set(response.template);
		return response.template;
	} catch (error) {
		console.error('Error fetching template:', error);
		return null;
	}
};

export const createTemplateAction = async (templateData) => {
	try {
		const response = await createTemplate(templateData);
		if (!response?.template) {
			return null;
		}

		templates.update(t => [...t, response.template]);
		return response.template;
	} catch (error) {
		console.error('Error creating template:', error);
		return null;
	}
};

export const updateTemplateAction = async (templateData) => {
	try {
		const response = await updateTemplate(templateData);
		if (!response?.template) {
			return null;
		}

		templates.update(t => {
			const index = t.findIndex(temp => temp.uid === response.template.uid);
			if (index !== -1) {
				t[index] = response.template;
			}
			return t;
		});
		return response.template;
	} catch (error) {
		console.error('Error updating template:', error);
		return null;
	}
};

export const deleteTemplateAction = async (uid) => {
	try {
		const response = await deleteTemplate(uid);
		if (response?.message) {
			templates.update(t => t.filter(temp => temp.uid !== uid));
			return true;
		}
		return false;
	} catch (error) {
		console.error('Error deleting template:', error);
		return false;
	}
};

export const searchTemplatesAction = async (query) => {
	try {
		const response = await searchTemplates(query);
		if (!response?.templates) {
			templates.set([]);
			return;
		}
		templates.set(response.templates);
	} catch (error) {
		console.error('Error searching templates:', error);
		templates.set([]);
	}
};

export const getTemplatesForTypeAction = async (type) => {
	try {
		const response = await getTemplatesForType(type);
		if (!response?.templates) {
			templates.set([]);
			return;
		}
		templates.set(response.templates);
	} catch (error) {
		console.error('Error fetching templates by type:', error);
		templates.set([]);
	}
};
