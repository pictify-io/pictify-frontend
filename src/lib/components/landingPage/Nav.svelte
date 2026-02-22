<script>
	let showMobileMenu = false;
	import { user } from '../../../store/user.store';
	import { onMount, onDestroy } from 'svelte';
	import { PUBLIC_DOCS_URL } from '$env/static/public';
	import { analytics } from '$lib/analytics.js';

	let isLoggedIn = false;
	let unsubscribe = () => {};

	onMount(async () => {
		unsubscribe = user.subscribe((u) => {
			isLoggedIn = !!u.email;
		});
	});

	onDestroy(() => {
		isLoggedIn = false;
		unsubscribe();
	});
	import { fly } from 'svelte/transition';

	function trackNav(linkText, destination, location = 'header') {
		analytics.trackNavClick({ link_text: linkText, destination, location });
	}

	function trackOutbound(url, linkText, location = 'header') {
		analytics.trackOutboundLink({ url, link_text: linkText, location });
	}

	function trackCTA(ctaText, location = 'header') {
		analytics.trackCTAClicked({ cta_text: ctaText, location });
	}
</script>

<header
    in:fly={{ y: -20, duration: 800, delay: 0 }}
	class="w-full h-20 z-50 border-b-[3px] border-gray-900 bg-[#FFFDF8] sticky top-0 flex justify-between items-stretch"
>
	<!-- Brand Logo -->
	<a
		href="/"
		class="flex flex-shrink-0 items-center justify-center px-6 sm:px-8 no-underline cursor-pointer border-r-[3px] border-gray-900 hover:bg-[#ffc480] transition-all group relative overflow-hidden"
	>
		
		<div class="flex items-center gap-2 sm:gap-3">
			<!-- Logo Icon (Abstract Shapes) -->
			<div class="w-8 h-8 sm:w-9 sm:h-9 bg-gray-900 rounded-md flex items-center justify-center shadow-[3px_3px_0_0_#ffc480] group-hover:shadow-none group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-all border-2 border-transparent">
				<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</div>
			
			<!-- Text -->
			<span class="text-xl sm:text-2xl font-black text-gray-900 tracking-tight group-hover:translate-x-1 transition-transform">PICTIFY</span>
		</div>
	</a>

	<!-- Desktop Nav (Centered) -->
	<nav class="hidden md:flex flex-1 items-center justify-center">
		<div class="flex items-center space-x-1">
			<a
				href={PUBLIC_DOCS_URL}
				target="_blank"
				class="px-6 py-3 text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors uppercase tracking-wide"
				on:click={() => trackOutbound(PUBLIC_DOCS_URL, 'Docs', 'header')}
				>Docs</a
			>
			<a
				href="/pricing"
				class="px-6 py-3 text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors uppercase tracking-wide"
				on:click={() => trackNav('Pricing', '/pricing', 'header')}
				>Pricing</a
			>
			<a
				href="/tools"
				class="px-6 py-3 text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors uppercase tracking-wide"
				on:click={() => trackNav('Tools', '/tools', 'header')}
				>Tools</a
			>
			<a
				href="/templates"
				class="px-6 py-3 text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors uppercase tracking-wide"
				on:click={() => trackNav('Templates', '/templates', 'header')}
				>Templates</a
			>
			<a
				href="/integrations"
				class="px-6 py-3 text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors uppercase tracking-wide"
				on:click={() => trackNav('Integrations', '/integrations', 'header')}
				>Integrations</a
			>
			<a
				href="/blogs"
				class="px-6 py-3 text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors uppercase tracking-wide"
				on:click={() => trackNav('Blog', '/blogs', 'header')}
				>Blog</a
			>
		</div>
	</nav>

	<!-- Right Side Actions -->
	<div class="flex items-stretch">
		
		<!-- Desktop Auth Buttons -->
		<div class="hidden md:flex h-full items-stretch border-l-[3px] border-gray-900">
			{#if !isLoggedIn}
				<a
					href="/login"
					class="px-8 flex items-center justify-center text-sm font-bold text-gray-900 hover:bg-gray-100 transition-colors uppercase tracking-wide"
					on:click={() => trackCTA('Sign In', 'header')}
				>
					Sign In
				</a>
				<a
					href="/login"
					class="px-8 flex items-center justify-center text-sm font-bold text-white bg-gray-900 hover:bg-[#ff6b6b] hover:text-gray-900 transition-all uppercase tracking-wide border-l-[3px] border-gray-900"
					on:click={() => trackCTA('Start Building Free', 'header')}
				>
					Start Building Free
				</a>
			{:else}
				<a
					href="/dashboard"
					class="px-8 flex items-center justify-center text-sm font-bold text-white bg-gray-900 hover:bg-[#4ade80] hover:text-gray-900 transition-all uppercase tracking-wide"
					on:click={() => trackNav('Dashboard', '/dashboard', 'header')}
				>
					Dashboard
				</a>
			{/if}
		</div>

		<!-- Mobile Menu Button -->
		<button
			class="md:hidden w-20 border-l-[3px] border-gray-900 flex items-center justify-center hover:bg-gray-100 transition-colors"
			on:click={() => (showMobileMenu = !showMobileMenu)}
			aria-label="Toggle Menu"
		>
			{#if showMobileMenu}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			{/if}
		</button>
	</div>
</header>

<!-- Mobile Menu Overlay -->
{#if showMobileMenu}
	<div class="fixed inset-0 z-40 bg-[#FFFDF8] pt-20 md:hidden overflow-y-auto">
		<nav class="flex flex-col p-6 space-y-4">
			<a
				href={PUBLIC_DOCS_URL}
				target="_blank"
				class="p-4 text-lg font-black text-gray-900 border-[3px] border-gray-900 bg-white shadow-[4px_4px_0_0_#000] rounded-xl uppercase active:translate-y-1 active:shadow-none transition-all"
				on:click={() => trackOutbound(PUBLIC_DOCS_URL, 'Docs', 'mobile_menu')}
				>Docs</a
			>
			<a
				href="/pricing"
				class="p-4 text-lg font-black text-gray-900 border-[3px] border-gray-900 bg-white shadow-[4px_4px_0_0_#000] rounded-xl uppercase active:translate-y-1 active:shadow-none transition-all"
				on:click={() => trackNav('Pricing', '/pricing', 'mobile_menu')}
				>Pricing</a
			>
			<a
				href="/tools"
				class="p-4 text-lg font-black text-gray-900 border-[3px] border-gray-900 bg-white shadow-[4px_4px_0_0_#000] rounded-xl uppercase active:translate-y-1 active:shadow-none transition-all"
				on:click={() => trackNav('Tools', '/tools', 'mobile_menu')}
				>Tools</a
			>
			<a
				href="/templates"
				class="p-4 text-lg font-black text-gray-900 border-[3px] border-gray-900 bg-white shadow-[4px_4px_0_0_#000] rounded-xl uppercase active:translate-y-1 active:shadow-none transition-all"
				on:click={() => trackNav('Templates', '/templates', 'mobile_menu')}
				>Templates</a
			>
			<a
				href="/integrations"
				class="p-4 text-lg font-black text-gray-900 border-[3px] border-gray-900 bg-white shadow-[4px_4px_0_0_#000] rounded-xl uppercase active:translate-y-1 active:shadow-none transition-all"
				on:click={() => trackNav('Integrations', '/integrations', 'mobile_menu')}
				>Integrations</a
			>
			<a
				href="/blogs"
				class="p-4 text-lg font-black text-gray-900 border-[3px] border-gray-900 bg-white shadow-[4px_4px_0_0_#000] rounded-xl uppercase active:translate-y-1 active:shadow-none transition-all"
				on:click={() => trackNav('Blog', '/blogs', 'mobile_menu')}
				>Blog</a
			>

			<div class="h-px bg-gray-900 opacity-10 my-2"></div>

			{#if !isLoggedIn}
				<a
					href="/login"
					class="p-4 text-center text-lg font-black text-gray-900 border-[3px] border-gray-900 bg-gray-100 rounded-xl uppercase active:translate-y-1 active:shadow-[2px_2px_0_0_#000] transition-all"
					on:click={() => trackCTA('Sign In', 'mobile_menu')}
				>
					Sign In
				</a>
				<a
					href="/login"
					class="p-4 text-center text-lg font-black text-white border-[3px] border-gray-900 bg-[#ff6b6b] shadow-[4px_4px_0_0_#000] rounded-xl uppercase active:translate-y-1 active:shadow-none transition-all"
					on:click={() => trackCTA('Start Building Free', 'mobile_menu')}
				>
					Start Building Free
				</a>
			{:else}
				<a
					href="/dashboard"
					class="p-4 text-center text-lg font-black text-gray-900 border-[3px] border-gray-900 bg-[#4ade80] shadow-[4px_4px_0_0_#000] rounded-xl uppercase active:translate-y-1 active:shadow-none transition-all"
					on:click={() => trackNav('Dashboard', '/dashboard', 'mobile_menu')}
				>
					Dashboard
				</a>
			{/if}
		</nav>
	</div>
{/if}