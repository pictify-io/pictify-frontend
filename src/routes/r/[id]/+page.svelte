<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getShareResult } from '../../../api/public-templates.js';
  import { toast } from '../../../store/toast.store.js';

  // State
  let result = null;
  let template = null;
  let loading = true;
  let error = null;

  $: id = $page.params.id;

  // Fetch result details
  async function fetchResult() {
    loading = true;
    error = null;

    try {
      const response = await getShareResult(id);
      result = response.result;
      template = response.template;
    } catch (e) {
      console.error('Failed to load result:', e);
      error = e.message || 'Result not found';
    } finally {
      loading = false;
    }
  }

  // Copy URL to clipboard
  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.set({ message: 'Link copied!', duration: 1500 });
    } catch (e) {
      toast.set({ message: 'Failed to copy', duration: 2000 });
    }
  }

  // Copy asset URL
  async function copyAssetUrl() {
    if (!result?.assetUrl) return;
    try {
      await navigator.clipboard.writeText(result.assetUrl);
      toast.set({ message: 'Image URL copied!', duration: 1500 });
    } catch (e) {
      toast.set({ message: 'Failed to copy', duration: 2000 });
    }
  }

  // Download asset
  function downloadAsset() {
    if (!result?.assetUrl) return;
    const link = document.createElement('a');
    link.href = result.assetUrl;
    link.download = `pictify-${result.uid}.${result.format || 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Format source name
  function formatSource(source) {
    const sources = {
      tool: 'Free Tool',
      template: 'Template',
      api: 'API',
      dashboard: 'Dashboard',
    };
    return sources[source] || source;
  }

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  onMount(() => {
    fetchResult();
  });
</script>

<svelte:head>
  {#if result}
    <title>{result.title || 'Shared Image'} | Pictify</title>
    <meta
      name="description"
      content="View and remix this image created with Pictify. Generate unlimited variants with our templates and API."
    >
    
    <!-- Open Graph -->
    <meta property="og:title" content={result.title || 'Created with Pictify'}>
    <meta property="og:description" content="View and remix this image. Create your own with Pictify templates and API.">
    <meta property="og:type" content="website">
    <meta property="og:url" content={`https://pictify.io/r/${result.uid}`}>
    <meta property="og:image" content={result.assetUrl}>
    <meta property="og:image:width" content={result.width}>
    <meta property="og:image:height" content={result.height}>
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content={result.title || 'Created with Pictify'}>
    <meta name="twitter:description" content="View and remix this image with Pictify.">
    <meta name="twitter:image" content={result.assetUrl}>
  {:else}
    <title>Shared Result | Pictify</title>
  {/if}
</svelte:head>

<div class="bg-[#FFFDF8] min-h-screen flex flex-col">
  <Nav />

  <main class="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
    {#if loading}
      <!-- Loading state -->
      <div class="text-center py-16">
        <div class="inline-block animate-spin h-12 w-12 border-4 border-gray-900 border-t-transparent rounded-full mb-4"></div>
        <p class="font-bold text-gray-600">Loading...</p>
      </div>
    {:else if error}
      <!-- Error state -->
      <div class="text-center py-16">
        <div class="inline-block p-6 bg-red-100 border-[3px] border-red-400 rounded-full mb-6">
          <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 class="text-2xl font-black text-gray-900 mb-2">Result not found</h2>
        <p class="text-gray-600 font-medium mb-6">{error}</p>
        <a
          href="/tools"
          class="inline-block px-6 py-3 bg-[#ff6b6b] text-white font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Create your own
        </a>
      </div>
    {:else if result}
      <!-- Result content -->
      <div class="space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="inline-block bg-[#4ade80] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-4 transform rotate-1">
            <span class="font-black uppercase tracking-widest text-sm">Shared Result</span>
          </div>
          {#if result.title}
            <h1 class="text-3xl md:text-4xl font-black text-gray-900">{result.title}</h1>
          {/if}
        </div>

        <!-- Image display -->
        <div class="bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
          {#if result.contentType === 'gif'}
            <img
              src={result.assetUrl}
              alt={result.title || 'Generated GIF'}
              class="w-full h-auto"
            />
          {:else}
            <img
              src={result.assetUrl}
              alt={result.title || 'Generated image'}
              class="w-full h-auto"
            />
          {/if}
        </div>

        <!-- Meta info -->
        <div class="flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-gray-600">
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            {result.width || '?'} × {result.height || '?'}px
          </span>
          {#if result.format}
            <span class="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded uppercase">
              {result.format}
            </span>
          {/if}
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {result.viewCount || 0} views
          </span>
          <span>Created {formatDate(result.createdAt)}</span>
          <span class="px-2 py-0.5 bg-[#ffc480] border border-gray-900 rounded">
            via {formatSource(result.source)}
          </span>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-wrap justify-center gap-4">
          <button
            on:click={copyShareUrl}
            class="px-6 py-3 bg-white font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Copy link
          </button>

          <button
            on:click={copyAssetUrl}
            class="px-6 py-3 bg-white font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Copy image URL
          </button>

          <button
            on:click={downloadAsset}
            class="px-6 py-3 bg-[#4ade80] text-white font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>

        <!-- Template info if applicable -->
        {#if template && template.isPublic}
          <div class="bg-[#f0f9ff] border-[3px] border-gray-900 p-6">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Created from template</p>
                <p class="text-xl font-black text-gray-900">{template.name}</p>
              </div>
              <a
                href={`/templates/${template.uid}`}
                class="px-6 py-3 bg-[#ff6b6b] text-white font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                🔄 Remix this template
              </a>
            </div>
          </div>
        {/if}

        <!-- CTA section -->
        <div class="bg-white border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] p-8 text-center">
          <h2 class="text-2xl md:text-3xl font-black uppercase tracking-tight mb-4">
            Create your own
          </h2>
          <p class="text-lg font-bold text-gray-600 max-w-2xl mx-auto mb-6">
            Use our free tools to generate images instantly, or build templates and automate variants via API.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/tools"
              class="px-8 py-4 bg-[#ff6b6b] text-white font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Try free tools
            </a>
            <a
              href="/templates"
              class="px-8 py-4 bg-white text-gray-900 font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Browse templates
            </a>
            <a
              href="/signup"
              class="px-8 py-4 bg-[#ffc480] text-gray-900 font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Get API key
            </a>
          </div>
        </div>

        <!-- Pictify branding -->
        <div class="text-center">
          <a href="/" class="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
            <span class="font-black text-sm">Made with</span>
            <span class="font-black text-lg text-[#ff6b6b]">Pictify</span>
          </a>
        </div>
      </div>
    {/if}
  </main>

  <Footer />
</div>
