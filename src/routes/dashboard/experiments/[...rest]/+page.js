import { redirect } from '@sveltejs/kit';

// Experiments feature retired July 2026 — send any dashboard experiment URL to the dashboard.
export function load() {
	redirect(301, '/dashboard');
}
