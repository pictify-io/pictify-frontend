<script>
	/**
	 * The studio, embedded in a tool page. TS-1a (board TS-03 `KW3-0`).
	 *
	 * Not a link to an editor and not a separate page: the tool page IS the
	 * editor, the way Canva's and Figma's free tools work. A visitor lands on
	 * `/tools/og-image-generator`, sees a drawn card, and can change it — no
	 * account, no navigation, nothing empty.
	 *
	 * THE PAGE OPENS ALREADY DRAWN, which is the rule the layout is built
	 * around: a default template with sample text and one element selected, so
	 * no panel is ever showing its empty state to a first-time visitor. An
	 * editor that opens blank asks the visitor to do the work of imagining what
	 * it is for.
	 *
	 * Composition over configuration: the canvas and the rails are passed in as
	 * slots, so this component owns the CHROME — the strip, the templates
	 * panel, the URL band, the toolbar — and the page owns the studio wiring it
	 * already has. That is what keeps it usable for the certificate and invoice
	 * tools next without a rewrite.
	 */
	import { createEventDispatcher } from 'svelte';

	/** `[{ key, name, category, thumbnail }]` — the tool's gallery. */
	export let templates = [];
	/**
	 * What the left panel offers. TS-7 (matrix in handoff §9b).
	 *
	 * `templates` for most tools, `styles` for markdown/table, `themes` for the
	 * code tools. They differ only in what the items MEAN, so they share the
	 * panel and differ in its heading and its footnote — three near-identical
	 * panels would drift apart within two tools.
	 */
	export let leftPanel = 'templates';
	/** Width of the code zone. The board asks for 460 px. */
	export let codeWidth = 460;
	/** design | code — the code tools open on the markup, not the canvas. */
	export let opensIn = 'design';
	/** say | selection | inputs — certificate and invoice open on Inputs. */
	export let defaultTab = 'say';
	/**
	 * `{ label, href }`. Certificate's "One certificate is also a thousand",
	 * shown under the canvas because it is the thing a visitor realises AFTER
	 * they have made one.
	 */
	export let bulkLeadIn = null;
	/** Which one is drawn now, so the panel can say IN USE. */
	export let activeTemplate = null;
	/** design | code | preview */
	export let mode = opensIn === 'code' ? 'code' : 'design';
	/** say | selection | inputs */
	export let panel = defaultTab;
	export let canUndo = false;
	export let canRedo = false;
	export let busy = false;
	/** From the server's `X-Guest-*` headers, never from localStorage alone. */
	export let downloadsLeft = null;
	export let downloadsLimit = 5;
	export let format = 'png';
	export let saving = false;
	/** The gallery's native size, so a scaled thumbnail keeps its aspect. */
	export let thumbSourceWidth = 1200;
	export let thumbSourceHeight = 630;

	const dispatch = createEventDispatcher();

	const MODES = [
		{ key: 'design', label: 'Design' },
		{ key: 'code', label: 'Code' },
		{ key: 'preview', label: 'Preview' }
	];
	const PANELS = [
		{ key: 'say', label: 'Say it' },
		{ key: 'selection', label: 'Selection' },
		{ key: 'inputs', label: 'Inputs' }
	];
	/**
	 * What this tool can produce. An invoice's primary is a PDF, an OG image's
	 * is a PNG — the chip row is the tool's own, not a fixed three.
	 */
	export let formats = ['png', 'jpg', 'webp'];

	/*
	 * The three panel kinds say what swapping actually does, because it is
	 * different each time: a template changes the layout, a style changes how
	 * the same text is set, a theme changes only the colours of the code.
	 */
	const PANEL_LABEL = { templates: 'Templates', styles: 'Styles', themes: 'Themes' };
	const PANEL_FOOT = {
		templates: 'Click one to swap the layout. Your text and colours stay.',
		styles: 'Click one to restyle. Your words stay exactly as they are.',
		themes: 'Click one to recolour. Your code is untouched.'
	};

	/** Categories come from the data, so a new template file needs no code. */
	$: categories = ['all', ...new Set(templates.map((t) => t.category).filter(Boolean))];
	let category = 'all';
	$: shown = category === 'all' ? templates : templates.filter((t) => t.category === category);

	/*
	 * `null` while the server has not answered yet — drawn as a neutral state
	 * rather than as zero. Showing "0 free today" before the count arrives
	 * tells a visitor they are locked out when they are not.
	 */
	$: outOfDownloads = downloadsLeft !== null && downloadsLeft <= 0;
</script>

<div
	class="overflow-hidden rounded-[12px] border-[1.5px] border-brand-ink bg-brand-paper shadow-[6px_6px_0_0_rgba(0,0,0,0.10)]"
>
	<!-- Top strip · 44px -->
	<div
		class="flex h-11 flex-shrink-0 items-center justify-between gap-3 border-b border-brand-rule px-3"
	>
		<!--
			Code-first tools have the pane open permanently in the left panel, so
			the toggle would offer a mode the visitor is already in. It only
			survives where Code is somewhere else to go.
		-->
		<div
			class="flex items-center gap-1 rounded-[6px] p-[3px] {leftPanel === 'code'
				? ''
				: 'bg-brand-subtle'}"
		>
			{#each leftPanel === 'code' ? [] : MODES as m (m.key)}
				<button
					type="button"
					on:click={() => (mode = m.key)}
					aria-pressed={mode === m.key}
					class="h-[26px] rounded-[4px] px-2.5 font-sans text-[12.5px] {mode === m.key
						? 'bg-brand-ink font-semibold text-white'
						: 'text-brand-slate hover:text-brand-ink'}">{m.label}</button
				>
			{/each}
		</div>

		<div class="flex items-center gap-3">
			<!-- Says where the work lives. A guest has no server row, and implying
			     one is how someone loses a draft they thought was saved. -->
			<span class="flex items-center gap-1.5">
				<span class="block h-2 w-2 flex-shrink-0 bg-brand-field" aria-hidden="true" />
				<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-slate"
					>Draft · kept in this browser</span
				>
			</span>
			<span class="flex items-center gap-0.5">
				<button
					type="button"
					on:click={() => dispatch('undo')}
					disabled={!canUndo}
					aria-label="Undo"
					class="flex h-7 w-[30px] items-center justify-center text-brand-ink disabled:text-brand-mute"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<path d="M6 4.5 3 7.5l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
						<path d="M3.5 7.5H10a3 3 0 0 1 0 6H8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
					</svg>
				</button>
				<button
					type="button"
					on:click={() => dispatch('redo')}
					disabled={!canRedo}
					aria-label="Redo"
					class="flex h-7 w-[30px] items-center justify-center text-brand-ink disabled:text-brand-mute"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<path d="m10 4.5 3 3-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
						<path d="M12.5 7.5H6a3 3 0 0 0 0 6h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
					</svg>
				</button>
			</span>
			<button
				type="button"
				on:click={() => dispatch('expand')}
				class="flex h-7 items-center gap-1.5 rounded-[5px] border border-brand-rule px-2.5 font-sans text-[12.5px] text-brand-ink"
				>Expand <span aria-hidden="true">⤢</span></button
			>
		</div>
	</div>

	<!-- Body · 560px, three zones -->
	<div class="flex h-[560px] min-h-0 flex-col lg:flex-row">
		{#if leftPanel === 'code'}
			<!--
				CODE-FIRST (board TS-07 `LMJ-0`). For the html and code tools the
				markup IS the input, so it takes the left zone at full width and
				there is no gallery: the visitor arrives with something to paste,
				not something to pick.
			-->
			<!-- Inline width, not a Tailwind class: the value is a prop, and
			     Tailwind cannot generate a class for a number it never sees. -->
			<div
				class="flex min-h-0 w-full flex-shrink-0 flex-col border-b border-brand-rule lg:w-[var(--code-w)] lg:border-b-0 lg:border-r"
				style="--code-w:{codeWidth}px"
			>
				<slot name="code" />
			</div>
		{:else}
		<!-- TEMPLATES · 232px, a horizontal strip below 1024 -->
		<div
			class="flex flex-shrink-0 flex-col border-brand-rule lg:w-[232px] lg:border-r border-b lg:border-b-0"
		>
			<div class="flex items-baseline justify-between px-3 pb-2 pt-3">
				<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute"
					>{PANEL_LABEL[leftPanel] || PANEL_LABEL.templates} · {templates.length}</span
				>
			</div>
			<div class="flex flex-wrap gap-1 px-3 pb-2">
				{#each categories as c (c)}
					<button
						type="button"
						on:click={() => (category = c)}
						aria-pressed={category === c}
						class="rounded-[3px] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em] {category ===
						c
							? 'bg-brand-ink text-white'
							: 'border border-brand-rule text-brand-slate'}">{c}</button
					>
				{/each}
			</div>
			<div class="flex min-h-0 flex-1 gap-2 overflow-auto px-3 pb-2 lg:flex-col">
				{#each shown as t (t.key)}
					<button
						type="button"
						on:click={() => dispatch('pick', { template: t })}
						aria-pressed={activeTemplate === t.key}
						class="flex w-[168px] flex-shrink-0 flex-col gap-1 rounded-[5px] p-1 text-left lg:w-full {activeTemplate ===
						t.key
							? 'border-[1.5px] border-brand-ink shadow-[2px_2px_0_0_var(--brand-field,#D8F34A)]'
							: 'border border-brand-rule'}"
					>
						<!-- `w-full` is load-bearing: the thumbnail is absolutely positioned, so
						     without it this box has no in-flow content to size it, computes to
						     zero width, and clips the whole gallery away. -->
						<span class="relative block h-[108px] w-full overflow-hidden rounded-[3px] bg-brand-subtle">
							{#if t.thumbnail}
								<img src={t.thumbnail} alt="" class="block h-[108px] w-full object-cover" loading="lazy" />
							{:else if t.html}
								<!--
									The template itself, scaled down. A build-time thumbnail
									would be cheaper and is what the board asks for; until that
									exists this is at least TRUE — a picture of the layout the
									visitor will actually get, rather than a grey box that
									makes the gallery unusable.

									`sandbox` with nothing granted: these are static layouts
									and nothing in them needs to run.
								-->
								<iframe
									title={t.name}
									sandbox=""
									scrolling="no"
									srcdoc={t.html}
									class="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
									style="width:{thumbSourceWidth}px;height:{thumbSourceHeight}px;transform:scale({108 /
										thumbSourceHeight})"
								/>
							{:else}
								<span class="block h-[108px] w-full" aria-hidden="true" />
							{/if}
							{#if activeTemplate === t.key}
								<span
									class="absolute left-1 top-1 bg-brand-ink px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-white"
									>In use</span
								>
							{/if}
						</span>
						<span class="truncate px-0.5 font-sans text-[12px] text-brand-ink">{t.name}</span>
						{#if t.category}
							<span
								class="px-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-brand-mute"
								>{t.category}</span
							>
						{/if}
					</button>
				{/each}
			</div>
			<p class="border-t border-brand-rule px-3 py-2 font-sans text-[11.5px] leading-[15px] text-brand-mute">
				{PANEL_FOOT[leftPanel] || PANEL_FOOT.templates}
			</p>
		</div>
		{/if}

		<!-- Canvas -->
		<div class="relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-3 bg-brand-canvas p-4">
			<slot name="canvas" {mode} />
			{#if bulkLeadIn}
				<!--
					Shown after the canvas, not before it: this is the thought a
					visitor has once they have made ONE of the thing.
				-->
				<a
					href={bulkLeadIn.href}
					class="flex items-center gap-2 border border-brand-rule bg-brand-paper px-3 py-2 font-sans text-[12.5px] text-brand-ink hover:border-brand-ink"
				>
					<span class="block h-2 w-2 flex-shrink-0 bg-brand-field" aria-hidden="true" />
					{bulkLeadIn.label}
				</a>
			{/if}
		</div>

		<!-- Side panel · 340px, a bottom sheet below 1024 -->
		<div
			class="flex flex-shrink-0 flex-col border-brand-rule lg:w-[340px] lg:border-l border-t lg:border-t-0"
		>
			<div class="flex gap-1 border-b border-brand-rule px-3 py-2.5">
				{#each PANELS as p (p.key)}
					<button
						type="button"
						on:click={() => (panel = p.key)}
						aria-pressed={panel === p.key}
						class="rounded-[4px] px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] {panel ===
						p.key
							? 'bg-brand-field text-brand-ink'
							: 'border border-brand-rule text-brand-slate'}">{p.label}</button
					>
				{/each}
			</div>
			<div class="min-h-0 flex-1 overflow-auto">
				{#if panel === 'say'}
					<!-- FROM A PAGE URL sits at the top of Say it, because it is the
					     fastest way from "I have a website" to "I have a card". -->
					<slot name="url-band" />
					<slot name="say" />
				{:else if panel === 'selection'}
					<slot name="selection" />
				{:else}
					<slot name="inputs" />
				{/if}
			</div>
		</div>
	</div>

	<!-- Toolbar · 64px, identical to every other tool -->
	<div
		class="flex h-16 flex-wrap items-center justify-between gap-3 border-t border-brand-rule px-3.5"
	>
		<div class="flex flex-wrap items-center gap-2">
			<span class="flex items-center gap-0.5 rounded-[5px] border border-brand-rule p-[3px]">
				{#each formats as f (f)}
					<button
						type="button"
						on:click={() => dispatch('format', { format: f })}
						aria-pressed={format === f}
						class="rounded-[3px] px-2 py-1 font-mono text-[10.5px] uppercase {format === f
							? 'bg-brand-ink text-white'
							: 'text-brand-slate'}">{f}</button
					>
				{/each}
			</span>
			<slot name="size" />
			<slot name="sample" />
		</div>

		<div class="flex flex-wrap items-center gap-3">
			{#if downloadsLeft !== null}
				<span class="flex items-center gap-1.5" aria-live="polite">
					<span class="flex gap-0.5" aria-hidden="true">
						{#each Array.from({ length: downloadsLimit }, (_, i) => i) as i (i)}
							<span
								class="block h-2 w-2 {i < downloadsLeft ? 'bg-brand-field' : 'border border-brand-mute'}"
							/>
						{/each}
					</span>
					<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-slate">
						{downloadsLeft} free today · no watermark
					</span>
				</span>
			{/if}
			<button
				type="button"
				on:click={() => dispatch('save')}
				disabled={saving}
				class="h-9 rounded-btn border border-brand-ink px-3.5 font-sans text-[13px] text-brand-ink disabled:opacity-40"
				>{saving ? 'Saving…' : 'Save to Pictify'}</button
			>
			{#if outOfDownloads}
				<!-- At zero the primary becomes the signup, exactly as GenerateButton
				     does — and EDITING KEEPS WORKING. Locking the editor because a
				     download ran out would punish someone for using the thing. -->
				<slot name="signup" />
			{:else}
				<button
					type="button"
					on:click={() => dispatch('download')}
					disabled={busy}
					class="h-9 rounded-btn bg-brand-ink px-4 font-sans text-[13px] font-semibold text-white shadow-[3px_3px_0_0_var(--brand-pink,#E61C80)] disabled:opacity-40"
					>{busy ? 'Rendering…' : `Download ${format.toUpperCase()}`}</button
				>
			{/if}
		</div>
	</div>
</div>
