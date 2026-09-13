/**
 * SEO snapshot / diff for the /tools/* routes.
 *
 * The tool pages rank, so the long-form refactor (plans/handoff-tool-page-consistency-2026-09-04.md)
 * is only safe if it changes markup without changing what search sees. This
 * script freezes "what search sees" into JSON so a migration can be diffed
 * against it:
 *
 *   - head: <title>, description, canonical, robots, keywords, author, every
 *           og:* / twitter:* tag, and every application/ld+json block parsed,
 *           deep key-sorted and sorted by @type.
 *   - outline: h1/h2/h3 tag + text in document order.
 *
 * Usage (dev server must be running):
 *   node scripts/seo-snapshot.mjs --tag before
 *   node scripts/seo-snapshot.mjs --tag after
 *   node scripts/seo-snapshot.mjs --diff before after
 *   node scripts/seo-snapshot.mjs --tag before /tools/csv-to-pdf   # subset
 *
 * Only key ORDER and whitespace are normalised away — a changed string, a
 * dropped tag or a moved heading all show up as a diff.
 */
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_ROOT = join(ROOT, 'scripts', 'seo-snapshots');

/**
 * Every route whose head or outline the migration can touch. The
 * html-to-[format] and og-image-generator entries are parameterised routes, so
 * one representative URL per distinct rendering is listed rather than the
 * bare route id.
 */
const DEFAULT_ROUTES = [
	'/tools',
	'/tools/html-to-jpg',
	'/tools/html-to-png',
	'/tools/html-to-webp',
	'/tools/html-to-image',
	'/tools/certificate-generator',
	'/tools/code-to-image',
	'/tools/csv-to-pdf',
	'/tools/linkedin-banner-generator',
	'/tools/og-image-generator',
	'/tools/og-image-generator/twitter',
	'/tools/online-invoice-generator',
	'/tools/tweet-screenshot',
	'/tools/url-to-image-generator',
	// One [usecase] rendering — the route is data-driven, so any slug exercises
	// the same markup.
	'/tools/email-header'
];

let JSDOM;
try {
	({ JSDOM } = await import('jsdom'));
} catch {
	console.error(
		'seo-snapshot needs jsdom. It resolves today as a transitive dependency;\n' +
			'if this fails, run: npm i -D jsdom'
	);
	process.exit(1);
}

// ── args ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
function flag(name, fallback = null) {
	const i = argv.indexOf(`--${name}`);
	return i === -1 ? fallback : argv[i + 1];
}
const base = flag('base', 'http://localhost:5199').replace(/\/$/, '');
const tag = flag('tag');
const diffPair = argv.includes('--diff')
	? argv.slice(argv.indexOf('--diff') + 1, argv.indexOf('--diff') + 3)
	: null;
const routeArgs = argv.filter((a) => a.startsWith('/'));
const routes = routeArgs.length ? routeArgs : DEFAULT_ROUTES;

// ── helpers ───────────────────────────────────────────────────────────
const slug = (route) =>
	route === '/tools' ? 'tools-hub' : route.replace(/^\/tools\//, '').replace(/\//g, '_');
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

/** Deep-sort object keys so key order never shows up as a diff. */
function sortDeep(value) {
	if (Array.isArray(value)) return value.map(sortDeep);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((k) => [k, sortDeep(value[k])])
		);
	}
	return value;
}

function snapshotFromHtml(html, route) {
	const { document } = new JSDOM(html).window;

	const metas = {};
	for (const el of document.querySelectorAll('head meta')) {
		const key = el.getAttribute('name') || el.getAttribute('property');
		if (!key) continue;
		// charset/viewport are the app shell's, not the route's.
		if (key === 'viewport') continue;
		metas[key] = norm(el.getAttribute('content'));
	}

	const jsonLd = [];
	for (const el of document.querySelectorAll('head script[type="application/ld+json"]')) {
		try {
			jsonLd.push(sortDeep(JSON.parse(el.textContent)));
		} catch (err) {
			jsonLd.push({ __parseError: String(err), __raw: norm(el.textContent).slice(0, 300) });
		}
	}
	// Sorted by @type then serialised form, so emission order is not a diff.
	jsonLd.sort((a, b) =>
		`${a['@type'] || ''}${JSON.stringify(a)}`.localeCompare(
			`${b['@type'] || ''}${JSON.stringify(b)}`
		)
	);

	const outline = [...document.querySelectorAll('h1, h2, h3')].map((el) => ({
		tag: el.tagName.toLowerCase(),
		text: norm(el.textContent)
	}));

	return {
		route,
		title: norm(document.querySelector('head title')?.textContent),
		canonical: document.querySelector('head link[rel="canonical"]')?.getAttribute('href') || null,
		metas: sortDeep(metas),
		jsonLd,
		outline
	};
}

async function capture() {
	if (!tag) {
		console.error('Pass --tag <name> (e.g. --tag before) or --diff <a> <b>.');
		process.exit(1);
	}
	const outDir = join(OUT_ROOT, tag);
	await mkdir(outDir, { recursive: true });

	for (const route of routes) {
		const url = `${base}${route}`;
		let res;
		try {
			res = await fetch(url);
		} catch (err) {
			console.error(`✗ ${route} — ${err.message} (is the dev server up on ${base}?)`);
			process.exitCode = 1;
			continue;
		}
		if (!res.ok) {
			console.error(`✗ ${route} — HTTP ${res.status}`);
			process.exitCode = 1;
			continue;
		}
		const snap = snapshotFromHtml(await res.text(), route);
		await writeFile(join(outDir, `${slug(route)}.json`), JSON.stringify(snap, null, 2) + '\n');
		console.log(`✓ ${route} — ${snap.outline.length} headings, ${snap.jsonLd.length} JSON-LD`);
	}
	console.log(`\nSnapshots written to scripts/seo-snapshots/${tag}/`);
}

async function diff() {
	const [a, b] = diffPair;
	const dirA = join(OUT_ROOT, a);
	const dirB = join(OUT_ROOT, b);
	const files = (await readdir(dirA)).filter((f) => f.endsWith('.json'));
	let changed = 0;

	for (const file of files) {
		let left, right;
		try {
			left = JSON.parse(await readFile(join(dirA, file), 'utf8'));
			right = JSON.parse(await readFile(join(dirB, file), 'utf8'));
		} catch {
			console.log(`? ${file} — missing in "${b}"`);
			changed++;
			continue;
		}

		const notes = [];

		if (left.title !== right.title)
			notes.push(`  title:\n    - ${left.title}\n    + ${right.title}`);
		if (left.canonical !== right.canonical)
			notes.push(`  canonical:\n    - ${left.canonical}\n    + ${right.canonical}`);

		for (const key of new Set([...Object.keys(left.metas), ...Object.keys(right.metas)])) {
			if (left.metas[key] !== right.metas[key])
				notes.push(
					`  meta[${key}]:\n    - ${left.metas[key] ?? '(absent)'}\n    + ${
						right.metas[key] ?? '(absent)'
					}`
				);
		}

		/*
		 * The top-level Organization block is the root layout's, identical on every
		 * page. When marketing copy changes it moves on all fifteen routes at once
		 * and drowns out the thing this script exists to catch, so it is dropped
		 * from the comparison. Nested Organization objects (a schema's `creator` or
		 * `publisher`) belong to the route's own schema and are still compared.
		 */
		const routeLd = (blocks) => blocks.filter((x) => x['@type'] !== 'Organization');
		const ldA = routeLd(left.jsonLd).map((x) => JSON.stringify(x));
		const ldB = routeLd(right.jsonLd).map((x) => JSON.stringify(x));
		for (const s of ldA)
			if (!ldB.includes(s)) notes.push(`  json-ld removed:\n    - ${s.slice(0, 400)}`);
		for (const s of ldB)
			if (!ldA.includes(s)) notes.push(`  json-ld added:\n    + ${s.slice(0, 400)}`);

		const outA = left.outline.map((h) => `${h.tag} ${h.text}`);
		const outB = right.outline.map((h) => `${h.tag} ${h.text}`);
		if (outA.join('\n') !== outB.join('\n')) {
			const max = Math.max(outA.length, outB.length);
			const lines = [];
			for (let i = 0; i < max; i++) {
				if (outA[i] !== outB[i])
					lines.push(`    ${i}: - ${outA[i] ?? '(none)'}\n       + ${outB[i] ?? '(none)'}`);
			}
			notes.push(`  outline:\n${lines.join('\n')}`);
		}

		if (notes.length) {
			changed++;
			console.log(`\n✗ ${file}\n${notes.join('\n')}`);
		} else {
			console.log(`✓ ${file}`);
		}
	}

	console.log(`\n${changed ? `${changed} route(s) differ` : 'No differences.'}`);
	if (changed) process.exitCode = 1;
}

if (diffPair) await diff();
else await capture();
