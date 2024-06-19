<script>
	import { onMount } from 'svelte';
	import { editor } from '../../../store/editor.store';


	import 'grapesjs/dist/css/grapes.min.css';

	let editorInstance = null;
	let isGrapesJSLoaded = false;

	export let isLandingPage = true;

	let isMobile = false;

	onMount(async () => {
	const { default: grapesjs } = await import('grapesjs');
	isGrapesJSLoaded = true;
  const { default: addHTMLEdit } = await import('./html-edit');
  const { default: initConfig } = await import('./editor-config');
  const { default: initPanel } = await import('./panel');
  const { default: initBlock } = await import('./block');
  const { default: initCommands } = await import('./command');
  const { addFonts } = await import('./style-sheet');
  const { default: initPageConfig } = await import('./page');

		if (window.innerWidth < 768) {
			isMobile = true;
		}
		if (!isLandingPage) {
			initConfig.pageManager = {
				pages: [
					{
						component: `<div style="text-align:center"> <h1> Edit this template </h1> </div>`
					}
				]
			};
		} else {
			initConfig.pageManager = {
				pages: [initPageConfig]
			};
		}

		if (isMobile) {
			initConfig.width = window.innerWidth - 20 + 'px';
			initConfig.height = '250px';
			initConfig.panels = { defaults: [] };
			initConfig.showDevices = 0;
			initConfig.canvas.style = {
				width: '100%'
			};
		}
		editorInstance = grapesjs.init(initConfig);

		addHTMLEdit(editorInstance);
		if (isLandingPage) {
			initCommands(editorInstance);
			initPanel(editorInstance);
		}
		initBlock(editorInstance);
		addFonts(editorInstance);
		editor.set(editorInstance);

	});
</script>

<section class="my-10 md:block flex-col justify-center items-center mx-auto py-10 sm:my-0">
	<div class="w-32 sm:w-48 lg:translate-x-[-50px]">
		{#if isLandingPage && isGrapesJSLoaded}
			<img
				alt="click here"
				clas=""
				src="https://res.cloudinary.com/diroilukd/image/upload/v1702834796/click-here_bjp33s.png"
			/>
		{/if}
	</div>
	{#if isGrapesJSLoaded}
	<div class="min-w-300 min-h-300">
		<div id="gjs" />
	</div>
	{:else}
		<div class="w-[250px] h-[250px] sm:w-[1000px] sm:h-[500px]">
		</div>
	{/if}
</section>

<style>
</style>
