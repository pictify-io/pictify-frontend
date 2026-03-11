import { writable, get } from 'svelte/store';
import { getCdnDashboard } from '../api/cdn';

export const cdnStore = writable({
	totalHits: 0,
	totalBytes: 0,
	totalAssets: 0,
	dailyStats: [],
	topReferrers: [],
	topCountries: [],
	topTemplates: [],
	loading: false,
	error: null,
	loaded: false
});

let _initPromise = null;

export const initCdnAnalytics = async () => {
	if (_initPromise) return _initPromise;

	const current = get(cdnStore);
	if (current.loaded) return current;

	_initPromise = _doInit();
	try {
		return await _initPromise;
	} finally {
		_initPromise = null;
	}
};

const _doInit = async () => {
	cdnStore.update((s) => ({ ...s, loading: true, error: null }));
	try {
		const data = await getCdnDashboard();
		cdnStore.set({
			...data,
			loading: false,
			error: null,
			loaded: true
		});
		return data;
	} catch (error) {
		cdnStore.update((s) => ({
			...s,
			loading: false,
			error: error.message
		}));
		return null;
	}
};

export const refreshCdnAnalytics = async () => {
	_initPromise = null;
	cdnStore.update((s) => ({ ...s, loaded: false }));
	return initCdnAnalytics();
};
