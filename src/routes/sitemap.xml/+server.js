/**
 * Sitemap Index
 * robots.txt points here; each section lives in its own sitemap-*.xml.
 * (Replaces the old monolithic urlset, which duplicated the split sitemaps.)
 */

const SECTION_SITEMAPS = [
	'sitemap-static.xml',
	'sitemap-tools.xml',
	'sitemap-formats.xml',
	'sitemap-blogs.xml',
	'sitemap-alternatives.xml',
	'sitemap-compare.xml',
	'sitemap-glossary.xml',
	'sitemap-integrations.xml',
	'sitemap-personas.xml',
	'sitemap-solutions.xml',
	'sitemap-templates.xml'
];

export async function GET() {
	const baseUrl = 'https://pictify.io';
	const today = new Date().toISOString().slice(0, 10);

	const entries = SECTION_SITEMAPS.map(
		(file) => `  <sitemap>
    <loc>${baseUrl}/${file}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
	);

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</sitemapindex>`;

	return new Response(xml.trim(), {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
