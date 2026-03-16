<script>
	import EditorLayout from '../../editor/EditorLayout.svelte';
	import { editor } from '../../../../store/editor.store';
	import { onMount, onDestroy } from 'svelte';
	import { getHTMLandCSS } from '../../../html-to-gif/create-media';
	import { FabricImage, Group } from 'fabric';
	import {
		createTemplateAction,
		updateTemplateAction,
		template
	} from '../../../../store/template.store';
	import {
		extractVariablesFromExpression,
		generateSampleData,
		getVariableType as getExpressionVariableType
	} from '../../../utils/expression-parser';
	import { get } from 'svelte/store';
	import { variables as variablesStore, variableActions } from '../../../../store/variables.store';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '../../../../store/toast.store';
	import { user, getUser } from '../../../../store/user.store';
	import CopyIcon from '$lib/assets/dashboard/Copy Icons.png';
	import { goto } from '$app/navigation';
	import {
		pages,
		currentPageIndex,
		outputFormat,
		pdfPreset,
		pageActions
	} from '../../../../store/pages.store';
	import { loadBrandFonts, isBrandFont } from '../../../utils/brand-fonts-loader';
	import { preloadFont } from '../../../../api/fonts';
	import AuthModal from '../../editor/AuthModal.svelte';
	import backend from '../../../../service/backend';
	import { convertFigmaToFabric } from '../../../utils/figma-converter';

	let fabricCanvas;

	let templateName = '';
	export let templateType = 'og-image'; // Default type
	export let formatType = 'image'; // 'image' or 'pdf' (passed from parent route)
	export let isEdit = false;
	export let guestMode = false;
	export let initialConfig = null; // { outputFormat, pdfPreset, width, height }
	export let figmaImportId = null; // From ?figmaImport= query param (Figma plugin)

	let editorTemplate = null;
	let figmaImportHandled = false;
	let hasLoadedTemplate = false; // Track if we've already loaded the template
	let currentLayoutKey = null; // Active layout key, bound from EditorLayout

	/**
	 * Recursively flatten nested groups so only leaf objects remain.
	 * The top-level group is created separately — this processes its children.
	 */
	function flattenNestedGroups(objects) {
		const flat = [];
		for (const obj of objects) {
			if (obj.type === 'group' && obj._objects) {
				const groupOpacity = obj.opacity ?? 1;
				const children = obj.removeAll();
				for (const child of children) {
					child.set({ opacity: (child.opacity ?? 1) * groupOpacity });
					flat.push(child);
				}
				const deeper = flattenNestedGroups(flat.splice(flat.length - children.length, children.length));
				flat.push(...deeper);
			} else {
				flat.push(obj);
			}
		}
		return flat;
	}

	let unsubscribe = () => {};
	let templateUnsubscribe = () => {};
	let pagesUnsubscribe = () => {};
	let isSaving = false;
	let showAuthModal = false;
	let shouldGenerateAfterSave = false;

	const DRAFT_KEY = 'pictify_template_draft_v1';
	let pendingDraft = null;
	let hasAppliedDraft = false;

	const templateTypes = [
		{ label: 'OG Image', value: 'og-image' },
		{ label: 'Invoice', value: 'invoice' },
		{ label: 'Social Media', value: 'social-media' }
	];

	async function handleFigmaAutoImport(canvas) {
		if (!figmaImportId || figmaImportHandled || !canvas) return;
		figmaImportHandled = true;

		try {
			toast.set({ message: 'Loading Figma import...', type: 'info', duration: 3000 });
			const data = await backend.get(`/figma/plugin/import/${figmaImportId}`);
			if (!data.nodeTree) return;


			const result = await convertFigmaToFabric(data.nodeTree, {
				fallbackImages: data.fallbackImages || {},
				metadata: data.metadata
			});
			const { objects, fonts, _debug } = result;


			if (_debug?.errorCount > 0) {
			}

			if (objects.length === 0) return;

			for (const fontFamily of fonts) {
				try {
					await document.fonts.load(`16px "${fontFamily}"`);
				} catch {}
			}

			if (window.__historyBatchStart) window.__historyBatchStart();

			// Flatten nested groups so all elements are directly accessible
			const flatObjects = flattenNestedGroups(objects);

			const importGroup = new Group(flatObjects, {
				figmaImport: true,
				name: data.metadata?.frameName || 'Figma Import',
				subTargetCheck: true,
				interactive: true
			});

			const maxWidth = canvas.width * 0.9;
			const maxHeight = canvas.height * 0.9;
			const scale = Math.min(
				maxWidth / (importGroup.width || 1),
				maxHeight / (importGroup.height || 1),
				1
			);

			importGroup.set({
				left: canvas.width / 2,
				top: canvas.height / 2,
				originX: 'center',
				originY: 'center',
				scaleX: scale,
				scaleY: scale
			});

			canvas.add(importGroup);
			canvas.setActiveObject(importGroup);
			canvas.renderAll();

			if (window.__historyBatchEnd) window.__historyBatchEnd();
			toast.set({
				message: `Imported "${data.metadata?.frameName || 'design'}" from Figma`,
				type: 'success',
				duration: 3000
			});
		} catch (err) {
			toast.set({
				message: 'Failed to load Figma import: ' + (err.message || 'Unknown error'),
				type: 'error',
				duration: 5000
			});
		}
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'Copied to clipboard!', type: 'success', duration: 1500 });
		});
	}

	/**
	 * Extract variable definitions from FabricJS canvas objects
	 */
	function extractVariableDefinitions() {
		if (!fabricCanvas) return [];

		const objects = fabricCanvas.getObjects();
		// Map to track unique variables by name to avoid duplicates
		const variableMap = new Map();

		// Get current variables from store for type overrides
		const storeVariables = get(variablesStore);
		const storeVariableMap = new Map(storeVariables.map((v) => [v.name, v]));

		// 1. Extract variables from variableBindings array (new format)
		objects.forEach((obj) => {
			if (obj.isVariable && obj.variableBindings && Array.isArray(obj.variableBindings)) {
				// Ensure object has an ID for tracking
				if (!obj.id) {
					const uniqueId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
					obj.set('id', uniqueId);
				}

				// Process each binding
				obj.variableBindings.forEach((binding) => {
					const varName = binding.variableName;
					if (varName && !variableMap.has(varName)) {
						// Check if user has overridden the type in the variables store
						const storeVar = storeVariableMap.get(varName);
						const inferredType = getVariableTypeForProperty(obj, binding.property);

						variableMap.set(varName, {
							name: varName,
							// Use store type if available, otherwise infer from property
							type: storeVar?.type || inferredType,
							// Use store default value if available, otherwise infer from property
							defaultValue:
								storeVar?.defaultValue ?? getDefaultValueForProperty(obj, binding.property),
							description: storeVar?.description || binding.description || '',
							elementId: obj.id,
							property: binding.property,
							validation: { required: storeVar?.required ?? binding.required ?? false },
							source: 'property'
						});
					}
				});
			}
		});

		// 2. Extract variables from conditional visibility (showWhen/hideWhen)
		objects.forEach((obj) => {
			const showWhen = obj.showWhen;
			const hideWhen = obj.hideWhen;

			if (showWhen || hideWhen) {
				const expression = showWhen || hideWhen;
				const extractedVars = extractVariablesFromExpression(expression);

				extractedVars.forEach((extractedVar) => {
					if (!variableMap.has(extractedVar.name)) {
						// Check if user has overridden the type in the variables store
						const storeVar = storeVariableMap.get(extractedVar.name);
						const inferredType = getExpressionVariableType(extractedVar, 'condition');

						variableMap.set(extractedVar.name, {
							name: extractedVar.name,
							type: storeVar?.type || inferredType,
							defaultValue: storeVar?.defaultValue ?? generateSampleData(extractedVar, 'condition'),
							description:
								storeVar?.description || `Used in ${showWhen ? 'show' : 'hide'} condition`,
							elementId: `condition_${extractedVar.name}`,
							property: (storeVar?.type || inferredType) === 'object' ? 'data' : 'value',
							validation: { required: storeVar?.required ?? false },
							source: 'condition',
							isObject: extractedVar.isObject,
							properties: extractedVar.properties
						});
					}
				});
			}
		});

		// 3. Extract variables from loop/repeat configurations
		objects.forEach((obj) => {
			const loopVariable = obj.loopVariable;

			if (loopVariable && loopVariable !== null && loopVariable !== '') {
				if (!variableMap.has(loopVariable)) {
					// Check if user has overridden the type in the variables store
					const storeVar = storeVariableMap.get(loopVariable);

					variableMap.set(loopVariable, {
						name: loopVariable,
						type: storeVar?.type || 'array',
						defaultValue:
							storeVar?.defaultValue ?? generateSampleData({ name: loopVariable }, 'loop'),
						description: storeVar?.description || `Array variable for repeating element`,
						elementId: `loop_${loopVariable}`,
						property: 'items',
						validation: { required: storeVar?.required ?? false },
						source: 'loop',
						loopItemName: obj.loopItemName,
						loopDirection: obj.loopDirection
					});
				}
			}
		});

		// 4. Include custom variables from store that aren't tied to canvas objects
		storeVariables.forEach((storeVar) => {
			if (storeVar.source === 'custom' && !variableMap.has(storeVar.name)) {
				variableMap.set(storeVar.name, {
					name: storeVar.name,
					type: storeVar.type,
					defaultValue: storeVar.defaultValue,
					description: storeVar.description || '',
					elementId: storeVar.id || `custom_${storeVar.name}`,
					property: 'value',
					validation: { required: storeVar.required ?? false },
					source: 'custom'
				});
			}
		});

		const variables = Array.from(variableMap.values());


		return variables;
	}

	function getVariableTypeForProperty(obj, property) {
		switch (property) {
			case 'text':
				return 'text';
			case 'src':
				return 'image';
			case 'fill':
			case 'stroke':
			case 'backgroundColor':
				return 'color';
			case 'opacity':
			case 'fontSize':
			case 'strokeWidth':
				return 'number';
			case 'chartData':
				return 'chart';
			case 'tableData':
				return 'table';
			default:
				return 'text';
		}
	}

	function getDefaultValueForProperty(obj, property) {
		switch (property) {
			case 'text':
				return obj.text || '';
			case 'src':
				return obj.src || '';
			case 'fill':
				return obj.fill || '#000000';
			case 'stroke':
				return obj.stroke || '#000000';
			case 'backgroundColor':
				return obj.backgroundColor || '';
			case 'opacity':
				return obj.opacity ?? 1;
			case 'fontSize':
				return obj.fontSize || 16;
			case 'strokeWidth':
				return obj.strokeWidth || 1;
			case 'fontFamily':
				return obj.fontFamily || 'Arial';
			case 'fontWeight':
				return obj.fontWeight || 'normal';
			case 'chartData':
				return obj.chartData || [];
			case 'tableData':
				return obj.tableData || {};
			default:
				return obj[property] || '';
		}
	}

	/**
	 * Ensure all canvas objects have unique IDs
	 * This is required for matching objects when loading templates
	 */
	function ensureAllObjectsHaveIds() {
		if (!fabricCanvas) return;

		const objects = fabricCanvas.getObjects();
		objects.forEach((obj, index) => {
			if (!obj.id) {
				const uniqueId = `obj_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
				obj.id = uniqueId; // Direct property assignment
			}
		});
	}

	/**
	 * Serialize canvas to JSON with custom properties
	 * Fabric.js v6 doesn't always include custom properties even when specified,
	 * so we manually add them after serialization
	 */
	function serializeCanvasWithCustomProps() {
		if (!fabricCanvas) return null;

		// Get base JSON with all custom properties
		const json = fabricCanvas.toJSON([
			'id',
			'isVariable',
			'variableBindings',
			// Chart properties
			'isChart',
			'chartType',
			'chartData',
			'chartConfig',
			// Table properties
			'isTable',
			'tableType',
			'tableHeaders',
			'tableRows',
			'tableData',
			'tableConfig',
			'tableStyle',
			// QR Code properties
			'isQRCode',
			'qrData',
			'qrConfig',
			// Conditional logic properties
			'showWhen',
			'hideWhen',
			// Loop/repeat properties
			'loopVariable',
			'loopItemName',
			'loopIndexName',
			'loopDirection',
			'loopSpacing',
			'loopColumns',
			// Pattern fill properties
			'isPatternFill',
			'patternSourceJSON',
			'patternBoundsWidth',
			'patternBoundsHeight',
			'patternSpacingX',
			'patternSpacingY',
			'patternStagger'
		]);

		// Get actual canvas objects to read custom properties
		const canvasObjects = fabricCanvas.getObjects();

		// Manually ensure custom properties are included
		if (json.objects && canvasObjects.length === json.objects.length) {
			json.objects = json.objects.map((objJson, index) => {
				const canvasObj = canvasObjects[index];

				// Base custom properties
				const result = {
					...objJson,
					id: canvasObj.id || objJson.id,
					isVariable: canvasObj.isVariable || false,
					variableBindings: canvasObj.variableBindings || []
				};

				// Conditional logic properties
				if (canvasObj.showWhen !== undefined) result.showWhen = canvasObj.showWhen;
				if (canvasObj.hideWhen !== undefined) result.hideWhen = canvasObj.hideWhen;

				// Loop/repeat properties
				if (canvasObj.loopVariable !== undefined) result.loopVariable = canvasObj.loopVariable;
				if (canvasObj.loopItemName !== undefined) result.loopItemName = canvasObj.loopItemName;
				if (canvasObj.loopIndexName !== undefined) result.loopIndexName = canvasObj.loopIndexName;
				if (canvasObj.loopDirection !== undefined) result.loopDirection = canvasObj.loopDirection;
				if (canvasObj.loopSpacing !== undefined) result.loopSpacing = canvasObj.loopSpacing;
				if (canvasObj.loopColumns !== undefined) result.loopColumns = canvasObj.loopColumns;

				// Chart-specific properties
				if (canvasObj.isChart) {
					result.isChart = true;
					result.chartType = canvasObj.chartType || 'bar';
					result.chartData = canvasObj.chartData || [];
					result.chartConfig = canvasObj.chartConfig || {};
				}

				// Table-specific properties
				if (canvasObj.isTable) {
					result.isTable = true;
					result.tableType = canvasObj.tableType || 'standard';
					result.tableHeaders = canvasObj.tableHeaders || [];
					result.tableRows = canvasObj.tableRows || [];
					result.tableData = canvasObj.tableData || null;
					result.tableConfig = canvasObj.tableConfig || {};
					result.tableStyle = canvasObj.tableStyle || 'modern';
				}

				// QR Code properties
				if (canvasObj.isQRCode) {
					result.isQRCode = true;
					result.qrData = canvasObj.qrData || '';
					result.qrConfig = canvasObj.qrConfig || {};
				}

				// Pattern fill properties
				if (canvasObj.isPatternFill) {
					result.isPatternFill = true;
					result.patternSourceJSON = canvasObj.patternSourceJSON || null;
					result.patternBoundsWidth = canvasObj.patternBoundsWidth || 400;
					result.patternBoundsHeight = canvasObj.patternBoundsHeight || 400;
					result.patternSpacingX = canvasObj.patternSpacingX || 0;
					result.patternSpacingY = canvasObj.patternSpacingY || 0;
					result.patternStagger = canvasObj.patternStagger || false;
				}

				return result;
			});
		}

		return json;
	}

	const updateTemplate = async () => {
		if (!templateName.trim()) {
			toast.set({ message: 'Please enter a template name', type: 'warning', duration: 1500 });
			return;
		}

		isSaving = true;
		try {
			// Ensure all objects have IDs before serialization
			ensureAllObjectsHaveIds();

			// Serialize with custom properties
			const fabricJSData = serializeCanvasWithCustomProps();

			// Debug: Log what we're saving

			const width = fabricCanvas.width;
			const height = fabricCanvas.height;
			const variableDefinitions = extractVariableDefinitions();

			// Prepare multi-page data
			const currentPages = get(pages);
			const currentIndex = get(currentPageIndex);
			const updatedPages = currentPages.map((p, i) =>
				i === currentIndex ? { ...p, fabricJSData } : p
			);

			// Handle layout-aware save (H5): active canvas goes to correct slot
			const storeData = get(template);
			let layoutsForSave = { ...(storeData.layouts || {}) };
			let defaultFabricData = fabricJSData;

			if (currentLayoutKey && layoutsForSave[currentLayoutKey]) {
				// Viewing a non-default layout — live canvas belongs to that layout
				layoutsForSave[currentLayoutKey] = {
					...layoutsForSave[currentLayoutKey],
					fabricJSData
				};
				// Default stays from store (was saved on last layout switch)
				defaultFabricData = storeData.fabricJSData;
			}

			const templateData = {
				...editorTemplate,
				name: templateName,
				fabricJSData: defaultFabricData,
				width: currentLayoutKey === null ? width : (storeData.width || width),
				height: currentLayoutKey === null ? height : (storeData.height || height),
				type: templateType,
				variableDefinitions,
				outputFormat: get(outputFormat),
				pdfPreset: get(pdfPreset),
				pages: updatedPages,
				layouts: layoutsForSave
			};

			const result = await updateTemplateAction(templateData);
			if (result) {
				// Draft is now saved; clear it.
				try {
					localStorage.removeItem(DRAFT_KEY);
				} catch (e) { /* ignored */ }

				// Update the template store with the updated template
				template.set(result);
				editorTemplate = result;

				const varCount = variableDefinitions.length;
				const message =
					varCount > 0
						? `Template updated with ${varCount} variable${varCount > 1 ? 's' : ''}!`
						: 'Template updated successfully!';
				toast.set({ message, type: 'success', duration: 2000 });
			} else {
				toast.set({ message: 'Failed to update template', type: 'error', duration: 1500 });
			}
		} catch (error) {
			toast.set({ message: 'Failed to update template', type: 'error', duration: 1500 });
		} finally {
			isSaving = false;
		}
	};

	const createTemplate = async () => {
		if (!templateName.trim()) {
			toast.set({ message: 'Please enter a template name', type: 'warning', duration: 1500 });
			return;
		}

		isSaving = true;
		try {
			// Ensure all objects have IDs before serialization
			ensureAllObjectsHaveIds();

			// Serialize with custom properties
			const fabricJSData = serializeCanvasWithCustomProps();
			const width = fabricCanvas.width;
			const height = fabricCanvas.height;
			const variableDefinitions = extractVariableDefinitions();

			// Prepare multi-page data
			const currentPages = get(pages);
			const currentIndex = get(currentPageIndex);
			const updatedPages = currentPages.map((p, i) =>
				i === currentIndex ? { ...p, fabricJSData } : p
			);

			const templateData = {
				name: templateName,
				fabricJSData,
				width,
				height,
				type: templateType,
				variableDefinitions,
				outputFormat: get(outputFormat),
				pdfPreset: get(pdfPreset),
				pages: updatedPages
			};

			const result = await createTemplateAction(templateData);
			if (result) {
				// Draft is now saved; clear it.
				try {
					localStorage.removeItem(DRAFT_KEY);
				} catch (e) { /* ignored */ }

				// Update the template store with the created template (includes UID)
				// This allows the Variables panel to immediately test the API
				template.set(result);
				editorTemplate = result;

				const varCount = variableDefinitions.length;
				const message =
					varCount > 0
						? `Template created with ${varCount} variable${
								varCount > 1 ? 's' : ''
						  }! You can now test the API.`
						: 'Template created successfully!';
				toast.set({ message, type: 'success', duration: 2500 });

				// Redirect to the edit view for this template
				// Use format-specific URL to ensure correct mode is preserved
				const currentFormat = get(outputFormat);
				const formatPath = currentFormat === 'pdf' ? 'pdf' : 'image';
				goto(`/template-workspace/${formatPath}/${result.uid}`, { replaceState: true });
			} else {
				toast.set({ message: 'Failed to create template', type: 'error', duration: 1500 });
			}
		} catch (error) {
			toast.set({ message: 'Failed to create template', type: 'error', duration: 1500 });
		} finally {
			isSaving = false;
		}
	};

	const saveTemplate = async () => {
		if (guestMode) {
			// Persist the current canvas as a draft, then prompt signup.
			try {
				if (fabricCanvas) {
					ensureAllObjectsHaveIds();
					const draft = {
						version: 1,
						name: templateName || 'Template draft',
						type: templateType || 'og-image',
						width: fabricCanvas.width,
						height: fabricCanvas.height,
						fabricJSData: serializeCanvasWithCustomProps()
					};
					localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
				}
			} catch (e) { /* ignored */ }

			toast.set({
				message: 'Create a free account to save templates and use the API.',
				type: 'default',
				duration: 2500
			});
			showAuthModal = true;
			return;
		}
		if (isEdit) {
			await updateTemplate();
		} else {
			await createTemplate();
		}
	};

	/**
	 * Load template data into the canvas with proper handling for custom properties
	 */
	function loadTemplateIntoCanvas() {

		if (!fabricCanvas || !editorTemplate?.fabricJSData || hasLoadedTemplate) {
			return;
		}

		hasLoadedTemplate = true;

		// Load saved variable definitions BEFORE canvas sync
		// This ensures user-specified types are preserved when syncFromCanvas runs
		if (editorTemplate.variableDefinitions && editorTemplate.variableDefinitions.length > 0) {
			variableActions.loadFromDefinitions(editorTemplate.variableDefinitions);
		}

		// Start history batch to prevent saving during load
		if (typeof window !== 'undefined' && window.__historyBatchStart) {
			window.__historyBatchStart();
		}

		// For Fabric.js v6, loadFromJSON returns a promise but also supports callback
		// We need to ensure custom properties are properly restored
		const fabricData = editorTemplate.fabricJSData;

		// Set canvas dimensions from template
		if (editorTemplate.width && editorTemplate.height) {
			fabricCanvas.setDimensions({
				width: editorTemplate.width,
				height: editorTemplate.height
			});
		}


		// Fabric.js v6 loadFromJSON returns a Promise
		const loadPromise = fabricCanvas.loadFromJSON(fabricData);

		if (loadPromise && typeof loadPromise.then === 'function') {
			loadPromise
				.then(() => {

					// Get all canvas objects
					const objects = fabricCanvas.getObjects();
					const fabricDataObjects = fabricData.objects || [];

					// Restore custom properties from fabricJSData
					objects.forEach((obj, index) => {
						const objData = fabricDataObjects[index];
						if (objData) {
							// Restore variable bindings
							if (
								objData.isVariable &&
								objData.variableBindings &&
								Array.isArray(objData.variableBindings)
							) {
								obj.set({
									isVariable: true,
									variableBindings: objData.variableBindings
								});
							}

							// Conditional logic properties
							if (objData.showWhen !== undefined && objData.showWhen !== null) {
								obj.set('showWhen', objData.showWhen);
							}
							if (objData.hideWhen !== undefined && objData.hideWhen !== null) {
								obj.set('hideWhen', objData.hideWhen);
							}

							// Loop/repeat properties
							if (objData.loopVariable !== undefined && objData.loopVariable !== null) {
								obj.set({
									loopVariable: objData.loopVariable,
									loopItemName: objData.loopItemName || 'item',
									loopIndexName: objData.loopIndexName || 'index',
									loopDirection: objData.loopDirection || 'vertical',
									loopSpacing: objData.loopSpacing || 50,
									loopColumns: objData.loopColumns || 3
								});
							}

							// Chart properties
							if (objData.isChart) {
								obj.set({
									isChart: true,
									chartType: objData.chartType || 'bar',
									chartData: objData.chartData || [],
									chartConfig: objData.chartConfig || {}
								});
							}

							// Table properties
							if (objData.isTable) {
								obj.set({
									isTable: true,
									tableType: objData.tableType || 'standard',
									tableHeaders: objData.tableHeaders || [],
									tableRows: objData.tableRows || [],
									tableData: objData.tableData || null,
									tableConfig: objData.tableConfig || {},
									tableStyle: objData.tableStyle || 'modern'
								});
							}

							// QR Code properties
							if (objData.isQRCode) {
								obj.set({
									isQRCode: true,
									qrData: objData.qrData || '',
									qrConfig: objData.qrConfig || {}
								});
							}
						}
					});

					// Force render the canvas
					fabricCanvas.requestRenderAll();
					fabricCanvas.renderAll();

					// Log variable count for debugging
					const variableCount = objects.filter((o) => o.isVariable).length;

					// Ensure all fonts used by text objects are fully loaded, then re-render
					// This fixes brand fonts (and slow Google Fonts) showing as fallback on refresh
					const textObjects = objects.filter(
						(o) => o.type === 'i-text' || o.type === 'text' || o.type === 'textbox'
					);
					if (textObjects.length > 0) {
						const uniqueFonts = [
							...new Set(textObjects.map((o) => o.fontFamily).filter((f) => f && f !== 'Arial'))
						];
						if (uniqueFonts.length > 0) {
							loadBrandFonts().then((brandFamilies) => {
								const brandSet = new Set((brandFamilies || []).map((f) => f.toLowerCase()));
								uniqueFonts.forEach((font) => {
									if (!brandSet.has(font.toLowerCase())) {
										preloadFont(font);
									}
								});
								const fontLoadPromises = uniqueFonts.map((font) =>
									document.fonts.load(`12px "${font}"`).catch(() => null)
								);
								Promise.all(fontLoadPromises)
									.then(() => document.fonts.ready)
									.then(() => {
										textObjects.forEach((obj) => {
											if (obj._clearCache) obj._clearCache();
											if (obj.initDimensions) obj.initDimensions();
											if (obj.setCoords) obj.setCoords();
											obj.dirty = true;
										});
										fabricCanvas.requestRenderAll();
									});
							});
						}
					}

					// End history batch after load completes
					setTimeout(() => {
						if (typeof window !== 'undefined' && window.__historyBatchEnd) {
							window.__historyBatchEnd();
						}
						// One more render to be sure
						fabricCanvas.requestRenderAll();

						// Fire a custom event to notify other components (like VariablesPanel)
						// that the canvas content has been updated
						fabricCanvas.fire('object:modified', { target: null });
					}, 100);
				})
				.catch((err) => {
					hasLoadedTemplate = false; // Allow retry on error
					// End history batch on error too
					if (typeof window !== 'undefined' && window.__historyBatchEnd) {
						window.__historyBatchEnd();
					}
				});
		} else {
			// Fallback for older Fabric.js versions
			fabricCanvas.renderAll();
			if (typeof window !== 'undefined' && window.__historyBatchEnd) {
				window.__historyBatchEnd();
			}
		}
	}

	/**
	 * Attempt to load template - called when either canvas or template becomes available
	 */
	function attemptTemplateLoad() {

		if (isEdit && fabricCanvas && editorTemplate?.fabricJSData && !hasLoadedTemplate) {
			// Wait for canvas to be fully initialized (Canvas.svelte has a 500ms init delay)
			setTimeout(() => {
				loadTemplateIntoCanvas();
			}, 600);
		}
	}

	function applyDraftToCanvas() {
		if (isEdit || !fabricCanvas || !pendingDraft || hasAppliedDraft) return;

		hasAppliedDraft = true;

		// Prefill metadata
		templateName = pendingDraft.name || templateName || 'Template from tool';
		templateType = pendingDraft.type || templateType || 'og-image';

		// Resize canvas to match the generated output
		const nextWidth = Number(pendingDraft.width) || fabricCanvas.width || 1200;
		const nextHeight = Number(pendingDraft.height) || fabricCanvas.height || 630;
		fabricCanvas.setDimensions({ width: nextWidth, height: nextHeight });

		// Remove any default objects
		try {
			fabricCanvas.getObjects().forEach((obj) => fabricCanvas.remove(obj));
		} catch (e) { /* ignored */ }

		// Check if we have full FabricJS data (pre-built template from use case)
		if (pendingDraft.fabricJSData && pendingDraft.fabricJSData.objects) {

			// Start history batch to prevent saving during load
			if (typeof window !== 'undefined' && window.__historyBatchStart) {
				window.__historyBatchStart();
			}

			const fabricData = pendingDraft.fabricJSData;

			// Load the full FabricJS template
			const loadPromise = fabricCanvas.loadFromJSON(fabricData);

			if (loadPromise && typeof loadPromise.then === 'function') {
				loadPromise
					.then(() => {
						// Restore custom properties (variable bindings, etc.)
						const objects = fabricCanvas.getObjects();
						const fabricDataObjects = fabricData.objects || [];

						objects.forEach((obj, index) => {
							const objData = fabricDataObjects[index];
							if (objData) {
								// Restore variable bindings
								if (
									objData.isVariable &&
									objData.variableBindings &&
									Array.isArray(objData.variableBindings)
								) {
									obj.set({
										isVariable: true,
										variableBindings: objData.variableBindings
									});
								}

								// Restore ID if present
								if (objData.id) {
									obj.set('id', objData.id);
								}

								// Conditional logic properties
								if (objData.showWhen !== undefined) obj.set('showWhen', objData.showWhen);
								if (objData.hideWhen !== undefined) obj.set('hideWhen', objData.hideWhen);

								// Loop/repeat properties
								if (objData.loopVariable !== undefined) {
									obj.set({
										loopVariable: objData.loopVariable,
										loopItemName: objData.loopItemName || 'item',
										loopDirection: objData.loopDirection || 'vertical',
										loopSpacing: objData.loopSpacing || 50
									});
								}
							}
						});

						fabricCanvas.requestRenderAll();
						fabricCanvas.renderAll();

						const variableCount = objects.filter((o) => o.isVariable).length;

						// End history batch after load completes
						setTimeout(() => {
							if (typeof window !== 'undefined' && window.__historyBatchEnd) {
								window.__historyBatchEnd();
							}
							fabricCanvas.requestRenderAll();
							// Fire event to notify other components
							fabricCanvas.fire('object:modified', { target: null });
						}, 100);

						toast.set({
							message: `Template loaded with ${variableCount} variable${
								variableCount !== 1 ? 's' : ''
							}. Customize and save!`,
							type: 'success',
							duration: 2500
						});
					})
					.catch((err) => {
						if (typeof window !== 'undefined' && window.__historyBatchEnd) {
							window.__historyBatchEnd();
						}
						toast.set({
							message: 'Could not load template. Try adding elements manually.',
							type: 'error',
							duration: 2500
						});
					});
			} else {
				fabricCanvas.renderAll();
			}
		}
		// Fallback: Import generated output as a background layer (original behavior)
		else if (pendingDraft.backgroundImageUrl) {
			FabricImage.fromURL(pendingDraft.backgroundImageUrl, { crossOrigin: 'anonymous' })
				.then((img) => {
					const center = fabricCanvas.getCenter();
					img.set({
						left: center.left,
						top: center.top,
						originX: 'center',
						originY: 'center',
						selectable: false,
						evented: false
					});

					// Fit-to-canvas (contain)
					const scaleX = nextWidth / (img.width || nextWidth);
					const scaleY = nextHeight / (img.height || nextHeight);
					const scale = Math.min(scaleX, scaleY);
					img.scale(scale);

					fabricCanvas.add(img);
					fabricCanvas.sendToBack(img);
					fabricCanvas.renderAll();

					toast.set({
						message: 'Imported your generated output as a background. Add variables on top →',
						type: 'success',
						duration: 2500
					});
				})
				.catch(() => {
					toast.set({
						message: 'Could not import background image. You can add it from the Assets panel.',
						type: 'error',
						duration: 2500
					});
				});
		} else {
			fabricCanvas.renderAll();
		}

		// Do not auto-consume the draft here.
		// We clear it after the user saves successfully (create/update),
		// and guest mode uses it to carry state across signup.
	}

	// Handle auth success
	async function handleAuthSuccess() {
		// User is now logged in - reload user state
		await getUser();

		// Check if we're still in guest mode
		if (!$user?.email) {
			return;
		}

		// Update guestMode
		guestMode = false;

		toast.set({
			message: 'Welcome! You can now save your template.',
			type: 'success',
			duration: 2000
		});

		// Small delay to ensure state updates
		setTimeout(async () => {
			// Save the template
			await saveTemplate();

			// If we should generate after save, trigger it
			if (shouldGenerateAfterSave) {
				// Dispatch event to trigger generation
				setTimeout(() => {
					const event = new CustomEvent('trigger-generate-after-login');
					window.dispatchEvent(event);
				}, 1000);
			}
		}, 500);
	}

	// Listen for save-and-generate event from VariablesPanel
	function handleSaveAndGenerate(event) {
		if (event.detail?.generateAfterSave) {
			shouldGenerateAfterSave = true;
			saveTemplate();
		}
	}

	onMount(() => {

		// Listen for save-and-generate events
		window.addEventListener('save-template-and-generate', handleSaveAndGenerate);

		// Read draft from tools (if any). Only used for create flow.
		if (!isEdit) {
			try {
				const raw = localStorage.getItem(DRAFT_KEY);
				pendingDraft = raw ? JSON.parse(raw) : null;
			} catch (e) {
				pendingDraft = null;
			}
		}

		unsubscribe = editor.subscribe((e) => {
			fabricCanvas = e;
			applyDraftToCanvas();
			// Try to load template when canvas becomes available
			attemptTemplateLoad();
			// Auto-import from Figma plugin if ?figmaImport= is present
			if (e && figmaImportId) handleFigmaAutoImport(e);
		});

		templateUnsubscribe = template.subscribe((t) => {

			// Debug: Check if objects have isVariable property
			if (t?.fabricJSData?.objects) {
				const varsInData = t.fabricJSData.objects.filter((o) => o.isVariable);
			}

			editorTemplate = t;
			if (editorTemplate) {
				templateName = editorTemplate.name || templateName;
				templateType = editorTemplate.type || 'og-image';

				// Initialize pages from template data (handles multi-page PDF)
				pageActions.initFromTemplate(editorTemplate);

				// Restore output format and PDF preset from template data
				// This ensures PDF templates open in PDF mode when refreshed
				if (editorTemplate.outputFormat) {
					pageActions.setOutputFormat(editorTemplate.outputFormat);
				}
				if (editorTemplate.pdfPreset) {
					pageActions.setPdfPreset(editorTemplate.pdfPreset);
				}

				// Try to load template when template data becomes available
				attemptTemplateLoad();
			}
		});
	});

	onDestroy(() => {
		unsubscribe();
		templateUnsubscribe();
		// Remove event listener
		window.removeEventListener('save-template-and-generate', handleSaveAndGenerate);
		// Note: Don't reset template store here - it causes the VariablesPanel
		// to briefly show "Template Not Saved" during navigation.
		// The template store will be properly set by the next page that loads.
		hasLoadedTemplate = false;
	});
</script>

<EditorLayout bind:templateName bind:currentLayoutKey {isSaving} {guestMode} on:save={saveTemplate} />

<Toast />

<!-- Auth Modal -->
<AuthModal bind:isOpen={showAuthModal} onSuccess={handleAuthSuccess} />
