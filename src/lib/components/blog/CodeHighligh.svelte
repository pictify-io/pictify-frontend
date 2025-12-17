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
	import python from 'refractor/lang/python.js';

	import { toHtml } from 'hast-util-to-html';

	refractor.register(javascript);
	refractor.register(css);
	refractor.register(bash);
	refractor.register(json);
	refractor.register(markdown);
	refractor.register(python);

	let highlightedHtml = '';

	onMount(() => {
		try {
			highlightedHtml = refractor.highlight(text, lang);
			highlightedHtml = toHtml(highlightedHtml);
		} catch (e) {
			// Fallback if language not found or error
			highlightedHtml = text;
		}
	});
</script>

<div class="code-block-container">
	<div class="code-header">
		<div class="traffic-lights">
			<div class="dot red"></div>
			<div class="dot yellow"></div>
			<div class="dot green"></div>
		</div>
		<span class="lang-label">{lang || 'CODE'}</span>
	</div>
	<div class="code-content">
		<pre><code>{@html highlightedHtml}</code></pre>
	</div>
</div>

<style>
	.code-block-container {
		margin: 2rem 0;
		border-radius: 12px;
		border: 3px solid #111827;
		box-shadow: 8px 8px 0 0 #1f2937;
		overflow: hidden;
		background: #1a1b26;
	}

	.code-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: #111827;
		border-bottom: 3px solid #111827;
	}

	.traffic-lights {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 1px solid rgba(0,0,0,0.3);
	}

	.dot.red { background: #ff6b6b; }
	.dot.yellow { background: #ffc480; }
	.dot.green { background: #4ade80; }

	.lang-label {
		font-size: 11px;
		font-weight: 700;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.code-content {
		padding: 20px;
		overflow-x: auto;
	}

	.code-content pre {
		margin: 0;
		padding: 0;
		background: transparent !important;
		border: none !important;
		box-shadow: none !important;
	}

	.code-content code {
		font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
		font-size: 14px;
		line-height: 1.6;
		color: #e2e8f0;
		white-space: pre;
		display: block;
	}

	/* Syntax highlighting colors */
	:global(.code-content .token.comment),
	:global(.code-content .token.prolog),
	:global(.code-content .token.doctype),
	:global(.code-content .token.cdata) {
		color: #6b7280;
	}

	:global(.code-content .token.punctuation) {
		color: #9ca3af;
	}

	:global(.code-content .token.property),
	:global(.code-content .token.tag),
	:global(.code-content .token.boolean),
	:global(.code-content .token.number),
	:global(.code-content .token.constant),
	:global(.code-content .token.symbol) {
		color: #f472b6;
	}

	:global(.code-content .token.selector),
	:global(.code-content .token.attr-name),
	:global(.code-content .token.string),
	:global(.code-content .token.char),
	:global(.code-content .token.builtin) {
		color: #4ade80;
	}

	:global(.code-content .token.operator),
	:global(.code-content .token.entity),
	:global(.code-content .token.url),
	:global(.code-content .token.variable) {
		color: #fbbf24;
	}

	:global(.code-content .token.atrule),
	:global(.code-content .token.attr-value),
	:global(.code-content .token.function),
	:global(.code-content .token.class-name) {
		color: #60a5fa;
	}

	:global(.code-content .token.keyword) {
		color: #c084fc;
	}

	:global(.code-content .token.regex),
	:global(.code-content .token.important) {
		color: #fb923c;
	}
</style>
