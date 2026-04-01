<script>
	import {
		savePersonalizationAction,
		skipPersonalizationAction
	} from '../../../store/onboarding.store';

	let selectedIntent = null;
	let saving = false;

	const intents = [
		{
			id: 'ai-agent',
			label: 'AI Agent Automation',
			desc: 'Building an AI agent (MCP, LangChain, etc.) that generates images',
			icon: 'robot'
		},
		{
			id: 'api-integration',
			label: 'API / Backend Integration',
			desc: 'Calling the API from my app\u2019s backend (Node, Python, Go, etc.)',
			icon: 'code'
		},
		{
			id: 'no-code',
			label: 'No-Code / Low-Code',
			desc: 'Using Zapier, Make, or the visual editor \u2014 no coding needed',
			icon: 'layout'
		},
		{
			id: 'template-builder',
			label: 'Template & Bulk Render',
			desc: 'Design reusable templates and generate images at scale',
			icon: 'template'
		},
		{
			id: 'exploring',
			label: 'Just Exploring',
			desc: 'Want to see what Pictify can do first',
			icon: 'compass'
		}
	];

	async function finish() {
		if (saving || !selectedIntent) return;
		saving = true;
		try {
			await savePersonalizationAction({
				useCase: selectedIntent,
				integrationMode: null
			});
		} catch {
			// Store handles error
		} finally {
			saving = false;
		}
	}

	async function skip() {
		if (saving) return;
		saving = true;
		try {
			await skipPersonalizationAction();
		} catch {
			// Store handles error
		} finally {
			saving = false;
		}
	}
</script>

<!-- Full-screen overlay -->
<div
	class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
>
	<div
		class="w-full max-w-2xl bg-[#FFFDF8] border-[3px] border-black rounded-3xl shadow-[8px_8px_0_0_black] overflow-hidden animate-wizard-in"
	>
		<!-- Header -->
		<div class="px-8 pt-8 pb-4">
			<div
				class="inline-flex items-center gap-2 px-3 py-1 bg-[#ffc480] border-[2px] border-black rounded-full shadow-[3px_3px_0_0_black] mb-4"
			>
				<span class="text-[10px] font-black text-black uppercase tracking-widest"
					>Quick Setup</span
				>
			</div>
			<h2 class="text-3xl sm:text-4xl font-black text-black tracking-tight leading-tight">
				How will you use Pictify?
			</h2>
			<p class="text-sm font-bold text-gray-500 mt-2">
				Pick the option that best describes you. We'll personalize your getting started guide.
			</p>
		</div>

		<!-- Body -->
		<div class="px-8 py-4 max-h-[55vh] overflow-y-auto">
			<div class="grid grid-cols-1 gap-3">
				{#each intents as intent}
					<button
						on:click={() => (selectedIntent = intent.id)}
						class="text-left p-5 rounded-xl border-[3px] transition-all duration-200
							{selectedIntent === intent.id
							? 'border-black bg-[#ffc480]/30 shadow-[4px_4px_0_0_black] -translate-y-0.5'
							: 'border-gray-200 bg-white hover:border-black hover:shadow-[2px_2px_0_0_black] hover:-translate-y-0.5'}"
					>
						<div class="flex items-center gap-4">
							<div
								class="w-10 h-10 rounded-xl border-[2px] flex items-center justify-center flex-shrink-0
								{selectedIntent === intent.id ? 'border-black bg-[#ffc480]' : 'border-gray-300 bg-gray-50'}"
							>
								{#if intent.icon === 'robot'}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/></svg
									>
								{:else if intent.icon === 'code'}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
										/></svg
									>
								{:else if intent.icon === 'layout'}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
										/></svg
									>
								{:else if intent.icon === 'template'}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
										/></svg
									>
								{:else if intent.icon === 'compass'}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M9 9l3 1.5L15 9l-1.5 3L15 15l-3-1.5L9 15l1.5-3L9 9z"
										/></svg
									>
								{/if}
							</div>
							<div>
								<div class="text-base font-black text-black">{intent.label}</div>
								<div class="text-sm font-medium text-gray-500 mt-0.5">{intent.desc}</div>
							</div>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Footer -->
		<div
			class="px-8 py-5 border-t-[3px] border-black bg-gray-50/50 flex items-center justify-between"
		>
			<button
				on:click={skip}
				disabled={saving}
				class="text-sm font-bold text-gray-500 hover:text-black transition-colors underline underline-offset-2"
			>
				Skip for now
			</button>

			<button
				on:click={finish}
				disabled={!selectedIntent || saving}
				class="px-6 py-2.5 text-sm font-black uppercase tracking-wider rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_black] transition-all
					{selectedIntent && !saving
					? 'bg-[#ffc480] text-black hover:shadow-[2px_2px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px]'
					: 'bg-gray-200 text-gray-400 cursor-not-allowed'}"
			>
				{saving ? 'Saving...' : 'Get Started'}
			</button>
		</div>
	</div>
</div>

<style>
	@keyframes wizard-in {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(12px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.animate-wizard-in {
		animation: wizard-in 0.25s ease-out forwards;
	}
</style>
