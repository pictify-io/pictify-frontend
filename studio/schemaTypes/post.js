import { defineField, defineType } from 'sanity';

/**
 * Blog post. Body stays markdown (the 18 migrated posts are markdown and the
 * frontend already renders it with `marked`) — portable text can come later
 * if we ever need rich embeds.
 *
 * SEO contract: `title` is the H1; `seoTitle` (optional) overrides the
 * <title> tag when the SERP headline should differ from the on-page one —
 * that's the CTR lever the old system didn't have.
 */
export default defineType({
	name: 'post',
	title: 'Blog Post',
	type: 'document',
	fields: [
		defineField({
			name: 'title',
			title: 'Title (H1)',
			type: 'string',
			validation: (rule) => rule.required().max(90)
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: {
				source: 'title',
				maxLength: 96,
				slugify: (input) =>
					input
						.toLowerCase()
						.replace(/['’]/g, '')
						.replace(/[^a-z0-9]+/g, '-')
						.replace(/^-+|-+$/g, '')
						.slice(0, 96)
			},
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'legacySlugs',
			title: 'Legacy slugs',
			type: 'array',
			of: [{ type: 'string' }],
			description:
				'Old slugs this post previously lived at (e.g. the pre-CMS punctuation-heavy ones). Requests to any of them 301 to the clean slug. Leave empty for new posts.'
		}),
		defineField({
			name: 'seoTitle',
			title: 'SEO title (overrides <title>)',
			type: 'string',
			description: 'Optional. ~60 chars. When empty, the post title is used.',
			validation: (rule) => rule.max(70)
		}),
		defineField({
			name: 'description',
			title: 'Meta description',
			type: 'text',
			rows: 3,
			description: 'SERP snippet, ~155 chars. Write it to win the click.',
			validation: (rule) => rule.required().max(170)
		}),
		defineField({
			name: 'content',
			title: 'Body (markdown)',
			type: 'markdown',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'type',
			title: 'Type',
			type: 'string',
			options: { list: ['article', 'guide'], layout: 'radio' },
			initialValue: 'article',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'tags',
			title: 'Tags',
			type: 'array',
			of: [{ type: 'string' }],
			options: { layout: 'tags' }
		}),
		defineField({
			name: 'author',
			title: 'Author',
			type: 'string',
			initialValue: 'Suyash Thakur'
		}),
		defineField({
			name: 'heroImage',
			title: 'Hero image URL',
			type: 'url',
			description: 'Absolute URL (media.pictify.io or Cloudinary). Also used as the OG image.'
		}),
		defineField({
			name: 'featured',
			title: 'Featured',
			type: 'boolean',
			initialValue: false,
			description: 'Shown as the hero card on /blogs. Keep exactly one post featured.'
		}),
		defineField({
			name: 'readingTime',
			title: 'Reading time (minutes)',
			type: 'number'
		}),
		defineField({
			name: 'publishedAt',
			title: 'Published at',
			type: 'datetime',
			initialValue: () => new Date().toISOString(),
			validation: (rule) => rule.required()
		})
	],
	preview: {
		select: { title: 'title', subtitle: 'slug.current' }
	},
	orderings: [
		{
			title: 'Published, newest first',
			name: 'publishedAtDesc',
			by: [{ field: 'publishedAt', direction: 'desc' }]
		}
	]
});
