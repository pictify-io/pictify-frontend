<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import CodeEditor from '$lib/components/tools/CodeEditor.svelte';
  import SignUpButton from '$lib/components/landingPage/SignUpButton.svelte';

</script>

<svelte:head>
  <title>Pictify.io: Convert HTML to JPG for free</title>
  <meta name="description" content="Pictify.io is a free HTML to JPG API">
  <meta name="keywords" content="HTML to JPG, HTML to JPG API, HTML to JPG conversion, HTML to JPG converter, JPG, API, Pictify.io, Pictify, Pictify API, Pictify.io API, Pictify.io JPG API, Pictify.io HTML to JPG API, Pictify.io HTML to JPG conversion API, Pictify.io HTML to JPG converter">
  <meta name="author" content="Pictify.io">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta Property="og:title" content="Pictify.io">
  <meta Property="og:description" content="Pictify.io is a free HTML to JPG conversion API">
  <meta Property="og:image" content="https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png">
  <meta Property="og:url" content="https://pictify.io">
  <meta Property="og:type" content="website">
  <meta Property="og:site_name" content="Pictify.io">
  <meta Property="og:locale" content="en_US">
</svelte:head>

<section class=" bg-[#FFFDF8] min-h-screen  flex flex-col justify-between md:items-start items-between tails-selected-element lg:overflow-x-hidden md:overflow-x-hidden " data-tails-scripts="//unpkg.com/alpinejs" contenteditable="false">
  <Nav />

    <main class=" z-10 w-full  py-5 md:px-0 px-6 flex flex-col items-center justify-center space-y-8 max-w-4xl mx-auto">
      <div class="relative w-full mx-auto flex sm:flex-row flex-col justify-center items-start sm:items-center">
          <svg class="h-auto w-16  sm:w-20 md:w-24 flex-shrink-0 p-2 md:relative sm:absolute lg:absolute left-0 lg:-translate-x-full lg:ml-32 md:translate-x-5 sm:-translate-y-16 md:-translate-y-0 -translate-x-2 lg:-translate-y-0" viewBox="0 0 91 98" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="m35.878 14.162 1.333-5.369 1.933 5.183c4.47 11.982 14.036 21.085 25.828 24.467l5.42 1.555-5.209 2.16c-11.332 4.697-19.806 14.826-22.888 27.237l-1.333 5.369-1.933-5.183C34.56 57.599 24.993 48.496 13.201 45.114l-5.42-1.555 5.21-2.16c11.331-4.697 19.805-14.826 22.887-27.237Z" fill="#FE4A60" stroke="#000" stroke-width="3.445"></path>
              <path d="M79.653 5.729c-2.436 5.323-9.515 15.25-18.341 12.374m9.197 16.336c2.6-5.851 10.008-16.834 18.842-13.956m-9.738-15.07c-.374 3.787 1.076 12.078 9.869 14.943M70.61 34.6c.503-4.21-.69-13.346-9.49-16.214M14.922 65.967c1.338 5.677 6.372 16.756 15.808 15.659M18.21 95.832c-1.392-6.226-6.54-18.404-15.984-17.305m12.85-12.892c-.41 3.771-3.576 11.588-12.968 12.681M18.025 96c.367-4.21 3.453-12.905 12.854-14" stroke="#000" stroke-width="2.548" stroke-linecap="round"></path>
          </svg>
          <h1 class="text-4xl sm:text-5xl sm:pt-20 lg:pt-5 md:text-5xl lg:text-6xl font-bold tracking-tighter w-full inline-block text-left md:text-center relative">HTML To JPG
          <svg class="w-16 lg:w-20 h-auto lg:absolute flex-shrink-0 right-0 bottom-0 md:block hidden translate-y-10 md:translate-y-20 lg:translate-y-4 lg:-translate-x-12 -translate-x-10" viewBox="0 0 92 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="m35.213 16.953.595-5.261 2.644 4.587a35.056 35.056 0 0 0 26.432 17.33l5.261.594-4.587 2.644A35.056 35.056 0 0 0 48.23 63.28l-.595 5.26-2.644-4.587a35.056 35.056 0 0 0-26.432-17.328l-5.261-.595 4.587-2.644a35.056 35.056 0 0 0 17.329-26.433Z" fill="#5CF1A4" stroke="#000" stroke-width="2.868"></path>
              <path d="M75.062 40.108c1.07 5.255 1.072 16.52-7.472 19.54m7.422-19.682c1.836 2.965 7.643 8.14 16.187 5.121-8.544 3.02-8.207 15.23-6.971 20.957-1.97-3.343-8.044-9.274-16.588-6.254M12.054 28.012c1.34-5.22 6.126-15.4 14.554-14.369M12.035 28.162c-.274-3.487-2.93-10.719-11.358-11.75C9.104 17.443 14.013 6.262 15.414.542c.226 3.888 2.784 11.92 11.212 12.95" stroke="#000" stroke-width="2.319" stroke-linecap="round"></path>
          </svg>
      </div>
      <p class="max-w-3xl opacity-70 md:text-center text-lg">
         Convert HTML to JPG for free. Pictify offers APIs to convert HTML to image or gif. Input your HTML code, check the preview, and download the JPG image.
      </p>
  </main> 
  <div class="w-full flex justify-center mt-20">
    <CodeEditor />
  </div>
  <div class="mt-20 w-full">
    <div class="text-4xl md:px-0 px-6 font-bold text-left md:text-center ">
      <h2>How to convert HTML to JPG</h2>
    </div>
    <div class="mt-10 md:px-0 px-6 flex flex-col sm:flex-row max-w-6xl  mx-auto gap-6">
      <div class="flex-1 rounded-xl p-4 border-[3px] border-gray-900 bg-[#EBEBEB]">
        <h3 class="text-xl font-bold">Step 1: Input your HTML code</h3>
        <p class="mt-2">Paste your HTML code in the editor above. You can also use the default HTML code provided in the editor.</p>
      </div>
      <div class="flex-1 rounded-xl p-4 border-[3px] border-gray-900 bg-[#EBEBEB]">
        <h3 class="text-xl font-bold">Step 2: Check the preview</h3>
        <p class="mt-2">Check the preview of the image generated from your HTML code. You can also customize the view port by changing the width, height, and scale.</p>
      </div>
      <div class="flex-1 rounded-xl p-4 border-[3px] border-gray-900 bg-[#EBEBEB]">
        <h3 class="text-xl font-bold">Step 3: Create the JPG image</h3>
        <p class="mt-2">Once you are satisfied with the preview, click on the image button to create the JPG image. You can download the image or copy the image URL.</p>
        </div>
    </div>
  </div>
  <div class="mt-20 w-full">
    <div class="text-4xl md:px-0 px-6 font-bold text-left md:text-center ">
      <h2>Best HTML to Image API 🚀</h2>
    </div>
  </div>
  <div class="mt-20 mb-20 md:px-0 px-6  w-full flex justify-center">
    <div class="max-w-3xl rounded-xl relative z-20 pl-8 sm:pl-10 pr-8 sm:pr-16 py-8 border-[3px] border-gray-900 bg-[#EBEBEB]">
      <h1 class="text-xl font-bold">HTML To Image: Create personalized images at scale with Pictify.io</h1>
      <div class="mt-2">
        <div>
          Scale your media creation with Pictify.io's HTML to Image API. Convert HTML to image or gif with a simple API call. Be it certificates, social sharing card, or personalized images for email campaigns, Pictify.io has got you covered. 
        </div>
        <div class="mt-5">
          <ul>
            <li class="w-100 rounded-xl pl-8 sm:pl-6 pr-8 sm:pr-6 py-4 border-[3px] border-gray-900 bg-[#fffcf5]">
              <p class="">⚡️ Fastest HTML to Image/Gif API. All other alternatives fall behind us</p>
            </li>
            <li class="w-100 mt-4 rounded-xl pl-8 sm:pl-6 pr-8 sm:pr-6 py-4 border-[3px] border-gray-900 bg-[#fffcf5]">
              <p class="">🌏 Images generated are served via CDN by default</p>
            </li>
            <li class="w-100 mt-4 rounded-xl pl-8 sm:pl-6 pr-8 sm:pr-6 py-4 border-[3px] border-gray-900 bg-[#fffcf5]">
              <p class="">🔄 Access the image instantly. No queues and rate limit</p>
            </li>
            <li class="w-100 mt-4 rounded-xl pl-8 sm:pl-6 pr-8 sm:pr-6 py-4 border-[3px] border-gray-900 bg-[#fffcf5]">
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
  <Footer />
</section>

