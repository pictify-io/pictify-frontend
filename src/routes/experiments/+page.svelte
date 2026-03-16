<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';
	import ExperimentsShowcase from '$lib/components/landingPage/ExperimentsShowcase.svelte';
	import { analytics } from '$lib/analytics.js';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	onMount(() => {
		analytics.track('page_viewed', { page: 'experiments_landing' });
	});

	function trackCTA(ctaText) {
		analytics.trackCTAClicked({ cta_text: ctaText, location: 'experiments_landing' });
	}

	const capabilities = [
		{
			title: 'A/B Testing',
			description: 'Create variants with different copy, colors, or layouts. Split traffic and measure which image drives more clicks.',
			iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			color: 'bg-[#ffc480]',
			tag: 'CORE'
		},
		{
			title: 'Smart Links',
			description: 'Route visitors to different image variants based on device, country, browser, or custom rules. One URL, many experiences.',
			iconPath: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
			color: 'bg-[#ff6b6b]',
			tag: 'TARGETING'
		},
		{
			title: 'Scheduled Variants',
			description: 'Swap image variants on a schedule. Run a morning banner until noon, then switch to an afternoon offer automatically.',
			iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
			color: 'bg-[#a78bfa]',
			tag: 'AUTOMATION'
		},
		{
			title: 'Auto-Optimize',
			description: 'Thompson Sampling algorithm automatically shifts traffic to the winning variant. No manual intervention needed.',
			iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
			color: 'bg-[#4ade80]',
			tag: 'AI-POWERED'
		}
	];

	const howItWorks = [
		{
			number: '01',
			title: 'Create Your Experiment',
			description: 'Pick a type — A/B test, smart link, or scheduled. Add your template variants with different copy, colors, or layouts.'
		},
		{
			number: '02',
			title: 'Get a Single URL',
			description: 'Every experiment gets a public slug URL. Embed it anywhere — websites, emails, social. Traffic is split server-side.'
		},
		{
			number: '03',
			title: 'Watch the Data',
			description: 'Real-time analytics show impressions, clicks, and conversion rates per variant. Statistical significance is calculated automatically.'
		},
		{
			number: '04',
			title: 'Pick the Winner',
			description: 'Declare a winner manually or let Auto-Optimize do it for you. The winning variant takes 100% of traffic.'
		}
	];

	const useCases = [
		{
			title: 'Email Header Images',
			description: 'Test which hero image drives more clicks in your email campaigns. Same send, different images per variant.',
			iconPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
		},
		{
			title: 'OG Images for Social',
			description: 'Test different Open Graph images to see which thumbnail gets more clicks when your content is shared.',
			iconPath: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
		},
		{
			title: 'Ad Creative Testing',
			description: 'Rapidly iterate on ad visuals. Serve different creative variants and measure which ones convert best.',
			iconPath: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z'
		},
		{
			title: 'Geo-Targeted Promotions',
			description: 'Show region-specific offers using Smart Links. US visitors see USD pricing, EU sees EUR, APAC sees local currency.',
			iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
		},
		{
			title: 'Seasonal Campaigns',
			description: 'Schedule Black Friday images to go live at midnight, swap to Cyber Monday at 12:01 AM, and revert after the sale.',
			iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
		},
		{
			title: 'Personalized Dashboards',
			description: 'Combine experiments with Dynamic Links. Test which dashboard layout drives more engagement with live data.',
			iconPath: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z'
		}
	];

	const analyticsFeatures = [
		{ label: 'Real-time impressions & clicks', iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
		{ label: 'Statistical significance testing', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
		{ label: 'Conversion rate per variant', iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
		{ label: 'Bot detection & filtering', iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
		{ label: 'Channel tracking (web, email, SMS)', iconPath: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
		{ label: 'Winner auto-declaration', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
	];

	const faqs = [
		{
			q: 'How does A/B testing work for images?',
			a: 'You create an experiment with multiple image variants, each with different copy, colors, or layouts. Pictify generates a single public URL. When someone loads that URL, Pictify randomly selects a variant based on your traffic split and serves that image. Impressions and clicks are tracked automatically.'
		},
		{
			q: 'What are Smart Links?',
			a: 'Smart Links let you serve different image variants based on the viewer\'s context — device type (mobile/desktop), country, browser, or time of day. You define rules like "if device is mobile AND country is US, show Variant B." One URL, infinite personalized variations.'
		},
		{
			q: 'How does Auto-Optimize work?',
			a: 'Auto-Optimize uses Thompson Sampling, a multi-armed bandit algorithm. It starts by splitting traffic evenly, then gradually shifts more traffic to the best-performing variant. After a warmup period, the winning variant gets the majority of impressions automatically.'
		},
		{
			q: 'Can I use experiments in emails?',
			a: 'Yes. Embed the experiment slug URL as an <img> src in your email. Each recipient gets a variant based on your experiment type — A/B split, smart link rules, or schedule. Works with all email clients.'
		},
		{
			q: 'What analytics do I get?',
			a: 'Real-time dashboards showing impressions, clicks, and conversion rate per variant. Statistical significance is calculated using chi-squared testing. You can see daily trends, geographic breakdowns, device splits, and referrer data.'
		},
		{
			q: 'How many variants can I test?',
			a: 'Each experiment supports up to 10 variants. For most tests, 2-3 variants is optimal — enough to find a winner without diluting traffic too thin.'
		}
	];

	let openFaq = -1;
</script>

<svelte:head>
	<title>Image Experiments — A/B Test, Smart Links & Auto-Optimize | Pictify</title>
	<meta name="description" content="A/B test your images, target by device and location with Smart Links, schedule variant swaps, and let AI auto-optimize. One URL, data-driven visuals." />
	<meta property="og:title" content="Image Experiments — A/B Test, Smart Links & Auto-Optimize | Pictify" />
	<meta property="og:description" content="Test image variants, target by context, and auto-optimize with Thompson Sampling." />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Image Experiments | Pictify" />
	<meta name="twitter:description" content="A/B test images, target by device/location, auto-optimize with AI." />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'Pictify Image Experiments',
		applicationCategory: 'MultimediaApplication',
		description: 'A/B test images, route by device and location with Smart Links, schedule variant swaps, and auto-optimize with Thompson Sampling.',
		featureList: [
			'A/B testing for images',
			'Smart Links with geo and device targeting',
			'Scheduled variant swapping',
			'Thompson Sampling auto-optimization',
			'Real-time experiment analytics',
			'Statistical significance testing'
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
	<section
		class="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
		in:fly={{ y: 30, duration: 600 }}
	>
		<!-- Background Elements -->
		<div
			class="absolute top-20 right-0 w-64 h-64 bg-[#ffc480]/20 rounded-full blur-3xl -z-10 pointer-events-none"
		/>
		<div
			class="absolute bottom-0 left-0 w-72 h-72 bg-green-100/40 rounded-full blur-3xl -z-10 pointer-events-none"
		/>

		<div class="max-w-6xl mx-auto text-center relative z-10">
			<!-- Neo-Brutalist Badge -->
			<div
				class="inline-flex items-center gap-2 px-5 py-2 mb-8 bg-[#4ade80] border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937] transform -rotate-1 hover:rotate-1 hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#1f2937] transition-all cursor-default"
			>
				<svg
					class="w-4 h-4 text-gray-900"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="3"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
				<span class="text-xs font-black text-gray-900 uppercase tracking-widest"
					>A/B TEST · SMART LINKS · SCHEDULED · AUTO-OPTIMIZE</span
				>
			</div>

			<h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 leading-[0.95] mb-8">
				Test Your Images<br />
				<span class="relative inline-block text-[#ff6b6b] mt-2">
					Like You Test Your Copy
					<svg
						class="absolute w-full h-8 -bottom-3 left-0 text-black z-[-1] opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>
			</h1>

			<p class="text-xl sm:text-2xl text-gray-700 font-medium max-w-3xl mx-auto mb-12">
				Stop guessing which image performs best. Run experiments with multiple variants, target by
				device and location, and let our algorithm pick the winner. <br class="hidden sm:block" />
				<span class="font-black text-gray-900 bg-[#ffc480] px-2 border-b-[3px] border-gray-900"
					>One URL. Data-driven visuals.</span
				>
			</p>

			<div class="flex flex-col sm:flex-row gap-6 justify-center">
				<a
					href="/signup"
					on:click={() => trackCTA('Start Testing Free')}
					class="px-8 py-4 bg-gray-900 text-white font-black text-lg border-[3px] border-gray-900 rounded-xl
						shadow-[8px_8px_0_0_#ffc480] hover:shadow-[4px_4px_0_0_#ffc480] hover:translate-x-1 hover:translate-y-1
						transition-all duration-200 text-center flex items-center justify-center gap-2"
				>
					Start Testing Free
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
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

	<!-- Four Capabilities -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 border-y-[3px] border-gray-900 bg-white relative">
		<!-- Decorative Background Pattern -->
		<div
			class="absolute inset-0 opacity-[0.03] pointer-events-none"
			style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 32px 32px;"
		/>

		<div class="max-w-7xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform rotate-2">
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Features</span>
				</div>
				<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
					Four Ways to Optimize
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
					Each experiment type solves a different problem. Use them together for maximum impact.
				</p>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{#each capabilities as cap, i}
					<div
						class="flex flex-col sm:flex-row gap-6 p-8 bg-white border-[3px] border-gray-900 rounded-3xl shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] transition-all duration-300 group"
						style="transform: rotate({i % 2 === 0 ? '-1deg' : '1deg'})"
						role="region"
						aria-label={cap.title}
						on:mouseenter={(e) => (e.currentTarget.style.transform = 'rotate(0deg) translateY(-4px)')}
						on:mouseleave={(e) => (e.currentTarget.style.transform = `rotate(${i % 2 === 0 ? '-1deg' : '1deg'})`)}
						in:fly={{ y: 20, duration: 400, delay: i * 100 }}
					>
						<div class="flex-shrink-0">
							<div class="{cap.color} w-16 h-16 rounded-2xl flex items-center justify-center border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] group-hover:-rotate-6 transition-transform">
								<svg class="w-8 h-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d={cap.iconPath} />
								</svg>
							</div>
						</div>
						<div class="flex flex-col justify-center">
							<div class="flex items-center gap-3 mb-3">
								<h3 class="text-2xl font-black text-gray-900">{cap.title}</h3>
								<span class="px-2.5 py-1 bg-gray-100 border-[2px] border-gray-900 rounded font-black text-[10px] text-gray-900 uppercase tracking-widest shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">{cap.tag}</span>
							</div>
							<p class="text-lg text-gray-700 font-medium leading-relaxed">{cap.description}</p>
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
					From Hypothesis to <br class="hidden sm:block" />
					<span class="text-[#f43f5e]">Winner in Four Steps</span>
				</h2>
			</div>

			<div class="space-y-6 md:space-y-8 relative">
				<!-- Connecting line (desktop only) -->
				<div class="hidden md:block absolute left-12 top-10 bottom-10 w-[3px] bg-gray-900 z-0"></div>

				{#each howItWorks as step, i}
					{@const colors = ['bg-[#ffc480]', 'bg-[#7dd3fc]', 'bg-[#a78bfa]', 'bg-[#4ade80]']}
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

	<SectionSeparator icon="star" />

	<!-- Live Interactive Showcase (reuse existing component) -->
	<ExperimentsShowcase />

	<SectionSeparator icon="hash" />

	<!-- Use Cases -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-white relative border-y-[3px] border-gray-900">
		<!-- Background Elements -->
		<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

		<div class="max-w-7xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#7dd3fc] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform rotate-2">
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Use Cases</span>
				</div>
				<h2 class="text-4xl sm:text-5xl border-[3px] border-transparent font-black text-gray-900 mb-6">
					What Teams Are Testing
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
					From email headers to ad creative — every image is an opportunity to optimize.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
				{#each useCases as uc, i}
					{@const colors = ['bg-[#ffc480]', 'bg-[#ff6b6b]', 'bg-[#a78bfa]', 'bg-[#4ade80]', 'bg-[#7dd3fc]', 'bg-[#f43f5e]']}
					{@const rotations = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-1', '-rotate-1']}
					<div
						class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] hover:-translate-y-2 transition-all duration-300 flex flex-col group overflow-hidden {rotations[i]}"
						in:fly={{ y: 20, duration: 400, delay: i * 100 }}
					>
						<!-- Colorful Header Block -->
						<div class="{colors[i % colors.length]} p-6 border-b-[3px] border-gray-900 flex items-center justify-between">
							<div class="w-12 h-12 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] group-hover:rotate-12 transition-transform">
								<svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d={uc.iconPath} />
								</svg>
							</div>
							<div class="w-2 h-2 rounded-full border-[2px] border-gray-900 bg-white/50" />
						</div>

						<!-- Visual Block -->
						<div class="bg-gray-50 border-b-[3px] border-gray-900 p-6 flex items-center justify-center relative overflow-hidden h-40">
							<div class="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000_2px,transparent_2px)] [background-size:12px_12px]" />
							
							{#if i === 0}
								<!-- Email Header Images -->
								<div class="w-full max-w-[200px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex flex-col overflow-hidden relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all">
									<div class="bg-gray-100 border-b-[2px] border-gray-900 px-2 py-1 flex items-center gap-1.5">
										<div class="w-1.5 h-1.5 rounded-full bg-[#ff6b6b] border border-gray-900"></div>
										<div class="w-1.5 h-1.5 rounded-full bg-[#ffc480] border border-gray-900"></div>
										<div class="w-1.5 h-1.5 rounded-full bg-[#4ade80] border border-gray-900"></div>
									</div>
									<div class="h-16 bg-[#ffc480] border-b-[2px] border-gray-900 flex items-center justify-center overflow-hidden relative">
										<!-- AB Test Split Visual inside Email -->
										<div class="absolute inset-0 flex">
											<div class="w-1/2 h-full bg-[#ffc480] flex items-center justify-center border-r-[2px] border-gray-900">
												<span class="font-black text-xs">V1</span>
											</div>
											<div class="w-1/2 h-full bg-[#a78bfa] flex items-center justify-center">
												<span class="font-black text-xs text-white">V2</span>
											</div>
										</div>
									</div>
									<div class="p-2 space-y-1.5">
										<div class="w-3/4 h-2 bg-gray-200 rounded"></div>
										<div class="w-full h-2 bg-gray-200 rounded"></div>
										<div class="w-1/2 h-2 bg-gray-200 rounded"></div>
									</div>
								</div>
							{:else if i === 1}
								<!-- OG Images for Social -->
								<div class="w-full max-w-[220px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex flex-col overflow-hidden relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all">
									<div class="h-20 bg-gradient-to-br from-[#7dd3fc] to-blue-500 border-b-[3px] border-gray-900 flex items-center justify-center">
										<div class="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border-2 border-white/50">
											<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
										</div>
									</div>
									<div class="p-2.5 bg-gray-100">
										<div class="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">pictify.io</div>
										<div class="font-black text-xs text-gray-900 leading-none">Dynamic Open Graph Cards</div>
									</div>
								</div>
							{:else if i === 2}
								<!-- Ad Creative Testing -->
								<div class="w-full max-w-[180px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex flex-col overflow-hidden relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all">
									<div class="p-1.5 border-b-[2px] border-gray-900 flex justify-between items-center bg-gray-50">
										<div class="flex items-center gap-1.5">
											<div class="w-4 h-4 rounded-full bg-gray-300"></div>
											<div class="w-12 h-1.5 bg-gray-300 rounded"></div>
										</div>
										<span class="text-[7px] font-bold text-gray-400">Sponsored</span>
									</div>
									<div class="h-20 bg-gradient-to-r from-[#f43f5e] to-[#ffc480] flex flex-col justify-center items-center text-center p-2 relative">
										<div class="absolute inset-0 flex items-center justify-center opacity-20">
											<div class="w-full h-2 bg-white rotate-45 scale-150"></div>
											<div class="w-full h-2 bg-white -rotate-45 scale-150 absolute"></div>
										</div>
										<span class="font-black text-white text-base relative z-10 block mb-1">50% OFF</span>
										<span class="text-[8px] font-bold bg-white text-gray-900 px-1.5 py-0.5 rounded border border-gray-900 relative z-10 inline-block shadow-sm">SHOP NOW</span>
									</div>
								</div>
							{:else if i === 3}
								<!-- Geo-Targeted Promotions -->
								<div class="w-full max-w-[200px] h-24 bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all overflow-hidden">
									<div class="w-1/2 h-full bg-[#4ade80]/20 flex flex-col justify-center items-center border-r-[3px] border-gray-900 border-dashed relative">
										<span class="text-xl mb-1">🇺🇸</span>
										<div class="bg-black text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm border border-gray-900">$129</div>
										<!-- Routing arrow -->
										<div class="absolute -right-[15px] top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full border-[2px] border-gray-900 flex items-center justify-center z-20 shadow-sm">
											<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
										</div>
									</div>
									<div class="w-1/2 h-full bg-[#7dd3fc]/20 flex flex-col justify-center items-center">
										<span class="text-xl mb-1">🇪🇺</span>
										<div class="bg-[#ff6b6b] text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm border border-gray-900">€119</div>
									</div>
								</div>
							{:else if i === 4}
								<!-- Seasonal Campaigns -->
								<div class="w-full max-w-[180px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex flex-col relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all overflow-hidden p-3 items-center text-center">
									<!-- Calendar top -->
									<div class="absolute top-0 left-0 w-full h-3 bg-[#f43f5e] border-b-[2px] border-gray-900 flex justify-evenly items-end pb-[1px]">
										<div class="w-1.5 h-2.5 bg-white border-[1px] border-gray-900 rounded-full -mb-1"></div>
										<div class="w-1.5 h-2.5 bg-white border-[1px] border-gray-900 rounded-full -mb-1"></div>
									</div>
									
									<div class="mt-4 font-black text-3xl text-gray-900 leading-none mb-1">29</div>
									<div class="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3">November</div>
									
									<div class="flex items-center gap-2">
										<div class="w-12 h-8 bg-black border-2 border-gray-900 rounded flex items-center justify-center shadow-sm">
											<span class="text-white text-[8px] font-black">BFCM</span>
										</div>
										<svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
										<div class="w-12 h-8 bg-gray-100 border-2 border-gray-400 border-dashed rounded flex items-center justify-center">
											<span class="text-gray-400 text-[8px] font-black">XMAS</span>
										</div>
									</div>
								</div>
							{:else if i === 5}
								<!-- Personalized Dashboards -->
								<div class="w-full max-w-[200px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex flex-col relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all overflow-hidden">
									<div class="bg-gray-100 border-b-[2px] border-gray-900 p-2 flex gap-1.5">
										<div class="w-16 h-2 bg-gray-300 rounded-full"></div>
										<div class="w-8 h-2 bg-gray-300 rounded-full ml-auto"></div>
									</div>
									<div class="p-3 grid grid-cols-2 gap-2">
										<div class="col-span-2 bg-[#a78bfa]/20 border-[2px] border-[#a78bfa] rounded p-2 flex items-center justify-between">
											<div class="w-1/2 space-y-1">
												<div class="w-8 h-1 bg-[#a78bfa] rounded"></div>
												<div class="w-12 h-2.5 bg-gray-900 rounded"></div>
											</div>
											<div class="w-6 h-6 rounded-full border-2 border-[#a78bfa] flex items-center justify-center">
												<div class="w-2 h-2 bg-[#a78bfa] rounded-full"></div>
											</div>
										</div>
										<div class="bg-[#4ade80]/20 border-[2px] border-[#4ade80] rounded p-1.5">
											<div class="w-full h-8 flex items-end gap-[1px]">
												<div class="w-1/5 h-[30%] bg-[#4ade80]"></div>
												<div class="w-1/5 h-[50%] bg-[#4ade80]"></div>
												<div class="w-1/5 h-[40%] bg-[#4ade80]"></div>
												<div class="w-1/5 h-[80%] bg-[#4ade80]"></div>
												<div class="w-1/5 h-[100%] bg-gray-900"></div>
											</div>
										</div>
										<div class="bg-[#ffc480]/20 border-[2px] border-[#ffc480] rounded p-2 flex flex-col justify-center items-center">
											<div class="text-xs font-black text-gray-900">82%</div>
											<div class="text-[6px] font-bold text-gray-500 uppercase">Score</div>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<!-- Content Block -->
						<div class="p-6 md:p-8 flex-1 flex flex-col bg-white">
							<h3 class="text-2xl font-black text-gray-900 mb-3 leading-tight transition-colors">{uc.title}</h3>
							<p class="text-gray-700 text-lg font-medium leading-relaxed">{uc.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<SectionSeparator icon="bolt" />

	<!-- Analytics Features -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-[#fdf2f8] border-b-[3px] border-gray-900 overflow-hidden relative">
		<!-- Decorative Background Pattern -->
		<div
			class="absolute inset-0 opacity-[0.03] pointer-events-none"
			style="background-image: radial-gradient(#000 2px, transparent 2px); background-size: 32px 32px;"
		/>

		<div class="max-w-6xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#f43f5e] text-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform -rotate-2">
					<span class="text-sm font-bold uppercase tracking-wider">Analytics</span>
				</div>
				<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
					Insights That Actually <br class="hidden sm:block" />
					<span class="text-[#f43f5e]">Drive Decisions</span>
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
					Not just charts — actionable data with statistical rigor.
				</p>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each analyticsFeatures as feature, i}
					{@const colors = ['bg-[#ffc480]', 'bg-[#7dd3fc]', 'bg-[#a78bfa]', 'bg-[#ff6b6b]', 'bg-[#4ade80]', 'bg-white']}
					<div class="flex items-center gap-4 p-5 bg-white border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] rounded-2xl transition-all group">
						<div class="w-14 h-14 {colors[i % colors.length]} border-[3px] border-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0_0_#1f2937] group-hover:-rotate-6 transition-transform">
							<svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d={feature.iconPath} />
							</svg>
						</div>
						<span class="font-bold text-lg text-gray-900 leading-tight">{feature.label}</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<SectionSeparator icon="arrow" />

	<!-- Pricing CTA -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-[#4ade80] border-b-[3px] border-gray-900 overflow-hidden relative">
		<!-- Dynamic Background Pattern -->
		<div
			class="absolute inset-0 opacity-[0.15] pointer-events-none"
			style="background-image: radial-gradient(#000 2px, transparent 2px); background-size: 24px 24px;"
		/>

		<!-- Floating decorative elements -->
		<div class="absolute top-10 left-10 w-16 h-16 bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] animate-bounce" style="animation-duration: 3s; border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;"></div>
		<div class="absolute bottom-10 right-10 w-20 h-20 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full animate-bounce" style="animation-duration: 4s;"></div>

		<div class="max-w-4xl mx-auto text-center relative z-10">
			<!-- Neo-Brutalist Container -->
			<div class="p-8 sm:p-12 md:p-16 bg-white border-[3px] border-gray-900 rounded-[2rem] shadow-[12px_12px_0_0_#1f2937] hover:shadow-[16px_16px_0_0_#1f2937] transition-shadow duration-300">
				
				<div class="inline-block px-4 py-1.5 bg-gray-900 text-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ffc480] rounded-full mb-6 transform -rotate-1">
					<span class="text-sm font-bold uppercase tracking-wider">Get Started</span>
				</div>

				<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
					Start Experimenting <br class="hidden sm:block" />
					<span class="text-[#4ade80] drop-shadow-[2px_2px_0_#1f2937] relative inline-block">
						Today
						<svg class="absolute w-full h-4 -bottom-2 left-0 text-gray-900 opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
							<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
						</svg>
					</span>
				</h2>
				
				<p class="text-xl text-gray-700 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
					A/B testing included in all plans. <br class="hidden sm:block" /> Smart Links and Scheduled variants available on Standard and above.
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
