<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';
	import { analytics } from '$lib/analytics.js';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	onMount(() => {
		analytics.track('page_viewed', { page: 'visual_analytics_landing' });
	});

	function trackCTA(ctaText) {
		analytics.trackCTAClicked({ cta_text: ctaText, location: 'visual_analytics_landing' });
	}

	const features = [
		{
			title: 'Conversion Tracking',
			description: 'Track impressions, clicks, and conversions for every image. Know exactly which visual drove the signup, sale, or click.',
			iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
			color: 'bg-[#4ade80]'
		},
		{
			title: 'Channel Attribution',
			description: 'See how images perform across web, email, ads, and social. Identify which channel delivers the highest conversion rate.',
			iconPath: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
			color: 'bg-[#ffc480]'
		},
		{
			title: 'Device Performance',
			description: 'Compare mobile vs desktop vs tablet performance. Optimize designs for the devices your audience actually uses.',
			iconPath: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
			color: 'bg-[#ff6b6b]'
		},
		{
			title: 'Geographic Insights',
			description: 'See which countries and regions engage most with your images. Tailor designs for your highest-converting markets.',
			iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
			color: 'bg-[#a78bfa]'
		},
		{
			title: 'Statistical Significance',
			description: 'Know when your results are real, not random. Chi-squared testing with configurable confidence thresholds.',
			iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
			color: 'bg-[#60a5fa]'
		},
		{
			title: 'Industry Benchmarks',
			description: 'Compare your image performance against anonymized industry averages. Know if your 3.2% CTR is good or great.',
			iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			color: 'bg-[#f472b6]',
			comingSoon: true
		}
	];

	const steps = [
		{
			number: '01',
			title: 'Render Your Image',
			description: 'Use the editor, API, or Dynamic Links to create and serve your image. Every render is automatically tracked.'
		},
		{
			number: '02',
			title: 'Track Performance',
			description: 'Impressions, clicks, and conversions are captured in real-time with channel, device, and geographic breakdowns.'
		},
		{
			number: '03',
			title: 'Optimize with Data',
			description: 'Use A/B testing to find winners, Auto-Optimize to shift traffic, and performance insights to inform your next design.'
		}
	];

	const flywheel = [
		{ label: 'Create', description: 'Design in editor or generate with AI', iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
		{ label: 'Distribute', description: 'Dynamic Links serve the right image', iconPath: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
		{ label: 'Measure', description: 'Visual Analytics tracks every interaction', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
		{ label: 'Optimize', description: 'Experiments find the winners', iconPath: 'M13 10V3L4 14h7v7l9-11h-7z' },
		{ label: 'Learn', description: 'AI copilot uses performance data', iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' }
	];

	const faqs = [
		{
			q: 'What data is tracked automatically?',
			a: 'Every image render captures: impressions (how many times the image was loaded), clicks (if using click-through tracking), conversions (custom events you define), plus device type, channel, country, and referrer. No additional setup needed.'
		},
		{
			q: 'How is statistical significance calculated?',
			a: 'We use chi-squared testing with configurable confidence thresholds (default: 95%). You set the minimum sample size and minimum detectable effect. When both variants exceed the sample threshold and the confidence level is reached, a winner is declared automatically.'
		},
		{
			q: 'What are industry benchmarks?',
			a: 'Anonymized, aggregated performance data from all Pictify users, broken down by use case (email headers, OG images, ad creative, etc.). You can see how your image CTR compares to the average. This feature is coming soon as our user base grows.'
		},
		{
			q: 'Does tracking work in emails?',
			a: 'Yes. When an email client loads a Pictify image URL, that counts as an impression. If you use click-through tracking (wrapping the image in a tracked link), clicks are captured too. Works across Gmail, Outlook, Apple Mail, and all other clients.'
		},
		{
			q: 'Can I export analytics data?',
			a: 'Yes. The experiment analytics API returns all data as JSON. You can integrate it into your own dashboards, data warehouses, or reporting tools via the API or webhooks.'
		},
		{
			q: 'Is my data private?',
			a: 'Your experiment data is completely private to your team. Industry benchmarks use only anonymized, aggregated statistics — no individual experiment data is ever shared.'
		}
	];

	let openFaq = -1;
</script>

<svelte:head>
	<title>Visual Analytics — Track, Measure & Optimize Image Performance | Pictify</title>
	<meta name="description" content="Know which images convert. Track impressions, clicks, and conversions across channels. Compare performance by device and geography. Data-driven visual optimization." />
	<link rel="canonical" href="https://pictify.io/visual-analytics" />
	<meta property="og:title" content="Visual Analytics — Image Performance Tracking | Pictify" />
	<meta property="og:description" content="Track, measure, and optimize every image. Know which visuals drive conversions." />
	<meta property="og:url" content="https://pictify.io/visual-analytics" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Pictify" />
	<meta property="og:image" content="https://pictify.io/og/pages/visual-analytics.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Pictify Visual Analytics — track every image variant" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Visual Analytics | Pictify" />
	<meta name="twitter:description" content="Track, measure, and optimize every image. Know which visuals drive conversions." />
	<meta name="twitter:image" content="https://pictify.io/og/pages/visual-analytics.png" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'Pictify Visual Analytics',
		applicationCategory: 'MultimediaApplication',
		description: 'Track, measure, and optimize image performance with conversion tracking, channel attribution, and industry benchmarks.',
		featureList: [
			'Image conversion tracking',
			'Channel attribution',
			'Device performance analysis',
			'Geographic insights',
			'Statistical significance testing',
			'Industry benchmarks'
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
		<div class="max-w-6xl mx-auto text-center relative z-10">
			<div
				class="inline-flex items-center gap-2 px-5 py-2 mb-8 bg-[#4ade80] border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937] transform rotate-1 hover:-rotate-1 hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#1f2937] transition-all cursor-default"
			>
				<svg class="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
				</svg>
				<span class="text-sm font-black text-gray-900 uppercase tracking-widest">Conversions · Channels · Devices · Geography</span>
			</div>

			<h1 class="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[0.95] mb-8">
				Know Which Images<br />
				<span class="relative inline-block text-[#4ade80] mt-2">
					Convert
					<svg class="absolute w-full h-8 -bottom-3 left-0 text-black z-[-1] opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>
			</h1>

			<p class="text-xl sm:text-2xl text-gray-700 font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
				Every image becomes a measurable performance asset. Track impressions, clicks, and conversions
				across channels, devices, and geographies.
				<span class="font-black text-gray-900 bg-[#ffc480] px-2 border-b-[3px] border-gray-900 mt-2 inline-block shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">Stop guessing. Start measuring.</span>
			</p>

			<div class="flex flex-col sm:flex-row gap-6 justify-center">
				<a
					href="/signup"
					on:click={() => trackCTA('Start Tracking Free')}
					class="px-8 py-4 bg-gray-900 text-white font-black text-lg border-[3px] border-gray-900 rounded-xl
						shadow-[8px_8px_0_0_#4ade80] hover:shadow-[4px_4px_0_0_#4ade80] hover:translate-x-1 hover:translate-y-1
						transition-all duration-200 text-center flex items-center justify-center gap-2 group"
				>
					Start Tracking Free
					<svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
						<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
					</svg>
				</a>
				<a
					href="/experiments"
					on:click={() => trackCTA('See Experiments')}
					class="px-8 py-4 bg-white text-gray-900 font-black text-lg border-[3px] border-gray-900 rounded-xl
						shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1
						transition-all duration-200 text-center"
				>
					See Experiments
				</a>
			</div>
		</div>
	</section>

	<SectionSeparator icon="bolt" />

	<!-- Features Grid -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-white relative border-y-[3px] border-gray-900">
		<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

		<div class="max-w-7xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform -rotate-1">
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Capabilities</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
					Every Metric That Matters
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
					From impressions to conversions — see how every image performs in the real world.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each features as feature, i}
					<div
						class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_0_#1f2937] hover:shadow-[10px_10px_0_0_#1f2937] hover:-translate-y-2 transition-all duration-300 overflow-hidden group"
						in:fly={{ y: 20, duration: 400, delay: i * 80 }}
					>
						<div class="{feature.color} p-5 border-b-[3px] border-gray-900 flex items-center justify-between">
							<div class="w-10 h-10 bg-white border-[3px] border-gray-900 rounded-lg flex items-center justify-center shadow-[3px_3px_0_0_#1f2937] group-hover:rotate-12 transition-transform">
								<svg class="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d={feature.iconPath} />
								</svg>
							</div>
							{#if feature.comingSoon}
								<span class="text-[10px] px-2 py-0.5 bg-white border-[2px] border-gray-900 font-black tracking-wider uppercase rounded shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">Soon</span>
							{/if}
						</div>
						<div class="p-6">
							<h3 class="text-lg font-black text-gray-900 mb-2">{feature.title}</h3>
							<p class="text-gray-600 font-medium text-sm">{feature.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<SectionSeparator icon="arrow" />

	<!-- How It Works -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900">
		<div class="max-w-5xl mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
					From Render to <span class="text-[#4ade80]">Revenue</span>
				</h2>
			</div>

			<div class="space-y-6">
				{#each steps as step, i}
					{@const colors = ['bg-[#4ade80]', 'bg-[#ffc480]', 'bg-[#ff6b6b]']}
					<div
						class="flex flex-col md:flex-row items-start gap-6 relative z-10 group"
						in:fly={{ x: -20, duration: 400, delay: i * 150 }}
					>
						<div class="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 {colors[i]} border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ffc480] flex items-center justify-center rounded-2xl transform transition-transform group-hover:scale-110 group-hover:-rotate-3">
							<span class="text-2xl md:text-3xl font-black text-gray-900">{step.number}</span>
						</div>
						<div class="flex-1 bg-white p-6 md:p-8 border-[3px] border-gray-900 shadow-[6px_6px_0_0_#ffc480] rounded-2xl">
							<h3 class="text-2xl font-black text-gray-900 mb-2">{step.title}</h3>
							<p class="text-gray-600 text-lg font-medium">{step.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<SectionSeparator icon="star" />

	<!-- The Flywheel -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-[#ffc480]/10 border-y-[3px] border-gray-900 relative overflow-hidden">
		<div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(#000 2px, transparent 2px); background-size: 32px 32px;" />

		<div class="max-w-5xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#ff6b6b] text-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform rotate-2">
					<span class="text-sm font-bold uppercase tracking-wider">The Flywheel</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
					Every Cycle Produces Better Images
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
					Visual Analytics closes the loop between creation and optimization.
				</p>
			</div>

			<div class="flex flex-wrap justify-center gap-4">
				{#each flywheel as step, i}
					<div class="flex items-center gap-3">
						<div class="bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-xl p-4 w-40 text-center hover:shadow-[6px_6px_0_0_#1f2937] hover:-translate-y-1 transition-all"
							in:fly={{ y: 15, duration: 300, delay: i * 100 }}>
							<div class="w-10 h-10 bg-gray-100 border-2 border-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
								<svg class="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d={step.iconPath} />
								</svg>
							</div>
							<p class="font-black text-gray-900 text-sm">{step.label}</p>
							<p class="text-[10px] text-gray-500 mt-1">{step.description}</p>
						</div>
						{#if i < flywheel.length - 1}
							<svg class="w-6 h-6 text-gray-400 flex-shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
							</svg>
						{/if}
					</div>
				{/each}
			</div>

			<div class="text-center mt-8">
				<div class="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-900 shadow-[3px_3px_0_0_#1f2937] rounded-full">
					<svg class="w-4 h-4 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					<span class="text-sm font-bold text-gray-700">Repeat — each cycle compounds</span>
				</div>
			</div>
		</div>
	</section>

	<SectionSeparator icon="bolt" />

	<!-- Pricing CTA -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-[#4ade80] border-b-[3px] border-gray-900 relative overflow-hidden">
		<div class="absolute inset-0 opacity-[0.15] pointer-events-none" style="background-image: radial-gradient(#000 2px, transparent 2px); background-size: 24px 24px;" />
		<div class="absolute top-10 right-10 w-16 h-16 bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] animate-bounce rounded-full" style="animation-duration: 3s;" />

		<div class="max-w-4xl mx-auto text-center relative z-10">
			<div class="p-8 sm:p-12 md:p-16 bg-white border-[3px] border-gray-900 rounded-[2rem] shadow-[12px_12px_0_0_#1f2937] hover:shadow-[16px_16px_0_0_#1f2937] transition-shadow">
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight">
					Start Measuring <span class="text-[#4ade80]">Today</span>
				</h2>
				<p class="text-xl text-gray-700 font-medium mb-10 max-w-2xl mx-auto">
					Analytics included in all plans. Conversion tracking and channel attribution available on Standard and above.
				</p>
				<div class="flex flex-col sm:flex-row gap-6 justify-center">
					<a
						href="/signup"
						on:click={() => trackCTA('Get Started Free')}
						class="px-8 py-4 bg-gray-900 text-white font-black text-lg border-[3px] border-gray-900 rounded-xl
							shadow-[8px_8px_0_0_#4ade80] hover:shadow-[4px_4px_0_0_#4ade80] hover:translate-x-1 hover:translate-y-1
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
		<div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 32px 32px;" />

		<div class="max-w-3xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#a78bfa] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform -rotate-2">
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Support</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900">
					Frequently Asked Questions
				</h2>
			</div>

			<div class="space-y-4">
				{#each faqs as faq, i}
					<div class="bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937] hover:-translate-y-0.5 rounded-xl transition-all overflow-hidden {openFaq === i ? 'ring-2 ring-gray-900 ring-offset-2' : ''}">
						<button
							on:click={() => (openFaq = openFaq === i ? -1 : i)}
							class="w-full text-left px-6 py-5 flex items-center justify-between font-black text-lg text-gray-900 {openFaq === i ? 'bg-[#4ade80]/10' : 'hover:bg-gray-50'}"
						>
							<span>{faq.q}</span>
							<div class="w-8 h-8 rounded-full border-2 border-gray-900 flex items-center justify-center bg-white flex-shrink-0 ml-4 {openFaq === i ? 'shadow-[inset_2px_2px_0_0_#4ade80]' : ''}">
								<svg class="w-5 h-5 transition-transform {openFaq === i ? 'rotate-180 text-[#4ade80]' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</div>
						</button>
						{#if openFaq === i}
							<div class="px-6 pb-6 pt-2 text-gray-700 font-medium leading-relaxed bg-[#4ade80]/10 border-t-[3px] border-gray-900" transition:fly={{ y: -10, duration: 200 }}>
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
