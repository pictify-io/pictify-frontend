/**
 * Background Remover Configuration
 *
 * Uses backend API with powerful server-side AI processing
 * Better quality, faster, and works on all devices!
 */

// Get API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const BACKGROUND_REMOVER_CONFIG = {
	// API endpoint
	apiUrl: `${API_URL}/api/background-removal`,

	// Model configuration (processed on server)
	model: 'medium', // 'small', 'medium' (recommended), or 'large'

	// Optimization settings
	optimize: true // Enable server-side optimization

	// Server processes with better models and faster performance
};

/**
 * Check if background remover is available
 */
export function isBackgroundRemoverAvailable() {
	return true; // Always available via backend API
}

/**
 * Get model info
 */
export function getModelInfo() {
	const models = {
		small: {
			speed: 'Fast (2-3s)',
			quality: 'Good',
			recommended: 'Quick edits'
		},
		medium: {
			speed: 'Moderate (3-5s)',
			quality: 'Excellent',
			recommended: 'Most use cases (default)'
		},
		large: {
			speed: 'Slower (5-8s)',
			quality: 'Best',
			recommended: 'Professional work'
		}
	};

	return models[BACKGROUND_REMOVER_CONFIG.model] || models.medium;
}

/**
 * Benefits of server-side processing
 */
export const SERVER_SIDE_BENEFITS = {
	fasterProcessing: 'Powerful server hardware = faster results',
	betterQuality: 'Advanced models for superior quality',
	allDevices: 'Works great on mobile and low-end devices',
	noDownload: 'No model download needed - instant start',
	optimized: 'Automatic image optimization'
};
