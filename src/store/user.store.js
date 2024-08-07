import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { login, logout, signup } from '../api/auth';
import {
	getUser as getUserAPI,
	getApiToken,
	createApiToken,
	deleteApiToken,
	getPlanDetails
} from '../api/user';
import validateEmail from '../util/validateEmail';

export const user = writable({
	email: null,
	token: null,
	apiTokens: [],
	currentPlan: null,
	planDetails: null
});

export const activeApiToken = writable(null);
// Setters

const setUser = (email, token, currentPlan) => {
	user.set({
		email,
		token,
		currentPlan
	});
};

export const clearUser = () => {
	user.set({
		email: null,
		token: null,
		currentPlan: null
	});
};

export const setApiTokens = (apiTokens) => {
	user.update((user) => {
		return {
			...user,
			apiTokens
		};
	});

	if (apiTokens.length > 0) {
		activeApiToken.set(apiTokens.filter((apiToken) => apiToken.active)[0]);
	}
};
// Getters

export const isLoggedIn = () => {
	const currentUser = get(user);
	return !!currentUser.email;
};

export const getToken = () => {
	return user.token;
};

export const getEmail = () => {
	return user.email;
};

export const getAuthHeader = () => {
	return `Bearer ${user.token}`;
};

export const getUser = async () => {
	let userData;
	try {
		if (isLoggedIn()) {
			userData = get(user);
		} else {
			const response = await getUserAPI();
			if (!response) {
				return null;
			}
			setUser(response.user.email, response.user.token, response.user.currentPlan);
			userData = get(user);
		}
	} catch (error) {
		clearUser();
		throw error;
	}
	return userData;
};
// Actions

export const loginAction = async (email, password) => {
	try {
		if (!email || !password) throw new Error('Email and password are required');
		if (!validateEmail(email)) throw new Error('Email is invalid');
		const response = await login({
			email,
			password
		});
		const { user: userData } = await getUserAPI();
		if (!userData) {
			return null;
		}
		setUser(userData.email, userData.token, userData.currentPlan);
		return response;
	} catch (error) {
		clearUser();
		throw error;
	}
};

export const logoutAction = async () => {
	await logout();
	clearUser();
};

export const signupAction = async (email, password) => {
	try {
		if (!email || !password) throw new Error('Email and password are required');
		if (!validateEmail(email)) throw new Error('Email is invalid');
		const response = await signup({
			email,
			password
		});
		const { user: userData } = await getUserAPI();
		setUser(userData.email, userData.token, userData.currentPlan);
		return response;
	} catch (error) {
		clearUser();
		throw error;
	}
};

export const getUserAction = async () => {
	try {
		const response = await getUserAPI();
		setUser(response.email, response.token, response.currentPlan);
		return response;
	} catch (error) {
		clearUser();
		throw error;
	}
};

export const getAPITokenAction = async () => {
	try {
		const response = await getApiToken();
		setApiTokens(response.apiTokens);
		return response;
	} catch (error) {
		throw error;
	}
};

export const createAPITokenAction = async () => {
	try {
		await createApiToken();
		const response = await getApiToken();
		setApiTokens(response.apiTokens);
		return response;
	} catch (error) {
		throw error;
	}
};

export const deleteAPITokenAction = async (apiTokenId) => {
	try {
		await deleteApiToken(apiTokenId);
		const response = await getApiToken();
		setApiTokens(response.apiTokens);
		return response;
	} catch (error) {
		throw error;
	}
};

export const getPlanDetailsAction = async () => {
	try {
		const response = await getPlanDetails();
		user.update((user) => {
			return {
				...user,
				planDetails: response
			};
		});
		return response;
	} catch (error) {
		throw error;
	}
};
