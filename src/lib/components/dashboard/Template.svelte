<script>
    import NavTemplate from "$lib/components/dashboard/template/NavTemplate.svelte";
    import EmptyTemplate from "$lib/components/dashboard/template/EmptyTemplate.svelte";
    import {onMount, onDestroy} from "svelte";
    import {getTemplatesAction, templates} from "../../../store/template.store";
	import TemplateList from "$lib/components/dashboard/template/TemplateList.svelte";

    let unsubscribe = () => {};
    let templateList = [];

    onMount(async () => {
        unsubscribe = templates.subscribe(async (t) => {
            templateList = t;
            console.log(templateList);
        });
        await getTemplatesAction();
    });

    onDestroy(() => {
        unsubscribe();
    });
</script>

<div class="h-full w-full max-w-6xl m-auto p-5">
    <NavTemplate />
    {#if templateList.length === 0}
    <EmptyTemplate />
    {:else}
    <TemplateList templates={templateList} />
    {/if}
</div>