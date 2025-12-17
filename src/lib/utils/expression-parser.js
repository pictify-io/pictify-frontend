/**
 * Expression Parser Utility
 * Extracts variable references from conditional expressions and determines their types
 */

/**
 * Parse a conditional expression and extract variable references
 * @param {string} expression - The conditional expression (e.g., "user.isPremium && credits > 10")
 * @returns {Array} Array of variable objects with { name, isObject, properties }
 */
export function extractVariablesFromExpression(expression) {
	if (!expression || typeof expression !== 'string') {
		return [];
	}

	// Remove string literals to avoid false positives
	const withoutStrings = expression.replace(/'[^']*'|"[^"]*"/g, '""');
	
	// Replace common operators and symbols with spaces
	const cleaned = withoutStrings
		.replace(/[&|!<>=+\-*/%()[\]{}:?,;]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	
	// Split by spaces to get tokens
	const tokens = cleaned.split(' ').filter(token => {
		// Filter out numbers, boolean literals, null, undefined
		if (!token) return false;
		if (/^\d+(\.\d+)?$/.test(token)) return false; // numbers
		if (['true', 'false', 'null', 'undefined', 'NaN', 'Infinity'].includes(token)) return false;
		if (['typeof', 'instanceof', 'new', 'return', 'if', 'else', 'switch', 'case', 'break'].includes(token)) return false;
		return true;
	});
	
	// Extract unique variable names and detect if they're objects (have dot notation)
	const variableMap = new Map();
	
	tokens.forEach(token => {
		// Check if token contains dot notation (e.g., "user.isPremium")
		if (token.includes('.')) {
			const parts = token.split('.');
			const topLevel = parts[0];
			
			if (!variableMap.has(topLevel)) {
				variableMap.set(topLevel, {
					name: topLevel,
					isObject: true,
					properties: new Set()
				});
			}
			
			// Add the accessed property
			if (parts.length > 1) {
				variableMap.get(topLevel).properties.add(parts.slice(1).join('.'));
			}
		} else {
			// Simple variable without dot notation
			if (!variableMap.has(token)) {
				variableMap.set(token, {
					name: token,
					isObject: false,
					properties: new Set()
				});
			}
		}
	});
	
	// Convert to array and properties Set to Array
	return Array.from(variableMap.values()).map(v => ({
		...v,
		properties: Array.from(v.properties)
	}));
}

/**
 * Generate sample data for a variable based on its usage in expressions
 * @param {Object} variable - Variable object from extractVariablesFromExpression
 * @param {string} context - 'condition' or 'loop'
 * @returns {any} Sample data
 */
export function generateSampleData(variable, context = 'condition') {
	if (context === 'loop') {
		// For loop variables, always return a sample array
		return [
			{ id: 1, name: 'Item 1', value: 100 },
			{ id: 2, name: 'Item 2', value: 200 },
			{ id: 3, name: 'Item 3', value: 300 }
		];
	}
	
	// For conditional variables
	if (variable.isObject && variable.properties.length > 0) {
		// Generate object with sample properties
		const sampleObj = {};
		
		variable.properties.forEach(prop => {
			// Try to infer type from property name
			const lowerProp = prop.toLowerCase();
			
			if (lowerProp.includes('is') || lowerProp.includes('has') || lowerProp.includes('can')) {
				sampleObj[prop] = true; // boolean
			} else if (lowerProp.includes('count') || lowerProp.includes('age') || lowerProp.includes('total') || lowerProp.includes('price')) {
				sampleObj[prop] = 100; // number
			} else if (lowerProp.includes('name') || lowerProp.includes('title') || lowerProp.includes('label')) {
				sampleObj[prop] = 'Sample Text'; // string
			} else {
				sampleObj[prop] = 'value'; // default string
			}
		});
		
		return sampleObj;
	}
	
	// Simple variable - return a sensible default
	const lowerName = variable.name.toLowerCase();
	
	if (lowerName.includes('is') || lowerName.includes('has') || lowerName.includes('can')) {
		return true;
	} else if (lowerName.includes('count') || lowerName.includes('age') || lowerName.includes('total')) {
		return 10;
	}
	
	return 'value';
}

/**
 * Determine variable type based on usage
 * @param {Object} variable - Variable object from extractVariablesFromExpression
 * @param {string} context - 'condition' or 'loop'
 * @returns {string} Variable type
 */
export function getVariableType(variable, context = 'condition') {
	if (context === 'loop') {
		return 'array';
	}
	
	if (variable.isObject) {
		return 'object';
	}
	
	// Try to infer from name
	const lowerName = variable.name.toLowerCase();
	if (lowerName.includes('is') || lowerName.includes('has') || lowerName.includes('can')) {
		return 'boolean';
	}
	
	if (lowerName.includes('count') || lowerName.includes('age') || lowerName.includes('total') || lowerName.includes('price')) {
		return 'number';
	}
	
	return 'text';
}
