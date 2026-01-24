<script>
	import { goto } from '$app/navigation';
	import { analytics } from '$lib/analytics.js';
	export let text = 'Start For Free';
	export let variant = 'primary'; // primary or secondary
	export let location = 'landing_page';
	let className = '';
	export { className as class };

	function handleClick() {
		analytics.trackCTAClicked({
			cta_text: text,
			location: location,
		});
		goto('/signup');
	}
</script>

	<button
	type="button"
	class="px-8 py-4 font-bold text-lg rounded-xl border-[3px] border-gray-900 transition-all flex items-center gap-2
		{variant === 'primary' && !className
			? 'bg-[#ffc480] text-gray-900 shadow-[4px_4px_0_0_#1f293780] hover:shadow-[2px_2px_0_0_#1f293780] hover:translate-x-[2px] hover:translate-y-[2px]'
			: variant === 'secondary' && !className
				? 'bg-white text-gray-900 shadow-[4px_4px_0_0_#1f293780] hover:shadow-[2px_2px_0_0_#1f293780] hover:translate-x-[2px] hover:translate-y-[2px]'
				: ''} {className}"
	on:click={handleClick}
>
	<span>{text}</span>
	<svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
			</svg>
	</button>
