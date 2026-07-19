/**
 * Formats Sitemap
 * Lists the parent HTML-to-format converter pages only.
 * Size variants (/tools/html-to-{format}/{WxH}) canonicalize to their parent
 * page and are intentionally excluded so they don't compete with it in search.
 */

import { formats } from '$lib/pseo/config.js';

export async function GET() {
	const baseUrl = 'https://pictify.io';
	const today = new Date().toISOString().slice(0, 10);

	const urls = formats.map(
		(format) => `  <url>
    <loc>${baseUrl}/tools/html-to-${format.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`
	);

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

	return new Response(xml.trim(), {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=86400' // 24 hours - these don't change often
		}
	});
}
