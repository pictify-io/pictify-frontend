<script>
	/**
	 * The conversation that edits the composition.
	 *
	 * This is the default way to change a Remotion scene now: you describe what
	 * you want and the code is rewritten for you. The code pane still exists, but
	 * behind a tab — most people editing a video template are not here to read
	 * React, and putting the source in front of them first made the editor look
	 * like a developer tool that happened to render video.
	 *
	 * A chat rather than a single prompt box because editing is iterative. "Make
	 * it bolder" only means something after "shorten the intro", and a one-shot
	 * field throws away the record of what you already asked for. Each turn also
	 * has to report what actually happened — applied, refused, or no change —
	 * since an instruction that compiled to the same scene looks identical to one
	 * that silently failed.
	 */
	import { createEventDispatcher, tick } from 'svelte';

	/**
	 * @type {Array<{role: 'user'|'assistant', text: string, status?: 'applied'|'nochange'|'error', errors?: string[], revertable?: boolean}>}
	 */
	export let messages = [];
	export let busy = false;
	/** Shown once, before anyone has asked for anything. */
	export let suggestions = [];

	const dispatch = createEventDispatcher();

	let draft = '';
	let listEl;

	const send = (text) => {
		const ask = String(text ?? draft).trim();
		if (!ask || busy) return;
		draft = '';
		dispatch('send', { instruction: ask });
	};

	const onKeydown = (event) => {
		// The studio's own hotkeys must not fire while someone is typing a
		// sentence — "d" duplicates a clip, Backspace deletes one.
		event.stopPropagation();
		// Enter sends; Shift+Enter is a newline, which is the convention every
		// chat input has trained people to expect.
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			send();
		}
	};

	// Follow the conversation as it grows, so the newest turn is never below the
	// fold at the moment it arrives.
	$: if (messages.length && listEl) {
		tick().then(() => {
			listEl.scrollTop = listEl.scrollHeight;
		});
	}
</script>

<div class="flex h-full min-h-0 flex-col bg-gray-950">
	<div bind:this={listEl} class="ov-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
		{#if !messages.length}
			<div class="pt-2">
				<p class="text-[11px] font-bold leading-snug text-gray-300">
					Describe a change and the scene is rewritten for you.
				</p>
				<p class="mt-1 text-[11px] leading-snug text-gray-500">
					Every edit has to compile before it is applied, so a request that would
					break the video is refused instead.
				</p>
				{#if suggestions.length}
					<div class="mt-3 flex flex-col gap-1.5">
						{#each suggestions as suggestion (suggestion)}
							<button
								type="button"
								on:click={() => send(suggestion)}
								disabled={busy}
								class="rounded border border-gray-800 bg-gray-900 px-2 py-1.5 text-left text-[11px] text-gray-300 transition-colors hover:border-brand-accent/60 hover:text-white disabled:opacity-50"
							>
								{suggestion}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		{#each messages as message, i (i)}
			{#if message.role === 'user'}
				<div class="mb-2 flex justify-end">
					<p
						class="max-w-[85%] rounded-lg rounded-br-sm border-[2px] border-black bg-brand-accent px-2 py-1.5 text-[11px] font-bold leading-snug text-black"
					>
						{message.text}
					</p>
				</div>
			{:else}
				<div class="mb-3">
					<p
						class="max-w-[90%] rounded-lg rounded-bl-sm border border-gray-800 bg-gray-900 px-2 py-1.5 text-[11px] leading-snug
							{message.status === 'error' ? 'text-brand-danger' : 'text-gray-300'}"
					>
						{message.text}
					</p>

					{#if message.errors?.length}
						<!-- The compiler's own words. "It failed" tells you nothing you can
						     act on; the actual error usually tells you what to ask for next. -->
						<div class="mt-1 rounded border border-brand-danger/40 bg-brand-danger/10 p-1.5">
							{#each message.errors as error (error)}
								<p class="font-mono text-[10px] leading-snug text-brand-danger">{error}</p>
							{/each}
						</div>
					{/if}

					{#if message.revertable}
						<button
							type="button"
							on:click={() => dispatch('revert')}
							title="Put the composition back the way it was before this edit"
							class="mt-1.5 rounded border-[2px] border-black bg-gray-800 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-100 transition-colors hover:bg-gray-700"
						>
							Undo this edit
						</button>
					{/if}
				</div>
			{/if}
		{/each}

		{#if busy}
			<div class="flex items-center gap-2 px-1 py-1 text-[11px] text-gray-400">
				<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-accent"></span>
				Rewriting the scene…
			</div>
		{/if}
	</div>

	<form
		on:submit|preventDefault={() => send()}
		class="shrink-0 border-t-[3px] border-black bg-gray-900 p-2"
	>
		<textarea
			bind:value={draft}
			on:keydown={onKeydown}
			disabled={busy}
			rows="2"
			placeholder="Make the intro shorter…"
			aria-label="Describe a change for AI to make"
			class="w-full resize-none rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-[11px] leading-snug text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:border-brand-accent disabled:opacity-60"
		></textarea>
		<div class="mt-1.5 flex items-center justify-between">
			<span class="text-[10px] text-gray-600">Enter to send</span>
			<button
				type="submit"
				disabled={busy || !draft.trim()}
				class="rounded border-[2px] border-black bg-brand-accent px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:-translate-y-px disabled:translate-y-0 disabled:opacity-40"
			>
				{busy ? 'Editing…' : 'Send'}
			</button>
		</div>
	</form>
</div>
