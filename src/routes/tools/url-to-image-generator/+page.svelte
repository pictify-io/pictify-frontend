<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import ApiPromptSection from '$lib/components/tools/ApiPromptSection.svelte';
  import { onMount } from 'svelte';
  import { toast } from '../../../store/toast.store';
  import { getWebsiteHTML } from '../../../api/tools/url-to-image.js';
  import { createImagePublic } from '../../../api/image.js';

  let url = '';
  let selector = '';
  let overlayElement;
  let imageUrl = '';
  let isImageGenerating = false;
  let isPreviewLoaded = false;
  let iframeWrapper;
  let isLoading = false;
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
      toast.set({ message: 'Please enter a valid URL', duration: 3000 });
      return;
    }
    isPreviewLoaded = false;
    isLoading = true;
    try {
      const {content: html} = await getWebsiteHTML(url);
      if(!html) {
        toast.set({ message: 'Error fetching website content', duration: 3000 });
        return;
      }

      window.addEventListener('message', (event) => {
      if (event.data.type === 'elementHover') {
        console.log('elementHover', event.data.selector);
        // Update UI to show hovered selector (optional)
      } else if (event.data.type === 'elementSelected') {
        selector = event.data.selector;
        toast.set({ message: 'Selector updated', duration: 1500 });
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
      toast.set({ message: 'Error fetching website content', duration: 3000 });
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
      toast.set({ message: 'Please load a preview first', duration: 3000 });
      return;
    }

    isImageGenerating = true;
    try {
      const { image } = await createImagePublic({
        url: url,
        selector: selector,
        width: 1200,
        height: 630
      });
      imageUrl = image.url;
    } catch (error) {
      toast.set({ message: 'Error generating image', duration: 3000 });
    }
    isImageGenerating = false;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast.set({ message: 'Copied to clipboard!', duration: 1500 });
    });
  }

  function sharePage(platform) {
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
    toast.set({ message: 'Selector cleared', duration: 1500 });
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
  {
    "@context": "http://schema.org",
    "@type": "WebApplication",
    "name": "Pictify.io URL to Image Generator",
    "url": "https://pictify.io/tools/url-to-image-generator",
    "description": "Convert any URL to an image with our free URL to Image Generator. Perfect for creating thumbnails, social media previews, and more.",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  </script>
</svelte:head>

<section>
  <Nav />
  <main class="z-10 w-full py-5 md:px-0 px-6 flex flex-col items-center justify-center space-y-8 max-w-4xl mx-auto">
    <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter w-full inline-block text-left md:text-center">
      URL to Image Generator
    </h1>
    <h2 class="max-w-3xl opacity-90 md:text-center text-xl">
      Convert webpage to an image with our easy-to-use URL to Image Generator.
    </h2>
  </main>

  <div class="px-6 md:px-0 mt-20 w-full max-w-4xl m-auto">
    <div class="w-full flex flex-col gap-4 md:flex-row">
      <div class="flex-grow">
        <input
          bind:value={url}
          type="text"
          class="w-full border-[3px] border-gray-900 placeholder-gray-600 text-lg font-medium focus:outline-none py-3.5 px-6 rounded"
          placeholder="Enter a URL"
        />
      </div>
      <div>
        <button
          on:click={loadPreview}
          class="w-full px-6 text-gray-900 bg-[#ffc480] border-[3px] border-gray-900 text-lg font-medium py-3.5 rounded md:mt-0"
        >
          Load Preview
        </button>
      </div>
    </div>

    <!-- Add this disclaimer after the input and button -->
    <div class="mt-4 text-sm text-gray-600 bg-yellow-100 border border-yellow-400 p-3 rounded">
      <strong>Disclaimer:</strong> Due to security restrictions, previews may not be available for all websites. However, the image generation process will still work for most URLs.
    </div>

    <div class="mt-8">
      <h3 class="text-2xl font-bold mb-4">Preview</h3>
      <div 
      bind:this={iframeWrapper}
      class="border-2 border-gray-300 p-2 rounded overflow-hidden" style="height: 600px; position: relative;">
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
    </div>

    <div class="mt-8">
      <h3 class="text-2xl font-bold mb-4">Selector</h3>
      <div class="flex items-center gap-2">
        <input
          bind:value={selector}
          type="text"
          class="w-full border-[3px] border-gray-900 placeholder-gray-600 text-lg font-medium focus:outline-none py-3.5 px-6 rounded"
          placeholder="Click on an element in the preview to select it"
        />
        <button
          on:click={clearSelector}
          class="px-4 py-3.5 bg-gray-200 text-gray-700 border-[3px] border-gray-900 text-lg font-medium rounded hover:bg-gray-300 transition-colors duration-300"
        >
          Clear
        </button>
      </div>
    </div>

    <div class="mt-8">
      <button
        on:click={generateImage}
        disabled={!url || !iframeElement}
        class="w-full bg-green-500 text-white text-lg font-medium py-3.5 rounded hover:bg-green-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Generate Image
      </button>
    </div>


    {#if isImageGenerating}
      <div class="mt-8">
        <div class="w-full text-gray-900 text-lg font-medium py-3.5 rounded bg-gray-100 shadow-md">
          <p class="text-center mb-2">Generating Image...</p>
          <div class="w-11/12 mx-auto bg-gray-200 rounded-full h-3">
            <div class="bg-gray-900 h-3 rounded-full loading-bar"></div>
          </div>
        </div>
      </div>
    {/if}

    {#if imageUrl}
      <div class="mt-8 p-6 bg-white rounded-lg shadow-lg m-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold">Generated Image</h3>
          <button
            on:click={() => copyToClipboard(imageUrl)}
            class="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors duration-300"
          >
            Copy URL
          </button>
        </div>
        <div class="mb-4 break-all">
          <a href={imageUrl} download="generated-image.jpg" class="text-black hover:underline">
            {imageUrl}
          </a>
        </div>
        <img src={imageUrl} alt="Generated Image" class="w-full max-w-3xl mt-4 m-auto h-auto rounded-lg shadow-md" />
      </div>
    {/if}

    <ApiPromptSection
    title="Automate URL screenshots with our API"
    description="Trigger screenshot captures from scripts, CRON jobs, or workflows and receive CDN-hosted images in seconds."
    featurePoints={apiFeatureBullets}
    codeSnippet={apiSnippet}
    codeLanguage="bash"
    docsUrl="https://docs.pictify.io/"
    docsLabel="Read URL to Image docs"
    secondaryCtaUrl="/dashboard/api-playground"
    secondaryCtaLabel="Run sample request"
    note="Need JS execution, authentication, or regional rendering? Contact us for advanced plans."
  />
  </div>


  <!-- Separator -->
  <div class="max-w-4xl mx-auto px-6 md:px-0 my-20">
    <div class="border-t-4 border-gray-900 relative">
      <div class="absolute left-1/2 -top-4 -translate-x-1/2 bg-white px-4">
        <svg class="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
        </svg>
      </div>
    </div>
  </div>

  <section class="max-w-4xl mx-auto px-6 md:px-0 mb-16">
    <h3 class="text-3xl font-bold mb-6">Frequently Asked Questions</h3>
    <div class="space-y-4">
      <details class="bg-gray-100 p-4 rounded-lg">
        <summary class="font-semibold cursor-pointer">What is a URL to Image converter?</summary>
        <p class="mt-2">A URL to Image converter is a tool that takes a web page URL as input and generates an image of that web page. It's useful for creating screenshots, thumbnails, or visual representations of websites without manually capturing them.</p>
      </details>
      <details class="bg-gray-100 p-4 rounded-lg">
        <summary class="font-semibold cursor-pointer">How does the URL to Image generator work?</summary>
        <p class="mt-2">Our URL to Image generator works by rendering the web page associated with the provided URL in a virtual browser environment. It then captures a screenshot of the rendered page and converts it into an image file that you can download or use in your projects.</p>
      </details>
      <details class="bg-gray-100 p-4 rounded-lg">
        <summary class="font-semibold cursor-pointer">What are the common uses for a URL to Image tool?</summary>
        <p class="mt-2">URL to Image tools are commonly used for creating thumbnails for web directories, generating social media preview images, archiving web pages visually, creating visual bookmarks, and automating screenshot capture for web testing or monitoring purposes.</p>
      </details>
      <details class="bg-gray-100 p-4 rounded-lg">
        <summary class="font-semibold cursor-pointer">Can I customize the image output?</summary>
        <p class="mt-2">Yes, our URL to Image generator allows you to customize various aspects of the output image. You can adjust the image dimensions, select specific elements on the page to capture, and even modify the delay before capture to ensure dynamic content is loaded.</p>
      </details>
    </div>
  </section>

  <div class="max-w-4xl mx-auto px-6 md:px-0 my-20">
    <div class="border-t-4 border-gray-900 relative">
      <div class="absolute left-1/2 -top-4 -translate-x-1/2 bg-white px-4">
        <svg class="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
        </svg>
      </div>
    </div>
  </div>

  <div class="max-w-4xl mx-auto px-6 md:px-0 mb-20">
    <h2 class="text-4xl font-bold mb-10 text-center">Learn More About URL to Image Conversion</h2>
    
    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">What is a URL to Image Generator?</h3>
      <p class="text-lg">
        A URL to Image Generator is a powerful tool that converts web pages into image files. It allows you to create visual representations of websites quickly and easily, without the need for manual screenshots or complex image editing software.
      </p>
    </section>

    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">Benefits of Using Our URL to Image Generator</h3>
      <ul class="list-disc list-inside text-lg">
        <li>Quickly create images from any web page URL</li>
        <li>Customize image dimensions and capture specific elements</li>
        <li>Generate thumbnails for web directories or visual bookmarks</li>
        <li>Create social media preview images automatically</li>
        <li>Archive web pages visually for future reference</li>
        <li>Automate screenshot capture for web testing and monitoring</li>
      </ul>
    </section>

    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">How to Use Our URL to Image Generator</h3>
      <ol class="list-decimal list-inside text-lg">
        <li>Enter the URL of the web page you want to convert</li>
        <li>Customize the image dimensions if needed</li>
        <li>Select specific elements to capture (optional)</li>
        <li>Adjust the capture delay for dynamic content (if necessary)</li>
        <li>Click the "Generate Image" button</li>
        <li>Download or copy the URL of the generated image</li>
      </ol>
    </section>

    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">Why URL to Image Conversion Matters</h3>
      <p class="text-lg">
        URL to Image conversion is essential for various web-related tasks. It enables easy creation of visual content for social media, improves user experience in web directories, aids in web archiving, and facilitates automated testing and monitoring of web applications. By using our URL to Image Generator, you can streamline these processes and save valuable time and resources.
      </p>
    </section>

    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">Best Practices for URL to Image Conversion</h3>
      <p class="text-lg mb-4">
        To get the most out of your URL to Image conversions, consider these best practices:
      </p>
      <ul class="list-disc list-inside text-lg">
        <li>Ensure the target web page is fully loaded before capture</li>
        <li>Adjust image dimensions to fit your specific use case</li>
        <li>Use selective capture for important elements when full-page images are too large</li>
        <li>Consider mobile and desktop versions of websites for comprehensive coverage</li>
        <li>Regularly update your image captures to keep content fresh</li>
        <li>Use appropriate file formats (e.g., JPEG for photographs, PNG for graphics)</li>
        <li>Optimize image file sizes for faster loading times</li>
        <li>Respect copyright and usage rights when capturing and using images</li>
      </ul>
      <p class="text-lg mt-4">
        By following these guidelines and using our URL to Image Generator, you can create high-quality, useful images from web pages for various applications and projects.
      </p>
    </section>
  </div>

  <div class="mt-8 mb-8 flex flex-col md:flex-row justify-center md:space-x-4">
    <button
      class="flex items-center justify-center px-6 py-3 bg-[#1DA1F2] text-white font-semibold rounded-full hover:bg-[#1a91da] transition duration-300 ease-in-out"
      on:click={() => sharePage('twitter')}
    >
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
      Share on Twitter
    </button>
    <button
      class="flex items-center justify-center px-6 py-3 mt-4 md:mt-0 bg-[#0A66C2] text-white font-semibold rounded-full hover:bg-[#094d92] transition duration-300 ease-in-out"
      on:click={() => sharePage('linkedin')}
    >
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      Share on LinkedIn
    </button>
  </div>

  <Toast />
  <Footer />
</section>

<style>
  @keyframes loading {
    0% { width: 0%; }
    100% { width: 100%; }
  }

  .loading-bar {
    width: 0%;
    animation: loading 3s forwards;
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
