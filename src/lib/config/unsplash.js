/**
 * Unsplash API Configuration
 * 
 * To use the Stock Photos feature with unlimited access:
 * 1. Create a free Unsplash account at https://unsplash.com/developers
 * 2. Create a new application
 * 3. Copy your Access Key
 * 4. Replace 'YOUR_UNSPLASH_ACCESS_KEY' below with your actual key
 * 
 * Note: Without an API key, the app will use demo photos from Lorem Picsum
 */

export const UNSPLASH_CONFIG = {
	// Replace with your Unsplash Access Key
	ACCESS_KEY: '5zzFotgvc92yVIawhWorFdUscFVVu9OIW4Hs4ZAwUgI',
	
	// API endpoints
	API_BASE_URL: 'https://api.unsplash.com',
	
	// Default search parameters
	DEFAULT_PER_PAGE: 20,
	
	// App attribution (required by Unsplash)
	APP_NAME: 'html-to-gif',
	UTM_SOURCE: 'pictify',
	UTM_MEDIUM: 'referral'
};

/**
 * Check if Unsplash API is properly configured
 */
export function isUnsplashConfigured() {
	return UNSPLASH_CONFIG.ACCESS_KEY !== 'YOUR_UNSPLASH_ACCESS_KEY' && 
	       UNSPLASH_CONFIG.ACCESS_KEY.length > 0;
}

/**
 * Get attribution URL for Unsplash
 */
export function getUnsplashAttributionUrl() {
	return `https://unsplash.com?utm_source=${UNSPLASH_CONFIG.UTM_SOURCE}&utm_medium=${UNSPLASH_CONFIG.UTM_MEDIUM}`;
}

