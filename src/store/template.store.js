import { writable } from "svelte/store";
import { getTemplates, getTemplate, updateTemplate, deleteTemplate, createTemplate } from "../api/userTemplate";
import { get } from "svelte/store";

export const template = new writable({
    uid: null,
    name: null,
    html: null,
    grapeJSData: null,
    with: null,
    height: null,
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
        template.set({
            uid: null,
            name: null,
            html: null,
            variables: null,
            createdAt: null,
            grapeJSData: null,
            with: null,
            height: null,
        });
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

        return template;
    }
    catch (error) {
        throw error;
    }
}


export const updateTemplateAction = async () => {
    try {
        const data = get(template);
        const response = await updateTemplate(data);
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

export const createTemplateAction = async (newTemplate) => {
    try {
        const response = await createTemplate(newTemplate);
        templates.update((templates) => {
            templates.push(response);
            return templates;
        });
    }
    catch (error) {
        throw error;
    }
}

