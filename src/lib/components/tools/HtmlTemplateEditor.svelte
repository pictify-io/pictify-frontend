<script>
	// Code-first template editor for the free tool pages.
	//
	// Three pieces:
	//   - Template picker: a small library of pre-built designs per use case.
	//   - Preview / Edit HTML tabs. The edit tab lazy-loads the workspace's
	//     CodeMirror editor (syntax highlighting, {{variable}} autocomplete,
	//     lint) with a live preview beside it — the HTML here is exactly what
	//     gets POSTed to /image/public, so the preview is a truthful render.
	//   - AI edit bar: describe a change in plain English. Guests are routed
	//     through signup (with the prompt preserved) and land back here;
	//     signed-in users stream the rewrite via the HTML copilot.
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';

	/** @type {Array<{id:string,name:string,description?:string,thumbnailColor:string,width:number,height:number,html:string}>} */
	export let templates = [];

	let selected = templates[0] || null;
	let lastTemplateSet = templates;
	let currentHtml = selected?.html || '';
	let previewHtml = currentHtml;
	let activeTab = 'preview';
	let containerWidth = 0;
	let editContainerWidth = 0;
	let debounceTimer;

	// CodeMirror editor is heavy — load it only when the edit tab first opens.
	let HtmlEditorComponent = null;
	let editorRef;
	let editorLoadFailed = false;

	// AI edit state
	const AI_PROMPT_KEY = 'pictify_tool_ai_prompt';
	let aiPrompt = '';
	let aiBusy = false;
	let aiStream = null;

	$: isLoggedIn = !!$user?.email;

	// Reset when the page navigates to a different use case (SvelteKit reuses
	// this component instance across [usecase] params).
	$: if (templates !== lastTemplateSet) {
		lastTemplateSet = templates;
		selected = templates[0] || null;
		currentHtml = selected?.html || '';
		previewHtml = currentHtml;
		activeTab = 'preview';
		aiPrompt = '';
	}

	// Fit previews by width AND a height cap so tall/square templates don't
	// dominate the page at full workbench width.
	$: previewScale = selected && containerWidth
		? Math.min(1, containerWidth / selected.width, 720 / selected.height)
		: 1;
	$: editPreviewScale = selected && editContainerWidth
		? Math.min(1, editContainerWidth / selected.width, 560 / selected.height)
		: 1;

	function selectTemplate(template) {
		if (aiBusy) return;
		selected = template;
		currentHtml = template.html;
		previewHtml = template.html;
		editorRef?.replaceAll?.(template.html);
	}

	function handleEditorChange(event) {
		currentHtml = event.detail.value;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			previewHtml = currentHtml;
		}, 400);
	}

	function resetTemplate() {
		if (!selected) return;
		currentHtml = selected.html;
		previewHtml = selected.html;
		editorRef?.replaceAll?.(selected.html);
	}

	async function openEditTab() {
		activeTab = 'edit';
		if (!HtmlEditorComponent && !editorLoadFailed) {
			try {
				const mod = await import('$lib/components/editor/html/HtmlEditor.svelte');
				HtmlEditorComponent = mod.default;
			} catch (e) {
				editorLoadFailed = true;
			}
		}
	}

	// --- AI edit -----------------------------------------------------------

	async function handleAiEdit() {
		const prompt = aiPrompt.trim();
		if (!prompt || aiBusy || !selected) return;

		if (!isLoggedIn) {
			// Preserve the prompt across the auth round-trip, then come back here.
			try {
				sessionStorage.setItem(AI_PROMPT_KEY, prompt);
			} catch (e) {
				/* ignored */
			}
			goto(`/signup?redirect=${encodeURIComponent(window.location.pathname)}`);
			return;
		}

		aiBusy = true;
		const { streamHtmlCopilot } = await import('../../../api/copilot-html.js');
		aiStream = streamHtmlCopilot({
			messages: [{ role: 'user', content: prompt }],
			currentHtml,
			currentVariables: [],
			width: selected.width,
			height: selected.height,
			// Free tools render HTML verbatim — no Handlebars pass, so the AI
			// must not introduce {{variables}}.
			mode: 'static',
			onComplete: (result) => {
				aiBusy = false;
				if (result?.html) {
					currentHtml = result.html;
					previewHtml = result.html;
					editorRef?.replaceAll?.(result.html);
					aiPrompt = '';
					activeTab = 'preview';
					toast.set({ message: 'Template updated by AI', type: 'success', duration: 2500 });
				} else {
					toast.set({
						message: 'The AI did not return any HTML. Try rephrasing.',
						type: 'error',
						duration: 3000
					});
				}
			},
			onError: (err) => {
				aiBusy = false;
				const raw = err?.message || 'AI edit failed';
				let message = raw;
				if (/\(401\)|\(403\)/.test(raw)) {
					message = 'Please sign in to use AI editing.';
				} else if (/\(402\)|credit/i.test(raw)) {
					message = 'You are out of AI credits for this billing period.';
				}
				toast.set({ message, type: 'error', duration: 4000 });
			}
		});
	}

	onMount(() => {
		// Restore a prompt saved before the signup round-trip.
		try {
			const pending = sessionStorage.getItem(AI_PROMPT_KEY);
			if (pending) {
				sessionStorage.removeItem(AI_PROMPT_KEY);
				aiPrompt = pending;
			}
		} catch (e) {
			/* ignored */
		}
		return () => {
			clearTimeout(debounceTimer);
			aiStream?.abort?.();
		};
	});

	export function getSelected() {
		if (!selected) return null;
		return { html: currentHtml, width: selected.width, height: selected.height };
	}
</script>

<div class="w-full">
	<!-- Workbench toolbar: template picker + view tabs -->
	<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
		{#if templates.length > 1}
			<div class="flex gap-2.5 overflow-x-auto scrollbar-thin max-w-full">
				{#each templates as template}
					<button
						type="button"
						on:click={() => selectTemplate(template)}
						class="flex-shrink-0 flex items-center gap-2.5 px-4 py-2 bg-white border-[3px] rounded-xl transition-all cursor-pointer
							{selected?.id === template.id
							? 'border-brand-danger shadow-[4px_4px_0_0_#ff6b6b]'
							: 'border-gray-900 shadow-brutal-md hover:shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px]'}"
						title={template.description || template.name}
					>
						<span
							class="w-4 h-4 rounded border-2 border-gray-900 flex-shrink-0"
							style="background-color: {template.thumbnailColor};"
						/>
						<span class="text-xs font-black text-gray-900 uppercase tracking-wide whitespace-nowrap"
							>{template.name}</span
						>
					</button>
				{/each}
			</div>
		{/if}

		<div class="flex items-center gap-2 ml-auto">
			{#if selected && currentHtml !== selected.html}
				<button
					type="button"
					on:click={resetTemplate}
					class="text-xs font-bold text-gray-500 underline underline-offset-2 hover:text-gray-900 mr-2"
				>
					Reset
				</button>
			{/if}
			<div class="flex bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-brutal-md">
				<button
					type="button"
					on:click={() => (activeTab = 'preview')}
					class="px-5 py-2.5 text-xs font-black uppercase tracking-wide transition-colors
						{activeTab === 'preview' ? 'bg-brand-accent text-gray-900' : 'bg-white text-gray-500 hover:text-gray-900'}"
				>
					Preview
				</button>
				<button
					type="button"
					on:click={openEditTab}
					class="px-5 py-2.5 text-xs font-black uppercase tracking-wide transition-colors border-l-[3px] border-gray-900
						{activeTab === 'edit' ? 'bg-brand-accent text-gray-900' : 'bg-white text-gray-500 hover:text-gray-900'}"
				>
					&lt;/&gt; Edit HTML
				</button>
			</div>
		</div>
	</div>

	{#if activeTab === 'preview'}
		<div bind:clientWidth={containerWidth} class="w-full flex justify-center">
			{#if selected}
				<div
					class="overflow-hidden bg-white border-[3px] border-gray-900 shadow-brutal-xl rounded-lg"
					style="width: {Math.round(selected.width * previewScale)}px; height: {Math.round(
						selected.height * previewScale
					)}px;"
				>
					<iframe
						title="Template preview"
						srcdoc={previewHtml}
						scrolling="no"
						style="width: {selected.width}px; height: {selected.height}px; border: 0; transform: scale({previewScale}); transform-origin: top left; pointer-events: none;"
					/>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Edit mode: code gets the lion's share, live preview rides along -->
		<div class="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 items-start">
			<div
				class="border-[3px] border-gray-900 rounded-lg shadow-brutal-xl overflow-auto bg-brand-bg"
				style="height: 560px; min-height: 320px; resize: vertical;"
			>
				{#if HtmlEditorComponent}
					<svelte:component
						this={HtmlEditorComponent}
						bind:this={editorRef}
						value={currentHtml}
						on:change={handleEditorChange}
						lineWrap={true}
					/>
				{:else if editorLoadFailed}
					<textarea
						bind:value={currentHtml}
						on:input={handleEditorChange}
						spellcheck="false"
						class="w-full h-full font-mono text-xs leading-relaxed bg-gray-900 text-gray-100 border-0 p-4 focus:outline-none resize-none"
					/>
				{:else}
					<div class="w-full h-full flex items-center justify-center">
						<span class="text-xs font-bold text-gray-400 uppercase tracking-widest"
							>Loading editor…</span
						>
					</div>
				{/if}
			</div>
			<div class="xl:sticky xl:top-6">
				<div bind:clientWidth={editContainerWidth} class="w-full">
					{#if selected}
						<div
							class="overflow-hidden bg-white border-[3px] border-gray-900 shadow-brutal-xl rounded-lg mx-auto"
							style="width: {Math.round(selected.width * editPreviewScale)}px; height: {Math.round(
								selected.height * editPreviewScale
							)}px;"
						>
							<iframe
								title="Live preview"
								srcdoc={previewHtml}
								scrolling="no"
								style="width: {selected.width}px; height: {selected.height}px; border: 0; transform: scale({editPreviewScale}); transform-origin: top left; pointer-events: none;"
							/>
						</div>
					{/if}
				</div>
				<p class="mt-2 text-xs font-medium text-gray-500 text-center">
					Live preview: updates as you type. This exact HTML is what the API renders; swap
					sample values for
					<code class="font-mono bg-gray-100 px-1 rounded">{'{{variables}}'}</code> when you automate.
				</p>
			</div>
		</div>
	{/if}

	<!-- AI edit bar -->
	<div
		class="mt-4 bg-gray-900 border-[3px] border-gray-900 rounded-xl shadow-brutal-lg p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
	>
		<div class="flex items-center gap-2 flex-1 bg-gray-800 rounded-lg px-3 border border-gray-700">
			<span class="text-lg" aria-hidden="true">✨</span>
			<input
				type="text"
				bind:value={aiPrompt}
				on:keydown={(e) => e.key === 'Enter' && handleAiEdit()}
				disabled={aiBusy}
				placeholder="Describe a change: “make it dark mode”, “add a logo spot”, “more playful”…"
				class="w-full bg-transparent text-sm font-medium text-gray-100 placeholder-gray-500 py-3 focus:outline-none disabled:opacity-50"
			/>
		</div>
		<button
			type="button"
			on:click={handleAiEdit}
			disabled={aiBusy || !aiPrompt.trim()}
			class="px-6 py-3 bg-brand-accent text-gray-900 border-[3px] border-gray-900 font-black text-sm uppercase tracking-wide rounded-lg shadow-[3px_3px_0_0_#4b5563] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
		>
			{#if aiBusy}
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"
					><circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					/><path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
					/></svg
				>
				Rewriting…
			{:else}
				Edit with AI
			{/if}
		</button>
	</div>
	{#if !isLoggedIn}
		<p class="mt-2 text-xs font-medium text-gray-500">
			AI editing needs a free account; your prompt is kept while you sign up, and you'll land
			right back here.
		</p>
	{/if}
</div>
