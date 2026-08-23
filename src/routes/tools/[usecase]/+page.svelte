<script>
	/**
	 * /tools/[usecase] — the v2 tool page, column mode.
	 *
	 * Nine use cases share this route. Three of them (markdown, table, barcode)
	 * ship their own self-contained editor; the rest render the template
	 * workbench, which is the only branch with a toolbar action here. SEO copy
	 * is frozen.
	 */
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import ResultCard from '$lib/components/tools/v2/ResultCard.svelte';
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolCard from '$lib/components/tools/v2/ToolCard.svelte';
	import QuotaMeter from '$lib/components/tools/v2/QuotaMeter.svelte';
	import GenerateButton from '$lib/components/tools/v2/GenerateButton.svelte';
	import HtmlTemplateEditor from '$lib/components/tools/HtmlTemplateEditor.svelte';
	import MarkdownEditor from '$lib/components/tools/MarkdownEditor.svelte';
	import TableEditor from '$lib/components/tools/TableEditor.svelte';
	import BarcodeEditor from '$lib/components/tools/BarcodeEditor.svelte';
	import TemplateGallery from '$lib/components/tools/TemplateGallery.svelte';
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
	import { getHtmlTemplatesForUseCase } from '$lib/pseo/useCaseHtmlTemplates.js';
	import { onMount } from 'svelte';
	import { user } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import { createImagePublic } from '../../../api/image.js';
	import { downloadFile } from '$lib/utils/download.js';

	// User login state
	let isUserLoggedIn = false;
	user.subscribe((userData) => {
		isUserLoggedIn = !!userData?.email;
	});

	$: useCaseId = $page.params.usecase;
	$: config = useCaseDetails[useCaseId];
	$: useCase = config ? useCases.find((u) => u.id === useCaseId) : null;
	$: validCase = !!useCase;
	$: title = validCase
		? config.seoTitle || `${config.label} | Pictify.io`
		: 'Use Case | Pictify.io';
	$: description = validCase
		? config.description
		: 'Convert HTML to images instantly with Pictify.io.';
	$: canonical = validCase ? `https://pictify.io/tools/${useCaseId}` : 'https://pictify.io/tools';

	// Generation state
	let isGenerating = false;
	let generatedImageUrl = '';
	let generationError = '';
	let editorRef;

	// Quick generate from the edited HTML template.
	// Uses the public HTML endpoint (no auth required, rate limited) — the same
	// render engine as the authenticated /image API.
	async function handleQuickGenerate() {
		const sel =
			editorRef?.getSelected?.() ||
			(toolTemplates[0] && {
				html: toolTemplates[0].html,
				width: toolTemplates[0].width,
				height: toolTemplates[0].height
			});
		if (!sel?.html) {
			toast.set({ message: 'No template available', type: 'error', duration: 2000 });
			return;
		}

		// Track generation in global limits store
		generationLimits.increment();
		isGenerating = true;
		generationError = '';
		generatedImageUrl = '';

		try {
			const { image } = await createImagePublic({
				html: sel.html,
				width: sel.width,
				height: sel.height,
				fileExtension: 'png'
			});

			if (image?.url) {
				generatedImageUrl = image.url;
				generatedDims = { width: sel.width, height: sel.height };
				toast.set({ message: 'Image generated successfully!', type: 'success', duration: 2000 });
			} else {
				throw new Error('No image URL in response');
			}
		} catch (e) {
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

	// HTML starter templates for this use case (empty for the code-editor tools)
	$: toolTemplates = validCase ? getHtmlTemplatesForUseCase(useCaseId) : [];
	$: templateWidth = toolTemplates[0]?.width || 1200;
	$: templateHeight = toolTemplates[0]?.height || 630;
	let generatedDims = { width: 1200, height: 630 };

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

	// FAQ structured data for SEO
	$: faqSchema =
		validCase && config.faqs && config.faqs.length > 0
			? {
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: config.faqs.map((faq) => ({
						'@type': 'Question',
						name: faq.q,
						acceptedAnswer: {
							'@type': 'Answer',
							text: faq.a
						}
					}))
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

	const TOOL_NAME = 'usecase_tool';

	$: guestRemaining = Math.max(0, GUEST_DAILY_LIMIT - ($generationLimits?.count || 0));
	$: lastFreeRender = !isUserLoggedIn && guestRemaining <= 1;

	// Three neighbours from the same shelf on /tools, so the cards match the hub.
	const RELATED = [
		{
			title: 'HTML to image',
			meta: 'HTML → PNG · JPG · WEBP',
			href: '/tools/html-to-image',
			art: '/landing/tools/html-to-image.svg'
		},
		{
			title: 'CSV to PDF',
			meta: 'CSV → PDF',
			href: '/tools/csv-to-pdf',
			art: '/landing/tools/csv-to-pdf.svg'
		},
		{
			title: 'Certificate generator',
			meta: 'NAMES → CERTIFICATES',
			href: '/tools/certificate-generator',
			art: '/landing/tools/certificate-generator.svg'
		}
	];
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta name="robots" content="index, follow, max-image-preview:large" />
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
	<meta
		property="og:image"
		content={config?.ogImage || 'https://media.pictify.io/qyl7z-1775406830860.png'}
	/>

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta
		name="twitter:image"
		content={config?.ogImage || 'https://media.pictify.io/qyl7z-1775406830860.png'}
	/>

	{#if structuredData}
		{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
	{/if}
	{#if faqSchema}
		{@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`}
	{/if}
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pictify.io/' },
			{ '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://pictify.io/tools' },
			{ '@type': 'ListItem', position: 3, name: config?.label || 'Tool' }
		]
	})}</script>`}
</svelte:head>

{#if validCase}
	<ToolPageShell
		toolName={TOOL_NAME}
		toolPath={`/tools/${useCaseId}`}
		breadcrumb={config.label.toUpperCase()}
		facts="FREE · 5 RENDERS A DAY · NO SIGNUP · RENDER BY API"
		related={RELATED}
		loggedIn={isUserLoggedIn}
		hasResult={!!generatedImageUrl}
		longform="column"
	>
		<h1
			slot="h1"
			class="font-display text-[38px] font-extrabold leading-[1.04] tracking-[-0.02em] text-brand-ink lg:text-[52px] lg:leading-[56px]"
		>
			Generate
			<span>{config.label}</span>
		</h1>

		<p
			slot="hero-sub"
			class="max-w-[640px] font-sans text-base leading-[25px] text-[#2A2C1E] lg:text-lg lg:leading-[27px]"
		>
			{config.description}
			<span class="text-brand-slate">
				Design once, render variants via API, the infrastructure layer for programmatic media.
			</span>
		</p>

		<div slot="tool">
			<!--
				The three self-contained editors carry their own generate button and
				result, so their card's toolbar shows the quota ladder only — one
				primary action per surface, and it is already inside the editor.
			-->
			{#if useCaseId === 'markdown' || useCaseId === 'table' || useCaseId === 'barcode-generator'}
				<ToolCard>
					<div class="p-5 lg:p-7">
						{#if useCaseId === 'markdown'}
							<MarkdownEditor {isUserLoggedIn} />
						{:else if useCaseId === 'table'}
							<TableEditor {isUserLoggedIn} />
						{:else}
							<BarcodeEditor />
						{/if}
					</div>

					<svelte:fragment slot="toolbar-left">
						<span class="font-mono text-xs tracking-[0.06em] text-brand-mute">
							{config.label.toUpperCase()}
						</span>
					</svelte:fragment>

					<svelte:fragment slot="toolbar-right">
						<QuotaMeter
							remaining={guestRemaining}
							loggedIn={isUserLoggedIn}
							toolName={TOOL_NAME}
							toolPath={`/tools/${useCaseId}`}
						/>
					</svelte:fragment>
				</ToolCard>
			{:else}
				<ToolCard>
					<div class="flex flex-col gap-6 p-5 lg:p-7">
						<div class="relative z-10 flex flex-col items-center gap-8 w-full">
							<!-- HTML template editor: live preview + editable source -->
							{#if toolTemplates.length}
								<HtmlTemplateEditor bind:this={editorRef} templates={toolTemplates} />
							{:else}
								<div
									class="w-full h-[315px] flex items-center justify-center bg-brand-subtle border border-brand-ink"
								>
									<p class="font-bold text-brand-mute">Preview not available</p>
								</div>
							{/if}
						</div>
					</div>

					<svelte:fragment slot="toolbar-left">
						<span class="font-mono text-xs tracking-[0.06em] text-brand-mute">
							TEMPLATE → PNG
						</span>
					</svelte:fragment>

					<svelte:fragment slot="toolbar-right">
						<QuotaMeter
							remaining={guestRemaining}
							loggedIn={isUserLoggedIn}
							toolName={TOOL_NAME}
							toolPath={`/tools/${useCaseId}`}
						/>
						<GenerateButton
							label="Generate Image"
							loading={isGenerating}
							remaining={guestRemaining}
							loggedIn={isUserLoggedIn}
							toolName={TOOL_NAME}
							toolPath={`/tools/${useCaseId}`}
							on:generate={handleQuickGenerate}
						/>
					</svelte:fragment>
				</ToolCard>
			{/if}
		</div>

		<div slot="result">
			{#if generatedImageUrl}
				<ResultCard
					imageUrl={generatedImageUrl}
					formatLabel="PNG"
					fileExtension="png"
					width={generatedDims.width}
					height={generatedDims.height}
					loggedIn={isUserLoggedIn}
					lastFree={lastFreeRender}
					toolName={TOOL_NAME}
					toolPath={`/tools/${useCaseId}`}
				/>
			{:else if generationError}
				<div class="max-w-3xl mx-auto px-4 mb-12">
					<div
						class="bg-red-50 border-[3px] border-red-500 rounded-tile p-6 flex items-center gap-4"
					>
						<div
							class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-500 text-red-500"
						>
							!
						</div>
						<div>
							<h4 class="font-semibold text-red-900">Generation Failed</h4>
							<p class="text-red-700 font-medium">{generationError}</p>
						</div>
						<button on:click={handleQuickGenerate} class="ml-auto underline font-bold text-red-900"
							>Retry</button
						>
					</div>
				</div>
			{/if}
		</div>

		<svelte:fragment slot="longform">
			<!-- Why Teams Choose This Section (Three Pillars Style) -->
			<section class="py-20 relative">
				<div class="text-center mb-16 px-4">
					<div
						class="inline-block bg-brand-paper border border-brand-ink px-4 py-1 mb-6 transform rotate-1 rounded-lg"
					>
						<span class="font-semibold tracking-widest text-sm">Overview</span>
					</div>
					<h2 class="text-3xl md:text-5xl font-semibold text-brand-ink tracking-[-0.02em]">
						Why teams <span class="text-brand-pink">choose</span> this workflow
					</h2>
				</div>

				<div class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto px-6">
					{#each config.overview as paragraph, i}
						<div
							class="bg-brand-paper border border-brand-ink p-8 rounded-tile hover:-translate-y-1 transition-all relative overflow-hidden group"
						>
							<div
								class="absolute top-0 right-0 w-32 h-32 bg-brand-field/30 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"
							/>
							<div
								class="w-12 h-12 bg-brand-field border border-brand-ink rounded-xl flex items-center justify-center text-xl font-semibold mb-6 relative z-10"
							>
								{i + 1}
							</div>
							<p class="text-brand-slate font-bold leading-relaxed text-lg relative z-10">
								{paragraph}
							</p>
						</div>
					{/each}
				</div>
			</section>

			<!-- Deep Dive & Scenarios Section -->
			{#if config.longDescription || (config.useCaseScenarios && config.useCaseScenarios.length)}
				<section
					class="py-20 px-4 bg-brand-paper border-y-[3px] border-gray-900 relative overflow-hidden"
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
									class="bg-brand-subtle border border-brand-ink rounded-tile p-8 md:p-12 h-full"
								>
									<span
										class="inline-block px-4 py-1.5 bg-brand-pink text-white border border-brand-ink rounded-full text-xs font-semibold tracking-widest mb-6"
										>Deep Dive</span
									>

									<h3
										class="text-2xl md:text-3xl font-semibold text-brand-ink mb-6 leading-tight tracking-tight"
									>
										The Context
									</h3>

									<div class="prose prose-lg prose-gray font-medium text-brand-slate leading-loose">
										{@html config.longDescription.replace(/\n/g, '<br/>')}
									</div>
								</div>
							</div>
						{/if}

						<!-- Use Case Scenarios Column -->
						{#if config.useCaseScenarios && config.useCaseScenarios.length}
							<div class={config.longDescription ? 'lg:col-span-5' : 'lg:col-span-12'}>
								<div
									class="bg-brand-proof border border-brand-ink rounded-tile p-8 md:p-12 h-full relative overflow-hidden"
								>
									<!-- Decorative Circle -->
									<div
										class="absolute -bottom-8 -right-8 w-40 h-40 bg-brand-paper/20 rounded-full blur-xl pointer-events-none"
									/>

									<span
										class="inline-block px-4 py-1.5 bg-brand-paper text-brand-ink border border-brand-ink rounded-full text-xs font-semibold tracking-widest mb-6"
										>Perfect For</span
									>

									<h3
										class="text-2xl md:text-3xl font-semibold text-brand-ink mb-8 leading-tight tracking-tight"
									>
										Who uses this?
									</h3>

									<ul class="space-y-4">
										{#each config.useCaseScenarios as scenario}
											<li
												class="flex items-start gap-4 p-4 bg-brand-paper border border-brand-ink rounded-xl hover:-translate-y-1 transition-all"
											>
												<div
													class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-field border border-brand-ink flex items-center justify-center mt-1"
												>
													<svg
														class="w-3.5 h-3.5 text-brand-ink"
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
												<span class="text-brand-ink font-bold leading-snug">{scenario}</span>
											</li>
										{/each}
									</ul>
								</div>
							</div>
						{/if}
					</div>
				</section>
			{/if}

			<!-- Pain Points Section -->
			<section class="py-20 bg-brand-subtle">
				<div class="max-w-5xl mx-auto px-6">
					<div class="text-center mb-16">
						<h2 class="text-3xl md:text-5xl font-semibold text-brand-ink tracking-[-0.02em]">
							Problems <span class="bg-brand-pink text-white px-2 transform -skew-x-6 inline-block"
								>Solved</span
							>
						</h2>
					</div>

					<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each config.painPoints as point}
							<div class="bg-brand-paper border border-brand-ink p-6 rounded-tile transition-all">
								<div class="flex items-start gap-4">
									<span class="text-brand-pink text-2xl font-semibold">✗</span>
									<p class="text-brand-slate font-bold">{point}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- Step by Step Section -->
			<section class="py-20">
				<div class="text-center mb-16 px-4">
					<h2 class="text-3xl md:text-5xl font-semibold text-brand-ink tracking-[-0.02em]">
						Step-by-step <span class="text-brand-proof">workflow</span>
					</h2>
				</div>

				<div class="max-w-4xl mx-auto px-6 space-y-8">
					{#each config.workflow as step, i}
						<div
							class="bg-brand-paper border border-brand-ink rounded-tile overflow-hidden hover:-translate-y-1 transition-all group"
						>
							<div class="flex flex-col md:flex-row items-stretch">
								<div
									class="bg-brand-ink text-white px-8 py-6 flex items-center justify-center border-b-[3px] md:border-b-0 md:border-r-[3px] border-gray-900 min-w-[100px]"
								>
									<span class="font-semibold text-4xl text-brand-proof">{i + 1}</span>
								</div>
								<div class="p-8 flex-1 group-hover:bg-brand-subtle transition-colors">
									<h3 class="font-semibold text-2xl text-brand-ink tracking-wide mb-3">
										{step.title}
									</h3>
									<p class="text-brand-slate font-medium text-lg">{step.detail}</p>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<div class="text-center mt-16 px-4">
					<a
						href="/signup"
						class="px-10 py-5 bg-brand-pink text-white border border-brand-ink font-semibold text-xl tracking-widest transition-all inline-flex items-center gap-3 rounded-tile"
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
					</a>
				</div>
			</section>

			<!-- API Section (Dark Mac Window) -->
			<section class="py-20 px-4">
				<div class="max-w-6xl mx-auto">
					<div class="rounded-tile border border-brand-ink bg-brand-paper overflow-hidden">
						<div class="grid gap-10 lg:grid-cols-[1fr,1.2fr] p-8 md:p-16 items-center">
							<!-- Left: Pitch -->
							<div class="flex flex-col gap-8">
								<div>
									<span
										class="px-4 py-2 bg-brand-field border border-brand-ink rounded-lg text-xs font-semibold tracking-widest"
										>Developer Friendly</span
									>
									<h2 class="mt-6 text-3xl md:text-5xl font-semibold text-brand-ink leading-[1.1]">
										Automate with <span class="text-brand-pink">API</span>
									</h2>
									<p class="mt-6 text-xl text-brand-slate font-medium leading-relaxed">
										Trigger this workflow programmatically. Personalized images, generated instantly
										at scale.
									</p>
								</div>

								<div class="flex flex-col gap-3">
									<div class="flex flex-wrap gap-4">
										<a
											href="/signup"
											class="px-6 py-3 bg-brand-ink text-white font-bold border border-brand-ink rounded-xl hover:bg-brand-pink hover:text-brand-ink transition-colors"
										>
											Get API Key
										</a>
										<a
											href="https://docs.pictify.io"
											target="_blank"
											class="px-6 py-3 bg-brand-paper text-brand-ink font-bold border border-brand-ink rounded-xl hover:bg-brand-subtle transition-colors"
										>
											Read Docs
										</a>
									</div>
									<a
										href="/signup"
										class="w-fit text-sm font-semibold text-brand-ink underline decoration-4 decoration-brand-accent underline-offset-4 hover:text-brand-pink transition-colors"
									>
										Generate in bulk with Workflows →
									</a>
								</div>
							</div>

							<!-- Right: Code Window -->
							<div class="relative group">
								<div
									class="absolute -inset-4 bg-gradient-to-r from-brand-danger to-brand-accent rounded-tile opacity-20 blur-xl group-hover:opacity-30 transition-opacity"
								/>
								<div
									class="relative rounded-tile border border-brand-ink bg-[#1e1e1e] overflow-hidden"
								>
									<div
										class="bg-[#2d2d2d] px-4 py-3 border-b-2 border-gray-800 flex items-center gap-2"
									>
										<div class="w-3 h-3 rounded-full bg-[#ff5f56]" />
										<div class="w-3 h-3 rounded-full bg-[#ffbd2e]" />
										<div class="w-3 h-3 rounded-full bg-[#27c93f]" />
									</div>
									<div class="p-6 overflow-x-auto custom-scrollbar">
										<pre class="font-mono text-sm leading-relaxed text-brand-rule"><code
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
						<h2 class="text-3xl md:text-4xl font-semibold tracking-[-0.02em] inline-block relative">
							<span class="relative z-10">Frequently Asked Questions</span>
							<span
								class="absolute bottom-1 left-0 w-full h-3 bg-brand-field -z-0 transform -rotate-1"
							/>
						</h2>
					</div>

					<div class="space-y-4">
						{#each config.faqs as faq}
							<details
								class="group bg-brand-paper rounded-tile border border-brand-ink overflow-hidden transition-all duration-200 open: open:-translate-y-1"
							>
								<summary
									class="flex items-center justify-between p-6 cursor-pointer list-none bg-brand-paper hover:bg-brand-subtle transition-colors"
								>
									<span class="font-semibold text-lg text-brand-ink pr-8">{faq.q}</span>
									<span
										class="transform transition-transform duration-200 group-open:rotate-180 bg-brand-subtle text-brand-ink w-8 h-8 flex items-center justify-center rounded-lg border border-brand-ink flex-shrink-0"
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
								<div class="p-6 pt-0 text-brand-slate font-medium leading-relaxed">
									{faq.a}
								</div>
							</details>
						{/each}
					</div>
				</div>
			</section>

			<!-- Related Workflows -->
			<section class="py-20 px-4 border-t border-brand-ink bg-brand-paper">
				<div class="max-w-6xl mx-auto">
					<h3 class="text-2xl font-semibold tracking-widest text-brand-mute mb-8">
						Related Workflows
					</h3>
					<div class="flex flex-wrap gap-4">
						{#each config.related as relatedId}
							<a
								href={`/tools/${relatedId}`}
								class="px-6 py-3 bg-brand-subtle border border-brand-ink font-bold text-brand-ink hover:bg-brand-proof transition-all rounded-xl"
							>
								{useCaseDetails[relatedId]?.label || relatedId}
							</a>
						{/each}
						<a
							href="/tools"
							class="px-6 py-3 bg-brand-ink text-white border border-brand-ink font-bold transition-all rounded-xl"
						>
							View All Tools →
						</a>
					</div>
				</div>
			</section>
		</svelte:fragment>
	</ToolPageShell>
{:else}
	<div class="landing-v2 flex min-h-screen w-full flex-col bg-brand-canvas">
		<Nav />
		<main class="flex flex-1 items-center justify-center px-5 py-24">
			<div
				class="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-8 px-4"
			>
				<div
					class="w-24 h-24 bg-brand-pink rounded-full border-[4px] border-gray-900 flex items-center justify-center text-5xl font-semibold text-white"
				>
					?
				</div>
				<h1 class="text-4xl md:text-6xl font-semibold tracking-[-0.02em] text-brand-ink">
					Workflow not found
				</h1>
				<a
					href="/tools"
					class="px-8 py-4 bg-brand-field border border-brand-ink text-brand-ink font-semibold tracking-wider transition-all rounded-xl"
				>
					Explore All Tools
				</a>
			</div>
		</main>
		<Footer />
	</div>
{/if}
