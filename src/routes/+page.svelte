<script>
	import Nav from '$lib/components/landing/Nav.svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import ProofSheet from '$lib/components/landing/ProofSheet.svelte';
	import Contract from '$lib/components/landing/Contract.svelte';
	import VideoSection from '$lib/components/landing/VideoSection.svelte';
	import Moments from '$lib/components/landing/Moments.svelte';
	import Integrations from '$lib/components/landing/Integrations.svelte';
	import CampaignsBlock from '$lib/components/landing/CampaignsBlock.svelte';
	import ClosingCta from '$lib/components/landing/ClosingCta.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { analytics } from '$lib/telemetry.js';

	// Gates every scroll reveal on the page (see app.css). Set on the client only,
	// so a blocked bundle or a reduced-motion preference leaves the page complete
	// and static instead of hiding content that JS never comes back to reveal.
	let motion = false;

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
			motion = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('scroll', trackScrollDepth);
		}
	});
</script>

<svelte:head>
	<title>Pictify | Templated media API for images, PDFs, GIFs and video</title>
	<meta
		name="description"
		content="Write one HTML template with named variables. Anything that can fill them — your code, a spreadsheet, a webhook, a person, an agent — renders a PNG, JPG, PDF, GIF or MP4. Node and Python SDKs, Zapier, Make, n8n and an MCP server. Free tier."
	/>
	<meta
		name="keywords"
		content="templated media, image generation API, html to image, html to pdf, html to video API, personalized images API, OG image generation, PDF generation API, CSV to PDF, bulk document generation, MCP server, Zapier image generation, Pictify.io"
	/>
	<meta name="author" content="Pictify.io" />
	<meta property="og:title" content="Pictify | Templated media for developers" />
	<meta
		property="og:description"
		content="One HTML template declares its variables. Anything that can fill them makes a file — PNG, JPG, PDF, GIF or MP4."
	/>
	<meta property="og:image" content="https://media.pictify.io/v3g37-1775406808141.png" />
	<meta property="og:url" content="https://pictify.io" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Pictify.io" />
	<meta property="og:locale" content="en_US" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Pictify | Templated media for developers" />
	<meta
		name="twitter:description"
		content="One HTML template declares its variables. Anything that can fill them makes a file — PNG, JPG, PDF, GIF or MP4."
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
			'Templated media API. Write one HTML template that declares its variables, then let anything fill them — your code, a spreadsheet, a webhook, a person or an AI agent — and get back a PNG, JPG, PDF, GIF or MP4.',
		applicationCategory: ['DeveloperApplication', 'DesignApplication', 'Utility'],
		operatingSystem: 'Web',
		featureList: [
			'HTML templates with typed, validated variables',
			'PNG, JPG, PDF, GIF and MP4 output from one template',
			'Personalized video rendering (timeline editor, code, or AI-authored templates)',
			'Batch rendering from CSV, and per-workflow webhooks',
			'Per-row status and a CDN link for every rendered file',
			'REST API, Node and Python SDKs, Zapier, Make, n8n, and an MCP server for AI agents'
		],
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD',
			availability: 'https://schema.org/InStock'
		}
	})}</script>`}
</svelte:head>

<!-- .landing-v2 opts this page out of the app-wide root font-size down-scale (see app.css). -->
<div class="landing-v2 w-full overflow-x-hidden" class:motion>
	<Nav />
	<main>
		<!-- 1. Templated media for developers -->
		<Hero />

		<!-- 2. What one template and one spreadsheet actually produced -->
		<ProofSheet />

		<!-- 3. The contract: a template declares variables, five callers fill them -->
		<Contract />

		<!-- 4. Same variables, now it moves -->
		<VideoSection />

		<!-- 5. Four moments where a product has to hand someone a file -->
		<Moments />

		<!-- 6. Call it from wherever you already are -->
		<Integrations />

		<!--
			7. One truthful example of the campaigns pilot.
			Placed after Integrations, not before: the homepage sells the API to
			developers, and campaigns is a different buyer arriving for a different
			reason. It earns a block, not the stage.
		-->
		<CampaignsBlock />

		<!-- 8. Closing -->
		<ClosingCta />
	</main>
	<Footer />
</div>
