<script>
	/**
	 * HtmlBrandPanel — left-pane tab surfacing the team's brand assets
	 * (colors / logos / images / icons / fonts) with click-to-insert
	 * into the HTML editor at the caret.
	 *
	 * Why click-to-insert vs a "use as variable": brand assets change
	 * rarely and designers usually want the concrete value inlined in
	 * the template (rendered output on a hex, src on a CDN URL).
	 * Wiring a brand-aware variable layer would duplicate the
	 * variable panel for marginal benefit; we treat brand as a
	 * discoverable snippet library instead.
	 *
	 * Insertion contract per type:
	 *   color → '<hex>' (just the value, so it fits inside any
	 *                   style="..." slot or CSS custom property)
	 *   logo  → <img src="<url>" alt="<name>" style="max-width:100%" />
	 *   image → same as logo
	 *   icon  → same as logo (small inline default)
	 *   font  → Two-step: if no <link> for this font exists, inject
	 *           a Google-style fetch in <head> (or top of file), and
	 *           append a font-family reference at the caret. For
	 *           self-hosted @font-face we build the rule ourselves.
	 *
	 * Fetching: we tap the existing brand-assets.store so the panel
	 * shares state with the canvas editor's BrandAssetsLibrary. First
	 * mount kicks off a fetch if the store is empty; subsequent opens
	 * reuse the cached list.
	 */
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		brandAssets,
		logos,
		fonts,
		colors,
		images,
		icons,
		fetchBrandAssets
	} from '../../../../store/brand-assets.store';

	const dispatch = createEventDispatcher();

	let activeType = 'colors';
	let searchQuery = '';

	// Panel tabs — order mirrors the canvas editor's BrandAssetsLibrary
	// so switching engines keeps muscle memory.
	const TYPES = [
		{ key: 'colors', label: 'Colors', icon: 'fa-palette' },
		{ key: 'logos', label: 'Logos', icon: 'fa-copyright' },
		{ key: 'images', label: 'Images', icon: 'fa-image' },
		{ key: 'icons', label: 'Icons', icon: 'fa-star' },
		{ key: 'fonts', label: 'Fonts', icon: 'fa-font' }
	];

	$: loading = $brandAssets.loading;
	$: activeList =
		activeType === 'colors'
			? $colors
			: activeType === 'logos'
				? $logos
				: activeType === 'images'
					? $images
					: activeType === 'icons'
						? $icons
						: activeType === 'fonts'
							? $fonts
							: [];

	$: filteredList = searchQuery.trim()
		? activeList.filter((a) => {
				const q = searchQuery.trim().toLowerCase();
				return (
					(a.name || '').toLowerCase().includes(q) ||
					(a.value || '').toLowerCase().includes(q) ||
					(a.metadata?.fontFamily || '').toLowerCase().includes(q) ||
					(a.tags || []).some((t) => t.toLowerCase().includes(q))
				);
			})
		: activeList;

	onMount(() => {
		// Fetch once on first open; the store caches so repeat opens
		// are instant. We don't await — the loading state drives the
		// skeletons below.
		if (!$brandAssets.assets.length && !$brandAssets.loading) {
			fetchBrandAssets().catch(() => {
				/* swallow — a fetch failure surfaces in store.error */
			});
		}
	});

	function insertColor(asset) {
		// Hex-only so the caller can paste it into any CSS position
		// (style attr, background shorthand, CSS custom property).
		// A color rarely stands alone in HTML; inserting raw value
		// matches how the canvas editor's color picker drops a hex.
		dispatch('insert', { body: asset.value });
	}

	function insertImageAsset(asset) {
		const alt = (asset.name || 'Brand asset').replace(/"/g, '&quot;');
		const url = asset.url;
		if (!url) return;
		// Default to max-width:100% so the inserted tag fits naturally
		// inside whatever container the user drops it into. Height
		// auto preserves aspect ratio. The `$0` marker would place
		// the caret — omitted here so the insertion feels atomic.
		const body = `<img src="${url}" alt="${alt}" style="max-width:100%;height:auto;" />`;
		dispatch('insert', { body });
	}

	function insertFont(asset) {
		const family = asset.metadata?.fontFamily || asset.name;
		if (!family) return;
		// Hosted-font case: the asset carries a URL to a font file
		// (ttf/otf/woff2). Emit both an @font-face block the user
		// can paste into a <style> tag AND a font-family declaration
		// at the caret. We prefix the block with a leading newline
		// so consecutive inserts stack cleanly.
		if (asset.url) {
			const mimeHint = (asset.metadata?.mimeType || '').includes('woff2')
				? 'woff2'
				: asset.url.endsWith('.otf')
					? 'opentype'
					: asset.url.endsWith('.woff')
						? 'woff'
						: 'truetype';
			const weight = asset.metadata?.fontWeights?.[0] || 400;
			const style = asset.metadata?.fontStyle || 'normal';
			const body =
				`<!-- Add this @font-face once, at the top of a <style> tag or in the head -->\n` +
				`@font-face {\n` +
				`  font-family: '${family}';\n` +
				`  src: url('${asset.url}') format('${mimeHint}');\n` +
				`  font-weight: ${weight};\n` +
				`  font-style: ${style};\n` +
				`}\n` +
				`font-family: '${family}', sans-serif;`;
			dispatch('insert', { body });
			return;
		}
		// Google Fonts / system font case: insert a stylesheet link
		// comment + the font-family rule. We leave the <link> as a
		// hint since editing the <head> automatically is brittle —
		// most templates are single <div>s that don't even have a
		// <head>, and the Pictify renderer injects its own wrapping.
		const googleHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
			family.replace(/\s+/g, '+')
		)}&display=swap`;
		const body =
			`<!-- Ensure this Google Fonts link is loaded -->\n` +
			`<link rel="stylesheet" href="${googleHref}" />\n` +
			`font-family: '${family}', sans-serif;`;
		dispatch('insert', { body });
	}

	function insertAsset(asset) {
		if (!asset) return;
		if (asset.type === 'color') return insertColor(asset);
		if (asset.type === 'font') return insertFont(asset);
		// logo / image / icon all flow through the image insertion path.
		return insertImageAsset(asset);
	}

	function copyToClipboard(text) {
		try {
			navigator.clipboard.writeText(text);
		} catch {
			/* ignore — fallback to on-screen feedback only */
		}
	}
</script>

<div class="flex h-full w-full flex-col bg-[#FFFDF8]">
	<!-- Header strip -->
	<div class="border-b-[3px] border-gray-900 bg-[#ffc480] px-6 py-4">
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<div class="flex h-8 w-8 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white shadow-[2px_2px_0_0_#1f2937]">
					<i class="fa fa-palette text-[12px] text-gray-900"></i>
				</div>
				<div>
					<h2 class="text-sm font-black uppercase tracking-widest text-gray-900">Brand</h2>
					<p class="mt-0.5 text-[10px] font-bold text-gray-700">Click to insert at caret</p>
				</div>
			</div>
			<a
				href="/dashboard/brand-assets"
				target="_blank"
				rel="noopener noreferrer"
				class="flex h-8 items-center gap-1.5 rounded-md border-[2px] border-gray-900 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-gray-700 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-900 hover:text-white hover:shadow-none"
			>
				<i class="fa fa-arrow-up-right-from-square text-[10px]"></i>
				Manage
			</a>
		</div>
	</div>

	<!-- Sub-tabs -->
	<div class="flex items-center gap-1.5 overflow-x-auto border-b-[2px] border-gray-900 bg-white px-4 py-2">
		{#each TYPES as t}
			<button
				type="button"
				on:click={() => (activeType = t.key)}
				class="flex-shrink-0 flex items-center gap-1.5 rounded-md border-[2px] border-gray-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest transition-all
					{activeType === t.key
						? 'bg-gray-900 text-white shadow-[2px_2px_0_0_#1f2937]'
						: 'bg-white text-gray-700 hover:shadow-[1px_1px_0_0_#1f2937]'}"
			>
				<i class="fa {t.icon} text-[9px]"></i>
				{t.label}
			</button>
		{/each}
	</div>

	<!-- Search -->
	<div class="relative border-b-[2px] border-gray-900 bg-white px-4 py-2">
		<i class="fa fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-[11px] text-gray-400"></i>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="SEARCH {activeType.toUpperCase()}..."
			class="w-full rounded-md border-[2px] border-gray-900 bg-white py-1.5 pl-7 pr-2 text-[10px] font-black uppercase tracking-widest text-gray-900 placeholder-gray-400 focus:-translate-y-0.5 focus:shadow-[2px_2px_0_0_#ffc480] focus:outline-none"
		/>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-auto p-3">
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
					<i class="fa fa-circle-notch fa-spin text-[12px]"></i>
					Loading brand assets…
				</div>
			</div>
		{:else if !filteredList.length}
			<div class="mx-auto mt-6 max-w-sm rounded-xl border-[3px] border-dashed border-gray-400 bg-white p-6 text-center">
				<div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border-[2px] border-gray-900 bg-[#ffe066] shadow-[2px_2px_0_0_#1f2937]">
					<i class="fa fa-box-open text-[14px] text-gray-900"></i>
				</div>
				<p class="text-[11px] font-black uppercase tracking-widest text-gray-900">
					{searchQuery.trim() ? 'No matches' : `No ${activeType} yet`}
				</p>
				<p class="mt-1 text-[11px] font-bold leading-snug text-gray-600">
					{searchQuery.trim()
						? 'Try a different search term.'
						: 'Upload your brand assets to reuse them across templates.'}
				</p>
				{#if !searchQuery.trim()}
					<a
						href="/dashboard/brand-assets"
						target="_blank"
						rel="noopener noreferrer"
						class="mt-4 inline-flex items-center gap-1.5 rounded-md border-[2px] border-gray-900 bg-gray-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_0_#ffc480] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
					>
						<i class="fa fa-plus text-[9px]"></i>
						Manage brand assets
					</a>
				{/if}
			</div>
		{:else if activeType === 'colors'}
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
				{#each filteredList as color (color.uid)}
					<button
						type="button"
						on:click={() => insertAsset(color)}
						title="Insert hex {color.value}"
						class="group overflow-hidden rounded-lg border-[2px] border-gray-900 bg-white text-left transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#1f2937]"
					>
						<div class="h-14 w-full" style="background-color: {color.value}"></div>
						<div class="border-t-[2px] border-gray-900 bg-white px-2 py-1.5">
							<p class="truncate text-[10px] font-black uppercase tracking-wider text-gray-900">
								{color.name || 'Color'}
							</p>
							<p class="mt-0.5 truncate font-mono text-[9px] text-gray-500">{color.value}</p>
						</div>
					</button>
				{/each}
			</div>
		{:else if activeType === 'fonts'}
			<div class="space-y-2">
				{#each filteredList as font (font.uid)}
					<button
						type="button"
						on:click={() => insertAsset(font)}
						title="Insert font stack for {font.metadata?.fontFamily || font.name}"
						class="group flex w-full items-center gap-3 overflow-hidden rounded-lg border-[2px] border-gray-900 bg-white p-3 text-left transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#1f2937]"
					>
						<span
							class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border-[2px] border-gray-900 bg-[#ffe066] text-[18px] text-gray-900"
							style="font-family: '{font.metadata?.fontFamily || font.name}', sans-serif;"
						>
							Aa
						</span>
						<div class="min-w-0 flex-1">
							<p
								class="truncate text-[13px] font-bold text-gray-900"
								style="font-family: '{font.metadata?.fontFamily || font.name}', sans-serif;"
							>
								{font.metadata?.fontFamily || font.name}
							</p>
							<p class="mt-0.5 truncate text-[9px] font-bold uppercase tracking-widest text-gray-500">
								{font.url ? 'Hosted · @font-face' : 'Google · <link>'}
							</p>
						</div>
					</button>
				{/each}
			</div>
		{:else}
			<!-- logos / images / icons share the same card layout -->
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
				{#each filteredList as asset (asset.uid)}
					<button
						type="button"
						on:click={() => insertAsset(asset)}
						title="Insert <img> for {asset.name}"
						class="group overflow-hidden rounded-lg border-[2px] border-gray-900 bg-white text-left transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#1f2937]"
					>
						<div class="flex h-24 w-full items-center justify-center bg-[#f5f0e6] p-2">
							{#if asset.url}
								<img
									src={asset.url}
									alt={asset.name}
									class="h-full max-w-full object-contain"
									loading="lazy"
								/>
							{:else}
								<i class="fa fa-image text-[18px] text-gray-400"></i>
							{/if}
						</div>
						<div class="border-t-[2px] border-gray-900 bg-white px-2 py-1.5">
							<p class="truncate text-[10px] font-black uppercase tracking-wider text-gray-900">
								{asset.name}
							</p>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Footer hint: explain insertion behaviour so users know what
	     to expect before they click. -->
	<div class="border-t-[3px] border-gray-900 bg-white px-6 py-2">
		<p class="text-[10px] font-bold leading-snug text-gray-600">
			{#if activeType === 'colors'}
				<i class="fa fa-lightbulb mr-1 text-[10px] text-[#ffc480]"></i>
				Inserts the hex value — paste inside a <code class="font-mono">style=</code> attribute.
			{:else if activeType === 'fonts'}
				<i class="fa fa-lightbulb mr-1 text-[10px] text-[#ffc480]"></i>
				Inserts a <code class="font-mono">@font-face</code> / Google Fonts link plus the
				<code class="font-mono">font-family</code> rule.
			{:else}
				<i class="fa fa-lightbulb mr-1 text-[10px] text-[#ffc480]"></i>
				Inserts an <code class="font-mono">&lt;img&gt;</code> tag with a CDN URL and sensible defaults.
			{/if}
		</p>
	</div>
</div>
