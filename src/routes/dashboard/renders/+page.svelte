<script>
	/**
	 * Renders — everything the account's templates have produced, newest first.
	 *
	 * The four per-format galleries answered "show me my PDFs"; nobody asked
	 * that. What people actually ask is "did the thing I just fired off come
	 * out, and what came out today" — so this is one feed, grouped by day, with
	 * the daybook and the month's quota stated above it.
	 *
	 * Grouping is done here rather than on the server because the day boundaries
	 * that matter are the viewer's, not UTC's.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { analytics } from '$lib/telemetry.js';
	import RenderCard from '$lib/components/dashboard/v2/RenderCard.svelte';
	import RenderDaybook from '$lib/components/dashboard/v2/RenderDaybook.svelte';
	import { getRenders } from '../../../api/media.js';
	import { plgStatus, initPLG } from '../../../store/plg.store';

	const FORMATS = ['ALL', 'PNG', 'PDF', 'GIF', 'MP4'];
	const PAGE_SIZE = 24;

	// A format filter with nothing behind it is still a place to start, so each
	// one names what it would hold and points at the template that makes it.
	const FORMAT_EMPTY = {
		PNG: {
			label: 'No PNG renders yet',
			line: 'The press is idling. Render an image template.',
			sub: 'Social cards, OG images and banners land here, newest first.',
			cta: 'Render an image template'
		},
		PDF: {
			label: 'No PDF renders yet',
			line: 'The press is idling. Render a PDF template.',
			sub: 'Invoices, certificates and statements — one document per row of data.',
			cta: 'Render a PDF template'
		},
		GIF: {
			label: 'No GIF renders yet',
			line: 'The press is idling. Render a GIF template.',
			sub: 'Countdowns and animated cards that move inside emails.',
			cta: 'Render a GIF template'
		},
		MP4: {
			label: 'No MP4 renders yet',
			line: 'The press is idling. Render a video template.',
			sub: 'Recaps and personalized clips — rendered from one MP4 template.',
			cta: 'Render an MP4 template'
		}
	};

	let loaded = false;
	let loadingMore = false;
	let errorMessage = '';

	let renders = [];
	let counts = { ALL: 0 };
	let daybook = { days: [], total: 0 };
	let templateOptions = [];
	let hasMore = false;

	let formatFilter = 'ALL';
	let templateFilter = '';
	let sourceFilter = '';
	let templateMenuOpen = false;

	// The Callers page deep-links here scoped to one caller, so the filters are
	// readable from the URL and the scope is stated as a chip you can drop.
	const CALLER_LABELS = {
		api: 'Your code',
		mcp: 'Agent',
		dashboard: 'Dashboard',
		automation: 'Automation',
		csv: 'A spreadsheet'
	};

	// QA escape hatch, same contract as the templates page: ?preview=empty
	// forces the empty state, ?preview=filter-empty the format-filtered one.
	$: preview = $page.url.searchParams.get('preview');
	$: forceEmpty = preview === 'empty';
	$: forceFilterEmpty = preview === 'filter-empty';

	// The quota line comes from the same store the rail's meter reads, so the two
	// numbers on screen can never disagree. (/plg/status reports a different,
	// non-trial-aware limit — deliberately not used here.)
	$: quota = $plgStatus?.loaded
		? {
				used: $plgStatus.usage?.current ?? 0,
				limit: $plgStatus.usage?.limit ?? 0,
				resetsAt: $plgStatus.resetDate || null
			}
		: null;

	$: selectedTemplate = templateOptions.find((t) => t.uid === templateFilter) || null;
	$: filtered = forceEmpty || forceFilterEmpty ? [] : renders;
	$: libraryEmpty = forceEmpty || (loaded && counts.ALL === 0);
	$: groups = groupByDay(filtered);

	function groupByDay(list) {
		const out = [];
		let current = null;
		for (const r of list) {
			const key = new Date(r.createdAt).toDateString();
			if (!current || current.key !== key) {
				current = { key, label: dayLabel(r.createdAt), items: [] };
				out.push(current);
			}
			current.items.push(r);
		}
		return out;
	}

	function dayLabel(dateString) {
		const date = new Date(dateString);
		const midnight = new Date();
		midnight.setHours(0, 0, 0, 0);
		const daysBack = Math.floor((midnight - date) / 86_400_000);
		if (daysBack < 0) return 'Today';
		if (daysBack === 0) return 'Today';
		if (daysBack === 1) return 'Yesterday';
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
		});
	}

	async function load({ append = false } = {}) {
		if (append) loadingMore = true;
		errorMessage = '';
		try {
			const data = await getRenders({
				format: formatFilter,
				template: templateFilter || null,
				source: sourceFilter || null,
				limit: PAGE_SIZE,
				offset: append ? renders.length : 0
			});
			// Two renders written in the same millisecond can straddle a page
			// boundary in the merged feed. Deduping keeps the keyed each-block
			// from throwing on a repeat uid.
			const incoming = data.renders || [];
			if (append) {
				const seen = new Set(renders.map((r) => r.uid));
				renders = [...renders, ...incoming.filter((r) => !seen.has(r.uid))];
			} else {
				renders = incoming;
			}
			counts = data.counts || { ALL: 0 };
			daybook = data.daybook || { days: [], total: 0 };
			// The dropdown's options come from the unfiltered breakdown, so
			// picking a template never removes the option you just picked.
			if (!templateFilter) templateOptions = data.templates || [];
			hasMore = Boolean(data.pagination?.hasMore);
		} catch (e) {
			errorMessage = e?.message || 'Could not load your renders.';
		} finally {
			loaded = true;
			loadingMore = false;
		}
	}

	/** Keep the URL in step with the filters so the view is linkable and back works. */
	function syncUrl() {
		const url = new URL($page.url);
		if (formatFilter === 'ALL') url.searchParams.delete('format');
		else url.searchParams.set('format', formatFilter);
		if (sourceFilter) url.searchParams.set('source', sourceFilter);
		else url.searchParams.delete('source');
		goto(`${url.pathname}${url.search}`, { replaceState: true, noScroll: true, keepFocus: true });
	}

	function pickFormat(next) {
		if (next === formatFilter) return;
		formatFilter = next;
		analytics.track('renders_format_filtered', { format: next });
		syncUrl();
		load();
	}

	function clearSource() {
		sourceFilter = '';
		analytics.track('renders_source_filter_cleared');
		syncUrl();
		load();
	}

	function pickTemplate(uid) {
		templateMenuOpen = false;
		if (uid === templateFilter) return;
		templateFilter = uid;
		analytics.track('renders_template_filtered', { scoped: Boolean(uid) });
		load();
	}

	onMount(async () => {
		// Idempotent — the rail calls it too; whichever mounts first wins.
		initPLG();
		const urlFormat = ($page.url.searchParams.get('format') || '').toUpperCase();
		if (FORMATS.includes(urlFormat)) formatFilter = urlFormat;
		const urlSource = $page.url.searchParams.get('source') || '';
		if (CALLER_LABELS[urlSource]) sourceFilter = urlSource;
		await load();
		analytics.track('renders_v2_viewed', { total: counts.ALL });
	});
</script>

<svelte:head>
	<title>Renders | Pictify.io</title>
</svelte:head>

<div class="min-h-full w-full px-6 py-8 lg:px-11 lg:py-9">
	<div class="mx-auto flex max-w-page flex-col gap-6">
		<div class="flex flex-col justify-between gap-2 lg:flex-row lg:items-end">
			<div class="flex items-baseline gap-3">
				<h1 class="font-display text-[40px] font-extrabold leading-[44px] tracking-[-0.02em] text-brand-ink">
					Renders
				</h1>
				{#if loaded}
					<span class="font-mono text-xs font-medium text-brand-mute">{counts.ALL.toLocaleString()}</span>
				{/if}
			</div>
			<p class="font-sans text-sm text-brand-mute">
				Every file your templates have produced — newest first.
			</p>
		</div>

		{#if errorMessage}
			<p role="alert" class="flex items-start gap-2.5 rounded-btn bg-brand-rose px-4 py-3 font-sans text-sm text-brand-ink">
				<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-ink" aria-hidden="true"></span>
				{errorMessage}
			</p>
		{/if}

		{#if loaded && !libraryEmpty}
			<div class="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
				<div class="flex flex-wrap gap-2" role="group" aria-label="Filter by format">
					{#each FORMATS as f (f)}
						{@const active = formatFilter === f}
						<button
							type="button"
							on:click={() => pickFormat(f)}
							aria-pressed={active}
							class="flex items-center gap-1.5 rounded-btn border-[1.5px] px-3.5 py-[7px] {active
								? 'border-brand-ink bg-brand-field'
								: 'border-brand-rule hover:border-brand-ink'}"
						>
							<span class="font-mono text-xs tracking-[0.06em] {active ? 'font-bold text-brand-ink' : 'font-medium text-brand-slate'}">
								{f}
							</span>
							{#if f !== 'ALL'}
								<span class="font-mono text-xs text-brand-mute">{(counts[f] || 0).toLocaleString()}</span>
							{/if}
						</button>
					{/each}

					{#if sourceFilter}
						<!-- Arrived from a Callers card. The scope is stated rather than
						     silently applied, and one click drops it. -->
						<button
							type="button"
							on:click={clearSource}
							class="flex items-center gap-2 rounded-btn border-[1.5px] border-brand-ink bg-brand-powder px-3 py-[7px]"
							title="Show renders from every caller"
						>
							<span class="font-mono text-xs tracking-[0.06em] text-brand-royal">
								{CALLER_LABELS[sourceFilter]}
							</span>
							<span class="font-mono text-xs text-brand-royal" aria-hidden="true">×</span>
							<span class="sr-only">Clear caller filter</span>
						</button>
					{/if}
				</div>

				{#if templateOptions.length}
					<div class="relative flex-shrink-0">
						<button
							type="button"
							on:click={() => (templateMenuOpen = !templateMenuOpen)}
							aria-expanded={templateMenuOpen}
							class="flex items-center gap-2 rounded-btn border-[1.5px] border-brand-rule px-3 py-[7px] hover:border-brand-ink"
						>
							<span class="max-w-[220px] truncate font-sans text-[13px] font-medium text-brand-slate">
								{selectedTemplate ? selectedTemplate.name : 'All templates'}
							</span>
							<svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true" class="flex-shrink-0">
								<path d="M1 1l4 4 4-4" fill="none" stroke="#383A42" stroke-width="1.5" />
							</svg>
						</button>
						{#if templateMenuOpen}
							<div class="absolute right-0 top-full z-20 mt-1 flex max-h-[320px] w-[260px] flex-col overflow-y-auto rounded-md border border-black/10 bg-white py-1 shadow-lg">
								<button
									type="button"
									on:click={() => pickTemplate('')}
									class="flex items-center justify-between px-3 py-2 text-left font-sans text-[13px] hover:bg-brand-canvas {templateFilter === ''
										? 'font-semibold text-brand-ink'
										: 'text-brand-slate'}"
								>
									All templates
									<span class="font-mono text-[11px] text-brand-mute">{counts.ALL.toLocaleString()}</span>
								</button>
								{#each templateOptions as option (option.uid)}
									<button
										type="button"
										on:click={() => pickTemplate(option.uid)}
										class="flex items-center justify-between gap-2 px-3 py-2 text-left font-sans text-[13px] hover:bg-brand-canvas {templateFilter === option.uid
											? 'font-semibold text-brand-ink'
											: 'text-brand-slate'}"
									>
										<span class="min-w-0 truncate">{option.name}</span>
										<span class="flex-shrink-0 font-mono text-[11px] text-brand-mute">{option.count.toLocaleString()}</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<RenderDaybook days={daybook.days} total={daybook.total} {quota} />
		{/if}

		{#if !loaded}
			<div class="flex flex-col gap-4" aria-hidden="true">
				<div class="h-[162px] animate-pulse rounded-tile bg-brand-canvas"></div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each Array(8) as _}
						<div class="h-[237px] animate-pulse rounded-tile bg-brand-canvas"></div>
					{/each}
				</div>
			</div>
		{:else if libraryEmpty}
			<!-- Nothing has ever printed. The mascot carries the print analogy —
			     the one place in the dashboard it's allowed to. -->
			<div class="flex flex-col items-center gap-4 rounded-tile border border-brand-rule px-8 pb-12 pt-11 text-center">
				<img src="/landing/mascot-press-empty.jpg" alt="" class="h-[250px] w-[340px] object-contain" aria-hidden="true" />
				<div class="flex flex-col items-center gap-1.5">
					<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">No renders yet</span>
					<span class="font-display text-xl font-extrabold tracking-[-0.02em] text-brand-ink">
						The press is idling. Render a template and files land here.
					</span>
					<span class="font-sans text-[13.5px] text-brand-slate">
						Every PNG, PDF, GIF and MP4 you make shows up in this list, newest first.
					</span>
				</div>
				<a
					href="/dashboard/template"
					class="mt-1 flex items-center gap-2 rounded-md bg-brand-ink px-[18px] py-2.5 font-sans text-[13px] font-bold text-white transition-opacity hover:opacity-90"
				>
					Open templates
					<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
				</a>
			</div>
		{:else if groups.length === 0}
			{@const copy = FORMAT_EMPTY[forceFilterEmpty && formatFilter === 'ALL' ? 'MP4' : formatFilter]}
			{#if copy}
				<div class="flex flex-col items-center gap-4 rounded-tile border border-brand-rule px-8 pb-12 pt-11 text-center">
					<img src="/landing/mascot-press-empty.jpg" alt="" class="h-[250px] w-[340px] object-contain" aria-hidden="true" />
					<div class="flex flex-col items-center gap-1.5">
						<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">{copy.label}</span>
						<span class="font-display text-xl font-extrabold tracking-[-0.02em] text-brand-ink">{copy.line}</span>
						<span class="font-sans text-[13.5px] text-brand-slate">{copy.sub}</span>
					</div>
					<a
						href="/dashboard/template"
						class="mt-1 flex items-center gap-2 rounded-md bg-brand-ink px-[18px] py-2.5 font-sans text-[13px] font-bold text-white transition-opacity hover:opacity-90"
					>
						{copy.cta}
						<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
					</a>
				</div>
			{:else}
				<div class="flex items-center gap-3 pt-2">
					<p class="font-sans text-[15px] text-brand-slate">
						{selectedTemplate ? `${selectedTemplate.name} hasn't rendered anything yet.` : 'Nothing here yet.'}
					</p>
					{#if templateFilter}
						<button
							type="button"
							on:click={() => pickTemplate('')}
							class="font-sans text-[13px] font-semibold text-brand-ink underline underline-offset-[3px]"
						>
							Show all templates
						</button>
					{/if}
				</div>
			{/if}
		{:else}
			{#each groups as group (group.key)}
				<div class="flex flex-col gap-4">
					<div class="flex items-center gap-3.5 pt-2">
						<span class="font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-ink">
							{group.label}
						</span>
						<span class="font-mono text-xs text-brand-mute">
							{group.items.length} render{group.items.length === 1 ? '' : 's'}
						</span>
						<span class="h-px flex-1 border-t-[1.5px] border-dashed border-[#D6D8D2]"></span>
					</div>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{#each group.items as render (render.uid)}
							<RenderCard {render} />
						{/each}
					</div>
				</div>
			{/each}

			{#if hasMore}
				<div class="flex justify-center pt-1">
					<button
						type="button"
						on:click={() => load({ append: true })}
						disabled={loadingMore}
						class="rounded-btn border-[1.5px] border-brand-ink px-[22px] py-2.5 font-sans text-[13px] font-semibold text-brand-ink transition-colors hover:bg-brand-ink hover:text-white disabled:opacity-60"
					>
						{loadingMore ? 'Loading…' : 'Show older renders'}
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
