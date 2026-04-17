<script>
	/**
	 * HtmlEditor — CodeMirror 6 wrapper with Handlebars-aware editing.
	 *
	 * Signature detail (design spec): every `{{var}}` token renders in the
	 * brand handlebars color with a 2px #ffc480 underline. The one visual
	 * thing users will screenshot.
	 *
	 * Responsibilities:
	 *   - Bind `value` two-way so parent components (HtmlEditorLayout)
	 *     can persist.
	 *   - Offer variable + helper autocomplete on `{{`.
	 *   - Surface compile errors as inline squiggles + gutter markers by
	 *     re-parsing via Handlebars.parse on every change.
	 *   - Emit `variableReferences` on change so the Variables panel can
	 *     auto-add undeclared identifiers.
	 *
	 * Keyboard contract:
	 *   - Tab inserts 2 spaces (developer expectation).
	 *   - Cmd/Ctrl+S triggers `save` event (parent wires to save handler).
	 *   - Escape + Shift+Tab leaves the editor buffer (accessibility).
	 */
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { EditorState, Compartment } from '@codemirror/state';
	import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
	import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
	import { html as htmlLang } from '@codemirror/lang-html';
	import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
	import { tags as t } from '@lezer/highlight';
	import Handlebars from 'handlebars';
	import {
		handlebarsHighlight,
		handlebarsTheme,
		handlebarsAutocomplete,
		handlebarsLinter
	} from '../../../utils/handlebars-autocomplete';

	/** @type {string} */
	export let value = '';
	/** @type {Array<{name: string}>} */
	export let variableDefinitions = [];
	/** @type {string[]} helper names that the backend exposes */
	export let safelistedHelpers = [];

	const dispatch = createEventDispatcher();

	let container;
	let view;

	// External (parent-owned) state read by the autocomplete + linter. We
	// wrap in getter fns so extensions always see the latest values
	// without tearing down the view on every prop change.
	let _variableNames = variableDefinitions.map((v) => v && v.name).filter(Boolean);
	let _helpers = safelistedHelpers;
	let _compileErrors = [];

	$: _variableNames = variableDefinitions.map((v) => v && v.name).filter(Boolean);
	$: _helpers = safelistedHelpers;

	// Re-parse on value change. Handlebars.parse throws on syntax errors with
	// a message that contains the line number — we extract it for the linter.
	const recomputeCompileErrors = (src) => {
		try {
			Handlebars.parse(src || '');
			_compileErrors = [];
		} catch (err) {
			const match = /line (\d+)/i.exec(err.message || '');
			_compileErrors = [
				{
					line: match ? parseInt(match[1], 10) : 1,
					message: err.message || 'Handlebars compile error'
				}
			];
		}
	};

	// Extract identifiers used by the template so parent auto-add logic can
	// fire without a round-trip to the server on every keystroke.
	//
	// Tracks Handlebars `as |name|` block params and never emits them as
	// candidates for auto-add (server-side lib/html-ast.js does the same;
	// keeping parity avoids spurious Variables-panel entries like `item`
	// appearing when the user writes `{{#each items as |item|}}`).
	const emitVariableReferences = (src) => {
		try {
			const ast = Handlebars.parse(src || '');
			const ids = new Set();
			const BUILTINS = new Set(['if', 'unless', 'each', 'with', 'lookup', 'log', 'this', 'else']);

			const walk = (node, scope) => {
				if (!node) return;
				const currentScope = scope || new Set();

				// Identifier head: collect unless it's a data-ref (@root/@index),
				// a builtin, a block-local, or `this`.
				if (node.type === 'PathExpression' && !node.data && node.parts && node.parts[0]) {
					const head = node.parts[0];
					if (!BUILTINS.has(head) && !currentScope.has(head) && head !== 'this') {
						ids.add(head);
					}
				}

				// BlockStatement introduces a new scope with `as |x|` block params.
				if (node.type === 'BlockStatement') {
					const nextScope = new Set(currentScope);
					if (node.program && Array.isArray(node.program.blockParams)) {
						for (const p of node.program.blockParams) nextScope.add(p);
					}
					// Block subject + hash live at outer scope.
					if (node.params) node.params.forEach((p) => walk(p, currentScope));
					if (node.hash && node.hash.pairs) {
						node.hash.pairs.forEach((h) => walk(h.value, currentScope));
					}
					// Body runs under the block's scope.
					if (node.program && node.program.body) {
						node.program.body.forEach((s) => walk(s, nextScope));
					}
					if (node.inverse && node.inverse.body) {
						node.inverse.body.forEach((s) => walk(s, currentScope));
					}
					return;
				}

				if (node.body) node.body.forEach((s) => walk(s, currentScope));
				if (node.program) walk(node.program, currentScope);
				if (node.inverse) walk(node.inverse, currentScope);
				if (node.params) node.params.forEach((p) => walk(p, currentScope));
				if (node.path) walk(node.path, currentScope);
				if (node.hash && node.hash.pairs) {
					node.hash.pairs.forEach((h) => walk(h.value, currentScope));
				}
			};
			walk(ast, new Set());
			dispatch('referencesChange', { identifiers: Array.from(ids) });
		} catch {
			/* ignored — parse errors are surfaced via the linter */
		}
	};

	// A minimal, paper-toned syntax highlight that matches the neobrutalist
	// palette (dark gray ink on cream, no oceanic blues).
	const paperHighlight = HighlightStyle.define([
		{ tag: [t.tagName, t.documentMeta], color: '#1f2937', fontWeight: '600' },
		{ tag: t.attributeName, color: '#6b4226' },
		{ tag: [t.attributeValue, t.string], color: '#5c3a1f' },
		{ tag: t.comment, color: '#9ca3af', fontStyle: 'italic' },
		{ tag: t.angleBracket, color: '#374151' }
	]);

	onMount(() => {
		const saveKey = {
			key: 'Mod-s',
			preventDefault: true,
			run: () => {
				dispatch('save');
				return true;
			}
		};

		recomputeCompileErrors(value);
		emitVariableReferences(value);

		const updateListener = EditorView.updateListener.of((v) => {
			if (v.docChanged) {
				const next = v.state.doc.toString();
				value = next;
				recomputeCompileErrors(next);
				emitVariableReferences(next);
				dispatch('change', { value: next });
			}
		});

		const state = EditorState.create({
			doc: value,
			extensions: [
				lineNumbers(),
				highlightActiveLine(),
				history(),
				keymap.of([saveKey, indentWithTab, ...defaultKeymap, ...historyKeymap]),
				htmlLang(),
				syntaxHighlighting(paperHighlight),
				handlebarsHighlight(),
				handlebarsTheme,
				handlebarsAutocomplete({
					getVariables: () => _variableNames,
					getHelpers: () => _helpers
				}),
				handlebarsLinter({ getErrors: () => _compileErrors }),
				updateListener,
				EditorView.theme({
					'&': {
						backgroundColor: '#FFFDF8',
						height: '100%',
						fontSize: '13px'
					},
					'.cm-scroller': {
						fontFamily:
							"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
					},
					'.cm-gutters': {
						backgroundColor: '#f5f0e6',
						borderRight: '2px solid #1f2937',
						color: '#9ca3af'
					},
					'.cm-activeLine': {
						backgroundColor: 'rgba(255, 196, 128, 0.15)'
					},
					'.cm-activeLineGutter': {
						backgroundColor: 'rgba(255, 196, 128, 0.3)',
						color: '#1f2937',
						fontWeight: '600'
					},
					'.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection':
						{
							backgroundColor: 'rgba(255, 196, 128, 0.4)'
						},
					'.cm-cursor': {
						borderLeft: '2px solid #1f2937'
					},
					'.cm-tooltip': {
						border: '3px solid #1f2937',
						backgroundColor: '#FFFDF8',
						boxShadow: '3px 3px 0 0 #1f2937',
						fontFamily:
							"'JetBrains Mono', ui-monospace, SFMono-Regular, monospace"
					},
					'.cm-tooltip-autocomplete > ul > li[aria-selected]': {
						backgroundColor: '#ffc480',
						color: '#1f2937'
					}
				})
			]
		});

		view = new EditorView({ state, parent: container });
	});

	onDestroy(() => {
		if (view) view.destroy();
	});

	// External updates (e.g., loading a fresh template from server): sync
	// the editor buffer when `value` changes from outside.
	$: if (view && value !== view.state.doc.toString()) {
		view.dispatch({
			changes: { from: 0, to: view.state.doc.length, insert: value }
		});
	}
</script>

<div
	bind:this={container}
	class="cm-html-editor h-full w-full border-3 border-gray-800 bg-brand-bg"
></div>

<style>
	.cm-html-editor :global(.cm-editor) {
		height: 100%;
		outline: none;
	}
	.cm-html-editor :global(.cm-editor.cm-focused) {
		outline: none;
	}
</style>
