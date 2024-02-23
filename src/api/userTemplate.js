import backend from "../service/backend";

const getTemplates = async () => {
    try {
        const response = await backend.get('/templates');
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

const getTemplate = async (uid) => {
    try {
        const response = await backend.get(`/templates/${uid}`);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

const createTemplate = async (template) => {
    try {
        const response = await backend.post('/templates', template);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

const updateTemplate = async (template) => {
    try {
        const response = await backend.put(`/templates/${template.uid}`, template);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

const deleteTemplate = async (uid) => {
    try {
        const response = await backend.delete(`/templates/${uid}`);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}


const searchTemplates = async (search) => {
    try {
        const response = await backend.get(`/templates/search?q=${search}`);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}
export {
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    searchTemplates,
};
