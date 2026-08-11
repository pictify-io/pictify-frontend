<script>
	export let html = '';
	export let width = 800;
	export let height = 800;
	export let scale = 0.5;
</script>

<div style="width: {width * scale}px; height: {height * scale}px;">
	<!-- allow-same-origin is load-bearing: the invoice-generator page edits this
	     frame's document in place, which requires same-origin access. Only
	     first-party template HTML may be rendered here. -->
	<iframe
		title="og-image-template"
		srcdoc={html}
		sandbox="allow-scripts allow-same-origin"
		scale="0"
		style="width: {width}px; height: {height}px; transform: scale({scale}); transform-origin: top left;"
	/>
</div>
