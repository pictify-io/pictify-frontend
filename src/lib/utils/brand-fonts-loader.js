/**
 * Brand Fonts Loader
 *
 * Loads custom fonts from brand assets into the page for use in canvas editor
 */

import { getBrandFontsCSS } from '../../api/brand-assets';

let fontsLoaded = false;
let loadedFontFamilies = [];

/**
 * Load brand fonts CSS into the page
 * @returns {Promise<Array>} List of loaded font families
 */
export async function loadBrandFonts() {
  if (fontsLoaded) {
    return loadedFontFamilies;
  }

  try {
    // Get CSS from backend
    const css = await getBrandFontsCSS();

    if (!css || css.trim() === '' || css.includes('/* Custom Brand Fonts */\n')) {
      // No custom fonts
      fontsLoaded = true;
      return [];
    }

    // Check if style element already exists
    let styleElement = document.getElementById('brand-fonts-css');

    if (!styleElement) {
      // Create and append style element
      styleElement = document.createElement('style');
      styleElement.id = 'brand-fonts-css';
      document.head.appendChild(styleElement);
    }

    // Update CSS content
    styleElement.textContent = css;

    // Parse font families from CSS
    const fontFaceRegex = /@font-face\s*{[^}]*font-family:\s*['"]([^'"]+)['"]/g;
    const families = [];
    let match;

    while ((match = fontFaceRegex.exec(css)) !== null) {
      const family = match[1];
      if (!families.includes(family)) {
        families.push(family);
      }
    }

    // Wait for fonts to load
    if (families.length > 0 && 'fonts' in document) {
      try {
        await document.fonts.ready;

        // Force load each font by creating invisible text elements
        for (const family of families) {
          const testEl = document.createElement('span');
          testEl.style.fontFamily = `'${family}'`;
          testEl.style.position = 'absolute';
          testEl.style.left = '-9999px';
          testEl.style.visibility = 'hidden';
          testEl.textContent = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          document.body.appendChild(testEl);

          // Give browser time to load font
          await new Promise(resolve => setTimeout(resolve, 50));

          document.body.removeChild(testEl);
        }
      } catch (e) {
        console.warn('Font loading API not fully supported, fonts may not be immediately available');
      }
    }

    loadedFontFamilies = families;
    fontsLoaded = true;

    console.log('Loaded brand fonts:', families);
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