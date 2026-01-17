<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getTemplateById, getTemplateVariables, renderTemplate } from '../../../../../api/template';
	import { toast } from '../../../../../store/toast.store';
	import Loader from '$lib/components/Loader.svelte';
	import RenderForm from '$lib/components/render/RenderForm.svelte';
	import RenderPreview from '$lib/components/render/RenderPreview.svelte';

	let template = null;
	let variables = [];
	let variableValues = {};
	let isLoading = true;
	let isRendering = false;
	let renderResult = null;
	let renderError = null;

	// Race condition prevention
	let renderInProgress = false;
	let currentRenderVersion = 0;
	let currentLoadVersion = 0;

	$: uid = $page.params.uid;

	const loadTemplate = async () => {
		const thisLoadVersion = ++currentLoadVersion;
		isLoading = true;

		try {
			const [templateRes, variablesRes] = await Promise.all([
				getTemplateById(uid),
				getTemplateVariables(uid)
			]);

			// Check if this load is still current
			if (thisLoadVersion !== currentLoadVersion) return;

			if (!templateRes?.template) {
				toast.set({ message: 'Template not found', type: 'error', duration: 3000 });
				goto('/dashboard/template');
				return;
			}

			template = templateRes.template;
			variables = variablesRes?.variables || [];

			// Initialize variable values with defaults
			variableValues = {};
			for (const v of variables) {
				variableValues[v.name] = v.defaultValue || '';
			}
		} catch (error) {
			// Check if this load is still current
			if (thisLoadVersion !== currentLoadVersion) return;

			console.error('Error loading template:', error);
			toast.set({ message: 'Failed to load template', type: 'error', duration: 3000 });
		} finally {
			if (thisLoadVersion === currentLoadVersion) {
				isLoading = false;
			}
		}
	};

	const handleRender = async () => {
		// Double-click protection
		if (renderInProgress) return;
		renderInProgress = true;

		const thisRenderVersion = ++currentRenderVersion;
		isRendering = true;
		renderError = null;

		try {
			const result = await renderTemplate(uid, variableValues, {
				format: template?.outputFormat === 'pdf' ? 'pdf' : 'png',
				quality: 0.9
			});

			// Check if this render is still current
			if (thisRenderVersion !== currentRenderVersion) return;

			renderResult = result;
		} catch (error) {
			// Check if this render is still current
			if (thisRenderVersion !== currentRenderVersion) return;

			console.error('Render error:', error);
			renderError = error.message || 'Failed to render template';
			toast.set({ message: renderError, type: 'error', duration: 3000 });
		} finally {
			if (thisRenderVersion === currentRenderVersion) {
				isRendering = false;
				renderInProgress = false;
			}
		}
	};

	const handleVariableChange = (event) => {
		const { name, value } = event.detail;
		variableValues = { ...variableValues, [name]: value };
	};

	const handleJsonImport = (event) => {
		const { values } = event.detail;
		variableValues = { ...variableValues, ...values };
	};

	const handleDownload = () => {
		if (!renderResult?.url) return;

		const link = document.createElement('a');
		link.href = renderResult.url;
		link.download = `${template?.name || 'render'}.${renderResult.format || 'png'}`;
		link.target = '_blank';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const copyUrl = () => {
		if (!renderResult?.url) return;
		navigator.clipboard.writeText(renderResult.url);
		toast.set({ message: 'URL copied to clipboard', type: 'success', duration: 2000 });
	};

	const generateApiCode = () => {
		const code = `// Render template via API
const response = await fetch('${import.meta.env.VITE_BACKEND_URL || ''}/templates/${uid}/render', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_TOKEN'
  },
  body: JSON.stringify({
    variables: ${JSON.stringify(variableValues, null, 2)},
    format: '${template?.outputFormat === 'pdf' ? 'pdf' : 'png'}',
    quality: 0.9
  })
});

const result = await response.json();
console.log(result.url); // CDN URL of rendered image`;

		navigator.clipboard.writeText(code);
		toast.set({ message: 'API code copied to clipboard', type: 'success', duration: 2000 });
	};

	onMount(() => {
		loadTemplate();
	});

	onDestroy(() => {
		// Invalidate any in-flight loads and renders
		currentLoadVersion++;
		currentRenderVersion++;
	});
</script>

<section class="min-h-full">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
		<div>
			<button
				class="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 mb-3 transition-colors"
				on:click={() => goto('/dashboard/template')}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
				</svg>
				Back to Templates
			</button>
			<div class="inline-flex items-center gap-2 px-3 py-1 bg-[#4ecdc4] text-white text-xs font-bold uppercase tracking-widest rounded mb-3 ml-4">
				<span class="w-2 h-2 bg-white rounded-full"></span>
				Param Render
			</div>
			<h1 class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">
				{#if template}
					{template.name}
				{:else}
					Loading...
				{/if}
			</h1>
			<p class="text-sm text-gray-500 mt-2 font-medium">
				Supply variable values and render on-demand
			</p>
		</div>

		<!-- Mode Tabs -->
		<div class="flex gap-2">
			<button
				class="px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 border-gray-900 rounded-lg transition-all bg-gray-100 text-gray-400 cursor-not-allowed"
				disabled
			>
				Edit
			</button>
			<button
				class="px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 border-gray-900 rounded-lg transition-all bg-[#4ecdc4] text-white shadow-[3px_3px_0_0_#1f2937]"
			>
				Render
			</button>
			<button
				class="px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 border-gray-900 rounded-lg transition-all bg-white hover:bg-gray-50"
				on:click={() => goto(`/dashboard/template/${uid}/dynamic`)}
			>
				Dynamic
			</button>
		</div>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-20">
			<Loader size="16" show={true} />
		</div>
	{:else if template}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Left: Variable Form -->
			<div class="bg-white border-3 border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937] p-6">
				<h2 class="text-lg font-black text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
					</svg>
					Variables
				</h2>

				<RenderForm
					{variables}
					{variableValues}
					on:change={handleVariableChange}
					on:jsonImport={handleJsonImport}
				/>

				<div class="flex flex-col sm:flex-row gap-3 mt-6">
					<button
						class="flex-1 bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-black py-3 px-6 rounded-xl border-3 border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						on:click={handleRender}
						disabled={isRendering}
					>
						{#if isRendering}
							<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Rendering...
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
							Render
						{/if}
					</button>
					<button
						class="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 px-4 rounded-xl border-2 border-gray-300 transition-all text-sm uppercase tracking-wide"
						on:click={generateApiCode}
						title="Copy API code"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
						</svg>
					</button>
				</div>
			</div>

			<!-- Right: Preview -->
			<div class="bg-white border-3 border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937] p-6">
				<h2 class="text-lg font-black text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
					</svg>
					Preview
				</h2>

				<RenderPreview
					{renderResult}
					{renderError}
					{isRendering}
					templateThumbnail={template?.thumbnail}
					on:download={handleDownload}
					on:copyUrl={copyUrl}
				/>
			</div>
		</div>
	{/if}
</section>

<style>
	.border-3 {
		border-width: 3px;
	}
</style>
