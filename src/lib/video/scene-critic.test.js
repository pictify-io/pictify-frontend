/**
 * The scene critic is what makes the copilot's review phase honest: findings
 * come from these checks, not from the model grading its own work. Every rule
 * here is a bug class a real agent run produced — dead air, cut-off clips,
 * text under the platform chrome, an effect layered under its content.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { critiqueScene } from './scene-critic.js';

const S = 1_000_000;

const scene = (settings, clips) => ({
	settings: { width: 1080, height: 1920, duration: 10 * S, ...settings },
	clips: Object.fromEntries(clips.map((clip) => [clip.id, clip]))
});

const clip = (id, overrides = {}) => ({
	id,
	type: 'Text',
	name: id,
	timing: { display: { from: 0, to: 5 * S } },
	transform: { x: 100, y: 500, width: 800, height: 120, zIndex: 20 },
	style: { fontSize: 72 },
	...overrides
});

const backdrop = (id, fromS, toS) =>
	clip(id, {
		type: 'Video',
		timing: { display: { from: fromS * S, to: toS * S } },
		transform: { x: 0, y: 0, width: 1080, height: 1920, zIndex: 1 },
		style: {}
	});

test('an empty scene is the only finding, not twelve of them', () => {
	const findings = critiqueScene(scene({}, []));
	assert.equal(findings.length, 1);
	assert.match(findings[0], /no visible clips/);
});

test('a clean scene produces no findings', () => {
	const findings = critiqueScene(
		scene({ duration: 5 * S }, [backdrop('bg', 0, 5), clip('title')])
	);
	assert.deepEqual(findings, []);
});

test('a clip past the scene end is reported as cut off, with both times', () => {
	const findings = critiqueScene(
		scene({ duration: 4 * S }, [backdrop('bg', 0, 4), clip('title')])
	);
	assert.equal(findings.length, 1);
	assert.match(findings[0], /runs to 5s but the scene ends at 4s/);
	assert.match(findings[0], /id title/);
});

test('a clip starting after the scene end is never shown', () => {
	const late = clip('late', { timing: { display: { from: 12 * S, to: 14 * S } } });
	const findings = critiqueScene(scene({ duration: 10 * S }, [backdrop('bg', 0, 10), late]));
	assert.match(findings[0], /never shown/);
});

test('dead air at the end names the gap and the fix', () => {
	const findings = critiqueScene(scene({ duration: 10 * S }, [backdrop('bg', 0, 6)]));
	assert.equal(findings.length, 1);
	assert.match(findings[0], /4s of dead air/);
	assert.match(findings[0], /duration to 6s/);
});

test('a coverage gap between backdrops is flagged', () => {
	const findings = critiqueScene(
		scene({ duration: 10 * S }, [backdrop('a', 0, 4), backdrop('b', 6, 10)])
	);
	assert.equal(findings.length, 1);
	assert.match(findings[0], /between 4s and 6s/);
});

test('no backdrop at all means coverage is not judged — text on a colour is a style', () => {
	const findings = critiqueScene(
		scene({ duration: 5 * S, backgroundColor: '#111111' }, [clip('title')])
	);
	assert.deepEqual(findings, []);
});

test('audio does not count as visual coverage', () => {
	const music = clip('music', {
		type: 'Audio',
		timing: { display: { from: 0, to: 10 * S } },
		transform: undefined,
		style: {}
	});
	const findings = critiqueScene(scene({ duration: 10 * S }, [music]));
	assert.match(findings[0], /no visible clips/);
});

test('text below the safe band is called out with the fraction', () => {
	const low = clip('low', {
		transform: { x: 100, y: 1850, width: 800, height: 120, zIndex: 20 }
	});
	const findings = critiqueScene(
		scene({ duration: 5 * S }, [backdrop('bg', 0, 5), low])
	);
	assert.match(findings[0], /outside the safe area/);
	assert.match(findings[0], /id low/);
});

test('tiny type is flagged with the actionable tool', () => {
	const small = clip('small', { style: { fontSize: 18 } });
	const findings = critiqueScene(scene({ duration: 5 * S }, [backdrop('bg', 0, 5), small]));
	assert.match(findings[0], /tiny type/);
	assert.match(findings[0], /set_font_size/);
});

test('zero-size clips render nothing and say so', () => {
	const flat = clip('flat', { transform: { x: 0, y: 0, width: 0, height: 100, zIndex: 5 } });
	const findings = critiqueScene(scene({ duration: 5 * S }, [backdrop('bg', 0, 5), flat]));
	assert.match(findings[0], /zero size/);
});

test('an effect layered under its content is caught', () => {
	const effect = clip('fx', {
		type: 'Effect',
		transform: { x: 0, y: 0, width: 0, height: 0, zIndex: 5 },
		style: {}
	});
	const findings = critiqueScene(
		scene({ duration: 5 * S }, [backdrop('bg', 0, 5), clip('title'), effect])
	);
	assert.equal(findings.length, 1);
	assert.match(findings[0], /layered below the content/);
	assert.match(findings[0], /set_layer/);
});

test('an effect ABOVE its content is fine', () => {
	const effect = clip('fx', {
		type: 'Effect',
		transform: { x: 0, y: 0, width: 0, height: 0, zIndex: 900 },
		style: {}
	});
	const findings = critiqueScene(
		scene({ duration: 5 * S }, [backdrop('bg', 0, 5), clip('title'), effect])
	);
	assert.deepEqual(findings, []);
});

test('two texts on top of each other at the same time collide', () => {
	const a = clip('a');
	const b = clip('b', { transform: { x: 120, y: 520, width: 800, height: 120, zIndex: 21 } });
	const findings = critiqueScene(scene({ duration: 5 * S }, [backdrop('bg', 0, 5), a, b]));
	assert.equal(findings.length, 1);
	assert.match(findings[0], /overlap on screen at the same time/);
});

test('the same boxes at DIFFERENT times do not collide', () => {
	const a = clip('a');
	const b = clip('b', { timing: { display: { from: 6 * S, to: 10 * S } } });
	const findings = critiqueScene(scene({ duration: 10 * S }, [backdrop('bg', 0, 10), a, b]));
	assert.deepEqual(findings, []);
});

test('findings are capped so the reviewer is not buried', () => {
	const many = Array.from({ length: 30 }, (_, i) =>
		clip(`t${i}`, { transform: { x: 100, y: 1880, width: 800, height: 120, zIndex: 20 } })
	);
	const findings = critiqueScene(scene({ duration: 5 * S }, [backdrop('bg', 0, 5), ...many]));
	assert.ok(findings.length <= 12);
});

test('a missing transform on a visual clip does not crash the critic', () => {
	const bare = { id: 'bare', type: 'Text', timing: { display: { from: 0, to: 5 * S } } };
	const findings = critiqueScene(scene({ duration: 5 * S }, [backdrop('bg', 0, 5), bare]));
	assert.ok(Array.isArray(findings));
});
