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
	{ key: 'starter', label: 'Starter' }
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
	}
]
