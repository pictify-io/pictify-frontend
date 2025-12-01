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
	
	// Layer types with icons
	const layerIcons = {
		'i-text': '📝',
		'text': '📝',
		'rect': '▭',
		'circle': '●',
		'image': '🖼️',
		'group': '📁',
		'path': '✏️'
	};
	
	const canvasEvents = ['object:added', 'object:removed', 'object:modified', 'selection:created', 'selection:updated', 'selection:cleared'];
	let canvasInstance = null;
	
	function shouldDisplayLayer(obj) {
		return !(obj.guideline || obj.grid || obj.excludeFromLayers === true);
	}
	
	function resolveLayerId(obj, index) {
		if (obj.id) return obj.id;
		if (!obj.layerId) {
			obj.layerId = `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${index}`;
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
		canvasEvents.forEach(eventName => instance.on(eventName, updateLayers));
		canvasInstance = instance;
	}
	
	function detachCanvasListeners() {
		if (!canvasInstance) return;
		canvasEvents.forEach(eventName => canvasInstance.off(eventName, updateLayers));
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
					parentId: parentId
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
		if (confirm(`Delete "${layer.name}"?`)) {
			if ($selectedComponent === layer.object) {
				editorActions.clearSelection();
			}
			$editor.remove(layer.object);
			$editor.renderAll();
			updateLayers();
		}
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
		const newName = prompt('Enter new layer name:', layer.name);
		if (newName) {
			layer.object.name = newName;
			updateLayers();
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
				if (dragOverLayerId && !document.querySelector(`[data-layer-id="${dragOverLayerId}"]:hover`)) {
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
		finalObjects.filter(obj => obj.grid).forEach((obj, index) => {
			if (typeof obj.moveTo === 'function') {
				obj.moveTo(0);
			} else {
				$editor.sendObjectToBack(obj);
			}
		});
		
		// Keep guidelines at the front
		finalObjects.filter(obj => obj.guideline).forEach(obj => {
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
		<h3>Layers</h3>
		<span class="layer-count">{layers.length}</span>
	</div>
	
	<div class="layers-list custom-scrollbar">
		{#if layers.length === 0}
			<div class="empty-state">
				<div class="icon-container">
					<i class="fa fa-layer-group"></i>
				</div>
				<p>No layers yet</p>
				<span class="hint">Add elements to your canvas</span>
			</div>
		{:else}
			{#each layers as layer (layer.id)}
				<div 
					class="layer-item"
					style="padding-left: {12 + layer.depth * 20}px"
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
							<button 
								class="expand-btn" 
								on:click={(e) => toggleGroupExpansion(layer, e)}
							>
								<i class="fa fa-chevron-{layer.isExpanded ? 'down' : 'right'}"></i>
							</button>
						{:else}
							<span class="expand-spacer"></span>
						{/if}

						{#if !layer.locked}
							<span class="drag-handle" title="Drag to reorder">
								<i class="fa fa-grip-vertical"></i>
							</span>
						{/if}
						<span class="layer-icon">{layerIcons[layer.type] || '📄'}</span>
						<span 
							class="layer-name" 
							on:dblclick={(e) => renameLayer(layer, e)}
							title="Double-click to rename"
							role="button"
							tabindex="-1"
						>
							{layer.name}
						</span>
					</div>
					
					<div class="layer-controls">
						<!-- Visibility toggle -->
						<button
							class="control-btn"
							on:click={(e) => toggleVisibility(layer, e)}
							title={layer.visible ? 'Hide layer' : 'Show layer'}
						>
							{#if layer.visible}
								<i class="fa fa-eye text-gray-400 hover:text-gray-600"></i>
							{:else}
								<i class="fa fa-eye-slash text-gray-400 hover:text-gray-600"></i>
							{/if}
						</button>
						
						<!-- Lock toggle -->
						<button
							class="control-btn"
							on:click={(e) => toggleLock(layer, e)}
							title={layer.locked ? 'Unlock layer' : 'Lock layer'}
						>
							{#if layer.locked}
								<i class="fa fa-lock text-gray-400 hover:text-gray-600"></i>
							{:else}
								<i class="fa fa-unlock text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"></i>
							{/if}
						</button>
						
						<!-- More options -->
						<div class="dropdown">
							<button class="control-btn more-btn">
								<i class="fa fa-ellipsis-v text-gray-400 hover:text-gray-600"></i>
							</button>
							<div class="dropdown-menu shadow-lg border border-gray-100 rounded-lg overflow-hidden">
								<button on:click={(e) => duplicateLayer(layer, e)} class="hover:bg-gray-50">
									<i class="fa fa-clone mr-2 text-gray-400"></i>
									Duplicate
								</button>
								<button on:click={(e) => moveLayerUp(layer, e)} class="hover:bg-gray-50">
									<i class="fa fa-arrow-up mr-2 text-gray-400"></i>
									Bring Forward
								</button>
								<button on:click={(e) => moveLayerDown(layer, e)} class="hover:bg-gray-50">
									<i class="fa fa-arrow-down mr-2 text-gray-400"></i>
									Send Backward
								</button>
								<button on:click={(e) => renameLayer(layer, e)} class="hover:bg-gray-50">
									<i class="fa fa-edit mr-2 text-gray-400"></i>
									Rename
								</button>
								<div class="divider my-1 border-t border-gray-100"></div>
								<button class="danger text-red-500 hover:bg-red-50" on:click={(e) => deleteLayer(layer, e)}>
									<i class="fa fa-trash mr-2"></i>
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

<style>
	.layers-panel {
		width: 100%;
		height: 100%;
		background: #ffffff;
		display: flex;
		flex-direction: column;
		font-size: 14px;
	}
	
	.panel-header {
		padding: 16px 20px;
		border-bottom: 1px solid #f3f4f6;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: white;
	}
	
	.panel-header h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 700;
		color: #111827;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.layer-count {
		background: #f3f4f6;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 600;
		color: #6b7280;
	}
	
	.layers-list {
		flex: 1;
		overflow-y: auto;
		padding: 12px;
		background-color: #f9fafb;
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
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 4px;
	}
	
	.empty-state i {
		font-size: 20px;
		color: #d1d5db;
	}
	
	.empty-state p {
		margin: 0;
		font-size: 14px;
		font-weight: 500;
		color: #6b7280;
	}
	
	.empty-state .hint {
		font-size: 12px;
		color: #9ca3af;
	}
	
	.layer-item {
		position: relative;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 8px 12px;
		margin-bottom: 8px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		transition: all 0.2s ease;
		user-select: none;
	}
	
	.layer-item:not(.locked):hover {
		border-color: #d1d5db;
		box-shadow: 0 2px 4px rgba(0,0,0,0.02);
		transform: translateY(-1px);
	}
	
	.layer-item.selected {
		border-color: #3b82f6;
		background: #eff6ff;
		box-shadow: 0 0 0 1px #3b82f6;
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
		height: 2px;
		background: #3b82f6;
		z-index: 10;
		pointer-events: none;
	}
	
	.layer-item.drag-over-before::before {
		top: -5px;
	}
	
	.layer-item.drag-over-after::after {
		bottom: -5px;
	}
	
	.layer-item.hidden-layer {
		opacity: 0.6;
		background: #f9fafb;
	}
	
	.layer-item.hidden-layer .layer-name {
		text-decoration: line-through;
		color: #9ca3af;
	}
	
	.layer-item.locked {
		background: #f9fafb;
		border-color: #e5e7eb;
	}
	
	.layer-content {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 0;
	}
	
	.expand-btn {
		background: none;
		border: none;
		padding: 4px;
		cursor: pointer;
		color: #6b7280;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: -4px;
	}
	
	.expand-btn:hover {
		color: #374151;
		background-color: #f3f4f6;
		border-radius: 4px;
	}
	
	.expand-btn i {
		font-size: 10px;
	}

	.expand-spacer {
		width: 20px;
		margin-right: -4px;
	}
	
	.drag-handle {
		color: #d1d5db;
		cursor: grab;
		padding: 4px;
		margin-left: -4px;
		transition: color 0.2s;
		font-size: 12px;
	}
	
	.layer-item:hover .drag-handle {
		color: #9ca3af;
	}
	
	.layer-icon {
		font-size: 14px;
		width: 20px;
		text-align: center;
	}
	
	.layer-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 13px;
		font-weight: 500;
		color: #374151;
	}
	
	.layer-controls {
		display: flex;
		gap: 2px;
		opacity: 0;
		transition: opacity 0.2s;
	}
	
	.layer-item:hover .layer-controls,
	.layer-item.selected .layer-controls {
		opacity: 1;
	}
	
	.control-btn {
		width: 24px;
		height: 24px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.control-btn:hover {
		background-color: #f3f4f6;
	}
	
	.control-btn i {
		font-size: 12px;
	}
	
	.dropdown {
		position: relative;
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
		border: 1px solid #e5e5e5;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
		font-size: 13px;
		color: #333;
		transition: background 0.15s;
	}
	
	.dropdown-menu button:hover {
		background: #f5f5f5;
	}
	
	.dropdown-menu button.danger {
		color: #ef4444;
	}
	
	.dropdown-menu button.danger:hover {
		background: #fee;
	}
	
	.divider {
		height: 1px;
		background: #e5e5e5;
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
		background: #d0d0d0;
		border-radius: 3px;
	}
	
	.layers-list::-webkit-scrollbar-thumb:hover {
		background: #b0b0b0;
	}
</style>

