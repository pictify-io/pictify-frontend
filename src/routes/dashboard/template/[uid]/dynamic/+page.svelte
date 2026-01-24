<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getTemplateById, getTemplateVariables } from '../../../../../api/template';
	import {
		getBindingsForTemplate,
		createBinding,
		getDataSources,
		createDataSource,
		testDataSource
	} from '../../../../../api/binding';
	import { toast } from '../../../../../store/toast.store';
	import Loader from '$lib/components/Loader.svelte';
	import DataSourceConfig from '$lib/components/dynamic/DataSourceConfig.svelte';
	import MappingEditor from '$lib/components/dynamic/MappingEditor.svelte';
	import RefreshStrategy from '$lib/components/dynamic/RefreshStrategy.svelte';
	import PublishPanel from '$lib/components/dynamic/PublishPanel.svelte';
	import { analytics } from '$lib/analytics.js';

	// Lifecycle cleanup flags
	let mounted = true;
	let loadVersion = 0;

	onDestroy(() => {
		mounted = false;
		loadVersion++; // Invalidate any pending loads
	});

	let template = null;
	let variables = [];
	let existingBindings = [];
	let dataSources = [];
	let isLoading = true;
	let activeTab = 'datasource'; // datasource, mapping, refresh, publish

	// Form state
	let selectedDataSource = null;
	let newDataSource = {
		name: '',
		type: 'http',
		url: '',
		method: 'GET',
		headers: {}
	};
	let testResult = null;
	let isTesting = false;

	// Mapping state
	let mapping = {};
	let defaults = {};

	// Refresh strategy
	let refreshPolicy = {
		ttlSeconds: 300,
		onError: 'serve_stale'
	};

	// Output config
	let outputConfig = {
		format: 'png',
		quality: 90
	};

	// Published binding
	let publishedBinding = null;
	let isPublishing = false;

	$: uid = $page.params.uid;

	// Re-load when UID changes (handles SvelteKit component reuse on route param change)
	$: if (uid && mounted) {
		// Reset state for new template to prevent showing stale data
		template = null;
		variables = [];
		existingBindings = [];
		selectedDataSource = null;
		testResult = null;
		mapping = {};
		defaults = {};
		publishedBinding = null;
		activeTab = 'datasource';
		// Load fresh data
		loadData();
		// Track page view
		analytics.trackDashboardPage({ page_name: 'template_dynamic', template_id: uid });
	}

	// Check if can proceed to next step
	$: canProceedToMapping = selectedDataSource || (newDataSource.name && newDataSource.url);
	$: canProceedToRefresh = Object.keys(mapping).length > 0 || variables.length === 0;
	$: canPublish = canProceedToMapping && (canProceedToRefresh || activeTab === 'publish');

	const loadData = async () => {
		const thisLoad = ++loadVersion;
		isLoading = true;

		try {
			const [templateRes, variablesRes, bindingsRes, dataSourcesRes] = await Promise.all([
				getTemplateById(uid),
				getTemplateVariables(uid),
				getBindingsForTemplate(uid),
				getDataSources()
			]);

			// Check if component is still mounted and this is still the current load
			if (!mounted || thisLoad !== loadVersion) return;

			if (!templateRes?.template) {
				toast.set({ message: 'Template not found', type: 'error', duration: 3000 });
				goto('/dashboard/template');
				return;
			}

			template = templateRes.template;
			variables = variablesRes?.variables || [];
			existingBindings = bindingsRes?.bindings || [];
			dataSources = dataSourcesRes?.dataSources || [];

			// If there's an existing binding, load it
			if (existingBindings.length > 0) {
				const binding = existingBindings[0];
				publishedBinding = binding;
				selectedDataSource = dataSources.find(ds => ds.uid === binding.dataSourceId);
				mapping = binding.mapping || {};
				defaults = binding.defaults || {};
				refreshPolicy = binding.refreshPolicy || { ttlSeconds: 300, onError: 'serve_stale' };
				outputConfig = binding.outputConfig || { format: 'png', quality: 90 };
				activeTab = 'publish';
			}

			// Initialize mapping for all variables
			for (const v of variables) {
				if (!mapping[v.name]) {
					mapping[v.name] = '';
				}
				if (!defaults[v.name] && v.defaultValue) {
					defaults[v.name] = v.defaultValue;
				}
			}
		} catch (error) {
			// Check if component is still mounted before setting error state
			if (!mounted || thisLoad !== loadVersion) return;
			console.error('Error loading data:', error);
			toast.set({ message: 'Failed to load data', type: 'error', duration: 3000 });
		} finally {
			if (mounted && thisLoad === loadVersion) {
				isLoading = false;
			}
		}
	};

	const handleTestDataSource = async () => {
		if (isTesting) return;
		isTesting = true;
		testResult = null;

		try {
			const sourceToTest = selectedDataSource || newDataSource;
			const result = await testDataSource(sourceToTest);

			// Check if component is still mounted before setting state
			if (!mounted) return;

			testResult = result;

			if (result.success) {
				toast.set({ message: 'Data source test successful', type: 'success', duration: 2000 });
			} else {
				toast.set({ message: `Test failed: ${result.error}`, type: 'error', duration: 3000 });
			}
		} catch (error) {
			// Check if component is still mounted before setting error state
			if (!mounted) return;
			testResult = { success: false, error: error.message };
			toast.set({ message: `Test failed: ${error.message}`, type: 'error', duration: 3000 });
		} finally {
			if (mounted) {
				isTesting = false;
			}
		}
	};

	// Track data source creation state for double-click prevention
	let isCreatingDataSource = false;

	const handleCreateDataSource = async () => {
		// Early guard to prevent double-clicks
		if (isCreatingDataSource) return;

		if (!newDataSource.name || !newDataSource.url) {
			toast.set({ message: 'Name and URL are required', type: 'error', duration: 2000 });
			return;
		}

		isCreatingDataSource = true;
		try {
			const created = await createDataSource(newDataSource);

			// Check if component is still mounted before setting state
			if (!mounted) return;

			dataSources = [...dataSources, created];
			selectedDataSource = created;
			toast.set({ message: 'Data source created', type: 'success', duration: 2000 });
			activeTab = 'mapping';
		} catch (error) {
			// Check if component is still mounted before setting error state
			if (!mounted) return;
			toast.set({ message: `Failed to create: ${error.message}`, type: 'error', duration: 3000 });
		} finally {
			if (mounted) {
				isCreatingDataSource = false;
			}
		}
	};

	const handleSelectDataSource = (ds) => {
		selectedDataSource = ds;
		testResult = null;
	};

	const handleMappingChange = (event) => {
		const { name, path, defaultValue } = event.detail;
		mapping = { ...mapping, [name]: path };
		if (defaultValue !== undefined) {
			defaults = { ...defaults, [name]: defaultValue };
		}
	};

	const handleRefreshPolicyChange = (event) => {
		refreshPolicy = event.detail;
	};

	const handleOutputConfigChange = (event) => {
		outputConfig = event.detail;
	};

	const handlePublish = async () => {
		if (isPublishing) return;
		isPublishing = true;

		try {
			// Create or save data source if it's new
			let dataSourceToUse = selectedDataSource;

			if (!dataSourceToUse && newDataSource.name && newDataSource.url) {
				const created = await createDataSource(newDataSource);

				// Check if component is still mounted before setting state
				if (!mounted) return;

				dataSources = [...dataSources, created.dataSource || created];
				dataSourceToUse = created.dataSource || created;
				selectedDataSource = dataSourceToUse;
			}

			// Build dataSource object for the binding
			const dataSourceForBinding = dataSourceToUse ? {
				type: dataSourceToUse.type || 'http',
				url: dataSourceToUse.url,
				method: dataSourceToUse.method || 'GET',
				headers: dataSourceToUse.headers || {}
			} : {
				type: 'static'
			};

			// Create binding with camelCase keys (matching backend API convention)
			const bindingData = {
				templateId: uid,
				dataSource: dataSourceForBinding,
				mapping,
				defaults,
				refreshPolicy: {
					type: 'ttl',
					ttlSeconds: refreshPolicy.ttlSeconds || 300,
					onError: refreshPolicy.onError || 'serve_stale'
				},
				outputConfig: {
					format: outputConfig.format || 'png',
					quality: outputConfig.quality || 90
				}
			};

			const result = await createBinding(bindingData);

			// Check if component is still mounted before setting state
			if (!mounted) return;

			publishedBinding = result.binding || result;
			activeTab = 'publish';
			toast.set({ message: 'Dynamic asset published!', type: 'success', duration: 3000 });

			// Track dynamic binding publish
			analytics.trackFeatureUsed({ feature_name: 'dynamic_binding_published', context: uid });
		} catch (error) {
			// Check if component is still mounted before setting error state
			if (!mounted) return;
			toast.set({ message: `Publish failed: ${error.message}`, type: 'error', duration: 3000 });
		} finally {
			if (mounted) {
				isPublishing = false;
			}
		}
	};

	const goToTab = (tab) => {
		activeTab = tab;
	};

	// Note: loadData is called reactively when uid changes (see reactive statement above)
	// onMount is no longer needed for initial load since the reactive $: if (uid && mounted) handles it
</script>

<section class="min-h-full pb-12">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
		<div>
			<button
				class="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:underline flex items-center gap-1 transition-colors mb-2"
				on:click={() => goto('/dashboard/template')}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
				Back to Templates
			</button>
			
			<div class="flex items-center gap-3">
				<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
					{#if template}
						{template.name}
					{:else}
						Loading...
					{/if}
				</h1>
				<div class="px-2 py-1 bg-[#a855f7] text-white border-[2px] border-gray-900 rounded text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000]">
					Dynamic Mode
				</div>
			</div>
			<p class="text-gray-600 font-bold mt-2 text-sm sm:text-base max-w-2xl">
				Connect a data source and deploy as a live, auto-updating asset.
			</p>
		</div>

		<!-- Mode Tabs -->
		<div class="flex bg-gray-100 p-1.5 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]">
			<button
				class="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all text-gray-400 cursor-not-allowed border-[2px] border-transparent"
				disabled
			>
				Editor
			</button>
			<button
				class="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all text-gray-600 hover:text-gray-900 hover:bg-white/50 border-[2px] border-transparent"
				on:click={() => goto(`/dashboard/template/${uid}/render`)}
			>
				Render
			</button>
			<button
				class="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all bg-[#a855f7] text-white border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937]"
			>
				Dynamic
			</button>
		</div>
	</div>

	<div>
		{#if isLoading}
			<div class="flex items-center justify-center py-32">
				<Loader size="16" show={true} />
			</div>
		{:else if template}
			<!-- Progress Tabs -->
			<div class="flex flex-wrap gap-4 mb-8">
				<button
					class="flex-1 min-w-[140px] px-4 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex flex-col items-center justify-center gap-2 border-[3px]
						{activeTab === 'datasource' 
							? 'bg-gray-900 text-white border-gray-900 shadow-[4px_4px_0_0_#9ca3af] translate-x-[-2px] translate-y-[-2px]' 
							: 'bg-white text-gray-400 border-gray-200 hover:border-gray-900 hover:text-gray-900'}"
					on:click={() => goToTab('datasource')}
				>
					<span class="w-6 h-6 rounded-full {activeTab === 'datasource' ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-400'} text-xs font-black flex items-center justify-center border-2 {activeTab === 'datasource' ? 'border-gray-900' : 'border-current'}">1</span>
					Data Source
				</button>
				
				<div class="hidden sm:flex items-center text-gray-300">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
				</div>

				<button
					class="flex-1 min-w-[140px] px-4 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex flex-col items-center justify-center gap-2 border-[3px]
						{activeTab === 'mapping' 
							? 'bg-gray-900 text-white border-gray-900 shadow-[4px_4px_0_0_#9ca3af] translate-x-[-2px] translate-y-[-2px]' 
							: canProceedToMapping ? 'bg-white text-gray-500 border-gray-200 hover:border-gray-900 hover:text-gray-900' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}"
					on:click={() => canProceedToMapping && goToTab('mapping')}
					disabled={!canProceedToMapping}
				>
					<span class="w-6 h-6 rounded-full {activeTab === 'mapping' ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-400'} text-xs font-black flex items-center justify-center border-2 {activeTab === 'mapping' ? 'border-gray-900' : 'border-current'}">2</span>
					Mapping
				</button>

				<div class="hidden sm:flex items-center text-gray-300">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
				</div>

				<button
					class="flex-1 min-w-[140px] px-4 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex flex-col items-center justify-center gap-2 border-[3px]
						{activeTab === 'refresh' 
							? 'bg-gray-900 text-white border-gray-900 shadow-[4px_4px_0_0_#9ca3af] translate-x-[-2px] translate-y-[-2px]' 
							: canProceedToRefresh ? 'bg-white text-gray-500 border-gray-200 hover:border-gray-900 hover:text-gray-900' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}"
					on:click={() => canProceedToRefresh && goToTab('refresh')}
					disabled={!canProceedToRefresh}
				>
					<span class="w-6 h-6 rounded-full {activeTab === 'refresh' ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-400'} text-xs font-black flex items-center justify-center border-2 {activeTab === 'refresh' ? 'border-gray-900' : 'border-current'}">3</span>
					Refresh
				</button>

				<div class="hidden sm:flex items-center text-gray-300">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
				</div>

				<button
					class="flex-1 min-w-[140px] px-4 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex flex-col items-center justify-center gap-2 border-[3px]
						{activeTab === 'publish' 
							? 'bg-gray-900 text-white border-gray-900 shadow-[4px_4px_0_0_#9ca3af] translate-x-[-2px] translate-y-[-2px]' 
							: 'bg-white text-gray-400 border-gray-200 hover:border-gray-900 hover:text-gray-900'}"
					on:click={() => goToTab('publish')}
				>
					<span class="w-6 h-6 rounded-full {activeTab === 'publish' ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-400'} text-xs font-black flex items-center justify-center border-2 {activeTab === 'publish' ? 'border-gray-900' : 'border-current'}">4</span>
					Publish
				</button>
			</div>

			<!-- Tab Content -->
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937] p-6 sm:p-8">
				{#if activeTab === 'datasource'}
					<DataSourceConfig
						{dataSources}
						{selectedDataSource}
						{newDataSource}
						{testResult}
						{isTesting}
						on:select={(e) => handleSelectDataSource(e.detail)}
						on:test={handleTestDataSource}
						on:create={handleCreateDataSource}
						on:updateNew={(e) => newDataSource = { ...newDataSource, ...e.detail }}
						on:next={() => goToTab('mapping')}
					/>
				{:else if activeTab === 'mapping'}
					<MappingEditor
						{variables}
						{mapping}
						{defaults}
						sampleData={testResult?.data}
						on:change={handleMappingChange}
						on:back={() => goToTab('datasource')}
						on:next={() => goToTab('refresh')}
					/>
				{:else if activeTab === 'refresh'}
					<RefreshStrategy
						{refreshPolicy}
						{outputConfig}
						on:refreshChange={handleRefreshPolicyChange}
						on:outputChange={handleOutputConfigChange}
						on:back={() => goToTab('mapping')}
						on:next={() => goToTab('publish')}
					/>
				{:else if activeTab === 'publish'}
					<PublishPanel
						{template}
						{publishedBinding}
						{mapping}
						{refreshPolicy}
						{outputConfig}
						{isPublishing}
						on:publish={handlePublish}
						on:back={() => goToTab('refresh')}
					/>
				{/if}
			</div>
		{/if}
	</div>
</section>
