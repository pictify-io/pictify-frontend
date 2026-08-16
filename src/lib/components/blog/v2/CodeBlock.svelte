<script>
	/**
	 * Code in the press theme.
	 *
	 * Replaces the macOS-window treatment (traffic lights, 3px ink border,
	 * offset shadow). Those dots said "this is a screenshot of an app"; a
	 * snippet in a guide is something you copy, so the chrome now carries the
	 * language and a copy affordance and nothing else.
	 *
	 * Colours come from press-highlight.js, the same palette as the studio's
	 * editor and the Use it snippets. A curl command looks identical wherever
	 * the product shows it to you.
	 *
	 * Highlighting stays client-side: refractor is ~40KB of grammars and the
	 * body is already server-rendered, so a reader on a slow connection gets
	 * legible unhighlighted code immediately and colour when it arrives. SSR
	 * highlighting is the better end state and is noted as such.
	 */
	import { onMount } from 'svelte';
	import { PRESS } from '$lib/utils/press-highlight.js';

	export let lang = '';
	export let text = '';

	let highlighted = '';
	let copied = false;
	let copyFailed = false;

	onMount(async () => {
		try {
			const [{ refractor }, { toHtml }] = await Promise.all([
				import('refractor'),
				import('hast-util-to-html')
			]);
			const grammars = {
				javascript: () => import('refractor/lang/javascript.js'),
				js: () => import('refractor/lang/javascript.js'),
				typescript: () => import('refractor/lang/typescript.js'),
				ts: () => import('refractor/lang/typescript.js'),
				jsx: () => import('refractor/lang/jsx.js'),
				css: () => import('refractor/lang/css.js'),
				bash: () => import('refractor/lang/bash.js'),
				shell: () => import('refractor/lang/bash.js'),
				sh: () => import('refractor/lang/bash.js'),
				json: () => import('refractor/lang/json.js'),
				markdown: () => import('refractor/lang/markdown.js'),
				md: () => import('refractor/lang/markdown.js'),
				python: () => import('refractor/lang/python.js'),
				py: () => import('refractor/lang/python.js'),
				html: () => import('refractor/lang/markup.js'),
				xml: () => import('refractor/lang/markup.js'),
				php: () => import('refractor/lang/php.js'),
				ruby: () => import('refractor/lang/ruby.js'),
				go: () => import('refractor/lang/go.js'),
				sql: () => import('refractor/lang/sql.js'),
				yaml: () => import('refractor/lang/yaml.js')
			};
			const key = String(lang || '').toLowerCase();
			const load = grammars[key];
			if (!load) return; // Unknown language stays plain. Never a crash.
			const mod = await load();
			refractor.register(mod.default || mod);
			highlighted = toHtml(refractor.highlight(text, key));
		} catch (error) {
			// Plain text is a perfectly good code block.
			highlighted = '';
		}
	});

	async function copy() {
		copyFailed = false;
		try {
			// The wrapper is not optional here: a page served over http, or a
			// browser that refuses the permission, returns a rejected promise and
			// the chip would otherwise say Copied while the clipboard is empty.
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch (error) {
			copyFailed = true;
			setTimeout(() => (copyFailed = false), 2400);
		}
	}
</script>

<figure class="my-8 overflow-hidden rounded-tile" style="background: {PRESS.bg}">
	<figcaption
		class="flex items-center justify-between border-b border-white/10 px-4 py-2.5"
		style="background: rgba(255,255,255,0.03)"
	>
		<span class="font-mono text-[11px] uppercase tracking-[0.1em]" style="color: {PRESS.text}">
			{lang || 'code'}
		</span>
		<button
			type="button"
			on:click={copy}
			class="rounded-btn border border-white/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors hover:border-white/40"
			style="color: {copyFailed ? '#FF8A7A' : copied ? PRESS.string : PRESS.text}"
		>
			{copyFailed ? "Couldn't copy" : copied ? 'Copied' : 'Copy'}
		</button>
	</figcaption>
	<div class="overflow-x-auto px-4 py-4">
		<pre class="m-0 bg-transparent p-0"><code
				class="block whitespace-pre font-mono text-[13.5px] leading-[22px]"
				style="color: {PRESS.text}">{#if highlighted}{@html highlighted}{:else}{text}{/if}</code
			></pre>
	</div>
</figure>

<style>
	/*
	 * Prism token classes, mapped onto the press palette. Global because the
	 * markup arrives as an HTML string from refractor, outside Svelte's scoping.
	 * Values are literals for the same reason press-highlight.js uses them:
	 * these run where Tailwind cannot reach.
	 */
	figure :global(.token.comment),
	figure :global(.token.prolog),
	figure :global(.token.doctype),
	figure :global(.token.cdata) {
		color: rgba(173, 185, 198, 0.45);
		font-style: italic;
	}
	figure :global(.token.punctuation) {
		color: #adb9c6;
	}
	figure :global(.token.property),
	figure :global(.token.tag),
	figure :global(.token.symbol),
	figure :global(.token.deleted) {
		color: #a9d7f2;
	}
	figure :global(.token.boolean),
	figure :global(.token.number),
	figure :global(.token.constant) {
		color: #ffd3e8;
	}
	figure :global(.token.selector),
	figure :global(.token.attr-name),
	figure :global(.token.string),
	figure :global(.token.char),
	figure :global(.token.builtin),
	figure :global(.token.inserted) {
		color: #d8f34a;
	}
	figure :global(.token.operator),
	figure :global(.token.entity),
	figure :global(.token.url),
	figure :global(.token.variable) {
		color: #adb9c6;
	}
	figure :global(.token.atrule),
	figure :global(.token.attr-value),
	figure :global(.token.function),
	figure :global(.token.class-name) {
		color: #a9d7f2;
	}
	figure :global(.token.keyword) {
		color: #a9d7f2;
		font-weight: 500;
	}
	figure :global(.token.regex),
	figure :global(.token.important) {
		color: #ff48b0;
	}
</style>
