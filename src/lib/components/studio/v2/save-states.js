/**
 * The studio's save states, in one place.
 *
 * Shared because two surfaces state them: the top bar shows the chip, and the
 * live region announces the change. If they drifted, a screen reader user and a
 * sighted user would be told different things about whether the buyer's work is
 * safe — which is the one fact this indicator exists to convey.
 *
 * Each label says exactly what is true. "Saving…" is not "Saved", and offline
 * says where the work actually is rather than implying it reached the server.
 */
export const SAVE_STATES = {
	saved: { tone: 'ready', label: 'Saved' },
	saving: { tone: 'current', label: 'Saving…' },
	unsaved: { tone: 'current', label: 'Unsaved changes' },
	offline: { tone: 'blocked', label: 'Offline · kept in this browser' },
	conflict: { tone: 'blocked', label: 'Someone else saved · reload to merge' },
	ai: { tone: 'current', label: 'AI working' }
};

export const saveState = (key) => SAVE_STATES[key] || SAVE_STATES.saved;
