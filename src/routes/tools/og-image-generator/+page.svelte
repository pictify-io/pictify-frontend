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
  import { ogPlatforms, popularSizes as configPopularSizes, platformGuides, platformRecommendedSizes, parseSize } from '$lib/pseo/config.js';
  import ApiPromptSection from '$lib/components/tools/ApiPromptSection.svelte';
  import Toast from '$lib/components/Toast.svelte';

  // Optional platform prop to specialize content (e.g., 'wordpress')
  export let platform = null;
  $: platformObj = typeof platform === 'string' ? (ogPlatforms.find(p => p.id === platform) || { id: platform, label: platform }) : platform;
  $: platformLabel = platformObj?.label;
  $: isPlatform = !!platformLabel;
  $: recommendedSizes = configPopularSizes;
  $: platformSizes = isPlatform ? (platformRecommendedSizes[platformObj.id] || recommendedSizes) : recommendedSizes;
  $: platformSteps = isPlatform ? (platformGuides[platformObj.id] || []) : [];

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
    description: 'Use our REST API to generate branded OG art on publish, across marketing workflows, or inside your SaaS with a single call.',
    featurePoints: defaultApiFeatureBullets,
    codeSnippet: apiExampleCode,
    docsUrl: 'https://docs.pictify.io/',
    docsLabel: 'View OG Image API docs',
    secondaryCtaLabel: 'See code examples'
  };

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

  $: canonicalUrl =
    isPlatform && platformObj?.id
      ? `https://pictify.io/tools/og-image-generator/${platformObj.id}`
      : 'https://pictify.io/tools/og-image-generator';

  $: structuredDataDescription =
    isPlatform && platformLabel
      ? `Create custom ${platformLabel} Open Graph images for improved social media engagement and SEO.`
      : 'Create custom Open Graph images for improved social media engagement and SEO.';

  $: structuredData =
    {
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
        url: 'https://media.pictify.io/z8xnl-1723429909736.png',
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
        url: 'https://pictify.io/docs/og-image-generator'
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
  
</script>

<svelte:head>
  {#if isPlatform}
    <title>OG Image Generator for {platformLabel} | Pictify.io</title>
    <meta name="description" content={`Create perfect Open Graph images for ${platformLabel}. Customize templates, fonts, and colors with Pictify.io.`}>
    <link rel="canonical" href={`https://pictify.io/tools/og-image-generator/${platformObj.id}`}>  
    <meta property="og:title" content={`OG Image Generator for ${platformLabel} | Pictify.io`}>
    <meta property="og:description" content={`Design ${platformLabel} OG images in seconds with Pictify.io.`}>
    <meta property="og:image" content="https://media.pictify.io/z8xnl-1723429909736.png">
    <meta property="og:url" content={`https://pictify.io/tools/og-image-generator/${platformObj.id}`}>  
  {:else}
    <title>Free OG Image Generator: Create Custom Open Graph Images | Pictify.io</title>
    <meta name="description" content="Create stunning Open Graph images for free with Pictify.io's OG Image Generator. Boost social media engagement and SEO with custom OG images for your content.">
    <link rel="canonical" href="https://pictify.io/tools/og-image-generator">
    <meta property="og:title" content="Best OG Image Generator | Create Open Graph Images Free">
    <meta property="og:description" content="Create stunning social media cards with our free OG Image Generator. Design custom Open Graph images in seconds.">
    <meta property="og:image" content="https://media.pictify.io/z8xnl-1723429909736.png">
    <meta property="og:url" content="https://pictify.io/tools/og-image-generator">
  {/if}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@pictify_io">
  <meta name="twitter:title" content={isPlatform ? `OG Image Generator for ${platformLabel} | Pictify.io` : 'Best OG Image Generator | Create Open Graph Images Free'}>
  <meta name="twitter:description" content={isPlatform ? `Design ${platformLabel} OG images in seconds with Pictify.io.` : 'Create stunning social media cards with our free OG Image Generator. Design custom Open Graph images in seconds.'}>
  <meta name="twitter:image" content="https://media.pictify.io/z8xnl-1723429909736.png">
  <script type="application/ld+json">
    {JSON.stringify(structuredData)}
  </script>
</svelte:head>


<section class="min-h-screen bg-[#FFFDF8] font-['Manrope']">
  <Nav />
  <main class="w-full max-w-7xl mx-auto px-6 pt-12 pb-20 md:pt-24 md:pb-32 relative z-10">
    <!-- Background Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-[#ff6b6b]/10 rounded-full blur-[100px] transform -translate-y-1/2"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ffc480]/10 rounded-full blur-[100px] transform translate-y-1/2"></div>
    </div>
  
    <!-- Hero Content -->
    <div class="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto mb-16 relative">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform -rotate-1">
        <span class="text-lg">🎨</span>
        <span class="font-bold text-gray-900">Create Beautiful OG Images</span>
      </div>

      <h1 class="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-gray-900 leading-[1.1] mb-4">
        OG Image<br/><span class="text-[#ff6b6b] relative inline-block">
          Generator
          <svg class="absolute w-full h-4 -bottom-2 left-0 text-gray-900 opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
          </svg>
        </span>
        {#if isPlatform}<br/><span class="text-3xl md:text-4xl font-bold text-gray-600 mt-4 block">for {platformLabel}</span>{/if}
      </h1>
      
      <p class="text-xl text-gray-700 max-w-2xl mx-auto font-medium leading-relaxed">
        {#if isPlatform}
          Generate stunning Open Graph images tailored for {platformLabel}. Choose a template and customize it to match your brand instantly.
        {:else}
          Generate stunning Open Graph images for your website or blog. Boost engagement with custom social cards in seconds.
        {/if}
      </p>

      {#if isPlatform}
        <div class="flex flex-wrap justify-center gap-3 mt-4">
          {#each platformSizes as sz}
            <a href={`/tools/html-to-jpg/${sz}`} class="px-4 py-2 rounded-lg border-[3px] border-gray-900 text-sm font-bold bg-white hover:bg-gray-50 hover:-translate-y-0.5 transition-all shadow-[2px_2px_0_0_#1f2937]">{sz}</a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Creation Mode Selector -->
    <div class="w-full max-w-3xl mx-auto bg-white rounded-3xl border-[3px] border-gray-900 p-8 shadow-[8px_8px_0_0_#1f2937] mb-16">
      <div class="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          class={`flex-1 py-4 px-6 rounded-xl font-black text-lg transition-all border-[3px] ${
            creationMode === 'website' 
              ? 'bg-[#ff6b6b] text-white border-gray-900 shadow-[4px_4px_0_0_#1f2937]' 
              : 'bg-white text-gray-900 border-gray-200 hover:border-gray-900 hover:shadow-[4px_4px_0_0_#1f2937]'
          }`}
          on:click={() => {
            creationMode = 'website';
            websiteInfo = null;
          }}
        >
          From Website
        </button>
        <button
          class={`flex-1 py-4 px-6 rounded-xl font-black text-lg transition-all border-[3px] ${
            creationMode === 'direct' 
              ? 'bg-[#ff6b6b] text-white border-gray-900 shadow-[4px_4px_0_0_#1f2937]' 
              : 'bg-white text-gray-900 border-gray-200 hover:border-gray-900 hover:shadow-[4px_4px_0_0_#1f2937]'
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
        <div class="space-y-6">
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
                class="w-full border-[3px] border-gray-900 placeholder-gray-500 text-lg font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] py-4 px-6 rounded-xl transition-all"
                placeholder="Enter your website URL (e.g., pictify.io)"
              />
            </div>
            <button
              on:click={(event) => { event.preventDefault(); submitUrl(url); }}
              class="relative group md:w-auto w-full"
            >
              <div class="w-full rounded-xl bg-gray-900 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
              <button
                class="py-4 px-8 rounded-xl group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-black bg-[#ffc480] tracking-wide text-lg text-gray-900 transition-all"
              >
                <span class="relative inline-flex items-center gap-2">
                  <span>Fetch Info</span>
                  <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </span>
              </button>
            </button>
          </div>
          {#if isFetchingWebsiteInfo}
            <div class="text-lg font-bold text-gray-700">
              Fetching website info...
              <div class="mt-4 w-full bg-gray-100 rounded-full h-3 border-2 border-gray-900 overflow-hidden">
                <div class="bg-[#ff6b6b] h-full w-full origin-left animate-[loading_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
          {/if}
          {#if error}
            <div class="text-lg font-bold text-[#ff6b6b] bg-red-50 border-[3px] border-[#ff6b6b] p-4 rounded-xl flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          {/if}
        </div>
      {:else}
        <div class="bg-gray-50 border-[3px] border-gray-200 rounded-xl p-6 text-center">
          <p class="text-gray-700 font-bold text-lg">
            Select a template below to start designing from scratch.
          </p>
        </div>
      {/if}
    </div>

    <!-- Editor Section -->
    {#if websiteInfo && selectedTemplate}
      <div class="w-full max-w-5xl mx-auto bg-white rounded-3xl border-[3px] border-gray-900 p-8 shadow-[8px_8px_0_0_#1f2937] mb-20" bind:this={ogImageTemplateWrapper}>
        <div class="flex justify-between items-center mb-8 pb-6 border-b-[3px] border-gray-100">
          <h2 class="text-3xl font-black text-gray-900">Customize Image</h2>
        </div>

        <!-- Preview section -->
        <div class="bg-gray-100 rounded-2xl p-8 mb-10 border-[3px] border-gray-200">
          <div class="w-full flex justify-center">
            <div class="relative w-full shadow-2xl rounded-lg overflow-hidden" style="padding-top: 52.5%;">
              <div class="absolute inset-0">
                <OgImageTemplate html={selectedTemplate} width={1200} height={630} scale={0.5} />
              </div>
            </div>
          </div>
        </div>

        <!-- Editor controls -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <!-- Logo section -->
          <div class="space-y-6">
            <h3 class="font-black text-xl text-gray-900 flex items-center gap-2">
              <span class="bg-[#ffc480] w-8 h-8 flex items-center justify-center rounded-lg border-2 border-gray-900 text-sm shadow-[2px_2px_0_0_#1f2937]">🖼️</span>
              Logo
            </h3>
            <div class="flex flex-col gap-4 p-6 bg-gray-50 rounded-2xl border-[3px] border-gray-200">
              {#if websiteInfo.logo}
                <div class="bg-white p-4 rounded-xl border-2 border-gray-200 flex justify-center">
                  {#if websiteInfo.logo.startsWith('<svg')}
                    <div style="width: 150px;">
                      {@html websiteInfo.logo}
                    </div>
                  {:else}
                    <img src={websiteInfo.logo} style="width: 150px;" alt="input-logo" class="object-contain"/>
                  {/if}
                </div>
              {/if}
              <div class="flex flex-col gap-4">
                <div class="flex gap-4">
                  <input
                    type="file"
                    class="hidden"
                    id="logoInput"
                    accept="image/*"
                    on:change={updateLogo}
                  />
                  <label
                    for="logoInput"
                    class="flex-1 px-4 py-3 bg-white border-[3px] border-gray-900 text-gray-900 font-bold rounded-xl cursor-pointer hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#1f2937] transition-all text-center"
                  >
                    Upload Logo
                  </label>
                </div>
                <div class="space-y-2">
                  <span class="text-sm font-bold text-gray-700">Logo Width</span>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ff6b6b]"
                    value={logoWidth}
                    on:input={updateLogoWidth}
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Text content section -->
          <div class="space-y-6">
            <h3 class="font-black text-xl text-gray-900 flex items-center gap-2">
              <span class="bg-[#ff6b6b] w-8 h-8 flex items-center justify-center rounded-lg border-2 border-gray-900 text-sm text-white shadow-[2px_2px_0_0_#1f2937]">Aa</span>
              Content
            </h3>
            <div class="space-y-4">
              <div>
                <span class="font-bold text-sm text-gray-700 block mb-2">Heading</span>
                <input
                  type="text"
                  class="w-full border-[3px] border-gray-200 text-lg font-bold focus:outline-none focus:border-gray-900 focus:shadow-[4px_4px_0_0_#1f2937] py-3 px-4 rounded-xl transition-all"
                  placeholder="Enter heading"
                  value={websiteInfo.heading}
                  on:input={updateHeading}
                />
              </div>
              <div>
                <span class="font-bold text-sm text-gray-700 block mb-2">Sub-Heading</span>
                <textarea
                  class="w-full border-[3px] border-gray-200 text-lg font-medium focus:outline-none focus:border-gray-900 focus:shadow-[4px_4px_0_0_#1f2937] py-3 px-4 rounded-xl transition-all resize-none"
                  rows="3"
                  value={websiteInfo.subHeading}
                  on:input={updateSubHeading}
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Style controls -->
          <div class="space-y-6">
            <h3 class="font-black text-xl text-gray-900 flex items-center gap-2">
              <span class="bg-[#4ade80] w-8 h-8 flex items-center justify-center rounded-lg border-2 border-gray-900 text-sm shadow-[2px_2px_0_0_#1f2937]">✨</span>
              Style
            </h3>
            <div class="p-6 bg-gray-50 rounded-2xl border-[3px] border-gray-200 space-y-6">
              <div>
                <span class="text-sm font-bold text-gray-700 block mb-2">Font Family</span>
                <div class="relative">
                  <select
                    class="w-full border-[3px] border-gray-200 text-lg font-bold focus:outline-none focus:border-gray-900 py-3 px-4 rounded-xl bg-white appearance-none cursor-pointer"
                    on:change={(e) => updateFont(combinedFonts[e.target.selectedIndex])}
                  >
                    {#each combinedFonts as font}
                      <option value={font.id}>{font.name}</option>
                    {/each}
                  </select>
                  <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-sm font-bold text-gray-700 block mb-2">Background</span>
                  <div class="border-[3px] border-gray-200 rounded-xl overflow-hidden">
                    <ColorPicker
                      bind:rgb={backgroundColorRgb}
                      isDialog={true}
                      on:input={updateBackgroundColor}
                    />
                  </div>
                </div>
                <div>
                  <span class="text-sm font-bold text-gray-700 block mb-2">Text Color</span>
                  <div class="border-[3px] border-gray-200 rounded-xl overflow-hidden">
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

        <!-- Generate button section -->
        <div class="mt-12 pt-8 border-t-[3px] border-gray-100">
          {#if imageUrl}
            <div class="mb-10 space-y-8 animate-fade-in">
              <div class="bg-white rounded-2xl border-[3px] border-gray-900 p-8 shadow-[8px_8px_0_0_#1f2937]">
                <div class="text-center mb-8">
                  <h3 class="text-3xl font-black text-gray-900 mb-2">🎉 Ready to Ship!</h3>
                  <p class="text-gray-600 font-medium">Your image has been generated successfully.</p>
                </div>

                <img src={imageUrl} alt="Generated OG Image" class="w-full rounded-xl border-2 border-gray-200 shadow-lg mb-8" />

                <div class="flex flex-col sm:flex-row gap-4">
                  <div class="flex-1 relative">
                    <input 
                      type="text" 
                      value={imageUrl} 
                      readonly 
                      class="w-full px-4 py-3 bg-gray-50 border-[3px] border-gray-200 rounded-xl text-sm font-mono text-gray-600 focus:outline-none"
                    />
                  </div>
                  <div class="flex gap-3">
                    <button
                      on:click={() => copyToClipboard(imageUrl)}
                      class="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-[4px_4px_0_0_#ff6b6b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                      Copy URL
                    </button>
                    <a 
                      href={imageUrl} 
                      download="og-image.jpg" 
                      class="px-6 py-3 bg-white border-[3px] border-gray-900 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-[4px_4px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <button
            on:click={generateImage}
            disabled={isImageGenerating}
            class="relative group w-full"
          >
            <div class="w-full rounded-xl bg-gray-900 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2 {isImageGenerating ? 'opacity-50' : ''}" />
            <button
              disabled={isImageGenerating}
              class="py-5 px-8 rounded-xl group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-black bg-[#ffc480] tracking-wide text-xl text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="relative inline-flex items-center gap-3">
                <span>{isImageGenerating ? 'Generating Magic...' : 'Generate Final Image'}</span>
                {#if !isImageGenerating}
                  <svg class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                {:else}
                  <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                {/if}
              </span>
            </button>
          </button>
        </div>
      </div>
    {/if}

    <!-- Featured Templates Grid -->
    <div class="w-full max-w-7xl mx-auto mb-20">
      <div class="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
        <h2 class="text-4xl font-black text-gray-900 tracking-tight">
          {isPlatform ? `Templates for ${platformLabel}` : 'Featured Templates'}
        </h2>
        {#if !isUserLoggedIn}
          <a href="/signup" class="group flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-[#ff6b6b] transition-colors">
            <span>View All Templates</span>
            <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
          </a>
        {/if}
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each templates.slice(0, 6) as template}
          <div class="group bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#1f2937] transition-all duration-200 relative">
            <div class="p-3 bg-gray-50 border-b-[3px] border-gray-900 flex gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-400"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-400"></div>
            </div>
            <div class="relative aspect-[1.91/1] bg-gray-100">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-full h-full transform scale-[0.3] origin-top-left" style="width: 1200px; height: 630px;">
                  <OgImageTemplate html={template} width={1200} height={630} scale={1} />
                </div>
              </div>
              
              <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center backdrop-blur-[2px] cursor-pointer"
                on:click={() => selectTemplate(template)}
              >
                <button class="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ff6b6b] hover:scale-105 transition-transform">
                  Use Template
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- New SEO-optimized sections -->
    <ApiPromptSection
      title={apiCtaDetails.title}
      description={apiCtaDetails.description}
      featurePoints={apiCtaDetails.featurePoints}
      codeSnippet={apiCtaDetails.codeSnippet}
      codeLanguage="bash"
      docsUrl={apiCtaDetails.docsUrl}
      docsLabel={apiCtaDetails.docsLabel}
      secondaryCtaLabel={apiCtaDetails.secondaryCtaLabel}
      secondaryCtaUrl="https://docs.pictify.io/examples"
      note="Contact us for volume pricing or dedicated rendering regions."
    />

    <div class="max-w-6xl mx-auto px-4 mt-20">
      <!-- Separator -->
      <div class="border-t-[3px] border-gray-900 relative mb-16">
        <div class="absolute left-1/2 -top-4 -translate-x-1/2 bg-white px-4">
          <svg class="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
          </svg>
        </div>
      </div>

      <h2 class="text-4xl md:text-6xl font-black mb-16 text-center text-gray-900 tracking-tight">
        Learn More About <span class="relative inline-block text-[#ff6b6b]">
          OG Images
          <svg class="absolute w-full h-3 -bottom-1 left-0 text-gray-900 opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
          </svg>
        </span>
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <section class="bg-white rounded-3xl border-[3px] border-gray-900 p-8 shadow-[8px_8px_0_0_#1f2937] hover:-translate-y-1 transition-transform">
          <div class="bg-[#ffc480] w-12 h-12 rounded-xl border-2 border-gray-900 flex items-center justify-center mb-6 shadow-[2px_2px_0_0_#1f2937]">
            <span class="text-2xl">📚</span>
          </div>
          <h3 class="text-2xl font-black mb-4 text-gray-900">What is an OG Image?</h3>
          <p class="text-lg text-gray-700 leading-relaxed font-medium">
            An OG (Open Graph) image is the preview that appears when your content is shared on social media. It's your first impression—make it count with professional designs that drive clicks.
          </p>
        </section>

        <section class="bg-white rounded-3xl border-[3px] border-gray-900 p-8 shadow-[8px_8px_0_0_#1f2937] hover:-translate-y-1 transition-transform">
          <div class="bg-[#ff6b6b] w-12 h-12 rounded-xl border-2 border-gray-900 flex items-center justify-center mb-6 shadow-[2px_2px_0_0_#1f2937]">
            <span class="text-2xl text-white">💎</span>
          </div>
          <h3 class="text-2xl font-black mb-4 text-gray-900">Why Use This Tool?</h3>
          <ul class="space-y-3">
            <li class="flex items-center gap-3 font-medium text-gray-700">
              <div class="w-2 h-2 bg-gray-900 rounded-full"></div>
              Create pro images in minutes
            </li>
            <li class="flex items-center gap-3 font-medium text-gray-700">
              <div class="w-2 h-2 bg-gray-900 rounded-full"></div>
              Customize to match your brand
            </li>
            <li class="flex items-center gap-3 font-medium text-gray-700">
              <div class="w-2 h-2 bg-gray-900 rounded-full"></div>
              Boost click-through rates by 40%
            </li>
          </ul>
        </section>
      </div>

      <!-- FAQ Section -->
      <section class="mb-20">
        <h3 class="text-3xl font-black mb-8 text-gray-900">Common Questions</h3>
        <div class="space-y-4">
          <details class="group bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden transition-all duration-200 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937]">
            <summary class="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 select-none">
              <span>How do I add an OG image to my site?</span>
              <svg class="w-6 h-6 text-gray-900 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="px-6 pb-6 pt-0 text-gray-700 font-medium leading-relaxed border-t-2 border-gray-100 mt-4">
              Include the <code class="bg-gray-100 px-2 py-1 rounded font-mono text-sm">og:image</code> meta tag in your page's &lt;head&gt; section with the absolute URL of your image.
            </div>
          </details>

          <details class="group bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden transition-all duration-200 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937]">
            <summary class="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 select-none">
              <span>What size should my OG image be?</span>
              <svg class="w-6 h-6 text-gray-900 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="px-6 pb-6 pt-0 text-gray-700 font-medium leading-relaxed border-t-2 border-gray-100 mt-4">
              The recommended size is <strong>1200x630 pixels</strong> (1.91:1 ratio) for Facebook, Twitter, and LinkedIn to ensure optimal display on all devices.
            </div>
          </details>
        </div>
      </section>
    </div>

    <Toast />
    <Footer />
  </main>
</section>

<style>
  :global(body) {
    background-color: #FFFDF8;
  }
  
  /* Ensure color picker is visible */
  :global(.color-picker-dialog),
  :global(.color-picker) {
    z-index: 9999 !important;
  }

  @keyframes loading {
    0% { width: 0%; }
    100% { width: 100%; }
  }
</style>