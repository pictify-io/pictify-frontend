<script>
	/**
	 * /tools/url-to-image-generator — the v2 tool page, column mode.
	 *
	 * The capture board and preview become the tool card; the quota ladder and
	 * Capture move to its toolbar. SEO copy is frozen.
	 *
	 * GenerationLimitBanner, StickySignupBar and PostSignupWelcome are retired
	 * here: the ladder and the result surface say the same things in place. The
	 * tool-signup-cta-v2 flag still resolves, so the running experiment keeps
	 * its arms; its inline arm renders inside the result block as before.
	 */
	import ToolSeoHead from '$lib/components/tools/v2/ToolSeoHead.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import LongformPair from '$lib/components/tools/v2/longform/LongformPair.svelte';
	import HeroTitle from '$lib/components/tools/v2/longform/HeroTitle.svelte';
	import HeroSub from '$lib/components/tools/v2/longform/HeroSub.svelte';
	import Lead from '$lib/components/tools/v2/longform/Lead.svelte';
	import ProseGroup from '$lib/components/tools/v2/longform/ProseGroup.svelte';
	import FeatureGrid from '$lib/components/tools/v2/longform/FeatureGrid.svelte';
	import CheckList from '$lib/components/tools/v2/longform/CheckList.svelte';
	import FaqList from '$lib/components/tools/v2/longform/FaqList.svelte';
	import RelatedLinks from '$lib/components/tools/v2/longform/RelatedLinks.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolCard from '$lib/components/tools/v2/ToolCard.svelte';
	import QuotaMeter from '$lib/components/tools/v2/QuotaMeter.svelte';
	import GenerateButton from '$lib/components/tools/v2/GenerateButton.svelte';
	import AutomateSection from '$lib/components/tools/v2/AutomateSection.svelte';
	import ResultCard from '$lib/components/tools/v2/ResultCard.svelte';
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { toast } from '../../../store/toast.store';
	import { user } from '../../../store/user.store';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import { getWebsiteHTML } from '../../../api/tools/url-to-image.js';
	import { createImagePublic } from '../../../api/image.js';
	import { saveLastRender } from '$lib/lastRender.js';
	import { analytics } from '$lib/telemetry.js';
	import { downloadFile } from '$lib/utils/download.js';
	import posthog from 'posthog-js';

	let stickyBar;

	// ── Experiments (PostHog feature flags; default 'control', resolved once flags load) ──
	// tool-signup-cta-v2: post-generation signup CTA — control | inline-value-prop | sticky-bar
	//
	// url-tool-capture-flow-v1 CONCLUDED 2026-07-29 — 'auto-capture' shipped to 100% and the
	// behaviour below is now unconditional. Won on both the rageclick primary (7.6% vs 10.3%
	// control over 48d) and the generation guardrail (53.5% vs 18.0%, 3.0x, above control every
	// single day). 'guided-capture' retired as dominated. Flag archived post-deploy — do not
	// reintroduce the read; the legacy control path (gating on iframeElement, which is truthy on
	// mount, so the button looked clickable before any preview existed) was the #1 rageclick driver.
	let ctaVariant = 'control';
	let userInitiatedLoad = false;
	let hasAutoCaptured = false;

	function resolveExperimentVariants() {
		if (!browser) return;
		try {
			ctaVariant = posthog.getFeatureFlag?.('tool-signup-cta-v2') || 'control';
		} catch {
			ctaVariant = 'control';
		}
	}

	// Capture is enabled only once a preview has actually loaded — the real precondition.
	$: captureDisabled = !url || !isPreviewLoaded || isImageGenerating;

	function handleLoadPreviewClick() {
		userInitiatedLoad = true;
		loadPreview();
	}

	async function autoCaptureAfterSettle() {
		// Let fonts + a paint settle so we don't capture a pre-render frame.
		try {
			if (document.fonts?.ready) await document.fonts.ready;
		} catch {
			/* fonts API unavailable */
		}
		await new Promise((resolve) => requestAnimationFrame(() => resolve()));
		if (!isImageGenerating) generateImage();
	}

	let hasTrackedFirstInput = false;
	let isPrefilled = false;

	function handleFirstInput() {
		// Once the user actually types, they're no longer in the prefilled state.
		isPrefilled = false;
		urlError = '';
		if (!hasTrackedFirstInput) {
			hasTrackedFirstInput = true;
			analytics.trackToolFirstInput({ tool_name: 'url_to_image_generator' });
		}
	}

	const PREFILL_URL = 'https://stripe.com';
	const PREFILL_VARIANT_KEY = 'tool-prefilled-example-v1';

	function applyPrefillIfEligible() {
		if (!browser) return;
		const variant = posthog.getFeatureFlag?.(PREFILL_VARIANT_KEY);
		if (variant !== 'prefilled') return;
		if (url) return; // user already typed something
		isPrefilled = true;
		url = PREFILL_URL;
		// Auto-load the preview so the user sees the tool work on landing.
		loadPreview().catch(() => {});
	}

	// Track tool opened on mount (trackToolOpened waits for flags internally)
	onMount(() => {
		analytics.trackToolOpened({ tool_name: 'url_to_image_generator' });
		// Resolve experiment variants + apply prefill once flags are ready. trackToolOpened
		// already defers, but we still gate via onFeatureFlags for dev and slow networks.
		const onFlagsReady = () => {
			resolveExperimentVariants();
			applyPrefillIfEligible();
		};
		if (typeof posthog.onFeatureFlags === 'function') {
			posthog.onFeatureFlags(onFlagsReady);
		} else {
			onFlagsReady();
		}
	});

	function trackSignupClick(ctaLocation) {
		analytics.track('tool_signup_click', {
			tool_name: 'url_to_image_generator',
			cta_location: ctaLocation,
			experiment: 'tool-signup-cta-v2',
			variant: ctaVariant
		});
	}

	// Clean up message listener on destroy (fixes memory leak)
	let messageHandler = null;
	onDestroy(() => {
		if (browser && messageHandler) {
			window.removeEventListener('message', messageHandler);
		}
	});

	// User login state
	let isUserLoggedIn = false;
	$: lastFreeRender = !isUserLoggedIn && guestRemaining <= 1;
	user.subscribe((userData) => {
		isUserLoggedIn = !!userData?.email;
	});

	// ── Core state ─────────────────────────────────────────
	let url = '';
	let selector = '';
	let imageUrl = '';
	let isImageGenerating = false;
	let isPreviewLoaded = false;
	let iframeWrapper;
	let isLoading = false;

	// ── Capture settings ───────────────────────────────────
	let captureWidth = 1200;
	let captureHeight = 630;
	let fileFormat = 'png';
	let activePreset = '';

	const devicePresets = [
		{ id: 'desktop', label: 'Desktop', width: 1440, height: 900 },
		{ id: 'tablet', label: 'Tablet', width: 768, height: 1024 },
		{ id: 'mobile', label: 'Mobile', width: 375, height: 812 }
	];

	function selectPreset(preset) {
		captureWidth = preset.width;
		captureHeight = preset.height;
		activePreset = preset.id;
		// Resize iframe to match device width
		if (iframeWrapper) {
			iframeWrapper.style.maxWidth = preset.width + 'px';
		}
	}

	function handleDimensionInput() {
		activePreset = '';
		// Clamp values
		if (captureWidth < 1) captureWidth = 1;
		if (captureWidth > 4000) captureWidth = 4000;
		if (captureHeight < 1) captureHeight = 1;
		if (captureHeight > 4000) captureHeight = 4000;
		// Reset iframe max-width on custom input
		if (iframeWrapper) {
			iframeWrapper.style.maxWidth = '';
		}
	}

	// ── Live API curl (reactive) ───────────────────────────
	function buildLiveCurl(urlVal, sel, w, h, fmt) {
		const payload = {
			// Same normalization as the validator, so the snippet never
			// advertises a URL that Load Preview just refused.
			url: normalizeUrl(urlVal) || 'https://example.com',
			width: w,
			height: h,
			fileExtension: fmt
		};
		if (sel) payload.selector = sel;
		return `curl -X POST https://api.pictify.io/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
	}
	$: liveCurlSnippet = buildLiveCurl(url, selector, captureWidth, captureHeight, fileFormat);

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
			.replace(/^curl/m, '<span class="text-[#ff79c6]">curl</span>')
			.replace(/ (-H|-d|-X)/g, (m) => ` <span class="text-[#8be9fd]">${m.trim()}</span>`)
			.replace(/https:\/\/[^\s\\]+/g, (m) => `<span class="text-[#f1fa8c]">${m}</span>`)
			.replace(/'([^']*)'/g, (m) => `<span class="text-[#50fa7b]">${m}</span>`)
			.replace(/POST/g, '<span class="text-[#ff79c6]">POST</span>');
	}

	$: highlightedCurl = highlightCurl(liveCurlSnippet);

	const urlToImageExamples = [
		{
			id: 'javascript',
			label: 'JavaScript',
			fileName: 'screenshot.js',
			code: `<span class="text-[#6a9955]">// Capture any URL as an image</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">response</span> = <span class="text-[#c586c0]">await</span> <span class="text-[#dcdcaa]">fetch</span>(<span class="text-[#ce9178]">'https://api.pictify.io/image'</span>, {
  <span class="text-[#9cdcfe]">method</span>: <span class="text-[#ce9178]">'POST'</span>,
  <span class="text-[#9cdcfe]">headers</span>: {
    <span class="text-[#ce9178]">'Content-Type'</span>: <span class="text-[#ce9178]">'application/json'</span>,
    <span class="text-[#ce9178]">'Authorization'</span>: <span class="text-[#ce9178]">'Bearer YOUR_API_KEY'</span>
  },
  <span class="text-[#9cdcfe]">body</span>: <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">stringify</span>({
    <span class="text-[#9cdcfe]">url</span>: <span class="text-[#ce9178]">'https://example.com'</span>,
    <span class="text-[#9cdcfe]">selector</span>: <span class="text-[#ce9178]">'#main-content'</span>,  <span class="text-[#6a9955]">// optional: capture specific element</span>
    <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">1200</span>,
    <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">630</span>
  })
});

<span class="text-[#c586c0]">const</span> { <span class="text-[#9cdcfe]">image</span> } = <span class="text-[#c586c0]">await</span> <span class="text-[#9cdcfe]">response</span>.<span class="text-[#dcdcaa]">json</span>();
<span class="text-[#9cdcfe]">console</span>.<span class="text-[#dcdcaa]">log</span>(<span class="text-[#9cdcfe]">image</span>.<span class="text-[#9cdcfe]">url</span>); <span class="text-[#6a9955]">// https://cdn.pictify.io/img/abc123.png</span>`
		},
		{
			id: 'python',
			label: 'Python',
			fileName: 'screenshot.py',
			code: `<span class="text-[#c586c0]">import</span> <span class="text-[#9cdcfe]">requests</span>

<span class="text-[#6a9955]"># Capture any URL as an image</span>
<span class="text-[#9cdcfe]">response</span> = <span class="text-[#9cdcfe]">requests</span>.<span class="text-[#dcdcaa]">post</span>(
    <span class="text-[#ce9178]">"https://api.pictify.io/image"</span>,
    <span class="text-[#9cdcfe]">headers</span>={<span class="text-[#ce9178]">"Authorization"</span>: <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>},
    <span class="text-[#9cdcfe]">json</span>={
        <span class="text-[#ce9178]">"url"</span>: <span class="text-[#ce9178]">"https://example.com"</span>,
        <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">1200</span>,
        <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">630</span>
    }
)

<span class="text-[#9cdcfe]">image_url</span> = <span class="text-[#9cdcfe]">response</span>.<span class="text-[#dcdcaa]">json</span>()[<span class="text-[#ce9178]">"url"</span>]
<span class="text-[#dcdcaa]">print</span>(<span class="text-[#9cdcfe]">image_url</span>)`
		},
		{
			id: 'go',
			label: 'Go',
			fileName: 'main.go',
			code: `<span class="text-[#c586c0]">package</span> <span class="text-[#9cdcfe]">main</span>

<span class="text-[#c586c0]">import</span> (<span class="text-[#ce9178]">"bytes"</span>; <span class="text-[#ce9178]">"encoding/json"</span>; <span class="text-[#ce9178]">"net/http"</span>)

<span class="text-[#c586c0]">func</span> <span class="text-[#dcdcaa]">main</span>() {
    <span class="text-[#9cdcfe]">body</span>, _ := <span class="text-[#9cdcfe]">json</span>.<span class="text-[#dcdcaa]">Marshal</span>(<span class="text-[#c586c0]">map</span>[<span class="text-[#c586c0]">string</span>]<span class="text-[#c586c0]">any</span>{
        <span class="text-[#ce9178]">"url"</span>:    <span class="text-[#ce9178]">"https://example.com"</span>,
        <span class="text-[#ce9178]">"width"</span>:  <span class="text-[#b5cea8]">1200</span>,
        <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">630</span>,
    })
    <span class="text-[#9cdcfe]">req</span>, _ := <span class="text-[#9cdcfe]">http</span>.<span class="text-[#dcdcaa]">NewRequest</span>(<span class="text-[#ce9178]">"POST"</span>, <span class="text-[#ce9178]">"https://api.pictify.io/image"</span>, <span class="text-[#9cdcfe]">bytes</span>.<span class="text-[#dcdcaa]">NewBuffer</span>(<span class="text-[#9cdcfe]">body</span>))
    <span class="text-[#9cdcfe]">req</span>.<span class="text-[#9cdcfe]">Header</span>.<span class="text-[#dcdcaa]">Set</span>(<span class="text-[#ce9178]">"Authorization"</span>, <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>)
    <span class="text-[#9cdcfe]">http</span>.<span class="text-[#9cdcfe]">DefaultClient</span>.<span class="text-[#dcdcaa]">Do</span>(<span class="text-[#9cdcfe]">req</span>)
}`
		},
		{
			id: 'ruby',
			label: 'Ruby',
			fileName: 'screenshot.rb',
			code: `<span class="text-[#c586c0]">require</span> <span class="text-[#ce9178]">"net/http"</span>
<span class="text-[#c586c0]">require</span> <span class="text-[#ce9178]">"json"</span>

<span class="text-[#9cdcfe]">uri</span> = <span class="text-[#9cdcfe]">URI</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>)
<span class="text-[#9cdcfe]">req</span> = <span class="text-[#9cdcfe]">Net</span>::<span class="text-[#9cdcfe]">HTTP</span>::<span class="text-[#9cdcfe]">Post</span>.<span class="text-[#dcdcaa]">new</span>(<span class="text-[#9cdcfe]">uri</span>)
<span class="text-[#9cdcfe]">req</span>[<span class="text-[#ce9178]">"Authorization"</span>] = <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>
<span class="text-[#9cdcfe]">req</span>.<span class="text-[#9cdcfe]">body</span> = { <span class="text-[#9cdcfe]">url</span>: <span class="text-[#ce9178]">"https://example.com"</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">1200</span>, <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">630</span> }.<span class="text-[#dcdcaa]">to_json</span>

<span class="text-[#9cdcfe]">res</span> = <span class="text-[#9cdcfe]">Net</span>::<span class="text-[#9cdcfe]">HTTP</span>.<span class="text-[#dcdcaa]">start</span>(<span class="text-[#9cdcfe]">uri</span>.<span class="text-[#9cdcfe]">hostname</span>, <span class="text-[#9cdcfe]">uri</span>.<span class="text-[#9cdcfe]">port</span>, <span class="text-[#9cdcfe]">use_ssl</span>: <span class="text-[#569cd6]">true</span>) { |<span class="text-[#9cdcfe]">http</span>| <span class="text-[#9cdcfe]">http</span>.<span class="text-[#dcdcaa]">request</span>(<span class="text-[#9cdcfe]">req</span>) }
<span class="text-[#dcdcaa]">puts</span> <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">parse</span>(<span class="text-[#9cdcfe]">res</span>.<span class="text-[#9cdcfe]">body</span>)[<span class="text-[#ce9178]">"url"</span>]`
		},
		{
			id: 'php',
			label: 'PHP',
			fileName: 'screenshot.php',
			code: `<span class="text-[#569cd6]">&lt;?php</span>
<span class="text-[#9cdcfe]">$ch</span> = <span class="text-[#dcdcaa]">curl_init</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>);
<span class="text-[#dcdcaa]">curl_setopt_array</span>(<span class="text-[#9cdcfe]">$ch</span>, [
    <span class="text-[#9cdcfe]">CURLOPT_POST</span> =&gt; <span class="text-[#569cd6]">true</span>,
    <span class="text-[#9cdcfe]">CURLOPT_RETURNTRANSFER</span> =&gt; <span class="text-[#569cd6]">true</span>,
    <span class="text-[#9cdcfe]">CURLOPT_HTTPHEADER</span> =&gt; [<span class="text-[#ce9178]">"Content-Type: application/json"</span>, <span class="text-[#ce9178]">"Authorization: Bearer YOUR_API_KEY"</span>],
    <span class="text-[#9cdcfe]">CURLOPT_POSTFIELDS</span> =&gt; <span class="text-[#dcdcaa]">json_encode</span>([<span class="text-[#ce9178]">"url"</span> =&gt; <span class="text-[#ce9178]">"https://example.com"</span>, <span class="text-[#ce9178]">"width"</span> =&gt; <span class="text-[#b5cea8]">1200</span>, <span class="text-[#ce9178]">"height"</span> =&gt; <span class="text-[#b5cea8]">630</span>])
]);
<span class="text-[#dcdcaa]">echo</span> <span class="text-[#dcdcaa]">json_decode</span>(<span class="text-[#dcdcaa]">curl_exec</span>(<span class="text-[#9cdcfe]">$ch</span>), <span class="text-[#569cd6]">true</span>)[<span class="text-[#ce9178]">"url"</span>];`
		}
	];

	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify.io URL to Image Generator',
		url: 'https://pictify.io/tools/url-to-image-generator',
		description:
			'Convert any URL to an image with our free URL to Image Generator. Perfect for creating thumbnails, social media previews, and more.',
		applicationCategory: ['DesignApplication', 'Utility'],
		operatingSystem: 'Web',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD',
			availability: 'https://schema.org/InStock'
		}
	};
	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'What is URL to Image?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'A tool that captures a webpage and saves it as an image file (JPG/PNG). Useful for archives, thumbnails, and proofs.'
				}
			},
			{
				'@type': 'Question',
				name: 'How does URL to Image work?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'We spawn a headless browser in the cloud, navigate to your URL, wait for assets to load, and take a high-fidelity screenshot.'
				}
			},
			{
				'@type': 'Question',
				name: 'Can I customize the screenshot?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Yes! You can select specific elements, set custom viewport sizes, and handle cookie banners via our API.'
				}
			},
			{
				'@type': 'Question',
				name: 'Is my data private?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'We do not store your URLs or generated images. All processing is done on-the-fly and images are cached temporarily on our CDN for performance.'
				}
			}
		]
	};
	let iframeElement;
	let isIframeReady = false;

	let urlError = '';

	/**
	 * Normalize user input into a fetchable page URL: trim, prepend https://
	 * when no scheme was typed (so bare "stripe.com" works), and require an
	 * http(s) URL with a dotted hostname. `new URL()` alone is wrong in both
	 * directions: it throws on "stripe.com" yet happily parses "foo:bar",
	 * "mailto:x", and "localhost:3000", none of which the backend can capture.
	 * Returns the normalized href, or null when the input can't become one.
	 */
	function normalizeUrl(raw) {
		const trimmed = (raw || '').trim();
		if (!trimmed) return null;
		const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)
			? trimmed
			: `https://${trimmed}`;
		try {
			const parsed = new URL(withScheme);
			if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
			if (!parsed.hostname.includes('.')) return null;
			// Rejects credential-bearing URLs, including "mailto:x@y.com" which
			// otherwise parses as user "mailto", password "x", host "y.com".
			if (parsed.username || parsed.password) return null;
			return parsed.href;
		} catch {
			return null;
		}
	}

	async function loadPreview() {
		const normalized = normalizeUrl(url);
		if (!normalized) {
			urlError =
				'That does not look like a web address. Try something like stripe.com. Only public http(s) pages can be captured.';
			analytics.trackError({
				error_type: 'invalid_url',
				error_message: 'url input rejected by validation',
				context: 'load_preview',
				page: '/tools/url-to-image-generator'
			});
			return;
		}
		urlError = '';
		// Reflect the normalized URL back into the field so what we fetch,
		// what the user sees, and what the API snippet advertises all match.
		url = normalized;
		isPreviewLoaded = false;
		hasAutoCaptured = false;
		isLoading = true;
		analytics.track('preview_load_attempted', { tool_name: 'url_to_image_generator' });
		try {
			const response = await getWebsiteHTML(url);
			const html = response?.content;
			if (!html) {
				analytics.track('preview_load_failed', {
					tool_name: 'url_to_image_generator',
					reason: 'no_content',
					status: null
				});
				toast.set({
					message: 'No content returned. Check the URL and try again.',
					type: 'error',
					duration: 3000
				});
				return;
			}

			// Remove previous message listener to prevent leak
			if (messageHandler) {
				window.removeEventListener('message', messageHandler);
			}
			messageHandler = (event) => {
				if (event.data.type === 'elementHover') {
					// Visual feedback handled in iframe
				} else if (event.data.type === 'elementSelected') {
					selector = event.data.selector;
					toast.set({ message: 'Element selected', type: 'success', duration: 1500 });
				} else if (event.data.type === 'iframeReady') {
					sendSelectionScript();
				}
			};
			window.addEventListener('message', messageHandler, false);

			const injectedScript = `
    <script>
      window.addEventListener('message', (event) => {
        if (event.data.type === 'checkReady') {
          window.parent.postMessage({ type: 'iframeReady' }, '*');
        } else if (event.data.type === 'injectScript') {
          const script = document.createElement('script');
          script.textContent = event.data.script;
          document.body.appendChild(script);
        }
      }, false);
    <\/script>
  `;

			// Relative asset URLs in the fetched markup would otherwise resolve
			// against pictify.io and 404, leaving a blank white preview. Point the
			// document base at the target site, and strip any CSP meta tag that
			// came along (it would block the injected selection bridge).
			let modifiedHTML = html.replace(
				/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi,
				''
			);
			// Full document URL, not just the origin: document-relative assets on
			// nested pages (style.css, ../images/logo.png) must resolve against
			// the fetched page's path, exactly as they would on the real site.
			const baseTag = `<base href="${new URL(url).href}">`;
			modifiedHTML = /<head[^>]*>/i.test(modifiedHTML)
				? modifiedHTML.replace(/<head[^>]*>/i, (match) => `${match}${baseTag}`)
				: baseTag + modifiedHTML;
			// SPA shells and minified pages may lack a literal </body>; append then.
			modifiedHTML = modifiedHTML.includes('</body>')
				? modifiedHTML.replace('</body>', `${injectedScript}</body>`)
				: modifiedHTML + injectedScript;
			const iframe = iframeWrapper.querySelector('iframe');
			if (iframe) {
				// Wait for iframe load instead of hardcoded 1s delay
				const loadPromise = new Promise((resolve) => {
					const onLoad = () => {
						iframe.removeEventListener('load', onLoad);
						resolve('loaded');
					};
					iframe.addEventListener('load', onLoad);
				});
				const timeoutPromise = new Promise((resolve) =>
					setTimeout(() => resolve('timeout'), 10000)
				);
				iframe.srcdoc = modifiedHTML;
				const loadResult = await Promise.race([loadPromise, timeoutPromise]);
				iframe.contentWindow.postMessage({ type: 'checkReady' }, '*');
				// Capture renders server-side from the URL, so a struggling client
				// preview must not block it (the fetch itself succeeded) — but a
				// timeout is no longer silent.
				isPreviewLoaded = true;
				if (loadResult === 'timeout') {
					analytics.track('preview_load_failed', {
						tool_name: 'url_to_image_generator',
						reason: 'iframe_timeout',
						status: null
					});
					toast.set({
						message:
							'Preview is slow to render. Capture still works: we fetch the page on our servers.',
						type: 'warning',
						duration: 5000
					});
				} else {
					analytics.track('preview_load_succeeded', { tool_name: 'url_to_image_generator' });
				}
			}
		} catch (error) {
			// Branch on the HttpError status backend.js already provides instead of
			// string-matching the message: a quota 429, a site blocking our fetcher,
			// and a renderer 5xx are not "check the URL" problems, and telling the
			// user they are sends them into hopeless retry loops.
			const status = error?.status ?? null;
			const code = error?.data?.code ?? null;
			const msg = error?.message || '';
			let message;
			if (status === 429) {
				// maybeHandleQuota already opened the upgrade modal for
				// quota_exceeded; only plain rate limits need a message here.
				message =
					code === 'quota_exceeded' ? '' : 'Too many requests. Please wait a moment and try again.';
			} else if (status >= 500) {
				message = 'Our renderer is struggling right now. Please retry in a moment.';
			} else if (status >= 400) {
				message = 'That site blocked our request. Try a different page, or capture it via the API.';
			} else if (msg.includes('timeout') || msg.includes('TIMEOUT')) {
				message = 'Page took too long to load. Try a simpler URL.';
			} else {
				message = 'Could not fetch this page. Check the URL and try again.';
			}
			if (message) {
				toast.set({ message, type: 'error', duration: 5000 });
			}
			analytics.track('preview_load_failed', {
				tool_name: 'url_to_image_generator',
				reason: status ? 'http_error' : 'fetch_error',
				status,
				code
			});
		} finally {
			isLoading = false;
		}
	}

	function handleIframeLoad() {
		isPreviewLoaded = true;
		isIframeReady = true;

		// Bring the now-enabled Capture control into view — only after a user-initiated load
		// (never on the prefill experiment's silent auto-load).
		if (userInitiatedLoad) {
			tick().then(() => {
				try {
					document
						.getElementById('capture-button')
						?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				} catch {
					/* no-op */
				}
			});
		}

		// One automatic capture after a user-initiated preview load, with a settle delay, never
		// on prefill, and reserving guest quota so we don't burn the last one.
		if (
			userInitiatedLoad &&
			!hasAutoCaptured &&
			!isImageGenerating &&
			(isUserLoggedIn || generationLimits.getRemaining() > 1)
		) {
			hasAutoCaptured = true;
			autoCaptureAfterSettle();
		}

		userInitiatedLoad = false;
	}

	function sendSelectionScript() {
		const script = `
      let highlightElementPictify = null;

      function generateSelector(element) {
        if (element.id) {
          return '#' + element.id;
        } else if (element.className) {
          return '.' + element.className.split(' ').join('.');
        } else {
          let selector = element.tagName.toLowerCase();
          let parent = element.parentNode;
          while (parent && parent.tagName) {
            if (parent.id) {
              return '#' + parent.id + ' > ' + selector;
            }
            const siblings = parent.children;
            let index = Array.from(siblings).indexOf(element) + 1;
            selector = parent.tagName.toLowerCase() + ' > ' + selector + ':nth-child(' + index + ')';
            element = parent;
            parent = parent.parentNode;
          }
          return selector;
        }
      }

      function highlightElementPictifyFunc(element) {
        if (highlightElementPictify) {
          highlightElementPictify.style.outline = '';
        }
        element.style.outline = '2px solid red';
        highlightElementPictify = element;
      }

      document.body.addEventListener('mouseover', (e) => {
        highlightElementPictifyFunc(e.target);
        const selector = generateSelector(e.target);
        window.parent.postMessage({ type: 'elementHover', selector: selector }, '*');
      });

      document.body.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const selector = generateSelector(e.target);
        window.parent.postMessage({ type: 'elementSelected', selector: selector }, '*');
      });

      document.body.style.pointerEvents = 'auto';
      document.body.style.userSelect = 'none';

      // Make the body scrollable
      document.body.style.overflow = 'auto';
      document.body.style.height = '100%';
    `;

		iframeElement.contentWindow.postMessage({ type: 'injectScript', script: script }, '*');
	}

	async function generateImage() {
		if (!isPreviewLoaded) {
			toast.set({ message: 'Please load a preview first', type: 'warning', duration: 3000 });
			return;
		}

		if (!isUserLoggedIn && !generationLimits.isWithinLimit()) {
			toast.set({
				message: 'Daily limit reached. Sign up for unlimited access.',
				type: 'warning',
				duration: 5000
			});
			return;
		}

		generationLimits.increment();
		isImageGenerating = true;

		try {
			const { image } = await createImagePublic({
				url,
				selector,
				width: captureWidth,
				height: captureHeight,
				fileExtension: fileFormat,
				watermark: !isUserLoggedIn
			});
			imageUrl = image.url;

			saveLastRender({
				tool: 'url_to_image_generator',
				url,
				width: captureWidth,
				height: captureHeight,
				format: fileFormat,
				imageUrl: image.url
			});

			analytics.trackImageGenerated({
				tool_name: 'url_to_image_generator',
				format: fileFormat,
				with_watermark: !isUserLoggedIn
			});

			// Trigger the sticky-bar arm of tool-signup-cta-v2 after generation
			if (!isUserLoggedIn && stickyBar && ctaVariant === 'sticky-bar') {
				stickyBar.triggerAfterGeneration();
			}
		} catch (error) {
			const status = error?.status || error?.response?.status;
			if (status === 429) {
				toast.set({
					message: 'Rate limit reached. Wait a moment and try again.',
					type: 'warning',
					duration: 5000
				});
			} else if (status === 408 || error?.message?.includes('timeout')) {
				toast.set({
					message: 'Screenshot timed out. Try smaller dimensions or a simpler page.',
					type: 'error',
					duration: 5000
				});
			} else {
				toast.set({
					message: 'Screenshot failed. Please try again.',
					type: 'error',
					duration: 4000
				});
			}
		}
		isImageGenerating = false;
	}

	function copyToClipboard(text, contentType = 'image_url') {
		navigator.clipboard.writeText(text).then(() => {
			analytics.trackCopy({
				content_type: contentType,
				context: 'tool_result',
				tool_name: 'url_to_image_generator'
			});
			toast.set({ message: 'Copied to clipboard!', type: 'success', duration: 1500 });
		});
	}

	function clearSelector() {
		selector = '';
		toast.set({ message: 'Selector cleared', type: 'success', duration: 1500 });
	}

	const TOOL_NAME = 'url_to_image_generator';
	const TOOL_PATH = '/tools/url-to-image-generator';

	$: guestRemaining = Math.max(0, GUEST_DAILY_LIMIT - ($generationLimits?.count || 0));

	/**
	 * The visible accordion only. The FAQPage schema below asks the same things
	 * in longer words ("How does URL to Image work?" against "How does it
	 * work?"), and both are frozen for search, so they stay two lists until a
	 * copy pass reconciles them.
	 */
	const FAQS = [
		{
			q: 'What is URL to Image?',
			a: 'A tool that captures a webpage and saves it as an image file (JPG/PNG). Useful for archives, thumbnails, and proofs.'
		},
		{
			q: 'How does it work?',
			a: 'We spawn a headless browser in the cloud, navigate to your URL, wait for assets to load, and take a high-fidelity screenshot.'
		},
		{
			q: 'Can I customize it?',
			a: 'Yes! You can select specific elements, set custom viewport sizes, and handle cookie banners via our API.'
		},
		{
			q: 'Privacy?',
			a: 'We do not store your URLs or generated images. All processing is done on-the-fly and images are cached temporarily on our CDN for performance.'
		}
	];

</script>

<ToolSeoHead
	title="URL to Image: Capture Any Webpage as PNG/JPG Free | Pictify"
	description="Enter any URL and get a high-quality screenshot as PNG, JPG, or WebP. Choose device size, crop elements, and download instantly. Free with API access."
	keywords="url to image, image url generator, url to picture converter, photo url generator, picture url maker, link to picture, image link generator, screenshot api, webpage to image"
	canonical="https://pictify.io/tools/url-to-image-generator"
	robots="index, follow, max-image-preview:large"
	ogTitle="URL to Image: Capture Any Webpage as PNG/JPG Free | Pictify"
	ogDescription="Enter any URL and get a high-quality screenshot. Choose device size, crop elements, download as PNG/JPG/WebP. Free with API access."
	ogSiteName="Pictify"
	ogImage="https://media.pictify.io/vombm-1775406853373.png"
	twitterTitle="URL to Image: Capture Any Webpage as PNG/JPG Free | Pictify"
	twitterDescription="Enter any URL and get a high-quality screenshot. Choose device size, crop elements, download as PNG/JPG/WebP. Free with API access."
	twitterImage="https://media.pictify.io/vombm-1775406853373.png"
	twitterUrl="https://pictify.io/tools/url-to-image-generator"
	webApplicationSchema={structuredData}
	extraSchemas={[faqSchema]}
	breadcrumbLabel="URL to Image"
/>

<ToolPageShell
	toolName={TOOL_NAME}
	toolPath={TOOL_PATH}
	breadcrumb="URL TO IMAGE"
	facts="FREE · 5 RENDERS A DAY · NO SIGNUP · ANY PUBLIC URL"
	loggedIn={isUserLoggedIn}
	hasResult={!!imageUrl}
	longform="column"
>
	<HeroTitle slot="h1">
		<span>URL TO</span>
		<span>IMAGE</span>
	</HeroTitle>

	<HeroSub slot="hero-sub">
		Convert any webpage URL into a high-quality <span class="font-medium">screenshot</span>
		instantly.
		<span class="text-brand-slate">Perfect for archiving, thumbnails, and social previews</span>
	</HeroSub>

	<div slot="tool">
		<ToolCard>
			<!-- Two-pane split like the html-to-image editor, adapted for a screenshot
			     tool: controls on the left, live preview on the right. -->
			<div class="flex w-full flex-col lg:h-[520px] lg:flex-row">
				<!-- Controls pane -->
				<div class="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto bg-brand-paper p-5 lg:p-6">
					<div class="flex flex-col gap-2">
						<span class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">TARGET URL</span>
						<div class="flex gap-2">
							<input
								bind:value={url}
								on:input={handleFirstInput}
								type="url"
								inputmode="url"
								autocomplete="url"
								spellcheck="false"
								aria-invalid={urlError ? 'true' : undefined}
								class="h-11 min-w-0 flex-1 rounded-lg border-[1.5px] border-brand-ink bg-white px-3 font-mono text-sm text-brand-ink placeholder-brand-mute focus:outline-none focus:ring-2 focus:ring-brand-royal"
								placeholder="https://example.com"
							/>
							<button
								on:click={handleLoadPreviewClick}
								disabled={isLoading || !url}
								class="h-11 flex-shrink-0 rounded-lg border-[1.5px] border-brand-ink bg-brand-paper px-4 font-sans text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-field disabled:opacity-50"
							>
								{#if isLoading}Loading…{:else}Load preview{/if}
							</button>
						</div>
						{#if urlError}
							<p class="text-sm font-medium text-brand-alarm" role="alert">{urlError}</p>
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<span class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">DEVICE</span>
						<div class="flex flex-wrap gap-1.5">
							{#each devicePresets as preset}
								<button
									on:click={() => selectPreset(preset)}
									class="rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-[0.04em] transition-colors {activePreset ===
									preset.id
										? 'border-brand-ink bg-brand-ink text-white'
										: 'border-brand-rule bg-brand-paper text-brand-ink hover:bg-brand-subtle'}"
								>
									{preset.label.toUpperCase()}
								</button>
							{/each}
						</div>
					</div>

					<div class="flex flex-wrap gap-x-8 gap-y-4">
						<div class="flex flex-col gap-2">
							<span class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">SIZE (PX)</span>
							<div class="flex items-center gap-1.5">
								<input
									type="number"
									bind:value={captureWidth}
									on:input={handleDimensionInput}
									min="1"
									max="4000"
									class="h-9 w-20 rounded border-[1.5px] border-brand-ink bg-white px-2 text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-royal"
								/>
								<span class="font-mono text-sm text-brand-mute">×</span>
								<input
									type="number"
									bind:value={captureHeight}
									on:input={handleDimensionInput}
									min="1"
									max="4000"
									class="h-9 w-20 rounded border-[1.5px] border-brand-ink bg-white px-2 text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-royal"
								/>
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<span class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">FORMAT</span>
							<div class="flex items-center gap-1.5">
								{#each ['png', 'jpg', 'webp'] as fmt}
									<button
										on:click={() => (fileFormat = fmt)}
										class="rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-[0.04em] transition-colors {fileFormat ===
										fmt
											? 'border-brand-ink bg-brand-ink text-white'
											: 'border-brand-rule bg-brand-paper text-brand-ink hover:bg-brand-subtle'}"
										>{fmt.toUpperCase()}</button
									>
								{/each}
							</div>
						</div>
					</div>

					<div class="flex flex-col gap-2">
						<span class="font-mono text-[11px] tracking-[0.06em] text-brand-mute"
							>ELEMENT SELECTOR (OPTIONAL)</span
						>
						<div class="flex items-center gap-2">
							<input
								bind:value={selector}
								type="text"
								class="h-9 min-w-0 flex-1 rounded border-[1.5px] border-brand-ink bg-white px-3 font-mono text-sm placeholder-brand-mute focus:outline-none focus:ring-2 focus:ring-brand-royal"
								placeholder="Click an element in the preview, or type a CSS selector"
							/>
							{#if selector}
								<button
									on:click={clearSelector}
									class="h-9 flex-shrink-0 rounded border-[1.5px] border-brand-ink bg-brand-paper px-3 font-mono text-[11px] text-brand-ink hover:bg-brand-subtle"
									title="Clear selector">CLEAR</button
								>
							{/if}
						</div>
					</div>

					<p class="mt-auto font-sans text-xs leading-[18px] text-brand-mute">
						The preview may be blocked by some sites' CORS rules — capture always runs server-side
						and works regardless.
					</p>
				</div>

				<!-- Preview pane -->
				<div
					class="flex min-h-[320px] flex-1 flex-col gap-2 border-t-[1.5px] border-brand-ink bg-brand-subtle p-4 lg:min-h-0 lg:border-l-[1.5px] lg:border-t-0"
				>
					<div class="flex items-center justify-between">
						<span class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">LIVE PREVIEW</span
						>
						<span class="font-mono text-[11px] tracking-[0.06em] text-brand-mute"
							>{captureWidth} × {captureHeight}</span
						>
					</div>
					<div
						bind:this={iframeWrapper}
						class="relative flex-1 cursor-crosshair overflow-hidden border-[1.5px] border-brand-ink bg-white shadow-[4px_4px_0_0_#000]"
					>
						{#if isLoading}
							<div
								class="absolute inset-0 z-10 flex items-center justify-center bg-brand-subtle/75"
							>
								<div class="loader" />
							</div>
						{/if}
						{#if !isPreviewLoaded && !isLoading}
							<div class="absolute inset-0 flex items-center justify-center px-6 text-center">
								<span class="font-sans text-sm text-brand-mute"
									>Enter a URL and press Load preview to see it here.</span
								>
							</div>
						{/if}
						<iframe
							bind:this={iframeElement}
							on:load={handleIframeLoad}
							title="URL Preview"
							width="100%"
							height="100%"
							frameborder="0"
							sandbox="allow-scripts"
							class="h-full w-full"
						/>
					</div>
				</div>
			</div>

			<svelte:fragment slot="toolbar-left">
				<span class="font-mono text-xs tracking-[0.06em] text-brand-mute">
					ANY URL → SCREENSHOT
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
					label="Capture Screenshot"
					loading={isImageGenerating}
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
				formatLabel={fileFormat.toUpperCase()}
				fileExtension={fileFormat}
				width={captureWidth}
				height={captureHeight}
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
		description="Convert any URL to an image programmatically. Generate screenshots for link previews, monitoring, and archives from your own code."
		codeExamples={urlToImageExamples}
	/>

	<svelte:fragment slot="longform">
		<LongformSection index="01" id="what-you-can-build" first title="What You Can Build">
			<!-- These six carried h3s before; titleTag keeps them. -->
			<FeatureGrid
				columns={3}
				titleTag="h3"
				items={[
					{
						title: 'Link Preview Images',
						body: 'Auto-generate thumbnail images from any URL for link previews, bookmarks, and content cards.'
					},
					{
						title: 'Visual QA Monitoring',
						body: 'Schedule periodic screenshots of your pages to catch visual regressions before users do.'
					},
					{
						title: 'Photo URL Generator',
						body: 'Turn any webpage into a hosted image URL. Share as a picture link on social media or embed in emails.'
					},
					{
						title: 'OG Image Fallbacks',
						body: "Generate Open Graph images on-the-fly for pages that don't have custom social previews."
					},
					{
						title: 'Web Archiving',
						body: 'Capture and store visual snapshots of competitor pages, legal evidence, or content for compliance.'
					},
					{
						title: 'Image Link Converter',
						body: 'Convert any URL to a picture URL that can be embedded anywhere: Notion, Confluence, Slack, or email.'
					}
				]}
			/>
		</LongformSection>

		<LongformSection index="02" id="faq" title="FAQ">
			<FaqList faqs={FAQS} />
		</LongformSection>

		<LongformPair>
			<LongformSection index="03" id="why-use" compact title="Why Use This Tool?">
				<CheckList
					items={[
						'Instant Archiving of web pages',
						'Generate OG Images for social media',
						'Visual monitoring for QA teams'
					]}
				/>
			</LongformSection>

			<LongformSection index="04" id="pro-tips" compact title="Pro Tips">
				<CheckList
					items={[
						'01. Ensure the URL is publicly accessible.',
						'02. Use the selector to remove ads/navbars.',
						'03. Check mobile viewports for responsive sites.'
					]}
				/>
			</LongformSection>

			<LongformSection index="05" id="comparisons" compact span title="Comparing Screenshot APIs?">
				<Lead>
					This tool is API-backed. See how it stacks up against the other screenshot/rendering APIs
					developers usually compare it to.
				</Lead>
				<RelatedLinks
					inline
					toolName={TOOL_NAME}
					eyebrow="COMPARISONS"
					links={[
						{ href: '/alternatives/screenshotone', label: 'vs ScreenshotOne' },
						{ href: '/alternatives/screenshotapi', label: 'vs ScreenshotAPI' },
						{ href: '/alternatives/screenshot-machine', label: 'vs Screenshot Machine' },
						{ href: '/alternatives/apiflash', label: 'vs APIFlash' },
						{
							href: '/blogs/html-to-image-the-complete-developer-guide-2026',
							label: 'HTML to Image API developer guide'
						}
					]}
				/>
			</LongformSection>
		</LongformPair>
	</svelte:fragment>
</ToolPageShell>
