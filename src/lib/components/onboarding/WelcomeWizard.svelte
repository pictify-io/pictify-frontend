<script>
	import { onMount } from 'svelte';
	import posthog from 'posthog-js';
	import { analytics } from '$lib/analytics.js';
	import {
		savePersonalizationAction,
		skipPersonalizationAction
	} from '../../../store/onboarding.store';

	let selectedIntent = null;
	let saving = false;

	// Experiment: onboarding-value-first-skip (SEQUENCED — flag is dormant, defaults to control).
	// control  = current dense intent wizard.
	// value-skip = value-forward copy + a "show me my API key" skip that frames skipping as a
	//              positive move toward value instead of a tiny grey "skip for now".
	let variant = 'control';
	$: isValueSkip = variant === 'value-skip';

	onMount(() => {
		// Ungated instrumentation: record the wizard impression so the skip rate is
		// MEASURED against a real denominator, not inferred from skip/complete counts.
		analytics.track('welcome_wizard_viewed', {});

		const applyVariant = () => {
			try {
				variant = posthog.getFeatureFlag?.('onboarding-value-first-skip') || 'control';
			} catch {
				variant = 'control';
			}
		};
		try {
			if (typeof posthog.onFeatureFlags === 'function') {
				posthog.onFeatureFlags(applyVariant);
			}
		} catch {
			/* keep control */
		}
		applyVariant();
	});

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
		if (isValueSkip) {
			// Distinguish a value-seeking skip from a bounce.
			analytics.track('personalization_skip_to_value_clicked', { variant });
		}
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
	class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
>
	<div
		class="w-full max-w-2xl bg-brand-bg border-[3px] border-black rounded-2xl shadow-brutal-2xl overflow-hidden animate-wizard-in"
	>
		<!-- Header -->
		<div class="px-8 pt-8 pb-4">
			<div
				class="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent border-[2px] border-black rounded-full shadow-brutal-md mb-4"
			>
				<span class="text-[10px] font-black text-black uppercase tracking-widest">Quick Setup</span>
			</div>
			<h2 class="text-3xl sm:text-4xl font-black text-black tracking-tight leading-tight">
				{#if isValueSkip}
					Your API key is ready — what should we set up first?
				{:else}
					How will you use Pictify?
				{/if}
			</h2>
			<p class="text-sm font-bold text-gray-500 mt-2">
				{#if isValueSkip}
					Pick one and we'll tailor your guide — or jump straight to your key.
				{:else}
					Pick the option that best describes you. We'll personalize your getting started guide.
				{/if}
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
							? 'border-black bg-brand-accent/30 shadow-brutal-lg -translate-y-0.5'
							: 'border-gray-200 bg-white hover:border-black hover:shadow-brutal-sm hover:-translate-y-0.5'}"
					>
						<div class="flex items-center gap-4">
							<div
								class="w-10 h-10 rounded-xl border-[2px] flex items-center justify-center flex-shrink-0
								{selectedIntent === intent.id ? 'border-black bg-brand-accent' : 'border-gray-300 bg-gray-50'}"
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
				class="text-sm font-bold transition-colors underline underline-offset-2 {isValueSkip
					? 'text-black hover:text-brand-danger'
					: 'text-gray-500 hover:text-black'}"
			>
				{isValueSkip ? 'Just show me my API key →' : 'Skip for now'}
			</button>

			<button
				on:click={finish}
				disabled={!selectedIntent || saving}
				class="px-6 py-2.5 text-sm font-black uppercase tracking-wider rounded-xl border-[3px] border-black shadow-brutal-lg transition-all
					{selectedIntent && !saving
					? 'bg-brand-accent text-black hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px]'
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
