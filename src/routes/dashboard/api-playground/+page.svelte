<script>
	import { browser } from '$app/environment';
	import { user, getAPITokenAction } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';
	import Toast from '$lib/components/Toast.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { createImage, createGif, createAgentScreenshot } from '../../../api/image';
	import { onMount, onDestroy } from 'svelte';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';

	let apiToken = '';
	let selectedEndpoint = 'image';
	let loading = false;
	let response = null;
	let responseJson = '';
	let isUserLoggedIn = false;

	let hasTriedToFetchTokens = false;
	let unsubscribe = () => {};
	let copiedCurl = false;
	
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

	function handleCopyCurl() {
		if (!curlExample) return;

		copyToClipboard(curlExample.copy);
		copiedCurl = true;
		setTimeout(() => {
			copiedCurl = false;
		}, 2000);
	}

	const escapeSingleQuotes = (value = '') => value.replace(/'/g, `'"'"'`);

	function setSelectedEndpoint(endpoint) {
		selectedEndpoint = endpoint;
		response = null;
		responseJson = '';
	}

	// Reactive curl example
	$: backendBaseUrl = (() => {
		const fallbackUrl = browser ? window.location.origin : 'https://pictify.io';
		const rawUrl = PUBLIC_BACKEND_URL || fallbackUrl;
		return rawUrl?.replace(/\/$/, '') || '';
	})();

	$: curlExample = (() => {
		if (!backendBaseUrl) {
			return null;
		}
		const authToken = apiToken || 'YOUR_API_TOKEN';

		const buildExample = (path, payload) => {
			const payloadPretty = JSON.stringify(payload, null, 2);
			const payloadSingleLine = JSON.stringify(payload);
			const displayLines = [
				`curl -X POST ${backendBaseUrl}${path}`,
				`  -H "Content-Type: application/json"`,
				`  -H "Authorization: Bearer ${authToken}"`,
				`  --data-raw '${payloadPretty}'`
			];
			const copyLines = [
				`curl -X POST ${backendBaseUrl}${path}`,
				`-H "Content-Type: application/json"`,
				`-H "Authorization: Bearer ${authToken}"`,
				`--data-raw '${escapeSingleQuotes(payloadSingleLine)}'`
			];
			return {
				display: displayLines.join(' \\\n'),
				copy: copyLines.join(' ')
			};
		};

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
			return buildExample('/image', payload);
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
			return buildExample('/gif', payload);
		} else if (selectedEndpoint === 'agent') {
			const payload = {
				prompt: agentParams.prompt
			};
			return buildExample('/image/agent-screenshot', payload);
		}
		return null;
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

<div class="min-h-screen w-full bg-[#FFFDF8] relative overflow-hidden">
	<!-- Background Grid -->
	<div class="absolute inset-0 opacity-5 pointer-events-none" 
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;">
	</div>

	<div class="max-w-7xl mx-auto p-4 sm:p-6 md:p-10 relative z-10">
		<!-- Header -->
		<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
			<div>
				<div class="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-gray-900 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded mb-2 sm:mb-3">
					<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#ffc480] rounded-full animate-pulse"></span>
					Dev Tools
				</div>
				<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
					API <span class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">Playground</span>
				</h1>
			</div>
			
			<!-- Status Badge -->
			<div class="flex items-center gap-1.5 sm:gap-2 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-[2px] sm:border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] sm:shadow-[4px_4px_0_0_#1f2937]">
				<div class="w-2 h-2 sm:w-3 sm:h-3 bg-[#4ade80] rounded-full animate-pulse"></div>
				<span class="text-[10px] sm:text-xs font-black text-gray-900 uppercase tracking-wider">System OK</span>
			</div>
		</div>

		<!-- Main Grid -->
		<div class="grid grid-cols-12 gap-4 sm:gap-6 md:gap-8">
			
			<!-- Left Panel: Navigation & Auth -->
			<div class="col-span-12 lg:col-span-4 space-y-4 sm:space-y-6 md:space-y-8">
				
				<!-- Auth Card -->
				<div class="bg-white rounded-xl sm:rounded-2xl border-[2px] sm:border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] sm:shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
					<div class="bg-gray-100 p-3 sm:p-4 border-b-[2px] sm:border-b-[3px] border-gray-900 flex items-center gap-1.5 sm:gap-2">
						<svg class="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
						<h3 class="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wide">Authentication</h3>
					</div>
					<div class="p-3 sm:p-4 md:p-5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
						{#if isUserLoggedIn && apiToken}
							<div class="relative group">
								<div class="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
									<span class="text-[10px] sm:text-xs font-black text-gray-400">KEY</span>
								</div>
								<input
									type="password"
									class="w-full pl-8 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-3 bg-white border-[2px] sm:border-[3px] border-gray-900 rounded-lg sm:rounded-xl text-xs sm:text-sm font-mono font-bold text-gray-900 focus:outline-none focus:shadow-[3px_3px_0_0_#ffc480] sm:focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
									value={apiToken}
									readonly
								/>
								<button
									class="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
									on:click={() => copyToClipboard(apiToken)}
									title="Copy API Key"
								>
									<svg class="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
									</svg>
								</button>
							</div>
						{:else}
							<div class="text-center py-3 sm:py-4">
								<p class="text-xs sm:text-sm font-bold text-gray-600 mb-3 sm:mb-4">API Key Required</p>
								<a href="/dashboard/api-token" class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#ff6b6b] text-white text-xs sm:text-sm font-black uppercase tracking-wide rounded-lg border-[2px] sm:border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] sm:shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
									Get API Key
								</a>
							</div>
						{/if}
					</div>
				</div>

				<!-- Endpoints Menu -->
				<div class="bg-white rounded-xl sm:rounded-2xl border-[2px] sm:border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] sm:shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
					<div class="bg-gray-100 p-3 sm:p-4 border-b-[2px] sm:border-b-[3px] border-gray-900 flex items-center gap-1.5 sm:gap-2">
						<svg class="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
						<h3 class="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wide">Endpoints</h3>
					</div>
					<div class="p-1.5 sm:p-2 space-y-1.5 sm:space-y-2 bg-[#FFFDF8]">
						<button
							class="w-full p-3 rounded-xl border-[3px] text-left transition-all group relative overflow-hidden {selectedEndpoint === 'image' 
								? 'border-gray-900 bg-gray-900 text-white shadow-[4px_4px_0_0_#ffc480]' 
								: 'border-transparent hover:bg-gray-100 hover:border-gray-300 text-gray-600 hover:text-gray-900'}"
							on:click={() => setSelectedEndpoint('image')}
						>
							<div class="flex items-center justify-between relative z-10">
								<div class="flex items-center gap-3">
									<span class="px-2 py-1 text-[10px] font-black rounded bg-[#ff6b6b] text-white border border-gray-900">POST</span>
									<span class="text-sm font-mono font-bold">/image</span>
								</div>
								{#if selectedEndpoint === 'image'}
									<div class="w-2 h-2 bg-[#ffc480] rounded-full animate-pulse"></div>
								{/if}
							</div>
						</button>

						<button
							class="w-full p-3 rounded-xl border-[3px] text-left transition-all group relative overflow-hidden {selectedEndpoint === 'gif' 
								? 'border-gray-900 bg-gray-900 text-white shadow-[4px_4px_0_0_#ffc480]' 
								: 'border-transparent hover:bg-gray-100 hover:border-gray-300 text-gray-600 hover:text-gray-900'}"
							on:click={() => setSelectedEndpoint('gif')}
						>
							<div class="flex items-center justify-between relative z-10">
								<div class="flex items-center gap-3">
									<span class="px-2 py-1 text-[10px] font-black rounded bg-[#ff6b6b] text-white border border-gray-900">POST</span>
									<span class="text-sm font-mono font-bold">/gif</span>
								</div>
								{#if selectedEndpoint === 'gif'}
									<div class="w-2 h-2 bg-[#ffc480] rounded-full animate-pulse"></div>
								{/if}
							</div>
						</button>

						<button
							class="w-full p-3 rounded-xl border-[3px] text-left transition-all group relative overflow-hidden {selectedEndpoint === 'agent' 
								? 'border-gray-900 bg-gray-900 text-white shadow-[4px_4px_0_0_#ffc480]' 
								: 'border-transparent hover:bg-gray-100 hover:border-gray-300 text-gray-600 hover:text-gray-900'}"
							on:click={() => setSelectedEndpoint('agent')}
						>
							<div class="flex items-center justify-between relative z-10">
								<div class="flex items-center gap-3">
									<span class="px-2 py-1 text-[10px] font-black rounded bg-[#ff6b6b] text-white border border-gray-900">POST</span>
									<span class="text-sm font-mono font-bold">/agent-screenshot</span>
								</div>
								{#if selectedEndpoint === 'agent'}
									<div class="w-2 h-2 bg-[#ffc480] rounded-full animate-pulse"></div>
								{/if}
							</div>
						</button>
					</div>
				</div>
			</div>

			<!-- Right Panel: Console -->
			<div class="col-span-12 lg:col-span-8 space-y-4 sm:space-y-6 md:space-y-8">
				
				<!-- Request Builder -->
				<div class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
					<div class="bg-gray-100 p-4 border-b-[3px] border-gray-900 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border border-gray-900"></div>
							<div class="w-3 h-3 rounded-full bg-[#ffc480] border border-gray-900"></div>
							<div class="w-3 h-3 rounded-full bg-[#4ade80] border border-gray-900"></div>
						</div>
						<h3 class="text-sm font-black text-gray-900 uppercase tracking-wide">Request Configuration</h3>
					</div>
					
					<div class="p-6 space-y-6">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							{#if selectedEndpoint === 'image' || selectedEndpoint === 'gif'}
								<div class="md:col-span-2">
									<label for="html-input" class="flex items-center justify-between text-xs font-black text-gray-900 uppercase tracking-wide mb-2">
										<span>HTML Payload</span>
										<span class="text-[10px] bg-[#ff6b6b] text-white px-2 py-0.5 rounded border border-gray-900">REQUIRED</span>
									</label>
									<div class="relative">
										{#if selectedEndpoint === 'image'}
											<textarea
												id="html-input"
												class="w-full h-48 px-4 py-3 bg-gray-50 border-[3px] border-gray-900 rounded-xl text-sm font-mono focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#ffc480] transition-all resize-none"
												bind:value={imageParams.html}
											></textarea>
										{:else}
											<textarea
												id="html-input"
												class="w-full h-48 px-4 py-3 bg-gray-50 border-[3px] border-gray-900 rounded-xl text-sm font-mono focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#ffc480] transition-all resize-none"
												bind:value={gifParams.html}
											></textarea>
										{/if}
										<div class="absolute bottom-3 right-3 text-[10px] font-bold text-gray-400 uppercase">HTML/CSS</div>
									</div>
								</div>

								<div>
									<label for="width-input" class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Width (px)</label>
									{#if selectedEndpoint === 'image'}
										<input
											id="width-input"
											type="number"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={imageParams.width}
										/>
									{:else}
										<input
											id="width-input"
											type="number"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={gifParams.width}
										/>
									{/if}
								</div>

								<div>
									<label for="height-input" class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Height (px)</label>
									{#if selectedEndpoint === 'image'}
										<input
											id="height-input"
											type="number"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={imageParams.height}
										/>
									{:else}
										<input
											id="height-input"
											type="number"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={gifParams.height}
										/>
									{/if}
								</div>

								{#if selectedEndpoint === 'image'}
									<div>
										<label for="format-input" class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Format</label>
										<div class="relative">
											<select
												id="format-input"
												class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all appearance-none cursor-pointer"
												bind:value={imageParams.fileExtension}
											>
												<option value="png">PNG</option>
												<option value="jpg">JPG</option>
												<option value="webp">WebP</option>
											</select>
											<div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
												<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
											</div>
										</div>
									</div>
									<div>
										<label for="selector-input" class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">CSS Selector</label>
										<input
											id="selector-input"
											type="text"
											placeholder="body"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={imageParams.selector}
										/>
									</div>
								{:else}
									<div>
										<label for="fps-input" class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">FPS</label>
										<input
											id="fps-input"
											type="number"
											min="1"
											max="30"
											class="w-full px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
											bind:value={gifParams.framesPerSecond}
										/>
									</div>
								{/if}

							{:else if selectedEndpoint === 'agent'}
								<div class="md:col-span-2">
									<label for="prompt-input" class="flex items-center justify-between text-xs font-black text-gray-900 uppercase tracking-wide mb-2">
										<span>Prompt</span>
										<span class="text-[10px] bg-[#ff6b6b] text-white px-2 py-0.5 rounded border border-gray-900">REQUIRED</span>
									</label>
									<textarea
										id="prompt-input"
										class="w-full h-32 px-4 py-3 bg-gray-50 border-[3px] border-gray-900 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#ffc480] transition-all resize-none"
										bind:value={agentParams.prompt}
										placeholder="Describe what you want to capture..."
									></textarea>
								</div>
							{/if}
						</div>

						<div class="pt-4 border-t-[3px] border-gray-200 border-dashed">
							<button
								class="w-full py-4 bg-[#ff6b6b] text-white font-black uppercase tracking-widest rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-[4px_4px_0_0_#1f2937]"
								on:click={currentTestFunction}
								disabled={!apiToken || !isValidParams || loading}
							>
								{#if loading}
									<span class="flex items-center justify-center gap-2">
										<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Processing Request...
									</span>
								{:else}
									Run Request
								{/if}
							</button>
						</div>
					</div>
				</div>

				<!-- CURL & Response -->
				<div class="relative group">
					<!-- Terminal Window -->
					<div class="bg-[#1a1b26] rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden flex flex-col min-h-[400px]">
						<!-- Terminal Header -->
						<div class="bg-[#16161e] border-b-[3px] border-gray-900 p-3 flex items-center justify-between shrink-0">
							<div class="flex items-center gap-2">
								<div class="flex gap-1.5 mr-4">
									<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border border-gray-900"></div>
									<div class="w-3 h-3 rounded-full bg-[#ffc480] border border-gray-900"></div>
									<div class="w-3 h-3 rounded-full bg-[#4ade80] border border-gray-900"></div>
								</div>
								<div class="hidden sm:flex items-center gap-2 px-2 py-1 rounded bg-gray-800/50 border border-gray-700/50">
									<svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
									</svg>
									<span class="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">bash — 80x24</span>
								</div>
							</div>
							
							{#if curlExample && !response}
								<button 
									class="flex items-center gap-2 px-3 py-1.5 bg-[#ffc480] text-gray-900 text-[10px] font-black uppercase tracking-widest rounded border-[2px] border-gray-900 shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all active:translate-y-[2px]"
									on:click={handleCopyCurl}
								>
									{#if copiedCurl}
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
										<span>Copied</span>
									{:else}
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
										<span>Copy</span>
									{/if}
								</button>
							{:else if response}
								<button 
									class="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded border-[2px] border-gray-700 hover:text-white hover:border-white transition-all"
									on:click={() => { response = null; responseJson = ''; }}
								>
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
									Clear
								</button>
							{/if}
						</div>

						<!-- Terminal Content -->
						<div class="flex-1 p-6 font-mono text-sm relative overflow-hidden">
							<!-- Matrix/Grid Background -->
							<div class="absolute inset-0 opacity-10 pointer-events-none" 
								style="background-image: linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px); background-size: 20px 20px;">
							</div>

							<div class="relative z-10">
								{#if response}
									<!-- Response View -->
									<div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
										<!-- Status Bar -->
										<div class="flex items-center gap-3 pb-4 border-b border-gray-800/50">
											<div class="flex items-center gap-2 text-[#4ade80]">
												<span class="text-lg">➜</span>
												<span class="font-black text-lg">200 OK</span>
											</div>
											<span class="text-gray-600">|</span>
											<span class="text-gray-500 text-xs">{(new Date()).toLocaleTimeString()}</span>
										</div>
										
										<!-- Generated Asset Preview -->
										{#if response.url || response.gif?.url}
											<div class="relative group/preview">
												<div class="absolute -inset-1 bg-gradient-to-r from-[#ff6b6b] to-[#ffc480] opacity-20 blur rounded-xl group-hover/preview:opacity-40 transition-opacity"></div>
												<div class="relative bg-[#16161e] rounded-xl border-2 border-gray-700 overflow-hidden">
													<!-- Header -->
													<div class="px-4 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
														<span class="text-[10px] font-black text-gray-400 uppercase tracking-wider">Preview Output</span>
														<div class="flex gap-2">
															<button 
																class="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
																on:click={() => copyToClipboard(response.url || response.gif?.url)}
																title="Copy URL"
															>
																<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
															</button>
															<a 
																href={response.url || response.gif?.url} 
																target="_blank"
																class="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
																title="Open in new tab"
															>
																<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
															</a>
														</div>
													</div>
													<!-- Image -->
													<div class="p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBoNHY0SDB6bTQgNGg0djRINHoiIGZpbGw9IiMzMzMiIGZpbGwtb3BhY2l0eT0iLjEiLz48L3N2Zz4=')]">
														<img 
															src={response.url || response.gif?.url} 
															alt="Result" 
															class="w-full rounded shadow-2xl"
														/>
													</div>
												</div>
											</div>
										{/if}

										<!-- JSON Response -->
										<div class="relative">
											<div class="absolute left-0 top-0 bottom-0 w-[2px] bg-[#4ade80]/20"></div>
											<div class="pl-4">
												<div class="text-[10px] font-bold text-gray-500 mb-2 uppercase">JSON Payload</div>
												<pre class="text-[#a9b1d6] overflow-x-auto custom-scrollbar text-xs leading-relaxed">{responseJson}</pre>
											</div>
										</div>
									</div>
								{:else}
									<!-- cURL View -->
									<div class="space-y-2">
										<div class="flex items-center gap-2 text-gray-500 mb-4 select-none">
											<span>$</span>
											<span class="text-[#7aa2f7]">curl_request.sh</span>
										</div>
										
										{#if curlExample}
											<div class="group/code relative">
												<!-- Syntax Highlighted cURL -->
												<div class="text-[#c0caf5] whitespace-pre-wrap break-all leading-loose">
													<span class="text-[#f7768e]">curl</span>
													<span class="text-[#bb9af7]"> -X</span> <span class="text-[#7aa2f7]">POST</span> {backendBaseUrl}{endpointPath} \
													<span class="block pl-4">
														<span class="text-[#bb9af7]">-H</span> <span class="text-[#9ece6a]">&quot;Content-Type: application/json&quot;</span> \
													</span>
													<span class="block pl-4">
														<span class="text-[#bb9af7]">-H</span> <span class="text-[#9ece6a]">&quot;Authorization: Bearer {apiToken || 'YOUR_TOKEN'}&quot;</span> \
													</span>
													<span class="block pl-4">
														<span class="text-[#bb9af7]">--data-raw</span> <span class="text-[#e0af68]">&#39;{JSON.stringify(requestPayload, null, 2)}&#39;</span>
													</span>
												</div>
												
												<!-- Blinking Cursor -->
												<span class="inline-block w-2.5 h-5 bg-[#a9b1d6] animate-pulse align-middle ml-1 mt-1"></span>
											</div>
										{:else}
											<div class="flex flex-col items-center justify-center h-[200px] text-gray-600">
												<div class="w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mb-2"></div>
												<p class="text-xs uppercase tracking-wider">Initializing...</p>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					</div>
					
					<!-- Decorative Elements underneath -->
					<div class="absolute -z-10 -bottom-2 -right-2 w-full h-full bg-gray-900/5 rounded-2xl border border-gray-900/10"></div>
				</div>

			</div>
		</div>
	</div>
</div>

<Toast />