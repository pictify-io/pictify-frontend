// Helper function to generate simple card template HTML
function simpleCardTemplate({
	title,
	subtitle,
	badge,
	accent = '#4ade80',
	background = '#FFFDF8'
}) {
	return `<html>
  <head>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Inter', -apple-system, sans-serif;
        background: ${background};
        padding: 48px;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .card {
        background: white;
        border: 3px solid #1f2937;
        border-radius: 20px;
        padding: 48px;
        max-width: 600px;
        box-shadow: 8px 8px 0 0 ${accent};
      }
      .badge {
        display: inline-block;
        background: ${accent};
        color: ${accent === '#111827' || accent === '#1f2937' ? 'white' : '#1f2937'};
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 2px;
        padding: 8px 16px;
        border-radius: 999px;
        border: 2px solid #1f2937;
        margin-bottom: 24px;
      }
      h1 {
        font-size: 36px;
        font-weight: 900;
        color: #1f2937;
        line-height: 1.2;
        margin-bottom: 16px;
      }
      p {
        font-size: 18px;
        color: #6b7280;
        font-weight: 500;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">${badge}</div>
      <h1>${title}</h1>
      <p>${subtitle}</p>
    </div>
  </body>
</html>`;
}

// Helper function to generate monospace/code card template HTML
function simpleMonoCardTemplate({ title, body }) {
	return `<html>
  <head>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Inter', -apple-system, sans-serif;
        background: #1f2937;
        padding: 48px;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .card {
        background: #111827;
        border: 3px solid #374151;
        border-radius: 16px;
        padding: 32px;
        max-width: 700px;
        width: 100%;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #374151;
      }
      .dot { width: 12px; height: 12px; border-radius: 50%; }
      .dot-red { background: #ef4444; }
      .dot-yellow { background: #eab308; }
      .dot-green { background: #22c55e; }
      .title {
        color: #9ca3af;
        font-size: 14px;
        font-weight: 600;
        margin-left: auto;
      }
      pre {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 14px;
        color: #4ade80;
        line-height: 1.6;
        overflow-x: auto;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <div class="dot dot-red"></div>
        <div class="dot dot-yellow"></div>
        <div class="dot dot-green"></div>
        <span class="title">${title}</span>
      </div>
      <pre>${body}</pre>
    </div>
  </body>
</html>`;
}

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
	{ id: 'roadmap-card', label: 'Roadmap Card' },
	// New use cases (Phase 3.1)
	{ id: 'youtube-thumbnail', label: 'YouTube Thumbnail Generator' },
	{ id: 'linkedin-banner', label: 'LinkedIn Banner Generator' },
	{ id: 'podcast-cover', label: 'Podcast Cover Generator' },
	{ id: 'twitter-header', label: 'Twitter Header Generator' },
	{ id: 'instagram-story', label: 'Instagram Story Generator' },
	{ id: 'email-header', label: 'Email Header Generator' },
	{ id: 'blog-featured-image', label: 'Blog Featured Image' },
	{ id: 'course-certificate', label: 'Course Certificate' },
	{ id: 'membership-card', label: 'Membership Card' },
	{ id: 'event-invitation', label: 'Event Invitation' },
	{ id: 'discount-coupon', label: 'Discount Coupon' },
	{ id: 'portfolio-card', label: 'Portfolio Card' },
	{ id: 'resume-snapshot', label: 'Resume Snapshot' },
	{ id: 'menu-card', label: 'Menu Card Generator' },
	{ id: 'real-estate-flyer', label: 'Real Estate Flyer' },
	{ id: 'sports-score-card', label: 'Sports Score Card' },
	{ id: 'weather-widget', label: 'Weather Widget' },
	{ id: 'stock-chart', label: 'Stock Chart Image' },
	{ id: 'infographic', label: 'Infographic Generator' },
	{ id: 'meme-generator', label: 'Meme Generator' },
	{ id: 'responsive-image-generator', label: 'Responsive Image Generator' },
	{ id: 'barcode-generator', label: 'Barcodes' },
	{ id: 'qr-code-generator', label: 'QR Code Generator' },
	{ id: 'signature-generator', label: 'Email Signature' },
	{ id: 'name-badge', label: 'Name Badge' },
	{ id: 'social-proof-card', label: 'Social Proof Card' },
	{ id: 'changelog-image', label: 'Changelog Image' }
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
			{
				title: 'Prepare the HTML',
				detail:
					'Grab the final HTML from your ESP (Mailchimp, Braze, HubSpot, etc.) and inline styles if needed.'
			},
			{
				title: 'Choose rendering size',
				detail: 'Use 1200×630 for portfolio decks or 1080×1920 for mobile-focused previews.'
			},
			{
				title: 'Generate & distribute',
				detail: 'Export PNG or JPG, drop it in Slack, Notion, or your approval workflow instantly.'
			}
		],
		faqs: [
			{
				q: 'Can I show both desktop and mobile previews?',
				a: 'Yes. Render once at 1200×630 for desktop, then switch to 1080×1920 for mobile. Each conversion produces a CDN-hosted image you can share immediately.'
			},
			{
				q: 'Will custom fonts and background images render?',
				a: 'As long as the HTML references publicly accessible assets, Pictify reproduces them. For best results, host fonts and images on a CDN.'
			},
			{
				q: 'Can I automate email previews with the API?',
				a: 'Absolutely. Use the Pictify API to generate email preview images programmatically whenever a campaign is ready for review. Integrate with your email platform webhooks for fully automated workflows.'
			},
			{
				q: 'What email service providers are supported?',
				a: 'Any ESP that exports HTML works — Mailchimp, Klaviyo, Braze, HubSpot, SendGrid, Campaign Monitor, and more. Simply export the email HTML and paste it into Pictify.'
			}
		],
		related: ['table', 'markdown']
	},
	table: {
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
			{
				title: 'Capture the HTML',
				detail:
					'Use your data layer to output HTML tables with inline CSS for fonts, colors, and spacing.'
			},
			{
				title: 'Select high-resolution output',
				detail:
					'For enterprise dashboards, 1920×1080 or 1600×900 provides a crisp slide-ready asset.'
			},
			{
				title: 'Generate and embed',
				detail:
					'Drop the image in decks, Confluence, or Slack. CDN hosting gives you a shareable link as well.'
			}
		],
		faqs: [
			{
				q: 'Can I render tables wider than 1920px?',
				a: 'Yes. Increase the custom canvas size before generating the image. Pictify supports up to 4000×4000 pixels.'
			},
			{
				q: 'Do sticky headers or alternating row colors work?',
				a: 'Any CSS that is supported by Chromium will display. Inline the relevant CSS to ensure consistent output.'
			},
			{
				q: 'Can I automate weekly dashboard images?',
				a: 'Absolutely. Use the Pictify API to render table snapshots on a schedule. Combine with your BI tool exports for fully automated reporting.'
			},
			{
				q: 'What about charts and graphs?',
				a: 'If your charts render as HTML/SVG, Pictify will capture them. For canvas-based charts, export as SVG first or use our chart element in the editor.'
			}
		],
		related: ['html-email', 'code']
	},
	markdown: {
		label: 'Markdown to Image',
		description: 'Render Markdown content as polished, shareable images for social posts, docs, and presentations.',
		seoKeywords: [
			'markdown to image',
			'convert markdown to image',
			'markdown screenshot generator',
			'README to image',
			'markdown social image',
			'markdown to PNG',
			'release notes image',
			'documentation to image',
			'markdown image converter',
			'developer social images'
		],
		longDescription: `Developers and technical writers regularly need to share Markdown content on platforms
			that require or prefer images — Twitter, LinkedIn, Instagram, and internal wikis. Traditional screenshots
			capture browser chrome and create inconsistent visuals. With Pictify's Markdown to image converter,
			you render your Markdown as beautifully styled HTML and convert it directly to a crisp, shareable image.
			Perfect for changelogs, README highlights, code tutorials, and release announcements.

			Use dark mode themes, syntax highlighting, and custom fonts to match your brand. The API integration lets
			you automate image generation from Markdown files in your CI/CD pipeline — every time you push a release,
			a social card is generated automatically. No more manual screenshots or inconsistent formatting across
			your marketing channels.`,
		useCaseScenarios: [
			'Developer advocates sharing code snippets on Twitter/X',
			'Open source maintainers creating README preview images',
			'DevRel teams generating release notes social cards',
			'Technical writers creating documentation thumbnails',
			'Engineering teams sharing changelog updates internally'
		],
		features: [
			'Render any Markdown-to-HTML output as a pixel-perfect image',
			'Support for dark mode, light mode, and custom themes',
			'Syntax highlighting for embedded code blocks',
			'Custom fonts including monospace and serif options',
			'API-driven generation from CI/CD pipelines',
			'Batch rendering for documentation libraries'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1200x630', '1080x1080'],
		templateHtml: simpleCardTemplate({
			title: '{{heading}}',
			subtitle: '{{summary}} · {{author}}',
			badge: 'MARKDOWN',
			accent: '#7ee0ff',
			background: '#0b0b1f'
		}),
		overview: [
			'Markdown is the lingua franca for documentation, but sharing snippets on X, LinkedIn, or internal blogs normally involves clunky screenshots. By rendering Markdown as HTML and converting it to an image, teams keep typography clean and brand-aligned.',
			'Engineering, product, and developer relations teams turn README highlights, release notes, and code snippets into snackable graphics using this workflow.'
		],
		painPoints: [
			'Difficult to share Markdown on visual-first channels',
			'Screenshots pick up UI chrome and reduce readability',
			'Formatting inconsistencies when copying into slides'
		],
		workflow: [
			{
				title: 'Convert Markdown to HTML',
				detail: 'Use your static site generator or a Markdown parser to create HTML with the desired theme.'
			},
			{
				title: 'Pick social-friendly dimensions',
				detail: 'Square (1080×1080) for Instagram, 1200×630 for LinkedIn/Twitter cards.'
			},
			{
				title: 'Customize and export',
				detail: 'Adjust background, fonts, and callouts before generating the final asset.'
			}
		],
		faqs: [
			{
				q: 'Can I use dark mode themes?',
				a: 'Absolutely. Include the CSS for your preferred dark theme when generating the HTML, then convert it directly.'
			},
			{
				q: 'Does syntax highlighting survive?',
				a: 'Yes. Use a highlighting library like Prism or Highlight.js to output styled HTML before conversion.'
			},
			{
				q: 'Can I automate this in my CI pipeline?',
				a: 'Yes. Call the Pictify API from your build step to generate social images every time you push a release or update docs.'
			}
		],
		related: ['code', 'html-email']
	},
	certificate: {
		label: 'Certificate Generator',
		toolUrl: '/tools/certificate-generator',
		description: 'Generate personalized certificates and diplomas as downloadable images for events, courses, and recognition programs.',
		seoKeywords: [
			'certificate generator',
			'create certificates online',
			'HTML to certificate',
			'automated certificate generation',
			'bulk certificate maker',
			'certificate template generator',
			'online certificate creator',
			'certificate of completion generator',
			'diploma image generator',
			'custom certificate maker'
		],
		longDescription: `Creating professional certificates at scale is a common challenge for educational platforms,
			HR teams, and event organizers. Traditional design tools require manual effort for each certificate,
			making it impractical when you need to generate hundreds or thousands of certificates. With Pictify's
			certificate generator, you design your certificate template once using HTML/CSS, bind dynamic variables
			like recipient name, course name, and completion date, then generate certificates programmatically via API.

			This automation saves hours of manual work and ensures consistent branding across all certificates.
			Whether you are issuing completion certificates for an online course, recognition awards for employees,
			or attendance certificates for a conference, the workflow is the same: design once, render thousands.`,
		useCaseScenarios: [
			'Online courses issuing completion certificates to students',
			'HR departments creating employee recognition certificates',
			'Conference organizers generating attendee certificates',
			'Training platforms automating certification upon assessment completion',
			'Professional associations issuing membership certificates'
		],
		features: [
			'HTML/CSS certificate template with full styling control',
			'Dynamic variables for name, course, date, and credentials',
			'Batch rendering for hundreds of certificates in one API call',
			'Support for signatures, seals, and watermarks as image layers',
			'High-resolution output suitable for printing',
			'QR code integration for certificate verification'
		],
		recommendedFormats: ['jpg', 'png'],
		recommendedSizes: ['1920x1080'],
		templateHtml: simpleCardTemplate({
			title: 'Certificate of Achievement',
			subtitle: '{{recipientName}} · {{courseName}} · {{date}}',
			badge: 'CERTIFIED',
			accent: '#c8a76b',
			background: '#fefbf0'
		}),
		overview: [
			'Education platforms, webinar hosts, and community events frequently issue certificates. Generating them as images ensures recipients can download, print, or share them instantly without dealing with PDF rendering quirks.',
			'Because the certificate layout is HTML, you can personalize names, achievements, and dates at scale before turning them into polished graphics — no designer bottleneck.'
		],
		painPoints: [
			'Creating certificates manually in design tools does not scale',
			'PDF exports are heavy and unfriendly for mobile recipients',
			'Ensuring consistent branding across hundreds of certificates',
			'Delayed delivery when certificates require manual approval'
		],
		workflow: [
			{
				title: 'Build the template',
				detail: 'Design your certificate using HTML/CSS with placeholders for names, achievements, and dates.'
			},
			{
				title: 'Merge participant data',
				detail: 'Replace placeholders with dynamic data from your CRM, LMS, or spreadsheet before conversion.'
			},
			{
				title: 'Generate and distribute',
				detail: 'Export images and send them via email, allow download from your portal, or embed in your LMS.'
			}
		],
		faqs: [
			{
				q: 'Can I print the generated certificate?',
				a: 'Yes. Use 1920×1080 or larger to produce high-quality prints. You can also create a PDF from the image if needed.'
			},
			{
				q: 'How do I handle signatures or seals?',
				a: 'Embed them as transparent PNGs in your HTML template. They will render in the final image with full fidelity.'
			},
			{
				q: 'Can I add a unique verification ID?',
				a: 'Yes. Bind a unique ID variable and optionally render it as a QR code for instant verification.'
			}
		],
		related: ['badge', 'course-certificate']
	},
	code: {
		label: 'Code to Image',
		description: 'Share beautiful code snippets with syntax highlighting — a cleaner alternative to IDE screenshots.',
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
			images with proper syntax highlighting. Screenshots of editors look unprofessional with interface elements,
			file trees, and status bars cluttering the image. Pictify's code to image converter renders your code with
			beautiful themes, proper syntax highlighting, and custom styling — perfect for Twitter threads, blog posts,
			slide decks, and tutorials.

			Choose from multiple color schemes, customize window frames, and generate consistent code images via API
			for your documentation workflow. Unlike Carbon or similar tools, Pictify gives you full API access so you
			can generate code images programmatically as part of your docs build or content pipeline.`,
		useCaseScenarios: [
			'Developers sharing code tips on Twitter/X and LinkedIn',
			'Technical bloggers creating code illustrations for articles',
			'Educators preparing slides with code examples',
			'Open source maintainers showcasing code in READMEs',
			'DevRel teams creating tutorial graphics'
		],
		features: [
			'Syntax highlighting for 100+ languages via Prism/Highlight.js',
			'Dark and light theme support with custom color schemes',
			'Terminal-style window frames with colored dots',
			'Custom fonts including JetBrains Mono, Fira Code, and more',
			'Line numbers and line highlighting for emphasis',
			'API-driven generation for docs builds and CI pipelines'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1200x630', '1080x1080'],
		templateHtml: simpleCardTemplate({
			title: '{{fileName}}',
			subtitle: '{{language}} · {{description}}',
			badge: 'CODE',
			accent: '#7dd3fc',
			background: '#0f172a'
		}),
		overview: [
			'Developer advocates and engineers often share code snippets externally, but standard screenshots are hard to read. With Pictify, you can highlight syntax, add branding, and export a clean snippet ready for any channel.',
			'Use the workflow to create blog hero images, documentation callouts, or social-media friendly snippets showing new features and API examples.'
		],
		painPoints: [
			'IDE screenshots include extra UI chrome and clutter',
			'Difficult to maintain consistent fonts and spacing across assets',
			'Sharing sensitive paths or environment variables by accident'
		],
		workflow: [
			{
				title: 'Paste formatted HTML',
				detail: 'Use Prism/Highlight.js or MDX to output styled HTML for the snippet.'
			},
			{
				title: 'Pick theme and size',
				detail: 'Choose dark or light theme and select 1200×630 for OG cards or square for carousels.'
			},
			{
				title: 'Generate and publish',
				detail: 'Export and upload to your blog, docs, or social channels with consistent branding.'
			}
		],
		faqs: [
			{
				q: 'Can I include multiple files or tabs?',
				a: 'Yes. Structure your HTML with headers or tabs before converting, and Pictify will render them exactly.'
			},
			{
				q: 'Is there a character limit for code?',
				a: 'No strict limit, but ensure the canvas width/height is large enough for readability. You can always increase dimensions before generation.'
			},
			{
				q: 'Can I automate code image generation for docs?',
				a: 'Yes. Use the API to render code snippets during your docs build step so examples always stay up to date.'
			}
		],
		related: ['markdown', 'api-response-card']
	},
	receipt: {
		label: 'Receipt Generator',
		description: 'Generate branded receipts and transaction records as images for emails, downloads, and customer portals.',
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
			items, prices, and totals, then generate receipt images via API whenever an order completes.

			The same template works across email confirmations, customer portals, and support flows. When a
			customer requests a receipt reissue, just call the API with the original order data and generate a
			fresh image instantly — no manual work required.`,
		useCaseScenarios: [
			'E-commerce stores sending order confirmation emails',
			'Subscription services providing payment receipts',
			'Payment processors generating transaction records',
			'Marketplaces issuing receipts to buyers and sellers',
			'Event ticketing platforms confirming purchases'
		],
		features: [
			'Branded receipt templates with your logo and colors',
			'Dynamic line items, taxes, and totals via variables',
			'Lightweight image format that renders in any email client',
			'Batch reissue for historical orders in one API call',
			'QR code support for digital verification',
			'Multi-currency formatting with locale-aware rendering'
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
			'Receipts are transactional media: one template, thousands of variable sets. Image receipts render perfectly in every email client, unlike PDFs that require a viewer.',
			'Render branded receipts from order data via API and reuse across email, portal, and support flows. Reissue receipts instantly without manual intervention.'
		],
		painPoints: [
			'Manual screenshots or PDFs for each receipt',
			'Inconsistent formatting across devices and email clients',
			'Hard to reissue at scale when customers request copies',
			'PDF attachments increase email size and reduce deliverability'
		],
		workflow: [
			{
				title: 'Design once',
				detail: 'Create a receipt layout and bind variables like orderId, line items, and total.'
			},
			{
				title: 'Render per order',
				detail: 'Call the API with order variables to generate a receipt URL instantly.'
			},
			{
				title: 'Batch reissue',
				detail: 'Re-render receipts for many orders in one batch job when needed.'
			}
		],
		faqs: [
			{
				q: 'Can I include multiple line items?',
				a: 'Yes. Use multiple rows or build a repeatable block in the template workspace.'
			},
			{
				q: 'Can I embed the receipt in email?',
				a: 'Yes. Use the generated image URL directly in your transactional emails for perfect rendering.'
			},
			{
				q: 'What about tax and currency formatting?',
				a: 'Use variables for currency symbol and tax values. The template renders whatever data you pass, so locale-specific formatting is fully supported.'
			}
		],
		related: ['html-email', 'table']
	},
	badge: {
		label: 'Badge Generator',
		description: 'Generate achievement badges, skill labels, and milestone markers as shareable images for gamification and recognition.',
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
			badge name, user name, and date earned, then generate shareable badge images via API.

			Perfect for learning platforms, fitness apps, developer communities, and any product with achievement
			systems. Unlike static badge libraries, Pictify badges are dynamically generated — so each user gets
			a personalized badge with their name, tier, and achievement date baked in.`,
		useCaseScenarios: [
			'Learning platforms issuing skill completion badges',
			'Developer communities awarding contribution badges',
			'Fitness apps celebrating milestone achievements',
			'Employee recognition programs creating award badges',
			'Gaming platforms generating achievement unlocks'
		],
		features: [
			'Fully customizable badge templates with brand styling',
			'Dynamic variables for user name, achievement, tier, and date',
			'Transparent background support for overlay use cases',
			'Batch rendering for cohort-wide badge issuance',
			'Social-optimized sizes for LinkedIn and Twitter sharing',
			'Tiered badge variants (bronze, silver, gold) from one template'
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
			'Badges are a lightweight, personalized growth loop artifact. When users earn and share them, they drive organic awareness for your platform.',
			'Generate badges for users, cohorts, and campaigns using one reusable template. Bind variables for name, tier, and date to produce unique badges at scale.'
		],
		painPoints: [
			'Manual badge design for each recipient',
			'Inconsistent sizes across channels',
			'No scalable way to generate for cohorts',
			'Static badge libraries lack personalization'
		],
		workflow: [
			{
				title: 'Pick a badge layout',
				detail: 'Design a badge style once with your brand fonts, colors, and tier indicators.'
			},
			{
				title: 'Bind variables',
				detail: 'Use variables for badgeName, userName, tier, and date to personalize each badge.'
			},
			{
				title: 'Render at scale',
				detail: 'Batch render for cohorts and embed CDN URLs across product surfaces and emails.'
			}
		],
		faqs: [
			{
				q: 'Do transparent backgrounds work?',
				a: 'Yes. Use PNG or WebP format and keep the background transparent for overlay use cases.'
			},
			{
				q: 'Can I create tiered badges (bronze/silver/gold)?',
				a: 'Yes. Use conditional styling or separate template variants for each tier, driven by a single tier variable.'
			},
			{
				q: 'How do I integrate with my LMS or app?',
				a: 'Call the Pictify API when a user earns an achievement. Pass user and badge data as variables to generate a unique image URL.'
			}
		],
		related: ['certificate', 'leaderboard']
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
		painPoints: [
			'Design bottlenecks for social posts',
			'Manual resizing for each platform',
			'Inconsistent typography'
		],
		workflow: [
			{ title: 'Create quote template', detail: 'Design quote + author + company layout once.' },
			{
				title: 'Render per quote',
				detail: 'Send quote variables and generate an image instantly.'
			},
			{
				title: 'Batch for campaigns',
				detail: 'Generate dozens of quote assets in a single batch job.'
			}
		],
		faqs: [
			{
				q: 'What about long quotes?',
				a: 'Increase height or adjust font size/line height in the template.'
			}
		],
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
			{
				title: 'Design the template',
				detail: 'Create tweet layout once with variables for text, handle, and date.'
			},
			{
				title: 'Render for channels',
				detail: 'Generate platform-specific sizes (X, LinkedIn, IG).'
			},
			{ title: 'Batch schedule', detail: 'Batch render cards for a week of content.' }
		],
		faqs: [
			{
				q: 'Can I include an avatar?',
				a: 'Yes. Add an image layer bound to an avatar URL variable.'
			}
		],
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
			{
				title: 'Design banner template',
				detail: 'Create a layout with variables for name, tagline, and price.'
			},
			{ title: 'Render variants', detail: 'Generate variants for each segment or campaign.' },
			{ title: 'Ship everywhere', detail: 'Use CDN URLs across ads, landing pages, and emails.' }
		],
		faqs: [
			{
				q: 'Can I render multiple sizes per campaign?',
				a: 'Yes. Render the same template at different sizes for each platform.'
			}
		],
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
		painPoints: [
			'Outdated pricing screenshots',
			'Manual work for multiple currencies',
			'Inconsistent design across teams'
		],
		workflow: [
			{
				title: 'Design once',
				detail: 'Create a plan card layout with variables for name/price/features.'
			},
			{ title: 'Render per plan', detail: 'Generate cards for each tier and currency.' },
			{ title: 'Batch updates', detail: 'Re-render when pricing or brand changes.' }
		],
		faqs: [
			{
				q: 'Can I mark “Most popular”?',
				a: 'Yes. Use conditional logic in the template workspace.'
			}
		],
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
		painPoints: [
			'Manual social assets per release',
			'Slow announcements',
			'Inconsistent formatting'
		],
		workflow: [
			{
				title: 'Create changelog template',
				detail: 'Design a layout for version, headline, and date.'
			},
			{ title: 'Render from CI', detail: 'Trigger generation automatically on release.' },
			{ title: 'Distribute', detail: 'Use CDN URLs across social, docs, and email.' }
		],
		faqs: [
			{
				q: 'Can I include multiple bullets?',
				a: 'Yes. Add a list section in the template and increase height.'
			}
		],
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
		faqs: [
			{
				q: 'Can I include screenshots?',
				a: 'Yes. Add an image layer bound to a screenshot URL variable.'
			}
		],
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
		faqs: [
			{
				q: 'Can I render full JSON?',
				a: 'Yes, but increase canvas size or focus on key fields for readability.'
			}
		],
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
			{
				title: 'Define the JSON shape',
				detail: 'Pick the fields you want to display and bind variables.'
			},
			{ title: 'Render on demand', detail: 'Generate images whenever payloads change.' },
			{
				title: 'Batch examples',
				detail: 'Render multiple example payloads for docs or onboarding.'
			}
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
		painPoints: [
			'No time for design during incidents',
			'Inconsistent messaging',
			'Slow updates across channels'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create a layout for status, message, and timestamp.' },
			{
				title: 'Render from incident data',
				detail: 'Send incident fields to generate an image URL.'
			},
			{ title: 'Distribute', detail: 'Use the URL in social, email, and internal channels.' }
		],
		faqs: [
			{
				q: 'Can I color-code status (green/yellow/red)?',
				a: 'Yes. Use conditional logic in the template workspace.'
			}
		],
		related: ['changelog-card', 'tweet-card']
	},
	leaderboard: {
		label: 'Leaderboard Card',
		description: 'Generate leaderboard snapshots and ranking cards for communities, contests, and gamification programs.',
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
			leaderboard images via API whenever rankings update.

			Whether you run a weekly coding challenge, a sales contest, or a fitness competition, leaderboard
			images drive participation by making standings visible and shareable. Post them to Slack, Discord,
			email newsletters, or social media to keep your community engaged.`,
		useCaseScenarios: [
			'Gaming platforms sharing daily/weekly top players',
			'Developer communities ranking top contributors',
			'Fitness apps displaying workout leaderboards',
			'Sales teams celebrating top performers',
			'Contest platforms announcing competition standings'
		],
		features: [
			'Dynamic ranking rows with position, name, and score variables',
			'Configurable number of entries (top 3, top 10, etc.)',
			'Period-based rendering (daily, weekly, monthly, all-time)',
			'Team and individual leaderboard layouts',
			'Automatic refresh via scheduled API calls',
			'Social-optimized dimensions for Discord, Slack, and Twitter'
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
			'Leaderboards drive engagement when they are frequent and easy to share. A visual leaderboard image in Discord or Slack gets far more attention than a text list.',
			'Render leaderboard cards from your metrics pipeline and distribute to communities automatically on a schedule or whenever rankings change.'
		],
		painPoints: [
			'Manual exports from spreadsheets or admin panels',
			'Inconsistent weekly formatting across updates',
			'Slow to publish when rankings change frequently',
			'Text-only leaderboards get ignored in busy channels'
		],
		workflow: [
			{
				title: 'Design layout',
				detail: 'Create a leaderboard card with variables for rank, names, scores, and time period.'
			},
			{
				title: 'Render from data',
				detail: 'Send top results from your database or API and generate a fresh image URL.'
			},
			{
				title: 'Publish automatically',
				detail: 'Post to Slack, Discord, or embed in newsletters on a schedule via webhooks.'
			}
		],
		faqs: [
			{
				q: 'Can I show more than three entries?',
				a: 'Yes. Increase the template height and add more row variables. Top-10 and top-25 layouts work well.'
			},
			{
				q: 'Can I include avatars or profile photos?',
				a: 'Yes. Bind image URL variables for each ranked user to display avatars alongside names and scores.'
			},
			{
				q: 'How do I update the leaderboard automatically?',
				a: 'Schedule an API call (e.g., via cron job or webhook) that fetches current rankings and renders a new image whenever data changes.'
			}
		],
		related: ['kpi-card', 'badge']
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
			{
				title: 'Create KPI template',
				detail: 'Design a card with variables for metric name/value/delta.'
			},
			{ title: 'Render from analytics', detail: 'Call the API from your reporting job.' },
			{ title: 'Distribute', detail: 'Embed URLs in Notion, decks, or newsletters.' }
		],
		faqs: [
			{ q: 'Can I render charts?', a: 'Yes. Render charts in HTML or add a chart image layer.' }
		],
		related: ['table', 'leaderboard']
	},
	testimonial: {
		label: 'Testimonial Card',
		description: 'Turn customer reviews and testimonials into branded social proof images for marketing and sales.',
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
		longDescription: `Customer testimonials are powerful social proof for marketing, but they are hard to share
			visually. Screenshots of reviews look messy and inconsistent. With Pictify's testimonial card generator,
			you design beautiful testimonial templates featuring customer photos, quotes, and ratings, then generate
			branded testimonial images via API. Perfect for sharing on social media, embedding in email campaigns,
			and displaying on landing pages.

			Unlike manual screenshot workflows, Pictify testimonial cards are perfectly branded, consistently sized,
			and can be generated at scale from your CRM or review platform. When a new 5-star review comes in,
			generate a shareable image automatically and queue it for your social calendar.`,
		useCaseScenarios: [
			'Marketing teams creating testimonial graphics for social media',
			'Sales teams sharing customer success stories in proposals',
			'Product teams highlighting user feedback in presentations',
			'E-commerce stores displaying customer reviews as images',
			'SaaS companies featuring case study quotes on landing pages'
		],
		features: [
			'Branded testimonial templates with photo, quote, and attribution',
			'Star rating and NPS score display support',
			'Dynamic variables for name, role, company, and logo',
			'Batch generation from CRM or review platform exports',
			'Multiple aspect ratios for social, email, and web',
			'Auto-generation on new review via webhook integration'
		],
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1080x1080', '1080x1350'],
		templateHtml: simpleCardTemplate({
			title: '”{{testimonial}}”',
			subtitle: '— {{name}}, {{role}} @ {{company}}',
			badge: 'SOCIAL PROOF',
			accent: '#ff6b6b',
			background: '#fff7ed'
		}),
		overview: [
			'Testimonials are high-leverage marketing assets but tedious to turn into polished visuals. Screenshots of review platforms look messy and inconsistent across channels.',
			'Render testimonial variations from your CRM, G2, Trustpilot, or spreadsheet exports and keep design consistent everywhere — social, email, landing pages, and sales decks.'
		],
		painPoints: [
			'Manual design work for each testimonial graphic',
			'Inconsistent styling across social and web channels',
			'Slow iteration when adding new testimonials to landing pages',
			'Review screenshots look unprofessional and off-brand'
		],
		workflow: [
			{
				title: 'Design template',
				detail: 'Create a layout with variables for testimonial text, customer name, role, company, and optional photo.'
			},
			{
				title: 'Render per entry',
				detail: 'Generate a branded card for each testimonial automatically from your review data source.'
			},
			{
				title: 'Batch refresh',
				detail: 'Re-render all testimonial cards when brand, typography, or template styling changes.'
			}
		],
		faqs: [
			{
				q: 'Can I add a customer logo or photo?',
				a: 'Yes. Add an image layer bound to a logo or headshot URL variable for each testimonial.'
			},
			{
				q: 'Can I include star ratings?',
				a: 'Yes. Use a rating variable and render stars as Unicode characters, SVG icons, or image layers in your template.'
			},
			{
				q: 'How do I automate from G2 or Trustpilot?',
				a: 'Export reviews as CSV or use their API to fetch new reviews, then call Pictify to generate a card for each one.'
			}
		],
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
		painPoints: [
			'Design workload for every event',
			'Inconsistent templates',
			'Slow turnaround for campaigns'
		],
		workflow: [
			{ title: 'Create promo template', detail: 'Design a layout for title/date/speaker/CTA.' },
			{ title: 'Render per event', detail: 'Generate a banner for each webinar automatically.' },
			{ title: 'Batch for series', detail: 'Render an entire series in one batch job.' }
		],
		faqs: [
			{ q: 'Can I add speaker photos?', a: 'Yes. Bind image URLs for headshots in the template.' }
		],
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
			{
				title: 'Design ticket template',
				detail: 'Create a layout with event and attendee variables.'
			},
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
		painPoints: [
			'Manual design per role',
			'Brand inconsistency',
			'Slow updates when details change'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create a job card layout once.' },
			{ title: 'Render from ATS', detail: 'Use role/team/location variables to generate images.' },
			{
				title: 'Batch distribute',
				detail: 'Generate all openings weekly and share across channels.'
			}
		],
		faqs: [
			{
				q: 'Can I include salary ranges?',
				a: 'Yes. Add variables like {{salaryMin}}–{{salaryMax}}.'
			}
		],
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
			{
				title: 'Render on changes',
				detail: 'Generate a new banner whenever status or rollout changes.'
			},
			{ title: 'Publish', detail: 'Use image URLs across docs and internal channels.' }
		],
		faqs: [
			{
				q: 'Can I show environments (prod/staging)?',
				a: 'Yes. Add variables and conditional blocks for each environment.'
			}
		],
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
			{
				title: 'Design cover template',
				detail: 'Create a cover layout with title and period variables.'
			},
			{ title: 'Render from reporting job', detail: 'Generate covers when reports are produced.' },
			{ title: 'Batch variants', detail: 'Render per team, region, or audience.' }
		],
		faqs: [
			{
				q: 'Can I use this as a PDF cover?',
				a: 'Yes. Use the image as a first page cover or embed it in your PDF flow.'
			}
		],
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
			{
				title: 'Create roadmap template',
				detail: 'Design a card for quarter/theme and top items.'
			},
			{ title: 'Render from planning data', detail: 'Pull key items and render via API.' },
			{ title: 'Distribute', detail: 'Use the image URL in docs, email, and exec updates.' }
		],
		faqs: [
			{
				q: 'Can I include lanes (now/next/later)?',
				a: 'Yes. Create a 3-column layout and bind variables for each lane.'
			}
		],
		related: ['status-update', 'kpi-card']
	},
	'youtube-thumbnail': {
		label: 'YouTube Thumbnail Generator',
		description: 'Create eye-catching YouTube thumbnails that drive clicks and views.',
		seoKeywords: [
			'youtube thumbnail generator',
			'youtube thumbnail maker',
			'video thumbnail creator',
			'youtube thumbnail template',
			'custom youtube thumbnails',
			'youtube thumbnail design',
			'video thumbnail generator',
			'youtube thumbnail size',
			'thumbnail maker online',
			'youtube thumbnail creator free'
		],
		longDescription: `YouTube thumbnails are the most important factor in click-through rates. A compelling thumbnail
			can dramatically increase views and subscriber growth. With Pictify's YouTube thumbnail generator, you create
			branded templates with dynamic text overlays, speaker photos, and attention-grabbing elements. Generate
			thumbnails programmatically for video series, or create one-off designs with consistent branding.
			The optimal 1280x720 resolution ensures crisp display across all devices.`,
		useCaseScenarios: [
			'YouTubers creating consistent thumbnails for video series',
			'Agencies managing thumbnails for multiple creator clients',
			'Course creators generating thumbnails for lesson libraries',
			'Podcasters creating video podcast thumbnails',
			'Gaming channels producing highlight reel thumbnails',
			'Educational channels standardizing tutorial thumbnails'
		],
		recommendedFormats: ['png', 'jpg', 'webp'],
		recommendedSizes: ['1280x720', '1920x1080'],
		templateHtml: simpleCardTemplate({
			title: '{{videoTitle}}',
			subtitle: '{{channelName}} · {{category}}',
			badge: 'NEW VIDEO',
			accent: '#ff0000',
			background: '#1a1a2e'
		}),
		benefits: [
			'Maintain consistent branding across all videos',
			'Generate thumbnails at scale for content libraries',
			'A/B test different thumbnail styles via API'
		],
		steps: [
			'Design your thumbnail template with title and image variables',
			'Choose 1280x720 for standard YouTube thumbnail size',
			'Bind video title, speaker image, and category',
			'Generate and upload directly to YouTube'
		],
		overview: [
			"YouTube thumbnails are your video's first impression. Great thumbnails combine bold text, expressive faces, and high contrast colors.",
			'Pictify lets you templatize winning thumbnail designs and generate variations programmatically for entire video libraries.'
		],
		painPoints: [
			'Inconsistent thumbnails hurt channel branding',
			'Manual design for every video is time-consuming',
			'Difficult to A/B test thumbnail styles'
		],
		workflow: [
			{
				title: 'Create template',
				detail: 'Design a thumbnail with text overlay and image placeholders.'
			},
			{ title: 'Bind variables', detail: 'Connect title, category, and speaker image fields.' },
			{ title: 'Generate at scale', detail: 'Render thumbnails for entire playlist via API.' }
		],
		faqs: [
			{
				q: "What's the best YouTube thumbnail size?",
				a: '1280x720 pixels (16:9 aspect ratio) is the YouTube standard. We recommend this or 1920x1080 for higher resolution.'
			},
			{
				q: 'Can I add speaker photos?',
				a: 'Yes. Bind an image URL variable for dynamic speaker headshots in your template.'
			}
		],
		related: ['podcast-cover', 'blog-featured-image']
	},
	'linkedin-banner': {
		label: 'LinkedIn Banner Generator',
		description:
			'Create professional LinkedIn banners and cover images for profiles and company pages.',
		seoKeywords: [
			'linkedin banner generator',
			'linkedin cover image maker',
			'linkedin background image',
			'linkedin header image',
			'linkedin banner size',
			'linkedin cover photo generator',
			'professional linkedin banner',
			'linkedin profile banner',
			'company page banner linkedin',
			'linkedin banner template'
		],
		longDescription: `Your LinkedIn banner is prime real estate for personal branding. A well-designed banner
			communicates your value proposition, showcases achievements, or promotes your latest work. With Pictify's
			LinkedIn banner generator, create professional banners at the optimal 1584x396 size for personal profiles
			or 1128x191 for company pages. Generate banners dynamically for team members, event promotions, or
			seasonal campaigns.`,
		useCaseScenarios: [
			'Professionals updating banners for new roles or achievements',
			'Companies creating consistent banners for all employees',
			'Recruiters promoting open positions in banners',
			'Speakers promoting upcoming conference talks',
			'Authors promoting book launches',
			'Consultants showcasing service offerings'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1584x396', '1128x191', '1200x628'],
		templateHtml: simpleCardTemplate({
			title: '{{headline}}',
			subtitle: '{{tagline}} · {{cta}}',
			badge: 'LINKEDIN',
			accent: '#0077b5',
			background: '#f3f6f8'
		}),
		benefits: [
			'Consistent branding across team LinkedIn profiles',
			'Quick updates for promotions or campaigns',
			'Professional appearance without design skills'
		],
		steps: [
			'Design your banner template with headline and visual elements',
			'Use 1584x396 for personal profiles, 1128x191 for company pages',
			'Add variables for headline, tagline, and optional photo',
			'Generate and upload to LinkedIn'
		],
		overview: [
			"LinkedIn banners are often overlooked, but they're visible on every profile visit.",
			'Create templates for team-wide consistency or personal branding that updates dynamically.'
		],
		painPoints: [
			'Generic default banners hurt credibility',
			'Design tools are overkill for simple banners',
			'Keeping team banners consistent is manual'
		],
		workflow: [
			{ title: 'Choose template', detail: 'Select personal or company page dimensions.' },
			{ title: 'Add branding', detail: 'Include logo, colors, and key messaging.' },
			{ title: 'Generate variants', detail: 'Create banners for team or campaigns via API.' }
		],
		faqs: [
			{
				q: 'What size for LinkedIn personal profile?',
				a: '1584x396 pixels is the recommended size for personal profile banners.'
			},
			{ q: 'What about company pages?', a: 'Company page cover images should be 1128x191 pixels.' }
		],
		related: ['twitter-header', 'email-header']
	},
	'podcast-cover': {
		label: 'Podcast Cover Art Generator',
		description: 'Generate podcast cover art and episode artwork that stands out in directories.',
		seoKeywords: [
			'podcast cover generator',
			'podcast artwork maker',
			'podcast cover art',
			'podcast thumbnail generator',
			'podcast episode art',
			'podcast logo maker',
			'spotify podcast cover',
			'apple podcast artwork',
			'podcast image generator',
			'podcast cover template'
		],
		longDescription: `Podcast cover art is crucial for discoverability in Apple Podcasts, Spotify, and other directories.
			Your cover is the first thing potential listeners see. With Pictify's podcast cover generator, create
			show artwork at the required 3000x3000 size or episode-specific images at 1400x1400. Generate consistent
			episode artwork featuring guest names, episode numbers, and titles automatically from your podcast CMS.`,
		useCaseScenarios: [
			'Podcasters creating main show artwork',
			'Networks generating episode art for multiple shows',
			'Interview podcasts featuring guest photos on artwork',
			'Educational podcasts numbering episode artwork',
			'Podcast agencies managing multiple client shows',
			'Video podcasters creating YouTube thumbnail variants'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['3000x3000', '1400x1400', '1080x1080'],
		templateHtml: simpleCardTemplate({
			title: '{{showName}}',
			subtitle: 'Ep. {{episodeNumber}} · {{episodeTitle}}',
			badge: 'PODCAST',
			accent: '#9b59b6',
			background: '#2c3e50'
		}),
		benefits: [
			'Meet directory requirements (3000x3000 for Apple Podcasts)',
			'Generate episode artwork automatically from RSS',
			'Consistent branding across all episodes'
		],
		steps: [
			'Design show artwork template at 3000x3000',
			'Create episode variant with guest/title variables',
			'Connect to podcast CMS for automated generation',
			'Export and upload to hosting platform'
		],
		overview: [
			'Podcast directories are visual-first. Great cover art increases discoverability and downloads.',
			'Automate episode artwork generation so every release has polished, on-brand visuals.'
		],
		painPoints: [
			'Manual artwork for each episode is tedious',
			'Inconsistent episode art hurts brand recognition',
			'Meeting directory size requirements'
		],
		workflow: [
			{
				title: 'Design show template',
				detail: 'Create main artwork at 3000x3000 for directories.'
			},
			{
				title: 'Create episode variant',
				detail: 'Add variables for episode number, title, guest.'
			},
			{ title: 'Automate via RSS', detail: 'Generate artwork when new episodes publish.' }
		],
		faqs: [
			{
				q: 'What size for Apple Podcasts?',
				a: '3000x3000 pixels is required for Apple Podcasts. Spotify accepts 1400x1400 minimum.'
			},
			{
				q: 'Can I add guest photos?',
				a: 'Yes. Bind a guest image URL variable to include headshots on episode artwork.'
			}
		],
		related: ['youtube-thumbnail', 'instagram-story']
	},
	'twitter-header': {
		label: 'Twitter/X Header Generator',
		description: 'Create engaging Twitter (X) header images for profiles and campaigns.',
		seoKeywords: [
			'twitter header generator',
			'twitter banner maker',
			'x header image',
			'twitter cover photo',
			'twitter header size',
			'twitter banner template',
			'x profile header',
			'twitter header image maker',
			'twitter cover image generator',
			'twitter banner design'
		],
		longDescription: `Your Twitter/X header is a key branding element that visitors see when they visit your profile.
			With Pictify's header generator, create headers at the optimal 1500x500 size that communicate your brand,
			promote launches, or highlight achievements. Generate campaign-specific headers or seasonal updates
			programmatically.`,
		useCaseScenarios: [
			'Brands updating headers for product launches',
			'Creators promoting new content or courses',
			'Companies maintaining consistent team headers',
			'Event organizers promoting upcoming conferences',
			'Authors promoting book releases',
			'Startups showcasing funding announcements'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1500x500', '1200x400'],
		templateHtml: simpleCardTemplate({
			title: '{{headline}}',
			subtitle: '{{subheadline}} · {{cta}}',
			badge: 'TWITTER/X',
			accent: '#1da1f2',
			background: '#15202b'
		}),
		benefits: [
			'Quick header updates for campaigns',
			'Consistent branding across team accounts',
			'Seasonal or event-based header variations'
		],
		steps: [
			'Design header template at 1500x500',
			'Add headline and visual elements',
			'Generate campaign variants via API',
			'Upload directly to Twitter/X'
		],
		overview: [
			'Twitter headers are prime real estate for promotions and branding.',
			'Create templates that update easily for launches, events, or seasonal campaigns.'
		],
		painPoints: [
			'Headers often outdated or generic',
			'Manual updates for each campaign',
			'Keeping team headers consistent'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create header with headline and visual elements.' },
			{ title: 'Add campaign variables', detail: 'Bind launch name, date, or promotional text.' },
			{ title: 'Generate and update', detail: 'Refresh headers automatically for campaigns.' }
		],
		faqs: [
			{
				q: "What's the Twitter header size?",
				a: '1500x500 pixels is the recommended Twitter/X header size.'
			},
			{
				q: 'How do I avoid the profile photo overlap?',
				a: 'Keep important content away from the bottom-left corner where the profile photo appears on desktop.'
			}
		],
		related: ['linkedin-banner', 'email-header']
	},
	'instagram-story': {
		label: 'Instagram Story Generator',
		description: 'Create Instagram Stories and Reels cover images at the perfect 1080x1920 size.',
		seoKeywords: [
			'instagram story generator',
			'instagram story maker',
			'instagram story template',
			'ig story generator',
			'instagram story size',
			'reels cover generator',
			'instagram story creator',
			'story image maker',
			'instagram 1080x1920',
			'vertical story generator'
		],
		longDescription: `Instagram Stories are a key engagement channel with 500M+ daily users. Creating polished story
			content requires the right dimensions (1080x1920) and engaging design. With Pictify's Instagram Story
			generator, create branded story templates for announcements, quotes, promotions, or event coverage.
			Generate stories programmatically for content calendars or live events.`,
		useCaseScenarios: [
			'Brands creating story templates for social teams',
			'Influencers producing quote or tip series',
			'E-commerce promoting flash sales and new arrivals',
			'Event coverage with branded story templates',
			'Coaches sharing daily motivation content',
			'Restaurants showcasing menu items or specials'
		],
		recommendedFormats: ['png', 'jpg', 'webp'],
		recommendedSizes: ['1080x1920', '1080x1350'],
		templateHtml: simpleCardTemplate({
			title: '{{headline}}',
			subtitle: '{{caption}}',
			badge: 'STORY',
			accent: '#e1306c',
			background: 'linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d)'
		}),
		benefits: [
			'Perfect 1080x1920 vertical format every time',
			'Consistent branding across story content',
			'Batch generation for content calendars'
		],
		steps: [
			'Design story template at 1080x1920',
			'Add headline, image, and branding elements',
			'Generate stories for weekly content batch',
			'Download and schedule in your social tool'
		],
		overview: [
			'Stories are ephemeral but high-impact. Consistent, branded stories build recognition.',
			'Create templates that your social team can generate quickly for any campaign or moment.'
		],
		painPoints: [
			'Stories need to be vertical (not square)',
			'Manual design for each story is slow',
			'Maintaining brand consistency across stories'
		],
		workflow: [
			{ title: 'Create template', detail: 'Design vertical 1080x1920 story layout.' },
			{ title: 'Define variables', detail: 'Add headline, image, and date placeholders.' },
			{ title: 'Batch generate', detail: "Create week's worth of stories in one API call." }
		],
		faqs: [
			{
				q: "What's the Instagram Story size?",
				a: '1080x1920 pixels (9:16 aspect ratio) is the standard Instagram Story size.'
			},
			{
				q: 'Can I use this for Reels covers?',
				a: 'Yes. Reels cover images use the same 1080x1920 vertical format.'
			}
		],
		related: ['podcast-cover', 'youtube-thumbnail']
	},
	'email-header': {
		label: 'Email Header Generator',
		description: 'Create branded email headers and banners for newsletters and campaigns.',
		seoKeywords: [
			'email header generator',
			'email banner maker',
			'newsletter header image',
			'email header template',
			'email banner design',
			'newsletter banner generator',
			'email marketing images',
			'email header size',
			'campaign header image',
			'email banner creator'
		],
		longDescription: `Email headers set the tone for your newsletters and campaigns. A well-designed header
			improves open rates and brand recognition. With Pictify's email header generator, create headers at
			optimal widths (600px for most email clients) with consistent branding. Generate campaign-specific
			headers or personalized headers with subscriber data.`,
		useCaseScenarios: [
			'Marketing teams creating consistent newsletter headers',
			'E-commerce brands promoting seasonal campaigns',
			'SaaS companies announcing product updates',
			'Publishers creating issue-specific newsletter headers',
			'Event organizers promoting registrations',
			'Non-profits creating campaign appeal headers'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['600x200', '600x300', '1200x400'],
		templateHtml: simpleCardTemplate({
			title: '{{headline}}',
			subtitle: '{{edition}} · {{date}}',
			badge: 'NEWSLETTER',
			accent: '#6366f1',
			background: '#f5f3ff'
		}),
		benefits: [
			'Consistent headers across all email campaigns',
			'Personalized headers with subscriber data',
			'Campaign-specific variants without design work'
		],
		steps: [
			'Design header template at 600px width',
			'Add campaign headline and date variables',
			'Generate headers for each send',
			'Embed in email template'
		],
		overview: [
			'Email headers are seen by every subscriber. Consistent, on-brand headers build recognition.',
			'Generate campaign-specific headers automatically to save design time.'
		],
		painPoints: [
			'Email-safe image constraints',
			'Manual header design for each campaign',
			'Inconsistent branding across sends'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create header at 600px width for email clients.' },
			{ title: 'Add variables', detail: 'Bind headline, date, and campaign name.' },
			{ title: 'Generate per campaign', detail: 'Create new headers for each send automatically.' }
		],
		faqs: [
			{
				q: 'What width for email headers?',
				a: '600px is the safe width for most email clients. Use 2x (1200px) for retina displays.'
			},
			{
				q: 'Can I personalize headers?',
				a: 'Yes. Bind subscriber data like name or company for personalized headers.'
			}
		],
		related: ['linkedin-banner', 'twitter-header']
	},
	'blog-featured-image': {
		label: 'Blog Featured Image Generator',
		description: 'Generate consistent blog featured images and post thumbnails at scale.',
		seoKeywords: [
			'blog featured image generator',
			'blog thumbnail maker',
			'blog post image generator',
			'featured image creator',
			'blog header image',
			'article thumbnail generator',
			'blog image template',
			'post featured image',
			'blog cover image maker',
			'content featured image'
		],
		longDescription: `Blog featured images drive clicks from social shares and search results. Consistent,
			branded featured images improve CTR and establish visual identity. With Pictify's blog featured image
			generator, create templates that render automatically when you publish. Bind post titles, categories,
			and author photos to generate unique images for every article.`,
		useCaseScenarios: [
			'Content teams generating images for publishing workflows',
			'SEO teams creating optimized featured images',
			'Guest bloggers receiving branded images automatically',
			'News sites generating article thumbnails',
			'Documentation sites creating guide images',
			'Developer blogs featuring code-focused thumbnails'
		],
		recommendedFormats: ['png', 'jpg', 'webp'],
		recommendedSizes: ['1200x630', '1200x675', '1600x900'],
		templateHtml: simpleCardTemplate({
			title: '{{postTitle}}',
			subtitle: '{{category}} · {{author}} · {{readTime}} min read',
			badge: 'BLOG',
			accent: '#10b981',
			background: '#ecfdf5'
		}),
		benefits: [
			'Consistent featured images across all posts',
			'Automated generation on publish',
			'SEO-optimized image sizes'
		],
		steps: [
			'Design featured image template at 1200x630',
			'Bind post title, category, and author',
			'Connect to CMS webhook for auto-generation',
			'Images created automatically on publish'
		],
		overview: [
			'Featured images appear in social shares, RSS readers, and search results.',
			'Automate generation so every post has a polished, on-brand image without manual work.'
		],
		painPoints: [
			'Manual image creation for every post',
			'Inconsistent styling hurts brand',
			'Time pressure on publish deadlines'
		],
		workflow: [
			{
				title: 'Create template',
				detail: 'Design featured image with title and metadata variables.'
			},
			{ title: 'Connect CMS', detail: 'Use webhooks to trigger generation on publish.' },
			{ title: 'Auto-generate', detail: 'Images created and attached automatically.' }
		],
		faqs: [
			{
				q: 'What size for blog featured images?',
				a: '1200x630 (OG image standard) works for social sharing. 1200x675 is common for blog grids.'
			},
			{
				q: 'Can I include author photos?',
				a: 'Yes. Bind an author image URL for automatic headshot inclusion.'
			}
		],
		related: ['og-image', 'youtube-thumbnail']
	},
	'course-certificate': {
		label: 'Course Certificate Generator',
		description: 'Generate branded course completion certificates and credentials.',
		seoKeywords: [
			'course certificate generator',
			'certificate maker',
			'training certificate generator',
			'completion certificate template',
			'online course certificate',
			'certificate of completion generator',
			'digital certificate maker',
			'certification generator',
			'e-learning certificate',
			'course completion certificate'
		],
		longDescription: `Course certificates validate learning achievements and drive completion rates. With Pictify's
			certificate generator, create beautiful certificates that include learner names, course titles, completion
			dates, and instructor signatures. Generate certificates automatically when learners complete courses,
			integrating with your LMS via API.`,
		useCaseScenarios: [
			'Online course platforms issuing completion certificates',
			'Corporate training programs certifying employees',
			'Bootcamps providing graduation credentials',
			'Professional development courses offering certificates',
			'Workshop organizers providing attendee certificates',
			'Certification programs issuing digital credentials'
		],
		recommendedFormats: ['png', 'pdf', 'jpg'],
		recommendedSizes: ['1920x1080', '2480x3508', '1600x1200'],
		templateHtml: simpleCardTemplate({
			title: 'Certificate of Completion',
			subtitle: '{{learnerName}} · {{courseName}} · {{date}}',
			badge: 'CERTIFICATE',
			accent: '#f59e0b',
			background: '#fffbeb'
		}),
		benefits: [
			'Automated certificate generation on completion',
			'Branded certificates increase perceived value',
			'Shareable credentials boost course marketing'
		],
		steps: [
			'Design certificate template with learner variables',
			'Include course name, completion date, instructor',
			'Connect to LMS for automated generation',
			'Deliver via email or learner dashboard'
		],
		overview: [
			'Certificates motivate learners and provide shareable proof of achievement.',
			'Automate certificate generation so every completion triggers instant delivery.'
		],
		painPoints: [
			"Manual certificate creation doesn't scale",
			'Inconsistent certificate designs',
			'Delayed delivery after completion'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create certificate with learner and course variables.' },
			{ title: 'Connect LMS', detail: 'Trigger generation on course completion via webhook.' },
			{ title: 'Auto-deliver', detail: 'Email certificate immediately upon completion.' }
		],
		faqs: [
			{
				q: 'Can I add signatures?',
				a: 'Yes. Include instructor signature images or bind signature URL variables.'
			},
			{
				q: 'What about unique certificate IDs?',
				a: 'Bind a unique ID variable for verification purposes.'
			}
		],
		related: ['certificate', 'event-ticket']
	},
	'membership-card': {
		label: 'Membership Card Generator',
		description: 'Create digital membership cards and loyalty program credentials.',
		seoKeywords: [
			'membership card generator',
			'digital membership card',
			'member card maker',
			'loyalty card generator',
			'membership card template',
			'digital member ID',
			'membership credential generator',
			'club membership card',
			'gym membership card',
			'association member card'
		],
		longDescription: `Digital membership cards provide instant credential delivery and easy verification.
			With Pictify's membership card generator, create branded cards featuring member names, IDs, photos,
			and expiration dates. Generate cards automatically when members join or renew, and include QR codes
			for easy verification.`,
		useCaseScenarios: [
			'Gyms and fitness clubs issuing member cards',
			'Professional associations providing member credentials',
			'Clubs and organizations delivering membership proof',
			'Loyalty programs creating tiered member cards',
			'Coworking spaces issuing access credentials',
			'Alumni associations providing graduate cards'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1050x600', '1080x1080', '1200x630'],
		templateHtml: simpleCardTemplate({
			title: '{{memberName}}',
			subtitle: 'Member ID: {{memberId}} · Valid: {{expiry}}',
			badge: 'MEMBER',
			accent: '#8b5cf6',
			background: '#f5f3ff'
		}),
		benefits: [
			'Instant digital card delivery',
			'Automated renewal card generation',
			'Easy verification with QR codes'
		],
		steps: [
			'Design card template with member variables',
			'Include name, ID, photo, and expiration',
			'Add QR code for verification',
			'Generate on signup or renewal'
		],
		overview: [
			'Digital membership cards eliminate physical card costs and enable instant delivery.',
			'Generate cards automatically when members join, upgrade, or renew.'
		],
		painPoints: [
			'Physical cards are expensive and slow',
			"Manual card creation doesn't scale",
			'Hard to update expiration dates'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create card layout with member variables.' },
			{ title: 'Add QR code', detail: 'Include verification QR with member ID.' },
			{ title: 'Auto-generate', detail: 'Create cards on signup via membership system webhook.' }
		],
		faqs: [
			{ q: 'Can I add member photos?', a: 'Yes. Bind a photo URL variable for member headshots.' },
			{
				q: 'What about tiered memberships?',
				a: 'Create template variants for each tier with different colors or badges.'
			}
		],
		related: ['event-ticket', 'course-certificate']
	},
	'event-invitation': {
		label: 'Event Invitation Generator',
		description: 'Create beautiful digital event invitations for any occasion.',
		seoKeywords: [
			'event invitation generator',
			'digital invitation maker',
			'party invitation generator',
			'wedding invitation maker',
			'event invite template',
			'online invitation creator',
			'digital invite maker',
			'event invitation template',
			'invitation card generator',
			'custom invitation maker'
		],
		longDescription: `Digital event invitations are eco-friendly, instant to deliver, and easy to personalize.
			With Pictify's event invitation generator, create beautiful invitations featuring event details, RSVP
			information, and personalized guest names. Generate unique invitations for each guest or create generic
			versions for social sharing.`,
		useCaseScenarios: [
			'Wedding planners creating save-the-dates and invitations',
			'Corporate event teams sending branded invites',
			'Birthday party hosts creating custom invitations',
			'Conference organizers inviting speakers and sponsors',
			'Non-profits creating gala invitations',
			'Schools sending graduation ceremony invites'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1080x1080', '1080x1350', '1200x630'],
		templateHtml: simpleCardTemplate({
			title: "You're Invited!",
			subtitle: '{{eventName}} · {{date}} · {{venue}}',
			badge: 'INVITATION',
			accent: '#ec4899',
			background: '#fdf2f8'
		}),
		benefits: [
			'Instant digital delivery via email or message',
			'Personalized invitations at scale',
			'Easy updates if event details change'
		],
		steps: [
			'Design invitation template with event details',
			'Add guest name personalization',
			'Include RSVP link or QR code',
			'Generate and send to guest list'
		],
		overview: [
			'Digital invitations are instant, personalized, and environmentally friendly.',
			'Generate unique invitations for each guest or create shareable versions for social media.'
		],
		painPoints: [
			'Physical invitations are expensive',
			'Manual personalization is tedious',
			'Hard to update details after sending'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create invitation with event and guest variables.' },
			{ title: 'Upload guest list', detail: 'Batch generate personalized invitations.' },
			{ title: 'Deliver digitally', detail: 'Send via email, SMS, or messaging apps.' }
		],
		faqs: [
			{
				q: 'Can I add RSVP buttons?',
				a: 'Add QR codes or link text that guests can follow to RSVP.'
			},
			{
				q: 'What about plus-one invitations?',
				a: 'Include variables for guest count or additional names.'
			}
		],
		related: ['event-ticket', 'webinar-promo']
	},
	'discount-coupon': {
		label: 'Discount Coupon Generator',
		description: 'Create eye-catching discount coupons and promotional codes.',
		seoKeywords: [
			'discount coupon generator',
			'coupon maker',
			'promo code image',
			'discount code generator',
			'coupon template',
			'promotional coupon maker',
			'digital coupon generator',
			'sale coupon creator',
			'discount voucher maker',
			'coupon image generator'
		],
		longDescription: `Discount coupons drive conversions when they\'re visually appealing and easy to share.
			With Pictify\'s coupon generator, create branded discount images featuring promo codes, expiration dates,
			and terms. Generate unique coupon images for different campaigns, channels, or customer segments.`,
		useCaseScenarios: [
			'E-commerce stores promoting flash sales',
			'Restaurants sharing meal deals on social',
			'SaaS companies offering trial extensions',
			'Retailers creating seasonal promotion graphics',
			'Subscription services offering discount codes',
			'Service businesses promoting first-time offers'
		],
		recommendedFormats: ['png', 'jpg', 'webp'],
		recommendedSizes: ['1200x630', '1080x1080', '600x600'],
		templateHtml: simpleCardTemplate({
			title: '{{discount}}% OFF',
			subtitle: 'Code: {{code}} · Expires: {{expiry}}',
			badge: 'COUPON',
			accent: '#ef4444',
			background: '#fef2f2'
		}),
		benefits: [
			'Eye-catching coupon graphics boost redemption',
			'Unique codes for tracking campaign performance',
			'Quick generation for flash sales'
		],
		steps: [
			'Design coupon template with discount variables',
			'Include promo code and expiration',
			'Generate variants for different channels',
			'Share on social, email, or ads'
		],
		overview: [
			'Visual coupons are more shareable than text-only promo codes.',
			'Generate campaign-specific coupon graphics with unique codes for tracking.'
		],
		painPoints: [
			"Plain text codes aren't engaging",
			'Manual coupon design for each campaign',
			'Tracking redemption by channel is hard'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create coupon with discount and code variables.' },
			{ title: 'Generate variants', detail: 'Create channel-specific coupons with unique codes.' },
			{ title: 'Track performance', detail: 'Monitor redemption by coupon code.' }
		],
		faqs: [
			{
				q: 'Can I create unique codes per image?',
				a: 'Yes. Bind a unique code variable for each generated coupon.'
			},
			{
				q: 'What about QR codes?',
				a: 'Add a QR code layer linking to the checkout with code applied.'
			}
		],
		related: ['product-banner', 'testimonial']
	},
	'portfolio-card': {
		label: 'Portfolio Card Generator',
		description: 'Create portfolio project cards for showcasing creative work.',
		seoKeywords: [
			'portfolio card generator',
			'project card maker',
			'portfolio showcase image',
			'work portfolio generator',
			'project thumbnail maker',
			'portfolio image template',
			'creative portfolio card',
			'design portfolio generator',
			'project showcase card',
			'portfolio grid image'
		],
		longDescription: `Portfolio cards showcase your best work in a consistent, professional format.
			With Pictify\'s portfolio card generator, create project cards featuring screenshots, titles,
			client names, and descriptions. Generate cards for all projects automatically or update
			them when case studies are published.`,
		useCaseScenarios: [
			'Designers showcasing project work',
			'Agencies displaying client projects',
			'Developers featuring code projects',
			'Photographers presenting portfolio pieces',
			'Architects displaying building projects',
			'Freelancers updating portfolio galleries'
		],
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1080x1080', '1600x900'],
		templateHtml: simpleCardTemplate({
			title: '{{projectName}}',
			subtitle: '{{client}} · {{category}} · {{year}}',
			badge: 'PROJECT',
			accent: '#14b8a6',
			background: '#f0fdfa'
		}),
		benefits: [
			'Consistent project cards across portfolio',
			'Quick updates when projects complete',
			'Easy sharing on social media'
		],
		steps: [
			'Design project card template',
			'Include screenshot, title, client, and description',
			'Generate cards for each portfolio piece',
			'Update automatically when new projects launch'
		],
		overview: [
			'Portfolio cards create a professional, consistent presentation of your work.',
			'Generate project cards automatically as you complete work.'
		],
		painPoints: [
			'Inconsistent portfolio presentation',
			'Manual card creation for each project',
			'Outdated portfolio images'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create project card with screenshot and details.' },
			{ title: 'Generate per project', detail: 'Create cards for each portfolio piece.' },
			{ title: 'Auto-update', detail: 'Refresh cards when project details change.' }
		],
		faqs: [
			{
				q: 'Can I include project screenshots?',
				a: 'Yes. Bind a screenshot URL variable for each project.'
			},
			{
				q: 'What about video projects?',
				a: 'Use a video thumbnail or frame capture as the project image.'
			}
		],
		related: ['testimonial', 'blog-featured-image']
	},
	'resume-snapshot': {
		label: 'Resume Snapshot Generator',
		description: 'Create visual resume summaries and profile snapshots.',
		seoKeywords: [
			'resume snapshot generator',
			'visual resume maker',
			'resume image generator',
			'cv snapshot creator',
			'resume summary image',
			'profile snapshot generator',
			'resume card maker',
			'visual cv generator',
			'resume infographic maker',
			'career snapshot image'
		],
		longDescription: `Resume snapshots provide quick visual summaries of professional profiles.
			With Pictify\'s resume snapshot generator, create visual resume cards featuring key
			skills, experience highlights, and contact information. Perfect for sharing on LinkedIn,
			portfolios, or email signatures.`,
		useCaseScenarios: [
			'Job seekers creating shareable profile cards',
			'Recruiters showcasing candidate summaries',
			'Speakers providing bio snapshots',
			'Consultants sharing professional summaries',
			'Freelancers updating portfolio profiles',
			'Students creating internship applications'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1200x630', '1080x1080', '1200x1500'],
		templateHtml: simpleCardTemplate({
			title: '{{name}}',
			subtitle: '{{title}} · {{skills}} · {{location}}',
			badge: 'PROFILE',
			accent: '#3b82f6',
			background: '#eff6ff'
		}),
		benefits: [
			'Quick visual introduction',
			'Easy sharing across platforms',
			'Consistent personal branding'
		],
		steps: [
			'Design profile snapshot template',
			'Include name, title, skills, and photo',
			'Generate updated snapshot',
			'Share on LinkedIn or portfolio'
		],
		overview: [
			'Resume snapshots provide instant professional introductions.',
			'Create shareable profile cards that summarize your key qualifications.'
		],
		painPoints: [
			'Full resumes are too detailed for quick shares',
			'Manual image creation for profiles',
			'Keeping profile images updated'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create profile card with key professional details.' },
			{ title: 'Add photo', detail: 'Include headshot variable for personalization.' },
			{ title: 'Generate and share', detail: 'Update snapshot when profile changes.' }
		],
		faqs: [
			{
				q: 'Can I include a headshot?',
				a: 'Yes. Bind a photo URL variable for your profile image.'
			},
			{
				q: 'What about QR codes to full resume?',
				a: 'Add a QR code linking to your full resume or LinkedIn.'
			}
		],
		related: ['linkedin-banner', 'portfolio-card']
	},
	'menu-card': {
		label: 'Menu Card Generator',
		description: 'Create restaurant menu cards and daily specials graphics.',
		seoKeywords: [
			'menu card generator',
			'restaurant menu maker',
			'daily special image',
			'menu image generator',
			'food menu template',
			'digital menu maker',
			'specials board generator',
			'menu card template',
			'restaurant specials image',
			'cafe menu generator'
		],
		longDescription: `Menu cards and daily specials graphics drive orders and engagement.
			With Pictify\'s menu card generator, create appetizing menu images featuring dishes,
			prices, and descriptions. Generate daily specials automatically or update seasonal
			menus with ease.`,
		useCaseScenarios: [
			'Restaurants creating daily specials graphics',
			'Cafes showcasing seasonal menu items',
			'Food trucks updating social media menus',
			'Catering companies presenting package options',
			'Bars creating cocktail special cards',
			'Bakeries featuring daily fresh items'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1080x1080', '1080x1350', '1200x630'],
		templateHtml: simpleCardTemplate({
			title: '{{dishName}}',
			subtitle: '{{description}} · {{price}}',
			badge: 'SPECIAL',
			accent: '#f97316',
			background: '#fff7ed'
		}),
		benefits: [
			'Quick daily specials graphics',
			'Consistent menu branding',
			'Easy seasonal menu updates'
		],
		steps: [
			'Design menu card template',
			'Include dish name, photo, description, price',
			'Generate daily specials automatically',
			'Share on social or display in-store'
		],
		overview: [
			'Menu graphics drive orders when they showcase dishes appetizingly.',
			'Generate daily specials or seasonal menus automatically from your POS or menu system.'
		],
		painPoints: [
			'Manual specials graphics daily',
			'Inconsistent menu presentation',
			'Slow menu updates'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create menu card with dish details.' },
			{ title: 'Connect POS', detail: 'Pull specials from your menu system.' },
			{ title: 'Auto-generate', detail: 'Create daily specials graphics automatically.' }
		],
		faqs: [
			{ q: 'Can I include food photos?', a: 'Yes. Bind a dish photo URL for appetizing visuals.' },
			{ q: 'What about dietary labels?', a: 'Add variables for dietary icons (V, GF, etc.).' }
		],
		related: ['product-banner', 'discount-coupon']
	},
	'real-estate-flyer': {
		label: 'Real Estate Flyer Generator',
		description: 'Create property listing flyers and real estate marketing materials.',
		seoKeywords: [
			'real estate flyer generator',
			'property listing image',
			'real estate marketing',
			'property flyer maker',
			'listing flyer generator',
			'home for sale image',
			'real estate template',
			'property marketing generator',
			'realtor flyer maker',
			'house listing graphic'
		],
		longDescription: `Real estate flyers showcase properties and generate leads. With Pictify\'s
			real estate flyer generator, create property listings featuring photos, prices, features,
			and agent contact information. Generate flyers automatically from your MLS feed or
			property management system.`,
		useCaseScenarios: [
			'Realtors creating property listing flyers',
			'Agencies marketing new listings on social',
			'Property managers showcasing rentals',
			'Developers promoting new construction',
			'Brokerages creating agent listing cards',
			'Real estate teams featuring open houses'
		],
		recommendedFormats: ['png', 'jpg', 'pdf'],
		recommendedSizes: ['1080x1350', '1200x630', '2480x3508'],
		templateHtml: simpleCardTemplate({
			title: '{{price}}',
			subtitle: '{{address}} · {{beds}} bed · {{baths}} bath · {{sqft}} sqft',
			badge: 'FOR SALE',
			accent: '#22c55e',
			background: '#f0fdf4'
		}),
		benefits: [
			'Professional listing flyers instantly',
			'Automated generation from MLS data',
			'Consistent agent branding'
		],
		steps: [
			'Design listing flyer template',
			'Include property photo, price, features',
			'Connect to MLS or property system',
			'Generate flyers for new listings automatically'
		],
		overview: [
			'Property flyers are essential marketing materials for every listing.',
			'Automate flyer generation from your MLS or property management system.'
		],
		painPoints: [
			'Manual flyer creation per listing',
			'Inconsistent agent branding',
			'Slow time to market for new listings'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create flyer with property details and agent info.' },
			{ title: 'Connect MLS', detail: 'Pull listings automatically via API.' },
			{ title: 'Auto-generate', detail: 'Create flyers when new listings go live.' }
		],
		faqs: [
			{
				q: 'Can I include multiple photos?',
				a: 'Yes. Create a collage layout or multiple image variables.'
			},
			{ q: 'What about agent headshots?', a: 'Bind an agent photo URL for consistent branding.' }
		],
		related: ['product-banner', 'event-invitation']
	},
	'sports-score-card': {
		label: 'Sports Score Card Generator',
		description: 'Create live score cards and sports update graphics.',
		seoKeywords: [
			'sports score card generator',
			'score graphic maker',
			'live score image',
			'sports update card',
			'game score generator',
			'match score graphic',
			'sports results image',
			'score card template',
			'game update graphic',
			'sports score template'
		],
		longDescription: `Sports score cards deliver game updates in engaging visual format.
			With Pictify\'s score card generator, create branded score graphics featuring team logos,
			scores, and game details. Generate live score updates automatically from sports data APIs
			for real-time social media posting.`,
		useCaseScenarios: [
			'Sports media creating score updates',
			'Teams sharing game results',
			'Fantasy sports platforms displaying matchups',
			'Sports bars showing live scores',
			'School athletics posting game results',
			'Sports betting sites displaying outcomes'
		],
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1080x1080', '1920x1080'],
		templateHtml: simpleCardTemplate({
			title: '{{team1}} {{score1}} - {{score2}} {{team2}}',
			subtitle: '{{league}} · {{gameTime}} · {{status}}',
			badge: 'LIVE',
			accent: '#ef4444',
			background: '#1f2937'
		}),
		benefits: [
			'Real-time score graphics',
			'Consistent sports branding',
			'Automated updates from data feeds'
		],
		steps: [
			'Design score card template with team variables',
			'Include logos, scores, and game details',
			'Connect to sports data API',
			'Generate updates automatically during games'
		],
		overview: [
			'Score cards drive engagement during live events.',
			'Generate real-time score graphics automatically from sports data feeds.'
		],
		painPoints: [
			'Manual score updates are slow',
			'Inconsistent graphics hurt brand',
			'Hard to keep up with live games'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create score card with team and game variables.' },
			{ title: 'Connect data feed', detail: 'Pull live scores from sports API.' },
			{ title: 'Auto-post', detail: 'Generate and post score updates in real-time.' }
		],
		faqs: [
			{ q: 'Can I include team logos?', a: 'Yes. Bind logo URL variables for each team.' },
			{ q: 'What about live updates?', a: 'Use webhooks to trigger new images on score changes.' }
		],
		related: ['leaderboard', 'status-update']
	},
	'weather-widget': {
		label: 'Weather Widget Generator',
		description: 'Create weather forecast graphics and condition displays.',
		seoKeywords: [
			'weather widget generator',
			'weather graphic maker',
			'forecast image generator',
			'weather card creator',
			'weather display image',
			'forecast graphic maker',
			'weather widget template',
			'daily weather image',
			'weather update graphic',
			'forecast card generator'
		],
		longDescription: `Weather widgets provide instant visual forecasts for content and applications.
			With Pictify\'s weather widget generator, create weather graphics featuring temperature,
			conditions, and forecasts. Generate location-based weather images automatically from
			weather APIs for social media or digital displays.`,
		useCaseScenarios: [
			'Media outlets creating weather graphics',
			'Event venues showing local conditions',
			'Travel companies displaying destination weather',
			'Outdoor businesses posting daily conditions',
			'Digital signage showing weather updates',
			'Apps generating shareable weather images'
		],
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1080x1080', '600x600'],
		templateHtml: simpleCardTemplate({
			title: '{{temperature}}°',
			subtitle: '{{condition}} · {{location}} · {{date}}',
			badge: 'WEATHER',
			accent: '#0ea5e9',
			background: '#f0f9ff'
		}),
		benefits: [
			'Automated weather graphics',
			'Location-specific forecasts',
			'Consistent visual branding'
		],
		steps: [
			'Design weather widget template',
			'Include temperature, condition, location',
			'Connect to weather API',
			'Generate daily weather graphics automatically'
		],
		overview: [
			'Weather graphics are essential for media, events, and location-based content.',
			'Generate weather widgets automatically from weather data APIs.'
		],
		painPoints: [
			'Manual weather graphic updates',
			'Inconsistent forecast presentation',
			'Time-consuming daily updates'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create weather card with condition variables.' },
			{ title: 'Connect weather API', detail: 'Pull forecast data automatically.' },
			{ title: 'Schedule updates', detail: 'Generate new graphics daily or on schedule.' }
		],
		faqs: [
			{
				q: 'Can I include weather icons?',
				a: 'Yes. Use condition-based icon variables or include icon images.'
			},
			{ q: 'What about multi-day forecasts?', a: 'Create a template with multiple day sections.' }
		],
		related: ['status-update', 'kpi-card']
	},
	'stock-chart': {
		label: 'Stock Chart Generator',
		description: 'Create stock price charts and financial data visualizations.',
		seoKeywords: [
			'stock chart generator',
			'stock price image',
			'financial chart maker',
			'stock graphic generator',
			'market chart image',
			'stock visualization',
			'trading chart maker',
			'stock price graphic',
			'financial visualization',
			'market data image'
		],
		longDescription: `Stock charts communicate financial data visually. With Pictify\'s stock chart
			generator, create price charts featuring tickers, prices, changes, and trends. Generate
			market update graphics automatically from financial data APIs for newsletters, social
			media, or reporting.`,
		useCaseScenarios: [
			'Financial media creating market updates',
			'Investment newsletters featuring stock picks',
			'Trading platforms sharing market analysis',
			'Fintech apps generating portfolio summaries',
			'Business news outlets displaying market data',
			'Analysts sharing stock recommendations'
		],
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1200x630', '1080x1080', '1600x900'],
		templateHtml: simpleCardTemplate({
			title: '{{ticker}} · {{price}}',
			subtitle: '{{change}} ({{changePercent}}%) · {{date}}',
			badge: 'MARKET',
			accent: '#22c55e',
			background: '#0f172a'
		}),
		benefits: [
			'Automated market update graphics',
			'Consistent financial branding',
			'Real-time price visualizations'
		],
		steps: [
			'Design stock chart template',
			'Include ticker, price, change, trend',
			'Connect to financial data API',
			'Generate market updates automatically'
		],
		overview: [
			'Stock charts are essential for financial content and market communication.',
			'Generate stock graphics automatically from market data feeds.'
		],
		painPoints: [
			'Manual chart screenshots are tedious',
			'Inconsistent financial graphics',
			'Hard to keep prices current'
		],
		workflow: [
			{ title: 'Design template', detail: 'Create stock card with price and change variables.' },
			{ title: 'Connect market data', detail: 'Pull live prices from financial API.' },
			{ title: 'Auto-generate', detail: 'Create market updates on schedule or triggers.' }
		],
		faqs: [
			{
				q: 'Can I include sparkline charts?',
				a: 'Yes. Render mini chart images as variables or use SVG in the template.'
			},
			{
				q: 'What about cryptocurrency?',
				a: 'Same template works - just connect to crypto data APIs.'
			}
		],
		related: ['kpi-card', 'table']
	},
	infographic: {
		label: 'Infographic Generator',
		description: 'Create data-driven infographics and visual statistics that make complex information shareable.',
		seoKeywords: [
			'infographic generator',
			'infographic maker',
			'data visualization image',
			'statistics graphic maker',
			'infographic template',
			'visual data generator',
			'stats infographic maker',
			'information graphic creator',
			'data infographic tool',
			'infographic design generator'
		],
		longDescription: `Infographics transform complex data into shareable visual stories that get 3x more engagement
			than plain text posts. With Pictify's infographic generator, create data visualizations featuring statistics,
			comparisons, timelines, and key findings. Generate infographics automatically from data sources for reports,
			social media, and content marketing.

			Unlike traditional design tools where each infographic is a one-off project, Pictify lets you build
			reusable infographic templates with dynamic data bindings. When your quarterly metrics update, just
			re-render with fresh data — same beautiful layout, new numbers. Perfect for recurring reports, campaign
			summaries, and data journalism.`,
		useCaseScenarios: [
			'Marketing teams creating content infographics for social media',
			'Researchers visualizing study findings for publications',
			'HR teams sharing company statistics and survey results',
			'Sales teams presenting market data in proposals',
			'Educators creating visual learning materials'
		],
		features: [
			'Data-bound infographic templates with dynamic statistics',
			'Vertical (1080x1920) and horizontal (1200x630) layout support',
			'Icon and chart integration for visual storytelling',
			'Reusable templates that refresh when data updates',
			'Batch generation for report series and recurring publications',
			'Brand-consistent styling with custom fonts and color palettes'
		],
		recommendedFormats: ['png', 'webp'],
		recommendedSizes: ['1080x1920', '1200x630', '1080x1350'],
		templateHtml: simpleCardTemplate({
			title: '{{headline}}',
			subtitle: '{{stat1}} · {{stat2}} · {{stat3}}',
			badge: 'DATA',
			accent: '#8b5cf6',
			background: '#f5f3ff'
		}),
		overview: [
			'Infographics make data memorable and shareable. They consistently outperform text-only content on social media and drive backlinks for SEO.',
			'Create data-driven infographic templates that update automatically from your data sources — no redesign needed when the numbers change.'
		],
		painPoints: [
			'Manual infographic design is time-consuming and expensive',
			'Hard to keep data current across published infographics',
			'Inconsistent visual style when multiple designers contribute',
			'One-off designs cannot be reused for recurring reports'
		],
		workflow: [
			{
				title: 'Design template',
				detail: 'Create an infographic layout with data variables for headlines, statistics, and comparisons.'
			},
			{
				title: 'Connect data',
				detail: 'Pull statistics from your analytics platform, spreadsheet, or database via API.'
			},
			{
				title: 'Auto-generate',
				detail: 'Refresh infographics automatically when data updates — same template, fresh numbers.'
			}
		],
		faqs: [
			{
				q: 'Can I include charts and graphs?',
				a: 'Yes. Render charts as SVG in the template or include chart images as dynamic layers.'
			},
			{
				q: 'What about long vertical infographics?',
				a: 'Use 1080x1920 or even taller custom dimensions for detailed vertical infographics. Pictify supports up to 4000px height.'
			},
			{
				q: 'Can I update data without redesigning?',
				a: 'Yes. That is the core benefit — bind variables to your data source and re-render the same template whenever numbers change.'
			}
		],
		related: ['kpi-card', 'table']
	},
	'meme-generator': {
		label: 'Meme Generator',
		description: 'Create branded memes and viral content graphics.',
		seoKeywords: [
			'meme generator',
			'meme maker',
			'meme template generator',
			'custom meme creator',
			'branded meme maker',
			'meme image generator',
			'viral meme creator',
			'meme template maker',
			'social meme generator',
			'marketing meme maker'
		],
		longDescription: `Memes drive engagement and virality on social media. With Pictify\'s meme
			generator, create branded memes featuring popular formats, custom images, and dynamic text.
			Generate meme content at scale for social media calendars or respond quickly to trending
			moments with on-brand humor.`,
		useCaseScenarios: [
			'Social media teams creating branded meme content',
			'Brands capitalizing on trending moments',
			'Community managers engaging audiences',
			'Content creators producing shareable content',
			'Marketing teams adding humor to campaigns',
			'Internal comms teams creating fun team content'
		],
		recommendedFormats: ['png', 'jpg', 'webp'],
		recommendedSizes: ['1080x1080', '1200x630', '1080x1350'],
		templateHtml: simpleCardTemplate({
			title: '{{topText}}',
			subtitle: '{{bottomText}}',
			badge: 'MEME',
			accent: '#000000',
			background: '#ffffff'
		}),
		benefits: [
			'Quick meme creation for trending moments',
			'Branded meme content at scale',
			'Consistent visual style for memes'
		],
		steps: [
			'Design meme template with text variables',
			'Include background image and text overlays',
			'Generate memes for content calendar',
			'Respond quickly to trending topics'
		],
		overview: [
			'Memes are powerful engagement tools when done well.',
			'Create branded meme templates that your social team can generate quickly.'
		],
		painPoints: [
			'Generic meme tools lack branding',
			'Slow response to trending moments',
			'Inconsistent meme quality'
		],
		workflow: [
			{ title: 'Create templates', detail: 'Design branded meme layouts with text variables.' },
			{ title: 'Quick generation', detail: 'Generate memes in seconds with new text.' },
			{ title: 'Stay on trend', detail: 'Respond to moments with on-brand humor.' }
		],
		faqs: [
			{
				q: 'Can I use popular meme formats?',
				a: 'Yes. Create templates based on popular meme layouts with your branding.'
			},
			{
				q: 'What about animated memes?',
				a: 'Use GIF format for simple animations or multiple frame generation.'
			}
		],
		related: ['quote-card', 'instagram-story']
	},
	'responsive-image-generator': {
		label: 'Responsive Image Generator',
		description: 'Design one image template in the canvas editor, then auto-resize it to Instagram, Twitter, LinkedIn, YouTube, and 8+ platforms with one click. Free account to start.',
		seoKeywords: [
			'responsive image generator',
			'multi-size image generator',
			'social media image sizes',
			'one template multiple sizes',
			'image resize for social media',
			'multi-platform image creator',
			'auto resize image for social media',
			'social image size tool',
			'resize image all platforms',
			'AI image resizer'
		],
		longDescription: `Every social platform needs a different image size — Instagram wants 1080x1080, Twitter needs 1200x675,
			LinkedIn uses 1200x627, YouTube thumbnails are 1280x720. Designers spend hours duplicating and manually adjusting
			layouts for each platform. Pictify eliminates this entirely.\n\nOpen the canvas editor, design your template once
			with drag-and-drop elements and dynamic variables, then hit "Generate All Sizes." Our AI analyzes your layout and
			intelligently repositions elements — text stays readable, images stay proportional, hierarchy is maintained — for
			every platform automatically. Each size is saved as a layout tab you can fine-tune. When you're happy, your template
			serves every platform size through a single API endpoint.\n\nThis is not a basic crop-and-stretch resizer. The AI
			understands your design intent: if horizontal space shrinks, elements stack vertically. If text would become too small,
			font sizes adjust. Element IDs are preserved so your variable bindings work across every layout. One set of data,
			every platform, pixel-perfect results.`,
		useCaseScenarios: [
			'Marketing teams launching campaigns across Instagram, Twitter, LinkedIn, and Facebook from one design',
			'SaaS companies generating OG images and social cards for every blog post from a single template',
			'E-commerce brands rendering product banners optimized for each advertising platform',
			'Agencies managing multi-platform content calendars without duplicating design work',
			'Developers who need a single API endpoint that serves platform-optimized images'
		],
		features: [
			'Visual canvas editor with drag-and-drop design',
			'AI-powered "Generate All Sizes" — one click, 8+ platforms',
			'Layout tabs to switch and fine-tune each platform size',
			'Shared variables across all layouts',
			'Single API endpoint with ?layout= parameter',
			'Custom dimensions support (100-4096px)',
			'Preserves element IDs for variable binding across sizes',
			'Render all layouts in one API call with layouts array'
		],
		dimensions: { width: 1200, height: 675 },
		overview: [
			'Stop duplicating templates. Open the canvas editor, design once, and let AI generate perfectly sized layouts for every social platform — Instagram, Twitter, LinkedIn, YouTube, OG, Pinterest, and custom sizes.',
			'Each layout is saved as a tab in your editor. Fine-tune any size, then serve them all through one API endpoint with shared variables. Your data stays the same — only the dimensions change.'
		],
		painPoints: [
			'Duplicating templates per platform',
			'Manual resize breaks element positioning',
			'No shared variables across sizes',
			'Multiple API calls for one set of data',
			'Maintaining consistency across platforms',
			'Re-doing edits on every size variant'
		],
		workflow: [
			{
				title: 'Open the canvas editor',
				detail: 'Create a free account and open the visual template editor. Design your image with text, shapes, images, and variable bindings.'
			},
			{
				title: 'Hit "Generate All Sizes"',
				detail: 'Click the resize button in the top bar, then "Generate All Sizes." AI creates optimized layouts for Instagram, Twitter, LinkedIn, YouTube, OG, and more — in seconds.'
			},
			{
				title: 'Fine-tune and serve via API',
				detail: 'Switch between layout tabs to review each size. Make adjustments if needed. Save, and your template is ready — one API call with ?layout=twitter-post renders the right size.'
			}
		],
		faqs: [
			{
				q: 'Do I need an account to use this?',
				a: 'Yes — the responsive image generator works inside the canvas editor, which requires a free account. Sign up takes 30 seconds, no credit card required.'
			},
			{
				q: 'How many platform sizes can I create from one template?',
				a: 'Up to 20 layout variants per template, including 8 built-in presets (Instagram, Twitter, LinkedIn, YouTube, Facebook, Pinterest, OG Image) and custom sizes.'
			},
			{
				q: 'How does the AI resize work?',
				a: 'The AI analyzes your canvas layout and intelligently repositions, scales, and stacks elements to fit each target size while maintaining visual hierarchy and readability.'
			},
			{
				q: 'Are variables shared across all layouts?',
				a: 'Yes. Variable definitions are shared across all layouts. One API call with your data renders the correct size based on the ?layout= parameter.'
			},
			{
				q: 'Can I customize the AI-generated layout?',
				a: 'Absolutely. After AI generates a layout, switch to that layout tab in the editor and fine-tune positions, sizes, and styles to your liking.'
			},
			{
				q: 'How do I render a specific layout via API?',
				a: 'Add ?layout=twitter-post (or any layout key) to your render request. Without the parameter, the default layout is returned. You can also pass an array of layout keys to render multiple sizes at once.'
			}
		],
		related: ['og-image-generator', 'youtube-thumbnail', 'linkedin-banner'],
		templateHtml: simpleCardTemplate({
			title: 'One Template,<br/>Every Platform',
			subtitle: 'Design once in the canvas editor. AI generates Instagram, Twitter, LinkedIn, YouTube, and OG sizes automatically. Open the editor to try it free.',
			badge: 'CANVAS EDITOR',
			accent: '#ffc480'
		})
	},
	'barcode-generator': {
		label: 'Barcodes',
		seoTitle: 'Free Barcode Generator Online — Create & Download | Pictify',
		ogImage: 'https://media.pictify.io/que8z-1775618085943.png',
		description: 'Free online barcode generator — create Code 128, EAN-13, UPC-A, and ITF-14 barcodes instantly. Download as PNG or JPG. API available for bulk generation.',
		seoKeywords: [
			'barcode generator', 'barcode maker', 'barcode image', 'generate barcode online',
			'barcode creator', 'barcode label generator', 'barcode png', 'product barcode generator',
			'inventory barcode', 'shipping label barcode'
		],
		longDescription: `Modern inventory and logistics systems require barcodes on demand — for product labels, shipping packages, warehouse bins, and event tickets. Manually creating barcodes in design tools is slow and error-prone. With Pictify, you render barcode HTML (using libraries like JsBarcode or bwip-js) as pixel-perfect images via API. Generate thousands of unique barcode labels in seconds, each with custom text, sizes, and formats.

Automate barcode generation in your warehouse management system, e-commerce platform, or ticketing pipeline. Every barcode is rendered server-side, delivered as a CDN-hosted image, and ready to print or embed.`,
		useCaseScenarios: [
			'E-commerce platforms generating product barcode labels',
			'Warehouse teams printing bin location barcodes',
			'Shipping departments creating package labels at scale',
			'Event organizers generating scannable ticket barcodes',
			'Retailers printing shelf price tags with barcodes'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['600x200', '800x400'],
		templateHtml: simpleCardTemplate({
			title: '{{product}}',
			subtitle: '{{sku}} · {{barcode}}',
			badge: 'BARCODE',
			accent: '#1f2937',
			background: '#ffffff'
		}),
		overview: [
			'Inventory, logistics, and retail teams need barcodes generated on demand — not hand-crafted in Illustrator. By rendering barcode HTML as images via API, you integrate barcode generation directly into your existing workflows.',
			'E-commerce, warehouse, and shipping systems use this to produce scannable barcode labels programmatically, eliminating manual steps and reducing labeling errors.'
		],
		painPoints: [
			'Manual barcode creation in design tools is slow and error-prone',
			'Most barcode generators lack API access for automation',
			'Inconsistent label formatting across departments'
		],
		workflow: [
			{ title: 'Generate barcode HTML', detail: 'Use JsBarcode or bwip-js to render a barcode as an HTML element with your data encoded.' },
			{ title: 'Style the label', detail: 'Add product name, SKU, price, or any metadata around the barcode using CSS.' },
			{ title: 'Render via API', detail: 'Send the HTML to Pictify to get a print-ready PNG or JPG image delivered via CDN.' }
		],
		faqs: [
			{ q: 'What barcode formats are supported?', a: 'Any format your HTML barcode library supports — Code 128, EAN-13, UPC-A, QR codes, Data Matrix, and more. Pictify renders whatever HTML you send.' },
			{ q: 'Can I batch generate barcodes?', a: 'Yes. Use the batch render API to generate thousands of unique barcode images in a single request.' },
			{ q: 'Are the images print-ready?', a: 'Yes. Use 300 DPI-equivalent dimensions (e.g., 600×200 at 2x) for crisp print output.' }
		],
		related: ['receipt', 'product-banner', 'badge']
	},
	'qr-code-generator': {
		label: 'QR Code Generator',
		description: 'Create branded QR codes with logos and custom styling as downloadable images.',
		seoKeywords: [
			'qr code generator', 'custom qr code', 'qr code with logo', 'branded qr code',
			'qr code maker', 'qr code image', 'qr code creator', 'qr code api',
			'generate qr code online', 'qr code png'
		],
		longDescription: `Plain QR codes work, but branded QR codes convert better. With Pictify, you render styled QR code HTML — with your logo, brand colors, rounded corners, and custom frames — as high-quality images. Use libraries like qrcode.js or QRCode.react to generate the QR code, style it with CSS, and convert to a shareable image via API.

Perfect for marketing materials, product packaging, restaurant menus, event tickets, and business cards. Automate QR code generation in your CMS or marketing platform — every new page or product gets a branded QR code automatically.`,
		useCaseScenarios: [
			'Marketing teams creating branded QR codes for print campaigns',
			'Restaurants generating menu QR codes with branding',
			'Event organizers adding QR codes to tickets and badges',
			'E-commerce brands embedding QR codes on packaging',
			'Real estate agents adding property listing QR codes to flyers'
		],
		recommendedFormats: ['png'],
		recommendedSizes: ['1080x1080', '600x600'],
		templateHtml: simpleCardTemplate({
			title: '{{label}}',
			subtitle: 'Scan to visit · {{url}}',
			badge: 'QR CODE',
			accent: '#4ade80',
			background: '#ffffff'
		}),
		overview: [
			'QR codes bridge physical and digital — but generic black-and-white squares look unprofessional. By rendering styled QR code HTML as images, you create on-brand codes that match your visual identity.',
			'Marketing, packaging, and event teams use this workflow to auto-generate branded QR codes for every campaign, product, or venue without touching a design tool.'
		],
		painPoints: [
			'Generic QR code generators produce bland, unbranded output',
			'Manual QR code creation does not scale for product catalogs',
			'No API access for automated QR code generation in most tools'
		],
		workflow: [
			{ title: 'Generate QR code HTML', detail: 'Use qrcode.js or a similar library to render a QR code as an SVG or Canvas element in HTML.' },
			{ title: 'Brand it', detail: 'Add your logo overlay, brand colors, rounded modules, and a call-to-action frame using CSS.' },
			{ title: 'Render via API', detail: 'Send the styled HTML to Pictify to get a high-resolution PNG ready for print or digital use.' }
		],
		faqs: [
			{ q: 'Can I add a logo to the QR code?', a: 'Yes. Overlay your logo in the center of the QR code using HTML/CSS positioning. The QR spec has error correction that allows up to 30% of the code to be obscured.' },
			{ q: 'Will the QR code still scan?', a: 'Yes, as long as you use medium or high error correction and keep the logo under 25-30% of the QR area.' },
			{ q: 'What sizes work best?', a: '1080×1080 for social media, 600×600 for print materials. Higher resolution ensures reliable scanning.' }
		],
		related: ['barcode-generator', 'event-ticket', 'product-banner']
	},
	'signature-generator': {
		label: 'Email Signature Generator',
		description: 'Create professional email signatures as images for consistent branding across your team.',
		seoKeywords: [
			'signature generator', 'email signature maker', 'email signature image',
			'professional email signature', 'html email signature', 'signature creator',
			'email signature template', 'team email signature', 'branded email signature',
			'signature block generator'
		],
		longDescription: `Email signatures are one of the most viewed pieces of marketing collateral — every employee sends dozens of emails daily. Yet most teams have inconsistent, poorly formatted signatures. With Pictify, you design a signature template once and render personalized variants for every team member via API.

Feed employee data (name, title, phone, photo URL) into your template and generate pixel-perfect signature images that look identical across Gmail, Outlook, Apple Mail, and every other client. No more broken HTML signatures or missing images.`,
		useCaseScenarios: [
			'HR teams rolling out branded signatures company-wide',
			'Marketing departments ensuring consistent signature branding',
			'Sales teams adding promotional banners to signatures',
			'Agencies managing signatures across multiple client brands',
			'Startups creating professional signatures from day one'
		],
		recommendedFormats: ['png'],
		recommendedSizes: ['600x200', '700x250'],
		templateHtml: simpleCardTemplate({
			title: '{{name}}',
			subtitle: '{{title}} · {{company}}',
			badge: 'SIGNATURE',
			accent: '#ff6b6b',
			background: '#ffffff'
		}),
		overview: [
			'Email signatures are seen more than your website — yet most are inconsistent, broken across clients, or missing entirely. Image-based signatures solve this by rendering identically everywhere.',
			'HR, marketing, and IT teams use this to generate and distribute branded signatures across the organization, ensuring every email reinforces the brand.'
		],
		painPoints: [
			'HTML email signatures break across different email clients',
			'Manually updating signatures for every employee is tedious',
			'Inconsistent formatting undermines brand credibility'
		],
		workflow: [
			{ title: 'Design the template', detail: 'Create an HTML/CSS signature layout with placeholders for name, title, phone, photo, and social links.' },
			{ title: 'Feed employee data', detail: 'Pass each employee\'s details as template variables to generate personalized signature images.' },
			{ title: 'Distribute', detail: 'Download or API-deliver the signature images. Employees paste them into their email client settings.' }
		],
		faqs: [
			{ q: 'Why use an image signature instead of HTML?', a: 'Image signatures render identically across all email clients — no broken layouts, missing fonts, or inconsistent spacing.' },
			{ q: 'Can I update all signatures at once?', a: 'Yes. Update the template and batch-render new images for the entire team via API.' },
			{ q: 'What size should email signatures be?', a: '600×200 pixels is the sweet spot — wide enough for full details, compact enough not to dominate the email.' }
		],
		related: ['html-email', 'email-header', 'membership-card']
	},
	'name-badge': {
		label: 'Name Badge Generator',
		description: 'Generate personalized name badges and name tags as printable images for events and conferences.',
		seoKeywords: [
			'name badge generator', 'name tag maker', 'conference badge generator',
			'event name badge', 'printable name badge', 'name badge template',
			'badge maker online', 'name tag creator', 'event badge generator',
			'conference name tag'
		],
		longDescription: `Conference and event organizers need hundreds or thousands of unique name badges — each with a different name, title, company, and sometimes a QR code or photo. Designing each one manually is impossible at scale. With Pictify, you create one badge template and generate every variant programmatically.

Upload your attendee CSV, map columns to template variables, and batch-render all badges in minutes. Print-ready PNG or PDF output ensures crisp text at any size. Perfect for conferences, corporate events, workshops, and trade shows.`,
		useCaseScenarios: [
			'Conference organizers printing badges for 500+ attendees',
			'Corporate events creating VIP and general admission badges',
			'Workshop facilitators generating name tags with session info',
			'Trade show booths printing visitor badges on demand',
			'School events creating student and parent name tags'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1200x800', '900x600'],
		templateHtml: simpleCardTemplate({
			title: '{{name}}',
			subtitle: '{{title}} · {{company}}',
			badge: 'NAME BADGE',
			accent: '#ffc480',
			background: '#FFFDF8'
		}),
		overview: [
			'Events require unique badges per attendee, but design tools do not scale. Programmatic badge generation from attendee data eliminates the bottleneck.',
			'Event ops teams, conference organizers, and corporate admins use this to batch-generate print-ready badges from registration data — no design skills required.'
		],
		painPoints: [
			'Manually creating individual badges for large events is impractical',
			'Generic badge tools lack customization and API access',
			'Last-minute attendee changes require rapid re-generation'
		],
		workflow: [
			{ title: 'Design your badge template', detail: 'Create an HTML/CSS badge layout with placeholders for name, title, company, and optional QR code or photo.' },
			{ title: 'Import attendee data', detail: 'Upload a CSV or connect your registration system to provide attendee details as template variables.' },
			{ title: 'Batch render', detail: 'Generate all badges in one API call. Download as individual PNGs or a combined PDF for printing.' }
		],
		faqs: [
			{ q: 'Can I add QR codes to badges?', a: 'Yes. Include a QR code library in your HTML template and encode each attendee\'s unique ID or vCard data.' },
			{ q: 'What print size works best?', a: '4×3 inches (1200×900 pixels at 300 DPI) is standard for conference badges. Adjust based on your badge holder size.' },
			{ q: 'Can I handle last-minute changes?', a: 'Yes. Re-render individual badges instantly via API when attendee details change.' }
		],
		related: ['badge', 'event-ticket', 'certificate']
	},
	'social-proof-card': {
		label: 'Social Proof Card',
		description: 'Generate testimonial and review cards as shareable images for social media and marketing.',
		seoKeywords: [
			'social proof card', 'testimonial card generator', 'review card maker',
			'testimonial image', 'customer review card', 'social proof widget',
			'testimonial graphic', 'review screenshot', 'customer feedback image',
			'social proof image generator'
		],
		longDescription: `Customer testimonials are your most powerful marketing asset — but they are buried in review platforms and support tickets. With Pictify, you turn raw testimonial text into beautifully designed, shareable image cards that work on Twitter, LinkedIn, Instagram, and your website.

Design a testimonial card template once — with customer photo, name, company, star rating, and quote — then generate variants for every review via API. Perfect for social media managers, growth teams, and marketing automation pipelines.`,
		useCaseScenarios: [
			'Marketing teams sharing customer testimonials on social media',
			'Growth teams creating review cards for ad campaigns',
			'SaaS companies featuring user quotes on landing pages',
			'E-commerce brands showcasing product reviews as images',
			'Sales teams adding proof points to pitch decks'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1080x1080', '1200x630'],
		templateHtml: simpleCardTemplate({
			title: '{{quote}}',
			subtitle: '{{name}} · {{company}}',
			badge: 'TESTIMONIAL',
			accent: '#ffc480',
			background: '#FFFDF8'
		}),
		overview: [
			'Testimonials convert — but plain text quotes get ignored on visual platforms. Turning reviews into designed image cards dramatically increases engagement and shareability.',
			'Marketing, growth, and social media teams use this to systematically convert customer feedback into on-brand visual content for every channel.'
		],
		painPoints: [
			'Testimonials buried in text get low engagement on social platforms',
			'Designing individual testimonial graphics is time-consuming',
			'Inconsistent formatting across different team members'
		],
		workflow: [
			{ title: 'Design the card template', detail: 'Create an HTML/CSS testimonial card with placeholders for quote, customer name, photo, company, and star rating.' },
			{ title: 'Pull review data', detail: 'Connect to your review platform, CRM, or spreadsheet to extract testimonial data.' },
			{ title: 'Generate and share', detail: 'Render cards via API and post directly to social media or embed on your website.' }
		],
		faqs: [
			{ q: 'Can I include star ratings?', a: 'Yes. Use HTML/CSS star components or Unicode stars in your template. Style them however you like.' },
			{ q: 'What size works for social media?', a: '1080×1080 for Instagram and Facebook feed posts, 1200×630 for Twitter and LinkedIn cards.' },
			{ q: 'Can I automate this from a review platform?', a: 'Yes. Use the API with Zapier, Make, or a custom integration to auto-generate cards when new reviews come in.' }
		],
		related: ['testimonial', 'quote-card', 'kpi-card']
	},
	'changelog-image': {
		label: 'Changelog Image Generator',
		description: 'Generate visual changelog and release notes as shareable images for social media and documentation.',
		seoKeywords: [
			'changelog image', 'release notes image', 'changelog generator',
			'release notes graphic', 'product update image', 'changelog card',
			'release announcement image', 'what is new image', 'product changelog',
			'version release image'
		],
		longDescription: `Shipping features without telling anyone is wasted effort. With Pictify, you turn your changelog or release notes into polished visual cards that get attention on Twitter, LinkedIn, and your product blog. Each release gets a branded image automatically.

Integrate with your CI/CD pipeline to generate a changelog image on every deploy. Pull the release title, version number, feature list, and date from your release process and render a social-ready graphic in seconds. No designer needed.`,
		useCaseScenarios: [
			'DevRel teams announcing new features on social media',
			'Product teams sharing weekly release notes internally',
			'Open source maintainers generating release announcement graphics',
			'Marketing teams creating product update posts',
			'Engineering teams documenting releases visually'
		],
		recommendedFormats: ['png', 'jpg'],
		recommendedSizes: ['1200x630', '1080x1080'],
		templateHtml: simpleCardTemplate({
			title: '{{title}}',
			subtitle: 'v{{version}} · {{date}}',
			badge: 'CHANGELOG',
			accent: '#4ade80',
			background: '#0b0b1f'
		}),
		overview: [
			'Release notes as plain text get ignored. Visual changelog cards grab attention on social platforms and internal channels, driving feature adoption and engagement.',
			'Product, engineering, and DevRel teams use this to automate release communication — every deploy generates a branded announcement graphic from the changelog data.'
		],
		painPoints: [
			'Release notes as text posts get low engagement',
			'Manually creating announcement graphics delays shipping',
			'Inconsistent release communication across channels'
		],
		workflow: [
			{ title: 'Extract release data', detail: 'Pull the release title, version, date, and feature list from your CI/CD pipeline or changelog file.' },
			{ title: 'Apply the template', detail: 'Map release data to your branded changelog card template with version badge, feature bullets, and release date.' },
			{ title: 'Post and share', detail: 'Render the image via API and auto-post to Twitter, LinkedIn, Slack, or your blog.' }
		],
		faqs: [
			{ q: 'Can I trigger this from CI/CD?', a: 'Yes. Call the Pictify API in your deploy script — pass release metadata as template variables and get a social-ready image back.' },
			{ q: 'Can I include a feature list?', a: 'Yes. Render bullet points, icons, or even code diffs in your HTML template. Pictify renders any valid HTML.' },
			{ q: 'What about dark mode?', a: 'Use a dark background in your template. Many changelog cards look great with dark themes — they stand out in social feeds.' }
		],
		related: ['release-notes-card', 'feature-flag-banner', 'status-update']
	}
};
