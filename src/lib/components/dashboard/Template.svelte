<script>
    import NavTemplate from "$lib/components/dashboard/template/NavTemplate.svelte";
    import EmptyTemplate from "$lib/components/dashboard/template/EmptyTemplate.svelte";
    import {onMount, onDestroy} from "svelte";
    import {getTemplatesAction, templates} from "../../../store/template.store";

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

<div class="h-full w-full">
    <NavTemplate />
    {#if templateList.length === 0}
    <EmptyTemplate />
    {/if}
</div>