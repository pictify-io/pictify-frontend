<script>
	/**
	 * Rendered proof. B05-1 / state ST-06 (board `GRY-0`).
	 *
	 * A server render of an exact SAVED revision, which is the only thing in the
	 * studio that can honestly claim to be what a customer will receive. The
	 * Design and Preview modes draw the document in the browser; a browser is
	 * not the renderer, and the gap between them is exactly where a font
	 * substitution or a clipped line hides.
	 *
	 * So the revision is stated on every surface here — badge, card, caption.
	 * A proof whose number nobody can see is indistinguishable from a stale one,
	 * and a stale proof shown as current is worse than no proof at all: it is a
	 * picture of a design the buyer has already changed, presented as evidence.
	 */
	export let proof = null;
	export let designRevision = 1;
	export let rendering = false;
	export let error = null;
	/**
	 * `template` renders the REAL file the API returns and offers it for
	 * download; `campaign` proofs a revision on its way into an edition. Same
	 * evidence, different next step, so only the wording and the actions differ.
	 */
	export let context = 'campaign';

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	let copied = false;

	/** The host, so the caption says WHERE the file is, not just how big. */
	const hostOf = (url) => {
		try {
			const { hostname, pathname } = new URL(url);
			return `${hostname}${pathname.length > 12 ? `${pathname.slice(0, 12)}…` : pathname}`;
		} catch {
			return '';
		}
	};

	/*
	 * THE RENDER URL IS NOT READABLE THE INSTANT IT IS RETURNED.
	 *
	 * Measured: a proof requested milliseconds after the render came back got
	 * 403 from the CDN, the browser cached that failure, and the pane showed a
	 * broken image for the life of the page — a render that had in fact
	 * succeeded, with a 55 KB file sitting at exactly that URL. Fetching the
	 * same URL a moment later returns 200 every time.
	 *
	 * So a failed load is retried rather than believed. The cache-buster is only
	 * ever on the `<img>`; `proof.url` is what Copy URL and Download hand over,
	 * and appending our retry counter to the URL someone pastes elsewhere would
	 * be worse than the bug.
	 */
	const MAX_RETRIES = 4;
	let attempt = 0;
	let imageFailed = false;
	let imageSrc = '';
	// Named dependency, so a new proof resets the retry state rather than
	// inheriting the last one's.
	$: if (proof?.url !== undefined) {
		imageSrc = proof?.url || '';
		attempt = 0;
		imageFailed = false;
	}

	function onImageError() {
		if (!proof?.url) return;
		if (attempt >= MAX_RETRIES) {
			imageFailed = true;
			return;
		}
		attempt += 1;
		const wait = 600 * attempt;
		setTimeout(() => {
			imageSrc = `${proof.url}${proof.url.includes('?') ? '&' : '?'}r=${attempt}`;
		}, wait);
	}

	async function copyUrl() {
		if (!proof?.url) return;
		try {
			await navigator.clipboard.writeText(proof.url);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Clipboard can be refused (permissions, insecure context). Say so
			// rather than showing a "Copied" that did not happen.
			dispatch('copyfailed');
		}
	}

	$: stale = Boolean(proof && proof.revision !== designRevision);

	const KB = (bytes) => `${Math.max(1, Math.round((bytes || 0) / 1024))} KB`;
	/*
	 * Milliseconds under a second. "0.0 S" for a 22 ms render reads as a failed
	 * measurement rather than a fast one.
	 */
	const duration = (ms) =>
		ms < 1000 ? `${Math.max(1, Math.round(ms || 0))} ms` : `${(ms / 1000).toFixed(1)} s`;

	function clockTime(at) {
		const date = new Date(at);
		return Number.isNaN(date.getTime())
			? ''
			: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
	}

	/** `PNG 1200 × 630 · 184 KB · 2.1 S · 12:04`, in the order the board sets. */
	$: caption = proof
		? [
				`RENDERED REV ${proof.revision}`,
				`${String(proof.format || 'png').toUpperCase()} ${proof.width} × ${proof.height}`,
				// Omitted when the size is unknown: `1 KB` for an unmeasured file is
				// a wrong number, and a caption that invents one cannot be trusted
				// about the numbers it does know.
				proof.bytes ? KB(proof.bytes) : null,
				duration(proof.totalMs),
				context === 'template' ? hostOf(proof.url) : clockTime(proof.at)
		  ]
				.filter(Boolean)
				.join(' · ')
		: '';
</script>

<div class="flex w-full max-w-[900px] flex-col gap-3">
	{#if error}
		<p class="flex items-start gap-3 border-l-2 border-brand-alarm bg-brand-paper px-4 py-3">
			<span class="min-w-0">
				<span class="block font-sans text-[14px] font-medium text-brand-ink"
					>The proof could not be rendered</span
				>
				<span class="mt-0.5 block font-sans text-[13px] text-brand-slate">{error}</span>
			</span>
		</p>
	{/if}

	{#if proof}
		<!--
			The state card sits ABOVE the image, not below it. A buyer scrolling to
			a render looks at the render; a caveat placed after it is read, if at
			all, once they have already believed what they saw.
		-->
		<div
			class="flex items-start justify-between gap-4 border-l-2 bg-brand-paper px-4 py-3 {stale
				? 'border-brand-alarm'
				: 'border-brand-proof'}"
		>
			<span class="min-w-0">
				<span class="block font-sans text-[14px] font-medium text-brand-ink">
					{stale ? 'This proof is older than your design' : 'This proof matches your design'}
				</span>
				<span class="mt-0.5 block font-sans text-[13px] text-brand-slate">
					{stale
						? `Proof shows rev ${proof.revision} · design is rev ${designRevision} · render again before you rely on it`
						: context === 'template'
							? `Both are rev ${proof.revision} · rendered ${clockTime(proof.at)}`
							: `Both are rev ${proof.revision} · rendered ${clockTime(
									proof.at
							  )} · “Use this design” records rev ${proof.revision} in the campaign`}
				</span>
			</span>
			<!-- Never colour alone: the badge says the word as well as the tone. -->
			<span
				class="flex-shrink-0 px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] {stale
					? 'bg-brand-alarm text-white'
					: 'bg-brand-proof text-brand-ink'}"
			>
				{stale ? 'Stale' : 'Current'} · Rev {proof.revision}
			</span>
		</div>

		<figure class="m-0 bg-brand-paper">
			{#if imageFailed}
				<!-- Said plainly, with the file still reachable: the render worked,
				     it is the display that did not. -->
				<p class="px-3.5 py-6 font-sans text-[13px] leading-[18px] text-brand-slate">
					The file rendered but would not load here.
					<a href={proof.url} target="_blank" rel="noopener" class="text-brand-royal underline"
						>Open it directly</a
					>.
				</p>
			{:else}
				<img
					src={imageSrc}
					on:error={onImageError}
					alt="Rendered proof of revision {proof.revision}"
					class="block max-w-full {rendering ? 'opacity-40' : ''}"
				/>
			{/if}
			<figcaption
				class="flex flex-wrap items-baseline justify-between gap-3 border-t border-brand-rule px-3.5 py-2.5"
			>
				<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute"
					>{caption}</span
				>
				<span class="font-sans text-[13px] text-brand-slate">
					{context === 'template'
						? 'This is the real file the API returns for these sample values.'
						: 'Exactly what customers receive.'}
				</span>
			</figcaption>
		</figure>

		{#if context === 'template' && proof.url}
			<!--
				The file itself, not a picture of it. `download` is advisory across
				origins, so this opens the real URL rather than promising a save the
				browser may not perform.
			-->
			<div class="flex flex-wrap items-center gap-2">
				<a
					href={proof.url}
					target="_blank"
					rel="noopener"
					class="flex h-8 items-center rounded-btn bg-brand-ink px-3 font-sans text-[12.5px] text-white"
					>Download {String(proof.format || 'png').toUpperCase()}</a
				>
				<button
					type="button"
					on:click={copyUrl}
					class="flex h-8 items-center rounded-btn border border-brand-rule px-3 font-sans text-[12.5px] text-brand-ink"
					>{copied ? 'Copied' : 'Copy URL'}</button
				>
				<span class="truncate font-mono text-[10.5px] text-brand-mute">{proof.url}</span>
			</div>
		{/if}
	{:else if rendering}
		<p class="font-sans text-[13.5px] text-brand-slate">
			Rendering on the server — about four seconds.
		</p>
	{:else if !error}
		<p class="font-sans text-[13.5px] text-brand-mute">
			No proof yet. Render one to see exactly what the server produces.
		</p>
	{/if}
</div>
