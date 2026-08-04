<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Hero from '$lib/components/landingPage/Hero.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import TryNow from '$lib/components/landingPage/TryNow.svelte';
	import ScaleUseCases from '$lib/components/landingPage/ScaleUseCases.svelte';
	import UseCaseRouter from '$lib/components/landingPage/UseCaseRouter.svelte';
	import DeliveryProof from '$lib/components/landingPage/DeliveryProof.svelte';
	import AgentShowcase from '$lib/components/landingPage/AgentShowcase.svelte';
	import ApiShowcase from '$lib/components/landingPage/ApiShowcase.svelte';
	import HowItWorks from '$lib/components/landingPage/HowItWorks.svelte';
	import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';
	import MidSectionCta from '$lib/components/landingPage/MidSectionCta.svelte';
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
	<title>Pictify — Turn Your Data into Documents & Videos, Delivered</title>
	<meta
		name="description"
		content="Upload a spreadsheet, point a webhook, or call the API — every row becomes a branded certificate, badge, report or personalized video, rendered and emailed to each recipient with per-person delivery status. Free tier available."
	/>
	<meta
		name="keywords"
		content="certificate generator, event badge generator, bulk document generation, CSV to certificates, personalized video generation, video generation API, webhook document automation, personalized email delivery, template rendering, MCP server, Pictify.io"
	/>
	<meta name="author" content="Pictify.io" />
	<meta
		property="og:title"
		content="Pictify — Turn Your Data into Documents & Videos, Delivered"
	/>
	<meta
		property="og:description"
		content="Every row becomes a branded certificate, badge, report or personalized video — rendered and emailed to each recipient with per-person delivery status."
	/>
	<meta property="og:image" content="https://media.pictify.io/v3g37-1775406808141.png" />
	<meta property="og:url" content="https://pictify.io" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Pictify.io" />
	<meta property="og:locale" content="en_US" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="Pictify — Turn Your Data into Documents & Videos, Delivered"
	/>
	<meta
		name="twitter:description"
		content="Every row becomes a branded certificate, badge, report or personalized video — rendered and emailed to each recipient with per-person delivery status."
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
			'Turn your data into branded documents and videos. Upload a spreadsheet, point a webhook, or call the API — every row becomes a certificate, badge, report or personalized video, rendered and emailed to each recipient with per-person delivery status.',
		applicationCategory: ['DesignApplication', 'DeveloperApplication', 'Utility'],
		operatingSystem: 'Web',
		featureList: [
			'Workflows with CSV upload and per-workflow webhooks',
			'HTML document templates',
			'Personalized video rendering (timeline editor, code, or AI-authored templates)',
			'Per-recipient email delivery with per-row delivery status, bounce handling and re-send',
			'Batch rendering',
			'REST API, SDKs and MCP server for AI agents'
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

	<!-- 2. Use-case router: one engine, three ways in (documents / video / API+agents) -->
	<UseCaseRouter />
	<SectionSeparator icon="arrow" />

	<!-- 3. Delivery proof: "everything else stops at the send" + per-row run summary -->
	<DeliveryProof />

	<!-- 4. Use Cases: Recognition Moments -->
	<ScaleUseCases />

	<!-- 5. Agent-native: AI authoring, MCP, always-on workflows -->
	<AgentShowcase />
	<SectionSeparator icon="hash" />

	<!-- 6. Core Workflow: Template → Data → Image -->
	<HowItWorks />

	<!-- 4. Contextual CTA -->
	<MidSectionCta />
	<SectionSeparator icon="bolt" />

	<!-- 7. API Integration: Code First -->
	<ApiShowcase />
	<SectionSeparator icon="hash" />

	<!-- Responsive Image API section retired from the homepage (2026-08): it sold
		 "one template → Instagram/Twitter/LinkedIn/YouTube sizes", which is the
		 pre-pivot social-image story and dilutes the document-workflow message.
		 The component is untouched on disk if it's wanted on a dedicated page. -->

	<!-- 6. Infrastructure & Integrations -->
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
