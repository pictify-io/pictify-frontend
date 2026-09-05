import { get } from 'svelte/store';
import backend from '../../../../service/backend';

/**
 * Autosave. B04-2.
 *
 * Debounced, single-flight, and honest about what has actually reached the
 * server. Three properties matter more than the mechanism:
 *
 *   ONE SAVE IN FLIGHT AT A TIME. Two overlapping saves race, and the loser
 *   silently overwrites the winner — with the second-newest draft.
 *   THE ACKNOWLEDGEMENT CARRIES ITS SEQUENCE. If the buyer typed while a save
 *   was in flight, the state stays "unsaved" rather than claiming their latest
 *   change is safe. That check lives in the store.
 *   A FAILED SAVE KEEPS A LOCAL COPY. Losing connectivity must not lose work,
 *   and the copy is keyed by the revision it descends from so it cannot be
 *   replayed onto someone else's newer document.
 */

const DEBOUNCE_MS = 2000;
const KEY = (uid, baseRevision) => `pictify.studio.draft.${uid}.r${baseRevision}`;

export function createSaveQueue(editor, { uid, onConflict }) {
	let timer = null;
	let inFlight = false;
	let pending = false;

	/**
	 * localStorage, wrapped. It throws in private windows and when site data is
	 * blocked, and a failed BACKUP must never take down the editor — the buyer
	 * would lose the thing the backup existed to protect.
	 */
	const local = {
		save(baseRevision, html) {
			try {
				localStorage.setItem(KEY(uid, baseRevision), JSON.stringify({ html, at: Date.now() }));
			} catch (e) {
				/* no local copy available; the in-memory draft is still intact */
			}
		},
		read(baseRevision) {
			try {
				const raw = localStorage.getItem(KEY(uid, baseRevision));
				return raw ? JSON.parse(raw) : null;
			} catch (e) {
				return null;
			}
		},
		clear(baseRevision) {
			try {
				localStorage.removeItem(KEY(uid, baseRevision));
			} catch (e) {
				/* nothing to clear */
			}
		}
	};

	async function flush() {
		const state = get(editor);
		if (inFlight) {
			pending = true;
			return;
		}
		if (state.localSeq <= state.savedSeq) return;
		// An AI operation owns the document while it runs; saving underneath it
		// would race the result it is about to produce.
		if (state.operation) return;

		const seq = state.localSeq;
		const base = state.baseRevision;
		inFlight = true;
		editor.saving();

		try {
			const res = await backend.patch(`/template-draft/${uid}`, {
				html: state.html,
				expectedRevision: base,
				label: 'edit'
			});
			editor.saved({ revision: res.revision, seq });
			local.clear(base);
		} catch (err) {
			if (err?.status === 409) {
				// Keep the local copy: the buyer may choose to keep theirs, and it
				// is the only place their version exists if the tab dies now.
				local.save(base, state.html);
				editor.conflict(err.data?.current?.html || '');
				onConflict?.(err.data?.current || null);
			} else {
				local.save(base, state.html);
				editor.offline();
			}
		} finally {
			inFlight = false;
			if (pending) {
				pending = false;
				schedule();
			}
		}
	}

	function schedule() {
		clearTimeout(timer);
		timer = setTimeout(flush, DEBOUNCE_MS);
	}

	return {
		/** Call after every transaction. */
		nudge: schedule,
		/** Save now — used before an AI run and on "Use this design". */
		flushNow: () => {
			clearTimeout(timer);
			return flush();
		},
		/** A draft this browser kept when a save could not reach the server. */
		recover: (baseRevision) => local.read(baseRevision),
		discardLocal: (baseRevision) => local.clear(baseRevision),
		stop: () => clearTimeout(timer),
		DEBOUNCE_MS
	};
}

export { DEBOUNCE_MS };
