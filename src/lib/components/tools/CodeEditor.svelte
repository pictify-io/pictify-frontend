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

	let codeWidth = '38vw';
	let currentTab = 'html';
	let currentResultTab = 'preview';
	let previewFrame;
	let iframeContainer;
	let isImageLoading = false;
	let img;
	let previewWidth = 600;
	let previewHeight = 400;

	onMount(async () => {
		if (window.innerWidth < 768) {
			codeWidth = undefined;
		}
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
				height
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

<section>
	<div
		class="flex flex-col md:flex-row border-black border-4 w-[76vw] md:min-h-[400px] xl:h-[500px] max-w-[1200px]"
	>
		<div class="flex-1">
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
							width: codeWidth,
							maxHeight: '440px',
							minHeight: '440px',
							maxWidth: '600px'
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
							width: codeWidth,
							maxHeight: '440px',
							minHeight: '440px',
							maxWidth: '600px'
						}
					}}
				/>
			{/if}
		</div>
		<div class="md:border-l-2 flex-1">
			<div class="flex bg-black p-2">
				<button
					on:click={() => (currentResultTab = 'preview')}
					class="px-4 py-2 rounded text-sm {currentResultTab === 'preview'
						? 'bg-white text-black'
						: 'bg-gray-500 text-white'}">Preview</button
				>
				<button
					on:click={() => {
						createImage();
					}}
					class="mx-4 px-4 py-2 rounded text-sm {currentResultTab === 'image'
						? 'bg-white text-black'
						: 'bg-gray-500 text-white'}">Image</button
				>
				{#if isGifEnabled}
					<button
						on:click={() => {
							createGif();
						}}
						class="mx-2 px-6 py-2 rounded text-sm {currentResultTab === 'gif'
							? 'bg-white text-black'
							: 'bg-gray-500 text-white'}">Gif</button
					>
				{/if}
			</div>
			{#if currentResultTab === 'preview'}
				<div class="overflow-auto">
					{#if previewFrame}
						<div class="flex gap-4 justify-center items-center p-2 bg-gray-200">
							<div>
								<label for="scale" class="text-sm">scale</label>
								<input
									type="number"
									class=" border-black border-b-2 text-sm bg-gray-200 ml-1 text-center"
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
							<div>
								<input
									type="number"
									class=" border-black border-b-2 text-sm bg-gray-200 text-center"
									value={parseInt(getComputedStyle(previewFrame).width.replace('px', ''))}
									min="100"
									max="800"
									on:input={(e) => {
										previewFrame.style.width = `${e.target.value}px`;
									}}
								/>
							</div>
							<div class="text-m">X</div>
							<div>
								<input
									type="number"
									class="border-black border-b-2 text-sm bg-gray-200 text-center"
									value={parseInt(getComputedStyle(previewFrame).height.replace('px', ''))}
									min="100"
									max="600"
									on:input={(e) => {
										previewFrame.style.height = `${e.target.value}px`;
									}}
								/>
							</div>
						</div>
					{/if}
					<div bind:this={iframeContainer}>
						<iframe
							class="w-full min-h-[400px] max-h-[600px]"
							title="code-preview"
							srcdoc={getSrcDoc()}
							bind:this={previewFrame}
						/>
					</div>
				</div>
			{:else if currentResultTab === 'image'}
				{#if isImageLoading}
					<div class="flex justify-center items-center min-h-[400px] max-h-[600px]">
						<Loader size="16" show={isImageLoading} />
					</div>
				{:else}
					<div class="flex flex-col md:flex-row gap-2 justify-center items-center p-2 bg-gray-200">
						<div>
							<a href={img.url} class="text-xs text-black px-2 py-1">{img.url}</a>
						</div>
						<div>
							<button
								on:click={() => {
									copyToClipboard(img.url);
								}}
								class="text-xs bg-black hover:bg-black text-white py-1 px-2 rounded"
							>
								<div class="flex justify-between items-center">
									<div>Copy URL</div>
								</div>
							</button>
						</div>
					</div>
					<img src={img.url} alt="html-output" class="w-full" />
				{/if}
			{:else if currentResultTab === 'gif'}
				{#if isImageLoading}
					<div class="flex justify-center items-center min-h-[400px] max-h-[600px]">
						<Loader size="16" show={isImageLoading} />
					</div>
				{:else}
					<div class="flex flex-col md:flex-row gap-2 justify-center items-center p-2 bg-gray-200">
						<div>
							<a href={img.url} class="text-xs text-black px-2 py-1">{img.url}</a>
						</div>
						<div>
							<button
								on:click={() => {
									copyToClipboard(img.url);
								}}
								class="text-xs bg-black hover:bg-black text-white py-1 px-2 rounded"
							>
								<div class="flex justify-between items-center">
									<div>Copy URL</div>
								</div>
							</button>
						</div>
					</div>
					<img src={img.url} alt="html-output" class="w-full" />
				{/if}
			{/if}
		</div>
	</div>
</section>
<Toast />
