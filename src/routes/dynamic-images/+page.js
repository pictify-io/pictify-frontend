import { redirect } from '@sveltejs/kit';

// Feature retired (2026-07): marketing page removed, permanent redirect home.
export function load() {
	throw redirect(301, '/');
}
