/**
 * Turning a tool template into a real template.
 *
 * The tool templates were written to be driven by DOM surgery — the old pages
 * looked up `#template-heading` and wrote into it. That is why they contain
 * sample prose rather than `{{tokens}}`, and why the editor's Inputs tab found
 * nothing to show and "Save to Pictify" would have produced a template with no
 * API contract at all.
 *
 * The ids are the contract, and they already exist: every OG and LinkedIn
 * template carries `id="template-heading"` and `id="template-subheading"`, and
 * the invoices carry a dozen semantic ones. So the editable parts are known
 * exactly, and nothing here has to guess which prose is content and which is
 * decoration.
 *
 * DONE ON LOAD, NOT BY REWRITING THE FILES. The templates stay valid standalone
 * HTML with readable sample text — which is what other consumers of
 * `/api/tools/templates/*` still get, and what makes a diff of them reviewable.
 * Tokenising here is also reversible: if a rule is wrong, no file was harmed.
 *
 * THE TEMPLATE'S OWN TEXT BECOMES THE SAMPLE. "Full Stack Developer • React"
 * is a better default than anything a generic table could invent, and it means
 * the canvas looks exactly as its designer intended on first paint.
 *
 * A SCANNER, not a DOM parse, for the reason given in code-map.js: this runs
 * over the author's own markup and must not rewrite the parts it is not
 * changing. A parse-and-reserialise would quietly restyle every attribute in
 * the file.
 */

/** `template-sub-heading` → `sub_heading`; the invoice's `client-name` → `client_name`. */
export function tokenFor(id) {
	return String(id || '')
		.replace(/^template-/, '')
		.replace(/[^A-Za-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.toLowerCase();
}

/** Elements whose SRC is the value, not their text. */
const IMAGE_TAGS = new Set(['img', 'image']);

const attrOf = (tag, name) => {
	const m = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag);
	return m ? (m[2] ?? m[3] ?? '') : null;
};

/**
 * `{ html, samples, variables }`.
 *
 * `samples` maps token → the text that was there, so Inputs opens pre-filled
 * with the design's own words. `variables` is the token list in document order.
 */
export function tokeniseTemplate(source) {
	const src = String(source ?? '');
	if (!src) return { html: '', samples: {}, variables: [] };

	const samples = {};
	const variables = [];
	/*
	 * Whether the template STATED any fields, which is different from whether
	 * any could be tokenised. A template that names `template-heading` on a
	 * container has declared its contract; if that element holds layout and
	 * cannot take a token, the answer is "no fields here" — not "go and infer
	 * some from the design", which would tokenise whatever text happened to sit
	 * nearby instead.
	 */
	let declaresFields = false;
	let out = '';
	let i = 0;

	while (i < src.length) {
		const at = src.indexOf('id=', i);
		if (at === -1) {
			out += src.slice(i);
			break;
		}
		// Back up to the '<' that opens this tag; if there is none, it is not a tag.
		const lt = src.lastIndexOf('<', at);
		const gt = src.indexOf('>', at);
		if (lt === -1 || gt === -1 || src.slice(lt, at).includes('>')) {
			out += src.slice(i, at + 3);
			i = at + 3;
			continue;
		}

		const tag = src.slice(lt, gt + 1);
		const name = /^<\s*([a-zA-Z][^\s/>]*)/.exec(tag)?.[1]?.toLowerCase();
		const id = attrOf(tag, 'id');
		const token = id ? tokenFor(id) : '';

		if (!token || !name) {
			out += src.slice(i, gt + 1);
			i = gt + 1;
			continue;
		}
		declaresFields = true;

		if (IMAGE_TAGS.has(name)) {
			/*
			 * An image's value is its src. The original url is kept as the sample so
			 * the canvas still shows the designer's placeholder mark rather than a
			 * broken image the moment it is tokenised.
			 */
			const current = attrOf(tag, 'src') ?? '';
			const varName = token.endsWith('_url') ? token : `${token}_url`;
			if (!(varName in samples)) {
				samples[varName] = current;
				variables.push(varName);
			}
			out += src.slice(i, lt) + tag.replace(/src\s*=\s*("[^"]*"|'[^']*')/i, `src="{{${varName}}}"`);
			i = gt + 1;
			continue;
		}

		const close = src.toLowerCase().indexOf(`</${name}`, gt);
		if (close === -1) {
			out += src.slice(i, gt + 1);
			i = gt + 1;
			continue;
		}
		const inner = src.slice(gt + 1, close);

		/*
		 * ONLY TEXT IS REPLACED, never an element.
		 *
		 * A leaf is the easy case. But real headings carry inline markup —
		 * `<h1 id="template-heading"><span>&lt;/&gt;</span> Your Name</h1>` — and
		 * skipping those left the most important variable in the whole template
		 * undeclared. So the longest bare text run inside the element becomes the
		 * token and every child element is left exactly where it was: the design
		 * inside cannot be eaten, because nothing that looks like a tag is ever
		 * touched.
		 */
		const run = longestTextRun(inner);
		if (!run) {
			out += src.slice(i, gt + 1);
			i = gt + 1;
			continue;
		}

		if (!(token in samples)) {
			samples[token] = run.text;
			variables.push(token);
		}
		out +=
			src.slice(i, gt + 1) +
			inner.slice(0, run.start) +
			`{{${token}}}` +
			inner.slice(run.end);
		i = close;
	}

	/*
	 * Only for sets that carry no contract of any kind.
	 *
	 * A document that ALREADY holds `{{tokens}}` has one — the certificate
	 * templates arrive that way, their fields named by the render function.
	 * Inferring on top of that added `label`, `label_2`, `label_3` for the fixed
	 * chrome ("CERTIFICATE", "ORGANIZATION", "DATE"), which is not content and
	 * just buries the four fields that are.
	 */
	if (!variables.length && !declaresFields && !/\{\{\s*[A-Za-z0-9_.]+\s*\}\}/.test(src)) {
		return inferFields(src);
	}

	return { html: out, samples, variables };
}

/**
 * Work out the fields of a template that declares none.
 *
 * The OG, LinkedIn and invoice sets carry `id="template-…"`, so their contract
 * is stated. The pSEO sets are eighteen templates of inline-styled `<div>`s
 * with no ids, no data attributes and no tokens — swapping to one gave the
 * visitor an empty Inputs tab and a design they could only edit by clicking.
 *
 * SIZE IS THE SIGNAL, because it is the one the designer already used: the
 * biggest text in a card is its heading, the next is its subheading, and small
 * letter-spaced capitals are an eyebrow. That is a reading of the design, not a
 * guess about its meaning, and it produces the same answer every time.
 *
 * It is deliberately a FALLBACK. A template that states its own fields is
 * always believed over this.
 */
const ROLE_NAMES = ['heading', 'subheading', 'body', 'detail', 'footnote'];
const MAX_INFERRED = 6;

export function inferFields(source) {
	const src = String(source ?? '');
	const found = [];

	/*
	 * ELEMENTS WHOSE CONTENT IS NOT TEXT, whatever it looks like to a regex.
	 * A `<style>` block is the longest run of "words" in most documents, so
	 * without this the top-ranked field is the entire stylesheet: accepting the
	 * proposal replaced every rule in the starter with `{{heading}}` and the
	 * design lost its CSS. Measured on /tools/html-to-png.
	 */
	const OPAQUE = /^(style|script|title|noscript|template|textarea|svg|code|pre)$/i;

	// Text-bearing leaves, with whatever font-size their own style declares.
	const re = /<([a-zA-Z][^\s/>]*)([^>]*)>([^<]*)<\/\1>/g;
	let m;
	while ((m = re.exec(src))) {
		if (OPAQUE.test(m[1])) continue;
		const text = m[3].trim();
		// Anything already a token is someone else's field.
		if (!text || /\{\{/.test(text)) continue;
		/*
		 * WORDS ONLY. Without this the biggest "text" in a badge is the ★ glyph
		 * and the avatar's "JA" initials outrank the author's name — someone
		 * editing `{{heading}}` expecting the title would get a star. A field has
		 * to be something a person would type: at least four letters, or two
		 * words.
		 */
		const letters = (text.match(/[A-Za-z]/g) || []).length;
		const words = text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
		if (letters < 4 && words < 2) continue;
		const attrs = m[2] || '';
		const size = Number(/font-size:\s*(\d+(?:\.\d+)?)px/i.exec(attrs)?.[1] || 0);
		const upper = /text-transform:\s*uppercase/i.test(attrs) || text === text.toUpperCase();
		const spaced = /letter-spacing/i.test(attrs);
		found.push({ start: m.index + m[0].indexOf(m[3]), end: m.index + m[0].indexOf(m[3]) + m[3].length, text, size, eyebrow: upper && spaced });
	}
	if (!found.length) return { html: src, samples: {}, variables: [] };

	/*
	 * Ranked by size, but an eyebrow is named for what it is rather than by its
	 * rank — a 22px label above a 64px headline is not the second-most
	 * important line, it is a label.
	 */
	const ranked = [...found].sort((a, b) => b.size - a.size);
	const names = new Map();
	let role = 0;
	let eyebrows = 0;
	let extras = 0;
	for (const node of ranked.slice(0, MAX_INFERRED)) {
		let name;
		if (node.eyebrow) name = eyebrows++ ? `label_${eyebrows}` : 'label';
		else if (role < ROLE_NAMES.length) name = ROLE_NAMES[role++];
		else name = `text_${++extras}`;
		names.set(node, name);
	}

	// Rewritten back to front so earlier offsets stay valid.
	const chosen = [...names.keys()].sort((a, b) => b.start - a.start);
	let html = src;
	const samples = {};
	for (const node of chosen) {
		const name = names.get(node);
		samples[name] = node.text;
		html = html.slice(0, node.start) + `{{${name}}}` + html.slice(node.end);
	}
	// Document order, so Inputs reads down the design rather than by size.
	const variables = [...names.keys()]
		.sort((a, b) => a.start - b.start)
		.map((n) => names.get(n));
	return { html, samples, variables };
}

/**
 * The longest stretch of plain text inside some markup, as `{ start, end, text }`.
 *
 * "Longest" because an element often holds a label and the value — an icon, a
 * bullet, a separator — and the value is the long one. Returns null when there
 * is nothing but tags and whitespace, which is what keeps a purely structural
 * wrapper from being given a variable it has no text for.
 */
function longestTextRun(inner) {
	let best = null;
	let depth = 0;
	let runStart = 0;
	let i = 0;
	const consider = (start, end) => {
		const raw = inner.slice(start, end);
		if (!raw.trim()) return;
		/*
		 * Trimmed bounds, so the whitespace AROUND the text survives. Swallowing
		 * it ran the icon into the name — `</>{{heading}}` renders as `</>Ada`.
		 */
		const lead = raw.length - raw.trimStart().length;
		const trail = raw.length - raw.trimEnd().length;
		const text = raw.trim();
		if (!best || text.length > best.text.length) {
			best = { start: start + lead, end: end - trail, text };
		}
	};
	while (i < inner.length) {
		const lt = inner.indexOf('<', i);
		if (lt === -1) {
			if (depth === 0) consider(runStart, inner.length);
			break;
		}
		const gt = inner.indexOf('>', lt);
		if (gt === -1) break;
		if (depth === 0) consider(runStart, lt);
		if (inner[lt + 1] === '/') depth = Math.max(0, depth - 1);
		else if (!/\/>$/.test(inner.slice(lt, gt + 1)) && /^<\s*[a-zA-Z]/.test(inner.slice(lt))) depth += 1;
		i = gt + 1;
		if (depth === 0) runStart = i;
	}
	return best;
}
