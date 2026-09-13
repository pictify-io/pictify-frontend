import { redirect } from '@sveltejs/kit';

// Workflows retired 2026-09-12 — per-row rendering runs through the batch API
// and the CSV tools now. Send any workflow URL (list, run, /new) to the dashboard.
export function load() {
	redirect(301, '/dashboard');
}
