<script>
	/**
	 * /tools — the open counter.
	 *
	 * A hub, not a sales page: eighteen tools laid out as a shop counter, each
	 * one a face on the render API. No form in the hero — the work happens on
	 * the tool pages, and this surface's only job is to route.
	 *
	 * Card art is hand-built SVG exported from the design file to
	 * static/landing/tools/<slug>.svg. It is decoration, never content, so it
	 * ships as an aria-hidden <img> with an empty alt.
	 */
	import { TOOL_CARDS } from '$lib/pseo/tool-cards.js';
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';

	// The two wedge tools. They carry a colour-offset shadow and a full-height
	// art pane; nothing else on the page does.
	/**
	 * Title, mono meta line, art path and structured-data sentence come from the
	 * shared registry; only what is specific to a hub card — the badge and the
	 * coloured shadow — lives here. The wedge cards render `desc` as their blurb,
	 * which is the same string the ItemList carries, so the two cannot drift.
	 */
	const wedge = [
		{
			...TOOL_CARDS['csv-to-pdf'],
			badge: 'MOST USED',
			badgeClass: 'bg-brand-field',
			// Literal shadow classes: Tailwind scans this file as text, so the
			// utilities have to appear spelled out somewhere in it.
			shadow: 'shadow-[4px_4px_0_0_#0054A6] hover:shadow-[6px_6px_0_0_#0054A6]'
		},
		{
			...TOOL_CARDS['certificate-generator'],
			badge: 'BATCH READY',
			badgeClass: 'bg-brand-powder',
			shadow: 'shadow-[4px_4px_0_0_#FF48B0] hover:shadow-[6px_6px_0_0_#FF48B0]'
		}
	];

	// Four labelled shelves, four tools each. `desc` is not rendered — it is the
	// description carried into the ItemList structured data.
	// Four labelled shelves, four tools each, by registry slug.
	const sections = [
		{ label: 'MARKUP → IMAGE', tools: ['html-to-image', 'code-to-image', 'markdown', 'table'] },
		{
			label: 'SOCIAL & OG',
			tools: [
				'og-image-generator',
				'tweet-screenshot',
				'linkedin-banner-generator',
				'social-proof-card'
			]
		},
		{
			label: 'CAPTURE & DOCUMENTS',
			tools: [
				'url-to-image-generator',
				'online-invoice-generator',
				'email-header',
				'barcode-generator'
			]
		},
		{
			label: 'WIDGETS & CARDS',
			tools: ['badge', 'leaderboard', 'membership-card', 'portfolio-card']
		}
	].map((section) => ({ ...section, tools: section.tools.map((slug) => TOOL_CARDS[slug]) }));

	const allTools = [
		...wedge.map((t) => ({ name: t.title, url: t.href, description: t.desc })),
		...sections.flatMap((s) =>
			s.tools.map((t) => ({ name: t.title, url: t.href, description: t.desc }))
		)
	];

	const itemListStructuredData = {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: 'Pictify.io free tools',
		description:
			'Free browser tools built on the Pictify render API: spreadsheets to PDF, HTML and markdown to image, screenshots, certificates, badges and cards.',
		itemListElement: allTools.map((tool, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			item: {
				'@type': 'WebApplication',
				name: tool.name,
				url: `https://pictify.io${tool.url}`,
				description: tool.description,
				applicationCategory: 'DesignApplication',
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
			}
		}))
	};

	// Whole-card link. Shared by both card shapes so the lift, the focus ring
	// and the ink border stay in step.
	const cardBase =
		'group block overflow-hidden rounded-tile border border-brand-ink bg-brand-paper transition-[transform,box-shadow] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-royal motion-reduce:transition-none';
</script>

<svelte:head>
	<title>Free tools: render images, PDFs and cards | Pictify.io</title>
	<meta
		name="description"
		content="Eighteen free tools built on the Pictify render API. Spreadsheets to PDF, HTML and markdown to image, screenshots, certificates, badges and cards. No signup to try."
	/>
	<meta
		name="keywords"
		content="free tools, CSV to PDF, certificate generator, HTML to image, OG image generator, screenshot API, Pictify.io"
	/>
	<link rel="canonical" href="https://pictify.io/tools" />
	<meta property="og:title" content="Free tools: render images, PDFs and cards | Pictify.io" />
	<meta
		property="og:description"
		content="Eighteen free tools built on the Pictify render API. Every one of them is one API call underneath."
	/>
	<meta property="og:image" content="https://media.pictify.io/qyl7z-1775406830860.png" />
	<meta property="og:url" content="https://pictify.io/tools" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="https://media.pictify.io/qyl7z-1775406830860.png" />
	{@html `<script type="application/ld+json">${JSON.stringify(itemListStructuredData)}</script>`}
</svelte:head>

<!-- .landing-v2 opts this page out of the app-wide root font-size down-scale (see app.css),
     so the rem-based rhythm lands on the 16px root the board was drawn against. -->
<div class="landing-v2 flex min-h-screen w-full flex-col bg-brand-canvas">
	<Nav />

	<!-- ── Hero ──────────────────────────────────────────────────────── -->
	<section class="relative w-full overflow-hidden bg-brand-field">
		<div
			class="relative mx-auto flex w-full max-w-page flex-col gap-[18px] px-5 py-12 lg:px-10 lg:py-[72px]"
		>
			<span class="font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-brand-ink">
				Open counter · No signup
			</span>
			<h1
				class="font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.02em] text-brand-ink lg:text-[72px] lg:leading-[74px]"
			>
				Free tools
			</h1>
			<p
				class="max-w-[620px] font-sans text-[17px] leading-[26px] text-[#2A2C1E] lg:text-[19px] lg:leading-[28px]"
			>
				Every tool here is the Pictify render API with a face on it. Five free renders a day, no
				account, and the files are yours.
			</p>

			<!--
				Print-shop deco: two riso pills, a stamped tool mark, and a CMYK
				registration run. Decorative only, so it is hidden from assistive
				tech and dropped below the desktop column where it would collide
				with the copy.
			-->
			<div aria-hidden="true" class="pointer-events-none absolute inset-0 hidden lg:block">
				<div
					class="absolute right-[70px] top-16 h-[52px] w-[210px] -rotate-[14deg] rounded-full bg-brand-sky"
				/>
				<div
					class="absolute right-[30px] top-[130px] h-[44px] w-[150px] -rotate-[14deg] rounded-full bg-brand-royal"
				/>
				<div
					class="absolute right-4 top-11 flex h-11 w-11 rotate-[8deg] items-center justify-center rounded-full border-[1.5px] border-brand-ink bg-brand-paper font-mono text-[13px] font-bold text-brand-ink"
				>
					⚒
				</div>
				<div class="absolute bottom-[26px] right-[340px] flex gap-[7px]">
					<span class="h-[10px] w-[10px] bg-brand-blue" />
					<span class="h-[10px] w-[10px] bg-brand-ink" />
					<span class="h-[10px] w-[10px] bg-brand-pink" />
				</div>
			</div>
		</div>
	</section>

	<main class="w-full">
		<!-- ── Wedge row ─────────────────────────────────────────────── -->
		<div class="mx-auto w-full max-w-page px-5 pt-8 lg:px-10 lg:pt-12">
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{#each wedge as tool (tool.href)}
					<a
						href={tool.href}
						class="{cardBase} {tool.shadow} flex flex-col-reverse rounded-card hover:-translate-x-[2px] hover:-translate-y-[2px] lg:flex-row"
					>
						<div class="flex flex-1 flex-col gap-2.5 px-[30px] py-7">
							<span
								class="{tool.badgeClass} self-start rounded-full border border-brand-ink px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-[12px] tracking-[0.06em] text-brand-ink"
							>
								{tool.badge}
							</span>
							<h2
								class="font-display text-[26px] font-extrabold leading-[31px] tracking-[-0.015em] text-brand-ink group-hover:underline"
							>
								{tool.title}
							</h2>
							<p class="font-sans text-sm leading-[21px] text-brand-slate">{tool.desc}</p>
							<span class="font-mono text-[11px] leading-[14px] tracking-[0.04em] text-brand-mute"
								>{tool.meta}</span
							>
						</div>
						<div
							class="flex-shrink-0 overflow-hidden border-b border-brand-ink lg:w-[190px] lg:border-b-0 lg:border-l"
						>
							<img
								src={tool.art}
								alt=""
								aria-hidden="true"
								loading="lazy"
								class="h-[140px] w-full object-cover lg:h-full"
							/>
						</div>
					</a>
				{/each}
			</div>
		</div>

		<!-- ── Shelves ───────────────────────────────────────────────── -->
		{#each sections as section (section.label)}
			<section class="mx-auto w-full max-w-page px-5 pt-10 lg:px-10 lg:pt-11">
				<h2
					class="font-mono text-[11px] font-bold uppercase leading-[14px] tracking-[0.08em] text-brand-ink"
				>
					{section.label}
				</h2>
				<div class="mt-3.5 grid grid-cols-1 gap-4 md:grid-cols-2 min-[1200px]:grid-cols-4">
					{#each section.tools as tool (tool.href)}
						<a
							href={tool.href}
							class="{cardBase} hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_0_#000000]"
						>
							<div class="overflow-hidden border-b border-brand-ink">
								<img
									src={tool.art}
									alt=""
									aria-hidden="true"
									loading="lazy"
									class="h-[116px] w-full object-cover"
								/>
							</div>
							<div class="flex flex-col gap-[3px] px-4 py-3.5">
								<h3
									class="font-display text-[17px] font-bold leading-[22px] text-brand-ink group-hover:underline"
								>
									{tool.title}
								</h3>
								<span class="font-mono text-[10px] leading-[12px] tracking-[0.04em] text-brand-mute"
									>{tool.meta}</span
								>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/each}

		<!-- ── Closing CTA ───────────────────────────────────────────── -->
		<div class="mx-auto w-full max-w-page px-5 pt-16 lg:px-10 lg:pt-28">
			<div
				class="relative mx-auto flex max-w-[960px] flex-col items-start gap-6 overflow-hidden rounded-card border border-brand-ink bg-brand-paper px-6 py-7 shadow-[4px_4px_0_0_#0054A6] lg:flex-row lg:items-center lg:justify-between lg:py-7 lg:pl-11 lg:pr-9"
			>
				<div class="flex max-w-[420px] flex-col gap-1.5">
					<h2
						class="font-display text-[26px] font-extrabold leading-[32px] tracking-[-0.015em] text-brand-ink lg:text-[28px] lg:leading-[34px]"
					>
						This, but on autopilot.
					</h2>
					<p class="font-sans text-[15px] leading-[22px] text-brand-slate">
						Every tool on this page is one API call. Free tier: 50 renders a month, no card, no
						watermark.
					</p>
				</div>

				<div class="flex flex-shrink-0 flex-wrap items-center gap-2.5">
					<a
						href="/signup"
						class="flex h-12 items-center whitespace-nowrap rounded-lg bg-brand-ink px-[22px] font-sans text-[15px] font-semibold text-white shadow-[2px_2px_0_0_#FF48B0] transition-opacity hover:opacity-90"
					>
						Start rendering
					</a>
					<a
						href="/docs"
						class="flex h-12 items-center whitespace-nowrap rounded-lg border border-brand-ink bg-brand-paper px-[22px] font-sans text-[15px] font-semibold text-brand-ink transition-colors hover:bg-brand-subtle"
					>
						Read the docs
					</a>
				</div>

				<!-- The stack: one PDF, one PNG, one MP4, fanned like proofs off a press. -->
				<div
					aria-hidden="true"
					class="hidden flex-shrink-0 items-center justify-center lg:flex lg:w-[230px]"
				>
					<svg
						width="220"
						height="170"
						viewBox="0 0 220 170"
						xmlns="http://www.w3.org/2000/svg"
						class="-my-2.5 flex-shrink-0"
					>
						<g transform="rotate(-7 60 96)">
							<rect
								x="18"
								y="46"
								width="88"
								height="104"
								rx="6"
								fill="#FFD3E8"
								stroke="#000000"
								stroke-width="1.5"
							/>
							<rect x="28" y="58" width="46" height="8" rx="2" fill="#000000" />
							<rect x="28" y="74" width="66" height="4" rx="2" fill="rgb(0 0 0 / 45%)" />
							<rect x="28" y="83" width="58" height="4" rx="2" fill="rgb(0 0 0 / 45%)" />
							<rect x="28" y="122" width="34" height="14" rx="7" fill="#000000" />
							<text
								x="34"
								y="132"
								font-family="JetBrains Mono, ui-monospace, monospace"
								font-size="9"
								font-weight="700"
								fill="#FFD3E8">PDF</text
							>
						</g>
						<g transform="rotate(3 118 90)">
							<rect
								x="72"
								y="30"
								width="92"
								height="112"
								rx="6"
								fill="#FFFFFF"
								stroke="#000000"
								stroke-width="1.5"
							/>
							<rect x="82" y="40" width="72" height="52" rx="4" fill="#0078BF" />
							<rect x="90" y="56" width="38" height="9" rx="2" fill="#FFFFFF" />
							<rect x="90" y="70" width="26" height="5" rx="2" fill="#A9D7F2" />
							<rect x="82" y="102" width="52" height="5" rx="2" fill="rgb(0 0 0 / 45%)" />
							<rect x="82" y="120" width="34" height="14" rx="7" fill="#000000" />
							<text
								x="88"
								y="130"
								font-family="JetBrains Mono, ui-monospace, monospace"
								font-size="9"
								font-weight="700"
								fill="#D8F34A">PNG</text
							>
						</g>
						<g transform="rotate(12 172 92)">
							<rect
								x="132"
								y="44"
								width="76"
								height="98"
								rx="6"
								fill="#131417"
								stroke="#000000"
								stroke-width="1.5"
							/>
							<circle cx="170" cy="82" r="17" fill="#D8F34A" stroke="#000000" stroke-width="1.5" />
							<path d="M165 74l12 8-12 8v-16z" fill="#131417" />
							<rect x="142" y="114" width="34" height="14" rx="7" fill="#D8F34A" />
							<text
								x="147"
								y="124"
								font-family="JetBrains Mono, ui-monospace, monospace"
								font-size="9"
								font-weight="700"
								fill="#131417">MP4</text
							>
						</g>
						<rect x="6" y="20" width="9" height="9" fill="#0078BF" />
						<rect x="15" y="11" width="9" height="9" fill="#000000" />
						<rect x="196" y="18" width="9" height="9" fill="#FF48B0" />
						<rect x="204" y="150" width="9" height="9" fill="#D8F34A" stroke="#000000" />
					</svg>
				</div>

				<!-- Registration marks, cut by the card edges. -->
				<div aria-hidden="true" class="pointer-events-none absolute inset-0 hidden lg:block">
					<div class="absolute left-[340px] top-4 flex gap-1.5">
						<span class="h-[9px] w-[9px] border border-brand-ink bg-brand-field" />
						<span class="h-[9px] w-[9px] border border-brand-ink bg-brand-field opacity-55" />
					</div>
					<div class="absolute bottom-[18px] right-[230px] flex gap-1.5">
						<span class="h-[9px] w-[9px] border border-brand-ink bg-brand-field opacity-40" />
						<span class="h-[9px] w-[9px] border border-brand-ink bg-brand-field" />
						<span class="h-[9px] w-[9px] border border-brand-ink bg-brand-field opacity-70" />
					</div>
				</div>
			</div>
		</div>
	</main>

	<div class="mt-16">
		<Footer />
	</div>
</div>
