<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import OgImageTemplate from '$lib/components/tools/OgImageTemplate.svelte';
  import {getTemplate, getWebsiteInfo} from '../../../api/tools/og-image';
  import { createImagePublic } from '../../../api/image.js';
  import { onMount } from 'svelte';
  import { toast } from '../../../store/toast.store';
  import { page } from '$app/stores';
  import ColorPicker from 'svelte-awesome-color-picker';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { user } from '../../../store/user.store';
  import { ogPlatforms, popularSizes as configPopularSizes, platformGuides, platformRecommendedSizes, parseSize } from '$lib/pseo/config.js';
  import ApiPromptSection from '$lib/components/tools/ApiPromptSection.svelte';
  import NextSteps from '$lib/components/tools/NextSteps.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import ExitIntentPopup from '$lib/components/tools/ExitIntentPopup.svelte';
  import GenerationLimitBanner from '$lib/components/tools/GenerationLimitBanner.svelte';
  import { generationLimits } from '../../../store/generationLimits.store';
  import { analytics } from '$lib/analytics.js';

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
    // Track tool opened
    analytics.trackToolOpened({ tool_name: 'og_image_generator' });

    templates = await Promise.all(templateNames.map(async(name) => {
      const template = await getTemplate(name);
      return template;
    }));

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
			toast.set({ message: 'URL copied to clipboard! 🔗', type: 'success', duration: 1500 });
		});
	}

  function buildCurlSnippetFromHtml(html, width, height) {
    const payload = {
      html: String(html || ''),
      width: Number(width) || 1200,
      height: Number(height) || 630
    };
    return `curl -X POST https://api.pictify.io/image \\\\\n  -H "Content-Type: application/json" \\\\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\\\n  -d '${JSON.stringify(payload, null, 2)}'`;
  }

  function getCurrentOgHtml() {
    try {
      const iframe = ogImageTemplateWrapper?.querySelector?.('iframe');
      return iframe?.contentWindow?.document?.documentElement?.outerHTML || '';
    } catch (e) {
      return '';
    }
  }

  $: nextStepsCurlSnippet = buildCurlSnippetFromHtml(getCurrentOgHtml(), previewWidth, previewHeight);
  $: nextStepsTemplateDraft = imageUrl ? {
    version: 1,
    name: isPlatform ? `OG template (${platformLabel})` : 'OG template',
    type: 'og-image',
    width: previewWidth,
    height: previewHeight,
    backgroundImageUrl: imageUrl,
    source: 'og-image-generator'
  } : null;

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
    // Track generation in the limits store
    generationLimits.increment();
    generationCount++;

    isImageGenerating = true;
    const iframe = ogImageTemplateWrapper.querySelector('iframe');
    const document = iframe.contentWindow.document;
    let html = document.documentElement.outerHTML;

    // Add watermark for ALL non-logged in users (not just after 2 generations)
    if (!isUserLoggedIn) {
      const watermarkDiv = `
        <div style="position: fixed; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9);
                    padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 9999;
                    font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          Created with <a href="https://pictify.io" style="color: #ff6b6b; text-decoration: none; font-weight: 600;">pictify.io</a>
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

      // Track image generation
      analytics.trackImageGenerated({
        tool_name: 'og_image_generator',
        format: 'png',
        with_watermark: !isUserLoggedIn,
      });

      // Increment total images counter
      totalImagesGenerated++;

      // Show upgrade prompt after 2 generations
      if (!isUserLoggedIn && generationCount >= 2) {
        showUpgradePrompt = true;
      }

    } catch (error) {
      toast.set({ message: 'Failed to generate image. Please try again.', type: 'error', duration: 3000 });
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

<section class="w-full min-h-screen bg-[#FFFDF8] relative overflow-x-hidden font-['Manrope']">
  <Nav />
  
  <!-- Background Elements -->
  <div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"></div>
  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
  <div class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ff6b6b]/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

  <main class="w-full max-w-7xl mx-auto px-6 pt-12 pb-20 md:pt-24 md:pb-32 relative z-10">
    
    <!-- Breadcrumb -->
    <nav class="mb-12 flex justify-center">
      <ol class="inline-flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937]">
        <li><a href="/" class="text-gray-500 hover:text-gray-900 transition-colors">Home</a></li>
        <li class="text-gray-300">/</li>
        <li><a href="/tools" class="text-gray-500 hover:text-gray-900 transition-colors">Tools</a></li>
        <li class="text-gray-300">/</li>
        <li class="text-gray-900">OG Image Generator</li>
      </ol>
    </nav>

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
        <span class="block sm:inline">OG IMAGE</span>
        <span class="relative inline-block text-white mt-1 sm:mt-2 md:mt-0 md:ml-3">
          <span class="relative z-10 px-2 sm:px-3 md:px-4">GENERATOR</span>
          <span class="absolute inset-0 bg-[#ff6b6b] transform -skew-x-3 border-[3px] sm:border-[4px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] -z-0"></span>
        </span>
        {#if isPlatform}
          <span class="block mt-2 sm:mt-4">
            <span class="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-gray-900 bg-white border-[2px] sm:border-[3px] border-black px-2 sm:px-3 py-1 shadow-[3px_3px_0_0_#000] sm:shadow-[4px_4px_0_0_#000]">
              for {platformLabel}
            </span>
          </span>
        {/if}
      </h1>

      <!-- Description -->
      <div class="max-w-2xl mx-auto px-2">
        <p class="text-base sm:text-lg md:text-xl text-gray-800 font-bold leading-relaxed border-[3px] border-black bg-white p-4 sm:p-6 shadow-[4px_4px_0_0_#e5e7eb] sm:shadow-[8px_8px_0_0_#e5e7eb]">
          Create stunning <span class="bg-[#ffc480] px-1 border-b-[2px] sm:border-b-[3px] border-black">Open Graph images</span> for your website.
          <span class="text-gray-500 text-sm sm:text-base mt-2 sm:mt-3 block font-semibold">Boost social media engagement with custom social cards</span>
        </p>
      </div>
    </div>

    <!-- Creation Mode Selector -->
    <div class="w-full max-w-5xl mx-auto mb-16 relative px-2 md:px-0">
      <div class="absolute inset-0 bg-black translate-x-3 translate-y-3 hidden md:block border-[3px] border-black"></div>
      
      <div class="relative border-[3px] md:border-[4px] border-black bg-white">
        <!-- Window Header -->
        <div class="bg-black text-white px-4 py-3 flex justify-between items-center border-b-[3px] md:border-b-[4px] border-black">
          <h3 class="font-bold font-mono tracking-widest text-xs md:text-sm uppercase flex items-center gap-2">
            <span class="animate-pulse">_</span> SELECT_MODE
          </h3>
          <div class="flex gap-2">
            <div class="w-3 h-3 bg-[#ff6b6b] border border-black"></div>
            <div class="w-3 h-3 bg-[#ffc480] border border-black"></div>
            <div class="w-3 h-3 bg-[#4ade80] border border-black"></div>
          </div>
        </div>

        <div class="p-6 md:p-8 bg-[#f8f9fa]">
          <!-- Mode Toggle -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button
              class="group relative w-full"
              on:click={() => { creationMode = 'website'; websiteInfo = null; }}
            >
              <div 
                class={`px-6 py-5 border-[3px] border-black transition-all duration-200 flex flex-col items-center gap-2
                ${creationMode === 'website' 
                  ? 'bg-[#4ade80] shadow-[4px_4px_0_0_#000] translate-x-[-2px] translate-y-[-2px]' 
                  : 'bg-white hover:bg-gray-50 shadow-[4px_4px_0_0_#ccc] hover:shadow-[4px_4px_0_0_#000]'}`}
              >
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                <span class="font-black text-lg uppercase tracking-tight">From Website</span>
                <span class="text-xs font-bold text-gray-500">Extract info automatically</span>
              </div>
            </button>
            <button
              class="group relative w-full"
              on:click={() => { creationMode = 'direct'; createDirectOgImage(); }}
            >
              <div 
                class={`px-6 py-5 border-[3px] border-black transition-all duration-200 flex flex-col items-center gap-2
                ${creationMode === 'direct' 
                  ? 'bg-[#4ade80] shadow-[4px_4px_0_0_#000] translate-x-[-2px] translate-y-[-2px]' 
                  : 'bg-white hover:bg-gray-50 shadow-[4px_4px_0_0_#ccc] hover:shadow-[4px_4px_0_0_#000]'}`}
              >
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <span class="font-black text-lg uppercase tracking-tight">Create Directly</span>
                <span class="text-xs font-bold text-gray-500">Design from scratch</span>
              </div>
            </button>
          </div>

          {#if creationMode === 'website'}
            <!-- Website URL Input -->
            <div class="border-t-[3px] border-dashed border-gray-300 pt-8">
              <h4 class="font-black text-lg mb-4 uppercase tracking-tight flex items-center gap-3">
                <span class="w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-bold border-[2px] border-black shadow-[3px_3px_0_0_#9ca3af]">01</span>
                Enter Website URL
              </h4>
              <div class="flex flex-col md:flex-row gap-4">
                <input
                  bind:value={url}
                  type="text"
                  class="flex-1 border-[3px] border-black placeholder-gray-400 text-lg font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] py-4 px-5 transition-all bg-white"
                  placeholder="https://yourwebsite.com"
                  on:keydown={(e) => e.key === 'Enter' && submitUrl(url)}
                />
                <button
                  on:click={() => submitUrl(url)}
                  disabled={isFetchingWebsiteInfo}
                  class="py-4 px-8 bg-[#ffc480] border-[3px] border-black font-black uppercase tracking-wide text-black shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {#if isFetchingWebsiteInfo}
                    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Fetching...
                  {:else}
                    Fetch Info
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  {/if}
                </button>
              </div>
              {#if error}
                <div class="mt-4 p-4 bg-[#ff6b6b]/10 border-[3px] border-[#ff6b6b] text-[#ff6b6b] font-bold flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              {/if}
            </div>
          {:else}
            <div class="border-t-[3px] border-dashed border-gray-300 pt-8">
              <div class="bg-[#4ade80]/10 border-[3px] border-[#4ade80] p-6 text-center">
                <p class="text-black font-bold text-lg">
                  ✓ Select a template below to start designing
                </p>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Generation Limit Banner -->
    <GenerationLimitBanner />

    <!-- Editor Section -->
    {#if websiteInfo && selectedTemplate}
      <div class="w-full max-w-5xl mx-auto mb-20 relative px-2 md:px-0" bind:this={ogImageTemplateWrapper}>
        <div class="border-[3px] md:border-[4px] border-black bg-white shadow-[8px_8px_0_0_#000]">
          <!-- Editor Header -->
          <div class="bg-black text-white px-4 py-3 flex justify-between items-center border-b-[3px] md:border-b-[4px] border-black">
            <h3 class="font-bold font-mono tracking-widest text-xs md:text-sm uppercase">/// CUSTOMIZE_IMAGE</h3>
            <div class="flex gap-2">
              <div class="w-3 h-3 bg-[#ff6b6b] border border-white/20"></div>
              <div class="w-3 h-3 bg-[#ffc480] border border-white/20"></div>
              <div class="w-3 h-3 bg-[#4ade80] border border-white/20"></div>
            </div>
          </div>

          <!-- Preview Section -->
          <div class="p-6 md:p-8 bg-gray-100 border-b-[3px] border-black">
            <div class="flex justify-center items-center">
              <div class="border-[3px] border-black shadow-[6px_6px_0_0_#000] overflow-hidden bg-white">
                <OgImageTemplate html={typeof selectedTemplate === 'string' ? selectedTemplate : selectedTemplate.html} width={1200} height={630} scale={0.5} />
              </div>
            </div>
          </div>

          <!-- Editor Controls -->
          <div class="p-6 md:p-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <!-- Logo Section -->
              <div class="space-y-4">
                <h4 class="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                  <span class="w-8 h-8 bg-[#ffc480] flex items-center justify-center border-[2px] border-black shadow-[2px_2px_0_0_#000]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </span>
                  Logo
                </h4>
                <div class="p-4 bg-gray-50 border-[3px] border-gray-200 space-y-4">
                  {#if websiteInfo.logo}
                    <div class="bg-white p-4 border-[2px] border-gray-200 flex justify-center">
                      {#if websiteInfo.logo.startsWith('<svg')}
                        <div style="width: 120px;">{@html websiteInfo.logo}</div>
                      {:else}
                        <img src={websiteInfo.logo} style="width: 120px;" alt="Logo" class="object-contain"/>
                      {/if}
                    </div>
                  {/if}
                  <input type="file" class="hidden" id="logoInput" accept="image/*" on:change={updateLogo} />
                  <label for="logoInput" class="block w-full px-4 py-3 bg-white border-[3px] border-black text-black font-bold cursor-pointer hover:bg-gray-50 hover:shadow-[4px_4px_0_0_#000] transition-all text-center uppercase tracking-wide">
                    Upload Logo
                  </label>
                  <div class="space-y-2">
                    <span class="text-xs font-bold text-gray-500 uppercase">Logo Width: {logoWidth}px</span>
                    <input type="range" min="50" max="400" class="w-full h-2 bg-gray-200 appearance-none cursor-pointer accent-[#ff6b6b]" value={logoWidth} on:input={updateLogoWidth} />
                  </div>
                </div>
              </div>

              <!-- Content Section -->
              <div class="space-y-4">
                <h4 class="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                  <span class="w-8 h-8 bg-[#ff6b6b] text-white flex items-center justify-center border-[2px] border-black shadow-[2px_2px_0_0_#000]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </span>
                  Content
                </h4>
                <div class="space-y-4">
                  <div>
                    <label for="og-heading" class="text-xs font-bold text-gray-500 uppercase block mb-2">Heading</label>
                    <input id="og-heading" type="text" class="w-full border-[3px] border-gray-200 text-lg font-bold focus:outline-none focus:border-black focus:shadow-[4px_4px_0_0_#ffc480] py-3 px-4 transition-all" placeholder="Enter heading" value={websiteInfo.heading} on:input={updateHeading} />
                  </div>
                  <div>
                    <label for="og-description" class="text-xs font-bold text-gray-500 uppercase block mb-2">Description</label>
                    <textarea id="og-description" class="w-full border-[3px] border-gray-200 text-base font-medium focus:outline-none focus:border-black focus:shadow-[4px_4px_0_0_#ffc480] py-3 px-4 transition-all resize-none" rows="3" value={websiteInfo.subHeading} on:input={updateSubHeading}></textarea>
                  </div>
                </div>
              </div>

              <!-- Style Section -->
              <div class="space-y-4 lg:col-span-2">
                <h4 class="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                  <span class="w-8 h-8 bg-[#4ade80] flex items-center justify-center border-[2px] border-black shadow-[2px_2px_0_0_#000]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
                  </span>
                  Style
                </h4>
                <div class="p-4 bg-gray-50 border-[3px] border-gray-200">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label for="og-font" class="text-xs font-bold text-gray-500 uppercase block mb-2">Font</label>
                      <select id="og-font" class="w-full border-[3px] border-gray-200 text-base font-bold focus:outline-none focus:border-black py-3 px-4 bg-white appearance-none cursor-pointer" on:change={(e) => updateFont(combinedFonts[e.target.selectedIndex])}>
                        {#each combinedFonts as font}
                          <option value={font.id}>{font.name}</option>
                        {/each}
                      </select>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-gray-500 uppercase block mb-2">Background</div>
                      <div class="color-picker-wrapper">
                        <ColorPicker bind:rgb={backgroundColorRgb} isDialog={true} on:input={updateBackgroundColor} />
                      </div>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-gray-500 uppercase block mb-2">Text Color</div>
                      <div class="color-picker-wrapper">
                        <ColorPicker bind:rgb={headingColorRgb} isDialog={true} on:input={updateHeadingColor} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Generated Image Result -->
          {#if imageUrl}
            <div class="border-t-[3px] border-black bg-[#4ade80] p-6 md:p-8">
              <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div class="flex items-center gap-3">
                  <svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                  <span class="font-black text-black uppercase tracking-wide">Image Generated Successfully!</span>
                </div>
                <div class="flex gap-3">
                  <button on:click={() => copyToClipboard(imageUrl)} class="px-4 py-2 bg-black text-white font-bold uppercase text-sm border-[2px] border-black hover:bg-white hover:text-black transition-colors">
                    Copy URL
                  </button>
                  <a href={imageUrl} download="og-image.png" target="_blank" class="px-4 py-2 bg-white text-black font-bold uppercase text-sm border-[2px] border-black hover:bg-black hover:text-white transition-colors">
                    Download
                  </a>
                </div>
              </div>
              <div class="border-[3px] border-black bg-white p-2">
                <img src={imageUrl} alt="Generated OG" class="w-full" />
              </div>

              <NextSteps
                heading="Next steps"
                description="Copy the API request, save this as a reusable template background, and batch render variants."
                curlSnippet={nextStepsCurlSnippet}
                templateDraft={nextStepsTemplateDraft}
                generatedUrl={imageUrl}
                toolName="OG Image Generator"
              />
            </div>
          {/if}

          <!-- Generate Button -->
          <div class="p-6 md:p-8 border-t-[3px] border-black bg-gradient-to-br from-[#FFFDF8] to-[#fff5e6]">
            <button
              on:click={generateImage}
              disabled={isImageGenerating}
              class="relative w-full max-w-md mx-auto block py-4 md:py-5 bg-[#ff6b6b] border-[3px] md:border-[4px] border-black shadow-[6px_6px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div class="flex items-center justify-center gap-3 md:gap-4">
                {#if isImageGenerating}
                  <svg class="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span class="font-black text-lg md:text-2xl text-white uppercase tracking-tight">Generating...</span>
                {:else}
                  <span class="font-black text-lg md:text-2xl text-white uppercase tracking-tight group-hover:scale-105 transition-transform">Generate Image</span>
                  <svg class="w-5 h-5 md:w-6 md:h-6 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                {/if}
              </div>
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Templates Grid -->
    <div class="w-full max-w-5xl mx-auto mb-20">
      <div class="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 px-2 md:px-0">
        <h2 class="text-3xl md:text-4xl font-black text-black uppercase tracking-tighter">
          {isPlatform ? `Templates for ${platformLabel}` : 'Choose Template'}
        </h2>
        {#if !isUserLoggedIn}
          <a href="/signup" class="font-bold text-black hover:text-[#ff6b6b] transition-colors flex items-center gap-1 uppercase tracking-wide text-sm border-b-[2px] border-black pb-1">
            View All Templates →
          </a>
        {/if}
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 md:px-0">
        {#each templates.slice(0, 6) as template, i}
          <div 
            class="group bg-white border-[3px] border-black overflow-hidden shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all duration-200 cursor-pointer"
            on:click={() => selectTemplate(template)}
            on:keydown={(e) => e.key === 'Enter' && selectTemplate(template)}
            role="button"
            tabindex="0"
          >
            <div class="p-2 bg-gray-100 border-b-[3px] border-black flex gap-1.5">
              <div class="w-2.5 h-2.5 bg-[#ff6b6b] border border-black"></div>
              <div class="w-2.5 h-2.5 bg-[#ffc480] border border-black"></div>
              <div class="w-2.5 h-2.5 bg-[#4ade80] border border-black"></div>
            </div>
            <div class="relative bg-white overflow-hidden" style="height: 180px;">
              <OgImageTemplate html={typeof template === 'string' ? template : template.html} width={1200} height={630} scale={0.3} />
              
              <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                <span class="px-5 py-2 bg-white text-black font-black uppercase text-sm border-[3px] border-black shadow-[3px_3px_0_0_#ff6b6b]">
                  Use This
                </span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

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
        secondaryCtaUrl="https://docs.pictify.io/examples"
        note="Contact us for volume pricing or dedicated rendering regions."
      />
    </section>

    <!-- Info Sections -->
    <div class="max-w-5xl mx-auto px-2 md:px-0">
      
      <!-- What is OG Image -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <div class="border-[3px] border-black bg-white p-6 md:p-8 shadow-[6px_6px_0_0_#9ca3af]">
          <div class="w-12 h-12 bg-[#ffc480] border-[3px] border-black flex items-center justify-center mb-6 shadow-[3px_3px_0_0_#000]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          </div>
          <h3 class="text-2xl font-black mb-4 text-black uppercase">What is an OG Image?</h3>
          <p class="text-black font-medium leading-relaxed">
            An OG (Open Graph) image is the preview that appears when your content is shared on social media. It's your first impression—make it count with professional designs.
          </p>
        </div>

        <div class="border-[3px] border-black bg-white p-6 md:p-8 shadow-[6px_6px_0_0_#9ca3af]">
          <div class="w-12 h-12 bg-[#ff6b6b] border-[3px] border-black flex items-center justify-center mb-6 shadow-[3px_3px_0_0_#000]">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h3 class="text-2xl font-black mb-4 text-black uppercase">Why Use This Tool?</h3>
          <ul class="space-y-3">
            <li class="flex items-center gap-3 font-bold text-black">
              <div class="w-2 h-2 bg-black"></div>
              Create pro images in minutes
            </li>
            <li class="flex items-center gap-3 font-bold text-black">
              <div class="w-2 h-2 bg-black"></div>
              Match your brand perfectly
            </li>
            <li class="flex items-center gap-3 font-bold text-black">
              <div class="w-2 h-2 bg-black"></div>
              Boost CTR by up to 40%
            </li>
          </ul>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="border-[3px] border-black bg-white p-6 md:p-8 shadow-[8px_8px_0_0_#9ca3af] mb-16">
        <h2 class="text-3xl font-black mb-8 text-black uppercase">FAQ</h2>
        <div class="space-y-4">
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer bg-white p-4 border-[3px] border-black transition-all hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
              <span class="font-black text-lg text-gray-900 uppercase">How do I add an OG image?</span>
              <span class="border-[2px] border-black p-1 bg-black text-white group-open:bg-white group-open:text-black transition-colors">
                <svg class="h-4 w-4 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
              </span>
            </summary>
            <div class="mt-0 p-4 border-l-[3px] border-r-[3px] border-b-[3px] border-black bg-gray-50 text-black font-medium">
              Add the <code class="bg-gray-200 px-2 py-1 font-mono text-sm">og:image</code> meta tag in your page's &lt;head&gt; section with the absolute URL of your image.
            </div>
          </details>

          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer bg-white p-4 border-[3px] border-black transition-all hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
              <span class="font-black text-lg text-gray-900 uppercase">What size should it be?</span>
              <span class="border-[2px] border-black p-1 bg-black text-white group-open:bg-white group-open:text-black transition-colors">
                <svg class="h-4 w-4 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
              </span>
            </summary>
            <div class="mt-0 p-4 border-l-[3px] border-r-[3px] border-b-[3px] border-black bg-gray-50 text-black font-medium">
              The recommended size is <strong>1200×630 pixels</strong> (1.91:1 ratio) for optimal display on Facebook, Twitter, and LinkedIn.
            </div>
          </details>

          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer bg-white p-4 border-[3px] border-black transition-all hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
              <span class="font-black text-lg text-gray-900 uppercase">Is there an API?</span>
              <span class="border-[2px] border-black p-1 bg-black text-white group-open:bg-white group-open:text-black transition-colors">
                <svg class="h-4 w-4 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
              </span>
            </summary>
            <div class="mt-0 p-4 border-l-[3px] border-r-[3px] border-b-[3px] border-black bg-gray-50 text-black font-medium">
              Yes! Use our REST API to generate OG images programmatically. Perfect for blogs, e-commerce, and SaaS platforms.
            </div>
          </details>
        </div>
      </div>
    </div>

  </main>
  <Footer />
  <Toast />

  <!-- Exit Intent Popup for lead capture -->
  <ExitIntentPopup toolName="OG Image Generator" generatedImageUrl={imageUrl} />
</section>

<style>
  .color-picker-wrapper {
    position: relative;
    border: 3px solid #e5e7eb;
    background: white;
  }

  .color-picker-wrapper :global(.color-picker) {
    width: 100% !important;
  }

  .color-picker-wrapper :global(.picker-wrapper) {
    position: relative !important;
  }

  :global(.color-picker-dialog),
  :global(.picker-dialog) {
    z-index: 9999 !important;
    position: fixed !important;
  }

  :global(.color-picker),
  :global(.picker-indicator) {
    z-index: 100 !important;
  }
</style>
