<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Hero from '$lib/components/landingPage/Hero.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import TryNow from '$lib/components/landingPage/TryNow.svelte';
	import Editor from '$lib/components/grapeJS/editor.svelte';
	import UseCase from '$lib/components/landingPage/UseCase.svelte';
	import Api from '$lib/components/landingPage/Api.svelte';
	import SignUpButton from '$lib/components/landingPage/SignUpButton.svelte';
	import WhyPictify from '$lib/components/landingPage/WhyPictify.svelte';
	import Featured from '$lib/components/landingPage/Featured.svelte';
	import CodeEditor from '$lib/components/tools/CodeEditor.svelte';

	import posthog from 'posthog-js';
	import { onMount } from 'svelte';

	let isTestFeatureFlag = false;

	onMount(() => {
		posthog.featureFlags.override({ 'create-image-home': 'test' });
		if (posthog.getFeatureFlag('create-image-home') === 'test') {
			isTestFeatureFlag = true;
		} else {
			isTestFeatureFlag = false;
		}
	});
</script>

<svelte:head>
	<title>Pictify.io: Free HTML to Image and GIF API | Boost Engagement</title>
	<meta
		name="description"
		content="Convert HTML to images and GIFs with Pictify.io's powerful API. Create shareable content, boost engagement, and make your brand stand out. Try it for free!"
	/>
	<meta
		name="keywords"
		content="HTML to image, HTML to GIF, image API, content creation, social media engagement, Pictify.io"
	/>
	<meta name="author" content="Pictify.io" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta property="og:title" content="Pictify.io: HTML to Image and GIF API" />
	<meta
		property="og:description"
		content="Create stunning visuals from HTML with Pictify.io's powerful API. Boost engagement and make your brand stand out. Try it for free!"
	/>
	<meta
		property="og:image"
		content="https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png"
	/>
	<meta property="og:url" content="https://pictify.io" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Pictify.io" />
	<meta property="og:locale" content="en_US" />
	<script type="application/ld+json">
	{
	  "@context": "https://schema.org/",
	  "@type": "SoftwareApplication",
	  "name": "Pictify.io",
	  "url": "https://pictify.io",
	  "image": "https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png",
	  "description": "Transform HTML to stunning images and GIFs with Pictify.io's powerful API. Create shareable content, boost engagement, and make your brand stand out.",
	  "applicationCategory": "DesignApplication",
	  "operatingSystem": "Web",
	  "offers": {
		"@type": "Offer",
		"price": "0",
		"priceCurrency": "USD"
	  },
	  "aggregateRating": {
		"@type": "AggregateRating",
		"ratingValue": "4.8",
		"ratingCount": "7"
	  }
	}
	</script>
</svelte:head>

<section
	class="w-screen bg-[#FFFDF8] min-h-screen md:h-screen flex flex-col justify-between md:items-start items-between tails-selected-element lg:overflow-x-hidden md:overflow-x-hidden"
	data-tails-scripts="//unpkg.com/alpinejs"
	contenteditable="false"
>
	<Nav />
	<Hero />
	<SignUpButton />
	{#if isTestFeatureFlag}
		<div class="w-full mx-auto flex items-center justify-center my-14">
			<div>
				<div class="hidden sm:flex w-[100%]">
					<div class="flex-1" />
					<div class="flex-1">
						<img
							alt="click here"
							class="w-52 translate-x-[150px] mb-4"
							src="https://res.cloudinary.com/diroilukd/image/upload/v1715193941/arrow-l_jir4in.png"
						/>
					</div>
				</div>
				<CodeEditor isGifEnabled={true} />
			</div>
		</div>
	{:else}
		<Editor isLandingPage={true} />
	{/if}
	<Api />
	<!-- <SignUpButton /> -->
	<WhyPictify />
	<UseCase />
	<Featured />
	<TryNow />
	
	<Footer />
</section>