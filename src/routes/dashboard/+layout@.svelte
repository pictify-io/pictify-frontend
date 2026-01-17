<script>
	import '../../app.css';
	import Nav from '$lib/components/dashboard/Nav.svelte';
	import SideNav from '$lib/components/dashboard/SideNav.svelte';
	import VerifyEmailBanner from '$lib/components/dashboard/VerifyEmailBanner.svelte';
	import PLGProvider from '$lib/components/plg/PLGProvider.svelte';

	import { getUser } from '../../store/user.store';

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	import { page } from '$app/stores';

	let user = null;
	let isSidebarOpen = false; // Default to closed on mobile
	let windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

	function toggleSidebar() {
		// Only toggle on mobile screens
		if (windowWidth < 1024) {
			isSidebarOpen = !isSidebarOpen;
		}
	}

	function closeSidebar() {
		if (windowWidth < 1024) {
			isSidebarOpen = false;
		}
	}

	// Close sidebar on route change (mobile only)
	$: if ($page.url.pathname && windowWidth < 1024) {
		closeSidebar();
	}

	// Handle window resize
	function handleResize() {
		windowWidth = window.innerWidth;
		// Auto-adjust sidebar state based on screen size
		if (windowWidth >= 1024) {
			isSidebarOpen = true; // Always visible on desktop
		} else {
			isSidebarOpen = false; // Hidden by default on mobile/tablet
		}
	}

	onMount(async () => {
		user = await getUser();
		if (!user || !user?.email) {
			goto('/login');
			return;
		}

		// Only redirect to api-token if user is on the exact dashboard root path
		const currentPath = window.location.pathname;
		if (currentPath === '/dashboard' || currentPath === '/dashboard/') {
			goto('/dashboard/api-token');
		}

		// Add resize listener
		window.addEventListener('resize', handleResize);
		handleResize(); // Initial check

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});
</script>



<svelte:head>
	<title>Pictify.io: Dashboard</title>
</svelte:head>

<PLGProvider>
	<div class="h-screen flex flex-col overflow-hidden bg-[#FFFDF8]">
	<Nav on:toggleSidebar={toggleSidebar} />
	{#if user?.isEmailVerified === false}
		<VerifyEmailBanner email={user?.email} />
	{/if}
	<div class="flex w-full flex-grow overflow-hidden relative">
		<!-- Backdrop for mobile/tablet -->
		{#if isSidebarOpen && windowWidth < 1024}
				<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
				on:click={closeSidebar}
				on:keydown={(e) => e.key === 'Escape' && closeSidebar()}
				role="button"
				tabindex="0"
					aria-label="Close sidebar"
			></div>
		{/if}

		<!-- Sidebar -->
		<div
			class="
				fixed inset-y-0 left-0 z-50 bg-[#FFFDF8] transition-transform duration-300 ease-in-out
				lg:relative lg:z-0 lg:h-full lg:overflow-hidden
				w-64 min-w-[16rem]
				{isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
				lg:translate-x-0
			"
		>
			<SideNav />
		</div>

		<!-- Main content -->
		<div class="flex-grow h-full overflow-y-auto overflow-x-hidden min-w-0 bg-[#FFFDF8] relative" style="scrollbar-gutter: stable;">
			<!-- Background Grid -->
			<div class="absolute inset-0 opacity-5 pointer-events-none"
				style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;">
			</div>
			<div class="w-full max-w-7xl mx-auto p-6 h-full relative z-10">
				<slot />
			</div>
		</div>
	</div>
</div>
</PLGProvider>
