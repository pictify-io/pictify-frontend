<script>
	import { onMount, onDestroy } from 'svelte';

	let activeStep = 0;
	let steps = [0, 1, 2];
	let interval;
	let isPaused = false;

	function startCarousel() {
		interval = setInterval(() => {
			if (!isPaused) {
				activeStep = (activeStep + 1) % steps.length;
			}
		}, 3000);
	}

	function stopCarousel() {
		clearInterval(interval);
	}

	onMount(() => {
		startCarousel();
		return () => stopCarousel();
	});
</script>

<section class="w-full py-24 md:py-32 bg-[#FFFDF8] relative">
	<!-- Decorative Background Elements -->
	<div
		class="absolute top-20 right-0 w-64 h-64 bg-[#ffc480]/20 rounded-full blur-3xl -z-10 pointer-events-none"
	/>
	<div
		class="absolute bottom-0 left-0 w-72 h-72 bg-green-100/40 rounded-full blur-3xl -z-10 pointer-events-none"
	/>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<div class="text-center mb-24">
			<div
				class="inline-block px-4 py-1.5 bg-[#ff6b6b] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform -rotate-2"
			>
				<span class="text-sm font-bold text-white uppercase tracking-wider">How It Works</span>
			</div>
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
				From Data to <br />
				<span class="relative inline-block text-[#ff6b6b]">
					Pixel-Perfect Output
					<svg
						class="absolute w-full h-3 -bottom-1 left-0 text-gray-900 opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
					</svg>
				</span>
			</h2>
			<p class="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
				Three steps. One API call. Under 200ms. <br class="hidden md:block" />
				Here's the entire workflow.
			</p>
		</div>

		<div class="flex flex-col md:flex-row gap-16 lg:gap-32 relative">
			<!-- Left Column: Steps List -->
			<div
				class="flex-1 flex flex-col justify-center gap-8"
				on:mouseenter={() => (isPaused = true)}
				on:mouseleave={() => (isPaused = false)}
				role="region"
				aria-label="How it works steps"
			>
				<!-- Step 1 -->
				<div
					class="transition-opacity duration-300 cursor-pointer {activeStep === 0
						? 'opacity-100'
						: 'opacity-40 hover:opacity-60'}"
					on:click={() => (activeStep = 0)}
					on:keydown={(e) => e.key === 'Enter' && (activeStep = 0)}
					role="button"
					tabindex="0"
				>
					<div class="flex items-center gap-6 mb-4">
						<div
							class="w-16 h-16 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center text-3xl font-bold text-gray-900 rounded-xl transition-transform duration-300 {activeStep ===
							0
								? 'scale-110'
								: 'scale-100'}"
						>
							1
						</div>
						<h3 class="text-3xl font-bold text-gray-900">Build Your Template</h3>
					</div>
					<p
						class="text-xl text-gray-700 leading-relaxed font-medium pl-22 border-l-[3px] border-gray-200 ml-8 pl-8 relative"
					>
						Drag-and-drop canvas. Add <span
							class="bg-blue-100 px-1 border-b-2 border-blue-300">variables</span
						>, conditions, and formatting rules. Save and you're ready to render.
						{#if activeStep === 0 && !isPaused}
							<span class="absolute bottom-0 left-[-3px] w-[3px] bg-gray-900 h-full animate-[progress_3s_linear_origin-bottom]" />
						{/if}
					</p>
				</div>

				<!-- Step 2 -->
				<div
					class="transition-opacity duration-300 cursor-pointer {activeStep === 1
						? 'opacity-100'
						: 'opacity-40 hover:opacity-60'}"
					on:click={() => (activeStep = 1)}
					on:keydown={(e) => e.key === 'Enter' && (activeStep = 1)}
					role="button"
					tabindex="0"
				>
					<div class="flex items-center gap-6 mb-4">
						<div
							class="w-16 h-16 bg-[#ff6b6b] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center text-3xl font-bold text-white rounded-xl transition-transform duration-300 {activeStep ===
							1
								? 'scale-110'
								: 'scale-100'}"
						>
							2
						</div>
						<h3 class="text-3xl font-bold text-gray-900">Send Your Data</h3>
					</div>
					<p
						class="text-xl text-gray-700 leading-relaxed font-medium pl-22 border-l-[3px] border-gray-200 ml-8 pl-8 relative"
					>
						Just send raw data — the template's logic handles the rest. <span
							class="bg-red-100 px-1 border-b-2 border-red-300">200ms later</span
						>, your visual is ready.
						{#if activeStep === 1 && !isPaused}
							<span class="absolute bottom-0 left-[-3px] w-[3px] bg-gray-900 h-full animate-[progress_3s_linear_origin-bottom]" />
						{/if}
					</p>
				</div>

				<!-- Step 3 -->
				<div
					class="transition-opacity duration-300 cursor-pointer {activeStep === 2
						? 'opacity-100'
						: 'opacity-40 hover:opacity-60'}"
					on:click={() => (activeStep = 2)}
					on:keydown={(e) => e.key === 'Enter' && (activeStep = 2)}
					role="button"
					tabindex="0"
				>
					<div class="flex items-center gap-6 mb-4">
						<div
							class="w-16 h-16 bg-[#4ade80] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center text-3xl font-bold text-gray-900 rounded-xl transition-transform duration-300 {activeStep ===
							2
								? 'scale-110'
								: 'scale-100'}"
						>
							3
						</div>
						<h3 class="text-3xl font-bold text-gray-900">Get Your Output</h3>
					</div>
					<p
						class="text-xl text-gray-700 leading-relaxed font-medium pl-22 border-l-[3px] border-gray-200 ml-8 pl-8 relative"
					>
						Get a URL to share, embed, or download. PNG, JPG, WebP, GIF, PDF, or video.
						{#if activeStep === 2 && !isPaused}
							<span class="absolute bottom-0 left-[-3px] w-[3px] bg-gray-900 h-full animate-[progress_3s_linear_origin-bottom]" />
						{/if}
					</p>
				</div>
			</div>

			<!-- Right Column: Sticky Visuals -->
			<div class="flex-1 hidden md:block relative">
				<div class="sticky top-32 h-[500px] w-full">
					<div
						class="relative w-full h-full bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_#000] rounded-[2rem] overflow-hidden"
					>
						<!-- Visual 1: Template Editor (Neo-Brutalist) -->
						<div
							class="absolute inset-0 transition-all duration-500 transform {activeStep === 0
								? 'translate-y-0 opacity-100'
								: activeStep > 0
								? '-translate-y-full opacity-0'
								: 'translate-y-full opacity-0'} flex items-center justify-center bg-[#f3f4f6] p-8"
						>
							<div
								class="w-full h-full bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-xl flex flex-col overflow-hidden"
							>
								<!-- Toolbar -->
								<div
									class="h-12 bg-white border-b-[3px] border-gray-900 flex items-center px-4 gap-3"
								>
									<div class="w-4 h-4 rounded-full bg-white border-[2px] border-gray-900" />
									<div class="w-4 h-4 rounded-full bg-white border-[2px] border-gray-900" />
									<div class="h-6 w-[2px] bg-gray-900 mx-2" />
									<div class="flex-1 font-bold text-sm text-gray-900">TEMPLATE_EDITOR.exe</div>
								</div>
								<div class="flex-1 flex">
									<!-- Sidebar -->
									<div
										class="w-16 border-r-[3px] border-gray-900 flex flex-col items-center py-4 gap-4 bg-[#ffc480]/20"
									>
										<div
											class="w-10 h-10 bg-white border-[2px] border-gray-900 rounded-lg shadow-[2px_2px_0_0_#000]"
										/>
										<div
											class="w-10 h-10 bg-white border-[2px] border-gray-900 rounded-lg shadow-[2px_2px_0_0_#000]"
										/>
										<div
											class="w-10 h-10 bg-white border-[2px] border-gray-900 rounded-lg shadow-[2px_2px_0_0_#000]"
										/>
									</div>
									<!-- Canvas -->
									<div
										class="flex-1 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] p-6 flex items-center justify-center"
									>
										<div
											class="w-64 aspect-video bg-white border-[3px] border-gray-900 shadow-[6px_6px_0_0_#000] flex flex-col relative"
										>
											<div class="h-2/3 bg-[#ff6b6b] border-b-[3px] border-gray-900 p-4">
												<div class="w-1/2 h-4 bg-white border-[2px] border-gray-900 mb-2" />
											</div>
											<div class="flex-1 p-3 flex justify-between items-center">
												<div
													class="w-8 h-8 rounded-full border-[2px] border-gray-900 bg-gray-100"
												/>
												<div
													class="px-3 py-1 bg-[#4ade80] border-[2px] border-gray-900 text-xs font-bold"
												>
													BUTTON
												</div>
											</div>
											<!-- Cursor -->
											<div class="absolute bottom-4 right-12 w-4 h-4">
												<svg viewBox="0 0 24 24" fill="black" class="w-6 h-6 drop-shadow-md"
													><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg
												>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Visual 2: API Request (Retro Terminal) -->
						<div
							class="absolute inset-0 transition-all duration-500 transform {activeStep === 1
								? 'translate-y-0 opacity-100'
								: activeStep > 1
								? '-translate-y-full opacity-0'
								: 'translate-y-full opacity-0'} flex items-center justify-center bg-[#ff6b6b] p-8"
						>
							<div
								class="w-full max-w-md bg-black border-[3px] border-gray-900 shadow-[8px_8px_0_0_#000] rounded-xl overflow-hidden"
							>
								<div
									class="bg-white border-b-[3px] border-gray-900 p-2 flex items-center justify-between px-4"
								>
									<span class="font-bold text-gray-900">TERMINAL</span>
									<div class="flex gap-2">
										<div class="w-3 h-3 bg-gray-900 rounded-full" />
										<div class="w-3 h-3 bg-gray-900 rounded-full" />
									</div>
								</div>
								<div class="p-6 font-mono text-sm text-green-400">
									<div class="mb-4">
										<span class="text-[#ff6b6b]">user@pictify:~$</span> curl -X POST /generate
									</div>
									<div class="text-white opacity-90">
										{`{`}
										<div class="pl-4"><span class="text-[#ffc480]">"template"</span>: "promo",</div>
										<div class="pl-4"><span class="text-[#ffc480]">"variables"</span>: {`{`}</div>
										<div class="pl-8">"product": "Nike Air",</div>
										<div class="pl-8">"price": <span class="text-[#4ade80]">129</span>,</div>
										<div class="pl-8">"inStock": <span class="text-[#4ade80]">true</span></div>
										<div class="pl-4">{`}`}</div>
										{`}`}
									</div>
									<div class="mt-4 animate-pulse">_</div>
								</div>
							</div>
						</div>

						<!-- Visual 3: Final Result (Pop Card) -->
						<div
							class="absolute inset-0 transition-all duration-500 transform {activeStep === 2
								? 'translate-y-0 opacity-100'
								: activeStep > 2
								? '-translate-y-full opacity-0'
								: 'translate-y-full opacity-0'} flex items-center justify-center bg-[#4ade80] p-8"
						>
							<div class="relative group">
								<div class="absolute inset-0 bg-black translate-x-3 translate-y-3 rounded-xl" />
								<div
									class="relative w-[400px] bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden transform transition-transform group-hover:-translate-y-1 group-hover:-translate-x-1"
								>
									<img
										src="https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png"
										alt="Generated Result"
										class="w-full h-auto object-cover border-b-[3px] border-gray-900"
									/>
									<div class="p-4 flex items-center justify-between bg-white">
										<div class="font-bold text-gray-900">generated_image.png</div>
										<div
											class="px-3 py-1 bg-[#4ade80] border-[2px] border-gray-900 text-xs font-bold shadow-[2px_2px_0_0_#000]"
										>
											SUCCESS
										</div>
									</div>
								</div>

								<!-- Decorative Elements -->
								<div
									class="absolute -top-6 -right-6 w-12 h-12 bg-[#ffc480] rounded-full border-[3px] border-gray-900 flex items-center justify-center font-bold shadow-[3px_3px_0_0_#000] animate-bounce"
								>
									<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M5 13l4 4L19 7"
										/></svg
									>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes progress {
		0% { height: 0%; }
		100% { height: 100%; }
	}
</style>
