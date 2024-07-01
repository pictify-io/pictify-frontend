<script>
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { toast } from '../../store/toast.store';

	let message = '';
	let visible = false;

	toast.subscribe((value) => {
		if (value) {
			({ message } = value);
			visible = true;
			setTimeout(() => {
				visible = false;
				toast.set(null);
			}, value.duration || 3000);
		}
	});
</script>

{#if visible}
	<div
		transition:fade={{ duration: 200 }}
		class="fixed right-0 left-0 mr-auto ml-auto bottom-3 text-center max-w-lg p-2 border-black border-2 text-black rounded shadow-lg bg-white z-50"
	>
		{message}
	</div>
{/if}
