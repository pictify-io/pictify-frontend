/**
 * A LIVE APPROXIMATION of which `{{…}}` names are inputs.
 *
 * Not the source of truth. The server derives the real contract by walking the
 * Handlebars AST (`lib/html-ast.js`), and the studio adopts that list whenever
 * the server returns one. This exists only for the gap the AST cannot cover:
 * the Inputs rail has to keep up while you type, and half-written HTML does not
 * parse — an AST walk would blank the rail on every other keystroke.
 *
 * A bare-token regex is not enough either. The agent writes
 * `{{uppercase badgeText}}` and `{{titleCase (default title "Fallback")}}`,
 * so matching only `{{name}}` reports an empty contract for a template full of
 * variables. The rule here: inside a mustache, every identifier is an input
 * unless it is a safelisted helper name, a block keyword, or in a string.
 *
 * Known divergences from the AST, both harmless because the server corrects
 * them on save: this keeps the full dotted path (`user.email`) where the AST
 * reports the root (`user`), and it still reports inputs for HTML that would
 * fail to parse.
 */

/** Safelist from the backend's html-template-engine (service/html-template-engine.js). */
const HELPERS = new Set([
	'abs', 'average', 'capitalize', 'ceil', 'coalesce', 'contains', 'currency', 'date',
	'default', 'endsWith', 'first', 'floor', 'indexOf', 'isArray', 'isBoolean', 'isDefined',
	'isEmpty', 'isNotEmpty', 'isNumber', 'isObject', 'isString', 'isUndefined', 'join', 'json',
	'last', 'length', 'lowercase', 'max', 'min', 'number', 'padEnd', 'padStart', 'parseJson',
	'percent', 'replace', 'round', 'slice', 'split', 'startsWith', 'sum', 'time', 'titleCase',
	'trim', 'truncate', 'uppercase'
]);

const KEYWORDS = new Set([
	'if', 'unless', 'each', 'with', 'else', 'this', 'true', 'false', 'null', 'undefined'
]);

const MUSTACHE = /\{\{([^}]*)\}\}/g;
const IDENT = /[a-zA-Z_][\w.]*/g;

/**
 * @param {string} html
 * @returns {string[]} input names, source order, deduped
 */
export function extractInputs(html) {
	const out = [];
	const seen = new Set();

	for (const m of String(html || '').matchAll(MUSTACHE)) {
		let body = m[1].trim();
		if (!body) continue;
		if (/^[/!>]/.test(body)) continue;
		body = body.replace(/^[#^&]\s*/, '');
		body = body.replace(/"[^"]*"|'[^']*'/g, ' ');

		for (const idMatch of body.matchAll(IDENT)) {
			const name = idMatch[0];
			if (KEYWORDS.has(name) || HELPERS.has(name) || name.startsWith('@')) continue;
			if (seen.has(name)) continue;
			seen.add(name);
			out.push(name);
		}
	}

	return out;
}
