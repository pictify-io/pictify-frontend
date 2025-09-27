import { getBlogLinks } from '../../api/blog';
import { formats, popularSizes, ogPlatforms, useCases } from '$lib/pseo/config.js';

export async function GET() {
	const response = await getBlogLinks();
	const { links } = response;
	const urls = links.map((link) => {
		return `
         <url>
            <loc>https://pictify.io/blogs/${link.slug}</loc>
            <lastmod>${link.createdAt}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
         </url>
      `;
	});

   // PSEO: html-to-[format] size variants (from config)
   const popularFormats = formats.map((f) => f.id);
   const today = new Date().toISOString().slice(0, 10);
   const variantUrls = popularFormats.flatMap((fmt) =>
      popularSizes.map((sz) => `
			<url>
				<loc>https://pictify.io/tools/html-to-${fmt}/${sz}</loc>
				<lastmod>${today}</lastmod>
				<changefreq>weekly</changefreq>
				<priority>0.7</priority>
			</url>
		`)
   );

   // OG platform pages
   const ogPlatformUrls = ogPlatforms.map((p) => `
		<url>
			<loc>https://pictify.io/tools/og-image-generator/${p.id}</loc>
			<lastmod>${today}</lastmod>
			<changefreq>weekly</changefreq>
			<priority>0.7</priority>
		</url>
	`);

   const useCaseUrls = useCases.map((useCase) => `
		<url>
			<loc>https://pictify.io/tools/${useCase.id}</loc>
			<lastmod>${today}</lastmod>
			<changefreq>weekly</changefreq>
			<priority>0.6</priority>
		</url>
	`);

	return new Response(
		`
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
       <url>
          <loc>https://pictify.io/</loc>
          <lastmod>2024-03-11</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.9</priority>
       </url>
        <url>
            <loc>https://pictify.io/pricing</loc>
            <lastmod>2024-08-02</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/blogs</loc>
            <lastmod>2024-04-19</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools</loc>
            <lastmod>2024-04-19</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/og-image-generator</loc>
            <lastmod>2024-04-19</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/html-to-jpg</loc>
            <lastmod>2024-04-19</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/online-invoice-generator</loc>
            <lastmod>2024-04-19</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/url-to-image-generator</loc>
            <lastmod>2024-04-19</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/html-to-png</loc>
            <lastmod>2024-04-19</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/html-to-webp</loc>
            <lastmod>2024-04-19</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/code-to-image</loc>
            <lastmod>2024-04-19</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
	   		${variantUrls.join('')}
	   		${ogPlatformUrls.join('')}
	   		${useCaseUrls.join('')}
	   		${urls.join('')}
    </urlset>
    `.trim(),
		{
			headers: {
				'Content-Type': 'application/xml'
			}
		}
	);
}
