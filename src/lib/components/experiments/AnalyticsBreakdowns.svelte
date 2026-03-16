<script>
	export let channelBreakdown = [];
	export let deviceBreakdown = [];
	export let geoBreakdown = [];
	export let referrerBreakdown = [];

	function getPercentage(value, total) {
		if (!total) return 0;
		return Math.round((value / total) * 100);
	}

	$: totalChannelImpressions = channelBreakdown.reduce((s, c) => s + (c.impressions || 0), 0);
	$: totalDeviceImpressions = deviceBreakdown.reduce((s, d) => s + (d.impressions || 0), 0);

	const channelColors = {
		web: 'bg-[#60a5fa]',
		email: 'bg-[#ffc480]',
		ad: 'bg-[#ff6b6b]',
		social: 'bg-[#a78bfa]',
		'in-app': 'bg-[#4ade80]',
		other: 'bg-gray-400'
	};

	const deviceColors = {
		desktop: 'bg-[#60a5fa]',
		mobile: 'bg-[#4ade80]',
		tablet: 'bg-[#ffc480]'
	};
</script>

{#if channelBreakdown.length > 0 || deviceBreakdown.length > 0 || geoBreakdown.length > 0}
	<div class="space-y-6">
		<!-- Section Header -->
		<h3 class="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
			<svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
			</svg>
			Performance Breakdowns
		</h3>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Channel Breakdown -->
			{#if channelBreakdown.length > 0}
				<div class="bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] p-4">
					<h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">By Channel</h4>
					<div class="space-y-2.5">
						{#each channelBreakdown.slice(0, 5) as ch}
							{@const pct = getPercentage(ch.impressions, totalChannelImpressions)}
							<div>
								<div class="flex justify-between text-xs font-bold text-gray-900 mb-1">
									<span class="capitalize">{ch.channel}</span>
									<span>{pct}%</span>
								</div>
								<div class="h-2.5 bg-gray-100 border border-gray-300 rounded-full overflow-hidden">
									<div
										class="h-full rounded-full transition-all duration-500 {channelColors[ch.channel] || 'bg-gray-400'}"
										style="width: {pct}%"
									/>
								</div>
								<div class="flex justify-between text-[10px] text-gray-400 mt-0.5">
									<span>{(ch.impressions || 0).toLocaleString()} imp</span>
									<span>{(ch.clicks || 0).toLocaleString()} clicks</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Device Breakdown -->
			{#if deviceBreakdown.length > 0}
				<div class="bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] p-4">
					<h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">By Device</h4>
					<div class="space-y-2.5">
						{#each deviceBreakdown as dv}
							{@const pct = getPercentage(dv.impressions, totalDeviceImpressions)}
							<div>
								<div class="flex justify-between text-xs font-bold text-gray-900 mb-1">
									<span class="capitalize">{dv.device}</span>
									<span>{pct}%</span>
								</div>
								<div class="h-2.5 bg-gray-100 border border-gray-300 rounded-full overflow-hidden">
									<div
										class="h-full rounded-full transition-all duration-500 {deviceColors[dv.device] || 'bg-gray-400'}"
										style="width: {pct}%"
									/>
								</div>
								<div class="flex justify-between text-[10px] text-gray-400 mt-0.5">
									<span>{(dv.impressions || 0).toLocaleString()} imp</span>
									<span>{(dv.clicks || 0).toLocaleString()} clicks</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Geographic Breakdown -->
			{#if geoBreakdown.length > 0}
				<div class="bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] p-4">
					<h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Top Countries</h4>
					<div class="space-y-2">
						{#each geoBreakdown.slice(0, 6) as geo}
							<div class="flex items-center justify-between text-xs">
								<span class="font-bold text-gray-900">{geo.country}</span>
								<span class="text-gray-500">{(geo.impressions || 0).toLocaleString()}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Referrer Breakdown -->
		{#if referrerBreakdown.length > 0}
			<div class="bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] p-4">
				<h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Top Referrers</h4>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
					{#each referrerBreakdown.slice(0, 8) as ref}
						<div class="flex items-center justify-between text-xs py-1 border-b border-gray-100">
							<span class="font-medium text-gray-700 truncate max-w-[200px]">{ref.referrer}</span>
							<span class="text-gray-500 font-bold ml-2">{(ref.impressions || 0).toLocaleString()}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
