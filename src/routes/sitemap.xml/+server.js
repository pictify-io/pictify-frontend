import { getBlogLinks } from '../../api/blog';
import {
	formats,
	popularSizes,
	ogPlatforms,
	useCases,
	templateCategories,
	comparisons,
	glossary,
	integrations,
	personas
} from '$lib/pseo/config.js';
import { alternatives } from '$lib/pseo/comparisons.js';
import { publishedSolutions } from '$lib/solutions/related.js';

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
		popularSizes.map(
			(sz) => `
			<url>
				<loc>https://pictify.io/tools/html-to-${fmt}/${sz}</loc>
				<lastmod>${today}</lastmod>
				<changefreq>weekly</changefreq>
				<priority>0.7</priority>
			</url>
		`
		)
	);

	// OG platform pages
	const ogPlatformUrls = ogPlatforms.map(
		(p) => `
		<url>
			<loc>https://pictify.io/tools/og-image-generator/${p.id}</loc>
			<lastmod>${today}</lastmod>
			<changefreq>weekly</changefreq>
			<priority>0.7</priority>
		</url>
	`
	);

	const useCaseUrls = useCases.map(
		(useCase) => `
		<url>
			<loc>https://pictify.io/tools/${useCase.id}</loc>
			<lastmod>${today}</lastmod>
			<changefreq>weekly</changefreq>
			<priority>0.6</priority>
		</url>
	`
	);

	// Template category pages
	const templateCategoryUrls = templateCategories.map(
		(cat) => `
		<url>
			<loc>https://pictify.io/templates/category/${cat.id}</loc>
			<lastmod>${today}</lastmod>
			<changefreq>weekly</changefreq>
			<priority>0.7</priority>
		</url>
	`
	);

	// Comparison pages
	const comparisonUrls = comparisons.map(
		(comp) => `
		<url>
			<loc>https://pictify.io/compare/${comp.slug}</loc>
			<lastmod>${today}</lastmod>
			<changefreq>monthly</changefreq>
			<priority>0.6</priority>
		</url>
	`
	);

	// Alternatives pages (/alternatives/[slug] brand-hijack pages) + the /alternatives index
	const alternativeUrls = [
		`
		<url>
			<loc>https://pictify.io/alternatives</loc>
			<lastmod>${today}</lastmod>
			<changefreq>weekly</changefreq>
			<priority>0.8</priority>
		</url>
	`,
		...alternatives.map(
			(alt) => `
		<url>
			<loc>https://pictify.io/alternatives/${alt.slug}</loc>
			<lastmod>${today}</lastmod>
			<changefreq>monthly</changefreq>
			<priority>0.7</priority>
		</url>
	`
		)
	];

	// Glossary term pages
	const glossaryUrls = glossary.map(
		(term) => `
		<url>
			<loc>https://pictify.io/glossary/${term.term}</loc>
			<lastmod>${today}</lastmod>
			<changefreq>monthly</changefreq>
			<priority>0.5</priority>
		</url>
	`
	);

	// Integration pages
	const integrationUrls = integrations.map(
		(int) => `
		<url>
			<loc>https://pictify.io/integrations/${int.slug}</loc>
			<lastmod>${today}</lastmod>
			<changefreq>weekly</changefreq>
			<priority>0.7</priority>
		</url>
	`
	);

	// Solutions pages (image-automation cluster) + the /solutions index
	const solutionUrls = [
		`
		<url>
			<loc>https://pictify.io/solutions</loc>
			<lastmod>${today}</lastmod>
			<changefreq>weekly</changefreq>
			<priority>0.8</priority>
		</url>
	`,
		...publishedSolutions().map(
			(s) => `
		<url>
			<loc>https://pictify.io/solutions/${s.slug}</loc>
			<lastmod>${today}</lastmod>
			<changefreq>weekly</changefreq>
			<priority>${s.isPillar ? '0.9' : '0.8'}</priority>
		</url>
	`
		)
	];

	// Persona pages
	const personaUrls = personas.map(
		(p) => `
		<url>
			<loc>https://pictify.io/for/${p.slug}</loc>
			<lastmod>${today}</lastmod>
			<changefreq>monthly</changefreq>
			<priority>0.7</priority>
		</url>
	`
	);

	return new Response(
		`
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
       <url>
          <loc>https://pictify.io/</loc>
          <lastmod>${today}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.9</priority>
       </url>
        <url>
            <loc>https://pictify.io/pricing</loc>
            <lastmod>${today}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/blogs</loc>
            <lastmod>${today}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools</loc>
            <lastmod>${today}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/og-image-generator</loc>
            <lastmod>${today}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/html-to-jpg</loc>
            <lastmod>${today}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/online-invoice-generator</loc>
            <lastmod>${today}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/url-to-image-generator</loc>
            <lastmod>${today}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/html-to-png</loc>
            <lastmod>${today}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/html-to-webp</loc>
            <lastmod>${today}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/code-to-image</loc>
            <lastmod>${today}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/tools/linkedin-banner-generator</loc>
            <lastmod>${today}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/templates</loc>
            <lastmod>${today}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
         </url>
         <url>
            <loc>https://pictify.io/compare</loc>
            <lastmod>${today}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.7</priority>
         </url>
         <url>
            <loc>https://pictify.io/glossary</loc>
            <lastmod>${today}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.7</priority>
         </url>
         <url>
            <loc>https://pictify.io/integrations</loc>
            <lastmod>${today}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
         </url>
	   		${variantUrls.join('')}
	   		${ogPlatformUrls.join('')}
	   		${useCaseUrls.join('')}
	   		${templateCategoryUrls.join('')}
	   		${comparisonUrls.join('')}
	   		${alternativeUrls.join('')}
	   		${glossaryUrls.join('')}
	   		${integrationUrls.join('')}
	   		${solutionUrls.join('')}
	   		${personaUrls.join('')}
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
