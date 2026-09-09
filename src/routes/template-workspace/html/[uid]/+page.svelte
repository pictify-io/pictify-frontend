<script>
	/**
	 * /template-workspace/html/[uid] — the template studio. PS-7.
	 *
	 * Now mounts the v2 studio shell in `context="template"`. The v1
	 * `TemplateStudio` (Say it | HTML pane, ProofStage, InputsRail) never had
	 * element selection: you could describe a change or edit the markup, but
	 * you could not click a heading and drag it. That is the gap this closes,
	 * and it is why PS-7 was pulled ahead of the Code split — a user on this
	 * route reasonably expects to be able to select things.
	 *
	 * ONE SHELL, TWO CONTEXTS. Everything here is the campaign studio's wiring
	 * with the data layer swapped: the same editor store, the same save queue,
	 * the same stage. What differs is where the document comes from and what
	 * the top bar does with it.
	 *
	 * THE SAVE PATH IS ALREADY THE RIGHT ONE. `createSaveQueue` PATCHes
	 * `/template-draft/:uid` with `expectedRevision`, which IS the platform
	 * template compare-and-swap route — the campaign studio was always saving
	 * platform templates through it. So revisions, conflict handling and the
	 * local backup come across unchanged rather than being re-implemented.
	 *
	 * `?studio=v1` keeps the old studio for one release.
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	import TemplateStudio from '$lib/components/studio/TemplateStudio.svelte';
	import StudioShell from '$lib/components/studio/v2/StudioShell.svelte';
	import StudioStage from '$lib/components/studio/v2/StudioStage.svelte';
	import LayersTree from '$lib/components/studio/v2/LayersTree.svelte';
	import VersionsPanel from '$lib/components/studio/v2/VersionsPanel.svelte';
	import ConflictDialog from '$lib/components/studio/v2/ConflictDialog.svelte';
	import AiLock from '$lib/components/studio/v2/AiLock.svelte';
	import SelectionRail from '$lib/components/studio/v2/SelectionRail.svelte';
	import VariablePopover from '$lib/components/studio/v2/VariablePopover.svelte';
	import Toast from '$lib/components/Toast.svelte';

	import { editor } from '$lib/components/studio/v2/editor-store.js';
	import { createSaveQueue } from '$lib/components/studio/v2/save-queue.js';
	import { extractInputs, typeFor } from '$lib/utils/template-tokens.js';
	import { rangeForNode, nodeForOffset } from '$lib/components/studio/v2/code-map.js';
	import { previewTemplateHtml, renderTemplate } from '../../../../api/template';
	import ProofView from '$lib/components/studio/v2/ProofView.svelte';
	import UseItCard from '$lib/components/studio/UseItCard.svelte';
	import EditReceipt from '$lib/components/studio/v2/EditReceipt.svelte';
	import ScopeProposal from '$lib/components/studio/v2/ScopeProposal.svelte';
	import UsingLine from '$lib/components/campaigns/UsingLine.svelte';
	import { editTemplateBySaying } from '../../../../api/template';
	import {
		aiEditRequested,
		aiEditApplied,
		aiEditRefused,
		aiEditNoChange,
		aiEditFailed,
		aiProposalAccepted,
		aiProposalDismissed
	} from '$lib/campaigns/analytics.js';
	import { activeApiToken, getAPITokenAction } from '../../../../store/user.store';
	import backend from '../../../../service/backend';
	import { showToast } from '../../../../store/toast.store';

	$: uid = $page.params.uid;
	$: preview = $page.url.searchParams.get('preview');
	/** The escape hatch, for one release. */
	$: useV1 = $page.url.searchParams.get('studio') === 'v1';

	let template = null;
	let loadError = null;
	let saveQueue = null;
	let stageApi = null;
	let selectedId = null;

	/* ── Say it (PS-5 item 3) ────────────────────────────────────────────── */
	let instruction = '';
	let lastInstruction = '';
	let aiError = null;
	let receipt = null;
	let receiptScope = null;
	let proposal = null;
	let currentOperationId = null;
	let composerInput = null;
	/** Scope is visible and switchable (locked decision 4). */
	let scopeToSelection = true;
	let applyingProposal = false;
	let aiCancelling = false;
	$: activeSelection = scopeToSelection && selectedId ? selectedId : null;
	$: selectedLabel = layers.find((l) => l.id === selectedId)?.label || 'the selection';

	const returnFocusToComposer = async () => {
		await tick();
		composerInput?.focus();
	};

	/**
	 * Ask the AI for a change.
	 *
	 * FLUSH FIRST, then submit. The agent is given the document the buyer can
	 * actually see; submitting while local edits are unsaved would have it work
	 * from a version that exists nowhere, and its result would silently discard
	 * whatever was pending.
	 */
	async function runAi() {
		const text = instruction.trim();
		if (!text || $editor.operation) return;
		aiError = null;
		lastInstruction = text;

		await saveQueue?.flushNow();
		if ($editor.saveState === 'conflict' || $editor.saveState === 'offline') {
			aiError = 'Save your changes first — the template could not be saved.';
			return;
		}

		const operationId =
			globalThis.crypto?.randomUUID?.() ??
			`op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
		currentOperationId = operationId;
		receipt = null;
		proposal = null;
		editor.beginOperation(operationId);

		/*
		 * Captured now, not read inside the callbacks: the buyer can select
		 * something else while the run is in flight, and the result belongs to
		 * the scope the instruction was given under.
		 */
		const scopedTo = activeSelection;
		const scopeLabels = scopedTo ? [selectedLabel] : null;
		const startedAt = Date.now();
		// The SHAPE of the request only — never the instruction, never the label.
		aiEditRequested({ scope: scopedTo ? 'selection' : 'document' });

		await editTemplateBySaying(uid, text, {
			operationId,
			baseRevision: $editor.baseRevision,
			...(scopedTo ? { selectedNodeIds: [scopedTo], allowedScope: 'selection' } : {}),
			onStage: (stage) => editor.operationStage(stage?.stage || 'plan'),
			onDone: async (result) => {
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

				// A reconciled retry carries no html: the server did not re-run the
				// agent, it reported a run that had already finished.
				let html = result?.html;
				if (!html) {
					const fresh = await backend.get(`/templates/${uid}`);
					html = fresh?.template?.html;
					if (!html) {
						editor.endOperation();
						aiError = 'That edit finished, but the template could not be loaded. Reload the page.';
						currentOperationId = null;
						return;
					}
				}

				// ONE transaction, so undo rejects the whole AI edit in a single step.
				const applied = editor.completeOperation(operationId, html);
				returnFocusToComposer();
				if (applied.applied) {
					instruction = '';
					refreshLayers();
					// The revision the SERVER reports. Guessing base+1 would desync the
					// optimistic lock and 409 every later save.
					editor.saved({ revision: result?.revision, seq: $editor.localSeq });
					receipt = result?.receipt || null;
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
				// Not an error: the draft is untouched and the buyer is being asked a
				// question. The instruction is kept so Apply can re-run it unscoped.
				editor.endOperation();
				proposal = payload;
				currentOperationId = null;
				returnFocusToComposer();
				aiEditRefused({
					scope: 'selection',
					touch_count: payload?.touches?.length ?? 0,
					ms: Date.now() - startedAt
				});
			},
			onError: (err) => {
				// The draft AND the instruction survive, so the buyer can reword
				// rather than retype.
				editor.endOperation();
				aiError = err?.message || 'That change did not go through.';
				currentOperationId = null;
				returnFocusToComposer();
				aiEditFailed({ code: err?.code || 'unknown', ms: Date.now() - startedAt });
			}
		});
	}

	/**
	 * Cancel is a SERVER operation: a closed socket cancels nothing, so this
	 * tells the server rather than just dropping the listener. While a run holds
	 * the document it is the only control anyone has.
	 */
	async function cancelAi() {
		if (!currentOperationId) return;
		aiCancelling = true;
		try {
			await backend.post(`/template-studio/${uid}/operations/${currentOperationId}/cancel`, {});
		} catch (err) {
			/* already settled; the run's own callbacks report the truth */
		} finally {
			aiCancelling = false;
		}
	}

	/** Re-run the refused instruction with the scope lifted. */
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

	/* ── Render (PS-5) ───────────────────────────────────────────────────── */
	/** Which mode the shell shows; bound so a finished render can present itself. */
	let mode = 'design';
	/** `{ revision, url, width, height, format, bytes, totalMs, at }`. */
	let proof = null;
	let rendering = false;
	let renderError = null;
	/** Set on a 429: the button is replaced by an upgrade line, not just greyed. */
	let quotaMessage = null;

	/*
	 * Enabled whenever the document parses and no AI operation holds the lock.
	 * `codeValid` is the parse gate — rendering a document the engine will
	 * reject spends a render to be told what the studio already knew.
	 *
	 * AND an API key, because `POST /templates/:uid/render` is registered behind
	 * `verifyApiToken`: it is the external API route, and there is no
	 * cookie-authenticated render. Without a key it answers 401, so offering an
	 * enabled button would promise a render that cannot happen.
	 */
	$: renderKey = $activeApiToken?.token || '';
	$: renderBlocked = Boolean($editor.operation) || rendering || !codeValid || !uid || !renderKey;

	async function onRender() {
		if (renderBlocked) return;
		rendering = true;
		renderError = null;
		quotaMessage = null;
		// The proof on screen is now older than what is being rendered; the
		// stale banner is driven off revision, which this leaves untouched.
		const startedAt = Date.now();
		const revision = $editor.baseRevision || template?.revision || 1;
		try {
			// Saved first: the render path reads the SAVED template, so rendering
			// with unsaved edits would proof a document the buyer is not looking at.
			await saveQueue?.flushNow();
			const res = await renderTemplate(uid, { ...sampleValues }, {
				format: template?.outputFormat === 'pdf' ? 'pdf' : 'png',
				width: template?.width || 1200,
				height: template?.height || 630,
				// The buyer's own key, to our own backend. It is what the route
				// authenticates with, and it is the same key Use it shows them.
				apiKey: renderKey
			});
			const url = res?.url || res?.image?.url || res?.results?.[0]?.url || null;
			// The wrappers can resolve with nothing; an empty proof shown as a
			// success is worse than an error, because it looks like it worked.
			if (!url) {
				renderError = res?.error || 'The renderer returned no file.';
				return;
			}
			proof = {
				revision,
				url,
				width: res?.width || template?.width || 1200,
				height: res?.height || template?.height || 630,
				format: res?.format || (template?.outputFormat === 'pdf' ? 'pdf' : 'png'),
				bytes: res?.bytes || res?.size || 0,
				// Measured round trip. Named as elapsed time, not as server time,
				// because that is what it is.
				totalMs: Date.now() - startedAt,
				at: Date.now()
			};
			mode = 'proof';
		} catch (err) {
			if (err?.status === 429) {
				quotaMessage = err?.data?.message || err?.message || 'Plan limit reached.';
			} else {
				renderError = err?.data?.message || err?.message || 'That render did not go through.';
			}
		} finally {
			rendering = false;
		}
	}

	/** Open state of the "+ Variable" popover (PS-4). */
	let pickingVariable = false;

	/**
	 * Put `{{name}}` where the buyer is working.
	 *
	 * Design writes it into the selected text element; Code inserts it at the
	 * caret. Nothing is recorded anywhere else — a variable is real because the
	 * template references it (locked decision 5), so the insert IS the creation.
	 */
	function insertVariable(name, mode) {
		pickingVariable = false;
		if (!name) return;
		if (mode === 'code') {
			codePane?.insertAtCursor(`{{${name}}}`);
			return;
		}
		if (!selectedId) return;
		// setBinding refuses a container — only a leaf holds text — and says so
		// rather than silently doing nothing.
		if (stageApi?.setBinding(selectedId, name) === false) {
			showToast('Pick a text element first — a group cannot show a variable.', 'error');
		}
	}

	/* ── Code mode (PS-2/PS-3) ───────────────────────────────────────────── */
	let codePane = null;
	let codeCaretLine = null;

	/*
	 * READ FROM `$editor`, NOT `editor.codeBuffer()`.
	 *
	 * Svelte re-runs a reactive statement only when an identifier it can SEE in
	 * the statement changes. `editor.codeBuffer()` names the store object, not
	 * its value, so it would run once and never again — the pane mounts empty
	 * and stays empty however the document changes. Silent staleness, not an
	 * error, and not something the type checker catches.
	 */
	$: codeBuffer = $editor.codeBuffer ?? $editor.html ?? '';
	$: codeValid = editor.codeIsRenderable(codeBuffer);
	/** Derived from the tokens, which are the contract (locked decision 5). */
	$: codeVariableCount = new Set(
		[...String(codeBuffer || '').matchAll(/\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g)].map((m) => m[1])
	).size;
	/*
	 * The selected element's line. Read from the BUFFER, not the document: the
	 * offsets have to index the text the buyer is actually looking at.
	 */
	$: codeSelectedLine = selectedId
		? (rangeForNode(codeBuffer, selectedId)?.line ?? null)
		: codeCaretLine;


	/*
	 * ENTERING CODE REGENERATES THE BUFFER FROM THE DOCUMENT.
	 *
	 * `commit()` updates `html` but deliberately NOT `codeBuffer` — the buffer is
	 * the user's raw text while they are typing, and rewriting it under the caret
	 * is the thing PS-3 exists to prevent. But nothing was calling `serialize()`
	 * either, so after a visual or AI edit the buffer still held the document as
	 * it was when the page loaded. Opening Code then showed stale text, and
	 * typing one character into it committed that stale document over the real
	 * one. Measured on a fresh template: the canvas held a 3,125-character
	 * drafted design and the code pane showed the 182-character seed.
	 *
	 * `serialize()` is the documented moment for this — "run after a visual or
	 * AI edit, and when leaving Code" — and entering Code is the last instant
	 * that is true before anyone can type.
	 */
	let lastMode = null;
	$: if (mode !== lastMode) {
		const entering = mode;
		lastMode = mode;
		/*
		 * The fresh html is assigned to `codeBuffer` DIRECTLY as well as into the
		 * store. `$: codeBuffer = $editor…` is a separate reactive statement, and
		 * Svelte orders statements by dependency — that one can run before this
		 * one in the same flush, in which case the pane renders the value from
		 * before the serialize. Measured: identical code passed with a
		 * `console.log` in this block and failed without it, because the extra
		 * `$editor` read reordered the two. Not something to leave to chance.
		 */
		// Never mid-run: the AI owns the document until it finishes.
		if (entering === 'code' && !$editor.operation) codeBuffer = editor.serialize().html;
	}

	function onCodeChange(event) {
		editor.setHtmlFromCode(event.detail.html);
	}

	/** Caret → element: the code half of one shared selection. */
	function onCodeCaret(event) {
		codeCaretLine = event.detail.line;
		const id = nodeForOffset(codeBuffer, event.detail.offset);
		if (id && id !== selectedId) {
			selectedId = id;
			stageApi?.selectById(id);
		}
	}
	let layers = [];
	let conflict = null;
	let versionsOpen = false;
	let sampleValues = {};

	/**
	 * Preview data for a template with Handlebars logic, rendered by the server.
	 *
	 * The client can substitute `{{token}}` but cannot evaluate `{{#if}}` or run
	 * a helper, so for these documents the only honest preview is the renderer's
	 * own output. Passed down rather than reached for inside the stage so the
	 * component stays usable in the campaign context, which renders elsewhere.
	 */
	const renderPreview = ({ html: source, variables, width, height }) =>
		previewTemplateHtml({
			html: source,
			variableDefinitions: template?.variableDefinitions || [],
			variables,
			jsEnabled: Boolean(template?.jsEnabled),
			strictVariables: false,
			width,
			height,
			format: 'png'
		});
	/** The full `describe()` payload — the inspector renders from this. */
	let selection = null;

	/**
	 * The contract, derived from the html on every change — never stored
	 * separately, so the rail cannot claim an input the template does not have.
	 * Ported from the v1 studio so both agree on what counts as a variable.
	 */

	$: html = $editor.html || template?.html || '';
	$: variables = extractInputs(html).map((name) => ({ name, type: typeFor(name) }));

	onMount(async () => {
		/*
		 * Nothing else on this page loads the API key — the studio sits outside
		 * the dashboard rail — and without it the Use it snippet hands the buyer
		 * `YOUR_API_KEY` to paste into a call that will not work.
		 */
		getAPITokenAction().catch(() => {});
		try {
			const res = await backend.get(`/templates/${uid}`);
			const t = res?.template;
			if (!t) {
				loadError = 'Template not found';
				return;
			}
			if (t.engine !== 'html') {
				// `?from=studio` stops the render page bouncing it straight back.
				goto(`/dashboard/template/${uid}/render?from=studio`, { replaceState: true });
				return;
			}
			template = t;
			sampleValues = { ...(t.sampleValues || {}) };
			if (!useV1) {
				editor.load({ html: t.html || '', revision: t.revision || 1 });
				saveQueue = createSaveQueue(editor, {
					uid: t.uid,
					onConflict: (theirs) => (conflict = theirs)
				});
				await tick();
				refreshLayers();

				// `?mode=html` opens Code directly — the deep link a pasted design
				// arrives on, and the one to hand someone who wants the markup.
				if ($page.url.searchParams.get('mode') === 'html') mode = 'code';

				/*
				 * `?draft=` is a described template arriving from Start. Run it once
				 * and strip the parameter, so a reload does not draft again — the
				 * buyer would be charged twice for one instruction.
				 */
				const draft = $page.url.searchParams.get('draft');
				if (draft) {
					goto(`/template-workspace/html/${uid}`, { replaceState: true, noScroll: true });
					instruction = draft;
					runAi();
				}
			}
		} catch (err) {
			loadError = err?.message || 'Failed to load template';
		}
	});

	onDestroy(() => saveQueue?.stop());

	function refreshLayers() {
		layers = stageApi ? stageApi.tree() : [];
	}

	/** Every stage gesture is one transaction, one history entry, one save. */
	function onTransaction(event) {
		editor.commit(event.detail.label, event.detail.html);
		refreshLayers();
		saveQueue?.nudge();
	}

	function stepHistory(direction) {
		return () => {
			if ($editor.operation) return;
			direction === 'undo' ? editor.undo() : editor.redo();
			saveQueue?.nudge();
			tick().then(refreshLayers);
		};
	}

	/** Guard every stage call while the AI holds the lock — the api goes null. */
	function whileUnlocked(run) {
		if ($editor.operation) return;
		run();
	}

	function setSample(name, value) {
		sampleValues = { ...sampleValues, [name]: value };
	}

	/*
	 * PS-9. Every inspector field is one stage call, one transaction, one save.
	 * They funnel through here rather than each handler scheduling its own, so
	 * "one gesture, one entry" cannot be forgotten in a new field.
	 */
	function fromRail(run) {
		return (event) => {
			if ($editor.operation || !stageApi) return;
			if (run(event.detail) === false) return;
			refreshLayers();
			saveQueue?.nudge();
		};
	}
</script>

<svelte:head>
	<title>{template?.name ? `${template.name} | Pictify.io` : 'Template studio | Pictify.io'}</title>
</svelte:head>

{#if loadError}
	<div
		class="flex h-screen flex-col items-center justify-center gap-3 bg-brand-paper px-6 text-center"
	>
		<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">Template</span>
		<p class="font-display text-xl font-extrabold tracking-[-0.02em] text-brand-ink">{loadError}</p>
		<a
			href="/dashboard/template"
			class="rounded-btn bg-brand-ink px-4 py-2 font-sans text-[13px] font-bold text-white hover:opacity-90"
		>
			Back to templates
		</a>
	</div>
{:else if template && useV1}
	<!-- The old studio, kept addressable for one release. -->
	<TemplateStudio {template} initialMode="say" {preview} />
{:else if template}
	<!--
		Render is disabled rather than absent: it lands in PS-5, and a top bar
		that is already the shape it will keep, with one control honestly greyed,
		reads better than one that grows a new primary next week.
	-->
	<StudioShell
		context="template"
		codeEnabled={true}
		{codeBuffer}
		{codeSelectedLine}
		{codeVariableCount}
		{codeValid}
		bind:codeApi={codePane}
		on:change={onCodeChange}
		on:caret={onCodeCaret}
		design={{
			name: template.name || 'Untitled template',
			html,
			width: template.width || 1200,
			height: template.height || 630,
			revision: $editor.baseRevision || template.revision || 1
		}}
		format={(template.outputFormat === 'pdf' ? 'PDF' : 'PNG')}
		breadcrumb="Templates"
		saveState={$editor.saveState}
		canUndo={$editor.canUndo && !$editor.operation}
		canRedo={$editor.canRedo && !$editor.operation}
		onUndo={stepHistory('undo')}
		onRedo={stepHistory('redo')}
		onRevisionClick={() => (versionsOpen = !versionsOpen)}
		{versionsOpen}
		bind:mode
		{proof}
		renderDisabled={renderBlocked}
		statusNote={quotaMessage
			? `Plan limit reached · ${quotaMessage}`
			: !renderKey && !$editor.operation
				? 'Render needs an API key · create one in Settings'
				: null}
		on:render={onRender}
		on:back={() => goto('/dashboard/template')}
		on:deselect={() => whileUnlocked(() => stageApi?.select(null))}
		on:add={(e) => whileUnlocked(() => {
			stageApi?.addElement(e.detail.kind);
			refreshLayers();
		})}
	>
		<svelte:fragment slot="versions">
			{#if versionsOpen}
				<VersionsPanel
					entries={editor.historyEntries()}
					on:close={() => (versionsOpen = false)}
				/>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="left" let:leftTab>
			{#if leftTab === 'layers'}
				<LayersTree
					rows={layers}
					{selectedId}
					on:select={(e) => whileUnlocked(() => stageApi?.selectById(e.detail.id))}
					on:toggleLock={(e) => whileUnlocked(() => { stageApi?.toggleLock(e.detail.id); refreshLayers(); })}
					on:toggleHide={(e) => whileUnlocked(() => { stageApi?.toggleHide(e.detail.id); refreshLayers(); })}
					on:rename={(e) => whileUnlocked(() => { stageApi?.rename(e.detail.id, e.detail.label); refreshLayers(); })}
				/>
			{:else}
				<div class="p-4">
					<p class="font-sans text-[13.5px] leading-[19px] text-brand-slate">
						{activeSelection
							? 'Describe a change. Selected: only that part changes.'
							: 'Describe a change. It starts from what you see now.'}
					</p>

					{#if lastInstruction && (receipt || proposal)}
						<!--
							The instruction, then what came of it — in that order, because a
							receipt is only meaningful as the answer to something the buyer
							said. A diff on its own is a list of numbers.
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
				</div>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="stage" let:mode let:zoom>
			{#if $editor.operation}
				<AiLock
					stage={$editor.operation.stage}
					fromRevision={$editor.baseRevision}
					cancelling={aiCancelling}
					on:cancel={cancelAi}
				/>
			{/if}
			{#if mode !== 'proof'}
				<StudioStage
					bind:api={stageApi}
					{html}
					width={template.width || 1200}
					height={template.height || 630}
					{zoom}
					editable={mode === 'design' && !$editor.operation}
					{sampleValues}
					{renderPreview}
					on:ready={refreshLayers}
					on:selection={(e) => {
						selection = e.detail || null;
						selectedId = e.detail?.count === 1 ? e.detail.id : null;
					}}
					on:transaction={onTransaction}
				/>
			{:else}
				<ProofView
					context="template"
					{proof}
					{rendering}
					error={renderError}
					designRevision={$editor.baseRevision || template.revision || 1}
					on:copyfailed={() =>
						showToast('The browser would not let us copy. Select the URL instead.', 'error')}
				/>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="right" let:rightTab let:mode>
			{#if rightTab === 'inputs'}
				<!--
					Derived from the {{tokens}} in the html on every change, never
					stored alongside it — a stored list can claim a variable the
					template no longer has (locked decision 5).
				-->
				<div class="flex flex-col gap-3 p-4">
					<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
						{variables.length}
						{variables.length === 1 ? 'variable' : 'variables'}
					</p>
					{#each variables as v (v.name)}
						<label class="flex flex-col gap-1">
							<span class="flex items-center gap-2">
								<span class="font-mono text-[12px] text-brand-ink">{v.name}</span>
								<span
									class="rounded-btn border border-brand-rule px-1.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-brand-mute"
									>{v.type}</span
								>
							</span>
							<input
								value={sampleValues[v.name] ?? ''}
								on:input={(e) => setSample(v.name, e.currentTarget.value)}
								placeholder="Sample value"
								class="h-8 rounded-btn border border-brand-rule px-2 font-sans text-[13px] text-brand-ink outline-none focus:border-brand-ink"
							/>
						</label>
					{:else}
						<p class="font-sans text-[13px] leading-[19px] text-brand-mute">
							No variables yet. Add <span class="font-mono">&#123;&#123;name&#125;&#125;</span> to the
							markup and it appears here.
						</p>
					{/each}
				</div>
			{:else if rightTab === 'useit'}
				<UseItCard
					inputs={variables.map((v) => ({ name: v.name, value: sampleValues[v.name] ?? '' }))}
					templateUid={uid || ''}
					templateName={template.name || 'Untitled template'}
					apiKey={$activeApiToken?.token || ''}
					kind="image"
					returnsNote={`A URL to the ${
						template.outputFormat === 'pdf' ? 'PDF' : 'PNG'
					} in about a second. The file is exactly what Rendered proof shows for rev ${
						$editor.baseRevision || template.revision || 1
					}.`}
					alsoLinks={[
						{ label: 'Bulk render from a CSV', href: `/dashboard/template/${uid}/bulk-render` },
						{ label: 'Node · Python SDK snippets', href: 'https://docs.pictify.io/sdks/node' },
						{ label: 'Docs for /image', href: 'https://docs.pictify.io' }
					]}
				/>
			{:else}
				{#if pickingVariable}
					<!--
						Anchored under the rail rather than floating: the rail is already
						the narrow column, and a popover that escapes it has to be
						repositioned on every scroll for no gain.
					-->
					<div class="relative">
						<div class="absolute right-3 top-0 z-20">
							<VariablePopover
								variables={variables.map((v) => v.name)}
								target={mode === 'code' ? 'code' : 'design'}
								on:pick={(e) => insertVariable(e.detail.name, mode)}
							/>
						</div>
					</div>
				{/if}
				<SelectionRail
					{selection}
					variables={variables.map((v) => v.name)}
					disabled={Boolean($editor.operation)}
					on:rebind={() => (pickingVariable = true)}
					on:style={fromRail((d) => stageApi.setStyle(d.id, d.patch, d.label))}
					on:text={fromRail((d) => stageApi.setText(d.id, d.text))}
					on:rotate={fromRail((d) => stageApi.setRotation(d.id, d.deg))}
					on:reorder={fromRail((d) => stageApi.moveBy(d.id, d.direction))}
					on:lock={fromRail((d) => stageApi.toggleLock(d.id))}
					on:duplicate={fromRail(() => stageApi.duplicateSelected())}
					on:remove={fromRail(() => stageApi.removeSelected())}
					on:offset={fromRail((d) =>
						stageApi.setStyle(
							d.id,
							{ transform: `translate(${d.axis === 'x' ? d.value : selection?.offset?.x || 0}px, ${d.axis === 'y' ? d.value : selection?.offset?.y || 0}px)` },
							`Offset ${d.axis} ${d.value}`
						)
					)}
				/>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="composer">
			<!--
				What the agent is given, assembled from counts rather than phrased.
				It gets the markup and the FIELD NAMES — never a sample value, because
				the document goes over with its {{tokens}} intact.
			-->
			<div class="mb-2">
				<UsingLine
					sends={[
						'this template',
						`${variables.length} field ${variables.length === 1 ? 'name' : 'names'}`
					]}
					withheld={['no sample values']}
				/>
			</div>
			{#if selectedId}
				<!--
					Scope is visible and switchable (locked decision 4). The chip IS the
					state — a buyer who cannot see the scope cannot know why their
					instruction was refused.
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
		</svelte:fragment>
	</StudioShell>

	{#if conflict}
		<ConflictDialog
			current={conflict}
			on:keepMine={() => {
				conflict = null;
				saveQueue?.nudge();
			}}
			on:takeTheirs={() => {
				editor.load({ html: conflict.html, revision: conflict.revision });
				conflict = null;
				showToast('Loaded the other version.', 'default', 4000);
			}}
		/>
	{/if}
{:else}
	<div class="flex h-screen items-center justify-center bg-brand-paper">
		<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-mute"
			>Opening studio…</span
		>
	</div>
{/if}

<Toast />
