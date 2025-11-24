<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/template-workspace/create', { replaceState: true });
	});
</script>

<div class="flex h-full w-full items-center justify-center">
	<p class="text-sm text-gray-500">Redirecting to the template workspace…</p>
</div>
