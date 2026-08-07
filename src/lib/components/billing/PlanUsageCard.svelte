<script>
	// Plan usage at a glance: render credits + AI credits for the current
	// billing window. AI credits were previously visible only inside the nav
	// widget's hover tooltip — this card gives them a permanent home.
	import { onMount } from 'svelte';
	import { getPlanDetails } from '../../../api/user';

	let loading = true;
	let renders = null; // { used, limit }
	let aiCredits = null; // { used, limit }
	let nextReset = null;

	const pct = (used, limit) => (limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0);

	const barColor = (percentage) => {
		if (percentage >= 85) return '#ff6b6b';
		if (percentage >= 65) return '#ffc480';
		return '#4ade80';
	};

	const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : '—');

	onMount(async () => {
		const details = await getPlanDetails();
		if (details) {
			const used =
				typeof details.usage === 'number'
					? details.usage
					: details.usage?.count ?? details.windowUsage?.monthly?.count ?? 0;
			const limit = details.monthlyLimit ?? details.windowUsage?.monthly?.limit ?? null;
			if (typeof limit === 'number') renders = { used, limit };
			if (details.aiCredits && typeof details.aiCredits.limit === 'number') {
				aiCredits = { used: details.aiCredits.used || 0, limit: details.aiCredits.limit };
			}
			nextReset = details.nextReset ? new Date(details.nextReset) : null;
		}
		loading = false;
	});
</script>

<div class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl overflow-hidden">
	<div class="bg-gray-100 border-b-[3px] border-gray-900 px-5 py-4 flex items-center justify-between">
		<h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">This Month's Usage</h3>
		{#if nextReset}
			<span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
				Resets {nextReset.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
			</span>
		{/if}
	</div>

	<div class="p-5 space-y-5">
		{#if loading}
			<div class="py-6 text-center">
				<span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading…</span>
			</div>
		{:else}
			{#if renders}
				<div>
					<div class="flex justify-between items-baseline mb-1.5">
						<span class="text-xs font-black text-gray-900 uppercase tracking-wider">Renders</span>
						<span class="text-xs font-bold text-gray-600 font-mono"
							>{fmt(renders.used)} / {fmt(renders.limit)}</span
						>
					</div>
					<div class="h-4 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-900">
						<div
							class="h-full transition-all duration-500 {pct(renders.used, renders.limit) > 0
								? 'border-r-2 border-gray-900'
								: ''}"
							style="width: {pct(renders.used, renders.limit)}%; background-color: {barColor(
								pct(renders.used, renders.limit)
							)}"
						/>
					</div>
					<p class="mt-1 text-[10px] font-medium text-gray-500">
						Images, PDFs, GIFs, and videos generated via tools, workflows, and the API.
					</p>
				</div>
			{/if}

			{#if aiCredits}
				<div>
					<div class="flex justify-between items-baseline mb-1.5">
						<span class="text-xs font-black text-gray-900 uppercase tracking-wider">AI Credits</span>
						<span class="text-xs font-bold text-gray-600 font-mono"
							>{fmt(aiCredits.used)} / {fmt(aiCredits.limit)}</span
						>
					</div>
					<div class="h-4 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-900">
						<div
							class="h-full transition-all duration-500 {pct(aiCredits.used, aiCredits.limit) > 0
								? 'border-r-2 border-gray-900'
								: ''}"
							style="width: {pct(aiCredits.used, aiCredits.limit)}%; background-color: {barColor(
								pct(aiCredits.used, aiCredits.limit)
							)}"
						/>
					</div>
					<p class="mt-1 text-[10px] font-medium text-gray-500">
						One credit per AI instruction — Template Maker, AI edits, and the video copilot share
						this pool.
					</p>
				</div>
			{/if}

			{#if !renders && !aiCredits}
				<p class="text-xs font-medium text-gray-500 text-center py-4">
					Usage data is unavailable right now.
				</p>
			{/if}
		{/if}
	</div>
</div>
