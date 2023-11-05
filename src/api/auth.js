import backend from "../service/backend";

const login = async ({
    email,
    password,
}) => {
    const response = await backend.post('/api/auth/login', {
        email,
        password,
    });
    return response.data;
}

const logout = async () => {
    const response = await backend.post('/api/auth/logout');
    return response.data;
}

const signup = async ({
    email,
    password,
}) => {
    const response = await backend.post('/api/auth/signup', {
        email,
        password,
    });
    return response.data;
}

export {
    login,
    logout,
    signup,
};