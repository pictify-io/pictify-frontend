import { writable } from 'svelte/store';
import {
	getExperiments,
	getExperiment,
	createExperiment,
	updateExperiment,
	deleteExperiment,
	startExperiment,
	pauseExperiment,
	completeExperiment,
	duplicateExperiment,
	getExperimentAnalytics,
	getExperimentQuota,
	checkSlugAvailability
} from '../api/experiments';

// ============== Factory Functions ==============

/**
 * Create a fresh default experiment state object
 * @returns {Object} Default experiment configuration
 */
export const createDefaultExperiment = () => ({
	uid: null,
	type: 'ab_test',
	name: '',
	slug: '',
	status: 'draft',
	templateUid: null,
	variants: [],
	goalConfig: { type: 'impressions_only', destinationUrl: '' },
	banditConfig: {
		enabled: false,
		algorithm: 'thompson_sampling',
		warmupImpressions: 50,
		recomputeIntervalMinutes: 15
	},
	hypothesis: '',
	minimumSampleSize: 1000,
	confidenceThreshold: 0.95,
	outputConfig: { format: 'png', quality: 90 },
	startAt: null,
	endAt: null
});

// ============== Stores ==============

// Current experiment being viewed/edited
export const experiment = writable(createDefaultExperiment());

// List of experiments
export const experiments = writable([]);

// Experiment quota/limits
export const experimentQuota = writable({ limits: {}, counts: {} });

// Analytics data for current experiment
export const experimentAnalytics = writable(null);

// Loading state (counter-based to handle concurrent operations)
let _loadingCount = 0;
export const experimentLoading = writable(false);
const startLoading = () => {
	_loadingCount++;
	experimentLoading.set(true);
};
const stopLoading = () => {
	_loadingCount = Math.max(0, _loadingCount - 1);
	if (_loadingCount === 0) experimentLoading.set(false);
};

// ============== Experiment Actions ==============

/**
 * Fetch all experiments (with optional filters)
 */
export const getExperimentsAction = async (params = {}) => {
	startLoading();
	try {
		const response = await getExperiments(params);
		if (!response?.experiments) {
			experiments.set([]);
			return [];
		}
		experiments.set(response.experiments);
		return response.experiments;
	} catch (error) {
		experiments.set([]);
		return [];
	} finally {
		stopLoading();
	}
};

/**
 * Fetch a single experiment by UID
 */
export const getExperimentAction = async (uid) => {
	startLoading();
	try {
		const response = await getExperiment(uid);
		if (!response?.experiment) {
			experiment.set(createDefaultExperiment());
			return null;
		}
		experiment.set(response.experiment);
		return response.experiment;
	} catch (error) {
		return null;
	} finally {
		stopLoading();
	}
};

/**
 * Create a new experiment
 */
export const createExperimentAction = async (data) => {
	startLoading();
	try {
		const response = await createExperiment(data);
		if (!response?.experiment) {
			throw new Error('Failed to create experiment');
		}
		// Add to list
		experiments.update((e) => [...e, response.experiment]);
		experiment.set(response.experiment);
		return response.experiment;
	} catch (error) {
		throw error;
	} finally {
		stopLoading();
	}
};

/**
 * Update an experiment
 */
export const updateExperimentAction = async (uid, updates) => {
	startLoading();
	try {
		const response = await updateExperiment(uid, updates);
		if (!response?.experiment) {
			throw new Error('Failed to update experiment');
		}
		// Update in list
		experiments.update((e) => {
			const index = e.findIndex((item) => item.uid === uid);
			if (index !== -1) {
				e[index] = response.experiment;
			}
			return [...e];
		});
		experiment.set(response.experiment);
		return response.experiment;
	} catch (error) {
		throw error;
	} finally {
		stopLoading();
	}
};

/**
 * Delete an experiment
 */
export const deleteExperimentAction = async (uid) => {
	startLoading();
	try {
		await deleteExperiment(uid);
		experiments.update((e) => e.filter((item) => item.uid !== uid));
		return true;
	} catch (error) {
		throw error;
	} finally {
		stopLoading();
	}
};

/**
 * Create an experiment status change action
 * @param {Function} apiFunc - The API function to call
 * @param {string} actionName - Name for error logging
 * @returns {Function} Action function
 */
const createExperimentStatusAction =
	(apiFunc, actionName) =>
	async (uid, ...args) => {
		startLoading();
		try {
			const response = await apiFunc(uid, ...args);
			if (response?.experiment) {
				experiments.update((e) => {
					const index = e.findIndex((item) => item.uid === uid);
					if (index !== -1) {
						e[index] = response.experiment;
					}
					return [...e];
				});
				experiment.update((e) => (e.uid === uid ? response.experiment : e));
			}
			return response?.experiment;
		} catch (error) {
			throw error;
		} finally {
			stopLoading();
		}
	};

/**
 * Start an experiment
 */
export const startExperimentAction = createExperimentStatusAction(startExperiment, 'starting');

/**
 * Pause an experiment
 */
export const pauseExperimentAction = createExperimentStatusAction(pauseExperiment, 'pausing');

/**
 * Complete an experiment with a winner variant
 */
export const completeExperimentAction = createExperimentStatusAction(
	completeExperiment,
	'completing'
);

/**
 * Duplicate an experiment
 */
export const duplicateExperimentAction = async (uid) => {
	startLoading();
	try {
		const response = await duplicateExperiment(uid);
		if (!response?.experiment) {
			throw new Error('Failed to duplicate experiment');
		}
		// Add duplicated experiment to list
		experiments.update((e) => [...e, response.experiment]);
		return response.experiment;
	} catch (error) {
		throw error;
	} finally {
		stopLoading();
	}
};

/**
 * Fetch analytics for an experiment
 */
export const getExperimentAnalyticsAction = async (uid) => {
	startLoading();
	try {
		const response = await getExperimentAnalytics(uid);
		experimentAnalytics.set(response);
		return response;
	} catch (error) {
		experimentAnalytics.set(null);
		return null;
	} finally {
		stopLoading();
	}
};

/**
 * Fetch experiment quota/limits
 */
export const getExperimentQuotaAction = async () => {
	startLoading();
	try {
		const response = await getExperimentQuota();
		experimentQuota.set(response);
		return response;
	} catch (error) {
		experimentQuota.set({ limits: {}, counts: {} });
		return null;
	} finally {
		stopLoading();
	}
};

/**
 * Check if an experiment slug is available
 */
export const checkSlugAction = async (slug) => {
	try {
		const response = await checkSlugAvailability(slug);
		return response;
	} catch (error) {
		throw error;
	}
};

// ============== Reset Actions ==============

/**
 * Reset experiment store to initial state
 */
export const resetExperimentStore = () => {
	experiment.set(createDefaultExperiment());
	experiments.set([]);
	experimentQuota.set({ limits: {}, counts: {} });
	experimentAnalytics.set(null);
	_loadingCount = 0;
	experimentLoading.set(false);
};
