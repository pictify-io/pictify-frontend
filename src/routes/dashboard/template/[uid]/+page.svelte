<script>
    import CreateTemplate from '$lib/components/dashboard/template/CreateTemplate.svelte';
    import { getTemplateAction } from '../../../../store/template.store';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import Loader from '$lib/components/Loader.svelte';
    let isLoading = true;

    export let data = {};

    // Read params from the URL
     export let params = {};

    onMount(async () => {
        console.log($page.params);
        if(!$page.params.uid){
            goto('/dashboard/template');
        }
     await getTemplateAction($page.params.uid);
        isLoading = false;
    });
</script>

<div class="h-full w-full">
    <div class="mt-20">
        <Loader size="16" show={isLoading} />
    </div>
    {#if !isLoading}
    <CreateTemplate isEdit={true}/>
    {/if}
</div>