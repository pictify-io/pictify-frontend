<script>
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import {
		plgStatus,
		usageWidget,
		shouldShowProactiveModal,
		markProactiveModalShown,
		initNudgeState,
		getDiscountForUsage
	} from '../../../store/plg.store';
	import { openUpgradeModal } from '../../../store/upgrade-modal.store';
	import { recordUpgradePrompt } from '../../../api/plg.js';
	import { analytics } from '$lib/analytics.js';

	let showModal = false;
	let mounted = false;

	// Get discount info based on current usage (minimum 5% at 75%)
	$: discountInfo = getDiscountForUsage($usageWidget.percentage) || {
		discountPercent: 5,
		discountCode: 'EARLY5',
		urgency: 'warning'
	};

	onMount(() => {
		mounted = true;
		initNudgeState();
	});

	// Check when usage changes and hits 75%
	$: if (mounted && $plgStatus.loaded && $usageWidget.percentage >= 75) {
		checkModalVisibility();
	}

	function checkModalVisibility() {
		if (shouldShowProactiveModal()) {
			showModal = true;
			markProactiveModalShown();
			analytics.track('proactive_modal_shown', {
				percentage: $usageWidget.percentage,
				plan: $usageWidget.plan,
				renders_completed: $usageWidget.current,
				time_saved: $plgStatus.timeSaved?.display,
				discount_code: discountInfo.discountCode
			});
			recordUpgradePrompt('shown', 'proactive_modal', {
				percentage: $usageWidget.percentage,
				renders_completed: $usageWidget.current,
				discount_code: discountInfo.discountCode
			});
		}
	}

	function handleDismiss() {
		analytics.track('proactive_modal_dismissed', {
			percentage: $usageWidget.percentage,
			plan: $usageWidget.plan
		});
		recordUpgradePrompt('dismissed', 'proactive_modal', {
			percentage: $usageWidget.percentage
		});
		showModal = false;
	}

	function handleUpgradeClick() {
		analytics.track('proactive_modal_upgrade_clicked', {
			percentage: $usageWidget.percentage,
			plan: $usageWidget.plan,
			discount: discountInfo.discountPercent,
			discount_code: discountInfo.discountCode
		});
		recordUpgradePrompt('clicked', 'proactive_modal', {
			percentage: $usageWidget.percentage,
			discount_code: discountInfo.discountCode
		});
		showModal = false;
		openUpgradeModal('proactive_modal', discountInfo.discountCode);
	}

	$: timeSaved = $plgStatus.timeSaved;
	$: rendersCompleted = $usageWidget.current;
</script>

{#if showModal}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
		transition:fade={{ duration: 150 }}
		on:click={handleDismiss}
		on:keydown={(e) => e.key === 'Escape' && handleDismiss()}
		role="presentation"
	>
		<!-- Modal -->
		<div
			class="relative bg-[#FFFDF8] rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] max-w-md w-full overflow-hidden"
			transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			aria-modal="true"
			aria-labelledby="proactive-modal-title"
		>
			<!-- Header with solid color -->
			<div class="bg-[#ffc480] p-6 relative border-b-[3px] border-gray-900">
				<!-- Decorative pattern -->
				<div
					class="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]"
				/>

				<!-- Discount badge -->
				<div
					class="absolute top-5 right-5 px-3 py-1 bg-white rounded-lg border-2 border-gray-900 shadow-[3px_3px_0_0_#1f2937] transform rotate-3 z-10"
				>
					<span class="text-xs font-black text-gray-900 tracking-wide"
						>{discountInfo.discountPercent}% OFF</span
					>
				</div>

				<div class="relative z-10 pr-16">
					<div
						class="mb-3 transform -rotate-6 w-fit bg-white p-2 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937]"
					>
						<svg class="w-8 h-8 text-[#ffc480]" fill="currentColor" viewBox="0 0 24 24">
							<path
								d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
								stroke="black"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
					<h2
						id="proactive-modal-title"
						class="text-3xl font-black text-gray-900 tracking-tighter uppercase"
					>
						Level Up
					</h2>
					<p class="text-gray-900 text-sm mt-2 font-bold leading-relaxed max-w-[90%]">
						You're getting real value from Pictify. Don't let a limit slow you down.
					</p>
				</div>
			</div>

			<!-- Content -->
			<div class="p-6">
				<!-- Value delivered stats -->
				<div class="grid grid-cols-2 gap-4 mb-6">
					<div
						class="p-4 bg-white rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_0_#10b981] text-center transform -rotate-1 hover:rotate-0 transition-transform"
					>
						<div
							class="w-10 h-10 bg-[#10b981] rounded-lg border-2 border-gray-900 flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0_0_#1f2937]"
						>
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<p class="text-2xl font-black text-gray-900">{rendersCompleted}</p>
						<p class="text-[10px] text-gray-700 font-black uppercase tracking-wide mt-1">
							Renders done
						</p>
					</div>

					<div
						class="p-4 bg-white rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_0_#6366f1] text-center transform rotate-1 hover:rotate-0 transition-transform"
					>
						<div
							class="w-10 h-10 bg-[#6366f1] rounded-lg border-2 border-gray-900 flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0_0_#1f2937]"
						>
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<p class="text-2xl font-black text-gray-900">~{timeSaved?.display || '0 min'}</p>
						<p class="text-[10px] text-gray-700 font-black uppercase tracking-wide mt-1">
							Time saved
						</p>
					</div>
				</div>

				<!-- Benefits list -->
				<div
					class="space-y-3 mb-8 bg-gray-50 p-4 rounded-xl border-2 border-gray-900 border-dashed"
				>
					<div class="flex items-center gap-3 text-sm font-bold text-gray-800">
						<div
							class="w-5 h-5 rounded bg-[#10b981] border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0_0_#1f2937]"
						>
							<svg
								class="w-3.5 h-3.5 text-gray-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="4"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<span>Higher limits so you can create more</span>
					</div>
					<div class="flex items-center gap-3 text-sm font-bold text-gray-800">
						<div
							class="w-5 h-5 rounded bg-[#10b981] border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0_0_#1f2937]"
						>
							<svg
								class="w-3.5 h-3.5 text-gray-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="4"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<span>Clean exports without the watermark</span>
					</div>
					<div class="flex items-center gap-3 text-sm font-bold text-gray-800">
						<div
							class="w-5 h-5 rounded bg-[#10b981] border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0_0_#1f2937]"
						>
							<svg
								class="w-3.5 h-3.5 text-gray-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="4"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<span>Priority support when you need help</span>
					</div>
				</div>

				<!-- CTA Buttons -->
				<div class="space-y-3">
					<button
						class="w-full py-3.5 px-6 bg-gray-900 text-white font-black uppercase tracking-widest text-sm rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_0_#9ca3af] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#9ca3af] transition-all group relative overflow-hidden"
						on:click={handleUpgradeClick}
					>
						<span class="relative z-10 flex items-center justify-center gap-2">
							Upgrade and keep going
							<svg
								class="w-4 h-4 group-hover:translate-x-1 transition-transform"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M14 5l7 7m0 0l-7 7m7-7H3"
								/>
							</svg>
						</span>
					</button>

					<button
						class="w-full py-3 text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest transition-colors"
						on:click={handleDismiss}
					>
						No thanks, maybe later
					</button>
				</div>

				<!-- Trust signals -->
				<div
					class="mt-6 pt-0 flex items-center justify-center gap-6 text-[10px] text-gray-400 font-bold uppercase tracking-wider"
				>
					<span class="flex items-center gap-1.5">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
							/>
						</svg>
						Cancel anytime
					</span>
					<span class="flex items-center gap-1.5">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
							/>
						</svg>
						Secure payment
					</span>
				</div>
			</div>
		</div>
	</div>
{/if}
