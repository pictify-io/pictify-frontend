import { writable, derived } from 'svelte/store';
import backend from '../service/backend';

/**
 * Which shell the buyer sees: the platform tools, or campaigns.
 *
 * A preference, not an entitlement. It decides which rail is drawn and nothing
 * else — a buyer whose preference is `campaigns` but who has no pilot access
 * still gets the access-request card rather than a working campaign, because
 * that check belongs to the server's capabilities response (FE-4), not here.
 *
 * `platform` is the default and the fallback for every unreadable value. The
 * platform tools are the shipped product; defaulting the other way would put a
 * new signup inside a pilot they were never granted.
 */

const EXPERIENCES = ['platform', 'campaigns'];
export const isExperience = (value) => EXPERIENCES.includes(value);

export const experience = writable('platform');

/** True only for the campaigns shell, so templates can read one boolean. */
export const isCampaignExperience = derived(experience, ($e) => $e === 'campaigns');

/** True once the server has answered, so the rail can avoid a flash of default. */
export const experienceLoaded = writable(false);

let inflight = null;

/**
 * Fetch the stored preference.
 *
 * It comes from GET /me/experience, NOT from the user record. The preference is
 * per (user, team) — the same person can pilot campaigns in one workspace and
 * use the platform in another — so it cannot live as a field on the user, and
 * reading one there silently returns undefined and leaves everyone in the
 * platform shell. That was the first version of this and the rail never
 * switched.
 *
 * A failure leaves the default in place. Not being able to read a preference is
 * not a reason to show an error; it is a reason to show the shipped product.
 */
export function initExperience() {
	if (inflight) return inflight;
	inflight = backend
		.get('/me/experience')
		.then((data) => {
			if (isExperience(data?.experience)) experience.set(data.experience);
			experienceLoaded.set(true);
			return data;
		})
		.catch(() => {
			experienceLoaded.set(true);
			return null;
		})
		.finally(() => {
			inflight = null;
		});
	return inflight;
}

/**
 * Persist a switch.
 *
 * The store is updated only after the server accepts it. Updating first and
 * rolling back on failure would flash the other shell's rail, and a rail that
 * changes twice reads as a bug rather than as a rejected request. The error is
 * rethrown so the caller can say why nothing happened.
 */
export async function setExperienceAction(next) {
	if (!isExperience(next)) throw new Error(`Unknown experience: ${next}`);
	await backend.patch('/me/experience', { experience: next });
	experience.set(next);
	return next;
}
