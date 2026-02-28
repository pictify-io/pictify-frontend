<script>
	import { editor, selectedComponent, editorActions } from '../../../store/editor.store';
	import { onMount, onDestroy } from 'svelte';

	let layers = [];
	let draggedLayer = null;
	let dragOverLayerId = null;
	let dropPosition = null; // 'before' | 'after'
	let isDraggingLayer = false;
	let unsubscribe = () => {};
	let dragPlaceholder = null;
	let expandedGroupIds = new Set();

	// Modal state
	let showDeleteModal = false;
	let layerToDelete = null;
	let showRenameModal = false;
	let layerToRename = null;
	let renameInputValue = '';
	let renameInputRef = null;

	// Layer types with icons
	const layerIcons = {
		'i-text': 'fa-font',
		text: 'fa-font',
		rect: 'fa-square',
		circle: 'fa-circle',
		image: 'fa-image',
		group: 'fa-folder',
		path: 'fa-pen'
	};

	const canvasEvents = [
		'object:added',
		'object:removed',
		'object:modified',
		'selection:created',
		'selection:updated',
		'selection:cleared'
	];
	let canvasInstance = null;

	function shouldDisplayLayer(obj) {
		return !(obj.guideline || obj.grid || obj.excludeFromLayers === true);
	}

	function resolveLayerId(obj, index) {
		if (obj.id) return obj.id;
		if (!obj.layerId) {
			obj.layerId = `layer-${Date.now().toString(36)}-${Math.random()
				.toString(36)
				.slice(2, 8)}-${index}`;
		}
		return obj.layerId;
	}

	function isObjectLocked(obj) {
		return Boolean(
			obj.lockMovementX &&
				obj.lockMovementY &&
				obj.lockScalingX &&
				obj.lockScalingY &&
				obj.lockRotation
		);
	}

	function attachCanvasListeners(instance) {
		if (!instance) return;
		if (canvasInstance === instance) return;

		detachCanvasListeners();
		canvasEvents.forEach((eventName) => instance.on(eventName, updateLayers));
		canvasInstance = instance;
	}

	function detachCanvasListeners() {
		if (!canvasInstance) return;
		canvasEvents.forEach((eventName) => canvasInstance.off(eventName, updateLayers));
		canvasInstance = null;
	}

	function updateLayers() {
		if (!$editor) {
			layers = [];
			return;
		}

		const objects = $editor.getObjects();

		const processObjects = (objs, depth = 0, parentId = null) => {
			let result = [];
			// Iterate in reverse order (top to bottom)
			for (let i = objs.length - 1; i >= 0; i--) {
				const obj = objs[i];
				if (!shouldDisplayLayer(obj)) continue;

				const layerId = resolveLayerId(obj, i);
				const isGroup = obj.type === 'group' && obj._objects && obj._objects.length > 0;
				const isExpanded = expandedGroupIds.has(layerId);

				const layer = {
					id: layerId,
					name: obj.name || `${obj.type} ${i + 1}`,
					type: obj.type,
					visible: obj.visible !== false,
					locked: isObjectLocked(obj),
					opacity: obj.opacity !== undefined ? obj.opacity : 1,
					object: obj,
					index: i,
					depth: depth,
					isGroup: isGroup,
					isExpanded: isExpanded,
					parentId: parentId,
					// Dynamic data indicators
					isVariable: obj.isVariable || false,
					hasCondition: !!(obj.showWhen || obj.hideWhen),
					hasLoop: obj.loopVariable !== null && obj.loopVariable !== undefined,
					isChart: obj.isChart || false,
					isTable: obj.isTable || false
				};

				result.push(layer);

				if (isGroup && isExpanded) {
					result = result.concat(processObjects(obj._objects, depth + 1, layerId));
				}
			}
			return result;
		};

		layers = processObjects(objects);
	}

	function toggleGroupExpansion(layer, event) {
		event.stopPropagation();
		if (expandedGroupIds.has(layer.id)) {
			expandedGroupIds.delete(layer.id);
		} else {
			expandedGroupIds.add(layer.id);
		}
		expandedGroupIds = new Set(expandedGroupIds); // Trigger reactivity
		updateLayers();
	}

	function toggleVisibility(layer, event) {
		event.stopPropagation();
		if (!$editor || !layer.object) return;

		const newVisibility = !layer.visible;
		layer.object.set('visible', newVisibility);
		layer.visible = newVisibility;

		if (!newVisibility && $selectedComponent === layer.object) {
			$editor.discardActiveObject();
			editorActions.clearSelection();
		}

		$editor.renderAll();
		updateLayers();
	}

	function toggleLock(layer, event) {
		event.stopPropagation();
		if (!$editor || !layer.object) return;
		const locked = !layer.locked;
		layer.object.lockMovementX = locked;
		layer.object.lockMovementY = locked;
		layer.object.lockRotation = locked;
		layer.object.lockScalingX = locked;
		layer.object.lockScalingY = locked;
		layer.object.selectable = !locked;
		layer.locked = locked;
		$editor.renderAll();
		updateLayers();
	}

	function deleteLayer(layer, event) {
		event.stopPropagation();
		if (!$editor || !layer.object) return;
		layerToDelete = layer;
		showDeleteModal = true;
	}

	function confirmDelete() {
		if (!$editor || !layerToDelete?.object) return;
		if ($selectedComponent === layerToDelete.object) {
			editorActions.clearSelection();
		}
		$editor.remove(layerToDelete.object);
		$editor.renderAll();
		updateLayers();
		closeDeleteModal();
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		layerToDelete = null;
	}

	function duplicateLayer(layer, event) {
		event.stopPropagation();
		if (!$editor) return;

		layer.object.clone((cloned) => {
			cloned.set({
				left: cloned.left + 10,
				top: cloned.top + 10
			});
			$editor.add(cloned);
			$editor.setActiveObject(cloned);
			$editor.renderAll();
			updateLayers();
		});
	}

	function moveLayerUp(layer, event) {
		event.stopPropagation();
		if (!$editor || !layer.object) return;
		$editor.bringObjectForward(layer.object);
		$editor.renderAll();
		notifyLayerChange(layer.object);
	}

	function moveLayerDown(layer, event) {
		event.stopPropagation();
		if (!$editor || !layer.object) return;
		$editor.sendObjectBackwards(layer.object);
		$editor.renderAll();
		notifyLayerChange(layer.object);
	}

	function renameLayer(layer, event) {
		if (event) event.stopPropagation();
		layerToRename = layer;
		renameInputValue = layer.name;
		showRenameModal = true;
		// Focus input after modal renders
		setTimeout(() => {
			if (renameInputRef) {
				renameInputRef.focus();
				renameInputRef.select();
			}
		}, 50);
	}

	function confirmRename() {
		if (!layerToRename?.object || !renameInputValue.trim()) return;
		layerToRename.object.name = renameInputValue.trim();
		updateLayers();
		closeRenameModal();
	}

	function closeRenameModal() {
		showRenameModal = false;
		layerToRename = null;
		renameInputValue = '';
	}

	function handleRenameKeydown(event) {
		if (event.key === 'Enter') {
			confirmRename();
		} else if (event.key === 'Escape') {
			closeRenameModal();
		}
	}

	function notifyLayerChange(target) {
		if (!$editor || !target) return;
		$editor.fire('object:modified', { target });
		updateLayers();
	}

	function selectLayer(layer) {
		if (!$editor || !layer?.object) return;
		const obj = layer.object;
		$editor.discardActiveObject();
		$editor.setActiveObject(obj);
		editorActions.selectComponent(obj);
		$editor.renderAll();
	}

	// Drag and drop reordering
	function handleDragStart(layer, event) {
		// Prevent dragging locked layers
		if (layer.locked) {
			event.preventDefault();
			return;
		}

		draggedLayer = layer;
		isDraggingLayer = true;
		dragOverLayerId = null;
		dropPosition = null;
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', layer.id); // Store layer id

		// Create a custom drag image (optional enhancement)
		try {
			const dragImage = event.currentTarget.cloneNode(true);
			dragImage.style.opacity = '0.8';
			dragImage.style.position = 'absolute';
			dragImage.style.top = '-1000px';
			dragImage.style.pointerEvents = 'none';
			document.body.appendChild(dragImage);
			event.dataTransfer.setDragImage(dragImage, event.offsetX, event.offsetY);
			setTimeout(() => {
				if (dragImage && dragImage.parentNode) {
					dragImage.parentNode.removeChild(dragImage);
				}
			}, 0);
		} catch (error) {
			// If custom drag image fails, the browser will use default
		}
	}

	function handleDragOver(layer, event) {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';

		if (!draggedLayer || draggedLayer.id === layer.id) return false;

		const rect = event.currentTarget.getBoundingClientRect();
		const midpoint = rect.top + rect.height / 2;
		const isAfter = event.clientY > midpoint;

		// Update visual feedback
		if (dragOverLayerId !== layer.id || dropPosition !== (isAfter ? 'after' : 'before')) {
			dragOverLayerId = layer.id;
			dropPosition = isAfter ? 'after' : 'before';
		}

		return false;
	}

	function handleDragLeave(event) {
		if (!draggedLayer) return;

		// Check if we're actually leaving the drop zone
		const relatedTarget = event.relatedTarget;

		// If the related target is not a child of the current target, clear the drop zone
		if (!event.currentTarget.contains(relatedTarget)) {
			// Use a small timeout to prevent flickering when moving between adjacent items
			setTimeout(() => {
				// Only clear if we haven't entered a new drop zone
				if (
					dragOverLayerId &&
					!document.querySelector(`[data-layer-id="${dragOverLayerId}"]:hover`)
				) {
					dragOverLayerId = null;
					dropPosition = null;
				}
			}, 50);
		}
	}

	function handleDragEnd() {
		draggedLayer = null;
		isDraggingLayer = false;
		dragOverLayerId = null;
		dropPosition = null;
		dragPlaceholder = null;
	}

	function reorderCanvasLayers(draggedObj, targetObj, insertAfter) {
		if (!$editor || !draggedObj || !targetObj) {
			return;
		}

		// Check if both are in the same group
		const draggedGroup = draggedObj.group;
		const targetGroup = targetObj.group;

		// If they are in different groups (or one is in group and other is not),
		// we skip reordering for now to avoid complex coordinate transformations
		if (draggedGroup !== targetGroup) {
			return;
		}

		// If inside a group
		if (draggedGroup) {
			const objects = draggedGroup._objects;
			const draggedIndex = objects.indexOf(draggedObj);
			const targetIndex = objects.indexOf(targetObj);

			if (draggedIndex === -1 || targetIndex === -1) return;
			if (draggedIndex === targetIndex) return;

			// Calculate new position
			// UI is reversed (top is highest index), so logic is same as root
			const effectiveInsertAfter = !insertAfter;
			let newPosition = targetIndex;

			if (draggedIndex < targetIndex) {
				newPosition = effectiveInsertAfter ? targetIndex : targetIndex - 1;
			} else {
				newPosition = effectiveInsertAfter ? targetIndex + 1 : targetIndex;
			}

			newPosition = Math.max(0, Math.min(newPosition, objects.length - 1));

			// Reorder in array
			objects.splice(draggedIndex, 1);
			objects.splice(newPosition, 0, draggedObj);

			draggedGroup.addWithUpdate(); // Recalculate group bounds/layout
			$editor.renderAll();
			notifyLayerChange(draggedGroup);
			return;
		}

		// Get all objects and find indices
		const objects = $editor.getObjects();
		const draggedIndex = objects.indexOf(draggedObj);
		const targetIndex = objects.indexOf(targetObj);

		if (draggedIndex === -1 || targetIndex === -1) {
			return;
		}

		// No need to move if already in position
		if (draggedIndex === targetIndex) {
			return;
		}

		// IMPORTANT: The layers are displayed in REVERSE order in the UI
		// So when dragging "up" in the UI, we're actually moving to a HIGHER index in the canvas
		// And when dragging "down" in the UI, we're moving to a LOWER index in the canvas

		// Calculate the final position
		let newPosition = targetIndex;

		// Since layers are reversed in UI:
		// - If UI shows dragging DOWN (visually), draggedIndex > targetIndex (moving backward in array)
		// - If UI shows dragging UP (visually), draggedIndex < targetIndex (moving forward in array)

		// But we need to invert the insertAfter logic due to reverse display
		const effectiveInsertAfter = !insertAfter; // Invert because of reversed display

		if (draggedIndex < targetIndex) {
			// Moving forward in array (UP in reversed UI)
			newPosition = effectiveInsertAfter ? targetIndex : targetIndex - 1;
		} else {
			// Moving backward in array (DOWN in reversed UI)
			newPosition = effectiveInsertAfter ? targetIndex + 1 : targetIndex;
		}

		// Ensure position is within bounds
		newPosition = Math.max(0, Math.min(newPosition, objects.length - 1));

		// Use moveTo method on the object itself (Fabric.js v6)
		if (typeof draggedObj.moveTo === 'function') {
			draggedObj.moveTo(newPosition);
		} else {
			// Fallback: manually reorder by removing and adding
			// Remove the object
			$editor.remove(draggedObj);

			// Get all objects after removal
			const remainingObjects = $editor.getObjects().slice();

			// Clear canvas
			$editor.clear();

			// Re-add objects in new order
			let added = false;
			for (let i = 0; i < remainingObjects.length; i++) {
				// Insert dragged object at the target position
				if (i === newPosition && !added) {
					$editor.add(draggedObj);
					added = true;
				}
				$editor.add(remainingObjects[i]);
			}

			// If not added yet (e.g., adding at the end), add it now
			if (!added) {
				$editor.add(draggedObj);
			}
		}

		// Ensure special objects maintain their positions
		const finalObjects = $editor.getObjects();

		// Keep grid lines at the back
		finalObjects
			.filter((obj) => obj.grid)
			.forEach((obj, index) => {
				if (typeof obj.moveTo === 'function') {
					obj.moveTo(0);
				} else {
					$editor.sendObjectToBack(obj);
				}
			});

		// Keep guidelines at the front
		finalObjects
			.filter((obj) => obj.guideline)
			.forEach((obj) => {
				if (typeof obj.moveTo === 'function') {
					obj.moveTo(finalObjects.length - 1);
				} else {
					$editor.bringObjectToFront(obj);
				}
			});

		// Re-select the dragged object
		$editor.setActiveObject(draggedObj);
		editorActions.selectComponent(draggedObj);

		// Force render
		$editor.renderAll();
		if ($editor.requestRenderAll) {
			$editor.requestRenderAll();
		}

		// Notify change
		notifyLayerChange(draggedObj);
	}

	function handleDrop(targetLayer, event) {
		event.preventDefault();
		event.stopPropagation();

		try {
			// Validate prerequisites
			if (!draggedLayer || !targetLayer || !$editor) {
				handleDragEnd();
				return;
			}

			// Don't drop on itself
			if (draggedLayer.id === targetLayer.id) {
				handleDragEnd();
				return;
			}

			// Ensure both objects exist
			if (!draggedLayer.object || !targetLayer.object) {
				handleDragEnd();
				return;
			}

			const rect = event.currentTarget.getBoundingClientRect();
			const insertAfter = event.clientY > rect.top + rect.height / 2;

			// Reorder the canvas objects
			reorderCanvasLayers(draggedLayer.object, targetLayer.object, insertAfter);

			// Update the layers list
			updateLayers();
		} catch (error) {
			// Silently handle errors
		} finally {
			// Always clean up drag state
			handleDragEnd();
		}
	}

	onMount(() => {
		unsubscribe = editor.subscribe((instance) => {
			if (instance) {
				attachCanvasListeners(instance);
				updateLayers();
			} else {
				detachCanvasListeners();
				layers = [];
			}
		});

		updateLayers();
	});

	onDestroy(() => {
		detachCanvasListeners();
		unsubscribe();
	});
</script>

<div class="layers-panel">
	<div class="panel-header">
		<h3 class="font-black text-sm text-gray-900 uppercase tracking-widest">Layers</h3>
		<span class="layer-count">{layers.length}</span>
	</div>

	<div class="layers-list custom-scrollbar">
		{#if layers.length === 0}
			<div class="empty-state">
				<div class="icon-container">
					<i class="fa fa-layer-group" />
				</div>
				<p>No layers yet</p>
				<span class="hint">Add elements to your canvas</span>
			</div>
		{:else}
			{#each layers as layer (layer.id)}
				<div
					class="layer-item group"
					style="padding-left: {8 + layer.depth * 12}px"
					class:selected={$selectedComponent === layer.object}
					class:hidden-layer={!layer.visible}
					class:locked={layer.locked}
					class:dragging={isDraggingLayer && draggedLayer?.id === layer.id}
					class:drag-over-before={dragOverLayerId === layer.id && dropPosition === 'before'}
					class:drag-over-after={dragOverLayerId === layer.id && dropPosition === 'after'}
					draggable={!layer.locked}
					data-layer-id={layer.id}
					on:click={() => selectLayer(layer)}
					on:dragstart={(e) => handleDragStart(layer, e)}
					on:dragover={(e) => handleDragOver(layer, e)}
					on:dragleave={handleDragLeave}
					on:dragend={handleDragEnd}
					on:drop={(e) => handleDrop(layer, e)}
					role="button"
					tabindex="0"
					on:keydown={(e) => e.key === 'Enter' && selectLayer(layer)}
				>
					<div class="layer-content">
						{#if layer.isGroup}
							<button class="expand-btn" on:click={(e) => toggleGroupExpansion(layer, e)}>
								<i class="fa fa-chevron-{layer.isExpanded ? 'down' : 'right'}" />
							</button>
						{:else}
							<span class="expand-spacer" />
						{/if}

						{#if !layer.locked}
							<span class="drag-handle" title="Drag to reorder">
								<i class="fa fa-grip-vertical" />
							</span>
						{/if}
						<span class="layer-icon">
							<i class="fa {layerIcons[layer.type] || 'fa-file'}" />
						</span>
						<span
							class="layer-name"
							on:dblclick={(e) => renameLayer(layer, e)}
							title="Double-click to rename"
							role="button"
							tabindex="-1"
						>
							{layer.name}
						</span>

						<!-- Dynamic Data Badges -->
						<div class="layer-badges">
							{#if layer.isVariable}
								<span class="layer-badge variable" title="Variable">
									<i class="fa fa-code" />
								</span>
							{/if}
							{#if layer.hasCondition}
								<span class="layer-badge condition" title="Has condition">
									<i class="fa fa-code-branch" />
								</span>
							{/if}
							{#if layer.hasLoop}
								<span class="layer-badge loop" title="Loop element">
									<i class="fa fa-redo" />
								</span>
							{/if}
							{#if layer.isChart}
								<span class="layer-badge chart" title="Chart">
									<i class="fa fa-chart-bar" />
								</span>
							{/if}
							{#if layer.isTable}
								<span class="layer-badge table" title="Table">
									<i class="fa fa-table" />
								</span>
							{/if}
						</div>
					</div>

					<div class="layer-controls">
						<!-- Visibility toggle -->
						<button
							class="control-btn"
							on:click={(e) => toggleVisibility(layer, e)}
							title={layer.visible ? 'Hide layer' : 'Show layer'}
						>
							<i class="fa {layer.visible ? 'fa-eye' : 'fa-eye-slash'}" />
						</button>

						<!-- Lock toggle -->
						<button
							class="control-btn {layer.locked ? 'is-locked' : 'is-unlocked'}"
							on:click={(e) => toggleLock(layer, e)}
							title={layer.locked ? 'Unlock layer' : 'Lock layer'}
						>
							<i class="fa {layer.locked ? 'fa-lock' : 'fa-unlock'}" />
						</button>

						<!-- More options -->
						<div class="dropdown">
							<button class="control-btn more-btn">
								<i class="fa fa-ellipsis-v" />
							</button>
							<div
								class="dropdown-menu border-[2px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-lg overflow-hidden"
							>
								<button on:click={(e) => duplicateLayer(layer, e)} class="hover:bg-gray-50">
									<i class="fa fa-clone mr-2 text-gray-400" />
									Duplicate
								</button>
								<button on:click={(e) => moveLayerUp(layer, e)} class="hover:bg-gray-50">
									<i class="fa fa-arrow-up mr-2 text-gray-400" />
									Bring Forward
								</button>
								<button on:click={(e) => moveLayerDown(layer, e)} class="hover:bg-gray-50">
									<i class="fa fa-arrow-down mr-2 text-gray-400" />
									Send Backward
								</button>
								<button on:click={(e) => renameLayer(layer, e)} class="hover:bg-gray-50">
									<i class="fa fa-edit mr-2 text-gray-400" />
									Rename
								</button>
								<div class="divider my-1 border-t border-gray-100" />
								<button
									class="danger text-red-500 hover:bg-red-50"
									on:click={(e) => deleteLayer(layer, e)}
								>
									<i class="fa fa-trash mr-2" />
									Delete
								</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="modal-overlay" on:click={closeDeleteModal} role="dialog" aria-modal="true">
		<div class="modal-content" on:click|stopPropagation role="document">
			<div class="modal-icon delete">
				<i class="fa fa-trash" />
			</div>
			<h4 class="modal-title">Delete Layer?</h4>
			<p class="modal-message">
				Are you sure you want to delete <span class="layer-highlight">"{layerToDelete?.name}"</span
				>? This action cannot be undone.
			</p>
			<div class="modal-actions">
				<button class="modal-btn cancel" on:click={closeDeleteModal}> Cancel </button>
				<button class="modal-btn danger" on:click={confirmDelete}>
					<i class="fa fa-trash mr-1" />
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Rename Modal -->
{#if showRenameModal}
	<div class="modal-overlay" on:click={closeRenameModal} role="dialog" aria-modal="true">
		<div class="modal-content" on:click|stopPropagation role="document">
			<div class="modal-icon rename">
				<i class="fa fa-edit" />
			</div>
			<h4 class="modal-title">Rename Layer</h4>
			<p class="modal-message">Enter a new name for this layer:</p>
			<input
				bind:this={renameInputRef}
				type="text"
				class="modal-input"
				bind:value={renameInputValue}
				on:keydown={handleRenameKeydown}
				placeholder="Layer name"
			/>
			<div class="modal-actions">
				<button class="modal-btn cancel" on:click={closeRenameModal}> Cancel </button>
				<button
					class="modal-btn primary"
					on:click={confirmRename}
					disabled={!renameInputValue.trim()}
				>
					<i class="fa fa-check mr-1" />
					Rename
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.layers-panel {
		width: 100%;
		height: 100%;
		background: #fffdf8;
		display: flex;
		flex-direction: column;
		font-size: 14px;
	}

	.panel-header {
		padding: 16px 20px;
		border-bottom: 3px solid #111827;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #fffdf8;
	}

	.layer-count {
		background: #111827;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 10px;
		font-weight: 700;
		color: #ffffff;
	}

	.layers-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		background-color: #fffdf8;
	}

	.empty-state {
		text-align: center;
		padding: 60px 20px;
		color: #9ca3af;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.empty-state .icon-container {
		width: 48px;
		height: 48px;
		background: #f3f4f6;
		border: 2px solid #111827;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 4px;
		box-shadow: 4px 4px 0 0 #111827;
	}

	.empty-state i {
		font-size: 20px;
		color: #111827;
	}

	.empty-state p {
		margin: 0;
		font-size: 14px;
		font-weight: 700;
		color: #111827;
		text-transform: uppercase;
	}

	.empty-state .hint {
		font-size: 12px;
		color: #6b7280;
	}

	.layer-item {
		position: relative;
		background: white;
		border: 2px solid #111827;
		border-radius: 6px;
		padding: 6px 10px;
		margin-bottom: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		transition: all 0.1s ease;
		user-select: none;
		box-shadow: 2px 2px 0 0 #111827;
		z-index: 0;
	}

	.layer-item:hover {
		z-index: 1;
	}

	.layer-item:not(.locked):hover {
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 0 #111827;
	}

	.layer-item.selected {
		border-color: #111827;
		background: #fffdf8;
		box-shadow: 4px 4px 0 0 #ffc480;
		transform: translate(-2px, -2px);
		position: relative;
		z-index: 1;
	}

	.layer-item.dragging {
		opacity: 0.5;
		background: #f3f4f6;
		border-style: dashed;
		box-shadow: none;
		transform: none;
	}

	.layer-item.drag-over-before::before,
	.layer-item.drag-over-after::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		height: 3px;
		background: #ff6b6b;
		z-index: 10;
		pointer-events: none;
	}

	.layer-item.drag-over-before::before {
		top: -8px;
	}

	.layer-item.drag-over-after::after {
		bottom: -8px;
	}

	.layer-item.hidden-layer {
		opacity: 0.6;
		background: #f9fafb;
		border-style: dashed;
		box-shadow: none;
	}

	.layer-item.hidden-layer .layer-name {
		text-decoration: line-through;
		color: #9ca3af;
	}

	.layer-item.locked {
		background: #f3f4f6;
		border-color: #d1d5db;
		box-shadow: none;
	}

	.layer-content {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.expand-btn {
		background: none;
		border: 2px solid transparent;
		padding: 4px;
		cursor: pointer;
		color: #111827;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: -4px;
		transition: all 0.1s;
	}

	.expand-btn:hover {
		color: #000;
		background-color: #fff;
		border: 2px solid #111827;
		border-radius: 4px;
		box-shadow: 2px 2px 0 0 #000;
	}

	.expand-btn i {
		font-size: 10px;
	}

	.expand-spacer {
		width: 20px;
		margin-right: -4px;
	}

	.drag-handle {
		color: #9ca3af;
		cursor: grab;
		padding: 4px;
		margin-left: -4px;
		transition: color 0.2s;
		font-size: 12px;
	}

	.layer-item:hover .drag-handle {
		color: #111827;
	}

	.layer-icon {
		font-size: 12px;
		width: 20px;
		text-align: center;
		color: #6b7280;
		flex-shrink: 0;
	}

	.layer-icon i {
		display: block;
	}

	.layer-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 12px;
		font-weight: 700;
		color: #111827;
		min-width: 0;
		max-width: 100%;
		font-family: monospace;
	}

	.layer-badges {
		display: flex;
		gap: 4px;
		flex-shrink: 0;
	}

	.layer-badge {
		width: 18px;
		height: 18px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 9px;
		border: 2px solid #111827;
		font-weight: bold;
	}

	.layer-badge.variable {
		background: #dbeafe;
		color: #1e40af;
	}

	.layer-badge.condition {
		background: #fef3c7;
		color: #92400e;
	}

	.layer-badge.loop {
		background: #dcfce7;
		color: #166534;
	}

	.layer-badge.chart {
		background: #fce7f3;
		color: #be185d;
	}

	.layer-badge.table {
		background: #ccfbf1;
		color: #0f766e;
	}

	.layer-controls {
		display: flex;
		gap: 4px;
		opacity: 0;
		transition: opacity 0.2s;
		flex-shrink: 0;
		margin-left: 8px;
	}

	.layer-item:hover .layer-controls,
	.layer-item.selected .layer-controls {
		opacity: 1;
	}

	.layer-item .control-btn.is-unlocked {
		opacity: 0;
	}

	.layer-item:hover .control-btn.is-unlocked,
	.layer-item.selected .control-btn.is-unlocked {
		opacity: 1;
	}

	.control-btn {
		width: 24px;
		height: 24px;
		padding: 0;
		background: white;
		border: 2px solid #111827;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.1s;
		box-shadow: 2px 2px 0 0 #111827;
	}

	.control-btn:hover {
		background-color: #fff;
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 0 #111827;
	}

	.control-btn:active {
		transform: translate(1px, 1px);
		box-shadow: none;
	}

	.control-btn i {
		font-size: 10px;
		color: #6b7280;
		transition: color 0.1s;
	}

	.control-btn:hover i {
		color: #111827;
	}

	.control-btn.is-locked i {
		color: #111827;
	}

	.dropdown {
		position: relative;
		z-index: 1;
	}

	.dropdown:hover {
		z-index: 100;
	}

	.dropdown:hover .dropdown-menu {
		display: block;
	}

	.dropdown-menu {
		display: none;
		position: absolute;
		right: 0;
		top: 100%;
		background: white;
		border: 2px solid #111827;
		border-radius: 6px;
		box-shadow: 4px 4px 0 0 #111827;
		padding: 4px;
		min-width: 160px;
		z-index: 1000;
		margin-top: 4px;
	}

	.dropdown-menu button {
		width: 100%;
		padding: 8px 12px;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		border-radius: 4px;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		font-weight: 600;
		color: #111827;
		transition: background 0.15s;
	}

	.dropdown-menu button:hover {
		background: #f3f4f6;
	}

	.dropdown-menu button.danger {
		color: #ef4444;
	}

	.dropdown-menu button.danger:hover {
		background: #fee;
	}

	.divider {
		height: 2px;
		background: #111827;
		margin: 4px 0;
	}

	/* Scrollbar styling */
	.layers-list::-webkit-scrollbar {
		width: 6px;
	}

	.layers-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.layers-list::-webkit-scrollbar-thumb {
		background: #111827;
		border-radius: 3px;
	}

	.layers-list::-webkit-scrollbar-thumb:hover {
		background: #000;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 16px;
	}

	.modal-content {
		background: white;
		border: 3px solid #111827;
		border-radius: 12px;
		box-shadow: 8px 8px 0 0 #111827;
		padding: 24px;
		max-width: 380px;
		width: 100%;
		text-align: center;
		animation: modalSlideIn 0.15s ease-out;
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: translateY(-10px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.modal-icon {
		width: 48px;
		height: 48px;
		margin: 0 auto 16px;
		border: 2px solid #111827;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 3px 3px 0 0 #111827;
	}

	.modal-icon.delete {
		background: #fee2e2;
		color: #dc2626;
	}

	.modal-icon.rename {
		background: #dbeafe;
		color: #2563eb;
	}

	.modal-icon i {
		font-size: 18px;
	}

	.modal-title {
		margin: 0 0 8px;
		font-size: 18px;
		font-weight: 900;
		color: #111827;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.modal-message {
		margin: 0 0 20px;
		font-size: 14px;
		color: #6b7280;
		line-height: 1.5;
	}

	.layer-highlight {
		font-family: monospace;
		font-weight: 700;
		color: #111827;
		background: #f3f4f6;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.modal-input {
		width: 100%;
		padding: 12px 16px;
		font-size: 14px;
		font-weight: 600;
		font-family: monospace;
		border: 2px solid #111827;
		border-radius: 8px;
		margin-bottom: 20px;
		outline: none;
		transition: all 0.1s;
		box-shadow: 2px 2px 0 0 #111827;
	}

	.modal-input:focus {
		box-shadow: 4px 4px 0 0 #ffc480;
	}

	.modal-input::placeholder {
		color: #9ca3af;
		font-weight: 500;
	}

	.modal-actions {
		display: flex;
		gap: 12px;
	}

	.modal-btn {
		flex: 1;
		padding: 12px 16px;
		font-size: 12px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: 2px solid #111827;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.1s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.modal-btn.cancel {
		background: white;
		color: #111827;
		box-shadow: 2px 2px 0 0 #111827;
	}

	.modal-btn.cancel:hover {
		background: #f3f4f6;
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 0 #111827;
	}

	.modal-btn.danger {
		background: #dc2626;
		color: white;
		box-shadow: 2px 2px 0 0 #111827;
	}

	.modal-btn.danger:hover {
		background: #b91c1c;
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 0 #111827;
	}

	.modal-btn.primary {
		background: #111827;
		color: white;
		box-shadow: 2px 2px 0 0 #111827;
	}

	.modal-btn.primary:hover {
		background: #000;
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 0 #ffc480;
	}

	.modal-btn.primary:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		box-shadow: none;
		transform: none;
	}

	.modal-btn:active:not(:disabled) {
		transform: translate(1px, 1px);
		box-shadow: none;
	}

	.mr-1 {
		margin-right: 4px;
	}
</style>
