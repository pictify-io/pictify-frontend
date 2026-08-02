/**
 * Tests for the starter scenes.
 * Run: node --test src/lib/video/starters.test.js
 *
 * These are the first thing a new user sees, and a broken one fails in the
 * least visible way possible: the studio mounts, the clip is rejected or lands
 * off the artboard, and the screen is blank exactly as if no starter existed.
 * So the invariants are pinned here rather than left to a look-and-see.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	STARTERS,
	starterById,
	buildStarterClips,
	starterDurationUs,
	DEFAULT_STARTER_DURATION_US
} from './starters.js';
import { TOKEN_RE } from './variables.js';

const FORMATS = [
	{ label: '9:16', width: 1080, height: 1920 },
	{ label: '1:1', width: 1080, height: 1080 },
	{ label: '16:9', width: 1920, height: 1080 }
];

const tokensIn = (value) => {
	const found = [];
	// TOKEN_RE is global, so lastIndex persists between calls — reset it or the
	// second scan starts mid-string and silently misses tokens.
	TOKEN_RE.lastIndex = 0;
	let match;
	while ((match = TOKEN_RE.exec(String(value ?? '')))) found.push(match[1]);
	return found;
};

// ── Catalogue ────────────────────────────────────────────────────────────

test('every starter has the fields the chooser renders', () => {
	assert.ok(STARTERS.length >= 4, 'a chooser with three cards is not a catalogue');
	for (const starter of STARTERS) {
		assert.ok(starter.id, 'missing id');
		assert.ok(starter.name, `${starter.id}: missing name`);
		assert.ok(starter.description, `${starter.id}: missing description`);
		assert.ok(Array.isArray(starter.build) && starter.build.length, `${starter.id}: no clips`);
	}
});

test('starter ids are unique', () => {
	// A duplicate id makes starterById return the first silently, so one card in
	// the chooser would open the wrong scene.
	const ids = STARTERS.map((s) => s.id);
	assert.equal(new Set(ids).size, ids.length);
});

test('an unknown id is null, not a crash', () => {
	assert.equal(starterById('nope'), null);
	assert.equal(buildStarterClips('nope', { width: 1080, height: 1920 }), null);
});

// ── Tokens ───────────────────────────────────────────────────────────────

test('every starter puts real tokens on the canvas', () => {
	// The entire point: opening a starter should declare variables immediately,
	// so the product loop is visible before the user types anything.
	for (const starter of STARTERS) {
		const clips = buildStarterClips(starter.id, { width: 1080, height: 1920 });
		const found = clips.flatMap((clip) => tokensIn(clip.text));
		assert.ok(found.length >= 2, `${starter.id} declares only ${found.length} variables`);
	}
});

test("each starter's declared tokens match what its clips actually contain", () => {
	// The `tokens` field is documentation for the chooser card. If it drifts from
	// the scene, the card promises variables the template does not have.
	for (const starter of STARTERS) {
		const clips = buildStarterClips(starter.id, { width: 1080, height: 1920 });
		const actual = new Set(clips.flatMap((clip) => tokensIn(clip.text)));
		for (const declared of starter.tokens || []) {
			assert.ok(actual.has(declared), `${starter.id}: declares ${declared} but no clip uses it`);
		}
		for (const used of actual) {
			assert.ok((starter.tokens || []).includes(used), `${starter.id}: uses undeclared ${used}`);
		}
	}
});

test('tokens are snake_case, so the auto-declared names read well', () => {
	// variables.js only matches [a-zA-Z_][a-zA-Z0-9_]* — a hyphen or space in a
	// token means it is never detected and the text renders the braces literally.
	for (const starter of STARTERS) {
		for (const token of starter.tokens || []) {
			assert.match(token, /^[a-z][a-z0-9_]*$/, `${starter.id}: ${token} is not snake_case`);
		}
	}
});

// ── Geometry, at every format ────────────────────────────────────────────

for (const format of FORMATS) {
	test(`every clip stays on the artboard at ${format.label}`, () => {
		// Fractional geometry is what makes one definition work at three aspect
		// ratios; this is the test that keeps that claim honest.
		for (const starter of STARTERS) {
			const clips = buildStarterClips(starter.id, format);
			for (const clip of clips) {
				const t = clip.transform;
				assert.ok(t.x >= 0, `${starter.id}/${clip.name} at ${format.label}: x ${t.x} < 0`);
				assert.ok(t.y >= 0, `${starter.id}/${clip.name} at ${format.label}: y ${t.y} < 0`);
				assert.ok(
					t.x + t.width <= format.width,
					`${starter.id}/${clip.name} at ${format.label}: right edge ${t.x + t.width} > ${format.width}`
				);
				assert.ok(
					t.y + t.height <= format.height,
					`${starter.id}/${clip.name} at ${format.label}: bottom ${t.y + t.height} > ${format.height}`
				);
			}
		}
	});

	test(`type stays legible at ${format.label}`, () => {
		// Sized off the SHORTER side, so a 16:9 headline does not balloon. Both
		// bounds matter: too small is unreadable, too large overflows its box.
		const short = Math.min(format.width, format.height);
		for (const starter of STARTERS) {
			for (const clip of buildStarterClips(starter.id, format)) {
				if (clip.type !== 'Text') continue;
				const size = clip.style.fontSize;
				assert.ok(size >= short * 0.015, `${starter.id}/${clip.name}: ${size}px is too small`);
				assert.ok(size <= short * 0.2, `${starter.id}/${clip.name}: ${size}px is too large`);
			}
		}
	});
}

test('the longest unbreakable run fits its box at every format', () => {
	// wordWrap cannot save a {{token}}: there are no spaces in it, so it is one
	// unbreakable run and the engine clips it at the box edge. A starter whose
	// placeholder is cut in half on open looks broken before the user types
	// anything, which is the exact opposite of what a starter is for.
	//
	// 0.6em per character is a deliberately conservative estimate for bold
	// sans-serif — real Inter-Bold averages nearer 0.55em, so passing here
	// leaves headroom rather than sitting on the limit.
	const CHAR_WIDTH_EM = 0.6;
	for (const format of FORMATS) {
		for (const starter of STARTERS) {
			for (const clip of buildStarterClips(starter.id, format)) {
				if (clip.type !== 'Text') continue;
				const longestRun = String(clip.text)
					.split(/\s+/)
					.reduce((longest, word) => (word.length > longest.length ? word : longest), '');
				const estimated = longestRun.length * clip.style.fontSize * CHAR_WIDTH_EM;
				assert.ok(
					estimated <= clip.style.wordWrapWidth,
					`${starter.id}/${clip.name} at ${format.label}: "${longestRun}" needs ~${Math.round(estimated)}px in a ${clip.style.wordWrapWidth}px box`
				);
			}
		}
	}
});

// ── Clip payload shape ───────────────────────────────────────────────────

test('every clip carries the fields the engine requires', () => {
	// A clip with an empty src is dropped on import — silently, leaving a scene
	// that is simply missing pieces.
	for (const starter of STARTERS) {
		for (const clip of buildStarterClips(starter.id, { width: 1080, height: 1920 })) {
			assert.ok(clip.type, `${starter.id}: clip with no type`);
			assert.ok(clip.timing?.display, `${starter.id}/${clip.name}: no display timing`);
			assert.ok(clip.timing.display.to > clip.timing.display.from, `${starter.id}/${clip.name}: zero length`);
			assert.ok(clip.transform, `${starter.id}/${clip.name}: no transform`);
			if (clip.type !== 'Text') {
				assert.ok(clip.src, `${starter.id}/${clip.name}: non-text clip needs a src`);
			}
		}
	}
});

test('text clips wrap within their own box', () => {
	// Without wordWrapWidth the engine lays long copy on one line and it runs off
	// the artboard — which only shows up once a real value replaces the token.
	for (const starter of STARTERS) {
		for (const clip of buildStarterClips(starter.id, { width: 1080, height: 1920 })) {
			if (clip.type !== 'Text') continue;
			assert.equal(clip.style.wordWrap, true, `${starter.id}/${clip.name}`);
			assert.equal(
				clip.style.wordWrapWidth,
				clip.transform.width,
				`${starter.id}/${clip.name}: wrap width should match the clip box`
			);
		}
	}
});

test('text clips set both align spellings', () => {
	// The engine reads `align`; the properties panel writes `textAlign`. A
	// starter that sets only one reads back wrong in the panel the moment it
	// opens.
	for (const starter of STARTERS) {
		for (const clip of buildStarterClips(starter.id, { width: 1080, height: 1920 })) {
			if (clip.type !== 'Text') continue;
			assert.equal(clip.style.align, clip.style.textAlign, `${starter.id}/${clip.name}`);
		}
	}
});

test('a backdrop sits behind everything and text sits above shapes', () => {
	for (const starter of STARTERS) {
		const clips = buildStarterClips(starter.id, { width: 1080, height: 1920 });
		const zOf = (type) => clips.filter((c) => c.type === type).map((c) => c.transform.zIndex);
		for (const z of zOf('Backdrop')) assert.equal(z, 0, `${starter.id}: backdrop must be at 0`);
		for (const z of zOf('Text')) {
			for (const shapeZ of zOf('Shape')) {
				assert.ok(z > shapeZ, `${starter.id}: text at ${z} is under a shape at ${shapeZ}`);
			}
		}
	}
});

test('the name-tag starter has no full-bleed backdrop', () => {
	// It is designed to sit over footage the user drops in. A backdrop would be
	// the first thing they have to find and delete.
	const clips = buildStarterClips('lower-third', { width: 1080, height: 1920 });
	assert.equal(clips.filter((c) => c.type === 'Backdrop').length, 0);
});

// ── Timing ───────────────────────────────────────────────────────────────

test('timings are in microseconds', () => {
	// The engine's unit. Milliseconds here would make every scene 1/1000th as
	// long — a scene that ends before the first frame renders.
	const clips = buildStarterClips('launch', { width: 1080, height: 1920 });
	assert.equal(clips[0].timing.display.to, 6_000_000);
});

test('starterDurationUs covers the last clip', () => {
	for (const starter of STARTERS) {
		const clips = buildStarterClips(starter.id, { width: 1080, height: 1920 });
		const latest = Math.max(...clips.map((c) => c.timing.display.to));
		assert.equal(starterDurationUs(starter.id), latest, starter.id);
	}
});

test('an unknown id still yields a sane duration', () => {
	assert.equal(starterDurationUs('nope'), DEFAULT_STARTER_DURATION_US);
});

test('staggered clips all start before the scene ends', () => {
	for (const starter of STARTERS) {
		const clips = buildStarterClips(starter.id, { width: 1080, height: 1920 });
		const end = Math.max(...clips.map((c) => c.timing.display.to));
		for (const clip of clips) {
			assert.ok(
				clip.timing.display.from < end,
				`${starter.id}/${clip.name} starts at or after the scene ends`
			);
		}
	}
});
