/**
 * Tests for inline canvas text editing.
 * Run: node --test src/lib/video/inline-text.test.js
 *
 * Covers the pure mapping only. screenRect talks to a live Pixi engine, so it is
 * verified in a browser instead — see the module header in inline-text.js for
 * what was measured there, including two designs that were tried and rejected.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	isInlineEditable,
	weightFromFontName,
	isItalicFontName,
	overlayTypography,
	textPatch,
	screenRect,
	luminance,
	overlayBackdrop,
	INLINE_EDITABLE_TYPES
} from './inline-text.js';

const textClip = (overrides = {}) => ({
	id: 'c1',
	type: 'Text',
	text: 'Hello',
	transform: { x: 100, y: 200, width: 600, height: 160 },
	style: { fontSize: 120, fontFamily: 'Inter-Bold', color: '#ffffff', align: 'center' },
	...overrides
});

// ── Eligibility ──────────────────────────────────────────────────────────

test('only the clip types the engine fires dblclick for are editable', () => {
	// The engine gates clip:dblclick to Text and Caption. Offering inline edit
	// on anything else would be a control that can never open.
	assert.equal(isInlineEditable(textClip()), true);
	assert.equal(isInlineEditable(textClip({ type: 'Caption' })), true);
	assert.equal(isInlineEditable(textClip({ type: 'Image' })), false);
	assert.equal(isInlineEditable(textClip({ type: 'Shape' })), false);
	assert.deepEqual(INLINE_EDITABLE_TYPES, ['Text', 'Caption']);
});

test('a locked clip is not editable', () => {
	assert.equal(isInlineEditable(textClip({ locked: true })), false);
});

test('a missing clip is not editable rather than a crash', () => {
	assert.equal(isInlineEditable(null), false);
	assert.equal(isInlineEditable(undefined), false);
});

// ── Font weight ──────────────────────────────────────────────────────────

test('compound weight names beat the substring they contain', () => {
	// "ExtraBold" and "SemiBold" both contain "Bold". A naive scan returns 700
	// for all three, which renders a semibold heading too heavy.
	assert.equal(weightFromFontName('Inter-Bold'), 700);
	assert.equal(weightFromFontName('Inter-SemiBold'), 600);
	assert.equal(weightFromFontName('Inter-ExtraBold'), 800);
	assert.equal(weightFromFontName('Inter-UltraBold'), 800);
	assert.equal(weightFromFontName('Inter-DemiBold'), 600);
});

test('light weights do not collide either', () => {
	assert.equal(weightFromFontName('Inter-Light'), 300);
	assert.equal(weightFromFontName('Inter-ExtraLight'), 200);
	assert.equal(weightFromFontName('Inter-UltraLight'), 200);
	assert.equal(weightFromFontName('Inter-Thin'), 100);
});

test('weight reading is insensitive to spaces, dashes and case', () => {
	assert.equal(weightFromFontName('DM Sans Bold'), 700);
	assert.equal(weightFromFontName('dm_sans_bold'), 700);
	assert.equal(weightFromFontName('DMSans-Bold'), 700);
	assert.equal(weightFromFontName('DM Sans SemiBold'), 600);
});

test('the full range of named weights maps', () => {
	assert.equal(weightFromFontName('Inter-Regular'), 400);
	assert.equal(weightFromFontName('Inter-Book'), 400);
	assert.equal(weightFromFontName('Inter-Medium'), 500);
	assert.equal(weightFromFontName('Inter-Black'), 900);
	assert.equal(weightFromFontName('Inter-Heavy'), 900);
});

test('an unknown face falls back to regular, not to bold', () => {
	assert.equal(weightFromFontName('Wingdings'), 400);
	assert.equal(weightFromFontName(''), 400);
	assert.equal(weightFromFontName(null), 400);
});

test('italic and oblique are both italic', () => {
	assert.equal(isItalicFontName('Inter-Italic'), true);
	assert.equal(isItalicFontName('Inter Oblique'), true);
	assert.equal(isItalicFontName('Inter-Bold'), false);
	assert.equal(isItalicFontName(null), false);
});

// ── Typography mapping ───────────────────────────────────────────────────

test('font size is scaled from composition space to CSS pixels', () => {
	// A 120px heading in a 1080-wide composition shown at 0.3359 fit scale is
	// ~40 CSS px. Unscaled, the overlay would be three times too big.
	const css = overlayTypography(textClip(), 0.3359, null);
	assert.equal(css.fontSize, `${120 * 0.3359}px`);
});

test('the PostScript name becomes a real CSS family plus a weight', () => {
	// "Inter-Bold" is not a CSS family — the document has "Inter" loaded.
	const css = overlayTypography(textClip(), 1, { family: 'Inter', fullName: 'Inter Bold' });
	assert.match(css.fontFamily, /^"Inter"/);
	assert.equal(css.fontWeight, '700');
});

test('an unresolved font still yields a usable stack', () => {
	const css = overlayTypography(textClip({ style: { fontFamily: 'Whatever-Medium' } }), 1, null);
	assert.match(css.fontFamily, /^"Whatever-Medium"/);
	assert.match(css.fontFamily, /sans-serif$/, 'must end in a generic fallback');
	assert.equal(css.fontWeight, '500');
});

test('an explicit numeric weight on the clip wins over the face name', () => {
	const clip = textClip({ style: { fontFamily: 'Inter-Bold', fontWeight: 300 } });
	assert.equal(overlayTypography(clip, 1, { family: 'Inter', fullName: 'Inter Bold' }).fontWeight, '300');
});

test("fontWeight: 'normal' does NOT override the face", () => {
	// Every text preset in this repo ships fontWeight: 'normal' alongside a
	// weighted PostScript name, so treating it as an override would flatten
	// every heading to 400.
	const clip = textClip({ style: { fontFamily: 'Inter-Bold', fontWeight: 'normal' } });
	assert.equal(overlayTypography(clip, 1, { family: 'Inter', fullName: 'Inter Bold' }).fontWeight, '700');
});

test('colour comes from style.color, falling back to style.fill', () => {
	// Text clips carry style.color; an earlier bug in this project came from one
	// path writing style.color while another read style.fill.
	assert.equal(overlayTypography(textClip(), 1, null).color, '#ffffff');
	assert.equal(
		overlayTypography(textClip({ style: { fill: '#ff0000' } }), 1, null).color,
		'#ff0000'
	);
	assert.equal(
		overlayTypography(textClip({ style: { color: '#00ff00', fill: '#ff0000' } }), 1, null).color,
		'#00ff00',
		'color wins when both are present'
	);
});

test('alignment reads either field name the engine accepts', () => {
	assert.equal(overlayTypography(textClip({ style: { align: 'left' } }), 1, null).textAlign, 'left');
	assert.equal(
		overlayTypography(textClip({ style: { textAlign: 'right' } }), 1, null).textAlign,
		'right'
	);
	assert.equal(overlayTypography(textClip({ style: {} }), 1, null).textAlign, 'center');
});

test('line height and letter spacing scale, and are unset by default', () => {
	const bare = overlayTypography(textClip(), 0.5, null);
	assert.equal(bare.lineHeight, '1.2');
	assert.equal(bare.letterSpacing, 'normal');
	const set = overlayTypography(textClip({ style: { lineHeight: 100, letterSpacing: 8 } }), 0.5, null);
	assert.equal(set.lineHeight, '50px');
	assert.equal(set.letterSpacing, '4px');
});

test('font size never collapses to zero at extreme zoom-out', () => {
	// A textarea at font-size 0 swallows the caret, so the user sees nothing.
	assert.equal(overlayTypography(textClip(), 0, null).fontSize, '1px');
});

// ── Commit ───────────────────────────────────────────────────────────────

test('an unchanged edit produces no patch', () => {
	// Writing an identical value would still push an undo entry, so opening and
	// closing the editor without typing would quietly cost the user an undo.
	assert.equal(textPatch(textClip(), 'Hello'), null);
});

test('a changed edit patches only the text field', () => {
	assert.deepEqual(textPatch(textClip(), 'Goodbye'), { text: 'Goodbye' });
});

test('clearing the text is a real change, not a no-op', () => {
	assert.deepEqual(textPatch(textClip(), ''), { text: '' });
});

test('multi-line text survives the patch verbatim', () => {
	assert.deepEqual(textPatch(textClip(), 'one\ntwo'), { text: 'one\ntwo' });
});

test('a clip with no text at all treats empty as unchanged', () => {
	assert.equal(textPatch({ id: 'x' }, ''), null);
	assert.deepEqual(textPatch({ id: 'x' }, 'new'), { text: 'new' });
});

// ── Backdrop ─────────────────────────────────────────────────────────────
// The clip's own text stays rendered under the overlay (the engine reasserts
// sprite visibility on every publish), so the overlay masks it. The backdrop
// has to contrast with the TEXT, not with the app chrome.

test('luminance uses sRGB coefficients, not a flat average', () => {
	// A flat average puts pure blue at 0.33 and pure green at 0.33, so both would
	// get the same backdrop. Green reads far brighter than blue.
	assert.ok(luminance('#00ff00') > 0.7, 'green is bright');
	assert.ok(luminance('#0000ff') < 0.1, 'blue is dark');
	assert.equal(luminance('#000000'), 0);
	assert.equal(luminance('#ffffff'), 1);
});

test('luminance accepts short hex and a missing hash', () => {
	assert.equal(luminance('#fff'), 1);
	assert.equal(luminance('fff'), 1);
	assert.equal(luminance('#000'), 0);
});

test('an unparseable colour reads as dark, so the backdrop is light', () => {
	// Failing toward a light backdrop is the safer default: the engine's own text
	// default is white, and white-on-light is at least visible as a smudge,
	// whereas a wrong dark backdrop under dark text shows nothing at all.
	assert.equal(luminance('rebeccapurple'), 0);
	assert.equal(luminance(''), 0);
	assert.equal(luminance(null), 0);
});

test('light text gets a dark backdrop and dark text a light one', () => {
	assert.match(overlayBackdrop('#ffffff'), /^rgba\(9, 9, 11/);
	assert.match(overlayBackdrop('#000000'), /^rgba\(250, 250, 250/);
});

test('the backdrop is near-opaque, because it has to hide real glyphs', () => {
	// A subtle tint would leave the old text legible underneath and the canvas
	// would read as doubled text — the exact bug this replaced.
	for (const color of ['#ffffff', '#000000']) {
		const alpha = Number(overlayBackdrop(color).match(/([0-9.]+)\)$/)[1]);
		assert.ok(alpha > 0.9, `alpha ${alpha} is too transparent to mask`);
	}
});

// ── Engine-facing guards ─────────────────────────────────────────────────
// The happy paths need a live Pixi artboard; these pin the failure modes, so a
// missing engine degrades instead of throwing inside a render.

test('screenRect returns null rather than throwing without an artboard', () => {
	assert.equal(screenRect(null, textClip()), null);
	assert.equal(screenRect({}, textClip()), null);
	assert.equal(screenRect({ artboard: {} }, textClip()), null, 'artboard with no toGlobal');
	assert.equal(screenRect({ artboard: { toGlobal: () => ({}) } }, null), null);
});

test('screenRect maps corners through toGlobal and reports the scale', () => {
	const studio = {
		artboard: {
			toGlobal: ({ x, y }) => ({ x: 317 + x * 0.3359, y: 20 + y * 0.3359 }),
			worldTransform: { a: 0.3359 }
		}
	};
	const rect = screenRect(studio, textClip());
	assert.equal(Math.round(rect.left), Math.round(317 + 100 * 0.3359));
	assert.equal(Math.round(rect.top), Math.round(20 + 200 * 0.3359));
	assert.equal(Math.round(rect.width), Math.round(600 * 0.3359));
	assert.equal(rect.scale, 0.3359);
});

test('screenRect keeps a zero-size clip at least one pixel', () => {
	const studio = {
		artboard: { toGlobal: ({ x, y }) => ({ x, y }), worldTransform: { a: 1 } }
	};
	const rect = screenRect(studio, textClip({ transform: { x: 0, y: 0, width: 0, height: 0 } }));
	assert.equal(rect.width, 1);
	assert.equal(rect.height, 1);
});
