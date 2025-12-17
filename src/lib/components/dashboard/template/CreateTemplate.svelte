<script>
	import EditorLayout from '../../editor/EditorLayout.svelte';
	import { editor } from '../../../../store/editor.store';
	import { onMount, onDestroy } from 'svelte';
	import { getHTMLandCSS } from '../../../html-to-gif/create-media';
	import { FabricImage } from 'fabric';
	import {
		createTemplateAction,
		updateTemplateAction,
		template
	} from '../../../../store/template.store';
	import { extractVariablesFromExpression, generateSampleData, getVariableType as getExpressionVariableType } from '../../../utils/expression-parser';
	import { get } from 'svelte/store';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '../../../../store/toast.store';
	import CopyIcon from '$lib/assets/dashboard/Copy Icons.png';
	import { goto } from '$app/navigation';

	let fabricCanvas;

	let templateName = '';
	let templateType = 'og-image'; // Default type
	export let isEdit = false;
	export let guestMode = false;

	let editorTemplate = null;
	let hasLoadedTemplate = false; // Track if we've already loaded the template

	let unsubscribe = () => {};
	let templateUnsubscribe = () => {};
	let isSaving = false;

	const DRAFT_KEY = 'pictify_template_draft_v1';
	let pendingDraft = null;
	let hasAppliedDraft = false;

	const templateTypes = [
		{ label: 'OG Image', value: 'og-image' },
		{ label: 'Invoice', value: 'invoice' },
		{ label: 'Social Media', value: 'social-media' }
	];

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'Copied to clipboard!', duration: 1500 });
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
		
		// 1. Extract variables from variableBindings array (new format)
		objects.forEach((obj) => {
			if (obj.isVariable && obj.variableBindings && Array.isArray(obj.variableBindings)) {
				// Ensure object has an ID for tracking
				if (!obj.id) {
					const uniqueId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
					obj.set('id', uniqueId);
				}
				
				// Process each binding
				obj.variableBindings.forEach(binding => {
					const varName = binding.variableName;
					if (varName && !variableMap.has(varName)) {
						variableMap.set(varName, {
							name: varName,
							type: getVariableTypeForProperty(obj, binding.property),
							defaultValue: getDefaultValueForProperty(obj, binding.property),
							description: binding.description || '',
							elementId: obj.id,
							property: binding.property,
							validation: { required: binding.required || false },
							source: 'property'
						});
					}
				});
			}
		});

		// 2. Extract variables from conditional visibility (showWhen/hideWhen)
		objects.forEach(obj => {
			const showWhen = obj.showWhen;
			const hideWhen = obj.hideWhen;
			
			if (showWhen || hideWhen) {
				const expression = showWhen || hideWhen;
				const extractedVars = extractVariablesFromExpression(expression);
				
				extractedVars.forEach(extractedVar => {
					if (!variableMap.has(extractedVar.name)) {
						const varType = getExpressionVariableType(extractedVar, 'condition');
						variableMap.set(extractedVar.name, {
							name: extractedVar.name,
							type: varType,
							defaultValue: generateSampleData(extractedVar, 'condition'),
							description: `Used in ${showWhen ? 'show' : 'hide'} condition`,
							elementId: `condition_${extractedVar.name}`,
							property: varType === 'object' ? 'data' : 'value',
							validation: { required: false },
							source: 'condition',
							isObject: extractedVar.isObject,
							properties: extractedVar.properties
						});
					}
				});
			}
		});
		
		// 3. Extract variables from loop/repeat configurations
		objects.forEach(obj => {
			const loopVariable = obj.loopVariable;
			
			if (loopVariable && loopVariable !== null && loopVariable !== '') {
				if (!variableMap.has(loopVariable)) {
					variableMap.set(loopVariable, {
						name: loopVariable,
						type: 'array',
						defaultValue: generateSampleData({ name: loopVariable }, 'loop'),
						description: `Array variable for repeating element`,
						elementId: `loop_${loopVariable}`,
						property: 'items',
						validation: { required: false },
						source: 'loop',
						loopItemName: obj.loopItemName,
						loopDirection: obj.loopDirection
					});
				}
			}
		});
		
		const variables = Array.from(variableMap.values());
		
		console.log('Extracted variables:', variables);
		
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
				console.log('Assigned ID to object:', obj.type, uniqueId);
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
			'id', 'isVariable', 'variableBindings',
			// Chart properties
			'isChart', 'chartType', 'chartData', 'chartConfig',
			// Table properties
			'isTable', 'tableType', 'tableHeaders', 'tableRows', 'tableData', 'tableConfig', 'tableStyle',
			// Conditional logic properties
			'showWhen', 'hideWhen',
			// Loop/repeat properties
			'loopVariable', 'loopItemName', 'loopIndexName', 'loopDirection', 'loopSpacing', 'loopColumns'
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
				
				return result;
			});
		}
		
		return json;
	}

	const updateTemplate = async () => {
		if (!templateName.trim()) {
			toast.set({ message: 'Please enter a template name', duration: 1500 });
			return;
		}

		isSaving = true;
		try {
			// Ensure all objects have IDs before serialization
			ensureAllObjectsHaveIds();
			
			const svg = fabricCanvas.toSVG();
			const html = await getHTMLandCSS(svg, '');
			
			// Serialize with custom properties
			const fabricJSData = serializeCanvasWithCustomProps();
			
			// Debug: Log what we're saving
			console.log('Saving fabricJSData:', fabricJSData);
			console.log('Objects with IDs:', fabricJSData?.objects?.map(o => ({ type: o.type, id: o.id, isVariable: o.isVariable })));
			
			const width = fabricCanvas.width;
			const height = fabricCanvas.height;
			const variableDefinitions = extractVariableDefinitions();

			const templateData = {
				...editorTemplate,
				html,
				name: templateName,
				fabricJSData,
				width,
				height,
				type: templateType,
				variableDefinitions
			};

			const result = await updateTemplateAction(templateData);
			if (result) {
				// Draft is now saved; clear it.
				try {
					localStorage.removeItem(DRAFT_KEY);
				} catch (e) {}

				// Update the template store with the updated template
				template.set(result);
				editorTemplate = result;
				
				const varCount = variableDefinitions.length;
				const message = varCount > 0 
					? `Template updated with ${varCount} variable${varCount > 1 ? 's' : ''}!`
					: 'Template updated successfully!';
				toast.set({ message, duration: 2000 });
			} else {
				toast.set({ message: 'Failed to update template', duration: 1500 });
			}
		} catch (error) {
			console.error('Error updating template:', error);
			toast.set({ message: 'Failed to update template', duration: 1500 });
		} finally {
			isSaving = false;
		}
	};

	const createTemplate = async () => {
		if (!templateName.trim()) {
			toast.set({ message: 'Please enter a template name', duration: 1500 });
			return;
		}

		isSaving = true;
		try {
			// Ensure all objects have IDs before serialization
			ensureAllObjectsHaveIds();
			
			const svg = fabricCanvas.toSVG();
			const html = await getHTMLandCSS(svg, '');
			
			// Serialize with custom properties
			const fabricJSData = serializeCanvasWithCustomProps();
			const width = fabricCanvas.width;
			const height = fabricCanvas.height;
			const variableDefinitions = extractVariableDefinitions();

			const templateData = {
				html,
				name: templateName,
				fabricJSData,
				width,
				height,
				type: templateType,
				variableDefinitions
			};

			const result = await createTemplateAction(templateData);
			if (result) {
				// Draft is now saved; clear it.
				try {
					localStorage.removeItem(DRAFT_KEY);
				} catch (e) {}

				// Update the template store with the created template (includes UID)
				// This allows the Variables panel to immediately test the API
				template.set(result);
				editorTemplate = result;
				
				const varCount = variableDefinitions.length;
				const message = varCount > 0 
					? `Template created with ${varCount} variable${varCount > 1 ? 's' : ''}! You can now test the API.`
					: 'Template created successfully!';
				toast.set({ message, duration: 2500 });
				
				// Redirect to the edit view for this template
				// This ensures subsequent saves are updates, not new creations
				goto(`/template-workspace/${result.uid}`, { replaceState: true });
			} else {
				toast.set({ message: 'Failed to create template', duration: 1500 });
			}
		} catch (error) {
			console.error('Error creating template:', error);
			toast.set({ message: 'Failed to create template', duration: 1500 });
		} finally {
			isSaving = false;
		}
	};

	const saveTemplate = async () => {
		console.log('CreateTemplate: saveTemplate called', { isEdit, templateName });
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
			} catch (e) {}

			toast.set({ message: 'Create a free account to save templates and use the API.', duration: 2500 });
			goto('/signup?redirect=/template-workspace/create');
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
		console.log('loadTemplateIntoCanvas called:', {
			hasFabricCanvas: !!fabricCanvas,
			hasEditorTemplate: !!editorTemplate,
			hasFabricJSData: !!editorTemplate?.fabricJSData,
			hasLoadedTemplate,
			templateUid: editorTemplate?.uid
		});
		
		if (!fabricCanvas || !editorTemplate?.fabricJSData || hasLoadedTemplate) {
			console.log('loadTemplateIntoCanvas returning early - condition not met');
			return;
		}
		
		console.log('Loading template into canvas:', editorTemplate.uid, 'with', editorTemplate.fabricJSData?.objects?.length, 'objects');
		hasLoadedTemplate = true;
		
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
		
		console.log('Loading template with variableBindings:', fabricData.objects?.map(o => ({ id: o.id, isVariable: o.isVariable, bindings: o.variableBindings })));
		
		// Fabric.js v6 loadFromJSON returns a Promise
		const loadPromise = fabricCanvas.loadFromJSON(fabricData);
		
		if (loadPromise && typeof loadPromise.then === 'function') {
			loadPromise.then(() => {
				console.log('loadFromJSON promise resolved');
				
				// Get all canvas objects
				const objects = fabricCanvas.getObjects();
				const fabricDataObjects = fabricData.objects || [];
				
				// Restore custom properties from fabricJSData
				objects.forEach((obj, index) => {
					const objData = fabricDataObjects[index];
					if (objData) {
						// Restore variable bindings
						if (objData.isVariable && objData.variableBindings && Array.isArray(objData.variableBindings)) {
							obj.set({
								isVariable: true,
								variableBindings: objData.variableBindings
							});
							console.log('Restored variable bindings to object:', obj.id, obj.type, objData.variableBindings);
						}
						
						// Conditional logic properties
						if (objData.showWhen !== undefined && objData.showWhen !== null) {
							obj.set('showWhen', objData.showWhen);
							console.log('Restored showWhen to object:', obj.id, objData.showWhen);
						}
						if (objData.hideWhen !== undefined && objData.hideWhen !== null) {
							obj.set('hideWhen', objData.hideWhen);
							console.log('Restored hideWhen to object:', obj.id, objData.hideWhen);
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
							console.log('Restored loop properties to object:', obj.id, objData.loopVariable);
						}
						
						// Chart properties
						if (objData.isChart) {
							obj.set({
								isChart: true,
								chartType: objData.chartType || 'bar',
								chartData: objData.chartData || [],
								chartConfig: objData.chartConfig || {}
							});
							console.log('Restored chart properties to object:', obj.id, objData.chartType);
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
							console.log('Restored table properties to object:', obj.id, objData.tableType);
						}
					}
				});
				
				// Force render the canvas
				fabricCanvas.requestRenderAll();
				fabricCanvas.renderAll();
				
				// Log variable count for debugging
				const variableCount = objects.filter(o => o.isVariable).length;
				console.log('Template loaded successfully with', objects.length, 'objects,', variableCount, 'variables');
				
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
			}).catch(err => {
				console.error('Error loading template:', err);
				hasLoadedTemplate = false; // Allow retry on error
				// End history batch on error too
				if (typeof window !== 'undefined' && window.__historyBatchEnd) {
					window.__historyBatchEnd();
				}
			});
		} else {
			// Fallback for older Fabric.js versions
			fabricCanvas.renderAll();
			console.log('Template loaded (sync)');
			if (typeof window !== 'undefined' && window.__historyBatchEnd) {
				window.__historyBatchEnd();
			}
		}
	}

	/**
	 * Attempt to load template - called when either canvas or template becomes available
	 */
	function attemptTemplateLoad() {
		console.log('attemptTemplateLoad called:', {
			isEdit,
			hasFabricCanvas: !!fabricCanvas,
			hasEditorTemplate: !!editorTemplate,
			hasFabricJSData: !!editorTemplate?.fabricJSData,
			hasLoadedTemplate,
			templateUid: editorTemplate?.uid
		});
		
		if (isEdit && fabricCanvas && editorTemplate?.fabricJSData && !hasLoadedTemplate) {
			console.log('Scheduling template load in 600ms...');
			// Wait for canvas to be fully initialized (Canvas.svelte has a 500ms init delay)
			setTimeout(() => {
				console.log('Timeout fired, calling loadTemplateIntoCanvas');
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
		} catch (e) {}

		// Check if we have full FabricJS data (pre-built template from use case)
		if (pendingDraft.fabricJSData && pendingDraft.fabricJSData.objects) {
			console.log('Loading FabricJS template from draft:', pendingDraft.name);
			
			// Start history batch to prevent saving during load
			if (typeof window !== 'undefined' && window.__historyBatchStart) {
				window.__historyBatchStart();
			}
			
			const fabricData = pendingDraft.fabricJSData;
			
			// Load the full FabricJS template
			const loadPromise = fabricCanvas.loadFromJSON(fabricData);
			
			if (loadPromise && typeof loadPromise.then === 'function') {
				loadPromise.then(() => {
					// Restore custom properties (variable bindings, etc.)
					const objects = fabricCanvas.getObjects();
					const fabricDataObjects = fabricData.objects || [];
					
					objects.forEach((obj, index) => {
						const objData = fabricDataObjects[index];
						if (objData) {
							// Restore variable bindings
							if (objData.isVariable && objData.variableBindings && Array.isArray(objData.variableBindings)) {
								obj.set({
									isVariable: true,
									variableBindings: objData.variableBindings
								});
								console.log('Restored variable bindings to draft object:', obj.id, obj.type, objData.variableBindings);
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
					
					const variableCount = objects.filter(o => o.isVariable).length;
					console.log('Draft template loaded with', objects.length, 'objects,', variableCount, 'variables');
					
					// End history batch after load completes
					setTimeout(() => {
						if (typeof window !== 'undefined' && window.__historyBatchEnd) {
							window.__historyBatchEnd();
						}
						fabricCanvas.requestRenderAll();
						// Fire event to notify other components
						fabricCanvas.fire('object:modified', { target: null });
					}, 100);
					
					toast.set({ message: `Template loaded with ${variableCount} variable${variableCount !== 1 ? 's' : ''}. Customize and save!`, duration: 2500 });
				}).catch(err => {
					console.error('Error loading draft template:', err);
					if (typeof window !== 'undefined' && window.__historyBatchEnd) {
						window.__historyBatchEnd();
					}
					toast.set({ message: 'Could not load template. Try adding elements manually.', duration: 2500 });
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

					toast.set({ message: 'Imported your generated output as a background. Add variables on top →', duration: 2500 });
				})
				.catch(() => {
					toast.set({ message: 'Could not import background image. You can add it from the Assets panel.', duration: 2500 });
				});
		} else {
			fabricCanvas.renderAll();
		}

		// Do not auto-consume the draft here.
		// We clear it after the user saves successfully (create/update),
		// and guest mode uses it to carry state across signup.
	}

	onMount(() => {
		console.log('CreateTemplate onMount, isEdit:', isEdit);

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
			console.log('Editor subscribe fired, canvas:', !!e);
			fabricCanvas = e;
			applyDraftToCanvas();
			// Try to load template when canvas becomes available
			attemptTemplateLoad();
		});

		templateUnsubscribe = template.subscribe((t) => {
			console.log('Template subscribe fired:', {
				uid: t?.uid,
				name: t?.name,
				hasFabricJSData: !!t?.fabricJSData,
				objectCount: t?.fabricJSData?.objects?.length
			});
			
			// Debug: Check if objects have isVariable property
			if (t?.fabricJSData?.objects) {
				const varsInData = t.fabricJSData.objects.filter(o => o.isVariable);
				console.log('Variables in loaded fabricJSData:', varsInData.length, varsInData);
			}
			
			editorTemplate = t;
			if (editorTemplate) {
				templateName = editorTemplate.name || templateName;
				templateType = editorTemplate.type || 'og-image';
				
				// Try to load template when template data becomes available
				attemptTemplateLoad();
			}
		});
	});

	onDestroy(() => {
		unsubscribe();
		templateUnsubscribe();
		template.set(null);
		hasLoadedTemplate = false;
	});
</script>

<EditorLayout 
	bind:templateName 
	{isSaving} 
	{guestMode}
	on:save={saveTemplate} 
/>

<Toast />
