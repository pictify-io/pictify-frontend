<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Hero from '$lib/components/landingPage/Hero.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import TryNow from '$lib/components/landingPage/TryNow.svelte';
	import ThreePillars from '$lib/components/landingPage/ThreePillars.svelte';
	import ScaleUseCases from '$lib/components/landingPage/ScaleUseCases.svelte';
	import ApiShowcase from '$lib/components/landingPage/ApiShowcase.svelte';
	import Featured from '$lib/components/landingPage/Featured.svelte';
	import CodeEditor from '$lib/components/tools/CodeEditor.svelte';
	import HowItWorks from '$lib/components/landingPage/HowItWorks.svelte';
	import CanvasShowcase from '$lib/components/landingPage/CanvasShowcase.svelte';
	import CollaborationWorkflow from '$lib/components/landingPage/CollaborationWorkflow.svelte';
	import PictifyAdvantage from '$lib/components/landingPage/PictifyAdvantage.svelte';
	import WhatYouCanDo from '$lib/components/landingPage/WhatYouCanDo.svelte';
	import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';
</script>

<svelte:head>
	<title>Pictify.io: Dynamic Media Infrastructure for Teams | HTML to Image API</title>
	<meta
		name="description"
		content="Dynamic media infrastructure for teams. Designers build templates, developers integrate APIs, and your company renders pixel-perfect images, GIFs, and PDFs at scale."
	/>
	<meta
		name="keywords"
		content="HTML to image API, image generation API, visual content automation, programmatic image generation, enterprise image API, Pictify.io"
	/>
	<meta name="author" content="Pictify.io" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta property="og:title" content="Pictify.io: Dynamic Media Infrastructure for Teams" />
	<meta
		property="og:description"
		content="Design-first, API-powered dynamic media. Build templates, render variants, and generate pixel-perfect images, GIFs, and PDFs at scale."
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
				'Dynamic media infrastructure for teams. Designers build templates, developers integrate APIs, and you render pixel-perfect media at scale.',
			applicationCategory: ['DesignApplication', 'DeveloperApplication', 'Utility'],
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
				ratingCount: '150'
			}
		})}
	</script>
</svelte:head>

<section
	class="w-screen bg-[#FFFDF8] min-h-screen flex flex-col justify-between md:items-start items-between lg:overflow-x-hidden md:overflow-x-hidden"
>
	<Nav />
	
	<!-- Hero Section -->
	<Hero />
	<SectionSeparator icon="arrow" />

	<!-- Canvas Editor Showcase -->
	<CanvasShowcase />
	<SectionSeparator icon="bolt" />

	<!-- Collaboration Workflow -->
	<!-- <CollaborationWorkflow />
	<SectionSeparator icon="hash" /> -->

	<!-- How It Works Pipeline -->
	<HowItWorks />
	<SectionSeparator icon="star" />

	<!-- What You Can Do -->
	<WhatYouCanDo />
	<SectionSeparator icon="hash" />

	<!-- Three Pillars -->
	<!-- <ThreePillars />
	<SectionSeparator icon="bolt" /> -->

	<!-- API Showcase -->
	<!-- <ApiShowcase />
	<SectionSeparator icon="arrow" /> -->

	<!-- Pictify Advantage (Merged ROI & Why) -->
	<PictifyAdvantage />
	<SectionSeparator icon="bolt" />

	<!-- Scale-Focused Use Cases -->
	<ScaleUseCases />
	<SectionSeparator icon="bolt" />

	<!-- Final CTA -->
	<div class="w-full bg-[#FFFDF8]">
		<div class="max-w-5xl mx-auto px-4">
			<TryNow />
		</div>
	</div>

	<SectionSeparator icon="hash" />
	<Footer />
</section>