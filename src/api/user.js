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

export {
    getUser,
};
