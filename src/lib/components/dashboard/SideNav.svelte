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

	$: isPaidPlan = $user?.currentPlan !== 'starter' && $user?.currentPlan !== 'free';
	$: currentPath = $page.url.pathname;

	// Helper: check if a path is active (takes currentPath so Svelte tracks reactivity)
	function isActive(current, path) {
		if (path === '/dashboard') return current === '/dashboard';
		return current === path || current.startsWith(path + '/');
	}

	onMount(async () => {
		try {
			await initializeTeamState();
		} catch (error) {
			console.error('Failed to initialize team state:', error);
		}
	});

	async function gotoPaymentPortal() {
		const paymentPortal = await getPaymentPortal();
		if (!paymentPortal.portalLink) return;
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

		<nav class="space-y-1" aria-label="Main navigation">
			<!-- Home -->
			<a
				href="/dashboard"
				aria-current={isActive(currentPath, '/dashboard') && currentPath === '/dashboard' ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{$page.url.pathname === '/dashboard'
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {$page.url.pathname === '/dashboard' ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
				</svg>
				<span>Home</span>
			</a>

			<!-- ═══ CONTENT Section ═══ -->
			<p class="px-4 pt-5 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Content</p>

			<!-- Templates -->
			<a
				href="/dashboard/template"
				aria-current={isActive(currentPath, '/dashboard/template') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{isActive(currentPath, '/dashboard/template')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {isActive(currentPath, '/dashboard/template') ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
				</svg>
				<span>Templates</span>
			</a>

			<!-- Brand Assets -->
			<a
				href="/dashboard/brand-assets"
				aria-current={isActive(currentPath, '/dashboard/brand-assets') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{isActive(currentPath, '/dashboard/brand-assets')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {isActive(currentPath, '/dashboard/brand-assets') ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
				</svg>
				<span>Brand Assets</span>
			</a>

			<!-- Experiments -->
			<a
				href="/dashboard/experiments"
				aria-current={isActive(currentPath, '/dashboard/experiments') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{isActive(currentPath, '/dashboard/experiments')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {isActive(currentPath, '/dashboard/experiments') ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
				</svg>
				<span>Experiments</span>
			</a>

			<!-- ═══ MEDIA Section ═══ -->
			<p class="px-4 pt-5 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Media</p>

			<a
				href="/dashboard/media/images"
				aria-current={$page.url.pathname === '/dashboard/media/images' ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{$page.url.pathname === '/dashboard/media/images'
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {$page.url.pathname === '/dashboard/media/images' ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
				</svg>
				<span>Images</span>
			</a>

			<a
				href="/dashboard/media/gifs"
				aria-current={$page.url.pathname === '/dashboard/media/gifs' ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{$page.url.pathname === '/dashboard/media/gifs'
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {$page.url.pathname === '/dashboard/media/gifs' ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
				</svg>
				<span>GIFs</span>
			</a>

			<a
				href="/dashboard/media/pdfs"
				aria-current={$page.url.pathname === '/dashboard/media/pdfs' ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{$page.url.pathname === '/dashboard/media/pdfs'
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {$page.url.pathname === '/dashboard/media/pdfs' ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
				</svg>
				<span>PDFs</span>
			</a>

			<!-- ═══ ANALYTICS Section ═══ -->
			<p class="px-4 pt-5 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Analytics</p>

			<!-- Activity Logs -->
			<a
				href="/dashboard/activity-logs"
				aria-current={isActive(currentPath, '/dashboard/activity-logs') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{isActive(currentPath, '/dashboard/activity-logs')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {isActive(currentPath, '/dashboard/activity-logs') ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
				</svg>
				<span>Activity Logs</span>
			</a>

			<!-- ═══ DEVELOPER Section ═══ -->
			<p class="px-4 pt-5 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Developer</p>

			<!-- API Playground -->
			<a
				href="/dashboard/api-playground"
				aria-current={isActive(currentPath, '/dashboard/api-playground') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{isActive(currentPath, '/dashboard/api-playground')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {isActive(currentPath, '/dashboard/api-playground') ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
				</svg>
				<span>API Playground</span>
			</a>

			<!-- API Keys -->
			<a
				href="/dashboard/api-token"
				aria-current={isActive(currentPath, '/dashboard/api-token') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{isActive(currentPath, '/dashboard/api-token')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {isActive(currentPath, '/dashboard/api-token') ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
				</svg>
				<span>API Keys</span>
			</a>

			<!-- Integrations -->
			<a
				href="/dashboard/integrations"
				aria-current={isActive(currentPath, '/dashboard/integrations') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{isActive(currentPath, '/dashboard/integrations')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {isActive(currentPath, '/dashboard/integrations') ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
				</svg>
				<span>Integrations</span>
			</a>

			<!-- ═══ Bottom Section ═══ -->
			<div class="h-[2px] bg-gray-200 my-4 mx-4"></div>

			<!-- Team Settings (visible when user has a team) -->
			{#if $currentTeam}
				<a
					href="/dashboard/team"
					aria-current={isActive(currentPath, '/dashboard/team') ? 'page' : undefined}
					class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
						{isActive(currentPath, '/dashboard/team')
							? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
							: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
				>
					<svg class="w-5 h-5 mr-3 {isActive(currentPath, '/dashboard/team') ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
			<a
				href="/dashboard/billing"
				aria-current={isActive(currentPath, '/dashboard/billing') ? 'page' : undefined}
				class="group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
					{isActive(currentPath, '/dashboard/billing')
						? 'bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937]'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-[3px] border-transparent'}"
			>
				<svg class="w-5 h-5 mr-3 {isActive(currentPath, '/dashboard/billing') ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
		<!-- Keyboard shortcut hint -->
		<div class="flex items-center justify-center mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
			<kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono mr-1">&#8984;K</kbd>
			to search
		</div>

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
