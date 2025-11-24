<script>
	import { onMount } from 'svelte';
	import { Gradient, filters, FabricImage, Rect } from 'fabric';
	import { selectedComponent, editor, editorActions } from '../../../store/editor.store';
	import GradientColorPicker from './GradientColorPicker.svelte';
	import { BACKGROUND_REMOVER_CONFIG, isBackgroundRemoverAvailable, getModelInfo, SERVER_SIDE_BENEFITS } from '../../config/background-remover.js';
	import backend from '../../../service/backend';

	let styles = {};
	let content = '';
	let type = '';
	let isFontDropdownOpen = false;
	let showCustomFontInput = false;
	let customFontUrl = '';
	
	// Image filter state
	let imageFilters = {
		brightness: 0,
		contrast: 0,
		saturation: 0,
		blur: 0,
		hue: 0,
		gamma: { r: 1, g: 1, b: 1 }
	};
	let showFiltersPanel = false;
	
	// Text effects state
	let textEffects = {
		shadow: {
			enabled: false,
			color: 'rgba(0, 0, 0, 0.5)',
			blur: 5,
			offsetX: 4,
			offsetY: 4
		},
		stroke: {
			enabled: false,
			color: '#000000',
			width: 2
		}
	};
	let showTextEffectsPanel = false;
	
	// Background remover state
	let isRemovingBackground = false;
	let backgroundRemovalError = null;
	let originalImageUrl = null; // Store original for undo

	let fonts = [
		'Arial',
		'Roboto',
		'Open Sans',
		'Lato',
		'Montserrat',
		'Oswald',
		'Merriweather',
		'Playfair Display',
		'Poppins',
		'Source Sans Pro',
		'Lobster',
		'Pacifico',
		'Dancing Script',
		'Satisfy',
		'Bangers'
	];

	const DEFAULT_FILL = '#000000';
	const DEFAULT_BACKGROUND = '#ffffff';

	onMount(() => {
		// Preload all fonts for the dropdown previews
		fonts.forEach(font => {
			if (font !== 'Arial') {
				const link = document.createElement('link');
				link.href = `https://fonts.googleapis.com/css?family=${font.replace(/ /g, '+')}`;
				link.rel = 'stylesheet';
				document.head.appendChild(link);
			}
		});
	});

	async function loadFont(font) {
		if (font === 'Arial') return;
		
		// The link tag is likely already added by onMount, but let's ensure we wait for it
		// We can use document.fonts.load to wait for the font to be ready
		try {
			await document.fonts.load(`12px "${font}"`);
		} catch (e) {
			console.error(`Failed to load font ${font}`, e);
		}
	}
	
	// Debounce timer for property changes to prevent saving intermediate states
	let propertyChangeTimer = null;
	
	function debouncedPropertyChange(target) {
		// Clear existing timer
		if (propertyChangeTimer) {
			clearTimeout(propertyChangeTimer);
		}
		
		// Set new timer - fire event after 300ms of no changes
		propertyChangeTimer = setTimeout(() => {
			if ($editor && target) {
				$editor.fire('object:modified', { target });
			}
			propertyChangeTimer = null;
		}, 300);
	}

	async function addCustomFont() {
		if (!customFontUrl) return;

		try {
			const url = new URL(customFontUrl);
			const familyParam = url.searchParams.get('family');
			
			if (!familyParam) {
				alert('Invalid Google Fonts URL: Could not find family parameter');
				return;
			}

			// Extract family name (handle weights and + signs)
			// Example: Roboto:wght@400;700 -> Roboto
			// Example: Crimson+Text -> Crimson Text
			const familyName = familyParam.split(':')[0].replace(/\+/g, ' ');

			// Add link tag
			const link = document.createElement('link');
			link.href = customFontUrl;
			link.rel = 'stylesheet';
			document.head.appendChild(link);

			// Wait for load
			await loadFont(familyName);

			// Add to list if not exists
			if (!fonts.includes(familyName)) {
				fonts = [...fonts, familyName];
			}

			// Select it
			updateProperty('fontFamily', familyName);
			
			// Reset UI
			customFontUrl = '';
			showCustomFontInput = false;
			isFontDropdownOpen = false;

		} catch (e) {
			console.error('Error adding custom font:', e);
			alert('Invalid URL');
		}
	}

	$: if ($selectedComponent) {
		updateLocalState();
	}

	function updateLocalState() {
		if (!$selectedComponent) return;
		
		const obj = $selectedComponent;
		type = obj.type;

		// Handle fill - can be a string (solid color) or Gradient object
		// For paths (icons), fill might be empty string initially
		let fillValue = obj.fill !== undefined ? obj.fill : DEFAULT_FILL;
		if (type === 'path' && fillValue === '') {
			fillValue = ''; // Keep empty for icons that don't have fill
		}
		
		// If fill is a Fabric.js Gradient object, keep it as-is
		// The GradientColorPicker will handle detecting and parsing it
		
		styles = {
			fill: fillValue,
			stroke: obj.stroke || '#333333',
			strokeWidth: obj.strokeWidth || 1.5,
			fontSize: obj.fontSize || 20,
			fontFamily: obj.fontFamily || 'Arial',
			width: Math.round(obj.getScaledWidth()) || 0,
			height: Math.round(obj.getScaledHeight()) || 0,
			radius: obj.radius || 0,
			backgroundColor: obj.backgroundColor || ''
		};

		if (type === 'i-text' || type === 'text') {
			content = obj.text;
			loadTextEffects();
		}
		
		// Load image filters if it's an image
		if (type === 'image') {
			loadImageFilters();
		}
	}
	
	function loadTextEffects() {
		if (!$selectedComponent || (type !== 'i-text' && type !== 'text')) return;
		
		// Load shadow properties
		if ($selectedComponent.shadow) {
			textEffects.shadow = {
				enabled: true,
				color: $selectedComponent.shadow.color || 'rgba(0, 0, 0, 0.5)',
				blur: $selectedComponent.shadow.blur || 5,
				offsetX: $selectedComponent.shadow.offsetX || 4,
				offsetY: $selectedComponent.shadow.offsetY || 4
			};
		} else {
			textEffects.shadow = {
				enabled: false,
				color: 'rgba(0, 0, 0, 0.5)',
				blur: 5,
				offsetX: 4,
				offsetY: 4
			};
		}
		
		// Load stroke properties
		if ($selectedComponent.stroke && $selectedComponent.strokeWidth) {
			textEffects.stroke = {
				enabled: true,
				color: $selectedComponent.stroke,
				width: $selectedComponent.strokeWidth
			};
		} else {
			textEffects.stroke = {
				enabled: false,
				color: '#000000',
				width: 2
			};
		}
	}
	
	function applyTextShadow(property, value) {
		if (!$selectedComponent || !$editor || (type !== 'i-text' && type !== 'text')) return;
		
		// Update state
		if (property === 'enabled') {
			textEffects.shadow.enabled = value;
		} else {
			textEffects.shadow[property] = value;
		}
		
		// Apply to object
		if (textEffects.shadow.enabled) {
			$selectedComponent.set('shadow', {
				color: textEffects.shadow.color,
				blur: textEffects.shadow.blur,
				offsetX: textEffects.shadow.offsetX,
				offsetY: textEffects.shadow.offsetY
			});
		} else {
			$selectedComponent.set('shadow', null);
		}
		
		$editor.renderAll();
	}
	
	function applyTextStroke(property, value) {
		if (!$selectedComponent || !$editor || (type !== 'i-text' && type !== 'text')) return;
		
		// Update state
		if (property === 'enabled') {
			textEffects.stroke.enabled = value;
		} else {
			textEffects.stroke[property] = value;
		}
		
		// Apply to object
		if (textEffects.stroke.enabled) {
			$selectedComponent.set('stroke', textEffects.stroke.color);
			$selectedComponent.set('strokeWidth', textEffects.stroke.width);
		} else {
			$selectedComponent.set('stroke', null);
			$selectedComponent.set('strokeWidth', 0);
		}
		
		$editor.renderAll();
	}
	
	function applyTextEffectPreset(preset) {
		if (!$selectedComponent || !$editor || (type !== 'i-text' && type !== 'text')) return;
		
		const presets = {
			none: {
				shadow: { enabled: false },
				stroke: { enabled: false }
			},
			'soft-shadow': {
				shadow: { enabled: true, color: 'rgba(0, 0, 0, 0.3)', blur: 10, offsetX: 2, offsetY: 2 },
				stroke: { enabled: false }
			},
			'hard-shadow': {
				shadow: { enabled: true, color: 'rgba(0, 0, 0, 0.8)', blur: 0, offsetX: 4, offsetY: 4 },
				stroke: { enabled: false }
			},
			'outline': {
				shadow: { enabled: false },
				stroke: { enabled: true, color: '#000000', width: 2 }
			},
			'outline-shadow': {
				shadow: { enabled: true, color: 'rgba(0, 0, 0, 0.5)', blur: 5, offsetX: 3, offsetY: 3 },
				stroke: { enabled: true, color: '#ffffff', width: 2 }
			},
			'glow': {
				shadow: { enabled: true, color: 'rgba(255, 255, 255, 0.8)', blur: 20, offsetX: 0, offsetY: 0 },
				stroke: { enabled: false }
			},
			'neon': {
				shadow: { enabled: true, color: 'rgba(0, 255, 255, 0.9)', blur: 25, offsetX: 0, offsetY: 0 },
				stroke: { enabled: true, color: '#00ffff', width: 1 }
			},
			'bold-outline': {
				shadow: { enabled: false },
				stroke: { enabled: true, color: '#000000', width: 6 }
			}
		};
		
		const presetValues = presets[preset];
		if (!presetValues) return;
		
		// Apply shadow
		textEffects.shadow = { ...textEffects.shadow, ...presetValues.shadow };
		if (presetValues.shadow.enabled) {
			$selectedComponent.set('shadow', {
				color: textEffects.shadow.color,
				blur: textEffects.shadow.blur,
				offsetX: textEffects.shadow.offsetX,
				offsetY: textEffects.shadow.offsetY
			});
		} else {
			$selectedComponent.set('shadow', null);
		}
		
		// Apply stroke
		textEffects.stroke = { ...textEffects.stroke, ...presetValues.stroke };
		if (presetValues.stroke.enabled) {
			$selectedComponent.set('stroke', textEffects.stroke.color);
			$selectedComponent.set('strokeWidth', textEffects.stroke.width);
		} else {
			$selectedComponent.set('stroke', null);
			$selectedComponent.set('strokeWidth', 0);
		}
		
		$editor.renderAll();
	}
	
	async function removeBackground() {
		if (!$selectedComponent || type !== 'image' || !$editor) return;
		
		// Create loading overlay on the canvas
		let loadingOverlay = null;
		
		try {
			isRemovingBackground = true;
			backgroundRemovalError = null;
			
			// Store original image URL for undo
			if (!originalImageUrl) {
				originalImageUrl = $selectedComponent.getSrc();
			}
			
			// Add animated loading overlay on the image with gradient
			const imgWidth = $selectedComponent.width * $selectedComponent.scaleX;
			const imgHeight = $selectedComponent.height * $selectedComponent.scaleY;
			
			// Create gradient from blue to cyan
			const gradient = new Gradient({
				type: 'linear',
				coords: {
					x1: 0,
					y1: 0,
					x2: imgWidth,
					y2: imgHeight
				},
				colorStops: [
					{ offset: 0, color: 'rgba(59, 130, 246, 0.25)' },      // blue-500
					{ offset: 0.5, color: 'rgba(96, 165, 250, 0.2)' },    // blue-400
					{ offset: 1, color: 'rgba(125, 211, 252, 0.25)' }     // cyan-300
				]
			});
			
			const rect = new Rect({
				left: $selectedComponent.left,
				top: $selectedComponent.top,
				width: imgWidth,
				height: imgHeight,
				fill: gradient,
				stroke: '#3b82f6',
				strokeWidth: 2,
				strokeDashArray: [8, 4],
				selectable: false,
				evented: false,
				opacity: 0.6,
				rx: 4,
				ry: 4,
				angle: $selectedComponent.angle,
				originX: $selectedComponent.originX,
				originY: $selectedComponent.originY
			});
			
			loadingOverlay = rect;
			$editor.add(rect);
			$editor.bringObjectToFront(rect);
			
			// Animate the overlay (slower pulsing effect)
			let growing = true;
			const animateOverlay = () => {
				if (!isRemovingBackground || !loadingOverlay) return;
				
				const targetOpacity = growing ? 0.85 : 0.35;
				const currentOpacity = loadingOverlay.opacity;
				const step = 0.01; // Slower animation (was 0.05)
				
				if (growing) {
					if (currentOpacity < targetOpacity) {
						loadingOverlay.set('opacity', Math.min(targetOpacity, currentOpacity + step));
					} else {
						growing = false;
					}
				} else {
					if (currentOpacity > targetOpacity) {
						loadingOverlay.set('opacity', Math.max(targetOpacity, currentOpacity - step));
					} else {
						growing = true;
					}
				}
				
				$editor.renderAll();
				requestAnimationFrame(animateOverlay);
			};
			
			animateOverlay();
			
			// Get current image URL
			const imageUrl = $selectedComponent.getSrc();
			
			console.log('[Background Removal] Starting...', {
				imageUrl,
				model: BACKGROUND_REMOVER_CONFIG.model,
				optimize: BACKGROUND_REMOVER_CONFIG.optimize
			});
			
			// Call backend API using the backend service (handles auth automatically via cookies)
			const result = await backend.post('/background-removal', {
				imageUrl: imageUrl,
				model: BACKGROUND_REMOVER_CONFIG.model,
				optimize: BACKGROUND_REMOVER_CONFIG.optimize
			});
			
			console.log('[Background Removal] Success!', result);
			
			// Create new image from processed URL
			const processedUrl = result.proxyUrl || result.url;
			const newImage = await FabricImage.fromURL(processedUrl, { crossOrigin: 'anonymous' });
			
			// Copy all properties from original image
			newImage.set({
				left: $selectedComponent.left,
				top: $selectedComponent.top,
				scaleX: $selectedComponent.scaleX,
				scaleY: $selectedComponent.scaleY,
				angle: $selectedComponent.angle,
				originX: $selectedComponent.originX,
				originY: $selectedComponent.originY,
				flipX: $selectedComponent.flipX,
				flipY: $selectedComponent.flipY,
				opacity: $selectedComponent.opacity,
				filters: $selectedComponent.filters
			});
			
			// Remove loading overlay
			if (loadingOverlay) {
				$editor.remove(loadingOverlay);
				loadingOverlay = null;
			}
			
			// Batch the remove+add operation into a single history entry
			if (typeof window !== 'undefined' && window.__historyBatchStart) {
				window.__historyBatchStart();
			}
			
			// Replace the old image with new one
			$editor.remove($selectedComponent);
			$editor.add(newImage);
			$editor.setActiveObject(newImage);
			editorActions.selectComponent(newImage);
			
			// Apply any existing filters
			if (newImage.filters && newImage.filters.length > 0) {
				newImage.applyFilters();
			}
			
			$editor.renderAll();
			
			// End batching - this will save one history entry
			if (typeof window !== 'undefined' && window.__historyBatchEnd) {
				window.__historyBatchEnd();
			}
			
			isRemovingBackground = false;
			
			console.log('[Background Removal] Complete!');
			
		} catch (error) {
			console.error('[Background Removal] Error:', error);
			console.error('[Background Removal] Error details:', {
				status: error.status,
				message: error.message,
				stack: error.stack
			});
			
			// Remove loading overlay on error
			if (loadingOverlay) {
				$editor.remove(loadingOverlay);
				loadingOverlay = null;
			}
			
			backgroundRemovalError = error.message || 'Failed to remove background';
			isRemovingBackground = false;
			
			// Show user-friendly error message
			let errorMsg = 'Background Removal Failed\n\n';
			
			if (error.status === 401) {
				errorMsg += 'Authentication error. Please try logging out and back in.';
			} else if (error.status === 429) {
				errorMsg += 'You have reached your plan limit. Please upgrade or wait for next month.';
			} else if (error.status === 500) {
				errorMsg += 'Server error. Please try again in a moment.';
			} else if (error.message && error.message.includes('fetch')) {
				errorMsg += 'Network error. Please check your internet connection and try again.';
			} else {
				errorMsg += `${error.message || 'An unexpected error occurred.'}\n\nStatus Code: ${error.status || 'Unknown'}`;
			}
			
			alert(errorMsg);
		}
	}
	
	function restoreOriginalBackground() {
		if (!$selectedComponent || !originalImageUrl || type !== 'image' || !$editor) return;
		
		FabricImage.fromURL(originalImageUrl).then((newImage) => {
			// Copy properties from current image
			newImage.set({
				left: $selectedComponent.left,
				top: $selectedComponent.top,
				scaleX: $selectedComponent.scaleX,
				scaleY: $selectedComponent.scaleY,
				angle: $selectedComponent.angle,
				originX: $selectedComponent.originX,
				originY: $selectedComponent.originY,
				flipX: $selectedComponent.flipX,
				flipY: $selectedComponent.flipY,
				opacity: $selectedComponent.opacity,
				filters: $selectedComponent.filters
			});
			
			// Replace image
			$editor.remove($selectedComponent);
			$editor.add(newImage);
			$editor.setActiveObject(newImage);
			editorActions.selectComponent(newImage);
			
			// Apply filters
			if (newImage.filters && newImage.filters.length > 0) {
				newImage.applyFilters();
			}
			
			$editor.renderAll();
			originalImageUrl = null;
		});
	}
	
	function loadImageFilters() {
		if (!$selectedComponent || type !== 'image') return;
		
		// Reset filters to defaults
		imageFilters = {
			brightness: 0,
			contrast: 0,
			saturation: 0,
			blur: 0,
			hue: 0,
			gamma: { r: 1, g: 1, b: 1 }
		};
		
		// Read existing filters from the image
		const existingFilters = $selectedComponent.filters || [];
		
		existingFilters.forEach(filter => {
			if (filter instanceof filters.Brightness) {
				imageFilters.brightness = filter.brightness || 0;
			} else if (filter instanceof filters.Contrast) {
				imageFilters.contrast = filter.contrast || 0;
			} else if (filter instanceof filters.Saturation) {
				imageFilters.saturation = filter.saturation || 0;
			} else if (filter instanceof filters.Blur) {
				imageFilters.blur = filter.blur || 0;
			} else if (filter instanceof filters.HueRotation) {
				imageFilters.hue = filter.rotation || 0;
			} else if (filter instanceof filters.Gamma) {
				imageFilters.gamma = {
					r: filter.gamma[0] || 1,
					g: filter.gamma[1] || 1,
					b: filter.gamma[2] || 1
				};
			}
		});
	}
	
	function applyImageFilter(filterType, value) {
		const canvas = $editor;
		const activeComponent = $selectedComponent;
		if (!activeComponent || !canvas || type !== 'image') return;
		
		// Update the filter value in state
		if (filterType === 'gamma') {
			imageFilters.gamma = value;
		} else {
			imageFilters[filterType] = value;
		}
		
		// Build new filters array
		const newFilters = [];
		
		if (imageFilters.brightness !== 0) {
			newFilters.push(new filters.Brightness({ brightness: imageFilters.brightness }));
		}
		
		if (imageFilters.contrast !== 0) {
			newFilters.push(new filters.Contrast({ contrast: imageFilters.contrast }));
		}
		
		if (imageFilters.saturation !== 0) {
			newFilters.push(new filters.Saturation({ saturation: imageFilters.saturation }));
		}
		
		if (imageFilters.blur > 0) {
			newFilters.push(new filters.Blur({ blur: imageFilters.blur }));
		}
		
		if (imageFilters.hue !== 0) {
			newFilters.push(new filters.HueRotation({ rotation: imageFilters.hue }));
		}
		
		if (imageFilters.gamma.r !== 1 || imageFilters.gamma.g !== 1 || imageFilters.gamma.b !== 1) {
			newFilters.push(new filters.Gamma({ 
				gamma: [imageFilters.gamma.r, imageFilters.gamma.g, imageFilters.gamma.b] 
			}));
		}
		
		// Apply filters to the image
		activeComponent.filters = newFilters;
		activeComponent.applyFilters();
		canvas.renderAll();
	}
	
	function applyPresetFilter(preset) {
		const canvas = $editor;
		const activeComponent = $selectedComponent;
		if (!activeComponent || !canvas || type !== 'image') return;
		
		const presets = {
			none: {
				brightness: 0,
				contrast: 0,
				saturation: 0,
				blur: 0,
				hue: 0,
				gamma: { r: 1, g: 1, b: 1 }
			},
			grayscale: {
				brightness: 0,
				contrast: 0,
				saturation: -1,
				blur: 0,
				hue: 0,
				gamma: { r: 1, g: 1, b: 1 }
			},
			sepia: {
				brightness: 0.1,
				contrast: 0.1,
				saturation: -0.3,
				blur: 0,
				hue: 0.05,
				gamma: { r: 1.2, g: 1.05, b: 0.9 }
			},
			vintage: {
				brightness: 0.05,
				contrast: 0.15,
				saturation: -0.2,
				blur: 0.02,
				hue: 0.03,
				gamma: { r: 1.15, g: 1.05, b: 0.95 }
			},
			cool: {
				brightness: 0,
				contrast: 0.1,
				saturation: 0.1,
				blur: 0,
				hue: 0,
				gamma: { r: 0.9, g: 1, b: 1.15 }
			},
			warm: {
				brightness: 0.05,
				contrast: 0.05,
				saturation: 0.15,
				blur: 0,
				hue: 0,
				gamma: { r: 1.15, g: 1.05, b: 0.9 }
			},
			dramatic: {
				brightness: -0.1,
				contrast: 0.4,
				saturation: 0.2,
				blur: 0,
				hue: 0,
				gamma: { r: 1, g: 1, b: 1 }
			},
			fade: {
				brightness: 0.15,
				contrast: -0.2,
				saturation: -0.1,
				blur: 0.01,
				hue: 0,
				gamma: { r: 1.05, g: 1.05, b: 1.05 }
			}
		};
		
		const presetValues = presets[preset];
		if (!presetValues) return;
		
		// Update state
		imageFilters = { ...presetValues };
		
		// Build filters array
		const newFilters = [];
		
		if (presetValues.brightness !== 0) {
			newFilters.push(new filters.Brightness({ brightness: presetValues.brightness }));
		}
		
		if (presetValues.contrast !== 0) {
			newFilters.push(new filters.Contrast({ contrast: presetValues.contrast }));
		}
		
		if (presetValues.saturation !== 0) {
			newFilters.push(new filters.Saturation({ saturation: presetValues.saturation }));
		}
		
		if (presetValues.blur > 0) {
			newFilters.push(new filters.Blur({ blur: presetValues.blur }));
		}
		
		if (presetValues.hue !== 0) {
			newFilters.push(new filters.HueRotation({ rotation: presetValues.hue }));
		}
		
		if (presetValues.gamma.r !== 1 || presetValues.gamma.g !== 1 || presetValues.gamma.b !== 1) {
			newFilters.push(new filters.Gamma({ 
				gamma: [presetValues.gamma.r, presetValues.gamma.g, presetValues.gamma.b] 
			}));
		}
		
		// Apply filters
		activeComponent.filters = newFilters;
		activeComponent.applyFilters();
		canvas.renderAll();
	}

	async function updateProperty(prop, value) {
		if (!$selectedComponent || !$editor) return;
		
		if (prop === 'width' || prop === 'height') {
			// For width/height, we might need to adjust scale
			if (type === 'rect') {
				$selectedComponent.set(prop, parseInt(value));
			} else {
				// For other objects, scaling might be better, but let's stick to simple setting for now
				// or maybe just don't allow direct width/height edit for complex objects yet
				// Fabric handles width/height via scale usually for text/images
				if (prop === 'width') $selectedComponent.scaleToWidth(parseInt(value));
				if (prop === 'height') $selectedComponent.scaleToHeight(parseInt(value));
			}
		} else if (prop === 'fontFamily') {
			await loadFont(value);
			$selectedComponent.set(prop, value);
		} else {
			$selectedComponent.set(prop, value);
		}
		
		$selectedComponent.setCoords();
		$editor.renderAll();
		
		// Use debounced event firing to prevent saving intermediate states
		debouncedPropertyChange($selectedComponent);
		
		updateLocalState(); // Refresh state
	}

	function updateContent(value) {
		if (!$selectedComponent || !$editor) return;
		$selectedComponent.set('text', value);
		$editor.renderAll();
	}

	function bringToFront() {
		if (!$selectedComponent || !$editor) return;
		$editor.bringObjectToFront($selectedComponent);
		$editor.renderAll();
		notifyLayerChange($selectedComponent);
	}

	function sendToBack() {
		if (!$selectedComponent || !$editor) return;
		$editor.sendObjectToBack($selectedComponent);
		$editor.renderAll();
		notifyLayerChange($selectedComponent);
	}

	function bringForward() {
		if (!$selectedComponent || !$editor) return;
		$editor.bringObjectForward($selectedComponent);
		$editor.renderAll();
		notifyLayerChange($selectedComponent);
	}

	function sendBackwards() {
		if (!$selectedComponent || !$editor) return;
		$editor.sendObjectBackwards($selectedComponent);
		$editor.renderAll();
		notifyLayerChange($selectedComponent);
	}
	
	function notifyLayerChange(target) {
		if (!$editor || !target) return;
		$editor.fire('object:modified', { target });
	}

	function getTargetDimensions(target) {
		if (!target) {
			return { width: 100, height: 100 };
		}

		const width = typeof target.getScaledWidth === 'function' ? target.getScaledWidth() : target.width || 100;
		const height = typeof target.getScaledHeight === 'function' ? target.getScaledHeight() : target.height || 100;

		return {
			width: Math.max(1, width),
			height: Math.max(1, height)
		};
	}

	function buildGradientFromStops(stops, target, fallbackWidth = 100, fallbackHeight = 100, angle = 90) {
		const dims = target ? getTargetDimensions(target) : { width: fallbackWidth, height: fallbackHeight };

		// Convert angle to radians and calculate gradient coordinates
		// 0° = top to bottom, 90° = left to right, 180° = bottom to top, 270° = right to left
		const angleRad = (angle - 90) * Math.PI / 180;
		const centerX = dims.width / 2;
		const centerY = dims.height / 2;
		const length = Math.sqrt(dims.width * dims.width + dims.height * dims.height) / 2;
		
		const x1 = centerX - Math.cos(angleRad) * length;
		const y1 = centerY - Math.sin(angleRad) * length;
		const x2 = centerX + Math.cos(angleRad) * length;
		const y2 = centerY + Math.sin(angleRad) * length;

		return new Gradient({
			type: 'linear',
			coords: {
				x1: x1,
				y1: y1,
				x2: x2,
				y2: y2
			},
			colorStops: stops.map((stop) => ({
				color: stop.color,
				offset: stop.offset
			}))
		});
	}

	function applyGradientToSelection(stops, angle = 90) {
		if (!$selectedComponent || !$editor) return;
		const gradient = buildGradientFromStops(stops, $selectedComponent, 100, 100, angle);
		$selectedComponent.set('fill', gradient);
		$selectedComponent.setCoords();
		$editor.renderAll();
		
		// Use debounced event firing to prevent saving intermediate states
		debouncedPropertyChange($selectedComponent);
		
		updateLocalState();
	}

	function setBackgroundSolidColor(color) {
		const canvas = $editor;
		if (!canvas) return;
		canvas.backgroundColor = color;
		canvas.renderAll();
	}

	function applyGradientToBackground(stops, angle = 90) {
		const canvas = $editor;
		if (!canvas) return;
		const gradient = buildGradientFromStops(stops, null, canvas.width || 100, canvas.height || 100, angle);
		canvas.backgroundColor = gradient;
		canvas.renderAll();
	}
</script>

<div class="w-full bg-white border-l border-gray-200 h-full flex flex-col shadow-sm z-10">
	<div class="px-5 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
		<h3 class="font-bold text-sm text-gray-900 uppercase tracking-wider">Properties</h3>
	</div>
	<div class="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-6 bg-gray-50/50">
		{#if $selectedComponent}
			<div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
				<span class="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md uppercase tracking-wide shadow-sm">
					{type}
				</span>
				<span class="text-xs font-medium text-gray-500">Selected Element</span>
			</div>

			{#if type === 'i-text' || type === 'text'}
				<div>
					<label class="block text-xs font-medium text-gray-700 mb-1">Text Content</label>
					<textarea
						class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-black focus:ring-black"
						rows="3"
						value={content}
						on:input={(e) => updateContent(e.target.value)}
					></textarea>
				</div>
				
				<div class="relative">
					<label class="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
					<button
						class="w-full text-sm border border-gray-300 rounded-md shadow-sm px-3 py-2 text-left bg-white flex items-center justify-between focus:border-black focus:ring-black focus:outline-none focus:ring-1"
						on:click={() => isFontDropdownOpen = !isFontDropdownOpen}
					>
						<span style="font-family: {styles.fontFamily}">{styles.fontFamily}</span>
						<i class="fa fa-chevron-down text-xs text-gray-400"></i>
					</button>
					
					{#if isFontDropdownOpen}
						<div class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
							{#if showCustomFontInput}
								<div class="p-3 border-b border-gray-100">
									<input
										type="text"
										placeholder="Paste Google Fonts URL"
										class="w-full text-sm border-gray-300 rounded-md mb-3 p-2 focus:border-black focus:ring-black"
										bind:value={customFontUrl}
									/>
									<div class="flex gap-2">
										<button
											class="flex-1 bg-black text-white text-sm py-2 rounded-md hover:bg-gray-800 font-medium"
											on:click={addCustomFont}
										>
											Add
										</button>
										<button
											class="flex-1 bg-gray-100 text-gray-700 text-sm py-2 rounded-md hover:bg-gray-200 font-medium"
											on:click={() => showCustomFontInput = false}
										>
											Cancel
										</button>
									</div>
								</div>
							{:else}
								<button
									class="w-full text-left px-4 py-3 text-sm text-black hover:bg-gray-50 border-b border-gray-100 font-medium flex items-center gap-2"
									on:click={() => showCustomFontInput = true}
								>
									<i class="fa fa-plus"></i> Add Custom Font
								</button>
							{/if}

							{#each fonts as font}
								<button
									class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
									on:click={() => {
										updateProperty('fontFamily', font);
										isFontDropdownOpen = false;
									}}
								>
									<span style="font-family: {font}">{font}</span>
									{#if styles.fontFamily === font}
										<i class="fa fa-check text-black text-xs"></i>
									{/if}
								</button>
							{/each}
						</div>
						
						<!-- Backdrop to close dropdown -->
						<div 
							class="fixed inset-0 z-40 bg-transparent" 
							on:click={() => {
								isFontDropdownOpen = false;
								showCustomFontInput = false;
							}}
						></div>
					{/if}
				</div>

				<div>
					<label class="block text-xs font-medium text-gray-700 mb-1">Font Size (px)</label>
					<input
						type="number"
						class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-black focus:ring-black"
						value={styles.fontSize}
						on:input={(e) => updateProperty('fontSize', parseInt(e.target.value))}
					/>
				</div>
				<GradientColorPicker
					label="Text Color"
					value={styles.fill}
					defaultColor={DEFAULT_FILL}
					onSolidChange={(color) => updateProperty('fill', color)}
					onGradientChange={applyGradientToSelection}
				/>
				
				<!-- Text Effects Panel -->
				<div class="pt-4 border-t border-gray-100">
					<button 
						class="w-full flex items-center justify-between text-left text-xs font-medium text-gray-700 mb-3 hover:text-black transition-colors"
						on:click={() => showTextEffectsPanel = !showTextEffectsPanel}
					>
						<span class="flex items-center gap-2">
							<i class="fa fa-magic"></i>
							Text Effects
						</span>
						<i class="fa fa-chevron-{showTextEffectsPanel ? 'up' : 'down'} text-xs"></i>
					</button>
					
					{#if showTextEffectsPanel}
						<div class="space-y-4">
							<!-- Preset Effects -->
							<div>
								<label class="block text-xs font-medium text-gray-600 mb-2">Quick Effects</label>
								<div class="grid grid-cols-2 gap-2">
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyTextEffectPreset('none')}
									>
										None
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyTextEffectPreset('soft-shadow')}
									>
										Soft Shadow
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyTextEffectPreset('hard-shadow')}
									>
										Hard Shadow
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyTextEffectPreset('outline')}
									>
										Outline
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyTextEffectPreset('outline-shadow')}
									>
										Outline + Shadow
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyTextEffectPreset('glow')}
									>
										Glow
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyTextEffectPreset('neon')}
									>
										Neon
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyTextEffectPreset('bold-outline')}
									>
										Bold Outline
									</button>
								</div>
							</div>
							
							<!-- Shadow Controls -->
							<div class="pt-3 border-t border-gray-100">
								<div class="flex items-center justify-between mb-3">
									<label class="text-xs font-medium text-gray-700">Shadow</label>
									<label class="relative inline-flex items-center cursor-pointer">
										<input 
											type="checkbox" 
											class="sr-only peer"
											checked={textEffects.shadow.enabled}
											on:change={(e) => applyTextShadow('enabled', e.target.checked)}
										/>
										<div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
									</label>
								</div>
								
								{#if textEffects.shadow.enabled}
									<div class="space-y-3 ml-2 pl-3 border-l-2 border-gray-200">
										<!-- Shadow Color -->
										<GradientColorPicker
											label="Color"
											value={textEffects.shadow.color}
											defaultColor="rgba(0, 0, 0, 0.5)"
											supportsGradient={false}
											onSolidChange={(color) => applyTextShadow('color', color)}
										/>
										
										<!-- Shadow Blur -->
										<div>
											<div class="flex items-center justify-between mb-2">
												<label class="text-xs text-gray-600">Blur</label>
												<span class="text-xs text-gray-500">{textEffects.shadow.blur}px</span>
											</div>
											<input
												type="range"
												min="0"
												max="30"
												step="1"
												value={textEffects.shadow.blur}
												class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
												on:input={(e) => applyTextShadow('blur', parseInt(e.target.value))}
											/>
										</div>
										
										<!-- Shadow Offset X -->
										<div>
											<div class="flex items-center justify-between mb-2">
												<label class="text-xs text-gray-600">Horizontal Offset</label>
												<span class="text-xs text-gray-500">{textEffects.shadow.offsetX}px</span>
											</div>
											<input
												type="range"
												min="-30"
												max="30"
												step="1"
												value={textEffects.shadow.offsetX}
												class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
												on:input={(e) => applyTextShadow('offsetX', parseInt(e.target.value))}
											/>
										</div>
										
										<!-- Shadow Offset Y -->
										<div>
											<div class="flex items-center justify-between mb-2">
												<label class="text-xs text-gray-600">Vertical Offset</label>
												<span class="text-xs text-gray-500">{textEffects.shadow.offsetY}px</span>
											</div>
											<input
												type="range"
												min="-30"
												max="30"
												step="1"
												value={textEffects.shadow.offsetY}
												class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
												on:input={(e) => applyTextShadow('offsetY', parseInt(e.target.value))}
											/>
										</div>
									</div>
								{/if}
							</div>
							
							<!-- Stroke Controls -->
							<div class="pt-3 border-t border-gray-100">
								<div class="flex items-center justify-between mb-3">
									<label class="text-xs font-medium text-gray-700">Stroke (Outline)</label>
									<label class="relative inline-flex items-center cursor-pointer">
										<input 
											type="checkbox" 
											class="sr-only peer"
											checked={textEffects.stroke.enabled}
											on:change={(e) => applyTextStroke('enabled', e.target.checked)}
										/>
										<div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
									</label>
								</div>
								
								{#if textEffects.stroke.enabled}
									<div class="space-y-3 ml-2 pl-3 border-l-2 border-gray-200">
										<!-- Stroke Color -->
										<GradientColorPicker
											label="Color"
											value={textEffects.stroke.color}
											defaultColor="#000000"
											supportsGradient={false}
											onSolidChange={(color) => applyTextStroke('color', color)}
										/>
										
										<!-- Stroke Width -->
										<div>
											<div class="flex items-center justify-between mb-2">
												<label class="text-xs text-gray-600">Width</label>
												<span class="text-xs text-gray-500">{textEffects.stroke.width}px</span>
											</div>
											<input
												type="range"
												min="1"
												max="20"
												step="0.5"
												value={textEffects.stroke.width}
												class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
												on:input={(e) => applyTextStroke('width', parseFloat(e.target.value))}
											/>
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Universal Stroke & Fill Controls for All Shapes -->
			{#if type === 'rect' || type === 'circle' || type === 'triangle' || type === 'polygon' || type === 'path'}
				<div class="space-y-4 pt-4 border-t border-gray-100">
					<h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Appearance</h4>
					
					<!-- Fill Color -->
					<GradientColorPicker
						label="Fill Color"
						value={styles.fill || '#000000'}
						defaultColor="#000000"
						onSolidChange={(color) => updateProperty('fill', color)}
						onGradientChange={applyGradientToSelection}
					/>
					
					{#if type !== 'path' || styles.fill}
						<div class="flex items-center justify-between">
							<span class="text-xs text-gray-600">Fill Enabled</span>
							<label class="relative inline-flex items-center cursor-pointer">
								<input 
									type="checkbox" 
									class="sr-only peer"
									checked={styles.fill !== '' && styles.fill !== null}
									on:change={(e) => updateProperty('fill', e.target.checked ? '#3b82f6' : '')}
								/>
								<div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
							</label>
						</div>
					{/if}
					
					<!-- Stroke Color -->
					<GradientColorPicker
						label="Stroke Color"
						value={styles.stroke || '#333333'}
						defaultColor="#333333"
						supportsGradient={false}
						onSolidChange={(color) => updateProperty('stroke', color)}
					/>
					
					<!-- Stroke Width -->
					<div>
						<div class="flex items-center justify-between mb-2">
							<label class="text-xs font-medium text-gray-700">Stroke Width</label>
							<span class="text-xs text-gray-500">{styles.strokeWidth}px</span>
						</div>
						<input
							type="range"
							min="0"
							max="20"
							step="0.5"
							value={styles.strokeWidth}
							class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
							on:input={(e) => updateProperty('strokeWidth', parseFloat(e.target.value))}
						/>
					</div>
				</div>
			{/if}

			<!-- Keep old type-specific sections for backward compatibility -->
			{#if type === 'path'}
				<!-- Path-specific controls removed, now using universal controls above -->
			{/if}


			<div class="grid grid-cols-2 gap-2">
				<div>
					<label class="block text-xs font-medium text-gray-700 mb-1">Width</label>
					<input
						type="number"
						class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-black focus:ring-black"
						value={styles.width}
						on:change={(e) => updateProperty('width', e.target.value)}
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-gray-700 mb-1">Height</label>
					<input
						type="number"
						class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-black focus:ring-black"
						value={styles.height}
						on:change={(e) => updateProperty('height', e.target.value)}
					/>
				</div>
			</div>
			
			{#if type === 'image'}
				<!-- Background Remover -->
				<div class="pt-4 border-t border-gray-100">
					<label class="block text-xs font-medium text-gray-700 mb-2">AI Background Removal</label>
					
					<div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 mb-3">
						<div class="flex items-start gap-2">
							<i class="fa fa-server text-purple-500 mt-0.5"></i>
							<div class="flex-1">
								<p class="text-xs text-purple-800 font-medium mb-1">
									⚡ Server-Side AI Processing
								</p>
								<p class="text-xs text-purple-700">
									Faster, better quality, and works on all devices!
								</p>
							</div>
						</div>
					</div>
					
					<div class="space-y-2">
						<button 
							class="w-full py-2.5 px-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md transition-all font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
							on:click={removeBackground}
							disabled={isRemovingBackground}
						>
							{#if isRemovingBackground}
								<i class="fa fa-spinner fa-spin"></i>
								Processing (3-5 seconds)...
							{:else}
								<i class="fa fa-magic"></i>
								Remove Background (AI)
							{/if}
						</button>
						
						{#if originalImageUrl}
							<button 
								class="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors font-medium text-xs flex items-center justify-center gap-2"
								on:click={restoreOriginalBackground}
							>
								<i class="fa fa-undo"></i>
								Restore Original
							</button>
						{/if}
						
						{#if backgroundRemovalError}
							<div class="bg-red-50 border border-red-200 rounded-lg p-2">
								<p class="text-xs text-red-800">{backgroundRemovalError}</p>
							</div>
						{/if}
						
						<div class="text-xs text-gray-500 italic pt-1">
							<i class="fa fa-bolt"></i>
							Powered by advanced server AI - instant start, professional results
						</div>
					</div>
				</div>
				
				<!-- Filters & Effects -->
				<div class="pt-4 border-t border-gray-100">
					<button 
						class="w-full flex items-center justify-between text-left text-xs font-medium text-gray-700 mb-3 hover:text-black transition-colors"
						on:click={() => showFiltersPanel = !showFiltersPanel}
					>
						<span class="flex items-center gap-2">
							<i class="fa fa-magic"></i>
							Filters & Effects
						</span>
						<i class="fa fa-chevron-{showFiltersPanel ? 'up' : 'down'} text-xs"></i>
					</button>
					
					{#if showFiltersPanel}
						<div class="space-y-4">
							<!-- Preset Filters -->
							<div>
								<label class="block text-xs font-medium text-gray-600 mb-2">Quick Filters</label>
								<div class="grid grid-cols-2 gap-2">
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyPresetFilter('none')}
									>
										Original
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyPresetFilter('grayscale')}
									>
										B&W
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyPresetFilter('sepia')}
									>
										Sepia
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyPresetFilter('vintage')}
									>
										Vintage
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyPresetFilter('cool')}
									>
										Cool
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyPresetFilter('warm')}
									>
										Warm
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyPresetFilter('dramatic')}
									>
										Dramatic
									</button>
									<button 
										class="px-3 py-2 text-xs bg-white border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all font-medium"
										on:click={() => applyPresetFilter('fade')}
									>
										Fade
									</button>
								</div>
							</div>
							
							<div class="pt-3 border-t border-gray-100">
								<label class="block text-xs font-medium text-gray-600 mb-3">Manual Adjustments</label>
								
								<!-- Brightness -->
								<div class="mb-4">
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs text-gray-700">Brightness</label>
										<span class="text-xs text-gray-500">{Math.round(imageFilters.brightness * 100)}%</span>
									</div>
									<input
										type="range"
										min="-1"
										max="1"
										step="0.01"
										value={imageFilters.brightness}
										class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
										on:input={(e) => applyImageFilter('brightness', parseFloat(e.target.value))}
									/>
								</div>
								
								<!-- Contrast -->
								<div class="mb-4">
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs text-gray-700">Contrast</label>
										<span class="text-xs text-gray-500">{Math.round(imageFilters.contrast * 100)}%</span>
									</div>
									<input
										type="range"
										min="-1"
										max="1"
										step="0.01"
										value={imageFilters.contrast}
										class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
										on:input={(e) => applyImageFilter('contrast', parseFloat(e.target.value))}
									/>
								</div>
								
								<!-- Saturation -->
								<div class="mb-4">
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs text-gray-700">Saturation</label>
										<span class="text-xs text-gray-500">{Math.round(imageFilters.saturation * 100)}%</span>
									</div>
									<input
										type="range"
										min="-1"
										max="1"
										step="0.01"
										value={imageFilters.saturation}
										class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
										on:input={(e) => applyImageFilter('saturation', parseFloat(e.target.value))}
									/>
								</div>
								
								<!-- Blur -->
								<div class="mb-4">
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs text-gray-700">Blur</label>
										<span class="text-xs text-gray-500">{Math.round(imageFilters.blur * 100)}%</span>
									</div>
									<input
										type="range"
										min="0"
										max="1"
										step="0.01"
										value={imageFilters.blur}
										class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
										on:input={(e) => applyImageFilter('blur', parseFloat(e.target.value))}
									/>
								</div>
								
								<!-- Hue Rotation -->
								<div class="mb-4">
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs text-gray-700">Hue Rotation</label>
										<span class="text-xs text-gray-500">{Math.round(imageFilters.hue * 360)}°</span>
									</div>
									<input
										type="range"
										min="-0.5"
										max="0.5"
										step="0.01"
										value={imageFilters.hue}
										class="w-full h-2 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-lg appearance-none cursor-pointer slider"
										on:input={(e) => applyImageFilter('hue', parseFloat(e.target.value))}
									/>
								</div>
								
								<!-- Reset Filters Button -->
								<button 
									class="w-full py-2 px-3 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors font-medium"
									on:click={() => applyPresetFilter('none')}
								>
									<i class="fa fa-undo mr-1"></i>
									Reset All Filters
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<div class="pt-4 border-t border-gray-100">
				<label class="block text-xs font-medium text-gray-700 mb-2">Layer Arrangement</label>
				<div class="flex items-center justify-between gap-2">
					<button 
						class="p-2 text-gray-600 hover:bg-gray-100 rounded border border-gray-200 flex-1"
						title="Bring to Front"
						on:click={bringToFront}
					>
						<i class="fa fa-angle-double-up"></i>
					</button>
					<button 
						class="p-2 text-gray-600 hover:bg-gray-100 rounded border border-gray-200 flex-1"
						title="Bring Forward"
						on:click={bringForward}
					>
						<i class="fa fa-angle-up"></i>
					</button>
					<button 
						class="p-2 text-gray-600 hover:bg-gray-100 rounded border border-gray-200 flex-1"
						title="Send Backward"
						on:click={sendBackwards}
					>
						<i class="fa fa-angle-down"></i>
					</button>
					<button 
						class="p-2 text-gray-600 hover:bg-gray-100 rounded border border-gray-200 flex-1"
						title="Send to Back"
						on:click={sendToBack}
					>
						<i class="fa fa-angle-double-down"></i>
					</button>
				</div>
			</div>
			
		{:else}
			<div class="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
				<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded uppercase">
					Canvas
				</span>
				<span class="text-xs text-gray-400">Settings</span>
			</div>

			<div>
				<label class="block text-xs font-medium text-gray-700 mb-1">
					Presets
					<select 
						class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-black focus:ring-black mt-1"
						on:change={(e) => {
							const [w, h] = e.target.value.split('x');
							if (w && h && $editor) {
								$editor.setDimensions({ width: parseInt(w), height: parseInt(h) });
								$editor.renderAll();
							}
						}}
					>
						<option value="">Select a preset...</option>
						<option value="1080x1080">Instagram Post (1080x1080)</option>
						<option value="1080x1920">Instagram Story (1080x1920)</option>
						<option value="1200x630">OG Image (1200x630)</option>
						<option value="1123x794">Certificate Landscape (A4)</option>
						<option value="794x1123">Certificate Portrait (A4)</option>
						<option value="1050x600">Business Card (1050x600)</option>
					</select>
				</label>
			</div>

			<div class="grid grid-cols-2 gap-2">
				<div>
					<label class="block text-xs font-medium text-gray-700 mb-1">
						Width
						<input
							type="number"
							class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-black focus:ring-black mt-1"
							value={$editor ? $editor.width : 0}
							on:change={(e) => {
								if ($editor) {
									$editor.setDimensions({ width: parseInt(e.target.value), height: $editor.height });
								}
							}}
						/>
					</label>
				</div>
				<div>
					<label class="block text-xs font-medium text-gray-700 mb-1">
						Height
						<input
							type="number"
							class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-black focus:ring-black mt-1"
							value={$editor ? $editor.height : 0}
							on:change={(e) => {
								if ($editor) {
									$editor.setDimensions({ width: $editor.width, height: parseInt(e.target.value) });
								}
							}}
						/>
					</label>
				</div>
			</div>
			
			
			<GradientColorPicker
				label="Background Color"
				value={$editor ? $editor.backgroundColor : DEFAULT_BACKGROUND}
				defaultColor={DEFAULT_BACKGROUND}
				onSolidChange={setBackgroundSolidColor}
				onGradientChange={applyGradientToBackground}
			/>
		{/if}
	</div>
</div>

<style>
	/* Custom slider styling */
	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #000;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #000;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.slider::-webkit-slider-thumb:hover {
		background: #333;
		transform: scale(1.1);
	}

	.slider::-moz-range-thumb:hover {
		background: #333;
		transform: scale(1.1);
	}

	/* Custom scrollbar for properties panel */
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #d0d0d0;
		border-radius: 3px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #b0b0b0;
	}
</style>