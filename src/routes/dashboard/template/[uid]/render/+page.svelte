<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		getTemplateById,
		getTemplateVariables,
		renderTemplate,
		renderTemplateMultiSize
	} from '../../../../../api/template';
	import { createShareResult } from '../../../../../api/public-templates.js';
	import { getApiToken, createApiToken } from '../../../../../api/user';
	import { user } from '../../../../../store/user.store';
	import { toast } from '../../../../../store/toast.store';
	import Loader from '$lib/components/Loader.svelte';
	import RenderForm from '$lib/components/render/RenderForm.svelte';
	import EmailVerificationRequired from '$lib/components/dashboard/EmailVerificationRequired.svelte';
	import { analytics } from '$lib/analytics.js';
	import ModeTabs from '$lib/components/dashboard/ModeTabs.svelte';
	import CopyAsCode from '$lib/components/render/CopyAsCode.svelte';

	let template = null;
	let variables = [];
	let variableValues = {};
	let isLoading = true;
	let isRendering = false;
	let renderResult = null;
	let renderError = null;

	// Output options
	let selectedFormat = 'png';

	// Image polling/retry state for rendered results
	const IMG_MAX_RETRIES = 10;
	const IMG_RETRY_DELAY = 1500;
	let renderImgState = {}; // { [layout]: { src, loaded, retryCount, timer } }

	function initRenderImgState(results) {
		Object.values(renderImgState).forEach(s => clearTimeout(s.timer));
		const state = {};
		for (const r of results) {
			state[r.layout] = { src: r.url, loaded: false, retryCount: 0, timer: null };
		}
		renderImgState = state;
	}

	function handleRenderImgLoad(layout) {
		if (renderImgState[layout]) {
			renderImgState[layout].loaded = true;
			renderImgState[layout].retryCount = 0;
			renderImgState = { ...renderImgState };
		}
	}

	function handleRenderImgError(layout, originalUrl) {
		const s = renderImgState[layout];
		if (s && s.retryCount < IMG_MAX_RETRIES) {
			s.retryCount++;
			s.timer = setTimeout(() => {
				const sep = originalUrl.includes('?') ? '&' : '?';
				s.src = `${originalUrl}${sep}_r=${s.retryCount}`;
				renderImgState = { ...renderImgState };
			}, IMG_RETRY_DELAY);
		}
	}

	// Layout selection — multi-select (includes 'default' as a selectable key)
	let selectedLayouts = new Set(['default']); // default is pre-selected
	$: templateLayouts = template?.layouts ? Object.entries(template.layouts) : [];
	$: allLayoutKeys = ['default', ...templateLayouts.map(([key]) => key)];
	$: allSelected = allLayoutKeys.length > 0 && allLayoutKeys.every(k => selectedLayouts.has(k));

	function toggleLayout(key) {
		if (selectedLayouts.has(key)) {
			selectedLayouts.delete(key);
		} else {
			selectedLayouts.add(key);
		}
		selectedLayouts = new Set(selectedLayouts);
	}

	function toggleAllLayouts() {
		if (allSelected) {
			// Deselect all — keep only default
			selectedLayouts = new Set(['default']);
		} else {
			// Select all
			selectedLayouts = new Set(allLayoutKeys);
		}
	}

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
		selectedLayouts = new Set(['default']);
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

			// Add layouts if multiple selected (multi-layout render)
			if (templateLayouts.length > 0 && selectedLayouts.size > 1) {
				renderOptions.layouts = [...selectedLayouts];
			} else if (templateLayouts.length > 0 && selectedLayouts.size === 1 && !selectedLayouts.has('default')) {
				// Single non-default layout selected
				renderOptions.layout = [...selectedLayouts][0];
			}

			const result = await renderTemplate(uid, variableValues, renderOptions);

			// Check if this render is still current
			if (thisRenderVersion !== currentRenderVersion) return;

			renderResult = result;
			if (result?.results) initRenderImgState(result.results);

			// Track successful template render
			analytics.trackTemplateRendered({
				template_id: uid,
				format
			});
		} catch (error) {
			// Check if this render is still current
			if (thisRenderVersion !== currentRenderVersion) return;

			renderError = error.message || 'Failed to render template';
			toast.set({ message: renderError, type: 'error', duration: 3000 });

			// Track render error
			analytics.trackRenderError({
				template_id: uid,
				error_message: renderError
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
		const firstResult = renderResult?.results?.[0];
		if (!firstResult?.url) return;

		const link = document.createElement('a');
		link.href = firstResult.url;
		link.download = `${template?.name || 'render'}.${firstResult.format || 'png'}`;
		link.target = '_blank';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Track download
		analytics.trackDownload({
			content_type: 'rendered_image',
			format: firstResult.format || 'png',
			template_id: uid
		});
	};

	let isCopyingUrl = false;
	let cachedShareUrl = null;
	// Reset cached share URL when render result changes
	$: if (renderResult?.results?.[0]?.url) cachedShareUrl = null;

	const copyUrl = async () => {
		const firstResult = renderResult?.results?.[0];
		if (!firstResult?.url) return;
		isCopyingUrl = true;
		try {
			// Create share result if not cached
			if (!cachedShareUrl) {
				const response = await createShareResult({
					assetUrl: firstResult.url,
					contentType: firstResult.format === 'gif' ? 'gif' : 'image',
					width: firstResult.width,
					height: firstResult.height,
					format: firstResult.format || 'png',
					source: 'template',
					templateUid: uid,
					title: template?.name || ''
				});
				if (response.success && response.shareUrl) {
					cachedShareUrl = `${window.location.origin}${response.shareUrl}`;
				}
			}
			const urlToCopy = cachedShareUrl || firstResult.url;
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

		// Build URL-param render URL
		const queryParts = Object.entries(variableValues)
			.filter(([, v]) => v !== '' && v !== undefined)
			.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
		const urlParamUrl = `${backendUrl}/r/${uid}.${format}?token=YOUR_API_TOKEN${
			queryParts.length ? '&' + queryParts.join('&') : ''
		}`;

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
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="3"
						d="M15 19l-7-7 7-7"
					/></svg
				>
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
				<div
					class="px-2 py-1 bg-[#4ecdc4] text-white border-[2px] border-gray-900 rounded text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000]"
				>
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
					<div
						class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden"
					>
						<!-- Card Header -->
						<div
							class="bg-gray-50 border-b-[3px] border-gray-900 px-6 py-4 flex items-center justify-between"
						>
							<h2
								class="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"
							>
								<span class="w-3 h-3 bg-[#ffc480] border-2 border-gray-900 rounded-full" />
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
					<div
						class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden"
					>
						<div class="bg-gray-50 border-b-[3px] border-gray-900 px-6 py-4">
							<h3
								class="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"
							>
								<span class="w-3 h-3 bg-[#a78bfa] border-2 border-gray-900 rounded-full" />
								Output Options
							</h3>
						</div>
						<div class="p-6 space-y-5">
							<!-- Format selector -->
							<div class="space-y-2">
								<label class="block text-xs font-black text-gray-900 uppercase tracking-wide"
									>Format</label
								>
								<div class="flex gap-2">
									{#each ['png', 'jpeg', 'webp'] as fmt}
										<button
											class="flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg border-[3px] transition-all {selectedFormat ===
											fmt
												? 'bg-gray-900 text-white border-gray-900 shadow-[2px_2px_0_0_#9ca3af]'
												: 'bg-white text-gray-600 border-gray-300 hover:border-gray-900'}"
											on:click={() => (selectedFormat = fmt)}
										>
											{fmt}
										</button>
									{/each}
								</div>
							</div>

							<!-- Layout selector (only show when template has layouts) -->
							{#if templateLayouts.length > 0}
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<label class="block text-xs font-black text-gray-900 uppercase tracking-wide"
											>Layouts to Render</label
										>
										<button
											class="text-[10px] font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wider transition-colors"
											on:click={toggleAllLayouts}
										>
											{allSelected ? 'Deselect All' : 'Select All'}
										</button>
									</div>
									<p class="text-[10px] text-gray-500">{selectedLayouts.size} of {allLayoutKeys.length} selected</p>
									<div class="grid grid-cols-2 gap-2">
										<!-- Default layout -->
										<button
											class="text-left px-3 py-2.5 rounded-lg border-[3px] transition-all {selectedLayouts.has('default')
												? 'bg-[#ffc480]/20 border-gray-900 shadow-[2px_2px_0_0_#1f2937]'
												: 'bg-white border-gray-200 hover:border-gray-900'}"
											on:click={() => toggleLayout('default')}
										>
											<div class="flex items-center gap-2">
												<div class="w-4 h-4 border-2 border-gray-400 rounded flex items-center justify-center flex-shrink-0
													{selectedLayouts.has('default') ? 'bg-gray-900 border-gray-900' : ''}">
													{#if selectedLayouts.has('default')}
														<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
															<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
														</svg>
													{/if}
												</div>
												<div>
													<span class="block text-xs font-black text-gray-900 leading-tight">Default</span>
													<span class="block text-[10px] font-bold text-gray-500 font-mono"
														>{template.width}x{template.height}</span
													>
												</div>
											</div>
										</button>
										<!-- Other layouts -->
										{#each templateLayouts as [key, layout]}
											<button
												class="text-left px-3 py-2.5 rounded-lg border-[3px] transition-all {selectedLayouts.has(key)
													? 'bg-[#ffc480]/20 border-gray-900 shadow-[2px_2px_0_0_#1f2937]'
													: 'bg-white border-gray-200 hover:border-gray-900'}"
												on:click={() => toggleLayout(key)}
											>
												<div class="flex items-center gap-2">
													<div class="w-4 h-4 border-2 border-gray-400 rounded flex items-center justify-center flex-shrink-0
														{selectedLayouts.has(key) ? 'bg-gray-900 border-gray-900' : ''}">
														{#if selectedLayouts.has(key)}
															<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
																<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
															</svg>
														{/if}
													</div>
													<div>
														<span class="block text-xs font-black text-gray-900 leading-tight"
															>{layout.name || key}</span
														>
														<span class="block text-[10px] font-bold text-gray-500 font-mono"
															>{layout.width}x{layout.height}</span
														>
													</div>
												</div>
											</button>
										{/each}
									</div>
								</div>
							{/if}

							</div>
					</div>

					<!-- API Key Selection -->
					<div
						class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden"
					>
						<div class="bg-gray-50 border-b-[3px] border-gray-900 px-6 py-4">
							<h3
								class="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"
							>
								<span class="w-3 h-3 bg-[#60a5fa] border-2 border-gray-900 rounded-full" />
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
												<svg
													class="w-4 h-4 text-gray-900"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													><path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="3"
														d="M19 9l-7 7-7-7"
													/></svg
												>
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
													<circle
														class="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														stroke-width="4"
													/>
													<path
														class="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													/>
												</svg>
											{:else}
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="3"
														d="M12 4v16m8-8H4"
													/>
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
													<circle
														class="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														stroke-width="4"
													/>
													<path
														class="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													/>
												</svg>
												Generating...
											{:else}
												<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2.5"
														d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
													/>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2.5"
														d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
													/>
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
								<div
									class="bg-amber-50 border-[3px] border-amber-200 border-dashed rounded-lg p-6 text-center"
								>
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
												<circle
													class="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													stroke-width="4"
												/>
												<path
													class="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												/>
											</svg>
											Creating...
										{:else}
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2.5"
													d="M12 4v16m8-8H4"
												/>
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
					<div
						class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden sticky top-32"
					>
						<div
							class="bg-gray-50 border-b-[3px] border-gray-900 px-6 py-4 flex items-center justify-between"
						>
							<h2
								class="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"
							>
								<span class="w-3 h-3 bg-[#4ade80] border-2 border-gray-900 rounded-full" />
								Live Preview
							</h2>
							<div class="flex gap-1">
								<div class="w-2 h-2 rounded-full bg-gray-300" />
								<div class="w-2 h-2 rounded-full bg-gray-300" />
								<div class="w-2 h-2 rounded-full bg-gray-300" />
							</div>
						</div>

						<div class="p-6">
							<!-- Loading state -->
							{#if isRendering}
								<div class="flex items-center justify-center py-12">
									<div class="flex items-center gap-3">
										<div class="w-5 h-5 border-[3px] border-gray-400 border-t-transparent rounded-full animate-spin" />
										<span class="text-sm font-bold text-gray-500 uppercase tracking-wide">Rendering...</span>
									</div>
								</div>
							{:else if renderError}
								<div class="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
									<p class="text-sm font-bold text-red-700">{renderError}</p>
								</div>
							{:else if renderResult?.results}
								<div class="space-y-4">
									{#each renderResult.results as layoutResult}
									{@const imgState = renderImgState[layoutResult.layout] || { src: layoutResult.url, loaded: false }}
										<div class="border-2 border-gray-200 rounded-lg overflow-hidden">
											<div class="flex items-center justify-between px-4 py-2 bg-gray-50 border-b-2 border-gray-200">
												<div>
													<span class="text-xs font-black text-gray-900">{layoutResult.name}</span>
													<span class="text-[10px] text-gray-500 ml-2 font-mono">{layoutResult.width}x{layoutResult.height}</span>
												</div>
												{#if imgState.loaded}
													<div class="flex items-center gap-2">
														<button
															class="text-[10px] font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wider"
															on:click={() => {
																navigator.clipboard.writeText(layoutResult.url);
																toast.set({ message: 'URL copied!', type: 'success', duration: 1500 });
															}}
														>
															Copy URL
														</button>
														<a
															href={layoutResult.url}
															download="{uid}-{layoutResult.layout}.{layoutResult.format || 'png'}"
															class="text-[10px] font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wider"
														>
															Download
														</a>
													</div>
												{/if}
											</div>
											<div class="p-3 bg-[#e5e5e5] flex items-center justify-center" style="min-height: 120px;">
												{#if !imgState.loaded}
													<div class="flex items-center gap-2 py-6">
														<div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
														<span class="text-xs font-bold text-gray-500 uppercase">Loading image...</span>
													</div>
												{/if}
												<img
													src={imgState.src}
													alt="{layoutResult.name} render"
													class="max-w-full max-h-[300px] object-contain border border-gray-300 bg-white"
													class:hidden={!imgState.loaded}
													on:load={() => handleRenderImgLoad(layoutResult.layout)}
													on:error={() => handleRenderImgError(layoutResult.layout, layoutResult.url)}
												/>
											</div>
										</div>
									{/each}

									{#if renderResult.errors?.length > 0}
										<div class="p-3 bg-red-50 border-2 border-red-200 rounded-lg">
											<p class="text-xs font-bold text-red-700">
												{renderResult.totalErrors} layout{renderResult.totalErrors > 1 ? 's' : ''} failed to render:
											</p>
											{#each renderResult.errors as err}
												<p class="text-xs text-red-600 mt-1">{err.layout}: {err.error}</p>
											{/each}
										</div>
									{/if}

									<!-- Copy as Code for the first result -->
									{#if renderResult.results.length > 0}
										<div class="flex justify-end">
											<CopyAsCode
												imageUrl={renderResult.results[0].url}
												templateUid={uid}
												variables={variableValues}
												format={selectedFormat}
												apiKey={selectedApiKey}
											/>
										</div>
									{/if}
								</div>
							{:else}
								<!-- Empty state: no render yet -->
								<div class="flex flex-col items-center justify-center py-12 text-center">
									{#if template?.thumbnail}
										<img
											src={template.thumbnail}
											alt="Template preview"
											class="max-w-full max-h-[200px] object-contain border-2 border-gray-200 rounded-lg mb-4 opacity-60"
										/>
									{/if}
									<p class="text-sm font-bold text-gray-400 uppercase tracking-wide">
										Fill in variables and click Render
									</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>
