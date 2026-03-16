<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';
	import { analytics } from '$lib/analytics.js';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	onMount(() => {
		analytics.track('page_viewed', { page: 'dynamic_images_landing' });
	});

	function trackCTA(ctaText) {
		analytics.trackCTAClicked({ cta_text: ctaText, location: 'dynamic_images_landing' });
	}

	const useCases = [
		{
			title: 'E-commerce',
			description: 'Live product pricing, stock indicators, and personalized product recommendations that update automatically.',
			iconPath: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z',
			color: 'bg-[#ff6b6b]'
		},
		{
			title: 'Dashboards',
			description: 'KPI snapshots for Slack, email, or embeds. Share live metric images that always show current data.',
			iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			color: 'bg-[#4ade80]'
		},
		{
			title: 'Email',
			description: 'Open-time personalization with live data — city, weather, countdown timers, and more.',
			iconPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
			color: 'bg-[#ffc480]'
		},
		{
			title: 'Social Media',
			description: 'Auto-updating social cards with live stats, follower counts, or real-time event data.',
			iconPath: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
			color: 'bg-[#a78bfa]'
		}
	];

	const steps = [
		{
			number: '01',
			title: 'Design Your Template',
			description: 'Use the visual editor to create your image template with variables like {{product_name}}, {{price}}, {{status}}.'
		},
		{
			number: '02',
			title: 'Connect a Data Source',
			description: 'Point to any HTTP API, webhook, or static JSON. Map response fields to your template variables.'
		},
		{
			number: '03',
			title: 'Get a Live URL',
			description: 'Every request to your Dynamic Link renders fresh data. Embed it anywhere — it always shows the latest.'
		}
	];

	const dataSources = [
		{ name: 'REST APIs', description: 'Any HTTP endpoint — GET or POST', status: 'available', iconPath: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
		{ name: 'Webhooks', description: 'Push-based updates from any service', status: 'available', iconPath: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
		{ name: 'Static JSON', description: 'Manual data for testing or simple use cases', status: 'available', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
		{ name: 'Shopify', description: 'Product catalog sync', status: 'coming', iconPath: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
		{ name: 'Airtable', description: 'Spreadsheet-powered images', status: 'coming', iconPath: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
		{ name: 'Google Sheets', description: 'Live spreadsheet data', status: 'coming', iconPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
	];

	const faqs = [
		{
			q: 'How often do images refresh?',
			a: 'You control the refresh policy with a TTL (time-to-live). Default is 5 minutes. You can set it as low as 60 seconds or as high as 24 hours. On each request after the TTL expires, fresh data is fetched and a new image is rendered.'
		},
		{
			q: 'What data sources are supported?',
			a: 'Any HTTP endpoint (REST API) that returns JSON. You can also use webhooks for push-based updates, or static JSON for testing. Native connectors for Shopify, Airtable, and Google Sheets are coming soon.'
		},
		{
			q: 'Is there caching?',
			a: 'Yes. Rendered images are cached based on your TTL setting. If the data source is unavailable, we can serve the last successful render (serve_stale policy) or show a default image.'
		},
		{
			q: 'How fast is the rendering?',
			a: 'Most images render in under 500ms. The first request after a TTL expiry fetches fresh data and renders, which may take 1-2 seconds. Subsequent requests within the TTL are served from cache instantly.'
		},
		{
			q: 'Can I use Dynamic Links in emails?',
			a: 'Absolutely! Embed the Dynamic Link URL as an <img> src in your email. Each time the email is opened, the image renders with the latest data. Check our Email Personalization page for ESP-specific guides.'
		}
	];

	let openFaq = -1;

	// Demo state
	let demoData = JSON.stringify({ product_name: 'Wireless Headphones', price: '$79.99', discount: '20% OFF' }, null, 2);
	let demoRendered = false;

	function runDemo() {
		demoRendered = true;
		analytics.track('dynamic_images_demo_run', {});
	}
</script>

<svelte:head>
	<title>Dynamic Image Links — Auto-Updating Images from Live Data | Pictify</title>
	<meta name="description" content="Create images that update automatically from APIs, databases, and webhooks. Perfect for e-commerce, dashboards, and personalized email." />
	<meta property="og:title" content="Dynamic Image Links — Auto-Updating Images from Live Data | Pictify" />
	<meta property="og:description" content="Create images that update automatically from APIs, databases, and webhooks." />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Dynamic Image Links | Pictify" />
	<meta name="twitter:description" content="Images that update themselves from live data sources." />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'Pictify Dynamic Image Links',
		applicationCategory: 'MultimediaApplication',
		description: 'Create images that update automatically from APIs, databases, and webhooks.',
		featureList: [
			'Live data binding',
			'REST API data sources',
			'Webhook integration',
			'Configurable refresh TTL',
			'Serve stale on error',
			'Auto-updating image URLs'
		],
		offers: {
			'@type': 'AggregateOffer',
			lowPrice: '0',
			highPrice: '249',
			priceCurrency: 'USD',
			offerCount: '5',
			availability: 'https://schema.org/InStock'
		}
	})}</script>`}
</svelte:head>

<div class="min-h-screen bg-[#FFFDF8]">
	<Nav />

	<!-- Hero Section -->
	<section class="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden" in:fly={{ y: 30, duration: 600 }}>
		<!-- Decorative blobs for Pop feel -->
		<div class="absolute top-10 left-10 w-24 h-24 bg-[#ffc480] rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
		<div class="absolute top-0 right-10 w-32 h-32 bg-[#4ade80] rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000"></div>
		<div class="absolute -bottom-10 left-40 w-28 h-28 bg-[#ff6b6b] rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-4000"></div>

		<div class="max-w-6xl mx-auto text-center relative z-10">
			<div
				class="inline-flex items-center gap-2 px-5 py-2 mb-8 bg-[#ffc480] border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937] transform -rotate-1 hover:rotate-1 hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#1f2937] transition-all cursor-default"
			>
				<span class="w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-gray-900" />
				<span class="text-sm font-black uppercase tracking-wider text-gray-900">Live Data · Auto-Refresh</span>
			</div>

			<h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 leading-[0.95] mb-8">
				Images That<br />
				<span class="relative inline-block text-[#ff6b6b] mt-2">
					Update Themselves
					<svg class="absolute w-full h-4 -bottom-1 left-0 text-gray-900 opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>
			</h1>

			<p class="text-xl sm:text-2xl text-gray-700 font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
				Connect your data. Your images stay fresh. Dynamic Links pull live data from any API, database, or spreadsheet — and render a new image on every request. <br class="hidden sm:block" />
				<span class="font-black text-gray-900 bg-[#4ade80] px-2 border-b-[3px] border-gray-900 mt-2 inline-block shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">No cron jobs. No stale content.</span>
			</p>

			<div class="flex flex-col sm:flex-row gap-6 justify-center">
				<a
					href="/signup"
					on:click={() => trackCTA('Try Dynamic Links')}
					class="px-8 py-4 bg-gray-900 text-white font-black text-lg border-[3px] border-gray-900 rounded-xl
						shadow-[8px_8px_0_0_#ffc480] hover:shadow-[4px_4px_0_0_#ffc480] hover:translate-x-1 hover:translate-y-1
						transition-all duration-200 text-center flex items-center justify-center gap-2 group"
				>
					Try Dynamic Links Free
					<svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform border-[2px] border-white rounded-full p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
						<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
					</svg>
				</a>
				<a
					href="/templates"
					on:click={() => trackCTA('Browse Templates')}
					class="px-8 py-4 bg-white text-gray-900 font-black text-lg border-[3px] border-gray-900 rounded-xl
						shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1
						transition-all duration-200 text-center"
				>
					Browse Templates
				</a>
			</div>
		</div>
	</section>

	<SectionSeparator icon="bolt" />

	<!-- Use Cases Grid -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-white relative border-y-[3px] border-gray-900">
		<!-- Background Elements -->
		<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

		<div class="max-w-7xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#7dd3fc] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform rotate-2">
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Capabilities</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
					Every Image, Always Current
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
					From e-commerce to dashboards — Dynamic Links keep your visuals in sync with reality.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
				{#each useCases as useCase, i}
					{@const colors = ['bg-[#ff6b6b]', 'bg-[#4ade80]', 'bg-[#ffc480]', 'bg-[#a78bfa]']}
					{@const rotations = ['rotate-1', '-rotate-1', '-rotate-1', 'rotate-1']}
					<div
						class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] hover:-translate-y-2 transition-all duration-300 flex flex-col group overflow-hidden {rotations[i]}"
						in:fly={{ y: 20, duration: 400, delay: i * 100 }}
					>
						<!-- Colorful Header Block -->
						<div class="{colors[i % colors.length]} p-6 border-b-[3px] border-gray-900 flex items-center justify-between">
							<div class="w-12 h-12 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] group-hover:rotate-12 transition-transform">
								<svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d={useCase.iconPath} />
								</svg>
							</div>
							<div class="w-2 h-2 rounded-full border-[2px] border-gray-900 bg-white/50" />
						</div>

						<!-- Visual Block -->
						<div class="bg-gray-50 border-b-[3px] border-gray-900 p-6 flex items-center justify-center relative overflow-hidden h-48">
							<div class="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000_2px,transparent_2px)] [background-size:12px_12px]" />
							
							{#if i === 0}
								<!-- E-commerce Visual -->
								<div class="w-full max-w-[220px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex flex-col overflow-hidden relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all">
									<div class="h-24 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
										<div class="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-200 transform -rotate-6 flex items-center justify-center">👟</div>
										<div class="absolute top-2 right-2 bg-[#ff6b6b] text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-gray-900 shadow-sm animate-pulse">Low Stock</div>
									</div>
									<div class="p-3 bg-white">
										<div class="h-2 w-3/4 bg-gray-200 rounded mb-2"></div>
										<div class="flex items-center justify-between">
											<div class="font-black text-gray-900">$129.99</div>
											<div class="text-[9px] font-bold text-gray-400">Live API ⚡️</div>
										</div>
									</div>
								</div>
							{:else if i === 1}
								<!-- Dashboards Visual -->
								<div class="w-full max-w-[240px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex flex-col relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all overflow-hidden">
									<div class="bg-gray-900 px-3 py-2 flex items-center justify-between">
										<div class="text-[10px] font-black tracking-widest text-[#4ade80] uppercase">MRR Growth</div>
										<div class="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></div>
									</div>
									<div class="p-4 bg-gray-50 flex flex-col items-center">
										<div class="font-black text-3xl text-gray-900 mb-2">$84.2K</div>
										<div class="w-full h-12 flex items-end gap-1">
											<div class="flex-1 bg-gray-300 h-1/4 rounded-t"></div>
											<div class="flex-1 bg-gray-300 h-2/4 rounded-t"></div>
											<div class="flex-1 bg-gray-300 h-1/3 rounded-t"></div>
											<div class="flex-1 bg-[#4ade80] h-3/4 rounded-t border-t-[2px] border-x-[2px] border-gray-900"></div>
											<div class="flex-1 bg-[#4ade80] h-full rounded-t border-t-[2px] border-x-[2px] border-gray-900 relative">
												<div class="absolute -top-4 w-full text-center text-[8px] font-bold text-gray-900">Today</div>
											</div>
										</div>
									</div>
								</div>
							{:else if i === 2}
								<!-- Email Visual -->
								<div class="w-full max-w-[200px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex flex-col relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all overflow-hidden">
									<div class="bg-gray-100 border-b-[2px] border-gray-900 px-2 py-1 flex items-center gap-1.5">
										<div class="w-1.5 h-1.5 rounded-full bg-[#ff6b6b] border border-gray-900"></div>
										<div class="w-1.5 h-1.5 rounded-full bg-[#ffc480] border border-gray-900"></div>
										<div class="w-1.5 h-1.5 rounded-full bg-[#4ade80] border border-gray-900"></div>
									</div>
									<div class="p-3 bg-white space-y-2">
										<div class="w-1/2 h-2 bg-gray-200 rounded"></div>
										<div class="w-full h-2 bg-gray-200 rounded"></div>
										
										<!-- Live Countdown Image -->
										<div class="bg-gray-900 text-white rounded p-3 text-center border-2 border-gray-900 mt-2 shadow-sm">
											<div class="text-[8px] font-bold text-[#ffc480] uppercase tracking-widest mb-1 shadow-[0_0_4px_rgba(255,196,128,0.5)]">Sale Ends In</div>
											<div class="flex justify-center gap-2 font-black font-mono text-lg leading-none">
												<div class="flex flex-col"><span class="animate-pulse">04</span><span class="text-[6px] text-gray-400 tracking-wider">HRS</span></div>
												<div class="text-gray-500">:</div>
												<div class="flex flex-col"><span class="animate-pulse animation-delay-500">29</span><span class="text-[6px] text-gray-400 tracking-wider">MIN</span></div>
											</div>
										</div>
									</div>
								</div>
							{:else if i === 3}
								<!-- Social Visual -->
								<div class="w-full max-w-[220px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex flex-col relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all overflow-hidden">
									<div class="h-24 bg-gradient-to-r from-[#a78bfa] to-[#ffb6ff] border-b-[3px] border-gray-900 flex items-center justify-center flex-col relative pt-2">
										<div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:10px_10px]"></div>
										<div class="font-black text-3xl text-gray-900 drop-shadow-[2px_2px_0_#fff] relative z-10 mix-blend-hard-light">+1,200</div>
										<div class="text-[10px] font-bold text-gray-900 uppercase tracking-widest bg-white/50 backdrop-blur px-2 py-0.5 rounded border border-gray-900 mt-1 shadow-sm relative z-10">New Followers</div>
									</div>
									<div class="p-2.5 bg-gray-100 flex items-center gap-2">
										<div class="w-4 h-4 rounded-full bg-gray-300"></div>
										<div class="h-2 w-1/2 bg-gray-300 rounded"></div>
									</div>
								</div>
							{/if}
						</div>

						<!-- Content Block -->
						<div class="p-6 md:p-8 flex-1 flex flex-col bg-white">
							<h3 class="text-2xl font-black text-gray-900 mb-3 leading-tight transition-colors">{useCase.title}</h3>
							<p class="text-gray-700 text-lg font-medium leading-relaxed">{useCase.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<SectionSeparator icon="arrow" />

	<!-- How It Works -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-[#fdf2f8] border-b-[3px] border-gray-900 overflow-hidden relative">
		<!-- Decorative Background Pattern -->
		<div
			class="absolute inset-0 opacity-[0.03] pointer-events-none"
			style="background-image: radial-gradient(#000 2px, transparent 2px); background-size: 32px 32px;"
		/>

		<div class="max-w-5xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#f43f5e] text-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform -rotate-2">
					<span class="text-sm font-bold uppercase tracking-wider">Workflow</span>
				</div>
				<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
					Three Steps to <br class="hidden sm:block" />
					<span class="text-[#f43f5e]">Live Images</span>
				</h2>
			</div>

			<div class="space-y-6 md:space-y-8 relative">
				<!-- Connecting line (desktop only) -->
				<div class="hidden md:block absolute left-12 top-10 bottom-10 w-[3px] bg-gray-900 z-0 border-l-[3px] border-dashed border-gray-900"></div>

				{#each steps as step, i}
					{@const colors = ['bg-[#ffc480]', 'bg-[#7dd3fc]', 'bg-[#a78bfa]']}
					<div
						class="flex flex-col md:flex-row items-start gap-6 relative z-10 group"
						in:fly={{ x: -20, duration: 400, delay: i * 150 }}
					>
						<!-- Number Badge -->
						<div class="flex-shrink-0 w-16 h-16 md:w-24 md:h-24 {colors[i]} border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center rounded-2xl transform transition-transform group-hover:scale-110 group-hover:-rotate-3 z-10">
							<span class="text-2xl md:text-4xl font-black text-gray-900">{step.number}</span>
						</div>

						<!-- Content Card -->
						<div class="flex-1 bg-white p-6 md:p-8 border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] group-hover:shadow-[12px_12px_0_0_#1f2937] rounded-3xl transition-all duration-300 md:-ml-8 md:mt-4 z-0 group-hover:translate-x-1 group-hover:-translate-y-1">
							<h3 class="text-2xl md:text-3xl font-black text-gray-900 mb-3">{step.title}</h3>
							<p class="text-gray-700 text-lg md:text-xl font-medium leading-relaxed">{step.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<SectionSeparator icon="hash" />

	<!-- Data Source Connectors -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-white relative">
		<!-- Background Elements -->
		<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

		<div class="max-w-6xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#4ade80] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform rotate-1">
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Integrations</span>
				</div>
				<h2 class="text-4xl sm:text-5xl border-[3px] border-transparent font-black text-gray-900 mb-6">
					Connect Any Data Source
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
					If it returns JSON, Pictify can turn it into a live image.
				</p>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each dataSources as source, i}
					{@const colors = ['bg-[#ffc480]', 'bg-[#7dd3fc]', 'bg-[#a78bfa]', 'bg-[#ff6b6b]', 'bg-[#4ade80]', 'bg-white']}
					<div class="flex items-center gap-4 p-5 bg-white border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:shadow-[10px_10px_0_0_#1f2937] hover:-translate-y-1 rounded-2xl transition-all group">
						<div class="w-14 h-14 {colors[i % colors.length]} border-[3px] border-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0_0_#1f2937] group-hover:-rotate-6 transition-transform">
							<svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d={source.iconPath} />
							</svg>
						</div>
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<h3 class="font-black text-lg text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{source.name}</h3>
								{#if source.status === 'coming'}
									<span class="text-[10px] px-2 py-0.5 bg-[#ffc480] border-[2px] border-gray-900 font-black tracking-wider uppercase rounded transform -rotate-2 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">Soon</span>
								{/if}
							</div>
							<p class="text-sm text-gray-700 font-medium leading-tight">{source.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<SectionSeparator icon="star" />

	<!-- Interactive Demo -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-[#fdf2f8] border-b-[3px] border-gray-900 overflow-hidden relative">
		<!-- Decorative Background Pattern -->
		<div
			class="absolute inset-0 opacity-[0.03] pointer-events-none"
			style="background-image: radial-gradient(#000 2px, transparent 2px); background-size: 32px 32px;"
		/>

		<div class="max-w-6xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform -rotate-2">
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Playground</span>
				</div>
				<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
					See It <br class="hidden sm:block" />
					<span class="text-[#ff6b6b]">In Action</span>
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
					Edit the JSON data below and watch the image update in real-time.
				</p>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
				<!-- Data Source Input -->
				<div class="bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] rounded-xl overflow-hidden flex flex-col group transition-shadow hover:shadow-[12px_12px_0_0_#1f2937]">
					<div class="px-5 py-3 bg-gray-100 border-b-[3px] border-gray-900 text-gray-900 font-black text-sm flex items-center gap-2">
						<span class="w-3.5 h-3.5 rounded-full bg-[#ff6b6b] border-2 border-gray-900 shadow-[1px_1px_0_0_rgba(0,0,0,0.2)]" />
						<span class="w-3.5 h-3.5 rounded-full bg-[#ffc480] border-2 border-gray-900 shadow-[1px_1px_0_0_rgba(0,0,0,0.2)]" />
						<span class="w-3.5 h-3.5 rounded-full bg-[#4ade80] border-2 border-gray-900 shadow-[1px_1px_0_0_rgba(0,0,0,0.2)]" />
						<span class="ml-3 tracking-wide uppercase text-xs">api-response.json</span>
					</div>
					<textarea
						bind:value={demoData}
						class="w-full h-56 p-6 font-mono text-sm text-gray-900 bg-white border-none resize-none focus:outline-none focus:ring-4 focus:ring-[#ffc480]/30 transition-shadow transition-colors placeholder-gray-400"
						spellcheck="false"
					/>
					<div class="p-5 border-t-[3px] border-gray-900 bg-gray-50 flex-none">
						<button
							on:click={runDemo}
							class="w-full px-6 py-4 bg-[#7dd3fc] text-gray-900 font-black text-lg border-[3px] border-gray-900 rounded-lg shadow-[6px_6px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-150 flex items-center justify-center gap-2"
						>
							Render Preview
							<svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
								<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Rendered Output -->
				<div class="bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] rounded-xl overflow-hidden flex flex-col transition-shadow hover:shadow-[12px_12px_0_0_#1f2937]">
					<div class="px-5 py-3 bg-gray-900 text-white font-black text-sm tracking-wide uppercase text-center border-b-[3px] border-gray-900 relative">
						Output Preview
					</div>
					<div class="p-8 flex-1 flex flex-col items-center justify-center min-h-[340px] bg-[radial-gradient(#e5e7eb_2px,transparent_2px)] [background-size:24px_24px]">
						{#if demoRendered}
							<div class="text-center w-full" in:fade={{ duration: 300 }}>
								{#if demoData}
									{@const parsed = (() => { try { return JSON.parse(demoData); } catch { return null; } })()}
									{#if parsed}
										<div class="bg-gradient-to-br from-[#ffc480] to-[#ff6b6b] p-8 md:p-10 border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] text-left max-w-sm mx-auto rounded-xl transform rotate-1 hover:rotate-0 transition-transform">
											<p class="text-3xl md:text-4xl font-black text-white mb-2 leading-none">{parsed.product_name || 'Product'}</p>
											<p class="text-4xl md:text-5xl font-black text-gray-900 mb-4">{parsed.price || '$0'}</p>
											{#if parsed.discount}
												<span class="inline-block px-4 py-2 bg-white text-gray-900 font-black text-sm border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform -rotate-2">{parsed.discount}</span>
											{/if}
										</div>
										<div class="mt-8 inline-block px-4 py-2 bg-gray-900 text-white border-[2px] border-gray-900 text-xs font-black uppercase tracking-wider rounded shadow-[4px_4px_0_0_#ffc480] animate-bounce" style="animation-duration: 2s;">
											This image updates instantly!
										</div>
									{:else}
										<div class="bg-[#f43f5e]/10 border-[3px] border-[#f43f5e] text-[#f43f5e] font-black p-6 rounded-xl max-w-xs mx-auto text-center transform -rotate-1 shadow-[4px_4px_0_0_#f43f5e]">
											<svg class="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
											Invalid JSON Structure
										</div>
									{/if}
								{/if}
							</div>
						{:else}
							<div class="text-center text-gray-400 max-w-[200px] mx-auto">
								<svg class="w-20 h-20 mx-auto mb-6 opacity-40 hover:opacity-100 hover:text-[#ffc480] transition-colors cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" on:click={runDemo} on:keydown={(e) => e.key === 'Enter' && runDemo()} role="button" tabindex="0">
									<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
								</svg>
								<p class="font-bold text-gray-500 text-lg uppercase tracking-wider">Awaiting Render</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</section>

	<SectionSeparator icon="bolt" />

	<!-- Pricing CTA -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-[#7dd3fc] border-b-[3px] border-gray-900 overflow-hidden relative">
		<!-- Dynamic Background Pattern -->
		<div
			class="absolute inset-0 opacity-[0.15] pointer-events-none"
			style="background-image: radial-gradient(#000 2px, transparent 2px); background-size: 24px 24px;"
		/>

		<!-- Floating decorative elements -->
		<div class="absolute top-10 right-10 w-16 h-16 bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] animate-bounce" style="animation-duration: 3s; border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;"></div>
		<div class="absolute bottom-10 left-10 w-24 h-24 bg-[#ff6b6b] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full animate-bounce" style="animation-duration: 4.5s;"></div>

		<div class="max-w-4xl mx-auto text-center relative z-10">
			<!-- Neo-Brutalist Container -->
			<div class="p-8 sm:p-12 md:p-16 bg-white border-[3px] border-gray-900 rounded-[2rem] shadow-[12px_12px_0_0_#1f2937] hover:shadow-[16px_16px_0_0_#1f2937] transition-shadow duration-300">
				
				<div class="inline-block px-4 py-1.5 bg-gray-900 text-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#4ade80] rounded-full mb-6 transform rotate-1">
					<span class="text-sm font-bold uppercase tracking-wider">Get Started</span>
				</div>

				<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
					Start with Dynamic Links <br class="hidden sm:block" />
					<span class="text-[#7dd3fc] drop-shadow-[2px_2px_0_#1f2937] relative inline-block">
						Today
						<svg class="absolute w-full h-4 -bottom-2 left-0 text-gray-900 opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
							<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
						</svg>
					</span>
				</h2>
				
				<p class="text-xl text-gray-700 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
					Included in Standard plan and above. <br class="hidden sm:block" />Free plan allows up to 50 live renders per month.
				</p>
				
				<div class="flex flex-col sm:flex-row gap-6 justify-center">
					<a
						href="/signup"
						on:click={() => trackCTA('Get Started Free')}
						class="px-8 py-4 bg-gray-900 text-white font-black text-lg border-[3px] border-gray-900 rounded-xl
							shadow-[8px_8px_0_0_#7dd3fc] hover:shadow-[4px_4px_0_0_#7dd3fc] hover:translate-x-1 hover:translate-y-1
							transition-all duration-200 text-center flex items-center justify-center gap-2 group"
					>
						Get Started Free
						<svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
							<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
						</svg>
					</a>
					<a
						href="/pricing"
						on:click={() => trackCTA('View Pricing')}
						class="px-8 py-4 bg-white text-gray-900 font-black text-lg border-[3px] border-gray-900 rounded-xl
							shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1
							transition-all duration-200 text-center"
					>
						View Pricing
					</a>
				</div>
			</div>
		</div>
	</section>

	<SectionSeparator icon="hash" />

	<!-- FAQ -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-white relative">
		<!-- Decorative Background Pattern -->
		<div
			class="absolute inset-0 opacity-[0.03] pointer-events-none"
			style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 32px 32px;"
		/>

		<div class="max-w-3xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#a78bfa] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform rotate-2">
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Support</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
					Frequently Asked Questions
				</h2>
			</div>

			<div class="space-y-4">
				{#each faqs as faq, i}
					<div class="bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937] hover:-translate-y-0.5 rounded-xl transition-all overflow-hidden {openFaq === i ? 'ring-2 ring-gray-900 ring-offset-2' : ''}">
						<button
							on:click={() => (openFaq = openFaq === i ? -1 : i)}
							class="w-full text-left px-6 py-5 flex items-center justify-between font-black text-lg text-gray-900 {openFaq === i ? 'bg-[#fdf2f8]' : 'hover:bg-gray-50'}"
						>
							<span>{faq.q}</span>
							<div class="w-8 h-8 rounded-full border-2 border-gray-900 flex items-center justify-center bg-white flex-shrink-0 ml-4 {openFaq === i ? 'shadow-[inset_2px_2px_0_0_#f43f5e]' : ''}">
								<svg class="w-5 h-5 transition-transform {openFaq === i ? 'rotate-180 text-[#f43f5e]' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</div>
						</button>
						{#if openFaq === i}
							<div class="px-6 pb-6 pt-2 text-gray-700 font-medium leading-relaxed bg-[#fdf2f8] border-t-[3px] border-gray-900" transition:fly={{ y: -10, duration: 200 }}>
								{faq.a}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<Footer />
</div>
