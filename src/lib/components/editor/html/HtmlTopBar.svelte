<script>
	/**
	 * HtmlTopBar — thin chrome at the top of the HTML editor.
	 *
	 * Dialect matches src/lib/components/editor/TopBar.svelte (the fabric
	 * editor's topbar) one-for-one so alternating between Canvas and
	 * HTML editors feels continuous. Same icon-button sizing, same
	 * 3px gray-900 vertical pipes between zones, same `#ff6b6b` primary
	 * save accent.
	 *
	 * Feature parity with the canvas topbar (TopBar.svelte:156-233):
	 *   - Back button (link to /dashboard/template)
	 *   - Template name inline-rename
	 *   - Save-status pill (color-coded, animated ping when Unsaved)
	 *   - Undo / Redo icon buttons with can-undo / can-redo gating
	 *   - Dimensions pill (WIDTH × HEIGHT) that doubles as the Resize
	 *     trigger — single chip for two actions (shows + opens resize)
	 *   - Format switch (image / pdf) press-in chip
	 *   - Share text-link
	 *   - Primary Save CTA (green when dirty, gray-400 when not;
	 *     matches the fabric save's three-state treatment)
	 */
	import { createEventDispatcher } from 'svelte';

	export let name = 'Untitled template';
	export let backHref = '/dashboard/template';
	export let saveStatus = 'saved'; // 'saved' | 'saving' | 'unsaved'
	export let canPublish = false;
	export let canUndo = false;
	export let canRedo = false;
	export let width = 1080;
	export let height = 1080;
	export let outputFormat = 'image'; // 'image' | 'pdf'
	export let isSaving = false;
	export let isDirty = false;

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

	function toggleFormat() {
		dispatch('toggleFormat');
	}
</script>

<header
	class="relative z-20 flex h-16 flex-shrink-0 items-center justify-between border-b-[3px] border-gray-900 bg-[#FFFDF8] px-4 shadow-sm sm:px-6"
>
	<!-- LEFT: back + name + status -->
	<div class="flex min-w-0 items-center gap-3">
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

		<!-- Save status pill -->
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

	<!-- RIGHT: history · dimensions · format · share · save -->
	<div class="flex items-center gap-2 sm:gap-3">
		<!-- Undo / Redo (matches canvas TopBar:160-177) -->
		<div class="hidden items-center gap-2 sm:flex">
			<button
				type="button"
				on:click={() => dispatch('undo')}
				disabled={!canUndo}
				title="Undo (⌘Z)"
				aria-label="Undo"
				class="flex h-9 w-9 items-center justify-center rounded-lg border-[3px] border-gray-900 bg-white text-gray-900 shadow-[3px_3px_0_0_#1f2937] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
			>
				<i class="fa fa-arrow-rotate-left text-[11px]"></i>
			</button>
			<button
				type="button"
				on:click={() => dispatch('redo')}
				disabled={!canRedo}
				title="Redo (⌘⇧Z)"
				aria-label="Redo"
				class="flex h-9 w-9 items-center justify-center rounded-lg border-[3px] border-gray-900 bg-white text-gray-900 shadow-[3px_3px_0_0_#1f2937] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
			>
				<i class="fa fa-arrow-rotate-right text-[11px]"></i>
			</button>
		</div>

		<div class="hidden h-8 w-[3px] rounded-full bg-gray-900 sm:block"></div>

		<!-- Dimensions + Resize (clicking opens resize modal) -->
		<button
			type="button"
			on:click={() => dispatch('resize')}
			title="Resize template"
			class="flex items-center gap-2 rounded-xl border-[3px] border-gray-900 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-gray-900 shadow-[4px_4px_0_0_#1f2937] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
		>
			<i class="fa fa-expand text-[11px]"></i>
			<span class="font-mono">{width}×{height}</span>
		</button>

		<!-- Format toggle (matches canvas TopBar's PDF/image switch) -->
		<button
			type="button"
			on:click={toggleFormat}
			title="Toggle output format"
			class="hidden items-center gap-2 rounded-xl border-[3px] border-gray-900 px-3 py-2 text-[11px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none sm:flex
				{outputFormat === 'pdf' ? 'bg-[#ff6b6b] text-white' : 'bg-[#ffc480] text-gray-900'}"
		>
			<i class="fa {outputFormat === 'pdf' ? 'fa-file-pdf' : 'fa-image'} text-[11px]"></i>
			{outputFormat === 'pdf' ? 'PDF' : 'Image'}
		</button>

		<div class="hidden h-8 w-[3px] rounded-full bg-gray-900 sm:block"></div>

		<!-- Share (text-link, not a button — matches fabric TopBar at line 191 era) -->
		<button
			type="button"
			on:click={() => dispatch('share')}
			class="hidden font-mono text-xs font-semibold text-gray-800 underline-offset-4 hover:underline sm:inline"
		>
			Share
		</button>

		<!-- Primary Save CTA (matches fabric TopBar's 3-state treatment at 205-232) -->
		<button
			type="button"
			on:click={() => dispatch('save')}
			disabled={isSaving || !isDirty}
			class="flex items-center gap-2 rounded-xl border-[3px] border-gray-900 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all disabled:cursor-default sm:px-6
				{isSaving
					? 'bg-[#ffe066] text-gray-900 shadow-[4px_4px_0_0_#1f2937]'
					: isDirty
						? 'bg-[#4ade80] text-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none'
						: 'bg-gray-100 text-gray-400'}"
		>
			{#if isSaving}
				<i class="fa fa-spinner fa-spin text-[10px]"></i>
				<span class="hidden sm:inline">Saving…</span>
			{:else if isDirty}
				<i class="fa fa-floppy-disk text-[10px]"></i>
				<span class="hidden sm:inline">Save ⌘S</span>
			{:else}
				<i class="fa fa-check text-[10px]"></i>
				<span class="hidden sm:inline">Saved</span>
			{/if}
		</button>

		<!-- Publish CTA — secondary to save, red accent matching fabric save -->
		<button
			type="button"
			on:click={() => dispatch('publish')}
			disabled={!canPublish}
			title="Publish template"
			class="hidden items-center gap-2 rounded-xl border-[3px] border-gray-900 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_#1f2937] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-[#ff5252] hover:shadow-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:bg-gray-400 disabled:hover:shadow-[4px_4px_0_0_#1f2937] lg:flex
				{canPublish ? 'bg-[#ff6b6b]' : 'bg-gray-400'}"
		>
			<i class="fa fa-rocket text-[11px]"></i>
			Publish
		</button>
	</div>
</header>
