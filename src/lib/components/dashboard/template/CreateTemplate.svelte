<script>
	import EditorLayout from '../../editor/EditorLayout.svelte';
	import { editor } from '../../../../store/editor.store';
	import { onMount, onDestroy } from 'svelte';
	import { getHTMLandCSS } from '../../../html-to-gif/create-media';
	import {
		createTemplateAction,
		updateTemplateAction,
		template
	} from '../../../../store/template.store';
	import { get } from 'svelte/store';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '../../../../store/toast.store';
	import CopyIcon from '$lib/assets/dashboard/Copy Icons.png';

	let fabricCanvas;

	let templateName = '';
	let templateType = 'og-image'; // Default type
	export let isEdit = false;

	let editorTemplate = null;
	let hasLoadedTemplate = false; // Track if we've already loaded the template

	let unsubscribe = () => {};
	let templateUnsubscribe = () => {};
	let isSaving = false;

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
		const variables = [];
		
		objects.forEach((obj, index) => {
			if (obj.isVariable) {
				// Ensure object has an ID for tracking
				if (!obj.id) {
					const uniqueId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
					obj.set('id', uniqueId);
					console.log('Generated ID for object during extraction:', uniqueId);
				}
				
				variables.push({
					name: obj.variableName || obj.id || `var_${variables.length + 1}`,
					type: getVariableType(obj),
					defaultValue: getDefaultValue(obj),
					description: obj.variableDescription || '',
					elementId: obj.id,
					property: obj.variableProperty || getDefaultProperty(obj),
					validation: obj.variableValidation || { required: false }
				});
				
				console.log('Extracted variable:', {
					name: obj.variableName,
					elementId: obj.id,
					property: obj.variableProperty
				});
			}
		});
		
		return variables;
	}
	
	function getVariableType(obj) {
		switch (obj.type) {
			case 'i-text':
			case 'text':
			case 'textbox':
				return 'text';
			case 'image':
				return 'image';
			default:
				if (obj.variableProperty === 'fill') return 'color';
				return 'text';
		}
	}
	
	function getDefaultValue(obj) {
		switch (obj.type) {
			case 'i-text':
			case 'text':
			case 'textbox':
				return obj.text || '';
			case 'image':
				return obj.src || '';
			default:
				return obj.fill || '';
		}
	}
	
	function getDefaultProperty(obj) {
		switch (obj.type) {
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
			'id', 'isVariable', 'variableName', 'variableDescription', 
			'variableProperty', 'variableValidation',
			// Chart properties
			'isChart', 'chartType', 'chartData', 'chartConfig',
			// Table properties
			'isTable', 'tableType', 'tableHeaders', 'tableRows', 'tableData', 'tableConfig', 'tableStyle'
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
					variableName: canvasObj.variableName || '',
					variableDescription: canvasObj.variableDescription || '',
					variableProperty: canvasObj.variableProperty || '',
					variableValidation: canvasObj.variableValidation || null
				};
				
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
				// Update the template store with the created template (includes UID)
				// This allows the Variables panel to immediately test the API
				template.set(result);
				editorTemplate = result;
				
				const varCount = variableDefinitions.length;
				const message = varCount > 0 
					? `Template created with ${varCount} variable${varCount > 1 ? 's' : ''}! You can now test the API.`
					: 'Template created successfully!';
				toast.set({ message, duration: 2500 });
				// Don't reset templateName so user can continue editing
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
		
		// Create a map of variable definitions by elementId for restoring variable state
		const variableDefMap = new Map();
		(editorTemplate.variableDefinitions || []).forEach(varDef => {
			if (varDef.elementId) {
				variableDefMap.set(varDef.elementId, varDef);
			}
		});
		
		console.log('Variable definitions to restore:', editorTemplate.variableDefinitions);
		
		// Fabric.js v6 loadFromJSON returns a Promise
		const loadPromise = fabricCanvas.loadFromJSON(fabricData);
		
		// Create maps for restoring chart/table properties from fabricJSData
		const chartTableMap = new Map();
		(fabricData.objects || []).forEach((objData, index) => {
			if (objData.isChart || objData.isTable) {
				chartTableMap.set(objData.id || `index_${index}`, objData);
			}
		});
		
		if (loadPromise && typeof loadPromise.then === 'function') {
			loadPromise.then(() => {
				console.log('loadFromJSON promise resolved');
				
				// Get all canvas objects
				const objects = fabricCanvas.getObjects();
				const fabricDataObjects = fabricData.objects || [];
				
				// Restore variable state from variableDefinitions (stored in DB)
				// This is more reliable than relying on custom properties in fabricJSData
				objects.forEach((obj, index) => {
					// Check if this object has a variable definition
					const varDef = variableDefMap.get(obj.id);
					
					if (varDef) {
						// Restore variable properties from the stored definition
						obj.set({
							isVariable: true,
							variableName: varDef.name,
							variableDescription: varDef.description || '',
							variableProperty: varDef.property || 'text',
							variableValidation: varDef.validation || { required: false }
						});
						
						console.log('Restored variable state to object:', obj.id, obj.type, {
							isVariable: true,
							variableName: varDef.name,
							variableProperty: varDef.property
						});
					}
					
					// Restore chart/table properties from fabricJSData
					const objData = fabricDataObjects[index];
					if (objData) {
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

	onMount(() => {
		console.log('CreateTemplate onMount, isEdit:', isEdit);
		
		unsubscribe = editor.subscribe((e) => {
			console.log('Editor subscribe fired, canvas:', !!e);
			fabricCanvas = e;
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
	on:save={saveTemplate} 
/>

<Toast />
