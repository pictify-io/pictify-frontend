<script>
	/**
	 * The Versions panel. B04-4 / state S5 (board `GTP-0`).
	 *
	 * The durable history, as opposed to undo/redo — which is a session and dies
	 * with the tab. The distinction is stated in the panel rather than assumed,
	 * because the two are easy to confuse and only one of them survives a
	 * reload.
	 *
	 * Restoring makes a NEW revision. That is a product decision the copy has to
	 * carry, not just an implementation detail: a buyer who thinks Restore
	 * rewinds will expect the revisions above it to disappear, and be alarmed
	 * when they do not.
	 */
	import { createEventDispatcher } from 'svelte';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';

	/** `{ current, head, revisions }` from GET /template-draft/:uid/revisions. */
	export let data = null;
	export let loading = false;
	export let error = null;
	/** Revision currently being restored, so only its own row shows the wait. */
	export let restoring = null;

	const dispatch = createEventDispatcher();

	/*
	 * The square says WHO, and the words beside it repeat it — the square is
	 * never the only carrier of the fact (see StatusSquare's note). `import` is
	 * the outline square because an imported document was not authored here at
	 * all.
	 */
	const AUTHOR = {
		ai: { tone: 'ready', word: 'AI' },
		user: { tone: 'current', word: 'you' },
		restore: { tone: 'current', word: 'restore' },
		import: { tone: 'expired', word: 'import' }
	};
	const authorOf = (by) => AUTHOR[by] || AUTHOR.user;

	/** Time only for today, date and time for anything older. */
	function when(at) {
		if (!at) return '';
		const date = new Date(at);
		if (Number.isNaN(date.getTime())) return '';
		const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
		const sameDay = new Date().toDateString() === date.toDateString();
		return sameDay
			? `${time} today`
			: `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${time}`;
	}

	/** `2026-09` reads as a month, which is how the buyer named the edition. */
	function periodLabel(period) {
		const match = /^(\d{4})-(\d{2})$/.exec(String(period || ''));
		if (!match) return String(period || 'an edition');
		const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
		return date.toLocaleDateString(undefined, { month: 'long' });
	}

	/**
	 * The usage sentence.
	 *
	 * Only stated when there is something to state, except on the current
	 * revision — there, "used by nothing yet" is itself the answer to the
	 * question a buyer opens this panel with, and silence would read as missing
	 * information rather than as a fact.
	 */
	function usage(row, isCurrent) {
		const used = row.usedBy || [];
		if (!used.length) return isCurrent ? 'used by nothing yet' : '';
		if (used.length === 1) return `approved in the ${periodLabel(used[0].period)} edition`;
		return `approved in ${used.length} editions`;
	}

	/** Head first, then the stored versions newest-first, as one list. */
	$: rows = data
		? [
				{ ...data.head, isCurrent: true },
				...(data.revisions || []).map((r) => ({ ...r, isCurrent: false }))
		  ]
		: [];
</script>

<!--
	The list scrolls, the header and the footer do not. A design kept for a
	hundred revisions would otherwise run off the bottom of the screen, taking
	the oldest entries — the ones a buyer scrolls here to find — with it.
-->
<section
	class="flex max-h-[calc(100vh-120px)] w-[380px] max-w-full flex-col overflow-hidden rounded-card border border-brand-rule bg-brand-paper"
	aria-label="Versions"
>
	<header class="flex-shrink-0 px-5 pb-4 pt-5">
		<h2 class="font-display text-[21px] font-bold tracking-[-0.015em] text-brand-ink">Versions</h2>
		<p class="mt-1 font-sans text-[13.5px] leading-[20px] text-brand-slate">
			Every save is kept. Restoring makes a new revision; nothing is deleted.
		</p>
	</header>

	{#if loading}
		<p class="border-t border-brand-rule px-5 py-4 font-sans text-[13.5px] text-brand-mute">
			Loading the history…
		</p>
	{:else if error}
		<p class="flex items-start gap-2 border-t border-brand-rule px-5 py-4">
			<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
			<span class="font-sans text-[13.5px] text-brand-slate">{error}</span>
		</p>
	{:else if !rows.length}
		<p class="border-t border-brand-rule px-5 py-4 font-sans text-[13.5px] text-brand-mute">
			Nothing saved yet.
		</p>
	{:else}
		<ul class="min-h-0 flex-1 overflow-y-auto border-t border-brand-rule">
			{#each rows as row (row.revision)}
				{@const author = authorOf(row.by)}
				{@const note = usage(row, row.isCurrent)}
				<li
					class="flex items-start gap-3 border-b border-brand-rule px-5 py-3.5 last:border-b-0 {row.isCurrent
						? 'bg-brand-powder'
						: ''}"
				>
					<!--
						A fixed-width slot rather than a bare square: the rows are a
						repeated list, and the text lane has to start in the same place
						whether the square is filled or an outline.
					-->
					<span class="mt-1.5 flex w-2 flex-shrink-0 justify-center">
						<StatusSquare tone={author.tone} label="" />
					</span>

					<span class="min-w-0 flex-1">
						<span class="block font-sans text-[13.5px] font-medium leading-[19px] text-brand-ink">
							Rev {row.revision} · {author.word} · {row.summary}
						</span>
						<span class="mt-0.5 block font-sans text-[12.5px] leading-[18px] text-brand-slate">
							{when(row.at)}{note ? ` · ${note}` : ''}
						</span>
					</span>

					<span class="flex-shrink-0 pt-0.5">
						{#if row.isCurrent}
							<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-royal"
								>Current</span
							>
						{:else}
							<button
								type="button"
								on:click={() => dispatch('restore', { revision: row.revision })}
								disabled={restoring !== null}
								class="font-sans text-[13px] text-brand-blue underline-offset-2 hover:underline disabled:text-brand-mute disabled:no-underline"
							>
								{restoring === row.revision ? 'Restoring…' : 'Restore'}
							</button>
						{/if}
					</span>
				</li>
			{/each}
		</ul>
	{/if}

	<p
		class="flex-shrink-0 border-t border-brand-rule px-5 py-3 font-sans text-[12.5px] leading-[18px] text-brand-mute"
	>
		Undo and redo work within this session across AI and manual steps. Versions is the durable
		history.
	</p>
</section>
