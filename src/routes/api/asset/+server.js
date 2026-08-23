/**
 * Same-origin proxy for rendered assets on media.pictify.io.
 *
 * The CDN currently serves a malformed `access-control-allow-origin: *, *`
 * header (duplicated), which browsers reject — so any cross-origin `fetch()` of
 * a render fails. Tools that need the bytes client-side (csv-to-pdf assembling
 * pages with jsPDF, canvas compositing, downloads) fetch through here instead:
 * the server fetch has no CORS, and we return the bytes same-origin.
 *
 * Locked to the media host so this can't be turned into an open proxy.
 */
const ALLOWED_HOSTS = new Set(['media.pictify.io']);

export async function GET({ url, fetch }) {
	const target = url.searchParams.get('url');
	if (!target) return new Response('Missing url', { status: 400 });

	let parsed;
	try {
		parsed = new URL(target);
	} catch {
		return new Response('Bad url', { status: 400 });
	}
	if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
		return new Response('Forbidden host', { status: 403 });
	}

	const upstream = await fetch(parsed.href);
	if (!upstream.ok) {
		return new Response('Upstream error', { status: upstream.status });
	}

	return new Response(upstream.body, {
		status: 200,
		headers: {
			'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
			'cache-control': 'public, max-age=3600'
		}
	});
}
