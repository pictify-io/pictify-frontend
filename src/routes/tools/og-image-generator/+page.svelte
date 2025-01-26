<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import OgImageTemplate from '$lib/components/tools/OgImageTemplate.svelte';
  import {getTemplate, getWebsiteInfo} from '../../../api/tools/og-image';
  import { createImagePublic } from '../../../api/image.js';
  import { onMount } from 'svelte';
  import { toast } from '../../../store/toast.store';
  import ColorPicker from 'svelte-awesome-color-picker';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { user } from '../../../store/user.store';

  // Growth metrics
  let totalImagesGenerated = 45897; // Social proof counter

 

  // Add user store subscription
  let isUserLoggedIn = false;
  user.subscribe(userData => {
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
  {id:'Arial', name: 'Arial', className: 'arial'},
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

  let backgroundColorRgb = websiteInfo?.colors ? {r: websiteInfo.colors[0][0], g: websiteInfo.colors[0][1], b: websiteInfo.colors[0][2]} : {r: 255, g: 255, b: 255};
  let headingColorRgb = websiteInfo?.colors ? {r: websiteInfo.colors[1][0], g: websiteInfo.colors[1][1], b: websiteInfo.colors[1][2]} : {r: 0, g: 0, b: 0};
  let subHeadingColorRgb = websiteInfo?.colors ? {r: websiteInfo.colors[2][0], g: websiteInfo.colors[2][1], b: websiteInfo.colors[2][2]} : {r: 0, g: 0, b: 0};

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
    backgroundColorRgb = {r: websiteInfo.colors[0][0], g: websiteInfo.colors[0][1], b: websiteInfo.colors[0][2]};
    headingColorRgb = {r: websiteInfo.colors[1][0], g: websiteInfo.colors[1][1], b: websiteInfo.colors[1][2]};
    subHeadingColorRgb = {r: websiteInfo.colors[2][0], g: websiteInfo.colors[2][1], b: websiteInfo.colors[2][2]};
    
    while(!ogImageTemplateWrapper) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }

    const iframe = ogImageTemplateWrapper.querySelector('iframe');
    if (!iframe.contentWindow.document.body.innerHTML) {
      await new Promise((resolve) => {
        iframe.onload = resolve;
      });
    }
    
    await updateHTML(selectedTemplate);
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
    'template-19',
  ];

  // Modify websiteInfo to handle direct creation
  const createDirectOgImage = () => {
    websiteInfo = {
      heading: '',
      subHeading: '',
      logo: null,
      colors: [[255, 255, 255], [0, 0, 0], [0, 0, 0]] // Default colors
    };
    backgroundColorRgb = {r: 255, g: 255, b: 255};
    headingColorRgb = {r: 0, g: 0, b: 0};
    subHeadingColorRgb = {r: 0, g: 0, b: 0};
  };

  const selectTemplate = (template) => {
    // Store current content and colors if they exist
    const currentHeading = websiteInfo?.heading;
    const currentSubHeading = websiteInfo?.subHeading;
    const currentLogo = websiteInfo?.logo || null;

    selectedTemplate = template;
    
    // Parse template to get default text content
    const parser = new DOMParser();
    const doc = parser.parseFromString(typeof template === 'string' ? template : template.html, 'text/html');
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
              b: parseInt(hex.substring(4, 6), 16),
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
          backgroundColorRgb = {r: 255, g: 255, b: 255}; // Default white
        }
        if (cssVars['secondary-color']) {
          const rgb = extractRGB(cssVars['secondary-color']);
          if (rgb) headingColorRgb = rgb;
        } else {
          headingColorRgb = {r: 0, g: 0, b: 0}; // Default black
        }
        if (cssVars['tertiary-color']) {
          const rgb = extractRGB(cssVars['tertiary-color']);
          if (rgb) subHeadingColorRgb = rgb;
        } else {
          subHeadingColorRgb = {r: 0, g: 0, b: 0}; // Default black
        }
      }
    }

    // Update websiteInfo while preserving existing content
    websiteInfo = {
      heading: currentHeading || defaultHeading,
      subHeading: currentSubHeading || defaultSubHeading,
      logo: currentLogo,
      colors: [[backgroundColorRgb.r, backgroundColorRgb.g, backgroundColorRgb.b],
               [headingColorRgb.r, headingColorRgb.g, headingColorRgb.b],
               [subHeadingColorRgb.r, subHeadingColorRgb.g, subHeadingColorRgb.b]]
    };

    setTimeout(() => {
      updateHTML(template);
      ogImageTemplateWrapper?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Initialize editor with default template
  onMount(async () => {
    templates = await Promise.all(templateNames.map(async(name) => {
      const template = await getTemplate(name);
      return template;
    }));

    selectedTemplate = templates[0];
    
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

    // Wait for iframe to be ready
    if (!iframe.contentWindow.document.body.innerHTML) {
      await new Promise((resolve) => {
        iframe.onload = resolve;
      });
    }

    const document = iframe.contentWindow.document;
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
   
    document.documentElement.style.setProperty('--primary-color', `rgb(${backgroundColorRgb.r}, ${backgroundColorRgb.g}, ${backgroundColorRgb.b})`);
    document.documentElement.style.setProperty('--secondary-color', `rgb(${headingColorRgb.r}, ${headingColorRgb.g}, ${headingColorRgb.b})`);
    document.documentElement.style.setProperty('--tertiary-color', `rgb(${subHeadingColorRgb.r}, ${subHeadingColorRgb.g}, ${subHeadingColorRgb.b})`);

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

  function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'Copied to clipboard !!', duration: 1500 });
		});
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
  let generationCount = 0;
  let showUpgradePrompt = false;

  const apiExampleCode = `
const response = await fetch('https://api.pictify.io/og-image', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
  body: JSON.stringify({
    title: 'My Awesome Post',
    template: 'modern-gradient'
  })
});`;

  // Modify the generateImage function
  const generateImage = async () => {
    generationCount++;
    
    isImageGenerating = true;
    const iframe = ogImageTemplateWrapper.querySelector('iframe');
    const document = iframe.contentWindow.document;
    let html = document.documentElement.outerHTML;
    
    // Add watermark for non-logged in users after 2 generations
    if (!isUserLoggedIn && generationCount > 2) {
      const watermarkDiv = `
        <div style="position: fixed; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9); 
                    padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 9999;
                    font-family: system-ui, -apple-system, sans-serif;">
          Created with <a href="https://pictify.io" style="color: #ff6b6b; text-decoration: none;">pictify.io</a>
        </div>
      `;
      
      // Insert watermark before closing body tag
      html = html.replace('</body>', `${watermarkDiv}</body>`);
    }
    
    try {
      const {image} = await createImagePublic({
        html,
        width: previewWidth,
        height: previewHeight
      });
      imageUrl = image.url;
      
      // Increment total images counter
      totalImagesGenerated++;
      
      // Show upgrade prompt after 2 generations
      if (!isUserLoggedIn && generationCount > 2) {
        showUpgradePrompt = true;
      }
      
    } catch (error) {
      toast.set({ message: 'Failed to generate image. Please try again.', duration: 3000 });
    } finally {
      isImageGenerating = false;
    }
  };

  // Add function to handle social sharing with rewards


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
    toast.set({ message: 'Template saved successfully!', duration: 1500 });
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

 
</script>

<svelte:head>
  <title>Free OG Image Generator: Create Custom Open Graph Images | Pictify.io</title>
  <meta name="description" content="Create stunning Open Graph images for free with Pictify.io's OG Image Generator. Boost social media engagement and SEO with custom OG images for your content.">
  <meta name="keywords" content="OG image generator, Open Graph images, social media images, SEO, content marketing">
  <link rel="canonical" href="https://pictify.io/tools/og-image-generator">
  <meta property="og:title" content="Best OG Image Generator | Create Open Graph Images Free">
  <meta property="og:description" content="Create stunning social media cards with our free OG Image Generator. Design custom Open Graph images in seconds.">
  <meta property="og:image" content="https://media.pictify.io/z8xnl-1723429909736.png">
  <meta property="og:url" content="https://pictify.io/tools/og-image-generator">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@pictify_io">
  <meta name="twitter:title" content="Best OG Image Generator | Create Open Graph Images Free">
  <meta name="twitter:description" content="Create stunning social media cards with our free OG Image Generator. Design custom Open Graph images in seconds.">
  <meta name="twitter:image" content="https://media.pictify.io/z8xnl-1723429909736.png">
  <script type="application/ld+json">
  {
    "@context": "http://schema.org",
    "@type": "SoftwareApplication",
    "name": "Pictify OG Image Generator",
    "url": "https://pictify.io/tools/og-image-generator",
    "description": "Create custom Open Graph images for improved social media engagement and SEO.",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "{totalImagesGenerated}"
    }
  }
  </script>
</svelte:head>


<section>
  <Nav />
  <main class="z-10 w-full py-5 md:px-0 px-6 flex flex-col items-center justify-center space-y-8 max-w-5xl mx-auto relative overflow-hidden">
    <!-- Enhanced Decorative Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
      <div class="absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ff6b6b]/20 to-transparent rounded-full blur-[100px] transform -translate-y-1/2 animate-float"></div>
      <div class="absolute bottom-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ffc480]/20 to-transparent rounded-full blur-[100px] transform translate-y-1/2 animate-float-delayed"></div>
      <div class="absolute top-1/2 left-1/2 w-48 md:w-64 h-48 md:h-64 bg-gradient-to-br from-[#6b95ff]/10 to-transparent rounded-full blur-[80px] transform -translate-x-1/2 animate-pulse-slow"></div>
   </div>
  
    <!-- Primary Content -->
    <div class="flex flex-col items-center space-y-6 md:space-y-8 text-center max-w-3xl mb-8 md:mb-12 relative">
      <div class="bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-full py-2 md:py-2.5 px-4 md:px-5 text-sm font-medium text-gray-800 shadow-sm transform hover:scale-105 transition-all duration-300 w-auto">
        <div class="flex items-center gap-2 md:gap-2.5">
          <span class="text-base md:text-lg">🎨</span>
          <span class="font-semibold">Create Beautiful OG Images</span>
  </div>
      </div>

      <h1 class="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-tight">
        OG Image<br/><span class="text-[#ff6b6b]">Generator</span>
      </h1>
      
      <p class="text-lg md:text-xl text-gray-800 max-w-2xl leading-relaxed font-medium px-4 md:px-0">
        Generate stunning Open Graph images for your website or blog with our OG Image Generator.
      </p>
        </div>

      <!-- Creation Mode Selector -->
      <div class="w-full max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm transform hover:shadow-md transition-all duration-300">
        <div class="flex gap-4 mb-6">
          <button
            class={`flex-1 py-3 px-6 rounded-xl font-medium transition-all relative z-20 ${
              creationMode === 'website' 
                ? 'bg-[#ff6b6b] text-white shadow-lg' 
                : 'bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-800 hover:border-[#ff6b6b]/30'
            }`}
            on:click={() => {
              creationMode = 'website';
              websiteInfo = null;
            }}
          >
            From Website
          </button>
          <button
            class={`flex-1 py-3 px-6 rounded-xl font-medium transition-all relative z-20 ${
              creationMode === 'direct' 
                ? 'bg-[#ff6b6b] text-white shadow-lg' 
                : 'bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-800 hover:border-[#ff6b6b]/30'
            }`}
            on:click={() => {
              creationMode = 'direct';
              createDirectOgImage();
            }}
          >
            Create Directly
          </button>
        </div>

        {#if creationMode === 'website'}
          <!-- Website URL input -->
          <div class="space-y-4">
            <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-grow">
              <input
                on:input={(e) => {
                  if (isValidUrl(e.target.value)) {
                    e.target.classList.remove('border-red-500');
                  } else {
                    e.target.classList.add('border-red-500');
                  }
                }}
                bind:value={url}
                type="text"
                  class="w-full border-2 border-gray-200 placeholder-gray-500 text-lg font-medium focus:outline-none focus:border-[#ff6b6b] py-3.5 px-6 rounded-xl bg-white/50 backdrop-blur-sm transition-all"
                placeholder="Enter your website URL"
              />
            </div>
              <button
                on:click={(event) => { event.preventDefault(); submitUrl(url); }}
                class="relative group md:w-auto w-full"
              >
                <div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
                <button
                  class="py-3.5 px-6 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-semibold bg-[#ffc480] tracking-wide text-lg text-gray-900 transition-all hover:shadow-lg hover:brightness-105"
                >
                  <span class="relative inline-flex items-center gap-2">
                    <span>Fetch Website Info</span>
                    <svg class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </button>
              </button>
            </div>
            {#if isFetchingWebsiteInfo}
              <div class="text-lg font-medium text-gray-700">
                Fetching website info...
                <div class="mt-3 w-full bg-gray-100 rounded-full h-2">
                  <div class="bg-[#ff6b6b] h-2 rounded-full" style="width: {$progress}%; transition: width 0.3s ease-out;"></div>
                </div>
              </div>
            {/if}
            {#if error}
              <div class="text-lg font-medium text-[#ff6b6b] bg-red-50 p-4 rounded-xl">
                {error}
              </div>
            {/if}
          </div>
        {:else}
          <!-- No form needed for direct creation mode -->
          <p class="text-center text-gray-700">
            Choose a template below and start customizing your OG image.
          </p>
        {/if}
      </div>

      <!-- Editor Section -->
      {#if websiteInfo && selectedTemplate}
        <div class="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm transform hover:shadow-md transition-all duration-300" bind:this={ogImageTemplateWrapper}>
          <!-- Enhanced editor header -->
          <div class="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
            <h2 class="text-2xl font-bold text-gray-900">Customize Your OG Image</h2>
           
          </div>

          <!-- Preview section -->
          <div class="bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 mb-8">
            <h3 class="text-sm font-medium text-gray-700 mb-4">Preview</h3>
            <div class="w-full flex justify-center">
              <div class="relative w-full" style="padding-top: 52.5%;">
                <div class="absolute inset-0">
                  <OgImageTemplate html={selectedTemplate} width={1200} height={630} scale={0.5} />
                </div>
              </div>
            </div>
          </div>

          <!-- Editor controls in a grid layout -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Logo section -->
            <div class="space-y-6">
              <h3 class="font-semibold text-xl text-gray-900">Logo</h3>
              <div class="flex flex-col gap-4">
                {#if websiteInfo.logo}
                  <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200">
                    {#if websiteInfo.logo.startsWith('<svg')}
                      <div style="width: 150px;">
                        {@html websiteInfo.logo}
                      </div>
                    {:else}
                      <img src={websiteInfo.logo} style="width: 150px;" alt="input-logo" class="object-contain"/>
                    {/if}
                  </div>
                {/if}
                <div class="flex items-center gap-4">
                  <input
                    type="file"
                    class="hidden"
                    id="logoInput"
                    accept="image/*"
                    on:change={updateLogo}
                  />
                  <label
                    for="logoInput"
                    class="px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-800 rounded-xl cursor-pointer hover:border-[#ff6b6b]/30 transition-colors inline-flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                    </svg>
                    Upload Logo
                  </label>
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      class="w-24 border-2 border-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#ff6b6b] p-2 rounded-xl bg-white/50 backdrop-blur-sm transition-all"
                      value={logoWidth}
                      on:input={updateLogoWidth}
                    />
                    <span class="text-sm font-medium text-gray-700">Width</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Text content section -->
            <div class="space-y-6">
              <div>
                <label class="font-semibold text-xl text-gray-900 block mb-3">Heading</label>
                <input
                  type="text"
                  class="w-full border-2 border-gray-200 placeholder-gray-500 text-lg font-medium focus:outline-none focus:border-[#ff6b6b] py-3 px-4 rounded-xl bg-white/50 backdrop-blur-sm transition-all"
                  placeholder="Enter heading text"
                  value={websiteInfo.heading}
                  on:input={updateHeading}
                />
              </div>
              <div>
                <label class="font-semibold text-xl text-gray-900 block mb-3">Sub-Heading</label>
                <textarea
                  class="w-full border-2 border-gray-200 placeholder-gray-500 text-lg font-medium focus:outline-none focus:border-[#ff6b6b] py-3 px-4 rounded-xl bg-white/50 backdrop-blur-sm transition-all"
                  rows="3"
                  value={websiteInfo.subHeading}
                  on:input={updateSubHeading}
                ></textarea>
              </div>
            </div>

            <!-- Style controls -->
            <div class="space-y-6">
              <h3 class="font-semibold text-xl text-gray-900">Style</h3>
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-2">Font Family</label>
                <select
                  class="w-full border-2 border-gray-200 placeholder-gray-500 text-lg font-medium focus:outline-none focus:border-[#ff6b6b] py-3 px-4 rounded-xl bg-white/50 backdrop-blur-sm transition-all"
                  on:change={(e) => updateFont(combinedFonts[e.target.selectedIndex])}
                >
                  {#each combinedFonts as font}
                    <option value={font.id}>{font.name}</option>
                  {/each}
                </select>
              </div>
            </div>

            <!-- Color controls -->
            <div class="space-y-6">
              <h3 class="font-semibold text-xl text-gray-900">Colors</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label class="text-sm font-medium text-gray-700 block mb-2">Background</label>
                  <ColorPicker
                  bind:rgb={backgroundColorRgb}
                  isDialog={true}
                  on:input={updateBackgroundColor}
                />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-2">Text</label>
                <ColorPicker
                  bind:rgb={headingColorRgb}
                  isDialog={true}
                  on:input={updateHeadingColor}
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Generate button section -->
        <div class="mt-10 border-t border-gray-200 pt-8">
          {#if imageUrl}
            <div class="mb-8 space-y-6">
              <h3 class="font-semibold text-xl text-gray-900">Generated Image</h3>
              <div class="bg-gray-50/80 backdrop-blur-sm p-6 rounded-xl">
                <div class="flex items-center justify-between">
                  <a href={imageUrl} download="og-image.jpg" class="text-[#ff6b6b] hover:underline truncate flex-1">
                    {imageUrl}
                  </a>
                  <button
                    on:click={() => copyToClipboard(imageUrl)}
                    class="ml-4 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-800 text-sm rounded-xl hover:border-[#ff6b6b]/30 transition-colors"
                  >
                    Copy URL
                  </button>
                </div>
                <img src={imageUrl} class="mt-4 w-[200px] border border-gray-200 rounded-xl" alt="og-image" />
              </div>
            </div>

            <!-- Share Card After Generation -->
            <div class="mt-8 bg-gradient-to-br from-[#ff6b6b]/5 to-[#ffc480]/5 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 md:p-8">
              <!-- Generated Image Preview -->
              <div class="mb-8">
                <img src={imageUrl} alt="Generated OG Image" class="w-full rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer" />
              </div>

              <div class="text-center mb-8">
                <h3 class="text-2xl font-bold text-gray-900 mb-2">🎉 Your OG Image is Ready!</h3>
                <p class="text-gray-700">Join {totalImagesGenerated.toLocaleString()} others creating beautiful OG images</p>
              </div>

              <!-- Growth Loop Elements -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <!-- Social Proof -->
                <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
                  <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 bg-[#ff6b6b]/10 rounded-xl flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#ff6b6b]" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-900">Time Saved</h4>
                      <p class="text-sm text-gray-600">15 minutes per image on average</p>
                    </div>
                  </div>
                  <div class="grid grid-cols-3 gap-2 mt-4">
                    <div class="bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 text-center">
                      <p class="text-lg font-semibold text-gray-900">&lt; 2 sec</p>
                      <p class="text-xs text-gray-600">Time to Generate</p>
                    </div>
                    <div class="bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 text-center">
                      <p class="text-lg font-semibold text-gray-900">92%</p>
                      <p class="text-xs text-gray-600">Success Rate</p>
                    </div>
                    <div class="bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 text-center">
                      <p class="text-lg font-semibold text-gray-900">4.9/5</p>
                      <p class="text-xs text-gray-600">Rating</p>
                    </div>
                  </div>
                </div>

                <!-- Usage Stats -->
                <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
                  <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 bg-[#ff6b6b]/10 rounded-xl flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#ff6b6b]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h10a1 1 0 110 2H9a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-900">Growing Fast</h4>
                      <p class="text-sm text-gray-600">{Math.floor(totalImagesGenerated * 0.2).toLocaleString()} images this week</p>
                    </div>
                  </div>
                  <div class="h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-[#ff6b6b] to-[#ffc480] w-[85%]" />
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#if !isUserLoggedIn}
                  <div class="relative w-auto flex-shrink-0 group">
                    <div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
                    <button 
                      class="py-4 rounded-lg px-8 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-semibold bg-[#ff6b6b] tracking-wide text-lg flex-shrink-0 text-white transition-all hover:shadow-lg hover:brightness-105"
                      on:click={() => window.location.href = '/signup?redirect=/dashboard/tools/og-image-generator'}
                    >
                      <span class="relative inline-flex items-center gap-2">
                        <span>Create Free Account</span>
                        <svg class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                      </span>
                    </button>
                  </div>
                {/if}

                <!-- Share Buttons -->
                <div class="grid grid-cols-2 gap-4 {isUserLoggedIn ? 'md:col-span-2' : ''}">
                  <button
                    class="relative group w-full"
                    on:click={() => handleSocialShare('twitter')}
                  >
                    <div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
                    <button class="py-3 px-6 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-semibold bg-black tracking-wide text-lg text-white transition-all hover:shadow-lg hover:brightness-105">
                      <span class="relative inline-flex items-center gap-2 justify-center">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span class="hidden md:inline">Share</span>
                      </span>
                    </button>
                  </button>

                  <button
                    class="relative group w-full"
                    on:click={() => handleSocialShare('linkedin')}
                  >
                    <div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
                    <button class="py-3 px-6 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-semibold bg-[#0A66C2] tracking-wide text-lg text-white transition-all hover:shadow-lg hover:brightness-105">
                      <span class="relative inline-flex items-center gap-2 justify-center">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.065 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <span class="hidden md:inline">Share</span>
                      </span>
                    </button>
                  </button>
                </div>
              </div>

              <!-- Premium Features Teaser -->
              {#if !isUserLoggedIn}
                <div class="mt-8 pt-8 border-t border-gray-200">
                  <div class="text-center mb-6">
                    <h4 class="font-semibold text-gray-900 mb-2">Unlock Premium Features</h4>
                    <p class="text-sm text-gray-600">Create unlimited OG images with advanced customization</p>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mx-auto mb-2 text-[#ff6b6b]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" />
                      </svg>
                      <span class="text-sm font-medium text-gray-700">No Watermarks</span>
                    </div>
                    <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mx-auto mb-2 text-[#ff6b6b]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                      <span class="text-sm font-medium text-gray-700">API Access</span>
                    </div>
                    <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mx-auto mb-2 text-[#ff6b6b]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      <span class="text-sm font-medium text-gray-700">Templates</span>
                    </div>
                    <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mx-auto mb-2 text-[#ff6b6b]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                      </svg>
                      <span class="text-sm font-medium text-gray-700">Cloud Storage</span>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/if}

          {#if isImageGenerating}
            <div class="mb-8">
              <div class="text-lg font-medium text-gray-900 mb-3">Generating Image...</div>
              <div class="w-full bg-gray-100 rounded-full h-2">
                <div class="bg-[#ff6b6b] h-2 rounded-full" style="width: 0%; animation: loading 3s forwards;"></div>
              </div>
            </div>
          {/if}

          <button
            on:click={generateImage}
            disabled={isImageGenerating}
            class="relative group w-full"
          >
            <div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2 {isImageGenerating ? 'opacity-50' : ''}" />
            <button
              disabled={isImageGenerating}
              class="py-4 px-8 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-semibold bg-[#ffc480] tracking-wide text-lg text-gray-900 transition-all hover:shadow-lg hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="relative inline-flex items-center gap-2 justify-center">
                <span>{isImageGenerating ? 'Generating...' : 'Generate Image'}</span>
                {#if !isImageGenerating}
                  <svg class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                {/if}
              </span>
            </button>
          </button>
        </div>
    </div>
    {/if}

    <!-- Social Proof Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full max-w-3xl mt-12 z-[-1]">
      <div class="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-sm transition-all duration-300 hover:scale-105">
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 bg-[#ff6b6b]/10 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#ff6b6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="text-center">
            <h3 class="font-bold text-gray-900 mb-1">Instant Generation</h3>
            <p class="text-sm text-gray-600">Create OG images in seconds with our lightning-fast generator</p>
          </div>
        </div>
      </div>

      <div class="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-sm transition-all duration-300 hover:scale-105">
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 bg-[#ff6b6b]/10 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#ff6b6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div class="text-center">
            <h3 class="font-bold text-gray-900 mb-1">Premium Features</h3>
            <p class="text-sm text-gray-600">Unlock advanced customization and unlimited generations</p>
          </div>
        </div>
      </div>

      <div class="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-sm transition-all duration-300 hover:scale-105">
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 bg-[#ff6b6b]/10 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#ff6b6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div class="text-center">
            <h3 class="font-bold text-gray-900 mb-1">Template Library</h3>
            <p class="text-sm text-gray-600">Access our growing collection of professional templates</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Featured templates section -->
    <div class="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm transform hover:shadow-md transition-all duration-300 mt-12">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold text-gray-900">Featured Templates</h2>
        {#if !isUserLoggedIn}
          <a href="/signup?redirect=/dashboard/tools/og-image-generator" class="text-[#ff6b6b] hover:text-[#ff5252] font-medium flex items-center gap-1 transition-colors">
            Sign up free for more templates
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </a>
        {/if}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each templates.slice(0, 6) as template}
          <div class="relative group cursor-pointer bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
            <div class="relative w-full" style="padding-top: 52.5%;">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-full h-full">
                  <OgImageTemplate html={template} width={1200} height={630} scale={0.25} />
                </div>
              </div>
            </div>
            <button
              class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center"
              on:click={() => selectTemplate(template)}
            >
              <span class="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-6 py-2.5 rounded-xl font-medium transform translate-y-4 group-hover:translate-y-0 transition-all shadow-sm hover:shadow">
                Use Template
              </span>
            </button>
          </div>
        {/each}
      </div>
    </div>

    <!-- Premium templates section -->
    {#if isUserLoggedIn}
      <div class="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm transform hover:shadow-md transition-all duration-300 mt-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-8">All Templates</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each templates.slice(6) as template}
            <div class="relative group cursor-pointer bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
              <div class="relative w-full" style="padding-top: 52.5%;">
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-full h-full">
                    <OgImageTemplate html={template} width={1200} height={630} scale={0.25} />
                  </div>
                </div>
              </div>
              <button
                class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center"
                on:click={() => selectTemplate(template)}
              >
                <span class="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-6 py-2.5 rounded-xl font-medium transform translate-y-4 group-hover:translate-y-0 transition-all shadow-sm hover:shadow">
                  Use Template
                </span>
              </button>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm transform hover:shadow-md transition-all duration-300 mt-12">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-bold text-gray-900">Premium Templates</h2>
          <a href="/signup?redirect=/dashboard/tools/og-image-generator" class="text-[#ff6b6b] hover:text-[#ff5252] font-medium flex items-center gap-1 transition-colors">
            Create free account to unlock
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </a>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each templates.slice(6, 18) as template}
            <div class="relative group cursor-pointer bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl overflow-hidden">
              <div class="relative w-full" style="padding-top: 52.5%;">
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-full h-full filter blur-[2px]">
                    <OgImageTemplate html={template} width={1200} height={630} scale={0.25} />
                  </div>
                </div>
              </div>
              <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div class="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#ff6b6b]" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                  </svg>
                  <span class="font-medium">Sign up to access</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- FAQ section -->
    <section class="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm transform hover:shadow-md transition-all duration-300 mt-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <details class="group">
          <summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
            <span class="font-semibold text-gray-900">What is an OG image?</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </summary>
          <div class="mt-4 px-4 text-gray-700">
            An OG (Open Graph) image is the image that appears when your content is shared on social media platforms. It's designed to give a visual preview of your content and attract more clicks.
          </div>
        </details>

        <details class="group">
          <summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
            <span class="font-semibold text-gray-900">How do I add an OG image to my website?</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </summary>
          <div class="mt-4 px-4 text-gray-700">
            To add an OG image to your website, you need to include the appropriate Open Graph meta tags in the &lt;head&gt; section of your HTML. The most important tag for images is og:image, which should contain the URL of your OG image.
          </div>
        </details>

        <details class="group">
          <summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
            <span class="font-semibold text-gray-900">How to use OG Image Generator?</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </summary>
          <div class="mt-4 px-4 text-gray-700">
            To use OG Image Generator, simply enter your website URL, choose a template, and customize the settings to your liking. Once you're satisfied with the preview, click the "Generate Image" button to download your custom OG image.
          </div>
        </details>

        <details class="group">
          <summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
            <span class="font-semibold text-gray-900">What are the things I can customize?</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </summary>
          <div class="mt-4 px-4 text-gray-700">
            You can customize the heading, subheading, logo, colors, and fonts to match your brand. You can also choose from our selection of professionally designed templates. Although some template's colors cannot be changed, you can change the font and the logo.
          </div>
        </details>
      </div>
    </section>

    <!-- Social sharing section -->
    <div class="mt-8 mb-8 flex flex-col md:flex-row justify-center md:space-x-4">
      <button
        class="flex items-center justify-center px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-gray-900 transition-colors shadow-sm hover:shadow mb-4 md:mb-0"
        on:click={() => handleSocialShare('twitter')}
      >
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Share on X
      </button>
      <button
        class="flex items-center justify-center px-6 py-3 bg-[#0A66C2] text-white font-medium rounded-xl hover:bg-[#094d92] transition-colors shadow-sm hover:shadow"
        on:click={() => handleSocialShare('linkedin')}
      >
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.065 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        Share on LinkedIn
      </button>
    </div>

    <!-- Add signup prompt modal -->
    {#if showUpgradePrompt}
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" style="margin-top: 0px !important;">
        <div class="bg-white/90 backdrop-blur-sm rounded-2xl max-w-md w-full mx-auto p-8 shadow-lg">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900">🚀 Ready to Scale?</h3>
            <button 
              class="text-gray-500 hover:text-gray-700"
              on:click={() => showUpgradePrompt = false}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Premium Features List -->
          <div class="space-y-4 mb-8">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-[#ff6b6b]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#ff6b6b]" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <p class="font-semibold text-gray-900">Unlimited Generations</p>
                <p class="text-sm text-gray-600">Create as many OG images as you need, without limits</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-[#ff6b6b]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#ff6b6b]" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" />
                </svg>
              </div>
              <div>
                <p class="font-semibold text-gray-900">API Access</p>
                <p class="text-sm text-gray-600">Generate OG images programmatically with our simple API</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-[#ff6b6b]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#ff6b6b]" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <div>
                <p class="font-semibold text-gray-900">Templates</p>
                <p class="text-sm text-gray-600">Access our growing collection of professional templates</p>
              </div>
            </div>
          </div>

          <!-- Code Example -->
          <div class="bg-gray-900 rounded-xl p-4 mb-6 overflow-x-auto">
            <pre class="text-sm text-gray-300"><code>{apiExampleCode}</code></pre>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-4">
            <button
              class="w-full bg-[#ff6b6b] text-white py-3 px-6 rounded-xl font-medium hover:bg-[#ff5252] transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
              on:click={() => window.location.href = '/signup?redirect=/dashboard/tools/og-image-generator'}
            >
              <span>Sign Up for Free</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>

            <button
              class="w-full border border-gray-200 bg-white/50 backdrop-blur-sm py-3 px-6 rounded-xl font-medium hover:border-[#ff6b6b]/30 transition-all text-gray-700"
              on:click={() => showUpgradePrompt = false}
            >
              Continue without signing up
            </button>
          </div>

          <p class="text-center text-sm text-gray-500 mt-6">
            Join {totalImagesGenerated.toLocaleString()} developers automating OG image generation
          </p>
        </div>
      </div>
    {/if}

    <!-- New SEO-optimized sections -->
    <div class="max-w-4xl mx-auto px-6 md:px-0 mb-20">
      <h2 class="text-4xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-r from-[#ff6b6b] to-[#ff8e8e] bg-clip-text text-transparent">Learn More About OG Image Generation</h2>
      
      <section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 class="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
          <span class="text-[#ff6b6b]">📚</span>
          What is an OG Image Generator?
        </h3>
        <p class="text-lg text-gray-700 leading-relaxed">
          An OG Image Generator is a powerful tool that creates custom Open Graph images for your website or social media content. These images appear when your links are shared on platforms like Facebook, Twitter, and LinkedIn, significantly improving click-through rates and engagement.
        </p>
      </section>

      <section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 class="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
          <span class="text-[#ff6b6b]">💎</span>
          Benefits of Using Our OG Image Generator
        </h3>
        <ul class="text-lg text-gray-700 space-y-4">
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Create professional-looking OG images in minutes</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Customize colors, fonts, and layouts to match your brand</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Improve social media engagement and click-through rates</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>No design skills required - user-friendly interface</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Multiple templates to choose from for various content types</span>
          </li>
        </ul>
      </section>

      <section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 class="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
          <span class="text-[#ff6b6b]">🚀</span>
          How to Use Our OG Image Generator
        </h3>
        <ol class="text-lg text-gray-700 space-y-4">
          <li class="flex items-start gap-3">
            <span class="bg-[#ff6b6b] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
            <span>Enter your website URL to fetch existing branding elements</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="bg-[#ff6b6b] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
            <span>Choose from our selection of professionally designed templates</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="bg-[#ff6b6b] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
            <span>Customize the heading, subheading, logo, colors, and fonts</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="bg-[#ff6b6b] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">4</span>
            <span>Preview your OG image in real-time</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="bg-[#ff6b6b] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">5</span>
            <span>Generate and download your custom OG image</span>
          </li>
        </ol>
      </section>

      <section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 class="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
          <span class="text-[#ff6b6b]">📈</span>
          Why OG Images Matter for SEO and Social Media
        </h3>
        <p class="text-lg text-gray-700 leading-relaxed">
          Open Graph images play a crucial role in both SEO and social media marketing. They increase visibility, improve click-through rates, and provide a visual preview of your content. By using our OG Image Generator, you can create eye-catching images that stand out in social media feeds and search results, ultimately driving more traffic to your website.
        </p>
      </section>

      <!-- New section on best practices -->
      <section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 class="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
          <span class="text-[#ff6b6b]">✨</span>
          Best Practices for Creating Effective OG Images
        </h3>
        <p class="text-lg text-gray-700 leading-relaxed mb-6">
          To maximize the impact of your OG images, follow these best practices:
        </p>
        <ul class="text-lg text-gray-700 space-y-4">
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Use high-contrast colors to ensure readability</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Keep text concise and to the point</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Include your brand logo for consistency</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Use high-quality, relevant imagery</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Maintain a 1.91:1 aspect ratio (1200x630 pixels) for optimal display</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Test your images across different social media platforms</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Update OG images regularly to keep content fresh</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Ensure text is legible even at smaller sizes</span>
          </li>
        </ul>
        <p class="text-lg text-gray-700 leading-relaxed mt-6">
          By following these guidelines and using our OG Image Generator, you can create compelling OG images that boost your social media presence and drive more traffic to your website.
        </p>
      </section>
    </div>

    <Footer />
  </main>
</section>

<style>
  /* Ensure color picker is above all other elements */
  :global(.color-picker-dialog),
  :global(.color-picker) {
    z-index: 9999 !important;
  }

  :global(.color-picker-container) {
    position: relative !important;
    z-index: 9999 !important;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }

  @keyframes float-delayed {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(20px); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 0.3; }
  }

  .animate-float {
    animation: float 6s ease-in-out infinite;
  }

  .animate-float-delayed {
    animation: float-delayed 8s ease-in-out infinite;
  }

  .animate-pulse-slow {
    animation: pulse 4s ease-in-out infinite;
  }
</style>