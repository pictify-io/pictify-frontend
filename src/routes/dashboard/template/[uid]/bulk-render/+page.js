import { redirect } from '@sveltejs/kit';

// Bulk render retired (2026-07) — CSV rendering now runs through workflows.
export function load() {
	throw redirect(301, '/dashboard/workflows/new');
}
