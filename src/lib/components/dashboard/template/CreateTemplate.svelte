<script>
	import EditorLayout from '../../editor/EditorLayout.svelte';
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

	let fabricCanvas;

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
			const svg = fabricCanvas.toSVG();
			const html = await getHTMLandCSS(svg, '');
			const fabricJSData = fabricCanvas.toJSON();
			const width = fabricCanvas.width;
			const height = fabricCanvas.height;

			const templateData = {
				...editorTemplate,
				html,
				name: templateName,
				fabricJSData,
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
			const svg = fabricCanvas.toSVG();
			const html = await getHTMLandCSS(svg, '');
			const fabricJSData = fabricCanvas.toJSON();
			const width = fabricCanvas.width;
			const height = fabricCanvas.height;

			const templateData = {
				html,
				name: templateName,
				fabricJSData,
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
		console.log('CreateTemplate: saveTemplate called', { isEdit, templateName });
		if (isEdit) {
			await updateTemplate();
		} else {
			await createTemplate();
		}
	};

	onMount(() => {
		unsubscribe = editor.subscribe((e) => {
			fabricCanvas = e;
			if (fabricCanvas && editorTemplate && editorTemplate.fabricJSData) {
				fabricCanvas.loadFromJSON(editorTemplate.fabricJSData, () => {
					fabricCanvas.renderAll();
				});
			}
		});

		templateUnsubscribe = template.subscribe((t) => {
			editorTemplate = t;
			if (editorTemplate && isEdit) {
				templateName = editorTemplate.name;
				templateType = editorTemplate.type || 'og-image';
				if (editorTemplate.fabricJSData && fabricCanvas) {
					fabricCanvas.loadFromJSON(editorTemplate.fabricJSData, () => {
						fabricCanvas.renderAll();
					});
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

<EditorLayout 
	bind:templateName 
	{isSaving} 
	on:save={saveTemplate} 
/>

<Toast />
