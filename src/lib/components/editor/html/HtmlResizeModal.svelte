<script>
	/**
	 * HtmlResizeModal — preset picker for the HTML template's render size.
	 *
	 * Smaller cousin of the fabric editor's ResizeModal. HTML templates
	 * don't need layout variants / batch-render / custom-preset-saving
	 * (those are fabric-only features). Just pick a width/height pair and
	 * apply it to the current template.
	 *
	 * Dialect matches TemplateTypeSelector + EnginePicker: rounded-2xl
	 * shell, accent header strip, press-in hover on cards, 6-8px brutal
	 * shadow.
	 */
	import { createEventDispatcher, onMount } from 'svelte';

	export let show = false;
	export let width = 1080;
	export let height = 1080;

	const dispatch = createEventDispatcher();

	// Same preset list the canvas editor offers — keeping the two in
	// sync means users building both variants can stay in muscle memory.
	const PRESETS = [
		{ id: 'square', label: 'Square', width: 1080, height: 1080, icon: 'fa-square' },
		{ id: 'og-image', label: 'OG Image', width: 1200, height: 630, icon: 'fa-image' },
		{ id: 'instagram-post', label: 'Instagram Post', width: 1080, height: 1080, icon: 'fa-instagram' },
		{ id: 'instagram-story', label: 'Instagram Story', width: 1080, height: 1920, icon: 'fa-mobile-screen' },
		{ id: 'facebook-post', label: 'Facebook Post', width: 1200, height: 630, icon: 'fa-facebook' },
		{ id: 'linkedin-post', label: 'LinkedIn Post', width: 1200, height: 627, icon: 'fa-linkedin' },
		{ id: 'twitter-post', label: 'Twitter / X', width: 1200, height: 675, icon: 'fa-twitter' },
		{ id: 'youtube-thumbnail', label: 'YouTube Thumb', width: 1280, height: 720, icon: 'fa-youtube' },
		{ id: 'pinterest-pin', label: 'Pinterest Pin', width: 1000, height: 1500, icon: 'fa-pinterest' }
	];

	const MAX_DIM = 4096;

	let customWidth = width;
	let customHeight = height;
	$: customWidth = width;
	$: customHeight = height;

	$: activePresetId = PRESETS.find(
		(p) => p.width === width && p.height === height
	)?.id;

	$: dimensionError =
		customWidth > MAX_DIM || customHeight > MAX_DIM
			? `Max ${MAX_DIM}px per side`
			: customWidth < 10 || customHeight < 10
				? 'Min 10px per side'
				: null;

	function pickPreset(p) {
		customWidth = p.width;
		customHeight = p.height;
		apply();
	}

	function apply() {
		if (dimensionError) return;
		dispatch('apply', { width: customWidth, height: customHeight });
		close();
	}

	function close() {
		dispatch('close');
	}

	function onKey(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		} else if (e.key === 'Enter' && !dimensionError) {
			e.preventDefault();
			apply();
		}
	}

	onMount(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		window.addEventListener('keydown', onKey);
		return () => {
			document.body.style.overflow = prev;
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

{#if show}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Resize template"
		on:click|self={close}
	>
		<div
			class="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-[3px] border-gray-900 bg-[#FFFDF8] shadow-[8px_8px_0_0_#1f2937]"
		>
			<!-- Header strip -->
			<div
				class="flex items-center justify-between gap-3 border-b-[3px] border-gray-900 bg-[#ffc480] px-6 py-4"
			>
				<div class="flex items-center gap-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white shadow-[2px_2px_0_0_#1f2937]"
					>
						<i class="fa fa-expand text-[12px] text-gray-900"></i>
					</div>
					<div>
						<h2 class="text-base font-black uppercase tracking-widest text-gray-900">
							Resize template
						</h2>
						<p class="mt-0.5 text-[11px] font-bold text-gray-800">
							Pick a platform preset or enter custom dimensions.
						</p>
					</div>
				</div>
				<button
					type="button"
					on:click={close}
					aria-label="Close"
					class="flex h-8 w-8 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white text-gray-700 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-900 hover:text-white hover:shadow-none"
				>
					<i class="fa fa-xmark text-[12px]"></i>
				</button>
			</div>

			<!-- Body -->
			<div class="flex-1 overflow-y-auto p-6">
				<label class="text-[10px] font-black uppercase tracking-widest text-gray-900">
					Platform presets
				</label>
				<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
					{#each PRESETS as preset}
						{@const active = activePresetId === preset.id}
						<button
							type="button"
							on:click={() => pickPreset(preset)}
							class="flex flex-col gap-1 rounded-xl border-[3px] p-3 text-left transition-all
								{active
									? 'border-gray-900 bg-[#ffc480]/30 shadow-[3px_3px_0_0_#1f2937] -translate-x-[1px] -translate-y-[1px]'
									: 'border-gray-900 bg-white hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#1f2937]'}"
						>
							<div class="flex items-center gap-2">
								<div
									class="flex h-7 w-7 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white text-gray-900 shadow-[1.5px_1.5px_0_0_#1f2937]"
								>
									<i class="fa {preset.icon} text-[11px]"></i>
								</div>
								<span class="text-[11px] font-black uppercase tracking-widest text-gray-900">
									{preset.label}
								</span>
							</div>
							<span class="mt-0.5 font-mono text-[10px] font-bold text-gray-500">
								{preset.width} × {preset.height}
							</span>
						</button>
					{/each}
				</div>

				<div class="my-6 border-t-[2px] border-dashed border-gray-300"></div>

				<label class="text-[10px] font-black uppercase tracking-widest text-gray-900">
					Custom size
				</label>
				<div class="mt-3 grid grid-cols-2 gap-3">
					<div>
						<label class="block text-[10px] font-black uppercase tracking-widest text-gray-900"
							>Width (px)</label>
						<input
							type="number"
							min="10"
							max={MAX_DIM}
							bind:value={customWidth}
							class="mt-2 w-full rounded-lg border-[3px] border-gray-900 bg-white px-4 py-2 text-sm font-black text-gray-900 transition-all focus:-translate-y-1 focus:shadow-[4px_4px_0_0_#ffc480] focus:outline-none"
						/>
					</div>
					<div>
						<label class="block text-[10px] font-black uppercase tracking-widest text-gray-900"
							>Height (px)</label>
						<input
							type="number"
							min="10"
							max={MAX_DIM}
							bind:value={customHeight}
							class="mt-2 w-full rounded-lg border-[3px] border-gray-900 bg-white px-4 py-2 text-sm font-black text-gray-900 transition-all focus:-translate-y-1 focus:shadow-[4px_4px_0_0_#ffc480] focus:outline-none"
						/>
					</div>
					{#if dimensionError}
						<p class="col-span-2 text-[11px] font-black uppercase tracking-wider text-[#ff5252]">
							<i class="fa fa-triangle-exclamation mr-1 text-[10px]"></i>
							{dimensionError}
						</p>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			<div
				class="flex shrink-0 justify-end gap-3 border-t-[3px] border-gray-900 bg-gray-50 px-6 py-4"
			>
				<button
					type="button"
					on:click={close}
					class="rounded-xl border-[3px] border-gray-900 bg-white px-5 py-2 text-[11px] font-black uppercase tracking-widest text-gray-900 shadow-[4px_4px_0_0_#1f2937] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={apply}
					disabled={!!dimensionError}
					class="flex items-center gap-2 rounded-xl border-[3px] border-gray-900 bg-gray-900 px-5 py-2 text-[11px] font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_#1f2937] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					<i class="fa fa-check text-[10px]"></i>
					Apply
				</button>
			</div>
		</div>
	</div>
{/if}
