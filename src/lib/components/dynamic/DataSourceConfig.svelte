<script>
	import { createEventDispatcher } from 'svelte';

	export let dataSources = [];
	export let selectedDataSource = null;
	export let newDataSource = { name: '', type: 'http', url: '', method: 'GET', headers: {} };
	export let testResult = null;
	export let isTesting = false;

	const dispatch = createEventDispatcher();

	let newHeaderKey = '';
	let newHeaderValue = '';
	let manualShowNewForm = false;

	// Show form automatically if newDataSource has data (e.g., when editing an existing binding) or user clicked "New Connection"
	$: showNewForm =
		manualShowNewForm || (!selectedDataSource && (newDataSource.name || newDataSource.url));

	// Can proceed if we have a selected data source OR a valid new data source config
	$: canProceed = selectedDataSource || (newDataSource.name && newDataSource.url);

	// Sensitive header detection and masking
	const sensitiveKeyPatterns = [
		'authorization',
		'api-key',
		'x-api-key',
		'bearer',
		'token',
		'secret',
		'password',
		'credential'
	];

	const isSensitiveHeader = (key) => {
		const lowerKey = key.toLowerCase();
		return sensitiveKeyPatterns.some((pattern) => lowerKey.includes(pattern));
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
		manualShowNewForm = false;
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
		<!-- Header removed as it is now in parent -->
		<div />
		<button
			class="px-5 py-2.5 text-xs font-black bg-white hover:bg-gray-50 text-gray-900 border-[3px] border-gray-900 rounded-lg shadow-[3px_3px_0_0_#9ca3af] hover:shadow-[1px_1px_0_0_#9ca3af] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-widest flex items-center gap-2"
			on:click={() => {
				manualShowNewForm = true;
				dispatch('select', null);
			}}
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="3"
					d="M12 4v16m8-8H4"
				/></svg
			>
			New Connection
		</button>
	</div>

	{#if !showNewForm && dataSources.length > 0}
		<!-- Existing Data Sources -->
		<div class="space-y-4">
			<p class="text-sm text-gray-600 font-bold uppercase tracking-wide">Select Available Source</p>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{#each dataSources as ds (ds.uid)}
					<button
						class="text-left p-5 border-[3px] rounded-xl transition-all relative group overflow-hidden
							{selectedDataSource?.uid === ds.uid
							? 'border-gray-900 bg-gray-50 shadow-[4px_4px_0_0_#9ca3af]'
							: 'border-gray-200 hover:border-gray-900 bg-white hover:shadow-[4px_4px_0_0_#1f2937]'}"
						on:click={() => selectDataSource(ds)}
					>
						<div class="flex items-start justify-between relative z-10">
							<div>
								<p class="font-black text-gray-900 uppercase tracking-wide text-sm">{ds.name}</p>
								<p
									class="text-xs text-gray-500 font-mono mt-1 truncate max-w-[200px] border-b-2 border-transparent group-hover:border-gray-200 transition-colors inline-block"
								>
									{ds.url}
								</p>
							</div>
							<span
								class="px-2 py-1 text-[10px] font-black uppercase bg-gray-900 text-white rounded border border-gray-900"
							>
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
		<div
			class="space-y-6 p-6 bg-white border-[3px] border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937]"
		>
			<div class="flex items-center gap-3 pb-4 border-b-[3px] border-gray-900">
				<span class="w-3 h-3 bg-[#3b82f6] border-2 border-gray-900 rounded-full" />
				<h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">
					New Connection Details
				</h3>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
				<div>
					<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2"
						>Internal Name</label
					>
					<input
						type="text"
						class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-lg text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#9ca3af] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all"
						placeholder="MY API CONNECTION"
						value={newDataSource.name}
						on:input={(e) => updateNewDataSource({ name: e.target.value })}
					/>
				</div>
				<div>
					<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2"
						>Connection Type</label
					>
					<div class="relative">
						<select
							class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-lg text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#9ca3af] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all bg-white appearance-none"
							value={newDataSource.type}
							on:change={(e) => updateNewDataSource({ type: e.target.value })}
						>
							<option value="http">HTTP Request (REST)</option>
							<option value="webhook">Webhook Receiver</option>
							<option value="static">Static JSON Data</option>
						</select>
						<div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
							<svg
								class="w-4 h-4 text-gray-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M19 9l-7 7-7-7"
								/></svg
							>
						</div>
					</div>
				</div>
			</div>

			{#if newDataSource.type === 'http'}
				<div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
					<div class="sm:col-span-3">
						<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2"
							>Endpoint URL</label
						>
						<input
							type="url"
							class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-lg text-sm font-mono focus:outline-none focus:shadow-[4px_4px_0_0_#9ca3af] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all"
							placeholder="https://api.example.com/v1/data"
							value={newDataSource.url}
							on:input={(e) => updateNewDataSource({ url: e.target.value })}
						/>
					</div>
					<div>
						<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2"
							>Method</label
						>
						<div class="relative">
							<select
								class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-lg text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#9ca3af] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all bg-white appearance-none"
								value={newDataSource.method}
								on:change={(e) => updateNewDataSource({ method: e.target.value })}
							>
								<option value="GET">GET</option>
								<option value="POST">POST</option>
							</select>
							<div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
								<svg
									class="w-4 h-4 text-gray-900"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M19 9l-7 7-7-7"
									/></svg
								>
							</div>
						</div>
					</div>
				</div>

				<!-- Headers -->
				<div class="bg-gray-50 border-[3px] border-gray-200 rounded-xl p-4">
					<label class="block text-xs font-black text-gray-500 uppercase tracking-wide mb-3"
						>Authentication & Headers</label
					>
					{#if Object.keys(newDataSource.headers).length > 0}
						<div class="space-y-2 mb-4">
							{#each Object.entries(newDataSource.headers) as [key, value]}
								<div
									class="flex items-center gap-3 bg-white p-3 rounded-lg border-[2px] border-gray-200 shadow-sm"
								>
									<div class="flex-1 min-w-0 flex items-center gap-2">
										<span
											class="text-xs font-bold font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200"
											>{key}</span
										>
										<span class="text-gray-400">→</span>
										<span class="text-xs font-mono text-gray-500 truncate"
											>{getMaskedValue(key, value)}</span
										>
									</div>
									<button
										class="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded"
										on:click={() => removeHeader(key)}
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>
							{/each}
						</div>
					{/if}
					<div class="flex flex-col sm:flex-row gap-2">
						<input
							type="text"
							class="flex-1 px-3 py-2 border-[3px] border-gray-200 rounded-lg text-xs font-bold font-mono focus:outline-none focus:border-gray-900 transition-colors"
							placeholder="Header-Name"
							bind:value={newHeaderKey}
						/>
						{#if isSensitiveHeader(newHeaderKey)}
							<input
								type="password"
								class="flex-1 px-3 py-2 border-[3px] border-gray-200 rounded-lg text-xs font-bold font-mono focus:outline-none focus:border-gray-900 transition-colors"
								placeholder="Value"
								bind:value={newHeaderValue}
							/>
						{:else}
							<input
								type="text"
								class="flex-1 px-3 py-2 border-[3px] border-gray-200 rounded-lg text-xs font-bold font-mono focus:outline-none focus:border-gray-900 transition-colors"
								placeholder="Value"
								bind:value={newHeaderValue}
							/>
						{/if}
						<button
							class="px-4 py-2 bg-gray-900 hover:bg-black text-white border-[3px] border-black rounded-lg text-xs font-black transition-colors uppercase tracking-wide"
							on:click={addHeader}
						>
							Add Header
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Test Section -->
	{#if selectedDataSource || (newDataSource.url && newDataSource.type === 'http')}
		<div class="border-t-[3px] border-gray-100 border-dashed pt-6">
			<div class="flex items-center justify-between mb-4">
				<h3
					class="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2"
				>
					<span class="w-2 h-2 bg-gray-900 rounded-full" />
					Verification
				</h3>
				<button
					class="px-5 py-2 bg-white hover:bg-gray-50 text-gray-900 font-black text-xs uppercase tracking-wide rounded-lg border-[3px] border-gray-900 shadow-[3px_3px_0_0_#9ca3af] hover:shadow-[1px_1px_0_0_#9ca3af] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
					on:click={handleTest}
					disabled={isTesting}
				>
					{#if isTesting}
						<span class="flex items-center gap-2">
							<svg class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							Testing Connection...
						</span>
					{:else}
						Test Connection
					{/if}
				</button>
			</div>

			{#if testResult}
				<div
					class="p-6 rounded-xl border-[3px] {testResult.success
						? 'bg-[#dcfce7] border-gray-900 shadow-[4px_4px_0_0_#166534]'
						: 'bg-red-50 border-gray-900 shadow-[4px_4px_0_0_#991b1b]'} transition-all animation-slide-up"
				>
					{#if testResult.success}
						<div class="flex items-center gap-4 mb-3 pb-3 border-b-2 border-green-200/50">
							<div
								class="w-10 h-10 rounded-lg bg-white border-[3px] border-gray-900 flex items-center justify-center text-lg"
							>
								<svg
									class="w-6 h-6 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<div>
								<p class="font-black text-green-900 text-sm uppercase tracking-wide">
									Connection Successful
								</p>
								{#if testResult.duration}
									<p class="text-xs font-bold text-green-700">
										Response time: {testResult.duration}ms
									</p>
								{/if}
							</div>
						</div>
						<div class="bg-black rounded-lg p-4 max-h-48 overflow-auto border-2 border-gray-800">
							<pre class="text-xs font-mono text-[#4ade80] whitespace-pre-wrap">{JSON.stringify(
									testResult.data,
									null,
									2
								)}</pre>
						</div>
					{:else}
						<div class="flex items-start gap-3">
							<div
								class="w-8 h-8 rounded-full bg-[#ff6b6b] flex items-center justify-center border-2 border-[#991b1b] flex-shrink-0"
							>
								<svg
									class="w-5 h-5 text-[#7f1d1d]"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</div>
							<div>
								<p class="font-black text-red-900 text-sm uppercase tracking-wide mb-1">
									Connection Failed
								</p>
								<p
									class="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded inline-block border border-red-200"
								>
									{testResult.error}
								</p>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Actions -->
	<div class="flex justify-end gap-4 pt-6 mt-6 border-t-[3px] border-gray-900">
		<button
			class="px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-xs uppercase tracking-wide rounded-lg border-[2px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center gap-2"
			on:click={handleNext}
			disabled={!canProceed}
		>
			Next Step
			<svg
				class="w-4 h-4 transition-transform group-hover:translate-x-1"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="3"
					d="M14 5l7 7m0 0l-7 7m7-7H3"
				/></svg
			>
		</button>
	</div>
</div>
