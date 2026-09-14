<script>
	/**
	 * /free-account — the free tier's landing, on the v2 frame.
	 *
	 * The heading outline is the live one, in the same order: H1, "What You Get
	 * for Free" with its six H3s, "Guest vs Free vs Paid", "Ready to Get
	 * Started?", "Frequently Asked Questions". The closing call to action stays a
	 * numbered section ahead of the FAQ for that reason, rather than a band
	 * under it.
	 *
	 * Every number comes from plan-features.js and the guest limit store. The
	 * old page typed them in and had drifted (100 renders, unlimited templates,
	 * batches on the free tier); none of that is true of the plan.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '../../store/user.store';
	import { GUEST_DAILY_LIMIT } from '../../store/generationLimits.store';
	import { PLAN_FEATURES, PLANS, FEATURES } from '../../config/plan-features.js';
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import HeroTitle from '$lib/components/tools/v2/longform/HeroTitle.svelte';
	import HeroSub from '$lib/components/tools/v2/longform/HeroSub.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import Lead from '$lib/components/tools/v2/longform/Lead.svelte';
	import Prose from '$lib/components/tools/v2/longform/Prose.svelte';
	import FeatureGrid from '$lib/components/tools/v2/longform/FeatureGrid.svelte';
	import ComparisonTable from '$lib/components/tools/v2/longform/ComparisonTable.svelte';
	import FaqList from '$lib/components/tools/v2/longform/FaqList.svelte';

	$: isLoggedIn = !!$user?.email;

	onMount(() => {
		// If already logged in, redirect to dashboard
		if (isLoggedIn) {
			goto('/dashboard');
		}
	});

	const free = PLAN_FEATURES[PLANS.STARTER];
	const basic = PLAN_FEATURES[PLANS.BASIC];
	const freeRenders = free[FEATURES.RENDERS];
	const freeTemplates = free[FEATURES.TEMPLATES_SAVED];
	const paidRenders = basic[FEATURES.RENDERS];
	const paidTemplates = basic[FEATURES.TEMPLATES_SAVED];
	const yesNo = (value) => (value ? 'Yes' : 'No');

	const crumbs = [{ label: 'FREE TIER' }];

	const freeFeatures = [
		{
			title: 'Watermark-Free Images',
			body: 'Generate clean images without any Pictify branding'
		},
		{
			title: 'Free API Key',
			body: `${freeRenders} image generations per month via REST API`
		},
		{
			title: 'Save Templates',
			body: `Store up to ${freeTemplates} templates in your workspace`
		},
		{
			title: 'Generation History',
			body: 'Access your past generations anytime'
		},
		{
			title: 'CDN Hosting',
			body: 'All images served from global CDN'
		},
		{
			title: 'Email Support',
			body: 'Get help when you need it'
		}
	];

	const comparisonColumns = ['Feature', 'Guest', 'Free account', 'Paid plans'];
	const comparisonRows = [
		['Renders', `${GUEST_DAILY_LIMIT} a day`, `${freeRenders} a month`, `From ${paidRenders.toLocaleString('en-US')} a month`],
		['Watermark-free', 'Yes', 'Yes', 'Yes'],
		['Renders kept', 'No', 'Yes', 'Yes'],
		['API access', 'No', yesNo(free[FEATURES.API_ACCESS]), yesNo(basic[FEATURES.API_ACCESS])],
		['Saved templates', 'No', String(freeTemplates), `From ${paidTemplates}`],
		['Batch rendering', 'No', yesNo(free[FEATURES.BATCH_RENDER]), yesNo(basic[FEATURES.BATCH_RENDER])]
	];

	const faqs = [
		{
			q: 'Do I need a credit card?',
			a: "No. Free accounts are completely free forever. You only need an email address to sign up. We'll never charge you unless you explicitly upgrade to a paid plan."
		},
		{
			q: 'What happens when I hit the limit?',
			a: "Your limit resets at the start of each month. If you need more generations, you can upgrade to a paid plan anytime. We'll never automatically charge you."
		},
		{
			q: 'Can I use free images commercially?',
			a: 'Yes! All images generated with a free account are yours to use however you want, including commercial projects. No attribution required.'
		},
		{
			q: 'How do I get my API key?',
			a: 'After signing up, go to your Dashboard and click "API Token" in the sidebar. You can create and manage your API keys from there.'
		}
	];
</script>

<svelte:head>
	<title>Free Account Benefits | Pictify.io</title>
	<meta
		name="description"
		content="Create a free Pictify account: 50 renders a month, watermark-free images, full API access and up to 3 saved templates. No credit card required."
	/>
	<link rel="canonical" href="https://pictify.io/free-account" />
	<meta property="og:title" content="Free Account Benefits | Pictify.io" />
	<meta
		property="og:description"
		content="Create a free Pictify account: 50 renders a month, watermark-free images, full API access and up to 3 saved templates."
	/>
	<meta property="og:url" content="https://pictify.io/free-account" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Pictify" />
	<meta property="og:image" content="https://pictify.io/og/v2/free-account.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Pictify: 50 free renders per month, no credit card" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Free Account Benefits | Pictify" />
	<meta name="twitter:description" content="50 free renders/month. No credit card. No watermark. Full API access." />
	<meta name="twitter:image" content="https://pictify.io/og/v2/free-account.png" />
</svelte:head>

<ToolPageShell
	{crumbs}
	facts={`${freeRenders} RENDERS A MONTH · NO CARD`}
	longform="column"
	loggedIn={isLoggedIn}
	showSignup={false}
	showRelated={false}
	showClosing={false}
>
	<HeroTitle slot="h1">
		Unlock the Full<br />
		<span>Pictify Experience</span>
	</HeroTitle>

	<HeroSub slot="hero-sub">
		Create a free account in 30 seconds. No credit card required. Get watermark-free images and API
		access instantly.
	</HeroSub>

	<div slot="hero-actions" class="flex flex-wrap items-center gap-x-6 gap-y-3">
		<a
			href="/signup"
			class="rounded-lg bg-brand-ink px-7 py-4 font-sans text-base font-semibold text-white shadow-[3px_3px_0_0_#FF48B0] transition-opacity hover:opacity-90"
		>
			Create free account
		</a>
		<p class="font-sans text-[15px] text-brand-ink">
			Already have an account?
			<a href="/login" class="font-semibold underline underline-offset-4">Log in</a>
		</p>
	</div>

	<svelte:fragment slot="longform">
		<LongformSection index="01" id="what-you-get" first title="What You Get for Free">
			<FeatureGrid items={freeFeatures} columns={3} titleTag="h3" />
		</LongformSection>

		<LongformSection index="02" id="compare" title="Guest vs Free vs Paid">
			<Lead>
				See exactly what you get with a free account compared to guest access and paid plans.
			</Lead>
			<ComparisonTable columns={comparisonColumns} rows={comparisonRows} />
		</LongformSection>

		<LongformSection index="03" id="get-started" title="Ready to Get Started?">
			<Prose>
				<p>
					Join 10,000+ developers generating images at scale. Create your free account in seconds.
				</p>
			</Prose>
			<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
				<a
					href="/signup"
					class="w-max rounded-lg bg-brand-ink px-6 py-3.5 font-sans text-[15px] font-semibold text-white shadow-[3px_3px_0_0_#FF48B0] transition-opacity hover:opacity-90"
				>
					Create Free Account
				</a>
				<a
					href="/tools"
					class="w-max rounded-lg border-[1.5px] border-brand-ink bg-brand-paper px-6 py-3.5 font-sans text-[15px] font-semibold text-brand-ink transition-colors hover:bg-brand-subtle"
				>
					Try Tools First
				</a>
			</div>
		</LongformSection>

		<LongformSection index="04" id="faq" title="Frequently Asked Questions">
			<FaqList {faqs} />
		</LongformSection>
	</svelte:fragment>
</ToolPageShell>
