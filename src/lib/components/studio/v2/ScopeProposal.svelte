<script>
	/**
	 * The wider-scope proposal. AI-2 (board AN-02).
	 *
	 * Shown when a result reached outside the selection. NOTHING WAS APPLIED and
	 * nothing was charged — both facts are on the card, because a refusal a
	 * buyer understands is one they accept, and one they do not understand reads
	 * as the product failing.
	 *
	 * A question with two buttons, per the layout pass: no explanatory
	 * paragraph, and the safe answer is not the primary. "Apply" makes a new
	 * revision, so it is undoable; "Not now" leaves the design exactly as it is.
	 */
	import { createEventDispatcher } from 'svelte';

	/** `{ touches, reason, selection, charged, candidateRevision }` */
	export let proposal = null;
	export let busy = false;

	const dispatch = createEventDispatcher();

	/** A question, not a statement — the buyer is being asked something. */
	$: question = proposal?.touches?.length
		? `Also change ${proposal.touches.slice(0, 2).join(' and ')}?`
		: 'Widen this change?';
</script>

{#if proposal}
	<div class="border border-brand-rule bg-brand-subtle p-3.5">
		<p class="flex items-start gap-2.5">
			<span
				class="mt-1.5 block h-2 w-2 flex-shrink-0 border border-brand-ink bg-brand-field"
				aria-hidden="true"
			/>
			<span class="font-sans text-[13.5px] font-medium leading-[19px] text-brand-ink"
				>{question}</span
			>
		</p>
		<p class="mt-1 pl-[18px] font-sans text-[12.5px] leading-[18px] text-brand-slate">
			{proposal.reason}
		</p>

		<p class="mt-3 flex items-center gap-2.5 pl-[18px]">
			<button
				type="button"
				on:click={() => dispatch('apply')}
				disabled={busy}
				class="h-8 border border-brand-ink bg-white px-3 font-sans text-[12.5px] font-semibold text-brand-ink disabled:border-brand-rule disabled:text-brand-mute"
			>
				{busy ? 'Applying…' : `Apply · rev ${proposal.candidateRevision}`}
			</button>
			<button
				type="button"
				on:click={() => dispatch('dismiss')}
				disabled={busy}
				class="h-8 px-1 font-sans text-[12.5px] text-brand-slate disabled:text-brand-mute"
				>Not now</button
			>
		</p>

		{#if proposal.charged === false}
			<!-- Stated, never implied. This is the difference between a refusal a
			     buyer accepts and one they resent. -->
			<p class="mt-2 pl-[18px] font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
				Not charged
			</p>
		{/if}
	</div>
{/if}
