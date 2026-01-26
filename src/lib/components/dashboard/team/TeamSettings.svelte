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
		updateTeamAction
	} from '../../../../store/team.store';
	import { toast } from '../../../../store/toast.store';

	let loading = true;
	let saving = false;
	let teamName = '';
	let error = null;

	onMount(async () => {
		try {
			await fetchCurrentTeam();
			teamName = $currentTeam?.name || '';
		} catch (err) {
			error = 'Failed to load team settings';
		} finally {
			loading = false;
		}
	});

	// Sync teamName with currentTeam changes
	$: if ($currentTeam?.name && teamName === '') {
		teamName = $currentTeam.name;
	}

	async function handleSave() {
		if (!teamName.trim()) {
			error = 'Team name is required';
			return;
		}

		if (teamName.trim() === $currentTeam?.name) {
			return; // No changes
		}

		saving = true;
		error = null;

		try {
			await updateTeamAction($currentTeam.uid, { name: teamName.trim() });
			toast.set({ message: 'Team settings updated', type: 'success', duration: 2000 });
		} catch (err) {
			error = err.message;
		} finally {
			saving = false;
		}
	}

	function formatUsage(usage) {
		if (!usage) return { count: 0, limit: 0, percentage: 0 };
		const count = usage.count || 0;
		const limit = usage.limit || 0;
		const percentage = limit > 0 ? Math.round((count / limit) * 100) : 0;
		return { count, limit, percentage };
	}

	function getUsageColor(percentage) {
		if (percentage >= 90) return 'bg-[#ff6b6b]';
		if (percentage >= 75) return 'bg-[#ffc480]';
		return 'bg-[#4ade80]';
	}

	$: usage = formatUsage($teamUsage);
</script>

<div class="min-h-full">
	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
		<div>
			<div class="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-gray-900 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded mb-2 sm:mb-3">
				<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#4ade80] rounded-full animate-pulse"></span>
				Workspace
			</div>
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
				Team <span class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">Settings</span>
			</h1>
		</div>
		<div class="flex items-center gap-4">
			<div class="text-right">
				<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Current Team</div>
				<div class="text-lg sm:text-xl font-black text-gray-900 uppercase">{$currentTeam?.name || '...'}</div>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-900"></div>
		</div>
	{:else if !$currentTeam}
		<div class="bg-yellow-50 border-[3px] border-gray-900 rounded-2xl p-8 text-center shadow-[8px_8px_0_0_#1f2937]">
			<svg class="w-16 h-16 mx-auto text-yellow-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			<p class="text-xl font-black text-gray-900 uppercase tracking-wide mb-2">No team selected</p>
			<p class="text-gray-600 font-bold">Please select a team from the switcher to view settings.</p>
		</div>
	{:else}
		<div class="grid gap-8">
			<!-- Team Info Card -->
			<div class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
				<div class="px-8 py-6 border-b-[3px] border-gray-900 bg-gray-50">
					<h2 class="text-xl font-black text-gray-900 uppercase tracking-wide">Team Information</h2>
				</div>
				<div class="p-8">
					{#if $canManageTeam}
						<div class="mb-6">
							<label for="teamName" class="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Team Name</label>
							<input
								id="teamName"
								type="text"
								bind:value={teamName}
								class="w-full px-4 py-3 text-lg font-bold bg-white border-[3px] border-gray-300 rounded-xl focus:border-gray-900 focus:outline-none transition-colors placeholder-gray-300"
								placeholder="Enter team name"
							/>
						</div>

						{#if error}
							<div class="bg-red-50 border-2 border-[#ff6b6b] rounded-xl p-4 mb-6 flex items-start gap-3">
								<svg class="w-5 h-5 text-[#ff6b6b] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<p class="text-[#ff6b6b] font-bold">{error}</p>
							</div>
						{/if}

						<button
							on:click={handleSave}
							disabled={saving || teamName.trim() === $currentTeam?.name}
							class="px-8 py-4 text-sm font-black uppercase tracking-wider text-white bg-gray-900 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#374151] hover:shadow-[2px_2px_0_0_#374151] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#374151]"
						>
							{saving ? 'Saving...' : 'Save Changes'}
						</button>
					{:else}
						<div class="flex items-center">
							<div class="w-16 h-16 rounded-2xl bg-[#ffc480] border-[3px] border-gray-900 flex items-center justify-center shadow-[4px_4px_0_0_#1f2937]">
								<span class="text-3xl font-black text-gray-900">
									{$currentTeam?.name?.charAt(0)?.toUpperCase() || 'T'}
								</span>
							</div>
							<div class="ml-6">
								<p class="text-2xl font-black text-gray-900 tracking-tight">{$currentTeam?.name}</p>
								<p class="text-sm font-mono font-bold text-gray-500 mt-1">ID: {$currentTeam?.uid}</p>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="grid md:grid-cols-2 gap-8">
				<!-- Usage Card -->
				<div class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden flex flex-col">
					<div class="px-8 py-6 border-b-[3px] border-gray-900 bg-gray-50">
						<h2 class="text-xl font-black text-gray-900 uppercase tracking-wide">Monthly Usage</h2>
					</div>
					<div class="p-8 flex-1 flex flex-col justify-center">
						<div class="flex justify-between items-end mb-4">
							<span class="text-sm font-black text-gray-500 uppercase tracking-wider">API Requests</span>
							<span class="text-2xl font-black text-gray-900">
								{usage.count.toLocaleString()} <span class="text-gray-400 text-lg">/ {usage.limit.toLocaleString()}</span>
							</span>
						</div>
						<div class="w-full h-6 bg-gray-100 rounded-full overflow-hidden border-[3px] border-gray-900">
							<div
								class="h-full border-r-[3px] border-gray-900 transition-all duration-500 {getUsageColor(usage.percentage)}"
								style="width: {Math.max(usage.percentage, 2)}%"
							></div>
						</div>
						<p class="text-xs font-bold text-gray-500 mt-4 text-right">
							{usage.percentage}% of monthly quota used
						</p>
					</div>
				</div>

				<!-- Plan & Billing Card -->
				<div class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden flex flex-col">
					<div class="px-8 py-6 border-b-[3px] border-gray-900 bg-gray-50">
						<h2 class="text-xl font-black text-gray-900 uppercase tracking-wide">Plan & Billing</h2>
					</div>
					<div class="p-8 flex-1 flex flex-col">
						<div class="flex items-center justify-between mb-8">
							<div>
								<p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Current Plan</p>
								<div class="inline-flex items-center px-3 py-1 bg-[#4ade80] border-2 border-gray-900 rounded font-black text-sm uppercase tracking-wide">
									{$currentTeam?.currentPlan || 'Starter'}
								</div>
							</div>
							<div class="text-right">
								<p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Seats Included</p>
								<p class="text-3xl font-black text-gray-900">{$currentTeam?.seatLimit || 1}</p>
							</div>
						</div>

						{#if $isTeamOwner}
							<div class="mt-auto pt-6 border-t-[3px] border-dashed border-gray-200">
								<a
									href="/dashboard/upgrade"
									class="w-full flex items-center justify-center px-6 py-4 text-sm font-black uppercase tracking-wider text-white bg-[#ff6b6b] rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
								>
									<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
									Upgrade Plan
								</a>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Team Members Link -->
			<a
				href="/dashboard/team/members"
				class="group bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0_0_#1f2937] transition-all"
			>
				<div class="px-8 py-6 flex items-center justify-between">
					<div class="flex items-center">
						<div class="w-12 h-12 rounded-xl bg-gray-100 border-[3px] border-gray-900 flex items-center justify-center mr-6 group-hover:bg-[#ffc480] transition-colors">
							<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
						</div>
						<div>
							<h3 class="text-xl font-black text-gray-900 group-hover:text-[#ff6b6b] transition-colors">Manage Team Members</h3>
							<p class="text-gray-500 font-bold mt-1">Add or remove members and manage invitations</p>
						</div>
					</div>
					<div class="w-10 h-10 rounded-full border-[3px] border-gray-900 flex items-center justify-center bg-gray-50 group-hover:bg-[#ff6b6b] group-hover:text-white transition-colors">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
						</svg>
					</div>
				</div>
			</a>
		</div>
	{/if}
</div>
