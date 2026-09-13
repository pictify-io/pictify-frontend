/**
 * The brand kit's arithmetic. FE-20 (boards D11 / D11a / D11b).
 *
 * Everything here is pure so it can be tested without a browser: the contrast
 * ratios the page prints beside every swatch, the nudge behind "Darken to
 * pass", and the specimen markup the live card renders from.
 *
 * WHY A CONTRAST RATIO AND NOT A JUDGEMENT. The page states "10.9 : 1" rather
 * than "good", for the same reason the reviewer's rail counts accounts rather
 * than scoring them: a ratio is checkable and a verdict is not. The threshold
 * is WCAG AA for normal text (4.5 : 1); below it the swatch takes an alarm
 * square and the AI is told not to put words on that colour, and NOTHING is
 * blocked — a brand is what it is, and refusing to save a real brand colour
 * because it is pale would be the tool overruling the buyer about their own
 * identity.
 */

/** WCAG AA for normal text. Below this, words on that colour are hard to read. */
export const CONTRAST_AA = 4.5;

/** The four roles a kit always has. Extra roles are appended by the buyer. */
export const DEFAULT_ROLES = ['Brand', 'Ink', 'Wash', 'Accent'];

/**
 * `Wash` is a background, so a text-contrast ratio against white says nothing
 * useful about it — the board prints BACKGROUND in its place.
 */
export const BACKGROUND_ROLE = 'Wash';

/* --------------------------------------------------------------- colour */

/** `#abc` / `#aabbcc` → `{ r, g, b }` 0-255, or null when it is not a colour. */
export function parseHex(hex) {
	const raw = String(hex || '')
		.trim()
		.replace(/^#/, '');
	const full = raw.length === 3
		? raw
				.split('')
				.map((c) => c + c)
				.join('')
		: raw;
	if (!/^[0-9a-f]{6}$/i.test(full)) return null;
	const n = parseInt(full, 16);
	return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function toHex({ r, g, b }) {
	const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
	return `#${[clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/**
 * WCAG relative luminance — gamma-expanded, NOT the flat perceptual average in
 * `$lib/video/inline-text.js`.
 *
 * They are different functions for different jobs and must not be shared: that
 * one picks a readable backdrop by eye, this one feeds a ratio the page prints
 * as a number. Using the perceptual version here would put a wrong figure next
 * to a swatch, which is worse than printing nothing.
 */
export function relativeLuminance(hex) {
	const rgb = parseHex(hex);
	if (!rgb) return null;
	const channel = (v) => {
		const s = v / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/**
 * Contrast ratio against white, to one decimal place — the figure on the tag.
 *
 * Returns null for anything that is not a colour rather than a made-up number,
 * so the caller shows no tag instead of a confident "1.0 : 1".
 */
export function contrastOnWhite(hex) {
	const l = relativeLuminance(hex);
	if (l === null) return null;
	// White's luminance is 1, so the lighter term is always 1.
	return Math.round(((1 + 0.05) / (l + 0.05)) * 10) / 10;
}

/** "10.9 : 1", spaced as the board prints it. */
export const formatRatio = (ratio) => (ratio === null ? null : `${ratio.toFixed(1)} : 1`);

export const passesAA = (hex) => {
	const ratio = contrastOnWhite(hex);
	return ratio !== null && ratio >= CONTRAST_AA;
};

/**
 * Darken a colour until it passes AA on white.
 *
 * Scales the channels toward black in small steps rather than jumping to a
 * computed target, because the buyer is meant to recognise the result as their
 * colour: the hue and the relationship between channels are preserved, and the
 * loop stops at the FIRST passing shade rather than the safest one. A nudge,
 * not a replacement.
 *
 * Returns the original when it already passes, and null when it never can
 * (only pure black reaches AA from some starting points — the caller then
 * leaves the colour alone rather than silently setting it to #000000).
 */
export function darkenToPass(hex, target = CONTRAST_AA) {
	const rgb = parseHex(hex);
	if (!rgb) return null;
	if ((contrastOnWhite(hex) ?? 0) >= target) return toHex(rgb);

	let { r, g, b } = rgb;
	// 200 steps of 2% is enough to reach near-black from any starting colour,
	// and bounded so a pathological input cannot spin.
	for (let i = 0; i < 200; i++) {
		r *= 0.98;
		g *= 0.98;
		b *= 0.98;
		const next = toHex({ r, g, b });
		if ((contrastOnWhite(next) ?? 0) >= target) return next;
	}
	return null;
}

/* ------------------------------------------------------------------ kit */

/** An empty kit — what "Start blank" produces. Never persisted until saved. */
export const emptyKit = () => ({
	logos: [],
	colours: [],
	fonts: { headings: null, body: null },
	voice: { tones: [], rule: '' }
});

/** The tone chips offered. Two at most may be selected (locked decision). */
export const TONE_CHIPS = ['Warm', 'Plain words', 'Formal', 'Playful', 'Technical'];
export const MAX_TONES = 2;

/**
 * How many fields differ from the saved revision — the number in "3 changes
 * since rev 3 · not saved".
 *
 * Counts FIELDS a buyer would recognise as edits, not JSON nodes: swapping a
 * logo is one change, not "assetUid, filename, bytes and kind". A count that
 * did not match what the buyer remembers doing would make the whole foot line
 * untrustworthy.
 */
export function countChanges(saved, draft) {
	if (!saved || !draft) return 0;
	let n = 0;

	const logoKey = (l) => `${l.kind}:${l.assetUid || l.name}`;
	const savedLogos = (saved.logos || []).map(logoKey).sort();
	const draftLogos = (draft.logos || []).map(logoKey).sort();
	if (savedLogos.join('|') !== draftLogos.join('|')) {
		// One change per logo added, removed or swapped.
		const a = new Set(savedLogos);
		const b = new Set(draftLogos);
		n += [...a].filter((k) => !b.has(k)).length + [...b].filter((k) => !a.has(k)).length;
	}

	const colourKey = (c) => `${c.role}:${String(c.hex || '').toUpperCase()}`;
	const savedColours = (saved.colours || []).map(colourKey).sort();
	const draftColours = (draft.colours || []).map(colourKey).sort();
	if (savedColours.join('|') !== draftColours.join('|')) {
		const a = new Set(savedColours);
		const b = new Set(draftColours);
		// A recoloured role reads as one change, not a remove plus an add.
		const roles = new Set([
			...(saved.colours || []).map((c) => c.role),
			...(draft.colours || []).map((c) => c.role)
		]);
		for (const role of roles) {
			const before = (saved.colours || []).find((c) => c.role === role);
			const after = (draft.colours || []).find((c) => c.role === role);
			if (String(before?.hex || '').toUpperCase() !== String(after?.hex || '').toUpperCase()) n++;
		}
		void a;
		void b;
	}

	for (const slot of ['headings', 'body']) {
		if ((saved.fonts?.[slot]?.family || null) !== (draft.fonts?.[slot]?.family || null)) n++;
	}

	const savedTones = [...(saved.voice?.tones || [])].sort().join('|');
	const draftTones = [...(draft.voice?.tones || [])].sort().join('|');
	if (savedTones !== draftTones) n++;
	if ((saved.voice?.rule || '') !== (draft.voice?.rule || '')) n++;

	return n;
}

/** Two logos are the same asset when they fill the same slot with the same file. */
export const sameLogo = (a, b) =>
	!!a && !!b && a.kind === b.kind && (a.assetUid || a.name) === (b.assetUid || b.name);

/**
 * The approved editions that would be pinned to a logo if it were removed.
 *
 * TWO CONDITIONS, and dropping either one produces a wrong prompt:
 *
 *   IT MUST BE IN THE SAVED KIT. A logo added to the draft a minute ago cannot
 *   be inside an edition approved last week, so asking for a typed
 *   confirmation to undo an unsaved change is ceremony over nothing — and
 *   worse, it implies a permanence that has not happened yet.
 *   THE EDITION MUST BE APPROVED. `usedBy` lists every edition on the current
 *   brand revision, drafts included. A draft picks up the next revision when
 *   it next opens, so removing something from under it costs nobody anything;
 *   an approved edition is the one that has been signed off against these
 *   exact bytes.
 *
 * Returns the editions rather than a boolean because the dialog names them:
 * "used by 2 editions" is not enough information to decide with.
 */
export function pinnedApprovedEditions(savedKit, usedBy, logo) {
	if (!logo) return [];
	const inSaved = (savedKit?.logos || []).some((l) => sameLogo(l, logo));
	if (!inSaved) return [];
	return (usedBy || []).filter((u) => u?.state === 'approved');
}

/** The colour for a role, or a sensible fallback so the specimen always renders. */
export const roleColour = (kit, role, fallback) =>
	(kit?.colours || []).find((c) => c.role === role)?.hex || fallback;

/**
 * The specimen: the standard value card, re-rendered from the kit.
 *
 * Deliberately the SAME SHAPE as the shipped card preset rather than a
 * decorative swatch board — the promise on this screen is "here is what your
 * customers get", and a preview that is not the real layout cannot keep it.
 * Sample values come from `starters.SAMPLE_VALUES` through CardPreview, so the
 * tokens here are the tokens the preset uses.
 *
 * Fonts are named but not loaded: an uploaded face is embedded at render time
 * on the server, and pulling a webfont into the dashboard to preview it would
 * fetch from a host the buyer did not choose. The family name falls through to
 * the stack, which is honest — the specimen says which font is set, and the
 * server render is where it becomes literal.
 */
export function specimenHtml(kit) {
	const brand = roleColour(kit, 'Brand', '#1B3A6B');
	const ink = roleColour(kit, 'Ink', '#111111');
	const wash = roleColour(kit, 'Wash', '#FFFFFF');
	const headings = kit?.fonts?.headings?.family || 'Inter';
	const body = kit?.fonts?.body?.family || 'Inter';
	const mark = (kit?.logos || []).find((l) => l.kind === 'mark');
	// A detected logo URL comes off a third-party homepage, and every use below
	// is inside an attribute or a style value. `>` is escaped too — not required
	// inside a quoted attribute, but free, and it means one reviewer fewer has
	// to reason about which context each interpolation lands in.
	const esc = (s) =>
		String(s || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');

	const markBlock = mark?.url
		? `<img src="${esc(mark.url)}" alt="" style="width:34px;height:34px;object-fit:contain;border-radius:6px" />`
		: `<div style="width:34px;height:34px;border-radius:6px;background:${esc(brand)}"></div>`;

	return `<div style="width:1200px;height:800px;background:${esc(wash)};font-family:'${esc(body)}',Inter,system-ui,sans-serif;box-sizing:border-box">
  <div style="height:14px;background:${esc(brand)}"></div>
  <div style="padding:56px 64px;display:flex;flex-direction:column;gap:44px;height:786px;box-sizing:border-box;justify-content:space-between">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:14px">
        ${markBlock}
        <div style="font-family:'${esc(headings)}',Inter,system-ui,sans-serif;font-weight:700;font-size:26px;color:${esc(brand)}">{{brand_name}}</div>
      </div>
      <div style="font-size:20px;color:#5B5F66">{{period}}</div>
    </div>
    <div>
      <div style="font-size:22px;color:#383A42;margin-bottom:6px">Your month with {{brand_name}}</div>
      <div style="font-family:'${esc(headings)}',Inter,system-ui,sans-serif;font-weight:700;font-size:54px;letter-spacing:-0.02em;color:${esc(ink)}">{{account_name}}</div>
    </div>
    <div style="display:flex;gap:64px">
      <div>
        <div style="font-family:'${esc(headings)}',Inter,system-ui,sans-serif;font-weight:700;font-size:82px;letter-spacing:-0.03em;line-height:88px;color:${esc(ink)}">{{metric_1}}</div>
        <div style="font-size:22px;color:#383A42">{{metric_1_label}}</div>
      </div>
      <div>
        <div style="font-family:'${esc(headings)}',Inter,system-ui,sans-serif;font-weight:700;font-size:82px;letter-spacing:-0.03em;line-height:88px;color:${esc(ink)}">{{metric_2}}</div>
        <div style="font-size:22px;color:#383A42">{{metric_2_label}}</div>
      </div>
    </div>
    <div style="font-size:22px;color:#383A42">Thank you for building with us this month.</div>
  </div>
</div>`;
}
