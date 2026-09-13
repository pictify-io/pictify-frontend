<script>
	/**
	 * Campaigns › New — describe it, then edit the brief. AI-1 (board AN-01).
	 *
	 * THE AI NEVER GETS ITS OWN SCREEN (locked decision 1). This is the New
	 * Campaign step; the description box sits where a name field would, and
	 * "Skip, set up manually" lands on the same Setup the manual path always
	 * used. Nothing here creates anything — the brief is a draft, and every
	 * field is editable before Create.
	 *
	 * The right rail states what left the tenant in FIXED strings (locked
	 * decision 2). "Customer data · never" is true because of the route's shape,
	 * not because of a promise: POST /campaigns/brief takes a sentence and the
	 * team's brand and has no access to an edition or a row.
	 *
	 * What the model may decide is narrow and the server enforces it — a
	 * metric's direction, its blank treatment and the brand colour stay the
	 * buyer's however confidently the model volunteers them. So the rows below
	 * that carry `needs_you` are not "the AI was unsure"; they are decisions
	 * that were never the AI's to make.
	 */
	import { goto } from '$app/navigation';
	import {
		draftCampaignBrief,
		createCampaign,
		detectBrand,
		campaignError
	} from '../../../../api/campaign';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import { campaignsHome, campaignUrl } from '$lib/campaigns/nav.js';

	let description = '';
	let drafting = false;
	let drafted = null;
	let error = null;
	let creating = false;

	/* --------------------------------------------------------- AI-6 A4 */

	/** A brand is a colour or a typeface. The account's name is neither. */
	$: brandSet = Boolean(brief?.brand?.color || brief?.brand?.font);

	let brandOpen = false;
	let brandDomain = '';
	let detecting = false;
	let detected = null;
	let brandError = null;

	/**
	 * Read a colour off the buyer's own homepage.
	 *
	 * Nothing is saved by this — the route returns a proposal and the buyer
	 * presses "Use this colour", which is the confirmation the caption promises.
	 * A colour that comes back unusable (a mostly-white page) is shown WITH its
	 * reason rather than hidden: the buyer may still take it if they know better
	 * than the detector, and they usually do.
	 */
	async function detectFromSite() {
		if (detecting) return;
		detecting = true;
		brandError = null;
		detected = null;
		try {
			detected = await detectBrand(brandDomain.trim());
		} catch (err) {
			brandError = campaignError(err).message;
		} finally {
			detecting = false;
		}
	}

	/** Editable copy of the draft; the response is never mutated in place. */
	let brief = null;

	$: sources = drafted?.sources || { fromWords: [], suggested: [], needsYou: [] };
	$: claims = drafted?.claims || [];
	/**
	 * What still needs the buyer, and what BLOCKS creating.
	 *
	 * The two are not the same. A suggested name is theirs to change and stops
	 * nothing; an estimated metric with no method note does — the server refuses
	 * it, and rightly, because an estimate whose method is unstated is not
	 * publishable to a customer. Before this the button was enabled and the
	 * refusal arrived as a 400 for the buyer to interpret.
	 */
	$: missingMethodNotes = (brief?.metrics || []).filter(
		(m) => m.kind === 'estimated' && !String(m.methodNote || '').trim()
	);
	$: blockers = [
		...missingMethodNotes.map((m) => `${m.label} needs a method note`),
		...(brief && !brief.metrics.length ? ['Add at least one metric'] : [])
	];
	$: needsCount =
		(sources.needsYou || []).filter((f) => f !== 'method_note').length + blockers.length;

	/** Which square a brief row gets. Three states, and no fourth. */
	function toneFor(field) {
		if (sources.needsYou?.includes(field)) return 'blocked';
		if (sources.suggested?.includes(field)) return 'current';
		return 'ready';
	}
	const labelFor = (field) =>
		sources.needsYou?.includes(field)
			? 'Needs you'
			: sources.suggested?.includes(field)
			? 'Suggested'
			: 'From your words';

	async function draft() {
		if (description.trim().length < 10 || drafting) return;
		drafting = true;
		error = null;
		try {
			const res = await draftCampaignBrief(description.trim());
			drafted = res;
			// A copy, so editing a field cannot change what the sources describe.
			brief = JSON.parse(JSON.stringify(res.brief));
		} catch (err) {
			error = campaignError(err);
		} finally {
			drafting = false;
		}
	}

	/**
	 * Create the campaign from the edited brief.
	 *
	 * A campaign is pinned to a design and a brief does not describe one, so the
	 * request asks for the starter card and the server materialises it as this
	 * team's own template. The buyer then edits it in the studio — which is the
	 * step that owns designs, and the reason this screen does not try to be one.
	 *
	 * The metric contract goes over as the buyer edited it, INCLUDING the method
	 * notes: an estimate that reached the campaign without one would be an
	 * estimate on a customer's card that nobody explained.
	 */
	async function create() {
		if (!brief || creating) return;
		creating = true;
		error = null;
		try {
			const res = await createCampaign({
				name: brief.name,
				format: brief.format,
				cadence: brief.cadence,
				starter: 'value-update-card-v1',
				metrics: brief.metrics.map((m) => ({
					key: m.key,
					label: m.label,
					unit: m.unit || undefined,
					precision: m.precision,
					classification: m.kind,
					methodNote: m.methodNote || undefined,
					// The brief carries this as an enum and the campaign as a boolean.
					// Dropping it lost the "vs last month" line the brief had already
					// decided on, and the card would have come out without it.
					comparison: m.comparison === 'prior_period'
					// `desiredDirection` is deliberately NOT sent. The brief never asks
					// which way is good news, so sending anything here would be this
					// screen making that call on the buyer's behalf.
				}))
			});
			if (!res?.campaign?.uid) throw new Error('no campaign returned');
			await goto(campaignUrl(res.campaign.uid));
		} catch (err) {
			error = campaignError(err);
			creating = false;
		}
	}
</script>

<svelte:head><title>New campaign · Pictify</title></svelte:head>

<div data-v2 class="px-5 pt-6 md:px-11 md:pt-7">
	<div class="flex flex-wrap items-start justify-between gap-4 border-b border-brand-rule pb-6">
		<div class="min-w-0">
			<p class="font-sans text-[13px] text-brand-slate">
				<a href={campaignsHome()} class="hover:underline">Campaigns</a> / New campaign
			</p>
			<h1 class="mt-1.5 font-display text-[30px] font-extrabold tracking-[-0.03em] text-brand-ink">
				What should customers hear from you?
			</h1>
			<p class="mt-1.5 font-sans text-[14px] text-brand-slate">
				One sentence is enough. You edit the brief before anything is made.
			</p>
		</div>
		<a
			href={campaignsHome()}
			class="flex h-10 flex-shrink-0 items-center border border-brand-rule px-4 font-sans text-[13.5px] text-brand-ink"
			>Skip, set up manually</a
		>
	</div>

	<div class="grid gap-10 py-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-14">
		<div class="min-w-0">
			<!-- 01 · DESCRIBE -->
			<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">01 · Describe</p>
			<div class="mt-3 border border-brand-rule bg-white">
				<textarea
					bind:value={description}
					rows="3"
					maxlength="2000"
					disabled={drafting}
					placeholder="A monthly value update for our customers about the hours they saved with us. Company name, workflows completed, our blue."
					aria-label="Describe what customers should hear"
					class="w-full resize-none bg-transparent p-4 font-sans text-[14.5px] leading-[22px] text-brand-ink outline-none placeholder:text-brand-mute"
				/>
				<div
					class="flex flex-wrap items-center justify-between gap-3 border-t border-brand-rule px-4 py-2.5"
				>
					{#if drafted}
						<StatusSquare tone="ready" label="Drafted below" />
					{:else}
						<span class="font-sans text-[13px] text-brand-mute">Nothing drafted yet</span>
					{/if}
					<button
						type="button"
						on:click={draft}
						disabled={drafting || description.trim().length < 10}
						class="font-sans text-[13.5px] text-brand-blue underline-offset-2 hover:underline disabled:text-brand-mute disabled:no-underline"
					>
						{drafting ? 'Drafting…' : drafted ? 'Draft again' : 'Draft the brief'}
					</button>
				</div>
			</div>

			{#if error}
				<p class="mt-4"><StatusSquare tone="blocked" label={error.message} /></p>
			{/if}

			{#if drafted && drafted.aiAvailable === false}
				<!--
					A3 — AI unavailable is a strip, not a modal, and it points at the
					manual control on the same screen. The brief below is still usable:
					the period, the brand and the wording check are deterministic.
				-->
				<p class="mt-4 flex items-start gap-2.5 border-l-2 border-brand-alarm bg-brand-subtle p-3">
					<span class="min-w-0">
						<span class="block font-sans text-[13.5px] font-medium text-brand-ink"
							>Drafting is unavailable right now</span
						>
						<span class="mt-0.5 block font-sans text-[13px] text-brand-slate"
							>Fill the brief in yourself below, or skip to manual setup. Nothing else is affected.</span
						>
					</span>
				</p>
			{/if}

			<!-- 02 · YOUR BRIEF -->
			{#if brief}
				<div class="mt-9 flex items-baseline justify-between gap-4">
					<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
						02 · Your brief
					</p>
					<p class="font-sans text-[13px] text-brand-slate">Everything is editable</p>
				</div>

				<dl class="mt-3 border border-brand-rule bg-white">
					<!-- Name -->
					<div class="grid gap-2 border-b border-brand-rule p-4 sm:grid-cols-[130px_minmax(0,1fr)]">
						<dt class="font-sans text-[13.5px] text-brand-slate">Name</dt>
						<dd class="flex flex-wrap items-center justify-between gap-3">
							<input
								bind:value={brief.name}
								maxlength="120"
								aria-label="Campaign name"
								class="min-w-0 flex-1 bg-transparent font-sans text-[14.5px] font-medium text-brand-ink outline-none"
							/>
							<StatusSquare tone={toneFor('name')} label={labelFor('name')} />
						</dd>
					</div>

					<!-- Period -->
					<div class="grid gap-2 border-b border-brand-rule p-4 sm:grid-cols-[130px_minmax(0,1fr)]">
						<dt class="font-sans text-[13.5px] text-brand-slate">Period</dt>
						<dd class="flex flex-wrap items-center gap-3">
							<select
								value={brief.cadence}
								on:change={(e) => (brief.cadence = e.currentTarget.value)}
								aria-label="Cadence"
								class="h-8 border border-brand-rule bg-white px-2 font-sans text-[13.5px] text-brand-ink"
							>
								{#each ['Monthly', 'Quarterly', 'Manual'] as option (option)}
									<option value={option}>{option}</option>
								{/each}
							</select>
							<span class="font-mono text-[11.5px] text-brand-slate">{brief.periodLabel} · UTC</span
							>
						</dd>
					</div>

					<!-- Output -->
					<div class="grid gap-2 border-b border-brand-rule p-4 sm:grid-cols-[130px_minmax(0,1fr)]">
						<dt class="font-sans text-[13.5px] text-brand-slate">Output</dt>
						<dd class="flex flex-wrap items-center justify-between gap-3">
							<span class="flex items-center gap-1.5">
								{#each [['png', 'Email card · PNG'], ['pdf', 'One-page PDF']] as [value, label] (value)}
									<button
										type="button"
										on:click={() => (brief.format = value)}
										aria-pressed={brief.format === value}
										class="h-8 px-3 font-sans text-[13px] {brief.format === value
											? 'border border-brand-ink font-semibold text-brand-ink'
											: 'border border-transparent text-brand-slate'}">{label}</button
									>
								{/each}
							</span>
							<StatusSquare tone={toneFor('output')} label={labelFor('output')} />
						</dd>
					</div>

					<!-- Brand -->
					<div class="grid gap-2 border-b border-brand-rule p-4 sm:grid-cols-[130px_minmax(0,1fr)]">
						<dt class="font-sans text-[13.5px] text-brand-slate">Brand</dt>
						<dd class="flex flex-wrap items-center justify-between gap-3">
							<span class="flex min-w-0 items-center gap-2.5">
								{#if !brandSet}
									<!--
										A4. Keyed on a COLOUR OR A TYPEFACE, never on the name:
										`brand.name` is the account's name, which every team has,
										so keying on it meant this state could never appear.

										The missing state is a row like any other, not an error —
										a brief without a brand is a perfectly good draft, and
										Review is where it becomes advisory.
									-->
									<span class="block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
									<span class="font-sans text-[14px] text-brand-ink">No brand yet</span>
								{:else if brief.brand.color}
									<span
										class="block h-5 w-5 flex-shrink-0 border border-brand-rule"
										style="background:{brief.brand.color}"
										aria-hidden="true"
									/>
								{/if}
								{#if brandSet}
									<!-- The account's name only belongs here once there is a
									     brand for it to name. Beside "No brand yet" it reads as
									     a brand that exists. -->
									<span class="truncate font-sans text-[14px] font-medium text-brand-ink"
										>{brief.brand.name}</span
									>
								{/if}
								<span class="truncate font-mono text-[11.5px] text-brand-slate">
									{[brief.brand.color, brief.brand.font].filter(Boolean).join(' · ')}
								</span>
							</span>
							{#if !brandSet}
								<button
									type="button"
									on:click={() => (brandOpen = !brandOpen)}
									aria-expanded={brandOpen}
									class="h-8 flex-shrink-0 border border-brand-ink bg-white px-3 font-sans text-[12.5px] font-semibold text-brand-ink"
									>Add brand</button
								>
							{:else}
								<a
									href="/dashboard/brand-assets"
									class="flex-shrink-0 font-sans text-[13px] text-brand-blue hover:underline"
									>Change</a
								>
							{/if}
						</dd>
					</div>

					{#if brandOpen}
						<!--
							A4. Two paths and one caption. The caption is the promise the
							route keeps: only the public origin is fetched, nothing is
							saved, and what comes back is a suggestion the buyer accepts.
						-->
						<div class="border-b border-brand-rule bg-brand-subtle p-4">
							<p class="font-sans text-[14px] font-medium text-brand-ink">Set up your brand</p>
							<div class="mt-3 flex flex-wrap items-center gap-2.5">
								<input
									bind:value={brandDomain}
									placeholder="yourcompany.com"
									aria-label="Your website address"
									class="h-9 w-[200px] border border-brand-rule bg-white px-2 font-mono text-[12.5px] text-brand-ink"
								/>
								<button
									type="button"
									on:click={detectFromSite}
									disabled={detecting || brandDomain.trim().length < 4}
									class="h-9 border border-brand-ink bg-white px-3 font-sans text-[12.5px] font-semibold text-brand-ink disabled:border-brand-rule disabled:text-brand-mute"
									>{detecting ? 'Reading…' : 'Detect from site'}</button
								>
								<a
									href="/dashboard/brand-assets"
									class="h-9 px-2 font-sans text-[12.5px] leading-9 text-brand-slate">Upload logo</a
								>
							</div>
							<p class="mt-2 font-sans text-[12.5px] text-brand-slate">
								Fetches the public site only. You confirm before use.
							</p>

							{#if brandError}
								<p class="mt-2"><StatusSquare tone="blocked" label={brandError} /></p>
							{:else if detected}
								<div class="mt-3 flex flex-wrap items-center gap-3">
									<span
										class="block h-6 w-6 flex-shrink-0 border border-brand-rule"
										style="background:{detected.color}"
										aria-hidden="true"
									/>
									<span class="font-mono text-[12px] text-brand-ink">{detected.color}</span>
									<button
										type="button"
										on:click={() => {
											brief.brand = { ...brief.brand, color: detected.color };
											brandOpen = false;
										}}
										class="h-8 bg-brand-ink px-3 font-sans text-[12.5px] font-semibold text-white"
										>Use this colour</button
									>
								</div>
								<p class="mt-2 font-sans text-[12.5px] leading-[18px] text-brand-slate">
									{detected.note}
								</p>
							{/if}
						</div>
					{/if}

					<!-- Metrics -->
					<div class="grid gap-2 border-b border-brand-rule p-4 sm:grid-cols-[130px_minmax(0,1fr)]">
						<dt class="font-sans text-[13.5px] text-brand-slate">Metrics</dt>
						<dd>
							{#if brief.metrics.length}
								<ul class="border border-brand-rule">
									{#each brief.metrics as metric, i (metric.key)}
										<li
											class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-brand-rule p-3 last:border-b-0"
										>
											<span class="flex min-w-0 flex-1 items-center gap-2.5">
												<span
													class="block h-2 w-2 flex-shrink-0 {metric.kind === 'estimated' &&
													!metric.methodNote
														? 'bg-brand-alarm'
														: 'bg-brand-proof'}"
													aria-hidden="true"
												/>
												<input
													bind:value={brief.metrics[i].label}
													maxlength="60"
													aria-label="Label for {metric.key}"
													class="min-w-0 flex-1 bg-transparent font-sans text-[13.5px] font-medium text-brand-ink outline-none"
												/>
											</span>
											<span class="font-mono text-[10.5px] text-brand-slate">
												{[metric.unit || 'count', metric.kind === 'estimated' ? 'estimated' : null]
													.filter(Boolean)
													.join(' · ')}
											</span>
											{#if metric.kind === 'estimated'}
												<!--
													An estimate has to say how it was estimated, and only
													the buyer knows. This is not the AI being unsure; it is
													a decision that was never the AI's to make.
												-->
												<input
													bind:value={brief.metrics[i].methodNote}
													placeholder="How was this estimated?"
													maxlength="160"
													aria-label="Method note for {metric.key}"
													class="h-8 w-full border border-brand-ink bg-white px-2 font-sans text-[12.5px] text-brand-ink outline-none sm:w-[220px]"
												/>
											{/if}
										</li>
									{/each}
								</ul>
							{:else}
								<p class="font-sans text-[13.5px] text-brand-slate">
									No metrics yet — you can add them in Setup.
								</p>
							{/if}
						</dd>
					</div>

					<!-- Wording -->
					{#if claims.length}
						<div class="grid gap-2 p-4 sm:grid-cols-[130px_minmax(0,1fr)]">
							<dt class="font-sans text-[13.5px] text-brand-slate">Wording</dt>
							<dd>
								{#each claims as claim (claim.span)}
									<div class="flex flex-wrap items-center gap-x-3 gap-y-2 py-1">
										<span class="flex min-w-0 flex-1 items-center gap-2.5">
											<span class="block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
											<span class="font-sans text-[13.5px] text-brand-ink"
												>“{claim.span}” → “{claim.rewording}”</span
											>
										</span>
										<span class="flex flex-shrink-0 items-center gap-2">
											<button
												type="button"
												on:click={() => {
													description = description.replace(claim.span, claim.rewording);
													drafted = { ...drafted, claims: claims.filter((c) => c !== claim) };
												}}
												class="h-8 border border-brand-ink bg-white px-3 font-sans text-[12.5px] font-semibold text-brand-ink"
												>Use</button
											>
											<button
												type="button"
												on:click={() =>
													(drafted = { ...drafted, claims: claims.filter((c) => c !== claim) })}
												class="h-8 px-2 font-sans text-[12.5px] text-brand-slate">Keep mine</button
											>
										</span>
									</div>
									<p class="pl-[18px] font-sans text-[12.5px] leading-[18px] text-brand-slate">
										{claim.reason}
									</p>
								{/each}
							</dd>
						</div>
					{/if}
				</dl>

				<div
					class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-brand-rule pt-5"
				>
					{#if blockers.length}
						<!-- Named, not counted: a buyer can act on "Hours Saved needs a
						     method note" and cannot act on "1 thing needs you". -->
						<StatusSquare tone="blocked" label={blockers.join(' · ')} />
					{:else if needsCount > 0}
						<StatusSquare
							tone="current"
							label={`${needsCount} thing${
								needsCount === 1 ? '' : 's'
							} you can still change · or answer ${needsCount === 1 ? 'it' : 'them'} in Setup`}
						/>
					{:else}
						<StatusSquare tone="ready" label="Nothing outstanding" />
					{/if}
					<span class="flex items-center gap-3">
						<a
							href={campaignsHome()}
							class="flex h-11 items-center border border-brand-rule px-4 font-sans text-[14px] text-brand-ink"
							>Save brief</a
						>
						<button
							type="button"
							on:click={create}
							disabled={creating || blockers.length > 0}
							class="flex h-11 items-center gap-2.5 bg-brand-ink px-5 font-sans text-[14px] font-semibold text-white disabled:bg-brand-rule disabled:text-brand-mute"
						>
							{creating ? 'Creating…' : 'Create campaign'}
							<span class="block h-2.5 w-2.5 bg-brand-field" aria-hidden="true" />
						</button>
					</span>
				</div>
			{/if}
		</div>

		<!-- THE AI USED -->
		<aside>
			<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">The AI used</p>
			<dl class="mt-3 border-t border-brand-ink">
				<!--
					FIXED STRINGS, never generated (locked decision 2). A line that
					described what was sent by summarising it would be a claim about a
					transfer, written by the thing that made the transfer.
				-->
				{#each [['Your description', drafted ? 'ready' : 'excluded'], ['Your brand', brandSet ? 'ready' : 'excluded']] as [label, tone] (label)}
					<div class="flex items-center justify-between gap-3 border-b border-brand-rule py-2.5">
						<dt class="font-sans text-[13.5px] text-brand-ink">{label}</dt>
						<dd>
							<span
								class="block h-2 w-2 {tone === 'ready' ? 'bg-brand-proof' : 'bg-brand-rule'}"
								aria-hidden="true"
							/>
						</dd>
					</div>
				{/each}
				<div class="flex items-center justify-between gap-3 border-b border-brand-rule py-2.5">
					<dt class="font-sans text-[13.5px] text-brand-ink">Customer data</dt>
					<dd class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-slate">never</dd>
				</div>
			</dl>

			<p class="mt-5 font-sans text-[14px] font-semibold text-brand-ink">A brief is a draft</p>
			<p class="mt-1 font-sans text-[13px] leading-[19px] text-brand-slate">
				Nothing is uploaded, generated or approved until you do it in the steps that follow.
			</p>
		</aside>
	</div>
</div>
