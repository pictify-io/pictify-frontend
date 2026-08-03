import backend from '../service/backend';

/**
 * Sending-domain API — workspace email sender settings.
 * Base path: /sending-domain
 */

/**
 * Current sender configuration.
 * @returns {Promise<Object>} - { shared: { domain, fromAddress }, identity|null }
 */
const getSendingDomain = async () => {
	const response = await backend.get('/sending-domain');
	return response;
};

/**
 * Auto-provision a dedicated sending subdomain (paid plans).
 * @returns {Promise<Object>} - { identity }
 */
const provisionSendingDomain = async () => {
	const response = await backend.post('/sending-domain/provision', {});
	return response;
};

/**
 * Re-check DNS verification for the pending domain.
 * @returns {Promise<Object>} - { identity }
 */
const verifySendingDomain = async () => {
	const response = await backend.post('/sending-domain/verify', {});
	return response;
};

/**
 * Update sender defaults.
 * @param {Object} patch - { defaultFromName?, defaultReplyTo? }
 * @returns {Promise<Object>} - { identity }
 */
const updateSendingDefaults = async (patch) => {
	const response = await backend.patch('/sending-domain', patch);
	return response;
};

export { getSendingDomain, provisionSendingDomain, verifySendingDomain, updateSendingDefaults };
