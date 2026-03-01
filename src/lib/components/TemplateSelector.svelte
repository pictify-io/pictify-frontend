<script>
	import { createEventDispatcher, onDestroy, tick } from 'svelte';
	import { searchTemplates, getTemplates } from '../../api/template';

	export let value = '';
	export let selectedTemplate = null;
	export let placeholder = 'Select a template...';
	export let disabled = false;

	const dispatch = createEventDispatcher();
	const PAGE_SIZE = 20;

	let open = false;
	let query = '';
	let templates = [];
	let loading = false;
	let loadingMore = false;
	let highlightedIndex = -1;
	let listEl;
	let triggerEl;

	// Pagination
	let currentPage = 1;
	let hasMore = false;

	// Portal container (appended to document.body)
	let portalEl = null;

	// Cache for initial browse results (page 1 only)
	let cachedInitialTemplates = null;
	let cachedInitialHasMore = false;

	// Internal display state for selected template
	let displayTemplate = selectedTemplate || null;

	// Debounce timer
	let debounceTimer;

	// Escape HTML to prevent XSS in imperative DOM rendering
	function escapeHtml(str) {
		if (!str) return '';
		return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
	}

	// Keep displayTemplate in sync if selectedTemplate prop changes
	$: if (selectedTemplate) {
		displayTemplate = selectedTemplate;
	}

	// When value changes externally and we have templates loaded, try to find it
	$: if (value && !displayTemplate && templates.length > 0) {
		const found = templates.find(t => t.uid === value);
		if (found) displayTemplate = found;
	}

	function positionPortal() {
		if (!triggerEl || !portalEl) return;
		const rect = triggerEl.getBoundingClientRect();
		portalEl.style.position = 'fixed';
		portalEl.style.top = `${rect.bottom + 8}px`;
		portalEl.style.left = `${rect.left}px`;
		portalEl.style.width = `${rect.width}px`;
		portalEl.style.zIndex = '9999';
	}

	function handleDocumentClick(event) {
		if (!open) return;
		if (triggerEl?.contains(event.target)) return;
		if (portalEl?.contains(event.target)) return;
		close();
	}

	function handleDocumentKeydown(event) {
		if (!open) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
			triggerEl?.focus();
		}
	}

	async function openDropdown() {
		if (disabled) return;
		open = true;
		highlightedIndex = -1;
		query = '';

		// Create portal container and append to body
		portalEl = document.createElement('div');
		document.body.appendChild(portalEl);

		if (cachedInitialTemplates) {
			templates = cachedInitialTemplates;
			hasMore = cachedInitialHasMore;
			currentPage = 1;
		} else {
			currentPage = 1;
			hasMore = false;
			await fetchPage(1, false);
			cachedInitialTemplates = templates;
			cachedInitialHasMore = hasMore;
		}

		await tick();

		// Render dropdown content into portal
		renderDropdown();
		positionPortal();

		await tick();
		const input = portalEl.querySelector('[data-search-input]');
		input?.focus();

		document.addEventListener('click', handleDocumentClick, true);
		document.addEventListener('keydown', handleDocumentKeydown, true);
	}

	function close() {
		open = false;
		query = '';
		highlightedIndex = -1;
		document.removeEventListener('click', handleDocumentClick, true);
		document.removeEventListener('keydown', handleDocumentKeydown, true);
		if (portalEl && portalEl.parentNode) {
			portalEl.parentNode.removeChild(portalEl);
		}
		portalEl = null;
		listEl = null;
	}

	function toggle() {
		if (open) {
			close();
		} else {
			openDropdown();
		}
	}

	onDestroy(() => {
		if (debounceTimer) clearTimeout(debounceTimer);
		close();
	});

	async function fetchPage(page, append) {
		if (append) {
			loadingMore = true;
			renderLoadMoreIndicator();
		} else {
			loading = true;
		}

		try {
			const isSearch = query.trim() !== '';
			const res = isSearch
				? await searchTemplates(query.trim(), { page, limit: PAGE_SIZE })
				: await getTemplates({ page, limit: PAGE_SIZE });

			if (res?.templates) {
				if (append) {
					templates = [...templates, ...res.templates];
				} else {
					templates = res.templates;
				}
				currentPage = page;
				hasMore = res.pagination?.hasNext ?? false;
			}
		} catch (err) {
			console.error('TemplateSelector: fetch failed', err);
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	async function loadNextPage() {
		if (loadingMore || !hasMore) return;
		await fetchPage(currentPage + 1, true);
		renderDropdownList();
	}

	function handleListScroll() {
		if (!listEl || loadingMore || !hasMore) return;
		const { scrollTop, scrollHeight, clientHeight } = listEl;
		if (scrollHeight - scrollTop - clientHeight < 80) {
			loadNextPage();
		}
	}

	function selectTemplate(template) {
		value = template.uid;
		displayTemplate = template;
		dispatch('change', { uid: template.uid, template });
		close();
	}

	function handlePortalKeydown(event) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			highlightedIndex = Math.min(highlightedIndex + 1, templates.length - 1);
			updateHighlight();
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			highlightedIndex = Math.max(highlightedIndex - 1, 0);
			updateHighlight();
		} else if (event.key === 'Enter') {
			event.preventDefault();
			if (highlightedIndex >= 0 && highlightedIndex < templates.length) {
				selectTemplate(templates[highlightedIndex]);
			}
		}
	}

	function updateHighlight() {
		if (!portalEl) return;
		const items = portalEl.querySelectorAll('[data-tpl-index]');
		items.forEach((el, i) => {
			if (i === highlightedIndex) {
				el.classList.add('tpl-highlighted');
				el.classList.remove('tpl-normal');
				el.scrollIntoView({ block: 'nearest' });
			} else {
				el.classList.remove('tpl-highlighted');
				el.classList.add('tpl-normal');
			}
		});
	}

	function doSearch(q) {
		if (debounceTimer) clearTimeout(debounceTimer);
		query = q;

		debounceTimer = setTimeout(async () => {
			currentPage = 1;
			hasMore = false;
			highlightedIndex = -1;

			if (query.trim() === '') {
				// Revert to cached browse results
				templates = cachedInitialTemplates || [];
				hasMore = cachedInitialHasMore;
				currentPage = 1;
				renderDropdownList();
				return;
			}

			loading = true;
			renderDropdownList();

			await fetchPage(1, false);
			renderDropdownList();
		}, 300);
	}

	// ============== Imperative DOM rendering for the portal ==============

	function renderDropdown() {
		if (!portalEl) return;
		portalEl.innerHTML = '';

		const wrapper = document.createElement('div');
		wrapper.className = 'bg-white border-[3px] border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937] overflow-hidden';
		wrapper.style.fontFamily = 'inherit';

		// Search bar
		const searchWrap = document.createElement('div');
		searchWrap.className = 'p-3 border-b-[2px] border-gray-200';
		searchWrap.innerHTML = `
			<div class="relative">
				<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input data-search-input type="text" placeholder="Search templates..."
					class="w-full pl-10 pr-4 py-2.5 border-[2px] border-gray-300 rounded-lg text-sm font-bold bg-white focus:outline-none focus:border-gray-900 transition-colors" />
			</div>`;
		wrapper.appendChild(searchWrap);

		const input = searchWrap.querySelector('[data-search-input]');
		input.addEventListener('input', (e) => doSearch(e.target.value));
		input.addEventListener('keydown', handlePortalKeydown);

		// List container
		const listContainer = document.createElement('div');
		listContainer.setAttribute('data-list', '');
		listContainer.className = 'max-h-[300px] overflow-y-auto';
		listContainer.addEventListener('scroll', handleListScroll);
		wrapper.appendChild(listContainer);
		listEl = listContainer;

		portalEl.appendChild(wrapper);
		renderDropdownList();
	}

	const SPINNER_HTML = `
		<div class="flex items-center justify-center py-3" data-load-more>
			<svg class="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
			<span class="ml-2 text-[10px] font-bold text-gray-400">Loading more...</span>
		</div>`;

	function renderLoadMoreIndicator() {
		if (!listEl) return;
		// Remove existing indicator first
		const existing = listEl.querySelector('[data-load-more]');
		if (existing) existing.remove();
		listEl.insertAdjacentHTML('beforeend', SPINNER_HTML);
	}

	function renderDropdownList() {
		if (!listEl) return;
		listEl.innerHTML = '';

		if (loading) {
			listEl.innerHTML = `
				<div class="flex items-center justify-center py-8">
					<svg class="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
					<span class="ml-2 text-xs font-bold text-gray-400">Loading templates...</span>
				</div>`;
			return;
		}

		if (templates.length === 0) {
			listEl.innerHTML = `
				<div class="py-8 text-center">
					<p class="text-sm font-bold text-gray-400">No templates found</p>
					${query ? '<p class="text-xs text-gray-300 mt-1">Try a different search term</p>' : ''}
				</div>`;
			return;
		}

		templates.forEach((tpl, i) => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.setAttribute('data-tpl-index', i);
			btn.className = `w-full flex items-center gap-3 px-4 py-3 text-left transition-colors tpl-normal ${i < templates.length - 1 ? 'border-b border-gray-100' : ''}`;

			const thumbHtml = tpl.thumbnail
				? `<img src="${escapeHtml(tpl.thumbnail)}" alt="" class="w-12 h-9 object-cover rounded border-[1.5px] border-gray-200 shrink-0 bg-gray-100" />`
				: `<div class="w-12 h-9 rounded border-[1.5px] border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center">
						<svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>`;

			const dimHtml = (tpl.width && tpl.height)
				? `<p class="text-[10px] font-bold text-gray-400 mt-0.5">${escapeHtml(tpl.width)} x ${escapeHtml(tpl.height)}</p>`
				: '';

			const checkHtml = (value === tpl.uid)
				? `<svg class="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
					</svg>`
				: '';

			const name = escapeHtml(tpl.name || tpl.uid);
			btn.innerHTML = `
				${thumbHtml}
				<div class="flex-1 min-w-0">
					<p class="text-sm font-bold text-gray-900 truncate">${name}</p>
					${dimHtml}
				</div>
				${checkHtml}`;

			btn.addEventListener('click', () => selectTemplate(tpl));
			btn.addEventListener('mouseenter', () => {
				highlightedIndex = i;
				updateHighlight();
			});

			listEl.appendChild(btn);
		});

		// Show loading-more spinner if currently fetching next page
		if (loadingMore) {
			renderLoadMoreIndicator();
		}
	}
</script>

<style>
	:global(.tpl-highlighted) {
		background-color: rgba(255, 196, 128, 0.2) !important;
	}
	:global(.tpl-normal:hover) {
		background-color: rgb(249, 250, 251);
	}
</style>

<!-- Trigger Button -->
<button
	bind:this={triggerEl}
	type="button"
	on:click={toggle}
	{disabled}
	class="w-full flex items-center gap-3 px-4 py-3 border-[3px] rounded-xl text-sm font-bold bg-white transition-all text-left
		{disabled
			? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
			: open
				? 'border-[#ffc480] shadow-[4px_4px_0_0_#ffc480]'
				: 'border-gray-900 hover:shadow-[4px_4px_0_0_#1f2937] cursor-pointer'}"
>
	{#if displayTemplate}
		{#if displayTemplate.thumbnail}
			<img
				src={displayTemplate.thumbnail}
				alt=""
				class="w-10 h-[30px] object-cover rounded border-[1.5px] border-gray-200 shrink-0 bg-gray-100"
			/>
		{:else}
			<div class="w-10 h-[30px] rounded border-[1.5px] border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center">
				<svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</div>
		{/if}
		<span class="truncate flex-1 text-gray-900">{displayTemplate.name || displayTemplate.uid}</span>
		{#if displayTemplate.width && displayTemplate.height}
			<span class="shrink-0 text-[10px] font-black uppercase tracking-widest bg-gray-100 border-[1.5px] border-gray-200 text-gray-500 px-2 py-0.5 rounded-md">
				{displayTemplate.width}x{displayTemplate.height}
			</span>
		{/if}
	{:else}
		<span class="text-gray-400 flex-1">{placeholder}</span>
	{/if}

	<!-- Chevron -->
	<svg
		class="w-4 h-4 shrink-0 text-gray-400 transition-transform {open ? 'rotate-180' : ''}"
		fill="none" stroke="currentColor" viewBox="0 0 24 24"
	>
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
	</svg>
</button>
