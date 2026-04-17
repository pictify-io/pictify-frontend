<script>
	/**
	 * HtmlTopBar — thin chrome at the top of the HTML editor.
	 *
	 * Per design spec:
	 *   [ Back ] [ inline-editable name ] · {saveStatus} · ... [ Publish ] [ Share ]
	 *
	 * saveStatus uses a mono-font dot prefix — monospace is the signal
	 * that says "developer tool" in the first half-second.
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

	$: saveLabel =
		saveStatus === 'saving'
			? 'Saving…'
			: saveStatus === 'unsaved'
				? 'Unsaved'
				: 'Saved';

	$: saveColor =
		saveStatus === 'unsaved'
			? 'text-brand-danger'
			: saveStatus === 'saving'
				? 'text-gray-500'
				: 'text-brand-success';
</script>

<header
	class="flex h-14 items-center justify-between border-b-3 border-gray-800 bg-brand-bg px-4"
>
	<div class="flex items-center gap-3">
		<a
			href={backHref}
			class="border-2 border-gray-800 bg-white px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:shadow-brutal-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
			>← Back</a
		>

		{#if editing}
			<input
				type="text"
				bind:value={draftName}
				on:blur={commitName}
				on:keydown={onKey}
				class="border-2 border-gray-800 bg-white px-2 py-1 font-heading text-lg focus-brutal"
				autofocus
			/>
		{:else}
			<button
				type="button"
				class="font-heading text-lg text-gray-900 hover:underline"
				on:click={() => (editing = true)}
				aria-label="Rename template"
			>
				{name} <span class="text-gray-400">✎</span>
			</button>
		{/if}

		<span class={`font-mono text-xs ${saveColor}`}>· {saveLabel}</span>
	</div>

	<div class="flex items-center gap-2">
		<span
			class="hidden font-mono text-[10px] uppercase tracking-wider text-gray-500 md:inline"
		>
			⌘S save · ⇥ indent · Esc+⇥ exit editor
		</span>
		<button
			type="button"
			class="font-mono text-xs font-semibold text-gray-800 underline-offset-4 hover:underline focus-brutal"
			on:click={() => dispatch('share')}>Share</button
		>
		<button
			type="button"
			disabled={!canPublish}
			class="border-3 border-gray-800 bg-brand-accent px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-md transition-transform duration-150 hover:-translate-y-[1px] hover:shadow-brutal-lg focus-brutal disabled:cursor-not-allowed disabled:opacity-50"
			on:click={() => dispatch('publish')}>Publish</button
		>
	</div>
</header>
