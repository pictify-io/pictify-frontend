/**
 * The MCP Server Card (SEP-2127, still Draft) actually lives on mcp.pictify.io
 * — that's the streamable-http URL the card itself describes, and the spec's
 * recommended location is `<streamable-http-url>/server-card`. This path
 * isn't part of the real spec (which uses /.well-known/ai-catalog.json to
 * point at the card, wherever it's hosted) — it exists only because some
 * checkers hardcode this exact well-known path. A redirect avoids publishing
 * a second copy of the card that could drift out of sync with the real one.
 */
export async function GET() {
	return new Response(null, {
		status: 301,
		headers: { Location: 'https://mcp.pictify.io/server-card' }
	});
}
