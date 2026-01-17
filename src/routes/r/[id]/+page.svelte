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

<div class="bg-[#FFFDF8] min-h-screen flex flex-col relative overflow-hidden font-sans">
  
  <!-- Background Elements -->
  <div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"></div>
  <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
  <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#ff6b6b]/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

  <Nav />

  <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 relative z-10">
    {#if loading}
      <!-- Loading state -->
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <div class="w-16 h-16 border-[4px] border-gray-900 border-t-[#ff6b6b] rounded-full animate-spin"></div>
        <p class="mt-6 text-xl font-black text-gray-900 uppercase tracking-widest animate-pulse">Loading Asset...</p>
      </div>
    {:else if error}
      <!-- Error state -->
      <div class="max-w-2xl mx-auto text-center bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] rounded-3xl p-12 relative overflow-hidden">
        <div class="absolute inset-0 bg-red-50/50 -z-10"></div>
        <div class="inline-flex items-center justify-center w-20 h-20 bg-[#ff6b6b]/10 border-[3px] border-gray-900 rounded-2xl mb-6 text-[#ff6b6b]">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 class="text-3xl font-black text-gray-900 mb-4 uppercase tracking-wide">Result not found</h2>
        <p class="text-lg text-gray-600 font-medium mb-8 max-w-md mx-auto">{error}</p>
        <a
          href="/tools"
          class="inline-block px-8 py-4 bg-[#ff6b6b] text-white font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
        >
          Create your own
        </a>
      </div>
    {:else if result}
      <!-- Result content -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        <!-- Left Column: Asset Viewer -->
        <div class="lg:col-span-8 flex flex-col gap-8">
           <!-- "Window" Card -->
           <div class="bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] rounded-3xl overflow-hidden relative group">
              <!-- Window Header -->
              <div class="bg-gray-50 border-b-[3px] border-gray-900 p-4 flex items-center justify-between">
                   <div class="flex items-center gap-2">
                      <div class="w-3.5 h-3.5 rounded-full bg-[#ff6b6b] border-2 border-gray-900"></div>
                      <div class="w-3.5 h-3.5 rounded-full bg-[#ffc480] border-2 border-gray-900"></div>
                      <div class="w-3.5 h-3.5 rounded-full bg-[#4ade80] border-2 border-gray-900"></div>
                   </div>
                   <div class="font-mono text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      {result.width} x {result.height}px
                   </div>
              </div>
              
              <!-- Image Container -->
              <div class="bg-gray-100 relative p-4 sm:p-8 flex items-center justify-center min-h-[400px]">
                  <!-- Checkerboard Pattern for transparency -->
                  <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;"></div>
                  
                  {#if result.contentType === 'gif'}
                    <img
                      src={result.assetUrl}
                      alt={result.title || 'Generated GIF'}
                      class="max-w-full h-auto shadow-2xl relative z-10 rounded-lg border-2 border-gray-200"
                    />
                  {:else}
                    <img
                      src={result.assetUrl}
                      alt={result.title || 'Generated image'}
                      class="max-w-full h-auto shadow-2xl relative z-10 rounded-lg border-2 border-gray-200"
                    />
                  {/if}
              </div>
           </div>
        </div>

        <!-- Right Column: Details & Actions -->
        <div class="lg:col-span-4 flex flex-col gap-6">
            
            <!-- Header Info -->
            <div class="bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-2xl p-6">
                <div class="flex items-center gap-3 mb-4">
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4ade80] border-[2px] border-gray-900 text-[11px] font-black uppercase tracking-wider rounded text-gray-900 shadow-[2px_2px_0_0_#000]">
                    Shared Link
                  </div>
                  {#if result.format}
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 border-[2px] border-gray-900 text-[11px] font-black uppercase tracking-wider rounded text-gray-500">
                      {result.format}
                    </div>
                  {/if}
                </div>
                
                <h1 class="text-3xl font-black text-gray-900 leading-tight mb-3">
                    {result.title || 'Untitled Creation'}
                </h1>
                
                <div class="flex flex-col gap-2 text-sm font-medium text-gray-600 border-t-2 border-dashed border-gray-200 pt-4">
                   <div class="flex items-center gap-2">
                       <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                       <span>Created <span class="text-gray-900 font-bold">{formatDate(result.createdAt)}</span></span>
                   </div>
                   <div class="flex items-center gap-2">
                       <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                       <span>Source: <span class="text-gray-900 font-bold">{formatSource(result.source)}</span></span>
                   </div>
                   <div class="flex items-center gap-2">
                       <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                       <span><span class="text-gray-900 font-bold">{result.viewCount || 0}</span> views</span>
                   </div>
                </div>
            </div>

            <!-- Primary Actions -->
            <div class="flex flex-col gap-4">
                 <button
                    on:click={copyShareUrl}
                    class="w-full py-4 bg-white text-gray-900 font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 rounded-xl text-lg group"
                  >
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Copy Link
                 </button>

                 <div class="grid grid-cols-2 gap-4">
                    <button
                        on:click={copyAssetUrl}
                        class="w-full py-3 bg-white text-gray-900 font-bold uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 rounded-xl text-sm"
                    >
                        Copy URL
                    </button>
                    <button
                        on:click={downloadAsset}
                        class="w-full py-3 bg-[#ffc480] text-gray-900 font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 rounded-xl text-sm"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                    </button>
                 </div>
            </div>

            <!-- Template Callout -->
            {#if template && template.isPublic}
              <div class="mt-4 bg-[#f0f9ff] border-[3px] border-gray-900 rounded-2xl p-5 relative overflow-hidden group hover:shadow-[4px_4px_0_0_#1f2937] transition-all">
                <div class="absolute top-0 right-0 p-2 opacity-10">
                   <svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
                </div>
                
                <p class="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Original Template</p>
                <h3 class="font-black text-gray-900 text-lg mb-4 truncate relative z-10">{template.name}</h3>
                
                <a
                    href={`/templates/${template.uid}`}
                    class="inline-block w-full py-3 text-center bg-[#ff6b6b] text-white font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] transition-all rounded-lg text-sm relative z-10"
                >
                    Remix Template
                </a>
              </div>
            {/if}

        </div>

      </div>

      <!-- CTA Footer for this page -->
      <div class="mt-20 border-t-[3px] border-gray-900 pt-16 pb-8">
        <div class="bg-[#ff6b6b] rounded-3xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] p-8 md:p-12 text-center relative overflow-hidden">
             <div class="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
             <div class="relative z-10">
                 <h2 class="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight text-shadow-sm">
                    Automate this image?
                 </h2>
                 <p class="text-white/90 font-bold text-lg max-w-2xl mx-auto mb-8">
                    Stop taking screenshots. Use the Pictify API to generate images, GIFs, and PDFs programmatically.
                 </p>
                 <div class="flex flex-wrap justify-center gap-4">
                    <a
                      href="/signup"
                      class="px-8 py-4 bg-white text-gray-900 font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
                    >
                      Get API Key
                    </a>
                    <a
                      href="/templates"
                      class="px-8 py-4 bg-gray-900 text-white font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] hover:bg-gray-800 transition-all rounded-xl"
                    >
                      Browse Templates
                    </a>
                 </div>
             </div>
        </div>
      </div>

    {/if}
  </main>

  <Footer />
</div>
