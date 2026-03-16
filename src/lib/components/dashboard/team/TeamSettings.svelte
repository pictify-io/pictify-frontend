<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		teamStore,
		currentTeam,
		isTeamOwner,
		canManageTeam,
		teamUsage,
		fetchCurrentTeam,
		updateTeamAction,
		teamMembers,
		teamInvitations,
		fetchTeamMembers,
		fetchTeamInvitations,
		removeMemberAction,
		createInvitationAction,
		revokeInvitationAction,
		resendInvitationAction
	} from '../../../../store/team.store';
	import { toast } from '../../../../store/toast.store';
	import { formatRelativeDate } from '$lib/utils/format.js';

	let loading = true;
	let saving = false;
	let teamName = '';
	let error = null;

	// Invite State
	let inviteEmail = '';
	let inviting = false;
	let inviteError = null;
	let removingMemberId = null;
	let revokingInvitationId = null;
	let resendingInvitationId = null;
	let resendCooldowns = {}; // { invitationUid: secondsRemaining }

	onMount(async () => {
		try {
			await fetchCurrentTeam();
			if ($currentTeam) {
				teamName = $currentTeam.name || '';
				await Promise.all([
					fetchTeamMembers($currentTeam.uid),
					fetchTeamInvitations($currentTeam.uid)
				]);
			}
		} catch (err) {
			error = 'Failed to load team data';
		} finally {
			loading = false;
		}
	});

	// Sync teamName with currentTeam changes
	$: if ($currentTeam?.name && teamName === '') {
		teamName = $currentTeam.name;
	}

	$: seatUsage = $teamMembers ? $teamMembers.length : 0;
	$: seatLimit = $currentTeam?.seatLimit || 1;
	$: canInvite = $isTeamOwner && seatUsage < seatLimit;

	function formatDate(dateString) {
		if (!dateString) return '';
		return formatRelativeDate(dateString);
	}

	async function handleSave() {
		if (!teamName.trim()) {
			error = 'Team name is required';
			return;
		}
		if (teamName.trim() === $currentTeam?.name) return;

		saving = true;
		error = null;

		try {
			await updateTeamAction($currentTeam.uid, { name: teamName.trim() });
			toast.set({ message: 'Team settings updated', type: 'success' });
		} catch (err) {
			error = err.message;
		} finally {
			saving = false;
		}
	}

	async function handleInvite() {
		if (!inviteEmail.trim() || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(inviteEmail.trim())) {
			inviteError = 'Please enter a valid email address';
			return;
		}

		inviting = true;
		inviteError = null;

		try {
			await createInvitationAction($currentTeam.uid, inviteEmail.trim());
			toast.set({ message: 'Invitation sent successfully', type: 'success' });
			inviteEmail = '';
		} catch (err) {
			inviteError = err.message;
		} finally {
			inviting = false;
		}
	}

	async function handleRemoveMember(member) {
		if (
			!confirm(
				`Are you sure you want to remove ${member.user?.email || 'this member'} from the team?`
			)
		) {
			return;
		}

		removingMemberId = member.uid;

		try {
			await removeMemberAction($currentTeam.uid, member.uid);
			toast.set({ message: 'Member removed successfully', type: 'success' });
		} catch (err) {
			toast.set({ message: err.message, type: 'error' });
		} finally {
			removingMemberId = null;
		}
	}

	async function handleRevokeInvitation(invitation) {
		if (!confirm(`Are you sure you want to revoke the invitation for ${invitation.email}?`)) {
			return;
		}

		revokingInvitationId = invitation.uid;

		try {
			await revokeInvitationAction($currentTeam.uid, invitation.uid);
			toast.set({ message: 'Invitation revoked', type: 'success' });
		} catch (err) {
			toast.set({ message: err.message, type: 'error' });
		} finally {
			revokingInvitationId = null;
		}
	}

	async function copyInviteLink(invitation) {
		if (!invitation.inviteUrl) {
			toast.set({ message: 'Invite link not available', type: 'error' });
			return;
		}
		try {
			await navigator.clipboard.writeText(invitation.inviteUrl);
			toast.set({ message: 'Invite link copied to clipboard', type: 'success' });
		} catch (err) {
			toast.set({ message: 'Failed to copy link', type: 'error' });
		}
	}

	function startResendCooldown(invitationUid, seconds = 120) {
		resendCooldowns[invitationUid] = seconds;
		resendCooldowns = resendCooldowns; // Trigger reactivity

		const interval = setInterval(() => {
			resendCooldowns[invitationUid]--;
			resendCooldowns = resendCooldowns; // Trigger reactivity

			if (resendCooldowns[invitationUid] <= 0) {
				delete resendCooldowns[invitationUid];
				resendCooldowns = resendCooldowns;
				clearInterval(interval);
			}
		}, 1000);
	}

	async function handleResendInvitation(invitation) {
		resendingInvitationId = invitation.uid;

		try {
			await resendInvitationAction($currentTeam.uid, invitation.uid);
			toast.set({ message: 'Invitation email resent', type: 'success' });
			// Start 2-minute cooldown on success
			startResendCooldown(invitation.uid, 120);
		} catch (err) {
			// Check if error message contains retry time from rate limit
			const retryMatch = err.message.match(/wait (\d+) seconds/);
			if (retryMatch) {
				startResendCooldown(invitation.uid, parseInt(retryMatch[1]));
			}
			toast.set({ message: err.message, type: 'error' });
		} finally {
			resendingInvitationId = null;
		}
	}
</script>

<div class="min-h-full">
	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
		<div>
			<div
				class="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-gray-900 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded mb-2 sm:mb-3"
			>
				<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#4ade80] rounded-full animate-pulse" />
				Workspace
			</div>
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
				Team <span class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600"
					>Settings</span
				>
			</h1>
		</div>
		<div class="flex items-center gap-4">
			<div class="text-right">
				<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
					Members
				</div>
				<div class="text-lg sm:text-xl font-black text-gray-900 uppercase">
					{$teamMembers ? $teamMembers.length : 0} Active
				</div>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-900" />
		</div>
	{:else if !$currentTeam}
		<div
			class="bg-yellow-50 border-[3px] border-gray-900 rounded-2xl p-8 text-center shadow-[8px_8px_0_0_#1f2937]"
		>
			<svg
				class="w-16 h-16 mx-auto text-yellow-500 mb-6"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2.5"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
			<p class="text-xl font-black text-gray-900 uppercase tracking-wide mb-2">No team selected</p>
			<p class="text-gray-600 font-bold">
				Please select a team from the switcher to view settings.
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
			<!-- Left Column: Members & Data -->
			<div class="lg:col-span-8 space-y-8">
				<!-- Members List -->
				<div
					class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden"
				>
					<div
						class="bg-gray-100 border-b-[3px] border-gray-900 p-4 flex justify-between items-center"
					>
						<div class="flex items-center gap-3">
							<div
								class="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#1f2937]"
							>
								<svg
									class="w-4 h-4 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2.5"
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
							</div>
							<div>
								<h2 class="text-xs font-black text-gray-900 uppercase tracking-widest">
									Team Members
								</h2>
								<p class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
									Manage access & roles
								</p>
							</div>
						</div>
						<div
							class="text-[10px] font-black uppercase tracking-wider bg-gray-200 px-2 py-1 rounded text-gray-600"
						>
							{$teamMembers.length} / {seatLimit} Seats
						</div>
					</div>

					<div class="divide-y-[3px] divide-gray-100">
						{#each $teamMembers as member}
							<div class="p-6 hover:bg-[#FFFDF8] transition-colors group">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-4">
										<div
											class="w-10 h-10 rounded-lg bg-[#ffc480] border-[2px] border-gray-900 flex items-center justify-center shadow-[2px_2px_0_0_#1f2937]"
										>
											<span class="text-sm font-black text-gray-900">
												{member.user?.email?.charAt(0)?.toUpperCase() || '?'}
											</span>
										</div>
										<div>
											<p class="font-bold text-gray-900 text-sm">
												{member.user?.email || 'Unknown'}
											</p>
											<div class="flex items-center gap-2 mt-0.5">
												<span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
													Joined {formatDate(member.joinedAt)}
												</span>
												{#if member.role?.name === 'Owner'}
													<span
														class="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-gray-900 text-white rounded border border-gray-900"
														>Owner</span
													>
												{:else}
													<span
														class="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 rounded border border-gray-300"
														>Member</span
													>
												{/if}
											</div>
										</div>
									</div>

									{#if $isTeamOwner && member.role?.name !== 'Owner'}
										<button
											on:click={() => handleRemoveMember(member)}
											disabled={removingMemberId === member.uid}
											class="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-gray-400 hover:text-[#ff6b6b] transition-all disabled:opacity-50"
											title="Remove Member"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2.5"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
										</button>
									{/if}
								</div>
							</div>
						{:else}
							<div class="p-12 text-center text-gray-500 font-bold">No members yet</div>
						{/each}
					</div>
				</div>

				<!-- Pending Invitations -->
				{#if $teamInvitations.length > 0}
					<div
						class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden"
					>
						<div class="bg-gray-100 border-b-[3px] border-gray-900 p-4 flex items-center gap-3">
							<div
								class="w-8 h-8 rounded-lg bg-yellow-400 border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#1f2937]"
							>
								<svg
									class="w-4 h-4 text-gray-900"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2.5"
										d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<div>
								<h2 class="text-xs font-black text-gray-900 uppercase tracking-widest">
									Pending Invites
								</h2>
								<p class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
									Awaiting acceptance
								</p>
							</div>
						</div>

						<div class="divide-y-[3px] divide-gray-100">
							{#each $teamInvitations as invitation}
								<div class="p-6 hover:bg-[#FFFDF8] transition-colors">
									<div class="flex items-center justify-between">
										<div>
											<p class="font-bold text-gray-900 text-sm">{invitation.email}</p>
											<p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
												Expires {formatDate(invitation.expiresAt)}
											</p>
										</div>
										<div class="flex items-center gap-2">
											<button
												on:click={() => copyInviteLink(invitation)}
												class="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
												title="Copy invite link"
											>
												Copy Link
											</button>
											{#if $isTeamOwner}
												<button
													on:click={() => handleResendInvitation(invitation)}
													disabled={resendingInvitationId === invitation.uid ||
														resendCooldowns[invitation.uid]}
													class="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												>
													{#if resendingInvitationId === invitation.uid}
														Sending...
													{:else if resendCooldowns[invitation.uid]}
														Wait {Math.floor(resendCooldowns[invitation.uid] / 60)}:{(
															resendCooldowns[invitation.uid] % 60
														)
															.toString()
															.padStart(2, '0')}
													{:else}
														Resend
													{/if}
												</button>
												<button
													on:click={() => handleRevokeInvitation(invitation)}
													disabled={revokingInvitationId === invitation.uid}
													class="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-[#ff6b6b] hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
												>
													{revokingInvitationId === invitation.uid ? 'Revoking...' : 'Revoke'}
												</button>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Right Column: Actions -->
			<div class="lg:col-span-4 space-y-8 sticky top-8">
				<!-- Team Name Settings -->
				<div
					class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden"
				>
					<div class="bg-gray-100 border-b-[3px] border-gray-900 p-4 flex items-center gap-3">
						<div
							class="w-8 h-8 rounded-lg bg-blue-500 border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#1f2937]"
						>
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						</div>
						<div>
							<h2 class="text-xs font-black text-gray-900 uppercase tracking-widest">
								Team Settings
							</h2>
							<p class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
								Update Workspace
							</p>
						</div>
					</div>

					<div class="p-6">
						{#if $canManageTeam}
							<div class="mb-4">
								<label
									for="teamName"
									class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2"
									>Team Name</label
								>
								<input
									id="teamName"
									type="text"
									bind:value={teamName}
									class="w-full px-4 py-3 text-sm font-bold bg-white border-[3px] border-gray-300 rounded-xl focus:border-gray-900 focus:outline-none transition-colors placeholder-gray-300"
									placeholder="Enter team name"
								/>
							</div>

							{#if error}
								<div
									class="bg-red-50 border-2 border-[#ff6b6b] rounded-xl p-3 mb-4 flex items-start gap-2"
								>
									<svg
										class="w-4 h-4 text-[#ff6b6b] flex-shrink-0 mt-0.5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<p class="text-[#ff6b6b] text-xs font-bold">{error}</p>
								</div>
							{/if}

							<button
								on:click={handleSave}
								disabled={saving || teamName.trim() === $currentTeam?.name}
								class="w-full px-4 py-3 text-xs font-black uppercase tracking-widest text-white bg-gray-900 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#374151] hover:shadow-[2px_2px_0_0_#374151] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#374151]"
							>
								{saving ? 'Saving...' : 'Save Changes'}
							</button>
						{:else}
							<div class="flex items-center">
								<div
									class="w-12 h-12 rounded-xl bg-[#ffc480] border-[2px] border-gray-900 flex items-center justify-center shadow-[2px_2px_0_0_#1f2937]"
								>
									<span class="text-xl font-black text-gray-900">
										{$currentTeam?.name?.charAt(0)?.toUpperCase() || 'T'}
									</span>
								</div>
								<div class="ml-4">
									<p class="text-lg font-black text-gray-900 tracking-tight">
										{$currentTeam?.name}
									</p>
									<p class="text-[10px] font-mono font-bold text-gray-500 mt-0.5">
										ID: {$currentTeam?.uid}
									</p>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Invite Form -->
				{#if $isTeamOwner}
					<div
						class="bg-gray-900 text-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#ff6b6b] overflow-hidden"
					>
						<div class="bg-gray-800 border-b-[3px] border-gray-900 p-4 flex items-center gap-3">
							<div
								class="w-8 h-8 rounded-lg bg-[#4ade80] border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#000]"
							>
								<svg
									class="w-4 h-4 text-gray-900"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2.5"
										d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
									/>
								</svg>
							</div>
							<div>
								<h2 class="text-xs font-black text-white uppercase tracking-widest">
									Invite Member
								</h2>
								<p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
									Grow your team
								</p>
							</div>
						</div>

						<div class="p-6">
							{#if !canInvite}
								<div
									class="bg-yellow-400 text-gray-900 border-[3px] border-gray-900 rounded-xl p-4 text-center"
								>
									<p class="font-black text-xs uppercase tracking-wider">Seat limit reached</p>
									<a
										href="/dashboard/upgrade"
										class="inline-block mt-2 text-[10px] font-bold underline hover:no-underline"
										>Upgrade Plan</a
									>
								</div>
							{:else}
								<div class="space-y-4">
									<div>
										<label
											for="inviteEmail"
											class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2"
											>Email Address</label
										>
										<input
											id="inviteEmail"
											type="email"
											bind:value={inviteEmail}
											placeholder="colleague@company.com"
											class="w-full px-4 py-3 bg-gray-800 border-[3px] border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#4ade80] focus:outline-none transition-colors text-sm font-medium"
											on:keydown={(e) => e.key === 'Enter' && handleInvite()}
										/>
									</div>

									{#if inviteError}
										<p class="text-[#ff6b6b] text-xs font-bold">{inviteError}</p>
									{/if}

									<button
										on:click={handleInvite}
										disabled={inviting || !inviteEmail.trim()}
										class="w-full px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-900 bg-[#4ade80] rounded-xl border-[3px] border-[#4ade80] hover:bg-[#22c55e] hover:border-[#22c55e] hover:-translate-y-0.5 transition-all shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
									>
										{inviting ? 'Sending...' : 'Send Invite'}
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
