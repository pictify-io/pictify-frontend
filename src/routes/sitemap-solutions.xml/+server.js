/**
 * Solutions Sitemap
 * Lists the pillar and all /solutions/* supporting pages in the image-automation
 * cluster. Source of truth for slugs is src/lib/solutions/related.js so adding a
 * new solution entry there auto-adds it here.
 *
 * See plan: docs/plans/2026-04-15-003-strategy-automated-images-cluster-plan.md
 */

import { publishedSolutions } from '$lib/solutions/related.js';

export async function GET() {
	const baseUrl = 'https://pictify.io';
	const today = new Date().toISOString().slice(0, 10);

	const indexEntry = `  <url>
    <loc>${baseUrl}/solutions</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

	const urls = [indexEntry, ...publishedSolutions().map((s) => {
		// Pillar gets priority 0.9; supporting pages 0.8.
		const priority = s.isPillar ? '0.9' : '0.8';
		return `  <url>
    <loc>${baseUrl}/solutions/${s.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
	})];

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
