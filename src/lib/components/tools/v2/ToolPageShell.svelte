<script>
	/**
	 * The v2 tool page frame. Every tool route pours its own copy into these
	 * slots; the shell owns the hero band, the reading column, the rail, the
	 * related tools and the closing band.
	 *
	 * Two long-form modes, picked by how much SEO copy a route actually has:
	 *   rail    — html-to-[format] and anything else with 6+ sections: 760px
	 *             reading column beside a sticky TOC + signup card.
	 *   column  — 2–5 sections: one column, no TOC, the signup card inline once
	 *             after the automate block.
	 * Passing nothing lets the TOC length decide.
	 *
	 * Pages that are not tools (solutions, legal) use the same frame with the
	 * tool furniture switched off: `crumbs` replaces the TOOLS trail, and
	 * `showSignup` / `showRelated` / `showClosing` drop the pieces that sell a
	 * tool. Every default is the tool page's, so no tool route changes.
	 *
	 * Nothing in here writes copy that search sees as a heading: the closing
	 * band's line is a <p>, so a route's heading outline is exactly what the
	 * route itself renders.
	 */
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import RailSignupCard from './RailSignupCard.svelte';
	import ClosingBand from './ClosingBand.svelte';
	import RelatedToolRows from './RelatedToolRows.svelte';
	import PixelCluster from '$lib/components/landing/PixelCluster.svelte';
	import { HERO_CLUSTER, BASELINE_RUN } from '$lib/components/landing/hero-clusters.js';
	import { relatedRows, slugFromPath, toolList } from '$lib/pseo/tool-cards.js';

	/** Analytics name, e.g. `html_to_png`. */
	export let toolName = '';
	/** Path signup should return to. */
	export let toolPath = '';
	/** Right-hand crumb, e.g. "HTML TO PNG". */
	export let breadcrumb = '';
	/**
	 * [{ label, href? }] — the whole trail, for pages that are not under /tools.
	 * A crumb without `href` renders as text; the last one is the current page.
	 */
	export let crumbs = null;
	/** Mono line under the hero copy. Optional. */
	export let facts = '';
	/** [{ id, label }] — drives the rail TOC and the mobile chip row. */
	export let toc = [];
	export let loggedIn = false;
	/** 'rail' | 'column' | null (decide from `toc`). */
	export let longform = null;
	/**
	 * Whether the result slot currently holds a render. A slot that is present
	 * but empty would still reserve its margin, and the result card appears
	 * below the fold of the tool card, so it animates in rather than reserving
	 * blank height that would look like a layout bug before the first render.
	 */
	export let hasResult = false;
	/** The hero's pixel clusters. Off for pages where nothing should compete with the words. */
	export let heroDecor = true;
	/** Extra classes on the reading column, e.g. `max-w-[720px]` for legal prose. */
	export let readingWidth = '';
	/** Column mode's inline signup card. */
	export let showSignup = true;
	/** The "more from the counter" tool rows under the long-form. */
	export let showRelated = true;
	/** The blue closing band that sells the tool on an account. */
	export let showClosing = true;

	/*
	 * Derived from the registry off the page's own path, so adding a tool
	 * updates every foot on the site with no route edit. `related` only leads.
	 */
	$: footRows = showRelated ? relatedRows(slugFromPath(toolPath)) : [];
	$: toolCount = toolList().length;
	$: mode = longform || (toc.length >= 6 ? 'rail' : 'column');
	$: showRail = mode === 'rail';
	$: hasTool = !!$$slots.tool;
</script>

<div class="landing-v2 flex min-h-screen w-full flex-col bg-brand-canvas">
	<Nav />

	<!-- ── Hero ──────────────────────────────────────────────────────── -->
	<section class="relative w-full overflow-hidden bg-brand-field">
		{#if heroDecor}
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
				class="-bottom-3 left-[34%] hidden lg:block"
			/>
		{/if}
		<!-- A page with no tool card has nothing rising into the hero, so the band
		     does not need the extra bottom room the card overlaps. -->
		<div
			class="relative mx-auto flex w-full max-w-page flex-col gap-3 px-5 pt-8 lg:px-10 lg:pt-11 {hasTool
				? 'pb-16 lg:pb-24'
				: 'pb-12 lg:pb-16'}"
		>
			<nav aria-label="Breadcrumb">
				<ol class="flex flex-wrap items-center gap-2.5 font-mono text-[11px] tracking-[0.06em]">
					{#if crumbs}
						{#each crumbs as crumb, i}
							{#if i > 0}
								<li class="text-brand-mute" aria-hidden="true">/</li>
							{/if}
							{#if crumb.href}
								<li><a href={crumb.href} class="text-brand-royal hover:underline">{crumb.label}</a></li>
							{:else if i === crumbs.length - 1}
								<li class="text-brand-ink" aria-current="page">{crumb.label}</li>
							{:else}
								<li class="text-brand-royal">{crumb.label}</li>
							{/if}
						{/each}
					{:else}
						<li><a href="/tools" class="text-brand-royal hover:underline">TOOLS</a></li>
						<li class="text-brand-mute" aria-hidden="true">/</li>
						<li class="text-brand-ink" aria-current="page">{breadcrumb}</li>
					{/if}
				</ol>
			</nav>

			<slot name="h1" />
			<slot name="hero-sub" />

			{#if $$slots['hero-actions']}
				<div class="mt-3">
					<slot name="hero-actions" />
				</div>
			{/if}

			{#if facts}
				<p class="mt-1 font-mono text-[11px] tracking-[0.06em] text-brand-ink">{facts}</p>
			{/if}
		</div>
	</section>

	<!-- pb-20 is the gap to whatever follows: the closing band when logged out,
	     the footer when logged in (the band is not rendered for accounts). -->
	<main class="w-full pb-20">
		{#if hasTool}
			<!-- ── Tool card ─────────────────────────────────────────── -->
			<div class="mx-auto w-full max-w-page px-5 lg:px-10">
				<!--
					`relative`, and it is load-bearing. The panel rises 32px into the
					hero by design, but the hero is a positioned element and this block
					was not, so the hero painted OVER it: below 1024 the first row of
					every tool panel — the URL field on url-to-image, the Design/Preview
					toggle on html-to-*  — was under the green band and unclickable.
					Measured at 390: hero bottom 364, panel top 332.
				-->
				<div class="relative z-10 -mt-8 lg:mt-10">
					<slot name="tool" />
				</div>

				{#if hasResult}
					<div class="result-in mt-6">
						<slot name="result" />
					</div>
				{/if}

				{#if $$slots.automate}
					<div class="mt-10 lg:mt-14">
						<slot name="automate" />
					</div>
				{/if}
			</div>
		{/if}

		<!-- ── Long-form ─────────────────────────────────────────────── -->
		{#if toc.length && showRail}
			<!-- Below the rail breakpoint the TOC becomes a scrolling chip row. -->
			<nav
				aria-label="On this page"
				class="mx-auto mt-10 w-full max-w-page overflow-x-auto px-5 lg:hidden"
			>
				<ul class="flex w-max gap-2 pb-1">
					{#each toc as item (item.id)}
						<li>
							<a
								href={`#${item.id}`}
								class="block whitespace-nowrap rounded-full border border-brand-rule bg-brand-paper px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink"
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		{/if}

		<div
			class="mx-auto flex w-full max-w-page items-start gap-10 px-5 lg:px-10 min-[1200px]:gap-20 {hasTool
				? 'mt-6'
				: 'mt-12 lg:mt-16'}"
		>
			<div class="flex min-w-0 flex-1 flex-col gap-10 lg:gap-14 {readingWidth}">
				<slot name="longform" />

				{#if !showRail && showSignup}
					<!-- Column mode carries the signup card once, inline. -->
					<div class="max-w-[420px]">
						<RailSignupCard {toolName} {toolPath} {loggedIn} location="rail_card" />
					</div>
				{/if}
			</div>

			{#if showRail}
				<!-- self-stretch so the sticky child has the whole column to travel in;
			     without it the rail stops as soon as its own content ends. -->
				<aside class="hidden w-[360px] flex-shrink-0 flex-col gap-6 self-stretch min-[1200px]:flex">
					<div class="sticky top-24 flex flex-col gap-6">
						{#if toc.length}
							<nav aria-label="On this page" class="flex flex-col border-t-2 border-brand-ink pt-8">
								<p class="pb-3 font-mono text-xs tracking-[0.06em] text-brand-mute">ON THIS PAGE</p>
								{#each toc as item (item.id)}
									<a
										href={`#${item.id}`}
										class="group flex gap-2.5 py-[7px] font-sans text-sm leading-[18px] text-brand-slate hover:text-brand-ink"
									>
										<span
											class="w-[3px] flex-shrink-0 bg-transparent group-hover:bg-brand-ink"
											aria-hidden="true"
										/>
										<span class="pl-2.5">{item.label}</span>
									</a>
								{/each}
							</nav>
						{/if}

						<RailSignupCard {toolName} {toolPath} {loggedIn} location="rail_card" />
					</div>
				</aside>
			{/if}
		</div>

		<!-- ── More from the counter (HB-04) ─────────────────────────── -->
		{#if footRows.length}
			<div class="mt-16">
				<RelatedToolRows tools={footRows} {toolName} total={toolCount} />
			</div>
		{/if}
	</main>

	{#if showClosing}
		<ClosingBand {toolName} {toolPath} {loggedIn} />
	{/if}

	<slot name="closing" />

	<Footer />
</div>

<style>
	/* The card arrives under the toolbar the moment a render lands. Movement is
	   small and downward, so nothing above it shifts. */
	.result-in {
		animation: result-in 220ms ease-out both;
	}

	@keyframes result-in {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.result-in {
			animation: none;
		}
	}
</style>
