<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';
	import NextSteps from '$lib/components/tools/NextSteps.svelte';
	import ExitIntentPopup from '$lib/components/tools/ExitIntentPopup.svelte';
	import GenerationLimitBanner from '$lib/components/tools/GenerationLimitBanner.svelte';
	import { page } from '$app/stores';
	import {
		useCases,
		useCaseDetails,
		formats,
		popularSizes,
		baseFormatUrl,
		sizeUrl,
		parseSize
	} from '$lib/pseo/config.js';
	import { getTemplateForUseCase } from '$lib/pseo/useCaseTemplates.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { user } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';
	import { generationLimits } from '../../../store/generationLimits.store';
	import { pageActions } from '../../../store/pages.store';
	import backend from '../../../service/backend';

	// User login state
	let isUserLoggedIn = false;
	user.subscribe((userData) => {
		isUserLoggedIn = !!userData?.email;
	});

	$: useCaseId = $page.params.usecase;
	$: config = useCaseDetails[useCaseId];
	$: useCase = config ? useCases.find((u) => u.id === useCaseId) : null;
	$: validCase = !!useCase;
	$: title = validCase ? `${config.label} | Pictify.io` : 'Use Case | Pictify.io';
	$: description = validCase
		? config.description
		: 'Convert HTML to images instantly with Pictify.io.';
	$: canonical = validCase ? `https://pictify.io/tools/${useCaseId}` : 'https://pictify.io/tools';

	// Generation state
	let isGenerating = false;
	let generatedImageUrl = '';
	let generationError = '';

	function openInCanvasEditor() {
		if (!validCase) return;
		const label = config?.label || useCase?.label || useCaseId;
		const templateData = getTemplateForUseCase(useCaseId, label);

		// Ensure template is set to image format (not PDF)
		const template = {
			...templateData,
			outputFormat: 'image'
		};

		// Initialize the pages store with template data
		pageActions.initFromTemplate(template);

		// Also save to localStorage for CreateTemplate compatibility
		try {
			const DRAFT_KEY = 'pictify_template_draft_v1';
			localStorage.setItem(DRAFT_KEY, JSON.stringify(template));
		} catch (e) {
			console.warn('Could not save draft to localStorage:', e);
		}

		if ($user?.email) {
			// Logged in users go directly to image editor
			goto('/template-workspace/image/create');
		} else {
			goto(`/canvas/try?usecase=${useCaseId}`);
		}
	}

	// Quick generate from template
	// Uses public endpoint (no auth required, rate limited)
	async function handleQuickGenerate() {
		if (!template?.fabricJSData) {
			toast.set({ message: 'No template data available', type: 'error', duration: 2000 });
			return;
		}

		// Track generation in global limits store
		generationLimits.increment();
		isGenerating = true;
		generationError = '';
		generatedImageUrl = '';

		try {
			// Use public canvas endpoint (no auth required, rate limited)
			// Request watermark for non-logged-in users
			const response = await backend.post('/image/public/canvas', {
				fabricJSData: template.fabricJSData,
				width: templateWidth,
				height: templateHeight,
				fileExtension: 'png',
				watermark: !isUserLoggedIn // Request watermark for guests
			});

			if (response?.url) {
				generatedImageUrl = response.url;
				toast.set({ message: 'Image generated successfully!', type: 'success', duration: 2000 });
			} else {
				throw new Error('No image URL in response');
			}
		} catch (e) {
			console.error('Generation failed:', e);
			// Handle rate limit error
			if (e.message?.includes('rate') || e.status === 429) {
				generationError = 'Too many requests. Please wait a moment and try again.';
			} else {
				generationError = e.message || 'Failed to generate image';
			}
			toast.set({ message: generationError, type: 'error', duration: 3000 });
		} finally {
			isGenerating = false;
		}
	}

	// Template preview generation
	let previewCanvasEl;
	let fabricCanvas;
	let previewLoading = true;

	$: template = validCase ? getTemplateForUseCase(useCaseId, config?.label || useCaseId) : null;
	$: templateWidth = template?.width || 1200;
	$: templateHeight = template?.height || 630;

	onMount(async () => {
		if (template?.fabricJSData) {
			await loadFabricAndRenderPreview();
		}
	});

	async function loadFabricAndRenderPreview() {
		previewLoading = true;
		try {
			// Dynamically load FabricJS
			if (!window.fabric) {
				await new Promise((resolve, reject) => {
					const script = document.createElement('script');
					script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';
					script.onload = resolve;
					script.onerror = reject;
					document.head.appendChild(script);
				});
			}

			// Wait for the canvas element to be available
			await new Promise((resolve) => setTimeout(resolve, 100));

			if (previewCanvasEl && window.fabric) {
				// Calculate scale to fit container (max width ~600px for nice display)
				const maxWidth = 600;
				const scale = Math.min(1, maxWidth / templateWidth);
				const displayWidth = templateWidth * scale;
				const displayHeight = templateHeight * scale;

				// Set canvas size
				previewCanvasEl.width = displayWidth;
				previewCanvasEl.height = displayHeight;

				// Create FabricJS canvas
				fabricCanvas = new window.fabric.StaticCanvas(previewCanvasEl);
				fabricCanvas.setWidth(displayWidth);
				fabricCanvas.setHeight(displayHeight);

				// Load the JSON data
				fabricCanvas.loadFromJSON(template.fabricJSData, () => {
					// Scale all objects to fit
					fabricCanvas.setZoom(scale);
					fabricCanvas.renderAll();
					previewLoading = false;
				});
			}
		} catch (err) {
			console.error('Failed to load FabricJS preview:', err);
			previewLoading = false;
		}
	}

	// Escape HTML for code display
	function escapeHtml(source) {
		return source
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function highlightCurl(source) {
		const escaped = escapeHtml(source);
		return escaped
			.replace(/^curl/m, '<span class="token-command">curl</span>')
			.replace(/ (-H|-d)/g, (match) => ` <span class="token-flag">${match.trim()}</span>`)
			.replace(/https:\/\/[^\s\\]+/g, (match) => `<span class="token-url">${match}</span>`)
			.replace(/'([^']*)'/g, (match) => `<span class="token-string">${match}</span>`)
			.replace(/\n/g, '<br>');
	}

	$: renderedApiCode = highlightCurl(apiSnippet);

	$: formatOptions =
		config && config.recommendedFormats && config.recommendedFormats.length
			? config.recommendedFormats
			: formats.map((f) => f.id);
	$: sizeOptions =
		config && config.recommendedSizes && config.recommendedSizes.length
			? config.recommendedSizes
			: popularSizes;
	$: primarySizeFormat =
		(formatOptions && formatOptions.length && String(formatOptions[0]).toLowerCase()) || 'jpg';

	// Structured data for SEO
	$: structuredData = validCase
		? {
				'@context': 'https://schema.org',
				'@type': 'WebApplication',
				name: `${config.label} - Pictify.io`,
				url: canonical,
				description: config.description,
				applicationCategory: ['DesignApplication', 'ImageGenerator'],
				operatingSystem: 'Web',
				offers: {
					'@type': 'Offer',
					price: '0',
					priceCurrency: 'USD',
					availability: 'https://schema.org/InStock'
				},
				featureList: config.benefits || [],
				creator: {
					'@type': 'Organization',
					name: 'Pictify.io',
					url: 'https://pictify.io'
				}
		  }
		: null;

	// API example snippet
	$: apiSnippet = `curl -X POST https://api.pictify.io/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "html": "<your-template-html>",
    "width": ${sizeOptions[0] ? parseSize(sizeOptions[0]).width || 1200 : 1200},
    "height": ${sizeOptions[0] ? parseSize(sizeOptions[0]).height || 630 : 630},
    "fileExtension": "${formatOptions[0] || 'png'}"
  }'`;

	// Template draft for NextSteps
	$: templateDraft = template
		? {
				version: 1,
				name: config?.label || useCaseId,
				type: 'custom',
				width: templateWidth,
				height: templateHeight,
				fabricJSData: template.fabricJSData,
				source: `workflow-${useCaseId}`
		  }
		: null;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta
		name="keywords"
		content="{config?.seoKeywords?.join(', ') ||
			config?.label ||
			'HTML to Image'}, image generator, automation, Pictify, API"
	/>

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://pictify.io/og-image-tools.jpg" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="https://pictify.io/og-image-tools.jpg" />

	{#if structuredData}
		<script type="application/ld+json">
			{
				JSON.stringify(structuredData);
			}
		</script>
	{/if}
</svelte:head>

<section class="w-full min-h-screen bg-[#FFFDF8] relative overflow-hidden font-['Manrope']">
	<Nav />

	<!-- Background Elements -->
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"
	/>
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"
	/>
	<div
		class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ff6b6b]/5 rounded-full blur-[80px] -z-10 pointer-events-none"
	/>

	<main
		class="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-20 md:pb-32 relative z-10"
	>
		{#if validCase}
			<!-- Breadcrumb -->
			<nav class="mb-12 flex justify-center">
				<ol
					class="inline-flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937]"
				>
					<li><a href="/" class="text-gray-500 hover:text-gray-900 transition-colors">Home</a></li>
					<li class="text-gray-300">/</li>
					<li>
						<a href="/tools" class="text-gray-500 hover:text-gray-900 transition-colors">Tools</a>
					</li>
					<li class="text-gray-300">/</li>
					<li class="text-gray-900">{config.label}</li>
				</ol>
			</nav>

			<!-- Hero Section -->
			<div
				class="relative flex flex-col items-center justify-center text-center mb-16 pt-4 sm:pt-8"
			>
				<!-- Badge -->
				<div
					class="inline-flex transform -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-default mb-6"
				>
					<div
						class="px-6 py-2 bg-[#ffc480] border-[3px] border-gray-900 text-gray-900 font-black text-sm uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-lg"
					>
						★ Workflow
					</div>
				</div>

				<!-- Main Title -->
				<h1
					class="relative z-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tight leading-tight mb-6"
				>
					Generate
					<br class="hidden sm:block" />
					<span class="relative inline-block text-[#ff6b6b] px-2">
						{config.label}
					</span>
				</h1>

				<!-- Description -->
				<div class="max-w-2xl mx-auto px-2">
					<p class="text-lg sm:text-xl text-gray-600 font-bold leading-relaxed mb-8">
						{config.description}
						<span class="inline-block w-full h-px bg-gray-200 my-4" />
						Design once, render variants via API — the infrastructure layer for programmatic media.
					</p>
				</div>
			</div>

			<!-- Generation Limit Banner -->
			<GenerationLimitBanner />

			<!-- Template Preview Section (Window Style) -->
			<div class="max-w-5xl mx-auto px-4 mb-20">
				<div
					class="bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] rounded-3xl overflow-hidden relative group"
				>
					<!-- Window Header -->
					<div
						class="bg-gray-50 border-b-[3px] border-gray-900 p-4 flex items-center justify-between"
					>
						<div class="flex items-center gap-2">
							<div class="w-3.5 h-3.5 rounded-full bg-[#ff6b6b] border-2 border-gray-900" />
							<div class="w-3.5 h-3.5 rounded-full bg-[#ffc480] border-2 border-gray-900" />
							<div class="w-3.5 h-3.5 rounded-full bg-[#4ade80] border-2 border-gray-900" />
						</div>
						<div
							class="font-mono text-xs font-bold text-gray-500 uppercase flex items-center gap-2"
						>
							<span class="px-2 py-0.5 bg-gray-200 rounded text-gray-700">Canva Mode</span>
							{templateWidth} x {templateHeight}px
						</div>
					</div>

					<!-- Main Preview Canvas Area -->
					<div
						class="p-8 bg-gray-100 flex flex-col items-center justify-center relative min-h-[400px]"
					>
						<!-- Checkerboard -->
						<div
							class="absolute inset-0 opacity-10"
							style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;"
						/>

						<div class="relative z-10 flex flex-col items-center gap-8 w-full">
							<!-- FabricJS Canvas Preview -->
							<div
								class="relative rounded-xl border-[2px] border-gray-200 shadow-xl overflow-hidden bg-white hover:scale-[1.01] transition-transform duration-300"
							>
								{#if template?.fabricJSData}
									{#if previewLoading}
										<div class="absolute inset-0 flex items-center justify-center bg-white z-20">
											<div
												class="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"
											/>
										</div>
									{/if}
									<canvas bind:this={previewCanvasEl} />
								{:else}
									<div class="w-[600px] h-[315px] flex items-center justify-center bg-gray-50">
										<p class="font-bold text-gray-400">Preview not available</p>
									</div>
								{/if}
							</div>

							<!-- Action Bar -->
							<div class="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg">
								<button
									type="button"
									on:click={handleQuickGenerate}
									disabled={isGenerating}
									class="flex-1 py-4 bg-[#4ade80] text-gray-900 border-[3px] border-gray-900 font-black text-lg uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
								>
									{#if isGenerating}
										<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"
											><circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											/><path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/></svg
										>
										Working...
									{:else}
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13 10V3L4 14h7v7l9-11h-7z"
											/></svg
										>
										Run Test
									{/if}
								</button>
								<button
									type="button"
									on:click={openInCanvasEditor}
									class="flex-1 py-4 bg-white text-gray-900 border-[3px] border-gray-900 font-black text-lg uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-3 rounded-xl"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
										/></svg
									>
									Edit Design
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Generated Result + NextSteps -->
			{#if generatedImageUrl}
				<div class="max-w-4xl mx-auto px-4 mb-20 animate-fade-in-up">
					<div
						class="bg-[#4ade80]/10 border-[3px] border-[#4ade80] rounded-3xl p-8 text-center relative overflow-hidden"
					>
						<div class="absolute top-0 right-0 w-32 h-32 bg-[#4ade80]/20 rounded-full blur-2xl" />

						<h3 class="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">
							Success! Here is your image
						</h3>

						<div
							class="inline-block bg-white border-[3px] border-gray-900 p-2 shadow-[8px_8px_0_0_#1f2937] rotate-1 mb-8"
						>
							<img
								src={generatedImageUrl}
								alt="Generated result"
								class="max-w-full h-auto max-h-[400px]"
							/>
						</div>

						<div class="flex flex-wrap justify-center gap-4">
							<a
								href={generatedImageUrl}
								download="pictify-result.png"
								class="px-6 py-3 bg-white text-gray-900 border-[3px] border-gray-900 font-bold uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl flex items-center gap-2"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/></svg
								>
								Download PNG
							</a>
						</div>
					</div>

					<div class="mt-12">
						<NextSteps
							heading="Now Automate It"
							description="You've proved it works. Now integrate this into your app."
							curlSnippet={apiSnippet}
							{templateDraft}
							generatedUrl={generatedImageUrl}
							generatedWidth={templateWidth}
							generatedHeight={templateHeight}
							generatedFormat="png"
							toolName={config?.label || useCaseId}
						/>
					</div>
				</div>
			{:else if generationError}
				<div class="max-w-3xl mx-auto px-4 mb-12">
					<div
						class="bg-red-50 border-[3px] border-red-500 rounded-2xl p-6 flex items-center gap-4"
					>
						<div
							class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-500 text-red-500"
						>
							!
						</div>
						<div>
							<h4 class="font-black text-red-900 uppercase">Generation Failed</h4>
							<p class="text-red-700 font-medium">{generationError}</p>
						</div>
						<button on:click={handleQuickGenerate} class="ml-auto underline font-bold text-red-900"
							>Retry</button
						>
					</div>
				</div>
			{/if}

			<!-- Why Teams Choose This Section (Three Pillars Style) -->
			<section class="py-20 relative">
				<div class="text-center mb-16 px-4">
					<div
						class="inline-block bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform rotate-1 rounded-lg"
					>
						<span class="font-black uppercase tracking-widest text-sm">Overview</span>
					</div>
					<h2 class="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">
						Why teams <span class="text-[#ff6b6b]">choose</span> this workflow
					</h2>
				</div>

				<div class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto px-6">
					{#each config.overview as paragraph, i}
						<div
							class="bg-white border-[3px] border-gray-900 p-8 rounded-3xl shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] hover:-translate-y-1 transition-all relative overflow-hidden group"
						>
							<div
								class="absolute top-0 right-0 w-32 h-32 bg-[#ffc480]/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"
							/>
							<div
								class="w-12 h-12 bg-[#ffc480] border-[3px] border-gray-900 rounded-xl flex items-center justify-center text-xl font-black mb-6 shadow-[3px_3px_0_0_#1f2937] relative z-10"
							>
								{i + 1}
							</div>
							<p class="text-gray-700 font-bold leading-relaxed text-lg relative z-10">
								{paragraph}
							</p>
						</div>
					{/each}
				</div>
			</section>

			<!-- Deep Dive & Scenarios Section -->
			{#if config.longDescription || (config.useCaseScenarios && config.useCaseScenarios.length)}
				<section
					class="py-20 px-4 bg-white border-y-[3px] border-gray-900 relative overflow-hidden"
				>
					<!-- Background Pattern -->
					<div
						class="absolute inset-0 opacity-40 mix-blend-multiply"
						style="background-image: radial-gradient(#e5e7eb 2px, transparent 2px); background-size: 32px 32px;"
					/>

					<div class="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 relative z-10">
						<!-- Long Description Column -->
						{#if config.longDescription}
							<div
								class={config.useCaseScenarios && config.useCaseScenarios.length
									? 'lg:col-span-7'
									: 'lg:col-span-12'}
							>
								<div
									class="bg-[#FFFDF8] border-[3px] border-gray-900 rounded-3xl p-8 md:p-12 shadow-[12px_12px_0_0_#1f2937] h-full"
								>
									<span
										class="inline-block px-4 py-1.5 bg-[#ff6b6b] text-white border-2 border-gray-900 rounded-full text-xs font-black uppercase tracking-widest shadow-[2px_2px_0_0_#1f2937] mb-6"
										>Deep Dive</span
									>

									<h3
										class="text-2xl md:text-3xl font-black text-gray-900 mb-6 leading-tight uppercase tracking-tight"
									>
										The Context
									</h3>

									<div class="prose prose-lg prose-gray font-medium text-gray-700 leading-loose">
										{@html config.longDescription.replace(/\n/g, '<br/>')}
									</div>
								</div>
							</div>
						{/if}

						<!-- Use Case Scenarios Column -->
						{#if config.useCaseScenarios && config.useCaseScenarios.length}
							<div class={config.longDescription ? 'lg:col-span-5' : 'lg:col-span-12'}>
								<div
									class="bg-[#4ade80] border-[3px] border-gray-900 rounded-3xl p-8 md:p-12 shadow-[12px_12px_0_0_#1f2937] h-full relative overflow-hidden"
								>
									<!-- Decorative Circle -->
									<div
										class="absolute -bottom-8 -right-8 w-40 h-40 bg-white/20 rounded-full blur-xl pointer-events-none"
									/>

									<span
										class="inline-block px-4 py-1.5 bg-white text-gray-900 border-2 border-gray-900 rounded-full text-xs font-black uppercase tracking-widest shadow-[2px_2px_0_0_#1f2937] mb-6"
										>Perfect For</span
									>

									<h3
										class="text-2xl md:text-3xl font-black text-gray-900 mb-8 leading-tight uppercase tracking-tight"
									>
										Who uses this?
									</h3>

									<ul class="space-y-4">
										{#each config.useCaseScenarios as scenario}
											<li
												class="flex items-start gap-4 p-4 bg-white/90 border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#1f2937] transition-all"
											>
												<div
													class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffc480] border-2 border-gray-900 flex items-center justify-center mt-1"
												>
													<svg
														class="w-3.5 h-3.5 text-gray-900"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="4"
															d="M5 13l4 4L19 7"
														/>
													</svg>
												</div>
												<span class="text-gray-900 font-bold leading-snug">{scenario}</span>
											</li>
										{/each}
									</ul>
								</div>
							</div>
						{/if}
					</div>
				</section>
			{/if}

			<SectionSeparator icon="bolt" />

			<!-- Pain Points Section -->
			<section class="py-20 bg-[#FFFDF8]">
				<div class="max-w-5xl mx-auto px-6">
					<div class="text-center mb-16">
						<h2 class="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">
							Problems <span class="bg-[#ff6b6b] text-white px-2 transform -skew-x-6 inline-block"
								>Solved</span
							>
						</h2>
					</div>

					<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each config.painPoints as point}
							<div
								class="bg-white border-[3px] border-gray-900 p-6 rounded-2xl shadow-[5px_5px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#1f2937] transition-all"
							>
								<div class="flex items-start gap-4">
									<span class="text-[#ff6b6b] text-2xl font-black">✗</span>
									<p class="text-gray-800 font-bold">{point}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- Step by Step Section -->
			<section class="py-20">
				<div class="text-center mb-16 px-4">
					<h2 class="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">
						Step-by-step <span class="text-[#4ade80]">workflow</span>
					</h2>
				</div>

				<div class="max-w-4xl mx-auto px-6 space-y-8">
					{#each config.workflow as step, i}
						<div
							class="bg-white border-[3px] border-gray-900 rounded-3xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden hover:-translate-y-1 transition-all group"
						>
							<div class="flex flex-col md:flex-row items-stretch">
								<div
									class="bg-gray-900 text-white px-8 py-6 flex items-center justify-center border-b-[3px] md:border-b-0 md:border-r-[3px] border-gray-900 min-w-[100px]"
								>
									<span class="font-black text-4xl text-[#4ade80]">{i + 1}</span>
								</div>
								<div class="p-8 flex-1 group-hover:bg-gray-50 transition-colors">
									<h3 class="font-black text-2xl text-gray-900 uppercase tracking-wide mb-3">
										{step.title}
									</h3>
									<p class="text-gray-600 font-medium text-lg">{step.detail}</p>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<div class="text-center mt-16 px-4">
					<button
						type="button"
						on:click={openInCanvasEditor}
						class="px-10 py-5 bg-[#ff6b6b] text-white border-[3px] border-gray-900 font-black text-xl uppercase tracking-widest shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all inline-flex items-center gap-3 rounded-2xl"
					>
						Start Creating Now
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 8l4 4m0 0l-4 4m4-4H3"
							/></svg
						>
					</button>
				</div>
			</section>

			<SectionSeparator icon="hash" />

			<!-- API Section (Dark Mac Window) -->
			<section class="py-20 px-4">
				<div class="max-w-6xl mx-auto">
					<div
						class="rounded-[2.5rem] border-[3px] border-gray-900 bg-white shadow-[12px_12px_0_0_#1f2937] overflow-hidden"
					>
						<div class="grid gap-10 lg:grid-cols-[1fr,1.2fr] p-8 md:p-16 items-center">
							<!-- Left: Pitch -->
							<div class="flex flex-col gap-8">
								<div>
									<span
										class="px-4 py-2 bg-[#ffc480] border-2 border-gray-900 rounded-lg text-xs font-black uppercase tracking-widest shadow-[2px_2px_0_0_#1f2937]"
										>Developer Friendly</span
									>
									<h2 class="mt-6 text-3xl md:text-5xl font-black text-gray-900 leading-[1.1]">
										Automate with <span class="text-[#ff6b6b]">API</span>
									</h2>
									<p class="mt-6 text-xl text-gray-600 font-medium leading-relaxed">
										Trigger this workflow programmatically. Personalized images, generated instantly
										at scale.
									</p>
								</div>

								<div class="flex flex-wrap gap-4">
									<a
										href="/signup"
										class="px-6 py-3 bg-gray-900 text-white font-bold border-[3px] border-gray-900 rounded-xl hover:bg-[#ff6b6b] hover:text-gray-900 transition-colors"
									>
										Get API Key
									</a>
									<a
										href="https://docs.pictify.io"
										target="_blank"
										class="px-6 py-3 bg-white text-gray-900 font-bold border-[3px] border-gray-900 rounded-xl hover:bg-gray-50 transition-colors"
									>
										Read Docs
									</a>
								</div>
							</div>

							<!-- Right: Code Window -->
							<div class="relative group">
								<div
									class="absolute -inset-4 bg-gradient-to-r from-[#ff6b6b] to-[#ffc480] rounded-[2rem] opacity-20 blur-xl group-hover:opacity-30 transition-opacity"
								/>
								<div
									class="relative rounded-2xl border-[3px] border-gray-900 bg-[#1e1e1e] shadow-[8px_8px_0_0_#1f2937] overflow-hidden"
								>
									<div
										class="bg-[#2d2d2d] px-4 py-3 border-b-2 border-gray-800 flex items-center gap-2"
									>
										<div class="w-3 h-3 rounded-full bg-[#ff5f56]" />
										<div class="w-3 h-3 rounded-full bg-[#ffbd2e]" />
										<div class="w-3 h-3 rounded-full bg-[#27c93f]" />
									</div>
									<div class="p-6 overflow-x-auto custom-scrollbar">
										<pre class="font-mono text-sm leading-relaxed text-gray-300"><code
												>{@html renderedApiCode}</code
											></pre>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- FAQs Section -->
			<section class="py-20 px-4">
				<div class="max-w-4xl mx-auto">
					<div class="text-center mb-16">
						<h2
							class="text-3xl md:text-4xl font-black uppercase tracking-tighter inline-block relative"
						>
							<span class="relative z-10">Frequently Asked Questions</span>
							<span
								class="absolute bottom-1 left-0 w-full h-3 bg-[#ffc480] -z-0 transform -rotate-1"
							/>
						</h2>
					</div>

					<div class="space-y-4">
						{#each config.faqs as faq}
							<details
								class="group bg-white rounded-2xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] overflow-hidden transition-all duration-200 open:shadow-[8px_8px_0_0_#1f2937] open:-translate-y-1"
							>
								<summary
									class="flex items-center justify-between p-6 cursor-pointer list-none bg-white hover:bg-gray-50 transition-colors"
								>
									<span class="font-black text-lg text-gray-900 pr-8">{faq.q}</span>
									<span
										class="transform transition-transform duration-200 group-open:rotate-180 bg-gray-100 text-gray-900 w-8 h-8 flex items-center justify-center rounded-lg border-2 border-gray-900 flex-shrink-0"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M19 9l-7 7-7-7"
											/></svg
										>
									</span>
								</summary>
								<div class="p-6 pt-0 text-gray-700 font-medium leading-relaxed">
									{faq.a}
								</div>
							</details>
						{/each}
					</div>
				</div>
			</section>

			<!-- Related Workflows -->
			<section class="py-20 px-4 border-t-[3px] border-gray-900 bg-white">
				<div class="max-w-6xl mx-auto">
					<h3 class="text-2xl font-black uppercase tracking-widest text-gray-400 mb-8">
						Related Workflows
					</h3>
					<div class="flex flex-wrap gap-4">
						{#each config.related as relatedId}
							<a
								href={`/tools/${relatedId}`}
								class="px-6 py-3 bg-[#FFFDF8] border-[3px] border-gray-900 font-bold text-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#4ade80] transition-all rounded-xl"
							>
								{useCaseDetails[relatedId]?.label || relatedId}
							</a>
						{/each}
						<a
							href="/tools"
							class="px-6 py-3 bg-gray-900 text-white border-[3px] border-gray-900 font-bold shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
						>
							View All Tools →
						</a>
					</div>
				</div>
			</section>
		{:else}
			<!-- Not Found State -->
			<div
				class="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-8 px-4"
			>
				<div
					class="w-24 h-24 bg-[#ff6b6b] rounded-full border-[4px] border-gray-900 flex items-center justify-center text-5xl font-black text-white shadow-[8px_8px_0_0_#1f2937]"
				>
					?
				</div>
				<h1 class="text-4xl md:text-6xl font-black uppercase tracking-tighter text-gray-900">
					Workflow not found
				</h1>
				<a
					href="/tools"
					class="px-8 py-4 bg-[#ffc480] border-[3px] border-gray-900 text-gray-900 font-black uppercase tracking-wider shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all rounded-xl"
				>
					Explore All Tools
				</a>
			</div>
		{/if}
	</main>

	<Footer />

	<!-- Exit Intent Popup for lead capture -->
	<ExitIntentPopup toolName={config?.label || useCaseId} {generatedImageUrl} />
</section>

<style>
	:global(.token-command) {
		color: #ff79c6;
		font-weight: 700;
	}

	:global(.token-flag) {
		color: #8be9fd;
		font-weight: 600;
	}

	:global(.token-url) {
		color: #f1fa8c;
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	:global(.token-string) {
		color: #50fa7b;
	}

	.custom-scrollbar::-webkit-scrollbar {
		height: 8px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: #2d2d2d;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #4b5563;
		border-radius: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #6b7280;
	}
</style>
