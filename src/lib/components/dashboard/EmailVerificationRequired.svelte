<script>
	import { resendVerificationEmail } from '../../../api/auth';

	export let email = '';
	export let feature = 'this feature';

	let status = 'idle';
	let message = '';

	$: isLoading = status === 'loading';

	async function handleResend() {
		if (isLoading) return;

		status = 'loading';
		message = '';

		try {
			await resendVerificationEmail();
			status = 'success';
			message = `Verification email sent to ${email || 'your inbox'}`;
		} catch (error) {
			status = 'error';
			message = error?.message || 'Unable to resend verification email';
		}
	}
</script>

<div
	class="bg-white border-[3px] border-gray-900 rounded-xl p-6 space-y-5 shadow-[6px_6px_0_0_#1f2937]"
>
	<div class="flex items-start gap-4">
		<div
			class="flex-shrink-0 w-12 h-12 bg-[#ffc480] rounded-xl flex items-center justify-center border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]"
		>
			<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="3"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
		</div>
		<div class="flex-1">
			<h3 class="text-base font-black text-gray-900 uppercase tracking-widest mb-1.5">
				Verification Required
			</h3>
			<p class="text-sm font-medium text-gray-600 leading-relaxed">
				To use {feature}, please verify your email address.
				{#if email}
					We sent a link to <span class="font-bold text-gray-900 bg-yellow-100 px-1 rounded"
						>{email}</span
					>.
				{/if}
			</p>
		</div>
	</div>

	<div class="flex flex-col sm:flex-row gap-3">
		<button
			type="button"
			class="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs rounded-lg border-[3px] border-gray-900 shadow-[4px_4px_0_0_#9ca3af] hover:shadow-[2px_2px_0_0_#9ca3af] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
			on:click={handleResend}
			disabled={isLoading}
		>
			{#if isLoading}
				<svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					/>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					/>
				</svg>
				Sending...
			{:else if status === 'success'}
				<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="3"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				Check your inbox!
			{:else}
				<svg
					class="w-4 h-4 text-white group-hover:scale-110 transition-transform"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
				Resend Verification Email
			{/if}
		</button>
	</div>

	{#if message}
		<p
			class="text-xs font-bold text-center uppercase tracking-wide {status === 'error'
				? 'text-red-600'
				: 'text-green-600'}"
		>
			{message}
		</p>
	{/if}
</div>
