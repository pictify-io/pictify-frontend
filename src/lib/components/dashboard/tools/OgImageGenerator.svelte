<script>
	import { onMount } from 'svelte';
	import { getTemplate } from '../../../../api/tools/og-image';
	import { user } from '../../../../store/user.store';
	import { toast } from '../../../../store/toast.store';
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
	user.subscribe(userData => {
		isUserLoggedIn = !!userData.email;
	});

	// Component state
	let isLoading = true;
	let isLoadingSaved = false;
	let activeTab = 'templates'; // templates, saved, recent
	let defaultTemplatesList = [];
	let savedTemplates = [];
	let recentTemplates = [];
	let selectedTemplate = null;
	let showEditor = false;

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
			} else if (ogImageTemplates.length > 0) {
				savedTemplates = ogImageTemplates;
			} else {
				savedTemplates = [];
			}
			
			console.log('Final saved templates:', savedTemplates);
		} catch (error) {
			console.error('Error loading saved templates:', error);
			toast.set({ message: 'Failed to load saved templates', duration: 1500 });
			savedTemplates = [];
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

	onMount(async () => {
		await loadDefaultTemplates();
		if (isUserLoggedIn) {
			await loadSavedTemplates();
		}
	});

	// Reload saved templates when user logs in/out
	user.subscribe(async (userData) => {
		if (userData?.email) {
			await loadSavedTemplates();
		} else {
			savedTemplates = [];
		}
	});

	// Subscribe to templates store
	templatesStore.subscribe((storeTemplates) => {
		console.log('Template store updated:', storeTemplates);
		if (activeTab === 'saved' && storeTemplates && storeTemplates.length > 0) {
			const ogImageTemplates = storeTemplates.filter(t => t.type === 'og-image');
			if (ogImageTemplates.length > 0) {
				savedTemplates = ogImageTemplates;
				console.log('Updated saved templates from store:', savedTemplates);
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
			class="px-4 py-2 font-medium {activeTab === 'recent' ? 'bg-black text-white' : 'text-gray-700 hover:text-gray-900'}"
			on:click={() => activeTab = 'recent'}
		>
			Recent
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
			<!-- Editor Area -->
			{#if showEditor}
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
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					{#if activeTab === 'templates'}
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
					{:else if activeTab === 'saved' && isUserLoggedIn}
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
					{:else if activeTab === 'recent'}
						{#if recentTemplates.length === 0}
							<div class="text-center mt-20 col-span-3">
								<div class="mb-5 text-lg font-bold">No Recent Designs</div>
								<div class="mb-3 text-lg font-light">Your recent designs will appear here</div>
							</div>
						{:else}
							{#each recentTemplates as recent}
								<div class="border rounded-lg overflow-hidden relative group">
									<OgImageTemplate 
										html={recent.template} 
										width={1200} 
										height={630} 
										scale={0.3} 
									/>
									<div 
										class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center cursor-pointer"
										on:click={() => handleTemplateSelect(recent.template)}
										on:keydown={(e) => {
											if (e.key === 'Enter') handleTemplateSelect(recent.template);
										}}
										role="button"
										tabindex="0"
									>
										<div class="flex flex-col items-center gap-2">
											<button class="opacity-0 group-hover:opacity-100 bg-black text-white px-6 py-2 rounded-md transform translate-y-2 group-hover:translate-y-0 transition-all">
												Use Template
											</button>
											{#if recent.imageUrl}
												<button 
													class="opacity-0 group-hover:opacity-100 bg-white text-black px-6 py-2 rounded-md transform translate-y-2 group-hover:translate-y-0 transition-all"
													on:click|stopPropagation={() => {
														navigator.clipboard.writeText(recent.imageUrl);
														toast.set({ message: 'URL copied to clipboard', duration: 1500 });
													}}
												>
													Copy URL
												</button>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						{/if}
					{/if}
				</div>
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