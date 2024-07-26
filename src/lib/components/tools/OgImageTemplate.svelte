<script>
  export let html = '';
  export let width = 1200;
  export let height = 600;
  export let scale = 0.3;
</script>

<div style="width: {width * scale}px; height: {height * scale}px;">
 <iframe
  title="og-image-template"
   srcdoc={html}
   scale="0"
   style="width: {width}px; height: {height}px; transform: scale({scale}); transform-origin: top left;" 
  ></iframe>
</div>
