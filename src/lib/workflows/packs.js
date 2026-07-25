/**
 * Workflow pack registry — the wizard engine is generic, packs are pure config.
 *
 * Each active pack supplies its copy (label, nouns, tagline, description),
 * an inline SVG icon path, its Handlebars variables, its built-in designs,
 * a sample data row and the default email subject. `comingSoon` packs are
 * stubs shown on the workflows index only.
 */

import { CERTIFICATE_DESIGNS, CERTIFICATE_VARIABLES, SAMPLE_ROW } from './certificate-pack.js';

export const PACKS = [
	{
		id: 'certificates',
		label: 'Certificates',
		nounSingular: 'certificate',
		nounPlural: 'certificates',
		tagline: 'Course & training certificates',
		description:
			'Upload a list of recipients, pick a design, and generate a certificate for every row.',
		icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
		variables: CERTIFICATE_VARIABLES,
		designs: CERTIFICATE_DESIGNS,
		sampleRow: SAMPLE_ROW,
		defaultSubject: 'Your certificate from {{organizationName}}',
		comingSoon: false
	},
	{
		id: 'badges',
		label: 'Badges',
		tagline: 'Event badges & name tags',
		icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
		comingSoon: true
	},
	{
		id: 'place-cards',
		label: 'Place Cards',
		tagline: 'Wedding place cards',
		icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
		comingSoon: true
	},
	{
		id: 'tickets',
		label: 'Tickets',
		tagline: 'Numbered tickets',
		icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
		comingSoon: true
	}
];

export function getPack(id) {
	return PACKS.find((pack) => pack.id === id) || null;
}
