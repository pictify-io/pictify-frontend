<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getPublicTemplate, forkTemplate } from '../../../api/public-templates.js';
	import { user } from '../../../store/user.store.js';
	import { toast } from '../../../store/toast.store.js';

	// State
	let template = null;
	let loading = true;
	let error = null;
	let forking = false;

	$: uid = $page.params.uid;
	$: isLoggedIn = !!$user?.email;

	// Fetch template details
	async function fetchTemplate() {
		loading = true;
		error = null;

		try {
			const response = await getPublicTemplate(uid);
			template = response.template;
		} catch (e) {
			error = e.message || 'Template not found';
		} finally {
			loading = false;
		}
	}

	// Handle remix/fork
	async function handleRemix() {
		if (!isLoggedIn) {
			// Save return URL and redirect to signup
			sessionStorage.setItem('pictify_fork_template', uid);
			goto(`/signup?return=/templates/${uid}`);
			return;
		}

		forking = true;
		try {
			const response = await forkTemplate(uid);

			if (response.success && response.template) {
				toast.set({
					message: 'Template remixed! Opening editor...',
					type: 'success',
					duration: 2000
				});

				// Navigate to the template editor
				setTimeout(() => {
					goto(`/template-workspace/${response.template.uid}`);
				}, 500);
			}
		} catch (e) {
			toast.set({
				message: e.message || 'Failed to remix template',
				type: 'error',
				duration: 3000
			});
		} finally {
			forking = false;
		}
	}

	// Generate API example
	function getApiExample() {
		if (!template) return '';

		const variables = template.variableDefinitions || [];
		const varsObj = {};
		variables.forEach((v) => {
			varsObj[v.name] = v.defaultValue || `<${v.name}>`;
		});

		return `curl -X POST https://api.pictify.io/templates/${template.uid}/render \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '${JSON.stringify({ variables: varsObj, format: 'png' }, null, 2)}'`;
	}

	// Copy to clipboard
	async function copyToClipboard(text, message = 'Copied!') {
		try {
			await navigator.clipboard.writeText(text);
			toast.set({ message, type: 'success', duration: 1500 });
		} catch (e) {
			toast.set({ message: 'Failed to copy', type: 'error', duration: 2000 });
		}
	}

	// Format label
	function formatLabel(str) {
		if (!str) return '';
		return str.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
	}

	// Check for pending fork after login
	onMount(async () => {
		await fetchTemplate();

		// Check if user just logged in and had a pending fork
		if (isLoggedIn) {
			const pendingFork = sessionStorage.getItem('pictify_fork_template');
			if (pendingFork === uid) {
				sessionStorage.removeItem('pictify_fork_template');
				// Auto-trigger fork
				handleRemix();
			}
		}
	});
</script>

<svelte:head>
	{#if template}
		<title>{template.name} | Template Gallery | Pictify</title>
		<meta
			name="description"
			content={template.publicDescription ||
				`Remix the ${template.name} template and generate unlimited variants via API.`}
		/>
		<link rel="canonical" href={`https://pictify.io/templates/${template.uid}`} />

		<!-- Open Graph -->
		<meta property="og:title" content={`${template.name} | Pictify Template`} />
		<meta
			property="og:description"
			content={template.publicDescription || `Remix this template and automate variants via API.`}
		/>
		<meta property="og:type" content="website" />
		<meta property="og:url" content={`https://pictify.io/templates/${template.uid}`} />
		{#if template.thumbnail}
			<meta property="og:image" content={template.thumbnail} />
		{/if}

		<!-- Structured data -->
		{@html `<script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": "${template.name}",
        "description": "${template.publicDescription || ''}",
        "url": "https://pictify.io/templates/${template.uid}",
        ${template.thumbnail ? `"image": "${template.thumbnail}",` : ''}
        "creator": {
          "@type": "Organization",
          "name": "Pictify"
        }
      }
    </script>`}
	{:else}
		<title>Template | Pictify</title>
	{/if}
</svelte:head>

<div class="bg-[#FFFDF8] min-h-screen flex flex-col">
	<Nav />

	<main class="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
		<!-- Breadcrumb -->
		<nav class="mb-6">
			<ol class="flex items-center gap-2 text-sm font-bold text-gray-500">
				<li><a href="/templates" class="hover:text-gray-900 transition-colors">Templates</a></li>
				<li>/</li>
				<li class="text-gray-900">{template?.name || 'Loading...'}</li>
			</ol>
		</nav>

		{#if loading}
			<!-- Loading state -->
			<div class="grid lg:grid-cols-2 gap-8">
				<div
					class="bg-white border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] aspect-video animate-pulse"
				>
					<div class="w-full h-full bg-gray-200" />
				</div>
				<div class="space-y-4">
					<div class="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
					<div class="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
					<div class="h-20 bg-gray-200 rounded animate-pulse" />
				</div>
			</div>
		{:else if error}
			<!-- Error state -->
			<div class="text-center py-16">
				<div class="inline-block p-6 bg-red-100 border-[3px] border-red-400 rounded-full mb-6">
					<svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<h2 class="text-2xl font-black text-gray-900 mb-2">Template not found</h2>
				<p class="text-gray-600 font-medium mb-6">{error}</p>
				<a
					href="/templates"
					class="inline-block px-6 py-3 bg-[#ff6b6b] text-white font-black uppercase tracking-wider border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					Browse all templates
				</a>
			</div>
		{:else if template}
			<!-- Template detail -->
			<div class="grid lg:grid-cols-2 gap-8 lg:gap-12">
				<!-- Preview -->
				<div>
					<div
						class="bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden"
					>
						{#if template.thumbnail}
							<img
								src={template.thumbnail}
								alt={template.name}
								class="w-full aspect-video object-cover"
							/>
						{:else}
							<div
								class="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-[#ffc480] to-[#ff6b6b]"
							>
								<span class="text-white font-black text-6xl opacity-50"
									>{template.name.charAt(0)}</span
								>
							</div>
						{/if}
					</div>

					<!-- Size info -->
					<div class="mt-4 flex items-center gap-4 text-sm font-bold text-gray-600">
						<span class="flex items-center gap-1">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
								/>
							</svg>
							{template.width} × {template.height}px
						</span>
						<span class="flex items-center gap-1">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							{template.usageCount || 0} renders
						</span>
						<span class="flex items-center gap-1">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
								/>
							</svg>
							{template.forkCount || 0} forks
						</span>
					</div>
				</div>

				<!-- Details -->
				<div>
					<!-- Header -->
					<div class="mb-6">
						<div class="flex items-center gap-3 mb-3">
							<span
								class="px-3 py-1 bg-[#ffc480] border-2 border-gray-900 text-xs font-black uppercase"
							>
								{formatLabel(template.category)}
							</span>
							{#if template.isFeatured}
								<span
									class="px-3 py-1 bg-[#4ade80] border-2 border-gray-900 text-xs font-black uppercase"
								>
									Featured
								</span>
							{/if}
						</div>
						<h1 class="text-3xl md:text-4xl font-black text-gray-900 mb-3">{template.name}</h1>
						{#if template.publicDescription}
							<p class="text-lg font-medium text-gray-600">{template.publicDescription}</p>
						{/if}
					</div>

					<!-- Tags -->
					{#if template.tags && template.tags.length > 0}
						<div class="flex flex-wrap gap-2 mb-6">
							{#each template.tags as tag}
								<a
									href={`/templates?tag=${encodeURIComponent(tag)}`}
									class="px-3 py-1 text-sm font-bold border-2 border-gray-900 rounded-full bg-white hover:bg-gray-100 transition-colors"
								>
									{tag}
								</a>
							{/each}
						</div>
					{/if}

					<!-- Primary CTA -->
					<div class="mb-8">
						<button
							on:click={handleRemix}
							disabled={forking}
							class="w-full sm:w-auto px-8 py-4 bg-[#ff6b6b] text-white font-black text-lg uppercase tracking-wider border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if forking}
								<span class="flex items-center justify-center gap-2">
									<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
											fill="none"
										/>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									Remixing...
								</span>
							{:else}
								<span class="flex items-center justify-center gap-2">
									<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
									</svg>
									Remix this template
								</span>
							{/if}
						</button>
						<p class="text-sm font-bold text-gray-500 mt-2">
							{isLoggedIn ? 'Creates a copy in your workspace' : 'Sign up to remix'}
						</p>
					</div>

					<!-- Variables -->
					{#if template.variableDefinitions && template.variableDefinitions.length > 0}
						<div class="mb-8">
							<h2 class="text-lg font-black uppercase tracking-wider mb-4">Variables</h2>
							<div class="bg-white border-[3px] border-gray-900 divide-y-2 divide-gray-900">
								{#each template.variableDefinitions as variable}
									<div class="p-4">
										<div class="flex items-center justify-between mb-1">
											<span class="font-black text-gray-900">{variable.name}</span>
											<span
												class="text-xs font-bold px-2 py-0.5 bg-gray-100 border border-gray-300 rounded"
											>
												{variable.type}
											</span>
										</div>
										{#if variable.description}
											<p class="text-sm text-gray-600">{variable.description}</p>
										{/if}
										{#if variable.defaultValue}
											<p class="text-xs text-gray-500 mt-1">
												Default: <code class="bg-gray-100 px-1 rounded"
													>{variable.defaultValue}</code
												>
											</p>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- API Example -->
			<section class="mt-12 bg-white border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937]">
				<div class="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
					<span class="font-black uppercase tracking-wider text-sm">API Example</span>
					<button
						on:click={() => copyToClipboard(getApiExample(), 'API example copied!')}
						class="px-3 py-1 bg-white text-gray-900 font-bold text-xs uppercase border-2 border-white hover:bg-gray-100 transition-colors"
					>
						Copy
					</button>
				</div>
				<pre class="p-6 overflow-x-auto text-sm font-mono text-gray-800 bg-gray-50"><code
						>{getApiExample()}</code
					></pre>
			</section>

			<!-- Related actions -->
			<section class="mt-12 grid md:grid-cols-3 gap-6">
				<a
					href="/templates"
					class="block p-6 bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#1f2937] transition-all"
				>
					<h3 class="font-black text-lg mb-2">← Browse more</h3>
					<p class="text-sm text-gray-600">Explore the full template gallery</p>
				</a>

				<a
					href="/template-workspace/create"
					class="block p-6 bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#1f2937] transition-all"
				>
					<h3 class="font-black text-lg mb-2 flex items-center gap-2">
						<svg class="w-5 h-5 text-[#ffc480]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
						Create from scratch
					</h3>
					<p class="text-sm text-gray-600">Build your own template in the editor</p>
				</a>

				<a
					href="/pricing"
					class="block p-6 bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#1f2937] transition-all"
				>
					<h3 class="font-black text-lg mb-2 flex items-center gap-2">
						<svg class="w-5 h-5 text-[#ff6b6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						Get API access
					</h3>
					<p class="text-sm text-gray-600">Automate renders at scale</p>
				</a>
			</section>
		{/if}
	</main>

	<Footer />
</div>
