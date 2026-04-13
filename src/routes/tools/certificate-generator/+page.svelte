<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import NextSteps from '$lib/components/tools/NextSteps.svelte';
	import GenerationLimitBanner from '$lib/components/tools/GenerationLimitBanner.svelte';
	import MiniEditor from '$lib/components/tools/MiniEditor.svelte';
	import RelatedTools from '$lib/components/tools/RelatedTools.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { user } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';
	import { generationLimits } from '../../../store/generationLimits.store';
	import { pageActions } from '../../../store/pages.store';
	import { goto } from '$app/navigation';
	import backend from '../../../service/backend';
	import { analytics } from '$lib/analytics.js';
	import { certificateTemplates } from '$lib/components/tools/CertificateTemplates.js';

	// User login state (reactive — no manual subscribe needed)
	$: isUserLoggedIn = !!$user?.email;

	let selectedTemplate = certificateTemplates[0];
	let formValues = {
		recipientName: 'John Doe',
		organizationName: 'Your Organization',
		date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
		achievementText: 'for successfully completing the Advanced Training Program'
	};

	let isGenerating = false;
	let generatedImageUrl = '';
	let generationError = '';
	let miniEditorRef;
	let lastEditedData = null;

	// Debounced form-to-canvas sync (single renderAll via setVariableValues)
	let debounceTimer;
	$: if (miniEditorRef && formValues) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			miniEditorRef.setVariableValues?.({
				recipientName: formValues.recipientName,
				organizationName: formValues.organizationName,
				date: formValues.date,
				achievementText: formValues.achievementText
			});
		}, 150);
	}

	onDestroy(() => {
		clearTimeout(debounceTimer);
	});

	function selectTemplate(template) {
		selectedTemplate = template;
		formValues = {
			recipientName: 'John Doe',
			organizationName: 'Your Organization',
			date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
			achievementText: 'for successfully completing the Advanced Training Program'
		};
		generatedImageUrl = '';
		generationError = '';
		lastEditedData = null;
	}

	// Generation flow (matches [usecase] page pattern)
	async function handleGenerate() {
		const editedData = miniEditorRef?.getEditedFabricData?.() || selectedTemplate.fabricJSData;
		if (!editedData) {
			toast.set({ message: 'No template data available', type: 'error', duration: 2000 });
			return;
		}

		generationLimits.increment();
		isGenerating = true;
		generationError = '';
		generatedImageUrl = '';

		try {
			const response = await backend.post('/image/public/canvas', {
				fabricJSData: editedData,
				width: selectedTemplate.width,
				height: selectedTemplate.height,
				fileExtension: 'png',
				watermark: !isUserLoggedIn
			});

			if (response?.url) {
				generatedImageUrl = response.url;
				lastEditedData = editedData;
				toast.set({ message: 'Certificate generated successfully!', type: 'success', duration: 2000 });
				analytics.trackImageGenerated({
					tool_name: 'certificate_generator',
					format: 'png',
					with_watermark: !isUserLoggedIn
				});
			} else {
				throw new Error('No image URL in response');
			}
		} catch (e) {
			if (e.message?.includes('rate') || e.status === 429) {
				generationError = 'Too many requests. Please wait a moment and try again.';
			} else {
				generationError = e.message || 'Failed to generate certificate';
			}
			toast.set({ message: generationError, type: 'error', duration: 3000 });
		} finally {
			isGenerating = false;
		}
	}

	// Open in full canvas editor (matches [usecase] page pattern)
	function openInCanvasEditor() {
		const template = {
			...selectedTemplate,
			name: `${selectedTemplate.name} Certificate`,
			outputFormat: 'image'
		};

		pageActions.initFromTemplate(template);

		try {
			const DRAFT_KEY = 'pictify_template_draft_v1';
			localStorage.setItem(DRAFT_KEY, JSON.stringify(template));
		} catch (e) {
			/* ignored */
		}

		if ($user?.email) {
			goto('/template-workspace/image/create');
		} else {
			goto('/canvas/try?usecase=certificate');
		}
	}

	// NextSteps template draft — uses the edited canvas state captured on generation
	$: currentFabricData = lastEditedData || selectedTemplate.fabricJSData;
	$: templateDraft = {
		version: 1,
		name: 'Certificate template',
		type: 'certificate',
		width: selectedTemplate.width,
		height: selectedTemplate.height,
		fabricJSData: currentFabricData,
		source: 'certificate-generator'
	};

	// API snippet for NextSteps — reflects the actual data that was rendered
	$: apiSnippet = `curl -X POST https://api.pictify.io/image/canvas \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '${JSON.stringify({ fabricJSData: currentFabricData, width: selectedTemplate.width, height: selectedTemplate.height }, null, 2)}'`;

	// FAQ data
	const faqs = [
		{
			q: 'Is this certificate generator really free?',
			a: 'Yes, you can generate unlimited certificates for free. Logged-in users get watermark-free downloads, while guests receive a small Pictify watermark. Sign up for a free account to remove it.'
		},
		{
			q: 'Can I customize the certificate design?',
			a: 'Yes, you can edit any text directly on the canvas preview by clicking on it. Use the form fields to update recipient name, organization, date, and achievement text. For full design control, open the certificate in our full editor.'
		},
		{
			q: 'What formats can I download certificates in?',
			a: 'Currently certificates are generated as high-quality PNG images at 1920x1080 resolution. PDF support is coming soon. You can also use our API to generate certificates in JPG and WebP formats.'
		},
		{
			q: 'Can I generate certificates in bulk?',
			a: 'Yes! Use our API to batch generate certificates programmatically. Pass different recipient names, dates, and achievement text for each request. Perfect for course completions, event attendance, and employee recognition programs.'
		},
		{
			q: 'Can I add my company logo?',
			a: 'Open the certificate in our full editor to add logos, custom images, shapes, and additional text elements. The full editor gives you complete design control over every element.'
		},
		{
			q: 'Are the generated certificates printable?',
			a: 'Yes, certificates are generated at 1920x1080 pixels which provides excellent print quality for standard certificate sizes. For best results, print on high-quality paper or card stock.'
		}
	];

	// Structured data
	const structuredDataJson = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify.io Certificate Generator',
		url: 'https://pictify.io/tools/certificate-generator',
		description:
			'Create professional certificates for free with Pictify\'s interactive certificate generator. Choose from 5 beautiful templates, customize recipient names, dates, and achievements, and download as PNG.',
		applicationCategory: ['DesignApplication', 'ImageGenerator'],
		operatingSystem: 'Web',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD',
			availability: 'https://schema.org/InStock'
		},
		featureList: [
			'5 professional certificate templates',
			'Real-time canvas preview',
			'Customizable text fields',
			'High-resolution PNG download',
			'API for bulk generation',
			'No signup required'
		],
		creator: {
			'@type': 'Organization',
			name: 'Pictify.io',
			url: 'https://pictify.io'
		}
	});

	const faqSchemaJson = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((faq) => ({
			'@type': 'Question',
			name: faq.q,
			acceptedAnswer: {
				'@type': 'Answer',
				text: faq.a
			}
		}))
	});

	const breadcrumbSchemaJson = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pictify.io/' },
			{ '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://pictify.io/tools' },
			{ '@type': 'ListItem', position: 3, name: 'Certificate Generator' }
		]
	});

	onMount(() => {
		analytics.trackToolOpened({ tool_name: 'certificate_generator' });
	});
</script>

<svelte:head>
	<title>Free Certificate Generator Online | Create Custom Certificates | Pictify.io</title>
	<meta
		name="description"
		content="Create professional certificates for free with Pictify's interactive certificate generator. Choose from 5 beautiful templates, customize recipient names, dates, and achievements, and download as PNG."
	/>
	<meta
		name="keywords"
		content="certificate generator, free certificate maker, online certificate creator, custom certificates, certificate template, printable certificates, Pictify"
	/>
	<link rel="canonical" href="https://pictify.io/tools/certificate-generator" />

	<!-- Open Graph -->
	<meta
		property="og:title"
		content="Free Certificate Generator Online | Create Custom Certificates | Pictify.io"
	/>
	<meta
		property="og:description"
		content="Create professional certificates for free. Choose from 5 beautiful templates, customize text, and download as high-resolution PNG."
	/>
	<meta property="og:url" content="https://pictify.io/tools/certificate-generator" />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://media.pictify.io/qyl7z-1775406830860.png" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@pictify_io" />
	<meta
		name="twitter:title"
		content="Free Certificate Generator Online | Pictify.io"
	/>
	<meta
		name="twitter:description"
		content="Create professional certificates for free. Choose from 5 beautiful templates, customize text, and download as high-resolution PNG."
	/>
	<meta name="twitter:image" content="https://media.pictify.io/qyl7z-1775406830860.png" />

	{@html `<script type="application/ld+json">${structuredDataJson}</script>`}
	{@html `<script type="application/ld+json">${faqSchemaJson}</script>`}
	{@html `<script type="application/ld+json">${breadcrumbSchemaJson}</script>`}
</svelte:head>

<section class="w-full min-h-screen bg-[#FFFDF8] relative overflow-x-hidden font-['Manrope']">
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
		class="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-24 md:pb-32 relative z-10"
	>
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
				<li class="text-gray-900">Certificate Generator</li>
			</ol>
		</nav>

		<!-- Hero Section -->
		<div
			class="relative flex flex-col items-center justify-center text-center mb-8 sm:mb-12 lg:mb-16 pt-4 sm:pt-10"
		>
			<!-- Badge -->
			<div
				class="inline-flex transform -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-default mb-4 sm:mb-8"
			>
				<div
					class="px-4 sm:px-6 py-1.5 sm:py-2 bg-[#ffc480] border-[3px] sm:border-[4px] border-black text-black font-black text-xs sm:text-sm md:text-base uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					Free Tool
				</div>
			</div>

			<!-- Main Title -->
			<h1
				class="relative z-10 text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-tight mb-4 sm:mb-8"
			>
				<span class="block sm:inline">CERTIFICATE</span>
				<span class="relative inline-block text-white mt-1 sm:mt-2 md:mt-0 md:ml-3">
					<span class="relative z-10 px-2 sm:px-3 md:px-4">GENERATOR</span>
					<span
						class="absolute inset-0 bg-[#ff6b6b] transform -skew-x-3 border-[3px] sm:border-[4px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] -z-0"
					/>
				</span>
			</h1>

			<!-- Description -->
			<div class="max-w-2xl mx-auto px-2">
				<p
					class="text-base sm:text-lg md:text-xl text-gray-800 font-bold leading-relaxed border-[3px] border-black bg-white p-4 sm:p-6 shadow-[4px_4px_0_0_#e5e7eb] sm:shadow-[8px_8px_0_0_#e5e7eb]"
				>
					Create <span class="bg-[#ffc480] px-1 border-b-[2px] sm:border-b-[3px] border-black"
						>professional certificates</span
					>
					in seconds.
					<span class="text-gray-500 text-sm sm:text-base mt-2 sm:mt-3 block font-semibold"
						>5 beautiful templates with real-time preview and instant download</span
					>
				</p>
			</div>
		</div>

		<!-- Generation Limit Banner -->
		<GenerationLimitBanner toolName="certificate_generator" />

		<!-- Template Gallery -->
		<div class="max-w-5xl mx-auto mb-10 sm:mb-14">
			<h2 class="text-xl sm:text-2xl font-black mb-6 flex items-center gap-3">
				<span
					class="w-8 h-8 bg-[#ffc480] border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_0_#000]"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
						/></svg
					>
				</span>
				CHOOSE A TEMPLATE
			</h2>

			<div class="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
				{#each certificateTemplates as template}
					<button
						class="flex-shrink-0 w-44 bg-white border-[3px] {selectedTemplate.id === template.id
							? 'border-[#ff6b6b] shadow-[6px_6px_0_0_#ff6b6b]'
							: 'border-black shadow-[4px_4px_0_0_#000]'} p-3 overflow-hidden hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer rounded-xl relative"
						on:click={() => selectTemplate(template)}
					>
						{#if selectedTemplate.id === template.id}
							<div
								class="absolute top-2 right-2 z-10 w-6 h-6 bg-[#ff6b6b] border-[2px] border-black flex items-center justify-center rounded-full"
							>
								<span class="text-white font-black text-sm">&#10003;</span>
							</div>
						{/if}
						<div
							class="w-full h-20 rounded-lg mb-2 border-[2px] border-gray-200"
							style="background-color: {template.thumbnailColor};"
						/>
						<span class="text-xs font-black text-gray-900 uppercase tracking-wide block text-center"
							>{template.name}</span
						>
						<span class="text-[10px] text-gray-500 font-medium block text-center mt-0.5 line-clamp-1"
							>{template.description}</span
						>
					</button>
				{/each}
			</div>
		</div>

		<!-- Main Editor Stack -->
		<div class="max-w-4xl mx-auto flex flex-col gap-6 sm:gap-8 items-stretch mb-10">
			<!-- Left Column: Form -->
			<div
				class="bg-white border-[3px] border-black shadow-[6px_6px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] overflow-hidden rounded-xl"
			>
				<!-- Terminal Header -->
				<div
					class="bg-black text-white px-4 py-3 flex justify-between items-center border-b-[3px] border-black"
				>
					<h2 class="font-bold font-mono tracking-widest text-xs uppercase flex items-center gap-2">
						<span class="animate-pulse">_</span> CERTIFICATE DETAILS
					</h2>
					<div class="flex gap-2">
						<div class="w-3 h-3 bg-[#ff6b6b] border border-black" />
						<div class="w-3 h-3 bg-[#ffc480] border border-black" />
						<div class="w-3 h-3 bg-[#4ade80] border border-black" />
					</div>
				</div>

				<div class="p-4 sm:p-6 space-y-5">
					<!-- Recipient Name -->
					<div class="space-y-2">
						<h3
							class="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2"
						>
							<span
								class="w-6 h-6 bg-[#ffc480] border-[2px] border-black flex items-center justify-center text-xs"
								>1</span
							>
							Recipient Name
						</h3>
						<input
							bind:value={formValues.recipientName}
							type="text"
							class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none rounded-lg"
							placeholder="John Doe"
						/>
					</div>

					<!-- Organization Name -->
					<div class="space-y-2">
						<h3
							class="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2"
						>
							<span
								class="w-6 h-6 bg-[#60a5fa] border-[2px] border-black flex items-center justify-center text-xs text-white"
								>2</span
							>
							Organization Name
						</h3>
						<input
							bind:value={formValues.organizationName}
							type="text"
							class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none rounded-lg"
							placeholder="Your Organization"
						/>
					</div>

					<!-- Date -->
					<div class="space-y-2">
						<h3
							class="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2"
						>
							<span
								class="w-6 h-6 bg-[#a78bfa] border-[2px] border-black flex items-center justify-center text-xs text-white"
								>3</span
							>
							Date
						</h3>
						<input
							bind:value={formValues.date}
							type="text"
							class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none rounded-lg"
							placeholder="April 13, 2026"
						/>
					</div>

					<!-- Achievement Text -->
					<div class="space-y-2">
						<h3
							class="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2"
						>
							<span
								class="w-6 h-6 bg-[#ff6b6b] border-[2px] border-black flex items-center justify-center text-xs text-white"
								>4</span
							>
							Achievement
						</h3>
						<textarea
							bind:value={formValues.achievementText}
							class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none resize-none rounded-lg"
							placeholder="for successfully completing the Advanced Training Program"
							rows="3"
						/>
					</div>

					<!-- Open Editor Button -->
					<button
						type="button"
						on:click={openInCanvasEditor}
						class="w-full py-3 bg-[#4ade80] text-gray-900 border-[3px] border-gray-900 font-black text-sm uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 rounded-xl"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
							/></svg
						>
						Open Full Editor
					</button>
				</div>
			</div>

			<!-- Right Column: Canvas Preview -->
			<div class="space-y-4 sm:space-y-6">
				<div
					class="bg-white border-[3px] border-black shadow-[6px_6px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] overflow-hidden rounded-xl"
				>
					<!-- Preview Header -->
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
							<span class="px-2 py-0.5 bg-[#4ade80]/20 border border-[#4ade80] rounded text-gray-700">Interactive Editor</span>
							{selectedTemplate.width} x {selectedTemplate.height}px
						</div>
					</div>

					<!-- Interactive Mini-Editor Preview -->
					<div
						class="p-4 sm:p-6 bg-gray-100 flex flex-col items-center justify-center relative min-h-[300px]"
					>
						<div
							class="absolute inset-0 opacity-10"
							style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;"
						/>

						<div class="relative z-10 flex flex-col items-center w-full max-w-[640px] mx-auto">
							{#if selectedTemplate?.fabricJSData}
								<MiniEditor
									bind:this={miniEditorRef}
									fabricJSData={selectedTemplate.fabricJSData}
									width={selectedTemplate.width}
									height={selectedTemplate.height}
								/>
							{:else}
								<div class="w-full h-[315px] flex items-center justify-center bg-gray-50 border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937]">
									<p class="font-bold text-gray-400">Preview not available</p>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Generate Button -->
				<button
					on:click={handleGenerate}
					disabled={isGenerating}
					class="w-full bg-[#ff6b6b] hover:bg-[#ff5252] text-white px-6 py-4 border-[3px] border-black shadow-[6px_6px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all font-black uppercase tracking-wide flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg rounded-xl"
				>
					{#if isGenerating}
						<svg
							class="animate-spin h-5 w-5"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
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
						GENERATING...
					{:else}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/></svg
						>
						GENERATE CERTIFICATE
					{/if}
				</button>
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
						Your certificate is ready!
					</h3>

					<div
						class="inline-block bg-white border-[3px] border-gray-900 p-2 shadow-[8px_8px_0_0_#1f2937] rotate-1 mb-8"
					>
						<img
							src={generatedImageUrl}
							alt="Generated certificate"
							class="max-w-full h-auto max-h-[400px]"
						/>
					</div>

					<div class="flex flex-wrap justify-center gap-4">
						<a
							href={generatedImageUrl}
							download="certificate.png"
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
						<button
							on:click={openInCanvasEditor}
							class="px-6 py-3 bg-[#4ade80] text-gray-900 border-[3px] border-gray-900 font-bold uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl flex items-center gap-2"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
								/></svg
							>
							Edit in Full Editor
						</button>
					</div>
				</div>

				<div class="mt-12">
					<NextSteps
						heading="Now Automate It"
						description="You've proved it works. Now integrate certificate generation into your app."
						curlSnippet={apiSnippet}
						{templateDraft}
						generatedUrl={generatedImageUrl}
						generatedWidth={selectedTemplate.width}
						generatedHeight={selectedTemplate.height}
						generatedFormat="png"
						toolName="Certificate Generator"
					/>
				</div>
			</div>
		{:else if generationError}
			<div class="max-w-3xl mx-auto px-4 mb-12">
				<div
					class="bg-red-50 border-[3px] border-red-500 rounded-2xl p-6 flex items-center gap-4"
				>
					<div
						class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-500 text-red-500 font-black"
					>
						!
					</div>
					<div>
						<h4 class="font-black text-red-900 uppercase">Generation Failed</h4>
						<p class="text-red-700 font-medium">{generationError}</p>
					</div>
					<button on:click={handleGenerate} class="ml-auto underline font-bold text-red-900"
						>Retry</button
					>
				</div>
			</div>
		{/if}

		<!-- SEO Content Sections -->
		<div class="max-w-5xl mx-auto mt-16 sm:mt-20">
			<!-- Separator -->
			<div class="border-t-[3px] sm:border-t-[4px] border-black relative mb-8 sm:mb-12 lg:mb-16">
				<div class="absolute left-1/2 -top-4 sm:-top-5 -translate-x-1/2 bg-[#FFFDF8] px-4 sm:px-6">
					<div
						class="w-8 h-8 sm:w-10 sm:h-10 bg-[#ffc480] border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
					>
						<span class="font-black text-sm sm:text-lg">?</span>
					</div>
				</div>
			</div>

			<h2
				class="text-2xl sm:text-3xl md:text-5xl font-black mb-8 sm:mb-12 text-center text-gray-900 tracking-tighter px-2"
			>
				LEARN MORE ABOUT <br class="md:hidden" />
				<span class="relative inline-block text-white mt-2">
					<span class="relative z-10 px-2 sm:px-4">CERTIFICATES</span>
					<span
						class="absolute inset-0 bg-[#ff6b6b] transform -skew-x-2 border-[3px] sm:border-[4px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] -z-0"
					/>
				</span>
			</h2>

			<!-- What is Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#ffc480] border-[3px] border-black text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/></svg
					>
					Overview
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 text-black tracking-tight"
				>
					What is a Certificate Generator?
				</h3>
				<p class="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
					A certificate generator is a tool that lets you create professional, customizable certificates for any occasion.
					Whether you need certificates for course completions, employee awards, event attendance, or academic achievements,
					a certificate generator streamlines the process from design to download. Instead of spending hours in graphic
					design software, you can select a template, fill in the details, and generate a print-ready certificate in seconds.
				</p>
			</section>

			<!-- Benefits Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#4ade80] border-[3px] border-black text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
						/></svg
					>
					Benefits
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 text-black tracking-tight"
				>
					Why Use Our Certificate Generator?
				</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{#each ['5 professionally designed certificate templates', 'Real-time interactive canvas preview', 'Customize recipient name, organization, date, and achievement', 'High-resolution 1920x1080px PNG output', 'API available for bulk certificate generation', 'No signup required to get started'] as benefit}
						<div
							class="bg-[#f8f8f8] border-[3px] border-black p-3 shadow-[3px_3px_0_0_#000] flex items-center gap-3 hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						>
							<span class="font-black text-[#4ade80]">&#10003;</span>
							<span class="font-bold text-black text-sm">{benefit}</span>
						</div>
					{/each}
				</div>
			</section>

			<!-- How to Use Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#60a5fa] border-[3px] border-black text-white text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
						/><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					Guide
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 text-black tracking-tight"
				>
					How to Create a Certificate
				</h3>
				<div class="space-y-4">
					{#each [{ num: '1', text: 'Choose a certificate template from the gallery above' }, { num: '2', text: 'Enter the recipient name, organization, date, and achievement' }, { num: '3', text: 'Preview your certificate in the interactive canvas editor' }, { num: '4', text: 'Click any text on the canvas to make direct edits' }, { num: '5', text: 'Click "Generate Certificate" to create a high-resolution PNG' }, { num: '6', text: 'Download your certificate or open it in the full editor for further customization' }] as step}
						<div class="flex items-start gap-4">
							<span
								class="bg-[#60a5fa] text-white w-8 h-8 flex items-center justify-center font-black flex-shrink-0 border-[3px] border-black shadow-[2px_2px_0_0_#000]"
								>{step.num}</span
							>
							<span class="font-bold text-black text-sm pt-1">{step.text}</span>
						</div>
					{/each}
				</div>
			</section>

			<!-- FAQ Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#ff6b6b] border-[3px] border-black text-white text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					FAQ
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 text-black tracking-tight"
				>
					Frequently Asked Questions
				</h3>
				<div class="space-y-3">
					{#each faqs as faq}
						<details
							class="group bg-[#f8f8f8] border-[3px] border-black overflow-hidden shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						>
							<summary
								class="flex items-center justify-between cursor-pointer p-4 font-bold text-black select-none text-sm"
							>
								<span>{faq.q}</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-black group-open:rotate-180 transition-transform duration-300 flex-shrink-0"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							</summary>
							<div class="p-4 pt-0 text-gray-600 border-t-[3px] border-black bg-white text-sm">
								{faq.a}
							</div>
						</details>
					{/each}
				</div>
			</section>

			<!-- Open in Editor CTA -->
			<section class="mb-12 sm:mb-16 text-center">
				<div
					class="bg-gray-900 border-[3px] border-black rounded-3xl p-8 sm:p-12 relative overflow-hidden"
				>
					<div
						class="absolute top-0 right-0 w-40 h-40 bg-[#ffc480]/20 rounded-full blur-2xl pointer-events-none"
					/>
					<div
						class="absolute bottom-0 left-0 w-32 h-32 bg-[#ff6b6b]/20 rounded-full blur-2xl pointer-events-none"
					/>

					<h3
						class="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-4 relative z-10"
					>
						Need More Customization?
					</h3>
					<p class="text-gray-400 font-bold mb-8 max-w-lg mx-auto relative z-10">
						Open your certificate in our full canvas editor to add logos, custom images, QR codes,
						and fine-tune every design detail.
					</p>
					<button
						type="button"
						on:click={openInCanvasEditor}
						class="px-8 py-4 bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 font-black text-lg uppercase tracking-wide shadow-[6px_6px_0_0_#ffc480] hover:shadow-[3px_3px_0_0_#ffc480] hover:translate-x-[3px] hover:translate-y-[3px] transition-all inline-flex items-center gap-3 rounded-2xl relative z-10"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
							/></svg
						>
						Open Full Editor — Free
					</button>
				</div>
			</section>
		</div>
	</main>

	<RelatedTools tools={['badge', 'course-certificate', 'receipt', 'event-ticket']} />

	<Footer />
</section>
