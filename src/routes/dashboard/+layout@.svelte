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
	let isSidebarOpen = false;

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	function closeSidebar() {
		isSidebarOpen = false;
	}

	// Close sidebar on route change
	$: if ($page.url.pathname) {
		closeSidebar();
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
	<div class="flex flex-col sm:flex-row w-full flex-grow overflow-hidden relative">
		<!-- Backdrop for mobile -->
		{#if isSidebarOpen}
				<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div 
				class="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
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
					fixed inset-y-0 left-0 z-50 w-64 bg-[#FFFDF8] transition-transform duration-300 ease-in-out transform 
					sm:relative sm:translate-x-0 sm:block sm:z-0 sm:h-full sm:overflow-hidden
				{isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
			"
		>
			<SideNav />
		</div>

			<div class="flex-grow h-full overflow-y-auto min-w-0 flex flex-col bg-[#FFFDF8]">
			<div class="flex-grow">
				<slot />
			</div>
		</div>
	</div>
</div>
</PLGProvider>
