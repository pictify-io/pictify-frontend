<script>
	import { onDestroy } from 'svelte';
	import { editor } from '../../../store/editor.store';
	import { streamAgenticGenerate, approveStep as approveStepApi, rejectStep as rejectStepApi } from '../../../api/copilot-agentic';
	import { tick } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import StepCard from './StepCard.svelte';
	import { copilotExecution, copilotActions } from '../../../store/copilot.store';

	let messages = [];
	let prompt = '';
	let isLoading = false;
	let error = '';
	let streamError = '';
	let chatContainer;
	let activeStream = null;
	let lastAppliedStepNumber = null;
	
	// History for Undo
	let previousState = null;
	let canUndo = false;

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
				$editor.renderAll();
				
				// Force a second render after a delay to ensure all objects are drawn
				setTimeout(() => {
					$editor.requestRenderAll();
					console.log('[Copilot] Canvas rendered with', $editor.getObjects().length, 'objects');
					resolve();
				}, 50);
			});
		});

		// End batch after render completes
		if (typeof window !== 'undefined' && window.__historyBatchEnd) {
			window.__historyBatchEnd();
		}
	}

	/**
	 * Handle incoming step payload from SSE
	 * Apply canvas updates immediately for real-time feedback
	 */
	async function handleStepPayload(payload = {}) {
		if (!payload.steps || !Array.isArray(payload.steps)) {
			return;
		}

		console.log('[Copilot] Received step payload:', {
			stepCount: payload.steps.length,
			steps: payload.steps.map(s => ({ num: s.stepNumber, tool: s.tool, hasCanvas: !!s.canvasState }))
		});

		// Process each new step
		for (const step of payload.steps) {
			// Update the store with the new step
			copilotActions.upsertSteps([step]);
			
			// Apply canvas state immediately if present and NEW
			// Use strict ordering to prevent re-applying old steps
			const currentLastStep = lastAppliedStepNumber || 0;
			if (step?.canvasState && step.stepNumber > currentLastStep) {
				console.log('[Copilot] Applying step', step.stepNumber, '- Tool:', step.tool);
				lastAppliedStepNumber = step.stepNumber;
				await applyCanvasState(step.canvasState);
			} else if (step?.canvasState && step.stepNumber <= currentLastStep) {
				console.log('[Copilot] Skipping already applied step', step.stepNumber);
			}
		}
		
		scrollToBottom();
	}

	async function handleCompletePayload(payload = {}) {
		cleanupStream();
		
		// Apply any final steps
		if (payload.steps?.length) {
			for (const step of payload.steps) {
				copilotActions.upsertSteps([step]);
				
				// Apply canvas state immediately if present and NEW
				const currentLastStep = lastAppliedStepNumber || 0;
				if (step?.canvasState && step.stepNumber > currentLastStep) {
					console.log('[Copilot] Applying final step', step.stepNumber);
					lastAppliedStepNumber = step.stepNumber;
					await applyCanvasState(step.canvasState);
				}
			}
		}
		
		copilotActions.setThreadContext({
			threadId: payload.threadId,
			checkpointId: payload.checkpointId,
			needsUserInput: payload.needsUserInput
		});
		copilotActions.setLoading(false);
		isLoading = false;
		if (payload.isComplete) {
			messages = [...messages, { role: 'assistant', content: 'Design update complete.' }];
		} else if (payload.needsUserInput) {
			messages = [...messages, { role: 'assistant', content: 'Copilot needs your input to continue.' }];
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
		
		await scrollToBottom();

		const canvasState = $editor ? $editor.toJSON() : null;

		try {
			copilotActions.startExecution([]);
			copilotActions.setLoading(true);
			lastAppliedStepNumber = null; // Reset for new execution

			cleanupStream();

			activeStream = await streamAgenticGenerate({
				prompt: textToUse,
				canvasState,
				conversationHistory: messages,
				options: { selfCorrect: true, autoApprove: false },
				onStep: (payload) => handleStepPayload(payload),
				onComplete: (payload) => handleCompletePayload(payload),
				onError: (err) => handleStreamFailure(err)
			});
		} catch (err) {
			console.error(err);
			error = 'Something went wrong. Please try again.';
			copilotActions.setError(error);
			isLoading = false;
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

	async function handleApproveStep(stepIndex) {
		const checkpointId = $copilotExecution.checkpointId;
		if (!checkpointId) {
			error = 'No checkpoint available to approve.';
			return;
		}
		try {
			copilotActions.setLoading(true);
			const response = await approveStepApi({
				stepId: checkpointId,
				threadId: $copilotExecution.threadId
			});
			handleStepPayload(response || {});
			copilotActions.approveStep(stepIndex);
			copilotActions.setThreadContext({
				threadId: response?.threadId,
				checkpointId: response?.checkpointId,
				needsUserInput: response?.needsUserInput
			});
		} catch (err) {
			console.error(err);
			error = 'Failed to approve step.';
			copilotActions.setError(error);
		} finally {
			copilotActions.setLoading(false);
		}
	}

	function handleRejectStep(stepIndex) {
		copilotActions.rejectStep(stepIndex);
	}

	async function handleRegenerateStep(stepIndex, feedback) {
		if (!feedback?.trim()) {
			error = 'Please provide feedback before regenerating.';
			return;
		}
		const checkpointId = $copilotExecution.checkpointId;
		try {
			copilotActions.setLoading(true);
			const response = await rejectStepApi({
				stepId: checkpointId,
				threadId: $copilotExecution.threadId,
				feedback,
				canvasState: $editor ? $editor.toJSON() : null,
				conversationHistory: messages,
				prompt: feedback
			});
			handleCompletePayload(response || {});
		} catch (err) {
			console.error(err);
			error = 'Failed to regenerate this step.';
			copilotActions.setError(error);
		} finally {
			copilotActions.setLoading(false);
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleGenerate();
		}
	}
</script>

<div class="flex flex-col h-full bg-gray-50/50">
	<!-- Header -->
	<div class="px-4 py-3 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
		<div class="flex items-center gap-2">
			<div class="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
				</svg>
			</div>
			<span class="font-semibold text-gray-800 text-sm">Design Copilot</span>
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
				<div class="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-2">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300">
						<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
					</svg>
				</div>
				<p class="text-sm font-medium">How can I help you design?</p>
				
				<div class="grid grid-cols-1 gap-2 w-full max-w-xs">
					{#each QUICK_ACTIONS as action}
						<button 
							class="text-xs text-left px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm"
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
				<div class="max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm {msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : msg.role === 'system' ? 'bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-lg' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'}">
					{msg.content}
				</div>
			</div>
		{/each}

		{#if isLoading}
			<div class="flex justify-start" transition:fade>
				<div class="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
					<div class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
					<div class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
					<div class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
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
			<div class="pt-4 border-t border-gray-200 space-y-3">
				<div class="flex items-center justify-between">
					<p class="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
						Execution Steps
						{#if $copilotExecution.isLoading}
							<span class="text-blue-500 animate-pulse">running…</span>
						{/if}
					</p>
					{#if $copilotExecution.threadId}
						<span class="text-[10px] text-gray-400 truncate max-w-[180px]" title={$copilotExecution.threadId}>
							Thread {$copilotExecution.threadId}
						</span>
					{/if}
				</div>
				{#each $copilotExecution.currentSteps as step, index}
					<StepCard
						{step}
						stepIndex={index}
						isActive={$copilotExecution.currentStepIndex === index}
						onApprove={handleApproveStep}
						onReject={handleRejectStep}
						onRegenerate={handleRegenerateStep}
					/>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Input Area -->
	<div class="p-4 border-t border-gray-200 bg-white shrink-0">
		<div class="relative group">
			<textarea
				bind:value={prompt}
				on:keydown={handleKeydown}
				rows="1"
				class="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none shadow-sm transition-all min-h-[50px] max-h-[150px]"
				placeholder="Describe your design..."
				disabled={isLoading}
			></textarea>
			<button
				on:click={() => handleGenerate()}
				disabled={isLoading || !prompt.trim()}
				class="absolute right-2 bottom-2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
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
					<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
				</svg>
				Context aware
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
