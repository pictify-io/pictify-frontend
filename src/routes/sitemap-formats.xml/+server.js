/**
 * Formats Sitemap
 * Contains all format x dimension variant pages
 * This can scale to many pages (formats × sizes)
 */

import { formats, popularSizes } from '$lib/pseo/config.js';

export async function GET() {
	const baseUrl = 'https://pictify.io';
	const today = new Date().toISOString().slice(0, 10);

	const urls = [];

	// Generate URLs for each format × size combination
	formats.forEach(format => {
		popularSizes.forEach(size => {
			urls.push(`  <url>
    <loc>${baseUrl}/tools/html-to-${format.id}/${size}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
		});
	});

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
