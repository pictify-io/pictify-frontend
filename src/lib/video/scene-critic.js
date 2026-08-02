/**
 * Deterministic checks over a finished scene, for the copilot's review phase.
 *
 * The review phase exists because an agent that never looks at its output
 * ships a video with two seconds of black at the end. But the LOOKING must not
 * be the model grading itself — a model asked "is your work good?" says yes.
 * So the browser runs these checks and hands the model a list of findings; the
 * model's job is only to decide the fix.
 *
 * Every finding is a sentence with the clip id in it, because the fix comes
 * back as tool calls that address clips by id. A finding the model cannot act
 * on ("the pacing feels off") is worse than none: it invites a redesign of a
 * scene the user may already like.
 *
 * All checks read the LIVE document (pixels and microseconds), not the
 * fraction-based description the model sees — these are the ground truth
 * numbers, and the µs/ms conversions live in the callers that patch things.
 */

const SECOND = 1_000_000;

/** Real problems first: the list is capped, and a cut-off clip matters more than a small font. */
const MAX_FINDINGS = 12;

const secs = (us) => Math.round((us / SECOND) * 10) / 10;

const clipLabel = (clip) =>
	`${clip.type} "${(clip.name || clip.type || '').slice(0, 24)}" (id ${clip.id})`;

const display = (clip) => ({
	from: Number(clip?.timing?.display?.from) || 0,
	to: Number(clip?.timing?.display?.to) || 0
});

/** Clips that put pixels on screen. Audio is invisible; transitions blend neighbours. */
const isVisual = (clip) =>
	clip.type !== 'Audio' && clip.type !== 'Transition' && clip.type !== 'Effect';

/**
 * Does this clip fill (nearly) the whole frame? Backdrop coverage is what
 * decides whether a moment of the video shows content or the bare background.
 */
const isBackdrop = (clip, width, height) => {
	if (!isVisual(clip)) return false;
	const t = clip.transform || {};
	return (
		Number(t.width) >= width * 0.85 &&
		Number(t.height) >= height * 0.85 &&
		Number(t.x) <= width * 0.1 &&
		Number(t.y) <= height * 0.1
	);
};

/** Do two time windows overlap by more than a moment? */
const overlapsUs = (a, b) => Math.min(a.to, b.to) - Math.max(a.from, b.from) > 100_000;

/** Do two boxes overlap by more than ~a third of the smaller one? */
const boxesCollide = (a, b) => {
	const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
	const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
	if (w <= 0 || h <= 0) return false;
	const smaller = Math.min(a.width * a.height, b.width * b.height);
	return smaller > 0 && (w * h) / smaller > 0.35;
};

/**
 * Everything worth telling the reviewer about, most serious first.
 *
 * @param {object} projectJson - the live document (settings + clips map)
 * @returns {string[]}
 */
export const critiqueScene = (projectJson) => {
	const settings = projectJson?.settings || {};
	const width = Number(settings.width) || 1080;
	const height = Number(settings.height) || 1920;
	const durationUs = Number(settings.duration) || 0;
	const clips = Object.values(projectJson?.clips || {});
	const visuals = clips.filter(isVisual);

	const findings = [];

	if (!visuals.length) {
		return ['The scene has no visible clips at all.'];
	}

	// ── Timing against the scene duration ─────────────────────────────────
	const contentEndUs = Math.max(...clips.map((clip) => display(clip).to), 0);

	for (const clip of visuals) {
		const d = display(clip);
		if (durationUs > 0 && d.from >= durationUs) {
			findings.push(
				`${clipLabel(clip)} starts at ${secs(d.from)}s, after the scene ends at ${secs(durationUs)}s — it is never shown.`
			);
		} else if (durationUs > 0 && d.to > durationUs + 100_000) {
			findings.push(
				`${clipLabel(clip)} runs to ${secs(d.to)}s but the scene ends at ${secs(durationUs)}s — it gets cut off. Extend the scene duration or shorten the clip.`
			);
		}
	}

	if (durationUs > contentEndUs + 500_000) {
		findings.push(
			`The scene lasts ${secs(durationUs)}s but the last clip ends at ${secs(contentEndUs)}s — ${secs(durationUs - contentEndUs)}s of dead air at the end. Set the scene duration to ${secs(contentEndUs)}s or extend the content.`
		);
	}

	// ── Backdrop coverage ─────────────────────────────────────────────────
	// Only when the design clearly INTENDS full-frame visuals: a scene built
	// on a background colour with floating text is a legitimate style, and
	// flagging it would invite the reviewer to redesign it.
	const backdrops = visuals.filter((clip) => isBackdrop(clip, width, height));
	if (backdrops.length) {
		// Only up to where content actually ends: an empty tail past that is
		// already reported as dead air, and one problem should be one finding.
		const spanEnd = Math.min(durationUs || contentEndUs, contentEndUs);
		const edges = [
			0,
			...backdrops.flatMap((clip) => [display(clip).from, display(clip).to]),
			spanEnd
		]
			.filter((edge) => edge >= 0 && edge <= spanEnd)
			.sort((a, b) => a - b);
		for (let i = 0; i < edges.length - 1; i += 1) {
			const mid = (edges[i] + edges[i + 1]) / 2;
			const gap = edges[i + 1] - edges[i];
			const covered = backdrops.some((clip) => {
				const d = display(clip);
				return d.from <= mid && d.to >= mid;
			});
			if (!covered && gap > 750_000) {
				findings.push(
					`Nothing fills the frame between ${secs(edges[i])}s and ${secs(edges[i + 1])}s — the video shows a bare background there.`
				);
			}
		}
	}

	// ── Geometry ──────────────────────────────────────────────────────────
	for (const clip of visuals) {
		const t = clip.transform || {};
		if (!Number.isFinite(t.width)) continue;

		if (t.width <= 0 || t.height <= 0) {
			findings.push(`${clipLabel(clip)} has zero size — it renders nothing.`);
			continue;
		}

		if (clip.type === 'Text' || clip.type === 'Caption') {
			// The safe band matches the craft rules the model is given: y
			// 0.05–0.88. A title at y=0.97 is behind the platform UI chrome on
			// every vertical video app.
			if (t.y < height * 0.02 || t.y + t.height > height * 0.95) {
				findings.push(
					`${clipLabel(clip)} sits outside the safe area (y ${Math.round((t.y / height) * 100) / 100} of the canvas) — move it inside y 0.05-0.88.`
				);
			}
			if (t.x + t.width < width * 0.05 || t.x > width * 0.95) {
				findings.push(`${clipLabel(clip)} is (almost) entirely off the canvas horizontally.`);
			}
			const fontSize = Number(clip.style?.fontSize);
			if (Number.isFinite(fontSize) && fontSize < Math.min(width, height) * 0.022) {
				findings.push(
					`${clipLabel(clip)} has tiny type (${fontSize}px on a ${width}x${height} canvas) — likely unreadable. Use set_font_size with at least 0.03.`
				);
			}
		}
	}

	// ── Layering ──────────────────────────────────────────────────────────
	// An effect shades everything BELOW it, so one under the content it is
	// meant to treat renders nothing at all — the exact bug EFFECT_Z_INDEX
	// exists to prevent, re-checked here because set_layer can undo it.
	for (const clip of clips) {
		if (clip.type !== 'Effect') continue;
		const effectWindow = display(clip);
		const covered = visuals.filter((other) => overlapsUs(display(other), effectWindow));
		const topContent = Math.max(...covered.map((other) => Number(other.transform?.zIndex) || 0), 0);
		if (covered.length && (Number(clip.transform?.zIndex) || 0) <= topContent) {
			findings.push(
				`${clipLabel(clip)} is layered below the content it should treat — it does nothing. Raise it with set_layer (900 is the usual effect layer).`
			);
		}
	}

	// ── Text collisions ───────────────────────────────────────────────────
	const texts = visuals.filter(
		(clip) => (clip.type === 'Text' || clip.type === 'Caption') && clip.transform
	);
	for (let i = 0; i < texts.length; i += 1) {
		for (let j = i + 1; j < texts.length; j += 1) {
			if (
				overlapsUs(display(texts[i]), display(texts[j])) &&
				boxesCollide(texts[i].transform, texts[j].transform)
			) {
				findings.push(
					`${clipLabel(texts[i])} and ${clipLabel(texts[j])} overlap on screen at the same time — move one or retime it.`
				);
			}
		}
	}

	return findings.slice(0, MAX_FINDINGS);
};
