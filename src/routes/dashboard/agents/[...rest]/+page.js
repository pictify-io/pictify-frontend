import { redirect } from '@sveltejs/kit';

// MCP & Agents hub retired 2026-09-12. The one thing it handed out was an API
// key, so the settings page is the nearest live destination.
export function load() {
	redirect(301, '/dashboard/api-token');
}
