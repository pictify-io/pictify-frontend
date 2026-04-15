<script>
	/**
	 * Breadcrumb nav for /tools/* pages: Home / Tools / {label}.
	 *
	 * DOM contract: markup must match what certificate-generator, tweet-screenshot,
	 * and online-invoice-generator emit today. Some pages wrap this in `mb-8` vs
	 * `mb-12` at the call site — the outer margin is the caller's responsibility,
	 * so we keep it configurable via a single `marginClass` prop that defaults to
	 * the most common value.
	 *
	 * See plan: docs/plans/2026-04-15-002-refactor-tool-scaffold-plan.md
	 */
	export let label = '';
	/**
	 * Margin utility applied to the <nav>. Defaults to mb-12 (cert-gen + invoice).
	 * tweet-screenshot uses `mb-8` — pass that explicitly.
	 */
	export let marginClass = 'mb-12';
	/** Parent section in the trail. Tools pages use { href: '/tools', label: 'Tools' } (default). Solutions pages pass { href: '/solutions', label: 'Solutions' }. */
	export let parent = { href: '/tools', label: 'Tools' };
</script>

<nav class="{marginClass} flex justify-center">
	<ol
		class="inline-flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937]"
	>
		<li><a href="/" class="text-gray-500 hover:text-gray-900 transition-colors">Home</a></li>
		<li class="text-gray-300">/</li>
		<li>
			<a href={parent.href} class="text-gray-500 hover:text-gray-900 transition-colors">{parent.label}</a>
		</li>
		<li class="text-gray-300">/</li>
		<li class="text-gray-900">{label}</li>
	</ol>
</nav>
