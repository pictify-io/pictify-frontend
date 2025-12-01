/**
 * Fonts API
 * 
 * API functions for font management
 */

import { PUBLIC_BACKEND_URL } from '$env/static/public';

const BACKEND_URL = PUBLIC_BACKEND_URL || 'http://localhost:3000';

/**
 * Get all available fonts
 */
export async function getAllFonts() {
  try {
    const response = await fetch(`${BACKEND_URL}/fonts`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch fonts');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching fonts:', error);
    // Return fallback fonts
    return {
      fonts: getFallbackFonts(),
      categories: ['sans-serif', 'serif', 'display', 'handwriting', 'monospace'],
      total: getFallbackFonts().length
    };
  }
}

/**
 * Get popular fonts only
 */
export async function getPopularFonts() {
  try {
    const response = await fetch(`${BACKEND_URL}/fonts/popular`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch popular fonts');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching popular fonts:', error);
    return { fonts: getFallbackFonts().filter(f => f.popular) };
  }
}

/**
 * Get fonts by category
 */
export async function getFontsByCategory(category) {
  try {
    const response = await fetch(`${BACKEND_URL}/fonts/category/${category}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch fonts by category');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching fonts by category:', error);
    return { category, fonts: [] };
  }
}

/**
 * Search fonts by name
 * @param {string} query - Search query
 * @param {boolean} extended - If true, also search Google Fonts API
 */
export async function searchFonts(query, extended = false) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/fonts/search?q=${encodeURIComponent(query)}&extended=${extended}`, 
      { credentials: 'include' }
    );
    
    if (!response.ok) {
      throw new Error('Failed to search fonts');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching fonts:', error);
    return { fonts: [], source: 'local' };
  }
}

/**
 * Add/validate a Google Font
 * @param {string} family - Font family name
 * @param {string} url - Optional Google Fonts URL
 */
export async function addGoogleFont(family, url = null) {
  try {
    const response = await fetch(`${BACKEND_URL}/fonts/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ family, url })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add font');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding font:', error);
    throw error;
  }
}

/**
 * Get system font alternatives
 */
export async function getSystemFontAlternatives() {
  try {
    const response = await fetch(`${BACKEND_URL}/fonts/system-alternatives`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch system font alternatives');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching system font alternatives:', error);
    return { alternatives: {} };
  }
}

/**
 * Preload a font for use in the browser
 */
export function preloadFont(fontFamily, weights = [400, 700]) {
  if (fontFamily === 'Arial' || fontFamily === 'sans-serif') return;
  
  const weightStr = weights.join(';');
  const encodedFamily = fontFamily.replace(/ /g, '+');
  
  // Check if already loaded
  const existingLink = document.querySelector(`link[href*="family=${encodedFamily}"]`);
  if (existingLink) return;
  
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weightStr}&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

/**
 * Preload multiple fonts
 */
export function preloadFonts(fonts) {
  fonts.forEach(font => {
    if (typeof font === 'string') {
      preloadFont(font);
    } else {
      preloadFont(font.family, font.weights);
    }
  });
}

/**
 * Build Google Fonts URL for a font
 */
export function getGoogleFontsUrl(fontFamily, weights = [400, 700]) {
  const weightStr = weights.join(';');
  const encodedFamily = fontFamily.replace(/ /g, '+');
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weightStr}&display=swap`;
}

/**
 * Fallback fonts when API is unavailable
 */
function getFallbackFonts() {
  return [
    { family: 'Roboto', category: 'sans-serif', weights: [400, 500, 700, 900], popular: true },
    { family: 'Open Sans', category: 'sans-serif', weights: [400, 600, 700], popular: true },
    { family: 'Montserrat', category: 'sans-serif', weights: [400, 500, 600, 700, 800, 900], popular: true },
    { family: 'Poppins', category: 'sans-serif', weights: [400, 500, 600, 700], popular: true },
    { family: 'Inter', category: 'sans-serif', weights: [400, 500, 600, 700], popular: true },
    { family: 'Oswald', category: 'sans-serif', weights: [400, 500, 600, 700], popular: true },
    { family: 'Lato', category: 'sans-serif', weights: [400, 700, 900], popular: true },
    { family: 'Playfair Display', category: 'serif', weights: [400, 700], popular: true },
    { family: 'Lora', category: 'serif', weights: [400, 700], popular: true },
    { family: 'Merriweather', category: 'serif', weights: [400, 700], popular: true },
    { family: 'Lobster', category: 'display', weights: [400], popular: true },
    { family: 'Pacifico', category: 'display', weights: [400], popular: true },
    { family: 'Dancing Script', category: 'handwriting', weights: [400, 700], popular: true },
    { family: 'Satisfy', category: 'handwriting', weights: [400], popular: true },
    { family: 'Bangers', category: 'display', weights: [400], popular: false },
    { family: 'Source Code Pro', category: 'monospace', weights: [400, 700], popular: true },
  ];
}

// Category icons for UI
export const CATEGORY_ICONS = {
  'sans-serif': 'fa-font',
  'serif': 'fa-book',
  'display': 'fa-heading',
  'handwriting': 'fa-signature',
  'monospace': 'fa-code',
};

// Category labels for UI
export const CATEGORY_LABELS = {
  'sans-serif': 'Sans Serif',
  'serif': 'Serif',
  'display': 'Display',
  'handwriting': 'Handwriting',
  'monospace': 'Monospace',
};

