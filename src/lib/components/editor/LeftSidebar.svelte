<script>
	import { createEventDispatcher } from 'svelte';
	import { activeSidebarTab, editorActions } from '../../../store/editor.store';
	import { copilotActions } from '../../../store/copilot.store';

	const dispatch = createEventDispatcher();

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

	function openFigmaImport() {
		dispatch('openFigma');
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
		</button>
	{/each}

	<!-- Separator -->
	<div class="w-8 border-t-[2px] border-gray-300 my-2"></div>

	<!-- Figma Import - Prominent standalone button -->
	<button
		class="w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 group relative border-[2px] bg-[#a259ff] border-gray-900 shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] hover:brightness-110"
		on:click={openFigmaImport}
		title="Import from Figma"
	>
		<svg
			width="16"
			height="16"
			viewBox="0 0 38 57"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="transition-transform group-hover:scale-110"
		>
			<path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="white"/>
			<path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="white"/>
			<path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="white"/>
			<path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="white"/>
			<path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="white"/>
		</svg>
	</button>
</div>
