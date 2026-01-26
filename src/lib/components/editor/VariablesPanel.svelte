<script>
	import { onMount, onDestroy } from 'svelte';
	import { editor, selectedComponent, editorActions } from '../../../store/editor.store';
	import { user, getAPITokenAction } from '../../../store/user.store';
	import { template } from '../../../store/template.store';
	import {
		variables,
		variableStats,
		variablesBySource,
		variableActions,
		VARIABLE_TYPES,
		VARIABLE_SOURCES
	} from '../../../store/variables.store';
	import { outputFormat, pdfPreset, pages, currentPageIndex } from '../../../store/pages.store';
	import { renderTemplate } from '../../../api/template';
	import { toast } from '../../../store/toast.store';
	import {
		applyPreview,
		clearPreview,
		isPreviewModeActive,
		isPreviewActive,
		getPreviewStats,
		validateTestValues
	} from '../../utils/canvas-preview-engine';
	import ShareResultButton from '../tools/ShareResultButton.svelte';
	import backend from '../../../service/backend';
	import { goto } from '$app/navigation';
	import AuthModal from './AuthModal.svelte';

	// Neo-brutalist input styling constants
	const inputBaseClass = "w-full text-sm border-[3px] border-gray-900 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-900 focus:shadow-[4px_4px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#e5e7eb] transition-all";
	const inputNumberClass = inputBaseClass;
	const buttonBaseClass = "w-full text-sm border-[3px] border-gray-900 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-gray-900 focus:shadow-[4px_4px_0_0_#ffc480] transition-all";
	const selectClass = "w-full text-sm border-[3px] border-gray-900 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-900 focus:shadow-[4px_4px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#e5e7eb] transition-all";

	// UI State
	let activeTab = 'list'; // 'list' | 'create' | 'test' | 'preview'
	let showApiExample = false;
	let showTestPanel = false;
	let editingVariable = null;
	let showDeleteConfirm = false;
	let variableToDelete = null;
	let showAuthModal = false;
	
	// Create/Edit form state
	let formName = '';
	let formType = VARIABLE_TYPES.TEXT;
	let formDescription = '';
	let formDefaultValue = '';
	let formRequired = false;
	let formError = '';
	
	// Test state
	let testValues = {};
	let isRendering = false;
	let renderedImageUrl = null;
	let renderedPdfUrl = null;  // PDF output URL
	let renderError = null;
	let lastRenderTime = null;
	let showRequestDetails = false;
	
	// Preview state
	// Note: isPreviewActive is now imported as a writable store from canvas-preview-engine
	// Use $isPreviewActive for reactive access
	let previewStats = null;
	let previewValidation = { errors: [], warnings: [], isValid: true };
	
	// Track refresh trigger
	let refreshTrigger = 0;

	export let guestMode = false;

	onMount(() => {
		// Listen for trigger generate after login
		const handleTriggerGenerate = () => {
			if ($user?.email && !guestMode) {
				handleGenerate();
			}
		};
		window.addEventListener('trigger-generate-after-login', handleTriggerGenerate);

		// In guest mode, we still show the whole panel, but avoid calling auth-only endpoints.
		if (!guestMode) {
			getAPITokenAction().catch(() => {
				// ignore auth errors; UI will show empty token state
			});
		}
	});

	// API Tokens
	let apiTokens = [];
	let selectedToken = '';

	// Subscribe to user store for API tokens
	$: if ($user?.apiTokens) {
		apiTokens = $user.apiTokens;
		if (!selectedToken && apiTokens.length > 0) {
			selectedToken = apiTokens[0].token;
		}
	}
	
	// Sync variables from canvas when canvas or components change
	$: if ($editor || refreshTrigger) {
		syncVariables();
	}
	
	$: if ($selectedComponent !== undefined) {
		setTimeout(() => syncVariables(), 100);
	}
	
	// Initialize test values when variables change
	$: if ($variables.length > 0) {
		initializeTestValues();
	}
	
	// Set up canvas event listeners
	let canvasEventCleanup = null;
	
	$: if ($editor && !canvasEventCleanup) {
		setupCanvasListeners();
	}
	
	function setupCanvasListeners() {
		if (!$editor) return;
		
		variableActions.setCanvas($editor);
		
		const handleChange = () => {
			setTimeout(() => {
				refreshTrigger++;
			}, 200);
		};
		
		$editor.on('object:added', handleChange);
		$editor.on('object:removed', handleChange);
		$editor.on('object:modified', handleChange);
		
		canvasEventCleanup = () => {
			if ($editor) {
				$editor.off('object:added', handleChange);
				$editor.off('object:removed', handleChange);
				$editor.off('object:modified', handleChange);
			}
		};
	}
	
	onDestroy(() => {
		// Clean up debounce timeout
		if (previewUpdateTimeout) {
			clearTimeout(previewUpdateTimeout);
		}

		if (canvasEventCleanup) {
			canvasEventCleanup();
		}
		variableActions.clearCanvas();

		// Clean up preview if active
		if ($isPreviewActive && $editor) {
			clearPreview($editor);
		}
	});
	
	// Preview functions
	async function togglePreview() {
		if (!$editor) {
			toast.set({ message: 'No canvas available', type: 'error', duration: 2000 });
			return;
		}

		if ($isPreviewActive) {
			// Turn off preview
			clearPreview($editor);
			// Note: isPreviewActive store is updated inside clearPreview
			previewStats = null;
			toast.set({ message: 'Preview mode disabled', type: 'success', duration: 1500 });
		} else {
			// Validate before preview
			previewValidation = validateTestValues(testValues);

			if (!previewValidation.isValid) {
				toast.set({
					message: `Preview failed: ${previewValidation.errors.join(', ')}`,
					type: 'error',
					duration: 3000
				});
				return;
			}

			// Turn on preview
			const result = await applyPreview($editor, testValues);
			// Note: isPreviewActive store is updated inside applyPreview
			previewStats = getPreviewStats($editor, testValues);

			if (result.success !== false) {
				toast.set({
					message: `Preview active: ${result.hiddenCount} hidden, ${result.loopClonesCount} loop items`,
					type: 'success',
					duration: 2000
				});
			} else if (result.reason === 'operation_in_progress') {
				toast.set({
					message: 'Preview operation already in progress',
					type: 'warning',
					duration: 2000
				});
			}
		}
	}
	
	async function updatePreview() {
		if (!$isPreviewActive || !$editor) return;

		// Re-apply preview with updated values
		clearPreview($editor);
		await applyPreview($editor, testValues);
		previewStats = getPreviewStats($editor, testValues);
	}

	// Auto-update preview when test values change (debounced)
	let previewUpdateTimeout = null;
	$: if ($isPreviewActive && testValues) {
		if (previewUpdateTimeout) clearTimeout(previewUpdateTimeout);
		previewUpdateTimeout = setTimeout(() => {
			updatePreview();
		}, 300);
	}
	
	function syncVariables() {
		if (!$editor) return;
		variableActions.syncFromCanvas($editor);
	}
	
	function initializeTestValues() {
		$variables.forEach(v => {
			if (testValues[v.name] === undefined) {
				testValues[v.name] = v.defaultValue || '';
			}
		});
		Object.keys(testValues).forEach(key => {
			if (!$variables.find(v => v.name === key)) {
				delete testValues[key];
			}
		});
		testValues = { ...testValues };
	}
	
	// CRUD Operations
	function startCreate() {
		editingVariable = null;
		formName = '';
		formType = VARIABLE_TYPES.TEXT;
		formDescription = '';
		formDefaultValue = '';
		formRequired = false;
		formError = '';
		activeTab = 'create';
	}
	
	function startEdit(variable) {
		editingVariable = variable;
		formName = variable.name;
		formType = variable.type;
		formDescription = variable.description;
		formDefaultValue = typeof variable.defaultValue === 'object' 
			? JSON.stringify(variable.defaultValue, null, 2) 
			: variable.defaultValue;
		formRequired = variable.required;
		formError = '';
		activeTab = 'create';
	}
	
	function cancelEdit() {
		editingVariable = null;
		formError = '';
		activeTab = 'list';
	}
	
	function saveVariable() {
		formError = '';
		
		// Validate
		if (!formName.trim()) {
			formError = 'Variable name is required';
			return;
		}
		
		const sanitizedName = formName.replace(/[^a-zA-Z0-9_]/g, '_');
		
		// Check for duplicates (except when editing)
		if (!editingVariable && variableActions.has(sanitizedName)) {
			formError = 'A variable with this name already exists';
			return;
		}
		
		// Parse default value based on type
		let parsedDefault = formDefaultValue;
		if ([VARIABLE_TYPES.ARRAY, VARIABLE_TYPES.OBJECT, VARIABLE_TYPES.CHART, VARIABLE_TYPES.TABLE].includes(formType)) {
			try {
				parsedDefault = formDefaultValue ? JSON.parse(formDefaultValue) : getDefaultForType(formType);
			} catch (e) {
				formError = 'Invalid JSON for default value';
				return;
			}
		} else if (formType === VARIABLE_TYPES.NUMBER) {
			parsedDefault = parseFloat(formDefaultValue) || 0;
		} else if (formType === VARIABLE_TYPES.BOOLEAN) {
			parsedDefault = formDefaultValue === 'true' || formDefaultValue === true;
		}
		
		if (editingVariable) {
			// Update existing
			variableActions.update(editingVariable.name, {
				name: sanitizedName,
				type: formType,
				description: formDescription,
				defaultValue: parsedDefault,
				required: formRequired
			});
			toast.set({ message: `Variable "${sanitizedName}" updated`, type: 'success', duration: 2000 });
			} else {
			// Create new custom variable
			variableActions.createCustom(
				sanitizedName,
				formType,
				parsedDefault,
				formDescription
			);
			variableActions.update(sanitizedName, { required: formRequired });
			toast.set({ message: `Variable "${sanitizedName}" created`, type: 'success', duration: 2000 });
		}
		
		editingVariable = null;
		activeTab = 'list';
	}
	
	function confirmDelete(variable) {
		variableToDelete = variable;
		showDeleteConfirm = true;
	}
	
	function deleteVariable() {
		if (variableToDelete) {
			const name = variableToDelete.name;
			variableActions.delete(name);
			toast.set({ message: `Variable "${name}" deleted`, type: 'success', duration: 2000 });
			variableToDelete = null;
			showDeleteConfirm = false;
			
			// Refresh from canvas to clean up
			syncVariables();
		}
	}
	
	function getDefaultForType(type) {
		switch (type) {
			case VARIABLE_TYPES.ARRAY: return [];
			case VARIABLE_TYPES.OBJECT: return {};
			case VARIABLE_TYPES.CHART: return [{ label: 'Jan', value: 30 }];
			case VARIABLE_TYPES.TABLE: return { headers: ['Col 1'], rows: [['Val 1']] };
			default: return '';
		}
	}
	
	function selectVariable(variable) {
		if (!$editor || !variable.objectId) return;
		
		const obj = $editor.getObjects().find(o => o.id === variable.objectId);
		if (obj) {
			$editor.setActiveObject(obj);
			editorActions.selectComponent(obj);
			$editor.renderAll();
		}
	}
	
	function getTypeIcon(type) {
		switch (type) {
			case 'text': return 'fa-font';
			case 'image': return 'fa-image';
			case 'color': return 'fa-palette';
			case 'chart': return 'fa-chart-bar';
			case 'table': return 'fa-table';
			case 'boolean': return 'fa-toggle-on';
			case 'number': return 'fa-hashtag';
			case 'array': return 'fa-list';
			case 'object': return 'fa-cube';
			default: return 'fa-code';
		}
	}
	
	function getTypeColor(type) {
		switch (type) {
			case 'text': return 'bg-blue-100 text-blue-700 border border-blue-200';
			case 'image': return 'bg-purple-100 text-purple-700 border border-purple-200';
			case 'color': return 'bg-orange-100 text-orange-700 border border-orange-200';
			case 'chart': return 'bg-pink-100 text-pink-700 border border-pink-200';
			case 'table': return 'bg-teal-100 text-teal-700 border border-teal-200';
			case 'boolean': return 'bg-green-100 text-green-700 border border-green-200';
			case 'number': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
			case 'array': return 'bg-amber-100 text-amber-700 border border-amber-200';
			case 'object': return 'bg-violet-100 text-violet-700 border border-violet-200';
			default: return 'bg-gray-100 text-gray-700 border border-gray-200';
		}
	}
	
	function getSourceBadge(source) {
		switch (source) {
			case 'property': return { label: 'Element', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' };
			case 'condition': return { label: 'Condition', color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' };
			case 'loop': return { label: 'Loop', color: 'bg-cyan-100 text-cyan-700 border border-cyan-200' };
			case 'custom': return { label: 'Custom', color: 'bg-gray-100 text-gray-600 border border-gray-200' };
			default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-600' };
		}
	}
	
	function generateApiExample() {
		return JSON.stringify(variableActions.generateApiExample(), null, 2);
	}
	
	function copyApiExample() {
		navigator.clipboard.writeText(generateApiExample());
		toast.set({ message: 'Copied to clipboard!', type: 'success', duration: 1500 });
	}
	
	function updateTestValue(name, value) {
		testValues[name] = value;
		testValues = { ...testValues };
	}
	
	function resetTestValues() {
		$variables.forEach(v => {
			testValues[v.name] = v.defaultValue || '';
		});
		testValues = { ...testValues };
	}
	
	async function testRenderApi() {
		if (!$template?.uid) {
			toast.set({
				message: 'Please save the template first before testing the API',
				type: 'warning',
				duration: 3000
			});
			return;
		}
		
		isRendering = true;
		renderError = null;
		renderedImageUrl = null;
		renderedPdfUrl = null;
		const startTime = Date.now();
		
		try {
			const isPdf = $outputFormat === 'pdf';
			const result = await renderTemplate($template.uid, testValues, {
				format: isPdf ? 'pdf' : 'png',
				quality: 0.9,
				headers: selectedToken ? { 'Authorization': `Bearer ${selectedToken}` } : {}
			});
			
			lastRenderTime = Date.now() - startTime;
			
			if (isPdf) {
				renderedPdfUrl = result.url;
				toast.set({
					message: `PDF rendered in ${lastRenderTime}ms!`,
					type: 'success',
					duration: 2000
				});
			} else {
				renderedImageUrl = result.url;
				toast.set({
					message: `Image rendered in ${lastRenderTime}ms!`,
					type: 'success',
					duration: 2000
				});
			}
		} catch (error) {
			renderError = error.message || 'Failed to render template';
			toast.set({
				message: renderError,
				type: 'error',
				duration: 3000
			});
		} finally {
			isRendering = false;
		}
	}

	function generateCurlCommand() {
		if (!$template?.uid) return '';
		
		const varsJson = JSON.stringify({ variables: testValues }, null, 2);
		return `curl -X POST \\
  '${window.location.origin}/api/templates/${$template.uid}/render' \\
  -H 'Authorization: Bearer ${selectedToken || 'YOUR_API_TOKEN'}' \\
  -H 'Content-Type: application/json' \\
  -d '${varsJson}'`;
	}
	
	function copyCurlCommand() {
		navigator.clipboard.writeText(generateCurlCommand());
		toast.set({ message: 'cURL command copied!', type: 'success', duration: 1500 });
	}
	
	function downloadImage() {
		if (!renderedImageUrl) return;
		
		const link = document.createElement('a');
		link.href = renderedImageUrl;
		link.download = `template-render-${Date.now()}.png`;
		link.click();
	}
	
	function openImageInNewTab() {
		if (!renderedImageUrl) return;
		window.open(renderedImageUrl, '_blank');
	}

	// Generate directly from canvas with variables
	// Uses the public /image/public/canvas endpoint (rate limited, no auth required)
	// Works for both guest mode AND logged-in users with unsaved templates
	async function generateFromCanvas() {
		if (!$editor) {
			toast.set({ message: 'No canvas available', type: 'error', duration: 2000 });
			return;
		}

		isRendering = true;
		renderError = null;
		renderedImageUrl = null;
		const startTime = Date.now();

		try {
			// Serialize canvas to FabricJS JSON with all variable-related properties
			const fabricJSData = $editor.toJSON([
				'id', 'isVariable', 'variableBindings', 'variableName', 'variableProperty',
				'isChart', 'chartType', 'chartData', 'chartConfig',
				'isTable', 'tableType', 'tableHeaders', 'tableRows', 'tableData', 'tableConfig', 'tableStyle',
				'isQRCode', 'qrData', 'qrConfig',
				'showWhen', 'hideWhen',
				'loopVariable', 'loopItemName', 'loopIndexName', 'loopDirection', 'loopSpacing', 'loopColumns'
			]);

			const width = $editor.width || 1200;
			const height = $editor.height || 630;

			// Build variable definitions from the variables store
			// This is needed because FabricJS doesn't serialize custom properties like isVariable/variableBindings
			// Include defaultValue for fallback matching by text content
			const variableDefinitions = $variables.map(v => ({
				name: v.name,
				objectId: v.objectId,
				property: v.property || 'text',
				source: v.source,
				defaultValue: v.defaultValue // Used for fallback matching if ID doesn't match
			}));

			// Debug: log what we're sending
			console.log('[generateFromCanvas] testValues:', JSON.stringify(testValues));
			console.log('[generateFromCanvas] variableDefinitions:', variableDefinitions.length);
			console.log('[generateFromCanvas] outputFormat:', $outputFormat);

			// Use appropriate endpoint based on output format
			const isPdf = $outputFormat === 'pdf';
			let result;
			
			if (isPdf) {
				// Inject dimensions into fabric data so backend knows the correct viewBox
				// This is critical because fabric.toJSON() doesn't include canvas dimensions
				
				let pdfFabricData;
				
				// Handle multi-page PDF
				if ($pages.length > 1) {
					// Map all pages to fabric data
					// Use current editor state for current page, stored state for others
					pdfFabricData = $pages.map((page, index) => {
						let pageData;
						if (index === $currentPageIndex && $editor) {
							// For current page, use live editor state
							pageData = fabricJSData;
						} else {
							// For other pages, use stored data
							// Fallback to empty/default if null
							pageData = page.fabricJSData || { 
								version: "5.3.0", 
								objects: [], 
								background: "#ffffff" 
							};
						}
						
						// Inject dimensions into EACH page
						return {
							...pageData,
							width: width,
							height: height
						};
					});
				} else {
					// Single page case
					pdfFabricData = {
						...fabricJSData,
						width: width,
						height: height
					};
				}
				
				// Use PDF endpoint
				result = await backend.post('/pdf/from-fabric', {
					fabricData: pdfFabricData,
					variables: testValues,
					options: {
						preset: $pdfPreset || 'A4',
						title: 'Canvas PDF',
						uploadToStorage: true
					}
				});
			} else {
				// Use image endpoint
				result = await backend.post('/image/public/canvas', {
					fabricJSData,
					variables: testValues,
					variableDefinitions,
					width,
					height,
					fileExtension: 'png'
				});
			}

			lastRenderTime = Date.now() - startTime;
			
			if (result?.url) {
				if (isPdf) {
					renderedPdfUrl = result.url;
					renderedImageUrl = null;
					toast.set({
						message: `PDF generated in ${lastRenderTime}ms!`,
						type: 'success',
						duration: 2000
					});
				} else {
					renderedImageUrl = result.url;
					renderedPdfUrl = null;
					toast.set({
						message: `Image generated in ${lastRenderTime}ms!`,
						type: 'success',
						duration: 2000
					});
				}
			} else {
				throw new Error(`No ${isPdf ? 'PDF' : 'image'} URL in response`);
			}
		} catch (error) {
			// Handle rate limit error
			if (error.message?.includes('rate') || error.status === 429) {
				renderError = 'Too many requests. Please wait a moment and try again.';
			} else {
				renderError = error.message || 'Failed to generate image';
			}
			toast.set({
				message: renderError,
				type: 'error',
				duration: 3000
			});
		} finally {
			isRendering = false;
		}
	}

	// Generate function - use appropriate method based on context
	function handleGenerate() {
		// Check if in guest mode and user is not logged in
		if (guestMode && !$user?.email) {
			// Show auth modal instead of redirecting
			showAuthModal = true;
			return;
		}

		if (guestMode || !$template?.uid) {
			generateFromCanvas();
		} else {
			testRenderApi();
		}
	}

	// Handle successful authentication from modal
	async function handleAuthSuccess() {
		// User is now logged in
		toast.set({
			message: 'Welcome! Saving your template...',
			type: 'success',
			duration: 2000
		});

		// Ensure we have the latest user state
		await getAPITokenAction();

		// Small delay to let everything update
		setTimeout(async () => {
			if ($user?.email) {
				// Now the user can save templates and generate images
				// First, we need to trigger template save if we have a draft
				const DRAFT_KEY = 'pictify_template_draft_v1';
				const hasDraft = localStorage.getItem(DRAFT_KEY);

				if (hasDraft && !$template?.uid) {
					// We have a draft but no saved template yet
					// We need to trigger the save through the parent component
					// For now, just generate - the parent should handle saving
					toast.set({
						message: 'Please save your template to continue',
						type: 'warning',
						duration: 3000
					});

					// Dispatch event to parent to trigger save
					const event = new CustomEvent('save-template-and-generate', {
						detail: { generateAfterSave: true }
					});
					window.dispatchEvent(event);
				} else {
					// Template already saved or no draft, just generate
					handleGenerate();
				}
			}
		}, 500);
	}

	// Save draft and show auth modal
	function saveAndShowAuth() {
		const DRAFT_KEY = 'pictify_template_draft_v1';
		try {
			if ($editor) {
			const fabricJSData = $editor.toJSON([
					'id', 'isVariable', 'variableBindings', 'variableName', 'variableProperty',
					'isChart', 'chartType', 'chartData', 'chartConfig',
					'isTable', 'tableType', 'tableHeaders', 'tableRows', 'tableData', 'tableConfig', 'tableStyle',
					'isQRCode', 'qrData', 'qrConfig',
					'showWhen', 'hideWhen',
					'loopVariable', 'loopItemName', 'loopDirection', 'loopSpacing'
				]);
				const draft = {
					version: 1,
					name: 'Canvas Template',
					type: 'custom',
					width: $editor.width || 1200,
					height: $editor.height || 630,
					fabricJSData
				};
				localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
			}
		} catch (e) {}

		// Show auth modal instead of redirecting
		showAuthModal = true;
	}
</script>

<div class="w-full bg-[#FFFDF8] h-full flex flex-col z-10">
	<!-- Header with Tabs -->
	<div class="px-4 py-3 border-b-[3px] border-gray-900 flex-shrink-0 bg-[#FFFDF8]">
		<div class="flex items-center justify-between mb-3">
			<h3 class="font-black text-sm text-gray-900 uppercase tracking-widest">Variables</h3>
			<button 
				class="text-xs px-2.5 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-all shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#ffc480] hover:-translate-y-0.5 flex items-center gap-1.5 uppercase font-bold tracking-wide border-2 border-gray-900"
				on:click={startCreate}
			>
				<i class="fa fa-plus text-[10px]"></i>
				Add
			</button>
	</div>
	
		<!-- Tabs -->
		<div class="flex gap-1 bg-[#FFFDF8] p-1 border-b-2 border-gray-900">
			<button 
				class="flex-1 text-xs font-bold uppercase tracking-wide py-1.5 px-2 rounded transition-colors {activeTab === 'list' ? 'bg-[#ffc480] text-gray-900 border-2 border-gray-900 shadow-[2px_2px_0_0_#000]' : 'text-gray-500 hover:text-gray-900 border-2 border-transparent hover:border-gray-900'}"
				on:click={() => activeTab = 'list'}
			>
				All ({$variables.length})
			</button>
			<button 
				class="flex-1 text-xs font-bold uppercase tracking-wide py-1.5 px-2 rounded transition-colors relative {activeTab === 'preview' ? 'bg-[#ffc480] text-gray-900 border-2 border-gray-900 shadow-[2px_2px_0_0_#000]' : 'text-gray-500 hover:text-gray-900 border-2 border-transparent hover:border-gray-900'}"
				on:click={() => activeTab = 'preview'}
			>
				Preview
				{#if $isPreviewActive}
					<span class="absolute -top-1 -right-1 w-2 h-2 bg-[#ff6b6b] rounded-full animate-pulse border border-gray-900"></span>
				{/if}
			</button>
			<button 
				class="flex-1 text-xs font-bold uppercase tracking-wide py-1.5 px-2 rounded transition-colors {activeTab === 'test' ? 'bg-[#ffc480] text-gray-900 border-2 border-gray-900 shadow-[2px_2px_0_0_#000]' : 'text-gray-500 hover:text-gray-900 border-2 border-transparent hover:border-gray-900'}"
				on:click={() => activeTab = 'test'}
			>
				API
			</button>
		</div>
	</div>
	
	<div class="p-4 flex-1 overflow-y-auto custom-scrollbar bg-[#FFFDF8]">
		<!-- Create/Edit Form -->
		{#if activeTab === 'create'}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h4 class="text-sm font-black uppercase tracking-wide text-gray-900">
						{editingVariable ? 'Edit Variable' : 'Create Variable'}
					</h4>
					<button 
						class="text-gray-400 hover:text-gray-900 transition-colors"
						on:click={cancelEdit}
					>
						<i class="fa fa-times"></i>
					</button>
				</div>
				
				{#if formError}
					<div class="bg-red-50 border-2 border-red-200 rounded-lg p-3 shadow-[2px_2px_0_0_#ef4444]">
						<p class="text-xs font-bold text-red-700 uppercase">{formError}</p>
					</div>
				{/if}
				
				<!-- Name -->
				<div>
					<label for="variable-name" class="block text-xs font-bold text-gray-900 uppercase mb-1">Name *</label>
					<input
						id="variable-name"
						type="text"
						class={inputBaseClass + " font-medium"}
						placeholder="e.g., title, userName, price"
						bind:value={formName}
					/>
					<p class="text-[10px] text-gray-500 mt-1 font-medium">Use only letters, numbers, and underscores</p>
				</div>
				
				<!-- Type -->
				<div>
					<label for="variable-type" class="block text-xs font-bold text-gray-900 uppercase mb-1">Type</label>
					<select
						id="variable-type"
						class={selectClass + " font-medium"}
						bind:value={formType}
					>
						<option value={VARIABLE_TYPES.TEXT}>Text</option>
						<option value={VARIABLE_TYPES.NUMBER}>Number</option>
						<option value={VARIABLE_TYPES.BOOLEAN}>Boolean</option>
						<option value={VARIABLE_TYPES.COLOR}>Color</option>
						<option value={VARIABLE_TYPES.IMAGE}>Image URL</option>
						<option value={VARIABLE_TYPES.ARRAY}>Array</option>
						<option value={VARIABLE_TYPES.OBJECT}>Object</option>
						<option value={VARIABLE_TYPES.CHART}>Chart Data</option>
						<option value={VARIABLE_TYPES.TABLE}>Table Data</option>
					</select>
				</div>
				
				<!-- Description -->
				<div>
					<label for="variable-description" class="block text-xs font-bold text-gray-900 uppercase mb-1">Description</label>
					<textarea
						id="variable-description"
						class={inputBaseClass + " font-medium"}
						rows="2"
						placeholder="What is this variable used for?"
						bind:value={formDescription}
					></textarea>
				</div>
				
				<!-- Default Value -->
				<div>
					<label for="variable-default-value" class="block text-xs font-bold text-gray-900 uppercase mb-1">Default Value</label>
					{#if formType === VARIABLE_TYPES.BOOLEAN}
						<select
							id="variable-default-value"
							class={selectClass + " font-medium"}
							bind:value={formDefaultValue}
						>
							<option value="true">true</option>
							<option value="false">false</option>
						</select>
					{:else if formType === VARIABLE_TYPES.COLOR}
						<div class="flex gap-2">
							<input
								type="color"
								class="w-12 h-10 border-[2px] border-gray-900 rounded-lg cursor-pointer shadow-[2px_2px_0_0_#1f2937]"
								bind:value={formDefaultValue}
							/>
							<input
								id="variable-default-value"
								type="text"
								class={inputBaseClass + " flex-1 font-mono"}
								placeholder="#000000"
								bind:value={formDefaultValue}
							/>
						</div>
				{:else if [VARIABLE_TYPES.ARRAY, VARIABLE_TYPES.OBJECT, VARIABLE_TYPES.CHART, VARIABLE_TYPES.TABLE].includes(formType)}
					<textarea
						id="variable-default-value"
						class={inputBaseClass + " h-32 text-xs font-mono"}
						placeholder="Enter valid JSON..."
						bind:value={formDefaultValue}
					></textarea>
				{:else if formType === VARIABLE_TYPES.NUMBER}
					<input
						id="variable-default-value"
						type="number"
						class={inputBaseClass + " font-medium"}
						placeholder="Default value..."
						bind:value={formDefaultValue}
					/>
				{:else}
					<input
						id="variable-default-value"
						type="text"
						class={inputBaseClass + " font-medium"}
						placeholder="Default value..."
						bind:value={formDefaultValue}
					/>
				{/if}
				</div>
				
				<!-- Required -->
				<div class="flex items-center gap-2">
					<input
						type="checkbox"
						id="required-checkbox"
						class="w-5 h-5 border-2 border-gray-900 rounded focus:ring-0 text-black"
						bind:checked={formRequired}
					/>
					<label for="required-checkbox" class="text-xs font-bold text-gray-900 uppercase">Required variable</label>
				</div>
				
				<!-- Actions -->
				<div class="flex gap-2 pt-2">
					<button 
						class="flex-1 py-2.5 px-4 bg-gray-900 text-white rounded-lg text-xs font-black uppercase tracking-wider border-2 border-gray-900 shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#ffc480] hover:-translate-y-0.5 transition-all"
						on:click={saveVariable}
					>
						{editingVariable ? 'Update' : 'Create'} Variable
					</button>
					<button 
						class="py-2.5 px-4 bg-white border-[2px] border-gray-900 rounded-lg text-xs font-black uppercase tracking-wider text-gray-900 hover:bg-gray-50 shadow-[2px_2px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5 transition-all"
						on:click={cancelEdit}
					>
						Cancel
					</button>
				</div>
			</div>
		
		<!-- Variables List -->
		{:else if activeTab === 'list'}
			{#if $variables.length === 0}
			<div class="text-center py-8">
				<div class="w-16 h-16 mx-auto mb-4 bg-[#FFFDF8] border-2 border-gray-900 rounded-full flex items-center justify-center shadow-[4px_4px_0_0_#1f2937]">
					<i class="fa fa-code text-2xl text-gray-900"></i>
				</div>
				<h4 class="text-sm font-black text-gray-900 mb-2 uppercase tracking-wide">No Variables Yet</h4>
				<p class="text-xs text-gray-500 mb-4 font-medium">
						Create variables to make your template dynamic.
					</p>
					<button 
						class="text-xs px-4 py-2 bg-gray-900 text-white border-2 border-gray-900 rounded-lg hover:bg-black transition-all shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#ffc480] hover:-translate-y-0.5 uppercase font-bold"
						on:click={startCreate}
					>
						<i class="fa fa-plus mr-1.5"></i>
						Create Variable
					</button>
			</div>
		{:else}
				<!-- Variables by Source -->
				{#each Object.entries($variablesBySource) as [source, vars]}
					{#if vars.length > 0}
						<div class="mb-4">
							<div class="flex items-center gap-2 mb-2">
								<span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">
									{source === 'property' ? 'Element Variables' : 
									 source === 'condition' ? 'Condition Variables' : 
									 source === 'loop' ? 'Loop Variables' : 'Custom Variables'}
								</span>
								<span class="text-[10px] font-bold text-gray-400">({vars.length})</span>
							</div>
							
							<div class="space-y-3">
								{#each vars as variable}
									<div 
										class="bg-white border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] rounded-lg p-3 transition-all hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5 group"
					>
						<div class="flex items-start justify-between mb-2">
											<div class="flex items-center gap-2 flex-wrap">
								<span class={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border-2 ${getTypeColor(variable.type).replace('border ', 'border-')}`}>
									<i class={`fa ${getTypeIcon(variable.type)} mr-1`}></i>
									{variable.type}
								</span>
												{#if variable.source !== 'property'}
													<span class={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border-2 ${getSourceBadge(variable.source).color.replace('border ', 'border-')}`}>
														{getSourceBadge(variable.source).label}
													</span>
												{/if}
								{#if variable.required}
									<span class="px-1.5 py-0.5 bg-red-100 text-red-700 border-2 border-red-200 text-[10px] rounded font-bold uppercase tracking-wide">
										Required
									</span>
								{/if}
							</div>
											<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												{#if variable.objectId}
							<button 
														class="p-1.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded border border-transparent hover:border-gray-900 transition-colors"
														on:click={() => selectVariable(variable)}
														title="Select element"
													>
														<i class="fa fa-crosshairs text-xs"></i>
													</button>
												{/if}
												<button 
													class="p-1.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded border border-transparent hover:border-gray-900 transition-colors"
													on:click={() => startEdit(variable)}
													title="Edit variable"
												>
													<i class="fa fa-pencil text-xs"></i>
												</button>
												<button 
													class="p-1.5 text-gray-500 hover:text-white hover:bg-red-600 rounded border border-transparent hover:border-red-600 transition-colors"
													on:click={() => confirmDelete(variable)}
													title="Delete variable"
												>
													<i class="fa fa-trash text-xs"></i>
							</button>
											</div>
						</div>
						
										<button 
											class="w-full text-left"
											on:click={() => variable.objectId && selectVariable(variable)}
										>
						<h5 class="font-mono text-sm font-bold text-gray-900 mb-1 truncate">
							{variable.name}
						</h5>
						
						{#if variable.description}
												<p class="text-xs text-gray-500 line-clamp-2 font-medium">{variable.description}</p>
						{/if}
										</button>
					</div>
				{/each}
							</div>
			</div>
		{/if}
				{/each}
		
				<!-- API Example Section -->
		<div class="pt-4 border-t-2 border-gray-900">
				<button 
					class="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity mb-3"
						on:click={() => showApiExample = !showApiExample}
					>
						<span class="text-[10px] font-black text-gray-900 uppercase tracking-widest">API Documentation</span>
						<i class="fa fa-chevron-{showApiExample ? 'up' : 'down'} text-xs text-gray-900"></i>
					</button>
					
					{#if showApiExample}
						<div class="space-y-3">
							<div class="bg-gray-900 rounded-lg p-4 relative border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937]">
								<button 
									class="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
									on:click={copyApiExample}
									title="Copy to clipboard"
								>
									<i class="fa fa-copy text-xs"></i>
								</button>
								<pre class="text-xs text-green-400 overflow-x-auto font-mono"><code>{generateApiExample()}</code></pre>
							</div>
							
							<div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 shadow-[2px_2px_0_0_#bfdbfe]">
								<p class="text-xs text-blue-900 mb-2 break-all font-bold font-mono">
									<span class="bg-blue-200 px-1 rounded">POST</span> /templates/{$template?.uid || '{uid}'}/render
								</p>
								<p class="text-[10px] text-blue-800 font-medium">
									Pass the variables object in your request body to generate a customized image.
								</p>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		
		<!-- Preview Tab -->
		{:else if activeTab === 'preview'}
			<div class="space-y-4">
				<!-- Preview Header -->
				<div class="bg-white border-[2px] border-gray-900 rounded-lg p-4 shadow-[4px_4px_0_0_#1f2937]">
					<div class="flex items-center gap-2 mb-2">
						<i class="fa fa-eye text-[#ff6b6b]"></i>
						<h4 class="text-sm font-black text-gray-900 uppercase tracking-wide">Canvas Preview</h4>
					</div>
					<p class="text-[10px] text-gray-500 mb-3 font-medium">See how your template behaves with test data</p>
					<button
						class="w-full px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border-2 border-gray-900 shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#ffc480] hover:-translate-y-0.5 {$isPreviewActive
							? 'bg-gray-900 text-white hover:bg-black'
							: 'bg-white text-gray-900 hover:bg-gray-50'}"
						on:click={togglePreview}
					>
						{#if $isPreviewActive}
							<i class="fa fa-stop mr-1.5"></i>Stop Preview
						{:else}
							<i class="fa fa-play mr-1.5"></i>Start Preview
						{/if}
					</button>

					
					{#if $isPreviewActive}
						<div class="flex items-center gap-2 text-xs text-gray-900 font-bold mt-3">
							<span class="flex items-center gap-1">
								<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse border border-gray-900"></span>
								Preview Active
							</span>
							<span class="text-gray-300">|</span>
							<span>Changes update live</span>
						</div>
					{/if}
				</div>
				
				<!-- Preview Stats -->
				{#if previewStats}
					<div class="grid grid-cols-2 gap-2">
						<div class="bg-white border-2 border-gray-900 rounded-lg p-3 shadow-[2px_2px_0_0_#1f2937]">
							<div class="flex items-center gap-2 mb-1">
								<i class="fa fa-eye-slash text-gray-400 text-xs"></i>
								<span class="text-[10px] font-black text-gray-500 uppercase">Hidden</span>
							</div>
							<div class="text-xl font-black text-gray-900">{previewStats.hiddenByCondition}</div>
							<div class="text-[10px] font-medium text-gray-400">of {previewStats.conditionsCount} conditions</div>
						</div>
						<div class="bg-white border-2 border-gray-900 rounded-lg p-3 shadow-[2px_2px_0_0_#1f2937]">
							<div class="flex items-center gap-2 mb-1">
								<i class="fa fa-copy text-gray-400 text-xs"></i>
								<span class="text-[10px] font-black text-gray-500 uppercase">Loop Items</span>
							</div>
							<div class="text-xl font-black text-gray-900">{previewStats.loopIterations}</div>
							<div class="text-[10px] font-medium text-gray-400">from {previewStats.loopsCount} loops</div>
						</div>
					</div>
				{/if}
				
				<!-- Validation Messages -->
				{#if previewValidation.errors.length > 0}
					<div class="bg-red-50 border-2 border-red-200 rounded-lg p-3 shadow-[2px_2px_0_0_#ef4444]">
						<div class="flex items-center gap-2 mb-2">
							<i class="fa fa-exclamation-circle text-red-500"></i>
							<span class="text-xs font-black text-red-700 uppercase">Validation Errors</span>
						</div>
						<ul class="text-[10px] font-medium text-red-600 space-y-1">
							{#each previewValidation.errors as error}
								<li>• {error}</li>
							{/each}
						</ul>
					</div>
				{/if}
				
				{#if previewValidation.warnings.length > 0}
					<div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 shadow-[2px_2px_0_0_#fbbf24]">
						<div class="flex items-center gap-2 mb-2">
							<i class="fa fa-exclamation-triangle text-yellow-600"></i>
							<span class="text-xs font-black text-yellow-800 uppercase">Warnings</span>
						</div>
						<ul class="text-[10px] font-medium text-yellow-800 space-y-1">
							{#each previewValidation.warnings as warning}
								<li>• {warning}</li>
							{/each}
						</ul>
					</div>
				{/if}
				
				<!-- Test Values Input -->
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-[10px] font-black text-gray-900 uppercase tracking-widest">Test Data</span>
						<button 
							class="text-[10px] font-bold text-gray-500 hover:text-gray-900"
							on:click={resetTestValues}
						>
							<i class="fa fa-undo mr-1"></i>Reset
						</button>
					</div>
					
					{#if $variables.length === 0}
						<div class="text-center py-6 bg-[#FFFDF8] rounded-lg border-2 border-gray-900 border-dashed">
							<i class="fa fa-info-circle text-gray-400 text-xl mb-2"></i>
							<p class="text-xs font-bold text-gray-500 uppercase">No variables defined yet</p>
							<p class="text-[10px] font-medium text-gray-400 mt-1">Add variables to preview your template</p>
						</div>
					{:else}
						{#each $variables as variable}
							<div class="bg-white border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] rounded-lg p-3">
								<div class="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2">
									<span class={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border-2 ${getTypeColor(variable.type).replace('border ', 'border-')}`}>
										<i class={`fa ${getTypeIcon(variable.type)} mr-0.5`}></i>
										{variable.type}
									</span>
									<span class="font-mono">{variable.name}</span>
									{#if variable.required}
										<span class="text-red-500">*</span>
									{/if}
								</div>
								
								{#if variable.type === 'text'}
									<input
										type="text"
										class={inputBaseClass + " text-xs font-medium"}
										placeholder={variable.defaultValue || 'Enter text...'}
										value={testValues[variable.name] || ''}
										on:input={(e) => updateTestValue(variable.name, e.target.value)}
									/>
								{:else if variable.type === 'image'}
									<input
										type="url"
										class={inputBaseClass + " text-xs font-medium"}
										placeholder="https://example.com/image.jpg"
										value={testValues[variable.name] || ''}
										on:input={(e) => updateTestValue(variable.name, e.target.value)}
									/>
								{:else if variable.type === 'color'}
									<div class="flex gap-2">
										<input
											type="color"
											class="w-10 h-9 border-2 border-gray-900 rounded-lg cursor-pointer shadow-[2px_2px_0_0_#1f2937]"
											value={testValues[variable.name] || '#000000'}
											on:input={(e) => updateTestValue(variable.name, e.target.value)}
										/>
										<input
											type="text"
											class="flex-1 text-xs border-2 border-gray-900 rounded-lg px-3 py-2 font-mono focus:shadow-[4px_4px_0_0_#ffc480] focus:border-gray-900 focus:ring-0 outline-none transition-all font-medium"
											placeholder="#000000"
											value={testValues[variable.name] || ''}
											on:input={(e) => updateTestValue(variable.name, e.target.value)}
										/>
									</div>
								{:else if variable.type === 'boolean'}
									<label class="flex items-center gap-3 cursor-pointer">
										<div class="relative">
											<input
												type="checkbox"
												class="sr-only peer"
												checked={testValues[variable.name] || false}
												on:change={(e) => updateTestValue(variable.name, e.target.checked)}
											/>
											<div class="w-10 h-6 bg-gray-200 rounded-full border-2 border-gray-900 peer-checked:bg-gray-900 transition-colors"></div>
											<div class="absolute left-1 top-1 w-4 h-4 bg-white border border-gray-900 rounded-full shadow peer-checked:translate-x-4 transition-transform"></div>
										</div>
										<span class="text-xs font-bold text-gray-600 uppercase">
											{testValues[variable.name] ? 'true' : 'false'}
										</span>
									</label>
								{:else if variable.type === 'number'}
									<input
										type="number"
										class={inputBaseClass + " text-xs font-medium"}
										placeholder={variable.defaultValue?.toString() || '0'}
										value={testValues[variable.name] ?? variable.defaultValue ?? ''}
										on:input={(e) => updateTestValue(variable.name, parseFloat(e.target.value) || 0)}
									/>
								{:else}
									<!-- Array, Object, Chart, Table -->
									<textarea
										class="w-full h-24 text-[10px] font-mono border-2 border-gray-900 rounded-lg px-3 py-2 focus:shadow-[4px_4px_0_0_#ffc480] focus:border-gray-900 focus:ring-0 outline-none transition-all font-medium"
										placeholder={JSON.stringify(variable.defaultValue || {}, null, 2)}
										value={typeof testValues[variable.name] === 'string' ? testValues[variable.name] : JSON.stringify(testValues[variable.name] || variable.defaultValue || {}, null, 2)}
										on:input={(e) => {
											try {
												const parsed = JSON.parse(e.target.value);
												updateTestValue(variable.name, parsed);
											} catch {
												updateTestValue(variable.name, e.target.value);
											}
										}}
									></textarea>
								{/if}
								
								{#if variable.description}
									<p class="text-[10px] font-medium text-gray-400 mt-1.5">{variable.description}</p>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
				
				<!-- Quick Tips -->
				<div class="bg-[#FFFDF8] border-2 border-gray-900 rounded-lg p-3 shadow-[2px_2px_0_0_#1f2937]">
					<div class="flex items-start gap-2">
						<i class="fa fa-lightbulb text-gray-900 mt-0.5"></i>
						<div>
							<p class="text-xs font-black text-gray-900 mb-1 uppercase">Preview Tips</p>
							<ul class="text-[10px] font-medium text-gray-600 space-y-0.5">
								<li>• Conditions: Elements will show/hide based on your test data</li>
								<li>• Loops: Array variables will repeat elements with each item</li>
								<li>• Text: Use <code class="bg-gray-200 px-1 rounded text-gray-900 font-mono">{"{{ variable }}"}</code> for dynamic text</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		
		<!-- Test API Tab -->
		{:else if activeTab === 'test'}
					<div class="space-y-4">
						{#if guestMode && !$user?.email}
							<div class="bg-[#fff7ed] border-2 border-gray-900 rounded-lg p-3 shadow-[2px_2px_0_0_#1f2937]">
								<div class="flex items-start gap-2">
									<i class="fa fa-lock text-gray-900 mt-0.5"></i>
									<div>
										<p class="text-xs font-black text-gray-900 uppercase mb-1">Guest mode</p>
										<p class="text-[10px] font-medium text-gray-700">
											You can design and preview variables here. Create a free account to save the template and test the Render API.
										</p>
										<button
											on:click={saveAndShowAuth}
											class="inline-flex mt-2 text-[10px] font-black uppercase tracking-wide text-blue-700 hover:text-black hover:underline"
										>
											Create free account →
										</button>
									</div>
								</div>
							</div>
						{/if}

						<!-- Template Status -->
						{#if !$template?.uid}
							<div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 shadow-[2px_2px_0_0_#fbbf24]">
								<div class="flex items-start gap-2">
									<i class="fa fa-exclamation-triangle text-yellow-700 mt-0.5"></i>
									<div>
										<p class="text-xs text-yellow-900 font-black uppercase mb-1">Template Not Saved</p>
										<p class="text-[10px] font-medium text-yellow-800">
									Save your template first to test the render API.
										</p>
									</div>
								</div>
							</div>
						{:else}
							<div class="bg-green-50 border-2 border-green-200 rounded-lg p-2 shadow-[2px_2px_0_0_#86efac]">
								<p class="text-[10px] font-medium text-green-900">
									<i class="fa fa-check-circle mr-1"></i>
									Template ID: <span class="font-mono font-bold">{$template.uid}</span>
								</p>
							</div>
						{/if}
						
						<!-- API Token Selection -->
						<div class="space-y-1">
							<div class="flex items-center justify-between">
								<label for="api-token-select" class="text-xs font-bold text-gray-900 uppercase">API Token</label>
								{#if guestMode}
									<button
										on:click={saveAndShowAuth}
										class="text-[10px] font-bold text-blue-600 hover:underline hover:text-black"
									>
										Manage Tokens
									</button>
								{:else}
									<a href="/dashboard/api-token" target="_blank" class="text-[10px] font-bold text-blue-600 hover:underline hover:text-black">
										Manage Tokens
									</a>
								{/if}
							</div>
							
							{#if apiTokens.length > 0}
								<select
									id="api-token-select"
									class="w-full text-xs border-2 border-gray-900 rounded-lg px-2 py-1.5 focus:shadow-[4px_4px_0_0_#ffc480] focus:border-gray-900 focus:ring-0 outline-none transition-all font-medium bg-white"
									bind:value={selectedToken}
								>
									{#each apiTokens as token}
										<option value={token.token}>{token.token.slice(0, 12)}...{token.token.slice(-4)}</option>
									{/each}
								</select>
							{:else}
								<div class="bg-gray-50 border-2 border-gray-900 rounded-lg px-3 py-2 text-center border-dashed">
									<p class="text-[10px] font-bold text-gray-500 mb-1 uppercase">No API tokens found</p>
									{#if guestMode}
										<button
											on:click={saveAndShowAuth}
											class="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-wide"
										>
											Sign up to create a token
										</button>
									{:else}
										<a href="/dashboard/api-token" target="_blank" class="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-wide">
											Create a token
										</a>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Variable Inputs -->
				{#if $variables.length > 0}
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-xs font-black text-gray-900 uppercase tracking-wide">Test Values</span>
								<button 
									class="text-[10px] font-bold text-gray-500 hover:text-gray-900"
									on:click={resetTestValues}
								>
									<i class="fa fa-undo mr-1"></i>Reset
								</button>
							</div>
							
						{#each $variables as variable}
								<div>
									<label for={'test-val-' + variable.name} class="block text-[10px] font-bold text-gray-700 mb-1 uppercase">
										{variable.name}
										{#if variable.required}
											<span class="text-red-500">*</span>
										{/if}
									<span class={`ml-1 ${getTypeColor(variable.type).replace('border ', 'border-')} border-2 px-1 py-0.5 rounded text-[9px]`}>
										{variable.type}
									</span>
									</label>
									{#if variable.type === 'text'}
										<input
											id={'test-val-' + variable.name}
											type="text"
											class="w-full text-xs border-2 border-gray-900 rounded-lg px-2 py-1.5 focus:shadow-[4px_4px_0_0_#ffc480] focus:border-gray-900 focus:ring-0 outline-none transition-all font-medium"
											placeholder={variable.defaultValue || 'Enter text...'}
											value={testValues[variable.name] || ''}
											on:input={(e) => updateTestValue(variable.name, e.target.value)}
										/>
									{:else if variable.type === 'image'}
										<input
											id={'test-val-' + variable.name}
											type="url"
											class="w-full text-xs border-2 border-gray-900 rounded-lg px-2 py-1.5 focus:shadow-[4px_4px_0_0_#ffc480] focus:border-gray-900 focus:ring-0 outline-none transition-all font-medium"
											placeholder="https://example.com/image.jpg"
											value={testValues[variable.name] || ''}
											on:input={(e) => updateTestValue(variable.name, e.target.value)}
										/>
									{:else if variable.type === 'color'}
										<div class="flex gap-2">
											<input
												type="color"
												class="w-10 h-8 border-2 border-gray-900 rounded-lg cursor-pointer shadow-[2px_2px_0_0_#1f2937]"
												value={testValues[variable.name] || '#000000'}
												on:input={(e) => updateTestValue(variable.name, e.target.value)}
											/>
											<input
												id={'test-val-' + variable.name}
												type="text"
											class="flex-1 text-xs border-2 border-gray-900 rounded-lg px-2 py-1.5 font-mono focus:shadow-[4px_4px_0_0_#ffc480] focus:border-gray-900 focus:ring-0 outline-none transition-all font-medium"
												placeholder="#000000"
												value={testValues[variable.name] || ''}
												on:input={(e) => updateTestValue(variable.name, e.target.value)}
											/>
										</div>
									{:else if variable.type === 'boolean'}
										<div class="flex items-center gap-2">
											<input
												id={'test-val-' + variable.name}
												type="checkbox"
												class="w-4 h-4 border-2 border-gray-900 rounded cursor-pointer text-black focus:ring-0"
												checked={testValues[variable.name] || false}
												on:change={(e) => updateTestValue(variable.name, e.target.checked)}
											/>
											<span class="text-xs font-bold text-gray-500 uppercase">
												{testValues[variable.name] ? 'true' : 'false'}
											</span>
										</div>
									{:else if variable.type === 'number'}
										<input
											id={'test-val-' + variable.name}
											type="number"
											class="w-full text-xs border-2 border-gray-900 rounded-lg px-2 py-1.5 focus:shadow-[4px_4px_0_0_#ffc480] focus:border-gray-900 focus:ring-0 outline-none transition-all font-medium"
											placeholder={variable.defaultValue?.toString() || '0'}
											value={testValues[variable.name] ?? variable.defaultValue ?? ''}
											on:input={(e) => updateTestValue(variable.name, parseFloat(e.target.value) || 0)}
										/>
								{:else}
									<!-- Array, Object, Chart, Table -->
											<textarea
												id={'test-val-' + variable.name}
												class="w-full h-24 text-[10px] font-mono border-2 border-gray-900 rounded-lg px-2 py-1.5 focus:shadow-[4px_4px_0_0_#ffc480] focus:border-gray-900 focus:ring-0 outline-none transition-all font-medium"
										placeholder={JSON.stringify(variable.defaultValue || {}, null, 2)}
										value={typeof testValues[variable.name] === 'string' ? testValues[variable.name] : JSON.stringify(testValues[variable.name] || variable.defaultValue || {}, null, 2)}
												on:input={(e) => {
													try {
														const parsed = JSON.parse(e.target.value);
														updateTestValue(variable.name, parsed);
													} catch {
														updateTestValue(variable.name, e.target.value);
													}
												}}
											></textarea>
									{/if}
								</div>
							{/each}
						</div>
				{:else}
					<div class="text-center py-6 bg-[#FFFDF8] rounded-lg border-2 border-gray-900 border-dashed">
						<p class="text-xs font-bold text-gray-500 uppercase">No variables to test</p>
					</div>
				{/if}

						<!-- Guest Mode Message -->
						{#if guestMode && !$user?.email}
							<div class="bg-[#fff7ed] border-2 border-gray-900 rounded-lg p-3 shadow-[2px_2px_0_0_#1f2937]">
								<div class="flex items-center gap-2">
									<i class="fa fa-info-circle text-[#ffc480]"></i>
									<p class="text-[10px] font-bold text-gray-900 uppercase">Free account required</p>
								</div>
								<p class="text-[10px] font-medium text-gray-700 mt-1">
									Sign up to generate images from your designs. Your work will be saved!
								</p>
							</div>
						{/if}

						<!-- Render Button -->
						<button
							class="w-full py-2.5 px-3 {guestMode && !$user?.email ? 'bg-[#ffc480]' : guestMode ? 'bg-[#4ade80]' : 'bg-gray-900'} hover:opacity-90 text-{guestMode && !$user?.email ? 'gray-900' : 'white'} rounded-lg transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_{guestMode && !$user?.email ? '#ff6b6b' : '#ffc480'}] hover:-translate-y-0.5 font-black uppercase tracking-wider border-2 border-gray-900"
							on:click={handleGenerate}
							disabled={isRendering}
							title={guestMode && !$user?.email ? 'Sign up to generate images' : ''}
						>
							{#if isRendering}
								<i class="fa fa-spinner fa-spin"></i>
								Generating...
							{:else if guestMode && !$user?.email}
								<i class="fa fa-lock"></i>
								Sign Up to Generate
							{:else if guestMode}
								<i class="fa fa-image"></i>
								Generate Image
							{:else if !$template?.uid}
								<i class="fa fa-save"></i>
								Save template first
							{:else}
								<i class="fa fa-play"></i>
								Test Render API
							{/if}
						</button>
						
						<!-- Render Result -->
						{#if renderedImageUrl}
							<div class="space-y-3">
								<div class="flex items-center justify-between">
									<span class="text-xs font-black text-gray-900 uppercase tracking-wide">Result</span>
									{#if lastRenderTime}
										<span class="text-[10px] font-bold text-green-600 uppercase">
											<i class="fa fa-clock mr-1"></i>{lastRenderTime}ms
										</span>
									{/if}
								</div>
								
								<div class="relative group">
									<img 
										src={renderedImageUrl} 
										alt="Rendered template"
										class="w-full rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
									/>
									<div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2 backdrop-blur-sm">
										<button 
											class="p-2 bg-white border-2 border-gray-900 rounded-full hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_#000]"
											on:click={openImageInNewTab}
											title="Open in new tab"
										>
											<i class="fa fa-external-link-alt text-gray-900"></i>
										</button>
										<button 
											class="p-2 bg-white border-2 border-gray-900 rounded-full hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_#000]"
											on:click={downloadImage}
											title="Download image"
										>
											<i class="fa fa-download text-gray-900"></i>
										</button>
									</div>
								</div>
								
								<!-- Action buttons row -->
								<div class="flex items-center gap-2">
									<ShareResultButton
										assetUrl={renderedImageUrl}
										contentType="image"
										width={$editor?.width || 1200}
										height={$editor?.height || 630}
										format="png"
										source={guestMode ? 'tool' : 'dashboard'}
										toolName="Canvas Editor"
										templateUid={$template?.uid || ''}
										variant="small"
										className="flex-1"
									/>
									<button 
										class="px-3 py-1.5 bg-white border-[2px] border-gray-900 font-black text-xs uppercase shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
										on:click={downloadImage}
										title="Download"
									>
										<i class="fa fa-download"></i>
									</button>
								</div>
								
								<!-- Guest mode signup CTA -->
								{#if guestMode}
									<div class="bg-[#f0fdf4] border-2 border-gray-900 rounded-lg p-3 shadow-[2px_2px_0_0_#4ade80]">
										<p class="text-xs font-bold text-gray-700 mb-2">
											<i class="fa fa-star text-[#ffc480] mr-1"></i>
											Sign up to save your template and automate variants via API.
										</p>
										<button
											class="w-full py-2 bg-[#ff6b6b] text-white border-2 border-gray-900 font-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
											on:click={saveAndSignup}
										>
											Create free account
										</button>
									</div>
								{/if}
							</div>
						{/if}
						
						{#if renderedPdfUrl}
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-xs font-black text-gray-900 uppercase tracking-wide">PDF Result</span>
								{#if lastRenderTime}
									<span class="text-[10px] font-bold text-green-600 uppercase">
										<i class="fa fa-clock mr-1"></i>{lastRenderTime}ms
									</span>
								{/if}
							</div>
							
							<div class="bg-green-50 border-2 border-gray-900 rounded-lg p-3 shadow-[2px_2px_0_0_#22c55e]">
								<div class="flex items-center gap-2 mb-2">
									<i class="fa fa-file-pdf text-red-500 text-lg"></i>
									<span class="text-xs font-bold text-gray-900">PDF Generated Successfully!</span>
								</div>
								
								<!-- URL Display -->
								<div class="bg-white border-2 border-gray-300 rounded-lg p-2 mb-3">
									<p class="text-[10px] font-bold text-gray-500 uppercase mb-1">PDF URL</p>
									<p class="text-xs font-mono text-gray-700 break-all select-all">{renderedPdfUrl}</p>
								</div>
								
								<!-- Action Buttons -->
								<div class="flex gap-2">
									<button 
										class="flex-1 py-2 bg-white border-2 border-gray-900 font-black text-xs uppercase shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-1.5"
										on:click={() => {
											navigator.clipboard.writeText(renderedPdfUrl);
											toast.set({ message: 'PDF URL copied!', type: 'success', duration: 1500 });
										}}
									>
										<i class="fa fa-copy"></i>
										Copy URL
									</button>
									<button 
										class="flex-1 py-2 bg-[#ffc480] border-2 border-gray-900 font-black text-xs uppercase shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-1.5"
										on:click={() => window.open(renderedPdfUrl, '_blank')}
									>
										<i class="fa fa-external-link-alt"></i>
										Open PDF
									</button>
								</div>
							</div>
							
							<!-- Guest mode signup CTA for PDF -->
							{#if guestMode}
								<div class="bg-[#f0fdf4] border-2 border-gray-900 rounded-lg p-3 shadow-[2px_2px_0_0_#4ade80]">
									<p class="text-xs font-bold text-gray-700 mb-2">
										<i class="fa fa-star text-[#ffc480] mr-1"></i>
										Sign up to save your template and automate PDF generation via API.
									</p>
									<button
										class="w-full py-2 bg-[#ff6b6b] text-white border-2 border-gray-900 font-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
										on:click={saveAndSignup}
									>
										Create free account
									</button>
								</div>
							{/if}
						</div>
					{/if}
					
					{#if renderError}
						<div class="bg-red-50 border-2 border-red-200 rounded-lg p-3 shadow-[2px_2px_0_0_#ef4444]">
							<p class="text-xs font-bold text-red-800 uppercase">
								<i class="fa fa-exclamation-circle mr-1"></i>
								{renderError}
							</p>
						</div>
					{/if}
						
						<!-- Request Details -->
						<div class="pt-3 border-t-2 border-gray-900">
							<button 
								class="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity mb-2"
								on:click={() => showRequestDetails = !showRequestDetails}
							>
								<span class="text-[10px] font-black text-gray-900 uppercase tracking-widest">Request Details</span>
								<i class="fa fa-chevron-{showRequestDetails ? 'up' : 'down'} text-[10px] text-gray-900"></i>
							</button>
							
							{#if showRequestDetails}
								<div class="space-y-2">
									<div class="bg-gray-900 rounded-lg p-3 relative border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937]">
										<button 
											class="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
											on:click={copyCurlCommand}
											title="Copy cURL command"
										>
											<i class="fa fa-copy text-[10px]"></i>
										</button>
										<pre class="text-[10px] text-green-400 overflow-x-auto whitespace-pre-wrap font-mono"><code>{generateCurlCommand()}</code></pre>
									</div>
									
									<div class="bg-gray-100 border-2 border-gray-900 rounded-lg p-2 shadow-[2px_2px_0_0_#1f2937]">
										<p class="text-[10px] text-gray-600 mb-1 font-bold uppercase tracking-wide">Request Body:</p>
										<pre class="text-[10px] text-gray-800 font-mono overflow-x-auto font-medium"><code>{JSON.stringify({ variables: testValues }, null, 2)}</code></pre>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
			
	<!-- Delete Confirmation Modal -->
	{#if showDeleteConfirm}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] p-6 max-w-sm mx-4">
				<div class="text-center">
					<div class="w-12 h-12 mx-auto mb-4 bg-red-100 border-2 border-red-200 rounded-full flex items-center justify-center shadow-[2px_2px_0_0_#ef4444]">
						<i class="fa fa-trash text-red-600 text-xl"></i>
					</div>
					<h4 class="text-lg font-black text-gray-900 mb-2 uppercase tracking-wide">Delete Variable?</h4>
					<p class="text-sm font-medium text-gray-600 mb-4">
						Are you sure you want to delete <span class="font-mono font-bold text-gray-900 bg-gray-100 px-1 rounded">"{variableToDelete?.name}"</span>? 
						{#if variableToDelete?.source === 'property'}
							This will also remove the variable from the associated element.
						{/if}
					</p>
					<div class="flex gap-3">
				<button 
							class="flex-1 py-2 px-4 border-[2px] border-gray-900 rounded-lg text-sm font-black text-gray-900 hover:bg-gray-50 transition-all uppercase tracking-wider shadow-[2px_2px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5"
							on:click={() => { showDeleteConfirm = false; variableToDelete = null; }}
				>
							Cancel
				</button>
							<button 
							class="flex-1 py-2 px-4 bg-red-600 text-white border-2 border-gray-900 rounded-lg text-sm font-black hover:bg-red-700 transition-all uppercase tracking-wider shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5"
							on:click={deleteVariable}
							>
							Delete
							</button>
						</div>
						</div>
						</div>
					</div>
				{/if}
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #111827;
		border-radius: 3px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #000;
	}
	
	.line-clamp-2 {
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>

<!-- Auth Modal -->
<AuthModal
	bind:isOpen={showAuthModal}
	onSuccess={handleAuthSuccess}
/>
