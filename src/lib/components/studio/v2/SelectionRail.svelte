<script>
	/**
	 * The properties inspector. PS-9 (boards `FM8-0` / `JL4-0`, image `GEN-0`,
	 * group `GJE-0`).
	 *
	 * Reported by a user as "node selection is working but customization option
	 * is not appearing in panel": selecting an element led nowhere, because the
	 * Selection tab only ever rendered the document summary. The inspector was
	 * specified in ST-01/02/03 and never built.
	 *
	 * IT RENDERS FROM `describe()` AND NOTHING ELSE. The design lives in an
	 * iframe, and reading computed style from here would mean reaching across
	 * that boundary from the dashboard — the boundary the stage exists to keep.
	 * So the stage measures and this draws.
	 *
	 * ONE FIELD, ONE TRANSACTION, ONE PRINTABLE LABEL. Every change goes
	 * through the stage API with a label the receipt can show — "Heading · 52 →
	 * 60 px" — because a receipt that says "style change" for everything is a
	 * receipt nobody reads. Committing on CHANGE rather than on every keystroke
	 * is what keeps one adjustment to one undo step.
	 */
	import { createEventDispatcher } from 'svelte';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';

	/** The `describe()` payload, or null when nothing is selected. */
	export let selection = null;
	/** Variable names available to bind, from the Inputs contract. */
	export let variables = [];
	/** `{ name, hex }` from the brand kit, so a matching colour can be named. */
	export let brandColours = [];
	export let disabled = false;

	const dispatch = createEventDispatcher();

	const WEIGHTS = ['300', '400', '500', '600', '700', '800'];
	const FAMILIES = ['Inter', 'Bricolage Grotesque', 'JetBrains Mono', 'Georgia', 'system-ui'];
	const ALIGN = [
		{ key: 'left', label: 'L' },
		{ key: 'center', label: 'C' },
		{ key: 'right', label: 'R' }
	];

	$: multi = selection && selection.count > 1;
	$: one = selection && selection.count === 1 ? selection : null;
	$: isImage = one?.tag === 'img';
	$: isGroup = Boolean(one?.group);
	$: bound = one?.bindings?.length ? one.bindings[0] : null;

	/** The element's own name for the header — "Heading", "Image", "Group". */
	$: label = !one
		? ''
		: isGroup
			? 'Group'
			: isImage
				? 'Image'
				: /^h[1-6]$/.test(one.tag)
					? 'Heading'
					: one.leaf
						? 'Text'
						: 'Box';

	/** The one line under it. Says what it IS and where it sits. */
	$: sub = !one
		? ''
		: isGroup
			? `Group · ${one.group.direction} · ${one.group.children} ${one.group.children === 1 ? 'child' : 'children'}`
			: [
					isImage ? 'Image' : 'Text',
					bound ? 'shows a variable' : null,
					one.layout?.parentLabel ? `inside “${one.layout.parentLabel}”` : null
				]
					.filter(Boolean)
					.join(' · ');

	/** Name a colour when it is one of the brand's, so the rail is not all hex. */
	function nameFor(value) {
		const hex = toHex(value);
		return brandColours.find((c) => String(c.hex).toUpperCase() === hex)?.name || null;
	}

	/** `rgb(a, b, c)` from computed style back to hex, for the swatch input. */
	function toHex(value) {
		const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(String(value || ''));
		if (!m) return String(value || '').toUpperCase();
		return `#${[1, 2, 3].map((i) => Number(m[i]).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
	}

	const px = (v) => (v === null || v === undefined || v === '' ? '' : `${Math.round(Number(v))}`);

	function style(patch, label) {
		if (disabled || !one) return;
		dispatch('style', { id: one.id, patch, label });
	}

	/**
	 * ↑↓ step by 1, shift for 10 — the convention every design tool shares, and
	 * the reason these are plain number inputs rather than sliders: a value you
	 * can type is a value you can reproduce.
	 */
	function onNumberKey(event, apply) {
		if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
		event.preventDefault();
		const step = (event.shiftKey ? 10 : 1) * (event.key === 'ArrowUp' ? 1 : -1);
		apply((Number(event.currentTarget.value) || 0) + step);
	}
</script>

<div class="flex flex-col gap-4 p-4">
	{#if !selection}
		<p class="font-sans text-[13px] leading-[19px] text-brand-mute">
			Nothing selected. Click an element on the canvas.
		</p>
	{:else if multi}
		<!-- Multi-select does the things that only make sense for several. -->
		<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
			{selection.count} selected
		</p>
		<div class="flex flex-wrap gap-1.5">
			{#each ['Left', 'Centre', 'Right', 'Top', 'Middle', 'Bottom'] as how (how)}
				<button
					type="button"
					{disabled}
					on:click={() => dispatch('align', { how: how.toLowerCase() })}
					class="h-8 rounded-[6px] border border-brand-rule px-2.5 font-sans text-[12.5px] text-brand-slate disabled:opacity-40"
					>{how}</button
				>
			{/each}
		</div>
		<button
			type="button"
			{disabled}
			on:click={() => dispatch('group')}
			class="h-8 self-start rounded-[6px] border border-brand-rule px-3 font-sans text-[12.5px] text-brand-ink disabled:opacity-40"
			>Group</button
		>
	{:else}
		<!-- Header -->
		<div class="flex flex-col gap-1">
			<p class="font-sans text-[14px] font-semibold leading-[18px] text-brand-ink">{label}</p>
			<p class="font-sans text-[12.5px] leading-4 text-brand-slate">{sub}</p>
		</div>

		{#if one.blocked}
			<!-- The renderer cannot reproduce a move for this element; say why
			     rather than leaving a control that quietly does nothing. -->
			<p><StatusSquare tone="blocked" label={one.blocked} /></p>
		{/if}

		<!-- CONTENT -->
		{#if !isGroup && !isImage}
			<section class="flex flex-col gap-2">
				<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">Content</p>
				{#if bound}
					<!--
						A binding is a CHIP, never caret-editable text: editing the
						inside of {{account_name}} is how a field silently stops
						binding, which is the same rule the inline editor follows.
					-->
					<div class="flex items-center gap-2">
						<span class="rounded-[4px] bg-brand-powder px-2 py-1 font-mono text-[11.5px] text-brand-ink"
							>{bound}</span
						>
						<button
							type="button"
							{disabled}
							on:click={() => dispatch('rebind', { id: one.id })}
							class="font-sans text-[12.5px] text-brand-royal hover:underline disabled:opacity-40"
							>Change</button
						>
					</div>
					<p class="font-sans text-[12px] leading-4 text-brand-mute">
						Sample values are edited in Inputs.
					</p>
				{:else}
					<input
						value={one.text || ''}
						{disabled}
						on:change={(e) => dispatch('text', { id: one.id, text: e.currentTarget.value })}
						class="h-[34px] rounded-[6px] border border-brand-rule px-2.5 font-sans text-[13px] text-brand-ink outline-none focus:border-brand-ink disabled:opacity-40"
					/>
					{#if variables.length}
						<button
							type="button"
							{disabled}
							on:click={() => dispatch('rebind', { id: one.id })}
							class="self-start font-sans text-[12.5px] text-brand-royal hover:underline disabled:opacity-40"
							>Show a variable here</button
						>
					{/if}
				{/if}
			</section>
		{/if}

		<!-- TEXT -->
		{#if !isImage && !isGroup}
			<section class="flex flex-col gap-2">
				<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">Text</p>
				<select
					{disabled}
					value={FAMILIES.find((f) => (one.fontFamily || '').includes(f)) || FAMILIES[0]}
					on:change={(e) =>
						style({ 'font-family': e.currentTarget.value }, `${label} · font ${e.currentTarget.value}`)}
					class="h-[34px] rounded-[6px] border border-brand-rule px-2 font-sans text-[13px] text-brand-ink disabled:opacity-40"
				>
					{#each FAMILIES as f (f)}<option value={f}>{f}</option>{/each}
				</select>

				<div class="flex gap-2">
					<select
						{disabled}
						value={String(parseInt(one.fontWeight, 10) || 400)}
						on:change={(e) =>
							style({ 'font-weight': e.currentTarget.value }, `${label} · weight ${e.currentTarget.value}`)}
						class="h-[34px] min-w-0 flex-1 rounded-[6px] border border-brand-rule px-2 font-mono text-[12px] text-brand-ink disabled:opacity-40"
					>
						{#each WEIGHTS as w (w)}<option value={w}>{w}</option>{/each}
					</select>
					<label class="flex min-w-0 flex-1 items-center gap-1">
						<span class="sr-only">Font size in pixels</span>
						<input
							type="number"
							{disabled}
							value={px(one.fontSize)}
							on:keydown={(e) => onNumberKey(e, (v) => style({ 'font-size': `${v}px` }, `${label} · ${px(one.fontSize)} → ${v} px`))}
							on:change={(e) =>
								style(
									{ 'font-size': `${e.currentTarget.value}px` },
									`${label} · ${px(one.fontSize)} → ${e.currentTarget.value} px`
								)}
							class="h-[34px] w-full min-w-0 rounded-[6px] border border-brand-rule px-2 font-mono text-[12px] text-brand-ink outline-none focus:border-brand-ink disabled:opacity-40"
						/>
						<span class="font-mono text-[10.5px] text-brand-mute">px</span>
					</label>
					<label class="flex min-w-0 flex-1 items-center gap-1">
						<span class="sr-only">Line height</span>
						<input
							type="number"
							{disabled}
							value={px(parseFloat(one.lineHeight))}
							on:change={(e) =>
								style({ 'line-height': `${e.currentTarget.value}px` }, `${label} · line-height ${e.currentTarget.value}`)}
							class="h-[34px] w-full min-w-0 rounded-[6px] border border-brand-rule px-2 font-mono text-[12px] text-brand-ink outline-none focus:border-brand-ink disabled:opacity-40"
						/>
						<span class="font-mono text-[10.5px] text-brand-mute">lh</span>
					</label>
				</div>

				<div class="flex items-center gap-2">
					<span class="flex items-center rounded-[6px] border border-brand-rule p-0.5">
						{#each ALIGN as a (a.key)}
							<button
								type="button"
								{disabled}
								aria-pressed={one.textAlign === a.key}
								on:click={() => style({ 'text-align': a.key }, `${label} · align ${a.key}`)}
								class="h-7 w-8 rounded-[4px] font-mono text-[11px] {one.textAlign === a.key
									? 'bg-brand-subtle font-semibold text-brand-ink'
									: 'text-brand-slate'} disabled:opacity-40">{a.label}</button
							>
						{/each}
					</span>
					<label class="flex items-center gap-2">
						<span class="sr-only">Text colour</span>
						<input
							type="color"
							{disabled}
							value={toHex(one.color)}
							on:change={(e) => style({ color: e.currentTarget.value }, `${label} · colour ${e.currentTarget.value}`)}
							class="h-7 w-7 cursor-pointer rounded-[4px] border border-brand-rule bg-transparent p-0 disabled:opacity-40"
						/>
						<span class="font-mono text-[11px] text-brand-mute">
							{nameFor(one.color) || toHex(one.color)}
						</span>
					</label>
				</div>
			</section>
		{/if}

		<!-- POSITION -->
		<section class="flex flex-col gap-2">
			<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">Position</p>
			<p class="font-sans text-[12px] leading-4 text-brand-slate">
				{one.role === 'free' ? 'Free' : 'Flows with its group'}
			</p>
			<div class="flex gap-2">
				{#each [{ axis: 'x', prop: one.role === 'free' ? 'left' : null }, { axis: 'y', prop: one.role === 'free' ? 'top' : null }] as f (f.axis)}
					<label class="flex min-w-0 flex-1 items-center gap-1">
						<span class="sr-only">{one.role === 'free' ? f.axis : `offset ${f.axis}`}</span>
						<input
							type="number"
							{disabled}
							value={one.role === 'free' ? px(one.position?.[f.axis]) : px(one.offset?.[f.axis])}
							on:change={(e) => {
								const v = e.currentTarget.value;
								if (f.prop) style({ [f.prop]: `${v}px` }, `${label} · ${f.axis} ${v}`);
								else dispatch('offset', { id: one.id, axis: f.axis, value: Number(v) || 0 });
							}}
							class="h-[34px] w-full min-w-0 rounded-[6px] border border-brand-rule px-2 font-mono text-[12px] text-brand-ink outline-none focus:border-brand-ink disabled:opacity-40"
						/>
						<span class="font-mono text-[10.5px] text-brand-mute"
							>{one.role === 'free' ? f.axis : `off ${f.axis}`}</span
						>
					</label>
				{/each}
			</div>

			{#if one.layout?.count > 1}
				<div class="flex items-center justify-between gap-2">
					<span class="font-sans text-[12.5px] text-brand-slate"
						>Layout order {one.layout.index} of {one.layout.count}</span
					>
					<span class="flex gap-1">
						<button
							type="button"
							disabled={disabled || one.layout.index <= 1}
							on:click={() => dispatch('reorder', { id: one.id, direction: -1 })}
							class="h-7 w-7 rounded-[6px] border border-brand-rule font-sans text-[12px] text-brand-slate disabled:opacity-30"
							aria-label="Move earlier">↑</button
						>
						<button
							type="button"
							disabled={disabled || one.layout.index >= one.layout.count}
							on:click={() => dispatch('reorder', { id: one.id, direction: 1 })}
							class="h-7 w-7 rounded-[6px] border border-brand-rule font-sans text-[12px] text-brand-slate disabled:opacity-30"
							aria-label="Move later">↓</button
						>
					</span>
				</div>
				<p class="font-sans text-[12px] leading-4 text-brand-mute">
					Order decides what comes first when the group stacks.
				</p>
			{/if}

			{#if (isImage || (!one.leaf && !isGroup)) && !bound}
				<label class="flex items-center gap-2">
					<span class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute"
						>Rotation</span
					>
					<input
						type="number"
						step="15"
						{disabled}
						value={px(one.rotation)}
						on:change={(e) =>
							dispatch('rotate', { id: one.id, deg: Math.round((Number(e.currentTarget.value) || 0) / 15) * 15 })}
						class="h-[34px] w-20 rounded-[6px] border border-brand-rule px-2 font-mono text-[12px] text-brand-ink outline-none focus:border-brand-ink disabled:opacity-40"
					/>
					<span class="font-mono text-[10.5px] text-brand-mute">deg</span>
				</label>
			{/if}
		</section>

		<!-- SIZE -->
		<section class="flex flex-col gap-2">
			<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">Size</p>
			<div class="flex gap-2">
				<label class="flex min-w-0 flex-1 items-center gap-1">
					<span class="sr-only">Width</span>
					<input
						type="number"
						{disabled}
						value={px(one.width)}
						on:change={(e) => style({ width: `${e.currentTarget.value}px` }, `${label} · width ${e.currentTarget.value}`)}
						class="h-[34px] w-full min-w-0 rounded-[6px] border border-brand-rule px-2 font-mono text-[12px] text-brand-ink outline-none focus:border-brand-ink disabled:opacity-40"
					/>
					<span class="font-mono text-[10.5px] text-brand-mute">w</span>
				</label>
				<label class="flex min-w-0 flex-1 items-center gap-1">
					<span class="sr-only">Height</span>
					<!--
						`auto` in mute when the height was never set: writing the
						measured number back would silently freeze a box that was
						meant to grow with its text.
					-->
					<input
						type="text"
						{disabled}
						value={one.heightPinned ? px(one.height) : ''}
						placeholder="auto"
						on:change={(e) =>
							style(
								{ height: e.currentTarget.value ? `${e.currentTarget.value}px` : null },
								`${label} · height ${e.currentTarget.value || 'auto'}`
							)}
						class="h-[34px] w-full min-w-0 rounded-[6px] border border-brand-rule px-2 font-mono text-[12px] text-brand-ink outline-none placeholder:text-brand-mute focus:border-brand-ink disabled:opacity-40"
					/>
					<span class="font-mono text-[10.5px] text-brand-mute">h</span>
				</label>
			</div>
		</section>

		<!-- GROUP (GJE-0) -->
		{#if isGroup}
			<section class="flex flex-col gap-2">
				<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">Group</p>
				<div class="flex gap-2">
					{#each [{ k: 'row', l: 'Row' }, { k: 'column', l: 'Column' }, { k: 'free', l: 'Free' }] as d (d.k)}
						<button
							type="button"
							{disabled}
							aria-pressed={one.group.direction === d.k}
							on:click={() =>
								style(
									d.k === 'free'
										? { display: 'block' }
										: { display: 'flex', 'flex-direction': d.k },
									`Group · ${d.l.toLowerCase()}`
								)}
							class="h-8 flex-1 rounded-[6px] border font-sans text-[12.5px] {one.group.direction === d.k
								? 'border-brand-ink text-brand-ink'
								: 'border-brand-rule text-brand-slate'} disabled:opacity-40">{d.l}</button
						>
					{/each}
				</div>
				<div class="flex gap-2">
					<label class="flex min-w-0 flex-1 items-center gap-1">
						<span class="sr-only">Gap</span>
						<input
							type="number"
							{disabled}
							value={px(one.group.gap)}
							on:change={(e) => style({ gap: `${e.currentTarget.value}px` }, `Group · gap ${e.currentTarget.value}`)}
							class="h-[34px] w-full min-w-0 rounded-[6px] border border-brand-rule px-2 font-mono text-[12px] text-brand-ink outline-none focus:border-brand-ink disabled:opacity-40"
						/>
						<span class="font-mono text-[10.5px] text-brand-mute">gap</span>
					</label>
					<label class="flex min-w-0 flex-1 items-center gap-1">
						<span class="sr-only">Padding</span>
						<input
							type="number"
							{disabled}
							value={px(one.group.padding)}
							on:change={(e) => style({ padding: `${e.currentTarget.value}px` }, `Group · padding ${e.currentTarget.value}`)}
							class="h-[34px] w-full min-w-0 rounded-[6px] border border-brand-rule px-2 font-mono text-[12px] text-brand-ink outline-none focus:border-brand-ink disabled:opacity-40"
						/>
						<span class="font-mono text-[10.5px] text-brand-mute">pad</span>
					</label>
				</div>
			</section>
		{/if}

		<!-- IMAGE (GEN-0) -->
		{#if isImage}
			<section class="flex flex-col gap-2">
				<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">Image</p>
				<p class="truncate font-mono text-[11px] text-brand-slate">{one.src || 'No source'}</p>
				<div class="flex gap-2">
					{#each ['contain', 'cover'] as fit (fit)}
						<button
							type="button"
							{disabled}
							on:click={() => style({ 'object-fit': fit }, `Image · ${fit}`)}
							class="h-8 flex-1 rounded-[6px] border border-brand-rule font-sans text-[12.5px] text-brand-slate disabled:opacity-40"
							>{fit === 'contain' ? 'Fit inside' : 'Cover'}</button
						>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Footer -->
		<div class="flex items-center gap-3 border-t border-brand-rule pt-3">
			<button
				type="button"
				{disabled}
				on:click={() => dispatch('lock', { id: one.id })}
				class="font-sans text-[12.5px] text-brand-slate hover:text-brand-ink disabled:opacity-40"
				>{one.locked ? 'Unlock' : 'Lock'}</button
			>
			<button
				type="button"
				{disabled}
				on:click={() => dispatch('duplicate', { id: one.id })}
				class="font-sans text-[12.5px] text-brand-slate hover:text-brand-ink disabled:opacity-40"
				>Duplicate</button
			>
			<button
				type="button"
				{disabled}
				on:click={() => dispatch('remove', { id: one.id })}
				class="ml-auto font-sans text-[12.5px] text-brand-alarm hover:underline disabled:opacity-40"
				>Delete</button
			>
		</div>
	{/if}
</div>
