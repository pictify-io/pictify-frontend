<script>
	import { onDestroy, onMount } from 'svelte';
	import { editor } from '../../../store/editor.store';
	import { streamSimpleGenerate, streamCopilotGenerate } from '../../../api/copilot-simple';
	import { getBrandAssets } from '../../../api/brand-assets';
	import { tick } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import {
		copilotExecution,
		copilotActions,
		copilotConversation,
		contextMessages
	} from '../../../store/copilot.store';
	import {
		canSafelyUndo,
		historyActions
	} from '../../../store/history.store';
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
	let textareaElement;
	let activeStream = null;

	// Race condition guards
	let destroyed = false;
	let renderTimeoutId = null;

	// Undo is now handled by unified history store
	// Check $canSafelyUndo for whether undo is available and safe

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

		// Clear any pending render timeout
		if (renderTimeoutId) {
			clearTimeout(renderTimeoutId);
			renderTimeoutId = null;
		}

		// Reset streaming and loading state to prevent stuck UI
		historyActions.setStreaming(false);
		isLoading = false;
		copilotActions.setLoading(false);
	}

	onDestroy(() => {
		destroyed = true;
		cleanupStream();
	});

	async function applyCanvasState(canvasJson) {
		// Guard: check if destroyed before proceeding
		if (destroyed) return;

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

		// Use unified history store for batching copilot updates
		historyActions.startBatch('Copilot canvas update', 'copilot');
		historyActions.setStreaming(true);

		try {
			await new Promise((resolve) => {
				// Guard: check if destroyed in callback
				if (destroyed) {
					resolve();
					return;
				}

				$editor.loadFromJSON(canvasJson, () => {
					// Guard: check if destroyed after async load
					if (destroyed) {
						resolve();
						return;
					}

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
					// Store timeout ID for cleanup
					if (renderTimeoutId) {
						clearTimeout(renderTimeoutId);
					}
					renderTimeoutId = setTimeout(() => {
						renderTimeoutId = null;
						// Guard: check if destroyed before rendering
						if (destroyed || !$editor) {
							resolve();
							return;
						}
						$editor.renderAll();
						$editor.requestRenderAll();
						console.log('[Copilot] Canvas rendered with', $editor.getObjects().length, 'objects');
						resolve();
					}, 100);
				});
			});
		} finally {
			// Always clean up streaming state, even on error
			historyActions.setStreaming(false);
			historyActions.endBatch();
		}
	}

	/**
	 * Handle incoming step payload from SSE
	 * Payload contains: { step, canvasState }
	 */
	async function handleStepPayload(payload = {}) {
		// Guard: check if destroyed before processing
		if (destroyed) return;

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

		if (!destroyed) {
			scrollToBottom();
		}
	}

	async function handleCompletePayload(payload = {}) {
		cleanupStream();

		// Guard: check if destroyed before processing
		if (destroyed) return;

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

		// Guard: check again after async operations
		if (destroyed) return;

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

		// Guard: check if destroyed before updating UI
		if (destroyed) return;

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

		// Guard: prevent multiple concurrent generations
		if (isLoading) {
			console.warn('[Copilot] Generation already in progress, ignoring request');
			return;
		}

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
		
		// Save canvas snapshot for conversation context (unified history handles undo)
		if ($editor) {
			copilotActions.saveCanvasSnapshot($editor.toJSON());
		}

		// Add message to conversation store for multi-turn context
		copilotActions.addMessage('user', textToUse);

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

			// Fetch user's brand assets for context
			let brandAssets = null;
			try {
				const brandData = await getBrandAssets({ limit: 50 });
				if (brandData?.assets?.length) {
					brandAssets = {
						colors: brandData.assets.filter(a => a.type === 'color'),
						fonts: brandData.assets.filter(a => a.type === 'font'),
						logos: brandData.assets.filter(a => a.type === 'logo')
					};
					console.log('[Copilot] Brand assets loaded:', {
						colors: brandAssets.colors.length,
						fonts: brandAssets.fonts.length,
						logos: brandAssets.logos.length
					});
				}
			} catch (e) {
				console.warn('[Copilot] Could not load brand assets:', e);
			}

			activeStream = await streamSimpleGenerate({
				prompt: textToUse,
				canvasState,
				brandAssets,
				width: $editor.width,
				height: $editor.height,
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
		// Use unified history store for undo
		// The $canSafelyUndo check prevents undo during streaming
		if (!$canSafelyUndo || !$editor) {
			if (!$canSafelyUndo) {
				messages = [...messages, { role: 'system', content: "Cannot undo while AI is working." }];
				scrollToBottom();
			}
			return;
		}

		const success = historyActions.requestUndo();
		if (success) {
			messages = [...messages, { role: 'system', content: "Undid last change." }];
			scrollToBottom();
		}
	}

	function handleClearHistory() {
		messages = [];
		lastQualityScore = null;
		lastQualityStrengths = [];
		agentSteps = [];
		currentAgent = null;
		copilotActions.clearExecution();
		copilotActions.clearConversation();
		copilotActions.clearSuggestions();
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

	function resizeTextarea() {
		if (textareaElement) {
			textareaElement.style.height = 'auto';
			textareaElement.style.height = textareaElement.scrollHeight + 'px';
		}
	}

	$: if (prompt || prompt === '') {
		// Tie resize to prompt changes (including reset)
		if (typeof window !== 'undefined') {
			tick().then(resizeTextarea);
		}
	}
</script>

<div class="flex flex-col h-full bg-[#FFFDF8]">
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
	<div class="px-4 py-3 border-b-[3px] border-gray-900 bg-[#FFFDF8] flex justify-between items-center shrink-0">
		<div class="flex items-center gap-2">
			<div class="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center shadow-[2px_2px_0_0_#1f2937]">
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
			{#if $canSafelyUndo}
				<button
					class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
					on:click={handleUndo}
					title="Undo last change (Ctrl+Z)"
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
			<div class="flex flex-col items-center justify-center h-full text-gray-400 space-y-6">
				<div class="w-16 h-16 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] bg-white flex items-center justify-center mb-2">
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-900">
						<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
					</svg>
				</div>
				<p class="text-sm font-black text-gray-900 uppercase tracking-tight">How can I help you design?</p>
				
				<div class="grid grid-cols-1 gap-3 w-full max-w-xs px-2">
					{#each QUICK_ACTIONS as action}
						<button 
							class="text-xs text-left px-4 py-3 bg-white border-[2px] border-gray-900 rounded-lg hover:bg-[#ffc480] transition-all shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none font-bold text-gray-800"
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
				<div class="max-w-[90%] rounded-xl border-[2px] border-gray-900 px-4 py-3 text-sm font-medium leading-relaxed
				{msg.role === 'user' 
					? 'bg-[#ffc480] text-gray-900 shadow-[3px_3px_0_0_#000] rounded-tr-sm' 
					: msg.role === 'system' 
						? 'bg-gray-100 text-gray-500 text-[11px] py-1.5 px-3 rounded-lg border-gray-200' 
						: 'bg-white text-gray-900 shadow-[3px_3px_0_0_#000] rounded-tl-sm'}">
					{msg.content}
				</div>
			</div>
		{/each}

		{#if isLoading}
			<div class="flex justify-start" transition:fade>
				<div class="bg-white border-[2px] border-gray-900 shadow-[3px_3px_0_0_#000] rounded-lg rounded-tl-sm px-4 py-3 flex items-center gap-2">
					<div class="w-1.5 h-1.5 bg-gray-900 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
					<div class="w-1.5 h-1.5 bg-gray-900 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
					<div class="w-1.5 h-1.5 bg-gray-900 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
					{#if currentAgent}
						<span class="ml-2 text-xs font-bold text-gray-900 uppercase tracking-wider">{currentAgent} is working...</span>
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
			<div class="pt-6 border-t-[3px] border-gray-900 space-y-3">
				<p class="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 px-1">
					<i class="fa fa-terminal text-[10px]"></i>
					Live Execution
					{#if $copilotExecution.isLoading}
						<span class="text-[#ff6b6b] animate-pulse">●</span>
					{/if}
				</p>
				<div class="space-y-1.5">
					{#each $copilotExecution.currentSteps as step, index}
						<div class="bg-white border-[2px] border-gray-900 rounded-lg p-3 text-xs shadow-[2px_2px_0_0_#1f2937]">
							<div class="flex items-start gap-2">
								<span class="font-black text-gray-400">#{step.stepNumber || index + 1}</span>
								<div class="flex-1">
									<div class="font-black text-gray-900 uppercase text-[10px] tracking-wider mb-1">{step.tool || 'Unknown'}</div>
									{#if step.reasoning}
										<div class="text-gray-600 leading-tight">{step.reasoning}</div>
									{/if}
								</div>
								{#if step.success}
									<div class="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
										<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-green-600">
											<polyline points="20 6 9 17 4 12"></polyline>
										</svg>
									</div>
								{:else if step.error}
									<div class="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
										<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-red-600">
											<circle cx="12" cy="12" r="10"></circle>
											<line x1="15" y1="9" x2="9" y2="15"></line>
											<line x1="9" y1="9" x2="15" y2="15"></line>
										</svg>
									</div>
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
						<span class="text-[10px] px-2.5 py-1.5 rounded-lg bg-white border-[2px] border-gray-900 font-bold text-gray-900 shadow-[2px_2px_0_0_#1f2937] uppercase tracking-wider">
							{strength}
						</span>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Input Area -->
	<div class="p-4 border-t-[3px] border-gray-900 bg-[#FFFDF8] shrink-0">
		<div class="relative group">
			<textarea
				bind:this={textareaElement}
				bind:value={prompt}
				on:keydown={handleKeydown}
				on:input={resizeTextarea}
				rows="1"
				class="w-full pl-4 pr-12 py-3.5 border-[3px] border-gray-900 rounded-xl focus:ring-0 focus:border-gray-900 focus:shadow-[4px_4px_0_0_#ffc480] text-sm resize-none shadow-[4px_4px_0_0_#1f2937] transition-all min-h-[58px] max-h-[150px] font-medium bg-white overflow-hidden"
				placeholder="Describe your design..."
				disabled={isLoading}
			></textarea>
			<button
				on:click={() => handleGenerate()}
				disabled={isLoading || !prompt.trim()}
				class="absolute right-3 bottom-3 p-2 bg-gray-900 text-white rounded-lg disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-[2px_2px_0_0_#000] hover:shadow-[3px_3px_0_0_#ffc480] hover:-translate-y-0.5 active:scale-95"
			>
				{#if isLoading}
					<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				{:else}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
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
				Claude via OpenRouter
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
