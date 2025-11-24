<script>
	import { activeSidebarTab, editorActions } from '../../../store/editor.store';

	const tabs = [
		{ id: 'elements', icon: 'fa-shapes', label: 'Elements' },
		{ id: 'uploads', icon: 'fa-cloud-upload', label: 'Uploads' },
		{ id: 'text', icon: 'fa-font', label: 'Text' },
		{ id: 'copilot', icon: 'fa-robot', label: 'Copilot' }
	];

	function setActive(id) {
		editorActions.toggleLeftSidebarTab(id);
	}
</script>

<div class="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 h-full shadow-sm z-10">
	{#each tabs as tab}
		<button
			class="w-12 h-12 flex flex-col items-center justify-center mb-4 rounded-lg transition-all duration-200 group relative
			{$activeSidebarTab === tab.id ? 'bg-gray-100 text-black' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}"
			on:click={() => setActive(tab.id)}
		>
			<i class="fa {tab.icon} text-lg mb-0.5 transition-transform group-hover:scale-110"></i>
			<span class="text-[9px] font-medium">{tab.label}</span>
			
			{#if $activeSidebarTab === tab.id}
				<div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-black rounded-r-full"></div>
			{/if}
		</button>
	{/each}
</div>
