<script>
	/**
	 * Activity logs — what happened, who did it, when.
	 *
	 * Dense on purpose: this is a scan surface, read top-down when something
	 * looks wrong. Day grouping does the work a timestamp column can't — you
	 * find "this morning" by looking, not by parsing dates.
	 *
	 * Security-relevant events (a key rotated, a key revoked, a webhook failing)
	 * are the only red on the page, so they are findable without reading.
	 */
	import { onMount } from 'svelte';
	import { analytics } from '$lib/telemetry.js';
	import { notify, showToast } from '../../../store/toast.store.js';
	import { fetchAuditLogs, exportAuditLogs } from '../../../api/audit.js';

	const PAGE_SIZE = 100;

	/*
	 * Chips map to the audit `category` enum. RENDERS covers five categories,
	 * and the API takes one at a time, so filtering happens client-side over a
	 * fetched page rather than in five round trips — this is a recent-activity
	 * view, not an archive search.
	 *
	 * TEAM and KEYS both draw on the 'auth' category, so they are separated by
	 * action rather than category — team events are logged with invite/member
	 * actions, key events with token ones.
	 */
	const CHIPS = [
		{ id: 'ALL', categories: null },
		{ id: 'RENDERS', categories: ['image', 'gif', 'pdf', 'batch', 'video'] },
		{ id: 'TEMPLATES', categories: ['template'] },
		{ id: 'KEYS', categories: ['api'] },
		{ id: 'TEAM', categories: ['auth'], actions: /^(invite|member-)/ },
		{ id: 'WEBHOOKS', categories: ['webhook'] }
	];

	const RANGES = [
		{ id: '7', label: 'Last 7 days' },
		{ id: '14', label: 'Last 14 days' },
		{ id: '30', label: 'Last 30 days' }
	];

	/** Events worth spotting without reading the row. */
	const ALARMING = /revoke|rotate|delete|fail|denied|exceeded/i;

	let loaded = false;
	let logs = [];
	let chip = 'ALL';
	let range = '14';
	let exporting = false;

	$: activeChip = CHIPS.find((c) => c.id === chip) || CHIPS[0];
	$: visible = activeChip.categories
		? logs.filter(
				(l) =>
					activeChip.categories.includes(l.category) &&
					(!activeChip.actions || activeChip.actions.test(l.action))
			)
		: logs;
	$: groups = groupByDay(visible);

	function dayLabel(iso) {
		const d = new Date(iso);
		const midnight = new Date();
		midnight.setHours(0, 0, 0, 0);
		const back = Math.floor((midnight - d) / 86_400_000);
		if (back <= 0) return 'Today';
		if (back === 1) return 'Yesterday';
		return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	function groupByDay(list) {
		const out = [];
		let current = null;
		for (const l of list) {
			const key = new Date(l.createdAt).toDateString();
			if (!current || current.key !== key) {
				current = { key, label: dayLabel(l.createdAt), items: [] };
				out.push(current);
			}
			current.items.push(l);
		}
		return out;
	}

	/**
	 * Who did it. The audit row records how the request authenticated, which is
	 * the only actor signal available — a session is a person, a token is code,
	 * and an MCP-shaped source is an agent.
	 */
	function actor(log) {
		const method = log.request?.authMethod;
		const source = log.metadata?.custom?.source || log.request?.source;
		if (source === 'mcp') return { glyph: '✳', tint: 'bg-brand-rose', title: 'Agent' };
		if (method === 'api_token' || method === 'bearer' || method === 'api-key') {
			return { glyph: '⌘', tint: 'bg-brand-subtle', title: 'API key' };
		}
		if (method === 'system') return { glyph: '·', tint: 'bg-brand-subtle', title: 'System' };
		return { glyph: 'U', tint: 'bg-brand-powder', title: 'You' };
	}

	const eventName = (log) => `${log.category}.${log.action}`;

	async function load() {
		loaded = false;
		try {
			const since = new Date(Date.now() - Number(range) * 86_400_000).toISOString();
			const res = await fetchAuditLogs({ limit: PAGE_SIZE, startDate: since });
			logs = res?.logs || [];
		} catch {
			logs = [];
		} finally {
			loaded = true;
		}
	}

	async function exportCsv() {
		exporting = true;
		try {
			const since = new Date(Date.now() - Number(range) * 86_400_000).toISOString();
			const res = await exportAuditLogs({ format: 'csv', startDate: since, limit: 1000 });
			if (!res) throw new Error('Export failed.');
			// The endpoint returns the CSV body; save it without a round trip.
			const body = typeof res === 'string' ? res : res.csv || JSON.stringify(res);
			const url = URL.createObjectURL(new Blob([body], { type: 'text/csv' }));
			const a = document.createElement('a');
			a.href = url;
			a.download = `pictify-activity-${new Date().toISOString().slice(0, 10)}.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 10_000);
			analytics.track('activity_exported');
		} catch (e) {
			notify.fail('Export logs', e, { retry: () => exportCsv() });
		} finally {
			exporting = false;
		}
	}

	onMount(async () => {
		await load();
		analytics.track('activity_v2_viewed');
	});
</script>

<svelte:head><title>Activity logs | Pictify.io</title></svelte:head>


<div class="min-h-full w-full px-6 py-8 lg:px-11 lg:py-9">
	<div class="mx-auto flex max-w-page flex-col gap-6">
		<div class="flex flex-col justify-between gap-2 lg:flex-row lg:items-end">
			<h1 class="font-display text-[44px] font-extrabold leading-[44px] tracking-[-0.02em] text-brand-ink">
				Activity
			</h1>
			<p class="font-sans text-sm text-brand-mute">Everything that happened in this workspace.</p>
		</div>

		<div class="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
			<div class="flex flex-wrap gap-2" role="group" aria-label="Filter by kind">
				{#each CHIPS as c (c.id)}
					<button
						type="button"
						on:click={() => (chip = c.id)}
						aria-pressed={chip === c.id}
						class="rounded-btn border-[1.5px] px-3.5 py-[7px] font-mono text-xs tracking-[0.06em] {chip === c.id
							? 'border-brand-ink bg-brand-field font-bold text-brand-ink'
							: 'border-brand-rule font-medium text-brand-slate hover:border-brand-ink'}"
					>
						{c.id}
					</button>
				{/each}
			</div>

			<div class="flex items-center gap-2">
				<select
					bind:value={range}
					on:change={load}
					class="rounded-btn border-[1.5px] border-brand-rule px-3 py-[7px] font-sans text-[13px] font-medium text-brand-slate outline-none"
				>
					{#each RANGES as r (r.id)}
						<option value={r.id}>{r.label}</option>
					{/each}
				</select>
				<button
					type="button"
					on:click={exportCsv}
					disabled={exporting}
					class="rounded-btn border border-brand-rule px-2.5 py-[7px] font-mono text-[11px] uppercase tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink disabled:opacity-50"
				>
					{exporting ? 'Exporting…' : 'Export CSV'}
				</button>
			</div>
		</div>

		{#if !loaded}
			<div class="flex flex-col gap-1.5" aria-hidden="true">
				{#each Array(6) as _}
					<div class="h-[38px] animate-pulse rounded-btn bg-brand-canvas"></div>
				{/each}
			</div>
		{:else if groups.length === 0}
			<p class="py-8 font-sans text-sm text-brand-slate">
				Nothing here for this filter{chip === 'ALL' ? ' in the selected range' : ''}.
			</p>
		{:else}
			{#each groups as group (group.key)}
				<div class="flex flex-col">
					<div class="flex items-center gap-3.5 pb-1 pt-3">
						<span class="font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-ink">
							{group.label}
						</span>
						<span class="font-mono text-xs text-brand-mute">
							{group.items.length} event{group.items.length === 1 ? '' : 's'}
						</span>
						<span class="h-px flex-1 border-t-[1.5px] border-dashed border-[#D6D8D2]"></span>
					</div>

					{#each group.items as log (log.id)}
						{@const who = actor(log)}
						{@const alarming = ALARMING.test(eventName(log)) || log.status === 'failure'}
						<div class="flex w-full items-center gap-3 border-b border-brand-rule py-2.5">
							<span class="w-[64px] flex-shrink-0 font-mono text-[11px] text-brand-mute">
								{new Date(log.createdAt).toLocaleTimeString('en-US', {
									hour: '2-digit',
									minute: '2-digit',
									hour12: false
								})}
							</span>
							<span
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] font-mono text-[11px] text-brand-ink {who.tint}"
								title={who.title}
								aria-label={who.title}
							>
								{who.glyph}
							</span>
							<span
								class="w-[170px] flex-shrink-0 truncate font-mono text-[12px] {alarming
									? 'text-brand-alarm'
									: 'text-brand-ink'}"
							>
								{eventName(log)}
							</span>
							<span class="min-w-0 flex-1 truncate font-sans text-[13px] text-brand-slate">
								{log.description || log.resourceName || ''}
							</span>
							{#if log.status === 'failure'}
								<span class="flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-alarm">
									Failed
								</span>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		{/if}
	</div>
</div>
