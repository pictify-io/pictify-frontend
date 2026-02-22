<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		teamStore,
		teams,
		currentTeam,
		isTeamOwner,
		teamUsage,
		needsMigration,
		ownsTeam,
		fetchTeams,
		switchTeamAction,
		createTeamAction,
		migrateToTeamsAction
	} from '../../../store/team.store';

	let isOpen = false;
	let isCreating = false;
	let newTeamName = '';
	let error = null;
	let errorWithUpgrade = false;
	let loading = false;

	// Close dropdown when clicking outside
	let dropdownRef;

	function handleClickOutside(event) {
		if (dropdownRef && !dropdownRef.contains(event.target)) {
			isOpen = false;
		}
	}

	onMount(() => {
		if (browser) {
			document.addEventListener('click', handleClickOutside);
		}
		// Fetch teams on mount if not already loaded
		if ($teams.length === 0) {
			fetchTeams().catch(console.error);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('click', handleClickOutside);
		}
	});

	function toggleDropdown() {
		isOpen = !isOpen;
		if (!isOpen) {
			isCreating = false;
			newTeamName = '';
			error = null;
			errorWithUpgrade = false;
		}
	}

	async function handleSwitchTeam(teamId) {
		if (teamId === $currentTeam?.uid) {
			isOpen = false;
			return;
		}

		loading = true;
		error = null;

		try {
			await switchTeamAction(teamId);
			isOpen = false;
			// Force page re-mount to re-trigger onMount data fetches for new team
			const currentPath = $page.url.pathname + $page.url.search;
			await goto(currentPath, { replaceState: true, invalidateAll: true });
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function handleCreateTeam() {
		if (!newTeamName.trim()) {
			error = 'Team name is required';
			errorWithUpgrade = false;
			return;
		}

		loading = true;
		error = null;
		errorWithUpgrade = false;

		try {
			await createTeamAction(newTeamName.trim());
			isCreating = false;
			newTeamName = '';
			isOpen = false;
			await invalidateAll();
		} catch (err) {
			// Check if error has upgrade URL (team limit reached)
			if (err.upgradeUrl || err.message?.includes('team limit') || err.message?.includes('Team limit')) {
				error = err.message || 'You can only own one team on the free plan.';
				errorWithUpgrade = true;
			} else {
				error = err.message;
				errorWithUpgrade = false;
			}
		} finally {
			loading = false;
		}
	}

	async function handleMigrate() {
		loading = true;
		error = null;

		try {
			await migrateToTeamsAction();
			isOpen = false;
			await invalidateAll();
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function goToTeamSettings() {
		isOpen = false;
		goto('/dashboard/team');
	}

	// Format usage display
	function formatUsage(usage) {
		if (!usage) return '';
		const count = usage.count || 0;
		const limit = usage.limit || 0;
		const percentage = limit > 0 ? Math.round((count / limit) * 100) : 0;
		return `${count.toLocaleString()} / ${limit.toLocaleString()} (${percentage}%)`;
	}

	// Get usage bar color based on percentage
	function getUsageColor(usage) {
		if (!usage) return 'bg-gray-300';
		const percentage = usage.limit > 0 ? (usage.count / usage.limit) * 100 : 0;
		if (percentage >= 90) return 'bg-[#ff6b6b]';
		if (percentage >= 75) return 'bg-[#ffc480]';
		return 'bg-[#4ade80]';
	}

	function getUsagePercentage(usage) {
		if (!usage || !usage.limit) return 0;
		return Math.min((usage.count / usage.limit) * 100, 100);
	}
</script>

<div class="relative" bind:this={dropdownRef}>
	<!-- Team Switcher Button -->
	<button
		on:click={toggleDropdown}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		aria-label="Switch team"
		class="w-full flex items-center justify-between px-4 py-3 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all {isOpen ? 'translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0_0_#1f2937] bg-gray-50' : ''}"
		disabled={loading}
	>
		<div class="flex items-center min-w-0">
			<!-- Team Avatar/Icon -->
			<div class="w-9 h-9 rounded-lg bg-[#ffc480] border-[2px] border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#1f2937]">
				{#if $currentTeam?.avatar}
					<img src={$currentTeam.avatar} alt={$currentTeam.name} class="w-full h-full rounded-lg object-cover" />
				{:else}
					<span class="text-sm font-black text-gray-900">
						{$currentTeam?.name?.charAt(0)?.toUpperCase() || 'T'}
					</span>
				{/if}
			</div>
			<div class="ml-3 text-left min-w-0">
				<p class="text-sm font-black text-gray-900 truncate tracking-tight">
					{$currentTeam?.name || 'Personal'}
				</p>
				{#if $teamUsage}
					<p class="text-[10px] uppercase font-bold text-gray-500 truncate tracking-wider">
						{formatUsage($teamUsage)}
					</p>
				{/if}
			</div>
		</div>
		<svg
			class="w-5 h-5 text-gray-900 flex-shrink-0 transition-transform duration-200 border-2 border-transparent rounded bg-transparent"
			class:rotate-180={isOpen}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Dropdown Menu -->
	{#if isOpen}
		<div
			class="absolute left-0 right-0 mt-2 bg-white border-[3px] border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top"
			role="listbox"
			aria-label="Teams"
			on:keydown={(e) => { if (e.key === 'Escape') isOpen = false; }}
		>
			<!-- Usage Bar (if current team) -->
			{#if $currentTeam && $teamUsage}
				<div class="px-4 py-3 border-b-[3px] border-gray-900 bg-gray-50">
					<div class="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2">
						<span class="text-gray-500">Monthly Usage</span>
						<span class="text-gray-900">{formatUsage($teamUsage)}</span>
					</div>
					<div class="w-full h-3 bg-white rounded-full overflow-hidden border-2 border-gray-900">
						<div
							class="h-full border-r-2 border-gray-900 transition-all duration-300 {getUsageColor($teamUsage)}"
							style="width: {getUsagePercentage($teamUsage)}%"
						></div>
					</div>
				</div>
			{/if}

			<!-- Migration prompt -->
			{#if $needsMigration}
				<div class="px-4 py-3 bg-yellow-50 border-b-[3px] border-gray-900">
					<p class="text-xs font-bold text-yellow-800 mb-2">
						Migrate to teams for shared quotas.
					</p>
					<button
						on:click={handleMigrate}
						disabled={loading}
						class="w-full px-3 py-2 text-xs font-black uppercase tracking-wider bg-yellow-400 border-2 border-gray-900 rounded-lg hover:bg-yellow-500 transition-colors shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50"
					>
						{loading ? 'Migrating...' : 'Migrate Now'}
					</button>
				</div>
			{/if}

			<!-- Team List -->
			<div class="max-h-60 overflow-y-auto divide-y-2 divide-gray-100">
				{#each $teams as teamItem}
					<button
						on:click={() => handleSwitchTeam(teamItem.team?.uid)}
						role="option"
						aria-selected={teamItem.team?.uid === $currentTeam?.uid}
						class="w-full flex items-center px-4 py-3 hover:bg-[#FFFDF8] transition-colors text-left group
							{teamItem.team?.uid === $currentTeam?.uid ? 'bg-[#FFFDF8]' : ''}"
						disabled={loading}
					>
						<div class="w-8 h-8 rounded-lg bg-gray-100 border-2 border-gray-900 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ffc480] transition-colors">
							{#if teamItem.team?.avatar}
								<img src={teamItem.team.avatar} alt={teamItem.team.name} class="w-full h-full rounded-lg object-cover" />
							{:else}
								<span class="text-xs font-black text-gray-900">
									{teamItem.team?.name?.charAt(0)?.toUpperCase() || 'T'}
								</span>
							{/if}
						</div>
						<div class="ml-3 min-w-0 flex-1">
							<p class="text-sm font-black text-gray-900 truncate group-hover:text-[#ff6b6b] transition-colors">{teamItem.team?.name}</p>
							<p class="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{teamItem.role?.name || 'Member'}</p>
						</div>
						{#if teamItem.team?.uid === $currentTeam?.uid}
							<div class="w-2 h-2 rounded-full bg-[#4ade80] border border-gray-900 shadow-[1px_1px_0_0_#1f2937]"></div>
						{/if}
					</button>
				{/each}
			</div>

			<!-- Divider -->
			<div class="h-[3px] bg-gray-900"></div>

			<!-- Create Team / Team Settings -->
			{#if isCreating}
				<div class="px-4 py-3 bg-gray-50">
					<label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">New Team Name</label>
					<input
						type="text"
						bind:value={newTeamName}
						placeholder="Acme Corp"
						class="w-full px-3 py-2 text-sm font-bold border-[3px] border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none mb-2"
						on:keydown={(e) => e.key === 'Enter' && handleCreateTeam()}
					/>
					{#if error}
						<p class="text-xs font-bold text-[#ff6b6b] mb-2">{error}</p>
						{#if errorWithUpgrade}
							<a
								href="/dashboard/upgrade"
								class="inline-block mb-2 text-xs font-black text-[#ff6b6b] uppercase tracking-wide border-b-2 border-[#ff6b6b] hover:text-red-600"
							>
								Upgrade Plan →
							</a>
						{/if}
					{/if}
					<div class="flex gap-2">
						<button
							on:click={handleCreateTeam}
							disabled={loading}
							class="flex-1 px-3 py-2 text-xs font-black uppercase tracking-wider text-white bg-gray-900 rounded-lg border-2 border-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-50"
						>
							{loading ? '...' : 'Create'}
						</button>
						<button
							on:click={() => { isCreating = false; error = null; errorWithUpgrade = false; }}
							class="px-3 py-2 text-xs font-black uppercase tracking-wider text-gray-600 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-900 hover:text-gray-900 transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			{:else}
				<div class="p-2 bg-gray-50">
					{#if $ownsTeam}
						<!-- User already owns a team - show upgrade message -->
						<div class="px-3 py-2 text-center">
							<p class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">One free team limit</p>
							<a
								href="/dashboard/upgrade"
								on:click={() => { isOpen = false; }}
								class="flex items-center justify-center w-full px-3 py-2 text-xs font-black text-white bg-[#ff6b6b] rounded-lg border-2 border-gray-900 hover:bg-[#ff5252] shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all uppercase tracking-wider"
							>
								Upgrade
							</a>
						</div>
					{:else}
						<button
							on:click={() => { isCreating = true; }}
							class="w-full flex items-center px-3 py-2 text-xs font-black text-gray-600 uppercase tracking-wider hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Create New Team
						</button>
					{/if}

					{#if $currentTeam}
						<button
							on:click={goToTeamSettings}
							class="w-full flex items-center px-3 py-2 text-xs font-black text-gray-600 uppercase tracking-wider hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							Team Settings
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
