<script>
	/**
	 * Pick a variable to show in the design. PS-4.
	 *
	 * Lists the variables the template already uses, plus "New variable…".
	 * NOTHING IS STORED (locked decision 5): the variable list is derived from
	 * the `{{tokens}}` in the html on every change, so a "new" variable becomes
	 * real by being INSERTED into the design — into the selected text element in
	 * Design, or at the caret in Code. A list this popover could add to would be
	 * a list that disagrees with the template.
	 */
	import { createEventDispatcher } from 'svelte';

	/** Names already used by the template. */
	export let variables = [];
	/** Where the insert will land, so the popover can say so. */
	export let target = 'design';

	const dispatch = createEventDispatcher();

	let naming = false;
	let draft = '';

	/*
	 * Helper names are NOT available as variable names.
	 *
	 * `extractInputs` safelists the renderer's helpers, so a variable called
	 * `default` or `uppercase` would be invisible to the Inputs rail and would
	 * be read as a helper call by the engine. It would look like it worked and
	 * render nothing.
	 */
	const HELPERS = new Set([
		'abs', 'average', 'capitalize', 'ceil', 'coalesce', 'contains', 'currency', 'date',
		'default', 'endsWith', 'first', 'floor', 'indexOf', 'isArray', 'isBoolean', 'isDefined',
		'isEmpty', 'isNotEmpty', 'isNumber', 'isObject', 'isString', 'isUndefined', 'join', 'json',
		'last', 'length', 'lowercase', 'max', 'min', 'number', 'padEnd', 'padStart', 'parseJson',
		'percent', 'replace', 'round', 'slice', 'split', 'startsWith', 'sum', 'time', 'titleCase',
		'trim', 'truncate', 'uppercase', 'if', 'unless', 'each', 'with', 'else', 'this'
	]);

	$: trimmed = draft.trim();
	$: problem = !trimmed
		? null
		: !/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)
			? 'Letters, numbers and underscores, starting with a letter.'
			: HELPERS.has(trimmed)
				? `“${trimmed}” is a built-in helper — the renderer would read it as one.`
				: null;
	$: canAdd = Boolean(trimmed) && !problem;

	function choose(name) {
		dispatch('pick', { name });
	}

	function submit() {
		if (!canAdd) return;
		choose(trimmed);
		draft = '';
		naming = false;
	}
</script>

<div
	class="flex w-[248px] flex-col gap-1 border border-brand-ink bg-white p-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,0.1)]"
>
	<p class="px-1 pb-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">
		{target === 'code' ? 'Insert at the caret' : 'Show a variable here'}
	</p>

	{#if variables.length}
		<ul class="flex max-h-[190px] flex-col overflow-auto">
			{#each variables as name (name)}
				<li>
					<button
						type="button"
						on:click={() => choose(name)}
						class="w-full truncate rounded-[4px] px-2 py-1.5 text-left font-mono text-[12px] text-brand-ink hover:bg-brand-subtle"
						>{'{{'}{name}{'}}'}</button
					>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="px-2 py-1.5 font-sans text-[12px] leading-4 text-brand-mute">
			This template has no variables yet.
		</p>
	{/if}

	{#if naming}
		<div class="flex flex-col gap-1 border-t border-brand-rule px-1 pt-1.5">
			<!-- svelte-ignore a11y-autofocus -->
			<input
				autofocus
				bind:value={draft}
				placeholder="firstName"
				on:keydown={(e) => {
					if (e.key === 'Enter') submit();
					if (e.key === 'Escape') {
						naming = false;
						draft = '';
					}
				}}
				class="h-[30px] rounded-[5px] border border-brand-rule px-2 font-mono text-[12px] text-brand-ink outline-none focus:border-brand-ink"
			/>
			{#if problem}
				<p class="font-sans text-[11.5px] leading-4 text-brand-alarm">{problem}</p>
			{:else}
				<p class="font-sans text-[11.5px] leading-4 text-brand-mute">
					It becomes a variable by being used — nothing is saved separately.
				</p>
			{/if}
			<button
				type="button"
				disabled={!canAdd}
				on:click={submit}
				class="h-[30px] rounded-btn bg-brand-ink font-sans text-[12.5px] text-white disabled:opacity-40"
				>Insert</button
			>
		</div>
	{:else}
		<button
			type="button"
			on:click={() => (naming = true)}
			class="mt-0.5 w-full rounded-[4px] border-t border-brand-rule px-2 pb-1 pt-2 text-left font-sans text-[12.5px] text-brand-royal hover:underline"
			>New variable…</button
		>
	{/if}
</div>
