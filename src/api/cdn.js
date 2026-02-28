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
      topTemplates: [],
    };
  }
}
