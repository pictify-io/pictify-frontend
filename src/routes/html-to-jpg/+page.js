import { redirect } from '@sveltejs/kit';

// Permanent server-side redirect to the canonical tool page. This used to be a
// client-side goto(), which crawlers saw as a thin "Redirecting..." page.
export function load() {
	throw redirect(301, '/tools/html-to-jpg');
}
