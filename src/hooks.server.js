import { PUBLIC_BACKEND_URL } from '$env/static/public';

/**
 * Server Hooks
 * Cache headers, server-side processing for PSEO pages, and /s/ proxy
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
 */
const PERMANENT_REDIRECTS = {
	'/tools/code': '/tools/code-to-image'
};

/**
 * Handle function - runs for every request
 */
export async function handle({ event, resolve }) {
	const pathname = event.url.pathname;

	// 301 redirects for legacy paths (trailing slash tolerant)
	const normalized = pathname.replace(/\/+$/, '') || '/';
	const redirectTo = PERMANENT_REDIRECTS[normalized];
	if (redirectTo) {
		return new Response(null, {
			status: 301,
			headers: {
				Location: redirectTo + event.url.search,
				'Cache-Control': 'public, max-age=86400'
			}
		});
	}

	// Proxy /s/ experiment render routes to the backend API
	if (pathname.startsWith('/s/')) {
		const backendUrl = `${PUBLIC_BACKEND_URL}${pathname}${event.url.search}`;
		try {
			const backendRes = await fetch(backendUrl, {
				method: event.request.method,
				headers: {
					'User-Agent': event.request.headers.get('user-agent') || '',
					'X-Forwarded-For': event.getClientAddress(),
					Accept: event.request.headers.get('accept') || '*/*',
					'Accept-Language': event.request.headers.get('accept-language') || ''
				},
				redirect: 'manual'
			});

			const headers = new Headers();
			// Whitelist safe response headers from backend (avoid leaking internal headers)
			const SAFE_RESPONSE_HEADERS = [
				'content-type',
				'content-length',
				'location',
				'etag',
				'last-modified',
				'vary'
			];
			for (const [key, val] of backendRes.headers.entries()) {
				if (SAFE_RESPONSE_HEADERS.includes(key.toLowerCase())) {
					headers.set(key, val);
				}
			}
			// Ensure no-cache policy
			headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
			headers.set('Pragma', 'no-cache');
			headers.set('Expires', '0');

			return new Response(backendRes.body, {
				status: backendRes.status,
				headers
			});
		} catch {
			return new Response('Service unavailable', { status: 502 });
		}
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
