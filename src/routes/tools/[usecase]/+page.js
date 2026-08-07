import { redirect } from '@sveltejs/kit';
import { useCaseDetails } from '$lib/pseo/use-cases.js';

// Use-case slugs that duplicate a dedicated tool page. They 301 to the
// canonical page instead of rendering a competing near-duplicate.
const CONSOLIDATED = {
	certificate: '/tools/certificate-generator',
	'course-certificate': '/tools/certificate-generator',
	// Canvas-era use cases retired 2026-08. Slugs with a topical successor 301
	// there; everything else falls through to the /tools redirect below.
	code: '/tools/code-to-image',
	'json-to-image': '/tools/code-to-image',
	'html-email': '/tools/html-to-png',
	receipt: '/tools/online-invoice-generator',
	'tweet-card': '/tools/tweet-screenshot',
	'quote-card': '/tools/tweet-screenshot',
	'linkedin-banner': '/tools/linkedin-banner-generator',
	'youtube-thumbnail': '/tools/og-image-generator',
	'twitter-header': '/tools/og-image-generator',
	'instagram-story': '/tools/og-image-generator',
	'podcast-cover': '/tools/og-image-generator',
	'blog-featured-image': '/tools/og-image-generator',
	'event-ticket': '/tools/certificate-generator',
	'event-invitation': '/tools/certificate-generator',
	'name-badge': '/tools/certificate-generator',
	testimonial: '/tools/social-proof-card'
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
