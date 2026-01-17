<script>
	import CreateTemplate from '$lib/components/dashboard/template/CreateTemplate.svelte';
	import { onMount } from 'svelte';
	import { pageActions } from '../../../../store/pages.store';
	
	let initialConfig = {
		outputFormat: 'pdf',
		pdfPreset: 'A4',
		width: 595, 
		height: 842
	};

    // We can try to recover config passed from the selector via history state if sveltekit supports it easily,
    // or just rely on defaults/localstorage if needed. 
    // But simply enforcing 'pdf' format here is key.
    
    onMount(() => {
        pageActions.setOutputFormat('pdf');
        pageActions.setPdfPreset('A4');
    });

</script>

<CreateTemplate initialConfig={initialConfig} templateType="pdf" />
