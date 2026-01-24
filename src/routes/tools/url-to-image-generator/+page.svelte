<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import ApiPromptSection from '$lib/components/tools/ApiPromptSection.svelte';
  import NextSteps from '$lib/components/tools/NextSteps.svelte';
  import ExitIntentPopup from '$lib/components/tools/ExitIntentPopup.svelte';
  import GenerationLimitBanner from '$lib/components/tools/GenerationLimitBanner.svelte';
  import { onMount } from 'svelte';
  import { toast } from '../../../store/toast.store';
  import { user } from '../../../store/user.store';
  import { generationLimits } from '../../../store/generationLimits.store';
  import { getWebsiteHTML } from '../../../api/tools/url-to-image.js';
  import { createImagePublic } from '../../../api/image.js';
  import { analytics } from '$lib/analytics.js';

  // Track tool opened on mount
  onMount(() => {
    analytics.trackToolOpened({ tool_name: 'url_to_image_generator' });
  });

  // User login state
  let isUserLoggedIn = false;
  user.subscribe(userData => {
    isUserLoggedIn = !!userData?.email;
  });

let url = '';
let selector = '';
let overlayElement;
let imageUrl = '';
let isImageGenerating = false;
let isPreviewLoaded = false;
let iframeWrapper;
let isLoading = false;
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
const apiFeatureBullets = [
	"Capture full-page or element-level screenshots across thousands of URLs",
	"Schedule batch crawls and deliver CDN-hosted images instantly",
	"Manage API usage, tokens, and webhooks directly from the dashboard"
];
const apiSnippet = `curl -X POST https://api.pictify.io/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "url": "https://example.com",
    "selector": "#main-content",
    "width": 1600,
    "height": 900
  }'`;

  let iframeElement;
  let isIframeReady = false;

  function buildCurlSnippetFromUrl(urlValue, selectorValue) {
    const payload = {
      url: String(urlValue || 'https://example.com'),
      selector: String(selectorValue || ''),
      width: 1200,
      height: 630
    };
    return `curl -X POST https://api.pictify.io/image \\\\\n  -H "Content-Type: application/json" \\\\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\\\n  -d '${JSON.stringify(payload, null, 2)}'`;
  }

  $: nextStepsCurlSnippet = buildCurlSnippetFromUrl(url, selector);
  $: nextStepsTemplateDraft = imageUrl ? {
    version: 1,
    name: 'Screenshot template',
    type: 'og-image',
    width: 1200,
    height: 630,
    backgroundImageUrl: imageUrl,
    source: 'url-to-image'
  } : null;


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
      const {content: html} = await getWebsiteHTML(url);
      if(!html) {
        toast.set({ message: 'Error fetching website content', type: 'error', duration: 3000 });
        return;
      }

      window.addEventListener('message', (event) => {
      if (event.data.type === 'elementHover') {
        console.log('elementHover', event.data.selector);
        // Update UI to show hovered selector (optional)
      } else if (event.data.type === 'elementSelected') {
        selector = event.data.selector;
        toast.set({ message: 'Selector updated', type: 'success', duration: 1500 });
      } else if (event.data.type === 'iframeReady') {
        console.log('iframeReady');
        // The iframe is ready, send the selection script
        sendSelectionScript();
      }
    }, false);

      const injectedScript = `
    <script>
      window.addEventListener('message', (event) => {
        console.log('message', event.data);
        if (event.data.type === 'checkReady') {
        console.log('checkReady');
          window.parent.postMessage({ type: 'iframeReady' }, '*');
        } else if (event.data.type === 'injectScript') {
          console.log('injectScript');
          const script = document.createElement('script');
          script.textContent = event.data.script;
          document.body.appendChild(script);
        }
      }, false);
    <\/script>
  `;

  // Inject the script into the HTML
  const modifiedHTML = html.replace('</body>', `${injectedScript}</body>`);
      const iframeElement = iframeWrapper.querySelector('iframe');
      if (iframeElement) {
        iframeElement.srcdoc = modifiedHTML;
        await new Promise(resolve => setTimeout(resolve, 1000));
        iframeElement.contentWindow.postMessage({ type: 'checkReady' }, '*');
      }
    } catch (error) {
      toast.set({ message: 'Error fetching website content', type: 'error', duration: 3000 });
    } finally {
      isLoading = false;
    }
  }

  function handleIframeLoad() {
    isPreviewLoaded = true;
    isIframeReady = true;
  }


  function sendSelectionScript() {
    console.log('sendSelectionScript');
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

    // Track generation in global limits store
    generationLimits.increment();
    isImageGenerating = true;

    try {
      // Note: URL screenshots capture external pages, so watermark is added server-side
      // for non-authenticated requests via the public API
      const { image } = await createImagePublic({
        url: url,
        selector: selector,
        width: 1200,
        height: 630,
        watermark: !isUserLoggedIn // Request watermark for guests
      });
      imageUrl = image.url;

      // Track successful image generation
      analytics.trackImageGenerated({
        tool_name: 'url_to_image_generator',
        format: 'jpg',
        with_watermark: !isUserLoggedIn
      });
    } catch (error) {
      toast.set({ message: 'Error generating image', type: 'error', duration: 3000 });
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
      window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${encodeURIComponent('URL to Image Generator')}&summary=${text}`, '_blank');
    }
  }

  function clearSelector() {
    selector = '';
    toast.set({ message: 'Selector cleared', type: 'success', duration: 1500 });
  }
</script>

<svelte:head>
  <title>URL to Image Generator | Pictify.io</title>
  <meta name="description" content="Convert any URL to an image with our free URL to Image Generator. Perfect for creating thumbnails, social media previews, and more.">
  <meta name="keywords" content="URL to Image Generator, image generator, URL to image, web to image, screenshot, social media image, thumbnail, web preview">
  <link rel="canonical" href="https://pictify.io/tools/url-to-image-generator">
  <meta property="og:title" content="URL to Image Generator | Pictify.io">
  <meta property="og:description" content="Convert any URL to an image with our free URL to Image Generator. Perfect for creating thumbnails, social media previews, and more.">
  <meta property="og:image" content="https://media.pictify.io/r49i0-1725792197198.png">
  <meta property="og:url" content="https://pictify.io/tools/url-to-image-generator">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@pictify_io">
  <meta name="twitter:title" content="URL to Image Generator | Pictify.io">
  <meta name="twitter:description" content="Convert any URL to an image with our free URL to Image Generator. Perfect for creating thumbnails, social media previews, and more.">
  <meta name="twitter:image" content="https://media.pictify.io/r49i0-1725792197198.png">
  <script type="application/ld+json">
    {JSON.stringify(structuredData)}
  </script>
</svelte:head>

<div class="min-h-screen bg-[#FFFDF8] relative overflow-hidden font-sans text-gray-900 selection:bg-[#ff6b6b] selection:text-white">
  <!-- Background Pattern -->
  <div class="fixed inset-0 pointer-events-none opacity-[0.03]" style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 24px 24px;"></div>

  <Nav />

  <main class="z-10 w-full py-16 md:px-0 px-6 flex flex-col items-center justify-center space-y-8 max-w-7xl mx-auto relative cursor-crosshair">
    
    <!-- Hero Section -->
    <div class="relative flex flex-col items-center justify-center text-center mb-8 sm:mb-12 lg:mb-16 pt-4 sm:pt-10">

        <!-- Badge -->
        <div class="inline-flex transform -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-default mb-4 sm:mb-8">
            <div class="px-4 sm:px-6 py-1.5 sm:py-2 bg-[#ffc480] border-[3px] sm:border-[4px] border-black text-black font-black text-xs sm:text-sm md:text-base uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                ★ Free Tool
            </div>
        </div>

        <!-- Main Title -->
        <h1 class="relative z-10 text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-tight mb-4 sm:mb-8">
            <span class="block sm:inline">URL TO</span>
            <span class="relative inline-block text-white mt-1 sm:mt-2 md:mt-0 md:ml-3">
                <span class="relative z-10 px-2 sm:px-3 md:px-4">IMAGE</span>
                <span class="absolute inset-0 bg-[#ff6b6b] transform -skew-x-3 border-[3px] sm:border-[4px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] -z-0"></span>
            </span>
        </h1>

        <!-- Description -->
        <div class="max-w-2xl mx-auto px-2">
            <p class="text-base sm:text-lg md:text-xl text-gray-800 font-bold leading-relaxed border-[3px] border-black bg-white p-4 sm:p-6 shadow-[4px_4px_0_0_#e5e7eb] sm:shadow-[8px_8px_0_0_#e5e7eb]">
                Convert any webpage URL into a high-quality <span class="bg-[#ffc480] px-1 border-b-[2px] sm:border-b-[3px] border-black">image</span> instantly.
                <span class="text-gray-500 text-sm sm:text-base mt-2 sm:mt-3 block font-semibold">Perfect for archiving, thumbnails, and social previews</span>
            </p>
        </div>
    </div>

    <!-- Generation Limit Banner -->
    <GenerationLimitBanner />

  <div class="w-full max-w-5xl mx-auto mb-16 relative px-2 md:px-0 z-20">
      <!-- Control Board -->
      <div class="bg-white border-[3px] border-black shadow-[8px_8px_0_0_#000] relative">
          <!-- Header/Window Bar -->
          <div class="bg-black text-white px-4 py-2 flex justify-between items-center border-b-[3px] border-black">
              <div class="flex gap-2">
                  <div class="w-3 h-3 rounded-full bg-[#ff6b6b] border border-white"></div>
                  <div class="w-3 h-3 rounded-full bg-[#ffc480] border border-white"></div>
                  <div class="w-3 h-3 rounded-full bg-[#4ade80] border border-white"></div>
              </div>
              <div class="font-mono font-bold tracking-widest text-sm uppercase">SYSTEM_INPUT_TERMINAL</div>
              <div class="w-16 flex justify-end">
                  <div class="space-y-1">
                      <div class="w-4 h-0.5 bg-white"></div>
                      <div class="w-4 h-0.5 bg-white"></div>
                  </div>
              </div>
          </div>

          <!-- Content -->
          <div class="p-6 md:p-8 bg-white" style="background-image: radial-gradient(#e5e7eb 1px, transparent 1px); background-size: 10px 10px;">
              <div class="w-full flex flex-col gap-6 md:flex-row items-stretch">
                  <div class="flex-grow group relative">
                      <div class="absolute -top-3 left-4 bg-black text-white px-2 py-0.5 text-xs font-bold uppercase tracking-wider">Target URL</div>
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
                          class="w-full h-full px-8 py-4 bg-[#ffc480] text-black border-[3px] border-black text-xl font-black uppercase tracking-wide shadow-[4px_4px_0_0_#000] hover:bg-[#ffb050] hover:shadow-[6px_6px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                      >
                          Initialize
                      </button>
                  </div>
              </div>

               <!-- Add this disclaimer after the input and button -->
                <div class="mt-6 text-xs md:text-sm font-bold text-black bg-[#fff] border-[2px] border-black p-4 shadow-[4px_4px_0_0_#ccc] flex items-start gap-3">
                    <span class="text-xl">⚠️</span>
                    <p>DISCLAIMER: Due to CORS and security policies, live previews may be restricted for some domains. The capture engine operates server-side and will bypass these limitations.</p>
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
      class="border-[4px] border-black bg-white p-2 shadow-[12px_12px_0_0_#000] relative" style="height: 600px;">
        {#if isLoading}
          <div class="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
            <div class="loader"></div>
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
        ></iframe>
      </div>
      <!-- Element Selector Bar -->
      <div class="bg-gray-100 border-[3px] border-t-0 border-black p-4 flex flex-col md:flex-row gap-4 items-center">
          <div class="flex-grow w-full">
              <span class="block font-black uppercase text-xs mb-1 tracking-wider">Element Selector (Optional)</span>
              <div class="flex">
                 <div class="bg-black text-white px-3 py-2 font-mono text-sm flex items-center justify-center border-y-[3px] border-l-[3px] border-black">
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
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 6l12 12M18 6L6 18" />
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
                      <svg class="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Rendering...
                  {:else}
                      <span>Generate Image</span>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  {/if}
              </button>
          </div>
      </div>
    </div>

    {#if imageUrl}
    <div class="mt-16 w-full max-w-5xl mx-auto px-2 md:px-0 z-20">
         <!-- Success Window -->
         <div class="border-[4px] border-black bg-[#4ade80] shadow-[12px_12px_0_0_#000]">
             <!-- Header -->
             <div class="bg-black text-white px-4 py-2 flex justify-between items-center">
                 <div class="font-mono font-bold uppercase tracking-widest">STATUS: 200 OK</div>
                 <!-- Decorative Close Button -->
                 <div class="w-6 h-6 bg-white flex items-center justify-center border-2 border-transparent hover:border-black cursor-pointer">
                    <span class="text-black font-black leading-none pb-0.5">×</span>
                 </div>
             </div>
             <!-- Content -->
             <div class="p-6 md:p-8 bg-white border-t-[3px] border-black">
                 <h3 class="text-4xl font-black uppercase mb-6 text-center tracking-tighter">Capture Complete!</h3>
                 
                 <!-- URL & Copy -->
                 <div class="flex flex-col md:flex-row gap-4 mb-8">
                      <div class="flex-grow bg-gray-100 border-[3px] border-black p-3 font-mono text-xs md:text-sm break-all flex items-center">
                          {imageUrl}
                      </div>
                      <button 
                        on:click={() => copyToClipboard(imageUrl)}
                        class="bg-black text-white px-6 py-3 font-bold uppercase border-[3px] border-black hover:bg-white hover:text-black transition-colors flex-shrink-0"
                      >
                          Copy URL
                      </button>
                 </div>

                 <!-- Preview -->
                 <div class="border-[3px] border-black bg-[#f3f4f6] p-4 shadow-[8px_8px_0_0_#ccc] mb-8 relative">
                     <div class="absolute top-2 left-2 w-2 h-2 bg-black rounded-full"></div>
                     <div class="absolute top-2 right-2 w-2 h-2 bg-black rounded-full"></div>
                     <div class="absolute bottom-2 left-2 w-2 h-2 bg-black rounded-full"></div>
                     <div class="absolute bottom-2 right-2 w-2 h-2 bg-black rounded-full"></div>
                     <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                        <img src={imageUrl} alt="Generated Screenshot" class="w-full h-auto border-[2px] border-black hover:opacity-95 transition-opacity" />
                     </a>
                 </div>

                 <!-- Actions -->
                 <div class="flex flex-col md:flex-row gap-4 justify-center">
                     <a href={imageUrl} download="screenshot.jpg" class="px-8 py-4 bg-[#ff6b6b] text-white border-[3px] border-black font-black uppercase tracking-wider shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] transition-all text-center">
                         Download Image
                     </a>
                     <a href="/signup?redirect=/dashboard/api-token" class="px-8 py-4 bg-white text-black border-[3px] border-black font-black uppercase tracking-wider shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] transition-all text-center">
                         Get free API key
                     </a>
                 </div>

                 <NextSteps
                   heading="Next steps"
                   description="Copy the API request, turn this capture into a reusable template, and batch render variants."
                   curlSnippet={nextStepsCurlSnippet}
                   templateDraft={nextStepsTemplateDraft}
                   generatedUrl={imageUrl}
                   toolName="URL to Image"
                 />
             </div>
         </div>
    </div>
    {/if}

    <div class="w-full max-w-5xl mx-auto px-2 md:px-0 mt-20 mb-20">
      <section>
            <ApiPromptSection
            title="Automate URL screenshots with our API"
            description="Trigger screenshot captures from scripts, CRON jobs, or workflows and receive CDN-hosted images in seconds."
            featurePoints={apiFeatureBullets}
            codeSnippet={apiSnippet}
            codeLanguage="bash"
            docsUrl="https://docs.pictify.io/"
            docsLabel="Read URL to Image docs"
            secondaryCtaUrl="https://docs.pictify.io/examples"
            secondaryCtaLabel="See examples"
            note="Need JS execution, authentication, or regional rendering? Contact us for advanced plans."
          />
      </section>
    </div>


  <!-- Separator -->
  <div class="w-full max-w-5xl mx-auto px-2 md:px-0 my-20">
    <div class="border-t-[4px] border-black relative">
      <div class="absolute left-1/2 -top-5 -translate-x-1/2 bg-[#FFFDF8] px-4">
        <div class="w-10 h-10 bg-black text-white flex items-center justify-center border-[3px] border-black rotate-45 transform hover:rotate-90 transition-transform duration-500">
             <div class="-rotate-45">✦</div>
        </div>
      </div>
    </div>
  </div>

  <!-- FAQ Section -->
  <section class="w-full max-w-5xl mx-auto px-2 md:px-0 mb-16">
    <div class="border-[3px] border-black p-6 md:p-8 bg-white shadow-[8px_8px_0_0_#9ca3af]">
    <h2 class="text-3xl font-black mb-8 text-black uppercase">FAQ</h2>
    <div class="space-y-4 w-full">
      <details class="group">
        <summary class="flex items-center justify-between cursor-pointer bg-white p-4 border-[3px] border-black transition-all hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
          <span class="font-black text-lg text-gray-900 uppercase">What is URL to Image?</span>
          <span class="border-[2px] border-black p-1 bg-black text-white group-open:bg-white group-open:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
          </span>
        </summary>
        <div class="mt-0 p-4 border-l-[3px] border-r-[3px] border-b-[3px] border-black bg-gray-50 text-black font-medium">
          A tool that captures a webpage and saves it as an image file (JPG/PNG). Useful for archives, thumbnails, and proofs.
        </div>
      </details>
      <details class="group">
        <summary class="flex items-center justify-between cursor-pointer bg-white p-4 border-[3px] border-black transition-all hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
          <span class="font-black text-lg text-gray-900 uppercase">How does it work?</span>
          <span class="border-[2px] border-black p-1 bg-black text-white group-open:bg-white group-open:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
          </span>
        </summary>
        <div class="mt-0 p-4 border-l-[3px] border-r-[3px] border-b-[3px] border-black bg-gray-50 text-black font-medium">
          We spawn a headless browser in the cloud, navigate to your URL, wait for assets to load, and take a high-fidelity screenshot.
        </div>
      </details>
      <details class="group">
        <summary class="flex items-center justify-between cursor-pointer bg-white p-4 border-[3px] border-black transition-all hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
          <span class="font-black text-lg text-gray-900 uppercase">Can I customize it?</span>
          <span class="border-[2px] border-black p-1 bg-black text-white group-open:bg-white group-open:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
          </span>
        </summary>
        <div class="mt-0 p-4 border-l-[3px] border-r-[3px] border-b-[3px] border-black bg-gray-50 text-black font-medium">
          Yes! You can select specific elements, set custom viewport sizes, and handle cookie banners via our API.
        </div>
      </details>
      <details class="group">
        <summary class="flex items-center justify-between cursor-pointer bg-white p-4 border-[3px] border-black transition-all hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
          <span class="font-black text-lg text-gray-900 uppercase">Privacy?</span>
          <span class="border-[2px] border-black p-1 bg-black text-white group-open:bg-white group-open:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
          </span>
        </summary>
        <div class="mt-0 p-4 border-l-[3px] border-r-[3px] border-b-[3px] border-black bg-gray-50 text-black font-medium">
          We do not store your URLs or generated images. All processing is done on-the-fly and images are cached temporarily on our CDN for performance.
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
            <div class="bg-black text-white p-1 mt-1"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"/></svg></div>
            <span class="font-bold text-lg">Instant Archiving of web pages</span>
        </li>
        <li class="flex gap-4 items-start">
            <div class="bg-black text-white p-1 mt-1"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"/></svg></div>
            <span class="font-bold text-lg">Generate OG Images for social media</span>
        </li>
        <li class="flex gap-4 items-start">
            <div class="bg-black text-white p-1 mt-1"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"/></svg></div>
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
      <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
      Share on Twitter
    </button>
    <button
      class="flex items-center justify-center px-8 py-4 bg-[#0A66C2] text-white font-black uppercase tracking-wide border-[3px] border-black hover:bg-white hover:text-[#0A66C2] transition-all shadow-[4px_4px_0_0_#000]"
      on:click={() => sharePage('linkedin')}
    >
      <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.065 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      Share on LinkedIn
    </button>
    </div>
  </div>

  <Toast />
  <Footer />
  </main>

  <!-- Exit Intent Popup for lead capture -->
  <ExitIntentPopup toolName="URL to Image" generatedImageUrl={imageUrl} />
</div>

<style>
  @keyframes loading {
    0% { width: 0%; }
    100% { width: 100%; }
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
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
