/**
 * Browser-side node identity. Mirrors the backend's
 * service/template-node-ids.js (studio B00-4b) and MUST agree with it.
 *
 * Both exist because both write HTML: the agent writes it on the server, the
 * stage writes it here. If they disagreed about which elements carry an id or
 * how duplicates are resolved, a design would change identity as it moved
 * between them — and the editor's selection, the layers tree and every
 * "element 3 moved" receipt would be describing different documents.
 *
 * Same attribute, same skip list, same rule that the FIRST occurrence of a
 * duplicate keeps the id.
 */

export const ATTR = 'data-pictify-id';

/** Not addressable in the visual editor, so never tagged. */
const SKIP = new Set(['HTML', 'HEAD', 'BODY', 'SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'BASE']);

const makeMinter = (taken) => {
	let n = 0;
	return () => {
		let id;
		do {
			id = `n${++n}`;
		} while (taken.has(id));
		taken.add(id);
		return id;
	};
};

/**
 * Assign an id to every addressable element and make every id unique.
 *
 * Returns `{ html, assigned, deduped, total }` so a caller can see how much had
 * to be repaired — a rising `assigned` after an AI edit means the agent stopped
 * honouring the attribute.
 */
export function ensureNodeIds(html) {
	if (typeof html !== 'string' || !html.trim()) {
		return { html: html || '', assigned: 0, deduped: 0, total: 0 };
	}
	// No DOM (SSR, tests): return the input untouched rather than throwing. The
	// backend pass is the contract; this one is a convenience.
	if (typeof DOMParser === 'undefined') {
		return { html, assigned: 0, deduped: 0, total: 0, skipped: true };
	}

	const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
	const elements = [...doc.body.querySelectorAll('*')].filter((el) => !SKIP.has(el.tagName));

	// Collect first, so a minted id cannot collide with one further down the
	// document that has not been visited yet.
	const seen = new Set();
	for (const el of elements) {
		const existing = el.getAttribute(ATTR);
		if (existing) seen.add(existing);
	}

	const mint = makeMinter(new Set(seen));
	const used = new Set();
	let assigned = 0;
	let deduped = 0;

	for (const el of elements) {
		const existing = el.getAttribute(ATTR);
		if (!existing) {
			el.setAttribute(ATTR, mint());
			assigned++;
			continue;
		}
		if (used.has(existing)) {
			// The FIRST occurrence keeps the id, so a selection the user already
			// has is never the one that moves.
			el.setAttribute(ATTR, mint());
			deduped++;
			continue;
		}
		used.add(existing);
	}

	return { html: doc.body.innerHTML, assigned, deduped, total: elements.length };
}
