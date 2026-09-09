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

	return { html: out, samples, variables };
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
