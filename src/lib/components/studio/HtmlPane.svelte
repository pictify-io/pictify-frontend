<script>
	/**
	 * The manual escape hatch: type or paste HTML, watch the proof follow.
	 *
	 * Highlighting is painted by an overlay under a transparent textarea rather
	 * than by an editor component — this pane's job is legibility and paste,
	 * not IDE features, and a textarea keeps native undo, selection and paste
	 * behaviour that a re-implemented editor would have to earn back.
	 *
	 * The overlay uses the shared press palette (lib/utils/press-highlight.js),
	 * the same one CodeMirror panes and read-only snippets use, so markup here
	 * and markup in the Use it panel are coloured identically.
	 */
	import { createEventDispatcher } from 'svelte';
	import { PRESS } from '$lib/utils/press-highlight.js';

	const dispatch = createEventDispatcher();

	export let html = '';
	export let busy = false;

	let ta;
	let gutter;
	let overlay;

	/**
	 * The textarea is the only scroller; the gutter and the highlight overlay are
	 * dumb layers dragged along behind it. Letting each scroll independently is
	 * how line numbers end up pointing at the wrong lines.
	 */
	function syncScroll() {
		if (!ta) return;
		if (gutter) gutter.scrollTop = ta.scrollTop;
		if (overlay) {
			overlay.scrollTop = ta.scrollTop;
			overlay.scrollLeft = ta.scrollLeft;
		}
	}

	$: lines = (html || '').split('\n');

	/**
	 * Segment the source into coloured runs.
	 *
	 * Ordered by priority, not by position: `{{tokens}}` win over strings so a
	 * variable inside an attribute value still reads as a variable, which is
	 * the distinction the palette exists to draw. Computed here rather than
	 * tested inline because a /g regex carries lastIndex between calls and
	 * silently mis-highlights every other match when reused in a template loop.
	 */
	const RULES = [
		{ re: /\{\{[^}]*\}\}/g, color: PRESS.token, weight: 500 },
		{ re: /<!--[\s\S]*?-->/g, color: PRESS.comment },
		{ re: /"[^"\n]*"|'[^'\n]*'/g, color: PRESS.string },
		{ re: /<\/?[a-zA-Z][\w-]*/g, color: PRESS.keyword },
		{ re: /\b[a-zA-Z-]+(?==)/g, color: PRESS.property }
	];

	$: segments = (() => {
		const src = html || '';
		const spans = [];
		const overlaps = (a, b) => spans.some((s) => a < s.end && b > s.start);
		for (const rule of RULES) {
			rule.re.lastIndex = 0;
			let m;
			while ((m = rule.re.exec(src)) !== null) {
				if (!m[0].length) break;
				if (!overlaps(m.index, m.index + m[0].length)) {
					spans.push({
						start: m.index,
						end: m.index + m[0].length,
						color: rule.color,
						weight: rule.weight
					});
				}
			}
		}
		spans.sort((a, b) => a.start - b.start);

		const out = [];
		let cursor = 0;
		for (const s of spans) {
			if (s.start < cursor) continue;
			if (s.start > cursor) out.push({ text: src.slice(cursor, s.start), color: null });
			out.push({ text: src.slice(s.start, s.end), color: s.color, weight: s.weight });
			cursor = s.end;
		}
		if (cursor < src.length) out.push({ text: src.slice(cursor), color: null });
		return out;
	})();

	function onInput(event) {
		dispatch('change', { html: event.currentTarget.value });
	}

	/** Insert at the caret so "+ Add input" lands where the user is looking. */
	export function insertAtCursor(text) {
		if (!ta) return;
		const start = ta.selectionStart ?? html.length;
		const end = ta.selectionEnd ?? html.length;
		const next = html.slice(0, start) + text + html.slice(end);
		dispatch('change', { html: next });
		requestAnimationFrame(() => {
			ta.focus();
			const pos = start + text.length;
			ta.setSelectionRange(pos, pos);
		});
	}
</script>

<div class="flex min-h-0 flex-1 flex-col bg-brand-press-deep">
	<div class="relative flex min-h-0 flex-1">
		<!-- Lines do NOT wrap: a wrapped line takes two visual rows but only one
		     gutter number, which silently mis-numbers everything below it. Long
		     CSS lines scroll sideways instead. -->
		<div
			bind:this={gutter}
			aria-hidden="true"
			class="flex-shrink-0 select-none overflow-hidden py-3 pl-4 pr-3 text-right font-mono text-[12px] leading-[21px] text-white/25"
		>
			{#each lines as _, i (i)}
				<div>{i + 1}</div>
			{/each}
		</div>

		<div class="relative min-w-0 flex-1">
			<pre
				bind:this={overlay}
				aria-hidden="true"
				class="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre px-3 py-3 font-mono text-[12px] leading-[21px]" style="color: {PRESS.text}"
			>{#each segments as seg, i (i)}{#if seg.color}<span
							style="color:{seg.color}{seg.weight ? `;font-weight:${seg.weight}` : ''}">{seg.text}</span
						>{:else}{seg.text}{/if}{/each}</pre>
			<textarea
				bind:this={ta}
				value={html}
				on:input={onInput}
				on:scroll={syncScroll}
				disabled={busy}
				spellcheck="false"
				wrap="off"
				placeholder="Paste or type your HTML — &#123;&#123;tokens&#125;&#125; become inputs"
				class="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent px-3 py-3 font-mono text-[12px] leading-[21px] text-transparent caret-white outline-none placeholder:text-white/35 disabled:opacity-60"
			></textarea>
		</div>
	</div>

	<div class="flex items-center gap-2 border-t border-white/10 px-4 py-3">
		<span class="block h-2 w-2 flex-shrink-0 bg-brand-pink" aria-hidden="true"></span>
		<span class="font-mono text-[11px] leading-[15px] text-white/55">
			pink &#123;&#123;tokens&#125;&#125; are inputs — add one and it appears in the Inputs panel
		</span>
	</div>
</div>
