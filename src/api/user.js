import backend from '../service/backend';

const getUser = async () => {
	try {
		const response = await backend.get('/api/users');
		return response;
	} catch (error) {
		return null;
	}
};

const getApiToken = async () => {
	try {
		const response = await backend.get('/api/users/api-tokens');
		return response;
	} catch (error) {
		return null;
	}
};

const createApiToken = async () => {
	try {
		const response = await backend.post('/api/users/api-tokens');
		return response;
	} catch (error) {
		return null;
	}
};

const deleteApiToken = async (apiTokenId) => {
	try {
		const response = await backend.delete(`/api/users/api-tokens/${apiTokenId}`);
		return response;
	} catch (error) {
		return null;
	}
};

const getPlanDetails = async () => {
	try {
		const response = await backend.get('/api/users/plans');
		return response;
	} catch (error) {
		return null;
	}
};

const resetPassword = async ({ password, token }) => {
	try {
		const response = await backend.post('/auth/reset-password', {
			password,
			token
		});
		return response;
	} catch (error) {
		return null;
	}
};

const forgotPassword = async (email) => {
	try {
		const response = await backend.post('/auth/forgot-password', {
			email
		});
		return response;
	} catch (error) {
		return null;
	}
};

const getPaymentPortal = async () => {
	try {
		const response = await backend.get('/lemon-squeezy/customer-portal');
		return response;
	} catch (error) {
		return null;
	}
};

export {
	getUser,
	getApiToken,
	createApiToken,
	deleteApiToken,
	getPlanDetails,
	resetPassword,
	forgotPassword,
	getPaymentPortal
};
