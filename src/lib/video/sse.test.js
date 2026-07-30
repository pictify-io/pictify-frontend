/**
 * Tests for the SSE frame reader.
 * Run: node --test src/lib/video/sse.test.js
 *
 * This is the part that fails quietly. A network chunk can split a frame
 * anywhere, and a reader that assumes one chunk is one frame works perfectly
 * against a fast local server and drops events over a real network — invisible
 * in development, unreproducible in production. So the chunk boundaries here
 * are deliberately hostile.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { drainFrames, readEventStream } from './sse.js';

const frame = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

/** A Response-alike that yields the given string chunks. */
const responseOf = (chunks) => {
	const encoder = new TextEncoder();
	let i = 0;
	return {
		body: {
			getReader: () => ({
				read: async () =>
					i < chunks.length
						? { done: false, value: encoder.encode(chunks[i++]) }
						: { done: true, value: undefined }
			})
		}
	};
};

const collect = async (chunks) => {
	const seen = [];
	await readEventStream(responseOf(chunks), (event, data) => seen.push([event, data]));
	return seen;
};

// ── drainFrames ──────────────────────────────────────────────────────────

test('complete frames are returned and the buffer is emptied', () => {
	const { events, rest } = drainFrames(frame('status', { stage: 'a' }) + frame('done', { ok: 1 }));
	assert.deepEqual(events, [
		{ event: 'status', data: { stage: 'a' } },
		{ event: 'done', data: { ok: 1 } }
	]);
	assert.equal(rest, '');
});

test('a partial tail is kept for the next chunk', () => {
	// Dropping it instead is the bug this module exists to prevent.
	const full = frame('status', { stage: 'writing' });
	const { events, rest } = drainFrames(full + 'event: status\ndata: {"stage":"comp');
	assert.equal(events.length, 1);
	assert.equal(rest, 'event: status\ndata: {"stage":"comp');
});

test('comments and half-frames are skipped, not thrown on', () => {
	// SSE allows bare comments and proxies inject them to hold a connection open.
	const { events } = drainFrames(
		': keep-alive\n\n' + 'event: status\n\n' + 'data: {"orphan":1}\n\n' + frame('done', { ok: 1 })
	);
	assert.deepEqual(events, [{ event: 'done', data: { ok: 1 } }]);
});

test('a malformed payload costs its own frame only', () => {
	const { events } = drainFrames('event: status\ndata: not-json\n\n' + frame('done', { ok: 1 }));
	assert.deepEqual(events, [{ event: 'done', data: { ok: 1 } }]);
});

test('an empty buffer yields nothing', () => {
	assert.deepEqual(drainFrames('').events, []);
	assert.deepEqual(drainFrames(null).events, []);
});

// ── readEventStream ──────────────────────────────────────────────────────

test('events arrive in order across chunks', async () => {
	const seen = await collect([
		frame('status', { stage: 'generating' }),
		frame('status', { stage: 'compiling' }),
		frame('done', { tsx: 'code' })
	]);
	assert.deepEqual(seen.map(([e, d]) => [e, d.stage ?? d.tsx]), [
		['status', 'generating'],
		['status', 'compiling'],
		['done', 'code']
	]);
});

test('a frame split across three chunks is still read', async () => {
	// The realistic failure: a boundary lands mid-JSON.
	const full = frame('status', { stage: 'writing', characters: 1200 });
	const seen = await collect([full.slice(0, 12), full.slice(12, 30), full.slice(30)]);
	assert.deepEqual(seen, [['status', { stage: 'writing', characters: 1200 }]]);
});

test('a split exactly on the frame terminator is handled', async () => {
	const full = frame('status', { stage: 'compiling' });
	const seen = await collect([full.slice(0, full.length - 1), full.slice(-1)]);
	assert.equal(seen.length, 1);
});

test('several frames in one chunk are all read', async () => {
	// The other half: a slow reader gets three events in one read, and a parser
	// that handles only the first silently drops the rest.
	const seen = await collect([
		frame('status', { stage: 'a' }) + frame('status', { stage: 'b' }) + frame('done', { tsx: 'x' })
	]);
	assert.equal(seen.length, 3);
});

test('a multi-byte character split across chunks is not corrupted', async () => {
	// TextDecoder without { stream: true } turns the halves into replacement
	// characters, so a scene containing an em dash or an emoji comes back mangled.
	const full = frame('done', { tsx: 'const a = "café ✅";' });
	const bytes = new TextEncoder().encode(full);
	const cut = full.indexOf('café') + 4; // lands inside the é
	const decoder = new TextDecoder();
	const seen = await collect([
		decoder.decode(bytes.slice(0, cut), { stream: true }),
		decoder.decode(bytes.slice(cut))
	]);
	assert.equal(seen[0][1].tsx, 'const a = "café ✅";');
});
