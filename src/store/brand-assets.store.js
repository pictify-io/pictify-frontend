/**
 * Brand Assets Store
 * 
 * Svelte store for managing brand assets state
 */

import { writable, derived } from 'svelte/store';
import { 
	getBrandAssets, 
	uploadBrandAsset, 
	addBrandColor, 
	updateBrandAsset, 
	deleteBrandAsset,
	deleteBrandAssets 
} from '../api/brand-assets';

// Main brand assets store
export const brandAssets = writable({
	assets: [],
	pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
	counts: {},
	limits: {},
	loading: false,
	error: null,
	selectedType: null
});

// Derived stores for filtered assets
export const logos = derived(brandAssets, $store => 
	$store.assets.filter(a => a.type === 'logo')
);

export const fonts = derived(brandAssets, $store => 
	$store.assets.filter(a => a.type === 'font')
);

export const colors = derived(brandAssets, $store => 
	$store.assets.filter(a => a.type === 'color')
);

export const images = derived(brandAssets, $store => 
	$store.assets.filter(a => a.type === 'image')
);

export const icons = derived(brandAssets, $store => 
	$store.assets.filter(a => a.type === 'icon')
);

// Primary assets (featured)
export const primaryAssets = derived(brandAssets, $store => 
	$store.assets.filter(a => a.isPrimary)
);

/**
 * Fetch brand assets from API
 */
export async function fetchBrandAssets({ type, tag, limit = 50, offset = 0 } = {}) {
	brandAssets.update(s => ({ ...s, loading: true, error: null }));
	
	try {
		const response = await getBrandAssets({ type, tag, limit, offset });
		
		brandAssets.update(s => ({
			...s,
			assets: response.assets || [],
			pagination: response.pagination || { total: 0, limit, offset, hasMore: false },
			counts: response.counts || {},
			limits: response.limits || {},
			loading: false,
			selectedType: type || null
		}));
		
		return response;
	} catch (error) {
		brandAssets.update(s => ({
			...s,
			loading: false,
			error: error.message || 'Failed to load brand assets'
		}));
		throw error;
	}
}

/**
 * Upload a brand asset
 */
export async function uploadAsset(file, options) {
	try {
		const response = await uploadBrandAsset(file, options);
		
		if (response.success && response.asset) {
			brandAssets.update(s => ({
				...s,
				assets: [response.asset, ...s.assets],
				counts: {
					...s.counts,
					[response.asset.type]: (s.counts[response.asset.type] || 0) + 1
				},
				pagination: {
					...s.pagination,
					total: s.pagination.total + 1
				}
			}));
		}
		
		return response;
	} catch (error) {
		throw error;
	}
}

/**
 * Add a color to brand assets
 */
export async function addColor(colorData) {
	try {
		const response = await addBrandColor(colorData);
		
		if (response.success && response.asset) {
			brandAssets.update(s => ({
				...s,
				assets: [response.asset, ...s.assets],
				counts: {
					...s.counts,
					color: (s.counts.color || 0) + 1
				},
				pagination: {
					...s.pagination,
					total: s.pagination.total + 1
				}
			}));
		}
		
		return response;
	} catch (error) {
		throw error;
	}
}

/**
 * Update a brand asset
 */
export async function updateAsset(uid, updates) {
	try {
		const response = await updateBrandAsset(uid, updates);
		
		if (response.success && response.asset) {
			brandAssets.update(s => ({
				...s,
				assets: s.assets.map(a => a.uid === uid ? response.asset : a)
			}));
		}
		
		return response;
	} catch (error) {
		throw error;
	}
}

/**
 * Delete a brand asset
 */
export async function deleteAsset(uid) {
	try {
		const response = await deleteBrandAsset(uid);
		
		if (response.success) {
			brandAssets.update(s => {
				const deletedAsset = s.assets.find(a => a.uid === uid);
				return {
					...s,
					assets: s.assets.filter(a => a.uid !== uid),
					counts: deletedAsset ? {
						...s.counts,
						[deletedAsset.type]: Math.max(0, (s.counts[deletedAsset.type] || 1) - 1)
					} : s.counts,
					pagination: {
						...s.pagination,
						total: Math.max(0, s.pagination.total - 1)
					}
				};
			});
		}
		
		return response;
	} catch (error) {
		throw error;
	}
}

/**
 * Delete multiple brand assets
 */
export async function deleteAssets(uids) {
	try {
		const response = await deleteBrandAssets(uids);
		
		if (response.success) {
			brandAssets.update(s => {
				const remainingAssets = s.assets.filter(a => !uids.includes(a.uid));
				const deletedAssets = s.assets.filter(a => uids.includes(a.uid));
				
				// Update counts
				const newCounts = { ...s.counts };
				deletedAssets.forEach(a => {
					newCounts[a.type] = Math.max(0, (newCounts[a.type] || 1) - 1);
				});
				
				return {
					...s,
					assets: remainingAssets,
					counts: newCounts,
					pagination: {
						...s.pagination,
						total: Math.max(0, s.pagination.total - response.deleted)
					}
				};
			});
		}
		
		return response;
	} catch (error) {
		throw error;
	}
}

/**
 * Reset the store
 */
export function resetBrandAssets() {
	brandAssets.set({
		assets: [],
		pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
		counts: {},
		limits: {},
		loading: false,
		error: null,
		selectedType: null
	});
}

