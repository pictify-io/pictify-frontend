<script>
	/**
	 * HtmlLearnDrawer — always-accessible "how does this work" reference.
	 *
	 * Slides in from the right on `?` click in the topbar. Content is
	 * a condensed Handlebars primer focused on what actually works in
	 * Pictify: the variable syntax, block helpers, our safelisted
	 * helper registry, and the raw-HTML caveat. This is reference,
	 * not onboarding — users come here when they've forgotten how
	 * to format a date or what `{{{triple}}}` does.
	 */
	import { createEventDispatcher, onMount } from 'svelte';

	export let show = false;

	const dispatch = createEventDispatcher();

	// Section tabs within the drawer so users can jump to the topic
	// they need without scrolling 600 lines of reference.
	const SECTIONS = [
		{ key: 'syntax', label: 'Syntax', icon: 'fa-code' },
		{ key: 'helpers', label: 'Helpers', icon: 'fa-wand-magic-sparkles' },
		{ key: 'security', label: 'Safety', icon: 'fa-shield-halved' }
	];
	let activeSection = 'syntax';

	function close() {
		dispatch('close');
	}

	// Esc + backdrop click close the drawer
	function onKey(e) {
		if (show && e.key === 'Escape') close();
	}

	onMount(() => {
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	// Curated helper list. Mirrors service/template-helpers.js on the
	// backend — but condensed to what most users actually reach for,
	// with runnable examples anchored to concrete variables so users
	// can copy-paste them straight into their template.
	const HELPER_EXAMPLES = [
		{
			category: 'Format',
			rows: [
				{ name: 'currency', example: '{{currency price "USD"}}', result: '$42.00' },
				{ name: 'number', example: '{{number count}}', result: '1,234' },
				{ name: 'percent', example: '{{percent ratio}}', result: '72%' },
				{ name: 'date', example: '{{date createdAt "long"}}', result: 'April 18, 2026' },
				{ name: 'time', example: '{{time timestamp}}', result: '2:30 PM' }
			]
		},
		{
			category: 'String',
			rows: [
				{ name: 'uppercase', example: '{{uppercase name}}', result: 'JANE' },
				{ name: 'lowercase', example: '{{lowercase name}}', result: 'jane' },
				{ name: 'titleCase', example: '{{titleCase title}}', result: 'Hello World' },
				{ name: 'capitalize', example: '{{capitalize word}}', result: 'Hello' },
				{ name: 'truncate', example: '{{truncate body 40}}', result: 'Lorem ipsum dolor sit amet…' },
				{ name: 'trim', example: '{{trim value}}', result: '(whitespace removed)' }
			]
		},
		{
			category: 'Logic + fallback',
			rows: [
				{ name: 'default', example: '{{default name "Guest"}}', result: 'Guest' },
				{ name: 'coalesce', example: '{{coalesce a b c}}', result: 'first non-null' },
				{ name: 'isEmpty', example: '{{#if (isEmpty items)}}…', result: 'boolean' },
				{ name: 'contains', example: '{{contains tags "new"}}', result: 'boolean' }
			]
		},
		{
			category: 'Math',
			rows: [
				{ name: 'round', example: '{{round price 2}}', result: '42.35' },
				{ name: 'sum', example: '{{sum amounts}}', result: '1234' },
				{ name: 'average', example: '{{average scores}}', result: '87.5' }
			]
		}
	];
</script>

{#if show}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-[130] bg-black/40 backdrop-blur-sm"
		on:click|self={close}
	>
		<aside
			class="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l-[3px] border-gray-900 bg-[#FFFDF8] shadow-[-8px_0_0_0_#1f2937]"
			role="dialog"
			aria-modal="true"
			aria-label="Template syntax reference"
		>
			<!-- Header -->
			<div class="flex items-center justify-between gap-3 border-b-[3px] border-gray-900 bg-[#ffc480] px-5 py-4">
				<div class="flex items-center gap-2">
					<div class="flex h-8 w-8 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white shadow-[2px_2px_0_0_#1f2937]">
						<i class="fa fa-book-open text-[12px] text-gray-900"></i>
					</div>
					<div>
						<h2 class="text-sm font-black uppercase tracking-widest text-gray-900">
							How templates work
						</h2>
						<p class="mt-0.5 text-[10px] font-bold text-gray-700">
							Handlebars primer for Pictify
						</p>
					</div>
				</div>
				<button
					type="button"
					on:click={close}
					aria-label="Close"
					class="flex h-8 w-8 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white text-gray-700 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-900 hover:text-white hover:shadow-none"
				>
					<i class="fa fa-xmark text-[12px]"></i>
				</button>
			</div>

			<!-- Section tabs -->
			<nav class="flex items-center gap-1.5 border-b-[2px] border-gray-900 bg-white px-4 py-2" aria-label="Reference sections">
				{#each SECTIONS as sec}
					<button
						type="button"
						on:click={() => (activeSection = sec.key)}
						class="flex flex-1 items-center justify-center gap-1.5 rounded-md border-[2px] border-gray-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all
							{activeSection === sec.key
								? 'bg-gray-900 text-white shadow-[2px_2px_0_0_#1f2937]'
								: 'bg-white text-gray-700 hover:shadow-[1px_1px_0_0_#1f2937]'}"
					>
						<i class="fa {sec.icon} text-[10px]"></i>
						{sec.label}
					</button>
				{/each}
			</nav>

			<!-- Body -->
			<div class="flex-1 overflow-y-auto px-5 py-5">
				{#if activeSection === 'syntax'}
					<div class="space-y-5">
						<section>
							<h3 class="text-[11px] font-black uppercase tracking-widest text-gray-900">
								Variables
							</h3>
							<p class="mt-1.5 text-[12px] font-semibold leading-relaxed text-gray-700">
								Anywhere in your HTML, wrap a name in double braces to substitute a value at render time.
							</p>
							<pre class="mt-2 overflow-hidden rounded-lg border-[2px] border-gray-900 bg-gray-900 p-3 font-mono text-[11px] leading-relaxed text-[#ffc480]"><code>{`<h1>{{title}}</h1>
<p>{{subtitle}}</p>`}</code></pre>
							<p class="mt-2 text-[11px] font-bold text-gray-600">
								Undeclared names auto-add as text variables when you save.
							</p>
						</section>

						<section>
							<h3 class="text-[11px] font-black uppercase tracking-widest text-gray-900">
								Conditionals
							</h3>
							<p class="mt-1.5 text-[12px] font-semibold leading-relaxed text-gray-700">
								Show a block only when a value is truthy.
							</p>
							<pre class="mt-2 overflow-hidden rounded-lg border-[2px] border-gray-900 bg-gray-900 p-3 font-mono text-[11px] leading-relaxed text-[#ffc480]"><code>{`{{#if isPremium}}
  <span>Pro member</span>
{{else}}
  <span>Free</span>
{{/if}}`}</code></pre>
							<p class="mt-2 text-[11px] font-bold text-gray-600">
								<code class="rounded-md border-[1.5px] border-gray-900 bg-gray-900 px-1 py-0.5 font-mono text-[10px] text-[#ffc480]">{'{{#unless}}'}</code>
								is the opposite — renders when falsy.
							</p>
						</section>

						<section>
							<h3 class="text-[11px] font-black uppercase tracking-widest text-gray-900">
								Loops
							</h3>
							<p class="mt-1.5 text-[12px] font-semibold leading-relaxed text-gray-700">
								Iterate over an array. Reference the current item with <code class="font-mono">this</code>.
							</p>
							<pre class="mt-2 overflow-hidden rounded-lg border-[2px] border-gray-900 bg-gray-900 p-3 font-mono text-[11px] leading-relaxed text-[#ffc480]"><code>{`{{#each items}}
  <li>{{this.name}} — {{currency this.price "USD"}}</li>
{{/each}}`}</code></pre>
							<p class="mt-2 text-[11px] font-bold text-gray-600">
								<code class="rounded-md border-[1.5px] border-gray-900 bg-gray-900 px-1 py-0.5 font-mono text-[10px] text-[#ffc480]">{'{{@index}}'}</code>
								gives you the current position,
								<code class="ml-1 rounded-md border-[1.5px] border-gray-900 bg-gray-900 px-1 py-0.5 font-mono text-[10px] text-[#ffc480]">{'{{@first}}'}</code>
								and
								<code class="ml-1 rounded-md border-[1.5px] border-gray-900 bg-gray-900 px-1 py-0.5 font-mono text-[10px] text-[#ffc480]">{'{{@last}}'}</code>
								are handy for styling rows.
							</p>
							<div class="mt-3 rounded-lg border-[2px] border-gray-900 bg-[#ffe066] px-3 py-2">
								<p class="text-[11px] font-bold leading-snug text-gray-900">
									<i class="fa fa-cube mr-1 text-[10px]"></i>
									Set <code class="rounded border-[1.5px] border-gray-900 bg-gray-900 px-1 font-mono text-[10px] text-[#ffc480]">items</code> to type
									<strong class="font-black">Array</strong> in the Variables panel so the API accepts JSON payloads. Use
									<strong class="font-black">Object</strong> for nested
									<code class="rounded border-[1.5px] border-gray-900 bg-gray-900 px-1 font-mono text-[10px] text-[#ffc480]">{'{{user.name}}'}</code> access.
								</p>
							</div>
						</section>
					</div>

				{:else if activeSection === 'helpers'}
					<div class="space-y-5">
						<p class="text-[12px] font-semibold leading-relaxed text-gray-700">
							Call a helper by writing its name before the value:
							<code class="rounded-md border-[1.5px] border-gray-900 bg-gray-900 px-1 py-0.5 font-mono text-[10px] text-[#ffc480]">{'{{helper input "arg"}}'}</code>.
							Nest helpers with parentheses:
							<code class="rounded-md border-[1.5px] border-gray-900 bg-gray-900 px-1 py-0.5 font-mono text-[10px] text-[#ffc480]">{'{{uppercase (trim name)}}'}</code>.
						</p>

						{#each HELPER_EXAMPLES as group}
							<section>
								<h3 class="text-[11px] font-black uppercase tracking-widest text-gray-900">
									{group.category}
								</h3>
								<div class="mt-2 space-y-1.5">
									{#each group.rows as row}
										<div class="rounded-lg border-[2px] border-gray-900 bg-white px-3 py-2">
											<div class="flex items-center gap-2">
												<span class="rounded border-[1.5px] border-gray-900 bg-[#ffc480] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-widest text-gray-900">
													{row.name}
												</span>
												<code class="flex-1 truncate font-mono text-[11px] text-gray-900">{row.example}</code>
											</div>
											<p class="mt-1 pl-1 font-mono text-[10px] text-gray-500">
												→ {row.result}
											</p>
										</div>
									{/each}
								</div>
							</section>
						{/each}
					</div>

				{:else if activeSection === 'security'}
					<div class="space-y-5">
						<section>
							<h3 class="text-[11px] font-black uppercase tracking-widest text-gray-900">
								Values are HTML-escaped by default
							</h3>
							<p class="mt-1.5 text-[12px] font-semibold leading-relaxed text-gray-700">
								<code class="rounded-md border-[1.5px] border-gray-900 bg-gray-900 px-1 py-0.5 font-mono text-[10px] text-[#ffc480]">{'{{name}}'}</code>
								treats the value as text. If <code class="font-mono">name</code> is
								<code class="font-mono">&lt;script&gt;alert(1)&lt;/script&gt;</code>
								it renders as literal text — safe by default.
							</p>
						</section>

						<section>
							<div class="rounded-lg border-[3px] border-gray-900 bg-[#ff6b6b]/10 p-4">
								<div class="flex items-center gap-2">
									<div class="flex h-7 w-7 items-center justify-center rounded-md border-[2px] border-gray-900 bg-[#ff6b6b] shadow-[2px_2px_0_0_#1f2937]">
										<i class="fa fa-triangle-exclamation text-[11px] text-white"></i>
									</div>
									<h3 class="text-[11px] font-black uppercase tracking-widest text-gray-900">
										Raw HTML — dangerous
									</h3>
								</div>
								<p class="mt-2 text-[12px] font-semibold leading-relaxed text-gray-800">
									<code class="rounded-md border-[1.5px] border-gray-900 bg-gray-900 px-1 py-0.5 font-mono text-[10px] text-[#ffc480]">{'{{{raw}}}'}</code>
									(triple brace) skips escaping and injects the value as HTML. Only enable a variable's
									<span class="rounded border-[1.5px] border-gray-900 bg-[#ff6b6b] px-1 py-0 font-black uppercase tracking-widest text-white">Raw HTML</span>
									toggle when you fully trust the source. Never use raw with user input.
								</p>
							</div>
						</section>

						<section>
							<h3 class="text-[11px] font-black uppercase tracking-widest text-gray-900">
								Strict variables (Settings)
							</h3>
							<p class="mt-1.5 text-[12px] font-semibold leading-relaxed text-gray-700">
								Off by default — missing variables render empty. Turn it on to get
								a <code class="font-mono">422</code> error at render time when the
								API caller forgets a required value. Helpful for CI-tested templates.
							</p>
						</section>

						<section>
							<h3 class="text-[11px] font-black uppercase tracking-widest text-gray-900">
								JavaScript at render time
							</h3>
							<p class="mt-1.5 text-[12px] font-semibold leading-relaxed text-gray-700">
								JS is OFF by default so templates render fast and can't hang. Enable it
								only for templates that need Chart.js, KaTeX, or animated SVG.
							</p>
						</section>
					</div>
				{/if}
			</div>

			<!-- Footer hint -->
			<div class="flex items-center justify-between border-t-[2px] border-gray-900 bg-gray-50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">
				<span>
					<i class="fa fa-keyboard mr-1 text-[10px]"></i>
					Press Esc to close
				</span>
				<span class="text-gray-400">Handlebars 4.7</span>
			</div>
		</aside>
	</div>
{/if}
