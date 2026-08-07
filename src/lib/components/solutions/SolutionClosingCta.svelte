<script>
	/**
	 * Shared closing CTA block for every /solutions/* page.
	 *
	 * Single source of truth for the delivery-wedge positioning and the CTAs.
	 * Changing the pitch once here updates the whole cluster.
	 *
	 * Consumer can pass a custom headline/kicker per page or fall back to defaults.
	 */
	import { analytics } from '$lib/analytics.js';

	export let headline = 'Every row rendered. Every recipient reached. Provable.';
	export let kicker = 'Documents & Videos, Delivered';
	export let toolName = 'solution';
	/** Set to true on the pillar page to hide the "Back to the pillar guide" link. */
	export let isPillar = false;

	const differentiators = [
		{
			title: 'Delivery is part of the run',
			body: 'Every row renders AND emails to its recipient from an isolated sending domain. Your job ends at delivered, not downloaded.'
		},
		{
			title: 'Per-row proof',
			body: 'Sent, delivered, bounced, complained — per person, via real ESP webhooks. A bounce is a one-click re-send with a corrected address.'
		},
		{
			title: 'One engine, every deliverable',
			body: 'Certificates, badges, tickets, reports, personalized video — the same template and data contract renders PNG, PDF, GIF, and MP4.'
		},
		{
			title: 'Real expression engine',
			body: '{{ price * 0.9 | currency }} is a first-class template feature. Conditionals, filters, loops — logic lives in the template, not your backend.'
		},
		{
			title: 'Wizard + API + agents',
			body: 'Organizers run the wizard. Developers sign a webhook. AI agents author templates over MCP. Same template, same run history.'
		},
		{
			title: 'AI Template Maker',
			body: 'Describe the document or video and get an editable HTML-native template with your brand and variables in place.'
		}
	];

	function trackClick(cta) {
		analytics.track?.('solution_cta_click', { tool_name: toolName, cta });
	}
</script>

<section class="mt-20">
	<div class="max-w-5xl mx-auto">
		<div class="text-center mb-10">
			<div
				class="inline-block bg-white border-[3px] border-gray-900 shadow-brutal-lg px-4 py-1 mb-6 transform rotate-1 rounded-lg"
			>
				<span class="font-black uppercase tracking-widest text-sm">{kicker}</span>
			</div>
			<h2
				class="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter max-w-3xl mx-auto leading-tight"
			>
				{headline}
			</h2>
		</div>

		<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
			{#each differentiators as d}
				<div
					class="bg-white border-[3px] border-gray-900 rounded-xl shadow-brutal-lg p-5"
				>
					<h3 class="font-black text-gray-900 mb-2 text-lg">{d.title}</h3>
					<p class="text-gray-700 leading-relaxed text-sm">{d.body}</p>
				</div>
			{/each}
		</div>

		<div class="text-center">
			<div class="flex flex-wrap justify-center gap-4">
				<a
					href="/signup"
					on:click={() => trackClick('get_api_key')}
					class="px-8 py-4 bg-gray-900 text-white font-black border-[3px] border-gray-900 rounded-xl uppercase tracking-widest shadow-brutal-lg hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					Get API Key
				</a>
				<a
					href="https://docs.pictify.io"
					target="_blank"
					rel="noopener noreferrer"
					on:click={() => trackClick('read_docs')}
					class="px-8 py-4 bg-white text-gray-900 font-black border-[3px] border-gray-900 rounded-xl uppercase tracking-widest shadow-brutal-lg hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					Read API Docs
				</a>
			</div>
			{#if !isPillar}
				<p class="mt-6 text-sm text-gray-600 font-medium">
					Prefer to see it first?
					<a
						href="/tools/certificate-generator"
						on:click={() => trackClick('back_to_pillar')}
						class="underline font-black text-gray-900 hover:text-brand-danger transition-colors"
					>Generate a certificate in your browser →</a>
				</p>
			{/if}
		</div>
	</div>
</section>
