<script>
	import { onMount } from 'svelte';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';

	// Animated bar widths for auto-optimize
	let barWidths = [45, 30, 25];

	// Shared demo template
	const DEMO_TEMPLATE_UID = '4M26J82TW7';

	// A/B test demo state
	let showingVariant = 'A';
	let abVariantAImage = '';
	let abVariantBImage = '';
	let abLoading = false;

	const AB_VARIANTS = {
		A: {
			header: 'Save 20%',
			heading_2: 'TODAY',
			header_3: 'User',
			subheading: 'Limited Time Offer'
		},
		B: {
			header: 'Get 20% Off',
			heading_2: 'NOW',
			header_3: 'User',
			subheading: 'Flash Sale Ending Soon'
		}
	};

	function switchVariant() {
		showingVariant = showingVariant === 'A' ? 'B' : 'A';
	}

	async function fetchABVariants() {
		abLoading = true;
		try {
			const [resA, resB] = await Promise.all([
				fetch(`${PUBLIC_BACKEND_URL}/public-render/${DEMO_TEMPLATE_UID}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ variables: AB_VARIANTS.A })
				}),
				fetch(`${PUBLIC_BACKEND_URL}/public-render/${DEMO_TEMPLATE_UID}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ variables: AB_VARIANTS.B })
				})
			]);
			if (resA.ok) {
				const dataA = await resA.json();
				abVariantAImage = dataA.dataUrl || dataA.url;
			}
			if (resB.ok) {
				const dataB = await resB.json();
				abVariantBImage = dataB.dataUrl || dataB.url;
			}
		} catch (e) {
			// Silently fail — demo is non-critical
		} finally {
			abLoading = false;
		}
	}

	// --- Live URL (Binding) demo state ---
	const DEMO_BINDING_ID = 'bind_G5DP7TTD83KP';
	const DEMO_TEMPLATE_LIVE = 'PCGH0AQ4K3';
	let liveUrlImageSrc = '';
	let liveUrlLoading = false;
	let liveUrlDataIndex = 0;

	const LIVE_URL_DATA_PRESETS = [
		{
			label: 'Default',
			heading: 'UNIFORM ARCHITECTURE',
			body: 'STRUCTURAL',
			ctaText: 'DISCOVER MORE'
		},
		{
			label: 'Product Launch',
			heading: 'SMART LINKS ARE HERE',
			body: 'PERSONALIZED',
			ctaText: 'GET STARTED'
		},
		{
			label: 'Flash Sale',
			heading: '50% OFF TODAY ONLY',
			body: 'LIMITED TIME',
			ctaText: 'SHOP NOW'
		},
		{
			label: 'Dashboard KPI',
			heading: 'REVENUE: $42,850',
			body: 'UP 23% MOM',
			ctaText: 'VIEW REPORT'
		}
	];

	async function fetchLiveUrlImage() {
		liveUrlLoading = true;
		const preset = LIVE_URL_DATA_PRESETS[liveUrlDataIndex];
		try {
			const res = await fetch(`${PUBLIC_BACKEND_URL}/public-render/${DEMO_TEMPLATE_LIVE}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ variables: preset })
			});
			if (res.ok) {
				const data = await res.json();
				liveUrlImageSrc = data.url || data.dataUrl;
			}
		} catch (e) {
			// Silently fail
		} finally {
			liveUrlLoading = false;
		}
	}

	async function switchLiveUrlData() {
		liveUrlDataIndex = (liveUrlDataIndex + 1) % LIVE_URL_DATA_PRESETS.length;
		await fetchLiveUrlImage();
	}

	$: liveUrlLabel = LIVE_URL_DATA_PRESETS[liveUrlDataIndex].label;

	// --- Smart Link live demo state ---
	// Uses the real running smart link: /s/demo-smart-link.png
	// Server resolves variant + context variables using viewer's local time (from geo timezone)

	const SMART_LINK_SLUG = 'demo-smart-link';

	let viewerContext = null;
	let smartLinkImageSrc = '';
	let smartLinkLoading = false;
	let activeRuleName = '';

	// Friendly names
	const CONTINENT_NAMES = {
		NA: 'North America',
		SA: 'South America',
		EU: 'Europe',
		AS: 'Asia',
		AF: 'Africa',
		OC: 'Oceania'
	};

	function getTimeOfDay(hour) {
		if (hour >= 5 && hour < 12) return 'morning';
		if (hour >= 12 && hour < 17) return 'afternoon';
		if (hour >= 17 && hour < 21) return 'evening';
		return 'night';
	}

	// Demo scenarios — each overrides different context properties via query params
	const DEMO_SCENARIOS = [
		{ name: 'Morning in Tokyo', params: '_hour=9&_country=JP', rule: 'time.hour=9, country=JP' },
		{
			name: 'Afternoon in New York',
			params: '_hour=14&_country=US',
			rule: 'time.hour=14, country=US'
		},
		{ name: 'Evening in London', params: '_hour=20&_country=GB', rule: 'time.hour=20, country=GB' },
		{ name: 'Night Owl in Berlin', params: '_hour=2&_country=DE', rule: 'time.hour=2, country=DE' },
		{
			name: 'Mobile in Mumbai',
			params: '_hour=10&_device=mobile&_country=IN',
			rule: 'time.hour=10, device=mobile, country=IN'
		}
	];

	function resolveActiveRule(hour) {
		if (hour >= 6 && hour <= 11) return 'time.hour in [6..11] → Morning';
		if (hour >= 12 && hour <= 17) return 'time.hour in [12..17] → Afternoon';
		if (hour >= 18 && hour <= 23) return 'time.hour in [18..23] → Evening';
		return 'time.hour in [0..5] → Night Owl';
	}

	let demoScenarioIndex = -1; // -1 = real/your context
	$: demoLabel = demoScenarioIndex === -1 ? 'Your Context' : DEMO_SCENARIOS[demoScenarioIndex].name;

	async function fetchSmartLinkImage() {
		smartLinkLoading = true;
		try {
			// Fetch viewer context for display chips — server returns local time from geo timezone
			const ctxRes = await fetch(`${PUBLIC_BACKEND_URL}/public-render/context`);
			if (ctxRes.ok) {
				viewerContext = await ctxRes.json();
			} else {
				viewerContext = {
					device: { type: 'desktop', os: 'unknown', browser: 'unknown' },
					geo: { country: null, continent: null },
					time: { hour: new Date().getHours(), dayOfWeek: new Date().getDay() },
					browser: { language: navigator?.language?.split('-')[0] || null }
				};
			}
			activeRuleName = resolveActiveRule(viewerContext.time?.hour ?? 12);

			// Use the REAL smart link endpoint — server resolves variant + context variables using local time
			smartLinkImageSrc = `/s/${SMART_LINK_SLUG}.png?t=${Date.now()}`;
		} catch (e) {
			// Silently fail — demo is non-critical
		} finally {
			smartLinkLoading = false;
		}
	}

	function switchDemoContext() {
		smartLinkLoading = true;
		demoScenarioIndex++;
		if (demoScenarioIndex >= DEMO_SCENARIOS.length) {
			demoScenarioIndex = -1;
		}

		if (demoScenarioIndex === -1) {
			// Real context — no override
			activeRuleName = resolveActiveRule(viewerContext?.time?.hour ?? 12);
			smartLinkImageSrc = `/s/${SMART_LINK_SLUG}.png?t=${Date.now()}`;
		} else {
			const scenario = DEMO_SCENARIOS[demoScenarioIndex];
			activeRuleName = scenario.rule;
			// Override server context via query params
			smartLinkImageSrc = `/s/${SMART_LINK_SLUG}.png?${scenario.params}&t=${Date.now()}`;
		}
	}

	onMount(() => {
		fetchABVariants();
		fetchLiveUrlImage();
		fetchSmartLinkImage();

		const optimizeInterval = setInterval(() => {
			barWidths = [
				Math.min(75, barWidths[0] + (Math.random() * 3 - 0.5)),
				Math.max(10, barWidths[1] - Math.random() * 1.5),
				Math.max(5, barWidths[2] - Math.random() * 1)
			];
		}, 500);
		return () => clearInterval(optimizeInterval);
	});
</script>

<section
	class="w-full py-24 md:py-32 bg-[#FFFDF8] relative overflow-hidden border-y-[3px] border-gray-900"
>
	<!-- Background Pattern -->
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none"
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"
	/>
	<div
		class="absolute top-1/4 -right-64 w-[800px] h-[800px] bg-[#ffc480]/20 rounded-full blur-[100px] pointer-events-none -z-10"
	/>
	<div
		class="absolute bottom-1/4 -left-64 w-[800px] h-[800px] bg-[#ff6b6b]/20 rounded-full blur-[100px] pointer-events-none -z-10"
	/>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<!-- Main Header -->
		<div class="text-center mb-24 relative max-w-4xl mx-auto">
			<div
				class="inline-block mb-6 px-6 py-2 bg-[#4ade80] border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] rounded-full transform -rotate-2 hover:rotate-1 hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#1f2937] transition-all cursor-default"
			>
				<span class="text-sm font-bold text-gray-900 uppercase tracking-wider"
					>Only on Pictify</span
				>
			</div>

			<h2
				class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight"
			>
				Optimize Every <br />
				<span class="relative inline-block text-[#ff6b6b] transform rotate-1 mt-2">
					Visual
					<svg
						class="absolute w-full h-4 -bottom-2 left-0 text-black z-[-1] opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>
				Automatically.
			</h2>

			<p class="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
				Test variants, target exact context, and let our bandit algorithm pick the winners. Stop
				guessing what works.
			</p>
		</div>

		<!-- Bento Grid Showcase -->
		<div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
			<!-- Block 1: A/B Testing (Spans 7 cols) -->
			<div
				class="xl:col-span-7 bg-white rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] transition-all duration-300 relative overflow-hidden group flex flex-col"
			>
				<div
					class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"
				/>

				<div class="p-8 md:p-10 flex-1 flex flex-col">
					<div class="flex items-center gap-4 mb-6">
						<div
							class="w-14 h-14 bg-[#ffc480] border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] group-hover:-rotate-6 transition-transform"
						>
							<span class="font-black text-2xl">A/B</span>
						</div>
						<h3 class="text-3xl md:text-4xl font-black text-gray-900">Split Test</h3>
					</div>

					<p class="text-lg text-gray-700 font-medium mb-8">
						Create variants with distinct copy and layouts. We split traffic natively.
					</p>

					<!-- Visual -->
					<div
						class="mt-auto bg-gray-50 border-[3px] border-gray-900 rounded-2xl p-4 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)]"
					>
						<div class="flex flex-col sm:flex-row gap-4">
							<!-- Variant A -->
							<div
								class="flex-1 rounded-xl border-[3px] border-gray-900 bg-white shadow-[4px_4px_0_0_#1f2937] overflow-hidden transform transition-all {showingVariant ===
								'A'
									? '-translate-y-2 shadow-[8px_8px_0_0_#3b82f6]'
									: 'opacity-60 grayscale'}"
							>
								<div
									class="bg-blue-500 text-white px-3 py-1.5 border-b-[3px] border-gray-900 flex justify-between items-center"
								>
									<span class="font-black text-xs uppercase tracking-wider">Variant A</span>
									{#if showingVariant === 'A'}
										<span
											class="px-2 py-0.5 bg-white text-blue-500 text-[10px] font-black rounded border border-gray-900 shadow-[2px_2px_0_0_#1f2937] animate-pulse"
											>LIVE</span
										>
									{/if}
								</div>
								<div class="aspect-[1200/630] flex items-center justify-center p-2">
									{#if abVariantAImage}
										<img
											src={abVariantAImage}
											alt="A/B Variant A"
											class="w-full h-full object-contain rounded border-2 border-gray-900/10"
										/>
									{:else}
										<div class="animate-pulse w-full h-full bg-gray-200 rounded" />
									{/if}
								</div>
								<div
									class="bg-black/5 px-3 py-2 border-t-[3px] border-gray-900 flex justify-between items-center text-xs font-black"
								>
									<span>CTR</span>
									<span class="text-blue-600">3.2%</span>
								</div>
							</div>

							<!-- Variant B -->
							<div
								class="flex-1 rounded-xl border-[3px] border-gray-900 bg-white shadow-[4px_4px_0_0_#1f2937] overflow-hidden transform transition-all {showingVariant ===
								'B'
									? '-translate-y-2 shadow-[8px_8px_0_0_#a855f7]'
									: 'opacity-60 grayscale'}"
							>
								<div
									class="bg-purple-500 text-white px-3 py-1.5 border-b-[3px] border-gray-900 flex justify-between items-center"
								>
									<span class="font-black text-xs uppercase tracking-wider">Variant B</span>
									{#if showingVariant === 'B'}
										<span
											class="px-2 py-0.5 bg-white text-purple-500 text-[10px] font-black rounded border border-gray-900 shadow-[2px_2px_0_0_#1f2937] animate-pulse"
											>LIVE</span
										>
									{/if}
								</div>
								<div class="aspect-[1200/630] flex items-center justify-center p-2">
									{#if abVariantBImage}
										<img
											src={abVariantBImage}
											alt="A/B Variant B"
											class="w-full h-full object-contain rounded border-2 border-gray-900/10"
										/>
									{:else}
										<div class="animate-pulse w-full h-full bg-gray-200 rounded" />
									{/if}
								</div>
								<div
									class="bg-black/5 px-3 py-2 border-t-[3px] border-gray-900 flex justify-between items-center text-xs font-black"
								>
									<span>CTR</span>
									<span class="text-purple-600">4.1%</span>
								</div>
							</div>
						</div>

						<button
							class="w-full mt-4 py-3 bg-[#ffc480] text-black font-black uppercase tracking-wider rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
							on:click={switchVariant}
						>
							Force Switch Traffic
						</button>
					</div>
				</div>
			</div>

			<!-- Block 2: Auto-Optimize (Spans 5 cols) -->
			<div
				class="xl:col-span-5 bg-[#4ade80] rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] transition-all duration-300 relative overflow-hidden group flex flex-col"
			>
				<div class="absolute inset-0 bg-white/10 pointer-events-none" />

				<div class="p-8 md:p-10 flex-1 flex flex-col">
					<div class="flex items-center gap-4 mb-6">
						<div
							class="w-14 h-14 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] group-hover:rotate-6 transition-transform"
						>
							<svg class="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/></svg
							>
						</div>
						<h3 class="text-3xl md:text-4xl font-black text-gray-900">Auto-Optimize</h3>
					</div>

					<p class="text-lg text-gray-700 font-medium mb-8">
						Multi-armed bandit automatically converges traffic to the highest performing variant.
					</p>

					<!-- Visual -->
					<div
						class="mt-auto bg-white rounded-2xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] p-5"
					>
						<div
							class="inline-block px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded border-[2px] border-gray-900 mb-5 shadow-[2px_2px_0_0_white]"
						>
							Traffic Distribution
						</div>

						<div class="space-y-5">
							{#each [{ label: 'Variant A', color: 'bg-blue-500', width: barWidths[0] }, { label: 'Variant B', color: 'bg-purple-500', width: barWidths[1] }, { label: 'Variant C', color: 'bg-[#ff6b6b]', width: barWidths[2] }] as bar}
								<div>
									<div class="flex justify-between text-xs font-black text-black mb-1.5 uppercase">
										<span>{bar.label}</span>
										<span>{Math.round(bar.width)}%</span>
									</div>
									<div
										class="h-5 bg-gray-100 rounded border-[2px] border-gray-900 overflow-hidden shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)]"
									>
										<div
											class="h-full border-r-[2px] border-gray-900 {bar.color} transition-all duration-500 ease-out"
											style="width: {bar.width}%"
										/>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Block 3: Live URL / Data Binding (Spans 12 cols) -->
			<div
				class="xl:col-span-12 bg-[#bfdbfe] rounded-[2rem] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] transition-all duration-300 relative overflow-hidden group"
			>
				<div class="grid lg:grid-cols-12 h-full">
					<!-- Text Content (Left, 5 columns) -->
					<div
						class="lg:col-span-5 p-8 md:p-10 lg:p-12 flex flex-col justify-center relative z-20 border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-gray-900 bg-white/30"
					>
						<div
							class="w-14 h-14 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] mb-8 transform rotate-3 group-hover:-rotate-3 transition-transform"
						>
							<svg
								class="w-7 h-7 text-black transform rotate-45"
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
						</div>

						<h3 class="text-3xl md:text-4xl font-black text-gray-900 mb-6">Data URLs</h3>
						<p class="text-lg text-gray-700 font-medium mb-10 max-w-lg">
							Connect any data source. The image re-renders automatically when your data changes.
							Same URL, always fresh.
						</p>

						<div class="mt-auto">
							<div
								class="mb-4 text-xs font-black uppercase text-black/60 tracking-wider flex items-center gap-2"
							>
								Source: <span
									class="bg-white text-black px-2 py-1 rounded border-[2px] border-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]"
									>{liveUrlLabel}</span
								>
							</div>
							<button
								class="w-full sm:w-auto px-8 py-3.5 bg-[#6366f1] text-white text-sm font-black uppercase tracking-wider rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-center inline-flex justify-center"
								on:click={switchLiveUrlData}
								disabled={liveUrlLoading}
							>
								Switch Data Stream →
							</button>
						</div>
					</div>

					<!-- Visual (Right, 7 columns) -->
					<div
						class="lg:col-span-7 p-6 md:p-10 pt-12 md:pt-16 lg:pt-16 flex flex-col justify-center relative bg-[#e0e7ff]/30"
					>
						<div
							class="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"
						/>

						<div class="relative z-10 w-full max-w-2xl mx-auto mt-4 md:mt-0">
							<!-- Floating Pipeline Widget -->
							<div
								class="absolute -top-6 md:-top-8 left-4 md:-left-6 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-2 flex items-center gap-2 z-20 transform -rotate-2 group-hover:rotate-0 transition-transform"
							>
								<span
									class="px-2 py-1 bg-black text-white text-[10px] font-black rounded uppercase border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937]"
									>API</span
								>
								<svg
									class="w-3 h-3 text-black"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="4"
										d="M14 5l7 7m0 0l-7 7m7-7H3"
									/></svg
								>
								<span
									class="px-2 py-1 bg-[#ffc480] text-black text-[10px] font-black rounded border-[2px] border-gray-900 uppercase shadow-[2px_2px_0_0_#1f2937]"
									>Map</span
								>
								<svg
									class="w-3 h-3 text-black"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="4"
										d="M14 5l7 7m0 0l-7 7m7-7H3"
									/></svg
								>
								<span
									class="px-2 py-1 bg-[#4ade80] text-black text-[10px] font-black rounded border-[2px] border-gray-900 uppercase shadow-[2px_2px_0_0_#1f2937]"
									>Render</span
								>
							</div>

							<!-- Browser Frame -->
							<div
								class="rounded-xl border-[3px] border-gray-900 bg-white overflow-hidden shadow-[8px_8px_0_0_#1f2937] group-hover:-translate-y-2 transition-transform duration-500 flex flex-col mt-6 md:mt-4"
							>
								<div
									class="bg-gray-100 flex items-center justify-between border-b-[3px] border-gray-900"
								>
									<div class="px-4 flex gap-1.5 h-full items-center py-3">
										<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border-[2px] border-gray-900" />
										<div class="w-3 h-3 rounded-full bg-[#ffc480] border-[2px] border-gray-900" />
										<div class="w-3 h-3 rounded-full bg-[#4ade80] border-[2px] border-gray-900" />
									</div>
									<div
										class="flex-1 border-l-[3px] border-gray-900 bg-white px-4 py-2.5 font-mono text-[10px] sm:text-xs text-black font-bold flex items-center gap-2 truncate"
									>
										<svg
											class="w-4 h-4 shrink-0 text-black/30"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"
											/></svg
										>
										https://pictify.io/b/{DEMO_BINDING_ID}.png
									</div>
								</div>

								<div
									class="relative bg-gray-50 aspect-[1200/630] flex items-center justify-center p-2"
								>
									{#if liveUrlImageSrc}
										<img
											src={liveUrlImageSrc}
											alt="Live URL Preview"
											class="w-full h-full object-contain rounded border-2 border-gray-900/5 transition-opacity duration-300"
											on:load={() => {
												liveUrlLoading = false;
											}}
											on:error={() => {
												liveUrlLoading = false;
											}}
										/>
									{:else}
										<div
											class="animate-pulse w-full h-full bg-gray-200 rounded border-[2px] border-gray-900/10"
										/>
									{/if}
									{#if liveUrlLoading}
										<div
											class="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm z-10 transition-opacity"
										>
											<div
												class="px-4 py-2 bg-black text-white font-black uppercase tracking-widest text-[10px] md:text-sm rounded border-[2px] border-white shadow-[4px_4px_0_0_#1f2937] animate-pulse"
											>
												Rendering...
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Block 4: Target Context (Spans 12 cols, Flipped Layout) -->
			<div
				class="xl:col-span-12 bg-[#fce7f3] rounded-[2rem] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] transition-all duration-300 relative overflow-hidden group"
			>
				<div class="grid lg:grid-cols-12 h-full">
					<!-- Visual (Left, 7 columns) -->
					<div
						class="lg:col-span-7 p-6 md:p-10 flex flex-col justify-center relative bg-[#fdf2f8]/50 order-2 lg:order-1 pt-16 md:pt-20 lg:pt-20"
					>
						<div
							class="absolute inset-0 bg-[radial-gradient(#ec4899_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"
						/>

						<div class="relative z-10 w-full max-w-2xl mx-auto mt-4 md:mt-0">
							<!-- Floating Detection Widget -->
							<div
								class="absolute -top-10 md:-top-12 right-4 md:-right-6 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-3 flex flex-col gap-2 z-20 transform rotate-2 group-hover:rotate-0 transition-transform"
							>
								<div class="flex items-center gap-2">
									<div
										class="text-[9px] font-black uppercase min-w-[50px] text-black/50 bg-gray-100 px-2 py-0.5 rounded border border-gray-900/20"
									>
										Detected
									</div>
									<div class="flex gap-1.5 flex-wrap">
										{#if viewerContext}
											<span
												class="px-2 py-0.5 bg-black text-white text-[9px] sm:text-[10px] font-bold rounded shadow-[2px_2px_0_0_#1f2937] border-[2px] border-gray-900"
											>
												{#if viewerContext.device?.type === 'mobile'} Mobile {:else} Desktop {/if}
											</span>
											<span
												class="px-2 py-0.5 bg-[#ffc480] text-black text-[9px] sm:text-[10px] font-bold rounded shadow-[2px_2px_0_0_#1f2937] border-[2px] border-gray-900"
												>{viewerContext.geo?.country ||
													CONTINENT_NAMES[viewerContext.geo?.continent] ||
													'Earth'}</span
											>
											<span
												class="px-2 py-0.5 bg-[#4ade80] text-black text-[9px] sm:text-[10px] font-bold rounded shadow-[2px_2px_0_0_#1f2937] border-[2px] border-gray-900"
												>{getTimeOfDay(viewerContext.time?.hour ?? 12)}</span
											>
										{/if}
									</div>
								</div>
								<div
									class="text-[9px] sm:text-[10px] font-mono font-bold text-black bg-gray-50 p-1.5 rounded border-[2px] border-gray-900"
								>
									<span class="text-[#f43f5e]">> MATCH:</span>
									{activeRuleName}
								</div>
							</div>

							<!-- Browser Frame -->
							<div
								class="rounded-xl border-[3px] border-gray-900 bg-white overflow-hidden shadow-[8px_8px_0_0_#1f2937] group-hover:-translate-y-2 transition-transform duration-500 flex flex-col mt-10 md:mt-8"
							>
								<div
									class="bg-gray-100 flex items-center justify-between border-b-[3px] border-gray-900"
								>
									<div class="px-4 flex gap-1.5 h-full items-center py-3">
										<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border-[2px] border-gray-900" />
										<div class="w-3 h-3 rounded-full bg-[#ffc480] border-[2px] border-gray-900" />
										<div class="w-3 h-3 rounded-full bg-[#4ade80] border-[2px] border-gray-900" />
									</div>
									<div
										class="flex-1 border-l-[3px] border-gray-900 bg-white px-4 py-2.5 font-mono text-[10px] sm:text-xs text-black font-bold flex items-center gap-2 truncate"
									>
										<svg
											class="w-4 h-4 shrink-0 text-[#f43f5e]"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
											/></svg
										>
										https://pictify.io/s/{SMART_LINK_SLUG}.png
									</div>
								</div>

								<div
									class="relative bg-gray-50 aspect-[1200/630] flex items-center justify-center p-2"
								>
									{#if smartLinkImageSrc}
										<img
											src={smartLinkImageSrc}
											alt="Smart Link Preview"
											class="w-full h-full object-contain rounded border-2 border-gray-900/5 transition-opacity"
											on:load={() => {
												smartLinkLoading = false;
											}}
											on:error={() => {
												smartLinkLoading = false;
											}}
										/>
									{:else}
										<div
											class="animate-pulse w-full h-full bg-gray-200 rounded border-[2px] border-gray-900/10"
										/>
									{/if}
									{#if smartLinkLoading}
										<div
											class="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm z-10 transition-opacity"
										>
											<div
												class="px-4 py-2 bg-black text-[#4ade80] font-black uppercase tracking-widest text-[10px] md:text-sm rounded border-[2px] border-[#4ade80] shadow-[4px_4px_0_0_#1f2937] animate-pulse"
											>
												Computing...
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>

					<!-- Text Content (Right, 5 columns) -->
					<div
						class="lg:col-span-5 p-8 md:p-10 lg:p-12 flex flex-col justify-center relative z-20 border-t-[3px] lg:border-t-0 lg:border-l-[3px] border-gray-900 bg-white/30 order-1 lg:order-2"
					>
						<div
							class="w-14 h-14 bg-[#f43f5e] border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] mb-8 transform -rotate-3 group-hover:rotate-0 transition-transform"
						>
							<svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
								/></svg
							>
						</div>

						<h3 class="text-3xl md:text-4xl font-black text-gray-900 mb-6">
							Target Context
						</h3>
						<p class="text-lg text-gray-700 font-medium mb-10 max-w-lg">
							Serve tailored images based on device, location, or time. One URL, infinite
							personalized variations.
						</p>

						<div class="mt-auto">
							<div
								class="mb-4 text-xs font-black uppercase text-black/60 tracking-wider flex items-center gap-2"
							>
								Viewing: <span
									class="bg-white text-black px-2 py-1 rounded border-[2px] border-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]"
									>{demoLabel}</span
								>
							</div>
							<button
								class="w-full sm:w-auto px-8 py-3.5 bg-black text-[#4ade80] text-sm font-black uppercase tracking-wider rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-center inline-flex justify-center"
								on:click={switchDemoContext}
								disabled={smartLinkLoading}
							>
								Simulate Next Context →
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
