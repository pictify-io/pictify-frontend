<script>
	/**
	 * Plans — one card per purchasable tier, three facts each, no feature matrix.
	 *
	 * A comparison table asks the reader to diff twenty rows to answer one
	 * question: which of these do I need. The limits that actually differ are
	 * renders, templates and seats, so those are the card, and everything else
	 * is left to the docs rather than padded into checkmarks.
	 *
	 * Prices come from /products (Lemon Squeezy), never from constants — a
	 * hardcoded price is a lie the moment billing changes it.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { analytics } from '$lib/telemetry.js';
	import { user } from '../../../store/user.store';
	import { plgStatus, initPLG } from '../../../store/plg.store';
	import { getProducts } from '../../../api/product';
	import { recordDiscountCodeUsed } from '../../../api/plg.js';
	import { PLAN_FEATURES, FEATURES, normalizePlan } from '../../../config/plan-features.js';

	let loaded = false;
	let products = [];
	let annual = false;

	$: discountCode = $page.url.searchParams.get('discount') || '';
	$: currentPlan = normalizePlan($plgStatus?.plan || 'starter');

	// Only tiers that are actually purchasable: the free tier is the account's
	// current state rather than something to buy, and legacy products are not
	// offered to new buyers (same filter v1 applied). The board drew four cards
	// but /products returns three sellable plans — the board was illustrative,
	// the data is the truth, so the grid renders what exists.
	const FEATURED = ['basic', 'standard', 'pro', 'business'];
	$: cards = products
		.filter((p) => p.purchase_url || p.purchase_url_annual)
		.map((p) => {
			const slug = normalizePlan(p.name);
			const features = PLAN_FEATURES[slug] || {};
			return {
				slug,
				name: p.name,
				price: annual ? p.price_annual_formatted : p.price_formatted,
				url: annual ? p.purchase_url_annual : p.purchase_url,
				// `null` in plan-features means UNLIMITED, not missing — treating it
				// as absent silently understated every paid tier's best feature.
				limits: [
					`${(p.request_per_month || 0).toLocaleString()} renders a month`,
					FEATURES.TEMPLATES_SAVED in features
						? features[FEATURES.TEMPLATES_SAVED] === null
							? 'Unlimited saved templates'
							: `${features[FEATURES.TEMPLATES_SAVED]} saved templates`
						: null,
					FEATURES.TEAM_SEATS in features
						? features[FEATURES.TEAM_SEATS] === null
							? 'Unlimited team seats'
							: `${features[FEATURES.TEAM_SEATS]} team seat${features[FEATURES.TEAM_SEATS] === 1 ? '' : 's'}`
						: null
				].filter(Boolean),
				isCurrent: slug === currentPlan
			};
		})
		.filter((c) => FEATURED.includes(c.slug))
		.slice(0, 4);

	// "Most picked" is the middle of the offered range rather than a hardcoded
	// tier, so removing a product doesn't leave the badge on nothing.
	$: recommended = cards.length > 2 ? cards[Math.min(1, cards.length - 1)].slug : null;

	function checkout(card) {
		if (!card.url || card.isCurrent) return;
		const params = [];
		if ($user?.email) params.push(`checkout[email]=${encodeURIComponent($user.email)}`);
		if ($user?._id) params.push(`checkout[custom][user_id]=${encodeURIComponent($user._id)}`);
		if ($user?.activeTeam) params.push(`checkout[custom][team_uid]=${encodeURIComponent($user.activeTeam)}`);
		if (discountCode) {
			params.push(`checkout[discount_code]=${encodeURIComponent(discountCode)}`);
			recordDiscountCodeUsed(discountCode, 'plans_page').catch(() => {});
		}
		const url = params.length ? `${card.url}?${params.join('&')}` : card.url;
		analytics.track('plan_checkout_started', { plan: card.slug, annual });
		window.location.href = url;
	}

	onMount(async () => {
		initPLG();
		try {
			const res = await getProducts();
			products = res?.data || res?.products || [];
		} finally {
			loaded = true;
		}
		analytics.track('plans_v2_viewed', { current: currentPlan });
	});
</script>

<svelte:head><title>Plans | Pictify.io</title></svelte:head>

<div class="min-h-full w-full px-6 py-8 lg:px-11 lg:py-9">
	<div class="mx-auto flex max-w-page flex-col gap-6">
		<div class="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
			<h1 class="font-display text-[44px] font-extrabold leading-[44px] tracking-[-0.02em] text-brand-ink">
				Plans
			</h1>
			<div class="flex items-center gap-3">
				<div class="flex gap-1.5" role="group" aria-label="Billing period">
					{#each [{ v: false, l: 'MONTHLY' }, { v: true, l: 'ANNUAL' }] as opt (opt.l)}
						<button
							type="button"
							on:click={() => (annual = opt.v)}
							aria-pressed={annual === opt.v}
							class="rounded-btn border px-3.5 py-1.5 font-mono text-[11px] tracking-[0.06em] {annual === opt.v
								? 'border-brand-ink bg-brand-field font-medium text-brand-ink'
								: 'border-brand-rule text-brand-slate hover:border-brand-ink'}"
						>
							{opt.l}
						</button>
					{/each}
				</div>
				<span class="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">
					Annual = 2 months free
				</span>
			</div>
		</div>

		{#if !loaded}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
				{#each Array(4) as _}
					<div class="h-[280px] animate-pulse rounded-card bg-brand-canvas"></div>
				{/each}
			</div>
		{:else if cards.length === 0}
			<p class="py-6 font-sans text-sm text-brand-slate">
				Plans aren't loading right now. Refresh, or contact support if it persists.
			</p>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				{#each cards as card (card.slug)}
					{@const isRec = card.slug === recommended && !card.isCurrent}
					<div
						class="flex h-full flex-col gap-4 rounded-card p-5 {isRec
							? 'border-2 border-brand-ink'
							: 'border border-brand-rule'}"
					>
						<div class="flex items-center gap-2">
							<span class="font-display text-lg font-extrabold tracking-[-0.02em] text-brand-ink">
								{card.name}
							</span>
							{#if card.isCurrent}
								<span class="rounded-[3px] bg-brand-powder px-[7px] py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-royal">
									Current
								</span>
							{:else if isRec}
								<span class="rounded-[3px] bg-brand-field px-[7px] py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-ink">
									Most picked
								</span>
							{/if}
						</div>

						<span class="font-display text-[28px] font-extrabold leading-none tracking-[-0.03em] text-brand-ink">
							{card.price}
						</span>

						<div class="flex flex-1 flex-col gap-1.5">
							{#each card.limits as line (line)}
								<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
									{line}
								</span>
							{/each}
						</div>

						<button
							type="button"
							disabled={card.isCurrent || !card.url}
							on:click={() => checkout(card)}
							class="w-full rounded-btn px-4 py-2.5 font-sans text-[13.5px] font-semibold transition-opacity {card.isCurrent
								? 'cursor-default bg-brand-subtle text-brand-mute'
								: 'bg-brand-ink text-white hover:opacity-90'}"
						>
							{card.isCurrent ? 'Your plan' : `Choose ${card.name}`}
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<span class="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">
			Payment &amp; receipts handled by Lemon Squeezy
		</span>
	</div>
</div>
