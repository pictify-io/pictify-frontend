<script>
	import { onMount, onDestroy } from 'svelte';
	import { editor, selectedComponent, editorActions } from '../../../store/editor.store';
	import { user, getAPITokenAction } from '../../../store/user.store';
	import { template } from '../../../store/template.store';
	import { renderTemplate } from '../../../api/template';
	import { toast } from '../../../store/toast.store';
	
	let variables = [];
	let showApiExample = false;
	let showTestPanel = false;
	
	// Test state
	let testValues = {};
	let isRendering = false;
	let renderedImageUrl = null;
	let renderError = null;
	let lastRenderTime = null;
	let showRequestDetails = false;
	
	// Track refresh trigger
	let refreshTrigger = 0;

	onMount(() => {
		getAPITokenAction();
	});

	// API Tokens
	let apiTokens = [];
	let selectedToken = '';

	// Subscribe to user store for API tokens
	$: if ($user?.apiTokens) {
		apiTokens = $user.apiTokens;
		// Select first token by default if none selected
		if (!selectedToken && apiTokens.length > 0) {
			selectedToken = apiTokens[0].token;
		}
	}
	
	// Watch for canvas changes and extract variables
	$: if ($editor || refreshTrigger) {
		extractVariables();
	}
	
	// Also refresh when selected component changes (indicates canvas activity)
	$: if ($selectedComponent !== undefined) {
		// Delay to ensure properties are set
		setTimeout(() => extractVariables(), 100);
	}
	
	// Initialize test values when variables change
	$: if (variables.length > 0) {
		initializeTestValues();
	}
	
	// Set up canvas event listeners to detect when objects change
	let canvasEventCleanup = null;
	
	$: if ($editor && !canvasEventCleanup) {
		setupCanvasListeners();
	}
	
	function setupCanvasListeners() {
		if (!$editor) return;
		
		const handleChange = () => {
			// Debounce the refresh
			setTimeout(() => {
				refreshTrigger++;
			}, 200);
		};
		
		// Listen to various canvas events that might indicate variable changes
		$editor.on('object:added', handleChange);
		$editor.on('object:removed', handleChange);
		$editor.on('object:modified', handleChange);
		
		canvasEventCleanup = () => {
			$editor.off('object:added', handleChange);
			$editor.off('object:removed', handleChange);
			$editor.off('object:modified', handleChange);
		};
	}
	
	onDestroy(() => {
		if (canvasEventCleanup) {
			canvasEventCleanup();
		}
	});
	
	function extractVariables() {
		if (!$editor) {
			variables = [];
			return;
		}
		
		const objects = $editor.getObjects();
		const newVariables = objects
			.filter(obj => obj.isVariable)
			.map(obj => ({
				id: obj.id,
				name: obj.variableName || obj.id,
				type: getVariableType(obj),
				description: obj.variableDescription || '',
				property: obj.variableProperty || 'text',
				required: obj.variableValidation?.required || false,
				defaultValue: getDefaultValue(obj),
				objectType: obj.type,
				// Additional metadata for charts/tables
				isChart: obj.isChart || false,
				isTable: obj.isTable || false,
				chartType: obj.chartType,
				tableType: obj.tableType
			}));
		
		// Only update if changed to avoid unnecessary re-renders
		if (JSON.stringify(newVariables) !== JSON.stringify(variables)) {
			variables = newVariables;
			console.log('Variables extracted:', variables.length, 'variables found');
		}
	}
	
	function initializeTestValues() {
		// Only initialize values that don't exist yet
		variables.forEach(v => {
			if (testValues[v.name] === undefined) {
				testValues[v.name] = v.defaultValue || '';
			}
		});
		// Remove values for variables that no longer exist
		Object.keys(testValues).forEach(key => {
			if (!variables.find(v => v.name === key)) {
				delete testValues[key];
			}
		});
		testValues = { ...testValues };
	}
	
	function getVariableType(obj) {
		// Check for chart/table first
		if (obj.isChart) return 'chart';
		if (obj.isTable) return 'table';
		
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
		// Handle chart data
		if (obj.isChart) {
			return obj.chartData || [
				{ label: 'Jan', value: 30 },
				{ label: 'Feb', value: 45 },
				{ label: 'Mar', value: 60 }
			];
		}
		
		// Handle table data (universal format)
		if (obj.isTable) {
			if (obj.tableType === 'stats') {
				return {
					headers: ['Metric', 'Value', 'Change'],
					rows: (obj.tableData || []).map(stat => [stat.label, stat.value, stat.change || ''])
				};
			} else if (obj.tableType === 'comparison') {
				const features = obj.tableFeatures || [];
				const plans = obj.tablePlans || [];
				const headers = ['Feature', ...plans.map(p => p.name)];
				const priceRow = ['Price', ...plans.map(p => p.price)];
				const featureRows = features.map((f, idx) => [f, ...plans.map(p => p.values?.[idx] || '')]);
				return { headers, rows: [priceRow, ...featureRows] };
			} else {
				return {
					headers: obj.tableHeaders || ['Product', 'Price', 'Stock'],
					rows: obj.tableRows || [['Item A', '$10', '100'], ['Item B', '$20', '50']]
				};
			}
		}
		
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
	
	function selectVariable(variable) {
		if (!$editor) return;
		
		const obj = $editor.getObjects().find(o => o.id === variable.id);
		if (obj) {
			$editor.setActiveObject(obj);
			editorActions.selectComponent(obj);
			$editor.renderAll();
		}
	}
	
	function removeVariable(variable) {
		if (!$editor) return;
		
		const obj = $editor.getObjects().find(o => o.id === variable.id);
		if (obj) {
			obj.set('isVariable', false);
			obj.set('variableName', '');
			obj.set('variableDescription', '');
			obj.set('variableProperty', '');
			obj.set('variableValidation', null);
			$editor.renderAll();
			extractVariables();
		}
	}
	
	function getTypeIcon(type) {
		switch (type) {
			case 'text': return 'fa-font';
			case 'image': return 'fa-image';
			case 'color': return 'fa-palette';
			case 'chart': return 'fa-chart-bar';
			case 'table': return 'fa-table';
			default: return 'fa-code';
		}
	}
	
	function getTypeColor(type) {
		switch (type) {
			case 'text': return 'bg-blue-100 text-blue-700';
			case 'image': return 'bg-purple-100 text-purple-700';
			case 'color': return 'bg-orange-100 text-orange-700';
			case 'chart': return 'bg-pink-100 text-pink-700';
			case 'table': return 'bg-teal-100 text-teal-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}
	
	function generateApiExample() {
		if (variables.length === 0) return '{}';
		
		const example = {};
		variables.forEach(v => {
			if (v.type === 'text') {
				example[v.name] = v.defaultValue || 'Your text here';
			} else if (v.type === 'image') {
				example[v.name] = 'https://example.com/image.jpg';
			} else if (v.type === 'color') {
				example[v.name] = '#ff6b6b';
			} else if (v.type === 'chart') {
				// Chart data format
				example[v.name] = [
					{ label: 'Jan', value: 30 },
					{ label: 'Feb', value: 45 },
					{ label: 'Mar', value: 60 },
					{ label: 'Apr', value: 35 }
				];
			} else if (v.type === 'table') {
				// Universal table format (works for all table types)
				if (v.tableType === 'stats') {
					example[v.name] = {
						headers: ['Metric', 'Value', 'Change'],
						rows: [
							['Revenue', '$45,231', '+12%'],
							['Users', '2,345', '+8%'],
							['Conversion', '3.2%', '-0.5%']
						]
					};
				} else if (v.tableType === 'comparison') {
					example[v.name] = {
						headers: ['Feature', 'Basic', 'Pro', 'Enterprise'],
						rows: [
							['Price', '$9/mo', '$29/mo', '$99/mo'],
							['Storage', '10GB', '100GB', 'Unlimited'],
							['Users', '1', '5', '∞']
						]
					};
				} else {
					example[v.name] = {
						headers: ['Product', 'Price', 'Stock'],
						rows: [
							['Widget A', '$29.99', '150'],
							['Widget B', '$49.99', '89']
						]
					};
				}
			}
		});
		
		return JSON.stringify(example, null, 2);
	}
	
	function copyApiExample() {
		navigator.clipboard.writeText(generateApiExample());
		toast.set({ message: 'Copied to clipboard!', duration: 1500 });
	}
	
	function updateTestValue(name, value) {
		testValues[name] = value;
		testValues = { ...testValues };
	}
	
	function resetTestValues() {
		variables.forEach(v => {
			testValues[v.name] = v.defaultValue || '';
		});
		testValues = { ...testValues };
	}
	
	async function testRenderApi() {
		// Check if template is saved
		if (!$template?.uid) {
			toast.set({ 
				message: 'Please save the template first before testing the API', 
				duration: 3000 
			});
			return;
		}
		
		isRendering = true;
		renderError = null;
		renderedImageUrl = null;
		const startTime = Date.now();
		
		try {
			const result = await renderTemplate($template.uid, testValues, {
				format: 'png',
				quality: 0.9,
				headers: selectedToken ? { 'Authorization': `Bearer ${selectedToken}` } : {}
			});
			
			lastRenderTime = Date.now() - startTime;
			renderedImageUrl = result.url;
			
			toast.set({ 
				message: `Image rendered in ${lastRenderTime}ms!`, 
				duration: 2000 
			});
		} catch (error) {
			renderError = error.message || 'Failed to render template';
			toast.set({ 
				message: renderError, 
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
  '${window.location.origin}/api/templates/${$template.uid}/render' \\
  -H 'Authorization: Bearer ${selectedToken || 'YOUR_API_TOKEN'}' \\
  -H 'Content-Type: application/json' \\
  -d '${varsJson}'`;
	}
	
	function copyCurlCommand() {
		navigator.clipboard.writeText(generateCurlCommand());
		toast.set({ message: 'cURL command copied!', duration: 1500 });
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
</script>

<div class="w-full bg-white border-l border-gray-200 h-full flex flex-col shadow-sm z-10">
	<div class="px-5 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
		<h3 class="font-bold text-sm text-gray-900 uppercase tracking-wider">Template Variables</h3>
	</div>
	
	<div class="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-4 bg-gray-50/50">
		{#if variables.length === 0}
			<div class="text-center py-8">
				<div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
					<i class="fa fa-code text-2xl text-gray-400"></i>
				</div>
				<h4 class="text-sm font-medium text-gray-700 mb-2">No Variables Yet</h4>
				<p class="text-xs text-gray-500 mb-4">
					Select an element and mark it as a variable in the Properties panel to make it customizable via API.
				</p>
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
					<p class="text-xs text-blue-800">
						<strong>Tip:</strong> Variables let you create dynamic templates. When generating images via API, pass different values to customize the output.
					</p>
				</div>
			</div>
		{:else}
			<!-- Variables List -->
			<div class="space-y-3">
				{#each variables as variable}
					<div 
						class="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors cursor-pointer"
						on:click={() => selectVariable(variable)}
						on:keydown={(e) => e.key === 'Enter' && selectVariable(variable)}
						role="button"
						tabindex="0"
					>
						<div class="flex items-start justify-between mb-2">
							<div class="flex items-center gap-2">
								<span class={`px-2 py-0.5 rounded text-[10px] font-medium ${getTypeColor(variable.type)}`}>
									<i class={`fa ${getTypeIcon(variable.type)} mr-1`}></i>
									{variable.type}
								</span>
								{#if variable.required}
									<span class="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded font-medium">
										Required
									</span>
								{/if}
							</div>
							<button 
								class="text-gray-400 hover:text-red-500 transition-colors p-1"
								on:click|stopPropagation={() => removeVariable(variable)}
								title="Remove variable"
							>
								<i class="fa fa-times text-xs"></i>
							</button>
						</div>
						
						<h5 class="font-mono text-sm font-medium text-gray-900 mb-1">
							{variable.name}
						</h5>
						
						{#if variable.description}
							<p class="text-xs text-gray-500 mb-2">{variable.description}</p>
						{/if}
						
						<div class="text-[10px] text-gray-400">
							Property: <span class="font-mono">{variable.property}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
		
		<!-- Test API Section (Always visible) -->
		<div class="pt-4 border-t border-gray-200">
				<button 
					class="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity mb-3"
					on:click={() => showTestPanel = !showTestPanel}
				>
					<div class="flex items-center gap-2">
						<span class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Test API</span>
						<span class="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-medium">
							Live
						</span>
					</div>
					<i class="fa fa-chevron-{showTestPanel ? 'up' : 'down'} text-xs text-gray-400"></i>
				</button>
				
				{#if showTestPanel}
					<div class="space-y-4">
						<!-- Template Status -->
						{#if !$template?.uid}
							<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
								<div class="flex items-start gap-2">
									<i class="fa fa-exclamation-triangle text-yellow-600 mt-0.5"></i>
									<div>
										<p class="text-xs text-yellow-800 font-medium mb-1">Template Not Saved</p>
										<p class="text-[10px] text-yellow-700">
											Save your template first to test the render API. Click the "Save" button in the top bar.
										</p>
									</div>
								</div>
							</div>
						{:else}
							<div class="bg-green-50 border border-green-200 rounded-lg p-2">
								<p class="text-[10px] text-green-800">
									<i class="fa fa-check-circle mr-1"></i>
									Template ID: <span class="font-mono font-medium">{$template.uid}</span>
								</p>
							</div>
						{/if}
						
						<!-- API Token Selection -->
						<div class="space-y-1">
							<div class="flex items-center justify-between">
								<label class="text-xs font-medium text-gray-700">API Token</label>
								<a href="/dashboard/api-token" target="_blank" class="text-[10px] text-blue-600 hover:underline">
									Manage Tokens
								</a>
							</div>
							
							{#if apiTokens.length > 0}
								<select
									class="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:border-black focus:ring-1 focus:ring-black bg-white"
									bind:value={selectedToken}
								>
									{#each apiTokens as token}
										<option value={token.token}>{token.token.slice(0, 12)}...{token.token.slice(-4)}</option>
									{/each}
								</select>
							{:else}
								<div class="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-center">
									<p class="text-[10px] text-gray-500 mb-1">No API tokens found</p>
									<a href="/dashboard/api-token" target="_blank" class="text-[10px] font-medium text-blue-600 hover:underline">
										Create a token
									</a>
								</div>
							{/if}
						</div>

						<!-- Variable Inputs -->
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<label class="text-xs font-medium text-gray-700">Test Values</label>
								<button 
									class="text-[10px] text-gray-500 hover:text-gray-700"
									on:click={resetTestValues}
								>
									<i class="fa fa-undo mr-1"></i>Reset
								</button>
							</div>
							
							{#each variables as variable}
								<div>
									<label class="block text-[10px] font-medium text-gray-600 mb-1">
										{variable.name}
										{#if variable.required}
											<span class="text-red-500">*</span>
										{/if}
										{#if variable.type === 'chart'}
											<span class="text-pink-500 ml-1">(Chart)</span>
										{:else if variable.type === 'table'}
											<span class="text-teal-500 ml-1">({variable.tableType || 'Table'})</span>
										{/if}
									</label>
									{#if variable.type === 'text'}
										<input
											type="text"
											class="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:border-black focus:ring-1 focus:ring-black"
											placeholder={variable.defaultValue || 'Enter text...'}
											value={testValues[variable.name] || ''}
											on:input={(e) => updateTestValue(variable.name, e.target.value)}
										/>
									{:else if variable.type === 'image'}
										<input
											type="url"
											class="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:border-black focus:ring-1 focus:ring-black"
											placeholder="https://example.com/image.jpg"
											value={testValues[variable.name] || ''}
											on:input={(e) => updateTestValue(variable.name, e.target.value)}
										/>
									{:else if variable.type === 'color'}
										<div class="flex gap-2">
											<input
												type="color"
												class="w-10 h-8 border border-gray-200 rounded cursor-pointer"
												value={testValues[variable.name] || '#000000'}
												on:input={(e) => updateTestValue(variable.name, e.target.value)}
											/>
											<input
												type="text"
												class="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:border-black focus:ring-1 focus:ring-black font-mono"
												placeholder="#000000"
												value={testValues[variable.name] || ''}
												on:input={(e) => updateTestValue(variable.name, e.target.value)}
											/>
										</div>
									{:else if variable.type === 'chart'}
										<div class="space-y-1">
											<textarea
												class="w-full h-24 text-[10px] font-mono border border-gray-200 rounded px-2 py-1.5 focus:border-black focus:ring-1 focus:ring-black"
												placeholder={'[{"label": "Jan", "value": 30}, ...]'}
												value={typeof testValues[variable.name] === 'string' ? testValues[variable.name] : JSON.stringify(testValues[variable.name] || [], null, 2)}
												on:input={(e) => {
													try {
														const parsed = JSON.parse(e.target.value);
														updateTestValue(variable.name, parsed);
													} catch {
														updateTestValue(variable.name, e.target.value);
													}
												}}
											></textarea>
											<p class="text-[9px] text-gray-400">Array of {`{label, value}`} objects</p>
										</div>
									{:else if variable.type === 'table'}
										<div class="space-y-1">
											<textarea
												class="w-full h-28 text-[10px] font-mono border border-gray-200 rounded px-2 py-1.5 focus:border-black focus:ring-1 focus:ring-black"
												placeholder={'{"headers": [...], "rows": [[...], ...]}'}
												value={typeof testValues[variable.name] === 'string' ? testValues[variable.name] : JSON.stringify(testValues[variable.name] || {}, null, 2)}
												on:input={(e) => {
													try {
														const parsed = JSON.parse(e.target.value);
														updateTestValue(variable.name, parsed);
													} catch {
														updateTestValue(variable.name, e.target.value);
													}
												}}
											></textarea>
											<p class="text-[9px] text-gray-400">Universal format: {`{headers, rows}`}</p>
										</div>
									{/if}
								</div>
							{/each}
						</div>
						
						<!-- Render Button -->
						<button 
							class="w-full py-2.5 px-3 bg-black hover:bg-gray-800 text-white rounded-lg transition-all font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
							on:click={testRenderApi}
							disabled={isRendering || !$template?.uid}
						>
							{#if isRendering}
								<i class="fa fa-spinner fa-spin"></i>
								Rendering...
							{:else}
								<i class="fa fa-play"></i>
								Test Render API
							{/if}
						</button>
						
						<!-- Render Result -->
						{#if renderedImageUrl}
							<div class="space-y-3">
								<div class="flex items-center justify-between">
									<span class="text-xs font-medium text-gray-700">Result</span>
									{#if lastRenderTime}
										<span class="text-[10px] text-green-600">
											<i class="fa fa-clock mr-1"></i>{lastRenderTime}ms
										</span>
									{/if}
								</div>
								
								<div class="relative group">
									<img 
										src={renderedImageUrl} 
										alt="Rendered template"
										class="w-full rounded-lg border border-gray-200 shadow-sm"
									/>
									<div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
										<button 
											class="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
											on:click={openImageInNewTab}
											title="Open in new tab"
										>
											<i class="fa fa-external-link-alt text-gray-700"></i>
										</button>
										<button 
											class="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
											on:click={downloadImage}
											title="Download image"
										>
											<i class="fa fa-download text-gray-700"></i>
										</button>
									</div>
								</div>
								
								<div class="text-[10px] text-gray-500 break-all">
									<strong>URL:</strong> 
									<a href={renderedImageUrl} target="_blank" class="text-blue-600 hover:underline">
										{renderedImageUrl.slice(0, 50)}...
									</a>
								</div>
							</div>
						{/if}
						
						{#if renderError}
							<div class="bg-red-50 border border-red-200 rounded-lg p-3">
								<p class="text-xs text-red-800">
									<i class="fa fa-exclamation-circle mr-1"></i>
									{renderError}
								</p>
							</div>
						{/if}
						
						<!-- Request Details -->
						<div class="pt-3 border-t border-gray-100">
							<button 
								class="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity mb-2"
								on:click={() => showRequestDetails = !showRequestDetails}
							>
								<span class="text-[10px] font-medium text-gray-600">Request Details</span>
								<i class="fa fa-chevron-{showRequestDetails ? 'up' : 'down'} text-[10px] text-gray-400"></i>
							</button>
							
							{#if showRequestDetails}
								<div class="space-y-2">
									<div class="bg-gray-900 rounded-lg p-3 relative">
										<button 
											class="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
											on:click={copyCurlCommand}
											title="Copy cURL command"
										>
											<i class="fa fa-copy text-[10px]"></i>
										</button>
										<pre class="text-[10px] text-green-400 overflow-x-auto whitespace-pre-wrap"><code>{generateCurlCommand()}</code></pre>
									</div>
									
									<div class="bg-gray-100 rounded-lg p-2">
										<p class="text-[10px] text-gray-600 mb-1 font-medium">Request Body:</p>
										<pre class="text-[10px] text-gray-800 font-mono overflow-x-auto"><code>{JSON.stringify({ variables: testValues }, null, 2)}</code></pre>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
			
			<!-- API Example Section -->
			<div class="pt-4 border-t border-gray-200">
				<button 
					class="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity mb-3"
					on:click={() => showApiExample = !showApiExample}
				>
					<span class="text-xs font-semibold text-gray-700 uppercase tracking-wider">API Documentation</span>
					<i class="fa fa-chevron-{showApiExample ? 'up' : 'down'} text-xs text-gray-400"></i>
				</button>
				
				{#if showApiExample}
					<div class="space-y-3">
						<div class="bg-gray-900 rounded-lg p-4 relative">
							<button 
								class="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
								on:click={copyApiExample}
								title="Copy to clipboard"
							>
								<i class="fa fa-copy text-xs"></i>
							</button>
							<pre class="text-xs text-green-400 overflow-x-auto"><code>{generateApiExample()}</code></pre>
						</div>
						
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
							<p class="text-xs text-blue-800 mb-2">
								<strong>POST</strong> /templates/{$template?.uid || '{uid}'}/render
							</p>
							<p class="text-[10px] text-blue-600">
								Pass the variables object in your request body to generate a customized image.
							</p>
						</div>
						
						<div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
							<p class="text-[10px] text-gray-700 font-medium mb-2">Response:</p>
							<pre class="text-[10px] text-gray-600 font-mono"><code>{`{
  "url": "https://...",
  "width": 1080,
  "height": 1080,
  "format": "png"
}`}</code></pre>
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Stats -->
			<div class="pt-4 border-t border-gray-200">
				<div class="grid grid-cols-5 gap-1">
					<div class="bg-white border border-gray-200 rounded-lg p-2 text-center">
						<div class="text-base font-bold text-gray-900">{variables.length}</div>
						<div class="text-[9px] text-gray-500">Total</div>
					</div>
					<div class="bg-white border border-gray-200 rounded-lg p-2 text-center">
						<div class="text-base font-bold text-blue-600">{variables.filter(v => v.type === 'text').length}</div>
						<div class="text-[9px] text-gray-500">Text</div>
					</div>
					<div class="bg-white border border-gray-200 rounded-lg p-2 text-center">
						<div class="text-base font-bold text-purple-600">{variables.filter(v => v.type === 'image').length}</div>
						<div class="text-[9px] text-gray-500">Images</div>
					</div>
					<div class="bg-white border border-gray-200 rounded-lg p-2 text-center">
						<div class="text-base font-bold text-pink-600">{variables.filter(v => v.type === 'chart').length}</div>
						<div class="text-[9px] text-gray-500">Charts</div>
					</div>
					<div class="bg-white border border-gray-200 rounded-lg p-2 text-center">
						<div class="text-base font-bold text-teal-600">{variables.filter(v => v.type === 'table').length}</div>
						<div class="text-[9px] text-gray-500">Tables</div>
					</div>
				</div>
			</div>
	</div>
</div>

<style>
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
