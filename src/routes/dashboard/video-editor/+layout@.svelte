<script>
	// Full-screen layout reset for the video editor: escapes the dashboard
	// shell (Nav + SideNav + max-w container) so the studio can use the whole
	// viewport. Replicates the dashboard layout's auth guard — redirect to
	// /login unless a user session exists — without the rest of its chrome.
	import '../../../app.css';
	import { getUser } from '../../../store/user.store';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let isUserLoaded = false;

	onMount(async () => {
		const user = await getUser();
		if (!user || !user?.email) {
			goto('/login');
			return;
		}
		isUserLoaded = true;
	});
</script>

{#if isUserLoaded}
	<slot />
{:else}
	<div class="h-screen flex items-center justify-center bg-[#101014]">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
	</div>
{/if}
