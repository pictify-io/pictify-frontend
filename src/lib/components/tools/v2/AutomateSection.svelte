<script>
	/**
	 * "Automate with the API" — the v2 skin of ApiCodeSection.
	 *
	 * Same props, same code examples, same <h2> text: these pages rank, so the
	 * heading keeps its live wording rather than the board's placeholder line.
	 * Only the layout and the CTA strings change.
	 *
	 * cta_location stays `api_code_section` so the existing PostHog series keeps
	 * running instead of splitting in two.
	 */
	import { analytics } from '$lib/telemetry.js';
	import { toast } from '../../../../store/toast.store';

	export let title = 'Automate with the';
	export let titleHighlight = 'API';
	export let description = 'Generate images programmatically with a single API call.';
	/** @type {Array<{ id: string, label: string, fileName: string, code: string }>} */
	export let codeExamples = [];
	export let toolName = '';
	/** Plain-text version of the active snippet, for the copy button. */
	export let plainExamples = {};

	let selectedLang = codeExamples.length ? codeExamples[0].id : '';
	let copied = false;

	$: activeLang = codeExamples.find((e) => e.id === selectedLang) || codeExamples[0];

	function handleSignupClick() {
		analytics.track('tool_signup_click', { tool_name: toolName, cta_location: 'api_code_section' });
	}

	async function copySnippet() {
		const text = plainExamples[activeLang?.id];
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			analytics.trackCopy({
				content_type: 'api_snippet',
				context: 'automate_section',
				tool_name: toolName
			});
			setTimeout(() => (copied = false), 2000);
		} catch {
			toast.set({ message: 'Failed to copy', type: 'error', duration: 2000 });
		}
	}
</script>

<section class="flex flex-col gap-8 lg:flex-row lg:gap-8">
	<div class="flex flex-1 flex-col justify-center gap-3">
		<p class="font-mono text-[11px] font-bold tracking-[0.08em] text-brand-royal">
			THIS TOOL IS THIS CALL
		</p>
		<h2
			class="font-display text-[26px] font-extrabold leading-[32px] tracking-[-0.015em] text-brand-ink lg:text-[30px] lg:leading-9"
		>
			{title}
			{titleHighlight}
		</h2>
		<p class="font-sans text-[15px] leading-[23px] text-brand-slate">
			{description}
		</p>
		<a
			href="/signup"
			on:click={handleSignupClick}
			class="mt-1 flex h-11 w-max items-center rounded-lg bg-brand-ink px-5 font-sans text-sm font-semibold text-white shadow-[2px_2px_0_0_#FF48B0] transition-opacity hover:opacity-90"
		>
			Get your API key
		</a>
	</div>

	{#if codeExamples.length}
		<div class="w-full overflow-hidden rounded-tile lg:w-[620px] lg:flex-shrink-0">
			<div class="flex items-center justify-between bg-brand-press px-4 py-2">
				<div class="flex flex-wrap gap-1.5">
					{#each codeExamples as lang (lang.id)}
						<button
							type="button"
							on:click={() => (selectedLang = lang.id)}
							class="rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] {selectedLang ===
							lang.id
								? 'bg-brand-field font-bold text-brand-ink'
								: 'border border-[#ADB9C666] text-brand-press-text hover:text-white'}"
						>
							{lang.label}
						</button>
					{/each}
				</div>
				<button
					type="button"
					on:click={copySnippet}
					class="rounded border border-[#ADB9C666] px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] text-brand-press-text hover:text-white"
				>
					{copied ? 'COPIED' : 'COPY'}
				</button>
			</div>
			<div class="overflow-x-auto bg-brand-press-deep p-4">
				<pre class="font-mono text-[12px] leading-[20px] text-[#ADB9C6]"><code
						>{@html activeLang?.code || ''}</code
					></pre>
			</div>
		</div>
	{/if}
</section>
