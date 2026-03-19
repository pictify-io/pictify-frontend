<script>
	const platforms = [
		{ name: 'Instagram', w: 1080, h: 1080, color: '#E1306C', top: '8%', left: '8%', rotation: -6 },
		{ name: 'Twitter/X', w: 1200, h: 675, color: '#1DA1F2', top: '12%', right: '8%', rotation: 8 },
		{ name: 'LinkedIn', w: 1200, h: 627, color: '#0A66C2', bottom: '15%', right: '6%', rotation: -5 },
		{ name: 'YouTube', w: 1280, h: 720, color: '#FF0000', bottom: '10%', left: '10%', rotation: 6 },
		{ name: 'OG Image', w: 1200, h: 630, color: '#ffc480', top: '45%', left: '2%', rotation: -12 }
	];
    
	let isHovering = false;
</script>

<section class="w-full py-24 md:py-32 bg-[#FFFDF8] relative overflow-hidden border-b-[3px] border-gray-900">
	<!-- Background Pattern from Integrations/Experiments -->
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none"
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"
	/>
	<div
		class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3b82f6]/10 rounded-full blur-[100px] pointer-events-none -z-10"
	/>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<div class="text-center mb-16 max-w-3xl mx-auto relative">
			<div
				class="inline-block px-4 py-1.5 bg-[#4ade80] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full mb-6 transform -rotate-1 hover:rotate-2 transition-transform cursor-default"
			>
				<span class="text-sm font-black text-gray-900 uppercase tracking-wider"
					>Responsive Engine</span
				>
			</div>
			
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
				One Template.<br />
				<span class="relative inline-block text-[#3b82f6]">
					Every Platform.
					<svg
						class="absolute w-full h-3 -bottom-1 left-0 text-[#3b82f6] opacity-30 z-[-1]"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="6" fill="none" />
					</svg>
				</span>
			</h2>
			<p class="text-xl text-gray-700 font-medium">
				Design once, generate images for Instagram, Twitter, LinkedIn, YouTube, and OG tags — all from a
				single template with shared variables.
			</p>
		</div>

		<!-- Main Split Pane Showcase -->
		<div class="max-w-5xl mx-auto group relative mt-12 block">
			<!-- Decorative offset background -->
			<div class="absolute inset-0 bg-[#3b82f6] rounded-3xl border-[3px] border-gray-900 transform translate-x-3 translate-y-3 z-0 pointer-events-none transition-transform group-hover:translate-x-4 group-hover:translate-y-4 duration-300"></div>
			
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div 
				class="relative bg-white rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden z-10 flex flex-col transition-transform group-hover:-translate-y-1 group-hover:-translate-x-1 duration-300"
				on:mouseenter={() => isHovering = true}
				on:mouseleave={() => isHovering = false}
			>
				
				<!-- Mac Header -->
				<div class="bg-[#ffc480] px-4 py-3 border-b-[3px] border-gray-900 flex items-center justify-between z-20">
					<div class="flex gap-2">
						<div class="w-3.5 h-3.5 rounded-full bg-[#ff6b6b] border-[2px] border-gray-900"></div>
						<div class="w-3.5 h-3.5 rounded-full bg-white border-[2px] border-gray-900"></div>
						<div class="w-3.5 h-3.5 rounded-full bg-[#4ade80] border-[2px] border-gray-900"></div>
					</div>
					<div class="flex items-center gap-2 bg-white/60 px-3 py-1 rounded-md border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937]">
						<svg class="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
						<span class="text-[10px] font-black text-gray-900 uppercase tracking-widest">Auto-Resize API</span>
					</div>
				</div>

				<div class="flex flex-col lg:flex-row lg:items-stretch bg-[#FFFDF8]">
					<!-- Left: Visual Illustration -->
					<div class="w-full lg:w-[55%] min-h-[350px] lg:min-h-[400px] flex items-center justify-center border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-gray-900 relative overflow-hidden">
						
						<div class="absolute inset-0 pointer-events-none opacity-5" style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 20px 20px;" />

						<!-- Decorative connecting lines (SVG) -->
						<svg class="absolute inset-0 w-full h-full z-10 pointer-events-none transition-opacity duration-500" style="opacity: {isHovering ? '0.4' : '0.15'};">
							<!-- Center to Platform lines -->
							<line x1="50%" y1="50%" x2="25%" y2="25%" stroke="black" stroke-width="2" stroke-dasharray="4 4" class="animate-dash" />
							<line x1="50%" y1="50%" x2="75%" y2="25%" stroke="black" stroke-width="2" stroke-dasharray="4 4" class="animate-dash" style="animation-delay: -1s;" />
							<line x1="50%" y1="50%" x2="75%" y2="80%" stroke="black" stroke-width="2" stroke-dasharray="4 4" class="animate-dash" style="animation-delay: -2s;" />
							<line x1="50%" y1="50%" x2="25%" y2="80%" stroke="black" stroke-width="2" stroke-dasharray="4 4" class="animate-dash" style="animation-delay: -3s;" />
							<line x1="50%" y1="50%" x2="20%" y2="50%" stroke="black" stroke-width="2" stroke-dasharray="4 4" class="animate-dash" style="animation-delay: -4s;" />
						</svg>

						<!-- Center Data Node -->
						<div class="absolute z-30 flex flex-col items-center justify-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
							<div class="w-20 h-20 bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_0_#ff6b6b] flex items-center justify-center group-hover:scale-110 group-hover:shadow-[8px_8px_0_0_#ff6b6b] transition-all duration-300 relative">
								<div class="absolute -top-3 -right-3 w-8 h-8 bg-[#ffc480] border-[2px] border-gray-900 rounded-full flex items-center justify-center shadow-[2px_2px_0_0_#1f2937] z-10">
									<svg class="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
								</div>
								<span class="font-black text-3xl text-gray-900">{`{}`}</span>
							</div>
							<div class="mt-4 px-3 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded border-[2px] border-gray-900 shadow-[2px_2px_0_0_#ff6b6b]">
								1 JSON Payload
							</div>
						</div>

						<!-- Floating Platforms around center -->
						{#each platforms as platform}
							<div 
								class="absolute z-20 group/card cursor-pointer"
								style="
									top: {platform.top || 'auto'};
									bottom: {platform.bottom || 'auto'};
									left: {platform.left || 'auto'};
									right: {platform.right || 'auto'};
								"
							>
								<div 
									class="bg-white border-[3px] border-gray-900 p-2 rounded-xl shadow-[4px_4px_0_0_#1f2937] group-hover/card:scale-110 group-hover/card:z-40 transition-all duration-300 w-28 md:w-32 flex flex-col gap-1.5"
									style="transform: rotate({platform.rotation}deg);"
								>
									<!-- Mock Image Header -->
									<div class="w-full h-14 md:h-16 flex items-center justify-center text-white text-xs font-black uppercase tracking-wider rounded border-[2px] border-gray-900/10 shadow-inner overflow-hidden relative group-hover/card:opacity-90 transition-opacity" style="background-color: {platform.color}">
										<div class="absolute inset-0 bg-white/20 transform -rotate-45 translate-x-12 translate-y-12 w-20 h-20"></div>
										<span class="relative z-10">{platform.name}</span>
									</div>
									<div class="flex justify-between items-center px-1 py-0.5">
										<div class="text-[9px] font-black text-gray-800">{platform.w} × {platform.h}</div>
										<div class="w-3 h-3 rounded-full border-[2px] border-gray-900" style="background-color: {platform.color}"></div>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Right: Code Info -->
					<div class="w-full lg:w-[45%] flex flex-col relative bg-white p-8 lg:p-10 justify-center group/rightpane">
						<div class="mb-6">
							<div class="inline-block px-3 py-1 bg-[#3b82f6] text-white font-black text-[10px] uppercase tracking-widest border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] rounded mb-4 transform -rotate-2">
								Multi-Format Output
							</div>
							<h3 class="text-3xl font-black text-gray-900 mb-3 leading-tight">Generate All Sizes At Once</h3>
							<p class="text-sm font-medium text-gray-600 leading-relaxed max-w-sm">
								Send a single API request with an array of <span class="text-gray-900 font-bold bg-[#ffc480] px-1 border border-gray-900 rounded">layouts</span> and receive optimized images formatted for every social channel instantly.
							</p>
						</div>

						<!-- Code Snippet Box -->
						<div class="relative group/code mt-2">
							<!-- Floating Tag over code editor -->
							<div class="absolute -top-3 -right-3 bg-white text-gray-900 text-[10px] font-black px-3 py-1 uppercase tracking-widest border-[2px] border-gray-900 shadow-[2px_2px_0_0_#3b82f6] z-10 transform rotate-3 group-hover/code:-rotate-2 transition-transform">
								API Request
							</div>
							
							<!-- The Code Block -->
							<div class="bg-gray-900 border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] rounded-xl p-5 overflow-hidden font-mono text-xs md:text-sm text-[#4ade80] relative">
								<!-- Top Mac Dots inside code editor -->
								<div class="flex gap-1.5 mb-3 border-b border-gray-700 pb-3">
									<div class="w-2.5 h-2.5 rounded-full bg-[#ff6b6b]"></div>
									<div class="w-2.5 h-2.5 rounded-full bg-[#ffc480]"></div>
									<div class="w-2.5 h-2.5 rounded-full bg-[#4ade80]"></div>
								</div>
								<div class="space-y-1.5 overflow-x-auto whitespace-nowrap pb-2">
									<div class="text-gray-500">// Request multiple sizes!</div>
									<div><span class="text-white">POST</span> https://api.pictify.io/v1/render</div>
									<div class="mt-2 text-white">{`{`}</div>
									<div class="pl-4 text-[#93c5fd]">"template_id": "tp_12345",</div>
									<div class="pl-4 pb-1"><span class="text-[#ffc480]">"layouts": ["ig", "x", "og"],</span></div>
									<div class="pl-4 text-[#93c5fd]">"data": {`{`}</div>
									<div class="pl-8 text-white">"title": "Launch Day 🚀",</div>
									<div class="pl-8 text-white">"author": "Suyash"</div>
									<div class="pl-4 text-[#93c5fd]">{`}`}</div>
									<div class="text-white">{`}`}</div>
								</div>
							</div>
						</div>

						<div class="mt-8 flex justify-start">
							<a
								href="/docs"
								class="inline-flex items-center gap-2 px-6 py-3.5 bg-black text-white font-black text-sm uppercase tracking-widest rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_#a259ff] group-hover/rightpane:shadow-[2px_2px_0_0_#a259ff] group-hover/rightpane:translate-x-1 group-hover/rightpane:translate-y-1 transition-all"
							>
								Read API Docs
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.animate-dash {
		animation: dash 20s linear infinite;
	}
	@keyframes dash {
		to {
			stroke-dashoffset: -100;
		}
	}
</style>
