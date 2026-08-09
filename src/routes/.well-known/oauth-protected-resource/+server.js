/**
 * The real OAuth 2.0 Protected Resource Metadata (RFC 9728) lives on
 * api.pictify.io — that's the actual protected resource (see the `resource`
 * field in the document itself). This redirect exists only so agents/
 * checkers that look for it at the marketing site's root still find it,
 * without duplicating the document (which would drift out of sync with
 * the real server).
 */
export async function GET() {
	return new Response(null, {
		status: 301,
		headers: { Location: 'https://api.pictify.io/.well-known/oauth-protected-resource' }
	});
}
