<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import SignUpButton from '$lib/components/landingPage/SignUpButton.svelte';

  const tools = [
    {
      name: 'AI Agent Screenshot',
      description: 'Use natural language to automatically capture screenshots of any website content.',
      url: '/dashboard/tools/agent-screenshot',
      icon: '🤖',
      badge: 'New'
    },
    {
      name: 'Code to Image (Syntax Highlighter)',
      description: 'Turn code snippets into beautiful images with themes and fonts.',
      url: '/tools/code-to-image',
      icon: '🧑‍💻',
      badge: 'New'
    },
    {
      name: 'OG Image Generator',
      description: 'Create custom Open Graph images for improved social media engagement and SEO.',
      url: '/tools/og-image-generator',
      icon: '🖼️'
    },
    {
      name: 'HTML to JPG Converter',
      description: 'Convert HTML to high-quality JPG images with our free online tool.',
      url: '/tools/html-to-jpg',
      icon: '🔄'
    },
    {
      name: 'Online Invoice Generator',
      description: 'Create professional invoices quickly and easily with our free online tool.',
      url: '/tools/online-invoice-generator',
      icon: '📄'
    },
    {
      name: 'URL to Image Generator',
      description: 'Generate images from any URL with our free online tool.',
      url: '/tools/url-to-image-generator',
      icon: '📸'
    }
  ];

  const itemListStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Pictify.io Free Image Generation Tools',
    description: 'A collection of free image generation tools provided by Pictify.io',
    itemListElement: tools.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'WebApplication',
        name: tool.name,
        url: `https://pictify.io${tool.url.replace('/dashboard', '')}`,
        description: tool.description
      }
    }))
  };
</script>

<svelte:head>
  <title>Free Image Generation Tools | Pictify.io</title>
  <meta name="description" content="Explore Pictify.io's free image generation tools. Create OG images and convert HTML to JPG effortlessly with our powerful API.">
  <meta name="keywords" content="image generation, OG image generator, HTML to JPG converter, free tools, Pictify.io">
  <link rel="canonical" href="https://pictify.io/tools">
  <meta property="og:title" content="Free Image Generation Tools | Pictify.io">
  <meta property="og:description" content="Explore Pictify.io's free image generation tools. Create OG images and convert HTML to JPG effortlessly with our powerful API.">
  <meta property="og:image" content="https://pictify.io/og-image-tools.jpg">
  <meta property="og:url" content="https://pictify.io/tools">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
    {JSON.stringify(itemListStructuredData)}
  </script>
</svelte:head>

<section class="bg-[#FFFDF8] min-h-screen flex flex-col justify-between items-center">
  <Nav />

  <main class="w-full py-6 px-6 flex flex-col items-center justify-center space-y-14 max-w-4xl mx-auto mt-10">
    <div class="relative w-full mx-auto flex flex-col justify-center items-center text-center ">
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-4">
        Free Image Generation Tools
      </h1>
      <h2 class="text-xl opacity-70 max-w-3xl">
        Explore Pictify.io's powerful and free image generation tools. Boost your content with custom OG images and effortless HTML to JPG conversions.
      </h2>
    </div>

    <div class="w-full grid md:grid-cols-2 gap-8 mt-16">
      {#each tools as tool}
        <a href={tool.url} class="block cursor-pointer">
          <div class="h-full p-4 cursor-pointer  bg-white border-3 border-gray-900 rounded-xl transition-transform hover:scale-105 relative">
            {#if tool.badge}
              <div class="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {tool.badge}
              </div>
            {/if}
            <div class="text-4xl cursor-pointer mb-4">{tool.icon}</div>
            <h2 class="text-2xl cursor-pointer font-bold mb-2">{tool.name}</h2>
            <p class="text-lg cursor-pointer opacity-70">{tool.description}</p>
          </div>
        </a>
      {/each}
    </div>

    <div class="mt-20 w-full">
      <div class="text-4xl md:px-0 px-6 font-bold text-left md:text-center">
        <h2>Best HTML to Image API 🚀</h2>
      </div>
    </div>
    <div class="mt-20 mb-20 md:px-0 px-6 w-full flex justify-center">
      <div
        class="max-w-3xl rounded-xl relative z-20 pl-8 sm:pl-10 pr-8 sm:pr-16 py-8 border-[3px] border-gray-900 bg-[#EBEBEB]"
      >
        <h3 class="text-xl font-bold">
          HTML To Image: Create personalized images at scale with Pictify.io
        </h3>
        <div class="mt-2">
          <div>
            Scale your media creation with Pictify.io's HTML to Image API. Convert HTML to image or
            gif with a simple API call. Be it certificates, social sharing card, or personalized
            images for email campaigns, Pictify.io has got you covered.
          </div>
          <div class="mt-5">
            <ul>
              <li
                class="w-100 rounded-xl pl-8 sm:pl-6 pr-8 sm:pr-6 py-4 border-[3px] border-gray-900 bg-[#fffcf5]"
              >
                <p class="">
                  ⚡️ Fastest HTML to Image/Gif API. All other alternatives fall behind us
                </p>
              </li>
              <li
                class="w-100 mt-4 rounded-xl pl-8 sm:pl-6 pr-8 sm:pr-6 py-4 border-[3px] border-gray-900 bg-[#fffcf5]"
              >
                <p class="">🌏 Images generated are served via CDN by default</p>
              </li>
              <li
                class="w-100 mt-4 rounded-xl pl-8 sm:pl-6 pr-8 sm:pr-6 py-4 border-[3px] border-gray-900 bg-[#fffcf5]"
              >
                <p class="">🔄 Access the image instantly. No queues and rate limit</p>
              </li>
              <li
                class="w-100 mt-4 rounded-xl pl-8 sm:pl-6 pr-8 sm:pr-6 py-4 border-[3px] border-gray-900 bg-[#fffcf5]"
              >
                <p class="">📸 Images are smart cropped. No whitespace outside the content</p>
              </li>
            </ul>
          </div>
          <div class="mt-5">
            <SignUpButton />
          </div>
        </div>
      </div>
    </div> 
  </main>

  <section class="w-full max-w-4xl mx-auto px-6 my-20">
    <h2 class="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
    <div class="space-y-6">
      <details class="bg-gray-100  p-4 rounded-xl border-3 border-gray-900">
        <summary class="font-semibold cursor-pointer text-xl">What is Pictify.io?</summary>
        <p class="mt-2">Pictify.io is a powerful HTML to Image API service that offers free tools for creating OG images and converting HTML to JPG. Our platform is designed to help developers and marketers easily generate high-quality images for various use cases.</p>
      </details>
      <details class="bg-gray-100  p-4 rounded-xl border-3 border-gray-900 mt-4">
        <summary class="font-semibold cursor-pointer text-xl">Are these tools really free?</summary>
        <p class="mt-2">Yes, the OG Image Generator and HTML to JPG Converter tools are completely free to use. We offer these tools to showcase the capabilities of our API and to provide value to our users. For more advanced features and higher usage limits, we offer premium plans.</p>
      </details>
      <details class="bg-gray-100  p-4 rounded-xl border-3 border-gray-900 mt-4">
        <summary class="font-semibold cursor-pointer text-xl">Can I use these tools for commercial projects?</summary>
        <p class="mt-2">Absolutely! You're welcome to use our free tools for both personal and commercial projects. However, please note that there may be usage limits on the free tier. For high-volume or mission-critical applications, we recommend checking out our paid API plans.</p>
      </details>
    </div>
  </section>

  <Footer />
</section>

<style>
  .border-3 {
    border-width: 3px;
  }
</style>
