/**
 * The analytics guard. FE-18.
 *
 * NOTHING ABOUT THE BUYER'S CUSTOMERS LEAVES.
 *
 * Every campaign event fires from a screen displaying a named third party's
 * business figures. An account id, an account name, a metric value or a preview
 * URL captured into product analytics would be third-party personal and
 * commercial data sitting in a system nobody in that relationship agreed to —
 * permanently, in a place no purge sweep reaches.
 *
 * This is a GUARD rather than a convention, and it lives in its own file with
 * no imports so it can be tested directly. A convention is one hurried edit
 * away from shipping an account name to PostHog.
 */

/** Keys that must never appear in a campaign event. */
export const FORBIDDEN = new Set([
	'accountid',
	'account_id',
	'externalaccountid',
	'external_account_id',
	'accountname',
	'account_name',
	'name',
	'email',
	'company',
	'values',
	'value',
	'row',
	'rows',
	'items',
	'samples',
	'html',
	'url',
	'artifactpath',
	'objectkey',
	'object_key',
	'file',
	'filename',
	'usecase',
	'use_case',
	'note',
	'reason',
	/*
	 * AI-7. The buyer's own words are the highest-risk field on an AI event:
	 * "make Contoso Freight's number bigger" is an instruction AND a customer
	 * name. Short instructions would slip past the enumerated-string test, so
	 * these are named rather than left to the shape check.
	 */
	'instruction',
	'prompt',
	'text',
	'label',
	'labels',
	'summary',
	'touches',
	'selection',
	'selectedlabel',
	'selected_label'
]);

/**
 * An enumerated product state: short, single-token, no address-like characters.
 *
 * Deliberately strict. "ready" and "partial" pass; "Contoso Freight",
 * "j@northwind.com" and "/campaign-artifacts/x/download" do not, and neither
 * does anything long enough to be prose.
 */
const ENUMERATED = /^[A-Za-z0-9._:-]{1,40}$/;

/**
 * Keep shapes, drop contents.
 *
 * Numbers and booleans pass. Strings pass only when they look like an
 * enumerated state. Everything else is dropped and COUNTED, so a developer who
 * adds a field sees `dropped_keys` in the event rather than the field silently
 * leaking or silently vanishing.
 */
export function scrub(props = {}) {
	const out = {};
	let dropped = 0;

	for (const [key, value] of Object.entries(props || {})) {
		if (FORBIDDEN.has(key.toLowerCase())) {
			dropped++;
			continue;
		}
		if (value === null || value === undefined) continue;

		if (typeof value === 'number') {
			// NaN and Infinity are not measurements; they are bugs travelling.
			if (Number.isFinite(value)) out[key] = value;
			else dropped++;
			continue;
		}
		if (typeof value === 'boolean') {
			out[key] = value;
			continue;
		}
		if (typeof value === 'string') {
			if (ENUMERATED.test(value)) out[key] = value;
			else dropped++;
			continue;
		}
		// Objects and arrays are where customer data hides. Never forwarded.
		dropped++;
	}

	if (dropped) out.dropped_keys = dropped;
	return out;
}
