/**
 * RFC 9727 well-known API catalog — a linkset (RFC 9264) describing Pictify's
 * public API entry point, for agent/crawler discovery. Advertised via the
 * `Link: </.well-known/api-catalog>; rel="api-catalog"` header on the
 * homepage (see hooks.server.js).
 *
 * Keep this to endpoints that are actually verified/live — an agent acting
 * on a wrong or stale entry here is worse than this file not existing.
 *
 * service-desc (a real OpenAPI/machine-readable spec) is deliberately
 * omitted: docs.pictify.io/api-reference/openapi.json is still Mintlify's
 * unconfigured "OpenAPI Plant Store" placeholder, and there's no
 * @fastify/swagger or generated spec anywhere in the backend (checked
 * directly, 2026-08-08). Add it here once a real one exists — pointing
 * agents at fake API data would be worse than omitting the relation.
 */

const CATALOG = {
	linkset: [
		{
			anchor: 'https://pictify.io/',
			'service-doc': [{ href: 'https://docs.pictify.io/', type: 'text/html' }],
			status: [{ href: 'https://api.pictify.io/health', type: 'application/json' }],
			item: [
				{
					href: 'https://api.pictify.io/image',
					type: 'application/json',
					title: 'Image API — render HTML or a URL to PNG/JPG/WebP'
				}
			]
		}
	]
};

export async function GET() {
	return new Response(JSON.stringify(CATALOG, null, 2), {
		headers: {
			'Content-Type': 'application/linkset+json',
			'Cache-Control': 'public, max-age=86400'
		}
	});
}
