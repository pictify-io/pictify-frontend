<script>
	/**
	 * /tools/og-image-generator — the v2 tool page, column mode.
	 *
	 * SEO copy is frozen; the template picker, editor and NextSteps keep their
	 * behaviour. The toolbar's quota ladder replaces GenerationLimitBanner, and
	 * the in-editor Generate button moves into that toolbar so every tool page
	 * has its primary action in the same place.
	 */
	import SEOHead from '$lib/seo/SEOHead.svelte';
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolCard from '$lib/components/tools/v2/ToolCard.svelte';
	import QuotaMeter from '$lib/components/tools/v2/QuotaMeter.svelte';
	import GenerateButton from '$lib/components/tools/v2/GenerateButton.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import OgImageTemplate from '$lib/components/tools/OgImageTemplate.svelte';
	import { getTemplate, getWebsiteInfo } from '../../../api/tools/og-image';
	import { createImagePublic } from '../../../api/image.js';
	import { onMount } from 'svelte';
	import { toast } from '../../../store/toast.store';
	import { page } from '$app/stores';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { user } from '../../../store/user.store';
	import {
		ogPlatforms,
		popularSizes as configPopularSizes,
		platformGuides,
		platformRecommendedSizes,
		parseSize
	} from '$lib/pseo/config.js';
	import ApiPromptSection from '$lib/components/tools/ApiPromptSection.svelte';
	import ResultCard from '$lib/components/tools/v2/ResultCard.svelte';
	import AutomateSection from '$lib/components/tools/v2/AutomateSection.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import { analytics } from '$lib/telemetry.js';
	import { downloadFile } from '$lib/utils/download.js';
	import RelatedTools from '$lib/components/tools/RelatedTools.svelte';

	// Optional platform prop to specialize content (e.g., 'wordpress')
	export let platform = null;
	$: platformObj =
		typeof platform === 'string'
			? ogPlatforms.find((p) => p.id === platform) || { id: platform, label: platform }
			: platform;
	$: platformLabel = platformObj?.label;
	$: isPlatform = !!platformLabel;
	$: recommendedSizes = configPopularSizes;
	$: platformSizes = isPlatform
		? platformRecommendedSizes[platformObj.id] || recommendedSizes
		: recommendedSizes;
	$: platformSteps = isPlatform ? platformGuides[platformObj.id] || [] : [];

	// If a platform is provided, adapt default preview dimensions to its recommended size
	$: if (isPlatform && platformSizes && platformSizes.length) {
		const dims = parseSize(platformSizes[0]);
		if (dims.width && dims.height) {
			previewWidth = dims.width;
			previewHeight = dims.height;
		}
	}

	// Growth metrics
	let totalImagesGenerated = 45897; // Social proof counter

	// Add user store subscription
	let isUserLoggedIn = false;
	user.subscribe((userData) => {
		isUserLoggedIn = !!userData.email;
	});

	const popularFontsLinks = [
		'https://fonts.googleapis.com/css2?family=Arial:wght@100;200;300;400;500;600;700;800;900&display=swap',
		'https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap',
		'https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300;400;700&display=swap',
		'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap',
		'https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap',
		'https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap',
		'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@200;300;400;600;700;900&display=swap',
		'https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&display=swap',
		'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap',
		'https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap',
		'https://fonts.googleapis.com/css2?family=DynaPuff:wght@400..700&display=swap'
	];

	const popularFonts = [
		{ id: 'Arial', name: 'Arial', className: 'arial' },
		{ id: 'Roboto', name: 'Roboto', className: 'roboto' },
		{ id: 'Roboto Condensed', name: 'Roboto Condensed', className: 'roboto-condensed' },
		{ id: 'Open Sans', name: 'Open Sans', className: 'open-sans' },
		{ id: 'Montserrat', name: 'Montserrat', className: 'montserrat' },
		{ id: 'Poppins', name: 'Poppins', className: 'poppins' },
		{ id: 'Source Sans Pro', name: 'Source Sans Pro', className: 'source-sans-pro' },
		{ id: 'Oswald', name: 'Oswald', className: 'oswald' },
		{ id: 'Inter', name: 'Inter', className: 'inter' },
		{ id: 'Manrope', name: 'Manrope', className: 'manrope' },
		{ id: 'DynaPuff', name: 'DynaPuff', className: 'dynapuff' }
	];

	const combinedFonts = popularFonts.map((font, index) => ({
		...font,
		link: popularFontsLinks[index]
	}));

	let templates = [];
	let url = '';
	let selectedTemplate = '';
	let isFetchingWebsiteInfo = false;
	let selectedFont = combinedFonts[0];
	let logoWidth = 150;
	let imageUrl = '';
	let isImageGenerating = false;
	let websiteInfo;
	let error = null;
	let creationMode = 'website'; // 'website' or 'direct'

	// /api/tools/website-info can return fewer than three palette entries (or
	// none at all); indexing a missing entry used to throw and silently kill
	// the generate flow. Always read the palette through this fallback.
	const paletteColor = (colors, index, fallback) => {
		const entry = colors?.[index];
		return Array.isArray(entry) && entry.length >= 3
			? { r: entry[0], g: entry[1], b: entry[2] }
			: fallback;
	};

	let backgroundColorRgb = paletteColor(websiteInfo?.colors, 0, { r: 255, g: 255, b: 255 });
	let headingColorRgb = paletteColor(websiteInfo?.colors, 1, { r: 0, g: 0, b: 0 });
	let subHeadingColorRgb = paletteColor(websiteInfo?.colors, 2, { r: 0, g: 0, b: 0 });

	let ogImageTemplateWrapper;
	// Remove the dynamic width/height calculations
	let previewWidth = 1200;
	let previewHeight = 630;

	const isValidUrl = (url) => {
		const urlRegex = new RegExp(
			'^(https?:\\/\\/)?' + // protocol
				'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
				'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
				'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
				'(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
				'(\\#[-a-z\\d_]*)?$',
			'i'
		);
		try {
			new URL(url);
			return urlRegex.test(url);
		} catch (e) {
			return false;
		}
	};

	const submitUrl = async (url) => {
		if (!isValidUrl(url)) {
			return;
		}
		error = null;
		isFetchingWebsiteInfo = true;
		try {
			websiteInfo = await getWebsiteInfo(url);
		} catch (e) {
			error = 'Failed to fetch website info';
			isFetchingWebsiteInfo = false;
			return;
		}
		isFetchingWebsiteInfo = false;
		try {
			backgroundColorRgb = paletteColor(websiteInfo?.colors, 0, { r: 255, g: 255, b: 255 });
			headingColorRgb = paletteColor(websiteInfo?.colors, 1, { r: 0, g: 0, b: 0 });
			subHeadingColorRgb = paletteColor(websiteInfo?.colors, 2, { r: 0, g: 0, b: 0 });

			while (!ogImageTemplateWrapper) {
				await new Promise((resolve) => {
					setTimeout(resolve, 100);
				});
			}

			const iframe = ogImageTemplateWrapper.querySelector('iframe');
			// A freshly created iframe has document.body === null until its srcdoc
			// parses; probing body.innerHTML directly threw for cold organic landings.
			if (!iframe?.contentWindow?.document?.body?.innerHTML) {
				await new Promise((resolve) => {
					if (iframe) iframe.onload = resolve;
					// Fallback so a never-firing onload can't hang the promise.
					setTimeout(resolve, 1500);
				});
			}

			await updateHTML(selectedTemplate);
		} catch (e) {
			// Post-fetch failures used to escape as unhandled rejections, leaving
			// the spinner cleared but no preview and no message.
			error = 'Could not build a preview from that site. Try another URL.';
		}
	};

	const templateNames = [
		'template-15',
		'template-1',
		'template-10',
		'template-13',
		'template-2',
		'template-3',
		'template-4',
		'template-5',
		'template-6',
		'template-7',
		'template-8',
		'template-9',
		'template-11',
		'template-14',
		'template-12',
		'template-16',
		'template-17',
		'template-18',
		'template-19'
	];

	// Modify websiteInfo to handle direct creation
	const createDirectOgImage = () => {
		websiteInfo = {
			heading: '',
			subHeading: '',
			logo: null,
			colors: [
				[255, 255, 255],
				[0, 0, 0],
				[0, 0, 0]
			] // Default colors
		};
		backgroundColorRgb = { r: 255, g: 255, b: 255 };
		headingColorRgb = { r: 0, g: 0, b: 0 };
		subHeadingColorRgb = { r: 0, g: 0, b: 0 };
	};

	const selectTemplate = (template) => {
		// Store current content and colors if they exist
		const currentHeading = websiteInfo?.heading;
		const currentSubHeading = websiteInfo?.subHeading;
		const currentLogo = websiteInfo?.logo || null;

		selectedTemplate = template;

		// Parse template to get default text content
		const parser = new DOMParser();
		const doc = parser.parseFromString(
			typeof template === 'string' ? template : template.html,
			'text/html'
		);
		const defaultHeading = doc.querySelector('#template-heading')?.innerHTML || '';
		const defaultSubHeading = doc.querySelector('#template-subheading')?.innerHTML || '';

		// Only create new websiteInfo if it doesn't exist
		if (!websiteInfo) {
			createDirectOgImage();
		}

		// Extract colors from the new template
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

				// Extract colors from CSS variables
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

				// Always update colors from template
				if (cssVars['primary-color']) {
					const rgb = extractRGB(cssVars['primary-color']);
					if (rgb) backgroundColorRgb = rgb;
				} else {
					backgroundColorRgb = { r: 255, g: 255, b: 255 }; // Default white
				}
				if (cssVars['secondary-color']) {
					const rgb = extractRGB(cssVars['secondary-color']);
					if (rgb) headingColorRgb = rgb;
				} else {
					headingColorRgb = { r: 0, g: 0, b: 0 }; // Default black
				}
				if (cssVars['tertiary-color']) {
					const rgb = extractRGB(cssVars['tertiary-color']);
					if (rgb) subHeadingColorRgb = rgb;
				} else {
					subHeadingColorRgb = { r: 0, g: 0, b: 0 }; // Default black
				}
			}
		}

		// Update websiteInfo while preserving existing content
		websiteInfo = {
			heading: currentHeading || defaultHeading,
			subHeading: currentSubHeading || defaultSubHeading,
			logo: currentLogo,
			colors: [
				[backgroundColorRgb.r, backgroundColorRgb.g, backgroundColorRgb.b],
				[headingColorRgb.r, headingColorRgb.g, headingColorRgb.b],
				[subHeadingColorRgb.r, subHeadingColorRgb.g, subHeadingColorRgb.b]
			]
		};

		setTimeout(() => {
			updateHTML(template);
			ogImageTemplateWrapper?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 100);
	};

	let hasTrackedFirstInput = false;

	function handleFirstInput() {
		if (!hasTrackedFirstInput) {
			hasTrackedFirstInput = true;
			analytics.trackToolFirstInput({ tool_name: 'og_image_generator' });
		}
	}

	// Initialize editor with default template
	onMount(async () => {
		// Track tool opened
		analytics.trackToolOpened({ tool_name: 'og_image_generator' });

		templates = await Promise.all(
			templateNames.map(async (name) => {
				const template = await getTemplate(name);
				return template;
			})
		);

		const requestedTemplate = $page?.url?.searchParams?.get?.('template');
		if (requestedTemplate) {
			const idx = templateNames.indexOf(requestedTemplate);
			selectedTemplate = idx >= 0 ? templates[idx] : templates[0];
			// Deep-linking from template gallery should be frictionless.
			creationMode = 'direct';
		} else {
			selectedTemplate = templates[0];
		}

		if (creationMode === 'direct') {
			createDirectOgImage();
		}
	});

	// Watch for creationMode changes
	$: if (creationMode === 'direct' && !websiteInfo) {
		createDirectOgImage();
	}

	const updateHTML = async (html) => {
		if (!ogImageTemplateWrapper) return;

		const iframe = ogImageTemplateWrapper.querySelector('iframe');
		if (!iframe) return;

		// Wait for iframe to be ready. document.body is null until the srcdoc
		// parses, so the readiness probe itself must be null-safe.
		if (!iframe.contentWindow?.document?.body?.innerHTML) {
			await new Promise((resolve) => {
				iframe.onload = resolve;
				// Fallback so a never-firing onload can't hang the promise.
				setTimeout(resolve, 1500);
			});
		}

		const document = iframe.contentWindow?.document;
		if (!document?.body) return;
		const heading = document.querySelector('#template-heading');
		const subHeading = document.querySelector('#template-subheading');
		const logo = document.querySelector('#template-logo');

		if (heading) heading.innerHTML = websiteInfo?.heading || '';
		if (subHeading) subHeading.innerHTML = websiteInfo?.subHeading || '';

		if (logo) {
			if (websiteInfo?.logo && websiteInfo.logo.startsWith('<svg')) {
				const svgContainer = document.createElement('div');
				svgContainer.id = 'template-logo';
				svgContainer.innerHTML = websiteInfo.logo;
				logo.replaceWith(svgContainer);

				const svgElement = svgContainer.querySelector('svg');
				if (svgElement) {
					svgElement.setAttribute('width', logoWidth);
					svgElement.setAttribute('height', 'auto');
				}
			} else if (websiteInfo?.logo) {
				const img = document.createElement('img');
				img.src = websiteInfo.logo;
				img.width = logoWidth;
				img.id = 'template-logo';
				logo.replaceWith(img);
			}
		}

		document.documentElement.style.setProperty(
			'--primary-color',
			`rgb(${backgroundColorRgb.r}, ${backgroundColorRgb.g}, ${backgroundColorRgb.b})`
		);
		document.documentElement.style.setProperty(
			'--secondary-color',
			`rgb(${headingColorRgb.r}, ${headingColorRgb.g}, ${headingColorRgb.b})`
		);
		document.documentElement.style.setProperty(
			'--tertiary-color',
			`rgb(${subHeadingColorRgb.r}, ${subHeadingColorRgb.g}, ${subHeadingColorRgb.b})`
		);

		// Update Font
		const fontLink = document.createElement('link');
		fontLink.rel = 'stylesheet';
		fontLink.href = selectedFont.link;
		document.head.appendChild(fontLink);
		document.documentElement.style.fontFamily = selectedFont.id;
	};

	const updateHeading = (event) => {
		websiteInfo.heading = event.target.value;
		updateHTML(selectedTemplate);
	};

	const updateSubHeading = (event) => {
		websiteInfo.subHeading = event.target.value;
		updateHTML(selectedTemplate);
	};

	const updateLogo = async (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				websiteInfo.logo = e.target.result;
				updateHTML(selectedTemplate);
			};
			reader.readAsDataURL(file);
		}
	};

	const updateBackgroundColor = (event) => {
		const rgb = event.detail.rgb;
		backgroundColorRgb = rgb;
		updateHTML(selectedTemplate);
	};

	const updateHeadingColor = (event) => {
		const rgb = event.detail.rgb;
		headingColorRgb = rgb;
		updateHTML(selectedTemplate);
	};

	function copyToClipboard(text, contentType = 'image_url') {
		navigator.clipboard.writeText(text).then(() => {
			analytics.trackCopy({
				content_type: contentType,
				context: 'tool_result',
				tool_name: 'og_image_generator'
			});
			toast.set({ message: 'URL copied to clipboard! 🔗', type: 'success', duration: 1500 });
		});
	}

	function buildCurlSnippetFromHtml(html, width, height) {
		const payload = {
			html: String(html || ''),
			width: Number(width) || 1200,
			height: Number(height) || 630
		};
		return `curl -X POST https://api.pictify.io/image \\\\\n  -H "Content-Type: application/json" \\\\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\\\n  -d '${JSON.stringify(
			payload,
			null,
			2
		)}'`;
	}

	function getCurrentOgHtml() {
		try {
			const iframe = ogImageTemplateWrapper?.querySelector?.('iframe');
			return iframe?.contentWindow?.document?.documentElement?.outerHTML || '';
		} catch (e) {
			return '';
		}
	}

	const updateFont = (font) => {
		selectedFont = font;
		updateHTML(selectedTemplate);
	};

	const updateLogoWidth = (event) => {
		logoWidth = event.target.value;
		updateHTML(selectedTemplate);
	};

	// Add these variables to the existing script section
	const apiExampleCode = `curl -X POST https://api.pictify.io/image/og-image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "template": "template-1",
    "heading": "Launch Day",
    "description": "Ship product updates in style",
    "logo": "https://cdn.pictify.io/logo.png"
  }'`;

	let generationCount = 0;
	let showUpgradePrompt = false;
	const defaultApiFeatureBullets = [
		'Personalize OG images at publish-time with dynamic data',
		'Serve optimized assets from our global CDN in milliseconds',
		'Rotate tokens, monitor usage, and manage limits from the dashboard'
	];
	const apiCtaDetails = {
		title: 'Ship OG images straight from your product',
		description:
			'Use our REST API to generate branded OG art on publish, across marketing workflows, or inside your SaaS with a single call.',
		featurePoints: defaultApiFeatureBullets,
		codeSnippet: apiExampleCode,
		docsUrl: 'https://docs.pictify.io/',
		docsLabel: 'View OG Image API docs',
		secondaryCtaLabel: 'See code examples'
	};

	// Modify the generateImage function
	const generateImage = async () => {
		// Track generation in the limits store
		generationLimits.increment();
		generationCount++;

		isImageGenerating = true;
		const iframe = ogImageTemplateWrapper?.querySelector('iframe');
		const document = iframe?.contentWindow?.document;
		if (!document?.documentElement) {
			isImageGenerating = false;
			toast.set({
				message: 'Preview is still loading. Please try again.',
				type: 'error',
				duration: 3000
			});
			return;
		}
		let html = document.documentElement.outerHTML;

		// No guest watermark: the toolbar promises NO WATERMARK.

		try {
			const { image } = await createImagePublic({
				html,
				width: previewWidth,
				height: previewHeight
			});
			imageUrl = image.url;

			// Track image generation
			analytics.trackImageGenerated({
				tool_name: 'og_image_generator',
				format: 'png',
				with_watermark: !isUserLoggedIn
			});

			// Increment total images counter
			totalImagesGenerated++;

			// Show upgrade prompt after 2 generations
			if (!isUserLoggedIn && generationCount >= 2) {
				showUpgradePrompt = true;
			}
		} catch (error) {
			toast.set({
				message: 'Failed to generate image. Please try again.',
				type: 'error',
				duration: 3000
			});
		} finally {
			isImageGenerating = false;
		}
	};

	let progress = tweened(0, {
		duration: 3000,
		easing: cubicOut
	});

	$: if (isFetchingWebsiteInfo) {
		progress.set(100);
	} else {
		progress.set(0);
	}

	// Add state for growth features
	let savedTemplates = [];
	let showSignupPrompt = false;

	// Function to handle template saving
	const saveTemplate = () => {
		if (!isUserLoggedIn) {
			showSignupPrompt = true;
			return;
		}
		toast.set({ message: 'Template saved successfully!', type: 'success', duration: 1500 });
	};

	// Increment stats
	const incrementStats = () => {
		totalImagesGenerated++;
		// Update backend stats
	};

	let visible = false;

	onMount(() => {
		visible = true;
		// ... rest of existing onMount code ...
	});

	$: canonicalUrl =
		isPlatform && platformObj?.id
			? `https://pictify.io/tools/og-image-generator/${platformObj.id}`
			: 'https://pictify.io/tools/og-image-generator';

	$: structuredDataDescription =
		isPlatform && platformLabel
			? `Create custom ${platformLabel} Open Graph images for improved social media engagement and SEO.`
			: 'Create custom Open Graph images for improved social media engagement and SEO.';

	$: structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify OG Image Generator',
		url: canonicalUrl,
		description: structuredDataDescription,
		applicationCategory: ['DesignApplication', 'SEO Tool'],
		operatingSystem: 'Web',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD',
			availability: 'https://schema.org/InStock'
		},
		aggregateRating: {
			'@type': 'AggregateRating',
			ratingValue: '4.9',
			ratingCount: '4192',
			bestRating: '5',
			worstRating: '1'
		},
		featureList: [
			'Customizable templates',
			'Automatic website info extraction',
			'Color and font customization',
			'API access',
			'Social media preview'
		],
		screenshot: {
			'@type': 'ImageObject',
			url: 'https://media.pictify.io/31hxg-1775406864453.png',
			width: '1200',
			height: '630'
		},
		creator: {
			'@type': 'Organization',
			name: 'Pictify.io',
			url: 'https://pictify.io',
			logo: 'https://pictify.io/logo.png'
		},
		interactionStatistic: {
			'@type': 'InteractionCounter',
			interactionType: 'https://schema.org/UseAction',
			userInteractionCount: '45897'
		},
		softwareVersion: '1.2.0',
		softwareHelp: {
			'@type': 'CreativeWork',
			name: 'OG Image Generator Documentation',
			url: 'https://docs.pictify.io/api-reference/generation/images'
		},
		keywords: [
			'OG image generator',
			'Open Graph images',
			'social media images',
			'SEO',
			'content marketing'
		],
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': canonicalUrl
		}
	};

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'How do I add an OG image?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: "Add the og:image meta tag in your page's <head> section with the absolute URL of your image."
				}
			},
			{
				'@type': 'Question',
				name: 'What size should it be?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'The recommended size is 1200×630 pixels (1.91:1 ratio) for optimal display on Facebook, Twitter, and LinkedIn.'
				}
			},
			{
				'@type': 'Question',
				name: 'Is there an API?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Yes! Use our REST API to generate OG images programmatically. Perfect for blogs, e-commerce, and SaaS platforms.'
				}
			}
		]
	};

	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pictify.io/' },
			{ '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://pictify.io/tools' },
			{ '@type': 'ListItem', position: 3, name: 'OG Image Generator' }
		]
	};

	const TOOL_NAME = 'og_image_generator';
	const TOOL_PATH = '/tools/og-image-generator';

	$: guestRemaining = Math.max(0, GUEST_DAILY_LIMIT - ($generationLimits?.count || 0));
	$: lastFreeRender = !isUserLoggedIn && guestRemaining <= 1;

	const ogImageExamples = [
		{
			id: 'javascript',
			label: 'JavaScript',
			fileName: 'og-image.js',
			code: `<span class="text-[#6a9955]">// Render a 1200x630 Open Graph image from HTML</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">html</span> = <span class="text-[#ce9178]">\`&lt;div style="width:1200px;height:630px;display:flex;align-items:center;justify-content:center;background:#0054A6;color:#fff;font:700 64px sans-serif"&gt;\${title}&lt;/div&gt;\`</span>;

<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">response</span> = <span class="text-[#c586c0]">await</span> <span class="text-[#dcdcaa]">fetch</span>(<span class="text-[#ce9178]">'https://api.pictify.io/image'</span>, {
  <span class="text-[#9cdcfe]">method</span>: <span class="text-[#ce9178]">'POST'</span>,
  <span class="text-[#9cdcfe]">headers</span>: { <span class="text-[#ce9178]">'Content-Type'</span>: <span class="text-[#ce9178]">'application/json'</span>, <span class="text-[#ce9178]">'Authorization'</span>: <span class="text-[#ce9178]">'Bearer YOUR_API_KEY'</span> },
  <span class="text-[#9cdcfe]">body</span>: <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">stringify</span>({ <span class="text-[#9cdcfe]">html</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">1200</span>, <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">630</span> })
});

<span class="text-[#c586c0]">const</span> { <span class="text-[#9cdcfe]">image</span> } = <span class="text-[#c586c0]">await</span> <span class="text-[#9cdcfe]">response</span>.<span class="text-[#dcdcaa]">json</span>();
<span class="text-[#9cdcfe]">console</span>.<span class="text-[#dcdcaa]">log</span>(<span class="text-[#9cdcfe]">image</span>.<span class="text-[#9cdcfe]">url</span>); <span class="text-[#6a9955]">// drop straight into og:image</span>`
		},
		{
			id: 'python',
			label: 'Python',
			fileName: 'og_image.py',
			code: `<span class="text-[#c586c0]">import</span> <span class="text-[#9cdcfe]">requests</span>

<span class="text-[#9cdcfe]">html</span> = <span class="text-[#ce9178]">'&lt;div style="width:1200px;height:630px;display:flex;align-items:center;justify-content:center;background:#0054A6;color:#fff;font:700 64px sans-serif"&gt;New blog post&lt;/div&gt;'</span>

<span class="text-[#9cdcfe]">resp</span> = <span class="text-[#9cdcfe]">requests</span>.<span class="text-[#dcdcaa]">post</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>,
    <span class="text-[#9cdcfe]">headers</span>={<span class="text-[#ce9178]">"Authorization"</span>: <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>},
    <span class="text-[#9cdcfe]">json</span>={<span class="text-[#ce9178]">"html"</span>: <span class="text-[#9cdcfe]">html</span>, <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">1200</span>, <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">630</span>})

<span class="text-[#dcdcaa]">print</span>(<span class="text-[#9cdcfe]">resp</span>.<span class="text-[#dcdcaa]">json</span>()[<span class="text-[#ce9178]">"url"</span>])`
		},
		{
			id: 'curl',
			label: 'cURL',
			fileName: 'og-image.sh',
			code: `<span class="text-[#dcdcaa]">curl</span> -X POST <span class="text-[#ce9178]">https://api.pictify.io/image</span> \\
  -H <span class="text-[#ce9178]">"Content-Type: application/json"</span> \\
  -H <span class="text-[#ce9178]">"Authorization: Bearer YOUR_API_KEY"</span> \\
  -d <span class="text-[#ce9178]">'{"html":"&lt;div style=\\"width:1200px;height:630px\\"&gt;...&lt;/div&gt;","width":1200,"height":630}'</span>`
		}
	];

	const RELATED = [
		{
			title: 'LinkedIn banner',
			meta: 'TEMPLATE → 1584×396',
			href: '/tools/linkedin-banner-generator',
			art: '/landing/tools/linkedin-banner.svg'
		},
		{
			title: 'Tweet screenshot',
			meta: 'TWEET URL → PNG',
			href: '/tools/tweet-screenshot',
			art: '/landing/tools/tweet-screenshot.svg'
		},
		{
			title: 'HTML to image',
			meta: 'HTML → PNG · JPG · WEBP',
			href: '/tools/html-to-image',
			art: '/landing/tools/html-to-image.svg'
		}
	];
</script>

{#if !isPlatform}
	<!-- Platform variants render their own SEOHead in [platform]/+page.svelte -->
	<SEOHead
		title="Free OG Image Generator: Create Open Graph Images in Seconds | Pictify"
		description="Pick a template, customize colors and text, and export your OG image in one click. 20+ templates for Twitter, LinkedIn, Facebook. Free, no signup. API available."
		canonical="https://pictify.io/tools/og-image-generator"
		robots="index, follow, max-image-preview:large"
		ogImage="https://media.pictify.io/31hxg-1775406864453.png"
		openGraph={{
			description:
				'Pick a template, customize colors and text, export your OG image. 20+ templates for Twitter, LinkedIn, Facebook. Free, no signup.'
		}}
		twitter={{
			description:
				'Create stunning social media cards with our free OG Image Generator. Design custom Open Graph images in seconds.'
		}}
		schema={[structuredData, faqSchema, breadcrumbSchema]}
	/>
{/if}

<ToolPageShell
	toolName={TOOL_NAME}
	toolPath={TOOL_PATH}
	breadcrumb={isPlatform ? `OG IMAGE · ${platformLabel.toUpperCase()}` : 'OG IMAGE GENERATOR'}
	facts="FREE · 5 RENDERS A DAY · NO SIGNUP · 1200×630"
	related={RELATED}
	loggedIn={isUserLoggedIn}
	hasResult={!!imageUrl}
	longform="column"
>
	<h1
		slot="h1"
		class="font-display text-[38px] font-extrabold leading-[1.04] tracking-[-0.02em] text-brand-ink lg:text-[52px] lg:leading-[56px]"
	>
		<span>OG IMAGE</span>
		<span>GENERATOR</span>
		{#if isPlatform}
			<span class="whitespace-nowrap">for {platformLabel}</span>
		{/if}
	</h1>

	<p
		slot="hero-sub"
		class="max-w-[640px] font-sans text-base leading-[25px] text-[#2A2C1E] lg:text-lg lg:leading-[27px]"
	>
		Create stunning <span class="font-medium">Open Graph images</span> for your website.
		<span class="text-brand-slate">Boost social media engagement with custom social cards</span>
	</p>

	<div slot="tool">
		<ToolCard>
			<div class="flex flex-col gap-6 p-5 lg:p-7">
				<div class="p-6 md:p-8 bg-brand-subtle">
					<!-- Mode Toggle -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
						<button
							class="group relative w-full"
							on:click={() => {
								creationMode = 'website';
								websiteInfo = null;
							}}
						>
							<div
								class={`px-6 py-5 border border-brand-ink transition-all duration-200 flex flex-col items-center gap-2
				                ${
													creationMode === 'website'
														? 'bg-brand-ink text-white'
														: 'bg-brand-paper hover:bg-brand-subtle hover:'
												}`}
							>
								<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
									/></svg
								>
								<span class="font-semibold text-lg tracking-tight">From Website</span>
								<span class="text-xs font-bold text-brand-mute">Extract info automatically</span>
							</div>
						</button>
						<button
							class="group relative w-full"
							on:click={() => {
								creationMode = 'direct';
								createDirectOgImage();
							}}
						>
							<div
								class={`px-6 py-5 border border-brand-ink transition-all duration-200 flex flex-col items-center gap-2
				                ${
													creationMode === 'direct'
														? 'bg-brand-ink text-white'
														: 'bg-brand-paper hover:bg-brand-subtle hover:'
												}`}
							>
								<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/></svg
								>
								<span class="font-semibold text-lg tracking-tight">Create Directly</span>
								<span class="text-xs font-bold text-brand-mute">Design from scratch</span>
							</div>
						</button>
					</div>

					{#if creationMode === 'website'}
						<!-- Website URL Input -->
						<div class="border-t-[3px] border-dashed border-gray-300 pt-8">
							<h4 class="font-semibold text-lg mb-4 tracking-tight flex items-center gap-3">
								<span
									class="w-8 h-8 bg-brand-ink text-white flex items-center justify-center text-sm font-bold border border-brand-ink"
									>01</span
								>
								Enter Website URL
							</h4>
							<div class="flex flex-col md:flex-row gap-4">
								<input
									bind:value={url}
									on:input={handleFirstInput}
									type="text"
									class="flex-1 border border-brand-ink placeholder-gray-400 text-lg font-bold focus:outline-none py-4 px-5 transition-all bg-brand-paper"
									placeholder="https://yourwebsite.com"
									on:keydown={(e) => e.key === 'Enter' && submitUrl(url)}
								/>
								<button
									on:click={() => submitUrl(url)}
									disabled={isFetchingWebsiteInfo}
									class="py-4 px-8 bg-brand-field border border-brand-ink font-semibold tracking-wide text-brand-ink transition-all disabled:opacity-50 flex items-center justify-center gap-2"
								>
									{#if isFetchingWebsiteInfo}
										<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"
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
										Fetching...
									{:else}
										Fetch Info
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M13 7l5 5m0 0l-5 5m5-5H6"
											/></svg
										>
									{/if}
								</button>
							</div>
							{#if error}
								<div
									class="mt-4 p-4 bg-brand-pink/10 border-[3px] border-brand-danger text-brand-pink font-bold flex items-center gap-2"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/></svg
									>
									{error}
								</div>
							{/if}
						</div>
					{:else}
						<div class="border-t-[3px] border-dashed border-gray-300 pt-8">
							<div class="bg-brand-proof/10 border-[3px] border-brand-proof p-6 text-center">
								<p class="text-brand-ink font-bold text-lg">
									✓ Select a template below to start designing
								</p>
							</div>
						</div>
					{/if}
				</div>
				{#if websiteInfo && selectedTemplate}
					<div
						class="w-full max-w-5xl mx-auto mb-20 relative px-2 md:px-0"
						bind:this={ogImageTemplateWrapper}
					>
						<div class="border border-brand-ink bg-brand-paper">
							<!-- Editor Header -->
							<div
								class="bg-brand-ink text-white px-4 py-3 flex justify-between items-center border-b border-brand-ink"
							>
								<h3 class="font-bold font-mono tracking-widest text-xs md:text-sm">
									/// CUSTOMIZE_IMAGE
								</h3>
								<div class="flex gap-2">
									<div class="w-3 h-3 bg-brand-pink border border-white/20" />
									<div class="w-3 h-3 bg-brand-field border border-white/20" />
									<div class="w-3 h-3 bg-brand-proof border border-white/20" />
								</div>
							</div>

							<!-- Preview Section -->
							<div class="p-6 md:p-8 bg-brand-subtle border-b border-brand-ink">
								<div class="flex justify-center items-center">
									<div class="border border-brand-ink overflow-hidden bg-brand-paper">
										<OgImageTemplate
											html={typeof selectedTemplate === 'string'
												? selectedTemplate
												: selectedTemplate.html}
											width={1200}
											height={630}
											scale={0.5}
										/>
									</div>
								</div>
							</div>

							<!-- Editor Controls -->
							<div class="p-6 md:p-8">
								<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
									<!-- Logo Section -->
									<div class="space-y-4">
										<h4 class="font-semibold text-lg tracking-tight flex items-center gap-3">
											<span
												class="w-8 h-8 bg-brand-field flex items-center justify-center border border-brand-ink"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
													><path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
													/></svg
												>
											</span>
											Logo
										</h4>
										<div class="p-4 bg-brand-subtle border-[3px] border-gray-200 space-y-4">
											{#if websiteInfo.logo}
												<div
													class="bg-brand-paper p-4 border-[2px] border-gray-200 flex justify-center"
												>
													{#if websiteInfo.logo.startsWith('<svg')}
														<div style="width: 120px;">{@html websiteInfo.logo}</div>
													{:else}
														<img
															loading="lazy"
															src={websiteInfo.logo}
															style="width: 120px;"
															alt="Logo"
															class="object-contain"
														/>
													{/if}
												</div>
											{/if}
											<input
												type="file"
												class="hidden"
												id="logoInput"
												accept="image/*"
												on:change={updateLogo}
											/>
											<label
												for="logoInput"
												class="block w-full px-4 py-3 bg-brand-paper border border-brand-ink text-brand-ink font-bold cursor-pointer hover:bg-brand-subtle transition-all text-center tracking-wide"
											>
												Upload Logo
											</label>
											<div class="space-y-2">
												<span class="text-xs font-bold text-brand-mute"
													>Logo Width: {logoWidth}px</span
												>
												<input
													type="range"
													min="50"
													max="400"
													class="w-full h-2 bg-brand-rule appearance-none cursor-pointer accent-brand-danger"
													value={logoWidth}
													on:input={updateLogoWidth}
												/>
											</div>
										</div>
									</div>

									<!-- Content Section -->
									<div class="space-y-4">
										<h4 class="font-semibold text-lg tracking-tight flex items-center gap-3">
											<span
												class="w-8 h-8 bg-brand-pink text-white flex items-center justify-center border border-brand-ink"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
													><path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/></svg
												>
											</span>
											Content
										</h4>
										<div class="space-y-4">
											<div>
												<label for="og-heading" class="text-xs font-bold text-brand-mute block mb-2"
													>Heading</label
												>
												<input
													id="og-heading"
													type="text"
													class="w-full border-[3px] border-gray-200 text-lg font-bold focus:outline-none focus:border-black py-3 px-4 transition-all"
													placeholder="Enter heading"
													value={websiteInfo.heading}
													on:input={updateHeading}
												/>
											</div>
											<div>
												<label
													for="og-description"
													class="text-xs font-bold text-brand-mute block mb-2">Description</label
												>
												<textarea
													id="og-description"
													class="w-full border-[3px] border-gray-200 text-base font-medium focus:outline-none focus:border-black py-3 px-4 transition-all resize-none"
													rows="3"
													value={websiteInfo.subHeading}
													on:input={updateSubHeading}
												/>
											</div>
										</div>
									</div>

									<!-- Style Section -->
									<div class="space-y-4 lg:col-span-2">
										<h4 class="font-semibold text-lg tracking-tight flex items-center gap-3">
											<span
												class="w-8 h-8 bg-brand-proof flex items-center justify-center border border-brand-ink"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
													><path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
													/></svg
												>
											</span>
											Style
										</h4>
										<div class="p-4 bg-brand-subtle border-[3px] border-gray-200">
											<div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
												<div>
													<label for="og-font" class="text-xs font-bold text-brand-mute block mb-2"
														>Font</label
													>
													<select
														id="og-font"
														class="w-full border-[3px] border-gray-200 text-base font-bold focus:outline-none focus:border-black py-3 px-4 bg-brand-paper appearance-none cursor-pointer"
														on:change={(e) => updateFont(combinedFonts[e.target.selectedIndex])}
													>
														{#each combinedFonts as font}
															<option value={font.id}>{font.name}</option>
														{/each}
													</select>
												</div>
												<div>
													<div class="text-xs font-bold text-brand-mute block mb-2">Background</div>
													<div class="color-picker-wrapper">
														<ColorPicker
															bind:rgb={backgroundColorRgb}
															isDialog={true}
															on:input={updateBackgroundColor}
														/>
													</div>
												</div>
												<div>
													<div class="text-xs font-bold text-brand-mute block mb-2">Text Color</div>
													<div class="color-picker-wrapper">
														<ColorPicker
															bind:rgb={headingColorRgb}
															isDialog={true}
															on:input={updateHeadingColor}
														/>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- Generated Image Result -->
							{#if imageUrl}
								<div class="border-t border-brand-ink">
									<!-- Image preview -->
									<div class="p-4 md:p-6 bg-brand-paper">
										<div class="border border-brand-ink bg-brand-paper p-2">
											<img loading="lazy" src={imageUrl} alt="Generated OG" class="w-full" />
										</div>
									</div>
									<!-- Action bar -->
									<div
										class="bg-brand-proof border-t border-brand-ink px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3"
									>
										<span
											class="font-semibold text-xs sm:text-sm tracking-widest text-brand-ink flex items-center gap-2"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M5 13l4 4L19 7"
												/></svg
											>
											Image generated
										</span>
										<div class="flex items-center gap-2">
											<button
												on:click={() => copyToClipboard(imageUrl)}
												class="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-ink text-white font-bold text-xs border border-brand-ink transition-all"
											>
												Copy URL
											</button>
											<button
												on:click={() =>
													downloadFile(imageUrl, 'og-image.png', {
														tool_name: 'og_image_generator'
													})}
												class="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-paper text-brand-ink font-bold text-xs border border-brand-ink transition-all"
											>
												Download
											</button>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<svelte:fragment slot="toolbar-left">
				<span class="font-mono text-xs tracking-[0.06em] text-brand-mute">
					TITLE · LOGO → 1200×630
				</span>
			</svelte:fragment>

			<svelte:fragment slot="toolbar-right">
				<QuotaMeter
					remaining={guestRemaining}
					loggedIn={isUserLoggedIn}
					toolName={TOOL_NAME}
					toolPath={TOOL_PATH}
				/>
				<GenerateButton
					label="Generate Image"
					loading={isImageGenerating}
					ready={!!(websiteInfo && selectedTemplate)}
					remaining={guestRemaining}
					loggedIn={isUserLoggedIn}
					toolName={TOOL_NAME}
					toolPath={TOOL_PATH}
					on:generate={generateImage}
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
				width={1200}
				height={630}
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
		description="Generate Open Graph images programmatically. Render a 1200×630 card from HTML with one POST — perfect for per-post og:image at publish time."
		codeExamples={ogImageExamples}
	/>

	<svelte:fragment slot="longform">
		<LongformSection index="01" id="templates" first>
			<h2
				slot="heading"
				class="font-display text-[28px] font-bold leading-9 tracking-[-0.02em] text-brand-ink"
			>
				{isPlatform ? `Templates for ${platformLabel}` : 'Choose Template'}
			</h2>
			<div class="w-full max-w-5xl mx-auto mb-20">
				<div class="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 px-2 md:px-0">
					{#if !isUserLoggedIn}
						<a
							href="/signup"
							on:click={() =>
								analytics.track('tool_signup_click', {
									tool_name: 'og_image_generator',
									cta_location: 'view_all_templates'
								})}
							class="font-bold text-brand-ink hover:text-brand-pink transition-colors flex items-center gap-1 tracking-wide text-sm border-b-[2px] border-black pb-1"
						>
							View All Templates →
						</a>
					{/if}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 md:px-0">
					{#each templates.slice(0, 6) as template, i}
						<div
							class="group bg-brand-paper border border-brand-ink overflow-hidden hover:-translate-y-1 transition-all duration-200 cursor-pointer"
							on:click={() => selectTemplate(template)}
							on:keydown={(e) => e.key === 'Enter' && selectTemplate(template)}
							role="button"
							tabindex="0"
						>
							<div class="p-2 bg-brand-subtle border-b border-brand-ink flex gap-1.5">
								<div class="w-2.5 h-2.5 bg-brand-pink border border-black" />
								<div class="w-2.5 h-2.5 bg-brand-field border border-black" />
								<div class="w-2.5 h-2.5 bg-brand-proof border border-brand-ink" />
							</div>
							<div class="relative bg-brand-paper overflow-hidden" style="height: 180px;">
								<OgImageTemplate
									html={typeof template === 'string' ? template : template.html}
									width={1200}
									height={630}
									scale={0.3}
								/>

								<!-- Hover Overlay -->
								<div
									class="absolute inset-0 bg-brand-ink/80 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
								>
									<span
										class="px-5 py-2 bg-brand-paper text-brand-ink font-semibold text-sm border border-brand-ink"
									>
										Use This
									</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</LongformSection>

		<!-- API Section -->
		<section class="mb-16 max-w-5xl mx-auto">
			<ApiPromptSection
				title={apiCtaDetails.title}
				description={apiCtaDetails.description}
				featurePoints={apiCtaDetails.featurePoints}
				codeSnippet={apiCtaDetails.codeSnippet}
				codeLanguage="bash"
				docsUrl={apiCtaDetails.docsUrl}
				docsLabel={apiCtaDetails.docsLabel}
				secondaryCtaLabel={apiCtaDetails.secondaryCtaLabel}
				secondaryCtaUrl="https://docs.pictify.io/api-reference/overview"
				note="Contact us for volume pricing or dedicated rendering regions."
			/>
		</section>

		<div class="max-w-5xl mx-auto px-2 md:px-0">
			<!-- What is OG Image -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
				<div class="border border-brand-ink bg-brand-paper p-6 md:p-8">
					<div
						class="w-12 h-12 bg-brand-field border border-brand-ink flex items-center justify-center mb-6"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
							/></svg
						>
					</div>
					<h3 class="text-2xl font-semibold mb-4 text-brand-ink">What is an OG Image?</h3>
					<p class="text-brand-ink font-medium leading-relaxed">
						An OG (Open Graph) image is the preview that appears when your content is shared on
						social media. It's your first impression. Make it count with professional designs.
					</p>
				</div>

				<div class="border border-brand-ink bg-brand-paper p-6 md:p-8">
					<div
						class="w-12 h-12 bg-brand-pink border border-brand-ink flex items-center justify-center mb-6"
					>
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/></svg
						>
					</div>
					<h3 class="text-2xl font-semibold mb-4 text-brand-ink">Why Use This Tool?</h3>
					<ul class="space-y-3">
						<li class="flex items-center gap-3 font-bold text-brand-ink">
							<div class="w-2 h-2 bg-brand-ink" />
							Create pro images in minutes
						</li>
						<li class="flex items-center gap-3 font-bold text-brand-ink">
							<div class="w-2 h-2 bg-brand-ink" />
							Match your brand perfectly
						</li>
						<li class="flex items-center gap-3 font-bold text-brand-ink">
							<div class="w-2 h-2 bg-brand-ink" />
							Boost CTR by up to 40%
						</li>
					</ul>
				</div>
			</div>

			<!-- FAQ Section -->
			<div class="border border-brand-ink bg-brand-paper p-6 md:p-8 mb-16">
				<h2 class="text-3xl font-semibold mb-8 text-brand-ink">FAQ</h2>
				<div class="space-y-4">
					<details class="group">
						<summary
							class="flex items-center justify-between cursor-pointer bg-brand-paper p-4 border border-brand-ink transition-all"
						>
							<span class="font-semibold text-lg text-brand-ink">How do I add an OG image?</span>
							<span
								class="border border-brand-ink p-1 bg-brand-ink text-white group-open:bg-brand-paper group-open:text-brand-ink transition-colors"
							>
								<svg
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
							Add the <code class="bg-brand-rule px-2 py-1 font-mono text-sm">og:image</code> meta tag
							in your page's &lt;head&gt; section with the absolute URL of your image.
						</div>
					</details>

					<details class="group">
						<summary
							class="flex items-center justify-between cursor-pointer bg-brand-paper p-4 border border-brand-ink transition-all"
						>
							<span class="font-semibold text-lg text-brand-ink">What size should it be?</span>
							<span
								class="border border-brand-ink p-1 bg-brand-ink text-white group-open:bg-brand-paper group-open:text-brand-ink transition-colors"
							>
								<svg
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
							The recommended size is <strong>1200×630 pixels</strong> (1.91:1 ratio) for optimal display
							on Facebook, Twitter, and LinkedIn.
						</div>
					</details>

					<details class="group">
						<summary
							class="flex items-center justify-between cursor-pointer bg-brand-paper p-4 border border-brand-ink transition-all"
						>
							<span class="font-semibold text-lg text-brand-ink">Is there an API?</span>
							<span
								class="border border-brand-ink p-1 bg-brand-ink text-white group-open:bg-brand-paper group-open:text-brand-ink transition-colors"
							>
								<svg
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
							Yes! Use our REST API to generate OG images programmatically. Perfect for blogs,
							e-commerce, and SaaS platforms.
						</div>
					</details>
				</div>
			</div>
		</div>
	</svelte:fragment>

	<svelte:fragment slot="footer-links">
		<div class="mx-auto w-full max-w-page px-5 lg:px-10">
			<RelatedTools
				tools={['youtube-thumbnail', 'linkedin-banner', 'twitter-header', 'responsive-images']}
			/>
		</div>
	</svelte:fragment>
</ToolPageShell>
