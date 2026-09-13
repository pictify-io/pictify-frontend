import { redirect } from '@sveltejs/kit';

// Bulk render retired (2026-07); the workflows it pointed at retired 2026-09-12.
export function load() {
	throw redirect(301, '/dashboard');
}
