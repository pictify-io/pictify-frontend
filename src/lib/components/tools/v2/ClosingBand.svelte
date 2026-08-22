<script>
	/**
	 * Full-width blue band between the related tools and the footer.
	 *
	 * The big line is marketing copy, NOT a section heading: it renders as a <p>
	 * so a tool page's heading outline stays exactly what its SEO sections
	 * declare. Do not promote it to an <h2>.
	 *
	 * The third cell of the strip ("pressed this month") is only rendered when a
	 * real number is passed in. There is no public endpoint for it today, so it
	 * stays hidden rather than showing an invented figure.
	 */
	import { analytics } from '$lib/telemetry.js';

	export let toolName = '';
	export let toolPath = '';
	export let loggedIn = false;
	/** Real monthly render count. Leave null to hide the cell. */
	export let pressedThisMonth = null;

	$: signupHref = `/signup?redirect=${encodeURIComponent(toolPath)}`;
	$: pressedLabel =
		typeof pressedThisMonth === 'number' ? pressedThisMonth.toLocaleString('en-US') : null;

	function track() {
		analytics.track('tool_signup_click', { tool_name: toolName, cta_location: 'closing_band' });
	}
</script>

{#if !loggedIn}
	<section class="mt-20 w-full bg-brand-blue px-5 py-14 lg:px-10 lg:py-20">
		<div class="mx-auto flex w-full max-w-page flex-col gap-10">
			<div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
				<div class="flex flex-col gap-3.5 lg:w-[640px] lg:flex-shrink-0">
					<p class="font-mono text-xs tracking-[0.06em] text-brand-sky">THIS TOOL, ON AN ACCOUNT</p>
					<p
						class="font-display text-[34px] font-bold leading-[1.08] tracking-[-0.02em] text-white lg:text-[50px] lg:leading-[56px]"
					>
						Same press. Fifty a month. Your renders kept.
					</p>
					<p
						class="font-sans text-base leading-[25px] text-brand-powder lg:text-lg lg:leading-[27px]"
					>
						No card, no watermark. Everything you just did here becomes an API call or a template
						the moment you sign in.
					</p>
				</div>

				<div class="flex flex-col items-start gap-2.5 lg:items-end">
					<a
						href={signupHref}
						on:click={track}
						class="flex items-center justify-center rounded-lg bg-brand-ink px-7 py-4 font-sans text-base font-semibold text-white shadow-[3px_3px_0_0_#FF48B0] transition-opacity hover:opacity-90"
					>
						Start rendering free
					</a>
					<p class="font-mono text-[11px] tracking-[0.06em] text-brand-sky">
						LANDS BACK ON THIS PAGE WITH YOUR KEY
					</p>
				</div>
			</div>

			<div
				class="flex flex-col overflow-hidden rounded-tile border-2 border-brand-ink bg-brand-paper lg:flex-row"
			>
				<div
					class="flex flex-1 flex-col gap-3 border-b-2 border-brand-ink px-7 py-6 lg:border-b-0 lg:border-r-2"
				>
					<p class="font-mono text-xs tracking-[0.06em] text-brand-mute">HERE, AS A GUEST</p>
					<p class="font-sans text-[15px] leading-6 text-brand-slate">
						5 renders a day · no watermark · download &amp; share link · nothing saved
					</p>
				</div>
				<div class="flex flex-1 flex-col gap-3 bg-brand-field px-7 py-6">
					<p class="font-mono text-xs tracking-[0.06em] text-brand-ink">FREE ACCOUNT</p>
					<p class="font-sans text-[15px] leading-6 text-brand-ink">
						50 renders a month · renders kept · API key · save as template · batch from CSV ·
						webhooks
					</p>
				</div>
				{#if pressedLabel}
					<div
						class="flex flex-col gap-3 border-t-2 border-brand-ink px-7 py-6 lg:w-[300px] lg:flex-shrink-0 lg:border-l-2 lg:border-t-0"
					>
						<p class="font-mono text-xs tracking-[0.06em] text-brand-mute">PRESSED THIS MONTH</p>
						<p
							class="font-display text-[32px] font-bold leading-9 tracking-[-0.02em] text-brand-ink"
						>
							{pressedLabel}
						</p>
						<p class="font-sans text-[13px] leading-4 text-brand-mute">
							renders through this page and the API
						</p>
					</div>
				{/if}
			</div>
		</div>
	</section>
{/if}
