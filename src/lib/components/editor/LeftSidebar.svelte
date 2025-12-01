<script>
	import { activeSidebarTab, editorActions } from '../../../store/editor.store';
	import { copilotActions } from '../../../store/copilot.store';

	const tabs = [
		{ id: 'elements', icon: 'fa-shapes', label: 'Elements' },
		{ id: 'uploads', icon: 'fa-cloud-upload', label: 'Uploads' },
		{ id: 'text', icon: 'fa-font', label: 'Text' },
		{ id: 'charts', icon: 'fa-chart-pie', label: 'Charts' }
	];

	function setActive(id) {
		editorActions.toggleLeftSidebarTab(id);
	}

	function toggleCopilot() {
		copilotActions.toggleDrawer();
	}
</script>

<div class="w-16 bg-white/90 backdrop-blur-sm border-r-2 border-black flex flex-col items-center py-6 h-full shadow-sm z-10">
	{#each tabs as tab}
		<button
			class="w-12 h-12 flex flex-col items-center justify-center mb-4 rounded-lg transition-all duration-200 group relative
			{$activeSidebarTab === tab.id ? 'bg-[#ff6b6b]/10 text-[#ff6b6b]' : 'text-gray-500 hover:bg-white hover:text-[#ff6b6b]'}"
			on:click={() => setActive(tab.id)}
		>
			<i class="fa {tab.icon} text-lg mb-0.5 transition-transform group-hover:scale-110"></i>
			<span class="text-[9px] font-medium">{tab.label}</span>
			
			{#if $activeSidebarTab === tab.id}
				<div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#ff6b6b] rounded-r-full"></div>
			{/if}
		</button>
	{/each}
	
	<!-- Copilot Button (Special) -->
	{#if import.meta.env.PUBLIC_ENABLE_COPILOT === 'true'}
		<button
			class="w-12 h-12 flex flex-col items-center justify-center mb-4 rounded-lg transition-all duration-200 group relative bg-gradient-to-br from-[#ff6b6b]/5 to-[#ffc480]/5 text-[#ff6b6b] hover:from-[#ff6b6b]/10 hover:to-[#ffc480]/10 border border-[#ff6b6b]/20"
			on:click={toggleCopilot}
			title="Toggle AI Copilot"
		>
			<i class="fa fa-robot text-lg mb-0.5 transition-transform group-hover:scale-110"></i>
			<span class="text-[9px] font-medium">Copilot</span>
		</button>
	{/if}
</div>
