/**
 * The press syntax theme — ONE definition for every surface that shows code.
 *
 * Two consumers, one palette:
 *   `pressHighlight` / `pressEditorTheme` — CodeMirror extensions, for panes
 *      that are real editors (studio HTML, playground request body).
 *   `highlightToHtml`  — a small tokenizer for read-only snippets, where
 *      mounting an editor to display six lines of curl is not worth it.
 *
 * Both read the same colour map, so a `{{token}}` is the same pink in the
 * studio's editor and in the snippet the Inputs rail prints beside it. Colours
 * are literals rather than CSS vars because CodeMirror resolves styles at
 * extension-build time, outside Tailwind's reach.
 */
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/** The press palette. Mirrors the v2 tokens in tailwind.config.js. */
export const PRESS = {
	bg: '#131417',
	text: '#ADB9C6', // press-text — default
	keyword: '#A9D7F2', // powder — tags, keywords, calls
	string: '#D8F34A', // field — strings and values
	token: '#FF48B0', // pink — {{template variables}}
	property: '#FFD3E8', // rose — attribute and property names
	comment: 'rgba(173,185,198,0.45)'
};

/** CodeMirror highlight rules. Punctuation is deliberately absent — it inherits. */
export const pressHighlight = syntaxHighlighting(
	HighlightStyle.define([
		{ tag: [t.tagName, t.keyword, t.function(t.variableName), t.standard(t.tagName)], color: PRESS.keyword },
		{ tag: [t.string, t.special(t.string), t.number, t.bool, t.literal], color: PRESS.string },
		{ tag: [t.attributeName, t.propertyName, t.definition(t.propertyName)], color: PRESS.property },
		{ tag: [t.comment, t.lineComment, t.blockComment], color: PRESS.comment, fontStyle: 'italic' },
		{ tag: [t.variableName, t.attributeValue], color: PRESS.text },
		{ tag: t.invalid, color: '#B0483A' }
	])
);

/** Chrome around the code: background, caret, selection, gutter. */
export const pressEditorTheme = EditorView.theme(
	{
		'&': { backgroundColor: PRESS.bg, color: PRESS.text },
		'.cm-content': { caretColor: '#FFFFFF', fontFamily: 'JetBrains Mono, ui-monospace, monospace' },
		'.cm-cursor, .cm-dropCursor': { borderLeftColor: '#FFFFFF' },
		'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
			backgroundColor: 'rgba(169,215,242,0.22)'
		},
		'.cm-gutters': {
			backgroundColor: PRESS.bg,
			color: 'rgba(173,185,198,0.35)',
			border: 'none'
		},
		'.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.03)' },
		'.cm-activeLineGutter': { backgroundColor: 'transparent', color: PRESS.text },
		'.cm-scroller': { fontFamily: 'JetBrains Mono, ui-monospace, monospace', lineHeight: '21px' }
	},
	{ dark: true }
);

/** Every CodeMirror pane wants both; exported together so none forgets one. */
export const pressTheme = [pressEditorTheme, pressHighlight];

const ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPE[c]);

/**
 * Highlight a read-only snippet to an HTML string.
 *
 * Deliberately small: a regex pass, not a parser. It runs on curl/JSON/HTML
 * fragments a few lines long where a real grammar buys nothing and mounting
 * CodeMirror to render static text buys less. `{{tokens}}` are matched FIRST
 * so a variable inside a JSON string still reads as a variable — that is the
 * distinction the whole palette exists to make.
 *
 * Output is escaped before any markup is added, so a snippet containing HTML
 * cannot inject into the page.
 *
 * @param {string} code
 * @returns {string} HTML with <span style="color:…"> runs
 */
export function highlightToHtml(code) {
	const src = esc(code ?? '');
	const rules = [
		// {{variables}} — before strings, so tokens inside quotes stay pink.
		{ re: /\{\{[^}]*\}\}/g, color: PRESS.token, weight: 500 },
		{ re: /(^|\n)\s*(#|\/\/)[^\n]*/g, color: PRESS.comment },
		{ re: /&quot;[^&]*?&quot;|&#39;[^&]*?&#39;/g, color: PRESS.string },
		// HTML tag names and the leading token of a shell line (curl, node…).
		{ re: /&lt;\/?[a-zA-Z][\w-]*/g, color: PRESS.keyword },
		{ re: /\b(curl|await|fetch|import|requests|const|POST|GET|Authorization|Bearer)\b/g, color: PRESS.keyword },
		{ re: /\b[a-zA-Z_][\w-]*(?=\s*[:=])/g, color: PRESS.property }
	];

	// One pass: collect non-overlapping matches, earliest and highest priority
	// first, then stitch. Sequential replace() would re-match inside the markup
	// it just inserted.
	const spans = [];
	const taken = (start, end) => spans.some((s) => start < s.end && end > s.start);
	for (const rule of rules) {
		rule.re.lastIndex = 0;
		let m;
		while ((m = rule.re.exec(src)) !== null) {
			if (!m[0].length) break;
			const start = m.index + (m[0].length - m[0].trimStart().length);
			const end = m.index + m[0].length;
			if (!taken(start, end)) spans.push({ start, end, color: rule.color, weight: rule.weight });
		}
	}
	spans.sort((a, b) => a.start - b.start);

	let out = '';
	let cursor = 0;
	for (const s of spans) {
		if (s.start < cursor) continue;
		out += src.slice(cursor, s.start);
		const weight = s.weight ? `;font-weight:${s.weight}` : '';
		out += `<span style="color:${s.color}${weight}">${src.slice(s.start, s.end)}</span>`;
		cursor = s.end;
	}
	out += src.slice(cursor);
	return out;
}
