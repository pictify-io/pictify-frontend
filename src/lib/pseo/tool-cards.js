/**
 * One entry per tool card on the counter.
 *
 * Every surface that shows a tool as a card — the /tools hub shelves, the
 * "More from the counter" strip at the bottom of each tool page, the hub's
 * ItemList structured data — used to carry its own copy of the title, the
 * mono meta line and the art path. Ten routes each kept a private `RELATED`
 * array, so a renamed tool had to be found in eleven places.
 *
 * The keys are the URL slug. Presentation that belongs to one surface only
 * (the wedge cards' badge and coloured shadow, for instance) stays on that
 * surface; this file is the shared facts.
 *
 * `desc` is the sentence used in structured data. On the two wedge tools it is
 * also the blurb rendered on the hub card, so the two cannot drift.
 */
export const TOOL_CARDS = {
	// ── Wedge ──────────────────────────────────────────────────────────
	'csv-to-pdf': {
		title: 'CSV to PDF',
		meta: 'CSV → PDF',
		href: '/tools/csv-to-pdf',
		art: '/landing/tools/csv-to-pdf.svg',
		desc: 'A spreadsheet in, one polished PDF out. Or one document per row, when you sign in.'
	},
	'certificate-generator': {
		title: 'Certificate generator',
		meta: 'NAMES → CERTIFICATES',
		href: '/tools/certificate-generator',
		art: '/landing/tools/certificate-generator.svg',
		desc: 'Five templates, live preview, clean PNG. Point a sheet at it and every attendee gets theirs.'
	},

	// ── Markup → image ─────────────────────────────────────────────────
	'html-to-image': {
		title: 'HTML to image',
		meta: 'HTML → PNG · JPG · WEBP',
		href: '/tools/html-to-image',
		art: '/landing/tools/html-to-image.svg',
		desc: 'Convert HTML & CSS to PNG, JPG, or WebP. Free converter with API access.'
	},
	'code-to-image': {
		title: 'Code to image',
		meta: 'SNIPPET → PNG',
		href: '/tools/code-to-image',
		art: '/landing/tools/code-to-image.svg',
		desc: 'Turn code snippets into beautiful images with themes and fonts.'
	},
	markdown: {
		title: 'Markdown to image',
		meta: 'MD → PNG',
		href: '/tools/markdown',
		art: '/landing/tools/markdown-to-image.svg',
		desc: 'Convert markdown to shareable images with themes and fonts.'
	},
	table: {
		title: 'Table to image',
		meta: 'CSV · HTML → PNG',
		href: '/tools/table',
		art: '/landing/tools/table-to-image.svg',
		desc: 'Turn CSV data or HTML tables into polished, shareable table images.'
	},

	// ── Social & OG ────────────────────────────────────────────────────
	'og-image-generator': {
		title: 'OG image generator',
		meta: 'TITLE · LOGO → 1200×630',
		href: '/tools/og-image-generator',
		art: '/landing/tools/og-image-generator.svg',
		desc: 'Create custom Open Graph images for social sharing and search previews.'
	},
	'tweet-screenshot': {
		title: 'Tweet screenshot',
		meta: 'TWEET URL → PNG',
		href: '/tools/tweet-screenshot',
		art: '/landing/tools/tweet-screenshot.svg',
		desc: 'Paste any tweet URL, edit every field, download a clean PNG. No API key needed.'
	},
	'linkedin-banner-generator': {
		title: 'LinkedIn banner',
		meta: 'TEMPLATE → 1584×396',
		href: '/tools/linkedin-banner-generator',
		art: '/landing/tools/linkedin-banner.svg',
		desc: 'Create LinkedIn banners from 20+ templates for developers, marketers, and more.'
	},
	'social-proof-card': {
		title: 'Social proof card',
		meta: 'REVIEW → PNG',
		href: '/tools/social-proof-card',
		art: '/landing/tools/social-proof-card.svg',
		desc: 'Turn a review or testimonial into a branded card image.'
	},

	// ── Capture & documents ────────────────────────────────────────────
	'url-to-image-generator': {
		title: 'URL to image',
		meta: 'ANY URL → SCREENSHOT',
		href: '/tools/url-to-image-generator',
		art: '/landing/tools/url-to-image.svg',
		desc: 'Screenshot any URL at any size, straight from the browser or the API.'
	},
	'online-invoice-generator': {
		title: 'Invoice generator',
		meta: 'LINE ITEMS → PNG',
		href: '/tools/online-invoice-generator',
		art: '/landing/tools/invoice-generator.svg',
		desc: 'Create professional invoices quickly with a free online generator.'
	},
	'email-header': {
		title: 'Email header',
		meta: 'TEXT · BRAND → PNG',
		href: '/tools/email-header',
		art: '/landing/tools/email-header.svg',
		desc: 'Generate branded email header images for campaigns and newsletters.'
	},
	'barcode-generator': {
		title: 'Barcode & QR',
		meta: 'VALUE → PNG',
		href: '/tools/barcode-generator',
		art: '/landing/tools/barcode-qr.svg',
		desc: 'Render barcodes and QR codes as images from any value.'
	},

	// ── Widgets & cards ────────────────────────────────────────────────
	badge: {
		title: 'Badge maker',
		meta: 'TEXT → PNG',
		href: '/tools/badge',
		art: '/landing/tools/badge-maker.svg',
		desc: 'Build status and achievement badges as images.'
	},
	leaderboard: {
		title: 'Leaderboard',
		meta: 'ROWS → PNG',
		href: '/tools/leaderboard',
		art: '/landing/tools/leaderboard.svg',
		desc: 'Turn ranked rows into a shareable leaderboard card.'
	},
	'membership-card': {
		title: 'Membership card',
		meta: 'MEMBER → PNG',
		href: '/tools/membership-card',
		art: '/landing/tools/membership-card.svg',
		desc: 'Generate membership and loyalty cards for every member on file.'
	},
	'portfolio-card': {
		title: 'Portfolio card',
		meta: 'PROFILE → PNG',
		href: '/tools/portfolio-card',
		art: '/landing/tools/portfolio-card.svg',
		desc: 'Render profile and portfolio cards from a template.'
	}
};

/**
 * Resolve a `related` list that may hold slugs, full card objects, or a mix —
 * routes migrate to slugs one at a time, so both forms have to work.
 *
 * An unknown slug is dropped rather than rendered as a broken card; it would
 * otherwise ship an <img> with an undefined src and a card with no title.
 */
export function resolveToolCards(entries = []) {
	return entries
		.map((entry) => (typeof entry === 'string' ? TOOL_CARDS[entry] : entry))
		.filter(Boolean);
}
