/**
 * Solutions Sitemap
 * Lists the pillar and all /solutions/* pages. Source of truth for slugs is
 * the Sanity solutionPage document type (Phase 2 Track B of the CMS migration).
 */

import { getSanitySolutions } from '$lib/sanity/solutions';

export async function GET() {
	const baseUrl = 'https://pictify.io';
	const today = new Date().toISOString().slice(0, 10);

	const indexEntry = `  <url>
    <loc>${baseUrl}/solutions</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

	let solutions = [];
	try {
		solutions = await getSanitySolutions();
	} catch (e) {
		console.error('Sanity solutions sitemap fetch failed:', e);
	}

	const urls = [
		indexEntry,
		...solutions.map((s) => {
			// Pillar gets priority 0.9; supporting pages 0.8.
			const priority = s.isPillar ? '0.9' : '0.8';
			return `  <url>
    <loc>${baseUrl}/solutions/${s.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
		})
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

	return new Response(xml.trim(), {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
