<script>
	/**
	 * /alternatives — the shelf of comparisons.
	 *
	 * Data is Sanity-first (see +page.js); comparisons.js is the fallback. The
	 * headings are the live ones and stay byte-identical: the H1, "Why Teams
	 * Switch to Pictify", "Explore Alternatives", "Also See", "Ready to
	 * Switch?", and one "{Competitor} Alternative" per card.
	 */
	import { HERO_CLUSTER } from '$lib/components/landing/hero-clusters.js';
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import PixelCluster from '$lib/components/landing/PixelCluster.svelte';
	import { brandIcons } from '$lib/config/brandIcons.js';

	export let data;
	$: alternatives = data.alternatives;

	const title = 'Pictify Alternatives | Switch to Better Image Generation';
	const description =
		'Looking for an alternative to Cloudinary, Puppeteer, or other image tools? See how Pictify compares and why teams are switching.';
	const canonical = 'https://pictify.io/alternatives';

	/** The four reasons keep their live headings; only the chrome is new. */
	const REASONS = [
		{
			title: 'Faster Setup',
			body: 'Generate images in minutes, not days',
			tint: 'bg-brand-powder'
		},
		{
			title: 'Better Pricing',
			body: 'Pay by the render, with a free tier',
			tint: 'bg-brand-field'
		},
		{
			title: 'Full HTML Control',
			body: 'Real HTML and CSS, not a constrained canvas',
			tint: 'bg-brand-rose'
		},
		{
			title: 'No Infrastructure',
			body: 'No browsers to run or keep alive',
			tint: 'bg-brand-subtle'
		}
	];
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta
		name="keywords"
		content="pictify alternative, cloudinary alternative, puppeteer alternative, html to image alternative, image generation api"
	/>

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Pictify" />
	<meta property="og:image" content="https://pictify.io/og/v2/alternatives.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Pictify alternatives: 34 tools compared" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="https://pictify.io/og/v2/alternatives.png" />
	<meta name="twitter:image:alt" content="Pictify alternatives: 34 tools compared" />
</svelte:head>

<div class="landing-v2 flex min-h-screen w-full flex-col bg-brand-canvas">
	<Nav />

	<!-- ── Hero ──────────────────────────────────────────────────────── -->
	<section class="relative w-full overflow-hidden bg-brand-field">
		<PixelCluster
			cells={HERO_CLUSTER}
			cell={22}
			origin="e"
			delay={320}
			cycle={3}
			class="right-0 top-6 hidden lg:block"
		/>
		<div
			class="relative mx-auto flex w-full max-w-page flex-col gap-3 px-5 py-12 lg:px-10 lg:py-16"
		>
			<p class="font-mono text-[11px] tracking-[0.06em] text-brand-royal">
				ALTERNATIVES <span class="text-brand-mute">·</span>
				<span class="text-brand-ink">{alternatives.length} COMPARED</span>
			</p>

			<h1
				class="max-w-[16ch] font-display text-[40px] font-extrabold leading-[1.02] tracking-[-0.02em] text-brand-ink lg:text-[56px] lg:leading-[60px]"
			>
				Pictify as Your
				<span>Alternative</span>
			</h1>

			<p
				class="max-w-[680px] font-sans text-base leading-[25px] text-[#2A2C1E] lg:text-lg lg:leading-[27px]"
			>
				Pictify is a programmatic media generation platform: HTML-native templates render images
				(PNG, JPG, WebP), multi-page PDFs, GIFs, and personalized video from your data, from an API
				call, a CSV row or a webhook — each render coming back as a CDN link your own system can
				fetch. Below are honest side-by-side comparisons with Bannerbear, htmlcsstoimage, Placid,
				Certifier, Canva Bulk Create, and {alternatives.length - 5}+ other tools, including where
				each of them still wins.
			</p>
		</div>
	</section>

	<main class="w-full">
		<!-- ── Why teams switch ──────────────────────────────────────── -->
		<section class="mx-auto w-full max-w-page px-5 pt-14 lg:px-10">
			<div class="flex items-baseline gap-3 border-t-2 border-brand-ink pt-8">
				<span class="font-mono text-xs tracking-[0.06em] text-brand-blue">01</span>
				<h2
					class="font-display text-[26px] font-bold leading-8 tracking-[-0.02em] text-brand-ink lg:text-[32px] lg:leading-[42px]"
				>
					Why Teams Switch to Pictify
				</h2>
			</div>

			<div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 min-[1200px]:grid-cols-4">
				{#each REASONS as reason (reason.title)}
					<div class="flex flex-col gap-2 border border-brand-ink {reason.tint} px-5 py-4">
						<span class="h-2.5 w-2.5 bg-brand-ink" aria-hidden="true" />
						<h3 class="font-sans text-base font-semibold leading-5 text-brand-ink">
							{reason.title}
						</h3>
						<p class="font-sans text-sm leading-5 text-brand-ink/80">{reason.body}</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- ── The shelf ─────────────────────────────────────────────── -->
		<section class="mx-auto w-full max-w-page px-5 pt-14 lg:px-10">
			<div class="flex items-baseline gap-3 border-t-2 border-brand-ink pt-8">
				<span class="font-mono text-xs tracking-[0.06em] text-brand-blue">02</span>
				<h2
					class="font-display text-[26px] font-bold leading-8 tracking-[-0.02em] text-brand-ink lg:text-[32px] lg:leading-[42px]"
				>
					Explore Alternatives
				</h2>
			</div>

			<div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 min-[1200px]:grid-cols-4">
				{#each alternatives as alt (alt.slug)}
					{@const icon = brandIcons[alt.slug] || brandIcons.default}
					<a
						href={`/alternatives/${alt.slug}`}
						class="group flex flex-col gap-2 rounded-card border-[1.5px] border-brand-ink bg-brand-paper p-5 transition-[transform,box-shadow] duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_0_#000000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-royal motion-reduce:transition-none"
					>
						<span class="flex items-center gap-2">
							{#if icon.type === 'url'}
								<img loading="lazy" src={icon.url} alt="" aria-hidden="true" class="h-4 w-4" />
							{:else if icon.type === 'text'}
								<span class="font-mono text-[10px] leading-none" style="color: {icon.color}"
									>{icon.text}</span
								>
							{:else}
								<span class="h-2.5 w-2.5 border border-brand-ink" aria-hidden="true" />
							{/if}
							<span class="font-mono text-[10px] tracking-[0.06em] text-brand-mute">PICTIFY VS</span
							>
						</span>

						<h3
							class="font-display text-[19px] font-bold leading-6 tracking-[-0.015em] text-brand-ink group-hover:underline"
						>
							{alt.competitor} Alternative
						</h3>

						{#if alt.comparison?.competitorDescription}
							<p class="font-sans text-sm leading-5 text-brand-slate">
								{alt.comparison.competitorDescription}
							</p>
						{/if}
					</a>
				{/each}
			</div>
		</section>

		<!-- ── Also see ──────────────────────────────────────────────── -->
		<section class="mx-auto w-full max-w-page px-5 pt-14 lg:px-10">
			<h2 class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">Also See</h2>
			<div class="mt-4 flex flex-wrap gap-3">
				<a
					href="/pricing"
					class="rounded-lg border-[1.5px] border-brand-ink px-5 py-2.5 font-sans text-[15px] font-semibold text-brand-ink transition-colors hover:bg-brand-subtle"
				>
					Pricing
				</a>
				<a
					href="/tools"
					class="rounded-lg border-[1.5px] border-brand-ink px-5 py-2.5 font-sans text-[15px] font-semibold text-brand-ink transition-colors hover:bg-brand-subtle"
				>
					Free Tools
				</a>
			</div>
		</section>
	</main>

	<!-- ── Closing band ──────────────────────────────────────────────── -->
	<section class="mt-16 w-full bg-brand-press-deep px-5 py-14 lg:px-10 lg:py-20">
		<div
			class="mx-auto flex w-full max-w-page flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
		>
			<div class="flex flex-col gap-3.5 lg:max-w-[640px]">
				<p class="font-mono text-xs tracking-[0.06em] text-brand-field">
					SAME HTML IN. BETTER THINGS OUT.
				</p>
				<h2
					class="font-display text-[32px] font-bold leading-[1.08] tracking-[-0.02em] text-white lg:text-[44px] lg:leading-[50px]"
				>
					Ready to Switch?
				</h2>
				<p class="font-sans text-base leading-[25px] text-brand-press-text">
					Start generating images in minutes. Free tier available, no credit card required.
				</p>
			</div>

			<a
				href="/signup"
				class="w-max rounded-lg bg-brand-field px-7 py-4 font-sans text-base font-semibold text-brand-ink shadow-[3px_3px_0_0_#FF48B0] transition-opacity hover:opacity-90"
			>
				Get Started Free
			</a>
		</div>
	</section>

	<Footer />
</div>
