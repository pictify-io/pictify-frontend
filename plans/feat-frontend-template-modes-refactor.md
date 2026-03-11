# feat: Frontend Template Modes Refactor

## Enhancement Summary

**Deepened on:** 2026-01-18
**Research agents used:** architecture-strategist, code-simplicity-reviewer, julik-frontend-races-reviewer, performance-oracle, security-sentinel, pattern-recognition-specialist

### Key Improvements from Research

1. **Simplify 3-step wizard to single-page with tabs** - Mirror existing VariablesPanel.svelte pattern
2. **Add race condition guards** - Cancel tokens for async operations
3. **Throw errors instead of returning null** - Proper error propagation in API layer
4. **Add double-click protection** - Synchronous guards before async work
5. **Use read-only store projections** - Prevent accidental template mutations

### Critical Issues Discovered

- Silent error swallowing in API layer masks failures
- onMount async chains need cancellation tokens
- No CSRF token handling (backend must use SameSite cookies)
- Potential XSS via @html directive - use proper escaping

---

## Overview

Refactor the Pictify frontend to separate three distinct modes: **Edit**, **Render**, and **Dynamic**. This follows the IDE pattern of Editor vs Runtime vs Monitoring, reducing cognitive load by ensuring designers stay in Edit, developers use Render, and product managers deploy with Dynamic.

**Key Principle:** Only Edit touches the FabricJS canvas. Render and Dynamic consume templates; they do not mutate them.

## Problem Statement

The current canvas editor is confusing because it mixes template editing with rendering and deployment concerns. Users must understand too many concepts in one place. The solution is to split functionality across dedicated pages:

1. **Template Dashboard** (`/dashboard/template`) - Entry point with clear action buttons
2. **Template Editor** (existing `/template-workspace/[uid]`) - FabricJS canvas for design
3. **Param Render** (`/dashboard/template/[uid]/render`) - On-demand rendering with form
4. **Dynamic Publishing** (`/dashboard/template/[uid]/dynamic`) - Live asset deployment

## Proposed Solution

### Route Architecture

```
src/routes/
├── dashboard/
│   └── template/
│       ├── +page.svelte                    # Template list (existing, modify)
│       └── [uid]/
│           ├── +page.svelte                # Template detail (existing)
│           ├── render/
│           │   └── +page.svelte            # NEW: Param Render page
│           └── dynamic/
│               └── +page.svelte            # NEW: Dynamic Publishing page
```

### Pages Overview

| Page               | Route                                | Purpose                                            | FabricJS? |
| ------------------ | ------------------------------------ | -------------------------------------------------- | --------- |
| Template List      | `/dashboard/template`                | Grid of templates with Edit/Render/Dynamic buttons | No        |
| Template Editor    | `/template-workspace/[format]/[uid]` | Canvas editing (existing)                          | Yes       |
| Param Render       | `/dashboard/template/[uid]/render`   | Form-based on-demand rendering                     | No        |
| Dynamic Publishing | `/dashboard/template/[uid]/dynamic`  | Data source binding & deployment                   | No        |

## Technical Approach

### Phase 1: Foundation - API Layer & Stores

Create the bindings API integration and stores.

#### Research Insights: API Layer

**Best Practices (from pattern-recognition-specialist):**

- **NEVER return null on error** - Throw errors so callers can distinguish "not found" from "network error"
- Follow the `auth.js` pattern which throws proper errors, not `template.js` which swallows them
- Use the action object pattern from `copilot.store.js` for consistency

**Performance Considerations (from performance-oracle):**

- Consider adding response caching with TTL in backend.js to reduce redundant API calls
- Make user/template loading non-blocking where possible

**Security Considerations (from security-sentinel):**

- Backend must use SameSite cookies for CSRF protection
- Avoid exposing real API tokens in generated code examples - use masked versions

#### 1.1 Create `/src/api/binding.js`

```javascript
// src/api/binding.js
// IMPORTANT: Throw errors, don't return null - callers need to know what failed
import backend from '../service/backend';

export const getBindings = async (params = {}) => {
	const query = new URLSearchParams(params).toString();
	return await backend.get(`/bindings?${query}`);
	// Let errors propagate - don't catch and return null
};

export const getBindingsByTemplate = async (templateUid) => {
	return getBindings({ template_id: templateUid });
};

export const getBinding = async (uid) => {
	try {
		return await backend.get(`/bindings/${uid}`);
	} catch (error) {
		console.error('getBinding error:', error);
		return null;
	}
};

export const createBinding = async (bindingData) => {
	try {
		return await backend.post('/bindings', bindingData);
	} catch (error) {
		console.error('createBinding error:', error);
		throw error;
	}
};

export const updateBinding = async (uid, bindingData) => {
	try {
		return await backend.put(`/bindings/${uid}`, bindingData);
	} catch (error) {
		console.error('updateBinding error:', error);
		throw error;
	}
};

export const deleteBinding = async (uid) => {
	try {
		return await backend.delete(`/bindings/${uid}`);
	} catch (error) {
		console.error('deleteBinding error:', error);
		throw error;
	}
};

export const testBinding = async (uid) => {
	try {
		return await backend.post(`/bindings/${uid}/test`);
	} catch (error) {
		console.error('testBinding error:', error);
		throw error;
	}
};

export const refreshBinding = async (uid) => {
	try {
		return await backend.post(`/bindings/${uid}/refresh`);
	} catch (error) {
		console.error('refreshBinding error:', error);
		throw error;
	}
};

export const pauseBinding = async (uid) => {
	try {
		return await backend.post(`/bindings/${uid}/pause`);
	} catch (error) {
		console.error('pauseBinding error:', error);
		throw error;
	}
};

export const resumeBinding = async (uid) => {
	try {
		return await backend.post(`/bindings/${uid}/resume`);
	} catch (error) {
		console.error('resumeBinding error:', error);
		throw error;
	}
};
```

#### 1.2 Create `/src/store/binding.store.js`

```javascript
// src/store/binding.store.js
import { writable, derived } from 'svelte/store';
import * as bindingApi from '../api/binding';

// Current binding being edited
export const currentBinding = writable(null);

// List of bindings for a template
export const bindings = writable([]);

// Loading states
export const bindingLoading = writable(false);

// Actions
export const bindingActions = {
	async loadForTemplate(templateUid) {
		bindingLoading.set(true);
		try {
			const response = await bindingApi.getBindingsByTemplate(templateUid);
			if (response?.bindings) {
				bindings.set(response.bindings);
			}
			return response;
		} finally {
			bindingLoading.set(false);
		}
	},

	async load(uid) {
		bindingLoading.set(true);
		try {
			const response = await bindingApi.getBinding(uid);
			if (response?.binding) {
				currentBinding.set(response.binding);
			}
			return response?.binding;
		} finally {
			bindingLoading.set(false);
		}
	},

	async create(bindingData) {
		const response = await bindingApi.createBinding(bindingData);
		if (response?.binding) {
			bindings.update((list) => [...list, response.binding]);
			currentBinding.set(response.binding);
		}
		return response?.binding;
	},

	async update(uid, bindingData) {
		const response = await bindingApi.updateBinding(uid, bindingData);
		if (response?.binding) {
			bindings.update((list) => list.map((b) => (b.uid === uid ? response.binding : b)));
			currentBinding.set(response.binding);
		}
		return response?.binding;
	},

	async delete(uid) {
		await bindingApi.deleteBinding(uid);
		bindings.update((list) => list.filter((b) => b.uid !== uid));
		currentBinding.set(null);
	},

	async test(uid) {
		return await bindingApi.testBinding(uid);
	},

	async refresh(uid) {
		return await bindingApi.refreshBinding(uid);
	},

	reset() {
		currentBinding.set(null);
		bindings.set([]);
	}
};

// Derived: has active binding
export const hasActiveBinding = derived(bindings, ($bindings) =>
	$bindings.some((b) => b.status === 'active')
);
```

### Phase 2: Param Render Page

Create the on-demand rendering page with auto-generated form.

#### Research Insights: Render Page

**Race Condition Prevention (from julik-frontend-races-reviewer):**

- Add cancellation token to onMount to prevent state updates after unmount
- Use synchronous guard before async render to prevent double-clicks
- The `disabled` attribute can be circumvented - add explicit `renderInProgress` flag

**Performance Considerations (from performance-oracle):**

- Variable form re-renders on every keystroke - acceptable for small forms
- Consider lazy loading ApiCodeGenerator component since it's hidden by default

**Simplification (from code-simplicity-reviewer):**

- RenderPreview and ApiCodeGenerator are simple enough to inline
- Consider combining into single page section rather than separate components
- The existing VariablesPanel.svelte handles similar functionality in 1762 lines with tabs

#### 2.1 Create `/src/routes/dashboard/template/[uid]/render/+page.svelte`

```svelte
<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getUser } from '../../../../../store/user.store';
	import { getTemplateAction, template } from '../../../../../store/template.store';
	import { renderTemplate } from '../../../../../api/template';
	import { addToast } from '../../../../../store/toast.store';
	import Loader from '$lib/components/Loader.svelte';
	import RenderForm from '$lib/components/render/RenderForm.svelte';
	import RenderPreview from '$lib/components/render/RenderPreview.svelte';
	import ApiCodeGenerator from '$lib/components/render/ApiCodeGenerator.svelte';

	let isLoading = true;
	let isRendering = false;
	let renderInProgress = false; // Synchronous double-click guard
	let variables = {};
	let renderedImage = null;
	let showApiCode = false;
	let canceled = false; // Race condition guard

	$: templateUid = $page.params.uid;
	$: variableDefinitions = $template?.variableDefinitions || [];

	onMount(async () => {
		// Race condition fix: track if component was unmounted during async ops
		canceled = false;

		const user = await getUser();
		if (canceled) return; // Component unmounted during getUser

		if (!user?.email) {
			goto('/login');
			return;
		}

		if (templateUid) {
			await getTemplateAction(templateUid);
			if (canceled) return; // Component unmounted during getTemplate
			initializeVariables();
		}
		isLoading = false;
	});

	onDestroy(() => {
		canceled = true; // Signal any in-flight async ops to abort
	});

	function initializeVariables() {
		variables = {};
		variableDefinitions.forEach((v) => {
			variables[v.name] = v.defaultValue || '';
		});
	}

	async function handleRender() {
		// Double-click protection: synchronous check before any async work
		if (renderInProgress) return;
		renderInProgress = true;

		isRendering = true;
		try {
			const response = await renderTemplate(templateUid, variables, {
				format: $template.outputFormat === 'pdf' ? 'pdf' : 'png'
			});
			if (canceled) return; // Component unmounted during render
			if (response?.url) {
				renderedImage = response;
				addToast({ type: 'success', message: 'Image rendered successfully!' });
			}
		} catch (error) {
			if (canceled) return;
			addToast({ type: 'error', message: error.message || 'Render failed' });
		} finally {
			renderInProgress = false;
			isRendering = false;
		}
	}

	async function handleDownload() {
		if (!renderedImage?.url) return;

		const link = document.createElement('a');
		link.href = renderedImage.url;
		link.download = `${$template.name || 'render'}.${renderedImage.format || 'png'}`;
		link.click();
	}
</script>

<svelte:head>
	<title>Render - {$template?.name || 'Template'} | Pictify</title>
</svelte:head>

{#if isLoading}
	<div class="flex h-screen items-center justify-center">
		<Loader show />
	</div>
{:else}
	<div class="min-h-screen bg-[#FFFDF8] p-6">
		<!-- Header -->
		<div class="max-w-7xl mx-auto mb-8">
			<div class="flex items-center justify-between">
				<div>
					<a
						href="/dashboard/template"
						class="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
					>
						← Back to Templates
					</a>
					<h1 class="text-3xl font-black text-gray-900">{$template?.name || 'Untitled'}</h1>
					<p class="text-gray-600 mt-1">Fill in the variables to generate your image</p>
				</div>
				<div class="flex gap-3">
					<button
						on:click={() => (showApiCode = !showApiCode)}
						class="px-4 py-2 bg-white border-[3px] border-gray-900 rounded-xl font-bold
                   shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937]
                   hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						{showApiCode ? 'Hide' : 'Show'} API Code
					</button>
					<a
						href="/template-workspace/{$template?.outputFormat === 'pdf'
							? 'pdf'
							: 'image'}/{templateUid}"
						class="px-4 py-2 bg-white border-[3px] border-gray-900 rounded-xl font-bold
                   shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937]
                   hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						Edit Template
					</a>
				</div>
			</div>
		</div>

		<div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Left: Form -->
			<div class="space-y-6">
				<div
					class="bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[6px_6px_0_0_#1f2937]"
				>
					<h2 class="text-xl font-black mb-4 uppercase">Variables</h2>

					{#if variableDefinitions.length === 0}
						<p class="text-gray-500 text-center py-8">
							This template has no variables defined.
							<a
								href="/template-workspace/{$template?.outputFormat === 'pdf'
									? 'pdf'
									: 'image'}/{templateUid}"
								class="text-[#ff6b6b] underline">Add variables in the editor</a
							>
						</p>
					{:else}
						<RenderForm {variableDefinitions} bind:values={variables} />
					{/if}
				</div>

				<div class="flex gap-4">
					<button
						on:click={handleRender}
						disabled={isRendering}
						class="flex-1 py-4 bg-[#ff6b6b] text-white font-black uppercase rounded-xl
                   border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937]
                   hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px]
                   transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isRendering ? 'Rendering...' : 'Render Image'}
					</button>

					{#if renderedImage}
						<button
							on:click={handleDownload}
							class="px-6 py-4 bg-[#4ade80] text-gray-900 font-black uppercase rounded-xl
                     border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937]
                     hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px]
                     transition-all"
						>
							Download
						</button>
					{/if}
				</div>
			</div>

			<!-- Right: Preview -->
			<div class="space-y-6">
				<RenderPreview {renderedImage} {isRendering} templateName={$template?.name} />

				{#if showApiCode}
					<ApiCodeGenerator {templateUid} {variables} format={$template?.outputFormat} />
				{/if}
			</div>
		</div>
	</div>
{/if}
```

#### 2.2 Create `/src/lib/components/render/RenderForm.svelte`

```svelte
<script>
	export let variableDefinitions = [];
	export let values = {};

	function getInputType(variable) {
		if (variable.type === 'image') return 'url';
		if (variable.name.toLowerCase().includes('color')) return 'color';
		if (variable.name.toLowerCase().includes('url')) return 'url';
		if (variable.name.toLowerCase().includes('email')) return 'email';
		return 'text';
	}
</script>

<div class="space-y-4">
	{#each variableDefinitions as variable}
		<div class="space-y-1">
			<label for={variable.name} class="block text-sm font-bold text-gray-900 uppercase">
				{variable.name}
				{#if variable.description}
					<span class="text-gray-500 font-normal normal-case ml-2">
						({variable.description})
					</span>
				{/if}
			</label>

			{#if variable.type === 'image'}
				<input
					type="url"
					id={variable.name}
					bind:value={values[variable.name]}
					placeholder={variable.defaultValue || 'https://example.com/image.png'}
					class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-xl font-medium
                 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:ring-offset-2"
				/>
			{:else if variable.type === 'text' && (variable.name
					.toLowerCase()
					.includes('description') || variable.name.toLowerCase().includes('bio'))}
				<textarea
					id={variable.name}
					bind:value={values[variable.name]}
					placeholder={variable.defaultValue || ''}
					rows="3"
					class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-xl font-medium
                 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:ring-offset-2 resize-none"
				/>
			{:else}
				<input
					type={getInputType(variable)}
					id={variable.name}
					bind:value={values[variable.name]}
					placeholder={variable.defaultValue || ''}
					class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-xl font-medium
                 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:ring-offset-2"
				/>
			{/if}
		</div>
	{/each}
</div>
```

#### 2.3 Create `/src/lib/components/render/RenderPreview.svelte`

```svelte
<script>
	export let renderedImage = null;
	export let isRendering = false;
	export let templateName = '';
</script>

<div
	class="bg-white border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[6px_6px_0_0_#1f2937]"
>
	<div class="px-6 py-4 border-b-[3px] border-gray-900 bg-gray-50">
		<h2 class="text-xl font-black uppercase">Preview</h2>
	</div>

	<div class="aspect-video relative bg-gray-100 flex items-center justify-center">
		{#if isRendering}
			<div class="absolute inset-0 bg-white/80 flex items-center justify-center">
				<div class="text-center">
					<div
						class="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"
					/>
					<p class="font-bold text-gray-600">Rendering...</p>
				</div>
			</div>
		{/if}

		{#if renderedImage?.url}
			<img
				src={renderedImage.url}
				alt={templateName || 'Rendered image'}
				class="max-w-full max-h-full object-contain"
			/>
		{:else}
			<div class="text-center text-gray-400">
				<svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
				<p class="font-bold">Fill in variables and click Render</p>
			</div>
		{/if}
	</div>

	{#if renderedImage}
		<div class="px-6 py-3 border-t-[3px] border-gray-900 bg-gray-50 text-sm">
			<div class="flex justify-between text-gray-600">
				<span>Format: <strong>{renderedImage.format?.toUpperCase() || 'PNG'}</strong></span>
				{#if renderedImage.width && renderedImage.height}
					<span>Size: <strong>{renderedImage.width} × {renderedImage.height}</strong></span>
				{/if}
			</div>
		</div>
	{/if}
</div>
```

#### 2.4 Create `/src/lib/components/render/ApiCodeGenerator.svelte`

```svelte
<script>
	import { PUBLIC_BACKEND_URL } from '$env/static/public';
	import { addToast } from '../../../../store/toast.store';

	export let templateUid = '';
	export let variables = {};
	export let format = 'png';

	let selectedLanguage = 'curl';

	const languages = [
		{ id: 'curl', name: 'cURL' },
		{ id: 'javascript', name: 'JavaScript' },
		{ id: 'python', name: 'Python' }
	];

	$: code = generateCode(selectedLanguage, templateUid, variables, format);

	function generateCode(lang, uid, vars, fmt) {
		const endpoint = `${PUBLIC_BACKEND_URL}/templates/${uid}/render`;
		const payload = { variables: vars, format: fmt };
		const jsonPayload = JSON.stringify(payload, null, 2);

		switch (lang) {
			case 'curl':
				return `curl -X POST '${endpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'Cookie: YOUR_SESSION_COOKIE' \\
  -d '${JSON.stringify(payload)}'`;

			case 'javascript':
				return `const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify(${jsonPayload})
});

const result = await response.json();
console.log(result.url);`;

			case 'python':
				return `import requests

response = requests.post(
    '${endpoint}',
    json=${jsonPayload.replace(/"/g, "'").replace(/\n/g, '\n    ')},
    cookies={'session': 'YOUR_SESSION_COOKIE'}
)

print(response.json()['url'])`;

			default:
				return '';
		}
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(code);
			addToast({ type: 'success', message: 'Code copied to clipboard!' });
		} catch {
			addToast({ type: 'error', message: 'Failed to copy' });
		}
	}
</script>

<div
	class="bg-white border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[6px_6px_0_0_#1f2937]"
>
	<div
		class="px-6 py-4 border-b-[3px] border-gray-900 bg-gray-50 flex items-center justify-between"
	>
		<h2 class="text-xl font-black uppercase">API Code</h2>
		<div class="flex gap-2">
			{#each languages as lang}
				<button
					on:click={() => (selectedLanguage = lang.id)}
					class="px-3 py-1 text-sm font-bold rounded-lg transition-all
                 {selectedLanguage === lang.id
						? 'bg-gray-900 text-white'
						: 'bg-white border-2 border-gray-300 hover:border-gray-900'}"
				>
					{lang.name}
				</button>
			{/each}
		</div>
	</div>

	<div class="relative">
		<pre class="p-6 bg-gray-900 text-gray-100 text-sm overflow-x-auto"><code>{code}</code></pre>
		<button
			on:click={copyToClipboard}
			class="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
			title="Copy to clipboard"
		>
			<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
				/>
			</svg>
		</button>
	</div>
</div>
```

### Phase 3: Dynamic Publishing Page

Create the dynamic publishing page with data source configuration and JSONPath mapping.

#### Research Insights: Dynamic Publishing

**Architectural Decision (from architecture-strategist):**

- **IMPORTANT**: Consider using tabs instead of 3-step wizard. The existing VariablesPanel.svelte uses `activeTab = 'list' | 'create' | 'test' | 'preview'` pattern which is simpler.
- Wizard adds navigation complexity, state persistence between steps, and back/forward handling
- Single-page with sections provides the same functionality with less code

**Simplification Option (from code-simplicity-reviewer):**

```svelte
<!-- Instead of 3-step wizard, use tabs: -->
<script>
	let activeTab = 'configure'; // 'configure' | 'test' | 'status'
</script>

{#if activeTab === 'configure'}
	<!-- Data source + mapping + schedule in one scrollable section -->
{:else if activeTab === 'test'}
	<!-- Test and preview -->
{:else}
	<!-- Status and URL display -->
{/if}
```

**Race Condition Prevention (from julik-frontend-races-reviewer):**

- The `handleTestDataSource` creates a binding, tests it, then deletes it - this is risky
- If user navigates away mid-test, the temp binding may remain orphaned
- Add cleanup in onDestroy and track the temp binding ID

**Security (from security-sentinel):**

- User-provided URLs for data sources should be validated client-side before submission
- The backend has SSRF protection, but client-side validation improves UX

#### 3.1 Create `/src/routes/dashboard/template/[uid]/dynamic/+page.svelte`

```svelte
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getUser } from '../../../../../store/user.store';
	import { getTemplateAction, template } from '../../../../../store/template.store';
	import { bindings, bindingActions, currentBinding } from '../../../../../store/binding.store';
	import { addToast } from '../../../../../store/toast.store';
	import Loader from '$lib/components/Loader.svelte';
	import DataSourceConfig from '$lib/components/dynamic/DataSourceConfig.svelte';
	import MappingEditor from '$lib/components/dynamic/MappingEditor.svelte';
	import RefreshStrategy from '$lib/components/dynamic/RefreshStrategy.svelte';
	import BindingStatus from '$lib/components/dynamic/BindingStatus.svelte';
	import PublishedPanel from '$lib/components/dynamic/PublishedPanel.svelte';

	let isLoading = true;
	let isSaving = false;
	let currentStep = 1;

	// Form state
	let dataSource = {
		type: 'http',
		url: '',
		method: 'GET',
		headers: {},
		credentials: null
	};
	let mapping = {};
	let refreshPolicy = {
		type: 'ttl',
		ttl_seconds: 300
	};
	let testResult = null;

	$: templateUid = $page.params.uid;
	$: variableDefinitions = $template?.variableDefinitions || [];
	$: existingBinding = $bindings.find((b) => b.templateId === templateUid);
	$: isPublished = !!existingBinding;

	onMount(async () => {
		const user = await getUser();
		if (!user?.email) {
			goto('/login');
			return;
		}

		if (templateUid) {
			await getTemplateAction(templateUid);
			await bindingActions.loadForTemplate(templateUid);

			// Load existing binding if present
			if ($bindings.length > 0) {
				const binding = $bindings[0];
				dataSource = binding.dataSource || dataSource;
				mapping = binding.mapping || {};
				refreshPolicy = binding.refreshPolicy || refreshPolicy;
				currentStep = 4; // Show published state
			}
		}
		isLoading = false;
	});

	async function handleTestDataSource() {
		try {
			// Create temporary binding for testing
			const testBinding = await bindingActions.create({
				template_id: templateUid,
				name: `Test - ${$template?.name}`,
				data_source: dataSource,
				mapping: {},
				refresh_policy: refreshPolicy
			});

			if (testBinding?.uid) {
				testResult = await bindingActions.test(testBinding.uid);
				await bindingActions.delete(testBinding.uid);
			}
		} catch (error) {
			addToast({ type: 'error', message: error.message || 'Test failed' });
		}
	}

	async function handlePublish() {
		isSaving = true;
		try {
			const bindingData = {
				template_id: templateUid,
				name: `Dynamic - ${$template?.name}`,
				data_source: dataSource,
				mapping,
				refresh_policy: refreshPolicy
			};

			if (existingBinding) {
				await bindingActions.update(existingBinding.uid, bindingData);
				addToast({ type: 'success', message: 'Binding updated!' });
			} else {
				await bindingActions.create(bindingData);
				addToast({ type: 'success', message: 'Dynamic URL published!' });
			}
			currentStep = 4;
		} catch (error) {
			addToast({ type: 'error', message: error.message || 'Publish failed' });
		} finally {
			isSaving = false;
		}
	}

	function nextStep() {
		if (currentStep < 3) currentStep++;
	}

	function prevStep() {
		if (currentStep > 1) currentStep--;
	}
</script>

<svelte:head>
	<title>Dynamic Publishing - {$template?.name || 'Template'} | Pictify</title>
</svelte:head>

{#if isLoading}
	<div class="flex h-screen items-center justify-center">
		<Loader show />
	</div>
{:else}
	<div class="min-h-screen bg-[#FFFDF8] p-6">
		<!-- Header -->
		<div class="max-w-5xl mx-auto mb-8">
			<div class="flex items-center justify-between">
				<div>
					<a
						href="/dashboard/template"
						class="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
					>
						← Back to Templates
					</a>
					<h1 class="text-3xl font-black text-gray-900">{$template?.name || 'Untitled'}</h1>
					<p class="text-gray-600 mt-1">Create a dynamic URL that auto-updates with your data</p>
				</div>
				{#if isPublished}
					<span
						class="px-4 py-2 bg-[#4ade80] text-gray-900 font-bold rounded-xl border-[3px] border-gray-900"
					>
						Published
					</span>
				{/if}
			</div>
		</div>

		{#if isPublished && currentStep === 4}
			<!-- Published State -->
			<div class="max-w-5xl mx-auto space-y-6">
				<PublishedPanel binding={existingBinding} />
				<BindingStatus binding={existingBinding} />

				<div class="flex gap-4">
					<button
						on:click={() => (currentStep = 1)}
						class="px-6 py-3 bg-white border-[3px] border-gray-900 rounded-xl font-bold
                   shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937]
                   hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						Edit Configuration
					</button>
					<button
						on:click={() => bindingActions.refresh(existingBinding.uid)}
						class="px-6 py-3 bg-[#ffc480] border-[3px] border-gray-900 rounded-xl font-bold
                   shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937]
                   hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						Force Refresh
					</button>
				</div>
			</div>
		{:else}
			<!-- Configuration Wizard -->
			<div class="max-w-5xl mx-auto">
				<!-- Step Indicators -->
				<div class="flex items-center justify-center mb-8">
					{#each [1, 2, 3] as step}
						<div class="flex items-center">
							<div
								class="w-10 h-10 rounded-full border-[3px] border-gray-900 flex items-center justify-center font-black
                          {currentStep >= step ? 'bg-[#ff6b6b] text-white' : 'bg-white'}"
							>
								{step}
							</div>
							{#if step < 3}
								<div class="w-20 h-1 {currentStep > step ? 'bg-[#ff6b6b]' : 'bg-gray-300'}" />
							{/if}
						</div>
					{/each}
				</div>

				<!-- Step Content -->
				<div
					class="bg-white border-[3px] border-gray-900 rounded-2xl p-8 shadow-[6px_6px_0_0_#1f2937]"
				>
					{#if currentStep === 1}
						<h2 class="text-2xl font-black mb-6 uppercase">Step 1: Data Source</h2>
						<DataSourceConfig bind:dataSource on:test={handleTestDataSource} {testResult} />
					{:else if currentStep === 2}
						<h2 class="text-2xl font-black mb-6 uppercase">Step 2: Field Mapping</h2>
						<MappingEditor {variableDefinitions} bind:mapping sampleData={testResult?.data} />
					{:else if currentStep === 3}
						<h2 class="text-2xl font-black mb-6 uppercase">Step 3: Refresh Strategy</h2>
						<RefreshStrategy bind:refreshPolicy />
					{/if}
				</div>

				<!-- Navigation -->
				<div class="flex justify-between mt-6">
					<button
						on:click={prevStep}
						disabled={currentStep === 1}
						class="px-6 py-3 bg-white border-[3px] border-gray-900 rounded-xl font-bold
                   shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937]
                   hover:translate-x-[2px] hover:translate-y-[2px] transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Previous
					</button>

					{#if currentStep < 3}
						<button
							on:click={nextStep}
							class="px-6 py-3 bg-[#ff6b6b] text-white border-[3px] border-gray-900 rounded-xl font-bold
                     shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937]
                     hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
						>
							Next Step
						</button>
					{:else}
						<button
							on:click={handlePublish}
							disabled={isSaving}
							class="px-8 py-3 bg-[#4ade80] text-gray-900 border-[3px] border-gray-900 rounded-xl font-black uppercase
                     shadow-[6px_6px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937]
                     hover:translate-x-[3px] hover:translate-y-[3px] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSaving ? 'Publishing...' : existingBinding ? 'Update' : 'Publish Dynamic URL'}
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
```

#### 3.2 Create supporting components for Dynamic Publishing

Create these files:

- `/src/lib/components/dynamic/DataSourceConfig.svelte` - HTTP/Webhook/Static config
- `/src/lib/components/dynamic/MappingEditor.svelte` - JSONPath mapping UI
- `/src/lib/components/dynamic/RefreshStrategy.svelte` - TTL configuration
- `/src/lib/components/dynamic/BindingStatus.svelte` - Status indicators
- `/src/lib/components/dynamic/PublishedPanel.svelte` - Dynamic URL display

### Phase 4: Update Template Dashboard

Modify the existing template list to show action buttons.

#### 4.1 Update `/src/lib/components/dashboard/template/TemplateList.svelte`

Add Render and Dynamic action buttons to each template card:

```svelte
<!-- Add to template card actions -->
<div class="flex gap-2 mt-4">
	<a
		href="/template-workspace/{template.outputFormat === 'pdf' ? 'pdf' : 'image'}/{template.uid}"
		class="flex-1 py-2 bg-white border-[2px] border-gray-900 rounded-lg text-center font-bold text-sm
           hover:bg-gray-100 transition-colors"
	>
		Edit
	</a>
	<a
		href="/dashboard/template/{template.uid}/render"
		class="flex-1 py-2 bg-[#ffc480] border-[2px] border-gray-900 rounded-lg text-center font-bold text-sm
           hover:brightness-95 transition-all"
	>
		Render
	</a>
	<a
		href="/dashboard/template/{template.uid}/dynamic"
		class="flex-1 py-2 bg-[#4ade80] border-[2px] border-gray-900 rounded-lg text-center font-bold text-sm
           hover:brightness-95 transition-all"
	>
		Dynamic
	</a>
</div>
```

## Acceptance Criteria

### Functional Requirements

- [ ] Template dashboard shows Edit, Render, and Dynamic buttons for each template
- [ ] Param Render page auto-generates form from template variables
- [ ] Param Render page shows live preview after rendering
- [ ] Param Render page provides copyable API code in multiple languages
- [ ] Dynamic Publishing page allows configuring HTTP data source
- [ ] Dynamic Publishing page allows mapping JSONPath to template variables
- [ ] Dynamic Publishing page allows configuring TTL refresh strategy
- [ ] Dynamic Publishing page creates binding and returns dynamic URL
- [ ] Published bindings show status indicators (last refresh, errors)
- [ ] All new pages follow neobrutalist design system

### Non-Functional Requirements

- [ ] Pages load within 2 seconds
- [ ] Preview renders within 5 seconds
- [ ] All pages are responsive (desktop/tablet)
- [ ] All pages require authentication
- [ ] Error states show clear messages with retry options

## Dependencies

- Backend bindings API already exists (`/bindings`, `/b/:bindingId.:format`, `/webhooks/:bindingId`)
- Existing template store and API
- Existing toast notification system
- Existing auth system

## References

### Internal Files

- `/src/routes/dashboard/template/+page.svelte` - Existing template list
- `/src/lib/components/dashboard/template/TemplateList.svelte` - Template card component
- `/src/store/template.store.js` - Template state management
- `/src/api/template.js` - Template API methods
- `/src/lib/components/editor/VariablesPanel.svelte` - Variable patterns

### Backend Endpoints

- `GET /bindings` - List bindings
- `POST /bindings` - Create binding
- `GET /bindings/:uid` - Get binding
- `PUT /bindings/:uid` - Update binding
- `DELETE /bindings/:uid` - Delete binding
- `POST /bindings/:uid/test` - Test binding
- `POST /bindings/:uid/refresh` - Force refresh
- `GET /b/:bindingId.:format` - Public render endpoint

---

## Research Summary (from /deepen-plan)

### Architecture Review (architecture-strategist)

**Alignment Analysis:**

- Route structure under `/dashboard/template/[uid]/` is appropriate and follows existing patterns
- The modal separation (Edit/Render/Dynamic) enforces good separation of concerns
- **Concern**: Current `/dashboard/template/[uid]/` redirects to `/template-workspace/` - need to update this

**Recommendations:**

1. Add read-only store projection for template data in Render/Dynamic modes
2. Create dedicated component directories: `/src/lib/components/render/` and `/src/lib/components/dynamic/`
3. Audit existing API functions before creating new ones - `renderTemplate`, `getTemplateVariables` already exist

### Simplicity Review (code-simplicity-reviewer)

**Potential 60-70% LOC Reduction:**

| Proposed                     | Recommendation                         |
| ---------------------------- | -------------------------------------- |
| `src/api/binding.js`         | Add to existing `template.js`          |
| `src/store/binding.store.js` | Use local state until sharing needed   |
| `RenderPreview.svelte`       | Inline - it's just `<img src={url} />` |
| `ApiCodeGenerator.svelte`    | Inline - 20 lines of code              |
| `BindingStatus.svelte`       | Inline - 5-10 lines of badges          |
| 3-step wizard                | Use tabs like VariablesPanel           |

**Pattern to Follow:** `/src/lib/components/editor/VariablesPanel.svelte` handles complex variable management (CRUD, preview, API testing, code generation) in a single file with tabs.

### Race Condition Analysis (julik-frontend-races-reviewer)

**Critical Fixes Required:**

1. **onMount cancellation** - Add `canceled` flag and check after each await
2. **Double-click protection** - Add synchronous `inProgress` flag before async work
3. **Test data source cleanup** - Track temp binding ID and delete in onDestroy

**Pattern:**

```javascript
let canceled = false;

onMount(async () => {
	const user = await getUser();
	if (canceled) return;
	// ... continue
});

onDestroy(() => {
	canceled = true;
});
```

### Performance Analysis (performance-oracle)

**Immediate Optimizations:**

1. Make `getUser()` non-blocking in root layout (+200-500ms improvement)
2. Lazy load ApiCodeGenerator since it's hidden by default
3. Add response caching to backend.js

**Current Estimates:**

- Page load: 2-4 seconds (target: 2 seconds)
- Preview render: 2-5 seconds (backend dependent)

### Security Analysis (security-sentinel)

**Findings:**

1. **XSS via @html** - Always escape content before using `@html` directive
2. **CSRF** - Backend must use SameSite cookies (no frontend CSRF token)
3. **Token Exposure** - Mask API tokens in generated code examples
4. **postMessage** - Add origin validation to any postMessage handlers
5. **Admin Routes** - Add frontend auth guard to admin pages

### Pattern Recognition (pattern-recognition-specialist)

**Anti-Patterns Found in Codebase:**
| Anti-Pattern | Location | Fix |
|--------------|----------|-----|
| Silent error swallowing | api/template.js, api/user.js | Throw errors |
| Inconsistent store patterns | store/ directory | Standardize on action object pattern |
| Improper load function | routes/dashboard/+page.js | Fix async handling |

**Recommended Store Pattern:**

```javascript
export const bindingActions = {
  async load(uid) {...},
  async create(data) {...},
  async update(uid, data) {...},
  reset() {...}
};
```

---

## Implementation Priority

Based on research, implement in this order:

1. **Phase 1**: API layer (with proper error throwing)
2. **Phase 2**: Param Render page (simpler, good first milestone)
3. **Phase 4**: Update template dashboard (quick win)
4. **Phase 3**: Dynamic Publishing page (most complex, save for last)

Consider the simplification option: Single page with tabs instead of wizard for Dynamic Publishing.
