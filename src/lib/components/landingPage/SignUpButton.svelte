<script>
	import { goto } from '$app/navigation';
	export let background = 'bg-[#ffc480]';
	export let color = 'text-gray-900';
</script>

<div class="relative w-auto mx-auto flex-shrink-0 group">
	<div class="w-full rounded bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10" />
	<button
		type="submit"
		class="py-3.5 rounded px-6 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-medium {background} tracking-wide text-lg flex-shrink-0 {color}"
		on:click={() => {
			goto('/signup');
		}}
		>Start For Free</button
	>
</div>
