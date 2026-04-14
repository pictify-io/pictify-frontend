<script>
	/**
	 * Read-only CodeMirror viewer for an API code snippet.
	 * Automatic syntax highlighting via @codemirror/lang-* packs + oneDark theme.
	 *
	 * Props:
	 *  - code: string — the snippet source
	 *  - lang: 'shell' | 'javascript' | 'python' — hints which language extension to load
	 */
	import { onMount, onDestroy } from 'svelte';
	import { EditorView } from '@codemirror/view';
	import { EditorState, Compartment } from '@codemirror/state';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { json } from '@codemirror/lang-json';
	import { html as htmlLang } from '@codemirror/lang-html';
	import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

	export let code = '';
	export let lang = 'shell';

	let host;
	let view;
	const langCompartment = new Compartment();

	// Only `json` / `html` are installed — JSON covers the payload body which is the
	// most visually meaningful part of every snippet. Other languages degrade to
	// plain-but-themed text (still better than unhighlighted plain text).
	function extensionForLang() {
		if (lang === 'javascript' || lang === 'python' || lang === 'shell') return json();
		return htmlLang();
	}

	onMount(() => {
		view = new EditorView({
			state: EditorState.create({
				doc: code,
				extensions: [
					EditorView.editable.of(false),
					EditorState.readOnly.of(true),
					langCompartment.of(extensionForLang()),
					syntaxHighlighting(defaultHighlightStyle),
					oneDark,
					EditorView.theme({
						'&': { fontSize: '13px', background: 'transparent' },
						'.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
						'.cm-gutters': { display: 'none' },
						'.cm-content': { padding: '0' },
						'&.cm-editor': { background: 'transparent' }
					})
				]
			}),
			parent: host
		});
	});

	onDestroy(() => {
		view?.destroy();
	});

	// React to code / lang changes by dispatching into the existing editor.
	$: if (view && code !== undefined) {
		const current = view.state.doc.toString();
		if (current !== code) {
			view.dispatch({ changes: { from: 0, to: current.length, insert: code } });
		}
	}
	$: if (view && lang) {
		view.dispatch({ effects: langCompartment.reconfigure(extensionForLang()) });
	}
</script>

<div bind:this={host} class="cm-snippet"></div>

<style>
	.cm-snippet :global(.cm-editor) {
		background: transparent;
	}
	.cm-snippet :global(.cm-editor .cm-scroller) {
		min-height: 0;
	}
</style>
