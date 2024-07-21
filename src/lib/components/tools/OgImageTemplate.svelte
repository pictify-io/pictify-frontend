<script>
  export let html = '';
</script>

<div>
 <iframe
  title="og-image-template"
   srcdoc={html}
   scale="0"
    class="scaled-iframe"
  ></iframe>
</div>

<style>
  .scaled-iframe {
    width: 900px; /* Adjust as needed */
    height: 400px; /* Adjust as needed */   
    scale: 0.5;
    transform-origin: top left;
    border: 0; /* Optional: removes the border */
  }
</style>