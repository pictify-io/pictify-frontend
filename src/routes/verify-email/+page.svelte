<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Loader from '$lib/components/Loader.svelte';
	import { verifyEmail } from '../../api/auth';

	let status = 'idle';
	let message = 'Hang tight while we check your verification link.';
	let token = '';

	$: isVerifying = status === 'verifying';
	$: canRetry = status === 'error' && Boolean(token);

	async function attemptVerification() {
		if (!token) {
			status = 'error';
			message = 'Verification token missing. Please use the link sent to your email.';
			return;
		}
		if (isVerifying) {
			return;
		}

		status = 'verifying';
		message = 'Hang tight while we confirm your email address.';

		try {
			await verifyEmail({ token });
			status = 'success';
			message = 'Your email is verified. You can now log in to Pictify.';
		} catch (error) {
			status = 'error';
			message =
				error?.message || 'Unable to verify your email right now. Please request a new link.';
		}
	}

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		token = params.get('token') ?? '';

		if (!token) {
			status = 'error';
			message = 'Verification token missing. Please use the link sent to your email.';
			return;
		}

		attemptVerification();
	});
</script>

<svelte:head>
	<title>Pictify.io: Verify your email</title>
</svelte:head>

<section class="flex justify-center items-center w-screen h-screen px-4">
	<div class="sm:border-2 border-gray-900 p-5 sm:p-10 max-w-md w-full bg-white">
		<div class="flex flex-col items-center justify-center text-center">
			<div class="my-5">
				<span class="text-4xl font-bold font-heading text-shadow">Pictify </span>
				<span class="text-xs font-heading text-gray-700">beta</span>
			</div>
			<h1 class="text-2xl font-bold">Verify your email</h1>
			<p class="text-gray-700 mt-2">
				We sent a verification link to your inbox. Open it on this device and we'll finish setting
				up your account.
			</p>
		</div>

		<div class="mt-10 space-y-6">
			<Loader size="10" show={isVerifying} />

			{#if status === 'success'}
				<div class="border border-green-700 bg-green-50 text-green-800 rounded-md p-4 text-sm">
					{message}
				</div>
			{:else if status === 'error'}
				<div class="border border-red-600 bg-red-50 text-red-700 rounded-md p-4 text-sm">
					{message}
				</div>
			{:else}
				<div class="border border-gray-200 bg-gray-50 text-gray-700 rounded-md p-4 text-sm">
					{message}
				</div>
			{/if}

			<div class="flex flex-col gap-3">
				{#if canRetry}
					<button
						class="border-2 border-gray-900 text-gray-900 font-semibold py-2 rounded-md disabled:opacity-50"
						on:click={attemptVerification}
						disabled={isVerifying}
					>
						Try again
					</button>
				{/if}
				<button
					class="bg-gray-900 text-white font-semibold py-2 rounded-md"
					on:click={() => goto('/login')}
				>
					Go to login
				</button>
			</div>
		</div>
	</div>
</section>

