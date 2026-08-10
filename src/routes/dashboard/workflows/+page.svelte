<script>
	import { onMount } from 'svelte';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';
	import { listWorkflowRuns, listWorkflowHooks } from '../../../api/workflow';
	import { PACKS, getPack } from '$lib/workflows/packs.js';
	import Skeleton from '$lib/components/dashboard/Skeleton.svelte';
	import { analytics } from '$lib/analytics.js';

	let isLoading = true;
	let loadError = '';
	let runs = [];
	let hooks = [];
	let copiedHookUid = null;

	$: activeHooks = hooks.filter((hook) => hook.active);

	function hookUrl(hook) {
		return hook?.path ? `${PUBLIC_BACKEND_URL}${hook.path}` : hook?.url || '';
	}

	async function copyHookUrl(hook) {
		try {
			await navigator.clipboard.writeText(hookUrl(hook));
			copiedHookUid = hook.uid;
			setTimeout(() => (copiedHookUid = null), 1500);
		} catch (error) {
			/* ignore */
		}
	}

	async function loadHooks() {
		try {
			const response = await listWorkflowHooks();
			hooks = response?.hooks || [];
		} catch (error) {
			// Non-blocking — the webhooks section just stays hidden.
			hooks = [];
		}
	}

	function timeAgo(dateStr) {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return '';
		const seconds = Math.floor((new Date() - date) / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function runLabel(run) {
		const templateName = run?.templateName || run?.template?.name;
		if (templateName) return `Run · ${templateName}`;
		const pack = getPack(run?.packType);
		if (pack) return `${pack.label} run`;
		return run?.packType ? `${run.packType} run` : 'Workflow run';
	}

	function statusStyle(status) {
		if (status === 'completed') return 'bg-data-green text-black';
		if (status === 'failed') return 'bg-brand-danger text-white';
		if (status === 'processing' || status === 'running' || status === 'pending')
			return 'bg-brand-accent text-black';
		return 'bg-gray-100 text-gray-700';
	}

	async function loadRuns() {
		isLoading = true;
		loadError = '';
		try {
			const response = await listWorkflowRuns();
			runs = response?.runs || [];
		} catch (error) {
			loadError = error?.message || 'Failed to load workflow runs';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		analytics.page('Workflows');
		loadRuns();
		loadHooks();
	});
</script>

<svelte:head>
	<title>Workflows - Pictify.io</title>
</svelte:head>

<section class="min-h-full pb-12 relative z-0">
	<!-- Background Pattern -->
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none -z-10"
	/>

	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12 pt-4">
		<div>
			<div
				class="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-accent border-[3px] border-black shadow-brutal-lg rounded-full transform -rotate-1 mb-6"
			>
				<span class="w-2 h-2 bg-data-green rounded-full border border-black" />
				<span class="text-xs font-black text-black uppercase tracking-widest">Workflows</span>
			</div>
			<h1
				class="text-4xl sm:text-5xl md:text-6xl lg:text-5xl font-black text-black tracking-tighter leading-[0.9]"
			>
				Workflows
			</h1>
			<p class="text-base sm:text-lg font-bold text-gray-500 mt-3 max-w-lg">
				Turn a spreadsheet into branded deliverables: upload your data, pick a template, and every
				row gets rendered and delivered.
			</p>
		</div>
		<a
			href="/dashboard/workflows/new"
			class="group flex items-center gap-3 bg-brand-danger border-[3px] border-black shadow-brutal-xl rounded-2xl px-6 lg:px-5 py-3 lg:py-2.5 hover:shadow-brutal-sm hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 self-start"
		>
			<span class="text-white font-black text-base lg:text-sm uppercase tracking-wide">New Run</span
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

	<!-- Popular use cases -->
	<div class="flex items-center gap-3 flex-wrap mb-10 sm:mb-14">
		<span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">
			Popular use cases
		</span>
		{#each PACKS as pack (pack.id)}
			<a
				href="/dashboard/workflows/new?pack={pack.id}"
				class="px-3 py-1.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
			>
				{pack.label}
			</a>
		{/each}
	</div>

	<!-- Webhooks -->
	{#if activeHooks.length > 0}
		<div class="flex items-center gap-3 mb-6">
			<h2
				class="text-sm md:text-base font-black text-black uppercase tracking-widest flex items-center gap-3"
			>
				<span class="w-3 h-3 bg-brand-accent rounded-sm border-[2px] border-black" />
				Webhooks
			</h2>
		</div>
		<div class="space-y-4 mb-10 sm:mb-14">
			{#each activeHooks as hook (hook.uid)}
				<div
					class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-lg p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
				>
					<div
						class="w-12 h-12 bg-data-violet/20 rounded-xl border-[2px] border-black flex items-center justify-center flex-shrink-0 shadow-brutal-sm"
					>
						<svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
							/>
						</svg>
					</div>
					<div class="flex-1 min-w-0">
						<h3 class="text-base font-black text-black truncate">
							{hook.name || 'Webhook'}
						</h3>
						<p class="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
							Template {hook.templateUid}
							&middot; {hook.outputFormat || 'png'}
							&middot; {hook.stats?.received ?? 0} received &middot; {hook.stats?.rendered ?? 0} rendered
						</p>
					</div>
					<button
						on:click={() => copyHookUrl(hook)}
						class="inline-flex items-center gap-2 bg-brand-accent text-black px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wide border-[2px] border-black shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all self-start sm:self-auto"
					>
						{copiedHookUid === hook.uid ? 'Copied!' : 'Copy URL'}
					</button>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Past Runs -->
	<div class="flex items-center gap-3 mb-6">
		<h2
			class="text-sm md:text-base font-black text-black uppercase tracking-widest flex items-center gap-3"
		>
			<span class="w-3 h-3 bg-data-violet rounded-sm border-[2px] border-black" />
			Past Runs
		</h2>
	</div>

	{#if isLoading}
		<div class="space-y-4">
			{#each Array(3) as _}
				<Skeleton class="h-24 rounded-2xl border-[3px] border-gray-200" />
			{/each}
		</div>
	{:else if loadError}
		<div
			class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-lg p-8 text-center flex flex-col items-center"
		>
			<p class="text-sm font-black text-black uppercase tracking-wider mb-4">{loadError}</p>
			<button
				on:click={loadRuns}
				class="inline-flex items-center gap-2 bg-black text-white px-6 lg:px-5 py-3 lg:py-2.5 rounded-xl font-black text-sm lg:text-xs uppercase tracking-wide border-[3px] border-black hover:bg-gray-800 transition-colors"
			>
				Retry
			</button>
		</div>
	{:else if runs.length === 0}
		<div
			class="bg-white rounded-2xl border-[3px] border-black border-dashed p-12 text-center flex flex-col items-center justify-center"
		>
			<div
				class="w-16 h-16 bg-gray-100 rounded-2xl border-[3px] border-gray-300 flex items-center justify-center mb-4 transform -rotate-3"
			>
				<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
			</div>
			<p class="text-lg font-black text-black mb-2">No runs yet</p>
			<p class="text-sm font-bold text-gray-500 mb-6 max-w-sm">
				Start your first run: upload a CSV, pick a template, and we'll render a deliverable for
				each row.
			</p>
			<a
				href="/dashboard/workflows/new"
				class="inline-flex items-center gap-2 bg-black text-white px-6 lg:px-5 py-3 lg:py-2.5 rounded-xl font-black text-sm lg:text-xs uppercase tracking-wide hover:bg-gray-800 transition-colors"
			>
				Start a run
			</a>
		</div>
	{:else}
		<div class="space-y-4">
			{#each runs as run (run.uid)}
				<a
					href="/dashboard/workflows/{run.uid}"
					class="group bg-white rounded-2xl border-[3px] border-black shadow-brutal-lg p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					<div
						class="w-12 h-12 bg-brand-accent/20 rounded-xl border-[2px] border-black flex items-center justify-center flex-shrink-0 shadow-brutal-sm group-hover:-rotate-3 transition-transform"
					>
						<svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>
					<div class="flex-1 min-w-0">
						<h3 class="text-base font-black text-black truncate">
							{runLabel(run)}
							<span class="text-gray-400 font-bold">#{run.uid?.slice(-6) || ''}</span>
						</h3>
						<p class="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
							{run.counts?.total ?? 0} rows
							{#if run.createdAt}
								&middot; {timeAgo(run.createdAt)}
							{/if}
						</p>
					</div>
					<div class="flex items-center gap-3">
						<span
							class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black bg-white text-black"
						>
							{run.outputFormat || 'png'}
						</span>
						<span
							class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black {statusStyle(
								run.status
							)}"
						>
							{run.status || 'unknown'}
						</span>
						<svg
							class="w-5 h-5 text-black group-hover:translate-x-1 transition-transform"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M17 8l4 4m0 0l-4 4m4-4H3"
							/>
						</svg>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</section>
