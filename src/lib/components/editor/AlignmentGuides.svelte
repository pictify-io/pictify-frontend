<script>
	import { editor } from '../../../store/editor.store';
	import { onMount, onDestroy } from 'svelte';
	import { Line } from 'fabric';
	
	let canvas;
	let guidelines = [];
	let snapDistance = 5;
	let snapToGrid = false;
	let gridSize = 10;
	let showGrid = false;
	
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
		const obj = e.target;
		if (!obj) return;
		
		const canvasObjects = canvas.getObjects().filter(o => o !== obj && o.visible);
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
		
		// Check alignment with other objects
		canvasObjects.forEach(target => {
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
			}
			
			// Right edge
			if (Math.abs(objRight - targetRight) < snapDistance) {
				obj.left = targetRight - objWidth;
				guidelines.push({ type: 'vertical', position: targetRight });
			}
			
			// Center horizontal
			if (Math.abs(objCenterX - targetCenterX) < snapDistance) {
				obj.left = targetCenterX - objWidth / 2;
				guidelines.push({ type: 'vertical', position: targetCenterX });
			}
			
			// Top edge
			if (Math.abs(objTop - targetTop) < snapDistance) {
				obj.top = targetTop;
				guidelines.push({ type: 'horizontal', position: targetTop });
			}
			
			// Bottom edge
			if (Math.abs(objBottom - targetBottom) < snapDistance) {
				obj.top = targetBottom - objHeight;
				guidelines.push({ type: 'horizontal', position: targetBottom });
			}
			
			// Center vertical
			if (Math.abs(objCenterY - targetCenterY) < snapDistance) {
				obj.top = targetCenterY - objHeight / 2;
				guidelines.push({ type: 'horizontal', position: targetCenterY });
			}
		});
		
		// Grid snapping
		if (snapToGrid) {
			obj.left = Math.round(obj.left / gridSize) * gridSize;
			obj.top = Math.round(obj.top / gridSize) * gridSize;
		}
		
		drawGuidelines();
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
		
		// Remove old guidelines
		const oldGuidelines = canvas.getObjects().filter(obj => obj.guideline);
		oldGuidelines.forEach(obj => canvas.remove(obj));
		
		guidelines.forEach(guide => {
			const line = new Line(
				guide.type === 'vertical' 
					? [guide.position, 0, guide.position, canvas.height]
					: [0, guide.position, canvas.width, guide.position],
				{
					stroke: '#ff0000', // Brighter color for visibility
					strokeWidth: 1,
					strokeDashArray: [5, 5],
					selectable: false,
					evented: false,
					guideline: true,
					excludeFromExport: true // Don't include in JSON/Image export
				}
			);
			canvas.add(line);
			canvas.bringObjectToFront(line); // Bring to front!
		});
		
		canvas.renderAll();
	}
	
	function clearGuidelines() {
		if (!canvas) return;
		guidelines = [];
		const oldGuidelines = canvas.getObjects().filter(obj => obj.guideline);
		oldGuidelines.forEach(obj => canvas.remove(obj));
		canvas.renderAll();
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
	
	function toggleGrid() {
		showGrid = !showGrid;
		if (showGrid) {
			drawGrid();
		} else {
			clearGrid();
		}
	}
	
	function drawGrid() {
		if (!canvas) return;
		
		clearGrid();
		
		const gridOptions = {
			stroke: '#e5e5e5',
			strokeWidth: 1,
			selectable: false,
			evented: false,
			grid: true,
			excludeFromExport: true
		};
		
		// Draw vertical lines
		for (let i = 0; i < canvas.width; i += gridSize) {
			const line = new Line([i, 0, i, canvas.height], gridOptions);
			canvas.add(line);
			// Don't send completely to back if there's a background rect
			// But for now, let's keep it simple. 
			// If user has a background rect, grid might be hidden.
			// We'll try to bring forward just a bit or assume transparent bg.
			canvas.sendObjectToBack(line);
		}
		
		// Draw horizontal lines
		for (let i = 0; i < canvas.height; i += gridSize) {
			const line = new Line([0, i, canvas.width, i], gridOptions);
			canvas.add(line);
			canvas.sendObjectToBack(line);
		}
		
		// Move background image/rect to very back if exists
		const bgObj = canvas.getObjects().find(o => o.name === 'background' || o.type === 'rect' && o.width === canvas.width);
		if (bgObj) {
			canvas.sendObjectToBack(bgObj);
		}
		
		canvas.renderAll();
	}
	
	function clearGrid() {
		if (!canvas) return;
		const gridLines = canvas.getObjects().filter(obj => obj.grid);
		gridLines.forEach(obj => canvas.remove(obj));
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
		<span class="section-label">Align</span>
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
				on:change={() => snapToGrid && !showGrid && toggleGrid()}
			/>
			<span>Snap to Grid</span>
		</label>
		
		<label class="checkbox-label">
			<input 
				type="checkbox" 
				bind:checked={showGrid}
				on:change={toggleGrid}
			/>
			<span>Show Grid</span>
		</label>
		
		{#if snapToGrid || showGrid}
			<div class="grid-size-control">
				<label for="grid-size">Size:</label>
				<input 
					id="grid-size"
					type="number" 
					bind:value={gridSize}
					min="5"
					max="50"
					step="5"
					on:change={() => showGrid && drawGrid()}
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
		background: white;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		padding: 8px 12px;
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: 12px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		z-index: 50;
		font-size: 13px;
		max-width: 95vw;
		width: auto;
		min-width: min-content;
	}
	
	.toolbar-section {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: nowrap;
		flex-shrink: 0;
	}
	
	.section-label {
		font-size: 12px;
		color: #666;
		font-weight: 500;
		white-space: nowrap;
		flex-shrink: 0;
	}
	
	.button-group {
		display: flex;
		gap: 4px;
		flex-wrap: nowrap;
		flex-shrink: 0;
	}
	
	.toolbar-btn {
		width: 32px;
		height: 32px;
		border: 1px solid #e5e5e5;
		background: white;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		transition: all 0.15s;
		flex-shrink: 0;
	}
	
	.toolbar-btn:hover {
		background: #f5f5f5;
		border-color: #3b82f6;
	}
	
	.toolbar-btn:active {
		background: #e5e5e5;
	}
	
	.toolbar-divider {
		width: 1px;
		height: 24px;
		background: #e5e5e5;
		flex-shrink: 0;
	}
	
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
		user-select: none;
		white-space: nowrap;
		flex-shrink: 0;
	}
	
	.checkbox-label input[type="checkbox"] {
		width: 16px;
		height: 16px;
		cursor: pointer;
		flex-shrink: 0;
	}
	
	.checkbox-label span {
		font-size: 12px;
		color: #333;
	}
	
	.grid-size-control {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-left: 8px;
		padding-left: 8px;
		border-left: 1px solid #e5e5e5;
		flex-shrink: 0;
	}
	
	.grid-size-control label {
		font-size: 12px;
		color: #666;
		white-space: nowrap;
	}
	
	.grid-size-control input {
		width: 60px;
		padding: 4px 8px;
		border: 1px solid #e5e5e5;
		border-radius: 4px;
		font-size: 12px;
	}
	
	/* Mobile responsiveness */
	@media (max-width: 1024px) {
		.alignment-toolbar {
			top: 10px;
			padding: 6px 8px;
			gap: 6px;
			font-size: 12px;
			flex-wrap: wrap;
		}
		
		.toolbar-section {
			gap: 6px;
		}
		
		.button-group {
			gap: 3px;
		}
	}
	
	@media (max-width: 768px) {
		.alignment-toolbar {
			padding: 4px 6px;
			gap: 4px;
		}
		
		.toolbar-btn {
			width: 28px;
			height: 28px;
			font-size: 14px;
		}
		
		.section-label {
			display: none;
		}
		
		.checkbox-label span {
			font-size: 11px;
		}
		
		.toolbar-divider {
			display: none;
		}
		
		.grid-size-control {
			margin-left: 4px;
			padding-left: 4px;
		}
	}
</style>

