import backend from '../service/backend';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

/**
 * Onboarding v2 client.
 *
 * Generation streams over SSE rather than returning a finished template: the
 * waiting screen shows the HTML being written and the variables landing one at
 * a time, which is the only moment the product gets to demonstrate "a template
 * declares variables" rather than assert it.
 */

/**
 * Start generation from a description.
 *
 * @param {object} args
 * @param {string} args.prompt
 * @param {(text: string) => void} args.onToken     HTML as it arrives
 * @param {(stage: object) => void} [args.onStage]  agent pipeline progress
 * @param {(payload: object) => void} args.onTemplate  saved + validated
 * @param {(err: object) => void} args.onError
 * @param {AbortSignal} [args.signal]
 */
export async function generateFromPrompt({ prompt, onToken, onStage, onTemplate, onError, signal }) {
	/*
	 * Every failure path has to reach onError. A rejected fetch or a stream that
	 * dies mid-flight would otherwise leave the caller sitting on the waiting
	 * screen indefinitely, with no result and no way back — the worst outcome
	 * available, and worse than a plain error.
	 */
	let response;
	try {
		response = await fetch(`${PUBLIC_BACKEND_URL}/api/onboarding/v2/from-prompt`, {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt }),
			signal
		});
	} catch (e) {
		if (e?.name !== 'AbortError') {
			onError?.({ message: "Couldn't reach the server.", code: 'network' });
		}
		return;
	}

	if (!response.ok || !response.body) {
		// The server's refusal (e.g. template_limit_reached) says exactly why —
		// surface its words rather than a generic shrug.
		let payload = null;
		try {
			payload = await response.json();
		} catch {
			// Non-JSON error body; fall through to the generic message.
		}
		onError?.({
			message: payload?.message || 'Could not start generating. Try again.',
			code: payload?.code || 'bad_response'
		});
		return;
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let sawTemplate = false;

	try {
		// Frames are separated by a blank line; a chunk can split one anywhere, so
		// only complete frames are parsed and the remainder is carried over.
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			const frames = buffer.split('\n\n');
			buffer = frames.pop() ?? '';

			for (const frame of frames) {
				const lines = frame.split('\n');
				const eventLine = lines.find((l) => l.startsWith('event:'));
				const dataLine = lines.find((l) => l.startsWith('data:'));
				if (!eventLine || !dataLine) continue;

				const event = eventLine.slice(6).trim();
				let payload;
				try {
					payload = JSON.parse(dataLine.slice(5).trim());
				} catch {
					continue;
				}

				if (event === 'token') {
					onToken?.(payload.text);
				} else if (event === 'stage') {
					onStage?.(payload);
				} else if (event === 'template') {
					sawTemplate = true;
					onTemplate?.(payload);
				} else if (event === 'error') {
					sawTemplate = true; // an error is a terminal answer too
					onError?.(payload);
				}
			}
		}
	} catch (e) {
		if (e?.name !== 'AbortError') {
			onError?.({ message: 'The connection dropped mid-write.', code: 'stream_failed' });
		}
		return;
	}

	// Stream closed without ever saying how it ended.
	if (!sawTemplate) {
		onError?.({ message: 'Generation stopped early. Try again.', code: 'incomplete' });
	}
}

/** Clone a starter template into the team. */
export async function startFromStarter(starterUid) {
	return backend.post('/api/onboarding/v2/from-starter', { starterUid });
}

/** Render the onboarding template. Does not count against the plan. */
export async function renderOnboarding({ templateUid, variables, format } = {}) {
	return backend.post('/api/onboarding/v2/render', { templateUid, variables, format });
}

/** Polled by the integrate step; `received` flips server-side only. */
export async function getOnboardingV2Status() {
	return backend.get('/api/onboarding/v2/status');
}

export async function getOnboardingKey() {
	return backend.get('/api/onboarding/v2/key');
}

export async function recordRedraw() {
	return backend.post('/api/onboarding/v2/redraw', {});
}

export async function skipOnboarding() {
	return backend.post('/api/onboarding/v2/skip', {});
}
