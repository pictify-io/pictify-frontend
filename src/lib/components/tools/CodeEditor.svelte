<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { EditorView, keymap } from '@codemirror/view';
	import { EditorState } from '@codemirror/state';
	import { basicSetup } from 'codemirror';
	import { html } from '@codemirror/lang-html';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { indentWithTab } from '@codemirror/commands';
	import { createGifPublic } from '../../../api/image.js';
	import { analytics } from '$lib/telemetry.js';

	export let isGifEnabled = false;
	export let isPreviewEnabled = true;
	export let fileExtension = 'png';
	export let toolName = '';
	/**
	 * 'v1' is the original stacked layout with its own size controls, still used
	 * by the tool pages that have not moved to the v2 shell.
	 * 'v2' is the Repro Shop split: dark editor pane left, preview pane right,
	 * with the size controls living in the tool card's toolbar instead.
	 */
	export let variant = 'v1';
	/** The render size. Bindable, so a v2 toolbar can drive it. */
	export let previewWidth = 600;
	export let previewHeight = 400;

	let hasTrackedFirstInput = false;

	const defaultHTML = `<html>
  <head>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Manrope:wght@400;600;700;800&family=Silkscreen&display=swap" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #fff4da;
      }
      .main {
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding-left: 4rem;
        padding-right: 4rem;
      }
      .container {
        display: flex;
      }
      .text {
        text-align: center;
        margin: 2rem;
      }
      .text > h1 {
        font-family: 'Silkscreen', sans-serif;
        font-size: 70px;
        color: #ff6b6b;
        margin: 0;
      }
      .text > h2 {
        font-family: 'Manrope', sans-serif;
        font-size: 18px;
        color: rgb(14, 13, 13);
      }
      .side-element-1 {
        transform: translateY(-4rem);
        animation: rotate 6s linear infinite;
        width: 3rem;
      }
      .side-element-2 {
        transform: translateY(-4rem);
        animation: rotate 6s linear infinite;
        width: 3rem;
      }
      .bottom-img-container {
        display: flex;
        flex-direction: column;
      }
      .bottom-img-container > div:nth-child(1) {
        flex-grow: 1;
      }
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div class="main">
      <div class="container">
        <div>
          <img loading="lazy" src="https://res.cloudinary.com/diroilukd/image/upload/v1702766105/shape-1_wld59w.png" class="side-element-1">
        </div>
        <div class="text">
          <h1>Pictify</h1>
          <h2>Edit the HTML and see the preview here. Click on image tab to create image</h2>
        </div>
        <div class="bottom-img-container">
          <div></div>
          <div>
            <img loading="lazy" src="https://res.cloudinary.com/diroilukd/image/upload/v1702766150/shape-2_phblyh.png" class="side-element-2">
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;

	let codeHTML = defaultHTML;
	let editorElement;
	let editorView;

	const presetSizes = [
		{ value: '1200x630', label: 'OG Image (1200×630)' },
		{ value: '1200x675', label: 'Twitter (1200×675)' },
		{ value: '1080x1080', label: 'Square (1080×1080)' },
		{ value: '1080x1350', label: 'Portrait (1080×1350)' },
		{ value: '1080x1920', label: 'Story (1080×1920)' },
		{ value: '1920x1080', label: 'Full HD (1920×1080)' },
		{ value: '1280x720', label: 'HD (1280×720)' },
		{ value: '800x1200', label: 'Invoice (800×1200)' },
		{ value: '1600x900', label: 'Widescreen (1600×900)' }
	];

	let previewFrame;
	let iframeContainer;
	let previewContainerEl;
	let isImageLoading = false;
	let containerWidth = 800;

	// v2's preview pane is a 520px-tall column that also carries a caption and a
	// footnote, so the render gets a much shorter ceiling than v1's full-width
	// panel. Both are named in the reactive statement below so a variant change
	// re-scales rather than keeping the first value it saw.
	$: MAX_PREVIEW_HEIGHT = variant === 'v2' ? 340 : 500;
	$: PREVIEW_PADDING = variant === 'v2' ? 48 : 32;

	$: previewScale = (() => {
		const availW = containerWidth - PREVIEW_PADDING;
		const scaleX = availW / previewWidth;
		const scaleY = MAX_PREVIEW_HEIGHT / previewHeight;
		return Math.min(scaleX, scaleY, 1);
	})();
	$: previewContainerHeight = Math.min(
		previewHeight * previewScale + PREVIEW_PADDING,
		MAX_PREVIEW_HEIGHT + PREVIEW_PADDING
	);
	$: previewMarginLeft = Math.max(
		0,
		(containerWidth - PREVIEW_PADDING - previewWidth * previewScale) / 2
	);

	const dispatch = createEventDispatcher();

	onMount(() => {
		window.addEventListener('message', handlePreviewMessage);
		if (editorElement) {
			editorView = new EditorView({
				state: EditorState.create({
					doc: codeHTML,
					extensions: [
						basicSetup,
						html({ selfClosingTags: true }),
						oneDark,
						keymap.of([indentWithTab]),
						EditorView.updateListener.of((update) => {
							if (update.docChanged) {
								if (!hasTrackedFirstInput && toolName) {
									hasTrackedFirstInput = true;
									analytics.trackToolFirstInput({ tool_name: toolName });
								}
								codeHTML = update.state.doc.toString();
								updateIframe();
							}
						}),
						EditorView.theme({
							'&': { fontSize: '13px' },
							'.cm-scroller': { minHeight: '350px' }
						})
					]
				}),
				parent: editorElement
			});
		}

		updateIframe();

		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				containerWidth = entry.contentRect.width;
			}
		});

		// Observe once the preview container mounts
		const checkContainer = setInterval(() => {
			if (previewContainerEl) {
				containerWidth = previewContainerEl.clientWidth;
				ro.observe(previewContainerEl);
				clearInterval(checkContainer);
			}
		}, 50);

		return () => {
			ro.disconnect();
			clearInterval(checkContainer);
		};
	});

	onDestroy(() => {
		editorView?.destroy();
		clearTimeout(srcdocDebounceTimer);
		clearTimeout(hijackTimer);
		if (typeof window !== 'undefined') {
			window.removeEventListener('message', handlePreviewMessage);
		}
	});

	function getSrcDoc() {
		return codeHTML;
	}

	// v2 drives the size from the toolbar, so a change arriving as a prop has to
	// repaint the frame the same way an in-component control would. Both deps
	// are named in the statement so the reaction actually fires.
	$: if (variant === 'v2' && (previewWidth || previewHeight)) {
		updateIframe();
	}

	// ── Preview hijack containment + detection ──────────────
	// The preview renders arbitrary pasted HTML. sandbox (without
	// allow-same-origin) keeps it off the pictify.io origin, the {#key} block
	// mounts a fresh frame per (debounced) edit so a document that navigated
	// the frame away can't survive the next keystroke, and the beacon below
	// tells us when a loaded document isn't ours so hijacks show up in
	// analytics instead of only in session recordings.
	// Split so the literal doesn't terminate this component's own script block.
	const PREVIEW_BEACON =
		`<script>try{parent.postMessage({type:'pictify-preview-alive'},'*')}catch(e){}</scr` + `ipt>`;
	let srcdocKey = 0;
	let srcdocDebounceTimer;
	let previewAlive = false;
	let hijackTimer;
	let hijackReported = false;

	$: previewSrcdoc = codeHTML + PREVIEW_BEACON;

	function handlePreviewMessage(event) {
		// Source check: a queued beacon from a torn-down frame must not mark the
		// keyed replacement frame alive and mask a hijack there.
		if (
			event.source === previewFrame?.contentWindow &&
			event.data?.type === 'pictify-preview-alive'
		) {
			previewAlive = true;
		}
	}

	function handlePreviewLoad() {
		clearTimeout(hijackTimer);
		// The beacon posts during parse, but postMessage delivery order vs the
		// load event is not guaranteed either way; give it a beat, then judge.
		// previewAlive re-arms only after the check so a beacon that landed
		// before load still counts for this document.
		hijackTimer = setTimeout(() => {
			if (!previewAlive && !hijackReported) {
				hijackReported = true;
				analytics.trackError({
					error_type: 'preview_hijacked',
					error_message: 'preview iframe navigated away from srcdoc',
					context: toolName || 'code_editor'
				});
			}
			previewAlive = false;
		}, 400);
	}

	function updateIframe() {
		clearTimeout(srcdocDebounceTimer);
		srcdocDebounceTimer = setTimeout(() => {
			srcdocKey++;
			hijackReported = false;
			dispatch('previewUpdated', { html: getSrcDoc(), width: previewWidth, height: previewHeight });
		}, 300);
	}

	async function createGif() {
		isImageLoading = true;
		const html = getSrcDoc();
		const width = previewFrame
			? parseInt(getComputedStyle(previewFrame).width.replace('px', ''))
			: previewWidth;
		const height = previewFrame
			? parseInt(getComputedStyle(previewFrame).height.replace('px', ''))
			: previewHeight;

		try {
			const { gif } = await createGifPublic({
				html,
				width,
				height
			});
			dispatch('imageGenerated', { image: gif });
			isImageLoading = false;
		} catch (e) {
			/* ignored */
		}
	}
</script>

{#if variant === 'v2'}
	<!--
		v2 split: markup on the dark side, the render on the light side. The
		size controls are NOT here — the tool card's toolbar owns them, so the
		editor pane is only ever about the code.
	-->
	<div class="flex w-full flex-col lg:h-[520px] lg:flex-row">
		<!-- Editor pane -->
		<div class="flex min-w-0 flex-1 flex-col bg-brand-press">
			<div class="flex flex-shrink-0 items-center gap-1 border-b border-[#383A42] px-4 py-2.5">
				<span
					class="bg-brand-press-deep px-2.5 py-[5px] font-mono text-xs tracking-[0.06em] text-white"
				>
					INDEX.HTML
				</span>
				<span class="px-2.5 py-[5px] font-mono text-xs tracking-[0.06em] text-brand-press-text">
					STYLE.CSS
				</span>
				<span class="ml-auto hidden font-mono text-xs tracking-[0.06em] text-brand-mute sm:inline">
					PASTE OR TYPE · AUTOSAVES
				</span>
			</div>
			<div class="min-h-[360px] flex-1 overflow-auto lg:min-h-0">
				<div bind:this={editorElement} />
			</div>
		</div>

		<!-- Preview pane -->
		{#if isPreviewEnabled}
			<div
				class="flex w-full flex-shrink-0 flex-col items-center justify-center gap-3.5 border-t-2 border-brand-ink bg-brand-subtle p-6 lg:w-[420px] lg:border-l-2 lg:border-t-0"
				bind:this={previewContainerEl}
			>
				<span class="font-mono text-xs tracking-[0.06em] text-brand-mute">
					LIVE PREVIEW · {previewWidth}×{previewHeight} · {(fileExtension || 'png').toUpperCase()}
				</span>
				<div
					class="flex-shrink-0 overflow-hidden"
					style="width: {Math.round(previewWidth * previewScale)}px; height: {Math.round(
						previewHeight * previewScale
					)}px;"
				>
					<div
						class="origin-top-left border-2 border-brand-ink bg-white shadow-[4px_4px_0_0_#000000]"
						style="width: {previewWidth}px; height: {previewHeight}px; transform: scale({previewScale});"
					>
						{#key srcdocKey}
							<iframe
								class="h-full w-full border-0 bg-white"
								title="code-preview"
								srcdoc={previewSrcdoc}
								sandbox="allow-scripts"
								on:load={handlePreviewLoad}
								bind:this={previewFrame}
							/>
						{/key}
					</div>
				</div>
				<p class="text-center font-sans text-sm leading-[18px] text-brand-slate">
					Updates as you type. Nothing is uploaded until you press Generate.
				</p>
			</div>
		{/if}
	</div>
{:else}
	<section class="w-full">
		<div class="flex flex-col overflow-hidden bg-white">
			<!-- Preview Panel (top, full width, maximized) -->
			<div class="w-full flex flex-col bg-white">
				<!-- Preview Header -->
				<div class="flex bg-[#1a1a2e] px-4 py-3 justify-between items-center">
					<div class="flex items-center gap-3">
						<span
							class="text-data-green text-sm font-bold uppercase tracking-wider flex items-center gap-2"
						>
							<span class="w-2 h-2 rounded-full bg-data-green inline-block" />
							Live Preview
						</span>
						{#if isGifEnabled}
							<button
								on:click={() => {
									createGif();
								}}
								class="bg-brand-accent hover:bg-[#ffb366] text-black px-4 py-2 text-sm font-bold uppercase tracking-wide flex items-center gap-2 transition-colors border border-brand-ink hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
								GIF
							</button>
						{/if}
					</div>
					<!-- Size Controls -->
					<div class="flex items-center gap-2">
						<select
							class="px-2 py-1 border border-gray-600 text-xs font-bold bg-[#2a2a3e] text-white focus:outline-none focus:border-brand-danger focus:ring-1 focus:ring-brand-danger cursor-pointer"
							value={`${previewWidth}x${previewHeight}`}
							on:change={(e) => {
								const val = e.target.value;
								if (val === 'custom') return;
								const [w, h] = val.split('x').map(Number);
								previewWidth = w;
								previewHeight = h;
								updateIframe();
							}}
						>
							{#each presetSizes as preset}
								<option value={preset.value}>{preset.label}</option>
							{/each}
							{#if !presetSizes.some((p) => p.value === `${previewWidth}x${previewHeight}`)}
								<option value={`${previewWidth}x${previewHeight}`}
									>Custom ({previewWidth}×{previewHeight})</option
								>
							{/if}
						</select>
						<div class="flex items-center gap-1">
							<input
								type="number"
								class="w-14 px-1.5 py-0.5 border border-gray-600 text-xs font-medium text-center bg-[#2a2a3e] text-white focus:outline-none focus:border-brand-danger focus:ring-1 focus:ring-brand-danger"
								value={previewWidth}
								min="100"
								max="1920"
								on:input={(e) => {
									previewWidth = parseInt(e.target.value) || previewWidth;
									updateIframe();
								}}
							/>
							<span class="text-gray-400 text-xs font-bold">×</span>
							<input
								type="number"
								class="w-14 px-1.5 py-0.5 border border-gray-600 text-xs font-medium text-center bg-[#2a2a3e] text-white focus:outline-none focus:border-brand-danger focus:ring-1 focus:ring-brand-danger"
								value={previewHeight}
								min="100"
								max="1080"
								on:input={(e) => {
									previewHeight = parseInt(e.target.value) || previewHeight;
									updateIframe();
								}}
							/>
						</div>
					</div>
				</div>

				<!-- Preview Frame - scaled to fit while preserving exact aspect ratio -->
				<div
					class="w-full bg-[#f0f0f0] overflow-hidden"
					style="height: {previewContainerHeight}px; padding: {PREVIEW_PADDING / 2}px;"
					bind:this={previewContainerEl}
				>
					<div
						bind:this={iframeContainer}
						class="bg-white border border-gray-300 shadow-md origin-top-left"
						style="width: {previewWidth}px; height: {previewHeight}px; transform: scale({previewScale}); margin-left: {previewMarginLeft}px;"
					>
						{#key srcdocKey}
							<iframe
								class="w-full h-full bg-white border-0"
								title="code-preview"
								srcdoc={previewSrcdoc}
								sandbox="allow-scripts"
								on:load={handlePreviewLoad}
								bind:this={previewFrame}
							/>
						{/key}
					</div>
				</div>
			</div>

			<!-- HTML Code Editor Panel (below preview) -->
			<div class="w-full flex flex-col border-t-[3px] border-black">
				<!-- Tab Bar -->
				<div class="flex bg-[#1a1a2e] px-4 py-3">
					<span
						class="px-5 py-2 text-sm font-semibold uppercase tracking-wider bg-white text-black border border-brand-ink shadow-[3px_3px_0_0_#ff6b6b]"
					>
						HTML
					</span>
				</div>
				<!-- Code Area -->
				<div class="overflow-auto" style="max-height: 400px;">
					<div bind:this={editorElement} />
				</div>
			</div>
		</div>
	</section>
{/if}
