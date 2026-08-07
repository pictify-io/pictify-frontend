<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Canvas engine removed (2026-08): the per-uid workspace router is gone.
		// HTML templates open from the list; anything else lands back on it.
		goto('/dashboard/template', { replaceState: true });
	});
</script>

<div class="flex h-full w-full items-center justify-center">
	<p class="text-sm text-gray-500">Redirecting to your templates…</p>
</div>
