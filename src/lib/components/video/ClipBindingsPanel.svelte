<script>
	/**
	 * ClipBindingsPanel — bind the selected clip's fields to variables.
	 *
	 * A text clip can carry a `{{token}}` inline, so text needs no UI. Every
	 * other parameterisable field can't: an image `src`, a color, an opacity,
	 * a clip's in/out point. Those are declared here.
	 *
	 * Lives under the Properties tab, below the vendored OpenVideo property
	 * panel, so "what this clip is" and "what about it is variable" read as one
	 * column instead of two places to look.
	 */
	import { createEventDispatcher } from 'svelte';
	import { bindingTargetsForClip, bindingFor, humanizeName } from '$lib/video/variables.js';
	import { HEADING, LABEL, TEXT_MUTED, TEXT_FAINT, BUTTON_COMPACT } from '$lib/video/studio-ui.js';

	/** @type {Object|null} — the selected clip, or null */
	export let clip = null;
	/** @type {Array} — declared variable definitions */
	export let variableDefinitions = [];

	const dispatch = createEventDispatcher();

	$: targets = clip ? bindingTargetsForClip(clip.type) : [];
	$: names = variableDefinitions.map((v) => v.name);

	/** Only offer variables whose type suits the field. */
	function candidatesFor(target) {
		const wanted = target.typeFor(clip?.type);
		return variableDefinitions.filter((v) => v.type === wanted).map((v) => v.name);
	}

	function onSelect(target, event) {
		const value = event.target.value;
		if (value === '__create__') {
			// Reset the select — the studio will re-render with the new binding.
			event.target.value = bindingFor(clip, target.target)?.variable || '';
			dispatch('createAndBind', { target: target.target, type: target.typeFor(clip?.type) });
			return;
		}
		dispatch('bind', { target: target.target, variable: value || null });
	}
</script>

{#if clip && targets.length}
	<div class="border-t-[3px] border-black px-3 py-3">
		<h3 class="{HEADING} mb-1">Variable bindings</h3>
		<p class="mb-3 text-[10px] font-bold leading-snug {TEXT_MUTED}">
			Bind a field to a variable and each render can set it.
		</p>

		<div class="space-y-2.5">
			{#each targets as target (target.target)}
				{@const bound = bindingFor(clip, target.target)}
				{@const candidates = candidatesFor(target)}
				<div>
					<label
						for="bind-{target.target}"
						class="{LABEL} mb-1 flex items-center justify-between gap-2"
					>
						<span>{target.label}</span>
						{#if bound}
							<span class="text-brand-accent">Bound</span>
						{/if}
					</label>
					<select
						id="bind-{target.target}"
						value={bound?.variable || ''}
						on:change={(e) => onSelect(target, e)}
						class="w-full rounded-lg border-[2px] px-2 py-1.5 font-mono text-xs font-bold transition-all focus:outline-none focus-brutal
							{bound
							? 'border-brand-accent bg-gray-800 text-brand-accent'
							: 'border-black bg-gray-950 text-gray-300'}"
					>
						<option value="">Not bound</option>
						{#each candidates as name (name)}
							<option value={name}>{name}</option>
						{/each}
						{#if bound && names.includes(bound.variable) && !candidates.includes(bound.variable)}
							<option value={bound.variable}>{bound.variable}</option>
						{/if}
						<option value="__create__">+ New {target.typeFor(clip?.type)} variable…</option>
					</select>
					{#if bound && !names.includes(bound.variable)}
						<p class="mt-1 text-[9px] font-black uppercase tracking-widest text-brand-danger">
							{bound.variable} no longer exists
						</p>
					{:else if bound && !candidates.includes(bound.variable)}
						<p class="mt-1 text-[9px] font-black uppercase tracking-widest text-brand-accent">
							{bound.variable} is not a {target.typeFor(clip?.type)} variable
						</p>
					{/if}
				</div>
			{/each}
		</div>

		{#if names.length === 0}
			<p class="mt-3 text-[10px] font-bold leading-snug {TEXT_FAINT}">
				No variables declared yet. Pick "New … variable" above and one gets created, bound, and
				named after the field.
			</p>
		{/if}
	</div>
{:else if clip}
	<div class="border-t-[3px] border-black px-3 py-3">
		<p class="text-[10px] font-bold {TEXT_FAINT}">
			A {String(clip.type || 'clip').toLowerCase()} clip has no bindable fields. Put
			<code class="rounded border-[1.5px] border-black bg-gray-900 px-1 font-mono text-brand-accent"
				>{'{{'}name{'}}'}</code
			>
			in its text instead.
		</p>
	</div>
{:else}
	<div class="border-t-[3px] border-black px-3 py-3">
		<p class="text-[10px] font-bold {TEXT_FAINT}">
			Select a clip on the canvas or the timeline to bind its fields to variables.
		</p>
	</div>
{/if}
