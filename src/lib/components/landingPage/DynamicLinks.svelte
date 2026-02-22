<script>
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	// Scenario Data
	const scenarios = [
		{
			id: 'ecommerce',
			label: 'E-Commerce',
			color: 'bg-[#ff6b6b]',
			accent: 'text-[#ff6b6b]',
			border: 'border-[#ff6b6b]',
			icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>`,
			variations: [
				{ product: "Nike Air Max", price: 129.99, stock: 12, status: "In Stock" },
				{ product: "Nike Air Max", price: 129.99, stock: 4, status: "Selling Fast" },
				{ product: "Nike Air Max", price: 129.99, stock: 2, status: "Low Stock" }
			],
			template: (data, animate) => {
				const isLowStock = data.stock < 3;
				return `
				<div class="h-full bg-white flex flex-col items-center justify-center p-6 text-center">
					<div class="w-32 h-32 mb-4 bg-gray-100 rounded-full flex items-center justify-center relative">
						<svg class="w-16 h-16 text-gray-300 transform -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
						${isLowStock && animate ? `<div class="absolute -top-2 -right-2 bg-[#ff6b6b] text-white text-xs font-black px-2 py-1 rounded-full border-2 border-white transform rotate-12 scale-110 transition-transform shadow-md">HURRY</div>` : ''}
					</div>
					<h3 class="text-2xl font-black text-gray-900 leading-tight mb-1">${data.product}</h3>
					<div class="flex items-center gap-2 justify-center">
						<span class="text-3xl font-black text-[#ff6b6b]">$${data.price}</span>
					</div>
					<div class="mt-4 px-4 py-1.5 ${isLowStock ? 'bg-[#ff6b6b]' : 'bg-gray-900'} text-white rounded-full text-sm font-bold uppercase tracking-wider transition-colors duration-300">
						${data.stock} pairs left
					</div>
				</div>
			`
			}
		},
		{
			id: 'ticket',
			label: 'Event Ticket',
			color: 'bg-[#ffc480]',
			accent: 'text-[#ffc480]',
			border: 'border-[#ffc480]',
			icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>`,
			variations: [
				{ event: "Neon Nights", date: "Aug 24", seat: "12A" },
				{ event: "Neon Nights", date: "Aug 24", seat: "12B" },
				{ event: "Neon Nights", date: "Aug 24", seat: "14C" }
			],
			template: (data, animate) => `
				<div class="h-full bg-gray-900 border-l-8 border-[#ffc480] p-6 flex flex-col justify-between relative overflow-hidden">
					<div class="absolute top-0 right-0 p-8 opacity-10">
						<svg class="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 19V5l12 7-12 7z"/></svg>
					</div>
					<div>
						<span class="text-[#ffc480] font-mono text-xs uppercase tracking-[0.2em] mb-2 block">Admit One</span>
						<h3 class="text-3xl font-black text-white italic leading-none whitespace-pre-line">${data.event}</h3>
					</div>
					<div class="grid grid-cols-2 gap-4 mt-4">
						<div class="border-t border-gray-700 pt-2">
							<div class="text-gray-500 text-[10px] uppercase font-bold">Date</div>
							<div class="text-white font-mono text-sm">${data.date}</div>
						</div>
						<div class="border-t border-gray-700 pt-2">
							<div class="text-gray-500 text-[10px] uppercase font-bold">Seat</div>
							<div class="text-[#ffc480] font-mono text-xl font-bold">${data.seat}</div>
						</div>
					</div>
					${animate ? `<div class="absolute bottom-4 right-4 w-12 h-12 bg-white p-1"><div class="w-full h-full bg-black"></div></div>` : ''}
				</div>
			`
		},
		{
			id: 'chart',
			label: 'Analytics',
			color: 'bg-[#4ade80]',
			accent: 'text-[#4ade80]',
			border: 'border-[#4ade80]',
			icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>`,
			variations: [
				{ metric: "Growth", value: "82%", status: "Good", bar: "60%" },
				{ metric: "Growth", value: "88%", status: "Great", bar: "90%" },
				{ metric: "Growth", value: "94%", status: "Peak", bar: "100%" }
			],
			template: (data, animate) => `
				<div class="h-full bg-gray-50 p-6 flex flex-col relative">
					<div class="flex items-center justify-between mb-8">
						<div class="w-8 h-8 rounded bg-gray-200"></div>
						<div class="text-xs font-bold text-gray-400 uppercase">Weekly Report</div>
					</div>
					
					<div class="flex-1">
						<div class="text-sm font-bold text-gray-500 mb-1">${data.metric}</div>
						<div class="flex items-baseline gap-3">
							<span class="text-5xl font-black text-gray-900 tracking-tighter">${data.value}</span>
							<span class="px-2 py-1 rounded bg-[#4ade80]/20 text-[#15803d] text-xs font-bold ${animate ? 'scale-110' : ''} transition-transform duration-300">Trending</span>
						</div>
					</div>

					<div class="flex items-end gap-1 h-12 mt-4 ml-1">
						<div class="w-1/5 bg-[#4ade80] rounded-t-sm h-[40%]"></div>
						<div class="w-1/5 bg-[#4ade80] rounded-t-sm h-[60%]"></div>
						<div class="w-1/5 bg-[#4ade80] rounded-t-sm h-[30%]"></div>
						<div class="w-1/5 bg-[#4ade80] rounded-t-sm h-[50%]"></div>
						<div class="w-1/5 bg-[#4ade80] opacity-50 rounded-t-sm transition-all duration-500" style="height: ${data.bar}"></div>
					</div>
				</div>
			`
		}
	];

	// State
	let activeScenarioIndex = 0;
	let VariationIndex = 0;
	// Logic to track highlighting
	let previousData = {};
	let changedKeys = [];

	let dataFlash = false;
	let imageUpdate = false;
	let isAutoPlaying = true;
	let timer;

	$: activeScenario = scenarios[activeScenarioIndex];
	$: activeData = activeScenario.variations[VariationIndex];

	// diff data for highlighting
	$: {
		if (activeData) {
			const keys = Object.keys(activeData);
			changedKeys = keys.filter(key => activeData[key] !== previousData[key]);
			previousData = activeData;
		}
	}

	function nextState() {
		// Only flash if we are staying in same scenario
		// If just starting or manual switch, maybe don't "flash" everything?
		// Actually flashing "changed" keys is nice.

		setTimeout(() => {
			imageUpdate = true;
			VariationIndex = (VariationIndex + 1) % activeScenario.variations.length;
			setTimeout(() => {
				imageUpdate = false;
			}, 600);
		}, 300);
	}

	function setScenario(index) {
		if (index === activeScenarioIndex) return;
		
		activeScenarioIndex = index;
		VariationIndex = 0;
		previousData = {}; // Full reset
		isAutoPlaying = true;
		
		clearInterval(timer);
		startTimer();
	}

	function startTimer() {
		timer = setInterval(() => {
			if (isAutoPlaying) nextState();
		}, 3000);
	}

	onMount(() => {
		startTimer();
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});
</script>


<section class="w-full py-24 md:py-32 bg-[#FFFDF8] relative overflow-hidden">
	<!-- Decorative blobs -->
	<div class="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#4ade80]/10 rounded-full blur-[120px] -translate-y-1/2 -z-10 pointer-events-none"></div>
	<div class="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#ffc480]/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<!-- Header -->
		<div class="text-center mb-16 md:mb-20">
			<div class="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6b6b] rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] mb-6 -rotate-2">
				<span class="text-sm font-bold text-white uppercase tracking-wider">Live Data Bindings</span>
			</div>
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-[1.1]">
				Visuals That <br class="sm:hidden" />
				<span class="relative inline-block text-gray-900">
					Update Themselves
					<div class="absolute -bottom-2 left-0 w-full h-4 bg-[#ffc480] -z-10 transform -rotate-1 opacity-60"></div>
				</span>
			</h2>
			<p class="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
				Connect your templates to any API endpoint. Pictify binds live data and regenerates automatically. One URL, always fresh output.
			</p>
		</div>

		<!-- Interactive Playground -->
		<div class="relative max-w-5xl mx-auto">
			<!-- "Connector" Pipe (Desktop) -->
			<div class="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-24 h-12">
				<div class="relative w-full h-full flex items-center justify-center">
					<!-- Arrow Body -->
					<div class="w-full h-3 bg-gray-900 rounded-full relative overflow-hidden">
						<!-- Only animate when keys change and it's not the initial load -->
						{#if changedKeys.length > 0}
							<div 
								class="absolute top-0 left-0 h-full w-1/2 bg-[#ffc480] animate-slide-right"
							></div>
						{/if}
					</div>
					<!-- Arrow Head -->
					<div class="absolute right-0 w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-gray-900 border-b-[10px] border-b-transparent translate-x-1"></div>
					<!-- Badge -->
					<div class="absolute -top-6 bg-white border-[2px] border-gray-900 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0_0_#000] rotate-6">
						JSON
					</div>
				</div>
			</div>

			<div class="grid md:grid-cols-2 gap-8 md:gap-20 items-stretch">
				
				<!-- Left Panel: Data Source -->
				<div class="relative group">
					<!-- Window Chrome -->
					<div class="absolute -top-3 -left-3 w-full h-full bg-gray-900 rounded-2xl"></div>
					<div class="relative bg-[#1e1e1e] rounded-2xl border-[3px] border-gray-900 overflow-hidden h-full min-h-[320px] flex flex-col shadow-[8px_8px_0_0_#4ade80] transition-transform hover:-translate-y-1">
						
						<!-- Header -->
						<div class="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between border-b-[2px] border-gray-900">
							<div class="flex gap-1.5">
								<div class="w-3 h-3 rounded-full bg-[#ff6b6b]"></div>
								<div class="w-3 h-3 rounded-full bg-[#ffc480]"></div>
								<div class="w-3 h-3 rounded-full bg-[#4ade80]"></div>
							</div>
							<div class="font-mono text-xs text-gray-400">payload.json</div>
						</div>

						<!-- Setup/Tabs -->
						<div class="px-2 py-2 flex gap-2 border-b border-gray-800 bg-[#252525]">
							{#each scenarios as s, i}
								<button 
									on:click={() => setScenario(i)}
									class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2
									{activeScenarioIndex === i ? 'bg-gray-700 text-white shadow-sm ring-1 ring-gray-600' : 'text-gray-500 hover:text-gray-300'}"
								>
									{@html s.icon}
									<span>{s.label}</span>
								</button>
							{/each}
						</div>

						<!-- Code Editor -->
						<div class="p-6 font-mono text-sm relative flex-1">
							<div class="text-[#ff6b6b]">
								{'{'}
							</div>
							{#each Object.entries(activeData) as [key, value], i (key + value)}
								{@const isActive = changedKeys.includes(key)}
								<div class="pl-4 py-0.5 transition-colors duration-300 {isActive ? 'bg-[#4ade80]/20 -mx-4 px-4 sticky-highlight' : ''}">
									<span class="text-[#4ade80]">"{key}"</span>: 
									{#if typeof value === 'number'}
										<span class="text-[#ffc480]">{value}</span>
									{:else}
										<span class="text-white">"{value}"</span>
									{/if}
									{i < Object.keys(activeData).length - 1 ? ',' : ''}
								</div>
							{/each}
							<div class="text-[#ff6b6b]">
								{'}'}
							</div>
							
							<!-- Cursor -->
							<div class="absolute bottom-6 right-6 w-3 h-5 bg-[#4ade80] animate-pulse"></div>
						</div>
					</div>
				</div>

				<!-- Right Panel: Visual Output -->
				<div class="relative group mt-8 md:mt-0">
					<!-- Window Chrome -->
					<div class="absolute -top-3 -right-3 w-full h-full bg-gray-900 rounded-2xl"></div>
					<div class="relative bg-white rounded-2xl border-[3px] border-gray-900 overflow-hidden h-full min-h-[320px] flex flex-col shadow-[8px_8px_0_0_#ffc480] transition-transform hover:-translate-y-1">
						
						<!-- Browser Bar -->
						<div class="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b-[3px] border-gray-900">
							<div class="flex-1 bg-white border-[2px] border-gray-300 rounded-md px-3 py-1 flex items-center gap-2 overflow-hidden">
								<svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
								<div class="font-mono text-xs text-gray-500 whitespace-nowrap">
									pictify.io/render/<span class="text-gray-900 font-bold">{activeScenario.id}</span>
								</div>
							</div>
							<div class="w-6 h-6 rounded-full border-[2px] border-gray-900 flex items-center justify-center bg-[#4ade80]">
								<svg class="w-3 h-3 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
							</div>
						</div>

						<!-- Canvas -->
						<div class="flex-1 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] p-8 flex items-center justify-center overflow-hidden">
							{#key VariationIndex}
								<div
									in:scale={{ duration: 400, start: 0.9, opacity: 0, easing: cubicOut }}
									class="w-full max-w-[280px] aspect-square bg-white rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100 ring-1 ring-gray-900/5 transition-all duration-300"
								>
									{@html activeScenario.template(activeData, true)}
								</div>
							{/key}
						</div>

						<!-- "Generated" Tag -->
						<div class="absolute bottom-4 left-4 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 uppercase rounded tracking-wider flex items-center gap-1.5 shadow-lg">
							<span class="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse"></span>
							Live Render
						</div>
					</div>
				</div>

			</div>
		</div>

		<!-- Step Cards -->
		<div class="grid sm:grid-cols-3 gap-6 mt-20 md:mt-24">
			{#each [
				{ num: '01', title: 'Build Template', text: 'Design your layout and bind variables to elements', color: 'bg-[#ff6b6b]' },
				{ num: '02', title: 'Bind Data Source', text: 'Point to your API, database, or webhook', color: 'bg-[#ffc480]' },
				{ num: '03', title: 'Share One URL', text: 'Output updates when your data changes', color: 'bg-[#4ade80]' }
			] as step}
				<div class="relative group cursor-default">
					<div class="absolute inset-0 bg-gray-900 rounded-xl translate-x-1 translate-y-1 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
					<div class="relative h-full bg-white border-[3px] border-gray-900 rounded-xl p-6 flex flex-col items-start gap-4 transition-transform group-hover:-translate-y-1">
						<div class="w-10 h-10 {step.color} border-[2px] border-gray-900 rounded-lg flex items-center justify-center font-black text-white shadow-[3px_3px_0_0_#1f2937]">
							{step.num}
						</div>
						<div>
							<h3 class="font-black text-lg text-gray-900 mb-1">{step.title}</h3>
							<p class="text-sm font-medium text-gray-600 leading-relaxed">{step.text}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>

	</div>
</section>

<style>
	@keyframes slide-right {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(200%); }
	}
	.animate-slide-right {
		animation: slide-right 0.6s ease-in-out forwards;
	}
	
	.sticky-highlight {
		animation: flash-highlight 2.5s ease-out forwards;
	}

	@keyframes flash-highlight {
		0% { background-color: rgba(74, 222, 128, 0.3); }
		100% { background-color: transparent; }
	}
</style>
