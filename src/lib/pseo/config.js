// Central config for Programmatic SEO
// This file re-exports from modular files for backward compatibility
// Individual imports from specific files are preferred for better tree-shaking

// Templates and dimensions
export { dimensionContexts } from './templates.js';

// Comparisons and alternatives
export { comparisons, alternatives } from './comparisons.js';

// Integrations
export { integrationCategories, integrations } from './integrations.js';

// Formats and sizes
export { formats, popularSizes, apiLanguages } from './formats.js';

// OG platforms
export { ogPlatforms, platformGuides, platformRecommendedSizes } from './og-platforms.js';

// Use cases
export { useCases, useCaseDetails } from './use-cases.js';

// Utility functions
export { parseSize, sizeUrl, baseFormatUrl } from './utils.js';
