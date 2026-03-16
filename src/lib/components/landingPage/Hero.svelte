<script>
	import SignUpButton from './SignUpButton.svelte';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { analytics } from '$lib/analytics.js';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';

	// Demo template config
	const DEMO_TEMPLATE_UID = '4M26J82TW7';

	// Live demo state — matches template variable names
	let header = 'Generate';
	let heading_2 = 'DYNAMIC';
	let header_3 = 'Images';
	let subheading = 'EDIT THE DATA BELOW';

	// Image state
	let imageSrc = '';
	let imageUrl = '';
	let loading = false;
	let lastFetchedKey = '';

	async function renderTemplate(vars) {
		const key = JSON.stringify(vars);
		if (key === lastFetchedKey) return;
		lastFetchedKey = key;
		loading = true;
		try {
			const res = await fetch(`${PUBLIC_BACKEND_URL}/public-render/${DEMO_TEMPLATE_UID}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ variables: vars })
			});
			if (!res.ok) return;
			const data = await res.json();
			imageSrc = data.dataUrl || data.url;
			imageUrl = data.url || '';
		} catch (e) {
			// silently fail — demo is non-critical
		} finally {
			loading = false;
		}
	}

	// Debounced fetch on input change
	let debounceTimer;
	function handleInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			renderTemplate({ header, heading_2, header_3, subheading });
		}, 600);
	}

	// Mobile auto-cycle through preset data
	let mobilePresetIndex = 0;
	const mobilePresets = [
		{
			header: 'Generate',
			heading_2: 'DYNAMIC',
			header_3: 'Images',
			subheading: 'EDIT THE DATA BELOW'
		},
		{
			header: 'Generate',
			heading_2: 'SOCIAL',
			header_3: 'Cards',
			subheading: 'WITH A SINGLE API CALL'
		},
		{ header: 'Ship', heading_2: 'CUSTOM', header_3: 'Visuals', subheading: 'AT SCALE IN SECONDS' }
	];

	let mobileImageSrc = '';
	let mobilePresetUrls = [];

	async function prefetchMobileImages() {
		for (const preset of mobilePresets) {
			try {
				const res = await fetch(`${PUBLIC_BACKEND_URL}/public-render/${DEMO_TEMPLATE_UID}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ variables: preset })
				});
				if (!res.ok) {
					mobilePresetUrls.push('');
					continue;
				}
				const data = await res.json();
				mobilePresetUrls.push(data.dataUrl || data.url || '');
			} catch (e) {
				mobilePresetUrls.push('');
			}
		}
		if (mobilePresetUrls.length > 0) {
			mobileImageSrc = mobilePresetUrls[0];
		}
	}

	onMount(() => {
		// Initial fetch for desktop
		renderTemplate({ header, heading_2, header_3, subheading });

		// Only run mobile cycle on small screens
		const isMobile = window.matchMedia('(max-width: 1023px)').matches;
		let mobileInterval;

		if (isMobile) {
			prefetchMobileImages();
			mobileInterval = setInterval(() => {
				mobilePresetIndex = (mobilePresetIndex + 1) % mobilePresets.length;
				if (mobilePresetUrls[mobilePresetIndex]) {
					mobileImageSrc = mobilePresetUrls[mobilePresetIndex];
				}
			}, 3000);
		}

		return () => {
			if (mobileInterval) clearInterval(mobileInterval);
			clearTimeout(debounceTimer);
		};
	});

	$: mobilePreset = mobilePresets[mobilePresetIndex];

	let mouseX = 0;
	let mouseY = 0;

	function handleMouseMove(e) {
		const { clientX, clientY, currentTarget } = e;
		const { left, top, width, height } = currentTarget.getBoundingClientRect();
		mouseX = (clientX - left) / width - 0.5;
		mouseY = (clientY - top) / height - 0.5;
	}
</script>

<section
	class="w-full py-24 md:py-32 bg-[#FFFDF8] relative overflow-hidden border-b-[3px] border-gray-900"
>
	<!-- Background Pattern from Integrations/Experiments -->
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none"
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"
	/>
	<div
		class="absolute top-1/4 -right-64 w-[800px] h-[800px] bg-[#4ade80]/20 rounded-full blur-[100px] pointer-events-none -z-10"
	/>
	<div
		class="absolute bottom-1/4 -left-64 w-[800px] h-[800px] bg-[#ffc480]/20 rounded-full blur-[100px] pointer-events-none -z-10"
	/>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<!-- Main Header -->
		<div class="text-center mb-20 relative max-w-4xl mx-auto">
			<!-- Rotated Eyebrow Pill -->
			<div
				class="inline-block mb-6 px-6 py-2 bg-[#4ade80] border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] rounded-full transform -rotate-2 hover:rotate-1 hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#1f2937] transition-all cursor-default relative"
			>
				<!-- Sparkle SVG -->
				<svg
					class="absolute -top-3 -right-3 w-6 h-6 text-[#ff6b6b] transform rotate-12"
					fill="currentColor"
					viewBox="0 0 24 24"
					><path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z" /></svg
				>
				<span class="text-sm font-bold text-gray-900 uppercase tracking-wider"
					>Image Generation API</span
				>
			</div>

			<!-- Headline -->
			<h1 class="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
				Generate Images From Data.<br />
				<span class="relative inline-block text-[#ff6b6b] transform rotate-1 mt-2">
					One API Call
					<!-- Scribble Underline -->
					<svg
						class="absolute w-full h-4 sm:h-5 -bottom-2 sm:-bottom-3 left-0 text-black z-[-1] opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>.
			</h1>

			<!-- Subheadline -->
			<p class="text-xl text-gray-700 max-w-2xl mx-auto font-medium mb-10">
				Replace edge-case Puppeteer scripts, hacks, and rendering microservices with a single
				endpoint. Template + JSON in, pixel-perfect image out in &lt;200ms.
			</p>

			<!-- CTAs -->
			<div class="flex flex-col items-center justify-center gap-4">
				<div class="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
					<SignUpButton
						text="Start Building Free"
						location="hero"
						class="w-full sm:w-auto bg-[#ff6b6b] text-white text-lg px-8 py-4 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#000] transition-all font-black uppercase tracking-wider text-center"
					/>

					<a
						href="https://docs.pictify.io"
						target="_blank"
						class="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 text-lg rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#000] transition-all font-bold"
						on:click={() =>
							analytics.trackOutboundLink({
								url: 'https://docs.pictify.io',
								link_text: 'View Docs',
								location: 'hero'
							})}
					>
						<span>View Docs</span>
						<svg
							class="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M14 5l7 7m0 0l-7 7m7-7H3"
							/>
						</svg>
					</a>
				</div>

				<div class="flex items-center gap-3 text-sm text-gray-600 font-bold justify-center mt-2">
					<svg class="w-5 h-5 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M5 13l4 4L19 7"
						/></svg
					>
					<span>50 free credits/mo</span>
					<span class="w-1.5 h-1.5 rounded-full bg-gray-300 mx-1" />
					<span>Plans from $15</span>
				</div>
			</div>
		</div>

		<!-- ============================================== -->
		<!-- V4 CREATIVE: SPLIT PANE INTERACTIVE DEMO       -->
		<!-- ============================================== -->
		<div class="mt-16 sm:mt-24 w-full relative z-10 max-w-6xl mx-auto">
			<div class="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-stretch">
				<!-- Left Side: Interactive Inputs (Floating White Card) -->
				<div class="w-full lg:w-[42%] flex flex-col justify-center relative">
					<!-- Accent background block -->
					<div
						class="absolute inset-0 bg-[#ff6b6b] rounded-3xl transform -rotate-2 -translate-x-2 -translate-y-2 pointer-events-none shadow-[8px_8px_0_0_#1f2937]"
					/>

					<div
						class="bg-white rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] p-8 sm:p-10 relative z-10 flex flex-col h-full group"
					>
						<!-- Quirky Floating Label -->
						<div
							class="absolute -top-4 -right-4 bg-[#ffc480] border-[3px] border-gray-900 rounded-xl px-4 py-1.5 shadow-[4px_4px_0_0_#1f2937] transform rotate-6 group-hover:-rotate-3 transition-transform duration-300"
						>
							<span class="text-xs font-black uppercase text-gray-900 whitespace-nowrap"
								>Edit JSON</span
							>
						</div>

						<h3 class="text-2xl font-black text-gray-900 mb-2">Data Payload</h3>
						<p class="text-sm text-gray-600 font-medium mb-8">
							Changes re-render the image instantly via API.
						</p>

						<div class="mt-auto w-full flex flex-col gap-5">
							<div class="flex flex-col gap-1.5">
								<label
									for="hero-header"
									class="text-[10px] font-black uppercase text-gray-400 tracking-wider"
									>Header Text</label
								>
								<input
									id="hero-header"
									bind:value={header}
									on:input={handleInput}
									class="px-4 py-3 bg-gray-50 border-[2px] border-gray-900 rounded-lg text-sm font-bold text-gray-900 w-full focus:outline-none focus:bg-white focus:border-[#ff6b6b] focus:ring-4 focus:ring-[#ff6b6b]/20 shadow-inner focus:shadow-[2px_2px_0_0_#1f2937] transition-all"
								/>
							</div>
							<div class="flex flex-col gap-1.5">
								<label
									for="hero-header2"
									class="text-[10px] font-black uppercase text-gray-400 tracking-wider"
									>Highlight Text</label
								>
								<input
									id="hero-header2"
									bind:value={heading_2}
									on:input={handleInput}
									class="px-4 py-3 bg-gray-50 border-[2px] border-gray-900 rounded-lg text-sm font-bold text-gray-900 w-full focus:outline-none focus:bg-white focus:border-[#ff6b6b] focus:ring-4 focus:ring-[#ff6b6b]/20 shadow-inner focus:shadow-[2px_2px_0_0_#1f2937] transition-all"
								/>
							</div>
							<div class="flex flex-col gap-1.5">
								<label
									for="hero-header3"
									class="text-[10px] font-black uppercase text-gray-400 tracking-wider"
									>Header 3</label
								>
								<input
									id="hero-header3"
									bind:value={header_3}
									on:input={handleInput}
									class="px-4 py-3 bg-gray-50 border-[2px] border-gray-900 rounded-lg text-sm font-bold text-gray-900 w-full focus:outline-none focus:bg-white focus:border-[#ff6b6b] focus:ring-4 focus:ring-[#ff6b6b]/20 shadow-inner focus:shadow-[2px_2px_0_0_#1f2937] transition-all"
								/>
							</div>
							<div class="flex flex-col gap-1.5">
								<label
									for="hero-subheading"
									class="text-[10px] font-black uppercase text-gray-400 tracking-wider"
									>Subheading (Ribbon)</label
								>
								<input
									id="hero-subheading"
									bind:value={subheading}
									on:input={handleInput}
									class="px-4 py-3 bg-gray-50 border-[2px] border-gray-900 rounded-lg text-sm font-bold text-gray-900 w-full focus:outline-none focus:bg-white focus:border-[#ff6b6b] focus:ring-4 focus:ring-[#ff6b6b]/20 shadow-inner focus:shadow-[2px_2px_0_0_#1f2937] transition-all"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Right Side: Visual Render (Dark Mode Canvas) -->
				<div
					class="w-full lg:w-[58%] relative"
					on:mousemove={handleMouseMove}
					on:mouseleave={() => {
						mouseX = 0;
						mouseY = 0;
					}}
					role="presentation"
					aria-hidden="true"
				>
					<div
						class="bg-white rounded-3xl border-[3px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] hover:shadow-[16px_16px_0_0_#1f2937] transition-all duration-300 overflow-hidden flex flex-col h-full relative z-10 group/canvas"
					>
						<!-- Light macOS Header -->
						<div
							class="bg-gray-100 flex items-center justify-between border-b-[3px] border-gray-900"
						>
							<div class="px-5 flex gap-2 h-full items-center py-4">
								<div class="w-3.5 h-3.5 rounded-full bg-[#ff6b6b] border-[2px] border-gray-900" />
								<div class="w-3.5 h-3.5 rounded-full bg-[#ffc480] border-[2px] border-gray-900" />
								<div class="w-3.5 h-3.5 rounded-full bg-[#4ade80] border-[2px] border-gray-900" />
							</div>
							<div
								class="flex-1 border-l-[3px] border-gray-900 bg-white px-5 py-3 font-mono text-[10px] sm:text-xs text-gray-800 font-bold flex items-center gap-2 truncate cursor-pointer hover:bg-gray-50 transition-colors"
								title="Open API Endpoint"
							>
								<svg
									class="w-4 h-4 shrink-0 text-[#1f2937]"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
									/></svg
								>
								https://api.pictify.io/render/hero
							</div>
						</div>

						<!-- Light Canvas Area -->
						<div
							class="relative flex-1 flex items-center justify-center p-6 sm:p-12 min-h-[350px] lg:min-h-0 bg-[#bfdbfe] overflow-hidden"
						>
							<!-- Blue Dot Grid -->
							<div
								class="absolute inset-0 bg-[radial-gradient(#1e3a8a_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-[0.15] pointer-events-none"
							/>

							<div
								class="relative z-10 w-full max-w-2xl mx-auto transition-transform duration-300 ease-out"
								style="transform: perspective(1000px) rotateX({-mouseY * 1.5}deg) rotateY({mouseX *
									1.5}deg)"
							>
								<!-- Render Widget (floating behind image slightly when hovering) -->
								<div
									class="absolute -top-6 -right-6 bg-white border-[3px] border-gray-900 rounded-xl px-3 py-1.5 shadow-[4px_4px_0_0_#4ade80] flex items-center gap-2 z-0 transform rotate-12 opacity-50 group-hover/canvas:opacity-100 group-hover/canvas:-translate-y-4 group-hover/canvas:translate-x-4 transition-all duration-500"
								>
									<span
										class="w-2 h-2 rounded-full bg-[#4ade80] border border-gray-900 animate-pulse"
									/>
									<span class="text-[9px] font-black uppercase text-gray-900 tracking-widest"
										>Rendering</span
									>
								</div>

								<!-- The Rendered Image -->
								{#if imageSrc}
									<img
										src={imageSrc}
										alt="Live Pictify Demo"
										class="w-full h-full object-contain rounded border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] transition-opacity duration-300 relative z-10 bg-white"
										class:opacity-50={loading}
									/>
								{:else}
									<div
										class="animate-pulse w-full h-[300px] bg-white rounded border-[3px] border-gray-900 flex items-center justify-center"
									>
										<svg
											class="w-8 h-8 text-gray-300"
											fill="none"
											viewBox="0 24 24"
											stroke="currentColor"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
											/></svg
										>
									</div>
								{/if}

								<!-- Loading Overlay -->
								{#if loading}
									<div
										class="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px] z-20 transition-opacity rounded"
									>
										<div
											class="px-5 py-2.5 bg-white text-gray-900 font-black uppercase tracking-widest text-xs rounded border-[3px] border-gray-900 shadow-[4px_4px_0_0_#4ade80] animate-pulse flex items-center gap-2"
										>
											<svg class="w-4 h-4 animate-spin text-[#4ade80]" fill="none" viewBox="0 24 24"
												><circle
													class="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													stroke-width="4"
												/><path
													class="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
												/></svg
											>
											Generating...
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes float {
		0%,
		100% {
			transform: translateY(0px) rotate(-1deg);
		}
		50% {
			transform: translateY(-5px) rotate(1deg);
		}
	}
</style>
