/**
 * Color palette generation utilities
 * Generates harmonious color schemes based on color theory
 */

/**
 * Convert hex color to HSL
 * @param {string} hex - Hex color string (e.g., '#FF5733')
 * @returns {{ h: number, s: number, l: number }}
 */
function hexToHSL(hex) {
	// Remove # if present
	hex = hex.replace('#', '');

	// Parse RGB values
	const r = parseInt(hex.substring(0, 2), 16) / 255;
	const g = parseInt(hex.substring(2, 4), 16) / 255;
	const b = parseInt(hex.substring(4, 6), 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h,
		s,
		l = (max + min) / 2;

	if (max === min) {
		h = s = 0; // achromatic
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / d + 2) / 6;
				break;
			case b:
				h = ((r - g) / d + 4) / 6;
				break;
		}
	}

	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100)
	};
}

/**
 * Convert HSL to hex color
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Hex color string
 */
function hslToHex(h, s, l) {
	s = Math.max(0, Math.min(100, s)) / 100;
	l = Math.max(0, Math.min(100, l)) / 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let r = 0,
		g = 0,
		b = 0;

	if (h >= 0 && h < 60) {
		r = c;
		g = x;
		b = 0;
	} else if (h >= 60 && h < 120) {
		r = x;
		g = c;
		b = 0;
	} else if (h >= 120 && h < 180) {
		r = 0;
		g = c;
		b = x;
	} else if (h >= 180 && h < 240) {
		r = 0;
		g = x;
		b = c;
	} else if (h >= 240 && h < 300) {
		r = x;
		g = 0;
		b = c;
	} else {
		r = c;
		g = 0;
		b = x;
	}

	const toHex = (n) => {
		const hex = Math.round((n + m) * 255).toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Generate complementary color palette (2 colors, 180° apart)
 */
function generateComplementary(hsl) {
	return [hslToHex(hsl.h, hsl.s, hsl.l), hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l)];
}

/**
 * Generate analogous color palette (3 colors, 30° apart)
 */
function generateAnalogous(hsl) {
	return [
		hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
		hslToHex(hsl.h, hsl.s, hsl.l),
		hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l)
	];
}

/**
 * Generate triadic color palette (3 colors, 120° apart)
 */
function generateTriadic(hsl) {
	return [
		hslToHex(hsl.h, hsl.s, hsl.l),
		hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
		hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l)
	];
}

/**
 * Generate tetradic color palette (4 colors, 90° apart)
 */
function generateTetradic(hsl) {
	return [
		hslToHex(hsl.h, hsl.s, hsl.l),
		hslToHex((hsl.h + 90) % 360, hsl.s, hsl.l),
		hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
		hslToHex((hsl.h + 270) % 360, hsl.s, hsl.l)
	];
}

/**
 * Generate monochromatic color palette (variations of same hue)
 */
function generateMonochromatic(hsl) {
	return [
		hslToHex(hsl.h, Math.max(0, hsl.s * 0.3), Math.min(100, hsl.l * 1.2)),
		hslToHex(hsl.h, Math.max(0, hsl.s * 0.6), hsl.l),
		hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l * 0.8)),
		hslToHex(hsl.h, Math.min(100, hsl.s * 1.2), Math.max(0, hsl.l * 0.6))
	];
}

/**
 * Generate color palette based on harmony type
 * @param {string} baseColor - Base color in hex format
 * @param {string} type - Palette type: complementary, analogous, triadic, tetradic, monochromatic
 * @returns {string[]} Array of hex colors
 */
export function generatePalette(baseColor, type = 'complementary') {
	const hsl = hexToHSL(baseColor);

	switch (type) {
		case 'complementary':
			return generateComplementary(hsl);
		case 'analogous':
			return generateAnalogous(hsl);
		case 'triadic':
			return generateTriadic(hsl);
		case 'tetradic':
			return generateTetradic(hsl);
		case 'monochromatic':
			return generateMonochromatic(hsl);
		default:
			return [baseColor];
	}
}

/**
 * Extract all colors used in a Fabric.js canvas
 * @param {fabric.Canvas} fabricCanvas - Fabric.js canvas instance
 * @returns {string[]} Array of unique hex colors
 */
export function extractCanvasColors(fabricCanvas) {
	const colors = new Set();

	if (!fabricCanvas) return [];

	// Extract colors from all objects
	fabricCanvas.getObjects().forEach((obj) => {
		// Fill colors (solid)
		if (obj.fill && typeof obj.fill === 'string' && obj.fill.toLowerCase() !== 'transparent') {
			colors.add(obj.fill.toUpperCase());
		}

		// Stroke colors
		if (
			obj.stroke &&
			typeof obj.stroke === 'string' &&
			obj.stroke.toLowerCase() !== 'transparent'
		) {
			colors.add(obj.stroke.toUpperCase());
		}

		// Shadow colors
		if (obj.shadow && obj.shadow.color) {
			colors.add(obj.shadow.color.toUpperCase());
		}

		// Text shadow color (for text objects)
		if (obj.textShadow && typeof obj.textShadow === 'string') {
			// Extract color from text shadow string (format: "color offsetX offsetY blur")
			const parts = obj.textShadow.split(' ');
			if (parts[0] && parts[0].startsWith('#')) {
				colors.add(parts[0].toUpperCase());
			}
		}
	});

	// Background color
	if (
		fabricCanvas.backgroundColor &&
		typeof fabricCanvas.backgroundColor === 'string' &&
		fabricCanvas.backgroundColor.toLowerCase() !== 'transparent'
	) {
		colors.add(fabricCanvas.backgroundColor.toUpperCase());
	}

	return Array.from(colors);
}

/**
 * Find the dominant (most visually significant) color from a list
 * Uses saturation and lightness to avoid pure white/black
 * @param {string[]} colors - Array of hex colors
 * @returns {string} Dominant color in hex format
 */
export function findDominantColor(colors) {
	if (!colors || colors.length === 0) return '#000000';
	if (colors.length === 1) return colors[0];

	// Convert to HSL and calculate visual significance score
	const colorData = colors.map((hex) => {
		const hsl = hexToHSL(hex);
		// Normalize values to 0-1 range
		const s = hsl.s / 100;
		const l = hsl.l / 100;

		// Score: prioritize saturation, then mid-lightness
		// High saturation is most important (colors vs grays)
		// Mid lightness is preferred (avoid pure white/black)
		const saturationWeight = s * s; // Square to heavily favor saturated colors
		const lightnessScore = 1 - Math.abs(l - 0.5) * 2; // 1 at 50%, 0 at 0%/100%
		const score = saturationWeight * lightnessScore;

		return { hex, hsl, score };
	});

	// Sort by score (highest first)
	colorData.sort((a, b) => b.score - a.score);


	return colorData[0].hex;
}

/**
 * Generate palette from ALL canvas colors using smart analysis
 * @param {string[]} canvasColors - Array of all canvas colors
 * @param {string} type - Palette type: complementary, analogous, triadic, tetradic
 * @returns {string[]} Array of hex colors
 */
export function generateCanvasPalette(canvasColors, type = 'complementary') {
	if (!canvasColors || canvasColors.length === 0) {
		return generatePalette('#000000', type);
	}

	// Find most visually significant color
	const dominantColor = findDominantColor(canvasColors);

	// Generate harmony based on dominant color
	return generatePalette(dominantColor, type);
}
