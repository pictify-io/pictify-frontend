<script>
	import { toast } from '../../../store/toast.store';
	import { analytics } from '$lib/analytics.js';

	export let imageUrl = '';
	export let templateUid = '';
	export let variables = {};
	export let format = 'png';
	export let apiKey = '';

	let isOpen = false;

	import { PUBLIC_BACKEND_URL } from '$env/static/public';
	const API_BASE = PUBLIC_BACKEND_URL || 'https://api.pictify.io';

	function sanitizeForHtml(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	function buildQueryParams(vars) {
		return Object.entries(vars)
			.filter(([, v]) => v !== '' && v !== undefined && v !== null)
			.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
			.join('&');
	}

	function getUrlRenderUrl() {
		const params = buildQueryParams(variables);
		const tokenParam = `token=${apiKey || 'YOUR_API_KEY'}`;
		const allParams = params ? `${tokenParam}&${params}` : tokenParam;
		return `${API_BASE}/r/${templateUid}.${format}?${allParams}`;
	}

	function getApiRenderUrl() {
		return `${API_BASE}/templates/${templateUid}/render`;
	}

	function getVariablesJson() {
		return JSON.stringify(variables, null, 2);
	}

	const snippetFormats = [
		{
			id: 'html',
			label: 'HTML <img>',
			iconPath: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
			generate: () => {
				const url = sanitizeForHtml(getUrlRenderUrl());
				return `<img src="${url}" alt="Generated image" />`;
			}
		},
		{
			id: 'react',
			label: 'React / Next.js',
			iconPath: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
			generate: () => {
				const url = getUrlRenderUrl();
				return `<Image\n  src="${url}"\n  alt="Generated image"\n  width={1200}\n  height={630}\n/>`;
			}
		},
		{
			id: 'markdown',
			label: 'Markdown',
			iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
			generate: () => {
				const url = getUrlRenderUrl();
				return `![Generated image](${url})`;
			}
		},
		{
			id: 'curl',
			label: 'curl',
			iconPath: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
			generate: () => {
				const key = apiKey || 'YOUR_API_KEY';
				return `curl -X POST ${getApiRenderUrl()} \\\n  -H "Authorization: Bearer ${key}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ variables })}' \\\n  --output image.${format}`;
			}
		},
		{
			id: 'javascript',
			label: 'JavaScript',
			iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
			generate: () => {
				const key = apiKey || 'YOUR_API_KEY';
				return `const response = await fetch('${getApiRenderUrl()}', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer ${key}',\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    variables: ${getVariablesJson()}\n  })\n});\nconst blob = await response.blob();`;
			}
		},
		{
			id: 'python',
			label: 'Python',
			iconPath: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
			generate: () => {
				const key = apiKey || 'YOUR_API_KEY';
				return `import requests\n\nresponse = requests.post(\n    '${getApiRenderUrl()}',\n    headers={'Authorization': 'Bearer ${key}'},\n    json={'variables': ${getVariablesJson()}}\n)\nwith open('image.${format}', 'wb') as f:\n    f.write(response.content)`;
			}
		}
	];

	async function copySnippet(snippetFormat) {
		try {
			const code = snippetFormat.generate();
			await navigator.clipboard.writeText(code);
			toast.set({ message: `Copied ${snippetFormat.label} snippet!`, type: 'success' });
			analytics.trackCopy({ content_type: 'code_snippet', context: snippetFormat.id });
			isOpen = false;
		} catch (err) {
			toast.set({ message: 'Failed to copy to clipboard', type: 'error' });
		}
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function handleClickOutside(event) {
		if (isOpen && !event.target.closest('.copy-as-code-dropdown')) {
			isOpen = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="copy-as-code-dropdown relative inline-block">
	<button
		on:click|stopPropagation={toggleDropdown}
		class="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-900 text-gray-900 font-bold text-sm
			shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]
			transition-all duration-150 active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
	>
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
		</svg>
		Copy as...
		<svg class="w-3 h-3 transition-transform" class:rotate-180={isOpen} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 mt-2 w-56 bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] z-50"
		>
			{#each snippetFormats as fmt}
				<button
					on:click|stopPropagation={() => copySnippet(fmt)}
					class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#ffc480]/20 border-b border-gray-200 last:border-b-0 transition-colors"
				>
					<svg class="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d={fmt.iconPath} />
					</svg>
					<span class="font-medium text-sm text-gray-900">{fmt.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
