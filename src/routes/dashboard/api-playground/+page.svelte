<script>
	import { browser } from '$app/environment';
	import { user, getAPITokenAction } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';
	import Loader from '$lib/components/Loader.svelte';
	import { createImage, createGif, createAgentScreenshot } from '../../../api/image';
	import { onMount, onDestroy } from 'svelte';

	let apiToken = '';
	let selectedEndpoint = 'image';
	let loading = false;
	let response = null;
	let responseJson = '';
	let isUserLoggedIn = false;

	let hasTriedToFetchTokens = false;
	let unsubscribe = () => {};
	
	onMount(() => {
		// Subscribe to user store to get API token
		unsubscribe = user.subscribe(async (userData) => {
			isUserLoggedIn = !!userData.email;
			
			// If user is logged in but no API tokens, fetch them (only once)
			if (userData.email && (!userData.apiTokens || userData.apiTokens.length === 0) && !hasTriedToFetchTokens) {
				hasTriedToFetchTokens = true;
				try {
					await getAPITokenAction();
				} catch (error) {
					console.error('Error loading API tokens:', error);
				}
			}
			
			// Set API token if available
			if (userData && Array.isArray(userData.apiTokens) && userData.apiTokens.length > 0) {
				apiToken = userData.apiTokens[0].token || '';
			}
		});
	});
	
	onDestroy(() => {
		unsubscribe();
	});

	// Image endpoint parameters
	let imageParams = {
		html: '<div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: Arial, sans-serif; border-radius: 10px;"><h1>Hello World!</h1><p>This is a test image</p></div>',
		width: 800,
		height: 600,
		selector: 'body',
		url: '',
		fileExtension: 'png'
	};

	// GIF endpoint parameters
	let gifParams = {
		html: '<div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: Arial, sans-serif; border-radius: 10px;"><h1 id="animated-text">Animated Text</h1><style>@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } } #animated-text { animation: pulse 2s infinite; }</style></div>',
		width: 800,
		height: 600,
		framesPerSecond: 15,
		selector: 'body',
		url: ''
	};

	// Agent screenshot parameters
	let agentParams = {
		prompt: 'Take a screenshot of the Google homepage'
	};



	async function testImageEndpoint() {
		if (!apiToken) {
			toast.set({ message: 'API token is required', duration: 1500 });
			return;
		}

		loading = true;
		response = null;
		responseJson = '';

		try {
			const data = await createImage({ 
				html: imageParams.html,
				width: imageParams.width,
				height: imageParams.height,
				selector: imageParams.selector,
				url: imageParams.url,
				fileExtension: imageParams.fileExtension,
				apiKey: apiToken 
			});
			response = data;
			responseJson = JSON.stringify(data, null, 2);
			toast.set({ message: 'Image created successfully!', duration: 1500 });
		} catch (error) {
			console.error('Error:', error);
			response = error.response?.data || { error: error.message };
			responseJson = JSON.stringify(response, null, 2);
			toast.set({ message: error.response?.data?.error || error.message || 'Failed to create image', duration: 1500 });
		} finally {
			loading = false;
		}
	}

	async function testGifEndpoint() {
		if (!apiToken) {
			toast.set({ message: 'API token is required', duration: 1500 });
			return;
		}

		loading = true;
		response = null;
		responseJson = '';

		try {
			const data = await createGif({ 
				html: gifParams.html,
				width: gifParams.width,
				height: gifParams.height,
				framesPerSecond: gifParams.framesPerSecond,
				selector: gifParams.selector,
				url: gifParams.url,
				apiKey: apiToken 
			});
			response = data;
			responseJson = JSON.stringify(data, null, 2);
			toast.set({ message: 'GIF created successfully!', duration: 1500 });
		} catch (error) {
			console.error('Error:', error);
			response = error.response?.data || { error: error.message };
			responseJson = JSON.stringify(response, null, 2);
			toast.set({ message: error.response?.data?.error || error.message || 'Failed to create GIF', duration: 1500 });
		} finally {
			loading = false;
		}
	}

	async function testAgentEndpoint() {
		if (!apiToken) {
			toast.set({ message: 'API token is required', duration: 1500 });
			return;
		}

		loading = true;
		response = null;
		responseJson = '';

		try {
			const data = await createAgentScreenshot({ ...agentParams, apiKey: apiToken });
			response = data;
			responseJson = JSON.stringify(data, null, 2);
			toast.set({ message: 'Agent screenshot created successfully!', duration: 1500 });
		} catch (error) {
			console.error('Error:', error);
			response = error.response?.data || { error: error.message };
			responseJson = JSON.stringify(response, null, 2);
			toast.set({ message: error.response?.data?.error || error.message || 'Failed to create agent screenshot', duration: 1500 });
		} finally {
			loading = false;
		}
	}

	function copyToClipboard(text) {
		if (browser && navigator.clipboard) {
			navigator.clipboard.writeText(text);
			toast.set({ message: 'Copied to clipboard!', duration: 1500 });
		} else {
			toast.set({ message: 'Clipboard not available', duration: 1500 });
		}
	}

	function setSelectedEndpoint(endpoint) {
		selectedEndpoint = endpoint;
		response = null;
		responseJson = '';
	}

	// Reactive curl example
	$: curlExample = (() => {
		const baseUrl = browser ? window.location.origin : 'https://pictify.io';
		const authToken = apiToken || 'YOUR_API_TOKEN';
		
		if (selectedEndpoint === 'image') {
			const payload = {
				html: imageParams.html,
				width: imageParams.width,
				height: imageParams.height,
				selector: imageParams.selector || 'body',
				fileExtension: imageParams.fileExtension
			};
			if (imageParams.url) {
				payload.url = imageParams.url;
			}
			return `curl -X POST ${baseUrl}/api/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${authToken}" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
		} else if (selectedEndpoint === 'gif') {
			const payload = {
				html: gifParams.html,
				width: gifParams.width,
				height: gifParams.height,
				framesPerSecond: gifParams.framesPerSecond,
				selector: gifParams.selector || 'body'
			};
			if (gifParams.url) {
				payload.url = gifParams.url;
			}
			return `curl -X POST ${baseUrl}/api/gif \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${authToken}" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
		} else if (selectedEndpoint === 'agent') {
			const payload = {
				prompt: agentParams.prompt
			};
			return `curl -X POST ${baseUrl}/api/image/agent-screenshot \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${authToken}" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
		}
		return '';
	})();

	// Reactive request payload
	$: requestPayload = (() => {
		if (selectedEndpoint === 'image') {
			const payload = {
				html: imageParams.html,
				width: imageParams.width,
				height: imageParams.height,
				selector: imageParams.selector || 'body',
				fileExtension: imageParams.fileExtension
			};
			if (imageParams.url) {
				payload.url = imageParams.url;
			}
			return payload;
		} else if (selectedEndpoint === 'gif') {
			const payload = {
				html: gifParams.html,
				width: gifParams.width,
				height: gifParams.height,
				framesPerSecond: gifParams.framesPerSecond,
				selector: gifParams.selector || 'body'
			};
			if (gifParams.url) {
				payload.url = gifParams.url;
			}
			return payload;
		} else if (selectedEndpoint === 'agent') {
			return {
				prompt: agentParams.prompt
			};
		}
		return {};
	})();

	// Reactive endpoint information
	$: endpointPath = (() => {
		if (selectedEndpoint === 'image') return '/image';
		if (selectedEndpoint === 'gif') return '/gif';
		if (selectedEndpoint === 'agent') return '/image/agent-screenshot';
		return '';
	})();

	$: endpointDescription = (() => {
		if (selectedEndpoint === 'image') return 'Generate a new image from HTML';
		if (selectedEndpoint === 'gif') return 'Generate a new GIF from animated HTML';
		if (selectedEndpoint === 'agent') return 'Take a screenshot using AI agent';
		return '';
	})();

	// Reactive helper functions
	$: currentParams = (() => {
		if (selectedEndpoint === 'image') return imageParams;
		if (selectedEndpoint === 'gif') return gifParams;
		if (selectedEndpoint === 'agent') return agentParams;
		return {};
	})();

	$: currentTestFunction = (() => {
		if (selectedEndpoint === 'image') return testImageEndpoint;
		if (selectedEndpoint === 'gif') return testGifEndpoint;
		if (selectedEndpoint === 'agent') return testAgentEndpoint;
		return () => {};
	})();

	$: isValidParams = (() => {
		if (selectedEndpoint === 'image') {
			return imageParams.html && imageParams.width && imageParams.height;
		} else if (selectedEndpoint === 'gif') {
			return gifParams.html && gifParams.width && gifParams.height;
		} else if (selectedEndpoint === 'agent') {
			return agentParams.prompt;
		}
		return false;
	})();
</script>

<svelte:head>
	<title>API Playground - Pictify.io</title>
</svelte:head>

	<div class="h-full w-full max-w-6xl m-auto p-5">
		<!-- Content Area -->
		<div class="mt-8 space-y-8">
		<!-- API Overview -->
		<div class="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8">
			<div class="max-w-4xl mx-auto">
				<div class="flex items-start justify-between mb-6">
					<div class="flex-1">
						<h2 class="text-2xl font-bold mb-2">API Documentation</h2>
						<p class="text-gray-700">
							Test and experiment with Pictify.io API endpoints. Select an endpoint from the list to get started.
						</p>
					</div>
					<div class="flex items-center gap-4 ml-8">
						<div class="flex items-center gap-2">
							<div class="h-2 w-2 rounded-full bg-green-500"></div>
							<span class="text-sm text-gray-600">API Status: Operational</span>
						</div>
						{#if isUserLoggedIn && apiToken}
							<button
								class="px-4 py-2 bg-[#ff6b6b] text-white rounded-lg hover:bg-[#ff5252] whitespace-nowrap"
								on:click={() => copyToClipboard(apiToken)}
							>
								Copy API Key
							</button>
						{:else}
							<a
								href="/dashboard/api-token"
								class="px-4 py-2 bg-[#ff6b6b] text-white rounded-lg hover:bg-[#ff5252] whitespace-nowrap"
							>
								Get API Key
							</a>
						{/if}
					</div>
				</div>

				<!-- Main API Playground -->
				<div class="grid grid-cols-12 gap-6">
					<!-- Left Panel - Endpoints & Auth -->
					<div class="col-span-4 space-y-6">
						<!-- Authentication -->
						<div class="bg-gray-50 rounded-xl p-4">
							<h3 class="text-sm font-medium text-gray-900 mb-2">Authentication</h3>
							<div class="space-y-2">
								{#if isUserLoggedIn && apiToken}
									<div class="relative">
										<input
											type="password"
											class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm bg-gray-100"
											value={apiToken}
											readonly
										/>
										<button
											class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
											on:click={() => copyToClipboard(apiToken)}
										>
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
												<path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
												<path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
											</svg>
										</button>
									</div>
								{:else}
									<div class="text-sm text-gray-600">
										Please <a href="/dashboard/api-token" class="text-[#ff6b6b] hover:text-[#ff5252]">get an API key</a> to test the endpoints.
									</div>
								{/if}
							</div>
						</div>

													<!-- Endpoints List -->
							<div>
								<h3 class="text-sm font-medium text-gray-900 mb-2">Available Endpoints</h3>
								<div class="space-y-2">
									<button
										class="w-full p-3 rounded-xl border-2 text-left transition-all {selectedEndpoint === 'image' ? 'border-[#ff6b6b] bg-[#ff6b6b]/5' : 'border-gray-200 hover:border-[#ff6b6b]/30'}"
										on:click={() => setSelectedEndpoint('image')}
									>
										<div class="flex items-center gap-2 mb-1">
											<span class="px-2 py-0.5 text-xs font-medium rounded bg-gray-900 text-white">POST</span>
											<span class="text-sm font-mono text-gray-600">/image</span>
										</div>
										<p class="text-xs text-gray-600">Generate a new image from HTML</p>
									</button>
									<button
										class="w-full p-3 rounded-xl border-2 text-left transition-all {selectedEndpoint === 'gif' ? 'border-[#ff6b6b] bg-[#ff6b6b]/5' : 'border-gray-200 hover:border-[#ff6b6b]/30'}"
										on:click={() => setSelectedEndpoint('gif')}
									>
										<div class="flex items-center gap-2 mb-1">
											<span class="px-2 py-0.5 text-xs font-medium rounded bg-gray-900 text-white">POST</span>
											<span class="text-sm font-mono text-gray-600">/gif</span>
										</div>
										<p class="text-xs text-gray-600">Generate a new GIF from animated HTML</p>
									</button>
									<button
										class="w-full p-3 rounded-xl border-2 text-left transition-all {selectedEndpoint === 'agent' ? 'border-[#ff6b6b] bg-[#ff6b6b]/5' : 'border-gray-200 hover:border-[#ff6b6b]/30'}"
										on:click={() => setSelectedEndpoint('agent')}
									>
										<div class="flex items-center gap-2 mb-1">
											<span class="px-2 py-0.5 text-xs font-medium rounded bg-gray-900 text-white">POST</span>
											<span class="text-sm font-mono text-gray-600">/image/agent-screenshot</span>
										</div>
										<p class="text-xs text-gray-600">Take a screenshot using AI agent</p>
									</button>
								</div>
							</div>
					</div>

					<!-- Right Panel - Parameters & Response -->
					<div class="col-span-8 space-y-6">
						<!-- Parameters -->
						<div class="bg-gray-50 rounded-xl p-4">
							<h3 class="text-sm font-medium text-gray-900 mb-4">Request Parameters</h3>
							<div class="space-y-4">
								{#if selectedEndpoint === 'image'}
									<div>
										<label class="flex items-center gap-2 text-sm mb-1">
											<span class="font-medium">html</span>
											<span class="text-xs text-red-500">Required</span>
										</label>
										<p class="text-xs text-gray-600 mb-2">HTML content to convert to image</p>
										<textarea
											class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
											rows="3"
											bind:value={imageParams.html}
										></textarea>
									</div>
									<div class="grid grid-cols-2 gap-4">
										<div>
											<label class="flex items-center gap-2 text-sm mb-1">
												<span class="font-medium">width</span>
												<span class="text-xs text-red-500">Required</span>
											</label>
											<input
												type="number"
												class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
												bind:value={imageParams.width}
											/>
										</div>
										<div>
											<label class="flex items-center gap-2 text-sm mb-1">
												<span class="font-medium">height</span>
												<span class="text-xs text-red-500">Required</span>
											</label>
											<input
												type="number"
												class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
												bind:value={imageParams.height}
											/>
										</div>
									</div>
									<div>
										<label class="text-sm mb-1 block font-medium">url</label>
										<p class="text-xs text-gray-600 mb-2">URL to capture instead of HTML (optional)</p>
										<input
											type="text"
											class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
											placeholder="https://example.com"
											bind:value={imageParams.url}
										/>
									</div>
									<div>
										<label class="text-sm mb-1 block font-medium">selector</label>
										<p class="text-xs text-gray-600 mb-2">CSS selector to capture (optional)</p>
										<input
											type="text"
											class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
											placeholder="body"
											bind:value={imageParams.selector}
										/>
									</div>
									<div>
										<label class="text-sm mb-1 block font-medium">fileExtension</label>
										<p class="text-xs text-gray-600 mb-2">Output format</p>
										<select
											class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
											bind:value={imageParams.fileExtension}
										>
											<option value="png">PNG</option>
											<option value="jpg">JPG</option>
											<option value="jpeg">JPEG</option>
											<option value="webp">WebP</option>
										</select>
									</div>
								{:else if selectedEndpoint === 'gif'}
									<div>
										<label class="flex items-center gap-2 text-sm mb-1">
											<span class="font-medium">html</span>
											<span class="text-xs text-red-500">Required</span>
										</label>
										<p class="text-xs text-gray-600 mb-2">HTML content with CSS animations</p>
										<textarea
											class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
											rows="3"
											bind:value={gifParams.html}
										></textarea>
									</div>
									<div class="grid grid-cols-3 gap-4">
										<div>
											<label class="flex items-center gap-2 text-sm mb-1">
												<span class="font-medium">width</span>
												<span class="text-xs text-red-500">Required</span>
											</label>
											<input
												type="number"
												class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
												bind:value={gifParams.width}
											/>
										</div>
										<div>
											<label class="flex items-center gap-2 text-sm mb-1">
												<span class="font-medium">height</span>
												<span class="text-xs text-red-500">Required</span>
											</label>
											<input
												type="number"
												class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
												bind:value={gifParams.height}
											/>
										</div>
										<div>
											<label class="text-sm mb-1 block font-medium">framesPerSecond</label>
											<input
												type="number"
												min="1"
												max="30"
												class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
												bind:value={gifParams.framesPerSecond}
											/>
										</div>
									</div>
									<div>
										<label class="text-sm mb-1 block font-medium">url</label>
										<p class="text-xs text-gray-600 mb-2">URL to capture instead of HTML (optional)</p>
										<input
											type="text"
											class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
											placeholder="https://example.com"
											bind:value={gifParams.url}
										/>
									</div>
									<div>
										<label class="text-sm mb-1 block font-medium">selector</label>
										<p class="text-xs text-gray-600 mb-2">CSS selector to capture (optional)</p>
										<input
											type="text"
											class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
											placeholder="body"
											bind:value={gifParams.selector}
										/>
									</div>
								{:else if selectedEndpoint === 'agent'}
									<div>
										<label class="flex items-center gap-2 text-sm mb-1">
											<span class="font-medium">prompt</span>
											<span class="text-xs text-red-500">Required</span>
										</label>
										<p class="text-xs text-gray-600 mb-2">Natural language description of what to screenshot</p>
										<textarea
											class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
											rows="3"
											bind:value={agentParams.prompt}
										></textarea>
									</div>
								{/if}
							</div>
						</div>

						<!-- Request Preview -->
						<div class="bg-gray-50 rounded-xl p-4">
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-sm font-medium text-gray-900">Request Preview</h3>
								<button
									class="text-xs text-[#ff6b6b] hover:text-[#ff5252] flex items-center gap-1"
									on:click={() => copyToClipboard(JSON.stringify(requestPayload, null, 2))}
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
										<path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
									</svg>
									Copy
								</button>
							</div>
							<div class="bg-gray-900 rounded-lg p-4">
								<div class="text-gray-300 text-sm font-mono">
									{curlExample}
								</div>
							</div>
						</div>

						<!-- Test Button -->
						<button
							class="w-full bg-[#ff6b6b] text-white py-2 px-4 rounded-lg hover:bg-[#ff5252] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							on:click={currentTestFunction}
							disabled={!apiToken || !isValidParams || loading}
						>
							{#if loading}
								<span class="flex items-center justify-center gap-2">
									<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Generating...
								</span>
							{:else}
								{!apiToken ? 'API Key Required' : 'Test Endpoint'}
							{/if}
						</button>

						<!-- Response -->
						{#if response}
							<div class="bg-gray-50 rounded-xl p-4">
								<div class="flex items-center justify-between mb-4">
									<div class="flex items-center gap-3">
										<h3 class="text-sm font-medium text-gray-900">Response</h3>
										<span class="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">
											Status: 200
										</span>
									</div>
									<button
										class="text-xs text-[#ff6b6b] hover:text-[#ff5252] flex items-center gap-1"
										on:click={() => copyToClipboard(responseJson)}
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
											<path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
											<path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
										</svg>
										Copy
									</button>
								</div>
								<div class="bg-gray-900 rounded-lg p-4">
									<pre class="text-gray-300 text-sm overflow-x-auto"><code>{responseJson}</code></pre>
								</div>
							</div>

							<!-- Generated Media Preview -->
							{#if response.url || response.gif?.url}
								<div class="bg-gray-50 rounded-xl p-4 mt-4">
									<h3 class="text-sm font-medium text-gray-900 mb-4">Generated Media</h3>
									<img
										src={response.url || response.gif?.url}
										alt="Generated media"
										class="w-full rounded-lg shadow-lg"
									/>
									<div class="mt-4">
										<div class="flex items-center justify-between">
											<span class="text-xs text-gray-600">Media URL</span>
											<button
												class="text-xs text-[#ff6b6b] hover:text-[#ff5252] flex items-center gap-1"
												on:click={() => copyToClipboard(response.url || response.gif?.url)}
											>
												<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
													<path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
													<path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
												</svg>
												Copy
											</button>
										</div>
										<div class="bg-gray-100 p-3 rounded-lg mt-2 font-mono text-xs break-all">
											{response.url || response.gif?.url}
										</div>
									</div>
								</div>
							{/if}
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

