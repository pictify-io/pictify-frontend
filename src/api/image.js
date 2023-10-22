import backend from "../service/backend";

const createImagePublic = async ({
    html,
    width,
    height,
}) => {
    const response = await backend.post('/api/image/public', {
        html,
        width,
        height,
    });
    return response.data;
};

const createGifPublic = async ({
    html,
    width,
    height,
    duration,
}) => {
    const response = await backend.post('/api/gif/public', {
        html,
        width,
        height,
        duration,
    });
    return response.data;
};

export {
    createGifPublic,
    createImagePublic,
};