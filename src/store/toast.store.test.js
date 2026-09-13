import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { get } from 'svelte/store';
import {
	notify,
	humanize,
	visibleToasts,
	dismissToast,
	dismissNewestFail,
	clearToasts,
	showToast,
	MAX_VISIBLE
} from './toast.store.js';

const err = (status, data = {}) => Object.assign(new Error('http'), { status, data });
const list = () => get(visibleToasts);

beforeEach(() => clearToasts());

/**
 * TO-01. The copy rule is the test: the eyebrow names the action and the
 * status, the sentence names the consequence, and neither says "Error".
 */
describe('humanize', () => {
	test('401 sends them to sign in', () => {
		assert.match(humanize(err(401)), /session ended/i);
	});

	test('403 prefers the server’s reason, because it names the rule', () => {
		assert.equal(
			humanize(err(403, { message: 'Only an owner can delete "Q3 invoice".' })),
			'Only an owner can delete "Q3 invoice".'
		);
		assert.match(humanize(err(403)), /permission/i);
	});

	test('404 says it is gone rather than that it failed', () => {
		assert.match(humanize(err(404)), /no longer exists/i);
	});

	test('a render failure says nothing was billed; other actions say nothing changed', () => {
		assert.match(humanize(err(502), 'Render'), /Nothing was billed/);
		assert.match(humanize(err(502), 'Delete'), /Nothing was changed/);
	});

	test('a network failure with no status reads as a server that did not answer', () => {
		assert.match(humanize(new Error('fetch failed'), 'Delete'), /did not answer/i);
	});

	test('never the words that say nothing', () => {
		for (const e of [err(400), err(403), err(404), err(409), err(500), new Error('x')]) {
			const line = humanize(e, 'Save');
			assert.doesNotMatch(line, /something went wrong|oops|unexpected error/i);
		}
	});
});

describe('notify.fail', () => {
	test('eyebrow names the action and the status', () => {
		notify.fail('Render', err(502));
		assert.equal(list()[0].eyebrow, 'RENDER FAILED · 502');
	});

	test('a status-less failure still names the action', () => {
		notify.fail('Delete', new Error('offline'));
		assert.equal(list()[0].eyebrow, 'DELETE FAILED');
	});

	test('never auto-dismisses', () => {
		notify.fail('Delete', err(500));
		assert.equal(list()[0].duration, null);
	});

	test('a quota refusal is the upgrade modal’s, not ours', () => {
		assert.equal(notify.fail('Render', err(429, { code: 'quota_exceeded' })), null);
		assert.equal(list().length, 0);
		// A 429 that is NOT the quota ladder still has to say something.
		notify.fail('Render', err(429));
		assert.equal(list().length, 1);
	});

	test('RETRY only when the caller passed one, COPY ERROR ID only when there is one', () => {
		notify.fail('Delete', err(500));
		assert.equal(list()[0].retry, null);
		assert.equal(list()[0].errorId, null);
		clearToasts();
		notify.fail('Delete', err(500, { requestId: 'req_42' }), { retry: () => {} });
		assert.equal(typeof list()[0].retry, 'function');
		assert.equal(list()[0].errorId, 'req_42');
	});

	test('the same id replaces rather than stacks, so a retried action shows once', () => {
		notify.fail('Delete', err(500), { id: 'delete:abc' });
		notify.fail('Delete', err(502), { id: 'delete:abc' });
		assert.equal(list().length, 1);
		assert.equal(list()[0].eyebrow, 'DELETE FAILED · 502');
	});
});

describe('the queue', () => {
	test('three visible, newest last, the fourth drops the oldest', () => {
		notify.note('ONE', 'a');
		notify.note('TWO', 'b');
		notify.note('THREE', 'c');
		assert.deepEqual(list().map((t) => t.eyebrow), ['ONE', 'TWO', 'THREE']);
		notify.note('FOUR', 'd');
		assert.equal(list().length, MAX_VISIBLE);
		assert.deepEqual(list().map((t) => t.eyebrow), ['TWO', 'THREE', 'FOUR']);
	});

	test('ok and note carry their own durations', () => {
		notify.done('KEY COPIED', 'x');
		notify.note('PORTAL OPENING', 'y');
		assert.equal(list()[0].duration, 3000);
		assert.equal(list()[1].duration, 4000);
	});

	test('Esc dismisses the newest failure and leaves the rest', () => {
		notify.fail('Delete', err(500));
		notify.note('NOTE', 'x');
		notify.fail('Render', err(502));
		assert.equal(dismissNewestFail(), true);
		assert.deepEqual(list().map((t) => t.kind), ['fail', 'note']);
		assert.equal(list()[0].eyebrow, 'DELETE FAILED · 500');
	});

	test('Esc with no failure showing changes nothing', () => {
		notify.note('NOTE', 'x');
		assert.equal(dismissNewestFail(), false);
		assert.equal(list().length, 1);
	});

	test('dismissing by id removes exactly one', () => {
		const id = notify.done('A', 'a');
		notify.done('B', 'b');
		dismissToast(id);
		assert.deepEqual(list().map((t) => t.eyebrow), ['B']);
	});

	test('the v1 showToast still works, and its failures stay timed', () => {
		showToast('Saved', 'success');
		showToast('Failed to generate image', 'error', 4000);
		assert.deepEqual(list().map((t) => t.kind), ['ok', 'fail']);
		assert.equal(list()[1].duration, 4000);
	});
});
