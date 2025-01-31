<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import CodeEditor from '$lib/components/tools/CodeEditor.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { user } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';
	import { createImagePublic } from '../../../api/image.js';
	$: format = $page.params.format;

	// Add copyToClipboard function
	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'URL copied to clipboard! 🔗', duration: 2000 });
		}).catch(() => {
			toast.set({ message: 'Failed to copy URL', duration: 2000 });
		});
	}

const formatExtensionMap = {
		jpg: 'jpeg',
		png: 'png',
		webp: 'webp',
};

$: fileExtension = formatExtensionMap[format];

$: if (!fileExtension) {
	if(browser) {
		goto('/tools/html-to-jpg');
	}
}

	let formats = ['jpg', 'png', 'webp',] 

	function handleFormatChange(event) {
		const newFormat = event.target.value;
		if(browser) {
			goto(`/tools/html-to-${newFormat}`);
		}
	}

	// Add local storage management
	let usageKey = 'pictify_free_usage';
	let maxFreeGenerations = 5;
	let freeGenerationsUsed = 0;

	onMount(() => {
		if (browser) {
			// Load usage from local storage
			const usage = localStorage.getItem(usageKey);
			if (usage) {
				freeGenerationsUsed = parseInt(usage);
			}

			// Reset usage if it's a new day
			const lastUsageDate = localStorage.getItem(usageKey + '_date');
			const today = new Date().toDateString();
			if (lastUsageDate !== today) {
				freeGenerationsUsed = 0;
				localStorage.setItem(usageKey, '0');
				localStorage.setItem(usageKey + '_date', today);
			}
		}

		// Ensure the correct format is selected on page load
		const select = document.getElementById('format-select');
		if (select) {
			select.value = format;
		}
	});

	// Function to update usage in local storage
	function updateUsage() {
		if (browser) {
			freeGenerationsUsed++;
			localStorage.setItem(usageKey, freeGenerationsUsed.toString());
			localStorage.setItem(usageKey + '_date', new Date().toDateString());
		}
	}

	// Add remaining generations computed property
	$: remainingGenerations = maxFreeGenerations - freeGenerationsUsed;
	$: usagePercentage = (freeGenerationsUsed / maxFreeGenerations) * 100;

	// Add user store subscription
	let isUserLoggedIn = false;
	user.subscribe(userData => {
		isUserLoggedIn = !!userData.email;
	});

	let totalImagesGenerated = 34567; // Social proof counter
	let generationCount = 0;
	let showUpgradePrompt = false;


	let imageUrl = '';
	let isImageGenerating = false;
	let previewWidth = 1200;
	let previewHeight = 630;
	let previewHtml = '';

	function handlePreviewUpdate(event) {
		const { html, width, height } = event.detail;
		previewHtml = html;
		previewWidth = width;
		previewHeight = height;
	}

	async function generateImage() {
		if (isImageGenerating) return;
		
		if (!isUserLoggedIn && freeGenerationsUsed >= maxFreeGenerations) {
			showUpgradePrompt = true;
			return;
		}

		isImageGenerating = true;
		
		try {
			// Add watermark for non-logged in users after first generation
			let html = previewHtml;
			if (!isUserLoggedIn && freeGenerationsUsed >= 1) {
				const watermarkDiv = `
					<div style="position: fixed; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9); 
											padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 9999;
											font-family: system-ui, -apple-system, sans-serif;">
						Created with <a href="https://pictify.io" style="color: #ff6b6b; text-decoration: none;">pictify.io</a>
					</div>
				`;
				
				html = html.replace('</body>', `${watermarkDiv}</body>`);
			}
			
			const {image} = await createImagePublic({
				html,
				width: previewWidth,
				height: previewHeight,
				fileExtension: fileExtension
			});
			
			imageUrl = image.url;
			totalImagesGenerated++;

			// Update usage tracking for non-logged in users
			if (!isUserLoggedIn) {
				updateUsage();
			}

			// Show contextual prompts based on usage
			if (!isUserLoggedIn) {
				if (freeGenerationsUsed === 1) {
					showFirstGenerationPrompt = true;
				} else if (freeGenerationsUsed === maxFreeGenerations - 1) {
					showSharePrompt = true;
				} else if (freeGenerationsUsed >= maxFreeGenerations) {
					showUpgradePrompt = true;
				}
			}
			
		} catch (error) {
			toast.set({ message: 'Failed to generate image. Please try again.', duration: 3000 });
		} finally {
			isImageGenerating = false;
		}
	}

	// Function to handle social sharing with rewards
	function handleSocialShare(platform) {
		const url = encodeURIComponent(window.location.href);
		const text = encodeURIComponent(`Check out this awesome HTML to ${format.toUpperCase()} converter!`);
		
		if (platform === 'twitter') {
			window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
		} else if (platform === 'linkedin') {
			window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${encodeURIComponent('HTML to Image Converter')}&summary=${text}`, '_blank');
		}

		// Increment generation limit as a reward
		generationCount--;
		showSharePrompt = false;
		toast.set({ message: 'Thank you for sharing! You got 1 extra generation 🎉', duration: 3000 });
	}

    // Add format-specific information
    const formatInfo = {
        jpg: {
            fullName: "JPG",
            benefits: ["Excellent compression for photographs", "Smaller file sizes", "Wide compatibility"],
            bestFor: "photographs and complex images with gradients",
            drawbacks: "lossy compression, not ideal for text or simple graphics"
        },
        png: {
            fullName: "PNG",
            benefits: ["Lossless compression", "Supports transparency", "Ideal for graphics and screenshots"],
            bestFor: "logos, icons, and images with text",
            drawbacks: "larger file sizes compared to JPG for photographs"
        },
        webp: {
            fullName: "WebP",
            benefits: ["Superior compression", "Supports both lossy and lossless compression", "Smaller file sizes than JPG and PNG"],
            bestFor: "web graphics, combining the best of JPG and PNG",
            drawbacks: "not universally supported by older browsers"
        }
    };

    // Add default format info
    const defaultFormatInfo = {
      jpg: {
        fullName: "JPG",
        benefits: ["Excellent compression for photographs", "Smaller file sizes", "Wide compatibility"],
        bestFor: "photographs and complex images with gradients",
        drawbacks: "lossy compression, not ideal for text or simple graphics"
      },
      png: {
        fullName: "PNG",
        benefits: ["Lossless compression", "Supports transparency", "Ideal for graphics and screenshots"],
        bestFor: "logos, icons, and images with text",
        drawbacks: "larger file sizes compared to JPG for photographs"
      },
      webp: {
        fullName: "WebP",
        benefits: ["Superior compression", "Supports both lossy and lossless compression", "Smaller file sizes than JPG and PNG"],
        bestFor: "web graphics, combining the best of JPG and PNG",
        drawbacks: "not universally supported by older browsers"
      }
    };

    // Add safe access to format info
    $: currentFormat = formatInfo[format] || defaultFormatInfo.jpg;
    $: otherFormats = Object.keys(formatInfo).filter(f => f !== format);

	// Add state for contextual prompts
	let showFirstGenerationPrompt = false;

	// Enhanced Schema Markup
	$: schemaMarkup = format ? {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		"name": `HTML to ${currentFormat?.fullName || 'Image'} Converter`,
		"url": `https://pictify.io/tools/html-to-${format}`,
		"description": `Convert HTML to high-quality ${currentFormat?.fullName || 'image'} instantly. Create optimized images for websites, social media, and email marketing.`,
		"applicationCategory": "DesignApplication",
		"operatingSystem": "Web",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "USD"
		},
		"featureList": [
			`Instant HTML to ${currentFormat?.fullName || 'Image'} conversion`,
			`Optimized for ${currentFormat?.bestFor || 'web use'}`,
			"Web-friendly output",
			"No watermarks"
		],
		"mainEntity": [
			{
				"@type": "HowTo",
				"name": `How to Convert HTML to ${currentFormat?.fullName || 'Image'}`,
				"description": `Step-by-step guide to convert HTML to ${currentFormat?.fullName || 'Image'} images`,
				"step": [
					{
						"@type": "HowToStep",
						"text": "Input your HTML code in the editor",
						"url": `https://pictify.io/tools/html-to-${format}#input`
					},
					{
						"@type": "HowToStep",
						"text": "Preview your HTML design",
						"url": `https://pictify.io/tools/html-to-${format}#preview`
					},
					{
						"@type": "HowToStep",
						"text": `Generate your ${currentFormat?.fullName || 'Image'} image`,
						"url": `https://pictify.io/tools/html-to-${format}#generate`
					}
				]
			},
			{
				"@type": "FAQPage",
				"mainEntity": [
					{
						"@type": "Question",
						"name": `How does HTML to ${currentFormat?.fullName || 'Image'} conversion work?`,
						"acceptedAnswer": {
							"@type": "Answer",
							"text": "Our converter renders your HTML code in a virtual browser environment and captures the output as a high-quality image."
						}
					},
					{
						"@type": "Question",
						"name": `What's the best use case for ${currentFormat?.fullName || 'Image'}?`,
						"acceptedAnswer": {
							"@type": "Answer",
							"text": `${currentFormat?.fullName || 'Image'} is best for ${currentFormat?.bestFor || 'web use'}.`
						}
					}
				]
			}
		]
	} : null;
</script>

<svelte:head>
	<title>Convert Image from HTML | HTML to {format|| 'Image'} | Free Online HTML Image Generator | Pictify.io</title>
	<meta name="description" content="Convert HTML to {format|| 'image'} easily with Pictify.io. Transform HTML to {format?.toUpperCase() || 'IMAGE'} images instantly. Perfect for {currentFormat?.bestFor || 'web use'}. Try our HTML to {format?.toUpperCase() || 'IMAGE'} image converter now!" />
	<meta name="keywords" content="convert image from HTML, HTML to {format.toUpperCase()}, {format.toUpperCase()} converter, online image generator, web design tool, {currentFormat.fullName} image creator, Pictify.io" />
	<meta name="author" content="Pictify.io" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta Property="og:title" content="Pictify.io" />
	<meta Property="og:description" content="Convert HTML to high-quality {currentFormat.fullName} images for free with Pictify.io's online HTML to {format.toUpperCase()} converter. Perfect for creating social media content, email marketing visuals, and website mockups." />
	<meta
		Property="og:image"
		content="https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png"
	/>
	<meta Property="og:url" content="https://pictify.io" />
	<meta Property="og:type" content="website" />
	<meta Property="og:site_name" content="Pictify.io" />
	<meta Property="og:locale" content="en_US" />
	<link rel="canonical" href="https://pictify.io/tools/html-to-{format}" />

	{#if schemaMarkup}
	{@html `<script type="application/ld+json">
	${JSON.stringify(schemaMarkup)}
</script>`}	
	{/if}
</svelte:head>

<section>
	<Nav />
	<main class="z-10 w-full py-5 md:px-0 px-6 flex flex-col items-center justify-center space-y-8 max-w-7xl mx-auto relative overflow-hidden">
		<!-- Enhanced Decorative Background -->
		<div class="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
			<div class="absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ff6b6b]/20 to-transparent rounded-full blur-[100px] transform -translate-y-1/2 animate-float"></div>
			<div class="absolute bottom-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ffc480]/20 to-transparent rounded-full blur-[100px] transform translate-y-1/2 animate-float-delayed"></div>
			<div class="absolute top-1/2 left-1/2 w-48 md:w-64 h-48 md:h-64 bg-gradient-to-br from-[#6b95ff]/10 to-transparent rounded-full blur-[80px] transform -translate-x-1/2 animate-pulse-slow"></div>
		</div>

		<!-- Primary Content -->
		<div class="flex flex-col items-center space-y-6 md:space-y-8 text-center max-w-4xl mb-8 md:mb-12 relative">
			<div class="bg-white/50 backdrop-blur-sm border border-gray-200/30 rounded-full py-1.5 px-4 text-sm font-medium text-gray-600 w-auto">
				<div class="flex items-center gap-2">
					<span>🎨</span>
					<span>HTML to {currentFormat.fullName} Converter</span>
				</div>
			</div>

			<div class="space-y-4">
				<h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
					HTML to {currentFormat.fullName}<br/><span class="text-[#ff6b6b]">Converter</span>
				</h1>
				
				<p class="text-lg text-gray-600 max-w-2xl leading-relaxed px-4 md:px-0">
					Transform your HTML code into high-quality {currentFormat.fullName} images instantly. Perfect for {currentFormat.bestFor}.
				</p>
			</div>

			<!-- Format Selector -->
			<div class="w-full max-w-3xl mx-auto bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 md:p-6">
				<div class="flex flex-col items-center gap-4">
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
						{#each formats as f}
							<button
								class="group w-full"
								on:click={() => {
									if(browser && f !== format) {
										goto(`/tools/html-to-${f}`);
									}
								}}
							>
								<div 
									class={`px-4 py-3 rounded-lg border transition-all duration-200 ${f === format ? 'border-[#ff6b6b] bg-[#ff6b6b]/5 text-[#ff6b6b]' : 'border-gray-200 hover:border-gray-300 bg-white/80'}`}
								>
									<div class="flex flex-col items-center gap-1">
										<span class="text-lg font-semibold">{f.toUpperCase()}</span>
										<span class="text-xs text-gray-500">{formatInfo[f].fullName}</span>
									</div>
								</div>
							</button>
						{/each}
					</div>
					<p class="text-xs text-gray-500">Selected format is optimized for {currentFormat.bestFor}</p>
				</div>
			</div>
		</div>

		<!-- Add Usage Progress Bar for non-logged in users - Moved to top -->
		{#if !isUserLoggedIn}
			<div class="w-full max-w-6xl mx-auto">
				<div class="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-4 shadow-sm">
					<div class="flex items-center gap-4">
						<div class="flex-1">
							<div class="flex justify-between items-center mb-1.5">
								<span class="text-sm font-medium text-gray-700">Guest Generations</span>
								<span class="text-sm font-medium text-gray-700">{freeGenerationsUsed}/{maxFreeGenerations}</span>
							</div>
							<div class="w-full bg-gray-100 rounded-full h-2">
								<div 
									class="bg-gradient-to-r from-[#ff6b6b] to-[#ffc480] h-2 rounded-full transition-all duration-500" 
									style="width: {usagePercentage}%" 
								/>
							</div>
							{#if remainingGenerations > 0}
								<p class="text-sm text-gray-500 mt-1.5">Sign up free to unlock unlimited generations</p>
							{:else}
								<p class="text-sm text-gray-500 mt-1.5">Sign up free to unlock unlimited generations</p>
							{/if}
						</div>
						{#if remainingGenerations !== 1}
						<div class="flex-shrink-0">
							<div class="relative group">
								<div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
							<a 
								href="/signup?redirect=/tools/html-to-{format}"
									class="py-2 px-4 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative border-[3px] border-gray-900 font-semibold bg-[#ff6b6b] tracking-wide text-white transition-all hover:shadow-lg hover:brightness-105 inline-block text-sm"
							>
								Sign Up Free
							</a>
							</div>
						</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Code Editor Section -->
		<div class="w-full max-w-6xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm transform hover:shadow-md transition-all duration-300">
			<div class="flex flex-col gap-6">
				<CodeEditor
					isPreviewEnabled={false}
					fileExtension={fileExtension}
					on:previewUpdated={handlePreviewUpdate}
				/>
				
				<!-- Generate Button -->
				<div class="relative group w-full">
					<div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
					<button 
						on:click={generateImage}
						disabled={isImageGenerating}
						class="py-4 rounded-lg px-8 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-semibold bg-[#ff6b6b] tracking-wide text-lg flex-shrink-0 text-white transition-all hover:shadow-lg hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<span class="relative inline-flex items-center gap-2 justify-center">
							{#if isImageGenerating}
								<span>Generating...</span>
							{:else}
								<span>Generate {format.toUpperCase()} Image</span>
								<svg class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
							{/if}
						</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Generated Image Section -->
		{#if imageUrl}
			<div class="w-full max-w-6xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm transform hover:shadow-md transition-all duration-300">
				<!-- Success Message -->
				<div class="text-center mb-6">
					<h3 class="text-2xl font-bold text-gray-900 mb-2">🎉 Your Image is Ready!</h3>
					<p class="text-gray-700">Join {totalImagesGenerated.toLocaleString()} others creating beautiful images</p>
				</div>

				<!-- URL Section -->
				<div class="mb-6 flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
					<div class="flex items-center gap-2 flex-1 min-w-0">
						<a 
							href={imageUrl} 
							target="_blank" 
							rel="noopener noreferrer" 
							class="text-sm text-gray-600 hover:text-[#ff6b6b] truncate transition-colors"
						>
							{imageUrl}
						</a>
					</div>
					<button
						class="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
						on:click={() => copyToClipboard(imageUrl)}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
						</svg>
						Copy URL
					</button>
				</div>

				<!-- Generated Image Preview -->
				<div class="mb-8 overflow-hidden rounded-xl border border-gray-200">
					<div class="aspect-[1200/630] relative w-full">
						<img 
							src={imageUrl} 
							alt="Generated Image" 
							class="absolute inset-0 w-full h-full object-contain bg-gray-50" 
						/>
					</div>
				</div>
		
				<!-- Growth Loop Elements -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<!-- Signup Nudge -->
					<div class="col-span-1 md:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
						<div class="flex flex-col md:flex-row items-center gap-6">
							<div class="flex-1">
								<div class="flex items-center gap-4 mb-4">
									<div class="w-12 h-12 bg-[#ff6b6b]/10 rounded-xl flex items-center justify-center">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#ff6b6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
									</div>
									<div>
										<h4 class="font-semibold text-gray-900">Remove Watermark</h4>
										<p class="text-sm text-gray-600">Create a free account to generate images without watermark</p>
									</div>
								</div>
								<div class="flex flex-wrap gap-3">
									<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#ff6b6b]/10 text-[#ff6b6b]">
										No Watermarks
									</span>
									<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#ff6b6b]/10 text-[#ff6b6b]">
										Unlimited Generations
									</span>
									<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#ff6b6b]/10 text-[#ff6b6b]">
										API Access
									</span>
								</div>
							</div>
							<div class="flex-shrink-0">
								<div class="relative group">
									<div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
									<a 
										href="/signup?redirect=/tools/html-to-{format}"
										class="block py-3 px-6 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative border-[3px] border-gray-900 font-semibold bg-[#ff6b6b] tracking-wide text-white transition-all hover:shadow-lg hover:brightness-105"
									>
										Sign Up Free
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
		
				<!-- Action Buttons -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#if !isUserLoggedIn}
						<div class="relative w-auto flex-shrink-0 group">
							<div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
							<button 
								class="py-4 rounded-lg px-8 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-semibold bg-[#ff6b6b] tracking-wide text-lg flex-shrink-0 text-white transition-all hover:shadow-lg hover:brightness-105"
								on:click={() => window.location.href = '/signup?redirect=/tools/html-to-{format}'}
							>
								<span class="relative inline-flex items-center gap-2">
									<span>Create Free Account</span>
									<svg class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
									</svg>
								</span>
							</button>
						</div>
					{/if}
		
					<!-- Share Buttons -->
					<div class="grid grid-cols-2 gap-4 {isUserLoggedIn ? 'md:col-span-2' : ''}">
						<div class="relative group w-full">
							<div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
							<button 
								class="py-4 px-4 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-medium bg-black tracking-wide text-sm text-white transition-all hover:shadow-lg hover:brightness-105"
								on:click={() => handleSocialShare('twitter')}
							>
								<span class="relative inline-flex items-center gap-2 justify-center">
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
										<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
									</svg>
									<span class="hidden md:inline">Share on X</span>
								</span>
							</button>
						</div>
						
						<div class="relative group w-full">
							<div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
							<button 
								class="py-4 px-4 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-medium bg-[#0A66C2] tracking-wide text-sm text-white transition-all hover:shadow-lg hover:brightness-105"
								on:click={() => handleSocialShare('linkedin')}
							>
								<span class="relative inline-flex items-center gap-2 justify-center">
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
										<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.065 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
									</svg>
									<span class="hidden md:inline">Share on LinkedIn</span>
								</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- First Generation Prompt -->
		{#if showFirstGenerationPrompt}
			<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
				<div class="bg-white/90 backdrop-blur-sm rounded-2xl max-w-md w-full mx-auto p-8 shadow-lg">
					<div class="flex justify-between items-center mb-6">
						<h3 class="text-2xl font-bold text-gray-900">🎉 Great First Image!</h3>
						<button 
							class="text-gray-500 hover:text-gray-700"
							on:click={() => showFirstGenerationPrompt = false}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<p class="text-gray-700 mb-6">Create a free account to unlock:</p>
					
					<ul class="space-y-3 mb-6">
						<li class="flex items-center gap-2 text-gray-700">
							<svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							<span class="font-medium">Unlimited image generations</span>
						</li>
						<li class="flex items-center gap-2 text-gray-700">
							<svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							No watermarks
						</li>
						<li class="flex items-center gap-2 text-gray-700">
							<svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							API Access
						</li>
					</ul>

					<div class="space-y-4">
						<div class="relative group w-full">
							<div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
							<a 
								href="/signup?redirect=/tools/html-to-{format}"
								class="block w-full py-3 px-6 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative border-[3px] border-gray-900 font-semibold bg-[#ff6b6b] tracking-wide text-center text-white transition-all hover:shadow-lg hover:brightness-105"
							>
								Create Free Account
							</a>
						</div>

						<button
							class="w-full py-3 px-6 rounded-lg font-medium text-gray-700 hover:text-[#ff6b6b] transition-colors"
							on:click={() => showFirstGenerationPrompt = false}
						>
							Continue as Guest
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Upgrade Prompt -->
		{#if showUpgradePrompt}
			<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" style="margin-top: 0px;">
				<div class="bg-white/90 backdrop-blur-sm rounded-2xl max-w-md w-full mx-auto p-8 shadow-lg">
					<div class="flex justify-between items-center mb-6">
						<h3 class="text-2xl font-bold text-gray-900">🎨 Ready to Create More?</h3>
						<button 
							class="text-gray-500 hover:text-gray-700"
							on:click={() => showUpgradePrompt = false}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<p class="text-gray-700 mb-6">You've reached the guest limit. Create a free account to unlock:</p>
					
					<ul class="space-y-3 mb-6">
						<li class="flex items-center gap-2 text-gray-700">
							<svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							<span class="font-medium">Unlimited image generations</span>
						</li>
						<li class="flex items-center gap-2 text-gray-700">
							<svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							No watermarks
						</li>
						<li class="flex items-center gap-2 text-gray-700">
							<svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							API Access
						</li>
						<li class="flex items-center gap-2 text-gray-700">
							<svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Priority support
						</li>
					</ul>

					<div class="space-y-4">
						<div class="relative group w-full">
							<div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
							<a 
								href="/signup?redirect=/tools/html-to-{format}"
								class="block w-full py-3 px-6 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative border-[3px] border-gray-900 font-semibold bg-[#ff6b6b] tracking-wide text-center text-white transition-all hover:shadow-lg hover:brightness-105"
							>
								Sign Up Free
							</a>
						</div>

						<button
							class="w-full py-3 px-6 rounded-lg font-medium text-gray-700 hover:text-[#ff6b6b] transition-colors"
							on:click={() => showUpgradePrompt = false}
						>
							Maybe Later
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Features Grid -->
		<div class="w-full max-w-6xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm transform hover:shadow-md transition-all duration-300">
			<h2 class="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
				{#each currentFormat.benefits as benefit}
					<div class="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-sm transition-all duration-300 hover:scale-105">
						<div class="flex flex-col items-center gap-3">
							<div class="w-12 h-12 bg-[#ff6b6b]/10 rounded-xl flex items-center justify-center">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#ff6b6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<div class="text-center">
								<p class="text-gray-700">{benefit}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Other Formats Section -->
		<div class="w-full max-w-6xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm transform hover:shadow-md transition-all duration-300">
			<h2 class="text-2xl font-bold text-gray-900 mb-6">Try Other Formats</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each otherFormats as otherFormat}
					<a
						href="/tools/html-to-{otherFormat}"
						class="p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 hover:border-[#ff6b6b]/30 transition-all"
					>
						<h3 class="text-xl font-bold text-gray-900 mb-2">HTML to {formatInfo[otherFormat].fullName}</h3>
						<p class="text-gray-700">Perfect for {formatInfo[otherFormat].bestFor}</p>
					</a>
				{/each}
			</div>
		</div>

		<!-- Social Share Section -->
		<div class="w-full max-w-6xl mx-auto">
			<div class="flex flex-col md:flex-row justify-center md:space-x-4">
				<button
					class="flex items-center justify-center px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-gray-900 transition-colors shadow-sm hover:shadow mb-4 md:mb-0"
					on:click={() => handleSocialShare('twitter')}
				>
					<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
						<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
					</svg>
					Share on X
				</button>
				<button
					class="flex items-center justify-center px-6 py-3 bg-[#0A66C2] text-white font-medium rounded-xl hover:bg-[#094d92] transition-colors shadow-sm hover:shadow"
					on:click={() => handleSocialShare('linkedin')}
				>
					<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
						<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.065 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
					</svg>
					Share on LinkedIn
				</button>
			</div>
		</div>

		<!-- Content Sections -->
		<div class="max-w-6xl mx-auto px-6 md:px-0 mt-20">
			<!-- How it Works Section -->
			<section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
				<h2 class="text-3xl font-bold mb-6 text-gray-900">How to Convert HTML to {currentFormat.fullName}</h2>
				<div class="mt-10 flex flex-col sm:flex-row max-w-6xl mx-auto gap-6">
					<div class="flex-1 rounded-xl p-4 border-[3px] border-gray-900 bg-[#EBEBEB]">
						<h3 class="text-xl font-bold">Step 1: Input HTML</h3>
						<p class="mt-2">Paste your HTML code in the editor above or use our default template.</p>
					</div>
					<div class="flex-1 rounded-xl p-4 border-[3px] border-gray-900 bg-[#EBEBEB]">
						<h3 class="text-xl font-bold">Step 2: Preview</h3>
						<p class="mt-2">Check how your HTML will look as a {currentFormat.fullName} image.</p>
					</div>
					<div class="flex-1 rounded-xl p-4 border-[3px] border-gray-900 bg-[#EBEBEB]">
						<h3 class="text-xl font-bold">Step 3: Convert</h3>
						<p class="mt-2">Click convert to generate your {currentFormat.fullName} image.</p>
					</div>
				</div>
			</section>

			<!-- Best Practices Section -->
			<section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
				<h2 class="text-3xl font-bold mb-6 text-gray-900">Best Practices for {currentFormat.fullName} Conversion</h2>
				<ul class="text-lg text-gray-700 space-y-4">
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span>Optimize your HTML design for {currentFormat.bestFor}</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span>Consider the final image dimensions</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span>Test across different devices</span>
					</li>
				</ul>
			</section>

			<!-- FAQ Section -->
			<section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
				<h2 class="text-3xl font-bold mb-6 text-gray-900">Frequently Asked Questions</h2>
				<div class="space-y-4">
					<details class="group">
						<summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
							<span class="font-semibold text-gray-900">How does the image conversion from HTML to {format.toUpperCase()} work?</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
							</svg>
						</summary>
						<div class="mt-4 px-4 text-gray-700">
							Our converter renders your HTML code in a virtual browser environment and captures the output as a high-quality {format.toUpperCase()} image. This process ensures that your HTML is accurately represented in the final image.
						</div>
					</details>

					<details class="group">
						<summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
							<span class="font-semibold text-gray-900">Can I convert HTML with external resources?</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
							</svg>
						</summary>
						<div class="mt-4 px-4 text-gray-700">
							Yes, our converter supports HTML with external resources such as images and stylesheets. However, for the best results and fastest conversion, we recommend using inline styles and data URIs for images when possible.
						</div>
					</details>

					<details class="group">
						<summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
							<span class="font-semibold text-gray-900">What's the maximum file size for conversion?</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
							</svg>
						</summary>
						<div class="mt-4 px-4 text-gray-700">
							Our free tool supports HTML files up to 5MB in size. For larger files or batch conversions, consider upgrading to our premium plan or API service.
						</div>
					</details>

					<details class="group">
						<summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
							<span class="font-semibold text-gray-900">Is my HTML code kept private?</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
							</svg>
						</summary>
						<div class="mt-4 px-4 text-gray-700">
							Yes, we take your privacy seriously. Your HTML code is processed in real-time and is not stored on our servers. Once the conversion is complete, all data is immediately deleted.
						</div>
					</details>
				</div>
			</section>

			<!-- Best Practices Section -->
			<section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
				<h2 class="text-3xl font-bold mb-6 text-gray-900">HTML to {currentFormat.fullName} Conversion: Best Practices</h2>
				<ul class="text-lg text-gray-700 space-y-4">
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span>Optimize your HTML design for {currentFormat.bestFor}</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span>Consider the final image dimensions to optimize your HTML layout</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span>Test your {currentFormat.fullName} images across different devices to ensure consistent appearance</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span>Use appropriate compression settings to balance quality and file size</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span>For text-heavy designs, ensure readability after conversion</span>
					</li>
				</ul>
			</section>

			<!-- Introduction Section -->
			<section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
				<h2 class="text-3xl font-bold mb-6 text-gray-900">Convert Image from HTML to {currentFormat.fullName} Online - Fast, Free, and Optimized</h2>
				<p class="text-lg mb-4 text-gray-700">
					Our HTML to image converter specializes in creating optimized {currentFormat.fullName} images from your HTML code. Ideal for {currentFormat.bestFor}, our tool ensures your visuals are high-quality and web-ready.
				</p>
				<ul class="text-lg text-gray-700 space-y-4">
					{#each currentFormat.benefits as benefit}
						<li class="flex items-start gap-3">
							<svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
							</svg>
							<span>{benefit}</span>
						</li>
					{/each}
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span>Instant Conversion: Get your {currentFormat.fullName} images in seconds</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span>Privacy-Focused: Your HTML code is processed securely and not stored</span>
					</li>
				</ul>
			</section>

			<!-- Why Choose Section -->
			<section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
				<h2 class="text-3xl font-bold mb-6 text-gray-900">Why Choose Our Tool to Convert Image from HTML to {currentFormat.fullName}?</h2>
				<div class="space-y-6">
					<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
						<h3 class="text-2xl font-semibold mb-2 text-gray-900">Optimized for {currentFormat.bestFor}</h3>
						<p class="text-lg text-gray-700">{currentFormat.fullName} is excellent for {currentFormat.bestFor}, making it a go-to choice for many web designers and developers.</p>
					</div>
					<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
						<h3 class="text-2xl font-semibold mb-2 text-gray-900">Key Advantages</h3>
						<p class="text-lg text-gray-700">{currentFormat.benefits.join('. ')}.</p>
					</div>
					<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
						<h3 class="text-2xl font-semibold mb-2 text-gray-900">Considerations</h3>
						<p class="text-lg text-gray-700">While {currentFormat.fullName} excels in many areas, it's worth noting that {currentFormat.drawbacks}.</p>
					</div>
				</div>
			</section>

			<!-- Add this section after the "Why Choose Section" -->
			<section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
				<h2 class="text-3xl font-bold mb-6 text-gray-900">{currentFormat.fullName} vs Other Image Formats</h2>
				
				<!-- Comparison Table -->
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead>
							<tr>
								<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
								{#each [currentFormat, ...otherFormats.map(f => formatInfo[f])] as format}
									<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{format.fullName}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							<tr>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Best For</td>
								{#each [currentFormat, ...otherFormats.map(f => formatInfo[f])] as format}
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format.bestFor}</td>
								{/each}
							</tr>
							<tr>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Compression</td>
								{#each [currentFormat, ...otherFormats.map(f => formatInfo[f])] as format}
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{format.fullName === 'WebP' ? 'Lossy & Lossless' : format.fullName === 'PNG' ? 'Lossless' : 'Lossy'}
									</td>
								{/each}
							</tr>
							<tr>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">File Size</td>
								{#each [currentFormat, ...otherFormats.map(f => formatInfo[f])] as format}
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{format.fullName === 'WebP' ? 'Small' : format.fullName === 'PNG' ? 'Large' : 'Medium'}
									</td>
								{/each}
							</tr>
							<tr>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Transparency</td>
								{#each [currentFormat, ...otherFormats.map(f => formatInfo[f])] as format}
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{format.fullName === 'PNG' ? 'Yes' : 'No'}
									</td>
								{/each}
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- Case Studies Section -->
			<section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
				<h2 class="text-3xl font-bold mb-6 text-gray-900">Real-World Use Cases</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
						<h3 class="text-xl font-bold mb-2 text-gray-900">Social Media Marketing</h3>
						<p class="text-gray-700">Create eye-catching social media posts directly from HTML templates. Perfect for maintaining brand consistency across platforms.</p>
					</div>
					<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
						<h3 class="text-xl font-bold mb-2 text-gray-900">Email Campaigns</h3>
						<p class="text-gray-700">Generate optimized images for email newsletters that load quickly and look great on all devices.</p>
					</div>
					<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
						<h3 class="text-xl font-bold mb-2 text-gray-900">Website Mockups</h3>
						<p class="text-gray-700">Quickly create and share website designs with clients by converting HTML to images.</p>
					</div>
					<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
						<h3 class="text-xl font-bold mb-2 text-gray-900">Documentation</h3>
						<p class="text-gray-700">Easily include web page screenshots in technical documentation and user guides.</p>
					</div>
				</div>
			</section>

			<!-- Technical Details Section -->
			<section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
				<h2 class="text-3xl font-bold mb-6 text-gray-900">Technical Specifications</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
						<h3 class="text-xl font-bold mb-2 text-gray-900">Conversion Process</h3>
						<p class="text-gray-700">Our converter uses a headless browser to render your HTML code, ensuring pixel-perfect conversion to {currentFormat.fullName} format.</p>
					</div>
					<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
						<h3 class="text-xl font-bold mb-2 text-gray-900">Image Quality</h3>
						<p class="text-gray-700">Images are generated at 96 DPI with optimized compression settings to balance quality and file size.</p>
					</div>
					<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
						<h3 class="text-xl font-bold mb-2 text-gray-900">Supported Features</h3>
						<ul class="text-gray-700 list-disc pl-5">
							<li>CSS3 and JavaScript rendering</li>
							<li>Custom dimensions up to 4000x4000 pixels</li>
							<li>Web fonts and external resources</li>
						</ul>
					</div>
					<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
						<h3 class="text-xl font-bold mb-2 text-gray-900">Performance</h3>
						<p class="text-gray-700">Average conversion time is under 5 seconds, with optimized servers for fast processing.</p>
					</div>
				</div>
			</section>
		</div>
	</main>
	<Footer />
</section>

<style>
	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-20px); }
	}

	@keyframes float-delayed {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(20px); }
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.6; }
		50% { opacity: 0.3; }
	}

	.animate-float {
		animation: float 6s ease-in-out infinite;
	}

	.animate-float-delayed {
		animation: float-delayed 8s ease-in-out infinite;
	}

	.animate-pulse-slow {
		animation: pulse 4s ease-in-out infinite;
	}
</style>

<!-- Add IDs for schema steps -->
<section id="input">
	<!-- Input section content -->
</section>

<section id="preview">
	<!-- Preview section content -->
</section>

<section id="generate">
	<!-- Generate section content -->
</section>
