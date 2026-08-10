<script>
	import { onMount } from 'svelte';
	import posthog from 'posthog-js';
	import { analytics } from '$lib/analytics.js';
	import { resendVerificationEmail } from '../../../api/auth';

	export let email = '';

	let status = 'idle';
	let message = '';

	// Experiment: verify-copy-v1 (SEQUENCED — flag is dormant, defaults to control).
	// control = existing copy; value-unlock = "verify to unlock API rendering" framing.
	let variant = 'control';
	$: isValueUnlock = variant === 'value-unlock';

	const isLoading = () => status === 'loading';

	onMount(() => {
		// Ungated instrumentation: this banner had ZERO tracking before.
		const applyVariant = () => {
			try {
				variant = posthog.getFeatureFlag?.('verify-copy-v1') || 'control';
			} catch {
				variant = 'control';
			}
		};
		applyVariant();
		analytics.track('verify_banner_shown', { source: 'banner', variant });
		try {
			if (typeof posthog.onFeatureFlags === 'function') {
				posthog.onFeatureFlags(applyVariant);
			}
		} catch {
			/* keep control */
		}
	});

	async function handleResend() {
		if (isLoading()) {
			return;
		}

		analytics.track('verify_resend_clicked', { source: 'banner', variant, auto: false });
		status = 'loading';
		message = '';

		try {
			await resendVerificationEmail();
			status = 'success';
			message = `We just sent a new verification email to ${email || 'your inbox'}.`;
			analytics.track('verify_resend_succeeded', { source: 'banner', variant });
		} catch (error) {
			status = 'error';
			message = error?.message || 'Unable to resend verification email right now.';
			analytics.track('verify_resend_failed', {
				source: 'banner',
				variant,
				error: error?.message || 'unknown'
			});
		}
	}
</script>

<div class="bg-brand-accent border-t-[3px] border-b-[3px] border-gray-900">
	<button
		type="button"
		class="w-full text-left px-5 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-900 disabled:opacity-80 group"
		on:click={handleResend}
		disabled={isLoading()}
	>
		<div class="space-y-1 text-gray-900">
			<div class="flex items-center gap-2 mb-1">
				<span class="w-2 h-2 rounded-full bg-red-500 animate-pulse border border-gray-900" />
				<p class="text-xs uppercase tracking-[0.2em] font-black text-gray-900">Action required</p>
			</div>

			<p class="text-base font-black tracking-tight">
				{isValueUnlock
					? 'Verify your email to unlock API rendering.'
					: 'Verify your email to continue.'}
			</p>
			<p class="text-sm font-medium text-gray-800 leading-snug max-w-xl">
				{#if isValueUnlock}
					Your authenticated renders are blocked until you confirm; it takes one click.{#if email}
						We sent the link to <span class="font-bold underline decoration-2">{email}</span>.{/if}
				{:else if email}
					We sent a link to <span class="font-bold underline decoration-2">{email}</span>. Click
					anywhere to resend.
				{:else}
					Confirm your email address so we know it's really you. Click anywhere to resend.
				{/if}
			</p>
		</div>
		<div
			class="flex items-center gap-2 text-sm font-black text-gray-900 bg-white px-5 py-2.5 rounded-lg border-[3px] border-gray-900 shadow-brutal-lg group-hover:shadow-brutal-sm group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all uppercase tracking-wide"
		>
			{#if isLoading()}
				<span class="inline-flex items-center gap-2">
					<span
						class="w-4 h-4 border-[3px] border-gray-900 border-t-transparent rounded-full animate-spin"
					/>
					Sending…
				</span>
			{:else if status === 'success'}
				<span class="text-green-700 flex items-center gap-1.5">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					Sent!
				</span>
			{:else if status === 'error'}
				<span class="text-red-600">Try again</span>
			{:else}
				<span class="flex items-center gap-2">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
					Resend Link
				</span>
			{/if}
		</div>
	</button>

	{#if message}
		<div class="px-5 pb-4">
			<p
				class="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded border-[2px] border-gray-900 inline-block {status ===
				'error'
					? 'bg-red-100 text-red-700'
					: 'bg-green-100 text-green-800'}"
			>
				{message}
			</p>
		</div>
	{/if}
</div>
