<script>
    import Editor from '../../../components/grapeJS/editor.svelte';
    import { editor } from '../../../../store/editor.store';
    import { onMount, onDestroy } from 'svelte';
    import { getHTMLandCSS } from '../../../html-to-gif/create-media';
    import {createTemplateAction, updateTemplateAction, template} from "../../../../store/template.store";
    import {get} from "svelte/store";

    let grapeEditor;

    let templateName = '';


    export let isEdit = false;

    let editorTemplate = null;

    let unsubscribe = () => {};
    let templateUnsubscribe = () => {};

    const updateTemplate = async () => {
        const grapeHTML = grapeEditor.getHtml();
        const grapeCSS = grapeEditor.getCss();
        const html = await getHTMLandCSS(grapeHTML, grapeCSS);
        template.set({
            ...get(template),
            html,
            name: templateName,
        });

        await updateTemplateAction();
    };

    const createTemplate = async () => {
        const grapeHTML = grapeEditor.getHtml();
        const grapeCSS = grapeEditor.getCss();
        const html = await getHTMLandCSS(grapeHTML, grapeCSS);

        const template = {
            html,
            name: templateName,
        };

        await createTemplateAction(template);
    };

    const saveTemplate = async () => {
        if (isEdit) {
            await updateTemplate();
        } else {
            await createTemplate();
        }
    };

    onMount(() => {
        unsubscribe = editor.subscribe((e) => {
            grapeEditor = e;
        });

        templateUnsubscribe = template.subscribe((t) => {
            editorTemplate = t;
            if (editorTemplate && isEdit) {
            templateName = editorTemplate.name;
            grapeEditor.setComponents(editorTemplate.html);
            // grapeEditor.setStyle(editorTemplate.css);
        }
        });





    });

    onDestroy(() => {
        unsubscribe();
        templateUnsubscribe();
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