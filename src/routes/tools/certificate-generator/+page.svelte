<script>
	/**
	 * /tools/certificate-generator — the v2 tool page, column mode.
	 *
	 * Bulk upsell, gallery, form and preview become the tool card; the quota
	 * ladder and Generate move to its toolbar. SEO copy is frozen.
	 */
	import AutomateSection from '$lib/components/tools/v2/AutomateSection.svelte';
	import ToolSeoHead from '$lib/components/tools/v2/ToolSeoHead.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import LongformPair from '$lib/components/tools/v2/longform/LongformPair.svelte';
	import HeroTitle from '$lib/components/tools/v2/longform/HeroTitle.svelte';
	import HeroSub from '$lib/components/tools/v2/longform/HeroSub.svelte';
	import Lead from '$lib/components/tools/v2/longform/Lead.svelte';
	import Prose from '$lib/components/tools/v2/longform/Prose.svelte';
	import ProseGroup from '$lib/components/tools/v2/longform/ProseGroup.svelte';
	import FeatureGrid from '$lib/components/tools/v2/longform/FeatureGrid.svelte';
	import StepCards from '$lib/components/tools/v2/longform/StepCards.svelte';
	import LinkCardGrid from '$lib/components/tools/v2/longform/LinkCardGrid.svelte';
	import FaqList from '$lib/components/tools/v2/longform/FaqList.svelte';
	import RelatedLinks from '$lib/components/tools/v2/longform/RelatedLinks.svelte';
	import JumpLink from '$lib/components/tools/v2/longform/JumpLink.svelte';
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolCard from '$lib/components/tools/v2/ToolCard.svelte';
	import ToolEditor from '$lib/components/tools/ToolEditor.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { user } from '../../../store/user.store';
	import { analytics } from '$lib/telemetry.js';
	import { certificateHtmlTemplates } from '$lib/components/tools/CertificateHtmlTemplates.js';

	// User login state (reactive — no manual subscribe needed)
	$: isUserLoggedIn = !!$user?.email;

	/*
	 * The gallery for the embed.
	 *
	 * THE RECIPIENT IS RENDERED AS A VARIABLE, not as a name. That is the whole
	 * point of a certificate template: one is also a thousand, and the visitor
	 * should see `{{name}}` in the design and in Inputs from the first second
	 * rather than discover the idea later. Everything else renders as sample
	 * text they can edit directly.
	 *
	 * Sizes come from the templates themselves — see the note by CERT_WIDTH.
	 */
	const CERT_SAMPLE = {
		recipientName: '{{name}}',
		organizationName: 'Your Organization',
		date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
		achievementText: 'for successfully completing the Advanced Training Program'
	};
	$: editorTemplates = certificateHtmlTemplates.map((t) => ({
		key: t.id,
		name: t.name,
		category: null,
		html: t.render(CERT_SAMPLE)
	}));

	/*
	 * The shipped templates are 1920×1080. The handoff matrix asks for landscape
	 * A4, which is a different aspect ratio (1.414 vs 1.778) — rendering these
	 * at A4 would letterbox or crop every one of them. Reflowing five designs
	 * for print is design work, not a prop change, so the canvas uses the
	 * templates' own size and the A4 question stays open.
	 */
	const CERT_WIDTH = certificateHtmlTemplates[0]?.width || 1920;
	const CERT_HEIGHT = certificateHtmlTemplates[0]?.height || 1080;

	/** One release of escape hatch, the same lever the other tools use. */
	$: useLegacyTool = $page?.url?.searchParams?.get?.('studio') === 'v1';



	// The preview HTML is rebuilt from the form on every keystroke — the same


	// API snippet for NextSteps — the same HTML with variables swapped in

	// FAQ data
	const faqs = [
		{
			q: 'Is this certificate generator really free?',
			a: 'Yes, pick a template, fill in the details, and download a high-resolution PNG free, no signup required. A free account adds bulk generation, PDF output, and API access.'
		},
		{
			q: 'Can I customize the certificate design?',
			a: 'Yes. The form fields update the recipient name, organization, date, and achievement text live in the preview. Every template is plain HTML and CSS under the hood, so with a free account you can edit the template code directly, or describe the design you want and let the AI Template Maker write it.'
		},
		{
			q: 'What formats can I download certificates in?',
			a: 'This free tool generates high-quality PNG images at 1920x1080 resolution. With a free account, the API and workflows also render certificates as PDF (including multi-page), JPG, and WebP.'
		},
		{
			q: 'Can I bulk generate certificates for events or training programs?',
			a: 'Yes! Pictify works as a bulk certificate generator for events, training programs, and courses. Upload a CSV in a workflow (one row per attendee) and every row renders its own certificate. Or use the API to batch generate up to 500 certificates per call. Perfect for course completions, event attendance, and employee recognition programs.'
		},
		{
			q: 'Can I generate certificates in bulk automatically?',
			a: 'Yes, this is what makes Pictify different from other certificate makers. A batch run renders every row of your CSV against the same template in one job, and hands back a CDN link per certificate plus a per-row status you can poll. A webhook fires when the run finishes, so your own system can pick the files up without anyone watching a progress bar.'
		},
		{
			q: 'Can I generate certificates from Google Sheets?',
			a: 'Export your Sheet as CSV and upload it to a workflow; columns map to certificate variables in the wizard. Unlike Sheets add-ons such as Autocrat, the merge runs on managed infrastructure (no Apps Script 6-minute timeouts) and delivery never touches your Gmail quota.'
		},
		{
			q: 'Can my LMS or form tool trigger certificates automatically?',
			a: 'Yes. Every workflow exposes a signed webhook. Point your LMS completion event, Typeform, or a Zapier/Make/n8n flow at it and each payload renders one certificate, with the same per-row status tracking as a CSV run.'
		},
		{
			q: 'Can I add my company logo?',
			a: 'Yes. In a workflow, templates are HTML: drop an <img> tag with your logo URL anywhere in the design, or upload it as a brand asset. Because templates are code, there is no limit on layout, fonts, or imagery.'
		},
		{
			q: 'Are the generated certificates printable?',
			a: 'Yes, certificates are generated at 1920x1080 pixels which provides excellent print quality for standard certificate sizes. For best results, print on high-quality paper or card stock.'
		}
	];

	// Structured data
	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify.io Certificate Generator',
		url: 'https://pictify.io/tools/certificate-generator',
		description:
			"Create professional certificates for free with Pictify's interactive certificate generator. Choose from 5 beautiful templates, customize recipient names, dates, and achievements, and download as PNG.",
		applicationCategory: ['DesignApplication', 'ImageGenerator'],
		operatingSystem: 'Web',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD',
			availability: 'https://schema.org/InStock'
		},
		featureList: [
			'5 professional certificate templates',
			'Real-time live preview',
			'Customizable text fields',
			'High-resolution PNG download',
			'API for bulk generation',
			'No signup required'
		],
		creator: {
			'@type': 'Organization',
			name: 'Pictify.io',
			url: 'https://pictify.io'
		}
	};

	const howToSchema = {
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name: 'How to Make a Certificate Online',
		description:
			"Make a custom certificate online for free in six steps using Pictify's certificate generator.",
		totalTime: 'PT2M',
		supply: [
			{ '@type': 'HowToSupply', name: 'Recipient name, organization, date, achievement text' }
		],
		tool: [{ '@type': 'HowToTool', name: 'Pictify Certificate Generator' }],
		step: [
			{
				'@type': 'HowToStep',
				position: 1,
				name: 'Choose a template',
				text: 'Choose a certificate template from the gallery above.'
			},
			{
				'@type': 'HowToStep',
				position: 2,
				name: 'Enter details',
				text: 'Enter the recipient name, organization, date, and achievement.'
			},
			{
				'@type': 'HowToStep',
				position: 3,
				name: 'Preview the certificate',
				text: 'Preview your certificate in the interactive live preview.'
			},
			{
				'@type': 'HowToStep',
				position: 4,
				name: 'Watch the live preview',
				text: 'The certificate preview updates instantly as you type.'
			},
			{
				'@type': 'HowToStep',
				position: 5,
				name: 'Generate the certificate',
				text: 'Click Generate Certificate to create a high-resolution PNG.'
			},
			{
				'@type': 'HowToStep',
				position: 6,
				name: 'Download',
				text: 'Download your certificate, or start a batch run to render them in bulk from a CSV.'
			}
		]
	};

	const templateListSchema = {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: 'Free Certificate Templates',
		itemListOrder: 'https://schema.org/ItemListUnordered',
		numberOfItems: 5,
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				item: {
					'@type': 'CreativeWork',
					name: 'Certificate of Achievement Template',
					description:
						'Classic formal certificate of achievement with gold borders and elegant serif typography.'
				}
			},
			{
				'@type': 'ListItem',
				position: 2,
				item: {
					'@type': 'CreativeWork',
					name: 'Certificate of Completion Template',
					description:
						'Sleek dark theme certificate of completion with purple accents and clean sans-serif typography.'
				}
			},
			{
				'@type': 'ListItem',
				position: 3,
				item: {
					'@type': 'CreativeWork',
					name: 'Corporate Certificate Template',
					description:
						'Professional corporate certificate design with navy header and formal layout.'
				}
			},
			{
				'@type': 'ListItem',
				position: 4,
				item: {
					'@type': 'CreativeWork',
					name: 'Minimalist Certificate Template',
					description:
						'Clean minimalist certificate design with generous whitespace and refined typography.'
				}
			},
			{
				'@type': 'ListItem',
				position: 5,
				item: {
					'@type': 'CreativeWork',
					name: 'Creative Award Certificate Template',
					description:
						'Bold, colorful award certificate with coral accents and playful geometric elements.'
				}
			}
		]
	};

	onMount(() => {
		analytics.trackToolOpened({ tool_name: 'certificate_generator' });
	});

	const TOOL_NAME = 'certificate_generator';
	const TOOL_PATH = '/tools/certificate-generator';


	const certificateExamples = [
		{
			id: 'javascript',
			label: 'JavaScript',
			fileName: 'certificate.js',
			code: `<span class="text-[#6a9955]">// Render a certificate from an HTML template with dynamic fields</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">html</span> = <span class="text-[#9cdcfe]">template</span>.<span class="text-[#dcdcaa]">replace</span>(<span class="text-[#ce9178]">'{{name}}'</span>, <span class="text-[#9cdcfe]">recipient</span>.<span class="text-[#9cdcfe]">name</span>);

<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">response</span> = <span class="text-[#c586c0]">await</span> <span class="text-[#dcdcaa]">fetch</span>(<span class="text-[#ce9178]">'https://api.pictify.io/image'</span>, {
  <span class="text-[#9cdcfe]">method</span>: <span class="text-[#ce9178]">'POST'</span>,
  <span class="text-[#9cdcfe]">headers</span>: { <span class="text-[#ce9178]">'Content-Type'</span>: <span class="text-[#ce9178]">'application/json'</span>, <span class="text-[#ce9178]">'Authorization'</span>: <span class="text-[#ce9178]">'Bearer YOUR_API_KEY'</span> },
  <span class="text-[#9cdcfe]">body</span>: <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">stringify</span>({ <span class="text-[#9cdcfe]">html</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">1600</span>, <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">1131</span> })
});

<span class="text-[#c586c0]">const</span> { <span class="text-[#9cdcfe]">image</span> } = <span class="text-[#c586c0]">await</span> <span class="text-[#9cdcfe]">response</span>.<span class="text-[#dcdcaa]">json</span>();
<span class="text-[#9cdcfe]">console</span>.<span class="text-[#dcdcaa]">log</span>(<span class="text-[#9cdcfe]">image</span>.<span class="text-[#9cdcfe]">url</span>); <span class="text-[#6a9955]">// loop over a CSV to issue a whole class</span>`
		},
		{
			id: 'python',
			label: 'Python',
			fileName: 'certificate.py',
			code: `<span class="text-[#c586c0]">import</span> <span class="text-[#9cdcfe]">requests</span>

<span class="text-[#c586c0]">for</span> <span class="text-[#9cdcfe]">name</span> <span class="text-[#c586c0]">in</span> <span class="text-[#9cdcfe]">recipients</span>:
    <span class="text-[#9cdcfe]">html</span> = <span class="text-[#9cdcfe]">template</span>.<span class="text-[#dcdcaa]">replace</span>(<span class="text-[#ce9178]">"{{name}}"</span>, <span class="text-[#9cdcfe]">name</span>)
    <span class="text-[#9cdcfe]">resp</span> = <span class="text-[#9cdcfe]">requests</span>.<span class="text-[#dcdcaa]">post</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>,
        <span class="text-[#9cdcfe]">headers</span>={<span class="text-[#ce9178]">"Authorization"</span>: <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>},
        <span class="text-[#9cdcfe]">json</span>={<span class="text-[#ce9178]">"html"</span>: <span class="text-[#9cdcfe]">html</span>, <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">1600</span>, <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">1131</span>})
    <span class="text-[#dcdcaa]">print</span>(<span class="text-[#9cdcfe]">resp</span>.<span class="text-[#dcdcaa]">json</span>()[<span class="text-[#ce9178]">"url"</span>])`
		},
		{
			id: 'curl',
			label: 'cURL',
			fileName: 'certificate.sh',
			code: `<span class="text-[#dcdcaa]">curl</span> -X POST <span class="text-[#ce9178]">https://api.pictify.io/image</span> \\
  -H <span class="text-[#ce9178]">"Content-Type: application/json"</span> \\
  -H <span class="text-[#ce9178]">"Authorization: Bearer YOUR_API_KEY"</span> \\
  -d <span class="text-[#ce9178]">'{"html":"&lt;div&gt;Certificate for ...&lt;/div&gt;","width":1600,"height":1131}'</span>`
		}
	];

	const RELATED = ['csv-to-pdf', 'badge', 'membership-card'];

	/** Eight sections, so the column gets the rail rather than running full width. */
	const TOC = [
		{ id: 'what-is', label: 'What is a Certificate Generator?' },
		{ id: 'why-use', label: 'Why Use Our Generator?' },
		{ id: 'how-to', label: 'How to Make One in 6 Steps' },
		{ id: 'bulk', label: 'Bulk for Events' },
		{ id: 'faq', label: 'FAQ' },
		{ id: 'templates', label: 'Certificate Templates' },
		{ id: 'free-maker', label: 'Free Online Maker' },
		{ id: 'bulk-run', label: 'Start a Bulk Run' }
	];
</script>

<ToolSeoHead
	title="Certificate Generator: Free Maker + Bulk API for Events & Training | Pictify"
	description="Free certificate generator with 5 professional templates: customize names, dates, and achievements, then download a high-res PNG. Bulk-generate via the free API."
	keywords="certificate generator, certificate maker, certificate template, make a certificate, create a certificate, online certificate maker, certificate of achievement template, certificate builder, free certificate maker, bulk certificate generator, certificate generator API, Pictify"
	canonical="https://pictify.io/tools/certificate-generator"
	robots="index, follow, max-image-preview:large"
	ogTitle="Certificate Generator: Free Maker + Bulk API for Events & Training | Pictify"
	ogDescription="Free certificate generator with 5 templates. Bulk-generate certificates for events, training programs, and courses with the free API."
	ogSiteName="Pictify"
	ogImage="https://media.pictify.io/qyl7z-1775406830860.png"
	ogImageWidth={1200}
	ogImageHeight={630}
	ogImageAlt="Pictify Certificate Generator: 5 free templates with API for bulk generation"
	twitterSite="@pictify_io"
	twitterTitle="Certificate Generator: Free Maker + Bulk API for Events & Training | Pictify"
	twitterDescription="Free certificate generator with 5 templates. Bulk-generate certificates for events, training, and courses via API."
	twitterImage="https://media.pictify.io/qyl7z-1775406830860.png"
	twitterImageAlt="Pictify Certificate Generator: 5 free templates with API for bulk generation"
	webApplicationSchema={structuredData}
	{faqs}
	breadcrumbLabel="Certificate Generator"
	howToSteps={howToSchema.step.map((step) => ({ name: step.name, text: step.text }))}
	howToMeta={{
		name: howToSchema.name,
		description: howToSchema.description,
		totalTime: howToSchema.totalTime,
		supply: howToSchema.supply,
		tool: howToSchema.tool
	}}
	extraSchemas={[templateListSchema]}
/>

<ToolPageShell
	toolName={TOOL_NAME}
	toolPath={TOOL_PATH}
	breadcrumb="CERTIFICATE GENERATOR"
	facts="FREE · 5 RENDERS A DAY · NO SIGNUP · 5 TEMPLATES"
	related={RELATED}
	loggedIn={isUserLoggedIn}
	toc={TOC}
	longform="rail"
>
	<HeroTitle slot="h1">
		<span>CERTIFICATE</span>
		<span>GENERATOR</span>
	</HeroTitle>

	<HeroSub slot="hero-sub">
		Create <span class="font-medium">professional certificates</span> in seconds.
		<span class="text-brand-slate">
			5 beautiful templates with real-time preview and instant download
		</span>
	</HeroSub>

	<div slot="tool">
		<!-- TS-8. Edited in place on the shared embed. `?studio=v1` for one release. -->
		{#if useLegacyTool}
			<ToolCard>
				<p class="p-6 font-sans text-[13.5px] leading-[19px] text-brand-slate">
					The classic generator has been replaced by the editor.
					<a href="?" class="text-brand-royal underline">Open it</a>.
				</p>
			</ToolCard>
		{:else}
			<ToolEditor
				templates={editorTemplates}
				width={CERT_WIDTH}
				height={CERT_HEIGHT}
				sourceKind="certificate"
				toolName="certificate_generator"
				downloadName="certificate"
				defaultTab="inputs"
				bulkLeadIn={{
					label: 'One certificate is also a thousand · Bulk from CSV',
					href: '/signup?intent=template-editor&next=bulk-render'
				}}
			/>
		{/if}
	</div>


	<AutomateSection
		slot="automate"
		title="Automate with the"
		titleHighlight="API"
		toolName={TOOL_NAME}
		description="Issue certificates programmatically. Render one HTML template per recipient with a single POST — loop over a CSV to award a whole cohort, or trigger it from your LMS on completion."
		codeExamples={certificateExamples}
	/>

	<svelte:fragment slot="longform">
		<LongformSection index="01" id="what-is" first title="What is a Certificate Generator?">
			<Prose>
				<p>
					A certificate generator is a tool that lets you create professional, customizable
					certificates for any occasion. Whether you need certificates for course completions,
					employee awards, event attendance, or academic achievements, a certificate generator
					streamlines the process from design to download. Instead of spending hours in graphic
					design software, you can select a template, fill in the details, and generate a
					print-ready certificate in seconds.
				</p>
			</Prose>
		</LongformSection>

		<LongformSection index="02" id="why-use" title="Why Use Our Certificate Generator?">
			<FeatureGrid
				columns={2}
				items={[
					{ title: '5 professionally designed certificate templates' },
					{ title: 'Real-time live preview as you type' },
					{ title: 'Customize recipient name, organization, date, and achievement' },
					{ title: 'High-resolution 1920x1080px PNG output' },
					{ title: 'API available for bulk certificate generation' },
					{ title: 'No signup required to get started' }
				]}
			/>
		</LongformSection>

		<LongformSection index="03" id="how-to" title="How to Make a Certificate Online in 6 Steps">
			<!--
				The cards show the step text, as they did before — the schema's short
				step names were never on the page — and they are not headings, so the
				outline keeps the shape it ranks with.
			-->
			<StepCards titleTag="p" steps={howToSchema.step.map((step) => ({ title: step.text }))} />
		</LongformSection>

		<LongformSection
			index="04"
			id="bulk"
			title="Bulk Certificate Generator for Events: One Run, Not 300 Exports"
		>
			<Lead>
				Generating one certificate was never the hard part. Generating 300 of them, on brand, with
				links your own system can fetch, before the deadline is. Every other path stops one step
				short:
			</Lead>
			<LinkCardGrid
				columns={3}
				titleTag="h4"
				toolName={TOOL_NAME}
				items={[
					{
						href: '/alternatives/autocrat',
						title: 'Sheets add-ons',
						body: 'Autocrat rides Apps Script and its 6-minute execution cap, and broke across its 81M-install base in June 2026. →'
					},
					{
						href: '/alternatives/canva-bulk-create',
						title: 'Canva Bulk Create',
						body: 'Makes beautiful variants, then stops at download. No API, no per-row links; the zip file is your problem. →'
					},
					{
						href: '/alternatives',
						title: 'Mail merge',
						body: 'Merges text into a letter. It cannot render a designed certificate, and there is no API behind it. →'
					}
				]}
			/>
			<Prose>
				<p>
					A Pictify batch run does the whole job: upload the attendee CSV, every row renders its own
					certificate against the same template, and each one comes back as a
					<strong>CDN link with a per-row status</strong>, with a webhook when the run finishes.
					Re-run any single row on its own if a value was wrong. That's the difference between a
					design tool and a render API.
				</p>
			</Prose>
		</LongformSection>

		<LongformSection index="05" id="faq" title="Frequently Asked Questions">
			<FaqList {faqs} />
		</LongformSection>

		<!--
			06 spans: five template descriptions do not fit a half column. 07 and 08
			pair, which is where the two-up layout actually earns its keep.
		-->
		<LongformPair>
			<LongformSection
				index="06"
				id="templates"
				compact
				span
				title="Certificate Templates: Choose from 5 Free Designs"
			>
				<Lead>
					Every certificate template works for any certificate type: award, achievement, completion,
					participation, or appreciation. Pick a design that matches your brand and customize the
					title, recipient name, date, and achievement text. All templates are free and come with
					commercial-use rights.
				</Lead>
				<ProseGroup
					columns={2}
					headingTag="h4"
					items={[
						{
							heading: 'Certificate of Achievement Template',
							bodyHtml:
								'Recognize outstanding accomplishments with a formal certificate of achievement. The <strong>Elegant</strong> template, with gold borders and serif typography, is our most popular certificate of achievement template, ideal for awards ceremonies, academic honors, and sales milestones.'
						},
						{
							heading: 'Certificate of Completion Template',
							bodyHtml:
								'Issue a certificate of completion for courses, training programs, workshops, and onboarding. The <strong>Modern Dark</strong> template gives completion certificates a sleek, contemporary feel that reads well on-screen and in print.'
						},
						{
							heading: 'Certificate of Participation Template',
							bodyHtml:
								"Acknowledge attendance and engagement with a certificate of participation. The <strong>Corporate</strong> template's navy header and formal layout make it the right certificate of participation template for conferences, webinars, and corporate events."
						},
						{
							heading: 'Award Certificate Template',
							bodyHtml:
								'Celebrate winners and honorees with a bold award certificate. The <strong>Creative</strong> template (coral accents and playful geometry) works well for employee-of-the-month awards, tournament winners, and community recognition.'
						},
						{
							heading: 'Certificate of Appreciation Template',
							bodyHtml:
								"Thank volunteers, partners, and team members with a certificate of appreciation. The <strong>Minimalist</strong> template's generous whitespace and refined typography puts the focus on the recipient, a perfect certificate of appreciation template for donor recognition and retirement gifts."
						}
					]}
				/>
			</LongformSection>

			<LongformSection
				index="07"
				id="free-maker"
				compact
				title="Use Our Online Certificate Maker for Free"
			>
				<Prose>
					<p>
						Pictify's online certificate maker runs entirely in your browser: no downloads, no
						installs, no signup. The certificate maker supports a real-time preview that updates as
						you type, and high-resolution PNG export at 1920×1080. Generate one certificate in under
						a minute, or use the <strong>free certificate generator API</strong> to batch-create hundreds
						at once from a spreadsheet or database.
					</p>
					<p>
						Every template here is plain HTML and CSS, the same template a Pictify batch run renders
						at scale. Connect a CSV, webhook, Zapier, or Make.com flow and each row becomes its own
						certificate on a CDN link your system can fetch. That's the difference between a one-off
						certificate generator and a programmable certificate builder: the fast free tool today,
						production-grade automation when you're ready to scale.
					</p>
				</Prose>
			</LongformSection>

			<LongformSection index="08" id="bulk-run" compact title="Need Three Hundred, Not Just One?">
				<Prose>
					<p>
						Start a workflow run to generate personalized certificates in bulk: one render per row,
						a CDN link for each, and a webhook when the run finishes. Perfect for events, courses,
						and training programs.
					</p>
				</Prose>
				<JumpLink href="/dashboard/workflows/new">Start a Run (Free) →</JumpLink>
			</LongformSection>
		</LongformPair>
	</svelte:fragment>

	<svelte:fragment slot="footer-links">
		<RelatedLinks
			toolName={TOOL_NAME}
			links={[
				{ href: '/tools/badge', label: 'Badge maker' },
				{ href: '/tools/course-certificate', label: 'Course certificate' },
				{ href: '/tools/receipt', label: 'Receipt generator' },
				{ href: '/tools/event-ticket', label: 'Event ticket' },
				{ href: '/tools', label: 'View all tools →' }
			]}
		/>
	</svelte:fragment>
</ToolPageShell>
