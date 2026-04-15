<script>
	/**
	 * Shared closing CTA block for every /solutions/* page.
	 *
	 * Single source of truth for the "Programmable Image Engine" positioning, the
	 * six differentiators vs Bannerbear/Placid/Orshot, and the Get API Key + Read
	 * Docs CTAs. Changing the pitch once here updates all 11 pages in the cluster.
	 *
	 * Consumer can pass a custom headline/kicker per page or fall back to defaults.
	 *
	 * See plan: docs/plans/2026-04-15-003-strategy-automated-images-cluster-plan.md
	 */
	import { analytics } from '$lib/analytics.js';

	export let headline = 'One API. Templates with logic. Rendering at scale.';
	export let kicker = 'The Programmable Image Engine';
	export let toolName = 'solution';
	/** Set to true on the pillar page to hide the "Back to the pillar guide" link. */
	export let isPillar = false;

	const differentiators = [
		{
			title: 'Real expression engine',
			body: '{{ price * 0.9 | currency }} is a first-class template feature — not a string you pre-format in your backend. Conditionals, filters, nested lookups, all built in.'
		},
		{
			title: 'Live data bindings',
			body: 'Templates connect to HTTP endpoints, webhooks, or static JSON. Images update when data updates. Nothing else in the category ships this.'
		},
		{
			title: 'API + no-code, same product',
			body: 'Designers build templates in a visual canvas. Engineers call one endpoint. No hand-off, no context switch, no rebuild.'
		},
		{
			title: 'A/B experiments on images',
			body: 'Ship variants of a template, track impressions and conversions per variant, declare a winner — all from the same API that renders the image.'
		},
		{
			title: 'One API, many outputs',
			body: 'PNG, JPEG, WebP, multi-page PDF, GIF. Same template, different fileExtension. No separate service for each format.'
		},
		{
			title: 'Agentic AI copilot',
			body: '"Make a dark-mode variant," "resize this for Instagram Story," "generate five backgrounds." The copilot edits templates step by step, not as a single-shot generator.'
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
				class="inline-block bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform rotate-1 rounded-lg"
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
					class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5"
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
					class="px-8 py-4 bg-gray-900 text-white font-black border-[3px] border-gray-900 rounded-xl uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					Get API Key
				</a>
				<a
					href="https://docs.pictify.io"
					target="_blank"
					rel="noopener noreferrer"
					on:click={() => trackClick('read_docs')}
					class="px-8 py-4 bg-white text-gray-900 font-black border-[3px] border-gray-900 rounded-xl uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					Read API Docs
				</a>
			</div>
			{#if !isPillar}
				<p class="mt-6 text-sm text-gray-600 font-medium">
					Looking for the bigger picture?
					<a
						href="/solutions/automated-image-generation"
						on:click={() => trackClick('back_to_pillar')}
						class="underline font-black text-gray-900 hover:text-[#ff6b6b] transition-colors"
					>Read the automated image generation guide →</a>
				</p>
			{/if}
		</div>
	</div>
</section>
