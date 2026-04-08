<script>
	/**
	 * "Automate with the API" section — reusable across tool pages.
	 * Matches the MarkdownEditor pattern: centered header, language tabs,
	 * Mac-style terminal with VS Code syntax highlighting, CTA buttons.
	 *
	 * Props:
	 * - title: headline (default "Automate with the API")
	 * - description: subheading text
	 * - codeExamples: array of { id, label, fileName, code } — code is pre-highlighted HTML
	 * - languages: optional array of { id, label } for tabs (derived from codeExamples if omitted)
	 */

	export let title = 'Automate with the';
	export let titleHighlight = 'API';
	export let description = 'Generate images programmatically with a single API call.';

	/**
	 * @type {Array<{ id: string, label: string, fileName: string, code: string }>}
	 * `code` should be pre-formatted HTML with <span> syntax highlighting.
	 */
	export let codeExamples = [];
	export let toolName = '';

	import { analytics } from '$lib/analytics.js';

	let selectedLang = codeExamples.length ? codeExamples[0].id : 'javascript';
	$: activeLang = codeExamples.find((e) => e.id === selectedLang) || codeExamples[0];

	function handleSignupClick() {
		analytics.track('tool_signup_click', { tool_name: toolName, cta_location: 'api_code_section' });
	}
</script>

<!-- Programmatic Usage Section -->
<section class="mt-20">
	<div class="text-center mb-12">
		<div class="inline-block bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform rotate-1 rounded-lg">
			<span class="font-black uppercase tracking-widest text-sm">For Developers</span>
		</div>
		<h2 class="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">
			{title} <span class="text-[#ff6b6b]">{titleHighlight}</span>
		</h2>
		<p class="text-lg md:text-xl font-bold text-gray-700 mt-4 max-w-3xl mx-auto">
			{description}
		</p>
	</div>

	{#if codeExamples.length > 0}
		<!-- Language Tabs -->
		<div class="mb-6">
			<div class="flex flex-wrap gap-2">
				{#each codeExamples as lang}
					<button
						on:click={() => (selectedLang = lang.id)}
						class="px-4 py-2 text-sm font-black border-[3px] transition-all rounded-lg uppercase tracking-wider
							{selectedLang === lang.id
								? 'border-gray-900 bg-gray-900 text-white shadow-[3px_3px_0_0_#ffc480]'
								: 'border-gray-900 bg-white text-gray-600 hover:bg-gray-50'}"
					>
						{lang.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Code Snippet -->
		<div class="bg-[#1e1e1e] rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
			<div class="bg-[#2d2d2d] px-4 py-3 border-b-[3px] border-gray-900 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
					<div class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
					<div class="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
				</div>
				<span class="text-xs text-gray-500 font-mono font-bold uppercase tracking-wider">
					{activeLang?.fileName || ''}
				</span>
			</div>
			<div class="p-6 overflow-x-auto">
				<pre class="text-sm font-mono text-gray-300 leading-relaxed"><code>{@html activeLang?.code || ''}</code></pre>
			</div>
		</div>
	{/if}

	<!-- CTA -->
	<div class="text-center mt-12">
		<div class="flex flex-wrap justify-center gap-4">
			<a
				href="/signup"
				on:click={handleSignupClick}
				class="px-8 py-4 bg-gray-900 text-white font-black border-[3px] border-gray-900 rounded-xl uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
			>
				Get API Key
			</a>
			<a
				href="https://docs.pictify.io"
				target="_blank"
				rel="noopener noreferrer"
				class="px-8 py-4 bg-white text-gray-900 font-black border-[3px] border-gray-900 rounded-xl uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
			>
				Read API Docs
			</a>
		</div>
	</div>
</section>
