<script>
	/**
	 * HtmlCopilotDrawer — right-side AI assistant for the HTML editor.
	 *
	 * Design posture: conversational (multi-turn) but one-shot per
	 * turn. The user types a prompt, the backend streams a new full
	 * HTML block, we show it with an Apply button. Applying replaces
	 * the editor buffer atomically via the parent's imperative
	 * `replaceAll` path (same mechanism the delete-tokens flow uses).
	 *
	 * What we DON'T do:
	 *   - Partial patches / diff-apply — the model returns whole
	 *     documents, apply is all-or-nothing.
	 *   - Tool calls (declare variable, run helper) — variables
	 *     auto-declare via the editor's existing reference pipeline
	 *     on the next keystroke after apply.
	 *
	 * Why a drawer, not a modal: the user should be able to edit the
	 * template while reading the assistant's reply; a modal would
	 * block that. Drawer is 420px wide to fit on a laptop screen
	 * without forcing the preview below 400px.
	 *
	 * Conversation history lives here (per-drawer instance) and is
	 * shipped in full on every turn so follow-ups like "make the
	 * title larger" work against the latest state. History is cleared
	 * when the drawer unmounts — the current working buffer is the
	 * user's actual source of truth.
	 */
	import { createEventDispatcher, tick, onDestroy } from 'svelte';
	import { streamHtmlCopilot } from '../../../../api/copilot-html';

	/** Whether the drawer is visible. Parent controls mount — we
	    don't unmount ourselves because closing mid-stream should
	    abort the request via the abort() returned from the client. */
	export let show = false;
	/** Live editor buffer at send time. */
	export let currentHtml = '';
	/** Declared variable definitions — sent to the model so it can
	    reference them without re-declaring. */
	export let currentVariables = [];
	export let width = 1080;
	export let height = 1080;

	const dispatch = createEventDispatcher();

	/** @typedef {{ role: 'user' | 'assistant', content: string, pending?: boolean, errored?: boolean }} Turn */
	/** @type {Turn[]} */
	let turns = [];
	/** Bound to the textarea. */
	let input = '';
	/** Set while a stream is in flight. Used to disable Send + show the stop control. */
	let active = null; // { abort } handle
	let scrollArea;
	let textareaEl;

	/** Pending assistant turn we're currently appending tokens to. */
	let streamingIndex = -1;
	/** The most recent assistant reply's extracted html — what the Apply
	    button will push into the editor when clicked. */
	let pendingApplyHtml = null;

	// Scroll the messages list to the newest message whenever turns
	// change. Runs after tick so the DOM has actually updated.
	async function scrollToBottom() {
		await tick();
		if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
	}

	function closeDrawer() {
		if (active) active.abort();
		active = null;
		dispatch('close');
	}

	function resetConversation() {
		if (active) active.abort();
		active = null;
		turns = [];
		pendingApplyHtml = null;
		streamingIndex = -1;
	}

	async function send() {
		const text = input.trim();
		if (!text || active) return;
		input = '';

		// Append the user turn + an empty assistant turn we'll stream into.
		turns = [
			...turns,
			{ role: 'user', content: text },
			{ role: 'assistant', content: '', pending: true }
		];
		streamingIndex = turns.length - 1;
		pendingApplyHtml = null;
		scrollToBottom();

		// Ship the FULL conversation every turn — the backend trims
		// to an 8-pair window server-side so we don't need to manage
		// token budgets here.
		const messages = turns
			.slice(0, -1) // drop the empty pending assistant slot
			.map((t) => ({ role: t.role, content: t.content }));

		active = streamHtmlCopilot({
			messages,
			currentHtml,
			currentVariables,
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
	}

	function onKey(e) {
		// Cmd/Ctrl+Enter → send (textarea Enter should keep inserting newlines).
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			send();
		}
		if (e.key === 'Escape' && !active) {
			closeDrawer();
		}
	}

	// Swallow outstanding streams if the component itself is removed.
	onDestroy(() => {
		if (active) active.abort();
	});

	// Quick-prompt suggestions shown when the conversation is empty —
	// they seed the text area instead of dispatching, so the user can
	// tweak before sending.
	const QUICK_PROMPTS = [
		'Make a pricing card with 3 tiers',
		'Design an OG image with a headline + subtitle',
		'Build a receipt template with line items',
		'Create a testimonial quote card with avatar',
		'Make a dashboard KPI tile with a trend delta'
	];

	function seedPrompt(p) {
		input = p;
		// Give the textarea focus so the user can edit / hit Cmd+Enter.
		tick().then(() => textareaEl?.focus());
	}

	// Strip the fenced html block from the displayed assistant reply
	// so the conversation reads naturally — the raw model output has
	// the full ```html …``` block which is noisy in chat context.
	function displayAssistantReply(content) {
		if (!content) return '';
		const fence = content.match(/^([\s\S]*?)```(?:html)?\s*\n([\s\S]*?)```([\s\S]*)$/);
		if (!fence) return content;
		const before = fence[1].trim();
		const inside = fence[2].trim();
		const after = fence[3].trim();
		const lines = inside.split('\n').length;
		const chars = inside.length;
		const marker = `\n\n\u2554\u2550 **Generated HTML** (${lines} lines, ${chars} chars) — see Apply button\n`;
		return [before, marker, after].filter(Boolean).join('');
	}
</script>

{#if show}
	<!-- Fixed drawer; never covers the whole viewport so the editor
	     stays usable while the assistant is writing. -->
	<aside
		class="fixed right-0 top-0 z-[135] flex h-full w-[420px] flex-col border-l-[3px] border-gray-900 bg-[#FFFDF8] shadow-[-8px_0_0_0_#1f2937]"
		aria-label="HTML copilot"
	>
		<!-- Header -->
		<div class="flex items-center justify-between gap-3 border-b-[3px] border-gray-900 bg-[#ffc480] px-5 py-4">
			<div class="flex items-center gap-2">
				<div class="flex h-8 w-8 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white shadow-[2px_2px_0_0_#1f2937]">
					<i class="fa fa-wand-magic-sparkles text-[12px] text-gray-900"></i>
				</div>
				<div>
					<h2 class="text-sm font-black uppercase tracking-widest text-gray-900">
						Copilot
					</h2>
					<p class="mt-0.5 text-[10px] font-bold text-gray-700">
						Ask, iterate, apply
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				{#if turns.length > 0}
					<button
						type="button"
						on:click={resetConversation}
						title="Clear conversation"
						aria-label="Clear conversation"
						class="flex h-8 w-8 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white text-gray-700 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-900 hover:text-white hover:shadow-none"
					>
						<i class="fa fa-arrows-rotate text-[11px]"></i>
					</button>
				{/if}
				<button
					type="button"
					on:click={closeDrawer}
					aria-label="Close"
					class="flex h-8 w-8 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white text-gray-700 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-900 hover:text-white hover:shadow-none"
				>
					<i class="fa fa-xmark text-[12px]"></i>
				</button>
			</div>
		</div>

		<!-- Messages list + empty state. The keydown handler lives on
		     the drawer itself (not this scroll area) — clearer a11y
		     semantics: the whole drawer responds to Esc + ⌘↵. -->
		<div bind:this={scrollArea} class="flex-1 overflow-y-auto px-5 py-4">
			{#if turns.length === 0}
				<div class="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
					<div class="flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-gray-900 bg-[#ffe066] shadow-[3px_3px_0_0_#1f2937]">
						<i class="fa fa-wand-magic-sparkles text-lg text-gray-900"></i>
					</div>
					<p class="text-[12px] font-black uppercase tracking-widest text-gray-900">
						Describe the template
					</p>
					<p class="max-w-[280px] text-[12px] font-semibold leading-relaxed text-gray-600">
						Ask for a design, a fix, or a tweak. Follow-ups keep context from the previous reply — say "bigger heading" and it'll know what you mean.
					</p>
					<div class="flex flex-wrap justify-center gap-2">
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
					{#each turns as turn, i}
						{#if turn.role === 'user'}
							<div class="flex justify-end">
								<div class="max-w-[85%] rounded-xl rounded-tr-sm border-[2px] border-gray-900 bg-gray-900 px-4 py-3 text-[13px] font-semibold leading-relaxed text-white shadow-[3px_3px_0_0_#ffc480]">
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

		<!-- Apply banner — appears after a successful generation, sticks until the user applies or ignores by sending another turn. -->
		{#if pendingApplyHtml && !active}
			<div class="border-t-[3px] border-gray-900 bg-[#ffe066] px-5 py-3">
				<div class="mb-2 flex items-center justify-between gap-2">
					<p class="text-[11px] font-black uppercase tracking-widest text-gray-900">
						Ready to apply
					</p>
					<span class="font-mono text-[10px] text-gray-700">
						{pendingApplyHtml.split('\n').length} lines
					</span>
				</div>
				<p class="mb-3 text-[11px] font-semibold leading-relaxed text-gray-700">
					This replaces your editor buffer. Use <span class="font-mono">⌘Z</span> in the editor to undo.
				</p>
				<div class="flex items-center gap-2">
					<button
						type="button"
						on:click={applyPending}
						class="flex-1 rounded-md border-[2px] border-gray-900 bg-[#4ade80] px-3 py-2 text-[11px] font-black uppercase tracking-widest text-gray-900 shadow-[3px_3px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
					>
						<i class="fa fa-check mr-1 text-[10px]"></i>
						Apply to editor
					</button>
					<button
						type="button"
						on:click={() => (pendingApplyHtml = null)}
						class="rounded-md border-[2px] border-gray-900 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
					>
						Skip
					</button>
				</div>
			</div>
		{/if}

		<!-- Composer -->
		<div class="border-t-[3px] border-gray-900 bg-white px-5 py-3">
			<label for="copilot-prompt-input" class="block text-[10px] font-black uppercase tracking-widest text-gray-900">Prompt</label>
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
	</aside>
{/if}
