<script>
	/**
	 * /tools/linkedin-banner-generator — the v2 tool page, column mode.
	 *
	 * Category filter, gallery, preview and controls become the tool card; the
	 * quota ladder and Generate move to its toolbar. SEO copy is frozen.
	 */
	import OgImageTemplate from '$lib/components/tools/OgImageTemplate.svelte';
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolCard from '$lib/components/tools/v2/ToolCard.svelte';
	import QuotaMeter from '$lib/components/tools/v2/QuotaMeter.svelte';
	import GenerateButton from '$lib/components/tools/v2/GenerateButton.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import ResultCard from '$lib/components/tools/v2/ResultCard.svelte';
	import AutomateSection from '$lib/components/tools/v2/AutomateSection.svelte';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import { createImagePublic } from '../../../api/image.js';
	import { onMount } from 'svelte';
	import { toast } from '../../../store/toast.store';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { user } from '../../../store/user.store';
	import ApiPromptSection from '$lib/components/tools/ApiPromptSection.svelte';
	import { analytics } from '$lib/telemetry.js';
	import {
		allTemplates,
		getTemplatesByCategory,
		getPopularTemplates
	} from '$lib/templates/linkedin-banner/index.js';
	import {
		linkedinBannerCategories,
		LINKEDIN_BANNER_WIDTH,
		LINKEDIN_BANNER_HEIGHT,
		SAFE_ZONE
	} from '$lib/pseo/linkedin-banner.js';
	import RelatedTools from '$lib/components/tools/RelatedTools.svelte';

	// Social proof counter
	let totalBannersCreated = 23847;

	// User state - using reactive declaration
	$: isUserLoggedIn = !!$user?.email;

	// Debounce utility
	function debounce(fn, delay = 150) {
		let timeoutId;
		return (...args) => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => fn(...args), delay);
		};
	}

	// File upload limits
	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	const MAX_IMAGE_DIMENSION = 4000;

	// Fonts
	const popularFontsLinks = [
		'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap',
		'https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap',
		'https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap',
		'https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap',
		'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap',
		'https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&display=swap',
		'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap'
	];

	const popularFonts = [
		{ id: 'Inter', name: 'Inter', className: 'inter' },
		{ id: 'Roboto', name: 'Roboto', className: 'roboto' },
		{ id: 'Poppins', name: 'Poppins', className: 'poppins' },
		{ id: 'Montserrat', name: 'Montserrat', className: 'montserrat' },
		{ id: 'Open Sans', name: 'Open Sans', className: 'open-sans' },
		{ id: 'Oswald', name: 'Oswald', className: 'oswald' },
		{ id: 'JetBrains Mono', name: 'JetBrains Mono', className: 'jetbrains-mono' }
	];

	const combinedFonts = popularFonts.map((font, index) => ({
		...font,
		link: popularFontsLinks[index]
	}));

	// State
	let selectedCategory = 'all';
	let selectedTemplate = null;
	let selectedFont = combinedFonts[0];
	let imageUrl = '';
	let isImageGenerating = false;

	// Editable content - dynamic variables based on template
	let templateVariables = {}; // { 'template-heading': { label: 'Name', value: 'Your Name' }, ... }
	let logoDataUrl = null;

	// Colors
	let backgroundColorRgb = { r: 15, g: 23, b: 42 };
	let headingColorRgb = { r: 248, g: 250, b: 252 };
	let subHeadingColorRgb = { r: 148, g: 163, b: 184 };

	let bannerTemplateWrapper;
	let generationCount = 0;
	let showUpgradePrompt = false;
	let showSafeZone = true;

	// Category icons
	const categoryIcons = {
		code: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>`,
		palette: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>`,
		megaphone: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
		users: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
		briefcase: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
		building: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
		star: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
	};

	// Filter templates
	$: filteredTemplates =
		selectedCategory === 'all' ? allTemplates : getTemplatesByCategory(selectedCategory);

	// Initialize
	onMount(() => {
		if (allTemplates.length > 0) {
			selectTemplate(getPopularTemplates()[0] || allTemplates[0]);
		}
	});

	// Helper to extract editable text from an element (excluding prefix spans)
	function extractEditableText(element) {
		if (!element) return null;

		// Check if element has a prefix span as first child
		const firstChild = element.firstElementChild;
		const hasMultipleNodes = element.childNodes.length > 1;

		if (firstChild && firstChild.tagName === 'SPAN' && hasMultipleNodes) {
			// Has prefix span - extract only the text after it
			let text = '';
			for (let i = 1; i < element.childNodes.length; i++) {
				text += element.childNodes[i].textContent;
			}
			return text.trim();
		}

		// Return full text content
		return element.textContent?.trim() || null;
	}

	// Generate a human-readable label from an element id
	function generateLabelFromId(id) {
		// Convert 'template-heading' to 'Heading', 'template-sub-heading' to 'Sub Heading'
		return id
			.replace('template-', '')
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Auto-detect variables from template HTML
	function detectTemplateVariables(doc, template) {
		const vars = {};

		// Always auto-detect all elements with id starting with 'template-'
		const elements = doc.querySelectorAll('[id^="template-"]');

		elements.forEach((el) => {
			const id = el.id;
			// Check if template has predefined variable info for this element
			const predefinedVar = template.variables?.find((v) => v.id === id);

			vars[id] = {
				label: predefinedVar?.label || generateLabelFromId(id),
				value: extractEditableText(el) || predefinedVar?.default || '',
				type: predefinedVar?.type || 'text'
			};
		});

		return vars;
	}

	// Select a template
	function selectTemplate(template) {
		selectedTemplate = template;

		// Parse template to extract default content and colors
		const parser = new DOMParser();
		const doc = parser.parseFromString(template.html, 'text/html');

		// Detect and initialize template variables
		const detectedVars = detectTemplateVariables(doc, template);

		// Preserve existing values if switching templates with same variable ids
		Object.keys(detectedVars).forEach((id) => {
			if (templateVariables[id] && templateVariables[id].value) {
				detectedVars[id].value = templateVariables[id].value;
			}
		});
		templateVariables = detectedVars;

		// Extract colors from CSS variables
		const styleTag = doc.querySelector('style');
		if (styleTag) {
			const cssText = styleTag.textContent;
			const rootMatch = cssText.match(/:root\s*{([^}]+)}/);
			if (rootMatch) {
				const cssVars = {};
				const varRegex = /--([^:]+):\s*([^;]+);/g;
				let match;
				while ((match = varRegex.exec(rootMatch[1])) !== null) {
					cssVars[match[1].trim()] = match[2].trim();
				}

				const extractRGB = (colorString) => {
					if (!colorString) return null;
					if (colorString.startsWith('#')) {
						const hex = colorString.replace('#', '');
						return {
							r: parseInt(hex.substring(0, 2), 16),
							g: parseInt(hex.substring(2, 4), 16),
							b: parseInt(hex.substring(4, 6), 16)
						};
					}
					const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
					if (rgbMatch) {
						return {
							r: parseInt(rgbMatch[1]),
							g: parseInt(rgbMatch[2]),
							b: parseInt(rgbMatch[3])
						};
					}
					return null;
				};

				if (cssVars['primary-color'] && !cssVars['primary-color'].includes('gradient')) {
					const rgb = extractRGB(cssVars['primary-color']);
					if (rgb) backgroundColorRgb = rgb;
				}
				if (cssVars['secondary-color']) {
					const rgb = extractRGB(cssVars['secondary-color']);
					if (rgb) headingColorRgb = rgb;
				}
				if (cssVars['tertiary-color'] && !cssVars['tertiary-color'].includes('rgba')) {
					const rgb = extractRGB(cssVars['tertiary-color']);
					if (rgb) subHeadingColorRgb = rgb;
				}
			}
		}

		setTimeout(() => {
			updateHTML();
			bannerTemplateWrapper?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 100);
	}

	// Helper to escape HTML to prevent XSS
	function escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	// Helper to update element text while preserving prefix spans
	function updateElementText(element, newText) {
		if (!element) return;

		// Check if element has a prefix span as first child (like </> code prefix)
		const firstChild = element.firstElementChild;
		const hasMultipleNodes = element.childNodes.length > 1;

		if (firstChild && firstChild.tagName === 'SPAN' && hasMultipleNodes) {
			// Has prefix span - preserve it and update the text after
			const prefix = firstChild.outerHTML;
			element.innerHTML = prefix + ' ' + escapeHtml(newText);
		} else {
			// Simple text or styled spans (will be replaced)
			element.textContent = newText;
		}
	}

	// Update the HTML in the iframe
	async function updateHTML() {
		if (!bannerTemplateWrapper) return;

		const iframe = bannerTemplateWrapper.querySelector('iframe');
		if (!iframe) return;

		// Wait for iframe to be ready
		if (!iframe.contentWindow?.document?.body?.innerHTML) {
			await new Promise((resolve) => {
				iframe.onload = resolve;
				// Fallback so a never-firing onload can't hang the promise.
				setTimeout(resolve, 1500);
			});
		}

		const doc = iframe.contentWindow?.document;
		if (!doc?.body) return;

		// Update all template variables
		Object.entries(templateVariables).forEach(([id, variable]) => {
			const element = doc.querySelector(`#${id}`);
			if (element) {
				updateElementText(element, variable.value);
			}
		});

		// Handle logo if present
		const logoEl = doc.querySelector('#template-logo');

		if (logoEl && logoDataUrl) {
			const img = doc.createElement('img');
			img.src = logoDataUrl;
			img.style.maxWidth = '120px';
			img.style.height = 'auto';
			img.id = 'template-logo';
			logoEl.replaceWith(img);
		}

		// Update colors
		doc.documentElement.style.setProperty(
			'--primary-color',
			`rgb(${backgroundColorRgb.r}, ${backgroundColorRgb.g}, ${backgroundColorRgb.b})`
		);
		doc.documentElement.style.setProperty(
			'--secondary-color',
			`rgb(${headingColorRgb.r}, ${headingColorRgb.g}, ${headingColorRgb.b})`
		);
		doc.documentElement.style.setProperty(
			'--tertiary-color',
			`rgb(${subHeadingColorRgb.r}, ${subHeadingColorRgb.g}, ${subHeadingColorRgb.b})`
		);

		// Update font - reuse existing link element to prevent accumulation
		let fontLink = doc.querySelector('link[data-font-link]');
		if (!fontLink) {
			fontLink = doc.createElement('link');
			fontLink.rel = 'stylesheet';
			fontLink.dataset.fontLink = 'true';
			doc.head.appendChild(fontLink);
		}
		fontLink.href = selectedFont.link;
		doc.documentElement.style.fontFamily = selectedFont.id;
	}

	// Debounced HTML update for text inputs
	const debouncedUpdateHTML = debounce(() => updateHTML(), 150);

	// Handle input changes for any template variable
	function handleVariableChange(variableId, event) {
		if (templateVariables[variableId]) {
			templateVariables[variableId].value = event.target.value;
			templateVariables = templateVariables; // Trigger reactivity
			debouncedUpdateHTML();
		}
	}

	function handleLogoUpload(event) {
		const file = event.target.files[0];
		if (!file) return;

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			toast.set({ message: 'File too large. Maximum size is 5MB.', duration: 3000 });
			return;
		}

		// Validate image dimensions
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(img.src);
			if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
				toast.set({
					message: 'Image dimensions too large. Maximum is 4000x4000 pixels.',
					duration: 3000
				});
				return;
			}
			// Valid image, proceed with loading
			const reader = new FileReader();
			reader.onload = (e) => {
				logoDataUrl = e.target.result;
				updateHTML();
			};
			reader.readAsDataURL(file);
		};
		img.onerror = () => {
			URL.revokeObjectURL(img.src);
			toast.set({ message: 'Invalid image file.', duration: 3000 });
		};
		img.src = URL.createObjectURL(file);
	}

	function updateBackgroundColor(event) {
		backgroundColorRgb = event.detail.rgb;
		updateHTML();
	}

	function updateHeadingColor(event) {
		headingColorRgb = event.detail.rgb;
		updateHTML();
	}

	function updateSubheadingColor(event) {
		subHeadingColorRgb = event.detail.rgb;
		updateHTML();
	}

	function updateFont(font) {
		selectedFont = font;
		updateHTML();
	}

	// Generate image
	async function generateBanner() {
		generationCount++;
		isImageGenerating = true;

		const iframe = bannerTemplateWrapper?.querySelector('iframe');
		const doc = iframe?.contentWindow?.document;
		if (!doc?.documentElement) {
			isImageGenerating = false;
			toast.set({
				message: 'Preview is still loading. Please try again.',
				type: 'error',
				duration: 3000
			});
			return;
		}
		let html = doc.documentElement.outerHTML;

		// No guest watermark: the toolbar promises NO WATERMARK.

		try {
			const { image } = await createImagePublic({
				html,
				width: LINKEDIN_BANNER_WIDTH,
				height: LINKEDIN_BANNER_HEIGHT,
				selector: 'body'
			});
			imageUrl = image.url;
			totalBannersCreated++;

			if (!isUserLoggedIn && generationCount > 2) {
				showUpgradePrompt = true;
			}
		} catch (error) {
			toast.set({ message: 'Failed to generate banner. Please try again.', duration: 3000 });
		} finally {
			isImageGenerating = false;
		}
	}

	function copyToClipboard(text, contentType = 'image_url') {
		navigator.clipboard.writeText(text).then(() => {
			analytics.trackCopy({
				content_type: contentType,
				context: 'tool_result',
				tool_name: 'linkedin_banner_generator'
			});
			toast.set({ message: 'Copied to clipboard!', duration: 1500 });
		});
	}

	function downloadBanner() {
		if (!imageUrl) return;
		analytics.trackDownload({
			content_type: 'image',
			format: 'png',
			tool_name: 'linkedin_banner_generator'
		});
		const link = document.createElement('a');
		link.href = imageUrl;
		link.download = 'linkedin-banner.png';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	let progress = tweened(0, {
		duration: 3000,
		easing: cubicOut
	});

	$: if (isImageGenerating) {
		progress.set(100);
	} else {
		progress.set(0);
	}

	// API example code - uses the generic /image endpoint with HTML
	const apiExampleCode = `curl -X POST https://api.pictify.io/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "html": "<html>...your banner HTML...</html>",
    "width": 1584,
    "height": 396,
    "fileExtension": "png"
  }'`;

	const apiCtaDetails = {
		title: 'Generate LinkedIn banners programmatically',
		description:
			'Use our REST API to create personalized LinkedIn banners at scale for your team, platform, or marketing campaigns.',
		featurePoints: [
			'Generate banners dynamically with user data',
			'Serve optimized images from our global CDN',
			'Perfect for employee onboarding and team pages'
		],
		codeSnippet: apiExampleCode,
		docsUrl: 'https://docs.pictify.io/',
		docsLabel: 'View LinkedIn Banner API docs',
		secondaryCtaLabel: 'See code examples'
	};

	const structuredDataJson = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify LinkedIn Banner Generator',
		url: 'https://pictify.io/tools/linkedin-banner-generator',
		description:
			'Create professional LinkedIn banners in seconds: 20+ templates at the correct 1584×396 dimensions, free with API access.',
		applicationCategory: ['DesignApplication', 'BusinessApplication'],
		operatingSystem: 'Web',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		creator: { '@type': 'Organization', name: 'Pictify.io', url: 'https://pictify.io' }
	});

	const breadcrumbSchemaJson = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pictify.io/' },
			{ '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://pictify.io/tools' },
			{ '@type': 'ListItem', position: 3, name: 'LinkedIn Banner Generator' }
		]
	});

	const TOOL_NAME = 'linkedin_banner_generator';
	const TOOL_PATH = '/tools/linkedin-banner-generator';

	$: guestRemaining = Math.max(0, GUEST_DAILY_LIMIT - ($generationLimits?.count || 0));
	$: lastFreeRender = !isUserLoggedIn && guestRemaining <= 1;

	const linkedinBannerExamples = [
		{
			id: 'javascript',
			label: 'JavaScript',
			fileName: 'banner.js',
			code: `<span class="text-[#6a9955]">// Render a 1584x396 LinkedIn banner from HTML</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">response</span> = <span class="text-[#c586c0]">await</span> <span class="text-[#dcdcaa]">fetch</span>(<span class="text-[#ce9178]">'https://api.pictify.io/image'</span>, {
  <span class="text-[#9cdcfe]">method</span>: <span class="text-[#ce9178]">'POST'</span>,
  <span class="text-[#9cdcfe]">headers</span>: { <span class="text-[#ce9178]">'Content-Type'</span>: <span class="text-[#ce9178]">'application/json'</span>, <span class="text-[#ce9178]">'Authorization'</span>: <span class="text-[#ce9178]">'Bearer YOUR_API_KEY'</span> },
  <span class="text-[#9cdcfe]">body</span>: <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">stringify</span>({ <span class="text-[#9cdcfe]">html</span>: <span class="text-[#9cdcfe]">bannerHtml</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">1584</span>, <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">396</span> })
});

<span class="text-[#c586c0]">const</span> { <span class="text-[#9cdcfe]">image</span> } = <span class="text-[#c586c0]">await</span> <span class="text-[#9cdcfe]">response</span>.<span class="text-[#dcdcaa]">json</span>();
<span class="text-[#9cdcfe]">console</span>.<span class="text-[#dcdcaa]">log</span>(<span class="text-[#9cdcfe]">image</span>.<span class="text-[#9cdcfe]">url</span>); <span class="text-[#6a9955]">// personalize per teammate at scale</span>`
		},
		{
			id: 'python',
			label: 'Python',
			fileName: 'banner.py',
			code: `<span class="text-[#c586c0]">import</span> <span class="text-[#9cdcfe]">requests</span>

<span class="text-[#9cdcfe]">resp</span> = <span class="text-[#9cdcfe]">requests</span>.<span class="text-[#dcdcaa]">post</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>,
    <span class="text-[#9cdcfe]">headers</span>={<span class="text-[#ce9178]">"Authorization"</span>: <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>},
    <span class="text-[#9cdcfe]">json</span>={<span class="text-[#ce9178]">"html"</span>: <span class="text-[#9cdcfe]">banner_html</span>, <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">1584</span>, <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">396</span>})

<span class="text-[#dcdcaa]">print</span>(<span class="text-[#9cdcfe]">resp</span>.<span class="text-[#dcdcaa]">json</span>()[<span class="text-[#ce9178]">"url"</span>])`
		},
		{
			id: 'curl',
			label: 'cURL',
			fileName: 'banner.sh',
			code: `<span class="text-[#dcdcaa]">curl</span> -X POST <span class="text-[#ce9178]">https://api.pictify.io/image</span> \\
  -H <span class="text-[#ce9178]">"Content-Type: application/json"</span> \\
  -H <span class="text-[#ce9178]">"Authorization: Bearer YOUR_API_KEY"</span> \\
  -d <span class="text-[#ce9178]">'{"html":"&lt;div&gt;...&lt;/div&gt;","width":1584,"height":396}'</span>`
		}
	];

	const RELATED = [
		{
			title: 'OG image generator',
			meta: 'TITLE · LOGO → 1200×630',
			href: '/tools/og-image-generator',
			art: '/landing/tools/og-image-generator.svg'
		},
		{
			title: 'Tweet screenshot',
			meta: 'TWEET URL → PNG',
			href: '/tools/tweet-screenshot',
			art: '/landing/tools/tweet-screenshot.svg'
		},
		{
			title: 'Portfolio card',
			meta: 'PROFILE → PNG',
			href: '/tools/portfolio-card',
			art: '/landing/tools/portfolio-card.svg'
		}
	];
</script>

<svelte:head>
	<title>Free LinkedIn Banner Generator | Create Professional Profile Banners | Pictify</title>
	<meta
		name="description"
		content="Create stunning LinkedIn banners in seconds. Choose from 20+ professional templates designed for developers, designers, marketers, and more. Perfect 1584x396 dimensions guaranteed."
	/>
	<meta
		name="keywords"
		content="linkedin banner generator, linkedin cover photo, linkedin background, profile banner, linkedin header, linkedin banner maker"
	/>

	<meta property="og:title" content="Free LinkedIn Banner Generator | Pictify" />
	<meta
		property="og:description"
		content="Create professional LinkedIn banners in seconds. 20+ templates for developers, designers, marketers, and more."
	/>
	<meta property="og:url" content="https://pictify.io/tools/linkedin-banner-generator" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Pictify" />
	<meta property="og:image" content="https://pictify.io/og/tools/linkedin-banner-generator.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Pictify LinkedIn banner generator: free, 1584×396" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Free LinkedIn Banner Generator | Pictify" />
	<meta
		name="twitter:description"
		content="Create professional LinkedIn banners in seconds. 20+ templates. Free, no watermark."
	/>
	<meta name="twitter:image" content="https://pictify.io/og/tools/linkedin-banner-generator.png" />

	<link rel="canonical" href="https://pictify.io/tools/linkedin-banner-generator" />
	{@html `<script type="application/ld+json">${structuredDataJson}</script>`}
	{@html `<script type="application/ld+json">${breadcrumbSchemaJson}</script>`}
</svelte:head>

<ToolPageShell
	toolName={TOOL_NAME}
	toolPath={TOOL_PATH}
	breadcrumb="LINKEDIN BANNER"
	facts="FREE · 5 RENDERS A DAY · NO SIGNUP · 1584×396"
	related={RELATED}
	loggedIn={isUserLoggedIn}
	hasResult={!!imageUrl}
	longform="column"
>
	<h1
		slot="h1"
		class="font-display text-[38px] font-extrabold leading-[1.04] tracking-[-0.02em] text-brand-ink lg:text-[52px] lg:leading-[56px]"
	>
		<span>LINKEDIN BANNER</span>
		<span>GENERATOR</span>
	</h1>

	<p
		slot="hero-sub"
		class="max-w-[640px] font-sans text-base leading-[25px] text-[#2A2C1E] lg:text-lg lg:leading-[27px]"
	>
		Choose from <span class="font-medium">{allTemplates.length}+ templates</span> designed for
		developers, marketers, designers, and professionals.
		<span class="text-brand-slate">Perfect 1584×396 dimensions guaranteed</span>
	</p>

	<div slot="tool">
		<ToolCard>
			<div class="flex flex-col gap-6 p-5 lg:p-7">
				<div class="mb-12">
					<div class="flex flex-wrap justify-center gap-3">
						<button
							on:click={() => (selectedCategory = 'all')}
							class="px-5 py-3 border border-brand-ink text-sm font-semibold tracking-wider transition-all {selectedCategory ===
							'all'
								? 'bg-brand-ink text-white -translate-x-1 -translate-y-1'
								: 'bg-brand-paper text-brand-ink hover:bg-brand-subtle hover:'}"
						>
							All Templates
						</button>
						{#each linkedinBannerCategories as category}
							<button
								on:click={() => (selectedCategory = category.id)}
								class="px-5 py-3 border border-brand-ink text-sm font-semibold tracking-wider transition-all flex items-center gap-2 {selectedCategory ===
								category.id
									? 'bg-brand-ink text-white -translate-x-1 -translate-y-1'
									: 'bg-brand-paper text-brand-ink hover:bg-brand-subtle hover:'}"
							>
								{@html categoryIcons[category.icon]}
								{category.label}
							</button>
						{/each}
					</div>
				</div>
				<div class="mb-16">
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each filteredTemplates as template}
							<button
								on:click={() => selectTemplate(template)}
								class="group relative bg-brand-paper border border-brand-ink p-1 transition-all duration-200 overflow-hidden {selectedTemplate?.id ===
								template.id
									? 'ring-4 ring-brand-accent ring-offset-2'
									: ''}"
							>
								{#if template.popular}
									<div
										class="absolute top-3 left-3 z-10 bg-brand-field text-brand-ink text-xs font-semibold tracking-wider px-3 py-1 border border-brand-ink"
									>
										Popular
									</div>
								{/if}
								<div
									class="aspect-[4/1] bg-brand-subtle border-b border-brand-ink relative overflow-hidden"
								>
									<OgImageTemplate
										html={template.html}
										width={LINKEDIN_BANNER_WIDTH}
										height={LINKEDIN_BANNER_HEIGHT}
										scale={0.25}
									/>
									<!-- Safe Zone Overlay on Cards (rectangular, bottom-left) -->
									{#if showSafeZone}
										<div
											class="absolute pointer-events-none z-10"
											style="
				                    left: calc({SAFE_ZONE.left}px * 0.25);
				                    top: calc({SAFE_ZONE.top}px * 0.25);
				                    width: calc({SAFE_ZONE.width}px * 0.25);
				                    height: calc({SAFE_ZONE.height}px * 0.25);
				                    border: 2px dashed #ff6b6b;
				                    background: rgba(255, 107, 107, 0.15);
				                    border-radius: 4px;
				                  "
										/>
									{/if}
								</div>
								<div class="p-4 bg-brand-paper">
									<p
										class="text-base font-semibold text-brand-ink tracking-wide group-hover:text-brand-pink transition-colors"
									>
										{template.name}
									</p>
									<p class="text-xs font-bold text-brand-mute tracking-wider mt-1">
										{template.category.replace('-', ' ')}
									</p>
								</div>
							</button>
						{/each}
					</div>
				</div>

				{#if selectedTemplate}
					<div
						bind:this={bannerTemplateWrapper}
						class="relative bg-[#f0f0f0] flex items-center justify-center p-6 border-b-[4px] border-black"
						style="background-image: repeating-linear-gradient(45deg, #e5e5e5 25%, transparent 25%, transparent 75%, #e5e5e5 75%, #e5e5e5), repeating-linear-gradient(45deg, #e5e5e5 25%, #f0f0f0 25%, #f0f0f0 75%, #e5e5e5 75%, #e5e5e5); background-position: 0 0, 10px 10px; background-size: 20px 20px;"
					>
						<div class="relative inline-block border border-brand-ink overflow-hidden">
							<OgImageTemplate
								html={selectedTemplate.html}
								width={LINKEDIN_BANNER_WIDTH}
								height={LINKEDIN_BANNER_HEIGHT}
								scale={0.65}
							/>

							<!-- Safe Zone Overlay - Rectangle at bottom-left -->
							{#if showSafeZone}
								<div
									class="absolute pointer-events-none z-10"
									style="
					                      left: calc({SAFE_ZONE.left}px * 0.65);
					                      top: calc({SAFE_ZONE.top}px * 0.65);
					                      width: calc({SAFE_ZONE.width}px * 0.65);
					                      height: calc({SAFE_ZONE.height}px * 0.65);
					                      border: 3px dashed #ff6b6b;
					                      background: rgba(255, 107, 107, 0.15);
					                      border-radius: 8px;
					                    "
								>
									<div
										class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-brand-pink text-white text-[10px] font-semibold tracking-wider border border-brand-ink whitespace-nowrap"
									>
										Safe Zone (568×264px)
									</div>
								</div>
							{/if}
						</div>
					</div>
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
						<!-- Dynamic Text Inputs based on Template Variables -->
						<div class="space-y-6">
							{#each Object.entries(templateVariables) as [variableId, variable]}
								<div>
									<label class="block text-sm font-semibold text-brand-ink tracking-wider mb-3"
										>{variable.label}</label
									>
									<input
										type="text"
										value={variable.value}
										on:input={(e) => handleVariableChange(variableId, e)}
										class="w-full px-4 py-4 border border-brand-ink font-bold focus:outline-none transition-all bg-brand-paper"
										placeholder={variable.label}
									/>
								</div>
							{/each}
							<div>
								<label class="block text-sm font-semibold text-brand-ink tracking-wider mb-3"
									>Logo (Optional)</label
								>
								<input
									type="file"
									accept="image/*"
									on:change={handleLogoUpload}
									class="w-full px-4 py-4 border border-brand-ink font-bold focus:outline-none transition-all bg-brand-paper file:mr-4 file:py-2 file:px-4 file:border-[2px] file:border-gray-900 file:bg-brand-field file:text-brand-ink file:font-semibold file: file:text-xs file:tracking-wider file:cursor-pointer"
								/>
							</div>
						</div>

						<!-- Style Controls -->
						<div class="space-y-6">
							<div>
								<label class="block text-sm font-semibold text-brand-ink tracking-wider mb-3"
									>Font Family</label
								>
								<div class="flex flex-wrap gap-2">
									{#each combinedFonts as font}
										<button
											on:click={() => updateFont(font)}
											class="px-4 py-2 border border-brand-ink text-sm font-bold transition-all {selectedFont.id ===
											font.id
												? 'bg-brand-ink text-white'
												: 'bg-brand-paper text-brand-ink hover:'}"
											style="font-family: {font.id}"
										>
											{font.name}
										</button>
									{/each}
								</div>
							</div>

							<div class="grid grid-cols-3 gap-4">
								<div>
									<label class="block text-sm font-semibold text-brand-ink tracking-wider mb-3"
										>Background</label
									>
									<div class="color-picker-wrapper">
										<ColorPicker
											bind:rgb={backgroundColorRgb}
											on:input={updateBackgroundColor}
											isPopup={true}
										/>
									</div>
								</div>
								<div>
									<label class="block text-sm font-semibold text-brand-ink tracking-wider mb-3"
										>Heading</label
									>
									<div class="color-picker-wrapper">
										<ColorPicker
											bind:rgb={headingColorRgb}
											on:input={updateHeadingColor}
											isPopup={true}
										/>
									</div>
								</div>
								<div>
									<label class="block text-sm font-semibold text-brand-ink tracking-wider mb-3"
										>Subheading</label
									>
									<div class="color-picker-wrapper">
										<ColorPicker
											bind:rgb={subHeadingColorRgb}
											on:input={updateSubheadingColor}
											isPopup={true}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
					{#if isImageGenerating}
						<div class="mt-6 w-full max-w-md mx-auto">
							<div class="h-3 bg-brand-paper border border-brand-ink">
								<div class="h-full bg-brand-proof transition-all" style="width: {$progress}%" />
							</div>
						</div>
					{/if}
				{/if}
			</div>

			<svelte:fragment slot="toolbar-left">
				<span class="font-mono text-xs tracking-[0.06em] text-brand-mute">TEMPLATE → 1584×396</span>
			</svelte:fragment>

			<svelte:fragment slot="toolbar-right">
				<QuotaMeter
					remaining={guestRemaining}
					loggedIn={isUserLoggedIn}
					toolName={TOOL_NAME}
					toolPath={TOOL_PATH}
				/>
				<GenerateButton
					label="Generate Banner"
					loading={isImageGenerating}
					ready={!!selectedTemplate}
					remaining={guestRemaining}
					loggedIn={isUserLoggedIn}
					toolName={TOOL_NAME}
					toolPath={TOOL_PATH}
					on:generate={generateBanner}
				/>
			</svelte:fragment>
		</ToolCard>
	</div>

	<div slot="result">
		{#if imageUrl}
			<ResultCard
				{imageUrl}
				formatLabel="PNG"
				fileExtension="png"
				width={LINKEDIN_BANNER_WIDTH}
				height={LINKEDIN_BANNER_HEIGHT}
				loggedIn={isUserLoggedIn}
				lastFree={lastFreeRender}
				toolName={TOOL_NAME}
				toolPath={TOOL_PATH}
			/>
		{/if}
	</div>

	<AutomateSection
		slot="automate"
		title="Automate with the"
		titleHighlight="API"
		toolName={TOOL_NAME}
		description="Generate LinkedIn banners programmatically. Render a 1584×396 cover from HTML with one POST — personalize per teammate or per campaign at scale."
		codeExamples={linkedinBannerExamples}
	/>

	<svelte:fragment slot="longform">
		<LongformSection index="01" id="how-to" first>
			<h2
				slot="heading"
				class="font-display text-[28px] font-bold leading-9 tracking-[-0.02em] text-brand-ink"
			>
				How to Add Your Banner to LinkedIn
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div class="text-center">
					<div
						class="w-16 h-16 bg-brand-field border border-brand-ink flex items-center justify-center mx-auto mb-4 text-2xl font-semibold"
					>
						01
					</div>
					<h3 class="font-semibold text-brand-ink tracking-wide mb-2">Create Your Banner</h3>
					<p class="text-brand-slate font-bold text-sm">
						Choose a template, customize it with your details, and download
					</p>
				</div>
				<div class="text-center">
					<div
						class="w-16 h-16 bg-brand-pink text-white border border-brand-ink flex items-center justify-center mx-auto mb-4 text-2xl font-semibold"
					>
						02
					</div>
					<h3 class="font-semibold text-brand-ink tracking-wide mb-2">Go to LinkedIn</h3>
					<p class="text-brand-slate font-bold text-sm">
						Open your LinkedIn profile and click the camera icon on your cover photo
					</p>
				</div>
				<div class="text-center">
					<div
						class="w-16 h-16 bg-brand-proof border border-brand-ink flex items-center justify-center mx-auto mb-4 text-2xl font-semibold"
					>
						03
					</div>
					<h3 class="font-semibold text-brand-ink tracking-wide mb-2">Upload & Save</h3>
					<p class="text-brand-slate font-bold text-sm">
						Upload your banner and adjust the positioning if needed
					</p>
				</div>
			</div>
		</LongformSection>

		<LongformSection index="02" id="size-guide">
			<h2
				slot="heading"
				class="font-display text-[28px] font-bold leading-9 tracking-[-0.02em] text-brand-ink"
			>
				LinkedIn Banner Size Guide
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div>
					<h3 class="font-semibold text-brand-ink tracking-wide mb-4 flex items-center gap-2">
						<span
							class="w-8 h-8 bg-brand-ink text-white flex items-center justify-center text-sm font-bold"
							>✓</span
						>
						Recommended Dimensions
					</h3>
					<ul class="space-y-3">
						<li class="flex items-center gap-3 p-3 bg-brand-subtle border border-brand-ink">
							<span class="text-brand-proof font-semibold">✓</span>
							<span class="font-bold"
								>Personal Profile: <strong class="text-brand-pink">1584 x 396 pixels</strong></span
							>
						</li>
						<li class="flex items-center gap-3 p-3 bg-brand-subtle border border-brand-ink">
							<span class="text-brand-proof font-semibold">✓</span>
							<span class="font-bold"
								>Company Page: <strong class="text-brand-pink">1128 x 191 pixels</strong></span
							>
						</li>
						<li class="flex items-center gap-3 p-3 bg-brand-subtle border border-brand-ink">
							<span class="text-brand-proof font-semibold">✓</span>
							<span class="font-bold"
								>Aspect Ratio: <strong class="text-brand-pink">4:1</strong></span
							>
						</li>
					</ul>
				</div>
				<div>
					<h3 class="font-semibold text-brand-ink tracking-wide mb-4 flex items-center gap-2">
						<span
							class="w-8 h-8 bg-brand-field border border-brand-ink flex items-center justify-center text-sm font-bold"
							>!</span
						>
						Important Notes
					</h3>
					<ul class="space-y-3">
						<li class="flex items-start gap-3 p-3 bg-brand-subtle border border-brand-ink">
							<span class="text-brand-accent font-semibold mt-0.5">⚠</span>
							<span class="font-medium"
								>Mobile App Profile Photo covers large left area (~600px)</span
							>
						</li>
						<li class="flex items-start gap-3 p-3 bg-brand-subtle border border-brand-ink">
							<span class="text-blue-500 font-semibold mt-0.5">ℹ</span>
							<span class="font-medium"
								>All templates now keep important text on the right side</span
							>
						</li>
					</ul>
				</div>
			</div>
		</LongformSection>

		<!-- API Section -->
		<ApiPromptSection
			title={apiCtaDetails.title}
			description={apiCtaDetails.description}
			featurePoints={apiCtaDetails.featurePoints}
			codeSnippet={apiCtaDetails.codeSnippet}
			docsUrl={apiCtaDetails.docsUrl}
			docsLabel={apiCtaDetails.docsLabel}
			secondaryCtaLabel={apiCtaDetails.secondaryCtaLabel}
		/>
	</svelte:fragment>

	<svelte:fragment slot="footer-links">
		<div class="mx-auto w-full max-w-page px-5 lg:px-10">
			<RelatedTools tools={['twitter-header', 'youtube-thumbnail', 'responsive-image-generator']} />
		</div>
	</svelte:fragment>
</ToolPageShell>
