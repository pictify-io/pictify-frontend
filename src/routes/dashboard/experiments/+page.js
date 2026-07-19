import { redirect } from '@sveltejs/kit';

// Experiments feature retired (2026-07).
export function load() {
	throw redirect(301, '/dashboard');
}
