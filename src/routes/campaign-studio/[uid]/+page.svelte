<script>
	/**
	 * /campaign-studio/[uid] — the campaign-context design studio. B01.
	 *
	 * A separate route from /template-workspace/html/[uid] on purpose. The
	 * platform studio there is shipped and working, and B06-3 requires it to
	 * keep working; rewriting the component both surfaces run on is the surest
	 * way to break one while testing the other. When the new shell has been
	 * through B06 the two can converge.
	 *
	 * Full-bleed, outside the dashboard rail: this is a three-zone editing
	 * surface, not a page inside a shell.
	 */
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import StudioShell from '$lib/components/studio/v2/StudioShell.svelte';
	import StudioStart from '$lib/components/studio/v2/StudioStart.svelte';
	import StudioStage from '$lib/components/studio/v2/StudioStage.svelte';
	import LayersTree from '$lib/components/studio/v2/LayersTree.svelte';
	import InputsRail from '$lib/components/studio/v2/InputsRail.svelte';
	import BrandRail from '$lib/components/studio/v2/BrandRail.svelte';
	import ConflictDialog from '$lib/components/studio/v2/ConflictDialog.svelte';
	import { createSaveQueue } from '$lib/components/studio/v2/save-queue.js';
	import { getBrandAssets, uploadBrandAsset } from '../../../api/brand-assets';
	import { SAMPLE_CASES, valuesFor } from '$lib/components/studio/v2/samples.js';
	import { summarize } from '$lib/components/studio/v2/overflow.js';
	import { editor, dirty } from '$lib/components/studio/v2/editor-store.js';
	import { SAMPLE_VALUES } from '$lib/campaigns/starters';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import { editionUrl } from '$lib/campaigns/nav';
	import backend from '../../../service/backend';
	import { showToast } from '../../../store/toast.store';
	import Toast from '$lib/components/Toast.svelte';

	$: uid = $page.params.uid;
	/** Campaign context, so "Use this design" knows where to return. */
	$: campaignUid = $page.url.searchParams.get('campaign');
	$: editionUid = $page.url.searchParams.get('edition');
	$: inCampaign = Boolean(campaignUid && editionUid);

	let design = null;
	let campaign = null;
	let edition = null;
	let loadError = null;
	let busy = false;
	/** The live stage, so the rails can drive the canvas. */
	let stageApi = null;
	let layers = [];
	let selectedId = null;
	let usedFields = [];
	let bySample = {};
	let activeSample = 'typical';
	let missingAssets = [];
	let saveQueue = null;
	let conflict = null;
	let resolvingConflict = false;
	let recoveredDraft = null;
	let brandAssets = [];
	let uploadingAsset = false;

	/**
	 * S4 — "Use this design" is blocked while any image cannot be resolved.
	 *
	 * A design with a broken or remote image does not fail loudly at render
	 * time. It produces one card per account with a hole where the logo should
	 * be, and nobody finds out until a customer says so. Blocking here is the
	 * only cheap moment to catch it.
	 */
	$: useBlocked = !design || missingAssets.length > 0;

	/** Metric keys the campaign supplies, which is what a field may bind to. */
	$: metricKeys = (campaign?.metrics || []).map((m) => m.key);
	$: fitSummary = Object.keys(bySample).length ? summarize(bySample) : null;

	/**
	 * Re-check fit against EVERY sample after each transaction, not just the one
	 * on screen. A design is only correct when the hardest row fits, and the
	 * buyer should not have to click through five samples to discover that.
	 */
	function refreshFit() {
		if (!stageApi) return;
		usedFields = stageApi.usedFields();
		const valuesBySample = Object.fromEntries(
			SAMPLE_CASES.map((c) => [c.id, valuesFor(c, metricKeys)])
		);
		bySample = stageApi.checkAllSamples(valuesBySample);
	}

	/** Rebuilt after every transaction, because the tree IS the document. */
	const refreshLayers = () => {
		layers = stageApi ? stageApi.tree() : [];
		missingAssets = stageApi ? stageApi.missingAssets() : [];
		refreshFit();
	};

	/** Loaded once so the picker has something to offer. */
	async function loadBrandAssets() {
		const res = await getBrandAssets({ type: 'image', limit: 24 });
		brandAssets = (res?.assets || []).map((a) => ({ uid: a.uid, name: a.name, url: a.url }));
	}

	async function onUploadAsset(file) {
		uploadingAsset = true;
		try {
			await uploadBrandAsset(file, { type: 'image' });
			await loadBrandAssets();
		} finally {
			uploadingAsset = false;
		}
	}

	/**
	 * S6 — an approved edition is frozen against this design.
	 *
	 * Read from the edition rather than inferred from the campaign, because
	 * approval is per edition: the same design can be safely edited for a draft
	 * period while an approved one still points at the revision it froze.
	 */
	$: editionApproved = edition?.state === 'approved' || Boolean(edition?.approvalId);

	/** Field keys the design may bind to, from the campaign's metric contract. */
	$: availableFields = campaign
		? ['account_name', 'account_id', 'period', ...(campaign.metrics || []).map((m) => m.key)]
		: [];

	/**
	 * Load reactively, in the BROWSER only.
	 *
	 * Three attempts, and each failure taught something worth keeping:
	 *
	 *   onMount alone — the ids come from the $page store and editionUid read
	 *   back falsy, so the edition fetch was skipped and the S6 banner never
	 *   appeared. Silently: there was no error, the branch simply never ran.
	 *
	 *   A `loadedFor` guard — a reactive statement that both READS and WRITES
	 *   the same variable re-runs against a stale value. load() fired four
	 *   times per page view.
	 *
	 *   Reactive without the browser guard — it then ran during SSR, where
	 *   backend.get has no cookie to send. Vite says it plainly ("Avoid calling
	 *   fetch eagerly during server side rendering") and the server-rendered
	 *   markup came back as the empty start state, which is what the browser
	 *   then hydrated.
	 *
	 * So: reactive, so navigating between editions reloads; browser-only, so it
	 * has a session; no guard, because the ids only change on navigation and
	 * none of them is written by load().
	 */
	$: if (browser && uid) load(uid, campaignUid, editionUid);
	$: if (browser) loadBrandAssets();

	async function load(designUid, cUid, eUid) {
		loadError = null;
		try {
			const res = await backend.get(`/templates/${designUid}`);
			const t = res?.template;
			if (t) {
				design = {
					name: t.name || 'Campaign design',
					html: t.html || '',
					width: t.width || 1200,
					height: t.height || 800,
					// The server's revision, which is what the optimistic lock is
					// keyed on. Defaults to 1 for a design created before the field
					// existed, matching how the save route treats a missing value.
					revision: t.revision ?? 1
				};
				// The store owns the draft from here. Loading resets history, so
				// undo can never walk back past what the server actually had.
				editor.load({ html: design.html, revision: design.revision });

				saveQueue?.stop();
				saveQueue = createSaveQueue(editor, {
					uid: designUid,
					onConflict: (theirs) => (conflict = theirs)
				});

				/*
				 * A draft this browser kept when a save could not reach the server.
				 * Offered, never applied silently — the buyer may have moved on, and
				 * restoring their old work over a newer server revision without
				 * asking is the same mistake as a last-write-wins save.
				 */
				const recovered = saveQueue.recover(design.revision);
				if (recovered?.html && recovered.html !== design.html) {
					recoveredDraft = recovered;
				}
			}
		} catch (err) {
			loadError = 'Could not open that design.';
			return;
		}

		if (!cUid || !eUid) return;
		try {
			const res = await backend.get(`/campaigns/${cUid}/editions/${eUid}`);
			campaign = res?.campaign || null;
			edition = res?.edition || null;
		} catch (err) {
			// A missing edition only costs the field list and the S6 banner; the
			// studio still opens, because being unable to read context is not a
			// reason to refuse to show someone their own design. Logged rather
			// than swallowed — a silently missing banner is indistinguishable
			// from a design nobody has approved.
			console.warn('[campaign-studio] could not load edition context', err?.status, err?.message);
		}
	}

	/** Returns to Setup, which is where "Use this design" is meaningful. */
	/**
	 * "Keep mine" re-saves against THEIR revision, which makes the buyer's
	 * version the next one. Theirs is not lost — it is already a revision in
	 * the history, which is exactly why this is safe to offer as the default.
	 */
	async function keepMine() {
		resolvingConflict = true;
		try {
			const theirRevision = conflict?.revision ?? $editor.baseRevision;
			await backend.patch(`/template-draft/${uid}`, {
				html: $editor.html,
				expectedRevision: theirRevision,
				label: 'kept after conflict'
			});
			const res = await backend.get(`/templates/${uid}`);
			editor.saved({ revision: res?.template?.revision, seq: $editor.localSeq });
			saveQueue?.discardLocal($editor.baseRevision);
			conflict = null;
		} catch (err) {
			// Still conflicted, or offline. The dialog stays; nothing is discarded.
		} finally {
			resolvingConflict = false;
		}
	}

	/** Explicitly destructive, so it only ever happens on a direct click. */
	function takeTheirs() {
		if (!conflict?.html) return;
		design = { ...design, html: conflict.html, revision: conflict.revision };
		editor.load({ html: conflict.html, revision: conflict.revision });
		saveQueue?.discardLocal($editor.baseRevision);
		conflict = null;
		refreshLayers();
	}

	const back = () =>
		goto(inCampaign ? editionUrl(campaignUid, editionUid, 'setup') : '/dashboard/template');

	/**
	 * S7 — "Use this design" returns to Setup with a toast naming the revision.
	 *
	 * The revision is in the message because Setup, Review and the export
	 * manifest all name it, and a buyer who has just made several edits needs to
	 * know WHICH one the edition now points at. "Design updated" alone would
	 * leave them to guess.
	 */
	async function useThisDesign() {
		if (!design) return;
		await goto(editionUrl(campaignUid, editionUid, 'setup'));
		showToast(
			editionApproved
				? `Using rev ${design.revision}. This edition needs approving again.`
				: `Using rev ${design.revision} for this edition.`,
			editionApproved ? 'error' : 'default',
			4000
		);
	}
</script>

<svelte:head><title>{design?.name || 'Design'} · Pictify studio</title></svelte:head>

<Toast />

{#if conflict}
	<ConflictDialog
		theirs={conflict}
		busy={resolvingConflict}
		on:keep-mine={keepMine}
		on:take-theirs={takeTheirs}
	/>
{/if}

{#if loadError}
	<div class="flex h-screen items-center justify-center bg-brand-canvas px-6">
		<div>
			<StatusSquare tone="blocked" label={loadError} />
			<button
				type="button"
				on:click={back}
				class="mt-3 block font-sans text-[13.5px] text-brand-royal underline">Go back</button
			>
		</div>
	</div>
{:else}
	<StudioShell
		design={design
			? { ...design, html: $editor.html || design.html }
			: { name: 'New design', html: '', width: 1200, height: 800, revision: 1 }}
		format={campaign?.format?.toUpperCase() || 'PNG'}
		breadcrumb={campaign ? `${campaign.name} · Setup` : null}
		campaignContext={inCampaign}
		saveState={design ? $editor.saveState : 'unsaved'}
		useDisabled={useBlocked}
		statusNote={design
			? missingAssets.length
				? `${missingAssets.length} ${
						missingAssets.length === 1 ? 'image cannot' : 'images cannot'
				  } be resolved · fix in Brand before using this design`
				: fitSummary && !fitSummary.ok
				? fitSummary.label
				: null
			: 'Nothing drawn yet · describe the card on the left or import HTML'}
		{editionApproved}
		on:back={back}
		on:use={useThisDesign}
		on:add={(e) => {
			stageApi?.addElement(e.detail.kind);
			refreshLayers();
		}}
	>
		<svelte:fragment slot="left" let:leftTab>
			{#if leftTab === 'say' && !design}
				<StudioStart {availableFields} {busy} />
			{:else if leftTab === 'say'}
				<p class="font-sans text-[13.5px] text-brand-slate">
					Describe a change. It starts from what you see now.
				</p>
			{:else}
				<LayersTree
					rows={layers}
					{selectedId}
					on:select={(e) => stageApi?.selectById(e.detail.id)}
					on:toggle-lock={(e) => {
						stageApi?.toggleLock(e.detail.id);
						refreshLayers();
					}}
					on:toggle-hide={(e) => {
						stageApi?.toggleHide(e.detail.id);
						refreshLayers();
					}}
					on:rename={(e) => {
						stageApi?.rename(e.detail.id, e.detail.label);
						refreshLayers();
					}}
					on:reorder={(e) => {
						stageApi?.reorder(e.detail.id, e.detail.beforeId);
						refreshLayers();
					}}
				/>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="stage" let:mode let:zoom>
			{#if design && mode !== 'proof'}
				<StudioStage
					bind:api={stageApi}
					html={$editor.html || design.html}
					width={design.width}
					height={design.height}
					{zoom}
					editable={mode === 'design'}
					sampleValues={{
						...SAMPLE_VALUES,
						...valuesFor(
							SAMPLE_CASES.find((c) => c.id === activeSample) || SAMPLE_CASES[0],
							metricKeys
						)
					}}
					on:ready={refreshLayers}
					on:selection={(e) => (selectedId = e.detail?.count === 1 ? e.detail.id : null)}
					on:transaction={(e) => {
						editor.commit(e.detail.label, e.detail.html);
						refreshLayers();
						saveQueue?.nudge();
					}}
				/>
			{:else if design}
				<p class="font-sans text-[13.5px] text-brand-mute">
					No proof yet. Render one to see exactly what the server produces.
				</p>
			{:else}
				<p class="font-sans text-[13.5px] text-brand-mute">No design chosen yet.</p>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="right" let:rightTab>
			{#if rightTab === 'inputs'}
				<InputsRail
					used={usedFields}
					available={metricKeys}
					{bySample}
					{activeSample}
					on:sample={(e) => (activeSample = e.detail.id)}
					on:insert={(e) => {
						stageApi?.addElement('field', { field: e.detail.field });
						refreshLayers();
					}}
				/>
			{:else if rightTab === 'brand'}
				<BrandRail
					missing={missingAssets}
					assets={brandAssets}
					brandName={campaign?.brand?.name || campaign?.name || ''}
					uploading={uploadingAsset}
					on:upload={(e) => onUploadAsset(e.detail.file)}
					on:replace={(e) => {
						stageApi?.setAssetSrc(e.detail.id, e.detail.asset.url, e.detail.asset.name);
						refreshLayers();
					}}
				/>
			{:else}
				<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">Document</p>
				<dl class="mt-2 border-t border-brand-rule">
					{#each [['Size', `${design?.width ?? 1200} × ${design?.height ?? 800}`], ['Fields bound', String(usedFields.length)], ['Revision', `rev ${design?.revision ?? 1}`]] as [label, value] (label)}
						<div class="flex items-baseline justify-between gap-3 border-b border-brand-rule py-2">
							<dt class="font-sans text-[13px] text-brand-slate">{label}</dt>
							<dd class="font-mono text-[11.5px] text-brand-ink">{value}</dd>
						</div>
					{/each}
				</dl>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="composer">
			{#if design}
				<input
					placeholder="Describe a change…"
					class="h-10 w-full rounded-btn border border-brand-rule px-3 font-sans text-[13.5px] text-brand-ink placeholder:text-brand-mute"
				/>
			{/if}
		</svelte:fragment>
	</StudioShell>
{/if}
