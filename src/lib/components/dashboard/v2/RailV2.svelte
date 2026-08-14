<script>
	/**
	 * The shell's rail: context (team) at the top, location (nav) in the middle,
	 * the meters at the bottom. The meters are the house signature — usage drawn
	 * as raster filling in, not a progress bar.
	 *
	 * The designed IA is seven destinations. Everything the old sidebar reached
	 * stays reachable under MORE until those pages are folded into the new map.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import NavIcon from './NavIcon.svelte';
	import DitherMeter from './DitherMeter.svelte';
	import VerifyEmailCard from './VerifyEmailCard.svelte';
	import { currentTeam, teams, teamMembers, initializeTeamState, switchTeamAction } from '../../../../store/team.store';
	import { usageWidget, initPLG, PLAN_DISPLAY_NAMES } from '../../../../store/plg.store';
	import { user, activeApiToken, getAPITokenAction } from '../../../../store/user.store';

	const SHOP = [
		{ href: '/dashboard', icon: 'home', label: 'Home', exact: true },
		{ href: '/dashboard/media/images', icon: 'renders', label: 'Renders' },
		{ href: '/dashboard/template', icon: 'templates', label: 'Templates' },
		{ href: '/dashboard/integrations', icon: 'callers', label: 'Callers' }
	];
	const ACCOUNT = [
		{ href: '/dashboard/billing', icon: 'usage', label: 'Usage & billing' },
		{ href: '/dashboard/team', icon: 'team', label: 'Team & invites' },
		{ href: '/dashboard/api-token', icon: 'settings', label: 'Settings' }
	];
	// Legacy destinations the new IA hasn't absorbed yet. Plain rows, no icons —
	// visibly temporary.
	const MORE = [
		{ href: '/dashboard/agents', label: 'MCP & agents' },
		{ href: '/dashboard/workflows', label: 'Workflows' },
		{ href: '/dashboard/brand-assets', label: 'Brand assets' },
		{ href: '/dashboard/api-playground', label: 'API playground' },
		{ href: '/dashboard/analytics', label: 'Analytics' },
		{ href: '/dashboard/activity-logs', label: 'Activity logs' }
	];

	let switcherOpen = false;
	let copied = false;

	$: path = $page.url.pathname;
	const isActive = (item) =>
		item.exact ? path === item.href : path === item.href || path.startsWith(item.href + '/');

	$: teamName = $currentTeam?.name || 'My workspace';
	$: memberCount = $teamMembers?.length || 0;
	$: planName = PLAN_DISPLAY_NAMES[$usageWidget?.plan] || 'Free';
	$: subline = memberCount > 1 ? `${memberCount} members` : planName + ' plan';
	$: keyMasked = $activeApiToken?.token
		? `pic_live_••••${$activeApiToken.token.slice(-5)}`
		: null;

	async function copyKey() {
		if (!$activeApiToken?.token) return;
		try {
			await navigator.clipboard.writeText($activeApiToken.token);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch {
			// Clipboard denied — nothing useful to show beyond the unchanged chip.
		}
	}

	async function pickTeam(teamId) {
		switcherOpen = false;
		if (teamId === $currentTeam?.uid) return;
		try {
			await switchTeamAction(teamId);
			window.location.reload();
		} catch {
			// Switch failed server-side; staying on the current team is the state.
		}
	}

	onMount(() => {
		initializeTeamState();
		initPLG();
		getAPITokenAction().catch(() => {});
	});
</script>

<nav class="flex h-full w-[220px] flex-shrink-0 flex-col bg-brand-canvas px-[18px] py-[22px]">
	<!-- The nav list scrolls internally on short viewports; the logo/switcher
	     above and the meters below stay pinned — the meters are the signature,
	     they never leave the frame. -->
	<div class="flex flex-1 flex-col gap-5 overflow-hidden">
		<a href="/dashboard" class="flex items-center gap-2" aria-label="Pictify home">
			<span class="flex h-6 w-6 items-center justify-center rounded-md bg-brand-ink">
				<span class="block h-[9px] w-[9px] bg-brand-field"></span>
			</span>
			<span class="font-display text-[19px] font-extrabold tracking-[-0.03em] text-brand-ink">Pictify</span>
		</a>

		<!-- Team switcher: context, kept visually distinct from the active-nav card
		     by its hairline border. -->
		<div class="relative">
			<button
				type="button"
				on:click={() => (switcherOpen = !switcherOpen)}
				class="flex w-full items-center justify-between rounded-md border border-black/[0.08] bg-white/85 px-[11px] py-2 text-left"
				aria-expanded={switcherOpen}
			>
				<span class="flex items-center gap-2">
					<span class="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-brand-blue">
						<span class="font-display text-[11px] font-extrabold text-white">
							{teamName.charAt(0).toUpperCase()}
						</span>
					</span>
					<span class="flex flex-col">
						<span class="max-w-[110px] truncate font-sans text-[12.5px] font-bold text-brand-ink">{teamName}</span>
						<span class="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">{subline}</span>
					</span>
				</span>
				<span class="text-[11px] text-brand-mute">⌄</span>
			</button>
			{#if switcherOpen}
				<div class="absolute left-0 right-0 top-full z-30 mt-1 flex flex-col overflow-hidden rounded-md border border-black/10 bg-white shadow-lg">
					{#each $teams as membership (membership.team?.uid)}
						<button
							type="button"
							on:click={() => pickTeam(membership.team?.uid)}
							class="flex items-center justify-between px-3 py-2 text-left font-sans text-[13px] text-brand-ink hover:bg-brand-canvas"
						>
							<span class="truncate">{membership.team?.name}</span>
							{#if membership.team?.uid === $currentTeam?.uid}
								<span class="ml-2 block h-2 w-2 flex-shrink-0 bg-brand-proof" aria-label="current team"></span>
							{/if}
						</button>
					{/each}
					<a
						href="/dashboard/team"
						class="border-t border-black/[0.08] px-3 py-2 font-sans text-[13px] font-semibold text-brand-slate hover:bg-brand-canvas"
					>
						Invite a teammate →
					</a>
				</div>
			{/if}
		</div>

		<div class="flex min-h-0 flex-col gap-1.5 overflow-y-auto">
			<span class="px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">Shop</span>
			{#each SHOP as item (item.href)}
				{@const active = isActive(item)}
				<a
					href={item.href}
					class="flex items-center gap-[9px] rounded-btn px-2 py-[7px] {active
						? 'bg-white/85 text-brand-ink'
						: 'text-brand-slate hover:bg-white/50'}"
					aria-current={active ? 'page' : undefined}
				>
					<NavIcon name={item.icon} />
					<span class="font-sans text-sm {active ? 'font-semibold text-brand-ink' : ''}">{item.label}</span>
				</a>
			{/each}

			<span class="px-2 pb-1 pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">Account</span>
			{#each ACCOUNT as item (item.href)}
				{@const active = isActive(item)}
				<a
					href={item.href}
					class="flex items-center gap-[9px] rounded-btn px-2 py-[7px] {active
						? 'bg-white/85 text-brand-ink'
						: 'text-brand-slate hover:bg-white/50'}"
					aria-current={active ? 'page' : undefined}
				>
					<NavIcon name={item.icon} />
					<span class="font-sans text-sm {active ? 'font-semibold text-brand-ink' : ''}">{item.label}</span>
				</a>
			{/each}

			<details class="pt-4">
				<summary class="cursor-pointer list-none px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">
					More ▾
				</summary>
				{#each MORE as item (item.href)}
					<a
						href={item.href}
						class="flex items-center rounded-btn px-2 py-1.5 font-sans text-[13px] {isActive(item)
							? 'bg-white/85 font-semibold text-brand-ink'
							: 'text-brand-slate hover:bg-white/50'}"
					>
						{item.label}
					</a>
				{/each}
			</details>
		</div>
	</div>

	<div class="flex flex-shrink-0 flex-col gap-3 pt-6">
		{#if $user?.isEmailVerified === false}
			<VerifyEmailCard email={$user?.email || ''} />
		{/if}
		<div class="flex flex-col gap-3 border-t border-black/10 pt-3.5">
			<DitherMeter
				label="Renders"
				used={$usageWidget?.current ?? 0}
				total={$usageWidget?.limit ?? 0}
				fill="bg-brand-field"
			/>
			{#if $usageWidget?.aiCredits}
				<DitherMeter
					label="AI quota"
					used={$usageWidget.aiCredits.used ?? 0}
					total={$usageWidget.aiCredits.limit ?? 0}
					fill="bg-brand-pink"
				/>
			{/if}
		</div>
		{#if keyMasked}
			<button
				type="button"
				on:click={copyKey}
				class="flex items-center justify-between rounded-btn bg-white/85 px-2.5 py-2 text-left"
				title="Copy API key"
			>
				<span class="font-mono text-[11px] text-brand-slate">{keyMasked}</span>
				<span class="font-mono text-[10px] {copied ? 'text-brand-proof' : 'text-brand-mute'}">
					{copied ? 'COPIED' : 'COPY'}
				</span>
			</button>
		{/if}
	</div>
</nav>
