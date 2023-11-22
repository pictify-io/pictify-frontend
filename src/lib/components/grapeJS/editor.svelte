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

	onMount(() => {
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

<section class="hidden md:block flex-col justify-center items-center mx-auto py-10">
	<div class="min-w-300 min-h-300">
		<div id="gjs" />
	</div>
</section>

<style>
</style>
