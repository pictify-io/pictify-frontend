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
import { analytics } from '$lib/telemetry.js';

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
	const tokens = apiTokens || [];
	user.update((user) => {
		return {
			...user,
			apiTokens: tokens
		};
	});

	if (tokens.length > 0) {
		activeApiToken.set(tokens.filter((apiToken) => apiToken.active)[0]);
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
		/*
		 * "Nobody is signed in" is an ANSWER, not a failure. `/api/users` 401s
		 * for every logged-out visitor, and every caller here — the dashboard
		 * and workspace layout guards, the login page — branches on null to
		 * send them to /login. Since the API wrapper stopped swallowing, this
		 * is the one place that has to keep translating it, or a logged-out
		 * visit to /dashboard throws in onMount and sits on the loader
		 * forever. Anything else is a real failure and still propagates.
		 */
		if (error?.status === 401 || error?.status === 403) return null;
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

		// Track login and identify user
		analytics.identify(userData.email, {
			email: userData.email,
			plan: userData.currentPlan || 'starter',
			is_email_verified: userData.isEmailVerified
		});
		analytics.trackLoginCompleted({ method: 'email' });

		return response;
	} catch (error) {
		clearUser();
		throw error;
	}
};

export const logoutAction = async () => {
	await logout();
	clearUser();
	analytics.reset();
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

			// Track signup, identify user, and track as login
			analytics.identify(userData.email, {
				email: userData.email,
				plan: 'starter',
				signup_date: new Date().toISOString(),
				is_email_verified: false
			});
			analytics.trackSignupCompleted({ method: 'email', plan: 'starter' });
			analytics.trackLoginCompleted({ method: 'email', is_new_signup: true });
		}
		return response;
	} catch (error) {
		clearUser();
		throw error;
	}
};

export const impersonateAction = async (password, email, userId) => {
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
	/*
	 * Reading the keys is page furniture: a failure empties the list and lets
	 * the surface say so, rather than throwing out of an onMount that has no
	 * catch. Creating and revoking DO propagate — those are actions someone
	 * clicked, and the toast needs the error.
	 */
	let response = null;
	try {
		response = await getApiToken();
	} catch {
		setApiTokens([]);
		return null;
	}
	setApiTokens(response?.apiTokens || []);
	return response;
};

export const createAPITokenAction = async () => {
	await createApiToken();
	const response = await getApiToken();
	if (response && response.apiTokens) {
		setApiTokens(response.apiTokens);
	}
	analytics.trackAPIKeyCreated();
	return response;
};

export const deleteAPITokenAction = async (apiTokenId) => {
	await deleteApiToken(apiTokenId);
	const response = await getApiToken();
	if (response && response.apiTokens) {
		setApiTokens(response.apiTokens);
	}
	return response;
};

export const getPlanDetailsAction = async () => {
	// Also page furniture (the usage card, the plan gate): unknown, not fatal.
	let response = null;
	try {
		response = await getPlanDetails();
	} catch {
		response = null;
	}
	user.update((user) => {
		return {
			...user,
			planDetails: response
		};
	});
	return response;
};
