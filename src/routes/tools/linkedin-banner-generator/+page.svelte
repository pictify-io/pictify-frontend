<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import OgImageTemplate from '$lib/components/tools/OgImageTemplate.svelte';
	import { createImagePublic } from '../../../api/image.js';
	import { onMount } from 'svelte';
	import { toast } from '../../../store/toast.store';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { user } from '../../../store/user.store';
	import ApiPromptSection from '$lib/components/tools/ApiPromptSection.svelte';
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
			});
		}

		const doc = iframe.contentWindow.document;

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

		const iframe = bannerTemplateWrapper.querySelector('iframe');
		const doc = iframe.contentWindow.document;
		let html = doc.documentElement.outerHTML;

		// Add watermark for non-logged in users after 2 generations
		if (!isUserLoggedIn && generationCount > 2) {
			const watermarkDiv = `
        <div style="position: fixed; bottom: 16px; right: 16px; background: rgba(0,0,0,0.85);
                    padding: 10px 18px; border-radius: 6px; font-size: 16px; z-index: 9999;
                    font-family: system-ui, -apple-system, sans-serif; font-weight: 700;
                    color: #ffffff; display: flex; align-items: center; gap: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.1);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>Made with <span style="color: #ff6b6b; font-weight: 800;">pictify.io</span></span>
        </div>
      `;
			html = html.replace('</body>', `${watermarkDiv}</body>`);
		}

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

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'Copied to clipboard!', duration: 1500 });
		});
	}

	function downloadBanner() {
		if (!imageUrl) return;
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
	<meta property="og:type" content="website" />

	<link rel="canonical" href="https://pictify.io/tools/linkedin-banner-generator" />
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

	<main class="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-24 relative z-10">
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
				<li class="text-gray-900">LinkedIn Banner</li>
			</ol>
		</nav>

		<!-- Hero Section -->
		<div class="relative flex flex-col items-center justify-center text-center mb-16">
			<!-- Badge -->
			<div
				class="inline-flex transform -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-default mb-8"
			>
				<div
					class="px-6 py-2 bg-[#4ade80] border-[4px] border-black text-black font-black text-sm uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					Free • No Signup Required
				</div>
			</div>

			<!-- Main Title -->
			<h1
				class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter mb-8 leading-none"
			>
				<span class="block">LINKEDIN BANNER</span>
				<span class="relative inline-block text-white mt-2">
					<span class="relative z-10 px-4">GENERATOR</span>
					<span
						class="absolute inset-0 bg-[#ff6b6b] transform -skew-x-3 border-[4px] border-black shadow-[6px_6px_0_0_#000] -z-0"
					/>
				</span>
			</h1>

			<!-- Description -->
			<div class="max-w-2xl mx-auto">
				<p
					class="text-lg md:text-xl text-gray-800 font-bold leading-relaxed border-[3px] border-black bg-white p-6 shadow-[8px_8px_0_0_#e5e7eb]"
				>
					Choose from <span class="bg-[#ffc480] px-1 border-b-[3px] border-black"
						>{allTemplates.length}+ templates</span
					>
					designed for developers, marketers, designers, and professionals.
					<span class="text-gray-500 text-base mt-3 block font-semibold"
						>Perfect 1584×396 dimensions guaranteed</span
					>
				</p>
			</div>

			<!-- Stats -->
			<div class="flex items-center justify-center gap-4 mt-8">
				<div
					class="px-4 py-2 bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] font-black text-sm"
				>
					<span class="text-[#ff6b6b]">{totalBannersCreated.toLocaleString()}</span> banners created
				</div>
				<div
					class="px-4 py-2 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] font-black text-sm flex items-center gap-1"
				>
					<span class="text-yellow-700">★★★★★</span>
					<span>4.9/5</span>
				</div>
			</div>
		</div>

		<!-- Category Filter -->
		<div class="mb-12">
			<div class="flex flex-wrap justify-center gap-3">
				<button
					on:click={() => (selectedCategory = 'all')}
					class="px-5 py-3 border-[3px] border-gray-900 text-sm font-black uppercase tracking-wider transition-all {selectedCategory ===
					'all'
						? 'bg-gray-900 text-white shadow-[4px_4px_0_0_#ffc480] -translate-x-1 -translate-y-1'
						: 'bg-white text-gray-900 hover:bg-gray-50 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]'}"
				>
					All Templates
				</button>
				{#each linkedinBannerCategories as category}
					<button
						on:click={() => (selectedCategory = category.id)}
						class="px-5 py-3 border-[3px] border-gray-900 text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 {selectedCategory ===
						category.id
							? 'bg-gray-900 text-white shadow-[4px_4px_0_0_#ffc480] -translate-x-1 -translate-y-1'
							: 'bg-white text-gray-900 hover:bg-gray-50 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]'}"
					>
						{@html categoryIcons[category.icon]}
						{category.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Template Gallery -->
		<div class="mb-16">
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each filteredTemplates as template}
					<button
						on:click={() => selectTemplate(template)}
						class="group relative bg-white border-[3px] border-gray-900 p-1 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 overflow-hidden {selectedTemplate?.id ===
						template.id
							? 'ring-4 ring-[#ffc480] ring-offset-2'
							: ''}"
					>
						{#if template.popular}
							<div
								class="absolute top-3 left-3 z-10 bg-[#ffc480] text-black text-xs font-black uppercase tracking-wider px-3 py-1 border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937]"
							>
								Popular
							</div>
						{/if}
						<div
							class="aspect-[4/1] bg-gray-100 border-b-[3px] border-gray-900 relative overflow-hidden"
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
						<div class="p-4 bg-white">
							<p
								class="text-base font-black text-gray-900 uppercase tracking-wide group-hover:text-[#ff6b6b] transition-colors"
							>
								{template.name}
							</p>
							<p class="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
								{template.category.replace('-', ' ')}
							</p>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Editor Section -->
		{#if selectedTemplate}
			<div class="mb-16" bind:this={bannerTemplateWrapper}>
				<div class="relative">
					<!-- Shadow layer -->
					<div
						class="absolute inset-0 bg-black translate-x-3 translate-y-3 border-[4px] border-black hidden md:block"
					/>

					<div class="relative border-[4px] border-black bg-white">
						<!-- Window Header -->
						<div
							class="bg-black text-white px-4 py-3 flex justify-between items-center border-b-[4px] border-black"
						>
							<div class="flex items-center gap-3">
								<div class="flex gap-2">
									<div class="w-4 h-4 bg-[#ff6b6b] border-2 border-gray-700" />
									<div class="w-4 h-4 bg-[#ffc480] border-2 border-gray-700" />
									<div class="w-4 h-4 bg-[#4ade80] border-2 border-gray-700" />
								</div>
								<span class="font-mono font-bold tracking-wider text-sm uppercase"
									>PREVIEW: {LINKEDIN_BANNER_WIDTH} × {LINKEDIN_BANNER_HEIGHT}px</span
								>
							</div>
							<label
								class="flex items-center gap-2 text-sm font-bold cursor-pointer hover:text-[#ffc480] transition-colors"
							>
								<input
									type="checkbox"
									bind:checked={showSafeZone}
									class="w-4 h-4 accent-[#ffc480]"
								/>
								Show Safe Zone
							</label>
						</div>

						<!-- Banner Preview -->
						<div
							class="relative bg-[#f0f0f0] flex items-center justify-center p-6 border-b-[4px] border-black"
							style="background-image: repeating-linear-gradient(45deg, #e5e5e5 25%, transparent 25%, transparent 75%, #e5e5e5 75%, #e5e5e5), repeating-linear-gradient(45deg, #e5e5e5 25%, #f0f0f0 25%, #f0f0f0 75%, #e5e5e5 75%, #e5e5e5); background-position: 0 0, 10px 10px; background-size: 20px 20px;"
						>
							<div
								class="relative inline-block border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] overflow-hidden"
							>
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
											class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-[#ff6b6b] text-white text-[10px] font-black uppercase tracking-wider border-[2px] border-black whitespace-nowrap"
										>
											Safe Zone (568×264px)
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- Controls -->
						<div class="p-6 md:p-8 bg-[#FFFDF8]">
							<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
								<!-- Dynamic Text Inputs based on Template Variables -->
								<div class="space-y-6">
									{#each Object.entries(templateVariables) as [variableId, variable]}
										<div>
											<label
												class="block text-sm font-black text-gray-900 uppercase tracking-wider mb-3"
												>{variable.label}</label
											>
											<input
												type="text"
												value={variable.value}
												on:input={(e) => handleVariableChange(variableId, e)}
												class="w-full px-4 py-4 border-[3px] border-gray-900 font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all bg-white"
												placeholder={variable.label}
											/>
										</div>
									{/each}
									<div>
										<label
											class="block text-sm font-black text-gray-900 uppercase tracking-wider mb-3"
											>Logo (Optional)</label
										>
										<input
											type="file"
											accept="image/*"
											on:change={handleLogoUpload}
											class="w-full px-4 py-4 border-[3px] border-gray-900 font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all bg-white file:mr-4 file:py-2 file:px-4 file:border-[2px] file:border-gray-900 file:bg-[#ffc480] file:text-black file:font-black file:uppercase file:text-xs file:tracking-wider file:cursor-pointer"
										/>
									</div>
								</div>

								<!-- Style Controls -->
								<div class="space-y-6">
									<div>
										<label
											class="block text-sm font-black text-gray-900 uppercase tracking-wider mb-3"
											>Font Family</label
										>
										<div class="flex flex-wrap gap-2">
											{#each combinedFonts as font}
												<button
													on:click={() => updateFont(font)}
													class="px-4 py-2 border-[3px] border-gray-900 text-sm font-bold transition-all {selectedFont.id ===
													font.id
														? 'bg-gray-900 text-white shadow-[3px_3px_0_0_#ffc480]'
														: 'bg-white text-gray-900 shadow-[3px_3px_0_0_#e5e7eb] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]'}"
													style="font-family: {font.id}"
												>
													{font.name}
												</button>
											{/each}
										</div>
									</div>

									<div class="grid grid-cols-3 gap-4">
										<div>
											<label
												class="block text-sm font-black text-gray-900 uppercase tracking-wider mb-3"
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
											<label
												class="block text-sm font-black text-gray-900 uppercase tracking-wider mb-3"
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
											<label
												class="block text-sm font-black text-gray-900 uppercase tracking-wider mb-3"
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

							<!-- Generate Button -->
							<div class="mt-8 flex flex-col items-center">
								<button
									on:click={generateBanner}
									disabled={isImageGenerating}
									class="px-12 py-5 bg-[#ff6b6b] text-white border-[4px] border-black font-black text-xl uppercase tracking-wider shadow-[8px_8px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
								>
									{#if isImageGenerating}
										<svg class="animate-spin h-6 w-6" viewBox="0 0 24 24">
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
												fill="none"
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
												stroke-width="3"
												d="M13 10V3L4 14h7v7l9-11h-7z"
											/>
										</svg>
										Generate Banner
									{/if}
								</button>
							</div>

							<!-- Progress Bar -->
							{#if isImageGenerating}
								<div class="mt-6 w-full max-w-md mx-auto">
									<div class="h-3 bg-white border-[3px] border-gray-900">
										<div class="h-full bg-[#4ade80] transition-all" style="width: {$progress}%" />
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Result Section -->
		{#if imageUrl}
			<div class="mb-16">
				<div class="relative">
					<div
						class="absolute inset-0 bg-[#4ade80] translate-x-3 translate-y-3 border-[4px] border-black hidden md:block"
					/>

					<div class="relative border-[4px] border-black bg-white">
						<!-- Header -->
						<div
							class="bg-[#4ade80] text-black px-6 py-4 flex items-center gap-3 border-b-[4px] border-black"
						>
							<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<h3 class="text-2xl font-black uppercase tracking-tight">Your Banner is Ready!</h3>
						</div>

						<div class="p-6 md:p-8">
							<!-- Banner Preview -->
							<div
								class="aspect-[4/1] border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] overflow-hidden mb-6"
							>
								<img
									src={imageUrl}
									alt="Generated LinkedIn Banner"
									class="w-full h-full object-cover"
								/>
							</div>

							<!-- Watermark Notice -->
							{#if !isUserLoggedIn && generationCount > 2}
								<div
									class="bg-[#ffc480] border-[3px] border-gray-900 p-5 mb-6 shadow-[4px_4px_0_0_#1f2937]"
								>
									<p class="font-black text-gray-900 uppercase tracking-wide">
										Free downloads include a small Pictify watermark
									</p>
									<p class="text-sm font-bold text-gray-700 mt-1">
										Sign up free to download without watermark
									</p>
									<a
										href="/signup"
										class="inline-block mt-3 px-6 py-3 bg-gray-900 text-white font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ff6b6b] hover:shadow-[2px_2px_0_0_#ff6b6b] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
									>
										Remove Watermark Free
									</a>
								</div>
							{/if}

							<!-- Action Buttons -->
							<div class="flex flex-wrap gap-4">
								<button
									on:click={downloadBanner}
									class="flex-1 sm:flex-none px-8 py-4 bg-[#4ade80] text-black border-[3px] border-gray-900 font-black uppercase tracking-wider shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										/>
									</svg>
									Download PNG
								</button>
								<button
									on:click={() => copyToClipboard(imageUrl)}
									class="flex-1 sm:flex-none px-8 py-4 bg-white text-gray-900 border-[3px] border-gray-900 font-black uppercase tracking-wider shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
										/>
									</svg>
									Copy URL
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- How to Use Section -->
		<div class="mb-16 bg-white border-[4px] border-gray-900 shadow-[8px_8px_0_0_#1f2937]">
			<div class="bg-gray-900 text-white px-6 py-4 border-b-[4px] border-gray-900">
				<h2 class="text-2xl font-black uppercase tracking-tight">
					How to Add Your Banner to LinkedIn
				</h2>
			</div>

			<div class="p-8">
				<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div class="text-center">
						<div
							class="w-16 h-16 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center mx-auto mb-4 text-2xl font-black"
						>
							01
						</div>
						<h3 class="font-black text-gray-900 uppercase tracking-wide mb-2">
							Create Your Banner
						</h3>
						<p class="text-gray-600 font-bold text-sm">
							Choose a template, customize it with your details, and download
						</p>
					</div>
					<div class="text-center">
						<div
							class="w-16 h-16 bg-[#ff6b6b] text-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center mx-auto mb-4 text-2xl font-black"
						>
							02
						</div>
						<h3 class="font-black text-gray-900 uppercase tracking-wide mb-2">Go to LinkedIn</h3>
						<p class="text-gray-600 font-bold text-sm">
							Open your LinkedIn profile and click the camera icon on your cover photo
						</p>
					</div>
					<div class="text-center">
						<div
							class="w-16 h-16 bg-[#4ade80] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center mx-auto mb-4 text-2xl font-black"
						>
							03
						</div>
						<h3 class="font-black text-gray-900 uppercase tracking-wide mb-2">Upload & Save</h3>
						<p class="text-gray-600 font-bold text-sm">
							Upload your banner and adjust the positioning if needed
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Dimensions Info -->
		<div class="mb-16">
			<div class="relative">
				<div
					class="absolute inset-0 bg-[#ffc480] translate-x-3 translate-y-3 border-[4px] border-black hidden md:block"
				/>

				<div class="relative bg-white border-[4px] border-black">
					<div class="bg-[#ffc480] text-black px-6 py-4 border-b-[4px] border-black">
						<h2 class="text-2xl font-black uppercase tracking-tight">LinkedIn Banner Size Guide</h2>
					</div>

					<div class="p-8">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div>
								<h3
									class="font-black text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2"
								>
									<span
										class="w-8 h-8 bg-gray-900 text-white flex items-center justify-center text-sm font-bold"
										>✓</span
									>
									Recommended Dimensions
								</h3>
								<ul class="space-y-3">
									<li class="flex items-center gap-3 p-3 bg-[#FFFDF8] border-[2px] border-gray-900">
										<span class="text-[#4ade80] font-black">✓</span>
										<span class="font-bold"
											>Personal Profile: <strong class="text-[#ff6b6b]">1584 x 396 pixels</strong
											></span
										>
									</li>
									<li class="flex items-center gap-3 p-3 bg-[#FFFDF8] border-[2px] border-gray-900">
										<span class="text-[#4ade80] font-black">✓</span>
										<span class="font-bold"
											>Company Page: <strong class="text-[#ff6b6b]">1128 x 191 pixels</strong></span
										>
									</li>
									<li class="flex items-center gap-3 p-3 bg-[#FFFDF8] border-[2px] border-gray-900">
										<span class="text-[#4ade80] font-black">✓</span>
										<span class="font-bold"
											>Aspect Ratio: <strong class="text-[#ff6b6b]">4:1</strong></span
										>
									</li>
								</ul>
							</div>
							<div>
								<h3
									class="font-black text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2"
								>
									<span
										class="w-8 h-8 bg-[#ffc480] border-[2px] border-gray-900 flex items-center justify-center text-sm font-bold"
										>!</span
									>
									Important Notes
								</h3>
								<ul class="space-y-3">
									<li class="flex items-start gap-3 p-3 bg-[#FFFDF8] border-[2px] border-gray-900">
										<span class="text-[#ffc480] font-black mt-0.5">⚠</span>
										<span class="font-medium"
											>Mobile App Profile Photo covers large left area (~600px)</span
										>
									</li>
									<li class="flex items-start gap-3 p-3 bg-[#FFFDF8] border-[2px] border-gray-900">
										<span class="text-blue-500 font-black mt-0.5">ℹ</span>
										<span class="font-medium"
											>All templates now keep important text on the right side</span
										>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>

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

	<Footer />
</section>

<style>
	:global(.color-picker) {
		--picker-width: 100%;
	}

	.color-picker-wrapper :global(button) {
		border: 3px solid #1f2937 !important;
		border-radius: 0 !important;
		box-shadow: 3px 3px 0 0 #1f2937;
	}
</style>
