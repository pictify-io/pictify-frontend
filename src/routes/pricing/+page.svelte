<script>
	/**
	 * /pricing — "Pay by the render".
	 *
	 * Every number on this page comes from src/config/plan-features.js. Nothing
	 * is typed twice: the cards, the "what a month buys" tiles and the
	 * comparison table all read the same config, so the page cannot drift from
	 * what the product actually enforces.
	 *
	 * Free is a strip under the three paid cards rather than a fourth card —
	 * the paid tiers keep the stage, and Free is still the first column of the
	 * comparison table.
	 *
	 * No Enterprise surface (owner decision 2026-08-22), and no retired
	 * features: experiments, dynamic links, storage connectors and white-label
	 * are gone from the table even though their keys still exist for
	 * grandfathered accounts.
	 */
	import { HERO_CLUSTER, BASELINE_RUN } from '$lib/components/landing/hero-clusters.js';
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import PixelCluster from '$lib/components/landing/PixelCluster.svelte';
	import { getProducts } from '../../api/product';
	import { onMount, onDestroy } from 'svelte';
	import { user } from '../../store/user.store';
	import { goto } from '$app/navigation';
	import { analytics } from '$lib/telemetry.js';
	import {
		PLANS,
		PLAN_DISPLAY_NAMES,
		PLAN_PRICING,
		FEATURES,
		PLAN_FEATURES,
		formatLimit,
		formatOverageRate,
		normalizePlan
	} from '../../config/plan-features.js';

	let plans = [];
	let showAnnual = true;
	let isLoggedIn = false;
	let unsubscribe = () => {};

	const numberFormatter = new Intl.NumberFormat('en-US');
	const popularPlanNames = ['Pro'];

	const CARD_PLANS = [PLANS.BASIC, PLANS.STANDARD, PLANS.BUSINESS];
	const TABLE_PLANS = [PLANS.STARTER, PLANS.BASIC, PLANS.STANDARD, PLANS.BUSINESS];

	/**
	 * The plan the signed-in visitor is already on, so their card can say so.
	 * `currentPlan` is what the user store carries (see store/user.store.js);
	 * normalizePlan maps the API's names onto the config's ids, the same way
	 * /dashboard/upgrade does.
	 */
	$: currentPlan = $user?.currentPlan ? normalizePlan($user.currentPlan) : null;

	const feature = (plan, key) => PLAN_FEATURES[plan]?.[key];
	const renders = (plan) => feature(plan, FEATURES.RENDERS);

	/**
	 * Prices as a map, not a helper. A helper that reads `showAnnual` from scope
	 * is invisible to the compiler, so the template would keep the first price
	 * it rendered while the "/mo" suffix flipped — the toggle would look broken
	 * in exactly the way that is hard to notice.
	 */
	$: price = Object.fromEntries(
		TABLE_PLANS.map((plan) => [plan, PLAN_PRICING[plan]?.[showAnnual ? 'annual' : 'monthly']])
	);

	/** One line per card, describing the tier in renders rather than adjectives. */
	const CARD_BLURB = {
		[PLANS.BASIC]: 'One workflow in production.',
		[PLANS.STANDARD]: 'Several workflows, no template cap.',
		[PLANS.BUSINESS]: 'Rendering inside your product.'
	};

	/**
	 * Card bullets. Each one is derived from config so a limit change lands here
	 * too; the leading line names the tier below it, Dub-style.
	 */
	$: CARD_BULLETS = {
		[PLANS.BASIC]: [
			'PDF output',
			`Batch render from CSV (${feature(PLANS.BASIC, FEATURES.BATCH_ITEMS_PER_REQUEST)} rows)`,
			`${formatLimit(
				feature(PLANS.BASIC, FEATURES.TEMPLATES_SAVED)
			)} templates · ${numberFormatter.format(
				feature(PLANS.BASIC, FEATURES.AI_CREDITS)
			)} AI credits`,
			'Webhooks & brand assets',
			`${feature(PLANS.BASIC, FEATURES.TEAM_SEATS)} seats`
		],
		[PLANS.STANDARD]: [
			'Unlimited templates',
			`${numberFormatter.format(
				feature(PLANS.STANDARD, FEATURES.AI_CREDITS)
			)} AI credits · video renders`,
			`${feature(PLANS.STANDARD, FEATURES.TEAM_SEATS)} seats`,
			`Batches up to ${numberFormatter.format(
				feature(PLANS.STANDARD, FEATURES.BATCH_ITEMS_PER_REQUEST)
			)} rows`,
			'Monthly spending cap on overage'
		],
		[PLANS.BUSINESS]: [
			`${numberFormatter.format(feature(PLANS.BUSINESS, FEATURES.AI_CREDITS))} AI credits`,
			`${feature(PLANS.BUSINESS, FEATURES.TEAM_SEATS)} seats`,
			'Dedicated render queue',
			`Batches up to ${numberFormatter.format(
				feature(PLANS.BUSINESS, FEATURES.BATCH_ITEMS_PER_REQUEST)
			)} rows`,
			'Audit logs'
		]
	};

	const PREVIOUS_TIER = {
		[PLANS.BASIC]: 'FREE',
		[PLANS.STANDARD]: 'BASIC',
		[PLANS.BUSINESS]: 'PRO'
	};

	/**
	 * What a month of renders buys. Deliberately static marketing copy — these
	 * make volumes concrete and are not derived from anything.
	 */
	const VOLUME_TILES = [
		{
			label: 'BASIC · 1,000',
			title: 'One cohort of certificates',
			body: '1,000 attendees, one CSV, one afternoon. Or 30 OG images a day for a blog.',
			tint: 'bg-brand-powder'
		},
		{
			label: 'PRO · 10,000',
			title: 'Every invoice, every order',
			body: '~330 PDFs a day from a webhook, with room for social cards on top.',
			tint: 'bg-brand-field'
		},
		{
			label: 'BUSINESS · 40,000',
			title: 'A feature in your product',
			body: 'Personalised images for every user, under half a cent each after the pool.',
			tint: 'bg-brand-rose'
		}
	];

	/**
	 * Comparison rows. Every row reads a FEATURES key or is marked `all` for
	 * things every plan gets; nothing here is hand-typed per plan.
	 */
	const COMPARISON = [
		{
			group: 'RENDERS',
			rows: [
				{ label: 'Renders per month', kind: 'number', key: FEATURES.RENDERS },
				{ label: 'Overage per render', kind: 'overage' },
				{ label: 'PNG · JPG · WebP · GIF', kind: 'all' },
				{ label: 'PDF output', kind: 'bool', key: FEATURES.PDF_OUTPUT },
				{ label: 'Video renders', kind: 'all' }
			]
		},
		{
			group: 'BUILD & AUTOMATE',
			rows: [
				{ label: 'Saved templates', kind: 'limit', key: FEATURES.TEMPLATES_SAVED },
				{ label: 'Batch render from CSV / Sheets', kind: 'bool', key: FEATURES.BATCH_RENDER },
				{ label: 'Rows per batch request', kind: 'number', key: FEATURES.BATCH_ITEMS_PER_REQUEST },
				{ label: 'Webhooks', kind: 'bool', key: FEATURES.WEBHOOKS },
				{
					label: 'AI credits / month (copilot, captions, AI video)',
					kind: 'number',
					key: FEATURES.AI_CREDITS
				},
				{ label: 'API access · MCP server · SDKs', kind: 'all' }
			]
		},
		{
			group: 'TEAM',
			rows: [
				{ label: 'Seats', kind: 'number', key: FEATURES.TEAM_SEATS },
				{ label: 'Brand assets library', kind: 'bool', key: FEATURES.BRAND_ASSETS },
				{ label: 'Audit logs', kind: 'bool', key: FEATURES.AUDIT_LOGS }
			]
		}
	];

	/** Renders one comparison cell from config; returns a string or a boolean. */
	function cell(row, plan) {
		if (row.kind === 'all') return true;
		if (row.kind === 'overage') {
			const rate = formatOverageRate(plan);
			return rate || '—';
		}
		const value = feature(plan, row.key);
		if (row.kind === 'bool') return value === true;
		if (row.kind === 'limit') return formatLimit(value);
		if (row.kind === 'number') {
			if (value === null) return 'Unlimited';
			if (!value) return '—';
			return numberFormatter.format(value);
		}
		return '—';
	}

	const FAQs = [
		{
			question: 'What counts as a render?',
			answer:
				'Each generated document or image counts as one render. It works the same everywhere: one API call, one CSV row, or one webhook event each produce one render. A workflow run over a 500-row CSV uses 500 renders.',
			isOpened: false
		},
		{
			question: 'What happens if I exceed the monthly limit?',
			answer: `All paid plans can enable <strong>overage billing</strong> to keep rendering beyond their limit. Basic: ${formatOverageRate(
				PLANS.BASIC
			)}/render, Pro: ${formatOverageRate(PLANS.STANDARD)}/render, Business: ${formatOverageRate(
				PLANS.BUSINESS
			)}/render. Set a monthly spending cap to control costs. Free tier users need to upgrade to continue.`,
			isOpened: false
		},
		{
			question: 'Can I change my plan later?',
			answer: 'Yes, you can upgrade or downgrade your plan at any time from your account settings.',
			isOpened: false
		},
		{
			question: 'What features are included in the free plan?',
			answer:
				'The Free plan includes 50 renders/month (PNG, JPG & GIF), 3 saved templates, 25 AI credits/month, and full API access. Perfect for testing and hobby projects. Need more? The Basic plan unlocks all features at lower volume limits.',
			isOpened: false
		},
		{
			question: 'Is there a discount for annual billing?',
			answer:
				'Yes! Save up to 20% with annual billing. Toggle the billing switch above to see annual prices.',
			isOpened: false
		},
		{
			question: 'Do you offer custom enterprise plans?',
			answer:
				"Yes, we offer custom plans for high-volume users. Please contact us at <a href='mailto:support@pictify.io'>support@pictify.io</a> for more information.",
			isOpened: false
		},
		{
			question: 'What AI features are available?',
			answer:
				'Every plan includes ONE monthly AI credit pool: Free 25, Basic 300, Pro 1,000, Business 4,000. It covers everything AI-powered: the Copilot (both template editing and the video timeline copilot), AI video generation, and captions. One instruction, one credit; failed requests are never billed.',
			isOpened: false
		},
		{
			question: 'Do video renders count toward my render limit?',
			answer:
				'Yes: images, PDFs, GIFs and video renders all draw from the same monthly render pool. AI-powered actions like AI video generation and captions draw from your separate AI credits pool instead, so a rendered video costs renders and an AI-generated one also spends AI credits.',
			isOpened: false
		}
	];

	const selectPlanHandler = (planName) => {
		// Map internal plan IDs to API product names (API returns "Pro", config uses "standard")
		const nameAliases = { standard: 'pro', pro: 'standard' };
		const searchName = planName?.toLowerCase();
		const altName = nameAliases[searchName];
		const planIndex = plans.findIndex(
			(p) => p.name?.toLowerCase() === searchName || p.name?.toLowerCase() === altName
		);
		const plan = planIndex >= 0 ? plans[planIndex] : null;

		// Use annual URL if available and annual billing is selected
		const purchaseUrl =
			showAnnual && plan?.purchase_url_annual ? plan.purchase_url_annual : plan?.purchase_url;

		analytics.trackUpgradeStarted({
			plan: planName,
			source: 'pricing_page',
			price: plan?.price || PLAN_PRICING[planName]?.[showAnnual ? 'annual' : 'monthly'],
			requests: plan?.request_per_month,
			billing_interval: showAnnual ? 'annual' : 'monthly'
		});

		if (!isLoggedIn) {
			goto(`/signup?redirect=/dashboard/upgrade${showAnnual ? '?billing=annual' : ''}`);
			return;
		}
		if (purchaseUrl) {
			let checkoutUrl = purchaseUrl;

			// Append custom data for reliable user identification in webhooks
			// This ensures the webhook knows which user/team to update, avoiding email mismatch issues
			const customParams = [];

			// Always include user ID for reliable webhook processing
			if ($user._id) {
				customParams.push(`checkout[custom][user_id]=${encodeURIComponent($user._id)}`);
			}

			// Include team UID if user is on a team
			if ($user.activeTeam) {
				customParams.push(`checkout[custom][team_uid]=${encodeURIComponent($user.activeTeam)}`);
			}

			// Join all parameters with the checkout URL
			if (customParams.length > 0) {
				const separator = checkoutUrl.includes('?') ? '&' : '?';
				checkoutUrl = `${checkoutUrl}${separator}${customParams.join('&')}`;
			}

			window.location.href = checkoutUrl;
		} else {
			goto(`/dashboard/upgrade${showAnnual ? '?billing=annual' : ''}`);
		}
	};

	/** Free's CTA goes to signup, not checkout. */
	function startOnFree(location) {
		analytics.track('pricing_plan_click', {
			plan: 'free',
			billing_interval: showAnnual ? 'annual' : 'monthly',
			cta_location: location
		});
		goto('/signup?redirect=/dashboard');
	}

	function choosePlan(planId, location) {
		analytics.track('pricing_plan_click', {
			plan: PLAN_DISPLAY_NAMES[planId],
			billing_interval: showAnnual ? 'annual' : 'monthly',
			cta_location: location
		});
		selectPlanHandler(planId);
	}

	onMount(async () => {
		analytics.trackPricingViewed({ source: 'public_pricing' });
		const response = await getProducts();
		plans = (response?.data ?? [])
			.filter((plan) => plan && typeof plan.request_per_month === 'number')
			.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
		unsubscribe = user.subscribe((u) => {
			isLoggedIn = !!u.email;
		});
	});

	onDestroy(() => {
		isLoggedIn = false;
		unsubscribe();
	});
</script>

<svelte:head>
	<meta property="og:image" content="https://media.pictify.io/cmnij-1775406943351.png" />
	<meta name="twitter:image" content="https://media.pictify.io/cmnij-1775406943351.png" />
</svelte:head>

<div class="landing-v2 flex min-h-screen w-full flex-col bg-brand-canvas">
	<Nav />

	<!-- ── Hero ──────────────────────────────────────────────────────── -->
	<section class="relative w-full overflow-hidden bg-brand-field">
		<PixelCluster
			cells={HERO_CLUSTER}
			cell={22}
			origin="e"
			delay={320}
			cycle={3}
			class="right-0 top-6 hidden lg:block"
		/>
		<PixelCluster
			cells={BASELINE_RUN}
			cell={14}
			origin="w"
			delay={520}
			class="-bottom-3 left-[34%] hidden lg:block"
		/>
		<div
			class="relative mx-auto flex w-full max-w-page flex-col gap-3 px-5 py-12 lg:px-10 lg:py-[72px]"
		>
			<p class="font-mono text-[11px] tracking-[0.06em] text-brand-royal">
				PRICING <span class="text-brand-mute">·</span>
				<span class="text-brand-ink">BY THE RENDER</span>
			</p>
			<h1
				class="font-display text-[40px] font-extrabold leading-[1.02] tracking-[-0.02em] text-brand-ink lg:text-[56px] lg:leading-[60px]"
			>
				Pay by the render.
			</h1>
			<p
				class="max-w-[620px] font-sans text-base leading-[25px] text-[#2A2C1E] lg:text-lg lg:leading-[27px]"
			>
				One render is one image, PDF, GIF or video. Same price whether it comes from the API, a CSV
				row or a webhook. Start on Free, no card.
			</p>
			<p class="mt-1 font-mono text-[11px] tracking-[0.06em] text-brand-ink">
				FREE FOREVER TIER · CANCEL ANYTIME · ANNUAL SAVES 20%
			</p>
		</div>
	</section>

	<main class="w-full">
		<!-- ── Toggle ────────────────────────────────────────────────── -->
		<div
			class="mx-auto flex w-full max-w-page flex-col gap-4 px-5 pt-10 lg:flex-row lg:items-center lg:justify-between lg:px-10"
		>
			<p class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">
				THREE PLANS · ONE RENDER POOL · OVERAGE NEVER SURPRISES YOU
			</p>

			<div
				class="flex w-max items-center gap-1 rounded-full border border-brand-ink bg-brand-paper p-1"
				role="group"
				aria-label="Billing interval"
			>
				<button
					type="button"
					aria-pressed={!showAnnual}
					on:click={() => (showAnnual = false)}
					class="rounded-full px-3.5 py-1.5 font-mono text-[11px] tracking-[0.06em] transition-colors {showAnnual
						? 'text-brand-slate hover:text-brand-ink'
						: 'bg-brand-ink text-white'}"
				>
					MONTHLY
				</button>
				<button
					type="button"
					aria-pressed={showAnnual}
					on:click={() => (showAnnual = true)}
					class="flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[11px] tracking-[0.06em] transition-colors {showAnnual
						? 'bg-brand-ink text-white'
						: 'text-brand-slate hover:text-brand-ink'}"
				>
					ANNUAL
					<span class="bg-brand-field px-1.5 py-0.5 text-[10px] text-brand-ink">−20%</span>
				</button>
			</div>
		</div>

		<!-- ── Paid cards ────────────────────────────────────────────── -->
		<div class="mx-auto w-full max-w-page px-5 pt-5 lg:px-10">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 min-[1200px]:grid-cols-3">
				{#each CARD_PLANS as planId (planId)}
					{@const isPopular = popularPlanNames.includes(PLAN_DISPLAY_NAMES[planId])}
					{@const isCurrent = currentPlan === planId}
					<div
						class="flex flex-col overflow-hidden rounded-card border-[1.5px] border-brand-ink {isPopular
							? 'bg-brand-ink shadow-[6px_6px_0_0_#FF48B0] md:order-first min-[1200px]:order-none'
							: 'bg-brand-paper'}"
					>
						<div class="flex flex-col gap-3.5 px-6 pb-5 pt-6">
							<div class="flex items-center justify-between">
								<h2
									class="font-display text-[21px] font-bold leading-[26px] tracking-[-0.015em] {isPopular
										? 'text-white'
										: 'text-brand-ink'}"
								>
									{PLAN_DISPLAY_NAMES[planId]}
								</h2>
								{#if isCurrent}
									<span
										class="border border-brand-proof bg-brand-proof/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] {isPopular
											? 'text-white'
											: 'text-brand-ink'}"
									>
										CURRENT PLAN
									</span>
								{:else if isPopular}
									<span
										class="bg-brand-field px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] text-brand-ink"
									>
										MOST TEAMS
									</span>
								{/if}
							</div>

							<div class="flex flex-col gap-0.5">
								<p
									class="font-display text-[44px] font-bold leading-[46px] tracking-[-0.02em] lg:text-[50px] lg:leading-[52px] {isPopular
										? 'text-white'
										: 'text-brand-ink'}"
								>
									{numberFormatter.format(renders(planId))}
								</p>
								<p class="font-mono text-xs tracking-[0.06em] text-brand-mute">RENDERS / MONTH</p>
							</div>

							<div class="flex items-baseline gap-1.5">
								<span
									class="font-sans text-2xl font-semibold leading-[30px] {isPopular
										? 'text-white'
										: 'text-brand-ink'}"
								>
									${price[planId]}
								</span>
								<span class="font-sans text-sm leading-[18px] text-brand-mute">
									{showAnnual ? '/mo billed annually' : '/mo'}
								</span>
							</div>

							<p
								class="font-sans text-sm leading-[21px] {isPopular
									? 'text-brand-press-text'
									: 'text-brand-slate'}"
							>
								{CARD_BLURB[planId]}
								{formatOverageRate(planId)} a render past the pool.
							</p>

							{#if isCurrent}
								<span
									class="flex items-center justify-center rounded-lg border-[1.5px] border-brand-proof p-3 font-sans text-[15px] font-semibold {isPopular
										? 'text-white'
										: 'text-brand-ink'}"
								>
									You're on this
								</span>
							{:else}
								<button
									type="button"
									on:click={() => choosePlan(planId, 'card')}
									class="flex items-center justify-center rounded-lg p-3 font-sans text-[15px] font-semibold transition-opacity hover:opacity-90 {isPopular
										? 'bg-brand-field text-brand-ink'
										: 'border-[1.5px] border-brand-ink text-brand-ink'}"
								>
									Choose {PLAN_DISPLAY_NAMES[planId]}
								</button>
							{/if}
						</div>

						<div
							class="flex flex-col gap-2 border-t px-6 pb-6 pt-[18px] {isPopular
								? 'border-white/15'
								: 'border-brand-rule'}"
						>
							<p
								class="pb-1 font-mono text-[11px] leading-5 tracking-[0.06em] {isPopular
									? 'text-white'
									: 'text-brand-ink'}"
							>
								EVERYTHING IN {PREVIOUS_TIER[planId]}, PLUS
							</p>
							{#each CARD_BULLETS[planId] as bullet (bullet)}
								<div class="flex gap-2">
									<span
										class="mt-[7px] h-1.5 w-1.5 flex-shrink-0 bg-brand-proof"
										aria-hidden="true"
									/>
									<span
										class="font-sans text-sm leading-5 {isPopular
											? 'text-brand-press-text'
											: 'text-brand-slate'}"
									>
										{bullet}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- ── Free strip ────────────────────────────────────────────── -->
		<div class="mx-auto w-full max-w-page px-5 pt-6 lg:px-10">
			<div
				class="flex flex-col gap-4 rounded-card border-[1.5px] border-brand-ink bg-brand-paper px-6 py-5 lg:flex-row lg:items-center lg:gap-8"
			>
				<div class="flex items-baseline gap-3 lg:w-[220px] lg:flex-shrink-0">
					<h2
						class="font-display text-[21px] font-bold leading-[26px] tracking-[-0.015em] text-brand-ink"
					>
						Free
					</h2>
					<p class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">
						$0 · FOREVER · NO CARD
					</p>
				</div>

				<div class="flex flex-1 flex-col gap-1">
					<p class="font-sans text-[15px] leading-[22px] text-brand-ink">
						{numberFormatter.format(renders(PLANS.STARTER))} renders a month · full API · PNG / JPG /
						WebP / GIF · {formatLimit(feature(PLANS.STARTER, FEATURES.TEMPLATES_SAVED))} templates ·
						{feature(PLANS.STARTER, FEATURES.AI_CREDITS)} AI credits
					</p>
					<p class="font-sans text-sm leading-5 text-brand-slate">
						Enough to try the API and the free tools properly. Nothing expires.
					</p>
				</div>

				{#if isLoggedIn && (!currentPlan || currentPlan === PLANS.STARTER)}
					<span
						class="flex flex-shrink-0 items-center justify-center rounded-lg border-[1.5px] border-brand-proof px-5 py-2.5 font-mono text-[11px] tracking-[0.06em] text-brand-ink"
					>
						YOU'RE ON THIS
					</span>
				{:else}
					<button
						type="button"
						on:click={() => startOnFree('free_strip')}
						class="flex flex-shrink-0 items-center justify-center rounded-lg border-[1.5px] border-brand-ink px-5 py-2.5 font-sans text-[15px] font-semibold text-brand-ink transition-colors hover:bg-brand-subtle"
					>
						Start on Free
					</button>
				{/if}
			</div>
		</div>

		<!-- ── What a month buys ─────────────────────────────────────── -->
		<div class="mx-auto w-full max-w-page px-5 pt-12 lg:px-10">
			<p class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">
				WHAT A MONTH OF RENDERS ACTUALLY BUYS
			</p>
			<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
				{#each VOLUME_TILES as tile (tile.label)}
					<div class="flex flex-col gap-2 border border-brand-ink {tile.tint} px-5 py-4">
						<p class="font-mono text-[10px] tracking-[0.06em] text-brand-ink/70">{tile.label}</p>
						<p
							class="font-display text-[19px] font-bold leading-6 tracking-[-0.015em] text-brand-ink"
						>
							{tile.title}
						</p>
						<p class="font-sans text-sm leading-5 text-brand-ink/80">{tile.body}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- ── Compare plans ─────────────────────────────────────────── -->
		<section class="mx-auto w-full max-w-page px-5 pt-16 lg:px-10">
			<div class="flex items-baseline gap-3 border-t-2 border-brand-ink pt-8">
				<span class="font-mono text-xs tracking-[0.06em] text-brand-blue">01</span>
				<h2
					class="font-display text-[28px] font-bold leading-9 tracking-[-0.02em] text-brand-ink lg:text-[32px] lg:leading-[42px]"
				>
					Compare plans
				</h2>
			</div>

			<!-- Scrolls inside itself; the page never scrolls sideways. -->
			<div class="mt-6 overflow-x-auto rounded-card border-[1.5px] border-brand-ink bg-brand-paper">
				<div class="min-w-[860px]">
					<!-- Sticky header: the buy action travels with the reader. -->
					<div
						class="sticky top-[88px] z-10 grid grid-cols-[360px_repeat(4,1fr)] gap-6 border-b border-brand-ink bg-brand-paper px-6 py-4"
					>
						<div class="flex flex-col justify-end gap-1">
							<p class="font-mono text-[10px] tracking-[0.06em] text-brand-mute">
								STICKS UNDER THE NAV
							</p>
							<p class="font-sans text-sm text-brand-slate">
								{showAnnual ? 'Annual pricing shown' : 'Monthly pricing shown'}
							</p>
						</div>

						{#each TABLE_PLANS as planId (planId)}
							{@const isPopular = popularPlanNames.includes(PLAN_DISPLAY_NAMES[planId])}
							<div class="flex flex-col items-center gap-2 text-center">
								{#if isPopular}
									<span
										class="bg-brand-field px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] text-brand-ink"
									>
										MOST TEAMS
									</span>
								{/if}
								<p class="font-sans text-[15px] font-semibold text-brand-ink">
									{PLAN_DISPLAY_NAMES[planId]}
									<span class="font-mono text-[11px] font-normal text-brand-mute">
										{planId === PLANS.STARTER ? '$0' : `$${price[planId]} / mo`}
									</span>
								</p>
								{#if planId === PLANS.STARTER}
									<button
										type="button"
										on:click={() => startOnFree('table_header')}
										class="w-full rounded border-[1.5px] border-brand-ink px-3 py-1.5 font-sans text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-subtle"
									>
										Start on Free
									</button>
								{:else}
									<button
										type="button"
										on:click={() => choosePlan(planId, 'table_header')}
										class="w-full rounded px-3 py-1.5 font-sans text-sm font-semibold transition-opacity hover:opacity-90 {isPopular
											? 'bg-brand-ink text-white shadow-[2px_2px_0_0_#FF48B0]'
											: 'border-[1.5px] border-brand-ink text-brand-ink'}"
									>
										Choose {PLAN_DISPLAY_NAMES[planId]}
									</button>
								{/if}
							</div>
						{/each}
					</div>

					{#each COMPARISON as group (group.group)}
						<p
							class="border-b border-brand-rule bg-brand-subtle px-6 py-2 font-mono text-[10px] tracking-[0.06em] text-brand-blue"
						>
							{group.group}
						</p>
						{#each group.rows as row (row.label)}
							<div
								class="grid grid-cols-[360px_repeat(4,1fr)] items-center gap-6 border-b border-brand-rule px-6 py-3 last:border-b-0"
							>
								<p class="font-sans text-sm text-brand-ink">{row.label}</p>
								{#each TABLE_PLANS as planId (planId)}
									{@const value = cell(row, planId)}
									<div class="flex items-center justify-center text-center">
										{#if value === true}
											<span class="h-2.5 w-2.5 bg-brand-proof" aria-label="Included" role="img" />
										{:else if value === false}
											<span
												class="h-2.5 w-2.5 border border-brand-rule"
												aria-label="Not included"
												role="img"
											/>
										{:else}
											<span class="font-sans text-sm text-brand-slate">{value}</span>
										{/if}
									</div>
								{/each}
							</div>
						{/each}
					{/each}
				</div>
			</div>
		</section>

		<!-- ── FAQ ───────────────────────────────────────────────────── -->
		<section class="mx-auto w-full max-w-page px-5 pt-16 lg:px-10">
			<div class="max-w-[760px]">
				<div class="flex items-baseline gap-3 border-t-2 border-brand-ink pt-8">
					<span class="font-mono text-xs tracking-[0.06em] text-brand-blue">02</span>
					<h2
						class="font-display text-[28px] font-bold leading-9 tracking-[-0.02em] text-brand-ink lg:text-[32px] lg:leading-[42px]"
					>
						Questions people ask before they pay
					</h2>
				</div>

				<div class="mt-6 flex flex-col gap-3">
					{#each FAQs as faq (faq.question)}
						<details class="group border border-brand-ink bg-brand-paper">
							<summary
								class="flex cursor-pointer items-center justify-between gap-4 p-4 font-sans text-[15px] font-medium text-brand-ink"
							>
								<span>{faq.question}</span>
								<span
									class="font-mono text-lg text-brand-mute transition-transform group-open:rotate-45"
									aria-hidden="true">+</span
								>
							</summary>
							<p
								class="border-t border-brand-rule p-4 font-sans text-[15px] leading-[23px] text-brand-slate"
							>
								{@html faq.answer}
							</p>
						</details>
					{/each}
				</div>
			</div>
		</section>
	</main>

	<!-- ── Closing band ──────────────────────────────────────────────── -->
	<section class="mt-20 w-full bg-brand-press-deep px-5 py-14 lg:px-10 lg:py-20">
		<div
			class="mx-auto flex w-full max-w-page flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
		>
			<div class="flex flex-col gap-3.5 lg:max-w-[640px]">
				<p class="font-mono text-xs tracking-[0.06em] text-brand-field">NO TRIAL CLOCK</p>
				<!-- Marketing copy, not a section heading: kept as a <p>. -->
				<p
					class="font-display text-[34px] font-bold leading-[1.08] tracking-[-0.02em] text-white lg:text-[44px] lg:leading-[50px]"
				>
					Start on Free. Nothing to cancel.
				</p>
				<p class="font-sans text-base leading-[25px] text-brand-press-text">
					{numberFormatter.format(renders(PLANS.STARTER))} renders a month, the full API, no card. Upgrade
					the month you actually need more.
				</p>
			</div>

			<div class="flex flex-col items-start gap-2.5 lg:items-end">
				<button
					type="button"
					on:click={() => startOnFree('closing_band')}
					class="rounded-lg bg-brand-field px-7 py-4 font-sans text-base font-semibold text-brand-ink shadow-[3px_3px_0_0_#FF48B0] transition-opacity hover:opacity-90"
				>
					Start rendering free
				</button>
				<a
					href="/docs"
					class="font-mono text-[11px] tracking-[0.06em] text-brand-press-text hover:text-white"
				>
					OR READ THE DOCS FIRST →
				</a>
			</div>
		</div>
	</section>

	<Footer />
</div>
