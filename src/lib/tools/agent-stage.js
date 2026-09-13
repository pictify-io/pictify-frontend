/**
 * What the agent is doing, in the four words the lock knows.
 *
 * The agent reports its own progress as `{ id, status, label }` — `agent`,
 * `thinking`, `render_preview#1`, `submit_template#2` — and NOT as a `stage`
 * key. Every consumer read `payload.stage`, found undefined, and fell back to a
 * constant: the lock said "Planning the change" from the first second to the
 * last, through a run that had read, thought, rendered a proof and finished.
 * Progress that never moves is worse than no progress, because it reads as a
 * hang.
 *
 * The ids carry a `#n` suffix when a tool runs more than once, so they are
 * matched by prefix.
 */
const STAGE_BY_PREFIX = [
	['submit_template', 'write'],
	['render_preview', 'check'],
	['thinking', 'plan'],
	['agent', 'read']
];

/** `'read' | 'plan' | 'write' | 'check'`, or null when the frame says nothing. */
export function stageFromAgentEvent(event) {
	if (!event) return null;
	// A server that does send an explicit stage wins; this is a translation
	// layer, not a replacement for one.
	if (typeof event.stage === 'string' && event.stage) return event.stage;
	const id = String(event.id || '');
	if (!id) return null;
	for (const [prefix, stage] of STAGE_BY_PREFIX) {
		if (id.startsWith(prefix)) return stage;
	}
	return null;
}
