/**
 * The guest's document, kept in their browser. TS-2.
 *
 * A visitor can use the embedded editor without an account, so there is no row
 * to save to — the draft lives in `localStorage` and the top strip says so
 * (`DRAFT · KEPT IN THIS BROWSER`) rather than implying a server has it.
 *
 * EVERY READ AND WRITE IS GUARDED. `localStorage` is not merely absent in SSR;
 * it THROWS on access in a Safari private window and when a browser is set to
 * block site data, and it throws on write when the origin's quota is full. An
 * editor that dies because it could not cache a draft is worse than one that
 * quietly stops caching, so every failure here degrades to "no draft" and the
 * editor keeps working.
 *
 * Nothing here is a substitute for saving. The 30-day rule exists because a
 * draft someone abandoned two months ago is not what they came back for: it is
 * OFFERED on return, never restored silently underneath them.
 */

const PREFIX = 'pictify.tool-draft.';
/** Where a tool result hands HTML over without putting it in the URL. */
const HANDOFF_PREFIX = 'pictify.tool-handoff.';
const STALE_AFTER_DAYS = 30;

const now = () => Date.now();

/** `localStorage`, or null when touching it throws or it is not there. */
function store(kind = 'local') {
	try {
		// `window`, not `globalThis`: this module is imported during SSR, where
		// there is no window at all, and the project's eslint env does not know
		// `globalThis`.
		if (typeof window === 'undefined') return null;
		const s = kind === 'session' ? window.sessionStorage : window.localStorage;
		if (!s) return null;
		// Presence is not access: some browsers expose the object and throw on use.
		const probe = `${PREFIX}__probe__`;
		s.setItem(probe, '1');
		s.removeItem(probe);
		return s;
	} catch {
		return null;
	}
}

/** Short, URL-safe, and not required to be unguessable — it names a local key. */
export function newDraftId() {
	const random = Math.random().toString(36).slice(2, 8);
	return `${now().toString(36)}${random}`;
}

/**
 * Write the draft. Returns the id, or null when nothing could be stored.
 *
 * Called on every commit, so it must be cheap and must never throw upward.
 */
export function saveDraft(id, draft) {
	const s = store();
	if (!s || !id) return null;
	const body = {
		html: String(draft?.html ?? ''),
		width: Number(draft?.width) || 1200,
		height: Number(draft?.height) || 630,
		format: draft?.format === 'pdf' ? 'pdf' : 'png',
		sampleValues: draft?.sampleValues && typeof draft.sampleValues === 'object' ? draft.sampleValues : {},
		templateKey: draft?.templateKey ?? null,
		/*
		 * WHICH TOOL THIS BELONGS TO.
		 *
		 * Without it `latestDraft()` handed the newest draft from ANY tool to
		 * whichever page asked, so opening the LinkedIn generator restored the OG
		 * card — same variables, same text, wrong tool. Drafts are per tool.
		 */
		tool: draft?.tool ?? null,
		updatedAt: now()
	};
	try {
		s.setItem(`${PREFIX}${id}`, JSON.stringify(body));
		return id;
	} catch {
		/*
		 * Almost always the origin's quota. Drop the OTHER drafts and retry once:
		 * the one being edited is the only one that matters, and the alternative
		 * is silently not saving from here on.
		 */
		try {
			for (const key of listKeys(s)) if (key !== `${PREFIX}${id}`) s.removeItem(key);
			s.setItem(`${PREFIX}${id}`, JSON.stringify(body));
			return id;
		} catch {
			return null;
		}
	}
}

function listKeys(s) {
	const keys = [];
	for (let i = 0; i < s.length; i++) {
		const key = s.key(i);
		if (key && key.startsWith(PREFIX)) keys.push(key);
	}
	return keys;
}

/**
 * `{ id, draft, stale, ageDays }`, or null when there is nothing to offer.
 *
 * `stale` is the caller's cue to ASK. It is not a reason to delete: someone
 * coming back to a two-month-old draft still owns it.
 */
export function loadDraft(id) {
	const s = store();
	if (!s || !id) return null;
	let parsed;
	try {
		const raw = s.getItem(`${PREFIX}${id}`);
		if (!raw) return null;
		parsed = JSON.parse(raw);
	} catch {
		// Corrupt or half-written: treat as absent rather than crashing the page.
		return null;
	}
	if (!parsed || typeof parsed.html !== 'string') return null;
	const ageDays = (now() - (Number(parsed.updatedAt) || 0)) / 86400000;
	return { id, draft: parsed, stale: ageDays > STALE_AFTER_DAYS, ageDays: Math.floor(ageDays) };
}

/**
 * The most recently touched draft FOR THIS TOOL.
 *
 * `tool` is required in practice: without it a visitor who used the OG
 * generator and then opened the certificate tool would be handed their OG card.
 * Passing nothing returns the newest of any tool, which is only useful for the
 * signup handoff, where the draft id is known anyway.
 */
export function latestDraft(tool = null) {
	const s = store();
	if (!s) return null;
	let best = null;
	for (const key of listKeys(s)) {
		const found = loadDraft(key.slice(PREFIX.length));
		if (!found) continue;
		if (tool && found.draft.tool !== tool) continue;
		if (!best || found.draft.updatedAt > best.draft.updatedAt) best = found;
	}
	return best;
}

export function clearDraft(id) {
	const s = store();
	if (!s || !id) return false;
	try {
		s.removeItem(`${PREFIX}${id}`);
		return true;
	} catch {
		return false;
	}
}

/**
 * HTML handed over from a tool result, via a key rather than the URL.
 *
 * A document in a query string is a document in the browser history, the
 * server logs and anything that reads a referrer — and it breaks at a few
 * kilobytes anyway. `sessionStorage`, so it does not outlive the tab.
 */
export function putHandoff(html) {
	const s = store('session');
	if (!s) return null;
	const key = newDraftId();
	try {
		s.setItem(`${HANDOFF_PREFIX}${key}`, String(html ?? ''));
		return key;
	} catch {
		return null;
	}
}

/** Read once and remove: a handoff is consumed, not a second source of truth. */
export function takeHandoff(key) {
	const s = store('session');
	if (!s || !key) return null;
	try {
		const html = s.getItem(`${HANDOFF_PREFIX}${key}`);
		if (html === null) return null;
		s.removeItem(`${HANDOFF_PREFIX}${key}`);
		return html;
	} catch {
		return null;
	}
}

export const STALE_DAYS = STALE_AFTER_DAYS;
