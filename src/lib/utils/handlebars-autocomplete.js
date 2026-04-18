/**
 * CodeMirror 6 autocomplete + decoration extensions for Handlebars-inside-HTML.
 *
 * Used by components/editor/html/HtmlEditor.svelte. Exposes:
 *
 *   handlebarsHighlight()    Decoration extension — renders every
 *                            `{{expr}}` / `{{{expr}}}` with the brand
 *                            handlebars color + underline (the signature
 *                            visual detail of the HTML editor).
 *
 *   handlebarsAutocomplete({ getVariables, getHelpers })
 *                            Completion source that triggers on `{{` and
 *                            offers declared variables, helper names, and
 *                            block helpers.
 *
 *   handlebarsLinter({ getCompileErrors })
 *                            Source function for @codemirror/lint that
 *                            reads externally-computed compile errors
 *                            (the editor component runs Handlebars.parse
 *                            locally on edits and feeds the result here).
 */

import { Decoration, ViewPlugin, EditorView } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import {
	autocompletion,
	startCompletion,
	completionKeymap
} from '@codemirror/autocomplete'
import { linter, lintGutter } from '@codemirror/lint'

// --- Decoration: highlight {{...}} / {{{...}}} ranges inside HTML text ---

// The regex intentionally allows whitespace inside the braces. It stops at
// the first `}}` so it can't run past an unclosed expression.
const TOKEN_RE = /\{\{\{?([\s\S]+?)\}?\}\}/g

const tokenMark = Decoration.mark({ class: 'cm-hbs-token' })
const tokenMarkRaw = Decoration.mark({ class: 'cm-hbs-token-raw' })

function buildDecorations(view) {
	const builder = new RangeSetBuilder()
	for (const { from, to } of view.visibleRanges) {
		const text = view.state.doc.sliceString(from, to)
		for (const m of text.matchAll(TOKEN_RE)) {
			const start = from + m.index
			const end = start + m[0].length
			const isRaw = m[0].startsWith('{{{')
			builder.add(start, end, isRaw ? tokenMarkRaw : tokenMark)
		}
	}
	return builder.finish()
}

export const handlebarsHighlight = () =>
	ViewPlugin.fromClass(
		class {
			constructor(view) {
				this.decorations = buildDecorations(view)
			}
			update(vu) {
				if (vu.docChanged || vu.viewportChanged) {
					this.decorations = buildDecorations(vu.view)
				}
			}
		},
		{ decorations: (v) => v.decorations }
	)

/**
 * Resolve whether a document position falls inside a `{{var}}` token.
 * Returns `{ name, from, to }` for the enclosing token, or null.
 *
 * Exported so call-sites (click handlers, hover previews) don't have to
 * duplicate the regex walk. Runs only against the current line so the
 * cost is bounded even on huge templates.
 */
export function resolveHandlebarsTokenAt(state, pos) {
	const line = state.doc.lineAt(pos)
	const lineText = line.text
	const col = pos - line.from
	for (const m of lineText.matchAll(TOKEN_RE)) {
		const start = m.index
		const end = start + m[0].length
		if (col >= start && col <= end) {
			const rawInner = m[1].trim()
			const isOpener = rawInner.startsWith('#')
			const isCloser = rawInner.startsWith('/')
			// Split once the leading # / / marker is gone. The interesting
			// NAME depends on the shape:
			//   {{foo}}            → name = foo
			//   {{titleCase foo}}  → name = titleCase (helper) + inline arg foo ignored
			//   {{#each items}}    → name = items (the subject, not the helper)
			//   {{#if user}}       → name = user
			//   {{#with obj}}      → name = obj
			//   {{/each}}          → name = each (closer — skip elsewhere)
			const words = rawInner.replace(/^[#/]/, '').trim().split(/\s+/)
			const helperHead = words[0] || ''
			const BLOCK_HELPERS = ['each', 'if', 'unless', 'with']
			let name
			if (isOpener && BLOCK_HELPERS.includes(helperHead) && words[1]) {
				// `{{#each items}}` → the variable the user reasons about IS
				// the subject of the block, so surface that instead of the
				// builtin helper name. Strip nested path accessors so
				// `{{#each user.items}}` resolves to `user`.
				name = words[1].split('.')[0]
			} else {
				name = helperHead
			}
			return {
				name,
				from: line.from + start,
				to: line.from + end,
				isRaw: m[0].startsWith('{{{'),
				block: isOpener ? 'open' : isCloser ? 'close' : null
			}
		}
	}
	return null
}

/**
 * Click handler extension — calls `onTokenClick(token, event)` when the
 * user clicks inside a `{{var}}` token. The callback receives the same
 * shape as `resolveHandlebarsTokenAt`, plus the DOMRect of the clicked
 * token so the host can anchor a floating inspector without measuring
 * the editor manually.
 *
 * Held mouse-down + drag inside the token is NOT treated as a click
 * (a selection is happening); we fire on click only.
 */
export const handlebarsTokenClick = ({ onTokenClick }) =>
	EditorView.domEventHandlers({
		click(event, view) {
			if (!onTokenClick) return false
			// Ignore if the user was dragging to select.
			if (view.state.selection.main.from !== view.state.selection.main.to) return false

			const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
			if (pos == null) return false

			const token = resolveHandlebarsTokenAt(view.state, pos)
			if (!token || !token.name) return false
			// Block closers (`{{/each}}`, `{{/if}}`) carry the name for AST
			// balance but aren't useful inspector targets — skip them.
			// Openers like `{{#each items}}` DO reference a real variable
			// (often an array/object) so we let them through; the host can
			// decide how to render the inspector for that shape.
			if (token.block === 'close') return false

			const coords = view.coordsAtPos(token.from)
			if (!coords) return false

			onTokenClick(
				{
					...token,
					rect: {
						top: coords.top,
						bottom: coords.bottom,
						left: coords.left,
						right: coords.right,
						width: coords.right - coords.left,
						height: coords.bottom - coords.top
					}
				},
				event
			)
			return false
		}
	})

// Baseline theme rules applied alongside the decoration extension. Matches the
// design spec: brand handlebars color for text, brand accent underline.
export const handlebarsTheme = EditorView.baseTheme({
	'.cm-hbs-token': {
		color: '#c88a3b',
		textDecoration: 'underline',
		textDecorationColor: '#ffc480',
		textDecorationThickness: '2px',
		textUnderlineOffset: '3px',
		cursor: 'pointer'
	},
	'.cm-hbs-token:hover': {
		backgroundColor: 'rgba(255, 196, 128, 0.2)',
		borderRadius: '2px'
	},
	'.cm-hbs-token-raw': {
		color: '#c88a3b',
		textDecoration: 'underline wavy',
		textDecorationColor: '#ffc480',
		textDecorationThickness: '2px',
		cursor: 'pointer'
	},
	'.cm-hbs-token-raw:hover': {
		backgroundColor: 'rgba(255, 107, 107, 0.15)',
		borderRadius: '2px'
	},
	'.cm-lintRange-error': {
		backgroundImage: 'none',
		textDecoration: 'underline wavy',
		textDecorationColor: '#c62828',
		textDecorationThickness: '2px'
	}
})

// --- Autocomplete: {{<caret>  → list of declared vars + helpers ---

// Block helpers available in Handlebars — snippet-style completion inserts
// the closing tag for the user.
const BLOCK_HELPERS = [
	{ label: '#if', detail: 'conditional', type: 'keyword', apply: '#if $1}}$0{{/if' },
	{ label: '#unless', detail: 'conditional', type: 'keyword', apply: '#unless $1}}$0{{/unless' },
	{ label: '#each', detail: 'loop', type: 'keyword', apply: '#each $1}}$0{{/each' },
	{ label: '#with', detail: 'scope', type: 'keyword', apply: '#with $1}}$0{{/with' }
]

/**
 * Build the CodeMirror autocomplete extension.
 *
 * @param {object} deps
 * @param {() => string[]} deps.getVariables      current declared variable names
 * @param {() => string[]} deps.getHelpers        safelisted helper names from backend
 */
export const handlebarsAutocomplete = ({ getVariables, getHelpers }) =>
	autocompletion({
		// We install completionKeymap ourselves at the host level so Tab +
		// Enter accept suggestions before falling through to the indent /
		// default keymap. Turning defaultKeymap OFF here avoids a duplicate
		// registration that can otherwise swallow key events in unexpected
		// order.
		defaultKeymap: false,
		activateOnTyping: true,
		override: [
			(ctx) => {
				// Trigger when the last characters before the caret look like
				// a handlebars token opening. The `[#/]?` allows `{{#e` and
				// `{{/e` (block helpers) to match — the old word-only regex
				// silently dropped those.
				const before = ctx.matchBefore(/\{\{\s*[#/]?\w*$/)
				if (!before) return null
				// Calculate where the user's partial name starts: after the
				// `{{` opener plus any whitespace / block marker.
				const prefixMatch = /^\{\{\s*[#/]?/.exec(before.text)
				const prefixLen = prefixMatch ? prefixMatch[0].length : 2
				const partialStart = before.from + prefixLen
				const options = [
					...getVariables().map((name) => ({
						label: name,
						type: 'variable',
						detail: 'variable',
						boost: 10
					})),
					...getHelpers().map((name) => ({
						label: name,
						type: 'function',
						detail: 'helper',
						boost: 5
					})),
					...BLOCK_HELPERS
				]
				return {
					from: partialStart,
					options,
					validFor: /^\w*$/
				}
			}
		]
	})

// --- Linter: consume externally-supplied compile errors ---

/**
 * Returns a CodeMirror lint source that reads an externally-maintained error
 * list (the editor component computes Handlebars.parse() on change and
 * passes the line/col here). Lint source returns an array of
 * `{ from, to, severity, message }` tuples.
 *
 * @param {object} deps
 * @param {() => Array<{ line: number, col?: number, message: string }>} deps.getErrors
 */
export const handlebarsLinter = ({ getErrors }) =>
	linter(
		(view) => {
			const diagnostics = []
			for (const err of getErrors() || []) {
				if (!err || typeof err.line !== 'number') continue
				// CodeMirror lines are 1-based; Doc.line returns the line from a number.
				const lineNumber = Math.max(1, Math.min(view.state.doc.lines, err.line))
				const line = view.state.doc.line(lineNumber)
				const col = typeof err.col === 'number' ? Math.max(0, err.col) : 0
				const from = Math.min(line.from + col, line.to)
				diagnostics.push({
					from,
					to: line.to,
					severity: 'error',
					message: err.message || 'Compile error'
				})
			}
			return diagnostics
		},
		{
			// Refresh diagnostics on every change — our compile-errors list is
			// already debounce-free upstream so this just makes the squiggle
			// follow the cursor. Delay `0` disables the default 750ms debounce.
			delay: 100
		}
	)

/**
 * Expose lint gutter markers + a trigger that auto-opens the autocomplete
 * menu the moment the user types `{{`. Both are cosmetic-but-load-bearing
 * ergonomics — without them the linter only renders squiggles (no gutter
 * indicator), and the autocomplete only surfaces after a word-char, not
 * after the opening braces alone.
 */
export const handlebarsLintGutter = () => lintGutter()

export const handlebarsAutocompleteTriggers = () =>
	EditorView.updateListener.of((v) => {
		if (!v.docChanged) return
		// Check whether any change inserted the `{{` sequence ending at
		// the new caret position — if so, open the completion popup.
		v.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
			if (!inserted || inserted.length === 0) return
			const insertedText = inserted.toString()
			if (!insertedText.includes('{')) return
			const caret = v.state.selection.main.head
			if (caret < 2) return
			const before = v.state.doc.sliceString(caret - 2, caret)
			if (before === '{{') {
				// Schedule in a microtask so we don't re-enter the
				// transaction stack that's still settling.
				queueMicrotask(() => startCompletion(v.view))
			}
		})
	})

export const handlebarsCompletionKeymap = completionKeymap
