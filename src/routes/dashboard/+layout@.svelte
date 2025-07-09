<script>
	import '../../app.css';
	import Nav from '$lib/components/dashboard/Nav.svelte';
	import SideNav from '$lib/components/dashboard/SideNav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';

	import { getUser } from '../../store/user.store';

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let user = null;
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

<Nav />
<div class="min-h-screen flex flex-col">
	<div class="flex flex-col sm:flex-row w-100 flex-grow">
		<div class="sm:border-r-[3px] border-black">
			<SideNav />
		</div>
		<div class="flex-grow">
			<slot />
		</div>
	</div>
	<Footer />
</div>
