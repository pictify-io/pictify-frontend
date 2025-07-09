<script>
	import { onMount } from 'svelte';
	import { user, activeApiToken, getAPITokenAction } from '../../../../store/user.store';
	import { toast } from '../../../../store/toast.store';
	import { createAgentScreenshotStream } from '../../../../api/image';
	import Toast from '$lib/components/Toast.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { slide } from 'svelte/transition';

	// User state
	let isUserLoggedIn = false;
	let currentApiToken = null;
	
	user.subscribe(userData => {
		isUserLoggedIn = !!userData.email;
	});
	
	activeApiToken.subscribe(token => {
		currentApiToken = token;
	});

	// Component state
	let prompt = '';
	let isGenerating = false;
	let streamingLogs = [];
	let finalResult = null;
	let showSignupPrompt = false;

	// Example prompts
	const examplePrompts = [
		'Take a screenshot of Google homepage',
		'Capture the main content of GitHub.com',
		'Screenshot the login page of Twitter',
		'Take a screenshot of the latest news on BBC.com',
		'Capture the homepage of Stack Overflow'
	];

	// Generate screenshot function
	const generateScreenshot = async () => {
		if (!prompt.trim()) {
			toast.set({ message: 'Please enter a prompt', duration: 1500 });
			return;
		}

		if (!isUserLoggedIn) {
			showSignupPrompt = true;
			return;
		}

		// Ensure we have an API token
		if (!currentApiToken) {
			console.log('No API token, fetching...');
			try {
				await getAPITokenAction();
			} catch (error) {
				console.error('Failed to get API token:', error);
				toast.set({ message: 'Failed to get API token', duration: 1500 });
				return;
			}
		}

		if (!currentApiToken) {
			console.error('No API token available after fetch attempt');
			toast.set({ message: 'No API token available', duration: 1500 });
			return;
		}

		console.log('Using API token:', currentApiToken.token ? 'Token present' : 'Token missing');

		isGenerating = true;
		streamingLogs = [];
		finalResult = null;

		try {
			await createAgentScreenshotStream(prompt, (message) => {
				streamingLogs = [...streamingLogs, message];
				
				// If this is the saved event, capture the final result
				if (message.type === 'saved' && message.data) {
					finalResult = message.data;
				}
			}, currentApiToken.token);

			toast.set({ message: 'Screenshot generated successfully!', duration: 1500 });
		} catch (error) {
			console.error('Error generating screenshot:', error);
			toast.set({ message: 'Failed to generate screenshot', duration: 1500 });
			streamingLogs = [...streamingLogs, {
				type: 'error',
				data: {
					step: 'error',
					message: 'Screenshot generation failed',
					error: error.message,
					timestamp: new Date().toISOString()
				}
			}];
		} finally {
			isGenerating = false;
		}
	};

	// Clear results
	const clearResults = () => {
		streamingLogs = [];
		finalResult = null;
	};

	// Use example prompt
	const useExamplePrompt = (example) => {
		prompt = example;
	};

	// Format timestamp
	const formatTimestamp = (timestamp) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString();
	};

	// Get step icon
	const getStepIcon = (type) => {
		switch (type) {
			case 'connected':
				return '🔌';
			case 'navigating':
				return '🌐';
			case 'analyzing':
				return '🔍';
			case 'capturing':
				return '📸';
			case 'uploading':
				return '☁️';
			case 'complete':
				return '✅';
			case 'saved':
				return '💾';
			case 'error':
				return '❌';
			default:
				return '📋';
		}
	};

	// Get step color
	const getStepColor = (type) => {
		switch (type) {
			case 'error':
				return 'text-red-600';
			case 'complete':
			case 'saved':
				return 'text-green-600';
			default:
				return 'text-blue-600';
		}
	};

	onMount(async () => {
		// Load API token if user is logged in
		if (isUserLoggedIn) {
			try {
				await getAPITokenAction();
			} catch (error) {
				console.error('Error loading API token:', error);
			}
		}
	});
</script>

<div class="h-full w-full max-w-6xl m-auto p-5">
	<div class="space-y-8">
		<!-- Header -->
		<div class="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8">
			<div class="text-center">
				<h1 class="text-3xl font-bold mb-4">AI Agent Screenshot</h1>
				<p class="text-gray-600 max-w-2xl mx-auto">
					Generate screenshots using natural language prompts. Our AI agent will navigate to websites 
					and capture the content you need automatically.
				</p>
			</div>
		</div>

		<!-- Prompt Input -->
		<div class="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8">
			<div class="max-w-4xl mx-auto">
				<div class="space-y-6">
					<div>
						<label class="block text-sm font-medium text-gray-900 mb-2">
							Screenshot Prompt
						</label>
						<textarea
							class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent"
							rows="3"
							placeholder="Enter a natural language description of what you want to screenshot..."
							bind:value={prompt}
							disabled={isGenerating}
						></textarea>
					</div>

					<!-- Example Prompts -->
					<div>
						<label class="block text-sm font-medium text-gray-900 mb-2">
							Example Prompts
						</label>
						<div class="flex flex-wrap gap-2">
							{#each examplePrompts as example}
								<button
									class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
									on:click={() => useExamplePrompt(example)}
									disabled={isGenerating}
								>
									{example}
								</button>
							{/each}
						</div>
					</div>

					<!-- Generate Button -->
					<div class="flex justify-center">
						<button
							class="bg-[#ff6b6b] text-white px-8 py-3 rounded-lg hover:bg-[#ff5252] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							on:click={generateScreenshot}
							disabled={isGenerating || !prompt.trim()}
						>
							{#if isGenerating}
								<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Generating...
							{:else}
								Generate Screenshot
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Results -->
		{#if streamingLogs.length > 0 || finalResult}
			<div class="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8" transition:slide>
				<div class="max-w-4xl mx-auto">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-2xl font-bold">Generation Progress</h2>
						<button
							class="text-sm text-gray-500 hover:text-gray-700"
							on:click={clearResults}
						>
							Clear Results
						</button>
					</div>

					<!-- Progress Steps -->
					{#if streamingLogs.length > 0}
						<div class="space-y-4 mb-8">
							{#each streamingLogs as log}
								<div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
									<span class="text-lg">{getStepIcon(log.type)}</span>
									<div class="flex-1">
										<div class="flex items-center gap-2 mb-1">
											<span class="text-sm font-medium capitalize {getStepColor(log.type)}">
												{log.type}
											</span>
											{#if log.data?.timestamp}
												<span class="text-xs text-gray-500">
													{formatTimestamp(log.data.timestamp)}
												</span>
											{/if}
										</div>
										<p class="text-sm text-gray-700">
											{log.data?.message || log.data?.step || 'Processing...'}
										</p>
										{#if log.data?.url}
											<p class="text-xs text-gray-500 mt-1">
												URL: {log.data.url}
											</p>
										{/if}
										{#if log.data?.error}
											<p class="text-xs text-red-600 mt-1">
												Error: {log.data.error}
											</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Final Result -->
					{#if finalResult}
						<div class="bg-gray-50 rounded-xl p-6">
							<h3 class="text-lg font-semibold mb-4">Generated Screenshot</h3>
							<div class="space-y-4">
								<!-- Screenshot -->
								<div class="bg-white rounded-lg p-4 border-2 border-gray-200">
									<img
										src={finalResult.url}
										alt="Generated screenshot"
										class="w-full h-auto rounded-lg shadow-lg"
									/>
								</div>

								<!-- Metadata -->
								<div class="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span class="font-medium">Image ID:</span>
										<span class="text-gray-600">{finalResult.id}</span>
									</div>
									<div>
										<span class="font-medium">Created:</span>
										<span class="text-gray-600">{new Date(finalResult.createdAt).toLocaleString()}</span>
									</div>
									{#if finalResult.metadata?.url}
										<div class="col-span-2">
											<span class="font-medium">Source URL:</span>
											<a href={finalResult.metadata.url} target="_blank" rel="noopener noreferrer" class="text-[#ff6b6b] hover:text-[#ff5252]">
												{finalResult.metadata.url}
											</a>
										</div>
									{/if}
									{#if finalResult.metadata?.elementDescription}
										<div class="col-span-2">
											<span class="font-medium">Element Description:</span>
											<span class="text-gray-600">{finalResult.metadata.elementDescription}</span>
										</div>
									{/if}
									{#if finalResult.metadata?.executionTime}
										<div>
											<span class="font-medium">Execution Time:</span>
											<span class="text-gray-600">{finalResult.metadata.executionTime}ms</span>
										</div>
									{/if}
								</div>

								<!-- Actions -->
								<div class="flex gap-2 pt-4">
									<a
										href={finalResult.url}
										target="_blank"
										rel="noopener noreferrer"
										class="bg-[#ff6b6b] text-white px-4 py-2 rounded-lg hover:bg-[#ff5252] transition-colors"
									>
										View Full Size
									</a>
									<button
										class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
										on:click={() => {
											navigator.clipboard.writeText(finalResult.url);
											toast.set({ message: 'URL copied to clipboard', duration: 1500 });
										}}
									>
										Copy URL
									</button>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Signup Prompt Modal -->
{#if showSignupPrompt}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
			<h3 class="text-lg font-semibold mb-4">Login Required</h3>
			<p class="text-gray-600 mb-6">
				You need to be logged in to use the AI Agent Screenshot feature. Please login or create an account to continue.
			</p>
			<div class="flex gap-3">
				<a
					href="/login"
					class="bg-[#ff6b6b] text-white px-4 py-2 rounded-lg hover:bg-[#ff5252] transition-colors"
				>
					Login
				</a>
				<button
					class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
					on:click={() => showSignupPrompt = false}
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<Toast /> 