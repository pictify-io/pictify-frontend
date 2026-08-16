<script>
	/**
	 * Inline code. A `{{token}}` gets the pink it has everywhere else in the
	 * product — the studio editor, the Use it snippet, a Remotion schema field.
	 * It means the same thing in all four places: something a caller fills in.
	 */
	export let raw = '';
	$: value = raw.replace(/`/g, '');
	$: isToken = /^\{\{[^}]*\}\}$/.test(value.trim());
</script>

{#if isToken}
	<code class="rounded-[3px] bg-brand-rose/40 px-1 py-0.5 font-mono text-[0.88em] font-medium text-brand-pink"
		>{value}</code
	>
{:else}
	<code
		class="rounded-[3px] border border-brand-rule bg-brand-subtle px-1.5 py-0.5 font-mono text-[0.86em] text-brand-ink"
		>{value}</code
	>
{/if}
