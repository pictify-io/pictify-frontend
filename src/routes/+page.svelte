<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Hero from '$lib/components/landingPage/Hero.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import TryNow from '$lib/components/landingPage/TryNow.svelte';
	import ScaleUseCases from '$lib/components/landingPage/ScaleUseCases.svelte';
	import ApiShowcase from '$lib/components/landingPage/ApiShowcase.svelte';
	import HowItWorks from '$lib/components/landingPage/HowItWorks.svelte';
	import CanvasShowcase from '$lib/components/landingPage/CanvasShowcase.svelte';
	import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';
	import MidSectionCta from '$lib/components/landingPage/MidSectionCta.svelte';
	import ExperimentsShowcase from '$lib/components/landingPage/ExperimentsShowcase.svelte';
	import IntegrationsEcosystem from '$lib/components/landingPage/IntegrationsEcosystem.svelte';
	import ResponsiveShowcase from '$lib/components/landingPage/ResponsiveShowcase.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { analytics } from '$lib/analytics.js';

	// Scroll depth tracking
	let scrollDepthsTracked = new Set();

	function trackScrollDepth() {
		if (!browser) return;

		const scrollTop = window.scrollY;
		const docHeight = document.documentElement.scrollHeight - window.innerHeight;
		const scrollPercent = Math.round((scrollTop / docHeight) * 100);

		const milestones = [25, 50, 75, 100];
		for (const milestone of milestones) {
			if (scrollPercent >= milestone && !scrollDepthsTracked.has(milestone)) {
				scrollDepthsTracked.add(milestone);
				analytics.trackScrollDepth({ depth: milestone, page: '/' });
			}
		}
	}

	onMount(() => {
		if (browser) {
			window.addEventListener('scroll', trackScrollDepth, { passive: true });
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('scroll', trackScrollDepth);
		}
	});
</script>

<svelte:head>
	<title>Pictify — Image Generation API for Developers | No Puppeteer, No Infra</title>
	<meta
		name="description"
		content="Generate images from templates and data with one API call. Replace your Puppeteer scripts and rendering microservices. <200ms response, 99.9% uptime. Free tier available."
	/>
	<meta
		name="keywords"
		content="image generation API, dynamic image API, template image rendering, OG image generator, social card API, replace puppeteer, image automation API, programmatic image generation, Pictify.io"
	/>
	<meta name="author" content="Pictify.io" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta property="og:title" content="Pictify — Image Generation API for Developers" />
	<meta
		property="og:description"
		content="Generate images from templates and data with one API call. Replace your Puppeteer scripts and rendering microservices. <200ms response, 99.9% uptime."
	/>
	<meta
		property="og:image"
		content="https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png"
	/>
	<meta property="og:url" content="https://pictify.io" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Pictify.io" />
	<meta property="og:locale" content="en_US" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Pictify — Image Generation API for Developers" />
	<meta
		name="twitter:description"
		content="Generate images from templates and data with one API call. Replace your Puppeteer scripts and rendering microservices. <200ms response, 99.9% uptime."
	/>
	<meta
		name="twitter:image"
		content="https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png"
	/>
	<meta name="twitter:site" content="@pictify_io" />
	<link rel="canonical" href="https://pictify.io/" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'Pictify.io',
		url: 'https://pictify.io',
		image: 'https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png',
		description: 'Generate images from templates and data with one API call. Replace Puppeteer scripts and rendering microservices. <200ms response, 99.9% uptime. Free tier available.',
		applicationCategory: ['DesignApplication', 'DeveloperApplication', 'Utility'],
		operatingSystem: 'Web',
		featureList: [
			'Expression engine with 50+ functions',
			'Visual template editor with drag-and-drop',
			'A/B testing with Thompson Sampling',
			'Smart links with geo/device targeting',
			'Scheduled image variants',
			'REST API with <200ms latency',
			'Webhooks and storage connectors',
			'AI copilot for template generation',
			'AI-powered smart resize',
			'Batch image generation'
		],
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD',
			availability: 'https://schema.org/InStock'
		}
	})}</script>`}
</svelte:head>

<section
	class="w-screen bg-[#FFFDF8] min-h-screen flex flex-col justify-between md:items-start items-between lg:overflow-x-hidden md:overflow-x-hidden"
>
	<Nav />

	<!-- 1. Hero: Problem + Solution -->
	<Hero />
	<SectionSeparator icon="arrow" />

	<!-- 2. Use Cases: Recognition Moments -->
	<ScaleUseCases />
	<SectionSeparator icon="hash" />

	<!-- 3. Core Workflow: Template → Data → Image -->
	<HowItWorks />

	<!-- 4. Contextual CTA -->
	<MidSectionCta />
	<SectionSeparator icon="bolt" />

	<!-- 5. API Integration: Code First -->
	<ApiShowcase />
	<SectionSeparator icon="hash" />

	<!-- 6. Template Builder: Visual Editor -->
	<CanvasShowcase />
	<SectionSeparator icon="star" />

	<!-- 6.5. Responsive Image API -->
	<ResponsiveShowcase />
	<SectionSeparator icon="bolt" />

	<!-- 7. Infrastructure & Integrations -->
	<IntegrationsEcosystem />
	<SectionSeparator icon="arrow" />

	<!-- 8. Advanced: Experiments & Optimization -->
	<ExperimentsShowcase />
	<SectionSeparator icon="bolt" />

	<!-- 9. Final CTA -->
	<div class="w-full bg-[#FFFDF8]">
		<div class="max-w-5xl mx-auto px-4">
			<TryNow />
		</div>
	</div>

	<SectionSeparator icon="hash" />
	<Footer />
</section>
