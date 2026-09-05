<script>
	/**
	 * What left the tenant, above the instruction that sent it. AI-6 state A1.
	 *
	 * FIXED STRINGS, ASSEMBLED FROM COUNTS — never generated, and never a
	 * summary. That is locked decision 2, and the reason is that this line is a
	 * claim about a data transfer written by the thing that made the transfer:
	 * if it were phrased by a model, or summarised from whatever happened to be
	 * in the request, it would be exactly as trustworthy as the thing it is
	 * there to make trustworthy.
	 *
	 * So the caller passes FACTS — a brand revision, a number of field names —
	 * and this component only arranges them. It cannot say "and some other
	 * things", because there is no slot for that.
	 *
	 * The negative is stated as loudly as the positive. "no rows" and "no names
	 * or values" are the part a buyer actually wants, and a list that only
	 * enumerates what WAS sent leaves them to infer the rest.
	 */

	/** Fact strings, in order. Each is a phrase, never a sentence. */
	export let sends = [];
	/** What was NOT sent. Rendered in the same line, after a separator. */
	export let withheld = [];
</script>

{#if sends.length || withheld.length}
	<p class="flex flex-wrap items-baseline gap-x-2 gap-y-1 bg-brand-subtle px-2.5 py-1.5">
		<span class="font-mono text-[9.5px] uppercase tracking-[0.08em] text-brand-mute">Using</span>
		<span class="font-mono text-[10.5px] leading-[15px] text-brand-slate">
			{sends.join(' · ')}{sends.length && withheld.length ? ' · ' : ''}<span class="text-brand-ink"
				>{withheld.join(' · ')}</span
			>
		</span>
	</p>
{/if}
