<script>
	import { activeSidebarTab, editorActions } from '../../../store/editor.store';
	import { copilotActions } from '../../../store/copilot.store';

	const tabs = [
		{ id: 'elements', icon: 'fa-shapes', label: 'Elements' },
		{ id: 'uploads', icon: 'fa-cloud-upload', label: 'Uploads' },
		{ id: 'text', icon: 'fa-font', label: 'Text' },
		{ id: 'charts', icon: 'fa-chart-pie', label: 'Charts' },
		{ id: 'qrcodes', icon: 'fa-qrcode', label: 'QR Codes' },
		{ id: 'brand', icon: 'fa-tag', label: 'Brand' },
		{ id: 'copilot', icon: 'fa-robot', label: 'Copilot' }
	];

	function setActive(id) {
		editorActions.toggleLeftSidebarTab(id);
	}
</script>

<div
	class="w-16 bg-[#FFFDF8] border-r-[3px] border-gray-900 flex flex-col items-center py-6 h-full z-10 flex-shrink-0"
>
	{#each tabs as tab}
		<button
			class="w-10 h-10 flex flex-col items-center justify-center mb-4 rounded-lg transition-all duration-200 group relative border-[2px]
			{$activeSidebarTab === tab.id
				? 'bg-gray-900 text-white border-gray-900 shadow-[2px_2px_0_0_#ffc480] translate-x-[1px] translate-y-[1px]'
				: 'bg-white text-gray-900 border-gray-900 hover:bg-[#ffc480] shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'}"
			on:click={() => setActive(tab.id)}
			title={tab.label}
		>
			<i class="fa {tab.icon} text-sm mb-0.5 transition-transform group-hover:scale-110" />
			<!-- Hide label on small sidebar for cleaner look, or show tooltip -->
		</button>
	{/each}
</div>
