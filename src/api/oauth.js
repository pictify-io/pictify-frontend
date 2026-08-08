import backend from '../service/backend';

/**
 * Look up a pending device-authorization request by its user_code.
 * Public — no auth required (returns only client_name/scope/status).
 */
export const lookupDeviceCode = async (userCode) => {
	try {
		return await backend.get('/oauth/device/lookup', { params: { user_code: userCode } });
	} catch (error) {
		if (error.status === 404) throw new Error('This code is invalid or has expired');
		throw new Error('Error looking up device code');
	}
};

/**
 * Approve or deny a pending device-authorization request.
 * Requires an authenticated session.
 */
export const resolveDeviceCode = async (userCode, action) => {
	try {
		return await backend.post('/oauth/device/approve', { user_code: userCode, action });
	} catch (error) {
		if (error.status === 401) throw new Error('Please log in to continue');
		if (error.status === 404) throw new Error('This code is invalid or has expired');
		if (error.status === 400) throw new Error(error.message || 'This request has already been resolved');
		throw new Error('Error resolving device code');
	}
};
