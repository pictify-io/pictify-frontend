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

<section class="w-full max-w-7xl mx-auto px-6 md:px-0 mt-20">
  <div class="rounded-3xl border-[3px] border-gray-900 bg-[#FFFDF8] shadow-[8px_8px_0_0_#1f2937] overflow-hidden transform transition-transform hover:-translate-y-1">
    <div class="grid gap-12 lg:grid-cols-[1.1fr,1fr] p-8 md:p-12 items-center">
      
      <!-- Left Column: Content -->
      <div class="flex flex-col justify-between gap-8">
        <div class="space-y-6">
          <span class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-900 bg-[#ffc480] px-4 py-1.5 rounded-full border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937]">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            API Ready
          </span>
          
          <div class="space-y-4">
            <h2 class="text-3xl md:text-4xl font-black leading-tight text-gray-900 tracking-tight">{title}</h2>
            <p class="text-lg text-gray-700 leading-relaxed font-medium">{description}</p>
          </div>

          <ul class="space-y-4">
            {#each points as point}
              <li class="flex items-start gap-4 group">
                <span class="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff6b6b] text-white border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] group-hover:translate-y-px group-hover:translate-x-px group-hover:shadow-none transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span class="text-gray-800 font-bold text-lg leading-snug pt-1">{point}</span>
              </li>
            {/each}
          </ul>
        </div>

        <div class="flex flex-wrap gap-4 pt-4">
          <a
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-base font-bold text-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ff6b6b] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#ff6b6b] hover:bg-gray-800"
            href={ctaUrl}
            target="_blank"
          >
            {ctaLabel}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>

          <a
            class="inline-flex items-center justify-center gap-2 rounded-xl border-[3px] border-gray-900 px-6 py-3.5 text-base font-bold text-gray-900 bg-white shadow-[4px_4px_0_0_#1f2937] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#1f2937] hover:bg-gray-50"
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
          >
            {docsLabel}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </a>

          {#if showSecondaryCta && secondaryCtaUrl}
            <a
              class="inline-flex items-center justify-center gap-2 rounded-xl border-[3px] border-gray-900 border-dashed px-6 py-3.5 text-base font-bold text-gray-700 bg-transparent hover:bg-[#ffc480]/10 transition-colors"
              href={secondaryCtaUrl}
              target="_blank"
            >
              {secondaryCtaLabel}
            </a>
          {/if}
        </div>

        {#if note}
          <p class="text-sm font-bold text-gray-500 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#ff6b6b]"></span>
            {note}
          </p>
        {/if}
      </div>

      <!-- Right Column: Code Block -->
      <div class="relative">
        <!-- Decorative dots -->
        <div class="absolute -top-4 -right-4 w-20 h-20 bg-[#ffc480] rounded-full blur-2xl opacity-20"></div>
        <div class="absolute -bottom-4 -left-4 w-20 h-20 bg-[#ff6b6b] rounded-full blur-2xl opacity-20"></div>

        <div class="relative w-full rounded-xl border-[3px] border-gray-900 bg-[#1e1e1e] p-0 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
          <!-- Mac-style Window Header -->
          <div class="bg-[#2d2d2d] px-4 py-3 border-b-2 border-gray-800 flex items-center justify-between">
            <div class="flex gap-2">
              <div class="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div class="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div class="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <span class="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider">BASH</span>
          </div>
          
          <!-- Code Content -->
          <div class="p-6 overflow-x-auto custom-scrollbar">
            <pre class="font-mono text-sm leading-relaxed text-gray-300 whitespace-pre-wrap"><code>{@html renderedCode}</code></pre>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

<style>
  :global(.token-command) {
    color: #ff79c6; /* Pink/Red for command */
    font-weight: 700;
  }

  :global(.token-flag) {
    color: #8be9fd; /* Cyan for flags */
    font-weight: 600;
  }

  :global(.token-url) {
    color: #f1fa8c; /* Yellow for URLs */
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  :global(.token-string) {
    color: #50fa7b; /* Green for strings */
  }

  .custom-scrollbar::-webkit-scrollbar {
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #2d2d2d;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style>