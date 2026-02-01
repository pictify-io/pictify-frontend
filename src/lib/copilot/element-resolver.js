/**
 * Element Resolver
 *
 * Resolves natural language element references to actual canvas elements.
 * Supports ID, label, type, color, and position-based references.
 *
 * Example references:
 * - "the blue button"
 * - "the header text"
 * - "top left element"
 * - "element-123" (direct ID)
 */

// =============================================================================
// Simple Spatial Index (No external dependencies)
// =============================================================================

/**
 * Simple spatial index for O(log n) element lookups
 * Uses a grid-based approach for fast spatial queries
 */
class SpatialIndex {
  constructor(gridSize = 100) {
    this.gridSize = gridSize;
    this.grid = new Map();
    this.elements = [];
  }

  /**
   * Get grid cell key for a position
   */
  getCellKey(x, y) {
    const cellX = Math.floor(x / this.gridSize);
    const cellY = Math.floor(y / this.gridSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Add element to index
   */
  add(element, bounds) {
    const entry = { element, bounds };
    this.elements.push(entry);

    // Add to all overlapping grid cells
    const minCellX = Math.floor(bounds.left / this.gridSize);
    const maxCellX = Math.floor((bounds.left + bounds.width) / this.gridSize);
    const minCellY = Math.floor(bounds.top / this.gridSize);
    const maxCellY = Math.floor((bounds.top + bounds.height) / this.gridSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key).push(entry);
      }
    }
  }

  /**
   * Find elements at a specific point
   */
  findAtPoint(x, y) {
    const key = this.getCellKey(x, y);
    const candidates = this.grid.get(key) || [];

    return candidates.filter(({ bounds }) =>
      x >= bounds.left && x <= bounds.left + bounds.width &&
      y >= bounds.top && y <= bounds.top + bounds.height
    ).map(({ element }) => element);
  }

  /**
   * Find elements in a region
   */
  findInRegion(left, top, width, height) {
    const results = new Set();
    const minCellX = Math.floor(left / this.gridSize);
    const maxCellX = Math.floor((left + width) / this.gridSize);
    const minCellY = Math.floor(top / this.gridSize);
    const maxCellY = Math.floor((top + height) / this.gridSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        const candidates = this.grid.get(key) || [];
        for (const { element, bounds } of candidates) {
          // Check if element overlaps with region
          if (bounds.left < left + width &&
              bounds.left + bounds.width > left &&
              bounds.top < top + height &&
              bounds.top + bounds.height > top) {
            results.add(element);
          }
        }
      }
    }

    return Array.from(results);
  }

  /**
   * Clear the index
   */
  clear() {
    this.grid.clear();
    this.elements = [];
  }
}

// =============================================================================
// Element Index
// =============================================================================

/**
 * Comprehensive element index for fast lookups
 */
export class ElementIndex {
  constructor() {
    this.byId = new Map();
    this.byLabel = new Map();
    this.byType = new Map();
    this.byColor = new Map();
    this.spatial = new SpatialIndex();
    this.canvasWidth = 0;
    this.canvasHeight = 0;
  }

  /**
   * Index all elements from canvas state
   * @param {object} canvasState - Fabric.js canvas JSON
   * @param {Map} labels - User-defined labels (id -> label)
   */
  index(canvasState, labels = new Map()) {
    this.clear();
    this.canvasWidth = canvasState.width || 1080;
    this.canvasHeight = canvasState.height || 1080;

    const elements = canvasState.objects || [];

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const id = el.id || `element-${i}`;

      // Index by ID
      this.byId.set(id, el);

      // Index by label (if provided)
      if (labels.has(id)) {
        const label = labels.get(id).toLowerCase();
        this.byLabel.set(label, el);
      }

      // Also check if element has a name property
      if (el.name) {
        this.byLabel.set(el.name.toLowerCase(), el);
      }

      // Index by type
      const type = el.type?.toLowerCase() || 'unknown';
      if (!this.byType.has(type)) {
        this.byType.set(type, []);
      }
      this.byType.get(type).push(el);

      // Index by color
      if (el.fill && el.fill !== 'transparent') {
        const color = this.normalizeColor(el.fill);
        if (!this.byColor.has(color)) {
          this.byColor.set(color, []);
        }
        this.byColor.get(color).push(el);
      }

      // Add to spatial index
      const bounds = this.getElementBounds(el);
      this.spatial.add(el, bounds);
    }
  }

  /**
   * Clear all indexes
   */
  clear() {
    this.byId.clear();
    this.byLabel.clear();
    this.byType.clear();
    this.byColor.clear();
    this.spatial.clear();
  }

  /**
   * Get element bounds accounting for scale and rotation
   */
  getElementBounds(el) {
    const scaleX = el.scaleX || 1;
    const scaleY = el.scaleY || 1;
    const width = (el.width || 0) * scaleX;
    const height = (el.height || 0) * scaleY;

    return {
      left: el.left || 0,
      top: el.top || 0,
      width,
      height
    };
  }

  /**
   * Normalize color to a simple name if possible
   */
  normalizeColor(color) {
    if (!color) return 'unknown';

    const colorLower = color.toLowerCase();

    // Check for common color names
    const colorNames = {
      '#ff0000': 'red', '#f00': 'red', 'red': 'red',
      '#00ff00': 'green', '#0f0': 'green', 'green': 'green', 'lime': 'green',
      '#0000ff': 'blue', '#00f': 'blue', 'blue': 'blue',
      '#ffff00': 'yellow', '#ff0': 'yellow', 'yellow': 'yellow',
      '#ff6600': 'orange', '#f60': 'orange', 'orange': 'orange',
      '#800080': 'purple', 'purple': 'purple',
      '#ffc0cb': 'pink', 'pink': 'pink',
      '#ffffff': 'white', '#fff': 'white', 'white': 'white',
      '#000000': 'black', '#000': 'black', 'black': 'black',
      '#808080': 'gray', 'gray': 'gray', 'grey': 'grey'
    };

    return colorNames[colorLower] || color;
  }

  /**
   * Find element by ID
   */
  findById(id) {
    return this.byId.get(id) || null;
  }

  /**
   * Find element by label
   */
  findByLabel(label) {
    return this.byLabel.get(label.toLowerCase()) || null;
  }

  /**
   * Find elements by type
   */
  findByType(type) {
    return this.byType.get(type.toLowerCase()) || [];
  }

  /**
   * Find elements by color
   */
  findByColor(color) {
    const normalized = this.normalizeColor(color);
    return this.byColor.get(normalized) || [];
  }

  /**
   * Find elements in a canvas region (e.g., "top left")
   */
  findInRegion(regionDesc) {
    const region = this.parseRegion(regionDesc);
    if (!region) return [];

    return this.spatial.findInRegion(
      region.left,
      region.top,
      region.width,
      region.height
    );
  }

  /**
   * Parse region description to bounds
   */
  parseRegion(desc) {
    const descLower = desc.toLowerCase();
    const thirdW = this.canvasWidth / 3;
    const thirdH = this.canvasHeight / 3;

    // Vertical position
    let top = 0, height = this.canvasHeight;
    if (descLower.includes('top')) {
      top = 0;
      height = thirdH;
    } else if (descLower.includes('bottom')) {
      top = thirdH * 2;
      height = thirdH;
    } else if (descLower.includes('middle') || descLower.includes('center')) {
      top = thirdH;
      height = thirdH;
    }

    // Horizontal position
    let left = 0, width = this.canvasWidth;
    if (descLower.includes('left')) {
      left = 0;
      width = thirdW;
    } else if (descLower.includes('right')) {
      left = thirdW * 2;
      width = thirdW;
    } else if (descLower.includes('center')) {
      left = thirdW;
      width = thirdW;
    }

    return { left, top, width, height };
  }

  /**
   * Find elements at a specific point
   */
  findAtPoint(x, y) {
    return this.spatial.findAtPoint(x, y);
  }
}

// =============================================================================
// Reference Resolution
// =============================================================================

// Common type aliases
const TYPE_ALIASES = {
  button: ['rect', 'group'],
  heading: ['text', 'textbox', 'i-text'],
  title: ['text', 'textbox', 'i-text'],
  paragraph: ['textbox', 'text'],
  image: ['image'],
  photo: ['image'],
  picture: ['image'],
  shape: ['rect', 'circle', 'ellipse', 'polygon'],
  box: ['rect'],
  circle: ['circle'],
  icon: ['image', 'group']
};

// Color keywords
const COLOR_KEYWORDS = [
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
  'black', 'white', 'gray', 'grey', 'brown', 'cyan', 'magenta'
];

// Position keywords
const POSITION_KEYWORDS = [
  'top', 'bottom', 'left', 'right', 'center', 'middle',
  'top left', 'top right', 'bottom left', 'bottom right',
  'header', 'footer'
];

/**
 * Resolve a natural language element reference
 *
 * @param {string} reference - Natural language reference
 * @param {object} canvasState - Fabric.js canvas JSON
 * @param {Map} labels - User-defined labels
 * @returns {object[]} Matching elements
 */
export function resolveElementReference(reference, canvasState, labels = new Map()) {
  const index = new ElementIndex();
  index.index(canvasState, labels);

  const refLower = reference.toLowerCase().trim();

  // 1. Try exact ID match
  const byId = index.findById(reference);
  if (byId) return [byId];

  // 2. Try label match
  const byLabel = index.findByLabel(refLower);
  if (byLabel) return [byLabel];

  // 3. Try type match with aliases
  for (const [alias, types] of Object.entries(TYPE_ALIASES)) {
    if (refLower.includes(alias)) {
      const results = [];
      for (const type of types) {
        results.push(...index.findByType(type));
      }
      if (results.length > 0) {
        // If color is also mentioned, filter by color
        const colorMatch = COLOR_KEYWORDS.find(c => refLower.includes(c));
        if (colorMatch) {
          const filtered = results.filter(el =>
            index.normalizeColor(el.fill) === colorMatch ||
            index.normalizeColor(el.stroke) === colorMatch
          );
          if (filtered.length > 0) return filtered;
        }

        // If position is mentioned, filter by position
        const posMatch = POSITION_KEYWORDS.find(p => refLower.includes(p));
        if (posMatch) {
          const regionElements = index.findInRegion(posMatch);
          const filtered = results.filter(el => regionElements.includes(el));
          if (filtered.length > 0) return filtered;
        }

        return results;
      }
    }
  }

  // 4. Try color match
  const colorMatch = COLOR_KEYWORDS.find(c => refLower.includes(c));
  if (colorMatch) {
    const byColor = index.findByColor(colorMatch);
    if (byColor.length > 0) {
      // If type is also mentioned, filter
      const typeWord = refLower.replace(colorMatch, '').trim();
      if (typeWord) {
        for (const [alias, types] of Object.entries(TYPE_ALIASES)) {
          if (typeWord.includes(alias)) {
            return byColor.filter(el => types.includes(el.type?.toLowerCase()));
          }
        }
      }
      return byColor;
    }
  }

  // 5. Try position match
  const posMatch = POSITION_KEYWORDS.find(p => refLower.includes(p));
  if (posMatch) {
    return index.findInRegion(posMatch);
  }

  // 6. Try direct type match
  const types = ['text', 'textbox', 'rect', 'circle', 'image', 'group'];
  for (const type of types) {
    if (refLower.includes(type)) {
      return index.findByType(type);
    }
  }

  // 7. No match found
  return [];
}

/**
 * Get a human-readable description of an element
 *
 * @param {object} element - Fabric.js element
 * @param {Map} labels - User-defined labels
 * @returns {string}
 */
export function describeElement(element, labels = new Map()) {
  const id = element.id || 'unknown';
  const label = labels.get(id);
  const type = element.type || 'element';

  if (label) return `"${label}" (${type})`;

  // Generate description based on properties
  const parts = [];

  // Color
  if (element.fill && element.fill !== 'transparent') {
    const color = new ElementIndex().normalizeColor(element.fill);
    if (COLOR_KEYWORDS.includes(color)) {
      parts.push(color);
    }
  }

  // Type
  parts.push(type);

  // Content hint for text
  if (element.text && element.text.length < 30) {
    return `${parts.join(' ')} "${element.text.substring(0, 20)}${element.text.length > 20 ? '...' : ''}"`;
  }

  return parts.join(' ');
}
