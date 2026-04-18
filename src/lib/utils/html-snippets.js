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
	{ key: 'social', label: 'Social' }
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
	}
]
