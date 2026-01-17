<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '../../../store/user.store';
	import { fly, fade } from 'svelte/transition';

	let isUserLoggedIn = false;

	user.subscribe((userData) => {
		isUserLoggedIn = !!userData.email;
	});

	let selectedExample = 0;
	let isTyping = false;
	let displayedPrompt = '';
	let currentStep = 0;
	let showResult = false;
	let isProcessing = false;
	let isAutoCycling = true;

	const processingSteps = [
		{ id: 0, text: 'Analyzing request with AI...', icon: '🧠', duration: 1500 },
		{ id: 1, text: 'Navigating to website...', icon: '🌐', duration: 1200 },
		{ id: 2, text: 'Locating elements...', icon: '🔍', duration: 1000 },
		{ id: 3, text: 'Capturing screenshot...', icon: '📸', duration: 800 },
		{ id: 4, text: 'Optimizing image...', icon: '✨', duration: 1200 }
	];

	const examples = [
		{
			prompt: 'Take a screenshot of Google homepage',
			description: 'Captures the main Google search page',
			tags: ['Homepage', 'Search']
		},
		{
			prompt: 'Capture the pricing section on stripe.com',
			description: 'Finds and screenshots the pricing table',
			tags: ['Pricing', 'Table']
		},
		{
			prompt: 'Screenshot the GitHub trending page',
			description: 'Navigates to and captures trending repositories',
			tags: ['Trending', 'Repos']
		}
	];

	const typePrompt = async (text) => {
		resetDemo();
		isTyping = true;
		await new Promise((resolve) => setTimeout(resolve, 100));

		for (let i = 0; i <= text.length; i++) {
			displayedPrompt = text.substring(0, i);
			await new Promise((resolve) => setTimeout(resolve, 40));
		}

		isTyping = false;
		setTimeout(() => startProcessing(), 500);
	};

	const startProcessing = async () => {
		isProcessing = true;
		currentStep = 0;

		for (let i = 0; i < processingSteps.length; i++) {
			currentStep = i;
			await new Promise((resolve) => setTimeout(resolve, processingSteps[i].duration));
		}

		setTimeout(() => {
			showResult = true;
			isProcessing = false;

			if (isAutoCycling) {
				setTimeout(() => nextExample(), 3000);
			}
		}, 800);
	};

	const resetDemo = () => {
		showResult = false;
		isProcessing = false;
		currentStep = 0;
		isTyping = false;
		displayedPrompt = '';
	};

	const nextExample = () => {
		resetDemo();
		selectedExample = (selectedExample + 1) % examples.length;
		typePrompt(examples[selectedExample].prompt);
	};

	const handleTryNow = () => {
		goto(isUserLoggedIn ? '/dashboard/tools/agent-screenshot' : '/signup');
	};

	onMount(() => {
		resetDemo();
		typePrompt(examples[0].prompt);
	});
</script>

<section class="w-full bg-white border-t-[3px] border-b-[3px] border-gray-900 py-16 md:py-24">
	<div class="max-w-5xl mx-auto px-4">
		<!-- Header -->
		<div class="text-center mb-12">
			<div
				class="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6b6b] text-white rounded-full border-2 border-gray-900 text-sm font-bold mb-4"
			>
				<span>🤖</span> AI-Powered Feature
			</div>
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
				AI Agent <span class="text-[#ff6b6b]">Screenshots</span>
			</h2>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Describe what you want in plain English. Our AI navigates any website and captures the
				perfect screenshot.
			</p>
		</div>

		<!-- Demo Section -->
		<div class="grid lg:grid-cols-2 gap-6 mb-12">
			<!-- Input Panel -->
			<div
				class="bg-[#FFFDF8] rounded-2xl border-[3px] border-gray-900 shadow-[5px_5px_0_0_#1f293780] overflow-hidden flex flex-col"
			>
				<!-- Header -->
				<div class="bg-gray-900 text-white px-4 py-3 flex items-center gap-2">
					<div class="w-3 h-3 bg-red-500 rounded-full" />
					<div class="w-3 h-3 bg-yellow-500 rounded-full" />
					<div class="w-3 h-3 bg-green-500 rounded-full" />
					<span class="ml-2 text-xs font-bold">AI Agent Console</span>
				</div>

				<div class="p-5 flex flex-col flex-1">
					<!-- Prompt Display -->
					<div class="mb-4">
						<p class="block text-xs font-bold text-gray-700 mb-2">Your prompt:</p>
						<div
							class="px-4 py-3 bg-white rounded-xl border-[3px] border-gray-900 min-h-[60px] flex items-center"
						>
							<span class="text-sm text-gray-900 font-mono">{displayedPrompt}</span>
							{#if isTyping}
								<span class="animate-pulse ml-1 text-[#ff6b6b] font-bold">|</span>
							{/if}
						</div>
					</div>

					<!-- Processing Status -->
					<div class="flex-1 flex items-center">
						{#if isProcessing}
							<div
								class="flex items-center gap-3 p-3 bg-[#ffc480]/30 rounded-xl border-2 border-gray-900 w-full"
							>
								<div class="relative">
									<div class="w-5 h-5 border-2 border-gray-200 rounded-full" />
									<div
										class="absolute top-0 left-0 w-5 h-5 border-2 border-[#ff6b6b] rounded-full animate-spin border-t-transparent"
									/>
								</div>
								<span class="text-sm font-medium text-gray-900"
									>{processingSteps[currentStep].text}</span
								>
							</div>
						{:else}
							<div class="flex items-center gap-3 p-3 bg-gray-100 rounded-xl w-full">
								<span class="text-lg">⚡</span>
								<span class="text-sm text-gray-500">Ready to process</span>
							</div>
						{/if}
					</div>

					<!-- Example Buttons -->
					<div class="pt-4 mt-4 border-t-2 border-gray-200">
						<p class="text-xs text-gray-500 mb-2">Try examples:</p>
						<div class="flex flex-wrap gap-2">
							{#each examples as example, index}
								<button
									class="px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-gray-900 transition-all {selectedExample ===
									index
										? 'bg-[#ff6b6b] text-white shadow-[2px_2px_0_0_#1f293780]'
										: 'bg-white text-gray-900 hover:bg-gray-100'}"
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

			<!-- Result Panel -->
			<div
				class="bg-[#FFFDF8] rounded-2xl border-[3px] border-gray-900 shadow-[5px_5px_0_0_#1f293780] overflow-hidden flex flex-col"
			>
				<!-- Header -->
				<div class="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="w-3 h-3 bg-red-500 rounded-full" />
						<div class="w-3 h-3 bg-yellow-500 rounded-full" />
						<div class="w-3 h-3 bg-green-500 rounded-full" />
						<span class="ml-2 text-xs font-bold">Result Preview</span>
					</div>
					{#if showResult}
						<div class="flex items-center gap-1 text-green-400">
							<div class="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
							<span class="text-xs">Done</span>
						</div>
					{/if}
				</div>

				<div class="p-5 flex-1 flex flex-col items-center justify-center min-h-[300px]">
					{#if showResult}
						<div class="w-full space-y-4" in:fly={{ y: 20, duration: 400 }}>
							<div class="flex items-center gap-2 mb-4">
								<div class="w-3 h-3 bg-green-500 rounded-full" />
								<span class="text-sm font-bold text-green-600">Screenshot captured!</span>
							</div>

							<div class="bg-white rounded-xl border-[3px] border-gray-900 p-6 text-center">
								<div class="text-4xl mb-3">🖼️</div>
								<div class="text-sm font-bold text-gray-900 mb-2">
									{examples[selectedExample].description}
								</div>
								<div class="flex justify-center gap-2">
									{#each examples[selectedExample].tags as tag}
										<span
											class="px-2 py-1 bg-[#ffc480] text-gray-900 text-xs font-bold rounded border-2 border-gray-900"
											>{tag}</span
										>
									{/each}
								</div>
							</div>

							<div class="grid grid-cols-2 gap-3 text-xs">
								<div class="flex items-center gap-2 text-green-600">
									<span>✅</span><span>High quality</span>
								</div>
								<div class="flex items-center gap-2 text-green-600">
									<span>✅</span><span>Auto-optimized</span>
								</div>
							</div>
						</div>
					{:else if isProcessing}
						<div class="text-center space-y-4" in:fade={{ duration: 200 }}>
							<div class="text-4xl animate-bounce">{processingSteps[currentStep].icon}</div>
							<div class="text-sm font-bold text-gray-700">{processingSteps[currentStep].text}</div>
							<div class="w-full max-w-[200px] bg-gray-200 rounded-full h-2">
								<div
									class="bg-[#ff6b6b] h-2 rounded-full transition-all duration-500"
									style="width: {((currentStep + 1) / processingSteps.length) * 100}%"
								/>
							</div>
						</div>
					{:else}
						<div class="text-center space-y-3 text-gray-400">
							<div class="text-4xl">⚡</div>
							<div class="text-sm">Waiting for input...</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Features -->
		<div class="grid sm:grid-cols-3 gap-4 mb-10">
			<div class="p-5 bg-[#ffc480]/20 rounded-xl border-[3px] border-gray-900 text-center">
				<div class="text-2xl mb-2">🧠</div>
				<h3 class="font-bold text-gray-900 mb-1">Smart Navigation</h3>
				<p class="text-xs text-gray-600">AI finds any element automatically</p>
			</div>
			<div class="p-5 bg-[#ff6b6b]/10 rounded-xl border-[3px] border-gray-900 text-center">
				<div class="text-2xl mb-2">🎯</div>
				<h3 class="font-bold text-gray-900 mb-1">Precise Targeting</h3>
				<p class="text-xs text-gray-600">Pixel-perfect element detection</p>
			</div>
			<div class="p-5 bg-green-100 rounded-xl border-[3px] border-gray-900 text-center">
				<div class="text-2xl mb-2">⚡</div>
				<h3 class="font-bold text-gray-900 mb-1">Lightning Fast</h3>
				<p class="text-xs text-gray-600">Results in seconds</p>
			</div>
		</div>

		<!-- CTA -->
		<div class="text-center">
			<button
				class="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6b6b] text-white font-bold rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f293780] hover:shadow-[2px_2px_0_0_#1f293780] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				on:click={handleTryNow}
			>
				<span>🚀</span>
				{isUserLoggedIn ? 'Try AI Agent Now' : 'Sign Up to Try AI Agent'}
			</button>
			<p class="text-xs text-gray-500 mt-3">
				{isUserLoggedIn ? 'Access your dashboard' : 'Free to start • No credit card'}
			</p>
		</div>
	</div>
</section>
