<script>
	import { getUser } from '../../store/user.store';

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let user = null;
	onMount(async () => {
		console.log('Dashboard');
		user = await getUser();
		if (!user || !user?.email) {
			console.log('User not logged in');
			goto('/login');
		} else {
            goto('/dashboard/api-token');
        }
	});
</script>
<svelte:head>
	<title>Pictify.io: Dashboard</title>
</svelte:head>