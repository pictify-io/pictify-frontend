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
	import { editVideoTemplateCodeStream } from '../../../api/videoTemplates';
	import RemotionChat from './RemotionChat.svelte';
	import { PRESS, TSX_RULES, segmentize } from '$lib/utils/press-highlight.js';

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
	let overlayEl;
	let gutterEl;
	let status = 'loading'; // loading | compiling | live | error
	let hostReady = false;
	let applyTimer = null;
	let compileErrors = [];

	$: lineCount = tsx.split('\n').length;
	$: segments = segmentize(tsx, TSX_RULES);

	// ── Transport ────────────────────────────────────────────────────────
	//
	// The player used to run on `autoPlay` with Remotion's own control bar and
	// nothing else. Autoplay is a request a browser can refuse, and a remount
	// after an edit drops it, so there were states with no way back to a playing
	// video — which is what "the video is not playing" meant. The pill below
	// drives the PlayerRef directly, so play is always one click away.
	let player = null;
	let playing = false;
	let frame = 0;

	const clock = (f) => {
		const total = Math.max(0, f) / Math.max(1, fps);
		const mins = Math.floor(total / 60);
		const secs = total - mins * 60;
		return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
	};
	$: elapsed = clock(frame);
	$: total = clock(durationInFrames);

	const togglePlay = () => {
		if (!player) return;
		if (player.isPlaying()) player.pause();
		else player.play();
	};

	const seekToRatio = (ratio) => {
		if (!player) return;
		const target = Math.round(Math.min(1, Math.max(0, ratio)) * (durationInFrames - 1));
		player.seekTo(target);
	};

	const scrub = (event) => {
		const track = event.currentTarget;
		const box = track.getBoundingClientRect();
		if (!box.width) return;
		seekToRatio((event.clientX - box.left) / box.width);
	};

	// Keyboard seeking on the scrubber: a slider a mouse can reach and a
	// keyboard cannot is not a control, it is a picture of one.
	const scrubKey = (event) => {
		if (!player) return;
		const step = event.shiftKey ? Math.round(fps) : 1;
		if (event.key === 'ArrowRight') player.seekTo(Math.min(durationInFrames - 1, frame + step));
		else if (event.key === 'ArrowLeft') player.seekTo(Math.max(0, frame - step));
		else if (event.key === 'Home') player.seekTo(0);
		else if (event.key === 'End') player.seekTo(durationInFrames - 1);
		else if (event.key === ' ' || event.key === 'Enter') togglePlay();
		else return;
		event.preventDefault();
	};

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
	/** What the edit is doing right now, shown in the pending turn. */
	let progress = '';

	/*
	 * Stage names are translated here rather than sent as prose from the server,
	 * so the wording is a UI decision and the protocol stays a protocol.
	 */
	const PROGRESS_TEXT = {
		generating: 'Reading the scene…',
		regenerating: 'Trying again…',
		writing: 'Writing the new scene…',
		compiling: 'Checking it builds…',
		retrying: 'That did not compile. Fixing it…'
	};

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
			const result = await editVideoTemplateCodeStream(
				{
					tsx,
					instruction: ask,
					width: Math.round(width) || 1080,
					height: Math.round(height) || 1920,
					fps: Math.round(fps) || 30,
					durationInFrames: Math.round(durationInFrames) || 150
				},
				(stage, data) => {
					progress = PROGRESS_TEXT[stage] || '';
					// The retry is the stage most worth seeing: without it, a second
					// attempt is indistinguishable from the request hanging.
					if (stage === 'retrying' && data?.errors?.length) {
						messages = [
							...messages,
							{
								role: 'assistant',
								text: 'The first attempt did not compile. Fixing it…',
								status: 'nochange',
								errors: data.errors
							}
						];
					}
				}
			);

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
					{ role: 'assistant', text: 'Done. The preview is updated.', status: 'applied', revertable: true }
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
			progress = '';
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
		if (!editorEl) return;
		// The textarea is the only scroller. The gutter and the highlight overlay
		// are followers, or the colours drift off the code they belong to.
		if (gutterEl) gutterEl.scrollTop = editorEl.scrollTop;
		if (overlayEl) {
			overlayEl.scrollTop = editorEl.scrollTop;
			overlayEl.scrollLeft = editorEl.scrollLeft;
		}
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
			onSchema: (fields) => dispatch('schema', { fields }),
			onFrame: (f) => (frame = f),
			onReady: (ref) => (player = ref),
			onPlayState: (value) => (playing = value)
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

<!-- gap-4, matching the timeline kind: the two kinds are the same studio, so
     the chat panel floats as its own card with the stage showing between them
     rather than the two running together as one white slab. -->
<div class="flex h-full min-h-0 w-full gap-4">
	{#if showPane}
		<!--
			Chat first, code behind a tab. The composition is edited by describing
			the change; the source is there for anyone who wants it, but it is no
			longer the first thing the editor puts in front of you.
		-->
		<div class="studio-card flex min-h-0 w-[42%] max-w-[560px] flex-col overflow-hidden rounded-card bg-brand-paper">
			<div class="flex shrink-0 items-center gap-1 border-b border-brand-rule px-2 py-1.5">
				<!-- "Say it", not "Chat": the image studio calls this rail Say it, and
				     the two studios are one product. -->
				{#each [['chat', 'Say it'], ['code', 'Code']] as [id, label] (id)}
					<button
						type="button"
						on:click={() => (pane = id)}
						class="rounded px-2 py-1 text-[10px] font-mono uppercase tracking-[0.08em] transition-colors
							{pane === id ? 'bg-brand-subtle text-brand-ink' : 'text-brand-mute hover:text-brand-ink'}"
					>
						{label}
					</button>
				{/each}
				<span
					class="ml-auto rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.08em]
						{status === 'live'
						? 'bg-brand-proof/15 text-brand-proof'
						: status === 'error'
							? 'bg-brand-alarm/15 text-brand-alarm'
							: 'bg-brand-subtle text-brand-slate'}"
				>
					{status === 'live' ? 'Live' : status === 'error' ? 'Error' : 'Compiling'}
				</span>

				<!-- Hiding this panel is a view preference, so the control lives on the
				     panel it hides rather than as a checkbox in the inspector. -->
				<button
					type="button"
					on:click={() => dispatch('hidePane')}
					aria-label="Hide the side panel"
					title="Hide the side panel"
					class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-btn text-brand-mute hover:bg-brand-subtle hover:text-brand-ink"
				>
					<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
						<path
							d="M1 1l8 8M9 1l-8 8"
							stroke="currentColor"
							stroke-width="1.6"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>

			{#if pane === 'chat'}
				<RemotionChat
					{messages}
					busy={editing}
					{progress}
					suggestions={SUGGESTIONS}
					on:send={runEdit}
					on:revert={revertEdit}
				/>
			{:else}
				<!--
					Same overlay technique as the image studio's HtmlPane: a coloured
					<pre> under a transparent textarea. The textarea stays a textarea,
					so native undo, selection, IME and paste keep working — which a
					contenteditable re-implements badly and CodeMirror brings a whole
					parser along for.
				-->
				<div class="flex min-h-0 flex-1" style="background: {PRESS.bg}">
					<!-- Line numbers scroll with the textarea rather than in their own box. -->
					<div
						bind:this={gutterEl}
						class="ov-gutter shrink-0 overflow-hidden py-3 pl-3 pr-2 text-right font-mono text-[11px] leading-[1.55]"
						style="color: rgba(173,185,198,0.35)"
						aria-hidden="true"
					>
						{#each Array(lineCount) as _, i (i)}
							<div>{i + 1}</div>
						{/each}
					</div>
					<div class="relative min-w-0 flex-1">
						<pre
							bind:this={overlayEl}
							aria-hidden="true"
							class="ov-code pointer-events-none absolute inset-0 overflow-hidden py-3 pl-2 pr-3 font-mono text-[11px] leading-[1.55]"
							style="color: {PRESS.text}"
						>{#each segments as seg, i (i)}{#if seg.color}<span
										style="color:{seg.color}{seg.weight ? `;font-weight:${seg.weight}` : ''}"
										>{seg.text}</span
									>{:else}{seg.text}{/if}{/each}</pre>
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
							class="ov-code absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent py-3 pl-2 pr-3 font-mono text-[11px] leading-[1.55] text-transparent caret-white outline-none"
						></textarea>
					</div>
				</div>

				<div class="flex shrink-0 items-center gap-2 border-t border-white/10 px-3 py-2.5" style="background: {PRESS.bg}">
					<span class="block h-2 w-2 flex-shrink-0" style="background: {PRESS.token}" aria-hidden="true"
					></span>
					<span class="font-mono text-[11px] leading-[15px]" style="color: rgba(173,185,198,0.55)">
						Pink schema fields are inputs — add one and it appears in the Inputs panel.
					</span>
				</div>

				{#if compileErrors.length}
					<div class="max-h-40 shrink-0 overflow-y-auto border-t border-brand-rule bg-brand-alarm/10 p-3">
						{#each compileErrors as error (error)}
							<p class="font-mono text-[11px] leading-snug text-brand-alarm">{error}</p>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	{/if}

	{#if !showPane}
		<!-- The way back. A panel you can close and not reopen is a panel you
		     lose. -->
		<button
			type="button"
			on:click={() => dispatch('showPane')}
			class="studio-card flex h-full w-11 flex-shrink-0 items-center justify-center rounded-card bg-brand-paper text-brand-slate hover:text-brand-ink"
			title="Show the side panel"
		>
			<span class="font-mono text-[10px] uppercase tracking-[0.08em] [writing-mode:vertical-rl]">
				Say it
			</span>
		</button>
	{/if}

	<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
		<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4">
			<div
				bind:this={playerEl}
				data-testid="player-root"
				class="min-h-0 overflow-hidden rounded-lg bg-black"
				style={playerStyle}
			></div>

			<!--
				Transport. Sized as a pill so it reads as one control rather than a
				toolbar: this surface has exactly one thing to do, and the scrubber
				is the only place a frame number is worth showing.
			-->
			<div
				class="flex flex-shrink-0 items-center gap-3 rounded-full bg-brand-paper py-0 pl-1.5 pr-4"
				style="box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)"
			>
				<button
					type="button"
					on:click={togglePlay}
					disabled={!player}
					aria-label={playing ? 'Pause' : 'Play'}
					class="my-1 flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-brand-ink text-white transition-opacity hover:opacity-85 disabled:opacity-40"
				>
					{#if playing}
						<svg width="10" height="11" viewBox="0 0 10 11" aria-hidden="true">
							<rect x="0" y="0" width="3.2" height="11" fill="currentColor" />
							<rect x="6.8" y="0" width="3.2" height="11" fill="currentColor" />
						</svg>
					{:else}
						<svg width="10" height="11" viewBox="0 0 10 11" aria-hidden="true">
							<path d="M0 0l10 5.5L0 11z" fill="currentColor" />
						</svg>
					{/if}
				</button>

				<span class="font-mono text-[11px] tabular-nums text-brand-ink">{elapsed}</span>

				<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
				<div
					role="slider"
					tabindex="0"
					aria-label="Seek"
					aria-valuemin={0}
					aria-valuemax={Math.max(0, durationInFrames - 1)}
					aria-valuenow={frame}
					aria-valuetext="Frame {frame} of {Math.max(0, durationInFrames - 1)}"
					on:click={scrub}
					on:keydown={scrubKey}
					class="group relative h-6 w-[180px] flex-shrink-0 cursor-pointer focus:outline-none"
				>
					<div class="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-brand-rule">
						<div
							class="h-full rounded-full bg-brand-ink"
							style="width: {durationInFrames > 1
								? Math.min(100, (frame / (durationInFrames - 1)) * 100)
								: 0}%"
						></div>
					</div>
					<div
						class="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-pink opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
						style="left: {durationInFrames > 1
							? Math.min(100, (frame / (durationInFrames - 1)) * 100)
							: 0}%"
					></div>
				</div>

				<span class="font-mono text-[11px] tabular-nums text-brand-mute">
					/ {total} · FRAME {frame}
				</span>
			</div>
		</div>

		{#if bars.length}
			<!--
				The beats this composition declares, as bars you can drag. Only these
				two numbers are safely editable from a UI; the rest of a Remotion
				scene is arithmetic on the frame with no timeline representation.
			-->
			<div class="shrink-0 border-t border-brand-rule bg-brand-subtle px-3 py-2" data-testid="sequence-track">
				<div class="mb-1.5 flex items-baseline justify-between">
					<span class="text-[10px] font-mono uppercase tracking-[0.08em] text-brand-slate">
						Beats
					</span>
					<span class="text-[10px] font-bold text-brand-mute">
						{#if editableBars === bars.length}
							Drag to retime
						{:else}
							{editableBars} of {bars.length} draggable; the rest use computed timing
						{/if}
					</span>
				</div>

				<div class="ovs-track relative w-full">
					{#each bars as bar (bar.index)}
						<div
							class="relative mb-1 h-6 w-full"
							style="padding-left: {bar.depth * 10}px"
							title={bar.editable
								? `${bar.label || 'Beat'}: frames ${bar.start} to ${bar.start + bar.length}`
								: `${bar.label || 'Beat'}: computed timing, edit it in the code`}
						>
							<div
								role={bar.editable ? 'button' : 'presentation'}
								tabindex={bar.editable ? 0 : -1}
								on:pointerdown={(e) => startDrag(e, bar, 'move')}
								class="absolute top-0 flex h-6 items-center rounded border-[2px] px-1.5 text-[10px] font-bold
									{bar.editable
									? 'cursor-grab border-brand-rule bg-brand-field text-black active:cursor-grabbing'
									: 'cursor-not-allowed border-brand-rule bg-brand-subtle text-brand-slate'}"
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
