<script>
	/**
	 * The Layers rail. B02-4.
	 *
	 * A named list of what is on the artboard, because "click the thing" stops
	 * working the moment something is behind something else or is one pixel
	 * tall. Every canvas action has a rail equivalent (locked decision 3), and
	 * this is where selection, lock, hide, rename and reorder live.
	 *
	 * Rows are named by their BINDING first, then their text, then their tag —
	 * "account_name" is recognisable, "div" is not.
	 */
	import { createEventDispatcher } from 'svelte';

	/** `[{ id, tag, depth, label, locked, hidden, hasChildren }]` */
	export let rows = [];
	export let selectedId = null;

	const dispatch = createEventDispatcher();

	let renamingId = null;
	let renameValue = '';
	let dragId = null;

	function startRename(row) {
		renamingId = row.id;
		renameValue = row.label;
	}
	function commitRename() {
		if (renamingId) dispatch('rename', { id: renamingId, label: renameValue });
		renamingId = null;
	}

	/**
	 * Reorder only. The drop target is the row you are dropping BEFORE, and the
	 * stage refuses a move between parents — a drag in a flat list cannot
	 * express a reparent safely, and the buyer would see a reorder and get a
	 * change of layout.
	 */
	function onDrop(row) {
		if (dragId && dragId !== row.id) dispatch('reorder', { id: dragId, beforeId: row.id });
		dragId = null;
	}
</script>

{#if !rows.length}
	<p class="font-sans text-[13.5px] text-brand-mute">Nothing on the artboard yet.</p>
{:else}
	<ul class="flex flex-col gap-px">
		{#each rows as row (row.id)}
			<li
				draggable={!row.locked}
				on:dragstart={() => (dragId = row.id)}
				on:dragover|preventDefault
				on:drop|preventDefault={() => onDrop(row)}
				class="group flex items-center gap-1.5 rounded-[4px] pr-1 {selectedId === row.id
					? 'bg-brand-subtle'
					: 'hover:bg-brand-subtle/60'}"
				style="padding-left:{row.depth * 12 + 4}px"
			>
				<button
					type="button"
					on:click={() => dispatch('select', { id: row.id })}
					on:dblclick={() => startRename(row)}
					class="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
				>
					<span
						class="block h-2 w-2 flex-shrink-0 {row.hidden
							? 'border border-brand-mute'
							: selectedId === row.id
							? 'bg-brand-ink'
							: 'bg-brand-rule'}"
						aria-hidden="true"
					/>
					{#if renamingId === row.id}
						<!-- svelte-ignore a11y-autofocus -->
						<input
							autofocus
							bind:value={renameValue}
							on:blur={commitRename}
							on:keydown={(e) => {
								if (e.key === 'Enter') commitRename();
								if (e.key === 'Escape') renamingId = null;
							}}
							class="h-6 w-full rounded-[3px] border border-brand-ink px-1 font-sans text-[12.5px]"
						/>
					{:else}
						<span
							class="truncate font-sans text-[12.5px] {row.hidden
								? 'text-brand-mute line-through'
								: selectedId === row.id
								? 'font-semibold text-brand-ink'
								: 'text-brand-slate'}">{row.label}</span
						>
						<span class="flex-shrink-0 font-mono text-[9.5px] uppercase text-brand-mute"
							>{row.tag}</span
						>
					{/if}
				</button>

				<button
					type="button"
					on:click={() => dispatch('toggle-hide', { id: row.id })}
					title={row.hidden ? 'Show' : 'Hide'}
					aria-label={row.hidden ? 'Show layer' : 'Hide layer'}
					class="h-6 w-6 flex-shrink-0 font-mono text-[10px] text-brand-mute opacity-0 group-hover:opacity-100 {row.hidden
						? 'opacity-100'
						: ''}">{row.hidden ? '◌' : '●'}</button
				>
				<button
					type="button"
					on:click={() => dispatch('toggle-lock', { id: row.id })}
					title={row.locked ? 'Unlock' : 'Lock'}
					aria-label={row.locked ? 'Unlock layer' : 'Lock layer'}
					class="h-6 w-6 flex-shrink-0 font-mono text-[10px] text-brand-mute opacity-0 group-hover:opacity-100 {row.locked
						? 'opacity-100 text-brand-ink'
						: ''}">{row.locked ? '▣' : '▢'}</button
				>
			</li>
		{/each}
	</ul>
{/if}
