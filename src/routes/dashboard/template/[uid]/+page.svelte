<script>
    import CreateTemplate from '$lib/components/dashboard/template/CreateTemplate.svelte';
    import { getTemplateAction } from '../../../../store/template.store';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import Loader from '$lib/components/Loader.svelte';
    let isLoading = true;


    // Read params from the URL

    onMount(async () => {
        if(!$page.params.uid){
            goto('/dashboard/template');
        }
     await getTemplateAction($page.params.uid);
        isLoading = false;
    });
</script>

<div class="h-full w-full">
    {#if isLoading}
    <div class="mt-20">
        <Loader size="16" show={isLoading} />
    </div>
    {:else}
    <CreateTemplate isEdit={true}/>
    {/if}
</div>