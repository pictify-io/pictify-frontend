<script>
	/**
	 * HtmlCommandPalette — ⌘K overlay with fuzzy-searchable actions.
	 *
	 * Uses the same pattern Vercel / Linear / Figma ship. Lightweight: no
	 * external dependency, plain substring match (scales fine for the ~20
	 * commands we register). Each command has a key, label, hint, icon,
	 * and an action callback; selection moves with ↑/↓ arrows, Enter
	 * invokes, Esc closes.
	 */
	import { createEventDispatcher, onMount, tick } from 'svelte';

	/** @type {Array<{ key, label, hint, icon, action, disabled? }>} */
	export let commands = [];

	const dispatch = createEventDispatcher();

	let query = '';
	let highlightIndex = 0;
	let inputEl;

	$: filtered = query.trim()
		? commands.filter((c) => {
				const q = query.trim().toLowerCase();
				return (
					c.label.toLowerCase().includes(q) ||
					(c.hint || '').toLowerCase().includes(q) ||
					(c.key || '').toLowerCase().includes(q)
				);
			})
		: commands;

	$: if (highlightIndex >= filtered.length) {
		highlightIndex = Math.max(0, filtered.length - 1);
	}

	function close() {
		dispatch('close');
	}

	function run(cmd) {
		if (!cmd || cmd.disabled) return;
		try {
			cmd.action();
		} finally {
			close();
		}
	}

	function onKey(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlightIndex = Math.min(filtered.length - 1, highlightIndex + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlightIndex = Math.max(0, highlightIndex - 1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			run(filtered[highlightIndex]);
		}
	}

	onMount(async () => {
		// Lock background scroll while the palette is open.
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		await tick();
		inputEl?.focus();
		return () => {
			document.body.style.overflow = prev;
		};
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="fixed inset-0 z-[120] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
	role="dialog"
	aria-modal="true"
	aria-label="Command palette"
	on:click|self={close}
>
	<div
		class="w-full max-w-xl overflow-hidden rounded-2xl border-[3px] border-gray-900 bg-white shadow-[8px_8px_0_0_#1f2937]"
	>
		<!-- Search -->
		<div class="flex items-center gap-3 border-b-[2px] border-gray-900 bg-[#FFFDF8] px-4 py-3">
			<i class="fa fa-terminal text-sm text-gray-900"></i>
			<input
				bind:this={inputEl}
				bind:value={query}
				on:keydown={onKey}
				placeholder="TYPE A COMMAND OR SEARCH…"
				class="w-full bg-transparent text-sm font-black uppercase tracking-widest text-gray-900 placeholder-gray-400 focus:outline-none"
			/>
			<span
				class="hidden items-center gap-1 rounded border-[1.5px] border-gray-900 bg-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-gray-500 sm:inline-flex"
			>
				Esc
			</span>
		</div>

		<!-- Results -->
		<div class="max-h-[50vh] overflow-y-auto py-2">
			{#if filtered.length === 0}
				<p class="px-4 py-6 text-center text-[11px] font-black uppercase tracking-widest text-gray-500">
					No commands match
				</p>
			{/if}

			{#each filtered as cmd, idx (cmd.key)}
				<button
					type="button"
					on:click={() => run(cmd)}
					on:mouseenter={() => (highlightIndex = idx)}
					disabled={cmd.disabled}
					class="flex w-full items-center gap-3 border-l-[3px] px-4 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40
						{highlightIndex === idx
							? 'border-[#ffc480] bg-[#ffc480]/20'
							: 'border-transparent hover:bg-gray-50'}"
				>
					<div
						class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white text-gray-900 shadow-[1.5px_1.5px_0_0_#1f2937]"
					>
						<i class="fa {cmd.icon || 'fa-chevron-right'} text-[11px]"></i>
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-xs font-black uppercase tracking-wider text-gray-900">
							{cmd.label}
						</p>
						{#if cmd.hint}
							<p class="mt-0.5 truncate text-[10px] font-bold text-gray-500">
								{cmd.hint}
							</p>
						{/if}
					</div>
					{#if cmd.shortcut}
						<span
							class="ml-2 flex-shrink-0 rounded-md border-[1.5px] border-gray-900 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-gray-700"
						>
							{cmd.shortcut}
						</span>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Footer hint -->
		<div
			class="flex items-center justify-between border-t-[2px] border-gray-900 bg-gray-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600"
		>
			<div class="flex items-center gap-3">
				<span>↑↓ navigate</span>
				<span>↵ select</span>
			</div>
			<span>Esc close</span>
		</div>
	</div>
</div>
