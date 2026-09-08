<script>
	/**
	 * /tools/og-image-generator — the v2 tool page, column mode.
	 *
	 * SEO copy is frozen; the template picker, editor and NextSteps keep their
	 * behaviour. The toolbar's quota ladder replaces GenerationLimitBanner, and
	 * the in-editor Generate button moves into that toolbar so every tool page
	 * has its primary action in the same place.
	 */
	import ToolSeoHead from '$lib/components/tools/v2/ToolSeoHead.svelte';
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolCard from '$lib/components/tools/v2/ToolCard.svelte';
	import QuotaMeter from '$lib/components/tools/v2/QuotaMeter.svelte';
	import GenerateButton from '$lib/components/tools/v2/GenerateButton.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import OgImageTemplate from '$lib/components/tools/OgImageTemplate.svelte';
	import OgImageEditor from '$lib/components/tools/OgImageEditor.svelte';
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
	import ResultCard from '$lib/components/tools/v2/ResultCard.svelte';
	import AutomateSection from '$lib/components/tools/v2/AutomateSection.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import { analytics } from '$lib/telemetry.js';
	import { downloadFile } from '$lib/utils/download.js';
	import HeroTitle from '$lib/components/tools/v2/longform/HeroTitle.svelte';
	import HeroSub from '$lib/components/tools/v2/longform/HeroSub.svelte';
	import ProseGroup from '$lib/components/tools/v2/longform/ProseGroup.svelte';
	import FaqList from '$lib/components/tools/v2/longform/FaqList.svelte';
	import RelatedLinks from '$lib/components/tools/v2/longform/RelatedLinks.svelte';

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

	/*
	 * The gallery the embedded editor shows.
	 *
	 * `name` and `category` are DERIVED, because nothing supplies them: the
	 * templates endpoint returns filenames and there is no metadata beside the
	 * files. The panel renders whatever it is given, so a real name/category
	 * source can be added later without touching this — but until one exists
	 * the gallery says "Template 15" rather than inventing a name on the
	 * template's behalf.
	 */
	$: editorTemplates = templates
		.map((html, i) => ({
			key: templateNames[i] || `t${i}`,
			name: `Template ${String(templateNames[i] || '').replace(/^template-/, '') || i + 1}`,
			category: null,
			html
		}))
		.filter((t) => t.html);

	/** One release of escape hatch, the same lever the studio route uses. */
	$: useLegacyTool = $page?.url?.searchParams?.get?.('studio') === 'v1';
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

	/** The visible accordion. faqSchema keeps its own wording; both are frozen. */
	const FAQS = [
		{
			q: 'How do I add an OG image?',
			a: "Add the og:image meta tag in your page's <head> section with the absolute URL of your image."
		},
		{
			q: 'What size should it be?',
			a: 'The recommended size is 1200×630 pixels (1.91:1 ratio) for optimal display on Facebook, Twitter, and LinkedIn.'
		},
		{
			q: 'Is there an API?',
			a: 'Yes! Use our REST API to generate OG images programmatically. Perfect for blogs, e-commerce, and SaaS platforms.'
		}
	];

	const RELATED = ['linkedin-banner-generator', 'tweet-screenshot', 'html-to-image'];
</script>

{#if !isPlatform}
	<!-- Platform variants render their own SEOHead in [platform]/+page.svelte -->
	<ToolSeoHead
		title="Free OG Image Generator: Create Open Graph Images in Seconds | Pictify"
		description="Pick a template, customize colors and text, and export your OG image in one click. 20+ templates for Twitter, LinkedIn, Facebook. Free, no signup. API available."
		canonical="https://pictify.io/tools/og-image-generator"
		robots="index, follow, max-image-preview:large"
		ogTitle="Free OG Image Generator: Create Open Graph Images in Seconds | Pictify"
		ogDescription="Pick a template, customize colors and text, export your OG image. 20+ templates for Twitter, LinkedIn, Facebook. Free, no signup."
		ogSiteName="Pictify"
		ogImage="https://media.pictify.io/31hxg-1775406864453.png"
		twitterTitle="Free OG Image Generator: Create Open Graph Images in Seconds | Pictify"
		twitterDescription="Create stunning social media cards with our free OG Image Generator. Design custom Open Graph images in seconds."
		twitterImage="https://media.pictify.io/31hxg-1775406864453.png"
		twitterUrl="https://pictify.io/tools/og-image-generator"
		webApplicationSchema={structuredData}
		extraSchemas={[faqSchema, breadcrumbSchema]}
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
	<HeroTitle slot="h1">
		<span>OG IMAGE</span>
		<span>GENERATOR</span>
		{#if isPlatform}
			<span class="whitespace-nowrap">for {platformLabel}</span>
		{/if}
	</HeroTitle>

	<HeroSub slot="hero-sub">
		Create stunning <span class="font-medium">Open Graph images</span> for your website.
		<span class="text-brand-slate">Boost social media engagement with custom social cards</span>
	</HeroSub>

	<div slot="tool">
		<!--
			TS-5a. The tool IS the editor now: the visitor edits the card in place
			instead of filling three fields and pressing Generate.

			The old block — template picker, form fields, static preview, generate
			button — is replaced wholesale. `?studio=v1` keeps a way back for one
			release while this is watched.
		-->
		{#if useLegacyTool}
			<ToolCard>
				<p class="p-6 font-sans text-[13.5px] leading-[19px] text-brand-slate">
					The classic generator has been replaced by the editor.
					<a href="?" class="text-brand-royal underline">Open it</a>.
				</p>
			</ToolCard>
		{:else if editorTemplates.length}
			<OgImageEditor templates={editorTemplates} width={previewWidth} height={previewHeight} />
		{:else}
			<!-- Never an empty state: this is the moment before the templates land. -->
			<div
				class="flex h-[560px] items-center justify-center rounded-[12px] border-[1.5px] border-brand-ink bg-brand-paper"
			>
				<p class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-mute">
					Loading the editor…
				</p>
			</div>
		{/if}
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
		<LongformSection
			index="01"
			id="templates"
			first
			title={isPlatform ? `Templates for ${platformLabel}` : 'Choose Template'}
		>
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

			<!-- These two were h3s in a two-up card grid; they keep that level. -->
			<ProseGroup
				columns={2}
				items={[
					{
						heading: 'What is an OG Image?',
						body: "An OG (Open Graph) image is the preview that appears when your content is shared on social media. It's your first impression. Make it count with professional designs."
					},
					{
						heading: 'Why Use This Tool?',
						bullets: [
							'Create pro images in minutes',
							'Match your brand perfectly',
							'Boost CTR by up to 40%'
						]
					}
				]}
			/>
		</LongformSection>

		<LongformSection index="02" id="faq" title="FAQ">
			<FaqList faqs={FAQS} />
		</LongformSection>
	</svelte:fragment>

	<svelte:fragment slot="footer-links">
		<RelatedLinks
			toolName={TOOL_NAME}
			links={[
				{ href: '/tools/youtube-thumbnail', label: 'YouTube Thumbnail' },
				{ href: '/tools/linkedin-banner', label: 'LinkedIn Banner' },
				{ href: '/tools/twitter-header', label: 'Twitter Header' },
				{ href: '/tools/responsive-images', label: 'Responsive Images' },
				{ href: '/tools', label: 'View all tools →' }
			]}
		/>
	</svelte:fragment>
</ToolPageShell>
