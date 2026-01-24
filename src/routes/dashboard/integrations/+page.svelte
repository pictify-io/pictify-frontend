<script>
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	const integrations = [
		{
			id: 'webhooks',
			name: 'Webhooks',
			description: 'Receive real-time events when images are generated or templates are updated.',
			iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
			category: 'Core',
			href: '/dashboard/integrations/webhooks',
			bgColor: 'bg-[#ffc480]'
		},
		{
			id: 'storage',
			name: 'Storage Connectors',
			description: 'Automatically upload your generated content to S3, Google Cloud, Cloudinary, or ImageKit.',
			iconPath: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
			category: 'Core',
			href: '/dashboard/integrations/storage',
			bgColor: 'bg-[#4ade80]'
		},
		{
			id: 'zapier',
			name: 'Zapier',
			description: 'Connect Pictify to 5,000+ apps like Sheets, Slack, and Airtable.',
			iconPath: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
			category: 'No-Code',
			url: 'https://zapier.com/apps/pictify',
			external: true,
			comingSoon: true,
			bgColor: 'bg-[#ff6b6b]'
		},
		{
			id: 'make',
			name: 'Make.com',
			description: 'Build complex visual automation workflows with Pictify integration.',
			iconPath: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
			category: 'No-Code',
			url: 'https://make.com/en/integrations/pictify',
			external: true,
			comingSoon: true,
			bgColor: 'bg-[#a78bfa]'
		},
		{
			id: 'n8n',
			name: 'n8n',
			description: 'Fair-code workflow automation. Host it yourself or use their cloud.',
			iconPath: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
			category: 'Low-Code',
			url: 'https://n8n.io/integrations/pictify',
			external: true,
			comingSoon: true,
			bgColor: 'bg-[#ea580c]'
		},
		{
			id: 'pipedream',
			name: 'Pipedream',
			description: 'Developer-friendly integration platform for serverless capabilities.',
			iconPath: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
			category: 'Developer',
			url: 'https://pipedream.com/apps/pictify',
			external: true,
			comingSoon: true,
			bgColor: 'bg-[#60a5fa]'
		}
	];

	function handleCardClick(integration) {
		if (integration.external && integration.url) {
			window.open(integration.url, '_blank');
		} else if (integration.href) {
			goto(integration.href);
		}
	}
</script>

<section class="min-h-full pb-12">
	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
		<div>
			<div class="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded mb-3">
				<span class="w-2 h-2 bg-[#ffc480] rounded-full"></span>
				Directory
			</div>
			
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
				Integrations
			</h1>
			
			<p class="text-gray-600 font-bold mt-2 text-sm sm:text-base max-w-2xl">
				Connect Pictify to your favorite tools. Automate image generation, sync templates, and stream events to your infrastructure.
			</p>
		</div>

		<div class="text-right hidden md:block">
			<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Available</div>
			<div class="text-lg sm:text-xl font-black text-gray-900 tabular-nums">{integrations.filter(i => !i.comingSoon).length} Active</div>
		</div>
	</div>

	<!-- Content -->
	<div in:fade={{ duration: 200 }}>
		<!-- Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each integrations as item}
				<button
					disabled={item.comingSoon}
					on:click={() => handleCardClick(item)}
					class="group text-left h-full relative bg-white border-[3px] border-gray-900 rounded-xl p-6 shadow-[6px_6px_0_0_#1f2937] transition-all duration-200 flex flex-col {item.comingSoon ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px]'}"
				>
					<!-- Icon Badge -->
					<div class="mb-6 flex justify-between items-start w-full">
						<div class={`w-14 h-14 ${item.bgColor} border-[3px] border-gray-900 rounded-lg flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,0.2)] group-hover:scale-110 transition-transform duration-300`}>
							<svg class="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d={item.iconPath} />
							</svg>
						</div>

						{#if item.comingSoon}
							<span class="px-2 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded text-[10px] font-black uppercase tracking-wider">
								Coming Soon
							</span>
						{:else if item.external}
							<span class="text-gray-400 group-hover:text-gray-900 transition-colors">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
							</span>
						{/if}
					</div>

					<!-- Text -->
					<div class="flex-grow">
						<h3 class="text-xl font-black text-gray-900 mb-2 group-hover:text-[#ff6b6b] transition-colors">
							{item.name}
						</h3>
						<p class="text-sm font-bold text-gray-500 leading-relaxed">
							{item.description}
						</p>
					</div>

					<!-- Footer / Category -->
					<div class="mt-6 pt-4 border-t-2 border-dashed border-gray-200 w-full flex justify-between items-center">
						<span class="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded">
							{item.category}
						</span>
						<span class="text-xs font-bold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
							{#if item.comingSoon}
								Available Soon
							{:else}
								{item.external ? 'Connect' : 'Configure'} <span aria-hidden="true">→</span>
							{/if}
						</span>
					</div>
				</button>
			{/each}
		</div>

		<!-- Request Section -->
		<div class="mt-16 text-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-8">
			<p class="text-gray-500 font-bold mb-4">Don't see the tool you use?</p>
			<a href="mailto:support@pictify.io?subject=Integration Request" class="inline-flex items-center gap-2 text-sm font-black text-gray-900 border-b-2 border-gray-900 hover:text-[#ff6b6b] hover:border-[#ff6b6b] transition-colors pb-0.5">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
				Request an Integration
			</a>
		</div>
	</div>
</section>
