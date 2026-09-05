<script>
	/**
	 * /campaign-studio/[uid] — the campaign-context design studio. B01.
	 *
	 * A separate route from /template-workspace/html/[uid] on purpose. The
	 * platform studio there is shipped and working, and B06-3 requires it to
	 * keep working; rewriting the component both surfaces run on is the surest
	 * way to break one while testing the other. When the new shell has been
	 * through B06 the two can converge.
	 *
	 * Full-bleed, outside the dashboard rail: this is a three-zone editing
	 * surface, not a page inside a shell.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import StudioShell from '$lib/components/studio/v2/StudioShell.svelte';
	import StudioStart from '$lib/components/studio/v2/StudioStart.svelte';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import { editionUrl } from '$lib/campaigns/nav';
	import backend from '../../../service/backend';

	$: uid = $page.params.uid;
	/** Campaign context, so "Use this design" knows where to return. */
	$: campaignUid = $page.url.searchParams.get('campaign');
	$: editionUid = $page.url.searchParams.get('edition');
	$: inCampaign = Boolean(campaignUid && editionUid);

	let design = null;
	let campaign = null;
	let loadError = null;
	let busy = false;

	/** Field keys the design may bind to, from the campaign's metric contract. */
	$: availableFields = campaign
		? ['account_name', 'account_id', 'period', ...(campaign.metrics || []).map((m) => m.key)]
		: [];

	onMount(async () => {
		try {
			const res = await backend.get(`/templates/${uid}`);
			const t = res?.template;
			if (t) {
				design = {
					name: t.name || 'Campaign design',
					html: t.html || '',
					width: t.width || 1200,
					height: t.height || 800,
					// Revisions arrive with B04; until then the studio reports 1
					// rather than inventing a number other screens would contradict.
					revision: 1
				};
			}
		} catch (err) {
			loadError = 'Could not open that design.';
		}

		if (campaignUid) {
			try {
				const res = await backend.get(`/campaigns/${campaignUid}`);
				campaign = res?.campaign || null;
			} catch (err) {
				// A missing campaign only costs the field list; the studio still opens.
			}
		}
	});

	/** Returns to Setup, which is where "Use this design" is meaningful. */
	const back = () =>
		goto(inCampaign ? editionUrl(campaignUid, editionUid, 'setup') : '/dashboard/template');
</script>

<svelte:head><title>{design?.name || 'Design'} · Pictify studio</title></svelte:head>

{#if loadError}
	<div class="flex h-screen items-center justify-center bg-brand-canvas px-6">
		<div>
			<StatusSquare tone="blocked" label={loadError} />
			<button
				type="button"
				on:click={back}
				class="mt-3 block font-sans text-[13.5px] text-brand-royal underline">Go back</button
			>
		</div>
	</div>
{:else}
	<StudioShell
		design={design || { name: 'New design', html: '', width: 1200, height: 800, revision: 1 }}
		format={campaign?.format?.toUpperCase() || 'PNG'}
		breadcrumb={campaign ? `${campaign.name} · Setup` : null}
		campaignContext={inCampaign}
		saveState={design ? 'saved' : 'unsaved'}
		useDisabled={!design}
		statusNote={design ? null : 'Nothing drawn yet · describe the card on the left or import HTML'}
		on:back={back}
		on:use={back}
	>
		<svelte:fragment slot="left" let:leftTab>
			{#if leftTab === 'say' && !design}
				<StudioStart {availableFields} {busy} />
			{:else if leftTab === 'say'}
				<p class="font-sans text-[13.5px] text-brand-slate">
					Describe a change. It starts from what you see now.
				</p>
			{:else}
				<p class="font-sans text-[13.5px] text-brand-mute">
					The layers tree arrives with the visual stage.
				</p>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="composer">
			{#if design}
				<input
					placeholder="Describe a change…"
					class="h-10 w-full rounded-btn border border-brand-rule px-3 font-sans text-[13.5px] text-brand-ink placeholder:text-brand-mute"
				/>
			{/if}
		</svelte:fragment>
	</StudioShell>
{/if}
