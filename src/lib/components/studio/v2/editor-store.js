import { writable, derived, get } from 'svelte/store';
import { ensureNodeIds } from './node-ids.js';

/**
 * The one editor store. B04-1.
 *
 * Everything in the studio hangs off this: the stage renders `html`, the layers
 * tree reads it, undo/redo walk `history`, autosave watches `dirty`, and the AI
 * lock reads `operation`. There is exactly one because the alternative — a
 * store per rail — lets two of them disagree about what the current draft is,
 * and the first symptom of that is an edit silently lost.
 *
 * WHAT COUNTS AS ONE HISTORY ENTRY is the load-bearing decision:
 *
 *   one manual gesture (a drag, a resize, a nudge) — one entry
 *   one text commit (blur or Escape, not each keystroke) — one entry
 *   one AI result, however much it changed — one entry
 *
 * Undo has to mean "put back what I could see a moment ago". Per-keystroke
 * entries make undo useless for anything but typing, and an AI edit split into
 * forty DOM mutations makes it impossible to reject the AI's work in one step —
 * which is the single most likely thing a buyer wants to do.
 */

/** Bounded so a long session cannot grow without limit. */
const MAX_HISTORY = 100;

const emptyState = () => ({
	/** The canonical draft. Every surface renders from this and nothing else. */
	html: '',
	/** Server revision this draft descends from; sent as expectedRevision. */
	baseRevision: 0,
	/** Bumped locally on every committed transaction, for the dirty check. */
	localSeq: 0,
	/** Last sequence the server acknowledged. */
	savedSeq: 0,
	selection: null,
	/** `{ operationId, stage, startedAt }` while an AI edit runs; null otherwise. */
	operation: null,
	/** 'saved' | 'saving' | 'unsaved' | 'offline' | 'conflict' | 'ai' */
	saveState: 'saved',
	/** Set on 409 so the conflict dialog can show both sides. */
	conflict: null
});

function createEditorStore() {
	const state = writable(emptyState());
	/** Committed transactions, oldest first. `cursor` is the current position. */
	let history = [];
	let cursor = -1;

	const snapshot = () => get(state);

	/**
	 * Load a draft from the server. Resets history: undoing PAST the point where
	 * a document was opened would put the editor into a state the server never
	 * had, and "undo" would silently become "revert someone else's revision".
	 */
	function load({ html, revision }) {
		const identified = ensureNodeIds(html || '');
		history = [{ label: 'opened', html: identified.html, at: Date.now() }];
		cursor = 0;
		state.set({
			...emptyState(),
			html: identified.html,
			baseRevision: revision ?? 0,
			saveState: 'saved'
		});
		return identified;
	}

	/**
	 * Commit one transaction.
	 *
	 * Every entry point — a drag, a text commit, an AI result — funnels through
	 * here, so the "one gesture, one entry" rule cannot be bypassed by a caller
	 * that forgets it.
	 *
	 * Node ids are re-ensured on the way in, because an AI result may add
	 * elements without them and the stage cannot select what it cannot address.
	 */
	function commit(label, nextHtml, { source = 'manual' } = {}) {
		const identified = ensureNodeIds(nextHtml || '');
		const current = snapshot();
		if (identified.html === current.html) return { changed: false };

		// A new edit after undoing discards the redo tail, which is what every
		// editor does and what a user expects.
		history = history.slice(0, cursor + 1);
		history.push({ label, html: identified.html, at: Date.now(), source });
		if (history.length > MAX_HISTORY) history = history.slice(history.length - MAX_HISTORY);
		cursor = history.length - 1;

		state.update((s) => ({
			...s,
			html: identified.html,
			localSeq: s.localSeq + 1,
			saveState: s.operation ? 'ai' : 'unsaved'
		}));
		return { changed: true, assigned: identified.assigned, deduped: identified.deduped };
	}

	const canUndo = () => cursor > 0;
	const canRedo = () => cursor < history.length - 1;

	function undo() {
		if (!canUndo()) return false;
		cursor -= 1;
		state.update((s) => ({
			...s,
			html: history[cursor].html,
			localSeq: s.localSeq + 1,
			saveState: 'unsaved'
		}));
		return true;
	}

	function redo() {
		if (!canRedo()) return false;
		cursor += 1;
		state.update((s) => ({
			...s,
			html: history[cursor].html,
			localSeq: s.localSeq + 1,
			saveState: 'unsaved'
		}));
		return true;
	}

	/* ------------------------------------------------------------- saving */

	function saving() {
		state.update((s) => ({ ...s, saveState: 'saving' }));
	}

	/**
	 * The server accepted a save.
	 *
	 * `seq` is the local sequence the save was FOR. If the buyer edited while it
	 * was in flight, localSeq has moved on and the draft is still unsaved —
	 * reporting "Saved" there would tell them their latest change is safe when
	 * it is not.
	 */
	function saved({ revision, seq }) {
		state.update((s) => ({
			...s,
			baseRevision: revision ?? s.baseRevision,
			savedSeq: seq,
			saveState: s.localSeq > seq ? 'unsaved' : 'saved',
			conflict: null
		}));
	}

	/** Offline says where the work is; it does not claim the server has it. */
	const offline = () => state.update((s) => ({ ...s, saveState: 'offline' }));

	/**
	 * 409 from the server. Both sides are kept: the buyer chooses whether their
	 * draft becomes the next revision or theirs is taken, and neither is thrown
	 * away without them saying so.
	 */
	function conflict(current) {
		state.update((s) => ({
			...s,
			saveState: 'conflict',
			conflict: { mine: s.html, theirs: current }
		}));
	}

	/* ---------------------------------------------------- AI operations */

	/**
	 * Start an AI edit. The lock is state, not a flag on a component, because
	 * the canvas wash, the disabled rails and the top bar all read it and must
	 * agree — a half-locked editor is worse than an unlocked one.
	 */
	function beginOperation(operationId) {
		state.update((s) => ({
			...s,
			operation: { operationId, stage: 'read', startedAt: Date.now() },
			saveState: 'ai'
		}));
	}

	const operationStage = (stage) =>
		state.update((s) => (s.operation ? { ...s, operation: { ...s.operation, stage } } : s));

	/**
	 * Apply an AI result as ONE transaction.
	 *
	 * Late results are dropped: an operation that was cancelled or superseded
	 * must not overwrite what the buyer did in the meantime. That check is the
	 * whole reason operationId exists.
	 */
	function completeOperation(operationId, html) {
		const s = snapshot();
		if (!s.operation || s.operation.operationId !== operationId) {
			return { applied: false, reason: 'superseded' };
		}
		state.update((cur) => ({ ...cur, operation: null }));
		const result = commit('AI edit', html, { source: 'ai' });
		return { applied: true, ...result };
	}

	/** Cancel or failure leaves the draft exactly as it was. */
	function endOperation() {
		state.update((s) => ({
			...s,
			operation: null,
			saveState: s.localSeq > s.savedSeq ? 'unsaved' : 'saved'
		}));
	}

	const select = (selection) => state.update((s) => ({ ...s, selection }));

	return {
		subscribe: state.subscribe,
		load,
		commit,
		undo,
		redo,
		canUndo: () => canUndo(),
		canRedo: () => canRedo(),
		historyEntries: () => history.map((h, i) => ({ ...h, current: i === cursor })),
		saving,
		saved,
		offline,
		conflict,
		beginOperation,
		operationStage,
		completeOperation,
		endOperation,
		select,
		/** Test seam only. */
		_reset: () => {
			history = [];
			cursor = -1;
			state.set(emptyState());
		}
	};
}

export const editor = createEditorStore();

/** True when the draft has edits the server has not acknowledged. */
export const dirty = derived(editor, ($e) => $e.localSeq > $e.savedSeq);

/** True while an AI operation holds the lock. */
export const aiLocked = derived(editor, ($e) => Boolean($e.operation));

export { createEditorStore, MAX_HISTORY };
