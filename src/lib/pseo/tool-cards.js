/**
 * One entry per tool on the counter. The registry the whole hub is computed
 * from (HB-01…HB-04, `plans/handoff-tools-hub-ledger-2026-09-12.md`).
 *
 * ADDING A TOOL IS ADDING AN ENTRY HERE. The /tools ledger row, its shelf, the
 * hero's count, the chip counts, the rail counts, the ItemList, and the "More
 * from the counter" rows on every other tool page all read this file. Nothing
 * downstream is hand-kept: ten routes used to carry a private `RELATED` array
 * and eighteen tools needed eighteen drawings, so a renamed tool had to be
 * found in eleven places and a new one needed an SVG before it could ship.
 *
 * The keys are the URL slug. Per-entry:
 *
 *   shelf     exactly one of SHELVES
 *   inputs[]  HTML · URL · CSV · JSON · MD · TEXT · IMAGES · LOTTIE
 *   outputs[] PNG · JPG · WEBP · SVG · PDF · GIF · MP4 — `outputs[0]` is stamped
 *   aliases[] search-only words, so "receipt" finds the invoice generator
 *   addedAt   ISO date, from the route's first commit; drives the NEW pill
 *   related[] optional hand-picked slugs for the foot; otherwise derived
 *   art       the two wedge cards only, the last two drawings on the page
 *
 * `desc` is the sentence used in structured data, in the foot rows, and as the
 * blurb on the two wedge cards, so those cannot drift.
 */
export const TOOL_CARDS = {
	// ── Documents & PDF ────────────────────────────────────────────────
	'csv-to-pdf': {
		title: 'CSV to PDF',
		meta: 'CSV → PDF',
		href: '/tools/csv-to-pdf',
		desc: 'A spreadsheet in, one polished PDF out. Or one document per row, when you sign in.',
		shelf: 'documents',
		inputs: ['CSV'],
		outputs: ['PDF'],
		aliases: ['spreadsheet', 'excel', 'sheet to pdf', 'mail merge'],
		addedAt: '2026-08-06'
	},
	'certificate-generator': {
		title: 'Certificate generator',
		meta: 'NAMES → CERTIFICATES',
		href: '/tools/certificate-generator',
		art: '/landing/tools/certificate-generator.svg',
		desc: 'Five templates, live preview, clean PNG. Point a sheet at it and every attendee gets theirs.',
		shelf: 'documents',
		inputs: ['TEXT', 'CSV'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['diploma', 'award', 'completion', 'attendee'],
		addedAt: '2026-04-13'
	},

	// ── Markup → image ─────────────────────────────────────────────────
	'html-to-image': {
		title: 'HTML to image',
		meta: 'HTML → PNG · JPG · WEBP',
		href: '/tools/html-to-image',
		art: '/landing/tools/html-to-image.svg',
		desc: 'Convert HTML & CSS to PNG, JPG, or WebP. Free converter with API access.',
		shelf: 'markup',
		inputs: ['HTML'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['screenshot html', 'css to png', 'render html', 'html2image'],
		addedAt: '2025-09-28'
	},
	'code-to-image': {
		title: 'Code to image',
		meta: 'SNIPPET → PNG',
		href: '/tools/code-to-image',
		desc: 'Turn code snippets into beautiful images with themes and fonts.',
		shelf: 'markup',
		inputs: ['TEXT'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['snippet', 'carbon', 'syntax', 'source code'],
		addedAt: '2025-09-19'
	},
	markdown: {
		title: 'Markdown to image',
		meta: 'MD → PNG',
		href: '/tools/markdown',
		desc: 'Convert markdown to shareable images with themes and fonts.',
		shelf: 'markup',
		inputs: ['MD'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['md', 'readme', 'notes'],
		addedAt: '2026-03-11'
	},
	table: {
		title: 'Table to image',
		meta: 'CSV · HTML → PNG',
		href: '/tools/table',
		desc: 'Turn CSV data or HTML tables into polished, shareable table images.',
		shelf: 'markup',
		inputs: ['CSV', 'HTML'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['spreadsheet', 'grid', 'rows', 'sheet'],
		addedAt: '2026-03-11'
	},

	// ── Social & OG ────────────────────────────────────────────────────
	'og-image-generator': {
		title: 'OG image generator',
		meta: 'TITLE · LOGO → 1200×630',
		href: '/tools/og-image-generator',
		desc: 'Create custom Open Graph images for social sharing and search previews.',
		shelf: 'social',
		inputs: ['URL', 'TEXT'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['open graph', 'social card', 'twitter card', 'preview'],
		addedAt: '2025-09-28'
	},
	'tweet-screenshot': {
		title: 'Tweet screenshot',
		meta: 'TWEET URL → PNG',
		href: '/tools/tweet-screenshot',
		desc: 'Paste any tweet URL, edit every field, download a clean PNG. No API key needed.',
		shelf: 'social',
		inputs: ['URL'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['x post', 'twitter', 'quote', 'thread'],
		addedAt: '2026-04-14'
	},
	'linkedin-banner-generator': {
		title: 'LinkedIn banner',
		meta: 'TEMPLATE → 1584×396',
		href: '/tools/linkedin-banner-generator',
		desc: 'Create LinkedIn banners from 20+ templates for developers, marketers, and more.',
		shelf: 'social',
		inputs: ['TEXT'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['cover', 'header', 'profile banner'],
		addedAt: '2026-01-24'
	},
	'social-proof-card': {
		title: 'Social proof card',
		meta: 'REVIEW → PNG',
		href: '/tools/social-proof-card',
		desc: 'Turn a review or testimonial into a branded card image.',
		shelf: 'social',
		inputs: ['URL', 'TEXT'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['testimonial', 'review', 'quote', 'g2'],
		addedAt: '2026-04-08'
	},

	// ── Capture & screenshots ──────────────────────────────────────────
	'url-to-image-generator': {
		title: 'URL to image',
		meta: 'ANY URL → SCREENSHOT',
		href: '/tools/url-to-image-generator',
		desc: 'Screenshot any URL at any size, straight from the browser or the API.',
		shelf: 'capture',
		inputs: ['URL'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['screenshot', 'website', 'page capture', 'thumbnail'],
		addedAt: '2024-10-12'
	},
	'online-invoice-generator': {
		title: 'Invoice generator',
		// The tool's own toolbar offers `['pdf', 'png']`, and the stamp reads
		// `outputs[0]`, so a meta line saying PNG only would contradict a pink
		// PDF stamp sitting next to it.
		meta: 'LINE ITEMS → PDF · PNG',
		href: '/tools/online-invoice-generator',
		desc: 'Create professional invoices quickly with a free online generator.',
		shelf: 'documents',
		inputs: ['TEXT', 'CSV'],
		outputs: ['PDF', 'PNG'],
		aliases: ['receipt', 'bill', 'quote', 'billing'],
		addedAt: '2024-09-07'
	},
	'email-header': {
		title: 'Email header',
		meta: 'TEXT · BRAND → PNG',
		href: '/tools/email-header',
		desc: 'Generate branded email header images for campaigns and newsletters.',
		shelf: 'widgets',
		inputs: ['TEXT'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['newsletter', 'campaign', 'banner', 'mailer'],
		addedAt: '2026-01-25'
	},
	'barcode-generator': {
		title: 'Barcode & QR',
		meta: 'VALUE → PNG',
		href: '/tools/barcode-generator',
		desc: 'Render barcodes and QR codes as images from any value.',
		shelf: 'widgets',
		inputs: ['TEXT'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['qr', 'qr code', 'ean', 'sku', 'scan'],
		addedAt: '2026-04-08'
	},

	// ── Widgets & cards ────────────────────────────────────────────────
	badge: {
		title: 'Badge maker',
		meta: 'TEXT → PNG',
		href: '/tools/badge',
		desc: 'Build status and achievement badges as images.',
		shelf: 'widgets',
		inputs: ['TEXT'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['shield', 'status', 'achievement', 'sticker'],
		addedAt: '2026-03-11'
	},
	leaderboard: {
		title: 'Leaderboard',
		meta: 'ROWS → PNG',
		href: '/tools/leaderboard',
		desc: 'Turn ranked rows into a shareable leaderboard card.',
		shelf: 'widgets',
		inputs: ['CSV', 'TEXT'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['ranking', 'top 10', 'scoreboard', 'standings'],
		addedAt: '2026-03-11'
	},
	'membership-card': {
		title: 'Membership card',
		meta: 'MEMBER → PNG',
		href: '/tools/membership-card',
		desc: 'Generate membership and loyalty cards for every member on file.',
		shelf: 'widgets',
		inputs: ['TEXT'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['loyalty', 'member', 'pass', 'id card'],
		addedAt: '2026-01-25'
	},
	'portfolio-card': {
		title: 'Portfolio card',
		meta: 'PROFILE → PNG',
		href: '/tools/portfolio-card',
		desc: 'Render profile and portfolio cards from a template.',
		shelf: 'widgets',
		inputs: ['TEXT'],
		outputs: ['PNG', 'JPG', 'WEBP'],
		aliases: ['profile', 'bio', 'about me', 'team card'],
		addedAt: '2026-01-25'
	}
};

/**
 * The shelves, in the order they stand on the counter. HB-01 (`LWV-0`).
 *
 * A shelf with no tools is not rendered and not listed in the rail: `charts`
 * and `video` are here because the registry is what the SEO plan and the video
 * family will grow into, and an empty shelf head promising "Charts & data"
 * with nothing under it is a worse first impression than no shelf at all.
 */
export const SHELVES = [
	{
		key: 'markup',
		label: 'Markup → image',
		intro: 'Paste markup, get a file. Same renderer as the API.'
	},
	{
		key: 'social',
		label: 'Social & OG',
		intro: 'Sized for the platform. Title and logo in, share image out.'
	},
	{
		key: 'documents',
		label: 'Documents & PDF',
		intro: 'Real PDFs with page sizes. Point a sheet at any of them for one per row.'
	},
	{
		key: 'capture',
		label: 'Capture & screenshots',
		intro: 'A URL in. Headless Chrome does the rest.'
	},
	{ key: 'widgets', label: 'Widgets & cards', intro: 'Small, branded, one per person or thing.' },
	{
		key: 'charts',
		label: 'Charts & data',
		intro: 'Numbers in, a picture of them out. No charting library on your side.'
	},
	{
		key: 'video',
		label: 'Video & motion',
		intro: "CSS animation rendered frame by frame. Converters can't do this one."
	}
];

/** Chip and stamp order. Not alphabetical: the formats people ask for first. */
export const OUTPUT_ORDER = ['PNG', 'JPG', 'WEBP', 'SVG', 'PDF', 'GIF', 'MP4'];

/**
 * The stamp's ground, from `outputs[0]`. One colour per format is the whole
 * wayfinding system on the hub — with no per-tool art, the colour is what a
 * returning visitor recognises before they read the row.
 */
export const STAMP_BG = {
	PNG: 'bg-brand-powder',
	JPG: 'bg-brand-powder',
	WEBP: 'bg-brand-sky',
	SVG: 'bg-brand-sky',
	PDF: 'bg-brand-rose',
	GIF: 'bg-brand-subtle',
	MP4: 'bg-brand-field'
};

/** A tool wears the NEW pill for its first 45 days. */
export const NEW_FOR_DAYS = 45;

/** `[{ slug, ...entry }]` — the registry as a list, in declaration order. */
export const toolList = () => Object.entries(TOOL_CARDS).map(([slug, tool]) => ({ slug, ...tool }));

export function isNewTool(tool, now = new Date()) {
	if (!tool?.addedAt) return false;
	const age = (now - new Date(tool.addedAt)) / 86400000;
	return age >= 0 && age < NEW_FOR_DAYS;
}

/**
 * `[{ key, label, intro, tools }]` for the shelves that actually hold
 * something. Pass a filtered list to get the filtered ledger.
 */
export function shelvesWithTools(tools = toolList()) {
	return SHELVES.map((shelf) => ({
		...shelf,
		tools: tools.filter((tool) => tool.shelf === shelf.key)
	})).filter((shelf) => shelf.tools.length);
}

/** `[{ format, count }]` for the chips — only formats something renders. */
export function outputCounts(tools = toolList()) {
	return OUTPUT_ORDER.map((format) => ({
		format,
		count: tools.filter((tool) => tool.outputs?.includes(format)).length
	})).filter((chip) => chip.count);
}

/**
 * Does this tool answer that query?
 *
 * Over title, meta, description, slug and `aliases` — aliases are the whole
 * point: someone types "receipt", and the tool is called Invoice generator.
 */
export function matchesQuery(tool, query) {
	const q = String(query || '').trim().toLowerCase();
	if (!q) return true;
	return [tool.title, tool.meta, tool.desc, tool.slug, ...(tool.aliases || [])]
		.filter(Boolean)
		.some((field) => String(field).toLowerCase().includes(q));
}

/**
 * The two nearest tools to a query that matched nothing, so the no-match card
 * can name real pages rather than shrug. Scored on the longest run of the
 * query that appears anywhere in the entry's words.
 */
export function nearestTools(query, tools = toolList(), limit = 2) {
	const q = String(query || '').trim().toLowerCase();
	if (!q) return tools.slice(0, limit);
	const score = (tool) => {
		const hay = [tool.title, tool.meta, tool.desc, ...(tool.aliases || [])]
			.join(' ')
			.toLowerCase();
		for (let len = q.length; len >= 3; len--) {
			for (let i = 0; i + len <= q.length; i++) {
				if (hay.includes(q.slice(i, i + len))) return len;
			}
		}
		return 0;
	};
	return [...tools]
		.map((tool) => ({ tool, score: score(tool) }))
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((entry) => entry.tool);
}

/**
 * The three rows at the foot of a tool page. HB-04 (`MHX-0`).
 *
 * Derived, in order, until three: hand-picked → same shelf → shares an input →
 * shares an output. The trailing tag says which rule put the row there, which
 * is the difference between a related list a visitor trusts and one that looks
 * like it was generated. Never the tool itself, never a slug twice.
 */
export function relatedRows(slug, picked = [], limit = 3) {
	const current = TOOL_CARDS[slug];
	const pool = toolList().filter((tool) => tool.slug !== slug);
	const rows = [];
	const take = (tool, reason) => {
		if (!tool || rows.length >= limit || rows.some((row) => row.slug === tool.slug)) return;
		rows.push({ ...tool, reason });
	};

	for (const entry of [...(picked || []), ...(current?.related || [])]) {
		const pick = typeof entry === 'string' ? pool.find((tool) => tool.slug === entry) : null;
		take(pick, 'PICKED');
	}
	for (const tool of pool) if (current && tool.shelf === current.shelf) take(tool, 'SAME SHELF');
	for (const tool of pool) {
		if (current?.inputs?.some((input) => tool.inputs?.includes(input))) take(tool, 'SAME INPUT');
	}
	for (const tool of pool) {
		if (current?.outputs?.some((output) => tool.outputs?.includes(output)))
			take(tool, 'SAME OUTPUT');
	}
	/*
	 * A page that is not itself a registry entry — a use case, a size variant,
	 * something new — still gets a foot. An empty strip at the bottom of a page
	 * reads as a broken component, and "here is the counter" is always true.
	 */
	for (const tool of pool) take(tool, 'ON THE COUNTER');
	return rows;
}

/**
 * Routes that are one registry entry wearing several URLs.
 *
 * `/tools/html-to-png` is a page in its own right for search, but on the
 * counter it is the one HTML to image row — and without this, the foot of the
 * page that ranks best on the site would derive from nothing and render empty.
 */
const SLUG_ALIASES = {
	'html-to-png': 'html-to-image',
	'html-to-jpg': 'html-to-image',
	'html-to-webp': 'html-to-image',
	'html-to-pdf': 'html-to-image'
};

/** `/tools/csv-to-pdf` → `csv-to-pdf`. The shell knows its path, not its slug. */
export const slugFromPath = (path) => {
	const slug = String(path || '')
		.replace(/^\/tools\//, '')
		.split('/')[0];
	return TOOL_CARDS[slug] ? slug : SLUG_ALIASES[slug] || slug;
};
