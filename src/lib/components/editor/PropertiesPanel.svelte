<script>
	import { onMount, onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';
	import { Gradient, filters, FabricImage, Rect, Path, Circle, Ellipse } from 'fabric';
	import { selectedComponent, editor, editorActions } from '../../../store/editor.store';
	import {
		variableActions,
		variables as variablesStore,
		variableNames
	} from '../../../store/variables.store';
	import CodeMirror from 'svelte-codemirror-editor';
	import { json } from '@codemirror/lang-json';
	import GradientColorPicker from './GradientColorPicker.svelte';
	import ConditionBuilder from './ConditionBuilder.svelte';
	import { getRoundedRectPath } from '../../utils/shape-utils';
	import {
		BACKGROUND_REMOVER_CONFIG,
		isBackgroundRemoverAvailable,
		getModelInfo,
		SERVER_SIDE_BENEFITS
	} from '../../config/background-remover.js';
	import backend from '../../../service/backend';
	import { showToast } from '../../../store/toast.store';
	import {
		getAllFonts,
		preloadFonts,
		searchFonts,
		addGoogleFont,
		CATEGORY_LABELS,
		CATEGORY_ICONS
	} from '../../../api/fonts';
	import { outputFormat, pdfPreset, pageActions } from '../../../store/pages.store';
	import { loadBrandFonts, getBrandFontFamilies } from '../../utils/brand-fonts-loader';
	import {
		checkFeatureAccessSync,
		FEATURES,
		PLAN_DISPLAY_NAMES,
		getMinimumPlan
	} from '../../../store/plg.store';
	import {
		createQRCode,
		updateQRCode,
		formatQRData,
		QR_CONTENT_TYPES,
		PATTERN_STYLES,
		ERROR_CORRECTION_OPTIONS
	} from '../../utils/fabric-qr';
	import PanelTabs from './ui/PanelTabs.svelte';
	import CollapsibleSection from './ui/CollapsibleSection.svelte';
	import {
		sectionHeaderClass,
		fieldLabelClass,
		inputBaseClass,
		inputNumberClass,
		buttonBaseClass,
		selectClass,
		toggleSwitchClass,
		rangeInputClass
	} from './ui/tokens.js';

	// Numeric input validation helper
	function clampNumber(value, min, max, fallback = 0) {
		const num = parseFloat(value);
		if (isNaN(num)) return fallback;
		return Math.min(Math.max(num, min), max);
	}

	let styles = {};
	let content = '';
	let type = '';
	let isFontDropdownOpen = false;
	let isWeightDropdownOpen = false;
	let showCustomFontInput = false;
	let customFontUrl = '';

	const fontWeights = [
		{ label: 'Normal', value: 'normal' },
		{ label: 'Bold', value: 'bold' },
		{ label: 'Thin (100)', value: '100' },
		{ label: 'Light (300)', value: '300' },
		{ label: 'Regular (400)', value: '400' },
		{ label: 'Medium (500)', value: '500' },
		{ label: 'Semi Bold (600)', value: '600' },
		{ label: 'Bold (700)', value: '700' },
		{ label: 'Extra Bold (800)', value: '800' },
		{ label: 'Black (900)', value: '900' }
	];

	// Shape properties
	let showIndividualCorners = false;
	let cornerRadii = { tl: 0, tr: 0, br: 0, bl: 0 };

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

	// Feature gating for AI Background Remover
	$: bgRemoverAccess = checkFeatureAccessSync(FEATURES.AI_BACKGROUND_REMOVER);
	$: hasBgRemoverAccess = bgRemoverAccess?.hasAccess ?? false;
	$: bgRemoverMinPlan = getMinimumPlan(FEATURES.AI_BACKGROUND_REMOVER);
	$: bgRemoverMinPlanName = PLAN_DISPLAY_NAMES[bgRemoverMinPlan];

	// Image clip/mask state
	let currentClipShape = 'none'; // 'none', 'circle', 'ellipse', 'rounded-rect'
	let clipCornerRadius = 20;
	let clipSettings = {
		offsetX: 0, // X offset from center (percentage)
		offsetY: 0, // Y offset from center (percentage)
		scale: 100 // Scale of clip area (percentage)
	};
	let lastSelectedImageId = null; // Track which image we last loaded settings for

	// Variable state - multi-binding
	let isVariable = false;
	let variableBindings = []; // Array of { variableName, property, description, required }

	// Conditional logic state
	let conditionType = 'none'; // 'none', 'showWhen', 'hideWhen'
	let conditionExpression = '';
	let conditionValid = true;
	let conditionError = '';

	// Loop state
	let isLoopElement = false;

	// Panel mode: 'design' | 'logic'
	let panelMode = 'design';

	// Collapsible section states
	let showPositionSection = true;
	let showAppearanceSection = true;
	let showShadowSection = false;
	let showTextSection = true;

	// Logic tab accordion section states
	let showVariablesSection = true;
	let showConditionSection = true;
	let showLoopSection = true;
	let showApiPreview = false;

	// Validation state
	let variableNameErrors = {};
	let loopVariableError = '';
	let strippedCharsMessage = '';
	let strippedCharsTimeout = null;

	// Destructive action confirmation
	let pendingDestructiveAction = null;

	// Check if element has any logic configured
	$: hasLogicConfigured = isVariable || conditionType !== 'none' || isLoopElement;

	// Computed: available vars for condition builder
	$: conditionAvailableVars = variableBindings.map((b) => b.variableName).filter(Boolean);
	// Computed: set of bound properties for Design tab indicators
	$: boundProperties = new Set(variableBindings.map((b) => b.property));

	let loopVariable = '';
	let loopItemName = 'item';
	let loopIndexName = 'index';
	let loopDirection = 'vertical'; // 'horizontal', 'vertical', 'grid'
	let loopSpacing = 50;
	let loopColumns = 3; // for grid layout

	// Chart/Table state
	let isChart = false;
	let isTable = false;
	let chartType = '';
	let tableType = '';
	let chartData = [];
	let tableData = {};
	let tableStyle = 'modern';
	let showChartDataEditor = false;
	let chartDataInput = '';
	let chartDataFormat = 'json'; // 'json' or 'csv'
	let maximizeChartEditor = false;

	// Table data editing state
	let showTableDataEditor = false;
	let tableDataInput = '';
	let tableDataFormat = 'json'; // 'json' or 'csv'
	let tableDataError = '';
	let chartDataError = '';
	let maximizeTableEditor = false;

	// Chart appearance customization
	let chartFontFamily = 'Inter';
	let chartColors = [
		'#ff6b6b',
		'#4ecdc4',
		'#45b7d1',
		'#96ceb4',
		'#ffeaa7',
		'#dfe6e9',
		'#fd79a8',
		'#a29bfe',
		'#6c5ce7',
		'#00b894'
	];
	let chartTitleColor = '#333333';
	let chartLabelColor = '#666666';
	let chartGridColor = '#eeeeee';
	let chartBackgroundColor = '#ffffff';
	let chartBorderColor = '#e5e5e5';
	let showChartAppearance = false;

	// Chart color palette presets
	const CHART_PALETTES = {
		default: { name: 'Default', colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'] },
		warm: { name: 'Warm', colors: ['#ff6b6b', '#ff8c42', '#ffd166', '#f4845f', '#e76f51'] },
		cool: { name: 'Cool', colors: ['#4ecdc4', '#45b7d1', '#6c5ce7', '#a29bfe', '#74b9ff'] },
		pastel: { name: 'Pastel', colors: ['#ffc8dd', '#bde0fe', '#a2d2ff', '#cdb4db', '#d5bdaf'] },
		mono: { name: 'Mono', colors: ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9', '#f5f5f5'] }
	};

	// Simple font list for chart/table font dropdown
	const CHART_FONT_OPTIONS = [
		'Inter',
		'Roboto',
		'Open Sans',
		'Lato',
		'Montserrat',
		'Poppins',
		'PT Sans',
		'Source Sans Pro',
		'system-ui'
	];

	// Table appearance customization
	let tableFontFamily = 'Inter';
	let tableCustomColors = null; // null = use preset, object = custom overrides
	let showTableCustomize = false;

	// QR Code section collapse state
	let showQRAppearance = true;
	let showQRContent = true;
	let showQRErrorCorrection = false;

	// Format CSV with proper alignment for readability
	function formatCSV(csvText) {
		if (!csvText || !csvText.trim()) return csvText;
		const lines = csvText
			.trim()
			.split('\n')
			.map((l) => l.split(',').map((c) => c.trim()));
		if (lines.length === 0) return csvText;
		const colWidths = [];
		for (const row of lines) {
			row.forEach((cell, i) => {
				colWidths[i] = Math.max(colWidths[i] || 0, cell.length);
			});
		}
		return lines
			.map((row) => row.map((cell, i) => cell.padEnd(colWidths[i] || 0)).join(', '))
			.join('\n');
	}

	function formatChartCSV() {
		if (chartDataFormat === 'csv') chartDataInput = formatCSV(chartDataInput);
	}

	function formatTableCSV() {
		if (tableDataFormat === 'csv') tableDataInput = formatCSV(tableDataInput);
	}

	// QR Code state
	let isQRCode = false;
	let qrData = '';
	let qrConfig = {};
	let showQRDataEditor = false;

	// Table styles for the style picker
	const TABLE_STYLES = {
		modern: {
			name: 'Modern',
			headerBg: '#1a1a2e',
			headerText: '#ffffff',
			rowBg: '#ffffff',
			altRowBg: '#f8fafc',
			borderColor: '#e2e8f0'
		},
		minimal: {
			name: 'Minimal',
			headerBg: 'transparent',
			headerText: '#1a1a1a',
			rowBg: 'transparent',
			altRowBg: 'transparent',
			borderColor: '#e5e5e5'
		},
		colorful: {
			name: 'Colorful',
			headerBg: '#ff6b6b',
			headerText: '#ffffff',
			rowBg: '#ffffff',
			altRowBg: '#fff5f5',
			borderColor: '#ffccd5'
		},
		corporate: {
			name: 'Corporate',
			headerBg: '#0f172a',
			headerText: '#ffffff',
			rowBg: '#ffffff',
			altRowBg: '#f1f5f9',
			borderColor: '#cbd5e1'
		},
		gradient: {
			name: 'Gradient',
			headerBg: '#6366f1',
			headerText: '#ffffff',
			rowBg: '#ffffff',
			altRowBg: '#eef2ff',
			borderColor: '#c7d2fe'
		}
	};

	// Font state
	let allFonts = [];
	let fontCategories = [];
	let selectedCategory = 'all';
	let fontSearchQuery = '';
	let fontsLoading = true;

	// Extended search state (for Google Fonts API)
	let extendedSearchResults = [];
	let isSearchingGoogle = false;
	let searchDebounceTimer = null;
	let addingFont = false;
	let addFontError = '';

	// Computed filtered fonts - combines local and extended results
	$: filteredFonts = getFilteredFonts(
		allFonts,
		extendedSearchResults,
		selectedCategory,
		fontSearchQuery
	);

	function getFilteredFonts(fonts, extendedResults, category, search) {
		let result = fonts;

		// Filter by category
		if (category !== 'all') {
			result = result.filter((f) => f.category === category);
		}

		// Filter by search
		if (search && search.length >= 2) {
			const searchLower = search.toLowerCase();
			result = result.filter((f) => f.family.toLowerCase().includes(searchLower));

			// Add extended results that aren't already in local list
			if (extendedResults.length > 0) {
				const localFamilies = new Set(result.map((f) => f.family.toLowerCase()));
				const newFonts = extendedResults.filter((f) => !localFamilies.has(f.family.toLowerCase()));
				result = [...result, ...newFonts];
			}
		}

		return result;
	}

	// Debounced extended search
	async function handleFontSearch(query) {
		fontSearchQuery = query;
		extendedSearchResults = [];
		addFontError = '';

		if (searchDebounceTimer) {
			clearTimeout(searchDebounceTimer);
		}

		// Only do extended search if query is long enough and few local results
		if (query.length >= 3) {
			searchDebounceTimer = setTimeout(async () => {
				const localResults = allFonts.filter((f) =>
					f.family.toLowerCase().includes(query.toLowerCase())
				);

				// If few local results, search Google Fonts API
				if (localResults.length < 5) {
					isSearchingGoogle = true;
					try {
						const response = await searchFonts(query, true);
						extendedSearchResults = (response.fonts || []).filter((f) => f.source === 'google');
					} catch (error) {
						console.error('Extended search failed:', error);
					} finally {
						isSearchingGoogle = false;
					}
				}
			}, 500);
		}
	}

	// Add a font from Google Fonts
	async function handleAddFont(font) {
		addingFont = true;
		addFontError = '';

		try {
			const result = await addGoogleFont(font.family);

			if (result.success) {
				// Add to local fonts list
				const newFont = {
					family: result.font.family,
					category: result.font.category,
					weights: result.font.weights,
					popular: false,
					source: 'custom'
				};

				// Check if already in list
				if (!allFonts.find((f) => f.family.toLowerCase() === newFont.family.toLowerCase())) {
					allFonts = [newFont, ...allFonts];
				}

				// Preload and apply the font
				const link = document.createElement('link');
				link.href = `https://fonts.googleapis.com/css2?family=${font.family.replace(
					/ /g,
					'+'
				)}:wght@${result.font.weights.join(';')}&display=swap`;
				link.rel = 'stylesheet';
				document.head.appendChild(link);

				// Apply to selected element
				updateProperty('fontFamily', result.font.family);

				// Close dropdown
				isFontDropdownOpen = false;
				fontSearchQuery = '';
				selectedCategory = 'all';
				extendedSearchResults = [];
			}
		} catch (error) {
			addFontError = error.message || 'Failed to add font';
			showToast('Failed to load font: ' + (error.message || 'Unknown error'), 'error');
		} finally {
			addingFont = false;
		}
	}

	// Simple font names array for backward compatibility
	$: fonts = allFonts.map((f) => f.family);

	// Font dropdown click-outside and Escape key handler
	let fontDropdownRef;
	function handleFontDropdownClickOutside(e) {
		if (isFontDropdownOpen && fontDropdownRef && !fontDropdownRef.contains(e.target)) {
			isFontDropdownOpen = false;
		}
	}
	function handleFontDropdownKeydown(e) {
		if (e.key === 'Escape' && isFontDropdownOpen) {
			isFontDropdownOpen = false;
		}
	}

	const DEFAULT_FILL = '#000000';
	const DEFAULT_BACKGROUND = '#ffffff';

	onMount(async () => {
		// Font dropdown click-outside listener
		if (typeof window !== 'undefined') {
			window.addEventListener('click', handleFontDropdownClickOutside);
			window.addEventListener('keydown', handleFontDropdownKeydown);
		}
		// Fetch fonts from API
		try {
			const response = await getAllFonts();
			allFonts = response.fonts || [];
			fontCategories = response.categories || [];

			// Load brand fonts and add them to the font list
			try {
				const brandFonts = await loadBrandFonts();
				if (brandFonts.length > 0) {
					// Add brand fonts category
					if (!fontCategories.includes('brand')) {
						fontCategories.unshift('brand'); // Add at the beginning
					}

					// Add brand fonts to the font list
					const brandFontObjects = brandFonts.map((family) => ({
						family: family,
						display: family,
						weights: [400, 700], // Default weights
						popular: false,
						category: 'brand',
						google: false,
						isBrandFont: true
					}));

					// Prepend brand fonts to show them first
					allFonts = [...brandFontObjects, ...allFonts];
				}
			} catch (error) {
				console.warn('Failed to load brand fonts:', error);
			}

			// Preload popular fonts for preview
			const popularFonts = allFonts.filter((f) => f.popular).slice(0, 20);
			preloadFonts(popularFonts);
		} catch (error) {
			console.error('Failed to fetch fonts:', error);
			// Use fallback fonts
			allFonts = [
				{ family: 'Roboto', category: 'sans-serif', weights: [400, 700], popular: true },
				{ family: 'Open Sans', category: 'sans-serif', weights: [400, 700], popular: true },
				{ family: 'Montserrat', category: 'sans-serif', weights: [400, 700, 900], popular: true },
				{ family: 'Poppins', category: 'sans-serif', weights: [400, 700], popular: true },
				{ family: 'Lato', category: 'sans-serif', weights: [400, 700], popular: true },
				{ family: 'Oswald', category: 'sans-serif', weights: [400, 700], popular: true },
				{ family: 'Playfair Display', category: 'serif', weights: [400, 700], popular: true },
				{ family: 'Merriweather', category: 'serif', weights: [400, 700], popular: true },
				{ family: 'Lobster', category: 'display', weights: [400], popular: true },
				{ family: 'Dancing Script', category: 'handwriting', weights: [400, 700], popular: true },
				{ family: 'Source Code Pro', category: 'monospace', weights: [400, 700], popular: true }
			];
			fontCategories = ['sans-serif', 'serif', 'display', 'handwriting', 'monospace'];
		} finally {
			fontsLoading = false;
		}
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

	// Debounce timer for property changes to prevent saving intermediate states
	let pendingTarget = null;

	function debouncedPropertyChange(target) {
		// Store target for potential cleanup execution
		pendingTarget = target;

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
			pendingTarget = null;
		}, 300);
	}

	onDestroy(() => {
		// Clean up font dropdown listeners
		if (typeof window !== 'undefined') {
			window.removeEventListener('click', handleFontDropdownClickOutside);
			window.removeEventListener('keydown', handleFontDropdownKeydown);
		}

		if (propertyChangeTimer) {
			clearTimeout(propertyChangeTimer);
			// If there's a pending change when panel closes, fire it immediately
			// This ensures we catch the last change before user navigates away or switches selection
			if ($editor && pendingTarget) {
				$editor.fire('object:modified', { target: pendingTarget });
			}
		}
	});

	async function addCustomFont() {
		if (!customFontUrl) return;

		addingFont = true;
		addFontError = '';

		try {
			let familyName = customFontUrl.trim();
			let fontUrl = null;

			// Check if input is a URL or just a font name
			if (customFontUrl.includes('fonts.google') || customFontUrl.startsWith('http')) {
				try {
					const url = new URL(customFontUrl);
					const familyParam = url.searchParams.get('family');

					if (!familyParam) {
						addFontError = 'Invalid Google Fonts URL: Could not find family parameter';
						return;
					}

					// Extract family name (handle weights and + signs)
					familyName = familyParam.split(':')[0].replace(/\+/g, ' ');
					fontUrl = customFontUrl;
				} catch (e) {
					addFontError = 'Invalid URL format';
					return;
				}
			}

			// Validate font with backend API
			const result = await addGoogleFont(familyName, fontUrl);

			if (result.success) {
				// Add to local fonts list
				const newFont = {
					family: result.font.family,
					category: result.font.category,
					weights: result.font.weights,
					popular: false,
					source: 'custom'
				};

				if (!allFonts.find((f) => f.family.toLowerCase() === newFont.family.toLowerCase())) {
					allFonts = [newFont, ...allFonts];
				}

				// Load the font
				const link = document.createElement('link');
				link.href =
					fontUrl ||
					`https://fonts.googleapis.com/css2?family=${familyName.replace(
						/ /g,
						'+'
					)}:wght@${result.font.weights.join(';')}&display=swap`;
				link.rel = 'stylesheet';
				document.head.appendChild(link);

				// Wait for font to load
				await loadFont(familyName);

				// Select it
				updateProperty('fontFamily', familyName);

				// Reset UI
				customFontUrl = '';
				showCustomFontInput = false;
				isFontDropdownOpen = false;
				fontSearchQuery = '';
				extendedSearchResults = [];
			}
		} catch (e) {
			console.error('Error adding custom font:', e);
			addFontError = e.message || 'Failed to add font. Please check the font name or URL.';
		} finally {
			addingFont = false;
		}
	}

	$: if ($selectedComponent) {
		updateLocalState();
	}

	function updateLocalState() {
		if (!$selectedComponent) return;

		const obj = $selectedComponent;
		// Normalize type - FabricJS uses PascalCase for some types
		// 'ActiveSelection' for multiple selections, 'Group' for groups
		const rawType = obj.type || '';
		const lowerType = rawType.toLowerCase();
		if (lowerType === 'activeselection') {
			type = 'activeSelection';
		} else if (lowerType === 'group') {
			type = 'group';
		} else {
			type = rawType;
		}

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
			fontWeight: obj.fontWeight || 'normal',
			charSpacing: obj.charSpacing || 0,
			width: Math.round(obj.getScaledWidth()) || 0,
			height: Math.round(obj.getScaledHeight()) || 0,
			radius: type === 'rect' ? obj.rx || 0 : obj.radius || 0,
			backgroundColor: obj.backgroundColor || ''
		};

		// Handle individual corners for rounded rects
		if (obj.isRoundedRect) {
			cornerRadii = obj.cornerRadii || { tl: 0, tr: 0, br: 0, bl: 0 };
			// If all corners are same, we can show the single slider too
			if (
				cornerRadii.tl === cornerRadii.tr &&
				cornerRadii.tr === cornerRadii.br &&
				cornerRadii.br === cornerRadii.bl
			) {
				styles.radius = cornerRadii.tl;
			} else {
				showIndividualCorners = true;
			}
		} else if (type === 'rect') {
			// Standard rect
			const r = obj.rx || 0;
			cornerRadii = { tl: r, tr: r, br: r, bl: r };
			showIndividualCorners = false;
		}

		if (type === 'i-text' || type === 'text') {
			content = obj.text;
			loadTextEffects();
		}

		// Load image filters and clip shape if it's an image
		if (type === 'image') {
			loadImageFilters();
			currentClipShape = getImageClipShape();

			// Only load clip settings when selecting a DIFFERENT image
			// This prevents slider values from resetting during updates
			const imgId = $selectedComponent.id || $selectedComponent.__uid || 'unknown';
			if (lastSelectedImageId !== imgId) {
				lastSelectedImageId = imgId;
				loadClipSettings();
				// Get corner radius if it's a rounded rect clip
				if ($selectedComponent.clipPath && $selectedComponent.clipPath.type === 'rect') {
					clipCornerRadius = $selectedComponent.clipPath.rx || 20;
				}
			}
		} else {
			lastSelectedImageId = null;
		}

		// Load chart/table state
		isChart = obj.isChart || false;
		isTable = obj.isTable || false;
		if (isChart) {
			chartType = obj.chartType || 'bar';
			chartData = obj.chartData || [];
			// Auto-populate chart data editor with current data
			chartDataError = '';
			loadSampleChartData();

			// Load chart appearance from config
			const cc = obj.chartConfig || {};
			chartFontFamily = (cc.fontFamily || 'Inter, system-ui, sans-serif').split(',')[0].trim();
			chartColors = cc.colors || [
				'#ff6b6b',
				'#4ecdc4',
				'#45b7d1',
				'#96ceb4',
				'#ffeaa7',
				'#dfe6e9',
				'#fd79a8',
				'#a29bfe',
				'#6c5ce7',
				'#00b894'
			];
			chartTitleColor = cc.titleColor || '#333333';
			chartLabelColor = cc.labelColor || '#666666';
			chartGridColor = cc.gridColor || '#eeeeee';
			chartBackgroundColor = cc.backgroundColor || '#ffffff';
			chartBorderColor = cc.borderColor || '#e5e5e5';
		}
		if (isTable) {
			tableType = obj.tableType || 'standard';
			tableStyle = obj.tableStyle || obj.tableConfig?.style || 'modern';

			// Load data based on table type
			if (tableType === 'stats') {
				tableData = {
					stats: obj.tableData || obj.tableConfig?.stats || []
				};
			} else if (tableType === 'comparison') {
				tableData = {
					features: obj.tableFeatures || obj.tableConfig?.features || [],
					plans: obj.tablePlans || obj.tableConfig?.plans || []
				};
			} else {
				tableData = {
					headers: obj.tableHeaders || obj.tableConfig?.headers || [],
					rows: obj.tableRows || obj.tableConfig?.rows || []
				};
			}

			// Auto-populate table data editor with current data
			tableDataError = '';
			loadSampleTableData();

			// Load table appearance from config
			const tc = obj.tableConfig || {};
			tableFontFamily = (tc.fontFamily || 'Inter, system-ui, sans-serif').split(',')[0].trim();
			const currentTableStyle = TABLE_STYLES[tableStyle] || TABLE_STYLES.modern;
			if (tc.customStyle) {
				tableCustomColors = { ...tc.customStyle };
			} else {
				tableCustomColors = null;
			}
		}

		// Load QR code state
		isQRCode = obj.isQRCode || false;
		if (isQRCode) {
			qrData = obj.qrData || '';
			qrConfig = obj.qrConfig || {
				contentType: 'url',
				fgColor: '#000000',
				bgColor: '#ffffff',
				errorCorrectionLevel: 'M',
				patternStyle: 'squares',
				cornerStyle: 'squares'
			};
		}

		// Load variable state
		loadVariableState();
	}

	function loadVariableState() {
		if (!$selectedComponent) return;

		isVariable = $selectedComponent.isVariable || false;

		// Load multi-binding state
		if ($selectedComponent.variableBindings && Array.isArray($selectedComponent.variableBindings)) {
			variableBindings = [...$selectedComponent.variableBindings];
		} else {
			variableBindings = [];
		}

		// Load conditional logic state
		// Check if property exists (even if empty string) vs doesn't exist (null/undefined)
		const hasShowWhen =
			$selectedComponent.showWhen !== null && $selectedComponent.showWhen !== undefined;
		const hasHideWhen =
			$selectedComponent.hideWhen !== null && $selectedComponent.hideWhen !== undefined;

		if (hasShowWhen) {
			conditionType = 'showWhen';
			conditionExpression = $selectedComponent.showWhen || '';
		} else if (hasHideWhen) {
			conditionType = 'hideWhen';
			conditionExpression = $selectedComponent.hideWhen || '';
		} else {
			conditionType = 'none';
			conditionExpression = '';
		}
		conditionValid = true;
		conditionError = '';

		// Load loop state
		// Check if loopVariable exists (even if empty string) vs doesn't exist
		const hasLoopVariable =
			$selectedComponent.loopVariable !== null && $selectedComponent.loopVariable !== undefined;
		isLoopElement = hasLoopVariable;
		loopVariable = $selectedComponent.loopVariable || '';
		loopItemName = $selectedComponent.loopItemName || 'item';
		loopIndexName = $selectedComponent.loopIndexName || 'index';
		loopDirection = $selectedComponent.loopDirection || 'vertical';
		loopSpacing = $selectedComponent.loopSpacing || 50;
		loopColumns = $selectedComponent.loopColumns || 3;
	}

	function getDefaultVariableProperty() {
		// Check for chart/table first (they're groups)
		if (isChart) return 'chartData';
		if (isTable) return 'tableData';

		switch (type) {
			case 'i-text':
			case 'text':
			case 'textbox':
				return 'text';
			case 'image':
				return 'src';
			default:
				return 'fill';
		}
	}

	function toggleVariable(enabled) {
		if (!$selectedComponent || !$editor) return;

		isVariable = enabled;
		$selectedComponent.set('isVariable', enabled);

		if (enabled) {
			// Ensure object has an ID (required for variable tracking)
			if (!$selectedComponent.id) {
				const uniqueId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
				$selectedComponent.set('id', uniqueId);
			}

			// Add initial binding if none exist
			if (variableBindings.length === 0) {
				let defaultName = '';
				const defaultProp = getDefaultVariableProperty();

				if (type === 'i-text' || type === 'text') {
					const text = $selectedComponent.text || '';
					defaultName =
						text
							.slice(0, 20)
							.replace(/[^a-zA-Z0-9]/g, '_')
							.toLowerCase() || 'text_content';
				} else if (defaultProp === 'fill') {
					defaultName = 'fill_color';
				} else if (defaultProp === 'stroke') {
					defaultName = 'stroke_color';
				} else if (defaultProp === 'src') {
					defaultName = 'image_url';
				} else if (defaultProp === 'opacity') {
					defaultName = 'opacity_value';
				} else if (defaultProp === 'chartData') {
					defaultName = 'chart_data';
				} else if (defaultProp === 'tableData') {
					defaultName = 'table_data';
				} else if (defaultProp === 'qrData') {
					defaultName = 'qr_content';
				} else {
					defaultName = `${type}_${defaultProp}`;
				}

				variableBindings = [
					{
						variableName: defaultName,
						property: defaultProp,
						description: '',
						required: false
					}
				];
			}

			// Save bindings to component
			saveVariableBindings();
		}

		$editor.renderAll();
		debouncedPropertyChange($selectedComponent);

		// Sync with centralized variables store
		variableActions.syncFromCanvas($editor);
	}

	// Save all variable bindings to the canvas object
	function saveVariableBindings() {
		if (!$selectedComponent || !$editor) return;

		$selectedComponent.set('variableBindings', [...variableBindings]);
		debouncedPropertyChange($selectedComponent);
		variableActions.syncFromCanvas($editor);
	}

	// Add a new variable binding
	function addVariableBinding() {
		if (!$selectedComponent || !$editor) return;

		const availableProps = getAvailablePropertiesForType();
		const usedProps = variableBindings.map((b) => b.property);
		const unusedProp =
			availableProps.find((p) => !usedProps.includes(p.value))?.value ||
			availableProps[0]?.value ||
			'text';

		// Generate a meaningful variable name based on the property
		let varName = '';
		if (unusedProp === 'fill') {
			varName = `fill_color_${variableBindings.length + 1}`;
		} else if (unusedProp === 'stroke') {
			varName = `stroke_color_${variableBindings.length + 1}`;
		} else if (unusedProp === 'text') {
			varName = `text_content_${variableBindings.length + 1}`;
		} else if (unusedProp === 'src') {
			varName = `image_url_${variableBindings.length + 1}`;
		} else if (unusedProp === 'opacity') {
			varName = `opacity_${variableBindings.length + 1}`;
		} else if (unusedProp === 'fontSize') {
			varName = `font_size_${variableBindings.length + 1}`;
		} else if (unusedProp === 'fontFamily') {
			varName = `font_family_${variableBindings.length + 1}`;
		} else if (unusedProp === 'fontWeight') {
			varName = `font_weight_${variableBindings.length + 1}`;
		} else if (unusedProp === 'strokeWidth') {
			varName = `stroke_width_${variableBindings.length + 1}`;
		} else {
			varName = `${unusedProp}_${variableBindings.length + 1}`;
		}

		const newBinding = {
			variableName: varName,
			property: unusedProp,
			description: '',
			required: false
		};

		variableBindings = [...variableBindings, newBinding];
		saveVariableBindings();
	}

	// Remove a variable binding by index
	function removeVariableBinding(index) {
		if (!$selectedComponent || !$editor) return;

		variableBindings = variableBindings.filter((_, i) => i !== index);

		// If no bindings left, disable variable mode
		if (variableBindings.length === 0) {
			isVariable = false;
			$selectedComponent.set('isVariable', false);
			$selectedComponent.set('variableBindings', []);
		} else {
			saveVariableBindings();
		}

		$editor.renderAll();
		debouncedPropertyChange($selectedComponent);
		variableActions.syncFromCanvas($editor);
	}

	// Update a specific binding
	function updateVariableBinding(index, field, value) {
		if (!$selectedComponent || !$editor) return;

		if (field === 'variableName') {
			const original = value;
			value = value.replace(/[^a-zA-Z0-9_]/g, '');
			showStrippedFeedback(original, value);
		}

		variableBindings = variableBindings.map((b, i) => (i === index ? { ...b, [field]: value } : b));

		if (field === 'variableName') {
			validateAllBindings();
		}

		saveVariableBindings();
	}

	// Get available properties based on element type
	function getAvailablePropertiesForType() {
		if (isChart) {
			return [{ value: 'chartData', label: 'Chart Data' }];
		}
		if (isTable) {
			return [{ value: 'tableData', label: 'Table Data' }];
		}

		switch (type) {
			case 'i-text':
			case 'text':
			case 'textbox':
				return [
					{ value: 'text', label: 'Text Content' },
					{ value: 'fill', label: 'Text Color' },
					{ value: 'fontFamily', label: 'Font Family' },
					{ value: 'fontSize', label: 'Font Size' },
					{ value: 'fontWeight', label: 'Font Weight' },
					{ value: 'opacity', label: 'Opacity' }
				];
			case 'image':
				return [
					{ value: 'src', label: 'Image URL' },
					{ value: 'opacity', label: 'Opacity' }
				];
			case 'rect':
			case 'circle':
			case 'triangle':
			case 'polygon':
			case 'path':
			case 'ellipse':
				return [
					{ value: 'fill', label: 'Fill Color' },
					{ value: 'stroke', label: 'Stroke Color' },
					{ value: 'strokeWidth', label: 'Stroke Width' },
					{ value: 'opacity', label: 'Opacity' }
				];
			default:
				return [
					{ value: 'fill', label: 'Fill Color' },
					{ value: 'opacity', label: 'Opacity' }
				];
		}
	}

	// Conditional logic update functions
	function updateConditionType(newType) {
		if (!$selectedComponent || !$editor) return;

		// Confirm when switching to 'none' and there's a configured expression
		if (newType === 'none' && conditionType !== 'none' && conditionExpression) {
			requestConfirmation('condition', () => _applyConditionType(newType));
			return;
		}
		_applyConditionType(newType);
	}

	function _applyConditionType(type) {
		conditionType = type;

		// Clear old condition properties
		$selectedComponent.set('showWhen', null);
		$selectedComponent.set('hideWhen', null);

		// Set new condition - use empty string as placeholder if no expression yet
		if (type === 'showWhen') {
			$selectedComponent.set('showWhen', conditionExpression || '');
		} else if (type === 'hideWhen') {
			$selectedComponent.set('hideWhen', conditionExpression || '');
		}

		$editor.renderAll();
		debouncedPropertyChange($selectedComponent);

		// Sync with centralized variables store
		variableActions.syncFromCanvas($editor);
	}

	function updateConditionExpression(expression) {
		if (!$selectedComponent || !$editor) return;

		conditionExpression = expression;

		// Basic syntax validation
		const validation = validateConditionSyntax(expression);
		conditionValid = validation.valid;
		conditionError = validation.error || '';

		if (conditionValid && conditionType !== 'none') {
			if (conditionType === 'showWhen') {
				$selectedComponent.set('showWhen', expression);
				$selectedComponent.set('hideWhen', null);
			} else if (conditionType === 'hideWhen') {
				$selectedComponent.set('hideWhen', expression);
				$selectedComponent.set('showWhen', null);
			}
			debouncedPropertyChange($selectedComponent);

			// Sync with centralized variables store
			variableActions.syncFromCanvas($editor);
		}
	}

	function validateConditionSyntax(expression) {
		if (!expression || !expression.trim()) {
			return { valid: true };
		}

		// Check for balanced parentheses
		let parenCount = 0;
		for (const char of expression) {
			if (char === '(') parenCount++;
			if (char === ')') parenCount--;
			if (parenCount < 0) {
				return { valid: false, error: 'Unmatched closing parenthesis' };
			}
		}
		if (parenCount !== 0) {
			return { valid: false, error: 'Unmatched opening parenthesis' };
		}

		// Check for common errors
		if (/[=!<>]=?$/.test(expression.trim())) {
			return { valid: false, error: 'Expression ends with incomplete comparison' };
		}

		return { valid: true };
	}

	// Loop update functions
	function toggleLoop(enabled) {
		if (!$selectedComponent || !$editor) return;

		// Confirm when disabling a configured loop
		if (!enabled && isLoopElement && loopVariable) {
			requestConfirmation('loop', () => _applyLoopToggle(false));
			return;
		}
		_applyLoopToggle(enabled);
	}

	function _applyLoopToggle(enabled) {
		if (!$selectedComponent || !$editor) return;

		isLoopElement = enabled;

		if (enabled) {
			$selectedComponent.set('loopVariable', loopVariable || '');
			$selectedComponent.set('loopItemName', loopItemName || 'item');
			$selectedComponent.set('loopIndexName', loopIndexName || 'index');
			$selectedComponent.set('loopDirection', loopDirection || 'vertical');
			$selectedComponent.set('loopSpacing', loopSpacing || 50);
			$selectedComponent.set('loopColumns', loopColumns || 3);
		} else {
			// Null on canvas but preserve local state for re-enable
			$selectedComponent.set('loopVariable', null);
			$selectedComponent.set('loopItemName', null);
			$selectedComponent.set('loopIndexName', null);
			$selectedComponent.set('loopDirection', null);
			$selectedComponent.set('loopSpacing', null);
			$selectedComponent.set('loopColumns', null);
		}

		$editor.renderAll();
		debouncedPropertyChange($selectedComponent);

		// Sync with centralized variables store
		variableActions.syncFromCanvas($editor);
	}

	function updateLoopVariable(variable) {
		if (!$selectedComponent || !$editor) return;

		loopVariable = variable;
		$selectedComponent.set('loopVariable', variable);
		debouncedPropertyChange($selectedComponent);

		// Sync with centralized variables store
		variableActions.syncFromCanvas($editor);
	}

	function updateLoopItemName(name) {
		if (!$selectedComponent || !$editor) return;

		loopItemName = name || 'item';
		$selectedComponent.set('loopItemName', loopItemName);
		debouncedPropertyChange($selectedComponent);
	}

	function updateLoopDirection(direction) {
		if (!$selectedComponent || !$editor) return;

		loopDirection = direction;
		$selectedComponent.set('loopDirection', direction);
		debouncedPropertyChange($selectedComponent);
	}

	function updateLoopSpacing(spacing) {
		if (!$selectedComponent || !$editor) return;

		loopSpacing = parseInt(spacing) || 50;
		$selectedComponent.set('loopSpacing', loopSpacing);
		debouncedPropertyChange($selectedComponent);
	}

	function updateLoopColumns(cols) {
		if (!$selectedComponent || !$editor) return;

		loopColumns = parseInt(cols) || 3;
		$selectedComponent.set('loopColumns', loopColumns);
		debouncedPropertyChange($selectedComponent);
	}

	function updateLoopGap(gap) {
		if (!$selectedComponent || !$editor) return;
		loopSpacing = parseInt(gap) || 0;
		$selectedComponent.set('loopSpacing', loopSpacing);
		debouncedPropertyChange($selectedComponent);
	}

	// --- Validation helpers ---

	function validateVariableName(name, index) {
		if (!name || !name.trim()) return 'Variable name is required';
		if (!/^[a-zA-Z_]/.test(name)) return 'Must start with a letter or underscore';
		if (!/^[a-zA-Z0-9_]+$/.test(name)) return 'Only letters, numbers, and underscores allowed';
		// Check duplicates across other bindings
		const isDuplicate = variableBindings.some((b, i) => i !== index && b.variableName === name);
		if (isDuplicate) return 'Duplicate variable name';
		return '';
	}

	function validateAllBindings() {
		const errors = {};
		variableBindings.forEach((b, i) => {
			const err = validateVariableName(b.variableName, i);
			if (err) errors[i] = err;
		});
		variableNameErrors = errors;
	}

	function validateLoopVariable(name) {
		if (!name || !name.trim()) {
			loopVariableError = 'Loop variable name is required';
			return;
		}
		if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
			loopVariableError = 'Only letters, numbers, and underscores allowed';
			return;
		}
		loopVariableError = '';
	}

	function showStrippedFeedback(original, sanitized) {
		if (original !== sanitized) {
			strippedCharsMessage = `"${original}" → "${sanitized}" (special characters removed)`;
			if (strippedCharsTimeout) clearTimeout(strippedCharsTimeout);
			strippedCharsTimeout = setTimeout(() => {
				strippedCharsMessage = '';
			}, 4000);
		}
	}

	function buildApiPreviewJson() {
		return variableBindings.reduce((acc, b) => {
			if (b.property === 'chartData') {
				acc[b.variableName || 'chart_data'] = [{ label: 'A', value: 10 }];
			} else if (b.property === 'tableData') {
				acc[b.variableName || 'table_data'] = { headers: ['...'], rows: [['...']] };
			} else if (b.property === 'src') {
				acc[b.variableName || 'image_url'] = 'https://...';
			} else if (b.property === 'fill' || b.property === 'stroke') {
				acc[b.variableName || 'color'] = '#ff0000';
			} else if (b.property === 'opacity') {
				acc[b.variableName || 'opacity'] = 0.8;
			} else if (b.property === 'fontSize' || b.property === 'strokeWidth') {
				acc[b.variableName || 'size'] = 24;
			} else {
				acc[b.variableName || 'variable'] = 'value';
			}
			return acc;
		}, {});
	}

	// --- Destructive action confirmation helpers ---

	function requestConfirmation(type, callback) {
		pendingDestructiveAction = { type, callback };
		// Scroll the confirmation into view after Svelte renders it
		setTimeout(() => {
			const modal = document.querySelector('[role="alertdialog"]');
			if (modal) modal.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}, 50);
	}

	function confirmDestructiveAction() {
		if (pendingDestructiveAction) {
			pendingDestructiveAction.callback();
			pendingDestructiveAction = null;
		}
	}

	function cancelDestructiveAction() {
		pendingDestructiveAction = null;
	}

	// Chart/Table update functions
	async function updateChartData(parsedData = null) {
		if (!$selectedComponent || !$editor || !isChart) return;

		try {
			let newData = parsedData;
			if (!newData) {
				newData = JSON.parse(chartDataInput);
				if (!Array.isArray(newData)) {
					console.error('Chart data must be an array');
					return;
				}
			}

			chartData = newData;

			// Dynamically import chart utilities
			const { updateChartData: updateChart } = await import('../../utils/fabric-chart');

			// Get position before update
			const position = {
				left: $selectedComponent.left,
				top: $selectedComponent.top,
				scaleX: $selectedComponent.scaleX,
				scaleY: $selectedComponent.scaleY,
				angle: $selectedComponent.angle
			};

			// Create new chart with updated data
			const newChart = updateChart($selectedComponent, newData);

			// Remove old chart and add new one
			$editor.remove($selectedComponent);
			$editor.add(newChart);
			$editor.setActiveObject(newChart);
			$editor.renderAll();
		} catch (error) {
			console.error('Failed to update chart data:', error);
			showToast('Failed to update chart data: ' + (error.message || 'Unknown error'), 'error');
		}
	}

	async function updateTableData(newHeaders, newRows) {
		if (!$selectedComponent || !$editor || !isTable) return;

		try {
			const { updateTableData: updateTable } = await import('../../utils/fabric-table');

			const newTableData = {};
			if (newHeaders) newTableData.headers = newHeaders;
			if (newRows) newTableData.rows = newRows;

			const newTable = updateTable($selectedComponent, newTableData);

			$editor.remove($selectedComponent);
			$editor.add(newTable);
			$editor.setActiveObject(newTable);
			$editor.renderAll();
		} catch (error) {
			console.error('Failed to update table data:', error);
			showToast('Failed to update table data: ' + (error.message || 'Unknown error'), 'error');
		}
	}

	// CSV parsing utilities
	function parseCSVToChartData(csvText) {
		const lines = csvText
			.trim()
			.split('\n')
			.filter((line) => line.trim());
		if (lines.length < 2) {
			throw new Error('CSV must have at least a header row and one data row');
		}

		const headers = lines[0].split(',').map((h) => h.trim());
		const labelIndex = headers.findIndex(
			(h) => h.toLowerCase() === 'label' || h.toLowerCase() === 'name'
		);
		const valueIndex = headers.findIndex(
			(h) => h.toLowerCase() === 'value' || h.toLowerCase() === 'amount'
		);

		if (labelIndex === -1 || valueIndex === -1) {
			throw new Error('CSV must have "label" and "value" columns');
		}

		const data = [];
		for (let i = 1; i < lines.length; i++) {
			const values = lines[i].split(',').map((v) => v.trim());
			if (values.length >= Math.max(labelIndex, valueIndex) + 1) {
				data.push({
					label: values[labelIndex],
					value: parseFloat(values[valueIndex]) || 0
				});
			}
		}

		return data;
	}

	// Universal CSV parser - same format for all table types
	function parseCSVToUniversalFormat(csvText) {
		const lines = csvText
			.trim()
			.split('\n')
			.filter((line) => line.trim());
		if (lines.length < 1) {
			throw new Error('CSV must have at least a header row');
		}

		const headers = lines[0].split(',').map((h) => h.trim());
		const rows = [];

		for (let i = 1; i < lines.length; i++) {
			const values = lines[i].split(',').map((v) => v.trim());
			rows.push(values);
		}

		return { headers, rows };
	}

	// Convert universal format to stats format for rendering
	function universalToStatsFormat(data) {
		// Expected headers: ["Label/Metric", "Value", "Change"] (Change is optional)
		const { headers, rows } = data;
		const labelIdx = 0;
		const valueIdx = 1;
		const changeIdx = headers.length > 2 ? 2 : -1;

		const stats = rows.map((row) => {
			const stat = {
				label: row[labelIdx] || '',
				value: row[valueIdx] || ''
			};
			if (changeIdx !== -1 && row[changeIdx]) {
				stat.change = row[changeIdx];
				stat.positive = !row[changeIdx].startsWith('-');
			}
			return stat;
		});

		return { stats };
	}

	// Convert universal format to comparison format for rendering
	function universalToComparisonFormat(data) {
		// Expected headers: ["Feature", "Plan1", "Plan2", "Plan3", ...]
		// First row should be prices: ["Price", "$9", "$29", "$99"]
		// Remaining rows are features
		const { headers, rows } = data;
		const planNames = headers.slice(1); // Skip "Feature" column

		// First row is prices
		const priceRow = rows[0] || [];
		const prices = priceRow.slice(1);

		// Remaining rows are features
		const features = [];
		const planValues = planNames.map(() => []);

		for (let i = 1; i < rows.length; i++) {
			const row = rows[i];
			features.push(row[0] || '');
			for (let j = 1; j < row.length && j <= planNames.length; j++) {
				planValues[j - 1].push(row[j] || '');
			}
		}

		const plans = planNames.map((name, idx) => ({
			name,
			price: prices[idx] || '',
			values: planValues[idx],
			highlighted: idx === 1 // Default: highlight the second plan
		}));

		return { features, plans };
	}

	// Convert any table type to universal CSV format
	function tableDataToCSV() {
		const universalData = tableDataToUniversalFormat();
		if (!universalData.headers || universalData.headers.length === 0) return '';

		const headerLine = universalData.headers.join(',');
		const rowLines = universalData.rows.map((row) => row.join(','));
		return [headerLine, ...rowLines].join('\n');
	}

	// Convert current tableData to universal format based on table type
	function tableDataToUniversalFormat() {
		if (tableType === 'stats') {
			if (!tableData.stats || tableData.stats.length === 0) {
				return { headers: ['Metric', 'Value', 'Change'], rows: [] };
			}
			const headers = ['Metric', 'Value', 'Change'];
			const rows = tableData.stats.map((stat) => [
				stat.label || '',
				stat.value || '',
				stat.change || ''
			]);
			return { headers, rows };
		} else if (tableType === 'comparison') {
			if (!tableData.features || !tableData.plans) {
				return { headers: ['Feature'], rows: [] };
			}
			const headers = ['Feature', ...tableData.plans.map((p) => p.name)];
			const priceRow = ['Price', ...tableData.plans.map((p) => p.price)];
			const featureRows = tableData.features.map((feature, idx) => {
				return [feature, ...tableData.plans.map((p) => p.values[idx] || '')];
			});
			return { headers, rows: [priceRow, ...featureRows] };
		} else {
			// Standard table - already in universal format
			return {
				headers: tableData.headers || [],
				rows: tableData.rows || []
			};
		}
	}

	function chartDataToCSV() {
		if (!chartData || chartData.length === 0) return '';

		const headerLine = 'label,value';
		const rowLines = chartData.map((item) => `${item.label},${item.value}`);
		return [headerLine, ...rowLines].join('\n');
	}

	function loadSampleChartData() {
		if (chartDataFormat === 'csv') {
			chartDataInput = chartDataToCSV() || 'label,value\nJan,30\nFeb,45\nMar,60\nApr,35\nMay,55';
		} else {
			chartDataInput = JSON.stringify(
				chartData.length > 0
					? chartData
					: [
							{ label: 'Jan', value: 30 },
							{ label: 'Feb', value: 45 },
							{ label: 'Mar', value: 60 },
							{ label: 'Apr', value: 35 },
							{ label: 'May', value: 55 }
					  ],
				null,
				2
			);
		}
		chartDataError = '';
	}

	function loadSampleTableData() {
		tableDataError = '';

		// Get current data in universal format, or use defaults
		let universalData = tableDataToUniversalFormat();

		// If empty, provide defaults based on table type
		if (!universalData.rows || universalData.rows.length === 0) {
			if (tableType === 'stats') {
				universalData = {
					headers: ['Metric', 'Value', 'Change'],
					rows: [
						['Total Revenue', '$45,231', '+12%'],
						['Active Users', '2,345', '+8%'],
						['Conversion', '3.2%', '-0.5%'],
						['Avg. Order', '$89', '+2%']
					]
				};
			} else if (tableType === 'comparison') {
				universalData = {
					headers: ['Feature', 'Basic', 'Pro', 'Enterprise'],
					rows: [
						['Price', '$9/mo', '$29/mo', '$99/mo'],
						['Storage', '10GB', '100GB', 'Unlimited'],
						['Users', '1', '5', '∞'],
						['Support', 'Email', '24/7', 'Dedicated']
					]
				};
			} else {
				universalData = {
					headers: ['Product', 'Price', 'Stock'],
					rows: [
						['Widget A', '$29.99', '150'],
						['Widget B', '$49.99', '89'],
						['Widget C', '$19.99', '234']
					]
				};
			}
		}

		if (tableDataFormat === 'csv') {
			const headerLine = universalData.headers.join(',');
			const rowLines = universalData.rows.map((row) => row.join(','));
			tableDataInput = [headerLine, ...rowLines].join('\n');
		} else {
			tableDataInput = JSON.stringify(universalData, null, 2);
		}
	}

	async function applyChartDataFromInput() {
		if (!$selectedComponent || !$editor || !isChart) return;

		chartDataError = '';
		let newData;

		try {
			if (chartDataFormat === 'csv') {
				newData = parseCSVToChartData(chartDataInput);
			} else {
				newData = JSON.parse(chartDataInput);
				if (!Array.isArray(newData)) {
					throw new Error('JSON must be an array');
				}
			}

			// Validate data structure
			const isValid = newData.every(
				(item) => typeof item === 'object' && 'label' in item && 'value' in item
			);
			if (!isValid) {
				throw new Error('Each item must have "label" and "value" properties');
			}

			// Update the chart with parsed data
			await updateChartData(newData);
		} catch (error) {
			chartDataError = error.message;
		}
	}

	async function applyTableDataFromInput() {
		if (!$selectedComponent || !$editor || !isTable) return;

		tableDataError = '';

		try {
			// Parse input to universal format (headers + rows)
			let universalData;

			if (tableDataFormat === 'csv') {
				universalData = parseCSVToUniversalFormat(tableDataInput);
			} else {
				universalData = JSON.parse(tableDataInput);
				if (typeof universalData !== 'object') {
					throw new Error('JSON must be an object');
				}
				if (!universalData.headers || !Array.isArray(universalData.headers)) {
					throw new Error('JSON must have a "headers" array');
				}
				if (!universalData.rows || !Array.isArray(universalData.rows)) {
					throw new Error('JSON must have a "rows" array');
				}
			}

			// Validate minimum data
			if (universalData.headers.length === 0) {
				throw new Error('Must have at least one column header');
			}
			if (universalData.rows.length === 0) {
				throw new Error('Must have at least one data row');
			}

			// Update the table with new data
			const { createTable, createStatsTable, createComparisonTable } = await import(
				'../../utils/fabric-table'
			);

			// Get position before update
			const position = {
				left: $selectedComponent.left,
				top: $selectedComponent.top,
				scaleX: $selectedComponent.scaleX,
				scaleY: $selectedComponent.scaleY,
				angle: $selectedComponent.angle
			};

			// Preserve variable properties
			const variableProps = {
				isVariable: $selectedComponent.isVariable,
				variableBindings: $selectedComponent.variableBindings || []
			};

			// Get current config
			const currentConfig = $selectedComponent.tableConfig || {};
			let newTable;

			if (tableType === 'stats') {
				// Convert universal format to stats format
				const statsData = universalToStatsFormat(universalData);
				const newConfig = {
					...currentConfig,
					stats: statsData.stats
				};
				newTable = createStatsTable(newConfig);
				tableData = { stats: statsData.stats };
			} else if (tableType === 'comparison') {
				// Convert universal format to comparison format
				const comparisonData = universalToComparisonFormat(universalData);
				const newConfig = {
					...currentConfig,
					features: comparisonData.features,
					plans: comparisonData.plans
				};
				newTable = createComparisonTable(newConfig);
				tableData = { features: comparisonData.features, plans: comparisonData.plans };
			} else {
				// Standard table - already in universal format
				const newConfig = {
					...currentConfig,
					style: tableStyle,
					headers: universalData.headers,
					rows: universalData.rows
				};
				newTable = createTable(newConfig);
				tableData = { headers: universalData.headers, rows: universalData.rows };
			}

			if (newTable) {
				newTable.set(position);
				newTable.set(variableProps);
				newTable.set('tableStyle', tableStyle);
				newTable.set('tableData', universalData); // Store universal format for API

				$editor.remove($selectedComponent);
				$editor.add(newTable);
				$editor.setActiveObject(newTable);
				$editor.renderAll();
			}
		} catch (error) {
			tableDataError = error.message;
		}
	}

	async function changeTableStyle(newStyle) {
		if (!$selectedComponent || !$editor || !isTable) return;

		try {
			const { createTable, createStatsTable, createComparisonTable } = await import(
				'../../utils/fabric-table'
			);

			// Get position before update
			const position = {
				left: $selectedComponent.left,
				top: $selectedComponent.top,
				scaleX: $selectedComponent.scaleX,
				scaleY: $selectedComponent.scaleY,
				angle: $selectedComponent.angle
			};

			// Preserve variable properties
			const variableProps = {
				isVariable: $selectedComponent.isVariable,
				variableBindings: $selectedComponent.variableBindings || []
			};

			// Get current table config and update style, removing custom overrides
			const currentConfig = $selectedComponent.tableConfig || {};
			const newConfig = {
				...currentConfig,
				style: newStyle,
				customStyle: null
			};

			let newTable;
			if (tableType === 'stats') {
				newConfig.stats = $selectedComponent.tableData || tableData.stats;
				newTable = createStatsTable(newConfig);
			} else if (tableType === 'comparison') {
				newConfig.features = $selectedComponent.tableFeatures || tableData.features;
				newConfig.plans = $selectedComponent.tablePlans || tableData.plans;
				newTable = createComparisonTable(newConfig);
			} else {
				newConfig.headers = $selectedComponent.tableHeaders || tableData.headers;
				newConfig.rows = $selectedComponent.tableRows || tableData.rows;
				newTable = createTable(newConfig);
			}

			if (newTable) {
				// Restore position
				newTable.set(position);

				// Restore variable properties
				newTable.set(variableProps);
				newTable.set('tableStyle', newStyle);

				// Remove old table and add new one
				$editor.remove($selectedComponent);
				$editor.add(newTable);
				$editor.setActiveObject(newTable);
				$editor.renderAll();

				tableStyle = newStyle;
				// Clear custom colors when switching presets
				tableCustomColors = null;
			}
		} catch (error) {
			console.error('Failed to change table style:', error);
			showToast('Failed to change table style', 'error');
		}
	}

	// Chart appearance update
	async function updateChartAppearance() {
		if (!$selectedComponent || !$editor || !isChart) return;

		try {
			const { createBarChart, createLineChart, createPieChart, createHorizontalBarChart } =
				await import('../../utils/fabric-chart');

			const position = {
				left: $selectedComponent.left,
				top: $selectedComponent.top,
				scaleX: $selectedComponent.scaleX,
				scaleY: $selectedComponent.scaleY,
				angle: $selectedComponent.angle
			};

			const variableProps = {
				isVariable: $selectedComponent.isVariable,
				variableBindings: $selectedComponent.variableBindings || []
			};

			const fontFamilyValue =
				chartFontFamily === 'system-ui'
					? 'system-ui, sans-serif'
					: `${chartFontFamily}, system-ui, sans-serif`;

			const currentConfig = $selectedComponent.chartConfig || {};
			const newConfig = {
				...currentConfig,
				colors: [...chartColors],
				titleColor: chartTitleColor,
				labelColor: chartLabelColor,
				gridColor: chartGridColor,
				backgroundColor: chartBackgroundColor,
				borderColor: chartBorderColor,
				fontFamily: fontFamilyValue
			};

			let newChart;
			switch (chartType) {
				case 'bar':
					newChart = createBarChart(newConfig);
					break;
				case 'line':
					newChart = createLineChart(newConfig);
					break;
				case 'pie':
					newChart = createPieChart(newConfig);
					break;
				case 'donut':
					newChart = createPieChart({ ...newConfig, donut: true });
					break;
				case 'horizontal-bar':
					newChart = createHorizontalBarChart(newConfig);
					break;
				default:
					return;
			}

			if (newChart) {
				newChart.set(position);
				newChart.set(variableProps);

				$editor.remove($selectedComponent);
				$editor.add(newChart);
				$editor.setActiveObject(newChart);
				$editor.renderAll();
			}
		} catch (error) {
			console.error('Failed to update chart appearance:', error);
			showToast('Failed to update chart appearance', 'error');
		}
	}

	// Table appearance update
	async function updateTableAppearance() {
		if (!$selectedComponent || !$editor || !isTable) return;

		try {
			const { createTable, createStatsTable, createComparisonTable } = await import(
				'../../utils/fabric-table'
			);

			const position = {
				left: $selectedComponent.left,
				top: $selectedComponent.top,
				scaleX: $selectedComponent.scaleX,
				scaleY: $selectedComponent.scaleY,
				angle: $selectedComponent.angle
			};

			const variableProps = {
				isVariable: $selectedComponent.isVariable,
				variableBindings: $selectedComponent.variableBindings || []
			};

			const fontFamilyValue =
				tableFontFamily === 'system-ui'
					? 'system-ui, sans-serif'
					: `${tableFontFamily}, system-ui, sans-serif`;

			const currentConfig = $selectedComponent.tableConfig || {};
			const newConfig = {
				...currentConfig,
				fontFamily: fontFamilyValue
			};

			// Apply custom colors if set
			if (tableCustomColors) {
				newConfig.customStyle = { ...tableCustomColors };
			}

			let newTable;
			if (tableType === 'stats') {
				newConfig.stats = $selectedComponent.tableData || tableData.stats;
				newTable = createStatsTable(newConfig);
			} else if (tableType === 'comparison') {
				newConfig.features = $selectedComponent.tableFeatures || tableData.features;
				newConfig.plans = $selectedComponent.tablePlans || tableData.plans;
				newTable = createComparisonTable(newConfig);
			} else {
				newConfig.headers = $selectedComponent.tableHeaders || tableData.headers;
				newConfig.rows = $selectedComponent.tableRows || tableData.rows;
				newTable = createTable(newConfig);
			}

			if (newTable) {
				newTable.set(position);
				newTable.set(variableProps);
				newTable.set('tableStyle', tableStyle);

				$editor.remove($selectedComponent);
				$editor.add(newTable);
				$editor.setActiveObject(newTable);
				$editor.renderAll();
			}
		} catch (error) {
			console.error('Failed to update table appearance:', error);
			showToast('Failed to update table appearance', 'error');
		}
	}

	// Reset table custom colors to current preset
	function resetTableToPreset() {
		tableCustomColors = null;
		tableFontFamily = 'Inter';
		updateTableAppearance();
	}

	// Initialize table custom colors from current style
	function initTableCustomColors() {
		const currentStyle = TABLE_STYLES[tableStyle] || TABLE_STYLES.modern;
		tableCustomColors = {
			headerBg: currentStyle.headerBg,
			headerText: currentStyle.headerText,
			rowBg: currentStyle.rowBg,
			altRowBg: currentStyle.altRowBg,
			borderColor: currentStyle.borderColor,
			textColor: currentStyle.textColor,
			headerFontWeight: currentStyle.headerFontWeight || 'bold',
			borderRadius: currentStyle.borderRadius ?? 8
		};
	}

	// QR Code update functions
	async function updateQRCodeContent(newContent) {
		if (!$selectedComponent || !$editor || !isQRCode) return;

		try {
			const formattedData = formatQRData(qrConfig.contentType || 'url', newContent);

			// Create updated QR code
			const newQR = await updateQRCode($selectedComponent, {
				data: formattedData,
				...qrConfig
			});

			// Replace on canvas
			$editor.remove($selectedComponent);
			$editor.add(newQR);
			$editor.setActiveObject(newQR);
			$editor.renderAll();

			qrData = formattedData;
			debouncedPropertyChange(newQR);
		} catch (error) {
			console.error('Failed to update QR code:', error);
			showToast('Failed to update QR code', 'error');
		}
	}

	async function updateQRCodeConfig(configKey, value) {
		if (!$selectedComponent || !$editor || !isQRCode) return;

		try {
			const newConfig = { ...qrConfig, [configKey]: value };

			// Create updated QR code
			const newQR = await updateQRCode($selectedComponent, {
				data: qrData,
				...newConfig
			});

			// Replace on canvas
			$editor.remove($selectedComponent);
			$editor.add(newQR);
			$editor.setActiveObject(newQR);
			$editor.renderAll();

			qrConfig = newConfig;
			debouncedPropertyChange(newQR);
		} catch (error) {
			console.error('Failed to update QR code config:', error);
			showToast('Failed to update QR code config', 'error');
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
			outline: {
				shadow: { enabled: false },
				stroke: { enabled: true, color: '#000000', width: 2 }
			},
			'outline-shadow': {
				shadow: { enabled: true, color: 'rgba(0, 0, 0, 0.5)', blur: 5, offsetX: 3, offsetY: 3 },
				stroke: { enabled: true, color: '#ffffff', width: 2 }
			},
			glow: {
				shadow: {
					enabled: true,
					color: 'rgba(255, 255, 255, 0.8)',
					blur: 20,
					offsetX: 0,
					offsetY: 0
				},
				stroke: { enabled: false }
			},
			neon: {
				shadow: {
					enabled: true,
					color: 'rgba(0, 255, 255, 0.9)',
					blur: 25,
					offsetX: 0,
					offsetY: 0
				},
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

	function addTextBackground() {
		if (!$selectedComponent || !$editor || (type !== 'i-text' && type !== 'text')) return;

		const textObj = $selectedComponent;
		const center = textObj.getCenterPoint();
		const textWidth = textObj.getScaledWidth();
		const textHeight = textObj.getScaledHeight();

		const padding = 20;
		const rectWidth = textWidth + padding * 2;
		const rectHeight = textHeight + padding * 1.5;

		const bgRect = new Rect({
			width: rectWidth,
			height: rectHeight,
			fill: '#ff6b6b', // Default color
			rx: 8,
			ry: 8,
			left: center.x,
			top: center.y,
			originX: 'center',
			originY: 'center',
			angle: textObj.angle
		});

		$editor.add(bgRect);
		$editor.sendObjectToBack(bgRect);

		// Select the rect so user can edit it immediately
		$editor.setActiveObject(bgRect);
		editorActions.selectComponent(bgRect);
		$editor.renderAll();

		// Notify user
		// alert('Background added! You can now edit its color and size.');
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
					{ offset: 0, color: 'rgba(255, 107, 107, 0.25)' }, // coral
					{ offset: 0.5, color: 'rgba(255, 196, 128, 0.2)' }, // orange
					{ offset: 1, color: 'rgba(255, 107, 107, 0.25)' } // coral
				]
			});

			const rect = new Rect({
				left: $selectedComponent.left,
				top: $selectedComponent.top,
				width: imgWidth,
				height: imgHeight,
				fill: gradient,
				stroke: '#ff6b6b',
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

			// Call backend API using the backend service (handles auth automatically via cookies)
			const result = await backend.post('/background-removal', {
				imageUrl: imageUrl,
				model: BACKGROUND_REMOVER_CONFIG.model,
				optimize: BACKGROUND_REMOVER_CONFIG.optimize
			});

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
				errorMsg += `${error.message || 'An unexpected error occurred.'}\n\nStatus Code: ${
					error.status || 'Unknown'
				}`;
			}

			showToast(errorMsg.replace(/\n+/g, ' ').trim(), 'error', 5000);
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

		existingFilters.forEach((filter) => {
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
			newFilters.push(
				new filters.Gamma({
					gamma: [imageFilters.gamma.r, imageFilters.gamma.g, imageFilters.gamma.b]
				})
			);
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
			newFilters.push(
				new filters.Gamma({
					gamma: [presetValues.gamma.r, presetValues.gamma.g, presetValues.gamma.b]
				})
			);
		}

		// Apply filters
		activeComponent.filters = newFilters;
		activeComponent.applyFilters();
		canvas.renderAll();
	}

	// Image Clipping Functions
	function getImageClipShape() {
		if (!$selectedComponent || type !== 'image') return 'none';

		const clipPath = $selectedComponent.clipPath;
		if (!clipPath) return 'none';

		// Detect shape type from clipPath
		if (clipPath.type === 'circle') return 'circle';
		if (clipPath.type === 'ellipse') return 'ellipse';
		if (clipPath.type === 'rect' && (clipPath.rx > 0 || clipPath.ry > 0)) return 'rounded-rect';
		if (clipPath.type === 'rect') return 'rectangle';

		return 'none';
	}

	function loadClipSettings() {
		if (!$selectedComponent || type !== 'image' || !$selectedComponent.clipPath) {
			clipSettings = { offsetX: 0, offsetY: 0, scale: 100 };
			return;
		}

		const clip = $selectedComponent.clipPath;
		const img = $selectedComponent;
		const imgWidth = img.width;
		const imgHeight = img.height;

		// Calculate scale first
		let scale = 100;
		if (clip.type === 'circle') {
			const baseRadius = Math.min(imgWidth, imgHeight) / 2;
			scale = Math.round((clip.radius / baseRadius) * 100);
		} else if (clip.type === 'ellipse') {
			scale = Math.round((clip.rx / (imgWidth / 2)) * 100);
		} else if (clip.type === 'rect') {
			scale = Math.round((clip.width / imgWidth) * 100);
		}

		// Calculate offset based on where the clip is vs where it should be if centered
		let offsetX = 0;
		let offsetY = 0;

		if (clip.type === 'circle') {
			// For circle, left/top is top-left of bounding box
			const expectedLeft = imgWidth / 2 - clip.radius;
			const expectedTop = imgHeight / 2 - clip.radius;
			offsetX = Math.round(((clip.left - expectedLeft) / imgWidth) * 100);
			offsetY = Math.round(((clip.top - expectedTop) / imgHeight) * 100);
		} else if (clip.type === 'ellipse') {
			const expectedLeft = imgWidth / 2 - clip.rx;
			const expectedTop = imgHeight / 2 - clip.ry;
			offsetX = Math.round(((clip.left - expectedLeft) / imgWidth) * 100);
			offsetY = Math.round(((clip.top - expectedTop) / imgHeight) * 100);
		} else if (clip.type === 'rect') {
			const expectedLeft = (imgWidth - clip.width) / 2;
			const expectedTop = (imgHeight - clip.height) / 2;
			offsetX = Math.round(((clip.left - expectedLeft) / imgWidth) * 100);
			offsetY = Math.round(((clip.top - expectedTop) / imgHeight) * 100);
		}

		clipSettings = { offsetX, offsetY, scale };
	}

	function applyClipShape(shape, preserveSettings = false) {
		if (!$selectedComponent || !$editor || type !== 'image') return;

		const img = $selectedComponent;
		const imgWidth = img.width;
		const imgHeight = img.height;

		currentClipShape = shape;

		// Reset settings when changing shape unless preserving
		if (!preserveSettings) {
			clipSettings = { offsetX: 0, offsetY: 0, scale: 100 };
		}

		let clipPath = null;

		// Calculate offset from center (in pixels)
		const offsetX = (clipSettings.offsetX / 100) * imgWidth;
		const offsetY = (clipSettings.offsetY / 100) * imgHeight;
		const scale = clipSettings.scale / 100;

		switch (shape) {
			case 'circle': {
				const baseRadius = Math.min(imgWidth, imgHeight) / 2;
				const radius = baseRadius * scale;
				// Position circle so its center is at image center + offset
				// For clipPath without origin, left/top is the top-left of bounding box
				clipPath = new Circle({
					radius: radius,
					left: imgWidth / 2 - radius + offsetX,
					top: imgHeight / 2 - radius + offsetY
				});
				break;
			}
			case 'ellipse': {
				const rx = (imgWidth / 2) * scale;
				const ry = (imgHeight / 2) * scale;
				// Position ellipse so its center is at image center + offset
				clipPath = new Ellipse({
					rx: rx,
					ry: ry,
					left: imgWidth / 2 - rx + offsetX,
					top: imgHeight / 2 - ry + offsetY
				});
				break;
			}
			case 'rounded-rect': {
				const width = imgWidth * scale;
				const height = imgHeight * scale;
				const radius = Math.min(clipCornerRadius, width / 2, height / 2);
				// Position rect so its center is at image center + offset
				clipPath = new Rect({
					width: width,
					height: height,
					rx: radius,
					ry: radius,
					left: (imgWidth - width) / 2 + offsetX,
					top: (imgHeight - height) / 2 + offsetY
				});
				break;
			}
			case 'none':
			default:
				clipPath = null;
				break;
		}

		img.set('clipPath', clipPath);
		img.setCoords();
		$editor.renderAll();

		// Fire modified event for history (debounced for slider changes)
		debouncedPropertyChange(img);
	}

	function updateClipCornerRadius(radius) {
		clipCornerRadius = radius;
		if (currentClipShape === 'rounded-rect') {
			applyClipShape('rounded-rect', true);
		}
	}

	function updateClipOffset(axis, value) {
		clipSettings[axis] = value;
		if (currentClipShape !== 'none') {
			applyClipShape(currentClipShape, true);
		}
	}

	function updateClipScale(value) {
		clipSettings.scale = value;
		if (currentClipShape !== 'none') {
			applyClipShape(currentClipShape, true);
		}
	}

	function resetClipPosition() {
		clipSettings = { offsetX: 0, offsetY: 0, scale: 100 };
		if (currentClipShape !== 'none') {
			applyClipShape(currentClipShape, true);
		}
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
		} else if (prop === 'radius' && type === 'rect') {
			$selectedComponent.set('rx', parseInt(value));
			$selectedComponent.set('ry', parseInt(value));
			// Update local corner radii state
			cornerRadii = {
				tl: parseInt(value),
				tr: parseInt(value),
				br: parseInt(value),
				bl: parseInt(value)
			};
		} else if (prop === 'cornerRadii') {
			// Handle individual corner update
			updateCornerRadii(value);
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

	/**
	 * Group selected elements together
	 * Creates a FabricJS Group that can have conditions applied
	 */
	function groupSelectedElements() {
		const group = editorActions.groupSelected($editor);
		if (group) {
			// Update local state to reflect the new group selection
			updateLocalState();
		}
	}

	/**
	 * Ungroup selected group back into individual elements
	 */
	function ungroupSelectedElements() {
		const success = editorActions.ungroupSelected($editor);
		if (success) {
			// Clear selection and update state
			updateLocalState();
		}
	}

	function getTargetDimensions(target) {
		if (!target) {
			return { width: 100, height: 100 };
		}

		const width =
			typeof target.getScaledWidth === 'function' ? target.getScaledWidth() : target.width || 100;
		const height =
			typeof target.getScaledHeight === 'function'
				? target.getScaledHeight()
				: target.height || 100;

		return {
			width: Math.max(1, width),
			height: Math.max(1, height)
		};
	}

	function buildGradientFromStops(
		stops,
		target,
		fallbackWidth = 100,
		fallbackHeight = 100,
		angle = 90
	) {
		const dims = target
			? getTargetDimensions(target)
			: { width: fallbackWidth, height: fallbackHeight };

		// Convert angle to radians and calculate gradient coordinates
		// 0° = top to bottom, 90° = left to right, 180° = bottom to top, 270° = right to left
		const angleRad = ((angle - 90) * Math.PI) / 180;
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
		const gradient = buildGradientFromStops(
			stops,
			null,
			canvas.width || 100,
			canvas.height || 100,
			angle
		);
		canvas.backgroundColor = gradient;
		canvas.renderAll();
	}

	function updateCornerRadii(newRadii) {
		if (!$selectedComponent || !$editor) return;

		const obj = $selectedComponent;
		const width = obj.getScaledWidth();
		const height = obj.getScaledHeight();

		// If it's a standard rect, convert to path
		if (obj.type === 'rect') {
			const pathData = getRoundedRectPath(width, height, newRadii);

			const newPath = new Path(pathData, {
				left: obj.left,
				top: obj.top,
				fill: obj.fill,
				stroke: obj.stroke,
				strokeWidth: obj.strokeWidth,
				scaleX: 1, // Path is already scaled by generation
				scaleY: 1,
				angle: obj.angle,
				originX: obj.originX,
				originY: obj.originY,
				opacity: obj.opacity,
				flipX: obj.flipX,
				flipY: obj.flipY,
				shadow: obj.shadow,
				visible: obj.visible,
				evented: obj.evented,
				selectable: obj.selectable
			});

			// Custom properties
			newPath.set({
				isRoundedRect: true,
				cornerRadii: newRadii,
				id: obj.id // Preserve ID if exists
			});

			// Replace object
			const index = $editor.getObjects().indexOf(obj);
			$editor.insertAt(newPath, index);
			$editor.remove(obj);
			$editor.setActiveObject(newPath);
			editorActions.selectComponent(newPath);
		} else if (obj.isRoundedRect) {
			// It's already a path, just update it
			// Note: Updating path data on existing object is tricky in Fabric.
			// Easier to replace it to ensure bounding box and controls are correct.

			const pathData = getRoundedRectPath(width, height, newRadii);

			// We need to preserve the current transform (position, rotation, etc)
			// The path generation assumes 0,0 origin for path points, but the object might be centered.
			// Fabric paths are usually centered on their bounding box.

			const newPath = new Path(pathData, {
				left: obj.left,
				top: obj.top,
				fill: obj.fill,
				stroke: obj.stroke,
				strokeWidth: obj.strokeWidth,
				scaleX: 1, // Reset scale as path is regenerated at current size
				scaleY: 1,
				angle: obj.angle,
				originX: obj.originX,
				originY: obj.originY,
				opacity: obj.opacity,
				flipX: obj.flipX,
				flipY: obj.flipY,
				shadow: obj.shadow,
				visible: obj.visible,
				evented: obj.evented,
				selectable: obj.selectable
			});

			newPath.set({
				isRoundedRect: true,
				cornerRadii: newRadii,
				id: obj.id
			});

			const index = $editor.getObjects().indexOf(obj);
			$editor.insertAt(newPath, index);
			$editor.remove(obj);
			$editor.setActiveObject(newPath);
			editorActions.selectComponent(newPath);
		}

		$editor.renderAll();
		updateLocalState();
	}
</script>

<div class="w-full bg-[#FFFDF8] h-full flex flex-col z-10">
	<div class="px-5 py-4 border-b-[3px] border-gray-900 flex-shrink-0 bg-[#FFFDF8]">
		<div class="flex items-center justify-between">
			<h3 class="font-black text-sm text-gray-900 uppercase tracking-widest">Properties</h3>
		</div>
	</div>

	<!-- Design/Logic Toggle -->
	{#if $selectedComponent}
		<div class="flex-shrink-0 mx-4 mt-3">
			<PanelTabs
				tabs={[
					{ id: 'design', label: 'Design', icon: 'fa fa-palette' },
					{ id: 'logic', label: 'Logic', icon: 'fa fa-code', badge: hasLogicConfigured }
				]}
				activeTab={panelMode}
				on:change={(e) => (panelMode = e.detail)}
			/>
		</div>
	{/if}
	<div class="px-4 py-4 flex-1 overflow-y-auto custom-scrollbar space-y-4 bg-[#FFFDF8]">
		{#if $selectedComponent}
			<!-- Element Type Badge -->
			<div class="flex items-center gap-2 pb-3 border-b border-gray-200">
				<span
					class="px-2 py-0.5 bg-white text-gray-900 text-[11px] font-black rounded-lg uppercase tracking-wide border-[2px] border-gray-900 shadow-[2px_2px_0_0_#e5e5e5]"
				>
					{type}
				</span>
			</div>

			<!-- DESIGN MODE -->
			{#if panelMode === 'design'}
				{#if type === 'i-text' || type === 'text'}
					<!-- CONTENT SECTION -->
					<div class="space-y-3">
						{#if boundProperties.has('text')}<span class="text-[9px] text-green-500"
								><i class="fa fa-link" /> Text bound to API variable</span
							>{/if}
						<textarea
							class={inputNumberClass}
							rows="2"
							placeholder="Enter your text..."
							value={content}
							on:input={(e) => updateContent(e.target.value)}
						/>
					</div>

					<!-- TYPOGRAPHY SECTION -->
					<div class="space-y-3 pt-4 border-t border-gray-200">
						<!-- Font Family -->
						<div class="relative" bind:this={fontDropdownRef}>
							<label class={fieldLabelClass}
								>Font Family{#if boundProperties.has('fontFamily')}<i
										class="fa fa-link text-[9px] text-green-500 ml-1"
										title="Bound to API variable"
									/>{/if}</label
							>
							<button
								class="w-full text-sm border-[2px] border-gray-900 rounded-lg px-3 py-1.5 text-left bg-white flex items-center justify-between shadow-[2px_2px_0_0_#e5e5e5] focus:border-gray-900 focus:shadow-[2px_2px_0_0_#ffc480] focus:ring-0 focus:outline-none hover:shadow-[2px_2px_0_0_#ffc480] transition-all"
								on:click|stopPropagation={() => (isFontDropdownOpen = !isFontDropdownOpen)}
							>
								<span style="font-family: {styles.fontFamily}">{styles.fontFamily}</span>
								<i class="fa fa-chevron-down text-xs text-gray-400" />
							</button>

							{#if isFontDropdownOpen}
								<div
									class="absolute z-[100] w-full mt-1 bg-white border-[2px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_#1f2937] max-h-[400px] flex flex-col"
								>
									<!-- Search & Custom Font -->
									<div class="p-3 border-b border-gray-100 sticky top-0 bg-white z-10">
										{#if showCustomFontInput}
											<div>
												<p class="text-xs text-gray-500 mb-2">
													Paste a Google Fonts URL or enter a font name:
												</p>
												<input
													type="text"
													placeholder="e.g., Crimson Text or fonts.google.com URL"
													class="{inputBaseClass} mb-2"
													bind:value={customFontUrl}
												/>
												{#if addFontError}
													<p class="text-xs text-red-500 mb-2">{addFontError}</p>
												{/if}
												<div class="flex gap-2">
													<button
														class="flex-1 bg-gray-900 text-white text-sm py-1.5 border-[2px] border-gray-900 rounded-lg hover:bg-black font-medium disabled:opacity-50"
														on:click={addCustomFont}
														disabled={addingFont}
													>
														{#if addingFont}
															<i class="fa fa-spinner fa-spin mr-1" />
														{/if}
														Add Font
													</button>
													<button
														class="flex-1 bg-white text-gray-700 text-sm py-1.5 border-[2px] border-gray-900 rounded-lg shadow-[2px_2px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 font-medium transition-all"
														on:click={() => {
															showCustomFontInput = false;
															addFontError = '';
														}}
													>
														Cancel
													</button>
												</div>
											</div>
										{:else}
											<div class="flex gap-2 mb-2">
												<div class="relative flex-1">
													<i
														class="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
													/>
													<input
														type="text"
														placeholder="Search any Google Font..."
														class="w-full text-sm border-[2px] border-gray-900 rounded-lg pl-8 pr-8 py-1.5 shadow-[2px_2px_0_0_#e5e5e5] focus:outline-none focus:ring-0 focus:border-gray-900 focus:shadow-[2px_2px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#ffc480] transition-all"
														value={fontSearchQuery}
														on:input={(e) => handleFontSearch(e.target.value)}
													/>
													{#if isSearchingGoogle}
														<i
															class="fa fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
														/>
													{/if}
												</div>
												<button
													class="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
													on:click={() => (showCustomFontInput = true)}
													title="Add font by URL"
												>
													<i class="fa fa-link" />
												</button>
											</div>

											<!-- Category Pills -->
											<div class="flex flex-wrap gap-1">
												<button
													class="px-2 py-0.5 text-xs rounded-md transition-all {selectedCategory ===
													'all'
														? 'bg-black text-white border-[2px] border-gray-900 shadow-[1px_1px_0_0_#000]'
														: 'bg-white text-gray-600 border-[2px] border-gray-900 shadow-[1px_1px_0_0_#000] hover:shadow-[1px_1px_0_0_#ffc480]'}"
													on:click={() => (selectedCategory = 'all')}
												>
													All
												</button>
												{#each fontCategories as category}
													<button
														class="px-2 py-0.5 text-xs rounded-md transition-all {selectedCategory ===
														category
															? 'bg-black text-white border-[2px] border-gray-900 shadow-[1px_1px_0_0_#000]'
															: 'bg-white text-gray-600 border-[2px] border-gray-900 shadow-[1px_1px_0_0_#000] hover:shadow-[1px_1px_0_0_#ffc480]'}"
														on:click={() => (selectedCategory = category)}
													>
														{CATEGORY_LABELS[category] || category}
													</button>
												{/each}
											</div>

											<!-- Search hint -->
											{#if fontSearchQuery.length > 0 && fontSearchQuery.length < 3}
												<p class="text-[10px] text-gray-500 mt-2">
													Type 3+ characters to search all Google Fonts
												</p>
											{/if}
										{/if}
									</div>

									<!-- Font List -->
									<div class="overflow-y-auto flex-1">
										{#if fontsLoading}
											<div class="p-4 text-center text-gray-500 text-sm">
												<i class="fa fa-spinner fa-spin mr-2" /> Loading fonts...
											</div>
										{:else if filteredFonts.length === 0 && !isSearchingGoogle}
											<div class="p-4 text-center text-gray-500 text-sm">
												<p>No fonts found</p>
												{#if fontSearchQuery.length >= 2}
													<button
														class="mt-2 text-xs text-blue-600 hover:text-blue-800"
														on:click={() => (showCustomFontInput = true)}
													>
														Try adding "{fontSearchQuery}" manually
													</button>
												{/if}
											</div>
										{:else if filteredFonts.length === 0 && isSearchingGoogle}
											<div class="p-4 text-center text-gray-500 text-sm">
												<i class="fa fa-spinner fa-spin mr-2" /> Searching Google Fonts...
											</div>
										{:else}
											<!-- Show Google Fonts section header if we have extended results -->
											{#if extendedSearchResults.length > 0 && fontSearchQuery.length >= 3}
												{@const localFonts = filteredFonts.filter((f) => f.source !== 'google')}
												{@const googleFonts = filteredFonts.filter((f) => f.source === 'google')}

												{#if localFonts.length > 0}
													<div
														class="px-4 py-1.5 bg-gray-50 text-[10px] font-medium text-gray-500 uppercase tracking-wider sticky top-0"
													>
														Available Fonts ({localFonts.length})
													</div>
													{#each localFonts as font}
														<button
															class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between group"
															on:click={() => {
																const link = document.createElement('link');
																link.href = `https://fonts.googleapis.com/css2?family=${font.family.replace(
																	/ /g,
																	'+'
																)}:wght@${font.weights?.join(';') || '400;700'}&display=swap`;
																link.rel = 'stylesheet';
																document.head.appendChild(link);

																updateProperty('fontFamily', font.family);
																isFontDropdownOpen = false;
																fontSearchQuery = '';
																selectedCategory = 'all';
																extendedSearchResults = [];
															}}
														>
															<div class="flex items-center gap-2 min-w-0 flex-1">
																<span
																	style="font-family: '{font.family}', sans-serif"
																	class="truncate">{font.family}</span
																>
																{#if font.popular}
																	<span
																		class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0"
																		>Popular</span
																	>
																{/if}
															</div>
															<div class="flex items-center gap-2 flex-shrink-0">
																{#if styles.fontFamily === font.family}
																	<i class="fa fa-check text-black text-xs" />
																{/if}
															</div>
														</button>
													{/each}
												{/if}

												{#if googleFonts.length > 0}
													<div
														class="px-4 py-1.5 bg-blue-50 text-[10px] font-medium text-blue-600 uppercase tracking-wider sticky top-0 flex items-center gap-1"
													>
														<i class="fab fa-google text-[8px]" />
														From Google Fonts ({googleFonts.length})
													</div>
													{#each googleFonts as font}
														<button
															class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex items-center justify-between group border-l-2 border-transparent hover:border-blue-400"
															on:click={() => handleAddFont(font)}
															disabled={addingFont}
														>
															<div class="flex items-center gap-2 min-w-0 flex-1">
																<span class="truncate">{font.family}</span>
																<span
																	class="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full flex-shrink-0"
																>
																	{font.category}
																</span>
															</div>
															<span
																class="text-[10px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
															>
																<i class="fa fa-plus mr-1" />Add
															</span>
														</button>
													{/each}
												{/if}
											{:else}
												<!-- Normal list when no extended search -->
												{#each filteredFonts as font}
													<button
														class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between group"
														on:click={() => {
															const link = document.createElement('link');
															link.href = `https://fonts.googleapis.com/css2?family=${font.family.replace(
																/ /g,
																'+'
															)}:wght@${font.weights?.join(';') || '400;700'}&display=swap`;
															link.rel = 'stylesheet';
															document.head.appendChild(link);

															updateProperty('fontFamily', font.family);
															isFontDropdownOpen = false;
															fontSearchQuery = '';
															selectedCategory = 'all';
															extendedSearchResults = [];
														}}
													>
														<div class="flex items-center gap-2 min-w-0 flex-1">
															<span
																style="font-family: '{font.family}', sans-serif"
																class="truncate">{font.family}</span
															>
															{#if font.popular}
																<span
																	class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0"
																	>Popular</span
																>
															{/if}
														</div>
														<div class="flex items-center gap-2 flex-shrink-0">
															<span
																class="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
															>
																{CATEGORY_LABELS[font.category] || font.category}
															</span>
															{#if styles.fontFamily === font.family}
																<i class="fa fa-check text-black text-xs" />
															{/if}
														</div>
													</button>
												{/each}
											{/if}
										{/if}
									</div>

									<!-- Footer -->
									<div
										class="px-3 py-2 border-t border-gray-200 bg-gray-50 text-[10px] text-gray-500 flex items-center justify-between"
									>
										<span>
											{filteredFonts.length} of {allFonts.length} fonts
											{#if extendedSearchResults.length > 0}
												<span class="text-blue-500"
													>+ {extendedSearchResults.length} from Google</span
												>
											{/if}
										</span>
										{#if isSearchingGoogle}
											<span class="text-blue-500">
												<i class="fa fa-spinner fa-spin mr-1" />
												Searching...
											</span>
										{/if}
									</div>
								</div>

								<!-- Backdrop to close dropdown -->
								<div
									class="fixed inset-0 z-40 bg-transparent"
									on:click={() => {
										isFontDropdownOpen = false;
										showCustomFontInput = false;
										fontSearchQuery = '';
										selectedCategory = 'all';
										extendedSearchResults = [];
										addFontError = '';
									}}
								/>
							{/if}
						</div>

						<!-- Size & Weight Row -->
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class={fieldLabelClass}
									>Size{#if boundProperties.has('fontSize')}<i
											class="fa fa-link text-[9px] text-green-500 ml-1"
											title="Bound to API variable"
										/>{/if}</label
								>
								<div class="relative">
									<input
										type="number"
										class={inputNumberClass + ' pr-8'}
										value={styles.fontSize}
										min="1"
										max="500"
										on:input={(e) =>
											updateProperty('fontSize', clampNumber(e.target.value, 1, 500, 16))}
									/>
									<span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500"
										>px</span
									>
								</div>
							</div>
							<div>
								<label class={fieldLabelClass}>Spacing</label>
								<input
									type="number"
									class={inputNumberClass}
									value={styles.charSpacing}
									step="10"
									on:input={(e) => updateProperty('charSpacing', parseInt(e.target.value))}
								/>
							</div>
						</div>

						<!-- Font Weight -->
						<div class="relative">
							<label class={fieldLabelClass}
								>Weight{#if boundProperties.has('fontWeight')}<i
										class="fa fa-link text-[9px] text-green-500 ml-1"
										title="Bound to API variable"
									/>{/if}</label
							>
							<button
								class={buttonBaseClass + ' text-left flex items-center justify-between'}
								on:click={() => (isWeightDropdownOpen = !isWeightDropdownOpen)}
							>
								<span
									style="font-weight: {styles.fontWeight === 'normal'
										? 400
										: styles.fontWeight === 'bold'
										? 700
										: styles.fontWeight}"
								>
									{fontWeights.find((w) => w.value == styles.fontWeight)?.label ||
										styles.fontWeight}
								</span>
								<i class="fa fa-chevron-down text-xs text-gray-400" />
							</button>

							{#if isWeightDropdownOpen}
								<div
									class="absolute z-[100] w-full mt-1 bg-white border-[2px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_#1f2937] max-h-60 overflow-y-auto"
								>
									{#each fontWeights as weight}
										<button
											class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
											on:click={() => {
												updateProperty('fontWeight', weight.value);
												isWeightDropdownOpen = false;
											}}
										>
											<span
												style="font-weight: {weight.value === 'normal'
													? 400
													: weight.value === 'bold'
													? 700
													: weight.value}">{weight.label}</span
											>
											{#if styles.fontWeight == weight.value}
												<i class="fa fa-check text-black text-xs" />
											{/if}
										</button>
									{/each}
								</div>

								<!-- Backdrop -->
								<div
									class="fixed inset-0 z-40 bg-transparent"
									on:click={() => (isWeightDropdownOpen = false)}
								/>
							{/if}
						</div>
					</div>

					<!-- COLOR SECTION -->
					<div class="space-y-3 pt-4 border-t border-gray-200">
						{#if boundProperties.has('fill')}<span class="text-[9px] text-green-500 mb-[-4px] block"
								><i class="fa fa-link" /> Bound to API variable</span
							>{/if}
						<GradientColorPicker
							label="Text Color"
							value={styles.fill}
							defaultColor={DEFAULT_FILL}
							onSolidChange={(color) => updateProperty('fill', color)}
							onGradientChange={applyGradientToSelection}
						/>
					</div>

					<!-- EFFECTS SECTION -->
					<CollapsibleSection title="Effects" bind:open={showTextEffectsPanel}>
							<div class="space-y-4 pt-2">
								<!-- Quick Presets -->
								<div>
									<label class={fieldLabelClass}>Presets</label>
									<div class="grid grid-cols-4 gap-1.5">
										<button
											class="px-2 py-1.5 text-[10px] bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyTextEffectPreset('none')}
											title="None"
										>
											None
										</button>
										<button
											class="px-2 py-1.5 text-[10px] bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyTextEffectPreset('soft-shadow')}
											title="Soft Shadow"
										>
											Soft
										</button>
										<button
											class="px-2 py-1.5 text-[10px] bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyTextEffectPreset('hard-shadow')}
											title="Hard Shadow"
										>
											Hard
										</button>
										<button
											class="px-2 py-1.5 text-[10px] bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyTextEffectPreset('outline')}
											title="Outline"
										>
											Outline
										</button>
										<button
											class="px-2 py-1.5 text-[10px] bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyTextEffectPreset('glow')}
											title="Glow"
										>
											Glow
										</button>
										<button
											class="px-2 py-1.5 text-[10px] bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyTextEffectPreset('neon')}
											title="Neon"
										>
											Neon
										</button>
										<button
											class="px-2 py-1.5 text-[10px] bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium col-span-2"
											on:click={() => applyTextEffectPreset('bold-outline')}
											title="Bold Outline"
										>
											Bold Outline
										</button>
									</div>
								</div>

								<!-- Shadow Controls -->
								<div class="pt-3 border-t border-gray-200">
									<div class="flex items-center justify-between mb-3">
										<label class="{fieldLabelClass} mb-0">Shadow</label>
										<label class="relative inline-flex items-center cursor-pointer">
											<input
												type="checkbox"
												class="sr-only peer"
												checked={textEffects.shadow.enabled}
												on:change={(e) => applyTextShadow('enabled', e.target.checked)}
											/>
											<div class={toggleSwitchClass} />
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
													<label class="{fieldLabelClass} mb-0">Blur</label>
													<span class="text-xs text-gray-500">{textEffects.shadow.blur}px</span>
												</div>
												<input
													type="range"
													min="0"
													max="30"
													step="1"
													value={textEffects.shadow.blur}
													class={rangeInputClass}
													on:input={(e) => applyTextShadow('blur', parseInt(e.target.value))}
												/>
											</div>

											<!-- Shadow Offset X -->
											<div>
												<div class="flex items-center justify-between mb-2">
													<label class="{fieldLabelClass} mb-0">Horizontal Offset</label>
													<span class="text-xs text-gray-500">{textEffects.shadow.offsetX}px</span>
												</div>
												<input
													type="range"
													min="-30"
													max="30"
													step="1"
													value={textEffects.shadow.offsetX}
													class={rangeInputClass}
													on:input={(e) => applyTextShadow('offsetX', parseInt(e.target.value))}
												/>
											</div>

											<!-- Shadow Offset Y -->
											<div>
												<div class="flex items-center justify-between mb-2">
													<label class="{fieldLabelClass} mb-0">Vertical Offset</label>
													<span class="text-xs text-gray-500">{textEffects.shadow.offsetY}px</span>
												</div>
												<input
													type="range"
													min="-30"
													max="30"
													step="1"
													value={textEffects.shadow.offsetY}
													class={rangeInputClass}
													on:input={(e) => applyTextShadow('offsetY', parseInt(e.target.value))}
												/>
											</div>
										</div>
									{/if}
								</div>

								<!-- Stroke Controls -->
								<div class="pt-3 border-t border-gray-200">
									<div class="flex items-center justify-between mb-3">
										<label class="{fieldLabelClass} mb-0">Stroke (Outline)</label>
										<label class="relative inline-flex items-center cursor-pointer">
											<input
												type="checkbox"
												class="sr-only peer"
												checked={textEffects.stroke.enabled}
												on:change={(e) => applyTextStroke('enabled', e.target.checked)}
											/>
											<div class={toggleSwitchClass} />
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
													<label class="{fieldLabelClass} mb-0">Width</label>
													<span class="text-xs text-gray-500">{textEffects.stroke.width}px</span>
												</div>
												<input
													type="range"
													min="1"
													max="20"
													step="0.5"
													value={textEffects.stroke.width}
													class={rangeInputClass}
													on:input={(e) => applyTextStroke('width', parseFloat(e.target.value))}
												/>
											</div>
										</div>
									{/if}
								</div>

								<!-- Background Button -->
								<div class="pt-3 border-t border-gray-200">
									<button
										class="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors font-medium text-xs flex items-center justify-center gap-2"
										on:click={addTextBackground}
									>
										<i class="fa fa-plus-square" />
										Add Background Shape
									</button>
								</div>
							</div>
					</CollapsibleSection>
				{/if}

				<!-- Universal Stroke & Fill Controls for All Shapes -->
				{#if type === 'rect' || type === 'circle' || type === 'triangle' || type === 'polygon' || type === 'path'}
					<CollapsibleSection title="Appearance" bind:open={showAppearanceSection}>
							<div class="space-y-4">
								<!-- Fill Color -->
								{#if boundProperties.has('fill')}<span
										class="text-[9px] text-green-500 mb-[-4px] block"
										><i class="fa fa-link" /> Bound to API variable</span
									>{/if}
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
											<div class={toggleSwitchClass} />
										</label>
									</div>
								{/if}

								<!-- Stroke Color -->
								{#if boundProperties.has('stroke')}<span
										class="text-[9px] text-green-500 mb-[-4px] block"
										><i class="fa fa-link" /> Bound to API variable</span
									>{/if}
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
										<label class={fieldLabelClass}
											>Stroke Width{#if boundProperties.has('strokeWidth')}<i
													class="fa fa-link text-[9px] text-green-500 ml-1"
													title="Bound to API variable"
												/>{/if}</label
										>
										<span class="text-xs text-gray-500">{styles.strokeWidth}px</span>
									</div>
									<input
										type="range"
										min="0"
										max="20"
										step="0.5"
										value={styles.strokeWidth}
										class={rangeInputClass}
										on:input={(e) => updateProperty('strokeWidth', parseFloat(e.target.value))}
									/>
								</div>
							</div>
					</CollapsibleSection>
				{/if}

				<!-- Keep old type-specific sections for backward compatibility -->
				{#if type === 'path'}
					<!-- Path-specific controls removed, now using universal controls above -->
				{/if}

				<!-- Position & Size Section (collapsible) -->
				<CollapsibleSection title="Size & Position" bind:open={showPositionSection}>
						<div class="mt-0">
							<div class="grid grid-cols-2 gap-2">
								<div>
									<label class={fieldLabelClass}>Width</label>
									<input
										type="number"
										class={inputNumberClass}
										value={styles.width}
										min="1"
										max="5000"
										on:change={(e) =>
											updateProperty('width', clampNumber(e.target.value, 1, 5000, 100))}
									/>
								</div>
								<div>
									<label class={fieldLabelClass}>Height</label>
									<input
										type="number"
										class={inputNumberClass}
										value={styles.height}
										min="1"
										max="5000"
										on:change={(e) =>
											updateProperty('height', clampNumber(e.target.value, 1, 5000, 100))}
									/>
								</div>
							</div>

							{#if type === 'rect' || ($selectedComponent && $selectedComponent.isRoundedRect)}
								<div class="pt-2">
									<div class="flex items-center justify-between mb-2">
										<label class={fieldLabelClass}>Corner Radius</label>
										<button
											class="text-gray-500 hover:text-black focus:outline-none"
											title="Individual Corners"
											on:click={() => (showIndividualCorners = !showIndividualCorners)}
										>
											{#if showIndividualCorners}
												<i class="fa fa-compress" />
											{:else}
												<i class="fa fa-expand" />
											{/if}
										</button>
									</div>

									{#if !showIndividualCorners}
										<div class="flex items-center gap-2 mb-1">
											<span class="text-xs text-gray-500 w-8">All</span>
											<input
												type="range"
												min="0"
												max="100"
												value={styles.radius}
												class={'flex-1 ' + rangeInputClass}
												on:input={(e) => {
													const val = parseInt(e.target.value);
													if ($selectedComponent.isRoundedRect) {
														updateProperty('cornerRadii', { tl: val, tr: val, br: val, bl: val });
													} else {
														updateProperty('radius', val);
													}
												}}
											/>
											<input
												type="number"
												class="w-14 text-sm border-gray-900 border-[2px] rounded-lg shadow-[2px_2px_0_0_#e5e5e5] focus:border-gray-900 focus:shadow-[2px_2px_0_0_#ffc480] focus:ring-0 hover:shadow-[2px_2px_0_0_#ffc480] transition-all"
												value={styles.radius}
												min="0"
												max="500"
												on:input={(e) => {
													const val = clampNumber(e.target.value, 0, 500, 0);
													if ($selectedComponent.isRoundedRect) {
														updateProperty('cornerRadii', { tl: val, tr: val, br: val, bl: val });
													} else {
														updateProperty('radius', val);
													}
												}}
											/>
										</div>
									{:else}
										<div class="grid grid-cols-2 gap-2">
											<!-- Top Left -->
											<div class="flex items-center gap-2">
												<i class="fa fa-border-top-left text-gray-400 text-xs" />
												<input
													type="number"
													class={inputNumberClass}
													placeholder="TL"
													value={cornerRadii.tl}
													min="0"
													max="500"
													on:input={(e) =>
														updateProperty('cornerRadii', {
															...cornerRadii,
															tl: clampNumber(e.target.value, 0, 500, 0)
														})}
												/>
											</div>
											<!-- Top Right -->
											<div class="flex items-center gap-2">
												<i class="fa fa-border-top-right text-gray-400 text-xs" />
												<input
													type="number"
													class={inputNumberClass}
													placeholder="TR"
													value={cornerRadii.tr}
													min="0"
													max="500"
													on:input={(e) =>
														updateProperty('cornerRadii', {
															...cornerRadii,
															tr: clampNumber(e.target.value, 0, 500, 0)
														})}
												/>
											</div>
											<!-- Bottom Left -->
											<div class="flex items-center gap-2">
												<i class="fa fa-border-bottom-left text-gray-400 text-xs" />
												<input
													type="number"
													class={inputNumberClass}
													placeholder="BL"
													value={cornerRadii.bl}
													min="0"
													max="500"
													on:input={(e) =>
														updateProperty('cornerRadii', {
															...cornerRadii,
															bl: clampNumber(e.target.value, 0, 500, 0)
														})}
												/>
											</div>
											<!-- Bottom Right -->
											<div class="flex items-center gap-2">
												<i class="fa fa-border-bottom-right text-gray-400 text-xs" />
												<input
													type="number"
													class={inputNumberClass}
													placeholder="BR"
													value={cornerRadii.br}
													min="0"
													max="500"
													on:input={(e) =>
														updateProperty('cornerRadii', {
															...cornerRadii,
															br: clampNumber(e.target.value, 0, 500, 0)
														})}
												/>
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
				</CollapsibleSection>
				<!-- End of collapsible Position & Size section -->

				{#if type === 'image'}
					{#if boundProperties.has('src')}<div class="text-[9px] text-green-500 pt-2">
							<i class="fa fa-link" /> Image source bound to API variable
						</div>{/if}
					<!-- Image Shape Clipping -->
					<div class="space-y-3 pt-4 border-t border-gray-200">
						<label class={fieldLabelClass}>Clip Shape</label>

						<div class="grid grid-cols-4 gap-2">
							<button
								class="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all {currentClipShape ===
								'none'
									? 'border-gray-900 bg-gray-900 text-white'
									: 'border-gray-900 bg-white shadow-[1px_1px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480] text-gray-500'}"
								on:click={() => applyClipShape('none')}
								title="No clipping"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect x="3" y="3" width="18" height="18" rx="2" />
								</svg>
								<span class="text-[10px] font-medium">None</span>
							</button>
							<button
								class="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all {currentClipShape ===
								'circle'
									? 'border-gray-900 bg-gray-900 text-white'
									: 'border-gray-900 bg-white shadow-[1px_1px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480] text-gray-500'}"
								on:click={() => applyClipShape('circle')}
								title="Circle clip"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="9" />
								</svg>
								<span class="text-[10px] font-medium">Circle</span>
							</button>
							<button
								class="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all {currentClipShape ===
								'ellipse'
									? 'border-gray-900 bg-gray-900 text-white'
									: 'border-gray-900 bg-white shadow-[1px_1px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480] text-gray-500'}"
								on:click={() => applyClipShape('ellipse')}
								title="Ellipse clip"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<ellipse cx="12" cy="12" rx="10" ry="6" />
								</svg>
								<span class="text-[10px] font-medium">Ellipse</span>
							</button>
							<button
								class="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all {currentClipShape ===
								'rounded-rect'
									? 'border-gray-900 bg-gray-900 text-white'
									: 'border-gray-900 bg-white shadow-[1px_1px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480] text-gray-500'}"
								on:click={() => applyClipShape('rounded-rect')}
								title="Rounded rectangle clip"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect x="3" y="3" width="18" height="18" rx="6" />
								</svg>
								<span class="text-[10px] font-medium">Rounded</span>
							</button>
						</div>

						{#if currentClipShape !== 'none'}
							<!-- Clip Adjustment Controls -->
							<div class="mt-3 pt-3 border-t border-gray-200 space-y-3">
								<div class="flex items-center justify-between">
									<span class={fieldLabelClass}>Adjust Clip Area</span>
									<button
										class="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
										on:click={resetClipPosition}
										title="Reset to center"
									>
										<i class="fa fa-undo mr-1" />Reset
									</button>
								</div>

								<!-- Scale/Size -->
								<div>
									<div class="flex items-center justify-between mb-1.5">
										<label class="text-xs text-gray-600">Size</label>
										<span class="text-xs text-gray-500">{clipSettings.scale}%</span>
									</div>
									<input
										type="range"
										min="20"
										max="150"
										value={clipSettings.scale}
										class={rangeInputClass}
										on:input={(e) => updateClipScale(parseInt(e.target.value))}
									/>
								</div>

								<!-- Position X -->
								<div>
									<div class="flex items-center justify-between mb-1.5">
										<label class="text-xs text-gray-600">Horizontal</label>
										<span class="text-xs text-gray-500"
											>{clipSettings.offsetX > 0 ? '+' : ''}{clipSettings.offsetX}%</span
										>
									</div>
									<input
										type="range"
										min="-50"
										max="50"
										value={clipSettings.offsetX}
										class={rangeInputClass}
										on:input={(e) => updateClipOffset('offsetX', parseInt(e.target.value))}
									/>
								</div>

								<!-- Position Y -->
								<div>
									<div class="flex items-center justify-between mb-1.5">
										<label class="text-xs text-gray-600">Vertical</label>
										<span class="text-xs text-gray-500"
											>{clipSettings.offsetY > 0 ? '+' : ''}{clipSettings.offsetY}%</span
										>
									</div>
									<input
										type="range"
										min="-50"
										max="50"
										value={clipSettings.offsetY}
										class={rangeInputClass}
										on:input={(e) => updateClipOffset('offsetY', parseInt(e.target.value))}
									/>
								</div>

								{#if currentClipShape === 'rounded-rect'}
									<!-- Corner Radius for Rounded Rect -->
									<div>
										<div class="flex items-center justify-between mb-1.5">
											<label class="text-xs text-gray-600">Corner Radius</label>
											<span class="text-xs text-gray-500">{clipCornerRadius}px</span>
										</div>
										<input
											type="range"
											min="0"
											max="100"
											value={clipCornerRadius}
											class={rangeInputClass}
											on:input={(e) => updateClipCornerRadius(parseInt(e.target.value))}
										/>
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Background Remover -->
					<div class="pt-4 border-t border-gray-200">
						<label class={fieldLabelClass}>Remove Background</label>

						{#if !hasBgRemoverAccess}
							<!-- Locked state for non-subscribers -->
							<div
								class="w-full bg-white border-[3px] border-gray-900 rounded-xl p-4 shadow-[4px_4px_0_0_#1f2937] flex flex-col items-center text-center mt-2"
							>
								<div
									class="w-10 h-10 rounded-xl bg-[#ffc480] border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] flex items-center justify-center mb-3"
								>
									<i class="fa fa-magic text-gray-900 text-base" />
								</div>
								<h3 class="text-sm font-black text-gray-900 mb-1.5 leading-tight">
									Unlock AI Remover
								</h3>
								<p class="text-[10.5px] font-medium text-gray-600 mb-4 leading-relaxed">
									Upgrade to the {bgRemoverMinPlanName} plan to erase backgrounds instantly.
								</p>
								<a
									href="/pricing"
									class="block w-full py-2.5 px-3 bg-[#b4f0a7] border-[2px] border-gray-900 text-gray-900 text-xs font-black rounded-lg shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all uppercase tracking-wide"
								>
									Upgrade Now
								</a>
							</div>
						{:else}
							<div class="space-y-2.5 mt-2">
								<button
									class="w-full py-2.5 px-3 bg-[#ffc480] border-[2px] border-gray-900 text-gray-900 rounded-lg shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#1f2937] transition-all font-black text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[3px_3px_0_0_#1f2937]"
									on:click={removeBackground}
									disabled={isRemovingBackground}
								>
									{#if isRemovingBackground}
										<i class="fa fa-spinner fa-spin text-sm" />
										Processing...
									{:else}
										<i class="fa fa-magic text-sm" />
										Remove Background
									{/if}
								</button>

								{#if originalImageUrl}
									<button
										class="w-full py-2 px-3 bg-white border-[2px] border-gray-900 text-gray-900 rounded-lg shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all font-bold text-xs flex items-center justify-center gap-2"
										on:click={restoreOriginalBackground}
									>
										<i class="fa fa-undo" />
										Restore Original
									</button>
								{/if}

								{#if backgroundRemovalError}
									<div
										class="bg-[#ff6b6b] border-[2px] border-gray-900 rounded-lg p-2.5 shadow-[2px_2px_0_0_#1f2937]"
									>
										<p class="text-xs font-bold text-white">
											<i class="fa fa-exclamation-triangle mr-1" />{backgroundRemovalError}
										</p>
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Filters & Effects -->
					<CollapsibleSection title="Filters & Effects" bind:open={showFiltersPanel}>
							<div class="space-y-4">
								<!-- Preset Filters -->
								<div>
									<label class={fieldLabelClass}>Quick Filters</label>
									<div class="grid grid-cols-2 gap-2">
										<button
											class="px-3 py-2 text-xs bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyPresetFilter('none')}
										>
											Original
										</button>
										<button
											class="px-3 py-2 text-xs bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyPresetFilter('grayscale')}
										>
											B&W
										</button>
										<button
											class="px-3 py-2 text-xs bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyPresetFilter('sepia')}
										>
											Sepia
										</button>
										<button
											class="px-3 py-2 text-xs bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyPresetFilter('vintage')}
										>
											Vintage
										</button>
										<button
											class="px-3 py-2 text-xs bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyPresetFilter('cool')}
										>
											Cool
										</button>
										<button
											class="px-3 py-2 text-xs bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyPresetFilter('warm')}
										>
											Warm
										</button>
										<button
											class="px-3 py-2 text-xs bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyPresetFilter('dramatic')}
										>
											Dramatic
										</button>
										<button
											class="px-3 py-2 text-xs bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all font-medium"
											on:click={() => applyPresetFilter('fade')}
										>
											Fade
										</button>
									</div>
								</div>

								<div class="pt-3 border-t border-gray-200">
									<label class={fieldLabelClass}>Adjust</label>

									<!-- Brightness -->
									<div class="mb-4">
										<div class="flex items-center justify-between mb-2">
											<label class="{fieldLabelClass} mb-0">Brightness</label>
											<span class="text-xs text-gray-500"
												>{Math.round(imageFilters.brightness * 100)}%</span
											>
										</div>
										<input
											type="range"
											min="-1"
											max="1"
											step="0.01"
											value={imageFilters.brightness}
											class={rangeInputClass}
											on:input={(e) => applyImageFilter('brightness', parseFloat(e.target.value))}
										/>
									</div>

									<!-- Contrast -->
									<div class="mb-4">
										<div class="flex items-center justify-between mb-2">
											<label class="{fieldLabelClass} mb-0">Contrast</label>
											<span class="text-xs text-gray-500"
												>{Math.round(imageFilters.contrast * 100)}%</span
											>
										</div>
										<input
											type="range"
											min="-1"
											max="1"
											step="0.01"
											value={imageFilters.contrast}
											class={rangeInputClass}
											on:input={(e) => applyImageFilter('contrast', parseFloat(e.target.value))}
										/>
									</div>

									<!-- Saturation -->
									<div class="mb-4">
										<div class="flex items-center justify-between mb-2">
											<label class="{fieldLabelClass} mb-0">Saturation</label>
											<span class="text-xs text-gray-500"
												>{Math.round(imageFilters.saturation * 100)}%</span
											>
										</div>
										<input
											type="range"
											min="-1"
											max="1"
											step="0.01"
											value={imageFilters.saturation}
											class={rangeInputClass}
											on:input={(e) => applyImageFilter('saturation', parseFloat(e.target.value))}
										/>
									</div>

									<!-- Blur -->
									<div class="mb-4">
										<div class="flex items-center justify-between mb-2">
											<label class="{fieldLabelClass} mb-0">Blur</label>
											<span class="text-xs text-gray-500"
												>{Math.round(imageFilters.blur * 100)}%</span
											>
										</div>
										<input
											type="range"
											min="0"
											max="1"
											step="0.01"
											value={imageFilters.blur}
											class={rangeInputClass}
											on:input={(e) => applyImageFilter('blur', parseFloat(e.target.value))}
										/>
									</div>

									<!-- Hue Rotation -->
									<div class="mb-4">
										<div class="flex items-center justify-between mb-2">
											<label class="{fieldLabelClass} mb-0">Hue Rotation</label>
											<span class="text-xs text-gray-500"
												>{Math.round(imageFilters.hue * 360)}°</span
											>
										</div>
										<input
											type="range"
											min="-0.5"
											max="0.5"
											step="0.01"
											value={imageFilters.hue}
											class={rangeInputClass +
												' !bg-gradient-to-r !from-red-500 !via-green-500 !to-blue-500'}
											on:input={(e) => applyImageFilter('hue', parseFloat(e.target.value))}
										/>
									</div>

									<!-- Reset Filters Button -->
									<button
										class="w-full py-2 px-3 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors font-medium"
										on:click={() => applyPresetFilter('none')}
									>
										<i class="fa fa-undo mr-1" />
										Reset All Filters
									</button>
								</div>
							</div>
					</CollapsibleSection>
				{/if}

				<!-- CHART PROPERTIES SECTION -->
				{#if isChart}
					<div class="space-y-3 pt-4 border-t border-gray-200">
						<!-- Chart Data Editor -->
						<CollapsibleSection title="Chart Data" bind:open={showChartDataEditor} border={false}>
							<svelte:fragment slot="title-extra">{#if boundProperties.has('chartData')}<i
											class="fa fa-link text-[9px] text-green-500 ml-1"
											title="Bound to API variable"
										/>{/if}</svelte:fragment>
								<div class="space-y-3">
									<!-- Format Toggle + Maximize -->
									<div class="flex items-center gap-2">
										<div class="flex gap-1 p-1 bg-white border-[2px] border-gray-900 rounded-lg flex-1 shadow-[1px_1px_0_0_#e5e5e5]">
											<button
												class="flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all {chartDataFormat ===
												'json'
													? 'bg-white text-gray-900 shadow-sm'
													: 'text-gray-600 hover:text-gray-900'}"
												on:click={() => {
													chartDataFormat = 'json';
													loadSampleChartData();
												}}
											>
												<i class="fa fa-code mr-1" />JSON
											</button>
											<button
												class="flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all {chartDataFormat ===
												'csv'
													? 'bg-white text-gray-900 shadow-sm'
													: 'text-gray-600 hover:text-gray-900'}"
												on:click={() => {
													chartDataFormat = 'csv';
													loadSampleChartData();
												}}
											>
												<i class="fa fa-file-csv mr-1" />CSV
											</button>
										</div>
										{#if chartDataFormat === 'csv'}
											<button
												class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
												on:click={formatChartCSV}
												title="Format CSV"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
													><path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 6h16M4 12h16m-7 6h7"
													/></svg
												>
											</button>
										{/if}
										<button
											class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
											on:click={() => (maximizeChartEditor = true)}
											title="Maximize editor"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
												/></svg
											>
										</button>
									</div>

									{#if chartDataFormat === 'json'}
										<div
											class="border-[2px] border-gray-900 rounded-lg overflow-hidden shadow-[2px_2px_0_0_#e5e5e5] focus-within:border-gray-900 focus-within:shadow-[2px_2px_0_0_#ffc480] transition-all bg-white pb-1"
										>
											<CodeMirror
												bind:value={chartDataInput}
												lang={json()}
												styles={{
													'&': {
														height: '144px',
														fontSize: '12px',
														fontFamily:
															'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
													},
													'.cm-content': { padding: '8px' },
													'.cm-line': { padding: '0' },
													'.cm-gutters': {
														backgroundColor: '#f9fafb',
														color: '#9ca3af',
														borderRight: '1px solid #f3f4f6',
														minWidth: '30px'
													}
												}}
											/>
										</div>
									{:else}
										<textarea
											class="w-full h-36 text-xs font-mono border-gray-900 border-[2px] rounded-lg shadow-[2px_2px_0_0_#e5e5e5] focus:border-gray-900 focus:shadow-[2px_2px_0_0_#ffc480] focus:ring-0 hover:shadow-[2px_2px_0_0_#ffc480] transition-all p-2"
											placeholder="label,value\nJan,30\nFeb,45"
											bind:value={chartDataInput}
										/>
									{/if}

									{#if chartDataError}
										<p class="text-xs text-red-600">
											<i class="fa fa-exclamation-circle mr-1" />{chartDataError}
										</p>
									{/if}

									<div class="flex gap-2">
										<button
											class="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
											on:click={loadSampleChartData}
										>
											<i class="fa fa-undo mr-1" />Load Current
										</button>
										<button
											class="flex-1 px-3 py-2 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
											on:click={applyChartDataFromInput}
										>
											<i class="fa fa-check mr-1" />Apply
										</button>
									</div>

									<!-- Format Examples -->
									<div
										class="bg-gray-50 border border-gray-200 rounded-lg p-2 text-[10px] text-gray-500"
									>
										{#if chartDataFormat === 'csv'}
											<p class="font-medium mb-1 text-gray-600">CSV Format:</p>
											<code class="block text-gray-400">label,value<br />Jan,30<br />Feb,45</code>
										{:else}
											<p class="font-medium mb-1 text-gray-600">JSON Format:</p>
											<code class="block text-gray-400"
												>[{'{'}"label": "Jan", "value": 30{'}'}]</code
											>
										{/if}
									</div>
								</div>
						</CollapsibleSection>

						<!-- Chart Appearance -->
						<CollapsibleSection title="Appearance" bind:open={showChartAppearance}>
								<div class="space-y-4">
									<!-- Font Family -->
									<div>
										<label class={fieldLabelClass}>Font Family</label>
										<select
											class={selectClass}
											bind:value={chartFontFamily}
											on:change={updateChartAppearance}
										>
											{#each CHART_FONT_OPTIONS as font}
												<option value={font}>{font}</option>
											{/each}
										</select>
									</div>

									<!-- Color Palette Presets -->
									<div>
										<label class={fieldLabelClass}>Color Palette</label>
										<div class="flex gap-2 flex-wrap">
											{#each Object.entries(CHART_PALETTES) as [key, palette]}
												<button
													class="flex flex-col items-center gap-1 group"
													on:click={() => {
														chartColors = [...palette.colors, ...chartColors.slice(5)];
														updateChartAppearance();
													}}
													title={palette.name}
												>
													<div
														class="w-12 h-4 rounded border-[2px] border-gray-900 flex overflow-hidden hover:shadow-[1px_1px_0_0_#ffc480] transition-all"
													>
														{#each palette.colors as color}
															<div class="flex-1" style="background: {color};" />
														{/each}
													</div>
													<span class="text-[9px] text-gray-400 group-hover:text-gray-600"
														>{palette.name}</span
													>
												</button>
											{/each}
										</div>
									</div>

									<!-- Individual Color Swatches -->
									<div>
										<label class={fieldLabelClass}>Data Colors</label>
										<div class="flex gap-2 flex-wrap">
											{#each chartColors.slice(0, chartData.length || 5) as color, i}
												<div class="relative">
													<GradientColorPicker
														label=""
														value={color}
														defaultColor={color}
														supportsGradient={false}
														onSolidChange={(newColor) => {
															chartColors = chartColors.map((c, idx) => (idx === i ? newColor : c));
															updateChartAppearance();
														}}
													/>
												</div>
											{/each}
										</div>
									</div>

									<!-- Accent Colors -->
									<div class="space-y-3 pt-3 border-t border-gray-100">
										<label class={fieldLabelClass}>Accent Colors</label>
										<GradientColorPicker
											label="Title Color"
											value={chartTitleColor}
											defaultColor="#333333"
											supportsGradient={false}
											onSolidChange={(color) => {
												chartTitleColor = color;
												updateChartAppearance();
											}}
										/>
										<GradientColorPicker
											label="Label Color"
											value={chartLabelColor}
											defaultColor="#666666"
											supportsGradient={false}
											onSolidChange={(color) => {
												chartLabelColor = color;
												updateChartAppearance();
											}}
										/>
										<GradientColorPicker
											label="Grid Color"
											value={chartGridColor}
											defaultColor="#eeeeee"
											supportsGradient={false}
											onSolidChange={(color) => {
												chartGridColor = color;
												updateChartAppearance();
											}}
										/>
										<GradientColorPicker
											label="Background"
											value={chartBackgroundColor}
											defaultColor="#ffffff"
											supportsGradient={false}
											onSolidChange={(color) => {
												chartBackgroundColor = color;
												updateChartAppearance();
											}}
										/>
										<GradientColorPicker
											label="Border Color"
											value={chartBorderColor}
											defaultColor="#e5e5e5"
											supportsGradient={false}
											onSolidChange={(color) => {
												chartBorderColor = color;
												updateChartAppearance();
											}}
										/>
									</div>
								</div>
						</CollapsibleSection>
					</div>
				{/if}

				<!-- TABLE PROPERTIES SECTION -->
				{#if isTable}
					<div class="space-y-3 pt-4 border-t border-gray-200">
						<!-- Table Style Selector -->
						<div>
							<label class={fieldLabelClass}>Style</label>
							<div class="grid grid-cols-5 gap-2">
								{#each Object.entries(TABLE_STYLES) as [key, style]}
									<button
										class="flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all {tableStyle ===
										key
											? 'border-gray-900 bg-gray-50 shadow-sm'
											: 'border-gray-900 shadow-[1px_1px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480]'}"
										on:click={() => changeTableStyle(key)}
										title={style.name}
									>
										<div
											class="w-full h-5 rounded overflow-hidden border-[2px] border-gray-900 flex flex-col"
										>
											<div class="h-2" style="background: {style.headerBg};" />
											<div class="flex-1" style="background: {style.rowBg};" />
											<div class="h-1" style="background: {style.altRowBg};" />
										</div>
										<span class="text-[9px] text-gray-400">{style.name}</span>
									</button>
								{/each}
							</div>
						</div>

						<!-- Table Customize Style -->
						<div class="pt-3 border-t border-gray-200">
							<button
								class="w-full flex items-center justify-between text-left group"
								on:click={() => {
									showTableCustomize = !showTableCustomize;
									if (showTableCustomize && !tableCustomColors) initTableCustomColors();
								}}
								aria-expanded={showTableCustomize}
							>
								<span class={sectionHeaderClass}>Customize Colors</span>
								<i
									class="fa fa-chevron-{showTableCustomize
										? 'up'
										: 'down'} text-[10px] text-gray-300 group-hover:text-gray-500 transition-colors"
								/>
							</button>

							{#if showTableCustomize}
								<div class="space-y-4" transition:slide={{ duration: 150 }}>
									<!-- Font Family -->
									<div>
										<label class={fieldLabelClass}>Font Family</label>
										<select
											class={selectClass}
											bind:value={tableFontFamily}
											on:change={updateTableAppearance}
										>
											{#each CHART_FONT_OPTIONS as font}
												<option value={font}>{font}</option>
											{/each}
										</select>
									</div>

									<!-- Color Overrides -->
									{#if tableCustomColors}
										<div class="space-y-3">
											<GradientColorPicker
												label="Header Background"
												value={tableCustomColors.headerBg}
												defaultColor={tableCustomColors.headerBg}
												supportsGradient={false}
												onSolidChange={(color) => {
													tableCustomColors = { ...tableCustomColors, headerBg: color };
													updateTableAppearance();
												}}
											/>
											<GradientColorPicker
												label="Header Text"
												value={tableCustomColors.headerText}
												defaultColor={tableCustomColors.headerText}
												supportsGradient={false}
												onSolidChange={(color) => {
													tableCustomColors = { ...tableCustomColors, headerText: color };
													updateTableAppearance();
												}}
											/>
											<GradientColorPicker
												label="Row Background"
												value={tableCustomColors.rowBg}
												defaultColor={tableCustomColors.rowBg}
												supportsGradient={false}
												onSolidChange={(color) => {
													tableCustomColors = { ...tableCustomColors, rowBg: color };
													updateTableAppearance();
												}}
											/>
											<GradientColorPicker
												label="Alternate Row"
												value={tableCustomColors.altRowBg}
												defaultColor={tableCustomColors.altRowBg}
												supportsGradient={false}
												onSolidChange={(color) => {
													tableCustomColors = { ...tableCustomColors, altRowBg: color };
													updateTableAppearance();
												}}
											/>
											<GradientColorPicker
												label="Border Color"
												value={tableCustomColors.borderColor}
												defaultColor={tableCustomColors.borderColor}
												supportsGradient={false}
												onSolidChange={(color) => {
													tableCustomColors = { ...tableCustomColors, borderColor: color };
													updateTableAppearance();
												}}
											/>
											<GradientColorPicker
												label="Text Color"
												value={tableCustomColors.textColor}
												defaultColor={tableCustomColors.textColor}
												supportsGradient={false}
												onSolidChange={(color) => {
													tableCustomColors = { ...tableCustomColors, textColor: color };
													updateTableAppearance();
												}}
											/>
										</div>
									{/if}

									<!-- Reset Button -->
									<button
										class="w-full px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
										on:click={resetTableToPreset}
									>
										<i class="fa fa-undo mr-1" />Reset to Preset
									</button>
								</div>
							{/if}
						</div>

						<!-- Table Data Editor -->
						<CollapsibleSection title="Table Data" bind:open={showTableDataEditor}>
							<svelte:fragment slot="title-extra">{#if boundProperties.has('tableData')}<i
											class="fa fa-link text-[9px] text-green-500 ml-1"
											title="Bound to API variable"
										/>{/if}</svelte:fragment>
								<div class="space-y-3">
									<!-- Format Toggle + Maximize -->
									<div class="flex items-center gap-2">
										<div class="flex gap-1 p-1 bg-white border-[2px] border-gray-900 rounded-lg flex-1 shadow-[1px_1px_0_0_#e5e5e5]">
											<button
												class="flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all {tableDataFormat ===
												'json'
													? 'bg-white text-gray-900 shadow-sm'
													: 'text-gray-600 hover:text-gray-900'}"
												on:click={() => {
													tableDataFormat = 'json';
													loadSampleTableData();
												}}
											>
												<i class="fa fa-code mr-1" />JSON
											</button>
											<button
												class="flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all {tableDataFormat ===
												'csv'
													? 'bg-white text-gray-900 shadow-sm'
													: 'text-gray-600 hover:text-gray-900'}"
												on:click={() => {
													tableDataFormat = 'csv';
													loadSampleTableData();
												}}
											>
												<i class="fa fa-file-csv mr-1" />CSV
											</button>
										</div>
										{#if tableDataFormat === 'csv'}
											<button
												class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
												on:click={formatTableCSV}
												title="Format CSV"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
													><path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 6h16M4 12h16m-7 6h7"
													/></svg
												>
											</button>
										{/if}
										<button
											class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
											on:click={() => (maximizeTableEditor = true)}
											title="Maximize editor"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
												/></svg
											>
										</button>
									</div>

									{#if tableDataFormat === 'json'}
										<div
											class="border-[2px] border-gray-900 rounded-lg overflow-hidden shadow-[2px_2px_0_0_#e5e5e5] focus-within:border-gray-900 focus-within:shadow-[2px_2px_0_0_#ffc480] transition-all bg-white pb-1"
										>
											<CodeMirror
												bind:value={tableDataInput}
												lang={json()}
												styles={{
													'&': {
														height: '144px',
														fontSize: '12px',
														fontFamily:
															'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
													},
													'.cm-content': { padding: '8px' },
													'.cm-line': { padding: '0' },
													'.cm-gutters': {
														backgroundColor: '#f9fafb',
														color: '#9ca3af',
														borderRight: '1px solid #f3f4f6',
														minWidth: '30px'
													}
												}}
											/>
										</div>
									{:else}
										<textarea
											class="w-full h-36 text-xs font-mono border-gray-900 border-[2px] rounded-lg shadow-[2px_2px_0_0_#e5e5e5] focus:border-gray-900 focus:shadow-[2px_2px_0_0_#ffc480] focus:ring-0 hover:shadow-[2px_2px_0_0_#ffc480] transition-all p-2"
											placeholder="Header1,Header2,Header3\nValue1,Value2,Value3"
											bind:value={tableDataInput}
										/>
									{/if}

									{#if tableDataError}
										<p class="text-xs text-red-600">
											<i class="fa fa-exclamation-circle mr-1" />{tableDataError}
										</p>
									{/if}

									<div class="flex gap-2">
										<button
											class="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
											on:click={loadSampleTableData}
										>
											<i class="fa fa-undo mr-1" />Load Current
										</button>
										<button
											class="flex-1 px-3 py-2 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
											on:click={applyTableDataFromInput}
										>
											<i class="fa fa-check mr-1" />Apply
										</button>
									</div>

									<!-- Format Examples -->
									<div
										class="bg-gray-50 border border-gray-200 rounded-lg p-2 text-[10px] text-gray-500"
									>
										<p class="font-medium mb-1 text-gray-600">
											{tableDataFormat === 'csv' ? 'CSV' : 'JSON'} Format:
										</p>
										{#if tableDataFormat === 'csv'}
											{#if tableType === 'stats'}
												<code class="block text-gray-500"
													>Metric,Value,Change<br />Revenue,$45k,+12%<br />Users,2345,+8%</code
												>
											{:else if tableType === 'comparison'}
												<code class="block text-gray-500"
													>Feature,Basic,Pro<br />Price,$9,$29<br />Storage,10GB,100GB</code
												>
											{:else}
												<code class="block text-gray-500"
													>Product,Price,Stock<br />Widget A,$29,150</code
												>
											{/if}
										{:else}
											<code class="block text-gray-500"
												>{'{'}"headers": [...], "rows": [[...]]{'}'}</code
											>
										{/if}
										<p class="text-[9px] text-gray-500 mt-1">
											Same format works for all table types via API
										</p>
									</div>
								</div>
						</CollapsibleSection>

						<!-- Table Info -->
						{#if tableType === 'stats' && tableData.stats}
							<div class="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
								<p><strong>Stats Cards:</strong> {tableData.stats.length}</p>
								<p class="text-[10px] mt-1">{tableData.stats.map((s) => s.label).join(', ')}</p>
							</div>
						{:else if tableType === 'comparison' && tableData.features}
							<div class="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
								<p><strong>Features:</strong> {tableData.features?.length || 0}</p>
								<p>
									<strong>Plans:</strong>
									{tableData.plans?.length || 0} ({tableData.plans?.map((p) => p.name).join(', ')})
								</p>
							</div>
						{:else if tableData.headers}
							<div class="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
								<p>
									<strong>Columns:</strong>
									{tableData.headers.length} ({tableData.headers.join(', ')})
								</p>
								{#if tableData.rows}
									<p><strong>Rows:</strong> {tableData.rows.length}</p>
								{/if}
							</div>
						{/if}
					</div>
				{/if}

				<!-- QR CODE PROPERTIES SECTION -->
				{#if isQRCode}
					<!-- Appearance -->
					<CollapsibleSection title="Appearance" bind:open={showQRAppearance}>
							<div class="space-y-4">
								<GradientColorPicker
									label="Foreground Color"
									value={qrConfig.fgColor || '#000000'}
									defaultColor="#000000"
									supportsGradient={false}
									onSolidChange={(color) => updateQRCodeConfig('fgColor', color)}
								/>
								<GradientColorPicker
									label="Background Color"
									value={qrConfig.bgColor || '#ffffff'}
									defaultColor="#ffffff"
									supportsGradient={false}
									onSolidChange={(color) => updateQRCodeConfig('bgColor', color)}
								/>

								<!-- Data Pattern -->
								<div>
									<label class={fieldLabelClass}>Data Pattern</label>
									<div class="grid grid-cols-3 gap-1.5">
										{#each PATTERN_STYLES as style}
											<button
												class="flex flex-col items-center gap-1 p-2 rounded-lg border transition-all {qrConfig.patternStyle ===
												style.type
													? 'border-gray-900 bg-gray-50 shadow-sm'
													: 'border-gray-900 shadow-[1px_1px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480] text-gray-600'}"
												on:click={() => updateQRCodeConfig('patternStyle', style.type)}
											>
												<span class="text-base">{style.preview}</span>
												<span class="text-[9px] text-gray-400">{style.label}</span>
											</button>
										{/each}
									</div>
								</div>

								<!-- Corner Pattern -->
								<div>
									<label class={fieldLabelClass}>Corner Pattern</label>
									<div class="grid grid-cols-3 gap-1.5">
										{#each PATTERN_STYLES as style}
											<button
												class="flex flex-col items-center gap-1 p-2 rounded-lg border transition-all {qrConfig.cornerStyle ===
												style.type
													? 'border-gray-900 bg-gray-50 shadow-sm'
													: 'border-gray-900 shadow-[1px_1px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480] text-gray-600'}"
												on:click={() => updateQRCodeConfig('cornerStyle', style.type)}
											>
												<span class="text-base">{style.preview}</span>
												<span class="text-[9px] text-gray-400">{style.label}</span>
											</button>
										{/each}
									</div>
								</div>
							</div>
					</CollapsibleSection>

					<!-- Content -->
					<CollapsibleSection title="Content" bind:open={showQRContent}>
							<div>
								<label class={fieldLabelClass}>URL or Text</label>
								<input
									type="text"
									class={inputBaseClass}
									placeholder="https://example.com"
									value={qrData}
									on:change={(e) => updateQRCodeContent(e.target.value)}
								/>
							</div>
					</CollapsibleSection>

					<!-- Error Correction -->
					<CollapsibleSection title="Error Correction" bind:open={showQRErrorCorrection}>
							<div>
								<div class="flex items-center justify-between">
									<label class={fieldLabelClass}>Level</label>
									<span class="text-[10px] text-gray-500"
										>{qrConfig.errorCorrectionLevel || 'M'}</span
									>
								</div>
								<select
									class={selectClass}
									value={qrConfig.errorCorrectionLevel || 'M'}
									on:change={(e) => updateQRCodeConfig('errorCorrectionLevel', e.target.value)}
								>
									{#each ERROR_CORRECTION_OPTIONS as option}
										<option value={option.level}>{option.label} - {option.description}</option>
									{/each}
								</select>
							</div>
					</CollapsibleSection>
				{/if}
			{/if}
			<!-- END DESIGN MODE -->

			<!-- LOGIC MODE -->
			{#if panelMode === 'logic'}
				<!-- View All Variables link at top -->
				<button
					class="inline-flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-900 font-medium mb-3 transition-colors"
					on:click={() => editorActions.toggleRightSidebarTab('variables')}
					aria-label="View all template variables"
				>
					<i class="fa fa-list-ul text-[10px]" />
					View All Variables
					<i class="fa fa-arrow-right text-[9px]" />
				</button>

				<!-- Stripped chars feedback -->
				{#if strippedCharsMessage}
					<div
						class="mb-2 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-700"
						role="alert"
					>
						<i class="fa fa-info-circle mr-1" />{strippedCharsMessage}
					</div>
				{/if}

				<!-- VARIABLES SECTION — accordion -->
				<div class="pt-3 border-t border-gray-200">
					<button
						class="w-full flex items-center justify-between text-left group"
						on:click={() => (showVariablesSection = !showVariablesSection)}
						aria-expanded={showVariablesSection}
					>
						<div class="flex items-center gap-2">
							<span class={sectionHeaderClass}>Variables</span>
							{#if isVariable && variableBindings.length > 0}
								<span
									class="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-medium"
									>{variableBindings.length}</span
								>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<label
								class="relative inline-flex items-center cursor-pointer"
								on:click|stopPropagation
							>
								<input
									type="checkbox"
									class="sr-only peer"
									checked={isVariable}
									on:change={(e) => toggleVariable(e.target.checked)}
									aria-label="Enable variables"
								/>
								<div class={toggleSwitchClass} />
							</label>
							<i
								class="fa fa-chevron-{showVariablesSection
									? 'up'
									: 'down'} text-[10px] text-gray-300 group-hover:text-gray-500 transition-colors"
							/>
						</div>
					</button>

					{#if showVariablesSection}
						<div class="space-y-3 mt-3" transition:slide={{ duration: 150 }}>
							{#if !isVariable}
								<p class="text-xs text-gray-500">Make this element customizable via API</p>
							{:else}
								<!-- Variable Bindings List -->
								{#each variableBindings as binding, index}
									<div class="bg-gray-50 rounded-lg p-3 border border-gray-200 relative">
										<div class="flex items-center justify-between mb-2">
											<span class="{fieldLabelClass} mb-0">Binding #{index + 1}</span>
											<button
												class="text-gray-400 hover:text-red-500 p-1 transition-colors"
												on:click={() => removeVariableBinding(index)}
												title="Remove binding"
												aria-label="Remove binding {index + 1}"
											>
												<i class="fa fa-times text-xs" />
											</button>
										</div>

										<!-- Property Selection -->
										<div class="mb-2">
											<label class={fieldLabelClass}>Property</label>
											{#if isChart || isTable}
												<div
													class="text-xs text-gray-700 bg-white rounded-lg px-3 py-1.5 border-[2px] border-gray-200"
												>
													<i class="fa fa-{isChart ? 'chart-bar' : 'table'} mr-1 text-gray-400" />
													{isChart ? 'Chart Data' : 'Table Data'}
												</div>
											{:else}
												<select
													class={selectClass}
													value={binding.property}
													on:change={(e) =>
														updateVariableBinding(index, 'property', e.target.value)}
												>
													{#each getAvailablePropertiesForType() as prop}
														<option
															value={prop.value}
															disabled={variableBindings.some(
																(b, i) => i !== index && b.property === prop.value
															)}
														>
															{prop.label}
															{variableBindings.some(
																(b, i) => i !== index && b.property === prop.value
															)
																? '(in use)'
																: ''}
														</option>
													{/each}
												</select>
											{/if}
										</div>

										<!-- Variable Name -->
										<div class="mb-2">
											<label class={fieldLabelClass}>
												Variable Name
												<span class="text-red-500">*</span>
											</label>
											<input
												type="text"
												class="{inputBaseClass} bg-yellow-50"
												placeholder="e.g., backgroundColor"
												value={binding.variableName}
												on:input={(e) =>
													updateVariableBinding(index, 'variableName', e.target.value)}
												aria-required="true"
												aria-invalid={!!variableNameErrors[index]}
											/>
											{#if variableNameErrors[index]}
												<p class="text-[10px] text-red-500 mt-1" role="alert">
													{variableNameErrors[index]}
												</p>
											{/if}
										</div>

										<!-- Description -->
										<div class="mb-2">
											<label class={fieldLabelClass}
												>Description <span class="text-gray-500">(optional)</span></label
											>
											<input
												type="text"
												class={inputBaseClass}
												placeholder="Brief description for API docs"
												value={binding.description}
												on:input={(e) =>
													updateVariableBinding(index, 'description', e.target.value)}
											/>
										</div>

										<!-- Required Toggle -->
										<div class="flex items-center justify-between pt-1">
											<label class="{fieldLabelClass} mb-0">Required</label>
											<label class="relative inline-flex items-center cursor-pointer">
												<input
													type="checkbox"
													class="sr-only peer"
													checked={binding.required}
													on:change={(e) =>
														updateVariableBinding(index, 'required', e.target.checked)}
												/>
												<div class={toggleSwitchClass} />
											</label>
										</div>
									</div>
								{/each}

								<!-- Add Another Binding Button -->
								{#if getAvailablePropertiesForType().length > variableBindings.length}
									<button
										class="w-full py-2 px-3 border-2 border-dashed border-gray-900 rounded-lg text-xs text-gray-500 hover:text-gray-700 hover:border-gray-900 hover:shadow-[2px_2px_0_0_#ffc480] transition-all flex items-center justify-center gap-2"
										on:click={addVariableBinding}
									>
										<i class="fa fa-plus text-[10px]" />
										Add Another Property
									</button>
								{:else}
									<p class="text-[10px] text-gray-500 text-center py-2">
										All available properties are bound
									</p>
								{/if}

								<!-- Collapsible API Usage Preview -->
								<button
									class="w-full flex items-center justify-between text-left text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
									on:click={() => (showApiPreview = !showApiPreview)}
									aria-expanded={showApiPreview}
								>
									<span class="font-medium">API Preview</span>
									<i class="fa fa-chevron-{showApiPreview ? 'up' : 'down'} text-[9px]" />
								</button>
								{#if showApiPreview}
									<div class="bg-gray-900 rounded-lg p-3" transition:slide={{ duration: 150 }}>
										<pre
											class="text-green-400 text-[10px] whitespace-pre-wrap overflow-x-auto"><code
												>{JSON.stringify(buildApiPreviewJson(), null, 2)}</code
											></pre>
									</div>
								{/if}
							{/if}
						</div>
					{/if}
				</div>

				<!-- CONDITION SECTION — accordion -->
				<div class="pt-3 border-t border-gray-200">
					<button
						class="w-full flex items-center justify-between text-left group"
						on:click={() => (showConditionSection = !showConditionSection)}
						aria-expanded={showConditionSection}
					>
						<div class="flex items-center gap-2">
							<span class={sectionHeaderClass}>Condition</span>
							{#if conditionType !== 'none'}
								<span
									class="px-1.5 py-0.5 text-[10px] rounded font-medium {conditionType === 'showWhen'
										? 'bg-green-100 text-green-700'
										: 'bg-red-100 text-red-700'}"
								>
									{conditionType === 'showWhen' ? 'Show if' : 'Hide if'}
								</span>
							{/if}
						</div>
						<i
							class="fa fa-chevron-{showConditionSection
								? 'up'
								: 'down'} text-[10px] text-gray-300 group-hover:text-gray-500 transition-colors"
						/>
					</button>

					{#if showConditionSection}
						<div class="space-y-3 mt-3" transition:slide={{ duration: 150 }}>
							<div
								class="flex rounded-lg overflow-hidden border-[2px] border-gray-900 text-[11px] shadow-[2px_2px_0_0_#e5e5e5]"
								role="group"
								aria-label="Condition type"
							>
								<button
									class="flex-1 py-2 px-3 transition-colors font-medium {conditionType === 'none'
										? 'bg-gray-900 text-white'
										: 'bg-white text-gray-500 hover:bg-gray-50'}"
									on:click={() => updateConditionType('none')}
									aria-pressed={conditionType === 'none'}>Always</button
								>
								<button
									class="flex-1 py-2 px-3 border-l-[2px] border-gray-900 transition-colors font-medium {conditionType ===
									'showWhen'
										? 'bg-green-500 text-white'
										: 'bg-white text-gray-500 hover:bg-gray-50'}"
									on:click={() => updateConditionType('showWhen')}
									aria-pressed={conditionType === 'showWhen'}>Show if</button
								>
								<button
									class="flex-1 py-2 px-3 border-l-[2px] border-gray-900 transition-colors font-medium {conditionType ===
									'hideWhen'
										? 'bg-red-500 text-white'
										: 'bg-white text-gray-500 hover:bg-gray-50'}"
									on:click={() => updateConditionType('hideWhen')}
									aria-pressed={conditionType === 'hideWhen'}>Hide if</button
								>
							</div>

							{#if conditionType !== 'none'}
								<ConditionBuilder
									condition={conditionExpression}
									availableVariables={conditionAvailableVars}
									on:change={(e) => updateConditionExpression(e.detail.expression)}
								/>

								{#if !conditionValid && conditionError}
									<p class="text-[10px] text-red-500" role="alert">{conditionError}</p>
								{/if}
							{:else}
								<p class="text-xs text-gray-500">Control when this element is visible</p>
							{/if}
						</div>
					{/if}
				</div>

				<!-- LOOP SECTION — accordion -->
				<div class="pt-3 border-t border-gray-200">
					<button
						class="w-full flex items-center justify-between text-left group"
						on:click={() => (showLoopSection = !showLoopSection)}
						aria-expanded={showLoopSection}
					>
						<div class="flex items-center gap-2">
							<span class={sectionHeaderClass}>Loop</span>
							{#if isLoopElement}
								<span
									class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-medium"
									>Active</span
								>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<label
								class="relative inline-flex items-center cursor-pointer"
								on:click|stopPropagation
							>
								<input
									type="checkbox"
									class="sr-only peer"
									checked={isLoopElement}
									on:change={(e) => toggleLoop(e.target.checked)}
									aria-label="Enable loop"
								/>
								<div class={toggleSwitchClass} />
							</label>
							<i
								class="fa fa-chevron-{showLoopSection
									? 'up'
									: 'down'} text-[10px] text-gray-300 group-hover:text-gray-500 transition-colors"
							/>
						</div>
					</button>

					{#if showLoopSection}
						<div class="space-y-3 mt-3" transition:slide={{ duration: 150 }}>
							{#if !isLoopElement}
								<p class="text-xs text-gray-500">Repeat this element for each item in an array</p>
							{:else}
								<div class="grid grid-cols-2 gap-2">
									<div>
										<label class={fieldLabelClass}>Array Variable</label>
										<input
											type="text"
											class={inputBaseClass}
											placeholder="items"
											value={loopVariable}
											on:input={(e) => {
												updateLoopVariable(e.target.value);
												validateLoopVariable(e.target.value);
											}}
											aria-required="true"
											aria-invalid={!!loopVariableError}
										/>
										{#if loopVariableError}
											<p class="text-[10px] text-red-500 mt-1" role="alert">{loopVariableError}</p>
										{/if}
									</div>
									<div>
										<label class={fieldLabelClass}>Item Alias</label>
										<input
											type="text"
											class={inputBaseClass}
											placeholder="item"
											value={loopItemName}
											on:input={(e) => updateLoopItemName(e.target.value)}
										/>
									</div>
								</div>

								<div class="grid grid-cols-2 gap-2">
									<div>
										<label class={fieldLabelClass}>Layout</label>
										<select
											class={selectClass}
											value={loopDirection}
											on:change={(e) => updateLoopDirection(e.target.value)}
										>
											<option value="vertical">Vertical</option>
											<option value="horizontal">Horizontal</option>
											<option value="grid">Grid</option>
										</select>
									</div>
									<div>
										<label class={fieldLabelClass}
											>{loopDirection === 'grid' ? 'Columns' : 'Gap (px)'}</label
										>
										{#if loopDirection === 'grid'}
											<input
												type="number"
												class={inputBaseClass}
												min="1"
												max="10"
												value={loopColumns}
												on:input={(e) => updateLoopColumns(e.target.value)}
											/>
										{:else}
											<input
												type="number"
												class={inputBaseClass}
												min="0"
												value={loopSpacing}
												on:input={(e) => updateLoopSpacing(e.target.value)}
											/>
										{/if}
									</div>
								</div>

								{#if loopDirection === 'grid'}
									<div>
										<label class={fieldLabelClass}>Gap (px)</label>
										<input
											type="number"
											class={inputBaseClass}
											min="0"
											value={loopSpacing}
											on:input={(e) => updateLoopGap(e.target.value)}
										/>
									</div>
								{/if}

								<div class="bg-gray-50 rounded-lg p-2 border border-gray-200">
									<p class="text-[10px] text-gray-600">
										<i class="fa fa-info-circle mr-1 text-gray-400" />
										Use
										<code class="bg-gray-200 px-1 rounded text-gray-700"
											>{'{{' + (loopItemName || 'item') + '.field}}'}</code
										> in text elements
									</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Destructive Action Confirmation Modal -->
				{#if pendingDestructiveAction}
					<div
						class="mt-3 p-3 bg-amber-50 border-[2px] border-amber-300 rounded-lg"
						role="alertdialog"
						aria-label="Confirm action"
					>
						<p class="text-xs text-amber-800 font-medium mb-2">
							{#if pendingDestructiveAction.type === 'condition'}
								Remove condition? Your expression will be cleared.
							{:else if pendingDestructiveAction.type === 'loop'}
								Disable loop? The loop configuration on canvas will be removed.
							{:else}
								Are you sure?
							{/if}
						</p>
						<div class="flex gap-2">
							<button
								class="flex-1 py-1.5 px-3 text-[11px] font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
								on:click={confirmDestructiveAction}>Confirm</button
							>
							<button
								class="flex-1 py-1.5 px-3 text-[11px] font-medium bg-white text-gray-700 border-[2px] border-gray-900 rounded-lg shadow-[2px_2px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all"
								on:click={cancelDestructiveAction}>Cancel</button
							>
						</div>
					</div>
				{/if}
			{/if}
			<!-- END LOGIC MODE -->

			<!-- GROUP/UNGROUP SECTION (always visible) -->
			<div class="pt-4 border-t border-gray-200">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-gray-600">Grouping</span>
					{#if type === 'activeSelection'}
						<button
							class="py-1.5 px-3 text-[11px] bg-gray-800 hover:bg-black text-white rounded transition-colors font-medium"
							on:click={groupSelectedElements}
						>
							Group
						</button>
					{:else if type === 'group' && !$selectedComponent?.isQRCode && !$selectedComponent?.isChart && !$selectedComponent?.isTable}
						<button
							class="py-1.5 px-3 text-[11px] bg-rose-500 hover:bg-rose-600 text-white rounded transition-colors font-medium"
							on:click={ungroupSelectedElements}
						>
							Ungroup
						</button>
					{:else if type === 'group'}
						<span class="text-[10px] text-gray-500">Protected element</span>
					{:else}
						<span class="text-[10px] text-gray-500">Shift+click to multi-select</span>
					{/if}
				</div>
			</div>

			<div class="pt-4 border-t border-gray-200">
				<label class={fieldLabelClass}>Layer Arrangement</label>
				<div class="flex items-center justify-between gap-1.5">
					<button
						class="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg border-[2px] border-gray-900 shadow-[1px_1px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 flex-1 transition-all"
						title="Bring to Front"
						aria-label="Bring to Front"
						on:click={bringToFront}
					>
						<i class="fa fa-angle-double-up" />
					</button>
					<button
						class="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg border-[2px] border-gray-900 shadow-[1px_1px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 flex-1 transition-all"
						title="Bring Forward"
						aria-label="Bring Forward"
						on:click={bringForward}
					>
						<i class="fa fa-angle-up" />
					</button>
					<button
						class="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg border-[2px] border-gray-900 shadow-[1px_1px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 flex-1 transition-all"
						title="Send Backward"
						aria-label="Send Backward"
						on:click={sendBackwards}
					>
						<i class="fa fa-angle-down" />
					</button>
					<button
						class="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg border-[2px] border-gray-900 shadow-[1px_1px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 flex-1 transition-all"
						title="Send to Back"
						aria-label="Send to Back"
						on:click={sendToBack}
					>
						<i class="fa fa-angle-double-down" />
					</button>
				</div>
			</div>
		{:else if !$editor}
			<!-- Skeleton loading state while canvas initializes -->
			<div class="space-y-4 animate-pulse">
				<div class="flex items-center gap-2 pb-4 border-b border-gray-100">
					<div class="h-6 w-16 bg-gray-200 rounded" />
					<div class="h-4 w-12 bg-gray-100 rounded" />
				</div>
				<div class="space-y-3">
					<div class="h-3 w-20 bg-gray-200 rounded" />
					<div class="h-10 w-full bg-gray-100 border-[2px] border-gray-200 rounded-lg" />
				</div>
				<div class="grid grid-cols-2 gap-2">
					<div class="space-y-1">
						<div class="h-3 w-10 bg-gray-200 rounded" />
						<div class="h-10 bg-gray-100 border-[2px] border-gray-200 rounded-lg" />
					</div>
					<div class="space-y-1">
						<div class="h-3 w-10 bg-gray-200 rounded" />
						<div class="h-10 bg-gray-100 border-[2px] border-gray-200 rounded-lg" />
					</div>
				</div>
				<div class="space-y-1">
					<div class="h-3 w-28 bg-gray-200 rounded" />
					<div class="h-10 bg-gray-100 border-[2px] border-gray-200 rounded-lg" />
				</div>
			</div>
		{:else}
			<div class="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
				<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded uppercase">
					Canvas
				</span>
				<span class="text-xs text-gray-500">Settings</span>
			</div>

			<div>
				<label class={fieldLabelClass}>
					{#if $outputFormat === 'pdf'}
						Page Size
					{:else}
						Presets
					{/if}
				</label>

				{#if $outputFormat === 'pdf'}
					<select
						class={selectClass + ' mt-1'}
						value={$pdfPreset}
						on:change={(e) => {
							const val = e.target.value;
							pageActions.setPdfPreset(val);

							// Also update canvas dimensions based on preset
							let width = 595;
							let height = 842;

							switch (val) {
								case 'A4':
									width = 595;
									height = 842;
									break;
								case 'A4_LANDSCAPE':
									width = 842;
									height = 595;
									break;
								case 'LETTER':
									width = 612;
									height = 792;
									break;
								case 'LETTER_LANDSCAPE':
									width = 792;
									height = 612;
									break;
								case 'LEGAL':
									width = 612;
									height = 1008;
									break;
								case 'A3':
									width = 842;
									height = 1191;
									break;
								case 'TABLOID':
									width = 792;
									height = 1224;
									break;
							}

							if ($editor) {
								$editor.setDimensions({ width, height });
								$editor.renderAll();
							}
						}}
					>
						<option value="A4">A4</option>
						<option value="A4_LANDSCAPE">A4 Landscape</option>
						<option value="LETTER">Letter</option>
						<option value="LETTER_LANDSCAPE">Letter Landscape</option>
						<option value="LEGAL">Legal</option>
						<option value="A3">A3</option>
						<option value="TABLOID">Tabloid</option>
					</select>
				{:else}
					<select
						class={selectClass + ' mt-1'}
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
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-2">
				<div>
					<label class={fieldLabelClass}>
						Width
						<input
							type="number"
							class={inputNumberClass + ' mt-1'}
							value={$editor ? $editor.width : 0}
							min="100"
							max="5000"
							on:change={(e) => {
								if ($editor) {
									$editor.setDimensions({
										width: clampNumber(e.target.value, 100, 5000, 1080),
										height: $editor.height
									});
								}
							}}
						/>
					</label>
				</div>
				<div>
					<label class={fieldLabelClass}>
						Height
						<input
							type="number"
							class={inputNumberClass + ' mt-1'}
							value={$editor ? $editor.height : 0}
							min="100"
							max="5000"
							on:change={(e) => {
								if ($editor) {
									$editor.setDimensions({
										width: $editor.width,
										height: clampNumber(e.target.value, 100, 5000, 1080)
									});
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

<!-- Maximized Chart Data Editor Modal -->
{#if maximizeChartEditor}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
		on:click|self={() => (maximizeChartEditor = false)}
	>
		<div
			class="bg-white rounded-2xl border-[2px] border-gray-900 shadow-[8px_8px_0_0_#1f293780] w-full max-w-3xl h-[600px] flex flex-col"
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-5 py-4 border-b-[2px] border-gray-900">
				<div class="flex items-center gap-3">
					<div
						class="w-8 h-8 bg-[#ffc480] rounded-lg border-[2px] border-gray-900 flex items-center justify-center"
					>
						<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/></svg
						>
					</div>
					<h3 class="text-sm font-black text-gray-900 uppercase tracking-wide">Edit Chart Data</h3>
				</div>
				<div class="flex items-center gap-2">
					<!-- Format Toggle -->
					<div class="flex gap-1 p-1 bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#e5e5e5]">
						<button
							class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {chartDataFormat ===
							'json'
								? 'bg-white text-gray-900 shadow-sm'
								: 'text-gray-600 hover:text-gray-900'}"
							on:click={() => {
								chartDataFormat = 'json';
								loadSampleChartData();
							}}
						>
							<i class="fa fa-code mr-1" />JSON
						</button>
						<button
							class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {chartDataFormat ===
							'csv'
								? 'bg-white text-gray-900 shadow-sm'
								: 'text-gray-600 hover:text-gray-900'}"
							on:click={() => {
								chartDataFormat = 'csv';
								loadSampleChartData();
							}}
						>
							<i class="fa fa-file-csv mr-1" />CSV
						</button>
					</div>
					{#if chartDataFormat === 'csv'}
						<button
							class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
							on:click={formatChartCSV}
							title="Format CSV"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 6h16M4 12h16m-7 6h7"
								/></svg
							>
						</button>
					{/if}
					<button
						class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
						on:click={() => (maximizeChartEditor = false)}
						title="Minimize"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/></svg
						>
					</button>
				</div>
			</div>

			<!-- Editor -->
			<div class="flex-1 min-h-0 p-5">
				{#if chartDataFormat === 'json'}
					<div
						class="border-[2px] border-gray-900 rounded-lg overflow-hidden focus-within:shadow-[4px_4px_0_0_#ffc480] transition-shadow bg-white h-full"
					>
						<CodeMirror
							bind:value={chartDataInput}
							lang={json()}
							styles={{
								'&': {
									height: '100%',
									fontSize: '13px',
									fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
								},
								'.cm-content': { padding: '12px' },
								'.cm-line': { padding: '0' },
								'.cm-gutters': {
									backgroundColor: '#f9fafb',
									color: '#9ca3af',
									borderRight: '1px solid #f3f4f6',
									minWidth: '40px'
								},
								'.cm-scroller': { overflow: 'auto' }
							}}
						/>
					</div>
				{:else}
					<textarea
						class="w-full h-full text-sm font-mono border-gray-900 border-[2px] rounded-lg focus:border-gray-900 focus:shadow-[4px_4px_0_0_#ffc480] focus:ring-0 p-4 resize-none overflow-auto"
						placeholder="label,value&#10;Jan,30&#10;Feb,45"
						bind:value={chartDataInput}
					/>
				{/if}
			</div>

			<!-- Footer -->
			<div class="px-5 py-3 border-t-[2px] border-gray-900 flex items-center justify-between gap-3">
				{#if chartDataError}
					<p class="text-xs text-red-600 flex-1">
						<i class="fa fa-exclamation-circle mr-1" />{chartDataError}
					</p>
				{:else}
					<div class="text-[10px] text-gray-500 flex-1">
						{#if chartDataFormat === 'csv'}
							Format: <code class="bg-gray-100 px-1 rounded">label,value</code> per row
						{:else}
							Format: <code class="bg-gray-100 px-1 rounded">[{'{'}label, value{'}'}]</code>
						{/if}
					</div>
				{/if}
				<div class="flex gap-2">
					<button
						class="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border-[2px] border-gray-900 hover:bg-gray-200 transition-colors"
						on:click={loadSampleChartData}
					>
						<i class="fa fa-undo mr-1" />Load Current
					</button>
					<button
						class="px-4 py-2 bg-[#ffc480] text-gray-900 text-xs font-bold rounded-lg border-[2px] border-gray-900 shadow-[3px_3px_0_0_#1f293780] hover:shadow-[1px_1px_0_0_#1f293780] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						on:click={() => {
							applyChartDataFromInput();
							if (!chartDataError) maximizeChartEditor = false;
						}}
					>
						<i class="fa fa-check mr-1" />Apply
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Maximized Table Data Editor Modal -->
{#if maximizeTableEditor}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
		on:click|self={() => (maximizeTableEditor = false)}
	>
		<div
			class="bg-white rounded-2xl border-[2px] border-gray-900 shadow-[8px_8px_0_0_#1f293780] w-full max-w-3xl h-[600px] flex flex-col"
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-5 py-4 border-b-[2px] border-gray-900">
				<div class="flex items-center gap-3">
					<div
						class="w-8 h-8 bg-[#a2ffc1] rounded-lg border-[2px] border-gray-900 flex items-center justify-center"
					>
						<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
							/></svg
						>
					</div>
					<h3 class="text-sm font-black text-gray-900 uppercase tracking-wide">Edit Table Data</h3>
				</div>
				<div class="flex items-center gap-2">
					<!-- Format Toggle -->
					<div class="flex gap-1 p-1 bg-white border-[2px] border-gray-900 rounded-lg shadow-[1px_1px_0_0_#e5e5e5]">
						<button
							class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {tableDataFormat ===
							'json'
								? 'bg-white text-gray-900 shadow-sm'
								: 'text-gray-600 hover:text-gray-900'}"
							on:click={() => {
								tableDataFormat = 'json';
								loadSampleTableData();
							}}
						>
							<i class="fa fa-code mr-1" />JSON
						</button>
						<button
							class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {tableDataFormat ===
							'csv'
								? 'bg-white text-gray-900 shadow-sm'
								: 'text-gray-600 hover:text-gray-900'}"
							on:click={() => {
								tableDataFormat = 'csv';
								loadSampleTableData();
							}}
						>
							<i class="fa fa-file-csv mr-1" />CSV
						</button>
					</div>
					{#if tableDataFormat === 'csv'}
						<button
							class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
							on:click={formatTableCSV}
							title="Format CSV"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 6h16M4 12h16m-7 6h7"
								/></svg
							>
						</button>
					{/if}
					<button
						class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
						on:click={() => (maximizeTableEditor = false)}
						title="Minimize"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/></svg
						>
					</button>
				</div>
			</div>

			<!-- Editor -->
			<div class="flex-1 min-h-0 p-5">
				{#if tableDataFormat === 'json'}
					<div
						class="border-[2px] border-gray-900 rounded-lg overflow-hidden focus-within:shadow-[4px_4px_0_0_#ffc480] transition-shadow bg-white h-full"
					>
						<CodeMirror
							bind:value={tableDataInput}
							lang={json()}
							styles={{
								'&': {
									height: '100%',
									fontSize: '13px',
									fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
								},
								'.cm-content': { padding: '12px' },
								'.cm-line': { padding: '0' },
								'.cm-gutters': {
									backgroundColor: '#f9fafb',
									color: '#9ca3af',
									borderRight: '1px solid #f3f4f6',
									minWidth: '40px'
								},
								'.cm-scroller': { overflow: 'auto' }
							}}
						/>
					</div>
				{:else}
					<textarea
						class="w-full h-full text-sm font-mono border-gray-900 border-[2px] rounded-lg focus:border-gray-900 focus:shadow-[4px_4px_0_0_#ffc480] focus:ring-0 p-4 resize-none overflow-auto"
						placeholder="Header1,Header2,Header3&#10;Value1,Value2,Value3"
						bind:value={tableDataInput}
					/>
				{/if}
			</div>

			<!-- Footer -->
			<div class="px-5 py-3 border-t-[2px] border-gray-900 flex items-center justify-between gap-3">
				{#if tableDataError}
					<p class="text-xs text-red-600 flex-1">
						<i class="fa fa-exclamation-circle mr-1" />{tableDataError}
					</p>
				{:else}
					<div class="text-[10px] text-gray-500 flex-1">
						{#if tableDataFormat === 'csv'}
							Format: <code class="bg-gray-100 px-1 rounded">Header1,Header2</code> first row, then data
							rows
						{:else}
							Format: <code class="bg-gray-100 px-1 rounded"
								>{'{'}headers: [...], rows: [[...]]{'}'}</code
							>
						{/if}
					</div>
				{/if}
				<div class="flex gap-2">
					<button
						class="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border-[2px] border-gray-900 hover:bg-gray-200 transition-colors"
						on:click={loadSampleTableData}
					>
						<i class="fa fa-undo mr-1" />Load Current
					</button>
					<button
						class="px-4 py-2 bg-[#ffc480] text-gray-900 text-xs font-bold rounded-lg border-[2px] border-gray-900 shadow-[3px_3px_0_0_#1f293780] hover:shadow-[1px_1px_0_0_#1f293780] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						on:click={() => {
							applyTableDataFromInput();
							if (!tableDataError) maximizeTableEditor = false;
						}}
					>
						<i class="fa fa-check mr-1" />Apply
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
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
