<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getTemplateById, getTemplateVariables, renderTemplate, renderTemplateMultiSize } from '../../../../../api/template';
	import { createShareResult } from '../../../../../api/public-templates.js';
	import { getApiToken, createApiToken } from '../../../../../api/user';
	import { user } from '../../../../../store/user.store';
	import { toast } from '../../../../../store/toast.store';
	import Loader from '$lib/components/Loader.svelte';
	import RenderForm from '$lib/components/render/RenderForm.svelte';
	import RenderPreview from '$lib/components/render/RenderPreview.svelte';
	import EmailVerificationRequired from '$lib/components/dashboard/EmailVerificationRequired.svelte';
	import { analytics } from '$lib/analytics.js';
	import ModeTabs from '$lib/components/dashboard/ModeTabs.svelte';

	let template = null;
	let variables = [];
	let variableValues = {};
	let isLoading = true;
	let isRendering = false;
	let renderResult = null;
	let renderError = null;

	// Output options
	let selectedFormat = 'png';
	let sizeMode = 'original'; // 'original' | 'preset' | 'custom'
	let customWidth = '';
	let customHeight = '';
	let selectedPreset = '';

	const PLATFORM_PRESETS = [
		{ id: 'instagram-post', width: 1080, height: 1080, label: 'Instagram Post' },
		{ id: 'instagram-story', width: 1080, height: 1920, label: 'Instagram Story' },
		{ id: 'facebook-post', width: 1200, height: 630, label: 'Facebook Post' },
		{ id: 'linkedin-post', width: 1200, height: 627, label: 'LinkedIn Post' },
		{ id: 'twitter-post', width: 1024, height: 512, label: 'Twitter/X Post' },
		{ id: 'youtube-thumbnail', width: 1280, height: 720, label: 'YouTube Thumbnail' },
		{ id: 'og-image', width: 1200, height: 630, label: 'OG Image' },
		{ id: 'pinterest-pin', width: 1000, height: 1500, label: 'Pinterest Pin' },
	];

	$: activePreset = PLATFORM_PRESETS.find(p => p.id === selectedPreset);

	// API Key state
	let apiTokens = [];
	let selectedApiKey = '';
	let isCreatingToken = false;

	// Email verification state
	$: isEmailVerified = $user?.isEmailVerified;
	$: userEmail = $user?.email || '';

	// Race condition prevention
	let renderInProgress = false;
	let currentRenderVersion = 0;
	let currentLoadVersion = 0;

	$: uid = $page.params.uid;

	// Re-load when UID changes (handles SvelteKit component reuse on route param change)
	$: if (uid) {
		// Reset state for new template to prevent showing stale data
		template = null;
		variables = [];
		variableValues = {};
		renderResult = null;
		renderError = null;
		selectedFormat = 'png';
		sizeMode = 'original';
		customWidth = '';
		customHeight = '';
		selectedPreset = '';
		// Load fresh data
		loadTemplate();
		// Track page view
		analytics.trackDashboardPage({ page_name: 'template_render', template_id: uid });
	}

	const loadTemplate = async () => {
		const thisLoadVersion = ++currentLoadVersion;
		isLoading = true;

		try {
			const [templateRes, variablesRes, tokensRes] = await Promise.all([
				getTemplateById(uid),
				getTemplateVariables(uid),
				getApiToken()
			]);

			// Check if this load is still current
			if (thisLoadVersion !== currentLoadVersion) return;

			if (!templateRes?.template) {
				toast.set({ message: 'Template not found', type: 'error', duration: 3000 });
				goto('/dashboard/template');
				return;
			}

			template = templateRes.template;
			variables = variablesRes?.variables || [];
			apiTokens = tokensRes?.apiTokens || [];

			// Auto-select the first token if available
			if (apiTokens.length > 0 && !selectedApiKey) {
				selectedApiKey = apiTokens[0].token;
			}

			// Initialize variable values with defaults
			variableValues = {};
			for (const v of variables) {
				variableValues[v.name] = v.defaultValue || '';
			}
		} catch (error) {
			// Check if this load is still current
			if (thisLoadVersion !== currentLoadVersion) return;

			console.error('Error loading template:', error);
			toast.set({ message: 'Failed to load template', type: 'error', duration: 3000 });
		} finally {
			if (thisLoadVersion === currentLoadVersion) {
				isLoading = false;
			}
		}
	};

	const handleRender = async () => {
		// Require API key
		if (!selectedApiKey) {
			toast.set({ message: 'Please select an API key to render', type: 'error', duration: 3000 });
			return;
		}

		// Double-click protection
		if (renderInProgress) return;
		renderInProgress = true;

		const thisRenderVersion = ++currentRenderVersion;
		isRendering = true;
		renderError = null;

		try {
			const format = template?.outputFormat === 'pdf' ? 'pdf' : selectedFormat;
			const renderOptions = {
				format,
				quality: 0.9,
				apiKey: selectedApiKey
			};

			// Add dimension overrides based on size mode
			if (sizeMode === 'preset' && activePreset) {
				renderOptions.width = activePreset.width;
				renderOptions.height = activePreset.height;
			} else if (sizeMode === 'custom' && customWidth && customHeight) {
				renderOptions.width = parseInt(customWidth, 10);
				renderOptions.height = parseInt(customHeight, 10);
			}

			const result = await renderTemplate(uid, variableValues, renderOptions);

			// Check if this render is still current
			if (thisRenderVersion !== currentRenderVersion) return;

			renderResult = result;

			// Track successful template render
			analytics.trackTemplateRendered({
				template_id: uid,
				format,
			});
		} catch (error) {
			// Check if this render is still current
			if (thisRenderVersion !== currentRenderVersion) return;

			console.error('Render error:', error);
			renderError = error.message || 'Failed to render template';
			toast.set({ message: renderError, type: 'error', duration: 3000 });

			// Track render error
			analytics.trackRenderError({
				template_id: uid,
				error_message: renderError,
			});
		} finally {
			if (thisRenderVersion === currentRenderVersion) {
				isRendering = false;
				renderInProgress = false;
			}
		}
	};

	const handleCreateToken = async () => {
		// Early guard to prevent double-clicks
		if (isCreatingToken) return;
		isCreatingToken = true;
		try {
			const result = await createApiToken();
			if (result?.apiToken) {
				apiTokens = [...apiTokens, result.apiToken];
				selectedApiKey = result.apiToken.token;
				toast.set({ message: 'API key created', type: 'success', duration: 2000 });
			}
		} catch (error) {
			toast.set({ message: 'Failed to create API key', type: 'error', duration: 3000 });
		} finally {
			isCreatingToken = false;
		}
	};

	const handleVariableChange = (event) => {
		const { name, value } = event.detail;
		variableValues = { ...variableValues, [name]: value };
	};

	const handleJsonImport = (event) => {
		const { values } = event.detail;
		variableValues = { ...variableValues, ...values };
	};

	const handleDownload = () => {
		if (!renderResult?.url) return;

		const link = document.createElement('a');
		link.href = renderResult.url;
		link.download = `${template?.name || 'render'}.${renderResult.format || 'png'}`;
		link.target = '_blank';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Track download
		analytics.trackDownload({
			content_type: 'rendered_image',
			format: renderResult.format || 'png',
			template_id: uid,
		});
	};

	let isCopyingUrl = false;
	let cachedShareUrl = null;
	// Reset cached share URL when render result changes
	$: if (renderResult?.url) cachedShareUrl = null;

	const copyUrl = async () => {
		if (!renderResult?.url) return;
		isCopyingUrl = true;
		try {
			// Create share result if not cached
			if (!cachedShareUrl) {
				const response = await createShareResult({
					assetUrl: renderResult.url,
					contentType: renderResult.format === 'gif' ? 'gif' : 'image',
					width: renderResult.width,
					height: renderResult.height,
					format: renderResult.format || 'png',
					source: 'template',
					templateUid: uid,
					title: template?.name || '',
				});
				if (response.success && response.shareUrl) {
					cachedShareUrl = `${window.location.origin}${response.shareUrl}`;
				}
			}
			const urlToCopy = cachedShareUrl || renderResult.url;
			await navigator.clipboard.writeText(urlToCopy);
			toast.set({ message: 'Share link copied to clipboard', type: 'success', duration: 2000 });

			// Track copy
			analytics.trackCopy({ content_type: 'url', context: 'template_render' });
		} catch (e) {
			// Fallback to CDN URL if share creation fails
			await navigator.clipboard.writeText(renderResult.url);
			toast.set({ message: 'URL copied to clipboard', type: 'success', duration: 2000 });
		} finally {
			isCopyingUrl = false;
		}
	};

	const generateApiCode = () => {
		const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
		const format = template?.outputFormat === 'pdf' ? 'pdf' : selectedFormat;

		// Build body object
		const body = {
			variables: variableValues,
			format,
			quality: 0.9
		};
		if (sizeMode === 'preset' && activePreset) {
			body.width = activePreset.width;
			body.height = activePreset.height;
		} else if (sizeMode === 'custom' && customWidth && customHeight) {
			body.width = parseInt(customWidth, 10);
			body.height = parseInt(customHeight, 10);
		}

		// Build URL-param render URL
		const queryParts = Object.entries(variableValues)
			.filter(([, v]) => v !== '' && v !== undefined)
			.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
		const urlParamUrl = `${backendUrl}/r/${uid}.${format}?token=YOUR_API_TOKEN${queryParts.length ? '&' + queryParts.join('&') : ''}`;

		const code = `// === Option 1: POST API (full control) ===
const response = await fetch('${backendUrl}/templates/${uid}/render', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_TOKEN'
  },
  body: JSON.stringify(${JSON.stringify(body, null, 4)})
});
const result = await response.json();
console.log(result.url); // CDN URL of rendered image

// === Option 2: URL Parameter Render (for <img> tags & emails) ===
// Returns binary image directly — use as an img src:
// <img src="${urlParamUrl}" />`;

		navigator.clipboard.writeText(code);
		toast.set({ message: 'API code copied to clipboard', type: 'success', duration: 2000 });

		// Track copy
		analytics.trackCopy({ content_type: 'code', context: 'api_snippet' });
	};

	// Note: loadTemplate is called reactively when uid changes (see reactive statement above)
	// onMount is no longer needed for initial load since the reactive $: if (uid) handles it

	onDestroy(() => {
		// Invalidate any in-flight loads and renders
		currentLoadVersion++;
		currentRenderVersion++;
	});
</script>

<section class="min-h-full pb-12">
	
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
		<div>
			<button
				class="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:underline flex items-center gap-1 transition-colors mb-2"
				on:click={() => goto('/dashboard/template')}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
				Back to Templates
			</button>
			
			<div class="flex items-center gap-3">
				<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
					{#if template}
						{template.name}
					{:else}
						Loading...
					{/if}
				</h1>
				<div class="px-2 py-1 bg-[#4ecdc4] text-white border-[2px] border-gray-900 rounded text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000]">
					Render Mode
				</div>
			</div>
			<p class="text-gray-600 font-bold mt-2 text-sm sm:text-base max-w-2xl">
				Test your template with custom variables and generate instant previews.
			</p>
		</div>

		<!-- Mode Tabs -->
		<ModeTabs activeMode="render" {uid} />
	</div>

	<div>
		{#if isLoading}
			<div class="flex items-center justify-center py-32">
				<Loader size="16" show={true} />
			</div>
		{:else if template}
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
				
				<!-- Left: Variable Form -->
				<div class="lg:col-span-5 flex flex-col gap-6">
					<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
						<!-- Card Header -->
						<div class="bg-gray-50 border-b-[3px] border-gray-900 px-6 py-4 flex items-center justify-between">
							<h2 class="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
								<span class="w-3 h-3 bg-[#ffc480] border-2 border-gray-900 rounded-full"></span>
								Variables
							</h2>
						</div>

						<div class="p-6">
							<RenderForm
								{variables}
								{variableValues}
								on:change={handleVariableChange}
								on:jsonImport={handleJsonImport}
							/>
						</div>
					</div>

					<!-- Output Options -->
					<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
						<div class="bg-gray-50 border-b-[3px] border-gray-900 px-6 py-4">
							<h3 class="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
								<span class="w-3 h-3 bg-[#a78bfa] border-2 border-gray-900 rounded-full"></span>
								Output Options
							</h3>
						</div>
						<div class="p-6 space-y-5">
							<!-- Format selector -->
							<div class="space-y-2">
								<label class="block text-xs font-black text-gray-900 uppercase tracking-wide">Format</label>
								<div class="flex gap-2">
									{#each ['png', 'jpeg', 'webp'] as fmt}
										<button
											class="flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg border-[3px] transition-all {selectedFormat === fmt ? 'bg-gray-900 text-white border-gray-900 shadow-[2px_2px_0_0_#9ca3af]' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-900'}"
											on:click={() => selectedFormat = fmt}
										>
											{fmt}
										</button>
									{/each}
								</div>
							</div>

							<!-- Size mode -->
							<div class="space-y-2">
								<label class="block text-xs font-black text-gray-900 uppercase tracking-wide">Size</label>
								<div class="flex gap-2">
									<button
										class="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg border-[3px] transition-all {sizeMode === 'original' ? 'bg-gray-900 text-white border-gray-900 shadow-[2px_2px_0_0_#9ca3af]' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-900'}"
										on:click={() => { sizeMode = 'original'; selectedPreset = ''; }}
									>
										Original
									</button>
									<button
										class="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg border-[3px] transition-all {sizeMode === 'preset' ? 'bg-gray-900 text-white border-gray-900 shadow-[2px_2px_0_0_#9ca3af]' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-900'}"
										on:click={() => { sizeMode = 'preset'; }}
									>
										Preset
									</button>
									<button
										class="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg border-[3px] transition-all {sizeMode === 'custom' ? 'bg-gray-900 text-white border-gray-900 shadow-[2px_2px_0_0_#9ca3af]' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-900'}"
										on:click={() => { sizeMode = 'custom'; selectedPreset = ''; }}
									>
										Custom
									</button>
								</div>
							</div>

							<!-- Preset grid -->
							{#if sizeMode === 'preset'}
								<div class="grid grid-cols-2 gap-2">
									{#each PLATFORM_PRESETS as preset}
										<button
											class="text-left px-3 py-2.5 rounded-lg border-[3px] transition-all {selectedPreset === preset.id ? 'bg-[#4ecdc4]/10 border-[#4ecdc4] shadow-[2px_2px_0_0_#0d9488]' : 'bg-white border-gray-200 hover:border-gray-900'}"
											on:click={() => selectedPreset = preset.id}
										>
											<span class="block text-xs font-black text-gray-900 leading-tight">{preset.label}</span>
											<span class="block text-[10px] font-bold text-gray-500 font-mono">{preset.width}x{preset.height}</span>
										</button>
									{/each}
								</div>
							{/if}

							<!-- Custom dimensions -->
							{#if sizeMode === 'custom'}
								<div class="flex gap-3 items-center">
									<input
										type="number"
										bind:value={customWidth}
										placeholder="Width"
										min="10"
										max="4096"
										class="flex-1 px-4 py-3 border-[3px] border-gray-900 rounded-lg text-sm font-bold font-mono focus:outline-none focus:shadow-[4px_4px_0_0_#a78bfa] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all placeholder-gray-400"
									/>
									<span class="text-gray-400 font-black text-lg">x</span>
									<input
										type="number"
										bind:value={customHeight}
										placeholder="Height"
										min="10"
										max="4096"
										class="flex-1 px-4 py-3 border-[3px] border-gray-900 rounded-lg text-sm font-bold font-mono focus:outline-none focus:shadow-[4px_4px_0_0_#a78bfa] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all placeholder-gray-400"
									/>
								</div>
								<p class="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Min 10px, Max 4096px</p>
							{/if}
						</div>
					</div>

					<!-- API Key Selection -->
					<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
						<div class="bg-gray-50 border-b-[3px] border-gray-900 px-6 py-4">
							<h3 class="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
								<span class="w-3 h-3 bg-[#60a5fa] border-2 border-gray-900 rounded-full"></span>
								Authentication
							</h3>
						</div>
						
						<div class="p-6">
							{#if apiTokens.length > 0}
								<div class="flex flex-col gap-4">
									<div class="flex gap-2">
										<div class="relative flex-1">
											<select
												bind:value={selectedApiKey}
												class="w-full pl-4 pr-10 py-3 bg-white border-[3px] border-gray-900 rounded-lg text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#60a5fa] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all appearance-none truncate"
											>
												{#each apiTokens as token}
													<option value={token.token}>
														{token.name || 'API Key'} (..{token.token.slice(-4)})
													</option>
												{/each}
											</select>
											<div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
												<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
											</div>
										</div>
										<button
											type="button"
											class="px-4 py-3 bg-gray-100 hover:bg-gray-200 border-[3px] border-gray-900 rounded-lg text-gray-900 font-bold transition-colors disabled:opacity-50"
											on:click={handleCreateToken}
											disabled={isCreatingToken}
											title="Create new API key"
										>
											{#if isCreatingToken}
												<svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
													<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
													<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
											{:else}
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/>
												</svg>
											{/if}
										</button>
									</div>

									{#if isEmailVerified === false}
										<EmailVerificationRequired email={userEmail} feature="template rendering" />
									{:else}
										<button
											class="w-full bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-black py-4 px-6 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-200 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
											on:click={handleRender}
											disabled={isRendering || !selectedApiKey}
									>
										{#if isRendering}
											<svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Generating...
										{:else}
											<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
											</svg>
											Render Image
										{/if}
									</button>

									<button
										class="text-xs font-bold text-gray-500 hover:text-gray-900 underline uppercase tracking-wider text-center"
										on:click={generateApiCode}
									>
										View API Request Code
									</button>
									{/if}
								</div>
							{:else}
								<div class="bg-amber-50 border-[3px] border-amber-200 border-dashed rounded-lg p-6 text-center">
									<p class="text-sm font-bold text-amber-800 mb-4">
										An API key is required to render images.
									</p>
									<button
										type="button"
										class="w-full bg-amber-400 hover:bg-amber-500 text-black font-black py-3 px-4 rounded-lg border-[3px] border-black shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
										on:click={handleCreateToken}
										disabled={isCreatingToken}
									>
										{#if isCreatingToken}
											<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Creating...
										{:else}
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
											</svg>
											Create New API Key
										{/if}
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Right: Preview -->
				<div class="lg:col-span-7">
					<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden sticky top-32">
						<div class="bg-gray-50 border-b-[3px] border-gray-900 px-6 py-4 flex items-center justify-between">
							<h2 class="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
								<span class="w-3 h-3 bg-[#4ade80] border-2 border-gray-900 rounded-full"></span>
								Live Preview
							</h2>
							<div class="flex gap-1">
								<div class="w-2 h-2 rounded-full bg-gray-300"></div>
								<div class="w-2 h-2 rounded-full bg-gray-300"></div>
								<div class="w-2 h-2 rounded-full bg-gray-300"></div>
							</div>
						</div>

						<div class="p-6">
							<RenderPreview
								{renderResult}
								{renderError}
								{isRendering}
								{isCopyingUrl}
								templateThumbnail={template?.thumbnail}
								on:download={handleDownload}
								on:copyUrl={copyUrl}
							/>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>
