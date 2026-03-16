/**
 * Blogs Sitemap
 * Contains all blog posts - fetched dynamically from API
 */

import { getBlogLinks } from '../../api/blog';

export async function GET() {
	const baseUrl = 'https://pictify.io';

	let urls = [];

	try {
		const response = await getBlogLinks();
		const { links } = response;

		urls = links.map(
			(link) => `  <url>
    <loc>${baseUrl}/blogs/${link.slug}</loc>
    <lastmod>${
			link.createdAt
				? new Date(link.createdAt).toISOString().slice(0, 10)
				: new Date().toISOString().slice(0, 10)
		}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
		);
	} catch (error) {
		/* ignored */
	}

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
