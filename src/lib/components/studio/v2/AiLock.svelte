<script>
	/**
	 * The AI operation lock. B04-3 / state ST-04.
	 *
	 * While a run is in flight the canvas is washed out and the rails are
	 * disabled, because an edit made underneath a run would be silently
	 * overwritten by its result — the buyer would watch their own change vanish
	 * and have no way to know why.
	 *
	 * The card states the revision transition. "AI working" alone leaves the
	 * buyer unable to tell whether it is doing anything, and every other surface
	 * in campaigns names the revision too.
	 */
	import { createEventDispatcher } from 'svelte';

	export let stage = 'read';
	export let fromRevision = 1;
	export let cancelling = false;

	const dispatch = createEventDispatcher();

	/** Named in the buyer's terms, not the agent's. */
	const STAGES = [
		{ key: 'read', label: 'Reading your design' },
		{ key: 'plan', label: 'Planning the change' },
		{ key: 'write', label: 'Making the change' },
		{ key: 'check', label: 'Checking it renders' }
	];

	$: index = Math.max(
		0,
		STAGES.findIndex((s) => s.key === stage)
	);
</script>

<div
	class="absolute inset-0 z-20 flex items-center justify-center bg-brand-canvas/[0.72]"
	role="status"
	aria-live="polite"
>
	<div class="w-full max-w-[360px] rounded-md border-2 border-brand-ink bg-white p-5">
		<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
			AI working · rev {fromRevision} → {fromRevision + 1}
		</p>

		<ol class="mt-3 flex flex-col gap-2">
			{#each STAGES as s, i (s.key)}
				<li class="flex items-center gap-2.5">
					<span
						class="block h-2 w-2 flex-shrink-0 {i < index
							? 'bg-brand-proof'
							: i === index
							? 'bg-brand-field border border-brand-ink'
							: 'border border-brand-rule'}"
						aria-hidden="true"
					/>
					<span
						class="font-sans text-[13.5px] {i === index
							? 'font-semibold text-brand-ink'
							: i < index
							? 'text-brand-slate'
							: 'text-brand-mute'}">{s.label}</span
					>
				</li>
			{/each}
		</ol>

		<button
			type="button"
			on:click={() => dispatch('cancel')}
			disabled={cancelling}
			class="mt-4 flex h-9 w-full items-center justify-center rounded-btn border border-brand-rule font-sans text-[13.5px] text-brand-slate disabled:text-brand-mute"
			>{cancelling ? 'Cancelling…' : 'Cancel'}</button
		>
		<!-- Honest about what cancel can and cannot do. -->
		<p class="mt-2 font-sans text-[12px] text-brand-mute">
			Your design is unchanged until this finishes. Cancelling stops it applying.
		</p>
	</div>
</div>
