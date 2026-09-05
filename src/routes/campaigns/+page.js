import { redirect } from '@sveltejs/kit';

/**
 * `/campaigns` is not a page. FE-17.
 *
 * There is one campaign product, so an index listing it would be a page whose
 * only content is a link to the page below it. A 308 rather than a 302: the
 * move is permanent, and the marketing nav, the docs and any link someone
 * saves should all settle on the canonical URL rather than being re-resolved
 * on every visit.
 */
export const prerender = true;

export function load() {
	throw redirect(308, '/campaigns/customer-value-updates');
}
