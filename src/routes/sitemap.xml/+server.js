export async function GET() {
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
          <loc>https://pictify.io/html-to-jpg</loc>
          <lastmod>2024-04-19</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
        </url>
    </urlset>
    `.trim(),
    {
      headers: {
        "Content-Type": "application/xml",
      },
    }
  );
}