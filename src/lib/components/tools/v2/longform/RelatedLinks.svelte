<script>
	/**
	 * The footer internal-link block — the v2 replacement for RelatedTools,
	 * which shipped v1 brutalist chrome directly under the v2 art cards so
	 * seven routes showed two related-tools blocks in two design languages.
	 *
	 * The eyebrow is a <p>, not a heading: these pages' heading outlines are
	 * frozen for search and this block is the shell's furniture, not the page's
	 * content.
	 */
	import { analytics } from '$lib/telemetry.js';

	/** [{ href, label }] — hrefs and anchor text carry over verbatim. */
	export let links = [];
	export let toolName = '';
	export let eyebrow = 'ALSO ON THE COUNTER';
	/**
	 * Inside a LongformSection rather than under the page: drops the page gutter
	 * and top margin, since the section already provides both.
	 */
	export let inline = false;

	function track(target) {
		analytics.track('related_tool_click', { tool_name: toolName, target });
	}
</script>

{#if links.length}
	<svelte:element
		this={inline ? 'div' : 'section'}
		class={inline ? '' : 'mx-auto mt-16 w-full max-w-page px-5 lg:px-10'}
	>
		<div class={inline ? '' : 'border-t border-brand-rule pt-6'}>
			<p class="font-mono text-xs tracking-[0.06em] text-brand-mute">{eyebrow}</p>
			<ul class="mt-4 flex flex-wrap gap-x-6 gap-y-2.5">
				{#each links as link (link.href)}
					<li>
						<a
							href={link.href}
							on:click={() => track(link.href)}
							class="font-mono text-xs tracking-[0.06em] text-brand-royal underline-offset-4 hover:underline"
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</svelte:element>
{/if}
