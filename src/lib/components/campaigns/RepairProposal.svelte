<script>
	/**
	 * The repair proposal. AI-4 (board I30-0), the card under the checks list.
	 *
	 * A check that only reports is half a feature: the buyer is told the longest
	 * name does not fit and left to work out what size would. This card answers
	 * it, and every number on it is one the server measured.
	 *
	 * WHAT THIS CARD MAY SAY, and the rules are the rail's rules:
	 *
	 *   No score, no percentage, no confidence. A number here is a count of
	 *   fixtures that were rendered, or of accounts a rule ran on, and it always
	 *   travels with its total.
	 *   The proposal changes the DESIGN, never the data. "Make it fit" must
	 *   never come to mean "shorten the customer's name".
	 *   A claim needs a measurement. When the server could not prove something
	 *   it withholds the whole proposal rather than showing a caveated one, so
	 *   there is no "probably fine" state to render here.
	 *
	 * NOTHING IS APPLIED UNTIL THE BUYER PRESSES APPLY. The previews are
	 * rendered on synthetic names, never a customer's — a screenshot of a real
	 * account's card is customer data, and what stresses a text box is a length,
	 * which can be invented.
	 */
	import { createEventDispatcher } from 'svelte';
	import StatusSquare from './StatusSquare.svelte';

	/** The `POST …/review/:issueId/propose` response, or null before it runs. */
	export let proposal = null;
	export let loading = false;
	/** Set while Apply is in flight, so the buyer cannot fire it twice. */
	export let applying = false;
	/**
	 * Set when a previous Apply hit a revision conflict. The card STAYS on
	 * screen carrying this — a proposal that vanished on conflict would make a
	 * failure look like a successful dismissal.
	 */
	export let conflict = false;

	const dispatch = createEventDispatcher();

	$: applicable = proposal?.applicable === true;
	$: copy = proposal?.copy || null;
	$: recheck = proposal?.recheck || null;
	$: fixtures = proposal?.fixtures || null;
	$: appliesTo = proposal?.appliesTo || null;

	/*
	 * "0 overflow" and "we did not look" are different facts, and the vocabulary
	 * exists to keep them apart. The evidence line is only rendered when the
	 * server actually returned a re-check.
	 */
	$: evidence =
		recheck && fixtures
			? `Tested on ${fixtures.tested} stress fixtures · Re-checked all ${recheck.accounts} · ${recheck.remaining} overflow`
			: null;
	$: proven = recheck ? recheck.remaining === 0 : false;
</script>

<section aria-label="Suggested repair" class="mt-4 border-t border-brand-ink pt-3">
	{#if loading}
		<p class="font-sans text-[13px] text-brand-mute">Measuring a repair…</p>
	{:else if !proposal}
		<!-- Nothing asked for yet. Not "no repair needed" — that is a result. -->
		<button
			type="button"
			on:click={() => dispatch('propose')}
			class="font-sans text-[12.5px] font-medium text-brand-blue hover:underline"
		>
			Suggest a repair
		</button>
	{:else if !applicable}
		<!--
			An answer, not an error. Each reason sends the buyer somewhere
			different — to the studio, to the size of the box, or nowhere — so the
			server's sentence is shown rather than a generic failure.
		-->
		<p class="font-sans text-[13px] leading-[19px] text-brand-ink">No repair to suggest</p>
		<p class="mt-1 font-sans text-[12.5px] leading-[18px] text-brand-slate">
			{proposal.detail || 'This check cannot be repaired automatically.'}
		</p>
	{:else}
		<div class="border border-brand-rule p-3">
			<!-- Title: reads like the studio's edit receipt, "72 → 56 px", so the
			     number is legible as a measurement and not as a constant. -->
			<p class="font-sans text-[13.5px] font-semibold leading-[19px] text-brand-ink">
				{copy.title}
			</p>
			<p class="mt-1 font-sans text-[12.5px] leading-[18px] text-brand-slate">
				{copy.detail}
			</p>

			<!-- NOW and AFTER, on the same synthetic name, so the pair differs by
			     the patch alone rather than by the data underneath it. -->
			{#if proposal.previewBefore && proposal.previewAfter}
				<div class="mt-3 grid grid-cols-2 gap-2">
					<figure class="m-0">
						<figcaption
							class="pb-1 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute"
						>
							Now · clips
						</figcaption>
						<img
							src={proposal.previewBefore}
							alt="The name clipping at the current size"
							class="block w-full border border-brand-rule"
						/>
					</figure>
					<figure class="m-0">
						<figcaption
							class="pb-1 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute"
						>
							After · fits
						</figcaption>
						<img
							src={proposal.previewAfter}
							alt="The same name fitting at the proposed size"
							class="block w-full border border-brand-ink"
						/>
					</figure>
				</div>
			{/if}

			{#if evidence}
				<p class="mt-3">
					<StatusSquare tone={proven ? 'ready' : 'current'} label={evidence} />
				</p>
			{/if}

			{#if conflict}
				<!--
					The buyer asked for something and it did not happen. The studio's
					own conflict dialog owns explaining who moved the design; this line
					says what is now unapplied, so the failure cannot read as a
					dismissal. The measurement is NOT silently re-run against the new
					revision: a design that moved may not need this repair, or any.
				-->
				<p class="mt-3 border-t border-brand-rule pt-2">
					<StatusSquare
						tone="blocked"
						label="Not applied — the design moved while this was measured. Suggest a repair again to measure the current one."
					/>
				</p>
			{/if}

			<div class="mt-3 flex flex-wrap items-center gap-3">
				<button
					type="button"
					disabled={applying}
					on:click={() => dispatch('apply')}
					class="rounded-btn bg-brand-ink px-3.5 py-2 font-sans text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
				>
					{applying ? 'Applying…' : `Apply · rev ${proposal.baseRevision + 1}`}
				</button>
				<button
					type="button"
					on:click={() => dispatch('studio')}
					class="font-sans text-[12.5px] font-medium text-brand-blue hover:underline"
				>
					Open in studio
				</button>
				<button
					type="button"
					on:click={() => dispatch('dismiss')}
					class="font-sans text-[12.5px] font-medium text-brand-mute hover:text-brand-ink hover:underline"
				>
					Dismiss
				</button>
			</div>

			<!--
				Only when applying would NOT reach the edition on screen. A draft
				edition moves with the campaign, so there is nothing to say and
				saying it anyway would be noise explaining a non-event.
			-->
			{#if appliesTo?.repinRequired && appliesTo?.note}
				<p class="mt-2 font-sans text-[12px] leading-[17px] text-brand-mute">
					{appliesTo.note}
				</p>
			{/if}
		</div>
	{/if}
</section>
