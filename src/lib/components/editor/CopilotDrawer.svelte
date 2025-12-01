<script>
	import { onDestroy } from 'svelte';
	import { editor } from '../../../store/editor.store';
	import { streamSwarmGenerate } from '../../../api/copilot-swarm';
	import { tick } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { copilotExecution, copilotActions, copilotDrawer } from '../../../store/copilot.store';

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

	// Drawer resizing
	let isDragging = false;
	let dragStartY = 0;
	let dragStartHeight = 0;

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
				onComplete: (payload) => handleCompletePayload(payload),
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

	function handleClose() {
		copilotActions.closeDrawer();
	}

	function handleMinimize() {
		copilotActions.minimizeDrawer();
	}

	// Drag to resize
	function startDrag(e) {
		isDragging = true;
		dragStartY = e.clientY;
		dragStartHeight = $copilotDrawer.height;
		e.preventDefault();
	}

	function onDrag(e) {
		if (!isDragging) return;
		const deltaY = dragStartY - e.clientY;
		const newHeight = dragStartHeight + deltaY;
		copilotActions.setDrawerHeight(newHeight);
	}

	function stopDrag() {
		isDragging = false;
	}
</script>

<svelte:window on:mousemove={onDrag} on:mouseup={stopDrag} />

{#if $copilotDrawer.isOpen}
	<div 
		class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] z-50 flex flex-col transition-all duration-300 rounded-t-2xl border-t border-white/20"
		style="height: {$copilotDrawer.isMinimized ? '48px' : `${$copilotDrawer.height}px`}"
		transition:fly={{ y: 100, duration: 300 }}
	>
		<!-- Resize Handle -->
		{#if !$copilotDrawer.isMinimized}
			<div 
				class="absolute top-0 left-0 right-0 h-5 cursor-ns-resize z-30 flex items-center justify-center group hover:bg-gray-50/50 rounded-t-2xl transition-colors"
				on:mousedown={startDrag}
			>
				<div class="w-10 h-1 bg-gray-200 rounded-full group-hover:bg-gray-300 transition-colors"></div>
			</div>
		{/if}

		<!-- Header -->
	<div class="px-3 py-1.5 flex justify-between items-center shrink-0 relative z-20 border-b border-gray-100/50">
		<div class="flex items-center gap-2">
			<div class="w-6 h-6 rounded-lg bg-gradient-to-br from-[#ff6b6b] to-[#ffc480] flex items-center justify-center shadow-sm text-white">
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
				</svg>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="font-semibold text-gray-900 text-sm">Design Copilot</span>
				{#if lastQualityScore}
					<span class="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium border border-green-100">
						{lastQualityScore}/10
					</span>
				{/if}
			</div>
		</div>
		
		<div class="flex items-center gap-0.5">
			{#if canUndo}
				<button 
					class="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
					on:click={handleUndo}
					title="Undo last AI change"
				>
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M3 7v6h6"></path>
						<path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
					</svg>
				</button>
			{/if}
			<button 
				class="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
				on:click={handleClearHistory}
				title="Clear History"
			>
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="3 6 5 6 21 6"></polyline>
					<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
				</svg>
			</button>
			<button 
				class="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
				on:click={handleMinimize}
				title="Minimize"
			>
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
			</button>
			<button 
				class="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
				on:click={handleClose}
				title="Close"
			>
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>
	</div>

		{#if !$copilotDrawer.isMinimized}
			<!-- Content Container -->
			<div class="flex-1 overflow-hidden">
				<!-- Chat History -->
				<div 
					bind:this={chatContainer}
					class="overflow-y-auto px-3 py-1.5 scroll-smooth custom-scrollbar"
				>
					{#if messages.length === 0}
						<div class="flex flex-col items-center justify-center h-full text-gray-400 max-w-2xl mx-auto">
							<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b6b]/10 to-[#ffc480]/10 flex items-center justify-center mb-3">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#ff6b6b]">
									<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
								</svg>
							</div>
							<p class="text-base font-medium text-gray-900 mb-0.5">How can I help?</p>
							<p class="text-xs text-gray-500 mb-4">Describe your design changes</p>
							
							<div class="grid grid-cols-2 gap-2 w-full max-w-lg">
								{#each QUICK_ACTIONS as action}
									<button 
										class="text-xs text-left px-3 py-2 bg-gray-50 hover:bg-white border border-transparent hover:border-[#ff6b6b]/20 rounded-lg hover:shadow-sm transition-all text-gray-600 hover:text-[#ff6b6b]"
										on:click={() => handleGenerate(action)}
									>
										{action}
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<div class="max-w-4xl mx-auto space-y-2 pb-1.5">
						{#each messages as msg}
							<div 
								class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}"
								transition:fly={{ y: 10, duration: 200 }}
							>
								<div class="max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed shadow-sm {msg.role === 'user' ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ff5252] text-white rounded-tr-sm' : msg.role === 'system' ? 'bg-gray-50 text-gray-500 text-xs py-1.5 px-2.5 rounded-lg border border-gray-100' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm shadow-sm'}">
									{msg.content}
								</div>
							</div>
						{/each}

						{#if isLoading}
							<div class="flex justify-start" transition:fade>
								<div class="bg-white border border-gray-100 rounded-xl rounded-tl-sm px-3 py-2 flex items-center gap-2 shadow-sm">
									<div class="flex gap-1">
										<div class="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-bounce" style="animation-delay: 0ms"></div>
										<div class="w-1.5 h-1.5 bg-[#ffc480] rounded-full animate-bounce" style="animation-delay: 150ms"></div>
										<div class="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-bounce" style="animation-delay: 300ms"></div>
									</div>
									{#if currentAgent}
										<span class="ml-2 text-xs text-gray-500 font-medium">{currentAgent}...</span>
									{/if}
								</div>
							</div>
						{/if}
						
						{#if error}
							<div class="text-center text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100" transition:slide>
								{error}
							</div>
						{/if}

						{#if streamError}
							<div class="text-center text-xs text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-100" transition:slide>
								{streamError}
							</div>
						{/if}

						{#if $copilotExecution.currentSteps.length > 0}
							<div class="pt-1.5 space-y-1.5">
								<div class="flex items-center gap-2">
									<div class="h-px flex-1 bg-gray-100"></div>
									<p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
										Execution Steps
										{#if $copilotExecution.isLoading}
											<span class="w-1.5 h-1.5 rounded-full bg-[#ff6b6b] animate-pulse"></span>
										{/if}
									</p>
									<div class="h-px flex-1 bg-gray-100"></div>
								</div>
								
								<div class="grid grid-cols-2 gap-1.5">
									{#each $copilotExecution.currentSteps as step, index}
										<div class="bg-white border border-gray-100 rounded-lg p-1.5 text-[11px] shadow-sm hover:shadow-md transition-shadow">
											<div class="flex items-start gap-2">
												<span class="font-mono text-gray-300 select-none">#{step.stepNumber || index + 1}</span>
												<div class="flex-1 min-w-0">
													<div class="font-medium text-gray-700 truncate">{step.tool || 'Unknown'}</div>
													{#if step.reasoning}
														<div class="text-gray-500 mt-0.5 line-clamp-1">{step.reasoning}</div>
													{/if}
												</div>
												{#if step.success}
													<div class="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center shrink-0 text-green-600">
														<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
															<polyline points="20 6 9 17 4 12"></polyline>
														</svg>
													</div>
												{:else if step.error}
													<div class="w-4 h-4 rounded-full bg-red-50 flex items-center justify-center shrink-0 text-red-600">
														<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
															<line x1="18" y1="6" x2="6" y2="18"></line>
															<line x1="6" y1="6" x2="18" y2="18"></line>
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
							<div class="pt-1.5 space-y-1.5">
								<div class="flex items-center gap-2">
									<div class="h-px flex-1 bg-gray-100"></div>
									<p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Design Strengths</p>
									<div class="h-px flex-1 bg-gray-100"></div>
								</div>
								<div class="flex flex-wrap justify-center gap-1.5">
									{#each lastQualityStrengths as strength}
										<span class="text-[10px] px-2.5 py-1 rounded-full bg-[#ff6b6b]/10 text-[#ff6b6b] font-medium border border-[#ff6b6b]/20">
											{strength}
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Input Area -->
			<div class="px-3 py-2.5 bg-white shrink-0 relative z-20">
				<div class="max-w-4xl mx-auto">
					<div class="relative group">
						<div class="absolute inset-0 bg-gradient-to-r from-[#ff6b6b]/5 to-[#ffc480]/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
						<textarea
							bind:value={prompt}
							on:keydown={handleKeydown}
							rows="1"
							class="relative block w-full pl-3 pr-12 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#ff6b6b]/10 focus:border-[#ff6b6b] text-sm resize-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all min-h-[44px] max-h-[160px] placeholder-gray-400"
							placeholder="Describe your design changes..."
							disabled={isLoading}
						></textarea>
						<button
							on:click={() => handleGenerate()}
							disabled={isLoading || !prompt.trim()}
							class="absolute right-2 bottom-2 p-2 text-white bg-gradient-to-r from-[#ff6b6b] to-[#ff5252] hover:from-[#ff5252] hover:to-[#ff4040] rounded-lg disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-[#ff6b6b]/20 active:scale-95 z-10"
						>
							{#if isLoading}
								<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{:else}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
									<line x1="22" y1="2" x2="11" y2="13"></line>
									<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
								</svg>
							{/if}
						</button>
					</div>
					<div class="mt-1.5 flex justify-between items-center px-1">
						<span class="text-[10px] text-gray-400 flex items-center gap-1.5 font-medium">
							<div class="w-1 h-1 rounded-full bg-[#ff6b6b]"></div>
							Swarm AI Active
						</span>
						<button 
							class="text-[10px] text-gray-400 hover:text-gray-600 transition-colors font-medium hover:underline"
							on:click={handleSaveTemplate}
						>
							Save as JSON
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #cbd5e0;
		border-radius: 10px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #a0aec0;
	}
</style>
