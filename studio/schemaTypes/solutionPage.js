import { defineField, defineType } from 'sanity';

const SLUG_MAX_LENGTH = 96;

/**
 * /solutions/[slug] page — Phase 2 Track B of the Sanity migration. Only one
 * page exists today (mail-merge-with-attachments, the sole survivor of the
 * July 2026 image-automation cluster purge), but the cluster is meant to
 * grow, so content is modeled as a `body` array
 * of typed blocks rather than a single free-form rich-text field — same
 * "array of typed objects" approach as comparison.js's pricingTier/featureRow,
 * so each block renders through a dedicated Svelte component
 * (src/lib/components/solutions/blocks/*) instead of one generic renderer
 * guessing at arbitrary markup.
 *
 * No legacy-fallback data source exists for this content type (unlike blog
 * and comparisons) — the "legacy" version of this content is simply the
 * current hand-coded +page.svelte, which gets deleted once the Sanity-backed
 * route is verified live.
 */

const ctaButton = {
	type: 'object',
	name: 'ctaButton',
	fields: [
		defineField({
			name: 'label',
			title: 'Label',
			type: 'string',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'href',
			title: 'Link',
			type: 'string',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'style',
			title: 'Style',
			type: 'string',
			options: { list: ['primary', 'secondary'] },
			initialValue: 'primary',
			validation: (rule) => rule.required()
		})
	],
	preview: {
		select: { title: 'label', subtitle: 'href' }
	}
};

const receiptsBlock = {
	type: 'object',
	name: 'receiptsBlock',
	title: 'Receipts (comparison cards)',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			validation: (rule) => rule.required()
		}),
		defineField({ name: 'subheading', title: 'Subheading', type: 'string' }),
		defineField({
			name: 'items',
			title: 'Cards',
			type: 'array',
			validation: (rule) => rule.required().min(1),
			of: [
				{
					type: 'object',
					name: 'receiptItem',
					fields: [
						defineField({
							name: 'tool',
							title: 'Tool / path name',
							type: 'string',
							validation: (rule) => rule.required()
						}),
						defineField({
							name: 'wall',
							title: 'The wall (short tag)',
							type: 'string',
							validation: (rule) => rule.required()
						}),
						defineField({
							name: 'detail',
							title: 'Detail',
							type: 'text',
							rows: 2,
							validation: (rule) => rule.required()
						})
					],
					preview: {
						select: { title: 'tool', subtitle: 'wall' }
					}
				}
			]
		})
	],
	preview: {
		select: { title: 'heading' },
		prepare({ title }) {
			return { title: title || 'Receipts block', subtitle: 'receiptsBlock' };
		}
	}
};

const flipBlock = {
	type: 'object',
	name: 'flipBlock',
	title: 'Flip (dark narrative panel)',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'headingAccent',
			title: 'Heading accent (optional colored suffix)',
			type: 'string',
			description: 'e.g. "delivering." — rendered in the accent color after the heading.'
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'text',
			rows: 4,
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'bullets',
			title: 'Bullets',
			type: 'array',
			of: [{ type: 'string' }]
		})
	],
	preview: {
		select: { title: 'heading' },
		prepare({ title }) {
			return { title: title || 'Flip block', subtitle: 'flipBlock' };
		}
	}
};

const stepsBlock = {
	type: 'object',
	name: 'stepsBlock',
	title: 'Steps (How it works / HowTo)',
	description: 'Also emitted as HowTo structured data.',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'steps',
			title: 'Steps',
			type: 'array',
			validation: (rule) => rule.required().min(1),
			of: [
				{
					type: 'object',
					name: 'step',
					fields: [
						defineField({
							name: 'name',
							title: 'Step name',
							type: 'string',
							validation: (rule) => rule.required()
						}),
						defineField({
							name: 'text',
							title: 'Step description',
							type: 'text',
							rows: 2,
							validation: (rule) => rule.required()
						})
					],
					preview: {
						select: { title: 'name', subtitle: 'text' }
					}
				}
			]
		})
	],
	preview: {
		select: { title: 'heading' },
		prepare({ title }) {
			return { title: title || 'Steps block', subtitle: 'stepsBlock' };
		}
	}
};

const richTextBlock = {
	type: 'object',
	name: 'richTextBlock',
	title: 'Rich text (escape hatch)',
	description: 'For content that does not fit the other block types.',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading (optional)',
			type: 'string'
		}),
		defineField({
			name: 'content',
			title: 'Content',
			type: 'markdown',
			validation: (rule) => rule.required()
		})
	],
	preview: {
		select: { title: 'heading' },
		prepare({ title }) {
			return { title: title || 'Rich text block', subtitle: 'richTextBlock' };
		}
	}
};

export default defineType({
	name: 'solutionPage',
	title: 'Solution Page',
	type: 'document',
	fields: [
		defineField({
			name: 'title',
			title: 'Page title (SEO <title>)',
			type: 'string',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			description: 'URL: /solutions/<slug>',
			options: {
				source: 'title',
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
			validation: (rule) => rule.required().max(170)
		}),
		defineField({
			name: 'breadcrumbLabel',
			title: 'Breadcrumb label',
			type: 'string',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'summary',
			title: 'Summary (solutions index card + related-links text)',
			type: 'text',
			rows: 2,
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'keyword',
			title: 'Primary target keyword',
			type: 'string',
			description: 'Informational — for SEO audits, not rendered.'
		}),
		defineField({
			name: 'priority',
			title: 'Priority',
			type: 'string',
			options: { list: ['pillar', 'p0', 'p1', 'p2', 'p3'] },
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'isPillar',
			title: 'Is pillar page?',
			type: 'boolean',
			initialValue: false
		}),
		defineField({
			name: 'ogImage',
			title: 'OG image URL',
			type: 'url',
			validation: (rule) => rule.required().uri({ scheme: ['https'] })
		}),
		defineField({
			name: 'ogImageAlt',
			title: 'OG image alt text',
			type: 'string',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'eyebrow',
			title: 'Eyebrow badge text',
			type: 'string'
		}),
		defineField({
			name: 'headline',
			title: 'Headline (H1)',
			type: 'text',
			rows: 2,
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'headlineAccent',
			title: 'Headline accent (optional colored suffix)',
			type: 'text',
			rows: 2,
			description:
				'e.g. "that actually attaches the file." — rendered in the accent color, own line.'
		}),
		defineField({
			name: 'subhead',
			title: 'Subhead',
			type: 'text',
			rows: 2,
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'ctaButtons',
			title: 'Hero CTA buttons',
			type: 'array',
			of: [ctaButton],
			validation: (rule) => rule.max(2)
		}),
		defineField({
			name: 'body',
			title: 'Body blocks',
			type: 'array',
			validation: (rule) => rule.required().min(1),
			of: [receiptsBlock, flipBlock, stepsBlock, richTextBlock]
		}),
		defineField({
			name: 'faqs',
			title: 'FAQs',
			type: 'array',
			description: 'Rendered as a FAQ section and emitted as FAQPage structured data.',
			of: [
				{
					type: 'object',
					name: 'faq',
					fields: [
						defineField({
							name: 'q',
							title: 'Question',
							type: 'string',
							validation: (rule) => rule.required()
						}),
						defineField({
							name: 'a',
							title: 'Answer',
							type: 'text',
							rows: 3,
							validation: (rule) => rule.required()
						})
					],
					preview: {
						select: { title: 'q' }
					}
				}
			]
		})
	],
	preview: {
		select: { title: 'title', subtitle: 'slug.current' },
		prepare({ title, subtitle }) {
			return { title, subtitle: `/solutions/${subtitle}` };
		}
	},
	orderings: [
		{
			title: 'Priority',
			name: 'priorityAsc',
			by: [{ field: 'priority', direction: 'asc' }]
		}
	]
});
