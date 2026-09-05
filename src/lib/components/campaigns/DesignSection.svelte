<script>
	/**
	 * FE-6 — the Design section of Setup (board `H8M-0`).
	 *
	 * Replaces what used to be the brand block AND the preset picker. Presets
	 * are no longer a product surface: every campaign uses a design made in the
	 * shared studio, and brand editing moved into the studio's Brand rail.
	 *
	 * ONE DESIGN PER EDITION, and the section says so. The three status lines
	 * exist because "ready" on its own is not checkable — a buyer about to send
	 * 248 summaries needs to see which revision, whether the proof matches it,
	 * and whether every field the design uses is actually mapped. Each line is a
	 * claim the server made, not one this component inferred.
	 */
	import StatusSquare from './StatusSquare.svelte';
	import CardPreview from './CardPreview.svelte';

	/** `{ uid, name, revision, width, height, format, html, savedAt, savedBy }` */
	export let design = null;
	/** `{ revision, allSamplesFit, sampleCount }` — null when never proofed. */
	export let proof = null;
	/** `{ used, mapped, brandName }` from the confirmed mapping. */
	export let fields = null;
	export let onEdit = null;
	export let onNewWithAi = null;
	export let onChooseAnother = null;

	/**
	 * Ready means: a saved revision, a proof OF THAT REVISION, and every field
	 * mapped. A proof of an older revision is stale, not ready — the buyer would
	 * be approving a picture of something they have since changed.
	 */
	/*
	 * A design with no recorded revision cannot have a current proof. That is not
	 * pedantry: `revision` is null until a design is pinned, and `undefined ===
	 * undefined` would have called any proof at all a match for it.
	 */
	$: proofCurrent = Boolean(
		proof && design && design.revision != null && proof.revision === design.revision
	);

	/** "rev 4", or "unpinned" when there is no revision to name. */
	$: revLabel = design?.revision != null ? `rev ${design.revision}` : 'no revision pinned';

	/**
	 * Why a proof is not current, as a sentence that only names what is known.
	 *
	 * There are two ways to fail `proofCurrent` and they are not the same
	 * problem. Writing one sentence for both produced "Proof is from rev
	 * undefined; the design is now no revision pinned" — a raw `undefined` in
	 * front of a buyer, inside a clause that had already stopped being English.
	 *
	 * A proof recorded before anything was pinned has no revision to name, and
	 * a design with nothing pinned has no revision to compare against. In both
	 * cases the honest sentence says what to DO, and names a revision only when
	 * there is one.
	 */
	$: staleProofReason =
		design?.revision == null
			? 'The design has no pinned revision yet. Pin one and re-proof before approving.'
			: proof?.revision == null
			? `This proof predates ${revLabel}. Re-proof before approving.`
			: `Proof is from rev ${proof.revision}; the design is now ${revLabel}. Re-proof before approving.`;
	$: fieldsResolved = Boolean(fields && fields.used > 0 && fields.used === fields.mapped);
	$: ready = Boolean(design) && proofCurrent && fieldsResolved;

	const time = (d) =>
		d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
</script>

<section>
	<div class="flex flex-wrap items-baseline justify-between gap-3">
		<h2 class="font-display text-[19px] font-bold text-brand-ink">Design</h2>
		<p class="font-sans text-[13px] text-brand-mute">Made in the studio · one design per edition</p>
	</div>

	<div class="mt-3 rounded-md border border-brand-rule p-5">
		{#if !design}
			<p class="font-sans text-[14px] text-brand-slate">
				No design yet. Start one in the studio — describe what you want, or begin from a starter and
				edit it.
			</p>
			<div class="mt-4 flex flex-wrap items-center gap-3">
				<button
					type="button"
					on:click={onNewWithAi}
					class="flex h-11 items-center gap-2.5 rounded-btn bg-brand-plum px-4 font-sans text-[13.5px] text-white"
				>
					Create with AI
					<span class="block h-2 w-2 bg-brand-field" aria-hidden="true" />
				</button>
				<button
					type="button"
					on:click={onChooseAnother}
					class="flex h-11 items-center rounded-btn border border-brand-rule px-4 font-sans text-[13.5px] text-brand-slate"
					>Choose existing</button
				>
			</div>
		{:else}
			<div class="flex flex-wrap gap-6">
				<div class="flex-shrink-0">
					<!-- The real markup at the real revision, sandboxed. -->
					<CardPreview
						html={design.html}
						width={design.width}
						height={design.height}
						displayWidth={186}
					/>
				</div>

				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<h3 class="font-sans text-[16px] font-bold text-brand-ink">{design.name}</h3>
						<!-- Revision is stated in the badge because every downstream
						     screen names it too, and they must agree. -->
						<span
							class="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] {ready
								? 'bg-brand-proof text-white'
								: 'bg-brand-field text-brand-ink'}"
						>
							{ready ? 'Ready' : 'Not ready'} · {revLabel}
						</span>
					</div>

					<div class="mt-2.5 flex flex-col gap-1.5">
						<StatusSquare
							tone="ready"
							label={`${design.format?.toUpperCase()} · ${design.width} × ${
								design.height
							} · ${revLabel} saved ${time(design.savedAt)}${
								design.savedBy ? ` by ${design.savedBy}` : ''
							}`}
						/>
						{#if proofCurrent}
							<StatusSquare
								tone={proof.allSamplesFit ? 'ready' : 'blocked'}
								label={proof.allSamplesFit
									? `Proof rendered from rev ${proof.revision} · all ${proof.sampleCount} samples fit`
									: `Proof rendered from rev ${proof.revision} · text overflows on ${proof.overflowCount} of ${proof.sampleCount}`}
							/>
						{:else if proof}
							<!-- Stale, not missing. Naming the two revisions is what makes
							     it actionable rather than alarming. -->
							<StatusSquare tone="blocked" label={staleProofReason} />
						{:else}
							<StatusSquare tone="current" label="Not proofed yet · render one before approving" />
						{/if}
						{#if fields}
							<StatusSquare
								tone={fieldsResolved ? 'ready' : 'blocked'}
								label={fieldsResolved
									? `Uses ${fields.used} fields · all mapped above${
											fields.brandName ? ` · brand: ${fields.brandName}` : ''
									  }`
									: `Uses ${fields.used} fields · ${fields.used - fields.mapped} not mapped yet`}
							/>
						{/if}
					</div>

					<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
						<div class="flex flex-wrap items-center gap-3">
							<button
								type="button"
								on:click={onEdit}
								class="flex h-10 items-center rounded-btn border-2 border-brand-ink px-3.5 font-sans text-[13.5px] font-semibold text-brand-ink"
								>Edit design</button
							>
							<button
								type="button"
								on:click={onNewWithAi}
								class="flex h-10 items-center rounded-btn border border-brand-rule px-3.5 font-sans text-[13.5px] text-brand-slate"
								>New with AI</button
							>
							<button
								type="button"
								on:click={onChooseAnother}
								class="flex h-10 items-center rounded-btn border border-brand-rule px-3.5 font-sans text-[13.5px] text-brand-slate"
								>Choose another</button
							>
						</div>
						<!-- Brand editing lives in the studio now, not here. -->
						<button
							type="button"
							on:click={onEdit}
							class="font-sans text-[13.5px] text-brand-royal hover:underline"
							>Brand settings</button
						>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>
