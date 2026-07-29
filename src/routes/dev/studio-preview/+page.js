import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

/**
 * Dev-only. The harness mounts the studio's React islands with no auth and
 * exposes engine internals on `window`, so it must not exist in production.
 */
export function load() {
	if (!dev) throw error(404, 'Not found');
	return {};
}

export const prerender = false;

// The studio is a browser-only surface (canvas engine + React islands). There
// is nothing useful to server-render and attempting it 500s.
export const ssr = false;
