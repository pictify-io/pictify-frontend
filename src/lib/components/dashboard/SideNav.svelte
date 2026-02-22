<script>
	import { logoutAction } from '../../../store/user.store';
	import { goto } from '$app/navigation';
	import { PUBLIC_DOCS_URL } from '$env/static/public';
	import { getPaymentPortal } from '../../../api/user';
	import { user } from '../../../store/user.store';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { openUpgradeModal } from '../../../store/upgrade-modal.store';
	import TeamSwitcher from './TeamSwitcher.svelte';
	import { initializeTeamState, currentTeam, isTeamOwner } from '../../../store/team.store';

	let isMediaListExpanded = false;

	$: isPaidPlan = $user?.currentPlan !== 'starter' && $user?.currentPlan !== 'free';

	function toggleMediaList() {
		isMediaListExpanded = !isMediaListExpanded;
	}

	// Reactive statement to auto-expand media list when on a media sub-route
	$: if ($page.url.pathname.startsWith('/dashboard/media/')) {
		isMediaListExpanded = true;
	}

	onMount(async () => {
		// Initialize team state
		try {
			await initializeTeamState();
		} catch (error) {
			console.error('Failed to initialize team state:', error);
		}
	});

	async function gotoPaymentPortal() {
		const paymentPortal = await getPaymentPortal();
		if (!paymentPortal.portalLink) {
			return;
		}
		window.open(paymentPortal.portalLink, '_blank');
	}

	function logout() {
		logoutAction();
		goto('/');
	}
</script>

<div class="flex flex-col h-full bg-[#FFFDF8] w-full border-r-[3px] border-gray-900 relative overflow-hidden">

	<!-- Navigation -->
	<div class="flex-1 overflow-y-auto py-6 px-3 relative z-10 scrollbar-hide">

		<!-- Team Switcher -->
		<div class="mb-6">
			<TeamSwitcher />
		</div>

		<nav class="space-y-2" aria-label="Main navigation">
			<!-- Templates -->
			<a
				href="/dashboard/template"
				aria-current={$page.url.pathname === '/dashboard/template' || $page.url.pathname.startsWith('/dashboard/template/') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{$page.url.pathname === '/dashboard/template' || $page.url.pathname.startsWith('/dashboard/template/')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {($page.url.pathname === '/dashboard/template' || $page.url.pathname.startsWith('/dashboard/template/')) ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
				</svg>
				<span>Templates</span>
			</a>

			<!-- Brand Assets -->
			<a
				href="/dashboard/brand-assets"
				aria-current={$page.url.pathname === '/dashboard/brand-assets' || $page.url.pathname.startsWith('/dashboard/brand-assets/') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{$page.url.pathname === '/dashboard/brand-assets' || $page.url.pathname.startsWith('/dashboard/brand-assets/')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {($page.url.pathname === '/dashboard/brand-assets' || $page.url.pathname.startsWith('/dashboard/brand-assets/')) ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
				</svg>
				<span>Brand Assets</span>
			</a>

			<!-- Created Media Section -->
				<!-- Expanded state: Dropdown -->
				<div class="relative">
					<button
						on:click={toggleMediaList}
						aria-expanded={isMediaListExpanded}
						aria-controls="media-submenu"
						class="w-full group relative flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
							{$page.url.pathname.startsWith('/dashboard/media')
								? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
								: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
					>
						<div class="flex items-center">
							<svg class="w-5 h-5 mr-3 {$page.url.pathname.startsWith('/dashboard/media') ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
							</svg>
							<span>Generated Media</span>
						</div>
						<div class="rounded p-0.5 transition-colors">
							<svg
								class="w-4 h-4 transform transition-transform duration-200 {$page.url.pathname.startsWith('/dashboard/media') ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}"
								class:rotate-180={isMediaListExpanded}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
							</svg>
						</div>
					</button>

					{#if isMediaListExpanded}
						<div id="media-submenu" role="group" aria-label="Generated Media" class="mt-1 ml-4 space-y-1 pl-4 border-l-2 border-gray-200">
							<a
								href="/dashboard/media/images"
								aria-current={$page.url.pathname === '/dashboard/media/images' ? 'page' : undefined}
								class="flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200
									{$page.url.pathname === '/dashboard/media/images'
										? 'text-gray-900 bg-gray-100'
										: 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}"
							>
								Images
							</a>
							<a
								href="/dashboard/media/gifs"
								aria-current={$page.url.pathname === '/dashboard/media/gifs' ? 'page' : undefined}
								class="flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200
									{$page.url.pathname === '/dashboard/media/gifs'
										? 'text-gray-900 bg-gray-100'
										: 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}"
							>
								GIFs
							</a>
							<a
								href="/dashboard/media/pdfs"
								aria-current={$page.url.pathname === '/dashboard/media/pdfs' ? 'page' : undefined}
								class="flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200
									{$page.url.pathname === '/dashboard/media/pdfs'
										? 'text-gray-900 bg-gray-100'
										: 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}"
							>
								PDFs
							</a>
						</div>
					{/if}
				</div>

			<!-- Divider -->
			<div class="h-[2px] bg-gray-200 my-4 mx-4"></div>

			<!-- API Playground -->
			<a
				href="/dashboard/api-playground"
				aria-current={$page.url.pathname === '/dashboard/api-playground' || $page.url.pathname.startsWith('/dashboard/api-playground/') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{$page.url.pathname === '/dashboard/api-playground' || $page.url.pathname.startsWith('/dashboard/api-playground/')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {($page.url.pathname === '/dashboard/api-playground' || $page.url.pathname.startsWith('/dashboard/api-playground/')) ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
				</svg>
				<span>API Playground</span>
			</a>

			<!-- API Usage -->
			<a
				href="/dashboard/api-token"
				aria-current={$page.url.pathname === '/dashboard/api-token' || $page.url.pathname.startsWith('/dashboard/api-token/') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{$page.url.pathname === '/dashboard/api-token' || $page.url.pathname.startsWith('/dashboard/api-token/')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {($page.url.pathname === '/dashboard/api-token' || $page.url.pathname.startsWith('/dashboard/api-token/')) ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
				</svg>
				<span>API Usage</span>
			</a>

			<!-- Activity Logs -->
			<a
				href="/dashboard/activity-logs"
				aria-current={$page.url.pathname === '/dashboard/activity-logs' || $page.url.pathname.startsWith('/dashboard/activity-logs/') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{$page.url.pathname === '/dashboard/activity-logs' || $page.url.pathname.startsWith('/dashboard/activity-logs/')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {($page.url.pathname === '/dashboard/activity-logs' || $page.url.pathname.startsWith('/dashboard/activity-logs/')) ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
				</svg>
				<span>Activity Logs</span>
			</a>

			<!-- Integrations -->
			<a
				href="/dashboard/integrations"
				aria-current={$page.url.pathname === '/dashboard/integrations' || $page.url.pathname.startsWith('/dashboard/integrations/') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{$page.url.pathname === '/dashboard/integrations' || $page.url.pathname.startsWith('/dashboard/integrations/')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {($page.url.pathname === '/dashboard/integrations' || $page.url.pathname.startsWith('/dashboard/integrations/')) ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
				</svg>
				<span>Integrations</span>
			</a>

			<!-- Team Settings (visible when user has a team) -->
			{#if $currentTeam}
				<div class="h-[2px] bg-gray-200 my-4 mx-4"></div>

				<a
					href="/dashboard/team"
					aria-current={$page.url.pathname === '/dashboard/team' || $page.url.pathname.startsWith('/dashboard/team/') ? 'page' : undefined}
					class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
						{$page.url.pathname === '/dashboard/team' || $page.url.pathname.startsWith('/dashboard/team/')
							? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
							: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
				>
					<svg class="w-5 h-5 mr-3 {($page.url.pathname === '/dashboard/team' || $page.url.pathname.startsWith('/dashboard/team/')) ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
					</svg>
					<span>Team Settings</span>
					{#if $isTeamOwner}
						<span class="ml-auto px-2 py-0.5 text-[10px] font-bold bg-[#ffc480] text-gray-900 rounded-full border border-gray-900">
							Owner
						</span>
					{/if}
				</a>
			{/if}

			<!-- Billing -->
			<div class="h-[2px] bg-gray-200 my-4 mx-4"></div>

			<a
				href="/dashboard/billing"
				aria-current={$page.url.pathname === '/dashboard/billing' || $page.url.pathname.startsWith('/dashboard/billing/') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{$page.url.pathname === '/dashboard/billing' || $page.url.pathname.startsWith('/dashboard/billing/')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {($page.url.pathname === '/dashboard/billing' || $page.url.pathname.startsWith('/dashboard/billing/')) ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
				</svg>
				<span>Billing</span>
				{#if !isPaidPlan}
					<span class="ml-auto px-2 py-0.5 text-[10px] font-bold bg-[#10b981] text-white rounded-full">
						Free
					</span>
				{/if}
			</a>

					</nav>

		<!-- Support Section -->
			<div class="mt-8 space-y-1 px-2">
				<a
					href={PUBLIC_DOCS_URL}
					target="_blank"
					class="flex items-center px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide hover:text-gray-900 transition-colors"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
					</svg>
					Documentation
				</a>
				<a
					href="https://status.pictify.io"
					target="_blank"
					class="flex items-center px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide hover:text-gray-900 transition-colors"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"/>
					</svg>
					System Status
				</a>
			</div>

	</div>

	<!-- Footer (Sticky at bottom) -->
	<div class="p-4 bg-white border-t-[3px] border-gray-900 relative z-20">
		<!-- Subscription CTA -->
		{#if !isPaidPlan}
			<a
				href="/dashboard/billing"
				class="w-full group relative flex items-center justify-center px-4 py-3 mb-3 text-xs font-black text-white bg-[#ff6b6b] uppercase tracking-wide rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden"
			>
				<div class="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]"></div>
				<svg class="w-4 h-4 mr-2 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
				</svg>
				<span class="relative z-10">Upgrade Plan</span>
			</a>
		{/if}

		<!-- Logout Button -->
		<button
			on:click={logout}
			class="w-full group flex items-center justify-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide rounded-xl border-[3px] border-transparent hover:bg-gray-100 hover:text-red-600 hover:border-gray-200 transition-all duration-200"
		>
			<svg class="w-4 h-4 mr-2 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
			</svg>
			<span>Logout</span>
		</button>
	</div>
</div>

<style>
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>