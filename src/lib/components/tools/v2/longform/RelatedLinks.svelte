<script>
	/**
	 * A mono link list for a longform section (comparisons, guides). It began
	 * as the page-footer "Also on the counter" block; that block was folded into
	 * the RelatedToolCards strip, so the footer form is no longer rendered.
	 *
	 * The eyebrow is a <p>, not a heading: these pages' heading outlines are
	 * frozen for search and this block is the shell's furniture, not the page's
	 * content.
	 */
	import { analytics } from '$lib/telemetry.js';

	/** [{ href, label }] — hrefs and anchor text carry over verbatim. */
	export let links = [];
	export let toolName = '';
	export let eyebrow = 'RELATED';
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
