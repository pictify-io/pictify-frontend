<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		onboardingStore,
		showOnboarding,
		currentStep,
		initOnboarding,
		refreshOnboarding,
		dismissOnboardingAction,
		toggleOnboardingCollapse
	} from '../../../store/onboarding.store';

	let refreshInterval;

	onMount(() => {
		// Start auto-refresh every 30 seconds
		refreshInterval = setInterval(refreshOnboarding, 30000);
	});

	onDestroy(() => {
		if (refreshInterval) clearInterval(refreshInterval);
	});

	// Icon components based on step id
	const icons = {
		image: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
		layout: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>`,
		save: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>`,
		code: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>`
	};

	function getIcon(iconName) {
		return icons[iconName] || icons.image;
	}

	function handleStepClick(step) {
		if (step.href && !step.completed) {
			goto(step.href);
		}
	}

	async function handleDismiss() {
		try {
			await dismissOnboardingAction();
		} catch (error) { /* ignored */ }
	}

	function handleToggleCollapse() {
		toggleOnboardingCollapse();
	}

	// Calculate progress ring
	$: circumference = 2 * Math.PI * 16;
	$: strokeDasharray = `${($onboardingStore.progress / 100) * circumference} ${circumference}`;
</script>

{#if $showOnboarding}
	<div
		class="fixed bottom-6 right-6 z-50 w-[340px] bg-white rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] overflow-hidden transition-all duration-300 font-sans"
		class:translate-y-[calc(100%-60px)]={$onboardingStore.isCollapsed}
	>
		<!-- Header -->
		<button
			type="button"
			class="w-full bg-[#ffc480] px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#ffb860] transition-colors border-b-[3px] border-gray-900"
			on:click={handleToggleCollapse}
		>
			<div class="flex items-center gap-3">
				<!-- Progress Circle -->
				<div class="relative w-10 h-10">
					<svg class="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
						<circle
							class="text-white/50"
							stroke="currentColor"
							stroke-width="4"
							fill="none"
							cx="18"
							cy="18"
							r="16"
						/>
						<circle
							class="text-gray-900 transition-all duration-500"
							stroke="currentColor"
							stroke-width="4"
							stroke-linecap="round"
							fill="none"
							cx="18"
							cy="18"
							r="16"
							style="stroke-dasharray: {strokeDasharray}"
						/>
					</svg>
					<span
						class="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-900"
					>
						{$onboardingStore.completedCount}/{$onboardingStore.totalSteps}
					</span>
				</div>
				<div class="text-left">
					<h3 class="text-sm font-black text-gray-900 uppercase tracking-wider">Getting Started</h3>
					<p class="text-xs font-bold text-gray-800">{$onboardingStore.progress}% complete</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<!-- Collapse/Expand icon -->
				<div
					class="w-8 h-8 rounded-lg bg-white border-[2px] border-gray-900 flex items-center justify-center shadow-[2px_2px_0_0_#1f2937]"
				>
					<svg
						class="w-5 h-5 text-gray-900 transition-transform duration-300"
						class:rotate-180={$onboardingStore.isCollapsed}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>
			</div>
		</button>

		<!-- Steps list -->
		<div class="p-4 space-y-3 bg-[#FFFDF8]">
			{#each $onboardingStore.steps as step (step.id)}
				<button
					type="button"
					class="w-full text-left p-3 rounded-lg border-[3px] transition-all duration-200 flex items-start gap-3
						{step.completed
						? 'border-gray-200 bg-gray-50 opacity-60'
						: step.href
						? 'border-gray-900 bg-white hover:bg-white hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-[2px] cursor-pointer'
						: 'border-gray-300 bg-gray-50'}"
					on:click={() => handleStepClick(step)}
					disabled={step.completed || !step.href}
				>
					<!-- Icon -->
					<div
						class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border-[2px]
							{step.completed
							? 'bg-green-100 text-green-600 border-transparent'
							: 'bg-[#ffc480] text-gray-900 border-gray-900 shadow-[2px_2px_0_0_#1f2937]'}"
					>
						{#if step.completed}
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						{:else}
							{@html getIcon(step.icon)}
						{/if}
					</div>

					<!-- Content -->
					<div class="flex-1 min-w-0 pt-0.5">
						<h4
							class="text-sm font-black
								{step.completed ? 'text-gray-500 line-through decoration-2' : 'text-gray-900'}"
						>
							{step.title}
						</h4>
						<p class="text-xs font-medium text-gray-600 mt-1 leading-relaxed line-clamp-2">
							{step.description}
						</p>
					</div>

					<!-- Arrow for clickable steps -->
					{#if !step.completed && step.href}
						<div class="self-center">
							<svg
								class="w-5 h-5 text-gray-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</div>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Footer -->
		<div class="px-4 pb-4 pt-2 bg-[#FFFDF8]">
			<button
				type="button"
				class="w-full py-2.5 text-xs font-black text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg border-[2px] border-transparent hover:border-gray-900 transition-all uppercase tracking-widest"
				on:click={handleDismiss}
			>
				Dismiss checklist
			</button>
		</div>
	</div>
{/if}

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
