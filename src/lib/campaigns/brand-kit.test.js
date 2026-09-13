import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
	contrastOnWhite,
	formatRatio,
	passesAA,
	darkenToPass,
	countChanges,
	specimenHtml,
	parseHex,
	toHex,
	pinnedApprovedEditions,
	sameLogo,
	CONTRAST_AA
} from './brand-kit.js';

/**
 * The page PRINTS these numbers next to a buyer's own brand colour, so a wrong
 * one is not a rounding bug — it is the tool telling someone their identity is
 * unreadable when it is not, or the reverse.
 *
 * THESE DELIBERATELY DO NOT MATCH THE BOARD. D11 shows 10.9 : 1, 19.3 : 1 and
 * 2.4 : 1 for the three swatches; the true WCAG ratios are 11.3, 18.9 and 2.2,
 * confirmed against an independent implementation. The board's figures are
 * illustrative — a designer writing plausible numbers into a mock — and the
 * whole reason this screen prints a ratio instead of a verdict is that a ratio
 * is checkable. Shipping the mock's digits would have shipped a number that
 * fails the check it exists to invite.
 *
 * The CLASSIFICATION is unchanged either way: Brand and Ink pass, Accent
 * fails, exactly as the board shows. Only the digits move.
 */
describe('contrast against white', () => {
	test('computes true WCAG ratios, not the board\'s illustrative ones', () => {
		assert.equal(contrastOnWhite('#1B3A6B'), 11.3);
		assert.equal(contrastOnWhite('#111111'), 18.9);
		assert.equal(contrastOnWhite('#7FB3E6'), 2.2);
	});

	test('and still classifies each swatch the way the board does', () => {
		assert.equal(passesAA('#1B3A6B'), true);
		assert.equal(passesAA('#111111'), true);
		assert.equal(passesAA('#7FB3E6'), false);
	});

	test('black and white are the two extremes', () => {
		assert.equal(contrastOnWhite('#000000'), 21);
		assert.equal(contrastOnWhite('#FFFFFF'), 1);
	});

	test('short hex and a missing hash are the same colour', () => {
		assert.equal(contrastOnWhite('#fff'), contrastOnWhite('#FFFFFF'));
		assert.equal(contrastOnWhite('111111'), contrastOnWhite('#111111'));
	});

	test('a non-colour gets no ratio rather than a made-up one', () => {
		for (const bad of ['', null, undefined, 'rebeccapurple', '#12', '#GGGGGG']) {
			assert.equal(contrastOnWhite(bad), null);
			assert.equal(formatRatio(contrastOnWhite(bad)), null);
		}
	});

	test('formats the way the board prints it', () => {
		assert.equal(formatRatio(10.9), '10.9 : 1');
		assert.equal(formatRatio(21), '21.0 : 1');
	});

	test('passes at exactly AA, not just above it', () => {
		// The boundary is the whole point of a threshold.
		assert.equal(passesAA('#767676'), contrastOnWhite('#767676') >= CONTRAST_AA);
		assert.equal(passesAA('#1B3A6B'), true);
		assert.equal(passesAA('#7FB3E6'), false);
	});

	test('uses gamma-expanded luminance, not a flat average', () => {
		/*
		 * Guards against someone reusing $lib/video/inline-text.js's perceptual
		 * luminance here. That one is a flat sRGB average for picking a readable
		 * backdrop by eye; this one feeds a printed number. For pure blue the
		 * flat average gives 0.0722, which would print 12.1 : 1 — a colour most
		 * people would call borderline reported as excellent.
		 */
		assert.equal(contrastOnWhite('#0000FF'), 8.6);
	});
});

describe('darken to pass', () => {
	test('leaves a colour that already passes alone', () => {
		assert.equal(darkenToPass('#1B3A6B'), '#1B3A6B');
	});

	test('nudges a failing colour until it passes, and no further', () => {
		const out = darkenToPass('#7FB3E6');
		assert.ok(passesAA(out), `${out} should pass`);
		// "No further" is the property that keeps it recognisable: one step
		// lighter must still fail.
		const rgb = parseHex(out);
		const lighter = toHex({ r: rgb.r / 0.98, g: rgb.g / 0.98, b: rgb.b / 0.98 });
		assert.equal(passesAA(lighter), false, `${lighter} should still fail`);
	});

	test('keeps the hue recognisable rather than jumping to black', () => {
		const out = parseHex(darkenToPass('#7FB3E6'));
		// The original is blue-dominant; the result must still be.
		assert.ok(out.b > out.g && out.g > out.r, `expected a blue, got ${JSON.stringify(out)}`);
		assert.ok(out.b > 40, 'should not have collapsed to near-black');
	});

	test('white can be darkened; a non-colour cannot', () => {
		assert.ok(passesAA(darkenToPass('#FFFFFF')));
		assert.equal(darkenToPass('nope'), null);
	});
});

describe('counting unsaved changes', () => {
	const saved = {
		logos: [{ kind: 'mark', assetUid: 'a1' }],
		colours: [
			{ role: 'Brand', hex: '#1B3A6B' },
			{ role: 'Ink', hex: '#111111' }
		],
		fonts: { headings: { family: 'Inter' }, body: { family: 'Inter' } },
		voice: { tones: ['Warm'], rule: 'Say workflows.' }
	};
	const clone = () => JSON.parse(JSON.stringify(saved));

	test('an untouched kit has no changes', () => {
		assert.equal(countChanges(saved, clone()), 0);
	});

	test('a recoloured role is one change, not a remove plus an add', () => {
		const draft = clone();
		draft.colours[0].hex = '#0A2040';
		assert.equal(countChanges(saved, draft), 1);
	});

	test('hex comparison ignores case', () => {
		const draft = clone();
		draft.colours[0].hex = '#1b3a6b';
		assert.equal(countChanges(saved, draft), 0);
	});

	test('adding a colour, a font and a tone counts three', () => {
		const draft = clone();
		draft.colours.push({ role: 'Accent', hex: '#7FB3E6' });
		draft.fonts.headings = { family: 'Fraunces' };
		draft.voice.tones = ['Warm', 'Formal'];
		assert.equal(countChanges(saved, draft), 3);
	});

	test('swapping a logo counts the removal and the addition', () => {
		const draft = clone();
		draft.logos = [{ kind: 'mark', assetUid: 'a2' }];
		assert.equal(countChanges(saved, draft), 2);
	});

	test('editing the voice rule counts once', () => {
		const draft = clone();
		draft.voice.rule = 'Never say user.';
		assert.equal(countChanges(saved, draft), 1);
	});
});

describe('the specimen', () => {
	const kit = {
		logos: [],
		colours: [
			{ role: 'Brand', hex: '#1B3A6B' },
			{ role: 'Ink', hex: '#111111' },
			{ role: 'Wash', hex: '#F4F6F8' }
		],
		fonts: { headings: { family: 'Fraunces' }, body: { family: 'Inter' } },
		voice: { tones: [], rule: '' }
	};

	test('renders the kit colours and fonts', () => {
		const html = specimenHtml(kit);
		assert.ok(html.includes('#1B3A6B'));
		assert.ok(html.includes('#F4F6F8'));
		assert.ok(html.includes("'Fraunces'"));
	});

	test('leaves the sample tokens for CardPreview to substitute', () => {
		const html = specimenHtml(kit);
		for (const token of ['{{brand_name}}', '{{account_name}}', '{{metric_1}}', '{{period}}']) {
			assert.ok(html.includes(token), `missing ${token}`);
		}
	});

	test('an empty kit still renders rather than producing broken CSS', () => {
		const html = specimenHtml({});
		assert.ok(html.includes('#1B3A6B'), 'falls back to a default brand colour');
		assert.ok(!html.includes('undefined'));
		assert.ok(!html.includes('null'));
	});

	test('a logo name cannot break out of the attribute it sits in', () => {
		// The URL comes back from detection on a third-party site.
		const html = specimenHtml({
			logos: [{ kind: 'mark', url: '"><script>alert(1)</script>' }]
		});
		assert.ok(!html.includes('<script>'));
		assert.ok(html.includes('&quot;&gt;&lt;script&gt;'));
	});
});

describe('what a removal would strand', () => {
	const mark = { kind: 'mark', assetUid: 'a1' };
	const savedKit = { logos: [mark] };
	const approved = { editionUid: 'e1', name: 'September value card', state: 'approved', brandRevision: 3 };
	const draftEdition = { editionUid: 'e2', name: 'Quarter one-pager', state: 'draft', brandRevision: 3 };

	test('names the approved editions rather than returning a boolean', () => {
		// The dialog lists them: "used by 2 editions" is not enough to decide with.
		const out = pinnedApprovedEditions(savedKit, [approved, draftEdition], mark);
		assert.deepEqual(out, [approved]);
	});

	test('a draft edition strands nothing — it picks up the next revision', () => {
		assert.deepEqual(pinnedApprovedEditions(savedKit, [draftEdition], mark), []);
	});

	test('a logo that is only in the draft strands nothing, even with approvals', () => {
		/*
		 * The case that would produce a typed confirmation for undoing an unsaved
		 * change — ceremony over nothing, and it would imply a permanence that
		 * has not happened.
		 */
		const justAdded = { kind: 'wordmark', assetUid: 'a2' };
		assert.deepEqual(pinnedApprovedEditions(savedKit, [approved], justAdded), []);
	});

	test('a replaced file in the same slot is a different asset', () => {
		const swapped = { kind: 'mark', assetUid: 'a9' };
		assert.deepEqual(pinnedApprovedEditions(savedKit, [approved], swapped), []);
	});

	test('nothing to remove, nothing to strand', () => {
		assert.deepEqual(pinnedApprovedEditions(savedKit, [approved], null), []);
		assert.deepEqual(pinnedApprovedEditions(null, [approved], mark), []);
		assert.deepEqual(pinnedApprovedEditions(savedKit, null, mark), []);
	});

	test('sameLogo matches on slot and file, not object identity', () => {
		assert.equal(sameLogo(mark, { kind: 'mark', assetUid: 'a1' }), true);
		assert.equal(sameLogo(mark, { kind: 'wordmark', assetUid: 'a1' }), false);
		assert.equal(sameLogo(mark, { kind: 'mark', assetUid: 'a2' }), false);
		assert.equal(sameLogo(mark, null), false);
	});

	test('falls back to the filename when there is no asset uid yet', () => {
		// A just-detected logo has a URL and a name but no stored uid.
		const detected = { kind: 'mark', name: 'northwind-mark.svg' };
		assert.equal(sameLogo(detected, { kind: 'mark', name: 'northwind-mark.svg' }), true);
	});
});
