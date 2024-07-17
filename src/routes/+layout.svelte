<script>
	import '../app.css';
	import { getUser } from '../store/user.store';
	import { onMount } from 'svelte';
	import posthog from 'posthog-js';
	import { browser } from '$app/environment';

	const isProd = import.meta.env.MODE === 'production';

	if (browser && isProd) {
		console.log('Browser detected');
		posthog.init('phc_3ecva80rtrdIJiDyYVwsqjy2YI7CbhbAydPApERhNtU', {
			api_host: 'https://api.pictify.io/posthog',
			disable_compression: true
		});
	}

	onMount(async () => {
		await getUser();
	});
</script>

<slot />
