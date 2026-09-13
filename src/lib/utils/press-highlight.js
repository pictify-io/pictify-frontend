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
	keyword: '#A9D7F2', // sky — tags, keywords, calls
	string: '#D8F34A', // field — strings and values
	token: '#FF48B0', // pink — {{template variables}}
	property: '#FFD3E8', // rose — attribute and property names
	comment: 'rgba(173,185,198,0.45)'
};

/** CodeMirror highlight rules. Punctuation is deliberately absent — it inherits. */
export const pressHighlight = syntaxHighlighting(
	HighlightStyle.define([
		{
			tag: [t.tagName, t.keyword, t.function(t.variableName), t.standard(t.tagName)],
			color: PRESS.keyword
		},
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

// ── Editable panes: rules + segmenter ────────────────────────────────────
//
// A pane the user types into cannot be an innerHTML string, so these produce
// SEGMENTS — `{ text, color, weight }` runs a template renders as elements.
// The overlay technique (transparent textarea over a coloured <pre>) keeps
// native undo, selection, IME and paste, which a contenteditable re-implements
// badly and CodeMirror brings a parser along for.

/** HTML templates — the image studio's pane. */
export const HTML_RULES = [
	{ re: /\{\{[^}]*\}\}/g, color: PRESS.token, weight: 500 },
	{ re: /<!--[\s\S]*?-->/g, color: PRESS.comment },
	{ re: /"[^"\n]*"|'[^'\n]*'/g, color: PRESS.string },
	{ re: /<\/?[a-zA-Z][\w-]*/g, color: PRESS.keyword },
	{ re: /\b[a-zA-Z-]+(?==)/g, color: PRESS.property }
];

/**
 * Remotion scenes — the video studio's code pane.
 *
 * Schema field names are matched FIRST and painted pink, the same pink a
 * `{{token}}` gets in an HTML template. That is the whole point of the colour:
 * in both languages it marks "this is an input someone fills in when they
 * render", and it is the only thing on screen a non-programmer needs to find.
 * The pattern is deliberately narrow — an identifier at the head of a line
 * whose value opens with `type:` — because that IS the shape of a schema
 * declaration, and a looser rule would paint half the file pink.
 */
export const TSX_RULES = [
	{ re: /^[ \t]*[A-Za-z_$][\w$]*(?=\s*:\s*\{\s*type\s*:)/gm, color: PRESS.token, weight: 500 },
	{ re: /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, color: PRESS.comment },
	{ re: /'[^'\n]*'|"[^"\n]*"|`[^`]*`/g, color: PRESS.string },
	{ re: /<\/?[A-Za-z][\w.]*/g, color: PRESS.keyword },
	{
		re: /\b(?:import|export|from|const|let|var|function|return|default|if|else|new|await|async|typeof|interface|type)\b/g,
		color: PRESS.keyword
	},
	{ re: /\b[A-Za-z_$][\w$]*(?=\s*[:=](?!=))/g, color: PRESS.property }
];

/**
 * Split `source` into coloured runs using a priority-ordered rule list.
 *
 * Earlier rules win: an overlapping later match is dropped rather than nested,
 * so `{{token}}` inside a string stays a token. Each regex's `lastIndex` is
 * reset on entry — a /g regex carries it between calls and silently
 * mis-highlights every other match when the same rule list is reused.
 *
 * @param {string} source
 * @param {Array<{re: RegExp, color: string, weight?: number}>} rules
 * @returns {Array<{text: string, color: string|null, weight?: number}>}
 */
export function segmentize(source, rules) {
	const src = source || '';
	const spans = [];
	const overlaps = (a, b) => spans.some((s) => a < s.end && b > s.start);
	for (const rule of rules) {
		rule.re.lastIndex = 0;
		let m;
		while ((m = rule.re.exec(src)) !== null) {
			if (!m[0].length) break;
			// Leading indentation is matched by the schema rule (it anchors to the
			// line head) but must not be painted, or the pink starts in the margin.
			const start = m.index + (m[0].length - m[0].trimStart().length);
			const end = m.index + m[0].length;
			if (!overlaps(start, end)) {
				spans.push({ start, end, color: rule.color, weight: rule.weight });
			}
		}
	}
	spans.sort((a, b) => a.start - b.start);

	const out = [];
	let cursor = 0;
	for (const s of spans) {
		if (s.start < cursor) continue;
		if (s.start > cursor) out.push({ text: src.slice(cursor, s.start), color: null });
		out.push({ text: src.slice(s.start, s.end), color: s.color, weight: s.weight });
		cursor = s.end;
	}
	if (cursor < src.length) out.push({ text: src.slice(cursor), color: null });
	return out;
}

const ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPE[c]);

/**
 * Per-language rule sets for read-only snippets.
 *
 * Every list reads the same PRESS palette, so a string is the same green in a
 * curl snippet and in the JSON response beside it. Order is priority: earlier
 * rules win the characters they match, and a later rule keeps whatever is left
 * over (see `addSpans`), which is how a `{{token}}` can sit inside a string
 * without the rest of that string losing its colour.
 *
 * Patterns run against ESCAPED source, so a double quote is `&quot;` and a
 * single quote `&#39;`. `&(?!quot;)` inside the string patterns lets an escaped
 * ampersand live in a string without ending it.
 */
const TOKEN_RULE = { re: /\{\{[^}]*\}\}/g, color: PRESS.token, weight: 500 };
const DQ = '&quot;(?:[^&]|&(?!quot;))*?&quot;';
const SQ = '&#39;(?:[^&]|&(?!#39;))*?&#39;';

export const LANG_RULES = {
	html: [
		TOKEN_RULE,
		{ re: /&lt;!--[\s\S]*?--&gt;/g, color: PRESS.comment },
		{ re: new RegExp(`${DQ}|${SQ}`, 'g'), color: PRESS.string },
		{ re: /&lt;\/?[a-zA-Z][\w-]*/g, color: PRESS.keyword },
		{ re: /\b[a-zA-Z-]+(?==)/g, color: PRESS.property }
	],

	json: [
		TOKEN_RULE,
		// Keys before values: a quoted run followed by a colon is a property.
		{ re: new RegExp(`${DQ}(?=\\s*:)`, 'g'), color: PRESS.property },
		{ re: new RegExp(DQ, 'g'), color: PRESS.string },
		{ re: /\b(?:true|false|null)\b/g, color: PRESS.string },
		{ re: /-?\b\d+(?:\.\d+)?\b/g, color: PRESS.string }
	],

	js: [
		TOKEN_RULE,
		// Not preceded by ':' — otherwise the // in https:// starts a comment.
		{ re: /(?<![:/\w])\/\/[^\n]*/g, color: PRESS.comment },
		// A quoted key ('Content-Type':) is a property, not a string.
		{ re: new RegExp(`(?:${DQ}|${SQ})(?=\\s*:)`, 'g'), color: PRESS.property },
		{ re: new RegExp(`${DQ}|${SQ}|\`[^\`]*\``, 'g'), color: PRESS.string },
		{
			re: /\b(?:const|let|var|await|async|function|return|import|export|from|new|if|else|try|catch)\b/g,
			color: PRESS.keyword
		},
		{ re: /\b(?:fetch|JSON|stringify|parse|json|require|console|log)\b/g, color: PRESS.keyword },
		// Bare identifiers used as object keys. Runs after strings, so a colon
		// inside a URL is already spoken for.
		{ re: /\b[A-Za-z_$][\w$]*(?=\s*:)/g, color: PRESS.property }
	],

	python: [
		TOKEN_RULE,
		// Not preceded by '&' — escaping turns a single quote into &#39;, and a
		// naive # rule swallows the rest of the line from inside that entity.
		{ re: /(?<![&\w])#[^\n]*/g, color: PRESS.comment },
		{ re: new RegExp(`(?:${DQ}|${SQ})(?=\\s*:)`, 'g'), color: PRESS.property },
		{ re: new RegExp(`${DQ}|${SQ}`, 'g'), color: PRESS.string },
		{
			re: /\b(?:import|from|def|return|print|True|False|None|with|as|if|else)\b/g,
			color: PRESS.keyword
		},
		{ re: /\b(?:requests|post|get|json|headers|dumps|loads)\b/g, color: PRESS.keyword },
		{ re: /\b[A-Za-z_][\w]*(?=\s*=(?!=))/g, color: PRESS.property }
	],

	shell: [
		TOKEN_RULE,
		{ re: /(?<![&\w])#[^\n]*/g, color: PRESS.comment },
		// Header names sit INSIDE the quoted argument, so they are claimed before
		// the string rule; the string rule then colours what is left of that
		// argument rather than losing it to the overlap.
		{ re: /(?<=&quot;)[A-Za-z][\w-]*(?=:\s)/g, color: PRESS.property },
		{ re: new RegExp(`${DQ}|${SQ}`, 'g'), color: PRESS.string },
		{ re: /(?:^|\s)(?:curl|-X|-H|-d|--data|--header|--request)\b/g, color: PRESS.keyword },
		{ re: /\b(?:POST|GET|PUT|PATCH|DELETE)\b/g, color: PRESS.keyword }
	],

	php: [
		TOKEN_RULE,
		{ re: /(?<![&\w:/])(?:\/\/|#)[^\n]*/g, color: PRESS.comment },
		{ re: new RegExp(`(?:${DQ}|${SQ})(?=\\s*=&gt;)`, 'g'), color: PRESS.property },
		{ re: new RegExp(`${DQ}|${SQ}`, 'g'), color: PRESS.string },
		{
			re: /&lt;\?php|\b(?:curl_init|curl_setopt|curl_setopt_array|curl_exec|curl_close|json_encode|json_decode|echo|return|function)\b/g,
			color: PRESS.keyword
		},
		{ re: /\bCURLOPT_[A-Z_]+\b/g, color: PRESS.property },
		{ re: /\$[A-Za-z_]\w*/g, color: PRESS.keyword }
	]
};

/**
 * The original mixed rule set: HTML fragments, curl and prose in one pane.
 * Still the default so existing callers (the studio's Use it panel, the setup
 * cards) keep the highlighting they were written against.
 */
const AUTO_RULES = [
	TOKEN_RULE,
	{ re: /(^|\n)\s*(?:#|\/\/)(?!39;)[^\n]*/g, color: PRESS.comment },
	{ re: new RegExp(`${DQ}|${SQ}`, 'g'), color: PRESS.string },
	{ re: /&lt;\/?[a-zA-Z][\w-]*/g, color: PRESS.keyword },
	{
		re: /\b(curl|await|fetch|import|requests|const|POST|GET|Authorization|Bearer)\b/g,
		color: PRESS.keyword
	},
	{ re: /\b[a-zA-Z_][\w-]*(?=\s*[:=])/g, color: PRESS.property }
];

/**
 * Add a match to the span list, keeping only the parts no earlier rule claimed.
 *
 * The earlier version dropped an overlapping match whole, which meant a string
 * containing a `{{token}}` lost its string colour entirely — the token was
 * matched first, so the string that surrounded it was discarded and rendered as
 * plain text. Splitting instead of dropping is what lets a high-priority rule
 * paint a fragment (a token, a header name) while a lower-priority rule still
 * colours the rest of the run it sits inside.
 */
function addSpans(spans, start, end, color, weight) {
	const clashes = spans
		.filter((s) => start < s.end && end > s.start)
		.sort((a, b) => a.start - b.start);
	let cursor = start;
	for (const c of clashes) {
		if (c.start > cursor) spans.push({ start: cursor, end: Math.min(c.start, end), color, weight });
		cursor = Math.max(cursor, c.end);
		if (cursor >= end) return;
	}
	if (cursor < end) spans.push({ start: cursor, end, color, weight });
}

/**
 * Highlight a read-only snippet to an HTML string.
 *
 * Deliberately small: a regex pass, not a parser. It runs on snippets a few
 * lines long where a real grammar buys nothing and mounting CodeMirror to
 * render static text buys less.
 *
 * Output is escaped before any markup is added, so a snippet containing HTML
 * cannot inject into the page.
 *
 * @param {string} code
 * @param {'html'|'json'|'js'|'python'|'shell'|'php'|'auto'} [lang]
 * @returns {string} HTML with <span style="color:…"> runs
 */
export function highlightToHtml(code, lang = 'auto') {
	const src = esc(code ?? '');
	const rules = LANG_RULES[lang] || AUTO_RULES;

	const spans = [];
	for (const rule of rules) {
		rule.re.lastIndex = 0;
		let m;
		while ((m = rule.re.exec(src)) !== null) {
			if (!m[0].length) break;
			const start = m.index + (m[0].length - m[0].trimStart().length);
			const end = m.index + m[0].length;
			if (end > start) addSpans(spans, start, end, rule.color, rule.weight);
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
