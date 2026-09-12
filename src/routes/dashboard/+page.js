import { getUser } from '../../store/user.store.js';

/**
 * The guard used to call `getUser()` without awaiting it, so `user` was a
 * Promise, `!user` was never true and the 404 never fired. Now that the user
 * API propagates its failures, the un-awaited promise would also reject with
 * nobody listening — so it is awaited, and a signed-out visitor (null, from
 * the store's 401 handling) is handed to the layout guard that redirects.
 */
export async function load() {
	const user = await getUser().catch(() => null);
	return { props: { user } };
}
