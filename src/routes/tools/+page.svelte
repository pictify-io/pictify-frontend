<script>
	/**
	 * /tools — the open counter, as a ledger. HB-01…HB-03 (`LWV-0`, `MHV-0`,
	 * `MHW-0`).
	 *
	 * Was a grid of cards, each with a hand-drawn 156 px SVG. Eighteen tools
	 * needed eighteen drawings and a 2,000 px page; the SEO plan adds six to
	 * eight more and a video family behind them. So the hub became a ledger: a
	 * tool is a row, the art is a generated format stamp, and the only two
	 * drawings left are the wedge cards at the top.
	 *
	 * EVERYTHING COUNTED HERE IS COUNTED FROM THE REGISTRY. The hero's number,
	 * the chip counts, the rail counts, the shelf counts and the ItemList all
	 * read `tool-cards.js`, so adding one entry there adds a row and moves
	 * every number on the page with no other edit. A hand-kept "18 tools" in
	 * the hero is wrong the day the nineteenth ships.
	 *
	 * Search and filtering are client-side over the same registry: no request,
	 * no indexable variants. The state lives in the URL so a filtered view can
	 * be linked, and the page keeps one canonical URL for search engines.
	 */
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import LedgerRow from '$lib/components/tools/v2/LedgerRow.svelte';
	import {
		TOOL_CARDS,
		SHELVES,
		toolList,
		shelvesWithTools,
		outputCounts,
		matchesQuery,
		nearestTools,
		isNewTool
	} from '$lib/pseo/tool-cards.js';

	const tools = toolList();
	const total = tools.length;
	const chips = outputCounts(tools);

	/**
	 * The hero sentence spells its number, so it needs a word. Above ninety-nine
	 * the numeral is the honest fallback rather than a lookup table nobody will
	 * maintain.
	 */
	const WORDS = [
		'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
		'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen',
		'Nineteen'
	];
	const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
	function numberWord(n) {
		if (n < 20) return WORDS[n];
		if (n < 100) {
			const rest = n % 10;
			return TENS[Math.floor(n / 10)] + (rest ? `-${WORDS[rest].toLowerCase()}` : '');
		}
		return String(n);
	}

	/**
	 * The two editorial tools. Hand-picked, and the only entries that still
	 * carry `art`: the wedge is the page's one piece of persuasion, and a
	 * generated stamp cannot do that job.
	 */
	const wedge = [
		{
			...TOOL_CARDS['html-to-image'],
			slug: 'html-to-image',
			badge: 'MOST USED',
			badgeClass: 'bg-brand-field',
			// Literal shadow classes: Tailwind scans this file as text, so the
			// utilities have to appear spelled out somewhere in it.
			shadow: 'shadow-[4px_4px_0_0_#0054A6] hover:shadow-[6px_6px_0_0_#0054A6]',
			/*
			 * CONTAINED, not cropped. This drawing is 286×116 landscape and the
			 * pane is 190px portrait, so `cover` blew it up until the arrow was
			 * enormous and the document it points at fell off the right edge.
			 * The ground is the drawing's own powder, so letterboxing is
			 * invisible (board LYK-0, pane `MPM-0`).
			 */
			artFit: 'object-contain p-4',
			artBg: 'bg-brand-powder'
		},
		{
			...TOOL_CARDS['certificate-generator'],
			slug: 'certificate-generator',
			badge: 'BATCH READY',
			badgeClass: 'bg-brand-powder',
			shadow: 'shadow-[4px_4px_0_0_#FF48B0] hover:shadow-[6px_6px_0_0_#FF48B0]',
			// 190×195 portrait against a 190px portrait pane: it fills correctly.
			artFit: 'object-cover',
			artBg: 'bg-brand-rose'
		}
	];

	/* ── finder state, mirrored in the URL ──────────────────────────────── */
	/*
	 * Seeded from the URL at init rather than in onMount, so `?format=pdf` is
	 * already applied on the first paint of a shared link instead of flashing
	 * the full ledger first.
	 */
	let query = $page.url.searchParams.get('q') || '';
	let format = ($page.url.searchParams.get('format') || '').toUpperCase();
	let searchEl = null;
	let searchFocused = false;
	/** Shelves the visitor has expanded past the first four rows (below 768). */
	let expanded = {};
	/** Which shelf the rail marks, from the scroll spy. */
	let activeShelf = '';

	const MOBILE_ROWS = 4;

	$: matchesText = tools.filter((tool) => matchesQuery(tool, query));
	$: shown = format ? matchesText.filter((tool) => tool.outputs?.includes(format)) : matchesText;
	$: shelves = shelvesWithTools(shown);
	$: filtering = Boolean(query.trim() || format);
	/*
	 * Matches the query but not the format chip. Named rather than silently
	 * dropped: "3 results" when the visitor can see there are more is the
	 * moment a filter stops feeling like a filter and starts feeling broken.
	 */
	$: hiddenByFormat = format ? matchesText.filter((tool) => !tool.outputs?.includes(format)) : [];
	/* Every shelf that holds anything at all keeps its place in the rail, with a
	   0 in mute when the filter empties it (HB-02). */
	$: railShelves = SHELVES.map((shelf) => ({
		...shelf,
		count: shown.filter((tool) => tool.shelf === shelf.key).length,
		total: tools.filter((tool) => tool.shelf === shelf.key).length
	})).filter((shelf) => shelf.total);

	function syncUrl() {
		const url = new URL($page.url);
		const q = query.trim();
		if (q) url.searchParams.set('q', q);
		else url.searchParams.delete('q');
		if (format) url.searchParams.set('format', format.toLowerCase());
		else url.searchParams.delete('format');
		goto(`${url.pathname}${url.search}`, { replaceState: true, noScroll: true, keepFocus: true });
	}

	function toggleFormat(next) {
		format = format === next ? '' : next;
		syncUrl();
	}

	function clearFilters() {
		query = '';
		format = '';
		syncUrl();
	}

	function onKeydown(event) {
		if (event.key === '/' && document.activeElement !== searchEl) {
			event.preventDefault();
			searchEl?.focus();
		} else if (event.key === 'Escape' && document.activeElement === searchEl) {
			if (query) {
				query = '';
				syncUrl();
			} else {
				searchEl?.blur();
			}
		}
	}

	onMount(() => {
		// Scroll spy for the rail, the same idiom as ON THIS PAGE in the tool
		// shell. Rail is hidden below 1200, but the observer is cheap and the
		// jump strip uses the same mark.
		const sections = [...document.querySelectorAll('[data-shelf]')];
		if (!sections.length || typeof IntersectionObserver === 'undefined') return;
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
				if (visible) activeShelf = visible.target.dataset.shelf;
			},
			{ rootMargin: '-140px 0px -55% 0px' }
		);
		for (const section of sections) observer.observe(section);
		return () => observer.disconnect();
	});

	/* ── structured data ────────────────────────────────────────────────── */
	/* One ListItem per registry entry, unfiltered: the ItemList describes the
	   counter, not the visitor's current search. */
	const itemListStructuredData = {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: 'Pictify.io free tools',
		description:
			'Free browser tools built on the Pictify render API: spreadsheets to PDF, HTML and markdown to image, screenshots, certificates, badges and cards.',
		itemListElement: tools.map((tool, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			item: {
				'@type': 'WebApplication',
				name: tool.title,
				url: `https://pictify.io${tool.href}`,
				description: tool.desc,
				applicationCategory: 'DesignApplication',
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
			}
		}))
	};

	const metaDescription = `${numberWord(total)} free tools built on the Pictify render API. Spreadsheets to PDF, HTML and markdown to image, screenshots, certificates, badges and cards. No signup to try.`;
</script>

<svelte:window on:keydown={onKeydown} />

<svelte:head>
	<title>Free tools: render images, PDFs and cards | Pictify.io</title>
	<meta name="description" content={metaDescription} />
	<meta
		name="keywords"
		content="free tools, CSV to PDF, certificate generator, HTML to image, OG image generator, screenshot API, Pictify.io"
	/>
	<link rel="canonical" href="https://pictify.io/tools" />
	<meta property="og:title" content="Free tools: render images, PDFs and cards | Pictify.io" />
	<meta
		property="og:description"
		content="{numberWord(total)} free tools built on the Pictify render API. Every one of them is one API call underneath."
	/>
	<meta property="og:image" content="https://pictify.io/og/v2/tools.png" />
	<meta property="og:url" content="https://pictify.io/tools" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="https://pictify.io/og/v2/tools.png" />
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
				Open counter · {total} tools · No signup
			</span>
			<h1
				class="font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.02em] text-brand-ink lg:text-[72px] lg:leading-[74px]"
			>
				Free tools
			</h1>
			<p
				class="max-w-[620px] font-sans text-[17px] leading-[26px] text-[#2A2C1E] lg:text-[19px] lg:leading-[28px]"
			>
				Every tool here is the Pictify render API with a face on it. {numberWord(total)} of them, five
				free renders a day, no account, and the files are yours.
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

	<!-- ── Finder bar (sticky under the nav) ─────────────────────────── -->
	<div class="sticky top-0 z-30 w-full border-b-[1.5px] border-brand-ink bg-brand-paper">
		<div
			class="mx-auto flex w-full max-w-page flex-wrap items-center gap-3 px-5 py-3.5 lg:flex-nowrap lg:gap-4 lg:px-10"
		>
			<label
				class="flex h-11 w-full flex-shrink-0 items-center gap-2.5 rounded-[4px] border-[1.5px] bg-brand-paper px-3.5 lg:w-[440px] {searchFocused
					? 'border-brand-royal'
					: 'border-brand-ink'}"
			>
				<span class="sr-only">Search the tools</span>
				<svg width="16" height="16" viewBox="0 0 16 16" class="flex-shrink-0" aria-hidden="true">
					<circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.6" />
					<path
						d="M11 11L14.5 14.5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
					/>
				</svg>
				<input
					bind:this={searchEl}
					bind:value={query}
					on:input={syncUrl}
					on:focus={() => (searchFocused = true)}
					on:blur={() => (searchFocused = false)}
					type="search"
					placeholder="SEARCH {total} TOOLS · INVOICE, OG IMAGE, PDF…"
					class="min-w-0 flex-1 bg-transparent font-sans text-[15px] text-brand-ink outline-none placeholder:font-mono placeholder:text-[11px] placeholder:tracking-[0.06em] placeholder:text-brand-mute"
				/>
				<span
					class="flex-shrink-0 rounded-[4px] border border-brand-rule px-1.5 py-[2px] font-mono text-[11px] tracking-[0.06em] text-brand-mute"
					>{searchFocused ? 'ESC CLEARS' : '/'}</span
				>
			</label>

			<span class="hidden font-mono text-[11px] tracking-[0.06em] text-brand-mute lg:inline"
				>OUTPUT</span
			>
			<!-- Chips scroll rather than wrap below 768 (HB-03): a second row of
			     chips pushes the first row of the ledger off the screen. -->
			<div class="-mx-5 flex flex-1 gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:flex-none lg:px-0">
				<button
					type="button"
					on:click={() => toggleFormat('')}
					aria-pressed={!format}
					class="flex-shrink-0 rounded-full border-[1.5px] px-3 py-[7px] font-mono text-[11px] tracking-[0.06em] {!format
						? 'border-brand-ink bg-brand-ink text-brand-paper'
						: 'border-brand-rule text-brand-mute'}">ALL · {total}</button
				>
				{#each chips as chip (chip.format)}
					<button
						type="button"
						on:click={() => toggleFormat(chip.format)}
						aria-pressed={format === chip.format}
						class="flex-shrink-0 whitespace-nowrap rounded-full border-[1.5px] px-3 py-[7px] font-mono text-[11px] tracking-[0.06em] {format ===
						chip.format
							? 'border-brand-ink bg-brand-ink text-brand-paper'
							: format
								? 'border-brand-rule text-brand-mute'
								: 'border-brand-ink text-brand-ink'}"
						>{chip.format} · {chip.count}{format === chip.format ? ' ×' : ''}</button
					>
				{/each}
			</div>

			<span class="hidden flex-1 lg:block" />
			{#if filtering}
				<span class="hidden font-mono text-[11px] tracking-[0.06em] text-brand-mute lg:inline">
					{shown.length} OF {total}{format ? ` · ?FORMAT=${format}` : ''}{query.trim()
						? `${format ? '&' : ' · ?'}Q=${query.trim().toUpperCase()}`
						: ''}
				</span>
			{:else}
				<a
					href="/docs"
					class="hidden font-mono text-[11px] tracking-[0.06em] text-brand-royal hover:underline lg:inline"
					>EVERY ROW IS ONE API CALL →</a
				>
			{/if}
		</div>
	</div>

	<main class="w-full">
		<!-- ── Wedge row (the only two drawings) ─────────────────────── -->
		<div class="mx-auto w-full max-w-page px-5 pt-8 lg:px-10 lg:pt-12">
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{#each wedge as tool (tool.href)}
					<a
						href={tool.href}
						class="group block overflow-hidden rounded-card border border-brand-ink bg-brand-paper transition-[transform,box-shadow] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-royal motion-reduce:transition-none {tool.shadow} flex flex-col-reverse hover:-translate-x-[2px] hover:-translate-y-[2px] lg:flex-row"
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
							class="flex-shrink-0 overflow-hidden border-b border-brand-ink {tool.artBg} lg:w-[190px] lg:border-b-0 lg:border-l"
						>
							<img
								src={tool.art}
								alt=""
								aria-hidden="true"
								loading="lazy"
								class="h-[140px] w-full {tool.artFit} lg:h-full"
							/>
						</div>
					</a>
				{/each}
			</div>
		</div>

		<!-- ── Ledger body ───────────────────────────────────────────── -->
		<div class="mx-auto flex w-full max-w-page gap-10 px-5 pt-14 lg:px-10 lg:pt-16">
			<!-- Index rail · 216px, ≥1200 only -->
			<aside class="hidden w-[216px] flex-shrink-0 border-t-2 border-brand-ink pt-2 min-[1200px]:block">
				<div class="sticky top-24 flex flex-col gap-6">
					<div>
						<p class="pb-2.5 pt-3.5 font-mono text-[11px] tracking-[0.06em] text-brand-mute">
							ON THE COUNTER
						</p>
						<nav class="flex flex-col">
							{#each railShelves as shelf (shelf.key)}
								<a
									href="#shelf-{shelf.key}"
									class="flex items-center gap-2.5 py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-royal"
								>
									<span
										class="h-[18px] w-[3px] flex-shrink-0 {activeShelf === shelf.key
											? 'bg-brand-ink'
											: 'bg-transparent'}"
										aria-hidden="true"
									/>
									<span
										class="flex-1 font-sans text-sm leading-[18px] {activeShelf === shelf.key
											? 'font-semibold text-brand-ink'
											: 'text-brand-slate'}">{shelf.label}</span
									>
									<span class="font-mono text-[11px] tracking-[0.06em] text-brand-mute"
										>{shelf.count}</span
									>
								</a>
							{/each}
						</nav>
					</div>

					<div
						class="flex flex-col gap-2 rounded-tile border-[1.5px] border-brand-ink bg-brand-paper p-4 shadow-[3px_3px_0_0_#000000]"
					>
						<p class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">
							NOT ON THE COUNTER?
						</p>
						<p class="font-sans text-sm leading-[19px] text-brand-ink">
							Describe it. The studio drafts a template and every tool above becomes one API call.
						</p>
						<a
							href="/tools/html-to-image"
							class="font-mono text-[11px] tracking-[0.06em] text-brand-royal hover:underline"
							>OPEN THE STUDIO →</a
						>
					</div>
				</div>
			</aside>

			<div class="min-w-0 flex-1">
				<!-- Jump strip replaces the rail below 1200 (HB-03). -->
				<div class="-mx-5 mb-6 flex gap-1.5 overflow-x-auto px-5 min-[1200px]:hidden">
					{#each railShelves as shelf (shelf.key)}
						<a
							href="#shelf-{shelf.key}"
							class="flex-shrink-0 whitespace-nowrap rounded-full border border-brand-rule px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] {activeShelf ===
							shelf.key
								? 'border-brand-ink bg-brand-ink text-brand-paper'
								: 'text-brand-slate'}">{shelf.label} · {shelf.count}</a
						>
					{/each}
				</div>

				{#if filtering}
					<!-- Results head (HB-02): says what was searched, over what, and
					     how to get back out. -->
					<div class="mb-6 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
						<p class="font-display text-[22px] font-bold tracking-[-0.02em] text-brand-ink">
							{shown.length}
							{shown.length === 1 ? 'tool' : 'tools'}{query.trim() ? ` for “${query.trim()}”` : ''}
						</p>
						<p class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">
							{format ? `${format} ONLY · ` : ''}MATCHED ON TITLE, META, ALIASES
						</p>
						<span class="flex-1" />
						<button
							type="button"
							on:click={clearFilters}
							class="font-mono text-[11px] tracking-[0.06em] text-brand-royal hover:underline"
							>CLEAR FILTERS</button
						>
					</div>
				{/if}

				{#if shown.length}
					<div class="flex flex-col gap-16">
						{#each shelves as shelf (shelf.key)}
							<section id="shelf-{shelf.key}" data-shelf={shelf.key} class="scroll-mt-28">
								<div
									class="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 border-t-2 border-brand-ink pb-3.5 pt-4"
								>
									<!--
										An <h2>, as the old shelf eyebrows were. The handoff guessed
										they were <p>s and asked for headings to stay off; the
										before/after SEO snapshot says otherwise — the grid shipped
										h2 per shelf and h3 per card, and this page ranks. Same
										outline, new shelf names.
									-->
									<h2
										class="font-display text-[22px] font-bold leading-7 tracking-[-0.02em] text-brand-ink"
									>
										{shelf.label}
									</h2>
									<p class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">
										{shelf.tools.length}
										{shelf.tools.length === 1 ? 'TOOL' : 'TOOLS'}
									</p>
									<span class="flex-1" />
									<p class="font-sans text-sm leading-[18px] text-brand-slate md:text-right">
										{shelf.intro}
									</p>
								</div>

								<!-- Two columns from 1200 up: the rows are 440px on the board and
								     a single column of 18 would be a very long page. -->
								<div class="grid grid-cols-1 gap-x-14 min-[1200px]:grid-cols-2">
									<!--
										Below 768 a shelf shows four rows and expands in place. The
										cut is CSS, not a shorter list, so the rows are in the DOM
										for search and for anyone who lands with a filter applied —
										and expanding costs no render.
									-->
									{#each shelf.tools as tool, i (tool.slug)}
										<div
											class={i < MOBILE_ROWS || expanded[shelf.key] || filtering
												? ''
												: 'hidden min-[768px]:block'}
										>
											<LedgerRow {tool} isNew={isNewTool(tool)} />
										</div>
									{/each}
								</div>

								{#if !filtering && shelf.tools.length > MOBILE_ROWS && !expanded[shelf.key]}
									<button
										type="button"
										on:click={() => (expanded = { ...expanded, [shelf.key]: true })}
										class="mt-2.5 font-mono text-[11px] tracking-[0.06em] text-brand-royal min-[768px]:hidden"
										>{shelf.tools.length - MOBILE_ROWS} MORE IN {shelf.label.toUpperCase()} ↓</button
									>
								{/if}
							</section>
						{/each}
					</div>

					{#if hiddenByFormat.length}
						<!-- The format chip is hiding real matches; name them. -->
						<p class="mt-6 font-mono text-[11px] leading-[18px] tracking-[0.06em] text-brand-mute">
							ALSO MATCHES OUTSIDE {format} ·
							{#each hiddenByFormat.slice(0, 2) as tool, i (tool.slug)}
								{i ? ' · ' : ' '}{tool.title.toUpperCase()} · {tool.outputs[0]}
							{/each}
							{#if hiddenByFormat.length > 2}
								· {hiddenByFormat.length - 2} MORE
							{/if}
							<button
								type="button"
								on:click={() => toggleFormat(format)}
								class="text-brand-royal hover:underline">· SHOW THEM →</button
							>
						</p>
					{/if}
				{:else if hiddenByFormat.length}
					<!--
						The query DID match; the format chip is what emptied the page.
						Saying "nothing on the counter" here would be a lie the visitor
						can disprove by clicking one chip, so this state names what it
						found and offers the chip back.
					-->
					<div
						class="flex flex-col items-start gap-3 rounded-tile border-[1.5px] border-dashed border-brand-ink p-6"
					>
						<span
							class="flex h-10 w-10 items-center justify-center rounded-[4px] border-[1.5px] border-brand-ink bg-brand-subtle font-mono text-[13px] font-bold text-brand-ink"
							aria-hidden="true">?</span
						>
						<p class="font-display text-[22px] font-bold tracking-[-0.02em] text-brand-ink">
							No {format} tool{query.trim() ? ` for “${query.trim()}”` : ''}.
						</p>
						<p class="font-sans text-[15px] leading-[22px] text-brand-slate">
							{hiddenByFormat.length}
							{hiddenByFormat.length === 1 ? 'tool matches' : 'tools match'} outside {format}:
							{#each hiddenByFormat.slice(0, 3) as tool, i (tool.slug)}{i ? ', ' : ''}<a
									href={tool.href}
									class="text-brand-ink underline decoration-brand-pink decoration-2 underline-offset-2"
									>{tool.title}</a
								>{/each}{hiddenByFormat.length > 3
								? ` and ${hiddenByFormat.length - 3} more`
								: ''}.
						</p>
						<button
							type="button"
							on:click={() => toggleFormat(format)}
							class="flex h-10 items-center rounded-btn bg-brand-ink px-4 font-sans text-[14px] font-semibold text-white shadow-[3px_3px_0_0_#FF48B0]"
							>Show them</button
						>
					</div>
				{:else}
					<!-- No match (HB-02): names two real tools rather than shrugging. -->
					<div
						class="flex flex-col items-start gap-3 rounded-tile border-[1.5px] border-dashed border-brand-ink p-6"
					>
						<span
							class="flex h-10 w-10 items-center justify-center rounded-[4px] border-[1.5px] border-brand-ink bg-brand-subtle font-mono text-[13px] font-bold text-brand-ink"
							aria-hidden="true">?</span
						>
						<p class="font-display text-[22px] font-bold tracking-[-0.02em] text-brand-ink">
							Nothing on the counter for “{query.trim()}”.
						</p>
						<p class="font-sans text-[15px] leading-[22px] text-brand-slate">
							The nearest are
							{#each nearestTools(query, tools) as tool, i (tool.slug)}{i ? ' and ' : ' '}<a
									href={tool.href}
									class="text-brand-ink underline decoration-brand-pink decoration-2 underline-offset-2"
									>{tool.title}</a
								>{/each}. Or describe what you need and the studio drafts it.
						</p>
						<div class="flex flex-wrap items-center gap-2.5 pt-1">
							<a
								href={nearestTools(query, tools)[0]?.href || '/tools'}
								class="flex h-10 items-center rounded-btn border-[1.5px] border-brand-ink bg-brand-paper px-4 font-sans text-[14px] font-semibold text-brand-ink"
								>{nearestTools(query, tools)[0]?.title || 'Browse the counter'}</a
							>
							<a
								href="/tools/html-to-image"
								class="flex h-10 items-center rounded-btn bg-brand-ink px-4 font-sans text-[14px] font-semibold text-white shadow-[3px_3px_0_0_#FF48B0]"
								>Describe it in the studio</a
							>
						</div>
					</div>
				{/if}
			</div>
		</div>

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
