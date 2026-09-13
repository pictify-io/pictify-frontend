<script>
	/**
	 * Brand assets — one kit. FE-20 (boards D11 `IVW-0`, D11b `J4W-0`,
	 * D11a `JBE-0`; notes `JIX-0` decisions, `JJI-0` states).
	 *
	 * Replaces the v1 asset grid (tiles by type, categories, a separate
	 * FeatureGate screen). The grid answered "what files have I uploaded"; this
	 * page answers the question a buyer actually has, which is "what will my
	 * customers see" — four rows, a live specimen, and the list of editions
	 * currently using it.
	 *
	 * THE THREE THINGS THIS SCREEN PROMISES, and each is load-bearing:
	 *
	 *   REVISIONS, NOT OVERWRITES. Saving makes rev n+1. An approved edition
	 *   keeps the revision it was approved with, so changing a colour today
	 *   cannot alter what a customer already received.
	 *   NOTHING IS SAVED UNTIL YOU CONFIRM. Detection proposes; the draft lives
	 *   in this component until "Save as rev 1". Closing the page writes nothing.
	 *   A RATIO, NOT A VERDICT. Every swatch prints its contrast against white
	 *   as a number the buyer can check, and a failing one never blocks the
	 *   save — it tells the AI where not to put words.
	 *
	 * Locked plan renders the SAME page read-only with one plum "Unlock brand
	 * kit" in the header, rather than a gate screen: a buyer deciding whether to
	 * pay should be able to see what they would be buying.
	 */
	import { onMount } from 'svelte';
	import { notify, showToast } from '../../../store/toast.store.js';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import CardPreview from '$lib/components/campaigns/CardPreview.svelte';
	import BrandSetupDialog from '$lib/components/campaigns/BrandSetupDialog.svelte';
	import {
		getBrandKit,
		saveBrandKitRevision,
		uploadBrandFile,
		deleteBrandAsset,
		brandKitError
	} from '../../../api/brand-kit';
	import {
		contrastOnWhite,
		formatRatio,
		passesAA,
		darkenToPass,
		countChanges,
		specimenHtml,
		emptyKit,
		TONE_CHIPS,
		MAX_TONES,
		BACKGROUND_ROLE,
		pinnedApprovedEditions,
		sameLogo
	} from '$lib/campaigns/brand-kit.js';

	let loading = true;
	let loadError = null;

	/** The last saved revision, kept so the foot can count what has changed. */
	let saved = null;
	let revision = 0;
	let savedAt = null;
	let website = '';
	let usedBy = [];
	let locked = false;

	/** The kit being edited. Never written anywhere until Save. */
	let draft = emptyKit();
	let saving = false;

	/** D11a: shown when a team has never saved a kit. */
	let setupOpen = false;
	/** D11b: set after a detect, so the rows can show FOUND · n. */
	let detected = null;

	let logoInput;
	let fontInput;
	let uploadKind = 'mark';

	$: changes = saved ? countChanges(saved, draft) : 0;
	$: dirty = changes > 0 || (revision === 0 && hasAnything(draft));
	$: editable = !locked;

	/*
	 * A first run has something to save even though there is no saved revision
	 * to diff against — `countChanges` would say 0 and the Save button would sit
	 * disabled over a fully detected kit.
	 */
	function hasAnything(kit) {
		return Boolean(
			kit?.logos?.length ||
				kit?.colours?.length ||
				kit?.fonts?.headings ||
				kit?.fonts?.body ||
				kit?.voice?.tones?.length ||
				kit?.voice?.rule
		);
	}

	onMount(load);

	async function load() {
		loading = true;
		loadError = null;
		try {
			const res = await getBrandKit();
			revision = res?.revision || 0;
			savedAt = res?.savedAt || null;
			website = res?.website || '';
			usedBy = res?.usedBy || [];
			locked = res?.locked === true;
			saved = res?.kit || null;
			draft = res?.kit ? structuredClone(res.kit) : emptyKit();
			// The empty state is a state, not a failure: a team with no kit yet
			// gets the dialog rather than an error or a blank page.
			setupOpen = revision === 0 && !locked;
		} catch (err) {
			loadError = brandKitError(err).message;
		} finally {
			loading = false;
		}
	}

	/* ------------------------------------------------------------ editing */

	function setColour(role, hex) {
		const next = [...draft.colours];
		const at = next.findIndex((c) => c.role === role);
		if (at === -1) next.push({ role, hex });
		else next[at] = { ...next[at], hex };
		draft = { ...draft, colours: next };
	}

	function addRole() {
		// Named by position rather than prompting: the buyer renames in place,
		// and a dialog for a label would be three clicks for a word.
		const n = draft.colours.length + 1;
		draft = { ...draft, colours: [...draft.colours, { role: `Colour ${n}`, hex: '#000000' }] };
	}

	function darken(role) {
		const current = draft.colours.find((c) => c.role === role)?.hex;
		const next = darkenToPass(current);
		if (!next) {
			showToast('That colour cannot reach 4.5 : 1 without becoming black.', 'default', 4000);
			return;
		}
		setColour(role, next);
	}

	function toggleTone(tone) {
		const tones = draft.voice?.tones || [];
		const has = tones.includes(tone);
		// Two at most (locked decision). Choosing a third replaces the oldest
		// rather than refusing, so the chips never feel stuck.
		const next = has
			? tones.filter((t) => t !== tone)
			: [...tones, tone].slice(-MAX_TONES);
		draft = { ...draft, voice: { ...draft.voice, tones: next } };
	}

	/**
	 * The logo the buyer asked to remove, while the typed confirmation is open.
	 * Null the rest of the time — the confirmation only exists for the one case
	 * that needs it.
	 */
	let removing = null;
	let typed = '';
	let removeBusy = false;

	/** No trimming games: it matches exactly or the button stays disabled. */
	$: removeConfirmed = removing ? typed === `remove ${removing.kind}` : false;

	function requestRemove(logo) {
		const pinned = pinnedApprovedEditions(saved, usedBy, logo);
		if (!pinned.length) {
			// Nothing is holding it: drop it from the draft. Still not destructive
			// — the kit is not written until Save, so this is undoable with Discard.
			dropLogo(logo);
			return;
		}
		typed = '';
		removing = { ...logo, pinned };
	}

	function dropLogo(logo) {
		draft = {
			...draft,
			logos: draft.logos.filter((l) => !sameLogo(l, logo))
		};
	}

	async function confirmRemove() {
		if (!removeConfirmed || removeBusy) return;
		removeBusy = true;
		try {
			/*
			 * The server is asked because the asset exists beyond this draft — the
			 * pinned revisions still reference its bytes, and only the server knows
			 * whether they can be released. It re-checks the typed confirmation
			 * too; the client asking is a courtesy, the server refusing is the
			 * guarantee.
			 */
			await deleteBrandAsset(removing.assetUid, typed);
			dropLogo(removing);
			removing = null;
			typed = '';
			notify.note('REMOVED FROM THE KIT', 'Approved editions keep the revision they were approved with.');
		} catch (err) {
			notify.fail('Remove asset', err, { retry: () => confirmRemove() });
		} finally {
			removeBusy = false;
		}
	}

	async function pickFile(kind) {
		uploadKind = kind;
		if (kind === 'font') fontInput?.click();
		else logoInput?.click();
	}

	async function onFile(event) {
		const file = event.target?.files?.[0];
		event.target.value = '';
		if (!file) return;
		try {
			const asset = await uploadBrandFile(file, uploadKind);
			if (uploadKind === 'font') {
				draft = {
					...draft,
					fonts: { ...draft.fonts, headings: draft.fonts.headings || asset, body: draft.fonts.body || asset }
				};
			} else {
				const logos = draft.logos.filter((l) => l.kind !== uploadKind);
				draft = { ...draft, logos: [...logos, { ...asset, kind: uploadKind }] };
			}
		} catch (err) {
			// No retry: the file input is empty again, so there is nothing to
			// re-send without the visitor picking the file a second time.
			notify.fail('Upload', err);
		}
	}

	/* -------------------------------------------------------------- save */

	async function save() {
		if (saving || !editable) return;
		saving = true;
		try {
			const res = await saveBrandKitRevision(draft, revision);
			revision = res.revision;
			savedAt = res.savedAt || new Date().toISOString();
			saved = structuredClone(draft);
			usedBy = res.usedBy || usedBy;
			detected = null;

		} catch (err) {
			const e = brandKitError(err);
			if (e.status === 409) {
				// Another tab saved first. Reload rather than overwrite: the other
				// version is somebody's work too.
				notify.note('SOMEONE ELSE SAVED FIRST', 'Reloading their version so nothing is overwritten.');
				await load();
			} else {
				notify.fail('Save kit', err, { retry: () => save() });
			}
		} finally {
			saving = false;
		}
	}

	function discard() {
		draft = saved ? structuredClone(saved) : emptyKit();
		detected = null;
	}

	function onDetected(event) {
		const result = event.detail;
		website = result.website || website;
		detected = result.found || null;
		draft = result.kit || emptyKit();
		setupOpen = false;
	}

	/* ------------------------------------------------------------ derived */

	$: specimen = specimenHtml(draft);
	$: failing = (draft.colours || []).filter(
		(c) => c.role !== BACKGROUND_ROLE && contrastOnWhite(c.hex) !== null && !passesAA(c.hex)
	);
	$: markLogo = (draft.logos || []).find((l) => l.kind === 'mark') || null;
	$: wordLogo = (draft.logos || []).find((l) => l.kind === 'wordmark') || null;

	/** The foot line. Three different sentences, and each states a fact. */
	$: footLine = detected
		? `Found on ${website} · ${detected.logos} logo${detected.logos === 1 ? '' : 's'} · ${detected.colours} colour${detected.colours === 1 ? '' : 's'} · ${detected.fonts} font${detected.fonts === 1 ? '' : 's'} · nothing saved yet`
		: dirty
			? `${changes} change${changes === 1 ? '' : 's'} since rev ${revision} · not saved`
			: revision > 0
				? `rev ${revision} · saved ${relative(savedAt)} · used by ${usedBy.length} edition${usedBy.length === 1 ? '' : 's'}`
				: 'Nothing saved yet';

	$: footTone = detected || dirty ? 'current' : 'ready';

	function relative(iso) {
		if (!iso) return 'just now';
		// Plain literal: the repo's eslint parser rejects numeric separators.
		const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
		if (days <= 0) return 'today';
		if (days === 1) return 'yesterday';
		return `${days} days ago`;
	}
</script>

<svelte:head><title>Brand assets | Pictify.io</title></svelte:head>


<input
	type="file"
	accept="image/svg+xml,image/png"
	class="hidden"
	bind:this={logoInput}
	on:change={onFile}
/>
<input
	type="file"
	accept=".woff,.woff2,.ttf,.otf"
	class="hidden"
	bind:this={fontInput}
	on:change={onFile}
/>

{#if setupOpen}
	<BrandSetupDialog
		{website}
		on:detected={onDetected}
		on:blank={() => {
			draft = emptyKit();
			setupOpen = false;
		}}
		on:upload={() => {
			setupOpen = false;
			pickFile('mark');
		}}
	/>
{/if}

<div class="min-h-full w-full px-6 py-8 lg:px-11 lg:py-9">
	<div class="mx-auto flex max-w-page flex-col">
		<!-- Header -->
		<div class="flex items-end justify-between gap-6 border-b border-brand-rule pb-[22px]">
			<div class="flex flex-col gap-1.5">
				<div class="flex items-center gap-2.5">
					<h1
						class="font-display text-[32px] font-semibold leading-[38px] tracking-[-0.02em] text-brand-ink"
					>
						Brand assets
					</h1>
					{#if revision > 0}
						<span
							class="rounded-btn border border-brand-rule px-2 py-[3px] font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-slate"
						>
							{website || 'Kit'} · rev {revision}
						</span>
					{/if}
				</div>
				<p class="font-sans text-[14px] leading-[20px] text-brand-slate">
					Every design starts from this. Saving makes a new revision; approved editions keep theirs.
				</p>
			</div>

			<div class="flex flex-shrink-0 gap-2">
				{#if locked}
					<!-- The one plum button on a locked page. Same kit, read-only. -->
					<button
						type="button"
						class="flex h-10 items-center gap-2 rounded-btn bg-brand-plum px-4 font-sans text-[14px] font-medium text-white"
					>
						Unlock brand kit
						<span class="block h-[7px] w-[7px] bg-brand-field" aria-hidden="true" />
					</button>
				{:else if detected}
					<button
						type="button"
						on:click={() => (setupOpen = true)}
						class="h-10 rounded-btn border border-brand-rule px-3.5 font-sans text-[14px] text-brand-ink"
					>
						Try another website
					</button>
					<button
						type="button"
						on:click={() => {
							draft = emptyKit();
							detected = null;
						}}
						class="h-10 rounded-btn border border-brand-rule px-3.5 font-sans text-[14px] text-brand-ink"
					>
						Start blank
					</button>
				{:else}
					{#if website}
						<button
							type="button"
							on:click={() => (setupOpen = true)}
							class="h-10 rounded-btn border border-brand-rule px-3.5 font-sans text-[14px] text-brand-ink"
						>
							Re-detect from {website}
						</button>
					{/if}
					<button
						type="button"
						class="h-10 rounded-btn border border-brand-rule px-3.5 font-sans text-[14px] text-brand-ink"
					>
						Versions
					</button>
				{/if}
			</div>
		</div>

		{#if loading}
			<p class="pt-7 font-sans text-[13px] text-brand-mute">Loading the kit…</p>
		{:else if loadError}
			<p class="pt-7"><StatusSquare tone="blocked" label={loadError} /></p>
		{:else}
			<div class="flex items-start gap-10 pt-7">
				<!-- The kit. Fixed label column, fixed content column. -->
				<div
					class="flex w-[752px] flex-shrink-0 flex-col rounded-[8px] border border-brand-rule bg-white {locked
						? 'opacity-60'
						: ''}"
				>
					<!-- Logo -->
					<div class="flex items-start gap-4 border-b border-brand-rule px-[22px] py-5">
						<div class="flex w-[130px] flex-shrink-0 flex-col gap-1.5 pt-1.5">
							<span class="font-sans text-[13.5px] leading-[18px] text-brand-slate">Logo</span>
							{#if detected}
								<span class="flex items-center gap-[5px]">
									<span
										class="block h-[7px] w-[7px] border border-brand-ink {detected.logos
											? 'bg-brand-field'
											: ''}"
										aria-hidden="true"
									/>
									<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-slate">
										{detected.logos ? `Found · ${detected.logos}` : 'Not found'}
									</span>
								</span>
							{/if}
						</div>
						<div class="flex w-[562px] flex-shrink-0 flex-col gap-2.5">
							<div class="flex gap-2.5">
								{#each [{ slot: 'mark', logo: markLogo, meta: 'Mark' }, { slot: 'wordmark', logo: wordLogo, meta: 'Wordmark' }] as entry (entry.slot)}
									{#if entry.logo}
										<div
											class="flex min-w-0 flex-1 items-center gap-3 rounded-[6px] border p-3 {entry.slot ===
											'mark'
												? 'border-[1.5px] border-brand-ink'
												: 'border-brand-rule'}"
										>
											<span
												class="flex h-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-brand-subtle {entry.slot ===
												'mark'
													? 'w-11'
													: 'w-[84px]'}"
											>
												{#if entry.logo.url}
													<img
														src={entry.logo.url}
														alt=""
														class="max-h-11 max-w-full object-contain"
													/>
												{/if}
											</span>
											<span class="flex min-w-0 flex-1 flex-col gap-0.5">
												<span class="truncate font-sans text-[14px] leading-[18px] text-brand-ink"
													>{entry.logo.name || `${entry.meta.toLowerCase()}.svg`}</span
												>
												<span class="font-mono text-[10px] uppercase text-brand-mute">
													{entry.meta}{entry.logo.bytes
														? ` · ${Math.round(entry.logo.bytes / 1024)} KB`
														: ''}
												</span>
											</span>
											{#if editable}
												<!-- Stacked, right-aligned: Replace over Remove (JKM-0). -->
												<span class="flex flex-shrink-0 flex-col items-end gap-1">
													<button
														type="button"
														on:click={() => pickFile(entry.slot)}
														class="font-sans text-[13px] leading-4 text-brand-royal hover:underline"
														>Replace</button
													>
													<button
														type="button"
														on:click={() => requestRemove(entry.logo)}
														class="font-sans text-[13px] leading-4 text-brand-mute hover:text-brand-ink hover:underline"
														>Remove</button
													>
												</span>
											{/if}
										</div>
									{:else}
										<button
											type="button"
											disabled={!editable}
											on:click={() => pickFile(entry.slot)}
											class="flex h-[68px] min-w-0 flex-1 items-center justify-center rounded-[6px] border border-dashed border-brand-rule font-sans text-[13px] text-brand-mute disabled:opacity-60"
										>
											Add a {entry.meta.toLowerCase()}
										</button>
									{/if}
								{/each}
							</div>
							<div class="flex items-center justify-between gap-4">
								<span class="font-sans text-[12.5px] leading-4 text-brand-mute"
									>SVG or PNG, at least 200 px wide. The mark goes on cards.</span
								>
								{#if editable}
									<button
										type="button"
										on:click={() => pickFile('mark')}
										class="flex-shrink-0 font-sans text-[13px] text-brand-royal hover:underline"
										>+ Add a logo</button
									>
								{/if}
							</div>
						</div>
					</div>

					<!-- Colours -->
					<div class="flex items-start gap-4 border-b border-brand-rule px-[22px] py-5">
						<div class="flex w-[130px] flex-shrink-0 flex-col gap-1.5 pt-1.5">
							<span class="font-sans text-[13.5px] leading-[18px] text-brand-slate">Colours</span>
							{#if detected}
								<span class="flex items-center gap-[5px]">
									<span
										class="block h-[7px] w-[7px] border border-brand-ink {detected.colours
											? 'bg-brand-field'
											: ''}"
										aria-hidden="true"
									/>
									<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-slate">
										{detected.colours ? `Found · ${detected.colours}` : 'Not found'}
									</span>
								</span>
							{/if}
						</div>
						<div class="flex w-[562px] flex-shrink-0 flex-col gap-2.5">
							<div class="flex gap-2.5">
								{#each draft.colours as colour (colour.role)}
									{@const ratio = contrastOnWhite(colour.hex)}
									{@const background = colour.role === BACKGROUND_ROLE}
									<div class="flex flex-1 flex-col gap-2">
										<label class="block cursor-pointer">
											<span class="sr-only">{colour.role} colour</span>
											<input
												type="color"
												value={colour.hex}
												disabled={!editable}
												on:input={(e) => setColour(colour.role, e.currentTarget.value.toUpperCase())}
												class="block h-14 w-full cursor-pointer appearance-none rounded-[6px] border-0 bg-transparent p-0 disabled:cursor-default"
												style="background-color:{colour.hex}"
											/>
										</label>
										<div class="flex items-center justify-between gap-2">
											<span class="flex min-w-0 flex-col gap-px">
												<span class="truncate font-sans text-[13.5px] leading-[18px] text-brand-ink"
													>{colour.role}</span
												>
												<span class="font-mono text-[11px] leading-[14px] text-brand-mute"
													>{colour.hex}</span
												>
											</span>
											{#if background}
												<span
													class="flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute"
													>Background</span
												>
											{:else if ratio !== null}
												<span class="flex flex-shrink-0 items-center gap-[5px]">
													<span
														class="block h-[7px] w-[7px] {passesAA(colour.hex)
															? 'bg-brand-proof'
															: 'bg-brand-alarm'}"
														aria-hidden="true"
													/>
													<span
														class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-slate"
														>{formatRatio(ratio)}</span
													>
												</span>
											{/if}
										</div>
									</div>
								{/each}
								{#if editable}
									<button
										type="button"
										on:click={addRole}
										aria-label="Add a colour role"
										class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[6px] border border-dashed border-brand-mute font-sans text-[18px] text-brand-mute"
										>+</button
									>
								{/if}
							</div>

							<!--
								One line per failing colour, and it never blocks the save. The
								sentence says what the consequence actually is — the AI will not
								set words on it — rather than scolding the buyer for their brand.
							-->
							{#each failing as colour (colour.role)}
								<div
									class="flex items-center justify-between gap-3 rounded-[6px] bg-brand-subtle px-3 py-[9px]"
								>
									<span class="flex min-w-0 items-center gap-2">
										<span class="block h-[7px] w-[7px] flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
										<span class="font-sans text-[12.5px] leading-4 text-brand-slate"
											>{colour.role} is too light for text. It will be used for shapes only.</span
										>
									</span>
									{#if editable}
										<button
											type="button"
											on:click={() => darken(colour.role)}
											class="flex-shrink-0 font-sans text-[12.5px] text-brand-royal hover:underline"
											>Darken to pass</button
										>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- Fonts -->
					<div class="flex items-start gap-4 border-b border-brand-rule px-[22px] py-5">
						<div class="flex w-[130px] flex-shrink-0 flex-col gap-1.5 pt-1.5">
							<span class="font-sans text-[13.5px] leading-[18px] text-brand-slate">Fonts</span>
							{#if detected}
								<span class="flex items-center gap-[5px]">
									<span
										class="block h-[7px] w-[7px] border border-brand-ink {detected.fonts
											? 'bg-brand-field'
											: ''}"
										aria-hidden="true"
									/>
									<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-slate">
										{detected.fonts ? `Found · ${detected.fonts}` : 'Not found'}
									</span>
								</span>
							{/if}
						</div>
						<div class="flex w-[562px] flex-shrink-0 flex-col gap-2.5">
							<div class="flex gap-2.5">
								{#each [{ slot: 'headings', label: 'headings' }, { slot: 'body', label: 'body' }] as entry (entry.slot)}
									{@const font = draft.fonts?.[entry.slot]}
									<div
										class="flex min-w-0 flex-1 items-center gap-3 rounded-[6px] border border-brand-rule p-3"
									>
										<span
											class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[6px] bg-brand-subtle font-sans text-[22px] leading-7 text-brand-ink {entry.slot ===
											'headings'
												? 'font-bold'
												: ''}">Aa</span
										>
										<span class="flex min-w-0 flex-1 flex-col gap-0.5">
											<span class="truncate font-sans text-[14px] leading-[18px] text-brand-ink">
												{font?.family || 'Not set'} · {entry.label}
											</span>
											<span class="font-mono text-[11px] uppercase leading-[14px] text-brand-mute">
												{#if !font}
													Pick a font
												{:else if font.source === 'upload'}
													Uploaded · embedded
												{:else if font.available === false}
													<!-- JJI-0: detected but not on Google. Says so rather than
													     silently substituting Inter behind the buyer's back. -->
													Not available · upload the file or pick a match
												{:else}
													Google · {(font.weights || []).join(' ') || '400'}
												{/if}
											</span>
										</span>
										{#if editable}
											<button
												type="button"
												on:click={() => pickFile('font')}
												class="flex-shrink-0 font-sans text-[13px] text-brand-royal hover:underline"
												>Change</button
											>
										{/if}
									</div>
								{/each}
							</div>
							<div class="flex items-center justify-between gap-4">
								<span class="font-sans text-[12.5px] leading-4 text-brand-mute"
									>Uploaded fonts are embedded in every card, so it looks the same in every inbox.</span
								>
								{#if editable}
									<button
										type="button"
										on:click={() => pickFile('font')}
										class="flex-shrink-0 font-sans text-[13px] text-brand-royal hover:underline"
										>Upload a font</button
									>
								{/if}
							</div>
						</div>
					</div>

					<!-- Voice -->
					<div class="flex items-start gap-4 px-[22px] py-5">
						<div class="w-[130px] flex-shrink-0 pt-1.5">
							<span class="font-sans text-[13.5px] leading-[18px] text-brand-slate">Voice</span>
						</div>
						<div class="flex w-[562px] flex-shrink-0 flex-col gap-2.5">
							<div class="flex flex-wrap gap-1.5">
								{#each TONE_CHIPS as tone (tone)}
									{@const on = (draft.voice?.tones || []).includes(tone)}
									<button
										type="button"
										disabled={!editable}
										on:click={() => toggleTone(tone)}
										aria-pressed={on}
										class="rounded-full px-[11px] py-1.5 font-sans text-[13px] leading-4 {on
											? 'border-[1.5px] border-brand-ink text-brand-ink'
											: 'border border-brand-rule text-brand-slate'}">{tone}</button
									>
								{/each}
							</div>
							<input
								type="text"
								disabled={!editable}
								bind:value={draft.voice.rule}
								placeholder="One rule in your own words"
								class="h-[38px] rounded-btn border border-brand-rule px-3 font-sans text-[14px] leading-[18px] text-brand-ink outline-none focus:border-brand-ink"
							/>
							<span class="font-sans text-[12.5px] leading-4 text-brand-mute"
								>Shapes the AI’s wording for static text. Your numbers are never rewritten.</span
							>
						</div>
					</div>
				</div>

				<!-- Specimen + who is using this -->
				<div class="flex w-[340px] flex-shrink-0 flex-col gap-6">
					<div class="flex flex-col gap-2.5">
						<p class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
							How it looks · sample data
						</p>
						<!--
							The standard card, re-rendered from the kit — not a swatch board.
							The promise on this screen is "here is what your customers get",
							and only the real layout can keep it.
						-->
						<CardPreview html={specimen} width={1200} height={800} displayWidth={340} />
						<p class="font-sans text-[12.5px] leading-4 text-brand-slate">
							Updates as you edit. Real designs pick which colours and fonts they use.
						</p>
					</div>

					<div class="flex flex-col">
						<div class="border-b border-brand-ink pb-2.5">
							<p class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">Used by</p>
						</div>
						{#each usedBy as use (use.editionUid)}
							<div class="flex items-center justify-between gap-3 border-b border-brand-rule py-[11px]">
								<span class="flex min-w-0 flex-col gap-px">
									<span class="truncate font-sans text-[14px] leading-[18px] text-brand-ink"
										>{use.name}</span
									>
									<span class="font-sans text-[12px] leading-4 text-brand-slate"
										>design rev {use.designRevision} · {use.state}</span
									>
								</span>
								<span class="flex-shrink-0 font-mono text-[11px] leading-[14px] text-brand-slate"
									>brand rev {use.brandRevision}</span
								>
							</div>
						{:else}
							<p class="py-[11px] font-sans text-[12.5px] text-brand-mute">
								No editions are using this kit yet.
							</p>
						{/each}
						{#if usedBy.length}
							<p class="pt-2.5 font-sans text-[12.5px] leading-4 text-brand-mute">
								Saving makes brand rev {revision + 1}. Drafts pick it up next time they open; approved
								editions keep the revision they were approved with.
							</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Foot -->
			<div
				class="mt-7 flex items-center justify-between gap-6 border-t border-brand-rule pt-5"
			>
				<StatusSquare tone={footTone} label={footLine} />
				{#if editable}
					<div class="flex flex-shrink-0 gap-2">
						<button
							type="button"
							on:click={discard}
							disabled={!dirty || saving}
							class="h-10 rounded-btn border border-brand-rule px-3.5 font-sans text-[14px] text-brand-ink disabled:opacity-40"
							>Discard</button
						>
						<button
							type="button"
							on:click={save}
							disabled={!dirty || saving}
							class="flex h-10 items-center gap-2 rounded-btn bg-brand-plum px-4 font-sans text-[14px] font-medium text-white disabled:opacity-40"
						>
							{saving ? 'Saving…' : `Save as rev ${revision + 1}`}
							<span class="block h-[7px] w-[7px] bg-brand-field" aria-hidden="true" />
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!--
	Removing a logo an approved edition is pinned to. The D10 typed-confirmation
	pattern (board `DLG-0`), reused rather than re-invented so the gesture that
	means "I understand this is not an undo" is the same everywhere.
	
	NAMES THE EDITIONS, because "used by 2 editions" is not enough to decide
	with — the buyer needs to know WHICH, and that those editions keep what they
	were approved with either way.
-->
{#if removing}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40 px-5"
		role="dialog"
		aria-modal="true"
		aria-label="Remove logo"
	>
		<div class="w-full max-w-[520px] rounded-md border-2 border-brand-ink bg-white p-6">
			<h2 class="font-display text-[19px] font-bold text-brand-ink">
				Remove the {removing.kind}
			</h2>
			<p class="mt-2.5 font-sans text-[14px] text-brand-slate">
				This takes it out of the kit from the next revision onward. Editions already approved keep
				the revision they were approved with, so nothing a customer has received changes.
			</p>

			<p class="mt-4 font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute">
				Approved editions pinned to it
			</p>
			<ul class="mt-1.5 border-t border-brand-rule">
				{#each removing.pinned as use (use.editionUid)}
					<li class="flex items-center justify-between gap-3 border-b border-brand-rule py-2">
						<span class="truncate font-sans text-[13.5px] text-brand-ink">{use.name}</span>
						<span class="flex-shrink-0 font-mono text-[11px] text-brand-slate"
							>brand rev {use.brandRevision}</span
						>
					</li>
				{/each}
			</ul>

			<label class="mt-5 block">
				<span class="font-sans text-[13px] text-brand-slate"
					>Type <span class="font-mono text-brand-ink">remove {removing.kind}</span> to confirm</span
				>
				<input
					bind:value={typed}
					autocomplete="off"
					class="mt-1.5 h-11 w-full rounded-btn border border-brand-rule px-3 font-mono text-[13.5px] text-brand-ink"
				/>
			</label>

			<div class="mt-5 flex items-center justify-end gap-3">
				<button
					type="button"
					on:click={() => {
						removing = null;
						typed = '';
					}}
					class="flex h-11 items-center rounded-btn border border-brand-rule px-4 font-sans text-[13.5px] text-brand-slate"
					>Cancel</button
				>
				<button
					type="button"
					on:click={confirmRemove}
					disabled={!removeConfirmed || removeBusy}
					class="flex h-11 items-center rounded-btn px-4 font-sans text-[13.5px] {removeConfirmed
						? 'bg-brand-alarm text-white'
						: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}"
					>{removeBusy ? 'Removing…' : 'Remove from the kit'}</button
				>
			</div>
		</div>
	</div>
{/if}
