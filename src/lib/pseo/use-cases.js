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
	{ id: 'table', label: 'HTML Table to Image' },
	{ id: 'markdown', label: 'Markdown to Image' },
	// 'certificate' intentionally omitted: /tools/certificate 301s to
	// /tools/certificate-generator (they cannibalized the same keyword).
	{ id: 'badge', label: 'Badge Generator' },
	{ id: 'leaderboard', label: 'Leaderboard Card' },
	// New use cases (Phase 3.1)
	{ id: 'email-header', label: 'Email Header Generator' },
	// 'course-certificate' intentionally omitted: /tools/course-certificate 301s
	// to /tools/certificate-generator (same keyword cluster, consolidated).
	{ id: 'membership-card', label: 'Membership Card' },
	{ id: 'portfolio-card', label: 'Portfolio Card' },
	{ id: 'barcode-generator', label: 'Barcodes' },
	{ id: 'social-proof-card', label: 'Social Proof Card' },
];

export const useCaseDetails = {
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
				a: 'Yes. Increase the output width and height before generating the image. Pictify supports up to 4000×4000 pixels.'
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
				a: 'If your charts render as HTML/SVG, Pictify will capture them. For <canvas>-drawn charts (Chart.js and similar), the API captures those too — the renderer runs a full Chromium, so anything a browser can draw ends up in the image.'
			}
		],
		related: ['markdown', 'badge']
	},
	markdown: {
		label: 'Markdown to Image',
		description:
			'Render Markdown content as polished, shareable images for social posts, docs, and presentations.',
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
				detail:
					'Use your static site generator or a Markdown parser to create HTML with the desired theme.'
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
		related: ['table', 'badge']
	},
	badge: {
		label: 'Badge Generator',
		seoTitle: 'Free Badge Generator — Achievement & Certification Badges (PNG + API) | Pictify',
		description:
			'Generate achievement badges, skill labels, and milestone markers as shareable images for gamification and recognition.',
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
			a personalized badge with their name, tier, and achievement date baked in. For whole cohorts, upload
			a recipient CSV to a Pictify workflow and every badge is bulk-generated and emailed to its recipient
			automatically.`,
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
		related: ['membership-card', 'leaderboard']
	},
	leaderboard: {
		label: 'Leaderboard Card',
		description:
			'Generate leaderboard snapshots and ranking cards for communities, contests, and gamification programs.',
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
		related: ['social-proof-card', 'badge']
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
		related: ['social-proof-card', 'membership-card']
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
			for easy verification. For bulk onboarding, upload a member CSV to a Pictify workflow and every card
			is generated and emailed to its member automatically.`,
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
		related: ['badge', 'portfolio-card']
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
		related: ['social-proof-card', 'email-header']
	},
	'barcode-generator': {
		label: 'Barcodes',
		seoTitle: 'Barcode Generator API — Bulk Barcodes for Labels & Inventory (Free) | Pictify',
		ogImage: 'https://media.pictify.io/que8z-1775618085943.png',
		description:
			'Generate Code 128, EAN-13, UPC-A, and ITF-14 barcodes — free online tool plus a bulk barcode generator API for product labels, inventory, and shipping at scale.',
		seoKeywords: [
			'barcode generator',
			'barcode maker',
			'barcode image',
			'generate barcode online',
			'barcode creator',
			'barcode label generator',
			'barcode png',
			'product barcode generator',
			'inventory barcode',
			'shipping label barcode'
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
			{
				title: 'Generate barcode HTML',
				detail:
					'Use JsBarcode or bwip-js to render a barcode as an HTML element with your data encoded.'
			},
			{
				title: 'Style the label',
				detail: 'Add product name, SKU, price, or any metadata around the barcode using CSS.'
			},
			{
				title: 'Render via API',
				detail: 'Send the HTML to Pictify to get a print-ready PNG or JPG image delivered via CDN.'
			}
		],
		faqs: [
			{
				q: 'What barcode formats are supported?',
				a: 'Any format your HTML barcode library supports — Code 128, EAN-13, UPC-A, QR codes, Data Matrix, and more. Pictify renders whatever HTML you send.'
			},
			{
				q: 'Can I batch generate barcodes?',
				a: 'Yes. Use the batch render API to generate thousands of unique barcode images in a single request.'
			},
			{
				q: 'Are the images print-ready?',
				a: 'Yes. Use 300 DPI-equivalent dimensions (e.g., 600×200 at 2x) for crisp print output.'
			}
		],
		related: ['portfolio-card', 'badge']
	},
	'social-proof-card': {
		label: 'Social Proof Card',
		description:
			'Generate testimonial and review cards as shareable images for social media and marketing.',
		seoKeywords: [
			'social proof card',
			'testimonial card generator',
			'review card maker',
			'testimonial image',
			'customer review card',
			'social proof widget',
			'testimonial graphic',
			'review screenshot',
			'customer feedback image',
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
			{
				title: 'Design the card template',
				detail:
					'Create an HTML/CSS testimonial card with placeholders for quote, customer name, photo, company, and star rating.'
			},
			{
				title: 'Pull review data',
				detail: 'Connect to your review platform, CRM, or spreadsheet to extract testimonial data.'
			},
			{
				title: 'Generate and share',
				detail: 'Render cards via API and post directly to social media or embed on your website.'
			}
		],
		faqs: [
			{
				q: 'Can I include star ratings?',
				a: 'Yes. Use HTML/CSS star components or Unicode stars in your template. Style them however you like.'
			},
			{
				q: 'What size works for social media?',
				a: '1080×1080 for Instagram and Facebook feed posts, 1200×630 for Twitter and LinkedIn cards.'
			},
			{
				q: 'Can I automate this from a review platform?',
				a: 'Yes. Use the API with Zapier, Make, or a custom integration to auto-generate cards when new reviews come in.'
			}
		],
		related: ['portfolio-card', 'leaderboard']
	},
};
