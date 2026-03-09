/**
 * Pattern Fill Utilities
 *
 * Creates tiled pattern groups from a source element on the Fabric.js canvas.
 * Similar to how QR codes, charts, and tables work — a protected group with metadata.
 */

import { Group, Rect, util } from 'fabric';

const MAX_TILES = 500;

/**
 * Custom properties stored on pattern fill groups.
 */
export const PATTERN_FILL_PROPS = [
	'isPatternFill',
	'patternSourceJSON',
	'patternBoundsWidth',
	'patternBoundsHeight',
	'patternSpacingX',
	'patternSpacingY',
	'patternStagger'
];

/**
 * Get the visual dimensions of a serialized fabric object.
 */
function getSourceDimensions(sourceJSON) {
	const scaleX = sourceJSON.scaleX || 1;
	const scaleY = sourceJSON.scaleY || 1;

	// Circles use radius
	if (sourceJSON.radius) {
		return {
			w: sourceJSON.radius * 2 * scaleX,
			h: sourceJSON.radius * 2 * scaleY
		};
	}

	return {
		w: (sourceJSON.width || 50) * scaleX,
		h: (sourceJSON.height || 50) * scaleY
	};
}

/**
 * Build clone array to fill the specified area.
 * Returns { clones, capped }.
 */
async function buildClones(sourceJSON, boundsWidth, boundsHeight, spacingX, spacingY, stagger) {
	const { w: srcW, h: srcH } = getSourceDimensions(sourceJSON);

	const cellW = srcW + spacingX;
	const cellH = srcH + spacingY;

	let cols = cellW > 0 ? Math.ceil(boundsWidth / cellW) : 1;
	let rows = cellH > 0 ? Math.ceil(boundsHeight / cellH) : 1;

	if (stagger) cols += 1;

	const totalTiles = cols * rows;
	const capped = totalTiles > MAX_TILES;
	if (capped) {
		const ratio = Math.sqrt(MAX_TILES / totalTiles);
		cols = Math.max(1, Math.floor(cols * ratio));
		rows = Math.max(1, Math.floor(rows * ratio));
	}

	const clones = [];
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const cloneData = JSON.parse(JSON.stringify(sourceJSON));
			// Strip position — we control placement
			delete cloneData.left;
			delete cloneData.top;

			const [obj] = await util.enlivenObjects([cloneData]);

			let left = col * cellW;
			let top = row * cellH;

			if (stagger && row % 2 === 1) {
				left += cellW / 2;
			}

			// Position relative to group center (FabricJS groups use center origin)
			obj.set({
				left: left - boundsWidth / 2 + srcW / 2,
				top: top - boundsHeight / 2 + srcH / 2
			});

			clones.push(obj);
		}
	}

	return { clones, capped };
}

/**
 * Generate a pattern fill group from a serialized source element.
 *
 * @param {object} sourceJSON - Serialized FabricJS object JSON
 * @param {object} config
 * @param {number} config.boundsWidth - Width of the fill area
 * @param {number} config.boundsHeight - Height of the fill area
 * @param {number} config.spacingX - Horizontal gap between tiles
 * @param {number} config.spacingY - Vertical gap between tiles
 * @param {boolean} config.stagger - Offset odd rows by half
 * @returns {Promise<{group: Group, capped: boolean}>}
 */
export async function generatePatternGroup(sourceJSON, config) {
	const { boundsWidth = 400, boundsHeight = 400, spacingX = 0, spacingY = 0, stagger = false } = config;

	const { clones, capped } = await buildClones(sourceJSON, boundsWidth, boundsHeight, spacingX, spacingY, stagger);

	// Clip to exact bounds
	const clipPath = new Rect({
		width: boundsWidth,
		height: boundsHeight,
		originX: 'center',
		originY: 'center',
		absolutePositioned: false
	});

	const group = new Group(clones, {
		clipPath
	});

	// Force scale to 1 — FabricJS may infer scale from bounding box vs explicit dims
	group.set({
		scaleX: 1,
		scaleY: 1,
		isPatternFill: true,
		patternSourceJSON: sourceJSON,
		patternBoundsWidth: boundsWidth,
		patternBoundsHeight: boundsHeight,
		patternSpacingX: spacingX,
		patternSpacingY: spacingY,
		patternStagger: stagger
	});

	return { group, capped };
}

/**
 * Repair pattern fill groups after canvas load (undo/redo, page switch, initial load).
 * Regenerates each pattern fill group to fix any distortion from serialization.
 *
 * @param {import('fabric').Canvas} canvas
 * @returns {Promise<void>}
 */
export async function repairPatternFills(canvas) {
	if (!canvas) return;

	const objects = canvas.getObjects();
	for (const obj of objects) {
		if (!obj.isPatternFill || !obj.patternSourceJSON) continue;

		const left = obj.left;
		const top = obj.top;
		const id = obj.id;
		const config = {
			boundsWidth: obj.patternBoundsWidth || 400,
			boundsHeight: obj.patternBoundsHeight || 400,
			spacingX: obj.patternSpacingX || 0,
			spacingY: obj.patternSpacingY || 0,
			stagger: obj.patternStagger || false
		};

		// Sanitize sourceJSON — after deserialization it may contain non-cloneable data
		const sourceJSON = JSON.parse(JSON.stringify(obj.patternSourceJSON));
		const { group } = await generatePatternGroup(sourceJSON, config);
		group.set({ left, top });
		if (id) group.set('id', id);

		canvas.remove(obj);
		canvas.add(group);
	}

	canvas.requestRenderAll();
}

/**
 * Regenerate the contents of an existing pattern fill group in-place.
 *
 * @param {Group} group - The existing pattern fill group
 * @returns {Promise<{capped: boolean}>}
 */
export async function regeneratePatternContents(group) {
	if (!group || !group.isPatternFill) return { capped: false };

	const sourceJSON = group.patternSourceJSON;
	if (!sourceJSON) return { capped: false };

	const boundsWidth = group.patternBoundsWidth || 400;
	const boundsHeight = group.patternBoundsHeight || 400;
	const spacingX = group.patternSpacingX || 0;
	const spacingY = group.patternSpacingY || 0;
	const stagger = group.patternStagger || false;

	// Remove all existing children
	const existing = group.getObjects();
	existing.forEach(obj => group.remove(obj));

	// Build new clones
	const { clones, capped } = await buildClones(sourceJSON, boundsWidth, boundsHeight, spacingX, spacingY, stagger);
	clones.forEach(obj => group.add(obj));

	// Update clipPath
	if (group.clipPath) {
		group.clipPath.set({ width: boundsWidth, height: boundsHeight });
	} else {
		group.clipPath = new Rect({
			width: boundsWidth,
			height: boundsHeight,
			originX: 'center',
			originY: 'center',
			absolutePositioned: false
		});
	}

	group.setCoords();

	return { capped };
}
