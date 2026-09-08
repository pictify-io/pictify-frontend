/**
 * Handlebars logic in the visual editor. PS-10 (board PS-05 `KDV-0`).
 *
 * Reported by a user as "this template is messed up now, specially due to
 * handlebar conditions and code being displayed weirdly". The stage showed
 * `{{#if firstName}}` as literal text in the middle of a sentence, because
 * everything upstream treated a template as HTML with `{{tokens}}` in it. Real
 * platform templates are Handlebars documents that happen to contain HTML.
 *
 * PARSE, DO NOT REGEX. `Handlebars.parse` is the same parser the renderer
 * uses, so what the studio believes about a template and what the server does
 * with it cannot drift. A regex would disagree the first time it met
 * `{{else if}}`, a `{{! comment }}`, a subexpression or a string parameter
 * containing a brace.
 *
 * BYTE-FOR-BYTE IS THE WHOLE CONTRACT, and it is why every piece of literal
 * Handlebars is SLICED FROM THE SOURCE rather than rebuilt from the AST.
 * Reconstructing `{{#if firstName}}` prints something equivalent, not
 * something identical — whitespace control (`{{~#if`), quoting and spacing all
 * differ — and a studio that silently rewrites a working template's logic on
 * open is worse than one that refuses to show it.
 */

import Handlebars from 'handlebars';

export const WRAPPER = 'pictify-logic';
export const BRANCH = 'pictify-branch';
/**
 * A mustache that is more than a bare name: a helper call, parameters, a hash
 * or a subexpression. `{{firstName}}` stays literal text — the stage already
 * treats a bare token as a binding — but `{{default planName "PRO TRIAL"}}` is
 * NOT a binding and must not be edited as if it were text.
 */
export const EXPR = 'pictify-expr';

/** Blocks whose content is one of these is inline; anything else is a box. */
const PHRASING = new Set([
	'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn', 'em',
	'i', 'img', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong',
	'sub', 'sup', 'time', 'u', 'var', 'wbr'
]);

const esc = (s) =>
	String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

const unesc = (s) =>
	String(s ?? '')
		.replace(/&quot;/g, '"')
		.replace(/&gt;/g, '>')
		.replace(/&lt;/g, '<')
		.replace(/&amp;/g, '&');

/**
 * Handlebars reports positions as line/column; slicing needs offsets.
 * Built once per parse rather than counting newlines per node, which is the
 * difference between linear and quadratic on a 12KB template.
 */
function offsetIndex(source) {
	const starts = [0];
	for (let i = 0; i < source.length; i++) if (source[i] === '\n') starts.push(i + 1);
	return (loc) => starts[loc.line - 1] + loc.column;
}

/**
 * The expression a node is about, as written.
 *
 * For a BLOCK the helper name is not part of it: `{{#if firstName}}` is a
 * condition ON `firstName`, and the chip says `IF firstName` — repeating the
 * helper inside the expression would render `IF if firstName`.
 *
 * For a MUSTACHE the whole call IS the expression, because
 * `{{default planName "PRO TRIAL"}}` has no shorter honest description.
 */
function expressionOf(node, src, at, { isBlock = false } = {}) {
	if (!node?.path) return '';
	const params = node.params || [];
	const first = isBlock ? params[0] || node.path : node.path;
	const last = node.hash || params[params.length - 1] || node.path;
	return src.slice(at(first.loc.start), at(last.loc.end));
}

/**
 * Turn a Handlebars document into HTML the stage can mount.
 *
 * Returns `{ html, wellFormed, reason, blocks }`. `wellFormed` is not decided
 * here — it cannot be, without a DOM — but everything needed to decide it is
 * carried on the wrappers. See `checkRoundTrip`.
 */
export function toStageHtml(source) {
	const src = String(source ?? '');
	if (!src.trim()) return { html: src, blocks: [], expressions: [], ok: true };
	/*
	 * Plain HTML never reaches the parser. Campaign cards and most designs have
	 * no Handlebars in them at all, and `Handlebars.parse` can still throw on
	 * one — a stray `}}` inside a CSS string is enough. Without this, every
	 * document in the product would be one unlucky brace away from the
	 * read-only gate, for a document that has no logic to protect.
	 */
	if (!src.includes('{{')) return { html: src, blocks: [], expressions: [], ok: true };

	let ast;
	try {
		ast = Handlebars.parse(src);
	} catch (err) {
		// A template that does not parse is shown as-is rather than mangled; the
		// code pane is where a broken document gets fixed.
		return { html: src, blocks: [], expressions: [], ok: false, reason: err.message };
	}

	const at = offsetIndex(src);
	const blocks = [];
	const expressions = [];

	const emitProgram = (program) => (program?.body || []).map(emit).join('');

	function emit(node) {
		switch (node.type) {
			case 'ContentStatement':
				// `original` is the text before whitespace control stripped it; the
				// stage must show what the author wrote.
				return src.slice(at(node.loc.start), at(node.loc.end));

			case 'MustacheStatement':
			case 'SubExpression': {
				const raw = src.slice(at(node.loc.start), at(node.loc.end));

				/*
				 * A BARE `{{name}}` STAYS LITERAL TEXT. The stage's binding
				 * detection already recognises it, the rail offers Change on it, and
				 * wrapping it would be churn for no gain.
				 */
				if (isBareToken(node)) return raw;

				/*
				 * ANYTHING ELSE BECOMES A CHIP. `{{default planName "PRO TRIAL"}}`
				 * and `{{uppercase (slice firstName 0 1)}}` printed as thirty-odd
				 * literal characters on the canvas — the avatar was a one-character
				 * circle holding the whole call — and the rail read the element as
				 * plain text, so Edit text would have overwritten the helper call
				 * with whatever was typed. That is the exact hazard `setText`
				 * already refuses for a bare binding; a helper call is not less
				 * fragile than a bare one.
				 *
				 * The paths inside are still reported as bindings, so Inputs and
				 * Change keep working on `planName` and `firstName`.
				 */
				const paths = pathsIn(node);
				expressions.push({ raw, helper: node.path?.original || '', paths });
				return (
					`<${EXPR} data-hb-raw="${esc(raw)}"` +
					` data-hb-helper="${esc(node.path?.original || '')}"` +
					` data-hb-paths="${esc(paths.join(','))}"` +
					`>${esc(labelFor(node, raw, paths))}</${EXPR}>`
				);
			}

			case 'BlockStatement': {
				const blockStart = at(node.loc.start);
				const blockEnd = at(node.loc.end);
				const progStart = node.program ? at(node.program.loc.start) : blockStart;
				const progEnd = node.program ? at(node.program.loc.end) : blockStart;

				const open = src.slice(blockStart, progStart);
				const thenInner = emitProgram(node.program);

				let elseOpen = '';
				let elseInner = '';
				let close;
				if (node.inverse) {
					const invStart = at(node.inverse.loc.start);
					const invEnd = at(node.inverse.loc.end);
					elseOpen = src.slice(progEnd, invStart);
					elseInner = emitProgram(node.inverse);
					close = src.slice(invEnd, blockEnd);
				} else {
					close = src.slice(progEnd, blockEnd);
				}

				const kind = node.path?.original || 'block';
				const expr = expressionOf(node, src, at, { isBlock: true });
				const inline = isPhrasingOnly(src.slice(progStart, progEnd));

				blocks.push({ kind, expression: expr, hasElse: Boolean(node.inverse) });

				/*
				 * Custom elements, not divs. DOMPurify can be told about exactly
				 * these two, the serializer can find them unambiguously, and no
				 * template can contain one by accident — a `<div data-hb>` could
				 * collide with the author's own markup.
				 *
				 * `display:contents` for block content so the wrapper adds no box to
				 * the layout; `inline` when the branch is phrasing, so a conditional
				 * mid-sentence does not break the line.
				 */
				return (
					`<${WRAPPER} data-hb-kind="${esc(kind)}" data-hb-expr="${esc(expr)}"` +
					` data-hb-open="${esc(open)}" data-hb-close="${esc(close)}"` +
					` style="display:${inline ? 'inline' : 'contents'}">` +
					`<${BRANCH} data-hb-branch="then">${thenInner}</${BRANCH}>` +
					(node.inverse
						? `<${BRANCH} data-hb-branch="else" data-hb-open="${esc(elseOpen)}">${elseInner}</${BRANCH}>`
						: '') +
					`</${WRAPPER}>`
				);
			}

			case 'CommentStatement':
			case 'PartialStatement':
			case 'PartialBlockStatement':
			default:
				return src.slice(at(node.loc.start), at(node.loc.end));
		}
	}

	return { html: emitProgram(ast), blocks, expressions, ok: true };
}

/** Does this fragment contain only phrasing content (so the wrapper can be inline)? */
function isPhrasingOnly(fragment) {
	const tags = [...String(fragment).matchAll(/<\s*([a-zA-Z][\w-]*)/g)].map((m) => m[1].toLowerCase());
	return tags.every((t) => PHRASING.has(t));
}

/**
 * Unwrap stage HTML back to a Handlebars document.
 *
 * A scanner rather than a DOM walk, for the same reason `code-map.js` is one:
 * this has to run on a STRING and put back exactly the bytes that were taken
 * out. Going through a DOM would re-serialise the surrounding HTML too, and
 * the caller has not asked for that.
 */
export function fromStageHtml(html) {
	const src = String(html ?? '');
	let out = '';
	let i = 0;

	while (i < src.length) {
		const blockAt = src.indexOf(`<${WRAPPER}`, i);
		const exprAt = src.indexOf(`<${EXPR}`, i);

		/*
		 * Expression chips are unwrapped here too, and whichever comes FIRST is
		 * handled first — an expression can sit inside a branch and a branch can
		 * sit inside a sentence, so scanning for one and then the other would
		 * emit them out of order.
		 */
		if (exprAt !== -1 && (blockAt === -1 || exprAt < blockAt)) {
			out += src.slice(i, exprAt);
			const tagEnd = src.indexOf('>', exprAt);
			if (tagEnd === -1) {
				out += src.slice(exprAt);
				break;
			}
			const close = findClose(src, tagEnd + 1, EXPR);
			if (close === -1) {
				out += src.slice(exprAt);
				break;
			}
			// `data-hb-raw` is the source, never the visible label: the label is a
			// rendering of the call and would not parse as one.
			const m = /data-hb-raw="([^"]*)"/.exec(src.slice(exprAt, tagEnd + 1));
			out += m ? unesc(m[1]) : '';
			i = close.end;
			continue;
		}

		const open = blockAt;
		if (open === -1) {
			out += src.slice(i);
			break;
		}
		out += src.slice(i, open);

		const tagEnd = src.indexOf('>', open);
		if (tagEnd === -1) {
			out += src.slice(open);
			break;
		}
		const tag = src.slice(open, tagEnd + 1);
		const close = findClose(src, tagEnd + 1, WRAPPER);
		if (close === -1) {
			// Unbalanced: emit what is there rather than dropping the rest of the
			// document. A half-written wrapper is a bug, not a reason to lose text.
			out += src.slice(open);
			break;
		}

		const inner = src.slice(tagEnd + 1, close.start);
		const attr = (name) => {
			const m = new RegExp(`${name}="([^"]*)"`).exec(tag);
			return m ? unesc(m[1]) : '';
		};

		const branches = readBranches(inner);
		out +=
			attr('data-hb-open') +
			(branches.then ?? '') +
			(branches.elseOpen ?? '') +
			(branches.else ?? '') +
			attr('data-hb-close');

		i = close.end;
	}
	return out;
}

/** The matching close tag for a wrapper, allowing for nesting. */
function findClose(src, from, tagName) {
	const openRe = new RegExp(`<${tagName}[\\s>]`, 'g');
	const closeRe = new RegExp(`</${tagName}\\s*>`, 'g');
	let depth = 0;
	let i = from;
	while (i < src.length) {
		openRe.lastIndex = i;
		closeRe.lastIndex = i;
		const o = openRe.exec(src);
		const c = closeRe.exec(src);
		if (!c) return -1;
		if (o && o.index < c.index) {
			depth++;
			i = o.index + 1;
			continue;
		}
		if (depth === 0) return { start: c.index, end: c.index + c[0].length };
		depth--;
		i = c.index + 1;
	}
	return -1;
}

/** Split a wrapper's inner HTML into its then/else parts, recursing on nesting. */
function readBranches(inner) {
	const result = { then: '', else: null, elseOpen: '' };
	let i = 0;
	while (i < inner.length) {
		const open = inner.indexOf(`<${BRANCH}`, i);
		if (open === -1) break;
		const tagEnd = inner.indexOf('>', open);
		if (tagEnd === -1) break;
		const tag = inner.slice(open, tagEnd + 1);
		const close = findClose(inner, tagEnd + 1, BRANCH);
		if (close === -1) break;

		const body = fromStageHtml(inner.slice(tagEnd + 1, close.start));
		if (/data-hb-branch="else"/.test(tag)) {
			const m = /data-hb-open="([^"]*)"/.exec(tag);
			result.elseOpen = m ? unesc(m[1]) : '';
			result.else = body;
		} else {
			result.then = body;
		}
		i = close.end;
	}
	return result;
}

/**
 * Does this document survive the trip?
 *
 * THE ROUND TRIP IS THE WELL-FORMEDNESS TEST, which is both simpler and
 * stricter than inspecting parents. A block that opens in one element and
 * closes in another cannot be wrapped without moving markup, and the proof of
 * that is that unwrapping does not give the source back. Rather than guess at
 * structure, try it and check.
 *
 * `normalise` is supplied by the caller because it needs a DOM: the comparison
 * must ignore the rewriting DOMParser does anyway (`<br/>` to `<br>`, quote
 * style, tag case) and isolate what the wrapping changed.
 */
export function checkRoundTrip(source, normalise = (s) => s) {
	const staged = toStageHtml(source);
	if (!staged.ok) return { wellFormed: false, reason: 'This template does not parse yet.' };
	if (!staged.blocks.length) return { wellFormed: true, blocks: [] };

	const back = fromStageHtml(staged.html);
	if (normalise(back) === normalise(source)) return { wellFormed: true, blocks: staged.blocks };
	return {
		wellFormed: false,
		blocks: staged.blocks,
		reason: 'This template’s logic spans elements · edit it in Code'
	};
}

/**
 * Variable names the document reads, from the AST rather than a token regex.
 *
 * A regex sees `{{default planName "PRO TRIAL"}}` as one token called
 * `default`; the AST sees a helper with a path parameter, which is the thing
 * the Inputs rail should list.
 */
export function variablesFrom(source) {
	let ast;
	try {
		ast = Handlebars.parse(String(source ?? ''));
	} catch {
		return [];
	}
	const names = [];
	const add = (path) => {
		if (!path || path.type !== 'PathExpression') return;
		const name = path.original;
		if (!name || name.startsWith('@') || name === 'this' || name === '.') return;
		if (!names.includes(name)) names.push(name);
	};

	const walk = (node) => {
		if (!node || typeof node !== 'object') return;
		if (node.type === 'MustacheStatement' || node.type === 'BlockStatement' || node.type === 'SubExpression') {
			// The path of a helper call is the HELPER, not a variable — its
			// parameters are. A bare mustache's path is the variable.
			const isHelper = (node.params?.length || 0) > 0 || node.hash;
			if (!isHelper) add(node.path);
			(node.params || []).forEach((p) => (p.type === 'PathExpression' ? add(p) : walk(p)));
			(node.hash?.pairs || []).forEach((pair) => walk(pair.value));
		}
		(node.body || []).forEach(walk);
		if (node.program) walk(node.program);
		if (node.inverse) walk(node.inverse);
	};
	walk(ast);
	return names;
}

/**
 * Is this mustache a bare `{{name}}`?
 *
 * No parameters, no hash, and a plain path — which is exactly the shape the
 * stage's binding detection already handles.
 */
function isBareToken(node) {
	if (node.type !== 'MustacheStatement') return false;
	if (node.params?.length || node.hash) return false;
	return node.path?.type === 'PathExpression';
}

/** Every variable path referenced anywhere inside an expression, in order. */
function pathsIn(node) {
	const out = [];
	const visit = (n) => {
		if (!n || typeof n !== 'object') return;
		if (n.type === 'PathExpression') {
			// `@index` and `this` are not inputs.
			if (!n.data && n.original !== 'this' && n.parts?.length) {
				const name = n.parts.join('.');
				if (!out.includes(name)) out.push(name);
			}
			return;
		}
		for (const param of n.params || []) visit(param);
		for (const pair of n.hash?.pairs || []) visit(pair.value);
	};
	// The path of the mustache ITSELF is the helper name, not an input, so the
	// walk starts at the parameters.
	for (const param of node.params || []) visit(param);
	for (const pair of node.hash?.pairs || []) visit(pair.value);
	// A path with parameters is a helper call; a path with none IS the value.
	if (!node.params?.length && !node.hash && node.path?.type === 'PathExpression') {
		visit(node.path);
	}
	return out;
}

/**
 * What the chip says.
 *
 * `planName · default "PRO TRIAL"` reads as "this shows planName, falling back
 * to PRO TRIAL", which is the thing someone looking at the canvas wants to
 * know. A subexpression has no single subject to lead with, so it shows the
 * call itself rather than pretending otherwise.
 */
function labelFor(node, raw, paths) {
	const inner = raw.replace(/^\{\{~?/, '').replace(/~?\}\}$/, '').trim();
	const nested = (node.params || []).some((p) => p.type === 'SubExpression');
	if (nested || !paths.length) return inner;
	const helper = node.path?.original || '';
	const rest = inner.startsWith(helper) ? inner.slice(helper.length).trim() : inner;
	const args = rest.replace(paths[0], '').trim();
	return args ? `${paths[0]} · ${helper} ${args}` : `${paths[0]} · ${helper}`;
}

/**
 * Canvas chrome for the logic wrappers.
 *
 * Authoring chrome only — mounted when the stage is editable or select-only,
 * never in Preview, where a chip would be a thing the buyer sees that is not
 * in their design.
 *
 * It draws on `pictify-logic` rather than replacing the branch content, so
 * WHAT IS ON THE CANVAS IS STILL THE DESIGN: the then-branch renders in place,
 * in its real position, with its real styling, and the chip sits outside the
 * layout on an `outline` (not a border, which would occupy space and move
 * everything a pixel).
 *
 * The else-branch is HIDDEN BY DEFAULT and marked, because both branches drawn
 * at once is not a state the renderer can ever produce — it would show two
 * greetings in a sentence that has one.
 */
export const LOGIC_CHROME_CSS = `
[data-pictify-chrome="on"] ${WRAPPER}{
  outline:1px dashed rgba(120,86,255,.55);outline-offset:2px;border-radius:2px;
}
[data-pictify-chrome="on"] ${WRAPPER}::before{
  content:attr(data-hb-kind) " " attr(data-hb-expr);
  position:absolute;transform:translateY(-100%);
  font:600 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;
  letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;
  background:rgba(120,86,255,.92);color:#fff;padding:1px 5px;border-radius:2px;
  pointer-events:none;z-index:2147483000;
}
/* A chip needs a containing block to hang off, and display:contents has no
   box at all - so only the inline wrappers get positioned, and a block wrapper
   pins its chip to the first child instead. */
[data-pictify-chrome="on"] ${WRAPPER}[style*="inline"]{position:relative}
[data-pictify-chrome="on"] ${WRAPPER}[style*="contents"]::before{position:static;display:block;width:fit-content}
[data-pictify-chrome="on"] ${BRANCH}[data-hb-branch="else"]{display:none}

/* An expression chip. Sized in em and inheriting line-height so a chip inside
   a headline stays inside the headline instead of pushing the line apart, and
   never wraps mid-call - a broken helper call is unreadable. */
${EXPR}{
  display:inline-block;vertical-align:baseline;white-space:nowrap;
  max-width:100%;overflow:hidden;text-overflow:ellipsis;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:.82em;font-weight:500;line-height:inherit;
  padding:0 .32em;border-radius:3px;
  background:rgba(120,86,255,.14);color:inherit;
  box-shadow:inset 0 0 0 1px rgba(120,86,255,.42);
}
/* Preview is what the recipient gets: no chrome, and the server render replaces
   the frame anyway - this only matters for the moment before it arrives. */
[data-pictify-chrome="off"] ${EXPR}{
  background:none;box-shadow:none;padding:0;font-family:inherit;font-size:inherit;
}
[data-pictify-chrome="on"][data-pictify-else="show"] ${BRANCH}[data-hb-branch="else"]{
  display:inline;outline:1px dashed rgba(148,163,184,.7);outline-offset:2px;opacity:.55;
}
`;
