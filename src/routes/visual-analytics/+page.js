import { redirect } from '@sveltejs/kit';

// Experiments feature retired July 2026 — permanent redirect home.
export function load() {
	redirect(301, '/');
}
