<script>
	import CreateTemplate from '$lib/components/dashboard/template/CreateTemplate.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { getTemplateForUseCase } from '$lib/pseo/useCaseTemplates.js';
	import { useCaseDetails, useCases } from '$lib/pseo/config.js';
	import { user, getUser } from '../../../store/user.store';
	import { goto } from '$app/navigation';

	const DRAFT_KEY = 'pictify_template_draft_v1';

	$: useCaseId = $page.url.searchParams.get('usecase');
	$: useCaseLabel = useCaseId
		? useCaseDetails[useCaseId]?.label ||
		  useCases.find((u) => u.id === useCaseId)?.label ||
		  useCaseId
		: null;

	let isLoading = true;
	let shouldShowEditor = false;

	onMount(async () => {
		// Check if user is logged in
		await getUser();

		// If user is logged in and has a draft, redirect to the proper create page
		if ($user?.email) {
			const hasDraft = localStorage.getItem(DRAFT_KEY);
			if (hasDraft) {
				// Redirect to the proper workspace for logged-in users
				// The draft will be loaded there
				goto('/template-workspace/create');
				return;
			}
		}

		// If a usecase is provided, seed a FabricJS template draft for the editor.
		if (useCaseId) {
			try {
				const draft = getTemplateForUseCase(useCaseId, useCaseLabel || useCaseId);
				localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
			} catch (e) {
				// no-op
			}
		}

		shouldShowEditor = true;
		isLoading = false;
	});
</script>

<svelte:head>
	<title>Try the Canvas Editor | Pictify</title>
	<meta
		name="description"
		content="Try Pictify's canvas editor. Customize a template and see how programmatic media automation works before you sign up."
	/>
	<link rel="canonical" href="https://pictify.io/canvas/try" />
</svelte:head>

<div class="h-screen w-screen overflow-hidden bg-white">
	{#if isLoading}
		<div class="flex items-center justify-center h-full">
			<div class="text-center">
				<i class="fa fa-spinner fa-spin text-4xl text-gray-400 mb-4" />
				<p class="text-gray-600">Loading canvas editor...</p>
			</div>
		</div>
	{:else if shouldShowEditor}
		<CreateTemplate guestMode={!$user?.email} />
	{/if}
</div>
