/**
 * Brand kit API client. FE-20 (boards D11 / D11a / D11b).
 *
 * Written like `src/api/campaign.js` and deliberately NOT like the rest of
 * `src/api/*`: no `catch { return null }`. Those wrappers turn every failure
 * into an empty success, and a caller that forgets to check renders a blank
 * screen as though the server had answered.
 *
 * That matters more here than on a template list, because the failures on this
 * screen are ones the buyer has to be told about by name: a detect that could
 * not read their site, a save that lost a race with another tab, an upload
 * refused for its type. `backend` already throws `HttpError` carrying `status`
 * and the parsed body; that error is allowed to reach the caller.
 *
 * The v1 `src/api/brand-assets.js` (asset rows by type/category) still backs
 * the storage of individual files. This module is the KIT — roles, revisions
 * and the specimen — and the two are not the same shape on purpose.
 */

import backend from '../service/backend';

const enc = encodeURIComponent;

/** Normalise a thrown `HttpError` into something a screen can branch on. */
export function brandKitError(err) {
	const data = (err && err.data) || {};
	return {
		status: err?.status ?? 0,
		code: data.code || (err?.status ? `http_${err.status}` : 'network_error'),
		message: data.message || err?.message || 'Something went wrong.',
		fieldErrors: data.fieldErrors || null
	};
}

/**
 * The current kit, its revision, and what is using it.
 *
 * `{ revision, savedAt, kit, usedBy: [{ name, editionUid, designRevision,
 * state, brandRevision }], website, locked }`. A team that has never saved one
 * gets `revision: 0` and a null kit — the empty state (D11a) is a real answer,
 * not a 404 to be swallowed.
 */
export const getBrandKit = () => backend.get('/brand-kit');

/**
 * Save the working kit as the next revision.
 *
 * REVISIONS, NOT OVERWRITES (locked decision). `expectedRevision` is the
 * revision this edit started from, so two tabs cannot silently overwrite each
 * other — the loser gets a conflict and can look before choosing. Approved
 * editions keep the revision they were approved with regardless; that pinning
 * is the server's job, not this call's.
 */
export const saveBrandKitRevision = (kit, expectedRevision) =>
	backend.post('/brand-kit/revisions', { kit, expectedRevision });

/**
 * Read a public homepage once and propose a kit from it.
 *
 * PROPOSES, NEVER PERSISTS. The response is a draft the buyer confirms with
 * "Save as rev 1"; if they close the page instead, nothing was written. The
 * promise in the dialog — "Nothing is saved until you confirm" — is only true
 * because this route has no side effect.
 *
 * `{ website, found: { logos, colours, fonts }, kit }`, where `found` carries
 * the counts the FOUND tags print. A site that could not be read is an error
 * with a code, not an empty kit that would read as "your brand is nothing".
 */
export const detectBrandKit = (website) => backend.post('/brand-kit/detect', { website });

/**
 * Upload a logo or a font file.
 *
 * Multipart. The stored file is publicly addressed, which is deliberate and
 * was reversed from an earlier plan: the RENDERER has to fetch a logo to draw
 * it onto a card, and a gateway-gated URL would mean teaching the render path
 * to authenticate for every logo. It is also the team's own mark, usually read
 * off their public homepage — not customer data.
 *
 * The privacy that matters happens at approval instead, and is stronger: the
 * edition copies the bytes into its own private storage, so an approved
 * edition never reads this URL and cannot be changed by anything done to it
 * later.
 *
 * `kind` is 'mark' | 'wordmark' | 'font'. The server decides the stored type;
 * sending it is a hint for the row the file came from, not an authority.
 */
export function uploadBrandFile(file, kind) {
	const form = new FormData();
	form.append('file', file, file.name);
	form.append('kind', kind);
	return backend.postFormData('/brand-kit/assets', form);
}

/**
 * Remove an asset from the working kit.
 *
 * `confirmName` is the typed confirmation from the D10 pattern, required only
 * when the asset is used by an approved edition. The server re-checks it —
 * the client asking is a courtesy, the server refusing is the guarantee.
 */
export const deleteBrandAsset = (assetUid, confirmName) =>
	backend.delete(`/brand-kit/assets/${enc(assetUid)}`, {
		/*
		 * STRINGIFIED, with the content type set. `backend.delete` spreads
		 * options straight into fetch and does neither for you, so an object
		 * here is serialised as the literal "[object Object]" and the server
		 * sees a confirmation that can never match. Same shape as
		 * `requestEditionDeletion`, which is the D10 delete this one mirrors.
		 */
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ confirmName: confirmName || '' })
	});
