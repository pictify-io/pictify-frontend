<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import ConditionGroup from './ConditionGroup.svelte';
	import CategoryPicker from './CategoryPicker.svelte';
	import { COUNTRIES } from '../../utils/countries.js';

	const dispatch = createEventDispatcher();

	// The conditions object for this variant (new recursive tree format)
	export let conditions = { type: 'group', operator: 'AND', children: [] };
	export let disabled = false;
	export let isDefault = false;

	// Category picker state
	let showCategoryPicker = false;
	let pickerTargetGroup = null;

	// Property definitions (needed for summary building and default operator resolution)
	const PROPERTIES = [
		{ value: 'device.type', label: 'Device Type', category: 'Device', valueType: 'select', options: ['mobile', 'desktop', 'tablet'] },
		{ value: 'device.os', label: 'Operating System', category: 'Device', valueType: 'select', options: ['iOS', 'Android', 'Windows', 'macOS', 'Linux', 'ChromeOS'] },
		{ value: 'geo.country', label: 'Country', category: 'Location', valueType: 'country' },
		{ value: 'geo.continent', label: 'Continent', category: 'Location', valueType: 'select', options: ['NA', 'EU', 'AS', 'AF', 'SA', 'OC'] },
		{ value: 'time.hour', label: 'Hour of Day (UTC)', category: 'Time', valueType: 'hour' },
		{ value: 'time.dayOfWeek', label: 'Day of Week', category: 'Time', valueType: 'dayOfWeek' },
		{ value: 'browser.language', label: 'Browser Language', category: 'Browser', valueType: 'select', options: ['en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'ja', 'ko', 'zh', 'ar', 'hi', 'ru'] },
		{ value: 'url.param', label: 'URL Parameter', category: 'URL', valueType: 'text', needsParamName: true },
		{ value: 'referrer.domain', label: 'Referrer Domain', category: 'Referrer', valueType: 'text' },
	];

	const CONTINENT_LABELS = { NA: 'North America', EU: 'Europe', AS: 'Asia', AF: 'Africa', SA: 'South America', OC: 'Oceania' };
	const LANGUAGE_LABELS = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', it: 'Italian', nl: 'Dutch', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', ar: 'Arabic', hi: 'Hindi', ru: 'Russian' };
	const DAY_LABELS = { '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday', '5': 'Friday', '6': 'Saturday' };

	// ============== Quick-add presets ==============

	const PRESETS = [
		{ label: 'Mobile Users', rules: [{ type: 'rule', property: 'device.type', operator: 'eq', value: 'mobile' }] },
		{ label: 'Desktop Users', rules: [{ type: 'rule', property: 'device.type', operator: 'eq', value: 'desktop' }] },
		{
			label: 'US & Canada',
			rules: [{
				type: 'group', operator: 'OR', children: [
					{ type: 'rule', property: 'geo.country', operator: 'eq', value: 'US' },
					{ type: 'rule', property: 'geo.country', operator: 'eq', value: 'CA' },
				]
			}]
		},
		{ label: 'Europe', rules: [{ type: 'rule', property: 'geo.continent', operator: 'eq', value: 'EU' }] },
		{
			label: 'Business Hours',
			rules: [{ type: 'rule', property: 'time.hour', operator: 'in', value: [9, 10, 11, 12, 13, 14, 15, 16, 17] }]
		},
		{
			label: 'Weekdays Only',
			rules: [{ type: 'rule', property: 'time.dayOfWeek', operator: 'in', value: ['1', '2', '3', '4', '5'] }]
		},
		{
			label: 'Social Traffic',
			rules: [{
				type: 'group', operator: 'OR', children: [
					{ type: 'rule', property: 'referrer.domain', operator: 'contains', value: 'twitter.com' },
					{ type: 'rule', property: 'referrer.domain', operator: 'contains', value: 'facebook.com' },
					{ type: 'rule', property: 'referrer.domain', operator: 'contains', value: 'linkedin.com' },
				]
			}]
		},
	];

	// ============== Backward compatibility ==============

	function normalizeConditions(cond) {
		if (!cond) return { type: 'group', operator: 'AND', children: [] };

		// Already new format
		if (cond.type === 'group') return cond;

		// Old flat format: { operator, rules }
		if (Array.isArray(cond.rules)) {
			return {
				type: 'group',
				operator: cond.operator || 'AND',
				children: (cond.rules || []).map(r => ({ type: 'rule', ...r })),
			};
		}

		return { type: 'group', operator: 'AND', children: [] };
	}

	onMount(() => {
		conditions = normalizeConditions(conditions);
	});

	// ============== Category picker ==============

	function handleOpenCategoryPicker(targetGroup) {
		pickerTargetGroup = targetGroup;
		showCategoryPicker = true;
	}

	function getDefaultForProperty(property) {
		const def = PROPERTIES.find(p => p.value === property);
		const vt = def?.valueType || 'text';
		// hour and dayOfWeek only support 'in' operator with array values
		if (vt === 'hour' || vt === 'dayOfWeek') {
			return { operator: 'in', value: [] };
		}
		return { operator: 'eq', value: '' };
	}

	function handleCategorySelect(event) {
		const property = event.detail;
		if (pickerTargetGroup) {
			const defaults = getDefaultForProperty(property);
			pickerTargetGroup.children = [...pickerTargetGroup.children, {
				type: 'rule',
				property,
				operator: defaults.operator,
				value: defaults.value,
				paramName: '',
			}];
			conditions = conditions; // trigger reactivity
		}
		showCategoryPicker = false;
		pickerTargetGroup = null;
		emitChange();
	}

	function handleCategoryCancel() {
		showCategoryPicker = false;
		pickerTargetGroup = null;
	}

	// ============== Presets ==============

	function applyPreset(preset) {
		for (const item of preset.rules) {
			conditions.children = [...conditions.children, JSON.parse(JSON.stringify(item))];
		}
		conditions = conditions;
		emitChange();
	}

	// ============== Root operator toggle ==============

	function toggleRootOperator() {
		conditions.operator = conditions.operator === 'AND' ? 'OR' : 'AND';
		emitChange();
	}

	// ============== Change propagation ==============

	function emitChange() {
		dispatch('change', conditions);
	}

	// ============== Natural language summary (recursive) ==============

	function getPropertyDef(propertyValue) {
		return PROPERTIES.find(p => p.value === propertyValue);
	}

	function formatValue(def, value) {
		if (!def) return Array.isArray(value) ? value.join(', ') : String(value ?? '');

		if (def.valueType === 'hour') {
			if (!Array.isArray(value) || value.length === 0) return '';
			const sorted = [...value].sort((a, b) => a - b);
			const fmt = h => { const d = h === 0 ? 12 : (h > 12 ? h - 12 : h); return `${d}${h < 12 ? 'am' : 'pm'}`; };
			return sorted.map(fmt).join(', ');
		}
		if (def.valueType === 'dayOfWeek') {
			if (!Array.isArray(value) || value.length === 0) return '';
			return value.map(v => DAY_LABELS[v] || v).join(', ');
		}
		if (def.value === 'geo.continent') {
			return Array.isArray(value)
				? value.map(v => CONTINENT_LABELS[v] || v).join(', ')
				: (CONTINENT_LABELS[value] || value);
		}
		if (def.value === 'geo.country') {
			const getName = c => COUNTRIES.find(cc => cc.code === c)?.name || c;
			return Array.isArray(value) ? value.map(getName).join(', ') : getName(value);
		}
		if (def.value === 'browser.language') {
			return Array.isArray(value)
				? value.map(v => LANGUAGE_LABELS[v] || v).join(', ')
				: (LANGUAGE_LABELS[value] || value);
		}

		return Array.isArray(value) ? value.join(', ') : String(value ?? '');
	}

	function buildNodeSummary(node) {
		if (!node) return null;

		if (node.type === 'rule') {
			// Skip incomplete rules: no property, empty value, or empty array
			if (!node.property) return null;
			if (Array.isArray(node.value) ? node.value.length === 0 : (node.value === '' && node.value !== 0)) return null;
			const def = getPropertyDef(node.property);
			const label = def?.label || node.property;
			const opLabels = { eq: 'is', in: 'is one of', not_in: 'is not', gt: '>', lt: '<', gte: '>=', lte: '<=', contains: 'contains' };
			const opLabel = opLabels[node.operator] || node.operator;
			const val = formatValue(def, node.value);

			if (def?.needsParamName && node.paramName) {
				return `${node.paramName} ${opLabel} "${val}"`;
			}
			return `${label} ${opLabel} ${val}`;
		}

		if (node.type === 'group') {
			const childSummaries = (node.children || [])
				.map(c => buildNodeSummary(c))
				.filter(Boolean);

			if (childSummaries.length === 0) return null;
			if (childSummaries.length === 1) return childSummaries[0];

			const joiner = node.operator === 'OR' ? ' OR ' : ' AND ';
			const joined = childSummaries.join(joiner);
			// Wrap in parens if this is a nested group (not root)
			return `(${joined})`;
		}

		return null;
	}

	function buildSummary() {
		if (!conditions || !conditions.children || conditions.children.length === 0) return null;

		const childSummaries = (conditions.children || [])
			.map(c => buildNodeSummary(c))
			.filter(Boolean);

		if (childSummaries.length === 0) return null;
		if (childSummaries.length === 1) return childSummaries[0];

		const joiner = conditions.operator === 'OR' ? ' OR ' : ' AND ';
		return childSummaries.join(joiner);
	}

	$: summary = buildSummary();
	$: hasChildren = conditions?.children && conditions.children.length > 0;
</script>

{#if isDefault}
	<!-- Default variant: no rules needed, just show fallback notice -->
	<div class="bg-[#ffc480]/10 border-[2px] border-[#ffc480] rounded-xl p-4">
		<div class="flex items-center gap-2">
			<svg class="w-5 h-5 text-[#ffc480]" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
			</svg>
			<span class="text-sm font-black text-gray-900">Fallback Variant</span>
		</div>
		<p class="text-xs font-bold text-gray-600 mt-1 ml-7">
			This variant is shown when no other variant's rules match the viewer.
		</p>
	</div>
{:else}
	<div class="space-y-5">
		<!-- Header with root AND/OR toggle -->
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-black uppercase tracking-widest text-black">
				Targeting Rules
			</h3>
			{#if conditions.children && conditions.children.length > 1}
				<button
					type="button"
					on:click={toggleRootOperator}
					{disabled}
					class="flex items-center gap-1.5 px-3 py-1.5 border-[3px] border-black rounded-lg text-[10px] font-black uppercase tracking-widest bg-white hover:bg-gray-100 hover:-translate-y-[2px] shadow-[2px_2px_0_0_black] hover:shadow-[4px_4px_0_0_black] active:shadow-none active:translate-y-[2px] hover:text-black transition-all text-black"
				>
					Match
					<span class="bg-gray-900 text-white px-1.5 py-0.5 rounded text-[9px]">
						{conditions.operator || 'AND'}
					</span>
					of these rules
				</button>
			{/if}
		</div>

		<!-- Condition tree -->
		{#if hasChildren}
			<ConditionGroup
				bind:group={conditions}
				depth={0}
				maxDepth={3}
				{disabled}
				isRoot={true}
				onAddCondition={(targetGroup) => handleOpenCategoryPicker(targetGroup)}
				on:change={emitChange}
			/>
		{/if}

		<!-- Category Picker overlay -->
		{#if showCategoryPicker}
			<CategoryPicker
				{disabled}
				on:select={handleCategorySelect}
				on:cancel={handleCategoryCancel}
			/>
		{/if}

		<!-- Empty state -->
		{#if !hasChildren}
			<div class="space-y-4">
				<!-- Quick Start — prominent accent card -->
				<div class="bg-[#FFDE82] border-[3px] border-black shadow-[4px_4px_0_0_black] rounded-xl p-5">
					<div class="flex items-center gap-2 mb-3">
						<svg class="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
							<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
						</svg>
						<span class="text-sm font-black text-black">Quick Start</span>
						<span class="text-[10px] font-bold text-black/70 ml-1">Pick a preset to get started instantly</span>
					</div>
					<div class="flex flex-wrap gap-2">
						{#each PRESETS as preset}
							<button
								type="button"
								on:click={() => applyPreset(preset)}
								{disabled}
								class="px-3.5 py-2 rounded-lg border-[3px] border-black bg-white text-xs font-black text-black shadow-[2px_2px_0_0_black]
									hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none
									transition-all cursor-pointer"
							>
								{preset.label}
							</button>
						{/each}
					</div>
				</div>

				<!-- Divider -->
				<div class="flex items-center gap-3 justify-center">
					<div class="h-[1px] flex-1 bg-gray-200"></div>
					<span class="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">or build your own</span>
					<div class="h-[1px] flex-1 bg-gray-200"></div>
				</div>

				<!-- Manual add buttons -->
				<div class="flex items-center gap-2 justify-center">
					<button
						type="button"
						on:click={() => handleOpenCategoryPicker(conditions)}
						{disabled}
						class="px-4 py-2.5 border-[3px] border-black shadow-[2px_2px_0_0_black] rounded-xl bg-white text-black
							hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none
							transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
						</svg>
						Add Condition
					</button>
					<button
						type="button"
						on:click={() => {
							conditions.children = [...conditions.children, { type: 'group', operator: 'OR', children: [] }];
							conditions = conditions;
							emitChange();
						}}
						{disabled}
						class="px-4 py-2.5 border-[3px] border-black shadow-[2px_2px_0_0_black] rounded-xl bg-[#4ade80] text-black
							hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none
							transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
						</svg>
						Add Group
					</button>
				</div>
			</div>
		{/if}

		<!-- Presets row (when rules already exist) -->
		{#if hasChildren}
			<div class="flex flex-wrap gap-2 pt-1">
				{#each PRESETS as preset}
					<button
						type="button"
						on:click={() => applyPreset(preset)}
						{disabled}
						class="px-3 py-1.5 rounded-lg border-[3px] border-black bg-white text-[10px] font-black text-black shadow-[2px_2px_0_0_black]
							hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[2px] active:shadow-none active:translate-y-0
							transition-all cursor-pointer"
					>
						+ {preset.label}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Natural language summary -->
		{#if summary}
			<div class="bg-[#4ade80] border-[3px] border-black shadow-[4px_4px_0_0_black] rounded-xl px-5 py-4 mt-6">
				<div class="flex items-start gap-2">
					<svg class="w-5 h-5 text-black mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
					</svg>
					<p class="text-sm font-bold text-black leading-relaxed">
						Show this variant when: <span class="font-black">{summary}</span>
					</p>
				</div>
			</div>
		{/if}
	</div>
{/if}
