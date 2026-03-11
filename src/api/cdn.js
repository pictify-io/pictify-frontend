import backend from '../service/backend';

/**
 * Get aggregated CDN analytics for the team dashboard
 * @returns {Promise<Object>} Aggregated CDN stats
 */
export async function getCdnDashboard() {
	try {
		return await backend.get('/api/cdn/dashboard');
	} catch (error) {
		console.error('Failed to get CDN dashboard:', error);
		return {
			totalHits: 0,
			totalBytes: 0,
			totalAssets: 0,
			dailyStats: [],
			topReferrers: [],
			topCountries: [],
			topTemplates: []
		};
	}
}

/**
 * Get detailed CDN analytics with per-asset breakdown
 * @param {Object} params - Query parameters
 * @param {string} params.range - Time range: '7d', '30d', '90d'
 * @param {string} params.sort - Sort by: 'hits', 'bytes', 'recent'
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 */
export async function getCdnAnalytics({ range = '30d', sort = 'hits', page = 1, limit = 20 } = {}) {
	try {
		const params = new URLSearchParams({ range, sort, page, limit });
		return await backend.get(`/api/cdn/analytics?${params}`);
	} catch (error) {
		console.error('Failed to get CDN analytics:', error);
		return {
			summary: {
				totalHits: 0,
				totalBytes: 0,
				totalAssets: 0,
				periodHits: 0,
				periodBytes: 0,
				periodUniqueIps: 0
			},
			dailyStats: [],
			topReferrers: [],
			topCountries: [],
			statusCodeBreakdown: { _200: 0, _304: 0, _other: 0 },
			assets: [],
			pagination: { page, limit, total: 0, totalPages: 0 }
		};
	}
}
