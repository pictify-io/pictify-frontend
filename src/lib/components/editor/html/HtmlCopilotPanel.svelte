<script>
	/**
	 * HtmlCopilotPanel — AI assistant rendered as a full tab inside the
	 * left pane (peer to Editor / Variables / API / Settings).
	 *
	 * Why a panel instead of a floating drawer: the drawer added a
	 * second simultaneous surface on top of the editor, and users
	 * were context-switching between "where I read the reply" and
	 * "where I see the result." Living in the tab bar keeps all
	 * editing surfaces in one column and the preview gets the full
	 * right pane.
	 *
	 * Behavioral contract (unchanged from the drawer):
	 *   - One-shot per turn; model returns a whole HTML document.
	 *   - Full conversation history sent on every turn so follow-ups
	 *     ("make the headline bigger") work against the last reply.
	 *   - Apply routes through the parent's imperative replaceAll()
	 *     so the change is a single undoable ⌘Z entry.
	 *
	 * IMPORTANT — this component is mounted always-on and hidden via
	 * `class:hidden` by the parent layout (same pattern the editor
	 * tab uses). Unmount would kill the conversation on tab switch,
	 * which defeats "follow-ups work across tabs."
	 */
	import { createEventDispatcher, tick, onDestroy, onMount } from 'svelte';
	import { streamHtmlCopilot } from '../../../../api/copilot-html';
	import {
		brandAssets,
		colors,
		fonts,
		fetchBrandAssets
	} from '../../../../store/brand-assets.store';

	export let currentHtml = '';
	export let currentVariables = [];
	export let width = 1080;
	export let height = 1080;

	// Brand context fed to the copilot so generated templates reach
	// for the team's palette and typography instead of generic defaults.
	// Only colors + fonts are surfaced — logos/images are too
	// situational to auto-insert and would bloat the prompt. If the
	// store hasn't loaded (brand tab never opened) we ship an empty
	// payload; the backend system prompt handles the "no brand" case.
	$: brandContext = {
		colors: ($colors || []).slice(0, 24).map((c) => ({
			name: c.name,
			hex: c.value,
			role: c.metadata?.colorCategory || null
		})),
		fonts: ($fonts || []).slice(0, 8).map((f) => ({
			family: f.metadata?.fontFamily || f.name,
			hosted: !!f.url
		}))
	};

	const dispatch = createEventDispatcher();

	/** @typedef {{ role: 'user' | 'assistant', content: string, pending?: boolean, errored?: boolean }} Turn */
	/** @type {Turn[]} */
	let turns = [];
	let input = '';
	let active = null; // stream handle; { abort }
	let scrollArea;
	let textareaEl;

	let streamingIndex = -1;
	let pendingApplyHtml = null;
	/** @type {Array<{type:string, message:string}>} */
	let pendingWarnings = [];

	async function scrollToBottom() {
		await tick();
		if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
	}

	function resetConversation() {
		if (active) active.abort();
		active = null;
		turns = [];
		pendingApplyHtml = null;
		pendingWarnings = [];
		streamingIndex = -1;
	}

	async function send() {
		const text = input.trim();
		if (!text || active) return;
		input = '';

		turns = [
			...turns,
			{ role: 'user', content: text },
			{ role: 'assistant', content: '', pending: true }
		];
		streamingIndex = turns.length - 1;
		pendingApplyHtml = null;
		pendingWarnings = [];
		scrollToBottom();

		const messages = turns
			.slice(0, -1)
			.map((t) => ({ role: t.role, content: t.content }));

		active = streamHtmlCopilot({
			messages,
			currentHtml,
			currentVariables,
			brandContext,
			width,
			height,
			onToken: (piece) => {
				if (streamingIndex < 0) return;
				const next = [...turns];
				next[streamingIndex] = {
					...next[streamingIndex],
					content: (next[streamingIndex].content || '') + piece
				};
				turns = next;
				scrollToBottom();
			},
			onComplete: (result) => {
				active = null;
				if (streamingIndex < 0) return;
				const next = [...turns];
				next[streamingIndex] = {
					...next[streamingIndex],
					content: result.rawReply || next[streamingIndex].content,
					pending: false
				};
				turns = next;
				streamingIndex = -1;
				pendingApplyHtml = result.html || null;
				pendingWarnings = Array.isArray(result.warnings) ? result.warnings : [];
			},
			onError: (err) => {
				active = null;
				if (streamingIndex >= 0) {
					const next = [...turns];
					next[streamingIndex] = {
						...next[streamingIndex],
						content:
							(next[streamingIndex].content || '') +
							`\n\n**Error**: ${err.message || 'Copilot failed'}`,
						pending: false,
						errored: true
					};
					turns = next;
					streamingIndex = -1;
				}
			}
		});
	}

	function stop() {
		if (active) active.abort();
		active = null;
		if (streamingIndex >= 0) {
			const next = [...turns];
			next[streamingIndex] = {
				...next[streamingIndex],
				content:
					(next[streamingIndex].content || '') + '\n\n_(stopped)_',
				pending: false
			};
			turns = next;
			streamingIndex = -1;
		}
	}

	function applyPending() {
		if (!pendingApplyHtml) return;
		dispatch('apply', { html: pendingApplyHtml });
		pendingApplyHtml = null;
		pendingWarnings = [];
	}

	function onKey(e) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			send();
		}
	}

	onMount(() => {
		// Fire a brand-assets fetch if the store hasn't loaded yet.
		// The Brand tab does the same, but the copilot panel might be
		// the user's first stop — without this, the first generation
		// ships without brand context and the model picks generic
		// colors. Store caches, so the Brand tab's fetch is a no-op.
		if (!$brandAssets.assets.length && !$brandAssets.loading) {
			fetchBrandAssets().catch(() => {
				/* swallow — brand fetch failure is non-fatal */
			});
		}
	});

	onDestroy(() => {
		if (active) active.abort();
	});

	const QUICK_PROMPTS = [
		'Make a pricing card with 3 tiers',
		'Design an OG image with headline + subtitle',
		'Build a receipt template with line items',
		'Create a testimonial quote card with avatar',
		'Make a dashboard KPI tile with trend delta'
	];

	function seedPrompt(p) {
		input = p;
		tick().then(() => textareaEl?.focus());
	}

	// Strip the fenced html block from the visible reply so the chat
	// bubble reads naturally. The full ```html …``` body lives in the
	// Apply banner and in the editor once applied.
	function displayAssistantReply(content) {
		if (!content) return '';
		const fence = content.match(/^([\s\S]*?)```(?:html)?\s*\n([\s\S]*?)```([\s\S]*)$/);
		if (!fence) return content;
		const before = fence[1].trim();
		const inside = fence[2].trim();
		const after = fence[3].trim();
		const lines = inside.split('\n').length;
		const chars = inside.length;
		const marker = `\n\n\u2554\u2550 Generated HTML (${lines} lines, ${chars} chars) — see Apply below\n`;
		return [before, marker, after].filter(Boolean).join('');
	}
</script>

<div class="flex h-full w-full flex-col bg-[#FFFDF8]">
	<!-- Panel header strip — mirrors the dialect of HtmlVariablesPanel
	     header so the Copilot tab feels like a peer of the other
	     tabs rather than a foreign surface. -->
	<div class="flex items-center justify-between gap-3 border-b-[3px] border-gray-900 bg-[#ffc480] px-6 py-4">
		<div class="flex items-center gap-2">
			<div class="flex h-8 w-8 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white shadow-[2px_2px_0_0_#1f2937]">
				<i class="fa fa-wand-magic-sparkles text-[12px] text-gray-900"></i>
			</div>
			<div>
				<h2 class="text-sm font-black uppercase tracking-widest text-gray-900">Copilot</h2>
				<p class="mt-0.5 text-[10px] font-bold text-gray-700">Ask, iterate, apply</p>
			</div>
		</div>
		{#if turns.length > 0}
			<button
				type="button"
				on:click={resetConversation}
				title="Clear conversation"
				aria-label="Clear conversation"
				class="flex h-8 items-center gap-1.5 rounded-md border-[2px] border-gray-900 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-gray-700 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-900 hover:text-white hover:shadow-none"
			>
				<i class="fa fa-arrows-rotate text-[10px]"></i>
				Reset
			</button>
		{/if}
	</div>

	<!-- Messages list / empty state. Takes all remaining vertical
	     space; composer + apply banner anchor to the bottom. -->
	<div bind:this={scrollArea} class="flex-1 overflow-y-auto px-6 py-4">
		{#if turns.length === 0}
			<div class="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
				<div class="flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-gray-900 bg-[#ffe066] shadow-[3px_3px_0_0_#1f2937]">
					<i class="fa fa-wand-magic-sparkles text-lg text-gray-900"></i>
				</div>
				<p class="text-[12px] font-black uppercase tracking-widest text-gray-900">
					Describe the template
				</p>
				<p class="max-w-[340px] text-[12px] font-semibold leading-relaxed text-gray-600">
					Ask for a design, a fix, or a tweak. Follow-ups keep context from the previous reply — say "bigger heading" and it knows what you mean.
				</p>
				<div class="flex flex-wrap justify-center gap-2 px-4">
					{#each QUICK_PROMPTS as qp}
						<button
							type="button"
							on:click={() => seedPrompt(qp)}
							class="rounded-md border-[2px] border-gray-900 bg-white px-3 py-1.5 text-left text-[11px] font-bold text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#ffe066] hover:shadow-none"
						>
							{qp}
						</button>
					{/each}
				</div>
			</div>
		{:else}
			<div class="space-y-4">
				{#each turns as turn (turn)}
					{#if turn.role === 'user'}
						<div class="flex justify-end">
							<div class="max-w-[80%] rounded-xl rounded-tr-sm border-[2px] border-gray-900 bg-gray-900 px-4 py-3 text-[13px] font-semibold leading-relaxed text-white shadow-[3px_3px_0_0_#ffc480]">
								{turn.content}
							</div>
						</div>
					{:else}
						<div class="flex justify-start">
							<div class="max-w-[90%] rounded-xl rounded-tl-sm border-[2px] border-gray-900 bg-white px-4 py-3 text-[12px] leading-relaxed text-gray-900 shadow-[3px_3px_0_0_#1f2937]">
								<div class="mb-1 flex items-center gap-2">
									<span class="text-[9px] font-black uppercase tracking-widest text-gray-500">Copilot</span>
									{#if turn.pending}
										<span class="inline-flex items-center gap-1 rounded-md border-[1.5px] border-gray-900 bg-[#ffe066] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest">
											<i class="fa fa-circle-dot fa-beat text-[7px]"></i>
											Writing
										</span>
									{:else if turn.errored}
										<span class="inline-flex items-center gap-1 rounded-md border-[1.5px] border-gray-900 bg-[#ff6b6b] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-white">
											Error
										</span>
									{/if}
								</div>
								<pre class="whitespace-pre-wrap font-sans text-[12px] leading-relaxed">{displayAssistantReply(turn.content) || '\u2026'}</pre>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>

	<!-- Apply banner — only appears after a successful generation. Stays visible until the user applies or skips. -->
	{#if pendingApplyHtml && !active}
		<div class="border-t-[3px] border-gray-900 {pendingWarnings.length > 0 ? 'bg-[#ff6b6b]' : 'bg-[#ffe066]'} px-6 py-3">
			<div class="mb-2 flex items-center justify-between gap-2">
				<p class="text-[11px] font-black uppercase tracking-widest {pendingWarnings.length > 0 ? 'text-white' : 'text-gray-900'}">
					{pendingWarnings.length > 0 ? 'Ready — with warnings' : 'Ready to apply'}
				</p>
				<span class="font-mono text-[10px] {pendingWarnings.length > 0 ? 'text-white/90' : 'text-gray-700'}">
					{pendingApplyHtml.split('\n').length} lines
				</span>
			</div>

			{#if pendingWarnings.length > 0}
				<!-- Unknown-helper (and similar) warnings come from a
				     post-generation pass — the backend already tried a
				     corrective retry, so anything here is persistent. -->
				<div class="mb-3 space-y-1.5 rounded-md border-[2px] border-gray-900 bg-white/95 p-2.5">
					{#each pendingWarnings as w}
						<p class="text-[11px] font-bold leading-snug text-gray-900">
							<i class="fa fa-triangle-exclamation mr-1 text-[10px] text-[#c62828]"></i>
							{w.message}
						</p>
					{/each}
					<p class="text-[10px] font-semibold text-gray-600">
						You can still apply and fix by hand, or ask the copilot to retry.
					</p>
				</div>
			{:else}
				<p class="mb-3 text-[11px] font-semibold leading-relaxed text-gray-700">
					This replaces the editor buffer. Use <span class="font-mono">⌘Z</span> in the editor to undo.
				</p>
			{/if}

			<div class="flex items-center gap-2">
				<button
					type="button"
					on:click={applyPending}
					class="flex-1 rounded-md border-[2px] border-gray-900 {pendingWarnings.length > 0 ? 'bg-white text-gray-900' : 'bg-[#4ade80] text-gray-900'} px-3 py-2 text-[11px] font-black uppercase tracking-widest shadow-[3px_3px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
				>
					<i class="fa fa-check mr-1 text-[10px]"></i>
					{pendingWarnings.length > 0 ? 'Apply anyway' : 'Apply to editor'}
				</button>
				<button
					type="button"
					on:click={() => { pendingApplyHtml = null; pendingWarnings = []; }}
					class="rounded-md border-[2px] border-gray-900 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
				>
					Skip
				</button>
			</div>
		</div>
	{/if}

	<!-- Composer — anchored to the bottom of the pane. -->
	<div class="border-t-[3px] border-gray-900 bg-white px-6 py-3">
		<label for="copilot-prompt-input" class="block text-[10px] font-black uppercase tracking-widest text-gray-900">
			Prompt
		</label>
		<textarea
			id="copilot-prompt-input"
			bind:this={textareaEl}
			bind:value={input}
			on:keydown={onKey}
			rows="3"
			placeholder={turns.length > 0 ? 'Follow up…' : 'Describe the template you want…'}
			class="mt-1.5 w-full resize-none rounded-lg border-[2px] border-gray-900 bg-[#FFFDF8] px-3 py-2 text-[13px] leading-relaxed text-gray-900 transition-all focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_#ffc480] focus:outline-none"
		></textarea>
		<div class="mt-2 flex items-center justify-between gap-2">
			<span class="font-mono text-[10px] text-gray-500">⌘↵ to send</span>
			{#if active}
				<button
					type="button"
					on:click={stop}
					class="flex items-center gap-2 rounded-md border-[2px] border-gray-900 bg-[#ff6b6b] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
				>
					<i class="fa fa-stop text-[10px]"></i>
					Stop
				</button>
			{:else}
				<button
					type="button"
					on:click={send}
					disabled={!input.trim()}
					class="flex items-center gap-2 rounded-md border-[2px] border-gray-900 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all disabled:cursor-default
						{input.trim()
							? 'bg-gray-900 text-white shadow-[3px_3px_0_0_#ffc480] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
							: 'bg-gray-100 text-gray-400'}"
				>
					<i class="fa fa-paper-plane text-[10px]"></i>
					Send
				</button>
			{/if}
		</div>
	</div>
</div>
