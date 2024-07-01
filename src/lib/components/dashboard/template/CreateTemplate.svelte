<script>
	import Editor from '../../../components/grapeJS/editor.svelte';
	import { editor } from '../../../../store/editor.store';
	import { onMount, onDestroy } from 'svelte';
	import { getHTMLandCSS } from '../../../html-to-gif/create-media';
	import {
		createTemplateAction,
		updateTemplateAction,
		template
	} from '../../../../store/template.store';
	import { get } from 'svelte/store';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '../../../../store/toast.store';
	import CopyIcon from '$lib/assets/dashboard/Copy Icons.png';

	let grapeEditor;

	let templateName = '';

	export let isEdit = false;

	let editorTemplate = null;

	let unsubscribe = () => {};
	let templateUnsubscribe = () => {};

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'Copied to clipboard !!', duration: 1500 });
		});
	}

	const updateTemplate = async () => {
		const grapeHTML = grapeEditor.getHtml();
		const grapeCSS = grapeEditor.getCss();
		const html = await getHTMLandCSS(grapeHTML, grapeCSS);
		const grapeJSData = grapeEditor.getProjectData();
		const width = grapeEditor.Canvas.getWindow().innerWidth;
		const height = grapeEditor.Canvas.getWindow().innerHeight;

		template.set({
			...get(template),
			html,
			name: templateName,
			grapeJSData,
			width,
			height
		});

		await updateTemplateAction();
	};

	const createTemplate = async () => {
		const grapeHTML = grapeEditor.getHtml();
		const grapeCSS = grapeEditor.getCss();
		const html = await getHTMLandCSS(grapeHTML, grapeCSS);
		const grapeJSData = grapeEditor.getProjectData();
		const width = grapeEditor.Canvas.getWindow().innerWidth;
		const height = grapeEditor.Canvas.getWindow().innerHeight;

		const templateData = {
			html,
			name: templateName,
			grapeJSData,
			width,
			height
		};

		await createTemplateAction(templateData);
	};

	const saveTemplate = async () => {
		if (isEdit) {
			await updateTemplate();
			toast.set({ message: 'Template Saved !!', duration: 1500 });
		} else {
			await createTemplate();
			toast.set({ message: 'Template Created !!', duration: 1500 });
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
				if (editorTemplate.grapeJSData && grapeEditor) {
					grapeEditor.loadProjectData(editorTemplate.grapeJSData);
				} else if (grapeEditor) {
					grapeEditor.setComponents(editorTemplate.html);
				}
				// grapeEditor.setStyle(editorTemplate.css);
			}
		});
	});

	onDestroy(() => {
		unsubscribe();
		templateUnsubscribe();
		template.set(null);
	});
</script>

<section class="max-w-6xl p-5 m-auto">
	<div class="w-full flex justify-center">
		<div>
			{#if editorTemplate?.uid}
				<div class="flex w-full">
					<div>
						Template Id: <span class="text-red-400">{editorTemplate?.uid}</span>
					</div>
					<div class="w-4 h-4 ml-2 mt-[2px]">
						<button on:click={copyToClipboard(editorTemplate.uid)}>
							<img
								src={CopyIcon}
								alt="Copy Icon"
								class="cursor-pointer w-5 mt-[2px]"
								title="copy"
							/>
						</button>
					</div>
				</div>
			{/if}
			<div class="flex items-center w-full mt-4">
				<div class="flex-grow">
					<input
						type="text"
						placeholder="Template Name"
						class="w-full border-2 border-gray-300 p-2 rounded-md"
						bind:value={templateName}
					/>
				</div>
				<div class="ml-5">
					<button
						class="bg-black hover:bg-black text-white font-bold py-2 px-4 rounded ring-1 ring-black ring-opacity-5"
						on:click={saveTemplate}
					>
						<div class="flex justify-between items-center">
							<div>Save Template</div>
						</div>
					</button>
				</div>
			</div>
			<Editor isLandingPage={false} />
		</div>
	</div>
</section>

<Toast />
