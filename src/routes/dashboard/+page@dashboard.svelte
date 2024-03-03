<script>
	import { getUser } from '../../store/user.store';

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let user = null;
	onMount(async () => {
		user = await getUser();
		if (!user.email) {
			goto('/login');
		} else {
            goto('/dashboard/api-token');
        }
	});
</script>
