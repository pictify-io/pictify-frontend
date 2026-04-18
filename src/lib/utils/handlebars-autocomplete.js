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
import { autocompletion } from '@codemirror/autocomplete'
import { linter } from '@codemirror/lint'

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
			// Trim whitespace + leading `#`/`/` block-helper markers so the
			// extracted name is the variable identifier only, not the
			// surrounding decorative syntax.
			const rawInner = m[1].trim()
			// First whitespace-delimited word, stripping `#if x`, `/each`,
			// `titleCase name` etc. down to the first identifier.
			const firstToken = rawInner.replace(/^[#/]/, '').split(/\s+/)[0]
			return {
				name: firstToken,
				from: line.from + start,
				to: line.from + end,
				isRaw: m[0].startsWith('{{{'),
				// The surrounding block helper (if the token starts with # or /),
				// so callers can skip opening the inspector for `{{#if}}` forms.
				block:
					m[1].trimStart().startsWith('#')
						? 'open'
						: m[1].trimStart().startsWith('/')
							? 'close'
							: null
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
			// Block helpers (`{{#if x}}`, `{{/each}}`) aren't variables per
			// se — skip opening the inspector for those so users can still
			// position their caret inside block syntax for normal editing.
			if (token.block) return false

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
		override: [
			(ctx) => {
				// Trigger when the last characters before the caret are `{{`.
				// CodeMirror gives us `matchBefore` for lookbehind.
				const before = ctx.matchBefore(/\{\{\s*\w*$/)
				if (!before) return null
				const partialStart = before.from + (before.text.startsWith('{{') ? 2 : 0)
				const options = [
					...getVariables().map((name) => ({
						label: name,
						type: 'variable',
						detail: 'variable'
					})),
					...getHelpers().map((name) => ({
						label: name,
						type: 'function',
						detail: 'helper'
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
	linter((view) => {
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
	})
