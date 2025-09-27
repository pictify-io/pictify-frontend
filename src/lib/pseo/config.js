// Central config for Programmatic SEO
// Keep values small and opinionated; expand over time

export const formats = [
	{ id: 'jpg', label: 'JPG' },
	{ id: 'png', label: 'PNG' },
	{ id: 'webp', label: 'WebP' }
];

export const popularSizes = [
	'1200x630', // OG default
	'1080x1080', // Square
	'1920x1080', // 16:9 HD
	'1024x512' // Twitter legacy
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
	{ id: 'code', label: 'Code to Image' }
];

export const useCaseDetails = {
	'html-email': {
		label: 'HTML Email to Image',
		description: 'Capture pixel-perfect email previews and share or archive them as static images.',
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
			{ q: 'Will custom fonts and background images render?', a: 'As long as the HTML references publicly accessible assets, Pictify reproduces them. For best results, host fonts and images on a CDN.' }
		],
		related: ['table', 'markdown']
	},
	'table': {
		label: 'HTML Table to Image',
		description: 'Turn dashboards and reports into shareable images without screenshot tools.',
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
			{ q: 'Do sticky headers or alternating row colors work?', a: 'Any CSS that is supported by Chromium will display. Inline the relevant CSS to ensure consistent output.' }
		],
		related: ['html-email', 'code']
	},
	'markdown': {
		label: 'Markdown to Image',
		description: 'Render Markdown content as polished images for social posts or documentation.',
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


