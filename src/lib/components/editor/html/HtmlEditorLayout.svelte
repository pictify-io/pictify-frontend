<script>
	/**
	 * HtmlEditorLayout — two-pane composition root for the HTML editor.
	 *
	 * Left pane: tab bar (Editor | Variables | API | Settings) + content
	 * Right pane: live preview
	 *
	 * The editor + preview both always re-mount (never unmount) — tabs
	 * switch the LEFT pane's view without tearing down the preview, so
	 * the user sees their last render while they flip to API or Settings.
	 *
	 * Save lifecycle: dirty-state tracked here; parent routes own the
	 * persistence via the `save` event.
	 */
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import HtmlTopBar from './HtmlTopBar.svelte';
	import HtmlEditor from './HtmlEditor.svelte';
	import HtmlPreview from './HtmlPreview.svelte';
	import HtmlVariablesPanel from './HtmlVariablesPanel.svelte';
	import HtmlSettingsPanel from './HtmlSettingsPanel.svelte';
	import HtmlApiSnippetPanel from './HtmlApiSnippetPanel.svelte';

	export let template = {
		uid: null,
		name: 'Untitled template',
		html: '<h1>{{title}}</h1>',
		variableDefinitions: [],
		jsEnabled: false,
		strictVariables: false,
		width: 1080,
		height: 1080,
		outputFormat: 'image',
		pdfPreset: 'A4'
	};
	export let safelistedHelpers = [];
	export let isSaving = false;

	const dispatch = createEventDispatcher();

	let activeTab = 'editor';
	let isDirty = false;
	let testValues = {};
	let autoAdded = [];
	let savedTemplate = { ...template };

	// Derived format + dimensions exposed to preview.
	$: previewFormat = template.outputFormat === 'pdf' ? 'pdf' : 'png';

	const STARTER_HTML = `<div style="width:1080px;height:1080px;background:#FFFDF8;padding:48px;font-family:Inter,sans-serif;">
  <h1 style="font-size:64px;font-weight:800;">{{title}}</h1>
  <p style="font-size:24px;color:#6b7280;">{{subtitle}}</p>
</div>`;

	onMount(() => {
		// Brand-new templates open with an opinionated starter so the
		// preview is immediately populated — matches the design spec's
		// "empty-state is hostile" note.
		if (!template.html) {
			template = { ...template, html: STARTER_HTML };
		}
	});

	function markDirty() {
		isDirty = true;
	}

	function handleHtmlChange(e) {
		template.html = e.detail.value;
		markDirty();
	}

	function handleReferences(e) {
		// The editor reports every identifier the template uses. We silently
		// add any undeclared ones locally so autocomplete stays useful while
		// typing; the backend re-computes on save and returns the canonical
		// list in `addedVariables`.
		const current = new Set(
			(template.variableDefinitions || []).map((v) => v && v.name).filter(Boolean)
		);
		const additions = [];
		for (const id of e.detail.identifiers || []) {
			if (!current.has(id)) additions.push({ name: id, type: 'text', defaultValue: '' });
		}
		if (additions.length > 0) {
			template = {
				...template,
				variableDefinitions: [...(template.variableDefinitions || []), ...additions]
			};
			autoAdded = [...autoAdded, ...additions.map((a) => a.name)];
		}
	}

	function handleVariablesChange(e) {
		template = {
			...template,
			variableDefinitions: e.detail.variableDefinitions
		};
		testValues = e.detail.testValues || testValues;
		markDirty();
	}

	function handleSettingsChange(e) {
		// Settings panel emits `format` (png | jpeg | pdf). Translate to the
		// persisted `outputFormat` ('image' | 'pdf') so the save payload and
		// preview query both see the intended format.
		const patch = { ...e.detail };
		if (patch.format !== undefined) {
			patch.outputFormat = patch.format === 'pdf' ? 'pdf' : 'image';
			delete patch.format;
		}
		template = { ...template, ...patch };
		markDirty();
	}

	function handleRename(e) {
		template = { ...template, name: e.detail.name };
		markDirty();
	}

	async function save() {
		dispatch('save', { template, testValues });
		isDirty = false;
		savedTemplate = { ...template };
	}

	function handleEditorSave() {
		save();
	}

	// Compute the variables object the preview/API snippet should consume.
	// Test values override defaults; defaults fill missing slots.
	$: previewVariables = (() => {
		const out = {};
		for (const def of template.variableDefinitions || []) {
			if (!def || !def.name) continue;
			out[def.name] =
				testValues[def.name] !== undefined
					? testValues[def.name]
					: def.defaultValue !== undefined
						? def.defaultValue
						: '';
		}
		return out;
	})();

	// Warn on navigation with unsaved work.
	onMount(() => {
		const handler = (e) => {
			if (isDirty) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});
</script>

<!-- Responsive banner (visible < 1024px) -->
<div
	class="flex items-center justify-center gap-3 border-b-3 border-gray-800 bg-brand-accent px-6 py-3 text-sm font-semibold text-gray-900 lg:hidden"
>
	<span>Editor works best on desktop.</span>
	<code class="rounded-sm bg-gray-900 px-2 py-0.5 font-mono text-xs text-gray-100"
		>npx pictify</code
	>
</div>

<!-- Below 768px: hide editor entirely -->
<div
	class="flex h-screen w-full flex-col bg-brand-bg md:block"
>
	<div class="md:hidden flex h-full items-center justify-center p-8 text-center">
		<div>
			<p class="font-heading text-2xl">The HTML editor needs a wider screen.</p>
			<p class="mt-3 text-sm text-gray-700">
				Use <code class="font-mono bg-gray-100 px-1">npx pictify</code> from your dev
				machine, or switch to a tablet/laptop.
			</p>
		</div>
	</div>

	<div class="hidden md:flex md:h-full md:flex-col">
		<HtmlTopBar
			name={template.name}
			saveStatus={isSaving ? 'saving' : isDirty ? 'unsaved' : 'saved'}
			canPublish={!isDirty && !!template.uid}
			on:rename={handleRename}
			on:publish={() => dispatch('publish')}
			on:share={() => dispatch('share')}
		/>

		<div class="flex h-[calc(100vh-56px)] w-full">
			<!-- LEFT pane (56%) -->
			<section
				class="flex h-full w-[56%] flex-col border-r-3 border-gray-800"
			>
				<!-- Tab bar -->
				<nav
					class="flex items-stretch border-b-3 border-gray-800 bg-brand-bg"
					role="tablist"
					aria-label="Editor panels"
				>
					{#each [
						{ k: 'editor', label: 'Editor' },
						{ k: 'variables', label: 'Variables' },
						{ k: 'api', label: 'API' },
						{ k: 'settings', label: 'Settings' }
					] as tab}
						<button
							type="button"
							role="tab"
							aria-selected={activeTab === tab.k}
							class="border-r-2 border-gray-800 px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors duration-150 focus-brutal"
							class:bg-brand-accent={activeTab === tab.k}
							class:bg-white={activeTab !== tab.k}
							class:text-gray-900={activeTab === tab.k}
							on:click={() => (activeTab = tab.k)}
						>
							{tab.label}
						</button>
					{/each}
					<div class="flex-1 border-b-0 bg-brand-bg"></div>
					<!--
						Secondary save affordance alongside Cmd/Ctrl+S. Intentionally
						low-contrast so it doesn't compete with the Publish CTA in
						the topbar.
					-->
					<button
						type="button"
						on:click={save}
						disabled={isSaving || !isDirty}
						class="border-l-2 border-gray-800 bg-brand-bg px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-gray-700 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 focus-brutal"
					>
						{isSaving ? 'Saving…' : 'Save (⌘S)'}
					</button>
				</nav>

				<!-- Pane content. Each tab is mounted lazily except the editor,
				     which we keep mounted so switching tabs doesn't trash the
				     CodeMirror state. -->
				<div class="relative flex-1 overflow-hidden">
					<div
						class="absolute inset-0"
						class:hidden={activeTab !== 'editor'}
					>
						<HtmlEditor
							bind:value={template.html}
							variableDefinitions={template.variableDefinitions}
							{safelistedHelpers}
							on:change={handleHtmlChange}
							on:referencesChange={handleReferences}
							on:save={handleEditorSave}
						/>
					</div>
					{#if activeTab === 'variables'}
						<HtmlVariablesPanel
							variableDefinitions={template.variableDefinitions}
							{testValues}
							{autoAdded}
							on:change={handleVariablesChange}
							on:ackAutoAdded={() => (autoAdded = [])}
						/>
					{:else if activeTab === 'settings'}
						<HtmlSettingsPanel
							jsEnabled={template.jsEnabled}
							strictVariables={template.strictVariables}
							width={template.width}
							height={template.height}
							format={previewFormat}
							pdfPreset={template.pdfPreset}
							on:change={handleSettingsChange}
						/>
					{:else if activeTab === 'api'}
						<HtmlApiSnippetPanel
							templateUid={savedTemplate.uid}
							variables={previewVariables}
							format={previewFormat}
							{isDirty}
						/>
					{/if}
				</div>
			</section>

			<!-- RIGHT pane (44%) -->
			<section class="flex h-full w-[44%] flex-col">
				<HtmlPreview
					html={template.html}
					variableDefinitions={template.variableDefinitions}
					variables={previewVariables}
					jsEnabled={template.jsEnabled}
					strictVariables={template.strictVariables}
					width={template.width}
					height={template.height}
					format={previewFormat}
				/>
			</section>
		</div>
	</div>
</div>
