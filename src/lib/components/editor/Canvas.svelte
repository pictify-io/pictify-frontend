<script>
	import { onMount, onDestroy } from 'svelte';
	import { Canvas, ActiveSelection } from 'fabric'; // v6 import
	import { editor, editorActions } from '../../../store/editor.store';
	import { canUndo, canRedo, triggerUndo, triggerRedo, isDirty, triggerMarkSaved } from '../../../store/history.store';
	import { currentPageIndex, pages, pageActions, outputFormat, pdfPreset } from '../../../store/pages.store';
	import { loadBrandFonts } from '../../utils/brand-fonts-loader';
	import { isPreviewModeActive, clearPreview } from '../../utils/canvas-preview-engine';

	let scale = 1;
	let containerWidth = 0;
	let containerHeight = 0;
	let canvasContainer;
	let fabricCanvas;
	
	// Page switching for multi-page PDF
	let previousPageIndex = -1;
	let pagesUnsubscribe;

	// Undo/Redo History Management
	let historyStack = [];
	let historyIndex = -1;
	let savedHistoryIndex = -1; // Tracks the index where the last save occurred
	let isPerformingUndoRedo = false;
	let isLoadingCanvas = false; // Flag to prevent saves during initial load
	let isBatchingOperations = false; // Flag to batch multiple operations into one history entry
	const MAX_HISTORY = 50;

	function saveState() {
		// Only log if blocked to reduce noise, or if successful
		if (!fabricCanvas || isPerformingUndoRedo || isLoadingCanvas || isBatchingOperations) {
			if (isPerformingUndoRedo) console.log('🚫 saveState blocked: performing undo/redo');
			if (isLoadingCanvas) console.log('🚫 saveState blocked: loading canvas');
			if (isBatchingOperations) console.log('🚫 saveState blocked: batching operations');
			return;
		}
		
		// Remove all states after current index (if we've undone and then made a new change)
		historyStack = historyStack.slice(0, historyIndex + 1);
		
		// Save the current state
		const state = fabricCanvas.toJSON();
		historyStack.push(state);
		
		// Limit history size
		if (historyStack.length > MAX_HISTORY) {
			historyStack.shift();
			// If we shifted the stack, the saved index moves down by 1
			savedHistoryIndex--;
		} else {
			historyIndex++;
		}
		
		console.log('📝 State saved. Index:', historyIndex, 'SavedIndex:', savedHistoryIndex, 'Stack length:', historyStack.length);
		
		// Update can undo/redo flags
		updateHistoryFlags();
	}

	function updateHistoryFlags() {
		canUndo.set(historyIndex > 0);
		canRedo.set(historyIndex < historyStack.length - 1);
		isDirty.set(historyIndex !== savedHistoryIndex);
	}

	function performUndo() {
		console.log('⏪ Undo called. Current index:', historyIndex, 'Stack length:', historyStack.length);
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
				console.log('🔓 Undo flag reset');
			}, 50);
		});
	}

	function performRedo() {
		console.log('⏩ Redo called. Current index:', historyIndex, 'Stack length:', historyStack.length);
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
				'A4': { width: 595, height: 842 },
				'A4_LANDSCAPE': { width: 842, height: 595 },
				'LETTER': { width: 612, height: 792 },
				'LETTER_LANDSCAPE': { width: 792, height: 612 },
				'LEGAL': { width: 612, height: 1008 },
				'LEGAL_LANDSCAPE': { width: 1008, height: 612 },
				'A3': { width: 842, height: 1191 },
				'A3_LANDSCAPE': { width: 1191, height: 842 },
				'TABLOID': { width: 792, height: 1224 },
				'TABLOID_LANDSCAPE': { width: 1224, height: 792 },
			};
			const dims = pdfDimensions[preset] || pdfDimensions['A4'];
			width = dims.width;
			height = dims.height;
			console.log(`📄 PDF Canvas initialized with ${preset}: ${width}x${height}`);
		}

		const canvasElement = document.createElement('canvas');
		canvasContainer.appendChild(canvasElement);

		fabricCanvas = new Canvas(canvasElement, {
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
		
		// Expose history control functions for other components to batch operations
		if (typeof window !== 'undefined') {
			window.__historyBatchStart = () => { 
				console.log('🔄 History batch started');
				isBatchingOperations = true; 
			};
			window.__historyBatchEnd = () => { 
				console.log('🔄 History batch ended');
				isBatchingOperations = false; 
				saveState(); // Save once after batch completes
			};
		}

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
		
		// object:modified fires ONCE when transformation completes (not during drag/resize)
		fabricCanvas.on('object:modified', (e) => {
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

		// Handle double click to ungroup and edit items
		fabricCanvas.on('mouse:dblclick', (e) => {
			const target = e.target;
			if (target && target.type === 'group') {
				// Manual ungroup implementation since toActiveSelection is missing
				// 1. Get items and restore their canvas coordinates
				const items = target._objects.concat(); // Copy array
				
				// Restore objects to their original state (canvas coordinates)
				if (typeof target._restoreObjectsState === 'function') {
					target._restoreObjectsState();
				} else {
					// Fallback if _restoreObjectsState is missing (unlikely for Group)
					// We would need manual matrix multiplication here
					console.warn('_restoreObjectsState missing on group');
				}

				// 2. Remove group from canvas
				fabricCanvas.remove(target);
				
				// 3. Add items back to canvas
				items.forEach(obj => {
					fabricCanvas.add(obj);
				});
				
				// 4. Create active selection
				const activeSelection = new ActiveSelection(items, {
					canvas: fabricCanvas
				});
				
				fabricCanvas.setActiveObject(activeSelection);
				fabricCanvas.requestRenderAll();
				
				// Update selection in store
				editorActions.selectComponent(activeSelection);
				
				// Save state since structure changed
				saveState();
				console.log('🔓 Group ungrouped manually via double-click');
			}
		});

		// Subscribe to undo/redo triggers - track previous value to avoid firing on initial subscription
		unsubscribeUndo = triggerUndo.subscribe((value) => {
			console.log('🔔 triggerUndo subscription fired. Value:', value, 'Previous:', previousUndoValue);
			if (previousUndoValue !== undefined && value !== previousUndoValue) {
				console.log('▶️ Triggering undo...');
				performUndo();
			}
			previousUndoValue = value;
		});
		
		unsubscribeRedo = triggerRedo.subscribe((value) => {
			console.log('🔔 triggerRedo subscription fired. Value:', value, 'Previous:', previousRedoValue);
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
			console.log('🎨 Canvas initialization complete, history tracking started');
		}, 500); // Increased delay to ensure canvas is fully set up

		// Initial scale update
		updateScale();
		
		// Update scale when canvas dimensions change
		// We can hook into a custom event or just check periodically/on window resize
		// Fabric doesn't emit a generic 'dimensions:modified' event easily accessible here without mixins
		// But we can listen to our own store or just rely on the ResizeObserver for the container
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

	function handleKeyDown(e) {
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

		// Only use Delete key (not Backspace) for deleting objects
		// On Mac, Backspace is for text editing, Delete (Fn+Delete) is for object deletion
		if (e.key === 'Delete') {
			const activeObject = fabricCanvas.getActiveObject();
			if (activeObject && !activeObject.isEditing) {
				fabricCanvas.remove(activeObject);
				fabricCanvas.discardActiveObject();
				fabricCanvas.renderAll();
				editorActions.clearSelection();
			}
		}
	}

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('resize', updateScale);
		}
		if (unsubscribeUndo) unsubscribeUndo();
		if (unsubscribeRedo) unsubscribeRedo();
		if (unsubscribeMarkSaved) unsubscribeMarkSaved();
		if (fabricCanvas) {
			fabricCanvas.dispose();
		}
		editorActions.clearCanvas();
	});

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeyDown);
			window.addEventListener('resize', updateScale);
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

					// Save current page data before switching
					const currentData = fabricCanvas.toJSON([
						'id', 'isVariable', 'variableBindings', 'variableName', 'variableProperty',
						'isChart', 'chartType', 'chartData', 'chartConfig',
						'isTable', 'tableType', 'tableHeaders', 'tableRows', 'tableData', 'tableConfig', 'tableStyle',
						'isQRCode', 'qrData', 'qrConfig',
						'showWhen', 'hideWhen',
						'loopVariable', 'loopItemName', 'loopIndexName', 'loopDirection', 'loopSpacing', 'loopColumns'
					]);
					// Pass previousPageIndex to ensure we save to the page we are LEAVING
					pageActions.updateCurrentPageData(currentData, previousPageIndex);
					
					// Load new page data
					const newPageData = $pages[newIndex]?.fabricJSData;
					if (newPageData) {
						isLoadingCanvas = true;
						// Fabric v6 uses Promises for loadFromJSON
						const loadPromise = fabricCanvas.loadFromJSON(newPageData);
						
						if (loadPromise && typeof loadPromise.then === 'function') {
							loadPromise.then(() => {
								fabricCanvas.renderAll();
								fabricCanvas.requestRenderAll();
								editorActions.clearSelection();
								// Reset history for new page
								historyStack = [fabricCanvas.toJSON()];
								historyIndex = 0;
								savedHistoryIndex = 0;
								updateHistoryFlags();
								isLoadingCanvas = false;
								console.log('✅ Page loaded via Promise');
								
								// Force another render after a short delay
								setTimeout(() => {
									fabricCanvas.requestRenderAll();
								}, 50);
							}).catch(err => {
								console.error('Error loading page:', err);
								isLoadingCanvas = false;
							});
						} else {
							// Fallback for older Fabric.js behavior
							fabricCanvas.renderAll();
							fabricCanvas.requestRenderAll();
							editorActions.clearSelection();
							historyStack = [fabricCanvas.toJSON()];
							historyIndex = 0;
							savedHistoryIndex = 0;
							updateHistoryFlags();
							isLoadingCanvas = false;
							console.log('✅ Page loaded (sync)');
						}
					} else {
						// New blank page - clear canvas
						fabricCanvas.clear();
						fabricCanvas.backgroundColor = '#ffffff';
						fabricCanvas.renderAll();
						fabricCanvas.requestRenderAll();
						editorActions.clearSelection();
						// Reset history
						historyStack = [fabricCanvas.toJSON()];
						historyIndex = 0;
						savedHistoryIndex = 0;
						updateHistoryFlags();
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
	
	// Reactive statement to update scale if editor dimensions change programmatically
	$: if ($editor && ($editor.width || $editor.height)) {
		updateScale();
	}
</script>

<div class="absolute inset-0 bg-[#e5e5e5] overflow-hidden flex items-center justify-center p-8" 
	style="padding-top: 80px; background-image: radial-gradient(#a1a1aa 1px, transparent 1px); background-size: 20px 20px;">
	<div 
		class="shadow-[8px_8px_0_0_#1f2937] border-[3px] border-gray-900 bg-white transition-transform duration-200 ease-out origin-center"
		style="transform: scale({scale});"
	>
		<div bind:this={canvasContainer}>
			<!-- Canvas will be injected here -->
		</div>
	</div>
</div>
