<script>
	/**
	 * FE-9 — Data (board `BZH-0`, spec D04).
	 *
	 * Upload, then map columns. The mapping is the dangerous part: a column
	 * pointed at the wrong destination sends one customer another customer's
	 * figures, and nothing downstream would catch it. So suggestions are never
	 * applied on the buyer's behalf — each one has to be confirmed, and the
	 * primary stays disabled while any are outstanding.
	 *
	 * Unmapped columns are named on screen and discarded server-side at parse
	 * time. Saying which columns are ignored matters more than it looks: a
	 * buyer's export usually carries contact emails and contract values, and
	 * they need to see us not keeping them.
	 */
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import { LIMITS } from '$lib/campaigns/csv';
	import { editionUrl } from '$lib/campaigns/nav';
	import {
		uploadEditionData,
		updateEdition,
		validateEdition,
		suggestMapping,
		campaignError
	} from '../../../../../../../api/campaign';
	import { campaignDataValidated } from '$lib/campaigns/analytics';

	const { edition, campaign, reload } = getContext('edition');

	$: campaignUid = $page.params.campaignUid;
	$: editionUid = $page.params.editionUid;

	let uploading = false;
	let validating = false;
	let uploadError = null;
	let upload = null;
	/** `{ sourceHeader: destinationKey | '' }` */
	let mapping = {};
	/** Headers whose destination was suggested and not yet confirmed by a human. */
	let unconfirmed = new Set();

	/* ----------------------------------------------------------- AI-3 */

	/**
	 * Consent for column-name suggestions.
	 *
	 * `null` is "not asked yet", and it is the only state that shows the
	 * choice. The rules have already run by then, so declining costs the buyer
	 * the leftovers and not the mapping — which is the difference between a
	 * choice and a toll gate.
	 */
	let mappingConsent = null;
	let suggesting = false;
	let mappingError = null;
	/** `{ [header]: sentence }` — why a destination was suggested, or why none. */
	let why = {};
	let unresolved = new Set();
	let sent = null;
	let suggestedByAi = 0;

	/** Columns no local rule could place. The only ones ever sent. */
	$: unmatchedHeaders = (upload?.header || []).filter((h) => !mapping[h] && !unresolved.has(h));

	async function askForSuggestions() {
		if (suggesting) return;
		suggesting = true;
		mappingError = null;
		try {
			/*
			 * Names and TYPES only — assembled here rather than passing the upload
			 * through, so the request cannot pick up a sample value by accident.
			 * The strip promises this; this line is where the promise is kept.
			 */
			const headers = unmatchedHeaders.map((name) => ({
				name,
				type: typeOf(name)
			}));
			const res = await suggestMapping(campaignUid, editionUid, headers);
			if (!res?.suggestions) throw new Error('no suggestions');

			sent = res.sent;
			suggestedByAi = res.suggestions.filter((r) => r.source === 'ai').length;

			for (const row of res.suggestions) {
				if (row.why) why[row.header] = row.why;
				if (row.state === 'unresolved') unresolved.add(row.header);
				if (row.state === 'suggested' && row.field && !mapping[row.header]) {
					mapping[row.header] = row.field;
					// Suggested, never adopted: the buyer confirms each one, exactly as
					// they do for a rule's suggestion.
					unconfirmed.add(row.header);
				}
			}
			why = why;
			unresolved = unresolved;
			mapping = mapping;
			unconfirmed = unconfirmed;
			mappingConsent = true;
		} catch (err) {
			mappingError = campaignError(err).message;
			// Consent stays unasked, so the buyer can try again or map by hand.
			mappingConsent = null;
		} finally {
			suggesting = false;
		}
	}

	/**
	 * The type of a column, from the values already parsed in the browser.
	 *
	 * Derived from the sample rather than declared by the server, because it is
	 * the only thing about the data that travels — so it is worth being right,
	 * and worth being computed where the data already is.
	 */
	function typeOf(header) {
		const sample = String(sampleFor(header) ?? '').trim();
		if (!sample) return 'unknown';
		if (/^-?\d+(\.\d+)?$/.test(sample)) return 'number';
		if (/^\d{4}-\d{2}(-\d{2})?$/.test(sample)) return 'date';
		return 'text';
	}

	/**
	 * Destinations come from the campaign's metric contract, not from the file.
	 * The buyer maps their columns onto what the design actually renders; a
	 * column with no destination is not data we have any use for.
	 */
	$: destinations = [
		{ key: 'account_id', label: 'external_account_id', type: 'string', required: true },
		{ key: 'account_name', label: 'account_name', type: 'text', required: true },
		...($campaign?.metrics || []).map((m) => ({
			key: m.key,
			label: m.key,
			type: m.unit === 'count' ? 'number' : 'decimal',
			required: true
		}))
	];

	$: mappedCount = Object.values(mapping).filter(Boolean).length;
	$: ignoredHeaders = (upload?.header || []).filter((h) => !mapping[h]);
	$: outstanding = (upload?.header || []).filter((h) => mapping[h] && unconfirmed.has(h));
	$: requiredMissing = destinations
		.filter((d) => d.required)
		.filter((d) => !Object.values(mapping).includes(d.key));
	$: canValidate =
		Boolean(upload) && outstanding.length === 0 && requiredMissing.length === 0 && !validating;

	/**
	 * Suggest a destination for a header, but never adopt it silently.
	 *
	 * Matching is deliberately conservative — exact key, then the campaign's own
	 * metric labels. A fuzzy match that guessed `wf_done_aug` onto this month's
	 * metric would be right often enough to be trusted and wrong often enough to
	 * publish last month's numbers as this month's.
	 */
	function suggest(header) {
		const norm = header
			.trim()
			.toLowerCase()
			.replace(/[\s-]+/g, '_');
		const exact = destinations.find((d) => d.key === norm || d.label.toLowerCase() === norm);
		if (exact) return exact.key;
		if (/^(account|customer|client)_?id$/.test(norm)) return 'account_id';
		if (/^(company|account|customer|client)_?(name)?$/.test(norm)) return 'account_name';
		return '';
	}

	async function onFile(event) {
		const file = event.target.files?.[0];
		if (!file) return;
		uploading = true;
		uploadError = null;
		try {
			const result = await uploadEditionData(campaignUid, editionUid, file);
			upload = { ...result, filename: file.name };

			mapping = {};
			unconfirmed = new Set();
			for (const header of result.header) {
				const guess = suggest(header);
				if (guess) {
					mapping[header] = guess;
					// Suggested, not confirmed. The buyer has to agree to each one.
					unconfirmed.add(header);
				} else {
					mapping[header] = '';
				}
			}
			mapping = mapping;
			unconfirmed = unconfirmed;
			await reload();
		} catch (err) {
			uploadError = campaignError(err);
		} finally {
			uploading = false;
			event.target.value = '';
		}
	}

	function confirm(header) {
		unconfirmed.delete(header);
		unconfirmed = unconfirmed;
	}

	/** Changing a destination by hand IS a confirmation of that destination. */
	function setDestination(header, value) {
		mapping[header] = value;
		mapping = mapping;
		unconfirmed.delete(header);
		unconfirmed = unconfirmed;
	}

	async function validate() {
		validating = true;
		uploadError = null;
		try {
			await updateEdition(campaignUid, editionUid, { fieldMapping: mapping }, $edition.version);
			const result = await validateEdition(campaignUid, editionUid, { fieldMapping: mapping });
			// Shapes only: how many accounts, how many problems. Never a row.
			campaignDataValidated({
				accounts: result?.counts?.accounts,
				valid: result?.counts?.valid,
				issues: result?.counts?.issues,
				columns_mapped: mappedCount,
				columns_ignored: ignoredHeaders.length
			});
			await goto(editionUrl(campaignUid, editionUid, 'review'));
		} catch (err) {
			uploadError = campaignError(err);
		} finally {
			validating = false;
		}
	}

	const sampleFor = (header) => {
		const i = (upload?.header || []).indexOf(header);
		return i >= 0 ? upload?.sampleRows?.[0]?.[i] ?? '' : '';
	};

	const mb = (n) => `${(n / 1024 / 1024).toFixed(0)} MiB`;
</script>

<!-- Work area -->
<div class="min-w-0 flex-1">
	{#if !upload}
		<div class="rounded-md border border-brand-rule p-6">
			<h2 class="font-display text-[19px] font-bold text-brand-ink">Upload this period's data</h2>
			<p class="mt-2 max-w-[560px] font-sans text-[14px] text-brand-slate">
				One row per account, with the account id exactly as it appears in your own system.
			</p>
			<label
				class="mt-4 inline-flex h-11 cursor-pointer items-center rounded-btn bg-brand-plum px-4 font-sans text-[13.5px] text-white"
			>
				{uploading ? 'Uploading…' : 'Choose a CSV'}
				<input
					type="file"
					accept=".csv,text/csv"
					class="hidden"
					on:change={onFile}
					disabled={uploading}
				/>
			</label>
		</div>
	{:else}
		<div
			class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-brand-rule p-4"
		>
			<span class="flex items-center gap-3">
				<span
					class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[5px] bg-brand-subtle font-mono text-[9px] uppercase text-brand-slate"
					>CSV</span
				>
				<span class="flex flex-col">
					<span class="font-sans text-[15px] font-bold text-brand-ink">{upload.filename}</span>
					<span class="font-mono text-[11px] text-brand-mute">
						{upload.rowCount} rows · {upload.header.length} columns · {Math.round(
							upload.byteLength / 1024
						)} KB
					</span>
				</span>
			</span>
			<label class="cursor-pointer font-sans text-[13.5px] text-brand-royal hover:underline">
				Replace file
				<input type="file" accept=".csv,text/csv" class="hidden" on:change={onFile} />
			</label>
		</div>

		<!-- Stated plainly, because the buyer is handing us their customers' data
		     and is entitled to know exactly what we keep. -->
		<p
			class="mt-4 flex gap-2.5 rounded-md bg-brand-subtle p-4 font-sans text-[13.5px] text-brand-slate"
		>
			<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-ink" aria-hidden="true" />
			<span>
				The file is parsed on the server; only mapped columns are kept in the stored source and the
				original upload is discarded after parsing. Ignored columns are named below. Never include
				email addresses; Pictify does not send messages. Limits: {LIMITS.maxRows} rows · {LIMITS.maxColumns}
				columns · {mb(LIMITS.maxBytes)}.
			</span>
		</p>

		<!--
			AI-3 · the consent strip. A strip, not a modal, and it sits above the
			table it changes.

			The rules have ALREADY run by the time this is on screen — every match
			below came from a local rule, with no network call. So this asks for
			one thing only: whether the leftovers may be sent, as names and types,
			to be matched. Declining costs the buyer the leftovers, not the mapping,
			which is what makes the choice a real one.
		-->
		<!--
			Stays on screen after the answer, not only before the question. The
			first version showed the strip while there were unmatched columns and
			hid it the moment they were resolved — which took the "N of M matched ·
			Sent: 3 names, 0 rows, 0 values" line away at exactly the moment it
			became a statement about something that had happened.
		-->
		{#if unmatchedHeaders.length || mappingConsent !== null}
			<div
				class="mt-7 flex flex-wrap items-start justify-between gap-4 border border-brand-rule bg-brand-subtle p-4"
			>
				<span class="min-w-0">
					{#if mappingConsent === null}
						<span class="block font-sans text-[14px] font-medium text-brand-ink">
							{unmatchedHeaders.length}
							{unmatchedHeaders.length === 1 ? 'column has' : 'columns have'} no obvious match
						</span>
						<span class="mt-0.5 block font-sans text-[13px] leading-[19px] text-brand-slate">
							Pictify can suggest where they go. It would send the column names and their types —
							never a row, a value or a customer.
						</span>
					{:else if suggesting}
						<span class="block font-sans text-[14px] text-brand-ink">Matching column names…</span>
					{:else if mappingConsent === false}
						<span class="block font-sans text-[14px] text-brand-ink">Mapping by hand</span>
						<span class="mt-0.5 block font-sans text-[13px] text-brand-slate">
							Nothing was sent. Pick a destination for each column below.
						</span>
					{:else}
						<!-- After consent, the strip states what actually left. -->
						<span class="block font-sans text-[14px] font-medium text-brand-ink">
							{suggestedByAi} of {sent?.names ?? 0} columns matched from their names
						</span>
						<span class="mt-0.5 block font-mono text-[11px] text-brand-slate">
							Sent: {sent?.names ?? 0} names and types · {sent?.rows ?? 0} rows · {sent?.values ??
								0} values
						</span>
					{/if}
				</span>

				{#if mappingConsent === null}
					<span class="flex flex-shrink-0 items-center gap-2.5">
						<button
							type="button"
							on:click={askForSuggestions}
							disabled={suggesting}
							class="h-9 border border-brand-ink bg-white px-3 font-sans text-[13px] font-semibold text-brand-ink disabled:border-brand-rule disabled:text-brand-mute"
							>Suggest matches</button
						>
						<button
							type="button"
							on:click={() => (mappingConsent = false)}
							class="h-9 px-2 font-sans text-[13px] text-brand-slate">I’ll map by hand</button
						>
					</span>
				{/if}
			</div>

			{#if mappingError}
				<p class="mt-3"><StatusSquare tone="blocked" label={mappingError} /></p>
			{/if}
		{/if}

		<div class="mt-7 flex flex-wrap items-baseline justify-between gap-2">
			<h2 class="font-display text-[17px] font-bold text-brand-ink">Map columns</h2>
			<p class="font-sans text-[13px] text-brand-mute">
				Suggestions must be confirmed · IDs stay text, 00042 stays 00042
			</p>
		</div>

		<div class="mt-3 overflow-x-auto">
			<table class="w-full min-w-[760px] border-collapse text-left">
				<thead>
					<tr class="border-b border-brand-ink">
						{#each ['Source header', 'Sample value', 'Destination', 'Type', 'State'] as head (head)}
							<th
								class="pb-2.5 font-mono text-[11.5px] font-normal uppercase tracking-[0.06em] text-brand-slate"
								>{head}</th
							>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each upload.header as header (header)}
						{@const dest = mapping[header]}
						{@const pending = dest && unconfirmed.has(header)}
						{@const def = destinations.find((d) => d.key === dest)}
						<tr class="border-b border-brand-rule {dest ? '' : 'text-brand-mute'}">
							<td
								class="py-3 pr-4 font-mono text-[12.5px] {dest
									? 'text-brand-ink'
									: 'text-brand-mute'}">{header}</td
							>
							<td
								class="py-3 pr-4 font-sans text-[13px] {dest
									? 'text-brand-slate'
									: 'text-brand-mute'}"
							>
								{dest ? sampleFor(header) : '••••••'}
							</td>
							<td class="py-3 pr-4">
								<select
									value={dest}
									on:change={(e) => setDestination(header, e.currentTarget.value)}
									class="h-9 w-[200px] rounded-[5px] border bg-white px-2 font-sans text-[13.5px] {pending
										? 'border-brand-ink'
										: 'border-brand-rule'} {dest ? 'text-brand-ink' : 'text-brand-mute'}"
								>
									<option value="">Ignore column</option>
									{#each destinations as d (d.key)}
										<option value={d.key}>{d.label}</option>
									{/each}
								</select>
							</td>
							<td class="py-3 pr-4">
								<span class="block font-mono text-[11.5px] text-brand-slate">
									{def ? `${def.type} · ${def.required ? 'req' : 'opt'}` : '—'}
								</span>
								{#if why[header]}
									<!--
										WHY, under the suggestion it explains. A destination a
										buyer is asked to confirm is a question, and a question
										with no reasoning behind it gets answered by clicking.
									-->
									<span
										class="mt-1 block max-w-[260px] font-sans text-[12px] leading-[17px] text-brand-mute"
									>
										{why[header]}
									</span>
								{/if}
							</td>
							<td class="py-3">
								{#if !dest && unresolved.has(header)}
									<!-- Unresolved is not the same as ignored: nothing could
									     place it, and the reason is beside it. No confidence
									     number, because there is nothing behind one. -->
									<StatusSquare tone="blocked" label="Unresolved" />
								{:else if !dest}
									<StatusSquare tone="excluded" label="Not stored" />
								{:else if pending}
									<span class="flex items-center gap-3">
										<StatusSquare tone="current" label="Suggested" />
										<button
											type="button"
											on:click={() => confirm(header)}
											class="font-sans text-[13px] text-brand-royal hover:underline">Confirm</button
										>
									</span>
								{:else}
									<StatusSquare tone="ready" label="Confirmed" />
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if uploadError}
			<p class="mt-4 flex items-start gap-2">
				<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
				<span class="font-sans text-[13.5px] text-brand-slate">{uploadError.message}</span>
			</p>
		{/if}

		<!-- Foot actions: hairline top, sentence left, actions right. -->
		<div
			class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-brand-rule pt-5"
		>
			<p class="font-sans text-[13.5px] text-brand-slate">
				{#if outstanding.length}
					{outstanding.length}
					{outstanding.length === 1 ? 'suggestion' : 'suggestions'} still need confirming.
				{:else if requiredMissing.length}
					Still to map: {requiredMissing.map((d) => d.label).join(', ')}.
				{:else}
					Ready to check {upload.rowCount} rows.
				{/if}
			</p>
			<div class="flex items-center gap-3">
				<a
					href={editionUrl(campaignUid, editionUid, 'setup')}
					class="flex h-11 items-center rounded-btn border border-brand-rule px-4 font-sans text-[13.5px] text-brand-slate"
					>Back to Setup</a
				>
				<!-- Disabled primary is a subtle ground with a rule square, never
				     opacity (handoff §2 decision 2). -->
				<button
					type="button"
					on:click={validate}
					disabled={!canValidate}
					class="flex h-11 items-center gap-2.5 rounded-btn px-4 font-sans text-[13.5px] {canValidate
						? 'bg-brand-plum text-white'
						: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}"
				>
					{validating ? 'Checking…' : 'Validate data'}
					<span
						class="block h-2 w-2 {canValidate ? 'bg-brand-field' : 'bg-brand-rule'}"
						aria-hidden="true"
					/>
				</button>
			</div>
		</div>
	{/if}
</div>

<!-- Summary panel -->
<aside class="w-full flex-shrink-0 xl:w-[340px]">
	<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">This upload</p>
	<dl class="mt-3 border-t border-brand-ink">
		{#each [['Input rows', upload ? String(upload.rowCount) : '—'], ['Mapped columns', upload ? `${mappedCount} of ${upload.header.length}` : '—'], ['Ignored columns', upload ? `${ignoredHeaders.length} · not stored` : '—'], ['Data revision', $edition ? `draft ${$edition.version}` : '—'], ['Input expires', $edition?.dataExpiresAt ? new Date($edition.dataExpiresAt).toLocaleDateString( 'en-US', { month: 'short', day: 'numeric', year: 'numeric' } ) : '—']] as [label, value] (label)}
			<div class="flex items-baseline justify-between gap-3 border-b border-brand-rule py-2.5">
				<dt class="font-sans text-[13.5px] text-brand-slate">{label}</dt>
				<dd class="font-mono text-[12px] text-brand-ink">{value}</dd>
			</div>
		{/each}
	</dl>

	{#if ignoredHeaders.length}
		<p class="mt-4 font-sans text-[13px] text-brand-slate">
			Not stored: <span class="font-mono text-[12px] text-brand-mute"
				>{ignoredHeaders.join(', ')}</span
			>
		</p>
	{/if}

	<div class="mt-5 rounded-md bg-brand-subtle p-4">
		<p class="font-sans text-[14px] font-bold text-brand-ink">Re-uploading makes previews stale</p>
		<p class="mt-1.5 font-sans text-[13px] text-brand-slate">
			A new file creates a new draft data revision. Any preview or approval on the old revision
			stays in history and cannot be reused.
		</p>
	</div>
</aside>
