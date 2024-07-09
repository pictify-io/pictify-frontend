<!-- CodeBlock.svelte -->
<script>
	export let lang;
	export let text;

	import { onMount } from 'svelte';
	import { refractor } from 'refractor';
	import javascript from 'refractor/lang/javascript.js';
	import css from 'refractor/lang/css.js';
	import bash from 'refractor/lang/bash.js';
	import json from 'refractor/lang/json.js';
	import markdown from 'refractor/lang/markdown.js';
	import 'prismjs/themes/prism.css';

	import { toHtml } from 'hast-util-to-html';

	refractor.register(javascript);
	refractor.register(css);
	refractor.register(bash);
	refractor.register(json);
	refractor.register(markdown);

	let highlightedHtml = '';

	onMount(() => {
		highlightedHtml = refractor.highlight(text, lang);
		highlightedHtml = toHtml(highlightedHtml);
		console.log(highlightedHtml);
	});
</script>

<pre>
  {@html highlightedHtml}
</pre>
