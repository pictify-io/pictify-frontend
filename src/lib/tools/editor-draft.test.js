import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
	newDraftId, saveDraft, loadDraft, latestDraft, clearDraft,
	putHandoff, takeHandoff, STALE_DAYS
} from './editor-draft.js';

/**
 * TS-2. The properties that matter are the failure ones: this runs in browsers
 * that throw on `localStorage` access, and an editor that dies because it could
 * not cache a draft is worse than one that quietly stops caching.
 */

/** A localStorage stand-in with the bits the module actually uses. */
function fakeStorage({ throwOnSet = false, throwOnAccess = false } = {}) {
	const map = new Map();
	return {
		get length() { return map.size; },
		key: (i) => [...map.keys()][i] ?? null,
		getItem(k) { if (throwOnAccess) throw new Error('blocked'); return map.has(k) ? map.get(k) : null; },
		setItem(k, v) { if (throwOnAccess || throwOnSet) throw new Error('quota'); map.set(k, String(v)); },
		removeItem(k) { if (throwOnAccess) throw new Error('blocked'); map.delete(k); },
		_map: map
	};
}

const install = (local, session = fakeStorage()) => {
	globalThis.window = { localStorage: local, sessionStorage: session };
};

beforeEach(() => { delete globalThis.window; });

describe('saving and restoring', () => {
	test('a draft round-trips with its fields', () => {
		install(fakeStorage());
		const id = newDraftId();
		saveDraft(id, { html: '<p>hi</p>', width: 1200, height: 630, format: 'png', sampleValues: { title: 'T' } });
		const found = loadDraft(id);
		assert.equal(found.draft.html, '<p>hi</p>');
		assert.equal(found.draft.width, 1200);
		assert.deepEqual(found.draft.sampleValues, { title: 'T' });
		assert.equal(found.stale, false);
	});

	test('ids are unique', () => {
		const ids = new Set(Array.from({ length: 200 }, () => newDraftId()));
		assert.equal(ids.size, 200);
	});

	test('missing fields get sane defaults rather than undefined', () => {
		install(fakeStorage());
		saveDraft('d1', { html: '<p>x</p>' });
		const d = loadDraft('d1').draft;
		assert.equal(d.width, 1200);
		assert.equal(d.height, 630);
		assert.equal(d.format, 'png');
		assert.deepEqual(d.sampleValues, {});
	});

	test('an unknown id is null, not a crash', () => {
		install(fakeStorage());
		assert.equal(loadDraft('nope'), null);
	});

	test('the newest draft is the one offered', () => {
		install(fakeStorage());
		saveDraft('old', { html: '<p>old</p>' });
		const s = globalThis.window.localStorage;
		const key = 'pictify.tool-draft.old';
		const body = JSON.parse(s.getItem(key));
		body.updatedAt = Date.now() - 5000;
		s.setItem(key, JSON.stringify(body));
		saveDraft('new', { html: '<p>new</p>' });
		assert.equal(latestDraft().id, 'new');
	});

	test('clearing removes it', () => {
		install(fakeStorage());
		saveDraft('d1', { html: '<p>x</p>' });
		clearDraft('d1');
		assert.equal(loadDraft('d1'), null);
	});
});

describe('the 30-day rule', () => {
	test('an old draft is flagged stale but STILL RETURNED', () => {
		// It is offered, never restored silently, and never deleted underneath
		// someone who still owns it.
		install(fakeStorage());
		saveDraft('d1', { html: '<p>old</p>' });
		const s = globalThis.window.localStorage;
		const body = JSON.parse(s.getItem('pictify.tool-draft.d1'));
		body.updatedAt = Date.now() - (STALE_DAYS + 3) * 86400000;
		s.setItem('pictify.tool-draft.d1', JSON.stringify(body));
		const found = loadDraft('d1');
		assert.equal(found.stale, true);
		assert.equal(found.draft.html, '<p>old</p>');
		assert.ok(found.ageDays >= STALE_DAYS);
	});

	test('a draft from today is not stale', () => {
		install(fakeStorage());
		saveDraft('d1', { html: '<p>x</p>' });
		assert.equal(loadDraft('d1').stale, false);
	});
});

describe('when the browser will not cooperate', () => {
	test('no window at all (SSR) returns null instead of throwing', () => {
		assert.equal(saveDraft('d1', { html: 'x' }), null);
		assert.equal(loadDraft('d1'), null);
		assert.equal(latestDraft(), null);
		assert.equal(clearDraft('d1'), false);
	});

	test('storage that throws on access degrades to no draft', () => {
		// Safari private windows and "block site data" throw on USE, not on
		// presence — the object is there and every call fails.
		install(fakeStorage({ throwOnAccess: true }));
		assert.equal(saveDraft('d1', { html: 'x' }), null);
		assert.equal(loadDraft('d1'), null);
	});

	test('a full quota drops the OTHER drafts and retries', () => {
		install(fakeStorage());
		saveDraft('keep-me', { html: '<p>current</p>' });
		saveDraft('other-1', { html: '<p>a</p>' });
		saveDraft('other-2', { html: '<p>b</p>' });
		const s = globalThis.window.localStorage;
		let calls = 0;
		const realSet = s.setItem.bind(s);
		s.setItem = (k, v) => {
			// Fail once, as a full origin does, then succeed after the cleanup.
			if (k === 'pictify.tool-draft.keep-me' && calls++ === 0) throw new Error('quota');
			return realSet(k, v);
		};
		assert.equal(saveDraft('keep-me', { html: '<p>updated</p>' }), 'keep-me');
		assert.equal(loadDraft('keep-me').draft.html, '<p>updated</p>');
		assert.equal(loadDraft('other-1'), null, 'the others were dropped to make room');
	});

	test('corrupt JSON reads as absent', () => {
		install(fakeStorage());
		globalThis.window.localStorage.setItem('pictify.tool-draft.d1', '{not json');
		assert.equal(loadDraft('d1'), null);
	});

	test('a stored value missing html reads as absent', () => {
		install(fakeStorage());
		globalThis.window.localStorage.setItem('pictify.tool-draft.d1', '{"width":10}');
		assert.equal(loadDraft('d1'), null);
	});
});

describe('the tool-result handoff', () => {
	test('html goes through a key, never the URL', () => {
		install(fakeStorage(), fakeStorage());
		const key = putHandoff('<p>from a tool</p>');
		assert.ok(key && !key.includes('<'));
		assert.equal(takeHandoff(key), '<p>from a tool</p>');
	});

	test('it is consumed on read', () => {
		// A handoff is a one-shot, not a second source of truth that can drift.
		install(fakeStorage(), fakeStorage());
		const key = putHandoff('<p>x</p>');
		takeHandoff(key);
		assert.equal(takeHandoff(key), null);
	});

	test('an unknown or missing key is null', () => {
		install(fakeStorage(), fakeStorage());
		assert.equal(takeHandoff('nope'), null);
		assert.equal(takeHandoff(null), null);
	});

	test('it uses sessionStorage, so it does not outlive the tab', () => {
		const session = fakeStorage();
		install(fakeStorage(), session);
		putHandoff('<p>x</p>');
		assert.equal(session._map.size, 1);
		assert.equal(globalThis.window.localStorage._map.size, 0);
	});
});
