<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import OgImageTemplate from '$lib/components/tools/OgImageTemplate.svelte';
  import { createImagePublic } from '../../../api/image.js';
  import { onMount } from 'svelte';
  import { toast } from '../../../store/toast.store';
  import ColorPicker from 'svelte-awesome-color-picker';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { user } from '../../../store/user.store';
  import ApiPromptSection from '$lib/components/tools/ApiPromptSection.svelte';
  import { allTemplates, getTemplatesByCategory, getPopularTemplates } from '$lib/templates/linkedin-banner/index.js';
  import { linkedinBannerCategories, LINKEDIN_BANNER_WIDTH, LINKEDIN_BANNER_HEIGHT, SAFE_ZONE } from '$lib/pseo/linkedin-banner.js';

  // Social proof counter
  let totalBannersCreated = 23847;

  // User state - using reactive declaration
  $: isUserLoggedIn = !!$user?.email;

  // Debounce utility
  function debounce(fn, delay = 150) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  // File upload limits
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_IMAGE_DIMENSION = 4000;

  // Fonts
  const popularFontsLinks = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap',
    'https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap'
  ];

  const popularFonts = [
    { id: 'Inter', name: 'Inter', className: 'inter' },
    { id: 'Roboto', name: 'Roboto', className: 'roboto' },
    { id: 'Poppins', name: 'Poppins', className: 'poppins' },
    { id: 'Montserrat', name: 'Montserrat', className: 'montserrat' },
    { id: 'Open Sans', name: 'Open Sans', className: 'open-sans' },
    { id: 'Oswald', name: 'Oswald', className: 'oswald' },
    { id: 'JetBrains Mono', name: 'JetBrains Mono', className: 'jetbrains-mono' }
  ];

  const combinedFonts = popularFonts.map((font, index) => ({
    ...font,
    link: popularFontsLinks[index]
  }));

  // State
  let selectedCategory = 'all';
  let selectedTemplate = null;
  let selectedFont = combinedFonts[0];
  let imageUrl = '';
  let isImageGenerating = false;

  // Editable content
  let heading = '';
  let subheading = '';
  let logoDataUrl = null;

  // Colors
  let backgroundColorRgb = { r: 15, g: 23, b: 42 };
  let headingColorRgb = { r: 248, g: 250, b: 252 };
  let subHeadingColorRgb = { r: 148, g: 163, b: 184 };

  let bannerTemplateWrapper;
  let generationCount = 0;
  let showUpgradePrompt = false;
  let showSafeZone = true;

  // Category icons
  const categoryIcons = {
    code: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>`,
    palette: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>`,
    megaphone: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    briefcase: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    building: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  };

  // Filter templates
  $: filteredTemplates = selectedCategory === 'all'
    ? allTemplates
    : getTemplatesByCategory(selectedCategory);

  // Initialize
  onMount(() => {
    if (allTemplates.length > 0) {
      selectTemplate(getPopularTemplates()[0] || allTemplates[0]);
    }
  });

  // Select a template
  function selectTemplate(template) {
    selectedTemplate = template;

    // Parse template to extract default content and colors
    const parser = new DOMParser();
    const doc = parser.parseFromString(template.html, 'text/html');

    const defaultHeading = doc.querySelector('#template-heading')?.textContent || 'Your Name';
    const defaultSubheading = doc.querySelector('#template-subheading')?.textContent || 'Your Title';

    // Keep existing content if set, otherwise use template defaults
    if (!heading) heading = defaultHeading;
    if (!subheading) subheading = defaultSubheading;

    // Extract colors from CSS variables
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

        if (cssVars['primary-color'] && !cssVars['primary-color'].includes('gradient')) {
          const rgb = extractRGB(cssVars['primary-color']);
          if (rgb) backgroundColorRgb = rgb;
        }
        if (cssVars['secondary-color']) {
          const rgb = extractRGB(cssVars['secondary-color']);
          if (rgb) headingColorRgb = rgb;
        }
        if (cssVars['tertiary-color'] && !cssVars['tertiary-color'].includes('rgba')) {
          const rgb = extractRGB(cssVars['tertiary-color']);
          if (rgb) subHeadingColorRgb = rgb;
        }
      }
    }

    setTimeout(() => {
      updateHTML();
      bannerTemplateWrapper?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  // Update the HTML in the iframe
  async function updateHTML() {
    if (!bannerTemplateWrapper) return;

    const iframe = bannerTemplateWrapper.querySelector('iframe');
    if (!iframe) return;

    // Wait for iframe to be ready
    if (!iframe.contentWindow?.document?.body?.innerHTML) {
      await new Promise((resolve) => {
        iframe.onload = resolve;
      });
    }

    const doc = iframe.contentWindow.document;
    const headingEl = doc.querySelector('#template-heading');
    const subheadingEl = doc.querySelector('#template-subheading');
    const logoEl = doc.querySelector('#template-logo');

    if (headingEl) headingEl.textContent = heading;
    if (subheadingEl) subheadingEl.textContent = subheading;

    if (logoEl && logoDataUrl) {
      const img = doc.createElement('img');
      img.src = logoDataUrl;
      img.style.maxWidth = '120px';
      img.style.height = 'auto';
      img.id = 'template-logo';
      logoEl.replaceWith(img);
    }

    // Update colors
    doc.documentElement.style.setProperty('--primary-color', `rgb(${backgroundColorRgb.r}, ${backgroundColorRgb.g}, ${backgroundColorRgb.b})`);
    doc.documentElement.style.setProperty('--secondary-color', `rgb(${headingColorRgb.r}, ${headingColorRgb.g}, ${headingColorRgb.b})`);
    doc.documentElement.style.setProperty('--tertiary-color', `rgb(${subHeadingColorRgb.r}, ${subHeadingColorRgb.g}, ${subHeadingColorRgb.b})`);

    // Update font - reuse existing link element to prevent accumulation
    let fontLink = doc.querySelector('link[data-font-link]');
    if (!fontLink) {
      fontLink = doc.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.dataset.fontLink = 'true';
      doc.head.appendChild(fontLink);
    }
    fontLink.href = selectedFont.link;
    doc.documentElement.style.fontFamily = selectedFont.id;
  }

  // Debounced HTML update for text inputs
  const debouncedUpdateHTML = debounce(() => updateHTML(), 150);

  // Handle input changes with debouncing
  function handleHeadingChange(event) {
    heading = event.target.value;
    debouncedUpdateHTML();
  }

  function handleSubheadingChange(event) {
    subheading = event.target.value;
    debouncedUpdateHTML();
  }

  function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.set({ message: 'File too large. Maximum size is 5MB.', duration: 3000 });
      return;
    }

    // Validate image dimensions
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
        toast.set({ message: 'Image dimensions too large. Maximum is 4000x4000 pixels.', duration: 3000 });
        return;
      }
      // Valid image, proceed with loading
      const reader = new FileReader();
      reader.onload = (e) => {
        logoDataUrl = e.target.result;
        updateHTML();
      };
      reader.readAsDataURL(file);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      toast.set({ message: 'Invalid image file.', duration: 3000 });
    };
    img.src = URL.createObjectURL(file);
  }

  function updateBackgroundColor(event) {
    backgroundColorRgb = event.detail.rgb;
    updateHTML();
  }

  function updateHeadingColor(event) {
    headingColorRgb = event.detail.rgb;
    updateHTML();
  }

  function updateSubheadingColor(event) {
    subHeadingColorRgb = event.detail.rgb;
    updateHTML();
  }

  function updateFont(font) {
    selectedFont = font;
    updateHTML();
  }

  // Generate image
  async function generateBanner() {
    generationCount++;
    isImageGenerating = true;

    const iframe = bannerTemplateWrapper.querySelector('iframe');
    const doc = iframe.contentWindow.document;
    let html = doc.documentElement.outerHTML;

    // Add watermark for non-logged in users after 2 generations
    if (!isUserLoggedIn && generationCount > 2) {
      const watermarkDiv = `
        <div style="position: fixed; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9);
                    padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 9999;
                    font-family: system-ui, -apple-system, sans-serif;">
          Created with <a href="https://pictify.io" style="color: #ff6b6b; text-decoration: none;">pictify.io</a>
        </div>
      `;
      html = html.replace('</body>', `${watermarkDiv}</body>`);
    }

    try {
      const { image } = await createImagePublic({
        html,
        width: LINKEDIN_BANNER_WIDTH,
        height: LINKEDIN_BANNER_HEIGHT
      });
      imageUrl = image.url;
      totalBannersCreated++;

      if (!isUserLoggedIn && generationCount > 2) {
        showUpgradePrompt = true;
      }
    } catch (error) {
      toast.set({ message: 'Failed to generate banner. Please try again.', duration: 3000 });
    } finally {
      isImageGenerating = false;
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast.set({ message: 'Copied to clipboard!', duration: 1500 });
    });
  }

  function downloadBanner() {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'linkedin-banner.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  let progress = tweened(0, {
    duration: 3000,
    easing: cubicOut
  });

  $: if (isImageGenerating) {
    progress.set(100);
  } else {
    progress.set(0);
  }

  // API example code - uses the generic /image endpoint with HTML
  const apiExampleCode = `curl -X POST https://api.pictify.io/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "html": "<html>...your banner HTML...</html>",
    "width": 1584,
    "height": 396,
    "fileExtension": "png"
  }'`;

  const apiCtaDetails = {
    title: 'Generate LinkedIn banners programmatically',
    description: 'Use our REST API to create personalized LinkedIn banners at scale for your team, platform, or marketing campaigns.',
    featurePoints: [
      'Generate banners dynamically with user data',
      'Serve optimized images from our global CDN',
      'Perfect for employee onboarding and team pages'
    ],
    codeSnippet: apiExampleCode,
    docsUrl: 'https://docs.pictify.io/',
    docsLabel: 'View LinkedIn Banner API docs',
    secondaryCtaLabel: 'See code examples'
  };
</script>

<svelte:head>
  <title>Free LinkedIn Banner Generator | Create Professional Profile Banners | Pictify</title>
  <meta name="description" content="Create stunning LinkedIn banners in seconds. Choose from 20+ professional templates designed for developers, designers, marketers, and more. Perfect 1584x396 dimensions guaranteed." />
  <meta name="keywords" content="linkedin banner generator, linkedin cover photo, linkedin background, profile banner, linkedin header, linkedin banner maker" />

  <meta property="og:title" content="Free LinkedIn Banner Generator | Pictify" />
  <meta property="og:description" content="Create professional LinkedIn banners in seconds. 20+ templates for developers, designers, marketers, and more." />
  <meta property="og:type" content="website" />

  <link rel="canonical" href="https://pictify.io/tools/linkedin-banner-generator" />
</svelte:head>

<Nav />

<main class="min-h-screen bg-[#FFFDF8]">
  <!-- Hero Section -->
  <section class="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto text-center">
      <div class="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
        <span class="w-2 h-2 bg-green-500 rounded-full"></span>
        Free • No Signup Required
      </div>

      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
        Create a Professional<br />
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">LinkedIn Banner</span><br />
        in 60 Seconds
      </h1>

      <p class="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Choose from <span class="font-semibold text-gray-900">{allTemplates.length}+ templates</span> designed for developers,
        marketers, designers, and professionals. Perfect <span class="font-semibold">1584×396</span> dimensions guaranteed.
      </p>

      <div class="flex items-center justify-center gap-2 text-sm text-gray-500">
        <span class="font-semibold text-gray-900">{totalBannersCreated.toLocaleString()}</span> banners created
        <span class="text-yellow-500">★★★★★</span>
        <span>4.9/5 rating</span>
      </div>
    </div>
  </section>

  <!-- Category Filter -->
  <section class="pb-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-wrap justify-center gap-2">
        <button
          on:click={() => selectedCategory = 'all'}
          class="px-4 py-2 rounded-full text-sm font-medium transition-all {selectedCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}"
        >
          All Templates
        </button>
        {#each linkedinBannerCategories as category}
          <button
            on:click={() => selectedCategory = category.id}
            class="px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 {selectedCategory === category.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}"
          >
            {@html categoryIcons[category.icon]}
            {category.label}
          </button>
        {/each}
      </div>
    </div>
  </section>

  <!-- Template Gallery -->
  <section class="pb-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-6xl mx-auto">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each filteredTemplates as template}
          <button
            on:click={() => selectTemplate(template)}
            class="relative group rounded-lg overflow-hidden border-2 transition-all {selectedTemplate?.id === template.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}"
          >
            {#if template.popular}
              <div class="absolute top-2 left-2 z-10 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                Popular
              </div>
            {/if}
            <div class="aspect-[4/1] bg-gray-100">
              <OgImageTemplate
                html={template.html}
                width={LINKEDIN_BANNER_WIDTH}
                height={LINKEDIN_BANNER_HEIGHT}
                scale={0.25}
              />
            </div>
            <div class="p-3 bg-white border-t border-gray-100">
              <p class="text-sm font-medium text-gray-900">{template.name}</p>
              <p class="text-xs text-gray-500 capitalize">{template.category.replace('-', ' ')}</p>
            </div>
          </button>
        {/each}
      </div>
    </div>
  </section>

  <!-- Editor Section -->
  {#if selectedTemplate}
    <section class="pb-12 px-4 sm:px-6 lg:px-8" bind:this={bannerTemplateWrapper}>
      <div class="max-w-6xl mx-auto">
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <!-- Preview Header -->
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex gap-1.5">
                <div class="w-3 h-3 rounded-full bg-red-400"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div class="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span class="text-sm text-gray-600">Preview: {LINKEDIN_BANNER_WIDTH} × {LINKEDIN_BANNER_HEIGHT}px</span>
            </div>
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" bind:checked={showSafeZone} class="rounded" />
                Show safe zone
              </label>
            </div>
          </div>

          <!-- Banner Preview -->
          <div class="relative bg-gray-100">
            <div class="aspect-[4/1] relative">
              <OgImageTemplate
                html={selectedTemplate.html}
                width={LINKEDIN_BANNER_WIDTH}
                height={LINKEDIN_BANNER_HEIGHT}
                scale={0.5}
              />

              <!-- Safe Zone Overlay -->
              {#if showSafeZone}
                <div
                  class="absolute pointer-events-none z-10"
                  style="
                    left: 0;
                    bottom: 0;
                    width: calc({SAFE_ZONE.width}px * 0.5);
                    height: calc({SAFE_ZONE.height}px * 0.5);
                    border: 2px dashed #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                    border-radius: 0 100% 0 0;
                  "
                >
                  <div class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                    Profile Photo
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Controls -->
          <div class="p-6 border-t border-gray-200">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Text Inputs -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Your Name / Headline</label>
                  <input
                    type="text"
                    bind:value={heading}
                    on:input={handleHeadingChange}
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Title / Description</label>
                  <input
                    type="text"
                    bind:value={subheading}
                    on:input={handleSubheadingChange}
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your Title"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Logo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    on:change={handleLogoUpload}
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:font-medium"
                  />
                </div>
              </div>

              <!-- Style Controls -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Font</label>
                  <div class="flex flex-wrap gap-2">
                    {#each combinedFonts as font}
                      <button
                        on:click={() => updateFont(font)}
                        class="px-3 py-2 text-sm border rounded-lg transition-all {selectedFont.id === font.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}"
                        style="font-family: {font.id}"
                      >
                        {font.name}
                      </button>
                    {/each}
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Background</label>
                    <ColorPicker
                      bind:rgb={backgroundColorRgb}
                      on:input={updateBackgroundColor}
                      isPopup={true}
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Heading</label>
                    <ColorPicker
                      bind:rgb={headingColorRgb}
                      on:input={updateHeadingColor}
                      isPopup={true}
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Subheading</label>
                    <ColorPicker
                      bind:rgb={subHeadingColorRgb}
                      on:input={updateSubheadingColor}
                      isPopup={true}
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Generate Button -->
            <div class="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button
                on:click={generateBanner}
                disabled={isImageGenerating}
                class="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {#if isImageGenerating}
                  <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                {:else}
                  Generate Banner
                {/if}
              </button>
            </div>

            <!-- Progress Bar -->
            {#if isImageGenerating}
              <div class="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all" style="width: {$progress}%"></div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </section>
  {/if}

  <!-- Result Section -->
  {#if imageUrl}
    <section class="pb-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div class="p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Your LinkedIn Banner is Ready!</h3>

            <div class="aspect-[4/1] rounded-lg overflow-hidden mb-6 border border-gray-200">
              <img src={imageUrl} alt="Generated LinkedIn Banner" class="w-full h-full object-cover" />
            </div>

            <!-- Watermark Notice -->
            {#if !isUserLoggedIn && generationCount > 2}
              <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
                <p class="font-bold text-yellow-800">Free downloads include a small Pictify watermark</p>
                <p class="text-sm text-yellow-700 mt-1">Sign up free to download without watermark</p>
                <a href="/signup" class="inline-block mt-3 px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors">
                  Remove Watermark Free
                </a>
              </div>
            {/if}

            <div class="flex flex-wrap gap-3">
              <button
                on:click={downloadBanner}
                class="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </button>
              <button
                on:click={() => copyToClipboard(imageUrl)}
                class="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy URL
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  {/if}

  <!-- How to Use Section -->
  <section class="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">How to Add Your Banner to LinkedIn</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
          <h3 class="font-bold text-gray-900 mb-2">Create Your Banner</h3>
          <p class="text-gray-600 text-sm">Choose a template, customize it with your details, and download</p>
        </div>
        <div class="text-center">
          <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
          <h3 class="font-bold text-gray-900 mb-2">Go to LinkedIn</h3>
          <p class="text-gray-600 text-sm">Open your LinkedIn profile and click the camera icon on your cover photo</p>
        </div>
        <div class="text-center">
          <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
          <h3 class="font-bold text-gray-900 mb-2">Upload & Save</h3>
          <p class="text-gray-600 text-sm">Upload your banner and adjust the positioning if needed</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Dimensions Info -->
  <section class="py-16 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">LinkedIn Banner Size Guide</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 class="font-semibold text-gray-900 mb-3">Recommended Dimensions</h3>
            <ul class="space-y-2 text-gray-600">
              <li class="flex items-center gap-2">
                <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Personal Profile: <strong>1584 x 396 pixels</strong>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Company Page: <strong>1128 x 191 pixels</strong>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Aspect Ratio: <strong>4:1</strong>
              </li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 mb-3">Important Notes</h3>
            <ul class="space-y-2 text-gray-600">
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Profile photo overlaps the bottom-left corner (~250x200px area)</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Keep important text and elements away from the safe zone</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- API Section -->
  <ApiPromptSection
    title={apiCtaDetails.title}
    description={apiCtaDetails.description}
    featurePoints={apiCtaDetails.featurePoints}
    codeSnippet={apiCtaDetails.codeSnippet}
    docsUrl={apiCtaDetails.docsUrl}
    docsLabel={apiCtaDetails.docsLabel}
    secondaryCtaLabel={apiCtaDetails.secondaryCtaLabel}
  />
</main>

<Footer />

<style>
  :global(.color-picker) {
    --picker-width: 100%;
  }
</style>
