import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

/** Dev-only harness for the v2 studio stage: no auth, no backend. 404 in production. */
export function load() {
	if (!dev) throw error(404, 'Not found');
	return {};
}

export const prerender = false;
export const ssr = false;
