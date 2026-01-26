/**
 * Canvas Preview Engine
 * 
 * Client-side engine for previewing template behavior with test data.
 * Handles conditions, loops, and text interpolation without making API calls.
 * 
 * This allows users to see how their canvas will look with different
 * variable values before actually rendering via the API.
 */

import { writable, get } from 'svelte/store';
import { variables as variablesStore } from '../../store/variables.store';

// Store original object states for restoration
let originalStates = new Map();
let loopClones = [];

// Export isPreviewActive as a writable store for reactive subscriptions
// This enables components to subscribe and react to preview state changes
export const isPreviewActive = writable(false);

// Operation lock to prevent race conditions during async preview operations
let previewOperationInProgress = false;

/**
 * Built-in functions for expression evaluation
 */
const BUILT_IN_FUNCTIONS = {
	// String functions
	length: (value) => {
		if (Array.isArray(value)) return value.length;
		if (typeof value === 'string') return value.length;
		if (typeof value === 'object' && value !== null) return Object.keys(value).length;
		return 0;
	},
	isEmpty: (value) => {
		if (value === null || value === undefined) return true;
		if (typeof value === 'string') return value.trim() === '';
		if (Array.isArray(value)) return value.length === 0;
		if (typeof value === 'object') return Object.keys(value).length === 0;
		return false;
	},
	contains: (haystack, needle) => {
		if (typeof haystack === 'string') return haystack.includes(needle);
		if (Array.isArray(haystack)) return haystack.includes(needle);
		return false;
	},
	uppercase: (value) => String(value).toUpperCase(),
	lowercase: (value) => String(value).toLowerCase(),
	capitalize: (value) => {
		const str = String(value);
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	},
	trim: (value) => String(value).trim(),
	
	// Number functions
	round: (value, decimals = 0) => {
		const factor = Math.pow(10, decimals);
		return Math.round(Number(value) * factor) / factor;
	},
	floor: (value) => Math.floor(Number(value)),
	ceil: (value) => Math.ceil(Number(value)),
	abs: (value) => Math.abs(Number(value)),
	min: (...args) => Math.min(...args.map(Number)),
	max: (...args) => Math.max(...args.map(Number)),
	
	// Array functions
	first: (arr) => Array.isArray(arr) ? arr[0] : undefined,
	last: (arr) => Array.isArray(arr) ? arr[arr.length - 1] : undefined,
	join: (arr, separator = ', ') => Array.isArray(arr) ? arr.join(separator) : String(arr),
	
	// Formatting
	currency: (value, currency = 'USD') => {
		try {
			return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value));
		} catch {
			return String(value);
		}
	},
	percent: (value, decimals = 0) => {
		return (Number(value) * 100).toFixed(decimals) + '%';
	},
	number: (value, decimals = 0) => {
		return new Intl.NumberFormat('en-US', { 
			minimumFractionDigits: decimals, 
			maximumFractionDigits: decimals 
		}).format(Number(value));
	},
	
	// Date functions
	date: (dateStr) => {
		try {
			const date = new Date(dateStr);
			if (isNaN(date.getTime())) return String(dateStr);
			return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
		} catch {
			return String(dateStr);
		}
	},
	
	// Default
	default: (value, defaultValue) => {
		if (value === null || value === undefined || value === '') {
			return defaultValue;
		}
		return value;
	},
};

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
	if (!path || typeof path !== 'string') return undefined;
	
	const parts = path.split('.');
	let current = obj;
	
	for (const part of parts) {
		if (current === null || current === undefined) return undefined;
		
		// Handle array index notation like items[0]
		const match = part.match(/^(\w+)\[(\d+)\]$/);
		if (match) {
			current = current[match[1]];
			if (Array.isArray(current)) {
				current = current[parseInt(match[2])];
			} else {
				return undefined;
			}
		} else {
			current = current[part];
		}
	}
	
	return current;
}

/**
 * Simple expression evaluator for conditions
 */
function evaluateExpression(expression, context) {
	if (!expression || typeof expression !== 'string') {
		return true;
	}
	
	const expr = expression.trim();
	if (!expr) return true;
	
	try {
		// Handle function calls
		const funcMatch = expr.match(/^(\w+)\((.+)\)$/);
		if (funcMatch) {
			const [, funcName, argsStr] = funcMatch;
			const func = BUILT_IN_FUNCTIONS[funcName];
			if (func) {
				// Parse arguments (simplified)
				const args = parseArguments(argsStr, context);
				return func(...args);
			}
		}
		
		// Handle negated function
		const negatedFuncMatch = expr.match(/^!(\w+)\((.+)\)$/);
		if (negatedFuncMatch) {
			const [, funcName, argsStr] = negatedFuncMatch;
			const func = BUILT_IN_FUNCTIONS[funcName];
			if (func) {
				const args = parseArguments(argsStr, context);
				return !func(...args);
			}
		}
		
		// Handle comparison operators
		const comparisonPatterns = [
			{ pattern: /^(.+?)\s*===\s*(.+)$/, op: (a, b) => a === b },
			{ pattern: /^(.+?)\s*!==\s*(.+)$/, op: (a, b) => a !== b },
			{ pattern: /^(.+?)\s*==\s*(.+)$/, op: (a, b) => a == b },
			{ pattern: /^(.+?)\s*!=\s*(.+)$/, op: (a, b) => a != b },
			{ pattern: /^(.+?)\s*>=\s*(.+)$/, op: (a, b) => Number(a) >= Number(b) },
			{ pattern: /^(.+?)\s*<=\s*(.+)$/, op: (a, b) => Number(a) <= Number(b) },
			{ pattern: /^(.+?)\s*>\s*(.+)$/, op: (a, b) => Number(a) > Number(b) },
			{ pattern: /^(.+?)\s*<\s*(.+)$/, op: (a, b) => Number(a) < Number(b) },
		];
		
		for (const { pattern, op } of comparisonPatterns) {
			const match = expr.match(pattern);
			if (match) {
				const left = resolveValue(match[1].trim(), context);
				const right = resolveValue(match[2].trim(), context);
				return op(left, right);
			}
		}
		
		// Handle logical operators
		if (expr.includes('&&') || expr.includes(' and ')) {
			const parts = expr.split(/\s*(?:&&|and)\s*/);
			return parts.every(part => evaluateExpression(part.trim(), context));
		}
		
		if (expr.includes('||') || expr.includes(' or ')) {
			const parts = expr.split(/\s*(?:\|\||or)\s*/);
			return parts.some(part => evaluateExpression(part.trim(), context));
		}
		
		// Handle negation
		if (expr.startsWith('!') && !expr.startsWith('!=')) {
			return !evaluateExpression(expr.slice(1).trim(), context);
		}
		
		// Simple value - truthy check
		const value = resolveValue(expr, context);
		return Boolean(value);
		
	} catch (error) {
		console.warn('Expression evaluation error:', error.message, 'Expression:', expression);
		return true; // Default to showing on error
	}
}

/**
 * Parse function arguments
 */
function parseArguments(argsStr, context) {
	const args = [];
	let current = '';
	let depth = 0;
	let inString = false;
	let stringChar = '';
	
	for (let i = 0; i < argsStr.length; i++) {
		const char = argsStr[i];
		
		if ((char === '"' || char === "'") && argsStr[i - 1] !== '\\') {
			if (!inString) {
				inString = true;
				stringChar = char;
			} else if (char === stringChar) {
				inString = false;
			}
		}
		
		if (!inString) {
			if (char === '(') depth++;
			if (char === ')') depth--;
			if (char === ',' && depth === 0) {
				args.push(resolveValue(current.trim(), context));
				current = '';
				continue;
			}
		}
		
		current += char;
	}
	
	if (current.trim()) {
		args.push(resolveValue(current.trim(), context));
	}
	
	return args;
}

/**
 * Resolve a value from expression context
 */
function resolveValue(expr, context) {
	if (!expr) return undefined;
	
	const trimmed = expr.trim();
	
	// String literal
	if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
	    (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
		return trimmed.slice(1, -1);
	}
	
	// Number
	if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
		return parseFloat(trimmed);
	}
	
	// Boolean
	if (trimmed === 'true') return true;
	if (trimmed === 'false') return false;
	if (trimmed === 'null' || trimmed === 'undefined') return null;
	
	// Variable lookup
	return getNestedValue(context, trimmed);
}

/**
 * Process text interpolation
 * Replaces {{ variable }} patterns with values from context
 */
function processTextInterpolation(text, context) {
	if (!text || typeof text !== 'string') return text;
	
	// Match {{ variable }} or {{ variable | filter }}
	return text.replace(/\{\{\s*(.+?)\s*\}\}/g, (match, expr) => {
		// Check for filter (pipe)
		const filterMatch = expr.match(/^(.+?)\s*\|\s*(.+)$/);
		
		if (filterMatch) {
			const [, varPath, filterExpr] = filterMatch;
			let value = getNestedValue(context, varPath.trim());
			
			// Apply filter
			const filterParts = filterExpr.split(':').map(s => s.trim());
			const filterName = filterParts[0];
			const filterArg = filterParts[1];
			
			const filter = BUILT_IN_FUNCTIONS[filterName];
			if (filter) {
				value = filterArg ? filter(value, resolveValue(filterArg, context)) : filter(value);
			}
			
			return value !== undefined && value !== null ? String(value) : '';
		}
		
		// Simple variable
		const value = getNestedValue(context, expr.trim());
		return value !== undefined && value !== null ? String(value) : '';
	});
}

/**
 * Store original state of an object for later restoration
 */
function storeOriginalState(obj) {
	if (!obj || !obj.id) return;
	
	if (!originalStates.has(obj.id)) {
		originalStates.set(obj.id, {
			visible: obj.visible,
			opacity: obj.opacity,
			text: obj.text,
			left: obj.left,
			top: obj.top,
			// Store additional properties for multi-binding support
			fill: obj.fill,
			stroke: obj.stroke,
			strokeWidth: obj.strokeWidth,
			fontSize: obj.fontSize,
			fontFamily: obj.fontFamily,
			fontWeight: obj.fontWeight,
		});
	}
}

/**
 * Restore original state of an object
 */
function restoreOriginalState(obj) {
	if (!obj || !obj.id) return;
	
	const original = originalStates.get(obj.id);
	if (original) {
		obj.set('visible', original.visible !== false);
		obj.set('opacity', original.opacity ?? 1);
		if (original.text !== undefined) {
			obj.set('text', original.text);
		}
		obj.set('left', original.left);
		obj.set('top', original.top);
		// Restore additional properties for multi-binding support
		if (original.fill !== undefined) obj.set('fill', original.fill);
		if (original.stroke !== undefined) obj.set('stroke', original.stroke);
		if (original.strokeWidth !== undefined) obj.set('strokeWidth', original.strokeWidth);
		if (original.fontSize !== undefined) obj.set('fontSize', original.fontSize);
		if (original.fontFamily !== undefined) obj.set('fontFamily', original.fontFamily);
		if (original.fontWeight !== undefined) obj.set('fontWeight', original.fontWeight);
	}
}

/**
 * Apply preview to canvas
 */
export async function applyPreview(canvas, testValues) {
	if (!canvas) return { hiddenCount: 0, loopClonesCount: 0, success: false };

	// Prevent overlapping preview operations (race condition mitigation)
	if (previewOperationInProgress) {
		console.warn('Preview operation already in progress');
		return { hiddenCount: 0, loopClonesCount: 0, success: false, reason: 'operation_in_progress' };
	}

	previewOperationInProgress = true;

	// Batch rendering: disable auto-render during preview operations
	const originalRenderOnAddRemove = canvas.renderOnAddRemove;
	canvas.renderOnAddRemove = false;

	try {
		isPreviewActive.set(true);
	
	// Clear previous loop clones
	loopClones.forEach(clone => {
		try {
			canvas.remove(clone);
		} catch (e) {
			// Ignore if already removed
		}
	});
	loopClones = [];
	
	const objects = canvas.getObjects();
	const objectsToHide = [];
	const loopObjectsProcessed = new Set();
	const loopPromises = [];
	
	// First pass: evaluate conditions and prepare loops
	for (const obj of objects) {
		storeOriginalState(obj);
		
		// Handle conditional visibility
		if (obj.showWhen) {
			const shouldShow = evaluateExpression(obj.showWhen, testValues);
			if (!shouldShow) {
				objectsToHide.push(obj);
			}
		}
		
		if (obj.hideWhen) {
			const shouldHide = evaluateExpression(obj.hideWhen, testValues);
			if (shouldHide) {
				objectsToHide.push(obj);
			}
		}
		
		// Handle loops
		if (obj.loopVariable && !loopObjectsProcessed.has(obj.id)) {
			const loopItems = getNestedValue(testValues, obj.loopVariable);
			
			if (Array.isArray(loopItems) && loopItems.length > 0) {
				loopObjectsProcessed.add(obj.id);
				loopPromises.push(processLoop(canvas, obj, loopItems, testValues));
				// Hide original object (clones take its place)
				objectsToHide.push(obj);
			} else if (!loopItems || loopItems.length === 0) {
				// No items, hide the loop element
				objectsToHide.push(obj);
			}
		}
		
		// Handle text interpolation
		if ((obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') && obj.text) {
			// Check if text contains interpolation
			if (obj.text.includes('{{')) {
				const processedText = processTextInterpolation(obj.text, testValues);
				obj.set('text', processedText);
			}
		}
		
		// Handle variable replacement for isVariable objects (multi-binding)
		if (obj.isVariable && obj.variableBindings && Array.isArray(obj.variableBindings)) {
			obj.variableBindings.forEach(binding => {
				if (binding.variableName) {
					const value = getNestedValue(testValues, binding.variableName);
					if (value !== undefined) {
						applyVariableValueByProperty(obj, binding.property, value);
					}
				}
			});
		}
	}
	
	// Wait for all loop processing to complete
	await Promise.all(loopPromises);
	
		// Apply visibility
		objectsToHide.forEach(obj => {
			obj.set('visible', false);
			obj.set('opacity', 0);
		});

		return {
			hiddenCount: objectsToHide.length,
			loopClonesCount: loopClones.length,
			success: true
		};
	} finally {
		// Restore auto-render and trigger single render
		canvas.renderOnAddRemove = originalRenderOnAddRemove;
		canvas.requestRenderAll();
		previewOperationInProgress = false;
	}
}

/**
 * Apply variable value to object for a specific property
 */
function applyVariableValueByProperty(obj, property, value) {
	switch (property) {
		case 'text':
			if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
				obj.set('text', String(value));
			}
			break;
		case 'src':
			if (obj.type === 'image' && value) {
				// For images, we'd need to reload - for preview, just show indicator
				// obj.setSrc(value); // This is async, so we skip in preview
			}
			break;
		case 'fill':
			obj.set('fill', String(value));
			break;
		case 'stroke':
			obj.set('stroke', String(value));
			break;
		case 'opacity':
			obj.set('opacity', parseFloat(value) || 1);
			break;
		case 'fontSize':
			if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
				obj.set('fontSize', parseInt(value) || 16);
			}
			break;
		case 'strokeWidth':
			obj.set('strokeWidth', parseFloat(value) || 1);
			break;
		case 'fontFamily':
			if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
				obj.set('fontFamily', String(value));
			}
			break;
		case 'fontWeight':
			if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
				obj.set('fontWeight', String(value));
			}
			break;
		case 'chartData':
			// Chart data - would need special handling, skip in preview
			break;
		case 'tableData':
			// Table data - would need special handling, skip in preview
			break;
		default:
			// Try to set the property directly
			try {
				obj.set(property, value);
			} catch (e) {
				console.warn(`Could not apply value to property "${property}":`, e.message);
			}
	}
}

/**
 * Process a loop element - create clones for each item
 */
async function processLoop(canvas, obj, items, baseContext) {
	const itemName = obj.loopItemName || 'item';
	const indexName = obj.loopIndexName || 'index';
	const direction = obj.loopDirection || 'vertical';
	const spacing = obj.loopSpacing || 50;
	const columns = obj.loopColumns || 3;
	
	for (let index = 0; index < items.length; index++) {
		const item = items[index];
		
		// Create context for this iteration
		const loopContext = {
			...baseContext,
			[itemName]: item,
			[indexName]: index,
			__loopFirst: index === 0,
			__loopLast: index === items.length - 1,
			__loopLength: items.length,
		};
		
		try {
			// Clone the object (Fabric.js v6 returns a Promise)
			const clone = await obj.clone();
			
			// Calculate position
			let newLeft = obj.left || 0;
			let newTop = obj.top || 0;
			
			if (direction === 'horizontal') {
				newLeft += index * spacing;
			} else if (direction === 'vertical') {
				newTop += index * spacing;
			} else if (direction === 'grid') {
				const row = Math.floor(index / columns);
				const col = index % columns;
				newLeft += col * spacing;
				newTop += row * spacing;
			}
			
			clone.set({
				left: newLeft,
				top: newTop,
				id: `${obj.id}_preview_${index}`,
				// Remove loop properties from clone
				loopVariable: null,
				loopItemName: null,
				loopIndexName: null,
			});
			
			// Apply text interpolation with loop context
			if ((clone.type === 'i-text' || clone.type === 'text' || clone.type === 'textbox') && clone.text) {
				const processedText = processTextInterpolation(clone.text, loopContext);
				clone.set('text', processedText);
			}
			
			// Apply variable values if it's a variable (multi-binding)
			if (clone.isVariable && clone.variableBindings && Array.isArray(clone.variableBindings)) {
				clone.variableBindings.forEach(binding => {
					if (binding.variableName) {
						const value = getNestedValue(loopContext, binding.variableName);
						if (value !== undefined) {
							applyVariableValueByProperty(clone, binding.property, value);
						}
					}
				});
			}
			
			// Handle nested conditions within loop
			if (clone.showWhen) {
				const shouldShow = evaluateExpression(clone.showWhen, loopContext);
				if (!shouldShow) {
					clone.set('visible', false);
					clone.set('opacity', 0);
				}
			}
			
			if (clone.hideWhen) {
				const shouldHide = evaluateExpression(clone.hideWhen, loopContext);
				if (shouldHide) {
					clone.set('visible', false);
					clone.set('opacity', 0);
				}
			}
			
			// Mark as preview clone
			clone._isPreviewClone = true;
			
			canvas.add(clone);
			loopClones.push(clone);
		} catch (err) {
			console.warn('Failed to clone loop item:', err);
		}
	}
}

/**
 * Clear preview and restore original canvas state
 */
export function clearPreview(canvas) {
	if (!canvas) return;

	// Check if preview is actually active before clearing
	if (!get(isPreviewActive)) return;

	isPreviewActive.set(false);

	// Remove loop clones
	loopClones.forEach(clone => {
		try {
			canvas.remove(clone);
		} catch (e) {
			// Ignore if already removed
		}
	});
	loopClones = [];

	// Restore original states
	const objects = canvas.getObjects();
	objects.forEach(obj => {
		restoreOriginalState(obj);
	});

	// Clear stored states
	originalStates.clear();

	canvas.requestRenderAll();
}

/**
 * Check if preview is currently active
 * Returns the current value (not the store itself)
 */
export function isPreviewModeActive() {
	return get(isPreviewActive);
}

/**
 * Get preview statistics
 */
export function getPreviewStats(canvas, testValues) {
	if (!canvas) return null;
	
	const objects = canvas.getObjects();
	let conditionsCount = 0;
	let loopsCount = 0;
	let variablesCount = 0;
	let hiddenByCondition = 0;
	let loopIterations = 0;
	
	objects.forEach(obj => {
		if (obj.showWhen || obj.hideWhen) {
			conditionsCount++;
			
			// Check if would be hidden
			if (obj.showWhen) {
				const shouldShow = evaluateExpression(obj.showWhen, testValues);
				if (!shouldShow) hiddenByCondition++;
			}
			if (obj.hideWhen) {
				const shouldHide = evaluateExpression(obj.hideWhen, testValues);
				if (shouldHide) hiddenByCondition++;
			}
		}
		
		if (obj.loopVariable) {
			loopsCount++;
			const items = getNestedValue(testValues, obj.loopVariable);
			if (Array.isArray(items)) {
				loopIterations += items.length;
			}
		}
		
		if (obj.isVariable) {
			variablesCount++;
		}
	});
	
	return {
		conditionsCount,
		loopsCount,
		variablesCount,
		hiddenByCondition,
		loopIterations
	};
}

/**
 * Validate test values against variable definitions
 */
export function validateTestValues(testValues) {
	const vars = get(variablesStore);
	const errors = [];
	const warnings = [];
	
	vars.forEach(v => {
		const value = testValues[v.name];
		
		// Check required
		if (v.required && (value === undefined || value === null || value === '')) {
			errors.push(`"${v.name}" is required`);
		}
		
		// Type validation
		if (value !== undefined && value !== null) {
			switch (v.type) {
				case 'number':
					if (typeof value !== 'number' && isNaN(Number(value))) {
						warnings.push(`"${v.name}" should be a number`);
					}
					break;
				case 'boolean':
					if (typeof value !== 'boolean') {
						warnings.push(`"${v.name}" should be a boolean`);
					}
					break;
				case 'array':
					if (!Array.isArray(value)) {
						warnings.push(`"${v.name}" should be an array`);
					}
					break;
				case 'object':
					if (typeof value !== 'object' || Array.isArray(value)) {
						warnings.push(`"${v.name}" should be an object`);
					}
					break;
			}
		}
	});
	
	return { errors, warnings, isValid: errors.length === 0 };
}

export default {
	applyPreview,
	clearPreview,
	isPreviewModeActive,
	getPreviewStats,
	validateTestValues,
	evaluateExpression,
	processTextInterpolation,
	getNestedValue
};

