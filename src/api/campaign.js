/**
 * Campaigns API client — every route in spec §7.
 *
 * Deliberately NOT written like the other files in this directory. Most of
 * `src/api/*` wraps each call in `try { … } catch { return null }`, which turns
 * every failure into an empty success: a caller that does not check for `null`
 * renders a blank screen as though the server had answered. That is survivable
 * for a template list. It is not survivable here, where the failure modes are
 * "your approval is stale", "this edition was purged" and "you are not allowed
 * to read this tenant" — each of which the buyer must be told about by name.
 *
 * So: no catch blocks. `backend` already throws `HttpError` carrying `status`
 * and the parsed body, and that error is allowed to reach the caller. Read it
 * with `campaignError()` below.
 *
 * INV-06: campaign data is private. Nothing here builds a public artifact URL —
 * downloads go through the authenticated gateway routes and come back as blobs.
 */

import backend from '../service/backend';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

/* ------------------------------------------------------------------ errors */

/**
 * Normalise a thrown `HttpError` into the `{ code, message, requestId,
 * fieldErrors }` shape spec §7 promises.
 *
 * `code` is what UI should branch on; `message` is a fallback for display only
 * when we have nothing better. A server that answers without a code gets
 * `unknown_error` rather than an empty string, so no branch silently matches.
 */
export function campaignError(err) {
	const data = (err && err.data) || {};
	return {
		status: err?.status ?? 0,
		code: data.code || (err?.status ? `http_${err.status}` : 'network_error'),
		message: data.message || err?.message || 'Something went wrong.',
		requestId: data.requestId || null,
		fieldErrors: data.fieldErrors || null
	};
}

/** Codes the UI is expected to handle explicitly (spec §7 "Required errors"). */
export const CAMPAIGN_ERROR_CODES = [
	'malformed_request',
	'unauthenticated',
	'campaign_not_enabled',
	'permission_denied',
	'not_found',
	'stale_revision',
	'idempotency_conflict',
	'invalid_state',
	'upload_too_large',
	'invalid_dataset',
	'unsupported_format',
	'empty_audience',
	'capacity_limited',
	'temporarily_unavailable'
];

/* ----------------------------------------------------------- idempotency */

/**
 * A fresh key for one user gesture.
 *
 * Hold it in component state for the life of the gesture and reuse it across
 * network retries of that gesture. Generating a new key per network attempt
 * would defeat the point — the server would see two distinct intents.
 */
export function newIdempotencyKey() {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
	return `ik_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The key for starting a run, derived rather than random.
 *
 * Starting the same approved revision twice is never an intent, it is a double
 * click or a reconnect. Deriving the key from the approval means the server
 * collapses those into one run even across a page reload, which a random key
 * could not do.
 */
export const startRunIdempotencyKey = (approvalId, expectedRevision) =>
	`start:${approvalId}:${expectedRevision}`;

const withKey = (key) => ({ headers: { 'Idempotency-Key': key } });

const q = (params = {}) => {
	const search = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined || v === null || v === '') continue;
		search.set(k, String(v));
	}
	const s = search.toString();
	return s ? `?${s}` : '';
};

const enc = encodeURIComponent;

/* ------------------------------------------------------- capabilities */

/** Authoritative limits and entitlement. Never cache this past a step change. */
export const getCapabilities = () => backend.get('/campaigns/capabilities');

/* ---------------------------------------------------------- campaigns */

export const createCampaign = (config) => backend.post('/campaigns', config);

export const listCampaigns = ({ cursor, limit, includeSample } = {}) =>
	backend.get(`/campaigns${q({ cursor, limit, includeSample })}`);

export const getCampaign = (campaignUid) => backend.get(`/campaigns/${enc(campaignUid)}`);

/**
 * Config edits carry the version the buyer was looking at. A `409
 * stale_revision` means someone else changed it and the UI must reload before
 * offering to save again — do not retry this call automatically.
 */
export const updateCampaign = (campaignUid, patch, expectedVersion) =>
	backend.patch(`/campaigns/${enc(campaignUid)}`, { ...patch, expectedVersion });

export const archiveCampaign = (campaignUid, expectedVersion) =>
	backend.patch(`/campaigns/${enc(campaignUid)}`, { archived: true, expectedVersion });

/* ----------------------------------------------------------- editions */

/** New period or correction revision. The server assigns identity; no client uid. */
export const createEdition = (campaignUid, body = {}) =>
	backend.post(`/campaigns/${enc(campaignUid)}/editions`, body);

export const getEdition = (campaignUid, editionUid) =>
	backend.get(`/campaigns/${enc(campaignUid)}/editions/${enc(editionUid)}`);

export const updateEdition = (campaignUid, editionUid, patch, expectedRevision) =>
	backend.patch(`/campaigns/${enc(campaignUid)}/editions/${enc(editionUid)}`, {
		...patch,
		expectedRevision
	});

/**
 * Upload the CSV.
 *
 * Multipart and private: the file is ingested, never parked at a public URL.
 * A 413 here is `upload_too_large` and is the server's limit, not ours — the
 * client-side check in `src/lib/campaigns/csv.js` exists to explain the problem
 * sooner, not to be the boundary.
 */
export function uploadEditionData(campaignUid, editionUid, file) {
	const form = new FormData();
	form.append('file', file, file.name);
	return backend.postFormData(
		`/campaigns/${enc(campaignUid)}/editions/${enc(editionUid)}/data`,
		form
	);
}

/** Authoritative validation. The client's own pass is advisory only. */
export const validateEdition = (campaignUid, editionUid, body = {}) =>
	backend.post(`/campaigns/${enc(campaignUid)}/editions/${enc(editionUid)}/validate`, body);

export const listEditionItems = (campaignUid, editionUid, { cursor, limit, status } = {}) =>
	backend.get(
		`/campaigns/${enc(campaignUid)}/editions/${enc(editionUid)}/items${q({
			cursor,
			limit,
			status
		})}`
	);

/**
 * Record a decision about one account: exclude (with a reason), include again,
 * neutral narrative variant, or a shorter display name.
 *
 * Deliberately cannot change a figure. A resolution that edited a value would
 * make "fix the issues" mean "make the data say something else", and every
 * approval downstream would be describing data nobody uploaded.
 */
export const updateItem = (campaignUid, editionUid, itemUid, decision) =>
	backend.patch(
		`/campaigns/${enc(campaignUid)}/editions/${enc(editionUid)}/items/${enc(itemUid)}`,
		decision
	);

/* ----------------------------------------------------------- previews */

/** `202 { previewRunId }`. The set is capped server-side; do not ask for more. */
export const startPreviewRun = (campaignUid, editionUid, body = {}) =>
	backend.post(`/campaigns/${enc(campaignUid)}/editions/${enc(editionUid)}/previews`, body);

export const getPreviewRun = (previewRunId) =>
	backend.get(`/campaign-preview-runs/${enc(previewRunId)}`);

/**
 * Persist the approval against exactly what was on screen.
 *
 * The digests are the point: a `409` means the config, data or previews moved
 * under the buyer between looking and approving, and they must look again.
 * Never resend this with refreshed digests on the buyer's behalf.
 */
export const approveEdition = (
	campaignUid,
	editionUid,
	{ configDigest, dataDigest, previewDigest, acknowledgements, externalApprovalRef } = {}
) =>
	backend.post(`/campaigns/${enc(campaignUid)}/editions/${enc(editionUid)}/approve`, {
		configDigest,
		dataDigest,
		previewDigest,
		acknowledgements,
		externalApprovalRef
	});

/* --------------------------------------------------------------- runs */

/** `202 { runId, status, statusUrl }` — no artifact URL, generation is async. */
export const startRun = (campaignUid, editionUid, { approvalId, expectedRevision }) =>
	backend.post(
		`/campaigns/${enc(campaignUid)}/editions/${enc(editionUid)}/runs`,
		{ approvalId, expectedRevision },
		withKey(startRunIdempotencyKey(approvalId, expectedRevision))
	);

export const getRun = (runId) => backend.get(`/campaign-runs/${enc(runId)}`);

/**
 * Retry eligible failures on the same approved revision. Ready items are not
 * touched. `idempotencyKey` must come from `newIdempotencyKey()` at the moment
 * the buyer clicks, and be reused if the call has to be repeated.
 */
export const retryRun = (runId, { itemIds, idempotencyKey }) =>
	backend.post(`/campaign-runs/${enc(runId)}/retry`, { itemIds }, withKey(idempotencyKey));

/** `202` — a request, not an outcome. The settled state arrives via `getRun`. */
export const cancelRun = (runId, { idempotencyKey }) =>
	backend.post(`/campaign-runs/${enc(runId)}/cancel`, {}, withKey(idempotencyKey));

/* ------------------------------------------------------------ exports */

export const startExport = (runId, { idempotencyKey }) =>
	backend.post(`/campaign-runs/${enc(runId)}/exports`, {}, withKey(idempotencyKey));

export const getExport = (exportId) => backend.get(`/campaign-exports/${enc(exportId)}`);

/* ---------------------------------------------------------- downloads */

const FILENAME = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i;

/**
 * Fetch an authenticated artifact as a blob.
 *
 * Not `backend.get`: the response is a file, not JSON, and the whole point of
 * the gateway is that there is no URL to hand to an <a href> — the request must
 * carry credentials. An expired or purged package answers 403/404/410 and that
 * error is thrown, because "the download quietly did nothing" is the one
 * outcome the buyer must never see.
 */
async function downloadBlob(path) {
	const response = await fetch(`${PUBLIC_BACKEND_URL}${path}`, {
		credentials: 'include',
		cache: 'no-store'
	});

	if (!response.ok) {
		let data = {};
		try {
			data = await response.json();
		} catch (e) {
			/* a gateway failure need not be JSON */
		}
		const err = new Error(data.message || response.statusText);
		err.status = response.status;
		err.data = data;
		throw err;
	}

	const disposition = response.headers.get('content-disposition') || '';
	const match = FILENAME.exec(disposition);
	return {
		blob: await response.blob(),
		filename: match ? decodeURIComponent(match[1]) : null,
		contentType: response.headers.get('content-type') || null
	};
}

export const downloadExport = (exportId) =>
	downloadBlob(`/campaign-exports/${enc(exportId)}/download`);

export const downloadArtifact = (artifactId) =>
	downloadBlob(`/campaign-artifacts/${enc(artifactId)}/download`);

/* ------------------------------------------------------ confirmations */

/**
 * The buyer reports that they launched it from their own tool.
 *
 * A record of what they told us, nothing more. Pictify does not observe the
 * send and must never present this as evidence that mail was delivered.
 */
export const recordLaunchConfirmation = (
	campaignUid,
	editionUid,
	{ tool, launchedOn, note } = {}
) =>
	backend.post(`/campaigns/${enc(campaignUid)}/editions/${enc(editionUid)}/launch-confirmation`, {
		tool,
		launchedOn,
		note
	});

/** Acceptance of the exported package. Distinct from launching, and from downloading. */
export const recordHandoffConfirmation = (
	campaignUid,
	editionUid,
	{ exportId, exportDigest } = {}
) =>
	backend.post(`/campaigns/${enc(campaignUid)}/editions/${enc(editionUid)}/handoff-confirmation`, {
		exportId,
		exportDigest
	});

/* ----------------------------------------------------------- deletion */

/**
 * Request a purge of an edition's inputs and outputs. `202 { deletionId }`.
 *
 * Not archiving. Data access is denied immediately; the purge itself is not
 * complete until `getDeletion` says so, and the UI must not claim otherwise.
 */
export const requestEditionDeletion = (campaignUid, editionUid, { confirmation }) =>
	backend.delete(`/campaigns/${enc(campaignUid)}/editions/${enc(editionUid)}`, {
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ confirmation })
	});

export const getDeletion = (deletionId) => backend.get(`/campaign-deletions/${enc(deletionId)}`);
