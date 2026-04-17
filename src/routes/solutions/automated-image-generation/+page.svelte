<script>
	import SolutionPageShell from '$lib/components/solutions/SolutionPageShell.svelte';
	import SolutionClosingCta from '$lib/components/solutions/SolutionClosingCta.svelte';
	import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';
	import { solutions } from '$lib/solutions/related.js';
	import { fly } from 'svelte/transition';

	const title = 'Automated Image Generation — The Programmable Image Engine | Pictify';
	const description =
		'Automated image generation API for developers. Templates with expressions, live data bindings, and A/B experiments — one API, any scale.';
	const canonical = 'https://pictify.io/solutions/automated-image-generation';
	const ogImage = 'https://pictify.io/og/solutions/automated-image-generation.png';

	const related = solutions.filter((s) => !s.isPillar);

	const useCases = [
		{
			title: 'Personalized social cards',
			description: 'Every blog post, customer win, or launch lands as on-brand social assets — generated from the content record itself.',
			iconPath: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
			color: 'bg-[#ff6b6b]',
			slug: 'automate-social-media-images',
			mock: 'social'
		},
		{
			title: 'Dynamic product images',
			description: 'Catalog-scale product cards with live prices, stock-aware badges, and seasonal variants — rendered from your inventory data.',
			iconPath: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
			color: 'bg-[#4ade80]',
			slug: 'automate-product-images',
			mock: 'product'
		},
		{
			title: 'Automated OG images',
			description: 'Unique Open Graph image per page — rendered on first fetch, CDN-cached after. Zero build-time cost, infinite variety.',
			iconPath: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
			color: 'bg-[#ffc480]',
			slug: 'automate-og-images',
			mock: 'og'
		},
		{
			title: 'Personalized email headers',
			description: 'Every recipient sees their name, plan, and stats in the email hero. Open rates climb because the image is about them.',
			iconPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
			color: 'bg-[#a78bfa]',
			slug: 'automate-email-headers',
			mock: 'email'
		}
	];

	const differentiatorIcons = {
		LOGIC: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
		DATA: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
		TEST: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
		FORMAT: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
		UX: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
		AI: 'M13 10V3L4 14h7v7l9-11h-7z'
	};

	const approaches = [
		{
			tag: 'OPTION 1',
			tagColor: 'bg-[#ff6b6b]',
			title: 'DIY headless browser',
			sub: 'Puppeteer / Playwright',
			verdict: 'Full control. Ops-heavy. Stops scaling around 1,000 renders/day.',
			good: 'You already run browser automation for scraping or E2E.',
			bad: 'Your volume is growing. A single Chromium uses 500MB–1GB of RAM.',
			rotate: '-rotate-1'
		},
		{
			tag: 'OPTION 2',
			tagColor: 'bg-[#ffc480]',
			title: 'Design-tool APIs',
			sub: 'Canva Connect / Figma REST',
			verdict: 'Designer-friendly. Rate-limited. Expensive per render at volume.',
			good: 'A non-technical designer already owns the asset.',
			bad: 'You need high volume or dev-native ergonomics.',
			rotate: 'rotate-1'
		},
		{
			tag: 'OPTION 3',
			tagColor: 'bg-[#a78bfa]',
			title: 'AI image generators',
			sub: 'DALL-E / Gemini / SD',
			verdict: 'Great for novelty. Catastrophic for brand consistency.',
			good: "You need creative exploration, not deterministic output.",
			bad: 'You need the image to look the same every render.',
			rotate: '-rotate-1'
		},
		{
			tag: 'OPTION 4',
			tagColor: 'bg-[#4ade80]',
			title: 'Template-based API',
			sub: 'Pictify · Bannerbear · Placid · RenderForm',
			verdict: 'Design once. POST data. Repeat forever.',
			good: 'You need deterministic, on-brand images at any scale.',
			bad: 'You need video or fully AI-generated scenes.',
			rotate: 'rotate-1',
			recommended: true
		}
	];

	const differentiators = [
		{
			title: 'Expression engine',
			description: '{{ price * 0.9 | currency }} is a first-class template feature. Conditionals, filters, nested lookups — built in.',
			badge: 'LOGIC',
			color: 'bg-[#ff6b6b]'
		},
		{
			title: 'Live data bindings',
			description: 'Templates fetch variables from HTTP, webhooks, or Sheets at render time. Images update when data does.',
			badge: 'DATA',
			color: 'bg-[#4ade80]'
		},
		{
			title: 'A/B experiments',
			description: 'Ship variants, track impressions, declare a winner — all from the same API that renders the image.',
			badge: 'TEST',
			color: 'bg-[#a78bfa]'
		},
		{
			title: 'One API, many outputs',
			description: 'PNG, JPEG, WebP, multi-page PDF, GIF. Same template, different fileExtension.',
			badge: 'FORMAT',
			color: 'bg-[#ffc480]'
		},
		{
			title: 'API + no-code duality',
			description: 'Designers build in a visual canvas. Engineers call one endpoint. No context switch.',
			badge: 'UX',
			color: 'bg-[#06b6d4]'
		},
		{
			title: 'Agentic AI copilot',
			description: '"Make a dark variant," "resize for IG Story," "generate 5 backgrounds" — step-by-step, not one-shot.',
			badge: 'AI',
			color: 'bg-[#ec4899]'
		}
	];

	const faqs = [
		{
			q: 'What is automated image generation?',
			a: 'Automated image generation (also called programmatic image generation or image automation) is the process of producing images programmatically from templates and structured data — instead of designing each image by hand. A template defines the visual layout with placeholders for variables (text, images, colors, counts), and an image generation API fills them in per request. The result: one design produces thousands of personalized images with a single API call.'
		},
		{
			q: 'Is Pictify a Bannerbear or Orshot alternative?',
			a: 'Yes. Pictify is a drop-in alternative to Bannerbear, Placid, Orshot, RenderForm, and Dynapictures. Teams typically migrate for three reasons: (1) Pictify ships a real expression engine so logic lives in templates instead of backend code, (2) live data bindings mean images update when your data updates, and (3) A/B experiments on rendered images ship as a first-class feature. The underlying API shape is similar — swap the endpoint and the template ID and existing integrations work.'
		},
		{
			q: 'How is Pictify different from Bannerbear or Placid technically?',
			a: 'Pictify templates carry logic — a real expression engine (e.g. `{{ price * 0.9 | currency }}`), conditional blocks, live data bindings, and native A/B experiments. Bannerbear and Placid treat variables as plain string replacement, so any non-trivial formatting or conditional rendering has to happen in your backend before you call their API. Pictify keeps that logic inside the template where designers can see and adjust it.'
		},
		{
			q: 'How is this different from DALL-E or Midjourney?',
			a: 'AI image generators create images from text prompts — every render is unique and unpredictable. Pictify is template-based: you design once, then render a million personalized variations that all stay on-brand. Different tool for different jobs. We render your existing design with your data; AI models invent new visuals each time.'
		},
		{
			q: "What's the cheapest way to generate images programmatically?",
			a: 'Pictify has a free tier with 50 renders per month (no watermark, no credit card), which is enough to validate an integration. Beyond that, our per-render pricing is cheaper than running your own Puppeteer fleet (~$0.001/render vs ~$0.01 all-in when you account for compute, cold-starts, and ops) and competitive with Bannerbear/Placid/RenderForm.'
		},
		{
			q: 'Can I use automated image generation for server-side OG images?',
			a: 'Yes — this is one of the most popular use cases. Render OG images on request (dynamic per blog post, product, or user profile) or pre-render them at publish time. Pictify returns a CDN-cached URL in ~800ms cold, sub-100ms warm, so dynamic OG in production is safe.'
		},
		{
			q: 'Do I need a design team to use this?',
			a: 'No. Pictify ships an editor that non-technical users can operate (same ergonomics as Canva). If your team has a designer, they build the template visually. If not, you can write templates in HTML/CSS directly — the editor treats HTML as a first-class element type.'
		},
		{
			q: 'What image formats does Pictify support?',
			a: 'PNG, JPEG, WebP, single-page PDF, multi-page PDF, and GIF — all from the same template. Switching formats is a `fileExtension` query parameter, not a separate product.'
		},
		{
			q: 'Can automated image generation scale to millions of renders per month?',
			a: 'Yes. Pictify renders asynchronously with batch endpoints for workloads over ~100 images per request, and CDN-caches the output so repeat requests are free. Companies using it in production hit seven-figure monthly render volumes without capacity planning on their side.'
		},
		{
			q: 'Can I do bulk image generation from a CSV or database?',
			a: 'Yes. Pictify ships a bulk image generation endpoint that accepts an array of variable objects and kicks off an async job — useful when you need to generate images from data in a spreadsheet, a database export, or a Year-in-Review cron. A webhook fires when the batch is complete; the payload contains the CDN URLs for every rendered image.'
		}
	];

	const howToMeta = {
		name: 'How to automate image generation',
		description:
			'Four approaches to automated image generation, compared honestly — with code. Pick the right tool for your volume and design complexity.',
		totalTime: 'PT10M',
		tool: [{ '@type': 'HowToTool', name: 'Pictify template-based rendering API' }]
	};

	const howToSteps = [
		{
			name: 'Pick your approach',
			text: 'Four paths exist: DIY headless browser (Puppeteer/Playwright), design-tool APIs (Canva, Figma), AI image generators (DALL-E, Gemini), and template-based rendering APIs (Pictify, Bannerbear, Placid).',
			url: `${canonical}#approaches`
		},
		{
			name: 'Design the template',
			text: 'In a template-based API, design the layout once in the visual editor (or write it in HTML/CSS). Add variable placeholders for the data that changes per image.',
			url: `${canonical}#render`
		},
		{
			name: 'Render with variables',
			text: 'POST the template ID and a JSON payload of variables. The API returns a CDN-cached image URL in under a second.',
			url: `${canonical}#render`
		}
	];

	const webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify — Programmable Image Engine',
		url: canonical,
		description:
			'Automated image generation via API + visual editor. Templates with expressions, live data bindings, A/B experiments, and multi-format output.',
		applicationCategory: ['DeveloperApplication', 'ImageGenerator'],
		operatingSystem: 'Web',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		featureList: [
			'Visual template editor (Canva-style)',
			'Expression engine with conditionals and filters',
			'Live data bindings to HTTP, webhooks, and static JSON',
			'A/B experiments on rendered images',
			'Batch rendering and async jobs',
			'PNG, JPEG, WebP, multi-page PDF, and GIF output',
			'Agentic AI copilot for template generation'
		],
		creator: { '@type': 'Organization', name: 'Pictify', url: 'https://pictify.io' }
	};
</script>

<SolutionPageShell
	{title}
	{description}
	{canonical}
	breadcrumbLabel="Automated Image Generation"
	{ogImage}
	ogImageAlt="Pictify — the programmable image engine. POST. Render. Ship."
	{webApplicationSchema}
	{faqs}
	{howToSteps}
	{howToMeta}
	renderFaq={false}
>
	<!-- Hero -->
	<header class="text-center mb-20 pt-6" in:fly={{ y: 30, duration: 600 }}>
		<h1 class="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[0.95] mb-8 max-w-5xl mx-auto">
			Automated image generation,<br />
			<span class="relative inline-block text-[#ff6b6b] mt-2">
				done right.
				<svg
					class="absolute w-full h-4 -bottom-1 left-0 text-gray-900 opacity-20"
					viewBox="0 0 100 10"
					preserveAspectRatio="none"
				>
					<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
				</svg>
			</span>
		</h1>

		<p class="text-xl sm:text-2xl text-gray-700 font-medium max-w-3xl mx-auto mb-10 leading-relaxed">
			An image generation API with templates, expressions, live data bindings, and experiments. One endpoint. Any scale. <br class="hidden sm:block" />
			<span
				class="font-black text-gray-900 bg-[#4ade80] px-2 border-b-[3px] border-gray-900 mt-2 inline-block shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]"
				>No Canva. No Puppeteer fleet. No stitched stack.</span
			>
		</p>

		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a
				href="/signup"
				class="px-8 py-4 bg-gray-900 text-white font-black text-lg border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#ffc480] hover:shadow-[4px_4px_0_0_#ffc480] hover:translate-x-1 hover:translate-y-1 transition-all duration-200 text-center"
			>
				Start Free
			</a>
			<a
				href="#render"
				class="px-8 py-4 bg-white text-gray-900 font-black text-lg border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1 transition-all duration-200 inline-flex items-center justify-center gap-2 group"
			>
				See the code
				<svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
					<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
				</svg>
			</a>
		</div>
	</header>

	<div class="mt-16 md:mt-24">
		<SectionSeparator icon="bolt" />
	</div>

	<!-- The opener -->
	<section class="py-20 px-4 relative">
		<div class="max-w-4xl mx-auto text-center">
			<div
				class="inline-block px-4 py-1.5 bg-[#ff6b6b]/20 border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform rotate-2"
			>
				<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Why we built this</span>
			</div>
			<h2 class="text-3xl md:text-5xl font-black text-gray-900 mb-8 leading-tight">
				Most tools promise automation.<br />Few can do logic.
			</h2>
			<p class="text-lg md:text-xl text-gray-700 font-medium leading-relaxed mb-5">
				Bannerbear, Placid, and similar tools promise to automate your marketing images — but their
				templates only do string replacement. The moment your content needs <strong>conditional logic</strong>,
				<strong>live data</strong>, or <strong>A/B testing</strong>, you end up bolting on a second service.
				Or three.
			</p>
			<p class="text-lg md:text-xl text-gray-700 font-medium leading-relaxed">
				Pictify is a rendering engine where templates carry <strong>expressions</strong>,
				<strong>data bindings</strong>, and <strong>experiments</strong> as first-class features. Not
				a design tool with an API bolted on — a programmable engine that happens to have a designer-friendly
				editor.
			</p>
		</div>
	</section>

	<div class="mt-10 md:mt-16">
		<SectionSeparator icon="star" />
	</div>

	<!-- Use cases grid -->
	<section class="py-24 px-4 bg-white relative border-y-[3px] border-gray-900" id="use-cases">
		<div
			class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"
		/>
		<div class="max-w-7xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div
					class="inline-block px-4 py-1.5 bg-[#7dd3fc] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform rotate-2"
				>
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Where this fits</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
					Four ways teams use this today
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
					Personalized, on-brand, current. Pick your use case; every one runs on the same API.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
				{#each useCases as u, i}
					<a
						href="/solutions/{u.slug}"
						class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] hover:-translate-y-2 transition-all duration-300 flex flex-col group overflow-hidden"
						in:fly={{ y: 20, duration: 400, delay: i * 100 }}
					>
						<div
							class="{u.color} p-6 border-b-[3px] border-gray-900 flex items-center justify-between"
						>
							<div
								class="w-12 h-12 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] group-hover:rotate-12 transition-transform"
							>
								<svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d={u.iconPath} />
								</svg>
							</div>
							<span class="text-xs font-black text-gray-900 uppercase tracking-wider bg-white/60 border-2 border-gray-900 px-3 py-1 rounded-full inline-flex items-center gap-1">
								Guide
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
								</svg>
							</span>
						</div>

						<!-- Visual mock -->
						<div class="bg-gray-50 border-b-[3px] border-gray-900 p-6 flex items-center justify-center relative overflow-hidden h-52">
							<div class="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000_2px,transparent_2px)] [background-size:12px_12px]" />
							{#if u.mock === 'social'}
								<!-- Social card mock -->
								<div class="w-full max-w-[240px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] overflow-hidden relative z-10 group-hover:-translate-y-1 transition-transform">
									<div class="h-20 bg-gradient-to-br from-[#ff6b6b] to-[#ec4899] border-b-[2px] border-gray-900 relative flex items-end p-2">
										<div class="text-[9px] font-black text-white uppercase tracking-widest bg-black/30 backdrop-blur px-1.5 py-0.5 rounded">Customer Win</div>
									</div>
									<div class="p-3 bg-white">
										<div class="h-2 w-full bg-gray-900 rounded mb-1.5"></div>
										<div class="h-2 w-2/3 bg-gray-300 rounded mb-2"></div>
										<div class="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold">
											<div class="w-4 h-4 rounded-full bg-gray-200 border border-gray-900"></div>
											<span>@you</span>
											<span class="ml-auto bg-[#4ade80] text-gray-900 px-1.5 py-0.5 rounded border border-gray-900 font-black">LIVE</span>
										</div>
									</div>
								</div>
							{:else if u.mock === 'product'}
								<!-- Product card mock -->
								<div class="w-full max-w-[220px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] overflow-hidden relative z-10 group-hover:-translate-y-1 transition-transform">
									<div class="h-20 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative border-b-[2px] border-gray-900">
										<svg class="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
											<path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
										</svg>
										<div class="absolute top-1.5 right-1.5 bg-[#ff6b6b] text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-gray-900">-20%</div>
									</div>
									<div class="p-2.5 bg-white">
										<div class="h-2 w-3/4 bg-gray-300 rounded mb-1.5"></div>
										<div class="flex items-center justify-between">
											<div class="font-black text-gray-900 text-sm">$39.<span class="text-[10px]">20</span></div>
											<div class="text-[9px] font-black text-[#4ade80] bg-gray-900 px-1.5 py-0.5 rounded">In stock</div>
										</div>
									</div>
								</div>
							{:else if u.mock === 'og'}
								<!-- OG image mock -->
								<div class="w-full max-w-[260px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] overflow-hidden relative z-10 group-hover:-translate-y-1 transition-transform">
									<div class="h-16 bg-gradient-to-r from-[#ffc480] to-[#ff6b6b] border-b-[2px] border-gray-900 flex flex-col justify-center px-3 relative">
										<div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px]"></div>
										<div class="font-black text-white text-sm leading-tight relative z-10 drop-shadow-sm">Your Blog Post Title</div>
										<div class="text-[9px] text-white/90 font-bold uppercase tracking-wider relative z-10 mt-0.5">pictify.io · 1200×630</div>
									</div>
									<div class="px-3 py-2 bg-gray-50 flex items-center gap-1.5">
										<div class="flex gap-0.5">
											<div class="w-2 h-2 rounded bg-[#ff6b6b] border border-gray-900"></div>
											<div class="w-2 h-2 rounded bg-[#4ade80] border border-gray-900"></div>
										</div>
										<div class="text-[9px] font-mono text-gray-500 ml-1 truncate">og:image</div>
										<div class="text-[9px] font-black text-[#4ade80] ml-auto bg-white border border-gray-900 px-1.5 rounded">200</div>
									</div>
								</div>
							{:else if u.mock === 'email'}
								<!-- Email header mock -->
								<div class="w-full max-w-[240px] bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] overflow-hidden relative z-10 group-hover:-translate-y-1 transition-transform">
									<div class="bg-gray-100 border-b-[2px] border-gray-900 px-2 py-1 flex items-center gap-1 text-[9px] font-mono text-gray-600">
										<svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
										<span>Inbox · you@team.com</span>
									</div>
									<div class="h-16 bg-gradient-to-br from-[#a78bfa] to-[#7dd3fc] border-b-[2px] border-gray-900 flex items-center px-3 gap-2 relative">
										<div class="w-8 h-8 rounded-full bg-white border-[2px] border-gray-900 flex items-center justify-center text-xs font-black text-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]">A</div>
										<div class="flex-1">
											<div class="font-black text-white text-xs leading-tight drop-shadow-sm">Welcome, Ada</div>
											<div class="text-[9px] text-white/90 font-bold">Pro Plan · 12 teammates</div>
										</div>
									</div>
									<div class="p-2 bg-white">
										<div class="h-1.5 w-full bg-gray-200 rounded mb-1"></div>
										<div class="h-1.5 w-3/4 bg-gray-200 rounded"></div>
									</div>
								</div>
							{/if}
						</div>

						<div class="p-6 md:p-8 flex-1 flex flex-col bg-white">
							<h3 class="text-2xl font-black text-gray-900 mb-3 leading-tight">{u.title}</h3>
							<p class="text-gray-700 text-lg font-medium leading-relaxed">{u.description}</p>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<SectionSeparator icon="arrow" />

	<!-- Four approaches -->
	<section class="py-24 px-4 bg-[#fdf2f8] border-b-[3px] border-gray-900 relative" id="approaches"><span id="comparison" class="absolute -top-20"></span>
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-16">
				<div
					class="inline-block px-4 py-1.5 bg-[#ff6b6b] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform -rotate-2"
				>
					<span class="text-sm font-bold text-white uppercase tracking-wider">The Honest Breakdown</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
					Four ways to do this.<br />Only one is right for you.
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
					Honest tradeoffs. Pick on fit — not on whoever ranks #1 for this search.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 pt-4">
				{#each approaches as a, i}
					<div
						class="relative flex flex-col {a.recommended ? 'ring-4 ring-[#4ade80]/40 rounded-2xl' : ''}"
						in:fly={{ y: 20, duration: 400, delay: i * 80 }}
					>
						{#if a.recommended}
							<div
								class="absolute -top-4 -right-4 bg-[#4ade80] border-[3px] border-gray-900 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-[3px_3px_0_0_#1f2937] z-20 transform rotate-6 inline-flex items-center gap-1.5 whitespace-nowrap"
							>
								<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
								This is us
							</div>
						{/if}
						<div class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_0_#1f2937] hover:shadow-[10px_10px_0_0_#1f2937] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden flex-1">
						<div class="{a.tagColor} px-5 py-2 border-b-[3px] border-gray-900">
							<span class="text-xs font-black uppercase tracking-widest text-gray-900">{a.tag}</span>
						</div>
						<div class="p-6 md:p-7 flex-1">
							<h3 class="text-2xl font-black text-gray-900 mb-1">{a.title}</h3>
							<p class="text-sm font-mono font-bold text-gray-500 uppercase tracking-wider mb-4">
								{a.sub}
							</p>
							<p class="text-lg font-bold text-gray-900 mb-5 leading-snug">"{a.verdict}"</p>
							<div class="space-y-3">
								<div class="flex items-start gap-3">
									<span class="flex-shrink-0 w-6 h-6 rounded-lg bg-[#4ade80] border-2 border-gray-900 flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]">
										<svg class="w-3.5 h-3.5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									</span>
									<span class="text-gray-700 font-medium pt-0.5">{a.good}</span>
								</div>
								<div class="flex items-start gap-3">
									<span class="flex-shrink-0 w-6 h-6 rounded-lg bg-[#ff6b6b] border-2 border-gray-900 flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]">
										<svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
											<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</span>
									<span class="text-gray-700 font-medium pt-0.5">{a.bad}</span>
								</div>
							</div>
						</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<SectionSeparator icon="hash" />

	<!-- What makes Pictify different -->
	<section class="py-24 px-4 bg-white border-b-[3px] border-gray-900 relative">
		<div
			class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"
		/>
		<div class="max-w-7xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<div
					class="inline-block px-4 py-1.5 bg-[#a78bfa] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform rotate-2"
				>
					<span class="text-sm font-bold text-white uppercase tracking-wider">Six differentiators</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
					What sets this apart
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
					The features Bannerbear, Placid, and RenderForm all skipped — because they're hard.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each differentiators as d, i}
					<div
						class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_0_#1f2937] hover:shadow-[10px_10px_0_0_#1f2937] hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
						in:fly={{ y: 20, duration: 400, delay: i * 60 }}
					>
						<div class="{d.color} px-5 py-3 border-b-[3px] border-gray-900 flex items-center justify-between">
							<span class="text-xs font-black text-white uppercase tracking-widest drop-shadow-sm">{d.badge}</span>
							<div class="w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-900"></div>
						</div>
						<div class="p-6">
							<div class="w-12 h-12 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0_0_#1f2937] mb-4 group-hover:rotate-6 transition-transform">
								<svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
									<path stroke-linecap="round" stroke-linejoin="round" d={differentiatorIcons[d.badge]} />
								</svg>
							</div>
							<h3 class="text-xl font-black text-gray-900 mb-3 leading-tight">{d.title}</h3>
							<p class="text-gray-700 leading-relaxed">{d.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<SectionSeparator icon="arrow" />

	<!-- How it works: visual template + API -->
	<section class="py-24 px-4 bg-[#FFFDF8] border-b-[3px] border-gray-900 relative overflow-hidden" id="render">
		<div
			class="absolute inset-0 opacity-[0.05] pointer-events-none"
			style="background-image: linear-gradient(rgba(31,41,55,1) 1px, transparent 1px), linear-gradient(90deg, rgba(31,41,55,1) 1px, transparent 1px); background-size: 48px 48px;"
		></div>
		<div class="max-w-6xl mx-auto relative z-10">
			<div class="text-center mb-14">
				<div
					class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6"
				>
					<svg class="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">How it works</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight">
					Design once in the canvas.<br />
					<span class="text-[#ff6b6b]">POST data to render.</span>
				</h2>
				<p class="text-xl text-gray-700 font-medium max-w-3xl mx-auto">
					Every text, image, and shape layer on the canvas can bind to a variable, show conditionally, or format with an expression — all configured in the UI. Your API just sends the data.
				</p>
			</div>

			<!-- Three-step flow diagram -->
			<div class="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr,auto,1fr] gap-4 md:gap-3 items-stretch mb-14">
				<!-- Step 1: Design -->
				<div class="bg-white border-[3px] border-gray-900 rounded-2xl p-5 flex flex-col items-center text-center shadow-[6px_6px_0_0_#ffc480]" in:fly={{ y: 20, duration: 400, delay: 0 }}>
					<div class="w-12 h-12 bg-[#ffc480] border-[3px] border-gray-900 rounded-xl flex items-center justify-center mb-3 shadow-[3px_3px_0_0_#1f2937]">
						<svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
						</svg>
					</div>
					<div class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Step 1</div>
					<div class="text-lg font-black text-gray-900 mb-1">Design in the canvas</div>
					<div class="text-xs text-gray-600 font-medium">Drop layers. Bind variables visually.</div>
				</div>

				<!-- Arrow -->
				<div class="hidden md:flex items-center justify-center">
					<svg class="w-10 h-10 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
						<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
					</svg>
				</div>

				<!-- Step 2: POST data -->
				<div class="bg-white border-[3px] border-gray-900 rounded-2xl p-5 flex flex-col items-center text-center shadow-[6px_6px_0_0_#4ade80]" in:fly={{ y: 20, duration: 400, delay: 120 }}>
					<div class="w-12 h-12 bg-[#4ade80] border-[3px] border-gray-900 rounded-xl flex items-center justify-center mb-3 shadow-[3px_3px_0_0_#1f2937]">
						<svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 19v-8m0 0l-4 4m4-4l4 4M3 7h18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
						</svg>
					</div>
					<div class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Step 2</div>
					<div class="text-lg font-black text-gray-900 mb-1">POST data via API</div>
					<div class="text-xs text-gray-600 font-medium">Template ID + variables object</div>
				</div>

				<!-- Arrow -->
				<div class="hidden md:flex items-center justify-center">
					<svg class="w-10 h-10 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
						<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
					</svg>
				</div>

				<!-- Step 3: CDN URL -->
				<div class="bg-white border-[3px] border-gray-900 rounded-2xl p-5 flex flex-col items-center text-center shadow-[6px_6px_0_0_#a78bfa]" in:fly={{ y: 20, duration: 400, delay: 240 }}>
					<div class="w-12 h-12 bg-[#a78bfa] border-[3px] border-gray-900 rounded-xl flex items-center justify-center mb-3 shadow-[3px_3px_0_0_#1f2937]">
						<svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</div>
					<div class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Step 3</div>
					<div class="text-lg font-black text-gray-900 mb-1">CDN URL back</div>
					<div class="text-xs text-gray-600 font-medium">Ready to ship anywhere</div>
				</div>
			</div>

			<!-- Visual canvas mock + API request side-by-side -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
				<!-- Canvas mock: shows layers with bindings (UI-configured) -->
				<div class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#ffc480] overflow-hidden flex flex-col">
					<!-- Editor toolbar -->
					<div class="bg-gray-100 px-4 py-3 border-b-[3px] border-gray-900 flex items-center gap-2">
						<div class="w-3.5 h-3.5 rounded-full bg-[#ff5f56] border border-black/40"></div>
						<div class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] border border-black/40"></div>
						<div class="w-3.5 h-3.5 rounded-full bg-[#27c93f] border border-black/40"></div>
						<span class="ml-3 text-xs text-gray-700 font-mono font-bold uppercase tracking-wider">Pictify editor</span>
						<span class="ml-auto text-[10px] text-gray-500 font-mono font-bold uppercase tracking-widest">Visual</span>
					</div>

					<div class="flex flex-col md:flex-row flex-1 min-h-[420px]">
						<!-- Canvas preview -->
						<div class="flex-1 bg-[#FFFDF8] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] p-6 md:border-r-[3px] border-b-[3px] md:border-b-0 border-gray-900 relative flex items-center justify-center">
							<!-- Selected-layer indicator -->
							<div class="absolute top-3 left-3 bg-[#ff6b6b] text-white text-[9px] font-black px-2 py-0.5 rounded border-2 border-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,0.25)] flex items-center gap-1">
								<span class="w-1.5 h-1.5 rounded-full bg-white"></span>
								Selected: Text layer
							</div>
							<!-- Card mock on canvas -->
							<div class="w-full max-w-[260px] bg-white border-[3px] border-gray-900 rounded-xl shadow-[5px_5px_0_0_rgba(0,0,0,0.2)] overflow-hidden relative">
								<!-- Text layer: product -->
								<div class="px-4 pt-4 pb-2 relative">
									<div class="absolute inset-x-2 top-2 bottom-1 border-2 border-dashed border-[#ff6b6b] rounded pointer-events-none"></div>
									<div class="font-black text-lg text-gray-900 relative">Pro plan</div>
								</div>
								<!-- Text layer: price -->
								<div class="px-4 py-2">
									<div class="font-black text-2xl text-gray-900">$49.00</div>
								</div>
								<!-- Conditional badge -->
								<div class="px-4 pt-1 pb-3">
									<div class="inline-flex items-center gap-1 bg-[#ffc480] border-2 border-gray-900 rounded text-[10px] font-black uppercase tracking-wider text-gray-900 px-2 py-0.5">
										<span class="w-1.5 h-1.5 rounded-full bg-[#ff6b6b]"></span>
										New
									</div>
								</div>
								<!-- Footer / avatar -->
								<div class="border-t-2 border-gray-200 px-4 py-2.5 flex items-center gap-2">
									<div class="w-7 h-7 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7dd3fc] border border-gray-900 flex-shrink-0"></div>
									<div class="text-[10px] font-bold text-gray-700">by team</div>
								</div>
							</div>
						</div>

						<!-- Right panel: bindings list -->
						<div class="md:w-[45%] bg-gray-50 p-4 text-[11px]">
							<div class="font-black text-gray-900 text-[10px] uppercase tracking-widest mb-3 pb-2 border-b-2 border-gray-900 flex items-center gap-1.5">
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
								Variable bindings
							</div>
							<div class="space-y-2">
								<div class="bg-white border-2 border-gray-900 rounded p-2 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">
									<div class="flex items-center gap-1.5 mb-1">
										<div class="w-2 h-2 rounded-sm bg-[#ff6b6b] border border-gray-900"></div>
										<code class="font-mono font-black text-gray-900">product</code>
										<span class="ml-auto text-[9px] text-gray-500 font-bold uppercase">text</span>
									</div>
									<div class="text-[9px] text-gray-500 pl-3.5 font-mono">→ Text layer · .text</div>
								</div>
								<div class="bg-white border-2 border-gray-900 rounded p-2 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">
									<div class="flex items-center gap-1.5 mb-1">
										<div class="w-2 h-2 rounded-sm bg-[#4ade80] border border-gray-900"></div>
										<code class="font-mono font-black text-gray-900">price</code>
										<span class="ml-auto text-[9px] text-gray-500 font-bold uppercase">number</span>
									</div>
									<div class="text-[9px] text-gray-500 pl-3.5 font-mono">→ Text · filter: currency</div>
								</div>
								<div class="bg-white border-2 border-gray-900 rounded p-2 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">
									<div class="flex items-center gap-1.5 mb-1">
										<div class="w-2 h-2 rounded-sm bg-[#a78bfa] border border-gray-900"></div>
										<code class="font-mono font-black text-gray-900">featured</code>
										<span class="ml-auto text-[9px] text-gray-500 font-bold uppercase">bool</span>
									</div>
									<div class="text-[9px] text-gray-500 pl-3.5 font-mono">→ Badge · showWhen</div>
								</div>
								<div class="bg-white border-2 border-gray-900 rounded p-2 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">
									<div class="flex items-center gap-1.5 mb-1">
										<div class="w-2 h-2 rounded-sm bg-[#06b6d4] border border-gray-900"></div>
										<code class="font-mono font-black text-gray-900">avatar_url</code>
										<span class="ml-auto text-[9px] text-gray-500 font-bold uppercase">image</span>
									</div>
									<div class="text-[9px] text-gray-500 pl-3.5 font-mono">→ Image layer · .src</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- API request card -->
				<div class="bg-[#282c34] rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#4ade80] overflow-hidden flex flex-col">
					<div class="bg-[#21252b] px-4 py-3 border-b-[3px] border-gray-900 flex items-center gap-2">
						<div class="w-3.5 h-3.5 rounded-full bg-[#ff5f56] border border-black/40"></div>
						<div class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] border border-black/40"></div>
						<div class="w-3.5 h-3.5 rounded-full bg-[#27c93f] border border-black/40"></div>
						<span class="ml-3 text-xs text-[#4ade80] font-mono font-bold uppercase tracking-wider">render.sh</span>
						<span class="ml-auto text-[10px] text-gray-500 font-mono font-bold uppercase tracking-widest">Your backend</span>
					</div>
					<pre class="p-6 overflow-x-auto text-sm text-gray-300 leading-relaxed flex-1"><code>{`curl -X POST \\
  https://api.pictify.io/template/tpl_abc/render \\
  -H "Authorization: Bearer $PICTIFY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "variables": {
      "product":    "Pro plan",
      "price":      49,
      "featured":   true,
      "avatar_url": "https://cdn.you.com/a.png"
    }
  }'

# → { "image": { "url": "https://cdn.pictify.io/..." } }`}</code></pre>
				</div>
			</div>

			<!-- The punchline: logic lives on layers, not in your code -->
			<div class="bg-white border-[3px] border-gray-900 rounded-2xl p-6 md:p-8 shadow-[6px_6px_0_0_#1f2937]">
				<div class="flex flex-col md:flex-row items-start gap-5">
					<div class="flex-shrink-0 w-14 h-14 bg-[#4ade80] border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937]">
						<svg class="w-7 h-7 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</div>
					<div class="flex-1">
						<div class="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">The payoff</div>
						<p class="text-lg text-gray-700 font-medium leading-relaxed">
							Each layer carries its own binding. The <code class="bg-gray-900 px-2 py-0.5 rounded text-[#4ade80] font-mono">price</code> text layer runs the <code class="bg-gray-900 px-2 py-0.5 rounded text-[#ffc480] font-mono">| currency</code> filter on render — <code class="bg-gray-900 px-2 py-0.5 rounded text-[#4ade80] font-mono">49</code> becomes <code class="bg-gray-900 px-2 py-0.5 rounded text-[#4ade80] font-mono">$49.00</code>. The "New" badge has a <code class="bg-gray-900 px-2 py-0.5 rounded text-[#a78bfa] font-mono">showWhen: featured</code> rule, so it appears only when the flag is true. In Pictify, logic lives with the design. In Bannerbear, Placid, and RenderForm, it lives scattered across your app code.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<SectionSeparator icon="star" />

	<!-- FAQ with aesthetic accordion -->
	<section class="py-24 px-4 bg-[#FFFDF8] border-b-[3px] border-gray-900 relative">
		<div class="max-w-4xl mx-auto">
			<div class="text-center mb-12">
				<div
					class="inline-block px-4 py-1.5 bg-[#4ade80] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform rotate-2"
				>
					<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Questions?</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
					Questions, answered.
				</h2>
			</div>

			<div class="space-y-4">
				{#each faqs as faq, i}
					<details
						class="group bg-white border-[3px] border-gray-900 rounded-2xl shadow-[4px_4px_0_0_#1f2937] overflow-hidden open:shadow-[8px_8px_0_0_#1f2937] open:-translate-y-1 transition-all duration-200"
						in:fly={{ y: 10, duration: 300, delay: i * 40 }}
					>
						<summary
							class="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-gray-50 transition-colors"
						>
							<span class="font-black text-lg text-gray-900 pr-6">{faq.q}</span>
							<span
								class="flex-shrink-0 w-8 h-8 rounded-lg border-[2px] border-gray-900 bg-[#ffc480] flex items-center justify-center font-black text-xl text-gray-900 group-open:rotate-45 transition-transform duration-200"
							>+</span>
						</summary>
						<div class="px-5 pb-5 pt-0 border-t-2 border-gray-100">
							<p class="text-gray-700 leading-relaxed pt-4">{faq.a}</p>
						</div>
					</details>
				{/each}
			</div>
		</div>
	</section>

	<svelte:fragment slot="after-faq">
		<SectionSeparator icon="bolt" />
		<SolutionClosingCta toolName="automated_image_generation_pillar" isPillar={true} />

		<div class="mt-16 md:mt-24">
			<SectionSeparator icon="arrow" />
		</div>

		<!-- Related solutions — aesthetic cards, not generic "Explore cluster" -->
		<section class="py-24 px-4 relative">
			<div class="max-w-6xl mx-auto relative z-10">
				<div class="text-center mb-14">
					<div
						class="inline-block px-4 py-1.5 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform -rotate-2"
					>
						<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Go deeper</span>
					</div>
					<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
						Pick your use case
					</h2>
					<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
						Every workflow below ships on the same API — with code, real examples, and a how-to.
					</p>
				</div>

				<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
					{#each related as r, i}
						{@const colors = ['bg-[#ff6b6b]', 'bg-[#4ade80]', 'bg-[#ffc480]', 'bg-[#a78bfa]', 'bg-[#06b6d4]', 'bg-[#ec4899]']}
						{@const rotations = ['-rotate-1', 'rotate-1', '-rotate-1', 'rotate-1', '-rotate-1', 'rotate-1']}
						<a
							href="/solutions/{r.slug}"
							class="group bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_0_#1f2937] hover:shadow-[10px_10px_0_0_#1f2937] hover:-translate-y-2 transition-all duration-300 overflow-hidden {rotations[i % rotations.length]}"
							in:fly={{ y: 20, duration: 400, delay: i * 60 }}
						>
							<div class="{colors[i % colors.length]} h-2 border-b-[3px] border-gray-900"></div>
							<div class="p-6">
								<h3 class="font-black text-gray-900 mb-2 text-lg leading-tight group-hover:text-[#ff6b6b] transition-colors">
									{r.label}
								</h3>
								<p class="text-sm text-gray-600 leading-relaxed mb-4">{r.summary}</p>
								<div class="text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-900 transition-colors inline-flex items-center gap-1.5">
									Read the guide
									<svg class="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
									</svg>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</div>
		</section>
	</svelte:fragment>
</SolutionPageShell>
