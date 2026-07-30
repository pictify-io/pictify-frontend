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

	/** The composition source. */
	export let tsx = '';
	/** Values to preview with, passed to the composition as inputProps. */
	export let inputProps = {};
	export let width = 1080;
	export let height = 1920;
	export let fps = 30;
	export let durationInFrames = 150;
	/** Hidden when the studio is showing its Variables tab instead. */
	export let showCode = true;

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
		clearTimeout(applyTimer);
		if (playerHost && playerEl) playerHost.unmount(playerEl);
	});
</script>

<div class="flex h-full min-h-0 w-full">
	{#if showCode}
		<!--
			Code on the left, preview on the right: the same reading order as the
			tool rail it replaces, so the studio's shape does not change when the
			template kind does.
		-->
		<div class="flex min-h-0 w-[42%] max-w-[560px] flex-col border-r-[3px] border-black bg-gray-950">
			<div class="flex shrink-0 items-center justify-between px-3 py-2">
				<span class="text-[10px] font-black uppercase tracking-widest text-gray-400">
					Composition
				</span>
				<span
					class="rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest
						{status === 'live'
						? 'bg-brand-success/15 text-brand-success'
						: status === 'error'
							? 'bg-brand-danger/15 text-brand-danger'
							: 'bg-gray-800 text-gray-400'}"
				>
					{status === 'live' ? 'Live' : status === 'error' ? 'Error' : 'Compiling'}
				</span>
			</div>

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
		</div>
	{/if}

	<div class="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-gray-950 p-4">
		<div
			bind:this={playerEl}
			data-testid="player-root"
			class="overflow-hidden rounded-lg bg-black"
			style={playerStyle}
		></div>
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
