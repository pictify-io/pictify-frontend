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
	<title>Pictify.io: Ship Personalized Images at API Speed | A/B Test & Auto-Optimize</title>
	<meta
		name="description"
		content="The programmable image engine for SaaS teams. Design with expressions + logic, render via API in <200ms. A/B test images, target by geo/device/time, auto-optimize with Thompson Sampling."
	/>
	<meta
		name="keywords"
		content="programmable image API, image generation with logic, template expressions, dynamic image API, data-driven visuals, conditional image generation, AI image templates, A/B test images, image experiments, Pictify.io"
	/>
	<meta name="author" content="Pictify.io" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta property="og:title" content="Pictify.io: Ship Personalized Images at API Speed" />
	<meta
		property="og:description"
		content="The programmable image engine for SaaS teams. Design with expressions + logic, render via API in <200ms. A/B test images, target by geo/device/time, auto-optimize with Thompson Sampling."
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
	<meta name="twitter:title" content="Pictify.io: Ship Personalized Images at API Speed" />
	<meta
		name="twitter:description"
		content="The programmable image engine for SaaS teams. Design with expressions + logic, render via API in <200ms. A/B test images, target by geo/device/time, auto-optimize with Thompson Sampling."
	/>
	<meta
		name="twitter:image"
		content="https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png"
	/>
	<meta name="twitter:site" content="@pictify_io" />
	<link rel="canonical" href="https://pictify.io/" />
	<script type="application/ld+json">
		{JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'SoftwareApplication',
			name: 'Pictify.io',
			url: 'https://pictify.io',
			image: 'https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png',
			description:
				'The programmable image engine for SaaS teams. Design with expressions + logic, render via API in <200ms. A/B test images, target by geo/device/time, auto-optimize with Thompson Sampling.',
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
				'Background removal',
				'Batch image generation'
			],
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'USD',
				availability: 'https://schema.org/InStock'
			}
		})}
	</script>
</svelte:head>

<section
	class="w-screen bg-[#FFFDF8] min-h-screen flex flex-col justify-between md:items-start items-between lg:overflow-x-hidden md:overflow-x-hidden"
>
	<Nav />

	<!-- 1. Hero Section -->
	<Hero />
	<SectionSeparator icon="arrow" />

	<!-- 2. How It Works Pipeline -->
	<HowItWorks />

	<!-- 3. Contextual CTA after How It Works -->
	<MidSectionCta />
	<SectionSeparator icon="hash" />

	<!-- 4. Canvas Editor Showcase -->
	<CanvasShowcase />
	<SectionSeparator icon="bolt" />

	<!-- 5. Experiments Showcase (Killer Differentiator) -->
	<ExperimentsShowcase />
	<SectionSeparator icon="star" />

	<!-- 6. Integrations Ecosystem -->
	<IntegrationsEcosystem />
	<SectionSeparator icon="arrow" />

	<!-- 7. Scale-Focused Use Cases -->
	<ScaleUseCases />
	<SectionSeparator icon="bolt" />

	<!-- 8. API Showcase (Developer-Focused) -->
	<ApiShowcase />
	<SectionSeparator icon="hash" />

	<!-- 9. Final CTA -->
	<div class="w-full bg-[#FFFDF8]">
		<div class="max-w-5xl mx-auto px-4">
			<TryNow />
		</div>
	</div>

	<SectionSeparator icon="hash" />
	<Footer />
</section>
