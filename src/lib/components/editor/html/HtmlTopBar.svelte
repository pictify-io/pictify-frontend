<script>
	/**
	 * HtmlTopBar — thin chrome at the top of the HTML editor.
	 *
	 * Dialect matches src/lib/components/editor/TopBar.svelte (the fabric
	 * editor's topbar) so users alternating between Canvas and HTML editors
	 * don't notice a jarring chrome swap:
	 *   - rounded-lg / rounded-xl corners (never sharp)
	 *   - border-[3px] border-gray-900 on interactive controls
	 *   - shadow-[4px_4px_0_0_#1f2937] → hover shadow-none + translate press-in
	 *   - font-black uppercase tracking-wider for all actionable text
	 *   - Publish CTA in #ff6b6b danger-red (matches fabric TopBar's save)
	 *   - 3px vertical gray-900 separators between zones
	 *
	 * Save status uses a 10px font-black uppercase pill so the "developer
	 * tool" affordance reads without needing monospace at this scale.
	 */
	import { createEventDispatcher } from 'svelte';

	export let name = 'Untitled template';
	export let backHref = '/dashboard/template';
	export let saveStatus = 'saved'; // 'saved' | 'saving' | 'unsaved'
	export let canPublish = false;

	const dispatch = createEventDispatcher();

	let editing = false;
	let draftName = name;
	$: if (!editing) draftName = name;

	function commitName() {
		editing = false;
		if (draftName && draftName !== name) {
			dispatch('rename', { name: draftName });
		}
	}

	function onKey(e) {
		if (e.key === 'Enter') commitName();
		if (e.key === 'Escape') {
			draftName = name;
			editing = false;
		}
	}

	$: statusMeta =
		saveStatus === 'saving'
			? { label: 'Saving…', bg: 'bg-[#ffe066]', dotBg: 'bg-[#f59e0b]' }
			: saveStatus === 'unsaved'
				? { label: 'Unsaved', bg: 'bg-[#ff6b6b]', dotBg: 'bg-[#ff5252]', textWhite: true }
				: { label: 'Saved', bg: 'bg-[#4ade80]', dotBg: 'bg-[#22c55e]' };
</script>

<header
	class="relative z-20 flex h-16 flex-shrink-0 items-center justify-between border-b-[3px] border-gray-900 bg-[#FFFDF8] px-4 shadow-sm sm:px-6"
>
	<!-- LEFT: back + name + status -->
	<div class="flex items-center gap-3">
		<a
			href={backHref}
			aria-label="Back to templates"
			class="group flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-[3px] border-gray-900 bg-white text-gray-900 shadow-[4px_4px_0_0_#1f2937] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-gray-900 hover:text-white hover:shadow-none"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
			</svg>
		</a>

		<div class="hidden h-8 w-[3px] flex-shrink-0 rounded-full bg-gray-900 sm:block"></div>

		<div class="min-w-0 flex-1">
			{#if editing}
				<!-- svelte-ignore a11y-autofocus -->
				<input
					type="text"
					bind:value={draftName}
					on:blur={commitName}
					on:keydown={onKey}
					class="w-full rounded-lg border-2 border-gray-900 bg-white p-2 text-sm font-black uppercase tracking-wider text-gray-900 transition-all focus:-translate-y-1 focus:bg-white focus:shadow-[4px_4px_0_0_#ffc480] focus:outline-none sm:text-base"
					autofocus
				/>
			{:else}
				<button
					type="button"
					class="w-full truncate rounded-lg border-2 border-transparent p-2 text-left text-sm font-black uppercase tracking-wider text-gray-900 transition-all hover:border-gray-200 hover:bg-white sm:text-base"
					on:click={() => (editing = true)}
					aria-label="Rename template"
				>
					{name}
					<i class="fa fa-pencil ml-1.5 text-[10px] text-gray-400"></i>
				</button>
			{/if}
		</div>

		<!-- Save status pill (accent-coded, mirrors fabric TopBar's Unsaved/Live pills) -->
		<div
			class="hidden items-center gap-2 rounded-md border-[2px] border-gray-900 px-3 py-1.5 shadow-[2px_2px_0_0_#1f2937] transition-all sm:flex {statusMeta.bg}"
		>
			<span class="relative flex h-2.5 w-2.5">
				{#if saveStatus === 'unsaved'}
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b6b] opacity-75"></span>
				{/if}
				<span class="relative inline-flex h-2.5 w-2.5 rounded-full border-[1.5px] border-gray-900 {statusMeta.dotBg}"></span>
			</span>
			<span class="mt-[1px] text-[10px] font-black uppercase tracking-widest {statusMeta.textWhite ? 'text-white' : 'text-gray-900'}">
				{statusMeta.label}
			</span>
		</div>
	</div>

	<!-- RIGHT: shortcuts + share + publish -->
	<div class="flex items-center gap-2 sm:gap-3">
		<span
			class="hidden items-center rounded-md border-[2px] border-gray-200 bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500 lg:inline-flex"
		>
			⌘S save · ⇥ indent
		</span>

		<div class="hidden h-8 w-[3px] rounded-full bg-gray-900 sm:block"></div>

		<button
			type="button"
			on:click={() => dispatch('share')}
			class="hidden items-center gap-1.5 rounded-xl border-[3px] border-gray-900 bg-white px-3 py-2 text-xs font-bold text-gray-900 shadow-[4px_4px_0_0_#1f2937] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none sm:flex"
		>
			<i class="fa fa-share-alt text-xs"></i>
			Share
		</button>

		<button
			type="button"
			on:click={() => dispatch('publish')}
			disabled={!canPublish}
			class="flex items-center gap-2 rounded-xl border-[3px] border-gray-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_#1f2937] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-[#ff5252] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#1f2937] sm:px-6
				{canPublish ? 'bg-[#ff6b6b]' : 'bg-gray-400'}"
		>
			<i class="fa fa-rocket text-[11px]"></i>
			Publish
		</button>
	</div>
</header>
