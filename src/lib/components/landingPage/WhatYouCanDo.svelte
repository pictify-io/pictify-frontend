<script>
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';

	let visible = false;
	let sectionRef;
	let activeHover = null;
	let codeInterval;

	// API Card Animation State
	let apiStep = 0;
	let showResponse = false;
	const apiText = `const img = await pictify.render({
  template: 'product-card',
  variables: {
    product: 'Nike Air',
    price: 129,
    inStock: true
  }
});
// Template logic handles the rest`;

	let displayedApiText = '';

	function typeCode() {
		let i = 0;
		if (codeInterval) clearInterval(codeInterval);
		displayedApiText = '';
		showResponse = false;

		codeInterval = setInterval(() => {
			displayedApiText += apiText[i];
			i++;
			if (i >= apiText.length) {
				clearInterval(codeInterval);
				setTimeout(() => {
					showResponse = true;
				}, 400);
			}
		}, 30);
	}

	function handleApiEnter() {
		activeHover = 'api';
		typeCode();
	}

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						visible = true;
						// Trigger initial animation for API card if visible
						setTimeout(() => {
							if (!activeHover) typeCode();
						}, 1000);
					}
				});
			},
			{ threshold: 0.15 }
		);

		if (sectionRef) observer.observe(sectionRef);

		return () => {
			observer.disconnect();
			if (codeInterval) clearInterval(codeInterval);
		};
	});
</script>

<section bind:this={sectionRef} class="w-full py-20 md:py-32 bg-[#fffdf8] relative overflow-hidden">
	<!-- Background Pattern -->
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none"
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"
	/>

	<div class="max-w-7xl mx-auto px-6 relative z-10 box-border">
		<!-- Header -->
		<div class="text-center mb-20 max-w-3xl mx-auto">
			<div
				class="inline-block mb-4 px-4 py-1.5 bg-[#ffc480] border-[3px] border-black shadow-[4px_4px_0_0_black] rounded-full transform -rotate-2"
			>
				<span class="font-bold text-sm text-black uppercase tracking-wider">The Engine</span>
			</div>

			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
				What Makes It <br />
				<span class="relative inline-block text-[#ff6b6b]">
					Programmable
					<svg
						class="absolute w-full h-4 -bottom-1 left-0 text-black z-[-1] opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>
			</h2>
			<p class="text-xl md:text-2xl text-gray-700 font-medium leading-relaxed">
				Design in a visual editor. Render through a REST API. Scale to millions without config changes.
			</p>
		</div>

		<!-- Bento Grid -->
		<div class="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 auto-rows-[minmax(340px,auto)]">
			<!-- Card 1: Design Freedom (Visual Editor) -->
			<div
				class="md:col-span-12 lg:col-span-7 bg-[#E0F2FE] rounded-[2rem] border-[3px] border-black shadow-[8px_8px_0_0_black] hover:shadow-[12px_12px_0_0_black] transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col md:flex-row"
				on:mouseenter={() => (activeHover = 'design')}
				on:mouseleave={() => (activeHover = null)}
			>
				<!-- Content -->
				<div class="p-8 md:p-10 flex-1 z-10 flex flex-col justify-between">
					<div>
						<div
							class="w-12 h-12 bg-white border-[3px] border-black rounded-xl flex items-center justify-center mb-6 shadow-[4px_4px_0_0_black] group-hover:rotate-6 transition-transform"
						>
							<svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/></svg
							>
						</div>
						<h3 class="text-3xl font-black text-black mb-3 leading-tight">Build Visually.</h3>
						<p class="text-black/70 font-medium text-lg">
							Canvas editor with layers, a properties panel, and real-time preview. No code required to design.
						</p>
					</div>
					<div class="mt-6">
						<span
							class="inline-flex items-center gap-1 font-bold text-black border-b-2 border-black group-hover:gap-2 transition-all"
						>
							Open the Editor <svg
								class="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 8l4 4m0 0l-4 4m4-4H3"
								/></svg
							>
						</span>
					</div>
				</div>

				<!-- Visual: Split Editor/JSON -->
				<div
					class="flex-1 relative h-64 md:h-auto bg-white/50 border-t-[3px] md:border-t-0 md:border-l-[3px] border-black overflow-hidden group-hover:bg-white/80 transition-colors"
				>
					<!-- Draggable elements illusion -->
					{#key activeHover}
						<div class="absolute inset-0 p-6 flex items-center justify-center">
							<div
								class="relative w-48 h-64 bg-white border-[3px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] rounded-lg p-4 transform rotate-2 group-hover:rotate-0 transition-all duration-500"
							>
								<!-- Simulated Canvas -->
								<div
									class="w-full h-24 bg-gray-100 rounded mb-3 overflow-hidden border border-gray-200 relative"
								>
									<img
										src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80"
										class="w-full h-full object-cover"
										alt="preview"
									/>
								</div>
								<div class="h-4 bg-gray-900 w-3/4 rounded mb-2" />
								<div class="h-3 bg-gray-200 w-1/2 rounded mb-4" />

								<!-- Hover Interaction Elements -->
								<div
									class="absolute top-10 right-2 w-8 h-8 bg-[#ff6b6b] rounded-full border-[2px] border-black cursor-move shadow-[2px_2px_0_0_black] transform translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 delay-100 z-20 flex items-center justify-center"
								>
									<svg
										class="w-4 h-4 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
										/></svg
									>
								</div>
							</div>
						</div>
					{/key}
				</div>
			</div>

			<!-- Card 2: Developer Experience (API) -->
			<div
				class="md:col-span-12 lg:col-span-5 bg-[#1F2937] rounded-[2rem] border-[3px] border-black shadow-[8px_8px_0_0_black] hover:shadow-[12px_12px_0_0_black] transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col"
				on:mouseenter={handleApiEnter}
				on:mouseleave={() => (activeHover = null)}
			>
				<div class="p-8 md:p-10 flex-1 relative z-10">
					<div class="flex justify-between items-start mb-6">
						<div
							class="w-12 h-12 bg-gray-800 border-[3px] border-gray-600 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_black]"
						>
							<svg
								class="w-6 h-6 text-[#4ade80]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
								/></svg
							>
						</div>
						<div
							class="px-3 py-1 bg-[#4ade80] text-black text-xs font-bold uppercase rounded-full border border-black"
						>
							50+ Functions
						</div>
					</div>

					<h3 class="text-3xl font-black text-white mb-3">Integrate in Minutes.</h3>
					<p class="text-gray-400 font-medium text-lg mb-8">
						One API call, one JSON payload, one rendered image back. SDKs for Node, Python, and REST.
					</p>

					<!-- Terminal -->
					<div
						class="w-full bg-black/50 rounded-lg p-4 font-mono text-sm border border-gray-700 relative overflow-hidden h-40"
					>
						<div class="flex gap-1.5 mb-3 opacity-50">
							<div class="w-2.5 h-2.5 rounded-full bg-red-500" />
							<div class="w-2.5 h-2.5 rounded-full bg-yellow-500" />
							<div class="w-2.5 h-2.5 rounded-full bg-green-500" />
						</div>
						<div class="text-gray-300 overflow-hidden break-words text-xs md:text-sm">
							<span class="text-[#ff6b6b]">$</span>
							{displayedApiText}<span class="animate-pulse">_</span>
						</div>

						{#if showResponse}
							<div
								class="absolute bottom-0 left-0 right-0 bg-green-900/90 border-t border-green-700 p-2 text-green-300 text-xs flex items-center gap-2"
								in:fly={{ y: 20 }}
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/></svg
								>
								<span>200 OK - Image Generated</span>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Card 3: Infinite Scale (Infrastructure) -->
			<div
				class="md:col-span-12 bg-[#FFF4C3] rounded-[2rem] border-[3px] border-black shadow-[8px_8px_0_0_black] hover:shadow-[12px_12px_0_0_black] transition-all duration-300 relative overflow-hidden group cursor-pointer"
				on:mouseenter={() => (activeHover = 'scale')}
				on:mouseleave={() => (activeHover = null)}
			>
				<div class="grid md:grid-cols-2 h-full">
					<div class="p-8 md:p-10 flex flex-col justify-center relative z-20">
						<!-- Live Monitor Badge -->
						<div
							class="absolute top-8 right-8 md:right-auto md:left-8 md:top-auto md:bottom-8 inline-flex items-center gap-2 px-3 py-1.5 bg-black rounded-lg border border-gray-700 shadow-xl"
						>
							<div class="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
							<div class="font-mono text-xs font-bold text-[#4ade80]">
								{#if visible}
									<span class="tabular-nums"
										>{((Math.floor(Date.now() / 100) % 1000) + 4000).toLocaleString()}</span
									> img/m
								{:else}
									0000 img/m
								{/if}
							</div>
						</div>

						<div
							class="w-12 h-12 bg-[#ff6b6b] border-[3px] border-black rounded-xl flex items-center justify-center mb-6 shadow-[4px_4px_0_0_black] group-hover:-translate-y-1 transition-transform"
						>
							<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
								/></svg
							>
						</div>
						<h3 class="text-3xl font-black text-black mb-3">Scale Instantly.</h3>
						<p class="text-black/70 font-medium text-lg max-w-md mb-8 md:mb-0">
							From 10 to 10 million renders. Images, GIFs, PDFs. No config changes.
						</p>
					</div>

					<!-- Marquee Animation -->
					<div
						class="relative h-64 md:h-full overflow-hidden flex flex-col justify-center border-t-[3px] md:border-t-0 md:border-l-[3px] border-black bg-white"
					>
						<div
							class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"
						/>

						<div
							class="flex flex-col gap-6 py-4 opacity-80 group-hover:opacity-100 transition-opacity duration-500 relative z-10 scale-90 md:scale-100 origin-right"
						>
							<!-- Row 1: Mixed Consumer/Social Assets -->
							<div class="flex gap-4 animate-marquee whitespace-nowrap">
								<!-- 1. Boarding Pass -->
								<div
									class="w-48 h-24 bg-white border-[2px] border-black rounded-xl flex overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] relative shrink-0"
								>
									<div
										class="w-12 h-full bg-gray-900 flex flex-col items-center justify-center border-r-[2px] border-dashed border-gray-600 relative"
									>
										<div
											class="text-white -rotate-90 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap"
										>
											ORD
										</div>
									</div>
									<div class="flex-1 p-3 flex flex-col justify-between">
										<div class="flex justify-between items-start">
											<span class="text-xs font-bold text-gray-400">BOARDING PASS</span>
											<span class="text-xs font-bold text-red-500">GATE A4</span>
										</div>
										<div class="text-2xl font-black text-black tracking-tighter">
											JFK <span class="text-gray-300">✈</span>
										</div>
										<div class="flex gap-1">
											{#each Array(8) as _}<div
													class="h-1 w-full bg-gray-800 rounded-full"
												/>{/each}
										</div>
									</div>
								</div>

								<!-- 2. Instagram Post Style -->
								<div
									class="w-40 h-24 bg-white border-[2px] border-black rounded-xl p-3 flex flex-col gap-2 shrink-0"
								>
									<div class="flex items-center gap-2">
										<div
											class="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1px]"
										>
											<div class="w-full h-full bg-white rounded-full p-[1px]">
												<img
													src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
													alt="avatar"
													class="rounded-full"
												/>
											</div>
										</div>
										<div class="text-[10px] font-bold">@design_daily</div>
									</div>
									<div class="flex gap-2 h-full">
										<div
											class="w-1/2 h-full bg-gray-100 rounded bg-[url('/landing-page/social_bg.png')] bg-cover"
										/>
										<div class="flex-1 flex flex-col gap-1">
											<div class="h-2 w-full bg-gray-200 rounded" />
											<div class="h-2 w-2/3 bg-gray-200 rounded" />
										</div>
									</div>
								</div>

								<!-- 3. Music Player Card -->
								<div
									class="w-48 h-24 bg-[#1f2937] border-[2px] border-black rounded-xl p-3 flex gap-3 shrink-0 text-white relative overflow-hidden"
								>
									<div
										class="w-16 h-16 bg-gray-700 rounded-lg shrink-0 relative group-hover:scale-105 transition-transform"
									>
										<div class="absolute inset-0 flex items-center justify-center">
											<div
												class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center"
											>
												▶
											</div>
										</div>
									</div>
									<div class="flex flex-col justify-center min-w-0 z-10">
										<div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
											Now Playing
										</div>
										<div class="font-bold text-sm truncate w-full">Midnight City</div>
										<div class="h-1 w-full bg-gray-600 rounded-full mt-2 overflow-hidden">
											<div class="h-full w-2/3 bg-[#4ade80]" />
										</div>
									</div>
									<!-- Visualizer bars bg -->
									<div class="absolute bottom-0 right-0 flex items-end gap-1 opacity-20">
										<div class="w-1 h-4 bg-white animate-pulse" />
										<div class="w-1 h-8 bg-white animate-pulse delay-75" />
										<div class="w-1 h-6 bg-white animate-pulse delay-100" />
										<div class="w-1 h-10 bg-white animate-pulse delay-150" />
									</div>
								</div>

								<!-- 4. Review/Testimonial -->
								<!-- 4. Review/Testimonial -->
								<div
									class="w-48 h-24 bg-[#ffc480] border-[2px] border-black rounded-xl p-3 shrink-0 flex flex-col justify-between relative overflow-hidden"
								>
									<div class="text-4xl absolute -top-2 -left-1 opacity-20 font-serif leading-none">
										"
									</div>
									<div class="flex gap-1 text-black text-xs relative z-10">★★★★★</div>
									<p class="text-[10px] font-bold leading-tight relative z-10 whitespace-normal">
										"Absolutely game changing workflow!"
									</p>
									<div class="flex items-center gap-2 mt-auto pt-1">
										<div class="w-6 h-6 rounded-full border border-black overflow-hidden shrink-0">
											<img
												src="/landing-page/profile_sarah.png"
												class="w-full h-full object-cover"
												alt="Sarah Jenkins"
											/>
										</div>
										<div class="text-[9px] font-bold uppercase truncate">Sarah Jenkins</div>
									</div>
								</div>

								<!-- 5. Repeat Boarding Pass (Var) -->
								<div
									class="w-48 h-24 bg-white border-[2px] border-black rounded-xl flex overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] relative shrink-0"
								>
									<div
										class="w-12 h-full bg-[#ff6b6b] flex flex-col items-center justify-center border-r-[2px] border-dashed border-black relative"
									>
										<div
											class="text-white -rotate-90 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap"
										>
											LHR
										</div>
									</div>
									<div class="flex-1 p-3 flex flex-col justify-between">
										<div class="flex justify-between items-start">
											<span class="text-xs font-bold text-gray-400">TICKET</span>
											<span class="text-xs font-bold text-gray-900">VIP</span>
										</div>
										<div class="text-2xl font-black text-black tracking-tighter">
											DXB <span class="text-gray-300">✈</span>
										</div>
										<div class="text-[10px] font-mono text-gray-400">8392-BLK-22</div>
									</div>
								</div>
							</div>

							<!-- Row 2: Business/Data Assets -->
							<div class="flex gap-4 animate-marquee-reverse whitespace-nowrap">
								<!-- 1. Product Card -->
								<div
									class="w-40 h-24 bg-white border-[2px] border-black rounded-xl p-3 flex gap-3 shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] shrink-0 items-center"
								>
									<div
										class="w-12 h-16 bg-gray-100 rounded border border-gray-200 shrink-0 relative flex items-center justify-center"
									>
										<img
											src="/landing-page/product_shoe.png"
											alt="p"
											class="w-full h-full object-cover mix-blend-multiply opacity-80"
										/>
									</div>
									<div class="flex flex-col justify-center min-w-0">
										<div
											class="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 w-fit font-bold mb-1"
										>
											SALE
										</div>
										<div class="font-bold text-sm text-black truncate w-full">Nike Air</div>
										<div class="text-xs text-black font-bold">$129</div>
									</div>
								</div>

								<!-- 2. Invoice/Receipt -->
								<div
									class="w-32 h-24 bg-white border-[2px] border-black rounded-xl p-2 shrink-0 flex flex-col relative overflow-hidden"
								>
									<div class="absolute -right-3 -top-3 w-8 h-8 bg-green-100 rounded-full" />
									<div class="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">
										Invoice #001
									</div>
									<div class="space-y-1 flex-1">
										{#each Array(3) as _}
											<div class="flex justify-between items-center text-[8px] text-gray-600">
												<div class="w-12 h-1 bg-gray-200 rounded" />
												<div class="w-4 h-1 bg-gray-200 rounded" />
											</div>
										{/each}
									</div>
									<div
										class="border-t border-dashed border-gray-300 pt-1 mt-1 flex justify-between items-end"
									>
										<div class="text-[8px] font-bold">Total</div>
										<div class="text-xs font-black text-green-600">$450.00</div>
									</div>
								</div>

								<!-- 3. Graph/Chart -->
								<div
									class="w-40 h-24 bg-white border-[2px] border-black rounded-xl p-3 shrink-0 flex flex-col"
								>
									<div class="flex justify-between items-center mb-2">
										<div class="text-[10px] font-bold uppercase">Growth</div>
										<div class="text-[10px] text-green-500 font-bold">▲ 12%</div>
									</div>
									<div class="flex-1 flex items-end gap-1 px-1 border-b border-l border-gray-200">
										<div class="w-1/5 h-[40%] bg-gray-200 rounded-t-sm" />
										<div class="w-1/5 h-[60%] bg-gray-300 rounded-t-sm" />
										<div class="w-1/5 h-[30%] bg-gray-200 rounded-t-sm" />
										<div class="w-1/5 h-[80%] bg-[#4ade80] rounded-t-sm border border-black/10" />
										<div class="w-1/5 h-[50%] bg-gray-200 rounded-t-sm" />
									</div>
								</div>

								<!-- 4. News/Blog Card -->
								<div
									class="w-48 h-24 bg-white border-[2px] border-black rounded-xl overflow-hidden shrink-0 flex"
								>
									<div class="w-16 h-full bg-gray-200 shrink-0">
										<img
											src="/landing-page/news_tech.png"
											alt="news"
											class="w-full h-full object-cover grayscale"
										/>
									</div>
									<div class="p-2 flex flex-col justify-between">
										<div>
											<div class="text-[8px] font-bold text-[#ff6b6b] uppercase mb-1">Breaking</div>
											<div class="text-[10px] font-bold leading-tight">
												AI Optimizes Image Workflows
											</div>
										</div>
										<div class="flex gap-1 items-center">
											<div class="w-3 h-3 rounded-full bg-gray-300" />
											<div class="text-[8px] text-gray-500">2 min read</div>
										</div>
									</div>
								</div>

								<!-- 5. Real Estate Tag -->
								<div
									class="w-40 h-24 bg-white border-[2px] border-black rounded-xl p-0 shrink-0 overflow-hidden relative group"
								>
									<img
										src="/landing-page/real_estate.png"
										alt="house"
										class="absolute inset-0 w-full h-full object-cover"
									/>
									<div class="absolute inset-x-0 bottom-0 bg-white/95 border-t-2 border-black p-2">
										<div class="text-[10px] font-black uppercase truncate">Modern Loft</div>
										<div class="flex justify-between items-center">
											<div class="text-xs font-bold">$1.2M</div>
											<div class="flex gap-0.5 text-[8px] text-gray-500">
												<span>2bd</span>•<span>2ba</span>
											</div>
										</div>
									</div>
									<div
										class="absolute top-2 right-2 bg-[#ff6b6b] text-white text-[8px] font-bold px-1.5 py-0.5 border border-black shadow-[2px_2px_0_0_black]"
									>
										NEW
									</div>
								</div>
							</div>
						</div>

						<!-- Overlay Gradient -->
						<div
							class="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white/20 to-transparent pointer-events-none md:block hidden z-20"
						/>
						<div
							class="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white/20 to-transparent pointer-events-none md:block hidden z-20"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes marquee {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}
	@keyframes marquee-reverse {
		0% {
			transform: translateX(-50%);
		}
		100% {
			transform: translateX(0);
		}
	}
	.animate-marquee {
		animation: marquee 15s linear infinite;
	}
	.animate-marquee-reverse {
		animation: marquee-reverse 15s linear infinite;
	}
</style>
