
/**
 * Server Hooks
 * Cache headers and server-side processing for PSEO pages
 */

/**
 * Cache configuration for PSEO pages
 * Pattern matching for different page types with appropriate cache durations
 */
const PSEO_CACHE_PATTERNS = {
	// Glossary - very static content
	'/glossary/': { maxAge: 2592000, swr: 2592000 }, // 30 days

	// Use case and persona pages - relatively stable
	'/for/': { maxAge: 604800, swr: 2592000 }, // 7 days, 30 day swr
	'/tools/og-image-generator/': { maxAge: 604800, swr: 2592000 },

	// Tool dimension pages - stable but may update
	'/tools/html-to-': { maxAge: 86400, swr: 604800 }, // 1 day, 7 day swr

	// Comparison pages - update periodically
	'/compare/': { maxAge: 604800, swr: 2592000 }, // 7 days

	// Integration pages - relatively stable
	'/integrations/': { maxAge: 604800, swr: 2592000 }, // 7 days

	// Template categories - moderate cache
	'/templates/category/': { maxAge: 86400, swr: 604800 }, // 1 day

	// Blog posts - can be cached
	'/blogs/': { maxAge: 3600, swr: 86400 }, // 1 hour, 1 day swr

	// Sitemaps - cache for efficiency
	'/sitemap': { maxAge: 3600, swr: 86400 } // 1 hour
};

/**
 * No-cache patterns (user-specific or dynamic pages)
 */
const NO_CACHE_PATTERNS = [
	'/dashboard',
	'/admin',
	'/editor',
	'/canvas',
	'/api/',
	'/login',
	'/signup',
	'/reset-password',
	'/verify-email'
];

/**
 * Permanent redirects for legacy / renamed URLs.
 * Map of exact pathname -> destination.
 *
 * 2026-08 SEO repositioning: /compare (33 pages), /glossary (25), /for (6),
 * image-era /solutions (11), framework /integrations (9), /dynamic-images and
 * /visual-analytics were purged — near-zero clicks over 3 months and
 * off-positioning after the workflows pivot. Every purged URL 301s here.
 */
const PERMANENT_REDIRECTS = {
	'/tools/code': '/tools/code-to-image',

	// Retired standalone pages
	'/dynamic-images': '/',
	'/visual-analytics': '/',

	// /compare/* → matching /alternatives/* (same competitor, one canonical page)
	'/compare': '/alternatives',
	'/compare/pictify-vs-cloudinary': '/alternatives/cloudinary',
	'/compare/pictify-vs-htmlcsstoimage': '/alternatives/html-css-to-image',
	'/compare/pictify-vs-imgix': '/alternatives/imgix',
	'/compare/pictify-vs-placid': '/alternatives/placid',
	'/compare/pictify-vs-puppeteer': '/alternatives/puppeteer-self-hosted',
	'/compare/pictify-vs-apiflash': '/alternatives/apiflash',
	'/compare/pictify-vs-screenshotapi': '/alternatives/screenshotapi',
	'/compare/pictify-vs-browserless': '/alternatives/browserless',
	'/compare/pictify-vs-urlbox': '/alternatives/urlbox',
	'/compare/pictify-vs-microlink': '/alternatives/microlink',
	'/compare/pictify-vs-renderform': '/alternatives/renderform',
	'/compare/pictify-vs-vercel-og': '/alternatives/vercel-og',
	'/compare/pictify-vs-flyyer': '/alternatives/flyyer',
	'/compare/pictify-vs-screenshotone': '/alternatives/screenshotone',
	'/compare/pictify-vs-filestack': '/alternatives/filestack',
	'/compare/pictify-vs-uploadcare': '/alternatives/uploadcare',
	'/compare/pictify-vs-cloudflare-images': '/alternatives/cloudflare-images',
	'/compare/pictify-vs-playwright': '/alternatives/playwright-self-hosted',
	'/compare/pictify-vs-screenshotmachine': '/alternatives/screenshot-machine',
	'/compare/pictify-vs-stillio': '/alternatives/stillio',
	'/compare/pictify-vs-htmlpdf': '/alternatives/html-to-pdf-apis',
	'/compare/pictify-vs-pika': '/alternatives/pika',
	'/compare/pictify-vs-abyssale': '/alternatives/abyssale',
	'/compare/pictify-vs-robolly': '/alternatives/robolly',
	'/compare/pictify-vs-ogshot': '/alternatives/ogshot',
	'/compare/pictify-vs-resoc': '/alternatives/resoc',
	'/compare/pictify-vs-imgix-rendering': '/alternatives/imgix-rendering',
	'/compare/pictify-vs-htmltodesign': '/alternatives/html-to-design',
	'/compare/pictify-vs-templated': '/alternatives/templated',
	'/compare/pictify-vs-imagekit': '/alternatives/imagekit',
	'/compare/pictify-vs-chartimg': '/alternatives/chartimg',
	'/compare/pictify-vs-orshot': '/alternatives/orshot',
	'/compare/pictify-vs-bannerbear': '/alternatives/bannerbear',

	// Image-era /solutions cluster → closest live equivalent
	'/solutions/automated-image-generation': '/solutions',
	'/solutions/image-generation-api': '/solutions',
	'/solutions/automate-product-images': '/solutions',
	'/solutions/automate-social-media-images': '/solutions',
	'/solutions/automate-og-images': '/tools/og-image-generator',
	'/solutions/bulk-image-generation': '/solutions',
	'/solutions/dynamic-image-generation': '/solutions',
	'/solutions/generate-images-from-data': '/solutions',
	'/solutions/personalized-images-at-scale': '/solutions',
	'/solutions/automate-marketing-images': '/solutions',
	'/solutions/automate-email-headers': '/tools/email-header',

	// Framework/SDK integration pages → docs (SDK docs are canonical now)
	'/integrations/node-js': 'https://docs.pictify.io/sdks/node',
	'/integrations/python': 'https://docs.pictify.io/sdks/python',
	'/integrations/ruby': 'https://docs.pictify.io/sdks/ruby',
	'/integrations/go': 'https://docs.pictify.io/sdks/go',
	'/integrations/nextjs': '/integrations',
	'/integrations/nuxt': '/integrations',
	'/integrations/sveltekit': '/integrations',
	'/integrations/ghost': '/integrations',
	'/integrations/webflow': '/integrations'
};

/**
 * Prefix-based permanent redirects for purged sections whose children all
 * collapse to one destination. Checked after the exact map.
 */
const PREFIX_REDIRECTS = [
	{ prefix: '/glossary', to: '/' },
	{ prefix: '/for', to: '/' },
	{ prefix: '/compare', to: '/alternatives' }
];

/**
 * Handle function - runs for every request
 */
export async function handle({ event, resolve }) {
	const pathname = event.url.pathname;

	// 301 redirects for legacy paths (trailing slash tolerant)
	const normalized = pathname.replace(/\/+$/, '') || '/';
	let redirectTo = PERMANENT_REDIRECTS[normalized];
	if (!redirectTo) {
		const prefixHit = PREFIX_REDIRECTS.find(
			(r) => normalized === r.prefix || normalized.startsWith(r.prefix + '/')
		);
		if (prefixHit) redirectTo = prefixHit.to;
	}
	if (redirectTo) {
		return new Response(null, {
			status: 301,
			headers: {
				Location: redirectTo + event.url.search,
				'Cache-Control': 'public, max-age=86400'
			}
		});
	}

	const response = await resolve(event);

	// Skip if response already has cache-control
	if (response.headers.has('Cache-Control')) {
		return response;
	}

	// Check no-cache patterns first
	for (const pattern of NO_CACHE_PATTERNS) {
		if (pathname.startsWith(pattern)) {
			response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
			return response;
		}
	}

	// Check PSEO cache patterns
	for (const [pattern, config] of Object.entries(PSEO_CACHE_PATTERNS)) {
		if (pathname.startsWith(pattern) || pathname.includes(pattern)) {
			response.headers.set(
				'Cache-Control',
				`public, max-age=${config.maxAge}, stale-while-revalidate=${config.swr}`
			);
			return response;
		}
	}

	// Default cache for static-ish pages
	if (
		pathname === '/' ||
		pathname === '/pricing' ||
		pathname === '/tools' ||
		pathname === '/templates'
	) {
		response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
	}

	return response;
}

/**
 * Handle fetch errors globally
 */
export async function handleFetch({ event, request, fetch }) {
	// Add default timeout for external fetches
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

	try {
		const response = await fetch(request, { signal: controller.signal });
		clearTimeout(timeoutId);
		return response;
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
}

/**
 * Handle errors
 */
export function handleError({ error, event }) {
	// Log error for monitoring

	// Return generic error to client
	return {
		message: 'An error occurred',
		code: error.code || 'UNKNOWN'
	};
}
