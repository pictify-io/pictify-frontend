import { PUBLIC_BACKEND_URL } from '$env/static/public';
import { openUpgradeModal } from '../store/upgrade-modal.store';

class HttpError extends Error {
	constructor(status, message, data = {}) {
		super(message);
		this.status = status;
		this.data = data;
	}
}

// On a quota_exceeded 429 the backend returns { code, upgradeUrl, checkoutUrl? }.
// Surface the upgrade path automatically. Browser-only (no-op during SSR).
function maybeHandleQuota(err) {
	if (
		typeof window !== 'undefined' &&
		err.status === 429 &&
		err.data &&
		err.data.code === 'quota_exceeded'
	) {
		try {
			openUpgradeModal('quota_exceeded', null, err.data.checkoutUrl || null);
		} catch (e) {
			/* ignore */
		}
	}
}

// Shared response handler: returns parsed JSON, or throws an HttpError that
// carries the response body so callers (and maybeHandleQuota) can read
// code / checkoutUrl / message.
async function handleResponse(response) {
	if (response.ok) return response.json();
	let message = response.statusText;
	let data = {};
	try {
		data = await response.json();
		if (data && data.message) message = data.message;
		else if (data && data.error) message = data.error;
	} catch (e) {
		/* ignore */
	}
	const err = new HttpError(response.status, message, data);
	maybeHandleQuota(err);
	throw err;
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
			credentials: 'include',
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			}
		});
		return handleResponse(response);
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
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			body: JSON.stringify(data)
		});
		return handleResponse(response);
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
			credentials: 'include',
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			body: JSON.stringify(data)
		});
		return handleResponse(response);
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
			credentials: 'include',
			method: 'DELETE',
			headers: {
				...options.headers
			}
		});
		return handleResponse(response);
	},

	patch: async (url, data, options = {}) => {
		const apiUrl = new URL(`${PUBLIC_BACKEND_URL}${url}`);

		if (options.params) {
			Object.keys(options.params).forEach((key) =>
				apiUrl.searchParams.append(key, options.params[key])
			);
		}

		const response = await fetch(apiUrl, {
			...options,
			credentials: 'include',
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			body: JSON.stringify(data)
		});
		return handleResponse(response);
	},

	// Upload FormData (for file uploads)
	postFormData: async (url, formData, options = {}) => {
		const apiUrl = new URL(`${PUBLIC_BACKEND_URL}${url}`);

		if (options.params) {
			Object.keys(options.params).forEach((key) =>
				apiUrl.searchParams.append(key, options.params[key])
			);
		}

		const response = await fetch(apiUrl, {
			...options,
			credentials: 'include',
			method: 'POST',
			// Don't set Content-Type header - browser will set it with boundary for FormData
			headers: {
				...options.headers
			},
			body: formData
		});
		return handleResponse(response);
	}
};

export default backend;
