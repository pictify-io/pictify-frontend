/**
 * Format TTL seconds into human-readable string
 * @param {number} seconds - TTL in seconds
 * @returns {string} Formatted string like "5 minutes", "2 hours", etc.
 */
export const formatTtl = (seconds) => {
	if (!seconds) return 'N/A';
	if (seconds < 60) return `${seconds} seconds`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
	return `${Math.floor(seconds / 86400)} days`;
};
