<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';

	let status = 'idle';
	let message = 'Processing your request...';
	let email = '';
	let token = '';

	$: isProcessing = status === 'verifying';

	async function callEndpoint(action) {
		status = 'verifying';
		message = action === 'unsubscribe' ? 'Unsubscribing...' : 'Resubscribing...';

		try {
			const url = new URL(`${PUBLIC_BACKEND_URL}/api/email-preferences/${action}`);
			url.searchParams.set('email', email);
			url.searchParams.set('token', token);

			const res = await fetch(url);
			const data = await res.json();

			if (!res.ok || !data.success) {
				throw new Error(data.error || 'Something went wrong');
			}

			if (action === 'unsubscribe') {
				status = 'unsubscribed';
				message =
					"You've been unsubscribed from marketing emails. You'll still receive important account notifications.";
			} else {
				status = 'resubscribed';
				message = "Welcome back! You've been resubscribed to marketing emails.";
			}
		} catch (error) {
			status = 'error';
			message = error?.message || 'Unable to process your request. Please try again.';
		}
	}

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		email = params.get('email') ?? '';
		token = params.get('token') ?? '';

		if (!email || !token) {
			status = 'error';
			message = 'Invalid unsubscribe link. Please use the link from your email.';
			return;
		}

		callEndpoint('unsubscribe');
	});
</script>

<svelte:head>
	<title>Pictify.io: Email preferences</title>
</svelte:head>

<section class="flex justify-center items-center w-screen h-screen px-4 bg-[#FFFDF8]">
	<div
		class="w-full max-w-lg bg-white border-[3px] border-gray-900 rounded-xl p-8 sm:p-10 shadow-[8px_8px_0_0_#1f2937] relative overflow-hidden"
	>
		<!-- Decorative blobs -->
		<div
			class="absolute -top-10 -right-10 w-40 h-40 bg-[#ffc480] rounded-full blur-3xl opacity-20 pointer-events-none"
		/>
		<div
			class="absolute -bottom-10 -left-10 w-40 h-40 bg-[#4ade80] rounded-full blur-3xl opacity-20 pointer-events-none"
		/>

		<div class="relative z-10 flex flex-col items-center justify-center text-center">
			<div class="mb-8 relative">
				<div class="flex items-center gap-4 justify-center relative z-10">
					<div
						class="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center shadow-[4px_4px_0_0_#ffc480] border-[3px] border-transparent"
					>
						<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>
					<div class="text-5xl font-black tracking-tighter text-gray-900 leading-none">PICTIFY</div>
				</div>
				<div class="absolute inset-0 bg-yellow-300 blur-xl opacity-30 -z-10 transform scale-150" />
			</div>

			<h1 class="text-3xl font-black text-gray-900 mb-3 tracking-tight">Email preferences</h1>
			<p class="text-gray-600 font-medium leading-relaxed max-w-sm mx-auto">
				Manage your email subscription settings.
			</p>
		</div>

		<div class="mt-10 space-y-6 relative z-10">
			{#if isProcessing}
				<div class="flex flex-col items-center justify-center py-8 space-y-4">
					<div class="relative w-16 h-16">
						<div class="absolute inset-0 border-[4px] border-gray-200 rounded-full" />
						<div
							class="absolute inset-0 border-[4px] border-gray-900 border-t-transparent rounded-full animate-spin"
						/>
					</div>
					<p class="font-bold text-gray-900 animate-pulse">{message}</p>
				</div>
			{:else}
				{#if status === 'unsubscribed'}
					<div
						class="border-[3px] border-gray-900 bg-[#4ade80] text-gray-900 rounded-xl p-5 shadow-[4px_4px_0_0_#1f2937] flex items-start gap-4 transform rotate-1"
					>
						<div class="bg-white rounded-full p-1 border-[2px] border-gray-900 flex-shrink-0">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<div class="font-bold text-left text-sm leading-snug">
							{message}
						</div>
					</div>
				{:else if status === 'resubscribed'}
					<div
						class="border-[3px] border-gray-900 bg-[#4ade80] text-gray-900 rounded-xl p-5 shadow-[4px_4px_0_0_#1f2937] flex items-start gap-4 transform rotate-1"
					>
						<div class="bg-white rounded-full p-1 border-[2px] border-gray-900 flex-shrink-0">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<div class="font-bold text-left text-sm leading-snug">
							{message}
						</div>
					</div>
				{:else if status === 'error'}
					<div
						class="border-[3px] border-gray-900 bg-[#ff6b6b] text-white rounded-xl p-5 shadow-[4px_4px_0_0_#1f2937] flex items-start gap-4 transform -rotate-1"
					>
						<div
							class="bg-white text-gray-900 rounded-full p-1 border-[2px] border-gray-900 flex-shrink-0"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</div>
						<div class="font-bold text-left text-sm leading-snug">
							{message}
						</div>
					</div>
				{:else}
					<div
						class="border-[3px] border-gray-900 bg-gray-50 text-gray-600 rounded-xl p-5 text-sm font-bold text-center border-dashed"
					>
						{message}
					</div>
				{/if}

				<div class="flex flex-col gap-3 pt-2">
					{#if status === 'unsubscribed'}
						<button
							class="w-full bg-white text-gray-900 font-black uppercase tracking-widest py-3 rounded-lg border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							on:click={() => callEndpoint('resubscribe')}
							disabled={isProcessing}
						>
							Resubscribe
						</button>
					{/if}

					<button
						class="w-full bg-gray-900 text-white font-black uppercase tracking-widest py-3 rounded-lg border-[3px] border-gray-900 shadow-[4px_4px_0_0_#9ca3af] hover:shadow-[2px_2px_0_0_#9ca3af] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-black transition-all flex items-center justify-center gap-2 group"
						on:click={() => goto('/')}
					>
						Go to homepage
						<svg
							class="w-4 h-4 group-hover:translate-x-1 transition-transform"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M14 5l7 7m0 0l-7 7m7-7H3"
							/>
						</svg>
					</button>
				</div>
			{/if}
		</div>
	</div>
</section>
