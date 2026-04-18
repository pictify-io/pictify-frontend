/**
 * Handlebars / HTML snippets the editor can insert on demand.
 *
 * Each snippet has:
 *   id         unique key
 *   label      one-line title shown in the library
 *   category   group for visual sectioning
 *   description short one-liner shown below the label
 *   body       the text to insert at the caret; supports a `$0` marker to
 *              place the cursor after insertion (CodeMirror-compatible)
 */

export const SNIPPET_CATEGORIES = [
	{ key: 'layout', label: 'Layout' },
	{ key: 'logic', label: 'Logic' },
	{ key: 'format', label: 'Format' },
	{ key: 'starter', label: 'Starter' },
	{ key: 'components', label: 'Components' },
	{ key: 'social', label: 'Social' },
	{ key: 'data-viz', label: 'Data Viz' }
];

export const SNIPPETS = [
	// --- LAYOUT ---
	{
		id: 'center-block',
		category: 'layout',
		label: 'Centered block',
		description: 'Flex-centered 1080×1080 block',
		body:
			'<div style="width:1080px;height:1080px;display:flex;align-items:center;justify-content:center;background:#FFFDF8;font-family:Inter,sans-serif;">\n  $0\n</div>'
	},
	{
		id: 'two-col',
		category: 'layout',
		label: 'Two-column grid',
		description: 'CSS grid, 1fr 1fr',
		body:
			'<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:48px;">\n  <div>$0</div>\n  <div></div>\n</div>'
	},
	{
		id: 'card',
		category: 'layout',
		label: 'Bordered card',
		description: 'Rounded card with shadow',
		body:
			'<div style="border:3px solid #1f2937;border-radius:12px;padding:24px;box-shadow:6px 6px 0 0 #1f2937;background:white;">\n  $0\n</div>'
	},

	// --- LOGIC ---
	{
		id: 'if',
		category: 'logic',
		label: '#if conditional',
		description: 'Render when truthy',
		body: '{{#if condition}}\n  $0\n{{/if}}'
	},
	{
		id: 'if-else',
		category: 'logic',
		label: '#if / else',
		description: 'Truthy + fallback branch',
		body: '{{#if condition}}\n  $0\n{{else}}\n  fallback\n{{/if}}'
	},
	{
		id: 'each',
		category: 'logic',
		label: '#each loop',
		description: 'Iterate over an array',
		body: '{{#each items}}\n  <li>{{this.name}}</li>$0\n{{/each}}'
	},
	{
		id: 'each-index',
		category: 'logic',
		label: '#each with @index',
		description: 'Access iteration index',
		body:
			'{{#each items}}\n  <p>{{@index}}. {{this}}</p>$0\n{{/each}}'
	},
	{
		id: 'unless',
		category: 'logic',
		label: '#unless',
		description: 'Render when falsy',
		body: '{{#unless condition}}\n  $0\n{{/unless}}'
	},

	// --- FORMAT ---
	{
		id: 'currency',
		category: 'format',
		label: 'Currency',
		description: 'Format a number as USD',
		body: '{{currency amount "USD"}}$0'
	},
	{
		id: 'uppercase',
		category: 'format',
		label: 'Uppercase',
		description: 'ALL CAPS a string',
		body: '{{uppercase name}}$0'
	},
	{
		id: 'title-case',
		category: 'format',
		label: 'Title Case',
		description: 'Capitalize Each Word',
		body: '{{titleCase name}}$0'
	},
	{
		id: 'date',
		category: 'format',
		label: 'Date',
		description: 'Format ISO date string',
		body: '{{date createdAt "short"}}$0'
	},
	{
		id: 'truncate',
		category: 'format',
		label: 'Truncate',
		description: 'Clip string to length',
		body: '{{truncate description 80 "…"}}$0'
	},
	{
		id: 'default',
		category: 'format',
		label: 'Default fallback',
		description: 'Use fallback when empty',
		body: '{{default value "—"}}$0'
	},

	// --- STARTER templates ---
	{
		id: 'og-image',
		category: 'starter',
		label: 'OG image',
		description: 'Hero heading + subtitle',
		body:
			'<div style="width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;padding:64px;background:#FFFDF8;font-family:Inter,sans-serif;">\n  <h1 style="font-size:80px;font-weight:900;color:#1f2937;margin:0;letter-spacing:-0.02em;">{{title}}</h1>\n  <p style="font-size:32px;color:#6b7280;margin-top:16px;">{{subtitle}}</p>\n</div>'
	},
	{
		id: 'invoice-row',
		category: 'starter',
		label: 'Invoice line-items',
		description: 'Table of items with totals',
		body:
			'<table style="width:100%;border-collapse:collapse;font-family:Inter,sans-serif;">\n  <thead>\n    <tr>\n      <th style="text-align:left;padding:12px;border-bottom:2px solid #1f2937;">Item</th>\n      <th style="text-align:right;padding:12px;border-bottom:2px solid #1f2937;">Amount</th>\n    </tr>\n  </thead>\n  <tbody>\n    {{#each items}}\n      <tr>\n        <td style="padding:12px;">{{this.name}}</td>\n        <td style="padding:12px;text-align:right;">{{currency this.price "USD"}}</td>\n      </tr>\n    {{/each}}\n  </tbody>\n  <tfoot>\n    <tr>\n      <td style="padding:12px;border-top:2px solid #1f2937;font-weight:700;">Total</td>\n      <td style="padding:12px;border-top:2px solid #1f2937;font-weight:700;text-align:right;">{{currency total "USD"}}</td>\n    </tr>\n  </tfoot>\n</table>'
	},
	{
		id: 'certificate',
		category: 'starter',
		label: 'Certificate',
		description: 'Award-style layout',
		body:
			'<div style="width:1200px;height:800px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;background:#FFFDF8;border:12px solid #ffc480;font-family:Inter,sans-serif;">\n  <p style="font-size:24px;letter-spacing:0.3em;text-transform:uppercase;color:#6b7280;">Certificate of Completion</p>\n  <h1 style="font-size:72px;font-weight:900;color:#1f2937;margin:24px 0 0;">{{recipient}}</h1>\n  <p style="font-size:24px;color:#6b7280;margin-top:24px;">has successfully completed</p>\n  <p style="font-size:36px;font-weight:700;color:#1f2937;margin-top:8px;">{{courseName}}</p>\n  <p style="font-size:18px;color:#6b7280;margin-top:48px;">{{date completedOn "long"}}</p>\n</div>'
	},
	{
		id: 'quote-card',
		category: 'starter',
		label: 'Testimonial / quote',
		description: 'Pull-quote with author + avatar',
		body:
			'<div style="width:1080px;height:1080px;display:flex;flex-direction:column;justify-content:center;padding:80px;background:#FFFDF8;font-family:Inter,sans-serif;">\n  <div style="font-size:140px;line-height:1;color:#ffc480;font-weight:900;">&ldquo;</div>\n  <p style="font-size:40px;font-weight:600;line-height:1.3;color:#1f2937;margin:0 0 40px;">{{quote}}</p>\n  <div style="display:flex;align-items:center;gap:16px;">\n    <img src="{{authorAvatar}}" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid #1f2937;" />\n    <div>\n      <p style="font-size:22px;font-weight:700;color:#1f2937;margin:0;">{{authorName}}</p>\n      <p style="font-size:16px;color:#6b7280;margin:4px 0 0;">{{authorTitle}}</p>\n    </div>\n  </div>\n</div>'
	},
	{
		id: 'pricing-tier',
		category: 'starter',
		label: 'Pricing tier',
		description: 'Plan card with feature list',
		body:
			'<div style="width:480px;padding:48px;background:white;border:3px solid #1f2937;border-radius:16px;box-shadow:8px 8px 0 0 #1f2937;font-family:Inter,sans-serif;">\n  <p style="font-size:14px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#ffc480;margin:0 0 12px;">{{planName}}</p>\n  <h2 style="font-size:56px;font-weight:900;color:#1f2937;margin:0;">{{currency price "USD"}}<span style="font-size:20px;color:#6b7280;font-weight:500;">/mo</span></h2>\n  <p style="font-size:16px;color:#6b7280;margin:12px 0 32px;">{{tagline}}</p>\n  <ul style="list-style:none;padding:0;margin:0 0 32px;">\n    {{#each features}}\n      <li style="padding:8px 0;font-size:16px;color:#1f2937;">\u2713 {{this}}</li>\n    {{/each}}\n  </ul>\n  <div style="padding:16px 24px;background:#1f2937;color:white;border-radius:8px;text-align:center;font-weight:700;">{{ctaLabel}}</div>\n</div>'
	},
	{
		id: 'receipt',
		category: 'starter',
		label: 'Receipt / checkout',
		description: 'Order summary with totals',
		body:
			'<div style="width:520px;padding:48px;background:white;font-family:ui-monospace,\'SF Mono\',monospace;border:2px solid #1f2937;">\n  <div style="text-align:center;padding-bottom:24px;border-bottom:2px dashed #1f2937;">\n    <h1 style="font-size:24px;font-weight:900;margin:0;letter-spacing:0.2em;">{{storeName}}</h1>\n    <p style="font-size:12px;color:#6b7280;margin:4px 0 0;">{{date orderDate "short"}} · Order #{{orderNumber}}</p>\n  </div>\n  <div style="padding:24px 0;">\n    {{#each items}}\n      <div style="display:flex;justify-content:space-between;font-size:14px;padding:6px 0;">\n        <span>{{this.qty}}\u00D7 {{this.name}}</span>\n        <span>{{currency this.price "USD"}}</span>\n      </div>\n    {{/each}}\n  </div>\n  <div style="padding-top:16px;border-top:2px dashed #1f2937;">\n    <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:900;">\n      <span>Total</span><span>{{currency total "USD"}}</span>\n    </div>\n  </div>\n</div>'
	},
	{
		id: 'kpi-tile',
		category: 'components',
		label: 'KPI / metric tile',
		description: 'Headline number + trend delta',
		body:
			'<div style="width:320px;padding:24px;background:#FFFDF8;border:3px solid #1f2937;border-radius:12px;box-shadow:4px 4px 0 0 #1f2937;font-family:Inter,sans-serif;">\n  <p style="font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;margin:0;">{{label}}</p>\n  <h3 style="font-size:48px;font-weight:900;color:#1f2937;margin:8px 0 4px;letter-spacing:-0.02em;">{{value}}</h3>\n  {{#if delta}}\n    <p style="font-size:14px;font-weight:700;color:#22c55e;margin:0;">\u2191 {{delta}}% vs last week</p>\n  {{/if}}\n</div>'
	},
	{
		id: 'leaderboard-row',
		category: 'components',
		label: 'Leaderboard row',
		description: 'Rank · name · metric',
		body:
			'{{#each entries}}\n  <div style="display:flex;align-items:center;gap:16px;padding:12px 20px;border-bottom:2px solid #1f2937;font-family:Inter,sans-serif;">\n    <span style="font-size:24px;font-weight:900;color:#ffc480;width:40px;">#{{@index}}</span>\n    <img src="{{this.avatar}}" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />\n    <span style="flex:1;font-size:18px;font-weight:700;color:#1f2937;">{{this.name}}</span>\n    <span style="font-size:18px;font-weight:900;color:#1f2937;">{{this.score}}</span>\n  </div>\n{{/each}}'
	},
	{
		id: 'avatar-block',
		category: 'components',
		label: 'Avatar + name',
		description: 'Round avatar with name + role',
		body:
			'<div style="display:flex;align-items:center;gap:12px;font-family:Inter,sans-serif;">\n  <img src="{{avatarUrl}}" alt="{{name}}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid #1f2937;" />\n  <div>\n    <p style="font-size:16px;font-weight:700;color:#1f2937;margin:0;">{{name}}</p>\n    <p style="font-size:13px;color:#6b7280;margin:2px 0 0;">{{role}}</p>\n  </div>\n</div>'
	},
	{
		id: 'badge-row',
		category: 'components',
		label: 'Tag / badge row',
		description: 'Pill-shaped tags from an array',
		body:
			'<div style="display:flex;flex-wrap:wrap;gap:8px;font-family:Inter,sans-serif;">\n  {{#each tags}}\n    <span style="padding:6px 12px;background:#ffc480;border:2px solid #1f2937;border-radius:999px;font-size:12px;font-weight:900;letter-spacing:0.05em;text-transform:uppercase;color:#1f2937;">{{this}}</span>\n  {{/each}}\n</div>'
	},
	{
		id: 'progress-bar',
		category: 'components',
		label: 'Progress bar',
		description: 'Percentage fill with label',
		body:
			'<div style="font-family:Inter,sans-serif;">\n  <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:#1f2937;margin-bottom:6px;">\n    <span>{{label}}</span><span>{{percent}}%</span>\n  </div>\n  <div style="width:100%;height:12px;background:#f3f4f6;border:2px solid #1f2937;border-radius:999px;overflow:hidden;">\n    <div style="width:{{percent}}%;height:100%;background:#ffc480;"></div>\n  </div>\n</div>'
	},
	{
		id: 'tweet-card',
		category: 'social',
		label: 'Tweet / post card',
		description: 'Profile · handle · text · time',
		body:
			'<div style="width:600px;padding:24px;background:white;border:3px solid #1f2937;border-radius:12px;box-shadow:4px 4px 0 0 #1f2937;font-family:Inter,sans-serif;">\n  <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">\n    <img src="{{authorAvatar}}" alt="" style="width:48px;height:48px;border-radius:50%;object-fit:cover;" />\n    <div>\n      <p style="font-size:16px;font-weight:700;color:#1f2937;margin:0;">{{authorName}}</p>\n      <p style="font-size:14px;color:#6b7280;margin:2px 0 0;">@{{authorHandle}}</p>\n    </div>\n  </div>\n  <p style="font-size:20px;line-height:1.4;color:#1f2937;margin:0 0 16px;">{{postText}}</p>\n  <p style="font-size:13px;color:#6b7280;margin:0;">{{date postedAt "short"}} \u00B7 {{source}}</p>\n</div>'
	},
	{
		id: 'social-story',
		category: 'social',
		label: 'Social story 9:16',
		description: 'Vertical 1080\u00D71920 quote frame',
		body:
			'<div style="width:1080px;height:1920px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:80px;background:#ffc480;font-family:Inter,sans-serif;text-align:center;">\n  <h1 style="font-size:96px;font-weight:900;color:#1f2937;letter-spacing:-0.02em;line-height:1.05;margin:0;">{{headline}}</h1>\n  <p style="font-size:36px;color:#1f2937;margin-top:48px;max-width:800px;">{{subtitle}}</p>\n  <p style="font-size:20px;font-weight:900;color:#1f2937;letter-spacing:0.3em;text-transform:uppercase;margin-top:auto;">@{{handle}}</p>\n</div>'
	},
	{
		id: 'linkedin-banner',
		category: 'social',
		label: 'LinkedIn banner 4:1',
		description: 'Wide banner with name + tagline',
		body:
			'<div style="width:1584px;height:396px;display:flex;flex-direction:column;justify-content:center;padding:64px;background:#FFFDF8;border-bottom:8px solid #ffc480;font-family:Inter,sans-serif;">\n  <h1 style="font-size:72px;font-weight:900;color:#1f2937;margin:0;letter-spacing:-0.02em;">{{name}}</h1>\n  <p style="font-size:28px;color:#6b7280;margin-top:12px;">{{tagline}}</p>\n</div>'
	},
	{
		id: 'footer-signature',
		category: 'components',
		label: 'Footer / email signature',
		description: 'Name, title, socials row',
		body:
			'<div style="display:flex;align-items:center;gap:16px;padding:16px 0;border-top:2px solid #e5e7eb;font-family:Inter,sans-serif;">\n  <img src="{{avatarUrl}}" alt="" style="width:48px;height:48px;border-radius:8px;object-fit:cover;" />\n  <div style="flex:1;">\n    <p style="font-size:14px;font-weight:700;color:#1f2937;margin:0;">{{name}} \u00B7 <span style="color:#6b7280;font-weight:500;">{{title}}</span></p>\n    <p style="font-size:12px;color:#6b7280;margin:2px 0 0;">{{email}} \u00B7 {{website}}</p>\n  </div>\n</div>'
	},
	{
		id: 'feature-grid',
		category: 'layout',
		label: 'Feature grid 3\u00D72',
		description: 'Icon + title + copy tiles',
		body:
			'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:48px;font-family:Inter,sans-serif;">\n  {{#each features}}\n    <div style="padding:24px;background:white;border:3px solid #1f2937;border-radius:12px;">\n      <div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:#ffc480;border:2px solid #1f2937;border-radius:8px;font-size:24px;">{{this.icon}}</div>\n      <h3 style="font-size:18px;font-weight:900;color:#1f2937;margin:16px 0 8px;">{{this.title}}</h3>\n      <p style="font-size:14px;line-height:1.5;color:#6b7280;margin:0;">{{this.body}}</p>\n    </div>\n  {{/each}}\n</div>'
	},
	{
		id: 'stat-row',
		category: 'layout',
		label: 'Stat row 4-up',
		description: 'Horizontal number strip',
		body:
			'<div style="display:flex;gap:0;border:3px solid #1f2937;border-radius:12px;overflow:hidden;font-family:Inter,sans-serif;">\n  {{#each stats}}\n    <div style="flex:1;padding:24px;text-align:center;border-right:2px solid #1f2937;">\n      <p style="font-size:40px;font-weight:900;color:#1f2937;margin:0;">{{this.value}}</p>\n      <p style="font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;margin:8px 0 0;">{{this.label}}</p>\n    </div>\n  {{/each}}\n</div>'
	},

	// --- Additional STARTER templates ---
	{
		id: 'product-launch',
		category: 'starter',
		label: 'Product launch card',
		description: 'Hero + version badge + CTA',
		body:
			'<div style="width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;padding:80px;background:linear-gradient(135deg,#FFFDF8 0%,#ffe066 100%);font-family:Inter,sans-serif;">\n  <span style="align-self:flex-start;padding:6px 16px;background:#1f2937;color:#ffc480;border-radius:999px;font-size:14px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;">v{{default version "1.0"}} \u2022 {{default shipDate "Today"}}</span>\n  <h1 style="font-size:88px;font-weight:900;color:#1f2937;margin:24px 0 12px;letter-spacing:-0.03em;line-height:1;">{{productName}}</h1>\n  <p style="font-size:28px;color:#1f2937;margin:0 0 32px;max-width:800px;line-height:1.3;">{{tagline}}</p>\n  <div style="display:flex;gap:12px;">\n    <span style="padding:14px 28px;background:#1f2937;color:white;border-radius:8px;font-weight:700;font-size:16px;">{{default ctaPrimary "Try it free"}}</span>\n    <span style="padding:14px 28px;background:transparent;color:#1f2937;border:3px solid #1f2937;border-radius:8px;font-weight:700;font-size:16px;">{{default ctaSecondary "View changelog"}}</span>\n  </div>\n</div>'
	},
	{
		id: 'event-invite',
		category: 'starter',
		label: 'Event invite',
		description: 'Date, time, location, speaker',
		body:
			'<div style="width:1080px;height:1080px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:80px;background:#1f2937;color:white;font-family:Inter,sans-serif;text-align:center;">\n  <span style="padding:8px 20px;background:#ffc480;color:#1f2937;border-radius:999px;font-size:14px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:40px;">{{default eventType "Live Event"}}</span>\n  <h1 style="font-size:96px;font-weight:900;letter-spacing:-0.02em;margin:0 0 24px;line-height:1;">{{eventName}}</h1>\n  <p style="font-size:28px;color:#9ca3af;margin:0 0 60px;max-width:700px;line-height:1.4;">{{tagline}}</p>\n  <div style="display:flex;gap:48px;margin-bottom:60px;font-size:20px;">\n    <div><p style="font-size:12px;letter-spacing:0.3em;color:#ffc480;font-weight:900;margin:0 0 6px;">DATE</p><p style="margin:0;font-weight:700;">{{date eventDate "long"}}</p></div>\n    <div><p style="font-size:12px;letter-spacing:0.3em;color:#ffc480;font-weight:900;margin:0 0 6px;">TIME</p><p style="margin:0;font-weight:700;">{{time eventTime}}</p></div>\n    <div><p style="font-size:12px;letter-spacing:0.3em;color:#ffc480;font-weight:900;margin:0 0 6px;">WHERE</p><p style="margin:0;font-weight:700;">{{location}}</p></div>\n  </div>\n  <p style="font-size:18px;color:#d1d5db;margin:0;">Hosted by <span style="color:#ffc480;font-weight:700;">{{host}}</span></p>\n</div>'
	},
	{
		id: 'newsletter-header',
		category: 'starter',
		label: 'Newsletter header',
		description: 'Issue number + date + masthead',
		body:
			'<div style="width:1200px;padding:48px;background:#FFFDF8;border-bottom:6px solid #1f2937;font-family:Inter,sans-serif;">\n  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;">\n    <span style="font-size:12px;letter-spacing:0.3em;color:#6b7280;font-weight:900;">ISSUE #{{issueNumber}}</span>\n    <span style="font-size:12px;letter-spacing:0.3em;color:#6b7280;font-weight:900;">{{date publishedAt "long"}}</span>\n  </div>\n  <h1 style="font-size:64px;font-weight:900;color:#1f2937;margin:0 0 12px;letter-spacing:-0.02em;line-height:1;">{{newsletterName}}</h1>\n  <p style="font-size:22px;color:#6b7280;margin:0;font-style:italic;">{{tagline}}</p>\n</div>'
	},
	{
		id: 'podcast-cover',
		category: 'starter',
		label: 'Podcast cover art',
		description: '1400\u00D71400 with episode number',
		body:
			'<div style="width:1400px;height:1400px;display:flex;flex-direction:column;justify-content:space-between;padding:120px;background:radial-gradient(circle at top left,#ffc480 0%,#ff6b6b 100%);color:white;font-family:Inter,sans-serif;">\n  <div>\n    <span style="padding:10px 24px;background:#1f2937;border-radius:999px;font-size:18px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;">EP {{episodeNumber}}</span>\n  </div>\n  <div>\n    <h1 style="font-size:120px;font-weight:900;letter-spacing:-0.03em;margin:0 0 32px;line-height:0.95;">{{episodeTitle}}</h1>\n    <p style="font-size:32px;opacity:0.9;margin:0 0 48px;max-width:1000px;line-height:1.3;">{{description}}</p>\n    <div style="display:flex;align-items:center;gap:20px;">\n      <img src="{{guestAvatar}}" alt="" style="width:80px;height:80px;border-radius:40px;border:4px solid white;object-fit:cover;" />\n      <div>\n        <p style="font-size:24px;font-weight:900;margin:0;">with {{guestName}}</p>\n        <p style="font-size:18px;margin:4px 0 0;opacity:0.8;">{{duration}}</p>\n      </div>\n    </div>\n  </div>\n</div>'
	},
	{
		id: 'video-thumbnail',
		category: 'starter',
		label: 'Video thumbnail',
		description: '16:9 with play overlay + title',
		body:
			'<div style="width:1920px;height:1080px;position:relative;background:#1f2937;font-family:Inter,sans-serif;color:white;overflow:hidden;">\n  <img src="{{backgroundImage}}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.4;" />\n  <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:80px;background:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.7) 100%);">\n    <div style="align-self:flex-start;padding:8px 20px;background:#ff6b6b;border-radius:6px;font-size:16px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;">\u25B6 {{default badge "WATCH NOW"}}</div>\n    <div>\n      <h1 style="font-size:112px;font-weight:900;letter-spacing:-0.03em;margin:0 0 20px;line-height:1;max-width:1400px;">{{title}}</h1>\n      <p style="font-size:32px;opacity:0.9;margin:0;">{{channelName}} \u2022 {{viewCount}} views</p>\n    </div>\n  </div>\n</div>'
	},
	{
		id: 'twitter-x-card',
		category: 'starter',
		label: 'Twitter / X image card',
		description: 'Quote tweet with large preview',
		body:
			'<div style="width:1200px;height:675px;display:flex;flex-direction:column;justify-content:center;padding:80px;background:#000;color:white;font-family:Inter,-apple-system,sans-serif;">\n  <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px;">\n    <img src="{{authorAvatar}}" alt="" style="width:64px;height:64px;border-radius:32px;object-fit:cover;" />\n    <div>\n      <p style="margin:0;font-size:22px;font-weight:700;">{{authorName}} <span style="color:#1d9bf0;">\u2713</span></p>\n      <p style="margin:2px 0 0;font-size:18px;color:#71767b;">@{{authorHandle}}</p>\n    </div>\n  </div>\n  <p style="font-size:42px;line-height:1.4;margin:0;font-weight:400;">{{postText}}</p>\n  <p style="margin:32px 0 0;font-size:16px;color:#71767b;">{{time postedAt}} \u00B7 {{views}} views</p>\n</div>'
	},

	// --- Additional COMPONENTS ---
	{
		id: 'alert-banner',
		category: 'components',
		label: 'Alert banner',
		description: 'Status with icon + message',
		body:
			'<div style="display:flex;align-items:center;gap:12px;padding:14px 18px;background:{{default alertBg "#ffe066"}};border:2px solid #1f2937;border-radius:8px;font-family:Inter,sans-serif;">\n  <div style="flex-shrink:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:#1f2937;color:#ffc480;border-radius:50%;font-weight:900;font-size:16px;">!</div>\n  <div style="flex:1;">\n    <p style="margin:0;font-size:13px;font-weight:900;color:#1f2937;">{{title}}</p>\n    <p style="margin:2px 0 0;font-size:12px;color:#374151;line-height:1.4;">{{message}}</p>\n  </div>\n</div>'
	},
	{
		id: 'timeline-entry',
		category: 'components',
		label: 'Timeline / changelog',
		description: 'Vertical entries with dates',
		body:
			'<div style="padding:32px;font-family:Inter,sans-serif;">\n  {{#each events}}\n    <div style="display:flex;gap:20px;position:relative;padding-bottom:32px;">\n      <div style="flex-shrink:0;width:40px;position:relative;">\n        <div style="width:16px;height:16px;background:#ffc480;border:3px solid #1f2937;border-radius:50%;margin:4px auto;"></div>\n        {{#unless @last}}<div style="position:absolute;left:50%;top:20px;bottom:0;width:2px;background:#1f2937;transform:translateX(-50%);"></div>{{/unless}}\n      </div>\n      <div style="flex:1;">\n        <p style="margin:0;font-size:11px;font-weight:900;letter-spacing:0.2em;color:#6b7280;text-transform:uppercase;">{{date this.at "short"}}</p>\n        <h3 style="margin:4px 0 6px;font-size:16px;font-weight:900;color:#1f2937;">{{this.title}}</h3>\n        <p style="margin:0;font-size:13px;line-height:1.5;color:#4b5563;">{{this.body}}</p>\n      </div>\n    </div>\n  {{/each}}\n</div>'
	},
	{
		id: 'step-indicator',
		category: 'components',
		label: 'Step indicator',
		description: 'Numbered progress chain',
		body:
			'<div style="display:flex;align-items:center;gap:8px;font-family:Inter,sans-serif;">\n  {{#each steps}}\n    <div style="display:flex;align-items:center;gap:8px;">\n      <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:2px solid #1f2937;font-weight:900;font-size:14px;background:{{#if this.done}}#4ade80{{else}}white{{/if}};">{{#if this.done}}\u2713{{else}}{{this.n}}{{/if}}</div>\n      <span style="font-size:12px;font-weight:700;color:{{#if this.done}}#1f2937{{else}}#6b7280{{/if}};">{{this.label}}</span>\n    </div>\n    {{#unless @last}}<div style="flex:1;height:2px;background:#1f2937;min-width:20px;"></div>{{/unless}}\n  {{/each}}\n</div>'
	},
	{
		id: 'rating-stars',
		category: 'components',
		label: 'Rating with stars',
		description: 'Score + visual fill',
		body:
			'<div style="display:flex;align-items:center;gap:12px;font-family:Inter,sans-serif;">\n  <span style="font-size:44px;font-weight:900;color:#1f2937;letter-spacing:-0.02em;">{{score}}</span>\n  <div style="display:flex;flex-direction:column;gap:4px;">\n    <div style="font-size:18px;letter-spacing:2px;color:#ffc480;">\u2605\u2605\u2605\u2605\u2605</div>\n    <p style="margin:0;font-size:12px;color:#6b7280;font-weight:700;">{{reviewCount}} reviews</p>\n  </div>\n</div>'
	},
	{
		id: 'countdown-block',
		category: 'components',
		label: 'Countdown / date block',
		description: 'Calendar-style big date',
		body:
			'<div style="display:inline-flex;flex-direction:column;align-items:center;border:3px solid #1f2937;border-radius:12px;overflow:hidden;font-family:Inter,sans-serif;width:120px;box-shadow:4px 4px 0 0 #1f2937;">\n  <div style="width:100%;padding:6px;background:#ff6b6b;text-align:center;color:white;font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;">{{default month "APR"}}</div>\n  <div style="padding:16px 0;text-align:center;background:white;width:100%;">\n    <p style="margin:0;font-size:56px;font-weight:900;color:#1f2937;line-height:1;">{{day}}</p>\n    <p style="margin:4px 0 0;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.1em;text-transform:uppercase;">{{weekday}}</p>\n  </div>\n</div>'
	},
	{
		id: 'diff-comparison',
		category: 'components',
		label: 'Before / after compare',
		description: 'Two-column comparison strip',
		body:
			'<div style="display:grid;grid-template-columns:1fr 1fr;border:3px solid #1f2937;border-radius:12px;overflow:hidden;font-family:Inter,sans-serif;">\n  <div style="padding:24px;background:#fee2e2;border-right:2px solid #1f2937;">\n    <p style="margin:0 0 8px;font-size:11px;font-weight:900;letter-spacing:0.2em;color:#b91c1c;">BEFORE</p>\n    <p style="margin:0;font-size:32px;font-weight:900;color:#1f2937;line-height:1;">{{beforeValue}}</p>\n    <p style="margin:8px 0 0;font-size:14px;color:#4b5563;">{{beforeLabel}}</p>\n  </div>\n  <div style="padding:24px;background:#dcfce7;">\n    <p style="margin:0 0 8px;font-size:11px;font-weight:900;letter-spacing:0.2em;color:#15803d;">AFTER</p>\n    <p style="margin:0;font-size:32px;font-weight:900;color:#1f2937;line-height:1;">{{afterValue}}</p>\n    <p style="margin:8px 0 0;font-size:14px;color:#4b5563;">{{afterLabel}}</p>\n  </div>\n</div>'
	},
	{
		id: 'team-lineup',
		category: 'components',
		label: 'Team avatar lineup',
		description: 'Overlapping avatars + count',
		body:
			'<div style="display:flex;align-items:center;gap:12px;font-family:Inter,sans-serif;">\n  <div style="display:flex;">\n    {{#each members}}\n      <img src="{{this.avatar}}" alt="{{this.name}}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:3px solid #FFFDF8;margin-left:{{#if @first}}0{{else}}-14px{{/if}};" />\n    {{/each}}\n  </div>\n  <p style="margin:0;font-size:13px;font-weight:700;color:#1f2937;">{{default leaderLine "Alex, Jordan"}} <span style="color:#6b7280;font-weight:500;">and {{othersCount}} others</span></p>\n</div>'
	},
	{
		id: 'code-block',
		category: 'components',
		label: 'Code snippet card',
		description: 'Mono-font card with language badge',
		body:
			'<div style="max-width:640px;border:3px solid #1f2937;border-radius:12px;overflow:hidden;font-family:ui-monospace,\'SF Mono\',Menlo,monospace;box-shadow:4px 4px 0 0 #1f2937;">\n  <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#1f2937;color:#ffc480;font-family:Inter,sans-serif;">\n    <span style="font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;">{{default language "JavaScript"}}</span>\n    <span style="font-size:11px;color:#9ca3af;">{{filename}}</span>\n  </div>\n  <pre style="margin:0;padding:20px;background:#0f172a;color:#e2e8f0;font-size:13px;line-height:1.6;overflow-x:auto;">{{{code}}}</pre>\n</div>'
	},

	// --- Additional SOCIAL ---
	{
		id: 'instagram-square',
		category: 'social',
		label: 'Instagram square',
		description: '1080\u00D71080 split layout',
		body:
			'<div style="width:1080px;height:1080px;display:grid;grid-template-rows:1fr 1fr;background:#FFFDF8;font-family:Inter,sans-serif;">\n  <div style="padding:80px 80px 40px;">\n    <p style="margin:0 0 24px;font-size:16px;font-weight:900;letter-spacing:0.3em;color:#ff6b6b;text-transform:uppercase;">{{default hookLabel "HOT TAKE"}}</p>\n    <h1 style="margin:0;font-size:88px;font-weight:900;color:#1f2937;line-height:0.95;letter-spacing:-0.03em;">{{headline}}</h1>\n  </div>\n  <div style="padding:40px 80px 80px;background:#1f2937;color:white;display:flex;flex-direction:column;justify-content:space-between;">\n    <p style="margin:0;font-size:32px;line-height:1.3;">{{body}}</p>\n    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:40px;font-size:16px;">\n      <span style="font-weight:900;color:#ffc480;">@{{handle}}</span>\n      <span>\u2014 SWIPE \u2192</span>\n    </div>\n  </div>\n</div>'
	},
	{
		id: 'youtube-thumbnail',
		category: 'social',
		label: 'YouTube thumbnail',
		description: '1280\u00D7720 with hot-pink text',
		body:
			'<div style="width:1280px;height:720px;position:relative;background:linear-gradient(135deg,#f43f5e 0%,#7c3aed 100%);overflow:hidden;font-family:Inter,sans-serif;">\n  <div style="position:absolute;inset:40px;display:flex;flex-direction:column;justify-content:space-between;">\n    <div style="align-self:flex-start;padding:8px 20px;background:#facc15;color:#1f2937;border-radius:6px;font-size:14px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;">{{default tag "MUST WATCH"}}</div>\n    <h1 style="margin:0;font-size:140px;font-weight:900;color:white;line-height:0.9;letter-spacing:-0.04em;text-shadow:4px 4px 0 #1f2937;">{{hook}}</h1>\n    <div style="display:flex;align-items:center;gap:16px;">\n      <img src="{{creatorAvatar}}" alt="" style="width:64px;height:64px;border-radius:32px;border:3px solid white;object-fit:cover;" />\n      <span style="font-size:22px;font-weight:900;color:white;">{{creatorName}}</span>\n    </div>\n  </div>\n</div>'
	},
	{
		id: 'pinterest-pin',
		category: 'social',
		label: 'Pinterest pin 2:3',
		description: '1000\u00D71500 vertical pin',
		body:
			'<div style="width:1000px;height:1500px;display:flex;flex-direction:column;justify-content:space-between;padding:64px;background:linear-gradient(180deg,#FFFDF8 0%,#ffe066 100%);font-family:Inter,sans-serif;">\n  <div>\n    <span style="padding:6px 16px;background:#1f2937;color:#ffc480;border-radius:999px;font-size:14px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;">{{default pinCategory "IDEAS"}}</span>\n    <h1 style="margin:32px 0 24px;font-size:88px;font-weight:900;color:#1f2937;line-height:0.95;letter-spacing:-0.03em;">{{title}}</h1>\n    <p style="margin:0;font-size:28px;color:#4b5563;line-height:1.4;">{{summary}}</p>\n  </div>\n  <div style="display:flex;align-items:center;justify-content:space-between;border-top:2px solid #1f2937;padding-top:24px;">\n    <span style="font-size:22px;font-weight:900;color:#1f2937;">{{siteName}}</span>\n    <span style="font-size:18px;color:#6b7280;">{{readTime}} min read</span>\n  </div>\n</div>'
	},

	// --- DATA VIZ (new category) ---
	{
		id: 'bar-chart',
		category: 'data-viz',
		label: 'Horizontal bar chart',
		description: 'CSS-only bars from an array',
		body:
			'<div style="max-width:640px;padding:24px;font-family:Inter,sans-serif;">\n  <h3 style="margin:0 0 20px;font-size:14px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#1f2937;">{{default chartTitle "Top sources"}}</h3>\n  <div style="display:flex;flex-direction:column;gap:12px;">\n    {{#each rows}}\n      <div>\n        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#1f2937;margin-bottom:4px;">\n          <span>{{this.label}}</span><span>{{this.value}}</span>\n        </div>\n        <div style="width:100%;height:16px;background:#f3f4f6;border:2px solid #1f2937;border-radius:999px;overflow:hidden;">\n          <div style="width:{{this.percent}}%;height:100%;background:#ffc480;"></div>\n        </div>\n      </div>\n    {{/each}}\n  </div>\n</div>'
	},
	{
		id: 'metric-with-spark',
		category: 'data-viz',
		label: 'Metric + CSS sparkline',
		description: 'Headline number + inline trend blocks',
		body:
			'<div style="display:flex;flex-direction:column;gap:12px;padding:20px;border:3px solid #1f2937;border-radius:12px;background:white;font-family:Inter,sans-serif;max-width:280px;">\n  <p style="margin:0;font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;">{{metricLabel}}</p>\n  <p style="margin:0;font-size:40px;font-weight:900;color:#1f2937;line-height:1;letter-spacing:-0.02em;">{{metricValue}}</p>\n  <div style="display:flex;align-items:flex-end;gap:3px;height:36px;">\n    {{#each bars}}\n      <div style="flex:1;background:#ffc480;border:1.5px solid #1f2937;border-radius:2px;height:{{this}}%;"></div>\n    {{/each}}\n  </div>\n  <p style="margin:0;font-size:11px;color:#22c55e;font-weight:700;">\u2191 {{trendDelta}}% this week</p>\n</div>'
	},
	{
		id: 'donut-metric',
		category: 'data-viz',
		label: 'Donut / conic metric',
		description: 'Circular progress via conic-gradient',
		body:
			'<div style="display:flex;align-items:center;gap:24px;padding:24px;font-family:Inter,sans-serif;">\n  <div style="width:140px;height:140px;border-radius:50%;background:conic-gradient(#ffc480 0% {{percent}}%,#f3f4f6 {{percent}}% 100%);display:flex;align-items:center;justify-content:center;border:3px solid #1f2937;">\n    <div style="width:96px;height:96px;background:white;border-radius:50%;border:2px solid #1f2937;display:flex;align-items:center;justify-content:center;flex-direction:column;">\n      <span style="font-size:28px;font-weight:900;color:#1f2937;line-height:1;">{{percent}}%</span>\n      <span style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6b7280;font-weight:700;">{{metric}}</span>\n    </div>\n  </div>\n  <div>\n    <h3 style="margin:0 0 4px;font-size:20px;font-weight:900;color:#1f2937;">{{title}}</h3>\n    <p style="margin:0;font-size:13px;color:#6b7280;">{{description}}</p>\n  </div>\n</div>'
	},
	{
		id: 'heatmap-row',
		category: 'data-viz',
		label: 'Heatmap / activity grid',
		description: '7-day contribution squares',
		body:
			'<div style="padding:20px;font-family:Inter,sans-serif;">\n  <p style="margin:0 0 12px;font-size:12px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#1f2937;">{{default rowLabel "Last 7 days"}}</p>\n  <div style="display:flex;gap:6px;">\n    {{#each days}}\n      <div style="width:28px;height:28px;border:2px solid #1f2937;border-radius:4px;background:{{#if (isEmpty this.count)}}white{{else}}#ffc480{{/if}};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#1f2937;" title="{{this.label}}: {{this.count}}">{{default this.count "\u00B7"}}</div>\n    {{/each}}\n  </div>\n</div>'
	},
	{
		id: 'funnel-steps',
		category: 'data-viz',
		label: 'Conversion funnel',
		description: 'Tapered step rows with %',
		body:
			'<div style="padding:24px;font-family:Inter,sans-serif;">\n  <h3 style="margin:0 0 16px;font-size:13px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#1f2937;">{{default funnelTitle "Signup funnel"}}</h3>\n  <div style="display:flex;flex-direction:column;gap:8px;">\n    {{#each stages}}\n      <div style="margin:0 auto;width:{{this.widthPercent}}%;padding:14px 20px;background:#ffc480;border:2px solid #1f2937;border-radius:8px;display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:700;color:#1f2937;">\n        <span>{{this.label}}</span><span>{{this.count}} \u00B7 {{this.dropoff}}</span>\n      </div>\n    {{/each}}\n  </div>\n</div>'
	},

	// --- Additional FORMAT examples ---
	{
		id: 'percent-formatted',
		category: 'format',
		label: 'Percent with sign',
		description: 'Wrap a ratio as "12.3%"',
		body: '{{percent ratio}}$0'
	},
	{
		id: 'date-relative',
		category: 'format',
		label: 'Date (long)',
		description: 'Format ISO as "April 18, 2026"',
		body: '{{date timestamp "long"}}$0'
	},
	{
		id: 'default-chain',
		category: 'format',
		label: 'Default chain',
		description: 'Fall back through multiple values',
		body: '{{coalesce nickname firstName "Guest"}}$0'
	},
	{
		id: 'json-debug',
		category: 'format',
		label: 'JSON debug dump',
		description: 'Render a variable as raw JSON',
		body: '<pre style="background:#1f2937;color:#ffc480;padding:12px;border-radius:8px;font-size:12px;font-family:ui-monospace,monospace;">{{json payload}}</pre>$0'
	},
	{
		id: 'truncate-ellipsis',
		category: 'format',
		label: 'Truncate with custom ending',
		description: 'Cap length and append "…"',
		body: '{{truncate body 120 "\u2026"}}$0'
	},

	// --- Additional LOGIC ---
	{
		id: 'if-else-if',
		category: 'logic',
		label: 'If / else nesting',
		description: 'Branching via nested #if',
		body: '{{#if isAdmin}}\n  Admin dashboard\n{{else}}\n  {{#if isMember}}\n    Member view$0\n  {{else}}\n    Guest view\n  {{/if}}\n{{/if}}'
	},
	{
		id: 'each-empty-fallback',
		category: 'logic',
		label: '#each with empty fallback',
		description: 'Show placeholder when list is empty',
		body: '{{#each items}}\n  <li>{{this.name}}</li>\n{{else}}\n  <li style="color:#6b7280;">No items yet$0</li>\n{{/each}}'
	},
	{
		id: 'with-nested',
		category: 'logic',
		label: '#with nested object',
		description: 'Scope into an object property',
		body: '{{#with customer.billing}}\n  <p>{{name}} \u2014 {{email}}$0</p>\n  <p>{{currency balance "USD"}}</p>\n{{/with}}'
	}
]
