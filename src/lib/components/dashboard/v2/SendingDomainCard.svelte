<script>
	/**
	 * Where delivery emails send from, stated as a status rather than a setup
	 * wizard: a domain that isn't verified means mail silently doesn't arrive,
	 * which is worth a red dot, not a paragraph.
	 *
	 * Same data as the v1 EmailSendingCard (GET /sending-domain) — this is the
	 * v2 face of it, not a second source. Replacing the old team page took the
	 * v1 card off screen with it, so the DNS records it used to show are
	 * rendered here rather than linked to a page that no longer exists.
	 */
	import { onMount } from 'svelte';
	import { showToast } from '../../../../store/toast.store.js';
	import {
		getSendingDomain,
		provisionSendingDomain,
		verifySendingDomain
	} from '../../../../api/sending.js';

	let loaded = false;
	let shared = null;
	let identity = null;
	let busy = false;
	let showRecords = false;

	$: verified = identity?.status === 'verified';
	$: failed = identity?.status === 'failed';

	async function load() {
		try {
			const res = await getSendingDomain();
			shared = res?.shared || null;
			identity = res?.identity || null;
		} catch {
			// A card that can't load its status says nothing rather than claiming
			// a state it doesn't know.
			identity = null;
		} finally {
			loaded = true;
		}
	}

	async function act() {
		busy = true;
		try {
			if (!identity) {
				const res = await provisionSendingDomain();
				identity = res?.identity || null;
				showToast('Sending domain created — DNS is verifying.', 'success', 5000);
			} else {
				const res = await verifySendingDomain();
				identity = res?.identity || identity;
				showToast(
					res?.identity?.status === 'verified'
						? 'Domain verified.'
						: 'Still verifying — DNS can take a few minutes.',
					res?.identity?.status === 'verified' ? 'success' : 'error',
					5000
				);
			}
		} catch (e) {
			showToast(e?.message || 'That did not go through.', 'error', 4000);
		} finally {
			busy = false;
		}
	}

	onMount(load);
</script>

<div class="flex flex-col justify-between gap-4 rounded-card border border-brand-rule px-6 py-5 sm:flex-row sm:items-center">
	<div class="flex min-w-0 flex-col gap-1">
		<span class="flex items-center gap-2.5">
			<span
				class="block h-[9px] w-[9px] flex-shrink-0 {verified
					? 'bg-brand-proof'
					: failed
						? 'bg-brand-alarm'
						: 'border border-brand-mute bg-brand-subtle'}"
				aria-hidden="true"
			></span>
			<span class="truncate font-mono text-[13px] font-medium text-brand-ink">
				{identity?.domain || shared?.fromAddress || 'send.pictify.io'}
			</span>
		</span>
		{#if !loaded}
			<span class="font-sans text-[13px] text-brand-mute">Checking…</span>
		{:else if verified}
			<span class="font-sans text-[13px] text-brand-slate">
				Verified — delivery emails send from your own domain.
			</span>
		{:else if identity}
			<span class="font-sans text-[13px] text-brand-alarm">
				Not verified — emails won't send until the DNS records are in place.
			</span>
		{:else}
			<span class="font-sans text-[13px] text-brand-slate">
				Sending on the shared domain. A dedicated one keeps your delivery reputation yours.
			</span>
		{/if}
	</div>

	<div class="flex flex-shrink-0 items-center gap-2">
		{#if loaded}
			{#if verified}
				{#if (identity?.dnsRecords || []).length}
					<button
						type="button"
						on:click={() => (showRecords = !showRecords)}
						class="rounded-btn border border-brand-rule px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink"
					>
						DNS records
					</button>
				{/if}
			{:else}
				<button
					type="button"
					on:click={act}
					disabled={busy}
					class="rounded-btn bg-brand-ink px-3.5 py-2 font-sans text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
				>
					{busy ? 'Working…' : identity ? 'Verify' : 'Get my domain'}
				</button>
			{/if}
		{/if}
	</div>
</div>

{#if showRecords && (identity?.dnsRecords || []).length}
	<div class="mt-2 flex flex-col gap-2 rounded-card border border-brand-rule bg-brand-subtle px-6 py-4">
		{#each identity.dnsRecords as record (record.name + record.type)}
			<div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 font-mono text-[11px]">
				<span class="w-[52px] flex-shrink-0 uppercase tracking-[0.06em] text-brand-mute">
					{record.type}
				</span>
				<span class="min-w-0 flex-shrink-0 break-all text-brand-ink">{record.name}</span>
				<span class="min-w-0 break-all text-brand-slate">{record.value}</span>
			</div>
		{/each}
	</div>
{/if}
