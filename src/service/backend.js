import { PUBLIC_BACKEND_URL } from '$env/static/public';

const isCredentialsSupported = 'credentials' in Request.prototype;

class HttpError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

const backend = {
	get: async (url, options = {}) => {
		const apiUrl = new URL(`${PUBLIC_BACKEND_URL}${url}`);

		if (options.params) {
			Object.keys(options.params).forEach((key) =>
				apiUrl.searchParams.append(key, options.params[key])
			);
		}

		const response = await fetch(apiUrl, {
			...options,
			credentials: isCredentialsSupported ? 'include' : undefined,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			}
		});
		if (!response.ok) {
			throw new HttpError(response.status, response.statusText);
		}
		return response.json();
	},

	post: async (url, data = {}, options = {}) => {
		const apiUrl = new URL(`${PUBLIC_BACKEND_URL}${url}`);

		if (options.params) {
			Object.keys(options.params).forEach((key) =>
				apiUrl.searchParams.append(key, options.params[key])
			);
		}

		const response = await fetch(apiUrl, {
			...options,
			credentials: isCredentialsSupported ? 'include' : undefined,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			body: JSON.stringify(data)
		});
		if (!response.ok) {
			throw new HttpError(response.status, response.statusText);
		}
		return response.json();
	},

	put: async (url, data, options = {}) => {
		const apiUrl = new URL(`${PUBLIC_BACKEND_URL}${url}`);

		if (options.params) {
			Object.keys(options.params).forEach((key) =>
				apiUrl.searchParams.append(key, options.params[key])
			);
		}

		const response = await fetch(apiUrl, {
			...options,
			credentials: isCredentialsSupported ? 'include' : undefined,
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			body: JSON.stringify(data)
		});
		if (!response.ok) {
			throw new HttpError(response.status, response.statusText);
		}
		return response.json();
	},

	delete: async (url, options = {}) => {
		const apiUrl = new URL(`${PUBLIC_BACKEND_URL}${url}`);

		if (options.params) {
			Object.keys(options.params).forEach((key) =>
				apiUrl.searchParams.append(key, options.params[key])
			);
		}

		const response = await fetch(apiUrl, {
			...options,
			credentials: isCredentialsSupported ? 'include' : undefined,
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			}
		});
		if (!response.ok) {
			throw new HttpError(response.status, response.statusText);
		}
		return response.json();
	}
};

export default backend;
