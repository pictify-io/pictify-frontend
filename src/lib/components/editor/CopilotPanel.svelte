<script>
	import { onDestroy, onMount } from 'svelte';
	import { editor } from '../../../store/editor.store';
	import { streamSimpleGenerate } from '../../../api/copilot-simple';
	import { getBrandAssets } from '../../../api/brand-assets';
	import { tick } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { copilotExecution, copilotActions } from '../../../store/copilot.store';
	import { canSafelyUndo, historyActions } from '../../../store/history.store';
	import {
		canUseFeature,
		trackFeatureUsage,
		plgStatus,
		showMilestoneCelebration,
		checkFeatureAccessSync,
		FEATURES,
		getFeatureUpgradePrompt
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
	let streamingTimeoutId = null; // Safety net for stuck streaming state
	const STREAMING_TIMEOUT = 60000; // 60 seconds max

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

	// Plan-based feature access check (must depend on $plgStatus so it re-evaluates after PLG loads)
	$: copilotAccess = ($plgStatus.plan, checkFeatureAccessSync(FEATURES.AI_COPILOT));
	$: hasCopilotAccess = copilotAccess?.hasAccess ?? false;
	$: copilotUpgradePrompt = ($plgStatus.plan, getFeatureUpgradePrompt(FEATURES.AI_COPILOT));
	// Re-check usage limits whenever plan-level access changes (all plans have quotas)
	$: if (hasCopilotAccess && $plgStatus.loaded) {
		checkCopilotUsageLimit();
	}

	async function checkCopilotUsageLimit() {
		aiCopilotLimit = await canUseFeature('aiCopilot');
		featureLimitReached = !aiCopilotLimit?.allowed;
	}

	const QUICK_ACTIONS = [
		'Make it modern',
		'Add a dark mode version',
		'Increase contrast',
		'Add a call to action button'
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

		// Clear streaming safety timeout
		if (streamingTimeoutId) {
			clearTimeout(streamingTimeoutId);
			streamingTimeoutId = null;
		}

		// Reset streaming and loading state to prevent stuck UI
		historyActions.setStreaming(false);
		isLoading = false;
		copilotActions.setLoading(false);
	}

	// Start streaming safety timeout - auto-resets if stuck for too long
	function startStreamingSafetyTimeout() {
		if (streamingTimeoutId) {
			clearTimeout(streamingTimeoutId);
		}
		streamingTimeoutId = setTimeout(() => {
			if (isLoading) {
				console.warn('[Copilot] Streaming timeout reached (60s), force-resetting state');
				cleanupStream();
				if (!destroyed) {
					streamError = 'Generation timed out. Please try again.';
					messages = [
						...messages,
						{ role: 'system', content: 'Generation timed out after 60 seconds.' }
					];
				}
			}
		}, STREAMING_TIMEOUT);
	}

	onDestroy(() => {
		destroyed = true;
		// Force-reset all streaming state on component destroy
		cleanupStream();
		// Double-ensure streaming flag is cleared even if cleanupStream has edge cases
		historyActions.setStreaming(false);
	});

	async function applyCanvasState(canvasJson) {
		// Guard: check if destroyed before proceeding
		if (destroyed) return;

		if (!$editor || !canvasJson) {
			console.warn('[Copilot] Cannot apply canvas state:', {
				hasEditor: !!$editor,
				hasState: !!canvasJson
			});
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
				const agentLabel = {
					'Creative Director': 'Designing',
					'Content Writer': 'Writing',
					'Design Composer': 'Composing',
					'Vision Critic': 'Reviewing',
					Canvas: 'Rendering'
				};
				const label = agentLabel[step.agent] || step.agent;
				messages = [
					...messages,
					{
						role: 'system',
						content: `${label}: ${step.description}`
					}
				];
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
		// Abort stream and clear timeouts, but don't reset isLoading yet
		// (we need to show loading while applying canvas state)
		if (activeStream && typeof activeStream.abort === 'function') {
			activeStream.abort();
		}
		activeStream = null;
		if (renderTimeoutId) {
			clearTimeout(renderTimeoutId);
			renderTimeoutId = null;
		}
		if (streamingTimeoutId) {
			clearTimeout(streamingTimeoutId);
			streamingTimeoutId = null;
		}

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
			let responseMessage = 'Design generated successfully!';
			if (payload.design?.reasoning) {
				responseMessage = payload.design.reasoning;
			}
			if (lastQualityScore) {
				responseMessage += ` (Quality: ${lastQualityScore}/10)`;
			}
			if (payload.totalTimeMs) {
				const seconds = (payload.totalTimeMs / 1000).toFixed(1);
				responseMessage += ` | ${seconds}s`;
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

		// Show loading immediately so user sees feedback
		const userMessage = { role: 'user', content: textToUse };
		messages = [...messages, userMessage];
		prompt = '';
		isLoading = true;
		error = '';
		streamError = '';

		await scrollToBottom();

		// Check feature limit (all plans have quotas)
		const limitCheck = await canUseFeature('aiCopilot');
		if (!limitCheck.allowed) {
			isLoading = false;
			featureLimitReached = true;
			error = "You've reached your AI Copilot limit for this month. Upgrade to continue!";
			messages = [
				...messages,
				{
					role: 'system',
					content: 'AI Copilot limit reached. Upgrade for more generations!'
				}
			];
			return;
		}

		// Show warning if close to limit
		if (limitCheck.remaining <= 1) {
			messages = [
				...messages,
				{
					role: 'system',
					content: `Last AI generation for this month! ${
						!isPaidPlan ? 'Upgrade for more access.' : ''
					}`
				}
			];
		}

		// Save canvas snapshot for conversation context (unified history handles undo)
		if ($editor) {
			copilotActions.saveCanvasSnapshot($editor.toJSON());
		}

		// Add message to conversation store for multi-turn context
		copilotActions.addMessage('user', textToUse);
		lastQualityScore = null;
		lastQualityStrengths = [];

		await scrollToBottom();

		const canvasState = $editor ? $editor.toJSON() : null;

		try {
			copilotActions.startExecution([]);
			copilotActions.setLoading(true);
			agentSteps = [];
			currentAgent = null;

			// Abort any previous stream (but don't reset isLoading — we're starting a new one)
			if (activeStream && typeof activeStream.abort === 'function') {
				activeStream.abort();
			}
			activeStream = null;
			if (renderTimeoutId) {
				clearTimeout(renderTimeoutId);
				renderTimeoutId = null;
			}
			if (streamingTimeoutId) {
				clearTimeout(streamingTimeoutId);
				streamingTimeoutId = null;
			}
			startStreamingSafetyTimeout();

			// Fetch user's brand assets for context
			let brandAssets = null;
			try {
				const brandData = await getBrandAssets({ limit: 50 });
				if (brandData?.assets?.length) {
					brandAssets = {
						colors: brandData.assets.filter((a) => a.type === 'color'),
						fonts: brandData.assets.filter((a) => a.type === 'font'),
						logos: brandData.assets.filter((a) => a.type === 'logo')
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

					// Update quota display after successful generation
					if (payload.success) {
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
				messages = [...messages, { role: 'system', content: 'Cannot undo while AI is working.' }];
				scrollToBottom();
			}
			return;
		}

		const success = historyActions.requestUndo();
		if (success) {
			messages = [...messages, { role: 'system', content: 'Undid last change.' }];
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
	<!-- Header -->
	<div
		class="px-3 py-2.5 border-b-[3px] border-gray-900 bg-[#FFFDF8] flex justify-between items-center shrink-0 z-10 relative"
	>
		<div class="flex items-center gap-1.5 min-w-0">
			<div class="w-5 h-5 rounded-md bg-gray-900 flex items-center justify-center shrink-0">
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="white"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path
						d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
					/>
				</svg>
			</div>
			<span class="font-bold text-gray-800 text-xs truncate">Copilot</span>

			{#if aiCopilotLimit?.remaining >= 0 && hasCopilotAccess && !featureLimitReached}
				<span
					class="text-[9px] px-1.5 py-0.5 rounded-full border-[2px] border-gray-900 bg-[#ffc480] text-gray-900 font-bold shrink-0"
				>
					{aiCopilotLimit.remaining}/{aiCopilotLimit.limit}
				</span>
			{:else if !hasCopilotAccess || featureLimitReached}
				<span
					class="text-[9px] px-1.5 py-0.5 rounded-full border-[2px] border-gray-900 bg-gray-200 text-gray-900 font-bold shrink-0"
				>
					Locked
				</span>
			{/if}

			{#if lastQualityScore}
				<span
					class="text-[9px] px-1.5 py-0.5 rounded-full border-[2px] border-gray-900 bg-[#a7f3d0] text-gray-900 font-bold shrink-0"
				>
					{lastQualityScore}/10
				</span>
			{/if}
		</div>

		{#if hasCopilotAccess && !featureLimitReached}
			<div class="flex items-center shrink-0">
				{#if $canSafelyUndo}
					<button
						class="p-1 text-gray-900 hover:bg-[#ffc480] rounded transition-all"
						on:click={handleUndo}
						title="Undo (Ctrl+Z)"
					>
						<svg
							width="13"
							height="13"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M3 7v6h6" />
							<path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
						</svg>
					</button>
				{/if}
				<button
					class="p-1 text-gray-900 hover:bg-[#ffc480] rounded transition-all"
					on:click={handleClearHistory}
					title="Clear"
				>
					<svg
						width="13"
						height="13"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polyline points="3 6 5 6 21 6" />
						<path
							d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
						/>
					</svg>
				</button>
			</div>
		{/if}
	</div>

	<!-- Content Area -->
	{#if !hasCopilotAccess || featureLimitReached}
		<div class="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-[#FFFDF8]">
			<div
				class="w-full bg-white border-[3px] border-gray-900 rounded-xl p-4 shadow-[4px_4px_0_0_#1f2937] flex flex-col items-center text-center"
			>
				<div
					class="w-10 h-10 rounded-lg bg-[#ffc480] border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] flex items-center justify-center mb-3"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-gray-900"
					>
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
						<path d="M7 11V7a5 5 0 0 1 10 0v4" />
					</svg>
				</div>
				<h3 class="text-sm font-black text-gray-900 mb-1.5 leading-tight">
					{!hasCopilotAccess ? 'Unlock AI Copilot' : 'Limit Reached'}
				</h3>
				<p class="text-[11px] font-medium text-gray-600 mb-4 leading-relaxed">
					{!hasCopilotAccess
						? `Upgrade to ${
								copilotUpgradePrompt?.targetPlan?.name || 'Pro'
						  } to use AI design assistant.`
						: 'Generation limit reached. Upgrade for more.'}
				</p>
				<button
					on:click={() => openUpgradeModal('ai_copilot')}
					class="w-full py-2 px-3 bg-[#b4f0a7] border-[2px] border-gray-900 text-gray-900 text-xs font-black rounded-lg shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all uppercase tracking-wide"
				>
					Upgrade Now
				</button>
			</div>
		</div>
	{:else}
		<!-- Low usage warning -->
		{#if aiCopilotLimit?.remaining > 0 && aiCopilotLimit?.remaining <= 3}
			<div
				class="px-3 py-1.5 border-b-[3px] border-gray-900 bg-[#ffc480] text-gray-900 text-[10px] font-bold flex items-center justify-between shrink-0"
			>
				<span class="flex items-center gap-1">
					<svg
						width="10"
						height="10"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
					</svg>
					{aiCopilotLimit.remaining} left
				</span>
				<button
					on:click={() => openUpgradeModal('ai_copilot')}
					class="px-1.5 py-0.5 bg-white border-[2px] border-gray-900 rounded shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all uppercase tracking-tight text-[9px]"
				>
					Upgrade
				</button>
			</div>
		{/if}

		<!-- Chat History -->
		<div
			bind:this={chatContainer}
			class="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0 scroll-smooth"
		>
			{#if messages.length === 0}
				<div class="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
					<div
						class="w-12 h-12 rounded-lg border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] bg-white flex items-center justify-center"
					>
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="text-gray-900"
						>
							<path
								d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
							/>
						</svg>
					</div>
					<p class="text-xs font-black text-gray-900 uppercase tracking-tight">How can I help?</p>

					<div class="flex flex-col gap-2 w-full px-1">
						{#each QUICK_ACTIONS as action}
							<button
								class="text-[11px] text-left px-3 py-2 bg-white border-[2px] border-gray-900 rounded-lg hover:bg-[#ffc480] transition-all shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none font-bold text-gray-800"
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
					transition:fly={{ y: 8, duration: 150 }}
				>
					{#if msg.role === 'system'}
						<div
							class="w-full text-[10px] text-gray-500 bg-gray-50 rounded px-2 py-1 border border-gray-200 leading-snug"
						>
							{msg.content}
						</div>
					{:else}
						<div
							class="max-w-[85%] rounded-lg border-[2px] border-gray-900 px-3 py-2 text-xs font-medium leading-relaxed
							{msg.role === 'user'
								? 'bg-[#ffc480] text-gray-900 shadow-[2px_2px_0_0_#000] rounded-tr-sm'
								: 'bg-white text-gray-900 shadow-[2px_2px_0_0_#000] rounded-tl-sm'}"
						>
							{msg.content}
						</div>
					{/if}
				</div>
			{/each}

			<!-- Loading state - AI thinking bubble -->
			{#if isLoading}
				<div class="flex justify-start" transition:fly={{ y: 8, duration: 150 }}>
					<div
						class="max-w-[85%] bg-white border-[2px] border-gray-900 shadow-[2px_2px_0_0_#000] rounded-lg rounded-tl-sm px-3 py-2.5"
					>
						<div class="flex items-center gap-2">
							<div class="flex items-center gap-1">
								<div
									class="w-1.5 h-1.5 bg-gray-900 rounded-full animate-bounce"
									style="animation-delay: 0ms"
								/>
								<div
									class="w-1.5 h-1.5 bg-gray-900 rounded-full animate-bounce"
									style="animation-delay: 150ms"
								/>
								<div
									class="w-1.5 h-1.5 bg-gray-900 rounded-full animate-bounce"
									style="animation-delay: 300ms"
								/>
							</div>
							<span class="text-xs font-bold text-gray-500">
								{currentAgent ? currentAgent : 'AI is thinking...'}
							</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Errors -->
			{#if error}
				<div
					class="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-200 leading-snug"
					transition:slide
				>
					{error}
				</div>
			{/if}

			{#if streamError}
				<div
					class="text-[11px] text-orange-600 bg-orange-50 p-2 rounded border border-orange-200 leading-snug"
					transition:slide
				>
					{streamError}
				</div>
			{/if}

			<!-- Execution steps -->
			{#if $copilotExecution.currentSteps.length > 0}
				<div class="pt-3 border-t-[2px] border-gray-200 space-y-1.5">
					<p
						class="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5 px-0.5"
					>
						Execution
						{#if $copilotExecution.isLoading}
							<span class="text-[#ff6b6b] animate-pulse text-[8px]">LIVE</span>
						{/if}
					</p>
					<div class="space-y-1">
						{#each $copilotExecution.currentSteps as step, index}
							<div
								class="bg-white border-[2px] border-gray-900 rounded-lg p-2 text-[11px] shadow-[1px_1px_0_0_#1f2937]"
							>
								<div class="flex items-start gap-1.5">
									<span class="font-black text-gray-400 text-[10px] shrink-0"
										>#{step.stepNumber || index + 1}</span
									>
									<div class="flex-1 min-w-0">
										<div class="font-black text-gray-900 uppercase text-[9px] tracking-wider">
											{step.tool || 'Unknown'}
										</div>
										{#if step.reasoning}
											<div class="text-gray-600 leading-tight text-[10px] truncate">
												{step.reasoning}
											</div>
										{/if}
									</div>
									{#if step.success}
										<svg
											width="12"
											height="12"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="3"
											class="text-green-500 shrink-0"
										>
											<polyline points="20 6 9 17 4 12" />
										</svg>
									{:else if step.error}
										<svg
											width="12"
											height="12"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="3"
											class="text-red-500 shrink-0"
										>
											<line x1="18" y1="6" x2="6" y2="18" />
											<line x1="6" y1="6" x2="18" y2="18" />
										</svg>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Quality strengths -->
			{#if lastQualityStrengths.length > 0}
				<div class="pt-2 space-y-1.5">
					<p class="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Strengths</p>
					<div class="flex flex-wrap gap-1">
						{#each lastQualityStrengths as strength}
							<span
								class="text-[9px] px-2 py-1 rounded bg-white border-[2px] border-gray-900 font-bold text-gray-900 shadow-[1px_1px_0_0_#1f2937] uppercase tracking-wider"
							>
								{strength}
							</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Input Area -->
		<div class="p-2.5 border-t-[3px] border-gray-900 bg-[#FFFDF8] shrink-0">
			{#if isLoading}
				<div class="flex items-center gap-2">
					<div
						class="flex-1 px-3 py-2.5 border-[2px] border-gray-300 rounded-lg text-xs min-h-[52px] bg-gray-50 text-gray-400 font-medium flex items-center"
					>
						<span class="animate-pulse">Generating design...</span>
					</div>
					<button
						on:click={cleanupStream}
						class="px-3 py-2.5 bg-white text-gray-900 border-[2px] border-gray-900 rounded-lg text-xs font-bold shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all shrink-0"
					>
						Stop
					</button>
				</div>
			{:else}
				<div class="flex items-end gap-2">
					<textarea
						bind:this={textareaElement}
						bind:value={prompt}
						on:keydown={handleKeydown}
						on:input={resizeTextarea}
						rows="2"
						class="flex-1 px-3 py-2.5 border-[2px] border-gray-900 rounded-lg focus:ring-0 focus:border-gray-900 focus:shadow-[3px_3px_0_0_#ffc480] text-xs resize-none shadow-[3px_3px_0_0_#1f2937] transition-all min-h-[52px] max-h-[120px] font-medium bg-white overflow-hidden"
						placeholder="Describe your design..."
					/>
					<button
						on:click={() => handleGenerate()}
						disabled={!prompt.trim()}
						class="p-2.5 bg-gray-900 text-white rounded-lg disabled:bg-gray-300 disabled:text-gray-400 transition-all shadow-[2px_2px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#ffc480] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0_0_#1f2937] shrink-0 mb-[3px]"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="22" y1="2" x2="11" y2="13" />
							<polygon points="22 2 15 22 11 13 2 9 22 2" />
						</svg>
					</button>
				</div>
			{/if}
			<div class="mt-1.5 flex justify-between items-center px-0.5">
				<span class="text-[9px] text-gray-400 flex items-center gap-1">
					<kbd class="text-[8px] font-mono bg-gray-100 px-1 rounded border border-gray-200"
						>Enter</kbd
					> to send
				</span>
				<button
					class="text-[9px] text-gray-400 hover:text-gray-600 transition-colors"
					on:click={handleSaveTemplate}
				>
					Export JSON
				</button>
			</div>
		</div>
	{/if}
</div>
