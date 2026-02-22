<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { editor } from '../../../store/editor.store';
	import { variableNames, variableActions } from '../../../store/variables.store';

	export let condition = '';
	export let availableVariables = [];

	const dispatch = createEventDispatcher();

	// Simplified operators
	const OPERATORS = [
		{ value: 'equals', label: 'is' },
		{ value: 'not_equals', label: 'is not' },
		{ value: 'greater_than', label: 'more than' },
		{ value: 'less_than', label: 'less than' },
		{ value: 'is_true', label: 'is true', noValue: true },
		{ value: 'is_false', label: 'is false', noValue: true },
		{ value: 'is_empty', label: 'is empty', noValue: true },
		{ value: 'is_not_empty', label: 'has value', noValue: true },
		{ value: 'contains', label: 'contains' },
	];

	// State
	let selectedVariable = '';
	let selectedOperator = 'equals';
	let conditionValue = '';
	let showVarDropdown = false;
	let showOpDropdown = false;
	let customVarMode = false;
	let customVarInput = '';
	let containerRef;

	// Get variables from centralized store + props
	$: allVariables = [...new Set([...availableVariables, ...$variableNames])];

	// Get operator label - use function to ensure fresh lookup
	function getOperatorLabel(opValue) {
		const op = OPERATORS.find(o => o.value === opValue);
		return op?.label || 'is';
	}

	function operatorNeedsValue(opValue) {
		const op = OPERATORS.find(o => o.value === opValue);
		return !op?.noValue;
	}

	// Parse incoming condition - track last parsed to avoid re-parsing same value
	let lastParsedCondition = '';

	$: if (condition !== lastParsedCondition) {
		parseCondition(condition);
		lastParsedCondition = condition;
	}

	function parseCondition(expr) {
		if (!expr || typeof expr !== 'string') {
			// Reset to defaults if no condition
			selectedVariable = '';
			selectedOperator = 'equals';
			conditionValue = '';
			return;
		}
		const t = expr.trim();
		if (!t) return;

		let m;

		// Boolean checks MUST come first (most specific)
		if ((m = t.match(/^(\w+)\s*==\s*true$/i))) {
			selectedVariable = m[1];
			selectedOperator = 'is_true';
			conditionValue = '';
			return;
		}
		if ((m = t.match(/^(\w+)\s*==\s*false$/i))) {
			selectedVariable = m[1];
			selectedOperator = 'is_false';
			conditionValue = '';
			return;
		}

		// Function-style checks
		if ((m = t.match(/^isEmpty\((\w+)\)$/))) {
			selectedVariable = m[1];
			selectedOperator = 'is_empty';
			conditionValue = '';
			return;
		}
		if ((m = t.match(/^!isEmpty\((\w+)\)$/))) {
			selectedVariable = m[1];
			selectedOperator = 'is_not_empty';
			conditionValue = '';
			return;
		}
		if ((m = t.match(/^contains\((\w+),\s*["']?(.+?)["']?\)$/))) {
			selectedVariable = m[1];
			selectedOperator = 'contains';
			conditionValue = m[2];
			return;
		}

		// Comparison operators (excluding true/false values)
		if ((m = t.match(/^(\w+)\s*==\s*["'](.+?)["']$/))) {
			// Quoted string value
			selectedVariable = m[1];
			selectedOperator = 'equals';
			conditionValue = m[2];
			return;
		}
		if ((m = t.match(/^(\w+)\s*==\s*(\d+(?:\.\d+)?)$/))) {
			// Numeric value
			selectedVariable = m[1];
			selectedOperator = 'equals';
			conditionValue = m[2];
			return;
		}
		if ((m = t.match(/^(\w+)\s*!=\s*["']?(.+?)["']?$/))) {
			selectedVariable = m[1];
			selectedOperator = 'not_equals';
			conditionValue = m[2];
			return;
		}
		if ((m = t.match(/^(\w+)\s*>\s*(.+)$/))) {
			selectedVariable = m[1];
			selectedOperator = 'greater_than';
			conditionValue = m[2];
			return;
		}
		if ((m = t.match(/^(\w+)\s*<\s*(.+)$/))) {
			selectedVariable = m[1];
			selectedOperator = 'less_than';
			conditionValue = m[2];
			return;
		}
	}

	function buildExpression() {
		if (!selectedVariable) return '';
		switch (selectedOperator) {
			case 'equals': return isNaN(conditionValue) ? `${selectedVariable} == "${conditionValue}"` : `${selectedVariable} == ${conditionValue}`;
			case 'not_equals': return isNaN(conditionValue) ? `${selectedVariable} != "${conditionValue}"` : `${selectedVariable} != ${conditionValue}`;
			case 'greater_than': return `${selectedVariable} > ${conditionValue}`;
			case 'less_than': return `${selectedVariable} < ${conditionValue}`;
			case 'is_true': return `${selectedVariable} == true`;
			case 'is_false': return `${selectedVariable} == false`;
			case 'is_empty': return `isEmpty(${selectedVariable})`;
			case 'is_not_empty': return `!isEmpty(${selectedVariable})`;
			case 'contains': return `contains(${selectedVariable}, "${conditionValue}")`;
			default: return `${selectedVariable} == "${conditionValue}"`;
		}
	}

	function emitChange() {
		dispatch('change', { expression: buildExpression() });
	}

	function selectVar(name) {
		selectedVariable = name;
		showVarDropdown = false;
		customVarMode = false;
		customVarInput = '';
		emitChange();
	}

	function enterCustomMode(e) {
		e.stopPropagation();
		customVarMode = true;
	}

	function confirmCustom() {
		if (customVarInput.trim()) {
			selectedVariable = customVarInput.trim();
			customVarMode = false;
			customVarInput = '';
			showVarDropdown = false;
			emitChange();
		}
	}

	function cancelCustom() {
		customVarMode = false;
		customVarInput = '';
	}

	function selectOp(op) {
		selectedOperator = op;
		showOpDropdown = false;
		if (!operatorNeedsValue(op)) conditionValue = '';
		emitChange();
	}

	function handleValue(e) {
		conditionValue = e.target.value;
		emitChange();
	}

	function handleKeydown(e) {
		if (e.key === 'Escape') {
			if (customVarMode) {
				cancelCustom();
			} else {
				showVarDropdown = false;
				showOpDropdown = false;
			}
		}
	}

	function closeDropdowns(e) {
		if (containerRef && !containerRef.contains(e.target)) {
			showVarDropdown = false;
			showOpDropdown = false;
			customVarMode = false;
		}
	}

	onMount(() => document.addEventListener('click', closeDropdowns));
	onDestroy(() => document.removeEventListener('click', closeDropdowns));
</script>

<div class="flex flex-col gap-2" bind:this={containerRef} on:keydown={handleKeydown}>
	<!-- Row 1: Variable -->
	<div class="flex items-center gap-2">
		<span class="text-[11px] font-bold text-gray-900 uppercase min-w-[36px]">When</span>
		<div class="relative flex-1">
			<button
				class="w-full flex items-center justify-between px-3 py-1.5 bg-white border-[2px] border-gray-300 rounded-lg text-xs text-gray-900 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-0 focus:border-gray-900 focus:shadow-[2px_2px_0_0_#ffc480] transition-all"
				aria-expanded={showVarDropdown}
				aria-label="Select variable"
				on:click|stopPropagation={() => { showVarDropdown = !showVarDropdown; showOpDropdown = false; }}
			>
				<span class={selectedVariable ? 'font-medium' : 'text-gray-400'}>{selectedVariable || 'choose variable'}</span>
				<i class="fa fa-chevron-down text-[10px] text-gray-400 flex-shrink-0"></i>
			</button>

			{#if showVarDropdown}
				<div
					class="absolute top-[calc(100%+4px)] left-0 min-w-full bg-white border-[2px] border-gray-300 rounded-lg shadow-lg z-[100] max-h-[200px] overflow-y-auto"
					role="listbox"
					aria-label="Variables"
				>
					{#if customVarMode}
						<div class="flex gap-1.5 p-2">
							<input
								type="text"
								class="flex-1 px-2 py-1.5 border-[2px] border-gray-300 rounded-lg text-xs focus:outline-none focus:border-gray-900 focus:shadow-[2px_2px_0_0_#ffc480]"
								placeholder="Variable name"
								bind:value={customVarInput}
								on:keydown={(e) => {
									if (e.key === 'Enter') confirmCustom();
									if (e.key === 'Escape') { e.stopPropagation(); cancelCustom(); }
								}}
							/>
							<button
								class="px-2.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
								on:click|stopPropagation={confirmCustom}
							>&#10003;</button>
						</div>
					{:else}
						{#each allVariables as v}
							<button
								class="block w-full px-3 py-2 text-left text-xs border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors {selectedVariable === v ? 'bg-amber-100 font-semibold text-gray-900' : 'text-gray-700 hover:bg-gray-50'}"
								role="option"
								aria-selected={selectedVariable === v}
								on:click|stopPropagation={() => selectVar(v)}
							>
								{v}
							</button>
						{/each}
						{#if allVariables.length === 0}
							<div class="px-3 py-3 text-center text-[11px] text-gray-400">No variables on canvas</div>
						{/if}
						<button
							class="block w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 border-t border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
							on:click|stopPropagation={enterCustomMode}
						>
							+ Add custom
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Row 2: Operator + Value -->
	<div class="flex items-center gap-2">
		<div class="relative flex-1">
			<button
				class="w-full flex items-center justify-between px-3 py-1.5 bg-white border-[2px] border-gray-300 rounded-lg text-xs font-medium text-gray-900 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-0 focus:border-gray-900 focus:shadow-[2px_2px_0_0_#ffc480] transition-all"
				aria-expanded={showOpDropdown}
				aria-label="Select operator"
				on:click|stopPropagation={() => { showOpDropdown = !showOpDropdown; showVarDropdown = false; }}
			>
				<span>{getOperatorLabel(selectedOperator)}</span>
				<i class="fa fa-chevron-down text-[10px] text-gray-400 flex-shrink-0"></i>
			</button>

			{#if showOpDropdown}
				<div
					class="absolute top-[calc(100%+4px)] left-0 min-w-[100px] bg-white border-[2px] border-gray-300 rounded-lg shadow-lg z-[100] max-h-[200px] overflow-y-auto"
					role="listbox"
					aria-label="Operators"
				>
					{#each OPERATORS as op}
						<button
							class="block w-full px-3 py-2 text-left text-xs border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors {selectedOperator === op.value ? 'bg-amber-100 font-semibold text-gray-900' : 'text-gray-700 hover:bg-gray-50'}"
							role="option"
							aria-selected={selectedOperator === op.value}
							on:click|stopPropagation={() => selectOp(op.value)}
						>
							{op.label}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		{#if operatorNeedsValue(selectedOperator)}
			<input
				type="text"
				class="flex-1 min-w-0 px-3 py-1.5 border-[2px] border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-0 focus:border-gray-900 focus:shadow-[2px_2px_0_0_#ffc480] hover:border-gray-400 transition-all"
				placeholder="value"
				aria-label="Condition value"
				value={conditionValue}
				on:input={handleValue}
			/>
		{/if}
	</div>
</div>
