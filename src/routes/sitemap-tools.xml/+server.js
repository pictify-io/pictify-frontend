/**
 * Tools Sitemap
 * Contains all tool pages and use cases (excluding format variants)
 */

import { useCases, ogPlatforms } from '$lib/pseo/config.js';

export async function GET() {
	const baseUrl = 'https://pictify.io';
	const today = new Date().toISOString().slice(0, 10);

	const urls = [];

	// Main tool pages
	const mainTools = [
		{ path: '/tools/og-image-generator', priority: '0.9' },
		{ path: '/tools/html-to-jpg', priority: '0.9' },
		{ path: '/tools/html-to-png', priority: '0.9' },
		{ path: '/tools/html-to-webp', priority: '0.9' },
		{ path: '/tools/code-to-image', priority: '0.8' },
		{ path: '/tools/online-invoice-generator', priority: '0.8' },
		{ path: '/tools/url-to-image-generator', priority: '0.8' },
		{ path: '/tools/linkedin-banner-generator', priority: '0.8' },
		{ path: '/tools/certificate-generator', priority: '0.8' },
		{ path: '/tools/tweet-screenshot', priority: '0.8' }
	];

	mainTools.forEach((tool) => {
		urls.push(`  <url>
    <loc>${baseUrl}${tool.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${tool.priority}</priority>
  </url>`);
	});

	// Use case pages
	useCases.forEach((useCase) => {
		urls.push(`  <url>
    <loc>${baseUrl}/tools/${useCase.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
	});

	// OG platform pages
	ogPlatforms.forEach((platform) => {
		urls.push(`  <url>
    <loc>${baseUrl}/tools/og-image-generator/${platform.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
	});

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
