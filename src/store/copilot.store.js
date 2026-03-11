/**
 * Copilot Store
 *
 * Svelte store for managing agentic copilot state.
 * Supports multi-turn conversations, tool execution, and proactive suggestions.
 */

import { writable, derived, get } from 'svelte/store';
import { historyActions } from './history.store';

// =============================================================================
// Constants
// =============================================================================

const MAX_CONTEXT_WINDOW = 10; // Max turns to send to API
const MAX_TOKEN_ESTIMATE = 8000; // Rough token budget
const SUGGESTION_TRIGGER_DELAY = 5000; // ms after idle before suggesting

/**
 * Copilot drawer UI state
 */
export const copilotDrawer = writable({
	isOpen: false,
	height: 400, // default height in pixels
	isMinimized: false
});

// =============================================================================
// Conversation History
// =============================================================================

/**
 * Conversation history with context management
 */
export const copilotConversation = writable({
	messages: [], // Full conversation history { role: 'user'|'assistant', content: string, timestamp: number }
	contextWindow: MAX_CONTEXT_WINDOW, // Max turns to send to API
	canvasSnapshots: [], // Canvas state at each turn { turnIndex: number, snapshot: object }
	elementLabels: new Map() // User-defined element names id -> label
});

/**
 * Get messages trimmed for API context window
 */
export const contextMessages = derived(copilotConversation, ($conv) => {
	const messages = $conv.messages;
	if (messages.length <= $conv.contextWindow) {
		return messages;
	}
	// Keep first message (establishes intent) + recent messages
	const first = messages[0];
	const recent = messages.slice(-($conv.contextWindow - 1));
	return [first, ...recent];
});

// =============================================================================
// Tool State
// =============================================================================

/**
 * Tool execution state for agentic operations
 */
export const copilotTools = writable({
	availableTools: [], // Tool definitions
	pendingTools: [], // Tools awaiting execution { id, name, input, status: 'pending' }
	executedTools: [], // Completed tool calls { id, name, input, result, status: 'success'|'error' }
	currentToolCallId: null // Active tool call being processed
});

/**
 * Check if any tools are currently pending
 */
export const hasToolsPending = derived(copilotTools, ($tools) => $tools.pendingTools.length > 0);

// =============================================================================
// Suggestions State
// =============================================================================

/**
 * Proactive suggestion system
 */
export const copilotSuggestions = writable({
	pending: [], // Suggestions awaiting user response { id, category, message, priority, confidence, timestamp }
	dismissed: [], // Suggestions user dismissed
	applied: [], // Suggestions user applied
	enabled: true, // User preference
	triggerDelay: SUGGESTION_TRIGGER_DELAY // ms after idle before suggesting
});

/**
 * High-priority suggestions that should be shown prominently
 */
export const highPrioritySuggestions = derived(copilotSuggestions, ($suggestions) =>
	$suggestions.pending.filter((s) => s.priority === 'high')
);

// =============================================================================
// Copilot Execution State
// =============================================================================

/**
 * Copilot execution state
 */
export const copilotExecution = writable({
	isActive: false,
	isLoading: false,
	currentSteps: [],
	currentStepIndex: 0,
	mode: 'manual', // 'manual' or 'auto'
	selfCorrectEnabled: true,
	error: null,
	threadId: null,
	checkpointId: null,
	needsUserInput: false
});

/**
 * Current step being viewed/approved
 */
export const currentStep = derived(copilotExecution, ($exec) => {
	if (!$exec.currentSteps || $exec.currentStepIndex >= $exec.currentSteps.length) {
		return null;
	}
	return $exec.currentSteps[$exec.currentStepIndex];
});

/**
 * Check if execution is complete
 */
export const isExecutionComplete = derived(copilotExecution, ($exec) => {
	if (!$exec.currentSteps || $exec.currentSteps.length === 0) {
		return false;
	}
	return $exec.currentSteps.every(
		(step) => step.status === 'validated' || step.status === 'approved'
	);
});

/**
 * Copilot actions
 */
export const copilotActions = {
	/**
	 * Start a new agentic execution
	 */
	startExecution: (steps = []) => {
		copilotExecution.update((state) => ({
			...state,
			isActive: true,
			currentSteps: steps,
			currentStepIndex: 0,
			error: null,
			threadId: null,
			checkpointId: null,
			needsUserInput: false
		}));
	},

	/**
	 * Approve the current step
	 */
	approveStep: (stepIndex) => {
		copilotExecution.update((state) => {
			const steps = [...state.currentSteps];
			if (steps[stepIndex]) {
				steps[stepIndex].status = 'approved';
			}
			return {
				...state,
				currentSteps: steps,
				currentStepIndex: Math.min(stepIndex + 1, steps.length - 1)
			};
		});
	},

	/**
	 * Reject the current step
	 */
	rejectStep: (stepIndex, feedback) => {
		copilotExecution.update((state) => {
			const steps = [...state.currentSteps];
			if (steps[stepIndex]) {
				steps[stepIndex].status = 'rejected';
				steps[stepIndex].userFeedback = feedback;
			}
			return {
				...state,
				currentSteps: steps
			};
		});
	},

	/**
	 * Clear execution state
	 */
	clearExecution: () => {
		copilotExecution.set({
			isActive: false,
			isLoading: false,
			currentSteps: [],
			currentStepIndex: 0,
			mode: 'manual',
			selfCorrectEnabled: true,
			error: null,
			threadId: null,
			checkpointId: null,
			needsUserInput: false
		});
	},

	/**
	 * Set loading state
	 */
	setLoading: (isLoading) => {
		copilotExecution.update((state) => ({
			...state,
			isLoading
		}));
	},

	/**
	 * Set error
	 */
	setError: (error) => {
		copilotExecution.update((state) => ({
			...state,
			error,
			isLoading: false
		}));
	},

	upsertSteps: (incomingSteps = []) => {
		if (!incomingSteps || incomingSteps.length === 0) {
			return;
		}
		copilotExecution.update((state) => {
			const merged = new Map();
			state.currentSteps.forEach((step) => {
				merged.set(step.stepNumber, step);
			});
			incomingSteps.forEach((step) => {
				if (!step?.stepNumber) {
					return;
				}
				const existing = merged.get(step.stepNumber) || {};
				merged.set(step.stepNumber, {
					...existing,
					...step
				});
			});
			const ordered = Array.from(merged.values()).sort((a, b) => a.stepNumber - b.stepNumber);
			return {
				...state,
				currentSteps: ordered,
				isActive: true,
				currentStepIndex: Math.max(0, ordered.length - 1)
			};
		});
	},

	setThreadContext: ({ threadId, checkpointId, needsUserInput }) => {
		copilotExecution.update((state) => ({
			...state,
			threadId: threadId ?? state.threadId,
			checkpointId: checkpointId ?? state.checkpointId,
			needsUserInput: typeof needsUserInput === 'boolean' ? needsUserInput : state.needsUserInput
		}));
	},

	/**
	 * Drawer control actions
	 */
	toggleDrawer: () => {
		copilotDrawer.update((state) => ({
			...state,
			isOpen: !state.isOpen,
			isMinimized: false
		}));
	},

	openDrawer: () => {
		copilotDrawer.update((state) => ({
			...state,
			isOpen: true,
			isMinimized: false
		}));
	},

	closeDrawer: () => {
		copilotDrawer.update((state) => ({
			...state,
			isOpen: false,
			isMinimized: false
		}));
	},

	minimizeDrawer: () => {
		copilotDrawer.update((state) => ({
			...state,
			isMinimized: true
		}));
	},

	maximizeDrawer: () => {
		copilotDrawer.update((state) => ({
			...state,
			isMinimized: false
		}));
	},

	setDrawerHeight: (height) => {
		copilotDrawer.update((state) => ({
			...state,
			height: Math.max(200, Math.min(height, window.innerHeight * 0.8))
		}));
	},

	// ===========================================================================
	// Conversation Actions
	// ===========================================================================

	/**
	 * Add a message to conversation history
	 * @param {'user'|'assistant'} role
	 * @param {string} content
	 */
	addMessage: (role, content) => {
		copilotConversation.update((state) => ({
			...state,
			messages: [...state.messages, { role, content, timestamp: Date.now() }]
		}));
	},

	/**
	 * Clear conversation history
	 */
	clearConversation: () => {
		copilotConversation.update((state) => ({
			...state,
			messages: [],
			canvasSnapshots: []
		}));
	},

	/**
	 * Save canvas snapshot for current turn
	 * @param {object} canvasState - The canvas JSON state
	 */
	saveCanvasSnapshot: (canvasState) => {
		copilotConversation.update((state) => ({
			...state,
			canvasSnapshots: [
				...state.canvasSnapshots,
				{ turnIndex: state.messages.length, snapshot: canvasState }
			]
		}));
	},

	/**
	 * Label an element for easier reference
	 * @param {string} elementId
	 * @param {string} label
	 */
	labelElement: (elementId, label) => {
		copilotConversation.update((state) => {
			const newLabels = new Map(state.elementLabels);
			newLabels.set(elementId, label);
			return { ...state, elementLabels: newLabels };
		});
	},

	/**
	 * Get label for an element
	 * @param {string} elementId
	 * @returns {string|undefined}
	 */
	getElementLabel: (elementId) => {
		const state = get(copilotConversation);
		return state.elementLabels.get(elementId);
	},

	// ===========================================================================
	// Tool Actions
	// ===========================================================================

	/**
	 * Register available tools
	 * @param {Array} tools - Tool definitions
	 */
	setAvailableTools: (tools) => {
		copilotTools.update((state) => ({
			...state,
			availableTools: tools
		}));
	},

	/**
	 * Queue a tool for execution
	 * @param {object} toolCall - { id, name, input }
	 */
	queueToolCall: (toolCall) => {
		copilotTools.update((state) => ({
			...state,
			pendingTools: [...state.pendingTools, { ...toolCall, status: 'pending' }]
		}));
	},

	/**
	 * Mark a tool as currently executing
	 * @param {string} toolId
	 */
	startToolExecution: (toolId) => {
		copilotTools.update((state) => ({
			...state,
			currentToolCallId: toolId,
			pendingTools: state.pendingTools.map((t) =>
				t.id === toolId ? { ...t, status: 'executing' } : t
			)
		}));
	},

	/**
	 * Complete a tool execution
	 * @param {string} toolId
	 * @param {object} result
	 * @param {'success'|'error'} status
	 */
	completeToolExecution: (toolId, result, status = 'success') => {
		copilotTools.update((state) => {
			const tool = state.pendingTools.find((t) => t.id === toolId);
			return {
				...state,
				currentToolCallId: null,
				pendingTools: state.pendingTools.filter((t) => t.id !== toolId),
				executedTools: tool
					? [...state.executedTools, { ...tool, result, status }]
					: state.executedTools
			};
		});
	},

	/**
	 * Clear all tool state
	 */
	clearToolState: () => {
		copilotTools.set({
			availableTools: [],
			pendingTools: [],
			executedTools: [],
			currentToolCallId: null
		});
	},

	// ===========================================================================
	// Suggestion Actions
	// ===========================================================================

	/**
	 * Add a suggestion
	 * @param {object} suggestion - { category, message, priority, confidence }
	 */
	addSuggestion: (suggestion) => {
		copilotSuggestions.update((state) => ({
			...state,
			pending: [
				...state.pending,
				{
					...suggestion,
					id: crypto.randomUUID(),
					timestamp: Date.now()
				}
			]
		}));
	},

	/**
	 * Dismiss a suggestion
	 * @param {string} suggestionId
	 */
	dismissSuggestion: (suggestionId) => {
		copilotSuggestions.update((state) => {
			const suggestion = state.pending.find((s) => s.id === suggestionId);
			return {
				...state,
				pending: state.pending.filter((s) => s.id !== suggestionId),
				dismissed: suggestion ? [...state.dismissed, suggestion] : state.dismissed
			};
		});
	},

	/**
	 * Apply a suggestion
	 * @param {string} suggestionId
	 */
	applySuggestion: (suggestionId) => {
		copilotSuggestions.update((state) => {
			const suggestion = state.pending.find((s) => s.id === suggestionId);
			return {
				...state,
				pending: state.pending.filter((s) => s.id !== suggestionId),
				applied: suggestion ? [...state.applied, suggestion] : state.applied
			};
		});
	},

	/**
	 * Clear all suggestions
	 */
	clearSuggestions: () => {
		copilotSuggestions.update((state) => ({
			...state,
			pending: [],
			dismissed: [],
			applied: []
		}));
	},

	/**
	 * Toggle suggestion system
	 * @param {boolean} enabled
	 */
	setSuggestionsEnabled: (enabled) => {
		copilotSuggestions.update((state) => ({
			...state,
			enabled
		}));
	},

	// ===========================================================================
	// History Integration
	// ===========================================================================

	/**
	 * Start a copilot batch operation (for unified undo)
	 * @param {string} description
	 */
	startCopilotBatch: (description = 'Copilot operation') => {
		historyActions.startBatch(description, 'copilot');
		historyActions.setStreaming(true);
	},

	/**
	 * End a copilot batch operation
	 */
	endCopilotBatch: () => {
		historyActions.setStreaming(false);
		historyActions.endBatch();
	}
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Estimate token count for messages (rough: 4 chars = 1 token)
 * @param {Array} messages
 * @returns {number}
 */
export function estimateTokens(messages) {
	return messages.reduce((sum, msg) => {
		return sum + Math.ceil(JSON.stringify(msg).length / 4);
	}, 0);
}

/**
 * Trim conversation to fit within token budget
 * @param {Array} messages
 * @param {number} maxTokens
 * @returns {Array}
 */
export function trimConversation(messages, maxTokens = MAX_TOKEN_ESTIMATE) {
	if (messages.length <= 3) return messages;

	const first = messages[0];
	const recent = messages.slice(-6); // Last 3 exchanges

	let tokenCount = estimateTokens([first, ...recent]);
	let trimmed = [first, ...recent];

	while (tokenCount > maxTokens && trimmed.length > 2) {
		trimmed = [trimmed[0], ...trimmed.slice(2)];
		tokenCount = estimateTokens(trimmed);
	}

	return trimmed;
}
