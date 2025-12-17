<script>
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let isSyncing = false;
	let activeStep = 0;

	// Simulate the collaboration loop
	onMount(() => {
		const interval = setInterval(() => {
			// Step 0: Designer moves
			if (activeStep === 0) {
				setTimeout(() => activeStep = 1, 1500); // Move to syncing
			}
			// Step 1: Syncing
			else if (activeStep === 1) {
				isSyncing = true;
				setTimeout(() => {
					isSyncing = false;
					activeStep = 2; // Move to Developer
				}, 1000);
			}
			// Step 2: Developer receives
			else if (activeStep === 2) {
				setTimeout(() => activeStep = 0, 2000); // Reset
			}
		}, 5000);

		return () => clearInterval(interval);
	});
</script>

<section class="w-full py-20 md:py-32 bg-white relative overflow-hidden">
	<!-- Geometric Background -->
	<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-50"></div>
	
	<div class="max-w-7xl mx-auto px-6 relative z-10">
		
		<!-- Header -->
		<div class="text-center mb-20">
			<div class="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] mb-6 transform rotate-1">
				<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Unified Workflow</span>
			</div>
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
				Stop the <br />
				<span class="relative inline-block text-[#ff6b6b]">
					Handover Hell
					<svg class="absolute w-full h-3 -bottom-1 left-0 text-gray-900 opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
					</svg>
				</span>
			</h2>
			<p class="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
				Designers update visuals in the editor. Developers trigger them via API.
				Product, marketing, and ops teams ship changes without waiting on a deployment.
			</p>
		</div>

		<!-- Workflow Visual -->
		<div class="relative max-w-5xl mx-auto">
			
			<!-- Connecting Cable -->
			<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-24 z-0 hidden md:block">
				<svg class="w-full h-full" viewBox="0 0 200 100" fill="none" stroke="currentColor">
					<path 
						d="M0 50 H200" 
						stroke="#1f2937" 
						stroke-width="4" 
						stroke-dasharray="10 10"
						class="opacity-30"
					/>
					<!-- Animated Data Packet -->
					{#if isSyncing}
						<circle r="6" fill="#4ade80" stroke="#1f2937" stroke-width="2">
							<animateMotion 
								dur="1s" 
								repeatCount="1" 
								path="M0 50 H200"
							/>
						</circle>
					{/if}
				</svg>
			</div>

			<div class="grid md:grid-cols-2 gap-8 md:gap-24 items-center">
				
				<!-- Left: Designer View -->
				<div class="relative group">
					<div class="absolute -top-12 left-4 bg-[#ffc480] px-4 py-2 rounded-lg border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] transform -rotate-2 z-20">
						<span class="font-bold text-sm">👩‍🎨 Designer</span>
					</div>
					
					<div class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] p-6 relative overflow-hidden">
						<!-- Editor Interface Mockup -->
						<div class="flex justify-between items-center mb-4 border-b-2 border-gray-100 pb-2">
							<div class="flex gap-2">
								<div class="w-8 h-8 rounded bg-gray-100 border border-gray-300"></div>
								<div class="w-8 h-8 rounded bg-gray-100 border border-gray-300"></div>
							</div>
							<div class="text-xs font-bold text-gray-400">CANVAS</div>
						</div>
						
						<div class="relative aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
							<!-- Editable Element -->
							<div 
								class="px-6 py-3 bg-white border-[2px] border-gray-900 shadow-sm transform transition-all duration-500
								{activeStep === 0 || activeStep === 1 ? 'scale-110 rotate-2 border-[#ff6b6b]' : 'scale-100 rotate-0'}"
							>
								<span class="font-black text-lg">SALE 50%</span>
								{#if activeStep === 0}
									<!-- Designer Cursor -->
									<div class="absolute -bottom-4 -right-4 pointer-events-none" in:fly={{y: 10, duration: 300}}>
										<svg class="w-6 h-6 text-gray-900 fill-[#ffc480] drop-shadow-md" viewBox="0 0 24 24">
											<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="currentColor" stroke-width="2"/>
										</svg>
										<div class="bg-[#ffc480] px-2 py-0.5 rounded text-[10px] font-bold border border-gray-900 ml-4 mt-1">
											Editing...
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Right: Developer View -->
				<div class="relative group">
					<div class="absolute -top-12 right-4 bg-[#4ade80] px-4 py-2 rounded-lg border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] transform rotate-2 z-20">
						<span class="font-bold text-sm">👨‍💻 Developer</span>
					</div>

					<div class="bg-[#1e1e1e] rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] p-6 relative overflow-hidden">
						<!-- Terminal Header -->
						<div class="flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
							<div class="w-3 h-3 rounded-full bg-[#ff6b6b]"></div>
							<div class="w-3 h-3 rounded-full bg-[#ffc480]"></div>
							<div class="w-3 h-3 rounded-full bg-[#4ade80]"></div>
						</div>

						<div class="font-mono text-sm space-y-2">
							<div class="text-gray-500"># Trigger generation via API</div>
							<div class="text-white">
								<span class="text-[#ff6b6b]">const</span> response = <span class="text-[#ff6b6b]">await</span> pictify.generate({`{`}
							</div>
							<div class="pl-4 text-white">
								template: <span class="text-[#4ade80]">'promo-banner-v2'</span>,
							</div>
							<div class="pl-4 text-white">
								data: {`{`} ... {`}`}
							</div>
							<div class="text-white">{`}`});</div>
							
							{#if activeStep === 2}
								<div class="mt-4 p-2 bg-[#4ade80]/20 border border-[#4ade80] rounded text-[#4ade80] text-xs" in:fade>
									✓ Template updated automatically
								</div>
							{/if}
						</div>
					</div>
				</div>

			</div>
		</div>

		<!-- Value Props -->
		<div class="grid md:grid-cols-3 gap-6 mt-20">
			<div class="bg-white p-6 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]">
				<div class="w-10 h-10 bg-[#ffc480] rounded-lg border-[2px] border-gray-900 flex items-center justify-center mb-4">
					<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				</div>
				<h3 class="text-lg font-bold text-gray-900 mb-2">Fewer Bottlenecks</h3>
				<p class="text-sm text-gray-600">Template and copy updates shouldn't require a sprint. Ship changes instantly.</p>
			</div>
			<div class="bg-white p-6 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]">
				<div class="w-10 h-10 bg-[#ff6b6b] rounded-lg border-[2px] border-gray-900 flex items-center justify-center mb-4">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
				</div>
				<h3 class="text-lg font-bold text-gray-900 mb-2">Visual Consistency</h3>
				<p class="text-sm text-gray-600">Lock down brand guidelines while allowing for dynamic data injection.</p>
			</div>
			<div class="bg-white p-6 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]">
				<div class="w-10 h-10 bg-[#4ade80] rounded-lg border-[2px] border-gray-900 flex items-center justify-center mb-4">
					<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
				</div>
				<h3 class="text-lg font-bold text-gray-900 mb-2">Separate Concerns</h3>
				<p class="text-sm text-gray-600">Designers own the 'look'. Developers own the 'logic'. Everyone wins.</p>
			</div>
		</div>

	</div>
</section>
