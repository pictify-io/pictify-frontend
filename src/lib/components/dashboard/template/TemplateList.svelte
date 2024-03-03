<script>
    import {goto} from '$app/navigation';
    export let templates;

    const handleTemplateClick = (template) => {
        goto(`/dashboard/template/${template.uid}`);
    }
</script>

<section>
    <div class="flex flex-wrap w-full mt-20 gap-5">
        {#each templates as template}
        <div role="button" tabindex="0" class="flex-col  border-gray-900 border-2 rounded-md flex cursor-pointer relative " on:click={handleTemplateClick(template)} on:keydown={(e) => {if (e.key === 'Enter') handleTemplateClick()}}>
            <div class="border-b border-gray-900">
                <div class="absolute top-0 left-0 w-full h-full" style="pointer-events: auto;"></div>
            <iframe srcdoc={template.html} class="w-[22rem] h-[11rem]" title="Template Preview" scrolling="no"></iframe>
            </div>
            <div class="p-2">
                <div class="text-lg">
                    {template.name}
                </div>
                <div class="text-xs text-gray-500">
                    Created at: {new Date(template.createdAt).toLocaleString()}
                </div>
            </div>
        </div>
        {/each}
    </div>
</section>