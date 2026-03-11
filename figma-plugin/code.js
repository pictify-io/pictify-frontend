// Send to Pictify — Figma Plugin Main Code
// Runs in Figma's sandbox (no browser APIs, no fetch)

figma.showUI(__html__, { width: 360, height: 480, title: 'Send to Pictify' });

/**
 * Node types that cannot be represented as editable FabricJS objects
 * and need a PNG fallback image.
 */
const IMAGE_FALLBACK_TYPES = new Set([
	'VECTOR',
	'BOOLEAN_OPERATION',
	'STAR',
	'REGULAR_POLYGON',
	'WASHI_TAPE',
	'WIDGET',
	'EMBED',
	'LINK_UNFURL'
]);

/**
 * Check if a node (or any of its deep descendants) contains nodes
 * that need image fallback. If so, we export per-node PNGs for those.
 */
function collectFallbackNodeIds(node, ids) {
	if (node.visible === false) return;

	// Leaf vector types always need image fallback
	if (IMAGE_FALLBACK_TYPES.has(node.type)) {
		ids.add(node.id);
		return;
	}

	// Ellipses with arc data (partial circle, donut, pie) need image fallback
	if (node.type === 'ELLIPSE' && 'arcData' in node) {
		const arc = node.arcData;
		if (arc.startingAngle !== 0 || arc.endingAngle !== Math.PI * 2 || arc.innerRadius > 0) {
			ids.add(node.id);
			return;
		}
	}

	// Check for IMAGE fills on any node type
	if (node.fills) {
		for (const fill of node.fills) {
			if (fill.type === 'IMAGE' && fill.visible !== false) {
				ids.add(node.id);
				return;
			}
		}
	}

	// Recurse into children
	if (node.children) {
		for (const child of node.children) {
			collectFallbackNodeIds(child, ids);
		}
	}
}

/**
 * Export PNG images for specific node IDs (the ones that need image fallback).
 * Returns a map of nodeId → Uint8Array(png).
 */
async function exportFallbackImages(rootNode, fallbackIds) {
	const imageMap = {};

	async function findAndExport(node) {
		if (fallbackIds.has(node.id)) {
			try {
				const png = await node.exportAsync({
					format: 'PNG',
					constraint: { type: 'SCALE', value: 2 }
				});
				imageMap[node.id] = Array.from(png);
			} catch (err) {
				console.error(`Failed to export fallback image for ${node.name}:`, err);
			}
			return; // Don't recurse further into this node
		}
		if (node.children) {
			for (const child of node.children) {
				await findAndExport(child);
			}
		}
	}

	await findAndExport(rootNode);
	return imageMap;
}

// Send current selection to the UI
async function sendSelection() {
	const selection = figma.currentPage.selection;

	if (selection.length === 0) {
		figma.ui.postMessage({ type: 'no-selection' });
		return;
	}

	const frames = [];

	for (const node of selection) {
		if (!('exportAsync' in node)) continue;

		try {
			// 1. Export entire frame as JSON (REST API format)
			const jsonExport = await node.exportAsync({ format: 'JSON_REST_V1' });
			const jsonData = jsonExport.document || jsonExport;

			// 2. Find nodes that need PNG fallback
			const fallbackIds = new Set();
			collectFallbackNodeIds(node, fallbackIds);
			console.log(`[Pictify] Frame "${node.name}": ${fallbackIds.size} nodes need image fallback`);

			// 3. Export PNG for fallback nodes
			const fallbackImages = await exportFallbackImages(node, fallbackIds);

			// 4. Export small PNG for thumbnail preview
			const pngData = await node.exportAsync({
				format: 'PNG',
				constraint: { type: 'WIDTH', value: 400 }
			});

			frames.push({
				id: node.id,
				name: node.name,
				type: node.type,
				width: Math.round(node.width),
				height: Math.round(node.height),
				jsonData,
				fallbackImages,
				pngData: Array.from(pngData)
			});
		} catch (err) {
			console.error(`Failed to export ${node.name}:`, err);
		}
	}

	figma.ui.postMessage({ type: 'selection', frames });
}

// Load stored API token
async function loadToken() {
	const token = await figma.clientStorage.getAsync('pictify_api_token');
	figma.ui.postMessage({ type: 'token-loaded', token: token || null });
}

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
	switch (msg.type) {
		case 'ui-ready':
			await loadToken();
			await sendSelection();
			break;

		case 'refresh-selection':
			await sendSelection();
			break;

		case 'save-token':
			await figma.clientStorage.setAsync('pictify_api_token', msg.token);
			break;

		case 'clear-token':
			await figma.clientStorage.deleteAsync('pictify_api_token');
			break;

		case 'open-url':
			figma.openExternal(msg.url);
			break;

		case 'notify':
			figma.notify(msg.message);
			break;

		case 'close':
			figma.closePlugin();
			break;
	}
};

// Listen for selection changes
figma.on('selectionchange', () => {
	sendSelection();
});
