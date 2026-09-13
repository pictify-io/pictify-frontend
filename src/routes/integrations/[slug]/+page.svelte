<script>
	/**
	 * /integrations/[slug] — board A62-0 ("Integrations v2 — Zapier"); Make,
	 * n8n, WordPress and Shopify render from the same template with their own
	 * entry in $lib/pseo/integrations.js.
	 *
	 * Frozen for search: the <head> (title, description, canonical, keywords,
	 * OG/Twitter, the SoftwareApplication JSON-LD) and the heading outline —
	 * H1 "{name} + Pictify", H3 "About Integration", H2s "Key Capabilities",
	 * "Common Use Cases", "Integration Guide", "Ready to build with {name}?",
	 * and "Related Integrations" only where the live page has it (same-category
	 * siblings exist). The other pages list the same cards under a mono label
	 * rather than grow a heading they never had.
	 */
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import PixelCluster from '$lib/components/landing/PixelCluster.svelte';
	import BrandMark from '$lib/components/landing/BrandMark.svelte';
	import { HERO_CLUSTER, BASELINE_RUN } from '$lib/components/landing/hero-clusters.js';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { integrations, integrationCategories } from '$lib/pseo/config.js';
	import { analytics } from '$lib/telemetry.js';
	import { user } from '../../../store/user.store';

	$: slug = $page.params.slug;
	$: integration = integrations.find((i) => i.slug === slug);
	$: validIntegration = !!integration;
	$: category = integration
		? integrationCategories.find((c) => c.id === integration.category)
		: null;
	// Redirect if not found
	$: if (browser && !validIntegration && slug) {
		goto('/integrations');
	}

	$: loggedIn = !!$user?.email;

	// Same-category siblings decide whether the live page has the "Related
	// Integrations" H2; the cards themselves show every other integration.
	$: hasRelatedHeading = integration
		? integrations.some((i) => i.category === integration.category && i.slug !== slug)
		: false;
	$: otherIntegrations = integration ? integrations.filter((i) => i.slug !== slug).slice(0, 4) : [];

	// SEO
	$: title = validIntegration
		? `${integration.name} Integration | Pictify`
		: 'Integration | Pictify';
	$: description = validIntegration
		? integration.description
		: 'Integrate Pictify with your tools.';
	$: canonical = validIntegration
		? `https://pictify.io/integrations/${slug}`
		: 'https://pictify.io/integrations';

	// Structured data
	$: structuredData = validIntegration
		? {
				'@context': 'https://schema.org',
				'@type': 'SoftwareApplication',
				name: `Pictify ${integration.name} Integration`,
				description: integration.longDescription,
				url: canonical,
				applicationCategory: 'DesignApplication',
				offers: {
					'@type': 'Offer',
					price: '0',
					priceCurrency: 'USD'
				}
		  }
		: null;

	/** Short brand name for chips and the docs link ("Make (Integromat)" → "Make"). */
	$: shortName = integration ? integration.name.replace(/\s*\(.*\)\s*$/, '') : '';
	$: isNoCode = integration?.category === 'automation';
	$: steps = integration?.tutorial?.steps || [];
	$: estimated = integration?.tutorial?.estimatedTime || '';
	/** "10 minutes" → "10-MINUTE"; anything else is upper-cased as written. */
	$: setupLabel = estimated
		? estimated.replace(/^(\d+)\s*minutes?$/i, '$1-MINUTE').toUpperCase()
		: '';
	$: facts = [
		category?.label?.toUpperCase(),
		isNoCode ? 'NO CODE' : null,
		setupLabel ? `${setupLabel} SETUP` : null
	]
		.filter(Boolean)
		.join(' · ');

	$: signupHref = `/signup?redirect=${encodeURIComponent(`/integrations/${slug}`)}`;

	/** Trigger tile colour by what kind of event starts the recipe. */
	const KIND_TILE = {
		content: 'bg-brand-powder',
		events: 'bg-brand-rose',
		data: 'bg-brand-field',
		commerce: 'bg-brand-sky'
	};

	/** Category label on the related cards, board wording. */
	const CARD_LABEL = { automation: 'AUTOMATION', cms: 'PLATFORM', ecommerce: 'PLATFORM' };

	function trackSignup(location) {
		analytics.track('integration_signup_click', { integration: slug, cta_location: location });
	}

	let copiedStep = null;
	async function copyCode(index, code) {
		try {
			await navigator.clipboard.writeText(code);
			copiedStep = index;
			setTimeout(() => {
				if (copiedStep === index) copiedStep = null;
			}, 1500);
		} catch {
			// Clipboard blocked (insecure context or permission): the code is still selectable.
		}
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta
		name="keywords"
		content="{integration?.name} pictify, {integration?.name} image generation, {integration?.name} og images"
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

	{#if structuredData}
		{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
	{/if}
</svelte:head>

<div class="landing-v2 flex min-h-screen w-full flex-col bg-brand-canvas">
	<Nav />

	{#if validIntegration}
		<!-- ── Hero (AED-0) ─────────────────────────────────────────────── -->
		<section class="relative w-full overflow-hidden bg-brand-field">
			<PixelCluster
				cells={HERO_CLUSTER}
				cell={22}
				origin="e"
				delay={320}
				cycle={3}
				class="right-0 top-6 hidden lg:block"
			/>
			<PixelCluster
				cells={BASELINE_RUN}
				cell={14}
				origin="w"
				delay={520}
				class="-bottom-3 left-[40%] hidden lg:block"
			/>

			<div
				class="relative mx-auto flex w-full max-w-page flex-col gap-3 px-5 pb-14 pt-8 lg:px-10 lg:pb-14 lg:pt-11"
			>
				<nav aria-label="Breadcrumb">
					<ol class="flex flex-wrap items-center gap-2.5 font-mono text-[11px] tracking-[0.06em]">
						<li><a href="/integrations" class="text-brand-royal hover:underline">INTEGRATIONS</a></li>
						<li class="text-brand-mute" aria-hidden="true">·</li>
						<li class="text-brand-ink" aria-current="page">{shortName.toUpperCase()}</li>
					</ol>
				</nav>

				<h1
					class="font-display text-[38px] font-extrabold leading-[1.04] tracking-[-0.02em] text-brand-ink lg:text-[44px] lg:leading-[50px]"
				>
					{integration.name} + Pictify
				</h1>

				<p
					class="max-w-[640px] font-sans text-base leading-[25px] text-[#2A2C1E] lg:text-lg lg:leading-[27px]"
				>
					{integration.description}
				</p>

				{#if facts}
					<p class="mt-1 font-mono text-[11px] tracking-[0.06em] text-brand-ink">{facts}</p>
				{/if}

				<div class="mt-6 flex flex-col gap-6 lg:flex-row">
					<!-- About card (AEP-0) -->
					<div
						class="flex flex-1 flex-col gap-2 rounded-tile border-[1.5px] border-brand-ink bg-brand-paper px-6 py-5 shadow-[4px_4px_0_0_#000000]"
					>
						<h3 class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-blue">
							About Integration
						</h3>
						<p class="font-sans text-base leading-[25px] text-brand-ink">
							{integration.longDescription}
						</p>
						<div class="flex flex-wrap gap-2.5 pt-1.5">
							{#if loggedIn}
								<a
									href="/dashboard"
									class="rounded-lg bg-brand-ink px-[18px] py-[11px] font-sans text-sm font-semibold leading-[18px] text-white shadow-[2px_2px_0_0_#FF48B0] transition-opacity hover:opacity-90"
								>
									Open dashboard
								</a>
							{:else}
								<a
									href={signupHref}
									on:click={() => trackSignup('int_hero')}
									class="rounded-lg bg-brand-ink px-[18px] py-[11px] font-sans text-sm font-semibold leading-[18px] text-white shadow-[2px_2px_0_0_#FF48B0] transition-opacity hover:opacity-90"
								>
									Start on Free
								</a>
							{/if}
							{#if integration.docsUrl}
								<a
									href={integration.docsUrl}
									target="_blank"
									rel="noopener"
									class="rounded-lg border-[1.5px] border-brand-ink bg-brand-paper px-[18px] py-[11px] font-sans text-sm font-semibold leading-[18px] text-brand-ink transition-colors hover:bg-brand-subtle"
								>
									Read the docs
								</a>
							{/if}
						</div>
					</div>

					<!-- Lockup (AEF-0) -->
					<div
						class="flex flex-col items-center justify-center gap-2.5 rounded-tile border-[1.5px] border-brand-ink bg-brand-paper p-5 lg:w-[360px] lg:flex-shrink-0"
					>
						<div class="flex flex-wrap items-center justify-center gap-3.5">
							<span class="flex items-center gap-2 rounded-lg bg-brand-ink px-3.5 py-2.5">
								<span class="h-3.5 w-3.5 flex-shrink-0 bg-brand-pink" aria-hidden="true" />
								<span class="font-display text-base font-bold leading-[22px] text-white">Pictify</span>
							</span>
							<span class="font-mono text-xs text-brand-mute" aria-hidden="true">+</span>
							<span
								class="flex items-center gap-2 rounded-lg border-[1.5px] border-brand-ink px-3.5 py-2.5"
							>
								<BrandMark mark={integration.icon} size={16} />
								<span class="font-sans text-base font-semibold leading-5 text-brand-ink"
									>{shortName}</span
								>
							</span>
						</div>
						<p class="text-center font-sans text-[13px] leading-4 text-brand-slate">
							Trigger in any app → render in Pictify → use the URL
						</p>
					</div>
				</div>
			</div>
		</section>

		<main class="w-full">
			<!-- ── 01 Capabilities + 02 Use cases (AHB-0) ──────────────────── -->
			<section
				class="mx-auto flex w-full max-w-page flex-col gap-10 px-5 pt-14 lg:px-10 lg:pt-16 min-[1100px]:flex-row min-[1100px]:items-start"
			>
				{#if integration.features?.length}
					<div class="flex flex-col gap-4 min-[1100px]:w-[360px] min-[1100px]:flex-shrink-0">
						<div class="flex items-baseline gap-3">
							<span class="font-mono text-xs tracking-[0.06em] text-brand-blue">01</span>
							<h2
								class="font-display text-[26px] font-bold leading-8 tracking-[-0.02em] text-brand-ink lg:text-[28px] lg:leading-9"
							>
								Key Capabilities
							</h2>
						</div>
						<ul class="flex flex-col">
							{#each integration.features as feature, i (feature)}
								<li
									class="flex gap-3 border-t border-brand-rule py-3 {i ===
									integration.features.length - 1
										? 'border-b'
										: ''}"
								>
									<span class="mt-2 h-2 w-2 flex-shrink-0 bg-brand-proof" aria-hidden="true" />
									<span class="font-sans text-base leading-6 text-brand-ink">{feature}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if integration.recipes?.length || integration.useCases?.length}
					<div class="flex min-w-0 flex-1 flex-col gap-4">
						<div class="flex items-baseline gap-3">
							<span class="font-mono text-xs tracking-[0.06em] text-brand-blue">02</span>
							<h2
								class="font-display text-[26px] font-bold leading-8 tracking-[-0.02em] text-brand-ink lg:text-[28px] lg:leading-9"
							>
								Common Use Cases
							</h2>
						</div>

						{#if integration.recipes?.length}
							<ul
								class="flex flex-col overflow-hidden rounded-tile border-[1.5px] border-brand-ink bg-brand-paper"
							>
								{#each integration.recipes as recipe, i (recipe.trigger)}
									<li
										class="flex flex-wrap items-center gap-x-3.5 gap-y-3 px-5 py-4 {i ===
										integration.recipes.length - 1
											? ''
											: 'border-b border-brand-rule'}"
									>
										<span class="flex w-full items-center gap-2 sm:w-[200px] sm:flex-shrink-0">
											<span
												class="h-7 w-7 flex-shrink-0 rounded-md border-[1.5px] border-brand-ink {KIND_TILE[
													recipe.kind
												] || 'bg-brand-subtle'}"
												aria-hidden="true"
											/>
											<span class="font-sans text-sm leading-[18px] text-brand-ink">{recipe.trigger}</span>
										</span>
										<span class="hidden font-mono text-xs text-brand-mute sm:inline" aria-hidden="true"
											>→</span
										>
										<span class="flex w-full items-center gap-2 sm:w-[200px] sm:flex-shrink-0">
											<span
												class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-brand-ink"
												aria-hidden="true"
											>
												<span class="h-2.5 w-2.5 bg-brand-pink" />
											</span>
											<span class="font-sans text-sm font-medium leading-[18px] text-brand-ink"
												>{recipe.render}</span
											>
										</span>
										<span class="hidden font-mono text-xs text-brand-mute sm:inline" aria-hidden="true"
											>→</span
										>
										<span class="min-w-[160px] flex-1 font-sans text-sm leading-[18px] text-brand-slate"
											>{recipe.use}</span
										>
										<a
											href="/tools"
											class="rounded-full border border-brand-ink px-2.5 py-[5px] font-mono text-[10px] leading-3 tracking-[0.06em] text-brand-ink transition-colors hover:bg-brand-field"
										>
											USE TEMPLATE
										</a>
									</li>
								{/each}
							</ul>
						{:else}
							<ul class="flex flex-col">
								{#each integration.useCases as useCase (useCase)}
									<li class="flex gap-3 border-t border-brand-rule py-3">
										<span class="mt-2 h-2 w-2 flex-shrink-0 bg-brand-blue" aria-hidden="true" />
										<span class="font-sans text-base leading-6 text-brand-ink">{useCase}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}
			</section>

			<!-- ── 03 Integration Guide (AJ2-0) ─────────────────────────────── -->
			{#if integration.tutorial}
				<section id="tutorial" class="mx-auto flex w-full max-w-page flex-col gap-6 px-5 pt-14 lg:px-10 lg:pt-16">
					<div class="flex flex-wrap items-end justify-between gap-3">
						<div class="flex items-baseline gap-3">
							<span class="font-mono text-xs tracking-[0.06em] text-brand-blue">03</span>
							<h2
								class="font-display text-[26px] font-bold leading-8 tracking-[-0.02em] text-brand-ink lg:text-[28px] lg:leading-9"
							>
								Integration Guide
							</h2>
						</div>
						<div class="flex gap-2">
							{#if estimated}
								<span
									class="rounded-full border border-brand-ink bg-brand-field px-2.5 py-[5px] font-mono text-[11px] leading-[14px] tracking-[0.06em] text-brand-ink"
								>
									ABOUT {estimated.toUpperCase()}
								</span>
							{/if}
							<span
								class="rounded-full border border-brand-ink bg-brand-paper px-2.5 py-[5px] font-mono text-[11px] leading-[14px] tracking-[0.06em] text-brand-ink"
							>
								{steps.length} STEPS
							</span>
						</div>
					</div>

					<div class="flex flex-col gap-10 min-[1000px]:flex-row min-[1000px]:items-start">
						<!-- Steps (AJD-0) -->
						<ol
							class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-tile border-[1.5px] border-brand-ink bg-brand-paper"
						>
							{#each steps as step, i (step.title)}
								<li
									class="flex gap-4 px-5 py-5 lg:gap-5 lg:px-6 {i === steps.length - 1
										? ''
										: 'border-b border-brand-rule'}"
								>
									<span
										class="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-brand-ink font-mono text-[13px] leading-4 text-brand-field"
										aria-hidden="true">{i + 1}</span
									>
									<div class="flex min-w-0 flex-1 flex-col gap-1.5">
										<h4 class="font-sans text-[17px] font-semibold leading-[22px] text-brand-ink">
											{step.title}
										</h4>
										<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
											{step.description}
										</p>

										{#if step.code}
											<div class="mt-1.5 flex flex-col overflow-hidden rounded-lg bg-brand-press">
												<div
													class="flex items-center justify-between border-b border-brand-slate px-3.5 py-2"
												>
													<span
														class="font-mono text-[11px] leading-[14px] tracking-[0.06em] text-brand-press-text"
														>CODE</span
													>
													<button
														type="button"
														on:click={() => copyCode(i, step.code)}
														class="font-mono text-[11px] leading-[14px] tracking-[0.06em] text-brand-field hover:underline"
													>
														{copiedStep === i ? 'COPIED' : 'COPY'}
													</button>
												</div>
												<pre class="overflow-x-auto p-3.5"><code
														class="whitespace-pre font-mono text-xs leading-[19px] text-brand-press-text"
														>{step.code}</code
													></pre>
											</div>
										{/if}

										{#if step.tip}
											<p
												class="mt-1.5 flex gap-2 border-l-[3px] border-brand-pink bg-brand-rose px-3 py-2"
											>
												<span
													class="font-mono text-[11px] leading-[19px] tracking-[0.06em] text-brand-ink"
													>TIP</span
												>
												<span class="font-sans text-[13px] leading-[19px] text-brand-ink">{step.tip}</span>
											</p>
										{/if}
									</div>
								</li>
							{/each}
						</ol>

						<!-- Guide rail (AKN-0) -->
						<aside
							class="flex flex-col gap-4 min-[1000px]:sticky min-[1000px]:top-24 min-[1000px]:w-[320px] min-[1000px]:flex-shrink-0"
						>
							{#if integration.tutorial.prerequisites?.length}
								<div
									class="flex flex-col gap-2.5 rounded-tile border-[1.5px] border-brand-ink bg-brand-paper p-5"
								>
									<p class="font-mono text-[11px] leading-[14px] tracking-[0.06em] text-brand-mute">
										BEFORE YOU START
									</p>
									<ul class="flex flex-col gap-2.5">
										{#each integration.tutorial.prerequisites as prereq (prereq)}
											<li class="flex gap-2">
												<span
													class="mt-1.5 h-2 w-2 flex-shrink-0 border-[1.5px] border-brand-ink"
													aria-hidden="true"
												/>
												<span class="font-sans text-sm leading-5 text-brand-ink">{prereq}</span>
											</li>
										{/each}
									</ul>
								</div>
							{/if}

							{#if integration.tutorial.troubleshooting?.length}
								<div
									class="flex flex-col gap-2.5 rounded-tile border-[1.5px] border-brand-ink bg-brand-paper p-5"
								>
									<p class="font-mono text-[11px] leading-[14px] tracking-[0.06em] text-brand-mute">
										IF SOMETHING BREAKS
									</p>
									{#each integration.tutorial.troubleshooting as item (item.issue)}
										<div class="flex flex-col gap-0.5">
											<p class="font-mono text-xs leading-4 text-brand-ink">{item.issue}</p>
											<p class="font-sans text-[13px] leading-[19px] text-brand-slate">{item.solution}</p>
										</div>
									{/each}
								</div>
							{/if}

							<div
								class="flex flex-col gap-2.5 rounded-tile bg-brand-ink p-5 shadow-[4px_4px_0_0_#0078BF]"
							>
								<p
									class="font-display text-xl font-bold leading-[26px] tracking-[-0.02em] text-white"
								>
									{loggedIn ? 'Your key is on the dashboard.' : 'Skip step one.'}
								</p>
								<p class="font-sans text-sm leading-5 text-brand-press-text">
									{#if loggedIn}
										Copy it from Settings → API Keys and paste it into {shortName}.
									{:else}
										Sign up and your API key is waiting on the dashboard. 50 renders a month, no card.
									{/if}
								</p>
								{#if loggedIn}
									<a
										href="/dashboard"
										class="flex justify-center rounded-lg bg-brand-field p-[11px] font-sans text-sm font-semibold leading-[18px] text-brand-ink transition-opacity hover:opacity-90"
									>
										Open dashboard
									</a>
								{:else}
									<a
										href={signupHref}
										on:click={() => trackSignup('guide_rail')}
										class="flex justify-center rounded-lg bg-brand-field p-[11px] font-sans text-sm font-semibold leading-[18px] text-brand-ink transition-opacity hover:opacity-90"
									>
										Get your API key
									</a>
								{/if}
							</div>
						</aside>
					</div>
				</section>
			{/if}

			<!-- ── Closing band (A7W-0) ──────────────────────────────────────── -->
			<section class="mt-16 w-full bg-brand-ink px-5 py-14 lg:mt-20 lg:px-10 lg:py-[72px]">
				<div
					class="mx-auto flex w-full max-w-page flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-20"
				>
					<div class="flex flex-col gap-3 lg:max-w-[720px]">
						<p class="font-mono text-xs tracking-[0.06em] text-brand-field">
							{isNoCode ? 'NO CODE REQUIRED' : 'ONE API KEY'}
						</p>
						<h2
							class="font-display text-[32px] font-bold leading-[1.08] tracking-[-0.02em] text-white lg:text-[44px] lg:leading-[50px]"
						>
							Ready to build with {integration.name}?
						</h2>
						<p class="font-sans text-base leading-[25px] text-brand-press-text lg:text-lg lg:leading-[27px]">
							Grab a free API key, pick a template, and your first render comes back{estimated
								? ` in about ${estimated}`
								: ''}.
						</p>
					</div>

					<div class="flex flex-col items-start gap-2.5 lg:items-end">
						<a
							href={loggedIn ? '/dashboard' : signupHref}
							on:click={() => !loggedIn && trackSignup('int_band')}
							class="rounded-lg bg-brand-field px-7 py-4 font-sans text-base font-semibold leading-5 text-brand-ink shadow-[3px_3px_0_0_#FF48B0] transition-opacity hover:opacity-90"
						>
							{loggedIn ? 'Open dashboard' : 'Start on Free'}
						</a>
						{#if integration.docsUrl}
							<a
								href={integration.docsUrl}
								target="_blank"
								rel="noopener"
								class="font-mono text-[11px] leading-[14px] tracking-[0.06em] text-brand-press-text hover:underline"
							>
								OR OPEN THE {shortName.toUpperCase()} DOCS →
							</a>
						{/if}
					</div>
				</div>
			</section>

			<!-- ── Related integrations (A7B-0) ──────────────────────────────── -->
			{#if otherIntegrations.length}
				<section class="mx-auto flex w-full max-w-page flex-col gap-4 px-5 pb-20 pt-14 lg:px-10 lg:pt-16">
					<div class="flex items-baseline justify-between gap-4">
						{#if hasRelatedHeading}
							<h2
								class="font-display text-[22px] font-bold leading-7 tracking-[-0.01em] text-brand-ink"
							>
								Related Integrations
							</h2>
						{:else}
							<p class="font-mono text-xs tracking-[0.06em] text-brand-mute">OTHER INTEGRATIONS</p>
						{/if}
						<a
							href="/integrations"
							class="font-mono text-xs tracking-[0.06em] text-brand-blue hover:underline"
						>
							ALL INTEGRATIONS →
						</a>
					</div>

					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 min-[1100px]:grid-cols-4">
						{#each otherIntegrations as other (other.slug)}
							<a
								href="/integrations/{other.slug}"
								class="group flex flex-col gap-1.5 rounded-tile border-[1.5px] border-brand-ink bg-brand-paper px-5 py-[18px] transition-[transform,box-shadow] duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_0_#000000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-royal motion-reduce:transition-none"
							>
								<span class="flex items-center gap-2">
									<BrandMark mark={other.icon} size={14} />
									<span class="font-mono text-[11px] leading-[14px] tracking-[0.06em] text-brand-mute"
										>{CARD_LABEL[other.category] || 'INTEGRATION'}</span
									>
								</span>
								<span
									class="font-sans text-[17px] font-semibold leading-[22px] text-brand-ink group-hover:underline"
									>{other.name}</span
								>
								<span class="font-sans text-sm leading-5 text-brand-slate">{other.description}</span>
							</a>
						{/each}
					</div>
				</section>
			{/if}
		</main>
	{:else}
		<!-- Not found state -->
		<main class="flex flex-1 items-center justify-center px-5 py-24">
			<div class="flex max-w-md flex-col items-center gap-6 text-center">
				<p class="font-mono text-xs tracking-[0.06em] text-brand-mute">404 · INTEGRATIONS</p>
				<h1
					class="font-display text-[38px] font-extrabold leading-[1.04] tracking-[-0.02em] text-brand-ink lg:text-[52px] lg:leading-[56px]"
				>
					Integration not found
				</h1>
				<p class="font-sans text-base leading-[25px] text-brand-slate">
					We couldn't find the integration you're looking for.
				</p>
				<a
					href="/integrations"
					class="rounded-lg bg-brand-ink px-6 py-3.5 font-sans text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
				>
					Browse Integrations
				</a>
			</div>
		</main>
	{/if}

	<Footer />
</div>
