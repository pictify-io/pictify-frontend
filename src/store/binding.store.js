import { writable } from 'svelte/store';
import {
	getBindings,
	getBinding,
	getBindingsForTemplate,
	createBinding,
	updateBinding,
	deleteBinding,
	pauseBinding,
	resumeBinding,
	refreshBinding,
	getBindingStats,
	getDataSources,
	getDataSource,
	createDataSource,
	updateDataSource,
	deleteDataSource,
	testDataSource
} from '../api/binding';

// ============== Factory Functions ==============

/**
 * Create a fresh default binding state object
 * @returns {Object} Default binding configuration
 */
export const createDefaultBinding = () => ({
	uid: null,
	templateId: null,
	dataSourceId: null,
	mapping: {},
	defaults: {},
	refreshPolicy: { ttlSeconds: 300, onError: 'serve_stale' },
	outputConfig: { format: 'png', quality: 90 },
	status: 'active',
	dynamicUrl: null,
	lastRenderAt: null,
	lastFetchAt: null,
	lastError: null
});

// ============== Stores ==============

// Current binding being viewed/edited
export const binding = writable(createDefaultBinding());

// List of bindings (for template or all)
export const bindings = writable([]);

// Current data source being viewed/edited
export const dataSource = writable({
	uid: null,
	name: '',
	type: 'http',
	url: '',
	method: 'GET',
	headers: {},
	credentials: null
});

// List of all data sources
export const dataSources = writable([]);

// Loading states
export const bindingLoading = writable(false);
export const dataSourceLoading = writable(false);

// ============== Binding Actions ==============

/**
 * Fetch all bindings (optionally filtered by template)
 */
export const getBindingsAction = async (params = {}) => {
	bindingLoading.set(true);
	try {
		const response = params.templateId
			? await getBindingsForTemplate(params.templateId)
			: await getBindings(params);

		if (!response?.bindings) {
			bindings.set([]);
			return [];
		}
		bindings.set(response.bindings);
		return response.bindings;
	} catch (error) {
		bindings.set([]);
		return [];
	} finally {
		bindingLoading.set(false);
	}
};

/**
 * Fetch a single binding by ID
 */
export const getBindingAction = async (id) => {
	bindingLoading.set(true);
	try {
		const response = await getBinding(id);
		if (!response?.binding) {
			binding.set(createDefaultBinding());
			return null;
		}
		binding.set(response.binding);
		return response.binding;
	} catch (error) {
		return null;
	} finally {
		bindingLoading.set(false);
	}
};

/**
 * Create a new binding
 */
export const createBindingAction = async (bindingData) => {
	bindingLoading.set(true);
	try {
		const response = await createBinding(bindingData);
		if (!response?.binding) {
			throw new Error('Failed to create binding');
		}
		// Add to list
		bindings.update((b) => [...b, response.binding]);
		binding.set(response.binding);
		return response.binding;
	} catch (error) {
		throw error;
	} finally {
		bindingLoading.set(false);
	}
};

/**
 * Update a binding
 */
export const updateBindingAction = async (id, updates) => {
	bindingLoading.set(true);
	try {
		const response = await updateBinding(id, updates);
		if (!response?.binding) {
			throw new Error('Failed to update binding');
		}
		// Update in list
		bindings.update((b) => {
			const index = b.findIndex((item) => item.uid === id);
			if (index !== -1) {
				b[index] = response.binding;
			}
			return [...b];
		});
		binding.set(response.binding);
		return response.binding;
	} catch (error) {
		throw error;
	} finally {
		bindingLoading.set(false);
	}
};

/**
 * Delete a binding
 */
export const deleteBindingAction = async (id) => {
	bindingLoading.set(true);
	try {
		await deleteBinding(id);
		bindings.update((b) => b.filter((item) => item.uid !== id));
		return true;
	} catch (error) {
		throw error;
	} finally {
		bindingLoading.set(false);
	}
};

/**
 * Create a binding status change action
 * @param {Function} apiFunc - The API function to call (pauseBinding or resumeBinding)
 * @param {string} actionName - Name for error logging ('pausing' or 'resuming')
 * @returns {Function} Action function
 */
const createBindingStatusAction = (apiFunc, actionName) => async (id) => {
	try {
		const response = await apiFunc(id);
		if (response?.binding) {
			bindings.update((b) => {
				const index = b.findIndex((item) => item.uid === id);
				if (index !== -1) {
					b[index] = response.binding;
				}
				return [...b];
			});
			binding.update((b) => (b.uid === id ? response.binding : b));
		}
		return response?.binding;
	} catch (error) {
		throw error;
	}
};

/**
 * Pause a binding
 */
export const pauseBindingAction = createBindingStatusAction(pauseBinding, 'pausing');

/**
 * Resume a binding
 */
export const resumeBindingAction = createBindingStatusAction(resumeBinding, 'resuming');

/**
 * Force refresh a binding
 */
export const refreshBindingAction = async (id) => {
	try {
		const response = await refreshBinding(id);
		return response;
	} catch (error) {
		throw error;
	}
};

/**
 * Get binding stats
 */
export const getBindingStatsAction = async (id) => {
	try {
		const response = await getBindingStats(id);
		return response;
	} catch (error) {
		return null;
	}
};

// ============== Data Source Actions ==============

/**
 * Fetch all data sources
 */
export const getDataSourcesAction = async () => {
	dataSourceLoading.set(true);
	try {
		const response = await getDataSources();
		if (!response?.dataSources) {
			dataSources.set([]);
			return [];
		}
		dataSources.set(response.dataSources);
		return response.dataSources;
	} catch (error) {
		dataSources.set([]);
		return [];
	} finally {
		dataSourceLoading.set(false);
	}
};

/**
 * Fetch a single data source
 */
export const getDataSourceAction = async (id) => {
	dataSourceLoading.set(true);
	try {
		const response = await getDataSource(id);
		if (!response?.dataSource) {
			dataSource.set({
				uid: null,
				name: '',
				type: 'http',
				url: '',
				method: 'GET',
				headers: {},
				credentials: null
			});
			return null;
		}
		dataSource.set(response.dataSource);
		return response.dataSource;
	} catch (error) {
		return null;
	} finally {
		dataSourceLoading.set(false);
	}
};

/**
 * Create a data source
 */
export const createDataSourceAction = async (sourceData) => {
	dataSourceLoading.set(true);
	try {
		const response = await createDataSource(sourceData);
		if (!response?.dataSource) {
			throw new Error('Failed to create data source');
		}
		dataSources.update((ds) => [...ds, response.dataSource]);
		dataSource.set(response.dataSource);
		return response.dataSource;
	} catch (error) {
		throw error;
	} finally {
		dataSourceLoading.set(false);
	}
};

/**
 * Update a data source
 */
export const updateDataSourceAction = async (id, updates) => {
	dataSourceLoading.set(true);
	try {
		const response = await updateDataSource(id, updates);
		if (!response?.dataSource) {
			throw new Error('Failed to update data source');
		}
		dataSources.update((ds) => {
			const index = ds.findIndex((item) => item.uid === id);
			if (index !== -1) {
				ds[index] = response.dataSource;
			}
			return [...ds];
		});
		dataSource.set(response.dataSource);
		return response.dataSource;
	} catch (error) {
		throw error;
	} finally {
		dataSourceLoading.set(false);
	}
};

/**
 * Delete a data source
 */
export const deleteDataSourceAction = async (id) => {
	dataSourceLoading.set(true);
	try {
		await deleteDataSource(id);
		dataSources.update((ds) => ds.filter((item) => item.uid !== id));
		return true;
	} catch (error) {
		throw error;
	} finally {
		dataSourceLoading.set(false);
	}
};

/**
 * Test a data source configuration
 */
export const testDataSourceAction = async (sourceData) => {
	try {
		const response = await testDataSource(sourceData);
		return response;
	} catch (error) {
		throw error;
	}
};

// ============== Reset Actions ==============

/**
 * Reset binding store to initial state
 */
export const resetBindingStore = () => {
	binding.set(createDefaultBinding());
};

/**
 * Reset data source store to initial state
 */
export const resetDataSourceStore = () => {
	dataSource.set({
		uid: null,
		name: '',
		type: 'http',
		url: '',
		method: 'GET',
		headers: {},
		credentials: null
	});
};
