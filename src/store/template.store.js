import { writable } from "svelte/store";
import { getTemplates, getTemplate, updateTemplate, deleteTemplate } from "../api/userTemplate";

export const template = new writable({
    uid: null,
    name: null,
    html: null,
    variables: null,
    createdAt: null,
});

export const templates = new writable([]);


// Actions

export const getTemplatesAction = async () => {
    try {
        const response = await getTemplates();
        if (!response.templates) {
            response.templates = [];
        }
        templates.set(response.templates);
    }
    catch (error) {
        throw error;
    }
}

export const getTemplateAction = async (uid) => {
    try {
        const response = await getTemplate(uid);
        if (!response.template) {
            response.templates = null;
        }

        template.set(response.template);
        templates.update((templates) => {
            const index = templates.findIndex((template) => template.uid === response.uid);
            templates[index] = response;
            return templates;
        });
    }
    catch (error) {
        throw error;
    }
}


export const updateTemplateAction = async () => {
    try {
        const response = await updateTemplate(template);
        templates.update((templates) => {
            const index = templates.findIndex((template) => template.uid === response.uid);
            templates[index] = response;
            return templates;
        });
    }
    catch (error) {
        throw error;
    }
}

export const deleteTemplateAction = async (uid) => {
    try {
        const response = await deleteTemplate(uid);
        templates.update((templates) => {
            return templates.filter((template) => template.uid !== uid);
        });
    }
    catch (error) {
        throw error;
    }
}

