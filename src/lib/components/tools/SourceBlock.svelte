<script>
	/**
	 * The "From a …" block at the top of Say it. TS-7 (board TS-05 `LBP-0`).
	 *
	 * One component for all nine tools, driven by `SOURCES` — the same module
	 * that writes the instruction. Defining the fields and the sentence together
	 * is the point: a field that stops being written into the instruction
	 * becomes a visible inconsistency in one file, rather than a box the visitor
	 * fills in for nothing.
	 *
	 * IT WRITES, IT DOES NOT HIDE. The instruction lands in the composer where
	 * the visitor can read it, change it and run it again. That is why this is a
	 * block above the composer rather than a magic button beside it.
	 */
	import { createEventDispatcher } from 'svelte';
	import { SOURCES, writeInstruction } from '$lib/tools/write-instruction.js';

	/** One of the keys in SOURCES. */
	export let kind = 'og';
	export let busy = false;
	/** Set when the source could not be read; the instruction is written anyway. */
	export let error = null;
	/** False when the daily AI credits are gone — the block goes quiet. */
	export let enabled = true;

	const dispatch = createEventDispatcher();

	$: def = SOURCES[kind] || SOURCES.og;
	let values = {};
	// A new kind starts empty rather than carrying the last tool's answers.
	$: if (kind) values = {};

	/*
	 * Preview of what will be written, so "Make it" is never a surprise. Empty
	 * means there is nothing to say yet, which is also what disables the button
	 * — running an AI edit on an empty sentence spends one of three daily
	 * credits to be told nothing changed.
	 */
	$: preview = writeInstruction(kind, values);
	$: ready = Boolean(preview) && !busy && enabled;

	const submit = () => ready && dispatch('make', { kind, values, instruction: preview });
</script>

<div class="flex flex-col gap-2 border-b border-brand-rule p-3">
	<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute">{def.label}</span>

	{#each def.fields as field (field.key)}
		{#if field.type === 'textarea'}
			<textarea
				bind:value={values[field.key]}
				rows="3"
				disabled={!enabled}
				placeholder={field.placeholder}
				class="w-full rounded-[5px] border border-brand-rule px-2.5 py-2 font-sans text-[13px] text-brand-ink placeholder:text-brand-mute disabled:bg-brand-subtle"
			/>
		{:else}
			<input
				bind:value={values[field.key]}
				on:keydown={(e) => e.key === 'Enter' && submit()}
				disabled={!enabled}
				placeholder={field.placeholder}
				class="h-9 w-full rounded-[5px] border border-brand-rule px-2.5 font-sans text-[13px] text-brand-ink placeholder:text-brand-mute disabled:bg-brand-subtle"
			/>
		{/if}
	{/each}

	<button
		type="button"
		on:click={submit}
		disabled={!ready}
		class="h-9 rounded-[5px] bg-brand-ink font-sans text-[13px] text-white disabled:opacity-40"
		>{busy ? 'Working…' : def.cta}</button
	>

	<p class="font-sans text-[11.5px] leading-[15px] text-brand-mute">{def.hint}</p>

	{#if error}
		<p class="flex items-start gap-1.5">
			<span class="mt-1 block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
			<span class="font-sans text-[11.5px] leading-[15px] text-brand-slate">{error}</span>
		</p>
	{/if}
</div>
