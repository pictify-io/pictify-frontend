import { defineField, defineType } from 'sanity';

const SLUG_MAX_LENGTH = 96;

/**
 * Competitor comparison ("Pictify vs X" / "/alternatives/X"). Source of truth
 * for both /alternatives (list) and /alternatives/[slug] (detail) — the
 * frontend derives the list-page card fields (whySwitch, etc.) from this
 * document rather than maintaining a second shape, unlike the legacy
 * src/lib/pseo/comparisons.js, which hand-maintained a derived `alternatives`
 * array alongside the raw `comparisons` array for the same data.
 *
 * Pricing and feature-score tiers are arrays, not fixed-key objects — the
 * legacy data has different tier names per competitor (free/basic/pro vs
 * free/plus/advanced), which a rigid object schema can't represent without
 * a preset tier list. Arrays let an editor add/remove tiers freely.
 */
export default defineType({
	name: 'comparison',
	title: 'Comparison (Alternatives)',
	type: 'document',
	fields: [
		defineField({
			name: 'competitor',
			title: 'Competitor name',
			type: 'string',
			description: 'e.g. "Cloudinary". Used to build the page title and slug.',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			description: 'URL: /alternatives/<slug>',
			options: {
				source: 'competitor',
				maxLength: SLUG_MAX_LENGTH,
				slugify: (input) =>
					input
						.toLowerCase()
						.replace(/['’]/g, '')
						.replace(/[^a-z0-9]+/g, '-')
						.replace(/^-+|-+$/g, '')
						.slice(0, SLUG_MAX_LENGTH)
			},
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'metaDescription',
			title: 'Meta description',
			type: 'text',
			rows: 3,
			description: 'SERP snippet. Also used as the /alternatives list-page card description.',
			validation: (rule) => rule.required().max(170)
		}),
		defineField({
			name: 'tldr',
			title: 'TL;DR',
			type: 'text',
			rows: 2,
			description: 'One-line honest summary shown at the top of the page.'
		}),
		defineField({
			name: 'subhead',
			title: 'Subhead (optional override)',
			type: 'text',
			rows: 2,
			description: 'Overrides the generated "Looking for a free X alternative..." subhead.'
		}),
		defineField({
			name: 'audienceLabel',
			title: 'Audience label (optional override)',
			type: 'string',
			description:
				'Overrides the default "for Developers" suffix in the H1, e.g. "With Email Delivery".'
		}),
		defineField({
			name: 'advantages',
			title: 'Pictify advantages',
			type: 'array',
			of: [{ type: 'string' }],
			description: 'Reasons to switch to Pictify. First 4 also appear on the /alternatives card.'
		}),
		defineField({
			name: 'competitorAdvantages',
			title: `Competitor's advantages`,
			type: 'array',
			of: [{ type: 'string' }]
		}),
		defineField({
			name: 'bestFor',
			title: 'Best for',
			type: 'object',
			fields: [
				defineField({ name: 'pictify', title: 'Choose Pictify if...', type: 'text', rows: 2 }),
				defineField({
					name: 'competitor',
					title: 'Stay with competitor if...',
					type: 'text',
					rows: 2
				})
			]
		}),
		defineField({
			name: 'pictifyPricing',
			title: 'Pictify pricing tiers',
			type: 'array',
			of: [
				{
					type: 'object',
					name: 'pricingTier',
					fields: [
						defineField({ name: 'tier', title: 'Tier name', type: 'string' }),
						defineField({ name: 'price', title: 'Price', type: 'string' })
					],
					preview: {
						select: { title: 'tier', subtitle: 'price' }
					}
				}
			]
		}),
		defineField({
			name: 'competitorPricing',
			title: 'Competitor pricing tiers',
			type: 'array',
			of: [
				{
					type: 'object',
					name: 'pricingTier',
					fields: [
						defineField({ name: 'tier', title: 'Tier name', type: 'string' }),
						defineField({ name: 'price', title: 'Price', type: 'string' })
					],
					preview: {
						select: { title: 'tier', subtitle: 'price' }
					}
				}
			]
		}),
		defineField({
			name: 'features',
			title: 'Feature comparison',
			type: 'array',
			description: 'Optional. Scored 1-5 per side.',
			of: [
				{
					type: 'object',
					name: 'featureRow',
					fields: [
						defineField({ name: 'label', title: 'Feature', type: 'string' }),
						defineField({
							name: 'pictifyScore',
							title: 'Pictify score (1-5)',
							type: 'number',
							validation: (rule) => rule.min(1).max(5)
						}),
						defineField({
							name: 'competitorScore',
							title: 'Competitor score (1-5)',
							type: 'number',
							validation: (rule) => rule.min(1).max(5)
						})
					],
					preview: {
						select: { title: 'label', pictify: 'pictifyScore', competitor: 'competitorScore' },
						prepare({ title, pictify, competitor }) {
							return { title, subtitle: `Pictify ${pictify} · Competitor ${competitor}` };
						}
					}
				}
			]
		}),
		defineField({
			name: 'migration',
			title: 'Migration',
			type: 'object',
			description: 'Leave difficulty empty to hide the "Switching is Easy" section.',
			fields: [
				defineField({ name: 'difficulty', title: 'Difficulty', type: 'string' }),
				defineField({ name: 'timeEstimate', title: 'Time estimate', type: 'string' }),
				defineField({
					name: 'steps',
					title: 'Steps',
					type: 'array',
					of: [{ type: 'string' }]
				})
			]
		}),
		defineField({
			name: 'faqs',
			title: 'FAQs',
			type: 'array',
			of: [
				{
					type: 'object',
					name: 'faq',
					fields: [
						defineField({ name: 'q', title: 'Question', type: 'string' }),
						defineField({ name: 'a', title: 'Answer', type: 'text', rows: 3 })
					],
					preview: {
						select: { title: 'q' }
					}
				}
			]
		}),
		defineField({
			name: 'cta',
			title: 'CTA button text',
			type: 'string',
			initialValue: 'Try Pictify Free'
		})
	],
	preview: {
		select: { title: 'competitor', subtitle: 'slug.current' },
		prepare({ title, subtitle }) {
			return { title: `Pictify vs ${title}`, subtitle: `/alternatives/${subtitle}` };
		}
	},
	orderings: [
		{
			title: 'Competitor A-Z',
			name: 'competitorAsc',
			by: [{ field: 'competitor', direction: 'asc' }]
		}
	]
});
