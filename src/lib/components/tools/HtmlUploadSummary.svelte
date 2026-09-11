<script>
	/**
	 * The code pane, just after a file lands. TS-07 B (board TS-07 `LMJ-0`,
	 * frame B, second state).
	 *
	 * A checkpoint between "we read your file" and "here is your code": the
	 * visitor sees what arrived and what will not survive the render BEFORE
	 * they are dropped into 214 lines of their own markup looking for the
	 * logo that went missing. The canvas beside it is already drawing the file,
	 * so Continue is a choice to look at the code, not a gate on the render.
	 */
	import { createEventDispatcher } from 'svelte';
	import { formatBytes } from '$lib/tools/html-upload.js';

	const dispatch = createEventDispatcher();

	/** `{ name, size, lineCount, stylesKept }` */
	export let file;
	/** `[{ tone, label, detail }]` — the same report the paste path shows. */
	export let lines = [];
	/** Relative image paths still in the document; drives "Upload the images". */
	export let relativeCount = 0;
	/** `{ tone, text }` after an image upload, else null. */
	export let embedNote = null;
	export let busy = false;

	const SQUARE = { alarm: 'bg-brand-alarm', field: 'bg-brand-field', proof: 'bg-brand-proof' };
</script>

<div class="flex min-h-0 flex-1 flex-col bg-brand-press">
	<div
		class="flex h-9 flex-shrink-0 items-center justify-between border-b border-[#383A42] px-3.5"
	>
		<span class="truncate font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute"
			>{file.name} · {formatBytes(file.size)}</span
		>
		<button
			type="button"
			on:click={() => dispatch('replace')}
			class="flex-shrink-0 font-sans text-[12px] text-brand-powder hover:text-white">Replace</button
		>
	</div>

	<div class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto p-3.5">
		<p class="flex items-center gap-2">
			<span class="block h-2 w-2 flex-shrink-0 bg-brand-proof" aria-hidden="true" />
			<span class="font-sans text-[13px] leading-4 text-white">
				Loaded · {file.lineCount}
				{file.lineCount === 1 ? 'line' : 'lines'}{file.stylesKept ? ' · styles kept' : ''}
			</span>
		</p>

		<div class="flex flex-col gap-1.5 rounded-[6px] bg-[#383A42] p-2.5">
			<p class="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-powder">
				What we changed · {lines.length}
			</p>
			{#each lines as line (line.label)}
				<p class="flex items-start gap-2">
					<span
						class="mt-1 block h-[7px] w-[7px] flex-shrink-0 {SQUARE[line.tone] || SQUARE.field}"
						aria-hidden="true"
					/>
					<span class="min-w-0 font-sans text-[12px] leading-4 text-white">
						<!-- The separator as an expression: Svelte trims the leading
						     space off literal text at the start of an element. -->
						{line.label}<span class="text-brand-powder">{` · ${line.detail}`}</span>
					</span>
				</p>
			{:else}
				<!-- Said, not left blank: an empty box reads as "still checking". -->
				<p class="font-sans text-[12px] leading-4 text-brand-powder">
					Nothing. It renders as it is.
				</p>
			{/each}
			{#if embedNote}
				<p class="flex items-start gap-2 border-t border-white/10 pt-1.5" aria-live="polite">
					<span
						class="mt-1 block h-[7px] w-[7px] flex-shrink-0 {SQUARE[embedNote.tone]}"
						aria-hidden="true"
					/>
					<span class="font-sans text-[12px] leading-4 text-white">{embedNote.text}</span>
				</p>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				on:click={() => dispatch('continue')}
				class="h-8 rounded-[6px] bg-brand-field px-3 font-sans text-[12.5px] font-semibold text-brand-ink"
				>Continue</button
			>
			{#if relativeCount}
				<button
					type="button"
					on:click={() => dispatch('images')}
					disabled={busy}
					class="h-8 px-2.5 font-sans text-[12.5px] text-brand-powder hover:text-white disabled:opacity-50"
					>{busy ? 'Embedding…' : 'Upload the images'}</button
				>
			{/if}
		</div>
	</div>
</div>
