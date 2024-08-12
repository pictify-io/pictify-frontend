<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import OgImageTemplate from '$lib/components/tools/OgImageTemplate.svelte';
  import {getTemplate, getWebsiteInfo} from '../../../api/tools/og-image';
  import { createImagePublic } from '../../../api/image.js';
  import { onMount } from 'svelte';
  import { toast } from '../../../store/toast.store';
  import ColorPicker from 'svelte-awesome-color-picker';

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

  let url = '';
  let selectedTemplate = '';
  let isFetchingWebsiteInfo = false;
  let selectedFont = combinedFonts[0];
  let logoWidth = 150;

  let imageUrl = '';
  let isImageGenerating = false;

  let websiteInfo;
  let error = null;

let backgroundColorRgb = websiteInfo?.colors ? {r: websiteInfo.colors[0][0], g: websiteInfo.colors[0][1], b: websiteInfo.colors[0][2]} : {r: 255, g: 255, b: 255};
let headingColorRgb = websiteInfo?.colors ? {r: websiteInfo.colors[1][0], g: websiteInfo.colors[1][1], b: websiteInfo.colors[1][2]} : {r: 0, g: 0, b: 0};
let subHeadingColorRgb = websiteInfo?.colors ? {r: websiteInfo.colors[2][0], g: websiteInfo.colors[2][1], b: websiteInfo.colors[2][2]} : {r: 0, g: 0, b: 0};


let ogImageTemplateWrapper;
 $:previewWidth =  ogImageTemplateWrapper ? (ogImageTemplateWrapper.offsetWidth * 2) - 70 : 1200;
$:previewHeight = ogImageTemplateWrapper ? ogImageTemplateWrapper.offsetWidth  : 600;

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
    'template-1', 
    'template-2', 
    'template-3', 
    'template-4', 
    // 'template-5', 
    'template-6',
    'template-7',
    'template-8',
    'template-9',
    'template-10',
    'template-11',
    'template-12',
    //'template-13',
    'template-14'
  ];
  let templates = [];

  onMount(async() => {
    templates = await Promise.all(templateNames.map(async(name) => {
      const template = await getTemplate(name);
      return template;
    }));

    selectedTemplate = templates[0];
  });

  const updateHTML = (html) => {
    const iframe = ogImageTemplateWrapper.querySelector('iframe');

    const document = iframe.contentWindow.document;
    const heading= document.querySelector('#template-heading');
    const subHeading= document.querySelector('#template-subheading');
    const logo= document.querySelector('#template-logo');
    heading.innerHTML = websiteInfo.heading || '';
    subHeading.innerHTML = websiteInfo.subHeading || '';

    if(logo) {
      if(websiteInfo.logo && websiteInfo.logo.startsWith('<svg')) {
        console.log('websiteInfo.logo', websiteInfo.logo); 
        const svgContainer = document.createElement('div');
        svgContainer.id = 'template-logo';
        svgContainer.innerHTML = websiteInfo.logo;
        logo.replaceWith(svgContainer);
        
        const svgElement = svgContainer.querySelector('svg');
        if (svgElement) {
          svgElement.setAttribute('width', logoWidth);
          svgElement.setAttribute('height', 'auto');
        }
      } else {
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

    delete document.documentElement.style.fontFamily;
    document.documentElement.style.fontFamily = selectedFont.id;

    html = document.documentElement.outerHTML;
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

  // const updateSubHeadingColor = (event) => {
  //   const rgb = event.detail.rgb;
  //   subHeadingColorRgb = rgb;
  //   updateHTML(selectedTemplate);
  // };

  const updateFont = (font) => {
    selectedFont = font;
    updateHTML(selectedTemplate);
  };

  const updateLogoWidth = (event) => {
    logoWidth = event.target.value;
    updateHTML(selectedTemplate);
  };

  const generateImage = async () => {
    isImageGenerating = true;
    const iframe = ogImageTemplateWrapper.querySelector('iframe');
    const document = iframe.contentWindow.document;
    const html = document.documentElement.outerHTML;
    const {image} = await createImagePublic({
      html,
      width: previewWidth,
      height: previewHeight
    });
    imageUrl = image.url;
    isImageGenerating = false;
  };

  function sharePage(platform) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Check out this awesome OG Image Generator!');
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${encodeURIComponent('OG Image Generator')}&summary=${text}`, '_blank');
    }
  }

</script>

<svelte:head>
  <title>Free OG Image Generator: Create Custom Open Graph Images | Pictify.io</title>
  <meta name="description" content="Create stunning Open Graph images for free with Pictify.io's OG Image Generator. Boost social media engagement and SEO with custom OG images for your content.">
  <meta name="keywords" content="OG image generator, Open Graph images, social media images, SEO, content marketing">
  <link rel="canonical" href="https://pictify.io/tools/og-image-generator">
  <meta property="og:title" content="OG Image Generator | Pictify.io">
  <meta property="og:description" content="Create custom Open Graph images to improve your social media presence and SEO.">
  <meta property="og:image" content="https://media.pictify.io/z8xnl-1723429909736.png">
  <meta property="og:url" content="https://pictify.io/tools/og-image-generator">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
  {
    "@context": "http://schema.org",
    "@type": "WebApplication",
    "name": "Pictify.io OG Image Generator",
    "url": "https://pictify.io/tools/og-image-generator",
    "description": "Create custom Open Graph images for improved social media engagement and SEO.",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  </script>
</svelte:head>


<section>
  <Nav />
  <main
    class="z-10 w-full py-5 md:px-0 px-6 flex flex-col items-center justify-center space-y-8 max-w-4xl mx-auto"
  >
  <div
  class="relative w-full mx-auto flex sm:flex-row flex-col justify-center items-start sm:items-center"
>
  <svg
    class="h-auto w-16 sm:w-20 md:w-24 flex-shrink-0 p-2 md:relative sm:absolute lg:absolute left-0 lg:-translate-x-full lg:ml-32 md:translate-x-5 sm:-translate-y-16 md:-translate-y-0 -translate-x-2 lg:-translate-y-0"
    viewBox="0 0 91 98"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="m35.878 14.162 1.333-5.369 1.933 5.183c4.47 11.982 14.036 21.085 25.828 24.467l5.42 1.555-5.209 2.16c-11.332 4.697-19.806 14.826-22.888 27.237l-1.333 5.369-1.933-5.183C34.56 57.599 24.993 48.496 13.201 45.114l-5.42-1.555 5.21-2.16c11.331-4.697 19.805-14.826 22.887-27.237Z"
      fill="#FE4A60"
      stroke="#000"
      stroke-width="3.445"
    />
    <path
      d="M79.653 5.729c-2.436 5.323-9.515 15.25-18.341 12.374m9.197 16.336c2.6-5.851 10.008-16.834 18.842-13.956m-9.738-15.07c-.374 3.787 1.076 12.078 9.869 14.943M70.61 34.6c.503-4.21-.69-13.346-9.49-16.214M14.922 65.967c1.338 5.677 6.372 16.756 15.808 15.659M18.21 95.832c-1.392-6.226-6.54-18.404-15.984-17.305m12.85-12.892c-.41 3.771-3.576 11.588-12.968 12.681M18.025 96c.367-4.21 3.453-12.905 12.854-14"
      stroke="#000"
      stroke-width="2.548"
      stroke-linecap="round"
    />
  </svg>
  <h1
    class="text-3xl sm:text-4xl sm:pt-20 lg:pt-5 md:text-5xl lg:text-6xl font-bold tracking-tighter w-full inline-block text-left md:text-center relative"
  >
    OG Image Generator
    <svg
      class="w-16 lg:w-20 h-auto lg:absolute flex-shrink-0 right-0 bottom-0 md:block hidden translate-y-10 md:translate-y-20 lg:translate-y-4 lg:-translate-x-12 -translate-x-10"
      viewBox="0 0 92 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m35.213 16.953.595-5.261 2.644 4.587a35.056 35.056 0 0 0 26.432 17.33l5.261.594-4.587 2.644A35.056 35.056 0 0 0 48.23 63.28l-.595 5.26-2.644-4.587a35.056 35.056 0 0 0-26.432-17.328l-5.261-.595 4.587-2.644a35.056 35.056 0 0 0 17.329-26.433Z"
        fill="#5CF1A4"
        stroke="#000"
        stroke-width="2.868"
      />
      <path
        d="M75.062 40.108c1.07 5.255 1.072 16.52-7.472 19.54m7.422-19.682c1.836 2.965 7.643 8.14 16.187 5.121-8.544 3.02-8.207 15.23-6.971 20.957-1.97-3.343-8.044-9.274-16.588-6.254M12.054 28.012c1.34-5.22 6.126-15.4 14.554-14.369M12.035 28.162c-.274-3.487-2.93-10.719-11.358-11.75C9.104 17.443 14.013 6.262 15.414.542c.226 3.888 2.784 11.92 11.212 12.95"
        stroke="#000"
        stroke-width="2.319"
        stroke-linecap="round"
      />
    </svg>
  </h1>
</div>
<h2 class="max-w-3xl opacity-90 md:text-center text-xl">
  Generate beautiful Open Graph images for your website or blog with our OG Image Generator.
</h2>
  </main>
  <div class="px-6 md:px-0 mt-20 w-full max-w-4xl m-auto">
    <div class="w-full flex flex-col gap-4 md:flex-row">
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
        class="w-full border-[3px] border-gray-900 placeholder-gray-600 text-lg font-medium focus:outline-none py-3.5 px-6 rounded"
        placeholder="Enter you website URL"
      />
      </div>
   <div>
    <button
    on:click={(event) => {  event.preventDefault(); submitUrl(url); }}
    class="w-full px-6 text-gray-900 bg-[#ffc480] border-[3px] border-gray-900 text-lg font-medium py-3.5 rounded md:mt-0"
  >
    Fetch Website Info
  </button>
   </div>
  
  </div>
    {#if isFetchingWebsiteInfo}
    <div class="text-lg font-bold mt-10 text-gray-600">
      Fetching website info...
      <div class="mt-5 w-full bg-gray-200 rounded-full h-3 dark:bg-gray-300">
        <div class="bg-gray-900 h-3 rounded-full" style="width: 0%; animation: loading 3s forwards;"></div>
      </div>
    </div>
    {/if}
    {#if error}
    <div class="text-lg font-bold mt-10 text-red-500">
      {error}
    </div>
    {/if}

    {#if websiteInfo && selectedTemplate}
    <div class="flex-col mt-10 w-full gap-4 justify-between p-4 bg-slate-200 border-[3px] border-gray-900 rounded" bind:this={ogImageTemplateWrapper}>
      <div class="w-full flex justify-center ">
        <OgImageTemplate html={selectedTemplate} width={previewWidth} height={previewHeight} scale=0.5 />
      </div>
      <div class="w-full mt-8">

        <div class="mt-4">
          <div class="font-semibold text-lg">
            Logo
          </div>
          <div class="mt-2 flex w-full relative items-center">
            
            {#if websiteInfo.logo}
            <div>
              {#if websiteInfo.logo.startsWith('<svg')}
                <div style="width: 150px;" >
                  {@html websiteInfo.logo}
                </div>
              {:else}
                <img src={websiteInfo.logo} style="width: 150px;" alt="input-logo"/>
              {/if}
            </div>
            {/if}
            <div>
            <input
              type="file"
              class="opacity-0  ml-4 inset-0 w-full cursor-pointer absolute w-fit"
              accept="image/*"
              placeholder="Upload Logo"
              on:change={updateLogo}
            />
          </div>
          <div>
            <label for="fileInput" class="ml-4 p-2 h-fit rounded cursor-pointer bg-gray-700 text-white">
              Upload Logo
            </label>
          </div>
          </div>
          <div class="mt-4 text-sm text-gray-600">
            <input type="number" class="w-20 border-[3px] border-gray-900 placeholder-gray-600 focus:outline-none p-2 rounded" value={logoWidth} on:input={updateLogoWidth} />
            <span class="ml-2">Logo Width</span>
          </div>
          </div>

        <div class="mt-6">
          <div class="font-semibold text-lg">
            Heading
          </div>
          <input
            type="text"
            class="w-full mt-2 border-[3px] border-gray-900 placeholder-gray-600  focus:outline-none p-2 rounded"
            placeholder="Heading"
            value={websiteInfo.heading}
            on:input={updateHeading}
          />

          <div class="mt-6 font-semibold text-lg">
            Sub-Heading
          </div>
          <textarea
            class="w-full mt-2 border-[3px] border-gray-900 placeholder-gray-600 focus:outline-none p-2 rounded"
            placeholder="Sub-Heading"
            rows="4"
            value={websiteInfo.subHeading}
            on:input={updateSubHeading}
          ></textarea>
        </div>
        <div class="mt-4 relative">
          <div class="font-semibold text-lg mb-4">
            Font
          </div>
          <select
            class="w-full border-[3px] border-gray-900 placeholder-gray-600 text-lg font-medium focus:outline-none p-2 rounded"
            on:change={(e) => updateFont(combinedFonts[e.target.selectedIndex])}
          >
            {#each combinedFonts as font}
            <option value={font.id}>{font.name}</option>
            {/each}
          </select>
        </div>
        <div class="mt-4 relative">
          <div class="flex flex-col md:flex-row gap-6 z-25">
            <div class="mt-4">
              <div class="font-semibold text-lg mb-4">
                Background Color
              </div>
              <ColorPicker
                bind:rgb={backgroundColorRgb}
                isDialog={true}
                on:input={updateBackgroundColor}
              />
            </div>
  
            <div class="mt-4">
              <div class="font-semibold text-lg mb-4">
                Text Color
              </div>
              <ColorPicker
                bind:rgb={headingColorRgb}
                isDialog={true}
                on:input={updateHeadingColor}
              />
            </div>
  
            <!-- <div class="mt-4">
              <div class="font-semibold text-lg mb-4">
                Sub-Heading Color
              </div>
              <ColorPicker
                bind:rgb={subHeadingColorRgb}
                isDialog={true}
                on:input={updateSubHeadingColor}
              />
            </div> -->
          </div>

        </div>
        {#if imageUrl}
        <div class="mt-8">
          <div class="font-semibold text-lg">
            Image URL
          </div>
          <div class="flex">
            <div>
            <a href={imageUrl} download="og-image.jpg" class=" text-lg font-medium py-3.5 ">
              {imageUrl}
             </a>
            </div>

            <button
            on:click={() => {
              copyToClipboard(imageUrl);
            }}
            class="ml-4 text-xs bg-black hover:bg-black text-white py-1 px-2 rounded"
          >
            <div class="flex justify-between items-center">
              <div>Copy URL</div>
            </div>
          </button>
          </div>
          <img src={imageUrl} class="w-[150px] mt-4" alt="og-image" />
        </div>
        {/if}
        {#if isImageGenerating}
        <div class="mt-8">
          <div class="w-full text-gray-900   text-lg font-medium py-3.5 rounded">
            Generating Image...
            <div class="mt-5 w-full bg-gray-200 rounded-full h-3 dark:bg-gray-300">
              <div class="bg-gray-900 h-3 rounded-full" style="width: 0%; animation: loading 3s forwards;"></div>
            </div>
          </div>
        </div>
        {/if}
        <div class="mt-8">
          <button
            on:click={generateImage}
            disabled={isImageGenerating}
            class="w-full text-gray-900 bg-[#ffc480] border-[3px] border-gray-900 text-lg font-medium py-3.5 rounded disabled:bg-slate-400"
          >
            Generate Image
          </button>
        </div>
      </div>
    </div>
    {/if}

    <div class="mt-20 mb-10 text-2xl font-bold">
      Templates
    </div>
 
    <div class="flex flex-col md:flex-row gap-4 justify-between w-100 mb-10 flex-wrap">
    {#each templates as template}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="{selectedTemplate === template ? 'border-[3px] border-[#5cf1a4]' : ''} cursor-pointer relative w-fit "
        on:click={() => selectedTemplate = template}
      >
      <div class="absolute inset-0" style="z-index: 1;">
      {#if selectedTemplate === template}
        <div class="m-2">
          ✅
        </div>
      {/if}
      </div>
        <OgImageTemplate html={template} />
      </div>
    {/each}
  </div>

  <!-- Separator -->
  <div class="max-w-4xl mx-auto px-6 md:px-0 my-20">
    <div class="border-t-4 border-gray-900 relative">
      <div class="absolute left-1/2 -top-4 -translate-x-1/2 bg-white px-4">
        <svg class="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
        </svg>
      </div>
    </div>
  </div>

  <section class="mb-16">
    <h3 class="text-3xl font-bold mb-6">Frequently Asked Questions</h3>
    <div class="space-y-4">
      <details class="bg-gray-100 p-4 rounded-lg">
        <summary class="font-semibold cursor-pointer">What is an OG image?</summary>
        <p class="mt-2">An OG (Open Graph) image is the image that appears when your content is shared on social media platforms. It's designed to give a visual preview of your content and attract more clicks.</p>
      </details>
      <details class="bg-gray-100 p-4 rounded-lg">
        <summary class="font-semibold cursor-pointer">How do I add an OG image to my website?</summary>
        <p class="mt-2">To add an OG image to your website, you need to include the appropriate Open Graph meta tags in the &lt;head&gt; section of your HTML. The most important tag for images is og:image, which should contain the URL of your OG image.</p>
      </details>
   <details class="bg-gray-100 p-4 rounded-lg">
    <summary class="font-semibold cursor-pointer">How to use OG Image Generator?</summary>
    <p class="mt-2">
      To use OG Image Generator, simply enter your website URL, choose a template, and customize the settings to your liking. Once you're satisfied with the preview, click the "Generate Image" button to download your custom OG image.
    </p>
   </details>
   <details class="bg-gray-100 p-4 rounded-lg">
    <summary class="font-semibold cursor-pointer">
      What are the things I can customize?
    </summary>
    <p class="mt-2">
      You can customize the heading, subheading, logo, colors, and fonts to match your brand. You can also choose from our selection of professionally designed templates.
      Although some template's colors cannot be changed, you can change the font and the logo.
    </p>
   </details>
    </div>
  </section>
  
  <div class="max-w-4xl mx-auto px-6 md:px-0 my-20">
    <div class="border-t-4 border-gray-900 relative">
      <div class="absolute left-1/2 -top-4 -translate-x-1/2 bg-white px-4">
        <svg class="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
        </svg>
      </div>
    </div>
  </div>
  <!-- New SEO-optimized sections -->
  <div class="max-w-4xl mx-auto px-6 md:px-0 mb-20">
    <h2 class="text-4xl font-bold mb-10 text-center">Learn More About OG Image Generation</h2>
    
    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">What is an OG Image Generator?</h3>
      <p class="text-lg">
        An OG Image Generator is a powerful tool that creates custom Open Graph images for your website or social media content. These images appear when your links are shared on platforms like Facebook, Twitter, and LinkedIn, significantly improving click-through rates and engagement.
      </p>
    </section>

    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">Benefits of Using Our OG Image Generator</h3>
      <ul class="list-disc list-inside text-lg">
        <li>Create professional-looking OG images in minutes</li>
        <li>Customize colors, fonts, and layouts to match your brand</li>
        <li>Improve social media engagement and click-through rates</li>
        <li>No design skills required - user-friendly interface</li>
        <li>Multiple templates to choose from for various content types</li>
      </ul>
    </section>

    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">How to Use Our OG Image Generator</h3>
      <ol class="list-decimal list-inside text-lg">
        <li>Enter your website URL to fetch existing branding elements</li>
        <li>Choose from our selection of professionally designed templates</li>
        <li>Customize the heading, subheading, logo, colors, and fonts</li>
        <li>Preview your OG image in real-time</li>
        <li>Generate and download your custom OG image</li>
      </ol>
    </section>

    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">Why OG Images Matter for SEO and Social Media</h3>
      <p class="text-lg">
        Open Graph images play a crucial role in both SEO and social media marketing. They increase visibility, improve click-through rates, and provide a visual preview of your content. By using our OG Image Generator, you can create eye-catching images that stand out in social media feeds and search results, ultimately driving more traffic to your website.
      </p>
    </section>

    <!-- New section on best practices -->
    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">Best Practices for Creating Effective OG Images</h3>
      <p class="text-lg mb-4">
        To maximize the impact of your OG images, follow these best practices:
      </p>
      <ul class="list-disc list-inside text-lg">
        <li>Use high-contrast colors to ensure readability</li>
        <li>Keep text concise and to the point</li>
        <li>Include your brand logo for consistency</li>
        <li>Use high-quality, relevant imagery</li>
        <li>Maintain a 1.91:1 aspect ratio (1200x630 pixels) for optimal display</li>
        <li>Test your images across different social media platforms</li>
        <li>Update OG images regularly to keep content fresh</li>
        <li>Ensure text is legible even at smaller sizes</li>
      </ul>
      <p class="text-lg mt-4">
        By following these guidelines and using our OG Image Generator, you can create compelling OG images that boost your social media presence and drive more traffic to your website.
      </p>
    </section>
  </div>

 
  <div class="mt-8 mb-8 flex flex-col md:flex-row justify-center md:space-x-4">
    <button
      class="flex items-center justify-center px-6 py-3 bg-[#1DA1F2] text-white font-semibold rounded-full hover:bg-[#1a91da] transition duration-300 ease-in-out"
      on:click={() => sharePage('twitter')}
    >
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
      Share on Twitter
    </button>
    <button
      class="flex items-center justify-center px-6 py-3 mt-4 md:mt-0 bg-[#0A66C2] text-white font-semibold rounded-full hover:bg-[#094d92] transition duration-300 ease-in-out"
      on:click={() => sharePage('linkedin')}
    >
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      Share on LinkedIn
    </button>
  </div>

  <Footer />


</section>

<style>
  @keyframes loading {
    0% {
      width: 0%;
    }
    100% {
      width: 100%;
    }
  }
</style>

