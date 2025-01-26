<script>
	import { onMount } from 'svelte';
	import { getTemplate } from '../../../../api/tools/og-image';
	import { user, getAPITokenAction } from '../../../../store/user.store';
	import { toast } from '../../../../store/toast.store';
	import { createImagePublic, createOgImage, checkApiHealth, getOgImageTemplates } from '../../../../api/image';
	import { 
		templates as templatesStore,
		createTemplateAction,
		updateTemplateAction,
		deleteTemplateAction,
		getTemplatesForTypeAction
	} from '../../../../store/template.store';
	import Toast from '$lib/components/Toast.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import OgImageEditor from './OgImageEditor.svelte';
	import OgImageTemplate from '$lib/components/tools/OgImageTemplate.svelte';
	import { slide } from 'svelte/transition';
	import { get } from 'svelte/store';

	// User state
	let isUserLoggedIn = false;
	let apiKey = '';

	user.subscribe(userData => {
		isUserLoggedIn = !!userData.email;
		console.log('userData', userData);
		if (userData && Array.isArray(userData.apiTokens) && userData.apiTokens.length > 0) {
			apiKey = userData.apiTokens[0].token || '';
		}
	});

	// Component state
	let isLoading = true;
	let isLoadingSaved = false;
	let activeTab = 'templates'; // templates, saved, api
	let defaultTemplatesList = [];
	let savedTemplates = [];
	let recentTemplates = [];
	let selectedTemplate = null;
	let showEditor = false;

	// Settings for API testing
	let settings = {
		template: '',
		heading: '',
		description: '',
		logo: '',
		width: 1200,
		height: 630
	};

	// API testing state
	let isImageGenerating = false;
	let imageUrl = '';

	// PLG Metrics
	let totalImagesGenerated = 45897;
	let activeUsers = 234;
	let showSignupPrompt = false;

	// Default templates
	const defaultTemplates = [
		'template-1', 
		'template-2', 
		'template-3', 
		'template-4', 
		'template-6',
		'template-7',
		'template-8',
		'template-9',
		'template-10',
		'template-11',
		'template-12',
		'template-14',
		'template-15',
		'template-16',
		'template-17',
		'template-18',
		'template-19',
	];

	// API documentation
	const apiEndpoint = '/api/image/og-image';

	// Add new state variables for API documentation
	let selectedEndpoint = 'generate';
	let showApiKey = false;
	let feedbackMessage = '';
	let feedbackEmail = '';
	let responseExample = {
		success: {
			id: 'ZL5YPGWGSP',
			url: 'https://media.pictify.io/ca4or-1737920792413.png',
			createdAt: '2025-01-26T19:46:34.876Z'
		},
		error: {
			error: 'Invalid API key',
			code: 'AUTH_ERROR',
			status: 401
		}
	};

	// Add new state for API testing
	let testResponse = null;
	let isTestingApi = false;
	let isLoadingTemplates = false;

	// Add new state for request preview
	let requestPayload = {
		template: '',
		heading: '',
		description: '',
		logo: ''
	};

	// Add state for template options
	let templateOptions = [];

	// Update endpoints with parameters
	const endpoints = [
		{
			id: 'generate',
			method: 'POST',
			path: '/image/og-image',
			description: 'Generate a new OG image',
			auth: true,
			parameters: [
				{
					name: 'template',
					type: 'string',
					required: true,
					description: 'Template UID to use for the image'
				},
				{
					name: 'heading',
					type: 'string',
					required: true,
					description: 'Main heading text'
				},
				{
					name: 'description',
					type: 'string',
					required: false,
					description: 'Description text'
				},
				{
					name: 'logo',
					type: 'string',
					required: false,
					description: 'URL of the logo to display'
				}
			]
		},
		{
			id: 'templates',
			method: 'GET',
			path: '/templates/type/og-image',
			description: 'Get list of available OG image templates',
			auth: true,
			parameters: []
		}
	];

	// Add example responses for each endpoint
	const responseExamples = {
		generate: {
			success: {
				id: 'ZL5YPGWGSP',
				url: 'https://media.pictify.io/ca4or-1737920792413.png',
				createdAt: '2025-01-26T19:46:34.876Z'
			},
			error: {
				error: 'Invalid API key',
				code: 'AUTH_ERROR',
				status: 401
			}
		},
		templates: {
			success: {
				templates: [
					{
						uid: 'template-1',
						name: 'Modern Gradient',
						type: 'og-image',
						createdAt: '2025-01-26T19:46:34.876Z'
					},
					{
						uid: 'template-2',
						name: 'Minimal Dark',
						type: 'og-image',
						createdAt: '2025-01-26T19:46:34.876Z'
					}
				]
			},
			error: {
				error: 'Unauthorized',
				code: 'AUTH_ERROR',
				status: 401
			}
		}
	};

	// Add troubleshooting guide
	const troubleshootingGuide = [
		{
			problem: 'Authentication Failed',
			solution: 'Verify your API key is valid and properly formatted in the Authorization header'
		},
		{
			problem: 'Template Not Found',
			solution: 'Ensure the template UID exists and is accessible'
		},
		{
			problem: 'Invalid Parameters',
			solution: 'Check that all required parameters are provided and properly formatted'
		}
	];

	// Function to handle feedback submission
	const submitFeedback = () => {
		if (!feedbackMessage) {
			toast.set({ message: 'Please enter your feedback', duration: 1500 });
			return;
		}
		
		// Here you would typically send this to your backend
		toast.set({ message: 'Thank you for your feedback!', duration: 1500 });
		feedbackMessage = '';
		feedbackEmail = '';
	};

	const loadDefaultTemplates = async () => {
		try {
			defaultTemplatesList = await Promise.all(defaultTemplates.map(async(name) => {
				const template = await getTemplate(name);
				return template;
			}));
			isLoading = false;
		} catch (error) {
			console.error('Error loading templates:', error);
			toast.set({ message: 'Failed to load templates', duration: 1500 });
			defaultTemplatesList = [];
			isLoading = false;
		}
	};

	const loadSavedTemplates = async () => {
		if (!isUserLoggedIn) return;
		
		isLoadingSaved = true;
		try {
			const response = await getTemplatesForTypeAction('og-image');
			console.log('Loaded saved templates:', response);
			
			// Get templates from store as fallback
			const storeTemplates = get(templatesStore) || [];
			const ogImageTemplates = storeTemplates.filter(t => t.type === 'og-image');
			
			if (response?.templates) {
				savedTemplates = response.templates;
				templateOptions = response.templates.map(t => ({
					uid: t.uid,
					name: t.name || 'Untitled Template'
				}));
			} else if (ogImageTemplates.length > 0) {
				savedTemplates = ogImageTemplates;
				templateOptions = ogImageTemplates.map(t => ({
					uid: t.uid,
					name: t.name || 'Untitled Template'
				}));
			} else {
				savedTemplates = [];
				templateOptions = [];
			}
			
			console.log('Final saved templates:', savedTemplates);
		} catch (error) {
			console.error('Error loading saved templates:', error);
			toast.set({ message: 'Failed to load saved templates', duration: 1500 });
			savedTemplates = [];
			templateOptions = [];
		} finally {
			isLoadingSaved = false;
		}
	};

	const handleSaveTemplate = async (event) => {
		if (!isUserLoggedIn) {
			showSignupPrompt = true;
			return;
		}

		try {
			const { template, settings } = event.detail;
			const templateData = {
				html: template,
				type: 'og-image',
				name: settings.heading || 'Untitled Template',
				width: settings.width || 1200,
				height: settings.height || 600,
				grapeJSData: null
			};

			const savedTemplate = await createTemplateAction(templateData);
			if (savedTemplate) {
				toast.set({ message: 'Template saved successfully', duration: 1500 });
				await loadSavedTemplates();
				activeTab = 'saved';
			}
		} catch (error) {
			console.error('Error saving template:', error);
			toast.set({ message: 'Failed to save template', duration: 1500 });
		}
	};

	const handleUpdateTemplate = async (event) => {
		if (!isUserLoggedIn) return;

		try {
			const { template, settings } = event.detail;
			const templateData = {
				uid: selectedTemplate.uid,
				html: template,
				type: 'og-image',
				name: settings.heading || 'Untitled Template',
				width: settings.width || 1200,
				height: settings.height || 600,
				grapeJSData: null
			};

			const updatedTemplate = await updateTemplateAction(templateData);
			if (updatedTemplate) {
				toast.set({ message: 'Template updated successfully', duration: 1500 });
				await loadSavedTemplates();
			}
		} catch (error) {
			console.error('Error updating template:', error);
			toast.set({ message: 'Failed to update template', duration: 1500 });
		}
	};

	const handleTemplateSelect = (template) => {
		// Reset the selected template first
		selectedTemplate = null;
		
		// Reset the editor state
		if (showEditor) {
			showEditor = false;
			// Small delay to ensure the editor is properly reset
			setTimeout(() => {
				selectedTemplate = template;
				showEditor = true;
			}, 50);
		} else {
			selectedTemplate = template;
			showEditor = true;
		}
		
		// Show signup prompt for free users after a few uses
		if (!isUserLoggedIn && Math.random() > 0.7) {
			showSignupPrompt = true;
		}
	};

	const handleImageGenerated = (event) => {
		const { imageUrl, template, settings } = event.detail;
		
		// Add to recent templates
		recentTemplates = [{
			imageUrl,
			template,
			settings,
			timestamp: new Date()
		}, ...recentTemplates].slice(0, 10);

		// Update metrics
		totalImagesGenerated++;
	};

	const handleDeleteTemplate = async (uid) => {
		if (!isUserLoggedIn) return;

		try {
			const success = await deleteTemplateAction(uid);
			if (success) {
				toast.set({ message: 'Template deleted successfully', duration: 1500 });
				await loadSavedTemplates();
			}
		} catch (error) {
			console.error('Error deleting template:', error);
			toast.set({ message: 'Failed to delete template', duration: 1500 });
		}
	};

	// Watch for changes in settings and update request payload
	$: {
		if (activeTab === 'api') {
			requestPayload = {
				template: settings.template,
				heading: settings.heading,
				description: settings.description,
				logo: settings.logo
			};
		}
	}

	// Add generateImage function for API testing
	const generateImage = async () => {
		if (!settings.template || !settings.heading) {
			toast.set({ message: 'Please select a template and enter a heading', duration: 1500 });
			return;
		}

		isImageGenerating = true;
		try {
			const data = await createOgImage({
				template: settings.template,
				heading: settings.heading,
				description: settings.description,
				logo: settings.logo,
				apiKey
			});

			imageUrl = data.url;
			testResponse = { 
				status: 200,
				data
			};
			totalImagesGenerated++;
			isApiOperational = true;
			
			if (!isUserLoggedIn) {
				showSignupPrompt = true;
			}
		} catch (error) {
			console.error('Error generating image:', error);
			testResponse = {
				status: error.status || 500,
				error: error.message || 'Failed to generate image'
			};
			isApiOperational = false;
		} finally {
			isImageGenerating = false;
		}
	};

	// Add API status state
	let isApiOperational = false;

	// Function to check API status
	const checkApiStatus = async () => {
		try {
			isApiOperational = await checkApiHealth();
		} catch (error) {
			isApiOperational = false;
		}
	};

	// Function to test templates endpoint
	const getTemplates = async () => {
		isLoadingTemplates = true;
		try {
			const data = await getOgImageTemplates(apiKey);
			testResponse = {
				status: 200,
				data
			};
			isApiOperational = true;
		} catch (error) {
			console.error('Error fetching templates:', error);
			testResponse = {
				status: error.status || 500,
				error: error.message || 'Failed to fetch templates'
			};
			isApiOperational = false;
		} finally {
			isLoadingTemplates = false;
		}
	};

	// Watch for endpoint changes to reset response and image
	$: {
		if (selectedEndpoint) {
			testResponse = null;
			imageUrl = '';
		}
	}

	// Update the test button click handler
	const handleTestEndpoint = () => {
		if (selectedEndpoint === 'generate') {
			generateImage();
		} else if (selectedEndpoint === 'templates') {
			getTemplates();
		}
	};

	// Add API token state
	let apiTokens = [];

	// Load API tokens
	const loadApiTokens = async () => {
		try {
			const response = await getAPITokenAction();
			if (response?.apiTokens) {
				apiTokens = response.apiTokens;
				// Set the first token as the API key if available
				if (apiTokens.length > 0) {
					apiKey = apiTokens[0].token || '';
				}
			}
		} catch (error) {
			console.error('Error loading API tokens:', error);
			toast.set({ message: 'Failed to load API tokens', duration: 1500 });
		}
	};

	let initialLoadDone = false;

	onMount(async () => {
		await loadDefaultTemplates();
		// Check API status on mount
		await checkApiStatus();
		// Set up interval to check API status every minute
		const statusInterval = setInterval(checkApiStatus, 60000);
		return () => clearInterval(statusInterval);
	});

	// Handle both initial load and state changes
	user.subscribe(async (userData) => {
		isUserLoggedIn = !!userData.email;
		
		if (userData?.email && !initialLoadDone) {
			initialLoadDone = true;
			await loadApiTokens();
			await loadSavedTemplates();
		} else if (!userData?.email) {
			// Cleanup when user logs out
			savedTemplates = [];
			apiTokens = [];
			apiKey = '';
		}
	});

	// Subscribe to templates store - only update if we have templates
	templatesStore.subscribe((storeTemplates) => {
		if (activeTab === 'saved' && storeTemplates && storeTemplates.length > 0) {
			const ogImageTemplates = storeTemplates.filter(t => t.type === 'og-image');
			if (ogImageTemplates.length > 0) {
				savedTemplates = ogImageTemplates;
			}
		}
	});
</script>

<div class="h-full w-full max-w-6xl m-auto p-5">
	<!-- Navigation Tabs -->
	<div class="flex space-x-1 border-b-[3px] border-black">
		<button
			class="px-4 py-2 font-medium {activeTab === 'templates' ? 'bg-black text-white' : 'text-gray-700 hover:text-gray-900'}"
			on:click={() => activeTab = 'templates'}
		>
			Templates
		</button>
		{#if isUserLoggedIn}
			<button
				class="px-4 py-2 font-medium {activeTab === 'saved' ? 'bg-black text-white' : 'text-gray-700 hover:text-gray-900'}"
				on:click={() => activeTab = 'saved'}
			>
				Saved
			</button>
		{/if}
		<button
			class="px-4 py-2 font-medium {activeTab === 'api' ? 'bg-black text-white' : 'text-gray-700 hover:text-gray-900'}"
			on:click={() => activeTab = 'api'}
		>
			API
		</button>
	</div>

	<!-- Content Area -->
	{#if isLoading && activeTab === 'templates'}
		<div class="mt-20">
			<Loader size="16" show={true} />
		</div>
	{:else if isLoadingSaved && activeTab === 'saved'}
		<div class="mt-20">
			<Loader size="16" show={true} />
		</div>
	{:else}
		<div class="mt-8 space-y-8">
			<!-- Editor Area - Only show in templates and saved tabs -->
			{#if showEditor && activeTab !== 'api'}
				<div class="mb-8">
					<OgImageEditor
						template={selectedTemplate}
						{isUserLoggedIn}
						isSavedTemplate={activeTab === 'saved'}
						on:close={() => {
							showEditor = false;
							selectedTemplate = null;
						}}
						on:generated={handleImageGenerated}
						on:save={handleSaveTemplate}
						on:update={handleUpdateTemplate}
					/>
				</div>
			{/if}
			<div>
						{#if activeTab === 'templates'}
									<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						{#each defaultTemplatesList as template}
							<div class="border-2 {template === selectedTemplate ? 'border-[#ff6b6b]' : 'border-gray-200'} rounded-lg overflow-hidden relative group">
								<OgImageTemplate 
									html={template} 
									width={1200} 
									height={630} 
									scale={0.3} 
								/>
								{#if template === selectedTemplate}
									<div class="absolute top-2 left-2 bg-[#ff6b6b] text-white px-2 py-1 rounded-md text-sm font-medium">
										Selected
									</div>
								{/if}
								<div 
									class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center cursor-pointer"
									on:click={() => handleTemplateSelect(template)}
									on:keydown={(e) => {
										if (e.key === 'Enter') handleTemplateSelect(template);
									}}
									role="button"
									tabindex="0"
								>
									<button class="opacity-0 group-hover:opacity-100 bg-black text-white px-6 py-2 rounded-md transform translate-y-2 group-hover:translate-y-0 transition-all">
										{template === selectedTemplate ? 'Edit Template' : 'Use Template'}
									</button>
								</div>
							</div>
						{/each}
					</div>
					{:else if activeTab === 'saved' && isUserLoggedIn}
													<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						{#if savedTemplates.length === 0}
							<div class="text-center mt-20 col-span-3">
								<div class="mb-5 text-lg font-bold">No Saved Templates</div>
								<div class="mb-3 text-lg font-light">Customize and save templates for quick access</div>
							</div>
						{:else}
							{#each savedTemplates as template}
								<div class="border-2 {template === selectedTemplate ? 'border-[#ff6b6b]' : 'border-gray-200'} rounded-lg overflow-hidden relative group">
									<OgImageTemplate 
										html={template.html} 
										width={1200} 
										height={630} 
										scale={0.3} 
									/>
									{#if template === selectedTemplate}
										<div class="absolute top-2 left-2 bg-[#ff6b6b] text-white px-2 py-1 rounded-md text-sm font-medium">
											Selected
										</div>
										<!-- Add UID display -->
										<div class="absolute top-12 left-2 bg-black/80 text-white px-2 py-1 rounded-md text-xs font-mono">
											UID: {template.uid}
										</div>
									{/if}
									<!-- Delete button -->
									<div
										class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
									>
										<button
											class="p-2 bg-red-500 text-white rounded hover:bg-red-600"
											on:click|stopPropagation={() => handleDeleteTemplate(template.uid)}
										>
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
									<!-- Clickable overlay -->
									<div 
										class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center cursor-pointer"
										on:click={() => handleTemplateSelect(template)}
										on:keydown={(e) => {
											if (e.key === 'Enter') handleTemplateSelect(template);
										}}
										role="button"
										tabindex="0"
									>
										<button class="opacity-0 group-hover:opacity-100 bg-black text-white px-6 py-2 rounded-md transform translate-y-2 group-hover:translate-y-0 transition-all">
											{template === selectedTemplate ? 'Edit Template' : 'Use Template'}
										</button>
									</div>
								</div>
							{/each}
						{/if}
					</div>
					{:else if activeTab === 'api'}
						<div class="mt-8 space-y-8">
							<!-- API Overview -->
							<div class="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8">
								<div class="max-w-4xl mx-auto">
									<div class="flex items-center justify-between mb-6">
										<div>
											<h2 class="text-2xl font-bold mb-2">API Documentation</h2>
											<p class="text-gray-700">
												Generate beautiful OG images programmatically using our REST API.
											</p>
										</div>
										<div class="flex items-center gap-4">
											<div class="flex items-center gap-2">
												<div class={`h-2 w-2 rounded-full ${isApiOperational ? 'bg-green-500' : 'bg-red-500'}`}></div>
												<span class="text-sm text-gray-600">API Status: {isApiOperational ? 'Operational' : 'Down'}</span>
											</div>
											{#if isUserLoggedIn}
												<button
													class="px-4 py-2 bg-[#ff6b6b] text-white rounded-lg hover:bg-[#ff5252]"
													on:click={() => {/* Get API Key */}}
												>
													Get API Key
												</button>
											{/if}
										</div>
									</div>

									<!-- Main API Playground -->
									<div class="grid grid-cols-12 gap-6">
										<!-- Left Panel - Endpoints & Auth -->
										<div class="col-span-4 space-y-6">
											<!-- Authentication -->
											<div class="bg-gray-50 rounded-xl p-4">
												<h3 class="text-sm font-medium text-gray-900 mb-2">Authentication</h3>
												<div class="space-y-2">
													{#if isUserLoggedIn}
														<div class="relative">
															<input
																type={showApiKey ? 'text' : 'password'}
																class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm bg-gray-100"
																value={apiKey}
																readonly
															/>
															<button
																class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
																on:click={() => showApiKey = !showApiKey}
															>
																<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
																	{#if showApiKey}
																		<path d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" />
																		<path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
																	{:else}
																		<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
																		<path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
																	{/if}
																</svg>
															</button>
														</div>
													{:else}
														<div class="text-sm text-gray-600">
															Please <a href="/login" class="text-[#ff6b6b] hover:text-[#ff5252]">login</a> to get an API key.
														</div>
													{/if}
												</div>
											</div>

											<!-- Endpoints List -->
											<div>
												<h3 class="text-sm font-medium text-gray-900 mb-2">Available Endpoints</h3>
												<div class="space-y-2">
													{#each endpoints as endpoint}
														<button
															class="w-full p-3 rounded-xl border-2 text-left transition-all {selectedEndpoint === endpoint.id ? 'border-[#ff6b6b] bg-[#ff6b6b]/5' : 'border-gray-200 hover:border-[#ff6b6b]/30'}"
															on:click={() => selectedEndpoint = endpoint.id}
														>
															<div class="flex items-center gap-2 mb-1">
																<span class="px-2 py-0.5 text-xs font-medium rounded bg-gray-900 text-white">{endpoint.method}</span>
																<span class="text-sm font-mono text-gray-600">{endpoint.path}</span>
															</div>
															<p class="text-xs text-gray-600">{endpoint.description}</p>
														</button>
													{/each}
												</div>
											</div>
										</div>

										<!-- Right Panel - Parameters & Response -->
										<div class="col-span-8 space-y-6">
											<!-- Selected Endpoint Details -->
											{#if selectedEndpoint}
												{@const endpoint = endpoints.find(e => e.id === selectedEndpoint)}
												{#if endpoint}
													<!-- Parameters -->
													<div class="bg-gray-50 rounded-xl p-4">
														<h3 class="text-sm font-medium text-gray-900 mb-4">Request Parameters</h3>
														<div class="space-y-4">
															{#each endpoint.parameters as param}
																<div>
																	<label class="flex items-center gap-2 text-sm mb-1">
																		<span class="font-medium">{param.name}</span>
																		{#if param.required}
																			<span class="text-xs text-red-500">Required</span>
																		{/if}
																	</label>
																	<p class="text-xs text-gray-600 mb-2">{param.description}</p>
																	{#if param.name === 'template'}
																		<select
																			class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
																			bind:value={settings[param.name]}
																		>
																			<option value="">Select a template</option>
																			{#each templateOptions as template}
																				<option value={template.uid}>
																					{template.name} ({template.uid})
																				</option>
																			{/each}
																		</select>
																		{#if templateOptions.length === 0}
																			<p class="text-xs text-gray-500 mt-1">
																				No saved templates available. Save a template first to use it with the API.
																			</p>
																		{/if}
																	{:else}
																		<input
																			type="text"
																			class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
																			placeholder="Enter {param.name}"
																			bind:value={settings[param.name]}
																		/>
																	{/if}
																</div>
															{/each}
														</div>
													</div>

													<!-- Request Preview -->
													<div class="bg-gray-50 rounded-xl p-4">
														<div class="flex items-center justify-between mb-4">
															<h3 class="text-sm font-medium text-gray-900">Request Preview</h3>
															{#if selectedEndpoint === 'generate'}
																<button
																	class="text-xs text-[#ff6b6b] hover:text-[#ff5252] flex items-center gap-1"
																	on:click={() => {
																		navigator.clipboard.writeText(JSON.stringify(requestPayload, null, 2));
																		toast.set({ message: 'Copied to clipboard', duration: 1500 });
																	}}
																>
																	<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
																		<path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
																		<path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
																	</svg>
																	Copy
																</button>
															{/if}
														</div>
														<div class="bg-gray-900 rounded-lg p-4">
															{#if selectedEndpoint === 'generate'}
																<div class="text-gray-300 text-sm font-mono">
																	curl -X POST {apiEndpoint} \
																	{#if apiKey}
																	<br/>  -H "Authorization: Bearer {apiKey}" \{/if}
																	<br/>  -H "Content-Type: application/json" \
																	<br/>  -d '{JSON.stringify(requestPayload, null, 2)}'
																</div>
															{:else if selectedEndpoint === 'templates'}
																<div class="text-gray-300 text-sm font-mono">
																	curl -X GET /templates/type/og-image \
																	{#if apiKey}
																	<br/>  -H "Authorization: Bearer {apiKey}"{/if}
																</div>
															{/if}
														</div>
													</div>

													<!-- Test Button -->
													<button
														class="w-full bg-[#ff6b6b] text-white py-2 px-4 rounded-lg hover:bg-[#ff5252] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
														on:click={handleTestEndpoint}
														disabled={!apiKey || (selectedEndpoint === 'generate' && (!settings.template || !settings.heading)) || isImageGenerating || isLoadingTemplates}
													>
														{#if isImageGenerating || isLoadingTemplates}
															<span class="flex items-center justify-center gap-2">
																<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
																	<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
																	<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
																</svg>
																{selectedEndpoint === 'generate' ? 'Generating...' : 'Loading Templates...'}
															</span>
														{:else}
															{!apiKey ? 'API Key Required' : 'Test Endpoint'}
														{/if}
													</button>

													<!-- Response -->
													{#if testResponse}
														<div class="bg-gray-50 rounded-xl p-4">
															<div class="flex items-center justify-between mb-4">
																<div class="flex items-center gap-3">
																	<h3 class="text-sm font-medium text-gray-900">Response</h3>
																	<span class={`px-2 py-0.5 text-xs font-medium rounded ${testResponse.status >= 200 && testResponse.status < 300 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
																		Status: {testResponse.status}
																	</span>
																</div>
																<button
																	class="text-xs text-[#ff6b6b] hover:text-[#ff5252] flex items-center gap-1"
																	on:click={() => {
																		navigator.clipboard.writeText(JSON.stringify(testResponse.data || testResponse.error, null, 2));
																		toast.set({ message: 'Copied to clipboard', duration: 1500 });
																	}}
																>
																	<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
																		<path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
																		<path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
																	</svg>
																	Copy
																</button>
															</div>
															<div class="bg-gray-900 rounded-lg p-4">
																<pre class="text-gray-300 text-sm overflow-x-auto"><code>{JSON.stringify(testResponse.data || testResponse.error, null, 2)}</code></pre>
															</div>
														</div>

														<!-- Generated Image Preview - Only show for successful responses -->
														{#if testResponse.status === 200 && imageUrl}
															<div class="bg-gray-50 rounded-xl p-4 mt-4">
																<h3 class="text-sm font-medium text-gray-900 mb-4">Generated Image</h3>
																<img
																	src={imageUrl}
																	alt="Generated OG Image"
																	class="w-full rounded-lg shadow-lg"
																/>
																<div class="mt-4">
																	<div class="flex items-center justify-between">
																		<span class="text-xs text-gray-600">Image URL</span>
																		<button
																			class="text-xs text-[#ff6b6b] hover:text-[#ff5252] flex items-center gap-1"
																			on:click={() => {
																				navigator.clipboard.writeText(imageUrl);
																				toast.set({ message: 'Copied to clipboard', duration: 1500 });
																			}}
																		>
																			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
																				<path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
																				<path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
																			</svg>
																			Copy
																		</button>
																	</div>
																	<div class="bg-gray-100 p-3 rounded-lg mt-2 font-mono text-xs break-all">
																		{imageUrl}
																	</div>
																</div>
															</div>
														{/if}
													{/if}
												{/if}
											{/if}
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

<!-- Signup Prompt Modal -->
{#if showSignupPrompt}
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-2xl max-w-md w-full mx-auto p-8">
			<h3 class="text-2xl font-bold text-gray-900 mb-4">Unlock All Features</h3>
			<p class="text-gray-700">Sign up to unlock premium features:</p>
			<ul class="list-disc list-inside mt-2 mb-6 space-y-1">
				<li>Save unlimited templates</li>
				<li>Access premium templates</li>
				<li>Priority image generation</li>
				<li>Custom branding options</li>
			</ul>
			<div class="flex gap-4">
				<a
					href="/signup"
					class="flex-1 px-6 py-2 bg-[#ff6b6b] text-white rounded-lg hover:bg-[#ff5252] text-center"
				>
					Sign Up Free
				</a>
				<button
					class="flex-1 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
					on:click={() => showSignupPrompt = false}
				>
					Maybe Later
				</button>
			</div>
		</div>
	</div>
{/if}

<Toast />

<style>
	:global(.aspect-w-16) {
		position: relative;
		padding-bottom: 56.25%;
	}

	:global(.aspect-h-9) {
		position: absolute;
		height: 100%;
		width: 100%;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
	}
</style>