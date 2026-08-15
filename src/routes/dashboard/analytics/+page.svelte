<script>
	/**
	 * Analytics — delivery, not vanity.
	 *
	 * The question this page answers is "what are people actually pulling, and
	 * how much is it costing me in bandwidth". So views and bandwidth are the
	 * same chart with the value swapped rather than two competing dashboards,
	 * and the file list is ranked by whichever one you're looking at.
	 *
	 * Everything comes from the existing CDN analytics endpoint — the tiles,
	 * the chart and the rows all read one response, so they cannot disagree.
	 */
	import { onMount } from 'svelte';
	import { analytics } from '$lib/telemetry.js';
	import { getCdnAnalytics } from '../../../api/cdn';
	import RenderDaybook from '$lib/components/dashboard/v2/RenderDaybook.svelte';

	const RANGES = [
		{ id: '7d', label: 'Last 7 days', days: 7 },
		{ id: '14d', label: 'Last 14 days', days: 14 },
		{ id: '30d', label: 'Last 30 days', days: 30 }
	];

	let loaded = false;
	let mode = 'views'; // 'views' | 'bandwidth'
	let range = '14d';
	let data = null;

	$: rangeMeta = RANGES.find((r) => r.id === range) || RANGES[1];
	$: summary = data?.summary || {};
	$: assets = data?.assets || [];

	// The chart and the tiles share the selected range, so their labels have to
	// agree — both read `rangeMeta`, neither hardcodes a window.
	$: days = (() => {
		const stats = data?.dailyStats || [];
		const byDate = new Map(stats.map((s) => [s.date, s]));
		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);
		return Array.from({ length: rangeMeta.days }, (_, i) => {
			const d = new Date(today.getTime() - (rangeMeta.days - 1 - i) * 86_400_000);
			const key = d.toISOString().slice(0, 10);
			const row = byDate.get(key);
			return { date: key, count: mode === 'views' ? row?.hits || 0 : row?.bytes || 0 };
		});
	})();

	$: total = days.reduce((s, d) => s + d.count, 0);
	$: peak = days.reduce((best, d) => (d.count > (best?.count ?? -1) ? d : best), null);

	$: mostViewed = assets.length
		? [...assets].sort((a, b) => (b.periodHits || 0) - (a.periodHits || 0))[0]
		: null;

	$: rankedAssets = [...assets].sort((a, b) =>
		mode === 'views'
			? (b.periodHits || 0) - (a.periodHits || 0)
			: (b.periodBytes || 0) - (a.periodBytes || 0)
	);

	const bytes = (n) => {
		if (!n) return '0 B';
		const units = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
		return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
	};

	const fileName = (asset) => (asset?.assetKey || '').split('/').pop() || '—';
	const fmt = (asset) => (fileName(asset).split('.').pop() || '').toUpperCase();

	async function load() {
		loaded = false;
		try {
			data = await getCdnAnalytics({ range, sort: 'hits', page: 1, limit: 20 });
		} finally {
			loaded = true;
		}
	}

	onMount(async () => {
		await load();
		analytics.track('analytics_v2_viewed');
	});
</script>

<svelte:head><title>Analytics | Pictify.io</title></svelte:head>

<div class="min-h-full w-full px-6 py-8 lg:px-11 lg:py-9">
	<div class="mx-auto flex max-w-page flex-col gap-6">
		<div class="flex flex-col justify-between gap-2 lg:flex-row lg:items-end">
			<h1 class="font-display text-[44px] font-extrabold leading-[44px] tracking-[-0.02em] text-brand-ink">
				Analytics
			</h1>
			<p class="font-sans text-sm text-brand-mute">How your delivered files are being pulled.</p>
		</div>

		<div class="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
			<div class="flex gap-2" role="group" aria-label="Measure">
				{#each [{ id: 'views', l: 'VIEWS' }, { id: 'bandwidth', l: 'BANDWIDTH' }] as m (m.id)}
					<button
						type="button"
						on:click={() => (mode = m.id)}
						aria-pressed={mode === m.id}
						class="rounded-btn border-[1.5px] px-3.5 py-[7px] font-mono text-xs tracking-[0.06em] {mode === m.id
							? 'border-brand-ink bg-brand-field font-bold text-brand-ink'
							: 'border-brand-rule font-medium text-brand-slate hover:border-brand-ink'}"
					>
						{m.l}
					</button>
				{/each}
			</div>
			<select
				bind:value={range}
				on:change={load}
				class="rounded-btn border-[1.5px] border-brand-rule px-3 py-[7px] font-sans text-[13px] font-medium text-brand-slate outline-none"
			>
				{#each RANGES as r (r.id)}
					<option value={r.id}>{r.label}</option>
				{/each}
			</select>
		</div>

		<!-- Tiles -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<div class="flex flex-col gap-1 rounded-card border border-brand-rule px-5 py-4">
				<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute">
					Views · {rangeMeta.label.toLowerCase()}
				</span>
				<span class="font-mono text-[32px] font-semibold leading-none text-brand-ink">
					{(summary.periodHits || 0).toLocaleString()}
				</span>
			</div>
			<div class="flex flex-col gap-1 rounded-card border border-brand-rule px-5 py-4">
				<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute">
					Bandwidth · {rangeMeta.label.toLowerCase()}
				</span>
				<span class="font-mono text-[32px] font-semibold leading-none text-brand-ink">
					{bytes(summary.periodBytes || 0)}
				</span>
			</div>
			<div class="flex flex-col gap-1 rounded-card border border-brand-rule px-5 py-4">
				<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute">Most viewed</span>
				<span class="truncate font-mono text-[15px] font-medium text-brand-ink" title={fileName(mostViewed)}>
					{mostViewed ? fileName(mostViewed) : '—'}
				</span>
				{#if mostViewed}
					<span class="font-mono text-[11px] text-brand-mute">
						{(mostViewed.periodHits || 0).toLocaleString()} views
					</span>
				{/if}
			</div>
		</div>

		<!-- Chart: same bar component as the Renders daybook. -->
		{#if loaded}
			<div class="flex flex-col gap-2">
				<RenderDaybook
					{days}
					{total}
					noun={mode === 'views' ? 'view' : 'byte'}
					totalLabel={mode === 'bandwidth' ? bytes(total) : null}
					quota={null}
				/>
				{#if peak && peak.count > 0}
					<span class="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">
						Peak — {mode === 'views' ? peak.count.toLocaleString() : bytes(peak.count)} on
						{new Date(`${peak.date}T00:00:00Z`).toLocaleDateString('en-US', {
							month: 'short',
							day: 'numeric'
						})}
					</span>
				{/if}
			</div>
		{:else}
			<div class="h-[162px] animate-pulse rounded-tile bg-brand-canvas" aria-hidden="true"></div>
		{/if}

		<!-- Top files -->
		<section class="flex w-full flex-col pt-2">
			<div class="flex items-center gap-3 pb-1">
				<h2 class="font-mono text-xs font-medium uppercase tracking-[0.06em] text-brand-ink">Top files</h2>
				<span class="h-0.5 flex-1 bg-brand-ink/[0.08]"></span>
				<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
					By {mode}
				</span>
			</div>

			{#if !loaded}
				<div class="flex flex-col gap-2 pt-3" aria-hidden="true">
					{#each Array(3) as _}
						<div class="h-[52px] animate-pulse rounded-btn bg-brand-canvas"></div>
					{/each}
				</div>
			{:else if rankedAssets.length === 0}
				<p class="py-6 font-sans text-sm text-brand-slate">
					Nothing delivered in this range yet. Views appear once your files are being fetched.
				</p>
			{:else}
				{#each rankedAssets as asset (asset.assetKey)}
					<div class="flex w-full items-center gap-4 border-b border-brand-rule py-3">
						<span class="h-9 w-9 flex-shrink-0 overflow-hidden rounded-[6px] bg-brand-canvas">
							{#if /\.(png|jpe?g|gif|webp)$/i.test(asset.assetKey)}
								<img src={asset.url} alt="" loading="lazy" class="h-full w-full object-cover" />
							{/if}
						</span>
						<div class="flex min-w-0 flex-1 flex-col">
							<span class="truncate font-mono text-[12.5px] text-brand-ink">{fileName(asset)}</span>
							{#if asset.templateName}
								<span class="truncate font-mono text-[11px] text-brand-mute">{asset.templateName}</span>
							{/if}
						</div>
						<span class="w-[60px] flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
							{fmt(asset)}
						</span>
						<span class="w-[90px] flex-shrink-0 text-right font-mono text-[12px] text-brand-ink">
							{(asset.periodHits || 0).toLocaleString()} views
						</span>
						<span class="w-[90px] flex-shrink-0 text-right font-mono text-[12px] text-brand-mute">
							{bytes(asset.periodBytes || 0)}
						</span>
					</div>
				{/each}
			{/if}
		</section>
	</div>
</div>
