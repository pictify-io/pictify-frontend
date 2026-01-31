<script>
	import WebhookSubscriptions from '$lib/components/dashboard/integrations/WebhookSubscriptions.svelte';
	import { fade, fly } from 'svelte/transition';
</script>

<div class="min-h-full pb-12">
	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
		<div>
			<div class="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded mb-3">
				<a href="/dashboard/integrations" class="hover:text-gray-300 transition-colors flex items-center gap-1">
					<span class="text-gray-400">Integrations</span>
					<span class="text-gray-600">/</span>
				</a>
				<span>Core</span>
			</div>
			
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
				Webhooks
			</h1>
			
			<p class="text-gray-600 font-bold mt-2 text-sm sm:text-base max-w-2xl">
				Receive real-time events when images are generated or templates are updated.
			</p>
		</div>

		<div class="text-right hidden md:block">
			<a 
				href="/dashboard/integrations"
				class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:underline transition-colors"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
				Back to Directory
			</a>
		</div>
	</div>

	<!-- Content -->
	<div in:fly={{ x: 20, duration: 300 }}>
		<WebhookSubscriptions />
	</div>
</div>
