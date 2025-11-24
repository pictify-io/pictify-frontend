<script>
	import { onMount, onDestroy } from 'svelte';
	import { Canvas } from 'fabric'; // v6 import
	import { editor, editorActions } from '../../../store/editor.store';
	import { canUndo, canRedo, triggerUndo, triggerRedo } from '../../../store/history.store';

	let scale = 1;
	let containerWidth = 0;
	let containerHeight = 0;
	let canvasContainer;
	let fabricCanvas;

	// Undo/Redo History Management
	let historyStack = [];
	let historyIndex = -1;
	let isPerformingUndoRedo = false;
	let isLoadingCanvas = false; // Flag to prevent saves during initial load
	let isBatchingOperations = false; // Flag to batch multiple operations into one history entry
	const MAX_HISTORY = 50;

	function saveState() {
		if (!fabricCanvas || isPerformingUndoRedo || isLoadingCanvas || isBatchingOperations) return;
		
		// Remove all states after current index (if we've undone and then made a new change)
		historyStack = historyStack.slice(0, historyIndex + 1);
		
		// Save the current state
		const state = fabricCanvas.toJSON();
		historyStack.push(state);
		
		// Limit history size
		if (historyStack.length > MAX_HISTORY) {
			historyStack.shift();
		} else {
			historyIndex++;
		}
		
		console.log('📝 State saved. Index:', historyIndex, 'Stack length:', historyStack.length);
		
		// Update can undo/redo flags
		updateHistoryFlags();
	}

	function updateHistoryFlags() {
		canUndo.set(historyIndex > 0);
		canRedo.set(historyIndex < historyStack.length - 1);
	}

	function performUndo() {
		console.log('⏪ Undo called. Current index:', historyIndex, 'Stack length:', historyStack.length);
		if (!fabricCanvas || historyIndex <= 0) {
			console.log('❌ Cannot undo - at beginning of history');
			return;
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
		if (!fabricCanvas || historyIndex >= historyStack.length - 1) {
			console.log('❌ Cannot redo - at end of history');
			return;
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
	let previousUndoValue;
	let previousRedoValue;

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

	function initCanvas() {
		// Default to a standard size if no template is loaded
		const width = 1080;
		const height = 1080;

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
			if (isPerformingUndoRedo || isLoadingCanvas) return;
			
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

		// Allow canvas to finish initializing before saving initial state
		// This prevents saving an empty canvas as the first state
		isLoadingCanvas = true;
		setTimeout(() => {
			isLoadingCanvas = false;
			saveState();
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
		const selected = e.selected ? e.selected[0] : fabricCanvas.getActiveObject();
		editorActions.selectComponent(selected);
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

		if (e.key === 'Delete' || e.key === 'Backspace') {
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
			
			return () => resizeObserver.disconnect();
		}
	});
	
	// Reactive statement to update scale if editor dimensions change programmatically
	$: if ($editor && ($editor.width || $editor.height)) {
		updateScale();
	}
</script>

<div class="absolute inset-0 bg-gray-100/80 overflow-hidden flex items-center justify-center p-8" style="padding-top: 80px;">
	<div 
		class="shadow-2xl border border-gray-200/50 bg-white transition-transform duration-200 ease-out origin-center ring-1 ring-black/5"
		style="transform: scale({scale});"
	>
		<div bind:this={canvasContainer}>
			<!-- Canvas will be injected here -->
		</div>
	</div>
</div>
