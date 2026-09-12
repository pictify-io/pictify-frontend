import backend from '../service/backend';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

const getTemplate = async ({ type, variables }) => {
	const url = `/fe/template?type=${type}&variables=${JSON.stringify(variables)}`;
	const response = await backend.get(url);
	return response;
};

const getTemplates = async ({
	page = 1,
	limit = 12,
	sort = 'newest',
	outputFormat = 'all',
	hasDynamicLink
} = {}) => {
	const params = new URLSearchParams({
		page: page.toString(),
		limit: limit.toString(),
		sort,
		outputFormat
	});

	if (hasDynamicLink !== undefined) {
		params.append('hasDynamicLink', hasDynamicLink.toString());
	}

	const response = await backend.get(`/templates?${params}`);
	return response;
};

const getTemplateById = async (uid) => {
	const response = await backend.get(`/templates/${uid}`);
	return response;
};

const createTemplate = async (template) => {
	const response = await backend.post('/templates', template);
	return response;
};

const updateTemplate = async (template) => {
	const response = await backend.put(`/templates/${template.uid}`, template);
	return response;
};

const deleteTemplate = async (uid) => {
	const response = await backend.delete(`/templates/${uid}`);
	return response;
};

const searchTemplates = async (search, { page = 1, limit = 12 } = {}) => {
	const response = await backend.get(
		`/templates/search?q=${encodeURIComponent(search)}&page=${page}&limit=${limit}`
	);
	return response;
};

const getTemplatesForType = async (type) => {
	const response = await backend.get(`/templates/type/${type}`);
	return response;
};

/**
 * Render a template with variable values
 * @param {string} uid - Template UID
 * @param {Object} variables - Variable key-value pairs
 * @param {Object} options - Render options (format, quality)
 * @returns {Promise<Object>} - { url, width, height, format }
 */
const renderTemplate = async (uid, variables = {}, options = {}) => {
	try {
		const headers = { ...(options.headers || {}) };

		// Add API key authorization if provided
		if (options.apiKey) {
			headers['Authorization'] = `Bearer ${options.apiKey}`;
		}

		const body = {
			variables,
			format: options.format || 'png',
			quality: options.quality || 0.9
		};

		// Add dimension overrides for custom size rendering
		if (options.width && options.height) {
			body.width = options.width;
			body.height = options.height;
		}

		// Add layout variant key (single or multiple)
		if (options.layouts && options.layouts.length > 0) {
			body.layouts = options.layouts;
		} else if (options.layout) {
			body.layout = options.layout;
		}

		const response = await backend.post(`/templates/${uid}/render`, body, {
			headers
		});
		return response;
	} catch (error) {
		throw error;
	}
};

/**
 * Render a template at multiple sizes in one request
 * @param {string} uid - Template UID
 * @param {Object} variables - Variable key-value pairs
 * @param {Array} sizes - Array of { width, height, label? } or { preset }
 * @param {Object} options - Render options (format, quality, apiKey)
 * @returns {Promise<Object>} - { results, errors, totalSizes, totalErrors }
 */
const renderTemplateMultiSize = async (uid, variables = {}, sizes = [], options = {}) => {
	try {
		const headers = { ...(options.headers || {}) };

		if (options.apiKey) {
			headers['Authorization'] = `Bearer ${options.apiKey}`;
		}

		const response = await backend.post(
			`/templates/${uid}/multi-size-render`,
			{
				variables,
				sizes,
				format: options.format || 'png',
				quality: options.quality || 0.9
			},
			{
				headers
			}
		);
		return response;
	} catch (error) {
		throw error;
	}
};

/**
 * Get template variables definition
 * @param {string} uid - Template UID
 * @returns {Promise<Object>} - { templateUid, templateName, variables }
 */
const getTemplateVariables = async (uid) => {
	const response = await backend.get(`/templates/${uid}/variables`);
	return response;
};

/**
 * Batch render a template with multiple variable sets
 * @param {string} uid - Template UID
 * @param {Array} variableSets - Array of variable objects
 * @param {Object} options - Render options
 * @returns {Promise<Object>} - { batchId, status, totalItems }
 */
const batchRenderTemplate = async (uid, variableSets, options = {}) => {
	try {
		const response = await backend.post(
			`/templates/${uid}/batch-render`,
			{
				variableSets,
				format: options.format || 'png',
				quality: options.quality || 0.9,
				concurrency: options.concurrency || 5,
				...(options.layouts
					? { layouts: options.layouts }
					: options.layout
					? { layout: options.layout }
					: {})
			},
			{
				headers: options.headers || {}
			}
		);
		return response;
	} catch (error) {
		throw error;
	}
};

/**
 * Get batch job results
 * @param {string} batchId - Batch job ID
 * @returns {Promise<Object>} - { batchId, status, progress, results, errors } or throws error
 */
const getBatchJobResults = async (batchId) => {
	const response = await backend.get(`/templates/batch/${batchId}/results`);
	return response;
};

/**
 * Cancel a batch job
 * @param {string} batchId - Batch job ID
 * @returns {Promise<Object>} - { batchId, status, message }
 */
const cancelBatchJob = async (batchId) => {
	const response = await backend.post(`/templates/batch/${batchId}/cancel`, {});
	return response;
};

/**
 * Batch render a template from a CSV URL
 * Backend downloads and parses the CSV - no row limit
 * Uses the unified batch-render endpoint with CSV mode
 * @param {string} uid - Template UID
 * @param {string} csvUrl - URL to the CSV file
 * @param {Object} mappings - Map of CSV column names to template variable names
 * @param {Object} options - Render options
 * @returns {Promise<Object>} - { batchId, status, totalItems }
 */
const batchRenderFromCsv = async (uid, csvUrl, mappings, options = {}) => {
	try {
		const response = await backend.post(
			`/templates/${uid}/batch-render`,
			{
				csvUrl,
				mappings,
				format: options.format || 'png',
				quality: options.quality || 0.9,
				concurrency: options.concurrency || 5,
				...(options.layouts
					? { layouts: options.layouts }
					: options.layout
					? { layout: options.layout }
					: {})
			},
			{
				headers: options.headers || {}
			}
		);
		return response;
	} catch (error) {
		throw error;
	}
};

/**
 * Upload a CSV file for batch rendering
 * @param {File} file - The CSV file to upload
 * @returns {Promise<Object>} - { url, filename, size }
 */
const uploadCsvForBatch = async (file) => {
	try {
		const formData = new FormData();
		formData.append('file', file);
		const response = await backend.postFormData('/templates/upload-csv', formData);
		return response;
	} catch (error) {
		throw error;
	}
};

/**
 * Regenerate template thumbnail
 * @param {string} uid - Template UID
 * @returns {Promise<Object>} - { message, thumbnail }
 */
const regenerateThumbnail = async (uid) => {
	const response = await backend.post(`/templates/${uid}/regenerate-thumbnail`, {});
	return response;
};

/**
 * Regenerate all thumbnails
 * @returns {Promise<Object>} - { message, success, failed, skipped }
 */
const regenerateAllThumbnails = async () => {
	const response = await backend.post('/templates/regenerate-thumbnails', {});
	return response;
};

// Expression Engine APIs
const validateExpression = async (expression) => {
	const response = await backend.post('/templates/expression/validate', { expression });
	return response;
};

const testExpression = async (expression, variables = {}) => {
	const response = await backend.post('/templates/expression/test', { expression, variables });
	return response;
};

const interpolateText = async (text, variables = {}) => {
	const response = await backend.post('/templates/expression/interpolate', { text, variables });
	return response;
};

const getExpressionFunctions = async () => {
	const response = await backend.get('/templates/expression/functions');
	return response;
};

// Public Templates APIs
const getPublicTemplates = async (params = {}) => {
	const queryParams = new URLSearchParams();
	if (params.category) queryParams.append('category', params.category);
	if (params.type) queryParams.append('type', params.type);
	if (params.tag) queryParams.append('tag', params.tag);
	if (params.search) queryParams.append('search', params.search);
	if (params.sort) queryParams.append('sort', params.sort);
	if (params.page) queryParams.append('page', params.page);
	if (params.limit) queryParams.append('limit', params.limit);

	const response = await backend.get(`/public/templates?${queryParams}`);
	return response;
};

const getPublicTemplate = async (uid) => {
	const response = await backend.get(`/public/templates/${uid}`);
	return response;
};

const forkTemplate = async (uid) => {
	const response = await backend.post(`/public/templates/${uid}/fork`, {});
	return response;
};

// PDF Operations
const renderPdf = async (templateUid, variables = {}, options = {}) => {
	try {
		const response = await backend.post(
			'/pdf/render',
			{
				templateUid,
				variables,
				options
			},
			{
				headers: options.headers || {}
			}
		);
		return response;
	} catch (error) {
		throw error;
	}
};

const renderMultiPagePdf = async (templateUid, variableSets = [], options = {}) => {
	try {
		const response = await backend.post(
			'/pdf/multi-page',
			{
				templateUid,
				variableSets,
				options
			},
			{
				headers: options.headers || {}
			}
		);
		return response;
	} catch (error) {
		throw error;
	}
};

/**
 * Studio "Say it": one instruction through the template agent, streamed.
 *
 * The agent takes ~25s and narrates itself; a single pulse for that long reads
 * as a hang, so this is SSE rather than a plain POST and the caller gets the
 * agent's own stages as they happen. The previous html is snapshotted
 * server-side before the change, so `undoTemplateEdit` always has a way back.
 *
 * Refusals (quota, not found, wrong engine) arrive as ordinary JSON before the
 * stream opens — the server only switches to event-stream once it commits to
 * running the agent.
 *
 * @param {string} uid
 * @param {string} instruction
 * @param {object} handlers
 * @param {(stage: object) => void} [handlers.onStage]
 * @param {(payload: object) => void} handlers.onDone
 * @param {(err: object) => void} handlers.onError
 * @param {AbortSignal} [handlers.signal]
 */
const editTemplateBySaying = async (
	uid,
	instruction,
	{
		onStage,
		onDone,
		onError,
		onProposal,
		signal,
		operationId,
		baseRevision,
		selectedNodeIds,
		allowedScope
	} = {}
) => {
	let response;
	try {
		response = await fetch(`${PUBLIC_BACKEND_URL}/template-studio/${uid}/edit`, {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			/*
			 * operationId and baseRevision are sent only when the caller supplies
			 * them. The platform studio passes neither and keeps its existing
			 * behaviour; the campaign studio passes both so a retry reconciles
			 * instead of charging twice, and a stale run is refused before any
			 * AI work happens.
			 */
			body: JSON.stringify({
				instruction,
				...(operationId ? { operationId } : {}),
				...(Number.isInteger(baseRevision) ? { baseRevision } : {}),
				// AI-2. Sent only when a selection is in force, so the platform
				// studio's whole-design edits are unaffected.
				...(selectedNodeIds?.length ? { selectedNodeIds } : {}),
				...(allowedScope ? { allowedScope } : {})
			}),
			signal
		});
	} catch (e) {
		if (e?.name !== 'AbortError')
			onError?.({ message: "Couldn't reach the server.", code: 'network' });
		return;
	}

	if (!response.ok || !response.body) {
		let payload = null;
		try {
			payload = await response.json();
		} catch {
			// Non-JSON body; fall through to the generic message.
		}
		onError?.({
			message: payload?.message || "That change didn't go through.",
			code: payload?.code || 'bad_response'
		});
		return;
	}

	/*
	 * A reconciled retry answers with ordinary JSON, not a stream: the run
	 * already finished, so there is no progress left to send. Read as SSE it
	 * would yield no frames at all and be reported as "the edit stopped early"
	 * — the exact opposite of what happened. There is no html in that reply
	 * (the server did not re-run the agent), so `replayed` tells the caller to
	 * take the result from the server rather than from this payload.
	 */
	const contentType = response.headers.get('content-type') || '';
	if (!contentType.includes('text/event-stream')) {
		let payload = null;
		try {
			payload = await response.json();
		} catch {
			payload = null;
		}
		if (payload?.state === 'completed') onDone?.({ ...payload, replayed: true });
		else
			onError?.({
				message: payload?.message || 'That edit did not finish.',
				code: payload?.code || 'unexpected_response'
			});
		return;
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let settled = false;

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			// A chunk can split a frame anywhere; only whole frames are parsed.
			const frames = buffer.split('\n\n');
			buffer = frames.pop() ?? '';

			for (const frame of frames) {
				const lines = frame.split('\n');
				const eventLine = lines.find((l) => l.startsWith('event:'));
				const dataLine = lines.find((l) => l.startsWith('data:'));
				if (!eventLine || !dataLine) continue;

				const event = eventLine.slice(6).trim();
				let payload;
				try {
					payload = JSON.parse(dataLine.slice(5).trim());
				} catch {
					continue;
				}

				if (event === 'stage') onStage?.(payload);
				else if (event === 'done') {
					settled = true;
					onDone?.(payload);
				} else if (event === 'proposal') {
					/*
					 * A settled outcome, not an error. The run finished, the server
					 * refused to apply it, and the buyer is being asked a question —
					 * treating it as a failure would show "that didn't go through"
					 * over a card that is working exactly as designed.
					 */
					settled = true;
					onProposal?.(payload);
				} else if (event === 'error') {
					settled = true;
					onError?.(payload);
				}
			}
		}
	} catch (e) {
		if (e?.name !== 'AbortError') {
			onError?.({ message: 'The connection dropped mid-edit.', code: 'stream_failed' });
		}
		return;
	}

	// Closed without ever saying how it ended.
	if (!settled) {
		onError?.({ message: 'The edit stopped early. Nothing was changed.', code: 'incomplete' });
	}
};

/** Pop the newest snapshot back onto the template. */
const undoTemplateEdit = async (uid) => backend.post(`/template-studio/${uid}/undo`, {});

/**
 * A server render of the SAVED revision. B05-1.
 *
 * The response says which revision it rendered, because a render takes seconds
 * and the buyer can save while it runs — the caller compares rather than
 * assuming the answer is about the design currently on screen.
 */
const renderTemplateProof = async (uid, { variables = {}, format } = {}) =>
	backend.post(`/template-draft/${uid}/proof`, { variables, ...(format ? { format } : {}) });

/** The durable history: `{ current, head, revisions }`. Never carries html. */
const getTemplateRevisions = async (uid) => backend.get(`/template-draft/${uid}/revisions`);

/** Restore creates a NEW revision; the response says which. */
const restoreTemplateRevision = async (uid, revision) =>
	backend.post(`/template-draft/${uid}/revisions/${revision}/restore`, {});

/**
 * Live proof. Renders ad-hoc html with the studio's sample values — never
 * persisted, and it returns the render time the proof bar shows.
 * @returns {Promise<{dataUrl, width, height, totalMs}>}
 */
/**
 * An AI edit with no account. TS-B2.
 *
 * The document travels in the body and comes back in the response — there is
 * no template row to edit against, because a guest does not have one. Throws
 * an HttpError on 429 carrying `resetsAt`, which is how the composer knows to
 * swap itself for the signup card rather than guessing from a local counter.
 */
/**
 * Read an SSE run and call the handlers. Shared by the signed-in and guest
 * edits, so the two cannot drift about what a frame means.
 *
 * A chunk can split a frame anywhere, so only whole frames are parsed; a frame
 * without both an event and a data line is skipped rather than guessed at.
 */
async function readEditStream(response, { onStage, onDone, onProposal, onError }) {
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let settled = false;

	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			const frames = buffer.split('\n\n');
			buffer = frames.pop() ?? '';
			for (const frame of frames) {
				const lines = frame.split('\n');
				const eventLine = lines.find((l) => l.startsWith('event:'));
				const dataLine = lines.find((l) => l.startsWith('data:'));
				if (!eventLine || !dataLine) continue;
				const event = eventLine.slice(6).trim();
				let payload;
				try {
					payload = JSON.parse(dataLine.slice(5).trim());
				} catch {
					continue;
				}
				if (event === 'stage') onStage?.(payload);
				else if (event === 'done') {
					settled = true;
					onDone?.(payload);
				} else if (event === 'proposal') {
					settled = true;
					onProposal?.(payload);
				} else if (event === 'error') {
					settled = true;
					onError?.(payload);
				}
			}
		}
	} catch (e) {
		if (e?.name !== 'AbortError') {
			onError?.({ message: 'The connection dropped mid-edit.', code: 'stream_failed' });
		}
		return;
	}

	// Closed without ever saying how it ended.
	if (!settled) onError?.({ message: 'That edit stopped early.', code: 'stream_incomplete' });
}

/**
 * An AI edit with no account. TS-B2.
 *
 * STREAMED, like the signed-in one: the agent takes twenty seconds and more,
 * and a spinner with no progress on a public tool page is where people leave.
 * The document travels in the body and comes back in the `done` frame — there
 * is no template row to edit against, because a guest does not have one.
 *
 * Quota refusals arrive BEFORE the stream starts and are ordinary JSON, which
 * is how the composer knows to swap itself for the signup card.
 */
const editGuestTemplate = async (
	{ html, instruction, width, height },
	{ onStage, onDone, onError, signal } = {}
) => {
	let response;
	try {
		response = await fetch(`${PUBLIC_BACKEND_URL}/template-studio/guest/edit`, {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ html, instruction, width, height }),
			signal
		});
	} catch (e) {
		if (e?.name !== 'AbortError')
			onError?.({ message: "Couldn't reach the server.", code: 'network' });
		return;
	}

	if (!response.ok || !response.body) {
		let payload = null;
		try {
			payload = await response.json();
		} catch {
			/* non-JSON; fall through to the generic message */
		}
		onError?.({
			message: payload?.message || "That change didn't go through.",
			code: payload?.code || 'bad_response',
			status: response.status,
			resetsAt: payload?.resetsAt
		});
		return;
	}

	await readEditStream(response, { onStage, onDone, onError });
};

const previewTemplateHtml = async (body, options = {}) =>
	backend.post('/templates/preview', body, options);

export {
	editTemplateBySaying,
	undoTemplateEdit,
	getTemplateRevisions,
	restoreTemplateRevision,
	renderTemplateProof,
	previewTemplateHtml,
	editGuestTemplate,
	getTemplate,
	getTemplates,
	getTemplateById,
	createTemplate,
	updateTemplate,
	deleteTemplate,
	searchTemplates,
	getTemplatesForType,
	renderTemplate,
	renderTemplateMultiSize,
	getTemplateVariables,
	// New exports
	batchRenderTemplate,
	batchRenderFromCsv,
	uploadCsvForBatch,
	getBatchJobResults,
	cancelBatchJob,
	regenerateThumbnail,
	regenerateAllThumbnails,
	validateExpression,
	testExpression,
	interpolateText,
	getExpressionFunctions,
	getPublicTemplates,
	getPublicTemplate,
	forkTemplate,
	renderPdf,
	renderMultiPagePdf
};
