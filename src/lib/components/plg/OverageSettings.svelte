<script>
	import { createEventDispatcher } from 'svelte';
	import {
		OVERAGE_PRICING,
		isOverageEligible,
		formatOverageRate
	} from '../../../config/plan-features.js';

	export let plan = 'starter';
	export let allowOverages = false;
	export let spendingCapCents = null;
	export let currentCycleOverages = 0;
	export let currentCycleOverageCostCents = 0;
	export let loading = false;

	const dispatch = createEventDispatcher();

	// Spending cap presets in dollars
	const capPresets = [10, 25, 50];

	let customCapDollars = '';
	let selectedPreset = null;

	$: eligible = isOverageEligible(plan);
	$: overageRate = formatOverageRate(plan);
	$: currentCostDollars = (currentCycleOverageCostCents / 100).toFixed(2);
	$: spendingCapDollars = spendingCapCents ? (spendingCapCents / 100).toFixed(0) : null;
	$: remainingBudgetCents = spendingCapCents
		? Math.max(0, spendingCapCents - currentCycleOverageCostCents)
		: null;
	$: remainingBudgetDollars =
		remainingBudgetCents !== null ? (remainingBudgetCents / 100).toFixed(2) : null;

	// Initialize selected preset or custom value
	$: {
		if (spendingCapCents !== null) {
			const dollars = spendingCapCents / 100;
			if (capPresets.includes(dollars)) {
				selectedPreset = dollars;
				customCapDollars = '';
			} else {
				selectedPreset = null;
				customCapDollars = dollars.toString();
			}
		} else {
			selectedPreset = null;
			customCapDollars = '';
		}
	}

	function handleToggle() {
		const newValue = !allowOverages;
		dispatch('change', {
			allowOverages: newValue,
			spendingCapCents: newValue ? (selectedPreset ? selectedPreset * 100 : null) : null
		});
	}

	function selectPreset(amount) {
		selectedPreset = amount;
		customCapDollars = '';
		dispatch('change', {
			allowOverages,
			spendingCapCents: amount * 100
		});
	}

	function handleCustomCapInput(e) {
		const value = e.target.value;
		customCapDollars = value;
		selectedPreset = null;

		if (value && !isNaN(parseFloat(value)) && parseFloat(value) >= 1) {
			dispatch('change', {
				allowOverages,
				spendingCapCents: Math.round(parseFloat(value) * 100)
			});
		}
	}

	function clearCap() {
		selectedPreset = null;
		customCapDollars = '';
		dispatch('change', {
			allowOverages,
			spendingCapCents: null
		});
	}
</script>

<div
	class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden"
>
	<!-- Header -->
	<div class="bg-gray-100 border-b-[3px] border-gray-900 p-4">
		<div class="flex items-center gap-3">
			<div
				class="w-8 h-8 rounded-lg bg-[#10b981] border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#1f2937]"
			>
				<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
			</div>
			<div>
				<h2 class="text-xs font-black text-gray-900 uppercase tracking-widest">Project Limits</h2>
				<p class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
					Manage overages & caps
				</p>
			</div>
		</div>
	</div>

	<div class="p-6">
		{#if !eligible}
			<!-- Not eligible for overages -->
			<div class="text-gray-500">
				<p class="font-medium">Overage billing is not available on your plan.</p>
				<p class="text-sm mt-1">Upgrade to Pro or Business to enable pay-per-render overages.</p>
			</div>
		{:else}
			<!-- Overage toggle -->
			<label class="flex items-start gap-3 cursor-pointer">
				<input
					type="checkbox"
					checked={allowOverages}
					on:change={handleToggle}
					disabled={loading}
					class="w-5 h-5 mt-0.5 accent-blue-500 cursor-pointer disabled:opacity-50"
				/>
				<div>
					<span class="font-bold text-gray-900">Allow overages at {overageRate}/render</span>
					<p class="text-sm text-gray-600 mt-0.5">
						Continue rendering beyond your limit for a small per-render fee
					</p>
				</div>
			</label>

			{#if allowOverages}
				<!-- Spending cap section -->
				<div class="mt-4 ml-8 border-l-2 border-gray-200 pl-4">
					<p class="text-sm font-medium text-gray-700 mb-2">Monthly safety cap (optional):</p>
					<div class="flex flex-wrap gap-2">
						{#each capPresets as amount}
							<button
								type="button"
								on:click={() => selectPreset(amount)}
								disabled={loading}
								class="px-3 py-1.5 border-2 border-gray-900 font-medium text-sm transition-colors disabled:opacity-50
                     {selectedPreset === amount
									? 'bg-blue-500 text-white shadow-[2px_2px_0_0_#1f2937]'
									: 'bg-white text-gray-900 hover:bg-gray-100'}"
							>
								${amount}
							</button>
						{/each}
						<input
							type="number"
							min="1"
							step="1"
							placeholder="Custom"
							value={customCapDollars}
							on:input={handleCustomCapInput}
							disabled={loading}
							class="w-20 px-2 py-1 border-2 border-gray-900 text-sm font-medium
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   disabled:opacity-50"
						/>
						{#if spendingCapCents !== null}
							<button
								type="button"
								on:click={clearCap}
								disabled={loading}
								class="px-3 py-1.5 border-2 border-gray-300 text-gray-600 text-sm
                     hover:border-gray-900 hover:text-gray-900 transition-colors disabled:opacity-50"
							>
								No cap
							</button>
						{/if}
					</div>
					<p class="text-xs text-gray-500 mt-2">
						{#if spendingCapCents !== null}
							Overages will stop when you reach ${spendingCapDollars} in a billing cycle.
						{:else}
							No cap set. You can set a limit to control overage spending.
						{/if}
					</p>
				</div>

				<!-- Current cycle summary -->
				{#if currentCycleOverages > 0}
					<div class="mt-4 ml-8 bg-gray-50 border-2 border-gray-200 p-3">
						<p class="text-sm font-medium text-gray-700">This billing cycle:</p>
						<div class="mt-1 flex items-center gap-4 text-sm">
							<span>
								<span class="font-bold text-gray-900">{currentCycleOverages}</span>
								<span class="text-gray-600">overage renders</span>
							</span>
							<span>
								<span class="font-bold text-gray-900">${currentCostDollars}</span>
								<span class="text-gray-600">total cost</span>
							</span>
							{#if remainingBudgetDollars !== null}
								<span>
									<span class="font-bold text-gray-900">${remainingBudgetDollars}</span>
									<span class="text-gray-600">remaining</span>
								</span>
							{/if}
						</div>
					</div>
				{/if}
			{/if}
		{/if}
	</div>
</div>
