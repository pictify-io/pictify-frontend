import { redirect } from '@sveltejs/kit';

// Live links / dynamic images retired (2026-07).
export function load() {
	throw redirect(301, '/dashboard/template');
}
