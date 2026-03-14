<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { Canvas as FabricCanvas, ActiveSelection } from 'fabric'; // v6 import
	import { editor, editorActions } from '../../../store/editor.store';
	import {
		canUndo,
		canRedo,
		triggerUndo,
		triggerRedo,
		isDirty,
		triggerMarkSaved,
		batchState,
		isBatching,
		setupLegacyGlobals,
		cleanupLegacyGlobals
	} from '../../../store/history.store';
	import {
		currentPageIndex,
		pages,
		pageActions,
		outputFormat,
		pdfPreset
	} from '../../../store/pages.store';
	import { loadBrandFonts } from '../../utils/brand-fonts-loader';
	import { isPreviewModeActive, clearPreview } from '../../utils/canvas-preview-engine';
	import { showToast } from '../../../store/toast.store';

	const dispatch = createEventDispatcher();

	let scale = 1;
	let containerWidth = 0;
	let containerHeight = 0;
	let canvasContainer;
	let fabricCanvas;

	// Clipboard for copy/paste
	let clipboardData = null;

	// Page switching for multi-page PDF
	let previousPageIndex = -1;
	let pagesUnsubscribe;
	let isPageSwitching = false; // Guard for race conditions during page switch

	// Undo/Redo History Management
	let historyStack = [];
	let historyIndex = -1;
	let savedHistoryIndex = -1; // Tracks the index where the last save occurred
	let isPerformingUndoRedo = false;
	let isLoadingCanvas = false; // Flag to prevent saves during initial load
	// isBatchingOperations is now managed via batchState store
	let batchUnsubscribe; // Subscription to batchState for reactive batching
	const MAX_HISTORY = 50;

	// Per-page history preservation
	let pageHistoryMap = {};

	// Auto-save timer
	let autoSaveTimer = null;
	const AUTO_SAVE_DELAY = 30000; // 30 seconds

	// Empty state tracking
	let showEmptyState = false;

	function saveState() {
		// Check if batching is active via store
		const isBatchingActive = $isBatching;

		// Only log if blocked to reduce noise, or if successful
		if (
			!fabricCanvas ||
			isPerformingUndoRedo ||
			isLoadingCanvas ||
			isBatchingActive ||
			isPageSwitching
		) {
			if (isPerformingUndoRedo) console.log('🚫 saveState blocked: performing undo/redo');
			if (isLoadingCanvas) console.log('🚫 saveState blocked: loading canvas');
			if (isBatchingActive) console.log('🚫 saveState blocked: batching operations');
			if (isPageSwitching) console.log('🚫 saveState blocked: page switching');
			return;
		}

		// Remove all states after current index (if we've undone and then made a new change)
		historyStack = historyStack.slice(0, historyIndex + 1);

		// Save the current state
		const state = fabricCanvas.toJSON(CUSTOM_PROPS);
		historyStack.push(state);

		// Limit history size
		if (historyStack.length > MAX_HISTORY) {
			historyStack.shift();
			// If we shifted the stack, the saved index moves down by 1
			savedHistoryIndex--;
		} else {
			historyIndex++;
		}

		console.log(
			'📝 State saved. Index:',
			historyIndex,
			'SavedIndex:',
			savedHistoryIndex,
			'Stack length:',
			historyStack.length
		);

		// Update can undo/redo flags
		updateHistoryFlags();

		// Start auto-save debounce timer
		startAutoSaveTimer();

		// Update empty state
		updateEmptyState();
	}

	function updateHistoryFlags() {
		canUndo.set(historyIndex > 0);
		canRedo.set(historyIndex < historyStack.length - 1);
		isDirty.set(historyIndex !== savedHistoryIndex);
	}

	function startAutoSaveTimer() {
		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer);
		}
		autoSaveTimer = setTimeout(() => {
			if ($isDirty) {
				console.log('⏰ Auto-save triggered');
				dispatch('autosave');
			}
		}, AUTO_SAVE_DELAY);
	}

	function updateEmptyState() {
		if (!fabricCanvas || isLoadingCanvas) {
			showEmptyState = false;
			return;
		}
		showEmptyState = fabricCanvas.getObjects().length === 0;
	}

	function performUndo() {
		console.log(
			'⏪ Undo called. Current index:',
			historyIndex,
			'Stack length:',
			historyStack.length
		);
		if (!fabricCanvas || historyIndex <= 0 || isPerformingUndoRedo) {
			if (isPerformingUndoRedo) console.log('❌ Cannot undo - operation already in progress');
			else console.log('❌ Cannot undo - at beginning of history');
			return;
		}

		// Clear preview FIRST - undo will load historical state that doesn't include preview modifications
		if (isPreviewModeActive()) {
			clearPreview(fabricCanvas);
		}

		isPerformingUndoRedo = true;
		historyIndex--;
		console.log('⏪ Undoing to index:', historyIndex);

		const state = historyStack[historyIndex];
		fabricCanvas.loadFromJSON(state, () => {
			fabricCanvas.renderAll();
			editorActions.clearSelection();
			updateHistoryFlags();
			console.log('✅ Undo complete. New index:', historyIndex);

			// Delay resetting the flag to ensure all Fabric.js events have been processed
			// Fabric fires object:added/removed events AFTER this callback completes
			setTimeout(() => {
				isPerformingUndoRedo = false;
				fabricCanvas.requestRenderAll(); // Force visual update
				updateEmptyState();
				console.log('🔓 Undo flag reset');
			}, 50);
		});
	}

	function performRedo() {
		console.log(
			'⏩ Redo called. Current index:',
			historyIndex,
			'Stack length:',
			historyStack.length
		);
		if (!fabricCanvas || historyIndex >= historyStack.length - 1 || isPerformingUndoRedo) {
			if (isPerformingUndoRedo) console.log('❌ Cannot redo - operation already in progress');
			else console.log('❌ Cannot redo - at end of history');
			return;
		}

		// Clear preview FIRST - redo will load historical state that doesn't include preview modifications
		if (isPreviewModeActive()) {
			clearPreview(fabricCanvas);
		}

		isPerformingUndoRedo = true;
		historyIndex++;
		console.log('⏩ Redoing to index:', historyIndex);

		const state = historyStack[historyIndex];
		fabricCanvas.loadFromJSON(state, () => {
			fabricCanvas.renderAll();
			editorActions.clearSelection();
			updateHistoryFlags();
			console.log('✅ Redo complete. New index:', historyIndex);

			// Delay resetting the flag to ensure all Fabric.js events have been processed
			setTimeout(() => {
				isPerformingUndoRedo = false;
				fabricCanvas.requestRenderAll(); // Force visual update
				updateEmptyState();
				console.log('🔓 Redo flag reset');
			}, 50);
		});
	}

	// Subscribe to undo/redo triggers with previous value tracking
	let unsubscribeUndo;
	let unsubscribeRedo;
	let unsubscribeMarkSaved;
	let previousUndoValue;
	let previousRedoValue;
	let previousMarkSavedValue;

	function updateScale() {
		if (!canvasContainer || !fabricCanvas) return;

		// Get the dimensions of the wrapper div (the available space)
		const wrapper = canvasContainer.parentElement.parentElement;
		const availableWidth = wrapper.clientWidth - 64; // Subtract padding (p-8 = 2rem = 32px * 2)
		const availableHeight = wrapper.clientHeight - 160; // Account for padding and toolbar space (64 + 80 for toolbar)

		const canvasWidth = fabricCanvas.width;
		const canvasHeight = fabricCanvas.height;

		if (canvasWidth === 0 || canvasHeight === 0) return;

		const scaleX = availableWidth / canvasWidth;
		const scaleY = availableHeight / canvasHeight;

		// Use the smaller scale to ensure it fits entirely
		// Cap at 1 to avoid upscaling small canvases if not desired,
		// but user asked to "make it smaller such that it fits", so we mainly care about downscaling.
		// Let's allow upscaling too if the screen is huge, but usually it's about fitting.
		scale = Math.min(scaleX, scaleY, 1) * 0.95; // 0.95 for a little extra breathing room
	}

	async function initCanvas() {
		// Load brand fonts before initializing canvas
		try {
			const brandFonts = await loadBrandFonts();
			if (brandFonts.length > 0) {
				console.log('🎨 Loaded brand fonts:', brandFonts);
			}
		} catch (error) {
			console.warn('Failed to load brand fonts:', error);
		}

		// Get dimensions based on output format
		let width = 1080;
		let height = 1080;

		// For PDF templates, use the preset dimensions at 72 DPI (standard PDF points)
		// The backend will scale these to the correct PDF page size (96 DPI for Puppeteer)
		if ($outputFormat === 'pdf') {
			const preset = $pdfPreset || 'A4';
			const pdfDimensions = {
				A4: { width: 595, height: 842 },
				A4_LANDSCAPE: { width: 842, height: 595 },
				LETTER: { width: 612, height: 792 },
				LETTER_LANDSCAPE: { width: 792, height: 612 },
				LEGAL: { width: 612, height: 1008 },
				LEGAL_LANDSCAPE: { width: 1008, height: 612 },
				A3: { width: 842, height: 1191 },
				A3_LANDSCAPE: { width: 1191, height: 842 },
				TABLOID: { width: 792, height: 1224 },
				TABLOID_LANDSCAPE: { width: 1224, height: 792 }
			};
			const dims = pdfDimensions[preset] || pdfDimensions['A4'];
			width = dims.width;
			height = dims.height;
			console.log(`📄 PDF Canvas initialized with ${preset}: ${width}x${height}`);
		}

		const canvasElement = document.createElement('canvas');
		canvasContainer.appendChild(canvasElement);

		fabricCanvas = new FabricCanvas(canvasElement, {
			width: width,
			height: height,
			backgroundColor: '#ffffff',
			preserveObjectStacking: true,
			// Selection styling - only stroke, no fill
			selectionColor: 'rgba(59, 130, 246, 0.05)',
			selectionBorderColor: '#3b82f6',
			selectionLineWidth: 2,
			// Control styling
			borderColor: '#3b82f6',
			cornerColor: '#3b82f6',
			cornerSize: 8,
			cornerStyle: 'circle',
			borderDashArray: [5, 5],
			transparentCorners: false,
			borderOpacityWhenMoving: 0.5,
			cornerStrokeColor: '#ffffff'
		});

		// Set the editor store
		editorActions.setCanvas(fabricCanvas);

		// Set up legacy window globals for backward compatibility
		// This allows existing code using window.__historyBatchStart/End to continue working
		setupLegacyGlobals();

		// Subscribe to batchState changes to trigger saveState when batch ends
		batchUnsubscribe = batchState.subscribe(($batch) => {
			// When batch transitions from active to inactive, save state
			if (!$batch.isActive && fabricCanvas) {
				// Small delay to ensure all canvas operations have completed
				setTimeout(() => {
					saveState();
				}, 10);
			}
		});

		// Handle selection events
		fabricCanvas.on('selection:created', handleSelection);
		fabricCanvas.on('selection:updated', handleSelection);
		fabricCanvas.on('selection:cleared', handleSelectionCleared);

		// Track if we're in drawing mode
		let isDrawing = false;

		// Detect when free drawing starts
		fabricCanvas.on('mouse:down', () => {
			// Safety: If user interacts, we are definitely done loading
			if (isLoadingCanvas) {
				console.warn('⚠️ User interaction detected while isLoadingCanvas=true. Forcing false.');
				isLoadingCanvas = false;
			}

			if (fabricCanvas.isDrawingMode) {
				isDrawing = true;
			}
		});

		// Save when path is completely drawn
		fabricCanvas.on('path:created', () => {
			console.log('✏️ Path drawing complete');
			isDrawing = false;
			saveState();
		});

		// Textbox: only allow horizontal resize (convert scaleX to width), lock vertical scaling
		fabricCanvas.on('object:scaling', (e) => {
			const target = e.target;
			if (target && target.type.toLowerCase() === 'textbox') {
				const newWidth = target.width * target.scaleX;
				target.set({
					width: newWidth,
					scaleX: 1,
					scaleY: 1
				});
			}
		});

		// object:modified fires ONCE when transformation completes (not during drag/resize)
		fabricCanvas.on('object:modified', async (e) => {
			console.log('🔧 Object modified:', e.target?.type);

			// Don't save during undo/redo operations
			if (isPerformingUndoRedo) {
				console.log('🚫 object:modified ignored during undo/redo');
				return;
			}
			if (isLoadingCanvas) {
				console.log('🚫 object:modified ignored during loading');
				return;
			}

			// Pattern fill: convert scale into new bounds and regenerate
			const target = e.target;
			if (target && target.isPatternFill && (target.scaleX !== 1 || target.scaleY !== 1)) {
				// Use patternBounds * scale (not group.width which may be larger due to stagger)
				const newBoundsW = Math.round((target.patternBoundsWidth || target.width) * target.scaleX);
				const newBoundsH = Math.round(
					(target.patternBoundsHeight || target.height) * target.scaleY
				);
				const left = target.left;
				const top = target.top;
				const id = target.id;
				const sourceJSON = JSON.parse(JSON.stringify(target.patternSourceJSON));

				const { generatePatternGroup } = await import('../../utils/pattern-fill');
				const { group } = await generatePatternGroup(sourceJSON, {
					boundsWidth: newBoundsW,
					boundsHeight: newBoundsH,
					spacingX: target.patternSpacingX || 0,
					spacingY: target.patternSpacingY || 0,
					stagger: target.patternStagger || false
				});
				group.set({ left, top });
				if (id) group.set('id', id);

				fabricCanvas.remove(target);
				fabricCanvas.add(group);
				fabricCanvas.setActiveObject(group);
				fabricCanvas.requestRenderAll();
				editorActions.selectComponent(group);
				saveState();
				return;
			}

			if (fabricCanvas.getActiveObject()) {
				editorActions.selectComponent(fabricCanvas.getActiveObject());
			}
			saveState();
		});

		// Track object additions and removals for history (but not during drawing)
		fabricCanvas.on('object:added', (e) => {
			// Ignore guideline objects (snap-to-align helper lines)
			if (e.target?.guideline) return;

			// Ignore temporary/helper objects (like polygon construction guides)
			// These have selectable:false and evented:false
			if (e.target?.selectable === false && e.target?.evented === false) return;

			if (!isDrawing && !isPerformingUndoRedo && !isLoadingCanvas) {
				console.log('➕ Object added:', e.target?.type);
				saveState();
			}
		});
		fabricCanvas.on('object:removed', (e) => {
			// Ignore guideline objects (snap-to-align helper lines)
			if (e.target?.guideline) return;

			// Ignore temporary/helper objects (like polygon construction guides)
			if (e.target?.selectable === false && e.target?.evented === false) return;

			if (!isDrawing && !isPerformingUndoRedo && !isLoadingCanvas) {
				console.log('➖ Object removed:', e.target?.type);
				saveState();
			}
		});

		// Handle double click on groups — enter interactive editing mode
		// instead of destructively ungrouping (which breaks layout on save)
		fabricCanvas.on('mouse:dblclick', (e) => {
			const target = e.target;
			if (target && target.type === 'group') {
				// Prevent entering protected elements
				if (target.isPatternFill || target.isQRCode || target.isChart || target.isTable) {
					console.log('🔒 Protected group — double-click edit blocked');
					return;
				}

				// Enable interactive mode on this group so sub-objects become selectable
				target.set({
					subTargetCheck: true,
					interactive: true
				});
				fabricCanvas.requestRenderAll();
				console.log('🔓 Group entered interactive mode via double-click');
			}
		});

		// Subscribe to undo/redo triggers - track previous value to avoid firing on initial subscription
		unsubscribeUndo = triggerUndo.subscribe((value) => {
			console.log(
				'🔔 triggerUndo subscription fired. Value:',
				value,
				'Previous:',
				previousUndoValue
			);
			if (previousUndoValue !== undefined && value !== previousUndoValue) {
				console.log('▶️ Triggering undo...');
				performUndo();
			}
			previousUndoValue = value;
		});

		unsubscribeRedo = triggerRedo.subscribe((value) => {
			console.log(
				'🔔 triggerRedo subscription fired. Value:',
				value,
				'Previous:',
				previousRedoValue
			);
			if (previousRedoValue !== undefined && value !== previousRedoValue) {
				console.log('▶️ Triggering redo...');
				performRedo();
			}
			previousRedoValue = value;
		});

		unsubscribeMarkSaved = triggerMarkSaved.subscribe((value) => {
			if (previousMarkSavedValue !== undefined && value !== previousMarkSavedValue) {
				console.log('💾 Marking current state as saved. Index:', historyIndex);
				savedHistoryIndex = historyIndex;
				updateHistoryFlags();
			}
			previousMarkSavedValue = value;
		});

		// Allow canvas to finish initializing before saving initial state
		// This prevents saving an empty canvas as the first state
		isLoadingCanvas = true;
		setTimeout(() => {
			isLoadingCanvas = false;
			saveState();
			// Initial state is considered saved
			savedHistoryIndex = historyIndex;
			updateHistoryFlags();
			updateEmptyState();
			console.log('🎨 Canvas initialization complete, history tracking started');
		}, 500); // Increased delay to ensure canvas is fully set up

		// Initial scale update
		updateScale();
	}

	// ... (handleSelection, handleSelectionCleared, handleKeyDown remain same)

	function handleSelection(e) {
		// Always use getActiveObject() to get the current selection
		// This returns an ActiveSelection when multiple objects are selected
		// or the single object when only one is selected
		const activeObject = fabricCanvas.getActiveObject();
		editorActions.selectComponent(activeObject);
	}

	function handleSelectionCleared() {
		editorActions.clearSelection();
	}

	// Custom properties to preserve during copy/paste
	const CUSTOM_PROPS = [
		'id',
		'isVariable',
		'variableBindings',
		'variableName',
		'variableProperty',
		'isChart',
		'chartType',
		'chartData',
		'chartConfig',
		'isTable',
		'tableType',
		'tableHeaders',
		'tableRows',
		'tableData',
		'tableConfig',
		'tableStyle',
		'isQRCode',
		'qrData',
		'qrConfig',
		'showWhen',
		'hideWhen',
		'loopVariable',
		'loopItemName',
		'loopIndexName',
		'loopDirection',
		'loopSpacing',
		'loopColumns',
		'isPatternFill',
		'patternSourceJSON',
		'patternBoundsWidth',
		'patternBoundsHeight',
		'patternSpacingX',
		'patternSpacingY',
		'patternStagger',
		'figmaImport',
		'subTargetCheck',
		'interactive'
	];

	function copySelection() {
		const active = fabricCanvas.getActiveObject();
		if (!active) return;

		// Serialize with custom props
		if (active.type === 'activeselection' || active.type === 'ActiveSelection') {
			clipboardData = active.getObjects().map((obj) => obj.toObject(CUSTOM_PROPS));
		} else {
			clipboardData = [active.toObject(CUSTOM_PROPS)];
		}
	}

	async function pasteSelection() {
		if (!clipboardData || clipboardData.length === 0) return;

		const { util } = await import('fabric');
		const clones = await util.enlivenObjects(
			clipboardData.map((d) => JSON.parse(JSON.stringify(d)))
		);

		fabricCanvas.discardActiveObject();

		const pastedObjects = [];
		for (const clone of clones) {
			// Offset so the paste is visible (not on top of original)
			clone.set({
				left: (clone.left || 0) + 20,
				top: (clone.top || 0) + 20
			});
			// New element gets a fresh id
			clone.set('id', undefined);

			// Copy over custom props that enlivenObjects may not restore
			const srcData = clipboardData[clones.indexOf(clone)];
			for (const prop of CUSTOM_PROPS) {
				if (prop === 'id') continue; // skip id — we want a new one
				if (srcData[prop] !== undefined) {
					clone.set(prop, srcData[prop]);
				}
			}

			fabricCanvas.add(clone);
			pastedObjects.push(clone);
		}

		// Select the pasted object(s)
		if (pastedObjects.length === 1) {
			fabricCanvas.setActiveObject(pastedObjects[0]);
		} else if (pastedObjects.length > 1) {
			const { ActiveSelection } = await import('fabric');
			const sel = new ActiveSelection(pastedObjects, { canvas: fabricCanvas });
			fabricCanvas.setActiveObject(sel);
		}

		fabricCanvas.requestRenderAll();

		// Update clipboard offset so next paste goes further
		clipboardData = clipboardData.map((d) => ({
			...d,
			left: (d.left || 0) + 20,
			top: (d.top || 0) + 20
		}));
	}

	function handleKeyDown(e) {
		// Skip shortcuts when user is editing text
		const activeObject = fabricCanvas?.getActiveObject();
		if (activeObject?.isEditing) {
			// Still allow Cmd+Z for undo within text editing
			if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
				// Let FabricJS handle text undo natively
				return;
			}
			return;
		}

		// Handle undo/redo keyboard shortcuts
		if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
			e.preventDefault();
			if (e.shiftKey) {
				performRedo();
			} else {
				performUndo();
			}
			return;
		}

		// Copy: Cmd+C / Ctrl+C
		if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
			e.preventDefault();
			copySelection();
			return;
		}

		// Paste: Cmd+V / Ctrl+V
		if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
			e.preventDefault();
			pasteSelection();
			return;
		}

		// Duplicate: Cmd+D / Ctrl+D
		if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
			e.preventDefault();
			copySelection();
			pasteSelection();
			return;
		}

		// Only use Delete key (not Backspace) for deleting objects
		// On Mac, Backspace is for text editing, Delete (Fn+Delete) is for object deletion
		if (e.key === 'Delete') {
			if (activeObject) {
				// Handle multi-selection (ActiveSelection contains multiple objects)
				if (activeObject.type === 'activeselection' || activeObject.type === 'ActiveSelection') {
					const objects = activeObject.getObjects().concat();
					fabricCanvas.discardActiveObject();
					objects.forEach((obj) => fabricCanvas.remove(obj));
				} else {
					fabricCanvas.remove(activeObject);
					fabricCanvas.discardActiveObject();
				}
				fabricCanvas.renderAll();
				editorActions.clearSelection();
				showToast('Element deleted — Cmd+Z to undo', 'default', 2500);
			}
		}
	}

	// Beforeunload handler - warn user about unsaved changes
	function handleBeforeUnload(e) {
		if ($isDirty) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('resize', updateScale);
			window.removeEventListener('beforeunload', handleBeforeUnload);
		}
		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer);
		}
		if (unsubscribeUndo) unsubscribeUndo();
		if (unsubscribeRedo) unsubscribeRedo();
		if (unsubscribeMarkSaved) unsubscribeMarkSaved();
		if (batchUnsubscribe) batchUnsubscribe();
		// Clean up legacy window globals
		cleanupLegacyGlobals();
		if (fabricCanvas) {
			fabricCanvas.dispose();
		}
		editorActions.clearCanvas();
	});

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeyDown);
			window.addEventListener('resize', updateScale);
			window.addEventListener('beforeunload', handleBeforeUnload);
		}
		// Initialize Fabric Canvas
		// We need to wait for the container to be available
		if (canvasContainer) {
			initCanvas();

			// Observe container resizing
			const resizeObserver = new ResizeObserver(() => {
				updateScale();
			});
			resizeObserver.observe(canvasContainer.parentElement.parentElement);

			// Subscribe to page changes for multi-page PDF
			pagesUnsubscribe = currentPageIndex.subscribe((newIndex) => {
				if (fabricCanvas && previousPageIndex !== newIndex) {
					console.log(`📄 Switching from page ${previousPageIndex + 1} to page ${newIndex + 1}`);

					// CRITICAL: Clear preview BEFORE serialization to avoid saving preview clones
					// Preview clones have _isPreviewClone=true but that's not in the serialization list
					if (isPreviewModeActive()) {
						clearPreview(fabricCanvas);
					}

					isPageSwitching = true;

					// Save current page's undo history before switching
					if (previousPageIndex >= 0) {
						pageHistoryMap[previousPageIndex] = {
							historyStack: [...historyStack],
							historyIndex,
							savedHistoryIndex
						};
					}

					// Save current page data before switching
					const currentData = fabricCanvas.toJSON([
						'id',
						'isVariable',
						'variableBindings',
						'variableName',
						'variableProperty',
						'isChart',
						'chartType',
						'chartData',
						'chartConfig',
						'isTable',
						'tableType',
						'tableHeaders',
						'tableRows',
						'tableData',
						'tableConfig',
						'tableStyle',
						'isQRCode',
						'qrData',
						'qrConfig',
						'showWhen',
						'hideWhen',
						'loopVariable',
						'loopItemName',
						'loopIndexName',
						'loopDirection',
						'loopSpacing',
						'loopColumns',
						'isPatternFill',
						'patternSourceJSON',
						'patternBoundsWidth',
						'patternBoundsHeight',
						'patternSpacingX',
						'patternSpacingY',
						'patternStagger',
						'figmaImport',
						'subTargetCheck',
						'interactive'
					]);
					// Pass previousPageIndex to ensure we save to the page we are LEAVING
					pageActions.updateCurrentPageData(currentData, previousPageIndex);

					// Load new page data
					const newPageData = $pages[newIndex]?.fabricJSData;
					if (newPageData) {
						isLoadingCanvas = true;
						try {
							// Fabric v6 uses Promises for loadFromJSON
							const loadPromise = fabricCanvas.loadFromJSON(newPageData);

							if (loadPromise && typeof loadPromise.then === 'function') {
								loadPromise
									.then(() => {
										fabricCanvas.renderAll();
										fabricCanvas.requestRenderAll();
										editorActions.clearSelection();
										// Restore page-specific history or initialize fresh
										restorePageHistory(newIndex);
										isLoadingCanvas = false;
										isPageSwitching = false;
										updateEmptyState();
										console.log('✅ Page loaded via Promise');

										// Force another render after a short delay
										setTimeout(() => {
											fabricCanvas.requestRenderAll();
										}, 50);
									})
									.catch((err) => {
										console.error('Error loading page:', err);
										showToast('Failed to load page — staying on current page', 'error');
										isLoadingCanvas = false;
										isPageSwitching = false;
									});
							} else {
								// Fallback for older Fabric.js behavior
								fabricCanvas.renderAll();
								fabricCanvas.requestRenderAll();
								editorActions.clearSelection();
								restorePageHistory(newIndex);
								isLoadingCanvas = false;
								isPageSwitching = false;
								updateEmptyState();
								console.log('✅ Page loaded (sync)');
							}
						} catch (err) {
							console.error('Error loading page:', err);
							showToast('Failed to load page — staying on current page', 'error');
							isLoadingCanvas = false;
							isPageSwitching = false;
						}
					} else {
						// New blank page - clear canvas
						fabricCanvas.clear();
						fabricCanvas.backgroundColor = '#ffffff';
						fabricCanvas.renderAll();
						fabricCanvas.requestRenderAll();
						editorActions.clearSelection();
						// Reset history
						restorePageHistory(newIndex);
						isPageSwitching = false;
						updateEmptyState();
						console.log('📄 Blank page created');
					}

					previousPageIndex = newIndex;
				}
			});

			return () => {
				resizeObserver.disconnect();
				if (pagesUnsubscribe) pagesUnsubscribe();
			};
		}
	});

	// Restore or initialize history for a page
	function restorePageHistory(pageIndex) {
		const saved = pageHistoryMap[pageIndex];
		if (saved) {
			historyStack = [...saved.historyStack];
			historyIndex = saved.historyIndex;
			savedHistoryIndex = saved.savedHistoryIndex;
		} else {
			historyStack = [fabricCanvas.toJSON(CUSTOM_PROPS)];
			historyIndex = 0;
			savedHistoryIndex = 0;
		}
		updateHistoryFlags();
	}

	// Clean up history when a page is deleted
	export function clearPageHistory(pageIndex) {
		delete pageHistoryMap[pageIndex];
	}

	// Reactive statement to update scale if editor dimensions change programmatically
	$: if ($editor && ($editor.width || $editor.height)) {
		updateScale();
	}
</script>

<div
	class="absolute inset-0 bg-[#e5e5e5] overflow-hidden flex items-center justify-center p-8"
	style="padding-top: 80px; background-image: radial-gradient(#a1a1aa 1px, transparent 1px); background-size: 20px 20px;"
>
	<!-- Loading overlay -->
	{#if isLoadingCanvas || isPageSwitching}
		<div class="absolute inset-0 z-10 flex items-center justify-center bg-[#e5e5e5]/60">
			<div class="flex flex-col items-center gap-3">
				<div
					class="w-8 h-8 border-[3px] border-gray-900 border-t-transparent rounded-full animate-spin"
				/>
				<span class="text-xs font-black uppercase tracking-widest text-gray-600"
					>Loading canvas...</span
				>
			</div>
		</div>
	{/if}

	<div
		class="shadow-[8px_8px_0_0_#1f2937] border-[3px] border-gray-900 bg-white transition-transform duration-200 ease-out origin-center relative"
		style="transform: scale({scale});"
	>
		<div bind:this={canvasContainer}>
			<!-- Canvas will be injected here -->
		</div>

		<!-- Empty state overlay -->
		{#if showEmptyState && !isLoadingCanvas}
			<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
				<p class="text-gray-300 text-sm font-medium text-center px-8">
					Click <span class="font-black">+</span> to add elements or use
					<span class="font-black">Cmd+K</span> for AI Copilot
				</p>
			</div>
		{/if}
	</div>
</div>
