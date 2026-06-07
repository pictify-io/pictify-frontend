<script>
	import { onMount } from 'svelte';
	import { user } from '../../../store/user.store';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import { analytics } from '$lib/analytics.js';

	/**
	 * Generation Limit Banner
	 * Shows remaining free generations for guest users
	 * Encourages signup when limit is low
	 */
	export let toolName = '';

	$: isLoggedIn = !!$user?.email;
	$: remaining = GUEST_DAILY_LIMIT - ($generationLimits?.count || 0);
	$: hasGenerated = ($generationLimits?.count || 0) > 0;
	$: showBanner = !isLoggedIn && hasGenerated; // Show after first generation, not before
	$: isLow = remaining <= 2;
	$: isExhausted = remaining <= 0;

	onMount(() => {
		generationLimits.refresh();
	});
</script>

{#if showBanner}
	<div class="w-full max-w-5xl mx-auto mb-4">
		<div
			class={`
        flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-[3px] border-black
        ${isExhausted ? 'bg-brand-danger/20' : isLow ? 'bg-brand-accent/30' : 'bg-white'}
        ${isExhausted ? 'shadow-[4px_4px_0_0_#ff6b6b]' : 'shadow-brutal-lg'}
      `}
		>
			<div class="flex items-center gap-3">
				<!-- Counter visual -->
				<div class="flex items-center gap-1">
					{#each Array(GUEST_DAILY_LIMIT) as _, i}
						<div
							class={`w-3 h-3 border-[2px] border-black ${
								i < GUEST_DAILY_LIMIT - remaining ? 'bg-gray-400' : 'bg-data-green'
							}`}
						/>
					{/each}
				</div>

				<div class="text-sm font-bold">
					{#if isExhausted}
						<span class="text-brand-danger">Daily limit reached!</span>
						<span class="text-gray-600"> Sign up for unlimited access</span>
					{:else if isLow}
						<span class="text-brand-danger">{remaining}</span>
						<span class="text-gray-700">
							free {remaining === 1 ? 'generation' : 'generations'} left today</span
						>
					{:else}
						<span class="text-gray-700"
							>{remaining} of {GUEST_DAILY_LIMIT} free generations remaining</span
						>
					{/if}
				</div>
			</div>

			<a
				href="/signup"
				on:click={() => analytics.track('tool_signup_click', { tool_name: toolName, cta_location: 'generation_limit_banner' })}
				class={`
          px-4 py-2 border-[2px] border-black font-black text-xs uppercase tracking-wide transition-all
          ${
						isExhausted
							? 'bg-brand-danger text-white shadow-brutal-md hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]'
							: isLow
							? 'bg-brand-accent text-black shadow-brutal-md hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]'
							: 'bg-white text-black hover:bg-gray-50'
					}
        `}
			>
				{isExhausted ? 'Get Unlimited Free' : 'Remove Limits'}
			</a>
		</div>
	</div>
{/if}
