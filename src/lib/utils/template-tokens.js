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

/**
 * What KIND of value a token wants, guessed from its name.
 *
 * A guess, and only ever used to pick an input control and a starting sample —
 * never to validate. Getting it wrong costs someone a different keyboard on
 * mobile, not a rejected render.
 *
 * Lived inline in the template workspace route; it is here so the tool editors
 * and the app agree about what `{{issued_on}}` is.
 */
export function typeFor(tokenName) {
	const n = String(tokenName || '').toLowerCase();
	if (/(^|_)(date|issued_on|expires|day)($|_)/.test(n)) return 'date';
	if (/(image|img|logo|photo|avatar|signature)_?url$|^(image|img|logo|photo|avatar)$/.test(n))
		return 'image';
	if (/url$|^link$/.test(n)) return 'url';
	if (/colou?r$/.test(n)) return 'color';
	return 'text';
}

/**
 * A starting value for a token, so Inputs is never a column of empty boxes.
 *
 * WHY PRE-FILL AT ALL. An empty field asks the visitor to invent test data
 * before they can see what the design does with it, and an empty variable
 * renders as a hole — the card looks broken and they blame the template. A
 * plausible value means the first thing they see is the design working.
 *
 * The values are obviously placeholders (Ada Lovelace, Acme) rather than
 * plausible-but-real-looking data. Someone must not be able to download a
 * certificate that appears to belong to an actual person they did not name.
 *
 * IMAGES ARE LEFT EMPTY on purpose: a guessed image URL is a broken image, and
 * a broken image reads as a bug in the tool rather than as a blank to fill.
 */
export function defaultSampleFor(tokenName, type = typeFor(tokenName)) {
	const n = String(tokenName || '').toLowerCase();
	if (type === 'image') return '';
	if (type === 'url') return 'https://example.com';
	if (type === 'color') return '#1B3A6B';
	if (type === 'date') {
		return new Date().toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
	if (/(^|_)(name|recipient|attendee|student|author|holder)($|_)/.test(n)) return 'Ada Lovelace';
	if (/email/.test(n)) return 'ada@example.com';
	if (/(company|organisation|organization|issuer|brand|site)/.test(n)) return 'Acme';
	if (/(role|title_role|position)$/.test(n)) return 'Speaker';
	if (/(course|program|achievement)/.test(n)) return 'the Advanced Training Program';
	if (/(price|amount|total|subtotal|tax)/.test(n)) return '1,240.00';
	// An invoice NUMBER is an identifier, not a count — `/number/` matching both
	// gave `invoice_number` the value "3".
	if (/(^|_)(invoice|order|ref|reference)(_?(no|number|id))?($|_)/.test(n)) return 'INV-2043';
	if (/(^|_)(qty|quantity|count|score)($|_)/.test(n)) return '3';
	if (/(title|heading|headline)/.test(n)) return 'Your headline goes here';
	if (/(description|subtitle|summary|tagline|caption)/.test(n)) {
		return 'A short line that says what this is.';
	}
	// Fall back to the token's own name, humanised — still obviously a sample,
	// and it shows the visitor which box feeds which part of the design.
	return String(tokenName || '')
		.replace(/[_-]+/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
}
