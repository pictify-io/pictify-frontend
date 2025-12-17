<script>
  import CreateTemplate from '$lib/components/dashboard/template/CreateTemplate.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { getTemplateForUseCase } from '$lib/pseo/useCaseTemplates.js';
  import { useCaseDetails, useCases } from '$lib/pseo/config.js';

  const DRAFT_KEY = 'pictify_template_draft_v1';

  $: useCaseId = $page.url.searchParams.get('usecase');
  $: useCaseLabel = useCaseId ? (useCaseDetails[useCaseId]?.label || useCases.find((u) => u.id === useCaseId)?.label || useCaseId) : null;

  onMount(() => {
    // If a usecase is provided, seed a FabricJS template draft for the editor.
    if (useCaseId) {
      try {
        const draft = getTemplateForUseCase(useCaseId, useCaseLabel || useCaseId);
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (e) {
        // no-op
      }
    }
  });
</script>

<svelte:head>
  <title>Try the Canvas Editor | Pictify</title>
  <meta
    name="description"
    content="Try Pictify's canvas editor. Customize a template and see how programmatic media automation works before you sign up."
  >
  <link rel="canonical" href="https://pictify.io/canvas/try">
</svelte:head>

<div class="h-screen w-screen overflow-hidden bg-white">
  <CreateTemplate guestMode={true} />
</div>

