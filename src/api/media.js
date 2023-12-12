import backend from "../service/backend";

const getImages = async (token) => {
    try {
        backend.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const response = await backend.get('/api/image');
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

const getGifs = async (token) => {
    try {
        backend.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const response = await backend.get('/api/gif');
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

export {
    getImages,
    getGifs,
};