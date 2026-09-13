<script>
	/**
	 * Email verification as a rail card, not a shout across the whole app: it
	 * sits above the meters — persistent on every page, scoped to the rail.
	 * Keeps the instrumentation (and the dormant verify-copy-v1 experiment)
	 * from the banner it replaces; events carry source: 'rail_card'.
	 */
	import { onMount } from 'svelte';
	import posthog from 'posthog-js';
	import { analytics } from '$lib/telemetry.js';
	import { resendVerificationEmail } from '../../../../api/auth';

	export let email = '';

	let status = 'idle';

	let variant = 'control';
	$: isValueUnlock = variant === 'value-unlock';

	onMount(() => {
		const applyVariant = () => {
			try {
				variant = posthog.getFeatureFlag?.('verify-copy-v1') || 'control';
			} catch {
				variant = 'control';
			}
		};
		applyVariant();
		analytics.track('verify_banner_shown', { source: 'rail_card', variant });
		try {
			if (typeof posthog.onFeatureFlags === 'function') {
				posthog.onFeatureFlags(applyVariant);
			}
		} catch {
			/* keep control */
		}
	});

	async function handleResend() {
		if (status === 'loading') return;
		analytics.track('verify_resend_clicked', { source: 'rail_card', variant, auto: false });
		status = 'loading';
		try {
			await resendVerificationEmail();
			status = 'success';
			analytics.track('verify_resend_succeeded', { source: 'rail_card', variant });
		} catch (error) {
			status = 'error';
			analytics.track('verify_resend_failed', {
				source: 'rail_card',
				variant,
				error: error?.message || 'unknown'
			});
		}
	}
</script>

<div class="flex flex-col gap-1.5 rounded-btn bg-brand-rose px-3 py-2.5">
	<span class="flex items-center gap-1.5">
		<span class="block h-2 w-2 animate-pulse bg-brand-pink" aria-hidden="true"></span>
		<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-ink">Verify your email</span>
	</span>
	<span class="font-sans text-[11.5px] leading-4 text-brand-ink/75">
		{#if isValueUnlock}
			API renders unlock once you confirm — the link's in your inbox.
		{:else}
			The link is waiting in your inbox.
		{/if}
	</span>
	<button
		type="button"
		on:click={handleResend}
		disabled={status === 'loading'}
		title={email ? `Resend to ${email}` : 'Resend the verification link'}
		class="self-start font-mono text-[10px] uppercase tracking-[0.08em] underline underline-offset-2 disabled:opacity-50
			{status === 'success' ? 'text-brand-proof no-underline' : status === 'error' ? 'text-[#B0483A]' : 'text-brand-ink'}"
	>
		{#if status === 'loading'}
			Sending…
		{:else if status === 'success'}
			Sent ✓
		{:else if status === 'error'}
			Couldn't send — try again
		{:else}
			Resend link
		{/if}
	</button>
</div>
