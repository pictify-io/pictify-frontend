<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import { onMount } from 'svelte';
  import { getPublicTemplates } from '../../api/public-templates.js';
  import { goto } from '$app/navigation';

  // State
  let templates = [];
  let pagination = { page: 1, limit: 12, total: 0, totalPages: 0, hasNext: false, hasPrev: false };
  let filters = { categories: [], types: [], tags: [] };
  let loading = true;
  let error = null;

  // Filter state
  let selectedCategory = '';
  let selectedType = '';
  let selectedTag = '';
  let searchQuery = '';
  let sortBy = 'featured';

  // Fetch templates
  async function fetchTemplates(page = 1) {
    loading = true;
    error = null;

    try {
      const response = await getPublicTemplates({
        category: selectedCategory || undefined,
        type: selectedType || undefined,
        tag: selectedTag || undefined,
        search: searchQuery || undefined,
        sort: sortBy,
        page,
        limit: 12,
      });

      templates = response.templates || [];
      pagination = response.pagination || pagination;
      filters = response.filters || filters;
    } catch (e) {
      console.error('Failed to load templates:', e);
      error = e.message || 'Failed to load templates';
      templates = [];
    } finally {
      loading = false;
    }
  }

  // Handle filter changes
  function handleFilterChange() {
    fetchTemplates(1);
  }

  // Handle search
  function handleSearch(e) {
    if (e.key === 'Enter') {
      fetchTemplates(1);
    }
  }

  // Handle pagination
  function goToPage(page) {
    fetchTemplates(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Clear all filters
  function clearFilters() {
    selectedCategory = '';
    selectedType = '';
    selectedTag = '';
    searchQuery = '';
    sortBy = 'featured';
    fetchTemplates(1);
  }

  // Format category/type for display
  function formatLabel(str) {
    if (!str) return '';
    return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  onMount(() => {
    fetchTemplates(1);
  });
</script>

<svelte:head>
  <title>Template Gallery | Pictify</title>
  <meta
    name="description"
    content="Browse and remix professionally designed templates. Create OG images, social media graphics, certificates, and more — then automate with the Pictify API."
  >
  <link rel="canonical" href="https://pictify.io/templates">
  
  <!-- Structured data for gallery -->
  {@html `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Template Gallery",
      "description": "Browse and remix professionally designed templates for programmatic image generation.",
      "url": "https://pictify.io/templates",
      "publisher": {
        "@type": "Organization",
        "name": "Pictify",
        "url": "https://pictify.io"
      }
    }
  </script>`}
</svelte:head>

<div class="bg-[#FFFDF8] min-h-screen flex flex-col">
  <Nav />

  <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
    <!-- Header -->
    <div class="text-center mb-10 md:mb-14">
      <div class="inline-block bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform -rotate-2">
        <span class="font-black uppercase tracking-widest text-sm">Template Gallery</span>
      </div>
      <h1 class="text-4xl md:text-6xl font-black uppercase tracking-tighter">Find your template</h1>
      <p class="text-lg md:text-xl font-bold text-gray-700 max-w-3xl mx-auto mt-4">
        Browse curated templates, remix them into your workspace, and automate variants via API.
      </p>
    </div>

    <!-- Filters and Search -->
    <div class="bg-white border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] p-4 md:p-6 mb-8">
      <div class="flex flex-col lg:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <div class="relative">
            <input
              type="text"
              bind:value={searchQuery}
              on:keydown={handleSearch}
              placeholder="Search templates..."
              class="w-full px-4 py-3 pr-12 border-[3px] border-gray-900 font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:ring-offset-2"
            />
            <button
              on:click={() => fetchTemplates(1)}
              class="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded"
              aria-label="Search"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Category filter -->
        <div class="w-full lg:w-48">
          <select
            bind:value={selectedCategory}
            on:change={handleFilterChange}
            class="w-full px-4 py-3 border-[3px] border-gray-900 font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]"
          >
            <option value="">All Categories</option>
            {#each filters.categories as cat}
              <option value={cat}>{formatLabel(cat)}</option>
            {/each}
          </select>
        </div>

        <!-- Type filter -->
        <div class="w-full lg:w-48">
          <select
            bind:value={selectedType}
            on:change={handleFilterChange}
            class="w-full px-4 py-3 border-[3px] border-gray-900 font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]"
          >
            <option value="">All Types</option>
            {#each filters.types as type}
              <option value={type}>{formatLabel(type)}</option>
            {/each}
          </select>
        </div>

        <!-- Sort -->
        <div class="w-full lg:w-44">
          <select
            bind:value={sortBy}
            on:change={handleFilterChange}
            class="w-full px-4 py-3 border-[3px] border-gray-900 font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]"
          >
            <option value="featured">Featured</option>
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        <!-- Clear filters -->
        {#if selectedCategory || selectedType || selectedTag || searchQuery}
          <button
            on:click={clearFilters}
            class="px-4 py-3 bg-gray-100 border-[3px] border-gray-900 font-black text-sm uppercase tracking-wider hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        {/if}
      </div>

      <!-- Active tags -->
      {#if filters.tags.length > 0}
        <div class="mt-4 flex flex-wrap gap-2">
          {#each filters.tags.slice(0, 10) as tag}
            <button
              on:click={() => { selectedTag = tag; handleFilterChange(); }}
              class="px-3 py-1 text-sm font-bold border-2 border-gray-900 rounded-full transition-all {selectedTag === tag ? 'bg-[#ff6b6b] text-white' : 'bg-white hover:bg-gray-100'}"
            >
              {tag}
            </button>
          {/each}
          {#if selectedTag}
            <button
              on:click={() => { selectedTag = ''; handleFilterChange(); }}
              class="px-3 py-1 text-sm font-bold text-gray-500 hover:text-gray-700"
            >
              × Clear tag
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Results count -->
    <div class="flex items-center justify-between mb-6">
      <p class="font-bold text-gray-600">
        {#if loading}
          Loading...
        {:else if pagination.total === 0}
          No templates found
        {:else}
          Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} templates
        {/if}
      </p>
    </div>

    <!-- Error state -->
    {#if error}
      <div class="bg-red-50 border-[3px] border-red-400 p-6 text-center mb-8">
        <p class="font-bold text-red-700">{error}</p>
        <button
          on:click={() => fetchTemplates(pagination.page)}
          class="mt-4 px-6 py-2 bg-red-500 text-white font-bold border-[2px] border-red-700 hover:bg-red-600 transition-colors"
        >
          Try again
        </button>
      </div>
    {/if}

    <!-- Loading state -->
    {#if loading}
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {#each Array(8) as _}
          <div class="bg-white border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] animate-pulse">
            <div class="aspect-video bg-gray-200"></div>
            <div class="p-4">
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if templates.length > 0}
      <!-- Template grid -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {#each templates as template}
          <a
            href={`/templates/${template.uid}`}
            class="group block bg-white border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#1f2937] transition-all overflow-hidden"
          >
            <!-- Thumbnail -->
            <div class="aspect-video bg-gray-100 relative overflow-hidden">
              {#if template.thumbnail}
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
              {:else}
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ffc480] to-[#ff6b6b]">
                  <span class="text-white font-black text-2xl opacity-50">{template.name.charAt(0)}</span>
                </div>
              {/if}
              
              <!-- Featured badge -->
              {#if template.isFeatured}
                <div class="absolute top-2 right-2 bg-[#ffc480] border-2 border-gray-900 px-2 py-0.5">
                  <span class="text-xs font-black uppercase">Featured</span>
                </div>
              {/if}
            </div>

            <!-- Content -->
            <div class="p-4">
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="font-black text-gray-900 line-clamp-1 group-hover:text-[#ff6b6b] transition-colors">
                  {template.name}
                </h3>
              </div>
              
              <div class="flex items-center gap-2 text-xs font-bold text-gray-500 mb-3">
                <span class="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded">
                  {formatLabel(template.category)}
                </span>
                <span>{template.width}×{template.height}</span>
              </div>

              {#if template.publicDescription}
                <p class="text-sm text-gray-600 line-clamp-2 mb-3">{template.publicDescription}</p>
              {/if}

              <div class="flex items-center justify-between text-xs font-bold text-gray-500">
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {template.usageCount || 0} uses
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {template.forkCount || 0} forks
                </span>
              </div>
            </div>

            <!-- Hover CTA -->
            <div class="px-4 pb-4">
              <div class="w-full py-2 bg-[#ff6b6b] text-white text-center font-black text-sm uppercase tracking-wider border-[2px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] group-hover:shadow-[1px_1px_0_0_#1f2937] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
                View Template →
              </div>
            </div>
          </a>
        {/each}
      </div>

      <!-- Pagination -->
      {#if pagination.totalPages > 1}
        <div class="mt-10 flex justify-center items-center gap-2">
          <button
            on:click={() => goToPage(pagination.page - 1)}
            disabled={!pagination.hasPrev}
            class="px-4 py-2 bg-white border-[3px] border-gray-900 font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            ← Prev
          </button>

          <div class="flex items-center gap-1">
            {#each Array(Math.min(pagination.totalPages, 5)) as _, i}
              {@const pageNum = pagination.totalPages <= 5 
                ? i + 1 
                : pagination.page <= 3 
                  ? i + 1 
                  : pagination.page >= pagination.totalPages - 2 
                    ? pagination.totalPages - 4 + i 
                    : pagination.page - 2 + i}
              <button
                on:click={() => goToPage(pageNum)}
                class="w-10 h-10 border-[3px] border-gray-900 font-black text-sm transition-all {pagination.page === pageNum ? 'bg-[#ff6b6b] text-white' : 'bg-white hover:bg-gray-100'}"
              >
                {pageNum}
              </button>
            {/each}
          </div>

          <button
            on:click={() => goToPage(pagination.page + 1)}
            disabled={!pagination.hasNext}
            class="px-4 py-2 bg-white border-[3px] border-gray-900 font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            Next →
          </button>
        </div>
      {/if}
    {:else if !error}
      <!-- Empty state -->
      <div class="text-center py-16">
        <div class="inline-block p-6 bg-gray-100 border-[3px] border-gray-900 rounded-full mb-6">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <h3 class="text-2xl font-black text-gray-900 mb-2">No templates found</h3>
        <p class="text-gray-600 font-medium mb-6">Try adjusting your filters or search query.</p>
        <button
          on:click={clearFilters}
          class="px-6 py-3 bg-[#ff6b6b] text-white font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Clear all filters
        </button>
      </div>
    {/if}

    <!-- CTA Section -->
    <section class="mt-16 bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] p-8 md:p-12 text-center">
      <h2 class="text-2xl md:text-3xl font-black uppercase tracking-tight mb-4">
        Don't see what you need?
      </h2>
      <p class="text-lg font-bold text-gray-600 max-w-2xl mx-auto mb-6">
        Build your own template from scratch in our visual editor, or start from any of our free tools.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="/template-workspace/create"
          class="px-8 py-4 bg-[#ff6b6b] text-white font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Create from scratch
        </a>
        <a
          href="/tools"
          class="px-8 py-4 bg-white text-gray-900 font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Browse free tools
        </a>
      </div>
    </section>
  </main>

  <Footer />
</div>
