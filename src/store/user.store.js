import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { login, logout, signup, impersonate } from '../api/auth';
import {
	getUser as getUserAPI,
	getApiToken,
	createApiToken,
	deleteApiToken,
	getPlanDetails
} from '../api/user';
import validateEmail from '../util/validateEmail';

const createDefaultUserState = () => ({
	email: null,
	token: null,
	apiTokens: [],
	currentPlan: null,
	planDetails: null,
	isEmailVerified: null,
	verification: null
});

const normalizeUserPayload = (payload = {}) => {
	return {
		email: payload?.email ?? null,
		token: payload?.token ?? null,
		currentPlan: payload?.currentPlan ?? null,
		isEmailVerified: payload?.isEmailVerified ?? null,
		verification: payload?.verification ?? null
	};
};

const extractUser = (response) => response?.user ?? response ?? null;

export const user = writable(createDefaultUserState());

export const activeApiToken = writable(null);
// Setters

const setUser = (userPayload = {}) => {
	const normalized = normalizeUserPayload(userPayload);
	user.set({
		...createDefaultUserState(),
		...normalized
	});
};

export const clearUser = () => {
	user.set(createDefaultUserState());
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
	return get(user).token;
};

export const getEmail = () => {
	return get(user).email;
};

export const getAuthHeader = () => {
	const token = get(user).token;
	return token ? `Bearer ${token}` : '';
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
			const payload = extractUser(response);
			if (!payload) {
				return null;
			}
			setUser(payload);
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
		const apiResponse = await getUserAPI();
		const userData = extractUser(apiResponse);
		if (!userData) {
			return null;
		}
		setUser(userData);
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
		const apiResponse = await getUserAPI();
		const userData = extractUser(apiResponse);
		if (userData) {
			setUser(userData);
		}
		return response;
	} catch (error) {
		clearUser();
		throw error;
	}
};

export const impersonateAction = async (password, email, userId) => {
	try {
		if (!password) throw new Error('Admin password is required');
		if (!email && !userId) throw new Error('Provide either email or userId');
		await impersonate({ password, email, userId });
		const apiResponse = await getUserAPI();
		const userData = extractUser(apiResponse);
		if (!userData) {
			return null;
		}
		setUser(userData);
		return userData;
	} catch (error) {
		throw error;
	}
};

export const getUserAction = async () => {
	try {
		const response = await getUserAPI();
		const payload = extractUser(response);
		if (payload) {
			setUser(payload);
		}
		return payload;
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
