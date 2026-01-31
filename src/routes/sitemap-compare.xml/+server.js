/**
 * Comparisons Sitemap
 * Contains all competitor comparison pages
 */

import { comparisons } from '$lib/pseo/config.js';

export async function GET() {
	const baseUrl = 'https://pictify.io';
	const today = new Date().toISOString().slice(0, 10);

	const urls = comparisons.map(comparison => `  <url>
    <loc>${baseUrl}/compare/${comparison.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

	return new Response(xml.trim(), {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=86400'
		}
	});
}
