<script>
	import { createEventDispatcher } from 'svelte';
	import { COUNTRIES } from '../../utils/countries.js';

	const dispatch = createEventDispatcher();

	export let rule;
	export let disabled = false;

	// Property definitions with metadata for adaptive UI
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

	const OPERATORS_BY_TYPE = {
		select: [
			{ value: 'eq', label: 'equals' },
			{ value: 'in', label: 'is one of' },
			{ value: 'not_in', label: 'is not one of' },
		],
		country: [
			{ value: 'eq', label: 'equals' },
			{ value: 'in', label: 'is one of' },
			{ value: 'not_in', label: 'is not one of' },
		],
		hour: [
			{ value: 'in', label: 'includes' },
		],
		dayOfWeek: [
			{ value: 'in', label: 'is on' },
		],
		text: [
			{ value: 'eq', label: 'equals' },
			{ value: 'contains', label: 'contains' },
		],
	};



	const CONTINENT_LABELS = { NA: 'North America', EU: 'Europe', AS: 'Asia', AF: 'Africa', SA: 'South America', OC: 'Oceania' };
	const LANGUAGE_LABELS = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', it: 'Italian', nl: 'Dutch', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', ar: 'Arabic', hi: 'Hindi', ru: 'Russian' };
	const DAYS = [
		{ code: '1', label: 'Mon' }, { code: '2', label: 'Tue' }, { code: '3', label: 'Wed' },
		{ code: '4', label: 'Thu' }, { code: '5', label: 'Fri' }, { code: '6', label: 'Sat' }, { code: '0', label: 'Sun' }
	];

	const HOUR_QUICK_RANGES = [
		{ label: 'Business', hours: [9,10,11,12,13,14,15,16,17] },
		{ label: 'Morning', hours: [6,7,8,9,10,11] },
		{ label: 'Afternoon', hours: [12,13,14,15,16,17] },
		{ label: 'Evening', hours: [18,19,20,21,22,23] },
		{ label: 'Night', hours: [0,1,2,3,4,5] },
	];

	const WEEKDAYS = ['1','2','3','4','5'];
	const WEEKEND = ['0','6'];

	let isCountryPickerOpen = false;
	let countrySearchQuery = '';

	export function getPropertyDef(propertyValue) {
		return PROPERTIES.find(p => p.value === propertyValue);
	}

	function getOperators(propertyValue) {
		const def = getPropertyDef(propertyValue);
		return OPERATORS_BY_TYPE[def?.valueType || 'text'] || OPERATORS_BY_TYPE.text;
	}

	function handlePropertyChange() {
		const def = getPropertyDef(rule.property);
		const operators = OPERATORS_BY_TYPE[def?.valueType || 'text'];
		rule.operator = operators?.[0]?.value || 'eq';
		// Use array default for multi-select types (hour, dayOfWeek) and in/not_in operators
		const vt = def?.valueType;
		if (vt === 'hour' || vt === 'dayOfWeek' || rule.operator === 'in' || rule.operator === 'not_in') {
			rule.value = [];
		} else {
			rule.value = '';
		}
		rule.paramName = '';
		emitChange();
	}

	function emitChange() {
		dispatch('change');
	}

	function emitRemove() {
		dispatch('remove');
	}

	// Exported helpers for summary building
	export { PROPERTIES, COUNTRIES, CONTINENT_LABELS, LANGUAGE_LABELS, DAYS, OPERATORS_BY_TYPE };

	$: propDef = getPropertyDef(rule.property);
</script>

<div class="flex flex-wrap items-center gap-3 px-5 py-4 bg-white border-[3px] border-black shadow-[4px_4px_0_0_black] rounded-xl group transition-all">
	<!-- Property label (read-only, set by CategoryPicker) -->
	{#if rule.property}
		{@const def = getPropertyDef(rule.property)}
		{@const dotColors = { Device: 'bg-blue-500', Location: 'bg-green-500', Time: 'bg-orange-500', Browser: 'bg-purple-500', URL: 'bg-gray-500', Referrer: 'bg-pink-500' }}
		<div class="flex items-center gap-2 px-3 py-2 bg-[#FFFDF8] border-[3px] border-black shadow-[2px_2px_0_0_black] rounded-xl shrink-0">
			<span class="w-2.5 h-2.5 rounded-full shrink-0 border-[2px] border-black {dotColors[def?.category] || 'bg-gray-400'}"></span>
			<span class="text-xs font-black text-black whitespace-nowrap">{def?.label || rule.property}</span>
		</div>
	{:else}
		<select
			bind:value={rule.property}
			on:change={handlePropertyChange}
			{disabled}
			class="px-3 py-2 border-[3px] border-black shadow-[2px_2px_0_0_black] rounded-xl text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_black] transition-all shrink-0 cursor-pointer"
		>
			<option value="">Select property...</option>
			{#each ['Device', 'Location', 'Time', 'Browser', 'URL', 'Referrer'] as category}
				<optgroup label={category}>
					{#each PROPERTIES.filter(p => p.category === category) as prop}
						<option value={prop.value}>{prop.label}</option>
					{/each}
				</optgroup>
			{/each}
		</select>
	{/if}

	<!-- URL param name -->
	{#if propDef?.needsParamName}
		<input
			type="text"
			bind:value={rule.paramName}
			on:input={emitChange}
			placeholder="Param name"
			{disabled}
			class="px-3 py-2 border-[3px] border-black shadow-[2px_2px_0_0_black] rounded-xl text-xs font-bold font-mono bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_black] transition-all sm:w-32 shrink-0 text-black"
		/>
	{/if}

	<!-- Operator -->
	{#if rule.property}
		<select
			bind:value={rule.operator}
			on:change={emitChange}
			{disabled}
			class="px-3 py-2 border-[3px] border-black shadow-[2px_2px_0_0_black] rounded-xl text-xs font-bold bg-[#ffc480] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_black] transition-all shrink-0 cursor-pointer text-black"
		>
			{#each getOperators(rule.property) as op}
				<option value={op.value}>{op.label}</option>
			{/each}
		</select>
	{/if}

	<!-- Value input (adaptive based on property type) -->
	{#if rule.property}
		{#if propDef?.valueType === 'select'}
			{#if rule.operator === 'in' || rule.operator === 'not_in'}
				<div class="flex-1 min-w-0 flex flex-wrap gap-2 p-3 border-[3px] border-black shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] rounded-xl bg-gray-100 min-h-[40px]">
					{#each propDef.options as opt}
						{@const selected = Array.isArray(rule.value) && rule.value.includes(opt)}
						<button
							type="button"
							{disabled}
							on:click={() => {
								if (!Array.isArray(rule.value)) rule.value = [];
								if (selected) {
									rule.value = rule.value.filter(v => v !== opt);
								} else {
									rule.value = [...rule.value, opt];
								}
								emitChange();
							}}
							class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-[3px] border-black transition-all cursor-pointer
								{selected
									? 'bg-black text-white shadow-[2px_2px_0_0_black]'
									: 'bg-white text-black shadow-[2px_2px_0_0_black] hover:bg-[#ffc480] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_black]'}"
						>
							{propDef.optionLabels?.[opt] || (propDef.value === 'geo.continent' ? CONTINENT_LABELS[opt] : null) || (propDef.value === 'browser.language' ? LANGUAGE_LABELS[opt] : null) || opt}
						</button>
					{/each}
				</div>
			{:else}
				<select
					bind:value={rule.value}
					on:change={emitChange}
					{disabled}
					class="flex-1 px-3 py-2 border-[3px] border-black shadow-[2px_2px_0_0_black] rounded-xl text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_black] transition-all cursor-pointer text-black"
				>
					<option value="">Select...</option>
					{#each propDef.options as opt}
						<option value={opt}>
							{propDef.optionLabels?.[opt] || (propDef.value === 'geo.continent' ? CONTINENT_LABELS[opt] : null) || (propDef.value === 'browser.language' ? LANGUAGE_LABELS[opt] : null) || opt}
						</option>
					{/each}
				</select>
			{/if}

		{:else if propDef?.valueType === 'country'}
			<div class="flex-1 min-w-0 flex flex-col gap-3 p-3 border-[3px] border-black shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] rounded-xl bg-gray-100">
				
				{#if !isCountryPickerOpen}
					<!-- Closed State Header -->
					<button
						type="button"
						on:click={() => isCountryPickerOpen = true}
						class="w-full flex items-center justify-between px-3 py-2 border-[3px] border-black shadow-[2px_2px_0_0_black] rounded-xl text-xs font-bold bg-white hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_black] transition-all cursor-pointer text-black"
					>
						<span class="truncate pr-2">
							{#if rule.operator === 'eq' && rule.value}
								{@const c = COUNTRIES.find(x => x.code === rule.value)}
								{c ? `${c.flag} ${c.name}` : rule.value}
							{:else if (rule.operator === 'in' || rule.operator === 'not_in') && Array.isArray(rule.value) && rule.value.length > 0}
								{rule.value.length} countr{rule.value.length === 1 ? 'y' : 'ies'} selected
							{:else}
								<span class="text-gray-500">Select countr{rule.operator === 'eq' ? 'y' : 'ies'}...</span>
							{/if}
						</span>
						<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
					</button>

					<!-- Selected Pills Preview (only in multi-select mode) -->
					{#if (rule.operator === 'in' || rule.operator === 'not_in') && Array.isArray(rule.value) && rule.value.length > 0}
						<div class="flex flex-wrap gap-1.5 mt-1">
							{#each rule.value as code}
								{@const country = COUNTRIES.find(c => c.code === code)}
								{#if country}
									<div class="flex items-center gap-1.5 px-2.5 py-1 bg-[#4ade80] rounded-lg text-[10px] font-black uppercase tracking-wider border-[2px] border-black shadow-[2px_2px_0_0_black]">
										<span>{country.flag} {country.code}</span>
										<button 
											type="button" 
											class="hover:text-white rounded-full p-0.5 hover:bg-black/20 transition-colors cursor-pointer"
											on:click={() => {
												rule.value = rule.value.filter(v => v !== code);
												emitChange();
											}}
										>
											<svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
										</button>
									</div>
								{/if}
							{/each}
						</div>
					{/if}

				{:else}
					<!-- Open State Picker -->
					<div class="relative w-full flex gap-2">
						<div class="relative flex-1">
							<svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
							<input 
								type="text" 
								placeholder="Search countries..." 
								value={countrySearchQuery || ''}
								on:input={(e) => {
									countrySearchQuery = e.target.value;
								}}
								class="w-full pl-9 pr-3 py-2 text-xs font-bold border-[3px] border-black rounded-xl shadow-[2px_2px_0_0_black] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all"
							/>
						</div>
						<button 
							type="button"
							on:click={() => {
								isCountryPickerOpen = false;
								countrySearchQuery = '';
							}}
							class="px-3 py-2 bg-[#ffc480] border-[3px] border-black rounded-xl text-xs font-black shadow-[2px_2px_0_0_black] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_black] transition-all cursor-pointer"
						>
							Done
						</button>
					</div>

					<!-- Countries List -->
					<div class="flex flex-col gap-1 max-h-[200px] overflow-y-auto pr-2 rounded-xl border-[3px] border-black bg-white p-1 mt-1">
						{#each COUNTRIES.filter(c => c.name.toLowerCase().includes((countrySearchQuery || '').toLowerCase()) || c.code.toLowerCase().includes((countrySearchQuery || '').toLowerCase())) as country}
							{@const isMulti = rule.operator === 'in' || rule.operator === 'not_in'}
							{@const selected = isMulti ? (Array.isArray(rule.value) && rule.value.includes(country.code)) : (rule.value === country.code)}
							<button
								type="button"
								{disabled}
								on:click={() => {
									if (isMulti) {
										if (!Array.isArray(rule.value)) rule.value = [];
										if (selected) {
											rule.value = rule.value.filter(v => v !== country.code);
										} else {
											rule.value = [...rule.value, country.code];
										}
									} else {
										// Single select for 'eq'
										rule.value = country.code;
										isCountryPickerOpen = false;
										countrySearchQuery = '';
									}
									emitChange();
								}}
								class="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-bold transition-all border-[2px] border-transparent cursor-pointer
									{selected 
										? 'bg-[#c4f0ff] border-black shadow-[2px_2px_0_0_black] text-black' 
										: 'bg-transparent text-gray-700 hover:bg-gray-100 hover:border-black hover:-translate-y-[1px] hover:shadow-[2px_2px_0_0_black]'}"
							>
								<div class="flex items-center gap-2">
									<span class="text-base">{country.flag}</span>
									<span>{country.name} <span class="text-gray-400 font-mono text-[10px] ml-1">({country.code})</span></span>
								</div>
								{#if selected}
									<svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
									</svg>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

		{:else if propDef?.valueType === 'hour'}
			<div class="flex-1 min-w-0 flex flex-col gap-3 p-3 border-[3px] border-black shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] rounded-xl bg-gray-100 min-h-[40px]">
				<!-- Quick ranges -->
				<div class="flex flex-wrap gap-1.5">
					{#each HOUR_QUICK_RANGES as range}
						{@const allSelected = Array.isArray(rule.value) && range.hours.every(h => rule.value.includes(h))}
						<button
							type="button"
							{disabled}
							on:click={() => {
								if (!Array.isArray(rule.value)) rule.value = [];
								if (allSelected) {
									rule.value = rule.value.filter(v => !range.hours.includes(v));
								} else {
									const merged = new Set([...rule.value, ...range.hours]);
									rule.value = [...merged];
								}
								emitChange();
							}}
							class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-[2px] border-black transition-all cursor-pointer
								{allSelected
									? 'bg-[#4ade80] text-black shadow-[2px_2px_0_0_black]'
									: 'bg-white text-gray-500 shadow-[1px_1px_0_0_black] hover:bg-[#ffc480] hover:text-black'}"
						>
							{range.label}
						</button>
					{/each}
					{#if Array.isArray(rule.value) && rule.value.length > 0}
						<button
							type="button"
							{disabled}
							on:click={() => { rule.value = []; emitChange(); }}
							class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-[2px] border-gray-300 bg-white text-gray-400 hover:border-black hover:text-black transition-all cursor-pointer"
						>
							Clear
						</button>
					{/if}
				</div>

				<!-- Hour grid with AM/PM sections -->
				<div class="flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<span class="text-[9px] font-black text-gray-400 uppercase tracking-widest w-7 shrink-0">AM</span>
						<div class="flex flex-wrap gap-1 flex-1">
							{#each Array.from({ length: 12 }, (_, i) => i) as hour}
								{@const selected = Array.isArray(rule.value) && rule.value.includes(hour)}
								{@const displayHour = hour === 0 ? 12 : hour}
								<button
									type="button"
									{disabled}
									on:click={() => {
										if (!Array.isArray(rule.value)) rule.value = [];
										if (selected) {
											rule.value = rule.value.filter(v => v !== hour);
										} else {
											rule.value = [...rule.value, hour];
										}
										emitChange();
									}}
									class="w-9 h-8 rounded-md text-[11px] font-bold border-[2px] border-black transition-all flex items-center justify-center cursor-pointer
										{selected
											? 'bg-[#4ade80] text-black shadow-[2px_2px_0_0_black] -translate-y-[1px]'
											: 'bg-white text-gray-500 hover:bg-[#ffc480] hover:text-black hover:-translate-y-[1px] hover:shadow-[2px_2px_0_0_black]'}"
								>
									{displayHour}
								</button>
							{/each}
						</div>
					</div>
					<div class="flex items-center gap-2">
						<span class="text-[9px] font-black text-gray-400 uppercase tracking-widest w-7 shrink-0">PM</span>
						<div class="flex flex-wrap gap-1 flex-1">
							{#each Array.from({ length: 12 }, (_, i) => i + 12) as hour}
								{@const selected = Array.isArray(rule.value) && rule.value.includes(hour)}
								{@const displayHour = hour === 12 ? 12 : hour - 12}
								<button
									type="button"
									{disabled}
									on:click={() => {
										if (!Array.isArray(rule.value)) rule.value = [];
										if (selected) {
											rule.value = rule.value.filter(v => v !== hour);
										} else {
											rule.value = [...rule.value, hour];
										}
										emitChange();
									}}
									class="w-9 h-8 rounded-md text-[11px] font-bold border-[2px] border-black transition-all flex items-center justify-center cursor-pointer
										{selected
											? 'bg-[#4ade80] text-black shadow-[2px_2px_0_0_black] -translate-y-[1px]'
											: 'bg-white text-gray-500 hover:bg-[#ffc480] hover:text-black hover:-translate-y-[1px] hover:shadow-[2px_2px_0_0_black]'}"
								>
									{displayHour}
								</button>
							{/each}
						</div>
					</div>
				</div>

				{#if Array.isArray(rule.value) && rule.value.length > 0}
					<span class="text-[10px] font-bold text-gray-500 pl-1">
						{rule.value.length} hour{rule.value.length !== 1 ? 's' : ''} selected (UTC)
					</span>
				{/if}
			</div>

		{:else if propDef?.valueType === 'dayOfWeek'}
			<div class="flex-1 min-w-0 flex flex-col gap-2 p-2 border-[3px] border-black shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] rounded-xl bg-gray-100 min-h-[40px]">
				<!-- Quick selects -->
				<div class="flex gap-1.5 px-1">
					<button
						type="button"
						{disabled}
						on:click={() => {
							if (!Array.isArray(rule.value)) rule.value = [];
							if (Array.isArray(rule.value) && WEEKDAYS.every(d => rule.value.includes(d))) {
								rule.value = rule.value.filter(v => !WEEKDAYS.includes(v));
							} else {
								const merged = new Set([...rule.value, ...WEEKDAYS]);
								rule.value = [...merged];
							}
							emitChange();
						}}
						class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-[2px] border-black transition-all cursor-pointer
							{Array.isArray(rule.value) && WEEKDAYS.every(d => rule.value.includes(d))
								? 'bg-[#4ade80] text-black shadow-[2px_2px_0_0_black]'
								: 'bg-white text-gray-500 shadow-[1px_1px_0_0_black] hover:bg-[#ffc480] hover:text-black'}"
					>
						Weekdays
					</button>
					<button
						type="button"
						{disabled}
						on:click={() => {
							if (!Array.isArray(rule.value)) rule.value = [];
							if (Array.isArray(rule.value) && WEEKEND.every(d => rule.value.includes(d))) {
								rule.value = rule.value.filter(v => !WEEKEND.includes(v));
							} else {
								const merged = new Set([...rule.value, ...WEEKEND]);
								rule.value = [...merged];
							}
							emitChange();
						}}
						class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-[2px] border-black transition-all cursor-pointer
							{Array.isArray(rule.value) && WEEKEND.every(d => rule.value.includes(d))
								? 'bg-[#4ade80] text-black shadow-[2px_2px_0_0_black]'
								: 'bg-white text-gray-500 shadow-[1px_1px_0_0_black] hover:bg-[#ffc480] hover:text-black'}"
					>
						Weekend
					</button>
				</div>

				<!-- Segmented Control for Days -->
				<div class="flex w-full overflow-hidden rounded-lg border-[3px] border-black shadow-[2px_2px_0_0_black]">
					{#each DAYS as day, index}
						{@const selected = Array.isArray(rule.value) && rule.value.includes(day.code)}
						<button
							type="button"
							{disabled}
							on:click={() => {
								if (!Array.isArray(rule.value)) rule.value = [];
								if (selected) {
									rule.value = rule.value.filter(v => v !== day.code);
								} else {
									rule.value = [...rule.value, day.code];
								}
								emitChange();
							}}
							class="flex-1 py-2 text-xs font-black transition-all cursor-pointer uppercase tracking-wider
								{index !== 0 ? 'border-l-[3px] border-black' : ''}
								{selected
									? 'bg-[#4ade80] text-black'
									: 'bg-white text-gray-500 hover:bg-gray-100'}"
						>
							{day.label}
						</button>
					{/each}
				</div>
			</div>

		{:else}
			<input
				type="text"
				bind:value={rule.value}
				on:input={emitChange}
				{disabled}
				placeholder={rule.property === 'referrer.domain' ? 'e.g. twitter.com' : 'Value'}
				class="flex-1 px-3 py-2 border-[3px] border-black shadow-[2px_2px_0_0_black] rounded-xl text-xs font-bold font-mono bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_black] transition-all text-black"
			/>
		{/if}
	{/if}

	<!-- Remove button -->
	<button
		type="button"
		on:click={emitRemove}
		{disabled}
		class="p-2 border-[3px] border-transparent rounded-xl text-gray-400 hover:text-black hover:bg-[#ff6b6b] hover:border-black hover:shadow-[2px_2px_0_0_black] transition-all shrink-0 self-center"
		title="Remove rule"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
		</svg>
	</button>
</div>
