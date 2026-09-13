<script>
	/**
	 * FE-6 — Setup (board `BT7-0`, with the Design section from `H8M-0`).
	 *
	 * What the buyer decides once per campaign, and can revise per period:
	 * the format, the period, the metrics, and the design.
	 *
	 * The old brand block and preset picker are both gone. Presets stopped being
	 * a product surface (studio handoff §5) and brand editing moved into the
	 * studio's Brand rail, so this screen links there instead of duplicating it.
	 *
	 * Saving is EXPLICIT. An autosave here would quietly change the metric
	 * contract under an edition someone else is reviewing, and a metric label is
	 * a claim made to a customer.
	 */
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import DesignSection from '$lib/components/campaigns/DesignSection.svelte';
	import { editionUrl } from '$lib/campaigns/nav';
	import { updateCampaign, campaignError } from '../../../../../../../api/campaign';
	import { campaignSetupStarted } from '$lib/campaigns/analytics';

	const { edition, campaign, reload } = getContext('edition');

	$: campaignUid = $page.params.campaignUid;
	$: editionUid = $page.params.editionUid;

	let busy = false;
	let error = null;
	let draft = null;

	/** Seeded once from the server, then owned by the form until saved. */
	$: if ($campaign && !draft) {
		draft = {
			format: $campaign.format,
			formatDetail: $campaign.formatDetail || '',
			cadence: $campaign.cadence || 'Manual',
			locale: $campaign.locale || 'en-US',
			timezone: $campaign.timezone || 'UTC',
			metrics: ($campaign.metrics || []).map((m) => ({ ...m }))
		};
		campaignSetupStarted({ metrics: draft.metrics.length, format: draft.format });
	}

	const FORMATS = [
		{
			key: 'png',
			title: 'Email card',
			body: 'Place it inside your existing message.',
			detail: ['1200 × 800', '1200 × 630']
		},
		{
			key: 'pdf',
			title: 'PDF summary',
			body: 'Attach or share from your own tool.',
			detail: ['A4', 'Letter']
		}
	];

	$: activeFormat = FORMATS.find((f) => f.key === draft?.format) || FORMATS[0];
	/**
	 * Include whatever is already stored, even when it is not one of the offered
	 * sizes. A campaign saved before this list existed showed an EMPTY select,
	 * which reads as "no size chosen" — and saving from that state would have
	 * silently changed the output dimensions of an approved design.
	 */
	/*
	 * Derived from $campaign, NOT from draft.
	 *
	 * `draft` is assigned inside a reactive block that also READS draft, and a
	 * $: statement that both reads and writes the same variable does not
	 * reliably re-run its dependents — sizeOptions computed once while draft was
	 * still undefined and never recomputed, so the stored size never appeared.
	 * The server value has no such cycle.
	 */
	$: storedDetail = $campaign?.formatDetail || '';
	$: sizeOptions =
		storedDetail && !activeFormat.detail.includes(storedDetail)
			? [storedDetail, ...activeFormat.detail]
			: activeFormat.detail;
	/** One to three. More than three stops being a summary and becomes a report. */
	$: canAddMetric = (draft?.metrics?.length || 0) < 3;
	$: canRemoveMetric = (draft?.metrics?.length || 0) > 1;

	function addMetric() {
		draft.metrics = [
			...draft.metrics,
			{
				key: '',
				label: '',
				unit: 'count',
				precision: 0,
				classification: 'observed',
				desiredDirection: 'higher'
			}
		];
	}
	const removeMetric = (i) => (draft.metrics = draft.metrics.filter((_, n) => n !== i));

	/**
	 * An estimated metric without a method note cannot be saved. Publishing an
	 * estimate to a customer without saying how it was produced is the kind of
	 * claim this product exists not to make.
	 */
	$: invalidMetrics = (draft?.metrics || []).filter(
		(m) =>
			!m.key.trim() ||
			!m.label.trim() ||
			(m.classification === 'estimated' && !m.methodNote?.trim())
	);
	$: canSave = draft && invalidMetrics.length === 0 && !busy;

	async function save() {
		busy = true;
		error = null;
		try {
			await updateCampaign(
				campaignUid,
				{
					format: draft.format,
					formatDetail: draft.formatDetail || undefined,
					cadence: draft.cadence,
					locale: draft.locale,
					timezone: draft.timezone,
					metrics: draft.metrics
				},
				$campaign.configVersion
			);
			await reload();
			await goto(editionUrl(campaignUid, editionUid, 'data'));
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = false;
		}
	}

	/** Open the studio in campaign context; "Use this design" returns here. */
	const openStudio = (mode) =>
		goto(
			`/campaign-studio/${
				$campaign.templateRevisionUid
			}?campaign=${campaignUid}&edition=${editionUid}${mode ? `&mode=${mode}` : ''}`
		);
</script>

<div class="min-w-0 flex-1">
	{#if draft}
		<section>
			<h2 class="font-display text-[19px] font-bold text-brand-ink">What gets produced</h2>
			<div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
				{#each FORMATS as format (format.key)}
					<button
						type="button"
						on:click={() => (draft.format = format.key)}
						class="rounded-md border-2 p-4 text-left {draft.format === format.key
							? 'border-brand-ink'
							: 'border-brand-rule'}"
						aria-pressed={draft.format === format.key}
					>
						<span class="flex items-center gap-2.5">
							<span
								class="block h-4 w-4 flex-shrink-0 border-2 {draft.format === format.key
									? 'border-brand-ink bg-brand-ink'
									: 'border-brand-slate'}"
							/>
							<span class="font-sans text-[15px] font-bold text-brand-ink">{format.title}</span>
						</span>
						<span class="mt-1.5 block font-sans text-[13.5px] text-brand-slate">{format.body}</span>
					</button>
				{/each}
			</div>

			<label class="mt-4 flex flex-wrap items-center gap-3">
				<span class="font-sans text-[13.5px] text-brand-slate">Size</span>
				<!--
					value + on:change, NOT bind:value.

					With bind:value, if the stored value is not among the options at
					bind time the browser sets selectedIndex to -1 and the binding
					writes '' STRAIGHT BACK into the model — silently clearing a size
					that was already saved, and taking the "keep the stored value as
					an option" logic down with it because that logic reads the very
					field the binding just emptied. One-way value plus an explicit
					change handler cannot do that.
				-->
				<select
					value={draft.formatDetail}
					on:change={(e) => (draft.formatDetail = e.currentTarget.value)}
					class="h-9 rounded-btn border border-brand-rule bg-white px-2.5 font-mono text-[12.5px] text-brand-ink"
				>
					{#each sizeOptions as option (option)}<option value={option}>{option}</option>{/each}
				</select>
			</label>
		</section>

		<section class="mt-9">
			<div class="flex flex-wrap items-baseline justify-between gap-3">
				<h2 class="font-display text-[19px] font-bold text-brand-ink">Metrics</h2>
				<p class="font-sans text-[13px] text-brand-mute">
					One to three · each one is a claim made to a customer
				</p>
			</div>

			<div class="mt-3 flex flex-col gap-3">
				{#each draft.metrics as metric, i (i)}
					<div class="rounded-md border border-brand-rule p-4">
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<label class="flex flex-col gap-1">
								<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute"
									>Column key</span
								>
								<input
									bind:value={metric.key}
									placeholder="workflows_completed"
									class="h-9 rounded-btn border border-brand-rule px-2.5 font-mono text-[12.5px] text-brand-ink"
								/>
							</label>
							<label class="flex flex-col gap-1">
								<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute"
									>Label the customer sees</span
								>
								<input
									bind:value={metric.label}
									placeholder="Workflows completed"
									class="h-9 rounded-btn border border-brand-rule px-2.5 font-sans text-[13.5px] text-brand-ink"
								/>
							</label>
						</div>

						<div class="mt-3 flex flex-wrap items-center gap-4">
							<label class="flex items-center gap-2">
								<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute"
									>Unit</span
								>
								<input
									bind:value={metric.unit}
									class="h-8 w-[110px] rounded-btn border border-brand-rule px-2 font-mono text-[12px] text-brand-ink"
								/>
							</label>
							<label class="flex items-center gap-2">
								<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute"
									>Decimals</span
								>
								<input
									type="number"
									min="0"
									max="6"
									bind:value={metric.precision}
									class="h-8 w-[64px] rounded-btn border border-brand-rule px-2 font-mono text-[12px] text-brand-ink"
								/>
							</label>
							<!-- Observed vs estimated is not decoration: they are different
							     claims, and the renderer labels them differently. -->
							<span class="flex items-center rounded-btn border border-brand-rule p-0.5">
								{#each ['observed', 'estimated'] as kind (kind)}
									<button
										type="button"
										on:click={() => (metric.classification = kind)}
										class="h-7 rounded-[4px] px-2.5 font-mono text-[10px] uppercase tracking-[0.06em] {metric.classification ===
										kind
											? 'bg-brand-subtle font-semibold text-brand-ink'
											: 'text-brand-slate'}">{kind}</button
									>
								{/each}
							</span>
							{#if canRemoveMetric}
								<button
									type="button"
									on:click={() => removeMetric(i)}
									class="ml-auto font-sans text-[13px] text-brand-mute hover:text-brand-slate hover:underline"
									>Remove</button
								>
							{/if}
						</div>

						{#if metric.classification === 'estimated'}
							<label class="mt-3 flex flex-col gap-1">
								<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute"
									>How it was estimated · shown to the customer</span
								>
								<input
									bind:value={metric.methodNote}
									placeholder="Modelled from average handling time before and after automation."
									class="h-9 rounded-btn border px-2.5 font-sans text-[13.5px] text-brand-ink {metric.methodNote?.trim()
										? 'border-brand-rule'
										: 'border-brand-alarm'}"
								/>
							</label>
						{/if}
					</div>
				{/each}
			</div>

			{#if canAddMetric}
				<button
					type="button"
					on:click={addMetric}
					class="mt-3 font-sans text-[13.5px] text-brand-royal hover:underline">Add a metric</button
				>
			{/if}
		</section>

		<section class="mt-9">
			{#if $edition?.approvalStale}
				<!--
					B05-2. Said here, where the buyer lands after "Use this design", and
					not only on Generate. By the time Generate refuses, they have
					already decided they are sending today.
				-->
				<p
					class="mb-4 flex items-start gap-2.5 border-l-2 border-brand-alarm bg-brand-subtle p-3.5"
				>
					<span class="min-w-0">
						<span class="block font-sans text-[14px] font-medium text-brand-ink"
							>This version needs approving again</span
						>
						<span class="mt-0.5 block font-sans text-[13px] leading-[19px] text-brand-slate">
							The campaign changed after this edition was approved — a new design revision, or a
							change to the metrics. Review and approve it again before generating.
						</span>
					</span>
				</p>
			{/if}

			<DesignSection
				design={$campaign.templateRevisionUid
					? {
							uid: $campaign.templateRevisionUid,
							name: $campaign.designName || 'Campaign design',
							/*
							 * The FROZEN revision once this edition has one, otherwise the
							 * revision the campaign is currently pinned to. Defaulting to 1
							 * printed a number that was true only by coincidence, and the
							 * whole point of showing it is that a buyer can check it.
							 */
							revision: $edition?.snapshotRevision ?? $campaign.templateRevision ?? null,
							width: $edition?.snapshotWidth || 1200,
							height: $edition?.snapshotHeight || 800,
							format: draft.format,
							html: $edition?.snapshotHtml || '',
							savedAt: $campaign.updatedAt
					  }
					: null}
				proof={$edition?.designProof || null}
				fields={$edition?.designFields || null}
				onEdit={() => openStudio()}
				onNewWithAi={() => openStudio('say')}
				onChooseAnother={() => goto('/dashboard/template')}
			/>
		</section>

		{#if error}
			<p class="mt-5">
				<StatusSquare tone="blocked" label={error.message} />
			</p>
		{/if}

		<div
			class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-brand-rule pt-5"
		>
			<p class="font-sans text-[13.5px] text-brand-slate">
				{#if invalidMetrics.length}
					{invalidMetrics.length}
					{invalidMetrics.length === 1 ? 'metric needs' : 'metrics need'} a key, a label and — if estimated
					— a method note.
				{:else}
					Saved when you continue. Nothing is saved as you type.
				{/if}
			</p>
			<button
				type="button"
				on:click={save}
				disabled={!canSave}
				class="flex h-11 items-center gap-2.5 rounded-btn px-4 font-sans text-[13.5px] {canSave
					? 'bg-brand-plum text-white'
					: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}"
			>
				{busy ? 'Saving…' : 'Save and continue'}
				<span
					class="block h-2 w-2 {canSave ? 'bg-brand-field' : 'bg-brand-rule'}"
					aria-hidden="true"
				/>
			</button>
		</div>
	{/if}
</div>

<aside class="w-full flex-shrink-0 xl:w-[340px]">
	<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">This edition</p>
	<dl class="mt-3 border-t border-brand-ink">
		{#each [['Period', $edition?.periodLabel || $edition?.period || '—'], ['Revision', String($edition?.revision ?? 1)], ['Metrics', String(draft?.metrics?.length ?? 0)], ['Locale · timezone', draft ? `${draft.locale} · ${draft.timezone}` : '—']] as [label, value] (label)}
			<div class="flex items-baseline justify-between gap-3 border-b border-brand-rule py-2.5">
				<dt class="font-sans text-[13px] text-brand-slate">{label}</dt>
				<dd class="font-mono text-[11.5px] text-brand-ink">{value}</dd>
			</div>
		{/each}
	</dl>

	<div class="mt-5 rounded-md bg-brand-subtle p-4">
		<p class="font-sans text-[14px] font-bold text-brand-ink">One design per edition</p>
		<p class="mt-1.5 font-sans text-[13px] text-brand-slate">
			The edition freezes the revision it will render. Changing the design afterwards starts a new
			revision and the previous approval no longer applies.
		</p>
	</div>
</aside>
