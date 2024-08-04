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
    isFetchingWebsiteInfo = true;
    websiteInfo = await getWebsiteInfo(url);
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
    await new Promise((resolve) => {
      iframe.onload = resolve;
    });
    
    await updateHTML(selectedTemplate);
  };

  const templateNames = ['template-1'];
  let templates = [];

  onMount(async() => {
    templates = await Promise.all(templateNames.map(async(name) => {
      const template = await getTemplate(name);
      return template;
    }));

    selectedTemplate = templates[0];
  });

  const updateHTML = (html) => {
    console.log('updateHTML');
    console.log(html);
    const iframe = ogImageTemplateWrapper.querySelector('iframe');

    const document = iframe.contentWindow.document;
    const heading= document.querySelector('#template-heading');
    const subHeading= document.querySelector('#template-subheading');
    const logo= document.querySelector('#template-logo');
    heading.innerHTML = websiteInfo.heading || '';
    subHeading.innerHTML = websiteInfo.subHeading || '';

    if(logo) {
      if(websiteInfo.logo && websiteInfo.logo.startsWith('<svg')) {
       
        logo.outerHTML = websiteInfo.logo;
        logo.id = 'template-logo';
        websiteInfo.logo = URL.createObjectURL(new Blob([websiteInfo.logo], {type: 'image/svg+xml'}));
      } else {
      logo.src = websiteInfo.logo;
      logo.width = logoWidth;
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

  const updateLogo = (event) => {
    websiteInfo.logo = URL.createObjectURL(event.target.files[0]);
    updateHTML(selectedTemplate);
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



</script>


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
    class="w-full px-6 text-gray-900 bg-[#ffc480] border-[3px] border-gray-900 text-lg font-medium py-3.5 rounded mt-4 md:mt-0"
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
            <img src={websiteInfo.logo} class="w-[150px]" alt="input-logo"/>
            {/if}
            <input
              type="file"
              class="opacity-0 absolute inset-0 w-full cursor-pointer"
              accept="image/*"
              placeholder="Upload Logo"
              on:change={updateLogo}
            />
            <label for="fileInput" class="ml-4 p-2 h-fit rounded cursor-pointer bg-gray-700 text-white">
              Upload Logo
            </label>
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
 
    <div class="flex flex-col md:flex-row gap-2 mb-10">
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
</div>
  <Footer />

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
</section>

