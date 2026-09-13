<script>
	/**
	 * Editing by describing the change. Each exchange is one instruction and one
	 * short receipt of what actually happened — not a chat log, a record of
	 * edits, which is why every entry is paired with a version you can undo to.
	 */
	import { createEventDispatcher, tick } from 'svelte';

	const dispatch = createEventDispatcher();

	/**
	 * [{ role: 'you', text } | { role: 'receipt', note, added, removed, version, failed? }]
	 * oldest first. A receipt's derived facts are the record; `note` is the
	 * agent's own sentence and is often absent.
	 */
	export let history = [];
	/** Live agent progress for the run in flight: [{ id, label, done }]. */
	export let stages = [];
	export let busy = false;
	export let canUndo = false;
	/** First-run: no template yet, the composer is the whole story. */
	export let creating = false;

	let draft = '';
	let scroller;

	$: placeholder = creating ? 'Describe the file you need…' : 'Describe a change…';

	async function submit() {
		const text = draft.trim();
		if (!text || busy) return;
		draft = '';
		dispatch('submit', { text });
		await tick();
		if (scroller) scroller.scrollTop = scroller.scrollHeight;
	}

	function onKeydown(event) {
		// Enter submits; Shift+Enter is a newline. Instructions are usually one
		// line, so making the common case free is worth the modifier.
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			submit();
		}
	}
</script>

<div class="flex min-h-0 flex-1 flex-col">
	<div bind:this={scroller} class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
		{#if creating && history.length === 0}
			<p class="font-sans text-[13px] leading-[19px] text-brand-slate">
				Say what you want and the first version gets written for you. You can refine it
				afterwards, or switch to HTML and write it yourself.
			</p>
		{/if}

		{#each history as entry, i (i)}
			{#if entry.role === 'you'}
				<div class="flex flex-col gap-1 rounded-tile bg-brand-subtle px-3.5 py-2.5">
					<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute">You</span>
					<span class="font-sans text-[13.5px] leading-[19px] text-brand-ink">{entry.text}</span>
				</div>
			{:else}
				<div class="flex gap-2 px-1">
					<span
						class="mt-[6px] block h-2 w-2 flex-shrink-0 {entry.failed ? 'bg-brand-alarm' : 'bg-brand-proof'}"
						aria-hidden="true"
					></span>
					<div class="flex min-w-0 flex-col gap-1">
						{#if entry.note}
							<span class="font-sans text-[13.5px] leading-[19px] {entry.failed ? 'text-brand-alarm' : 'text-brand-slate'}">
								{entry.note}
							</span>
						{/if}
						{#if !entry.failed}
							<!-- Derived from what actually changed, so it cannot overstate
							     the edit the way a generated summary can. -->
							<span class="font-mono text-[10px] uppercase leading-[15px] tracking-[0.06em] text-brand-mute">
								{#if entry.added?.length}
									+{entry.added.join(' +')}
								{/if}
								{#if entry.removed?.length}
									−{entry.removed.join(' −')}
								{/if}
								{#if !entry.added?.length && !entry.removed?.length}
									{#if entry.htmlChanged}
										Markup edited{#if entry.lineDelta}, {entry.lineDelta > 0 ? '+' : ''}{entry.lineDelta} line{Math.abs(entry.lineDelta) === 1 ? '' : 's'}{/if}
									{:else}
										No change
									{/if}
								{/if}
								· v{entry.version}
							</span>
						{/if}
					</div>
				</div>
			{/if}
		{/each}

		{#if busy}
			<div class="flex gap-2 px-1">
				<span class="mt-[6px] block h-2 w-2 flex-shrink-0 animate-pulse bg-brand-field" aria-hidden="true"></span>
				<div class="flex min-w-0 flex-col gap-1">
					<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-mute">
						Applying your change…
					</span>
					<!-- An agent turn can be silent for a minute. Showing what it is
					     actually doing is the difference between waiting and hanging. -->
					{#each stages as stage (stage.id)}
						<span class="font-mono text-[10px] uppercase leading-[15px] tracking-[0.06em] {stage.done ? 'text-brand-mute' : 'text-brand-slate'}">
							{stage.done ? '·' : '›'} {stage.label}
						</span>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<div class="flex flex-col gap-2 border-t border-brand-rule px-4 py-3">
		{#if history.length > 0}
			<div class="flex items-center justify-between gap-2">
				<span class="font-mono text-[10px] uppercase leading-[13px] tracking-[0.08em] text-brand-mute">
					Every change is a version — undo anytime
				</span>
				<button
					type="button"
					on:click={() => dispatch('undo')}
					disabled={!canUndo || busy}
					class="flex-shrink-0 rounded-btn border border-brand-rule px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink disabled:opacity-40"
				>
					Undo
				</button>
			</div>
		{/if}
		<div class="flex items-end gap-2 rounded-tile border-[1.5px] border-brand-rule px-3 py-2 focus-within:border-brand-ink">
			<textarea
				bind:value={draft}
				on:keydown={onKeydown}
				disabled={busy}
				rows="1"
				{placeholder}
				class="max-h-[120px] min-h-[22px] w-full resize-none bg-transparent font-sans text-[13.5px] text-brand-ink outline-none placeholder:text-brand-mute disabled:opacity-60"
			></textarea>
			<button
				type="button"
				on:click={submit}
				disabled={busy || !draft.trim()}
				aria-label="Send"
				class="mb-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center bg-brand-ink disabled:opacity-30"
			>
				<span class="block h-2 w-2 bg-brand-field"></span>
			</button>
		</div>
	</div>
</div>
