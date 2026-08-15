<script>
	/**
	 * One file that came off the press. The render itself is the face — the
	 * point of this page is recognising your own output at a glance, so the
	 * chrome stays under it: format, size and age on one line, the template
	 * that made it on the next.
	 *
	 * PDFs and MP4s have no thumbnail worth fetching, so they get a drawn face
	 * rather than a broken <img> or a spinner that never resolves.
	 */
	import { timeAgo } from '$lib/utils/format.js';
	import { downloadFile } from '$lib/utils/download.js';
	import { copyToClipboard } from '$lib/utils/format.js';

	/** { uid, url, format, createdAt, width, height, durationSeconds, pageCount, preset, title, templateUid, templateName, isVideo } */
	export let render = {};

	let menuOpen = false;
	let copied = false;

	$: format = (render.format || 'PNG').toUpperCase();
	$: isImage = format === 'PNG' || format === 'GIF';

	// The measurement line answers "is this the right size?" and it is a
	// different question per format: pixels for images, page format for PDFs,
	// pixels plus runtime for video.
	$: spec = (() => {
		if (format === 'PDF') {
			const pages = render.pageCount > 1 ? ` · ${render.pageCount} pages` : '';
			return `${render.preset || 'PDF'}${pages}`;
		}
		const size = render.width && render.height ? `${render.width}×${render.height}` : '';
		const runtime = render.durationSeconds ? formatDuration(render.durationSeconds) : '';
		return [size, runtime].filter(Boolean).join(' · ');
	})();

	$: templateHref = render.templateUid
		? render.isVideo
			? `/dashboard/video-templates/${render.templateUid}`
			: `/template-workspace/html/${render.templateUid}`
		: null;

	function formatDuration(seconds) {
		const total = Math.round(seconds);
		return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
	}

	async function copyLink() {
		menuOpen = false;
		await copyToClipboard(render.url, 'Link copied');
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}

	function download() {
		menuOpen = false;
		const ext = format === 'PNG' ? 'png' : format.toLowerCase();
		const base = render.templateName || render.title || 'render';
		downloadFile(render.url, `${base}-${render.uid}.${ext}`, {
			tool_name: 'renders_page',
			content_type: format.toLowerCase()
		});
	}
</script>

<div
	class="group relative flex flex-col overflow-hidden rounded-tile border-[1.5px] border-brand-rule transition-all hover:border-brand-ink hover:shadow-[3px_3px_0_theme(colors.brand.field)]"
>
	<div class="relative h-[170px] w-full">
		{#if isImage}
			<img
				loading="lazy"
				src={render.url}
				alt="{format} render{render.templateName ? ` from ${render.templateName}` : ''}"
				class="h-full w-full bg-[#EDF1F5] object-cover object-top"
			/>
		{:else if format === 'PDF'}
			<span class="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-white">
				<span class="font-mono text-[8px] tracking-[0.14em] text-[#8A9BAC]">
					{(render.preset || 'PDF').toUpperCase()}{render.pageCount > 1 ? ` · ${render.pageCount} PAGES` : ''}
				</span>
				<span class="max-w-[210px] truncate px-4 font-display text-[19px] font-bold text-[#39536B]">
					{render.title || render.templateName || 'Document'}
				</span>
				<span class="block h-0.5 w-[120px] bg-brand-pink"></span>
			</span>
		{:else}
			<span class="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-brand-press-deep">
				<span class="flex h-10 w-10 items-center justify-center rounded-btn bg-brand-field">
					<svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
						<path d="M1 1l10 6-10 6V1z" fill="#000000" />
					</svg>
				</span>
				<span class="max-w-[210px] truncate px-4 font-display text-base font-semibold text-white">
					{render.templateName || render.title || 'Video export'}
				</span>
			</span>
		{/if}

		<span class="absolute inset-0 hidden items-center justify-center gap-2 bg-brand-press-deep/55 group-hover:flex">
			<a
				href={render.url}
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-btn border-[1.5px] border-brand-ink bg-brand-field px-3.5 py-2 font-sans text-[13px] font-semibold text-brand-ink"
			>
				Open
			</a>
			<button
				type="button"
				on:click={copyLink}
				class="rounded-btn bg-brand-paper px-3.5 py-2 font-sans text-[13px] font-semibold text-brand-ink"
			>
				{copied ? 'Copied' : 'Copy link'}
			</button>
		</span>
	</div>

	<div class="flex flex-col gap-1.5 border-t-[1.5px] border-brand-rule bg-brand-paper px-3.5 py-3">
		<div class="flex items-center gap-2">
			<span class="rounded-[3px] bg-brand-powder px-[7px] py-0.5 font-mono text-[10px] font-bold tracking-[0.06em] text-brand-royal">
				{format}
			</span>
			<span class="min-w-0 truncate font-mono text-[11px] text-brand-mute">{spec}</span>
			<span class="flex-1"></span>
			<span class="flex-shrink-0 font-sans text-xs text-brand-mute">{timeAgo(render.createdAt)}</span>
		</div>

		<div class="flex items-center justify-between gap-2">
			{#if templateHref}
				<a
					href={templateHref}
					class="min-w-0 truncate font-mono text-[11px] font-medium text-brand-royal hover:underline"
					title="Open {render.templateName}"
				>
					{render.templateName}
				</a>
			{:else}
				<span class="min-w-0 truncate font-mono text-[11px] text-brand-mute" title="Rendered from HTML or a URL, not a saved template">
					no template
				</span>
			{/if}

			<div class="relative flex-shrink-0">
				<button
					type="button"
					on:click={() => (menuOpen = !menuOpen)}
					class="px-1 font-sans text-[13px] font-bold tracking-[0.1em] text-brand-mute hover:text-brand-ink"
					aria-label="Render actions"
					aria-expanded={menuOpen}
				>
					···
				</button>
				{#if menuOpen}
					<div class="absolute right-0 top-full z-20 mt-1 flex w-[150px] flex-col overflow-hidden rounded-md border border-black/10 bg-white shadow-lg">
						<button
							type="button"
							on:click={download}
							class="px-3 py-2 text-left font-sans text-[13px] text-brand-ink hover:bg-brand-canvas"
						>
							Download
						</button>
						<button
							type="button"
							on:click={copyLink}
							class="px-3 py-2 text-left font-sans text-[13px] text-brand-ink hover:bg-brand-canvas"
						>
							Copy link
						</button>
						{#if templateHref}
							<a
								href={templateHref}
								class="border-t border-black/[0.08] px-3 py-2 text-left font-sans text-[13px] text-brand-ink hover:bg-brand-canvas"
							>
								Open template
							</a>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
