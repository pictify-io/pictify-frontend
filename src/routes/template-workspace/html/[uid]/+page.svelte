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
	import Toast from '$lib/components/Toast.svelte';

	import { editor } from '$lib/components/studio/v2/editor-store.js';
	import { createSaveQueue } from '$lib/components/studio/v2/save-queue.js';
	import { extractInputs } from '$lib/utils/template-tokens.js';
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
	let layers = [];
	let conflict = null;
	let versionsOpen = false;
	let sampleValues = {};
	/** The full `describe()` payload — the inspector renders from this. */
	let selection = null;

	/**
	 * The contract, derived from the html on every change — never stored
	 * separately, so the rail cannot claim an input the template does not have.
	 * Ported from the v1 studio so both agree on what counts as a variable.
	 */
	function typeFor(tokenName) {
		const n = String(tokenName).toLowerCase();
		if (/(^|_)(date|issued_on|expires|day)($|_)/.test(n)) return 'date';
		if (/(image|img|logo|photo|avatar|signature)_?url$|^(image|img|logo|photo|avatar)$/.test(n))
			return 'image';
		if (/url$|^link$/.test(n)) return 'url';
		if (/colou?r$/.test(n)) return 'color';
		return 'text';
	}

	$: html = $editor.html || template?.html || '';
	$: variables = extractInputs(html).map((name) => ({ name, type: typeFor(name) }));

	onMount(async () => {
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
			}
		} catch (err) {
			loadError = err?.message || 'Failed to load template';
		}
	});

	onDestroy(() => saveQueue?.destroy?.());

	function refreshLayers() {
		layers = stageApi ? stageApi.tree() : [];
	}

	/** Every stage gesture is one transaction, one history entry, one save. */
	function onTransaction(event) {
		editor.commit(event.detail.label, event.detail.html);
		refreshLayers();
		saveQueue?.schedule();
	}

	function stepHistory(direction) {
		return () => {
			if ($editor.operation) return;
			direction === 'undo' ? editor.undo() : editor.redo();
			saveQueue?.schedule();
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
			saveQueue?.schedule();
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
		renderDisabled={true}
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
				<p class="p-4 font-sans text-[13px] leading-[19px] text-brand-mute">
					Describing a change lands with the next build. Select an element on the canvas to edit
					it, or open Layers.
				</p>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="stage" let:mode let:zoom>
			{#if $editor.operation}
				<AiLock stage={$editor.operation.stage} fromRevision={$editor.baseRevision} />
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
					on:ready={refreshLayers}
					on:selection={(e) => {
						selection = e.detail || null;
						selectedId = e.detail?.count === 1 ? e.detail.id : null;
					}}
					on:transaction={onTransaction}
				/>
			{:else}
				<p class="font-sans text-[13.5px] text-brand-mute">
					Render makes the real file. That arrives with the next build.
				</p>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="right" let:rightTab>
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
				<p class="p-4 font-sans text-[13px] leading-[19px] text-brand-mute">
					The API, agent and automation snippets land with the next build.
				</p>
			{:else}
				<SelectionRail
					{selection}
					variables={variables.map((v) => v.name)}
					disabled={Boolean($editor.operation)}
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
	</StudioShell>

	{#if conflict}
		<ConflictDialog
			current={conflict}
			on:keepMine={() => {
				conflict = null;
				saveQueue?.schedule();
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
