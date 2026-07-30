<script>
	/**
	 * The Remotion surface of the studio: a live player, and the code that drives
	 * it.
	 *
	 * A video template comes in two kinds. `timeline` is a scene graph the Pixi
	 * canvas edits directly; `tsx` is a Remotion composition, which is React code
	 * and cannot be represented as clips. Those used to live in two separate
	 * editors on two routes, so anything that produced a Remotion template — AI
	 * generation, and the MCP server — landed somewhere other than the studio,
	 * and reopening it took you there again.
	 *
	 * There is one editor now. This component is what the studio shows in place
	 * of the canvas when the template is Remotion, so the top bar, variables,
	 * saving and rendering are the same controls either way.
	 *
	 * The player transpiles TSX in the browser with sucrase (see playerHost.js),
	 * which is why a compile error is a normal state here rather than a crash:
	 * you are editing live code, and it is invalid for most of the time you are
	 * typing it.
	 */
	import { onMount, onDestroy, tick, createEventDispatcher } from 'svelte';
	import { parseSequences, retimeSequence, toTimelineBars } from '$lib/video/sequence-timing.js';
	import { editVideoTemplateCode } from '../../../api/videoTemplates';
	import RemotionChat from './RemotionChat.svelte';

	/** The composition source. */
	export let tsx = '';
	/** Values to preview with, passed to the composition as inputProps. */
	export let inputProps = {};
	export let width = 1080;
	export let height = 1920;
	export let fps = 30;
	export let durationInFrames = 150;
	/**
	 * The side pane. Chat is the default surface — most people editing a video
	 * template are not here to read React, and opening on source made the editor
	 * look like a developer tool that happens to render video. The code is one
	 * tab away, not gone.
	 */
	export let showPane = true;
	let pane = 'chat'; // chat | code

	const dispatch = createEventDispatcher();

	let playerHost = null;
	let playerEl;
	let editorEl;
	let gutterEl;
	let status = 'loading'; // loading | compiling | live | error
	let hostReady = false;
	let applyTimer = null;
	let compileErrors = [];

	$: lineCount = tsx.split('\n').length;

	/*
	 * The player needs a sized box. It renders into whatever element it is given
	 * and does not impose dimensions of its own, so a bare `max-w-full` wrapper
	 * is a zero-height box and the composition mounts invisibly — status reads
	 * "Live", the stage stays black.
	 *
	 * Which axis to pin depends on the composition: a 9:16 reel in a wide stage
	 * is height-bound, a 16:9 embed is width-bound. Pinning the wrong one either
	 * overflows the stage or leaves the video tiny in the middle of it.
	 */
	/*
	 * Beats the composition declares as <Sequence>, as draggable bars.
	 *
	 * This is the only part of a Remotion scene that can be edited from a UI
	 * without deciding what the author meant: `from` and `durationInFrames` are
	 * plain numbers with an obvious visual meaning. Everything else — the
	 * interpolations, the springs — is arithmetic on the frame and has no
	 * timeline representation to drag.
	 *
	 * A composition with no sequences simply gets no track, rather than an empty
	 * one implying it should have beats.
	 */
	$: bars = toTimelineBars(parseSequences(tsx), durationInFrames);
	$: editableBars = bars.filter((b) => b.editable).length;

	let dragging = null;

	// ── AI edit ──────────────────────────────────────────────────────────
	let messages = [];
	let editing = false;

	const SUGGESTIONS = [
		'Make the intro shorter',
		'Use a darker background and brighter text',
		'Add an outro beat with the logo'
	];
	// The source as it was before the last AI edit. Holding it is the whole
	// safety net: a rewrite the user dislikes is one click from being undone,
	// which matters more than a diff view when the player already shows the
	// result immediately.
	let sourceBeforeEdit = null;

	async function runEdit(event) {
		const ask = String(event?.detail?.instruction || '').trim();
		if (!ask || editing) return;
		editing = true;
		messages = [...messages, { role: 'user', text: ask }];
		const previous = tsx;

		try {
			const result = await editVideoTemplateCode({
				tsx,
				instruction: ask,
				width: Math.round(width) || 1080,
				height: Math.round(height) || 1920,
				fps: Math.round(fps) || 30,
				durationInFrames: Math.round(durationInFrames) || 150
			});

			if (result?.changed && result.tsx) {
				// Only the newest edit is revertable: the button restores one step,
				// so offering it on older turns would promise a history that is not
				// kept.
				messages = messages.map((m) => ({ ...m, revertable: false }));
				sourceBeforeEdit = previous;
				tsx = result.tsx;
				dispatch('change', { tsx });
				messages = [
					...messages,
					{ role: 'assistant', text: 'Done — the preview is updated.', status: 'applied', revertable: true }
				];
			} else {
				messages = [
					...messages,
					{
						role: 'assistant',
						text: 'That is already how the scene works, so nothing changed.',
						status: 'nochange'
					}
				];
			}
		} catch (error) {
			const errors = error?.body?.errors || error?.errors;
			messages = [
				...messages,
				{
					role: 'assistant',
					// The composition is untouched on this path: the compile gate runs
					// server-side, so a rewrite that does not build never arrives.
					text: Array.isArray(errors) && errors.length
						? 'That edit would not compile, so the scene is unchanged.'
						: error?.message || 'The edit failed. Try rephrasing it.',
					status: 'error',
					errors: Array.isArray(errors) ? errors : []
				}
			];
		} finally {
			editing = false;
		}
	}

	function revertEdit() {
		if (sourceBeforeEdit === null) return;
		tsx = sourceBeforeEdit;
		sourceBeforeEdit = null;
		dispatch('change', { tsx });
		messages = [
			...messages.map((m) => ({ ...m, revertable: false })),
			{ role: 'assistant', text: 'Reverted to the previous version.', status: 'nochange' }
		];
	}

	const startDrag = (event, bar, mode) => {
		if (!bar.editable) return;
		event.preventDefault();
		event.stopPropagation();
		const track = event.currentTarget.closest('.ovs-track');
		if (!track) return;
		dragging = {
			index: bar.index,
			mode,
			trackWidth: track.getBoundingClientRect().width,
			startX: event.clientX,
			from: bar.from ?? 0,
			duration: bar.durationInFrames ?? 1
		};
		window.addEventListener('pointermove', onDrag);
		window.addEventListener('pointerup', endDrag, { once: true });
	};

	const onDrag = (event) => {
		if (!dragging) return;
		const total = Math.max(1, Math.round(durationInFrames) || 1);
		// Pixels to frames through the track's own width, so the mapping holds at
		// any panel size.
		const deltaFrames = ((event.clientX - dragging.startX) / dragging.trackWidth) * total;
		const timing =
			dragging.mode === 'move'
				? { from: dragging.from + deltaFrames }
				: { durationInFrames: dragging.duration + deltaFrames };
		// Rewrites the source on every move so the player follows the drag. The
		// stage already debounces recompiles, so this does not thrash.
		const next = retimeSequence(tsx, dragging.index, timing);
		if (next !== tsx) {
			tsx = next;
			dispatch('change', { tsx });
		}
	};

	const endDrag = () => {
		dragging = null;
		window.removeEventListener('pointermove', onDrag);
	};

	$: isPortrait = (Number(height) || 1920) >= (Number(width) || 1080);
	$: playerStyle = `aspect-ratio: ${Math.max(1, Math.round(width) || 1080)} / ${Math.max(1, Math.round(height) || 1920)}; ${
		isPortrait ? 'height: 100%; max-width: 100%;' : 'width: 100%; max-height: 100%;'
	}`;

	const syncGutter = () => {
		if (gutterEl && editorEl) gutterEl.scrollTop = editorEl.scrollTop;
	};

	/** Tab indents instead of leaving the editor, which is the whole point of a code box. */
	const handleKeydown = async (event) => {
		// Everything else is left alone deliberately: the studio's own hotkeys
		// (delete a clip, duplicate) must not fire while someone is typing code.
		event.stopPropagation();
		if (event.key !== 'Tab') return;
		event.preventDefault();
		const el = event.target;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		tsx = tsx.slice(0, start) + '  ' + tsx.slice(end);
		dispatch('change', { tsx });
		await tick();
		el.selectionStart = el.selectionEnd = start + 2;
	};

	const onInput = (event) => {
		tsx = event.target.value;
		dispatch('change', { tsx });
	};

	function applyCode() {
		if (!playerHost || !playerEl) return;
		status = 'compiling';
		const ok = playerHost.mountVideoPlayer(playerEl, {
			tsx,
			inputProps,
			width: Math.max(16, Math.round(width) || 1080),
			height: Math.max(16, Math.round(height) || 1920),
			fps: Math.max(1, Math.round(fps) || 30),
			durationInFrames: Math.max(1, Math.round(durationInFrames) || 150),
			onError: (message) => {
				status = 'error';
				compileErrors = [message];
				dispatch('error', { message });
			},
			// The composition's own schema is the source of truth for what it can
			// be parameterised by, so the studio's Variables tab is fed from the
			// running code rather than from whatever was last saved.
			onSchema: (fields) => dispatch('schema', { fields })
		});
		if (ok) {
			status = 'live';
			compileErrors = [];
		}
	}

	/*
	 * Debounced, and at two speeds. Code needs a long pause — recompiling on
	 * every keystroke means recompiling something syntactically broken, so the
	 * error panel would flash constantly while you type. Values and dimensions
	 * are always valid, so they can apply almost immediately.
	 */
	const schedule = (delay) => {
		if (!hostReady) return;
		status = 'compiling';
		clearTimeout(applyTimer);
		applyTimer = setTimeout(applyCode, delay);
	};

	$: tsx, schedule(800);
	$: inputProps, schedule(150);
	$: width, height, fps, durationInFrames, schedule(300);

	onMount(async () => {
		try {
			playerHost = await import('$lib/video/playerHost.js');
		} catch (error) {
			status = 'error';
			compileErrors = ['The live player failed to load. Reload the page and try again.'];
			return;
		}
		applyCode();
		hostReady = true;
	});

	onDestroy(() => {
		window.removeEventListener('pointermove', onDrag);
		clearTimeout(applyTimer);
		if (playerHost && playerEl) playerHost.unmount(playerEl);
	});
</script>

<div class="flex h-full min-h-0 w-full">
	{#if showPane}
		<!--
			Chat first, code behind a tab. The composition is edited by describing
			the change; the source is there for anyone who wants it, but it is no
			longer the first thing the editor puts in front of you.
		-->
		<div class="flex min-h-0 w-[42%] max-w-[560px] flex-col border-r-[3px] border-black bg-gray-950">
			<div class="flex shrink-0 items-center gap-1 border-b border-gray-800 px-2 py-1.5">
				{#each [['chat', 'Chat'], ['code', 'Code']] as [id, label] (id)}
					<button
						type="button"
						on:click={() => (pane = id)}
						class="rounded px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-colors
							{pane === id ? 'bg-gray-800 text-brand-accent' : 'text-gray-500 hover:text-gray-300'}"
					>
						{label}
					</button>
				{/each}
				<span
					class="ml-auto rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest
						{status === 'live'
						? 'bg-brand-success/15 text-brand-success'
						: status === 'error'
							? 'bg-brand-danger/15 text-brand-danger'
							: 'bg-gray-800 text-gray-400'}"
				>
					{status === 'live' ? 'Live' : status === 'error' ? 'Error' : 'Compiling'}
				</span>
			</div>

			{#if pane === 'chat'}
				<RemotionChat
					{messages}
					busy={editing}
					suggestions={SUGGESTIONS}
					on:send={runEdit}
					on:revert={revertEdit}
				/>
			{:else}
				<div class="flex min-h-0 flex-1">
					<!-- Line numbers scroll with the textarea rather than in their own box. -->
					<div
						bind:this={gutterEl}
						class="ov-gutter shrink-0 overflow-hidden bg-gray-900 py-3 pl-3 pr-2 text-right font-mono text-[11px] leading-[1.55] text-gray-600"
						aria-hidden="true"
					>
						{#each Array(lineCount) as _, i (i)}
							<div>{i + 1}</div>
						{/each}
					</div>
					<textarea
						bind:this={editorEl}
						value={tsx}
						on:input={onInput}
						on:scroll={syncGutter}
						on:keydown={handleKeydown}
						spellcheck="false"
						autocomplete="off"
						autocapitalize="off"
						aria-label="Composition source"
						class="ov-code min-h-0 flex-1 resize-none bg-gray-950 py-3 pl-2 pr-3 font-mono text-[11px] leading-[1.55] text-gray-100 outline-none"
					></textarea>
				</div>

				{#if compileErrors.length}
					<div class="max-h-40 shrink-0 overflow-y-auto border-t-[3px] border-black bg-brand-danger/10 p-3">
						{#each compileErrors as error (error)}
							<p class="font-mono text-[11px] leading-snug text-brand-danger">{error}</p>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	{/if}

	<div class="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-950">
		<div class="flex min-h-0 flex-1 items-center justify-center p-4">
			<div
				bind:this={playerEl}
				data-testid="player-root"
				class="overflow-hidden rounded-lg bg-black"
				style={playerStyle}
			></div>
		</div>

		{#if bars.length}
			<!--
				The beats this composition declares, as bars you can drag. Only these
				two numbers are safely editable from a UI; the rest of a Remotion
				scene is arithmetic on the frame with no timeline representation.
			-->
			<div class="shrink-0 border-t-[3px] border-black bg-gray-900 px-3 py-2" data-testid="sequence-track">
				<div class="mb-1.5 flex items-baseline justify-between">
					<span class="text-[10px] font-black uppercase tracking-widest text-gray-400">
						Beats
					</span>
					<span class="text-[10px] font-bold text-gray-500">
						{#if editableBars === bars.length}
							Drag to retime
						{:else}
							{editableBars} of {bars.length} draggable — the rest use computed timing
						{/if}
					</span>
				</div>

				<div class="ovs-track relative w-full">
					{#each bars as bar (bar.index)}
						<div
							class="relative mb-1 h-6 w-full"
							style="padding-left: {bar.depth * 10}px"
							title={bar.editable
								? `${bar.label || 'Beat'} — frames ${bar.start} to ${bar.start + bar.length}`
								: `${bar.label || 'Beat'} — computed timing, edit it in the code`}
						>
							<div
								role={bar.editable ? 'button' : 'presentation'}
								tabindex={bar.editable ? 0 : -1}
								on:pointerdown={(e) => startDrag(e, bar, 'move')}
								class="absolute top-0 flex h-6 items-center rounded border-[2px] px-1.5 text-[10px] font-bold
									{bar.editable
									? 'cursor-grab border-black bg-brand-accent text-black active:cursor-grabbing'
									: 'cursor-not-allowed border-gray-700 bg-gray-800 text-gray-400'}"
								style="left: {bar.left * 100}%; width: max(28px, {bar.width * 100}%);"
							>
								<span class="truncate">{bar.label || `Beat ${bar.index + 1}`}</span>
								{#if bar.editable}
									<!-- Right edge resizes duration; the body moves the start. -->
									<span
										role="button"
										tabindex="-1"
										aria-label="Resize {bar.label || 'beat'}"
										on:pointerdown|stopPropagation={(e) => startDrag(e, bar, 'resize')}
										class="absolute inset-y-0 right-0 w-2 cursor-ew-resize rounded-r bg-black/25 hover:bg-black/45"
									></span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/*
	 * The gutter and the textarea must share a line box exactly or the numbers
	 * drift from the code they label. Both set font, size and line-height
	 * explicitly rather than inheriting.
	 */
	.ov-code,
	.ov-gutter {
		tab-size: 2;
	}
	.ov-code {
		white-space: pre;
		overflow-wrap: normal;
		overflow-x: auto;
	}
</style>
