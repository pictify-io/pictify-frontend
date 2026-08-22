<script>
	/**
	 * The rail's standing offer. One CTA voice across the whole page:
	 * "50 renders a month. No card."
	 *
	 * Hidden for signed-in visitors — they already have the account this sells.
	 */
	import { analytics } from '$lib/telemetry.js';

	export let toolName = '';
	export let toolPath = '';
	export let loggedIn = false;
	/** cta_location for PostHog. */
	export let location = 'rail_card';

	const proof = ['NO WATERMARK', 'API KEY IN 10 SECONDS', 'SAVE AS A REUSABLE TEMPLATE'];

	$: signupHref = `/signup?redirect=${encodeURIComponent(toolPath)}`;

	function track() {
		analytics.track('tool_signup_click', { tool_name: toolName, cta_location: location });
	}
</script>

{#if !loggedIn}
	<div
		class="flex flex-col gap-3.5 border-2 border-brand-ink bg-brand-paper p-6 shadow-[6px_6px_0_0_#0078BF]"
	>
		<div class="flex gap-1" aria-hidden="true">
			<span class="h-2.5 w-2.5 bg-brand-blue" />
			<span class="h-2.5 w-2.5 bg-brand-ink" />
			<span class="h-2.5 w-2.5 bg-brand-pink" />
		</div>

		<p class="font-display text-2xl font-bold leading-[30px] tracking-[-0.02em] text-brand-ink">
			50 renders a month. No card.
		</p>
		<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
			A free account lifts the daily limit, keeps your renders, and turns this page into an API call
			you can put in a cron.
		</p>

		<ul class="flex flex-col gap-1.5">
			{#each proof as row (row)}
				<li class="flex items-center gap-2">
					<span class="h-2 w-2 flex-shrink-0 bg-brand-proof" aria-hidden="true" />
					<span class="font-mono text-xs tracking-[0.06em] text-brand-slate">{row}</span>
				</li>
			{/each}
		</ul>

		<a
			href={signupHref}
			on:click={track}
			class="flex items-center justify-center bg-brand-ink p-3.5 font-sans text-[15px] font-medium text-white shadow-[3px_3px_0_0_#FF48B0] transition-opacity hover:opacity-90"
		>
			Start rendering free
		</a>
		<p class="text-center font-mono text-[11px] tracking-[0.06em] text-brand-mute">
			COMES BACK TO THIS PAGE AFTER SIGNUP
		</p>
	</div>
{/if}
