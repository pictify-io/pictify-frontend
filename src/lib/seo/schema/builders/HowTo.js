/**
 * HowTo Schema Builder
 * Generates HowTo schema for step-by-step guides and tutorials
 */

import { BASE_URL, SITE_NAME } from '../../metadata/templates.js';

/**
 * @typedef {Object} HowToStep
 * @property {string} name - Step name/title
 * @property {string} text - Step description
 * @property {string} [image] - Optional image URL for the step
 * @property {string} [url] - Optional URL for the step
 */

/**
 * @typedef {Object} HowToData
 * @property {string} name - How-to name/title
 * @property {string} description - How-to description
 * @property {string} [image] - Main image URL
 * @property {string} [totalTime] - ISO 8601 duration (e.g., "PT30M" for 30 minutes)
 * @property {string} [estimatedCost] - Estimated cost description
 * @property {HowToStep[]} steps - Array of steps
 */

/**
 * Build HowTo schema
 * @param {HowToData} data - How-to data
 * @returns {Object|null} HowTo schema or null if no valid steps
 */
export function buildHowToSchema(data) {
	if (!data.steps || data.steps.length === 0) {
		return null;
	}

	const schema = {
		'@type': 'HowTo',
		name: data.name,
		description: data.description,
		step: data.steps.map((step, index) => buildStepSchema(step, index + 1))
	};

	// Optional fields
	if (data.image) {
		schema.image = {
			'@type': 'ImageObject',
			url: data.image
		};
	}

	if (data.totalTime) {
		schema.totalTime = data.totalTime;
	}

	if (data.estimatedCost) {
		schema.estimatedCost = {
			'@type': 'MonetaryAmount',
			currency: 'USD',
			value: data.estimatedCost
		};
	}

	return schema;
}

/**
 * Build a single HowToStep schema
 * @param {HowToStep} step - Step data
 * @param {number} position - Step position (1-indexed)
 * @returns {Object} HowToStep schema
 */
export function buildStepSchema(step, position) {
	const schema = {
		'@type': 'HowToStep',
		position,
		name: step.name,
		text: step.text
	};

	if (step.image) {
		schema.image = step.image;
	}

	if (step.url) {
		schema.url = step.url;
	}

	return schema;
}

/**
 * Build HowTo schema for migration guides
 * @param {Object} comparison - Comparison data with migration info
 * @returns {Object|null} HowTo schema for migration
 */
export function buildMigrationHowToSchema(comparison) {
	if (!comparison.migration || !comparison.migration.steps || comparison.migration.steps.length === 0) {
		return null;
	}

	return buildHowToSchema({
		name: `How to Switch from ${comparison.competitor} to Pictify`,
		description: `Step-by-step guide to migrate from ${comparison.competitor} to Pictify. Difficulty: ${comparison.migration.difficulty}. Estimated time: ${comparison.migration.timeEstimate}.`,
		totalTime: estimateDuration(comparison.migration.timeEstimate),
		steps: comparison.migration.steps.map(step => ({
			name: step,
			text: step
		}))
	});
}

/**
 * Convert time estimate string to ISO 8601 duration
 * @param {string} estimate - Time estimate (e.g., "30 minutes", "1 hour")
 * @returns {string} ISO 8601 duration
 */
function estimateDuration(estimate) {
	if (!estimate) return 'PT30M';

	const lower = estimate.toLowerCase();

	if (lower.includes('hour')) {
		const hours = parseInt(lower) || 1;
		return `PT${hours}H`;
	}

	if (lower.includes('minute')) {
		const minutes = parseInt(lower) || 30;
		return `PT${minutes}M`;
	}

	if (lower.includes('day')) {
		const days = parseInt(lower) || 1;
		return `P${days}D`;
	}

	return 'PT30M'; // Default to 30 minutes
}
