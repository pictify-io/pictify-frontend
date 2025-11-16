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

<div class="bg-amber-50 border-b-2 border-t-2 border-black">
	<button
		type="button"
		class="w-full text-left px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:opacity-80"
		on:click={handleResend}
		disabled={isLoading()}
	>
		<div class="space-y-1 text-gray-900">
			<p class="text-xs uppercase tracking-[0.2em] font-semibold text-amber-900">
				Action required
			</p>
			<p class="text-base font-semibold">Verify your email to finish setting up Pictify.</p>
			<p class="text-sm text-gray-800">
				{#if email}
					Confirm <span class="font-semibold">{email}</span> so we know it's really you. Click this
					banner anytime to resend the link.
				{:else}
					Confirm your email address so we know it's really you. Click this banner anytime to
					resend the link.
				{/if}
			</p>
		</div>
		<div class="flex items-center gap-2 text-sm font-semibold text-gray-900">
			{#if isLoading()}
				<span class="inline-flex items-center gap-2">
					<span class="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
					Sending…
				</span>
			{:else if status === 'success'}
				<span class="text-green-700">Sent!</span>
			{:else if status === 'error'}
				<span class="text-red-700">Try again</span>
			{:else}
				<span>Click to resend</span>
			{/if}
		</div>
	</button>

	{#if message}
		<p
			class={`px-5 pb-4 text-sm ${
				status === 'error' ? 'text-red-700' : 'text-green-700'
			} transition-colors duration-200`}
		>
			{message}
		</p>
	{/if}
</div>

