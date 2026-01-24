<script>
	import { fly } from 'svelte/transition';
	import { quadOut } from 'svelte/easing';
	import { toast } from '../../store/toast.store';

	let message = '';
	let type = 'default';
	let visible = false;

	toast.subscribe((value) => {
		if (value) {
			({ message, type = 'default' } = value);
			visible = true;
			setTimeout(() => {
				visible = false;
				toast.set(null);
			}, value.duration || 3000);
		}
	});

	const TYPE_CONFIG = {
		success: {
			bg: 'bg-[#4ade80]',
			border: 'border-[#4ade80]',
			icon: 'M5 13l4 4L19 7',
			title: 'Success'
		},
		error: {
			bg: 'bg-[#ff6b6b]',
			border: 'border-[#ff6b6b]',
			icon: 'M6 18L18 6M6 6l12 12',
			title: 'Error'
		},
		warning: {
			bg: 'bg-[#fbbf24]',
			border: 'border-[#fbbf24]',
			icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
			title: 'Warning'
		},
		default: {
			bg: 'bg-[#ffc480]',
			border: 'border-[#ffc480]',
			icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
			title: 'Note'
		}
	};
</script>

{#if visible}
	<div
		transition:fly={{ y: 50, duration: 300, easing: quadOut }}
		class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-stretch min-w-[340px] max-w-md bg-white border-[3px] border-gray-900 shadow-[6px_6px_0_0_#000] rounded-xl overflow-hidden"
	>
		<!-- Color Strip / Icon Area -->
		<div class="{TYPE_CONFIG[type]?.bg || TYPE_CONFIG.default.bg} w-12 flex items-center justify-center border-r-[3px] border-gray-900 flex-shrink-0">
			<div class="bg-white border-2 border-gray-900 rounded-lg w-8 h-8 flex items-center justify-center shadow-[2px_2px_0_0_#000]">
				<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d={TYPE_CONFIG[type]?.icon || TYPE_CONFIG.default.icon} />
				</svg>
			</div>
		</div>

		<!-- Content Area -->
		<div class="px-5 py-4 flex-1">
			<div class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">
				{TYPE_CONFIG[type]?.title || 'Notice'}
			</div>
			<div class="text-sm font-bold text-gray-900 leading-tight">
				{message}
			</div>
		</div>

		<!-- Close Button (Optional decorative or functional) -->
		<button 
			on:click={() => visible = false}
			class="px-3 hover:bg-gray-100 border-l-[3px] border-gray-900 transition-colors flex items-center justify-center group"
		>
			<svg class="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>
{/if}
