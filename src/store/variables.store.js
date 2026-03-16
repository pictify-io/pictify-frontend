import { writable, derived, get } from 'svelte/store';
import {
	extractVariablesFromExpression,
	generateSampleData,
	getVariableType as getExpressionVariableType
} from '../lib/utils/expression-parser';

/**
 * Centralized Variable Store
 *
 * This store manages all template variables in one place, providing:
 * - Single source of truth for all variables
 * - CRUD operations (Create, Read, Update, Delete)
 * - Automatic sync with canvas objects
 * - Support for different variable sources (property, condition, loop, custom)
 *
 * Variable Types:
 * - text: String values (from text elements)
 * - image: Image URLs (from image elements)
 * - color: Color hex values (from fill properties)
 * - boolean: True/false values (from conditions)
 * - number: Numeric values (from conditions)
 * - array: Array data (from loops)
 * - object: Object data (from complex conditions)
 * - chart: Chart data arrays
 * - table: Table data objects
 *
 * Variable Sources:
 * - property: Directly marked as variable on canvas object
 * - condition: Extracted from showWhen/hideWhen expressions
 * - loop: Extracted from loopVariable configurations
 * - custom: Manually created variables (not tied to canvas objects)
 */

// Variable type definitions
export const VARIABLE_TYPES = {
	TEXT: 'text',
	IMAGE: 'image',
	COLOR: 'color',
	BOOLEAN: 'boolean',
	NUMBER: 'number',
	ARRAY: 'array',
	OBJECT: 'object',
	CHART: 'chart',
	TABLE: 'table'
};

// Variable source definitions
export const VARIABLE_SOURCES = {
	PROPERTY: 'property',
	CONDITION: 'condition',
	LOOP: 'loop',
	CUSTOM: 'custom'
};

/**
 * Creates a new variable object with defaults
 */
function createVariable({
	id = null,
	name,
	type = VARIABLE_TYPES.TEXT,
	source = VARIABLE_SOURCES.CUSTOM,
	defaultValue = null,
	description = '',
	required = false,
	objectId = null,
	objectType = null,
	property = 'value',
	metadata = {}
}) {
	return {
		id: id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		name,
		type,
		source,
		defaultValue: defaultValue !== null ? defaultValue : getDefaultValueForType(type),
		description,
		required,
		objectId, // ID of canvas object (if tied to one)
		objectType, // Type of canvas object (i-text, image, etc.)
		property, // Property being controlled (text, src, fill, etc.)
		metadata, // Additional info (isObject, properties for objects, etc.)
		createdAt: Date.now(),
		updatedAt: Date.now()
	};
}

/**
 * Get default value for a variable type
 */
function getDefaultValueForType(type) {
	switch (type) {
		case VARIABLE_TYPES.TEXT:
			return '';
		case VARIABLE_TYPES.IMAGE:
			return '';
		case VARIABLE_TYPES.COLOR:
			return '#000000';
		case VARIABLE_TYPES.BOOLEAN:
			return true;
		case VARIABLE_TYPES.NUMBER:
			return 0;
		case VARIABLE_TYPES.ARRAY:
			return [
				{ id: 1, name: 'Item 1', value: 100 },
				{ id: 2, name: 'Item 2', value: 200 }
			];
		case VARIABLE_TYPES.OBJECT:
			return {};
		case VARIABLE_TYPES.CHART:
			return [
				{ label: 'Jan', value: 30 },
				{ label: 'Feb', value: 45 },
				{ label: 'Mar', value: 60 }
			];
		case VARIABLE_TYPES.TABLE:
			return {
				headers: ['Column 1', 'Column 2', 'Column 3'],
				rows: [
					['Row 1 A', 'Row 1 B', 'Row 1 C'],
					['Row 2 A', 'Row 2 B', 'Row 2 C']
				]
			};
		default:
			return '';
	}
}

// Main variables store - Map of variable name to variable object
const variablesMap = writable(new Map());

// Canvas reference for syncing
let canvasRef = null;

/**
 * Derived store: Get variables as array
 */
export const variables = derived(variablesMap, ($map) => {
	return Array.from($map.values()).sort((a, b) => {
		// Sort by source priority: property > loop > condition > custom
		const sourceOrder = { property: 0, loop: 1, condition: 2, custom: 3 };
		const sourceDiff = (sourceOrder[a.source] || 4) - (sourceOrder[b.source] || 4);
		if (sourceDiff !== 0) return sourceDiff;
		// Then by name
		return a.name.localeCompare(b.name);
	});
});

/**
 * Derived store: Get variables grouped by source
 */
export const variablesBySource = derived(variablesMap, ($map) => {
	const grouped = {
		property: [],
		condition: [],
		loop: [],
		custom: []
	};

	$map.forEach((v) => {
		if (grouped[v.source]) {
			grouped[v.source].push(v);
		}
	});

	return grouped;
});

/**
 * Derived store: Get variables grouped by type
 */
export const variablesByType = derived(variablesMap, ($map) => {
	const grouped = {};

	$map.forEach((v) => {
		if (!grouped[v.type]) {
			grouped[v.type] = [];
		}
		grouped[v.type].push(v);
	});

	return grouped;
});

/**
 * Derived store: Get variable names for quick lookup
 */
export const variableNames = derived(variablesMap, ($map) => {
	return Array.from($map.keys());
});

/**
 * Derived store: Statistics
 */
export const variableStats = derived(variablesMap, ($map) => {
	const stats = {
		total: $map.size,
		byType: {},
		bySource: {},
		required: 0
	};

	$map.forEach((v) => {
		stats.byType[v.type] = (stats.byType[v.type] || 0) + 1;
		stats.bySource[v.source] = (stats.bySource[v.source] || 0) + 1;
		if (v.required) stats.required++;
	});

	return stats;
});

/**
 * Variable Actions
 */
export const variableActions = {
	/**
	 * Set canvas reference for syncing
	 */
	setCanvas(canvas) {
		canvasRef = canvas;
	},

	/**
	 * Clear canvas reference
	 */
	clearCanvas() {
		canvasRef = null;
	},

	/**
	 * Get a variable by name
	 */
	get(name) {
		return get(variablesMap).get(name);
	},

	/**
	 * Check if variable exists
	 */
	has(name) {
		return get(variablesMap).has(name);
	},

	/**
	 * Create a new variable
	 */
	create(variableData) {
		const { name } = variableData;

		// Validate name
		if (!name || typeof name !== 'string') {
			return null;
		}

		// Sanitize name
		const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '_');

		// Check for duplicates
		if (get(variablesMap).has(sanitizedName)) {
			return get(variablesMap).get(sanitizedName);
		}

		const variable = createVariable({
			...variableData,
			name: sanitizedName
		});

		// Copy-before-mutate pattern for proper Svelte reactivity
		variablesMap.update((map) => {
			const newMap = new Map(map);
			newMap.set(sanitizedName, variable);
			return newMap;
		});

		return variable;
	},

	/**
	 * Update an existing variable
	 */
	update(name, updates) {
		// Copy-before-mutate pattern for proper Svelte reactivity
		variablesMap.update((map) => {
			if (!map.has(name)) {
				return map;
			}

			const newMap = new Map(map);
			const existing = newMap.get(name);
			// Filter out undefined values to prevent overwriting with undefined
			const filteredUpdates = Object.fromEntries(
				Object.entries(updates).filter(([, v]) => v !== undefined)
			);
			const updated = {
				...existing,
				...filteredUpdates,
				updatedAt: Date.now()
			};

			// If name changed, need to re-key
			if (updates.name && updates.name !== name) {
				const newName = updates.name.replace(/[^a-zA-Z0-9_]/g, '_');
				if (newMap.has(newName) && newName !== name) {
					return map;
				}
				newMap.delete(name);
				updated.name = newName;
				newMap.set(newName, updated);

				// Update canvas object if exists
				if (canvasRef && existing.objectId) {
					const obj = canvasRef.getObjects().find((o) => o.id === existing.objectId);
					if (obj) {
						obj.set('variableName', newName);
						canvasRef.renderAll();
					}
				}
			} else {
				newMap.set(name, updated);
			}

			return newMap;
		});
	},

	/**
	 * Delete a variable
	 */
	delete(name) {
		// Copy-before-mutate pattern for proper Svelte reactivity
		variablesMap.update((map) => {
			const variable = map.get(name);

			if (!variable) {
				return map;
			}

			// If tied to canvas object, remove variable properties from object
			if (canvasRef && variable.objectId && variable.source === VARIABLE_SOURCES.PROPERTY) {
				const obj = canvasRef.getObjects().find((o) => o.id === variable.objectId);
				if (obj) {
					obj.set('isVariable', false);
					obj.set('variableName', '');
					obj.set('variableDescription', '');
					obj.set('variableProperty', '');
					obj.set('variableValidation', null);
					canvasRef.renderAll();
				}
			}

			const newMap = new Map(map);
			newMap.delete(name);
			return newMap;
		});
	},

	/**
	 * Clear all variables
	 */
	clear() {
		variablesMap.set(new Map());
	},

	/**
	 * Sync variables from canvas
	 * Extracts all variables from canvas objects
	 * Preserves user-specified type overrides from the current store
	 */
	syncFromCanvas(canvas) {
		if (!canvas) {
			return;
		}

		canvasRef = canvas;
		const objects = canvas.getObjects();
		const newVariables = new Map();

		// Get current variables to preserve user-specified type overrides
		const currentMap = get(variablesMap);

		// 1. Extract property-based variables (isVariable = true with variableBindings)
		objects
			.filter(
				(obj) => obj.isVariable && obj.variableBindings && Array.isArray(obj.variableBindings)
			)
			.forEach((obj) => {
				obj.variableBindings.forEach((binding, bindingIndex) => {
					const varName = binding.variableName;
					if (varName && !newVariables.has(varName)) {
						// Check for existing variable with user-specified type
						const existingVar = currentMap.get(varName);
						const inferredType = inferTypeFromProperty(obj, binding.property);

						newVariables.set(
							varName,
							createVariable({
								id: `${obj.id}_binding_${bindingIndex}`,
								name: varName,
								// Preserve user-specified type if it differs from inferred
								type: existingVar?.type || inferredType,
								source: VARIABLE_SOURCES.PROPERTY,
								// Preserve user-specified default value if type was overridden
								defaultValue:
									existingVar?.defaultValue ?? getValueFromObjectProperty(obj, binding.property),
								description: existingVar?.description || binding.description || '',
								required: existingVar?.required ?? binding.required ?? false,
								objectId: obj.id,
								objectType: obj.type,
								property: binding.property || 'text',
								metadata: {
									isChart: obj.isChart || false,
									isTable: obj.isTable || false,
									chartType: obj.chartType,
									tableType: obj.tableType,
									bindingIndex
								}
							})
						);
					}
				});
			});

		// 2. Extract condition variables (showWhen/hideWhen)
		objects.forEach((obj) => {
			const showWhen = obj.showWhen;
			const hideWhen = obj.hideWhen;

			if (showWhen || hideWhen) {
				const expression = showWhen || hideWhen;
				const extractedVars = extractVariablesFromExpression(expression);

				extractedVars.forEach((extractedVar) => {
					if (!newVariables.has(extractedVar.name)) {
						// Check for existing variable with user-specified type
						const existingVar = currentMap.get(extractedVar.name);
						const inferredType = getExpressionVariableType(extractedVar, 'condition');

						newVariables.set(
							extractedVar.name,
							createVariable({
								id: `condition_${extractedVar.name}`,
								name: extractedVar.name,
								// Preserve user-specified type if it differs from inferred
								type: existingVar?.type || inferredType,
								source: VARIABLE_SOURCES.CONDITION,
								// Preserve user-specified default value if type was overridden
								defaultValue:
									existingVar?.defaultValue ?? generateSampleData(extractedVar, 'condition'),
								description:
									existingVar?.description ||
									`Used in ${showWhen ? 'show' : 'hide'} condition: "${expression}"`,
								property: (existingVar?.type || inferredType) === 'object' ? 'data' : 'value',
								metadata: {
									isObject: extractedVar.isObject,
									properties: extractedVar.properties,
									conditionType: showWhen ? 'showWhen' : 'hideWhen',
									expression
								}
							})
						);
					}
				});
			}
		});

		// 3. Extract loop variables
		objects.forEach((obj) => {
			const loopVariable = obj.loopVariable;

			if (loopVariable && loopVariable !== null && loopVariable !== '') {
				if (!newVariables.has(loopVariable)) {
					// Check for existing variable with user-specified type
					const existingVar = currentMap.get(loopVariable);

					newVariables.set(
						loopVariable,
						createVariable({
							id: `loop_${loopVariable}`,
							name: loopVariable,
							// Preserve user-specified type (usually stays as array)
							type: existingVar?.type || VARIABLE_TYPES.ARRAY,
							source: VARIABLE_SOURCES.LOOP,
							defaultValue:
								existingVar?.defaultValue ?? generateSampleData({ name: loopVariable }, 'loop'),
							description:
								existingVar?.description ||
								`Array variable for repeating element${
									obj.loopItemName ? ` (item: ${obj.loopItemName})` : ''
								}`,
							property: 'items',
							metadata: {
								loopItemName: obj.loopItemName,
								loopIndexName: obj.loopIndexName,
								loopDirection: obj.loopDirection
							}
						})
					);
				}
			}
		});

		// 4. Preserve custom variables that aren't tied to canvas
		currentMap.forEach((v, name) => {
			if (v.source === VARIABLE_SOURCES.CUSTOM && !newVariables.has(name)) {
				newVariables.set(name, v);
			}
		});

		variablesMap.set(newVariables);
	},

	/**
	 * Load variable definitions from template data
	 * This should be called when a template is loaded to restore saved types/defaults
	 * @param {Array} definitions - The variableDefinitions array from template
	 */
	loadFromDefinitions(definitions) {
		if (!definitions || !Array.isArray(definitions)) return;

		const newMap = new Map();

		definitions.forEach((def) => {
			if (def.name) {
				newMap.set(
					def.name,
					createVariable({
						id: def.elementId || `loaded_${def.name}`,
						name: def.name,
						type: def.type || VARIABLE_TYPES.TEXT,
						source: def.source || VARIABLE_SOURCES.PROPERTY,
						defaultValue: def.defaultValue,
						description: def.description || '',
						required: def.validation?.required ?? false,
						property: def.property || 'value',
						metadata: {
							isObject: def.isObject,
							properties: def.properties,
							loopItemName: def.loopItemName,
							loopDirection: def.loopDirection
						}
					})
				);
			}
		});

		variablesMap.set(newMap);
	},

	/**
	 * Create a custom variable (not tied to canvas)
	 */
	createCustom(name, type = VARIABLE_TYPES.TEXT, defaultValue = null, description = '') {
		return this.create({
			name,
			type,
			source: VARIABLE_SOURCES.CUSTOM,
			defaultValue,
			description
		});
	},

	/**
	 * Generate API example JSON
	 */
	generateApiExample() {
		const vars = get(variablesMap);
		const example = {};

		vars.forEach((v, name) => {
			if (v.type === VARIABLE_TYPES.TEXT) {
				example[name] = v.defaultValue || 'Your text here';
			} else if (v.type === VARIABLE_TYPES.IMAGE) {
				example[name] = 'https://example.com/image.jpg';
			} else if (v.type === VARIABLE_TYPES.COLOR) {
				example[name] = v.defaultValue || '#ff6b6b';
			} else if (v.type === VARIABLE_TYPES.BOOLEAN) {
				example[name] = v.defaultValue ?? true;
			} else if (v.type === VARIABLE_TYPES.NUMBER) {
				example[name] = v.defaultValue ?? 100;
			} else if (v.type === VARIABLE_TYPES.ARRAY) {
				example[name] = v.defaultValue || [
					{ id: 1, name: 'Item 1', value: 100 },
					{ id: 2, name: 'Item 2', value: 200 }
				];
			} else if (v.type === VARIABLE_TYPES.OBJECT) {
				example[name] = v.defaultValue || { key: 'value' };
			} else if (v.type === VARIABLE_TYPES.CHART) {
				example[name] = v.defaultValue || [
					{ label: 'Jan', value: 30 },
					{ label: 'Feb', value: 45 },
					{ label: 'Mar', value: 60 }
				];
			} else if (v.type === VARIABLE_TYPES.TABLE) {
				example[name] = v.defaultValue || {
					headers: ['Product', 'Price', 'Stock'],
					rows: [
						['Widget A', '$29.99', '150'],
						['Widget B', '$49.99', '89']
					]
				};
			}
		});

		return example;
	},

	/**
	 * Import variables from JSON
	 */
	importFromJSON(json) {
		try {
			const data = typeof json === 'string' ? JSON.parse(json) : json;
			Object.entries(data).forEach(([name, value]) => {
				if (!this.has(name)) {
					const type = inferTypeFromValue(value);
					this.createCustom(name, type, value, 'Imported variable');
				}
			});
		} catch (error) {
			/* ignored */
		}
	},

	/**
	 * Export variables to JSON
	 */
	exportToJSON() {
		return this.generateApiExample();
	},

	/**
	 * Get all variable names for autocomplete
	 */
	getNames() {
		return Array.from(get(variablesMap).keys());
	},

	/**
	 * Find variables by type
	 */
	findByType(type) {
		const vars = get(variablesMap);
		return Array.from(vars.values()).filter((v) => v.type === type);
	},

	/**
	 * Find variables by source
	 */
	findBySource(source) {
		const vars = get(variablesMap);
		return Array.from(vars.values()).filter((v) => v.source === source);
	}
};

/**
 * Helper: Infer variable type from object and specific property
 */
function inferTypeFromProperty(obj, property) {
	if (obj.isChart && property === 'chartData') return VARIABLE_TYPES.CHART;
	if (obj.isTable && property === 'tableData') return VARIABLE_TYPES.TABLE;

	switch (property) {
		case 'text':
			return VARIABLE_TYPES.TEXT;
		case 'src':
			return VARIABLE_TYPES.IMAGE;
		case 'fill':
		case 'stroke':
			return VARIABLE_TYPES.COLOR;
		case 'opacity':
		case 'fontSize':
		case 'strokeWidth':
			return VARIABLE_TYPES.NUMBER;
		case 'fontFamily':
		case 'fontWeight':
			return VARIABLE_TYPES.TEXT;
		default:
			return VARIABLE_TYPES.TEXT;
	}
}

/**
 * Helper: Get value from object for a specific property
 */
function getValueFromObjectProperty(obj, property) {
	if (obj.isChart && property === 'chartData') {
		return (
			obj.chartData || [
				{ label: 'Jan', value: 30 },
				{ label: 'Feb', value: 45 },
				{ label: 'Mar', value: 60 }
			]
		);
	}

	if (obj.isTable && property === 'tableData') {
		if (obj.tableType === 'stats') {
			return {
				headers: ['Metric', 'Value', 'Change'],
				rows: (obj.tableData || []).map((stat) => [stat.label, stat.value, stat.change || ''])
			};
		} else if (obj.tableType === 'comparison') {
			const features = obj.tableFeatures || [];
			const plans = obj.tablePlans || [];
			const headers = ['Feature', ...plans.map((p) => p.name)];
			const priceRow = ['Price', ...plans.map((p) => p.price)];
			const featureRows = features.map((f, idx) => [f, ...plans.map((p) => p.values?.[idx] || '')]);
			return { headers, rows: [priceRow, ...featureRows] };
		} else {
			return {
				headers: obj.tableHeaders || ['Product', 'Price', 'Stock'],
				rows: obj.tableRows || [
					['Item A', '$10', '100'],
					['Item B', '$20', '50']
				]
			};
		}
	}

	switch (property) {
		case 'text':
			return obj.text || '';
		case 'src':
			return obj.src || '';
		case 'fill':
			return obj.fill || '#000000';
		case 'stroke':
			return obj.stroke || '#000000';
		case 'opacity':
			return obj.opacity ?? 1;
		case 'fontSize':
			return obj.fontSize || 16;
		case 'strokeWidth':
			return obj.strokeWidth || 1;
		case 'fontFamily':
			return obj.fontFamily || 'Arial';
		case 'fontWeight':
			return obj.fontWeight || 'normal';
		default:
			return obj[property] || '';
	}
}

/**
 * Helper: Infer type from a value
 */
function inferTypeFromValue(value) {
	if (value === null || value === undefined) return VARIABLE_TYPES.TEXT;
	if (typeof value === 'boolean') return VARIABLE_TYPES.BOOLEAN;
	if (typeof value === 'number') return VARIABLE_TYPES.NUMBER;
	if (typeof value === 'string') {
		if (value.startsWith('#') || value.startsWith('rgb')) return VARIABLE_TYPES.COLOR;
		if (value.startsWith('http') && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value)) {
			return VARIABLE_TYPES.IMAGE;
		}
		return VARIABLE_TYPES.TEXT;
	}
	if (Array.isArray(value)) {
		// Check if it looks like chart data
		if (value.length > 0 && value[0].label !== undefined && value[0].value !== undefined) {
			return VARIABLE_TYPES.CHART;
		}
		return VARIABLE_TYPES.ARRAY;
	}
	if (typeof value === 'object') {
		// Check if it looks like table data
		if (value.headers && value.rows) return VARIABLE_TYPES.TABLE;
		return VARIABLE_TYPES.OBJECT;
	}
	return VARIABLE_TYPES.TEXT;
}

// Export default for convenience
export default {
	variables,
	variablesBySource,
	variablesByType,
	variableNames,
	variableStats,
	actions: variableActions,
	TYPES: VARIABLE_TYPES,
	SOURCES: VARIABLE_SOURCES
};
