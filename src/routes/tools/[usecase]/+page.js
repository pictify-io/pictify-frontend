import { redirect } from '@sveltejs/kit';
import { useCaseDetails } from '$lib/pseo/use-cases.js';

// Use-case slugs that duplicate a dedicated tool page. They 301 to the
// canonical page instead of rendering a competing near-duplicate.
const CONSOLIDATED = {
	certificate: '/tools/certificate-generator'
};

export function load({ params }) {
	const target = CONSOLIDATED[params.usecase];
	if (target) {
		throw redirect(301, target);
	}
	if (!useCaseDetails[params.usecase]) {
		throw redirect(301, '/tools');
	}
	return {};
}
