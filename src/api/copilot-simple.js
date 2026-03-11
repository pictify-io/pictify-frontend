/**
 * Simple Copilot API Client (V4 - Tool-based)
 *
 * Frontend API methods for interacting with the agentic copilot.
 * Supports multi-turn conversations, tool execution, and streaming.
 */

import { PUBLIC_BACKEND_URL } from '$env/static/public';
import backend from '../service/backend';
import { COPILOT_TOOLS, validateToolInput, requiresConfirmation } from '../lib/copilot/tools';

const BASE_PATH = '/copilot-simple';

// =============================================================================
// Legacy API (Backward Compatibility)
// =============================================================================

/**
 * Generate design using simplified copilot (legacy, non-streaming)
 * @param {string} prompt - User's design prompt
 * @param {object} canvasState - Current canvas state
 * @param {object} brandAssets - User's brand assets (colors, fonts, logos)
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Promise<object>} Generated design result
 */
export const generateSimple = async (
	prompt,
	canvasState,
	brandAssets = null,
	width = 1080,
	height = 1080
) => {
	try {
		const response = await backend.post(`${BASE_PATH}/generate`, {
			prompt,
			canvasState,
			brandAssets,
			width,
			height
		});
		return response;
	} catch (error) {
		console.error('Error in generateSimple:', error);
		throw error;
	}
};

/**
 * Stream design generation using simplified copilot (legacy)
 * @param {object} params - Generation parameters
 * @param {string} params.prompt - User's design prompt
 * @param {object} params.canvasState - Current canvas state
 * @param {object} params.brandAssets - User's brand assets (colors, fonts, logos)
 * @param {number} params.width - Canvas width
 * @param {number} params.height - Canvas height
 * @param {function} params.onStep - Callback for step updates
 * @param {function} params.onComplete - Callback for completion
 * @param {function} params.onError - Callback for errors
 * @returns {Promise<{abort: function}>} Abort controller
 */
export const streamSimpleGenerate = async ({
	prompt,
	canvasState,
	brandAssets = null,
	width = 1080,
	height = 1080,
	onStep,
	onComplete,
	onError
}) => {
	const controller = new AbortController();
	const url = new URL(`${PUBLIC_BACKEND_URL}${BASE_PATH}/generate-stream`);

	try {
		const response = await fetch(url, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'text/event-stream'
			},
			body: JSON.stringify({
				prompt,
				canvasState,
				brandAssets,
				width,
				height
			}),
			signal: controller.signal
		});

		if (!response.ok) {
			throw new Error(`Failed to start copilot: ${response.statusText}`);
		}

		if (!response.body) {
			throw new Error('Streaming not supported in this browser.');
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		const processBuffer = () => {
			let boundary = buffer.indexOf('\n\n');
			while (boundary !== -1) {
				const chunk = buffer.slice(0, boundary).trim();
				buffer = buffer.slice(boundary + 2);
				if (chunk.length > 0) {
					let eventName = 'message';
					let dataPayload = '';
					chunk.split('\n').forEach((line) => {
						if (line.startsWith('event:')) {
							eventName = line.slice(6).trim();
						} else if (line.startsWith('data:')) {
							dataPayload += line.slice(5).trim();
						}
					});

					if (dataPayload) {
						try {
							const parsed = JSON.parse(dataPayload);
							if (eventName === 'step') {
								onStep?.(parsed);
							} else if (eventName === 'complete') {
								onComplete?.(parsed);
							} else if (eventName === 'error') {
								onError?.(new Error(parsed.message || 'Unknown error'));
							}
						} catch (error) {
							console.warn('Failed to parse SSE payload', error);
						}
					}
				}
				boundary = buffer.indexOf('\n\n');
			}
		};

		(async () => {
			try {
				while (true) {
					const { value, done } = await reader.read();
					if (done) break;
					buffer += decoder.decode(value, { stream: true });
					processBuffer();
				}
				if (buffer.trim().length > 0) {
					processBuffer();
				}
			} catch (error) {
				if (controller.signal.aborted) {
					return;
				}
				console.error('Copilot stream error:', error);
				onError?.(error);
			}
		})();

		return {
			abort: () => controller.abort()
		};
	} catch (error) {
		controller.abort();
		console.error('Error starting copilot stream:', error);
		onError?.(error);
		throw error;
	}
};

// =============================================================================
// New Tool-Based API
// =============================================================================

/**
 * Stream copilot generation with tool support
 *
 * @param {object} params - Generation parameters
 * @param {Array} params.messages - Conversation history [{role: 'user'|'assistant', content: string}]
 * @param {object} params.canvasState - Current canvas state
 * @param {object} params.brandAssets - User's brand assets (colors, fonts, logos)
 * @param {Array} params.tools - Tool definitions to make available (defaults to all)
 * @param {number} params.width - Canvas width
 * @param {number} params.height - Canvas height
 * @param {function} params.onToolCall - Callback when AI invokes a tool {id, name, input}
 * @param {function} params.onToolResult - Callback when tool completes {id, result, status}
 * @param {function} params.onText - Callback for text response chunks
 * @param {function} params.onStep - Callback for step updates (legacy compatibility)
 * @param {function} params.onComplete - Callback for completion
 * @param {function} params.onError - Callback for errors
 * @returns {Promise<{abort: function, isAborted: function}>} Controller object
 */
export const streamCopilotGenerate = async ({
	messages,
	canvasState,
	brandAssets = null,
	tools = COPILOT_TOOLS,
	width = 1080,
	height = 1080,
	onToolCall,
	onToolResult,
	onText,
	onStep,
	onComplete,
	onError
}) => {
	const controller = new AbortController();
	let isAborted = false;

	// Mark as aborted when signal fires
	controller.signal.addEventListener('abort', () => {
		isAborted = true;
	});

	const url = new URL(`${PUBLIC_BACKEND_URL}${BASE_PATH}/generate-stream`);

	try {
		// Convert messages to the format expected by backend
		const formattedMessages = messages.map((msg) => ({
			role: msg.role,
			content: msg.content
		}));

		const response = await fetch(url, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'text/event-stream'
			},
			body: JSON.stringify({
				messages: formattedMessages,
				prompt: formattedMessages[formattedMessages.length - 1]?.content || '',
				canvasState,
				brandAssets,
				tools: tools.map((t) => ({
					name: t.name,
					description: t.description,
					input_schema: t.input_schema
				})),
				width,
				height
			}),
			signal: controller.signal
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => response.statusText);
			throw new Error(`Failed to start copilot: ${errorText}`);
		}

		if (!response.body) {
			throw new Error('Streaming not supported in this browser.');
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		const processSSEEvent = (eventName, parsed) => {
			switch (eventName) {
				case 'tool_call':
					// AI wants to use a tool
					if (parsed.id && parsed.name) {
						// Validate tool input
						const validation = validateToolInput(parsed.name, parsed.input || {});
						if (!validation.valid) {
							console.warn(`Invalid tool input for ${parsed.name}:`, validation.errors);
						}
						// Check if confirmation needed
						const needsConfirm = requiresConfirmation(parsed.name);
						onToolCall?.({
							...parsed,
							requiresConfirmation: needsConfirm,
							validationErrors: validation.errors
						});
					}
					break;

				case 'tool_result':
					// Tool execution completed
					onToolResult?.(parsed);
					break;

				case 'text':
					// Text response chunk
					onText?.(parsed.content || parsed.text || '');
					break;

				case 'step':
					// Legacy step update (canvas state change)
					onStep?.(parsed);
					break;

				case 'element_update':
					// Partial canvas update (single element)
					onStep?.({
						type: 'element_update',
						...parsed
					});
					break;

				case 'complete':
					onComplete?.(parsed);
					break;

				case 'error':
					onError?.(new Error(parsed.message || 'Unknown error'));
					break;

				default:
					// Unknown event type, log for debugging
					console.debug('Unknown SSE event:', eventName, parsed);
			}
		};

		const processBuffer = () => {
			let boundary = buffer.indexOf('\n\n');
			while (boundary !== -1) {
				const chunk = buffer.slice(0, boundary).trim();
				buffer = buffer.slice(boundary + 2);

				if (chunk.length > 0) {
					let eventName = 'message';
					let dataPayload = '';

					chunk.split('\n').forEach((line) => {
						if (line.startsWith('event:')) {
							eventName = line.slice(6).trim();
						} else if (line.startsWith('data:')) {
							dataPayload += line.slice(5).trim();
						}
					});

					if (dataPayload) {
						try {
							const parsed = JSON.parse(dataPayload);
							processSSEEvent(eventName, parsed);
						} catch (error) {
							console.warn('Failed to parse SSE payload:', error, dataPayload);
						}
					}
				}
				boundary = buffer.indexOf('\n\n');
			}
		};

		// Process stream in background
		(async () => {
			try {
				while (true) {
					const { value, done } = await reader.read();
					if (done) break;
					if (isAborted) break;

					buffer += decoder.decode(value, { stream: true });
					processBuffer();
				}

				// Process any remaining data
				if (buffer.trim().length > 0 && !isAborted) {
					processBuffer();
				}
			} catch (error) {
				if (isAborted || controller.signal.aborted) {
					console.debug('Stream aborted gracefully');
					return;
				}
				console.error('Copilot stream error:', error);
				onError?.(error);
			} finally {
				// Ensure reader is released
				try {
					reader.releaseLock();
				} catch {
					// Already released
				}
			}
		})();

		return {
			abort: () => {
				isAborted = true;
				controller.abort();
			},
			isAborted: () => isAborted
		};
	} catch (error) {
		isAborted = true;
		controller.abort();
		console.error('Error starting copilot stream:', error);
		onError?.(error);
		throw error;
	}
};

// =============================================================================
// Tool Execution Helpers
// =============================================================================

/**
 * Send tool result back to the copilot
 * Used when a tool requires user confirmation or async execution
 *
 * @param {string} threadId - The conversation thread ID
 * @param {string} toolCallId - The tool call ID
 * @param {object} result - The tool execution result
 * @returns {Promise<object>} Response from backend
 */
export const sendToolResult = async (threadId, toolCallId, result) => {
	try {
		const response = await backend.post(`${BASE_PATH}/tool-result`, {
			threadId,
			toolCallId,
			result
		});
		return response;
	} catch (error) {
		console.error('Error sending tool result:', error);
		throw error;
	}
};

/**
 * Continue conversation after tool execution
 *
 * @param {string} threadId - The conversation thread ID
 * @param {Array} toolResults - Array of {toolCallId, result} objects
 * @returns {Promise<object>} Response from backend
 */
export const continueWithToolResults = async (threadId, toolResults) => {
	try {
		const response = await backend.post(`${BASE_PATH}/continue`, {
			threadId,
			toolResults
		});
		return response;
	} catch (error) {
		console.error('Error continuing with tool results:', error);
		throw error;
	}
};

// =============================================================================
// Exports
// =============================================================================

export { COPILOT_TOOLS, validateToolInput, requiresConfirmation };
