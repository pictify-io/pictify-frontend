<script>
	/**
	 * /tools/[usecase] — the v2 tool page, column mode.
	 *
	 * Nine use cases share this route. Three of them (markdown, table, barcode)
	 * ship their own self-contained editor; the rest render the template
	 * workbench, which is the only branch with a toolbar action here. SEO copy
	 * is frozen.
	 */
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolCard from '$lib/components/tools/v2/ToolCard.svelte';
	import QuotaMeter from '$lib/components/tools/v2/QuotaMeter.svelte';
	import ToolEditor from '$lib/components/tools/ToolEditor.svelte';
	import MarkdownEditor from '$lib/components/tools/MarkdownEditor.svelte';
	import TableEditor from '$lib/components/tools/TableEditor.svelte';
	import BarcodeEditor from '$lib/components/tools/BarcodeEditor.svelte';
	import AutomateSection from '$lib/components/tools/v2/AutomateSection.svelte';
	import ToolSeoHead from '$lib/components/tools/v2/ToolSeoHead.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import HeroTitle from '$lib/components/tools/v2/longform/HeroTitle.svelte';
	import HeroSub from '$lib/components/tools/v2/longform/HeroSub.svelte';
	import Lead from '$lib/components/tools/v2/longform/Lead.svelte';
	import Prose from '$lib/components/tools/v2/longform/Prose.svelte';
	import ProseGroup from '$lib/components/tools/v2/longform/ProseGroup.svelte';
	import StepCards from '$lib/components/tools/v2/longform/StepCards.svelte';
	import CheckList from '$lib/components/tools/v2/longform/CheckList.svelte';
	import FaqList from '$lib/components/tools/v2/longform/FaqList.svelte';
	import RelatedLinks from '$lib/components/tools/v2/longform/RelatedLinks.svelte';
	import { page } from '$app/stores';
	import {
		useCases,
		useCaseDetails,
		formats,
		popularSizes,
		parseSize
	} from '$lib/pseo/config.js';
	import { getHtmlTemplatesForUseCase } from '$lib/pseo/useCaseHtmlTemplates.js';
	import { user } from '../../../store/user.store';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';

	// User login state
	let isUserLoggedIn = false;
	user.subscribe((userData) => {
		isUserLoggedIn = !!userData?.email;
	});

	$: useCaseId = $page.params.usecase;
	$: config = useCaseDetails[useCaseId];
	$: useCase = config ? useCases.find((u) => u.id === useCaseId) : null;
	$: validCase = !!useCase;
	$: title = validCase
		? config.seoTitle || `${config.label} | Pictify.io`
		: 'Use Case | Pictify.io';
	$: description = validCase
		? config.description
		: 'Convert HTML to images instantly with Pictify.io.';
	$: canonical = validCase ? `https://pictify.io/tools/${useCaseId}` : 'https://pictify.io/tools';

	// Generation state

	// Quick generate from the edited HTML template.
	// Uses the public HTML endpoint (no auth required, rate limited) — the same
	// render engine as the authenticated /image API.
	// HTML starter templates for this use case (empty for the code-editor tools)
	/**
	 * Which "From a …" block each of these tools opens with, from the §9b matrix.
	 * Anything not listed is a card with two or three fields, which is the
	 * shape the membership and portfolio tools want.
	 */
	const SOURCE_KIND = {
		'social-proof-card': 'social-proof',
		'email-header': 'email-header',
		badge: 'badge',
		leaderboard: 'table',
		'membership-card': 'card',
		'portfolio-card': 'card'
	};
	/** A leaderboard is rows before it is prose. */
	const INPUTS_FIRST = new Set(['leaderboard']);

	/*
	 * These template sets already carry names and descriptions, so nothing is
	 * derived. They do NOT carry `template-*` ids, so the tokeniser finds no
	 * variables in them — Inputs says so honestly, and a visitor can promote any
	 * text to a variable with "Show a variable here". Giving them ids is a
	 * content pass, not a code one.
	 */
	$: editorTemplates = toolTemplates.map((t) => ({
		key: t.id,
		name: t.name,
		category: null,
		html: t.html
	}));

	$: toolTemplates = validCase ? getHtmlTemplatesForUseCase(useCaseId) : [];
	$: templateWidth = toolTemplates[0]?.width || 1200;
	$: templateHeight = toolTemplates[0]?.height || 630;

	// Escape HTML for code display
	function escapeHtml(source) {
		return source
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function highlightCurl(source) {
		const escaped = escapeHtml(source);
		return escaped
			.replace(/^curl/m, '<span class="token-command">curl</span>')
			.replace(/ (-H|-d)/g, (match) => ` <span class="token-flag">${match.trim()}</span>`)
			.replace(/https:\/\/[^\s\\]+/g, (match) => `<span class="token-url">${match}</span>`)
			.replace(/'([^']*)'/g, (match) => `<span class="token-string">${match}</span>`)
			.replace(/\n/g, '<br>');
	}

	$: renderedApiCode = highlightCurl(apiSnippet);

	/**
	 * The hand-rolled dark window is gone; AutomateSection takes the same
	 * snippet in the shape every other tool page uses.
	 */
	$: codeExamples = [{ id: 'curl', label: 'cURL', fileName: 'render.sh', code: renderedApiCode }];
	$: plainExamples = { curl: apiSnippet };

	/** The deep dive, as sub-points of section 01 rather than its own band. */
	$: deepDive = [
		...(config?.longDescription
			? [{ heading: 'The Context', bodyHtml: config.longDescription.replace(/\n/g, '<br/>') }]
			: []),
		...(config?.useCaseScenarios?.length
			? [{ heading: 'Who uses this?', bullets: config.useCaseScenarios }]
			: [])
	];

	/** Same hrefs and anchor text the pill list carried. */
	$: relatedWorkflowLinks = [
		...(config?.related || []).map((id) => ({
			href: `/tools/${id}`,
			label: useCaseDetails[id]?.label || id
		})),
		{ href: '/tools', label: 'View All Tools →' }
	];

	$: formatOptions =
		config && config.recommendedFormats && config.recommendedFormats.length
			? config.recommendedFormats
			: formats.map((f) => f.id);
	$: sizeOptions =
		config && config.recommendedSizes && config.recommendedSizes.length
			? config.recommendedSizes
			: popularSizes;

	// Structured data for SEO
	$: structuredData = validCase
		? {
				'@context': 'https://schema.org',
				'@type': 'WebApplication',
				name: `${config.label} - Pictify.io`,
				url: canonical,
				description: config.description,
				applicationCategory: ['DesignApplication', 'ImageGenerator'],
				operatingSystem: 'Web',
				offers: {
					'@type': 'Offer',
					price: '0',
					priceCurrency: 'USD',
					availability: 'https://schema.org/InStock'
				},
				featureList: config.benefits || [],
				creator: {
					'@type': 'Organization',
					name: 'Pictify.io',
					url: 'https://pictify.io'
				}
		  }
		: null;

	// FAQ structured data for SEO

	// API example snippet
	$: apiSnippet = `curl -X POST https://api.pictify.io/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "html": "<your-template-html>",
    "width": ${sizeOptions[0] ? parseSize(sizeOptions[0]).width || 1200 : 1200},
    "height": ${sizeOptions[0] ? parseSize(sizeOptions[0]).height || 630 : 630},
    "fileExtension": "${formatOptions[0] || 'png'}"
  }'`;

	const TOOL_NAME = 'usecase_tool';

	$: guestRemaining = Math.max(0, GUEST_DAILY_LIMIT - ($generationLimits?.count || 0));

	// Three neighbours from the same shelf on /tools, so the cards match the hub.
	const RELATED = ['html-to-image', 'csv-to-pdf', 'certificate-generator'];
</script>

<ToolSeoHead
	{title}
	{description}
	{canonical}
	robots="index, follow, max-image-preview:large"
	keywords="{config?.seoKeywords?.join(', ') ||
		config?.label ||
		'HTML to Image'}, image generator, automation, Pictify, API"
	ogTitle={title}
	ogDescription={description}
	ogImage={config?.ogImage || 'https://media.pictify.io/qyl7z-1775406830860.png'}
	twitterTitle={title}
	twitterDescription={description}
	twitterImage={config?.ogImage || 'https://media.pictify.io/qyl7z-1775406830860.png'}
	webApplicationSchema={structuredData}
	faqs={validCase ? config.faqs : null}
	breadcrumbLabel={config?.label || 'Tool'}
/>

{#if validCase}
	<ToolPageShell
		toolName={TOOL_NAME}
		toolPath={`/tools/${useCaseId}`}
		breadcrumb={config.label.toUpperCase()}
		facts="FREE · 5 RENDERS A DAY · NO SIGNUP · RENDER BY API"
		related={RELATED}
		loggedIn={isUserLoggedIn}
			longform="column"
	>
		<HeroTitle slot="h1">
			Generate
			<span>{config.label}</span>
		</HeroTitle>

		<HeroSub slot="hero-sub">
			{config.description}
			<span class="text-brand-slate">
				Design once, render variants via API, the infrastructure layer for programmatic media.
			</span>
		</HeroSub>

		<div slot="tool">
			<!--
				The three self-contained editors carry their own generate button and
				result, so their card's toolbar shows the quota ladder only — one
				primary action per surface, and it is already inside the editor.
			-->
			{#if useCaseId === 'markdown' || useCaseId === 'table' || useCaseId === 'barcode-generator'}
				<ToolCard>
					<div class="p-5 lg:p-7">
						{#if useCaseId === 'markdown'}
							<MarkdownEditor {isUserLoggedIn} />
						{:else if useCaseId === 'table'}
							<TableEditor {isUserLoggedIn} />
						{:else}
							<BarcodeEditor />
						{/if}
					</div>

					<svelte:fragment slot="toolbar-left">
						<span class="font-mono text-xs tracking-[0.06em] text-brand-mute">
							{config.label.toUpperCase()}
						</span>
					</svelte:fragment>

					<svelte:fragment slot="toolbar-right">
						<QuotaMeter
							remaining={guestRemaining}
							loggedIn={isUserLoggedIn}
							toolName={TOOL_NAME}
							toolPath={`/tools/${useCaseId}`}
						/>
					</svelte:fragment>
				</ToolCard>
			{:else if toolTemplates.length}
				<!--
					TS-8. Six of the pSEO tools — social proof, email header, badge,
					membership and portfolio cards, leaderboard — share this branch, so
					they move onto the embed in one change rather than six.
				-->
				<!--
					`toolName` is the use-case id, NOT the page's shared `usecase_tool`.
					The editor keys its local draft on that name, so one name for nine
					tools meant the badge page restored whatever you last made on the
					social proof page — a testimonial card under a gallery of badges.
				-->
				<ToolEditor
					templates={editorTemplates}
					width={templateWidth}
					height={templateHeight}
					sourceKind={SOURCE_KIND[useCaseId] || 'card'}
					toolName={useCaseId}
					downloadName={useCaseId}
					defaultTab={INPUTS_FIRST.has(useCaseId) ? 'inputs' : 'say'}
				/>
			{:else}
				<ToolCard>
					<div
						class="flex h-[315px] w-full items-center justify-center border border-brand-ink bg-brand-subtle"
					>
						<p class="font-bold text-brand-mute">Preview not available</p>
					</div>
				</ToolCard>
			{/if}
		</div>


		<!--
			The API block moves out of the reading column into the automate slot,
			where every other tool route carries it. Its heading is the component's
			"Automate with the API" — one word longer than the hand-rolled h2 it
			replaces.
		-->
		<AutomateSection
			slot="automate"
			toolName={TOOL_NAME}
			description="Trigger this workflow programmatically. Personalized images, generated instantly at scale."
			{codeExamples}
			{plainExamples}
		/>

		<svelte:fragment slot="longform">
			<LongformSection index="01" id="overview" first title="Why teams choose this workflow">
				{#if config.overview?.length}
					<Lead>{config.overview[0]}</Lead>
					{#if config.overview.length > 1}
						<Prose>
							{#each config.overview.slice(1) as paragraph}
								<p>{paragraph}</p>
							{/each}
						</Prose>
					{/if}
				{/if}

				{#if deepDive.length}
					<ProseGroup items={deepDive} />
				{/if}
			</LongformSection>

			<LongformSection index="02" id="problems-solved" title="Problems Solved">
				<CheckList items={config.painPoints} />
			</LongformSection>

			<LongformSection index="03" id="workflow" title="Step-by-step workflow">
				<StepCards
					steps={config.workflow.map((step) => ({ title: step.title, body: step.detail }))}
					jumpTo="/signup"
					jumpLabel="Start Creating Now →"
				/>
			</LongformSection>

			<LongformSection index="04" id="faq" title="Frequently Asked Questions">
				<FaqList faqs={config.faqs} />
			</LongformSection>
		</svelte:fragment>

		<svelte:fragment slot="footer-links">
			<RelatedLinks links={relatedWorkflowLinks} toolName={TOOL_NAME} eyebrow="RELATED WORKFLOWS" />
		</svelte:fragment>
	</ToolPageShell>
{:else}
	<div class="landing-v2 flex min-h-screen w-full flex-col bg-brand-canvas">
		<Nav />
		<main class="flex flex-1 items-center justify-center px-5 py-24">
			<div
				class="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-8 px-4"
			>
				<div
					class="flex h-24 w-24 items-center justify-center rounded-full border border-brand-ink bg-brand-pink text-4xl font-semibold text-white"
				>
					?
				</div>
				<HeroTitle>Workflow not found</HeroTitle>
				<a
					href="/tools"
					class="px-8 py-4 bg-brand-field border border-brand-ink text-brand-ink font-semibold tracking-wider transition-all rounded-xl"
				>
					Explore All Tools
				</a>
			</div>
		</main>
		<Footer />
	</div>
{/if}
