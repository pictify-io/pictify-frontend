<script>
	import { goto } from '$app/navigation';
	export let background = 'bg-[#ffc480]';
	export let color = 'text-gray-900';
</script>

<div class="relative w-auto mx-auto flex-shrink-0 group">
	<div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
	<button
		type="submit"
		class="py-4 rounded-lg px-8 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-semibold {background} tracking-wide text-lg flex-shrink-0 {color} transition-all hover:shadow-lg hover:brightness-105"
		on:click={() => {
			goto('/signup');
		}}>
		<span class="relative inline-flex items-center gap-2">
			<span>Start For Free</span>
			<svg class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
			</svg>
		</span>
	</button>
</div>
