import backend from '../service/backend';

const login = async ({ email, password }) => {
	try {
		const response = await backend.post('/auth/login', {
			email,
			password
		});
		return response.data;
	} catch (error) {
		if (error.status === 401) throw new Error('Invalid email or password');
		else throw new Error('Error logging in');
	}
};

const logout = async () => {
	const response = await backend.post('/auth/logout');
	return response.data;
};

const signup = async ({ email, password }) => {
	try {
		const response = await backend.post('/auth/signup', {
			email,
			password
		});
		return response.data;
	} catch (error) {
		if (error.status === 409) throw new Error('Email already exists');
		else if (error.response.status === 401) throw new Error(error.response.data.message);
		else throw new Error('Error signing up');
	}
};

const verifyEmail = async ({ token }) => {
	if (!token) {
		throw new Error('Verification token is required');
	}
	try {
		const response = await backend.post('/auth/verify-email', {
			token
		});
		return response;
	} catch (error) {
		if (error.status === 400) {
			throw new Error('Your verification link is invalid or expired');
		}
		throw new Error('Error verifying email');
	}
};

const resendVerificationEmail = async () => {
	try {
		const response = await backend.post('/auth/resend-verification');
		return response;
	} catch (error) {
		if (error.status === 429) {
			throw new Error('Verification email was just sent. Please try again in a moment.');
		}
		throw new Error('Unable to resend verification email right now');
	}
};

const impersonate = async ({ password, email, userId }) => {
	try {
		const response = await backend.post('/auth/impersonate', {
			password,
			email,
			userId
		});
		return response.data;
	} catch (error) {
		if (error.status === 401) throw new Error('Invalid admin credentials');
		else throw new Error('Error impersonating user');
	}
};

export { login, logout, signup, verifyEmail, resendVerificationEmail, impersonate };
