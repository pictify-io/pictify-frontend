import { writable, derived } from 'svelte/store';

/**
 * The dashboard's one notification surface. TO-01 (board `MQ8-0`).
 *
 * The rule the API encodes: an action the visitor just clicked and that
 * FAILED must say so, once, where the eye already is. Everything else is
 * somebody else's job — a page that could not load says so inline, autosave
 * says so in the top-bar pill, and a quota hit opens the upgrade modal. A
 * toast for a success whose result is already on screen is noise, so `done`
 * exists only for results that are not visible (a key on the clipboard, an
 * invite sent).
 *
 * WHY AN API AND NOT `showToast(message, type)`: the old call took a
 * pre-written string, so every call site invented its own wording for the
 * same failure and none of them knew the status code. `notify.fail(action,
 * err)` takes the verb the user clicked and the error the server sent, and
 * writes the line itself.
 */

export const MAX_VISIBLE = 3;
export const OK_MS = 3000;
export const NOTE_MS = 4000;

const queue = writable([]);

let seq = 0;
const nextId = () => `t${++seq}-${Date.now()}`;

function push(toast) {
	// The spread FIRST, then the id: the other way round, `toast.id` being
	// undefined overwrote the generated one, every toast shared the id
	// `undefined`, and the replace-by-id below then dropped all of them.
	const entry = { ...toast, id: toast.id || nextId() };
	queue.update((list) => {
		// Replacing by id keeps a retried action from stacking a second copy of
		// the same failure every time it fails.
		const rest = list.filter((t) => t.id !== entry.id);
		// The fourth arrival drops the OLDEST, never the newest: the thing that
		// just happened is the thing the visitor is looking for.
		return [...rest, entry].slice(-MAX_VISIBLE);
	});
	return entry.id;
}

/** The server's own sentence, when it wrote one. */
const serverMessage = (err) => {
	const text = err?.data?.message || err?.data?.error || '';
	return typeof text === 'string' && text.trim() ? text.trim() : '';
};

/**
 * One sentence: what happened, and what it cost.
 *
 * Never "Error", never "Something went wrong" — the visitor knows something
 * went wrong, they clicked it. What they do not know is whether it charged
 * them, whether the row is gone, and whether trying again is safe.
 */
export function humanize(err, action = '') {
	const status = err?.status;
	const server = serverMessage(err);
	const renders = /render|generate|export/i.test(action);

	if (status === 401) return 'Your session ended. Sign in again.';
	if (status === 403) return server || "You don't have permission for that.";
	if (status === 404) return 'That no longer exists. Reload the page.';
	if (status === 409) return server || 'That changed somewhere else. Reload and try again.';
	if (status === 413) return server || 'That file is too large for this plan.';
	if (status === 429) return server || 'Too many requests just now. Give it a moment.';
	if (status === 400 || status === 422) return server || 'The server refused that as invalid.';
	if (!status || status >= 500) {
		// No status at all is a network failure, which from the visitor's side
		// is the same event as a 502: the request never landed.
		return renders
			? 'The renderer did not answer. Nothing was billed.'
			: 'The server did not answer. Nothing was changed.';
	}
	return server || 'The server did not answer. Nothing was changed.';
}

/** `RENDER FAILED · 502` */
const failEyebrow = (action, err) =>
	`${String(action || 'Action').toUpperCase()} FAILED${err?.status ? ` · ${err.status}` : ''}`;

const errorId = (err) => err?.data?.requestId || err?.data?.id || err?.requestId || null;

export const notify = {
	/**
	 * @param {string} action the verb the visitor clicked — 'Render', 'Delete'
	 * @param {unknown} err   the thrown HttpError (or anything)
	 * @param {{ retry?: () => any, id?: string }} [options]
	 */
	fail(action, err, options = {}) {
		/*
		 * A quota refusal already opens the upgrade modal (`maybeHandleQuota` in
		 * service/backend.js). A toast on top of it would be a second, smaller
		 * account of the same event, behind the modal.
		 */
		if (err?.status === 429 && err?.data?.code === 'quota_exceeded') return null;
		return push({
			id: options.id,
			kind: 'fail',
			eyebrow: failEyebrow(action, err),
			message: humanize(err, action),
			retry: typeof options.retry === 'function' ? options.retry : null,
			errorId: errorId(err),
			// Never auto-dismisses: a failure the visitor did not read is a
			// failure they will report as "it just did nothing".
			duration: null
		});
	},

	done(eyebrow, message, options = {}) {
		return push({ id: options.id, kind: 'ok', eyebrow, message, duration: OK_MS });
	},

	note(eyebrow, message, options = {}) {
		return push({ id: options.id, kind: 'note', eyebrow, message, duration: NOTE_MS });
	}
};

export function dismissToast(id) {
	queue.update((list) => list.filter((t) => t.id !== id));
}

/** The newest failure, which is what Esc closes. */
export function dismissNewestFail() {
	let dismissed = false;
	queue.update((list) => {
		for (let i = list.length - 1; i >= 0; i--) {
			if (list[i].kind === 'fail') {
				dismissed = true;
				return [...list.slice(0, i), ...list.slice(i + 1)];
			}
		}
		return list;
	});
	return dismissed;
}

export function clearToasts() {
	queue.set([]);
}

/** Oldest first: the component renders top to bottom, newest at the bottom. */
export const visibleToasts = derived(queue, ($q) => $q);

/**
 * The v1 call, kept for the marketing tool pages until the tool shell is
 * touched. It carries a written sentence and a type, so it maps onto a kind
 * and keeps its own duration — including for failures, which on those pages
 * were always timed and should not start sticking around now.
 */
export function showToast(message, type = 'default', duration = 3000) {
	const kind = type === 'success' ? 'ok' : type === 'error' ? 'fail' : 'note';
	return push({ kind, eyebrow: '', message, duration, retry: null, errorId: null });
}

/** Single-slot writer some pages still use: `toast.set({ message, type })`. */
export const toast = {
	set(value) {
		if (value) showToast(value.message, value.type || 'default', value.duration || 3000);
	},
	subscribe: queue.subscribe,
	update: queue.update
};

export { queue as toastQueue };
