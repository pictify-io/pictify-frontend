<script>
	import '../app.css';
	import { getUser } from '../store/user.store';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { analytics } from '$lib/analytics.js';

	// Initialize analytics
	if (browser) {
		analytics.init();
		analytics.captureUTM();
	}

	onMount(async () => {
		await getUser();
	});

	// Sitewide brand-identity schema — every page gets this once, so search
	// and AI engines have one consistent entity to resolve "who is Pictify"
	// against, rather than only the homepage's page-specific schema.
	const organizationSchema = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'Pictify',
		url: 'https://pictify.io',
		logo: 'https://pictify.io/logo.png',
		description:
			'API-first image, document, and video generation. Every row of a spreadsheet or webhook becomes a rendered, personalized certificate, badge, report, or video, delivered by email.',
		sameAs: ['https://github.com/pictify-io']
	};
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify(organizationSchema)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')}</script>`}
</svelte:head>

<slot />
