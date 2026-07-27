<script>
	import { onMount } from 'svelte';
	import VideoTemplateEditor from '$lib/components/dashboard/VideoTemplateEditor.svelte';
	import { analytics } from '$lib/analytics.js';

	onMount(() => {
		analytics.page('Video Template New');
	});
</script>

<svelte:head>
	<title>New video template - Pictify.io</title>
</svelte:head>

<VideoTemplateEditor />
