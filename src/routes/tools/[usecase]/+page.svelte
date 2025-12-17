<script>
import Nav from '$lib/components/landingPage/Nav.svelte';
import Footer from '$lib/components/landingPage/Footer.svelte';
import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';
import NextSteps from '$lib/components/tools/NextSteps.svelte';
import { page } from '$app/stores';
import { useCases, useCaseDetails, formats, popularSizes, baseFormatUrl, sizeUrl, parseSize } from '$lib/pseo/config.js';
import { getTemplateForUseCase } from '$lib/pseo/useCaseTemplates.js';
import { goto } from '$app/navigation';
import { onMount } from 'svelte';
import { user } from '../../../store/user.store';
import { toast } from '../../../store/toast.store';
import backend from '../../../service/backend';

$: useCaseId = $page.params.usecase;
$: config = useCaseDetails[useCaseId];
$: useCase = config ? useCases.find((u) => u.id === useCaseId) : null;
$: validCase = !!useCase;
$: title = validCase ? `${config.label} | Pictify.io` : 'Use Case | Pictify.io';
$: description = validCase
  ? config.description
  : 'Convert HTML to images instantly with Pictify.io.';
$: canonical = validCase
  ? `https://pictify.io/tools/${useCaseId}`
  : 'https://pictify.io/tools';

const DRAFT_KEY = 'pictify_template_draft_v1';

// Generation state
let isGenerating = false;
let generatedImageUrl = '';
let generationError = '';

function openInCanvasEditor() {
  if (!validCase) return;
  const label = config?.label || useCase?.label || useCaseId;
  const draft = getTemplateForUseCase(useCaseId, label);
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {}

  if ($user?.email) {
    goto('/template-workspace/create');
  } else {
    goto(`/canvas/try?usecase=${useCaseId}`);
  }
}

// Quick generate from template
// Uses public endpoint (no auth required, rate limited)
async function handleQuickGenerate() {
  if (!template?.fabricJSData) {
    toast.set({ message: 'No template data available', duration: 2000 });
    return;
  }

  isGenerating = true;
  generationError = '';
  generatedImageUrl = '';

  try {
    // Use public canvas endpoint (no auth required, rate limited)
    const response = await backend.post('/image/public/canvas', {
      fabricJSData: template.fabricJSData,
      width: templateWidth,
      height: templateHeight,
      fileExtension: 'png'
    });

    if (response?.url) {
      generatedImageUrl = response.url;
      toast.set({ message: 'Image generated successfully!', duration: 2000 });
    } else {
      throw new Error('No image URL in response');
    }
  } catch (e) {
    console.error('Generation failed:', e);
    // Handle rate limit error
    if (e.message?.includes('rate') || e.status === 429) {
      generationError = 'Too many requests. Please wait a moment and try again.';
    } else {
      generationError = e.message || 'Failed to generate image';
    }
    toast.set({ message: generationError, duration: 3000 });
  } finally {
    isGenerating = false;
  }
}

// Template preview generation
let previewCanvasEl;
let fabricCanvas;
let previewLoading = true;

$: template = validCase ? getTemplateForUseCase(useCaseId, config?.label || useCaseId) : null;
$: templateWidth = template?.width || 1200;
$: templateHeight = template?.height || 630;

onMount(async () => {
  if (template?.fabricJSData) {
    await loadFabricAndRenderPreview();
  }
});

async function loadFabricAndRenderPreview() {
  previewLoading = true;
  try {
    // Dynamically load FabricJS
    if (!window.fabric) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    // Wait for the canvas element to be available
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (previewCanvasEl && window.fabric) {
      // Calculate scale to fit container (max width ~600px for nice display)
      const maxWidth = 600;
      const scale = Math.min(1, maxWidth / templateWidth);
      const displayWidth = templateWidth * scale;
      const displayHeight = templateHeight * scale;
      
      // Set canvas size
      previewCanvasEl.width = displayWidth;
      previewCanvasEl.height = displayHeight;
      
      // Create FabricJS canvas
      fabricCanvas = new window.fabric.StaticCanvas(previewCanvasEl);
      fabricCanvas.setWidth(displayWidth);
      fabricCanvas.setHeight(displayHeight);
      
      // Load the JSON data
      fabricCanvas.loadFromJSON(template.fabricJSData, () => {
        // Scale all objects to fit
        fabricCanvas.setZoom(scale);
        fabricCanvas.renderAll();
        previewLoading = false;
      });
    }
  } catch (err) {
    console.error('Failed to load FabricJS preview:', err);
    previewLoading = false;
  }
}

// Escape HTML for code display
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
    .replace(/^curl/m, '<span class="token-command">curl</span>')
    .replace(/ (-H|-d)/g, (match) => ` <span class="token-flag">${match.trim()}</span>`)
    .replace(/https:\/\/[^\s\\]+/g, (match) => `<span class="token-url">${match}</span>`)
    .replace(/'([^']*)'/g, (match) => `<span class="token-string">${match}</span>`)
    .replace(/\n/g, '<br>');
}

$: renderedApiCode = highlightCurl(apiSnippet);

$: formatOptions = config && config.recommendedFormats && config.recommendedFormats.length
  ? config.recommendedFormats
  : formats.map((f) => f.id);
$: sizeOptions = config && config.recommendedSizes && config.recommendedSizes.length
  ? config.recommendedSizes
  : popularSizes;
$: primarySizeFormat = ((formatOptions && formatOptions.length && String(formatOptions[0]).toLowerCase()) || 'jpg');

// Structured data for SEO
$: structuredData = validCase ? {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: `${config.label} - Pictify.io`,
  url: canonical,
  description: config.description,
  applicationCategory: ['DesignApplication', 'ImageGenerator'],
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock'
  },
  featureList: config.benefits || [],
  creator: {
    '@type': 'Organization',
    name: 'Pictify.io',
    url: 'https://pictify.io'
  }
} : null;

// API example snippet
$: apiSnippet = `curl -X POST https://api.pictify.io/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "html": "<your-template-html>",
    "width": ${sizeOptions[0] ? parseSize(sizeOptions[0]).width || 1200 : 1200},
    "height": ${sizeOptions[0] ? parseSize(sizeOptions[0]).height || 630 : 630},
    "fileExtension": "${formatOptions[0] || 'png'}"
  }'`;

// Template draft for NextSteps
$: templateDraft = template ? {
  version: 1,
  name: config?.label || useCaseId,
  type: 'custom',
  width: templateWidth,
  height: templateHeight,
  fabricJSData: template.fabricJSData,
  source: `workflow-${useCaseId}`
} : null;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description}>
  <link rel="canonical" href={canonical}>
  <meta name="keywords" content="{config?.label || 'HTML to Image'}, image generator, automation, Pictify, API">
  
  <!-- Open Graph -->
  <meta property="og:title" content={title}>
  <meta property="og:description" content={description}>
  <meta property="og:url" content={canonical}>
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://pictify.io/og-image-tools.jpg">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content={title}>
  <meta name="twitter:description" content={description}>
  <meta name="twitter:image" content="https://pictify.io/og-image-tools.jpg">
  
  {#if structuredData}
    <script type="application/ld+json">
      {JSON.stringify(structuredData)}
    </script>
  {/if}
</svelte:head>

<section class="w-full min-h-screen bg-[#FFFDF8] relative overflow-hidden font-['Manrope']">
  <Nav />
  
  <!-- Background Elements -->
  <div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"></div>
  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
  <div class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ff6b6b]/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

  <main class="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-20 md:pb-32 relative z-10">
    {#if validCase}
      <!-- Hero Section -->
      <div class="relative flex flex-col items-center justify-center text-center mb-12 sm:mb-16 lg:mb-20 pt-4 sm:pt-8">

        <!-- Badge -->
        <div class="inline-flex transform -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-default mb-4 sm:mb-6">
          <div class="px-4 sm:px-6 py-1.5 sm:py-2 bg-[#ffc480] border-[3px] sm:border-[4px] border-black text-black font-black text-xs sm:text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            ★ Workflow
          </div>
        </div>

        <!-- Main Title -->
        <h1 class="relative z-10 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-tight mb-4 sm:mb-6">
          <span class="relative inline-block text-white">
            <span class="relative z-10 px-2 sm:px-3 md:px-4">{config.label}</span>
            <span class="absolute inset-0 bg-[#ff6b6b] transform -skew-x-3 border-[3px] sm:border-[4px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] -z-0"></span>
          </span>
        </h1>

        <!-- Description -->
        <div class="max-w-3xl mx-auto px-2">
          <p class="text-base sm:text-lg md:text-xl text-gray-800 font-bold leading-relaxed border-[3px] border-black bg-white p-4 sm:p-6 shadow-[4px_4px_0_0_#e5e7eb] sm:shadow-[8px_8px_0_0_#e5e7eb]">
            {config.description}
            <span class="text-gray-500 text-sm sm:text-base mt-2 sm:mt-3 block font-semibold">Design once, render variants via API — the infrastructure layer for programmatic media.</span>
          </p>
        </div>
      </div>

      <!-- Template Preview Section -->
      <div class="max-w-4xl mx-auto px-4 mb-12 sm:mb-16">
        <div class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
          <!-- Preview Header -->
          <div class="bg-[#ffc480] border-b-[3px] border-gray-900 px-4 sm:px-6 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex gap-2">
                <div class="w-3 h-3 rounded-full bg-[#ff5f56] border border-gray-900/20"></div>
                <div class="w-3 h-3 rounded-full bg-[#ffbd2e] border border-gray-900/20"></div>
                <div class="w-3 h-3 rounded-full bg-[#27c93f] border border-gray-900/20"></div>
              </div>
              <span class="font-black text-sm uppercase tracking-widest text-gray-900">Template Preview</span>
            </div>
            <div class="text-xs font-bold text-gray-700 bg-white/50 px-3 py-1 rounded-full border border-gray-900/20">
              {templateWidth} × {templateHeight}
            </div>
          </div>
          
          <!-- Preview Content -->
          <div class="p-4 sm:p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <div class="relative mx-auto flex items-center justify-center" style="max-width: 100%;">
              <!-- FabricJS Canvas Preview -->
              {#if template?.fabricJSData}
                <div class="relative rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] overflow-hidden bg-white">
                  <!-- Loading overlay -->
                  {#if previewLoading}
                    <div class="absolute inset-0 flex items-center justify-center bg-[#FFFDF8] z-10">
                      <div class="flex flex-col items-center gap-3">
                        <div class="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                        <span class="text-sm font-bold text-gray-600">Loading preview...</span>
                      </div>
                    </div>
                  {/if}
                  <canvas bind:this={previewCanvasEl}></canvas>
                </div>
              {:else}
                <!-- Fallback preview -->
                <div class="w-full h-full min-h-[200px] rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] bg-[#FFFDF8] flex items-center justify-center">
                  <div class="text-center p-6">
                    <div class="w-16 h-16 bg-[#ffc480] rounded-xl border-[3px] border-gray-900 flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0_0_#1f2937]">
                      <svg class="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p class="text-lg font-black text-gray-900 uppercase">{config.label}</p>
                    <p class="text-sm text-gray-500 font-medium mt-1">Click below to customize</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>
          
          <!-- CTA Section -->
          <div class="bg-[#FFFDF8] border-t-[3px] border-gray-900 px-4 sm:px-6 py-4 sm:py-6">
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                on:click={handleQuickGenerate}
                disabled={isGenerating}
                class="w-full sm:w-auto px-8 py-4 bg-[#4ade80] text-white border-[4px] border-black font-black text-lg uppercase tracking-wide shadow-[6px_6px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if isGenerating}
                  <svg class="w-6 h-6 animate-spin" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                {:else}
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Quick Generate
                {/if}
              </button>
              <button
                type="button"
                on:click={openInCanvasEditor}
                class="w-full sm:w-auto px-8 py-4 bg-[#ff6b6b] text-white border-[4px] border-black font-black text-lg uppercase tracking-wide shadow-[6px_6px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-3"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Customize in Editor
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Generated Result + NextSteps -->
      {#if generatedImageUrl}
        <div class="max-w-4xl mx-auto px-4 mb-12 sm:mb-16">
          <!-- Generated Image Display -->
          <div class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden mb-8">
            <div class="bg-[#4ade80] border-b-[3px] border-gray-900 px-4 sm:px-6 py-3 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="font-black text-sm uppercase tracking-widest text-gray-900">Generated Result</span>
              </div>
              <div class="text-xs font-bold text-gray-700 bg-white/50 px-3 py-1 rounded-full border border-gray-900/20">
                {templateWidth} × {templateHeight}
              </div>
            </div>
            
            <div class="p-4 sm:p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
              <div class="relative mx-auto flex items-center justify-center" style="max-width: 100%;">
                <div class="rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] overflow-hidden bg-white">
                  <img 
                    src={generatedImageUrl} 
                    alt="Generated {config?.label || 'image'}"
                    class="max-w-full h-auto"
                    style="max-height: 500px;"
                  />
                </div>
              </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="bg-[#FFFDF8] border-t-[3px] border-gray-900 px-4 sm:px-6 py-4 flex flex-wrap justify-center gap-3">
              <a
                href={generatedImageUrl}
                download="pictify-{useCaseId}.png"
                class="px-4 py-2 bg-white border-[3px] border-gray-900 font-bold text-sm uppercase shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
              <button
                type="button"
                on:click={handleQuickGenerate}
                disabled={isGenerating}
                class="px-4 py-2 bg-white border-[3px] border-gray-900 font-bold text-sm uppercase shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </button>
            </div>
          </div>

          <!-- NextSteps Component -->
          <NextSteps
            heading="What's next?"
            description="Share this result, save as template for customization, or automate via API."
            curlSnippet={apiSnippet}
            {templateDraft}
            generatedUrl={generatedImageUrl}
            generatedWidth={templateWidth}
            generatedHeight={templateHeight}
            generatedFormat="png"
            toolName={config?.label || useCaseId}
          />
        </div>
      {:else if generationError}
        <div class="max-w-4xl mx-auto px-4 mb-12">
          <div class="bg-red-50 border-[3px] border-red-400 p-6 rounded-xl text-center">
            <p class="font-bold text-red-700">{generationError}</p>
            <button
              type="button"
              on:click={handleQuickGenerate}
              class="mt-4 px-6 py-2 bg-red-500 text-white font-bold border-[2px] border-red-700 hover:bg-red-600 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      {/if}

      <SectionSeparator icon="star" />

      <!-- Why Teams Choose This Section -->
      <section class="py-16">
        <div class="text-center mb-12">
          <div class="inline-block bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-4 transform rotate-1">
            <span class="font-black uppercase tracking-widest text-sm">Overview</span>
          </div>
          <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter">
            Why teams <span class="text-[#ff6b6b]">choose</span> this workflow
          </h2>
        </div>

        <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {#each config.overview as paragraph, i}
            <div class="bg-white border-[3px] border-gray-900 p-6 rounded-xl shadow-[6px_6px_0_0_#1f2937] hover:shadow-[10px_10px_0_0_#1f2937] hover:-translate-y-1 transition-all">
              <div class="w-12 h-12 bg-[#ffc480] border-[3px] border-gray-900 rounded-lg flex items-center justify-center text-xl font-black mb-4 shadow-[3px_3px_0_0_#1f2937]">
                {i + 1}
              </div>
              <p class="text-gray-700 font-medium leading-relaxed">{paragraph}</p>
            </div>
          {/each}
        </div>
      </section>

      <!-- Pain Points Section -->
      <section class="py-16 bg-[#ffc480] border-y-[3px] border-gray-900 pattern-grid -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-12">
            <div class="inline-block bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-4 transform -rotate-1">
              <span class="font-black uppercase tracking-widest text-sm">Problems Solved</span>
            </div>
            <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter">
              Common <span class="bg-white px-2 border-[3px] border-black shadow-[3px_3px_0_0_#000]">pain points</span>
            </h2>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each config.painPoints as point}
              <div class="bg-white border-[3px] border-gray-900 p-5 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937] hover:-translate-y-1 transition-all">
                <div class="flex items-start gap-3">
                  <span class="text-[#ff6b6b] text-xl font-black">✗</span>
                  <p class="text-gray-800 font-bold">{point}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </section>

      <!-- Step by Step Section -->
      <section class="py-16">
        <div class="text-center mb-12">
          <div class="inline-block bg-[#4ade80] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-4 transform rotate-1">
            <span class="font-black uppercase tracking-widest text-sm">How It Works</span>
          </div>
          <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter">
            Step-by-step <span class="text-[#ff6b6b]">workflow</span>
          </h2>
        </div>

        <div class="max-w-3xl mx-auto space-y-6">
          {#each config.workflow as step, i}
            <div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937] overflow-hidden hover:shadow-[8px_8px_0_0_#1f2937] hover:-translate-y-1 transition-all">
              <div class="flex items-stretch">
                <div class="bg-black text-white px-6 py-4 flex items-center justify-center border-r-[3px] border-gray-900">
                  <span class="font-black text-2xl">{i + 1}</span>
                </div>
                <div class="p-6 flex-1">
                  <h3 class="font-black text-xl uppercase tracking-wide mb-2">{step.title}</h3>
                  <p class="text-gray-600 font-medium">{step.detail}</p>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- CTA after steps -->
        <div class="text-center mt-10">
          <button
            type="button"
            on:click={openInCanvasEditor}
            class="px-8 py-4 bg-[#ff6b6b] text-white border-[4px] border-black font-black text-lg uppercase tracking-wide shadow-[6px_6px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all inline-flex items-center gap-3"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Start Creating Now
          </button>
        </div>
      </section>

      <SectionSeparator icon="arrow" />

      <!-- Recommended Formats & Sizes -->
      <section class="py-16">
        <div class="max-w-4xl mx-auto">
          <div class="grid md:grid-cols-2 gap-8">
            <!-- Formats -->
            <div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937] p-6">
              <h3 class="font-black text-xl uppercase tracking-wide mb-4 flex items-center gap-2">
                <span class="w-8 h-8 bg-[#ffc480] border-[2px] border-black flex items-center justify-center text-sm">📷</span>
                Recommended Formats
              </h3>
              <div class="flex flex-wrap gap-3">
                {#each formatOptions as fmt}
                  <a 
                    href={baseFormatUrl(fmt)} 
                    class="px-4 py-2 bg-[#FFFDF8] border-[3px] border-gray-900 font-bold uppercase tracking-wide shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    {fmt.toUpperCase()}
                  </a>
                {/each}
              </div>
            </div>

            <!-- Sizes -->
            <div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937] p-6">
              <h3 class="font-black text-xl uppercase tracking-wide mb-4 flex items-center gap-2">
                <span class="w-8 h-8 bg-[#4ade80] border-[2px] border-black flex items-center justify-center text-sm">📐</span>
                Recommended Sizes
              </h3>
              <div class="flex flex-wrap gap-3">
                {#each sizeOptions as size}
                  <a 
                    href={sizeUrl(primarySizeFormat, size)} 
                    class="px-3 py-2 bg-[#FFFDF8] border-[3px] border-gray-900 font-bold text-sm shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    {size}
                  </a>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- API Section -->
      <section class="py-16">
        <div class="max-w-5xl mx-auto px-4">
          <div class="rounded-3xl border-[3px] border-gray-900 bg-[#FFFDF8] shadow-[8px_8px_0_0_#1f2937] overflow-hidden transform transition-transform hover:-translate-y-1">
            <div class="grid gap-8 lg:grid-cols-[1.1fr,1fr] p-6 sm:p-8 md:p-12 items-center">
              
              <!-- Left Column: Content -->
              <div class="flex flex-col justify-between gap-6">
                <div class="space-y-5">
                  <span class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-900 bg-[#ffc480] px-4 py-1.5 rounded-full border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937]">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    API Ready
                  </span>
                  
                  <div class="space-y-3">
                    <h2 class="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-gray-900 tracking-tight">
                      Automate with <span class="text-[#ff6b6b]">Pictify API</span>
                    </h2>
                    <p class="text-base sm:text-lg text-gray-700 leading-relaxed font-medium">
                      Trigger this workflow programmatically to create personalized, on-brand images right inside your product or campaigns.
                    </p>
                  </div>

                  <ul class="space-y-3">
                    <li class="flex items-start gap-3 group">
                      <span class="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff6b6b] text-white border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] group-hover:translate-y-px group-hover:translate-x-px group-hover:shadow-none transition-all flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span class="text-gray-800 font-bold text-sm sm:text-base leading-snug">Render images at scale without managing headless browsers</span>
                    </li>
                    <li class="flex items-start gap-3 group">
                      <span class="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff6b6b] text-white border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] group-hover:translate-y-px group-hover:translate-x-px group-hover:shadow-none transition-all flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span class="text-gray-800 font-bold text-sm sm:text-base leading-snug">Serve media instantly from our global CDN</span>
                    </li>
                    <li class="flex items-start gap-3 group">
                      <span class="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff6b6b] text-white border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] group-hover:translate-y-px group-hover:translate-x-px group-hover:shadow-none transition-all flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span class="text-gray-800 font-bold text-sm sm:text-base leading-snug">Track usage and rotate keys from the dashboard</span>
                    </li>
                  </ul>
                </div>

                <div class="flex flex-wrap gap-3 pt-2">
                  <a
                    class="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm sm:text-base font-bold text-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ff6b6b] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#ff6b6b] hover:bg-gray-800"
                    href="/signup?redirect=/dashboard/api-token"
                  >
                    Get free API key
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>

                  <a
                    class="inline-flex items-center justify-center gap-2 rounded-xl border-[3px] border-gray-900 px-5 py-3 text-sm sm:text-base font-bold text-gray-900 bg-white shadow-[4px_4px_0_0_#1f2937] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#1f2937] hover:bg-gray-50"
                    href="https://docs.pictify.io/"
                    target="_blank"
                    rel="noopener"
                  >
                    Read API docs
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </a>
                </div>
              </div>

              <!-- Right Column: Code Block -->
              <div class="relative">
                <!-- Decorative dots -->
                <div class="absolute -top-4 -right-4 w-20 h-20 bg-[#ffc480] rounded-full blur-2xl opacity-20"></div>
                <div class="absolute -bottom-4 -left-4 w-20 h-20 bg-[#ff6b6b] rounded-full blur-2xl opacity-20"></div>

                <div class="relative w-full rounded-xl border-[3px] border-gray-900 bg-[#1e1e1e] p-0 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
                  <!-- Mac-style Window Header -->
                  <div class="bg-[#2d2d2d] px-4 py-3 border-b-2 border-gray-800 flex items-center justify-between">
                    <div class="flex gap-2">
                      <div class="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                      <div class="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                      <div class="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                    </div>
                    <span class="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider">BASH</span>
                  </div>
                  
                  <!-- Code Content -->
                  <div class="p-4 sm:p-6 overflow-x-auto custom-scrollbar">
                    <pre class="font-mono text-xs sm:text-sm leading-relaxed text-gray-300 whitespace-pre-wrap"><code>{@html renderedApiCode}</code></pre>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <!-- FAQs Section -->
      <section class="py-16">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter bg-white px-6 py-2 border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] transform -rotate-1 inline-block">
              Frequently Asked Questions
            </h2>
          </div>

          <div class="space-y-4">
            {#each config.faqs as faq}
              <details class="group bg-white rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] overflow-hidden transition-all duration-200 open:shadow-[8px_8px_0_0_#1f2937] open:-translate-y-1">
                <summary class="flex items-center justify-between p-6 cursor-pointer list-none bg-[#FFFDF8] hover:bg-gray-50 transition-colors">
                  <span class="font-black text-lg uppercase tracking-wide pr-4">{faq.q}</span>
                  <span class="transform transition-transform duration-200 group-open:rotate-180 bg-gray-900 text-white w-8 h-8 flex items-center justify-center rounded-lg border-2 border-gray-900 group-hover:bg-[#ffc480] group-hover:text-black flex-shrink-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div class="p-6 pt-0 border-t-[3px] border-gray-900 bg-white">
                  <p class="text-lg font-medium text-gray-700 leading-relaxed mt-4">{faq.a}</p>
                </div>
              </details>
            {/each}
          </div>
        </div>
      </section>

      <!-- Related Workflows -->
      <section class="py-16">
        <div class="max-w-4xl mx-auto">
          <div class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] p-8">
            <h2 class="text-2xl font-black uppercase tracking-tighter mb-6">Related Workflows</h2>
            <div class="flex flex-wrap gap-3">
              {#each config.related as relatedId}
                <a 
                  href={`/tools/${relatedId}`} 
                  class="px-5 py-3 bg-[#FFFDF8] border-[3px] border-gray-900 font-bold shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#ffc480] transition-all"
                >
                  {useCaseDetails[relatedId]?.label || relatedId}
                </a>
              {/each}
            </div>

            <div class="border-t-[3px] border-dashed border-gray-300 mt-8 pt-8">
              <div class="flex flex-wrap gap-3">
                <a href="/tools/html-to-jpg" class="px-5 py-3 bg-[#ffc480] border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  HTML to Image Converter
                </a>
                <a href="/tools" class="px-5 py-3 bg-white border-[3px] border-gray-900 font-bold shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  Explore All Tools →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    {:else}
      <!-- Not Found State -->
      <div class="text-center space-y-6 py-20">
        <div class="inline-block bg-[#ff6b6b] border-[4px] border-black px-6 py-3 shadow-[6px_6px_0_0_#000] transform -rotate-1">
          <span class="font-black text-white text-xl uppercase">404</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-black uppercase tracking-tighter">Workflow not found</h1>
        <p class="text-xl text-gray-700 font-bold">Explore all tools and workflows at Pictify.io.</p>
        <a 
          href="/tools" 
          class="inline-block py-4 px-8 bg-[#ffc480] border-[4px] border-gray-900 text-gray-900 font-black uppercase tracking-wide shadow-[6px_6px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
        >
          View All Tools
        </a>
      </div>
    {/if}
  </main>

  <Footer />
</section>

<style>
  .pattern-grid {
    background-image: radial-gradient(#1f2937 1px, transparent 1px);
    background-size: 20px 20px;
  }
  
  :global(.token-command) {
    color: #ff79c6;
    font-weight: 700;
  }

  :global(.token-flag) {
    color: #8be9fd;
    font-weight: 600;
  }

  :global(.token-url) {
    color: #f1fa8c;
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  :global(.token-string) {
    color: #50fa7b;
  }

  .custom-scrollbar::-webkit-scrollbar {
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #2d2d2d;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style>
