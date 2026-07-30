/**
 * Tests for the motion picker's preview mapping.
 * Run: node --test src/lib/video/motion-preview.test.js
 *
 * The mapping is the whole value of the picker: a tile that animates the wrong
 * direction is worse than a plain text list, because it actively misleads. A
 * label alone cannot be checked by eye across 120 motions, so the rules are
 * pinned here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	PREVIEW_FAMILIES,
	transitionFamily,
	familyFromName,
	directionFromName,
	previewSpec,
	isExitMotion,
	groupByCategory,
	categoryLabel,
	filterMotions
} from './motion-preview.js';

// ── Transition categories ────────────────────────────────────────────────

test('every catalog category maps to a real family', () => {
	// These nine are the categories transitions.js orders the catalog by. A
	// missing one silently falls through to the name guess, which for a key like
	// "cube" would land on a crossfade and look like the tile is broken.
	const categories = ['fade', 'wipe', 'slide', 'zoom', 'blur', 'geometric', 'distort', 'stylized', 'glitch'];
	for (const category of categories) {
		const family = transitionFamily({ category });
		assert.ok(PREVIEW_FAMILIES.includes(family), `${category} -> ${family} is not a family`);
	}
});

test('geometric reveals are not lumped in with linear wipes', () => {
	// A circle iris and a left-to-right wipe read completely differently. If both
	// render as a wipe, the Shapes section becomes nine identical tiles.
	assert.equal(transitionFamily({ category: 'geometric' }), 'reveal');
	assert.equal(transitionFamily({ category: 'wipe' }), 'wipe');
});

test('an uncategorised transition falls back to reading its key', () => {
	assert.equal(transitionFamily({ key: 'circleCrop' }), 'reveal');
	assert.equal(transitionFamily({ key: 'zoomBlur' }), 'blur');
	assert.equal(transitionFamily({ key: 'somethingUnknown' }), 'fade');
});

// ── Name-based families ──────────────────────────────────────────────────

test('overlapping tokens resolve to the more specific family', () => {
	// "zoomOutBlur" contains both zoom and blur; "slideUp" contains "up".
	// Whichever rule runs first wins, so the order in NAME_FAMILY_RULES is
	// load-bearing and these lock it.
	assert.equal(familyFromName('zoomOutBlur'), 'blur');
	assert.equal(familyFromName('glitchSlide'), 'glitch');
	assert.equal(familyFromName('circleWipe'), 'reveal');
	assert.equal(familyFromName('slideUp'), 'slide');
});

test('the exotic stylised names land somewhere sensible', () => {
	// The names that make the flat dropdown unusable in the first place.
	assert.equal(familyFromName('butterflyWaveScrawler'), 'glitch');
	assert.equal(familyFromName('polkaDotsCurtain'), 'reveal');
	assert.equal(familyFromName('crossZoom'), 'zoom');
	assert.equal(familyFromName('pixelize'), 'reveal');
});

test('an unrecognised name is a crossfade, not a crash', () => {
	assert.equal(familyFromName('totallyUnknownThing'), 'fade');
	assert.equal(familyFromName(''), 'fade');
	assert.equal(familyFromName(null), 'fade');
	assert.equal(familyFromName(undefined), 'fade');
});

// ── Direction ────────────────────────────────────────────────────────────

test('direction is read from the name', () => {
	// Two motions in the same family differing only by direction is exactly the
	// case a text list handles worst.
	assert.equal(directionFromName('Slide In Left'), 'left');
	assert.equal(directionFromName('Slide In Right'), 'right');
	assert.equal(directionFromName('slideInUp'), 'up');
	assert.equal(directionFromName('slideInDown'), 'down');
});

test('a motion with no direction reports null rather than guessing', () => {
	assert.equal(directionFromName('Fade In'), null);
	assert.equal(directionFromName('zoomIn'), null);
	assert.equal(directionFromName(null), null);
});

// ── previewSpec ──────────────────────────────────────────────────────────

test('previewSpec prefers the category over the name when both exist', () => {
	// The catalog category is authoritative; the name guess is the fallback.
	const spec = previewSpec({ value: 'fadeThroughWipe', label: 'Fade Through', category: 'wipe' });
	assert.equal(spec.family, 'wipe');
});

test('previewSpec reads family and direction together', () => {
	const spec = previewSpec({ value: 'slideInLeft', label: 'Slide In Left' });
	assert.equal(spec.family, 'slide');
	assert.equal(spec.direction, 'left');
	assert.equal(spec.reverse, false);
});

test('"out" is matched as a whole word, not a substring', () => {
	// /out$/ only catches fadeOut and misses every directional exit; a bare /out/
	// would call "outline" an exit.
	assert.equal(isExitMotion('slideOutLeft'), true);
	assert.equal(isExitMotion('fadeOut'), true);
	assert.equal(isExitMotion('Slide Out Right'), true);
	assert.equal(isExitMotion('slideInLeft'), false);
	assert.equal(isExitMotion('outlineGrow'), false, 'outline is not an exit');
});

test('an exit preset plays in reverse', () => {
	// One CSS animation per family, run backwards for the exit, instead of two
	// near-identical keyframe sets that can drift apart.
	assert.equal(previewSpec({ value: 'slideOutLeft', label: 'Slide Out Left' }).reverse, true);
	assert.equal(previewSpec({ value: 'fadeOut', label: 'Fade Out' }).reverse, true);
	assert.equal(previewSpec({ value: 'fadeIn', label: 'Fade In' }).reverse, false);
});

test('previewSpec survives an empty motion', () => {
	const spec = previewSpec({});
	assert.equal(spec.family, 'fade');
	assert.equal(spec.direction, null);
	assert.equal(spec.reverse, false);
});

// ── Grouping ─────────────────────────────────────────────────────────────

test('grouping preserves catalog order', () => {
	// transitions.js sorts the catalog plainest-first on purpose. Re-sorting here
	// (alphabetically, say) would open the picker on "Blur" or "Distort" and bury
	// the fade that most people want.
	const grouped = groupByCategory([
		{ value: 'a', category: 'fade' },
		{ value: 'b', category: 'wipe' },
		{ value: 'c', category: 'fade' },
		{ value: 'd', category: 'glitch' }
	]);
	assert.deepEqual(grouped.map((g) => g.category), ['fade', 'wipe', 'glitch']);
	assert.equal(grouped[0].options.length, 2, 'both fades land in one group');
});

test('options with no category collect under Other', () => {
	const grouped = groupByCategory([{ value: 'x' }]);
	assert.equal(grouped[0].category, 'other');
	assert.equal(grouped[0].label, 'Other');
});

test('grouping nothing is an empty list, not a crash', () => {
	assert.deepEqual(groupByCategory([]), []);
	assert.deepEqual(groupByCategory(null), []);
});

test('category labels are readable, not raw keys', () => {
	assert.equal(categoryLabel('geometric'), 'Shapes');
	assert.equal(categoryLabel('stylized'), 'Stylised');
	assert.equal(categoryLabel('fade'), 'Fade');
	assert.equal(categoryLabel('somethingNew'), 'SomethingNew');
});

// ── Search ───────────────────────────────────────────────────────────────

test('search ignores case, spaces and separators', () => {
	// The user reads "Butterfly Wave Scrawler" and the value is
	// "butterflyWaveScrawler"; typing what they see has to find it.
	const options = [
		{ value: 'butterflyWaveScrawler', label: 'Butterfly Wave Scrawler' },
		{ value: 'fade', label: 'Fade' }
	];
	assert.equal(filterMotions(options, 'wave scrawl').length, 1);
	assert.equal(filterMotions(options, 'WAVESCRAWL').length, 1);
	assert.equal(filterMotions(options, 'butterfly-wave').length, 1);
});

test('search matches the value as well as the label', () => {
	const options = [{ value: 'circleCrop', label: 'Iris' }];
	assert.equal(filterMotions(options, 'circle').length, 1, 'by value');
	assert.equal(filterMotions(options, 'iris').length, 1, 'by label');
});

test('an empty query returns everything, unfiltered', () => {
	const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }];
	assert.equal(filterMotions(options, '').length, 2);
	assert.equal(filterMotions(options, null).length, 2);
	assert.equal(filterMotions(options, '   ').length, 2, 'whitespace is not a query');
});

test('a query matching nothing returns nothing', () => {
	assert.deepEqual(filterMotions([{ value: 'a', label: 'A' }], 'zzz'), []);
});
