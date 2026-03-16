/**
 * Fabric.js QR Code Utilities
 *
 * Creates QR codes as Fabric.js groups for the canvas editor.
 * Uses qrcode library for proper QR code generation.
 */

import { Group, Rect, Circle } from 'fabric';
import QRCode from 'qrcode';

// Default QR code configuration
export const DEFAULT_QR_CONFIG = {
	width: 200,
	height: 200,
	fgColor: '#000000',
	bgColor: '#ffffff',
	errorCorrectionLevel: 'M',
	margin: 1, // Quiet zone margin
	patternStyle: 'squares',
	cornerStyle: 'squares',
	logoSrc: null,
	logoSize: 20
};

// Error correction level capacities
const ERROR_CORRECTION_LEVELS = {
	L: 0.07, // ~7% recovery
	M: 0.15, // ~15% recovery
	Q: 0.25, // ~25% recovery
	H: 0.3 // ~30% recovery
};

// QR Code content types with labels and icons
export const QR_CONTENT_TYPES = [
	{ type: 'url', label: 'URL / Link', icon: 'fa-link', placeholder: 'https://example.com' },
	{ type: 'text', label: 'Plain Text', icon: 'fa-font', placeholder: 'Enter text...' },
	{ type: 'email', label: 'Email', icon: 'fa-envelope', placeholder: 'email@example.com' },
	{ type: 'phone', label: 'Phone', icon: 'fa-phone', placeholder: '+1234567890' },
	{ type: 'sms', label: 'SMS', icon: 'fa-comment', placeholder: '+1234567890' },
	{ type: 'wifi', label: 'WiFi', icon: 'fa-wifi', placeholder: 'Network Name' }
];

// Pattern style options
export const PATTERN_STYLES = [
	{ type: 'squares', label: 'Squares', preview: '▪▪▪' },
	{ type: 'dots', label: 'Dots', preview: '●●●' },
	{ type: 'rounded', label: 'Rounded', preview: '◼◼◼' }
];

// Error correction levels
export const ERROR_CORRECTION_OPTIONS = [
	{ level: 'L', label: 'Low (7%)', description: 'Best for clean environments' },
	{ level: 'M', label: 'Medium (15%)', description: 'Good balance (recommended)' },
	{ level: 'Q', label: 'Quartile (25%)', description: 'Good for printed media' },
	{ level: 'H', label: 'High (30%)', description: 'Best for damaged/logo QR codes' }
];

/**
 * Generate unique ID for QR code elements
 */
function generateId() {
	return 'qr_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate QR code matrix using qrcode library
 * @param {string} data - The data to encode
 * @param {string} errorCorrectionLevel - Error correction level (L, M, Q, H)
 * @returns {Promise<{modules: Array, size: number}>} QR code matrix and size
 */
async function generateQRMatrix(data, errorCorrectionLevel = 'M') {
	try {
		// Generate QR code as matrix
		const qrData = await QRCode.create(data, {
			errorCorrectionLevel,
			margin: 0 // We'll handle margin in the rendering
		});

		return {
			modules: qrData.modules.data,
			size: qrData.modules.size
		};
	} catch (error) {
		// Fallback to a simple pattern for error cases
		const size = 25;
		const modules = new Uint8Array(size * size);
		return { modules, size };
	}
}

/**
 * Create a QR code as a Fabric.js Group
 * @param {object} config - QR code configuration
 * @returns {Promise<Group>} - Fabric.js Group containing the QR code
 */
export async function createQRCode(config = {}) {
	const {
		data = 'https://example.com',
		width = DEFAULT_QR_CONFIG.width,
		height = DEFAULT_QR_CONFIG.height,
		fgColor = DEFAULT_QR_CONFIG.fgColor,
		bgColor = DEFAULT_QR_CONFIG.bgColor,
		errorCorrectionLevel = DEFAULT_QR_CONFIG.errorCorrectionLevel,
		margin = DEFAULT_QR_CONFIG.margin,
		patternStyle = DEFAULT_QR_CONFIG.patternStyle,
		cornerStyle = DEFAULT_QR_CONFIG.cornerStyle,
		contentType = 'url'
	} = config;

	const objects = [];
	const qrId = generateId();

	// Generate QR code matrix
	const { modules: matrix, size: moduleCount } = await generateQRMatrix(data, errorCorrectionLevel);

	// Calculate module size with proper quiet zone (margin)
	const quietZone = margin * 4; // Standard quiet zone is 4 modules
	const moduleSize = Math.min(width, height) / (moduleCount + quietZone * 2);
	const qrSize = moduleSize * moduleCount;
	const offset = (Math.min(width, height) - qrSize) / 2;

	// Create background
	const background = new Rect({
		left: 0,
		top: 0,
		width: width,
		height: height,
		fill: bgColor,
		selectable: false,
		evented: false
	});
	objects.push(background);

	// Create QR code modules based on pattern style
	for (let row = 0; row < moduleCount; row++) {
		for (let col = 0; col < moduleCount; col++) {
			const moduleIndex = row * moduleCount + col;
			const isDark = matrix[moduleIndex] === 1;
			if (isDark) {
				const x = offset + col * moduleSize;
				const y = offset + row * moduleSize;

				let module;

				// Check if this is a position pattern (finder pattern)
				const isPositionPattern = isFinderPatternArea(row, col, moduleCount);
				const currentStyle = isPositionPattern ? cornerStyle : patternStyle;

				switch (currentStyle) {
					case 'dots':
						module = new Circle({
							left: x + moduleSize / 2,
							top: y + moduleSize / 2,
							radius: moduleSize * 0.45,
							fill: fgColor,
							originX: 'center',
							originY: 'center',
							selectable: false,
							evented: false
						});
						break;

					case 'rounded':
						module = new Rect({
							left: x,
							top: y,
							width: moduleSize,
							height: moduleSize,
							fill: fgColor,
							rx: moduleSize * 0.3,
							ry: moduleSize * 0.3,
							selectable: false,
							evented: false
						});
						break;

					case 'squares':
					default:
						module = new Rect({
							left: x,
							top: y,
							width: moduleSize,
							height: moduleSize,
							fill: fgColor,
							selectable: false,
							evented: false
						});
						break;
				}

				objects.push(module);
			}
		}
	}

	// Create the group
	const group = new Group(objects, {
		originX: 'center',
		originY: 'center'
	});

	// Add custom properties
	group.set({
		id: qrId,
		name: 'QR Code',
		isQRCode: true,
		qrData: data,
		qrConfig: {
			contentType,
			fgColor,
			bgColor,
			errorCorrectionLevel,
			patternStyle,
			cornerStyle,
			logoSrc: null,
			logoSize: 20,
			// Store base dimensions to prevent size accumulation during updates
			baseWidth: width,
			baseHeight: height
		}
	});

	return group;
}

/**
 * Check if a module is part of a finder pattern area
 */
function isFinderPatternArea(row, col, moduleCount) {
	const size = 7;

	// Top-left finder pattern
	if (row < size && col < size) return true;

	// Top-right finder pattern
	if (row < size && col >= moduleCount - size) return true;

	// Bottom-left finder pattern
	if (row >= moduleCount - size && col < size) return true;

	return false;
}

/**
 * Detect content type from QR data string
 */
export function detectContentType(data) {
	if (!data) return 'text';

	if (data.startsWith('http://') || data.startsWith('https://')) {
		return 'url';
	}
	if (data.startsWith('mailto:')) {
		return 'email';
	}
	if (data.startsWith('tel:')) {
		return 'phone';
	}
	if (data.startsWith('sms:')) {
		return 'sms';
	}
	if (data.startsWith('WIFI:')) {
		return 'wifi';
	}
	if (data.startsWith('BEGIN:VCARD')) {
		return 'vcard';
	}

	return 'text';
}

/**
 * Format data string based on content type
 */
export function formatQRData(contentType, inputData) {
	switch (contentType) {
		case 'url':
			// Ensure URL has protocol
			if (!inputData.startsWith('http://') && !inputData.startsWith('https://')) {
				return 'https://' + inputData;
			}
			return inputData;

		case 'email':
			if (typeof inputData === 'object') {
				const { email, subject, body } = inputData;
				let result = `mailto:${email || ''}`;
				const params = [];
				if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
				if (body) params.push(`body=${encodeURIComponent(body)}`);
				if (params.length > 0) result += '?' + params.join('&');
				return result;
			}
			return inputData.startsWith('mailto:') ? inputData : `mailto:${inputData}`;

		case 'phone':
			const phone = typeof inputData === 'object' ? inputData.phone : inputData;
			return phone.startsWith('tel:') ? phone : `tel:${phone}`;

		case 'sms':
			if (typeof inputData === 'object') {
				const { phone, body } = inputData;
				let result = `sms:${phone || ''}`;
				if (body) result += `?body=${encodeURIComponent(body)}`;
				return result;
			}
			return inputData.startsWith('sms:') ? inputData : `sms:${inputData}`;

		case 'wifi':
			if (typeof inputData === 'object') {
				const { ssid, password, encryption = 'WPA', hidden = false } = inputData;
				return `WIFI:T:${encryption};S:${ssid || ''};P:${password || ''};H:${hidden};;`;
			}
			return inputData;

		case 'text':
		default:
			return typeof inputData === 'string' ? inputData : String(inputData);
	}
}

/**
 * Update QR code with new configuration
 */
export async function updateQRCode(existingQR, newConfig) {
	const currentConfig = existingQR.qrConfig || {};
	const mergedConfig = {
		...currentConfig,
		...newConfig,
		data: newConfig.data || existingQR.qrData
	};

	// Get position from existing
	const left = existingQR.left;
	const top = existingQR.top;
	const angle = existingQR.angle || 0;

	// Use stored base dimensions if available to prevent size accumulation
	// When updating, we want to maintain the original creation size TIMES current scale
	// This way, if user has manually scaled the QR, we preserve that
	let actualWidth, actualHeight;
	const scaleX = existingQR.scaleX || 1;
	const scaleY = existingQR.scaleY || 1;

	if (currentConfig.baseWidth && currentConfig.baseHeight) {
		// Use stored base dimensions multiplied by current scale
		// This prevents size accumulation while respecting user scaling
		actualWidth = currentConfig.baseWidth * scaleX;
		actualHeight = currentConfig.baseHeight * scaleY;
	} else if (typeof existingQR.getScaledWidth === 'function') {
		// Fallback: use Fabric's built-in methods for visual dimensions
		actualWidth = existingQR.getScaledWidth();
		actualHeight = existingQR.getScaledHeight();
	} else {
		// Final fallback: calculate manually
		actualWidth = (existingQR.width || 200) * scaleX;
		actualHeight = (existingQR.height || 200) * scaleY;
	}

	// Create new QR code with actual dimensions (not base dimensions)
	const newQR = await createQRCode({
		data: mergedConfig.data,
		width: actualWidth,
		height: actualHeight,
		fgColor: mergedConfig.fgColor,
		bgColor: mergedConfig.bgColor,
		errorCorrectionLevel: mergedConfig.errorCorrectionLevel,
		margin: mergedConfig.margin || DEFAULT_QR_CONFIG.margin,
		patternStyle: mergedConfig.patternStyle,
		cornerStyle: mergedConfig.cornerStyle,
		contentType: mergedConfig.contentType
	});

	// Apply position (scale is now 1 since we used actual dimensions)
	newQR.set({
		left,
		top,
		scaleX: 1,
		scaleY: 1,
		angle,
		id: existingQR.id // Preserve ID
	});

	// Preserve variable properties if any
	if (existingQR.isVariable) {
		newQR.set({
			isVariable: existingQR.isVariable,
			variableName: existingQR.variableName,
			variableProperty: existingQR.variableProperty,
			variableDescription: existingQR.variableDescription,
			variableValidation: existingQR.variableValidation
		});
	}

	// Preserve variable bindings
	if (existingQR.variableBindings) {
		newQR.set({
			variableBindings: existingQR.variableBindings
		});
	}

	return newQR;
}

/**
 * Parse WiFi QR data string
 */
export function parseWifiData(data) {
	if (!data.startsWith('WIFI:')) return null;

	const result = { ssid: '', password: '', encryption: 'WPA', hidden: false };
	const parts = data.substring(5).split(';');

	for (const part of parts) {
		const [key, value] = part.split(':');
		switch (key) {
			case 'S':
				result.ssid = value || '';
				break;
			case 'P':
				result.password = value || '';
				break;
			case 'T':
				result.encryption = value || 'WPA';
				break;
			case 'H':
				result.hidden = value === 'true';
				break;
		}
	}

	return result;
}
