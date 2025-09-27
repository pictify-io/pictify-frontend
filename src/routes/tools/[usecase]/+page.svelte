<script>
import Nav from '$lib/components/landingPage/Nav.svelte';
import Footer from '$lib/components/landingPage/Footer.svelte';
import ApiPromptSection from '$lib/components/tools/ApiPromptSection.svelte';
  import { page } from '$app/stores';
  import { useCases, useCaseDetails, formats, popularSizes, baseFormatUrl, sizeUrl, parseSize } from '$lib/pseo/config.js';
  import UseCaseEditor from '$lib/components/tools/UseCaseEditor.svelte';
  import { createImagePublic } from '../../../api/image.js';
  import { toast } from '../../../store/toast.store';

  $: useCaseId = $page.params.usecase;
  $: config = useCaseDetails[useCaseId];
  $: useCase = config ? useCases.find((u) => u.id === useCaseId) : null;
  $: validCase = !!useCase;
  $: title = validCase ? `${config.label} | Pictify.io` : 'Use Case | Pictify.io';
  $: description = validCase
    ? config.description
    : 'Convert HTML to images instantly with Pictify.io.';
  $: canonical = validCase
    ? `https://pictify.io/tools/${useCaseId}`
    : 'https://pictify.io/tools';

const fallbackTemplate = `<html>
  <head>
    <style>
      body { font-family: Inter, sans-serif; background:#f7f4eb; margin:0; padding:32px; }
      .card { max-width: 800px; margin:0 auto; background:#fff; border:3px solid #222; border-radius:16px; padding:40px; }
      h1 { margin:0 0 16px; font-size:32px; color:#111; }
      p { font-size:18px; line-height:1.5; color:#444; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Pictify Demo</h1>
      <p>Edit this template with your own HTML content to create a polished image instantly.</p>
    </div>
  </body>
</html>`;
const availableFormats = formats.map((f) => f.id);
const defaultSize = parseSize(popularSizes[0]);

let editorHtml = '';
let selectedFormat = 'png';
let selectedSize = '';
let width = (defaultSize.width || 1200).toString();
let height = (defaultSize.height || 630).toString();
let lastUseCaseId = null;
let previewWidthPx = defaultSize.width || 1200;
let previewHeightPx = defaultSize.height || 630;
let isGenerating = false;
let generatedImage = null;
let generationError = '';
let generationCount = 0;

const apiFeatureBullets = [
	'Generate on-brand visuals for this workflow directly from your app or automation',
	'Render HTML to image, gif, or custom sizes with a single REST call',
	'Manage API tokens, usage analytics, and rate limits from the Pictify dashboard'
];

const baseApiSnippet = `curl -X POST https://api.pictify.io/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "html": "HTML_CONTENT",
    "width": WIDTH_PLACEHOLDER,
    "height": HEIGHT_PLACEHOLDER,
    "fileExtension": "FORMAT_PLACEHOLDER"
  }'`;

  $: formatOptions = config && config.recommendedFormats && config.recommendedFormats.length
    ? config.recommendedFormats
    : availableFormats;
  $: sizeOptions = config && config.recommendedSizes && config.recommendedSizes.length
    ? config.recommendedSizes
    : popularSizes;
  $: primarySizeFormat = ((selectedFormat && selectedFormat.toLowerCase())
    || (formatOptions && formatOptions.length && String(formatOptions[0]).toLowerCase())
    || 'jpg');

  $: if (config && useCaseId !== lastUseCaseId) {
    editorHtml = config.templateHtml || fallbackTemplate;
    selectedFormat = (formatOptions && formatOptions.length ? formatOptions[0] : 'png') || 'png';
    const sizeSeed = sizeOptions && sizeOptions.length ? parseSize(sizeOptions[0]) : defaultSize;
    width = (sizeSeed.width || defaultSize.width || 1200).toString();
    height = (sizeSeed.height || defaultSize.height || 630).toString();
    selectedSize = sizeOptions && sizeOptions.length ? sizeOptions[0] : '';
  previewWidthPx = sizeSeed.width || defaultSize.width || 1200;
  previewHeightPx = sizeSeed.height || defaultSize.height || 630;
  generatedImage = null;
  generationError = '';
    lastUseCaseId = useCaseId;
  }

  $: numericWidth = Number(width) || defaultSize.width || 1200;
  $: numericHeight = Number(height) || defaultSize.height || 630;
$: previewWidthPx = numericWidth;
$: previewHeightPx = numericHeight;

  function selectFormat(fmt) {
    selectedFormat = fmt;
  }

  function applySizePreset(size) {
    const dims = parseSize(size);
    if (dims.width && dims.height) {
      width = dims.width.toString();
      height = dims.height.toString();
      selectedSize = size;
    }
  }

  function handleWidthInput(event) {
    width = event.target.value;
    selectedSize = '';
  }

  function handleHeightInput(event) {
    height = event.target.value;
    selectedSize = '';
  }

async function generateImage() {
  if (isGenerating) {
    return;
  }

  generationError = '';

  if (!editorHtml.trim()) {
    generationError = 'Please add HTML in the editor before generating.';
    return;
  }

  if (!numericWidth || !numericHeight) {
    generationError = 'Dimensions must be greater than zero.';
    return;
  }

  isGenerating = true;

  try {
    const { image } = await createImagePublic({
      html: editorHtml,
      width: Number(numericWidth),
      height: Number(numericHeight),
      fileExtension: selectedFormat
    });

    generatedImage = image;
    generationCount += 1;
    toast.set({ message: 'Image generated!', duration: 2000 });
  } catch (error) {
    generationError = 'Generation failed. Please try again or adjust the HTML.';
  } finally {
    isGenerating = false;
  }
}
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description}>
  <link rel="canonical" href={canonical}>
</svelte:head>

<section class="bg-[#FFFDF8] min-h-screen flex flex-col">
  <Nav />

  <main class="w-full py-10 px-6 flex-1 max-w-5xl mx-auto space-y-10">
    {#if validCase}
      <header class="text-center space-y-3">
        <h1 class="text-4xl sm:text-5xl font-bold">{config.label}</h1>
        <p class="text-lg text-gray-700 max-w-3xl mx-auto">{config.description}</p>
      </header>

      <section class="bg-white/90 rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
        <h2 class="text-2xl font-bold text-gray-900">Try it instantly</h2>
        <p class="text-gray-700">Use the sample template below or paste your own HTML to generate an image in seconds.</p>
        <div class="space-y-5">
          <div class="flex flex-col lg:flex-row lg:items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-700">Format</span>
              <div class="flex flex-wrap gap-2">
                {#each formatOptions as fmt}
                  <button
                    class={`px-3 py-1.5 rounded-lg border text-sm transition ${selectedFormat === fmt ? 'border-[#ff6b6b] bg-[#ff6b6b]/10 text-[#ff6b6b] font-semibold' : 'border-gray-300 bg-white hover:border-gray-400 text-gray-700'}`}
                    type="button"
                    on:click={() => selectFormat(fmt)}
                  >
                    {fmt.toUpperCase()}
                  </button>
                {/each}
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <label for="usecase-width" class="text-sm font-medium text-gray-700">Width</label>
                <input
                  id="usecase-width"
                  type="number"
                  min="100"
                  class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-[#ff6b6b] focus:ring-2 focus:ring-[#ff6b6b]/40"
                  value={width}
                  on:input={handleWidthInput}
                />
              </div>
              <span class="text-gray-400">×</span>
              <div class="flex items-center gap-2">
                <label for="usecase-height" class="text-sm font-medium text-gray-700">Height</label>
                <input
                  id="usecase-height"
                  type="number"
                  min="100"
                  class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-[#ff6b6b] focus:ring-2 focus:ring-[#ff6b6b]/40"
                  value={height}
                  on:input={handleHeightInput}
                />
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-700">Popular sizes</p>
            <div class="flex flex-wrap gap-2">
              {#each sizeOptions as size}
                <button
                  class={`px-3 py-1.5 rounded-lg border text-sm transition ${selectedSize === size ? 'border-[#ff6b6b] bg-[#ff6b6b]/10 text-[#ff6b6b] font-semibold' : 'border-gray-300 bg-white hover:border-gray-400 text-gray-700'}`}
                  type="button"
                  on:click={() => applySizePreset(size)}
                >
                  {size}
                </button>
              {/each}
            </div>
          </div>

        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <UseCaseEditor bind:html={editorHtml} width={numericWidth} height={numericHeight} />
        </div>

          <div class="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div class="flex items-center gap-3 text-sm text-gray-600">
              <div class="px-3 py-1.5 rounded-lg border border-gray-200 bg-white">
                Canvas: {previewWidthPx} × {previewHeightPx}px
              </div>
              <div class="px-3 py-1.5 rounded-lg border border-gray-200 bg-white capitalize">
                Format: {selectedFormat}
              </div>
              {#if generationCount > 0}
                <span class="text-[#ff6b6b] font-medium">Generated {generationCount} {generationCount === 1 ? 'image' : 'images'} so far</span>
              {/if}
            </div>

            <button
              class="inline-flex items-center justify-center px-5 py-3 border-[3px] border-gray-900 bg-[#ffc480] text-gray-900 font-semibold rounded-lg disabled:opacity-60 transition-all hover:shadow-md"
              on:click={generateImage}
              disabled={isGenerating}
            >
              {#if isGenerating}
                <span>Generating…</span>
              {:else}
                <span>Generate {selectedFormat.toUpperCase()} Image</span>
              {/if}
            </button>
          </div>

          {#if generationError}
            <p class="text-sm text-[#ff6b6b]">{generationError}</p>
          {/if}

          {#if generatedImage}
          <div class="border border-gray-200 rounded-2xl p-4 bg-white space-y-4">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <h3 class="font-semibold text-gray-900">Generated image</h3>
                <div class="flex items-center gap-3 text-sm">
                  <a href={generatedImage.url} target="_blank" rel="noopener" class="text-[#ff6b6b] hover:underline">Open in new tab →</a>
                  <button
                    class="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:border-gray-400"
                    type="button"
                    on:click={() => {
                      navigator.clipboard.writeText(generatedImage.url);
                      toast.set({ message: 'Link copied!', duration: 1500 });
                    }}
                  >
                    Copy link
                  </button>
                </div>
              </div>
              <code class="block text-xs text-gray-500 break-all">{generatedImage.url}</code>
              <div class="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                <img src={generatedImage.url} alt={`Generated ${config.label} preview`} class="w-full h-auto" loading="lazy">
              </div>
            </div>
          {/if}
        </div>
      </section>

      <article class="bg-white/90 rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-8">
        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Why teams choose this workflow</h2>
          <p class="text-gray-700 leading-7">{config.overview[0]}</p>
          <p class="text-gray-700 leading-7">{config.overview[1]}</p>
        </section>

        <section>
          <h3 class="text-xl font-semibold text-gray-900 mb-3">Common pain points solved</h3>
          <ul class="space-y-2 text-gray-700">
            {#each config.painPoints as point}
              <li class="flex gap-2">
                <span>•</span>
                <span>{point}</span>
              </li>
            {/each}
          </ul>
        </section>

        <section>
          <h3 class="text-xl font-semibold text-gray-900 mb-3">Step-by-step</h3>
          <ol class="list-decimal list-inside text-gray-700 space-y-2">
            {#each config.workflow as step}
              <li>
                <span class="font-medium text-gray-900">{step.title}</span>
                <p class="text-gray-600 text-sm">{step.detail}</p>
              </li>
            {/each}
          </ol>
        </section>

        <section>
          <h3 class="text-xl font-semibold text-gray-900 mb-3">Recommended formats</h3>
          <div class="flex flex-wrap gap-3">
            {#each (config.recommendedFormats || formats.map((f) => f.id)) as fmt}
              <a href={baseFormatUrl(fmt)} class="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:border-gray-400 text-sm">
                {fmt.toUpperCase()}
              </a>
            {/each}
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mt-6 mb-2">Recommended sizes</h3>
          <div class="flex flex-wrap gap-3">
            {#each (config.recommendedSizes || popularSizes) as size}
              <a href={sizeUrl(primarySizeFormat, size)} class="px-3 py-1 rounded border border-gray-300 text-sm bg-white hover:border-gray-400">{size}</a>
            {/each}
          </div>
        </section>

        <section>
          <ApiPromptSection
            title={`Automate ${config.label} visuals with our API`}
            description="Trigger this workflow programmatically to create personalized, on-brand images right inside your product or campaigns."
            featurePoints={apiFeatureBullets}
            codeSnippet={baseApiSnippet
              .replace('WIDTH_PLACEHOLDER', numericWidth || defaultSize.width || 1200)
              .replace('HEIGHT_PLACEHOLDER', numericHeight || defaultSize.height || 630)
              .replace('FORMAT_PLACEHOLDER', selectedFormat)}
            codeLanguage="bash"
            docsUrl="https://docs.pictify.io/"
            docsLabel="View API docs"
            secondaryCtaUrl="/dashboard/api-playground"
            secondaryCtaLabel="Open API Playground"
            note="Need custom templates or SLAs? Contact us for enterprise support."
          />
        </section>

        <section>
          <h3 class="text-xl font-semibold text-gray-900 mb-3">FAQs</h3>
          <div class="space-y-4">
            {#each config.faqs as faq}
              <details class="bg-white border border-gray-200 rounded-xl p-4">
                <summary class="font-medium text-gray-900 cursor-pointer">{faq.q}</summary>
                <p class="mt-2 text-gray-700 text-sm leading-6">{faq.a}</p>
              </details>
            {/each}
          </div>
        </section>

        <div class="flex flex-wrap gap-3">
          <a href="/tools/html-to-jpg" class="px-4 py-3 border-[3px] border-gray-900 bg-[#ffc480] text-gray-900 font-semibold rounded-lg">Open HTML to Image Converter</a>
          <a href="/tools/html-to-png" class="px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400">Try PNG output</a>
          <a href="/tools" class="px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400">Explore all tools</a>
        </div>
      </article>

      <section class="bg-white/90 rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Related workflows</h2>
        <div class="flex flex-wrap gap-3">
          {#each config.related as relatedId}
            <a href={`/tools/${relatedId}`} class="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:border-[#ff6b6b]/40 text-sm">
              {useCaseDetails[relatedId].label}
            </a>
          {/each}
        </div>
      </section>

    {:else}
      <div class="text-center space-y-4 py-20">
        <h1 class="text-3xl font-bold">Use case not found</h1>
        <p class="text-gray-700">Explore all tools and use cases at Pictify.io.</p>
        <a href="/tools" class="inline-block py-3 px-6 rounded-lg border-[3px] border-gray-900 bg-[#ffc480] text-gray-900 font-semibold">View all tools</a>
      </div>
    {/if}
  </main>

  <Footer />
</section>



