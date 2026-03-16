/**
 * Unified History Store
 *
 * Centralized undo/redo management for canvas operations.
 * Supports batching for multi-step operations (like Copilot changes).
 */

import { writable, derived, get } from 'svelte/store';

// =============================================================================
// Core State Stores
// =============================================================================

export const canUndo = writable(false);
export const canRedo = writable(false);

// Trigger stores - used by UI (TopBar) to signal Canvas to perform undo/redo
export const triggerUndo = writable(0);
export const triggerRedo = writable(0);

// State for unsaved changes
export const isDirty = writable(false);
export const triggerMarkSaved = writable(0);

// =============================================================================
// Batch Operation State
// =============================================================================

/**
 * Batch operation state for grouping multiple changes into single undo entry.
 * Used by Copilot and other multi-step operations.
 */
export const batchState = writable({
	isActive: false,
	description: null,
	source: 'user' // 'user' | 'copilot' | 'system'
});

/**
 * Check if batching is currently active
 */
export const isBatching = derived(batchState, ($batch) => $batch.isActive);

// =============================================================================
// Streaming State (for preventing undo during AI operations)
// =============================================================================

/**
 * Tracks if a streaming operation is in progress.
 * When true, undo/redo should be disabled to prevent race conditions.
 */
export const isStreaming = writable(false);

/**
 * Derived store that checks if undo is safe to perform
 */
export const canSafelyUndo = derived(
	[canUndo, isStreaming],
	([$canUndo, $isStreaming]) => $canUndo && !$isStreaming
);

/**
 * Derived store that checks if redo is safe to perform
 */
export const canSafelyRedo = derived(
	[canRedo, isStreaming],
	([$canRedo, $isStreaming]) => $canRedo && !$isStreaming
);

// =============================================================================
// History Actions
// =============================================================================

export const historyActions = {
	/**
	 * Start a batch operation - multiple changes will be grouped into one undo entry
	 * @param {string} description - Human-readable description of the batch operation
	 * @param {string} source - Source of the operation ('user' | 'copilot' | 'system')
	 */
	startBatch: (description = 'Batch operation', source = 'user') => {
		batchState.set({
			isActive: true,
			description,
			source
		});
	},

	/**
	 * End a batch operation - saves state after all changes
	 */
	endBatch: () => {
		const batch = get(batchState);
		batchState.set({
			isActive: false,
			description: null,
			source: 'user'
		});
		// The actual saveState() call is handled by Canvas.svelte
		// which subscribes to batchState changes
	},

	/**
	 * Set streaming state (used by Copilot during AI operations)
	 * @param {boolean} streaming - Whether streaming is in progress
	 */
	setStreaming: (streaming) => {
		isStreaming.set(streaming);
		if (streaming) {
		} else {
		}
	},

	/**
	 * Request undo (will be handled by Canvas.svelte)
	 * Respects streaming state - won't trigger if streaming is active
	 */
	requestUndo: () => {
		if (get(isStreaming)) {
			return false;
		}
		triggerUndo.update((n) => n + 1);
		return true;
	},

	/**
	 * Request redo (will be handled by Canvas.svelte)
	 * Respects streaming state - won't trigger if streaming is active
	 */
	requestRedo: () => {
		if (get(isStreaming)) {
			return false;
		}
		triggerRedo.update((n) => n + 1);
		return true;
	},

	/**
	 * Mark current state as saved
	 */
	markSaved: () => {
		triggerMarkSaved.update((n) => n + 1);
	}
};

// =============================================================================
// Legacy Compatibility - Window Globals
// =============================================================================

/**
 * Sets up legacy window globals for backward compatibility.
 * Called by Canvas.svelte during initialization.
 *
 * @deprecated Use historyActions.startBatch/endBatch instead
 */
export function setupLegacyGlobals() {
	if (typeof window !== 'undefined') {
		window.__historyBatchStart = () => {
			historyActions.startBatch('Legacy batch operation', 'user');
		};
		window.__historyBatchEnd = () => {
			historyActions.endBatch();
		};
	}
}

/**
 * Cleans up legacy window globals.
 * Called by Canvas.svelte during destruction.
 */
export function cleanupLegacyGlobals() {
	if (typeof window !== 'undefined') {
		delete window.__historyBatchStart;
		delete window.__historyBatchEnd;
	}
}
