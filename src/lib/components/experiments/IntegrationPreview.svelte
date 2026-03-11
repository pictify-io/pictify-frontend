<script>
	export let slug = '';
	export let format = 'png';
	export let goalType = 'impressions_only';
	export let destinationUrl = '';
	export let experimentLabel = 'Smart Link';

	$: slugDisplay = slug || 'your-slug';
	$: previewUrl = `pictify.io/s/${slugDisplay}.${format}`;
	$: clickTrackUrl = `pictify.io/s/${slugDisplay}/click`;
</script>

<div
	class="bg-gray-900 rounded-xl border-[3px] border-gray-900 overflow-hidden shadow-[6px_6px_0_0_#1f2937] flex flex-col"
>
	<!-- Terminal Header -->
	<div class="h-10 border-b-[3px] border-gray-700 flex items-center px-4 bg-gray-800 shrink-0">
		<div class="flex gap-2">
			<div class="w-3 h-3 rounded-full bg-red-500" />
			<div class="w-3 h-3 rounded-full bg-yellow-500" />
			<div class="w-3 h-3 rounded-full bg-green-500" />
		</div>
		<div
			class="flex-1 text-center font-mono text-[10px] text-gray-400 font-bold uppercase tracking-widest"
		>
			bash — deploy
		</div>
	</div>

	<div class="p-6 flex-1 bg-gray-900 overflow-y-auto font-mono">
		<div class="space-y-6">
			<!-- Image URL -->
			<div class="space-y-2">
				<div class="text-[10px] uppercase font-black tracking-widest text-[#4ade80]">
					> Image Endpoint
				</div>
				<p class="text-xs text-gray-400 font-sans font-bold">
					Serve this URL inside an {@html '<code>&lt;img&gt;</code>'} or CSS background.
				</p>
				<div
					class="bg-black/50 p-3 rounded-lg border-[2px] border-gray-800 break-all text-sm text-[#ffc480]"
				>
					{previewUrl}
				</div>
			</div>

			{#if goalType === 'click_through'}
				<!-- Click Tracking Link -->
				<div class="space-y-2">
					<div class="text-[10px] uppercase font-black tracking-widest text-[#60a5fa]">
						> CTA Link Endpoint
					</div>
					<p class="text-xs text-gray-400 font-sans font-bold">
						Use this URL for your button's href attribute.
					</p>
					<div
						class="bg-black/50 p-3 rounded-lg border-[2px] border-gray-800 break-all text-sm text-[#60a5fa]"
					>
						{clickTrackUrl}
					</div>
				</div>

				<!-- HTML Snippet -->
				<div class="space-y-2">
					<div class="text-[10px] uppercase font-black tracking-widest text-[#f472b6]">
						> Example Implementation
					</div>
					<div
						class="bg-black/50 p-4 rounded-lg border-[2px] border-gray-800 overflow-x-auto text-xs leading-loose"
					>
						<span class="text-gray-500">&lt;!-- Dynamic Image ({experimentLabel}) --&gt;</span>
						<span class="text-blue-400">&lt;img</span> <span class="text-green-400">src=</span><span
							class="text-amber-300">"{previewUrl}"</span
						> <span class="text-blue-400">/&gt;</span>

						<span class="text-gray-500">&lt;!-- Call to Action Button --&gt;</span>
						<span class="text-blue-400">&lt;a</span> <span class="text-green-400">href=</span><span
							class="text-amber-300">"{clickTrackUrl}"</span
						><span class="text-blue-400">&gt;</span>
						Continue
						<span class="text-blue-400">&lt;/a&gt;</span>
					</div>
				</div>
			{:else}
				<!-- HTML Snippet (impressions only) -->
				<div class="space-y-2">
					<div class="text-[10px] uppercase font-black tracking-widest text-[#f472b6]">
						> Example Implementation
					</div>
					<div
						class="bg-black/50 p-4 rounded-lg border-[2px] border-gray-800 overflow-x-auto text-xs leading-loose"
					>
						<span class="text-gray-500">&lt;!-- Dynamic Image ({experimentLabel}) --&gt;</span>
						<span class="text-blue-400">&lt;img</span> <span class="text-green-400">src=</span><span
							class="text-amber-300">"{previewUrl}"</span
						> <span class="text-green-400">alt=</span><span class="text-amber-300"
							>"Dynamic presentation"</span
						> <span class="text-blue-400">/&gt;</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
