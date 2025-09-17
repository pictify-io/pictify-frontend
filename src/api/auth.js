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

export { login, logout, signup, impersonate };
