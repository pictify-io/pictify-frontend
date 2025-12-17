<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import SignUpButton from '$lib/components/landingPage/SignUpButton.svelte';
  import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';
  import { useCases, useCaseDetails } from '$lib/pseo/config.js';

  const tools = [
    {
      name: 'Code to Image',
      description: 'Turn code snippets into beautiful images with themes and fonts.',
      url: '/tools/code-to-image',
      icon: 'fa-solid fa-code'
    },
    {
      name: 'OG Image Generator',
      description: 'Create custom Open Graph images for improved social media engagement and SEO.',
      url: '/tools/og-image-generator',
      icon: 'fa-solid fa-image'
    },
    {
      name: 'Template Gallery',
      description: 'Start from ready-made templates and presets, then automate variants via API.',
      url: '/templates',
      icon: 'fa-solid fa-layer-group'
    },
    {
      name: 'HTML to JPG',
      description: 'Convert HTML to high-quality JPG images with our free online tool.',
      url: '/tools/html-to-jpg',
      icon: 'fa-solid fa-file-image'
    },
    {
      name: 'Invoice Generator',
      description: 'Create professional invoices quickly and easily with our free online tool.',
      url: '/tools/online-invoice-generator',
      icon: 'fa-solid fa-file-invoice-dollar'
    },
    {
      name: 'URL to Image',
      description: 'Generate images from any URL with our free online tool.',
      url: '/tools/url-to-image-generator',
      icon: 'fa-solid fa-camera'
    }
  ];

  const itemListStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Pictify.io Free Tools for Programmatic Media',
    description:
      'Free tools powered by Pictify — design templates and generate images programmatically at scale.',
    itemListElement: tools.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'WebApplication',
        name: tool.name,
        url: `https://pictify.io${tool.url}`,
        description: tool.description
      }
    }))
  };
</script>

<svelte:head>
  <title>Free Tools for Programmatic Media | Pictify.io</title>
  <meta
    name="description"
    content="Explore Pictify.io's free tools to generate images from HTML, URLs, and templates. Design once, render variants via API — the infrastructure layer for programmatic media."
  >
  <meta name="keywords" content="image generation, OG image generator, HTML to JPG converter, free tools, Pictify.io">
  <link rel="canonical" href="https://pictify.io/tools">
  <meta property="og:title" content="Free Tools for Programmatic Media | Pictify.io">
  <meta
    property="og:description"
    content="Free tools powered by Pictify — design templates and render images at scale via API."
  >
  <meta property="og:image" content="https://pictify.io/og-image-tools.jpg">
  <meta property="og:url" content="https://pictify.io/tools">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
    {JSON.stringify(itemListStructuredData)}
  </script>
</svelte:head>

<div class="bg-[#FFFDF8] min-h-screen flex flex-col font-sans text-gray-900 selection:bg-[#ffc480] selection:text-black">
  <Nav />

  <main class="flex-grow">
    <!-- Hero Section -->
    <div class="w-full py-20 px-6 flex flex-col items-center justify-center max-w-6xl mx-auto">
      <div class="relative w-full mx-auto flex flex-col justify-center items-center text-center space-y-6">
        <div class="inline-block bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-4 transform -rotate-2">
           <span class="font-black uppercase tracking-widest text-sm">Dev Tools</span>
        </div>
        
        <h1 class="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter mb-4 uppercase leading-none">
          Free Tools for<br/>Programmatic Media
        </h1>
        
        <p class="text-xl md:text-2xl font-bold max-w-3xl leading-relaxed text-gray-700">
          Design templates once, render variants in seconds. <br class="hidden md:block" />
          Try our free tools — then automate at scale with the Pictify API.
        </p>
        <p class="text-sm md:text-base font-bold text-gray-600 max-w-3xl">
          Free to try. Guest limits may apply; create a free account to unlock higher limits and remove watermarks.
        </p>
      </div>

      <!-- Tools Grid -->
      <div class="w-full grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
        {#each tools as tool}
          <a href={tool.url} class="block group relative h-full">
            <div class="h-full bg-white border-[3px] border-gray-900 p-8 rounded-xl shadow-[8px_8px_0_0_#1f2937] transition-all duration-200 group-hover:-translate-y-2 group-hover:shadow-[12px_12px_0_0_#1f2937] flex flex-col items-start relative overflow-hidden">
              
              <!-- Background Pattern -->
              <div class="absolute top-0 right-0 w-32 h-32 bg-[#ffc480] opacity-10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>

              <div class="w-16 h-16 bg-[#FFFDF8] border-[3px] border-gray-900 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-[4px_4px_0_0_#1f2937] group-hover:bg-[#ffc480] transition-colors duration-200 text-gray-900">
                <i class={tool.icon}></i>
              </div>
              
              <h3 class="text-2xl font-black uppercase tracking-wide mb-3 group-hover:underline decoration-4 decoration-[#ffc480] underline-offset-4">
                {tool.name}
              </h3>
              
              <p class="text-lg font-medium text-gray-600 leading-relaxed">
                {tool.description}
              </p>
              
              <div class="mt-auto pt-6 flex items-center text-sm font-black uppercase tracking-widest text-gray-900 group-hover:translate-x-2 transition-transform duration-200">
                Try Tool <i class="fa fa-arrow-right ml-2"></i>
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>
    
    <SectionSeparator icon="star" />

    <!-- Workflows (Use cases) -->
    <div id="workflows" class="w-full py-20 px-6 max-w-6xl mx-auto scroll-mt-24">
      <div class="text-center space-y-4 mb-12">
        <div class="inline-block bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-2 transform rotate-1">
          <span class="font-black uppercase tracking-widest text-sm">Workflows</span>
        </div>
        <h2 class="text-4xl md:text-5xl font-black uppercase tracking-tighter">
          Ready-to-use <span class="text-[#ff6b6b]">automation</span> recipes
        </h2>
        <p class="text-lg md:text-xl font-bold text-gray-700 max-w-3xl mx-auto">
          These pages come with a starter template, recommended sizes, and a prefilled API snippet.
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        {#each useCases as uc}
          <a href={`/tools/${uc.id}`} class="block bg-white border-[3px] border-gray-900 p-6 rounded-xl shadow-[6px_6px_0_0_#1f2937] hover:shadow-[10px_10px_0_0_#1f2937] hover:-translate-y-1 transition-all group">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-xs font-black uppercase tracking-widest text-gray-500">Workflow</div>
                <div class="text-2xl font-black mt-1 group-hover:underline underline-offset-4 decoration-4 decoration-[#ffc480]">
                  {useCaseDetails[uc.id]?.label || uc.label}
                </div>
                <p class="text-gray-600 font-medium mt-2">
                  {useCaseDetails[uc.id]?.description || 'Generate media from templates with one API call.'}
                </p>
              </div>
              <div class="flex flex-col items-end gap-2 flex-shrink-0">
                <span class="px-4 py-2 bg-[#4ade80] text-white border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[3px_3px_0_0_#1f2937] group-hover:shadow-[1px_1px_0_0_#1f2937] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all text-xs flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Try Now
                </span>
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>

    <!-- Feature Section -->
    <div class="py-24 bg-[#ffc480] border-y-[3px] border-gray-900 pattern-grid">
      <div class="max-w-6xl mx-auto px-6">
        <div class="bg-white border-[3px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] rounded-2xl overflow-hidden">
          <div class="p-8 md:p-12 border-b-[3px] border-gray-900 bg-gray-50">
            <h2 class="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6">
              Best HTML to Image API 🚀
            </h2>
            <p class="text-xl font-bold text-gray-700 leading-relaxed max-w-3xl">
              Scale your media creation with Pictify.io's HTML to Image API. Convert HTML to image or
              gif with a simple API call. Be it certificates, social sharing card, or personalized
              images for email campaigns.
            </p>
          </div>
          
          <div class="p-8 md:p-12 bg-white">
            <ul class="grid md:grid-cols-2 gap-6">
              <li class="flex items-start p-6 border-[3px] border-gray-900 rounded-xl bg-[#FFFDF8] shadow-[4px_4px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937] hover:-translate-y-1 transition-all">
                <div class="mr-4 text-2xl">⚡️</div>
                <p class="font-bold text-lg">Fastest HTML to Image/Gif API. All other alternatives fall behind us.</p>
              </li>
              <li class="flex items-start p-6 border-[3px] border-gray-900 rounded-xl bg-[#FFFDF8] shadow-[4px_4px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937] hover:-translate-y-1 transition-all">
                <div class="mr-4 text-2xl">🌏</div>
                <p class="font-bold text-lg">Images generated are served via global CDN by default.</p>
              </li>
              <li class="flex items-start p-6 border-[3px] border-gray-900 rounded-xl bg-[#FFFDF8] shadow-[4px_4px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937] hover:-translate-y-1 transition-all">
                <div class="mr-4 text-2xl">🔄</div>
                <p class="font-bold text-lg">Access the image instantly. No queues and rate limits.</p>
              </li>
              <li class="flex items-start p-6 border-[3px] border-gray-900 rounded-xl bg-[#FFFDF8] shadow-[4px_4px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937] hover:-translate-y-1 transition-all">
                <div class="mr-4 text-2xl">📸</div>
                <p class="font-bold text-lg">Images are smart cropped. No whitespace outside the content.</p>
              </li>
            </ul>
            
            <div class="mt-10 flex justify-center">
              <div class="inline-block transform hover:scale-105 transition-transform duration-200">
                <SignUpButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SectionSeparator icon="arrow" />

    <!-- FAQ Section -->
    <div class="w-full max-w-4xl mx-auto px-6 py-24">
      <div class="flex items-center justify-center mb-12">
         <h2 class="text-4xl md:text-5xl font-black uppercase tracking-tighter text-center bg-white px-6 py-2 border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] transform -rotate-1 inline-block">
            Frequently Asked Questions
         </h2>
      </div>
      
      <div class="space-y-6">
        <details class="group bg-white rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] overflow-hidden transition-all duration-200 open:shadow-[8px_8px_0_0_#1f2937] open:-translate-y-1">
          <summary class="flex items-center justify-between p-6 cursor-pointer list-none bg-[#FFFDF8] hover:bg-gray-50 transition-colors">
            <span class="font-black text-xl uppercase tracking-wide">What is Pictify.io?</span>
            <span class="transform transition-transform duration-200 group-open:rotate-180 bg-gray-900 text-white w-8 h-8 flex items-center justify-center rounded-lg border-2 border-gray-900 group-hover:bg-[#ffc480] group-hover:text-black">
              <i class="fa fa-chevron-down"></i>
            </span>
          </summary>
          <div class="p-6 pt-0 border-t-[3px] border-gray-900 bg-white">
            <p class="text-lg font-medium text-gray-700 leading-relaxed mt-4">
              Pictify is the infrastructure layer for programmatic media. Design templates (HTML/CSS or our editor),
              inject variables, and render images/GIFs at scale via API — with fast, predictable output.
            </p>
          </div>
        </details>
        
        <details class="group bg-white rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] overflow-hidden transition-all duration-200 open:shadow-[8px_8px_0_0_#1f2937] open:-translate-y-1">
          <summary class="flex items-center justify-between p-6 cursor-pointer list-none bg-[#FFFDF8] hover:bg-gray-50 transition-colors">
            <span class="font-black text-xl uppercase tracking-wide">Are these tools really free?</span>
            <span class="transform transition-transform duration-200 group-open:rotate-180 bg-gray-900 text-white w-8 h-8 flex items-center justify-center rounded-lg border-2 border-gray-900 group-hover:bg-[#ffc480] group-hover:text-black">
              <i class="fa fa-chevron-down"></i>
            </span>
          </summary>
          <div class="p-6 pt-0 border-t-[3px] border-gray-900 bg-white">
            <p class="text-lg font-medium text-gray-700 leading-relaxed mt-4">
              Yes — these tools are free to try. Some tools enforce a daily guest limit and may add a watermark after a few generations.
              Creating a free account unlocks higher limits and removes watermarks. For production workloads and high volume, use our API plans.
            </p>
          </div>
        </details>
        
        <details class="group bg-white rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] overflow-hidden transition-all duration-200 open:shadow-[8px_8px_0_0_#1f2937] open:-translate-y-1">
          <summary class="flex items-center justify-between p-6 cursor-pointer list-none bg-[#FFFDF8] hover:bg-gray-50 transition-colors">
            <span class="font-black text-xl uppercase tracking-wide">Can I use these tools for commercial projects?</span>
            <span class="transform transition-transform duration-200 group-open:rotate-180 bg-gray-900 text-white w-8 h-8 flex items-center justify-center rounded-lg border-2 border-gray-900 group-hover:bg-[#ffc480] group-hover:text-black">
              <i class="fa fa-chevron-down"></i>
            </span>
          </summary>
          <div class="p-6 pt-0 border-t-[3px] border-gray-900 bg-white">
            <p class="text-lg font-medium text-gray-700 leading-relaxed mt-4">
              Absolutely! You're welcome to use our free tools for both personal and commercial projects. However, please note that there may be usage limits on the free tier. For high-volume or mission-critical applications, we recommend checking out our paid API plans.
            </p>
          </div>
        </details>
      </div>
    </div>
  </main>

  <Footer />
</div>

<style>
  /* No additional styles needed as Tailwind covers it, 
     but keeping the block for potential future custom styles */
  .pattern-grid {
    background-image: radial-gradient(#1f2937 1px, transparent 1px);
    background-size: 20px 20px;
  }
</style>
