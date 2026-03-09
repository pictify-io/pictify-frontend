/**
 * Brand Fonts Loader
 *
 * Loads custom fonts from brand assets into the page for use in canvas editor.
 * Fetches @font-face CSS from the backend and injects it into the document head.
 * The backend CSS uses proxy URLs for font files to avoid CORS issues with S3/CDN.
 */

import { PUBLIC_BACKEND_URL } from '$env/static/public';

let fontsLoaded = false;
let loadedFontFamilies = [];

/**
 * Fetch brand fonts CSS directly (backend returns text/css, not JSON)
 */
async function fetchBrandFontsCSS() {
	const response = await fetch(`${PUBLIC_BACKEND_URL}/brand-assets/fonts/css`, {
		credentials: 'include',
		headers: { 'Accept': 'text/css' }
	});
	if (!response.ok) return '';
	return await response.text();
}

/**
 * Load brand fonts CSS into the page
 * @returns {Promise<Array>} List of loaded font families
 */
export async function loadBrandFonts() {
	if (fontsLoaded) {
		return loadedFontFamilies;
	}

	try {
		const css = await fetchBrandFontsCSS();

		// Parse font families from CSS — check if there are actual @font-face rules
		const fontFaceRegex = /@font-face\s*\{[^}]*font-family:\s*['"]([^'"]+)['"]/g;
		const families = [];
		let match;

		while ((match = fontFaceRegex.exec(css)) !== null) {
			const family = match[1];
			if (!families.includes(family)) {
				families.push(family);
			}
		}

		if (families.length === 0) {
			fontsLoaded = true;
			return [];
		}

		// Inject CSS into <head> — font URLs are backend proxy URLs with CORS headers
		let styleElement = document.getElementById('brand-fonts-css');
		if (!styleElement) {
			styleElement = document.createElement('style');
			styleElement.id = 'brand-fonts-css';
			document.head.appendChild(styleElement);
		}
		styleElement.textContent = css;

		// Force-load each font at common weights so FabricJS can use them immediately
		const weights = ['400', '700'];
		const loadPromises = families.flatMap(family =>
			weights.map(w => document.fonts.load(`${w} 12px "${family}"`).catch(() => null))
		);
		await Promise.all(loadPromises);

		// Also wait for the global fonts.ready (covers all weights/styles)
		await document.fonts.ready;

		loadedFontFamilies = families;
		fontsLoaded = true;

		console.log('Brand fonts loaded:', families);
		return families;

	} catch (error) {
		console.error('Error loading brand fonts:', error);
		fontsLoaded = true;
		return [];
	}
}

/**
 * Get list of loaded brand font families
 * @returns {Array} List of font family names
 */
export function getBrandFontFamilies() {
	return loadedFontFamilies;
}

/**
 * Check if a font family is a brand font
 * @param {string} fontFamily - Font family name to check
 * @returns {boolean} True if it's a brand font
 */
export function isBrandFont(fontFamily) {
	return loadedFontFamilies.some(family =>
		family.toLowerCase() === fontFamily.toLowerCase()
	);
}

/**
 * Reload brand fonts (useful after uploading new font)
 */
export async function reloadBrandFonts() {
	fontsLoaded = false;
	loadedFontFamilies = [];
	return await loadBrandFonts();
}
