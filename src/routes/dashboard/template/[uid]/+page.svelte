<script>
    import CreateTemplate from '$lib/components/dashboard/template/CreateTemplate.svelte';
    import { getTemplateAction } from '../../../../store/template.store';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    export let data = {};

    // Read params from the URL
     export let params = {};

    onMount(async () => {
        console.log($page.params);
        if(!$page.params.uid){
            goto('/dashboard/template');
        }
     await getTemplateAction($page.params.uid);
    });
</script>

<div class="h-full w-full">
    <CreateTemplate isEdit={true}/>
</div>