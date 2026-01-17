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
				type: 'og-image',
				name: settings.heading || 'Untitled Template',
				width: settings.width || 1200,
				height: settings.height || 600,
				fabricJSData: null
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
				type: 'og-image',
				name: settings.heading || 'Untitled Template',
				width: settings.width || 1200,
				height: settings.height || 600,
				fabricJSData: null
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

<div class="min-h-screen w-full bg-[#FFFDF8] font-['Manrope']">
	<div class="max-w-7xl mx-auto px-6 py-12">
		
		<!-- Header Section -->
		<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
			<div>
				<h1 class="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-2">
					OG Image <span class="text-[#ff6b6b] relative inline-block">
						Generator
						<svg class="absolute w-full h-3 -bottom-1 left-0 text-gray-900 opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
							<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
						</svg>
					</span>
				</h1>
				<p class="text-lg text-gray-600 font-medium max-w-xl">
					Create pixel-perfect social media images instantly. Choose a template, customize it, and export.
				</p>
			</div>

			<!-- Navigation Tabs -->
			<div class="flex gap-2 p-2 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] overflow-x-auto max-w-full">
				<button
					class="px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap {activeTab === 'templates' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}"
					on:click={() => activeTab = 'templates'}
				>
					Templates
				</button>
				{#if isUserLoggedIn}
					<button
						class="px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap {activeTab === 'saved' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}"
						on:click={() => activeTab = 'saved'}
					>
						Saved
					</button>
				{/if}
				<button
					class="px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap {activeTab === 'api' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}"
					on:click={() => activeTab = 'api'}
				>
					API Playground
				</button>
			</div>
		</div>

		<!-- Content Area -->
		{#if isLoading && activeTab === 'templates'}
			<div class="flex justify-center items-center min-h-[400px]">
				<Loader size="lg" show={true} />
			</div>
		{:else if isLoadingSaved && activeTab === 'saved'}
			<div class="flex justify-center items-center min-h-[400px]">
				<Loader size="lg" show={true} />
			</div>
		{:else}
			<div class="animate-fade-in">
				<!-- Editor Area -->
				{#if showEditor && activeTab !== 'api'}
					<div class="mb-16 bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden" transition:slide>
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

				<!-- Templates Grid -->
				{#if activeTab === 'templates'}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{#each defaultTemplatesList as template}
							<div class="group bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#1f2937] transition-all duration-200 relative">
								<div class="p-2 bg-gray-50 border-b-[3px] border-gray-900">
									<div class="flex gap-1.5">
										<div class="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-400"></div>
										<div class="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-400"></div>
										<div class="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-400"></div>
									</div>
								</div>
								<div class="relative aspect-[1.91/1] bg-gray-100">
									<OgImageTemplate 
										html={template} 
										width={1200} 
										height={630} 
										scale={0.25} 
									/>
									
									{#if template === selectedTemplate}
										<div class="absolute top-3 left-3 bg-[#ff6b6b] text-white px-3 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] text-xs font-bold uppercase tracking-wider z-10">
											Selected
										</div>
									{/if}

									<!-- Hover Overlay -->
									<div 
										class="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center backdrop-blur-[2px] cursor-pointer"
										on:click={() => handleTemplateSelect(template)}
										on:keydown={(e) => e.key === 'Enter' && handleTemplateSelect(template)}
										role="button"
										tabindex="0"
									>
										<button class="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ff6b6b] hover:scale-105 transition-transform transform translate-y-4 group-hover:translate-y-0">
											{template === selectedTemplate ? 'Edit Template' : 'Use Template'}
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>

				<!-- Saved Templates Grid -->
				{:else if activeTab === 'saved' && isUserLoggedIn}
					{#if savedTemplates.length === 0}
						<div class="flex flex-col items-center justify-center min-h-[400px] text-center bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] p-12">
							<div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 border-[3px] border-gray-900">
								<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
							</div>
							<h3 class="text-2xl font-black text-gray-900 mb-2">No Saved Templates</h3>
							<p class="text-gray-600 max-w-md mb-8">Start by customizing one of our default templates and save it to reuse later.</p>
							<button 
								class="px-6 py-3 bg-[#ff6b6b] text-white font-bold rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#1f2937] transition-all"
								on:click={() => activeTab = 'templates'}
							>
								Browse Templates
							</button>
						</div>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
							{#each savedTemplates as template}
								<div class="group bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#1f2937] transition-all duration-200 relative">
									<div class="p-2 bg-gray-50 border-b-[3px] border-gray-900 flex justify-between items-center px-3">
										<div class="flex gap-1.5">
											<div class="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-400"></div>
											<div class="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-400"></div>
										</div>
										<button
											class="text-gray-400 hover:text-red-500 transition-colors"
											on:click|stopPropagation={() => handleDeleteTemplate(template.uid)}
											title="Delete Template"
										>
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
									
									<div class="relative aspect-[1.91/1] bg-gray-100">
										<OgImageTemplate 
											html={template.html} 
											width={1200} 
											height={630} 
											scale={0.25} 
										/>
										
										{#if template === selectedTemplate}
											<div class="absolute top-3 left-3 bg-[#ff6b6b] text-white px-3 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] text-xs font-bold uppercase tracking-wider z-10">
												Selected
											</div>
										{/if}

										<!-- Hover Overlay -->
										<div 
											class="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center backdrop-blur-[2px] cursor-pointer"
											on:click={() => handleTemplateSelect(template)}
											on:keydown={(e) => e.key === 'Enter' && handleTemplateSelect(template)}
											role="button"
											tabindex="0"
										>
											<button class="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ff6b6b] hover:scale-105 transition-transform transform translate-y-4 group-hover:translate-y-0">
												Edit Template
											</button>
										</div>
									</div>
									<div class="p-3 border-t-[3px] border-gray-900 bg-gray-50">
										<div class="text-xs font-mono text-gray-500">ID: {template.uid}</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}

				<!-- API Playground -->
				{:else if activeTab === 'api'}
					<div class="bg-white border-[3px] border-gray-900 rounded-3xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
						<div class="p-8 md:p-10">
							<!-- API Header -->
							<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b-2 border-gray-100">
								<div>
									<h2 class="text-2xl font-black text-gray-900 mb-2">API Documentation</h2>
									<p class="text-gray-600 font-medium">Generate beautiful OG images programmatically using our REST API.</p>
								</div>
								<div class="flex items-center gap-4">
									<div class="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border-2 border-gray-200">
										<div class={`h-3 w-3 rounded-full shadow-sm ${isApiOperational ? 'bg-[#4ade80]' : 'bg-[#ff6b6b]'}`}></div>
										<span class="text-sm font-bold text-gray-700">System: {isApiOperational ? 'Operational' : 'Offline'}</span>
									</div>
									{#if isUserLoggedIn}
										<button
											class="px-4 py-2 bg-[#ffc480] text-gray-900 font-bold rounded-lg border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#1f2937] transition-all"
											on:click={() => {/* Get API Key */}}
										>
											Get API Key
										</button>
									{/if}
								</div>
							</div>

							<div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
								<!-- Left Panel -->
								<div class="lg:col-span-4 space-y-8">
									<!-- Authentication Box -->
									<div class="space-y-3">
										<h3 class="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
											Authentication
										</h3>
										<div class="bg-gray-50 p-4 rounded-xl border-[3px] border-gray-900 shadow-sm">
											{#if isUserLoggedIn}
												<div class="relative">
													<input
														type={showApiKey ? 'text' : 'password'}
														class="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg text-sm font-mono bg-white focus:border-gray-900 focus:outline-none transition-colors"
														value={apiKey}
														readonly
													/>
													<button
														class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
														on:click={() => showApiKey = !showApiKey}
													>
														<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
												<div class="text-sm font-medium text-gray-600 text-center py-2">
													Please <a href="/login" class="text-[#ff6b6b] hover:underline font-bold">login</a> to get your API key.
												</div>
											{/if}
										</div>
									</div>

									<!-- Endpoints List -->
									<div class="space-y-3">
										<h3 class="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
											Endpoints
										</h3>
										<div class="space-y-3">
											{#each endpoints as endpoint}
												<button
													class="w-full p-4 rounded-xl border-[3px] text-left transition-all group {selectedEndpoint === endpoint.id ? 'border-gray-900 bg-gray-900 text-white shadow-[4px_4px_0_0_#ff6b6b]' : 'border-gray-200 bg-white hover:border-gray-900 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#gray-200]'}"
													on:click={() => selectedEndpoint = endpoint.id}
												>
													<div class="flex items-center gap-3 mb-2">
														<span class="px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider {selectedEndpoint === endpoint.id ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-700'}">{endpoint.method}</span>
														<span class="text-xs font-mono opacity-80">{endpoint.path}</span>
													</div>
													<p class="text-sm font-bold {selectedEndpoint === endpoint.id ? 'text-gray-100' : 'text-gray-700'}">{endpoint.description}</p>
												</button>
											{/each}
										</div>
									</div>
								</div>

								<!-- Right Panel -->
								<div class="lg:col-span-8 space-y-8">
									{#if selectedEndpoint}
										{@const endpoint = endpoints.find(e => e.id === selectedEndpoint)}
										{#if endpoint}
											<!-- Parameters Card -->
											<div class="bg-white rounded-xl border-[3px] border-gray-900 p-6 shadow-[4px_4px_0_0_#1f2937]">
												<h3 class="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
													<div class="w-2 h-6 bg-[#ff6b6b] rounded-full"></div>
													Request Parameters
												</h3>
												<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
													{#each endpoint.parameters as param}
															<div class="space-y-2">
																<div class="flex items-center gap-2 text-sm font-bold text-gray-900">
																	<span>{param.name}</span>
																	{#if param.required}
																		<span class="text-[10px] text-[#ff6b6b] bg-[#ff6b6b]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Required</span>
																	{/if}
																</div>
															
															{#if param.name === 'template'}
																<select
																	class="w-full px-4 py-2.5 border-[3px] border-gray-200 rounded-lg text-sm font-medium focus:border-gray-900 focus:outline-none transition-colors bg-white cursor-pointer"
																	bind:value={settings[param.name]}
																>
																	<option value="">Select a template</option>
																	{#each templateOptions as template}
																		<option value={template.uid}>
																			{template.name} ({template.uid})
																		</option>
																	{/each}
																</select>
															{:else}
																<input
																	type="text"
																	class="w-full px-4 py-2.5 border-[3px] border-gray-200 rounded-lg text-sm font-medium focus:border-gray-900 focus:outline-none transition-colors"
																	placeholder={param.description}
																	bind:value={settings[param.name]}
																/>
															{/if}
														</div>
													{/each}
												</div>
											</div>

											<!-- Request Preview -->
											<div class="bg-[#1e1e1e] rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] overflow-hidden">
												<div class="bg-[#2d2d2d] px-4 py-3 border-b-2 border-gray-800 flex items-center justify-between">
													<div class="flex items-center gap-2">
														<div class="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
														<div class="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
														<div class="w-3 h-3 rounded-full bg-[#27c93f]"></div>
														<span class="ml-2 text-xs font-mono text-gray-500">REQUEST PREVIEW</span>
													</div>
													{#if selectedEndpoint === 'generate'}
														<button
															class="text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
															on:click={() => {
																navigator.clipboard.writeText(JSON.stringify(requestPayload, null, 2));
																toast.set({ message: 'Copied!', duration: 1500 });
															}}
														>
															<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>
															Copy
														</button>
													{/if}
												</div>
												<div class="p-6 overflow-x-auto">
													{#if selectedEndpoint === 'generate'}
														<pre class="text-sm font-mono text-gray-300 leading-relaxed">
<span class="text-[#ff79c6]">curl</span> -X POST {apiEndpoint} \
{#if apiKey}  -H <span class="text-[#f1fa8c]">"Authorization: Bearer {apiKey}"</span> \{/if}
  -H <span class="text-[#f1fa8c]">"Content-Type: application/json"</span> \
  -d <span class="text-[#50fa7b]">{JSON.stringify(requestPayload, null, 2)}</span></pre>
													{:else if selectedEndpoint === 'templates'}
														<pre class="text-sm font-mono text-gray-300 leading-relaxed">
<span class="text-[#ff79c6]">curl</span> -X GET /templates/type/og-image \
{#if apiKey}  -H <span class="text-[#f1fa8c]">"Authorization: Bearer {apiKey}"</span>{/if}</pre>
													{/if}
												</div>
											</div>

											<!-- Action Button -->
											<button
												class="w-full py-4 bg-[#ff6b6b] text-white font-black text-lg rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#1f2937] active:translate-y-0 active:shadow-[2px_2px_0_0_#1f2937] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
												on:click={handleTestEndpoint}
												disabled={!apiKey || (selectedEndpoint === 'generate' && (!settings.template || !settings.heading)) || isImageGenerating || isLoadingTemplates}
											>
												{#if isImageGenerating || isLoadingTemplates}
													<span class="flex items-center justify-center gap-3">
														<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
															<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
															<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
														</svg>
														Processing Request...
													</span>
												{:else}
													{!apiKey ? 'API Key Required to Test' : 'Run Request'}
												{/if}
											</button>

											<!-- Response Section -->
											{#if testResponse}
												<div class="space-y-4 animate-fade-in">
													<div class="flex items-center justify-between">
														<h3 class="text-lg font-black text-gray-900">Response</h3>
														<span class={`px-3 py-1 text-xs font-bold rounded-full border-2 border-gray-900 ${testResponse.status >= 200 && testResponse.status < 300 ? 'bg-[#4ade80] text-gray-900' : 'bg-[#ff6b6b] text-white'}`}>
															Status: {testResponse.status}
														</span>
													</div>
													
													<div class="bg-[#1e1e1e] rounded-xl border-[3px] border-gray-900 shadow-sm p-6 overflow-hidden">
														<pre class="text-sm font-mono text-[#50fa7b] overflow-x-auto"><code>{JSON.stringify(testResponse.data || testResponse.error, null, 2)}</code></pre>
													</div>

													<!-- Generated Image Preview -->
													{#if testResponse.status === 200 && imageUrl}
														<div class="bg-white rounded-xl border-[3px] border-gray-900 p-4 shadow-[4px_4px_0_0_#1f2937] space-y-4">
															<h4 class="font-bold text-gray-900">Generated Asset</h4>
															<img
																src={imageUrl}
																alt="Generated Result"
																class="w-full rounded-lg border-2 border-gray-200"
															/>
															<div class="flex gap-2">
																<input 
																	type="text" 
																	value={imageUrl} 
																	readonly 
																	class="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-xs font-mono text-gray-600"
																/>
																<button
																	class="px-4 py-2 bg-gray-900 text-white font-bold text-xs rounded-lg hover:bg-gray-800"
																	on:click={() => {
																		navigator.clipboard.writeText(imageUrl);
																		toast.set({ message: 'URL Copied!', duration: 1500 });
																	}}
																>
																	Copy
																</button>
															</div>
														</div>
													{/if}
												</div>
											{/if}
										{/if}
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Signup Prompt Modal -->
{#if showSignupPrompt}
	<div class="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
		<div class="bg-[#FFFDF8] rounded-3xl max-w-md w-full p-8 border-[3px] border-gray-900 shadow-[8px_8px_0_0_#ff6b6b] relative">
			<!-- Decorative elements -->
			<div class="absolute -top-6 -right-6 text-6xl">✨</div>
			
			<h3 class="text-3xl font-black text-gray-900 mb-4">Unlock Creative Power</h3>
			<p class="text-gray-600 font-medium text-lg mb-6">You've reached the limit for guest usage. Join thousands of creators making amazing content.</p>
			
			<div class="space-y-3 mb-8">
				<div class="flex items-center gap-3 text-gray-700 font-bold">
					<div class="w-6 h-6 rounded-full bg-[#4ade80] border-2 border-gray-900 flex items-center justify-center text-xs">✓</div>
					Save unlimited templates
				</div>
				<div class="flex items-center gap-3 text-gray-700 font-bold">
					<div class="w-6 h-6 rounded-full bg-[#4ade80] border-2 border-gray-900 flex items-center justify-center text-xs">✓</div>
					Remove watermarks
				</div>
				<div class="flex items-center gap-3 text-gray-700 font-bold">
					<div class="w-6 h-6 rounded-full bg-[#4ade80] border-2 border-gray-900 flex items-center justify-center text-xs">✓</div>
					API access
				</div>
			</div>

			<div class="space-y-3">
				<a
					href="/signup"
					class="block w-full py-4 bg-gray-900 text-white font-black text-center rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#1f2937] transition-all"
				>
					Create Free Account
				</a>
				<button
					class="block w-full py-3 text-gray-500 font-bold hover:text-gray-900"
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
	:global(body) {
		background-color: #FFFDF8;
	}
</style>