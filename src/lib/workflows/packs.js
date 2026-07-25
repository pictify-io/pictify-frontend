/**
 * Workflow pack registry — the wizard engine is generic, packs are pure config.
 *
 * Each pack supplies its copy (label, nouns, tagline, description),
 * an inline SVG icon path, its Handlebars variables, its built-in designs,
 * a sample data row and the default email subject. The `custom` pack has no
 * built-in designs — users bring their own HTML in the wizard.
 */

import { CERTIFICATE_DESIGNS, CERTIFICATE_VARIABLES, SAMPLE_ROW } from './certificate-pack.js';
import { BADGE_DESIGNS, BADGE_VARIABLES, BADGE_SAMPLE_ROW } from './badge-pack.js';
import {
	PLACE_CARD_DESIGNS,
	PLACE_CARD_VARIABLES,
	PLACE_CARD_SAMPLE_ROW
} from './place-card-pack.js';
import { TICKET_DESIGNS, TICKET_VARIABLES, TICKET_SAMPLE_ROW } from './ticket-pack.js';

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
		defaultSubject: 'Your certificate from {{organizationName}}'
	},
	{
		id: 'badges',
		label: 'Badges',
		nounSingular: 'badge',
		nounPlural: 'badges',
		tagline: 'Event badges & name tags',
		description:
			'Upload your attendee list, pick a design, and generate an event badge for every row.',
		icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
		variables: BADGE_VARIABLES,
		designs: BADGE_DESIGNS,
		sampleRow: BADGE_SAMPLE_ROW,
		defaultSubject: 'Your badge for {{eventName}}'
	},
	{
		id: 'place-cards',
		label: 'Place Cards',
		nounSingular: 'place card',
		nounPlural: 'place cards',
		tagline: 'Wedding place cards',
		description: 'Upload your guest list, pick a design, and generate a place card for every seat.',
		icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
		variables: PLACE_CARD_VARIABLES,
		designs: PLACE_CARD_DESIGNS,
		sampleRow: PLACE_CARD_SAMPLE_ROW,
		defaultSubject: 'Your place card'
	},
	{
		id: 'tickets',
		label: 'Tickets',
		nounSingular: 'ticket',
		nounPlural: 'tickets',
		tagline: 'Numbered tickets',
		description:
			'Upload your attendee list, pick a design, and generate a numbered ticket for every row.',
		icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
		variables: TICKET_VARIABLES,
		designs: TICKET_DESIGNS,
		sampleRow: TICKET_SAMPLE_ROW,
		defaultSubject: 'Your ticket to {{eventName}}'
	},
	{
		id: 'custom',
		label: 'Custom',
		nounSingular: 'document',
		nounPlural: 'documents',
		tagline: 'Bring your own HTML',
		description:
			'Paste your own HTML with {{variables}} and generate a personalized file for every row.',
		icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
		variables: [],
		designs: [],
		sampleRow: {},
		defaultSubject: 'Your document',
		custom: true
	}
];

export function getPack(id) {
	return PACKS.find((pack) => pack.id === id) || null;
}
