<script>
	export let href = '';
	export let title = undefined;
</script>

<a
	{href}
	{title}
	target="_blank"
	class="font-black text-[#ff6b6b] hover:text-gray-900 decoration-2 underline-offset-4 hover:underline transition-all"
>
	<slot />
</a>
