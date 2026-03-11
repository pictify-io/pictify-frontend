<script>
	import { goto } from '$app/navigation';

	export let activeMode = 'render'; // 'render' | 'bulk' | 'dynamic'
	export let uid = '';

	const modes = [
		{ id: 'editor', label: 'Editor', disabled: true },
		{
			id: 'render',
			label: 'Render',
			color: '#4ecdc4',
			href: (uid) => `/dashboard/template/${uid}/render`
		},
		{
			id: 'bulk',
			label: 'Bulk',
			color: '#ff6b6b',
			href: (uid) => `/dashboard/template/${uid}/bulk-render`
		},
		{
			id: 'dynamic',
			label: 'Live',
			color: '#3b82f6',
			href: (uid) => `/dashboard/template/${uid}/dynamic`
		}
	];
</script>

<div
	class="flex bg-gray-100 p-1.5 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
>
	{#each modes as mode}
		{#if mode.disabled}
			<button
				class="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all text-gray-400 cursor-not-allowed border-[2px] border-transparent"
				disabled
			>
				{mode.label}
			</button>
		{:else if activeMode === mode.id}
			<button
				class="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all text-white border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937]"
				style="background-color: {mode.color}"
			>
				{mode.label}
			</button>
		{:else}
			<button
				class="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all text-gray-600 hover:text-gray-900 hover:bg-white/50 border-[2px] border-transparent"
				on:click={() => goto(mode.href(uid))}
			>
				{mode.label}
			</button>
		{/if}
	{/each}
</div>
