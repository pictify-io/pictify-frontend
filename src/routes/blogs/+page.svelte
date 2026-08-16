<script>
	/**
	 * /blogs — the proof sheet.
	 *
	 * First marketing surface of the redesign, so it speaks the landing
	 * language: lime hero band, pixel deco, landing nav and footer. The
	 * dashboard's plain-copy rule does not bind here.
	 *
	 * The signal on every card is UPDATED, not published. These are reference
	 * guides about APIs that change; "written in 2024" tells a reader nothing
	 * useful, "updated last week" tells them whether to trust it.
	 */
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import PixelCluster from '$lib/components/landing/PixelCluster.svelte';
	import ProofStack from '$lib/components/blog/v2/ProofStack.svelte';
	import { formatDate } from '$lib/blog/markdown.js';

	export let data;

	$: posts = data?.props?.posts || [];
	$: featured = data?.props?.featured || null;

	// The featured post is the hero card, so it must not also appear in the grid.
	$: rest = featured ? posts.filter((p) => p.slug !== featured.slug) : posts;

	$: guideCount = posts.filter((p) => p.type === 'guide').length;
	$: articleCount = posts.length - guideCount;

	/**
	 * Tag chips, most-used first. Tags are free strings in the CMS with eight in
	 * use and no controlled vocabulary, so this reflects what editors actually
	 * typed rather than a list we would have to keep in step by hand.
	 */
	$: tagCounts = posts.reduce((acc, p) => {
		for (const tag of p.tags || []) acc.set(tag, (acc.get(tag) || 0) + 1);
		return acc;
	}, new Map());
	$: sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
	const VISIBLE_TAGS = 5;
	$: visibleTags = showAllTags ? sortedTags : sortedTags.slice(0, VISIBLE_TAGS);
	$: hiddenTagCount = Math.max(0, sortedTags.length - VISIBLE_TAGS);

	let showAllTags = false;
	let typeFilter = 'all';
	let tagFilter = null;
	let search = '';

	$: query = search.trim().toLowerCase();
	$: filtered = rest.filter((p) => {
		if (typeFilter === 'guides' && p.type !== 'guide') return false;
		if (typeFilter === 'articles' && p.type === 'guide') return false;
		if (tagFilter && !(p.tags || []).includes(tagFilter)) return false;
		if (!query) return true;
		return `${p.title} ${p.description} ${(p.tags || []).join(' ')}`.toLowerCase().includes(query);
	});

	// The featured card is part of the sheet, so a filter that excludes it has
	// to hide it — otherwise "Articles" shows a guide at the top of the page.
	$: featuredVisible =
		featured &&
		typeFilter === 'all' &&
		!tagFilter &&
		(!query ||
			`${featured.title} ${featured.description}`.toLowerCase().includes(query));

	const TYPES = [
		{ id: 'all', label: 'All' },
		{ id: 'guides', label: 'Guides' },
		{ id: 'articles', label: 'Articles' }
	];
	$: typeCount = (id) =>
		id === 'all' ? posts.length : id === 'guides' ? guideCount : articleCount;

	function resetFilters() {
		typeFilter = 'all';
		tagFilter = null;
		search = '';
	}

	// Cut by the hero's right edge, so the field reads as a window onto a
	// larger raster. The post header uses capsules instead — no surface repeats
	// the deco of the one before it.
	const heroCluster = [
		[0, 2, 'blue'], [1, 0, 'blue'], [1, 3, 'pink'],
		[2, 1, 'blue'], [2, 2, 'ink'], [2, 4, 'sky'],
		[3, 0, 'ink'], [3, 2, 'blue'], [3, 3, 'blue'],
		[4, 1, 'blue'], [4, 2, 'ink'], [4, 3, 'ink'], [4, 4, 'blue'],
		[5, 0, 'ink'], [5, 1, 'ink'], [5, 2, 'blue'], [5, 3, 'ink'], [5, 4, 'ink']
	];
	const baselineRun = [
		[0, 0, 'blue'], [2, 0, 'ink'], [3, 1, 'blue'], [5, 0, 'sky'],
		[6, 1, 'blue'], [8, 0, 'pink'], [9, 1, 'blue']
	];
	const ctaPixels = [
		[0, 0, 'field'], [1, 1, 'field'], [2, 0, 'field'], [3, 1, 'field'], [4, 0, 'field']
	];
</script>

<svelte:head>
	<title>Guides and field notes | Pictify</title>
	<meta
		name="description"
		content="Practical guides on rendering images, PDFs and video from HTML templates. Every one ends in a template you can run."
	/>
	<link rel="canonical" href="https://pictify.io/blogs" />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<meta property="og:title" content="Guides and field notes | Pictify" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://pictify.io/blogs" />
	<meta property="og:site_name" content="Pictify.io" />
</svelte:head>

<div class="flex min-h-screen w-full flex-col bg-brand-paper">
	<Nav />

	<!-- ── Hero ──────────────────────────────────────────────────────── -->
	<section class="relative w-full overflow-hidden bg-brand-field">
		<PixelCluster
			cells={heroCluster}
			cell={22}
			origin="e"
			cycle={7}
			class="right-0 top-6 hidden lg:block"
		/>
		<PixelCluster
			cells={baselineRun}
			cell={14}
			origin="w"
			class="-bottom-3 left-[38%] hidden lg:block"
		/>
		<div class="mx-auto w-full max-w-page px-5 py-14 lg:px-10 lg:py-20">
			<span class="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-ink/70">
				From the print floor
			</span>
			<h1
				class="mt-3 max-w-[15ch] font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.04em] text-brand-ink lg:text-[72px]"
			>
				Guides &amp; field notes
			</h1>
			<p class="mt-5 max-w-[52ch] font-sans text-[16px] leading-[26px] text-brand-slate lg:text-[18px] lg:leading-[29px]">
				How to render images, PDFs and video from HTML templates. Written against the
				API we actually ship, and kept current as it changes.
			</p>
		</div>
	</section>

	<!-- ── Controls ──────────────────────────────────────────────────── -->
	<div class="w-full border-y border-brand-ink bg-brand-paper">
		<div
			class="mx-auto flex w-full max-w-page flex-col gap-3 px-5 py-3.5 lg:flex-row lg:items-center lg:gap-4 lg:px-10"
		>
			<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by type">
				{#each TYPES as t (t.id)}
					<button
						type="button"
						on:click={() => (typeFilter = t.id)}
						aria-pressed={typeFilter === t.id}
						class="rounded-btn border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors {typeFilter ===
						t.id
							? 'border-brand-ink bg-brand-ink text-white'
							: 'border-brand-rule text-brand-slate hover:border-brand-ink hover:text-brand-ink'}"
					>
						{t.label} · {typeCount(t.id)}
					</button>
				{/each}
			</div>

			{#if sortedTags.length}
				<span class="hidden h-5 w-px flex-shrink-0 bg-brand-rule lg:block" aria-hidden="true"></span>
				<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by tag">
					{#each visibleTags as tag (tag)}
						<button
							type="button"
							on:click={() => (tagFilter = tagFilter === tag ? null : tag)}
							aria-pressed={tagFilter === tag}
							class="rounded-btn border px-2.5 py-1 font-mono text-[11px] tracking-[0.04em] transition-colors {tagFilter ===
							tag
								? 'border-brand-ink bg-brand-field text-brand-ink'
								: 'border-brand-rule text-brand-slate hover:border-brand-ink hover:text-brand-ink'}"
						>
							{tag}
						</button>
					{/each}
					{#if hiddenTagCount && !showAllTags}
						<button
							type="button"
							on:click={() => (showAllTags = true)}
							class="rounded-btn border border-brand-rule px-2.5 py-1 font-mono text-[11px] text-brand-mute hover:border-brand-ink hover:text-brand-ink"
						>
							+{hiddenTagCount}
						</button>
					{/if}
				</div>
			{/if}

			<div class="lg:ml-auto">
				<label class="sr-only" for="blog-search">Search the guides</label>
				<input
					id="blog-search"
					type="search"
					bind:value={search}
					placeholder="Search"
					class="w-full rounded-btn border border-brand-rule bg-brand-paper px-3 py-1.5 font-sans text-sm text-brand-ink outline-none transition-colors placeholder:text-brand-mute focus:border-brand-ink lg:w-[220px]"
				/>
			</div>
		</div>
	</div>

	<!-- ── Sheet ─────────────────────────────────────────────────────── -->
	<main class="mx-auto w-full max-w-page flex-1 px-5 py-10 lg:px-10 lg:py-14">
		{#if featuredVisible}
			<a
				href="/blogs/{featured.slug}"
				class="group mb-10 flex flex-col overflow-hidden rounded-card border border-brand-ink bg-brand-paper transition-transform hover:-translate-y-0.5 lg:mb-14 lg:flex-row"
				style="box-shadow: 8px 8px 0 0 #0054A6"
			>
				{#if featured.heroImage}
					<div class="w-full flex-shrink-0 overflow-hidden border-b border-brand-ink bg-brand-canvas lg:w-[45%] lg:border-b-0 lg:border-r">
						<img
							src={featured.heroImage}
							alt=""
							loading="eager"
							class="h-[220px] w-full object-cover lg:h-full lg:min-h-[300px]"
						/>
					</div>
				{/if}
				<div class="flex flex-1 flex-col gap-4 p-6 lg:p-9">
					<span
						class="w-fit rounded-btn border border-brand-ink bg-brand-field px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-brand-ink"
					>
						Featured {featured.type === 'guide' ? 'guide' : 'article'}
					</span>
					<h2
						class="font-display text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] text-brand-ink lg:text-[34px]"
					>
						{featured.title}
					</h2>
					{#if featured.description}
						<p class="max-w-[56ch] font-sans text-[15px] leading-[24px] text-brand-slate lg:text-base lg:leading-[26px]">
							{featured.description}
						</p>
					{/if}
					<div class="mt-auto flex flex-wrap items-center gap-3 pt-2">
						<span
							class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-royal font-mono text-[11px] font-medium text-white"
							aria-hidden="true"
						>
							{(featured.author || 'P').trim().charAt(0).toUpperCase()}
						</span>
						<span class="font-sans text-sm text-brand-ink">{featured.author}</span>
						{#if formatDate(featured.updatedAt)}
							<span
								class="rounded-btn bg-brand-field px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-ink"
							>
								Upd {formatDate(featured.updatedAt)}
							</span>
						{/if}
						{#if featured.readingTime}
							<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-mute">
								{featured.readingTime} min
							</span>
						{/if}
						<span class="ml-auto font-mono text-[12px] uppercase tracking-[0.08em] text-brand-ink group-hover:underline">
							Read it →
						</span>
					</div>
				</div>
			</a>
		{/if}

		{#if filtered.length}
			<ul class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
				{#each filtered as post (post.slug)}
					<li class="flex">
						<a
							href="/blogs/{post.slug}"
							class="group flex w-full flex-col overflow-hidden rounded-tile border border-brand-ink bg-brand-paper transition-transform hover:-translate-y-0.5"
						>
							{#if post.heroImage}
								<div class="border-b border-brand-ink bg-brand-canvas">
									<img
										src={post.heroImage}
										alt=""
										loading="lazy"
										class="h-[164px] w-full object-cover"
									/>
								</div>
							{/if}
							<div class="flex flex-1 flex-col gap-2.5 p-5">
								<div class="flex items-center gap-2">
									<span
										class="rounded-btn border border-brand-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-ink"
									>
										{post.type === 'guide' ? 'Guide' : 'Article'}
									</span>
									{#if post.tags?.length}
										<span class="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">
											{post.tags[0]}
										</span>
									{/if}
								</div>
								<h3
									class="font-display text-[21px] font-bold leading-[1.16] tracking-[-0.02em] text-brand-ink group-hover:underline"
								>
									{post.title}
								</h3>
								{#if post.description}
									<p class="line-clamp-2 font-sans text-[14px] leading-[22px] text-brand-slate">
										{post.description}
									</p>
								{/if}
								<div class="mt-auto flex items-center gap-2.5 pt-3">
									{#if formatDate(post.updatedAt)}
										<span
											class="rounded-btn bg-brand-field px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-ink"
										>
											Upd {formatDate(post.updatedAt)}
										</span>
									{/if}
									{#if post.readingTime}
										<span class="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">
											{post.readingTime} min
										</span>
									{/if}
								</div>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<!-- No mascot here: the press machine is reserved for product empty
			     states, and this is a filter that matched nothing, not an empty
			     shelf. -->
			<div class="flex flex-col items-start gap-3 rounded-tile border border-brand-rule bg-brand-subtle px-6 py-10">
				<p class="font-display text-[21px] font-bold text-brand-ink">Nothing matches that.</p>
				<p class="font-sans text-[15px] text-brand-slate">
					Try a different search, or clear the filters to see all {posts.length} posts.
				</p>
				<button
					type="button"
					on:click={resetFilters}
					class="mt-1 rounded-btn border border-brand-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-brand-ink hover:bg-brand-ink hover:text-white"
				>
					Clear filters
				</button>
			</div>
		{/if}
	</main>

	<!-- ── Closing band ──────────────────────────────────────────────── -->
	<!-- A product CTA, not a newsletter: the subscribe endpoint is a stub that
	     reports success and stores nothing, so a signup form here would be a
	     lie told to every reader who filled it in. -->
	<section class="w-full px-5 pb-16 lg:px-10 lg:pb-24">
		<div
			class="relative mx-auto flex w-full max-w-page flex-col gap-7 overflow-hidden rounded-card border border-brand-ink bg-brand-paper p-7 lg:flex-row lg:items-center lg:p-12"
			style="box-shadow: 10px 10px 0 0 #0054A6"
		>
			<PixelCluster cells={ctaPixels} cell={12} origin="w" class="left-6 top-5 hidden lg:block" />
			<div class="flex-1">
				<h2
					class="max-w-[18ch] font-display text-[30px] font-extrabold leading-[1.04] tracking-[-0.03em] text-brand-ink lg:text-[40px]"
				>
					Read it, then render it.
				</h2>
				<p class="mt-4 max-w-[48ch] font-sans text-[15px] leading-[25px] text-brand-slate lg:text-base lg:leading-[27px]">
					Every guide ends in a working template. Free tier: 50 renders a month, no card, no
					watermark.
				</p>
				<div class="mt-6 flex flex-wrap items-center gap-3">
					<a
						href="/signup"
						class="rounded-btn bg-brand-ink px-5 py-2.5 font-sans text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
						style="box-shadow: 4px 4px 0 0 #FF48B0"
					>
						Start rendering
					</a>
					<a
						href="/docs"
						class="rounded-btn border border-brand-ink px-5 py-2.5 font-sans text-[15px] font-medium text-brand-ink hover:bg-brand-ink hover:text-white"
					>
						Read the docs
					</a>
				</div>
			</div>
			<ProofStack class="w-[200px] flex-shrink-0 self-center lg:w-[240px]" />
		</div>
	</section>

	<Footer />
</div>
