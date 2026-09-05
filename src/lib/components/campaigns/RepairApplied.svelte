<script>
	/**
	 * The repair-applied toast. A8 (board IKS-0).
	 *
	 * Bottom-left, eight seconds, one Undo. Purpose-built rather than routed
	 * through the shared Toast: that one is bottom-centre, carries no action,
	 * and is used across the whole app — teaching it about actions to serve one
	 * screen would put a shared component at risk for a local need.
	 *
	 * THE COUNTS ARE THE ONES THE RE-CHECK PRODUCED, never the ones the
	 * proposal predicted, and the reason this is safe to say is structural: the
	 * apply is a compare-and-swap against the revision the proposal was
	 * measured on. If the design had moved, the save would have 409'd and this
	 * toast would never have fired. So when it does fire, the numbers describe
	 * exactly the document that was committed.
	 *
	 * UNDO IS REAL FOR THE FULL EIGHT SECONDS, and beyond them — it restores
	 * through the studio's Versions panel, which already makes any revision
	 * undoable. Nothing here is a soft delete waiting on a timer, so a buyer who
	 * misses the window has lost a shortcut, not the ability to undo.
	 */
	import { onDestroy, createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';

	/** `{ revision, accounts, remaining }` from the apply, or null when idle. */
	export let applied = null;
	/** Milliseconds the toast stays up. The board says eight seconds. */
	export let duration = 8000;

	const dispatch = createEventDispatcher();

	let timer = null;
	let undoing = false;

	function clear() {
		if (timer) clearTimeout(timer);
		timer = null;
	}

	/*
	 * Restarts on every new application rather than only on first appearance:
	 * two repairs in a row must give the second one its own full eight seconds,
	 * not whatever remained of the first one's.
	 */
	$: if (applied) {
		clear();
		undoing = false;
		timer = setTimeout(() => dispatch('expire'), duration);
	}

	onDestroy(clear);

	async function undo() {
		if (undoing) return;
		undoing = true;
		// Stop the clock first: a toast that vanished mid-undo would leave the
		// buyer unsure whether they pressed it in time.
		clear();
		dispatch('undo');
	}
</script>

{#if applied}
	<div
		class="fixed bottom-6 left-6 z-50 max-w-[420px] border border-brand-ink bg-brand-paper px-4 py-3 shadow-[4px_4px_0_0_rgba(0,0,0,0.08)]"
		role="status"
		aria-live="polite"
		transition:fly={{ y: 8, duration: 160 }}
	>
		<div class="flex items-start gap-3">
			<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-proof" aria-hidden="true" />
			<div class="min-w-0 flex-1">
				<!--
					One sentence, three facts, each of them measured: the revision the
					commit actually created, the accounts the rule ran on, and what it
					found. Never a percentage — "0 overflow" says what it counted.
				-->
				<p class="font-sans text-[13px] leading-[19px] text-brand-ink">
					Applied as design rev {applied.revision} · re-checked {applied.accounts} accounts · {applied.remaining}
					overflow
				</p>
				{#if applied.note}
					<p class="mt-1 font-sans text-[12px] leading-[17px] text-brand-mute">{applied.note}</p>
				{/if}
			</div>
			<button
				type="button"
				on:click={undo}
				disabled={undoing}
				class="flex-shrink-0 font-sans text-[12.5px] font-semibold text-brand-blue hover:underline disabled:opacity-40"
			>
				{undoing ? 'Undoing…' : 'Undo'}
			</button>
		</div>
	</div>
{/if}
