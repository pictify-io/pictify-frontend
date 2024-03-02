import backend from "../service/backend";

const getUser = async () => {
    try {
        const response = await backend.get('/api/users');
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

const getApiToken = async () => {
    try {
        const response = await backend.get('/api/users/api-tokens');
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

const createApiToken = async () => {
    try {
        const response = await backend.post('/api/users/api-tokens');
        return response.data;
    }
    catch (error) {
        throw error;
    }
};

const deleteApiToken = async (apiTokenId) => {
    try {
        const response = await backend.delete(`/api/users/api-tokens/${apiTokenId}`);
        return response.data;
    }
    catch (error) {
        throw error;
    }
};

const getPlanDetails = async () => {
    try {
        const response = await backend.get('/api/users/plans');
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

const resetPassword = async ({ password, token }) => {
    try {
        const response = await backend.post('/auth/reset-password', {
            password,
            token
        });
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

const forgotPassword = async (email) => {
    try {
        const response = await backend.post('/auth/forgot-password', {
            email
        });
        return response.data;
    }
    catch (error) {
        throw error;
    }
}


export {
    getUser,
    getApiToken,
    createApiToken,
    deleteApiToken,
    getPlanDetails,
    resetPassword,
    forgotPassword
};
