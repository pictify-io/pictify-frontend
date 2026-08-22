<script>
	/**
	 * Guest quota ladder for the tool toolbar.
	 *
	 * Three rungs, and none of them gate the render:
	 *   5–3 left  squares + "N FREE TODAY · NO WATERMARK"
	 *   2–1 left  squares + "N LEFT TODAY" + a quiet field chip to signup
	 *   0 left    empty squares + "0 LEFT · RESETS 00:00 UTC"
	 *
	 * The Generate button is swapped for a signup button at zero — that lives in
	 * GenerateButton, not here, so this component only ever reports state.
	 *
	 * Replaces GenerationLimitBanner, whose "Daily limit reached!" banner sat
	 * above the tool and said the same thing louder.
	 */
	import { GUEST_DAILY_LIMIT } from '../../../../store/generationLimits.store';
	import { analytics } from '$lib/telemetry.js';

	/** Renders left today. Clamped, so a negative count still reads as 0. */
	export let remaining = GUEST_DAILY_LIMIT;
	export let limit = GUEST_DAILY_LIMIT;
	/** Hidden entirely for signed-in users — their limit is monthly, not daily. */
	export let loggedIn = false;
	export let toolName = '';
	/** Where signup should return the visitor to. */
	export let toolPath = '';

	$: left = Math.max(0, Math.min(limit, remaining));
	$: used = limit - left;
	$: signupHref = `/signup?redirect=${encodeURIComponent(toolPath)}`;

	function trackChip() {
		analytics.track('tool_signup_click', { tool_name: toolName, cta_location: 'toolbar_chip' });
	}
</script>

{#if !loggedIn}
	<div class="flex items-center gap-2.5">
		<div class="flex gap-1" aria-hidden="true">
			{#each Array(limit) as _, i}
				<span
					class="h-2.5 w-2.5 border border-brand-ink {i < left ? 'bg-brand-ink' : 'bg-transparent'}"
				/>
			{/each}
		</div>

		<span class="font-mono text-xs tracking-[0.06em] text-brand-slate">
			{#if left === 0}
				0 LEFT · RESETS 00:00 UTC
			{:else if left <= 2}
				{left} LEFT TODAY
			{:else}
				{left} FREE TODAY · NO WATERMARK
			{/if}
		</span>

		{#if left > 0 && left <= 2}
			<a
				href={signupHref}
				on:click={trackChip}
				class="rounded-full border border-brand-ink bg-brand-field px-2.5 py-1 font-mono text-[11px] tracking-[0.04em] text-brand-ink transition-shadow hover:shadow-[2px_2px_0_0_#000000]"
			>
				SIGN UP → 50/MO
			</a>
		{/if}
	</div>
{/if}
