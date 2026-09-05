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
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import StudioShell from '$lib/components/studio/v2/StudioShell.svelte';
	import StudioStart from '$lib/components/studio/v2/StudioStart.svelte';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import { editionUrl } from '$lib/campaigns/nav';
	import backend from '../../../service/backend';
	import { showToast } from '../../../store/toast.store';
	import Toast from '$lib/components/Toast.svelte';

	$: uid = $page.params.uid;
	/** Campaign context, so "Use this design" knows where to return. */
	$: campaignUid = $page.url.searchParams.get('campaign');
	$: editionUid = $page.url.searchParams.get('edition');
	$: inCampaign = Boolean(campaignUid && editionUid);

	let design = null;
	let campaign = null;
	let edition = null;
	let loadError = null;
	let busy = false;

	/**
	 * S6 — an approved edition is frozen against this design.
	 *
	 * Read from the edition rather than inferred from the campaign, because
	 * approval is per edition: the same design can be safely edited for a draft
	 * period while an approved one still points at the revision it froze.
	 */
	$: editionApproved = edition?.state === 'approved' || Boolean(edition?.approvalId);

	/** Field keys the design may bind to, from the campaign's metric contract. */
	$: availableFields = campaign
		? ['account_name', 'account_id', 'period', ...(campaign.metrics || []).map((m) => m.key)]
		: [];

	/**
	 * Load reactively, in the BROWSER only.
	 *
	 * Three attempts, and each failure taught something worth keeping:
	 *
	 *   onMount alone — the ids come from the $page store and editionUid read
	 *   back falsy, so the edition fetch was skipped and the S6 banner never
	 *   appeared. Silently: there was no error, the branch simply never ran.
	 *
	 *   A `loadedFor` guard — a reactive statement that both READS and WRITES
	 *   the same variable re-runs against a stale value. load() fired four
	 *   times per page view.
	 *
	 *   Reactive without the browser guard — it then ran during SSR, where
	 *   backend.get has no cookie to send. Vite says it plainly ("Avoid calling
	 *   fetch eagerly during server side rendering") and the server-rendered
	 *   markup came back as the empty start state, which is what the browser
	 *   then hydrated.
	 *
	 * So: reactive, so navigating between editions reloads; browser-only, so it
	 * has a session; no guard, because the ids only change on navigation and
	 * none of them is written by load().
	 */
	$: if (browser && uid) load(uid, campaignUid, editionUid);

	async function load(designUid, cUid, eUid) {
		loadError = null;
		try {
			const res = await backend.get(`/templates/${designUid}`);
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
			return;
		}

		if (!cUid || !eUid) return;
		try {
			const res = await backend.get(`/campaigns/${cUid}/editions/${eUid}`);
			campaign = res?.campaign || null;
			edition = res?.edition || null;
		} catch (err) {
			// A missing edition only costs the field list and the S6 banner; the
			// studio still opens, because being unable to read context is not a
			// reason to refuse to show someone their own design. Logged rather
			// than swallowed — a silently missing banner is indistinguishable
			// from a design nobody has approved.
			console.warn('[campaign-studio] could not load edition context', err?.status, err?.message);
		}
	}

	/** Returns to Setup, which is where "Use this design" is meaningful. */
	const back = () =>
		goto(inCampaign ? editionUrl(campaignUid, editionUid, 'setup') : '/dashboard/template');

	/**
	 * S7 — "Use this design" returns to Setup with a toast naming the revision.
	 *
	 * The revision is in the message because Setup, Review and the export
	 * manifest all name it, and a buyer who has just made several edits needs to
	 * know WHICH one the edition now points at. "Design updated" alone would
	 * leave them to guess.
	 */
	async function useThisDesign() {
		if (!design) return;
		await goto(editionUrl(campaignUid, editionUid, 'setup'));
		showToast(
			editionApproved
				? `Using rev ${design.revision}. This edition needs approving again.`
				: `Using rev ${design.revision} for this edition.`,
			editionApproved ? 'error' : 'default',
			4000
		);
	}
</script>

<svelte:head><title>{design?.name || 'Design'} · Pictify studio</title></svelte:head>

<Toast />

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
		{editionApproved}
		on:back={back}
		on:use={useThisDesign}
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
