/**
 * Smart text auto-resizing utilities for FabricJS text objects
 * Provides BannerBear-like text fitting capabilities
 */

/**
 * Auto-resize text to fit within a bounding box
 * @param {fabric.IText} textObj - FabricJS text object
 * @param {Object} options - Resize options
 * @param {number} options.maxWidth - Maximum width
 * @param {number} options.maxHeight - Maximum height
 * @param {number} options.minFontSize - Minimum font size (default: 8)
 * @param {number} options.maxFontSize - Maximum font size (default: 200)
 * @param {string} options.mode - 'shrink', 'grow', or 'fit' (default: 'shrink')
 */
export function autoResizeText(textObj, options = {}) {
	const {
		maxWidth = 0,
		maxHeight = 0,
		minFontSize = 8,
		maxFontSize = 200,
		mode = 'shrink'
	} = options;

	if (!textObj || !textObj.text) return;

	const originalFontSize = textObj.fontSize;
	let currentFontSize = originalFontSize;

	// Mode: shrink - only reduce font size if text is too large
	if (mode === 'shrink') {
		while (currentFontSize > minFontSize) {
			textObj.set('fontSize', currentFontSize);
			const bounds = textObj.getBoundingRect();

			const fitsWidth = !maxWidth || bounds.width <= maxWidth;
			const fitsHeight = !maxHeight || bounds.height <= maxHeight;

			if (fitsWidth && fitsHeight) {
				break;
			}

			currentFontSize -= 1;
		}
	}

	// Mode: grow - increase font size to fill available space
	else if (mode === 'grow') {
		while (currentFontSize < maxFontSize) {
			textObj.set('fontSize', currentFontSize + 1);
			const bounds = textObj.getBoundingRect();

			const exceedsWidth = maxWidth && bounds.width > maxWidth;
			const exceedsHeight = maxHeight && bounds.height > maxHeight;

			if (exceedsWidth || exceedsHeight) {
				textObj.set('fontSize', currentFontSize); // Revert
				break;
			}

			currentFontSize += 1;
		}
	}

	// Mode: fit - optimize font size to best fit the space
	else if (mode === 'fit') {
		// Binary search for optimal font size
		let low = minFontSize;
		let high = maxFontSize;
		let bestFit = minFontSize;

		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			textObj.set('fontSize', mid);
			const bounds = textObj.getBoundingRect();

			const fitsWidth = !maxWidth || bounds.width <= maxWidth;
			const fitsHeight = !maxHeight || bounds.height <= maxHeight;

			if (fitsWidth && fitsHeight) {
				bestFit = mid;
				low = mid + 1; // Try larger
			} else {
				high = mid - 1; // Try smaller
			}
		}

		textObj.set('fontSize', bestFit);
	}

	textObj.setCoords();
}

/**
 * Auto-wrap text to fit within a maximum width
 * @param {fabric.IText} textObj - FabricJS text object
 * @param {number} maxWidth - Maximum width in pixels
 */
export function autoWrapText(textObj, maxWidth) {
	if (!textObj || !textObj.text) return;

	const words = textObj.text.split(' ');
	let lines = [];
	let currentLine = '';

	// Create temporary text object for measurement
	const tempText = new fabric.Text('', {
		fontSize: textObj.fontSize,
		fontFamily: textObj.fontFamily,
		fontWeight: textObj.fontWeight
	});

	words.forEach((word) => {
		const testLine = currentLine + (currentLine ? ' ' : '') + word;
		tempText.set('text', testLine);

		if (tempText.width > maxWidth && currentLine) {
			lines.push(currentLine);
			currentLine = word;
		} else {
			currentLine = testLine;
		}
	});

	if (currentLine) {
		lines.push(currentLine);
	}

	textObj.set('text', lines.join('\n'));
	textObj.setCoords();
}

/**
 * Truncate text with ellipsis if it exceeds bounds
 * @param {fabric.IText} textObj - FabricJS text object
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @param {string} ellipsis - Ellipsis string (default: '...')
 */
export function truncateText(textObj, maxWidth, maxHeight, ellipsis = '...') {
	if (!textObj || !textObj.text) return;

	const originalText = textObj.text;
	let truncated = originalText;

	while (truncated.length > 0) {
		textObj.set('text', truncated + ellipsis);
		const bounds = textObj.getBoundingRect();

		const fitsWidth = !maxWidth || bounds.width <= maxWidth;
		const fitsHeight = !maxHeight || bounds.height <= maxHeight;

		if (fitsWidth && fitsHeight) {
			break;
		}

		truncated = truncated.slice(0, -1);
	}

	textObj.setCoords();
}

/**
 * Apply smart text fitting based on strategy
 * @param {fabric.IText} textObj - FabricJS text object
 * @param {Object} bounds - Bounding constraints
 * @param {string} strategy - 'resize', 'wrap', 'truncate', or 'auto'
 */
export function smartFitText(textObj, bounds = {}, strategy = 'auto') {
	const { maxWidth = 0, maxHeight = 0, minFontSize = 8, maxFontSize = 200 } = bounds;

	if (!textObj || !textObj.text) return;

	// Auto-detect best strategy
	if (strategy === 'auto') {
		const textBounds = textObj.getBoundingRect();
		const widthRatio = maxWidth ? textBounds.width / maxWidth : 1;
		const heightRatio = maxHeight ? textBounds.height / maxHeight : 1;

		if (widthRatio > 2 || heightRatio > 2) {
			strategy = 'resize'; // Text is much too large
		} else if (widthRatio > 1.2) {
			strategy = 'wrap'; // Text is a bit too wide
		} else if (widthRatio > 1) {
			strategy = 'truncate'; // Text is slightly too wide
		} else {
			return; // Text fits fine
		}
	}

	switch (strategy) {
		case 'resize':
			autoResizeText(textObj, { maxWidth, maxHeight, minFontSize, maxFontSize, mode: 'shrink' });
			break;
		case 'wrap':
			autoWrapText(textObj, maxWidth);
			break;
		case 'truncate':
			truncateText(textObj, maxWidth, maxHeight);
			break;
	}
}

/**
 * Add auto-resize behavior to text object on edit
 * @param {fabric.Canvas} canvas - FabricJS canvas
 * @param {Object} options - Auto-resize options
 */
export function enableAutoResize(canvas, options = {}) {
	if (!canvas) return;

	const handleTextEditing = (e) => {
		const obj = e.target;
		if (!obj || (obj.type !== 'i-text' && obj.type !== 'text')) return;

		// Store original properties
		if (!obj._originalFontSize) {
			obj._originalFontSize = obj.fontSize;
		}
	};

	const handleTextChanged = (e) => {
		const obj = e.target;
		if (!obj || (obj.type !== 'i-text' && obj.type !== 'text')) return;

		// Apply smart fitting if bounds are defined
		if (obj._autoResizeBounds) {
			smartFitText(obj, obj._autoResizeBounds, obj._autoResizeStrategy || 'auto');
			canvas.renderAll();
		}
	};

	canvas.on('text:editing:entered', handleTextEditing);
	canvas.on('text:changed', handleTextChanged);

	// Return cleanup function
	return () => {
		canvas.off('text:editing:entered', handleTextEditing);
		canvas.off('text:changed', handleTextChanged);
	};
}

/**
 * Set auto-resize bounds for a text object
 * @param {fabric.IText} textObj - FabricJS text object
 * @param {Object} bounds - Bounding constraints
 * @param {string} strategy - Fitting strategy
 */
export function setTextBounds(textObj, bounds, strategy = 'auto') {
	if (!textObj) return;

	textObj._autoResizeBounds = bounds;
	textObj._autoResizeStrategy = strategy;
}

/**
 * Remove auto-resize bounds from a text object
 * @param {fabric.IText} textObj - FabricJS text object
 */
export function clearTextBounds(textObj) {
	if (!textObj) return;

	delete textObj._autoResizeBounds;
	delete textObj._autoResizeStrategy;
	delete textObj._originalFontSize;
}
