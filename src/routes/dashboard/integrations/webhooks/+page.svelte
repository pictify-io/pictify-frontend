<script>
	import WebhookSubscriptions from '$lib/components/dashboard/integrations/WebhookSubscriptions.svelte';
	import { fade, fly } from 'svelte/transition';
</script>

<div class="min-h-screen bg-[#FFFDF8]">
	<!-- Header -->
	<div class="bg-white border-b-[3px] border-gray-900 px-6 py-8">
		<div class="max-w-6xl mx-auto">
			<div class="flex items-center gap-3 mb-2">
				<a
					href="/dashboard/integrations"
					class="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:underline flex items-center gap-1 transition-colors"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
					Back to Integrations
				</a>
			</div>

			<h1 class="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
				Webhooks
			</h1>
		</div>
	</div>

	<!-- Content -->
	<div class="max-w-6xl mx-auto px-6 py-12">
		<div in:fly={{ x: 20, duration: 300 }}>
			<WebhookSubscriptions />
		</div>
	</div>
</div>
