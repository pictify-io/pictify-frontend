/**
 * AI Catalog (github.com/Agent-Card/ai-catalog) — a domain-level index of
 * Pictify's AI artifacts, per the (still-Draft) MCP Server Cards spec
 * (modelcontextprotocol/modelcontextprotocol PR #2127). Points at the real
 * MCP Server Card on mcp.pictify.io rather than duplicating its content here
 * — keeps this from drifting out of sync with what that server actually is.
 */

const CATALOG = {
	specVersion: '1.0',
	entries: [
		{
			identifier: 'urn:air:pictify.io:mcp:pictify',
			type: 'application/mcp-server-card+json',
			url: 'https://mcp.pictify.io/server-card'
		}
	]
};

export async function GET() {
	return new Response(JSON.stringify(CATALOG, null, 2), {
		headers: {
			'Content-Type': 'application/ai-catalog+json',
			'Cache-Control': 'public, max-age=86400'
		}
	});
}
