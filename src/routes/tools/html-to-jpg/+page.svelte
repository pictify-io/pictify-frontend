<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import CodeEditor from '$lib/components/tools/CodeEditor.svelte';
	import SignUpButton from '$lib/components/landingPage/SignUpButton.svelte';

	function sharePage(platform) {
		const url = encodeURIComponent(window.location.href);
		const text = encodeURIComponent('Check out this awesome HTML to JPG converter!');
		if (platform === 'twitter') {
			window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
		} else if (platform === 'linkedin') {
			window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${encodeURIComponent('HTML to JPG Converter')}&summary=${text}`, '_blank');
		}
	}
</script>



<svelte:head>
	<title>Free HTML to JPG Converter | Online Tool by Pictify.io</title>
	<meta name="description" content="Convert HTML to high-quality JPG images for free with Pictify.io's online HTML to JPG converter. Perfect for creating social media content, email marketing visuals, and website mockups." />
	<meta
		name="keywords"
		content="HTML to JPG, HTML to JPG API, HTML to JPG conversion, HTML to JPG converter, JPG, API, Pictify.io, Pictify, Pictify API, Pictify.io API, Pictify.io JPG API, Pictify.io HTML to JPG API, Pictify.io HTML to JPG conversion API, Pictify.io HTML to JPG converter"
	/>
	<meta name="author" content="Pictify.io" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta Property="og:title" content="Pictify.io" />
	<meta Property="og:description" content="Convert HTML to high-quality JPG images for free with Pictify.io's online HTML to JPG converter. Perfect for creating social media content, email marketing visuals, and website mockups." />
	<meta
		Property="og:image"
		content="https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png"
	/>
	<meta Property="og:url" content="https://pictify.io" />
	<meta Property="og:type" content="website" />
	<meta Property="og:site_name" content="Pictify.io" />
	<meta Property="og:locale" content="en_US" />

	<script type="application/ld+json">
		{
			"@context": "http://schema.org",
			"@type": "WebApplication",
			"name": "Pictify.io OG Image Generator",
			"url": "https://pictify.io/tools/og-image-generator",
			"description": "Convert HTML to high-quality JPG images for free with Pictify.io's online HTML to JPG converter. Perfect for creating social media content, email marketing visuals, and website mockups.",
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

<section
	class=" bg-[#FFFDF8] min-h-screen flex flex-col justify-between md:items-start items-between tails-selected-element lg:overflow-x-hidden md:overflow-x-hidden"
	data-tails-scripts="//unpkg.com/alpinejs"
	contenteditable="false"
>
	<Nav />

	<main
		class=" z-10 w-full py-5 md:px-0 px-6 flex flex-col items-center justify-center space-y-8 max-w-4xl mx-auto"
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
				class="text-4xl sm:text-5xl sm:pt-20 lg:pt-5 md:text-5xl lg:text-6xl font-bold tracking-tighter w-full inline-block text-left md:text-center relative"
			>
				HTML To JPG
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
		<h1 class="max-w-3xl opacity-70 md:text-center text-lg">
			Convert HTML to JPG for free. Pictify offers APIs to convert HTML to image or gif. Input your
			HTML code, check the preview, and download the JPG image.
		</h1>
	</main>
	<div class="w-full flex justify-center mt-20">
		<CodeEditor />
	</div>
	<div class="mt-20 w-full">
		<div class="text-4xl md:px-0 px-6 font-bold text-left md:text-center">
			<h2>How to convert HTML to JPG</h2>
		</div>
		<div class="mt-10 md:px-0 px-6 flex flex-col sm:flex-row max-w-6xl mx-auto gap-6">
			<div class="flex-1 rounded-xl p-4 border-[3px] border-gray-900 bg-[#EBEBEB]">
				<h3 class="text-xl font-bold">Step 1: Input your HTML code</h3>
				<p class="mt-2">
					Paste your HTML code in the editor above. You can also use the default HTML code provided
					in the editor.
				</p>
			</div>
			<div class="flex-1 rounded-xl p-4 border-[3px] border-gray-900 bg-[#EBEBEB]">
				<h3 class="text-xl font-bold">Step 2: Check the preview</h3>
				<p class="mt-2">
					Check the preview of the image generated from your HTML code. You can also customize the
					view port by changing the width, height, and scale.
				</p>
			</div>
			<div class="flex-1 rounded-xl p-4 border-[3px] border-gray-900 bg-[#EBEBEB]">
				<h3 class="text-xl font-bold">Step 3: Create the JPG image</h3>
				<p class="mt-2">
					Once you are satisfied with the preview, click on the image button to create the JPG
					image. You can download the image or copy the image URL.
				</p>
			</div>
		</div>
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

	<div class="max-w-4xl mx-auto px-6 md:px-0 mt-20 mb-20">
		<section class="mb-16">
			<h2 class="text-3xl font-bold mb-6">Why Use Pictify.io's HTML to JPG Converter?</h2>
			<ul class="list-disc list-inside text-lg space-y-2">
				<li>100% Free: Convert HTML to JPG without any cost or hidden fees</li>
				<li>User-friendly Interface: Simple, intuitive design for easy conversions</li>
				<li>High-Quality Output: Generate crisp, clear JPG images from your HTML</li>
				<li>Customizable Options: Adjust image dimensions and quality settings</li>
				<li>Fast Processing: Get your JPG images in seconds</li>
				<li>No Installation Required: Use directly in your browser</li>
				<li>Privacy-Focused: Your HTML code is not stored on our servers</li>
			</ul>
		</section>
	
		<section class="mb-16">
			<h2 class="text-3xl font-bold mb-6">Popular Use Cases for HTML to JPG Conversion</h2>
			<div class="space-y-4">
				<div>
					<h3 class="text-2xl font-semibold mb-2">1. Social Media Content</h3>
					<p class="text-lg">Create eye-catching images for social media posts by converting HTML designs to JPG format, ensuring consistent appearance across platforms.</p>
				</div>
				<div>
					<h3 class="text-2xl font-semibold mb-2">2. Email Marketing</h3>
					<p class="text-lg">Generate JPG images from HTML email templates to use as fallbacks or to ensure your email designs display correctly in all email clients.</p>
				</div>
				<div>
					<h3 class="text-2xl font-semibold mb-2">3. Website Mockups</h3>
					<p class="text-lg">Convert HTML prototypes to JPG images for easy sharing and presentation to clients or team members.</p>
				</div>
				<div>
					<h3 class="text-2xl font-semibold mb-2">4. Documentation and Tutorials</h3>
					<p class="text-lg">Create visual examples of HTML code output for documentation, tutorials, or educational materials.</p>
				</div>
			</div>
		</section>
	
		<section class="mb-16">
			<h2 class="text-3xl font-bold mb-6">HTML to JPG Conversion: Best Practices</h2>
			<ul class="list-disc list-inside text-lg space-y-2">
				<li>Optimize your HTML for conversion by using inline styles when possible</li>
				<li>Consider the target image dimensions when designing your HTML</li>
				<li>Use web-safe fonts or include custom fonts in your HTML to ensure accurate rendering</li>
				<li>Test different quality settings to find the optimal balance between file size and image clarity</li>
				<li>For complex layouts, consider breaking the design into multiple conversions and combining the results</li>
			</ul>
		</section>
	
		<section class="mb-16">
			<h2 class="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
			<div class="space-y-4">
				<details class="bg-gray-100 p-4 rounded-lg">
					<summary class="font-semibold cursor-pointer">How does the HTML to JPG converter work?</summary>
					<p class="mt-2">Our converter renders your HTML code in a virtual browser environment and captures the output as a high-quality JPG image. This process ensures that your HTML is accurately represented in the final image.</p>
				</details>
				<details class="bg-gray-100 p-4 rounded-lg">
					<summary class="font-semibold cursor-pointer">Can I convert HTML with external resources?</summary>
					<p class="mt-2">Yes, our converter supports HTML with external resources such as images and stylesheets. However, for the best results and fastest conversion, we recommend using inline styles and data URIs for images when possible.</p>
				</details>
				<details class="bg-gray-100 p-4 rounded-lg">
					<summary class="font-semibold cursor-pointer">What's the maximum file size for conversion?</summary>
					<p class="mt-2">Our free tool supports HTML files up to 5MB in size. For larger files or batch conversions, consider upgrading to our premium plan or API service.</p>
				</details>
				<details class="bg-gray-100 p-4 rounded-lg">
					<summary class="font-semibold cursor-pointer">Is my HTML code kept private?</summary>
					<p class="mt-2">Yes, we take your privacy seriously. Your HTML code is processed in real-time and is not stored on our servers. Once the conversion is complete, all data is immediately deleted.</p>
				</details>
			</div>
		</section>
	</div>

	<div class="w-full flex justify-center">
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
</div>
	<Footer />
</section>