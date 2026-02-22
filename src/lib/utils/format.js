import { showToast } from '../../store/toast.store.js';

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

/**
 * Copy text to clipboard with toast feedback
 * @param {string} text - The text to copy
 * @param {string} [message='Copied to clipboard!'] - Success message
 */
export async function copyToClipboard(text, message = 'Copied to clipboard!') {
	try {
		await navigator.clipboard.writeText(text);
		showToast(message, 'success', 1500);
	} catch (err) {
		showToast('Failed to copy to clipboard', 'error', 2000);
	}
}

/**
 * Format a date string as relative time (Today, Yesterday, X days ago) or absolute date
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatRelativeDate(dateString) {
	const date = new Date(dateString);
	const now = new Date();
	const diffTime = Math.abs(now - date);
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 1) return 'Today';
	if (diffDays === 2) return 'Yesterday';
	if (diffDays <= 7) return `${diffDays - 1} days ago`;

	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a date string as short date + time
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date with time
 */
export function formatDateTime(dateString) {
	return new Date(dateString).toLocaleString('en-US', {
		month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
	});
}

/**
 * Format a number with K/M suffix for large values
 * @param {number} num - The number to format
 * @returns {string} Formatted number
 */
export function formatCompactNumber(num) {
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + 'M';
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(1) + 'K';
	}
	return num.toString();
}

/**
 * Generate page numbers array for pagination with ellipsis
 * @param {number} currentPage - Current active page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} [maxVisible=5] - Max visible page buttons
 * @returns {Array<number|string>} Array of page numbers and '...' ellipsis
 */
export function getPageNumbers(currentPage, totalPages, maxVisible = 5) {
	const pages = [];

	if (totalPages <= maxVisible) {
		for (let i = 1; i <= totalPages; i++) {
			pages.push(i);
		}
	} else {
		if (currentPage <= 3) {
			for (let i = 1; i <= 4; i++) pages.push(i);
			pages.push('...');
			pages.push(totalPages);
		} else if (currentPage >= totalPages - 2) {
			pages.push(1);
			pages.push('...');
			for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			pages.push('...');
			for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
			pages.push('...');
			pages.push(totalPages);
		}
	}

	return pages;
}
