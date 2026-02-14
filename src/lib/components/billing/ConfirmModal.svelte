<script>
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let title = 'Confirm Action';
	export let description = 'Are you sure you want to proceed?';
	export let confirmText = 'Confirm';
	export let cancelText = 'Cancel';
	export let variant = 'default'; // 'default' | 'danger' | 'warning'
	export let loading = false;

	// For pause modal - optional
	export let showResumeDate = false;
	export let resumeDate = '';

	const dispatch = createEventDispatcher();

	$: variantStyles = {
		default: {
			icon: 'text-gray-600',
			iconBg: 'bg-gray-100',
			button: 'bg-[#ffc480] text-gray-900 border-gray-900 hover:bg-[#ffb347]',
		},
		danger: {
			icon: 'text-red-600',
			iconBg: 'bg-red-100',
			button: 'bg-red-600 text-white border-red-700 hover:bg-red-700',
		},
		warning: {
			icon: 'text-yellow-600',
			iconBg: 'bg-yellow-100',
			button: 'bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600',
		},
	}[variant];

	function handleConfirm() {
		dispatch('confirm', { resumeDate: showResumeDate ? resumeDate : null });
	}

	function handleCancel() {
		dispatch('cancel');
	}

	function handleBackdropClick(e) {
		if (e.target === e.currentTarget) {
			handleCancel();
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Escape') {
			handleCancel();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
		on:click={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<!-- Modal -->
		<div class="w-full max-w-md bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f293780] overflow-hidden">
			<div class="p-6">
				<!-- Icon -->
				<div class="w-12 h-12 {variantStyles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4">
					{#if variant === 'danger'}
						<svg class="w-6 h-6 {variantStyles.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
						</svg>
					{:else if variant === 'warning'}
						<svg class="w-6 h-6 {variantStyles.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					{:else}
						<svg class="w-6 h-6 {variantStyles.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					{/if}
				</div>

				<!-- Title & Description -->
				<h3 id="modal-title" class="text-lg font-black text-gray-900 text-center mb-2">{title}</h3>
				<p class="text-sm text-gray-600 text-center mb-6">{description}</p>

				<!-- Resume Date Picker (for pause modal) -->
				{#if showResumeDate}
					<div class="mb-6">
						<label class="block text-sm font-bold text-gray-700 mb-2">
							Resume on (optional)
						</label>
						<input
							type="date"
							bind:value={resumeDate}
							min={new Date().toISOString().split('T')[0]}
							class="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
						/>
						<p class="text-xs text-gray-500 mt-1">
							Leave empty to pause indefinitely until you manually resume.
						</p>
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex gap-3">
					<button
						on:click={handleCancel}
						disabled={loading}
						class="flex-1 px-4 py-2 text-sm font-bold text-gray-700 bg-white rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all disabled:opacity-50"
					>
						{cancelText}
					</button>
					<button
						on:click={handleConfirm}
						disabled={loading}
						class="flex-1 px-4 py-2 text-sm font-bold rounded-lg border-2 transition-all disabled:opacity-50 {variantStyles.button}"
					>
						{#if loading}
							<span class="inline-flex items-center justify-center gap-2">
								<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Processing...
							</span>
						{:else}
							{confirmText}
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
