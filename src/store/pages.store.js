/**
 * Pages Store
 *
 * Manages multi-page canvas state for PDF templates.
 * Each page has its own FabricJS data and thumbnail.
 */

import { writable, derived, get } from 'svelte/store';

/**
 * Page structure:
 * {
 *   id: number,
 *   name: string,
 *   fabricJSData: object | null,
 *   thumbnail: string | null
 * }
 */

// Default first page
const createDefaultPage = (pageNumber = 1) => ({
	id: pageNumber,
	name: `Page ${pageNumber}`,
	fabricJSData: null,
	thumbnail: null
});

// All pages in the document
export const pages = writable([createDefaultPage(1)]);

// Current page index (0-based)
export const currentPageIndex = writable(0);

// Current page derived store
export const currentPage = derived(
	[pages, currentPageIndex],
	([$pages, $index]) => $pages[$index] || null
);

// Total page count
export const pageCount = derived(pages, ($pages) => $pages.length);

// Output format for the template
export const outputFormat = writable('image');

// PDF preset
export const pdfPreset = writable('A4');

/**
 * Page actions
 */
export const pageActions = {
	/**
	 * Initialize pages from template data
	 */
	initFromTemplate(template) {
		if (!template) return;

		outputFormat.set(template.outputFormat || 'image');
		pdfPreset.set(template.pdfPreset || 'A4');

		if (template.outputFormat === 'pdf' && template.pages && template.pages.length > 0) {
			// Multi-page PDF template
			pages.set(
				template.pages.map((page, index) => ({
					id: page.pageNumber || index + 1,
					name: page.name || `Page ${index + 1}`,
					fabricJSData: page.fabricJSData,
					thumbnail: null
				}))
			);
		} else if (template.fabricJSData) {
			// Single page template (image or legacy)
			pages.set([
				{
					id: 1,
					name: 'Page 1',
					fabricJSData: template.fabricJSData,
					thumbnail: null
				}
			]);
		} else {
			// New template
			pages.set([createDefaultPage(1)]);
		}

		currentPageIndex.set(0);
	},

	/**
	 * Add a new page
	 */
	addPage() {
		const $pages = get(pages);
		const newPageNumber = $pages.length + 1;

		pages.update((p) => [...p, createDefaultPage(newPageNumber)]);

		// Switch to new page
		currentPageIndex.set($pages.length);

		return newPageNumber;
	},

	/**
	 * Delete a page by id
	 */
	deletePage(id) {
		const $pages = get(pages);

		// Don't delete last page
		if ($pages.length <= 1) return false;

		const deleteIndex = $pages.findIndex((p) => p.id === id);
		if (deleteIndex === -1) return false;

		pages.update((p) => p.filter((page) => page.id !== id));

		// Adjust current index if needed
		const $currentIndex = get(currentPageIndex);
		if ($currentIndex >= deleteIndex && $currentIndex > 0) {
			currentPageIndex.update((i) => i - 1);
		}

		return true;
	},

	/**
	 * Switch to a different page
	 */
	switchPage(index) {
		const $pages = get(pages);
		if (index >= 0 && index < $pages.length) {
			currentPageIndex.set(index);
			return true;
		}
		return false;
	},

	/**
	 * Update current page's FabricJS data
	 */
	updateCurrentPageData(fabricJSData, pageIndex = null) {
		const $currentIndex = get(currentPageIndex);
		const targetIndex = pageIndex !== null ? pageIndex : $currentIndex;

		pages.update((p) => {
			const updated = [...p];
			if (updated[targetIndex]) {
				updated[targetIndex] = {
					...updated[targetIndex],
					fabricJSData
				};
			}
			return updated;
		});
	},

	/**
	 * Update current page's thumbnail
	 */
	updateCurrentPageThumbnail(thumbnail) {
		const $currentIndex = get(currentPageIndex);

		pages.update((p) => {
			const updated = [...p];
			if (updated[$currentIndex]) {
				updated[$currentIndex] = {
					...updated[$currentIndex],
					thumbnail
				};
			}
			return updated;
		});
	},

	/**
	 * Rename a page
	 */
	renamePage(id, name) {
		pages.update((p) => p.map((page) => (page.id === id ? { ...page, name } : page)));
	},

	/**
	 * Reorder pages (move from one index to another)
	 */
	reorderPages(fromIndex, toIndex) {
		pages.update((p) => {
			const updated = [...p];
			const [moved] = updated.splice(fromIndex, 1);
			updated.splice(toIndex, 0, moved);
			return updated;
		});

		// Update current index if affected
		const $currentIndex = get(currentPageIndex);
		if ($currentIndex === fromIndex) {
			currentPageIndex.set(toIndex);
		} else if (fromIndex < $currentIndex && toIndex >= $currentIndex) {
			currentPageIndex.update((i) => i - 1);
		} else if (fromIndex > $currentIndex && toIndex <= $currentIndex) {
			currentPageIndex.update((i) => i + 1);
		}
	},

	/**
	 * Get pages data for saving to backend
	 */
	getPagesForSave() {
		const $pages = get(pages);
		const $outputFormat = get(outputFormat);
		const $pdfPreset = get(pdfPreset);

		return {
			outputFormat: $outputFormat,
			pdfPreset: $pdfPreset,
			pages: $pages.map((page, index) => ({
				pageNumber: index + 1,
				name: page.name,
				fabricJSData: page.fabricJSData
			}))
		};
	},

	/**
	 * Reset to default single page
	 */
	reset() {
		pages.set([createDefaultPage(1)]);
		currentPageIndex.set(0);
		outputFormat.set('image');
		pdfPreset.set('A4');
	},

	/**
	 * Set output format
	 */
	setOutputFormat(format) {
		outputFormat.set(format);
	},

	/**
	 * Set PDF preset
	 */
	setPdfPreset(preset) {
		pdfPreset.set(preset);
	}
};
