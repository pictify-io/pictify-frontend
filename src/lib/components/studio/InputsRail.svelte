<script>
	/**
	 * The caller contract, made editable.
	 *
	 * Every row here is a {{token}} in the html — this rail does not invent
	 * inputs, it reflects them. The sample value beside each one does double
	 * duty: it fills the proof, and it fills the snippet at the bottom, so the
	 * call the user copies is the exact call that produced the picture they are
	 * looking at.
	 */
	import { createEventDispatcher } from 'svelte';
	import UseItCard from './UseItCard.svelte';

	const dispatch = createEventDispatcher();

	/** [{ name, type, value }] — order follows the html. */
	export let inputs = [];
	export let templateUid = '';
	export let templateName = '';
	export let apiKey = '';
	/** Disables editing while the agent is mid-change. */
	export let busy = false;

	const TYPE_LABEL = {
		text: 'TEXT',
		date: 'DATE',
		image: 'IMAGE URL',
		url: 'URL',
		number: 'NUMBER',
		color: 'COLOR'
	};

</script>

<aside class="flex w-[320px] flex-shrink-0 flex-col overflow-y-auto border-l border-brand-rule bg-brand-paper">
	<div class="flex flex-col gap-1 border-b border-brand-rule px-5 py-4">
		<span class="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-brand-ink">Inputs</span>
		<span class="font-sans text-[13px] text-brand-mute">What your caller sends. Try values here.</span>
	</div>

	<div class="flex flex-col gap-4 border-b border-brand-rule px-5 py-5">
		{#if inputs.length === 0}
			<!-- Honest empty: a template with no tokens is a legitimate thing to
			     have, not a setup step the user skipped. -->
			<p class="font-sans text-[13px] leading-[19px] text-brand-slate">
				No inputs yet — this template renders the same file every time. Add a
				<span class="font-mono text-[12px] text-brand-royal">&#123;&#123;token&#125;&#125;</span> in HTML, or ask for one in Say it.
			</p>
		{:else}
			{#each inputs as input (input.name)}
				<div class="flex flex-col gap-1.5">
					<div class="flex items-baseline justify-between gap-2">
						<span class="min-w-0 truncate font-mono text-[13px] font-medium text-brand-ink">{input.name}</span>
						<span class="flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
							{TYPE_LABEL[input.type] || 'TEXT'}
						</span>
					</div>
					<input
						type="text"
						value={input.value ?? ''}
						disabled={busy}
						on:input={(e) => dispatch('change', { name: input.name, value: e.currentTarget.value })}
						placeholder="sample value"
						class="w-full rounded-btn border-[1.5px] border-brand-rule px-3 py-2 font-sans text-[13px] text-brand-ink outline-none focus:border-brand-ink disabled:opacity-60"
					/>
				</div>
			{/each}
		{/if}

		<div class="flex items-center gap-3">
			<button
				type="button"
				on:click={() => dispatch('addInput')}
				disabled={busy}
				class="flex-shrink-0 rounded-btn border-[1.5px] border-brand-ink px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-brand-ink hover:bg-brand-ink hover:text-white disabled:opacity-60"
			>
				+ Add input
			</button>
			<span class="font-mono text-[10px] leading-[13px] text-brand-mute">
				the template grows a slot for it
			</span>
		</div>
	</div>

	<div class="px-5 py-5">
		<UseItCard {inputs} {templateUid} {templateName} {apiKey} kind="image" />
	</div>
</aside>
