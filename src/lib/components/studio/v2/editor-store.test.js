import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { get } from 'svelte/store';
import { createEditorStore } from './editor-store.js';

/**
 * The properties that matter are about what the store REFUSES to do: lose an
 * edit, report work as saved when it is not, or let a late AI result overwrite
 * what the buyer did while waiting.
 *
 * Runs without a DOM, so ensureNodeIds passes HTML through untouched — that is
 * deliberate, and the node-id contract is tested on the backend where cheerio
 * gives a real parser.
 */
const fresh = () => {
	const e = createEditorStore();
	e.load({ html: '<div>a</div>', revision: 3 });
	return e;
};

describe('editor store — history', () => {
	test('one commit is one entry, and undo returns the previous html', () => {
		const e = fresh();
		e.commit('drag', '<div>b</div>');
		assert.equal(get(e).html, '<div>b</div>');
		assert.equal(e.undo(), true);
		assert.equal(get(e).html, '<div>a</div>');
		assert.equal(e.redo(), true);
		assert.equal(get(e).html, '<div>b</div>');
	});

	test('a no-op commit does not create an entry', () => {
		const e = fresh();
		const result = e.commit('drag', '<div>a</div>');
		assert.equal(result.changed, false);
		assert.equal(e.historyEntries().length, 1);
	});

	test('an AI result is ONE entry however much it changed', () => {
		// Rejecting the AI's work in one step is the most likely thing a buyer
		// wants to do, so it must not be split across many entries.
		const e = fresh();
		e.beginOperation('op1');
		e.completeOperation('op1', '<div><p>1</p><p>2</p><p>3</p><p>4</p></div>');
		assert.equal(e.historyEntries().length, 2);
		e.undo();
		assert.equal(get(e).html, '<div>a</div>');
	});

	test('editing after an undo discards the redo tail', () => {
		const e = fresh();
		e.commit('one', '<div>b</div>');
		e.commit('two', '<div>c</div>');
		e.undo();
		e.commit('three', '<div>d</div>');
		assert.equal(e.canRedo(), false);
		assert.equal(get(e).html, '<div>d</div>');
	});

	test('undo cannot go past the point the document was opened', () => {
		// Undoing further would put the editor in a state the server never had,
		// turning "undo" into "revert someone else's revision".
		const e = fresh();
		assert.equal(e.canUndo(), false);
		assert.equal(e.undo(), false);
	});
});

describe('editor store — saving', () => {
	test('a save that lands while the buyer keeps typing does not report Saved', () => {
		const e = fresh();
		e.commit('one', '<div>b</div>');
		const seq = get(e).localSeq;
		e.saving();
		e.commit('two', '<div>c</div>'); // edited while in flight
		e.saved({ revision: 4, seq });
		// Their latest change is NOT on the server; saying "Saved" would be a lie.
		assert.equal(get(e).saveState, 'unsaved');
	});

	test('a save with no intervening edit reports Saved and advances the revision', () => {
		const e = fresh();
		e.commit('one', '<div>b</div>');
		const seq = get(e).localSeq;
		e.saving();
		e.saved({ revision: 4, seq });
		assert.equal(get(e).saveState, 'saved');
		assert.equal(get(e).baseRevision, 4);
	});

	test('offline does not claim the server has the work', () => {
		const e = fresh();
		e.commit('one', '<div>b</div>');
		e.offline();
		assert.equal(get(e).saveState, 'offline');
	});

	test('a conflict keeps BOTH sides so neither is discarded silently', () => {
		const e = fresh();
		e.commit('mine', '<div>mine</div>');
		e.conflict('<div>theirs</div>');
		const s = get(e);
		assert.equal(s.saveState, 'conflict');
		assert.equal(s.conflict.mine, '<div>mine</div>');
		assert.equal(s.conflict.theirs, '<div>theirs</div>');
	});
});

describe('editor store — AI operations', () => {
	test('a superseded result is dropped, not applied', () => {
		// The buyer cancelled or started another run; the stale result must not
		// overwrite what they did in the meantime.
		const e = fresh();
		e.beginOperation('op1');
		e.endOperation();
		e.commit('manual', '<div>manual</div>');
		const result = e.completeOperation('op1', '<div>stale ai</div>');
		assert.equal(result.applied, false);
		assert.equal(result.reason, 'superseded');
		assert.equal(get(e).html, '<div>manual</div>');
	});

	test('a result for a different operation id is dropped', () => {
		const e = fresh();
		e.beginOperation('op2');
		const result = e.completeOperation('op1', '<div>wrong</div>');
		assert.equal(result.applied, false);
		assert.equal(get(e).html, '<div>a</div>');
	});

	test('the lock is store state, so every surface reads the same thing', () => {
		const e = fresh();
		e.beginOperation('op1');
		assert.equal(get(e).saveState, 'ai');
		assert.ok(get(e).operation);
		e.endOperation();
		assert.equal(get(e).operation, null);
	});

	test('cancelling leaves the draft exactly as it was', () => {
		const e = fresh();
		e.commit('mine', '<div>mine</div>');
		e.beginOperation('op1');
		e.endOperation();
		assert.equal(get(e).html, '<div>mine</div>');
	});
});

describe('history position and save labels', () => {
	test('canUndo is state, not a function the UI has to poll', () => {
		const e = fresh();
		assert.equal(get(e).canUndo, false, 'nothing to undo at the opened document');
		e.commit('moved headline', '<div>b</div>');
		assert.equal(get(e).canUndo, true);
		assert.equal(get(e).canRedo, false);
		e.undo();
		assert.equal(get(e).canUndo, false);
		assert.equal(get(e).canRedo, true);
	});

	test('an AI result is one entry, so one undo rejects the whole edit', () => {
		const e = fresh();
		e.beginOperation('op1');
		e.completeOperation('op1', '<div>ai wrote a lot</div>');
		e.undo();
		assert.equal(get(e).html, '<div>a</div>');
		assert.equal(get(e).canUndo, false);
	});

	test('a save carries the gestures it covered, not the word "edit"', () => {
		const e = fresh();
		e.commit('moved headline', '<div>b</div>');
		assert.deepEqual(
			get(e).unsavedLabels.map((l) => l.label),
			['moved headline']
		);
	});

	test('work committed while a save is in flight keeps its own label', () => {
		const e = fresh();
		e.commit('first', '<div>b</div>');
		const seq = get(e).localSeq;
		e.commit('second', '<div>c</div>');
		// The server acknowledges the FIRST save only.
		e.saved({ revision: 4, seq });
		assert.deepEqual(
			get(e).unsavedLabels.map((l) => l.label),
			['second'],
			'the label for unsaved work must survive an acknowledgement of earlier work'
		);
		assert.equal(get(e).saveState, 'unsaved');
	});
});
