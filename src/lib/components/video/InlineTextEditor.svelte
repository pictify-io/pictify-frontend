<script>
	/**
	 * A text editor positioned over the clip it edits, on the canvas.
	 *
	 * The right-hand properties panel already has a Content field, but it is a
	 * single-line input on the far side of the screen from the text it changes.
	 * For anything longer than a few words you are typing blind. Double-clicking
	 * the text on the canvas puts the caret where you are looking.
	 *
	 * ── Why Svelte and not another React island ───────────────────────────
	 *
	 * The canvas and its wrapper are Svelte-owned; the vendored React islands are
	 * the tool rail and the properties panel. A fourth React root would need the
	 * engine handles passed back across the boundary for no gain.
	 *
	 * ── Why the document is written once, on commit ───────────────────────
	 *
	 * Updating the clip on every keystroke would push an undo entry per
	 * character, so undoing a sentence would take a sentence's worth of presses.
	 * The engine's beginHistoryGroup/endHistoryGroup does not collapse them —
	 * measured, see inline-text.js. So the overlay holds the text until commit.
	 *
	 * That leaves the clip's own rendered text on screen underneath, and it
	 * cannot be hidden (the engine reasserts sprite visibility on every store
	 * publish, and opening this changes the selection, which publishes). Hence
	 * the near-opaque backdrop: it masks the old glyphs so the two do not read
	 * as doubled text.
	 */
	import { onMount, onDestroy, tick, createEventDispatcher } from 'svelte';
	import {
		overlayTypography,
		overlayBackdrop,
		screenRect,
		textPatch
	} from '$lib/video/inline-text.js';
	import { getFontByPostScriptName } from '$lib/video/vendor/openvideo-studio/font-utils';

	/** The engine Studio instance. */
	export let studio;
	/** The engine core instance, for the commit write. */
	export let core;
	/** The clip being edited. */
	export let clip;
	/** The canvas element, to measure its offset inside the positioned wrapper. */
	export let canvasEl;
	/** The positioned ancestor this overlay is absolutely placed within. */
	export let wrapperEl;

	const dispatch = createEventDispatcher();

	let textareaEl;
	let value = String(clip?.text ?? '');
	let rect = null;
	let css = {};
	let backdrop = 'rgba(9, 9, 11, 0.94)';
	// Set once the commit has run, so a blur triggered BY the commit (removing
	// the node steals focus) cannot commit a second time.
	let closing = false;

	const measure = () => {
		const next = screenRect(studio, clip);
		if (!next) return;
		// The canvas fills the wrapper today, but measuring the offset costs
		// nothing and means a future border or padding on the wrapper cannot
		// silently shift every overlay.
		let offsetX = 0;
		let offsetY = 0;
		if (canvasEl && wrapperEl) {
			const canvasBox = canvasEl.getBoundingClientRect();
			const wrapperBox = wrapperEl.getBoundingClientRect();
			offsetX = canvasBox.left - wrapperBox.left;
			offsetY = canvasBox.top - wrapperBox.top;
		}
		rect = { ...next, left: next.left + offsetX, top: next.top + offsetY };
		css = overlayTypography(clip, next.scale, getFontByPostScriptName(clip?.style?.fontFamily));
		backdrop = overlayBackdrop(css.color);
	};

	/*
	 * Grow the box downward so long copy stays visible while being typed.
	 *
	 * rows="1" on the element is load-bearing: a textarea defaults to rows=2, so
	 * setting height:auto and reading scrollHeight reports two lines' worth even
	 * for a single line. That measured 52px against a 29px clip and made the
	 * outline sit well below the text.
	 */
	const autosize = () => {
		if (!textareaEl || !rect) return;
		textareaEl.style.height = 'auto';
		textareaEl.style.height = `${Math.max(rect.height, textareaEl.scrollHeight)}px`;
	};

	const styleString = (rules) =>
		Object.entries(rules)
			.map(([key, val]) => `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${val}`)
			.join(';');

	const commit = () => {
		if (closing) return;
		closing = true;
		const patch = textPatch(clip, value);
		// Null means nothing changed. Writing anyway would push an undo entry, so
		// opening and closing the editor would quietly cost the user an undo.
		if (patch) core?.clip?.update?.(clip.id, patch);
		dispatch('close', { changed: !!patch });
	};

	const handleKeydown = (event) => {
		// Escape COMMITS rather than cancels, which is the opposite of the usual
		// reflex and deliberate. Cancelling would discard the typing with nothing
		// in history to recover it; committing means the escape hatch is one
		// undo, which is recoverable. Losing work is the worse failure.
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			commit();
			return;
		}
		// Enter inserts a newline: these clips wrap by default and multi-line
		// copy is normal. Cmd/Ctrl+Enter is the explicit "done".
		if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			commit();
			return;
		}
		// Keep the studio's own hotkeys out of this. Without it, typing "d"
		// duplicates a clip and Backspace deletes the one being edited.
		event.stopPropagation();
	};

	onMount(async () => {
		measure();
		await tick();
		if (textareaEl) {
			textareaEl.focus();
			// Select everything: a double-click to edit almost always means
			// replacing the placeholder copy, and select-all makes that one
			// keystroke while leaving arrow keys as the way to refine instead.
			textareaEl.select();
			autosize();
		}

		studio?.on?.('viewport:changed', measure);
		window.addEventListener('resize', measure);
	});

	onDestroy(() => {
		studio?.off?.('viewport:changed', measure);
		window.removeEventListener('resize', measure);
	});

	$: if (value !== undefined) autosize();
</script>

<!--
	The scrim covers the canvas so a click anywhere outside the text commits and
	closes, which is the gesture people expect from every other editor. It sits
	below the textarea in the stacking order.
-->
{#if rect}
	<div
		class="absolute inset-0 z-30 cursor-default"
		role="presentation"
		on:mousedown|self={commit}
	></div>

	<textarea
		bind:this={textareaEl}
		bind:value
		on:keydown={handleKeydown}
		on:blur={commit}
		on:input={autosize}
		aria-label="Edit text on canvas"
		spellcheck="false"
		rows="1"
		class="absolute z-40 resize-none overflow-hidden rounded-sm border-0 p-0
		       outline outline-2 outline-offset-2 outline-brand-accent"
		style="left:{rect.left}px; top:{rect.top}px; width:{rect.width}px; background:{backdrop}; {styleString(css)}"
	></textarea>
{/if}

<style>
	/*
	 * The backdrop colour is set inline, keyed to the clip's own text colour, so
	 * dark text on a pale template stays legible while typing.
	 */
	textarea {
		caret-color: #ffc480;
	}
	textarea::selection {
		background: rgba(255, 196, 128, 0.35);
	}
</style>
