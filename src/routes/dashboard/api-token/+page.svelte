<script>
	import { maskApiKey } from '$lib/utils/api-key.js';
	/**
	 * Settings — keys, account, and the way out.
	 *
	 * Keys come first because they are the only thing here anyone visits on
	 * purpose. Rotation is the operation that carries consequence, so the page
	 * states that consequence next to the button rather than in a modal nobody
	 * reads.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { analytics } from '$lib/telemetry.js';
	import { user, activeApiToken, getAPITokenAction } from '../../../store/user.store';
	import { currentTeam, initializeTeamState } from '../../../store/team.store';
	import { notify } from '../../../store/toast.store.js';
	import { copyToClipboard, timeAgo } from '$lib/utils/format.js';
	import { getApiToken, createApiToken, deleteApiToken } from '../../../api/user.js';
	import { getRenders } from '../../../api/media.js';
	import { requestAccountDeletion } from '../../../api/account.js';
	import backend from '../../../service/backend';

	let loaded = false;
	let tokens = [];
	let lastApiRenderAt = null;
	let busy = '';
	let deleteOpen = false;
	let deleteConfirm = '';
	let deleting = false;

	$: teamName = $currentTeam?.name || '';
	$: expectedConfirm = teamName || $user?.email || '';

	const masked = (t) => maskApiKey(t, { fallback: '—' });

	async function load() {
		try {
			const [res, apiRenders] = await Promise.all([
				getApiToken().catch(() => null),
				// "Last used" is derived from the newest render attributed to the
				// api caller — the closest honest signal, since tokens carry no
				// lastUsedAt of their own. Account-wide, so with several keys it
				// answers "when was the API last called", not "which key".
				getRenders({ source: 'api', limit: 1 }).catch(() => null)
			]);
			tokens = res?.apiTokens || [];
			lastApiRenderAt = apiRenders?.renders?.[0]?.createdAt || null;
		} finally {
			loaded = true;
		}
	}

	async function newKey() {
		busy = 'new';
		try {
			const res = await createApiToken();
			if (!res) throw new Error('Could not create a key.');
			analytics.track('api_key_created');
			await load();
			await getAPITokenAction().catch(() => {});
		} catch (e) {
			notify.fail('Create key', e, { retry: () => newKey() });
		} finally {
			busy = '';
		}
	}

	async function rotate(token) {
		// eslint-disable-next-line no-alert
		if (
			!confirm(
				'Rotate this key?\n\nThe old key stops working immediately. Anything calling with it — your code, agents, automations — fails until you paste the new one in.'
			)
		)
			return;
		busy = token.uid;
		try {
			const created = await createApiToken();
			if (!created) throw new Error('Could not create the replacement key.');
			// Only revoke the old one once the replacement exists, so a failure
			// halfway leaves the account with a working key rather than none.
			const removed = await deleteApiToken(token.uid);
			if (!removed) throw new Error('New key created, but the old one is still active — revoke it manually.');
			analytics.track('api_key_rotated');
			notify.note('KEY ROTATED', 'Update your callers with the new one.');
			await load();
			await getAPITokenAction().catch(() => {});
		} catch (e) {
			notify.fail('Rotate key', e, { retry: () => rotate(token) });
			await load();
		} finally {
			busy = '';
		}
	}

	async function revoke(token) {
		// eslint-disable-next-line no-alert
		if (!confirm('Revoke this key?\n\nEverything calling with it stops working immediately.')) return;
		busy = token.uid;
		try {
			const res = await deleteApiToken(token.uid);
			if (!res) throw new Error('Could not revoke that key.');
			analytics.track('api_key_revoked');
			await load();
		} catch (e) {
			notify.fail('Revoke key', e, { retry: () => revoke(token) });
		} finally {
			busy = '';
		}
	}

	async function changePassword() {
		try {
			await backend.post('/auth/forgot-password', { email: $user?.email });
			notify.done('RESET LINK SENT', `Check ${$user?.email} for the link.`);
		} catch (e) {
			notify.fail('Send reset link', e, { retry: () => changePassword() });
		}
	}

	async function confirmDelete() {
		deleting = true;
		try {
			const res = await requestAccountDeletion(deleteConfirm);
			notify.note('ACCOUNT CLOSED', res?.message || 'Your account is closed.');
			analytics.track('account_deletion_requested');
			// The server dropped the session; get out of the dashboard.
			setTimeout(() => goto('/'), 1500);
		} catch (e) {
			notify.fail('Close account', e);
			deleting = false;
		}
	}

	onMount(async () => {
		await initializeTeamState();
		await load();
		analytics.track('settings_v2_viewed');
	});
</script>

<svelte:head><title>Settings | Pictify.io</title></svelte:head>


<div class="min-h-full w-full px-6 py-8 lg:px-11 lg:py-9">
	<div class="mx-auto flex max-w-page flex-col gap-6">
		<div class="flex flex-col justify-between gap-2 lg:flex-row lg:items-end">
			<h1 class="font-display text-[44px] font-extrabold leading-[44px] tracking-[-0.02em] text-brand-ink">
				Settings
			</h1>
			<p class="font-sans text-sm text-brand-mute">API keys and your account.</p>
		</div>

		<!-- API keys -->
		<section class="flex w-full flex-col">
			<div class="flex items-center gap-3 pb-1">
				<h2 class="font-mono text-xs font-medium uppercase tracking-[0.06em] text-brand-ink">API keys</h2>
				<span class="h-0.5 flex-1 bg-brand-ink/[0.08]"></span>
				<button
					type="button"
					on:click={newKey}
					disabled={busy === 'new'}
					class="rounded-btn border border-brand-rule px-2.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink disabled:opacity-50"
				>
					+ New key
				</button>
			</div>

			{#if !loaded}
				<div class="h-[56px] animate-pulse rounded-btn bg-brand-canvas" aria-hidden="true"></div>
			{:else if tokens.length === 0}
				<p class="py-6 font-sans text-sm text-brand-slate">
					No keys yet. Create one to call the API from your code.
				</p>
			{:else}
				{#each tokens as token (token.uid)}
					<div class="flex w-full items-center gap-4 border-b border-brand-rule py-4 {busy === token.uid ? 'opacity-60' : ''}">
						<div class="flex min-w-0 flex-1 flex-col">
							<span class="font-sans text-[14px] font-semibold text-brand-ink">API key</span>
							<span class="truncate font-mono text-[12px] text-brand-mute">{masked(token.token)}</span>
						</div>
						<span class="hidden w-[150px] flex-shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute sm:block">
							Created {new Date(token.createdAt).toLocaleDateString('en-US', {
								month: 'short',
								year: 'numeric'
							})}
						</span>
						<span class="hidden w-[150px] flex-shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute md:block">
							Last used {lastApiRenderAt ? timeAgo(lastApiRenderAt) : 'never'}
						</span>
						<span class="flex flex-shrink-0 gap-2">
							<button
								type="button"
								on:click={() => copyToClipboard(token.token, 'Key copied')}
								class="rounded-btn border border-brand-rule px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink"
							>
								Copy
							</button>
							<button
								type="button"
								on:click={() => rotate(token)}
								class="rounded-btn border border-brand-rule px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink"
							>
								Rotate
							</button>
							<button
								type="button"
								on:click={() => revoke(token)}
								class="rounded-btn border border-brand-alarm px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-brand-alarm hover:bg-brand-alarm hover:text-white"
							>
								Revoke
							</button>
						</span>
					</div>
				{/each}
				<span class="pt-3 font-mono text-[11px] leading-[16px] text-brand-mute">
					rotating a key updates the Callers page and every snippet in the studio · the old key stops
					working immediately
				</span>
			{/if}
		</section>

		<!-- Account -->
		<section class="flex w-full flex-col pt-4">
			<div class="flex items-center gap-3 pb-1">
				<h2 class="font-mono text-xs font-medium uppercase tracking-[0.06em] text-brand-ink">Account</h2>
				<span class="h-0.5 flex-1 bg-brand-ink/[0.08]"></span>
			</div>

			<div class="flex w-full items-center gap-4 border-b border-brand-rule py-4">
				<div class="flex min-w-0 flex-1 flex-col">
					<span class="font-sans text-[14px] font-semibold text-brand-ink">Email</span>
					<span class="truncate font-mono text-[12px] text-brand-mute">{$user?.email || '—'}</span>
				</div>
				<!-- No CHANGE action: there is no email-change endpoint, and a button
				     that does nothing is worse than an honest read-only row. -->
			</div>

			<div class="flex w-full items-center gap-4 border-b border-brand-rule py-4">
				<div class="flex min-w-0 flex-1 flex-col">
					<span class="font-sans text-[14px] font-semibold text-brand-ink">Password</span>
					<span class="font-mono text-[12px] text-brand-mute">we email you a reset link</span>
				</div>
				<button
					type="button"
					on:click={changePassword}
					class="flex-shrink-0 rounded-btn border border-brand-rule px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink"
				>
					Change
				</button>
			</div>
		</section>

		<!-- Danger -->
		<section class="flex w-full flex-col pt-6">
			<div class="flex items-center gap-3 pb-3">
				<h2 class="font-mono text-xs font-medium uppercase tracking-[0.06em] text-brand-alarm">Danger</h2>
				<span class="h-0.5 flex-1 bg-brand-alarm/20"></span>
			</div>

			<div class="flex flex-col justify-between gap-4 rounded-card border border-brand-alarm px-6 py-5 sm:flex-row sm:items-center">
				<div class="flex flex-col gap-1">
					<span class="font-sans text-[15px] font-bold text-brand-ink">Close this account</span>
					<span class="font-sans text-[13px] text-brand-slate">
						Billing stops immediately and you're signed out. Your templates and renders are removed
						within 30 days.
					</span>
				</div>
				<button
					type="button"
					on:click={() => {
						deleteOpen = true;
						deleteConfirm = '';
					}}
					class="flex-shrink-0 rounded-btn border border-brand-alarm px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-brand-alarm hover:bg-brand-alarm hover:text-white"
				>
					Close account
				</button>
			</div>
		</section>
	</div>
</div>

{#if deleteOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-brand-press-deep/60 px-6">
		<div class="flex w-full max-w-[440px] flex-col gap-4 rounded-card bg-white p-6">
			<span class="font-display text-xl font-extrabold tracking-[-0.02em] text-brand-ink">
				Close this account?
			</span>
			<p class="font-sans text-[13.5px] leading-[20px] text-brand-slate">
				Your subscription is cancelled and every session is signed out straight away. Templates,
				renders and keys are removed within 30 days — contact support before then if you change your
				mind.
			</p>
			<label class="flex flex-col gap-1.5">
				<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
					Type “{expectedConfirm}” to confirm
				</span>
				<input
					bind:value={deleteConfirm}
					class="w-full rounded-btn border-[1.5px] border-brand-rule px-3 py-2 font-mono text-[13px] text-brand-ink outline-none focus:border-brand-alarm"
				/>
			</label>
			<div class="flex justify-end gap-3 pt-1">
				<button
					type="button"
					on:click={() => (deleteOpen = false)}
					class="rounded-btn px-3.5 py-2 font-sans text-[13px] font-semibold text-brand-slate hover:text-brand-ink"
				>
					Keep my account
				</button>
				<button
					type="button"
					on:click={confirmDelete}
					disabled={deleting || deleteConfirm.trim() !== expectedConfirm}
					class="rounded-btn bg-brand-alarm px-3.5 py-2 font-sans text-[13px] font-bold text-white disabled:opacity-40"
				>
					{deleting ? 'Closing…' : 'Close account'}
				</button>
			</div>
		</div>
	</div>
{/if}
