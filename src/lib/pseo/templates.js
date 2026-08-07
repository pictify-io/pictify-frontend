// Dimension contexts for size-specific tool pages

export const dimensionContexts = {
	'1200x630': {
		label: 'OG Image Standard',
		platforms: ['Facebook', 'LinkedIn', 'Twitter', 'Slack', 'Discord'],
		description:
			'The universal Open Graph image size. Works perfectly across Facebook, LinkedIn, Twitter, and most messaging apps.',
		useCases: ['Blog post previews', 'Landing page shares', 'Article cards'],
		aspectRatio: '1.91:1'
	},
	'1200x675': {
		label: 'X (Twitter) Large Image',
		platforms: ['X (Twitter)'],
		description:
			"Optimized for Twitter's large image card format. Slightly taller than standard OG for better Twitter display.",
		useCases: ['Twitter cards', 'Tweet images', 'Thread headers'],
		aspectRatio: '16:9'
	},
	'1200x628': {
		label: 'Facebook/Ads Standard',
		platforms: ['Facebook Ads', 'Google Ads', 'LinkedIn Ads'],
		description: 'Standard size for social media advertising across platforms.',
		useCases: ['Facebook ads', 'LinkedIn sponsored content', 'Display ads'],
		aspectRatio: '1.91:1'
	},
	'1080x1080': {
		label: 'Square Post',
		platforms: ['Instagram', 'Facebook', 'LinkedIn', 'Pinterest'],
		description: 'Perfect square format ideal for Instagram feed posts and cross-platform sharing.',
		useCases: ['Instagram posts', 'Product showcases', 'Quote cards'],
		aspectRatio: '1:1'
	},
	'1080x1350': {
		label: 'Portrait Post',
		platforms: ['Instagram', 'Pinterest', 'Facebook'],
		description: "Instagram's optimal portrait ratio that takes up more screen space in feeds.",
		useCases: ['Instagram portraits', 'Pinterest pins', 'Product features'],
		aspectRatio: '4:5'
	},
	'1080x1920': {
		label: 'Stories/Reels',
		platforms: ['Instagram Stories', 'TikTok', 'YouTube Shorts', 'Facebook Stories', 'Snapchat'],
		description: 'Full-screen vertical format for Stories, Reels, and short-form video thumbnails.',
		useCases: ['Instagram Stories', 'TikTok thumbnails', 'YouTube Shorts covers'],
		aspectRatio: '9:16'
	},
	'1600x900': {
		label: '16:9 Standard',
		platforms: ['YouTube', 'Presentations', 'Webinars'],
		description:
			'Widescreen format perfect for presentations, YouTube thumbnails, and webinar graphics.',
		useCases: ['YouTube thumbnails', 'Slide decks', 'Webinar banners'],
		aspectRatio: '16:9'
	},
	'1280x720': {
		label: '16:9 HD',
		platforms: ['YouTube', 'Video Thumbnails', 'Presentations'],
		description: 'HD resolution widescreen for video thumbnails and presentation graphics.',
		useCases: ['Video thumbnails', 'Course covers', 'Webinar graphics'],
		aspectRatio: '16:9'
	},
	'1920x1080': {
		label: '16:9 Full HD',
		platforms: ['YouTube', 'Desktop Wallpapers', 'Presentations'],
		description:
			'Full HD widescreen resolution for high-quality presentations and desktop graphics.',
		useCases: ['HD presentations', 'Desktop backgrounds', 'Report covers'],
		aspectRatio: '16:9'
	},
	'800x1200': {
		label: 'Document/Receipt',
		platforms: ['Email', 'Print', 'PDF'],
		description: 'Portrait document format ideal for receipts, invoices, and document previews.',
		useCases: ['Receipts', 'Invoices', 'Document previews'],
		aspectRatio: '2:3'
	},
	'1024x512': {
		label: 'Twitter Legacy',
		platforms: ['Twitter (Legacy)', 'Blog Headers'],
		description:
			'Legacy Twitter card size, still used for some blog headers and older integrations.',
		useCases: ['Legacy Twitter cards', 'Blog headers', 'Newsletter banners'],
		aspectRatio: '2:1'
	}
};
