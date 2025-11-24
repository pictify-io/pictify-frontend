<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	onMount(() => {
		const uid = $page.params.uid;
		if (uid) {
			goto(`/template-workspace/${uid}`, { replaceState: true });
		} else {
			goto('/dashboard/template', { replaceState: true });
		}
	});
</script>

<div class="flex h-full w-full items-center justify-center">
	<p class="text-sm text-gray-500">Redirecting to the new template workspace…</p>
</div>
