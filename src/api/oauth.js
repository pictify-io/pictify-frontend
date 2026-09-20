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

/**
 * Look up a pending authorization-code consent request by its handle.
 * The handle came from the /oauth/authorize redirect; possession is what
 * lets this browser read it. Returns client_name/scope/redirect_host.
 */
export const lookupConsentRequest = async (handle) => {
	try {
		return await backend.get('/oauth/consent/lookup', { params: { request: handle } });
	} catch (error) {
		if (error.status === 404) throw new Error('This authorization request is invalid or has expired');
		throw new Error('Error looking up this authorization request');
	}
};

/**
 * Approve or deny a pending authorization-code request. Requires an
 * authenticated session, and only resolves for the account the request was
 * issued to. Returns { status, redirect_uri } — the caller navigates there.
 */
export const resolveConsentRequest = async (handle, action) => {
	try {
		return await backend.post('/oauth/consent/approve', { request: handle, action });
	} catch (error) {
		if (error.status === 401) throw new Error('Please log in to continue');
		if (error.status === 404) throw new Error('This authorization request is invalid or has expired');
		throw new Error('Error resolving this authorization request');
	}
};
