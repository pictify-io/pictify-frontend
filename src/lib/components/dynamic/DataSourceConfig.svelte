<script>
	import { createEventDispatcher } from 'svelte';

	export let dataSources = [];
	export let selectedDataSource = null;
	export let newDataSource = { name: '', type: 'http', url: '', method: 'GET', headers: {} };
	export let testResult = null;
	export let isTesting = false;

	const dispatch = createEventDispatcher();

	let showNewForm = false;
	let newHeaderKey = '';
	let newHeaderValue = '';

	// Sensitive header detection and masking
	const sensitiveKeyPatterns = ['authorization', 'api-key', 'x-api-key', 'bearer', 'token', 'secret', 'password', 'credential'];

	const isSensitiveHeader = (key) => {
		const lowerKey = key.toLowerCase();
		return sensitiveKeyPatterns.some(pattern => lowerKey.includes(pattern));
	};

	const getMaskedValue = (key, value) => {
		if (!value) return '';
		if (isSensitiveHeader(key)) {
			return '••••••••' + (value.length > 4 ? value.slice(-4) : '');
		}
		return value;
	};

	const selectDataSource = (ds) => {
		dispatch('select', ds);
		showNewForm = false;
	};

	const handleTest = () => {
		dispatch('test');
	};

	const handleCreate = () => {
		dispatch('create');
	};

	const updateNewDataSource = (updates) => {
		dispatch('updateNew', updates);
	};

	const addHeader = () => {
		if (!newHeaderKey.trim()) return;
		const headers = { ...newDataSource.headers, [newHeaderKey]: newHeaderValue };
		updateNewDataSource({ headers });
		newHeaderKey = '';
		newHeaderValue = '';
	};

	const removeHeader = (key) => {
		const headers = { ...newDataSource.headers };
		delete headers[key];
		updateNewDataSource({ headers });
	};

	const handleNext = () => {
		dispatch('next');
	};
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>
			</svg>
			Data Source
		</h2>
		<button
			class="text-xs font-bold text-[#a855f7] hover:text-[#9333ea] uppercase tracking-wide"
			on:click={() => { showNewForm = true; dispatch('select', null); }}
		>
			+ Create New
		</button>
	</div>

	{#if !showNewForm && dataSources.length > 0}
		<!-- Existing Data Sources -->
		<div class="space-y-3">
			<p class="text-sm text-gray-500 font-medium">Select an existing data source or create a new one</p>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{#each dataSources as ds (ds.uid)}
					<button
						class="text-left p-4 border-2 rounded-xl transition-all
							{selectedDataSource?.uid === ds.uid
								? 'border-[#a855f7] bg-purple-50 shadow-[3px_3px_0_0_#a855f7]'
								: 'border-gray-200 hover:border-gray-400 bg-white'}"
						on:click={() => selectDataSource(ds)}
					>
						<div class="flex items-start justify-between">
							<div>
								<p class="font-bold text-gray-900">{ds.name}</p>
								<p class="text-xs text-gray-500 font-mono mt-1 truncate max-w-[200px]">{ds.url}</p>
							</div>
							<span class="px-2 py-0.5 text-[9px] font-bold uppercase bg-gray-100 text-gray-600 rounded">
								{ds.type}
							</span>
						</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if showNewForm || dataSources.length === 0}
		<!-- New Data Source Form -->
		<div class="space-y-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
			<h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide">New Data Source</h3>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Name</label>
					<input
						type="text"
						class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
						placeholder="My API"
						value={newDataSource.name}
						on:input={(e) => updateNewDataSource({ name: e.target.value })}
					/>
				</div>
				<div>
					<label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Type</label>
					<select
						class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors bg-white"
						value={newDataSource.type}
						on:change={(e) => updateNewDataSource({ type: e.target.value })}
					>
						<option value="http">HTTP API</option>
						<option value="webhook">Webhook</option>
						<option value="static">Static Data</option>
					</select>
				</div>
			</div>

			{#if newDataSource.type === 'http'}
				<div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
					<div class="sm:col-span-3">
						<label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">URL</label>
						<input
							type="url"
							class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-gray-900 transition-colors"
							placeholder="https://api.example.com/data"
							value={newDataSource.url}
							on:input={(e) => updateNewDataSource({ url: e.target.value })}
						/>
					</div>
					<div>
						<label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Method</label>
						<select
							class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors bg-white"
							value={newDataSource.method}
							on:change={(e) => updateNewDataSource({ method: e.target.value })}
						>
							<option value="GET">GET</option>
							<option value="POST">POST</option>
						</select>
					</div>
				</div>

				<!-- Headers -->
				<div>
					<label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Headers (Optional)</label>
					{#if Object.keys(newDataSource.headers).length > 0}
						<div class="space-y-2 mb-3">
							{#each Object.entries(newDataSource.headers) as [key, value]}
								<div class="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
									<span class="text-xs font-mono font-bold text-gray-700">{key}:</span>
									<span class="text-xs font-mono text-gray-500 flex-1 truncate">{getMaskedValue(key, value)}</span>
									<button
										class="text-gray-400 hover:text-[#ff6b6b] transition-colors"
										on:click={() => removeHeader(key)}
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
										</svg>
									</button>
								</div>
							{/each}
						</div>
					{/if}
					<div class="flex gap-2">
						<input
							type="text"
							class="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:border-gray-900 transition-colors"
							placeholder="Header-Name"
							bind:value={newHeaderKey}
						/>
						{#if isSensitiveHeader(newHeaderKey)}
						<input
							type="password"
							class="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:border-gray-900 transition-colors"
							placeholder="Value"
							bind:value={newHeaderValue}
						/>
					{:else}
						<input
							type="text"
							class="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:border-gray-900 transition-colors"
							placeholder="Value"
							bind:value={newHeaderValue}
						/>
					{/if}
						<button
							class="px-3 py-2 bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 rounded-lg text-xs font-bold transition-colors"
							on:click={addHeader}
						>
							Add
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Test Section -->
	{#if selectedDataSource || (newDataSource.url && newDataSource.type === 'http')}
		<div class="border-t-2 border-gray-200 pt-4">
			<div class="flex items-center justify-between mb-3">
				<h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide">Test Connection</h3>
				<button
					class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs uppercase tracking-wide rounded-lg border-2 border-gray-300 transition-all disabled:opacity-50"
					on:click={handleTest}
					disabled={isTesting}
				>
					{#if isTesting}
						<span class="flex items-center gap-2">
							<svg class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Testing...
						</span>
					{:else}
						Test Fetch
					{/if}
				</button>
			</div>

			{#if testResult}
				<div class="p-4 rounded-xl border-2 {testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
					{#if testResult.success}
						<div class="flex items-center gap-2 mb-2">
							<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
							</svg>
							<span class="font-bold text-green-800 text-sm">Success</span>
							{#if testResult.duration}
								<span class="text-xs text-green-600">({testResult.duration}ms)</span>
							{/if}
						</div>
						<div class="bg-white rounded-lg p-3 border border-green-200 max-h-48 overflow-auto">
							<pre class="text-xs font-mono text-gray-700 whitespace-pre-wrap">{JSON.stringify(testResult.data, null, 2)}</pre>
						</div>
					{:else}
						<div class="flex items-center gap-2">
							<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
							</svg>
							<span class="font-bold text-red-800 text-sm">Failed: {testResult.error}</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Actions -->
	<div class="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
		{#if showNewForm && !selectedDataSource}
			<button
				class="px-6 py-3 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold text-sm uppercase tracking-wide rounded-xl border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
				on:click={handleCreate}
				disabled={!newDataSource.name || !newDataSource.url}
			>
				Create & Continue
			</button>
		{:else}
			<button
				class="px-6 py-3 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold text-sm uppercase tracking-wide rounded-xl border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
				on:click={handleNext}
				disabled={!selectedDataSource}
			>
				Next: Mapping
			</button>
		{/if}
	</div>
</div>
