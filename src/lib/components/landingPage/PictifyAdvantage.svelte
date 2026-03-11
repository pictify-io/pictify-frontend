<script>
	import { onMount } from 'svelte';

	let isPictify = true;
	let generationTime = 0;
	let cost = 0;

	// Animation for numbers
	onMount(() => {
		const interval = setInterval(() => {
			if (isPictify) {
				// Fast, low numbers
				generationTime = Math.floor(Math.random() * 50) + 100;
				cost = 49;
			} else {
				// Slow, high numbers
				generationTime = Math.floor(Math.random() * 1000) + 2500;
				cost += 0.01; // Cost creeping up
			}
		}, 100);

		return () => clearInterval(interval);
	});
</script>

<section
	class="w-full py-24 md:py-32 bg-[#FFFDF8] relative overflow-hidden transition-colors duration-700 {isPictify
		? ''
		: 'bg-gray-900'}"
>
	<!-- Dynamic Background -->
	<div
		class="absolute inset-0 transition-opacity duration-700 {isPictify
			? 'opacity-30'
			: 'opacity-0'}"
	>
		<div
			class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"
		/>
		<div
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#ff6b6b]/5 via-[#4ade80]/5 to-[#ffc480]/5 rounded-full blur-3xl"
		/>
	</div>

	<!-- Glitch Background for 'Old Way' -->
	<div
		class="absolute inset-0 transition-opacity duration-700 {isPictify
			? 'opacity-0 pointer-events-none'
			: 'opacity-20'}"
	>
		<div
			class="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_1px,#000_1px,#000_2px)] bg-[length:100%_4px]"
		/>
		<div class="absolute inset-0 bg-noise opacity-50 mix-blend-overlay" />
	</div>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<!-- Header -->
		<div class="text-center mb-16">
			<!-- Master Toggle -->
			<div class="flex justify-center mb-12">
				<div
					class="relative p-1 bg-black rounded-xl border-[4px] border-gray-900 shadow-[8px_8px_0_0_#9ca3af] cursor-pointer w-full max-w-[20rem] h-16 sm:h-20 flex items-center transition-all duration-300 hover:shadow-[12px_12px_0_0_#9ca3af] hover:-translate-y-1 active:translate-y-0 active:shadow-[4px_4px_0_0_#9ca3af]"
					on:click={() => (isPictify = !isPictify)}
					on:keydown={(e) => e.key === 'Enter' && (isPictify = !isPictify)}
					role="switch"
					aria-checked={isPictify}
					tabindex="0"
				>
					<!-- Sliding Brick -->
					<div
						class="absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] border-[3px] border-gray-900 rounded-lg shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-10 flex items-center justify-center font-black uppercase text-sm tracking-widest pointer-events-none {isPictify
							? 'bg-[#4ade80] shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]'
							: 'bg-[#ff6b6b] shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]'}"
						style="transform: translateX({isPictify ? '100%' : '0%'})"
					>
						<span class="text-black">{isPictify ? 'Pictify Cloud' : 'Puppeteer Stack'}</span>
					</div>

					<!-- Track Backgrounds -->
					<div class="absolute inset-0 flex pointer-events-none">
						<div
							class="w-1/2 flex items-center justify-center bg-gray-900 rounded-l-lg border-r-[3px] border-gray-900/20"
						>
							<span
								class="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none"
								>Switch to Pain</span
							>
						</div>
						<div class="w-1/2 flex items-center justify-center bg-gray-100 rounded-r-lg">
							<span
								class="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest leading-none"
								>Switch to Joy</span
							>
						</div>
					</div>
				</div>
			</div>

			<h2
				class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight {!isPictify
					? 'text-white font-mono'
					: ''}"
			>
				{#if isPictify}
					Stop Wrestling with<br />
					<span class="relative inline-block text-[#ff6b6b]">
						Headless Chrome.
						<svg
							class="absolute w-full h-3 -bottom-1 left-0 text-gray-900 opacity-20"
							viewBox="0 0 100 10"
							preserveAspectRatio="none"
						>
							<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
						</svg>
					</span>
				{:else}
					<span class="text-[#ff6b6b] bg-black px-2">SYSTEM OVERLOAD</span> <br />
					<span class="opacity-50 text-3xl sm:text-4xl">Puppeteer Cluster Failure</span>
				{/if}
			</h2>
			<p
				class="text-xl transition-colors duration-500 font-bold max-w-2xl mx-auto {isPictify
					? 'text-gray-700'
					: 'text-red-400 font-mono'}"
			>
				{#if isPictify}
					Ditch brittle screenshot scripts and rendering hacks. 10x faster renders. Zero DevOps.
				{:else}
					> [CRITICAL] Headless Chrome process hanging.
					<br />> Memory limit exceeded.
				{/if}
			</p>
		</div>

		<!-- Dashboard Grid -->
		<div class="grid lg:grid-cols-3 gap-6 relative">
			<!-- Card 1: Cold Starts -->
			<!-- Card 1: Cold Starts -->
			<div
				class="bg-white rounded-[2rem] border-[3px] border-gray-900 p-8 transition-all duration-500 relative overflow-hidden group {isPictify
					? 'shadow-[8px_8px_0_0_#1f2937]'
					: 'shadow-[8px_8px_0_0_#ef4444] border-red-500 bg-gray-900 animate-shake'}"
			>
				<div class="flex justify-between items-start mb-4">
					<div
						class="text-lg font-black uppercase tracking-widest {isPictify
							? 'text-black'
							: 'text-red-500'}"
					>
						Cold Starts
					</div>
					<div
						class="w-3 h-3 rounded-full animate-pulse {isPictify ? 'bg-[#4ade80]' : 'bg-red-500'}"
					/>
				</div>
				<div
					class="text-5xl font-black tabular-nums tracking-tighter mb-2 transition-colors {isPictify
						? 'text-black'
						: 'text-white'}"
				>
					{isPictify ? '<500' : (generationTime / 1000).toFixed(1) + 's'}<span
						class="text-2xl opacity-50">{isPictify ? 'ms' : ''}</span
					>
				</div>
				<div
					class="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4 border border-gray-900/10"
				>
					<div
						class="h-full transition-all duration-300 {isPictify
							? 'bg-[#4ade80] w-[15%]'
							: 'bg-red-500 w-[95%]'}"
					/>
				</div>
				<p
					class="text-sm font-medium leading-tight {isPictify
						? 'text-gray-600'
						: 'text-red-400 font-mono'}"
				>
					{isPictify
						? '150ms average. Your old solution? 2-5 seconds.'
						: '2-5s latency. Your users are bouncing.'}
				</p>
			</div>

			<!-- Card 2: Designer Flow -->
			<!-- Card 2: Designer Flow -->
			<div
				class="bg-white rounded-[2rem] border-[3px] border-gray-900 p-8 transition-all duration-500 relative overflow-hidden group {isPictify
					? 'shadow-[8px_8px_0_0_#1f2937]'
					: 'shadow-[8px_8px_0_0_#ef4444] border-red-500 bg-gray-900 animate-shake'}"
			>
				<div class="flex justify-between items-start mb-4">
					<div
						class="text-lg font-black uppercase tracking-widest {isPictify
							? 'text-black'
							: 'text-red-500'}"
					>
						Designer Flow
					</div>
					<svg
						class="w-5 h-5 {isPictify ? 'text-black' : 'text-red-500'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d={isPictify
								? 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
								: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'}
						/></svg
					>
				</div>

				<div
					class="relative h-24 mb-4 rounded-xl border-2 flex items-center justify-center overflow-hidden transition-colors {isPictify
						? 'border-gray-200 bg-gray-50'
						: 'border-red-900 bg-black'}"
				>
					{#if isPictify}
						<div class="flex gap-2">
							<div
								class="w-8 h-8 rounded bg-white border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] transform -rotate-3"
							/>
							<div
								class="w-8 h-8 rounded bg-[#ff6b6b] border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] transform rotate-3 flex items-center justify-center text-white font-bold text-xs"
							>
								P
							</div>
						</div>
					{:else}
						<div class="font-mono text-xs text-red-500 p-2 opacity-80 leading-relaxed text-center">
							&lt;div style="..."&gt;<br />
							const ctx = canvas...<br />
							// CSS Nightmare
						</div>
					{/if}
				</div>

				<p
					class="text-sm font-medium leading-tight {isPictify
						? 'text-gray-600'
						: 'text-red-400 font-mono'}"
				>
					{isPictify
						? 'Visual editor with expressions, AI copilot, and A/B testing. No deploys needed.'
						: 'Code-Only. Dev Time: Weeks.'}
				</p>
			</div>

			<!-- Card 3: Maintenance -->
			<!-- Card 3: Maintenance -->
			<div
				class="bg-white rounded-[2rem] border-[3px] border-gray-900 p-8 transition-all duration-500 relative overflow-hidden group {isPictify
					? 'shadow-[8px_8px_0_0_#1f2937]'
					: 'shadow-[8px_8px_0_0_#ef4444] border-red-500 bg-gray-900 animate-shake'}"
			>
				<div class="flex justify-between items-start mb-4">
					<div
						class="text-lg font-black uppercase tracking-widest {isPictify
							? 'text-black'
							: 'text-red-500'}"
					>
						Maintenance
					</div>
					<div
						class="text-xs font-bold px-2 py-0.5 rounded border {isPictify
							? 'bg-[#4ade80]/20 text-[#166534] border-[#166534]'
							: 'bg-red-900/20 text-red-500 border-red-500'}"
					>
						{isPictify ? 'ZERO' : 'HIGH'}
					</div>
				</div>
				<div
					class="text-5xl font-black tabular-nums tracking-tighter mb-2 transition-colors {isPictify
						? 'text-black'
						: 'text-white'}"
				>
					{isPictify ? '10x' : '-20%'}<span class="text-2xl opacity-50"
						>{isPictify ? ' Faster' : ''}</span
					>
				</div>

				{#if !isPictify}
					<div
						class="text-[10px] items-center font-bold flex gap-2 text-red-400 font-mono mb-6 uppercase tracking-wider"
					>
						<div class="w-1.5 h-1.5 animate-pulse rounded-full bg-red-500" />
						Constant Updates
					</div>
				{:else}
					<div
						class="text-[10px] items-center font-bold flex gap-2 text-gray-400 mb-6 uppercase tracking-wider"
					>
						<div class="w-1.5 h-1.5 rounded-full bg-gray-300" />
						vs headless Chrome
					</div>
				{/if}
				<p
					class="text-sm font-medium leading-tight {isPictify
						? 'text-gray-600'
						: 'text-red-400 font-mono'}"
				>
					{isPictify
						? 'Save $350+/mo in DevOps. Plus: experiments, smart links, and auto-optimization built in.'
						: 'Endless library updates and breaking changes.'}
				</p>
			</div>
		</div>
	</div>
</section>

<style>
	.bg-noise {
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
	}
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		10%,
		30%,
		50%,
		70%,
		90% {
			transform: translateX(-2px);
		}
		20%,
		40%,
		60%,
		80% {
			transform: translateX(2px);
		}
	}
	.animate-shake {
		animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
	}
</style>
