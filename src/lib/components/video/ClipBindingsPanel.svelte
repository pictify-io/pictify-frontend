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
	 *
	 * ── Why this borrows the vendored panel's control vocabulary ───────────
	 *
	 * It used to wear the app's brutal tokens: 3px black rules, `rounded-lg`
	 * `border-[2px]` selects at 31px against the vendored panel's 25px hairline
	 * controls directly above. Scrolling one column crossed a visible seam, which
	 * reads as two half-finished panels rather than one. The editor's right column
	 * is a single surface, so it speaks a single vocabulary; brand-accent still
	 * marks a bound field, which is what the accent is for.
	 */
	import { createEventDispatcher } from 'svelte';
	import { bindingTargetsForClip, bindingFor, humanizeName } from '$lib/video/variables.js';

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
	<div class="border-t border-border/50 px-3 py-3">
		<h3 class="mb-1 text-xs font-semibold text-foreground">Variable bindings</h3>
		<p class="mb-3 text-[11px] leading-snug text-muted-foreground">
			Bind a field to a variable and each render can set it.
		</p>

		<div class="space-y-2.5">
			{#each targets as target (target.target)}
				{@const bound = bindingFor(clip, target.target)}
				{@const candidates = candidatesFor(target)}
				<div>
					<label
						for="bind-{target.target}"
						class="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground"
					>
						<span>{target.label}</span>
						{#if bound}
							<span class="text-[10px] font-semibold uppercase tracking-wider text-primary">
								Bound
							</span>
						{/if}
					</label>
					<select
						id="bind-{target.target}"
						value={bound?.variable || ''}
						on:change={(e) => onSelect(target, e)}
						class="h-7 w-full rounded border bg-muted/60 px-1.5 font-mono text-xs transition-colors
							focus:outline-none focus-visible:ring-1 focus-visible:ring-primary
							{bound
							? 'border-primary/60 text-primary'
							: 'border-border text-foreground hover:border-primary/50'}"
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
						<p class="mt-1 text-[11px] leading-snug text-destructive">
							{bound.variable} no longer exists
						</p>
					{:else if bound && !candidates.includes(bound.variable)}
						<p class="mt-1 text-[11px] leading-snug text-primary">
							{bound.variable} is not a {target.typeFor(clip?.type)} variable
						</p>
					{/if}
				</div>
			{/each}
		</div>

		{#if names.length === 0}
			<p class="mt-3 text-[11px] leading-snug text-muted-foreground">
				No variables declared yet. Pick "New … variable" above and one gets created, bound, and
				named after the field.
			</p>
		{/if}
	</div>
{:else if clip}
	<div class="border-t border-border/50 px-3 py-3">
		<p class="text-[11px] leading-snug text-muted-foreground">
			A {String(clip.type || 'clip').toLowerCase()} clip has no bindable fields. Put
			<code class="rounded border border-border bg-muted px-1 font-mono text-primary"
				>{'{{'}name{'}}'}</code
			>
			in its text instead.
		</p>
	</div>
{:else}
	<div class="border-t border-border/50 px-3 py-3">
		<p class="text-[11px] leading-snug text-muted-foreground">
			Select a clip on the canvas or the timeline to bind its fields to variables.
		</p>
	</div>
{/if}
