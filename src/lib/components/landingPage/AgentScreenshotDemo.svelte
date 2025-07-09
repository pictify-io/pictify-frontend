<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '../../../store/user.store';
	import { slide, fly, fade } from 'svelte/transition';

	// User state
	let isUserLoggedIn = false;
	
	user.subscribe(userData => {
		isUserLoggedIn = !!userData.email;
	});

	// Demo state
	let selectedExample = 0;
	let isTyping = false;
	let displayedPrompt = '';
	let currentStep = 0;
	let showResult = false;
	let isProcessing = false;
	let isAutoCycling = true;

	// Processing steps
	const processingSteps = [
		{ id: 0, text: "Analyzing your request with AI...", icon: "🧠", duration: 1500 },
		{ id: 1, text: "Navigating to target website...", icon: "🌐", duration: 1200 },
		{ id: 2, text: "Locating specific elements...", icon: "🔍", duration: 1000 },
		{ id: 3, text: "Capturing perfect screenshot...", icon: "📸", duration: 800 },
		{ id: 4, text: "Optimizing and saving image...", icon: "✨", duration: 1200 }
	];

	// Example prompts with mock results
	const examples = [
		{
			prompt: "Take a screenshot of Google homepage",
			result: "https://res.cloudinary.com/diroilukd/image/upload/v1709358454/google-homepage-demo.png",
			description: "Captures the main Google search page",
			tags: ["Homepage", "Search"]
		},
		{
			prompt: "Capture the pricing section on stripe.com",
			result: "https://res.cloudinary.com/diroilukd/image/upload/v1709358454/stripe-pricing-demo.png",
			description: "Finds and screenshots the pricing table",
			tags: ["Pricing", "Table"]
		},
		{
			prompt: "Screenshot the GitHub trending page",
			result: "https://res.cloudinary.com/diroilukd/image/upload/v1709358454/github-trending-demo.png",
			description: "Navigates to and captures trending repositories",
			tags: ["Trending", "Repositories"]
		}
	];

	// Typing animation
	const typePrompt = async (text) => {
		// Reset all states and start typing
		resetDemo();
		isTyping = true;

		// Small delay to ensure UI updates
		await new Promise(resolve => setTimeout(resolve, 100));

		for (let i = 0; i <= text.length; i++) {
			displayedPrompt = text.substring(0, i);
			await new Promise(resolve => setTimeout(resolve, 50));
		}

		isTyping = false;
		
		// Start processing animation
		setTimeout(() => {
			startProcessing();
		}, 500);
	};

	// Interactive processing animation
	const startProcessing = async () => {
		isProcessing = true;
		currentStep = 0;
		
		for (let i = 0; i < processingSteps.length; i++) {
			currentStep = i;
			await new Promise(resolve => setTimeout(resolve, processingSteps[i].duration));
		}
		
		// Show final result after final step completes
		setTimeout(() => {
			showResult = true;
			isProcessing = false;
			
			// Schedule next cycle after showing result for 3 seconds (only if auto-cycling)
			if (isAutoCycling) {
				setTimeout(() => {
					nextExample();
				}, 3000);
			}
		}, 800);
	};

	// Reset demo state
	const resetDemo = () => {
		showResult = false;
		isProcessing = false;
		currentStep = 0;
		isTyping = false;
		displayedPrompt = '';
	};

	// Cycle through examples
	const nextExample = () => {
		resetDemo();
		selectedExample = (selectedExample + 1) % examples.length;
		typePrompt(examples[selectedExample].prompt);
	};

	// Handle try now button
	const handleTryNow = () => {
		if (isUserLoggedIn) {
			goto('/dashboard/tools/agent-screenshot');
		} else {
			goto('/signup');
		}
	};

	// Start demo on mount
	onMount(() => {
		resetDemo();
		typePrompt(examples[0].prompt);
	});
</script>

<div class="w-full bg-white border-t-2 border-b-2 border-gray-900 py-16 md:py-20 relative overflow-hidden">
	<!-- Decorative elements -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div class="absolute top-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ff6b6b]/10 to-transparent rounded-full blur-[100px] transform -translate-y-1/2 animate-float"></div>
		<div class="absolute bottom-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ffc480]/10 to-transparent rounded-full blur-[100px] transform translate-y-1/2 animate-float-delayed"></div>
	</div>

	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
		<!-- Header Section -->
		<div class="text-center space-y-4 mb-16">
			<div class="inline-flex items-center px-4 py-2 bg-[#ff6b6b] text-white rounded-full text-sm font-medium mb-4">
				<span class="mr-2">🤖</span>
				New AI Feature
			</div>
			<h2 class="text-4xl sm:text-5xl font-bold text-gray-900">
				AI Agent <span class="text-[#ff6b6b]">Screenshots</span>
			</h2>
			<p class="text-lg text-gray-700 max-w-3xl mx-auto">
				Just describe what you want to capture in plain English. Our AI agent will navigate to any website, 
				find the content you need, and take the perfect screenshot automatically.
			</p>
		</div>

		<!-- Main Demo Section -->
		<div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch mb-16">
			<!-- Demo Interface -->
			<div class="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl border-2 border-gray-900 shadow-lg overflow-hidden h-[500px] flex flex-col">
				<div class="bg-gray-900 text-white p-4 border-b border-gray-700">
					<div class="flex items-center space-x-2">
						<div class="w-3 h-3 bg-red-500 rounded-full"></div>
						<div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
						<div class="w-3 h-3 bg-green-500 rounded-full"></div>
						<span class="ml-4 text-sm font-medium">AI Agent Console</span>
					</div>
				</div>
				
				<div class="p-8 space-y-6 flex-1 flex flex-col">
					<div class="flex-1 space-y-6">
						<!-- Input Demo -->
						<div>
							<label class="block text-sm font-medium text-gray-900 mb-3">
								Tell our AI what to screenshot:
							</label>
							<div class="relative">
								<div class="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-sm bg-gray-50 min-h-[80px] flex items-center focus-within:border-[#ff6b6b] transition-colors">
									<span class="text-gray-900 leading-relaxed font-mono">{displayedPrompt}</span>
									{#if isTyping}
										<span class="animate-pulse ml-1 text-[#ff6b6b] font-bold">|</span>
									{/if}
								</div>
								<div class="absolute top-3 right-3">
									<div class="w-3 h-3 bg-[#ff6b6b] rounded-full {isTyping ? 'animate-pulse' : ''}"></div>
								</div>
							</div>
						</div>

						<!-- Interactive Processing Steps -->
						<div class="space-y-4">
							<h3 class="text-sm font-medium text-gray-700 mb-3">Processing Status:</h3>
							
							<!-- Current step display -->
							{#if isProcessing}
								<div class="flex items-center space-x-3 p-3">
									<!-- Loader -->
									<div class="relative">
										<div class="w-5 h-5 border-2 border-gray-200 rounded-full"></div>
										<div class="absolute top-0 left-0 w-5 h-5 border-2 border-[#ff6b6b] rounded-full animate-spin border-t-transparent"></div>
									</div>
									
									<!-- Step text -->
									<span class="text-sm text-gray-700">{processingSteps[currentStep].text}</span>
								</div>
							{:else}
								<div class="flex items-center space-x-3 p-3">
									<span class="text-lg">⚡</span>
									<span class="text-sm text-gray-500">Ready to process your request</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Example selectors -->
					<div class="pt-4 border-t border-gray-200">
						<p class="text-xs text-gray-500 mb-3">Try different examples:</p>
						<div class="flex flex-wrap gap-2">
							{#each examples as example, index}
								<button
									class="px-3 py-2 text-xs rounded-full transition-all duration-200 border {
										selectedExample === index ? 
										'bg-[#ff6b6b] text-white border-[#ff6b6b] shadow-md' : 
										'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300'
									}"
									on:click={() => {
										isAutoCycling = false;
										resetDemo();
										selectedExample = index;
										typePrompt(example.prompt);
									}}
								>
									{example.tags.join(' • ')}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Result Display -->
			<div class="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl border-2 border-gray-900 shadow-lg overflow-hidden h-[500px] flex flex-col">
				<div class="bg-gray-900 text-white p-4 border-b border-gray-700">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-2">
							<div class="w-3 h-3 bg-red-500 rounded-full"></div>
							<div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
							<div class="w-3 h-3 bg-green-500 rounded-full"></div>
							<span class="ml-4 text-sm font-medium">Screenshot Result</span>
						</div>
						{#if showResult}
							<div class="flex items-center space-x-2 text-green-400">
								<div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
								<span class="text-xs">Ready</span>
							</div>
						{/if}
					</div>
				</div>
				
				<div class="p-8 flex-1 flex flex-col">
					<div class="flex-1 flex flex-col">
						{#if showResult}
							<div class="space-y-4 flex-1" in:fly={{ y: 20, duration: 500 }}>
								<div class="flex items-center space-x-3 mb-4">
									<div class="w-3 h-3 bg-green-500 rounded-full"></div>
									<span class="text-sm font-medium text-green-600">Screenshot captured successfully!</span>
								</div>
								
								<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-dashed border-gray-300 flex-1">
									<div class="text-center text-gray-500 text-sm mb-4">
										📸 Generated Screenshot Preview
									</div>
									<div class="bg-white rounded-lg border-2 border-gray-200 aspect-video flex items-center justify-center shadow-sm">
										<div class="text-center">
											<div class="text-4xl mb-3">🖼️</div>
											<div class="text-sm font-medium text-gray-700 mb-2">{examples[selectedExample].description}</div>
											<div class="flex justify-center space-x-2">
												{#each examples[selectedExample].tags as tag}
													<span class="px-2 py-1 bg-[#ff6b6b] text-white text-xs rounded-full">{tag}</span>
												{/each}
											</div>
										</div>
									</div>
								</div>

								<div class="grid grid-cols-2 gap-4 text-xs">
									<div class="space-y-2">
										<div class="flex items-center space-x-2 text-green-600">
											<span>✅</span>
											<span>Element found</span>
										</div>
										<div class="flex items-center space-x-2 text-green-600">
											<span>✅</span>
											<span>High quality</span>
										</div>
									</div>
									<div class="space-y-2">
										<div class="flex items-center space-x-2 text-green-600">
											<span>✅</span>
											<span>Auto-optimized</span>
										</div>
										<div class="flex items-center space-x-2 text-green-600">
											<span>✅</span>
											<span>Saved to library</span>
										</div>
									</div>
								</div>
							</div>
						{:else if isProcessing}
							<div class="flex flex-col items-center justify-center h-full space-y-6" in:fade={{ duration: 300 }}>
								<!-- Current step display -->
								<div class="text-center space-y-4">
									<div class="text-4xl animate-bounce">
										{processingSteps[currentStep].icon}
									</div>
									<div class="text-sm font-medium text-gray-700">
										{processingSteps[currentStep].text}
									</div>
									<div class="text-xs text-gray-500">
										Step {currentStep + 1} of {processingSteps.length}
									</div>
								</div>
								
								<!-- Progress visualization -->
								<div class="w-full max-w-xs">
									<div class="w-full bg-gray-200 rounded-full h-2">
										<div class="bg-[#ff6b6b] h-2 rounded-full transition-all duration-500 ease-out"
											 style="width: {((currentStep + 1) / processingSteps.length) * 100}%">
										</div>
									</div>
									<div class="flex justify-between mt-2">
										{#each processingSteps as step, index}
											<div class="w-2 h-2 rounded-full transition-all duration-300 {
												index <= currentStep ? 'bg-[#ff6b6b]' : 'bg-gray-300'
											}"></div>
										{/each}
									</div>
								</div>
							</div>
						{:else}
							<div class="flex items-center justify-center h-full text-gray-400">
								<div class="text-center space-y-4">
									<div class="text-4xl">⚡</div>
									<div class="text-sm">Ready to capture screenshots</div>
									<div class="text-xs text-gray-500">Type your request to begin</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Features Grid -->
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
			<div class="group bg-white/50 backdrop-blur-sm rounded-xl p-6 text-center space-y-4 hover:bg-white/70 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
				<div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 group-hover:bg-gray-50 transition-all duration-300">
					<svg class="w-8 h-8 text-[#ff6b6b] group-hover:text-[#ff5252] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
					</svg>
				</div>
				<h3 class="text-xl font-bold text-gray-900 group-hover:text-[#ff6b6b] transition-colors duration-300">Smart Navigation</h3>
				<p class="text-gray-600 text-sm leading-relaxed">
					Our AI automatically navigates websites, clicks links, and finds the exact content you're looking for with intelligent pathfinding.
				</p>
			</div>

			<div class="group bg-white/50 backdrop-blur-sm rounded-xl p-6 text-center space-y-4 hover:bg-white/70 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
				<div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 group-hover:bg-gray-50 transition-all duration-300">
					<svg class="w-8 h-8 text-[#ff6b6b] group-hover:text-[#ff5252] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
					</svg>
				</div>
				<h3 class="text-xl font-bold text-gray-900 group-hover:text-[#ff6b6b] transition-colors duration-300">Precise Targeting</h3>
				<p class="text-gray-600 text-sm leading-relaxed">
					Advanced element detection finds exactly what you want - from pricing tables to navigation menus with pixel-perfect accuracy.
				</p>
			</div>

			<div class="group bg-white/50 backdrop-blur-sm rounded-xl p-6 text-center space-y-4 hover:bg-white/70 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
				<div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 group-hover:bg-gray-50 transition-all duration-300">
					<svg class="w-8 h-8 text-[#ff6b6b] group-hover:text-[#ff5252] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
					</svg>
				</div>
				<h3 class="text-xl font-bold text-gray-900 group-hover:text-[#ff6b6b] transition-colors duration-300">Lightning Fast</h3>
				<p class="text-gray-600 text-sm leading-relaxed">
					Get perfect screenshots in seconds. No more manual browsing, clicking, or element hunting - just instant results.
				</p>
			</div>
		</div>

		<!-- CTA Section -->
		<div class="text-center">
			<button
				class="inline-flex items-center px-8 py-4 bg-[#ff6b6b] text-white font-semibold rounded-full hover:bg-[#ff5252] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
				on:click={handleTryNow}
			>
				<span class="mr-2">🚀</span>
				{isUserLoggedIn ? 'Try AI Agent Now' : 'Sign Up to Try AI Agent'}
			</button>
			<p class="text-gray-500 text-sm mt-4">
				{isUserLoggedIn ? 'Access your dashboard' : 'Free to start • No credit card required'}
			</p>
		</div>
	</div>
</div>

<style>
	@keyframes float {
		0%, 100% { transform: translateY(0px); }
		50% { transform: translateY(-10px); }
	}

	@keyframes float-delayed {
		0%, 100% { transform: translateY(0px); }
		50% { transform: translateY(-8px); }
	}

	.animate-float {
		animation: float 4s ease-in-out infinite;
	}

	.animate-float-delayed {
		animation: float-delayed 5s ease-in-out infinite 1s;
	}
</style> 