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

<div class="cb" bind:this={containerRef}>
	<!-- Row 1: Variable -->
	<div class="row">
		<span class="label">When</span>
		<div class="field-wrap">
			<button 
				class="field {selectedVariable ? '' : 'placeholder'}"
				on:click|stopPropagation={() => { showVarDropdown = !showVarDropdown; showOpDropdown = false; }}
			>
				<span>{selectedVariable || 'choose variable'}</span>
				<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
			</button>
			
			{#if showVarDropdown}
				<div class="dropdown">
					{#if customVarMode}
						<div class="custom-row">
							<input 
								type="text" 
								placeholder="Variable name" 
								bind:value={customVarInput}
								on:keydown={(e) => e.key === 'Enter' && confirmCustom()}
							/>
							<button class="ok-btn" on:click|stopPropagation={confirmCustom}>✓</button>
						</div>
					{:else}
						{#each allVariables as v}
							<button class="opt {selectedVariable === v ? 'sel' : ''}" on:click|stopPropagation={() => selectVar(v)}>
								{v}
							</button>
						{/each}
						{#if allVariables.length === 0}
							<div class="empty">No variables on canvas</div>
						{/if}
						<button class="opt custom" on:click|stopPropagation={enterCustomMode}>
							+ Add custom
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Row 2: Operator -->
	<div class="row">
		<div class="field-wrap">
			<button 
				class="field op-field"
				on:click|stopPropagation={() => { showOpDropdown = !showOpDropdown; showVarDropdown = false; }}
			>
				<span>{getOperatorLabel(selectedOperator)}</span>
				<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
			</button>
			
			{#if showOpDropdown}
				<div class="dropdown op-dropdown">
					{#each OPERATORS as op}
						<button class="opt {selectedOperator === op.value ? 'sel' : ''}" on:click|stopPropagation={() => selectOp(op.value)}>
							{op.label}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		
		{#if operatorNeedsValue(selectedOperator)}
			<input 
				type="text" 
				class="value-input" 
				placeholder="value"
				value={conditionValue}
				on:input={handleValue}
			/>
		{/if}
	</div>
</div>

<style>
	.cb {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	
	.label {
		font-size: 12px;
		color: #111827;
		min-width: 36px;
        font-weight: 800;
        text-transform: uppercase;
	}
	
	.field-wrap {
		position: relative;
		flex: 1;
	}
	
	.field {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 10px;
		background: #fff;
		border: 2px solid #111827;
		border-radius: 6px;
		font-size: 12px;
		color: #111827;
		cursor: pointer;
		transition: all 0.15s;
        box-shadow: 2px 2px 0 0 #111827;
        font-weight: 700;
        text-transform: uppercase;
	}
	
	.field:hover {
		background: #fff;
        transform: translate(-1px, -1px);
        box-shadow: 3px 3px 0 0 #111827;
	}
	
	.field.placeholder span {
		color: #6b7280;
	}
	
	.field svg {
		width: 14px;
		height: 14px;
		color: #111827;
		flex-shrink: 0;
	}
	
	.op-field {
		background: #fff;
		border-color: #111827;
		color: #111827;
	}
	
	.op-field:hover {
		background: #fff;
	}
	
	.value-input {
		flex: 1;
		padding: 6px 10px;
		border: 2px solid #111827;
		border-radius: 6px;
		font-size: 12px;
		min-width: 0;
        box-shadow: 2px 2px 0 0 #111827;
        font-weight: 600;
        color: #111827;
	}
	
	.value-input:focus {
		outline: none;
		border-color: #111827;
		box-shadow: 2px 2px 0 0 #ffc480;
	}
	
	.dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		min-width: 100%;
		background: white;
		border: 2px solid #111827;
		border-radius: 8px;
		box-shadow: 4px 4px 0 0 #1f2937;
		z-index: 100;
		max-height: 200px;
		overflow-y: auto;
	}
	
	.op-dropdown {
		min-width: 100px;
	}
	
	.opt {
		display: block;
		width: 100%;
		padding: 8px 12px;
		text-align: left;
		background: none;
		border: none;
        border-bottom: 1px solid #eee;
		font-size: 12px;
		color: #111827;
		cursor: pointer;
        font-weight: 600;
        text-transform: uppercase;
	}
    
    .opt:last-child {
        border-bottom: none;
    }
	
	.opt:hover {
		background: #f3f4f6;
        color: #000;
	}
	
	.opt.sel {
		background: #ffc480;
		color: #111827;
		font-weight: 800;
	}
	
	.opt.custom {
		border-top: 2px solid #111827;
		color: #111827;
		font-weight: 800;
        background: #f9fafb;
	}
	
	.empty {
		padding: 12px;
		text-align: center;
		color: #6b7280;
		font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
	}
	
	.custom-row {
		display: flex;
		gap: 6px;
		padding: 8px;
	}
	
	.custom-row input {
		flex: 1;
		padding: 6px 8px;
		border: 2px solid #111827;
		border-radius: 4px;
		font-size: 12px;
        font-weight: 600;
	}
	
	.custom-row input:focus {
		outline: none;
		border-color: #111827;
        box-shadow: 2px 2px 0 0 #ffc480;
	}
	
	.ok-btn {
		padding: 0 10px;
		background: #111827;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
        font-weight: 800;
        box-shadow: 2px 2px 0 0 #000;
	}
	
	.ok-btn:hover {
		background: #000;
        transform: translate(-1px, -1px);
        box-shadow: 3px 3px 0 0 #ffc480;
	}
</style>
