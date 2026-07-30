<script>
	/**
	 * VideoVariablesPanel — the variables list for the timeline studio.
	 *
	 * Same model and same interaction as HtmlVariablesPanel on the image side
	 * (row chip → floating inspector, inline test value, AUTO chip for
	 * auto-declared names, Randomize), rendered in the studio's dark-pane
	 * dialect. Keeping the two panels in step matters more than any local
	 * cleverness: a user who has authored an HTML template should not have to
	 * relearn variables to author a video.
	 *
	 * What differs from the HTML panel, and why:
	 *   - Type set is the video vocabulary (text/image/color/video/audio/number).
	 *     array/object/chart/table mean nothing on a timeline.
	 *   - Each row shows where the variable is USED — a token in a text clip, a
	 *     bound field, or nowhere yet. On a canvas you cannot see `{{name}}`
	 *     hiding in a clip that's off the playhead, so the panel has to say it.
	 */
	import { createEventDispatcher, tick } from 'svelte';
	import { sampleAll } from '$lib/utils/sample-variable-generator';
	import VariablePropertyPanel from '../editor/html/VariablePropertyPanel.svelte';
	import { controlFor } from '$lib/video/control-spec.js';
	import { humanizeName, VARIABLE_TYPES } from '$lib/video/variables.js';
	import {
		HEADING,
		LABEL,
		BUTTON_COMPACT,
		INPUT_COMPACT,
		TEXT_MUTED,
		TEXT_FAINT
	} from '$lib/video/studio-ui.js';

	/** @type {Array} */
	export let variableDefinitions = [];
	/** @type {Object} — ephemeral { name: value }, never written to defaultValue */
	export let testValues = {};
	/** @type {string[]} — names auto-declared from {{tokens}} this session */
	export let autoAdded = [];
	/** @type {Object} — { name: { tokens: number, bindings: number } } */
	export let usage = {};
	/**
	 * A Remotion composition renders with these values continuously — there is no
	 * preview mode to enter, so the copy below must not point at a button that is
	 * not there for this kind of template.
	 */
	export let alwaysLive = false;
	/** @type {boolean} — is fill-values preview mode on */
	export let filling = false;

	const dispatch = createEventDispatcher();

	const TYPE_LABELS = Object.fromEntries(VARIABLE_TYPES.map((t) => [t.value, t.label]));

	let openIndex = null;
	let openAnchor = null;
	let rowEls = [];
	let searchQuery = '';

	$: filtered = searchQuery.trim()
		? variableDefinitions
				.map((v, i) => ({ v, i }))
				.filter(({ v }) => v.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
		: variableDefinitions.map((v, i) => ({ v, i }));

	$: allNames = variableDefinitions.map((v) => v && v.name).filter(Boolean);

	const emitChange = () => dispatch('change', { variableDefinitions, testValues });

	const anchorTo = (index) => {
		const rowEl = rowEls[index];
		if (!rowEl) return null;
		const rect = rowEl.getBoundingClientRect();
		return {
			top: rect.top,
			right: rect.right,
			bottom: rect.bottom,
			left: rect.left,
			width: rect.width,
			height: rect.height,
			trigger: rowEl
		};
	};

	async function openProperty(index) {
		if (openIndex === index) {
			closePanel();
			return;
		}
		openIndex = index;
		await tick();
		openAnchor = anchorTo(index);
		if (autoAdded.length) dispatch('ackAutoAdded');
	}

	function closePanel() {
		openIndex = null;
		openAnchor = null;
	}

	function applyPatch(event) {
		if (openIndex === null) return;
		const { patch } = event.detail;
		const previous = variableDefinitions[openIndex];
		const oldName = previous?.name;

		variableDefinitions = variableDefinitions.map((v, i) =>
			i === openIndex ? { ...v, ...patch } : v
		);

		// A rename has to follow the variable everywhere: its test value here,
		// and its tokens + bindings in the document (the studio owns those).
		if (patch.name && oldName && patch.name !== oldName) {
			if (testValues[oldName] !== undefined) {
				const next = { ...testValues };
				next[patch.name] = next[oldName];
				delete next[oldName];
				testValues = next;
			}
			dispatch('rename', { from: oldName, to: patch.name });
		}
		emitChange();
		closePanel();
	}

	function removeAtOpenIndex() {
		if (openIndex === null) return;
		const target = variableDefinitions[openIndex];
		if (!target?.name) return;
		// The studio owns the document, so it confirms and strips tokens.
		dispatch('requestRemove', { names: [target.name] });
		closePanel();
	}

	async function addVar() {
		const name = `variable_${variableDefinitions.length + 1}`;
		variableDefinitions = [
			...variableDefinitions,
			{
				name,
				type: 'text',
				defaultValue: '',
				description: '',
				validation: { required: false }
			}
		];
		emitChange();
		openIndex = variableDefinitions.length - 1;
		await tick();
		openAnchor = anchorTo(openIndex);
	}

	// The shared sample generator matches on NAME before type, so a variable
	// called `logo` typed as `color` gets an image URL, and video/audio/number
	// have no case at all and fall through to lorem prose. Writing that into a
	// clip's color or src produces a visibly broken preview, so re-coerce by
	// type after generating.
	const SAMPLE_FALLBACKS = {
		color: ['#ffc480', '#ff6b6b', '#4ade80', '#a78bfa', '#3b82f6'],
		image: ['https://picsum.photos/seed/pictify/800/800'],
		video: ['https://cdn.pictify.io/samples/clip.mp4'],
		audio: ['https://cdn.pictify.io/samples/track.mp3']
	};

	const isUrl = (value) => typeof value === 'string' && /^https?:\/\//.test(value.trim());
	const isColor = (value) =>
		typeof value === 'string' && /^(#[0-9a-fA-F]{3,8}|rgb|hsl|[a-zA-Z]{3,20}$)/.test(value.trim());

	function coerceSample(definition, value, index) {
		const type = definition.type || 'text';
		if (type === 'color') {
			if (isColor(value)) return value;
			const options = SAMPLE_FALLBACKS.color;
			return options[index % options.length];
		}
		if (type === 'image' || type === 'video' || type === 'audio') {
			return isUrl(value) ? value : SAMPLE_FALLBACKS[type][0];
		}
		if (type === 'number') {
			const num = Number(value);
			return Number.isFinite(num) ? num : 1;
		}
		return value;
	}

	async function randomize() {
		const generated = await sampleAll(variableDefinitions);
		const next = {};
		variableDefinitions.forEach((definition, index) => {
			next[definition.name] = coerceSample(definition, generated[definition.name], index);
		});
		testValues = next;
		emitChange();
		if (!filling) dispatch('startFilling');
	}

	/*
	 * A <input type="color"> only accepts #rrggbb. Anything else — a named
	 * colour, rgb(), an empty field before the user has typed — makes the swatch
	 * silently show black, which reads as "the value is black" rather than "there
	 * is no value". The text field beside it stays authoritative for those.
	 */
	const colorValue = (value) => {
		const raw = String(value ?? '').trim();
		if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
		const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(raw);
		if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
		return '#000000';
	};

	/** A range input with a non-numeric value jumps to its midpoint; clamp instead. */
	const numberValue = (value, ctl) => {
		const n = Number(value);
		if (!Number.isFinite(n)) return ctl.min;
		return Math.min(ctl.max, Math.max(ctl.min, n));
	};

	const truthy = (value) => value === true || value === 'true' || value === 1 || value === '1';

	function setTestValue(name, value) {
		testValues = { ...testValues, [name]: value };
		emitChange();
	}

	/** "2 tokens · 1 binding", or null when the variable isn't used yet. */
	function usageLabel(name) {
		const stat = usage[name];
		if (!stat) return null;
		const parts = [];
		if (stat.tokens) parts.push(`${stat.tokens} token${stat.tokens === 1 ? '' : 's'}`);
		if (stat.bindings) parts.push(`${stat.bindings} binding${stat.bindings === 1 ? '' : 's'}`);
		return parts.length ? parts.join(' · ') : null;
	}
</script>

<div class="flex h-full w-full flex-col">
	<!-- Toolbar -->
	<div class="shrink-0 border-b-[3px] border-black bg-gray-800/60 px-3 py-3">
		<div class="flex items-center justify-between gap-2">
			<div class="min-w-0">
				<h3 class={HEADING}>Variables</h3>
				<p class="mt-0.5 text-[10px] font-bold {TEXT_FAINT}">
					{variableDefinitions.length} declared
				</p>
			</div>
			<div class="flex shrink-0 items-center gap-1.5">
				<button
					type="button"
					on:click={randomize}
					disabled={variableDefinitions.length === 0}
					title="Fill test values with realistic sample data"
					class={BUTTON_COMPACT}
				>
					<i class="fa fa-dice text-[10px]" aria-hidden="true"></i>
					Sample
				</button>
				<button type="button" on:click={addVar} class="{BUTTON_COMPACT} !bg-brand-accent !text-black">
					<i class="fa fa-plus text-[10px]" aria-hidden="true"></i>
					Add
				</button>
			</div>
		</div>

		{#if variableDefinitions.length > 3}
			<div class="relative mt-2.5">
				<i
					class="fa fa-magnifying-glass pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500"
					aria-hidden="true"
				></i>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search variables"
					aria-label="Search variables"
					class="{INPUT_COMPACT} pl-7"
				/>
			</div>
		{/if}
	</div>

	<!-- Rows -->
	<div class="ov-scroll flex-1 overflow-y-auto p-3">
		{#if variableDefinitions.length === 0}
			<!-- Empty state teaches BOTH entry points. On a canvas, neither is
			     discoverable: you can't see that typing {{name}} does something,
			     and you can't see that a clip field can be bound. -->
			<div class="rounded-2xl border-[3px] border-dashed border-gray-700 p-5 text-center">
				<div
					class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border-[3px] border-black bg-brand-accent shadow-brutal-sm"
				>
					<i class="fa fa-cube text-black" aria-hidden="true"></i>
				</div>
				<p class="text-xs font-black uppercase tracking-widest text-gray-100">
					No variables yet
				</p>
				<p class="mt-1.5 text-[11px] font-bold leading-relaxed {TEXT_MUTED}">
					Variables are what turn this into a template you can render many times.
				</p>

				<div class="mt-4 space-y-2 text-left">
					<div class="rounded-lg border-[2px] border-black bg-gray-950 p-2.5">
						<div class="mb-1.5 flex items-center gap-2">
							<span
								class="flex h-4 w-4 items-center justify-center rounded border-[2px] border-black bg-brand-accent text-[9px] font-black text-black"
								>1</span
							>
							<span class="text-[10px] font-black uppercase tracking-widest text-gray-100">
								In text
							</span>
						</div>
						<p class="text-[11px] font-semibold leading-snug {TEXT_MUTED}">
							Type
							<code
								class="rounded border-[1.5px] border-black bg-gray-900 px-1 py-0.5 font-mono text-[10px] text-brand-accent"
								>{'{{'}name{'}}'}</code
							>
							in any text clip. It gets declared automatically.
						</p>
					</div>
					<div class="rounded-lg border-[2px] border-black bg-gray-950 p-2.5">
						<div class="mb-1.5 flex items-center gap-2">
							<span
								class="flex h-4 w-4 items-center justify-center rounded border-[2px] border-black bg-data-green text-[9px] font-black text-black"
								>2</span
							>
							<span class="text-[10px] font-black uppercase tracking-widest text-gray-100">
								On a clip
							</span>
						</div>
						<p class="text-[11px] font-semibold leading-snug {TEXT_MUTED}">
							Select a clip and bind a field — an image source, a color, a timing — from the
							Properties tab.
						</p>
					</div>
				</div>

				<button type="button" on:click={addVar} class="{BUTTON_COMPACT} mt-4 !bg-brand-accent !text-black">
					<i class="fa fa-plus text-[10px]" aria-hidden="true"></i>
					Add one manually
				</button>
			</div>
		{:else if filtered.length === 0}
			<p class="mt-4 text-center text-[11px] font-bold {TEXT_FAINT}">
				Nothing matches "<span class="font-mono text-gray-200">{searchQuery}</span>"
			</p>
		{:else}
			<div class="space-y-1.5">
				{#each filtered as { v, i } (v.name + i)}
					{@const used = usageLabel(v.name)}
					{@const ctl = controlFor(v)}
					<div
						bind:this={rowEls[i]}
						role="button"
						tabindex="0"
						aria-expanded={openIndex === i}
						aria-label="Edit variable {v.name}"
						on:click={() => openProperty(i)}
						on:keydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								openProperty(i);
							}
						}}
						class="group cursor-pointer rounded-lg border-[2px] px-2.5 py-2 transition-all focus-brutal
							{openIndex === i
							? 'border-brand-accent bg-gray-800 shadow-brutal-accent-sm'
							: 'border-black bg-gray-950 hover:border-gray-700 hover:bg-gray-800'}"
					>
						<div class="flex items-center gap-2">
							<span class="truncate font-mono text-xs font-bold text-gray-100" title={v.name}>
								{v.name}
							</span>
							<span
								class="shrink-0 rounded border-[1.5px] border-black bg-gray-800 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-gray-300"
							>
								{TYPE_LABELS[v.type] || v.type || 'Text'}
							</span>
							{#if v.validation?.required}
								<i
									class="fa fa-asterisk text-[8px] text-gray-500"
									title="Required at render time"
									aria-label="Required"
								></i>
							{/if}
							{#if autoAdded.includes(v.name)}
								<span
									class="shrink-0 rounded border-[1.5px] border-black bg-brand-accent px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-black"
									title="Declared automatically from a token you typed"
								>
									Auto
								</span>
							{/if}
							<i
								class="fa fa-chevron-right ml-auto shrink-0 text-[9px] text-gray-600 transition-transform
									{openIndex === i ? 'rotate-90 text-brand-accent' : ''}"
								aria-hidden="true"
							></i>
						</div>

						<!--
							The control matches what the variable IS. Everything used to be a
							text box, so a colour meant typing a hex you could not see and a
							font size meant typing a number with no sense of range.
							control-spec.js decides which control from the declared type plus
							whatever bounds or choices the schema carries.
						-->
						<div class="mt-1.5 flex items-center gap-2">
							{#if ctl.control === 'color'}
								<input
									type="color"
									value={colorValue(testValues[v.name] ?? v.defaultValue)}
									on:click|stopPropagation
									on:input={(e) => setTestValue(v.name, e.target.value)}
									aria-label="Preview value for {v.name}"
									class="h-7 w-9 shrink-0 cursor-pointer rounded border-[2px] border-black bg-transparent p-0.5"
								/>
								<input
									type="text"
									value={testValues[v.name] ?? ''}
									on:click|stopPropagation
									on:keydown|stopPropagation
									on:input={(e) => setTestValue(v.name, e.target.value)}
									placeholder={v.defaultValue || '#000000'}
									aria-label="Preview value for {v.name} as hex"
									class="{INPUT_COMPACT} min-w-0 flex-1 font-mono"
								/>
							{:else if ctl.control === 'slider'}
								<input
									type="range"
									min={ctl.min}
									max={ctl.max}
									step={ctl.step}
									value={numberValue(testValues[v.name] ?? v.defaultValue, ctl)}
									on:click|stopPropagation
									on:input={(e) => setTestValue(v.name, Number(e.target.value))}
									aria-label="Preview value for {v.name}"
									class="h-7 min-w-0 flex-1 accent-brand-accent"
								/>
								<span class="w-12 shrink-0 text-right font-mono text-[10px] text-gray-400">
									{numberValue(testValues[v.name] ?? v.defaultValue, ctl)}
								</span>
							{:else if ctl.control === 'select'}
								<select
									value={testValues[v.name] ?? v.defaultValue ?? ''}
									on:click|stopPropagation
									on:change={(e) => setTestValue(v.name, e.target.value)}
									aria-label="Preview value for {v.name}"
									class="{INPUT_COMPACT} flex-1"
								>
									{#each ctl.options as option (option.value)}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							{:else if ctl.control === 'toggle'}
								<label class="flex flex-1 items-center gap-2 text-[11px] text-gray-300">
									<input
										type="checkbox"
										checked={truthy(testValues[v.name] ?? v.defaultValue)}
										on:click|stopPropagation
										on:change={(e) => setTestValue(v.name, e.target.checked)}
										aria-label="Preview value for {v.name}"
										class="h-4 w-4 rounded border-[2px] border-black accent-brand-accent"
									/>
									{truthy(testValues[v.name] ?? v.defaultValue) ? 'On' : 'Off'}
								</label>
							{:else if ctl.control === 'textarea'}
								<textarea
									rows="3"
									value={testValues[v.name] ?? ''}
									on:click|stopPropagation
									on:keydown|stopPropagation
									on:input={(e) => setTestValue(v.name, e.target.value)}
									placeholder={v.defaultValue || humanizeName(v.name)}
									aria-label="Preview value for {v.name}"
									class="{INPUT_COMPACT} flex-1 resize-y leading-snug"
								></textarea>
							{:else}
								<input
									type={ctl.control === 'number' ? 'number' : 'text'}
									value={testValues[v.name] ?? ''}
									on:click|stopPropagation
									on:keydown|stopPropagation
									on:input={(e) =>
										setTestValue(
											v.name,
											ctl.control === 'number' ? Number(e.target.value) : e.target.value
										)}
									placeholder={v.defaultValue || humanizeName(v.name)}
									aria-label="Preview value for {v.name}"
									class="{INPUT_COMPACT} min-w-0 flex-1"
								/>
								{#if ctl.control === 'media'}
									<button
										type="button"
										on:click|stopPropagation={() => dispatch('pickMedia', { name: v.name, accept: ctl.accept })}
										title="Choose from your {ctl.accept} library"
										class="shrink-0 rounded border-[2px] border-black bg-gray-800 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-gray-100 hover:bg-gray-700"
									>
										Pick
									</button>
								{/if}
							{/if}
						</div>

						<!-- Where it's used. A variable declared but never referenced
						     renders nothing, which is confusing enough to call out. -->
						<p class="mt-1 text-[9px] font-black uppercase tracking-widest {used ? 'text-gray-600' : 'text-brand-danger'}">
							{used || 'Not used in this video yet'}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Footer: what these values do -->
	{#if variableDefinitions.length > 0}
		<div class="shrink-0 border-t-[3px] border-black bg-gray-800/60 px-3 py-2.5">
			<p class="text-[10px] font-bold leading-snug {TEXT_MUTED}">
				{#if filling}
					<span class="font-black uppercase tracking-widest text-brand-accent">Previewing</span>
					these values on the canvas. Your template still holds the tokens.
				{:else if alwaysLive}
					<span class={LABEL}>Preview values</span> — shown in the player as you type, and
					prefilled when you render.
				{:else}
					<span class={LABEL}>Preview values</span> — used by
					<span class="font-black text-gray-200">Preview</span> and prefilled when you render.
				{/if}
			</p>
		</div>
	{/if}
</div>

<!-- Floating inspector, reused verbatim from the HTML editor -->
{#if openIndex !== null && variableDefinitions[openIndex]}
	<VariablePropertyPanel
		variable={variableDefinitions[openIndex]}
		anchorRect={openAnchor}
		{allNames}
		types={VARIABLE_TYPES}
		showRawHtml={false}
		on:apply={applyPatch}
		on:remove={removeAtOpenIndex}
		on:close={closePanel}
	/>
{/if}
