<script>
    export let templates;
</script>

<section>
    <div class="flex flex-wrap w-full justify-between mt-20">
        {#each templates as template}
        <div class="flex-col  border-gray-900 border rounded-md flex ">
            <div class="border-b border-gray-900">
               <iframe srcdoc={template.html} class="w-64 h-32"></iframe>
            </div>
            <div class="p-4">
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