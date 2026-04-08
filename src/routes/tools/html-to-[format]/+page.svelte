<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import {
		popularSizes as configPopularSizes,
		useCases,
		useCaseDetails,
		ogPlatforms,
		dimensionContexts
	} from '$lib/pseo/config.js';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import CodeEditor from '$lib/components/tools/CodeEditor.svelte';
	import ApiCodeSection from '$lib/components/tools/ApiCodeSection.svelte';
	import GenerationLimitBanner from '$lib/components/tools/GenerationLimitBanner.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { user } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';
	import { createImagePublic } from '../../../api/image.js';
	import { generationLimits } from '../../../store/generationLimits.store';
	import { analytics } from '$lib/analytics.js';
	import RelatedTools from '$lib/components/tools/RelatedTools.svelte';
	import StickySignupBar from '$lib/components/tools/StickySignupBar.svelte';
	import PostSignupWelcome from '$lib/components/tools/PostSignupWelcome.svelte';
	import posthog from 'posthog-js';
	let stickyBar;
	$: format = $page.params.format;

	// Support optional size parameter from nested route: /tools/html-to-[format]/[dimensions]
	function parseDimensions(dim) {
		const match = (dim || '').toLowerCase().match(/^(\d+)x(\d+)$/);
		if (!match) return { width: null, height: null };
		const width = parseInt(match[1], 10);
		const height = parseInt(match[2], 10);
		if (Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) {
			return { width: null, height: null };
		}
		return { width, height };
	}

	$: rawDimensions = $page.params.dimensions;
	$: ({ width: dimWidth, height: dimHeight } = parseDimensions(rawDimensions));
	$: hasSize = !!(dimWidth && dimHeight);
	$: sizeString = hasSize ? `${dimWidth}x${dimHeight}` : '';
	$: dimensionContext = hasSize && sizeString ? dimensionContexts[sizeString] : null;

	// SEO head computed values (dimension-aware)
	$: headTitle = hasSize
		? `HTML to ${(currentFormat && currentFormat.fullName) || 'Image'} ${sizeString} | Pictify`
		: `HTML to ${(format && format.toUpperCase()) || 'Image'} Converter — Free Online | Pictify`;
	$: headDescription = hasSize
		? `Convert HTML to ${
				(currentFormat && currentFormat.fullName) || 'image'
		  } at ${sizeString} instantly. Perfect for ${
				(currentFormat && currentFormat.bestFor) || 'web use'
		  }.`
		: `Convert HTML to ${(format && format.toUpperCase()) || 'IMAGE'} images online for free. Create images from HTML code instantly — perfect for social cards, email headers, and automated workflows. API access included.`;
	$: canonicalUrl = hasSize
		? `https://pictify.io/tools/html-to-${format}/${sizeString}`
		: `https://pictify.io/tools/html-to-${format}`;
	$: ogDescription = hasSize
		? `Convert HTML to high-quality ${
				(currentFormat && currentFormat.fullName) || 'Image'
		  } ${sizeString} images for free with Pictify.io's online HTML to ${
				(format && format.toUpperCase && format.toUpperCase()) || ''
		  } converter.`
		: `Convert HTML to high-quality ${
				(currentFormat && currentFormat.fullName) || 'Image'
		  } images for free with Pictify.io's online HTML to ${
				(format && format.toUpperCase && format.toUpperCase()) || ''
		  } converter. Perfect for creating social media content, email marketing visuals, and website mockups.`;

	const htmlToImageExamples = [
		{
			id: 'javascript',
			label: 'JavaScript',
			fileName: 'render.js',
			code: `<span class="text-[#6a9955]">// Convert HTML to image with Pictify API</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">html</span> = <span class="text-[#ce9178]">'&lt;html&gt;&lt;body style="padding:48px"&gt;&lt;h1&gt;Hello World&lt;/h1&gt;&lt;/body&gt;&lt;/html&gt;'</span>;

<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">response</span> = <span class="text-[#c586c0]">await</span> <span class="text-[#dcdcaa]">fetch</span>(<span class="text-[#ce9178]">'https://api.pictify.io/image'</span>, {
  <span class="text-[#9cdcfe]">method</span>: <span class="text-[#ce9178]">'POST'</span>,
  <span class="text-[#9cdcfe]">headers</span>: { <span class="text-[#ce9178]">'Content-Type'</span>: <span class="text-[#ce9178]">'application/json'</span>, <span class="text-[#ce9178]">'Authorization'</span>: <span class="text-[#ce9178]">'Bearer YOUR_API_KEY'</span> },
  <span class="text-[#9cdcfe]">body</span>: <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">stringify</span>({ <span class="text-[#9cdcfe]">html</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">1200</span>, <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">630</span>, <span class="text-[#9cdcfe]">fileExtension</span>: <span class="text-[#ce9178]">'png'</span> })
});

<span class="text-[#c586c0]">const</span> { <span class="text-[#9cdcfe]">image</span> } = <span class="text-[#c586c0]">await</span> <span class="text-[#9cdcfe]">response</span>.<span class="text-[#dcdcaa]">json</span>();
<span class="text-[#9cdcfe]">console</span>.<span class="text-[#dcdcaa]">log</span>(<span class="text-[#9cdcfe]">image</span>.<span class="text-[#9cdcfe]">url</span>); <span class="text-[#6a9955]">// CDN-hosted image URL</span>`
		},
		{
			id: 'python',
			label: 'Python',
			fileName: 'render.py',
			code: `<span class="text-[#c586c0]">import</span> <span class="text-[#9cdcfe]">requests</span>

<span class="text-[#9cdcfe]">resp</span> = <span class="text-[#9cdcfe]">requests</span>.<span class="text-[#dcdcaa]">post</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>,
    <span class="text-[#9cdcfe]">headers</span>={<span class="text-[#ce9178]">"Authorization"</span>: <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>},
    <span class="text-[#9cdcfe]">json</span>={<span class="text-[#ce9178]">"html"</span>: <span class="text-[#ce9178]">"&lt;h1&gt;Hello&lt;/h1&gt;"</span>, <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">1200</span>, <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">630</span>})
<span class="text-[#dcdcaa]">print</span>(<span class="text-[#9cdcfe]">resp</span>.<span class="text-[#dcdcaa]">json</span>()[<span class="text-[#ce9178]">"url"</span>])`
		},
		{
			id: 'go',
			label: 'Go',
			fileName: 'main.go',
			code: `<span class="text-[#c586c0]">package</span> <span class="text-[#9cdcfe]">main</span>

<span class="text-[#c586c0]">import</span> (<span class="text-[#ce9178]">"bytes"</span>; <span class="text-[#ce9178]">"encoding/json"</span>; <span class="text-[#ce9178]">"net/http"</span>)

<span class="text-[#c586c0]">func</span> <span class="text-[#dcdcaa]">main</span>() {
    <span class="text-[#9cdcfe]">body</span>, _ := <span class="text-[#9cdcfe]">json</span>.<span class="text-[#dcdcaa]">Marshal</span>(<span class="text-[#c586c0]">map</span>[<span class="text-[#c586c0]">string</span>]<span class="text-[#c586c0]">any</span>{
        <span class="text-[#ce9178]">"html"</span>: <span class="text-[#ce9178]">"&lt;h1&gt;Hello&lt;/h1&gt;"</span>, <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">1200</span>, <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">630</span>,
    })
    <span class="text-[#9cdcfe]">req</span>, _ := <span class="text-[#9cdcfe]">http</span>.<span class="text-[#dcdcaa]">NewRequest</span>(<span class="text-[#ce9178]">"POST"</span>, <span class="text-[#ce9178]">"https://api.pictify.io/image"</span>, <span class="text-[#9cdcfe]">bytes</span>.<span class="text-[#dcdcaa]">NewBuffer</span>(<span class="text-[#9cdcfe]">body</span>))
    <span class="text-[#9cdcfe]">req</span>.<span class="text-[#9cdcfe]">Header</span>.<span class="text-[#dcdcaa]">Set</span>(<span class="text-[#ce9178]">"Authorization"</span>, <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>)
    <span class="text-[#9cdcfe]">http</span>.<span class="text-[#9cdcfe]">DefaultClient</span>.<span class="text-[#dcdcaa]">Do</span>(<span class="text-[#9cdcfe]">req</span>)
}`
		},
		{
			id: 'ruby',
			label: 'Ruby',
			fileName: 'render.rb',
			code: `<span class="text-[#c586c0]">require</span> <span class="text-[#ce9178]">"net/http"</span>; <span class="text-[#c586c0]">require</span> <span class="text-[#ce9178]">"json"</span>
<span class="text-[#9cdcfe]">uri</span> = <span class="text-[#9cdcfe]">URI</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>)
<span class="text-[#9cdcfe]">req</span> = <span class="text-[#9cdcfe]">Net</span>::<span class="text-[#9cdcfe]">HTTP</span>::<span class="text-[#9cdcfe]">Post</span>.<span class="text-[#dcdcaa]">new</span>(<span class="text-[#9cdcfe]">uri</span>)
<span class="text-[#9cdcfe]">req</span>[<span class="text-[#ce9178]">"Authorization"</span>] = <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>
<span class="text-[#9cdcfe]">req</span>.<span class="text-[#9cdcfe]">body</span> = { <span class="text-[#9cdcfe]">html</span>: <span class="text-[#ce9178]">"&lt;h1&gt;Hello&lt;/h1&gt;"</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">1200</span>, <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">630</span> }.<span class="text-[#dcdcaa]">to_json</span>
<span class="text-[#9cdcfe]">res</span> = <span class="text-[#9cdcfe]">Net</span>::<span class="text-[#9cdcfe]">HTTP</span>.<span class="text-[#dcdcaa]">start</span>(<span class="text-[#9cdcfe]">uri</span>.<span class="text-[#9cdcfe]">hostname</span>, <span class="text-[#9cdcfe]">uri</span>.<span class="text-[#9cdcfe]">port</span>, <span class="text-[#9cdcfe]">use_ssl</span>: <span class="text-[#569cd6]">true</span>) { |<span class="text-[#9cdcfe]">http</span>| <span class="text-[#9cdcfe]">http</span>.<span class="text-[#dcdcaa]">request</span>(<span class="text-[#9cdcfe]">req</span>) }
<span class="text-[#dcdcaa]">puts</span> <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">parse</span>(<span class="text-[#9cdcfe]">res</span>.<span class="text-[#9cdcfe]">body</span>)[<span class="text-[#ce9178]">"url"</span>]`
		}
	];

	// Add copyToClipboard function
	function copyToClipboard(text) {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toast.set({ message: 'URL copied to clipboard! 🔗', type: 'success', duration: 2000 });
			})
			.catch(() => {
				toast.set({ message: 'Failed to copy URL', type: 'error', duration: 2000 });
			});
	}

	const formatExtensionMap = {
		jpg: 'jpeg',
		png: 'png',
		webp: 'webp'
	};

	$: fileExtension = formatExtensionMap[format];

	$: if (!fileExtension) {
		if (browser) {
			goto('/tools/html-to-jpg');
		}
	}

	let formats = ['jpg', 'png', 'webp'];
	const popularSizes = configPopularSizes;
	const popularUseCases = useCases.slice(0, 3);
	const featuredPlatforms = ogPlatforms.slice(0, 3);

	function handleFormatChange(event) {
		const newFormat = event.target.value;
		if (browser) {
			goto(`/tools/html-to-${newFormat}`);
		}
	}

	function trackSignupClick(ctaLocation) {
		analytics.track('tool_signup_click', { tool_name: `html_to_${format}`, cta_location: ctaLocation });
	}

	// Add local storage management
	let usageKey = 'pictify_free_usage';
	let maxFreeGenerations = 5;
	let freeGenerationsUsed = 0;
	let shareBonusGenerations = 0; // +1/day via share (guest only)
	let bonusKey = usageKey + '_bonus';

	onMount(() => {
		if (browser) {
			// Track tool opened
			analytics.trackToolOpened({ tool_name: `html_to_${format}` });

			// Load usage from local storage
			const usage = localStorage.getItem(usageKey);
			if (usage) {
				freeGenerationsUsed = parseInt(usage);
			}

			// Load share bonus
			const bonus = localStorage.getItem(bonusKey);
			if (bonus) {
				shareBonusGenerations = parseInt(bonus);
			}

			// Reset usage if it's a new day
			const lastUsageDate = localStorage.getItem(usageKey + '_date');
			const lastBonusDate = localStorage.getItem(bonusKey + '_date');
			const today = new Date().toDateString();
			if (lastUsageDate !== today) {
				freeGenerationsUsed = 0;
				localStorage.setItem(usageKey, '0');
				localStorage.setItem(usageKey + '_date', today);
			}
			if (lastBonusDate !== today) {
				shareBonusGenerations = 0;
				localStorage.setItem(bonusKey, '0');
				localStorage.setItem(bonusKey + '_date', today);
			}
		}

		// Apply preselected dimensions from size variant pages, if present
		if (browser) {
			const storedWidth = localStorage.getItem('pictify_html_to_image_width');
			const storedHeight = localStorage.getItem('pictify_html_to_image_height');
			if (storedWidth && storedHeight) {
				const widthVal = parseInt(storedWidth, 10);
				const heightVal = parseInt(storedHeight, 10);
				if (!Number.isNaN(widthVal) && !Number.isNaN(heightVal) && widthVal > 0 && heightVal > 0) {
					previewWidth = widthVal;
					previewHeight = heightVal;
				}
				localStorage.removeItem('pictify_html_to_image_width');
				localStorage.removeItem('pictify_html_to_image_height');
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
	$: effectiveMaxFreeGenerations =
		maxFreeGenerations + (isUserLoggedIn ? 0 : shareBonusGenerations);
	$: remainingGenerations = effectiveMaxFreeGenerations - freeGenerationsUsed;
	$: usagePercentage = effectiveMaxFreeGenerations
		? (freeGenerationsUsed / effectiveMaxFreeGenerations) * 100
		: 0;

	// Add user store subscription
	let isUserLoggedIn = false;
	user.subscribe((userData) => {
		isUserLoggedIn = !!userData.email;
	});

	let totalImagesGenerated = 34567; // Social proof counter
	let generationCount = 0;
	let showUpgradePrompt = false;
	const apiFeatureBullets = [
		'Convert HTML to PNG, JPG, or WebP at any size with one API call',
		'Automate bulk generation for invoices, OG images, certificates, and receipts',
		'Serve CDN-hosted assets instantly with usage analytics and token controls'
	];
	const apiSnippetTemplate = `curl -X POST https://api.pictify.io/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "html": "YOUR_HTML_HERE",
    "width": WIDTH_PLACEHOLDER,
    "height": HEIGHT_PLACEHOLDER,
    "fileExtension": "FORMAT_PLACEHOLDER"
  }'`;

	let imageUrl = '';
	let isImageGenerating = false;
	let previewWidth = 1200;
	let previewHeight = 630;
	let previewHtml = '';

	// Apply dimensions if present in URL params
	$: if (hasSize) {
		previewWidth = dimWidth;
		previewHeight = dimHeight;
	}

	function handlePreviewUpdate(event) {
		const { html, width, height } = event.detail;
		previewHtml = html;
		// Only allow the editor to control dimensions when no size is locked from the URL
		if (!hasSize) {
			previewWidth = width;
			previewHeight = height;
		}
	}

	async function generateImage() {
		if (isImageGenerating) return;

		if (!isUserLoggedIn && freeGenerationsUsed >= effectiveMaxFreeGenerations) {
			showUpgradePrompt = true;
			return;
		}

		// Track generation in global limits store
		generationLimits.increment();
		isImageGenerating = true;

		try {
			// Add watermark for ALL non-logged in users
			let html = previewHtml;
			if (!isUserLoggedIn) {
				const watermarkDiv = `
					<div style="position: fixed; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9);
											padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 9999;
											font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
						Created with <a href="https://pictify.io" style="color: #ff6b6b; text-decoration: none; font-weight: 600;">pictify.io</a>
					</div>
				`;

				html = html.replace('</body>', `${watermarkDiv}</body>`);
			}

			const widthToUse = hasSize ? dimWidth : previewWidth;
			const heightToUse = hasSize ? dimHeight : previewHeight;
			const { image } = await createImagePublic({
				html,
				width: widthToUse,
				height: heightToUse,
				fileExtension: fileExtension
			});

			imageUrl = image.url;
			totalImagesGenerated++;

			// Track image generation
			analytics.trackImageGenerated({
				tool_name: `html_to_${format}`,
				format: fileExtension || format,
				with_watermark: !isUserLoggedIn
			});

			// Trigger sticky bar experiment after generation
			if (!isUserLoggedIn && stickyBar) {
				stickyBar.triggerAfterGeneration();
			}

			// Update usage tracking for non-logged in users
			if (!isUserLoggedIn) {
				updateUsage();
			}

			// Show contextual prompts based on usage
			if (!isUserLoggedIn) {
				if (freeGenerationsUsed === 1) {
					showFirstGenerationPrompt = true;
				} else if (shareBonusGenerations === 0 && freeGenerationsUsed === maxFreeGenerations - 1) {
					showSharePrompt = true;
				} else if (freeGenerationsUsed >= effectiveMaxFreeGenerations) {
					showUpgradePrompt = true;
				}
			}
		} catch (error) {
			toast.set({
				message: 'Failed to generate image. Please try again.',
				type: 'error',
				duration: 3000
			});
			// Track render error
			analytics.trackRenderError({
				tool_name: `html_to_${format}`,
				error_message: error?.message || 'Unknown error'
			});
		} finally {
			isImageGenerating = false;
		}
	}

	// Function to handle social sharing with rewards
	function handleSocialShare(platform) {
		const url = encodeURIComponent(window.location.href);
		const text = encodeURIComponent(
			`Check out this awesome HTML to ${format.toUpperCase()} converter!`
		);

		if (platform === 'twitter') {
			window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
		} else if (platform === 'linkedin') {
			window.open(
				`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${encodeURIComponent(
					'HTML to Image Converter'
				)}&summary=${text}`,
				'_blank'
			);
		}

		// Reward: +1 guest generation today (once)
		if (!isUserLoggedIn && shareBonusGenerations < 1) {
			shareBonusGenerations = 1;
			try {
				localStorage.setItem(bonusKey, String(shareBonusGenerations));
				localStorage.setItem(bonusKey + '_date', new Date().toDateString());
			} catch (e) {}
		}
		showSharePrompt = false;
		toast.set({
			message: 'Thanks for sharing! +1 extra guest generation unlocked for today.',
			type: 'success',
			duration: 3000
		});
	}

	// Add format-specific information
	const formatInfo = {
		jpg: {
			fullName: 'JPG',
			benefits: [
				'Excellent compression for photographs',
				'Smaller file sizes',
				'Wide compatibility'
			],
			bestFor: 'photographs and complex images with gradients',
			drawbacks: 'lossy compression, not ideal for text or simple graphics'
		},
		png: {
			fullName: 'PNG',
			benefits: [
				'Lossless compression',
				'Supports transparency',
				'Ideal for graphics and screenshots'
			],
			bestFor: 'logos, icons, and images with text',
			drawbacks: 'larger file sizes compared to JPG for photographs'
		},
		webp: {
			fullName: 'WebP',
			benefits: [
				'Superior compression',
				'Supports both lossy and lossless compression',
				'Smaller file sizes than JPG and PNG'
			],
			bestFor: 'web graphics, combining the best of JPG and PNG',
			drawbacks: 'not universally supported by older browsers'
		}
	};

	// Add default format info
	const defaultFormatInfo = {
		jpg: {
			fullName: 'JPG',
			benefits: [
				'Excellent compression for photographs',
				'Smaller file sizes',
				'Wide compatibility'
			],
			bestFor: 'photographs and complex images with gradients',
			drawbacks: 'lossy compression, not ideal for text or simple graphics'
		},
		png: {
			fullName: 'PNG',
			benefits: [
				'Lossless compression',
				'Supports transparency',
				'Ideal for graphics and screenshots'
			],
			bestFor: 'logos, icons, and images with text',
			drawbacks: 'larger file sizes compared to JPG for photographs'
		},
		webp: {
			fullName: 'WebP',
			benefits: [
				'Superior compression',
				'Supports both lossy and lossless compression',
				'Smaller file sizes than JPG and PNG'
			],
			bestFor: 'web graphics, combining the best of JPG and PNG',
			drawbacks: 'not universally supported by older browsers'
		}
	};

	// Add safe access to format info
	$: currentFormat = formatInfo[format] || defaultFormatInfo.jpg;
	$: otherFormats = Object.keys(formatInfo).filter((f) => f !== format);

	// Add state for contextual prompts
	let showFirstGenerationPrompt = false;

	// Enhanced Schema Markup (dimension-aware)
	$: schemaMarkup = format
		? {
				'@context': 'https://schema.org',
				'@type': 'WebApplication',
				name: hasSize
					? `HTML to ${currentFormat?.fullName || 'Image'} ${sizeString} Converter`
					: `HTML to ${currentFormat?.fullName || 'Image'} Converter`,
				url: hasSize
					? `https://pictify.io/tools/html-to-${format}/${sizeString}`
					: `https://pictify.io/tools/html-to-${format}`,
				description: hasSize
					? `Convert HTML to high-quality ${
							currentFormat?.fullName || 'image'
					  } at ${sizeString} instantly. Create optimized images for websites, social media, and email marketing.`
					: `Convert HTML to high-quality ${
							currentFormat?.fullName || 'image'
					  } instantly. Create optimized images for websites, social media, and email marketing.`,
				applicationCategory: 'DesignApplication',
				operatingSystem: 'Web',
				offers: {
					'@type': 'Offer',
					price: '0',
					priceCurrency: 'USD'
				},
				featureList: [
					`Instant HTML to ${currentFormat?.fullName || 'Image'} conversion${
						hasSize ? ` at ${sizeString}` : ''
					}`,
					`Optimized for ${currentFormat?.bestFor || 'web use'}`,
					'Web-friendly output',
					'No watermark on free accounts'
				],
				mainEntity: [
					{
						'@type': 'HowTo',
						name: hasSize
							? `How to Convert HTML to ${currentFormat?.fullName || 'Image'} (${sizeString})`
							: `How to Convert HTML to ${currentFormat?.fullName || 'Image'}`,
						description: hasSize
							? `Step-by-step guide to convert HTML to ${
									currentFormat?.fullName || 'Image'
							  } images at ${sizeString}`
							: `Step-by-step guide to convert HTML to ${
									currentFormat?.fullName || 'Image'
							  } images`,
						step: [
							{
								'@type': 'HowToStep',
								text: 'Input your HTML code in the editor',
								url: `https://pictify.io/tools/html-to-${format}#input`
							},
							{
								'@type': 'HowToStep',
								text: 'Preview your HTML design',
								url: `https://pictify.io/tools/html-to-${format}#preview`
							},
							{
								'@type': 'HowToStep',
								text: hasSize
									? `Generate your ${currentFormat?.fullName || 'Image'} image at ${sizeString}`
									: `Generate your ${currentFormat?.fullName || 'Image'} image`,
								url: `https://pictify.io/tools/html-to-${format}#generate`
							}
						]
					},
					{
						'@type': 'FAQPage',
						mainEntity: [
							{
								'@type': 'Question',
								name: `How does HTML to ${currentFormat?.fullName || 'Image'} conversion work?`,
								acceptedAnswer: {
									'@type': 'Answer',
									text: 'Our converter renders your HTML code in a virtual browser environment and captures the output as a high-quality image.'
								}
							},
							{
								'@type': 'Question',
								name: `What's the best use case for ${currentFormat?.fullName || 'Image'}?`,
								acceptedAnswer: {
									'@type': 'Answer',
									text: `${currentFormat?.fullName || 'Image'} is best for ${
										currentFormat?.bestFor || 'web use'
									}.`
								}
							}
						]
					}
				]
		  }
		: null;

</script>

<svelte:head>
	<title>{headTitle}</title>
	<meta name="description" content={headDescription} />
	<meta
		name="keywords"
		content={hasSize
			? `convert image from HTML, HTML to ${format.toUpperCase()} ${sizeString}, ${format.toUpperCase()} converter, ${sizeString} image, online image generator, web design tool, ${
					currentFormat.fullName
			  } image creator, Pictify.io`
			: `convert image from HTML, HTML to ${format.toUpperCase()}, ${format.toUpperCase()} converter, online image generator, web design tool, ${
					currentFormat.fullName
			  } image creator, Pictify.io`}
	/>
	<meta name="author" content="Pictify.io" />
	<meta property="og:title" content={headTitle} />
	<meta property="og:description" content={ogDescription} />
	<meta
		property="og:image"
		content="https://media.pictify.io/gre6p-1775406841745.png"
	/>
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Pictify.io" />
	<meta property="og:locale" content="en_US" />
	<link rel="canonical" href={canonicalUrl} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@pictify_io" />
	<meta name="twitter:title" content={headTitle} />
	<meta name="twitter:description" content={headDescription} />
	<meta name="twitter:image" content="https://media.pictify.io/gre6p-1775406841745.png" />

	{#if schemaMarkup}
		{@html `<script type="application/ld+json">
	${JSON.stringify(schemaMarkup)}
</script>`}
	{/if}
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pictify.io/' },
			{ '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://pictify.io/tools' },
			{ '@type': 'ListItem', position: 3, name: 'HTML to ' + (format ? format.toUpperCase() : 'Image') }
		]
	})}</script>`}
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

	<main class="w-full max-w-7xl mx-auto px-6 pt-12 pb-20 md:pt-24 md:pb-32 relative z-10">
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
				<li class="text-gray-900">HTML to {currentFormat.fullName}</li>
			</ol>
		</nav>

		<!-- Post-signup welcome with API key -->
		<PostSignupWelcome toolName={`html_to_${format}`} />

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
					★ Free Tool
				</div>
			</div>

			<!-- Main Title -->
			<h1
				class="relative z-10 text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-tight mb-4 sm:mb-8"
			>
				<span class="block sm:inline">HTML TO</span>
				<span class="relative inline-block text-white mt-1 sm:mt-2 md:mt-0 md:ml-3">
					<span class="relative z-10 px-2 sm:px-3 md:px-4">{currentFormat.fullName}</span>
					<span
						class="absolute inset-0 bg-[#ff6b6b] transform -skew-x-3 border-[3px] sm:border-[4px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] -z-0"
					/>
				</span>
				{#if hasSize}
					<span class="block mt-2 sm:mt-4">
						<span
							class="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-gray-900 bg-white border-[2px] sm:border-[3px] border-black px-2 sm:px-3 py-1 shadow-[3px_3px_0_0_#000] sm:shadow-[4px_4px_0_0_#000]"
						>
							{sizeString}
						</span>
					</span>
				{/if}
			</h1>

			<!-- Description -->
			<div class="max-w-2xl mx-auto px-2">
				<p
					class="text-base sm:text-lg md:text-xl text-gray-800 font-bold leading-relaxed border-[3px] border-black bg-white p-4 sm:p-6 shadow-[4px_4px_0_0_#e5e7eb] sm:shadow-[8px_8px_0_0_#e5e7eb]"
				>
					Transform your HTML code into high-quality <span
						class="bg-[#ffc480] px-1 border-b-[2px] sm:border-b-[3px] border-black"
						>{currentFormat.fullName}</span
					>
					images instantly.
					<span class="text-gray-500 text-sm sm:text-base mt-2 sm:mt-3 block font-semibold"
						>Perfect for {currentFormat.bestFor}</span
					>
				</p>
			</div>
		</div>

		<!-- Control Panel / Format Selector -->
		<div class="w-full max-w-5xl mx-auto mb-16 relative px-2 md:px-0">
			<!-- Decorative Underlay -->
			<div
				class="absolute inset-0 bg-black translate-x-3 translate-y-3 hidden md:block border-[3px] border-black"
			/>

			<div class="relative border-[3px] md:border-[4px] border-black bg-white">
				<!-- Window Header -->
				<div
					class="bg-black text-white px-4 py-3 flex justify-between items-center border-b-[3px] md:border-b-[4px] border-black"
				>
					<h3
						class="font-bold font-mono tracking-widest text-xs md:text-sm uppercase flex items-center gap-2"
					>
						<span class="animate-pulse">_</span> SYSTEM_CONFIG
					</h3>
					<div class="flex gap-2">
						<div
							class="w-3 h-3 bg-[#ff6b6b] border border-black hover:bg-red-400 transition-colors"
						/>
						<div
							class="w-3 h-3 bg-[#ffc480] border border-black hover:bg-yellow-400 transition-colors"
						/>
						<div
							class="w-3 h-3 bg-[#4ade80] border border-black hover:bg-green-400 transition-colors"
						/>
					</div>
				</div>

				<!-- Content -->
				<div class="p-6 md:p-8 bg-[#f8f9fa]">
					<!-- Format Grid -->
					<div class="mb-8">
						<h4
							class="font-black text-lg md:text-xl mb-6 uppercase tracking-tight flex items-center gap-3"
						>
							<span
								class="w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-bold border-[2px] border-black shadow-[3px_3px_0_0_#9ca3af]"
								>01</span
							>
							Target Format
						</h4>
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
							{#each formats as f}
								<button
									class="group relative w-full h-full"
									on:click={() => {
										if (browser && f !== format) {
											goto(`/tools/html-to-${f}`);
										}
									}}
								>
									<div
										class={`px-4 py-4 border-[3px] border-black transition-all duration-200 flex flex-col items-center gap-2
										${
											f === format
												? 'bg-[#4ade80] shadow-[4px_4px_0_0_#000] translate-x-[-2px] translate-y-[-2px]'
												: 'bg-white hover:bg-gray-50 shadow-[4px_4px_0_0_#ccc] hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]'
										}`}
									>
										<span class="font-black text-2xl uppercase tracking-tighter">{f}</span>
										<span
											class="text-xs font-bold uppercase tracking-widest bg-black text-white px-2 py-0.5"
											>{formatInfo[f].fullName}</span
										>
									</div>
								</button>
							{/each}
						</div>
					</div>

					<!-- Sizes -->
					{#if hasSize}
						<div class="border-t-[3px] border-dashed border-gray-300 my-8" />
						<div>
							<h4
								class="font-black text-lg md:text-xl mb-6 uppercase tracking-tight flex items-center gap-3"
							>
								<span
									class="w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-bold border-[2px] border-black shadow-[3px_3px_0_0_#9ca3af]"
									>02</span
								>
								Output Dimensions
							</h4>
							<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
								{#each popularSizes as sz}
									<a href={`/tools/html-to-${format}/${sz}`} class="group block">
										<div
											class={`px-2 py-3 border-[2px] border-black text-sm font-bold text-center transition-all duration-200
											${
												sizeString === sz
													? 'bg-black text-white shadow-[3px_3px_0_0_#ff6b6b]'
													: 'bg-white text-black hover:bg-gray-50 shadow-[3px_3px_0_0_#ccc] hover:shadow-[3px_3px_0_0_#000]'
											}`}
										>
											{sz}
										</div>
									</a>
								{/each}
							</div>
						</div>

						<!-- Dimension Context Info -->
						{#if dimensionContext}
							<div class="border-t-[3px] border-dashed border-gray-300 my-8" />
							<div class="bg-[#4ade80]/10 border-[3px] border-[#4ade80] rounded-xl p-6">
								<div class="flex flex-wrap items-center gap-3 mb-4">
									<span
										class="px-3 py-1 bg-[#4ade80] text-black font-black text-sm uppercase rounded-full border-2 border-black"
									>
										{dimensionContext.label}
									</span>
									<span class="text-sm font-bold text-gray-600">
										Aspect Ratio: {dimensionContext.aspectRatio}
									</span>
								</div>
								<p class="text-gray-800 font-medium mb-4">{dimensionContext.description}</p>

								<div class="flex flex-wrap gap-2 mb-4">
									<span class="text-xs font-bold uppercase tracking-wide text-gray-500"
										>Works with:</span
									>
									{#each dimensionContext.platforms as platform}
										<span
											class="px-2 py-1 bg-white border-2 border-gray-300 rounded text-xs font-bold text-gray-700"
										>
											{platform}
										</span>
									{/each}
								</div>

								{#if dimensionContext.useCases?.length}
									<div class="flex flex-wrap gap-2">
										<span class="text-xs font-bold uppercase tracking-wide text-gray-500"
											>Best for:</span
										>
										{#each dimensionContext.useCases as useCase}
											<span class="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
												{useCase}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<!-- Usage Bar (Guest) -->
		{#if !isUserLoggedIn}
			<div class="w-full max-w-5xl mx-auto mb-12">
				<div
					class="bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] rounded-xl p-6"
				>
					<div class="flex items-center gap-4">
						<div class="flex-1">
							<div class="flex justify-between items-center mb-2">
								<span class="text-sm font-bold text-gray-900">Guest Generations</span>
								<span class="text-sm font-bold text-gray-900"
									>{freeGenerationsUsed}/{maxFreeGenerations}</span
								>
							</div>
							<div
								class="w-full bg-gray-100 rounded-full h-3 border-2 border-gray-200 overflow-hidden"
							>
								<div
									class="bg-[#ff6b6b] h-full rounded-full transition-all duration-500 border-r-2 border-gray-900"
									style="width: {usagePercentage}%"
								/>
							</div>
							<p class="text-xs font-medium text-gray-500 mt-2">
								Sign up free to unlock unlimited generations
							</p>
						</div>
						{#if remainingGenerations !== 1}
							<div class="flex-shrink-0">
								<a
									href={`/signup?redirect=/tools/html-to-${format}`}
									on:click={() => trackSignupClick('generation_limit_banner')}
									class="inline-block py-2 px-4 rounded-lg border-[3px] border-gray-900 font-bold bg-[#ff6b6b] text-white shadow-[4px_4px_0_0_#1f2937] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0_0_#1f2937] transition-all text-sm"
								>
									Sign Up Free
								</a>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Code Editor Workstation -->
		<div class="w-full max-w-6xl mx-auto mb-20 relative px-2 md:px-0">
			<div
				class="border-[3px] md:border-[4px] border-black bg-white relative z-10 shadow-[8px_8px_0_0_#000] overflow-hidden"
			>
				<!-- Editor Component -->
				<CodeEditor
					isPreviewEnabled={true}
					{fileExtension}
					on:previewUpdated={handlePreviewUpdate}
				/>

				<!-- Action Area -->
				<div
					class="p-6 md:p-8 border-t-[3px] md:border-t-[4px] border-black bg-gradient-to-br from-[#FFFDF8] to-[#fff5e6] flex flex-col items-center gap-4 relative overflow-hidden"
				>
					<!-- Decorative corner elements -->
					<div
						class="absolute top-4 left-4 w-3 h-3 border-l-[3px] border-t-[3px] border-black opacity-20"
					/>
					<div
						class="absolute top-4 right-4 w-3 h-3 border-r-[3px] border-t-[3px] border-black opacity-20"
					/>
					<div
						class="absolute bottom-4 left-4 w-3 h-3 border-l-[3px] border-b-[3px] border-black opacity-20"
					/>
					<div
						class="absolute bottom-4 right-4 w-3 h-3 border-r-[3px] border-b-[3px] border-black opacity-20"
					/>

					<!-- Generate Button -->
					<button
						on:click={generateImage}
						disabled={isImageGenerating}
						class="relative w-full max-w-md py-4 md:py-5 bg-[#ff6b6b] border-[3px] md:border-[4px] border-black shadow-[6px_6px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
					>
						<div class="flex items-center justify-center gap-3 md:gap-4 relative z-10">
							{#if isImageGenerating}
								<svg
									class="animate-spin h-6 w-6 md:h-7 md:w-7 text-white"
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
								<span class="font-black text-lg md:text-2xl text-white uppercase tracking-tight"
									>Processing...</span
								>
							{:else}
								<span
									class="font-black text-lg md:text-2xl text-white uppercase tracking-tight group-hover:scale-105 transition-transform"
									>Generate {format.toUpperCase()}</span
								>
								<svg
									class="w-5 h-5 md:w-6 md:h-6 text-white group-hover:translate-x-1 transition-transform"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M13 7l5 5m0 0l-5 5m5-5H6"
									/></svg
								>
							{/if}
						</div>
					</button>
					<p class="text-xs font-bold text-gray-400 uppercase tracking-widest relative z-10">
						Click to create your image
					</p>
				</div>
			</div>
		</div>

		<!-- Generated Image Result -->
		{#if imageUrl}
			<div class="w-full max-w-5xl mx-auto mb-20 px-2 md:px-0">
				<div
					class="border-[3px] md:border-[4px] border-black bg-white shadow-[8px_8px_0_0_#000] relative"
				>
					<!-- Success Header -->
					<div
						class="bg-[#4ade80] border-b-[3px] md:border-b-[4px] border-black p-3 md:p-4 flex justify-between items-center"
					>
						<h3
							class="font-black text-black tracking-widest uppercase text-xs md:text-sm flex items-center gap-2"
						>
							<svg
								class="w-5 h-5 md:w-6 md:h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/></svg
							>
							SUCCESS: IMAGE_GENERATED
						</h3>
						<div class="font-mono text-xs font-bold bg-black text-[#4ade80] px-2 py-1">200 OK</div>
					</div>

					<!-- Image Preview -->
					<div class="p-4 md:p-6">
						<div
							class="bg-[url('/transparent-bg.png')] border-[3px] border-black relative group overflow-hidden bg-contain"
						>
							<div
								class="relative w-full"
								style={hasSize
									? `aspect-ratio: ${dimWidth} / ${dimHeight}`
									: 'aspect-ratio: 1200 / 630'}
							>
								<img
									src={imageUrl}
									alt="Generated output"
									class="absolute inset-0 w-full h-full object-contain bg-white/50 backdrop-blur-[1px]"
								/>
							</div>
							<!-- Ruler/Tech marks overlay -->
							<div
								class="absolute top-0 left-0 w-4 h-4 border-l-[2px] border-t-[2px] border-black"
							/>
							<div
								class="absolute top-0 right-0 w-4 h-4 border-r-[2px] border-t-[2px] border-black"
							/>
							<div
								class="absolute bottom-0 left-0 w-4 h-4 border-l-[2px] border-b-[2px] border-black"
							/>
							<div
								class="absolute bottom-0 right-0 w-4 h-4 border-r-[2px] border-b-[2px] border-black"
							/>
						</div>
					</div>

					<!-- Action bar -->
					<div
						class="border-t-[3px] border-black px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3"
					>
						<!-- URL + Copy -->
						<div
							class="flex-1 min-w-0 flex items-center gap-0 border-[2px] border-black"
						>
							<div
								class="flex-1 min-w-0 bg-gray-50 px-3 py-2 font-mono text-xs overflow-x-auto whitespace-nowrap select-all"
							>
								{imageUrl}
							</div>
							<button
								on:click={() => copyToClipboard(imageUrl)}
								class="bg-black text-white hover:bg-gray-800 font-bold uppercase px-4 py-2 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0 text-xs"
							>
								<svg
									class="w-3.5 h-3.5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
									/></svg
								>
								Copy
							</button>
						</div>

						<!-- Action buttons -->
						<div class="flex items-center gap-2">
							<a
								href={imageUrl}
								download
								target="_blank"
								class="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border-[2px] border-black font-black uppercase text-xs shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								<svg
									class="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/></svg
								>
								Download
							</a>
							{#if !isUserLoggedIn}
								<a
									href={`/signup?redirect=/tools/html-to-${format}`}
									on:click={() => trackSignupClick('result_actions')}
									class="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#ffc480] border-[2px] border-black font-black uppercase text-xs shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
								>
									Sign up free
								</a>
							{/if}
						</div>
					</div>
				</div>

				<!-- Next steps — stacked vertically -->
				<div class="w-full mt-8 space-y-5">
					<!-- Automate via API -->
					<div class="border-[3px] border-black bg-white shadow-[6px_6px_0_0_#000]">
						<div class="bg-[#4ade80] px-5 py-3 border-b-[3px] border-black flex items-center gap-3">
							<span class="w-7 h-7 bg-black text-white flex items-center justify-center font-black text-xs">01</span>
							<h4 class="font-black uppercase tracking-widest text-sm">Automate via API</h4>
						</div>
						<div class="p-5 md:p-6 flex flex-col md:flex-row gap-5">
							<div class="flex-1">
								<p class="text-sm font-bold text-gray-700 mb-3">
									Generate {currentFormat.fullName} images programmatically. Send HTML, get back a hosted image URL — one API call.
								</p>
								<a
									href="https://docs.pictify.io/api-reference/overview"
									target="_blank"
									class="inline-block py-2.5 px-5 bg-[#4ade80] text-black border-[2px] border-black font-black uppercase text-xs shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
								>
									View API docs
								</a>
							</div>
							<div class="flex-1">
								<pre class="text-[12px] font-mono bg-[#282c34] text-[#abb2bf] border-[2px] border-black p-4 overflow-auto rounded-sm">{@html `<span style="color:#e06c75">curl</span> -X POST <span style="color:#98c379">https://api.pictify.io/image</span> <span style="color:#5c6370">\\</span>
  -H <span style="color:#98c379">"Content-Type: application/json"</span> <span style="color:#5c6370">\\</span>
  -H <span style="color:#98c379">"Authorization: Bearer YOUR_API_KEY"</span> <span style="color:#5c6370">\\</span>
  -d <span style="color:#98c379">'{</span>
    <span style="color:#e06c75">"html"</span>: <span style="color:#98c379">"&lt;h1&gt;Hello World&lt;/h1&gt;"</span>,
    <span style="color:#e06c75">"width"</span>: <span style="color:#d19a66">${hasSize ? dimWidth : previewWidth}</span>,
    <span style="color:#e06c75">"height"</span>: <span style="color:#d19a66">${hasSize ? dimHeight : previewHeight}</span>,
    <span style="color:#e06c75">"fileExtension"</span>: <span style="color:#98c379">"${fileExtension}"</span>
  <span style="color:#98c379">}'</span>`}</pre>
							</div>
						</div>
					</div>

					<!-- Use with AI via MCP -->
					<div class="border-[3px] border-black bg-white shadow-[6px_6px_0_0_#000]">
						<div class="bg-[#ffc480] px-5 py-3 border-b-[3px] border-black flex items-center gap-3">
							<span class="w-7 h-7 bg-black text-white flex items-center justify-center font-black text-xs">02</span>
							<h4 class="font-black uppercase tracking-widest text-sm">Use with AI agents</h4>
						</div>
						<div class="p-5 md:p-6 flex flex-col md:flex-row gap-5">
							<div class="flex-1">
								<p class="text-sm font-bold text-gray-700 mb-3">
									Connect Pictify as an MCP server to Claude, Cursor, or any AI coding agent. Generate and iterate on images using natural language.
								</p>
								<div class="flex flex-wrap gap-3">
									<a
										href="https://www.npmjs.com/package/@pictify/mcp-server"
										target="_blank"
										class="inline-flex items-center gap-2 py-2.5 px-5 bg-[#ffc480] text-black border-[2px] border-black font-black uppercase text-xs shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
									>
										<svg class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M0 256V0h256v256z" fill="#C12127"/><path d="M48 48h160v160H176V80H128v128H48z" fill="#fff"/></svg>
										npm install
									</a>
									<a
										href="https://docs.pictify.io"
										target="_blank"
										class="inline-block py-2.5 px-5 bg-white text-black border-[2px] border-black font-black uppercase text-xs shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
									>
										Read docs
									</a>
								</div>
							</div>
							<div class="flex-1">
								<pre class="text-[12px] font-mono bg-[#282c34] text-[#abb2bf] border-[2px] border-black p-4 overflow-auto rounded-sm">{@html `<span style="color:#5c6370">// Add to your MCP config</span>
<span style="color:#e06c75">"pictify"</span>: {
  <span style="color:#e06c75">"command"</span>: <span style="color:#98c379">"npx"</span>,
  <span style="color:#e06c75">"args"</span>: [<span style="color:#98c379">"-y"</span>, <span style="color:#98c379">"@pictify/mcp-server"</span>],
  <span style="color:#e06c75">"env"</span>: {
    <span style="color:#e06c75">"PICTIFY_API_KEY"</span>: <span style="color:#98c379">"your_key"</span>
  }
}`}</pre>
							</div>
						</div>
					</div>

					<!-- Sign up CTA -->
					{#if !isUserLoggedIn}
						<div class="border-[3px] border-black bg-[#ff6b6b] shadow-[6px_6px_0_0_#000]">
							<div class="p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
								<div class="flex items-center gap-4">
									<span class="w-7 h-7 bg-black text-white flex items-center justify-center font-black text-xs flex-shrink-0">03</span>
									<div>
										<h4 class="font-black uppercase tracking-widest text-sm text-white">Go unlimited</h4>
										<p class="text-xs font-bold text-white/80 mt-1">
											No watermarks, unlimited generations, and your own API key — all free.
										</p>
									</div>
								</div>
								<a
									href={`/signup?redirect=/tools/html-to-${format}`}
									on:click={() => trackSignupClick('go_unlimited_banner')}
									class="py-3 px-6 bg-white text-black border-[2px] border-black font-black uppercase text-sm shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all whitespace-nowrap flex-shrink-0"
								>
									Sign up free
								</a>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- First Generation Prompt -->
		{#if showFirstGenerationPrompt}
			<div
				class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
			>
				<div
					class="bg-white max-w-md w-full mx-auto p-8 shadow-[12px_12px_0_0_#000] border-[4px] border-black relative"
				>
					<!-- Geometric decoration -->
					<div class="absolute -top-3 -left-3 w-6 h-6 bg-[#ff6b6b] border-[3px] border-black" />
					<div class="absolute -bottom-3 -right-3 w-6 h-6 bg-[#4ade80] border-[3px] border-black" />

					<div class="flex justify-between items-center mb-6 border-b-[3px] border-black pb-4">
						<h3 class="text-2xl font-black text-gray-900 uppercase tracking-tighter">
							🎉 Great Start!
						</h3>
						<button
							class="text-black hover:bg-black hover:text-white transition-colors border-[2px] border-transparent hover:border-black p-1"
							on:click={() => (showFirstGenerationPrompt = false)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<p class="text-black mb-6 font-bold text-lg">Create a free account to unlock:</p>

					<ul class="space-y-4 mb-8">
						<li class="flex items-center gap-4 text-black font-bold">
							<div
								class="w-8 h-8 bg-[#ff6b6b] border-[2px] border-black flex items-center justify-center text-white shadow-[2px_2px_0_0_#000]"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/></svg
								>
							</div>
							Unlimited image generations
						</li>
						<li class="flex items-center gap-4 text-black font-bold">
							<div
								class="w-8 h-8 bg-[#ffc480] border-[2px] border-black flex items-center justify-center text-black shadow-[2px_2px_0_0_#000]"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/></svg
								>
							</div>
							No watermarks
						</li>
						<li class="flex items-center gap-4 text-black font-bold">
							<div
								class="w-8 h-8 bg-[#4ade80] border-[2px] border-black flex items-center justify-center text-black shadow-[2px_2px_0_0_#000]"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/></svg
								>
							</div>
							API Access
						</li>
					</ul>

					<div class="space-y-4">
						<a
							href={`/signup?redirect=/tools/html-to-${format}`}
							on:click={() => trackSignupClick('free_tier_card')}
							class="block w-full py-4 px-6 border-[3px] border-black font-black bg-black text-center text-white shadow-[4px_4px_0_0_#ff6b6b] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0_0_#ff6b6b] transition-all uppercase tracking-wider"
						>
							Create Free Account
						</a>

						<button
							class="w-full py-3 px-6 font-bold text-gray-500 hover:text-black hover:underline uppercase tracking-wide transition-colors"
							on:click={() => (showFirstGenerationPrompt = false)}
						>
							Continue as Guest
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Upgrade Prompt -->
		{#if showUpgradePrompt}
			<div
				class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
				style="margin-top: 0px;"
			>
				<div
					class="bg-white max-w-md w-full mx-auto p-8 shadow-[12px_12px_0_0_#000] border-[4px] border-black relative"
				>
					<!-- Geometric decoration -->
					<div class="absolute -top-3 -right-3 w-6 h-6 bg-[#ff6b6b] border-[3px] border-black" />
					<div class="absolute -bottom-3 -left-3 w-6 h-6 bg-[#4ade80] border-[3px] border-black" />

					<div class="flex justify-between items-center mb-6 border-b-[3px] border-black pb-4">
						<h3 class="text-2xl font-black text-gray-900 uppercase tracking-tighter">
							🎨 More Power?
						</h3>
						<button
							class="text-black hover:bg-black hover:text-white transition-colors border-[2px] border-transparent hover:border-black p-1"
							on:click={() => (showUpgradePrompt = false)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<p class="text-black mb-6 font-bold text-lg">
						You've reached the guest limit. Unlock full access:
					</p>

					<ul class="space-y-4 mb-8">
						<li class="flex items-center gap-4 text-black font-bold">
							<div
								class="w-8 h-8 bg-[#ff6b6b] border-[2px] border-black flex items-center justify-center text-white shadow-[2px_2px_0_0_#000]"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/></svg
								>
							</div>
							Unlimited image generations
						</li>
						<li class="flex items-center gap-4 text-black font-bold">
							<div
								class="w-8 h-8 bg-[#ffc480] border-[2px] border-black flex items-center justify-center text-black shadow-[2px_2px_0_0_#000]"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/></svg
								>
							</div>
							No watermarks
						</li>
						<li class="flex items-center gap-4 text-black font-bold">
							<div
								class="w-8 h-8 bg-[#4ade80] border-[2px] border-black flex items-center justify-center text-black shadow-[2px_2px_0_0_#000]"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/></svg
								>
							</div>
							API Access
						</li>
					</ul>

					<div class="space-y-4">
						<div class="relative group w-full">
							<a
								href={`/signup?redirect=/tools/html-to-${format}`}
								on:click={() => trackSignupClick('pro_tier_card')}
								class="block w-full py-4 px-6 border-[3px] border-black font-black bg-[#ff6b6b] text-center text-white shadow-[4px_4px_0_0_#000] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all uppercase tracking-wider relative z-10"
							>
								Sign Up Free
							</a>
						</div>
						<button
							class="w-full py-3 px-6 font-bold text-gray-500 hover:text-black hover:underline uppercase tracking-wide transition-colors"
							on:click={() => (showUpgradePrompt = false)}
						>
							Maybe Later
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Features Grid -->
		<div
			class="w-full max-w-5xl mx-auto border-[3px] border-black bg-white shadow-[8px_8px_0_0_#9ca3af] p-6 md:p-8 mb-16 relative"
		>
			<div class="absolute -top-3 -right-3 w-8 h-8 bg-black" />
			<h2 class="text-3xl font-black text-black mb-8 uppercase tracking-tighter">
				Key Features {#if hasSize} for {currentFormat.fullName} at {sizeString}{/if}
			</h2>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
				{#each currentFormat.benefits as benefit, i}
					<div
						class="bg-[#f3f4f6] border-[3px] border-black p-6 shadow-[4px_4px_0_0_#000] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0_0_#000] transition-all duration-200"
					>
						<div class="flex flex-col items-start gap-4">
							<div
								class="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-lg border-[2px] border-transparent shadow-[3px_3px_0_0_#ff6b6b]"
							>
								{i + 1}
							</div>
							<div>
								<p class="text-black font-bold text-lg leading-tight">
									{benefit}
									{#if hasSize} — works great at {sizeString}{/if}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<section class="mb-16 max-w-5xl mx-auto">
			<ApiCodeSection
				title="Automate with the"
				titleHighlight="API"
				toolName={`html_to_${format}`}
				description="Convert HTML to {(format && format.toUpperCase()) || 'image'} programmatically. Render social cards, email headers, and marketing visuals in your CI/CD pipeline."
				codeExamples={htmlToImageExamples}
			/>
		</section>

		<!-- HTML to Image — When to Use Each Format -->
		<section class="mb-16 border-[3px] border-black p-6 md:p-8 bg-[#fffdf8] shadow-[8px_8px_0_0_#9ca3af]">
			<h2 class="text-3xl font-black mb-6 text-black uppercase">HTML to Image — Choosing the Right Format</h2>
			<div class="overflow-x-auto">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="border-b-[3px] border-black">
							<th class="p-3 font-black uppercase text-sm">Format</th>
							<th class="p-3 font-black uppercase text-sm">Best For</th>
							<th class="p-3 font-black uppercase text-sm">Transparency</th>
							<th class="p-3 font-black uppercase text-sm">File Size</th>
						</tr>
					</thead>
					<tbody class="text-sm font-medium text-gray-700">
						<tr class="border-b border-gray-200 {format === 'png' ? 'bg-[#ffc480]/10' : ''}">
							<td class="p-3 font-black">PNG</td>
							<td class="p-3">Screenshots, UI elements, text-heavy images</td>
							<td class="p-3">Yes</td>
							<td class="p-3">Large</td>
						</tr>
						<tr class="border-b border-gray-200 {format === 'jpg' ? 'bg-[#ffc480]/10' : ''}">
							<td class="p-3 font-black">JPG</td>
							<td class="p-3">Photos, OG images, social cards, email headers</td>
							<td class="p-3">No</td>
							<td class="p-3">Small</td>
						</tr>
						<tr class="{format === 'webp' ? 'bg-[#ffc480]/10' : ''}">
							<td class="p-3 font-black">WebP</td>
							<td class="p-3">Web graphics, combining quality of PNG with size of JPG</td>
							<td class="p-3">Yes</td>
							<td class="p-3">Smallest</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<!-- Other Formats Section -->
		<div
			class="w-full max-w-5xl mx-auto border-[3px] border-black bg-white shadow-[8px_8px_0_0_#9ca3af] p-6 md:p-8 mb-16"
		>
			<h2 class="text-3xl font-black text-black mb-6 uppercase">
				Try Other Formats {#if hasSize} at {sizeString}{/if}
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each otherFormats as otherFormat}
					<a
						href={`/tools/html-to-${otherFormat}`}
						class="flex items-center gap-4 p-5 transition-all border-[3px] border-black bg-white hover:bg-[#ffc480] hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] group"
					>
						<div
							class="w-12 h-12 bg-black text-white flex items-center justify-center font-black uppercase text-sm border-[2px] border-white group-hover:border-black group-hover:bg-white group-hover:text-black"
						>
							{otherFormat}
						</div>
						<div>
							<h3 class="text-xl font-black text-gray-900 group-hover:text-black uppercase">
								{formatInfo[otherFormat].fullName}
							</h3>
							<p class="text-gray-700 font-bold text-sm group-hover:text-black">
								Perfect for {formatInfo[otherFormat].bestFor}
							</p>
						</div>
					</a>
				{/each}
			</div>
		</div>

		<!-- Related OG Image Workflows -->
		<div
			class="w-full max-w-5xl mx-auto border-[3px] border-black bg-[#f3f4f6] p-6 md:p-8 mb-16 relative"
		>
			<div
				class="absolute top-0 right-0 bg-black text-white px-3 py-1 font-mono text-xs font-bold uppercase"
			>
				Workflows
			</div>
			<h2 class="text-3xl font-black text-gray-900 mb-6 uppercase">Need social previews?</h2>
			<p class="text-black font-bold mb-6 text-lg">
				Create platform-optimized Open Graph images after exporting your HTML.
			</p>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each featuredPlatforms as platform}
					<a
						href={`/tools/og-image-generator/${platform.id}`}
						class="bg-white border-[3px] border-black p-6 hover:shadow-[6px_6px_0_0_#ff6b6b] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
					>
						<h3 class="text-xl font-black text-gray-900 mb-2 uppercase">{platform.label}</h3>
						<p class="text-sm text-gray-700 font-medium">
							Design branded OG images tailored for {platform.label}.
						</p>
					</a>
				{/each}
			</div>
		</div>

		<!-- Social Share Section -->
		<div class="w-full max-w-5xl mx-auto mb-20 text-center">
			<p class="font-bold text-gray-500 uppercase tracking-widest mb-4">Spread the word</p>
			<div class="flex flex-col md:flex-row justify-center md:space-x-6">
				<button
					class="flex items-center justify-center px-8 py-4 bg-black text-white font-black uppercase tracking-wide border-[3px] border-black hover:bg-white hover:text-black transition-all shadow-[4px_4px_0_0_#ccc] hover:shadow-[4px_4px_0_0_#000] mb-4 md:mb-0"
					on:click={() => handleSocialShare('twitter')}
				>
					<svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
						/>
					</svg>
					Share on X
				</button>
				<button
					class="flex items-center justify-center px-8 py-4 bg-[#0A66C2] text-white font-black uppercase tracking-wide border-[3px] border-black hover:bg-white hover:text-[#0A66C2] transition-all shadow-[4px_4px_0_0_#ccc] hover:shadow-[4px_4px_0_0_#000]"
					on:click={() => handleSocialShare('linkedin')}
				>
					<svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.065 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
						/>
					</svg>
					Share on LinkedIn
				</button>
			</div>
		</div>

		<!-- Content Sections -->
		<div class="max-w-5xl mx-auto px-6 md:px-0 mt-20">
			<!-- How it Works Section -->
			<section
				class="mb-16 border-[3px] border-black p-6 md:p-8 bg-white relative shadow-[8px_8px_0_0_#9ca3af]"
			>
				<div
					class="absolute top-0 left-0 bg-black text-white px-3 py-1 font-mono text-xs font-bold uppercase transform -translate-y-1/2 ml-4"
				>
					Instructions
				</div>
				<h2 class="text-3xl font-black mb-10 text-black uppercase">How to Convert</h2>
				<div class="flex flex-col md:flex-row gap-6">
					<div class="flex-1 p-6 border-[3px] border-black bg-[#EBEBEB] relative">
						<div
							class="absolute -top-4 -left-4 w-10 h-10 bg-black text-white flex items-center justify-center font-black text-xl border-[2px] border-white shadow-[3px_3px_0_0_#4ade80]"
						>
							1
						</div>
						<h3 class="text-xl font-black mt-2 mb-2 uppercase">Input Code</h3>
						<p class="font-bold text-gray-700">
							Paste your HTML code in the editor above or use our default template.
						</p>
					</div>
					<div class="flex-1 p-6 border-[3px] border-black bg-[#EBEBEB] relative">
						<div
							class="absolute -top-4 -left-4 w-10 h-10 bg-black text-white flex items-center justify-center font-black text-xl border-[2px] border-white shadow-[3px_3px_0_0_#ffc480]"
						>
							2
						</div>
						<h3 class="text-xl font-black mt-2 mb-2 uppercase">Preview</h3>
						<p class="font-bold text-gray-700">
							Check how your HTML will look as a {currentFormat.fullName} image.
						</p>
					</div>
					<div class="flex-1 p-6 border-[3px] border-black bg-[#EBEBEB] relative">
						<div
							class="absolute -top-4 -left-4 w-10 h-10 bg-black text-white flex items-center justify-center font-black text-xl border-[2px] border-white shadow-[3px_3px_0_0_#ff6b6b]"
						>
							3
						</div>
						<h3 class="text-xl font-black mt-2 mb-2 uppercase">Convert</h3>
						<p class="font-bold text-gray-700">
							Click convert to generate your {currentFormat.fullName} image instantly.
						</p>
					</div>
				</div>
			</section>

			<!-- Best Practices Section -->
			<section
				class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300"
			>
				<h2 class="text-3xl font-bold mb-6 text-gray-900">
					Best Practices for {currentFormat.fullName} Conversion {#if hasSize} at {sizeString}{/if}
				</h2>
				<ul class="text-lg text-gray-700 space-y-4">
					<li class="flex items-start gap-3">
						<svg
							class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<span>Optimize your HTML design for {currentFormat.bestFor}</span>
					</li>
					<li class="flex items-start gap-3">
						<svg
							class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<span>Consider the final image dimensions</span>
					</li>
					<li class="flex items-start gap-3">
						<svg
							class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<span>Test across different devices</span>
					</li>
				</ul>
			</section>

			<!-- FAQ Section -->
			<section
				class="mb-16 border-[3px] border-black p-6 md:p-8 bg-white shadow-[8px_8px_0_0_#9ca3af]"
			>
				<h2 class="text-3xl font-black mb-8 text-black uppercase">FAQ</h2>
				<div class="space-y-4">
					<details class="group">
						<summary
							class="flex items-center justify-between cursor-pointer bg-white p-4 border-[3px] border-black transition-all hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"
						>
							<span class="font-black text-lg text-gray-900 uppercase">How does it work?</span>
							<span
								class="border-[2px] border-black p-1 bg-black text-white group-open:bg-white group-open:text-black transition-colors"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 group-open:rotate-180 transition-transform"
									viewBox="0 0 20 20"
									fill="currentColor"
									><path
										fill-rule="evenodd"
										d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/></svg
								>
							</span>
						</summary>
						<div
							class="mt-0 p-4 border-l-[3px] border-r-[3px] border-b-[3px] border-black bg-gray-50 text-black font-medium"
						>
							Our converter renders your HTML code in a virtual browser environment and captures the
							output as a high-quality {format.toUpperCase()} image. This process ensures that your HTML
							is accurately represented in the final image.
						</div>
					</details>

					<details class="group">
						<summary
							class="flex items-center justify-between cursor-pointer bg-white p-4 border-[3px] border-black transition-all hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"
						>
							<span class="font-black text-lg text-gray-900 uppercase">External resources?</span>
							<span
								class="border-[2px] border-black p-1 bg-black text-white group-open:bg-white group-open:text-black transition-colors"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 group-open:rotate-180 transition-transform"
									viewBox="0 0 20 20"
									fill="currentColor"
									><path
										fill-rule="evenodd"
										d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/></svg
								>
							</span>
						</summary>
						<div
							class="mt-0 p-4 border-l-[3px] border-r-[3px] border-b-[3px] border-black bg-gray-50 text-black font-medium"
						>
							Yes, our converter supports HTML with external resources such as images and
							stylesheets. However, for the best results and fastest conversion, we recommend using
							inline styles and data URIs for images when possible.
						</div>
					</details>

					<details class="group">
						<summary
							class="flex items-center justify-between cursor-pointer bg-white p-4 border-[3px] border-black transition-all hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"
						>
							<span class="font-black text-lg text-gray-900 uppercase">Max file size?</span>
							<span
								class="border-[2px] border-black p-1 bg-black text-white group-open:bg-white group-open:text-black transition-colors"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 group-open:rotate-180 transition-transform"
									viewBox="0 0 20 20"
									fill="currentColor"
									><path
										fill-rule="evenodd"
										d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/></svg
								>
							</span>
						</summary>
						<div
							class="mt-0 p-4 border-l-[3px] border-r-[3px] border-b-[3px] border-black bg-gray-50 text-black font-medium"
						>
							Our free tool supports HTML files up to 5MB in size. For larger files or batch
							conversions, consider upgrading to our premium plan or API service.
						</div>
					</details>

					<details class="group">
						<summary
							class="flex items-center justify-between cursor-pointer bg-white p-4 border-[3px] border-black transition-all hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"
						>
							<span class="font-black text-lg text-gray-900 uppercase">Privacy?</span>
							<span
								class="border-[2px] border-black p-1 bg-black text-white group-open:bg-white group-open:text-black transition-colors"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 group-open:rotate-180 transition-transform"
									viewBox="0 0 20 20"
									fill="currentColor"
									><path
										fill-rule="evenodd"
										d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/></svg
								>
							</span>
						</summary>
						<div
							class="mt-0 p-4 border-l-[3px] border-r-[3px] border-b-[3px] border-black bg-gray-50 text-black font-medium"
						>
							Yes, we take your privacy seriously. Your HTML code is processed in real-time and is
							not stored on our servers. Once the conversion is complete, all data is immediately
							deleted.
						</div>
					</details>
				</div>
			</section>

			<!-- Best Practices Section -->
			<section
				class="mb-16 border-[3px] border-black p-6 md:p-8 bg-white shadow-[8px_8px_0_0_#9ca3af]"
			>
				<h2 class="text-3xl font-black mb-8 text-black uppercase">Best Practices</h2>
				<ul class="text-lg text-black space-y-4 font-medium">
					<li class="flex items-start gap-4">
						<div
							class="w-6 h-6 bg-black text-white flex items-center justify-center flex-shrink-0 mt-1"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/></svg
							>
						</div>
						<span>Optimize your HTML design for {currentFormat.bestFor}</span>
					</li>
					<li class="flex items-start gap-4">
						<div
							class="w-6 h-6 bg-black text-white flex items-center justify-center flex-shrink-0 mt-1"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/></svg
							>
						</div>
						<span>Consider the final image dimensions to optimize your HTML layout</span>
					</li>
					<li class="flex items-start gap-4">
						<div
							class="w-6 h-6 bg-black text-white flex items-center justify-center flex-shrink-0 mt-1"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/></svg
							>
						</div>
						<span>Test your {currentFormat.fullName} images across different devices</span>
					</li>
					<li class="flex items-start gap-4">
						<div
							class="w-6 h-6 bg-black text-white flex items-center justify-center flex-shrink-0 mt-1"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/></svg
							>
						</div>
						<span>Use appropriate compression settings to balance quality and file size</span>
					</li>
					<li class="flex items-start gap-4">
						<div
							class="w-6 h-6 bg-black text-white flex items-center justify-center flex-shrink-0 mt-1"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/></svg
							>
						</div>
						<span>For text-heavy designs, ensure readability after conversion</span>
					</li>
				</ul>
			</section>

			<!-- Introduction Section -->
			<section
				class="mb-16 border-[3px] border-black p-6 md:p-8 bg-white shadow-[8px_8px_0_0_#9ca3af]"
			>
				<h2 class="text-3xl font-black mb-6 text-black uppercase">Fast, Free, Optimized.</h2>
				<p class="text-lg mb-6 text-black font-medium leading-relaxed">
					Our HTML to {currentFormat.fullName} converter is built for speed and quality. Ideal for {currentFormat.bestFor},
					ensuring your visuals are pixel-perfect.
				</p>
				<ul class="text-lg text-black space-y-4 font-bold">
					{#each currentFormat.benefits as benefit}
						<li class="flex items-center gap-4">
							<div class="w-2 h-2 bg-black" />
							<span>{benefit}</span>
						</li>
					{/each}
					<li class="flex items-center gap-4">
						<div class="w-2 h-2 bg-black" />
						<span>Instant Conversion in seconds</span>
					</li>
					<li class="flex items-center gap-4">
						<div class="w-2 h-2 bg-black" />
						<span>Privacy-Focused & Secure</span>
					</li>
				</ul>
			</section>

			<!-- Why Choose Section -->
			<section
				class="mb-16 border-[3px] border-black p-6 md:p-8 bg-black shadow-[8px_8px_0_0_#9ca3af]"
			>
				<h2
					class="text-3xl font-black mb-8 text-white uppercase border-b-[3px] border-white inline-block pb-2"
				>
					Why Choose This Tool?
				</h2>
				<div class="space-y-6">
					<div
						class="bg-white p-6 border-[3px] border-white relative md:-right-4 shadow-[4px_4px_0_0_#333]"
					>
						<h3 class="text-2xl font-black mb-2 text-black uppercase">
							Optimized for {currentFormat.bestFor}
						</h3>
						<p class="text-lg text-black font-medium">
							{currentFormat.fullName} is excellent for {currentFormat.bestFor}, making it a go-to
							choice.
						</p>
					</div>
					<div
						class="bg-white p-6 border-[3px] border-white relative md:-right-8 shadow-[4px_4px_0_0_#333]"
					>
						<h3 class="text-2xl font-black mb-2 text-black uppercase">Key Advantages</h3>
						<p class="text-lg text-black font-medium">{currentFormat.benefits.join('. ')}.</p>
					</div>
					<div
						class="bg-white p-6 border-[3px] border-white relative md:-right-12 shadow-[4px_4px_0_0_#333]"
					>
						<h3 class="text-2xl font-black mb-2 text-black uppercase">Considerations</h3>
						<p class="text-lg text-black font-medium">
							While {currentFormat.fullName} excels in many areas, it's worth noting that {currentFormat.drawbacks}.
						</p>
					</div>
				</div>
			</section>

			<!-- Add this section after the "Why Choose Section" -->
			<section
				class="mb-16 border-[3px] border-black bg-white p-6 md:p-8 shadow-[8px_8px_0_0_#9ca3af]"
			>
				<h2 class="text-3xl font-black mb-8 text-black uppercase">
					{currentFormat.fullName} vs Others
				</h2>

				<!-- Comparison Table -->
				<div class="overflow-x-auto border-[3px] border-black">
					<table class="min-w-full divide-y divide-black">
						<thead>
							<tr>
								<th
									class="px-6 py-4 bg-black text-left text-xs font-black text-white uppercase tracking-wider"
									>Feature</th
								>
								{#each [currentFormat, ...otherFormats.map((f) => formatInfo[f])] as format}
									<th
										class="px-6 py-4 bg-black border-l-[3px] border-white text-left text-xs font-black text-white uppercase tracking-wider"
										>{format.fullName}</th
									>
								{/each}
							</tr>
						</thead>
						<tbody class="bg-white divide-y-[3px] divide-black">
							<tr>
								<td
									class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r-[3px] border-black bg-gray-50"
									>Best For</td
								>
								{#each [currentFormat, ...otherFormats.map((f) => formatInfo[f])] as format, i}
									<td
										class={`px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 ${
											i > 0 ? 'border-l-[3px] border-black' : ''
										}`}>{format.bestFor}</td
									>
								{/each}
							</tr>
							<tr>
								<td
									class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r-[3px] border-black bg-gray-50"
									>Compression</td
								>
								{#each [currentFormat, ...otherFormats.map((f) => formatInfo[f])] as format, i}
									<td
										class={`px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 ${
											i > 0 ? 'border-l-[3px] border-black' : ''
										}`}
									>
										{format.fullName === 'WebP'
											? 'Lossy & Lossless'
											: format.fullName === 'PNG'
											? 'Lossless'
											: 'Lossy'}
									</td>
								{/each}
							</tr>
							<tr>
								<td
									class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r-[3px] border-black bg-gray-50"
									>File Size</td
								>
								{#each [currentFormat, ...otherFormats.map((f) => formatInfo[f])] as format, i}
									<td
										class={`px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 ${
											i > 0 ? 'border-l-[3px] border-black' : ''
										}`}
									>
										{format.fullName === 'WebP'
											? 'Small'
											: format.fullName === 'PNG'
											? 'Large'
											: 'Medium'}
									</td>
								{/each}
							</tr>
							<tr>
								<td
									class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r-[3px] border-black bg-gray-50"
									>Transparency</td
								>
								{#each [currentFormat, ...otherFormats.map((f) => formatInfo[f])] as format, i}
									<td
										class={`px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 ${
											i > 0 ? 'border-l-[3px] border-black' : ''
										}`}
									>
										{format.fullName === 'PNG' ? 'Yes' : 'No'}
									</td>
								{/each}
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- Case Studies Section -->
			<section
				class="mb-16 border-[3px] border-black p-6 md:p-8 bg-white shadow-[8px_8px_0_0_#9ca3af]"
			>
				<h2 class="text-3xl font-black mb-8 text-black uppercase">Real-World Use Cases</h2>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="bg-[#f0f9ff] p-6 border-[3px] border-black hover:bg-white transition-colors">
						<h3 class="text-xl font-black mb-2 text-black uppercase">Social Media</h3>
						<p class="text-black font-medium">
							Create eye-catching social media posts directly from HTML templates.
						</p>
					</div>
					<div class="bg-[#fdf2f8] p-6 border-[3px] border-black hover:bg-white transition-colors">
						<h3 class="text-xl font-black mb-2 text-black uppercase">Email Campaigns</h3>
						<p class="text-black font-medium">
							Generate optimized images for email newsletters that load quickly.
						</p>
					</div>
					<div class="bg-[#fefce8] p-6 border-[3px] border-black hover:bg-white transition-colors">
						<h3 class="text-xl font-black mb-2 text-black uppercase">Website Mockups</h3>
						<p class="text-black font-medium">
							Quickly create and share website designs with clients.
						</p>
					</div>
					<div class="bg-[#f0fdf4] p-6 border-[3px] border-black hover:bg-white transition-colors">
						<h3 class="text-xl font-black mb-2 text-black uppercase">Documentation</h3>
						<p class="text-black font-medium">
							Easily include web page screenshots in technical docs.
						</p>
					</div>
				</div>
			</section>

			<!-- Technical Details Section -->
			<section
				class="mb-16 border-[3px] border-black p-6 md:p-8 bg-white shadow-[8px_8px_0_0_#9ca3af]"
			>
				<h2 class="text-3xl font-black mb-8 text-black uppercase">Technical Specs</h2>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="bg-gray-50 p-6 border-[3px] border-black">
						<h3 class="text-xl font-black mb-2 text-black uppercase">Conversion Process</h3>
						<p class="text-black font-medium">
							Headless browser rendering ensures pixel-perfect conversion.
						</p>
					</div>
					<div class="bg-gray-50 p-6 border-[3px] border-black">
						<h3 class="text-xl font-black mb-2 text-black uppercase">Image Quality</h3>
						<p class="text-black font-medium">
							Generated at 96 DPI with optimized compression settings.
						</p>
					</div>
					<div class="bg-gray-50 p-6 border-[3px] border-black">
						<h3 class="text-xl font-black mb-2 text-black uppercase">Supported Features</h3>
						<ul class="text-black font-medium list-disc pl-5">
							<li>CSS3 and JavaScript rendering</li>
							<li>Custom dimensions up to 4000x4000px</li>
							<li>Web fonts supported</li>
						</ul>
					</div>
					<div class="bg-gray-50 p-6 border-[3px] border-black">
						<h3 class="text-xl font-black mb-2 text-black uppercase">Performance</h3>
						<p class="text-black font-medium">Average conversion time under 5 seconds.</p>
					</div>
				</div>
			</section>
		</div>
	</main>
	<RelatedTools tools={['html-email', 'table', 'certificate', 'quote-card']} />

		<!-- Internal Links -->
		<section class="mb-16 w-full max-w-5xl mx-auto px-4">
			<h2 class="text-2xl font-black mb-6 text-black uppercase text-center">Related Tools</h2>
			<div class="flex flex-wrap gap-3 justify-center">
				<a href="/tools/url-to-image-generator" class="px-4 py-2 border-[3px] border-black bg-white font-bold text-sm hover:bg-[#ffc480] hover:shadow-[4px_4px_0_0_#000] transition-all">URL to Image</a>
				<a href="/tools/code-to-image" class="px-4 py-2 border-[3px] border-black bg-white font-bold text-sm hover:bg-[#ffc480] hover:shadow-[4px_4px_0_0_#000] transition-all">Code to Image</a>
				<a href="/tools/og-image-generator" class="px-4 py-2 border-[3px] border-black bg-white font-bold text-sm hover:bg-[#ffc480] hover:shadow-[4px_4px_0_0_#000] transition-all">OG Image Generator</a>
				<a href="/glossary/html-to-image" class="px-4 py-2 border-[3px] border-black bg-white font-bold text-sm hover:bg-[#ffc480] hover:shadow-[4px_4px_0_0_#000] transition-all">What is HTML to Image?</a>
				<a href="/compare" class="px-4 py-2 border-[3px] border-black bg-white font-bold text-sm hover:bg-[#ffc480] hover:shadow-[4px_4px_0_0_#000] transition-all">Compare Alternatives</a>
			</div>
		</section>

	<Footer />

	<StickySignupBar bind:this={stickyBar} toolName={`html_to_${format}`} />
</section>

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

<style>
	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-20px);
		}
	}

	@keyframes float-delayed {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(20px);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.6;
		}
		50% {
			opacity: 0.3;
		}
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
