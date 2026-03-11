/**
 * Design Intelligence Engine
 *
 * Analyzes canvas designs for quality, accessibility, and improvement opportunities.
 * Used by the Copilot to provide intelligent suggestions and critiques.
 */

// =============================================================================
// Color Utilities
// =============================================================================

/**
 * Parse a color string to RGB values
 * @param {string} color - Color string (hex, rgb, or named)
 * @returns {{r: number, g: number, b: number}|null}
 */
export function parseColor(color) {
	if (!color || color === 'transparent') return null;

	// Handle hex colors
	if (color.startsWith('#')) {
		const hex = color.slice(1);
		if (hex.length === 3) {
			return {
				r: parseInt(hex[0] + hex[0], 16),
				g: parseInt(hex[1] + hex[1], 16),
				b: parseInt(hex[2] + hex[2], 16)
			};
		}
		if (hex.length === 6) {
			return {
				r: parseInt(hex.slice(0, 2), 16),
				g: parseInt(hex.slice(2, 4), 16),
				b: parseInt(hex.slice(4, 6), 16)
			};
		}
	}

	// Handle rgb/rgba
	const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
	if (rgbMatch) {
		return {
			r: parseInt(rgbMatch[1], 10),
			g: parseInt(rgbMatch[2], 10),
			b: parseInt(rgbMatch[3], 10)
		};
	}

	// Named colors (common ones)
	const namedColors = {
		white: { r: 255, g: 255, b: 255 },
		black: { r: 0, g: 0, b: 0 },
		red: { r: 255, g: 0, b: 0 },
		green: { r: 0, g: 128, b: 0 },
		blue: { r: 0, g: 0, b: 255 },
		yellow: { r: 255, g: 255, b: 0 },
		orange: { r: 255, g: 165, b: 0 },
		purple: { r: 128, g: 0, b: 128 },
		gray: { r: 128, g: 128, b: 128 },
		grey: { r: 128, g: 128, b: 128 }
	};

	return namedColors[color.toLowerCase()] || null;
}

/**
 * Calculate relative luminance for WCAG contrast calculations
 * @param {{r: number, g: number, b: number}} rgb
 * @returns {number}
 */
export function getLuminance(rgb) {
	const sRGB = [rgb.r, rgb.g, rgb.b].map((val) => {
		val = val / 255;
		return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Calculate WCAG contrast ratio between two colors
 * @param {string} color1 - First color
 * @param {string} color2 - Second color
 * @returns {number} Contrast ratio (1-21)
 */
export function calculateContrastRatio(color1, color2) {
	const rgb1 = parseColor(color1);
	const rgb2 = parseColor(color2);

	if (!rgb1 || !rgb2) return 1;

	const l1 = getLuminance(rgb1);
	const l2 = getLuminance(rgb2);

	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);

	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Extract all unique colors from canvas elements
 * @param {object} canvasState - Fabric.js canvas JSON
 * @returns {string[]}
 */
export function extractColors(canvasState) {
	const colors = new Set();

	if (canvasState.background) {
		colors.add(canvasState.background);
	}

	for (const obj of canvasState.objects || []) {
		if (obj.fill && obj.fill !== 'transparent') colors.add(obj.fill);
		if (obj.stroke && obj.stroke !== 'transparent') colors.add(obj.stroke);
		if (obj.backgroundColor) colors.add(obj.backgroundColor);
	}

	return Array.from(colors);
}

// =============================================================================
// Accessibility Analysis
// =============================================================================

/**
 * Check WCAG 2.1 AA compliance for all text elements
 * @param {object} canvasState - Fabric.js canvas JSON
 * @returns {{passed: boolean, issues: object[]}}
 */
export function checkAccessibility(canvasState) {
	const issues = [];
	const background = canvasState.background || '#ffffff';

	for (const obj of canvasState.objects || []) {
		// Check text elements for contrast
		if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
			const textColor = obj.fill || '#000000';
			const bgColor = getElementBackground(obj, canvasState) || background;
			const contrast = calculateContrastRatio(textColor, bgColor);
			const fontSize = obj.fontSize || 16;

			// WCAG AA requirements
			const requiredContrast =
				fontSize >= 18 || (fontSize >= 14 && obj.fontWeight === 'bold') ? 3 : 4.5;

			if (contrast < requiredContrast) {
				issues.push({
					severity: contrast < 3 ? 'high' : 'medium',
					element: obj.id || obj.type,
					elementType: obj.type,
					issue: 'Insufficient color contrast',
					current: contrast.toFixed(2),
					required: requiredContrast,
					wcag: 'WCAG 2.1 1.4.3 (AA)',
					suggestion: `Increase contrast to at least ${requiredContrast}:1. Current: ${contrast.toFixed(
						2
					)}:1`
				});
			}
		}

		// Check for very small text
		if ((obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') && obj.fontSize) {
			if (obj.fontSize < 12) {
				issues.push({
					severity: 'medium',
					element: obj.id || obj.type,
					elementType: obj.type,
					issue: 'Text may be too small for readability',
					current: `${obj.fontSize}px`,
					required: '12px minimum',
					wcag: 'WCAG 2.1 1.4.4',
					suggestion: 'Consider increasing font size to at least 12px'
				});
			}
		}
	}

	return {
		passed: issues.length === 0,
		issues,
		score: Math.max(0, 100 - issues.length * 10)
	};
}

/**
 * Get the effective background color for an element
 * @param {object} element - Fabric.js element
 * @param {object} canvasState - Full canvas state
 * @returns {string}
 */
function getElementBackground(element, canvasState) {
	// Check if element has its own background
	if (element.backgroundColor) return element.backgroundColor;

	// Find elements that might be behind this one
	const objects = canvasState.objects || [];
	const elemIndex = objects.findIndex((o) => o === element);

	for (let i = elemIndex - 1; i >= 0; i--) {
		const obj = objects[i];
		if (obj.type === 'rect' && isElementOverlapping(element, obj)) {
			return obj.fill;
		}
	}

	return canvasState.background || '#ffffff';
}

/**
 * Check if two elements overlap
 */
function isElementOverlapping(el1, el2) {
	const rect1 = {
		left: el1.left || 0,
		top: el1.top || 0,
		right: (el1.left || 0) + (el1.width || 0),
		bottom: (el1.top || 0) + (el1.height || 0)
	};
	const rect2 = {
		left: el2.left || 0,
		top: el2.top || 0,
		right: (el2.left || 0) + (el2.width || 0),
		bottom: (el2.top || 0) + (el2.height || 0)
	};

	return !(
		rect1.right < rect2.left ||
		rect1.left > rect2.right ||
		rect1.bottom < rect2.top ||
		rect1.top > rect2.bottom
	);
}

// =============================================================================
// Visual Hierarchy Analysis
// =============================================================================

/**
 * Analyze visual hierarchy of the canvas
 * @param {object} canvasState - Fabric.js canvas JSON
 * @returns {object}
 */
export function analyzeVisualHierarchy(canvasState) {
	const elements = canvasState.objects || [];
	const focalPoints = identifyFocalPoints(elements);
	const sizeHierarchy = analyzeSizeRatios(elements);
	const issues = detectHierarchyIssues(elements);

	return {
		focalPoints,
		sizeHierarchy,
		issues,
		score: calculateHierarchyScore(elements, issues)
	};
}

/**
 * Identify elements that serve as focal points
 */
function identifyFocalPoints(elements) {
	const focalPoints = [];

	// Find largest elements
	const sorted = [...elements].sort((a, b) => {
		const areaA = (a.width || 0) * (a.height || 0) * (a.scaleX || 1) * (a.scaleY || 1);
		const areaB = (b.width || 0) * (b.height || 0) * (b.scaleX || 1) * (b.scaleY || 1);
		return areaB - areaA;
	});

	// Top 3 largest elements are likely focal points
	for (let i = 0; i < Math.min(3, sorted.length); i++) {
		const el = sorted[i];
		focalPoints.push({
			id: el.id || `element-${i}`,
			type: el.type,
			reason: i === 0 ? 'Largest element' : 'Large element',
			position: { left: el.left, top: el.top }
		});
	}

	// Find high-contrast text (likely headings)
	for (const el of elements) {
		if (el.type === 'textbox' || el.type === 'i-text' || el.type === 'text') {
			if (el.fontSize && el.fontSize >= 24) {
				focalPoints.push({
					id: el.id || el.type,
					type: 'text',
					reason: 'Large text (likely heading)',
					fontSize: el.fontSize
				});
			}
		}
	}

	return focalPoints;
}

/**
 * Analyze size relationships between elements
 */
function analyzeSizeRatios(elements) {
	const sizes = elements
		.map((el) => ({
			id: el.id || el.type,
			area: (el.width || 0) * (el.height || 0) * (el.scaleX || 1) * (el.scaleY || 1)
		}))
		.filter((s) => s.area > 0);

	if (sizes.length < 2) return { ratios: [], wellBalanced: true };

	sizes.sort((a, b) => b.area - a.area);

	const ratios = [];
	for (let i = 0; i < sizes.length - 1; i++) {
		ratios.push({
			from: sizes[i].id,
			to: sizes[i + 1].id,
			ratio: (sizes[i].area / sizes[i + 1].area).toFixed(2)
		});
	}

	// Check if ratios follow a reasonable pattern (not too extreme)
	const wellBalanced = ratios.every((r) => parseFloat(r.ratio) <= 10);

	return { ratios, wellBalanced };
}

/**
 * Detect issues with visual hierarchy
 */
function detectHierarchyIssues(elements) {
	const issues = [];

	// Check for competing focal points (multiple large elements)
	const largeElements = elements.filter((el) => {
		const area = (el.width || 0) * (el.height || 0);
		return area > 10000; // Arbitrary threshold
	});

	if (largeElements.length > 3) {
		issues.push({
			type: 'competing_focal_points',
			severity: 'medium',
			message: 'Too many large elements may compete for attention',
			count: largeElements.length
		});
	}

	// Check for text size uniformity (all same size = no hierarchy)
	const textElements = elements.filter(
		(el) => el.type === 'textbox' || el.type === 'i-text' || el.type === 'text'
	);

	if (textElements.length >= 3) {
		const fontSizes = textElements.map((t) => t.fontSize || 16);
		const uniqueSizes = new Set(fontSizes);
		if (uniqueSizes.size === 1) {
			issues.push({
				type: 'uniform_text_size',
				severity: 'low',
				message: 'All text is the same size - consider varying sizes for hierarchy'
			});
		}
	}

	return issues;
}

/**
 * Calculate overall hierarchy score
 */
function calculateHierarchyScore(elements, issues) {
	let score = 100;

	// Deduct for issues
	for (const issue of issues) {
		if (issue.severity === 'high') score -= 20;
		else if (issue.severity === 'medium') score -= 10;
		else score -= 5;
	}

	// Bonus for having clear focal points (if we have elements)
	if (elements.length > 0) {
		const hasLargeElement = elements.some((el) => {
			const area = (el.width || 0) * (el.height || 0);
			return area > 5000;
		});
		if (hasLargeElement) score += 5;
	}

	return Math.max(0, Math.min(100, score));
}

// =============================================================================
// Color Harmony Analysis
// =============================================================================

/**
 * Analyze color harmony of the canvas
 * @param {object} canvasState - Fabric.js canvas JSON
 * @returns {object}
 */
export function analyzeColorHarmony(canvasState) {
	const colors = extractColors(canvasState);
	const harmony = detectColorHarmony(colors);
	const issues = detectColorIssues(colors);
	const suggestions = generateColorSuggestions(colors);

	return {
		palette: colors,
		harmony,
		issues,
		suggestions,
		score: Math.max(0, 100 - issues.length * 15)
	};
}

/**
 * Detect what type of color harmony is present
 */
function detectColorHarmony(colors) {
	if (colors.length <= 1) return 'monochromatic';
	if (colors.length === 2) return 'complementary';
	if (colors.length === 3) return 'triadic';
	if (colors.length <= 5) return 'analogous';
	return 'complex';
}

/**
 * Detect color-related issues
 */
function detectColorIssues(colors) {
	const issues = [];

	if (colors.length > 6) {
		issues.push({
			type: 'too_many_colors',
			severity: 'medium',
			message: `Using ${colors.length} colors - consider limiting to 3-5 for cohesion`
		});
	}

	// Check for clashing colors (simplified check)
	for (let i = 0; i < colors.length; i++) {
		for (let j = i + 1; j < colors.length; j++) {
			const contrast = calculateContrastRatio(colors[i], colors[j]);
			if (contrast > 15 && contrast < 21) {
				// Very high contrast might be intentional or jarring
				// This is a simplified heuristic
			}
		}
	}

	return issues;
}

/**
 * Generate color improvement suggestions
 */
function generateColorSuggestions(colors) {
	const suggestions = [];

	if (colors.length === 1) {
		suggestions.push({
			type: 'add_accent',
			message: 'Consider adding an accent color for visual interest'
		});
	}

	if (colors.length > 5) {
		suggestions.push({
			type: 'reduce_palette',
			message: 'Simplify your color palette for a more cohesive look'
		});
	}

	return suggestions;
}

// =============================================================================
// Main Analysis Function
// =============================================================================

/**
 * Run full design analysis on canvas
 * @param {object} canvasState - Fabric.js canvas JSON
 * @param {string[]} checks - Which checks to run
 * @returns {object}
 */
export function analyzeDesign(canvasState, checks = ['hierarchy', 'accessibility', 'color']) {
	const results = {};

	if (checks.includes('hierarchy')) {
		results.hierarchy = analyzeVisualHierarchy(canvasState);
	}

	if (checks.includes('accessibility')) {
		results.accessibility = checkAccessibility(canvasState);
	}

	if (checks.includes('color')) {
		results.color = analyzeColorHarmony(canvasState);
	}

	// Calculate overall score
	const scores = Object.values(results).map((r) => r.score || 50);
	results.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

	// Collect all issues
	results.allIssues = [
		...(results.hierarchy?.issues || []),
		...(results.accessibility?.issues || []),
		...(results.color?.issues || [])
	];

	return results;
}
