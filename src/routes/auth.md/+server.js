/**
 * /auth.md (github.com/workos/auth.md) lives on api.pictify.io — that's the
 * actual OAuth issuer (see /.well-known/oauth-authorization-server there),
 * so it's the correct place for agent-registration instructions to live.
 * This redirect exists only so agents/checkers that look for auth.md at the
 * marketing site's root still find it, without duplicating the content
 * (which would drift out of sync with the real implementation).
 */
export async function GET() {
	return new Response(null, {
		status: 301,
		headers: { Location: 'https://api.pictify.io/auth.md' }
	});
}
