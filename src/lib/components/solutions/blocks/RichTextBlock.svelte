<script>
	import SvelteMarkdown from 'svelte-markdown';

	export let heading = '';
	export let content;
</script>

<section class="max-w-4xl mx-auto mb-16">
	{#if heading}
		<h2 class="text-2xl md:text-3xl font-black text-gray-900 mb-6 text-center">
			{heading}
		</h2>
	{/if}
	<div class="markdown-body bg-transparent">
		<SvelteMarkdown source={content} />
	</div>
</section>
