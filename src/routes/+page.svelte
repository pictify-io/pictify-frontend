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
	import AgentScreenshotDemo from '$lib/components/landingPage/AgentScreenshotDemo.svelte';

	import posthog from 'posthog-js';
	import { onMount } from 'svelte';

	let isTestFeatureFlag = true;

	onMount(() => {
		posthog.featureFlags.override({ 'create-image-home': 'test' });
		if (posthog.getFeatureFlag('create-image-home') === 'test') {
			isTestFeatureFlag = true;
		} else {
			isTestFeatureFlag = true;
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
		{JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'SoftwareApplication',
			name: 'Pictify.io',
			url: 'https://pictify.io',
			image: 'https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png',
			description:
				"Transform HTML to stunning images and GIFs with Pictify.io's powerful API. Create shareable content, boost engagement, and make your brand stand out.",
			applicationCategory: ['DesignApplication', 'Utility'],
			operatingSystem: 'Web',
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'USD',
				availability: 'https://schema.org/InStock'
			},
			aggregateRating: {
				'@type': 'AggregateRating',
				ratingValue: '4.8',
				ratingCount: '7'
			}
		})}
	</script>
</svelte:head>

<section
	class="w-screen bg-[#FFFDF8] min-h-screen flex flex-col justify-between md:items-start items-between lg:overflow-x-hidden md:overflow-x-hidden"
	data-tails-scripts="//unpkg.com/alpinejs"
	contenteditable="false"
>
	<Nav />
	
	<!-- Hero Section -->
	<Hero />

	<!-- Interactive Demo Section -->
	{#if isTestFeatureFlag}
		<div class="w-full bg-white border-t-2 border-b-2 border-gray-900 py-16 md:py-20 relative overflow-hidden">
			<!-- Decorative elements -->
			<div class="absolute inset-0 overflow-hidden pointer-events-none">
				<div class="absolute top-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ff6b6b]/10 to-transparent rounded-full blur-[100px] transform -translate-y-1/2 animate-float"></div>
				<div class="absolute bottom-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ffc480]/10 to-transparent rounded-full blur-[100px] transform translate-y-1/2 animate-float-delayed"></div>
			</div>

			<div class="max-w-5xl mx-auto px-4 relative">
				<div class="text-center space-y-4 mb-12">
					<h2 class="text-4xl sm:text-5xl font-bold text-gray-900">Try it <span class="text-[#ff6b6b]">yourself</span></h2>
					<p class="text-lg text-gray-700 max-w-2xl mx-auto">Experience the power of Pictify's HTML to Image conversion in real-time</p>
				</div>

							<div class="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl border-2 border-gray-900 shadow-lg">
					<CodeEditor isGifEnabled={true} />
				</div>

				<div class="mt-8 text-center">
					<p class="text-sm text-gray-600">Want to see more examples? Check out our <a href="https://docs.pictify.io/" target="_blank" class="text-[#ff6b6b] hover:underline font-medium">documentation</a></p>
				</div>
			</div>
		</div>
	{:else}
		<Editor isLandingPage={true} />
	{/if}

	<!-- AI Agent Demo -->
	<AgentScreenshotDemo />

	<!-- Features Section -->
	<div class="w-full bg-white  border-t-2 border-b-2 border-gray-900">
		<div class="max-w-5xl mx-auto px-4">
			<WhyPictify />
		</div>
	</div>

	<!-- API Documentation -->
	<div class="w-full  px-4">
		<div class="max-w-5xl mx-auto">
			<Api />
		</div>
	</div>

	<!-- Use Cases -->
	<div class="w-full bg-white  border-t-2 border-b-2 border-gray-900">
		<div class="max-w-5xl mx-auto px-4">
			<UseCase />
		</div>
	</div>

	<!-- Social Proof -->
	<div class="w-full  px-4">
		<div class="max-w-5xl mx-auto">
			<Featured />
		</div>
	</div>

	<!-- Final CTA -->
	<div class="w-full bg-white  border-t-2 border-gray-900">
		<div class="max-w-5xl mx-auto px-4">
			<TryNow />
		</div>
	</div>

	<Footer />
</section>