<script>
	import { onMount } from 'svelte';
	import grapesjs from 'grapesjs';
	import addHTMLEdit from './html-edit';
	import initConfig from './editor-config';
	import initPanel from './panel';
	import initBlock from './block';
	import initCommands from './command';
	import { addFonts } from './style-sheet';
	import { editor } from '../../../store/editor.store';
	import initPageConfig from './page';

	import 'grapesjs/dist/css/grapes.min.css';

	let editorInstance = null;

	export let isLandingPage = true;

	let isMobile = false;

	onMount(() => {
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

		if(isMobile){
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
	<img clas=""src="https://res.cloudinary.com/diroilukd/image/upload/v1702834796/click-here_bjp33s.png"/>
	</div>
	<div class="min-w-300 min-h-300">
		<div id="gjs" />
	</div>
</section>

<style>
</style>
