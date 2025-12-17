<script>
	import { onDestroy, onMount } from 'svelte';
	import { editor } from '../../../store/editor.store';
	import { streamSwarmGenerate } from '../../../api/copilot-swarm';
	import { tick } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { copilotExecution, copilotActions } from '../../../store/copilot.store';
	import { 
		canUseFeature, 
		trackFeatureUsage, 
		featureGates,
		plgStatus,
		showMilestoneCelebration,
	} from '../../../store/plg.store';
	import { openUpgradeModal } from '../../../store/upgrade-modal.store';

	let messages = [];
	let prompt = '';
	let isLoading = false;
	let error = '';
	let streamError = '';
	let chatContainer;
	let activeStream = null;
	
	// History for Undo
	let previousState = null;
	let canUndo = false;

	// Quality metrics from swarm
	let lastQualityScore = null;
	let lastQualityStrengths = [];
	
	// Agent progress tracking for streaming
	let currentAgent = null;
	let agentSteps = [];
	
	// PLG Feature gating
	let aiCopilotLimit = null;
	let featureLimitReached = false;
	
	$: isPaidPlan = $plgStatus.isPaidPlan;
	$: aiCopilotUsage = $featureGates.aiCopilot;
	
	onMount(async () => {
		// Check feature availability on mount
		aiCopilotLimit = await canUseFeature('aiCopilot');
		featureLimitReached = !aiCopilotLimit?.allowed;
	});

	const QUICK_ACTIONS = [
		"Make it modern",
		"Add a dark mode version",
		"Increase contrast",
		"Add a call to action button"
	];

	function cleanupStream() {
		if (activeStream && typeof activeStream.abort === 'function') {
			activeStream.abort();
		}
		activeStream = null;
	}

	onDestroy(() => {
		cleanupStream();
	});

	async function applyCanvasState(canvasJson) {
		if (!$editor || !canvasJson) {
			console.warn('[Copilot] Cannot apply canvas state:', { hasEditor: !!$editor, hasState: !!canvasJson });
			return;
		}

		// Validate canvas state has objects
		if (!canvasJson.objects || !Array.isArray(canvasJson.objects)) {
			console.error('[Copilot] Invalid canvas state - missing objects array:', canvasJson);
			return;
		}

		console.log('[Copilot] Applying canvas state:', {
			objectCount: canvasJson.objects.length,
			background: canvasJson.background,
			width: canvasJson.width,
			height: canvasJson.height
		});

		// Batch history to prevent polluting undo/redo stack during copilot updates
		if (typeof window !== 'undefined' && window.__historyBatchStart) {
			window.__historyBatchStart();
		}

		await new Promise((resolve) => {
		$editor.loadFromJSON(canvasJson, () => {
			// Log canvas and first few objects for debugging
			console.log('[Copilot] Canvas dimensions after load:', {
				width: $editor.width,
				height: $editor.height,
				zoom: $editor.getZoom()
			});
			
			const objects = $editor.getObjects();
			if (objects.length > 0) {
				console.log('[Copilot] First object:', {
					type: objects[0].type,
					left: objects[0].left,
					top: objects[0].top,
					width: objects[0].width,
					height: objects[0].height,
					fill: objects[0].fill,
					opacity: objects[0].opacity,
					visible: objects[0].visible
				});
			}
			
			// Explicitly render all objects
			$editor.renderAll();
			$editor.requestRenderAll();
			
			// Force a second render after a delay to ensure all objects are drawn
			setTimeout(() => {
				$editor.renderAll();
				$editor.requestRenderAll();
				console.log('[Copilot] Canvas rendered with', $editor.getObjects().length, 'objects');
				resolve();
			}, 100);
		});
	});

	// End batch after render completes
	if (typeof window !== 'undefined' && window.__historyBatchEnd) {
		window.__historyBatchEnd();
	}
	}

	/**
	 * Handle incoming step payload from SSE
	 * Payload contains: { step, canvasState }
	 */
	async function handleStepPayload(payload = {}) {
		console.log('[Copilot Swarm] Received step payload:', payload);
		console.log('[Copilot Swarm] Canvas state present?', !!payload.canvasState);
		
		const { step, canvasState } = payload;
		
		if (step) {
			// Track current agent
			currentAgent = step.agent;
			
			// Add step to agent steps list
			agentSteps = [...agentSteps, step];
			
			// Update copilot store with the step
			copilotActions.upsertSteps([step]);
			
			// Add assistant message for agent progress
			if (step.status === 'started') {
				const agentEmoji = {
					'Creative Director': '🎨',
					'Content Writer': '✍️',
					'Design Composer': '🎯',
					'Vision Critic': '👁️',
					'Canvas': '🖼️'
				};
				const emoji = agentEmoji[step.agent] || '🤖';
				messages = [...messages, { 
					role: 'system', 
					content: `${emoji} ${step.agent}: ${step.description}` 
				}];
			}
		}
		
		// Apply canvas state if provided (real-time preview)
		if (canvasState) {
			console.log('[Copilot Swarm] Applying canvas state from step event');
			await applyCanvasState(canvasState);
		} else {
			console.log('[Copilot Swarm] No canvas state in step payload');
		}
		
		scrollToBottom();
	}

	async function handleCompletePayload(payload = {}) {
		cleanupStream();
		
		console.log('[Copilot Swarm] Generation complete:', payload);
		console.log('[Copilot Swarm] Complete payload keys:', Object.keys(payload));
		console.log('[Copilot Swarm] Canvas state present?', !!payload.canvasState);
		
		// Extract canvas state from swarm response
		if (payload.success && payload.canvasState) {
			console.log('[Copilot Swarm] Applying final canvas state from complete event');
			await applyCanvasState(payload.canvasState);
		} else {
			console.warn('[Copilot Swarm] No canvas state in complete payload or generation failed', {
				success: payload.success,
				hasCanvasState: !!payload.canvasState
			});
		}
		
		// Store quality metrics
		if (payload.quality) {
			lastQualityScore = payload.quality.score;
			lastQualityStrengths = payload.quality.strengths || [];
		}
		
		// Update store with execution steps if provided
		if (payload.executedSteps) {
			copilotActions.upsertSteps(payload.executedSteps);
		}
		
		copilotActions.setLoading(false);
		isLoading = false;
		currentAgent = null;
		
		if (payload.success) {
			let responseMessage = '✨ Design generated successfully!';
			if (payload.design?.reasoning) {
				responseMessage = payload.design.reasoning;
			}
			if (lastQualityScore) {
				responseMessage += ` (Quality: ${lastQualityScore}/10)`;
			}
			if (payload.totalTimeMs) {
				const seconds = (payload.totalTimeMs / 1000).toFixed(1);
				responseMessage += ` • Generated in ${seconds}s`;
			}
			messages = [...messages, { role: 'assistant', content: responseMessage }];
		} else {
			error = payload.error || 'Generation failed';
			messages = [...messages, { role: 'assistant', content: `Error: ${error}` }];
		}
		
		scrollToBottom();
	}

	function handleStreamFailure(err) {
		cleanupStream();
		streamError = err?.message || 'Streaming interrupted. Please try again.';
		error = streamError;
		copilotActions.setError(streamError);
		copilotActions.setLoading(false);
		isLoading = false;
		messages = [...messages, { role: 'assistant', content: `Error: ${streamError}` }];
	}

	async function scrollToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	async function handleGenerate(customPrompt = null) {
		const textToUse = customPrompt || prompt;
		if (!textToUse.trim()) return;
		
		// Check feature limit for free users
		if (!isPaidPlan) {
			const limitCheck = await canUseFeature('aiCopilot');
			if (!limitCheck.allowed) {
				featureLimitReached = true;
				error = 'You\'ve reached your AI Copilot limit for this month. Upgrade to continue!';
				messages = [...messages, { 
					role: 'system', 
					content: '🔒 AI Copilot limit reached. Upgrade for unlimited AI generations!' 
				}];
				return;
			}
			
			// Show warning if close to limit
			if (limitCheck.remaining <= 1) {
				messages = [...messages, { 
					role: 'system', 
					content: `⚠️ Last free AI generation! Upgrade for unlimited access.` 
				}];
			}
		}
		
		if ($editor) {
			previousState = JSON.stringify($editor.toJSON());
			canUndo = true;
		}

		const userMessage = { role: 'user', content: textToUse };
		messages = [...messages, userMessage];
		prompt = '';
		isLoading = true;
		error = '';
		streamError = '';
		lastQualityScore = null;
		lastQualityStrengths = [];
		
		await scrollToBottom();

		const canvasState = $editor ? $editor.toJSON() : null;

		try {
			copilotActions.startExecution([]);
			copilotActions.setLoading(true);
			agentSteps = [];
			currentAgent = null;

			cleanupStream();

			activeStream = await streamSwarmGenerate({
				prompt: textToUse,
				canvasState,
				options: { 
					maxRefinements: 2,
					targetScore: 7
				},
				onStep: (payload) => handleStepPayload(payload),
				onComplete: async (payload) => {
					await handleCompletePayload(payload);
					
					// Track feature usage after successful generation
					if (payload.success && !isPaidPlan) {
						const result = await trackFeatureUsage('aiCopilot');
						if (result.milestone?.isNew) {
							showMilestoneCelebration(result.milestone);
						}
						// Update limit check
						aiCopilotLimit = await canUseFeature('aiCopilot');
						featureLimitReached = !aiCopilotLimit?.allowed;
					}
				},
				onError: (err) => handleStreamFailure(err)
			});
		} catch (err) {
			console.error(err);
			error = 'Something went wrong. Please try again.';
			copilotActions.setError(error);
			isLoading = false;
			messages = [...messages, { role: 'assistant', content: `Error: ${error}` }];
		}
	}

	function handleUndo() {
		if (!previousState || !$editor) return;
		
		$editor.loadFromJSON(JSON.parse(previousState), () => {
			$editor.renderAll();
			canUndo = false;
			previousState = null;
			messages = [...messages, { role: 'system', content: "Undid last change." }];
			scrollToBottom();
		});
	}

	function handleClearHistory() {
		messages = [];
		canUndo = false;
		previousState = null;
		lastQualityScore = null;
		lastQualityStrengths = [];
		agentSteps = [];
		currentAgent = null;
		copilotActions.clearExecution();
		cleanupStream();
	}

	function handleSaveTemplate() {
		if (!$editor) return;
		const json = JSON.stringify($editor.toJSON());
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'template.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleGenerate();
		}
	}
</script>

<div class="flex flex-col h-full bg-gray-50/50">
	<!-- Feature limit banner -->
	{#if featureLimitReached && !isPaidPlan}
		<div class="px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-lg">🔒</span>
					<div>
						<p class="text-sm font-semibold">AI Copilot Limit Reached</p>
						<p class="text-xs opacity-90">Upgrade for unlimited AI generations</p>
					</div>
				</div>
				<button 
					on:click={() => openUpgradeModal('ai_copilot')}
					class="px-3 py-1.5 bg-white text-purple-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors"
				>
					Upgrade
				</button>
			</div>
		</div>
	{:else if !isPaidPlan && aiCopilotLimit?.remaining > 0 && aiCopilotLimit?.remaining <= 3}
		<div class="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center justify-between">
			<span>⚡ {aiCopilotLimit.remaining} free AI generation{aiCopilotLimit.remaining !== 1 ? 's' : ''} remaining</span>
			<button on:click={() => openUpgradeModal('ai_copilot')} class="font-semibold text-amber-700 hover:underline">Upgrade</button>
		</div>
	{/if}

	<!-- Header -->
	<div class="px-4 py-3 border-b border-gray-900 bg-white flex justify-between items-center shrink-0">
		<div class="flex items-center gap-2">
			<div class="w-6 h-6 rounded-lg bg-gradient-to-br from-[#ff6b6b] to-[#ffc480] flex items-center justify-center shadow-[2px_2px_0_0_#1f2937]">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
				</svg>
			</div>
			<span class="font-semibold text-gray-800 text-sm">Design Copilot</span>
			{#if !isPaidPlan && aiCopilotLimit?.remaining >= 0}
				<span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
					{aiCopilotLimit.remaining}/{aiCopilotLimit.limit} left
				</span>
			{/if}
			{#if lastQualityScore}
				<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
					{lastQualityScore}/10
				</span>
			{/if}
		</div>
		
		<div class="flex items-center gap-1">
			{#if canUndo}
				<button 
					class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
					on:click={handleUndo}
					title="Undo last AI change"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M3 7v6h6"></path>
						<path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
					</svg>
				</button>
			{/if}
			<button 
				class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
				on:click={handleClearHistory}
				title="Clear History"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="3 6 5 6 21 6"></polyline>
					<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
				</svg>
			</button>
		</div>
	</div>

	<!-- Chat History -->
	<div 
		bind:this={chatContainer}
		class="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scroll-smooth"
	>
		{#if messages.length === 0}
			<div class="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
				<div class="w-12 h-12 rounded-lg border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] bg-gray-100 flex items-center justify-center mb-2">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300">
						<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
					</svg>
				</div>
				<p class="text-sm font-medium">How can I help you design?</p>
				
				<div class="grid grid-cols-1 gap-2 w-full max-w-xs">
					{#each QUICK_ACTIONS as action}
						<button 
							class="text-xs text-left px-3 py-2 bg-white border border-gray-900 rounded-lg hover:border-[#ff6b6b] hover:text-[#ff6b6b] transition-colors shadow-[2px_2px_0_0_#1f2937]"
							on:click={() => handleGenerate(action)}
						>
							{action}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#each messages as msg}
			<div 
				class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}"
				transition:fly={{ y: 10, duration: 200 }}
			>
				<div class="max-w-[85%] rounded-lg border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] px-4 py-3 text-sm shadow-[2px_2px_0_0_#1f2937] {msg.role === 'user' ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffc480] text-white rounded-tr-sm' : msg.role === 'system' ? 'bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-lg' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'}">
					{msg.content}
				</div>
			</div>
		{/each}

		{#if isLoading}
			<div class="flex justify-start" transition:fade>
				<div class="bg-white border border-gray-100 rounded-lg border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-[2px_2px_0_0_#1f2937]">
					<div class="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-bounce" style="animation-delay: 0ms"></div>
					<div class="w-1.5 h-1.5 bg-[#ffc480] rounded-full animate-bounce" style="animation-delay: 150ms"></div>
					<div class="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-bounce" style="animation-delay: 300ms"></div>
					{#if currentAgent}
						<span class="ml-2 text-xs text-gray-500">{currentAgent}...</span>
					{/if}
				</div>
			</div>
		{/if}
		
		{#if error}
			<div class="text-center text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100" transition:slide>
				{error}
			</div>
		{/if}

		{#if streamError}
			<div class="text-center text-xs text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-100" transition:slide>
				{streamError}
			</div>
		{/if}

		{#if $copilotExecution.currentSteps.length > 0}
			<div class="pt-4 border-t border-gray-900 space-y-2">
				<p class="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
					Execution Steps
					{#if $copilotExecution.isLoading}
						<span class="text-[#ff6b6b] animate-pulse">running…</span>
					{/if}
				</p>
				<div class="space-y-1.5">
					{#each $copilotExecution.currentSteps as step, index}
						<div class="bg-white border border-gray-900 rounded-lg p-2 text-xs">
							<div class="flex items-start gap-2">
								<span class="font-mono text-gray-400">#{step.stepNumber || index + 1}</span>
								<div class="flex-1">
									<div class="font-medium text-gray-700">{step.tool || 'Unknown'}</div>
									{#if step.reasoning}
										<div class="text-gray-500 mt-0.5">{step.reasoning}</div>
									{/if}
								</div>
								{#if step.success}
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-green-500 shrink-0 mt-0.5">
										<polyline points="20 6 9 17 4 12"></polyline>
									</svg>
								{:else if step.error}
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-red-500 shrink-0 mt-0.5">
										<circle cx="12" cy="12" r="10"></circle>
										<line x1="15" y1="9" x2="9" y2="15"></line>
										<line x1="9" y1="9" x2="15" y2="15"></line>
									</svg>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if lastQualityStrengths.length > 0}
			<div class="pt-2 space-y-2">
				<p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Design Strengths</p>
				<div class="flex flex-wrap gap-1.5">
					{#each lastQualityStrengths as strength}
						<span class="text-xs px-2 py-1 rounded-md bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/20">
							{strength}
						</span>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Input Area -->
	<div class="p-4 border-t border-gray-900 bg-white shrink-0">
		<div class="relative group">
			<textarea
				bind:value={prompt}
				on:keydown={handleKeydown}
				rows="1"
				class="w-full pl-4 pr-12 py-3 border border-gray-900 rounded-lg focus:ring-0 focus:border-gray-900 focus:shadow-[2px_2px_0_0_#ffc480] text-sm resize-none shadow-[2px_2px_0_0_#1f2937] transition-all min-h-[50px] max-h-[150px]"
				placeholder="Describe your design..."
				disabled={isLoading}
			></textarea>
			<button
				on:click={() => handleGenerate()}
				disabled={isLoading || !prompt.trim()}
				class="absolute right-2 bottom-2 p-2 text-[#ff6b6b] hover:bg-[#ff6b6b]/10 rounded-lg disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
			>
				{#if isLoading}
					<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				{:else}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="22" y1="2" x2="11" y2="13"></line>
						<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
					</svg>
				{/if}
			</button>
		</div>
		<div class="mt-2 flex justify-between items-center px-1">
			<span class="text-[10px] text-gray-400 flex items-center gap-1">
				<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
				</svg>
				Swarm AI · Multi-Agent
			</span>
			<button 
				class="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
				on:click={handleSaveTemplate}
			>
				Save as JSON
			</button>
		</div>
	</div>
</div>
