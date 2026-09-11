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
	import ToolEditor from '$lib/components/tools/ToolEditor.svelte';
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import AutomateSection from '$lib/components/tools/v2/AutomateSection.svelte';
	import ToolSeoHead from '$lib/components/tools/v2/ToolSeoHead.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import LongformPair from '$lib/components/tools/v2/longform/LongformPair.svelte';
	import HeroTitle from '$lib/components/tools/v2/longform/HeroTitle.svelte';
	import HeroSub from '$lib/components/tools/v2/longform/HeroSub.svelte';
	import Lead from '$lib/components/tools/v2/longform/Lead.svelte';
	import ProseGroup from '$lib/components/tools/v2/longform/ProseGroup.svelte';
	import FeatureGrid from '$lib/components/tools/v2/longform/FeatureGrid.svelte';
	import StepCards from '$lib/components/tools/v2/longform/StepCards.svelte';
	import CheckList from '$lib/components/tools/v2/longform/CheckList.svelte';
	import ComparisonTable from '$lib/components/tools/v2/longform/ComparisonTable.svelte';
	import FaqList from '$lib/components/tools/v2/longform/FaqList.svelte';
	import LinkCardGrid from '$lib/components/tools/v2/longform/LinkCardGrid.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { user } from '../../../store/user.store';
	import { analytics } from '$lib/telemetry.js';
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
		  } at ${sizeString} instantly. Paste your code or upload an .html file, preview live, and export.`
		: format === 'png'
		? `Paste HTML + CSS or upload an .html file, preview it live, and export a high-quality PNG in one click. Free online converter with a built-in code editor. No signup. API available for automation.`
		: format === 'jpg'
		? `Free online HTML to JPG converter: paste HTML + CSS or upload an .html file, preview it live, and download a high-quality JPG in one click. No signup. API available for automation.`
		: format === 'image'
		? `Convert HTML and CSS to an image (PNG, JPG, or WebP) instantly. Paste code or upload an .html file, preview live, and export, or automate with the API. Free, no signup.`
		: `Convert HTML to ${
				(format && format.toUpperCase()) || 'IMAGE'
		  } images instantly. Paste your code, preview live, and export. Free online tool with built-in editor and API access.`;
	// Size variants canonicalize to the parent format page so they don't
	// compete with it in search (they were outranking it for head terms).
	$: canonicalUrl = `https://pictify.io/tools/html-to-${format}`;
	$: keywords = hasSize
		? `convert image from HTML, HTML to ${format.toUpperCase()} ${sizeString}, ${format.toUpperCase()} converter, ${sizeString} image, online image generator, web design tool, ${
				currentFormat.fullName
		  } image creator, Pictify.io`
		: format === 'image'
		? `html to image, convert html to image, html and css to image, html to image converter, html to png, html to jpg, html to webp, online image generator, web design tool, Pictify.io`
		: `convert image from HTML, HTML to ${format.toUpperCase()}, ${format.toUpperCase()} converter, online image generator, web design tool, ${
				currentFormat.fullName
		  } image creator, Pictify.io`;
	$: ogDescription = hasSize
		? `Convert HTML to high-quality ${
				(currentFormat && currentFormat.fullName) || 'Image'
		  } at ${sizeString}. Paste code or upload an .html file, preview live, export instantly.`
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



	/*
	 * TS-10. The free allowance is COUNTED ON THE SERVER now (`/image/public/quota`),
	 * and the editor's toolbar reads it. The old localStorage counter is gone
	 * rather than kept as a second opinion: two counters that can disagree is
	 * how a visitor gets told they are out while the render still succeeds.
	 * The number survives only as the promise in the facts line.
	 */
	const FREE_RENDERS_A_DAY = 5;

	onMount(() => {
		if (!browser) return;
		analytics.trackToolOpened({ tool_name: `html_to_${format}` });

		// Dimensions handed over from a size-variant page, applied once.
		const storedWidth = localStorage.getItem('pictify_html_to_image_width');
		const storedHeight = localStorage.getItem('pictify_html_to_image_height');
		if (storedWidth && storedHeight) {
			const widthVal = parseInt(storedWidth, 10);
			const heightVal = parseInt(storedHeight, 10);
			if (!Number.isNaN(widthVal) && !Number.isNaN(heightVal) && widthVal > 0 && heightVal > 0) {
				editorWidth = widthVal;
				editorHeight = heightVal;
			}
			localStorage.removeItem('pictify_html_to_image_width');
			localStorage.removeItem('pictify_html_to_image_height');
		}
	});

	// Add user store subscription
	let isUserLoggedIn = false;
	user.subscribe((userData) => {
		isUserLoggedIn = !!userData.email;
	});





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

	// Bound to the editor so the toolbar can drive the render size.
	let editorWidth = 1200;
	let editorHeight = 630;

	/*
	 * TS-07 B. The page opens on the empty drop target, not a starter; the
	 * hero's "Upload .html" opens the same picker the pane does.
	 */
	let toolEditor;

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

	const RELATED = ['table', 'code-to-image', 'og-image-generator'];

	/**
	 * The visible FAQ. Deliberately NOT the FAQPage in `schemaMarkup` below:
	 * that one asks different questions ("Can I convert HTML to X with an API?")
	 * and both are frozen for search, so they stay two lists until a copy pass
	 * reconciles them.
	 */
	$: FAQS = [
		{
			q: 'How does it work?',
			a: `Our converter renders your HTML code in a virtual browser environment and captures the output as a high-quality ${format.toUpperCase()} image. This process ensures that your HTML is accurately represented in the final image.`
		},
		{
			q: 'External resources?',
			a: 'Yes, our converter supports HTML with external resources such as images and stylesheets. However, for the best results and fastest conversion, we recommend using inline styles and data URIs for images when possible.'
		},
		{
			q: 'Max file size?',
			a: 'Our free tool supports HTML files up to 2MB in size. For larger files or batch conversions, consider upgrading to our premium plan or API service.'
		},
		{
			q: 'Privacy?',
			a: 'Yes, we take your privacy seriously. Your HTML code is processed in real-time and is not stored on our servers. Once the conversion is complete, all data is immediately deleted.'
		}
	];

	$: HOW_TO_STEPS = [
		{
			title: 'Input Code',
			body: 'Paste your HTML code in the editor above, or upload your .html file.'
		},
		{
			title: 'Preview',
			body: `Check how your HTML will look as a ${currentFormat.fullName} image.`
		},
		{
			title: 'Convert',
			body: `Click convert to generate your ${currentFormat.fullName} image instantly.`
		}
	];

	// Static copy; `highlightRow` is what makes the table page-specific.
	const FORMAT_TABLE_COLUMNS = ['Format', 'Best For', 'Transparency', 'File Size'];
	const FORMAT_TABLE_ROWS = [
		['PNG', 'Screenshots, UI elements, text-heavy images', 'Yes', 'Large'],
		['JPG', 'Photos, OG images, social cards, email headers', 'No', 'Small'],
		['WebP', 'Web graphics, combining quality of PNG with size of JPG', 'Yes', 'Smallest']
	];
	$: formatTableHighlight = ['png', 'jpg', 'webp'].indexOf(format);

	/** 11 — the same four rows, read across the three formats. */
	$: comparisonFormats = [currentFormat, ...otherFormats.map((f) => formatInfo[f])];
	$: comparisonColumns = ['Feature', ...comparisonFormats.map((f) => f.fullName)];
	$: comparisonRows = [
		['Best For', ...comparisonFormats.map((f) => f.bestFor)],
		[
			'Compression',
			...comparisonFormats.map((f) =>
				f.fullName === 'WebP' ? 'Lossy & Lossless' : f.fullName === 'PNG' ? 'Lossless' : 'Lossy'
			)
		],
		[
			'File Size',
			...comparisonFormats.map((f) =>
				f.fullName === 'WebP' ? 'Small' : f.fullName === 'PNG' ? 'Large' : 'Medium'
			)
		],
		['Transparency', ...comparisonFormats.map((f) => (f.fullName === 'PNG' ? 'Yes' : 'No'))]
	];

	/** 03 — the other formats, plus the all-formats page when not already on it. */
	$: otherFormatLinks = [
		...otherFormats.map((f) => ({
			href: `/tools/html-to-${f}`,
			badge: f,
			title: formatInfo[f].fullName,
			body: `Perfect for ${formatInfo[f].bestFor}`
		})),
		...(format !== 'image'
			? [
					{
						href: '/tools/html-to-image',
						badge: 'ALL',
						title: 'HTML to Image',
						body: 'One converter for PNG, JPG, and WebP'
					}
			  ]
			: [])
	];

	$: socialPreviewLinks = featuredPlatforms.map((platform) => ({
		href: `/tools/og-image-generator/${platform.id}`,
		title: platform.label,
		body: `Design branded OG images tailored for ${platform.label}.`
	}));

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
									text: `Paste your HTML and CSS code into Pictify's free online editor or upload an .html file, see a live preview, then click "Download" to get a high-quality ${
										currentFormat?.fullName || 'image'
									} file. No signup needed. You can also use the Pictify API to convert HTML to ${
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

<ToolSeoHead
	title={headTitle}
	description={headDescription}
	{keywords}
	author="Pictify.io"
	robots="index, follow, max-image-preview:large"
	canonical={canonicalUrl}
	ogTitle={headTitle}
	{ogDescription}
	ogImage="https://media.pictify.io/gre6p-1775406841745.png"
	ogSiteName="Pictify.io"
	ogLocale="en_US"
	twitterTitle={headTitle}
	twitterDescription={headDescription}
	twitterImage="https://media.pictify.io/gre6p-1775406841745.png"
	twitterSite="@pictify_io"
	webApplicationSchema={schemaMarkup}
	breadcrumbLabel={`HTML to ${format ? format.toUpperCase() : 'Image'}`}
/>

<ToolPageShell
	toolName={toolKey}
	{toolPath}
	breadcrumb={`HTML TO ${currentFormat.fullName.toUpperCase()}`}
	facts={`FREE · ${FREE_RENDERS_A_DAY} RENDERS A DAY · NO SIGNUP · ALSO ${otherFormats
		.map((f) => f.toUpperCase())
		.join(' & ')}`}
	toc={TOC}
	related={RELATED}
	loggedIn={isUserLoggedIn}
	longform="rail"
>
	<HeroTitle slot="h1">
		<span>HTML TO</span>
		<span>{currentFormat.fullName}</span>
		{#if hasSize}
			<span class="whitespace-nowrap">{sizeString}</span>
		{/if}
	</HeroTitle>

	<svelte:fragment slot="hero-sub">
		<HeroSub>
			{#if format === 'image'}
				Convert your HTML &amp; CSS into an image in one click: export PNG, JPG, or WebP.
				<span class="text-brand-slate">Perfect for {currentFormat.bestFor}</span>
			{:else}
				Transform your HTML code into high-quality {currentFormat.fullName} images instantly.
				<span class="text-brand-slate">Perfect for {currentFormat.bestFor}</span>
			{/if}
		</HeroSub>
		<!--
			TS-07 B: the one addition to a hero that is otherwise settled. A
			secondary, because pasting into the pane below stays the main way in;
			this is for the visitor who is holding a file. The .zip line is here
			because a saved web page is usually a folder, and that is the first
			thing someone with one will try.
		-->
		<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
			<button
				type="button"
				on:click={() => toolEditor?.chooseFile('hero')}
				class="h-10 rounded-btn border-[1.5px] border-brand-ink bg-brand-paper px-4 font-sans text-[14px] font-semibold text-brand-ink hover:bg-brand-ink hover:text-white"
				>Upload .html</button
			>
			<span class="font-mono text-[11px] tracking-[0.06em] text-brand-ink"
				>OR PASTE IT BELOW · ONE FILE UP TO 2 MB · .ZIP NOT SUPPORTED YET</span
			>
		</div>
	</svelte:fragment>

	<!-- ── Tool ──────────────────────────────────────────────────────── -->
	<div slot="tool">
		<!--
			TS-10. The code-first embed: the pane IS the primary input, and the
			canvas beside it is live rather than a preview you press a button to
			refresh. Replaces the CodeEditor + Generate block wholesale.
		-->
		<ToolEditor
			bind:this={toolEditor}
			templates={[]}
			width={hasSize ? dimWidth : editorWidth}
			height={hasSize ? dimHeight : editorHeight}
			leftPanel="code"
			defaultTab="inputs"
			sourceKind="code"
			toolName={toolKey}
			downloadName={`html-to-${format}`}
			formats={format === 'image' ? ['png', 'jpg', 'webp'] : [fileExtension || format]}
		/>

		<!--
			The sibling formats stay LINKS, not a control. Each is a separate page
			that ranks on its own query, and turning them into a dropdown here
			would quietly delete three entry points.
		-->
		<div class="mt-4 flex flex-wrap items-center gap-2">
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
		</div>


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

	<!-- ── Long-form ─────────────────────────────────────────────────── -->
	<svelte:fragment slot="longform">
		<LongformSection
			index="01"
			id="key-features"
			first
			title={`Key Features${hasSize ? ` for ${currentFormat.fullName} at ${sizeString}` : ''}`}
		>
			<FeatureGrid
				items={currentFormat.benefits.map((benefit) => ({
					title: hasSize ? `${benefit} (works great at ${sizeString})` : benefit
				}))}
			/>
		</LongformSection>

		<!--
			The automate block sits inside the reading column here rather than in the
			shell's `automate` slot: this page's heading order is frozen, and
			"Automate with the API" reads between 01 and 02 today.
		-->
		<AutomateSection
			title="Automate with the"
			titleHighlight="API"
			toolName={toolKey}
			description={`Convert HTML to ${
				(format && format.toUpperCase()) || 'image'
			} programmatically. Render social cards, email headers, and marketing visuals in your CI/CD pipeline.`}
			codeExamples={htmlToImageExamples}
		/>

		<LongformSection
			index="02"
			id="choosing-format"
			title="HTML to Image: Choosing the Right Format"
		>
			<ComparisonTable
				columns={FORMAT_TABLE_COLUMNS}
				rows={FORMAT_TABLE_ROWS}
				highlightRow={formatTableHighlight}
			/>
		</LongformSection>

		<LongformSection
			index="03"
			id="other-formats"
			title={`Try Other Formats${hasSize ? ` at ${sizeString}` : ''}`}
		>
			<LinkCardGrid items={otherFormatLinks} columns={2} toolName={toolKey} />
		</LongformSection>

		<LongformSection index="04" id="social-previews" title="Need social previews?">
			<Lead>Create platform-optimized Open Graph images after exporting your HTML.</Lead>
			<LinkCardGrid items={socialPreviewLinks} columns={3} toolName={toolKey} />
		</LongformSection>

		<LongformSection index="05" id="how-to-convert" title="How to Convert">
			<StepCards steps={HOW_TO_STEPS} />
		</LongformSection>

		<LongformSection
			index="06"
			id="best-practices-format"
			title={`Best Practices for ${currentFormat.fullName} Conversion${
				hasSize ? ` at ${sizeString}` : ''
			}`}
		>
			<CheckList
				items={[
					`Optimize your HTML design for ${currentFormat.bestFor}`,
					'Consider the final image dimensions',
					'Test across different devices'
				]}
			/>
		</LongformSection>

		<LongformSection index="07" id="faq" title="FAQ">
			<FaqList faqs={FAQS} />
		</LongformSection>

		<LongformSection index="08" id="best-practices" title="Best Practices">
			<CheckList
				items={[
					`Optimize your HTML design for ${currentFormat.bestFor}`,
					'Consider the final image dimensions to optimize your HTML layout',
					`Test your ${currentFormat.fullName} images across different devices`,
					'Use appropriate compression settings to balance quality and file size',
					'For text-heavy designs, ensure readability after conversion'
				]}
			/>
		</LongformSection>

		<LongformSection index="09" id="fast-free" title="Fast, Free, Optimized.">
			<Lead>
				Our HTML to {currentFormat.fullName} converter is built for speed and quality. Ideal for {currentFormat.bestFor},
				ensuring your visuals are pixel-perfect.
			</Lead>
			<CheckList
				items={[
					...currentFormat.benefits,
					'Instant Conversion in seconds',
					'Privacy-Focused & Secure'
				]}
			/>
		</LongformSection>

		<!--
			The compact sections pair up above 900px, which gives the end of the
			column a different rhythm from the numbered spine above it. 10 and 11
			span both columns: 11 is a four-column comparison table that clips
			rather than scrolls at half width, and 10 alone in a half column would
			leave a hole beside it.
		-->
		<LongformPair>
			<LongformSection index="10" id="why-choose" compact span title="Why Choose This Tool?">
				<ProseGroup
					items={[
						{
							heading: `Optimized for ${currentFormat.bestFor}`,
							body: `${currentFormat.fullName} is excellent for ${currentFormat.bestFor}, making it a go-to choice.`
						},
						{ heading: 'Key Advantages', body: `${currentFormat.benefits.join('. ')}.` },
						{
							heading: 'Considerations',
							body: `While ${currentFormat.fullName} excels in many areas, it's worth noting that ${currentFormat.drawbacks}.`
						}
					]}
				/>
			</LongformSection>

			<LongformSection
				index="11"
				id="vs-others"
				compact
				span
				title={`${currentFormat.fullName} vs Others`}
			>
				<ComparisonTable columns={comparisonColumns} rows={comparisonRows} />
			</LongformSection>

			<LongformSection index="12" id="use-cases" compact title="Real-World Use Cases">
				<ProseGroup
					columns={2}
					items={[
						{
							heading: 'Social Media',
							body: 'Create eye-catching social media posts directly from HTML templates.'
						},
						{
							heading: 'Email Campaigns',
							body: 'Generate optimized images for email newsletters that load quickly.'
						},
						{
							heading: 'Website Mockups',
							body: 'Quickly create and share website designs with clients.'
						},
						{
							heading: 'Documentation',
							body: 'Easily include web page screenshots in technical docs.'
						}
					]}
				/>
			</LongformSection>

			<LongformSection index="13" id="tech-specs" compact title="Technical Specs">
				<ProseGroup
					columns={2}
					items={[
						{
							heading: 'Conversion Process',
							body: 'Headless browser rendering ensures pixel-perfect conversion.'
						},
						{
							heading: 'Image Quality',
							body: 'Generated at 96 DPI with optimized compression settings.'
						},
						{
							heading: 'Supported Features',
							bullets: [
								'CSS3 and JavaScript rendering',
								'Custom dimensions up to 4000x4000px',
								'Web fonts supported'
							]
						},
						{ heading: 'Performance', body: 'Average conversion time under 5 seconds.' }
					]}
				/>
			</LongformSection>
		</LongformPair>
	</svelte:fragment>
</ToolPageShell>

<!-- Anchors referenced by the HowTo schema steps. -->
<section id="input" class="sr-only" aria-hidden="true" />
<section id="preview" class="sr-only" aria-hidden="true" />
<section id="generate" class="sr-only" aria-hidden="true" />
