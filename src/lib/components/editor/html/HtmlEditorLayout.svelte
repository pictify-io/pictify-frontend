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
	import AnimatedBackground from '../AnimatedBackground.svelte';
	import HtmlPreview from './HtmlPreview.svelte';
	import HtmlVariablesPanel from './HtmlVariablesPanel.svelte';
	import HtmlSettingsPanel from './HtmlSettingsPanel.svelte';
	import HtmlApiSnippetPanel from './HtmlApiSnippetPanel.svelte';
	import HtmlSnippetLibrary from './HtmlSnippetLibrary.svelte';
	import HtmlCommandPalette from './HtmlCommandPalette.svelte';
	import HtmlResizeModal from './HtmlResizeModal.svelte';
	import VariablePropertyPanel from './VariablePropertyPanel.svelte';
	import HtmlEditorTour from './HtmlEditorTour.svelte';
	import HtmlLearnDrawer from './HtmlLearnDrawer.svelte';
	import HtmlCopilotPanel from './HtmlCopilotPanel.svelte';

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

	// Editor side-panels: snippet library + command palette overlay + resize modal.
	let showSnippetLibrary = false;
	let showCommandPalette = false;
	let showResizeModal = false;
	let showLearnDrawer = false;
	let htmlEditorRef;
	let canUndo = false;
	let canRedo = false;

	function handleHistoryState(e) {
		canUndo = !!e.detail?.canUndo;
		canRedo = !!e.detail?.canRedo;
	}

	// Token-click inspector — user clicks a `{{var}}` token inside the
	// CodeMirror buffer and we anchor the same VariablePropertyPanel the
	// Variables tab uses. Registers the variable on the fly if it's not
	// already declared (matches the auto-add-on-save UX but gives
	// instant feedback while the user is still typing).
	let editingVariable = null;
	let editingAnchor = null;
	let editingIndex = -1;

	function handleTokenClick(event) {
		const token = event.detail;
		if (!token || !token.name) return;
		const defs = template.variableDefinitions || [];
		let idx = defs.findIndex((v) => v && v.name === token.name);
		if (idx < 0) {
			// Token references a variable we haven't declared yet — add it
			// immediately so the inspector has something to edit. Mirrors
			// the server-side auto-add performed at save time. Clicking a
			// token is an explicit "I want this" — lift any tombstone.
			//
			// Infer the likely type from the surrounding context: a click
			// inside `{{#each items}}` strongly implies `items` is an
			// array, so pre-seed the type so the JSON default editor and
			// shape-validator are correctly set on first open.
			const inferredType = token.block === 'open' ? inferTypeForBlock(token) : 'text';
			const seed = {
				name: token.name,
				type: inferredType,
				defaultValue: inferredType === 'array' ? [] : inferredType === 'object' ? {} : '',
				description: '',
				validation: { required: false }
			};
			template = {
				...template,
				variableDefinitions: [...defs, seed]
			};
			idx = template.variableDefinitions.length - 1;
			autoAdded = [...autoAdded, token.name];
			if (explicitlyDeleted.has(token.name)) {
				const nextSet = new Set(explicitlyDeleted);
				nextSet.delete(token.name);
				explicitlyDeleted = nextSet;
			}
			markDirty();
		}
		editingIndex = idx;
		editingVariable = template.variableDefinitions[idx];
		editingAnchor = token.rect;
	}

	// Map a block-opener token (`{{#each items}}`, `{{#if user}}`,
	// `{{#with obj}}`) to the sensible initial variable type. We don't
	// try to be clever — this is a pure heuristic that users can
	// override in the inspector.
	function inferTypeForBlock(token) {
		// The token resolver only exposes `block: 'open' | 'close' | null`,
		// not the helper head, so we peek at the source text around the
		// token's position. Template.html is the truth here.
		const raw = (template.html || '').slice(token.from, token.to);
		if (/\{\{#\s*each\b/.test(raw)) return 'array';
		if (/\{\{#\s*with\b/.test(raw)) return 'object';
		return 'text';
	}

	function closeTokenInspector() {
		editingVariable = null;
		editingAnchor = null;
		editingIndex = -1;
	}

	function applyTokenInspectorPatch(event) {
		if (editingIndex < 0) return;
		const { patch } = event.detail;
		const oldName = template.variableDefinitions[editingIndex]?.name;
		const nextDefs = template.variableDefinitions.map((v, i) =>
			i === editingIndex ? { ...v, ...patch } : v
		);
		template = { ...template, variableDefinitions: nextDefs };
		// If the variable was renamed, also update its occurrences in the
		// editor buffer so the template stays in sync. We do this via a
		// simple full-token rewrite: `{{oldName}}` → `{{newName}}` and
		// `{{{oldName}}}` → `{{{newName}}}` (word-boundary anchored).
		if (patch.name && oldName && patch.name !== oldName) {
			const safeOld = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const pattern = new RegExp(
				`(\\{\\{\\{?\\s*)${safeOld}(\\s*(?:\\|[^}]*)?\\}?\\}\\})`,
				'g'
			);
			template = {
				...template,
				html: template.html.replace(pattern, `$1${patch.name}$2`)
			};
			if (testValues[oldName] !== undefined) {
				const nv = { ...testValues };
				nv[patch.name] = nv[oldName];
				delete nv[oldName];
				testValues = nv;
			}
		}
		markDirty();
		closeTokenInspector();
	}

	function removeFromTokenInspector() {
		if (editingIndex < 0) return;
		const target = template.variableDefinitions[editingIndex];
		closeTokenInspector();
		if (!target?.name) return;
		requestVariableRemoval({ detail: { names: [target.name] } });
	}

	function doUndo() {
		htmlEditorRef?.undo();
	}
	function doRedo() {
		htmlEditorRef?.redo();
	}

	function applyResize(event) {
		const { width, height } = event.detail;
		template = { ...template, width, height };
		markDirty();
	}

	function toggleFormat() {
		const next = template.outputFormat === 'pdf' ? 'image' : 'pdf';
		template = { ...template, outputFormat: next };
		markDirty();
	}

	function insertSnippet(event) {
		const body = event.detail?.snippet?.body;
		if (!body) return;
		activeTab = 'editor';
		// Give the Editor component a tick to be the active panel, then insert.
		Promise.resolve().then(() => {
			htmlEditorRef?.insertAtCursor(body);
		});
		markDirty();
	}

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

	// Names the user explicitly deleted — even if their tokens still live
	// in the HTML (user chose "Keep tokens", or they live inside a block
	// like {{#each items}}), we do NOT want the auto-add pipeline to
	// resurrect the declaration on the next keystroke. The tombstone
	// lifts the moment the user types the name again from scratch (we
	// interpret a manual keystroke as "OK, yes, I want this").
	let explicitlyDeleted = new Set();

	function handleReferences(e) {
		// The editor reports every identifier the template uses. We silently
		// add any undeclared ones locally so autocomplete stays useful while
		// typing; the backend re-computes on save and returns the canonical
		// list in `addedVariables`.
		//
		// We ALSO prune auto-added entries whose tokens no longer appear —
		// otherwise typing `{{foo}}` and then renaming it to `{{foobar}}`
		// would leave `foo` stranded in the panel forever. Pruning is
		// scoped to the `autoAdded` set so user-created declarations and
		// user-edited variables are never silently removed.
		const referenced = new Set(e.detail.identifiers || []);
		const currentNames = new Set(
			(template.variableDefinitions || []).map((v) => v && v.name).filter(Boolean)
		);
		const additions = [];
		for (const id of referenced) {
			if (currentNames.has(id)) continue;
			if (explicitlyDeleted.has(id)) continue; // tombstoned — respect the user's delete
			additions.push({ name: id, type: 'text', defaultValue: '' });
		}

		// Compute prunable names: auto-added AND not referenced AND the
		// user hasn't touched their row (no description, no custom type,
		// no explicit defaultValue, no validation tweaks — we treat any
		// customization as evidence the user adopted the entry).
		const referencedOrKept = new Set([...referenced, ...additions.map((a) => a.name)]);
		const kept = [];
		const prunedNames = [];
		for (const def of template.variableDefinitions || []) {
			if (!def || !def.name) continue;
			const isAutoAdded = autoAdded.includes(def.name);
			const isOrphan = !referencedOrKept.has(def.name);
			const isPristine =
				(!def.type || def.type === 'text') &&
				(def.defaultValue === undefined || def.defaultValue === '') &&
				(!def.description || def.description === '') &&
				!def.allowRawHtml &&
				!(def.validation && def.validation.required);
			if (isAutoAdded && isOrphan && isPristine) {
				prunedNames.push(def.name);
				continue;
			}
			kept.push(def);
		}

		const changed = additions.length > 0 || prunedNames.length > 0;
		if (!changed) return;

		template = {
			...template,
			variableDefinitions: [...kept, ...additions]
		};
		if (prunedNames.length > 0) {
			const prunedSet = new Set(prunedNames);
			autoAdded = autoAdded.filter((n) => !prunedSet.has(n));
			// Drop any stale test values for pruned names so the preview
			// payload doesn't carry keys the backend will reject.
			const nextTest = { ...testValues };
			for (const n of prunedNames) delete nextTest[n];
			testValues = nextTest;
		}
		if (additions.length > 0) {
			autoAdded = [...autoAdded, ...additions.map((a) => a.name)];
		}
	}

	function handleVariablesChange(e) {
		const nextDefs = e.detail.variableDefinitions || [];
		// If a name re-appears in the declaration set after having been
		// tombstoned (user clicked + Add with a name they'd deleted, or
		// renamed another variable to that name), the user has re-opted
		// into it — lift the tombstone so future keystrokes can auto-add
		// related occurrences without fighting the block.
		if (explicitlyDeleted.size > 0) {
			const declaredNow = new Set(nextDefs.map((v) => v && v.name).filter(Boolean));
			let changed = false;
			const nextTombstones = new Set(explicitlyDeleted);
			for (const n of explicitlyDeleted) {
				if (declaredNow.has(n)) {
					nextTombstones.delete(n);
					changed = true;
				}
			}
			if (changed) explicitlyDeleted = nextTombstones;
		}
		template = { ...template, variableDefinitions: nextDefs };
		testValues = e.detail.testValues || testValues;
		markDirty();
	}

	// ---- Variable removal with editor sync ----------------------------
	// Variables can be deleted from two surfaces (Variables panel, token
	// inspector). Both now funnel through `requestRemove` which prompts
	// the user when tokens still exist in the HTML — if they confirm we
	// strip {{var}}/{{{var}}} occurrences before removing the declaration.

	let pendingRemoval = null; // { names: string[], occurrences: number }

	function countTokenOccurrences(src, name) {
		if (!src || !name) return 0;
		const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		// Matches {{name}}, {{{name}}}, {{name|helper}}, {{#if name}}, etc.
		const re = new RegExp(
			`\\{\\{\\{?\\s*(?:[#\\/]?\\w+\\s+)?${safe}(?:[.\\[\\]\\w]*)\\s*(?:\\|[^}]*)?\\}?\\}\\}`,
			'g'
		);
		const matches = src.match(re);
		return matches ? matches.length : 0;
	}

	function stripTokens(src, name) {
		if (!src || !name) return src;
		const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		// Conservative strip: drop simple `{{name}}` and `{{{name}}}` tokens
		// and path accessors like `{{name.foo}}`. We deliberately leave
		// `{{#each name}}...{{/each}}` blocks alone — removing just the
		// `name` would orphan the block body and almost certainly break
		// the template silently. The confirm dialog warns about block uses.
		const simple = new RegExp(
			`\\{\\{\\{?\\s*${safe}(?:\\.[\\w.]+)?\\s*(?:\\|[^}]*)?\\}?\\}\\}`,
			'g'
		);
		return src.replace(simple, '');
	}

	function requestVariableRemoval(e) {
		const names = (e.detail && e.detail.names) || [];
		if (names.length === 0) return;
		const occurrences = names.reduce(
			(sum, n) => sum + countTokenOccurrences(template.html, n),
			0
		);
		if (occurrences === 0) {
			applyVariableRemoval(names, { strip: false });
			return;
		}
		// Tokens still referenced — ask before destroying markup.
		pendingRemoval = { names, occurrences };
	}

	function applyVariableRemoval(names, { strip }) {
		const removeSet = new Set(names);
		let nextHtml = template.html;
		if (strip) {
			for (const name of names) nextHtml = stripTokens(nextHtml, name);
		}
		const nextDefs = (template.variableDefinitions || []).filter(
			(v) => v && !removeSet.has(v.name)
		);
		const nextTest = { ...testValues };
		for (const name of names) delete nextTest[name];

		// Tombstone the removed names so `handleReferences` doesn't auto-
		// re-add them on the next keystroke. This matters even when we
		// strip tokens, because {{#each name}} / {{#if name}} block uses
		// stay in the HTML by design — we warned the user, they accepted.
		explicitlyDeleted = new Set([...explicitlyDeleted, ...names]);

		// Reassign the declaration set BEFORE mutating the editor buffer.
		// `replaceAll` triggers CodeMirror's updateListener, which calls
		// `handleReferences` with the surviving identifiers — if defs are
		// still stale at that point the deleted name sneaks back in via
		// auto-add. Ordering here matters.
		template = { ...template, html: nextHtml, variableDefinitions: nextDefs };
		testValues = nextTest;
		autoAdded = autoAdded.filter((n) => !removeSet.has(n));

		// Drive CodeMirror imperatively. Svelte's `bind:value` reactive-prop
		// sync does NOT fire reliably in this case because the editor's own
		// updateListener has already written `value` back through the bind
		// during the user's click path, so `value !== view.state.doc` never
		// evaluates true when we reassign `template.html` to the stripped
		// string — the guard sees them as equal and skips the dispatch.
		// Calling the editor's imperative surface sidesteps that entirely
		// and also creates a proper undo entry.
		if (strip && htmlEditorRef) {
			htmlEditorRef.replaceAll(nextHtml);
		}
		markDirty();
	}

	function confirmRemoval(strip) {
		if (!pendingRemoval) return;
		applyVariableRemoval(pendingRemoval.names, { strip });
		pendingRemoval = null;
	}

	function cancelRemoval() {
		pendingRemoval = null;
	}

	// Copilot apply — replaces the entire buffer with the assistant's
	// generated HTML. Uses the same imperative replaceAll path as the
	// destructive-delete flow so the change becomes a single undoable
	// ⌘Z entry instead of a flurry of keystroke-sized ones.
	function applyCopilotHtml(e) {
		const nextHtml = e.detail && e.detail.html;
		if (!nextHtml || typeof nextHtml !== 'string') return;
		if (htmlEditorRef) htmlEditorRef.replaceAll(nextHtml);
		template = { ...template, html: nextHtml };
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
		const beforeunload = (e) => {
			if (isDirty) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		const keydown = (e) => {
			const mod = e.metaKey || e.ctrlKey;
			// ⌘K — open command palette (standard across Vercel/Linear/Figma).
			if (mod && e.key === 'k') {
				e.preventDefault();
				showCommandPalette = true;
				return;
			}
			// ⌘/ — toggle snippet library.
			if (mod && e.key === '/') {
				e.preventDefault();
				showSnippetLibrary = !showSnippetLibrary;
				return;
			}
			// ⌘I — jump to the Copilot tab.
			if (mod && (e.key === 'i' || e.key === 'I')) {
				e.preventDefault();
				activeTab = 'copilot';
				return;
			}
		};
		window.addEventListener('beforeunload', beforeunload);
		window.addEventListener('keydown', keydown);
		return () => {
			window.removeEventListener('beforeunload', beforeunload);
			window.removeEventListener('keydown', keydown);
		};
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
	class="relative flex h-screen w-full flex-col overflow-hidden bg-[#FFFDF8] md:block"
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

	<!-- Soft color blur backdrop — same pattern the canvas editor uses
	     so the two surfaces share atmosphere even when the foreground
	     chrome differs. -->
	<AnimatedBackground />

	<div class="relative z-10 hidden md:flex md:h-full md:flex-col">
		<HtmlTopBar
			name={template.name}
			saveStatus={isSaving ? 'saving' : isDirty ? 'unsaved' : 'saved'}
			canPublish={!isDirty && !!template.uid}
			{canUndo}
			{canRedo}
			width={template.width}
			height={template.height}
			outputFormat={template.outputFormat}
			{isSaving}
			{isDirty}
			on:rename={handleRename}
			on:publish={() => dispatch('publish')}
			on:share={() => dispatch('share')}
			on:learn={() => (showLearnDrawer = true)}
			on:save={save}
			on:undo={doUndo}
			on:redo={doRedo}
			on:resize={() => (showResizeModal = true)}
			on:toggleFormat={toggleFormat}
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
						{ k: 'copilot', label: 'Copilot', icon: 'fa-wand-magic-sparkles' },
						{ k: 'variables', label: 'Variables', icon: 'fa-cube' },
						{ k: 'api', label: 'API', icon: 'fa-plug' },
						{ k: 'settings', label: 'Settings', icon: 'fa-sliders' }
					] as tab}
						<button
							type="button"
							role="tab"
							aria-selected={activeTab === tab.k}
							data-tour-id={'tab-' + tab.k}
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

					<!-- Snippet library toggle (⌘/) -->
					<button
						type="button"
						on:click={() => (showSnippetLibrary = !showSnippetLibrary)}
						aria-pressed={showSnippetLibrary}
						title="Insert snippet (⌘/)"
						data-tour-id="snippets-button"
						class="flex items-center gap-1.5 rounded-lg border-[2px] border-gray-900 px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-all
							{showSnippetLibrary
								? 'bg-[#ffe066] text-gray-900 shadow-[3px_3px_0_0_#1f2937]'
								: 'bg-white text-gray-700 hover:shadow-[2px_2px_0_0_#1f2937] hover:-translate-x-[1px] hover:-translate-y-[1px]'}"
					>
						<i class="fa fa-wand-magic-sparkles text-[10px]"></i>
						Snippets
					</button>

					<!-- Command palette trigger (⌘K) -->
					<button
						type="button"
						on:click={() => (showCommandPalette = true)}
						title="Command palette (⌘K)"
						class="flex items-center gap-1.5 rounded-lg border-[2px] border-gray-900 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-gray-700 transition-all hover:shadow-[2px_2px_0_0_#1f2937] hover:-translate-x-[1px] hover:-translate-y-[1px]"
					>
						<i class="fa fa-terminal text-[10px]"></i>
						⌘K
					</button>

					<!-- Save is handled by the primary CTA in the topbar now.
					     The tab bar used to carry a secondary save, but two Save
					     buttons on one screen is confusing; the topbar owns it. -->
				</nav>

				<!-- Pane content. Each tab is mounted lazily except the editor,
				     which we keep mounted so switching tabs doesn't trash the
				     CodeMirror state. -->
				<div class="relative flex-1 overflow-hidden">
					<div
						class="absolute inset-0 flex"
						class:hidden={activeTab !== 'editor'}
					>
						<!-- Snippet library slides in as a left rail when open -->
						{#if showSnippetLibrary}
							<aside
								class="h-full w-[280px] flex-shrink-0 border-r-[3px] border-gray-900"
							>
								<HtmlSnippetLibrary
									on:insert={insertSnippet}
									on:close={() => (showSnippetLibrary = false)}
								/>
							</aside>
						{/if}
						<div class="h-full flex-1 min-w-0">
							<HtmlEditor
								bind:this={htmlEditorRef}
								bind:value={template.html}
								variableDefinitions={template.variableDefinitions}
								{safelistedHelpers}
								on:change={handleHtmlChange}
								on:referencesChange={handleReferences}
								on:save={handleEditorSave}
								on:historyState={handleHistoryState}
								on:tokenClick={handleTokenClick}
							/>
						</div>
					</div>
					<!-- Copilot tab — always mounted + toggled via class:hidden
					     so the conversation survives tab switches. Mounting
					     on-demand would dump context every time the user
					     peeks at Variables or API. -->
					<div
						class="absolute inset-0"
						class:hidden={activeTab !== 'copilot'}
					>
						<HtmlCopilotPanel
							currentHtml={template.html}
							currentVariables={template.variableDefinitions}
							width={template.width}
							height={template.height}
							on:apply={applyCopilotHtml}
						/>
					</div>
					{#if activeTab === 'variables'}
						<HtmlVariablesPanel
							variableDefinitions={template.variableDefinitions}
							{testValues}
							{autoAdded}
							on:change={handleVariablesChange}
							on:requestRemove={requestVariableRemoval}
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
			<section class="flex h-full w-[44%] flex-col" data-tour-id="preview">
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

<!-- Token-click inspector overlay. Rendered here (not inside the editor
     pane) so the floating panel can escape the pane's overflow + z-index
     clipping and anchor against absolute screen coords. -->
{#if editingVariable}
	<VariablePropertyPanel
		variable={editingVariable}
		anchorRect={editingAnchor}
		allNames={(template.variableDefinitions || []).map((v) => v && v.name).filter(Boolean)}
		on:apply={applyTokenInspectorPatch}
		on:remove={removeFromTokenInspector}
		on:close={closeTokenInspector}
	/>
{/if}

<!-- Resize modal overlay -->
<HtmlResizeModal
	show={showResizeModal}
	width={template.width}
	height={template.height}
	on:apply={applyResize}
	on:close={() => (showResizeModal = false)}
/>

<!-- Variable removal confirm — shown only when tokens exist in the HTML
     that would be orphaned by the delete. Cancel restores the declaration
     (we never mutated it upstream). -->
{#if pendingRemoval}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/55 p-6"
		on:click|self={cancelRemoval}
	>
		<div
			class="w-full max-w-md overflow-hidden rounded-2xl border-[3px] border-gray-900 bg-[#FFFDF8] shadow-[8px_8px_0_0_#1f2937]"
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="remove-var-title"
		>
			<!-- Header strip — red accent because this is a destructive action. -->
			<div class="flex items-center gap-3 border-b-[3px] border-gray-900 bg-[#ff6b6b] px-5 py-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white shadow-[2px_2px_0_0_#1f2937]">
					<i class="fa fa-triangle-exclamation text-[12px] text-gray-900"></i>
				</div>
				<h2 id="remove-var-title" class="text-[12px] font-black uppercase tracking-widest text-white">
					{pendingRemoval.names.length === 1
						? `Delete "${pendingRemoval.names[0]}"?`
						: `Delete ${pendingRemoval.names.length} variables?`}
				</h2>
			</div>

			<div class="px-5 py-5">
				<p class="text-[13px] font-semibold leading-relaxed text-gray-800">
					{#if pendingRemoval.names.length === 1}
						<code class="rounded border-[1.5px] border-gray-900 bg-gray-900 px-1 py-0.5 font-mono text-[11px] text-[#ffc480]">{'{{' + pendingRemoval.names[0] + '}}'}</code>
						is still referenced
						<strong class="font-black text-gray-900">{pendingRemoval.occurrences}
							{pendingRemoval.occurrences === 1 ? 'time' : 'times'}</strong>
						in your template.
					{:else}
						These variables are still referenced
						<strong class="font-black text-gray-900">{pendingRemoval.occurrences}
							{pendingRemoval.occurrences === 1 ? 'time' : 'times'}</strong>
						across your template.
					{/if}
				</p>
				<p class="mt-3 text-[12px] font-semibold leading-relaxed text-gray-600">
					Deleting the declaration will <strong>also remove the <code class="font-mono text-gray-900">{'{{…}}'}</code> tokens from your HTML</strong>. This can't be undone through the editor toolbar — use <span class="font-mono">⌘Z</span> in the editor to recover.
				</p>

				<!-- Block-statement heads-up — each/if/with wrappers are NOT stripped. -->
				<div class="mt-4 rounded-lg border-[2px] border-gray-900 bg-[#ffe066] px-3 py-2">
					<p class="text-[11px] font-bold leading-relaxed text-gray-900">
						<i class="fa fa-circle-info mr-1 text-[10px]"></i>
						<span class="font-black uppercase tracking-widest">Block uses kept.</span>
						Occurrences inside <code class="rounded border-[1.5px] border-gray-900 bg-gray-900 px-1 font-mono text-[10px] text-[#ffc480]">{'{{#each}}'}</code> /
						<code class="rounded border-[1.5px] border-gray-900 bg-gray-900 px-1 font-mono text-[10px] text-[#ffc480]">{'{{#if}}'}</code> stay — remove those by hand if needed.
					</p>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2 border-t-[3px] border-gray-900 bg-gray-50 px-5 py-3">
				<button
					type="button"
					on:click={cancelRemoval}
					class="rounded-md border-[2px] border-gray-900 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
				>Cancel</button>
				<button
					type="button"
					on:click={() => confirmRemoval(false)}
					class="rounded-md border-[2px] border-gray-900 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
				>Keep tokens</button>
				<button
					type="button"
					on:click={() => confirmRemoval(true)}
					class="rounded-md border-[2px] border-gray-900 bg-[#ff6b6b] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
				>Delete + strip tokens</button>
			</div>
		</div>
	</div>
{/if}

<!-- Command palette overlay -->
{#if showCommandPalette}
	<HtmlCommandPalette
		on:close={() => (showCommandPalette = false)}
		commands={[
			{
				key: 'save',
				label: 'Save template',
				hint: 'Persist current edits',
				icon: 'fa-floppy-disk',
				shortcut: '⌘S',
				disabled: !isDirty,
				action: save
			},
			{
				key: 'copilot',
				label: 'Go to Copilot',
				hint: 'Ask AI to generate or revise the template',
				icon: 'fa-wand-magic-sparkles',
				shortcut: '⌘I',
				action: () => (activeTab = 'copilot')
			},
			{
				key: 'snippets',
				label: showSnippetLibrary ? 'Close snippet library' : 'Open snippet library',
				hint: 'Insert common Handlebars patterns',
				icon: 'fa-shapes',
				shortcut: '⌘/',
				action: () => (showSnippetLibrary = !showSnippetLibrary)
			},
			{
				key: 'resize',
				label: 'Resize template',
				hint: 'Pick a platform preset or custom dimensions',
				icon: 'fa-expand',
				action: () => (showResizeModal = true)
			},
			{
				key: 'undo',
				label: 'Undo',
				icon: 'fa-arrow-rotate-left',
				shortcut: '⌘Z',
				disabled: !canUndo,
				action: doUndo
			},
			{
				key: 'redo',
				label: 'Redo',
				icon: 'fa-arrow-rotate-right',
				shortcut: '⌘⇧Z',
				disabled: !canRedo,
				action: doRedo
			},
			{
				key: 'tab-editor',
				label: 'Go to Editor',
				icon: 'fa-code',
				action: () => (activeTab = 'editor')
			},
			{
				key: 'tab-variables',
				label: 'Go to Variables',
				icon: 'fa-cube',
				action: () => (activeTab = 'variables')
			},
			{
				key: 'tab-api',
				label: 'Go to API snippets',
				icon: 'fa-plug',
				action: () => (activeTab = 'api')
			},
			{
				key: 'tab-settings',
				label: 'Go to Settings',
				icon: 'fa-sliders',
				action: () => (activeTab = 'settings')
			},
			{
				key: 'format-png',
				label: 'Set format: PNG',
				icon: 'fa-image',
				action: () => handleSettingsChange({ detail: { format: 'png' } })
			},
			{
				key: 'format-jpeg',
				label: 'Set format: JPEG',
				icon: 'fa-image',
				action: () => handleSettingsChange({ detail: { format: 'jpeg' } })
			},
			{
				key: 'format-pdf',
				label: 'Set format: PDF',
				icon: 'fa-file-pdf',
				action: () => handleSettingsChange({ detail: { format: 'pdf' } })
			},
			{
				key: 'toggle-js',
				label: template.jsEnabled
					? 'Disable JavaScript at render'
					: 'Enable JavaScript at render',
				hint: 'Danger when on — allows scripts during Puppeteer render',
				icon: 'fa-code-compare',
				action: () =>
					handleSettingsChange({ detail: { jsEnabled: !template.jsEnabled } })
			},
			{
				key: 'toggle-strict',
				label: template.strictVariables
					? 'Disable strict variables'
					: 'Enable strict variables',
				icon: 'fa-bolt',
				action: () =>
					handleSettingsChange({
						detail: { strictVariables: !template.strictVariables }
					})
			},
			{
				key: 'publish',
				label: 'Publish template',
				hint: 'Ship to production — opens preview',
				icon: 'fa-rocket',
				disabled: isDirty || !template.uid,
				action: () => dispatch('publish')
			},
			{
				key: 'back',
				label: 'Back to templates',
				icon: 'fa-arrow-left',
				action: () => {
					window.location.href = '/dashboard/template';
				}
			}
		]}
	/>
{/if}

<!-- Learn / syntax reference drawer — triggered by the topbar ? button -->
<HtmlLearnDrawer show={showLearnDrawer} on:close={() => (showLearnDrawer = false)} />

<!-- First-run walkthrough. Mounts last so its overlay z-layer wins over
     the editor chrome. Self-dismisses + persists in localStorage. -->
<HtmlEditorTour />
