<script>
	import { onMount } from 'svelte';
	import {
		getConnectorConfigs,
		createConnectorConfig,
		deleteConnectorConfig,
		testConnectorConfig,
		getCredentialRequirements,
		STORAGE_PROVIDERS
	} from '../../../../api/integrations';
	import Loader from '$lib/components/Loader.svelte';
	import FeatureGate from '$lib/components/plg/FeatureGate.svelte';
	import { toast } from '../../../../store/toast.store';
	import { FEATURES, checkFeatureAccessSync } from '../../../../store/plg.store';
	import { openUpgradeModal } from '../../../../store/upgrade-modal.store';

	$: featureAccess = checkFeatureAccessSync(FEATURES.STORAGE_CONNECTORS);
	$: hasStorageAccess = featureAccess?.hasAccess ?? false;

	// Provider Icons
	const PROVIDER_ICONS = {
		s3: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', // Cube/Box structure
		gcs: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z', // Cloud
		cloudinary:
			'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', // Image
		imagekit:
			'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', // Image (reuses same for now)
		default: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
	};

	let connectors = [];
	let loading = true;
	let error = null;
	let showCreateModal = false;
	let testingId = null;

	// Form state
	let selectedProvider = null;
	let credentialRequirements = null;
	let newConnector = {
		type: '',
		name: '',
		credentials: {},
		config: {}
	};
	let creating = false;
	let createError = null;

	onMount(async () => {
		await loadConnectors();
	});

	async function loadConnectors() {
		loading = true;
		error = null;
		try {
			const response = await getConnectorConfigs();
			connectors = response.connectors || [];
		} catch (err) {
			error = err.message || 'Failed to load connectors';
		} finally {
			loading = false;
		}
	}

	async function selectProvider(provider) {
		selectedProvider = provider;
		newConnector.type = provider.value;
		newConnector.name = `My ${provider.label}`;

		try {
			const requirements = await getCredentialRequirements(provider.value);
			credentialRequirements = requirements;
			// Initialize empty credentials
			newConnector.credentials = {};
			for (const key of Object.keys(requirements.credentials || {})) {
				newConnector.credentials[key] = '';
			}
			// Initialize empty config
			newConnector.config = {};
			for (const [key, opts] of Object.entries(requirements.configOptions || {})) {
				newConnector.config[key] = '';
			}
		} catch (err) {
			createError = 'Failed to load provider requirements';
		}
	}

	async function handleCreate() {
		creating = true;
		createError = null;

		try {
			const response = await createConnectorConfig(newConnector);
			connectors = [response.connector, ...connectors];
			closeModal();
		} catch (err) {
			createError = err.message || 'Failed to create connector';
		} finally {
			creating = false;
		}
	}

	async function handleDelete(uid) {
		if (!confirm('Are you sure you want to delete this storage connector?')) return;

		try {
			await deleteConnectorConfig(uid);
			connectors = connectors.filter((c) => c.uid !== uid);
		} catch (err) {
			toast.set({ message: 'Failed to delete connector', type: 'error', duration: 3000 });
		}
	}

	async function handleTest(uid) {
		testingId = uid;
		try {
			const result = await testConnectorConfig(uid);
			if (result.success) {
				toast.set({ message: 'Connection successful!', type: 'success', duration: 2000 });
				// Update status in list
				connectors = connectors.map((c) => (c.uid === uid ? { ...c, status: 'active' } : c));
			} else {
				toast.set({ message: 'Connection test failed', type: 'error', duration: 3000 });
				connectors = connectors.map((c) =>
					c.uid === uid ? { ...c, status: 'error', lastError: result.message } : c
				);
			}
		} catch (err) {
			toast.set({ message: 'Connection test failed', type: 'error', duration: 3000 });
		} finally {
			testingId = null;
		}
	}

	function closeModal() {
		showCreateModal = false;
		selectedProvider = null;
		credentialRequirements = null;
		createError = null;
		newConnector = {
			type: '',
			name: '',
			credentials: {},
			config: {}
		};
	}

	function getStatusColor(status) {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800 border-green-300';
			case 'invalid':
				return 'bg-red-100 text-red-800 border-red-300';
			case 'error':
				return 'bg-yellow-100 text-yellow-800 border-yellow-300';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-300';
		}
	}

	function getProviderInfo(type) {
		return STORAGE_PROVIDERS.find((p) => p.value === type) || { label: type };
	}

	const MOCK_CONNECTORS = [
		{
			uid: 'mock-1',
			type: 's3',
			name: 'Production Assets',
			status: 'active',
			config: { bucket: 'pictify-assets-prod' }
		},
		{
			uid: 'mock-2',
			type: 'gcs',
			name: 'Backup Archive',
			status: 'active',
			config: { bucket: 'backup-v2-2024' }
		}
	];
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-end mb-6">
		<button
			on:click={() => {
				if (hasStorageAccess) showCreateModal = true;
			}}
			class="px-4 py-2 text-sm font-black text-white bg-gray-900 rounded-lg border-2 border-gray-900 shadow-[3px_3px_0_0_#ffc480] hover:shadow-[1px_1px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={!hasStorageAccess}
		>
			{hasStorageAccess ? '+ Add Connector' : 'Locked'}
		</button>
	</div>

	<FeatureGate feature={FEATURES.STORAGE_CONNECTORS}>
		{#if !hasStorageAccess}
			<!-- Mock Data for Blurred Backdrop -->
			<div
				class="grid grid-cols-1 md:grid-cols-2 gap-4 select-none opacity-50 grayscale transition-all duration-500"
			>
				{#each MOCK_CONNECTORS as connector}
					<div
						class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] p-4"
					>
						<div class="flex items-start justify-between mb-3">
							<div class="flex items-center gap-3">
								<span
									class="w-10 h-10 flex items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-700"
								>
									<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d={PROVIDER_ICONS[connector.type] || PROVIDER_ICONS.default}
										/>
									</svg>
								</span>
								<div>
									<h3 class="font-bold text-gray-900">{connector.name}</h3>
									<p class="text-xs text-gray-500">{getProviderInfo(connector.type).label}</p>
								</div>
							</div>
							<span
								class="px-2 py-0.5 text-xs font-bold rounded-full border {getStatusColor(
									connector.status
								)}"
							>
								{connector.status}
							</span>
						</div>
						{#if connector.config?.bucket}
							<p class="text-sm text-gray-600 mb-2">
								<span class="font-medium">Bucket:</span>
								{connector.config.bucket}
							</p>
						{/if}
						{#if connector.config?.cloudName}
							<p class="text-sm text-gray-600 mb-2">
								<span class="font-medium">Cloud:</span>
								{connector.config.cloudName}
							</p>
						{/if}
						{#if connector.lastError}
							<p class="text-xs text-red-600 mb-2 truncate flex items-center gap-1">
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/></svg
								>{connector.lastError}
							</p>
						{/if}
						<div class="flex items-center gap-2 mt-4 opacity-50">
							<button
								class="flex-1 px-3 py-2 text-xs font-bold text-gray-400 bg-gray-50 rounded-lg border border-gray-200"
								>Test Connection</button
							>
							<button class="p-2 text-gray-300 border border-transparent"
								><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/></svg
								></button
							>
						</div>
					</div>
				{/each}
			</div>
		{:else if loading}
			<div class="flex justify-center py-12">
				<Loader />
			</div>
		{:else if error}
			<div class="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600">
				{error}
			</div>
		{:else if connectors.length === 0}
			<div
				class="text-center py-12 bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
			>
				<div
					class="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-xl border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] flex items-center justify-center"
				>
					<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
						/>
					</svg>
				</div>
				<p class="text-gray-900 font-black text-lg">No storage connectors yet</p>
				<p class="text-sm text-gray-600 mt-1 mb-4 font-medium">
					Connect your S3, Google Cloud Storage, Cloudinary, or ImageKit account
				</p>
				<button
					on:click={() => (showCreateModal = true)}
					class="px-5 py-2 text-xs font-bold text-gray-900 bg-[#ffc480] rounded-lg border-2 border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-widest"
				>
					Add Connector
				</button>
			</div>
		{:else}
			<!-- Connectors Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each connectors as connector}
					<div
						class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] p-4"
					>
						<div class="flex items-start justify-between mb-3">
							<div class="flex items-center gap-3">
								<span
									class="w-10 h-10 flex items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-700"
								>
									<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d={PROVIDER_ICONS[connector.type] || PROVIDER_ICONS.default}
										/>
									</svg>
								</span>
								<div>
									<h3 class="font-bold text-gray-900">{connector.name}</h3>
									<p class="text-xs text-gray-500">{getProviderInfo(connector.type).label}</p>
								</div>
							</div>
							<span
								class="px-2 py-0.5 text-xs font-bold rounded-full border {getStatusColor(
									connector.status
								)}"
							>
								{connector.status}
							</span>
						</div>

						{#if connector.config?.bucket}
							<p class="text-sm text-gray-600 mb-2">
								<span class="font-medium">Bucket:</span>
								{connector.config.bucket}
							</p>
						{/if}
						{#if connector.config?.cloudName}
							<p class="text-sm text-gray-600 mb-2">
								<span class="font-medium">Cloud:</span>
								{connector.config.cloudName}
							</p>
						{/if}

						{#if connector.lastError}
							<p
								class="text-xs text-red-600 mb-2 truncate flex items-center gap-1"
								title={connector.lastError}
							>
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/></svg
								>
								{connector.lastError}
							</p>
						{/if}

						<div class="flex items-center gap-2 mt-4">
							<button
								on:click={() => handleTest(connector.uid)}
								disabled={testingId === connector.uid}
								class="flex-1 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
							>
								{testingId === connector.uid ? 'Testing...' : 'Test Connection'}
							</button>
							<button
								on:click={() => handleDelete(connector.uid)}
								class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
								title="Delete"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</FeatureGate>
</div>

<!-- Create Modal -->
{#if showCreateModal}
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="connector-modal-title"
		on:keydown={(e) => e.key === 'Escape' && closeModal()}
	>
		<div
			class="bg-[#FFFDF8] rounded-xl border-[3px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] max-w-lg w-full max-h-[90vh] overflow-y-auto relative overflow-hidden"
		>
			<!-- Header Strip -->
			<div
				class="absolute top-0 left-0 w-full h-1.5 bg-[#4ade80] border-b-[3px] border-gray-900 z-10"
			/>
			<!-- Decorative bg pattern -->
			<div
				class="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]"
			/>

			<div class="p-6 relative z-10">
				<div class="flex items-center justify-between mb-8 mt-2">
					<h3
						id="connector-modal-title"
						class="text-xl font-black text-gray-900 uppercase tracking-tight"
					>
						{selectedProvider ? `Configure ${selectedProvider.label}` : 'Add Storage Connector'}
					</h3>
					<button
						on:click={closeModal}
						class="p-1.5 hover:bg-black/10 rounded-lg text-gray-900 transition-colors"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{#if !selectedProvider}
					<!-- Provider Selection -->
					<div class="grid grid-cols-2 gap-3">
						{#each STORAGE_PROVIDERS as provider}
							<button
								on:click={() => selectProvider(provider)}
								class="p-4 border-[3px] border-gray-200 rounded-xl text-left hover:border-gray-900 hover:shadow-[4px_4px_0_0_#1f2937] transition-all bg-white"
							>
								<span
									class="w-8 h-8 mb-2 flex items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-700"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d={PROVIDER_ICONS[provider.value] || PROVIDER_ICONS.default}
										/>
									</svg>
								</span>
								<span class="font-bold text-gray-900 block">{provider.label}</span>
								<span class="text-xs text-gray-500">{provider.description}</span>
							</button>
						{/each}
					</div>
				{:else}
					<!-- Credentials Form -->
					<form on:submit|preventDefault={handleCreate} class="space-y-4">
						{#if createError}
							<div class="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
								{createError}
							</div>
						{/if}

						<!-- Security Notice -->
						<div
							class="bg-blue-50/50 border-[3px] border-blue-900 rounded-xl mb-6 overflow-hidden shadow-[4px_4px_0_0_#1e3a8a]"
						>
							<div class="p-4 border-b-[3px] border-blue-900 flex items-start gap-3 bg-blue-100">
								<svg
									class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
									/>
								</svg>
								<div>
									<h4 class="font-black text-blue-900 text-sm uppercase tracking-wide">
										Your credentials are secure
									</h4>
									<p class="text-xs text-blue-700 mt-1 leading-relaxed">
										Encrypted with AES-256-GCM authenticated encryption. Credentials are only
										decrypted server-side during uploads and are never exposed in responses.
									</p>
								</div>
							</div>

							<div class="p-4 bg-blue-100/30">
								<h5 class="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">
									Recommended setup:
								</h5>
								{#if selectedProvider.value === 's3'}
									<ol class="list-decimal list-outside ml-4 space-y-1">
										<li class="text-xs text-blue-800 pl-1">
											Create a dedicated IAM user for Pictify
										</li>
										<li class="text-xs text-blue-800 pl-1">
											Assign the <code
												class="bg-blue-100 px-1 rounded font-mono font-bold text-blue-900"
												>s3:PutObject</code
											> permission
										</li>
										<li class="text-xs text-blue-800 pl-1">
											Scope policies to your specific bucket only
										</li>
									</ol>
								{:else if selectedProvider.value === 'gcs'}
									<ol class="list-decimal list-outside ml-4 space-y-1">
										<li class="text-xs text-blue-800 pl-1">
											Create a dedicated Service Account for Pictify
										</li>
										<li class="text-xs text-blue-800 pl-1">
											Assign the <code
												class="bg-blue-100 px-1 rounded font-mono font-bold text-blue-900"
												>Storage Object Creator</code
											> role
										</li>
										<li class="text-xs text-blue-800 pl-1">
											Scope it to your specific bucket only
										</li>
									</ol>
								{:else}
									<ul class="list-disc list-outside ml-4 space-y-1">
										<li class="text-xs text-blue-800 pl-1">
											Use an API key with restricted scopes
										</li>
										<li class="text-xs text-blue-800 pl-1">
											Limit access to only what's needed for file uploads
										</li>
									</ul>
								{/if}
							</div>
						</div>

						<div>
							<label class="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
							<input
								type="text"
								bind:value={newConnector.name}
								required
								class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc480]"
							/>
						</div>

						<!-- Credentials -->
						{#if credentialRequirements?.credentials}
							<div class="border-t-2 border-gray-200 pt-4">
								<h4 class="text-sm font-bold text-gray-900 mb-3">Credentials</h4>
								{#each Object.entries(credentialRequirements.credentials) as [key, label]}
									<div class="mb-3">
										<label class="block text-sm font-medium text-gray-700 mb-1">{label}</label>
										{#if key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')}
											<input
												type="password"
												bind:value={newConnector.credentials[key]}
												required
												class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
											/>
										{:else}
											<input
												type="text"
												bind:value={newConnector.credentials[key]}
												required
												class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
											/>
										{/if}
									</div>
								{/each}
							</div>
						{/if}

						<!-- Config Options -->
						{#if credentialRequirements?.configOptions}
							<div class="border-t-2 border-gray-200 pt-4">
								<h4 class="text-sm font-bold text-gray-900 mb-3">Configuration</h4>
								{#each Object.entries(credentialRequirements.configOptions) as [key, opts]}
									<div class="mb-3">
										<label class="block text-sm font-medium text-gray-700 mb-1">
											{opts.description}
											{#if opts.required}<span class="text-red-500">*</span>{/if}
										</label>
										<input
											type="text"
											bind:value={newConnector.config[key]}
											required={opts.required}
											class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
										/>
									</div>
								{/each}
							</div>
						{/if}

						<div class="flex gap-3 pt-4">
							<button
								type="button"
								on:click={() => {
									selectedProvider = null;
									credentialRequirements = null;
								}}
								class="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-white rounded-xl border-[3px] border-gray-300 hover:border-gray-400 transition-colors"
							>
								Back
							</button>
							<button
								type="submit"
								disabled={creating}
								class="flex-1 px-4 py-3 text-sm font-bold text-white bg-[#ff6b6b] rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{creating ? 'Saving...' : 'Save Connector'}
							</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}
