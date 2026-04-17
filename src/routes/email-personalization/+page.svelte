<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';
	import { analytics } from '$lib/analytics.js';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	onMount(() => {
		analytics.track('page_viewed', { page: 'email_personalization_landing' });
	});

	function trackCTA(ctaText) {
		analytics.trackCTAClicked({ cta_text: ctaText, location: 'email_personalization_landing' });
	}

	const steps = [
		{
			number: '01',
			title: 'Design Your Email Image',
			description: 'Create an image template with variables like {{name}}, {{city}}, {{offer}} using the visual editor.'
		},
		{
			number: '02',
			title: 'Build the Image URL',
			description: 'Combine your Pictify render URL with merge tags from your ESP — each recipient gets a unique image URL.'
		},
		{
			number: '03',
			title: 'Paste as <img> in Your Email',
			description: 'Drop the URL into an <img> tag. When the email opens, Pictify renders a personalized image for that recipient. No plugins needed.'
		}
	];

	const useCases = [
		{
			title: 'Personalized Greetings',
			description: '"Hey {{name}}, check out deals in {{city}}" — each recipient sees their own name and city.',
			iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
			color: 'bg-[#4ade80]'
		},
		{
			title: 'Countdown Timers',
			description: 'Live countdown to sale end, event start, or deadline — renders the current time at email open.',
			iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
			color: 'bg-[#ff6b6b]'
		},
		{
			title: 'Live Pricing',
			description: 'Show the actual product price and availability at the moment the email is opened.',
			iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
			color: 'bg-[#ffc480]'
		},
		{
			title: 'Weather-Based',
			description: 'Show weather-appropriate products or messaging based on the recipient\'s location.',
			iconPath: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
			color: 'bg-[#a78bfa]'
		}
	];

	let activeEsp = 'mailchimp';

	const espGuides = {
		mailchimp: {
			name: 'Mailchimp',
			firstName: '*|FNAME|*',
			city: '*|CITY|*',
			note: 'CITY requires a custom merge field. Create it in Audience → Settings → Merge fields.',
			example: 'https://api.pictify.io/r/YOUR_TEMPLATE.png?token=YOUR_API_KEY&name=*|URL:FNAME|*&city=*|URL:CITY|*',
			fallback: 'Set default merge values in Audience settings for each field.'
		},
		sendgrid: {
			name: 'SendGrid',
			firstName: '{{{ first_name }}}',
			city: '{{{ city }}}',
			note: 'Use triple braces {{{ }}} inside URLs to prevent HTML-escaping of & characters.',
			example: 'https://api.pictify.io/r/YOUR_TEMPLATE.png?token=YOUR_API_KEY&name={{{ first_name }}}&city={{{ city }}}',
			fallback: 'Use Handlebars {{#if}} blocks for conditional defaults.'
		},
		klaviyo: {
			name: 'Klaviyo',
			firstName: '{{ first_name }}',
			city: '{{ person.location.city }}',
			note: 'first_name is a shorthand. Other profile properties need the person. prefix. Use |lookup for special characters.',
			example: "https://api.pictify.io/r/YOUR_TEMPLATE.png?token=YOUR_API_KEY&name={{ first_name }}&city={{ person.location.city }}",
			fallback: "Use {{ first_name|default:'Friend' }} for fallback values."
		},
		hubspot: {
			name: 'HubSpot',
			firstName: '{{ contact.firstname }}',
			city: '{{ contact.city }}',
			note: 'Property names are always lowercase, no spaces (firstname not first_name). Edit source code directly for img src personalization.',
			example: 'https://api.pictify.io/r/YOUR_TEMPLATE.png?token=YOUR_API_KEY&name={{ contact.firstname }}&city={{ contact.city }}',
			fallback: 'Set default values in the personalization token editor.'
		}
	};

	$: currentEsp = espGuides[activeEsp];

	const faqs = [
		{
			q: 'Does this work in all email clients?',
			a: 'Yes! Personalized images are standard <img> tags — they work in Gmail, Outlook, Apple Mail, Yahoo, and every other email client. No JavaScript needed.'
		},
		{
			q: 'How fast is the rendering?',
			a: 'Most templates render in under 500ms. For the best experience, keep images under 200KB. Gmail\'s proxy fetches the image on first open and caches it.'
		},
		{
			q: 'What about Gmail\'s image proxy caching?',
			a: 'Gmail caches images per-URL. Since each recipient gets a unique URL (with their merge tags), each person sees their own personalized image. However, the same person opening the email twice will see the cached version from their first open.'
		},
		{
			q: 'Can I A/B test email images?',
			a: 'Yes! Combine this with Pictify Experiments. Use Smart Links with device/geo rules, or A/B test different image designs to see which converts better.'
		},
		{
			q: 'What if a merge tag is empty?',
			a: 'Pictify renders the template with whatever values are provided. If a variable is missing, it shows the default value you set in the template editor. We recommend always setting defaults for every variable.'
		},
		{
			q: 'Does geolocation work in emails?',
			a: 'IP-based geolocation does NOT work in Gmail (the proxy\'s IP is used, not the recipient\'s). Always pass the city explicitly via your ESP\'s merge tags rather than relying on request IP detection.'
		}
	];

	let openFaq = -1;
</script>

<svelte:head>
	<title>Email Image Personalization — Dynamic Images for Email Marketing | Pictify</title>
	<meta name="description" content="Personalize email images at open time. Show each recipient their name, city, countdown timer, or live pricing — no ESP plugins needed." />
	<link rel="canonical" href="https://pictify.io/email-personalization" />
	<meta property="og:title" content="Email Image Personalization | Pictify" />
	<meta property="og:description" content="Each recipient sees a different image — personalized at open time." />
	<meta property="og:url" content="https://pictify.io/email-personalization" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Pictify" />
	<meta property="og:image" content="https://pictify.io/og/pages/email-personalization.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Pictify Email Personalization — dynamic email hero images" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Email Image Personalization | Pictify" />
	<meta name="twitter:description" content="Each recipient sees a different image — personalized at open time." />
	<meta name="twitter:image" content="https://pictify.io/og/pages/email-personalization.png" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'Pictify Email Image Personalization',
		applicationCategory: 'MultimediaApplication',
		description: 'Personalize email images at open time with recipient name, city, countdown timers, and live data.',
		featureList: [
			'Open-time image personalization',
			'ESP merge tag integration',
			'Countdown timer images',
			'Geo-personalized banners',
			'Live pricing images',
			'Works with all email clients'
		],
		offers: {
			'@type': 'AggregateOffer',
			lowPrice: '0',
			highPrice: '249',
			priceCurrency: 'USD',
			offerCount: '5'
		}
	})}</script>`}
</svelte:head>

<div class="min-h-screen bg-[#FFFDF8]">
	<Nav />

	<!-- Hero Section -->
	<section class="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden" in:fly={{ y: 30, duration: 600 }}>
		<div class="max-w-6xl mx-auto text-center relative z-10">
			<div
				class="inline-flex items-center gap-2 px-5 py-2 mb-8 bg-[#4ade80] border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937] transform -rotate-1 hover:rotate-1 hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#1f2937] transition-all cursor-default"
			>
				<svg class="w-5 h-5 text-gray-900 drop-shadow-[1px_1px_0_rgba(255,255,255,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
				<span class="text-sm font-black uppercase tracking-wider text-gray-900">Works With Mailchimp · SendGrid · Klaviyo</span>
			</div>

			<h1 class="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[0.95] mb-8">
				Personalized Images<br />
				<span class="relative inline-block text-[#a78bfa] mt-2">
					In Every Email
					<svg class="absolute w-full h-4 -bottom-1 left-0 text-gray-900 opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>
			</h1>

			<p class="text-xl sm:text-2xl text-gray-700 font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
				Each recipient sees a different image — personalized at open time. Embed a single Pictify URL.
				When the email opens, the image renders with the recipient's name, city, device, or live data.
				<span class="font-black text-gray-900 bg-[#ffc480] px-2 border-b-[3px] border-gray-900 mt-2 inline-block shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">No ESP plugins needed.</span>
			</p>

			<div class="flex flex-col sm:flex-row gap-6 justify-center">
				<a
					href="/signup"
					on:click={() => trackCTA('Start Personalizing')}
					class="px-8 py-4 bg-gray-900 text-white font-black text-lg border-[3px] border-gray-900 rounded-xl
						shadow-[8px_8px_0_0_#a78bfa] hover:shadow-[4px_4px_0_0_#a78bfa] hover:translate-x-1 hover:translate-y-1
						transition-all duration-200 text-center flex items-center justify-center gap-2 group"
				>
					Start Personalizing Free
					<svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform border-[2px] border-white rounded-full p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
						<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
					</svg>
				</a>
				<a
					href="/dynamic-images"
					on:click={() => trackCTA('Learn About Dynamic Links')}
					class="px-8 py-4 bg-white text-gray-900 font-black text-lg border-[3px] border-gray-900 rounded-xl
						shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1
						transition-all duration-200 text-center"
				>
					Learn About Dynamic Links
				</a>
			</div>
		</div>
	</section>

	<SectionSeparator icon="bolt" />

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
					<span class="text-[#f43f5e]">Personalized Email Images</span>
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

	<SectionSeparator icon="star" />

	<!-- Use Cases -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-white relative border-y-[3px] border-gray-900">
		<!-- Background Elements -->
		<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

		<div class="max-w-7xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#a78bfa] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform rotate-2">
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Features</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
					What You Can Personalize
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
					If you can put it in a merge tag, Pictify can render it into an image.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
				{#each useCases as useCase, i}
					{@const colors = ['bg-[#4ade80]', 'bg-[#ff6b6b]', 'bg-[#ffc480]', 'bg-[#7dd3fc]']}
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
								<!-- Personalized Greeting Visual -->
								<div class="w-full max-w-[280px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex flex-col relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all overflow-hidden p-6 text-center">
									<p class="font-black text-2xl text-gray-900 leading-tight">
										Hey <span class="text-[#4ade80] inline-block px-1 border-b-[3px] border-gray-900 drop-shadow-[1px_1px_0_#fff] relative group-hover:scale-110 transition-transform">Alex</span>,<br />
										Check out deals in <span class="bg-[#ffc480] px-2 py-0.5 rounded border-2 border-gray-900 shadow-sm inline-block transform rotate-2 relative group-hover:-rotate-2 transition-transform">Seattle</span>
									</p>
								</div>
							{:else if i === 1}
								<!-- Countdown Timer Visual -->
								<div class="w-full max-w-[240px] bg-gray-900 border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_#ff6b6b] flex flex-col relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_#ff6b6b] transition-all overflow-hidden p-4 text-center">
									<div class="text-[10px] font-black text-[#ff6b6b] uppercase tracking-widest mb-3 animate-pulse">Flash Sale Ends In</div>
									<div class="flex justify-center gap-3 font-black font-mono text-3xl text-white leading-none">
										<div class="flex flex-col bg-gray-800 p-2 rounded border-2 border-gray-700"><span>12</span><span class="text-[8px] text-gray-400 tracking-widest mt-1">HRS</span></div>
										<div class="text-gray-500 self-center pb-3">:</div>
										<div class="flex flex-col bg-gray-800 p-2 rounded border-2 border-gray-700"><span>45</span><span class="text-[8px] text-gray-400 tracking-widest mt-1">MIN</span></div>
									</div>
								</div>
							{:else if i === 2}
								<!-- Live Pricing Visual -->
								<div class="w-full max-w-[240px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex flex-col relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all overflow-hidden">
									<div class="flex">
										<div class="w-1/3 bg-gray-200">
											<!-- Placeholder image area -->
											<svg class="w-full h-full text-gray-400 p-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
										</div>
										<div class="w-2/3 p-4 flex flex-col justify-center bg-[#ffc480]/20">
											<div class="w-3/4 h-3 bg-gray-300 rounded mb-2"></div>
											<div class="text-2xl font-black text-gray-900 relative inline-block self-start">
												$89.99
												<span class="absolute -top-3 -right-6 text-xs text-[#ff6b6b] line-through transform rotate-12 bg-white px-1 border border-gray-300 rounded">$120</span>
											</div>
										</div>
									</div>
								</div>
							{:else if i === 3}
								<!-- Weather Visual -->
								<div class="w-full max-w-[220px] bg-gradient-to-br from-blue-400 to-blue-600 border-[3px] border-gray-900 rounded-[2rem] shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex relative z-10 group-hover:-translate-y-2 group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all overflow-hidden p-6 items-center gap-4 text-white">
									<div class="flex-1">
										<div class="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-1">Your Local Weather</div>
										<div class="font-black text-4xl">72°</div>
										<div class="text-sm font-bold mt-1">Perfect for a run!</div>
									</div>
									<div class="w-12 h-12 bg-yellow-400 rounded-full border-[3px] border-orange-500 shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-pulse relative z-0"></div>
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

	<!-- ESP Integration Guides -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-[#ffc480]/10 border-y-[3px] border-gray-900 relative overflow-hidden">
		<div class="max-w-5xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#4ade80] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform rotate-1">
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Integrations</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
					Works With Your ESP
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
					Copy-paste these examples into your email builder. It's that simple.
				</p>
			</div>

			<!-- ESP Tabs -->
			<div class="flex flex-wrap gap-3 justify-center mb-10">
				{#each Object.entries(espGuides) as [key, esp]}
					<button
						on:click={() => (activeEsp = key)}
						class="px-6 py-3 font-black text-lg border-[3px] border-gray-900 transition-all duration-200 rounded-xl
							{activeEsp === key
								? 'bg-gray-900 text-[#ffc480] shadow-[2px_2px_0_0_#1f2937] translate-y-1'
								: 'bg-white text-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-y-1 hover:bg-gray-50'}"
					>
						{esp.name}
					</button>
				{/each}
			</div>

			<!-- ESP Guide Content -->
			{#key activeEsp}
				<div class="bg-white border-[3px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] rounded-2xl overflow-hidden" in:fade={{ duration: 200 }}>
					<!-- Window Header -->
					<div class="px-6 py-4 bg-gray-900 text-white font-black flex items-center justify-between border-b-[3px] border-gray-900">
						<div class="flex items-center gap-3">
							<span class="text-xl text-[#7dd3fc] drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">{currentEsp.name}</span>
							<span class="hidden sm:inline-block text-sm font-bold text-gray-400 uppercase tracking-widest px-2 py-0.5 border border-gray-700 rounded bg-gray-800">Merge Tag Details</span>
						</div>
						<div class="flex items-center gap-1.5 opacity-50">
							<div class="w-3 h-3 rounded-full border-2 border-white/50"></div>
							<div class="w-3 h-3 rounded-full border-2 border-white/50"></div>
							<div class="w-3 h-3 rounded-full border-2 border-white/50"></div>
						</div>
					</div>

					<div class="p-6 md:p-8 space-y-8 bg-[radial-gradient(#f3f4f6_2px,transparent_2px)] [background-size:20px_20px]">
						<!-- Merge Tags Table -->
						<div class="bg-white border-[3px] border-gray-900 p-6 rounded-xl shadow-[4px_4px_0_0_#e5e7eb] transform -rotate-1">
							<h4 class="font-black text-xl text-gray-900 mb-4 flex items-center gap-2">
								<svg class="w-5 h-5 text-[#a78bfa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
								Merge Tags
							</h4>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div class="p-4 bg-gray-50 border-[2px] border-gray-900 rounded-lg">
									<p class="text-xs text-gray-900 font-extrabold mb-1 tracking-widest">FIRST NAME</p>
									<code class="text-base font-mono text-[#f43f5e] font-black">{currentEsp.firstName}</code>
								</div>
								<div class="p-4 bg-gray-50 border-[2px] border-gray-900 rounded-lg">
									<p class="text-xs text-gray-900 font-extrabold mb-1 tracking-widest">CITY</p>
									<code class="text-base font-mono text-[#f43f5e] font-black">{currentEsp.city}</code>
								</div>
							</div>
						</div>

						<!-- Example URL -->
						<div class="bg-white border-[3px] border-gray-900 p-6 rounded-xl shadow-[4px_4px_0_0_#e5e7eb] transform rotate-1">
							<h4 class="font-black text-xl text-gray-900 mb-4 flex items-center gap-2">
								<svg class="w-5 h-5 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
								Example Image URL
							</h4>
							<div class="bg-gray-900 p-5 rounded-lg border-2 border-gray-900 shadow-[inset_2px_2px_0_rgba(0,0,0,0.5)] overflow-x-auto">
								<code class="text-sm font-mono text-[#4ade80] font-bold whitespace-pre-wrap break-all leading-relaxed">{currentEsp.example}</code>
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
							<!-- Paste Instructions -->
							<div class="bg-white border-[3px] border-gray-900 p-6 rounded-xl shadow-[4px_4px_0_0_#e5e7eb]">
								<h4 class="font-black text-xl text-gray-900 mb-4">How to Use</h4>
								<ol class="space-y-4 text-gray-800 font-medium">
									<li class="flex items-start gap-3">
										<div class="w-6 h-6 rounded bg-[#ffc480] text-gray-900 font-black flex items-center justify-center flex-shrink-0 border-2 border-gray-900">1</div>
										Copy the URL above
									</li>
									<li class="flex items-start gap-3">
										<div class="w-6 h-6 rounded bg-[#ffc480] text-gray-900 font-black flex items-center justify-center flex-shrink-0 border-2 border-gray-900">2</div>
										In your {currentEsp.name} editor, add an Image block
									</li>
									<li class="flex items-start gap-3">
										<div class="w-6 h-6 rounded bg-[#ffc480] text-gray-900 font-black flex items-center justify-center flex-shrink-0 border-2 border-gray-900">3</div>
										Paste the URL as the image <code class="bg-gray-200 px-1 border border-gray-400 rounded">src</code>
									</li>
								</ol>
							</div>

							<!-- Notes & Fallbacks -->
							<div class="space-y-4 flex flex-col justify-between">
								{#if currentEsp.note}
									<div class="p-5 bg-[#ffc480]/20 border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#ffc480]">
										<p class="text-sm font-bold text-gray-900 flex items-start gap-2">
											<svg class="w-5 h-5 text-[#f43f5e] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
												<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span>{currentEsp.note}</span>
										</p>
									</div>
								{/if}

								<div class="p-5 bg-white border-[3px] border-gray-900 rounded-xl border-dashed">
									<h5 class="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Defaults</h5>
									<p class="text-sm font-medium text-gray-900">
										{currentEsp.fallback}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/key}

			<!-- Gmail Warning Hazard Box -->
			<div class="mt-12 p-8 bg-white border-[4px] border-[#f43f5e] shadow-[8px_8px_0_0_#f43f5e] rounded-2xl relative overflow-hidden group">
				<div class="absolute -right-16 -top-16 opacity-10 transform rotate-12 group-hover:rotate-45 transition-transform duration-700">
					<svg class="w-64 h-64 text-[#f43f5e]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
				</div>
				<h4 class="font-black text-2xl text-gray-900 mb-4 flex items-center gap-3 relative z-10">
					<div class="bg-[#f43f5e] text-white p-2 rounded-lg border-2 border-gray-900 shadow-sm">
						<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					Gmail Image Proxy — What You Need to Know
				</h4>
				<ul class="space-y-3 text-lg text-gray-800 font-medium relative z-10">
					<li class="flex gap-2"><span class="font-black text-[#5ce1e6] drop-shadow-[1px_1px_0_#1f2937]">Safe:</span> Personalized URLs are unique per recipient — Gmail caches each one separately.</li>
					<li class="flex gap-2"><span class="font-black text-[#ffc480] drop-shadow-[1px_1px_0_#1f2937]">Notice:</span> Same recipient opening twice sees the cached version from first open (affects countdown timers).</li>
					<li class="flex gap-2"><span class="font-black text-[#f43f5e] drop-shadow-[1px_1px_0_#1f2937]">Action:</span> IP-based geolocation does NOT work in Gmail. Always pass city via merge tags.</li>
				</ul>
			</div>
		</div>
	</section>

	<SectionSeparator icon="arrow" />

	<!-- Technical Details -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-white relative">
		<!-- Graphic Background -->
		<div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: linear-gradient(#000 2px, transparent 2px), linear-gradient(90deg, #000 2px, transparent 2px); background-size: 64px 64px;"></div>

		<div class="max-w-5xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div class="inline-block px-4 py-1.5 bg-[#7dd3fc] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform -rotate-1">
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Infrastructure</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
					How It Works Under the Hood
				</h2>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
				<!-- Box 1 -->
				<div class="p-8 bg-[#4ade80] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] hover:-translate-y-2 transition-all duration-300 rounded-xl flex flex-col items-start gap-4 transform rotate-1">
					<div class="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-900 shadow-sm">
						<svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
					</div>
					<div>
						<h3 class="text-2xl font-black text-gray-900 mb-2">No JavaScript Required</h3>
						<p class="text-gray-900 font-medium text-lg leading-relaxed mix-blend-color-burn">Images are standard <code class="bg-white/50 px-1 rounded font-bold">img</code> tags — they work perfectly in every email client including Outlook, Apple Mail, and Gmail.</p>
					</div>
				</div>

				<!-- Box 2 -->
				<div class="p-8 bg-[#ffc480] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] hover:-translate-y-2 transition-all duration-300 rounded-xl flex flex-col items-start gap-4 transform -rotate-1 mt-4 sm:mt-0">
					<div class="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-900 shadow-sm">
						<svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
					</div>
					<div>
						<h3 class="text-2xl font-black text-gray-900 mb-2">Server-Side Rendering</h3>
						<p class="text-gray-900 font-medium text-lg leading-relaxed mix-blend-color-burn">Images are rendered dynamically as PNG or JPG on our edge servers milliseconds after the email is opened.</p>
					</div>
				</div>

				<!-- Box 3 -->
				<div class="p-8 bg-[#a78bfa] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] hover:-translate-y-2 transition-all duration-300 rounded-xl flex flex-col items-start gap-4 transform rotate-1">
					<div class="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-900 shadow-sm">
						<svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
					</div>
					<div>
						<h3 class="text-2xl font-black text-gray-900 mb-2">Smart Caching</h3>
						<p class="text-gray-900 font-medium text-lg leading-relaxed mix-blend-color-burn">First render is cached for 60 seconds, then re-rendered with fresh data. You control TTL via Dynamic Links settings.</p>
					</div>
				</div>

				<!-- Box 4 -->
				<div class="p-8 bg-[#ff6b6b] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] hover:-translate-y-2 transition-all duration-300 rounded-xl flex flex-col items-start gap-4 transform -rotate-1 mt-4 sm:mt-0">
					<div class="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-900 shadow-sm">
						<svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
					</div>
					<div>
						<h3 class="text-2xl font-black text-gray-900 mb-2">Graceful Fallbacks</h3>
						<p class="text-gray-900 font-medium text-lg leading-relaxed mix-blend-color-burn">If a variable is missing, the template shows the default value you specifically set in the editor. Zero broken images.</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<SectionSeparator icon="star" />

	<!-- Pricing CTA -->
	<section class="py-24 px-4 sm:px-6 lg:px-8 bg-[#a78bfa] border-b-[3px] border-gray-900 overflow-hidden relative">
		<!-- Dynamic Background Pattern -->
		<div
			class="absolute inset-0 opacity-[0.15] pointer-events-none"
			style="background-image: radial-gradient(#000 2px, transparent 2px); background-size: 24px 24px;"
		/>

		<!-- Floating decorative elements -->
		<div class="absolute top-10 right-10 w-16 h-16 bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] animate-bounce" style="animation-duration: 3s; border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;"></div>
		<div class="absolute bottom-10 left-10 w-24 h-24 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full animate-bounce" style="animation-duration: 4.5s;"></div>

		<div class="max-w-4xl mx-auto text-center relative z-10">
			<!-- Neo-Brutalist Container -->
			<div class="p-8 sm:p-12 md:p-16 bg-white border-[3px] border-gray-900 rounded-[2rem] shadow-[12px_12px_0_0_#1f2937] hover:shadow-[16px_16px_0_0_#1f2937] transition-shadow duration-300">
				
				<div class="inline-block px-4 py-1.5 bg-[#4ade80] text-gray-900 border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform rotate-2">
					<span class="text-sm font-bold uppercase tracking-wider">Start Now</span>
				</div>

				<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
					Start Personalizing <br class="hidden sm:block" />
					<span class="text-[#a78bfa] drop-shadow-[2px_2px_0_#1f2937] relative inline-block">
						Email Images
						<svg class="absolute w-full h-4 -bottom-2 left-0 text-gray-900 opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
							<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
						</svg>
					</span>
				</h2>
				
				<p class="text-xl text-gray-700 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
					Free plan includes 50 personalized images/month. <br class="hidden sm:block" />Standard plan and above: unlimited personalization.
				</p>
				
				<div class="flex flex-col sm:flex-row gap-6 justify-center">
					<a
						href="/signup"
						on:click={() => trackCTA('Get Started Free')}
						class="px-8 py-4 bg-gray-900 text-white font-black text-lg border-[3px] border-gray-900 rounded-xl
							shadow-[8px_8px_0_0_#a78bfa] hover:shadow-[4px_4px_0_0_#a78bfa] hover:translate-x-1 hover:translate-y-1
							transition-all duration-200 text-center flex items-center justify-center gap-2 group"
					>
						Get Started Free
						<svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform border-[2px] border-white rounded-full p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
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
				<div class="inline-block px-4 py-1.5 bg-[#ff6b6b] text-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform -rotate-2">
					<span class="text-sm font-bold uppercase tracking-wider">Support</span>
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
							class="w-full text-left px-6 py-5 flex items-center justify-between font-black text-lg text-gray-900 {openFaq === i ? 'bg-[#ffc480]/20' : 'hover:bg-gray-50'}"
						>
							<span>{faq.q}</span>
							<div class="w-8 h-8 rounded-full border-2 border-gray-900 flex items-center justify-center bg-white flex-shrink-0 ml-4 {openFaq === i ? 'shadow-[inset_2px_2px_0_0_#a78bfa]' : ''}">
								<svg class="w-5 h-5 transition-transform {openFaq === i ? 'rotate-180 text-[#a78bfa]' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</div>
						</button>
						{#if openFaq === i}
							<div class="px-6 pb-6 pt-2 text-gray-700 font-medium leading-relaxed bg-[#ffc480]/20 border-t-[3px] border-gray-900" transition:fly={{ y: -10, duration: 200 }}>
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
