<script>
  export let title = 'Automate this workflow with our API';
  export let description = 'Trigger image generation straight from your product, workflow automations, or CI/CD with a single API call.';
  export let codeSnippet = `curl https://api.pictify.io/image \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -d '{"html":"<html>...</html>","width":1200,"height":630}'`;
  export let codeLanguage = 'bash';
  export let featurePoints = [];
  export let docsUrl = 'https://docs.pictify.io/';
  export let docsLabel = 'Read API docs';
  export let ctaUrl = '/dashboard/api-token';
  export let ctaLabel = 'Get API Key';
  export let secondaryCtaUrl = '/dashboard/api-playground';
  export let secondaryCtaLabel = 'Open API Playground';
  export let showSecondaryCta = true;
  export let note = '';

  const defaultFeatures = [
    'Render images at scale without managing headless browsers',
    'Serve media instantly from our global CDN',
    'Track usage and rotate keys from the dashboard'
  ];

  $: points = featurePoints.length ? featurePoints : defaultFeatures;

  const escapeHtml = (source) =>
    source
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  function highlightCurl(source) {
    const escaped = escapeHtml(source);
    return escaped
      .replace(/^curl/m, '<span class="token-command">curl</span>')
      .replace(/ (-H|-d)/g, (match) => ` <span class="token-flag">${match.trim()}</span>`)
      .replace(/https:\/\/[^\s\\]+/g, (match) => `<span class="token-url">${match}</span>`)
      .replace(/'([^']*)'/g, (match) => `<span class="token-string">${match}</span>`)
      .replace(/\n/g, '<br>');
  }

  $: renderedCode = codeLanguage === 'bash'
    ? highlightCurl(codeSnippet)
    : escapeHtml(codeSnippet).replace(/\n/g, '<br>');
</script>

<section class="w-full max-w-6xl mx-auto px-6 md:px-0 mt-16">
  <div class="rounded-[28px] border-[3px] border-gray-900 bg-[#FFFDF8] shadow-[12px_12px_0px_rgba(17,17,17,0.08)] overflow-hidden">
    <div class="grid gap-10 lg:grid-cols-[1.15fr,1fr] p-8 md:p-12">
      <div class="flex flex-col justify-between gap-8">
        <div class="space-y-4">
          <span class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff6b6b] bg-[#ff6b6b]/10 px-3 py-1 rounded-full w-fit">
            API Ready
          </span>
          <div class="space-y-3">
            <h2 class="text-2xl md:text-3xl font-bold leading-snug text-gray-900">{title}</h2>
            <p class="text-base md:text-lg text-gray-700 leading-relaxed">{description}</p>
          </div>
          <ul class="space-y-3 text-sm md:text-base text-gray-700">
            {#each points as point}
              <li class="flex items-start gap-3">
                <span class="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/30">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span class="leading-relaxed">{point}</span>
              </li>
            {/each}
          </ul>
        </div>

        <div class="flex flex-col gap-3 pt-2">
          <a
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6b6b] px-5 py-3 text-sm font-semibold text-white border-[3px] border-gray-900 transition transform hover:-translate-y-0.5 hover:shadow-lg"
            href={ctaUrl}
            target="_blank"
          >
            {ctaLabel}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>

          <a
            class="inline-flex items-center justify-center gap-2 rounded-xl border-[3px] border-gray-900 px-5 py-3 text-sm font-semibold text-gray-900 bg-white transition hover:bg-[#ffc480]/30"
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
          >
            {docsLabel}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-6.75 7.5l9-9m0 0H15m3.75 0V15" />
            </svg>
          </a>

          {#if showSecondaryCta && secondaryCtaUrl}
            <a
              class="inline-flex items-center justify-center gap-2 rounded-xl border-[3px] border-dashed border-gray-400 px-5 py-3 text-sm font-semibold text-gray-600 bg-white/70 transition hover:border-gray-900 hover:text-gray-900"
              href={secondaryCtaUrl}
              target="_blank"
            >
              {secondaryCtaLabel}
            </a>
          {/if}
        </div>

        {#if note}
          <p class="text-xs text-gray-500">{note}</p>
        {/if}
      </div>

      <div class="relative flex">
        <div class="relative w-full rounded-2xl border-[3px] border-gray-900 bg-white text-gray-900 p-6 shadow-[0_6px_40px_rgba(17,17,17,0.08)]">
          <div class="mb-4 flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-gray-500">
            <span>API Request</span>
            <span>Pictify</span>
          </div>
          <pre class="font-mono text-xs leading-6 text-gray-800 whitespace-pre-wrap"><code>{@html renderedCode}</code></pre>
        </div>
      </div>
    </div>
  </div>
</section>


<style>
  :global(.token-command) {
    color: #0f172a;
    font-weight: 600;
  }

  :global(.token-flag) {
    color: #ff6b6b;
    font-weight: 500;
  }

  :global(.token-url) {
    color: #2563eb;
  }

  :global(.token-string) {
    color: #047857;
  }
</style>
