<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { EditorView, keymap } from '@codemirror/view';
	import { EditorState } from '@codemirror/state';
	import { basicSetup } from 'codemirror';
	import { html } from '@codemirror/lang-html';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { indentWithTab } from '@codemirror/commands';
	import { createGifPublic } from '../../../api/image.js';
	import { analytics } from '$lib/analytics.js';

	export let isGifEnabled = false;
	export let isPreviewEnabled = true;
	export let fileExtension = 'png';
	export let toolName = '';

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
          <img src="https://res.cloudinary.com/diroilukd/image/upload/v1702766105/shape-1_wld59w.png" class="side-element-1">
        </div>
        <div class="text">
          <h1>Pictify</h1>
          <h2>Edit the HTML and see the preview here. Click on image tab to create image</h2>
        </div>
        <div class="bottom-img-container">
          <div></div>
          <div>
            <img src="https://res.cloudinary.com/diroilukd/image/upload/v1702766150/shape-2_phblyh.png" class="side-element-2">
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
	let previewWidth = 600;
	let previewHeight = 400;
	let containerWidth = 800;

	const MAX_PREVIEW_HEIGHT = 500;
	const PREVIEW_PADDING = 32;

	$: previewScale = (() => {
		const availW = containerWidth - PREVIEW_PADDING;
		const scaleX = availW / previewWidth;
		const scaleY = MAX_PREVIEW_HEIGHT / previewHeight;
		return Math.min(scaleX, scaleY, 1);
	})();
	$: previewContainerHeight = Math.min(previewHeight * previewScale + PREVIEW_PADDING, MAX_PREVIEW_HEIGHT + PREVIEW_PADDING);
	$: previewMarginLeft = Math.max(0, ((containerWidth - PREVIEW_PADDING) - previewWidth * previewScale) / 2);

	const dispatch = createEventDispatcher();

	onMount(() => {
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
	});

	function getSrcDoc() {
		return codeHTML;
	}

	function updateIframe() {
		if (previewFrame) {
			previewFrame.srcdoc = getSrcDoc();
			dispatch('previewUpdated', { html: getSrcDoc(), width: previewWidth, height: previewHeight });
		}
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
		} catch (e) { /* ignored */ }
	}
</script>

<section class="w-full">
	<div class="flex flex-col overflow-hidden bg-white">
		<!-- Preview Panel (top, full width, maximized) -->
		<div class="w-full flex flex-col bg-white">
			<!-- Preview Header -->
			<div class="flex bg-[#1a1a2e] px-4 py-3 justify-between items-center">
				<div class="flex items-center gap-3">
					<span class="text-[#4ade80] text-sm font-bold uppercase tracking-wider flex items-center gap-2">
						<span class="w-2 h-2 rounded-full bg-[#4ade80] inline-block"></span>
						Live Preview
					</span>
					{#if isGifEnabled}
						<button
							on:click={() => {
								createGif();
							}}
							class="bg-[#ffc480] hover:bg-[#ffb366] text-black px-4 py-2 text-sm font-bold uppercase tracking-wide flex items-center gap-2 transition-colors border-[2px] border-black shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
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
						class="px-2 py-1 border border-gray-600 text-xs font-bold bg-[#2a2a3e] text-white focus:outline-none focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b] cursor-pointer"
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
						{#if !presetSizes.some(p => p.value === `${previewWidth}x${previewHeight}`)}
							<option value={`${previewWidth}x${previewHeight}`}>Custom ({previewWidth}×{previewHeight})</option>
						{/if}
					</select>
					<div class="flex items-center gap-1">
						<input
							type="number"
							class="w-14 px-1.5 py-0.5 border border-gray-600 text-xs font-medium text-center bg-[#2a2a3e] text-white focus:outline-none focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b]"
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
							class="w-14 px-1.5 py-0.5 border border-gray-600 text-xs font-medium text-center bg-[#2a2a3e] text-white focus:outline-none focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b]"
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
					<iframe
						class="w-full h-full bg-white border-0"
						title="code-preview"
						srcdoc={getSrcDoc()}
						bind:this={previewFrame}
					/>
				</div>
			</div>
		</div>

		<!-- HTML Code Editor Panel (below preview) -->
		<div class="w-full flex flex-col border-t-[3px] border-black">
			<!-- Tab Bar -->
			<div class="flex bg-[#1a1a2e] px-4 py-3">
				<span
					class="px-5 py-2 text-sm font-black uppercase tracking-wider bg-white text-black border-[2px] border-black shadow-[3px_3px_0_0_#ff6b6b]"
				>
					HTML
				</span>
			</div>
			<!-- Code Area -->
			<div class="overflow-auto" style="max-height: 400px;">
				<div bind:this={editorElement}></div>
			</div>
		</div>
	</div>
</section>
