const DEFAULT_FALLBACK_COLOR = '#000000';
const GRADIENT_ANGLE = 90;

const numberOr = (value, fallback = 0) =>
	typeof value === 'number' && !Number.isNaN(value) ? value : fallback;

const defaultStops = (color = DEFAULT_FALLBACK_COLOR) => [
	{ color, offset: 0 },
	{ color, offset: 1 }
];

export function clamp(value, min = 0, max = 1) {
	const number = numberOr(value, min);
	return Math.min(max, Math.max(min, number));
}

export function isGradientValue(value) {
	if (!value) return false;

	if (typeof value === 'string') {
		return value.toLowerCase().includes('gradient');
	}

	if (Array.isArray(value)) {
		return value.every((stop) => stop && typeof stop === 'object' && 'color' in stop);
	}

	if (typeof value === 'object') {
		// Check for Fabric.js Gradient object with colorStops
		if (Array.isArray(value.colorStops) && value.colorStops.length > 0) {
			return true;
		}
		// Check for alternate gradient format with stops
		if (Array.isArray(value.stops) && value.stops.length > 0) {
			return true;
		}
		// Check for gradient type property
		if (typeof value.type === 'string' && value.type.toLowerCase().includes('gradient')) {
			return true;
		}
		// Check for Fabric.js Gradient coords (definitive sign of a gradient)
		if (value.coords && typeof value.coords === 'object') {
			return true;
		}
	}

	return false;
}

export function normalizeStops(stops, defaultColor = DEFAULT_FALLBACK_COLOR) {
	if (!Array.isArray(stops) || stops.length === 0) {
		return defaultStops(defaultColor);
	}

	const sanitized = stops
		.map((stop, index) => ({
			...stop,
			color: stop?.color || defaultColor,
			offset:
				typeof stop?.offset === 'number'
					? clamp(stop.offset)
					: clamp(index / Math.max(stops.length - 1, 1))
		}))
		.sort((a, b) => a.offset - b.offset);

	if (!sanitized.length) {
		return defaultStops(defaultColor);
	}

	const normalized = [...sanitized];

	const first = normalized[0];
	if (first.offset > 0) {
		normalized.unshift({ ...first, color: first.color, offset: 0 });
	} else if (first.offset < 0) {
		normalized[0] = { ...first, offset: 0 };
	}

	const lastIndex = normalized.length - 1;
	const last = normalized[lastIndex];
	if (last.offset < 1) {
		normalized.push({ ...last, color: last.color, offset: 1 });
	} else if (last.offset > 1) {
		normalized[lastIndex] = { ...last, offset: 1 };
	}

	if (normalized.length === 1) {
		normalized.push({ ...normalized[0], color: normalized[0].color, offset: 1 });
	}

	return normalized;
}

export function toGradientStops(value, defaultColor = DEFAULT_FALLBACK_COLOR) {
	if (!value) {
		return defaultStops(defaultColor);
	}

	if (Array.isArray(value)) {
		return normalizeStops(value, defaultColor);
	}

	if (typeof value === 'object') {
		// Handle Fabric.js Gradient objects
		if (Array.isArray(value.colorStops)) {
			return normalizeStops(
				value.colorStops.map((stop, index) => ({
					color: stop?.color || defaultColor,
					offset:
						typeof stop?.offset === 'number'
							? stop.offset
							: index / Math.max(value.colorStops.length - 1, 1)
				})),
				defaultColor
			);
		}

		// Handle gradient objects with 'type' property (alternate format)
		if (typeof value.type === 'string' && value.type.toLowerCase().includes('gradient')) {
			// If it's a gradient but colorStops not found, try to extract from other properties
			if (value.stops) {
				return normalizeStops(
					value.stops.map((stop, index) => ({
						color: stop?.color || defaultColor,
						offset:
							typeof stop?.offset === 'number'
								? stop.offset
								: index / Math.max(value.stops.length - 1, 1)
					})),
					defaultColor
				);
			}
		}
	}

	if (typeof value === 'string') {
		if (value.toLowerCase().includes('gradient')) {
			return normalizeStops(parseCssGradient(value, defaultColor), defaultColor);
		}

		return defaultStops(value || defaultColor);
	}

	return defaultStops(defaultColor);
}

export function gradientStopsToCss(stops, angle = GRADIENT_ANGLE) {
	const normalized = normalizeStops(stops);
	const parts = normalized.map((stop) => {
		const percent = Math.round(clamp(stop.offset) * 100);
		return `${stop.color} ${percent}%`;
	});
	return `linear-gradient(${angle}deg, ${parts.join(', ')})`;
}

export function extractGradientAngle(gradient) {
	// Try to extract angle from Fabric.js gradient coords
	if (!gradient || typeof gradient !== 'object' || !gradient.coords) {
		return GRADIENT_ANGLE; // Default
	}

	const { x1, y1, x2, y2 } = gradient.coords;

	// Calculate angle from coordinates
	const dx = x2 - x1;
	const dy = y2 - y1;

	// Convert to degrees (0 = top to bottom, 90 = left to right)
	let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
	angle = (angle + 90) % 360;

	// Normalize to 0-360
	if (angle < 0) angle += 360;

	return Math.round(angle);
}

function parseCssGradient(value, defaultColor = DEFAULT_FALLBACK_COLOR) {
	const start = value.indexOf('(');
	const end = value.lastIndexOf(')');

	if (start === -1 || end === -1) {
		return defaultStops(defaultColor);
	}

	const inner = value.slice(start + 1, end);
	const parts = splitGradientArgs(inner);

	if (!parts.length) {
		return defaultStops(defaultColor);
	}

	let stopParts = parts;
	if (parts.length > 1 && isDirectionToken(parts[0])) {
		stopParts = parts.slice(1);
	}

	const stops = stopParts
		.map((part, index) => parseCssGradientStop(part, index, stopParts.length))
		.filter(Boolean);

	return stops.length ? stops : defaultStops(defaultColor);
}

function splitGradientArgs(value) {
	const result = [];
	let current = '';
	let depth = 0;

	for (const char of value) {
		if (char === '(') depth += 1;
		if (char === ')') depth = Math.max(0, depth - 1);

		if (char === ',' && depth === 0) {
			if (current.trim()) {
				result.push(current.trim());
			}
			current = '';
		} else {
			current += char;
		}
	}

	if (current.trim()) {
		result.push(current.trim());
	}

	return result;
}

function isDirectionToken(token) {
	return /(deg|grad|rad|turn|to\s|circle|ellipse)/i.test(token);
}

function parseCssGradientStop(part, index, totalParts) {
	const trimmed = part.trim();
	if (!trimmed) {
		return null;
	}

	let color = trimmed;
	let offset = null;

	const lastSpace = trimmed.lastIndexOf(' ');
	if (lastSpace > -1) {
		const potentialOffset = trimmed.slice(lastSpace + 1).trim();
		if (/^-?\d+(\.\d+)?%?$/.test(potentialOffset)) {
			const numeric = parseFloat(potentialOffset);
			if (!Number.isNaN(numeric)) {
				offset = potentialOffset.includes('%') || numeric > 1 ? numeric / 100 : numeric;
				color = trimmed.slice(0, lastSpace).trim();
			}
		}
	}

	if (!color) {
		return null;
	}

	if (offset === null) {
		offset = totalParts > 1 ? index / (totalParts - 1) : 0;
	}

	return {
		color,
		offset: clamp(offset)
	};
}
