<script>
	/**
	 * Shared closing block for every /solutions/* page.
	 *
	 * Single source of truth for the cluster positioning and the CTAs: changing
	 * the pitch here updates the whole cluster. The headline is a real H2 and
	 * the six differentiators are real H3s — they are in the live outline of
	 * every guide, so they stay headings in the v2 skin.
	 *
	 * Consumer can pass a custom headline/kicker per page or fall back to defaults.
	 */
	import { analytics } from '$lib/telemetry.js';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import FeatureGrid from '$lib/components/tools/v2/longform/FeatureGrid.svelte';

	export let headline = 'Every row rendered. Every run provable.';
	export let kicker = 'Documents & Videos, at Scale';
	export let toolName = 'solution';
	/** Set to true on the pillar page to hide the "Back to the pillar guide" link. */
	export let isPillar = false;
	/** Section number beside the headline. */
	export let index = '';

	const differentiators = [
		{
			title: 'The run is the unit of work',
			body: 'A CSV upload or a signed webhook in, one rendered document per row out. Not a design tool you drive by hand, once per person.'
		},
		{
			title: 'Per-row proof',
			body: 'Every row reports its own status and its own output URL. A row that fails is re-run on its own, without repeating the batch.'
		},
		{
			title: 'One engine, every deliverable',
			body: 'Certificates, badges, tickets, reports, personalized video. The same template and data contract renders PNG, PDF, GIF, and MP4.'
		},
		{
			title: 'Real expression engine',
			body: '{{ price * 0.9 | currency }} is a first-class template feature. Conditionals, filters, loops: logic lives in the template, not your backend.'
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

<LongformSection {index} id="why-pictify" title={headline}>
	<p class="font-mono text-xs uppercase tracking-[0.06em] text-brand-blue">{kicker}</p>

	<FeatureGrid items={differentiators} columns={3} titleTag="h3" />

	<div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
		<a
			href="/signup"
			on:click={() => trackClick('get_api_key')}
			class="w-max rounded-lg bg-brand-ink px-6 py-3.5 font-sans text-[15px] font-semibold text-white shadow-[3px_3px_0_0_#FF48B0] transition-opacity hover:opacity-90"
		>
			Get API Key
		</a>
		<a
			href="https://docs.pictify.io"
			target="_blank"
			rel="noopener noreferrer"
			on:click={() => trackClick('read_docs')}
			class="w-max rounded-lg border-[1.5px] border-brand-ink bg-brand-paper px-6 py-3.5 font-sans text-[15px] font-semibold text-brand-ink transition-colors hover:bg-brand-subtle"
		>
			Read API Docs
		</a>
	</div>

	{#if !isPillar}
		<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
			Prefer to see it first?
			<a
				href="/tools/certificate-generator"
				on:click={() => trackClick('back_to_pillar')}
				class="font-semibold text-brand-ink underline underline-offset-4"
				>Generate a certificate in your browser →</a
			>
		</p>
	{/if}
</LongformSection>
