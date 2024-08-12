import { getBlogLinks } from '../../api/blog';

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
