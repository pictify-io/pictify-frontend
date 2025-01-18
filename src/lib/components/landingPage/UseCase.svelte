<script>
	let activeCase = 0;
	const cases = [
		{
			title: 'Email Marketing',
			description: 'Generate personalized email banners and graphics at scale',
			image: 'https://htgf.s3.amazonaws.com/bvhew-1703216378968.png'
		},
		{
			title: 'Social Cards',
			description: 'Create stunning social media cards automatically',
			image: 'https://res.cloudinary.com/diroilukd/image/upload/v1703704940/9nwdk_170_1_thal3x.png'
		},
		{
			title: 'Certificates',
			description: 'Generate beautiful certificates and badges instantly',
			image: 'https://htgf.s3.amazonaws.com/68lk2-1704017409595.png'
		},
		{
			title: 'Awards and Badges',
			description: 'Generate beautiful badges and awards for your customers',
			image: 'https://res.cloudinary.com/diroilukd/image/upload/v1703809509/Photo_2_rlkesl.png'
		}
	];
</script>

<div class="w-full py-16 md:py-24 bg-gradient-to-b from-white to-gray-50/50">
	<div class="max-w-6xl mx-auto px-4 md:px-6 space-y-12 md:space-y-16">
		<!-- Section Header -->
		<div class="text-center space-y-4 md:space-y-6">
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
				Real-World <span class="text-[#ff6b6b]">Use Cases</span>
			</h2>
			<p class="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto font-medium">
				See how leading companies use Pictify to automate their image generation needs. Perfect for any scale, from startups to enterprises.
			</p>
		</div>

		<!-- Use Cases Grid -->
		<div class="grid md:grid-cols-2 gap-6 md:gap-8">
			{#each cases as useCase, i}
				<button 
					class="group bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm transition-all duration-300 w-full text-left {activeCase === i ? 'border-[#ff6b6b] ring-1 ring-[#ff6b6b]/20' : 'hover:border-[#ff6b6b]/30'}"
					on:click={() => activeCase = i}
					on:keydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							activeCase = i;
						}
					}}
					role="tab"
					aria-selected={activeCase === i}
					aria-controls="case-panel-{i}"
				>
					<div class="space-y-4 md:space-y-6">
						<div class="space-y-2">
							<h3 class="text-xl md:text-2xl font-bold text-gray-900">{useCase.title}</h3>
							<p class="text-base md:text-lg text-gray-700">{useCase.description}</p>
						</div>
						<div class="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
							<img
								src={useCase.image}
								alt={useCase.title}
								class="w-full h-auto transform transition-transform duration-300 group-hover:scale-[1.02]"
							/>
						</div>
					</div>
				</button>
			{/each}
		</div>

		<!-- Workflow Showcase -->
		<div class="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
			<div class="space-y-12">
				<div class="text-center">
					<h3 class="text-xl md:text-2xl font-bold text-gray-900">How It Works</h3>
					<p class="mt-2 text-base md:text-lg text-gray-700">Transform your HTML designs into production-ready images in 3 simple steps</p>
				</div>

				<div class="relative">
					<!-- Steps with SVG Illustrations -->
					<div class="grid md:grid-cols-3 gap-8 relative">
						<!-- Design Step -->
						<div class="relative group">
							<div class="aspect-square mb-6 max-w-[200px] md:max-w-none mx-auto">
								<svg class="w-full h-full" viewBox="0 0 200 200" fill="none">
									<!-- Browser Window -->
									<rect x="40" y="40" width="120" height="120" rx="8" class="fill-white stroke-gray-300" stroke-width="2"/>
									<!-- Browser Header -->
									<rect x="40" y="40" width="120" height="25" rx="8" class="fill-gray-100 stroke-gray-300" stroke-width="2"/>
									<!-- Browser Buttons -->
									<circle cx="55" cy="52" r="4" class="fill-gray-300"/>
									<circle cx="70" cy="52" r="4" class="fill-gray-300"/>
									<circle cx="85" cy="52" r="4" class="fill-gray-300"/>
									<!-- Code Editor Content -->
									<rect x="40" y="65" width="120" height="95" class="fill-gray-50"/>
									<!-- Line Numbers -->
									<text x="50" y="85" class="fill-gray-400 text-[8px] font-mono">1</text>
									<text x="50" y="100" class="fill-gray-400 text-[8px] font-mono">2</text>
									<text x="50" y="115" class="fill-gray-400 text-[8px] font-mono">3</text>
									<text x="50" y="130" class="fill-gray-400 text-[8px] font-mono">4</text>
									<text x="50" y="145" class="fill-gray-400 text-[8px] font-mono">5</text>
									<!-- HTML Code -->
									<text x="60" y="85" class="fill-[#ff6b6b] text-[8px] font-mono">&lt;div class="card"&gt;</text>
									<text x="70" y="100" class="fill-[#ff6b6b] text-[8px] font-mono">&lt;h1&gt;Welcome&lt;/h1&gt;</text>
									<text x="70" y="115" class="fill-[#ff6b6b] text-[8px] font-mono">&lt;p&gt;Hello World&lt;/p&gt;</text>
									<text x="60" y="130" class="fill-[#ff6b6b] text-[8px] font-mono">&lt;/div&gt;</text>
									<!-- Animated Cursor -->
									<rect x="60" y="140" width="2" height="10" class="fill-[#ff6b6b] animate-blink"/>
								</svg>
							</div>
							<div class="text-center">
								<h4 class="text-lg font-semibold mb-2">1. Design in HTML</h4>
								<p class="text-gray-600">Create your template using HTML & CSS - just like you normally would</p>
							</div>
						</div>

						<!-- API Step -->
						<div class="relative group">
							<div class="aspect-square mb-6 max-w-[200px] md:max-w-none mx-auto">
								<svg class="w-full h-full" viewBox="0 0 200 200" fill="none">
									<!-- Simple Server Icon -->
									<rect x="60" y="40" width="80" height="120" rx="8" class="fill-white stroke-gray-300" stroke-width="2"/>
									
									<!-- Simple Server Lines -->
									<rect x="70" y="60" width="60" height="2" rx="1" class="fill-gray-200"/>
									<rect x="70" y="75" width="60" height="2" rx="1" class="fill-gray-200"/>
									<rect x="70" y="90" width="60" height="2" rx="1" class="fill-gray-200"/>
									
									<!-- Single Status Light -->
									<circle cx="75" cy="120" r="3" class="fill-[#ff6b6b] animate-pulse"/>
								</svg>
							</div>
							<div class="text-center">
								<h4 class="text-lg font-semibold mb-2">2. Call Our API</h4>
								<p class="text-gray-600">Send your HTML template with dynamic data to our API</p>
							</div>
						</div>

						<!-- Result Step -->
						<div class="relative group">
							<div class="aspect-square mb-6 max-w-[200px] md:max-w-none mx-auto">
								<svg class="w-full h-full" viewBox="0 0 200 200" fill="none">
									<!-- Image Icon Frame -->
									<rect x="40" y="40" width="120" height="120" rx="8" class="fill-white stroke-gray-300" stroke-width="2"/>
									<!-- Sun/Circle -->
									<circle cx="80" cy="80" r="15" class="fill-gray-200"/>
									<!-- Mountains/Landscape -->
									<path d="M40 160l30-40 20 25 30-35 40 50H40z" class="fill-gray-200"/>
									
									<!-- Small Download Arrow in Corner -->
									<path d="M145 50v15m-4-4l4 4 4-4" 
										class="stroke-[#ff6b6b]" 
										stroke-width="1.5" 
										stroke-linecap="round" 
										stroke-linejoin="round"/>
								</svg>
							</div>
							<div class="text-center">
								<h4 class="text-lg font-semibold mb-2">3. Get Your Image</h4>
								<p class="text-gray-600">Receive your perfectly rendered image in milliseconds</p>
							</div>
						</div>
					</div>

					<!-- Connection Lines -->
					<div class="absolute top-[40%] left-0 w-full h-0.5 hidden md:block">
						<!-- First Connection Dots -->
						<div class="absolute left-[28%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-flow-1"></div>
						<div class="absolute left-[28%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-flow-2"></div>
						<div class="absolute left-[28%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-flow-3"></div>
						<div class="absolute left-[28%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-flow-4"></div>
						<div class="absolute left-[28%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-flow-5"></div>
						<div class="absolute left-[28%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-flow-5"></div>
	
						<!-- Second Connection Dots -->
						<div class="absolute left-[60.5%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-flow-1"></div>
						<div class="absolute left-[60.5%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-flow-2"></div>
						<div class="absolute left-[60.5%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-flow-3"></div>
						<div class="absolute left-[60.5%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-flow-4"></div>
						<div class="absolute left-[60.5%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-flow-5"></div>
						<div class="absolute left-[60.5%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-flow-5"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	@keyframes flow {
		0% { transform: translateX(0); opacity: 0; }
		50% { opacity: 1; }
		100% { transform: translateX(80px); opacity: 0; }
	}

	.animate-blink {
		animation: blink 1s step-end infinite;
	}

	.animate-flow-1 {
		animation: flow 1.5s linear infinite;
	}

	.animate-flow-2 {
		animation: flow 1.5s linear infinite;
		animation-delay: 0.3s;
	}

	.animate-flow-3 {
		animation: flow 1.5s linear infinite;
		animation-delay: 0.6s;
	}

	.animate-flow-4 {
		animation: flow 1.5s linear infinite;
		animation-delay: 0.9s;
	}

	.animate-flow-5 {
		animation: flow 1.5s linear infinite;
		animation-delay: 1.2s;
	}
</style>
