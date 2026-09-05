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

/**
 * Adopt the server's stored preference.
 *
 * Called with the user record once it loads. An absent or unknown value leaves
 * the default in place rather than guessing from, say, which page was opened —
 * a deep link into campaigns is a visit, not a decision to switch shells.
 */
export function initExperience(userRecord) {
	const stored = userRecord?.experience;
	if (isExperience(stored)) experience.set(stored);
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
