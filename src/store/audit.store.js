import { writable, get } from 'svelte/store';
import {
	fetchAuditLogs,
	fetchAuditSummary,
	fetchResourceLogs,
	exportAuditLogs
} from '../api/audit';

// Store for audit logs
export const auditLogs = writable({
	logs: [],
	total: 0,
	limit: 50,
	offset: 0,
	hasMore: false,
	isLoading: false,
	error: null,
	filters: {
		category: '',
		action: '',
		status: '',
		startDate: '',
		endDate: ''
	}
});

// Store for audit summary
export const auditSummary = writable({
	byCategory: {},
	byAction: {},
	byStatus: {},
	timeline: [],
	totalLogs: 0,
	totalRenders: 0,
	totalIntegrations: 0,
	isLoading: false,
	error: null
});

/**
 * Fetch audit logs with current filters
 */
export async function fetchLogs(options = {}) {
	auditLogs.update((state) => ({ ...state, isLoading: true, error: null }));

	try {
		const currentState = get(auditLogs);

		const params = {
			...currentState.filters,
			...options,
			limit: options.limit || currentState.limit,
			offset: options.offset !== undefined ? options.offset : currentState.offset
		};

		// Remove empty filters
		Object.keys(params).forEach((key) => {
			if (params[key] === '' || params[key] === null || params[key] === undefined) {
				delete params[key];
			}
		});

		const result = await fetchAuditLogs(params);

		auditLogs.update((state) => ({
			...state,
			logs: result.logs,
			total: result.total,
			limit: result.limit,
			offset: result.offset,
			hasMore: result.hasMore,
			isLoading: false
		}));

		return result;
	} catch (error) {
		auditLogs.update((state) => ({
			...state,
			isLoading: false,
			error: error.message || 'Failed to fetch audit logs'
		}));
		throw error;
	}
}

/**
 * Update filters and refetch logs
 */
export async function updateFilters(newFilters) {
	auditLogs.update((state) => ({
		...state,
		filters: { ...state.filters, ...newFilters },
		offset: 0 // Reset pagination when filters change
	}));

	return fetchLogs({ offset: 0 });
}

/**
 * Clear all filters
 */
export async function clearFilters() {
	auditLogs.update((state) => ({
		...state,
		filters: {
			category: '',
			action: '',
			status: '',
			startDate: '',
			endDate: ''
		},
		offset: 0
	}));

	return fetchLogs({ offset: 0 });
}

/**
 * Load more logs (pagination)
 */
export async function loadMore() {
	const currentState = get(auditLogs);

	if (!currentState.hasMore || currentState.isLoading) {
		return;
	}

	const newOffset = currentState.offset + currentState.limit;
	return fetchLogs({ offset: newOffset });
}

/**
 * Go to specific page
 */
export async function goToPage(page) {
	const currentState = get(auditLogs);

	const newOffset = (page - 1) * currentState.limit;
	return fetchLogs({ offset: newOffset });
}

/**
 * Fetch audit summary statistics
 */
export async function fetchSummary(options = {}) {
	auditSummary.update((state) => ({ ...state, isLoading: true, error: null }));

	try {
		const result = await fetchAuditSummary(options);

		auditSummary.update((state) => ({
			...state,
			byCategory: result.byCategory || {},
			byAction: result.byAction || {},
			byStatus: result.byStatus || {},
			timeline: result.timeline || [],
			totalLogs: result.totalLogs || 0,
			totalRenders: result.totalRenders || 0,
			totalIntegrations: result.totalIntegrations || 0,
			isLoading: false
		}));

		return result;
	} catch (error) {
		auditSummary.update((state) => ({
			...state,
			isLoading: false,
			error: error.message || 'Failed to fetch audit summary'
		}));
		throw error;
	}
}

/**
 * Export audit logs
 */
export async function exportLogs(options = {}) {
	try {
		const currentState = get(auditLogs);

		const params = {
			...currentState.filters,
			...options
		};

		// Remove empty filters
		Object.keys(params).forEach((key) => {
			if (params[key] === '' || params[key] === null || params[key] === undefined) {
				delete params[key];
			}
		});

		const result = await exportAuditLogs(params);
		return result;
	} catch (error) {
		throw error;
	}
}

/**
 * Fetch logs for a specific resource
 */
export async function fetchLogsForResource(resourceId, options = {}) {
	try {
		const result = await fetchResourceLogs(resourceId, options);
		return result;
	} catch (error) {
		throw error;
	}
}
