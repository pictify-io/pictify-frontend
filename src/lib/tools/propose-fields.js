/**
 * "This could be a template." TS-11.
 *
 * Someone pastes a working page into the code-first tool and gets a render.
 * That is the whole job as far as they asked, and it is also the moment the
 * product is worth the most and says the least: the thing they pasted is one
 * step from a template they can call with different values, and nothing on
 * screen tells them so.
 *
 * A PROPOSAL, NOT A REWRITE. The same `inferFields` heuristic that rescues an
 * untokenised gallery template runs here, but the result is shown as an offer
 * with the actual words it would replace, and applied only if accepted.
 * Silently turning someone's headline into `{{heading}}` is indistinguishable
 * from a bug — they did not ask for a template, and the design now reads in
 * mustache.
 *
 * WE DO NOT PROPOSE OVER AN EXISTING CONTRACT. A document that already has
 * tokens has an author who decided what its fields are, and adding five more
 * from a guess is an edit, not a suggestion.
 */
import { inferFields } from './tokenise-template.js';

/** Below this the offer is noise: one field is not a template. */
const MIN_FIELDS = 2;

/**
 * `null` when there is nothing worth offering, otherwise
 * `{ count, fields: [{ name, sample }], html, samples }`.
 *
 * `fields` carries the ORIGINAL TEXT of each proposal, because that is the
 * only part a person can check. "5 fields found" is a number to be trusted or
 * not; "heading ← Edit this HTML" is a claim they can read.
 */
export function proposeFields(html) {
	const src = String(html ?? '');
	if (!src.trim()) return null;
	// An existing contract is the author's, not ours to extend.
	if (/\{\{\s*[A-Za-z0-9_.]+\s*\}\}/.test(src)) return null;

	const { html: tokenised, samples, variables } = inferFields(src);
	if (variables.length < MIN_FIELDS) return null;

	return {
		count: variables.length,
		fields: variables.map((name) => ({ name, sample: samples[name] ?? '' })),
		html: tokenised,
		samples
	};
}
