<script>
	/**
	 * Plain text, with bare `{{tokens}}` picked out in pink.
	 *
	 * Only splits a LEAF text token. marked gives a text token child `tokens`
	 * when it contains inline formatting, and in that case the slot already
	 * holds correctly-rendered children — splitting `text` ourselves would flatten
	 * the bold out of "**set {{name}} first**". `text === raw` is the leaf test;
	 * anything else falls through to the slot untouched.
	 */
	export let text = '';
	export let raw = '';

	const TOKEN = /(\{\{[^}\n]*\}\})/g;

	$: leaf = text === raw;
	$: parts = leaf && text.includes('{{') ? String(text).split(TOKEN).filter(Boolean) : null;
</script>

{#if parts}
	{#each parts as part, i (i)}
		{#if /^\{\{[^}\n]*\}\}$/.test(part)}
			<code class="font-mono text-[0.9em] font-medium text-brand-pink">{part}</code>
		{:else}
			{part}
		{/if}
	{/each}
{:else}
	<slot />
{/if}
