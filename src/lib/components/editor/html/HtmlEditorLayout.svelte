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
	class="flex items-center justify-center gap-3 border-b-[3px] border-gray-900 bg-[#ffc480] px-6 py-3 text-sm font-black uppercase tracking-wider text-gray-900 lg:hidden"
>
	<span>Desktop-only editor</span>
	<code class="rounded-md border-[2px] border-gray-900 bg-gray-900 px-2 py-0.5 font-mono text-[11px] text-[#ffc480]"
		>npx pictify</code
	>
</div>

<!-- Below 768px: hide editor entirely -->
<div
	class="flex h-screen w-full flex-col bg-[#FFFDF8] md:block"
>
	<div class="md:hidden flex h-full items-center justify-center p-8 text-center">
		<div class="max-w-sm rounded-2xl border-[3px] border-gray-900 bg-white p-8 shadow-[8px_8px_0_0_#1f2937]">
			<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-gray-900 bg-[#ffc480] shadow-[3px_3px_0_0_#1f2937]">
				<i class="fa fa-desktop text-xl text-gray-900"></i>
			</div>
			<p class="text-lg font-black uppercase tracking-wider text-gray-900">Wider screen needed</p>
			<p class="mt-3 text-sm font-bold text-gray-600">
				The HTML editor works best on desktop. Use
				<code class="rounded-md border-[2px] border-gray-900 bg-gray-900 px-2 py-0.5 font-mono text-[11px] text-[#ffc480]">npx pictify</code>
				from your dev machine.
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

		<div class="flex h-[calc(100vh-64px)] w-full">
			<!-- LEFT pane (56%) -->
			<section
				class="flex h-full w-[56%] flex-col border-r-[3px] border-gray-900"
			>
				<!-- Tab bar — rounded-lg pill buttons matching the dashboard filter
				     chips (see Template.svelte:285). Active tab uses a colored
				     shadow and brand-accent fill, identical to how the dashboard
				     marks the selected format filter. -->
				<nav
					class="flex items-center gap-2 border-b-[3px] border-gray-900 bg-[#FFFDF8] px-4 py-3"
					role="tablist"
					aria-label="Editor panels"
				>
					{#each [
						{ k: 'editor', label: 'Editor', icon: 'fa-code' },
						{ k: 'variables', label: 'Variables', icon: 'fa-cube' },
						{ k: 'api', label: 'API', icon: 'fa-plug' },
						{ k: 'settings', label: 'Settings', icon: 'fa-sliders' }
					] as tab}
						<button
							type="button"
							role="tab"
							aria-selected={activeTab === tab.k}
							class="flex items-center gap-2 rounded-lg border-[2px] border-gray-900 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all
								{activeTab === tab.k
									? 'bg-gray-900 text-white shadow-[3px_3px_0_0_#1f2937]'
									: 'bg-white text-gray-700 hover:shadow-[2px_2px_0_0_#1f2937] hover:-translate-x-[1px] hover:-translate-y-[1px]'}"
							on:click={() => (activeTab = tab.k)}
						>
							<i class="fa {tab.icon} text-[10px]"></i>
							{tab.label}
						</button>
					{/each}

					<div class="flex-1"></div>

					<!-- Save button — secondary to the Publish CTA in the topbar.
					     White chip with accent-colored shadow that only appears
					     when dirty so the affordance is self-evident. -->
					<button
						type="button"
						on:click={save}
						disabled={isSaving || !isDirty}
						class="flex items-center gap-2 rounded-lg border-[3px] border-gray-900 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-40
							{isDirty
								? 'text-gray-900 shadow-[3px_3px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'
								: 'text-gray-500'}"
					>
						<i class="fa fa-floppy-disk text-[10px]"></i>
						{isSaving ? 'Saving…' : 'Save ⌘S'}
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
