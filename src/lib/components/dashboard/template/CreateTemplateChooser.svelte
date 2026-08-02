<script>
	import { createEventDispatcher, onMount } from 'svelte';

	/**
	 * Which kind of template to author. The two engines are genuinely different
	 * products underneath — HTML templates render png/jpg/pdf through the Chrome
	 * pipeline, video templates render mp4 through Remotion/OpenVideo — so the
	 * choice has to happen before the editor opens, not inside it.
	 */
	export let open = false;

	const dispatch = createEventDispatcher();

	let dialogEl;
	let firstOptionEl;

	// Focus the first option when the dialog opens so keyboard users land inside it.
	$: if (open && firstOptionEl) firstOptionEl.focus();

	function close() {
		dispatch('close');
	}

	function choose(kind) {
		dispatch('choose', kind);
	}

	function onKeydown(event) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			close();
			return;
		}
		if (event.key !== 'Tab' || !dialogEl) return;
		// Trap focus: this is a decision the user has to make or dismiss.
		const focusable = dialogEl.querySelectorAll('button, [href]');
		if (!focusable.length) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	onMount(() => {
		if (open && firstOptionEl) firstOptionEl.focus();
	});
</script>

<svelte:window on:keydown={open ? onKeydown : undefined} />

{#if open}
	<!-- Backdrop. z-40 per the layering order in DESIGN.md. -->
	<div
		class="fixed inset-0 z-40 bg-black/40"
		on:click={close}
		on:keydown={(e) => e.key === 'Enter' && close()}
		role="button"
		tabindex="-1"
		aria-label="Close"
	/>

	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
		role="dialog"
		aria-modal="true"
		aria-labelledby="create-template-title"
	>
		<div
			bind:this={dialogEl}
			class="pointer-events-auto w-full max-w-2xl bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 sm:p-8"
		>
			<div class="flex items-start justify-between gap-4 mb-6">
				<div>
					<h2
						id="create-template-title"
						class="text-xl sm:text-2xl font-black text-black tracking-tighter"
					>
						New template
					</h2>
					<p class="text-sm font-bold text-gray-600 mt-1">
						What should this template produce?
					</p>
				</div>
				<button
					on:click={close}
					class="shrink-0 w-9 h-9 rounded-xl border-[3px] border-black bg-white flex items-center justify-center hover:bg-gray-100 transition-colors focus-brutal"
					aria-label="Close"
				>
					<svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<button
					bind:this={firstOptionEl}
					on:click={() => choose('html')}
					class="text-left p-5 rounded-2xl border-[3px] border-black bg-white shadow-brutal-sm hover:shadow-brutal-md hover:-translate-y-0.5 transition-all focus-brutal"
				>
					<div
						class="w-11 h-11 rounded-xl bg-brand-accent border-[3px] border-black flex items-center justify-center mb-4"
					>
						<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<div class="text-base font-black text-black uppercase tracking-wide">Image or PDF</div>
					<p class="text-xs font-bold text-gray-600 mt-1.5 leading-relaxed">
						HTML and CSS with variables. Renders PNG, JPG or PDF. Use this for certificates,
						badges, tickets and social images.
					</p>
					<div class="mt-3 flex flex-wrap gap-1.5">
						{#each ['PNG', 'JPG', 'PDF'] as fmt}
							<span
								class="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black bg-brand-accent/20 text-black font-mono"
								>{fmt}</span
							>
						{/each}
					</div>
				</button>

				<button
					on:click={() => choose('video')}
					class="text-left p-5 rounded-2xl border-[3px] border-black bg-white shadow-brutal-sm hover:shadow-brutal-md hover:-translate-y-0.5 transition-all focus-brutal"
				>
					<div
						class="w-11 h-11 rounded-xl bg-data-violet border-[3px] border-black flex items-center justify-center mb-4"
					>
						<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<div class="text-base font-black text-black uppercase tracking-wide">Video</div>
					<p class="text-xs font-bold text-gray-600 mt-1.5 leading-relaxed">
						A timeline or code scene with variables. Renders MP4. Use this for personalised clips
						and animated announcements.
					</p>
					<div class="mt-3 flex flex-wrap gap-1.5">
						<span
							class="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black bg-data-violet/20 text-black font-mono"
							>MP4</span
						>
					</div>
				</button>
			</div>
		</div>
	</div>
{/if}
