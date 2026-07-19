/**
 * Static Pages Sitemap
 * Contains all static/hub pages
 */

export async function GET() {
	const baseUrl = 'https://pictify.io';
	const today = new Date().toISOString().slice(0, 10);

	// Static pages with their priorities and change frequencies
	const staticPages = [
		{ path: '/', priority: '1.0', changefreq: 'daily' },
		{ path: '/pricing', priority: '0.9', changefreq: 'weekly' },
		{ path: '/tools', priority: '0.9', changefreq: 'daily' },
		{ path: '/templates', priority: '0.9', changefreq: 'daily' },
		{ path: '/compare', priority: '0.8', changefreq: 'weekly' },
		{ path: '/glossary', priority: '0.8', changefreq: 'weekly' },
		{ path: '/integrations', priority: '0.8', changefreq: 'weekly' },
		{ path: '/blogs', priority: '0.8', changefreq: 'daily' },
		{ path: '/signup', priority: '0.7', changefreq: 'monthly' },
		{ path: '/login', priority: '0.5', changefreq: 'monthly' },
		{ path: '/privacy', priority: '0.3', changefreq: 'yearly' },
		{ path: '/terms', priority: '0.3', changefreq: 'yearly' }
	];

	const urls = staticPages.map(
		(page) => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	);

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
