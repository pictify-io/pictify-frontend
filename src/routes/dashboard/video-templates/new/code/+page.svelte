<script>
	/**
	 * A blank Code-mode template. The TSX editor mints the uid on its first
	 * save and routes to /[uid] (which routes on to /code).
	 */
	import { onMount } from 'svelte';
	import VideoTemplateEditor from '$lib/components/dashboard/VideoTemplateEditor.svelte';
	import { analytics } from '$lib/analytics.js';

	onMount(() => analytics.page('Video Template New Code'));
</script>

<svelte:head>
	<title>New coded video template - Pictify.io</title>
</svelte:head>

<VideoTemplateEditor />
