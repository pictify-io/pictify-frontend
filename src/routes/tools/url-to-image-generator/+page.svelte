<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import ApiCodeSection from '$lib/components/tools/ApiCodeSection.svelte';
	import GenerationLimitBanner from '$lib/components/tools/GenerationLimitBanner.svelte';
	import StickySignupBar from '$lib/components/tools/StickySignupBar.svelte';
	import PostSignupWelcome from '$lib/components/tools/PostSignupWelcome.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { toast } from '../../../store/toast.store';
	import { user } from '../../../store/user.store';
	import { generationLimits } from '../../../store/generationLimits.store';
	import { getWebsiteHTML } from '../../../api/tools/url-to-image.js';
	import { createImagePublic } from '../../../api/image.js';
	import { analytics } from '$lib/analytics.js';
	import RelatedTools from '$lib/components/tools/RelatedTools.svelte';
	import posthog from 'posthog-js';

	// Experiment: post-generation signup CTA variant
	let stickyBar;

	function getCtaVariant() {
		if (!browser) return 'control';
		const flag = posthog.getFeatureFlag?.('tool-signup-cta-experiment');
		// In dev (PostHog not loaded), test with value-prop variant
		if (flag === undefined && !posthog.__loaded) return 'value-prop';
		return flag || 'control';
	}
	// Resolve lazily — by the time imageUrl is set, flags are loaded
	$: ctaVariant = imageUrl ? getCtaVariant() : 'control';

	// Track tool opened on mount
	onMount(() => {
		analytics.trackToolOpened({ tool_name: 'url_to_image_generator' });
	});

	function trackSignupClick(ctaLocation) {
		analytics.track('tool_signup_click', {
			tool_name: 'url_to_image_generator',
			cta_location: ctaLocation,
			experiment: 'tool-signup-cta-experiment',
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
		const payload = { url: urlVal || 'https://example.com', width: w, height: h, fileExtension: fmt };
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

	const isValidUrl = (url) => {
		try {
			new URL(url);
			return true;
		} catch (e) {
			return false;
		}
	};

	async function loadPreview() {
		if (!isValidUrl(url)) {
			toast.set({ message: 'Please enter a valid URL', type: 'error', duration: 3000 });
			return;
		}
		isPreviewLoaded = false;
		isLoading = true;
		try {
			const { content: html } = await getWebsiteHTML(url);
			if (!html) {
				toast.set({ message: 'No content returned. Check the URL and try again.', type: 'error', duration: 3000 });
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

			const modifiedHTML = html.replace('</body>', `${injectedScript}</body>`);
			const iframe = iframeWrapper.querySelector('iframe');
			if (iframe) {
				// Wait for iframe load instead of hardcoded 1s delay
				const loadPromise = new Promise((resolve) => {
					const onLoad = () => { iframe.removeEventListener('load', onLoad); resolve(); };
					iframe.addEventListener('load', onLoad);
				});
				const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 10000));
				iframe.srcdoc = modifiedHTML;
				await Promise.race([loadPromise, timeoutPromise]);
				iframe.contentWindow.postMessage({ type: 'checkReady' }, '*');
			}
		} catch (error) {
			const msg = error?.message || '';
			if (msg.includes('timeout') || msg.includes('TIMEOUT')) {
				toast.set({ message: 'Page took too long to load. Try a simpler URL.', type: 'error', duration: 5000 });
			} else {
				toast.set({ message: 'Could not fetch this page. Check the URL and try again.', type: 'error', duration: 4000 });
			}
		} finally {
			isLoading = false;
		}
	}

	function handleIframeLoad() {
		isPreviewLoaded = true;
		isIframeReady = true;
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
			toast.set({ message: 'Daily limit reached. Sign up for unlimited access.', type: 'warning', duration: 5000 });
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

			analytics.trackImageGenerated({
				tool_name: 'url_to_image_generator',
				format: fileFormat,
				with_watermark: !isUserLoggedIn
			});

			// Trigger sticky bar experiment after generation
			if (!isUserLoggedIn && stickyBar) {
				stickyBar.triggerAfterGeneration();
			}
		} catch (error) {
			const status = error?.status || error?.response?.status;
			if (status === 429) {
				toast.set({ message: 'Rate limit reached. Wait a moment and try again.', type: 'warning', duration: 5000 });
			} else if (status === 408 || error?.message?.includes('timeout')) {
				toast.set({ message: 'Screenshot timed out. Try smaller dimensions or a simpler page.', type: 'error', duration: 5000 });
			} else {
				toast.set({ message: 'Screenshot failed. Please try again.', type: 'error', duration: 4000 });
			}
		}
		isImageGenerating = false;
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'Copied to clipboard!', type: 'success', duration: 1500 });
		});
	}

	function sharePage(platform) {
		// Track social share
		analytics.trackSocialShare({
			platform: platform,
			content_type: 'tool_page',
			tool_name: 'url_to_image_generator'
		});

		const shareUrl = encodeURIComponent(window.location.href);
		const text = encodeURIComponent('Check out this awesome URL to Image Generator!');
		if (platform === 'twitter') {
			window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`, '_blank');
		} else if (platform === 'linkedin') {
			window.open(
				`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${encodeURIComponent(
					'URL to Image Generator'
				)}&summary=${text}`,
				'_blank'
			);
		}
	}

	function clearSelector() {
		selector = '';
		toast.set({ message: 'Selector cleared', type: 'success', duration: 1500 });
	}
</script>

<svelte:head>
	<title>URL to Image Generator | Pictify.io</title>
	<meta
		name="description"
		content="Free URL to image generator — convert any webpage to a picture. Generate image URLs, create link previews, and capture screenshots via API. No signup required."
	/>
	<meta
		name="keywords"
		content="url to image, image url generator, url to picture converter, photo url generator, picture url maker, link to picture, image link generator, screenshot api, webpage to image"
	/>
	<link rel="canonical" href="https://pictify.io/tools/url-to-image-generator" />
	<meta property="og:title" content="URL to Image Generator | Pictify.io" />
	<meta
		property="og:description"
		content="Convert any URL to an image with our free URL to Image Generator. Perfect for creating thumbnails, social media previews, and more."
	/>
	<meta property="og:image" content="https://media.pictify.io/vombm-1775406853373.png" />
	<meta property="og:url" content="https://pictify.io/tools/url-to-image-generator" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@pictify_io" />
	<meta name="twitter:title" content="URL to Image Generator | Pictify.io" />
	<meta
		name="twitter:description"
		content="Convert any URL to an image with our free URL to Image Generator. Perfect for creating thumbnails, social media previews, and more."
	/>
	<meta name="twitter:image" content="https://media.pictify.io/vombm-1775406853373.png" />
	{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pictify.io/' },
			{ '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://pictify.io/tools' },
			{ '@type': 'ListItem', position: 3, name: 'URL to Image' }
		]
	})}</script>`}
</svelte:head>

<div
	class="min-h-screen bg-[#FFFDF8] relative overflow-hidden font-sans text-gray-900 selection:bg-[#ff6b6b] selection:text-white"
>
	<!-- Background Pattern -->
	<div
		class="fixed inset-0 pointer-events-none opacity-[0.03]"
		style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 24px 24px;"
	/>

	<Nav />

	<main
		class="z-10 w-full py-16 md:px-0 px-6 flex flex-col items-center justify-center space-y-8 max-w-7xl mx-auto relative"
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
				<li class="text-gray-900">URL to Image</li>
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
					★ Free Tool
				</div>
			</div>

			<!-- Main Title -->
			<h1
				class="relative z-10 text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-tight mb-4 sm:mb-8"
			>
				<span class="block sm:inline">URL TO</span>
				<span class="relative inline-block text-white mt-1 sm:mt-2 md:mt-0 md:ml-3">
					<span class="relative z-10 px-2 sm:px-3 md:px-4">IMAGE</span>
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
					Convert any webpage URL into a high-quality <span
						class="bg-[#ffc480] px-1 border-b-[2px] sm:border-b-[3px] border-black">image</span
					>
					instantly.
					<span class="text-gray-500 text-sm sm:text-base mt-2 sm:mt-3 block font-semibold"
						>Perfect for archiving, thumbnails, and social previews</span
					>
				</p>
			</div>
		</div>

		<!-- Post-signup welcome with API key -->
		<PostSignupWelcome toolName="url_to_image_generator" />

		<!-- Generation Limit Banner -->
		<GenerationLimitBanner toolName="url_to_image_generator" />

		<div class="w-full max-w-5xl mx-auto mb-16 relative px-2 md:px-0 z-20">
			<!-- Control Board -->
			<div class="bg-white border-[3px] border-black shadow-[8px_8px_0_0_#000] relative">
				<!-- Header/Window Bar -->
				<div
					class="bg-black text-white px-4 py-2 flex justify-between items-center border-b-[3px] border-black"
				>
					<div class="flex gap-2">
						<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border border-white" />
						<div class="w-3 h-3 rounded-full bg-[#ffc480] border border-white" />
						<div class="w-3 h-3 rounded-full bg-[#4ade80] border border-white" />
					</div>
					<div class="font-mono font-bold tracking-widest text-sm uppercase">
						SYSTEM_INPUT_TERMINAL
					</div>
					<div class="w-16 flex justify-end">
						<div class="space-y-1">
							<div class="w-4 h-0.5 bg-white" />
							<div class="w-4 h-0.5 bg-white" />
						</div>
					</div>
				</div>

				<!-- Content -->
				<div
					class="p-6 md:p-8 bg-white"
					style="background-image: radial-gradient(#e5e7eb 1px, transparent 1px); background-size: 10px 10px;"
				>
					<div class="w-full flex flex-col gap-6 md:flex-row items-stretch">
						<div class="flex-grow group relative">
							<div
								class="absolute -top-3 left-4 bg-black text-white px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
							>
								Target URL
							</div>
							<input
								bind:value={url}
								type="text"
								class="w-full h-full border-[3px] border-black bg-white placeholder-gray-400 text-lg font-bold font-mono focus:outline-none focus:shadow-[4px_4px_0_0_#ff6b6b] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all px-6 py-4"
								placeholder="https://example.com"
							/>
						</div>
						<div class="md:w-auto w-full">
							<button
								on:click={loadPreview}
								disabled={isLoading || !url}
								class="w-full h-full px-8 py-4 bg-[#ffc480] text-black border-[3px] border-black text-xl font-black uppercase tracking-wide shadow-[4px_4px_0_0_#000] hover:bg-[#ffb050] hover:shadow-[6px_6px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
							>
								{#if isLoading}Loading...{:else}Load Preview{/if}
							</button>
						</div>
					</div>

					<!-- Capture Settings -->
					<div class="mt-6 border-t-[3px] border-black pt-6">
						<div class="flex items-center gap-2 mb-4">
							<div class="bg-black text-white px-2 py-0.5 text-xs font-bold uppercase tracking-wider">Capture Settings</div>
						</div>

						<div class="flex flex-col md:flex-row gap-6">
							<!-- Device Presets -->
							<div>
								<span class="block text-xs font-black uppercase tracking-wider mb-2 text-gray-500">Device</span>
								<div class="flex gap-2">
									{#each devicePresets as preset}
										<button
											on:click={() => selectPreset(preset)}
											class="px-3 py-2 border-[3px] border-black font-bold text-sm transition-all flex items-center gap-1.5
												{activePreset === preset.id
													? 'bg-black text-white shadow-none'
													: 'bg-white text-black shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]'}"
										>
											{#if preset.id === 'desktop'}
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
											{:else if preset.id === 'tablet'}
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
											{:else}
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
											{/if}
											{preset.label}
										</button>
									{/each}
								</div>
							</div>

							<!-- Custom Size -->
							<div>
								<span class="block text-xs font-black uppercase tracking-wider mb-2 text-gray-500">Size (px)</span>
								<div class="flex items-center gap-1">
									<input
										type="number"
										bind:value={captureWidth}
										on:input={handleDimensionInput}
										min="1"
										max="4000"
										class="w-20 border-[3px] border-black px-2 py-2 font-mono font-bold text-sm text-center focus:outline-none focus:border-[#ff6b6b]"
									/>
									<span class="font-black text-gray-400">×</span>
									<input
										type="number"
										bind:value={captureHeight}
										on:input={handleDimensionInput}
										min="1"
										max="4000"
										class="w-20 border-[3px] border-black px-2 py-2 font-mono font-bold text-sm text-center focus:outline-none focus:border-[#ff6b6b]"
									/>
								</div>
							</div>

							<!-- Format -->
							<div>
								<span class="block text-xs font-black uppercase tracking-wider mb-2 text-gray-500">Format</span>
								<div class="flex gap-0">
									{#each ['png', 'jpg', 'webp'] as fmt}
										<button
											on:click={() => (fileFormat = fmt)}
											class="px-4 py-2 border-[3px] border-black font-black text-sm uppercase transition-all -ml-[3px] first:ml-0
												{fileFormat === fmt
													? 'bg-black text-white z-10'
													: 'bg-white text-black hover:bg-gray-50'}"
										>
											{fmt}
										</button>
									{/each}
								</div>
							</div>
						</div>
					</div>

					<!-- CORS Disclaimer -->
					<div
						class="mt-6 text-xs md:text-sm font-bold text-black bg-[#fff] border-[2px] border-black p-4 shadow-[4px_4px_0_0_#ccc] flex items-start gap-3"
					>
						<span class="text-xl">⚠️</span>
						<p>
							Due to CORS policies, live previews may be restricted for some domains.
							The capture engine operates server-side and will bypass these limitations.
						</p>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-8 w-full max-w-5xl mx-auto">
			<h3 class="text-4xl font-black mb-6 uppercase text-center md:text-left drop-shadow-sm">
				<span class="bg-black text-white px-2 py-1 transform -rotate-1 inline-block">Visual</span>
				Confirmation
			</h3>
			<div
				bind:this={iframeWrapper}
				class="border-[4px] border-black bg-white p-2 shadow-[12px_12px_0_0_#000] relative cursor-crosshair mx-auto"
				style="height: 600px; transition: max-width 0.3s ease;"
			>
				{#if isLoading}
					<div class="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
						<div class="loader" />
					</div>
				{/if}
				<iframe
					bind:this={iframeElement}
					on:load={handleIframeLoad}
					title="URL Preview"
					width="100%"
					height="100%"
					scale="0.7"
					frameborder="0"
					sandbox="allow-scripts allow-same-origin"
				/>
			</div>
			<!-- Element Selector Bar -->
			<div
				class="bg-gray-100 border-[3px] border-t-0 border-black p-4 flex flex-col md:flex-row gap-4 items-center"
			>
				<div class="flex-grow w-full">
					<span class="block font-black uppercase text-xs mb-1 tracking-wider"
						>Element Selector (Optional)</span
					>
					<div class="flex">
						<div
							class="bg-black text-white px-3 py-2 font-mono text-sm flex items-center justify-center border-y-[3px] border-l-[3px] border-black"
						>
							&gt;_
						</div>
						<input
							bind:value={selector}
							type="text"
							class="w-full border-[3px] border-black placeholder-gray-500 text-sm font-mono focus:outline-none py-2 px-4"
							placeholder="Click element in preview or type selector..."
						/>
						<button
							on:click={clearSelector}
							class="bg-white border-y-[3px] border-r-[3px] border-black px-3 hover:bg-gray-200 transition-colors"
							title="Clear Selector"
						>
							<svg class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M6 6l12 12M18 6L6 18"
								/>
							</svg>
						</button>
					</div>
				</div>
				<div class="w-full md:w-auto flex-shrink-0 pt-5">
					<button
						on:click={generateImage}
						disabled={!url || !iframeElement || isImageGenerating}
						class="w-full md:w-auto px-8 py-3 bg-[#4ade80] text-black border-[3px] border-black font-black uppercase tracking-wide shadow-[4px_4px_0_0_#000] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none flex items-center justify-center gap-2"
					>
						{#if isImageGenerating}
							<svg
								class="animate-spin h-5 w-5 text-black"
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
							Rendering...
						{:else}
							<span>Capture {fileFormat.toUpperCase()}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M14 5l7 7m0 0l-7 7m7-7H3"
								/></svg
							>
						{/if}
					</button>
				</div>
			</div>
		</div>

		{#if imageUrl}
			<div class="max-w-4xl mx-auto px-4 mb-20 mt-16">
				<div
					class="bg-[#4ade80]/10 border-[3px] border-[#4ade80] rounded-3xl p-8 text-center relative overflow-hidden"
				>
					<div class="absolute top-0 right-0 w-32 h-32 bg-[#4ade80]/20 rounded-full blur-2xl" />

					<h3 class="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">
						Screenshot Captured!
					</h3>

					<div
						class="inline-block bg-white border-[3px] border-gray-900 p-2 shadow-[8px_8px_0_0_#1f2937] rotate-1 mb-8"
					>
						<a href={imageUrl} target="_blank" rel="noopener noreferrer">
							<img
								src={imageUrl}
								alt="Generated screenshot"
								class="max-w-full h-auto max-h-[400px]"
							/>
						</a>
					</div>

					<div class="flex flex-wrap justify-center gap-4">
						<a
							href={imageUrl}
							download="pictify-screenshot.{fileFormat}"
							class="px-6 py-3 bg-white text-gray-900 border-[3px] border-gray-900 font-bold uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl flex items-center gap-2"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg
							>
							Download {fileFormat.toUpperCase()}
						</a>
						<button
							on:click={() => copyToClipboard(imageUrl)}
							class="px-6 py-3 bg-gray-900 text-white border-[3px] border-gray-900 font-bold uppercase tracking-wide shadow-[4px_4px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl flex items-center gap-2"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg
							>
							Copy URL
						</button>
					</div>

					<!-- Experiment: Post-generation signup CTA -->
					{#if !isUserLoggedIn && ctaVariant === 'value-prop'}
						<div class="mt-8 border-[3px] border-black bg-[#ffc480]/20 p-6 flex flex-col items-center text-center gap-3">
							<p class="font-black text-gray-900 text-base uppercase tracking-wide">Like it? Automate it.</p>
							<p class="text-sm font-bold text-gray-600 max-w-md">Sign up to get your API key and capture unlimited screenshots programmatically — same quality, zero daily limits.</p>
							<a
								href="/signup?redirect=/tools/url-to-image-generator"
								on:click={() => trackSignupClick('post_generation_value_prop')}
								class="mt-1 px-6 py-3 bg-gray-900 text-white border-[3px] border-gray-900 font-black text-sm uppercase tracking-wide shadow-[4px_4px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								Get Your API Key — Free
							</a>
						</div>
					{:else if !isUserLoggedIn && ctaVariant === 'social-proof'}
						<div class="mt-8 border-[3px] border-black bg-[#4ade80]/10 p-6 flex flex-col items-center text-center gap-3">
							<div class="flex -space-x-2">
								{#each ['#ff6b6b', '#ffc480', '#4ade80', '#60a5fa'] as color}
									<div class="w-8 h-8 rounded-full border-[2px] border-white" style="background: {color};"></div>
								{/each}
							</div>
							<p class="font-black text-gray-900 text-base">10,000+ developers capture screenshots via API</p>
							<p class="text-sm font-bold text-gray-500 max-w-md">Sign up free to get unlimited captures, your own API key, and higher resolution output.</p>
							<a
								href="/signup?redirect=/tools/url-to-image-generator"
								on:click={() => trackSignupClick('post_generation_social_proof')}
								class="mt-1 px-6 py-3 bg-[#ff6b6b] text-white border-[3px] border-black font-black text-sm uppercase tracking-wide shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								Sign Up Free
							</a>
						</div>
					{/if}
				</div>

			</div>
		{/if}

		<!-- Live API Request Builder -->
		<section class="w-full max-w-5xl mx-auto px-2 md:px-0 mt-16 mb-8">
			<div class="border-[3px] border-black shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
				<div class="bg-black px-4 py-3 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<span class="text-xs font-black uppercase tracking-widest text-[#ffc480]">Your API Request</span>
						<span class="text-xs text-gray-500 font-mono">— updates as you change settings</span>
					</div>
					<button
						on:click={() => copyToClipboard(liveCurlSnippet)}
						class="px-3 py-1 bg-[#ffc480] text-black border-[2px] border-[#ffc480] font-black text-xs uppercase tracking-wider hover:bg-[#ffb050] transition-colors rounded"
					>
						Copy
					</button>
				</div>
				<div class="bg-[#1e1e1e]">
					<div class="bg-[#2d2d2d] px-4 py-2 border-b border-gray-800 flex items-center gap-2">
						<div class="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
						<div class="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
						<div class="w-3 h-3 rounded-full bg-[#27c93f]"></div>
						<span class="ml-auto text-xs text-gray-500 font-mono font-bold uppercase tracking-wider">BASH</span>
					</div>
					<div class="p-6 overflow-x-auto">
						<pre class="font-mono text-sm leading-relaxed text-gray-300">{@html highlightedCurl}</pre>
					</div>
				</div>
			</div>
		</section>

		<ApiCodeSection
			title="Automate with the"
			titleHighlight="API"
			toolName="url_to_image_generator"
			description="Convert any URL to an image programmatically. Generate screenshots, link previews, and image URLs in your CI/CD pipeline."
			codeExamples={urlToImageExamples}
		/>

		<!-- URL to Image Use Cases -->
		<section class="w-full max-w-5xl mx-auto px-2 md:px-0 mb-16">
			<h2 class="text-3xl font-black mb-8 text-black uppercase text-center">What You Can Build</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="border-[3px] border-black p-6 bg-white shadow-[4px_4px_0_0_#ffc480]">
					<h3 class="font-black text-lg mb-2">Link Preview Images</h3>
					<p class="text-gray-600 font-medium text-sm">Auto-generate thumbnail images from any URL for link previews, bookmarks, and content cards.</p>
				</div>
				<div class="border-[3px] border-black p-6 bg-white shadow-[4px_4px_0_0_#4ade80]">
					<h3 class="font-black text-lg mb-2">Visual QA Monitoring</h3>
					<p class="text-gray-600 font-medium text-sm">Schedule periodic screenshots of your pages to catch visual regressions before users do.</p>
				</div>
				<div class="border-[3px] border-black p-6 bg-white shadow-[4px_4px_0_0_#ff6b6b]">
					<h3 class="font-black text-lg mb-2">Photo URL Generator</h3>
					<p class="text-gray-600 font-medium text-sm">Turn any webpage into a hosted image URL. Share as a picture link on social media or embed in emails.</p>
				</div>
				<div class="border-[3px] border-black p-6 bg-white shadow-[4px_4px_0_0_#1f2937]">
					<h3 class="font-black text-lg mb-2">OG Image Fallbacks</h3>
					<p class="text-gray-600 font-medium text-sm">Generate Open Graph images on-the-fly for pages that don't have custom social previews.</p>
				</div>
				<div class="border-[3px] border-black p-6 bg-white shadow-[4px_4px_0_0_#ffc480]">
					<h3 class="font-black text-lg mb-2">Web Archiving</h3>
					<p class="text-gray-600 font-medium text-sm">Capture and store visual snapshots of competitor pages, legal evidence, or content for compliance.</p>
				</div>
				<div class="border-[3px] border-black p-6 bg-white shadow-[4px_4px_0_0_#4ade80]">
					<h3 class="font-black text-lg mb-2">Image Link Converter</h3>
					<p class="text-gray-600 font-medium text-sm">Convert any URL to a picture URL that can be embedded anywhere — Notion, Confluence, Slack, or email.</p>
				</div>
			</div>
		</section>

		<!-- FAQ Section -->
		<section class="w-full max-w-5xl mx-auto px-2 md:px-0 mb-16">
			<div class="border-[3px] border-black p-6 md:p-8 bg-white shadow-[8px_8px_0_0_#9ca3af]">
				<h2 class="text-3xl font-black mb-8 text-black uppercase">FAQ</h2>
				<div class="space-y-4 w-full">
					<details class="group">
						<summary
							class="flex items-center justify-between cursor-pointer bg-white p-4 border-[3px] border-black transition-all hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"
						>
							<span class="font-black text-lg text-gray-900 uppercase">What is URL to Image?</span>
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
							A tool that captures a webpage and saves it as an image file (JPG/PNG). Useful for
							archives, thumbnails, and proofs.
						</div>
					</details>
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
							We spawn a headless browser in the cloud, navigate to your URL, wait for assets to
							load, and take a high-fidelity screenshot.
						</div>
					</details>
					<details class="group">
						<summary
							class="flex items-center justify-between cursor-pointer bg-white p-4 border-[3px] border-black transition-all hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"
						>
							<span class="font-black text-lg text-gray-900 uppercase">Can I customize it?</span>
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
							Yes! You can select specific elements, set custom viewport sizes, and handle cookie
							banners via our API.
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
							We do not store your URLs or generated images. All processing is done on-the-fly and
							images are cached temporarily on our CDN for performance.
						</div>
					</details>
				</div>
			</div>
		</section>

		<!-- Content Grid -->
		<div class="w-full max-w-5xl mx-auto px-2 md:px-0 mb-20 grid grid-cols-1 md:grid-cols-2 gap-8">
			<!-- Learn More -->
			<section class="border-[3px] border-black p-6 md:p-8 bg-white shadow-[8px_8px_0_0_#000]">
				<h3 class="text-2xl font-black mb-6 uppercase">Why Use This Tool?</h3>
				<ul class="space-y-4">
					<li class="flex gap-4 items-start">
						<div class="bg-black text-white p-1 mt-1">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="4"
									d="M5 13l4 4L19 7"
								/></svg
							>
						</div>
						<span class="font-bold text-lg">Instant Archiving of web pages</span>
					</li>
					<li class="flex gap-4 items-start">
						<div class="bg-black text-white p-1 mt-1">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="4"
									d="M5 13l4 4L19 7"
								/></svg
							>
						</div>
						<span class="font-bold text-lg">Generate OG Images for social media</span>
					</li>
					<li class="flex gap-4 items-start">
						<div class="bg-black text-white p-1 mt-1">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="4"
									d="M5 13l4 4L19 7"
								/></svg
							>
						</div>
						<span class="font-bold text-lg">Visual monitoring for QA teams</span>
					</li>
				</ul>
			</section>

			<!-- Best Practices -->
			<section class="border-[3px] border-black p-6 md:p-8 bg-[#fffdf8] shadow-[8px_8px_0_0_#000]">
				<h3 class="text-2xl font-black mb-6 uppercase">Pro Tips</h3>
				<ul class="space-y-4">
					<li class="flex gap-4 items-start">
						<span class="font-black text-[#ff6b6b] text-xl">01.</span>
						<span class="font-bold text-lg">Ensure the URL is publicly accessible.</span>
					</li>
					<li class="flex gap-4 items-start">
						<span class="font-black text-[#ffc480] text-xl">02.</span>
						<span class="font-bold text-lg">Use the selector to remove ads/navbars.</span>
					</li>
					<li class="flex gap-4 items-start">
						<span class="font-black text-[#4ade80] text-xl">03.</span>
						<span class="font-bold text-lg">Check mobile viewports for responsive sites.</span>
					</li>
				</ul>
			</section>
		</div>

		<div class="mt-8 mb-20 w-full max-w-5xl mx-auto px-2 md:px-0 text-center">
			<p class="font-bold text-gray-500 uppercase tracking-widest mb-6">Spread the word</p>
			<div class="flex flex-col md:flex-row justify-center md:space-x-6">
				<button
					class="flex items-center justify-center px-8 py-4 bg-[#1DA1F2] text-white font-black uppercase tracking-wide border-[3px] border-black hover:bg-white hover:text-[#1DA1F2] transition-all shadow-[4px_4px_0_0_#000] mb-4 md:mb-0"
					on:click={() => sharePage('twitter')}
				>
					<svg
						class="w-5 h-5 mr-3"
						fill="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
						/>
					</svg>
					Share on Twitter
				</button>
				<button
					class="flex items-center justify-center px-8 py-4 bg-[#0A66C2] text-white font-black uppercase tracking-wide border-[3px] border-black hover:bg-white hover:text-[#0A66C2] transition-all shadow-[4px_4px_0_0_#000]"
					on:click={() => sharePage('linkedin')}
				>
					<svg
						class="w-5 h-5 mr-3"
						fill="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.065 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
						/>
					</svg>
					Share on LinkedIn
				</button>
			</div>
		</div>

		<RelatedTools tools={['html-email', 'blog-featured-image', 'og-image-generator', 'code-to-image', 'html-to-png']} />

		<Toast />
		<Footer />
	</main>

	<StickySignupBar bind:this={stickyBar} toolName="url_to_image_generator" />
</div>

<style>
	@keyframes loading {
		0% {
			width: 0%;
		}
		100% {
			width: 100%;
		}
	}

	.loader {
		border: 5px solid #f3f3f3;
		border-top: 5px solid #3498db;
		border-radius: 50%;
		width: 50px;
		height: 50px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
