<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { user } from '../../../store/user.store';
	import { getApiToken, createApiToken } from '../../../api/user';
	import { analytics } from '$lib/analytics.js';

	export let toolName = '';

	let show = false;
	let apiKey = '';
	let loading = false;
	let copied = false;

	$: isLoggedIn = !!$user?.email;

	onMount(async () => {
		if (!browser || !isLoggedIn) return;

		// Check if user just signed up (flag set by signup redirect)
		const justSignedUp = sessionStorage.getItem('pictify_just_signed_up');
		if (!justSignedUp) return;

		// Only show once per session
		sessionStorage.removeItem('pictify_just_signed_up');
		show = true;

		// Fetch or create API key
		loading = true;
		try {
			const data = await getApiToken();
			if (data?.apiTokens?.length) {
				apiKey = data.apiTokens[0].token;
			} else {
				const created = await createApiToken();
				apiKey = created?.token || '';
				if (apiKey) {
					analytics.track('api_key_created', { source: 'post_signup_welcome', tool_name: toolName });
				}
			}
		} catch {
			// Not critical — user can get key from dashboard
		}
		loading = false;
	});

	function copyKey() {
		if (!apiKey) return;
		navigator.clipboard.writeText(apiKey);
		copied = true;
		analytics.track('content_copied', { content_type: 'api_key', context: 'post_signup_welcome' });
		setTimeout(() => (copied = false), 2000);
	}

	function dismiss() {
		show = false;
	}
</script>

{#if show}
	<div class="w-full max-w-5xl mx-auto mb-6">
		<div class="border-[3px] border-black bg-[#4ade80]/10 shadow-[6px_6px_0_0_#000] relative overflow-hidden">
			<button
				on:click={dismiss}
				class="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-900 transition-colors z-10"
				aria-label="Dismiss"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<div class="p-6 md:p-8">
				<div class="flex items-center gap-3 mb-4">
					<div class="w-10 h-10 bg-[#4ade80] border-[2px] border-black flex items-center justify-center flex-shrink-0">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div>
						<h3 class="font-black text-lg text-gray-900 uppercase tracking-tight">You're in! Welcome to Pictify.</h3>
						<p class="text-sm font-bold text-gray-600">Your daily limits are gone. Here's your API key to automate this.</p>
					</div>
				</div>

				{#if loading}
					<div class="flex items-center gap-2 text-sm font-bold text-gray-500">
						<div class="w-4 h-4 border-[2px] border-gray-400 border-t-transparent rounded-full animate-spin"></div>
						Generating your API key...
					</div>
				{:else if apiKey}
					<div class="flex flex-col sm:flex-row gap-3 items-stretch">
						<div class="flex-grow bg-white border-[2px] border-black font-mono text-sm px-4 py-3 flex items-center gap-2 overflow-hidden">
							<span class="text-gray-400 flex-shrink-0">API_KEY=</span>
							<span class="text-gray-900 truncate">{apiKey}</span>
						</div>
						<button
							on:click={copyKey}
							class="flex-shrink-0 px-5 py-3 border-[2px] border-black font-black text-sm uppercase tracking-wide transition-all
								{copied
									? 'bg-[#4ade80] text-black'
									: 'bg-black text-white shadow-[3px_3px_0_0_#4ade80] hover:shadow-[1px_1px_0_0_#4ade80] hover:translate-x-[2px] hover:translate-y-[2px]'}"
						>
							{copied ? 'Copied!' : 'Copy Key'}
						</button>
					</div>
					<p class="mt-3 text-xs font-bold text-gray-500">
						Use this key in the <code class="bg-gray-100 px-1 py-0.5 border border-gray-200">Authorization: Bearer</code> header.
						<a href="/dashboard" class="text-[#ff6b6b] hover:underline ml-1">Go to dashboard</a> for templates, bulk render, and more.
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
