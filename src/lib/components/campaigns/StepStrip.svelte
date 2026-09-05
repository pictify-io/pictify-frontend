<script>
	/**
	 * The five-step strip (handoff §2 decision 1).
	 *
	 * Every word here comes from the server. The client does not decide that a
	 * step is done, or reachable, or why it is blocked — it renders what it was
	 * told. A strip that computed its own state would eventually let someone
	 * click into "Generate" for an edition the server would refuse, and the
	 * error would arrive after the click instead of instead of it.
	 *
	 * Steps are LINKS only when the server says reachable. A blocked step is
	 * plain text with its reason beside it, not a disabled link — a disabled
	 * link invites a click and explains nothing.
	 */
	import { editionUrl } from '$lib/campaigns/nav';

	/** `[{ key, label, state: 'done'|'current'|'blocked'|'pending', note, reachable }]` */
	export let steps = [];
	export let campaignUid;
	export let editionUid;

	const href = (step) => editionUrl(campaignUid, editionUid, step.key);
</script>

<div class="flex flex-wrap items-stretch gap-x-7 gap-y-1 border-b border-brand-rule">
	{#each steps as step, i (step.key)}
		{@const active = step.state === 'current'}
		<svelte:element
			this={step.reachable && !active ? 'a' : 'div'}
			href={step.reachable && !active ? href(step) : undefined}
			class="flex items-center gap-2 border-b-2 pb-2.5 pt-1 {active
				? 'border-brand-ink'
				: 'border-transparent'} {step.reachable && !active ? 'hover:border-brand-rule' : ''}"
		>
			<span class="font-mono text-[11px] {active ? 'text-brand-ink' : 'text-brand-mute'}"
				>{i + 1}</span
			>
			<span
				class="font-sans text-sm {active
					? 'font-semibold text-brand-ink'
					: step.state === 'done'
					? 'text-brand-slate'
					: 'text-brand-mute'}"
			>
				{step.label}
			</span>

			{#if step.state === 'current' && step.note}
				<!-- The current step's state is a field-green chip: it is where you
				     are, and the chip says what is true right now. -->
				<span
					class="bg-brand-field px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-ink"
					>{step.note}</span
				>
			{:else if step.state === 'done'}
				<!-- The proof-green square is the marker. The words stay slate: a
				     green WORD would make "done" the loudest thing on the strip. -->
				<span class="flex items-center gap-1.5">
					<span class="block h-2 w-2 bg-brand-proof" aria-hidden="true" />
					<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-slate"
						>{step.note || 'Done'}</span
					>
				</span>
			{:else if step.state === 'blocked'}
				<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-slate">
					Blocked{step.note ? ` · ${step.note}` : ''}
				</span>
			{/if}
		</svelte:element>
	{/each}
</div>
