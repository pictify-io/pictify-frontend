<script>
	/**
	 * The edition shell (handoff §2 decisions 1 and 2): breadcrumb, period and
	 * state chips, save state, and the five-step strip. Every step page renders
	 * inside it, so the buyer never loses track of which period they are editing
	 * — the single most expensive thing to get wrong in this product.
	 *
	 * The shell owns the fetch. Each step page reads the edition from context
	 * rather than fetching its own copy, so two panes cannot disagree about what
	 * state the edition is in.
	 */
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { page } from '$app/stores';
	import StepStrip from '$lib/components/campaigns/StepStrip.svelte';
	import { campaignsHome, campaignUrl } from '$lib/campaigns/nav';
	import { getEdition, campaignError } from '../../../../../../api/campaign';

	const edition = writable(null);
	const campaign = writable(null);
	const loadError = writable(null);
	const loading = writable(true);

	setContext('edition', { edition, campaign, reload });

	$: campaignUid = $page.params.campaignUid;
	$: editionUid = $page.params.editionUid;
	/** Where the user is, from the URL — not where the server thinks they are. */
	$: activeStep = $page.params.step || $page.url.pathname.split('/').filter(Boolean).pop();

	/**
	 * Refetch whenever the identifiers change. Named in the statement because
	 * Svelte only tracks identifiers that appear in it — a helper closing over
	 * them silently never re-runs on navigation between editions.
	 */
	$: if (campaignUid && editionUid) reload(campaignUid, editionUid);

	async function reload(cUid = campaignUid, eUid = editionUid) {
		loading.set(true);
		loadError.set(null);
		try {
			const data = await getEdition(cUid, eUid);
			edition.set(data.edition);
			campaign.set(data.campaign);
		} catch (err) {
			loadError.set(campaignError(err));
		} finally {
			loading.set(false);
		}
	}

	/** Server-sent. The client never decides a step is done or reachable. */
	$: steps = $edition?.steps || [];
</script>

<div data-v2 class="px-5 pt-6 md:px-11 md:pt-7">
	{#if $loadError}
		<div class="border-t border-brand-ink pt-6">
			<span class="flex items-center gap-2">
				<span class="block h-2 w-2 bg-brand-alarm" aria-hidden="true" />
				<span class="font-sans text-[14px] text-brand-slate">
					{$loadError.code === 'not_found' ? 'This edition no longer exists.' : $loadError.message}
				</span>
			</span>
			<a
				href={campaignsHome()}
				class="mt-2 inline-block font-sans text-[13.5px] text-brand-royal underline"
				>Back to campaigns</a
			>
		</div>
	{:else}
		<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
			<div class="flex flex-wrap items-center gap-2.5">
				<a
					href={campaignsHome()}
					class="font-sans text-[14px] text-brand-mute hover:text-brand-slate">Campaigns</a
				>
				<span class="font-sans text-[14px] text-brand-mute" aria-hidden="true">/</span>
				<a
					href={campaignUrl(campaignUid)}
					class="font-sans text-[16px] font-bold text-brand-ink hover:underline"
					>{$campaign?.name || '…'}</a
				>
				{#if $edition?.periodLabel}
					<span class="bg-brand-subtle px-2 py-1 font-mono text-[11px] text-brand-slate"
						>{$edition.periodLabel}{$campaign?.timezone ? ` · ${$campaign.timezone}` : ''}</span
					>
				{/if}
				{#if $edition?.stateLabel}
					<span class="border border-brand-rule px-2 py-1 font-mono text-[11px] text-brand-slate"
						>{$edition.stateLabel}</span
					>
				{/if}
			</div>

			<div class="flex items-center gap-4">
				{#if $edition?.savedLabel}
					<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute"
						>{$edition.savedLabel}</span
					>
				{/if}
				<a
					href={campaignUrl(campaignUid)}
					class="font-sans text-[13.5px] text-brand-royal hover:underline">Campaign settings</a
				>
			</div>
		</div>

		<div class="mt-4">
			<StepStrip {steps} {campaignUid} {editionUid} {activeStep} />
		</div>

		{#if $loading && !$edition}
			<div class="mt-8 h-64 animate-pulse bg-brand-subtle" aria-busy="true" />
		{:else}
			<!-- Work area + 340px summary panel, 40px gap; panel drops below at
			     ≤1024 (handoff §2 decision 2). Each step page supplies both. -->
			<div class="mt-7 flex flex-col gap-10 pb-16 xl:flex-row">
				<slot />
			</div>
		{/if}
	{/if}
</div>
