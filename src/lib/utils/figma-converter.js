/**
 * Figma-to-FabricJS Converter
 *
 * Converts Figma node tree (JSON_REST_V1 format) into FabricJS v6 canvas objects.
 * Walks the entire tree recursively. Converts everything it can to editable objects.
 * For nodes it can't convert (complex vectors, boolean ops), uses fallback PNG images.
 *
 * Supported Figma properties:
 *   - Node types: RECTANGLE, ELLIPSE, LINE, TEXT, VECTOR, BOOLEAN_OPERATION, STAR,
 *     REGULAR_POLYGON, FRAME, GROUP, COMPONENT, COMPONENT_SET, INSTANCE, SECTION,
 *     WASHI_TAPE, STICKY, SHAPE_WITH_TEXT, CONNECTOR, TABLE, TABLE_CELL
 *   - Fills: SOLID, GRADIENT_LINEAR, GRADIENT_RADIAL, GRADIENT_ANGULAR, GRADIENT_DIAMOND, IMAGE
 *   - Strokes: color, weight, individualStrokeWeights, dashPattern, alignment, cap, join, gradient strokes
 *   - Effects: DROP_SHADOW, INNER_SHADOW (as outer), LAYER_BLUR, BACKGROUND_BLUR (stored)
 *   - Corner radius: uniform + per-corner (rectangleCornerRadii) with Path fallback, clamped
 *   - Text: fontSize, fontFamily, fontWeight, fontStyle, textAlign, textAlignVertical,
 *     lineHeight (all units), letterSpacing, textDecoration, textCase (incl. SMALL_CAPS),
 *     characterStyleOverrides, textAutoResize, lineTypes/lineIndentations (lists)
 *   - Opacity, blendMode, rotation, clipsContent
 *   - Ellipse arcData (partial arcs)
 *   - Transform matrix decomposition (rotation, skew, flip)
 *   - Mask nodes → clipPath on sibling groups
 */

import {
	Rect,
	Ellipse,
	Textbox,
	FabricText,
	Group,
	Path,
	FabricImage,
	Gradient,
	Shadow,
	LayoutManager,
	FixedLayout
} from 'fabric';

const DEBUG = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
const _logs = [];
function log(...args) {
	_logs.push({
		ts: Date.now(),
		args: args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
	});
}
function warn(...args) {
	_logs.push({
		ts: Date.now(),
		level: 'warn',
		args: args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
	});
}
function logError(...args) {
	_logs.push({
		ts: Date.now(),
		level: 'error',
		args: args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
	});
}

// ─── Color & Style Helpers ──────────────────────────────────────────

function figmaColorToRgba(color, opacity = 1) {
	if (!color) return 'transparent';
	const r = Math.round((color.r || 0) * 255);
	const g = Math.round((color.g || 0) * 255);
	const b = Math.round((color.b || 0) * 255);
	const a = (color.a ?? 1) * opacity;
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ─── Gradient Conversion ────────────────────────────────────────────

function figmaGradientToFabric(fill, width, height) {
	if (!fill.gradientHandlePositions || fill.gradientStops?.length < 2) return null;
	const handles = fill.gradientHandlePositions;
	const stops = fill.gradientStops;
	const colorStops = stops.map((s) => ({ offset: s.position, color: figmaColorToRgba(s.color) }));

	if (fill.type === 'GRADIENT_LINEAR') {
		return new Gradient({
			type: 'linear',
			coords: {
				x1: handles[0].x * width,
				y1: handles[0].y * height,
				x2: handles[1].x * width,
				y2: handles[1].y * height
			},
			colorStops
		});
	}

	// GRADIENT_ANGULAR: FabricJS doesn't support conic gradients; approximate as radial
	if (fill.type === 'GRADIENT_RADIAL' || fill.type === 'GRADIENT_ANGULAR') {
		return new Gradient({
			type: 'radial',
			coords: {
				x1: handles[0].x * width,
				y1: handles[0].y * height,
				r1: 0,
				x2: handles[0].x * width,
				y2: handles[0].y * height,
				r2: Math.max(width, height) / 2
			},
			colorStops
		});
	}

	if (fill.type === 'GRADIENT_DIAMOND') {
		return new Gradient({
			type: 'linear',
			coords: {
				x1: handles[0].x * width,
				y1: handles[0].y * height,
				x2: handles[1].x * width,
				y2: handles[1].y * height
			},
			colorStops
		});
	}

	return null;
}

// ─── Fill Extraction ────────────────────────────────────────────────

function getFill(node, width, height) {
	const fills = node.fills?.filter((f) => f.visible !== false) || [];
	if (fills.length === 0) return { fill: 'transparent' };

	// Use topmost fill (Figma renders bottom-to-top, last = top)
	const fill = fills[fills.length - 1];

	if (fill.type === 'SOLID') {
		return { fill: figmaColorToRgba(fill.color, fill.opacity ?? 1) };
	}

	if (fill.type.startsWith('GRADIENT_')) {
		const gradient = figmaGradientToFabric(fill, width || 100, height || 100);
		if (gradient) return { fill: gradient };
	}

	if (fill.type === 'IMAGE') {
		return { fill: '#cccccc', _hasImageFill: true };
	}

	return { fill: 'transparent' };
}

// ─── Stroke Extraction ──────────────────────────────────────────────

function getStroke(node, width, height) {
	const strokes = node.strokes?.filter((s) => s.visible !== false) || [];
	if (strokes.length === 0) return {};

	// Use topmost visible stroke (Figma renders bottom-to-top)
	const stroke = strokes[strokes.length - 1];
	const result = {};

	// Stroke fill: support solid and gradient strokes
	if (stroke.type?.startsWith('GRADIENT_')) {
		const gradient = figmaGradientToFabric(stroke, width || 100, height || 100);
		if (gradient) result.stroke = gradient;
	}
	if (!result.stroke) {
		result.stroke = figmaColorToRgba(stroke.color, stroke.opacity ?? 1);
	}

	// Stroke weight: prefer individualStrokeWeights, fall back to uniform
	if (node.individualStrokeWeights) {
		const isw = node.individualStrokeWeights;
		// FabricJS doesn't support per-side strokes; use the max as best approximation
		result.strokeWidth = Math.max(isw.top || 0, isw.right || 0, isw.bottom || 0, isw.left || 0);
	} else {
		result.strokeWidth = node.strokeWeight || 1;
	}

	// Stroke dash pattern
	if (node.strokeDashes && node.strokeDashes.length > 0) {
		result.strokeDashArray = node.strokeDashes;
	}

	// Stroke cap: Figma uses NONE/ROUND/SQUARE, FabricJS uses butt/round/square
	if (node.strokeCap) {
		const capMap = { NONE: 'butt', ROUND: 'round', SQUARE: 'square' };
		if (capMap[node.strokeCap]) {
			result.strokeLineCap = capMap[node.strokeCap];
		}
	}

	// Stroke join: Figma uses MITER/BEVEL/ROUND, FabricJS same in lowercase
	if (node.strokeJoin) {
		result.strokeLineJoin = node.strokeJoin.toLowerCase();
	}

	// Stroke miter limit
	if (node.strokeMiterAngle) {
		result.strokeMiterLimit = node.strokeMiterAngle;
	}

	return result;
}

// ─── Effects (Shadows, Blurs) ───────────────────────────────────────

function getEffects(node) {
	const effects = node.effects?.filter((e) => e.visible !== false) || [];
	if (effects.length === 0) return {};

	const result = {};

	// Use the most prominent shadow (FabricJS supports only one)
	// Prefer DROP_SHADOW over INNER_SHADOW; pick the one with largest visual impact
	const shadows = effects.filter((e) => e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW');
	if (shadows.length > 0) {
		// Sort by visual prominence: blur + abs(offsetX) + abs(offsetY)
		const best = shadows.reduce((a, b) => {
			const scoreA = (a.radius || 0) + Math.abs(a.offset?.x || 0) + Math.abs(a.offset?.y || 0);
			const scoreB = (b.radius || 0) + Math.abs(b.offset?.x || 0) + Math.abs(b.offset?.y || 0);
			return scoreB > scoreA ? b : a;
		});
		result.shadow = new Shadow({
			color: figmaColorToRgba(best.color),
			blur: (best.radius || 0) + (best.spread || 0),
			offsetX: best.offset?.x || 0,
			offsetY: best.offset?.y || 0
		});
	}

	return result;
}

// ─── Blend Mode ─────────────────────────────────────────────────────

function getBlendMode(node) {
	if (!node.blendMode || node.blendMode === 'PASS_THROUGH' || node.blendMode === 'NORMAL') {
		return {};
	}
	const map = {
		DARKEN: 'darken',
		MULTIPLY: 'multiply',
		COLOR_BURN: 'color-burn',
		LIGHTEN: 'lighten',
		SCREEN: 'screen',
		COLOR_DODGE: 'color-dodge',
		OVERLAY: 'overlay',
		SOFT_LIGHT: 'soft-light',
		HARD_LIGHT: 'hard-light',
		DIFFERENCE: 'difference',
		EXCLUSION: 'exclusion',
		HUE: 'hue',
		SATURATION: 'saturation',
		COLOR: 'color',
		LUMINOSITY: 'luminosity',
		LINEAR_BURN: 'multiply', // Approximation
		LINEAR_DODGE: 'screen' // Approximation
	};
	const mode = map[node.blendMode];
	return mode ? { globalCompositeOperation: mode } : {};
}

// ─── Font & Text Helpers ────────────────────────────────────────────

function figmaFontWeight(style) {
	if (!style) return 400;
	const s = String(style).toLowerCase();
	if (s.includes('thin') || s.includes('hairline')) return 100;
	if (s.includes('extralight') || s.includes('ultralight')) return 200;
	if (s.includes('light')) return 300;
	if (s.includes('medium')) return 500;
	if (s.includes('semibold') || s.includes('demibold')) return 600;
	if (s.includes('extrabold') || s.includes('ultrabold')) return 800;
	if (s.includes('bold')) return 700;
	if (s.includes('black') || s.includes('heavy')) return 900;
	return 400;
}

function figmaTextAlign(align) {
	const map = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' };
	return map[align] || 'left';
}

/**
 * Apply textCase transformation to text content.
 * Figma supports UPPER, LOWER, TITLE, SMALL_CAPS, SMALL_CAPS_FORCED.
 */
function applyTextCase(text, textCase) {
	if (!textCase || textCase === 'ORIGINAL') return text;
	switch (textCase) {
		case 'UPPER':
			return text.toUpperCase();
		case 'LOWER':
			return text.toLowerCase();
		case 'TITLE':
			return text.replace(/\b\w/g, (c) => c.toUpperCase());
		case 'SMALL_CAPS':
		case 'SMALL_CAPS_FORCED':
			// Convert to uppercase; actual small-caps sizing handled via character styles
			return text.toUpperCase();
		default:
			return text;
	}
}

/**
 * Get line height multiplier from Figma's various line height representations.
 */
function getLineHeight(style) {
	if (!style) return 1.2;
	const fontSize = style.fontSize || 16;

	// Check lineHeightUnit for proper handling
	if (style.lineHeightUnit === 'INTRINSIC_%' || style.lineHeightUnit === 'INTRINSIC') {
		return 1.2; // Use FabricJS default for intrinsic
	}

	if (style.lineHeightUnit === 'FONT_SIZE_%' && style.lineHeightPercentFontSize) {
		return style.lineHeightPercentFontSize / 100;
	}

	if (style.lineHeightUnit === 'PIXELS' && style.lineHeightPx) {
		return style.lineHeightPx / fontSize;
	}

	// Fallback: if lineHeightPx is available, use it
	if (style.lineHeightPx) {
		return style.lineHeightPx / fontSize;
	}

	return 1.2;
}

/**
 * Prepend list markers to text based on lineTypes and lineIndentations.
 */
function applyListFormatting(text, lineTypes, lineIndentations) {
	if (!lineTypes || lineTypes.length === 0) return text;

	const lines = text.split('\n');
	const orderedCounters = {}; // Track counters per indent level

	const result = lines.map((line, i) => {
		const type = lineTypes[i] || 'NONE';
		const indent = lineIndentations?.[i] || 0;
		const indentStr = '  '.repeat(indent);

		if (type === 'UNORDERED') {
			return `${indentStr}\u2022 ${line}`;
		}
		if (type === 'ORDERED') {
			if (!orderedCounters[indent]) orderedCounters[indent] = 0;
			orderedCounters[indent]++;
			return `${indentStr}${orderedCounters[indent]}. ${line}`;
		}
		// Reset counter when we hit a non-ordered line
		orderedCounters[indent] = 0;
		return line;
	});

	return result.join('\n');
}

// ─── Transform Matrix Decomposition ─────────────────────────────────

/**
 * Decompose Figma's 2x3 relativeTransform matrix into rotation, scale, skew, flip.
 * Matrix format: [[a, c, tx], [b, d, ty]]
 * Where the columns are: [scaleX*cos, -scaleY*sin, tx], [scaleX*sin, scaleY*cos, ty]
 */
function decomposeTransform(matrix) {
	if (!matrix || !matrix[0] || !matrix[1]) return null;

	const a = matrix[0][0]; // cos * scaleX
	const b = matrix[1][0]; // sin * scaleX
	const c = matrix[0][1]; // -sin * scaleY (or skew)
	const d = matrix[1][1]; // cos * scaleY
	const tx = matrix[0][2] || 0;
	const ty = matrix[1][2] || 0;

	// Determinant tells us about flipping
	const det = a * d - b * c;

	// Scale
	let scaleX = Math.sqrt(a * a + b * b);
	let scaleY = Math.sqrt(c * c + d * d);

	// If determinant is negative, one axis is flipped
	if (det < 0) {
		scaleX = -scaleX;
	}

	// Rotation in radians
	const rotation = Math.atan2(b, a);

	// Skew
	const skewX = Math.atan2(a * c + b * d, a * d - b * c);

	return {
		rotation: rotation * (180 / Math.PI), // Convert to degrees
		scaleX,
		scaleY,
		skewX: skewX * (180 / Math.PI),
		flipX: det < 0,
		tx,
		ty
	};
}

// ─── Bounding Box Resolution ────────────────────────────────────────

function getNodeBounds(node, parentBounds) {
	if (node.absoluteBoundingBox) return node.absoluteBoundingBox;

	const w = node.size?.x || 0;
	const h = node.size?.y || 0;
	if (w === 0 && h === 0) return null;

	const tx = node.relativeTransform?.[0]?.[2] || 0;
	const ty = node.relativeTransform?.[1]?.[2] || 0;
	return {
		x: (parentBounds?.x || 0) + tx,
		y: (parentBounds?.y || 0) + ty,
		width: w,
		height: h
	};
}

// ─── ClipPath Safety Patch ───────────────────────────────────────────

/**
 * Patch a FabricJS Group that has a clipPath to avoid the render crash.
 *
 * FabricJS bug: Group.shouldCache() returns false when any child has a shadow,
 * even if objectCaching is true. When shouldCache() is false, render() calls
 * drawObject(ctx, false, {}) with an empty DrawContext (missing parentClipPaths,
 * zoomX, width, height, etc.). createClipPathLayer then crashes because it
 * expects a full DrawContext to create a properly-sized cache canvas.
 *
 * Fix: override shouldCache() on Groups with clipPath to always return true,
 * forcing render() through the working renderCache() path which builds a
 * complete DrawContext with all required properties.
 */
function patchClipPathGroup(group) {
	if (!group || !group.clipPath) return group;
	group.shouldCache = function () {
		this.ownCaching = true;
		return true;
	};
	return group;
}

// ─── Corner Radius ──────────────────────────────────────────────────

/**
 * Get clamped corner radius values.
 * Returns { uniform: number } for uniform radius,
 * or { perCorner: [tl, tr, br, bl] } when corners differ.
 */
function getCornerRadiusInfo(node, width, height) {
	const maxR = Math.min(width / 2, height / 2);

	if (node.rectangleCornerRadii && Array.isArray(node.rectangleCornerRadii)) {
		const [tl, tr, br, bl] = node.rectangleCornerRadii;
		const clamped = [
			Math.min(tl, maxR),
			Math.min(tr, maxR),
			Math.min(br, maxR),
			Math.min(bl, maxR)
		];
		// Check if all corners are the same
		if (clamped[0] === clamped[1] && clamped[1] === clamped[2] && clamped[2] === clamped[3]) {
			return { uniform: clamped[0] };
		}
		return { perCorner: clamped };
	}

	if (node.cornerRadius) {
		return { uniform: Math.min(node.cornerRadius, maxR) };
	}

	return { uniform: 0 };
}

/**
 * Generate SVG path for a rectangle with per-corner radii.
 * Uses arc commands for proper rounded corners.
 */
function roundedRectPath(width, height, tl, tr, br, bl) {
	// Radii are already clamped by getCornerRadiusInfo
	return [
		`M ${tl} 0`,
		`L ${width - tr} 0`,
		tr > 0 ? `A ${tr} ${tr} 0 0 1 ${width} ${tr}` : '',
		`L ${width} ${height - br}`,
		br > 0 ? `A ${br} ${br} 0 0 1 ${width - br} ${height}` : '',
		`L ${bl} ${height}`,
		bl > 0 ? `A ${bl} ${bl} 0 0 1 0 ${height - bl}` : '',
		`L 0 ${tl}`,
		tl > 0 ? `A ${tl} ${tl} 0 0 1 ${tl} 0` : '',
		'Z'
	]
		.filter(Boolean)
		.join(' ');
}

// ─── Node Converter ─────────────────────────────────────────────────

async function convertNode(node, parentBounds, fallbackImages, depth = 0) {
	const indent = '  '.repeat(depth);

	if (node.visible === false) {
		log(`${indent}SKIP (invisible): "${node.name}" [${node.type}]`);
		return null;
	}

	// Return mask nodes as-is (they'll be processed by their parent group handler)
	if (node.isMask) {
		log(`${indent}MASK: "${node.name}" [${node.type}] — will be used as clipPath`);
		return { _isMask: true, node };
	}

	const bbox = getNodeBounds(node, parentBounds);
	if (!bbox) {
		log(`${indent}SKIP (no bounds): "${node.name}" [${node.type}]`);
		return null;
	}

	const left = bbox.x - (parentBounds?.x || 0);
	const top = bbox.y - (parentBounds?.y || 0);
	const width = bbox.width;
	const height = bbox.height;

	// Extract rotation from relativeTransform matrix or node.rotation
	let rotation = node.rotation || 0;
	let skewX = 0;
	let flipX = false;

	if (node.relativeTransform) {
		const decomposed = decomposeTransform(node.relativeTransform);
		if (decomposed) {
			// Only use matrix rotation if node.rotation is not explicitly set
			if (!node.rotation && Math.abs(decomposed.rotation) > 0.01) {
				rotation = decomposed.rotation;
			}
			if (Math.abs(decomposed.skewX) > 0.01) {
				skewX = decomposed.skewX;
			}
			flipX = decomposed.flipX;
		}
	}

	const opacity = node.opacity ?? 1;

	const baseProps = {
		left,
		top,
		opacity,
		angle: -rotation,
		figmaNodeId: node.id,
		figmaNodeName: node.name,
		...getBlendMode(node)
	};

	// Add skew and flip if detected
	if (Math.abs(skewX) > 0.01) baseProps.skewX = skewX;
	if (flipX) baseProps.flipX = true;

	try {
		switch (node.type) {
			case 'RECTANGLE': {
				const fillData = getFill(node, width, height);
				if (fillData._hasImageFill && fallbackImages[node.id]) {
					log(`${indent}IMAGE (image fill): "${node.name}" ${width}x${height}`);
					return await makeImageObject(fallbackImages[node.id], baseProps, width, height);
				}
				const radiusInfo = getCornerRadiusInfo(node, width, height);
				const strokeData = getStroke(node, width, height);
				const effectData = getEffects(node);

				if (radiusInfo.perCorner) {
					// Different corner radii: use Path for perfect fidelity
					const [tl, tr, br, bl] = radiusInfo.perCorner;
					log(
						`${indent}RECT (per-corner path): "${
							node.name
						}" ${width}x${height} radii=[${tl},${tr},${br},${bl}] stroke=${!!strokeData.stroke} shadow=${!!effectData.shadow}`
					);
					const pathStr = roundedRectPath(width, height, tl, tr, br, bl);
					return new Path(pathStr, {
						...baseProps,
						...fillData,
						...strokeData,
						...effectData
					});
				}

				const cr = radiusInfo.uniform;
				log(
					`${indent}RECT: "${node.name}" ${width}x${height} fill=${
						typeof fillData.fill === 'string' ? fillData.fill : 'gradient'
					} radius=${cr} stroke=${!!strokeData.stroke} shadow=${!!effectData.shadow}`
				);
				return new Rect({
					...baseProps,
					width,
					height,
					...fillData,
					...strokeData,
					...effectData,
					rx: cr,
					ry: cr
				});
			}

			case 'ELLIPSE': {
				const fillData = getFill(node, width, height);
				if (fillData._hasImageFill && fallbackImages[node.id]) {
					log(`${indent}IMAGE (image fill): "${node.name}" ${width}x${height}`);
					return await makeImageObject(fallbackImages[node.id], baseProps, width, height);
				}

				// Check for arc data (partial ellipse / donut / pie)
				const arcData = node.arcData;
				if (
					arcData &&
					(arcData.startingAngle !== 0 ||
						arcData.endingAngle !== Math.PI * 2 ||
						arcData.innerRadius > 0)
				) {
					if (fallbackImages[node.id]) {
						log(`${indent}IMAGE (arc ellipse): "${node.name}" ${width}x${height}`);
						return await makeImageObject(fallbackImages[node.id], baseProps, width, height);
					}
					log(`${indent}ELLIPSE (arc, approx as full): "${node.name}" ${width}x${height}`);
				} else {
					log(`${indent}ELLIPSE: "${node.name}" ${width}x${height}`);
				}

				const { _hasImageFill: _, ...cleanFill } = fillData;
				return new Ellipse({
					...baseProps,
					rx: width / 2,
					ry: height / 2,
					...cleanFill,
					...getStroke(node, width, height),
					...getEffects(node)
				});
			}

			case 'LINE': {
				const strokeData = getStroke(node, width, height);
				log(`${indent}LINE: "${node.name}" ${width} stroke=${strokeData.stroke || 'none'}`);
				return new Path(`M 0 0 L ${width} 0`, {
					...baseProps,
					...strokeData,
					fill: 'transparent'
				});
			}

			case 'TEXT': {
				return convertTextNode(node, baseProps, width, height, indent);
			}

			case 'VECTOR':
			case 'BOOLEAN_OPERATION':
			case 'STAR':
			case 'REGULAR_POLYGON':
			case 'WASHI_TAPE': {
				// First try: use fallback PNG image (best fidelity)
				if (fallbackImages[node.id]) {
					log(`${indent}IMAGE (fallback): "${node.name}" [${node.type}] ${width}x${height}`);
					return await makeImageObject(fallbackImages[node.id], baseProps, width, height);
				}

				// Second try: SVG path data from fillGeometry
				if (node.fillGeometry?.length > 0) {
					const pathData = node.fillGeometry[0].path;
					if (pathData) {
						const fillData = getFill(node, width, height);
						log(`${indent}PATH (fillGeometry): "${node.name}" [${node.type}]`);
						const pathObj = new Path(pathData, {
							...baseProps,
							...fillData,
							...getStroke(node, width, height),
							...getEffects(node)
						});
						if (pathObj.width && pathObj.height) {
							pathObj.set({
								scaleX: width / pathObj.width,
								scaleY: height / pathObj.height
							});
						}
						return pathObj;
					}
				}

				// Last resort: placeholder
				log(`${indent}PLACEHOLDER: "${node.name}" [${node.type}] ${width}x${height}`);
				return new Rect({
					...baseProps,
					width,
					height,
					fill: '#e0e0e0',
					stroke: '#999',
					strokeWidth: 1,
					strokeDashArray: [4, 4]
				});
			}

			// FigJam node types — render with fallback images or basic shapes
			case 'STICKY': {
				// Sticky note: colored rounded rectangle with text
				if (fallbackImages[node.id]) {
					log(`${indent}IMAGE (sticky fallback): "${node.name}" ${width}x${height}`);
					return await makeImageObject(fallbackImages[node.id], baseProps, width, height);
				}
				const fillData = getFill(node, width, height);
				const cr = 8; // Default sticky note corner radius
				log(`${indent}STICKY: "${node.name}" ${width}x${height}`);
				return new Rect({
					...baseProps,
					width,
					height,
					...(fillData.fill !== 'transparent' ? fillData : { fill: '#fef3c7' }),
					...getEffects(node),
					rx: cr,
					ry: cr
				});
			}

			case 'SHAPE_WITH_TEXT': {
				if (fallbackImages[node.id]) {
					log(`${indent}IMAGE (shape_with_text fallback): "${node.name}" ${width}x${height}`);
					return await makeImageObject(fallbackImages[node.id], baseProps, width, height);
				}
				const fillData = getFill(node, width, height);
				log(`${indent}SHAPE_WITH_TEXT: "${node.name}" [${node.shapeType}] ${width}x${height}`);
				// Render as basic shape based on shapeType
				if (node.shapeType === 'ELLIPSE') {
					return new Ellipse({
						...baseProps,
						rx: width / 2,
						ry: height / 2,
						...fillData,
						...getStroke(node, width, height),
						...getEffects(node)
					});
				}
				// Default: rectangle
				const cr = node.cornerRadius ? Math.min(node.cornerRadius, width / 2, height / 2) : 0;
				return new Rect({
					...baseProps,
					width,
					height,
					...fillData,
					...getStroke(node, width, height),
					...getEffects(node),
					rx: cr,
					ry: cr
				});
			}

			case 'CONNECTOR': {
				if (fallbackImages[node.id]) {
					log(`${indent}IMAGE (connector fallback): "${node.name}" ${width}x${height}`);
					return await makeImageObject(fallbackImages[node.id], baseProps, width, height);
				}
				// Render as a simple line
				const strokeData = getStroke(node, width, height);
				log(`${indent}CONNECTOR: "${node.name}" ${width}x${height}`);
				return new Path(`M 0 0 L ${width} ${height}`, {
					...baseProps,
					...strokeData,
					fill: 'transparent'
				});
			}

			case 'TABLE': {
				// Tables have children (TABLE_CELL). Process as a group.
				log(`${indent}TABLE: "${node.name}" ${width}x${height}`);
				return await convertContainerNode(
					node,
					baseProps,
					bbox,
					width,
					height,
					fallbackImages,
					depth,
					indent
				);
			}

			case 'TABLE_CELL': {
				// Table cells have fills and optional text sublayer
				const fillData = getFill(node, width, height);
				log(`${indent}TABLE_CELL: "${node.name}" ${width}x${height}`);
				return new Rect({
					...baseProps,
					width,
					height,
					...fillData,
					...getStroke(node, width, height)
				});
			}

			// Non-visual or unsupported nodes
			case 'SLICE':
			case 'WIDGET':
			case 'EMBED':
			case 'LINK_UNFURL': {
				if (fallbackImages[node.id]) {
					log(`${indent}IMAGE (${node.type} fallback): "${node.name}" ${width}x${height}`);
					return await makeImageObject(fallbackImages[node.id], baseProps, width, height);
				}
				log(`${indent}SKIP (${node.type}): "${node.name}"`);
				return null;
			}

			case 'FRAME':
			case 'GROUP':
			case 'COMPONENT':
			case 'COMPONENT_SET':
			case 'INSTANCE':
			case 'SECTION': {
				return await convertContainerNode(
					node,
					baseProps,
					bbox,
					width,
					height,
					fallbackImages,
					depth,
					indent
				);
			}

			default:
				// For any unknown type, try fallback image
				if (fallbackImages[node.id]) {
					log(
						`${indent}IMAGE (unknown type fallback): "${node.name}" [${node.type}] ${width}x${height}`
					);
					return await makeImageObject(fallbackImages[node.id], baseProps, width, height);
				}
				log(`${indent}SKIP (unsupported type): "${node.name}" [${node.type}]`);
				return null;
		}
	} catch (err) {
		logError(
			`${indent}ERROR converting node "${node.name}" [${node.type}] id=${node.id}:`,
			err?.message || err
		);
		logError(
			`${indent}  Node snapshot:`,
			JSON.stringify({
				id: node.id,
				type: node.type,
				name: node.name,
				width,
				height,
				left,
				top,
				fills: node.fills?.length || 0,
				strokes: node.strokes?.length || 0,
				effects: node.effects?.length || 0,
				children: node.children?.length || 0
			})
		);
		// Return a placeholder so the rest of the tree still converts
		return new Rect({
			...baseProps,
			width: width || 10,
			height: height || 10,
			fill: 'rgba(255,0,0,0.1)',
			stroke: 'red',
			strokeWidth: 1,
			strokeDashArray: [4, 4],
			_conversionError: err?.message || 'Unknown error',
			_failedNodeType: node.type,
			_failedNodeName: node.name
		});
	}
}

// ─── Text Node Conversion ───────────────────────────────────────────

function convertTextNode(node, baseProps, width, height, indent) {
	const style = node.style || {};

	// Text fills: check style.fills first (per-character fills), then node.fills
	let fillData;
	if (style.fills && style.fills.length > 0) {
		const visibleFills = style.fills.filter((f) => f.visible !== false);
		if (visibleFills.length > 0) {
			const f = visibleFills[visibleFills.length - 1];
			if (f.type === 'SOLID') {
				fillData = { fill: figmaColorToRgba(f.color, f.opacity ?? 1) };
			}
		}
	}
	if (!fillData) {
		fillData = getFill(node, width, height);
	}

	let characters = node.characters || '';

	// Apply list formatting before text case
	if (node.lineTypes?.length > 0) {
		characters = applyListFormatting(characters, node.lineTypes, node.lineIndentations);
	}

	// Apply text case
	if (style.textCase) {
		characters = applyTextCase(characters, style.textCase);
	}

	const lineHeight = getLineHeight(style);
	const fontSize = style.fontSize || 16;

	log(
		`${indent}TEXT: "${node.name}" "${characters.substring(0, 30)}${
			characters.length > 30 ? '...' : ''
		}" ${fontSize}px ${style.fontFamily} weight=${style.fontWeight || 'auto'} case=${
			style.textCase || 'ORIGINAL'
		} vAlign=${style.textAlignVertical || 'TOP'} autoResize=${style.textAutoResize || 'NONE'}`
	);

	// Determine if we should use FabricText (auto-width) or Textbox (fixed width)
	const useAutoWidth = style.textAutoResize === 'WIDTH_AND_HEIGHT';

	const textProps = {
		...baseProps,
		fontSize,
		fontFamily: style.fontFamily || 'Arial',
		fontWeight: style.fontWeight || figmaFontWeight(style.fontPostScriptName),
		fontStyle: style.italic ? 'italic' : 'normal',
		textAlign: figmaTextAlign(style.textAlignHorizontal),
		lineHeight,
		charSpacing: style.letterSpacing ? (style.letterSpacing / fontSize) * 1000 : 0,
		underline: style.textDecoration === 'UNDERLINE',
		linethrough: style.textDecoration === 'STRIKETHROUGH',
		...fillData,
		...getEffects(node)
	};

	let textObj;
	if (useAutoWidth) {
		// Auto-width text: use FabricText (no wrapping constraint)
		textObj = new FabricText(characters, textProps);
	} else {
		// Fixed width: use Textbox
		textObj = new Textbox(characters, { ...textProps, width });
	}

	// Apply vertical alignment adjustment
	if (style.textAlignVertical && style.textAlignVertical !== 'TOP') {
		try {
			const textHeight = textObj.calcTextHeight?.() || textObj.height || 0;
			if (textHeight < height) {
				if (style.textAlignVertical === 'CENTER') {
					textObj.set({ top: baseProps.top + (height - textHeight) / 2 });
				} else if (style.textAlignVertical === 'BOTTOM') {
					textObj.set({ top: baseProps.top + (height - textHeight) });
				}
			}
		} catch {
			// calcTextHeight may not be available in all contexts
		}
	}

	// Apply SMALL_CAPS character styling (make originally lowercase chars slightly smaller)
	if (style.textCase === 'SMALL_CAPS' || style.textCase === 'SMALL_CAPS_FORCED') {
		const originalChars = node.characters || '';
		for (let i = 0; i < originalChars.length; i++) {
			const ch = originalChars[i];
			if (ch >= 'a' && ch <= 'z') {
				try {
					textObj.setSelectionStyles(
						{
							fontSize: Math.round(fontSize * 0.8)
						},
						i,
						i + 1
					);
				} catch {
					// Ignore out-of-range errors
				}
			}
		}
	}

	// Apply character style overrides (mixed styles within one text node)
	if (node.characterStyleOverrides?.length > 0 && node.styleOverrideTable) {
		applyCharacterStyleOverrides(
			textObj,
			characters,
			node.characterStyleOverrides,
			node.styleOverrideTable,
			style
		);
	}

	return textObj;
}

// ─── Container Node Conversion (FRAME, GROUP, etc.) ─────────────────

async function convertContainerNode(
	node,
	baseProps,
	bbox,
	width,
	height,
	fallbackImages,
	depth,
	indent
) {
	const frameFill = getFill(node, width, height);
	const frameStroke = getStroke(node, width, height);
	const frameEffects = getEffects(node);
	const radiusInfo = getCornerRadiusInfo(node, width, height);
	const cr = radiusInfo.uniform ?? 0;
	const hasBg = frameFill.fill !== 'transparent';
	const hasStroke = !!frameStroke.stroke;
	const hasShadow = !!frameEffects.shadow;
	const clipsContent = node.clipsContent === true;
	log(
		`${indent}GROUP: "${node.name}" [${node.type}] ${width}x${height} children=${
			node.children?.length || 0
		} fill=${
			hasBg ? (typeof frameFill.fill === 'string' ? frameFill.fill : 'gradient') : 'none'
		} stroke=${hasStroke} shadow=${hasShadow} radius=${cr} clip=${clipsContent}`
	);

	const children = node.children || [];
	const rawResults = [];

	for (const child of children) {
		const fabricObj = await convertNode(child, bbox, fallbackImages, depth + 1);
		if (fabricObj) rawResults.push(fabricObj);
	}

	// Process mask nodes: convert mask shapes to clipPaths for subsequent siblings
	const fabricChildren = [];
	let activeMaskNode = null;
	let maskedChildren = [];

	for (const result of rawResults) {
		if (result._isMask) {
			// If we had a previous mask group, flush it
			if (activeMaskNode && maskedChildren.length > 0) {
				const maskGroup = await createMaskedGroup(
					activeMaskNode,
					maskedChildren,
					bbox,
					fallbackImages,
					depth
				);
				if (maskGroup) fabricChildren.push(maskGroup);
			}
			activeMaskNode = result.node;
			maskedChildren = [];
		} else if (activeMaskNode) {
			maskedChildren.push(result);
		} else {
			fabricChildren.push(result);
		}
	}

	// Flush remaining masked children
	if (activeMaskNode && maskedChildren.length > 0) {
		const maskGroup = await createMaskedGroup(
			activeMaskNode,
			maskedChildren,
			bbox,
			fallbackImages,
			depth
		);
		if (maskGroup) fabricChildren.push(maskGroup);
	}

	if (fabricChildren.length === 0) {
		if (hasBg || hasStroke || hasShadow) {
			log(`${indent}  → empty group with visual props, converting to rect`);
			if (radiusInfo.perCorner) {
				const [tl, tr, br, bl] = radiusInfo.perCorner;
				return new Path(roundedRectPath(width, height, tl, tr, br, bl), {
					...baseProps,
					...frameFill,
					...frameStroke,
					...frameEffects
				});
			}
			return new Rect({
				...baseProps,
				width,
				height,
				...frameFill,
				...frameStroke,
				...frameEffects,
				rx: cr,
				ry: cr
			});
		}
		log(`${indent}  → empty group, skipping`);
		return null;
	}

	// Add background rect for non-GROUP containers with visual properties
	const needsBgRect =
		node.type !== 'GROUP' && (hasBg || hasStroke || hasShadow || cr > 0 || radiusInfo.perCorner);
	if (needsBgRect) {
		log(
			`${indent}  → adding background rect: fill=${hasBg} stroke=${hasStroke} shadow=${hasShadow} radius=${cr}`
		);
		if (radiusInfo.perCorner) {
			const [tl, tr, br, bl] = radiusInfo.perCorner;
			fabricChildren.unshift(
				new Path(roundedRectPath(width, height, tl, tr, br, bl), {
					left: 0,
					top: 0,
					...frameFill,
					...frameStroke,
					...frameEffects,
					selectable: false,
					evented: false
				})
			);
		} else {
			fabricChildren.unshift(
				new Rect({
					left: 0,
					top: 0,
					width,
					height,
					...frameFill,
					...frameStroke,
					...frameEffects,
					rx: cr,
					ry: cr,
					selectable: false,
					evented: false
				})
			);
		}
	}

	const groupProps = { ...baseProps };

	// FRAME/COMPONENT/INSTANCE/SECTION have explicit dimensions in Figma.
	// Use FixedLayout so overflowing children don't shift the group's position.
	// FitContentLayout (default) recalculates group bounds from children, which
	// breaks positioning when children extend beyond the frame bounds.
	if (node.type !== 'GROUP') {
		groupProps.width = width;
		groupProps.height = height;
		groupProps.layoutManager = new LayoutManager(new FixedLayout());
	}

	if (clipsContent) {

		if (radiusInfo.perCorner) {
			const [tl, tr, br, bl] = radiusInfo.perCorner;
			groupProps.clipPath = new Path(roundedRectPath(width, height, tl, tr, br, bl), {
				left: -width / 2,
				top: -height / 2,
				absolutePositioned: false
			});
		} else if (cr > 0) {
			groupProps.clipPath = new Rect({
				left: -width / 2,
				top: -height / 2,
				width,
				height,
				rx: cr,
				ry: cr,
				absolutePositioned: false
			});
		} else {
			groupProps.clipPath = new Rect({
				left: -width / 2,
				top: -height / 2,
				width,
				height,
				absolutePositioned: false
			});
		}
		groupProps.objectCaching = true;
	}

	try {
		const group = new Group(fabricChildren, groupProps);
		if (clipsContent) patchClipPathGroup(group);
		return group;
	} catch (err) {
		logError(
			`${indent}ERROR creating Group for "${node.name}" [${node.type}]:`,
			err?.message || err
		);
		logError(
			`${indent}  fabricChildren count: ${fabricChildren.length}, types: ${fabricChildren
				.map((c) => c?.type || c?.constructor?.name || typeof c)
				.join(', ')}`
		);
		// Fallback: return children directly if group creation fails
		if (fabricChildren.length === 1) return fabricChildren[0];
		// Try creating group without clipPath
		try {
			const { clipPath, ...simpleProps } = groupProps;
			return new Group(fabricChildren, simpleProps);
		} catch {
			logError(`${indent}  Group creation failed even without clipPath, returning first child`);
			return fabricChildren[0] || null;
		}
	}
}

// ─── Mask to ClipPath Conversion ────────────────────────────────────

/**
 * Create a FabricJS Group with a clipPath derived from a Figma mask node.
 * In Figma, isMask=true clips all subsequent siblings until the next mask or group end.
 */
async function createMaskedGroup(maskNode, maskedChildren, parentBounds, fallbackImages, depth) {
	if (maskedChildren.length === 0) return null;

	const maskBbox = getNodeBounds(maskNode, parentBounds);
	if (!maskBbox) return maskedChildren.length === 1 ? maskedChildren[0] : new Group(maskedChildren);

	const maskWidth = maskBbox.width;
	const maskHeight = maskBbox.height;
	const maskLeft = maskBbox.x - (parentBounds?.x || 0);
	const maskTop = maskBbox.y - (parentBounds?.y || 0);

	// Create clipPath from mask node shape
	let clipPath;
	const radiusInfo = getCornerRadiusInfo(maskNode, maskWidth, maskHeight);

	if (maskNode.type === 'ELLIPSE') {
		clipPath = new Ellipse({
			left: maskLeft - maskWidth / 2,
			top: maskTop - maskHeight / 2,
			rx: maskWidth / 2,
			ry: maskHeight / 2,
			absolutePositioned: false
		});
	} else if (maskNode.fillGeometry?.length > 0 && maskNode.fillGeometry[0].path) {
		clipPath = new Path(maskNode.fillGeometry[0].path, {
			left: maskLeft - maskWidth / 2,
			top: maskTop - maskHeight / 2,
			absolutePositioned: false
		});
	} else if (radiusInfo.perCorner) {
		const [tl, tr, br, bl] = radiusInfo.perCorner;
		clipPath = new Path(roundedRectPath(maskWidth, maskHeight, tl, tr, br, bl), {
			left: maskLeft - maskWidth / 2,
			top: maskTop - maskHeight / 2,
			absolutePositioned: false
		});
	} else {
		const cr = radiusInfo.uniform;
		clipPath = new Rect({
			left: maskLeft - maskWidth / 2,
			top: maskTop - maskHeight / 2,
			width: maskWidth,
			height: maskHeight,
			rx: cr,
			ry: cr,
			absolutePositioned: false
		});
	}

	log(
		`${'  '.repeat(depth)}  → mask group: ${maskedChildren.length} children clipped by "${
			maskNode.name
		}"`
	);

	return patchClipPathGroup(new Group(maskedChildren, { clipPath, objectCaching: true }));
}

// ─── Character Style Overrides ──────────────────────────────────────

/**
 * Apply per-character style overrides from Figma.
 * Figma's characterStyleOverrides array maps each character index to a style ID.
 * The styleOverrideTable maps style IDs to partial TypeStyle objects.
 */
function applyCharacterStyleOverrides(textObj, characters, overrides, overrideTable, baseStyle) {
	if (!overrides || overrides.length === 0) return;

	// Build style ranges: consecutive chars with the same override ID
	const ranges = [];
	let currentId = overrides[0];
	let start = 0;

	for (let i = 1; i <= overrides.length; i++) {
		const id = i < overrides.length ? overrides[i] : -1;
		if (id !== currentId) {
			if (currentId !== 0 && overrideTable[String(currentId)]) {
				ranges.push({ start, end: i, style: overrideTable[String(currentId)] });
			}
			currentId = id;
			start = i;
		}
	}

	// Apply styles to ranges
	for (const range of ranges) {
		const style = range.style;
		const fabricStyle = {};

		if (style.fontFamily) fabricStyle.fontFamily = style.fontFamily;
		if (style.fontSize) fabricStyle.fontSize = style.fontSize;
		if (style.fontWeight) fabricStyle.fontWeight = style.fontWeight;
		if (style.italic !== undefined) fabricStyle.fontStyle = style.italic ? 'italic' : 'normal';
		if (style.textDecoration === 'UNDERLINE') fabricStyle.underline = true;
		if (style.textDecoration === 'STRIKETHROUGH') fabricStyle.linethrough = true;
		if (style.letterSpacing) {
			fabricStyle.charSpacing =
				(style.letterSpacing / (style.fontSize || baseStyle.fontSize || 16)) * 1000;
		}

		// Per-character fill color
		if (style.fills?.length > 0) {
			const fill = style.fills.filter((f) => f.visible !== false).pop();
			if (fill?.type === 'SOLID') {
				fabricStyle.fill = figmaColorToRgba(fill.color, fill.opacity ?? 1);
			}
		}

		if (Object.keys(fabricStyle).length > 0) {
			try {
				textObj.setSelectionStyles(fabricStyle, range.start, range.end);
			} catch {
				// setSelectionStyles may fail if indices are out of range
			}
		}
	}
}

// ─── Image Object Helper ────────────────────────────────────────────

async function makeImageObject(dataUrl, baseProps, width, height) {
	try {
		const img = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });
		img.set({
			...baseProps,
			scaleX: width / (img.width || width),
			scaleY: height / (img.height || height)
		});
		return img;
	} catch (err) {
		logError('Failed to load fallback image:', err?.message || err);
		return new Rect({
			...baseProps,
			width,
			height,
			fill: '#e0e0e0',
			stroke: '#999',
			strokeWidth: 1,
			strokeDashArray: [4, 4]
		});
	}
}

// ─── Font Extraction ────────────────────────────────────────────────

function extractFonts(node) {
	const fonts = new Set();

	if (node.type === 'TEXT') {
		if (node.style?.fontFamily) fonts.add(node.style.fontFamily);
		if (node.styleOverrideTable) {
			for (const override of Object.values(node.styleOverrideTable)) {
				if (override.fontFamily) fonts.add(override.fontFamily);
			}
		}
	}

	if (node.children) {
		for (const child of node.children) {
			for (const font of extractFonts(child)) {
				fonts.add(font);
			}
		}
	}

	return fonts;
}

// ─── Tree Summary (for debug output) ────────────────────────────────

function summarizeNodeTree(node, depth = 0) {
	const summary = {
		type: node.type,
		name: node.name,
		id: node.id,
		size: node.absoluteBoundingBox
			? `${Math.round(node.absoluteBoundingBox.width)}x${Math.round(
					node.absoluteBoundingBox.height
			  )}`
			: node.size
			? `${Math.round(node.size.x)}x${Math.round(node.size.y)}`
			: 'unknown',
		fills: node.fills?.length || 0,
		strokes: node.strokes?.length || 0,
		effects: node.effects?.length || 0
	};
	if (node.children?.length > 0) {
		summary.children = node.children.map((c) => summarizeNodeTree(c, depth + 1));
	}
	return summary;
}

// ─── Main Entry Point ───────────────────────────────────────────────

/**
 * @param {Object|string} nodeTree - Figma node tree (JSON_REST_V1 format)
 * @param {Object} options
 * @param {Object} options.fallbackImages - Map of nodeId → base64 PNG data URL
 * @param {Object} options.metadata - { width, height, frameName, ... }
 * @returns {Promise<{objects: Array, width: number, height: number, fonts: Set}>}
 */
export async function convertFigmaToFabric(nodeTree, options = {}) {
	// Reset log buffer for this conversion
	_logs.length = 0;
	const conversionStart = performance.now();

	if (typeof nodeTree === 'string') {
		nodeTree = JSON.parse(nodeTree);
	}
	if (nodeTree.document) {
		log('Unwrapping document wrapper');
		nodeTree = nodeTree.document;
	}

	const fallbackImages = options.fallbackImages || {};
	const metadata = options.metadata || {};

	log('=== Starting Figma Conversion ===');
	log('Root node:', nodeTree.name, `[${nodeTree.type}]`);
	log('Children:', nodeTree.children?.length || 0);
	log('Fallback images available:', Object.keys(fallbackImages).length);
	log('Metadata:', JSON.stringify(metadata));

	const bbox = getNodeBounds(nodeTree, null) || {
		x: 0,
		y: 0,
		width: metadata.width || 1080,
		height: metadata.height || 1080
	};
	log('Root bbox:', JSON.stringify(bbox));

	const fonts = extractFonts(nodeTree);
	log('Fonts found:', [...fonts]);

	const objects = [];

	// Add root frame background if it has visual properties
	const rootFill = getFill(nodeTree, bbox.width, bbox.height);
	const rootStroke = getStroke(nodeTree, bbox.width, bbox.height);
	const rootEffects = getEffects(nodeTree);
	const rootRadiusInfo = getCornerRadiusInfo(nodeTree, bbox.width, bbox.height);
	const rootCr = rootRadiusInfo.uniform ?? 0;
	const hasRootBg = rootFill.fill !== 'transparent';
	const hasRootStroke = !!rootStroke.stroke;
	const hasRootShadow = !!rootEffects.shadow;

	if (hasRootBg || hasRootStroke || hasRootShadow) {
		log('Adding root frame background:', {
			fill: hasRootBg,
			stroke: hasRootStroke,
			shadow: hasRootShadow,
			radius: rootCr
		});
		if (rootRadiusInfo.perCorner) {
			const [tl, tr, br, bl] = rootRadiusInfo.perCorner;
			objects.push(
				new Path(roundedRectPath(bbox.width, bbox.height, tl, tr, br, bl), {
					left: 0,
					top: 0,
					...rootFill,
					...rootStroke,
					...rootEffects,
					selectable: false,
					evented: false
				})
			);
		} else {
			objects.push(
				new Rect({
					left: 0,
					top: 0,
					width: bbox.width,
					height: bbox.height,
					...rootFill,
					...rootStroke,
					...rootEffects,
					rx: rootCr,
					ry: rootCr,
					selectable: false,
					evented: false
				})
			);
		}
	}

	const children = nodeTree.children || [];
	for (const child of children) {
		const fabricObj = await convertNode(child, bbox, fallbackImages, 1);
		if (fabricObj && !fabricObj._isMask) objects.push(fabricObj);
	}

	const elapsed = Math.round(performance.now() - conversionStart);
	const errorCount = _logs.filter((l) => l.level === 'error').length;
	const warnCount = _logs.filter((l) => l.level === 'warn').length;

	log(
		`=== Conversion Complete: ${objects.length} objects, ${errorCount} errors, ${warnCount} warnings, ${elapsed}ms ===`
	);

	// Collect per-node error details for easy debugging
	const errors = _logs.filter((l) => l.level === 'error').map((l) => l.args.join(' '));

	return {
		objects,
		width: bbox.width,
		height: bbox.height,
		fonts,
		_debug: {
			logs: [..._logs],
			errors,
			errorCount,
			warnCount,
			elapsed,
			nodeCount: objects.length,
			inputTreeSummary: summarizeNodeTree(nodeTree)
		}
	};
}

/**
 * Parse a Figma URL to extract file key and node ID
 */
export function parseFigmaUrl(url) {
	try {
		const parsed = new URL(url);
		const pathParts = parsed.pathname.split('/').filter(Boolean);
		const typeIndex = pathParts.findIndex((p) => p === 'file' || p === 'design');
		if (typeIndex === -1 || !pathParts[typeIndex + 1]) return null;
		return {
			fileKey: pathParts[typeIndex + 1],
			nodeId: parsed.searchParams.get('node-id') || null
		};
	} catch {
		return null;
	}
}
