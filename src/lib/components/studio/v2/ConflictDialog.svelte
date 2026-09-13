<script>
	/**
	 * The save conflict dialog. B04-2 / state S2.
	 *
	 * Someone else saved while this buyer was editing. Both versions exist and
	 * NEITHER is discarded without them choosing — that is the whole contract.
	 *
	 * "Keep mine" is the default and is listed first, because the person reading
	 * this dialog is the one with unsaved work in front of them. It creates a
	 * NEW revision rather than overwriting: the other person's save stays in the
	 * history either way.
	 */
	import { createEventDispatcher } from 'svelte';

	/** `{ revision, savedAt, by }` — what the server currently holds. */
	export let theirs = null;
	export let busy = false;

	const dispatch = createEventDispatcher();

	const when = (d) =>
		d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40 px-5"
	role="dialog"
	aria-modal="true"
	aria-label="Someone else saved this design"
>
	<div class="w-full max-w-[520px] rounded-md border-2 border-brand-ink bg-white p-6">
		<h2 class="font-display text-[19px] font-bold text-brand-ink">
			Someone else saved this design
		</h2>
		<p class="mt-2.5 font-sans text-[14px] text-brand-slate">
			They saved rev {theirs?.revision ?? '?'}{theirs?.savedAt ? ` at ${when(theirs.savedAt)}` : ''}
			while you were editing. Your changes are still here and nothing has been thrown away.
		</p>

		<div class="mt-5 flex flex-col gap-3">
			<button
				type="button"
				disabled={busy}
				on:click={() => dispatch('keep-mine')}
				class="rounded-md border-2 border-brand-ink p-4 text-left"
			>
				<span class="flex items-center gap-2">
					<span class="font-sans text-[14px] font-bold text-brand-ink">Keep mine</span>
					<span
						class="bg-brand-field px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-brand-ink"
						>Recommended</span
					>
				</span>
				<span class="mt-1 block font-sans text-[13px] text-brand-slate">
					Saves your version as rev {(theirs?.revision ?? 1) + 1}. Theirs stays in Versions.
				</span>
			</button>

			<button
				type="button"
				disabled={busy}
				on:click={() => dispatch('take-theirs')}
				class="rounded-md border border-brand-rule p-4 text-left"
			>
				<span class="font-sans text-[14px] font-bold text-brand-ink">Take theirs</span>
				<!-- Said plainly, because this is the destructive option. -->
				<span class="mt-1 block font-sans text-[13px] text-brand-slate">
					Loads rev {theirs?.revision ?? '?'} and discards your unsaved edits.
				</span>
			</button>
		</div>

		<p class="mt-4 font-sans text-[12.5px] text-brand-mute">
			Your version is also kept in this browser until you choose.
		</p>
	</div>
</div>
