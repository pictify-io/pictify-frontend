<script>
	/** Dev harness for the onboarding fill question — free, no backend. */
	import FillStep from '$lib/components/onboarding/v2/FillStep.svelte';

	let answered = '';
</script>

<svelte:head>
	<title>Fill question | dev</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="onboarding-v2 flex min-h-screen w-full flex-col items-center justify-center bg-brand-paper">
	<FillStep on:answer={(e) => (answered = e.detail.mode)} />
	{#if answered}
		<p class="pb-6 font-mono text-xs text-brand-proof">answered: {answered}</p>
	{/if}
</div>
