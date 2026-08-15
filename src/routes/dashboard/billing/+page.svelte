<script>
	/**
	 * Usage & billing — the meter first, then the plan, then every invoice.
	 *
	 * The old page opened with subscription controls and buried usage below
	 * them, which answers the question nobody arrives with. People come here to
	 * find out how much of the month they have spent and whether they are about
	 * to be stopped, so the meter is the page's first and largest object.
	 *
	 * Plan and overage invoices are ONE list. They are two collections behind
	 * the scenes, and that was visible as two tables — an implementation detail
	 * the reader has to reconcile themselves.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { analytics } from '$lib/telemetry.js';
	import { plgStatus, initPLG, PLAN_DISPLAY_NAMES } from '../../../store/plg.store';
	import { openUpgradeModal } from '../../../store/upgrade-modal.store';
	import { getRenders } from '../../../api/media.js';
	import {
		getInvoices,
		getOverageInvoices,
		getBillingPreferences,
		cancelSubscription
	} from '../../../api/billing.js';
	import { PLAN_FEATURES, FEATURES, normalizePlan } from '../../../config/plan-features.js';
	import ConfirmModal from '$lib/components/billing/ConfirmModal.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { showToast } from '../../../store/toast.store.js';

	let loaded = false;
	let formatCounts = null;
	let invoices = [];
	let prefs = null;
	let cancelOpen = false;
	let cancelling = false;

	// QA hatches, same convention as every other v2 page.
	$: preview = $page.url.searchParams.get('preview');
	$: forceAtCap = preview === 'at-cap';
	$: forceFree = preview === 'free';

	// One quota source for the whole app: the plg store, fed by
	// GET /api/users/plans. The rail meter and the Renders daybook read the
	// same values, so the three cannot disagree.
	$: used = forceAtCap ? ($plgStatus?.usage?.limit ?? 0) : ($plgStatus?.usage?.current ?? 0);
	$: limit = $plgStatus?.usage?.limit ?? 0;
	$: pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
	$: atCap = forceAtCap || (limit > 0 && used >= limit);
	$: plan = forceFree ? 'starter' : normalizePlan($plgStatus?.plan || 'starter');
	$: planName = PLAN_DISPLAY_NAMES[plan] || 'Free';
	$: isPaid = plan !== 'starter';
	$: resetLabel = $plgStatus?.resetDate
		? new Date($plgStatus.resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
		: null;

	$: templateCap = PLAN_FEATURES[plan]?.[FEATURES.TEMPLATES_SAVED] ?? null;
	$: limitsLine = [
		`${limit.toLocaleString()} renders a month`,
		templateCap !== null ? `${templateCap} templates` : null,
		'watermark-free files'
	]
		.filter(Boolean)
		.join(' · ');

	$: breakdown = formatCounts
		? ['PNG', 'PDF', 'GIF', 'MP4']
				.filter((f) => (formatCounts[f] || 0) > 0)
				.map((f) => `${f} ${formatCounts[f]}`)
				.join(' · ')
		: null;

	$: overagesOn = Boolean(prefs?.allowOverages);

	const money = (cents) =>
		typeof cents === 'number' ? `$${(cents / 100).toFixed(2)}` : null;

	async function load() {
		try {
			const [renders, planInvoices, overage, preferences] = await Promise.all([
				// Month-scoped counts come from the same endpoint the Renders page
				// uses, so the breakdown here and the chips there cannot drift.
				getRenders({ window: 'month', limit: 1 }).catch(() => null),
				getInvoices({ limit: 24 }).catch(() => null),
				getOverageInvoices().catch(() => null),
				getBillingPreferences().catch(() => null)
			]);

			formatCounts = renders?.counts || null;
			prefs = preferences?.preferences || preferences || null;

			// Merge the two sources into one reverse-chronological list. Shape is
			// normalized here so the row markup doesn't branch per source.
			const planRows = (planInvoices?.invoices || []).map((i) => ({
				id: i.id || i.uid || i.invoiceId,
				date: i.createdAt || i.date || i.issuedAt,
				description: i.description || `${planName} — ${i.interval || 'monthly'}`,
				amountCents: i.totalCents ?? i.amountCents ?? i.total ?? null,
				status: (i.status || 'paid').toLowerCase(),
				url: i.receiptUrl || i.invoiceUrl || i.url || null
			}));
			const overageRows = (overage?.invoices || overage?.overageInvoices || []).map((i) => ({
				id: i.id || i.uid,
				date: i.createdAt || i.periodEnd || i.date,
				description: i.description || `Overage — ${i.period || 'this period'}`,
				amountCents: i.amountCents ?? i.totalCents ?? null,
				status: (i.status || 'paid').toLowerCase(),
				url: i.receiptUrl || i.invoiceUrl || i.url || null
			}));

			invoices = [...planRows, ...overageRows]
				.filter((r) => r.date)
				.sort((a, b) => new Date(b.date) - new Date(a.date));
		} finally {
			loaded = true;
		}
	}

	async function doCancel() {
		cancelling = true;
		try {
			const res = await cancelSubscription();
			// The billing wrappers resolve with a payload rather than throwing on
			// a refusal, so a falsy result is the failure signal.
			if (!res) throw new Error('Could not cancel that subscription.');
			showToast('Plan cancelled. You keep access until the period ends.', 'success', 5000);
			cancelOpen = false;
			await load();
		} catch (e) {
			showToast(e?.message || 'Could not cancel that subscription.', 'error', 5000);
		} finally {
			cancelling = false;
		}
	}

	onMount(() => {
		initPLG();
		load().then(() => analytics.track('billing_v2_viewed', { plan, atCap }));
	});
</script>

<svelte:head><title>Usage & billing | Pictify.io</title></svelte:head>

<Toast />

<div class="min-h-full w-full px-6 py-8 lg:px-11 lg:py-9">
	<div class="mx-auto flex max-w-page flex-col gap-6">
		<div class="flex flex-col justify-between gap-2 lg:flex-row lg:items-end">
			<h1 class="font-display text-[44px] font-extrabold leading-[44px] tracking-[-0.02em] text-brand-ink">
				Usage &amp; billing
			</h1>
			<p class="font-sans text-sm text-brand-mute">
				What you've used, what you pay, and every invoice.
			</p>
		</div>

		<!-- Meter -->
		<section class="flex flex-col gap-3 rounded-card border border-brand-rule px-6 py-5">
			<div class="flex flex-wrap items-baseline justify-between gap-2">
				<span class="flex items-baseline gap-2">
					<span class="font-mono text-[40px] font-semibold leading-none {atCap ? 'text-brand-alarm' : 'text-brand-ink'}">
						{used.toLocaleString()}
					</span>
					<span class="font-mono text-sm text-brand-mute">
						/ {limit.toLocaleString()} renders this month
					</span>
				</span>
				{#if resetLabel}
					<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
						Resets {resetLabel}
					</span>
				{/if}
			</div>

			<div class="h-2.5 w-full overflow-hidden rounded-full bg-brand-subtle" role="img" aria-label="{pct}% of this month's renders used">
				<div
					class="h-full rounded-full {atCap ? 'bg-brand-alarm' : 'bg-brand-field'}"
					style="width: {Math.max(pct, used > 0 ? 2 : 0)}%"
				></div>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-2">
				<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
					{breakdown || (loaded ? 'No renders yet this month' : '…')}
				</span>
				{#if atCap && !overagesOn}
					<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-alarm">
						Cap reached — renders are paused
					</span>
				{:else if overagesOn}
					<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
						Overages on{prefs?.overageRateCents
							? ` — ${money(prefs.overageRateCents)} per render past the cap`
							: ''}{typeof prefs?.accruedCents === 'number'
							? ` · ${money(prefs.accruedCents)} this month`
							: ''}
					</span>
				{:else}
					<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
						Overages off — renders pause at the cap
					</span>
				{/if}
			</div>
		</section>

		<!-- Plan -->
		<section class="flex flex-col justify-between gap-4 rounded-card border border-brand-rule px-6 py-5 sm:flex-row sm:items-center">
			<div class="flex flex-col gap-1">
				<span class="flex items-center gap-2.5">
					<span class="font-display text-xl font-extrabold tracking-[-0.02em] text-brand-ink">{planName}</span>
					<span
						class="rounded-[3px] px-[7px] py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] {isPaid
							? 'bg-brand-field text-brand-ink'
							: 'bg-brand-powder text-brand-royal'}"
					>
						{isPaid ? 'Paid' : 'Free'}
					</span>
				</span>
				<span class="font-sans text-[13.5px] text-brand-slate">{limitsLine}</span>
				<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
					Payment &amp; receipts handled by Lemon Squeezy
				</span>
			</div>
			<div class="flex flex-shrink-0 items-center gap-4">
				{#if isPaid}
					<button
						type="button"
						on:click={() => (cancelOpen = true)}
						class="font-sans text-[13px] text-brand-slate underline underline-offset-[3px] hover:text-brand-ink"
					>
						Cancel plan
					</button>
				{/if}
				<button
					type="button"
					on:click={() => {
						analytics.track('billing_upgrade_clicked', { plan });
						openUpgradeModal('billing_page');
					}}
					class="flex items-center gap-2 rounded-btn bg-brand-ink px-[18px] py-2.5 font-sans text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
				>
					{isPaid ? 'Change plan' : 'Upgrade'}
					<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
				</button>
			</div>
		</section>

		<!-- Invoices -->
		<section class="flex w-full flex-col pt-2">
			<div class="flex items-center gap-3 pb-1">
				<h2 class="font-mono text-xs font-medium uppercase tracking-[0.06em] text-brand-ink">Invoices</h2>
				<span class="h-0.5 flex-1 bg-brand-ink/[0.08]"></span>
				<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
					Plan + overage, one list
				</span>
			</div>

			{#if !loaded}
				<div class="flex flex-col gap-2 pt-3" aria-hidden="true">
					{#each Array(3) as _}
						<div class="h-[46px] animate-pulse rounded-btn bg-brand-canvas"></div>
					{/each}
				</div>
			{:else if invoices.length === 0}
				<p class="py-6 font-sans text-sm text-brand-slate">
					No invoices yet — they appear here once you're on a paid plan.
				</p>
			{:else}
				{#each invoices as inv (inv.id || inv.date + inv.description)}
					<div class="flex w-full items-center gap-4 border-b border-brand-rule py-3.5">
						<span class="w-[110px] flex-shrink-0 font-mono text-xs text-brand-slate">
							{new Date(inv.date).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric'
							})}
						</span>
						<span class="min-w-0 flex-1 truncate font-sans text-[13.5px] text-brand-ink">
							{inv.description}
						</span>
						<span class="w-[90px] flex-shrink-0 text-right font-mono text-[13px] text-brand-ink">
							{money(inv.amountCents) ?? '—'}
						</span>
						<span class="flex w-[70px] flex-shrink-0 justify-center">
							<span
								class="rounded-[3px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] {inv.status ===
								'paid'
									? 'border-brand-proof text-brand-proof'
									: 'border-brand-alarm text-brand-alarm'}"
							>
								{inv.status}
							</span>
						</span>
						<span class="flex w-[110px] flex-shrink-0 justify-end">
							{#if inv.url}
								<a
									href={inv.url}
									target="_blank"
									rel="noopener noreferrer"
									class="rounded-btn border border-brand-rule px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink"
								>
									Download
								</a>
							{/if}
						</span>
					</div>
				{/each}
			{/if}
		</section>
	</div>
</div>

<ConfirmModal
	open={cancelOpen}
	variant="danger"
	title="Cancel your plan?"
	description="You keep access until the end of the current period. After that you drop to the free plan and renders pause at its cap."
	confirmText="Cancel plan"
	cancelText="Keep my plan"
	loading={cancelling}
	on:confirm={doCancel}
	on:cancel={() => (cancelOpen = false)}
/>
