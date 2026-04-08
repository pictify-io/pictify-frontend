<script>
	import { user } from '../../../store/user.store';
	import { analytics } from '$lib/analytics.js';
	import posthog from 'posthog-js';
	import { browser } from '$app/environment';

	export let toolName = '';

	$: isLoggedIn = !!$user?.email;

	let showBar = false;
	let dismissed = false;
	let hasGenerated = false;

	function getVariant() {
		if (!browser) return 'control';
		const flag = posthog.getFeatureFlag?.('tool-sticky-signup-bar');
		// In dev (PostHog not loaded), treat as active so we can test
		if (flag === undefined && !posthog.__loaded) return 'sticky-bar';
		return flag || 'control';
	}

	$: if (hasGenerated && !isLoggedIn && !dismissed) {
		showBar = getVariant() === 'sticky-bar';
	}

	export function triggerAfterGeneration() {
		hasGenerated = true;
	}

	function handleSignupClick() {
		analytics.track('tool_signup_click', {
			tool_name: toolName,
			cta_location: 'sticky_bottom_bar',
			experiment: 'tool-sticky-signup-bar',
			variant: getVariant()
		});
	}

	function dismiss() {
		dismissed = true;
		showBar = false;
	}
</script>

{#if showBar}
	<div
		class="fixed bottom-0 left-0 right-0 z-50 border-t-[3px] border-black bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
	>
		<div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
			<div class="flex items-center gap-3 min-w-0">
				<div class="hidden sm:block flex-shrink-0">
					<div
						class="w-8 h-8 bg-[#4ade80] border-[2px] border-black flex items-center justify-center"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>
				</div>
				<p class="text-sm font-bold text-gray-900 truncate">
					<span class="text-[#ff6b6b]">Remove watermarks</span> and get unlimited generations + API access
				</p>
			</div>

			<div class="flex items-center gap-2 flex-shrink-0">
				<a
					href="/signup?redirect=/tools/{toolName.replace(/_/g, '-')}"
					on:click={handleSignupClick}
					class="px-5 py-2 bg-[#ff6b6b] text-white border-[2px] border-black font-black text-xs uppercase tracking-wide shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					Sign Up Free
				</a>
				<button
					on:click={dismiss}
					class="p-2 text-gray-400 hover:text-gray-900 transition-colors"
					aria-label="Dismiss"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}
