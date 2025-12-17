<script>
  import { goto } from '$app/navigation';
  import { toast } from '../../../store/toast.store';
  import { user } from '../../../store/user.store';
  import ShareResultButton from './ShareResultButton.svelte';

  /**
   * Next steps module for PLG:
   * - Share result (creates shareable link)
   * - Copy API request (pre-filled)
   * - Save as template draft (opens template workspace)
   * - Batch render example (template-based)
   */
  export let heading = 'Next steps';
  export let description =
    'Share this result, turn it into a reusable template, or automate variants via API.';

  /**
   * Full curl snippet to copy (can be large).
   * Provide the complete snippet for clipboard; the component will truncate in UI.
   */
  export let curlSnippet = '';

  /**
   * Template draft written to localStorage for the template workspace to import.
   * Recommended shape:
   * { version: 1, name, type, width, height, backgroundImageUrl, source }
   */
  export let templateDraft = null;

  /**
   * Optional batch snippet (template-based).
   * If omitted, a sane default is shown.
   */
  export let batchSnippet = '';

  /**
   * Share result configuration
   */
  export let generatedUrl = '';
  export let generatedWidth = null;
  export let generatedHeight = null;
  export let generatedFormat = 'png';
  export let toolName = '';

  const DRAFT_KEY = 'pictify_template_draft_v1';

  $: isLoggedIn = !!$user?.email;

  const truncate = (value, max = 1200) => {
    const s = String(value || '');
    if (s.length <= max) return s;
    return `${s.slice(0, max)}\n\n// … truncated for display (${s.length} chars total). Copy uses full snippet.`;
  };

  async function copy(text, successMessage = 'Copied!') {
    try {
      await navigator.clipboard.writeText(String(text || ''));
      toast.set({ message: successMessage, duration: 1500 });
    } catch (e) {
      toast.set({ message: 'Failed to copy', duration: 2000 });
    }
  }

  function saveDraftAndOpenWorkspace() {
    if (!templateDraft) {
      toast.set({ message: 'No template draft available for this tool yet.', duration: 2000 });
      return;
    }

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(templateDraft));
    } catch (e) {
      // If storage fails, still route the user.
    }

    if (isLoggedIn) {
      goto('/template-workspace/create');
    } else {
      // Let guests try the canvas editor before signup.
      goto('/canvas/try');
    }
  }

  $: effectiveBatchSnippet =
    batchSnippet ||
    `curl -X POST https://api.pictify.io/templates/TEMPLATE_UID/batch-render \\\n` +
      `  -H "Content-Type: application/json" \\\n` +
      `  -H "Authorization: Bearer YOUR_API_KEY" \\\n` +
      `  -d '{\n` +
      `    "variableSets": [\n` +
      `      { "title": "Variant 1", "price": "$99" },\n` +
      `      { "title": "Variant 2", "price": "$79" }\n` +
      `    ],\n` +
      `    "format": "png",\n` +
      `    "concurrency": 5\n` +
      `  }'`;
</script>

<section class="w-full max-w-5xl mx-auto mt-8">
  <div class="bg-white border-[3px] border-black shadow-[8px_8px_0_0_#000]">
    <div class="bg-black text-white px-5 py-3 border-b-[3px] border-black flex items-center justify-between">
      <div class="font-black uppercase tracking-widest text-xs">NEXT_STEPS</div>
      <div class="flex gap-2">
        <div class="w-3 h-3 bg-[#ff6b6b] border border-black"></div>
        <div class="w-3 h-3 bg-[#ffc480] border border-black"></div>
        <div class="w-3 h-3 bg-[#4ade80] border border-black"></div>
      </div>
    </div>

    <div class="p-6 md:p-8">
      <div class="mb-6">
        <h3 class="text-2xl md:text-3xl font-black text-black uppercase tracking-tight">{heading}</h3>
        <p class="text-gray-700 font-bold mt-2">{description}</p>
      </div>

      <!-- Share result bar (shown if generatedUrl is provided) -->
      {#if generatedUrl}
        <div class="mb-6 p-4 bg-[#f0fdf4] border-[3px] border-black shadow-[4px_4px_0_0_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 class="text-sm font-black uppercase tracking-widest text-gray-900">Share this result</h4>
            <p class="text-xs font-bold text-gray-600 mt-1">
              Create a shareable link so others can view and remix your creation.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button
              class="px-3 py-1.5 bg-white border-[2px] border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              type="button"
              on:click={() => copy(generatedUrl, 'Image URL copied')}
            >
              Copy URL
            </button>
            <ShareResultButton
              assetUrl={generatedUrl}
              contentType="image"
              width={generatedWidth}
              height={generatedHeight}
              format={generatedFormat}
              source="tool"
              {toolName}
              variant="small"
            />
          </div>
        </div>
      {/if}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Copy API request -->
        <div class="border-[3px] border-black bg-[#FFFDF8] shadow-[4px_4px_0_0_#000] p-5">
          <div class="flex items-center justify-between gap-3">
            <h4 class="text-sm font-black uppercase tracking-widest">Copy API request</h4>
            <button
              class="px-3 py-1.5 bg-[#4ade80] border-[2px] border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              type="button"
              on:click={() => copy(curlSnippet, 'API request copied')}
              disabled={!curlSnippet}
            >
              Copy
            </button>
          </div>
          <p class="text-xs font-bold text-gray-600 mt-2">
            Paste into your backend/automation to reproduce this output programmatically.
          </p>
          <pre class="mt-4 text-xs font-mono bg-white border-[2px] border-black p-3 overflow-auto max-h-48">{truncate(curlSnippet || 'Add a curlSnippet to enable copying.')}</pre>
        </div>

        <!-- Save as template -->
        <div class="border-[3px] border-black bg-[#FFFDF8] shadow-[4px_4px_0_0_#000] p-5">
          <div class="flex items-center justify-between gap-3">
            <h4 class="text-sm font-black uppercase tracking-widest">Save as template</h4>
          </div>
          <p class="text-xs font-bold text-gray-600 mt-2">
            Open the template workspace and start from this design. Then bind variables and batch render variants.
          </p>

          <div class="mt-4 space-y-2">
            <button
              class="w-full py-3 bg-[#ff6b6b] text-white border-[3px] border-black font-black uppercase tracking-wide shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              type="button"
              on:click={saveDraftAndOpenWorkspace}
              disabled={!templateDraft}
            >
              {isLoggedIn ? 'Open template workspace' : 'Create free account + save'}
            </button>
            {#if templateDraft?.backgroundImageUrl}
              <button
                class="w-full py-2 bg-white text-black border-[2px] border-black font-black uppercase tracking-wide shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs"
                type="button"
                on:click={() => copy(templateDraft.backgroundImageUrl, 'Background URL copied')}
              >
                Copy background URL
              </button>
            {/if}
          </div>
        </div>

        <!-- Batch example -->
        <div class="border-[3px] border-black bg-[#FFFDF8] shadow-[4px_4px_0_0_#000] p-5">
          <div class="flex items-center justify-between gap-3">
            <h4 class="text-sm font-black uppercase tracking-widest">Batch 1,000 variants</h4>
            <button
              class="px-3 py-1.5 bg-[#ffc480] border-[2px] border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              type="button"
              on:click={() => copy(effectiveBatchSnippet, 'Batch example copied')}
            >
              Copy
            </button>
          </div>
          <p class="text-xs font-bold text-gray-600 mt-2">
            Once your design is saved as a template, render many variable sets in one job.
          </p>
          <pre class="mt-4 text-xs font-mono bg-white border-[2px] border-black p-3 overflow-auto max-h-48">{truncate(effectiveBatchSnippet)}</pre>
        </div>
      </div>
    </div>
  </div>
</section>
