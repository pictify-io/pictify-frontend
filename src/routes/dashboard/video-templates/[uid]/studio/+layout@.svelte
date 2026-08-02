<script>
	/**
	 * Full-screen layout reset for the video studio: escapes the dashboard
	 * shell (Nav + SideNav + max-w container) so the studio owns the whole
	 * viewport. Replicates the dashboard layout's auth guard — redirect to
	 * /login unless a user session exists — without the rest of its chrome.
	 *
	 * Shared verbatim by /new/studio; if this changes, change both.
	 */
	import '../../../../../app.css';
	import { getUser } from '../../../../../store/user.store';
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
	<div class="flex h-screen items-center justify-center bg-gray-950">
		<div
			class="h-10 w-10 animate-pulse rounded-xl border-[3px] border-black bg-brand-accent shadow-brutal-sm"
		></div>
	</div>
{/if}
