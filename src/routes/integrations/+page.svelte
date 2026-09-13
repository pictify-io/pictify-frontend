<script>
	/**
	 * /integrations — the index, on the v2 system.
	 *
	 * Grouped by `integrationCategories`, one ledger row per integration (the
	 * tools-hub row anatomy: mark · name · meta · one line · arrow), then the
	 * "bring your own" rows that point at the docs so five integrations don't
	 * read as the whole story.
	 *
	 * Frozen for search: the <head>, and the outline — H1 "Connect Pictify to
	 * Your Stack", one H2 "{category} Integrations" per category that has
	 * entries, one H3 per integration, H2 "Build Custom Integrations". The
	 * bring-your-own rows and the closing line are not headings, because the
	 * live page has none there.
	 */
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import PixelCluster from '$lib/components/landing/PixelCluster.svelte';
	import BrandMark from '$lib/components/landing/BrandMark.svelte';
	import { HERO_CLUSTER } from '$lib/components/landing/hero-clusters.js';
	import { integrations, integrationCategories } from '$lib/pseo/config.js';
	import { analytics } from '$lib/telemetry.js';

	const title = 'Integrations | Connect Pictify to Your Stack | Pictify';
	const description =
		'Integrate Pictify with Zapier, Make, Next.js, WordPress, Shopify, and more. Generate images automatically from your favorite tools.';
	const canonical = 'https://pictify.io/integrations';

	// Group integrations by category
	$: groupedIntegrations = integrationCategories
		.map((cat) => ({
			...cat,
			items: integrations.filter((i) => i.category === cat.id)
		}))
		.filter((cat) => cat.items.length > 0);

	/** "10 minutes" → "10 MIN SETUP · 6 STEPS" */
	function metaFor(integration) {
		const time = integration.tutorial?.estimatedTime || '';
		const steps = integration.tutorial?.steps?.length || 0;
		return [
			time ? `${time.replace(/minutes?/i, 'MIN').toUpperCase()} SETUP` : null,
			steps ? `${steps} STEPS` : null
		]
			.filter(Boolean)
			.join(' · ');
	}

	/** Anything that is not a named integration talks to the same API. */
	const bringYourOwn = [
		{
			badge: 'API',
			name: 'REST API',
			meta: 'POST A TEMPLATE, GET A URL',
			line: 'One call from anything that sends JSON: a template and its variables in, a CDN link out.',
			href: 'https://docs.pictify.io/api-reference/overview'
		},
		{
			badge: 'SDK',
			name: 'SDKs',
			meta: 'NODE · PYTHON',
			line: 'Official packages, so you are not writing a fetch wrapper on day one.',
			href: 'https://docs.pictify.io/sdks/nodejs'
		},
		{
			badge: 'MCP',
			name: 'MCP server',
			meta: 'CLAUDE · CURSOR · ANY MCP CLIENT',
			line: 'Hand it to an agent: enough tools to author a template and render it.',
			href: 'https://docs.pictify.io/agent-integration/mcp-server'
		}
	];

	function track(target) {
		analytics.track('integration_index_click', { target });
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta
		name="keywords"
		content="pictify integrations, zapier integration, make integration, nextjs image generation, wordpress og images, shopify product images"
	/>

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://pictify.io/og/v2/integrations.png" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="https://pictify.io/og/v2/integrations.png" />
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
		<div class="relative mx-auto flex w-full max-w-page flex-col gap-3 px-5 py-12 lg:px-10 lg:py-16">
			<p class="font-mono text-[11px] tracking-[0.06em] text-brand-royal">
				INTEGRATIONS <span class="text-brand-mute">·</span>
				<span class="text-brand-ink">{integrations.length} CONNECTED</span>
			</p>

			<h1
				class="max-w-[16ch] font-display text-[40px] font-extrabold leading-[1.02] tracking-[-0.02em] text-brand-ink lg:text-[56px] lg:leading-[60px]"
			>
				Connect Pictify to <br />
				<span>Your Stack</span>
			</h1>

			<p
				class="max-w-[640px] font-sans text-base leading-[25px] text-[#2A2C1E] lg:text-lg lg:leading-[27px]"
			>
				Connect Pictify to your favorite tools. Automate image generation, sync templates, and
				stream events without writing a single line of code.
			</p>
		</div>
	</section>

	<main class="w-full pb-4">
		{#each groupedIntegrations as category, c (category.id)}
			<section class="mx-auto w-full max-w-page px-5 pt-14 lg:px-10">
				<div
					class="flex flex-col gap-2 border-t-2 border-brand-ink pt-8 lg:flex-row lg:items-baseline lg:justify-between lg:gap-10"
				>
					<div class="flex items-baseline gap-3">
						<span class="font-mono text-xs tracking-[0.06em] text-brand-blue"
							>{String(c + 1).padStart(2, '0')}</span
						>
						<h2
							class="font-display text-[26px] font-bold leading-8 tracking-[-0.02em] text-brand-ink lg:text-[32px] lg:leading-[42px]"
						>
							{category.label} Integrations
						</h2>
					</div>
					<p class="font-sans text-[15px] leading-[23px] text-brand-slate lg:max-w-[420px] lg:text-right">
						{category.description}
					</p>
				</div>

				<div class="mt-4 flex flex-col">
					{#each category.items as integration (integration.slug)}
						<a
							href="/integrations/{integration.slug}"
							on:click={() => track(integration.slug)}
							class="group flex items-center gap-3.5 border-b border-brand-rule py-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-royal"
						>
							<span
								class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-brand-ink bg-brand-paper"
								aria-hidden="true"
							>
								<BrandMark mark={integration.icon} size={20} />
							</span>
							<span class="flex min-w-0 flex-col gap-[3px] sm:w-[300px] sm:flex-shrink-0">
								<h3
									class="truncate font-sans text-[16px] font-semibold leading-5 text-brand-ink group-hover:underline"
								>
									{integration.name}
								</h3>
								<span class="truncate font-mono text-[11px] tracking-[0.06em] text-brand-mute"
									>{metaFor(integration)}</span
								>
							</span>
							<span
								class="hidden min-w-0 flex-1 font-sans text-sm leading-[18px] text-brand-slate sm:block"
								>{integration.description}</span
							>
							<span
								class="ml-auto flex-shrink-0 font-mono text-[12px] text-brand-mute group-hover:text-brand-ink sm:ml-0"
								aria-hidden="true">→</span
							>
						</a>
					{/each}
				</div>
			</section>
		{/each}

		<!-- ── Bring your own ────────────────────────────────────────── -->
		<section class="mx-auto w-full max-w-page px-5 pt-14 lg:px-10">
			<div
				class="flex flex-col gap-2 border-t-2 border-brand-ink pt-8 lg:flex-row lg:items-baseline lg:justify-between lg:gap-10"
			>
				<div class="flex items-baseline gap-3">
					<span class="font-mono text-xs tracking-[0.06em] text-brand-blue"
						>{String(groupedIntegrations.length + 1).padStart(2, '0')}</span
					>
					<h2
						class="font-display text-[26px] font-bold leading-8 tracking-[-0.02em] text-brand-ink lg:text-[32px] lg:leading-[42px]"
					>
						Build Custom Integrations
					</h2>
				</div>
				<p class="font-mono text-xs tracking-[0.06em] text-brand-mute">BRING YOUR OWN</p>
			</div>

			<div class="mt-4 flex flex-col">
				{#each bringYourOwn as row (row.name)}
					<a
						href={row.href}
						target="_blank"
						rel="noopener"
						on:click={() => track(row.href)}
						class="group flex items-center gap-3.5 border-b border-brand-rule py-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-royal"
					>
						<span
							class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-brand-ink bg-brand-ink font-mono text-[10px] font-bold tracking-[0.06em] text-brand-field"
							aria-hidden="true">{row.badge}</span
						>
						<span class="flex min-w-0 flex-col gap-[3px] sm:w-[300px] sm:flex-shrink-0">
							<span
								class="truncate font-sans text-[16px] font-semibold leading-5 text-brand-ink group-hover:underline"
								>{row.name}</span
							>
							<span class="truncate font-mono text-[11px] tracking-[0.06em] text-brand-mute"
								>{row.meta}</span
							>
						</span>
						<span
							class="hidden min-w-0 flex-1 font-sans text-sm leading-[18px] text-brand-slate sm:block"
							>{row.line}</span
						>
						<span
							class="ml-auto flex-shrink-0 font-mono text-[12px] text-brand-mute group-hover:text-brand-ink sm:ml-0"
							aria-hidden="true">↗</span
						>
					</a>
				{/each}
			</div>
		</section>
	</main>

	<!-- ── Closing band ──────────────────────────────────────────────── -->
	<section class="mt-16 w-full bg-brand-press-deep px-5 py-14 lg:px-10 lg:py-20">
		<div
			class="mx-auto flex w-full max-w-page flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
		>
			<div class="flex flex-col gap-3.5 lg:max-w-[640px]">
				<p class="font-mono text-xs tracking-[0.06em] text-brand-field">ONE API KEY COVERS ALL OF THEM</p>
				<p
					class="font-display text-[32px] font-bold leading-[1.08] tracking-[-0.02em] text-white lg:text-[44px] lg:leading-[50px]"
				>
					Anything that can fill a template.
				</p>
			</div>

			<div class="flex flex-col items-start gap-2.5 lg:items-end">
				<a
					href="/signup?redirect=%2Fintegrations"
					class="w-max rounded-lg bg-brand-field px-7 py-4 font-sans text-base font-semibold text-brand-ink shadow-[3px_3px_0_0_#FF48B0] transition-opacity hover:opacity-90"
				>
					Start on Free
				</a>
				<a
					href="https://docs.pictify.io"
					target="_blank"
					rel="noopener"
					class="font-mono text-[11px] tracking-[0.06em] text-brand-press-text hover:underline"
				>
					OR READ THE DOCS →
				</a>
			</div>
		</div>
	</section>

	<Footer />
</div>
