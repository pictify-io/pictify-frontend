<script>
	import '../app.css';
	import { getUser } from '../store/user.store';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { analytics } from '$lib/analytics.js';

	// Initialize analytics
	if (browser) {
		analytics.init();
		analytics.captureUTM();
	}

	onMount(async () => {
		await getUser();
	});
</script>

<slot />
