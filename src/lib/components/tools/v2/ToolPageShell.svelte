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
	 * Nothing in here writes copy that search sees as a heading: the closing
	 * band's line is a <p>, so a route's heading outline is exactly what the
	 * route itself renders.
	 */
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import RailSignupCard from './RailSignupCard.svelte';
	import ClosingBand from './ClosingBand.svelte';
	import RelatedToolCards from './RelatedToolCards.svelte';
	import PixelCluster from '$lib/components/landing/PixelCluster.svelte';
	import { HERO_CLUSTER, BASELINE_RUN } from '$lib/components/landing/hero-clusters.js';
	import { resolveToolCards } from '$lib/pseo/tool-cards.js';

	/** Analytics name, e.g. `html_to_png`. */
	export let toolName = '';
	/** Path signup should return to. */
	export let toolPath = '';
	/** Right-hand crumb, e.g. "HTML TO PNG". */
	export let breadcrumb = '';
	/** Mono line under the hero copy. Optional. */
	export let facts = '';
	/** [{ id, label }] — drives the rail TOC and the mobile chip row. */
	export let toc = [];
	/**
	 * Three art-strip cards. Slugs into the shared registry
	 * (`related={['table', 'code-to-image']}`) or full card objects; routes move
	 * to slugs one at a time, so both forms resolve.
	 */
	export let related = [];
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

	$: relatedCards = resolveToolCards(related);
	$: mode = longform || (toc.length >= 6 ? 'rail' : 'column');
	$: showRail = mode === 'rail';
</script>

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
		<PixelCluster
			cells={BASELINE_RUN}
			cell={14}
			origin="w"
			delay={520}
			class="-bottom-3 left-[34%] hidden lg:block"
		/>
		<div
			class="relative mx-auto flex w-full max-w-page flex-col gap-3 px-5 pb-16 pt-8 lg:px-10 lg:pb-24 lg:pt-11"
		>
			<nav aria-label="Breadcrumb">
				<ol class="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.06em]">
					<li><a href="/tools" class="text-brand-royal hover:underline">TOOLS</a></li>
					<li class="text-brand-mute" aria-hidden="true">/</li>
					<li class="text-brand-ink" aria-current="page">{breadcrumb}</li>
				</ol>
			</nav>

			<slot name="h1" />
			<slot name="hero-sub" />

			{#if facts}
				<p class="mt-1 font-mono text-[11px] tracking-[0.06em] text-brand-ink">{facts}</p>
			{/if}
		</div>
	</section>

	<main class="w-full">
		<!-- ── Tool card ─────────────────────────────────────────────── -->
		<div class="mx-auto w-full max-w-page px-5 lg:px-10">
			<div class="-mt-8 lg:mt-10">
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
			class="mx-auto mt-6 flex w-full max-w-page items-start gap-10 px-5 lg:px-10 min-[1200px]:gap-20"
		>
			<div class="flex min-w-0 flex-1 flex-col gap-10 lg:gap-14">
				<slot name="longform" />

				{#if !showRail}
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

		<!-- ── Related tools ─────────────────────────────────────────── -->
		{#if relatedCards.length}
			<section class="mx-auto mt-16 w-full max-w-page px-5 lg:px-10">
				<!--
					A <p>, not an <h2>: the routes' heading outlines are frozen for
					search, and this line is the shell's, not the page's.
				-->
				<p class="font-display text-[22px] font-bold tracking-[-0.02em] text-brand-ink">
					More from the counter
				</p>
				<div class="mt-5">
					<RelatedToolCards tools={relatedCards} {toolName} />
				</div>
			</section>
		{/if}

		<!-- Routes keep their existing internal-link block for SEO. -->
		<slot name="footer-links" />
	</main>

	<ClosingBand {toolName} {toolPath} {loggedIn} />

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
