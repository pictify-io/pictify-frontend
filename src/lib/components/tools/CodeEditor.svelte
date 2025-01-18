<script>
	import { onMount } from 'svelte';
	import CodeMirror from 'svelte-codemirror-editor';
	import { html } from '@codemirror/lang-html';
	import { css } from '@codemirror/lang-css';
	import { createImagePublic, createGifPublic } from '../../../api/image.js';
	import Loader from '$lib/components/Loader.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '../../../store/toast.store';

	export let isGifEnabled = false;
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
			toast.set({ message: 'Copied to clipboard !!', duration: 1500 });
		});
	}
</script>

<section class="w-full">
	<div class="flex flex-col md:flex-row border-black border-4 md:min-h-[400px] xl:h-[500px] max-w-[1200px] mx-auto">
		<div class="w-full md:w-1/2 flex flex-col">
			<div class="flex bg-black p-2">
				<button
					on:click={() => (currentTab = 'html')}
					class="px-4 py-2 rounded text-sm {currentTab === 'html'
						? 'bg-white text-black'
						: 'bg-gray-500 text-white'}">HTML</button
				>
				<button
					on:click={() => (currentTab = 'css')}
					class="mx-4 px-4 py-2 rounded text-sm {currentTab === 'css'
						? 'bg-white text-black'
						: 'bg-gray-500 text-white'}">CSS</button
				>
			</div>
			<div class="flex-1 overflow-auto">
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
								minHeight: '400px'
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
								minHeight: '400px'
							}
						}}
					/>
				{/if}
			</div>
		</div>
		<div class="w-full md:w-1/2 flex flex-col border-t-4 md:border-t-0 md:border-l-4 border-black">
			<div class="flex bg-black p-2 justify-between items-center">
				<div class="flex items-center gap-4">
					<button
						on:click={() => (currentResultTab = 'preview')}
						class="px-4 py-2 rounded text-sm {currentResultTab === 'preview'
							? 'bg-white text-black'
							: 'bg-gray-500 text-white'}">Preview</button
					>
					<div class="relative">
						<div class="absolute -top-1 -right-1">
							<span class="flex h-2 w-2">
								<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6b6b] opacity-75"></span>
								<span class="relative inline-flex rounded-full h-2 w-2 bg-[#ff6b6b]"></span>
							</span>
						</div>
						<button
							on:click={() => {
								createImage();
							}}
							class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2 transition-colors"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							Generate Image
						</button>
					</div>
					{#if isGifEnabled}
						<button
							on:click={() => {
								createGif();
							}}
							class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors flex items-center gap-2">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
							Create GIF
						</button>
					{/if}
				</div>
			</div>
			{#if currentResultTab === 'preview'}
				<div class="flex-1 flex flex-col">
					{#if previewFrame}
						<div class="flex gap-4 justify-center items-center p-2 bg-gray-100 border-b border-gray-200">
							<div>
								<label for="scale" class="text-sm text-gray-600">Scale</label>
								<input
									type="number"
									class="w-16 border-b-2 border-gray-300 focus:border-[#ff6b6b] text-sm bg-transparent ml-1 text-center outline-none"
									value="1"
									min="0.1"
									max="2"
									step="0.1"
									on:input={(e) => {
										updateScale(e.target.value);
									}}
								/>
							</div>
							<div class="flex-grow" />
							<div class="flex items-center gap-2">
								<span class="text-sm text-gray-600">Size</span>
								<input
									type="number"
									class="w-20 border-b-2 border-gray-300 focus:border-[#ff6b6b] text-sm bg-transparent text-center outline-none"
									value={previewWidth}
									min="100"
									max="800"
									on:input={(e) => {
										previewFrame.style.width = `${e.target.value}px`;
									}}
								/>
								<span class="text-gray-400">×</span>
								<input
									type="number"
									class="w-20 border-b-2 border-gray-300 focus:border-[#ff6b6b] text-sm bg-transparent text-center outline-none"
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
					<div bind:this={iframeContainer} class="flex-1 overflow-auto">
						<iframe
							class="w-full h-[400px] bg-white"
							title="code-preview"
							srcdoc={getSrcDoc()}
							bind:this={previewFrame}
						/>
					</div>
				</div>
			{:else if currentResultTab === 'image' || currentResultTab === 'gif'}
				{#if isImageLoading}
					<div class="flex flex-col justify-center items-center min-h-[400px] bg-gray-50">
						<Loader size="16" show={isImageLoading} />
						<p class="mt-4 text-sm text-gray-600">Generating your {currentResultTab}...</p>
					</div>
				{:else}
					<div class="flex flex-col flex-1">
						<div class="flex flex-col md:flex-row gap-2 justify-between items-center p-3 bg-gray-100 border-b border-gray-200">
							<div class="flex items-center gap-2">
								<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-sm text-gray-900">Generated successfully!</span>
							</div>
							<div class="flex items-center gap-3">
								<a href={img.url} class="text-xs text-[#ff6b6b] hover:underline" target="_blank">Open in new tab →</a>
								<button
									on:click={() => {
										copyToClipboard(img.url);
									}}
									class="text-xs bg-black hover:bg-gray-800 text-white py-1.5 px-3 rounded flex items-center gap-2 transition-colors"
								>
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
									</svg>
									Copy URL
								</button>
							</div>
						</div>
						<div class="flex-1 overflow-auto">
							<img src={img.url} alt="Generated output" class="w-full h-auto" />
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</section>
<Toast />
