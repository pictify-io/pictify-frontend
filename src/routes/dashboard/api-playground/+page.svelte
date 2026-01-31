<script>
	import { browser } from '$app/environment';
	import { user, getAPITokenAction } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';
	import Toast from '$lib/components/Toast.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import EmailVerificationRequired from '$lib/components/dashboard/EmailVerificationRequired.svelte';
	import {
		createImage,
		createGif
	} from '../../../api/image';
	import {
		getTemplates,
		getTemplateById,
		deleteTemplate,
		searchTemplates,
		getTemplateVariables,
		renderTemplate as renderTemplateApi,
		batchRenderTemplate,
		batchRenderFromCsv,
		getBatchJobResults,
		cancelBatchJob
	} from '../../../api/template';
	import backend from '../../../service/backend';
	import { onMount, onDestroy } from 'svelte';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';

	let apiToken = '';
	let selectedEndpoint = 'image';
	let loading = false;
	let response = null;
	let responseJson = '';
	let isUserLoggedIn = false;
	let isEmailVerified = null;
	let userEmail = '';

	// Endpoints that require email verification
	const generationEndpoints = ['image', 'gif', 'render-template', 'batch-render', 'batch-render-csv'];
	$: requiresEmailVerification = generationEndpoints.includes(selectedEndpoint) && isEmailVerified === false;

	let hasTriedToFetchTokens = false;
	let unsubscribe = () => {};
	let copiedCurl = false;
	let expandedCategory = 'Image Generation'; // Default expanded category

	// User templates for dropdown
	let userTemplates = [];
	let loadingTemplates = false;
	let manualTemplateInput = {
		'get-template': false,
		'delete-template': false,
		'render-template': false,
		'batch-render': false,
		'batch-render-csv': false,
		'get-variables': false
	};

	// Fetch user templates
	async function fetchUserTemplates() {
		if (!isUserLoggedIn) return;

		loadingTemplates = true;
		try {
			const result = await getTemplates({ limit: 100 });
			if (result && result.templates) {
				userTemplates = result.templates;
			}
		} catch (error) {
			console.error('Error fetching templates:', error);
		} finally {
			loadingTemplates = false;
		}
	}

	onMount(() => {
		// Subscribe to user store to get API token
		unsubscribe = user.subscribe(async (userData) => {
			isUserLoggedIn = !!userData.email;
			isEmailVerified = userData.isEmailVerified;
			userEmail = userData.email || '';

			// If user is logged in but no API tokens, fetch them (only once)
			if (userData.email && (!userData.apiTokens || userData.apiTokens.length === 0) && !hasTriedToFetchTokens) {
				hasTriedToFetchTokens = true;
				try {
					await getAPITokenAction();
				} catch (error) {
					console.error('Error loading API tokens:', error);
				}
			}

			// Set API token if available
			if (userData && Array.isArray(userData.apiTokens) && userData.apiTokens.length > 0) {
				apiToken = userData.apiTokens[0].token || '';
			}

			// Fetch templates when user is logged in
			if (isUserLoggedIn && userTemplates.length === 0) {
				fetchUserTemplates();
			}
		});
	});

	onDestroy(() => {
		unsubscribe();
	});

	// Image endpoint parameters
	let imageParams = {
		html: '<div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: Arial, sans-serif; border-radius: 10px;"><h1>Hello World!</h1><p>This is a test image</p></div>',
		width: 800,
		height: 600,
		selector: 'body',
		url: '',
		fileExtension: 'png'
	};

	// GIF endpoint parameters
	let gifParams = {
		html: '<div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: Arial, sans-serif; border-radius: 10px;"><h1 id="animated-text">Animated Text</h1><style>@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } } #animated-text { animation: pulse 2s infinite; }</style></div>',
		width: 800,
		height: 600,
		framesPerSecond: 15,
		selector: 'body',
		url: ''
	};

	// Template Management parameters
	let getTemplateParams = {
		uid: ''
	};

	let deleteTemplateParams = {
		uid: ''
	};

	let searchTemplatesParams = {
		q: '',
		page: 1,
		limit: 12
	};

	// Template Render parameters
	let renderTemplateParams = {
		templateUid: '',
		variables: '{}',
		format: 'png',
		quality: 0.9
	};

	// Batch render parameters
	let batchRenderParams = {
		templateUid: '',
		variableSets: JSON.stringify([
			{ title: 'First Title', subtitle: 'First Subtitle' },
			{ title: 'Second Title', subtitle: 'Second Subtitle' }
		], null, 2),
		format: 'png',
		quality: 0.9,
		concurrency: 5
	};

	// Batch render from CSV parameters
	let batchRenderCsvParams = {
		templateUid: '',
		csvUrl: '',
		mappings: JSON.stringify({
			'CSV Column Name': 'templateVariableName',
			'Title Column': 'title',
			'Subtitle Column': 'subtitle'
		}, null, 2),
		format: 'png',
		quality: 0.9,
		concurrency: 5
	};

	let batchStatusParams = {
		batchId: ''
	};

	let cancelBatchParams = {
		batchId: ''
	};

	// Template Utilities parameters
	let getVariablesParams = {
		uid: ''
	};

	// Helper function to select template from dropdown
	function selectTemplate(endpoint, templateUid) {
		switch(endpoint) {
			case 'get-template':
				getTemplateParams.uid = templateUid;
				break;
			case 'delete-template':
				deleteTemplateParams.uid = templateUid;
				break;
			case 'render-template':
				renderTemplateParams.templateUid = templateUid;
				// Auto-fetch variables when template is selected
				fetchTemplateVariables(templateUid);
				break;
			case 'batch-render':
				batchRenderParams.templateUid = templateUid;
				// Auto-fetch variables for batch render
				fetchTemplateVariables(templateUid, true);
				break;
			case 'batch-render-csv':
				batchRenderCsvParams.templateUid = templateUid;
				// Auto-fetch variables for CSV batch render mappings
				fetchTemplateVariablesForCsv(templateUid);
				break;
			case 'get-variables':
				getVariablesParams.uid = templateUid;
				break;
		}
	}

	// Fetch template variables and auto-fill example
	async function fetchTemplateVariables(templateUid, isBatch = false) {
		if (!templateUid) return;

		try {
			const result = await getTemplateVariables(templateUid);
			if (result && result.variables) {
				// Create example variables object
				const exampleVars = {};
				result.variables.forEach(v => {
					if (v.type === 'text') {
						exampleVars[v.name] = v.defaultValue || `Example ${v.name}`;
					} else if (v.type === 'image') {
						exampleVars[v.name] = v.defaultValue || 'https://via.placeholder.com/300';
					} else if (v.type === 'color') {
						exampleVars[v.name] = v.defaultValue || '#000000';
					}
				});

				if (isBatch) {
					// Create two example sets for batch
					const batchExamples = [
						{ ...exampleVars, title: 'First Example' },
						{ ...exampleVars, title: 'Second Example' }
					];
					batchRenderParams.variableSets = JSON.stringify(batchExamples, null, 2);
				} else {
					renderTemplateParams.variables = JSON.stringify(exampleVars, null, 2);
				}
			}
		} catch (error) {
			console.error('Error fetching template variables:', error);
		}
	}

	// Fetch template variables for CSV mapping
	async function fetchTemplateVariablesForCsv(templateUid) {
		if (!templateUid) return;

		try {
			const result = await getTemplateVariables(templateUid);
			if (result && result.variables) {
				// Create example mappings from variable names
				const exampleMappings = {};
				result.variables.forEach(v => {
					// Use variable name as both key and value for example
					exampleMappings[`${v.name}_column`] = v.name;
				});
				batchRenderCsvParams.mappings = JSON.stringify(exampleMappings, null, 2);
			}
		} catch (error) {
			console.error('Error fetching template variables for CSV:', error);
		}
	}

	// Quick fill examples
	function fillExampleData(endpoint) {
		switch(endpoint) {
			case 'image':
				imageParams.html = '<div style="padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: system-ui; border-radius: 20px; text-align: center;"><h1 style="font-size: 48px; margin: 0;">Beautiful Design</h1><p style="font-size: 20px; opacity: 0.9;">Created with Pictify API</p></div>';
				break;
			case 'gif':
				gifParams.html = '<div style="padding: 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; font-family: system-ui; border-radius: 20px; text-align: center;"><h1 id="title" style="font-size: 48px; margin: 0;">Animated Title</h1><style>@keyframes slideIn { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } #title { animation: slideIn 2s ease-out infinite; }</style></div>';
				break;
			case 'search-templates':
				searchTemplatesParams.q = 'social';
				break;
		}
	}

	// Test functions for each endpoint
	async function testEndpoint(endpointId) {
		if (!apiToken) {
			toast.set({ message: 'API token is required', type: 'error', duration: 1500 });
			return;
		}

		loading = true;
		response = null;
		responseJson = '';

		try {
			let data;
			switch (endpointId) {
				// Image Generation
				case 'image':
					data = await createImage({
						...imageParams,
						apiKey: apiToken
					});
					break;

				case 'gif':
					data = await createGif({
						...gifParams,
						apiKey: apiToken
					});
					break;

				// Template Management
				case 'get-template':
					if (!getTemplateParams.uid) {
						throw new Error('Template UID is required');
					}
					data = await getTemplateById(getTemplateParams.uid);
					break;

				case 'delete-template':
					if (!deleteTemplateParams.uid) {
						throw new Error('Template UID is required');
					}
					data = await deleteTemplate(deleteTemplateParams.uid);
					break;

				case 'search-templates':
					if (!searchTemplatesParams.q) {
						throw new Error('Search query is required');
					}
					data = await searchTemplates(searchTemplatesParams.q, {
						page: searchTemplatesParams.page,
						limit: searchTemplatesParams.limit
					});
					break;

				// Template Rendering
				case 'render-template':
					if (!renderTemplateParams.templateUid) {
						throw new Error('Template UID is required');
					}
					data = await renderTemplateApi(
						renderTemplateParams.templateUid,
						JSON.parse(renderTemplateParams.variables),
						{
							format: renderTemplateParams.format,
							quality: renderTemplateParams.quality,
							headers: { Authorization: `Bearer ${apiToken}` }
						}
					);
					break;

				case 'batch-render':
					if (!batchRenderParams.templateUid) {
						throw new Error('Template UID is required');
					}
					data = await batchRenderTemplate(
						batchRenderParams.templateUid,
						JSON.parse(batchRenderParams.variableSets),
						{
							format: batchRenderParams.format,
							quality: batchRenderParams.quality,
							concurrency: batchRenderParams.concurrency,
							headers: { Authorization: `Bearer ${apiToken}` }
						}
					);
					break;

				case 'batch-render-csv':
					if (!batchRenderCsvParams.templateUid) {
						throw new Error('Template UID is required');
					}
					if (!batchRenderCsvParams.csvUrl) {
						throw new Error('CSV URL is required');
					}
					data = await batchRenderFromCsv(
						batchRenderCsvParams.templateUid,
						batchRenderCsvParams.csvUrl,
						JSON.parse(batchRenderCsvParams.mappings),
						{
							format: batchRenderCsvParams.format,
							quality: batchRenderCsvParams.quality,
							concurrency: batchRenderCsvParams.concurrency,
							headers: { Authorization: `Bearer ${apiToken}` }
						}
					);
					break;

				case 'batch-status':
					if (!batchStatusParams.batchId) {
						throw new Error('Batch ID is required');
					}
					data = await getBatchJobResults(batchStatusParams.batchId);
					break;

				case 'cancel-batch':
					if (!cancelBatchParams.batchId) {
						throw new Error('Batch ID is required');
					}
					data = await cancelBatchJob(cancelBatchParams.batchId);
					break;

				// Template Utilities
				case 'get-variables':
					if (!getVariablesParams.uid) {
						throw new Error('Template UID is required');
					}
					data = await getTemplateVariables(getVariablesParams.uid);
					break;

			}

			response = data;
			responseJson = JSON.stringify(data, null, 2);
			toast.set({ message: 'Request successful!', type: 'success', duration: 1500 });
		} catch (error) {
			console.error('Error:', error);
			response = error.response?.data || { error: error.message };
			responseJson = JSON.stringify(response, null, 2);
			toast.set({ message: error.response?.data?.error || error.message || 'Request failed', type: 'error', duration: 1500 });
		} finally {
			loading = false;
		}
	}

	function copyToClipboard(text) {
		if (browser && navigator.clipboard) {
			navigator.clipboard.writeText(text);
			toast.set({ message: 'Copied to clipboard!', type: 'success', duration: 1500 });
		} else {
			toast.set({ message: 'Clipboard not available', type: 'error', duration: 1500 });
		}
	}

	function handleCopyCurl() {
		if (!curlExample) return;

		copyToClipboard(curlExample.copy);
		copiedCurl = true;
		setTimeout(() => {
			copiedCurl = false;
		}, 2000);
	}

	const escapeSingleQuotes = (value = '') => value.replace(/'/g, `'"'"'`);

	function setSelectedEndpoint(endpoint) {
		selectedEndpoint = endpoint;
		response = null;
		responseJson = '';
	}

	function toggleCategory(category) {
		expandedCategory = expandedCategory === category ? null : category;
	}

	// Reactive curl example
	$: backendBaseUrl = (() => {
		const fallbackUrl = browser ? window.location.origin : 'https://pictify.io';
		const rawUrl = PUBLIC_BACKEND_URL || fallbackUrl;
		return rawUrl?.replace(/\/$/, '') || '';
	})();

	$: curlExample = (() => {
		if (!backendBaseUrl) {
			return null;
		}
		const authToken = apiToken || 'YOUR_API_TOKEN';

		const buildExample = (method, path, payload = null, requiresAuth = true) => {
			let displayLines = [`curl -X ${method} ${backendBaseUrl}${path}`];
			let copyLines = [`curl -X ${method} ${backendBaseUrl}${path}`];

			if (requiresAuth) {
				displayLines.push(`  -H "Authorization: Bearer ${authToken}"`);
				copyLines.push(`-H "Authorization: Bearer ${authToken}"`);
			}

			if (payload) {
				displayLines.push(`  -H "Content-Type: application/json"`);
				copyLines.push(`-H "Content-Type: application/json"`);
				const payloadPretty = JSON.stringify(payload, null, 2);
				const payloadSingleLine = JSON.stringify(payload);
				displayLines.push(`  --data-raw '${payloadPretty}'`);
				copyLines.push(`--data-raw '${escapeSingleQuotes(payloadSingleLine)}'`);
			}

			return {
				display: displayLines.join(' \\\n'),
				copy: copyLines.join(' ')
			};
		};

		// Generate cURL based on selected endpoint
		const endpointConfig = endpointDetails.find(e => e.id === selectedEndpoint);
		if (!endpointConfig) return null;

		return buildExample(
			endpointConfig.method,
			endpointConfig.path,
			endpointConfig.payload,
			endpointConfig.requiresAuth !== false
		);
	})();

	// Endpoint details for cURL generation
	$: endpointDetails = [
		// Image Generation
		{
			id: 'image',
			method: 'POST',
			path: '/image',
			payload: imageParams,
			requiresAuth: true
		},
		{
			id: 'gif',
			method: 'POST',
			path: '/gif',
			payload: gifParams,
			requiresAuth: true
		},
		// Template Management
		{
			id: 'get-template',
			method: 'GET',
			path: `/templates/${getTemplateParams.uid || ':uid'}`,
			payload: null,
			requiresAuth: true
		},
		{
			id: 'delete-template',
			method: 'DELETE',
			path: `/templates/${deleteTemplateParams.uid || ':uid'}`,
			payload: null,
			requiresAuth: true
		},
		{
			id: 'search-templates',
			method: 'GET',
			path: `/templates/search?q=${encodeURIComponent(searchTemplatesParams.q)}&page=${searchTemplatesParams.page}&limit=${searchTemplatesParams.limit}`,
			payload: null,
			requiresAuth: true
		},
		// Template Rendering
		{
			id: 'render-template',
			method: 'POST',
			path: `/templates/${renderTemplateParams.templateUid || ':uid'}/render`,
			payload: {
				variables: JSON.parse(renderTemplateParams.variables || '{}'),
				format: renderTemplateParams.format,
				quality: renderTemplateParams.quality
			},
			requiresAuth: true
		},
		{
			id: 'batch-render',
			method: 'POST',
			path: `/templates/${batchRenderParams.templateUid || ':uid'}/batch-render`,
			payload: {
				variableSets: JSON.parse(batchRenderParams.variableSets || '[]'),
				format: batchRenderParams.format,
				quality: batchRenderParams.quality,
				concurrency: batchRenderParams.concurrency
			},
			requiresAuth: true
		},
		{
			id: 'batch-render-csv',
			method: 'POST',
			path: `/templates/${batchRenderCsvParams.templateUid || ':uid'}/batch-render`,
			payload: {
				csvUrl: batchRenderCsvParams.csvUrl,
				mappings: JSON.parse(batchRenderCsvParams.mappings || '{}'),
				format: batchRenderCsvParams.format,
				quality: batchRenderCsvParams.quality,
				concurrency: batchRenderCsvParams.concurrency
			},
			requiresAuth: true
		},
		{
			id: 'batch-status',
			method: 'GET',
			path: `/templates/batch/${batchStatusParams.batchId || ':batchId'}/results`,
			payload: null,
			requiresAuth: true
		},
		{
			id: 'cancel-batch',
			method: 'POST',
			path: `/templates/batch/${cancelBatchParams.batchId || ':batchId'}/cancel`,
			payload: null,
			requiresAuth: true
		},
		// Template Utilities
		{
			id: 'get-variables',
			method: 'GET',
			path: `/templates/${getVariablesParams.uid || ':uid'}/variables`,
			payload: null,
			requiresAuth: true
		}
	];

	// Endpoint categories for organization
	const endpointCategories = [
		{
			name: 'Image Generation',
			endpoints: [
				{ id: 'image', path: '/image', method: 'POST', label: 'HTML to Image' },
				{ id: 'gif', path: '/gif', method: 'POST', label: 'HTML to GIF' }
			]
		},
		{
			name: 'Template Management',
			endpoints: [
				{ id: 'get-template', path: '/templates/:uid', method: 'GET', label: 'Get Template' },
				{ id: 'delete-template', path: '/templates/:uid', method: 'DELETE', label: 'Delete Template' },
				{ id: 'search-templates', path: '/templates/search', method: 'GET', label: 'Search Templates' }
			]
		},
		{
			name: 'Template Rendering',
			endpoints: [
				{ id: 'render-template', path: '/templates/:uid/render', method: 'POST', label: 'Render Template' },
				{ id: 'batch-render', path: '/templates/:uid/batch-render', method: 'POST', label: 'Batch Render' },
				{ id: 'batch-render-csv', path: '/templates/:uid/batch-render', method: 'POST', label: 'Batch Render (CSV Mode)' },
				{ id: 'batch-status', path: '/templates/batch/:batchId/results', method: 'GET', label: 'Batch Status' },
				{ id: 'cancel-batch', path: '/templates/batch/:batchId/cancel', method: 'POST', label: 'Cancel Batch' }
			]
		},
		{
			name: 'Template Utilities',
			endpoints: [
				{ id: 'get-variables', path: '/templates/:uid/variables', method: 'GET', label: 'Get Variables' }
			]
		}
	];

	// Get description for current endpoint
	$: endpointDescription = (() => {
		const descriptions = {
			'image': 'Generate a static image from HTML',
			'gif': 'Generate an animated GIF from HTML',
			'get-template': 'Get details of a specific template',
			'delete-template': 'Delete a template',
			'search-templates': 'Search templates by name',
			'render-template': 'Render a template with variables',
			'batch-render': 'Render multiple variations in bulk (variableSets mode, max 100 items)',
			'batch-render-csv': 'Batch render using CSV URL with column mappings (unified endpoint, CSV mode)',
			'batch-status': 'Check batch job status and results',
			'cancel-batch': 'Cancel a running batch job',
			'get-variables': 'Get template variable definitions'
		};
		return descriptions[selectedEndpoint] || '';
	})();
</script>

<svelte:head>
	<title>API Playground - Pictify.io</title>
</svelte:head>

<div class="min-h-full">
	<div>
		<!-- Header -->
		<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
			<div>
				<div class="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-gray-900 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded mb-2 sm:mb-3">
					<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#ffc480] rounded-full animate-pulse"></span>
					Dev Tools
				</div>
				<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
					API <span class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">Playground</span>
				</h1>
			</div>

			<!-- Status Badge -->
			<div class="flex items-center gap-1.5 sm:gap-2 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-[2px] sm:border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] sm:shadow-[4px_4px_0_0_#1f2937]">
				<div class="w-2 h-2 sm:w-3 sm:h-3 bg-[#4ade80] rounded-full animate-pulse"></div>
				<span class="text-[10px] sm:text-xs font-black text-gray-900 uppercase tracking-wider">System OK</span>
			</div>
		</div>

		<!-- Main Grid -->
		<div class="grid grid-cols-12 gap-4 sm:gap-6 md:gap-8">

			<!-- Left Panel: Navigation & Auth -->
			<div class="col-span-12 lg:col-span-4 space-y-4 sm:space-y-6 md:space-y-8">

				<!-- Auth Card -->
				<div class="bg-white rounded-xl sm:rounded-2xl border-[2px] sm:border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] sm:shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
					<div class="bg-gray-100 p-3 sm:p-4 border-b-[2px] sm:border-b-[3px] border-gray-900 flex items-center gap-1.5 sm:gap-2">
						<svg class="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
						<h3 class="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wide">Authentication</h3>
					</div>
					<div class="p-3 sm:p-4 md:p-5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
						{#if isUserLoggedIn && apiToken}
							<div class="relative group">
								<div class="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
									<span class="text-[10px] sm:text-xs font-black text-gray-400">KEY</span>
								</div>
								<input
									type="password"
									class="w-full pl-8 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-3 bg-white border-[2px] sm:border-[3px] border-gray-900 rounded-lg sm:rounded-xl text-xs sm:text-sm font-mono font-bold text-gray-900 focus:outline-none focus:shadow-[3px_3px_0_0_#ffc480] sm:focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
									value={apiToken}
									readonly
								/>
								<button
									class="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
									on:click={() => copyToClipboard(apiToken)}
									title="Copy API Key"
								>
									<svg class="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
									</svg>
								</button>
							</div>
						{:else}
							<div class="text-center py-3 sm:py-4">
								<p class="text-xs sm:text-sm font-bold text-gray-600 mb-3 sm:mb-4">API Key Required</p>
								<a href="/dashboard/api-token" class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#ff6b6b] text-white text-xs sm:text-sm font-black uppercase tracking-wide rounded-lg border-[2px] sm:border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] sm:shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
									Get API Key
								</a>
							</div>
						{/if}
					</div>
				</div>

				<!-- Endpoints Menu -->
				<div class="bg-white rounded-xl sm:rounded-2xl border-[2px] sm:border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] sm:shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
					<div class="bg-gray-100 p-3 sm:p-4 border-b-[2px] sm:border-b-[3px] border-gray-900 flex items-center gap-1.5 sm:gap-2">
						<svg class="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
						<h3 class="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wide">API Endpoints</h3>
					</div>
					<div class="p-1.5 sm:p-2 space-y-2 bg-[#FFFDF8] max-h-[600px] overflow-y-auto">
						{#each endpointCategories as category}
							<div class="border rounded-lg border-gray-200 overflow-hidden">
								<button
									class="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
									on:click={() => toggleCategory(category.name)}
								>
									<span class="text-xs font-black text-gray-700 uppercase tracking-wider">{category.name}</span>
									<svg
										class="w-4 h-4 text-gray-500 transition-transform {expandedCategory === category.name ? 'rotate-180' : ''}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
									</svg>
								</button>
								{#if expandedCategory === category.name}
									<div class="border-t border-gray-200 p-1">
										{#each category.endpoints as endpoint}
											<button
												class="w-full p-2.5 rounded text-left transition-all group relative overflow-hidden mb-1 {selectedEndpoint === endpoint.id
													? 'bg-gray-900 text-white shadow-md'
													: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}"
												on:click={() => setSelectedEndpoint(endpoint.id)}
											>
												<div class="flex items-center justify-between relative z-10">
													<div class="flex items-center gap-2">
														<span class="px-1.5 py-0.5 text-[9px] font-black rounded bg-{endpoint.method === 'GET' ? 'blue' : endpoint.method === 'POST' ? 'green' : endpoint.method === 'PUT' ? 'yellow' : 'red'}-500 text-white">{endpoint.method}</span>
														<div class="flex flex-col">
															<span class="text-xs font-bold">{endpoint.label}</span>
															<span class="text-[9px] font-mono opacity-70">{endpoint.path}</span>
														</div>
													</div>
													{#if selectedEndpoint === endpoint.id}
														<div class="w-1.5 h-1.5 bg-[#ffc480] rounded-full animate-pulse"></div>
													{/if}
												</div>
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Right Panel: Console -->
			<div class="col-span-12 lg:col-span-8 space-y-4 sm:space-y-6 md:space-y-8">

				<!-- Endpoint Description -->
				<div class="bg-[#ffc480] rounded-xl border-[3px] border-gray-900 p-4">
					<div class="flex items-center gap-3">
						<svg class="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
						<p class="text-sm font-bold text-gray-900">{endpointDescription}</p>
					</div>
				</div>

				<!-- Request Builder -->
				<div class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
					<div class="bg-gray-100 p-4 border-b-[3px] border-gray-900 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border border-gray-900"></div>
							<div class="w-3 h-3 rounded-full bg-[#ffc480] border border-gray-900"></div>
							<div class="w-3 h-3 rounded-full bg-[#4ade80] border border-gray-900"></div>
						</div>
						<h3 class="text-sm font-black text-gray-900 uppercase tracking-wide">Request Configuration</h3>
					</div>

					<div class="p-6 space-y-6">
						<!-- Dynamic form fields based on selected endpoint -->
						{#if selectedEndpoint === 'image'}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="md:col-span-2">
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs font-black text-gray-900 uppercase tracking-wide">HTML Content</label>
										<button
											class="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide flex items-center gap-1"
											on:click={() => fillExampleData('image')}
										>
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
											</svg>
											Example
										</button>
									</div>
									<textarea
										class="w-full h-32 px-4 py-3 bg-gray-50 border-[3px] border-gray-900 rounded-xl text-sm font-mono focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#ffc480] transition-all resize-none"
										bind:value={imageParams.html}
									></textarea>
								</div>
								<div>
									<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Width (px)</label>
									<input
										type="number"
										class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
										bind:value={imageParams.width}
									/>
								</div>
								<div>
									<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Height (px)</label>
									<input
										type="number"
										class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
										bind:value={imageParams.height}
									/>
								</div>
							</div>
						{:else if selectedEndpoint === 'get-template'}
							<div>
								<div class="flex items-center justify-between mb-2">
									<label class="text-xs font-black text-gray-900 uppercase tracking-wide">Template UID</label>
									<button
										class="text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wide flex items-center gap-1"
										on:click={() => manualTemplateInput['get-template'] = !manualTemplateInput['get-template']}
									>
										{manualTemplateInput['get-template'] ? 'Select from list' : 'Enter manually'}
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4 4-4 4m5-4h3" />
										</svg>
									</button>
								</div>

								{#if manualTemplateInput['get-template']}
									<input
										type="text"
										class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
										bind:value={getTemplateParams.uid}
										placeholder="Enter template UID manually"
									/>
								{:else}
									<select
										class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all appearance-none cursor-pointer"
										on:change={(e) => selectTemplate('get-template', e.target.value)}
										value={getTemplateParams.uid}
									>
										<option value="">Select a template...</option>
										{#if loadingTemplates}
											<option disabled>Loading templates...</option>
										{:else}
											{#each userTemplates as template}
												<option value={template.uid}>
													{template.name} ({template.uid.slice(0, 8)}...)
												</option>
											{/each}
										{/if}
										{#if userTemplates.length === 0 && !loadingTemplates}
											<option disabled>No templates found</option>
										{/if}
									</select>
								{/if}

								{#if getTemplateParams.uid}
									<p class="mt-2 text-[10px] text-gray-600 font-medium">
										Selected: <span class="font-mono">{getTemplateParams.uid}</span>
									</p>
								{/if}
							</div>
						{:else if selectedEndpoint === 'delete-template'}
							<div>
								<div class="flex items-center justify-between mb-2">
									<label class="text-xs font-black text-gray-900 uppercase tracking-wide">Template UID</label>
									<button
										class="text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wide flex items-center gap-1"
										on:click={() => manualTemplateInput['delete-template'] = !manualTemplateInput['delete-template']}
									>
										{manualTemplateInput['delete-template'] ? 'Select from list' : 'Enter manually'}
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4 4-4 4m5-4h3" />
										</svg>
									</button>
								</div>

								{#if manualTemplateInput['delete-template']}
									<input
										type="text"
										class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
										bind:value={deleteTemplateParams.uid}
										placeholder="Enter template UID to delete"
									/>
								{:else}
									<select
										class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all appearance-none cursor-pointer"
										on:change={(e) => selectTemplate('delete-template', e.target.value)}
										value={deleteTemplateParams.uid}
									>
										<option value="">Select a template to delete...</option>
										{#if loadingTemplates}
											<option disabled>Loading templates...</option>
										{:else}
											{#each userTemplates as template}
												<option value={template.uid}>
													{template.name} ({template.uid.slice(0, 8)}...)
												</option>
											{/each}
										{/if}
										{#if userTemplates.length === 0 && !loadingTemplates}
											<option disabled>No templates found</option>
										{/if}
									</select>
								{/if}

								{#if deleteTemplateParams.uid}
									<div class="mt-2 p-2 bg-red-50 border border-red-300 rounded">
										<p class="text-[10px] text-red-700 font-medium">
											⚠️ Warning: This will permanently delete template <span class="font-mono">{deleteTemplateParams.uid}</span>
										</p>
									</div>
								{/if}
							</div>
						{:else if selectedEndpoint === 'search-templates'}
							<div class="space-y-4">
								<div>
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs font-black text-gray-900 uppercase tracking-wide">Search Query</label>
										<div class="flex gap-2">
											<button
												class="text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wide"
												on:click={() => searchTemplatesParams.q = 'social'}
											>
												Social
											</button>
											<button
												class="text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wide"
												on:click={() => searchTemplatesParams.q = 'banner'}
											>
												Banner
											</button>
											<button
												class="text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wide"
												on:click={() => searchTemplatesParams.q = 'og'}
											>
												OG
											</button>
										</div>
									</div>
									<input
										type="text"
										class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
										bind:value={searchTemplatesParams.q}
										placeholder="Search templates by name, type, or tags"
									/>
								</div>
								<div class="grid grid-cols-2 gap-4">
									<div>
										<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Page</label>
										<input
											type="number"
											min="1"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={searchTemplatesParams.page}
										/>
									</div>
									<div>
										<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Limit</label>
										<input
											type="number"
											min="1"
											max="100"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={searchTemplatesParams.limit}
										/>
									</div>
								</div>
							</div>
						{:else if selectedEndpoint === 'render-template'}
							<div class="space-y-4">
								<div>
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs font-black text-gray-900 uppercase tracking-wide">Template UID</label>
										<button
											class="text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wide flex items-center gap-1"
											on:click={() => manualTemplateInput['render-template'] = !manualTemplateInput['render-template']}
										>
											{manualTemplateInput['render-template'] ? 'Select from list' : 'Enter manually'}
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4 4-4 4m5-4h3" />
											</svg>
										</button>
									</div>

									{#if manualTemplateInput['render-template']}
										<input
											type="text"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={renderTemplateParams.templateUid}
											placeholder="Enter template UID manually"
										/>
									{:else}
										<select
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all appearance-none cursor-pointer"
											on:change={(e) => selectTemplate('render-template', e.target.value)}
											value={renderTemplateParams.templateUid}
										>
											<option value="">Select a template...</option>
											{#if loadingTemplates}
												<option disabled>Loading templates...</option>
											{:else}
												{#each userTemplates as template}
													<option value={template.uid}>
														{template.name} ({template.uid.slice(0, 8)}...)
													</option>
												{/each}
											{/if}
											{#if userTemplates.length === 0 && !loadingTemplates}
												<option disabled>No templates found</option>
											{/if}
										</select>
									{/if}
								</div>

								<div>
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs font-black text-gray-900 uppercase tracking-wide">Variables (JSON)</label>
										<div class="flex gap-2">
											{#if renderTemplateParams.templateUid}
												<button
													class="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide flex items-center gap-1"
													on:click={() => fetchTemplateVariables(renderTemplateParams.templateUid)}
												>
													<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
													</svg>
													Auto-fill
												</button>
											{/if}
											<button
												class="text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wide"
												on:click={() => renderTemplateParams.variables = '{}'}
											>
												Clear
											</button>
										</div>
									</div>
									<textarea
										class="w-full h-32 px-4 py-3 bg-gray-50 border-[3px] border-gray-900 rounded-xl text-sm font-mono focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#ffc480] transition-all resize-none"
										bind:value={renderTemplateParams.variables}
										placeholder={'{"title": "Example Title", "subtitle": "Example Subtitle"}'}
									></textarea>
									<p class="mt-1 text-[10px] text-gray-600">💡 Select a template to auto-fill example variables</p>
								</div>
								<div class="grid grid-cols-2 gap-4">
									<div>
										<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Format</label>
										<select
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all appearance-none"
											bind:value={renderTemplateParams.format}
										>
											<option value="png">PNG</option>
											<option value="jpeg">JPEG</option>
											<option value="webp">WebP</option>
										</select>
									</div>
									<div>
										<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Quality</label>
										<input
											type="number"
											min="0.1"
											max="1"
											step="0.1"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={renderTemplateParams.quality}
										/>
									</div>
								</div>
							</div>
						{:else if selectedEndpoint === 'batch-render'}
							<div class="space-y-4">
								<div>
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs font-black text-gray-900 uppercase tracking-wide">Template UID</label>
										<button
											class="text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wide flex items-center gap-1"
											on:click={() => manualTemplateInput['batch-render'] = !manualTemplateInput['batch-render']}
										>
											{manualTemplateInput['batch-render'] ? 'Select from list' : 'Enter manually'}
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4 4-4 4m5-4h3" />
											</svg>
										</button>
									</div>

									{#if manualTemplateInput['batch-render']}
										<input
											type="text"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={batchRenderParams.templateUid}
											placeholder="Enter template UID"
										/>
									{:else}
										<select
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all appearance-none cursor-pointer"
											on:change={(e) => selectTemplate('batch-render', e.target.value)}
											value={batchRenderParams.templateUid}
										>
											<option value="">Select a template...</option>
											{#if loadingTemplates}
												<option disabled>Loading templates...</option>
											{:else}
												{#each userTemplates as template}
													<option value={template.uid}>
														{template.name} ({template.uid.slice(0, 8)}...)
													</option>
												{/each}
											{/if}
											{#if userTemplates.length === 0 && !loadingTemplates}
												<option disabled>No templates found</option>
											{/if}
										</select>
									{/if}
								</div>
								<div>
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs font-black text-gray-900 uppercase tracking-wide">Variable Sets (JSON Array)</label>
										<div class="flex gap-2">
											{#if batchRenderParams.templateUid}
												<button
													class="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide flex items-center gap-1"
													on:click={() => fetchTemplateVariables(batchRenderParams.templateUid, true)}
												>
													<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
													</svg>
													Auto-fill
												</button>
											{/if}
											<button
												class="text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wide"
												on:click={() => batchRenderParams.variableSets = '[]'}
											>
												Clear
											</button>
										</div>
									</div>
									<textarea
										class="w-full h-32 px-4 py-3 bg-gray-50 border-[3px] border-gray-900 rounded-xl text-sm font-mono focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#ffc480] transition-all resize-none"
										bind:value={batchRenderParams.variableSets}
										placeholder={'[{"title": "First", "subtitle": "Example"}, {"title": "Second", "subtitle": "Example"}]'}
									></textarea>
									<p class="mt-1 text-[10px] text-gray-600">💡 Each object in the array represents one rendered variation</p>
								</div>
								<div class="grid grid-cols-3 gap-4">
									<div>
										<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Format</label>
										<select
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all appearance-none"
											bind:value={batchRenderParams.format}
										>
											<option value="png">PNG</option>
											<option value="jpeg">JPEG</option>
											<option value="webp">WebP</option>
										</select>
									</div>
									<div>
										<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Quality</label>
										<input
											type="number"
											min="0.1"
											max="1"
											step="0.1"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={batchRenderParams.quality}
										/>
									</div>
									<div>
										<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Concurrency</label>
										<input
											type="number"
											min="1"
											max="10"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={batchRenderParams.concurrency}
										/>
									</div>
								</div>
							</div>
						{:else if selectedEndpoint === 'batch-render-csv'}
							<div class="space-y-4">
								<div>
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs font-black text-gray-900 uppercase tracking-wide">Template UID</label>
										<button
											class="text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wide flex items-center gap-1"
											on:click={() => manualTemplateInput['batch-render-csv'] = !manualTemplateInput['batch-render-csv']}
										>
											{manualTemplateInput['batch-render-csv'] ? 'Select from list' : 'Enter manually'}
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4 4-4 4m5-4h3" />
											</svg>
										</button>
									</div>

									{#if manualTemplateInput['batch-render-csv']}
										<input
											type="text"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={batchRenderCsvParams.templateUid}
											placeholder="Enter template UID"
										/>
									{:else}
										<select
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all appearance-none cursor-pointer"
											on:change={(e) => selectTemplate('batch-render-csv', e.target.value)}
											value={batchRenderCsvParams.templateUid}
										>
											<option value="">Select a template...</option>
											{#if loadingTemplates}
												<option disabled>Loading templates...</option>
											{:else}
												{#each userTemplates as template}
													<option value={template.uid}>
														{template.name} ({template.uid.slice(0, 8)}...)
													</option>
												{/each}
											{/if}
											{#if userTemplates.length === 0 && !loadingTemplates}
												<option disabled>No templates found</option>
											{/if}
										</select>
									{/if}
								</div>
								<div>
									<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">CSV URL</label>
									<input
										type="url"
										class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
										bind:value={batchRenderCsvParams.csvUrl}
										placeholder="https://example.com/data.csv"
									/>
									<p class="mt-1 text-[10px] text-gray-600">💡 URL to a publicly accessible CSV file. No row limit!</p>
								</div>
								<div>
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs font-black text-gray-900 uppercase tracking-wide">Column Mappings (JSON)</label>
										<div class="flex gap-2">
											{#if batchRenderCsvParams.templateUid}
												<button
													class="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide flex items-center gap-1"
													on:click={() => fetchTemplateVariablesForCsv(batchRenderCsvParams.templateUid)}
												>
													<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
													</svg>
													Auto-fill
												</button>
											{/if}
											<button
												class="text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wide"
												on:click={() => batchRenderCsvParams.mappings = '{}'}
											>
												Clear
											</button>
										</div>
									</div>
									<textarea
										class="w-full h-32 px-4 py-3 bg-gray-50 border-[3px] border-gray-900 rounded-xl text-sm font-mono focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#ffc480] transition-all resize-none"
										bind:value={batchRenderCsvParams.mappings}
										placeholder={'{"CSV Column Name": "templateVariableName"}'}
									></textarea>
									<p class="mt-1 text-[10px] text-gray-600">💡 Map CSV column names to template variable names: {"{"}"Email Column": "email", "Name Column": "name"{"}"}</p>
								</div>
								<div class="grid grid-cols-3 gap-4">
									<div>
										<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Format</label>
										<select
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all appearance-none"
											bind:value={batchRenderCsvParams.format}
										>
											<option value="png">PNG</option>
											<option value="jpeg">JPEG</option>
											<option value="webp">WebP</option>
										</select>
									</div>
									<div>
										<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Quality</label>
										<input
											type="number"
											min="0.1"
											max="1"
											step="0.1"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={batchRenderCsvParams.quality}
										/>
									</div>
									<div>
										<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Concurrency</label>
										<input
											type="number"
											min="1"
											max="10"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={batchRenderCsvParams.concurrency}
										/>
									</div>
								</div>
							</div>
						{:else if selectedEndpoint === 'batch-status'}
							<div>
								<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Batch ID</label>
								<input
									type="text"
									class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
									bind:value={batchStatusParams.batchId}
									placeholder="Enter batch ID (e.g., batch_ABC123)"
								/>
								<p class="mt-1 text-[10px] text-gray-600">💡 The batch ID is returned when you start a batch render job</p>
							</div>
						{:else if selectedEndpoint === 'cancel-batch'}
							<div>
								<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Batch ID</label>
								<input
									type="text"
									class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
									bind:value={cancelBatchParams.batchId}
									placeholder="Enter batch ID to cancel"
								/>
							</div>
						{:else if selectedEndpoint === 'get-variables'}
							<div>
								<div class="flex items-center justify-between mb-2">
									<label class="text-xs font-black text-gray-900 uppercase tracking-wide">Template UID</label>
									<button
										class="text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wide flex items-center gap-1"
										on:click={() => manualTemplateInput['get-variables'] = !manualTemplateInput['get-variables']}
									>
										{manualTemplateInput['get-variables'] ? 'Select from list' : 'Enter manually'}
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4 4-4 4m5-4h3" />
										</svg>
									</button>
								</div>

								{#if manualTemplateInput['get-variables']}
									<input
										type="text"
										class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
										bind:value={getVariablesParams.uid}
										placeholder="Enter template UID"
									/>
								{:else}
									<select
										class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all appearance-none cursor-pointer"
										on:change={(e) => selectTemplate('get-variables', e.target.value)}
										value={getVariablesParams.uid}
									>
										<option value="">Select a template...</option>
										{#if loadingTemplates}
											<option disabled>Loading templates...</option>
										{:else}
											{#each userTemplates as template}
												<option value={template.uid}>
													{template.name} ({template.uid.slice(0, 8)}...)
												</option>
											{/each}
										{/if}
										{#if userTemplates.length === 0 && !loadingTemplates}
											<option disabled>No templates found</option>
										{/if}
									</select>
								{/if}
								<p class="mt-1 text-[10px] text-gray-600">💡 Get the list of variables defined in the template</p>
							</div>
						{:else if selectedEndpoint === 'gif'}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="md:col-span-2">
									<div class="flex items-center justify-between mb-2">
										<label class="text-xs font-black text-gray-900 uppercase tracking-wide">HTML Content</label>
										<button
											class="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide flex items-center gap-1"
											on:click={() => fillExampleData('gif')}
										>
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											Animated Example
										</button>
									</div>
									<textarea
										class="w-full h-32 px-4 py-3 bg-gray-50 border-[3px] border-gray-900 rounded-xl text-sm font-mono focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#ffc480] transition-all resize-none"
										bind:value={gifParams.html}
									></textarea>
								</div>
								<div>
									<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Width (px)</label>
									<input
										type="number"
										class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
										bind:value={gifParams.width}
									/>
								</div>
								<div>
									<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Height (px)</label>
									<input
										type="number"
										class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
										bind:value={gifParams.height}
									/>
								</div>
								<div>
									<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">FPS</label>
									<input
										type="number"
										min="1"
										max="30"
										class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
										bind:value={gifParams.framesPerSecond}
									/>
								</div>
							</div>
						{/if}

						<div class="pt-4 border-t-[3px] border-gray-200 border-dashed space-y-4">
							{#if requiresEmailVerification}
								<EmailVerificationRequired email={userEmail} feature="image and GIF generation APIs" />
							{/if}
							<button
								class="w-full py-4 bg-[#ff6b6b] text-white font-black uppercase tracking-widest rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-[4px_4px_0_0_#1f2937]"
								on:click={() => testEndpoint(selectedEndpoint)}
								disabled={loading || requiresEmailVerification}
							>
								{#if loading}
									<span class="flex items-center justify-center gap-2">
										<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Processing Request...
									</span>
								{:else}
									Run Request
								{/if}
							</button>
						</div>
					</div>
				</div>

				<!-- CURL & Response -->
				<div class="relative group">
					<!-- Terminal Window -->
					<div class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden flex flex-col min-h-[400px]">
						<!-- Terminal Header -->
						<div class="bg-gray-100 border-b-[3px] border-gray-900 p-4 flex items-center justify-between shrink-0">
							<div class="flex items-center gap-3">
								<div class="flex gap-1.5 mr-4">
									<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border border-gray-900"></div>
									<div class="w-3 h-3 rounded-full bg-[#ffc480] border border-gray-900"></div>
									<div class="w-3 h-3 rounded-full bg-[#4ade80] border border-gray-900"></div>
								</div>
								<h3 class="text-sm font-black text-gray-900 uppercase tracking-wide">Terminal Output</h3>
							</div>

							{#if curlExample && !response}
								<button
									class="flex items-center gap-2 px-3 py-1.5 bg-[#ffc480] text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
									on:click={handleCopyCurl}
								>
									{#if copiedCurl}
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
										<span>Copied!</span>
									{:else}
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
										<span>Copy cURL</span>
									{/if}
								</button>
							{:else if response}
								<button
									class="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-600 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
									on:click={() => { response = null; responseJson = ''; }}
								>
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
									Clear
								</button>
							{/if}
						</div>

						<!-- Terminal Content -->
						<div class="flex-1 p-6 font-mono text-sm relative overflow-hidden bg-gray-50">
							<!-- Subtle dot pattern background -->
							<div class="absolute inset-0 opacity-5 pointer-events-none"
								style="background-image: radial-gradient(circle, #000 1px, transparent 1px); background-size: 16px 16px;">
							</div>

							<div class="relative z-10">
								{#if response}
									<!-- Response View -->
									<div class="space-y-6">
										<!-- Status Bar -->
										<div class="flex items-center gap-3 pb-4 border-b-2 border-gray-300">
											<div class="flex items-center gap-2">
												<div class="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse"></div>
												<span class="font-black text-lg text-gray-900">200 OK</span>
											</div>
											<span class="text-gray-400">|</span>
											<span class="text-gray-600 text-xs font-bold">{(new Date()).toLocaleTimeString()}</span>
										</div>

										<!-- Generated Asset Preview -->
										{#if response.url || response.gif?.url}
											<div class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] overflow-hidden">
												<!-- Header -->
												<div class="px-4 py-3 bg-gray-100 border-b-[3px] border-gray-900 flex items-center justify-between">
													<span class="text-xs font-black text-gray-900 uppercase tracking-wide">Preview Output</span>
													<div class="flex gap-2">
														<button
															class="p-1.5 hover:bg-white rounded-lg text-gray-600 hover:text-gray-900 transition-colors border-2 border-transparent hover:border-gray-900"
															on:click={() => copyToClipboard(response.url || response.gif?.url)}
															title="Copy URL"
														>
															<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
														</button>
														<a
															href={response.url || response.gif?.url}
															target="_blank"
															class="p-1.5 hover:bg-white rounded-lg text-gray-600 hover:text-gray-900 transition-colors border-2 border-transparent hover:border-gray-900"
															title="Open in new tab"
														>
															<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
														</a>
													</div>
												</div>
												<!-- Image -->
												<div class="p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBoNHY0SDB6bTQgNGg0djRINHoiIGZpbGw9IiNlZGVkZWQiIGZpbGwtb3BhY2l0eT0iLjUiLz48L3N2Zz4=')]">
													<img
														src={response.url || response.gif?.url}
														alt="Result"
														class="w-full rounded-lg border-2 border-gray-200"
													/>
												</div>
											</div>
										{/if}

										<!-- JSON Response -->
										<div class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] overflow-hidden">
											<div class="px-4 py-3 bg-gray-100 border-b-[3px] border-gray-900">
												<span class="text-xs font-black text-gray-900 uppercase tracking-wide">JSON Response</span>
											</div>
											<div class="p-4">
												<pre class="text-gray-900 overflow-x-auto text-xs leading-relaxed font-mono bg-gray-50 p-4 rounded-lg border-2 border-gray-200">{responseJson}</pre>
											</div>
										</div>
									</div>
								{:else if curlExample}
									<!-- cURL View -->
									<div class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] overflow-hidden">
										<div class="px-4 py-3 bg-gray-100 border-b-[3px] border-gray-900 flex items-center gap-2">
											<span class="text-[#4ade80] font-black text-sm">$</span>
											<span class="text-xs font-black text-gray-900 uppercase tracking-wide">cURL Command</span>
										</div>
										<div class="p-4 bg-gray-50">
											<pre class="text-gray-900 whitespace-pre-wrap break-all text-xs font-mono leading-relaxed">{@html curlExample.display
												.replace(/curl/g, '<span class="text-[#ff6b6b] font-bold">curl</span>')
												.replace(/-X/g, '<span class="text-[#ffc480] font-bold">-X</span>')
												.replace(/-H/g, '<span class="text-[#ffc480] font-bold">-H</span>')
												.replace(/--data-raw/g, '<span class="text-[#ffc480] font-bold">--data-raw</span>')
												.replace(/(GET|POST|PUT|DELETE)/g, '<span class="text-[#4ade80] font-bold">$1</span>')
												.replace(/Bearer/g, '<span class="text-gray-600">Bearer</span>')
											}</pre>
										</div>
									</div>
								{:else}
									<div class="flex flex-col items-center justify-center h-[200px]">
										<div class="mb-4">
											<div class="w-16 h-16 rounded-full border-[3px] border-gray-300 border-t-[#ffc480] animate-spin"></div>
										</div>
										<p class="text-xs font-black text-gray-600 uppercase tracking-wider">Select an endpoint to begin</p>
										<p class="text-[10px] text-gray-500 mt-1">Choose from the menu on the left</p>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>

			</div>
		</div>
	</div>
</div>

<Toast />

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: rgba(0,0,0,0.1);
		border-radius: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255,255,255,0.2);
		border-radius: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(255,255,255,0.3);
	}

	.animate-in {
		animation: fadeIn 0.3s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>