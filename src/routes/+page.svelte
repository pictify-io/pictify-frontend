<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Hero from '$lib/components/landingPage/Hero.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import TryNow from '$lib/components/landingPage/TryNow.svelte';
	import ScaleUseCases from '$lib/components/landingPage/ScaleUseCases.svelte';
	import ApiShowcase from '$lib/components/landingPage/ApiShowcase.svelte';
	import HowItWorks from '$lib/components/landingPage/HowItWorks.svelte';
	import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';
	import MidSectionCta from '$lib/components/landingPage/MidSectionCta.svelte';
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
	<title>Pictify — Turn Spreadsheets into Branded Documents, Delivered</title>
	<meta
		name="description"
		content="Upload a CSV or point a webhook — every row becomes a branded certificate, badge or report, rendered and emailed to each recipient. Plus a rendering API for developers. Free tier available."
	/>
	<meta
		name="keywords"
		content="certificate generator, event badge generator, bulk document generation, CSV to certificates, webhook document automation, personalized email delivery, image generation API, template rendering, Pictify.io"
	/>
	<meta name="author" content="Pictify.io" />
	<meta
		property="og:title"
		content="Pictify — Turn Spreadsheets into Branded Documents, Delivered"
	/>
	<meta
		property="og:description"
		content="Upload a CSV or point a webhook — every row becomes a branded certificate, badge or report, rendered and emailed to each recipient. Plus a rendering API for developers."
	/>
	<meta property="og:image" content="https://media.pictify.io/v3g37-1775406808141.png" />
	<meta property="og:url" content="https://pictify.io" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Pictify.io" />
	<meta property="og:locale" content="en_US" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="Pictify — Turn Spreadsheets into Branded Documents, Delivered"
	/>
	<meta
		name="twitter:description"
		content="Upload a CSV or point a webhook — every row becomes a branded certificate, badge or report, rendered and emailed to each recipient. Plus a rendering API for developers."
	/>
	<meta name="twitter:image" content="https://media.pictify.io/v3g37-1775406808141.png" />
	<meta name="twitter:site" content="@pictify_io" />
	<link rel="canonical" href="https://pictify.io/" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'Pictify.io',
		url: 'https://pictify.io',
		image: 'https://media.pictify.io/v3g37-1775406808141.png',
		description:
			'Turn spreadsheets into branded documents. Upload a CSV or point a webhook — every row becomes a certificate, badge or report, rendered and emailed to each recipient. Plus a rendering API for developers.',
		applicationCategory: ['DesignApplication', 'DeveloperApplication', 'Utility'],
		operatingSystem: 'Web',
		featureList: [
			'Workflows with CSV upload and per-workflow webhooks',
			'HTML document templates',
			'Per-recipient email delivery',
			'Batch rendering',
			'REST API and SDKs'
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
	class="w-screen bg-brand-bg min-h-screen flex flex-col justify-between md:items-start items-between lg:overflow-x-hidden md:overflow-x-hidden"
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

	<!-- 6. Responsive Image API -->
	<ResponsiveShowcase />
	<SectionSeparator icon="bolt" />

	<!-- 7. Infrastructure & Integrations -->
	<IntegrationsEcosystem />
	<SectionSeparator icon="arrow" />

	<!-- 8. Final CTA -->
	<div class="w-full bg-brand-bg">
		<div class="max-w-5xl mx-auto px-4">
			<TryNow />
		</div>
	</div>

	<SectionSeparator icon="hash" />
	<Footer />
</section>
