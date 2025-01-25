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
	let templateType = 'og-image'; // Default type
	export let isEdit = false;

	let editorTemplate = null;

	let unsubscribe = () => {};
	let templateUnsubscribe = () => {};
	let isSaving = false;

	const templateTypes = [
		{ label: 'OG Image', value: 'og-image' },
		{ label: 'Invoice', value: 'invoice' },
		{ label: 'Social Media', value: 'social-media' }
	];

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'Copied to clipboard!', duration: 1500 });
		});
	}

	const updateTemplate = async () => {
		if (!templateName.trim()) {
			toast.set({ message: 'Please enter a template name', duration: 1500 });
			return;
		}

		isSaving = true;
		try {
			const grapeHTML = grapeEditor.getHtml();
			const grapeCSS = grapeEditor.getCss();
			const html = await getHTMLandCSS(grapeHTML, grapeCSS);
			const grapeJSData = grapeEditor.getProjectData();
			const width = grapeEditor.Canvas.getWindow().innerWidth;
			const height = grapeEditor.Canvas.getWindow().innerHeight;

			const templateData = {
				...editorTemplate,
				html,
				name: templateName,
				grapeJSData,
				width,
				height,
				type: templateType
			};

			const result = await updateTemplateAction(templateData);
			if (result) {
				toast.set({ message: 'Template updated successfully!', duration: 1500 });
			} else {
				toast.set({ message: 'Failed to update template', duration: 1500 });
			}
		} catch (error) {
			console.error('Error updating template:', error);
			toast.set({ message: 'Failed to update template', duration: 1500 });
		} finally {
			isSaving = false;
		}
	};

	const createTemplate = async () => {
		if (!templateName.trim()) {
			toast.set({ message: 'Please enter a template name', duration: 1500 });
			return;
		}

		isSaving = true;
		try {
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
				height,
				type: templateType
			};

			const result = await createTemplateAction(templateData);
			if (result) {
				toast.set({ message: 'Template created successfully!', duration: 1500 });
				templateName = '';
			} else {
				toast.set({ message: 'Failed to create template', duration: 1500 });
			}
		} catch (error) {
			console.error('Error creating template:', error);
			toast.set({ message: 'Failed to create template', duration: 1500 });
		} finally {
			isSaving = false;
		}
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
				templateType = editorTemplate.type || 'og-image';
				if (editorTemplate.grapeJSData && grapeEditor) {
					grapeEditor.loadProjectData(editorTemplate.grapeJSData);
				} else if (grapeEditor) {
					grapeEditor.setComponents(editorTemplate.html);
				}
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
		<div class="w-full">
			{#if editorTemplate?.uid}
				<div class="flex w-full">
					<div>
						Template Id: <span class="text-red-400">{editorTemplate?.uid}</span>
					</div>
					<div class="w-4 h-4 ml-2 mt-[2px]">
						<button on:click={() => copyToClipboard(editorTemplate.uid)}>
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
			<div class="flex flex-col md:flex-row gap-4 items-start w-full mt-4">
				<div class="flex-grow">
					<input
						type="text"
						placeholder="Template Name"
						class="w-full border-2 border-gray-300 p-2 rounded-md"
						bind:value={templateName}
					/>
				</div>
				<div class="w-full md:w-48">
					<select
						bind:value={templateType}
						class="w-full border-2 border-gray-300 p-2 rounded-md bg-white"
					>
						{#each templateTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<button
						class="w-full md:w-auto bg-black hover:bg-black/80 text-white font-bold py-2 px-6 rounded ring-1 ring-black ring-opacity-5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						on:click={saveTemplate}
						disabled={isSaving}
					>
						<div class="flex justify-between items-center gap-2">
							{#if isSaving}
								<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{/if}
							<div>{isEdit ? 'Update' : 'Create'} Template</div>
						</div>
					</button>
				</div>
			</div>
			<div class="mt-4">
				<Editor isLandingPage={false} />
			</div>
		</div>
	</div>
</section>

<Toast />
