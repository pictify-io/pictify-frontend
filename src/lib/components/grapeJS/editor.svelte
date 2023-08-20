<script>
	import { onMount } from 'svelte';
	import grapesjs from 'grapesjs';
	import addHTMLEdit from './html-edit';
	import initConfig from './editor-config';
	import initPanel from './panel';
	import initBlock from './block';
	import {addFonts} from './style-sheet';

	import 'grapesjs/dist/css/grapes.min.css';

	let editor;

	onMount(() => {
		editor = grapesjs.init(initConfig);
		addHTMLEdit(editor);
		initPanel(editor);
		initBlock(editor);
		addFonts(editor);
	});
</script>

<section class="flex-col justify-center items-center mx-auto py-10">
	<div class="min-w-300 min-h-300">
		<div id="gjs" />
	</div>
</section>

<style>
</style>
