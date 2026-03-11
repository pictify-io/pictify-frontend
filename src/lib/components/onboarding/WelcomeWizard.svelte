<script>
	import {
		savePersonalizationAction,
		skipPersonalizationAction
	} from '../../../store/onboarding.store';

	let step = 1;
	let selectedUseCase = null;
	let selectedMode = null;
	let saving = false;

	const useCases = [
		{
			id: 'social-media',
			label: 'Social Media Graphics',
			desc: 'Instagram posts, Twitter headers, LinkedIn banners, YouTube thumbnails',
			icon: 'share'
		},
		{
			id: 'email-marketing',
			label: 'Email Marketing',
			desc: 'Email headers, newsletter visuals, campaign banners',
			icon: 'mail'
		},
		{
			id: 'e-commerce',
			label: 'E-Commerce / Product',
			desc: 'Product banners, pricing cards, discount coupons',
			icon: 'cart'
		},
		{
			id: 'dashboard-reporting',
			label: 'Dashboard & Reporting',
			desc: 'KPI cards, charts, leaderboards, automated data visuals',
			icon: 'chart'
		},
		{
			id: 'certificates',
			label: 'Certificates & Awards',
			desc: 'Course certificates, achievement badges, diplomas',
			icon: 'award'
		},
		{
			id: 'personalized-images',
			label: 'Personalized Images at Scale',
			desc: 'Dynamic images with user-specific data (names, stats)',
			icon: 'users'
		},
		{
			id: 'content-marketing',
			label: 'Blog & Content Marketing',
			desc: 'Blog featured images, article thumbnails, content cards',
			icon: 'edit'
		}
	];

	const integrationModes = [
		{
			id: 'editor',
			label: 'Visual Editor',
			desc: 'Design images with the drag-and-drop canvas',
			icon: 'layout'
		},
		{
			id: 'api',
			label: 'API Integration',
			desc: 'Generate images programmatically via REST API',
			icon: 'code'
		},
		{
			id: 'both',
			label: 'Both',
			desc: 'Design in the editor, generate at scale via API',
			icon: 'layers'
		}
	];

	function nextStep() {
		if (step === 1 && selectedUseCase) {
			step = 2;
		}
	}

	async function finish() {
		if (saving) return;
		saving = true;
		try {
			await savePersonalizationAction({
				useCase: selectedUseCase,
				integrationMode: selectedMode
			});
		} catch {
			// Store already handles error
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
			// Store already handles error
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
					>Step {step} of 2</span
				>
			</div>
			<h2 class="text-3xl sm:text-4xl font-black text-black tracking-tight leading-tight">
				{#if step === 1}
					What will you create?
				{:else}
					How will you use Pictify?
				{/if}
			</h2>
			<p class="text-sm font-bold text-gray-500 mt-2">
				{#if step === 1}
					Pick your primary use case so we can personalize your experience.
				{:else}
					This helps us show you the most relevant features.
				{/if}
			</p>
		</div>

		<!-- Body -->
		<div class="px-8 py-4 max-h-[55vh] overflow-y-auto">
			{#if step === 1}
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{#each useCases as uc}
						<button
							on:click={() => (selectedUseCase = uc.id)}
							class="text-left p-4 rounded-xl border-[3px] transition-all duration-200
								{selectedUseCase === uc.id
								? 'border-black bg-[#ffc480]/30 shadow-[4px_4px_0_0_black] -translate-y-0.5'
								: 'border-gray-200 bg-white hover:border-black hover:shadow-[2px_2px_0_0_black] hover:-translate-y-0.5'}"
						>
							<div class="flex items-start gap-3">
								<div
									class="w-8 h-8 rounded-lg border-[2px] flex items-center justify-center flex-shrink-0 mt-0.5
									{selectedUseCase === uc.id ? 'border-black bg-[#ffc480]' : 'border-gray-300 bg-gray-50'}"
								>
									{#if uc.icon === 'share'}
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
											/></svg
										>
									{:else if uc.icon === 'mail'}
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											/></svg
										>
									{:else if uc.icon === 'cart'}
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
											/></svg
										>
									{:else if uc.icon === 'chart'}
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
											/></svg
										>
									{:else if uc.icon === 'award'}
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
											/></svg
										>
									{:else if uc.icon === 'users'}
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
											/></svg
										>
									{:else}
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/></svg
										>
									{/if}
								</div>
								<div class="min-w-0">
									<div class="text-sm font-black text-black">{uc.label}</div>
									<div class="text-xs font-medium text-gray-500 mt-0.5 leading-snug">{uc.desc}</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-3">
					{#each integrationModes as mode}
						<button
							on:click={() => (selectedMode = mode.id)}
							class="text-left p-5 rounded-xl border-[3px] transition-all duration-200
								{selectedMode === mode.id
								? 'border-black bg-[#ffc480]/30 shadow-[4px_4px_0_0_black] -translate-y-0.5'
								: 'border-gray-200 bg-white hover:border-black hover:shadow-[2px_2px_0_0_black] hover:-translate-y-0.5'}"
						>
							<div class="flex items-center gap-4">
								<div
									class="w-10 h-10 rounded-xl border-[2px] flex items-center justify-center flex-shrink-0
									{selectedMode === mode.id ? 'border-black bg-[#ffc480]' : 'border-gray-300 bg-gray-50'}"
								>
									{#if mode.icon === 'layout'}
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
											/></svg
										>
									{:else if mode.icon === 'code'}
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
											/></svg
										>
									{:else}
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
											/></svg
										>
									{/if}
								</div>
								<div>
									<div class="text-base font-black text-black">{mode.label}</div>
									<div class="text-sm font-medium text-gray-500 mt-0.5">{mode.desc}</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
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

			<div class="flex items-center gap-3">
				{#if step === 2}
					<button
						on:click={() => (step = 1)}
						class="px-5 py-2.5 text-sm font-black text-black uppercase tracking-wider border-[2px] border-black rounded-xl hover:bg-gray-100 transition-colors"
					>
						Back
					</button>
				{/if}

				{#if step === 1}
					<button
						on:click={nextStep}
						disabled={!selectedUseCase}
						class="px-6 py-2.5 text-sm font-black uppercase tracking-wider rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_black] transition-all
							{selectedUseCase
							? 'bg-[#ffc480] text-black hover:shadow-[2px_2px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px]'
							: 'bg-gray-200 text-gray-400 cursor-not-allowed'}"
					>
						Continue
					</button>
				{:else}
					<button
						on:click={finish}
						disabled={saving}
						class="px-6 py-2.5 text-sm font-black uppercase tracking-wider rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_black] transition-all
							{!saving
							? 'bg-[#ff6b6b] text-white hover:shadow-[2px_2px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px]'
							: 'bg-gray-200 text-gray-400 cursor-not-allowed'}"
					>
						{saving ? 'Saving...' : 'Get Started'}
					</button>
				{/if}
			</div>
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
