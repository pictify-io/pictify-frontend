import { redirect } from '@sveltejs/kit';
import { alternatives } from '$lib/pseo/comparisons.js';

// Validate the slug during load so unknown alternatives redirect server-side
// (crawlers previously got a 200 page with a client-only goto()).
export function load({ params }) {
	const alt = alternatives.find((a) => a.slug === params.slug);
	if (!alt) {
		throw redirect(301, '/alternatives');
	}
	return {};
}
