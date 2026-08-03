<script>
	/**
	 * EmailComposer — the delivery email authoring surface for the run wizard.
	 *
	 * Rich mode (Tiptap) by default with an HTML toggle (CodeMirror) for power
	 * users. Variable chips insert {{column}} tokens; the live preview is
	 * server-composed (POST /workflow/email-preview) so what the iframe shows
	 * is byte-for-byte what recipients get, sanitization included.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import { EditorView, keymap } from '@codemirror/view';
	import { EditorState } from '@codemirror/state';
	import { basicSetup } from 'codemirror';
	import { html as htmlLang } from '@codemirror/lang-html';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { indentWithTab } from '@codemirror/commands';
	import { previewWorkflowEmail, testWorkflowEmail } from '../../../api/workflow.js';

	/** Delivery config (subject, bodyText, bodyHtml, fromName, replyTo) */
	export let delivery = {};
	/** Called with a partial delivery patch on every edit */
	export let onChange = () => {};
	/** Column headers / variable names offered as chips */
	export let headers = [];
	/** First data row — powers the preview's variable substitution */
	export let sampleRow = {};
	/** Rendered deliverable URL to show inside the preview email */
	export let previewUrl = '';
	export let outputFormat = 'png';

	let mode = 'rich';
	let richEl;
	let editor = null;
	let editorTick = 0; // bumped on every transaction so toolbar active-states react
	let cmEl;
	let cmView = null;
	let htmlSyncedFromRich = true;

	let previewHtml = '';
	let previewSubject = '';
	let previewFrom = '';
	let previewLoading = false;
	let previewError = '';
	let previewTimer = null;
	let previewSeq = 0;

	let testSending = false;
	let testSentTo = '';
	let testError = '';

	const escapeHtml = (value) =>
		String(value ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');

	// {{name}} for simple headers, {{[First Name]}} when the header needs it
	const tokenFor = (header) =>
		/^[A-Za-z][\w.-]*$/.test(header) ? `{{${header}}}` : `{{[${header}]}}`;

	const seedHtml = () => {
		if (delivery.bodyHtml) return delivery.bodyHtml;
		const text = delivery.bodyText || 'Your document is attached below.';
		return text
			.split('\n')
			.map((line) => `<p>${escapeHtml(line)}</p>`)
			.join('');
	};

	onMount(() => {
		editor = new Editor({
			element: richEl,
			extensions: [
				StarterKit.configure({
					heading: { levels: [2, 3] },
					codeBlock: false
				})
			],
			content: seedHtml(),
			onTransaction: () => {
				editorTick += 1;
			},
			onUpdate: ({ editor: e }) => {
				htmlSyncedFromRich = true;
				onChange({ bodyHtml: e.getHTML() });
			}
		});
		// Persist the seeded HTML so a user who changes nothing still sends
		// the rich version they previewed.
		if (!delivery.bodyHtml) {
			onChange({ bodyHtml: editor.getHTML() });
		}
	});

	onDestroy(() => {
		editor?.destroy();
		cmView?.destroy();
		clearTimeout(previewTimer);
	});

	function setMode(next) {
		if (next === mode) return;
		if (next === 'html') {
			mode = 'html';
			// cmEl mounts on next tick
			setTimeout(() => initCodeMirror(delivery.bodyHtml || ''), 0);
		} else {
			// HTML -> rich is best-effort: Tiptap drops markup it can't model
			editor?.commands.setContent(delivery.bodyHtml || '');
			cmView?.destroy();
			cmView = null;
			mode = 'rich';
		}
	}

	function initCodeMirror(content) {
		if (!cmEl) return;
		cmView?.destroy();
		cmView = new EditorView({
			parent: cmEl,
			state: EditorState.create({
				doc: content,
				extensions: [
					basicSetup,
					htmlLang(),
					oneDark,
					keymap.of([indentWithTab]),
					EditorView.lineWrapping,
					EditorView.updateListener.of((update) => {
						if (update.docChanged) {
							htmlSyncedFromRich = false;
							onChange({ bodyHtml: update.state.doc.toString() });
						}
					})
				]
			})
		});
	}

	function insertToken(header) {
		const token = tokenFor(header);
		if (mode === 'rich' && editor) {
			editor.chain().focus().insertContent(token).run();
		} else if (cmView) {
			const { from, to } = cmView.state.selection.main;
			cmView.dispatch({
				changes: { from, to, insert: token },
				selection: { anchor: from + token.length }
			});
			cmView.focus();
		}
	}

	function toggleLink() {
		if (!editor) return;
		if (editor.isActive('link')) {
			editor.chain().focus().unsetLink().run();
			return;
		}
		const href = window.prompt('Link URL (https://...)');
		if (!href) return;
		editor.chain().focus().setLink({ href }).run();
	}

	// Only the fields the backend deliverySchema accepts, non-empty
	const previewDelivery = (d) => {
		const out = {};
		for (const key of ['subject', 'fromName', 'replyTo', 'bodyText', 'bodyHtml']) {
			if (d?.[key]) out[key] = d[key];
		}
		return out;
	};

	$: previewKey = JSON.stringify([
		previewDelivery(delivery),
		sampleRow,
		previewUrl,
		outputFormat
	]);

	$: if (previewKey) schedulePreview();

	function schedulePreview() {
		clearTimeout(previewTimer);
		previewTimer = setTimeout(loadPreview, 450);
	}

	async function loadPreview() {
		const seq = ++previewSeq;
		previewLoading = true;
		try {
			const response = await previewWorkflowEmail({
				delivery: previewDelivery(delivery),
				row: sampleRow || {},
				url: previewUrl || undefined,
				outputFormat
			});
			if (seq !== previewSeq) return;
			previewHtml = response?.html || '';
			previewSubject = response?.subject || '';
			previewFrom = response?.from || '';
			previewError = '';
		} catch (error) {
			if (seq !== previewSeq) return;
			previewError = error?.message || 'Preview failed';
		} finally {
			if (seq === previewSeq) previewLoading = false;
		}
	}

	async function sendTest() {
		if (testSending) return;
		testSending = true;
		testError = '';
		testSentTo = '';
		try {
			const response = await testWorkflowEmail({
				delivery: previewDelivery(delivery),
				row: sampleRow || {},
				url: previewUrl || undefined,
				outputFormat
			});
			testSentTo = response?.to || 'your inbox';
			setTimeout(() => (testSentTo = ''), 4000);
		} catch (error) {
			testError = error?.message || 'Test send failed';
		} finally {
			testSending = false;
		}
	}

	const toolbarButton = (active) =>
		`px-2.5 py-1.5 rounded-lg border-[2px] border-black text-xs font-black transition-all ${
			active ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
		}`;
</script>

<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
	<!-- ── Compose ─────────────────────────────────────────────── -->
	<div class="space-y-5">
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label
					for="email-from-name"
					class="block text-xs font-black text-black uppercase tracking-widest mb-2"
				>
					From name
				</label>
				<input
					id="email-from-name"
					type="text"
					value={delivery.fromName || ''}
					placeholder="Your organization"
					on:input={(e) => onChange({ fromName: e.target.value })}
					class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
				/>
			</div>
			<div>
				<label
					for="email-reply-to"
					class="block text-xs font-black text-black uppercase tracking-widest mb-2"
				>
					Reply-to
				</label>
				<input
					id="email-reply-to"
					type="email"
					value={delivery.replyTo || ''}
					placeholder="Defaults to your account email"
					on:input={(e) => onChange({ replyTo: e.target.value })}
					class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
				/>
			</div>
		</div>

		<div>
			<label
				for="email-subject"
				class="block text-xs font-black text-black uppercase tracking-widest mb-2"
			>
				Subject
			</label>
			<input
				id="email-subject"
				type="text"
				value={delivery.subject || ''}
				on:input={(e) => onChange({ subject: e.target.value })}
				class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
			/>
			<p class="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wide">
				Use {'{{column}}'} to personalize — it fills from each row.
			</p>
		</div>

		<div>
			<div class="flex items-center justify-between mb-2">
				<span class="text-xs font-black text-black uppercase tracking-widest">Message</span>
				<div class="flex items-center gap-1">
					<button
						type="button"
						on:click={() => setMode('rich')}
						class="px-3 py-1 rounded-lg border-[2px] border-black text-[10px] font-black uppercase tracking-widest transition-all {mode ===
						'rich'
							? 'bg-black text-white'
							: 'bg-white text-black hover:bg-gray-100'}"
					>
						Rich
					</button>
					<button
						type="button"
						on:click={() => setMode('html')}
						class="px-3 py-1 rounded-lg border-[2px] border-black text-[10px] font-black uppercase tracking-widest transition-all {mode ===
						'html'
							? 'bg-black text-white'
							: 'bg-white text-black hover:bg-gray-100'}"
					>
						HTML
					</button>
				</div>
			</div>

			{#if mode === 'rich'}
				<!-- Toolbar -->
				{#key editorTick}
					<div
						class="flex flex-wrap items-center gap-1.5 bg-gray-50 border-[3px] border-b-0 border-black rounded-t-xl px-3 py-2"
					>
						<button
							type="button"
							title="Bold"
							on:click={() => editor?.chain().focus().toggleBold().run()}
							class={toolbarButton(editor?.isActive('bold'))}><span class="font-black">B</span></button
						>
						<button
							type="button"
							title="Italic"
							on:click={() => editor?.chain().focus().toggleItalic().run()}
							class={toolbarButton(editor?.isActive('italic'))}><span class="italic">I</span></button
						>
						<button
							type="button"
							title="Heading"
							on:click={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
							class={toolbarButton(editor?.isActive('heading', { level: 2 }))}>H</button
						>
						<button
							type="button"
							title="Bullet list"
							on:click={() => editor?.chain().focus().toggleBulletList().run()}
							class={toolbarButton(editor?.isActive('bulletList'))}>••</button
						>
						<button
							type="button"
							title="Numbered list"
							on:click={() => editor?.chain().focus().toggleOrderedList().run()}
							class={toolbarButton(editor?.isActive('orderedList'))}>1.</button
						>
						<button type="button" title="Link" on:click={toggleLink} class={toolbarButton(editor?.isActive('link'))}
							>🔗</button
						>
					</div>
				{/key}
				<div
					bind:this={richEl}
					class="email-rich-editor bg-white border-[3px] border-black rounded-b-xl px-4 py-3 min-h-[160px] text-sm text-black focus-within:shadow-brutal-md transition-all"
				/>
			{:else}
				<div
					bind:this={cmEl}
					class="email-html-editor rounded-xl border-[3px] border-black overflow-hidden min-h-[200px] bg-gray-950"
				/>
				{#if !htmlSyncedFromRich}
					<p class="text-[10px] font-bold text-data-amber mt-1 uppercase tracking-wide">
						Switching back to Rich may drop markup the rich editor can't represent.
					</p>
				{/if}
			{/if}
		</div>

		{#if headers.length > 0}
			<div>
				<p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
					Insert a column value
				</p>
				<div class="flex flex-wrap gap-2">
					{#each headers as header}
						<button
							type="button"
							on:click={() => insertToken(header)}
							class="px-2.5 py-1 bg-brand-accent/20 text-black text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black hover:bg-brand-accent transition-colors"
						>
							{header}
						</button>
					{/each}
					<button
						type="button"
						on:click={() => insertToken('deliverable_url')}
						class="px-2.5 py-1 bg-data-violet/20 text-black text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black hover:bg-data-violet/50 transition-colors"
					>
						deliverable_url
					</button>
				</div>
			</div>
		{/if}

		<div class="flex items-center gap-3">
			<button
				type="button"
				on:click={sendTest}
				disabled={testSending}
				class="inline-flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black shadow-brutal-sm hover:shadow-brutal-md hover:-translate-y-0.5 transition-all disabled:opacity-60"
			>
				{testSending ? 'Sending...' : 'Send me a test'}
			</button>
			{#if testSentTo}
				<span class="text-xs font-black text-brand-success uppercase tracking-wide"
					>Sent to {testSentTo} ✓</span
				>
			{/if}
			{#if testError}
				<span class="text-xs font-bold text-brand-danger">{testError}</span>
			{/if}
		</div>
	</div>

	<!-- ── Live preview ─────────────────────────────────────────── -->
	<div>
		<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-md overflow-hidden">
			<div class="bg-gray-100 border-b-[3px] border-black px-4 py-3">
				<p class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Preview — row 1</p>
				{#if previewFrom}
					<p class="text-xs font-bold text-black mt-1 truncate">From: {previewFrom}</p>
				{/if}
				{#if previewSubject}
					<p class="text-xs font-bold text-black truncate">Subject: {previewSubject}</p>
				{/if}
			</div>
			{#if previewError}
				<div class="p-4">
					<p class="text-xs font-bold text-brand-danger">{previewError}</p>
				</div>
			{:else if previewHtml}
				<iframe
					sandbox=""
					srcdoc={previewHtml}
					title="Email preview"
					class="w-full h-[440px] bg-white {previewLoading ? 'opacity-60' : ''} transition-opacity"
				/>
			{:else}
				<div class="h-[440px] bg-gray-200 animate-pulse" />
			{/if}
		</div>
	</div>
</div>

<style>
	/* Tiptap ProseMirror surface — match the input look without fighting Tailwind */
	.email-rich-editor :global(.ProseMirror) {
		outline: none;
		min-height: 140px;
		line-height: 1.6;
	}
	.email-rich-editor :global(.ProseMirror p) {
		margin: 0 0 0.6em;
	}
	.email-rich-editor :global(.ProseMirror h2) {
		font-size: 1.15rem;
		font-weight: 800;
		margin: 0.4em 0;
	}
	.email-rich-editor :global(.ProseMirror ul),
	.email-rich-editor :global(.ProseMirror ol) {
		padding-left: 1.2em;
		margin: 0 0 0.6em;
	}
	.email-rich-editor :global(.ProseMirror a) {
		color: #6366f1;
		text-decoration: underline;
	}
	.email-html-editor :global(.cm-editor) {
		min-height: 200px;
		font-size: 12px;
	}
	.email-html-editor :global(.cm-editor.cm-focused) {
		outline: none;
	}
</style>
