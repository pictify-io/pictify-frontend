/**
 * The request, written four ways.
 *
 * Every generator takes the SAME object the playground's `send()` hands to
 * `fetch` — `{ method, url, headers, body }` — so the snippet on screen cannot
 * describe a call different from the one the Send button makes. That was the
 * failure in v1: the curl pane was assembled from its own strings and drifted
 * from the request, so copying it reproduced a call the page had never made.
 *
 * The key is passed in rather than read from a store, because two callers want
 * different values from the same request: the pane renders the masked key and
 * the copy button emits the real one.
 */

const INDENT = '  ';

/**
 * Escape a value into a single-quoted literal.
 *
 * Newlines matter: the sample HTML is multi-line, and a raw newline inside a
 * single-quoted JS, Python or PHP string is a syntax error — the copied snippet
 * would not run. Tabs and carriage returns get the same treatment.
 */
const quote = (v) =>
	`'${String(v)
		.replace(/\\/g, '\\\\')
		.replace(/'/g, "\\'")
		.replace(/\r/g, '\\r')
		.replace(/\n/g, '\\n')
		.replace(/\t/g, '\\t')}'`;

/** Is this a bare identifier, or does it need quoting as an object key? */
const bareKey = (k) => /^[A-Za-z_$][\w$]*$/.test(k);

/**
 * A JavaScript object literal — not JSON. The node snippet reads as code
 * someone would write, which means unquoted keys and single quotes.
 */
export function toJsLiteral(value, depth = 1) {
	const pad = INDENT.repeat(depth);
	const closePad = INDENT.repeat(depth - 1);

	if (value === null) return 'null';
	if (Array.isArray(value)) {
		if (!value.length) return '[]';
		const items = value.map((v) => `${pad}${toJsLiteral(v, depth + 1)}`);
		return `[\n${items.join(',\n')}\n${closePad}]`;
	}
	if (typeof value === 'object') {
		const keys = Object.keys(value);
		if (!keys.length) return '{}';
		const items = keys.map(
			(k) => `${pad}${bareKey(k) ? k : `'${k}'`}: ${toJsLiteral(value[k], depth + 1)}`
		);
		return `{\n${items.join(',\n')}\n${closePad}}`;
	}
	if (typeof value === 'string') return quote(value);
	return String(value);
}

/** A Python literal. `True`/`False`/`None` rather than JSON's spellings. */
export function toPyLiteral(value, depth = 1) {
	const pad = INDENT.repeat(depth);
	const closePad = INDENT.repeat(depth - 1);

	if (value === null) return 'None';
	if (value === true) return 'True';
	if (value === false) return 'False';
	if (Array.isArray(value)) {
		if (!value.length) return '[]';
		return `[\n${value.map((v) => `${pad}${toPyLiteral(v, depth + 1)}`).join(',\n')}\n${closePad}]`;
	}
	if (typeof value === 'object') {
		const keys = Object.keys(value);
		if (!keys.length) return '{}';
		const items = keys.map((k) => `${pad}'${k}': ${toPyLiteral(value[k], depth + 1)}`);
		return `{\n${items.join(',\n')}\n${closePad}}`;
	}
	if (typeof value === 'string') return quote(value);
	return String(value);
}

/** A PHP array literal, in the short `[...]` syntax. */
export function toPhpLiteral(value, depth = 1) {
	const pad = INDENT.repeat(depth);
	const closePad = INDENT.repeat(depth - 1);

	if (value === null) return 'null';
	if (value === true) return 'true';
	if (value === false) return 'false';
	if (Array.isArray(value)) {
		if (!value.length) return '[]';
		return `[\n${value
			.map((v) => `${pad}${toPhpLiteral(v, depth + 1)}`)
			.join(',\n')}\n${closePad}]`;
	}
	if (typeof value === 'object') {
		const keys = Object.keys(value);
		if (!keys.length) return '[]';
		const items = keys.map((k) => `${pad}'${k}' => ${toPhpLiteral(value[k], depth + 1)}`);
		return `[\n${items.join(',\n')}\n${closePad}]`;
	}
	if (typeof value === 'string') return quote(value);
	return String(value);
}

const hasBody = (req) => req.body !== undefined && req.body !== null;

export function toNode(req) {
	const lines = [`const res = await fetch('${req.url}', {`, `${INDENT}method: '${req.method}',`];
	const headerKeys = Object.keys(req.headers || {});
	if (headerKeys.length) {
		lines.push(`${INDENT}headers: {`);
		lines.push(
			headerKeys
				.map((k) => `${INDENT}${INDENT}${bareKey(k) ? k : `'${k}'`}: '${req.headers[k]}'`)
				.join(',\n')
		);
		lines.push(`${INDENT}}${hasBody(req) ? ',' : ''}`);
	}
	if (hasBody(req)) {
		lines.push(`${INDENT}body: JSON.stringify(${toJsLiteral(req.body, 2)})`);
	}
	lines.push('})');
	// The playground's whole point is the answer, so every snippet reads it.
	lines.push('const data = await res.json()');
	return lines.join('\n');
}

export function toPython(req) {
	const fn = req.method.toLowerCase();
	const lines = ['import requests', '', `r = requests.${fn}(`, `${INDENT}'${req.url}',`];
	const headerKeys = Object.keys(req.headers || {});
	if (headerKeys.length) {
		const items = headerKeys
			.map((k) => `${INDENT}${INDENT}'${k}': '${req.headers[k]}'`)
			.join(',\n');
		lines.push(`${INDENT}headers={\n${items}\n${INDENT}}${hasBody(req) ? ',' : ''}`);
	}
	if (hasBody(req)) lines.push(`${INDENT}json=${toPyLiteral(req.body, 2)}`);
	lines.push(')');
	lines.push('print(r.status_code, r.json())');
	return lines.join('\n');
}

export function toCurl(req) {
	const parts = [`curl -X ${req.method} '${req.url}'`];
	for (const [k, v] of Object.entries(req.headers || {})) parts.push(`${INDENT}-H '${k}: ${v}'`);
	if (hasBody(req)) {
		// Single-quoted for the shell, so an apostrophe in the payload has to be
		// closed and re-opened rather than escaped.
		const json = JSON.stringify(req.body, null, 2).replace(/'/g, `'\\''`);
		parts.push(`${INDENT}-d '${json}'`);
	}
	return parts.join(' \\\n');
}

export function toPhp(req) {
	const lines = [
		'<?php',
		`$ch = curl_init('${req.url}');`,
		'curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);'
	];
	if (req.method !== 'GET') lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${req.method}');`);
	const headerKeys = Object.keys(req.headers || {});
	if (headerKeys.length) {
		const items = headerKeys.map((k) => `${INDENT}'${k}: ${req.headers[k]}'`).join(',\n');
		lines.push(`curl_setopt($ch, CURLOPT_HTTPHEADER, [\n${items}\n]);`);
	}
	if (hasBody(req)) {
		lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${toPhpLiteral(req.body, 1)}));`);
	}
	lines.push('$response = curl_exec($ch);', 'curl_close($ch);', 'echo $response;');
	return lines.join('\n');
}

/** Language id → generator, and the highlighter mode each one wants. */
export const SNIPPET_LANGS = [
	{ id: 'NODE', build: toNode, hl: 'js' },
	{ id: 'PYTHON', build: toPython, hl: 'python' },
	{ id: 'CURL', build: toCurl, hl: 'shell' },
	{ id: 'PHP', build: toPhp, hl: 'php' }
];

/** Build one snippet by language id, falling back to node for an unknown id. */
export function buildSnippet(langId, req) {
	const entry = SNIPPET_LANGS.find((l) => l.id === langId) || SNIPPET_LANGS[0];
	return entry.build(req);
}
