<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';
	import { getWorkflowRun, createWorkflowHook } from '../../../../api/workflow';
	import Skeleton from '$lib/components/dashboard/Skeleton.svelte';
	import { analytics } from '$lib/analytics.js';

	const ACTIVE_STATUSES = ['pending', 'queued', 'processing', 'running'];
	const DELIVERY_KEYS = ['method', 'emailColumn', 'subject', 'fromName', 'bodyText'];

	let run = null;
	let isLoading = true;
	let loadError = '';
	let pollTimer = null;

	let hook = null;
	let hookCreating = false;
	let hookError = '';
	let hookCopied = false;

	$: hookUrl = hook?.path ? `${PUBLIC_BACKEND_URL}${hook.path}` : '';
	$: sampleRow = buildSampleRow(run?.columnMapping);
	$: curlExample = hookUrl
		? `curl -X POST ${hookUrl} -H 'Content-Type: application/json' -d '${JSON.stringify(
				sampleRow
		  )}'`
		: '';

	function buildSampleRow(columnMapping) {
		const columns = Object.values(columnMapping || {});
		if (columns.length === 0) return { name: 'Ada Lovelace' };
		return columns.reduce((acc, column) => ({ ...acc, [column]: '...' }), {});
	}

	async function createHook() {
		if (!run || hookCreating) return;
		hookCreating = true;
		hookError = '';
		try {
			const delivery = DELIVERY_KEYS.reduce((acc, key) => {
				if (run.delivery?.[key] != null) acc[key] = run.delivery[key];
				return acc;
			}, {});
			const response = await createWorkflowHook({
				name: `Run ${run.uid} webhook`,
				templateUid: run.templateUid,
				columnMapping: run.columnMapping || {},
				delivery
			});
			hook = response?.hook || null;
			if (!hook) hookError = 'Failed to create webhook';
			else analytics.track('Workflow Hook Created', { runUid: run.uid });
		} catch (error) {
			hookError = error?.message || 'Failed to create webhook';
		} finally {
			hookCreating = false;
		}
	}

	async function copyHookUrl() {
		try {
			await navigator.clipboard.writeText(hookUrl);
			hookCopied = true;
			setTimeout(() => (hookCopied = false), 1500);
		} catch (error) {
			/* ignore */
		}
	}

	$: uid = $page.params.uid;
	$: counts = run?.counts || { total: 0, rendered: 0, delivered: 0, failed: 0 };
	$: items = run?.items || [];
	$: isActive = run ? ACTIVE_STATUSES.includes(run.status) : false;
	$: progressPct = counts.total > 0 ? Math.round((counts.rendered / counts.total) * 100) : 0;
	$: completedLinks = items.filter((item) => item.url);

	function renderBadgeStyle(status) {
		if (status === 'rendered' || status === 'completed' || status === 'success')
			return 'bg-data-green text-black border-black';
		if (status === 'failed' || status === 'error') return 'bg-brand-danger text-white border-black';
		if (ACTIVE_STATUSES.includes(status)) return 'bg-brand-accent text-black border-black';
		return 'bg-gray-100 text-gray-700 border-gray-400';
	}

	async function fetchRun() {
		try {
			const response = await getWorkflowRun(uid);
			run = response?.run || null;
			loadError = run ? '' : 'Run not found.';
		} catch (error) {
			loadError = error?.message || 'Failed to load this run.';
		} finally {
			isLoading = false;
		}
		scheduleNextPoll();
	}

	function scheduleNextPoll() {
		clearTimeout(pollTimer);
		if (run && ACTIVE_STATUSES.includes(run.status)) {
			pollTimer = setTimeout(fetchRun, 2000);
		}
	}

	onMount(() => {
		analytics.page('Workflow Run Detail');
		fetchRun();
	});

	onDestroy(() => {
		clearTimeout(pollTimer);
	});
</script>

<svelte:head>
	<title>Workflow run - Pictify.io</title>
</svelte:head>

<section class="min-h-full pb-12 relative z-0">
	<!-- Background Pattern -->
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none -z-10"
	/>

	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pt-4">
		<div>
			<a
				href="/dashboard/workflows"
				class="inline-flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-black transition-colors mb-4"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M7 16l-4-4m0 0l4-4m-4 4h18"
					/>
				</svg>
				Workflows
			</a>
			<div class="flex items-center gap-4 flex-wrap">
				<h1
					class="text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-black text-black tracking-tighter leading-[0.95]"
				>
					Workflow run.
				</h1>
				{#if run}
					<span
						class="px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full border-[3px] border-black {renderBadgeStyle(
							run.status
						)} {isActive ? 'animate-pulse' : ''}"
					>
						{run.status}
					</span>
					<span
						class="px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-full border-[3px] border-black bg-white text-black"
					>
						{run.outputFormat || 'png'}
					</span>
				{/if}
			</div>
		</div>
		<a
			href="/dashboard/workflows/new"
			class="group flex items-center gap-3 bg-brand-danger border-[3px] border-black shadow-brutal-xl rounded-2xl px-6 lg:px-5 py-3 lg:py-2.5 hover:shadow-brutal-sm hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 self-start"
		>
			<span class="text-white font-black text-base lg:text-sm uppercase tracking-wide"
				>Run another</span
			>
			<div
				class="w-8 h-8 lg:w-7 lg:h-7 bg-white rounded-xl border-[3px] border-black flex items-center justify-center group-hover:rotate-12 transition-transform shadow-brutal-sm"
			>
				<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="3"
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
			</div>
		</a>
	</div>

	{#if isLoading}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
			{#each Array(4) as _}
				<Skeleton class="h-32 rounded-2xl border-[3px] border-gray-200" />
			{/each}
		</div>
		<Skeleton class="h-64 rounded-2xl border-[3px] border-gray-200" />
	{:else if loadError}
		<div
			class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-lg p-8 text-center flex flex-col items-center"
		>
			<p class="text-sm font-black text-black uppercase tracking-wider mb-4">{loadError}</p>
			<button
				on:click={() => {
					isLoading = true;
					fetchRun();
				}}
				class="inline-flex items-center gap-2 bg-black text-white px-6 lg:px-5 py-3 lg:py-2.5 rounded-xl font-black text-sm lg:text-xs uppercase tracking-wide border-[3px] border-black hover:bg-gray-800 transition-colors"
			>
				Retry
			</button>
		</div>
	{:else if run}
		<!-- Progress bar -->
		<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 mb-8">
			<div class="flex items-center justify-between mb-3">
				<span class="text-xs font-black text-black uppercase tracking-widest">
					Rendering progress
				</span>
				<span class="text-xs font-black text-black uppercase tracking-widest">
					{counts.rendered}/{counts.total} &middot; {progressPct}%
				</span>
			</div>
			<div class="h-6 bg-gray-100 rounded-lg border-[3px] border-black overflow-hidden">
				<div
					class="h-full bg-data-green border-r-[3px] border-black transition-all duration-500 {isActive
						? 'bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.1)_25%,rgba(0,0,0,0.1)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.1)_75%)] [background-size:12px_12px]'
						: ''}"
					style="width: {progressPct}%"
				/>
			</div>
		</div>

		<!-- Counts tiles -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
			<div
				class="bg-brand-accent rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 flex flex-col justify-center relative overflow-hidden group"
			>
				<div
					class="absolute -right-12 -top-12 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-700"
				/>
				<div class="relative z-10">
					<div
						class="text-[10px] md:text-xs font-black text-black/70 uppercase tracking-widest mb-2"
					>
						Total
					</div>
					<div
						class="text-4xl md:text-5xl lg:text-4xl font-black text-black tracking-tighter leading-none"
					>
						{counts.total}
					</div>
				</div>
			</div>
			<div
				class="bg-indigo-300 rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 flex flex-col justify-center relative overflow-hidden group"
			>
				<div
					class="absolute -right-6 -bottom-6 w-32 h-32 bg-black/5 transform rotate-12 group-hover:rotate-45 transition-transform duration-700"
				/>
				<div class="relative z-10">
					<div
						class="text-[10px] md:text-xs font-black text-black/70 uppercase tracking-widest mb-2"
					>
						Rendered
					</div>
					<div
						class="text-4xl md:text-5xl lg:text-4xl font-black text-black tracking-tighter leading-none"
					>
						{counts.rendered}
					</div>
				</div>
			</div>
			<div
				class="bg-data-green rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 flex flex-col justify-center relative overflow-hidden group"
			>
				<div
					class="absolute -left-10 -bottom-10 w-36 h-36 bg-white/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"
				/>
				<div class="relative z-10">
					<div
						class="text-[10px] md:text-xs font-black text-black/70 uppercase tracking-widest mb-2"
					>
						Delivered
					</div>
					<div
						class="text-4xl md:text-5xl lg:text-4xl font-black text-black tracking-tighter leading-none"
					>
						{counts.delivered}
					</div>
				</div>
			</div>
			<div
				class="bg-brand-danger rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 flex flex-col justify-center relative overflow-hidden group"
			>
				<div
					class="absolute -right-10 -top-10 w-36 h-36 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"
				/>
				<div class="relative z-10">
					<div
						class="text-[10px] md:text-xs font-black text-white/80 uppercase tracking-widest mb-2"
					>
						Failed
					</div>
					<div
						class="text-4xl md:text-5xl lg:text-4xl font-black text-white tracking-tighter leading-none"
					>
						{counts.failed}
					</div>
				</div>
			</div>
		</div>

		<!-- Completed: download all note -->
		{#if run.status === 'completed' && completedLinks.length > 0}
			<div
				class="bg-data-green/20 rounded-2xl border-[3px] border-black shadow-brutal-lg p-6 mb-10"
			>
				<div class="flex items-center gap-3 mb-2">
					<div
						class="w-10 h-10 bg-data-green rounded-xl border-[3px] border-black flex items-center justify-center shadow-brutal-sm"
					>
						<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<h3 class="text-sm font-black text-black uppercase tracking-widest">
						All done — download your deliverables
					</h3>
				</div>
				<p class="text-xs font-bold text-gray-600 mb-0">
					Every rendered file is listed in the table below — use the view link on each row to open
					or download it.
				</p>
			</div>
		{/if}

		<!-- Automate this: webhook card -->
		{#if run.status === 'completed'}
			<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-lg p-6 mb-10">
				<div class="flex items-center gap-3 mb-2">
					<div
						class="w-10 h-10 bg-data-violet rounded-xl border-[3px] border-black flex items-center justify-center shadow-brutal-sm"
					>
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m7.5-2.344a4 4 0 015.656 0l.086.086a4 4 0 010 5.656l-1.5 1.5m-7.5-9.5l3-3a4 4 0 015.656 5.656l-1.5 1.5"
							/>
						</svg>
					</div>
					<h3 class="text-sm font-black text-black uppercase tracking-widest">
						Automate this: create webhook
					</h3>
				</div>
				<p class="text-xs font-bold text-gray-600 mb-4">
					Get a permanent URL with this run's template, mapping, and delivery baked in — POST one
					row of JSON and it renders (and delivers) automatically.
				</p>
				{#if !hook}
					<button
						on:click={createHook}
						disabled={hookCreating}
						class="inline-flex items-center gap-2 bg-black text-white px-6 lg:px-5 py-3 lg:py-2.5 rounded-xl font-black text-sm lg:text-xs uppercase tracking-wide border-[3px] border-black hover:bg-gray-800 transition-colors disabled:opacity-60"
					>
						{hookCreating ? 'Creating...' : 'Create webhook'}
					</button>
					{#if hookError}
						<p class="text-xs font-bold text-brand-danger mt-3">{hookError}</p>
					{/if}
				{:else}
					<div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
						<code
							class="flex-1 min-w-0 truncate bg-gray-100 border-[2px] border-black rounded-lg px-3 py-2 text-xs font-bold text-black"
						>
							{hookUrl}
						</code>
						<button
							on:click={copyHookUrl}
							class="inline-flex items-center gap-2 bg-brand-accent text-black px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wide border-[2px] border-black shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex-shrink-0"
						>
							{hookCopied ? 'Copied!' : 'Copy URL'}
						</button>
					</div>
					<div class="overflow-x-auto">
						<code
							class="block whitespace-nowrap bg-black text-data-green rounded-lg px-3 py-2 text-[11px] font-bold"
						>
							{curlExample}
						</code>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Items table -->
		<div class="flex items-center gap-3 mb-6">
			<h2
				class="text-sm md:text-base font-black text-black uppercase tracking-widest flex items-center gap-3"
			>
				<span class="w-3 h-3 bg-data-violet rounded-sm border-[2px] border-black" />
				Files
			</h2>
		</div>

		<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead>
						<tr class="border-b-[3px] border-black bg-gray-50">
							<th class="px-5 py-4 text-[10px] font-black text-black uppercase tracking-widest">
								Row
							</th>
							<th class="px-5 py-4 text-[10px] font-black text-black uppercase tracking-widest">
								Render
							</th>
							<th class="px-5 py-4 text-[10px] font-black text-black uppercase tracking-widest">
								Delivery
							</th>
							<th class="px-5 py-4 text-[10px] font-black text-black uppercase tracking-widest">
								File
							</th>
						</tr>
					</thead>
					<tbody class="divide-y-[2px] divide-gray-200">
						{#each items as item (item.index)}
							<tr class="hover:bg-brand-accent/10 transition-colors">
								<td class="px-5 py-4 text-sm font-black text-gray-500">#{item.index + 1}</td>
								<td class="px-5 py-4">
									<span
										class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] {renderBadgeStyle(
											item.renderStatus
										)}"
									>
										{item.renderStatus || 'pending'}
									</span>
								</td>
								<td class="px-5 py-4">
									<span
										class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] {renderBadgeStyle(
											item.deliveryStatus
										)}"
									>
										{item.deliveryStatus || '—'}
									</span>
								</td>
								<td class="px-5 py-4">
									{#if item.url}
										<a
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
											class="inline-flex items-center gap-1.5 text-xs font-black text-brand-danger uppercase tracking-wider hover:text-data-red group"
										>
											View
											<svg
												class="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2.5"
													d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
												/>
											</svg>
										</a>
									{:else if item.error}
										<span class="text-xs font-bold text-brand-danger" title={item.error}>
											{item.error}
										</span>
									{:else}
										<span class="text-xs font-bold text-gray-400">—</span>
									{/if}
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="4" class="px-5 py-10 text-center">
									<p class="text-sm font-black text-gray-500 uppercase tracking-wider">
										No items yet
									</p>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</section>
