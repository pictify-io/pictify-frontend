<script>
	import { createEventDispatcher } from 'svelte';
	import ConditionRule from './ConditionRule.svelte';

	const dispatch = createEventDispatcher();

	/** @type {{ type: 'group', operator: 'AND'|'OR', children: Array }} */
	export let group;
	export let depth = 0;
	export let maxDepth = 3;
	export let disabled = false;
	export let isRoot = false;

	/** Function to open category picker (passed down from RuleBuilder) */
	export let onAddCondition = null;

	// Stable key counter for each-block keying (avoids index-based reordering bugs)
	let nextKey = 0;
	function assignKey(child) {
		if (child._key == null) child._key = nextKey++;
		return child._key;
	}
	// Assign keys to existing children on mount
	$: if (group.children) group.children.forEach(assignKey);

	function toggleOperator() {
		group.operator = group.operator === 'AND' ? 'OR' : 'AND';
		emitChange();
	}

	function addGroup() {
		if (depth >= maxDepth - 1) return;
		const child = {
			type: 'group',
			operator: group.operator === 'AND' ? 'OR' : 'AND',
			children: []
		};
		assignKey(child);
		group.children = [...group.children, child];
		emitChange();
	}

	function addBlankCondition() {
		const child = {
			type: 'rule',
			property: '',
			operator: 'eq',
			value: '',
			paramName: ''
		};
		assignKey(child);
		group.children = [...group.children, child];
		emitChange();
	}

	function handleAddCondition() {
		if (onAddCondition) {
			onAddCondition(group);
		} else {
			addBlankCondition();
		}
	}

	function removeChild(index) {
		group.children = group.children.filter((_, i) => i !== index);
		emitChange();
	}

	function emitChange() {
		group = group;
		dispatch('change');
	}

	$: isAnd = (group.operator || 'AND') === 'AND';
	$: bgColor = isAnd ? 'bg-[#c4f0ff]' : 'bg-[#ffe4c4]';
	$: borderColor = 'border-black';
	$: canAddGroup = depth < maxDepth - 1;
</script>

<div
	class="rounded-xl border-[3px] {borderColor} {bgColor} {isRoot
		? 'p-6'
		: 'ml-3 sm:ml-5 p-6 shadow-[4px_4px_0_0_black]'}"
>
	<!-- Group header -->
	<div class="flex items-center justify-between {isRoot ? 'mb-1' : 'mb-3 px-1'}">
		<div class="flex items-center gap-2.5">
			{#if !isRoot}
				<!-- Operator badge (clickable to toggle) -->
				<button
					type="button"
					on:click={toggleOperator}
					{disabled}
					class="px-3 py-1.5 border-[3px] border-black rounded-lg text-[10px] font-black uppercase tracking-widest bg-white text-black shadow-[2px_2px_0_0_black] hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[2px] hover:bg-black hover:text-white transition-all cursor-pointer"
					title="Click to toggle AND/OR"
				>
					{group.operator || 'AND'}
				</button>
				<span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Group</span>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if !isRoot}
				<!-- Delete group -->
				<button
					type="button"
					on:click={() => dispatch('remove')}
					{disabled}
					class="p-2 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors"
					title="Remove group"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<!-- Children -->
	{#if group.children && group.children.length > 0}
		<div class="space-y-0">
			{#each group.children as child, index (child._key)}
				{#if child.type === 'group'}
					<svelte:self
						bind:group={child}
						depth={depth + 1}
						{maxDepth}
						{disabled}
						{onAddCondition}
						on:change={emitChange}
						on:remove={() => removeChild(index)}
					/>
				{:else}
					<ConditionRule
						bind:rule={child}
						{disabled}
						on:change={emitChange}
						on:remove={() => removeChild(index)}
					/>
				{/if}

				{#if index < group.children.length - 1}
					<div class="flex items-center justify-center py-2">
						<span
							class="px-3 py-1 border-[3px] border-black shadow-[2px_2px_0_0_black] rounded-md text-[9px] font-black uppercase tracking-widest bg-white text-black"
						>
							{group.operator || 'AND'}
						</span>
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Action buttons -->
	<div class="flex items-center gap-2.5 mt-4 {isRoot ? '' : 'px-1'}">
		<button
			type="button"
			on:click={handleAddCondition}
			{disabled}
			class="px-3.5 py-2 border-[3px] border-black rounded-lg bg-white text-black shadow-[2px_2px_0_0_black]
				hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none
				transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer"
		>
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2.5"
					d="M12 4v16m8-8H4"
				/>
			</svg>
			Condition
		</button>

		{#if canAddGroup}
			<button
				type="button"
				on:click={addGroup}
				{disabled}
				class="px-3.5 py-2 border-[3px] border-black rounded-lg bg-[#ffc480] text-black shadow-[2px_2px_0_0_black]
					hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none
					transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer"
			>
				<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Group
			</button>
		{/if}
	</div>
</div>
