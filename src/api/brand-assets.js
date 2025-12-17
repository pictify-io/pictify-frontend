/**
 * Brand Assets API
 * 
 * API functions for managing user's brand assets (logos, fonts, colors, images)
 */

import backend from '../service/backend';

/**
 * Get all brand assets for the current user
 * @param {Object} options - Query options
 * @param {string} options.type - Filter by asset type
 * @param {string} options.tag - Filter by tag
 * @param {number} options.limit - Max results
 * @param {number} options.offset - Pagination offset
 */
export async function getBrandAssets({ type, tag, limit = 50, offset = 0 } = {}) {
	try {
		const params = new URLSearchParams();
		if (type) params.append('type', type);
		if (tag) params.append('tag', tag);
		params.append('limit', limit);
		params.append('offset', offset);
		
		const response = await backend.get(`/brand-assets?${params.toString()}`);
		return response;
	} catch (error) {
		console.error('Error fetching brand assets:', error);
		return { 
			assets: [], 
			pagination: { total: 0, limit, offset, hasMore: false },
			counts: {},
			limits: {}
		};
	}
}

/**
 * Get a single brand asset by uid
 * @param {string} uid - Asset uid
 */
export async function getBrandAsset(uid) {
	try {
		const response = await backend.get(`/brand-assets/${uid}`);
		return response.asset;
	} catch (error) {
		console.error('Error fetching brand asset:', error);
		throw error;
	}
}

/**
 * Upload a brand asset (logo, image, icon, font)
 * @param {File} file - File to upload
 * @param {Object} options - Asset options
 * @param {string} options.type - Asset type (logo, image, icon, font)
 * @param {string} options.name - Asset name
 * @param {string} options.description - Asset description
 * @param {string[]} options.tags - Asset tags
 * @param {boolean} options.isPrimary - Is primary asset
 */
export async function uploadBrandAsset(file, { type = 'image', name, description, tags = [], isPrimary = false } = {}) {
	try {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('type', type);
		formData.append('name', name || file.name);
		if (description) formData.append('description', description);
		if (tags.length) formData.append('tags', JSON.stringify(tags));
		formData.append('isPrimary', isPrimary.toString());
		
		const response = await backend.postFormData('/brand-assets/upload', formData);
		return response;
	} catch (error) {
		console.error('Error uploading brand asset:', error);
		throw error;
	}
}

/**
 * Add a color to brand assets
 * @param {Object} color - Color object
 * @param {string} color.name - Color name
 * @param {string} color.value - Hex color value
 * @param {string} color.category - Color category
 * @param {string} color.description - Color description
 * @param {boolean} color.isPrimary - Is primary color
 */
export async function addBrandColor({ name, value, category, description, isPrimary = false }) {
	try {
		const response = await backend.post('/brand-assets/color', {
			name,
			value,
			category,
			description,
			isPrimary
		});
		return response;
	} catch (error) {
		console.error('Error adding brand color:', error);
		throw error;
	}
}

/**
 * Update a brand asset
 * @param {string} uid - Asset uid
 * @param {Object} updates - Update fields
 */
export async function updateBrandAsset(uid, updates) {
	try {
		const response = await backend.put(`/brand-assets/${uid}`, updates);
		return response;
	} catch (error) {
		console.error('Error updating brand asset:', error);
		throw error;
	}
}

/**
 * Delete a brand asset
 * @param {string} uid - Asset uid
 */
export async function deleteBrandAsset(uid) {
	try {
		const response = await backend.delete(`/brand-assets/${uid}`);
		return response;
	} catch (error) {
		console.error('Error deleting brand asset:', error);
		throw error;
	}
}

/**
 * Delete multiple brand assets
 * @param {string[]} uids - Asset uids to delete
 */
export async function deleteBrandAssets(uids) {
	try {
		const response = await backend.post('/brand-assets/bulk-delete', { uids });
		return response;
	} catch (error) {
		console.error('Error deleting brand assets:', error);
		throw error;
	}
}

/**
 * Get CSS for custom fonts
 * Returns CSS @font-face rules for user's uploaded fonts
 */
export async function getBrandFontsCSS() {
	try {
		const response = await backend.get('/brand-assets/fonts/css', { 
			responseType: 'text' 
		});
		return response;
	} catch (error) {
		console.error('Error fetching brand fonts CSS:', error);
		return '';
	}
}

/**
 * Asset type icons for UI
 */
export const ASSET_TYPE_ICONS = {
	logo: 'fa-crown',
	font: 'fa-font',
	color: 'fa-palette',
	image: 'fa-image',
	icon: 'fa-icons'
};

/**
 * Asset type labels for UI
 */
export const ASSET_TYPE_LABELS = {
	logo: 'Logo',
	font: 'Font',
	color: 'Color',
	image: 'Image',
	icon: 'Icon'
};

/**
 * Color category labels
 */
export const COLOR_CATEGORIES = {
	primary: 'Primary',
	secondary: 'Secondary',
	accent: 'Accent',
	background: 'Background',
	text: 'Text',
	other: 'Other'
};

/**
 * Allowed file types for each asset type
 */
export const ALLOWED_FILE_TYPES = {
	logo: ['.png', '.jpg', '.jpeg', '.svg', '.webp'],
	image: ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'],
	icon: ['.png', '.svg', '.webp'],
	font: ['.ttf', '.otf', '.woff', '.woff2']
};

/**
 * Get accept string for file input
 */
export function getAcceptString(assetType) {
	return ALLOWED_FILE_TYPES[assetType]?.join(',') || 'image/*';
}

