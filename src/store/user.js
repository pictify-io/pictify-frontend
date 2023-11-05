import { writable } from 'svelte/store';
import { login, logout, signup } from '../api/auth';
import validateEmail from '../util/validateEmail';

export const user = writable({
    email: null,
    token: null,
});

// Setters

const setUser = (email, token) => {
    user.set({
        email,
        token,
    });
}

export const clearUser = () => {
    user.set({
        email: null,
        token: null,
    });
}

// Getters

export const isLoggedIn = () => {
    return user.email !== null;
}

export const getToken = () => {
    return user.token;
}

export const getEmail = () => {
    return user.email;
}

export const getAuthHeader = () => {
    return `Bearer ${user.token}`;
}

// Actions

export const loginAction = async (email, password) => {

    try {
        if (!email || !password) throw new Error('Email and password are required');
        if (!validateEmail(email)) throw new Error('Email is invalid');
        const response = await login({
            email,
            password,
        });
        setUser(response.email, response.token);
        return response;
    } catch (error) {
        clearUser();
        throw error;
    }

}

export const logoutAction = async () => {
    await logout();
    clearUser();
}

export const signupAction = async (email, password) => {
    try {
        if (!email || !password) throw new Error('Email and password are required');
        if (!validateEmail(email)) throw new Error('Email is invalid');
        const response = await signup({
            email,
            password,
        });
        setUser(response.email, response.token);
        return response;
    }
    catch (error) {
        clearUser();
        throw error;
    }
}





