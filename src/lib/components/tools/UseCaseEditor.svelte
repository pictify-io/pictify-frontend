<script>
  import { onMount } from 'svelte';

  export let html = '';
  export let width = 1200;
  export let height = 630;

  let iframeEl;

  const getSrcDoc = () => html || '<!DOCTYPE html><html><body></body></html>';

  function sanitize(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return parsed;
  }

  $: displayWidth = sanitize(width, 1200);
  $: displayHeight = sanitize(height, 630);

  $: srcDoc = getSrcDoc();

  onMount(() => {
    if (iframeEl) {
      iframeEl.srcdoc = srcDoc;
    }
  });

  $: if (iframeEl) {
    iframeEl.srcdoc = srcDoc;
  }
</script>

<section class="w-full">
  <div class="flex flex-col md:flex-row border-4 border-black max-w-[1200px] mx-auto bg-white">
    <div class="w-full md:w-1/2 flex flex-col">
      <div class="bg-black px-4 py-2">
        <h3 class="text-sm font-semibold text-white uppercase tracking-wide">HTML Template</h3>
      </div>
      <textarea
        class="flex-1 min-h-[320px] w-full border-0 border-r-4 border-black/10 p-4 font-mono text-sm leading-6 text-gray-900 focus:outline-none focus:ring-0 focus:border-black"
        bind:value={html}
        spellcheck="false"
      ></textarea>
    </div>

    <div class="w-full md:w-1/2 flex flex-col border-t-4 md:border-t-0 md:border-l-4 border-black">
      <div class="bg-black px-4 py-2 flex items-center justify-between text-sm text-white">
        <span class="font-semibold uppercase tracking-wide">Live Preview</span>
        <span class="text-xs text-white/80">{displayWidth} × {displayHeight} px</span>
      </div>
      <div class="flex-1 bg-[#f9fafb] p-4 overflow-auto">
        <div
          class="shadow-sm border border-gray-200 bg-white relative"
          style={`width:${displayWidth}px; height:${displayHeight}px;`}
        >
          <iframe
            bind:this={iframeEl}
            class="block w-full h-full"
            title="usecase-preview"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  textarea {
    resize: vertical;
  }
</style>

