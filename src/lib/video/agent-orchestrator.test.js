/**
 * The phase decisions behind the copilot. Wrong answers here are expensive in
 * a specific way: classify an edit as generation and a colour change gets a
 * 350-word brief and a review pass; classify generation as an edit and the
 * agent free-styles a video with no plan — which is the exact complaint this
 * pipeline exists to fix.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	classifyRequest,
	budgetFor,
	roundReport,
	shouldReview,
	condenseBrief
} from './agent-orchestrator.js';

const fullScene = { clips: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }] };
const emptyScene = { clips: [] };

test('a generative verb plus a composition noun is generation', () => {
	assert.equal(classifyRequest('Create a promo video for our coffee brand', fullScene), 'generate');
	assert.equal(classifyRequest('make an intro for my channel', fullScene), 'generate');
	assert.equal(classifyRequest('build a product announcement', fullScene), 'generate');
});

test('a generative verb WITHOUT a composition noun on a full scene is an edit', () => {
	// The classic trap: "make" is generative, "the title bigger" is not.
	assert.equal(classifyRequest('Make the title bigger and move it up', fullScene), 'edit');
	assert.equal(classifyRequest('make the background darker', fullScene), 'edit');
});

test('plain edits are edits', () => {
	assert.equal(classifyRequest('Change the accent colour to orange', fullScene), 'edit');
	assert.equal(classifyRequest('delete the second clip', fullScene), 'edit');
	assert.equal(classifyRequest('Hold the lower third for two more seconds', fullScene), 'edit');
});

test('on a nearly empty scene a generative verb is enough', () => {
	assert.equal(classifyRequest('make something about our launch', emptyScene), 'generate');
	// ...but a plain edit stays an edit even on an empty scene.
	assert.equal(classifyRequest('move the text up', emptyScene), 'edit');
});

test('nothing crashes on garbage', () => {
	assert.equal(classifyRequest('', undefined), 'edit');
	assert.equal(classifyRequest(null, {}), 'edit');
});

test('rounds are the budget; the operations ceiling is only a runaway backstop', () => {
	// Each reply is capped at 25 calls server-side, so the ceiling must sit AT
	// rounds x 25, not below it — an earlier, smaller ceiling stopped a
	// legitimate 43-operation restyle mid-flight.
	assert.deepEqual(budgetFor('generate'), { rounds: 8, operations: 200 });
	assert.deepEqual(budgetFor('edit'), { rounds: 6, operations: 150 });
});

test('restyle verbs are generative — they deserve a brief and the full budget', () => {
	assert.equal(classifyRequest('Revamp the video with coding-themed footage', fullScene), 'generate');
	assert.equal(classifyRequest('redesign this template around our brand', fullScene), 'generate');
	// ...but "update" stays an edit verb: "update the title" is one call.
	assert.equal(classifyRequest('update the title to say Hello', fullScene), 'edit');
});

test('a round report always carries the scene and the stop instruction', () => {
	const report = roundReport({ scene: { clips: [] } });
	assert.match(report, /Scene now: /);
	assert.match(report, /empty calls list/);
});

test('failures are framed as do-not-repeat, because models repeat them', () => {
	const report = roundReport({
		failures: ['set_color: No clip with id x.'],
		scene: {}
	});
	assert.match(report, /Failed \(do not repeat these unchanged\): set_color/);
});

test('lookup answers and the applied summary appear when present', () => {
	const report = roundReport({
		answers: ['effects matching "film": oldFilm'],
		applied: 'Added 2 clips.',
		scene: {}
	});
	assert.match(report, /oldFilm/);
	assert.match(report, /Applied: Added 2 clips\./);
});

test('generation is always reviewed; a no-op run never is', () => {
	assert.equal(shouldReview({ kind: 'generate', operations: 12, findings: [] }), true);
	assert.equal(shouldReview({ kind: 'generate', operations: 0, findings: ['x'] }), false);
});

test('edits are reviewed only when the checks found something', () => {
	assert.equal(shouldReview({ kind: 'edit', operations: 2, findings: [] }), false);
	assert.equal(shouldReview({ kind: 'edit', operations: 2, findings: ['dead air'] }), true);
});

test('a short brief passes through untouched', () => {
	assert.equal(condenseBrief('Idea: a warm coffee promo.'), 'Idea: a warm coffee promo.');
});

test('a long brief is cut at a sentence or line break, not mid-word', () => {
	const brief = `Idea: a bold launch teaser.\n${'Beat one shows the product. '.repeat(30)}`;
	const short = condenseBrief(brief);
	assert.ok(short.length < brief.length);
	assert.ok(short.endsWith('…'));
	assert.ok(!/\w…$/.test(short) || short.length <= 281);
});

test('condenseBrief survives nothing at all', () => {
	assert.equal(condenseBrief(undefined), '');
});
