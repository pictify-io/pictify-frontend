<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getTemplateById, getTemplateVariables } from '../../../../../api/template';
	import {
		getBindingsForTemplate,
		createBinding,
		updateBinding,
		deleteBinding,
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
	import WizardStepper from '$lib/components/dashboard/WizardStepper.svelte';
	import ModeTabs from '$lib/components/dashboard/ModeTabs.svelte';
	import { FeatureUpgradePrompt } from '$lib/components/plg';
	import { ConfirmModal } from '$lib/components/billing';
	import {
		checkFeatureAccessSync,
		FEATURES,
		getFeatureUpgradePrompt
	} from '../../../../../store/plg.store';

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
	let isEditing = false;
	let isDeleting = false;
	let isUpdating = false;
	let showDeleteModal = false;

	// Feature gating for Dynamic Links
	$: dynamicLinksAccess = checkFeatureAccessSync(FEATURES.DYNAMIC_LINKS);
	$: hasDynamicLinksAccess = dynamicLinksAccess?.hasAccess ?? false;
	$: dynamicLinksUpgradePrompt = getFeatureUpgradePrompt(FEATURES.DYNAMIC_LINKS);

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
			// Use Promise.allSettled for graceful degradation - page can load even if some calls fail
			const [templateRes, variablesRes, bindingsRes, dataSourcesRes] = await Promise.allSettled([
				getTemplateById(uid),
				getTemplateVariables(uid),
				getBindingsForTemplate(uid),
				getDataSources()
			]);

			// Check if component is still mounted and this is still the current load
			if (!mounted || thisLoad !== loadVersion) return;

			// Template is required - fail if not available
			if (templateRes.status === 'rejected' || !templateRes.value?.template) {
				toast.set({ message: 'Template not found', type: 'error', duration: 3000 });
				goto('/dashboard/template');
				return;
			}

			template = templateRes.value.template;
			variables = variablesRes.status === 'fulfilled' ? variablesRes.value?.variables || [] : [];
			existingBindings =
				bindingsRes.status === 'fulfilled' ? bindingsRes.value?.bindings || [] : [];
			dataSources =
				dataSourcesRes.status === 'fulfilled' ? dataSourcesRes.value?.dataSources || [] : [];

			// Log warnings for partial failures
			if (variablesRes.status === 'rejected') {
				console.warn('Failed to load variables:', variablesRes.reason);
			}
			if (bindingsRes.status === 'rejected') {
				console.warn('Failed to load bindings:', bindingsRes.reason);
			}
			if (dataSourcesRes.status === 'rejected') {
				console.warn('Failed to load data sources:', dataSourcesRes.reason);
			}

			// If there's an existing binding, load it
			if (existingBindings.length > 0) {
				const binding = existingBindings[0];
				publishedBinding = binding;
				// Try to find matching data source by ID first, then by URL if binding has embedded dataSource
				selectedDataSource =
					dataSources.find((ds) => ds.uid === binding.dataSourceId) ||
					dataSources.find((ds) => ds.url === binding.dataSource?.url) ||
					null;
				// If no matching data source found but binding has embedded dataSource, use it directly
				if (!selectedDataSource && binding.dataSource && binding.dataSource.url) {
					// Create a virtual data source from the embedded config for editing
					newDataSource = {
						name: binding.dataSource.name || 'Data Source',
						type: binding.dataSource.type || 'http',
						url: binding.dataSource.url || '',
						method: binding.dataSource.method || 'GET',
						headers: binding.dataSource.headers || {}
					};
				}
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
			const dataSourceForBinding = dataSourceToUse
				? {
						type: dataSourceToUse.type || 'http',
						url: dataSourceToUse.url,
						method: dataSourceToUse.method || 'GET',
						headers: dataSourceToUse.headers || {}
				  }
				: {
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
			toast.set({ message: 'Live asset published!', type: 'success', duration: 3000 });

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

	// Edit binding - enters edit mode with existing binding data
	const handleEditBinding = () => {
		if (!publishedBinding) return;
		isEditing = true;
		activeTab = 'datasource';
		toast.set({ message: 'Editing binding - make changes and save', type: 'info', duration: 2000 });
	};

	// Update existing binding
	const handleUpdateBinding = async () => {
		if (!publishedBinding || isUpdating) return;
		isUpdating = true;

		try {
			// Build updated binding data - use selectedDataSource if available, otherwise use newDataSource
			let dataSourceForBinding;
			if (selectedDataSource) {
				dataSourceForBinding = {
					type: selectedDataSource.type || 'http',
					url: selectedDataSource.url,
					method: selectedDataSource.method || 'GET',
					headers: selectedDataSource.headers || {}
				};
			} else if (newDataSource.url) {
				dataSourceForBinding = {
					type: newDataSource.type || 'http',
					url: newDataSource.url,
					method: newDataSource.method || 'GET',
					headers: newDataSource.headers || {}
				};
			} else {
				dataSourceForBinding = { type: 'static' };
			}

			const updates = {
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

			const result = await updateBinding(publishedBinding.uid, updates);

			if (!mounted) return;

			publishedBinding = result.binding || result;
			isEditing = false;
			activeTab = 'publish';
			toast.set({ message: 'Binding updated successfully!', type: 'success', duration: 3000 });

			analytics.trackFeatureUsed({ feature_name: 'dynamic_binding_updated', context: uid });
		} catch (error) {
			if (!mounted) return;
			toast.set({ message: `Update failed: ${error.message}`, type: 'error', duration: 3000 });
		} finally {
			if (mounted) {
				isUpdating = false;
			}
		}
	};

	// Show delete confirmation modal
	const handleDeleteBinding = () => {
		if (!publishedBinding || isDeleting) return;
		showDeleteModal = true;
	};

	// Actually delete binding after confirmation
	const confirmDeleteBinding = async () => {
		if (!publishedBinding || isDeleting) return;

		isDeleting = true;
		showDeleteModal = false;

		// Capture the uid BEFORE setting publishedBinding to null
		const bindingUid = publishedBinding.uid;

		try {
			await deleteBinding(bindingUid);

			if (!mounted) return;

			// Reset state - use captured uid for filtering
			existingBindings = existingBindings.filter((b) => b.uid !== bindingUid);
			publishedBinding = null;
			selectedDataSource = null;
			isEditing = false;
			activeTab = 'datasource';

			// Reset form
			mapping = {};
			defaults = {};
			newDataSource = { name: '', type: 'http', url: '', method: 'GET', headers: {} };
			refreshPolicy = { ttlSeconds: 300, onError: 'serve_stale' };
			outputConfig = { format: 'png', quality: 90 };

			toast.set({ message: 'Binding deleted successfully', type: 'success', duration: 3000 });

			analytics.trackFeatureUsed({ feature_name: 'dynamic_binding_deleted', context: uid });
		} catch (error) {
			if (!mounted) return;
			toast.set({ message: `Delete failed: ${error.message}`, type: 'error', duration: 3000 });
		} finally {
			if (mounted) {
				isDeleting = false;
			}
		}
	};

	// Cancel delete
	const cancelDeleteBinding = () => {
		showDeleteModal = false;
	};

	// Cancel editing
	const handleCancelEdit = () => {
		isEditing = false;
		activeTab = 'publish';
		// Reload original binding data
		if (publishedBinding) {
			mapping = publishedBinding.mapping || {};
			defaults = publishedBinding.defaults || {};
			refreshPolicy = publishedBinding.refreshPolicy || { ttlSeconds: 300, onError: 'serve_stale' };
			outputConfig = publishedBinding.outputConfig || { format: 'png', quality: 90 };
		}
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
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="3"
						d="M15 19l-7-7 7-7"
					/></svg
				>
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
				<div
					class="px-2 py-1 bg-[#3b82f6] text-white border-[2px] border-gray-900 rounded text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000]"
				>
					Live Mode
				</div>
			</div>
			<p class="text-gray-600 font-bold mt-2 text-sm sm:text-base max-w-2xl">
				Connect a data source and deploy as a live, auto-updating asset.
			</p>
		</div>

		<!-- Mode Tabs -->
		<ModeTabs activeMode="dynamic" {uid} />
	</div>

	<div>
		{#if isLoading}
			<div class="flex items-center justify-center py-32">
				<Loader size="16" show={true} />
			</div>
		{:else if !hasDynamicLinksAccess}
			<!-- Feature gated - show upgrade prompt -->
			<div class="max-w-2xl mx-auto">
				<FeatureUpgradePrompt
					feature={FEATURES.DYNAMIC_LINKS}
					currentPlan={dynamicLinksAccess.currentPlan}
					targetPlan={dynamicLinksUpgradePrompt?.targetPlan}
					variant="card"
					show={true}
					onDismiss={() => goto(`/dashboard/template/${uid}/render`)}
				/>
			</div>
		{:else if template}
			<!-- Progress Tabs -->
			<WizardStepper
				steps={[
					{ id: 'datasource', label: 'Data Source' },
					{ id: 'mapping', label: 'Mapping' },
					{ id: 'refresh', label: 'Refresh' },
					{ id: 'publish', label: 'Publish' }
				]}
				currentStep={activeTab}
				on:step={(e) => (activeTab = e.detail)}
			/>

			<!-- Tab Content -->
			<!-- Tab Content -->
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937]">
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
						on:updateNew={(e) => (newDataSource = { ...newDataSource, ...e.detail })}
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
						{isEditing}
						{isUpdating}
						{isDeleting}
						on:publish={isEditing ? handleUpdateBinding : handlePublish}
						on:edit={handleEditBinding}
						on:delete={handleDeleteBinding}
						on:cancelEdit={handleCancelEdit}
						on:back={() => goToTab('refresh')}
					/>
				{/if}
			</div>
		{/if}
	</div>
</section>

<!-- Delete Confirmation Modal -->
<ConfirmModal
	open={showDeleteModal}
	title="Delete Live Binding"
	description="Are you sure you want to delete this live binding? This will remove the live URL and cannot be undone."
	confirmText="Delete Binding"
	cancelText="Cancel"
	variant="danger"
	loading={isDeleting}
	on:confirm={confirmDeleteBinding}
	on:cancel={cancelDeleteBinding}
/>
