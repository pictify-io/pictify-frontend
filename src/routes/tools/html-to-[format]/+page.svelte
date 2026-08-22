<script>
	/**
	 * /tools/html-to-[format] — the v2 tool page.
	 *
	 * The SEO copy on this page is frozen: every heading, FAQ answer and body
	 * paragraph below is the wording that ranks today, moved into the new
	 * layout unchanged. Only the tool surface, the CTAs and the styling are new.
	 *
	 * Conversion lives inside the tool, not around it: a quota ladder in the
	 * toolbar and a result card after each render. Nothing gates or degrades a
	 * finished file.
	 */
	import {
		popularSizes as configPopularSizes,
		ogPlatforms,
		dimensionContexts
	} from '$lib/pseo/config.js';
	import CodeEditor from '$lib/components/tools/CodeEditor.svelte';
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolCard from '$lib/components/tools/v2/ToolCard.svelte';
	import QuotaMeter from '$lib/components/tools/v2/QuotaMeter.svelte';
	import GenerateButton from '$lib/components/tools/v2/GenerateButton.svelte';
	import ResultCard from '$lib/components/tools/v2/ResultCard.svelte';
	import AutomateSection from '$lib/components/tools/v2/AutomateSection.svelte';
	import LongformSection from '$lib/components/tools/v2/LongformSection.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { user } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';
	import { createImagePublic } from '../../../api/image.js';
	import { generationLimits } from '../../../store/generationLimits.store';
	import { analytics } from '$lib/telemetry.js';
	import RelatedTools from '$lib/components/tools/RelatedTools.svelte';
	import { saveLastRender } from '$lib/lastRender.js';
	import posthog from 'posthog-js';
	$: format = $page.params.format;
	$: toolKey = `html_to_${format}`;
	$: toolPath = `/tools/html-to-${format}`;

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
		? `HTML to ${
				(currentFormat && currentFormat.fullName) || 'Image'
		  } ${sizeString}: Free Converter | Pictify`
		: format === 'png'
		? `HTML to PNG: Free Online Converter & API | Pictify`
		: format === 'jpg'
		? `HTML to JPG: Free Online Converter & API | Pictify`
		: format === 'image'
		? `HTML to Image: Convert HTML & CSS to PNG, JPG or WebP (Free + API) | Pictify`
		: `HTML to ${
				(format && format.toUpperCase()) || 'Image'
		  }: Free Online Converter & API | Pictify`;
	$: headDescription = hasSize
		? `Convert HTML to ${
				(currentFormat && currentFormat.fullName) || 'image'
		  } at ${sizeString} instantly. Paste your code, preview live, and export. No file upload needed.`
		: format === 'png'
		? `Paste HTML + CSS, preview it live, and export a high-quality PNG in one click. Free online converter with a built-in code editor. No signup, no file upload. API available for automation.`
		: format === 'jpg'
		? `Free online HTML to JPG converter: paste HTML + CSS, preview it live, and download a high-quality JPG in one click. No signup, no file upload. API available for automation.`
		: format === 'image'
		? `Convert HTML and CSS to an image (PNG, JPG, or WebP) instantly. Paste code, preview live, and export, or automate with the API. Free, no signup, no file upload.`
		: `Convert HTML to ${
				(format && format.toUpperCase()) || 'IMAGE'
		  } images instantly. Paste your code, preview live, and export. Free online tool with built-in editor and API access.`;
	// Size variants canonicalize to the parent format page so they don't
	// compete with it in search (they were outranking it for head terms).
	$: canonicalUrl = `https://pictify.io/tools/html-to-${format}`;
	$: ogDescription = hasSize
		? `Convert HTML to high-quality ${
				(currentFormat && currentFormat.fullName) || 'Image'
		  } at ${sizeString}. Paste code, preview live, export instantly. No file upload needed.`
		: `Paste HTML + CSS and get a high-quality ${
				(format && format.toUpperCase()) || 'image'
		  } in one click. Free online converter with a live code editor and API access for developers.`;

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
	function copyToClipboard(text, contentType = 'image_url') {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				analytics.trackCopy({
					content_type: contentType,
					context: 'tool_result',
					tool_name: `html_to_${format}`
				});
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

	// The /tools/html-to-image hub renders PNG output by default (general-purpose
	// HTML→image tool). Truly-invalid formats still resolve to undefined below and
	// trigger the redirect to html-to-jpg.
	$: fileExtension = format === 'image' ? 'png' : formatExtensionMap[format];

	$: if (!fileExtension) {
		if (browser) {
			goto('/tools/html-to-jpg');
		}
	}

	let formats = ['jpg', 'png', 'webp'];
	const popularSizes = configPopularSizes;
	const featuredPlatforms = ogPlatforms.slice(0, 3);

	function handleFormatChange(event) {
		const newFormat = event.target.value;
		if (browser) {
			goto(`/tools/html-to-${newFormat}`);
		}
	}

	function trackSignupClick(ctaLocation) {
		analytics.track('tool_signup_click', {
			tool_name: `html_to_${format}`,
			cta_location: ctaLocation
		});
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

	// Add user store subscription
	let isUserLoggedIn = false;
	user.subscribe((userData) => {
		isUserLoggedIn = !!userData.email;
	});

	/**
	 * True once a guest's render has used up the last free one today. Drives the
	 * result card's limit state — the render itself is never withheld.
	 */
	let lastFreeRender = false;

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

		// The button is already a signup link at zero; this only guards a
		// programmatic call.
		if (!isUserLoggedIn && freeGenerationsUsed >= effectiveMaxFreeGenerations) return;

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

			saveLastRender({
				tool: `html_to_${format}`,
				html: previewHtml,
				width: widthToUse,
				height: heightToUse,
				format: fileExtension || format,
				imageUrl: image.url
			});

			// Track image generation
			analytics.trackImageGenerated({
				tool_name: `html_to_${format}`,
				format: fileExtension || format,
				with_watermark: !isUserLoggedIn
			});

			// Update usage tracking for non-logged in users
			if (!isUserLoggedIn) {
				updateUsage();
				// The limit variant of the result card only makes sense on the render
				// that spent the allowance, and only for the experiment's treatment
				// arm; the control arm keeps the plain card so the two stay comparable.
				lastFreeRender =
					freeGenerationsUsed >= effectiveMaxFreeGenerations && stickyVariant !== 'control';
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

	// Hub info object for the general /tools/html-to-image page. Kept OUT of
	// formatInfo / formats on purpose so it never leaks into the png/jpg/webp
	// selectors, comparison tables, or "other formats" lists.
	const imageHubInfo = {
		fullName: 'Image',
		benefits: [
			'Pick PNG, JPG, or WebP output',
			'Lossless or compressed',
			'Perfect for social, OG, email & screenshots'
		],
		bestFor: 'social cards, OG images, emails, certificates, and screenshots',
		drawbacks: ''
	};

	// Add safe access to format info
	$: currentFormat =
		format === 'image' ? imageHubInfo : formatInfo[format] || defaultFormatInfo.jpg;
	$: otherFormats = Object.keys(formatInfo).filter((f) => f !== format);

	/**
	 * `tool-sticky-signup-bar` used to decide whether a sticky bottom bar
	 * appeared after a render. The bar is gone; its treatment arm now renders
	 * the limit variant of the result card instead, so the running experiment
	 * keeps reading against the same flag.
	 */
	let stickyVariant = 'control';
	onMount(() => {
		if (browser) stickyVariant = posthog.getFeatureFlag?.('tool-sticky-signup-bar') || 'control';
	});

	// Bound to the editor so the toolbar can drive the render size.
	let editorWidth = 1200;
	let editorHeight = 630;

	const TOC = [
		{ id: 'key-features', label: 'Key Features' },
		{ id: 'choosing-format', label: 'Choosing the Right Format' },
		{ id: 'how-to-convert', label: 'How to Convert' },
		{ id: 'best-practices-format', label: 'Best Practices' },
		{ id: 'faq', label: 'FAQ' },
		{ id: 'why-choose', label: 'Why Choose This Tool?' },
		{ id: 'vs-others', label: 'Format vs Others' },
		{ id: 'use-cases', label: 'Use Cases & Technical Specs' }
	];

	const RELATED = [
		{
			title: 'Table to image',
			meta: 'CSV · HTML → PNG',
			href: '/tools/table',
			art: '/landing/tools/table-to-image.svg'
		},
		{
			title: 'Code to image',
			meta: 'SNIPPET → PNG',
			href: '/tools/code-to-image',
			art: '/landing/tools/code-to-image.svg'
		},
		{
			title: 'OG image generator',
			meta: 'TITLE · LOGO → 1200×630',
			href: '/tools/og-image-generator',
			art: '/landing/tools/og-image-generator.svg'
		}
	];

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
								name: `How do I convert HTML to ${currentFormat?.fullName || 'image'}?`,
								acceptedAnswer: {
									'@type': 'Answer',
									text: `Paste your HTML and CSS code into Pictify's free online editor, see a live preview, then click "Capture" to download a high-quality ${
										currentFormat?.fullName || 'image'
									} file. No file upload or signup needed. You can also use the Pictify API to convert HTML to ${
										currentFormat?.fullName || 'image'
									} programmatically.`
								}
							},
							{
								'@type': 'Question',
								name: `Can I convert HTML to ${currentFormat?.fullName || 'image'} with an API?`,
								acceptedAnswer: {
									'@type': 'Answer',
									text: `Yes. Send a POST request to the Pictify API with your HTML code, width, and height. The API returns a CDN-hosted ${
										currentFormat?.fullName || 'image'
									} URL. Supports custom CSS, Google Fonts, and dynamic variables. Free tier includes 100 renders per month.`
								}
							},
							{
								'@type': 'Question',
								name: `Is this HTML to ${currentFormat?.fullName || 'image'} converter free?`,
								acceptedAnswer: {
									'@type': 'Answer',
									text: `Yes, the online converter is completely free with no signup required. You get ${
										format === 'png' ? '5' : '5'
									} free generations per day as a guest, and unlimited generations when you create a free account.`
								}
							},
							{
								'@type': 'Question',
								name: `What is ${currentFormat?.fullName || 'this format'} best for?`,
								acceptedAnswer: {
									'@type': 'Answer',
									text: `${currentFormat?.fullName || 'Image'} is best for ${
										currentFormat?.bestFor || 'web use'
									}. Common use cases include social media cards, Open Graph images, email headers, certificates, and automated report generation.`
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
			: format === 'image'
			? `html to image, convert html to image, html and css to image, html to image converter, html to png, html to jpg, html to webp, online image generator, web design tool, Pictify.io`
			: `convert image from HTML, HTML to ${format.toUpperCase()}, ${format.toUpperCase()} converter, online image generator, web design tool, ${
					currentFormat.fullName
			  } image creator, Pictify.io`}
	/>
	<meta name="author" content="Pictify.io" />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<meta property="og:title" content={headTitle} />
	<meta property="og:description" content={ogDescription} />
	<meta property="og:image" content="https://media.pictify.io/gre6p-1775406841745.png" />
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
			{
				'@type': 'ListItem',
				position: 3,
				name: 'HTML to ' + (format ? format.toUpperCase() : 'Image')
			}
		]
	})}</script>`}
</svelte:head>

<ToolPageShell
	toolName={toolKey}
	{toolPath}
	breadcrumb={`HTML TO ${currentFormat.fullName.toUpperCase()}`}
	facts={`FREE · ${effectiveMaxFreeGenerations} RENDERS A DAY · NO SIGNUP · ALSO ${otherFormats
		.map((f) => f.toUpperCase())
		.join(' & ')}`}
	toc={TOC}
	related={RELATED}
	loggedIn={isUserLoggedIn}
	hasResult={!!imageUrl}
	longform="rail"
>
	<h1
		slot="h1"
		class="font-display text-[38px] font-extrabold leading-[1.04] tracking-[-0.02em] text-brand-ink lg:text-[52px] lg:leading-[56px]"
	>
		<span>HTML TO</span>
		<span>{currentFormat.fullName}</span>
		{#if hasSize}
			<span class="whitespace-nowrap">{sizeString}</span>
		{/if}
	</h1>

	<p
		slot="hero-sub"
		class="max-w-[640px] font-sans text-base leading-[25px] text-[#2A2C1E] lg:text-lg lg:leading-[27px]"
	>
		{#if format === 'image'}
			Convert your HTML &amp; CSS into an image in one click: export PNG, JPG, or WebP.
			<span class="text-brand-slate">Perfect for {currentFormat.bestFor}</span>
		{:else}
			Transform your HTML code into high-quality {currentFormat.fullName} images instantly.
			<span class="text-brand-slate">Perfect for {currentFormat.bestFor}</span>
		{/if}
	</p>

	<!-- ── Tool ──────────────────────────────────────────────────────── -->
	<div slot="tool">
		<ToolCard>
			<CodeEditor
				variant="v2"
				isPreviewEnabled={true}
				{fileExtension}
				toolName={toolKey}
				bind:previewWidth={editorWidth}
				bind:previewHeight={editorHeight}
				on:previewUpdated={handlePreviewUpdate}
			/>

			<svelte:fragment slot="toolbar-left">
				{#each formats as f}
					<a
						href={`/tools/html-to-${f}`}
						class="rounded-full px-3 py-1 font-mono text-[11px] tracking-[0.04em] transition-colors {f ===
						format
							? 'bg-brand-ink text-white'
							: 'border border-brand-rule text-brand-ink hover:border-brand-ink'}"
					>
						{f.toUpperCase()}
					</a>
				{/each}

				<span class="ml-1 flex items-center gap-2 border-l border-brand-rule pl-3.5">
					<label
						class="flex items-center gap-1.5 border border-brand-ink bg-brand-paper px-2.5 py-[5px]"
					>
						<span class="sr-only">Width</span>
						<input
							type="number"
							min="100"
							max="4000"
							disabled={hasSize}
							bind:value={editorWidth}
							class="w-[52px] bg-transparent text-center font-mono text-xs tracking-[0.06em] text-brand-ink outline-none disabled:text-brand-mute"
						/>
						<span class="font-mono text-xs text-brand-mute" aria-hidden="true">×</span>
						<span class="sr-only">Height</span>
						<input
							type="number"
							min="100"
							max="4000"
							disabled={hasSize}
							bind:value={editorHeight}
							class="w-[52px] bg-transparent text-center font-mono text-xs tracking-[0.06em] text-brand-ink outline-none disabled:text-brand-mute"
						/>
					</label>
					<span class="hidden font-mono text-xs tracking-[0.06em] text-brand-mute sm:inline">
						2× RETINA
					</span>
				</span>
			</svelte:fragment>

			<svelte:fragment slot="toolbar-right">
				<QuotaMeter
					remaining={remainingGenerations}
					limit={effectiveMaxFreeGenerations}
					loggedIn={isUserLoggedIn}
					toolName={toolKey}
					{toolPath}
				/>
				<GenerateButton
					label={`Generate ${currentFormat.fullName}`}
					loading={isImageGenerating}
					remaining={remainingGenerations}
					loggedIn={isUserLoggedIn}
					toolName={toolKey}
					{toolPath}
					on:generate={generateImage}
				/>
			</svelte:fragment>
		</ToolCard>

		{#if format === 'image'}
			<p class="mt-5 text-sm font-bold text-brand-slate">
				Need a specific format? Use
				<a
					href="/tools/html-to-png"
					class="underline decoration-2 decoration-brand-pink underline-offset-2 hover:bg-brand-accent"
					>HTML to PNG</a
				>,
				<a
					href="/tools/html-to-jpg"
					class="underline decoration-2 decoration-brand-pink underline-offset-2 hover:bg-brand-accent"
					>HTML to JPG</a
				>, or
				<a
					href="/tools/html-to-webp"
					class="underline decoration-2 decoration-brand-pink underline-offset-2 hover:bg-brand-accent"
					>HTML to WebP</a
				>.
			</p>
		{/if}

		{#if hasSize}
			<div class="border-t border-dashed border-brand-rule my-8" />
			<div>
				<h4 class="font-semibold text-lg md:text-xl mb-6 tracking-tight flex items-center gap-3">
					<span
						class="w-8 h-8 bg-brand-ink text-white flex items-center justify-center text-sm font-bold border border-brand-ink"
						>02</span
					>
					Output Dimensions
				</h4>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
					{#each popularSizes as sz}
						<a href={`/tools/html-to-${format}/${sz}`} class="group block">
							<div
								class={`px-2 py-3 border border-brand-ink text-sm font-bold text-center transition-all duration-200
								${
									sizeString === sz
										? 'bg-brand-ink text-white'
										: 'bg-brand-paper text-brand-ink hover:bg-gray-50 hover:'
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
				<div class="border-t border-dashed border-brand-rule my-8" />
				<div class="bg-brand-proof/10 border border-brand-proof rounded-tile p-6">
					<div class="flex flex-wrap items-center gap-3 mb-4">
						<span
							class="px-3 py-1 bg-brand-proof text-brand-ink font-semibold text-sm rounded-full border-2 border-black"
						>
							{dimensionContext.label}
						</span>
						<span class="text-sm font-bold text-brand-slate">
							Aspect Ratio: {dimensionContext.aspectRatio}
						</span>
					</div>
					<p class="text-brand-slate font-medium mb-4">{dimensionContext.description}</p>

					<div class="flex flex-wrap gap-2 mb-4">
						<span class="text-xs font-bold tracking-wide text-brand-mute">Works with:</span>
						{#each dimensionContext.platforms as platform}
							<span
								class="px-2 py-1 bg-brand-paper border-2 border-gray-300 rounded text-xs font-bold text-brand-slate"
							>
								{platform}
							</span>
						{/each}
					</div>

					{#if dimensionContext.useCases?.length}
						<div class="flex flex-wrap gap-2">
							<span class="text-xs font-bold tracking-wide text-brand-mute">Best for:</span>
							{#each dimensionContext.useCases as useCase}
								<span
									class="px-2 py-1 bg-brand-subtle rounded text-xs font-medium text-brand-slate"
								>
									{useCase}
								</span>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>

	<!-- ── Result ────────────────────────────────────────────────────── -->
	<div slot="result">
		{#if imageUrl}
			<ResultCard
				{imageUrl}
				formatLabel={currentFormat.fullName}
				fileExtension={fileExtension || format}
				width={hasSize ? dimWidth : editorWidth}
				height={hasSize ? dimHeight : editorHeight}
				loggedIn={isUserLoggedIn}
				lastFree={lastFreeRender}
				toolName={toolKey}
				{toolPath}
				html={previewHtml}
			/>
		{/if}
	</div>

	<!-- ── Long-form ─────────────────────────────────────────────────── -->
	<svelte:fragment slot="longform">
		<LongformSection index="01" id="key-features" first>
			<h2
				slot="heading"
				class="font-display text-[32px] font-bold leading-[42px] tracking-[-0.02em] text-brand-ink"
			>
				Key Features {#if hasSize} for {currentFormat.fullName} at {sizeString}{/if}
			</h2>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
				{#each currentFormat.benefits as benefit, i}
					<div class="bg-brand-subtle border border-brand-ink p-6 transition-all duration-200">
						<div class="flex flex-col items-start gap-4">
							<div
								class="w-10 h-10 bg-brand-ink text-white flex items-center justify-center font-semibold text-lg border-[2px] border-transparent"
							>
								{i + 1}
							</div>
							<div>
								<p class="text-brand-ink font-bold text-lg leading-tight">
									{benefit}
									{#if hasSize}(works great at {sizeString}){/if}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</LongformSection>

		<AutomateSection
			title="Automate with the"
			titleHighlight="API"
			toolName={toolKey}
			description={`Convert HTML to ${
				(format && format.toUpperCase()) || 'image'
			} programmatically. Render social cards, email headers, and marketing visuals in your CI/CD pipeline.`}
			codeExamples={htmlToImageExamples}
		/>

		<LongformSection index="02" id="choosing-format">
			<h2
				slot="heading"
				class="font-display text-[32px] font-bold leading-[42px] tracking-[-0.02em] text-brand-ink"
			>
				HTML to Image: Choosing the Right Format
			</h2>
			<div class="overflow-x-auto">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="border-b border-brand-ink">
							<th class="p-3 font-semibold text-sm">Format</th>
							<th class="p-3 font-semibold text-sm">Best For</th>
							<th class="p-3 font-semibold text-sm">Transparency</th>
							<th class="p-3 font-semibold text-sm">File Size</th>
						</tr>
					</thead>
					<tbody class="text-sm font-medium text-brand-slate">
						<tr class="border-b border-brand-rule {format === 'png' ? 'bg-brand-field/30' : ''}">
							<td class="p-3 font-semibold">PNG</td>
							<td class="p-3">Screenshots, UI elements, text-heavy images</td>
							<td class="p-3">Yes</td>
							<td class="p-3">Large</td>
						</tr>
						<tr class="border-b border-brand-rule {format === 'jpg' ? 'bg-brand-field/30' : ''}">
							<td class="p-3 font-semibold">JPG</td>
							<td class="p-3">Photos, OG images, social cards, email headers</td>
							<td class="p-3">No</td>
							<td class="p-3">Small</td>
						</tr>
						<tr class={format === 'webp' ? 'bg-brand-field/30' : ''}>
							<td class="p-3 font-semibold">WebP</td>
							<td class="p-3">Web graphics, combining quality of PNG with size of JPG</td>
							<td class="p-3">Yes</td>
							<td class="p-3">Smallest</td>
						</tr>
					</tbody>
				</table>
			</div>
		</LongformSection>

		<LongformSection index="03" id="other-formats">
			<h2
				slot="heading"
				class="font-display text-[32px] font-bold leading-[42px] tracking-[-0.02em] text-brand-ink"
			>
				Try Other Formats {#if hasSize} at {sizeString}{/if}
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each otherFormats as otherFormat}
					<a
						href={`/tools/html-to-${otherFormat}`}
						class="flex items-center gap-4 p-5 transition-all border border-brand-ink bg-brand-paper hover:bg-brand-field group"
					>
						<div
							class="w-12 h-12 bg-brand-ink text-white flex items-center justify-center font-semibold text-sm border border-brand-rule group-hover:border-black group-hover:bg-brand-paper group-hover:text-brand-ink"
						>
							{otherFormat}
						</div>
						<div>
							<h3 class="text-xl font-semibold text-brand-ink group-hover:text-brand-ink">
								{formatInfo[otherFormat].fullName}
							</h3>
							<p class="text-brand-slate font-bold text-sm group-hover:text-brand-ink">
								Perfect for {formatInfo[otherFormat].bestFor}
							</p>
						</div>
					</a>
				{/each}
				{#if format !== 'image'}
					<a
						href="/tools/html-to-image"
						class="flex items-center gap-4 p-5 transition-all border border-brand-ink bg-brand-paper hover:bg-brand-field group"
					>
						<div
							class="w-12 h-12 bg-brand-ink text-white flex items-center justify-center font-semibold text-sm border border-brand-rule group-hover:border-black group-hover:bg-brand-paper group-hover:text-brand-ink"
						>
							ALL
						</div>
						<div>
							<h3 class="text-xl font-semibold text-brand-ink group-hover:text-brand-ink">
								HTML to Image
							</h3>
							<p class="text-brand-slate font-bold text-sm group-hover:text-brand-ink">
								One converter for PNG, JPG, and WebP
							</p>
						</div>
					</a>
				{/if}
			</div>
		</LongformSection>

		<LongformSection index="04" id="social-previews">
			<h2
				slot="heading"
				class="font-display text-[32px] font-bold leading-[42px] tracking-[-0.02em] text-brand-ink"
			>
				Need social previews?
			</h2>
			<p class="text-brand-ink font-bold mb-6 text-lg">
				Create platform-optimized Open Graph images after exporting your HTML.
			</p>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each featuredPlatforms as platform}
					<a
						href={`/tools/og-image-generator/${platform.id}`}
						class="bg-brand-paper border border-brand-ink p-6 transition-all"
					>
						<h3 class="text-xl font-semibold text-brand-ink mb-2">{platform.label}</h3>
						<p class="text-sm text-brand-slate font-medium">
							Design branded OG images tailored for {platform.label}.
						</p>
					</a>
				{/each}
			</div>
		</LongformSection>

		<LongformSection index="05" id="how-to-convert">
			<h2
				slot="heading"
				class="font-display text-[32px] font-bold leading-[42px] tracking-[-0.02em] text-brand-ink"
			>
				How to Convert
			</h2>
			<div class="flex flex-col md:flex-row gap-6">
				<div class="flex-1 p-6 border border-brand-ink bg-brand-subtle relative">
					<div
						class="absolute -top-4 -left-4 w-10 h-10 bg-brand-ink text-white flex items-center justify-center font-semibold text-xl border border-brand-rule"
					>
						1
					</div>
					<h3 class="text-xl font-semibold mt-2 mb-2">Input Code</h3>
					<p class="font-bold text-brand-slate">
						Paste your HTML code in the editor above or use our default template.
					</p>
				</div>
				<div class="flex-1 p-6 border border-brand-ink bg-brand-subtle relative">
					<div
						class="absolute -top-4 -left-4 w-10 h-10 bg-brand-ink text-white flex items-center justify-center font-semibold text-xl border border-brand-rule"
					>
						2
					</div>
					<h3 class="text-xl font-semibold mt-2 mb-2">Preview</h3>
					<p class="font-bold text-brand-slate">
						Check how your HTML will look as a {currentFormat.fullName} image.
					</p>
				</div>
				<div class="flex-1 p-6 border border-brand-ink bg-brand-subtle relative">
					<div
						class="absolute -top-4 -left-4 w-10 h-10 bg-brand-ink text-white flex items-center justify-center font-semibold text-xl border border-brand-rule"
					>
						3
					</div>
					<h3 class="text-xl font-semibold mt-2 mb-2">Convert</h3>
					<p class="font-bold text-brand-slate">
						Click convert to generate your {currentFormat.fullName} image instantly.
					</p>
				</div>
			</div>
		</LongformSection>

		<LongformSection index="06" id="best-practices-format">
			<h2
				slot="heading"
				class="font-display text-[32px] font-bold leading-[42px] tracking-[-0.02em] text-brand-ink"
			>
				Best Practices for {currentFormat.fullName} Conversion {#if hasSize} at {sizeString}{/if}
			</h2>
			<ul class="text-lg text-brand-slate space-y-4">
				<li class="flex items-start gap-3">
					<svg
						class="w-6 h-6 text-brand-pink mt-1 flex-shrink-0"
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
						class="w-6 h-6 text-brand-pink mt-1 flex-shrink-0"
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
						class="w-6 h-6 text-brand-pink mt-1 flex-shrink-0"
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
		</LongformSection>

		<LongformSection index="07" id="faq">
			<h2
				slot="heading"
				class="font-display text-[32px] font-bold leading-[42px] tracking-[-0.02em] text-brand-ink"
			>
				FAQ
			</h2>
			<div class="space-y-4">
				<details class="group">
					<summary
						class="flex items-center justify-between cursor-pointer bg-brand-paper p-4 border border-brand-ink transition-all"
					>
						<span class="font-semibold text-lg text-brand-ink">How does it work?</span>
						<span
							class="border border-brand-ink p-1 bg-brand-ink text-white group-open:bg-brand-paper group-open:text-brand-ink transition-colors"
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
						class="mt-0 p-4 border-x border-b border-brand-ink bg-brand-subtle text-brand-ink font-medium"
					>
						Our converter renders your HTML code in a virtual browser environment and captures the
						output as a high-quality {format.toUpperCase()} image. This process ensures that your HTML
						is accurately represented in the final image.
					</div>
				</details>

				<details class="group">
					<summary
						class="flex items-center justify-between cursor-pointer bg-brand-paper p-4 border border-brand-ink transition-all"
					>
						<span class="font-semibold text-lg text-brand-ink">External resources?</span>
						<span
							class="border border-brand-ink p-1 bg-brand-ink text-white group-open:bg-brand-paper group-open:text-brand-ink transition-colors"
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
						class="mt-0 p-4 border-x border-b border-brand-ink bg-brand-subtle text-brand-ink font-medium"
					>
						Yes, our converter supports HTML with external resources such as images and stylesheets.
						However, for the best results and fastest conversion, we recommend using inline styles
						and data URIs for images when possible.
					</div>
				</details>

				<details class="group">
					<summary
						class="flex items-center justify-between cursor-pointer bg-brand-paper p-4 border border-brand-ink transition-all"
					>
						<span class="font-semibold text-lg text-brand-ink">Max file size?</span>
						<span
							class="border border-brand-ink p-1 bg-brand-ink text-white group-open:bg-brand-paper group-open:text-brand-ink transition-colors"
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
						class="mt-0 p-4 border-x border-b border-brand-ink bg-brand-subtle text-brand-ink font-medium"
					>
						Our free tool supports HTML files up to 5MB in size. For larger files or batch
						conversions, consider upgrading to our premium plan or API service.
					</div>
				</details>

				<details class="group">
					<summary
						class="flex items-center justify-between cursor-pointer bg-brand-paper p-4 border border-brand-ink transition-all"
					>
						<span class="font-semibold text-lg text-brand-ink">Privacy?</span>
						<span
							class="border border-brand-ink p-1 bg-brand-ink text-white group-open:bg-brand-paper group-open:text-brand-ink transition-colors"
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
						class="mt-0 p-4 border-x border-b border-brand-ink bg-brand-subtle text-brand-ink font-medium"
					>
						Yes, we take your privacy seriously. Your HTML code is processed in real-time and is not
						stored on our servers. Once the conversion is complete, all data is immediately deleted.
					</div>
				</details>
			</div>
		</LongformSection>

		<LongformSection index="08" id="best-practices">
			<h2
				slot="heading"
				class="font-display text-[32px] font-bold leading-[42px] tracking-[-0.02em] text-brand-ink"
			>
				Best Practices
			</h2>
			<ul class="text-lg text-brand-ink space-y-4 font-medium">
				<li class="flex items-start gap-4">
					<div
						class="w-6 h-6 bg-brand-ink text-white flex items-center justify-center flex-shrink-0 mt-1"
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
						class="w-6 h-6 bg-brand-ink text-white flex items-center justify-center flex-shrink-0 mt-1"
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
						class="w-6 h-6 bg-brand-ink text-white flex items-center justify-center flex-shrink-0 mt-1"
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
						class="w-6 h-6 bg-brand-ink text-white flex items-center justify-center flex-shrink-0 mt-1"
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
						class="w-6 h-6 bg-brand-ink text-white flex items-center justify-center flex-shrink-0 mt-1"
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
		</LongformSection>

		<LongformSection index="09" id="fast-free">
			<h2
				slot="heading"
				class="font-display text-[32px] font-bold leading-[42px] tracking-[-0.02em] text-brand-ink"
			>
				Fast, Free, Optimized.
			</h2>
			<p class="text-lg mb-6 text-brand-ink font-medium leading-relaxed">
				Our HTML to {currentFormat.fullName} converter is built for speed and quality. Ideal for {currentFormat.bestFor},
				ensuring your visuals are pixel-perfect.
			</p>
			<ul class="text-lg text-brand-ink space-y-4 font-bold">
				{#each currentFormat.benefits as benefit}
					<li class="flex items-center gap-4">
						<div class="w-2 h-2 bg-brand-ink" />
						<span>{benefit}</span>
					</li>
				{/each}
				<li class="flex items-center gap-4">
					<div class="w-2 h-2 bg-brand-ink" />
					<span>Instant Conversion in seconds</span>
				</li>
				<li class="flex items-center gap-4">
					<div class="w-2 h-2 bg-brand-ink" />
					<span>Privacy-Focused & Secure</span>
				</li>
			</ul>
		</LongformSection>

		<div class="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-10">
			<LongformSection index="10" id="why-choose" compact>
				<h2
					slot="heading"
					class="font-display text-2xl font-bold leading-[30px] tracking-[-0.02em] text-brand-ink"
				>
					Why Choose This Tool?
				</h2>
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-1">
						<h3 class="font-sans text-lg font-medium leading-6 text-brand-ink">
							Optimized for {currentFormat.bestFor}
						</h3>
						<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
							{currentFormat.fullName} is excellent for {currentFormat.bestFor}, making it a go-to
							choice.
						</p>
					</div>
					<div class="flex flex-col gap-1">
						<h3 class="font-sans text-lg font-medium leading-6 text-brand-ink">Key Advantages</h3>
						<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
							{currentFormat.benefits.join('. ')}.
						</p>
					</div>
					<div class="flex flex-col gap-1">
						<h3 class="font-sans text-lg font-medium leading-6 text-brand-ink">Considerations</h3>
						<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
							While {currentFormat.fullName} excels in many areas, it's worth noting that {currentFormat.drawbacks}.
						</p>
					</div>
				</div>
			</LongformSection>

			<LongformSection index="11" id="vs-others" compact>
				<h2
					slot="heading"
					class="font-display text-2xl font-bold leading-[30px] tracking-[-0.02em] text-brand-ink"
				>
					{currentFormat.fullName} vs Others
				</h2>

				<!-- Comparison Table -->
				<div class="overflow-x-auto border border-brand-ink">
					<table class="min-w-full divide-y divide-brand-rule">
						<thead>
							<tr>
								<th
									class="px-6 py-4 bg-brand-ink text-left text-xs font-semibold text-white tracking-wider"
									>Feature</th
								>
								{#each [currentFormat, ...otherFormats.map((f) => formatInfo[f])] as format}
									<th
										class="px-6 py-4 bg-brand-ink border-l border-brand-rule text-left text-xs font-semibold text-white tracking-wider"
										>{format.fullName}</th
									>
								{/each}
							</tr>
						</thead>
						<tbody class="bg-brand-paper divide-y divide-brand-rule">
							<tr>
								<td
									class="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-ink border-r border-brand-rule bg-brand-subtle"
									>Best For</td
								>
								{#each [currentFormat, ...otherFormats.map((f) => formatInfo[f])] as format, i}
									<td
										class={`px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-ink ${
											i > 0 ? 'border-l border-brand-rule' : ''
										}`}>{format.bestFor}</td
									>
								{/each}
							</tr>
							<tr>
								<td
									class="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-ink border-r border-brand-rule bg-brand-subtle"
									>Compression</td
								>
								{#each [currentFormat, ...otherFormats.map((f) => formatInfo[f])] as format, i}
									<td
										class={`px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-ink ${
											i > 0 ? 'border-l border-brand-rule' : ''
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
									class="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-ink border-r border-brand-rule bg-brand-subtle"
									>File Size</td
								>
								{#each [currentFormat, ...otherFormats.map((f) => formatInfo[f])] as format, i}
									<td
										class={`px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-ink ${
											i > 0 ? 'border-l border-brand-rule' : ''
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
									class="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-ink border-r border-brand-rule bg-brand-subtle"
									>Transparency</td
								>
								{#each [currentFormat, ...otherFormats.map((f) => formatInfo[f])] as format, i}
									<td
										class={`px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-ink ${
											i > 0 ? 'border-l border-brand-rule' : ''
										}`}
									>
										{format.fullName === 'PNG' ? 'Yes' : 'No'}
									</td>
								{/each}
							</tr>
						</tbody>
					</table>
				</div>
			</LongformSection>

			<LongformSection index="12" id="use-cases" compact>
				<h2
					slot="heading"
					class="font-display text-2xl font-bold leading-[30px] tracking-[-0.02em] text-brand-ink"
				>
					Real-World Use Cases
				</h2>

				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<div class="flex flex-col gap-1">
						<h3 class="font-sans text-lg font-medium leading-6 text-brand-ink">Social Media</h3>
						<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
							Create eye-catching social media posts directly from HTML templates.
						</p>
					</div>
					<div class="flex flex-col gap-1">
						<h3 class="font-sans text-lg font-medium leading-6 text-brand-ink">Email Campaigns</h3>
						<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
							Generate optimized images for email newsletters that load quickly.
						</p>
					</div>
					<div class="flex flex-col gap-1">
						<h3 class="font-sans text-lg font-medium leading-6 text-brand-ink">Website Mockups</h3>
						<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
							Quickly create and share website designs with clients.
						</p>
					</div>
					<div class="flex flex-col gap-1 hover:bg-brand-paper transition-colors">
						<h3 class="font-sans text-lg font-medium leading-6 text-brand-ink">Documentation</h3>
						<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
							Easily include web page screenshots in technical docs.
						</p>
					</div>
				</div>
			</LongformSection>

			<LongformSection index="13" id="tech-specs" compact>
				<h2
					slot="heading"
					class="font-display text-2xl font-bold leading-[30px] tracking-[-0.02em] text-brand-ink"
				>
					Technical Specs
				</h2>

				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<div class="flex flex-col gap-1">
						<h3 class="font-sans text-lg font-medium leading-6 text-brand-ink">
							Conversion Process
						</h3>
						<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
							Headless browser rendering ensures pixel-perfect conversion.
						</p>
					</div>
					<div class="flex flex-col gap-1">
						<h3 class="font-sans text-lg font-medium leading-6 text-brand-ink">Image Quality</h3>
						<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
							Generated at 96 DPI with optimized compression settings.
						</p>
					</div>
					<div class="flex flex-col gap-1">
						<h3 class="font-sans text-lg font-medium leading-6 text-brand-ink">
							Supported Features
						</h3>
						<ul class="list-disc pl-5 font-sans text-[15px] leading-[23px] text-brand-slate">
							<li>CSS3 and JavaScript rendering</li>
							<li>Custom dimensions up to 4000x4000px</li>
							<li>Web fonts supported</li>
						</ul>
					</div>
					<div class="flex flex-col gap-1">
						<h3 class="font-sans text-lg font-medium leading-6 text-brand-ink">Performance</h3>
						<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
							Average conversion time under 5 seconds.
						</p>
					</div>
				</div>
			</LongformSection>
		</div>

		<!-- Social Share Section -->
		<div class="w-full max-w-5xl mx-auto mb-20 text-center">
			<p class="font-bold text-brand-mute tracking-widest mb-4">Spread the word</p>
			<div class="flex flex-col md:flex-row justify-center md:space-x-6">
				<button
					class="flex items-center justify-center px-8 py-4 bg-brand-ink text-white font-semibold tracking-wide border border-brand-ink hover:bg-brand-paper hover:text-brand-ink transition-all hover: mb-4 md:mb-0"
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
					class="flex items-center justify-center px-8 py-4 bg-[#0A66C2] text-white font-semibold tracking-wide border border-brand-ink hover:bg-brand-paper hover:text-[#0A66C2] transition-all hover:"
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
	</svelte:fragment>

	<svelte:fragment slot="footer-links">
		<div class="mx-auto w-full max-w-page px-5 lg:px-10">
			<RelatedTools tools={['html-email', 'table', 'certificate', 'quote-card']} />
			<!-- Internal Links -->
			<section class="mb-16 w-full max-w-5xl mx-auto px-4">
				<h2 class="text-2xl font-semibold mb-6 text-brand-ink text-center">Related Tools</h2>
				<div class="flex flex-wrap gap-3 justify-center">
					<a
						href="/tools/url-to-image-generator"
						class="px-4 py-2 border border-brand-ink bg-brand-paper font-bold text-sm hover:bg-brand-field hover: transition-all"
						>URL to Image</a
					>
					<a
						href="/tools/code-to-image"
						class="px-4 py-2 border border-brand-ink bg-brand-paper font-bold text-sm hover:bg-brand-field hover: transition-all"
						>Code to Image</a
					>
					<a
						href="/tools/og-image-generator"
						class="px-4 py-2 border border-brand-ink bg-brand-paper font-bold text-sm hover:bg-brand-field hover: transition-all"
						>OG Image Generator</a
					>
					<a
						href="/alternatives"
						class="px-4 py-2 border border-brand-ink bg-brand-paper font-bold text-sm hover:bg-brand-field hover: transition-all"
						>Compare Alternatives</a
					>
				</div>
			</section>
		</div>
	</svelte:fragment>
</ToolPageShell>

<!-- Anchors referenced by the HowTo schema steps. -->
<section id="input" class="sr-only" aria-hidden="true" />
<section id="preview" class="sr-only" aria-hidden="true" />
<section id="generate" class="sr-only" aria-hidden="true" />
