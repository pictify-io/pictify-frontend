import backend from "../service/backend";

const login = async ({
    email,
    password,
}) => {
    try {
        const response = await backend.post('/auth/login', {
            email,
            password,
        });
        return response.data;
    } catch (error) {
        console.log(error.response);
        if (error.response.status === 401)
            throw new Error("Invalid email or password");
        else
            throw new Error("Error logging in");
    }

}

const logout = async () => {
    const response = await backend.post('/auth/logout');
    return response.data;
}

const signup = async ({
    email,
    password,
}) => {
    try {
        const response = await backend.post('/auth/signup', {
            email,
            password,
        });
        return response.data;
    } catch (error) {
        if (error.response.status === 409)
            throw new Error("Email already exists");
        else if (error.response.status === 401)
            throw new Error(error.response.data.message);
        else
            throw new Error("Error signing up");
    }

}

export {
    login,
    logout,
    signup,
};