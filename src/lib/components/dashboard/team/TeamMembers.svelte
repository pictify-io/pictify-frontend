<script>
	import { onMount } from 'svelte';
	import {
		currentTeam,
		teamMembers,
		teamInvitations,
		isTeamOwner,
		canManageTeam,
		fetchTeamMembers,
		fetchTeamInvitations,
		removeMemberAction,
		createInvitationAction,
		revokeInvitationAction
	} from '../../../../store/team.store';
	import { toast } from '../../../../store/toast.store';

	let loading = true;
	let inviteEmail = '';
	let inviting = false;
	let error = null;
	let removingMemberId = null;
	let revokingInvitationId = null;

	onMount(async () => {
		if (!$currentTeam) {
			loading = false;
			return;
		}

		try {
			await Promise.all([
				fetchTeamMembers($currentTeam.uid),
				fetchTeamInvitations($currentTeam.uid)
			]);
		} catch (err) {
			error = 'Failed to load team members';
		} finally {
			loading = false;
		}
	});

	async function handleInvite() {
		if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
			error = 'Please enter a valid email address';
			return;
		}

		inviting = true;
		error = null;

		try {
			await createInvitationAction($currentTeam.uid, inviteEmail.trim());
			toast.set({ message: 'Invitation sent successfully', type: 'success', duration: 2000 });
			inviteEmail = '';
		} catch (err) {
			error = err.message;
		} finally {
			inviting = false;
		}
	}

	async function handleRemoveMember(member) {
		if (!confirm(`Are you sure you want to remove ${member.user?.email || 'this member'} from the team?`)) {
			return;
		}

		removingMemberId = member.uid;

		try {
			await removeMemberAction($currentTeam.uid, member.uid);
			toast.set({ message: 'Member removed successfully', type: 'success', duration: 2000 });
		} catch (err) {
			toast.set({ message: err.message, type: 'error', duration: 3000 });
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
			toast.set({ message: 'Invitation revoked', type: 'success', duration: 2000 });
		} catch (err) {
			toast.set({ message: err.message, type: 'error', duration: 3000 });
		} finally {
			revokingInvitationId = null;
		}
	}

	function formatDate(dateString) {
		if (!dateString) return '';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	$: seatUsage = $teamMembers.length;
	$: seatLimit = $currentTeam?.seatLimit || 1;
	$: canInvite = $isTeamOwner && seatUsage < seatLimit;
</script>

<div class="min-h-full">
	<!-- Header with back link -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
		<div>
			<a href="/dashboard/team" class="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-gray-900 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded mb-2 sm:mb-3 hover:bg-gray-800 transition-colors">
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Settings
			</a>
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
				Team <span class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">Members</span>
			</h1>
		</div>
		<div class="flex items-center gap-4">
			<div class="text-right">
				<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Total Members</div>
				<div class="text-lg sm:text-xl font-black text-gray-900 uppercase">{$teamMembers.length} Active</div>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-900"></div>
		</div>
	{:else if !$currentTeam}
		<div class="bg-[#FFFDF8] border-[3px] border-gray-900 rounded-2xl p-8 text-center shadow-[4px_4px_0_0_#1f2937]">
			<p class="text-xl font-black text-gray-900">No team selected</p>
		</div>
	{:else}
		<!-- Seat Usage -->
		<div class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden mb-10 transition-transform hover:-translate-y-1">
			<div class="p-8">
				<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
					<div>
						<p class="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Plan Usage</p>
						<div class="flex items-baseline gap-2">
							<span class="text-4xl font-black text-gray-900">{seatUsage}</span>
							<span class="text-2xl font-bold text-gray-400">/ {seatLimit} Seats Used</span>
						</div>
					</div>
					{#if seatUsage >= seatLimit && $isTeamOwner}
						<a
							href="/dashboard/upgrade"
							class="px-6 py-3 text-sm font-black uppercase tracking-wider text-white bg-[#ff6b6b] rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
						>
							Add More Seats
						</a>
					{/if}
				</div>
				<div class="w-full h-6 bg-gray-100 rounded-full overflow-hidden border-[3px] border-gray-900">
					<div
						class="h-full border-r-[3px] border-gray-900 transition-all duration-500 {seatUsage >= seatLimit ? 'bg-[#ff6b6b]' : 'bg-[#4ade80]'}"
						style="width: {Math.max(Math.min((seatUsage / seatLimit) * 100, 100), 2)}%"
					></div>
				</div>
			</div>
		</div>

		<div class="grid lg:grid-cols-3 gap-8">
			<!-- Main Content: Member List -->
			<div class="lg:col-span-2 space-y-8">
				<div class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
					<div class="px-8 py-6 border-b-[3px] border-gray-900 bg-gray-50 flex justify-between items-center">
						<h2 class="text-xl font-black text-gray-900 uppercase tracking-wide">Members ({$teamMembers.length})</h2>
						
						<!-- Mobile Invite Toggle could go here if needed -->
					</div>
					
					<div class="divide-y-[3px] divide-gray-100">
						{#each $teamMembers as member}
							<div class="p-6 hover:bg-[#FFFDF8] transition-colors group">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-4">
										<div class="w-12 h-12 rounded-xl bg-[#ffc480] border-[3px] border-gray-900 flex items-center justify-center shadow-[2px_2px_0_0_#1f2937]">
											<span class="text-lg font-black text-gray-900">
												{member.user?.email?.charAt(0)?.toUpperCase() || '?'}
											</span>
										</div>
										<div>
											<p class="font-bold text-gray-900 text-lg">{member.user?.email || 'Unknown'}</p>
											<div class="flex items-center gap-2 mt-1">
												<span class="text-xs font-bold text-gray-500 uppercase tracking-wider">
													Joined {formatDate(member.joinedAt)}
												</span>
												{#if member.role?.name === 'Owner'}
													<span class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-gray-900 text-white rounded border border-gray-900">
														Owner
													</span>
												{:else}
													<span class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 rounded border border-gray-300">
														{member.role?.name || 'Member'}
													</span>
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
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									{/if}
								</div>
							</div>
						{:else}
							<div class="p-12 text-center text-gray-500 font-bold">
								No members yet
							</div>
						{/each}
					</div>
				</div>

				<!-- Pending Invitations -->
				{#if $teamInvitations.length > 0 || $isTeamOwner}
					<div class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
						<div class="px-8 py-6 border-b-[3px] border-gray-900 bg-gray-50">
							<h2 class="text-xl font-black text-gray-900 uppercase tracking-wide">Pending Invites ({$teamInvitations.length})</h2>
						</div>
						<div class="divide-y-[3px] divide-gray-100">
							{#each $teamInvitations as invitation}
								<div class="p-6 hover:bg-[#FFFDF8] transition-colors">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-4">
											<div class="w-10 h-10 rounded-xl bg-yellow-100 border-[3px] border-gray-900 flex items-center justify-center text-yellow-600">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
												</svg>
											</div>
											<div>
												<p class="font-bold text-gray-900">{invitation.email}</p>
												<p class="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
													Expires {formatDate(invitation.expiresAt)}
												</p>
											</div>
										</div>
										{#if $isTeamOwner}
											<button
												on:click={() => handleRevokeInvitation(invitation)}
												disabled={revokingInvitationId === invitation.uid}
												class="px-3 py-1 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-[#ff6b6b] hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
											>
												{revokingInvitationId === invitation.uid ? 'Revoking...' : 'Revoke'}
											</button>
										{/if}
									</div>
								</div>
							{:else}
								<div class="p-8 text-center text-gray-400 font-bold italic">
									No pending invitations
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Sidebar: Invite Form -->
			<div class="lg:col-span-1">
				{#if $isTeamOwner}
					<div class="bg-gray-900 text-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#ff6b6b] overflow-hidden sticky top-8">
						<div class="p-8">
							<h2 class="text-2xl font-black tracking-tight mb-2">Invite Member</h2>
							<p class="text-gray-400 font-medium leading-relaxed mb-6">
								Add your team members to collaborate on projects.
							</p>

							{#if !canInvite}
								<div class="bg-yellow-400 text-gray-900 border-[3px] border-gray-900 rounded-xl p-4 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]">
									<p class="font-black text-sm uppercase tracking-wider">Seat limit reached</p>
									<a href="/dashboard/upgrade" class="inline-block mt-2 text-xs font-bold underline hover:no-underline">Upgrade Plan</a>
								</div>
							{:else}
								<div class="space-y-4">
									<div>
										<label class="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
										<input
											type="email"
											bind:value={inviteEmail}
											placeholder="colleague@company.com"
											class="w-full px-4 py-3 bg-gray-800 border-[3px] border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#4ade80] focus:outline-none transition-colors"
											on:keydown={(e) => e.key === 'Enter' && handleInvite()}
										/>
									</div>
									<button
										on:click={handleInvite}
										disabled={inviting || !inviteEmail.trim()}
										class="w-full px-6 py-4 text-sm font-black uppercase tracking-wider text-gray-900 bg-[#4ade80] rounded-xl border-[3px] border-[#4ade80] hover:bg-[#22c55e] hover:border-[#22c55e] hover:-translate-y-1 transition-all shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
									>
										{inviting ? 'Sending...' : 'Send Invite'}
									</button>
									{#if error}
										<p class="text-[#ff6b6b] text-sm font-bold mt-2">{error}</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
