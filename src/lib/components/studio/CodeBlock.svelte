<script>
	/**
	 * A read-only snippet, highlighted with the shared press theme.
	 *
	 * Every surface that prints code the user is meant to copy — the studio's
	 * Use it panel, the setup cards, the playground's request pane — renders
	 * through this, so the palette is defined once and a `{{token}}` is the
	 * same pink everywhere it appears.
	 *
	 * `code` is escaped inside highlightToHtml before any markup is added, so
	 * a snippet containing HTML cannot inject into the page.
	 */
	import { highlightToHtml, PRESS } from '$lib/utils/press-highlight.js';
	import { copyToClipboard } from '$lib/utils/format.js';

	export let code = '';
	/** Copied instead of `code` — lets a pane show a masked key but copy the real one. */
	export let copyValue = null;
	export let copyLabel = 'Copy';
	export let showCopy = true;
	/** Tailwind max-height class for the scroll area. */
	export let maxHeight = 'max-h-[220px]';

	$: html = highlightToHtml(code);
</script>

<div class="flex flex-col gap-2 rounded-tile p-3.5" style="background-color: {PRESS.bg}">
	<pre
		class="{maxHeight} overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-[17px]"
		style="color: {PRESS.text}">{@html html}</pre>
	{#if showCopy}
		<button
			type="button"
			on:click={() => copyToClipboard(copyValue ?? code, 'Copied')}
			class="self-end rounded-btn bg-white/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-white hover:bg-white/20"
		>
			{copyLabel}
		</button>
	{/if}
</div>
