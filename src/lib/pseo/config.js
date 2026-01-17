// Central config for Programmatic SEO
// Keep values small and opinionated; expand over time

export const formats = [
	{ id: 'jpg', label: 'JPG' },
	{ id: 'png', label: 'PNG' },
	{ id: 'webp', label: 'WebP' }
];

// Simple HTML generators for pSEO workflows (keeps new use-cases lightweight)
const simpleCardTemplate = ({
	title = 'Title',
	subtitle = 'Subtitle',
	badge = 'Pictify',
	accent = '#ff6b6b',
	background = '#FFFDF8'
} = {}) => `<html>
  <head>
    <style>
      body { margin:0; padding:48px; background:${background}; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
      .card { max-width:980px; margin:0 auto; background:#fff; border:3px solid #111827; border-radius:24px; padding:34px; box-shadow: 16px 16px 0 0 #111827; }
      .badge { display:inline-block; padding:8px 14px; background:${accent}; color:#fff; border:2px solid #111827; border-radius:999px; font-weight:800; font-size:12px; letter-spacing:0.12em; text-transform:uppercase; }
      h1 { margin:18px 0 10px; font-size:44px; line-height:1.05; color:#111827; }
      p { margin:0; font-size:18px; line-height:1.55; color:#374151; font-weight:600; }
      .row { display:flex; gap:14px; margin-top:22px; flex-wrap:wrap; }
      .pill { display:inline-block; padding:10px 14px; border:2px solid #111827; border-radius:999px; font-weight:800; font-size:13px; background:#fff; }
      .pill strong { color:${accent}; }
      .footer { margin-top:26px; padding-top:18px; border-top:2px dashed rgba(17,24,39,0.35); font-size:13px; color:#6b7280; font-weight:700; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight:800; }
    </style>
  </head>
  <body>
    <div class="card">
      <span class="badge">${badge}</span>
      <h1>${title}</h1>
      <p>${subtitle}</p>
      <div class="row">
        <span class="pill"><strong>Template</strong> → variables</span>
        <span class="pill"><strong>API</strong> → variants</span>
        <span class="pill"><strong>CDN</strong> → deliver</span>
      </div>
      <div class="footer">Tip: bind variables like <code>{{title}}</code>, <code>{{price}}</code>, <code>{{date}}</code> and batch render via API.</div>
    </div>
  </body>
</html>`;

const simpleMonoCardTemplate = ({
	title = 'API Output',
	body = '{ "ok": true }',
	accent = '#111827',
	background = '#FFFDF8'
} = {}) => `<html>
  <head>
    <style>
      body { margin:0; padding:48px; background:${background}; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
      .card { max-width:980px; margin:0 auto; background:#fff; border:3px solid #111827; border-radius:22px; overflow:hidden; box-shadow: 16px 16px 0 0 #111827; }
      .top { background:${accent}; color:#fff; padding:18px 24px; font-weight:900; letter-spacing:0.14em; text-transform:uppercase; font-size:12px; display:flex; justify-content:space-between; }
      pre { margin:0; padding:22px 24px; font-size:14px; line-height:1.6; background:#0b1220; color:#e5e7eb; overflow:auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="top"><span>${title}</span><span>200</span></div>
      <pre>${body}</pre>
    </div>
  </body>
</html>`;

export const popularSizes = [
	'1200x630', // OG default
	'1200x675', // X (Twitter) large image
	'1200x628', // Ads common
	'1080x1080', // Square
	'1080x1350', // IG portrait
	'1080x1920', // Stories/Reels
	'1600x900', // 16:9
	'1280x720', // 16:9 HD
	'1920x1080', // 16:9 FHD
	'800x1200', // Docs / receipts / invoices
	'1024x512' // Legacy
];

export const ogPlatforms = [
	{ id: 'wordpress', label: 'WordPress' },
	{ id: 'notion', label: 'Notion' },
	{ id: 'shopify', label: 'Shopify' },
	{ id: 'ghost', label: 'Ghost' },
	{ id: 'github', label: 'GitHub' },
	{ id: 'linkedin', label: 'LinkedIn' },
	{ id: 'twitter', label: 'X (Twitter)' }
];

// Per-platform guides used to contextualize OG pages
export const platformGuides = {
	wordpress: [
		'Install a SEO plugin (Yoast/RankMath) or edit theme head',
		'Upload the OG image and copy its absolute URL',
		'Set og:image, og:title, og:description in plugin/theme',
		'Purge caches; verify in Facebook Sharing Debugger'
	],
	notion: [
		'Publish page (or proxy via custom domain)',
		'Host OG image on a CDN and copy URL',
		'Add OG meta in the proxy/front (e.g., Vercel middleware)',
		'Test with Facebook/X debuggers'
	],
	shopify: [
		'Admin → Online Store → Preferences → Social sharing image',
		'For per‑product/blog, set featured image/template override',
		'Ensure theme.liquid renders og:image and twitter:card',
		'Save and validate in debuggers'
	],
	ghost: [
		'In Post/Page settings, set Social preview image',
		'Ensure theme includes og:* tags',
		'Update and verify in debuggers'
	],
	github: [
		'For GitHub Pages, add OG meta to index.html',
		'Commit OG image or use external CDN URL',
		'Push and validate in debuggers'
	],
	linkedin: [
		'LinkedIn pulls og:image from your page',
		'Use absolute HTTPS URL, 1200×630 recommended',
		'Use Post Inspector to refresh cache'
	],
	twitter: [
		'Add twitter:card=summary_large_image and twitter:image',
		'Use 1200×630 (≤5MB). PNG/JPG/WebP supported',
		'Validate in Card Validator'
	]
};

// Per-platform recommended sizes (fallback to popularSizes)
export const platformRecommendedSizes = {
	wordpress: ['1200x630'],
	notion: ['1200x630'],
	shopify: ['1200x630'],
	ghost: ['1200x630'],
	github: ['1200x630'],
	linkedin: ['1200x630'],
	twitter: ['1200x675']
};

export const useCases = [
	{ id: 'html-email', label: 'HTML Email to Image' },
	{ id: 'table', label: 'HTML Table to Image' },
	{ id: 'markdown', label: 'Markdown to Image' },
	{ id: 'certificate', label: 'Certificate from HTML' },
	{ id: 'code', label: 'Code to Image' },
	{ id: 'receipt', label: 'Receipt Generator' },
	{ id: 'badge', label: 'Badge Generator' },
	{ id: 'quote-card', label: 'Quote Card Generator' },
	{ id: 'tweet-card', label: 'Tweet Card Generator' },
	{ id: 'product-banner', label: 'Product Promo Banner' },
	{ id: 'pricing-card', label: 'Pricing Card Generator' },
	{ id: 'changelog-card', label: 'Changelog Card Generator' },
	{ id: 'release-notes-card', label: 'Release Notes Card' },
	{ id: 'api-response-card', label: 'API Response Card' },
	{ id: 'json-to-image', label: 'JSON to Image' },
	{ id: 'status-update', label: 'Status Update Card' },
	{ id: 'leaderboard', label: 'Leaderboard Card' },
	{ id: 'kpi-card', label: 'KPI Snapshot Card' },
	{ id: 'testimonial', label: 'Testimonial Card' },
	{ id: 'webinar-promo', label: 'Webinar Promo Banner' },
	{ id: 'event-ticket', label: 'Event Ticket Generator' },
	{ id: 'job-post', label: 'Job Post Card' },
	{ id: 'feature-flag-banner', label: 'Feature Flag Banner' },
	{ id: 'report-cover', label: 'Report Cover' },
	{ id: 'roadmap-card', label: 'Roadmap Card' }
];

export const useCaseDetails = {
	'html-email': {
		label: 'HTML Email to Image',
		description: 'Capture pixel-perfect email previews and share or archive them as static images.',
		seoKeywords: [
			'HTML email to image',
			'email screenshot generator',
			'convert email to image',
			'email preview image',
			'email template screenshot',
			'email campaign preview',
			'email design preview tool',
			'email HTML renderer',
			'email to PNG converter',
			'email marketing preview'
		],
		longDescription: `Converting HTML emails to images is essential for email marketing teams who need to share 
			campaign previews with stakeholders, archive email designs, or showcase their work on social media. 
			Traditional screenshot methods produce inconsistent results across different devices, browsers, and 
			operating systems. Web fonts may not render correctly, and responsive layouts often break. With Pictify's 
			HTML email to image converter, you render your email HTML exactly as it will appear in the inbox, 
			producing a high-fidelity PNG or JPG image. This is invaluable for client approvals, design portfolios, 
			A/B testing documentation, and compliance archives. The API integration allows you to automate email 
			preview generation as part of your campaign workflow, generating images programmatically whenever 
			a new email is ready for review.`,
		useCaseScenarios: [
			'Marketing teams sharing campaign previews with clients before launch',
			'Agencies building email design portfolios for prospective clients',
			'Compliance teams archiving marketing communications for audits',
			'QA engineers documenting email rendering across different scenarios',
			'Product teams creating email template galleries for internal documentation',
			'Designers showcasing email work on Dribbble, Behance, or LinkedIn'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1200x630', '1080x1920'],
		templateHtml: `<html>
  <head>
    <style>
      body { font-family: 'Inter', sans-serif; margin:0; padding:48px; background:#f5f1ff; }
      .wrapper { max-width:640px; margin:0 auto; border:2px solid #2f2b55; border-radius:20px; overflow:hidden; background:#fff; }
      .header { background:#2f2b55; color:#fff; padding:32px; }
      .content { padding:32px; color:#413b79; }
      .cta { display:inline-block; margin-top:24px; padding:14px 28px; background:#ff6b6b; color:#fff; border-radius:999px; font-weight:600; text-decoration:none; }
      .footer { background:#f7f5ff; padding:20px 32px; font-size:13px; color:#6b6690; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <h1 style="margin:0; font-size:32px;">Campaign Preview</h1>
        <p style="margin-top:8px; font-size:16px; opacity:0.8;">See how your email looks in the inbox.</p>
      </div>
      <div class="content">
        <p>Hi {{firstName}},</p>
        <p>We're excited to share the latest features with you. Convert your HTML emails to images instantly and review them with clients or teammates.</p>
        <a class="cta" href="#">Explore features</a>
      </div>
      <div class="footer">
        © 2024 Pictify · 123 Market Street · San Francisco, CA
      </div>
    </div>
  </body>
</html>`,
		benefits: [
			'Generate responsive email previews for stakeholders',
			'Archive campaign creatives for compliance or QA',
			'Share email designs on social media or documentation quickly'
		],
		steps: [
			'Paste your email HTML into the editor',
			'Select PNG for crisp text rendering',
			'Choose 1200×630 or 1080×1920 depending on the channel',
			'Generate and copy the CDN-hosted image URL'
		],
		overview: [
			'Email marketing teams often need to capture a real rendering of their campaigns to share with stakeholders or clients. Screenshot tools are inconsistent, especially when dynamic content or web fonts are in play. By rendering email HTML with Pictify, you get a high-quality image that mirrors the final inbox experience.',
			'Whether you are gathering approvals, showcasing design work, or creating a visual archive of campaigns, HTML-to-image conversion guarantees consistent branding and pixel-perfect results across every channel.'
		],
		painPoints: [
			'Inconsistent screenshots across devices and operating systems',
			'Time-consuming manual QA when sharing designs with clients',
			'Difficult to archive or reuse campaign visuals for retrospectives'
		],
		workflow: [
			{ title: 'Prepare the HTML', detail: 'Grab the final HTML from your ESP (Mailchimp, Braze, HubSpot, etc.) and inline styles if needed.' },
			{ title: 'Choose rendering size', detail: 'Use 1200×630 for portfolio decks or 1080×1920 for mobile-focused previews.' },
			{ title: 'Generate & distribute', detail: 'Export PNG or JPG, drop it in Slack, Notion, or your approval workflow instantly.' }
		],
		faqs: [
			{ q: 'Can I show both desktop and mobile previews?', a: 'Yes. Render once at 1200×630 for desktop, then switch to 1080×1920 for mobile. Each conversion produces a CDN-hosted image you can share immediately.' },
			{ q: 'Will custom fonts and background images render?', a: 'As long as the HTML references publicly accessible assets, Pictify reproduces them. For best results, host fonts and images on a CDN.' },
			{ q: 'Can I automate email previews with the API?', a: 'Absolutely. Use the Pictify API to generate email preview images programmatically whenever a campaign is ready for review. Integrate with your email platform webhooks for fully automated workflows.' },
			{ q: 'What email service providers are supported?', a: 'Any ESP that exports HTML works — Mailchimp, Klaviyo, Braze, HubSpot, SendGrid, Campaign Monitor, and more. Simply export the email HTML and paste it into Pictify.' }
		],
		related: ['table', 'markdown']
	},
	'table': {
		label: 'HTML Table to Image',
		description: 'Turn dashboards and reports into shareable images without screenshot tools.',
		seoKeywords: [
			'HTML table to image',
			'table screenshot generator',
			'convert table to image',
			'dashboard to image',
			'data table image generator',
			'report screenshot tool',
			'table to PNG converter',
			'spreadsheet to image',
			'KPI dashboard image',
			'data visualization image'
		],
		longDescription: `Business intelligence and analytics teams constantly need to share data tables and 
			dashboards outside their analytics tools. Traditional methods like screenshots produce blurry images, 
			especially with small fonts. Exporting to PDF often strips custom styling and breaks layouts. 
			Pictify's HTML table to image converter renders your styled tables exactly as designed, producing 
			crisp, professional images perfect for slide decks, Notion wikis, Slack updates, and executive reports. 
			Tables with alternating row colors, custom fonts, and complex layouts all render perfectly. Use our 
			API to automate weekly report generation, creating fresh dashboard snapshots every Monday for 
			stakeholder distribution.`,
		useCaseScenarios: [
			'Data teams generating weekly KPI snapshots for executive updates',
			'BI analysts embedding dashboard views in Confluence or Notion',
			'Sales ops sharing pipeline reports without granting CRM access',
			'Finance teams creating audit-ready financial statement images',
			'Product managers distributing usage metrics in slide decks',
			'Marketing teams visualizing campaign performance for stakeholders'
		],
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1920x1080'],
		templateHtml: `<html>
  <head>
    <style>
      body { margin:0; padding:48px; background:#f1f7ff; font-family:'Inter',sans-serif; }
      .card { max-width:900px; margin:0 auto; background:#fff; border-radius:24px; border:2px solid #0f3c6e; padding:32px; box-shadow:0 20px 50px rgba(15,60,110,0.12); }
      h1 { margin:0 0 24px; color:#0f3c6e; font-size:30px; }
      table { width:100%; border-collapse:collapse; font-size:16px; }
      thead { background:#0f3c6e; color:#fff; }
      th, td { padding:16px 18px; text-align:left; }
      tbody tr:nth-child(even) { background:#f5f9ff; }
      .badge { display:inline-block; padding:6px 14px; background:#0f3c6e; color:#fff; border-radius:999px; font-size:13px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h1>Monthly Pipeline Snapshot</h1>
        <span class="badge">Q2 · Week 4</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Segment</th>
            <th>Open Deals</th>
            <th>Avg Deal Size</th>
            <th>Forecast</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Enterprise</td>
            <td>42</td>
            <td>$18,200</td>
            <td>$765,400</td>
          </tr>
          <tr>
            <td>Mid‑market</td>
            <td>58</td>
            <td>$9,850</td>
            <td>$571,300</td>
          </tr>
          <tr>
            <td>Velocity</td>
            <td>133</td>
            <td>$3,110</td>
            <td>$413,630</td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>`,
		benefits: [
			'Embed data visuals in decks and docs instantly',
			'Preserve table styling without spreadsheet exports',
			'Share KPI snapshots with stakeholders securely'
		],
		steps: [
			'Paste the table HTML (include inline styles for layout)',
			'Select a landscape size such as 1920×1080 for dashboards',
			'Preview and tweak typography or background color',
			'Download or copy the hosted image link'
		],
		overview: [
			'Charts, tables, and dashboards often need to be distributed outside analytics tools. Exporting to PDF or PowerPoint can strip styling, while screenshots blur text. Converting HTML tables directly ensures your data remains legible and branded.',
			'Product and ops teams use this workflow to send executive summaries, embed KPIs in slide decks, or publish weekly metrics in internal wikis.'
		],
		painPoints: [
			'Blurry screenshots that undermine data credibility',
			'Copy/paste into spreadsheets interrupts styling and formatting',
			'Sharing dashboards with external stakeholders without granting tool access'
		],
		workflow: [
			{ title: 'Capture the HTML', detail: 'Use your data layer to output HTML tables with inline CSS for fonts, colors, and spacing.' },
			{ title: 'Select high-resolution output', detail: 'For enterprise dashboards, 1920×1080 or 1600×900 provides a crisp slide-ready asset.' },
			{ title: 'Generate and embed', detail: 'Drop the image in decks, Confluence, or Slack. CDN hosting gives you a shareable link as well.' }
		],
		faqs: [
			{ q: 'Can I render tables wider than 1920px?', a: 'Yes. Increase the custom canvas size before generating the image. Pictify supports up to 4000×4000 pixels.' },
			{ q: 'Do sticky headers or alternating row colors work?', a: 'Any CSS that is supported by Chromium will display. Inline the relevant CSS to ensure consistent output.' },
			{ q: 'Can I automate weekly dashboard images?', a: 'Absolutely. Use the Pictify API to render table snapshots on a schedule. Combine with your BI tool exports for fully automated reporting.' },
			{ q: 'What about charts and graphs?', a: 'If your charts render as HTML/SVG, Pictify will capture them. For canvas-based charts, export as SVG first or use our chart element in the editor.' }
		],
		related: ['html-email', 'code']
	},
	'markdown': {
		label: 'Markdown to Image',
		description: 'Render Markdown content as polished images for social posts or documentation.',
		seoKeywords: [
			'Markdown to image',
			'convert Markdown to image',
			'Markdown screenshot generator',
			'README to image',
			'Markdown social image',
			'code snippet to image',
			'release notes image',
			'documentation to image',
			'Markdown PNG converter',
			'developer social images'
		],
		longDescription: `Developers and technical writers regularly need to share Markdown content on platforms 
			that require or prefer images—Twitter, LinkedIn, Instagram, and internal wikis. Traditional screenshots 
			capture browser chrome and create inconsistent visuals. With Pictify's Markdown to image converter, 
			you render your Markdown as beautifully styled HTML and convert it directly to a crisp, shareable image. 
			Perfect for changelogs, README highlights, code tutorials, and release announcements. Use dark mode 
			themes, syntax highlighting, and custom fonts to match your brand.`,
		useCaseScenarios: [
			'Developer advocates sharing code snippets on Twitter/X',
			'Open source maintainers creating README preview images',
			'DevRel teams generating release notes social cards',
			'Technical writers creating documentation thumbnails',
			'Engineering teams sharing changelog updates internally',
			'Indie hackers promoting their projects on social media'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1200x630', '1080x1080'],
		templateHtml: `<html>
  <head>
    <style>
      body { margin:0; padding:48px; background:#0b0b1f; color:#f7f7ff; font-family:'JetBrains Mono', monospace; }
      .note { max-width:800px; margin:0 auto; background:rgba(19,19,44,0.85); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:40px; box-shadow:0 25px 60px rgba(5,5,20,0.35); }
      h1 { font-size:32px; margin:0 0 16px; color:#7ee0ff; }
      pre { background:#14142a; padding:24px; border-radius:18px; font-size:15px; overflow:auto; }
      code { color:#a7f3d0; }
      p { line-height:1.7; font-size:17px; }
    </style>
  </head>
  <body>
    <div class="note">
      <h1>Release Notes</h1>
      <p>Markdown content renders beautifully when converted to an image. Use headings, code blocks, and callouts to capture attention.</p>
      <pre><code># npm install pictify
import { createImage } from 'pictify';

await createImage({
  html,
  width: 1200,
  height: 630
});</code></pre>
    </div>
  </body>
</html>`,
		benefits: [
			'Publish snippets from README files to social media',
			'Create visual changelog updates in minutes',
			'Keep typography consistent across marketing channels'
		],
		steps: [
			'Convert Markdown to HTML (or paste Markdown via your converter)',
			'Select a square or 1200×630 canvas',
			'Customize fonts and background color to match branding',
			'Generate and share the image URL'
		],
		overview: [
			'Markdown is the lingua franca for documentation, but sharing snippets on X, LinkedIn, or internal blogs normally involves clunky screenshots. By rendering Markdown as HTML and converting it to an image, teams keep typography clean and brand-aligned.',
			'Engineering, product, and developer relations teams turn README highlights, release notes, and code snippets into snackable graphics using this workflow.'
		],
		painPoints: [
			'Difficult to share Markdown content on channels that expect visuals',
			'Screenshots pick up UI chrome and reduce readability',
			'Formatting inconsistencies when copying Markdown into slideware'
		],
		workflow: [
			{ title: 'Convert Markdown to HTML', detail: 'Use your static site generator or a Markdown parser to create HTML with the desired theme.' },
			{ title: 'Pick social-friendly dimensions', detail: 'Square (1080×1080) for Instagram, 1200×630 for LinkedIn/Twitter cards.' },
			{ title: 'Customize and export', detail: 'Adjust background, fonts, and callouts before generating the final asset.' }
		],
		faqs: [
			{ q: 'Can I use dark mode themes?', a: 'Absolutely. Include the CSS for your preferred dark theme when generating the HTML, then convert it directly.' },
			{ q: 'Does syntax highlighting survive?', a: 'Yes. Use a highlighting library (Prism, Highlight.js) to output styled HTML before conversion.' }
		],
		related: ['code', 'html-email']
	},
	'certificate': {
		label: 'Certificate from HTML',
		description: 'Generate personalized certificates as downloadable images for events and courses.',
		seoKeywords: [
			'certificate generator',
			'create certificates online',
			'HTML to certificate',
			'automated certificate generation',
			'bulk certificate maker',
			'certificate template generator',
			'online certificate creator',
			'certificate of completion generator',
			'certificate image generator',
			'custom certificate maker'
		],
		longDescription: `Creating professional certificates at scale is a common challenge for educational platforms, 
			HR teams, and event organizers. Traditional design tools require manual effort for each certificate, 
			making it impractical when you need to generate hundreds or thousands of certificates. With Pictify's 
			certificate generator, you design your certificate template once using HTML/CSS, bind dynamic variables 
			like recipient name, course name, and completion date, then generate certificates programmatically via 
			API. This automation saves hours of manual work and ensures consistent branding across all certificates.`,
		useCaseScenarios: [
			'Online courses issuing completion certificates to students',
			'HR departments creating employee recognition certificates',
			'Conference organizers generating attendee certificates',
			'Training platforms automating certification upon assessment completion',
			'Professional associations issuing membership certificates',
			'Webinar hosts providing attendance certificates'
		],
		recommendedFormats: ['jpg', 'png'],
		recommendedSizes: ['1920x1080'],
		templateHtml: `<html>
  <head>
    <style>
      body { margin:0; padding:40px; background:#fefbf0; font-family:'Playfair Display',serif; color:#3b2f21; }
      .certificate { max-width:1400px; margin:0 auto; padding:80px; border:6px double #c8a76b; border-radius:24px; background:#fff; position:relative; }
      .certificate::after { content:''; position:absolute; inset:30px; border:2px dashed rgba(200,167,107,0.4); border-radius:18px; }
      .content { position:relative; z-index:1; text-align:center; }
      h1 { font-size:54px; margin-bottom:12px; }
      h2 { font-family:'Inter',sans-serif; font-size:22px; letter-spacing:4px; margin-bottom:40px; text-transform:uppercase; }
      .name { font-size:42px; margin:32px 0; font-weight:600; }
      .footer { display:flex; justify-content:space-between; margin-top:60px; font-size:18px; font-family:'Inter',sans-serif; }
    </style>
  </head>
  <body>
    <div class="certificate">
      <div class="content">
        <h2>Certificate of Achievement</h2>
        <h1>Pictify Academy</h1>
        <p>This certificate is proudly presented to</p>
        <div class="name">Alex Johnson</div>
        <p>for successfully completing the advanced HTML to Image automation course on <strong>July 24, 2024</strong>.</p>
        <div class="footer">
          <span>__________________<br>Instructor</span>
          <span>__________________<br>Program Lead</span>
        </div>
      </div>
    </div>
  </body>
</html>`,
		benefits: [
			'Automate certificate creation with HTML templates',
			'Send ready-to-print images via email or LMS',
			'Store certificates on CDN for instant retrieval'
		],
		steps: [
			'Design your certificate layout in HTML/CSS',
			'Select 1920×1080 for print-friendly output',
			'Insert dynamic participant data before conversion',
			'Generate and deliver the certificate image'
		],
		overview: [
			'Education platforms, webinar hosts, and community events frequently issue certificates. Generating them as images ensures recipients can download, print, or share them instantly.',
			'Because the certificate layout is HTML, you can personalize names, achievements, and dates at scale before turning them into polished graphics.'
		],
		painPoints: [
			'Creating certificates manually in design tools does not scale',
			'PDF exports are heavy and unfriendly for mobile recipients',
			'Ensuring consistent branding across hundreds or thousands of certificates'
		],
		workflow: [
			{ title: 'Build the template', detail: 'Design your certificate using HTML/CSS with placeholders for names and achievements.' },
			{ title: 'Merge participant data', detail: 'Replace placeholders with dynamic data from your CRM or LMS before conversion.' },
			{ title: 'Generate and distribute', detail: 'Export images and send them via email or allow download from your portal.' }
		],
		faqs: [
			{ q: 'Can I print the generated certificate?', a: 'Yes. Use 1920×1080 or larger to produce high-quality prints. You can also create a PDF if needed.' },
			{ q: 'How do I handle signatures or seals?', a: 'Embed them as transparent PNGs in your HTML. They will render in the final image.' }
		],
		related: ['html-email']
	},
	'code': {
		label: 'Code to Image',
		description: 'Share beautiful code snippets with syntax highlighting in seconds.',
		seoKeywords: [
			'code to image',
			'code screenshot generator',
			'code snippet image',
			'syntax highlighting image',
			'carbon alternative',
			'code to PNG',
			'beautiful code screenshots',
			'code image generator',
			'share code on Twitter',
			'developer code snippets'
		],
		longDescription: `Sharing code on social media, documentation, and presentations requires beautiful, readable 
			images with proper syntax highlighting. Screenshots of editors look unprofessional with interface elements. 
			Pictify's code to image converter renders your code with beautiful themes, proper syntax highlighting, 
			and custom styling—perfect for Twitter threads, blog posts, slide decks, and tutorials. Choose from multiple 
			color schemes, customize window frames, and generate consistent code images via API for your documentation 
			workflow.`,
		useCaseScenarios: [
			'Developers sharing code tips on Twitter/X and LinkedIn',
			'Technical bloggers creating code illustrations for articles',
			'Educators preparing slides with code examples',
			'Open source maintainers showcasing code in READMEs',
			'DevRel teams creating tutorial graphics',
			'Documentation authors embedding code visuals'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1200x630', '1080x1080'],
		templateHtml: `<html>
  <head>
    <style>
      body { margin:0; padding:40px; background:linear-gradient(135deg,#221b44,#0f172a); font-family:'Fira Code',monospace; color:#e2e8f0; }
      .snippet { max-width:960px; margin:0 auto; background:#0f172a; border-radius:20px; border:1px solid rgba(148,163,184,0.25); box-shadow:0 25px 70px rgba(15,23,42,0.4); padding:32px; }
      .meta { display:flex; justify-content:space-between; align-items:center; font-size:14px; color:#94a3b8; margin-bottom:20px; }
      pre { margin:0; font-size:16px; line-height:1.6; }
      .keyword { color:#7dd3fc; }
      .string { color:#bef264; }
      .comment { color:#64748b; }
    </style>
  </head>
  <body>
    <div class="snippet">
      <div class="meta">
        <span>snippet.ts</span>
        <span>pictify v2.0</span>
      </div>
      <pre><code><span class="comment">// Generate an image from HTML</span>
<span class="keyword">import</span> { createImage } <span class="keyword">from</span> '<span class="string">@pictify/html</span>'

<span class="keyword">await</span> createImage({
  html,
  width: 1200,
  height: 630,
  fileExtension: '<span class="string">png</span>'
})</code></pre>
    </div>
  </body>
</html>`,
		benefits: [
			'Showcase code on social media with consistent styling',
			'Create documentation images for blog posts and slide decks',
			'Highlight diff snippets without screenshot tools'
		],
		steps: [
			'Paste your code and apply syntax highlighting classes',
			'Choose a size based on the platform you are sharing to',
			'Select a code-friendly font and dark/light theme',
			'Generate and download the image'
		],
		overview: [
			'Developer advocates and engineers often share code snippets externally, but standard screenshots are hard to read. With Pictify, you can highlight syntax, add branding, and export a clean snippet ready for any channel.',
			'Use the workflow to create blog hero images, documentation callouts, or social-media friendly snippets showing new features.'
		],
		painPoints: [
			'IDE screenshots include extra UI chrome and clutter',
			'Difficult to maintain consistent fonts and spacing across assets',
			'Sharing sensitive paths or environment variables by accident'
		],
		workflow: [
			{ title: 'Paste formatted HTML', detail: 'Use Prism/Highlight.js or MDX to output styled HTML for the snippet.' },
			{ title: 'Pick theme & size', detail: 'Choose dark or light theme and select 1200×630 for OG cards or square for carousels.' },
			{ title: 'Generate & publish', detail: 'Export and upload to your blog, docs, or social channels with consistent branding.' }
		],
		faqs: [
			{ q: 'Can I include multiple files or tabs?', a: 'Yes. Structure your HTML with headers or tabs before converting, and Pictify will render them exactly.' },
			{ q: 'Is there a character limit for code?', a: 'No strict limit, but ensure the canvas width/height is large enough for readability. You can always increase dimensions before generation.' }
		],
		related: ['markdown', 'html-email']
	},
	'receipt': {
		label: 'Receipt Generator',
		description: 'Generate branded receipts as images for emails, downloads, and customer portals.',
		seoKeywords: [
			'receipt generator',
			'create receipts online',
			'receipt image generator',
			'digital receipt maker',
			'branded receipt template',
			'automated receipt generation',
			'e-receipt generator',
			'order receipt image',
			'invoice image generator',
			'payment receipt maker'
		],
		longDescription: `E-commerce platforms, subscription services, and marketplaces need to send professional 
			receipts to customers. PDF receipts can be heavy and inconsistent across email clients. Image receipts 
			are lightweight, display perfectly in any email, and can be easily saved or shared. With Pictify's 
			receipt generator, you design your receipt template with your brand styling, bind order data like 
			items, prices, and totals, then generate receipt images via API whenever an order completes.`,
		useCaseScenarios: [
			'E-commerce stores sending order confirmation emails',
			'Subscription services providing payment receipts',
			'Payment processors generating transaction records',
			'Marketplaces issuing receipts to buyers and sellers',
			'Event ticketing platforms confirming purchases',
			'SaaS companies providing invoice images for customers'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['800x1200', '1080x1350'],
		templateHtml: simpleCardTemplate({
			title: 'Receipt #{{orderId}}',
			subtitle: '{{storeName}} · total {{total}} · {{date}}',
			badge: 'RECEIPT',
			accent: '#111827',
			background: '#f8fafc'
		}),
		overview: [
			'Receipts are transactional media: one template, thousands of variable sets.',
			'Render branded receipts from order data via API and reuse across email, portal, and support flows.'
		],
		painPoints: ['Manual screenshots or PDFs', 'Inconsistent formatting across devices', 'Hard to reissue at scale'],
		workflow: [
			{ title: 'Design once', detail: 'Create a receipt layout and bind variables like orderId, line items, and total.' },
			{ title: 'Render per order', detail: 'Call the API with order variables to generate a receipt URL instantly.' },
			{ title: 'Batch reissue', detail: 'Re-render receipts for many orders in one batch job when needed.' }
		],
		faqs: [
			{ q: 'Can I include multiple line items?', a: 'Yes. Use multiple rows or build a repeatable block in the template workspace.' },
			{ q: 'Can I embed the receipt in email?', a: 'Yes. Use the generated CDN URL in your transactional emails.' }
		],
		related: ['html-email', 'table']
	},
	'badge': {
		label: 'Badge Generator',
		description: 'Generate achievement badges, labels, and milestones as shareable images.',
		seoKeywords: [
			'badge generator',
			'achievement badge maker',
			'digital badge creator',
			'gamification badges',
			'milestone badge image',
			'skill badge generator',
			'credly alternative',
			'badge image creator',
			'certification badge maker',
			'custom badge generator'
		],
		longDescription: `Gamification and recognition programs use badges to celebrate achievements, skills, and 
			milestones. Users love sharing their badges on LinkedIn and social media. With Pictify's badge 
			generator, you design beautiful badge templates with your brand styling, bind achievement data like 
			badge name, user name, and date earned, then generate shareable badge images via API. Perfect for 
			learning platforms, fitness apps, developer communities, and any product with achievement systems.`,
		useCaseScenarios: [
			'Learning platforms issuing skill completion badges',
			'Developer communities awarding contribution badges',
			'Fitness apps celebrating milestone achievements',
			'Employee recognition programs creating award badges',
			'Gaming platforms generating achievement unlocks',
			'Professional certification bodies issuing digital credentials'
		],
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1080x1080', '1200x630'],
		templateHtml: simpleCardTemplate({
			title: 'Achievement: {{badgeName}}',
			subtitle: 'Awarded to {{userName}} · {{date}}',
			badge: 'BADGE',
			accent: '#4ade80',
			background: '#f0fdf4'
		}),
		overview: [
			'Badges are a lightweight, personalized growth loop artifact.',
			'Generate badges for users, cohorts, and campaigns using one reusable template.'
		],
		painPoints: ['Manual badge design', 'Inconsistent sizes across channels', 'No scalable way to generate cohorts'],
		workflow: [
			{ title: 'Pick a badge layout', detail: 'Design a badge style once with your brand fonts and colors.' },
			{ title: 'Bind variables', detail: 'Use variables for badgeName, userName, tier, and date.' },
			{ title: 'Render at scale', detail: 'Batch render for cohorts and embed URLs across product surfaces.' }
		],
		faqs: [{ q: 'Do transparent backgrounds work?', a: 'Yes. Use PNG/WebP and keep the background transparent.' }],
		related: ['certificate', 'quote-card']
	},
	'quote-card': {
		label: 'Quote Card Generator',
		description: 'Turn quotes into branded social cards from a reusable template.',
		recommendedFormats: ['png', 'jpg', 'webp'],
		recommendedSizes: ['1080x1080', '1080x1350', '1200x630'],
		templateHtml: simpleCardTemplate({
			title: '“{{quote}}”',
			subtitle: '— {{author}} · {{company}}',
			badge: 'QUOTE',
			accent: '#ff6b6b',
			background: '#fff7ed'
		}),
		overview: [
			'Quote cards are repeatable content with a consistent format.',
			'Render quote variations from your CMS or spreadsheet via API and keep branding consistent.'
		],
		painPoints: ['Design bottlenecks for social posts', 'Manual resizing for each platform', 'Inconsistent typography'],
		workflow: [
			{ title: 'Create quote template', detail: 'Design quote + author + company layout once.' },
			{ title: 'Render per quote', detail: 'Send quote variables and generate an image instantly.' },
			{ title: 'Batch for campaigns', detail: 'Generate dozens of quote assets in a single batch job.' }
		],
		faqs: [{ q: 'What about long quotes?', a: 'Increase height or adjust font size/line height in the template.' }],
		related: ['tweet-card', 'testimonial']
	},
	'tweet-card': {
		label: 'Tweet Card Generator',
		description: 'Generate tweet-style cards for announcements, stats, and viral content.',
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x675', '1080x1350'],
		templateHtml: simpleCardTemplate({
			title: '{{tweetText}}',
			subtitle: '— @{{handle}} · {{date}}',
			badge: 'TWEET',
			accent: '#0ea5e9',
			background: '#f0f9ff'
		}),
		overview: [
			'Tweet cards are a fast way to ship social assets without screenshots.',
			'Render tweet cards programmatically from your content pipeline and publish consistently.'
		],
		painPoints: ['Manual screenshots', 'Inconsistent formatting', 'Slow content production'],
		workflow: [
			{ title: 'Design the template', detail: 'Create tweet layout once with variables for text, handle, and date.' },
			{ title: 'Render for channels', detail: 'Generate platform-specific sizes (X, LinkedIn, IG).' },
			{ title: 'Batch schedule', detail: 'Batch render cards for a week of content.' }
		],
		faqs: [{ q: 'Can I include an avatar?', a: 'Yes. Add an image layer bound to an avatar URL variable.' }],
		related: ['quote-card', 'status-update']
	},
	'product-banner': {
		label: 'Product Promo Banner',
		description: 'Generate product promo banners for ads, landing pages, and email campaigns.',
		recommendedFormats: ['png', 'jpg', 'webp'],
		recommendedSizes: ['1200x628', '1200x630', '1600x900'],
		templateHtml: simpleCardTemplate({
			title: '{{productName}}',
			subtitle: '{{tagline}} · from {{price}}',
			badge: 'PROMO',
			accent: '#a855f7',
			background: '#faf5ff'
		}),
		overview: [
			'Promo banners often need many variants: pricing tiers, audiences, and copy tests.',
			'Use one template and render variants via API to scale marketing ops.'
		],
		painPoints: ['Design time per variant', 'Slow A/B iteration', 'Brand drift across teams'],
		workflow: [
			{ title: 'Design banner template', detail: 'Create a layout with variables for name, tagline, and price.' },
			{ title: 'Render variants', detail: 'Generate variants for each segment or campaign.' },
			{ title: 'Ship everywhere', detail: 'Use CDN URLs across ads, landing pages, and emails.' }
		],
		faqs: [{ q: 'Can I render multiple sizes per campaign?', a: 'Yes. Render the same template at different sizes for each platform.' }],
		related: ['pricing-card', 'webinar-promo']
	},
	'pricing-card': {
		label: 'Pricing Card Generator',
		description: 'Generate pricing cards for landing pages, email, and sales decks.',
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1080x1080'],
		templateHtml: simpleCardTemplate({
			title: '{{planName}} · {{price}}/mo',
			subtitle: 'Best for {{segment}} · {{feature1}} · {{feature2}}',
			badge: 'PRICING',
			accent: '#f59e0b',
			background: '#fffbeb'
		}),
		overview: [
			'Pricing assets must stay consistent across channels as plans evolve.',
			'Render plan cards from structured data (plans/currencies) to keep everything in sync.'
		],
		painPoints: ['Outdated pricing screenshots', 'Manual work for multiple currencies', 'Inconsistent design across teams'],
		workflow: [
			{ title: 'Design once', detail: 'Create a plan card layout with variables for name/price/features.' },
			{ title: 'Render per plan', detail: 'Generate cards for each tier and currency.' },
			{ title: 'Batch updates', detail: 'Re-render when pricing or brand changes.' }
		],
		faqs: [{ q: 'Can I mark “Most popular”?', a: 'Yes. Use conditional logic in the template workspace.' }],
		related: ['product-banner', 'report-cover']
	},
	'changelog-card': {
		label: 'Changelog Card Generator',
		description: 'Generate changelog cards for release announcements and social posts.',
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1080x1080'],
		templateHtml: simpleCardTemplate({
			title: 'Changelog: {{version}}',
			subtitle: '{{headline}} · {{date}}',
			badge: 'CHANGELOG',
			accent: '#22c55e',
			background: '#f0fdf4'
		}),
		overview: [
			'Changelog announcements are a repeatable workflow that benefits from automation.',
			'Generate release cards from Git tags, CI pipelines, or docs in a consistent format.'
		],
		painPoints: ['Manual social assets per release', 'Slow announcements', 'Inconsistent formatting'],
		workflow: [
			{ title: 'Create changelog template', detail: 'Design a layout for version, headline, and date.' },
			{ title: 'Render from CI', detail: 'Trigger generation automatically on release.' },
			{ title: 'Distribute', detail: 'Use CDN URLs across social, docs, and email.' }
		],
		faqs: [{ q: 'Can I include multiple bullets?', a: 'Yes. Add a list section in the template and increase height.' }],
		related: ['release-notes-card', 'status-update']
	},
	'release-notes-card': {
		label: 'Release Notes Card',
		description: 'Turn release notes into branded cards for product updates.',
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1600x900'],
		templateHtml: simpleCardTemplate({
			title: 'What’s new: {{title}}',
			subtitle: '{{summary}}',
			badge: 'RELEASE',
			accent: '#6366f1',
			background: '#eef2ff'
		}),
		overview: [
			'Release notes live across blog, docs, email, and social — consistency matters.',
			'Render a card per update from your source of truth and publish everywhere.'
		],
		painPoints: ['Copy/paste across channels', 'Design drift', 'Slow content production'],
		workflow: [
			{ title: 'Design template', detail: 'Create title/summary layout once with brand styling.' },
			{ title: 'Render from docs', detail: 'Generate from markdown or release metadata via API.' },
			{ title: 'Publish', detail: 'Use the image URL across all channels.' }
		],
		faqs: [{ q: 'Can I include screenshots?', a: 'Yes. Add an image layer bound to a screenshot URL variable.' }],
		related: ['changelog-card', 'markdown']
	},
	'api-response-card': {
		label: 'API Response Card',
		description: 'Render API responses as images for docs, support, and marketing.',
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1600x900'],
		templateHtml: simpleMonoCardTemplate({
			title: 'API_RESPONSE',
			body: `{
  "id": "{{id}}",
  "status": "{{status}}",
  "url": "{{url}}"
}`
		}),
		overview: [
			'API response screenshots are a common docs and support tax.',
			'Render consistent response cards from real payloads so examples stay current and readable.'
		],
		painPoints: ['Manual screenshots', 'Stale examples in docs', 'Inconsistent formatting'],
		workflow: [
			{ title: 'Create response layout', detail: 'Use a monospaced response card template.' },
			{ title: 'Bind fields', detail: 'Bind variables for the fields you want to showcase.' },
			{ title: 'Generate on build', detail: 'Render cards during docs builds or CI runs.' }
		],
		faqs: [{ q: 'Can I render full JSON?', a: 'Yes, but increase canvas size or focus on key fields for readability.' }],
		related: ['json-to-image', 'code']
	},
	'json-to-image': {
		label: 'JSON to Image',
		description: 'Convert JSON payloads into crisp, readable images (no more blurry screenshots).',
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1600x900', '1920x1080'],
		templateHtml: simpleMonoCardTemplate({
			title: 'JSON',
			body: `{
  "user": {
    "id": "{{id}}",
    "name": "{{name}}",
    "plan": "{{plan}}"
  },
  "timestamp": "{{timestamp}}"
}`
		}),
		overview: [
			'JSON appears everywhere: docs, support, sales engineering, and incident writeups.',
			'Turn JSON into consistent branded images that can be shared in tickets, docs, and presentations.'
		],
		painPoints: ['Screenshots blur text', 'Payloads get stale', 'Hard to standardize formatting'],
		workflow: [
			{ title: 'Define the JSON shape', detail: 'Pick the fields you want to display and bind variables.' },
			{ title: 'Render on demand', detail: 'Generate images whenever payloads change.' },
			{ title: 'Batch examples', detail: 'Render multiple example payloads for docs or onboarding.' }
		],
		faqs: [{ q: 'Can I highlight keys?', a: 'Yes. Use CSS in the template to style keys/values.' }],
		related: ['api-response-card', 'code']
	},
	'status-update': {
		label: 'Status Update Card',
		description: 'Generate branded status updates for incidents, outages, and maintenance windows.',
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1080x1080'],
		templateHtml: simpleCardTemplate({
			title: 'Status: {{status}}',
			subtitle: '{{message}} · {{time}}',
			badge: 'STATUS',
			accent: '#ef4444',
			background: '#fff1f2'
		}),
		overview: [
			'When something breaks, teams need fast and consistent communication.',
			'Generate status cards from incident systems and distribute instantly across channels.'
		],
		painPoints: ['No time for design during incidents', 'Inconsistent messaging', 'Slow updates across channels'],
		workflow: [
			{ title: 'Design template', detail: 'Create a layout for status, message, and timestamp.' },
			{ title: 'Render from incident data', detail: 'Send incident fields to generate an image URL.' },
			{ title: 'Distribute', detail: 'Use the URL in social, email, and internal channels.' }
		],
		faqs: [{ q: 'Can I color-code status (green/yellow/red)?', a: 'Yes. Use conditional logic in the template workspace.' }],
		related: ['changelog-card', 'tweet-card']
	},
	'leaderboard': {
		label: 'Leaderboard Card',
		description: 'Generate leaderboard snapshots for communities, contests, and gamification.',
		seoKeywords: [
			'leaderboard generator',
			'leaderboard image maker',
			'ranking card generator',
			'gamification leaderboard',
			'competition leaderboard image',
			'contest ranking image',
			'top players image',
			'leaderboard snapshot',
			'community ranking card',
			'gaming leaderboard maker'
		],
		longDescription: `Gaming platforms, developer communities, and gamified products need to share leaderboards 
			on social media and in-app notifications. Static leaderboard images are more engaging than text lists 
			and can be easily shared across platforms. With Pictify's leaderboard card generator, you design your 
			ranking template, bind dynamic data like player names, scores, and positions, then generate fresh 
			leaderboard images via API whenever rankings update.`,
		useCaseScenarios: [
			'Gaming platforms sharing daily/weekly top players',
			'Developer communities ranking top contributors',
			'Fitness apps displaying workout leaderboards',
			'Sales teams celebrating top performers',
			'Contest platforms announcing competition standings',
			'Community platforms highlighting active members'
		],
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1600x900'],
		templateHtml: simpleCardTemplate({
			title: 'Leaderboard · {{period}}',
			subtitle: 'Top: {{name1}} · {{name2}} · {{name3}}',
			badge: 'LEADERBOARD',
			accent: '#f59e0b',
			background: '#fffbeb'
		}),
		overview: [
			'Leaderboards drive engagement when they are frequent and easy to share.',
			'Render leaderboard cards from your metrics pipeline and distribute to communities automatically.'
		],
		painPoints: ['Manual exports', 'Inconsistent weekly formatting', 'Slow to publish updates'],
		workflow: [
			{ title: 'Design layout', detail: 'Create a leaderboard card with variables for names and scores.' },
			{ title: 'Render from data', detail: 'Send top results and generate an image URL.' },
			{ title: 'Publish', detail: 'Post in Slack/Discord or embed in newsletters.' }
		],
		faqs: [{ q: 'Can I show more entries?', a: 'Yes. Increase height and add more rows/variables.' }],
		related: ['kpi-card', 'status-update']
	},
	'kpi-card': {
		label: 'KPI Snapshot Card',
		description: 'Render KPI snapshots for reports, weekly updates, and exec comms.',
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1600x900', '1920x1080'],
		templateHtml: simpleCardTemplate({
			title: '{{metricName}}: {{value}}',
			subtitle: 'Δ {{delta}} · {{period}} · source: {{source}}',
			badge: 'KPI',
			accent: '#22c55e',
			background: '#f0fdf4'
		}),
		overview: [
			'KPI communication is repetitive — and ideal for templates + automation.',
			'Render KPI cards directly from analytics outputs and embed them in docs, decks, and email.'
		],
		painPoints: ['Copy/paste from dashboards', 'Blurry screenshots', 'Formatting inconsistency'],
		workflow: [
			{ title: 'Create KPI template', detail: 'Design a card with variables for metric name/value/delta.' },
			{ title: 'Render from analytics', detail: 'Call the API from your reporting job.' },
			{ title: 'Distribute', detail: 'Embed URLs in Notion, decks, or newsletters.' }
		],
		faqs: [{ q: 'Can I render charts?', a: 'Yes. Render charts in HTML or add a chart image layer.' }],
		related: ['table', 'leaderboard']
	},
	'testimonial': {
		label: 'Testimonial Card',
		description: 'Turn customer reviews into shareable social proof images for marketing.',
		seoKeywords: [
			'testimonial image generator',
			'review card maker',
			'customer testimonial image',
			'social proof image generator',
			'review to image',
			'testimonial card creator',
			'customer review graphics',
			'quote card generator',
			'feedback image maker',
			'review screenshot alternative'
		],
		longDescription: `Customer testimonials are powerful social proof for marketing, but they're hard to share 
			visually. Screenshots of reviews look messy and inconsistent. With Pictify's testimonial card generator, 
			you design beautiful testimonial templates featuring customer photos, quotes, and ratings, then generate 
			branded testimonial images via API. Perfect for sharing on social media, embedding in email campaigns, 
			and displaying on landing pages.`,
		useCaseScenarios: [
			'Marketing teams creating testimonial graphics for social media',
			'Sales teams sharing customer success stories',
			'Product teams highlighting user feedback in presentations',
			'E-commerce stores displaying customer reviews on product pages',
			'SaaS companies featuring case study quotes',
			'Agencies showcasing client testimonials in proposals'
		],
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1080x1080', '1080x1350'],
		templateHtml: simpleCardTemplate({
			title: '“{{testimonial}}”',
			subtitle: '— {{name}}, {{role}} @ {{company}}',
			badge: 'SOCIAL PROOF',
			accent: '#ff6b6b',
			background: '#fff7ed'
		}),
		overview: [
			'Testimonials are high leverage but tedious to turn into polished assets.',
			'Render testimonial variations from CRM/spreadsheets and keep design consistent everywhere.'
		],
		painPoints: ['Manual design work', 'Inconsistent styling', 'Slow iteration on landing pages'],
		workflow: [
			{ title: 'Design template', detail: 'Create a layout with testimonial + attribution variables.' },
			{ title: 'Render per entry', detail: 'Generate a card for each testimonial automatically.' },
			{ title: 'Batch refresh', detail: 'Re-render when brand or typography changes.' }
		],
		faqs: [{ q: 'Can I add a customer logo?', a: 'Yes. Add an image layer bound to a logo URL variable.' }],
		related: ['quote-card', 'product-banner']
	},
	'webinar-promo': {
		label: 'Webinar Promo Banner',
		description: 'Create webinar promo banners for registrations and social campaigns.',
		recommendedFormats: ['png', 'jpg', 'webp'],
		recommendedSizes: ['1200x628', '1080x1350', '1200x630'],
		templateHtml: simpleCardTemplate({
			title: '{{webinarTitle}}',
			subtitle: '{{date}} · {{speaker}} · Register now',
			badge: 'WEBINAR',
			accent: '#0ea5e9',
			background: '#f0f9ff'
		}),
		overview: [
			'Event marketing repeats the same pattern: title, date, speaker, CTA.',
			'Render promo banners from your events database and ship assets on demand via API.'
		],
		painPoints: ['Design workload for every event', 'Inconsistent templates', 'Slow turnaround for campaigns'],
		workflow: [
			{ title: 'Create promo template', detail: 'Design a layout for title/date/speaker/CTA.' },
			{ title: 'Render per event', detail: 'Generate a banner for each webinar automatically.' },
			{ title: 'Batch for series', detail: 'Render an entire series in one batch job.' }
		],
		faqs: [{ q: 'Can I add speaker photos?', a: 'Yes. Bind image URLs for headshots in the template.' }],
		related: ['event-ticket', 'product-banner']
	},
	'event-ticket': {
		label: 'Event Ticket Generator',
		description: 'Generate branded tickets and passes from registration data.',
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1200x630', '1600x900'],
		templateHtml: simpleCardTemplate({
			title: 'Ticket: {{eventName}}',
			subtitle: '{{date}} · {{attendeeName}} · {{seat}}',
			badge: 'TICKET',
			accent: '#111827',
			background: '#f8fafc'
		}),
		overview: [
			'Tickets are templates + attendee variables — perfect for automation.',
			'Generate passes per attendee and distribute via email or portals with CDN URLs.'
		],
		painPoints: ['Manual ticket creation', 'Hard to reissue', 'Inconsistent formatting'],
		workflow: [
			{ title: 'Design ticket template', detail: 'Create a layout with event and attendee variables.' },
			{ title: 'Render per attendee', detail: 'Generate a unique ticket for each registration.' },
			{ title: 'Batch deliver', detail: 'Batch render and send through your email provider.' }
		],
		faqs: [{ q: 'Can I include QR codes?', a: 'Yes. Bind a QR image URL into the template.' }],
		related: ['webinar-promo', 'certificate']
	},
	'job-post': {
		label: 'Job Post Card',
		description: 'Generate job post cards for recruiting and social sharing.',
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1080x1350', '1200x630'],
		templateHtml: simpleCardTemplate({
			title: 'We’re hiring: {{role}}',
			subtitle: '{{location}} · {{team}} · Apply now',
			badge: 'HIRING',
			accent: '#6366f1',
			background: '#eef2ff'
		}),
		overview: [
			'Hiring content is repetitive and often needs variants per role and channel.',
			'Render consistent job cards from your ATS data and publish automatically.'
		],
		painPoints: ['Manual design per role', 'Brand inconsistency', 'Slow updates when details change'],
		workflow: [
			{ title: 'Design template', detail: 'Create a job card layout once.' },
			{ title: 'Render from ATS', detail: 'Use role/team/location variables to generate images.' },
			{ title: 'Batch distribute', detail: 'Generate all openings weekly and share across channels.' }
		],
		faqs: [{ q: 'Can I include salary ranges?', a: 'Yes. Add variables like {{salaryMin}}–{{salaryMax}}.' }],
		related: ['tweet-card', 'product-banner']
	},
	'feature-flag-banner': {
		label: 'Feature Flag Banner',
		description: 'Generate feature flag banners for docs, rollouts, and internal comms.',
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1600x900'],
		templateHtml: simpleCardTemplate({
			title: 'Feature flag: {{flagName}}',
			subtitle: '{{status}} · rollout {{rollout}} · owner {{owner}}',
			badge: 'FLAG',
			accent: '#f59e0b',
			background: '#fffbeb'
		}),
		overview: [
			'Feature flags change frequently and need clear communication.',
			'Generate banners from your flagging system to keep docs and rollouts consistent.'
		],
		painPoints: ['Outdated docs', 'Manual formatting', 'Confusing rollout comms'],
		workflow: [
			{ title: 'Create banner template', detail: 'Design a layout for flag name/status/rollout.' },
			{ title: 'Render on changes', detail: 'Generate a new banner whenever status or rollout changes.' },
			{ title: 'Publish', detail: 'Use image URLs across docs and internal channels.' }
		],
		faqs: [{ q: 'Can I show environments (prod/staging)?', a: 'Yes. Add variables and conditional blocks for each environment.' }],
		related: ['release-notes-card', 'status-update']
	},
	'report-cover': {
		label: 'Report Cover',
		description: 'Generate consistent report covers for decks, PDFs, and quarterly updates.',
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1600x900', '1920x1080', '1200x630'],
		templateHtml: simpleCardTemplate({
			title: '{{reportTitle}}',
			subtitle: '{{period}} · prepared for {{audience}}',
			badge: 'REPORT',
			accent: '#111827',
			background: '#f8fafc'
		}),
		overview: [
			'Report covers are templates with a small set of changing variables.',
			'Generate covers automatically so every report looks on-brand and consistent.'
		],
		painPoints: ['Manual cover updates', 'Inconsistent styling', 'Slow reporting cycles'],
		workflow: [
			{ title: 'Design cover template', detail: 'Create a cover layout with title and period variables.' },
			{ title: 'Render from reporting job', detail: 'Generate covers when reports are produced.' },
			{ title: 'Batch variants', detail: 'Render per team, region, or audience.' }
		],
		faqs: [{ q: 'Can I use this as a PDF cover?', a: 'Yes. Use the image as a first page cover or embed it in your PDF flow.' }],
		related: ['kpi-card', 'table']
	},
	'roadmap-card': {
		label: 'Roadmap Card',
		description: 'Generate roadmap cards for product planning and stakeholder updates.',
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1600x900'],
		templateHtml: simpleCardTemplate({
			title: 'Roadmap: {{quarter}}',
			subtitle: '{{theme}} · bets: {{item1}}, {{item2}}, {{item3}}',
			badge: 'ROADMAP',
			accent: '#6366f1',
			background: '#eef2ff'
		}),
		overview: [
			'Roadmaps change often and need a consistent way to share updates.',
			'Render roadmap cards from planning exports and keep stakeholder comms aligned.'
		],
		painPoints: ['Manual slides every month', 'Outdated visuals', 'Slow stakeholder communication'],
		workflow: [
			{ title: 'Create roadmap template', detail: 'Design a card for quarter/theme and top items.' },
			{ title: 'Render from planning data', detail: 'Pull key items and render via API.' },
			{ title: 'Distribute', detail: 'Use the image URL in docs, email, and exec updates.' }
		],
		faqs: [{ q: 'Can I include lanes (now/next/later)?', a: 'Yes. Create a 3-column layout and bind variables for each lane.' }],
		related: ['status-update', 'kpi-card']
	}
};

export const apiLanguages = [
	{ id: 'node', label: 'Node.js' },
	{ id: 'python', label: 'Python' },
	{ id: 'php', label: 'PHP' },
	{ id: 'ruby', label: 'Ruby' },
	{ id: 'go', label: 'Go' },
	{ id: 'java', label: 'Java' },
	{ id: 'csharp', label: 'C#' }
];

export function parseSize(sizeStr) {
	const match = (sizeStr || '').toLowerCase().match(/^(\d+)x(\d+)$/);
	if (!match) return { width: null, height: null };
	return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
}

export function sizeUrl(format, size) {
	return `/tools/html-to-${format}/${size}`;
}

export function baseFormatUrl(format) {
	return `/tools/html-to-${format}`;
}


