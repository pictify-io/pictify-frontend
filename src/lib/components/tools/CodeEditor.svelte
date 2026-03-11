<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import CodeMirror from 'svelte-codemirror-editor';
	import { html } from '@codemirror/lang-html';
	import { css } from '@codemirror/lang-css';
	import { createImagePublic, createGifPublic } from '../../../api/image.js';
	import Loader from '$lib/components/Loader.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '../../../store/toast.store';

	export let isGifEnabled = false;
	export let isPreviewEnabled = true;
	export let fileExtension = 'png';

	let codeHTML = `
<html>
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Manrope:wght@400;600;700;800&family=Silkscreen&display=swap"
        rel="stylesheet">
  <body>
    <div class="main">
        <div class="container">
            <div>
                <img src="https://res.cloudinary.com/diroilukd/image/upload/v1702766105/shape-1_wld59w.png" class="side-element-1">
            </div>
            <div class="text">
                <h1>Pictify</h1>
                <h2>Edit the HTML and CSS and see the preview here. Click on image tab to create image</h2>
            </div>
            <div class="bottom-img-container">
              <div>
              </div>
                <div>
                  <img src="https://res.cloudinary.com/diroilukd/image/upload/v1702766150/shape-2_phblyh.png" class="side-element-2">
                  </div>
                </div>
            </div>
      </div>
  </body>
</html>
`;
	let codeCSS = `
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
        color:rgb(14, 13, 13)
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
      display:flex; 
      flex-direction:column
    }

    .bottom-img-container > div:nth-child(1) {
      flex-grow:1;
    }

    @keyframes rotate  {
        from {
            transform: rotate(0deg) ;
        }
        to {
            transform: rotate(360deg);
        }
    }

`;

	let codeWidth = undefined;
	let currentTab = 'html';
	let currentResultTab = 'preview';
	let previewFrame;
	let iframeContainer;
	let isImageLoading = false;
	let img;
	let previewWidth = 600;
	let previewHeight = 400;

	const dispatch = createEventDispatcher();

	onMount(async () => {
		console.log(fileExtension);
		updateIframe();
	});

	function returnStyleTag(css) {
		const styleTagRegex = /<style>(.*?)<\/style>/s;
		const match = styleTagRegex.exec(css);
		if (match) {
			return css;
		} else {
			return css
				.replace('[styleOpen]', '<$>')
				.replace('[styleClose]', '</$>')
				.replaceAll('$', 'style');
		}
	}

	function getSrcDoc() {
		return `
        <head>
          ${returnStyleTag(`[styleOpen]${codeCSS}[styleClose]`)}
        </head>
          ${codeHTML}
`;
	}

	function updateIframe() {
		if (previewFrame) {
			previewFrame.srcdoc = getSrcDoc();
			previewWidth = parseInt(getComputedStyle(previewFrame).width.replace('px', ''));
			previewHeight = parseInt(getComputedStyle(previewFrame).height.replace('px', ''));
			dispatch('previewUpdated', { html: getSrcDoc(), width: previewWidth, height: previewHeight });
		}
	}

	function updateScale(value) {
		iframeContainer.style.transform = `scale(${value})`;
		iframeContainer.style.transformOrigin = 'top left';
	}

	async function createImage() {
		isImageLoading = true;
		currentResultTab = 'image';
		const html = getSrcDoc();
		const width = previewFrame
			? parseInt(getComputedStyle(previewFrame).width.replace('px', ''))
			: previewWidth;
		const height = previewFrame
			? parseInt(getComputedStyle(previewFrame).height.replace('px', ''))
			: previewHeight;

		try {
			const { image } = await createImagePublic({
				html,
				width,
				height,
				fileExtension
			});
			img = image;
			dispatch('imageGenerated', { image });
			isImageLoading = false;
		} catch (e) {
			console.error(e);
		}
	}

	async function createGif() {
		isImageLoading = true;
		currentResultTab = 'gif';
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
			img = gif;
			isImageLoading = false;
		} catch (e) {
			console.error(e);
		}
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'Copied to clipboard !!', type: 'success', duration: 1500 });
		});
	}
</script>

<section class="w-full">
	<div class="flex flex-col lg:flex-row min-h-[500px] lg:h-[520px] overflow-hidden bg-white">
		<!-- Code Editor Panel -->
		<div
			class="w-full lg:w-1/2 flex flex-col border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black"
		>
			<!-- Tab Bar -->
			<div class="flex bg-[#1a1a2e] px-4 py-3">
				<button
					on:click={() => (currentTab = 'html')}
					class="px-5 py-2 text-sm font-black uppercase tracking-wider transition-all border-[2px] {currentTab ===
					'html'
						? 'bg-white text-black border-black shadow-[3px_3px_0_0_#ff6b6b]'
						: 'bg-transparent text-gray-400 border-transparent hover:text-white hover:border-gray-600'}"
				>
					HTML
				</button>
				<button
					on:click={() => (currentTab = 'css')}
					class="ml-2 px-5 py-2 text-sm font-black uppercase tracking-wider transition-all border-[2px] {currentTab ===
					'css'
						? 'bg-white text-black border-black shadow-[3px_3px_0_0_#ffc480]'
						: 'bg-transparent text-gray-400 border-transparent hover:text-white hover:border-gray-600'}"
				>
					CSS
				</button>
			</div>
			<!-- Code Area -->
			<div class="flex-1 overflow-auto bg-[#fafafa]">
				{#if currentTab === 'html'}
					<CodeMirror
						bind:codeHTML
						value={codeHTML}
						lang={html({
							selfClosingTags: true
						})}
						on:change={(e) => {
							codeHTML = e.detail;
							updateIframe();
						}}
						styles={{
							'&': {
								height: '100%',
								minHeight: '450px',
								fontSize: '13px'
							}
						}}
					/>
				{:else if currentTab === 'css'}
					<CodeMirror
						bind:code={codeCSS}
						value={codeCSS}
						lang={css()}
						on:change={(e) => {
							codeCSS = `${e.detail}`;
							updateIframe();
						}}
						styles={{
							'&': {
								height: '100%',
								minHeight: '450px',
								fontSize: '13px'
							}
						}}
					/>
				{/if}
			</div>
		</div>

		<!-- Preview Panel -->
		<div class="w-full lg:w-1/2 flex flex-col bg-white">
			<!-- Preview Header -->
			<div class="flex bg-[#1a1a2e] px-4 py-3 justify-between items-center">
				{#if isPreviewEnabled}
					<div class="flex items-center gap-3">
						<button
							on:click={() => (currentResultTab = 'preview')}
							class="px-4 py-2 text-sm font-bold uppercase tracking-wide transition-all border-[2px] {currentResultTab ===
							'preview'
								? 'bg-[#4ade80] text-black border-black'
								: 'bg-transparent text-gray-400 border-transparent hover:text-white'}"
						>
							Preview
						</button>
						<div class="relative">
							<div class="absolute -top-1 -right-1 z-10">
								<span class="flex h-2 w-2">
									<span
										class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6b6b] opacity-75"
									/>
									<span class="relative inline-flex rounded-full h-2 w-2 bg-[#ff6b6b]" />
								</span>
							</div>
							<button
								on:click={() => {
									createImage();
								}}
								class="bg-[#ff6b6b] hover:bg-[#ff5252] text-white px-4 py-2 text-sm font-bold uppercase tracking-wide flex items-center gap-2 transition-colors border-[2px] border-black shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								Image
							</button>
						</div>
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
				{/if}
				{#if !isPreviewEnabled}
					<div class="flex items-center gap-4">
						<span class="text-gray-400 text-sm font-bold uppercase tracking-wider"
							>Live Preview</span
						>
					</div>
				{/if}
			</div>

			{#if currentResultTab === 'preview'}
				<div class="flex-1 flex flex-col min-h-[450px]">
					<!-- Size Controls -->
					{#if previewFrame}
						<div
							class="flex flex-wrap gap-3 justify-between items-center px-3 py-2 bg-gray-50 border-b border-gray-200"
						>
							<div class="flex items-center gap-2">
								<span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider"
									>Scale</span
								>
								<input
									type="number"
									class="w-12 px-1.5 py-0.5 border border-gray-300 text-xs font-medium text-center bg-white focus:outline-none focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b]"
									value="1"
									min="0.1"
									max="2"
									step="0.1"
									on:input={(e) => {
										updateScale(e.target.value);
									}}
								/>
							</div>
							<div class="flex items-center gap-1.5">
								<span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider"
									>Size</span
								>
								<input
									type="number"
									class="w-14 px-1.5 py-0.5 border border-gray-300 text-xs font-medium text-center bg-white focus:outline-none focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b]"
									value={previewWidth}
									min="100"
									max="800"
									on:input={(e) => {
										previewFrame.style.width = `${e.target.value}px`;
									}}
								/>
								<span class="text-gray-300 text-xs">×</span>
								<input
									type="number"
									class="w-14 px-1.5 py-0.5 border border-gray-300 text-xs font-medium text-center bg-white focus:outline-none focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b]"
									value={previewHeight}
									min="100"
									max="600"
									on:input={(e) => {
										previewFrame.style.height = `${e.target.value}px`;
									}}
								/>
							</div>
						</div>
					{/if}
					<!-- Preview Frame -->
					<div bind:this={iframeContainer} class="flex-1 overflow-auto bg-white">
						<iframe
							class="w-full h-full min-h-[400px] bg-white"
							title="code-preview"
							srcdoc={getSrcDoc()}
							bind:this={previewFrame}
						/>
					</div>
				</div>
			{:else if currentResultTab === 'image' || currentResultTab === 'gif'}
				{#if isImageLoading}
					<div class="flex flex-col justify-center items-center flex-1 min-h-[400px] bg-gray-50">
						<Loader size="16" show={isImageLoading} />
						<p class="mt-4 text-sm font-bold text-gray-500 uppercase tracking-wider">
							Generating {currentResultTab}...
						</p>
					</div>
				{:else}
					<div class="flex flex-col flex-1">
						<!-- Success Bar -->
						<div
							class="flex flex-col sm:flex-row gap-2 justify-between items-center px-3 py-2 bg-[#4ade80] border-b border-green-500"
						>
							<div class="flex items-center gap-2">
								<svg
									class="w-4 h-4 text-green-800"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<span class="text-xs font-bold text-green-800 uppercase tracking-wide"
									>Generated!</span
								>
							</div>
							<div class="flex items-center gap-2">
								<a
									href={img.url}
									class="text-xs font-bold text-green-800 hover:underline"
									target="_blank">Open in tab →</a
								>
								<button
									on:click={() => {
										copyToClipboard(img.url);
									}}
									class="text-xs bg-green-800 text-white py-1 px-2.5 font-bold uppercase flex items-center gap-1.5 hover:bg-green-900 transition-colors rounded-sm"
								>
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
										/>
									</svg>
									Copy URL
								</button>
							</div>
						</div>
						<!-- Image Output -->
						<div class="flex-1 overflow-auto bg-white">
							<img src={img.url} alt="Generated output" class="w-full h-auto" />
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</section>
<Toast />
