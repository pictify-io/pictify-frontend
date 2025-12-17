<script>
	import { fade } from 'svelte/transition';
	
	const comparisonPoints = [
		{
			id: 'infra',
			title: 'Infrastructure',
			headless: {
				label: 'Maintenance Heavy',
				desc: 'Managing scaling, memory leaks, and zombie processes.',
				icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
			},
			pictify: {
				label: 'Serverless Scale',
				desc: 'Auto-scaling API. No ops. 99.9% Uptime.',
				icon: 'M13 10V3L4 14h7v7l9-11h-7z',
				color: 'text-[#4ade80]',
				bg: 'bg-[#4ade80]/10',
				border: 'border-[#4ade80]'
			}
		},
		{
			id: 'workflow',
			title: 'Workflow',
			headless: {
				label: 'Code Only',
				desc: 'Every pixel change requires a developer deployment.',
				icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
			},
			pictify: {
				label: 'Visual Builder',
				desc: 'Designers update templates instantly. No code pushes.',
				icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
				color: 'text-[#ff6b6b]',
				bg: 'bg-[#ff6b6b]/10',
				border: 'border-[#ff6b6b]'
			}
		},
		{
			id: 'speed',
			title: 'Performance',
			headless: {
				label: 'Slow Starts',
				desc: '2-5s cold starts. Resource intensive rendering.',
				icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
			},
			pictify: {
				label: 'Sub-500ms',
				desc: 'Global CDN caching. Optimized rendering engine.',
				icon: 'M13 10V3L4 14h7v7l9-11h-7z',
				color: 'text-[#ffc480]',
				bg: 'bg-[#ffc480]/10',
				border: 'border-[#ffc480]'
			}
		}
	];
</script>

<section class="w-full py-24 md:py-32 bg-[#FFFDF8] relative overflow-hidden">
	<!-- Background Elements -->
	<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-50"></div>
	<div class="absolute top-1/3 right-0 w-96 h-96 bg-[#ff6b6b]/5 rounded-full blur-3xl -z-10"></div>
	<div class="absolute bottom-0 left-0 w-96 h-96 bg-[#4ade80]/5 rounded-full blur-3xl -z-10"></div>

	<div class="max-w-6xl mx-auto px-6 relative z-10">
		<div class="text-center mb-20">
			<div class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ffc480] mb-6 transform -rotate-1">
				<span class="text-sm font-bold text-white uppercase tracking-wider">The Smart Choice</span>
			</div>
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
				Why not just use <br />
				<span class="relative inline-block text-gray-400 decoration-4 underline decoration-gray-300 underline-offset-8">
					Puppeteer?
				</span>
			</h2>
			<p class="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
				Building your own renderer is easy. Maintaining it at scale is a nightmare.
			</p>
		</div>

		<!-- Comparison Grid -->
		<div class="space-y-6">
			<!-- Header Row (Desktop) -->
			<div class="hidden md:grid grid-cols-12 gap-6 text-sm font-bold text-gray-400 uppercase tracking-widest px-6">
				<div class="col-span-5 text-center">DIY / Headless</div>
				<div class="col-span-2 text-center"></div>
				<div class="col-span-5 text-center text-gray-900">Pictify Cloud</div>
			</div>

			{#each comparisonPoints as point}
				<div class="group relative">
					<!-- Connector Line (Desktop) -->
					<div class="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -z-10"></div>

					<div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
						
						<!-- Headless Side (Pain) -->
						<div class="md:col-span-5 relative">
							<div class="h-full bg-white p-6 rounded-xl border-[2px] border-dashed border-gray-300 group-hover:border-gray-400 transition-colors flex items-center gap-4 opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all duration-300">
								<div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
									<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={point.headless.icon}/></svg>
								</div>
								<div>
									<div class="text-xs font-bold text-gray-400 uppercase mb-1 md:hidden">The Hard Way</div>
									<h4 class="font-bold text-gray-700 text-lg">{point.headless.label}</h4>
									<p class="text-sm text-gray-500 leading-snug mt-1">{point.headless.desc}</p>
								</div>
							</div>
						</div>

						<!-- VS Badge / Factor -->
						<div class="md:col-span-2 flex items-center justify-center py-2 md:py-0">
							<div class="bg-gray-900 text-white text-xs font-bold px-4 py-1.5 rounded-full border-[2px] border-white shadow-lg z-10 whitespace-nowrap">
								{point.title}
							</div>
						</div>

						<!-- Pictify Side (Solution) -->
						<div class="md:col-span-5 relative">
							<div class="h-full bg-white p-6 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] group-hover:shadow-[6px_6px_0_0_#1f2937] group-hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 relative overflow-hidden">
								<!-- Glow Effect -->
								<div class="absolute inset-0 {point.pictify.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								
								<div class="w-12 h-12 {point.pictify.bg} rounded-lg border-2 {point.pictify.border} flex items-center justify-center flex-shrink-0 relative z-10">
									<svg class="w-6 h-6 {point.pictify.color}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={point.pictify.icon}/></svg>
								</div>
								<div class="relative z-10">
									<div class="text-xs font-bold {point.pictify.color} uppercase mb-1 md:hidden">The Pictify Way</div>
									<h4 class="font-black text-gray-900 text-lg">{point.pictify.label}</h4>
									<p class="text-sm text-gray-600 leading-snug mt-1">{point.pictify.desc}</p>
								</div>
							</div>
						</div>

					</div>
				</div>
			{/each}
		</div>

		<!-- Bottom "Switch" Callout -->
		<div class="mt-16 text-center">
			<div class="inline-flex items-center gap-2 text-gray-500 font-medium bg-white px-6 py-3 rounded-full border border-gray-200 shadow-sm">
				<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
				<span>Managing a chrome cluster costs ~$400/mo + engineering time.</span>
			</div>
		</div>

	</div>
</section>