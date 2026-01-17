<script>
	import CreateTemplate from '$lib/components/dashboard/template/CreateTemplate.svelte';
	import { onMount } from 'svelte';
	import { pageActions } from '../../../../store/pages.store';
	
	let initialConfig = {
		outputFormat: 'image',
		pdfPreset: null,
		width: 1080, 
		height: 1080
	};
    
    onMount(() => {
        pageActions.setOutputFormat('image');
    });
</script>

<CreateTemplate initialConfig={initialConfig} templateType="image" />
