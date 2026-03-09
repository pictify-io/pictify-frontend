<script>
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';

	let activeUseCase = 0;
	let activeVariation = 0;
	let interval;

	const useCases = [
		{
			id: 'social',
			title: 'Social Automation',
			description: 'One template with conditional layouts per platform. IF/ELSE picks the right crop, copy, and CTA.',
			color: 'bg-[#ffc480]',
			icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>`,
			template: {
				bg: 'bg-gray-900',
				image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
		},
			variations: [
		{
					title: '10 Tips for Better SEO', 
					tag: 'Marketing', 
					readTime: '5 MIN',
					author: { name: 'Sarah J.', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' }
				},
				{ 
					title: 'React vs Vue in 2026', 
					tag: 'Dev', 
					readTime: '8 MIN',
					author: { name: 'Mike R.', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' }
				},
				{ 
					title: 'Q3 Growth Report', 
					tag: 'Business', 
					readTime: '12 MIN',
					author: { name: 'Team', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Team' }
				}
			]
		},
		{
			id: 'ecommerce',
			title: 'Dynamic Retail',
			description: 'Price formatting, discount logic, and stock badges computed inside the template at render time.',
			color: 'bg-[#ff6b6b]',
			icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>`,
			template: {
				bg: 'bg-white',
				image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80'
			},
			variations: [
				{ 
					product: 'Nike Air Max', 
					price: '$129', 
					discount: '-20%',
					rating: '4.8',
					image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80'
				},
				{ 
					product: 'Adidas Ultra', 
					price: '$180', 
					discount: '-15%',
					rating: '4.9',
					image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=500&q=80'
				},
				{ 
					product: 'Puma RS-X', 
					price: '$110', 
					discount: 'SALE',
					rating: '4.5',
					image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=500&q=80'
				}
			]
		},
		{
			id: 'email',
			title: 'Email Marketing',
			description: 'Loyalty tier, points balance, and next reward — all resolved by expressions at render time.',
			color: 'bg-[#4ade80]',
			icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z" /></svg>`,
			template: {
				bg: 'bg-blue-50',
				image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80'
			},
			variations: [
				{ greeting: 'Welcome, Alex!', status: 'GOLD', points: '450', nextReward: 'Free Ship' },
				{ greeting: 'Hi, Jordan!', status: 'SILVER', points: '120', nextReward: '5% Off' },
				{ greeting: 'Hello, Sam!', status: 'PLATINUM', points: '890', nextReward: '$50 Credit' }
			]
		}
	];

	function startRotation() {
		if (interval) clearInterval(interval);
		interval = setInterval(() => {
			activeVariation = (activeVariation + 1) % 3;
		}, 4000);
	}

	// Restart rotation when use case changes
	$: if (activeUseCase !== undefined) {
		activeVariation = 0;
		startRotation();
	}

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});
</script>

<section class="w-full py-20 md:py-32 bg-[#FFFDF8] relative overflow-hidden">
	<!-- Background Pattern -->
	<div class="absolute inset-0 opacity-5 pointer-events-none" 
		style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 30px 30px;">
	</div>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		
		<!-- Header -->
		<div class="text-center mb-20">
			<div class="inline-flex items-center gap-2 px-4 py-2 bg-[#4ade80] rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] mb-6 transform -rotate-1">
				<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Any Data → Any Visual</span>
			</div>
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
				One Template. <br />
				<span class="relative inline-block text-[#ff6b6b]">
					Million Variations.
					<svg class="absolute w-full h-3 -bottom-1 left-0 text-gray-900 opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
					</svg>
				</span>
			</h2>
			<p class="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
				Same template, different data, different output every time. Social cards, product images, email headers — at any scale.
			</p>
		</div>

		<div class="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
			
			<!-- Left: Use Case Selector -->
			<div class="lg:col-span-4 flex flex-col gap-4 order-2 lg:order-1">
				{#each useCases as useCase, i}
					<div 
						class="cursor-pointer group relative select-none"
						on:click={() => { activeUseCase = i; activeVariation = 0; }}
						on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (() => { activeUseCase = i; activeVariation = 0; })()}
						role="button"
						tabindex="0"
					>
						<div class="absolute inset-0 bg-gray-900 rounded-xl translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
						<div class="relative p-6 rounded-xl border-[3px] border-gray-900 transition-all duration-200 flex items-start gap-4 shadow-[4px_4px_0_0_#000]
							{activeUseCase === i ? `${useCase.color} -translate-y-1 -translate-x-1` : 'bg-white hover:-translate-y-0.5 hover:-translate-x-0.5'}">
							
							<div class="w-6 h-6 mt-1">{@html useCase.icon}</div>
							<div>
								<div class="flex items-center gap-2 mb-1">
									<h3 class="text-lg font-black text-gray-900">{useCase.title}</h3>
									{#if activeUseCase === i}
										<div class="w-2 h-2 rounded-full bg-gray-900 animate-pulse"></div>
									{/if}
								</div>
								<p class="text-sm font-medium {activeUseCase === i ? 'text-gray-900' : 'text-gray-500'}">
									{useCase.description}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Right: Dynamic Gallery -->
			<div class="lg:col-span-8 relative perspective-1000 order-1 lg:order-2 mb-12 lg:mb-0 h-full flex items-center">
				<div class="relative h-[400px] md:h-[500px] w-full flex items-center justify-center">
					
					<!-- The "Master" Template Card -->
					{#key activeUseCase}
						<div 
							in:fly={{ y: 20, duration: 500 }}
							class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-20"
						>
							<div class="bg-white rounded-2xl border-[4px] border-gray-900 shadow-[16px_16px_0_0_#1f2937] overflow-hidden relative group transform transition-transform duration-500 hover:scale-[1.02]">
								<!-- Browser Header -->
								<div class="h-8 bg-gray-100 border-b-[3px] border-gray-900 flex items-center px-3 gap-2 justify-between">
									<div class="flex gap-2">
										<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border border-gray-900"></div>
										<div class="w-3 h-3 rounded-full bg-[#ffc480] border border-gray-900"></div>
									</div>
									<div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Preview</div>
								</div>

								<!-- Canvas Content -->
								<div class="aspect-[4/3] relative overflow-hidden bg-gray-50">
									
									{#key activeUseCase}
										<div class="absolute inset-0" in:fade={{duration: 300}}>
											
											<!-- Social Card Style -->
											{#if activeUseCase === 0}
												<div class="w-full h-full relative flex flex-col justify-end p-8 overflow-hidden">
													<div class="absolute inset-0">
														<img src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop" alt="abstract" class="w-full h-full object-cover filter grayscale contrast-125 opacity-50" />
														<div class="absolute inset-0 bg-gray-900/90"></div>
														<!-- Noise Texture -->
														<div class="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
													</div>
													
													{#key activeVariation}
														<div class="relative z-10" in:fly={{y: 20, duration: 400}}>
															<div class="flex items-center gap-3 mb-4">
																<span class="px-3 py-1 bg-[#ffc480] border-[2px] border-white text-gray-900 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_0_white]">
																	{useCases[0].variations[activeVariation].tag}
																</span>
																<span class="text-white/60 text-xs font-mono font-bold uppercase tracking-widest border-l-2 border-white/20 pl-3">
																	{useCases[0].variations[activeVariation].readTime}
																</span>
															</div>
															<h2 class="text-4xl md:text-5xl font-black text-white leading-[0.95] mb-6">
																{useCases[0].variations[activeVariation].title}
															</h2>
															<div class="flex items-center gap-3">
																<img src={useCases[0].variations[activeVariation].author.img} alt="author" class="w-8 h-8 bg-white rounded-none border-[2px] border-white shadow-[2px_2px_0_0_rgba(255,255,255,0.5)]" />
																<div class="text-white text-sm font-bold uppercase tracking-wide">
																	By {useCases[0].variations[activeVariation].author.name}
																</div>
															</div>
														</div>
													{/key}
												</div>

											<!-- E-commerce Card Style -->
											{:else if activeUseCase === 1}
												<div class="w-full h-full relative bg-[#f8f9fa] p-6 flex items-center gap-4">
													<div class="absolute top-0 right-0 w-2/3 h-full bg-[#ff6b6b]/10 skew-x-12 translate-x-20"></div>
													
													{#key activeVariation}
														<div class="flex-1 relative z-10" in:fly={{x: -20, duration: 400}}>
															<div class="inline-block px-2 py-1 bg-[#ff6b6b] text-white text-[10px] font-bold uppercase tracking-wider mb-3 rounded border-[2px] border-gray-900 shadow-[2px_2px_0_0_black]">
																{useCases[1].variations[activeVariation].discount}
															</div>
															<h2 class="text-3xl font-black text-gray-900 leading-none mb-2">
																{useCases[1].variations[activeVariation].product}
															</h2>
															<div class="flex items-center gap-1 mb-4">
																<div class="flex text-[#ffc480] text-xs">
																	{'★'.repeat(Math.floor(useCases[1].variations[activeVariation].rating))}
																</div>
																<span class="text-xs font-bold text-gray-500">{useCases[1].variations[activeVariation].rating}</span>
															</div>
															<div class="text-2xl font-bold text-gray-900">
																{useCases[1].variations[activeVariation].price}
															</div>
														</div>
														<div class="w-1/2 relative z-10 h-full flex items-center justify-center" in:fly={{x: 20, duration: 400}}>
															<div class="relative w-full aspect-square">
																<div class="absolute inset-0 bg-black/5 rounded-full transform scale-90 translate-y-4 blur-xl"></div>
																<img src={useCases[1].variations[activeVariation].image} alt="product" class="w-full h-full object-contain drop-shadow-xl transform -rotate-12 hover:rotate-0 transition-transform duration-500" />
					</div>
				</div>
													{/key}
												</div>

											<!-- Email Header Style -->
											{:else if activeUseCase === 2}
												<div class="w-full h-full relative bg-[#4ade80] flex flex-col items-center justify-center text-center p-6">
													<div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent"></div>
													<div class="absolute top-0 left-0 w-full h-2 bg-gray-900"></div>
													
													{#key activeVariation}
														<div class="relative z-10 w-full max-w-xs bg-white border-[3px] border-gray-900 p-5 shadow-[8px_8px_0_0_rgba(0,0,0,0.2)]" in:scale={{duration: 400, start: 0.9}}>
															<div class="w-12 h-12 bg-gray-900 rounded-full mx-auto -mt-11 mb-3 border-[3px] border-white flex items-center justify-center">
																<span class="text-xl">🎁</span>
															</div>
															<h2 class="text-2xl font-black text-gray-900 mb-1">
																{useCases[2].variations[activeVariation].greeting}
															</h2>
															<div class="inline-block px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600 mb-4">
																{useCases[2].variations[activeVariation].status}
		</div>

															<div class="grid grid-cols-2 gap-3 border-t-2 border-dashed border-gray-200 pt-3">
																<div>
																	<div class="text-[10px] font-bold text-gray-400 uppercase">Points</div>
																	<div class="text-lg font-black text-[#4ade80]">{useCases[2].variations[activeVariation].points}</div>
																</div>
																<div>
																	<div class="text-[10px] font-bold text-gray-400 uppercase">Next Reward</div>
																	<div class="text-xs font-bold text-gray-900">{useCases[2].variations[activeVariation].nextReward}</div>
																</div>
															</div>
														</div>
													{/key}
												</div>
											{/if}
										</div>
									{/key}

								</div>

								<!-- Progress Bar -->
								<div class="h-1 bg-gray-200 w-full">
									{#key activeVariation}
										<div class="h-full bg-gray-900 transition-all duration-[4000ms] ease-linear w-full origin-left animate-[progress_4s_linear]"></div>
									{/key}
								</div>
							</div>
				</div>
					{/key}

					<!-- Floating JSON Data Card -->
					<div class="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 md:translate-x-12 z-30 hidden md:block">
						<div class="bg-[#1e1e1e] rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#ffc480] p-4 w-64 transform rotate-3 transition-all hover:rotate-0 hover:scale-105">
							<div class="text-xs font-mono text-gray-400 mb-2 flex items-center gap-2">
								<div class="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse"></div>
								Payload.json
					</div>
							<pre class="font-mono text-xs text-[#4ade80] overflow-hidden">
{`{
  "template": "${useCases[activeUseCase].id}",
  "variables": {
    "title": "${useCases[activeUseCase].variations[activeVariation].title || useCases[activeUseCase].variations[activeVariation].product || useCases[activeUseCase].variations[activeVariation].greeting}",
    ${activeUseCase === 1 
		? `"price": "${useCases[activeUseCase].variations[activeVariation].price}"` 
		: activeUseCase === 2
		? `"status": "${useCases[activeUseCase].variations[activeVariation].status}"`
		: `"author": "${useCases[activeUseCase].variations[activeVariation].author.name}"`}
  }
}`}
							</pre>
					</div>
					</div>

					<!-- Background Stacked Cards Effect -->
					<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md h-[400px] border-[3px] border-gray-900 bg-white rounded-2xl transform rotate-6 -z-10 opacity-50 scale-95"></div>
					<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md h-[400px] border-[3px] border-gray-900 bg-gray-100 rounded-2xl transform -rotate-3 -z-20 opacity-30 scale-90"></div>

				</div>
			</div>

		</div>
	</div>
</section>

<style>
	.perspective-1000 {
		perspective: 1000px;
	}
	@keyframes progress {
		from { width: 0%; }
		to { width: 100%; }
	}
</style>