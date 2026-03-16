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
	const response = await backend.post('/api/users/api-tokens');
	return response;
};

const deleteApiToken = async (apiTokenId) => {
	const response = await backend.delete(`/api/users/api-tokens/${apiTokenId}`);
	return response;
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
	const response = await backend.post('/auth/reset-password', {
		password,
		token
	});
	return response;
};

const forgotPassword = async (email) => {
	const response = await backend.post('/auth/forgot-password', {
		email
	});
	return response;
};

const getPaymentPortal = async () => {
	const response = await backend.get('/lemon-squeezy/customer-portal');
	return response;
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
