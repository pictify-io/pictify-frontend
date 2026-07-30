/**
 * Reading Server-Sent Events from a fetch response.
 *
 * EventSource would do this for us, but it can only issue GET requests and the
 * things we stream are answers to POSTs with bodies far too large for a query
 * string. So the frames are parsed by hand.
 *
 * The whole reason this is a module rather than a loop inlined at the call site
 * is the buffering. A network chunk can split a frame ANYWHERE — mid-JSON,
 * between the event line and the data line, on the blank line that terminates
 * it — and a reader that treats one chunk as one frame works perfectly against
 * a fast local server and drops events over a real network. That bug is
 * invisible in development and unreproducible in production, so it is worth
 * having in one tested place.
 */

/**
 * Pull complete frames out of a buffer, leaving any partial tail behind.
 *
 * @param {string} buffer
 * @returns {{events: Array<{event: string, data: any}>, rest: string}}
 */
export const drainFrames = (buffer) => {
	const events = [];
	let rest = String(buffer ?? '');

	let split;
	while ((split = rest.indexOf('\n\n')) !== -1) {
		const frame = rest.slice(0, split);
		rest = rest.slice(split + 2);

		const eventLine = /^event:\s*(.+)$/m.exec(frame);
		const dataLine = /^data:\s*(.+)$/m.exec(frame);
		// A frame missing either half is not ours: SSE allows bare comments
		// (": keep-alive") and proxies inject them to hold the connection open.
		if (!eventLine || !dataLine) continue;

		try {
			events.push({ event: eventLine[1].trim(), data: JSON.parse(dataLine[1]) });
		} catch {
			// A truncated or malformed payload should cost its own frame, not the
			// whole stream.
		}
	}

	return { events, rest };
};

/**
 * Consume an SSE response, calling `onEvent` for each frame.
 *
 * @param {Response} response - a fetch response with a readable body
 * @param {(event: string, data: any) => void} onEvent
 */
export const readEventStream = async (response, onEvent) => {
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			// `stream: true` so a multi-byte character split across chunks is not
			// decoded as two replacement characters.
			buffer += decoder.decode(value, { stream: true });

			const { events, rest } = drainFrames(buffer);
			buffer = rest;
			for (const { event, data } of events) onEvent(event, data);
		}
	} finally {
		/*
		 * Release the connection even when a handler throws or the caller gives
		 * up. An abandoned reader leaves the socket open until the server closes
		 * it, and these streams run for ten to fifteen seconds — a handful of
		 * them exhausts the browser's six-connections-per-host budget and every
		 * later request to the API queues behind them.
		 */
		reader.cancel?.().catch(() => {});
	}
};
