<script>
    import Editor from '$lib/components/grapeJS/Editor.svelte';
    import { editor } from '../../../../store/editor.store';
    import { onMount, onDestroy } from 'svelte';
    import { getHTMLandCSS } from '../../../html-to-gif/create-media';
    import {createTemplateAction} from "../../../../store/template.store";

    let grapeEditor;

    let templateName = '';


    let unsubscribe = () => {};

    const saveTemplate = async () => {
        const grapeHTML = grapeEditor.getHtml();
        const grapeCSS = grapeEditor.getCss();
        const html = await getHTMLandCSS(grapeHTML, grapeCSS);

        const template = {
            html,
            name: templateName,
        };

        await createTemplateAction(template);
    };

    onMount(() => {
        unsubscribe = editor.subscribe((e) => {
            grapeEditor = e;
        });
    });

    onDestroy(() => {
        unsubscribe();
    });
</script>

<section class="max-w-6xl p-5 m-auto">
  
    <div class="w-full flex justify-center">
        <div>
            <div class="flex items-center w-full">
                <div class="flex-grow">
                    <input type="text" placeholder="Template Name" class="w-full border-2 border-gray-300 p-2 rounded-md" bind:value={templateName} />
                </div>
                <div class="ml-5">
                    <button class="bg-black hover:bg-black text-white font-bold py-2 px-4 rounded ring-1 ring-black ring-opacity-5" on:click={saveTemplate}>
                        <div class="flex justify-between items-center">
                            <div>Save Template</div>
                        </div>
                    </button>
                </div>
            </div>
            <Editor isLandingPage={false}/>
        </div>
    </div>
</section>