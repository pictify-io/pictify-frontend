<script>
	import { resendVerificationEmail } from '../../../api/auth';

	export let email = '';

	let status = 'idle';
	let message = '';

	const isLoading = () => status === 'loading';

	async function handleResend() {
		if (isLoading()) {
			return;
		}

		status = 'loading';
		message = '';

		try {
			await resendVerificationEmail();
			status = 'success';
			message = `We just sent a new verification email to ${email || 'your inbox'}.`;
		} catch (error) {
			status = 'error';
			message = error?.message || 'Unable to resend verification email right now.';
		}
	}
</script>

<div class="bg-[#ffc480] border-t-[3px] border-b-[3px] border-gray-900">
	<button
		type="button"
		class="w-full text-left px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ff6b6b] disabled:opacity-80"
		on:click={handleResend}
		disabled={isLoading()}
	>
		<div class="space-y-1 text-gray-900">
			<p class="text-xs uppercase tracking-[0.2em] font-bold text-gray-900">
				Action required
			</p>
			<p class="text-base font-bold">Verify your email to finish setting up Pictify.</p>
			<p class="text-sm text-gray-800">
				{#if email}
					Confirm <span class="font-bold">{email}</span> so we know it's really you. Click this
					banner anytime to resend the link.
				{:else}
					Confirm your email address so we know it's really you. Click this banner anytime to
					resend the link.
				{/if}
			</p>
		</div>
		<div class="flex items-center gap-2 text-sm font-bold text-gray-900 bg-white px-4 py-2 rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f293780] hover:shadow-[1px_1px_0_0_#1f293780] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
			{#if isLoading()}
				<span class="inline-flex items-center gap-2">
					<span class="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
					Sending…
				</span>
			{:else if status === 'success'}
				<span class="text-green-700 flex items-center gap-1">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
					</svg>
					Sent!
				</span>
			{:else if status === 'error'}
				<span class="text-[#ff6b6b]">Try again</span>
			{:else}
				<span class="flex items-center gap-1">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
					</svg>
					Resend
				</span>
			{/if}
		</div>
	</button>

	{#if message}
		<p
			class="px-5 pb-4 text-sm font-medium transition-colors duration-200 {status === 'error' ? 'text-[#ff6b6b]' : 'text-green-700'}"
		>
			{message}
		</p>
	{/if}
</div>
