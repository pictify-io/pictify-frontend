<script>
	/**
	 * The code pane. PS-2 (board `JQS-0`, states `KD6-0`).
	 *
	 * Built from the v1 `studio/HtmlPane.svelte` and kept on the same
	 * foundation: an overlay painted UNDER a transparent textarea, rather than
	 * an editor component. This pane's job is legibility, paste and a caret —
	 * not IDE features — and a native textarea keeps undo, selection, IME and
	 * paste behaviour that a re-implemented editor would have to earn back one
	 * bug at a time.
	 *
	 * THE 18px LINE HEIGHT IS LOAD-BEARING, not styling. The selected-line band
	 * and the gutter are positioned arithmetically from it — row n sits at
	 * `(n - 1) × 18`. That arithmetic is only sound because `wrap="off"` keeps
	 * one line of source on exactly one visual row; the moment a line wraps, the
	 * band, the numbers and the caret all point at different lines. Long CSS
	 * scrolls sideways instead, deliberately.
	 *
	 * SELECTION IS THE SAME THING IN BOTH PANES (locked decision 4). The band
	 * here and the outline on the live canvas are two views of one selected
	 * element, so this component neither owns nor guesses it: it renders
	 * `selectedLine` and reports the caret, and the store decides what that
	 * means.
	 */
	import { createEventDispatcher } from 'svelte';
	import { PRESS, HTML_RULES, segmentize } from '$lib/utils/press-highlight.js';

	const dispatch = createEventDispatcher();

	export let html = '';
	export let busy = false;
	/** 1-based line of the current selection, or null. Drives the band. */
	export let selectedLine = null;
	/**
	 * `[{ line, reason }]` — constructs the renderer will strip on save.
	 * They stay VISIBLE with a mark rather than being removed as you type
	 * (locked decision 9): silently deleting what someone just pasted is how an
	 * editor loses trust.
	 */
	export let issues = [];
	/** Count shown in the footer; derived from the tokens by the caller. */
	export let variableCount = 0;
	/** False while the document does not parse — the canvas holds its last good state. */
	export let valid = true;
	export let fileLabel = 'template.html';

	const LINE_HEIGHT = 18;
	/**
	 * The text does not start at the top of the scroller — the gutter and the
	 * overlay both carry 12px of top padding. The band has to add it back or it
	 * sits 12px high and highlights the line above the one you are on, which
	 * looks like an off-by-one in the selection sync rather than in the CSS.
	 */
	const TOP_PAD = 12;

	let ta;
	let gutter;
	let overlay;
	let band;

	/**
	 * The textarea is the only scroller; every other layer is dragged behind it.
	 * Letting them scroll independently is how line numbers end up pointing at
	 * the wrong lines.
	 */
	function syncScroll() {
		if (!ta) return;
		const top = ta.scrollTop;
		if (gutter) gutter.scrollTop = top;
		if (overlay) {
			overlay.scrollTop = top;
			overlay.scrollLeft = ta.scrollLeft;
		}
		if (band) band.scrollTop = top;
	}

	$: lines = (html || '').split('\n');
	$: segments = segmentize(html, HTML_RULES);
	$: issueLines = new Set((issues || []).map((i) => i.line));
	$: strippable = (issues || []).length;

	function onInput(event) {
		dispatch('change', { html: event.currentTarget.value });
	}

	/**
	 * Report the caret so the store can resolve it to an element.
	 *
	 * The OFFSET is sent, not the line: a line number cannot identify which
	 * element the caret is inside when several share a line, and the store's
	 * `nodeForOffset` map is built on offsets.
	 */
	function reportCaret() {
		if (!ta) return;
		const offset = ta.selectionStart ?? 0;
		const line = (html.slice(0, offset).match(/\n/g) || []).length + 1;
		dispatch('caret', { offset, line });
	}

	/** Insert at the caret so "+ Variable" lands where the user is looking. */
	export function insertAtCursor(text) {
		if (!ta) return;
		const start = ta.selectionStart ?? html.length;
		const end = ta.selectionEnd ?? html.length;
		dispatch('change', { html: html.slice(0, start) + text + html.slice(end) });
		requestAnimationFrame(() => {
			ta.focus();
			const pos = start + text.length;
			ta.setSelectionRange(pos, pos);
			reportCaret();
		});
	}

	/** Put the caret on a line — the canvas → code half of the selection sync. */
	export function focusLine(line) {
		if (!ta || !line) return;
		const before = lines.slice(0, line - 1).join('\n');
		const offset = line === 1 ? 0 : before.length + 1;
		ta.focus();
		ta.setSelectionRange(offset, offset);
		// Scroll the line into view without yanking the caret around.
		ta.scrollTop = Math.max(0, (line - 1) * LINE_HEIGHT - ta.clientHeight / 2);
		syncScroll();
	}

	async function copy() {
		try {
			await navigator.clipboard.writeText(html);
			dispatch('copied');
		} catch {
			/* the button is a convenience; selection still works */
		}
	}
</script>

<div class="flex min-h-0 w-[432px] flex-shrink-0 flex-col bg-brand-press">
	<!-- Header -->
	<div
		class="flex h-9 flex-shrink-0 items-center justify-between border-b border-[#383A42] px-3.5"
	>
		<div class="flex items-center gap-2">
			<span class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute"
				>{fileLabel}</span
			>
			{#if selectedLine}
				<span class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-field"
					>Line {selectedLine} · selected</span
				>
			{/if}
		</div>
		<div class="flex items-center gap-3">
			<!-- Where the text comes from, ahead of what to do with it. The tools
			     put Paste and Upload .html here (board TS-07 `LMJ-0`); the studio
			     has nothing to add. -->
			<slot name="actions" />
			<button
				type="button"
				on:click={() => dispatch('format')}
				class="font-sans text-[12px] text-brand-powder hover:text-white">Format</button
			>
			<button type="button" on:click={copy} class="font-sans text-[12px] text-brand-powder hover:text-white"
				>Copy</button
			>
		</div>
	</div>

	<!-- Body -->
	<div class="relative flex min-h-0 flex-1">
		<!--
			The selected-line band, painted BELOW the text and above the ground.
			A background on the textarea itself is impossible (it has to stay
			transparent for the overlay), and a band drawn over the text would
			hide it.
		-->
		<div
			bind:this={band}
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 overflow-hidden"
		>
			{#if selectedLine}
				<div
					class="absolute left-0 right-0 border-l-2 border-brand-field bg-[#383A42]"
					style="top:{TOP_PAD + (selectedLine - 1) * LINE_HEIGHT}px;height:{LINE_HEIGHT}px"
				/>
			{/if}
		</div>

		<!-- Gutter: 12px pad + 18px numbers + 14px gap = the 44px the board draws. -->
		<div
			bind:this={gutter}
			aria-hidden="true"
			class="relative z-10 flex-shrink-0 select-none overflow-hidden pl-3 pr-3.5 pt-3"
		>
			<!-- Iterating the indices themselves: `as _, i` binds a value the loop
			     never reads, which is an error under no-unused-vars. -->
			{#each Array.from({ length: lines.length }, (_, i) => i + 1) as n (n)}
				<div class="flex h-[18px] items-center justify-end gap-1.5">
					{#if issueLines.has(n)}
						<!-- Alarm mark, never a tooltip-only signal: the reason is in the
						     footer sentence and the construct stays on screen. -->
						<span class="block h-[5px] w-[5px] flex-shrink-0 bg-brand-alarm" />
					{/if}
					<span
						class="w-[18px] text-right font-mono text-[11.5px] leading-[18px] {n === selectedLine
							? 'text-brand-field'
							: 'text-brand-mute'}">{n}</span
					>
				</div>
			{/each}
		</div>

		<div class="relative z-10 min-w-0 flex-1">
			<pre
				bind:this={overlay}
				aria-hidden="true"
				class="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre py-3 pr-3.5 font-mono text-[11.5px] leading-[18px]"
				style="color: {PRESS.text}">{#each segments as seg, i (i)}{#if seg.color}<span
							style="color:{seg.color}{seg.weight ? `;font-weight:${seg.weight}` : ''}">{seg.text}</span
						>{:else}{seg.text}{/if}{/each}</pre>
			<textarea
				bind:this={ta}
				value={html}
				on:input={onInput}
				on:scroll={syncScroll}
				on:keyup={reportCaret}
				on:click={reportCaret}
				on:select={reportCaret}
				disabled={busy}
				spellcheck="false"
				wrap="off"
				aria-label="Template HTML"
				placeholder="Paste or type your HTML — &#123;&#123;variables&#125;&#125; become inputs"
				class="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent py-3 pr-3.5 font-mono text-[11.5px] leading-[18px] text-transparent caret-white outline-none placeholder:text-white/35 disabled:opacity-60"
			></textarea>
		</div>

		{#if !html && $$slots.empty}
			<!--
				The empty state sits OVER the textarea and lets clicks through
				(`pointer-events-none`), so a click anywhere lands in the real
				textarea and ⌘V pastes the way it always has. Anything inside that
				needs a click of its own opts back in with `pointer-events-auto`.
				It goes the moment there is a character to show.
			-->
			<div class="pointer-events-none absolute inset-0 z-20 bg-brand-press p-3">
				<slot name="empty" />
			</div>
		{/if}
	</div>

	<!-- Footer -->
	<div
		class="flex h-[34px] flex-shrink-0 items-center justify-between border-t border-[#383A42] px-3.5"
	>
		<span class="flex min-w-0 items-center gap-2">
			<span
				class="block h-[7px] w-[7px] flex-shrink-0 {!valid
					? 'bg-brand-alarm'
					: strippable
						? 'bg-brand-field'
						: 'bg-brand-proof'}"
				aria-hidden="true"
			/>
			<span class="truncate font-sans text-[12px] text-brand-powder">
				{#if !valid}
					<!-- The canvas is NOT following, and saying so is the point: a
					     stale canvas that looks live is worse than a stopped one. -->
					Not valid yet · the canvas is showing your last working version
				{:else if strippable}
					{strippable}
					{strippable === 1 ? 'item' : 'items'} will be removed on save
				{:else}
					Valid · canvas follows as you type
				{/if}
			</span>
		</span>
		<span class="flex-shrink-0 font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
			{variableCount}
			{variableCount === 1 ? 'variable' : 'variables'} · {lines.length}
			{lines.length === 1 ? 'line' : 'lines'}
		</span>
	</div>
</div>
