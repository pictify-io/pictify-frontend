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

// Fallback helper list used when the host hasn't wired up the backend's
// SAFELISTED_HELPERS yet. Keeps the autocomplete menu useful on fresh
// templates that have no declared variables and before any API call.
// Mirrors the most-common entries in service/template-helpers.js HELPERS
// on the backend — the server re-validates on render so surfacing a
// helper that was later removed is a loud error, not a silent failure.
const DEFAULT_HELPERS = [
	'eq', 'ne', 'lt', 'gt', 'lte', 'gte', 'and', 'or', 'not',
	'length', 'isEmpty', 'isNotEmpty', 'isDefined',
	'contains', 'first', 'last', 'join', 'slice',
	'lowercase', 'uppercase', 'capitalize', 'titleCase', 'trim', 'truncate',
	'replace', 'split', 'padStart', 'padEnd',
	'add', 'subtract', 'multiply', 'divide', 'mod', 'round', 'floor', 'ceil',
	'currency', 'percentage', 'number',
	'date', 'dateAdd', 'now',
	'default', 'ternary',
	'encodeURIComponent', 'toJSON'
]

/**
 * Build the CodeMirror autocomplete extension.
 *
 * @param {object} deps
 * @param {() => string[]} deps.getVariables      current declared variable names
 * @param {() => string[]} deps.getHelpers        safelisted helper names from backend
 */
/**
 * The actual completion source. Extracted so both `autocompletion.override`
 * and the explicit-trigger path (`startCompletion`) call the same function
 * and can't fall out of sync.
 *
 * Returns null when the caret isn't inside a `{{…}}` opening — letting
 * CodeMirror fall through to other completion sources (HTML tags, etc.).
 */
const buildHandlebarsCompletionSource =
	({ getVariables, getHelpers }) =>
	(ctx) => {
		// Match: two opening braces, optional whitespace, optional block
		// marker, then any word chars the user has started typing. We also
		// accept the caret being positioned immediately after `{{` with an
		// empty partial — without that, the popup would only show once the
		// user typed a letter.
		const before = ctx.matchBefore(/\{\{\s*[#/]?\w*$/)
		// Visible debug: leave a trail on window so we can tell whether
		// the source is even being invoked in the browser. Remove once
		// the autocomplete regression is confirmed closed.
		if (typeof window !== 'undefined') {
			window.__hbsAutocomplete = window.__hbsAutocomplete || { calls: 0, lastMatch: null }
			window.__hbsAutocomplete.calls += 1
			window.__hbsAutocomplete.lastMatch = before
				? { from: before.from, text: before.text, explicit: ctx.explicit }
				: { missed: true, pos: ctx.pos, explicit: ctx.explicit }
		}
		if (!before) return null
		const prefixMatch = /^\{\{\s*[#/]?/.exec(before.text)
		const prefixLen = prefixMatch ? prefixMatch[0].length : 2
		const partialStart = before.from + prefixLen
		const vars = getVariables() || []
		// Use the host-provided helper list if the backend has surfaced
		// one, otherwise fall back to the common-helpers list so a fresh
		// template still gets a useful autocomplete menu.
		const helpers = (getHelpers() || []).length > 0 ? getHelpers() : DEFAULT_HELPERS
		const options = [
			...vars.map((name) => ({
				label: name,
				type: 'variable',
				detail: 'variable',
				boost: 10
			})),
			...helpers.map((name) => ({
				label: name,
				type: 'function',
				detail: 'helper',
				boost: 5
			})),
			...BLOCK_HELPERS
		]
		if (typeof window !== 'undefined') {
			window.__hbsAutocomplete.lastOptions = options.length
		}
		return { from: partialStart, options, validFor: /^\w*$/ }
	}

export const handlebarsAutocomplete = ({ getVariables, getHelpers }) =>
	autocompletion({
		activateOnTyping: true,
		override: [buildHandlebarsCompletionSource({ getVariables, getHelpers })]
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
		// Open the completion popup whenever the caret is immediately
		// after `{{` — whether that's because the user just typed the
		// second brace, pasted the pair, or the pair was auto-closed to
		// `{{|}}` with the caret in between. CodeMirror's built-in
		// activateOnTyping only fires on word characters, which is why
		// the popup otherwise waits for the first letter inside the
		// braces — feels like the autocomplete is "not working."
		const caret = v.state.selection.main.head
		if (caret < 2) return
		const before = v.state.doc.sliceString(caret - 2, caret)
		if (before !== '{{') return
		// Don't re-trigger inside an already-filled token like `{{foo}}`
		// when the caret lands between `{{` and `f`; only trigger when
		// the next char is empty, whitespace, or the matching closer.
		const after = v.state.doc.sliceString(caret, Math.min(caret + 1, v.state.doc.length))
		if (after && !/[\s}]/.test(after)) return
		queueMicrotask(() => startCompletion(v.view))
	})

export const handlebarsCompletionKeymap = completionKeymap
