<script>
	/**
	 * The dashboard's toast stack. TO-01 (board `MQ8-0`).
	 *
	 * MOUNTED ONCE, IN A LAYOUT. It used to be imported per page, which meant
	 * six surfaces called `showToast` with no component in their tree — the
	 * call did nothing at all, and the failures those pages reported were
	 * reported to no one.
	 *
	 * A failure never auto-dismisses. Everything else counts itself down in the
	 * corner where the × sits, and hovering pauses that countdown: a toast that
	 * vanishes while you are reading it is the same as no toast.
	 */
	import { onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import { quadOut } from 'svelte/easing';
	import { visibleToasts, dismissToast, dismissNewestFail } from '../../store/toast.store';

	const SQUARE = {
		fail: 'bg-[#C8342A]',
		ok: 'bg-brand-proof',
		note: 'bg-brand-ink'
	};

	/** id → { left, timer } so a hover can stop the clock and resume it. */
	let clocks = {};
	let paused = null;
	/** Bumped on every tick so the countdown label re-renders. */
	let tick = 0;

	function start(toast) {
		if (!toast.duration || clocks[toast.id]) return;
		clocks[toast.id] = { left: toast.duration, timer: null };
		run(toast.id);
	}

	function run(id) {
		const clock = clocks[id];
		if (!clock || paused === id) return;
		clock.timer = setInterval(() => {
			clock.left -= 250;
			tick++;
			if (clock.left <= 0) {
				stop(id);
				dismissToast(id);
			}
		}, 250);
	}

	function stop(id) {
		if (clocks[id]?.timer) clearInterval(clocks[id].timer);
		if (clocks[id]) clocks[id].timer = null;
	}

	function pause(id) {
		if (!clocks[id]) return;
		paused = id;
		stop(id);
	}

	function resume(id) {
		if (paused !== id) return;
		paused = null;
		run(id);
	}

	function close(id) {
		stop(id);
		delete clocks[id];
		dismissToast(id);
	}

	async function retry(toast) {
		close(toast.id);
		try {
			await toast.retry();
		} catch {
			/* the handler re-raises its own toast; swallowing here avoids two */
		}
	}

	function copyErrorId(toast) {
		try {
			navigator.clipboard?.writeText(String(toast.errorId));
		} catch {
			/* a convenience; the id is on screen either way */
		}
	}

	/*
	 * Esc closes the newest failure — but only when nothing else owns Esc. A
	 * modal is on top of the toast and its own handler runs first; this one
	 * checks that no dialog is open before it takes the key.
	 */
	function onKeydown(event) {
		if (event.key !== 'Escape') return;
		if (typeof document !== 'undefined' && document.querySelector('[role="dialog"]')) return;
		dismissNewestFail();
	}

	// Timed toasts start their clock as they arrive; a fail has no duration and
	// no clock at all.
	$: for (const toast of $visibleToasts) start(toast);

	$: seconds = (id) => Math.max(0, Math.ceil((clocks[id]?.left ?? 0) / 1000));

	onDestroy(() => {
		for (const id of Object.keys(clocks)) stop(id);
		clocks = {};
	});
</script>

<svelte:window on:keydown={onKeydown} />

{#if $visibleToasts.length}
	<!--
		aria-live on the container, not the toast: the region has to exist
		before the message arrives for a screen reader to announce it.
	-->
	<div
		class="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-stretch gap-1.5 sm:bottom-6 sm:right-6 max-sm:left-4"
		aria-live="polite"
	>
		{#each $visibleToasts as t (t.id)}
			<div
				role={t.kind === 'fail' ? 'alert' : 'status'}
				on:mouseenter={() => pause(t.id)}
				on:mouseleave={() => resume(t.id)}
				in:fly|global={{ y: 8, duration: 180, easing: quadOut }}
				out:fly|global={{ y: 8, duration: 120, easing: quadOut }}
				class="pointer-events-auto flex w-full items-start gap-3 rounded-tile border-[1.5px] border-brand-ink bg-brand-paper py-3.5 pl-4 pr-3.5 shadow-[4px_4px_0_0_#000] motion-reduce:transition-none sm:w-[400px]"
			>
				<span
					class="mt-[5px] block h-2 w-2 flex-shrink-0 {SQUARE[t.kind] || SQUARE.note}"
					aria-hidden="true"
				/>

				<div class="flex min-w-0 flex-1 flex-col gap-1">
					{#if t.eyebrow}
						<p class="font-mono text-[10px] uppercase leading-3 tracking-[0.06em] text-brand-ink">
							{t.eyebrow}
						</p>
					{/if}
					<p class="font-sans text-sm leading-5 text-brand-ink">{t.message}</p>
					{#if t.retry || t.errorId}
						<div class="flex gap-3.5 pt-1">
							{#if t.retry}
								<button
									type="button"
									on:click={() => retry(t)}
									class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-royal hover:underline"
									>Retry</button
								>
							{/if}
							{#if t.errorId}
								<button
									type="button"
									on:click={() => copyErrorId(t)}
									class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute hover:text-brand-ink"
									>Copy error id</button
								>
							{/if}
						</div>
					{/if}
				</div>

				{#if t.duration}
					<!-- The remaining seconds instead of a ×: a timed toast is going
					     anyway, and the number says so without asking for a click. -->
					<span class="flex-shrink-0 font-mono text-[10px] leading-3 tracking-[0.06em] text-brand-mute">
						{(tick, seconds(t.id))} s
					</span>
				{:else}
					<button
						type="button"
						on:click={() => close(t.id)}
						aria-label="Dismiss"
						class="-mt-0.5 flex-shrink-0 font-mono text-sm leading-4 text-brand-mute hover:text-brand-ink"
						>×</button
					>
				{/if}
			</div>
		{/each}
	</div>
{/if}
