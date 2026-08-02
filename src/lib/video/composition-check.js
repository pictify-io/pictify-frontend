/**
 * Catching a render that would come out blank, before it starts.
 *
 * A blank render is this product's worst failure: it takes minutes, spends a
 * render from the user's quota, uploads to S3, and reports success. The user is
 * left to work out for themselves that the file is black and why.
 *
 * The backend refuses these too (service/composition-check.js in the API), but
 * the check has to exist here as well for two reasons. The studio can export
 * entirely IN THE BROWSER when WebCodecs is available, which never reaches the
 * server; and even on the server path, telling someone in the editor beats
 * telling them after a two-minute wait.
 *
 * The two rules are kept deliberately in step with the backend's. If you change
 * one, change both — a client that allows what the server refuses just moves
 * the confusing failure later.
 */

/** Clip types that put nothing on screen, so they cannot save a render. */
const NON_VISUAL_TYPES = new Set(['Audio']);

/**
 * Whether a clip is on screen at some point inside the composition window.
 *
 * A clip with no readable timing counts as visible: the engine defaults it to
 * the whole composition, and guessing otherwise would block a render that would
 * have worked.
 */
export const overlapsWindow = (clip, durationUs) => {
	const display = clip?.timing?.display;
	if (!display) return true;

	const from = Number(display.from);
	const to = Number(display.to);
	if (!Number.isFinite(from) || !Number.isFinite(to)) return true;

	// A zero-length clip renders nothing, whatever else is true of it.
	if (to <= from) return false;
	return from < durationUs && to > 0;
};

/**
 * Inspect a project for the blank-render cases.
 *
 * Conservative by design: it reports blank only when certain, because a false
 * positive blocks a render someone wanted, which is worse than the blank video
 * this exists to prevent.
 *
 * @param {object} projectJson - an IProject scene graph, variables already applied
 * @returns {{blank: boolean, reason: string|null, message: string|null}}
 */
export const checkComposition = (projectJson) => {
	const clips = Object.values(projectJson?.clips || {});

	if (!clips.length) {
		return {
			blank: true,
			reason: 'empty_composition',
			message:
				'There is nothing on the timeline, so the render would be a blank video. Add a clip first.'
		};
	}

	const visual = clips.filter((clip) => clip && !NON_VISUAL_TYPES.has(clip.type));
	if (!visual.length) {
		return {
			blank: true,
			reason: 'audio_only',
			message:
				'This composition only has audio, so the video would be blank. Add something visible first.'
		};
	}

	// `duration` is microseconds. With no duration there is no window to be
	// outside of, so this check cannot fire.
	const durationUs = Number(projectJson?.settings?.duration);
	if (Number.isFinite(durationUs) && durationUs > 0) {
		const onScreen = visual.filter((clip) => overlapsWindow(clip, durationUs));
		if (!onScreen.length) {
			const seconds = Math.round(durationUs / 100_000) / 10;
			return {
				blank: true,
				reason: 'nothing_in_window',
				message:
					`Every clip sits outside the composition's ${seconds}s duration, so the render would be blank. ` +
					'Drag the clips back inside the timeline, or make the composition longer.'
			};
		}
	}

	return { blank: false, reason: null, message: null };
};
