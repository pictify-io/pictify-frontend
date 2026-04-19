/**
 * copilot-html — streaming client for /copilot-html/generate-stream.
 *
 * Shape mirrors api/copilot-simple.js's streamSimpleGenerate — same
 * SSE boundary protocol (`\n\n`-delimited events with `event:` +
 * `data:` lines). We diverge on the output: instead of a finished
 * canvas object, callers get per-token updates (`onToken`) for a
 * live-typing effect and a final `onComplete` carrying the extracted
 * html string to apply to the editor buffer.
 *
 * The client never inspects conversation history directly — it just
 * ships whatever `messages` array the caller supplies. Persisting /
 * trimming history is the drawer's responsibility.
 */

import { PUBLIC_BACKEND_URL } from '$env/static/public'

const BASE_PATH = '/copilot-html'

/**
 * Stream an HTML generation request. Returns `{ abort }` so callers
 * can cancel mid-stream if the user closes the drawer or types a new
 * message before the previous one finishes.
 *
 * @param {object} opts
 * @param {Array<{role:'user'|'assistant', content:string}>} opts.messages — full conversation including the latest user turn
 * @param {string} opts.currentHtml                  — editor buffer at send time
 * @param {Array<object>} opts.currentVariables      — declared variables
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {(piece:string) => void} [opts.onToken]    — fired for every streamed chunk
 * @param {(step:object) => void} [opts.onStep]      — initial ready / metadata event
 * @param {(result:object) => void} [opts.onComplete]— final event (result.html is the extracted block)
 * @param {(err:Error) => void} [opts.onError]
 * @returns {{ abort: () => void }}
 */
export const streamHtmlCopilot = ({
	messages,
	currentHtml,
	currentVariables = [],
	brandContext = null,
	width = 1080,
	height = 1080,
	onToken,
	onStep,
	onComplete,
	onError
}) => {
	const controller = new AbortController()
	const url = new URL(`${PUBLIC_BACKEND_URL}${BASE_PATH}/generate-stream`)

	;(async () => {
		try {
			const response = await fetch(url, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'text/event-stream'
				},
				body: JSON.stringify({
					messages,
					currentHtml,
					currentVariables,
					brandContext,
					width,
					height
				}),
				signal: controller.signal
			})

			if (!response.ok) {
				const text = await response.text().catch(() => response.statusText)
				throw new Error(`Copilot request failed (${response.status}): ${text}`)
			}
			if (!response.body) {
				throw new Error('Streaming not supported in this browser.')
			}

			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let buffer = ''

			const processBuffer = () => {
				let boundary = buffer.indexOf('\n\n')
				while (boundary !== -1) {
					const chunk = buffer.slice(0, boundary).trim()
					buffer = buffer.slice(boundary + 2)
					if (chunk.length > 0) {
						let eventName = 'message'
						let dataPayload = ''
						chunk.split('\n').forEach((line) => {
							if (line.startsWith('event:')) {
								eventName = line.slice(6).trim()
							} else if (line.startsWith('data:')) {
								dataPayload += line.slice(5).trim()
							}
						})
						if (dataPayload) {
							try {
								const parsed = JSON.parse(dataPayload)
								if (eventName === 'token') onToken?.(parsed.piece || '')
								else if (eventName === 'step') onStep?.(parsed)
								else if (eventName === 'complete') onComplete?.(parsed)
								else if (eventName === 'error') onError?.(new Error(parsed.message || 'Copilot error'))
							} catch {
								/* malformed chunk — ignore */
							}
						}
					}
					boundary = buffer.indexOf('\n\n')
				}
			}

			while (true) {
				const { value, done } = await reader.read()
				if (done) break
				buffer += decoder.decode(value, { stream: true })
				processBuffer()
			}
			if (buffer.trim().length > 0) processBuffer()
		} catch (err) {
			if (err && err.name === 'AbortError') return
			onError?.(err instanceof Error ? err : new Error(String(err)))
		}
	})()

	return { abort: () => controller.abort() }
}
