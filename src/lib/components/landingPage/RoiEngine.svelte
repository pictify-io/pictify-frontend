<script>
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	// Data for the "Before/After" comparison in Card 1
	const marketingStats = {
		generic: { ctr: '1.2%', color: 'text-gray-400', label: 'Generic Ad' },
		dynamic: { ctr: '4.8%', color: 'text-[#4ade80]', label: 'Dynamic Ad' }
	};

	// Data for the "Speed" visual in Card 2
	let generationTime = 0;

	// Animation loop for speed counter
	onMount(() => {
		const interval = setInterval(() => {
			generationTime = 0;
			const speedInterval = setInterval(() => {
				if (generationTime < 150) {
					generationTime += 10;
				} else {
					clearInterval(speedInterval);
				}
			}, 50);
		}, 3000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<section class="w-full py-20 md:py-32 bg-[#FFFDF8] relative overflow-hidden">
	<!-- Background Grid -->
	<div
		class="absolute inset-0 bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%,#f3f4f6),linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%,#f3f4f6)] [background-size:20px_20px] [background-position:0_0,10px_10px] opacity-50"
	/>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<!-- Header -->
		<div class="text-center mb-20">
			<div
				class="inline-flex items-center gap-2 px-4 py-2 bg-[#1f2937] rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ff6b6b] mb-6 transform -rotate-1"
			>
				<span class="text-sm font-bold text-white uppercase tracking-wider">Why Pictify?</span>
			</div>
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
				The ROI <br />
				<span class="text-[#ff6b6b]">Engine.</span>
			</h2>
			<p class="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
				Don't just generate images. Generate results. Infrastructure designed to impact your bottom
				line.
			</p>
		</div>

		<!-- ROI Cards Grid -->
		<div class="grid lg:grid-cols-3 gap-8">
			<!-- Card 1: Marketing ROI -->
			<div
				class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] p-8 flex flex-col h-full relative overflow-hidden group hover:-translate-y-1 hover:shadow-[12px_12px_0_0_#1f2937] transition-all"
			>
				<div
					class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"
				>
					<svg class="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1"
							d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
						/></svg
					>
				</div>

				<div class="mb-6">
					<div
						class="w-12 h-12 bg-[#ff6b6b] rounded-lg border-[2px] border-gray-900 flex items-center justify-center mb-4 shadow-[4px_4px_0_0_#000]"
					>
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
							/></svg
						>
					</div>
					<h3 class="text-2xl font-black text-gray-900">Higher CTR</h3>
					<p class="text-gray-600 font-medium mt-2">
						Personalized visuals outperform generic assets every time.
					</p>
				</div>

				<div class="mt-auto bg-gray-50 rounded-xl border-[2px] border-gray-200 p-4 relative">
					<!-- Comparison Chart -->
					<div class="space-y-4">
						<div>
							<div
								class="flex justify-between text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider"
							>
								Generic
							</div>
							<div
								class="h-8 bg-gray-200 rounded w-1/4 flex items-center px-2 text-xs font-bold text-gray-500 relative overflow-hidden"
							>
								1.2%
							</div>
						</div>
						<div>
							<div
								class="flex justify-between text-xs font-bold text-[#ff6b6b] mb-1 uppercase tracking-wider"
							>
								Pictify Dynamic
							</div>
							<div
								class="h-8 bg-[#ff6b6b] rounded w-3/4 flex items-center px-2 text-xs font-bold text-white relative shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] animate-[grow_1s_ease-out]"
							>
								4.8%
								<span class="absolute right-2 bg-white/20 px-1.5 rounded text-[9px]">4x Lift</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Card 2: Performance/Speed -->
			<div
				class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] p-8 flex flex-col h-full relative overflow-hidden group hover:-translate-y-1 hover:shadow-[12px_12px_0_0_#1f2937] transition-all"
			>
				<div
					class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"
				>
					<svg class="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/></svg
					>
				</div>

				<div class="mb-6">
					<div
						class="w-12 h-12 bg-[#ffc480] rounded-lg border-[2px] border-gray-900 flex items-center justify-center mb-4 shadow-[4px_4px_0_0_#000]"
					>
						<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/></svg
						>
					</div>
					<h3 class="text-2xl font-black text-gray-900">Zero Latency</h3>
					<p class="text-gray-600 font-medium mt-2">
						Images generated at the edge. Your users never wait.
					</p>
				</div>

				<div
					class="mt-auto flex items-center justify-center py-8 bg-gray-900 rounded-xl border-[2px] border-gray-900 relative overflow-hidden"
				>
					<!-- Speedometer Visual -->
					<div class="text-center relative z-10">
						<div class="text-5xl font-black text-[#4ade80] tabular-nums tracking-tighter">
							{generationTime}<span class="text-2xl text-gray-500">ms</span>
						</div>
						<div class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
							Avg Generation Time
						</div>
					</div>
					<!-- Animated Line -->
					<div class="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
						<div class="h-full bg-[#4ade80] w-full animate-[scan_2s_linear_infinite]" />
					</div>
				</div>
			</div>

			<!-- Card 3: Dev Efficiency -->
			<div
				class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] p-8 flex flex-col h-full relative overflow-hidden group hover:-translate-y-1 hover:shadow-[12px_12px_0_0_#1f2937] transition-all"
			>
				<div
					class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"
				>
					<svg class="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1"
							d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
						/></svg
					>
				</div>

				<div class="mb-6">
					<div
						class="w-12 h-12 bg-[#4ade80] rounded-lg border-[2px] border-gray-900 flex items-center justify-center mb-4 shadow-[4px_4px_0_0_#000]"
					>
						<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
							/></svg
						>
					</div>
					<h3 class="text-2xl font-black text-gray-900">Reduce Costs</h3>
					<p class="text-gray-600 font-medium mt-2">
						Stop maintaining headless browsers. Pay only for what you use.
					</p>
				</div>

				<div class="mt-auto space-y-3">
					<div
						class="flex items-center justify-between p-3 bg-red-50 border-[2px] border-red-100 rounded-lg opacity-50 grayscale"
					>
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 bg-red-400 rounded-full" />
							<span class="text-xs font-bold text-gray-500 strike-through decoration-red-400"
								>AWS EC2 (Puppeteer)</span
							>
						</div>
						<span class="text-xs font-bold text-gray-400">$400/mo</span>
					</div>
					<div
						class="flex items-center justify-between p-3 bg-[#4ade80]/10 border-[2px] border-[#4ade80] rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] transform scale-105"
					>
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
							<span class="text-xs font-bold text-gray-900">Pictify API</span>
						</div>
						<span class="text-xs font-bold text-gray-900">$39/mo</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes scan {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}
	@keyframes grow {
		0% {
			width: 0%;
		}
		100% {
			width: 75%;
		}
	}
	.strike-through {
		text-decoration: line-through;
	}
</style>
