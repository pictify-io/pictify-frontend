<script>
	/**
	 * /tools/linkedin-banner-generator — the v2 tool page, column mode.
	 *
	 * Category filter, gallery, preview and controls become the tool card; the
	 * quota ladder and Generate move to its toolbar. SEO copy is frozen.
	 */
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolCard from '$lib/components/tools/v2/ToolCard.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import ResultCard from '$lib/components/tools/v2/ResultCard.svelte';
	import AutomateSection from '$lib/components/tools/v2/AutomateSection.svelte';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import ToolEditor from '$lib/components/tools/ToolEditor.svelte';
	import { page } from '$app/stores';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { user } from '../../../store/user.store';
	import {
		allTemplates
	} from '$lib/templates/linkedin-banner/index.js';
	import {
		LINKEDIN_BANNER_WIDTH,
		LINKEDIN_BANNER_HEIGHT,
	} from '$lib/pseo/linkedin-banner.js';
	import ToolSeoHead from '$lib/components/tools/v2/ToolSeoHead.svelte';
	import HeroTitle from '$lib/components/tools/v2/longform/HeroTitle.svelte';
	import HeroSub from '$lib/components/tools/v2/longform/HeroSub.svelte';
	import ProseGroup from '$lib/components/tools/v2/longform/ProseGroup.svelte';
	import StepCards from '$lib/components/tools/v2/longform/StepCards.svelte';

	// Social proof counter

	// User state - using reactive declaration
	$: isUserLoggedIn = !!$user?.email;

	// Debounce utility

	// File upload limits

	// Fonts



	// State
	/*
	 * The gallery for the embed. These templates already carry real names and
	 * categories, so nothing is derived here — unlike the OG set, which has no
	 * metadata at all.
	 */
	$: editorTemplates = allTemplates.map((t) => ({
		key: t.id,
		name: t.name,
		category: t.category,
		html: t.html
	}));

	/** One release of escape hatch, the same lever the other surfaces use. */
	$: useLegacyTool = $page?.url?.searchParams?.get?.('studio') === 'v1';

	let imageUrl = '';
	let isImageGenerating = false;

	// Editable content - dynamic variables based on template

	// Colors


	// Category icons

	// Filter templates


	// Helper to extract editable text from an element (excluding prefix spans)

	// Generate a human-readable label from an element id

	// Auto-detect variables from template HTML
	// Helper to escape HTML to prevent XSS

	// Helper to update element text while preserving prefix spans

	// Update the HTML in the iframe

	// Debounced HTML update for text inputs

	// Handle input changes for any template variable






	// Generate image



	let progress = tweened(0, {
		duration: 3000,
		easing: cubicOut
	});

	$: if (isImageGenerating) {
		progress.set(100);
	} else {
		progress.set(0);
	}

	// API example code - uses the generic /image endpoint with HTML


	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify LinkedIn Banner Generator',
		url: 'https://pictify.io/tools/linkedin-banner-generator',
		description:
			'Create professional LinkedIn banners in seconds: 20+ templates at the correct 1584×396 dimensions, free with API access.',
		applicationCategory: ['DesignApplication', 'BusinessApplication'],
		operatingSystem: 'Web',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		creator: { '@type': 'Organization', name: 'Pictify.io', url: 'https://pictify.io' }
	};

	const TOOL_NAME = 'linkedin_banner_generator';
	const TOOL_PATH = '/tools/linkedin-banner-generator';

	$: guestRemaining = Math.max(0, GUEST_DAILY_LIMIT - ($generationLimits?.count || 0));
	$: lastFreeRender = !isUserLoggedIn && guestRemaining <= 1;

	const linkedinBannerExamples = [
		{
			id: 'javascript',
			label: 'JavaScript',
			fileName: 'banner.js',
			code: `<span class="text-[#6a9955]">// Render a 1584x396 LinkedIn banner from HTML</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">response</span> = <span class="text-[#c586c0]">await</span> <span class="text-[#dcdcaa]">fetch</span>(<span class="text-[#ce9178]">'https://api.pictify.io/image'</span>, {
  <span class="text-[#9cdcfe]">method</span>: <span class="text-[#ce9178]">'POST'</span>,
  <span class="text-[#9cdcfe]">headers</span>: { <span class="text-[#ce9178]">'Content-Type'</span>: <span class="text-[#ce9178]">'application/json'</span>, <span class="text-[#ce9178]">'Authorization'</span>: <span class="text-[#ce9178]">'Bearer YOUR_API_KEY'</span> },
  <span class="text-[#9cdcfe]">body</span>: <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">stringify</span>({ <span class="text-[#9cdcfe]">html</span>: <span class="text-[#9cdcfe]">bannerHtml</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">1584</span>, <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">396</span> })
});

<span class="text-[#c586c0]">const</span> { <span class="text-[#9cdcfe]">image</span> } = <span class="text-[#c586c0]">await</span> <span class="text-[#9cdcfe]">response</span>.<span class="text-[#dcdcaa]">json</span>();
<span class="text-[#9cdcfe]">console</span>.<span class="text-[#dcdcaa]">log</span>(<span class="text-[#9cdcfe]">image</span>.<span class="text-[#9cdcfe]">url</span>); <span class="text-[#6a9955]">// personalize per teammate at scale</span>`
		},
		{
			id: 'python',
			label: 'Python',
			fileName: 'banner.py',
			code: `<span class="text-[#c586c0]">import</span> <span class="text-[#9cdcfe]">requests</span>

<span class="text-[#9cdcfe]">resp</span> = <span class="text-[#9cdcfe]">requests</span>.<span class="text-[#dcdcaa]">post</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>,
    <span class="text-[#9cdcfe]">headers</span>={<span class="text-[#ce9178]">"Authorization"</span>: <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>},
    <span class="text-[#9cdcfe]">json</span>={<span class="text-[#ce9178]">"html"</span>: <span class="text-[#9cdcfe]">banner_html</span>, <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">1584</span>, <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">396</span>})

<span class="text-[#dcdcaa]">print</span>(<span class="text-[#9cdcfe]">resp</span>.<span class="text-[#dcdcaa]">json</span>()[<span class="text-[#ce9178]">"url"</span>])`
		},
		{
			id: 'curl',
			label: 'cURL',
			fileName: 'banner.sh',
			code: `<span class="text-[#dcdcaa]">curl</span> -X POST <span class="text-[#ce9178]">https://api.pictify.io/image</span> \\
  -H <span class="text-[#ce9178]">"Content-Type: application/json"</span> \\
  -H <span class="text-[#ce9178]">"Authorization: Bearer YOUR_API_KEY"</span> \\
  -d <span class="text-[#ce9178]">'{"html":"&lt;div&gt;...&lt;/div&gt;","width":1584,"height":396}'</span>`
		}
	];

</script>

<ToolSeoHead
	title="Free LinkedIn Banner Generator | Create Professional Profile Banners | Pictify"
	description="Create stunning LinkedIn banners in seconds. Choose from 20+ professional templates designed for developers, designers, marketers, and more. Perfect 1584x396 dimensions guaranteed."
	keywords="linkedin banner generator, linkedin cover photo, linkedin background, profile banner, linkedin header, linkedin banner maker"
	canonical="https://pictify.io/tools/linkedin-banner-generator"
	ogTitle="Free LinkedIn Banner Generator | Pictify"
	ogDescription="Create professional LinkedIn banners in seconds. 20+ templates for developers, designers, marketers, and more."
	ogSiteName="Pictify"
	ogImage="https://pictify.io/og/tools/linkedin-banner-generator.png"
	ogImageWidth={1200}
	ogImageHeight={630}
	ogImageAlt="Pictify LinkedIn banner generator: free, 1584×396"
	twitterTitle="Free LinkedIn Banner Generator | Pictify"
	twitterDescription="Create professional LinkedIn banners in seconds. 20+ templates. Free, no watermark."
	twitterImage="https://pictify.io/og/tools/linkedin-banner-generator.png"
	webApplicationSchema={structuredData}
	breadcrumbLabel="LinkedIn Banner Generator"
/>

<ToolPageShell
	toolName={TOOL_NAME}
	toolPath={TOOL_PATH}
	breadcrumb="LINKEDIN BANNER"
	facts="FREE · 5 RENDERS A DAY · NO SIGNUP · 1584×396"
	loggedIn={isUserLoggedIn}
	hasResult={!!imageUrl}
	longform="column"
>
	<HeroTitle slot="h1">
		<span>LINKEDIN BANNER</span>
		<span>GENERATOR</span>
	</HeroTitle>

	<HeroSub slot="hero-sub">
		Choose from <span class="font-medium">{allTemplates.length}+ templates</span> designed for
		developers, marketers, designers, and professionals.
		<span class="text-brand-slate">Perfect 1584×396 dimensions guaranteed</span>
	</HeroSub>

	<div slot="tool">
		<!--
			TS-8. The banner is edited in place now, on the same embed as the OG
			generator. `?studio=v1` keeps a way back for one release.
		-->
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
				width={LINKEDIN_BANNER_WIDTH}
				height={LINKEDIN_BANNER_HEIGHT}
				sourceKind="linkedin"
				toolName="linkedin_banner_generator"
				downloadName="linkedin-banner"
				safeZone={{ side: 'left', percent: 20, label: 'Profile photo' }}
			/>
		{/if}
	</div>

	<div slot="result">
		{#if imageUrl}
			<ResultCard
				{imageUrl}
				formatLabel="PNG"
				fileExtension="png"
				width={LINKEDIN_BANNER_WIDTH}
				height={LINKEDIN_BANNER_HEIGHT}
				loggedIn={isUserLoggedIn}
				lastFree={lastFreeRender}
				toolName={TOOL_NAME}
				toolPath={TOOL_PATH}
			/>
		{/if}
	</div>

	<AutomateSection
		slot="automate"
		title="Automate with the"
		titleHighlight="API"
		toolName={TOOL_NAME}
		description="Generate LinkedIn banners programmatically. Render a 1584×396 cover from HTML with one POST — personalize per teammate or per campaign at scale."
		codeExamples={linkedinBannerExamples}
	/>

	<svelte:fragment slot="longform">
		<LongformSection index="01" id="how-to" first title="How to Add Your Banner to LinkedIn">
			<StepCards
				steps={[
					{
						title: 'Create Your Banner',
						body: 'Choose a template, customize it with your details, and download'
					},
					{
						title: 'Go to LinkedIn',
						body: 'Open your LinkedIn profile and click the camera icon on your cover photo'
					},
					{
						title: 'Upload & Save',
						body: 'Upload your new banner, adjust the crop if needed, and save your changes'
					}
				]}
			/>
		</LongformSection>

		<LongformSection index="02" id="size-guide" title="LinkedIn Banner Size Guide">
			<!--
				The ✓ and ! glyphs stay inside the heading text: they were part of it
				before, and this outline is frozen. They belong in a copy pass, not a
				layout one.
			-->
			<ProseGroup
				columns={2}
				items={[
					{
						heading: '✓ Recommended Dimensions',
						bullets: [
							{ html: 'Personal Profile: <strong>1584 x 396 pixels</strong>' },
							{ html: 'Company Page: <strong>1128 x 191 pixels</strong>' },
							{ html: 'Aspect Ratio: <strong>4:1</strong>' }
						]
					},
					{
						heading: '! Important Notes',
						bullets: [
							'Mobile App Profile Photo covers large left area (~600px)',
							'All templates now keep important text on the right side'
						]
					}
				]}
			/>
		</LongformSection>
	</svelte:fragment>

</ToolPageShell>
