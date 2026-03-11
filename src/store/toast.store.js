import { writable, derived } from 'svelte/store';

// Queue-based toast system - supports stacking up to 3 toasts
const toastQueue = writable([]);

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success' | 'error' | 'warning' | 'default'
 * @param {number} duration - Auto-dismiss duration in ms (default 3000)
 */
export function showToast(message, type = 'default', duration = 3000) {
	toastQueue.update((q) => {
		const newQueue = [...q, { id: Date.now() + Math.random(), message, type, duration }];
		// Keep max 5 in queue, oldest get dropped
		return newQueue.slice(-5);
	});
}

/**
 * Dismiss a specific toast by ID
 */
export function dismissToast(id) {
	toastQueue.update((q) => q.filter((t) => t.id !== id));
}

/**
 * Clear all toasts
 */
export function clearToasts() {
	toastQueue.set([]);
}

// Visible toasts - max 3 shown at once
export const visibleToasts = derived(toastQueue, ($q) => $q.slice(-3));

// Backward compatibility: single-slot toast store
// Writing to this store adds to the queue
export const toast = {
	set(value) {
		if (value) {
			showToast(value.message, value.type || 'default', value.duration || 3000);
		}
	},
	subscribe: toastQueue.subscribe,
	update: toastQueue.update
};

export { toastQueue };
