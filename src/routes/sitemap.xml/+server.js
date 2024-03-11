export async function GET() {
  return new Response(
    `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
       <url>
          <loc>https://pictify.io/</loc>
          <lastmod>2024-03-07</lastmod>
          <changefreq>monthly</changefreq>
          <priority>0.9</priority>
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