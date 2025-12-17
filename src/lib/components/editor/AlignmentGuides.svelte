<script>
	import { editor } from '../../../store/editor.store';
	import { onMount, onDestroy } from 'svelte';
	import { Line } from 'fabric';
	
	let canvas;
	let guidelines = [];
	let snapDistance = 5;
	let snapToGrid = false;
	let gridSize = 10;

	
	// Performance optimization
	let lastMoveTime = 0;
	const THROTTLE_MS = 16; // ~60fps
	const MAX_OBJECTS_TO_COMPARE = 10; // Limit comparisons for performance
	let rafId = null;
	
	// Alignment options
	const alignments = [
		{ id: 'left', icon: 'fa-solid fa-align-left', label: 'Align Left', action: alignLeft },
		{ id: 'center-h', icon: 'fa-solid fa-align-center', label: 'Align Center', action: alignCenterH },
		{ id: 'right', icon: 'fa-solid fa-align-right', label: 'Align Right', action: alignRight },
		{ id: 'top', icon: 'fa-solid fa-arrow-up', label: 'Align Top', action: alignTop },
		{ id: 'center-v', icon: 'fa-solid fa-arrows-up-down', label: 'Align Middle', action: alignCenterV },
		{ id: 'bottom', icon: 'fa-solid fa-arrow-down', label: 'Align Bottom', action: alignBottom },
	];
	
	function setupAlignmentGuides() {
		if (!$editor) return;
		canvas = $editor;
		
		// Add snapping on object move
		canvas.on('object:moving', handleObjectMoving);
		canvas.on('object:scaling', handleObjectScaling);
		canvas.on('object:rotating', handleObjectRotating);
		canvas.on('mouse:up', clearGuidelines);
	}
	
	function handleObjectMoving(e) {
		// Throttle for performance
		const now = Date.now();
		if (now - lastMoveTime < THROTTLE_MS) {
			return;
		}
		lastMoveTime = now;
		
		const obj = e.target;
		if (!obj) return;
		
		// Get all visible objects except the moving one
		const allObjects = canvas.getObjects().filter(o => o !== obj && o.visible && !o.guideline && !o.grid);
		
		// Performance: limit number of objects to compare
		// Prioritize nearby objects for snapping
		const canvasObjects = allObjects.length > MAX_OBJECTS_TO_COMPARE
			? getNearestObjects(obj, allObjects, MAX_OBJECTS_TO_COMPARE)
			: allObjects;
		
		guidelines = [];
		
		const objLeft = obj.left;
		const objTop = obj.top;
		const objWidth = obj.width * obj.scaleX;
		const objHeight = obj.height * obj.scaleY;
		const objRight = objLeft + objWidth;
		const objBottom = objTop + objHeight;
		const objCenterX = objLeft + objWidth / 2;
		const objCenterY = objTop + objHeight / 2;
		
		// Canvas center lines
		const canvasCenterX = canvas.width / 2;
		const canvasCenterY = canvas.height / 2;
		
		// Check canvas center alignment
		if (Math.abs(objCenterX - canvasCenterX) < snapDistance) {
			obj.left = canvasCenterX - objWidth / 2;
			guidelines.push({ type: 'vertical', position: canvasCenterX });
		}
		
		if (Math.abs(objCenterY - canvasCenterY) < snapDistance) {
			obj.top = canvasCenterY - objHeight / 2;
			guidelines.push({ type: 'horizontal', position: canvasCenterY });
		}
		
		// Check alignment with other objects (limited set for performance)
		for (const target of canvasObjects) {
			const targetLeft = target.left;
			const targetTop = target.top;
			const targetWidth = target.width * target.scaleX;
			const targetHeight = target.height * target.scaleY;
			const targetRight = targetLeft + targetWidth;
			const targetBottom = targetTop + targetHeight;
			const targetCenterX = targetLeft + targetWidth / 2;
			const targetCenterY = targetTop + targetHeight / 2;
			
			// Left edge
			if (Math.abs(objLeft - targetLeft) < snapDistance) {
				obj.left = targetLeft;
				guidelines.push({ type: 'vertical', position: targetLeft });
				continue; // Skip other checks for this object
			}
			
			// Right edge
			if (Math.abs(objRight - targetRight) < snapDistance) {
				obj.left = targetRight - objWidth;
				guidelines.push({ type: 'vertical', position: targetRight });
				continue;
			}
			
			// Center horizontal
			if (Math.abs(objCenterX - targetCenterX) < snapDistance) {
				obj.left = targetCenterX - objWidth / 2;
				guidelines.push({ type: 'vertical', position: targetCenterX });
				continue;
			}
			
			// Top edge
			if (Math.abs(objTop - targetTop) < snapDistance) {
				obj.top = targetTop;
				guidelines.push({ type: 'horizontal', position: targetTop });
				continue;
			}
			
			// Bottom edge
			if (Math.abs(objBottom - targetBottom) < snapDistance) {
				obj.top = targetBottom - objHeight;
				guidelines.push({ type: 'horizontal', position: targetBottom });
				continue;
			}
			
			// Center vertical
			if (Math.abs(objCenterY - targetCenterY) < snapDistance) {
				obj.top = targetCenterY - objHeight / 2;
				guidelines.push({ type: 'horizontal', position: targetCenterY });
			}
		}
		
		// Grid snapping
		if (snapToGrid) {
			obj.left = Math.round(obj.left / gridSize) * gridSize;
			obj.top = Math.round(obj.top / gridSize) * gridSize;
		}
		
		// Use RAF for smoother rendering
		if (rafId) {
			cancelAnimationFrame(rafId);
		}
		rafId = requestAnimationFrame(() => drawGuidelines());
	}
	
	/**
	 * Get nearest objects to the moving object for performance
	 */
	function getNearestObjects(movingObj, objects, limit) {
		// Calculate distances and sort
		const objCenterX = movingObj.left + (movingObj.width * movingObj.scaleX) / 2;
		 const objCenterY = movingObj.top + (movingObj.height * movingObj.scaleY) / 2;
		
		const withDistances = objects.map(obj => {
			const centerX = obj.left + (obj.width * obj.scaleX) / 2;
			const centerY = obj.top + (obj.height * obj.scaleY) / 2;
			const distance = Math.sqrt(
				Math.pow(centerX - objCenterX, 2) + Math.pow(centerY - objCenterY, 2)
			);
			return { obj, distance };
		});
		
		withDistances.sort((a, b) => a.distance - b.distance);
		return withDistances.slice(0, limit).map(item => item.obj);
	}
	
	function handleObjectScaling(e) {
		if (snapToGrid) {
			const obj = e.target;
			const width = obj.width * obj.scaleX;
			const height = obj.height * obj.scaleY;
			
			obj.scaleX = Math.round(width / gridSize) * gridSize / obj.width;
			obj.scaleY = Math.round(height / gridSize) * gridSize / obj.height;
		}
	}
	
	function handleObjectRotating(e) {
		if (snapToGrid) {
			const obj = e.target;
			obj.angle = Math.round(obj.angle / 15) * 15; // Snap to 15-degree increments
		}
	}
	
	function drawGuidelines() {
		if (!canvas) return;
		
		// Remove old guidelines efficiently
		const objects = canvas.getObjects();
		const toRemove = [];
		for (let i = objects.length - 1; i >= 0; i--) {
			if (objects[i].guideline) {
				toRemove.push(objects[i]);
			}
		}
		toRemove.forEach(obj => canvas.remove(obj));
		
		// Limit number of guidelines for performance
		const maxGuidelines = 4; // Max 4 guidelines at once
		const limitedGuidelines = guidelines.slice(0, maxGuidelines);
		
		limitedGuidelines.forEach(guide => {
			const line = new Line(
				guide.type === 'vertical' 
					? [guide.position, 0, guide.position, canvas.height]
					: [0, guide.position, canvas.width, guide.position],
				{
					stroke: '#ff0000',
					strokeWidth: 1,
					strokeDashArray: [5, 5],
					selectable: false,
					evented: false,
					guideline: true,
					excludeFromExport: true
				}
			);
			canvas.add(line);
			canvas.bringObjectToFront(line);
		});
		
		// Use requestRenderAll instead of renderAll for better performance
		canvas.requestRenderAll();
	}
	
	function clearGuidelines() {
		if (!canvas) return;
		
		// Cancel any pending RAF
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		
		guidelines = [];
		const objects = canvas.getObjects();
		const toRemove = [];
		for (let i = objects.length - 1; i >= 0; i--) {
			if (objects[i].guideline) {
				toRemove.push(objects[i]);
			}
		}
		toRemove.forEach(obj => canvas.remove(obj));
		canvas.requestRenderAll();
	}
	
	function getCanvasDimension(axis) {
		if (!canvas) return 0;
		const getter = axis === 'width' ? 'getWidth' : 'getHeight';
		return typeof canvas[getter] === 'function' ? canvas[getter]() : canvas[axis] || 0;
	}
	
	function getScaledDimension(obj, axis) {
		const getter = axis === 'width' ? 'getScaledWidth' : 'getScaledHeight';
		if (typeof obj[getter] === 'function') {
			return obj[getter]();
		}
		const base = axis === 'width' ? obj.width : obj.height;
		const scale = axis === 'width' ? obj.scaleX : obj.scaleY;
		return (base || 0) * (scale || 1);
	}
	
	function getOriginFactor(origin) {
		switch (origin) {
			case 'center':
				return 0.5;
			case 'right':
			case 'bottom':
				return 1;
			default:
				return 0;
		}
	}
	
	function getBoundingPosition(obj, axis) {
		const dimension = getScaledDimension(obj, axis === 'x' ? 'width' : 'height');
		const key = axis === 'x' ? 'left' : 'top';
		const originKey = axis === 'x' ? 'originX' : 'originY';
		const originDefault = axis === 'x' ? 'left' : 'top';
		const originFactor = getOriginFactor(obj[originKey] || originDefault);
		return obj[key] - dimension * originFactor;
	}
	
	function setBoundingPosition(obj, axis, target) {
		const dimension = getScaledDimension(obj, axis === 'x' ? 'width' : 'height');
		const key = axis === 'x' ? 'left' : 'top';
		const originKey = axis === 'x' ? 'originX' : 'originY';
		const originDefault = axis === 'x' ? 'left' : 'top';
		const originFactor = getOriginFactor(obj[originKey] || originDefault);
		obj.set({ [key]: target + dimension * originFactor });
	}
	
	function setBoundingCenter(obj, axis, center) {
		const dimension = getScaledDimension(obj, axis === 'x' ? 'width' : 'height');
		setBoundingPosition(obj, axis, center - dimension / 2);
	}
	
	// Alignment functions
	function alignLeft() {
		if (!canvas) return;
		const activeObjects = canvas.getActiveObjects();
		if (activeObjects.length === 0) return;
		
		activeObjects.forEach(obj => {
			setBoundingPosition(obj, 'x', 0);
			obj.setCoords();
		});
		canvas.renderAll();
	}
	
	function alignRight() {
		if (!canvas) return;
		const canvasWidth = getCanvasDimension('width');
		const activeObjects = canvas.getActiveObjects();
		if (activeObjects.length === 0) return;
		
		activeObjects.forEach(obj => {
			const objWidth = getScaledDimension(obj, 'width');
			const targetLeft = Math.max(0, canvasWidth - objWidth);
			setBoundingPosition(obj, 'x', targetLeft);
			obj.setCoords();
		});
		canvas.renderAll();
	}
	
	function alignTop() {
		if (!canvas) return;
		const activeObjects = canvas.getActiveObjects();
		if (activeObjects.length === 0) return;
		
		activeObjects.forEach(obj => {
			setBoundingPosition(obj, 'y', 0);
			obj.setCoords();
		});
		canvas.renderAll();
	}
	
	function alignBottom() {
		if (!canvas) return;
		const canvasHeight = getCanvasDimension('height');
		const activeObjects = canvas.getActiveObjects();
		if (activeObjects.length === 0) return;
		
		activeObjects.forEach(obj => {
			const objHeight = getScaledDimension(obj, 'height');
			const targetTop = Math.max(0, canvasHeight - objHeight);
			setBoundingPosition(obj, 'y', targetTop);
			obj.setCoords();
		});
		canvas.renderAll();
	}
	
	function alignCenterH() {
		if (!canvas) return;
		const canvasWidth = getCanvasDimension('width');
		const activeObjects = canvas.getActiveObjects();
		if (activeObjects.length === 0) return;
		
		const centerX = canvasWidth / 2;
		activeObjects.forEach(obj => {
			setBoundingCenter(obj, 'x', centerX);
			obj.setCoords();
		});
		canvas.renderAll();
	}
	
	function alignCenterV() {
		if (!canvas) return;
		const canvasHeight = getCanvasDimension('height');
		const activeObjects = canvas.getActiveObjects();
		if (activeObjects.length === 0) return;
		
		const centerY = canvasHeight / 2;
		activeObjects.forEach(obj => {
			setBoundingCenter(obj, 'y', centerY);
			obj.setCoords();
		});
		canvas.renderAll();
	}
	

	
	onMount(() => {
		editor.subscribe(e => {
			if (e) {
				setupAlignmentGuides();
			}
		});
	});
	
	onDestroy(() => {
		if (canvas) {
			canvas.off('object:moving', handleObjectMoving);
			canvas.off('object:scaling', handleObjectScaling);
			canvas.off('object:rotating', handleObjectRotating);
			canvas.off('mouse:up', clearGuidelines);
		}
	});
</script>

<div class="alignment-toolbar">
	<div class="toolbar-section">
		<span class="section-label">ALIGN</span>
		<div class="button-group">
			{#each alignments as align}
				<button 
					class="toolbar-btn"
					on:click={align.action}
					title={align.label}
				>
					<i class={align.icon}></i>
				</button>
			{/each}
		</div>
	</div>
	
	<div class="toolbar-divider"></div>
	
	<div class="toolbar-section">
		<label class="checkbox-label">
			<input 
				type="checkbox" 
				bind:checked={snapToGrid}
			/>
			<span>GRID SNAP</span>
		</label>
		
		{#if snapToGrid}
			<div class="grid-size-control">
				<label for="grid-size">SIZE:</label>
				<input 
					id="grid-size"
					type="number" 
					bind:value={gridSize}
					min="5"
					max="50"
					step="5"
				/>
			</div>
		{/if}
	</div>
</div>

<style>
	.alignment-toolbar {
		position: absolute;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		background: #FFFDF8;
		border: 3px solid #111827;
		border-radius: 8px;
		padding: 10px 16px;
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: 16px;
		box-shadow: 6px 6px 0 0 #111827;
		z-index: 50;
		font-size: 13px;
		max-width: 95vw;
		width: auto;
		min-width: min-content;
	}
	
	.toolbar-section {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: nowrap;
		flex-shrink: 0;
	}
	
	.section-label {
		font-size: 10px;
		color: #111827;
		font-weight: 900;
		white-space: nowrap;
		flex-shrink: 0;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	
	.button-group {
		display: flex;
		gap: 6px;
		flex-wrap: nowrap;
		flex-shrink: 0;
	}
	
	.toolbar-btn {
		width: 32px;
		height: 32px;
		border: 2px solid #111827;
		background: white;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		color: #111827;
		transition: all 0.1s ease;
		flex-shrink: 0;
		box-shadow: 2px 2px 0 0 #111827;
	}
	
	.toolbar-btn:hover {
		background: #ffc480;
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 0 #111827;
	}
	
	.toolbar-btn:active {
		background: #ffc480;
		transform: translate(1px, 1px);
		box-shadow: none;
	}
	
	.toolbar-divider {
		width: 3px;
		height: 28px;
		background: #111827;
		flex-shrink: 0;
		border-radius: 2px;
	}
	
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		user-select: none;
		white-space: nowrap;
		flex-shrink: 0;
		padding: 6px 10px;
		background: white;
		border: 2px solid #111827;
		border-radius: 4px;
		box-shadow: 2px 2px 0 0 #111827;
		transition: all 0.1s ease;
	}
	
	.checkbox-label:hover {
		background: #f3f4f6;
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 0 #111827;
	}
	
	.checkbox-label:has(input:checked) {
		background: #ffc480;
	}
	
	.checkbox-label input[type="checkbox"] {
		width: 16px;
		height: 16px;
		cursor: pointer;
		flex-shrink: 0;
		accent-color: #111827;
		border: 2px solid #111827;
	}
	
	.checkbox-label span {
		font-size: 10px;
		font-weight: 900;
		color: #111827;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
	
	.grid-size-control {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: 8px;
		padding-left: 12px;
		border-left: 3px solid #111827;
		flex-shrink: 0;
	}
	
	.grid-size-control label {
		font-size: 10px;
		font-weight: 900;
		color: #111827;
		white-space: nowrap;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
	
	.grid-size-control input {
		width: 56px;
		padding: 6px 8px;
		border: 2px solid #111827;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 700;
		font-family: monospace;
		background: white;
		box-shadow: 2px 2px 0 0 #111827;
		transition: all 0.1s ease;
		outline: none;
	}
	
	.grid-size-control input:focus {
		box-shadow: 4px 4px 0 0 #ffc480;
		transform: translate(-1px, -1px);
	}
	
	.grid-size-control input::-webkit-inner-spin-button,
	.grid-size-control input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	
	.grid-size-control input[type=number] {
		-moz-appearance: textfield;
		appearance: textfield;
	}
	
	/* Mobile responsiveness */
	@media (max-width: 1024px) {
		.alignment-toolbar {
			top: 12px;
			padding: 8px 12px;
			gap: 10px;
			font-size: 12px;
			flex-wrap: wrap;
			box-shadow: 4px 4px 0 0 #111827;
		}
		
		.toolbar-section {
			gap: 8px;
		}
		
		.button-group {
			gap: 4px;
		}
		
		.toolbar-btn {
			width: 30px;
			height: 30px;
		}
	}
	
	@media (max-width: 768px) {
		.alignment-toolbar {
			padding: 6px 10px;
			gap: 8px;
			border-width: 2px;
			box-shadow: 3px 3px 0 0 #111827;
		}
		
		.toolbar-btn {
			width: 28px;
			height: 28px;
			font-size: 12px;
			box-shadow: 1px 1px 0 0 #111827;
		}
		
		.section-label {
			display: none;
		}
		
		.checkbox-label {
			padding: 4px 8px;
			box-shadow: 1px 1px 0 0 #111827;
		}
		
		.checkbox-label span {
			font-size: 9px;
		}
		
		.toolbar-divider {
			width: 2px;
			height: 20px;
		}
		
		.grid-size-control {
			margin-left: 4px;
			padding-left: 8px;
			border-left-width: 2px;
		}
		
		.grid-size-control input {
			width: 48px;
			padding: 4px 6px;
			font-size: 11px;
			box-shadow: 1px 1px 0 0 #111827;
		}
	}
</style>

