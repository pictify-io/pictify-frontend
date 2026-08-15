<script>
	/**
	 * Team & invites — one list.
	 *
	 * Pending invites used to live in their own section below the members, which
	 * meant the answer to "who has access to this workspace" was split across
	 * two places and you had to add them up. An invited person is a person on
	 * the team who hasn't arrived yet, so they sit in the same list, marked.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { analytics } from '$lib/telemetry.js';
	import { plgStatus, initPLG } from '../../../store/plg.store';
	import { currentTeam, initializeTeamState } from '../../../store/team.store';
	import { showToast } from '../../../store/toast.store.js';
	import { timeAgo } from '$lib/utils/format.js';
	import Toast from '$lib/components/Toast.svelte';
	import SendingDomainCard from '$lib/components/dashboard/v2/SendingDomainCard.svelte';
	import {
		getTeamMembers,
		getTeamInvitations,
		createInvitation,
		revokeInvitation,
		resendInvitation,
		removeMember
	} from '../../../api/teams.js';
	import { PLAN_FEATURES, FEATURES, normalizePlan } from '../../../config/plan-features.js';

	let loaded = false;
	let members = [];
	let invitations = [];
	let email = '';
	let inviting = false;
	let busyUid = '';
	let menuFor = '';

	$: preview = $page.url.searchParams.get('preview');
	$: forceSolo = preview === 'solo';

	$: teamId = $currentTeam?.uid || null;
	// Seat caps are real (plan-features defines TEAM_SEATS per plan), so the
	// header can say "N of M seats" rather than inventing a limit.
	$: seatCap = PLAN_FEATURES[normalizePlan($plgStatus?.plan || 'starter')]?.[FEATURES.TEAM_SEATS] ?? null;

	// Pending invites occupy a seat as far as capacity goes — they are people
	// you have already committed a place to.
	$: rows = [
		...(forceSolo ? members.slice(0, 1) : members).map((m) => ({
			kind: 'member',
			uid: m.uid,
			name: m.user?.name || m.user?.email?.split('@')[0] || 'Member',
			email: m.user?.email || '',
			role: m.role?.name || 'Member',
			joinedAt: m.joinedAt
		})),
		...(forceSolo ? [] : invitations).map((i) => ({
			kind: 'invite',
			uid: i.uid,
			name: i.email,
			email: i.email,
			role: i.role?.name || 'Member',
			sentAt: i.createdAt || i.invitedAt
		}))
	];
	$: seatsUsed = rows.length;

	async function load() {
		if (!teamId) {
			loaded = true;
			return;
		}
		try {
			const [m, i] = await Promise.all([
				getTeamMembers(teamId).catch(() => null),
				getTeamInvitations(teamId).catch(() => null)
			]);
			members = m?.members || [];
			invitations = i?.invitations || [];
		} finally {
			loaded = true;
		}
	}

	async function invite() {
		const address = email.trim();
		if (!address || inviting) return;
		inviting = true;
		try {
			const res = await createInvitation(teamId, address);
			// teams.js wrappers resolve with null on failure rather than throwing.
			if (!res) throw new Error('That invite did not send.');
			email = '';
			analytics.track('team_invite_sent');
			showToast(`Invite sent to ${address}.`, 'success', 4000);
			await load();
		} catch (e) {
			showToast(e?.message || 'That invite did not send.', 'error', 4000);
		} finally {
			inviting = false;
		}
	}

	async function act(kind, row) {
		busyUid = row.uid;
		menuFor = '';
		try {
			let res;
			if (kind === 'revoke') res = await revokeInvitation(teamId, row.uid);
			else if (kind === 'resend') res = await resendInvitation(teamId, row.uid);
			else if (kind === 'remove') {
				// eslint-disable-next-line no-alert
				if (!confirm(`Remove ${row.email} from this team?`)) return;
				res = await removeMember(teamId, row.uid);
			}
			if (!res) throw new Error('That did not go through.');
			showToast(
				kind === 'resend' ? 'Invite sent again.' : kind === 'revoke' ? 'Invite revoked.' : 'Member removed.',
				'success',
				3000
			);
			await load();
		} catch (e) {
			showToast(e?.message || 'That did not go through.', 'error', 4000);
		} finally {
			busyUid = '';
		}
	}

	onMount(async () => {
		initPLG();
		await initializeTeamState();
		await load();
		analytics.track('team_v2_viewed', { members: members.length, pending: invitations.length });
	});
</script>

<svelte:head><title>Team &amp; invites | Pictify.io</title></svelte:head>

<Toast />

<div class="min-h-full w-full px-6 py-8 lg:px-11 lg:py-9">
	<div class="mx-auto flex max-w-page flex-col gap-6">
		<div class="flex items-end gap-3">
			<h1 class="font-display text-[44px] font-extrabold leading-[44px] tracking-[-0.02em] text-brand-ink">
				Team
			</h1>
			{#if loaded}
				<span class="pb-1 font-mono text-xs uppercase tracking-[0.06em] text-brand-mute">
					<!-- Only claim a seat cap when the plan actually defines one;
					     otherwise say what we know, which is the headcount. -->
					{seatCap ? `${seatsUsed} of ${seatCap} seats` : `${seatsUsed} member${seatsUsed === 1 ? '' : 's'}`}
				</span>
			{/if}
		</div>

		<!-- Invite -->
		<form
			class="flex flex-col gap-2.5 sm:flex-row sm:items-center"
			on:submit|preventDefault={invite}
		>
			<input
				type="email"
				bind:value={email}
				placeholder="teammate@company.com"
				class="w-full rounded-btn border-[1.5px] border-brand-rule px-3.5 py-2.5 font-sans text-[13.5px] text-brand-ink outline-none focus:border-brand-ink sm:max-w-[320px]"
			/>
			<span class="rounded-btn border-[1.5px] border-brand-rule px-3.5 py-2.5 font-sans text-[13px] text-brand-slate">
				Member
			</span>
			<button
				type="submit"
				disabled={inviting || !email.trim()}
				class="flex items-center gap-2 rounded-btn bg-brand-ink px-[18px] py-2.5 font-sans text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
			>
				{inviting ? 'Sending…' : 'Invite'}
				<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
			</button>
		</form>

		<!-- Members + pending, one list -->
		<section class="flex w-full flex-col pt-2">
			<div class="flex items-center gap-3 pb-1">
				<h2 class="font-mono text-xs font-medium uppercase tracking-[0.06em] text-brand-ink">Members</h2>
				<span class="h-0.5 flex-1 bg-brand-ink/[0.08]"></span>
			</div>

			{#if !loaded}
				<div class="flex flex-col gap-2 pt-3" aria-hidden="true">
					{#each Array(2) as _}
						<div class="h-[58px] animate-pulse rounded-btn bg-brand-canvas"></div>
					{/each}
				</div>
			{:else}
				{#each rows as row, i (row.kind + row.uid)}
					{@const pending = row.kind === 'invite'}
					<div class="flex w-full items-center gap-4 border-b border-brand-rule py-3.5 {busyUid === row.uid ? 'opacity-60' : ''}">
						<span
							class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[7px] font-display text-sm font-extrabold text-brand-ink {pending
								? 'border border-dashed border-brand-mute text-brand-mute'
								: i % 2 === 0
									? 'bg-brand-powder'
									: 'bg-brand-rose'}"
							aria-hidden="true"
						>
							{pending ? '?' : (row.name[0] || '?').toUpperCase()}
						</span>

						<div class="flex min-w-0 flex-1 flex-col">
							<span class="truncate font-sans text-[13.5px] font-semibold text-brand-ink">{row.name}</span>
							<span class="truncate font-mono text-[11px] text-brand-mute">
								{pending ? `Invite sent ${row.sentAt ? timeAgo(row.sentAt) : 'recently'}` : row.email}
							</span>
						</div>

						<span
							class="flex-shrink-0 rounded-[3px] px-[7px] py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] {pending
								? 'border border-dashed border-brand-mute text-brand-mute'
								: row.role.toLowerCase() === 'owner'
									? 'bg-brand-field text-brand-ink'
									: 'bg-brand-subtle text-brand-slate'}"
						>
							{pending ? 'Pending' : row.role}
						</span>

						<span class="hidden w-[120px] flex-shrink-0 text-right font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute sm:block">
							{#if !pending && row.joinedAt}
								Joined {new Date(row.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
							{/if}
						</span>

						<span class="flex w-[130px] flex-shrink-0 items-center justify-end gap-3">
							{#if pending}
								<button
									type="button"
									on:click={() => act('resend', row)}
									class="font-sans text-[12.5px] font-medium text-brand-blue hover:underline"
								>
									Resend
								</button>
								<button
									type="button"
									on:click={() => act('revoke', row)}
									class="font-sans text-[12.5px] font-medium text-brand-blue hover:underline"
								>
									Revoke
								</button>
							{:else if row.role.toLowerCase() !== 'owner'}
								<div class="relative">
									<button
										type="button"
										on:click={() => (menuFor = menuFor === row.uid ? '' : row.uid)}
										aria-label="Member actions"
										class="px-1 font-sans text-[13px] font-bold tracking-[0.1em] text-brand-mute hover:text-brand-ink"
									>
										···
									</button>
									{#if menuFor === row.uid}
										<div class="absolute right-0 top-full z-20 mt-1 w-[150px] overflow-hidden rounded-md border border-black/10 bg-white shadow-lg">
											<button
												type="button"
												on:click={() => act('remove', row)}
												class="w-full px-3 py-2 text-left font-sans text-[13px] text-brand-alarm hover:bg-brand-canvas"
											>
												Remove
											</button>
										</div>
									{/if}
								</div>
							{/if}
						</span>
					</div>
				{/each}
			{/if}
		</section>

		<!-- Sending domain -->
		<section class="flex w-full flex-col pt-4">
			<div class="flex items-center gap-3 pb-3">
				<h2 class="font-mono text-xs font-medium uppercase tracking-[0.06em] text-brand-ink">
					Sending domain
				</h2>
				<span class="h-0.5 flex-1 bg-brand-ink/[0.08]"></span>
			</div>
			<SendingDomainCard />
		</section>
	</div>
</div>
