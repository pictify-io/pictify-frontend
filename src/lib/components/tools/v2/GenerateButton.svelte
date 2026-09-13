<script>
	/**
	 * The tool's primary action — and, at zero renders left, the conversion.
	 *
	 * At 0 the button is REPLACED by signup rather than disabled: a dead button
	 * teaches nothing, and the visitor has already seen the tool work.
	 * Signed-in users always get the plain button.
	 */
	import { createEventDispatcher } from 'svelte';
	import { analytics } from '$lib/telemetry.js';

	export let label = 'Generate';
	export let loading = false;
	export let remaining = 5;
	export let loggedIn = false;
	export let toolName = '';
	export let toolPath = '';
	/** Set false while the editor has nothing to render. */
	export let ready = true;

	const dispatch = createEventDispatcher();

	$: outOfRenders = !loggedIn && remaining <= 0;
	$: signupHref = `/signup?redirect=${encodeURIComponent(toolPath)}`;

	function trackLimit() {
		analytics.track('tool_signup_click', { tool_name: toolName, cta_location: 'toolbar_limit' });
	}
</script>

{#if outOfRenders}
	<a
		href={signupHref}
		on:click={trackLimit}
		class="flex flex-col items-center justify-center rounded-lg bg-brand-blue px-6 py-2 text-center shadow-[2px_2px_0_0_#000000] transition-opacity hover:opacity-90"
	>
		<span class="font-sans text-[15px] font-semibold leading-[18px] text-white">
			Sign up · keep rendering
		</span>
		<span class="font-mono text-[10px] tracking-[0.04em] text-[#D3E7F6]">
			50/MO FREE · NO CARD
		</span>
	</a>
{:else}
	<button
		type="button"
		disabled={loading || !ready}
		on:click={() => dispatch('generate')}
		class="flex h-[46px] items-center rounded-lg bg-brand-ink px-6 font-sans text-[15px] font-semibold text-white shadow-[2px_2px_0_0_#FF48B0] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
	>
		{loading ? 'Pressing…' : label}
	</button>
{/if}
