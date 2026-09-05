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
	import { tick } from 'svelte';
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
	import AiLock from '$lib/components/studio/v2/AiLock.svelte';
	import VersionsPanel from '$lib/components/studio/v2/VersionsPanel.svelte';
	import EditReceipt from '$lib/components/studio/v2/EditReceipt.svelte';
	import ScopeProposal from '$lib/components/studio/v2/ScopeProposal.svelte';
	import ProofView from '$lib/components/studio/v2/ProofView.svelte';
	import {
		editTemplateBySaying,
		getTemplateRevisions,
		restoreTemplateRevision,
		renderTemplateProof
	} from '../../../api/template';
	import { createSaveQueue } from '$lib/components/studio/v2/save-queue.js';
	import { getBrandAssets, uploadBrandAsset } from '../../../api/brand-assets';
	import { SAMPLE_CASES, valuesFor } from '$lib/components/studio/v2/samples.js';
	import { summarize } from '$lib/components/studio/v2/overflow.js';
	import { editor, dirty } from '$lib/components/studio/v2/editor-store.js';
	import { SAMPLE_VALUES } from '$lib/campaigns/starters';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import { editionUrl } from '$lib/campaigns/nav';
	import { setCampaignDesign, recordDesignProof } from '../../../api/campaign';
	import {
		aiEditRequested,
		aiEditApplied,
		aiEditRefused,
		aiEditNoChange,
		aiEditFailed,
		aiProposalAccepted,
		aiProposalDismissed,
		aiProofRendered
	} from '$lib/campaigns/analytics.js';
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
	let instruction = '';
	let aiCancelling = false;
	let aiError = null;

	/* --------------------------------------------------------------- AI-2 */

	/** The last receipt and the last refusal. Only ever one of them is shown. */
	let receipt = null;
	let receiptScope = null;
	let proposal = null;
	let applyingProposal = false;

	/**
	 * Whether the next instruction is scoped to the selection.
	 *
	 * Defaults to ON whenever something is selected: someone who clicked an
	 * element and then started typing is talking about that element. The switch
	 * exists so they can say otherwise, not so they have to opt in to the safe
	 * behaviour.
	 */
	let scopeToSelection = true;
	$: activeSelection = scopeToSelection && selectedId ? selectedId : null;
	$: selectedLabel = layers.find((l) => l.id === selectedId)?.label || 'the selection';

	/** The run's own id, so a retry reconciles rather than starting a second. */
	let currentOperationId = null;
	let composerInput = null;
	/** Kept so a wider-scope proposal can re-run the same words. */
	let lastInstruction = '';

	/*
	 * Focus comes back to the composer when a run ends. B06-2.
	 *
	 * The lock took focus to Cancel; when the lock goes away that element goes
	 * with it, and focus would fall to the document body — leaving a keyboard
	 * user at the top of the page after every AI edit.
	 *
	 * `await tick()` is load-bearing, not defensive. The composer is disabled
	 * while a run holds the document, and clearing the operation does not undo
	 * that attribute until Svelte flushes — so focusing on the same turn is a
	 * silent no-op against a still-disabled input. Measured: focus landed on
	 * BODY every time without it.
	 */
	const returnFocusToComposer = async () => {
		await tick();
		composerInput?.focus?.();
	};

	/**
	 * Every document mutation goes through here while a run may be in flight.
	 * B06-1/B06-2.
	 *
	 * The AI lock covers the STAGE. It does not cover the rails, so adding a
	 * field or replacing a logo from them still reached the document underneath
	 * a run — and the result, computed from the html the agent was given, would
	 * then overwrite that edit without a trace. The lock was preventing the
	 * hazard visually and not actually.
	 *
	 * Refusing silently is right here: the controls are already visibly locked,
	 * so the only way to reach this is a keyboard user tabbing past the overlay,
	 * and an error message would explain a state they can see.
	 */
	function whileUnlocked(run) {
		if ($editor.operation) return;
		run();
	}

	/**
	 * Ask the AI for a change. B04-3.
	 *
	 * FLUSH FIRST, then save, then submit. The agent is given the document the
	 * buyer can actually see; submitting while local edits are unsaved would
	 * have it work from a version that exists nowhere, and its result would
	 * silently discard whatever was pending.
	 */
	async function runAi() {
		const text = instruction.trim();
		if (!text || $editor.operation) return;
		aiError = null;
		lastInstruction = text;

		// Await the save so baseRevision is a revision the server actually has.
		await saveQueue?.flushNow();
		if ($editor.saveState === 'conflict' || $editor.saveState === 'offline') {
			aiError = 'Save your changes first — the design could not be saved.';
			return;
		}

		const operationId =
			globalThis.crypto?.randomUUID?.() ??
			`op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
		currentOperationId = operationId;
		// A new run supersedes whatever the last one said about itself.
		receipt = null;
		proposal = null;
		editor.beginOperation(operationId);

		/*
		 * Captured now, not read inside the callbacks. The buyer can click
		 * somewhere else while the run is in flight, and the result belongs to the
		 * scope the instruction was given under — not to whatever is selected when
		 * it lands.
		 */
		const scopedTo = activeSelection;
		const scopeLabels = scopedTo ? [selectedLabel] : null;
		const startedAt = Date.now();

		// AI-7. The SHAPE of the request: whether it was scoped, and from where.
		// Never the instruction, and never the label of what was selected.
		aiEditRequested({ scope: scopedTo ? 'selection' : 'document' });

		await editTemplateBySaying(uid, text, {
			operationId,
			baseRevision: $editor.baseRevision,
			...(scopedTo ? { selectedNodeIds: [scopedTo], allowedScope: 'selection' } : {}),
			onStage: (s) => editor.operationStage(s?.stage || 'plan'),
			onDone: async (result) => {
				/*
				 * The run finished and nothing changed. The server did not commit it,
				 * so there is no revision to adopt and nothing to undo — treating it
				 * like a normal result would show an Undo button that undoes an
				 * earlier edit the buyer did not ask about.
				 */
				if (result?.noChange) {
					aiEditNoChange({
						scope: scopedTo ? 'selection' : 'document',
						ms: Date.now() - startedAt
					});
					editor.endOperation();
					receipt = result?.receipt || null;
					receiptScope = scopeLabels;
					aiError = scopedTo
						? `Nothing changed — that could not be done inside ${
								scopeLabels?.[0] || 'the selection'
						  }. Switch to Whole design to let it reach further.`
						: 'Nothing changed. Try describing it differently.';
					currentOperationId = null;
					returnFocusToComposer();
					return;
				}

				/*
				 * A reconciled retry carries no html — the server did not re-run
				 * the agent, it just told us the run had already finished. Fetch
				 * the saved design instead of committing an empty document.
				 */
				let html = result?.html;
				if (!html) {
					const fresh = await backend.get(`/templates/${uid}`);
					html = fresh?.template?.html;
					if (!html) {
						editor.endOperation();
						aiError = 'That edit finished, but the design could not be loaded. Reload the page.';
						currentOperationId = null;
						return;
					}
				}

				/*
				 * ONE transaction, so undo rejects the whole AI edit in a single
				 * step — the most likely thing a buyer wants after seeing a result
				 * they did not intend.
				 */
				const applied = editor.completeOperation(operationId, html);
				returnFocusToComposer();
				if (applied.applied) {
					instruction = '';
					refreshLayers();
					/*
					 * The server has already saved this, so the draft is clean at
					 * the revision the SERVER reports. Guessing base+1 here would
					 * desync the optimistic lock and 409 every later save.
					 */
					editor.saved({ revision: result?.revision, seq: $editor.localSeq });
					receipt = result?.receipt || null;
					// The client's label, not the server's: Layers and the receipt must
					// call the same element by the same name.
					receiptScope = scopeLabels || result?.scope || null;
					aiEditApplied({
						scope: scopedTo ? 'selection' : 'document',
						changed_count: result?.receipt?.changed?.length ?? 0,
						untouched_count: result?.receipt?.untouched?.nodes ?? 0,
						verified: Boolean(result?.receipt?.untouched?.verified),
						ms: Date.now() - startedAt
					});
				}
				currentOperationId = null;
			},
			onProposal: (payload) => {
				/*
				 * The run finished and the server refused to apply it. NOT an error:
				 * the draft is untouched, nothing was charged, and the buyer is being
				 * asked a question. The instruction is kept so "Apply" can re-run it
				 * with the scope lifted.
				 */
				editor.endOperation();
				proposal = payload;
				currentOperationId = null;
				returnFocusToComposer();
				aiEditRefused({
					scope: 'selection',
					// How many things it wanted to reach, not which. The count is what
					// says whether the scoping is fighting people; the names would say
					// what is on a customer's card.
					touch_count: payload?.touches?.length ?? 0,
					ms: Date.now() - startedAt
				});
			},
			onError: (err) => {
				// ST-04b: the draft AND the instruction survive, so the buyer can
				// reword rather than retype.
				editor.endOperation();
				aiError = err?.message || 'That change did not go through.';
				currentOperationId = null;
				returnFocusToComposer();
				aiEditFailed({ code: err?.code || 'unknown', ms: Date.now() - startedAt });
			}
		});
	}

	/**
	 * Undo/redo. Both replace the whole document, so the stage is re-read and a
	 * save is queued — an undone edit that never reaches the server would come
	 * back on the next reload.
	 */
	const stepHistory = (direction) => () => {
		if ($editor.operation) return;
		if (!(direction === 'undo' ? editor.undo() : editor.redo())) return;
		// The stage re-mounts off the `html` prop, so nothing pushes it here.
		refreshLayers();
		saveQueue?.nudge();
	};

	/* --------------------------------------------------------------- proof */

	/** `{ revision, url, at, bytes, totalMs, format, width, height }`. */
	let proof = null;
	let proofRendering = false;
	let proofError = null;
	let usingDesign = false;

	/**
	 * Render a proof of the saved revision. B05-1.
	 *
	 * Saves FIRST. A proof is a claim about what the server holds, so asking for
	 * one while the draft is unsaved would render the previous revision and
	 * label it with a number the buyer has already moved past — the failure this
	 * whole mode exists to prevent.
	 */
	async function reproof() {
		if (proofRendering || $editor.operation) return;
		proofError = null;

		await saveQueue?.flushNow();
		if ($editor.saveState === 'conflict' || $editor.saveState === 'offline') {
			proofError = 'Save your changes first — the design could not be saved.';
			return;
		}

		proofRendering = true;
		const sample = SAMPLE_CASES.find((c) => c.id === activeSample) || SAMPLE_CASES[0];
		const res = await renderTemplateProof(uid, {
			variables: { ...SAMPLE_VALUES, ...valuesFor(sample, metricKeys) }
		});
		proofRendering = false;

		if (!res?.dataUrl) {
			proofError = 'The server could not render this design.';
			return;
		}

		/*
		 * The revision comes from the RESPONSE, never from what we asked for. If
		 * a save landed between the request and the reply, this render is already
		 * a picture of the past and the badge has to say so.
		 */
		proof = {
			revision: res.revision,
			url: res.dataUrl,
			at: res.at,
			bytes: res.bytes,
			totalMs: res.totalMs,
			format: res.format,
			width: res.width,
			height: res.height
		};

		/*
		 * Tell the edition. Setup shows whether the design has been proofed at
		 * the revision it is about to freeze, and that card could only say "not
		 * proofed yet" while the proof existed nowhere but this tab.
		 *
		 * The fit counts come from the last full check across every sample, not
		 * from the one that happened to be rendered — a proof of the typical row
		 * says nothing about the longest one.
		 */
		aiProofRendered({
			ms: res.totalMs ?? 0,
			bytes: res.bytes ?? 0,
			format: res.format || 'png'
		});

		if (campaignUid && editionUid) {
			await recordDesignProof(campaignUid, editionUid, {
				revision: res.revision,
				sampleCount: fitSummary?.sampleCount ?? SAMPLE_CASES.length,
				overflowCount: fitSummary?.overflowCount ?? 0
			});
		}
	}

	/* ------------------------------------------------------------ versions */

	let versionsOpen = false;
	let versions = null;
	let versionsLoading = false;
	let versionsError = null;
	let restoring = null;

	/**
	 * Fetched on open and after every restore, never cached across them: the
	 * list is a claim about what the server holds, and a stale one would offer
	 * to restore a revision that is no longer the one shown.
	 */
	async function loadVersions() {
		versionsLoading = true;
		versionsError = null;
		const res = await getTemplateRevisions(uid);
		versionsLoading = false;
		// The api wrappers return null on failure rather than throwing, so an
		// unchecked assignment here would render an empty history as fact.
		if (!res?.revisions && !res?.head) {
			versionsError = 'The history could not be loaded.';
			return;
		}
		versions = res;
	}

	function toggleVersions() {
		versionsOpen = !versionsOpen;
		if (versionsOpen && !versions) loadVersions();
	}

	/**
	 * Restore. The server makes a NEW revision from the old content, so the
	 * draft is re-read from it rather than being patched locally — and the
	 * editor history is reset to that document, because undoing across a
	 * restore would put the stage into a state no revision ever held.
	 */
	async function restore(revision) {
		if (restoring !== null || $editor.operation) return;
		restoring = revision;
		const res = await restoreTemplateRevision(uid, revision);
		if (!res?.revision) {
			restoring = null;
			versionsError = 'That revision could not be restored.';
			return;
		}

		const fresh = await backend.get(`/templates/${uid}`);
		const html = fresh?.template?.html;
		restoring = null;
		if (!html) {
			versionsError = 'It was restored, but the design could not be reloaded. Reload the page.';
			return;
		}

		design = { ...design, html, revision: res.revision };
		editor.load({ html, revision: res.revision });
		saveQueue?.discardLocal(res.revision);
		refreshLayers();
		await loadVersions();
		showToast(`Restored rev ${revision} as rev ${res.revision}.`, 'default', 4000);
	}

	/**
	 * Accept the wider change. AI-2.
	 *
	 * Re-runs the SAME instruction with the scope lifted, rather than applying a
	 * stored candidate. The refused result was never committed anywhere, and
	 * keeping a server-side draft of a rejected edit so it could be replayed
	 * would mean storing a document the buyer has not agreed to — which is the
	 * thing the refusal exists to avoid.
	 */
	async function applyProposal() {
		if (!proposal || applyingProposal) return;
		applyingProposal = true;
		aiProposalAccepted({ touch_count: proposal?.touches?.length ?? 0 });
		const text = lastInstruction;
		proposal = null;
		scopeToSelection = false;
		instruction = text;
		await runAi();
		applyingProposal = false;
		// Back on afterwards: the next instruction is a fresh decision.
		scopeToSelection = true;
	}

	/** Cancel is a server operation; a closed socket cancels nothing. */
	async function cancelAi() {
		if (!currentOperationId) return;
		aiCancelling = true;
		try {
			await backend.post(`/template-studio/${uid}/operations/${currentOperationId}/cancel`, {});
		} catch (err) {
			/* already settled; the state below reports the truth */
		} finally {
			editor.endOperation();
			currentOperationId = null;
			aiCancelling = false;
			returnFocusToComposer();
		}
	}
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
	/**
	 * The gate on "Use this design". B05-2.
	 *
	 * Four conditions, and each one is a different way the campaign could end up
	 * pinned to something nobody has actually seen:
	 *
	 *   no design       nothing to pin.
	 *   unsaved work    the campaign records a SERVER revision, so pinning while
	 *                   the draft is ahead of the server would record a design
	 *                   the buyer is not looking at.
	 *   missing assets  a broken image does not fail loudly at render time. It
	 *                   makes one card per account with a hole in it, and nobody
	 *                   finds out until a customer says so.
	 *   no current proof
	 *                   the browser is not the renderer. Every other surface here
	 *                   is a drawing of the design; the proof is the only
	 *                   evidence of it, and pinning without one means the first
	 *                   server render of this design is the one that goes to
	 *                   customers.
	 */
	$: proofCurrent = Boolean(proof && proof.revision === ($editor.baseRevision || 0));
	$: useBlockedReason = !design
		? 'Nothing drawn yet · describe the card on the left or import HTML'
		: $editor.saveState !== 'saved'
		? 'Save your changes before using this design'
		: missingAssets.length
		? `${missingAssets.length} ${
				missingAssets.length === 1 ? 'image cannot' : 'images cannot'
		  } be resolved · fix in Brand before using this design`
		: !proofCurrent
		? 'Render a proof of this revision before using it'
		: null;
	$: useBlocked = Boolean(useBlockedReason);

	/** Metric keys the campaign supplies, which is what a field may bind to. */
	/**
	 * Which fields get a sample NUMBER.
	 *
	 * The campaign's metric contract when there is one — those are the fields
	 * real data will fill. Falling back to whatever the design binds means a
	 * design opened outside a campaign still previews with numbers in it; without
	 * the fallback every metric renders blank and the proof looks like a broken
	 * design rather than an unbound one.
	 */
	$: metricKeys = campaign?.metrics?.length
		? campaign.metrics.map((m) => m.key)
		: usedFields.filter((f) => !(f in SAMPLE_VALUES));
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
	/**
	 * S7 / B05-2. Records the revision in the campaign, THEN navigates.
	 *
	 * The order matters. Navigating first and recording afterwards would leave
	 * Setup showing the old revision until a reload, and a failure would be
	 * invisible — the buyer would be on a page that says the design was taken
	 * when nothing was written.
	 */
	async function useThisDesign() {
		if (!design || useBlocked || usingDesign) return;
		usingDesign = true;
		const res = await setCampaignDesign(campaignUid, uid);
		usingDesign = false;

		if (!res?.campaign) {
			showToast('That design could not be recorded on the campaign.', 'error', 5000);
			return;
		}

		const recorded = res.campaign.templateRevision ?? $editor.baseRevision;
		await goto(editionUrl(campaignUid, editionUid, 'setup'));
		showToast(
			editionApproved
				? `Using rev ${recorded}. This edition needs approving again.`
				: `Using rev ${recorded} for this edition.`,
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
			? {
					...design,
					html: $editor.html || design.html,
					/*
					 * From the store, not from `design`: `design` is the document as
					 * it was when the page opened, so after any save its revision is
					 * a number from the past. The shell compares it against the
					 * proof's revision to decide staleness, and the "Use this design"
					 * toast names it, so a frozen value is wrong in two places at
					 * once.
					 */
					revision: $editor.baseRevision || design.revision
			  }
			: { name: 'New design', html: '', width: 1200, height: 800, revision: 1 }}
		format={campaign?.format?.toUpperCase() || 'PNG'}
		breadcrumb={campaign ? `${campaign.name} · Setup` : null}
		campaignContext={inCampaign}
		saveState={design ? $editor.saveState : 'unsaved'}
		canUndo={$editor.canUndo && !$editor.operation}
		canRedo={$editor.canRedo && !$editor.operation}
		onUndo={stepHistory('undo')}
		onRedo={stepHistory('redo')}
		onRevisionClick={design ? toggleVersions : null}
		{versionsOpen}
		{proof}
		useDisabled={useBlocked || usingDesign}
		statusNote={useBlockedReason || (fitSummary && !fitSummary.ok ? fitSummary.label : null)}
		{editionApproved}
		on:back={back}
		on:use={useThisDesign}
		on:add={(e) => {
			whileUnlocked(() => {
				stageApi?.addElement(e.detail.kind);
				refreshLayers();
			});
		}}
	>
		<svelte:fragment slot="left" let:leftTab>
			{#if leftTab === 'say' && !design}
				<StudioStart {availableFields} {busy} />
			{:else if leftTab === 'say'}
				<p class="font-sans text-[13.5px] leading-[19px] text-brand-slate">
					{activeSelection
						? 'Describe a change. Selected: only that part changes.'
						: 'Describe a change. It starts from what you see now.'}
				</p>

				{#if lastInstruction && (receipt || proposal)}
					<!--
						The instruction, then what came of it. Kept in that order because
						the receipt is only meaningful as the answer to something the
						buyer said — a diff on its own is a list of numbers.
					-->
					<div class="mt-5 bg-brand-subtle p-3">
						<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
							{receiptScope?.length ? receiptScope.join(', ') : 'Whole design'} · rev {$editor.baseRevision}
						</p>
						<p class="mt-1 font-sans text-[13.5px] leading-[19px] text-brand-ink">
							{lastInstruction}
						</p>
					</div>
				{/if}

				{#if proposal}
					<div class="mt-3">
						<ScopeProposal
							{proposal}
							busy={applyingProposal}
							on:apply={applyProposal}
							on:dismiss={() => {
								aiProposalDismissed({ touch_count: proposal?.touches?.length ?? 0 });
								proposal = null;
							}}
						/>
					</div>
				{:else if receipt}
					<div class="mt-3">
						<EditReceipt
							{receipt}
							{layers}
							scope={receiptScope}
							canUndo={$editor.canUndo}
							on:undo={stepHistory('undo')}
						/>
					</div>
				{/if}
			{:else}
				<LayersTree
					rows={layers}
					{selectedId}
					on:select={(e) => whileUnlocked(() => stageApi?.selectById(e.detail.id))}
					on:toggle-lock={(e) => {
						if ($editor.operation) return;
						stageApi?.toggleLock(e.detail.id);
						refreshLayers();
					}}
					on:toggle-hide={(e) => {
						if ($editor.operation) return;
						stageApi?.toggleHide(e.detail.id);
						refreshLayers();
					}}
					on:rename={(e) => {
						if ($editor.operation) return;
						stageApi?.rename(e.detail.id, e.detail.label);
						refreshLayers();
					}}
					on:reorder={(e) => {
						if ($editor.operation) return;
						stageApi?.reorder(e.detail.id, e.detail.beforeId);
						refreshLayers();
					}}
				/>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="stage" let:mode let:zoom>
			<!--
				The lock sits OVER the stage rather than replacing it, so the design
				stays on screen while the AI works. Swapping it for a spinner would
				hide the very thing the buyer is about to compare the result against,
				and an edit that changes little would be indistinguishable from one
				that did nothing.
			-->
			{#if $editor.operation}
				<AiLock
					stage={$editor.operation.stage}
					fromRevision={$editor.baseRevision}
					cancelling={aiCancelling}
					on:cancel={cancelAi}
				/>
			{/if}
			{#if design && mode !== 'proof'}
				<StudioStage
					bind:api={stageApi}
					html={$editor.html || design.html}
					width={design.width}
					height={design.height}
					{zoom}
					editable={mode === 'design' && !$editor.operation}
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
				<ProofView
					{proof}
					designRevision={$editor.baseRevision || design.revision}
					rendering={proofRendering}
					error={proofError}
				/>
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
						if ($editor.operation) return;
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
						if ($editor.operation) return;
						stageApi?.setAssetSrc(e.detail.id, e.detail.asset.url, e.detail.asset.name);
						refreshLayers();
					}}
				/>
			{:else}
				<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">Document</p>
				<dl class="mt-2 border-t border-brand-rule">
					{#each [['Size', `${design?.width ?? 1200} × ${design?.height ?? 800}`], ['Fields bound', String(usedFields.length)], ['Revision', `rev ${$editor.baseRevision || design?.revision || 1}`]] as [label, value] (label)}
						<div class="flex items-baseline justify-between gap-3 border-b border-brand-rule py-2">
							<dt class="font-sans text-[13px] text-brand-slate">{label}</dt>
							<dd class="font-mono text-[11.5px] text-brand-ink">{value}</dd>
						</div>
					{/each}
				</dl>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="toolbar" let:mode>
			{#if mode === 'proof'}
				<button
					type="button"
					on:click={reproof}
					disabled={proofRendering || !design || Boolean($editor.operation)}
					class="h-8 flex-shrink-0 whitespace-nowrap rounded-btn bg-brand-ink px-3 font-sans text-[13px] font-semibold text-white disabled:bg-brand-rule disabled:text-brand-mute"
				>
					{proofRendering ? 'Rendering…' : `Re-proof rev ${$editor.baseRevision || 1}`}
				</button>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="versions">
			<VersionsPanel
				data={versions}
				loading={versionsLoading}
				error={versionsError}
				{restoring}
				on:restore={(e) => restore(e.detail.revision)}
			/>
		</svelte:fragment>

		<svelte:fragment slot="composer">
			{#if design}
				{#if selectedId}
					<!--
						Scope is visible and switchable (locked decision 4). The chip is
						the state, not a setting buried in a menu — a buyer who cannot
						see the scope cannot know why their instruction was refused.
					-->
					<p class="mb-2 flex flex-wrap items-center gap-1.5">
						<button
							type="button"
							on:click={() => (scopeToSelection = true)}
							aria-pressed={scopeToSelection}
							class="flex h-7 items-center gap-2 px-2 font-sans text-[12px] {scopeToSelection
								? 'bg-brand-powder font-semibold text-brand-ink'
								: 'text-brand-slate'}"
						>
							<span class="block h-2 w-2 flex-shrink-0 bg-brand-royal" aria-hidden="true" />
							Selected: {selectedLabel}
						</button>
						<button
							type="button"
							on:click={() => (scopeToSelection = false)}
							aria-pressed={!scopeToSelection}
							class="h-7 px-2 font-sans text-[12px] {scopeToSelection
								? 'text-brand-slate'
								: 'bg-brand-powder font-semibold text-brand-ink'}">Whole design</button
						>
					</p>
				{/if}
				<input
					bind:this={composerInput}
					bind:value={instruction}
					on:keydown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							runAi();
						}
					}}
					disabled={Boolean($editor.operation)}
					placeholder={activeSelection
						? `Describe a change to ${selectedLabel}…`
						: 'Describe a change…'}
					class="h-10 w-full rounded-btn border border-brand-rule px-3 font-sans text-[13.5px] text-brand-ink placeholder:text-brand-mute disabled:bg-brand-subtle"
				/>
				{#if aiError}
					<p class="mt-2 flex items-start gap-2">
						<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
						<span class="font-sans text-[12.5px] text-brand-slate">{aiError}</span>
					</p>
				{/if}
			{/if}
		</svelte:fragment>
	</StudioShell>
{/if}
