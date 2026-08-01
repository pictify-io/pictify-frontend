/**
 * The copilot's phase decisions, out of the React panel so they can be tested.
 *
 * The panel owns the WIRES — network calls, applying operations, rendering the
 * transcript. Everything that is a decision rather than a wire lives here:
 * whether a request deserves a design phase, how big its budget is, what a
 * round report looks like, and when the review phase is worth a network call.
 * Every defect in the copilot so far lived in untestable panel code; this
 * module is the part of the new pipeline that CAN be pinned down.
 */

/**
 * Does this request want a video DESIGNED, or a scene EDITED?
 *
 * "Create a promo video for our coffee brand" needs a brief — palette, beats,
 * hierarchy — before any tool call makes sense. "Make the title bigger" needs
 * exactly one call and a brief would be pure latency.
 *
 * The verb alone is not enough: "make the title bigger" starts with make. So
 * a generative verb must meet a composition noun ("video", "intro"…), OR the
 * scene must be nearly empty — on two clips there is nothing to edit, so even
 * "add something about our launch" is really a design request.
 *
 * @param {string} instruction
 * @param {{clips?: Array}} describedDoc - describeDocument() output
 * @returns {'generate' | 'edit'}
 */
export const classifyRequest = (instruction, describedDoc) => {
	const text = String(instruction || '').toLowerCase();
	const generativeVerb =
		/\b(create|make|generate|build|design|produce|put together|come up with)\b/.test(text);
	const compositionNoun =
		/\b(video|template|scene|composition|intro|outro|promo|ad|advert|trailer|reel|story|slideshow|announcement|teaser)\b/.test(
			text
		);
	const clipCount = (describedDoc?.clips || []).length;

	if (generativeVerb && compositionNoun) return 'generate';
	if (clipCount < 3 && generativeVerb) return 'generate';
	return 'edit';
};

/**
 * How much work a request may spend.
 *
 * Generation is legitimately dozens of operations — background, media per
 * beat, text per beat, scrims, animations, transitions. An edit that reaches
 * thirty operations has misread the request and is rewriting the scene.
 */
export const budgetFor = (kind) =>
	kind === 'generate'
		? { rounds: 8, operations: 60 }
		: { rounds: 6, operations: 30 };

/**
 * The feedback message a round sends back to the model.
 *
 * One place, because this string IS the protocol: the model can only steer on
 * what this reports. It must always contain the failures (or the model repeats
 * them), the fresh scene (its own last round moved things), and an explicit
 * way to stop (or the loop runs to the budget every time).
 */
export const roundReport = ({ answers = [], applied = '', failures = [], scene }) =>
	[
		answers.join('\n'),
		applied ? `Applied: ${applied}` : '',
		failures.length ? `Failed (do not repeat these unchanged): ${failures.join('; ')}` : '',
		`Scene now: ${JSON.stringify(scene)}`,
		'Continue if the request is not finished. Return an empty calls list when it is done.'
	]
		.filter(Boolean)
		.join('\n');

/**
 * Is the review phase worth a network call?
 *
 * Always after generation — the whole point of the pipeline is that generated
 * scenes get looked at. After an edit, only when the deterministic checks
 * actually found something: "review a two-operation colour change" is latency
 * with no upside.
 */
export const shouldReview = ({ kind, operations, findings }) => {
	if (!operations) return false;
	if (kind === 'generate') return true;
	return (findings || []).length > 0;
};

/**
 * The brief, sized for the chat transcript.
 *
 * The full brief goes to the model every round; the USER gets the idea line
 * and the shape of it, not 350 words between them and their video.
 */
export const condenseBrief = (brief, limit = 280) => {
	const text = String(brief || '').trim();
	if (text.length <= limit) return text;
	const cut = text.slice(0, limit);
	const lastBreak = Math.max(cut.lastIndexOf('\n'), cut.lastIndexOf('. '));
	return `${cut.slice(0, lastBreak > limit * 0.5 ? lastBreak : limit).trim()}…`;
};
