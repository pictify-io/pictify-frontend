<script>
	/**
	 * The 40 px format stamp. HB-01 (`M1M-0`).
	 *
	 * Replaces per-tool art everywhere a tool is listed. Eighteen tools needed
	 * eighteen drawings and the next twenty would need twenty more; a stamp is
	 * generated from `outputs[0]`, so a new registry entry needs no asset at
	 * all. The colour is the wayfinding: PDF rows read as pink down the page
	 * without anyone reading a word.
	 */
	import { STAMP_BG } from '$lib/pseo/tool-cards.js';

	/** The tool's output formats; the first one is stamped. */
	export let outputs = [];

	$: format = outputs?.[0] || 'PNG';
</script>

<span
	class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-brand-ink {STAMP_BG[
		format
	] || STAMP_BG.PNG}"
	aria-hidden="true"
>
	<span class="font-mono text-[10px] font-bold tracking-[0.06em] text-brand-ink">{format}</span>
</span>
