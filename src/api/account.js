import backend from '../service/backend';

/**
 * Close the account.
 *
 * Named "request" because that is what it is: the subscription is cancelled
 * and every session is dropped immediately, but the data is removed by an
 * operator afterwards rather than purged on the spot. The copy the user sees
 * says the same thing — nothing here implies an instant wipe that didn't
 * happen.
 *
 * Unlike most wrappers in this directory this one lets errors throw, so a
 * refusal (wrong confirmation, not the owner) reaches the caller instead of
 * being flattened to null.
 *
 * @param {string} confirm - Must exactly match the team name (or the account
 *   email for a solo user); the server checks it again.
 * @returns {Promise<{closed: boolean, subscriptionCancelled: boolean, message: string}>}
 */
export async function requestAccountDeletion(confirm) {
	return backend.post('/account/request-deletion', { confirm });
}
