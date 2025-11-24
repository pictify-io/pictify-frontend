<script>
	import { editor } from '../../../store/editor.store';
	import { Rect, Circle, Triangle, Path, Polygon, PencilBrush } from 'fabric';
	import StockPhotosPanel from './StockPhotosPanel.svelte';
	
	let activeTab = 'shapes'; // shapes, icons, photos
	let searchQuery = '';
	let drawingMode = 'normal'; // normal, polygon, draw
	let polygonPoints = [];
	let tempPolygonLines = [];
	
	// Basic shapes
	const shapes = [
		{ name: 'Rectangle', icon: '▭', type: 'rect' },
		{ name: 'Circle', icon: '●', type: 'circle' },
		{ name: 'Triangle', icon: '▲', type: 'triangle' },
		{ name: 'Line', icon: '—', type: 'line' },
		{ name: 'Arrow', icon: '→', type: 'arrow' },
		{ name: 'Star', icon: '★', type: 'star' },
		{ name: 'Polygon', icon: '⬡', type: 'polygon' },
		{ name: 'Rounded Rect', icon: '▢', type: 'rounded-rect' },
		{ name: 'Polygon Tool', icon: '⬟', type: 'polygon-draw' },
		{ name: 'Draw', icon: '✎', type: 'draw' }
	];
	
	// Icon library with SVG paths
	const icons = [
		{ name: 'Heart', category: 'social', path: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
		{ name: 'Star', category: 'social', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
		{ name: 'Check', category: 'ui', path: 'M20 6L9 17l-5-5' },
		{ name: 'X', category: 'ui', path: 'M18 6L6 18M6 6l12 12' },
		{ name: 'Plus', category: 'ui', path: 'M12 5v14M5 12h14' },
		{ name: 'Minus', category: 'ui', path: 'M5 12h14' },
		{ name: 'Alert Circle', category: 'ui', path: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20zM12 8v4M12 16h.01' },
		{ name: 'Info', category: 'ui', path: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20zM12 16v-4M12 8h.01' },
		{ name: 'User', category: 'people', path: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
		{ name: 'Users', category: 'people', path: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
		{ name: 'Mail', category: 'communication', path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6' },
		{ name: 'Phone', category: 'communication', path: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' },
		{ name: 'Calendar', category: 'productivity', path: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM5 20V9h14v11H5z' },
		{ name: 'Clock', category: 'productivity', path: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20zM12 6v6l4 2' },
		{ name: 'Download', category: 'files', path: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3' },
		{ name: 'Upload', category: 'files', path: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12' },
		{ name: 'File', category: 'files', path: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7zM13 3v6h6' },
		{ name: 'Folder', category: 'files', path: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z' },
		{ name: 'Image', category: 'media', path: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z' },
		{ name: 'Video', category: 'media', path: 'M23 7l-7 5 7 5V7zM16 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z' },
		{ name: 'Music', category: 'media', path: 'M9 18V5l12-2v13M9 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM21 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
		{ name: 'Shopping Cart', category: 'commerce', path: 'M9 2L1 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-8-4-1 1z' },
		{ name: 'Gift', category: 'commerce', path: 'M20 12v10H4V12M2 7h20v5H2V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z' },
		{ name: 'Tag', category: 'commerce', path: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01' },
		{ name: 'Home', category: 'navigation', path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z' },
		{ name: 'Search', category: 'navigation', path: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35' },
		{ name: 'Settings', category: 'navigation', path: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
		{ name: 'Lightning', category: 'weather', path: 'M13 2L3 14h8l-1 8 10-12h-8l1-8z' },
		{ name: 'Sun', category: 'weather', path: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z' },
		{ name: 'Moon', category: 'weather', path: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' },
		{ name: 'Trophy', category: 'achievement', path: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M18 4H6v7a6 6 0 1 0 12 0V4zM12 18v5M8 23h8' },
		{ name: 'Award', category: 'achievement', path: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12' }
	];
	
	function activateTool(toolType) {
		const canvas = $editor;
		if (!canvas) return;
		
		if (toolType === 'polygon-draw') {
			drawingMode = 'polygon';
			polygonPoints = [];
			clearTempPolygon();
			canvas.isDrawingMode = false;
			canvas.selection = false;
			
			// Add canvas click handler for polygon
			canvas.on('mouse:down', handlePolygonClick);
			canvas.on('mouse:dblclick', finishPolygon);
		} else if (toolType === 'draw') {
			drawingMode = 'draw';
			canvas.isDrawingMode = true;
			canvas.freeDrawingBrush = new PencilBrush(canvas);
			canvas.freeDrawingBrush.width = 3;
			canvas.freeDrawingBrush.color = '#333333';
		} else {
			// Normal shape - reset drawing mode
			resetDrawingMode();
			addShape(toolType);
		}
	}
	
	function resetDrawingMode() {
		const canvas = $editor;
		if (!canvas) return;
		
		drawingMode = 'normal';
		canvas.isDrawingMode = false;
		canvas.selection = true;
		clearTempPolygon();
		polygonPoints = [];
		
		// Remove polygon event listeners
		canvas.off('mouse:down', handlePolygonClick);
		canvas.off('mouse:dblclick', finishPolygon);
	}
	
	function handlePolygonClick(event) {
		if (drawingMode !== 'polygon') return;
		
		const pointer = $editor.getPointer(event.e);
		polygonPoints.push({ x: pointer.x, y: pointer.y });
		
		// Draw temporary lines to show polygon being constructed
		updateTempPolygon();
	}
	
	function updateTempPolygon() {
		if (!$editor || polygonPoints.length === 0) return;
		
		clearTempPolygon();
		
		// Draw lines between points
		for (let i = 0; i < polygonPoints.length - 1; i++) {
			const line = new Path(`M ${polygonPoints[i].x} ${polygonPoints[i].y} L ${polygonPoints[i + 1].x} ${polygonPoints[i + 1].y}`, {
				stroke: '#3b82f6',
				strokeWidth: 2,
				fill: '',
				selectable: false,
				evented: false,
				strokeDashArray: [5, 5]
			});
			tempPolygonLines.push(line);
			$editor.add(line);
		}
		
		// Draw circles at each point
		polygonPoints.forEach(point => {
			const circle = new Circle({
				left: point.x,
				top: point.y,
				radius: 4,
				fill: '#3b82f6',
				originX: 'center',
				originY: 'center',
				selectable: false,
				evented: false
			});
			tempPolygonLines.push(circle);
			$editor.add(circle);
		});
		
		$editor.renderAll();
	}
	
	function clearTempPolygon() {
		if (!$editor) return;
		
		tempPolygonLines.forEach(obj => {
			$editor.remove(obj);
		});
		tempPolygonLines = [];
		$editor.renderAll();
	}
	
	function finishPolygon() {
		if (drawingMode !== 'polygon' || polygonPoints.length < 3) return;
		
		// Create the final polygon
		const polygon = new Polygon(polygonPoints, {
			fill: '#8b5cf6',
			stroke: '#7c3aed',
			strokeWidth: 2,
			objectCaching: false
		});
		
		polygon.name = 'Polygon';
		$editor.add(polygon);
		$editor.setActiveObject(polygon);
		
		// Reset
		clearTempPolygon();
		resetDrawingMode();
		$editor.renderAll();
	}
	
	function addShape(shapeType) {
		if (!$editor) return;
		
		const center = $editor.getCenter();
		let shape;
		
		switch(shapeType) {
			case 'rect':
				shape = new Rect({
					left: center.left,
					top: center.top,
					width: 150,
					height: 100,
					fill: '#3b82f6',
					stroke: '#2563eb',
					strokeWidth: 0,
					originX: 'center',
					originY: 'center'
				});
				break;
				
			case 'circle':
				shape = new Circle({
					left: center.left,
					top: center.top,
					radius: 50,
					fill: '#10b981',
					stroke: '#059669',
					strokeWidth: 0,
					originX: 'center',
					originY: 'center'
				});
				break;
				
			case 'triangle':
				shape = new Triangle({
					left: center.left,
					top: center.top,
					width: 100,
					height: 100,
					fill: '#ef4444',
					stroke: '#dc2626',
					strokeWidth: 0,
					originX: 'center',
					originY: 'center'
				});
				break;
				
			case 'line':
				shape = new Path('M 0 0 L 200 0', {
					left: center.left,
					top: center.top,
					stroke: '#333',
					strokeWidth: 2,
					fill: '',
					originX: 'center',
					originY: 'center'
				});
				break;
				
			case 'arrow':
				shape = new Path('M 0 0 L 180 0 L 170 -10 M 180 0 L 170 10', {
					left: center.left,
					top: center.top,
					stroke: '#333',
					strokeWidth: 2,
					fill: '',
					originX: 'center',
					originY: 'center'
				});
				break;
				
			case 'star':
				const starPoints = createStarPoints(5, 50, 25);
				shape = new Path(starPoints, {
					left: center.left,
					top: center.top,
					fill: '#fbbf24',
					stroke: '#f59e0b',
					strokeWidth: 0,
					originX: 'center',
					originY: 'center'
				});
				break;
				
			case 'polygon':
				const hexPoints = createPolygonPoints(6, 50);
				shape = new Path(hexPoints, {
					left: center.left,
					top: center.top,
					fill: '#8b5cf6',
					stroke: '#7c3aed',
					strokeWidth: 0,
					originX: 'center',
					originY: 'center'
				});
				break;
				
			case 'rounded-rect':
				shape = new Rect({
					left: center.left,
					top: center.top,
					width: 150,
					height: 100,
					fill: '#06b6d4',
					stroke: '#0891b2',
					strokeWidth: 0,
					rx: 15,
					ry: 15,
					originX: 'center',
					originY: 'center'
				});
				break;
		}
		
		if (shape) {
			shape.name = shapeType.charAt(0).toUpperCase() + shapeType.slice(1);
			$editor.add(shape);
			$editor.setActiveObject(shape);
			$editor.renderAll();
		}
	}
	
	function addIcon(icon) {
		if (!$editor) return;
		
		const center = $editor.getCenter();
		
		// Create path from SVG
		const path = new Path(icon.path, {
			left: center.left,
			top: center.top,
			fill: '',
			stroke: '#333',
			strokeWidth: 1.5,
			scaleX: 3,
			scaleY: 3,
			originX: 'center',
			originY: 'center'
		});
		
		path.name = icon.name;
		$editor.add(path);
		$editor.setActiveObject(path);
		$editor.renderAll();
	}
	
	// Helper functions for creating star and polygon points
	function createStarPoints(points, outerRadius, innerRadius) {
		const step = Math.PI / points;
		let path = 'M ';
		
		for (let i = 0; i < 2 * points; i++) {
			const radius = i % 2 === 0 ? outerRadius : innerRadius;
			const angle = i * step - Math.PI / 2;
			const x = radius * Math.cos(angle);
			const y = radius * Math.sin(angle);
			path += `${x} ${y} `;
			if (i < 2 * points - 1) path += 'L ';
		}
		
		path += 'Z';
		return path;
	}
	
	function createPolygonPoints(sides, radius) {
		const step = (2 * Math.PI) / sides;
		let path = 'M ';
		
		for (let i = 0; i < sides; i++) {
			const angle = i * step - Math.PI / 2;
			const x = radius * Math.cos(angle);
			const y = radius * Math.sin(angle);
			path += `${x} ${y} `;
			if (i < sides - 1) path += 'L ';
		}
		
		path += 'Z';
		return path;
	}
	
	$: filteredIcons = searchQuery 
		? icons.filter(icon => 
				icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				icon.category.toLowerCase().includes(searchQuery.toLowerCase())
			)
		: icons;
</script>

<div class="library-panel">
	<div class="tabs">
		<button 
			class:active={activeTab === 'shapes'}
			on:click={() => activeTab = 'shapes'}
		>
			Shapes
		</button>
		<button 
			class:active={activeTab === 'icons'}
			on:click={() => activeTab = 'icons'}
		>
			Icons
		</button>
		<button 
			class:active={activeTab === 'photos'}
			on:click={() => activeTab = 'photos'}
		>
			Photos
		</button>
	</div>
	
	<!-- Drawing mode indicator -->
	{#if drawingMode !== 'normal'}
		<div class="mode-indicator">
			{#if drawingMode === 'polygon'}
				<span class="indicator-text">
					<i class="fa fa-mouse-pointer"></i>
					Click to add vertices, double-click to finish
				</span>
			{:else if drawingMode === 'draw'}
				<span class="indicator-text">
					<i class="fa fa-pencil"></i>
					Drawing mode active
				</span>
			{/if}
			<button class="exit-mode" on:click={resetDrawingMode}>
				<i class="fa fa-times"></i> Exit
			</button>
		</div>
	{/if}
	
	<div class="content">
		{#if activeTab === 'shapes'}
			<div class="grid">
				{#each shapes as shape}
					<button 
						class="item"
						class:active={drawingMode === 'polygon' && shape.type === 'polygon-draw' || drawingMode === 'draw' && shape.type === 'draw'}
						on:click={() => activateTool(shape.type)}
						title={shape.name}
					>
						<span class="icon">{shape.icon}</span>
						<span class="label">{shape.name}</span>
					</button>
				{/each}
			</div>
			
		{:else if activeTab === 'icons'}
			<div class="search-box">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8"/>
					<path d="M21 21l-4.35-4.35"/>
				</svg>
				<input 
					type="search" 
					placeholder="Search icons..."
					bind:value={searchQuery}
				/>
			</div>
			
			<div class="grid icons-grid">
				{#each filteredIcons as icon}
					<button 
						class="item icon-item"
						on:click={() => addIcon(icon)}
						title={icon.name}
					>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d={icon.path}/>
						</svg>
						<span class="label">{icon.name}</span>
					</button>
				{/each}
			</div>
			
		{:else if activeTab === 'photos'}
			<StockPhotosPanel />
		{/if}
	</div>
</div>

<style>
	.library-panel {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: white;
		overflow: hidden;
	}
	
	.tabs {
		display: flex;
		border-bottom: 1px solid #e5e5e5;
		background: #fafafa;
		flex-shrink: 0;
	}
	
	.tabs button {
		flex: 1;
		padding: 12px;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 13px;
		font-weight: 500;
		color: #666;
		transition: all 0.15s;
		border-bottom: 2px solid transparent;
	}
	
	.tabs button:hover {
		color: #333;
		background: #f5f5f5;
	}
	
	.tabs button.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
		background: white;
	}
	
	.content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding-top: 12px;
		padding-bottom: 12px;
		min-height: 0;
	}
	
	.search-box {
		position: relative;
		margin-bottom: 12px;
	}
	
	.search-box svg {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: #999;
	}
	
	.search-box input {
		width: 100%;
		padding: 8px 12px 8px 36px;
		border: 1px solid #e5e5e5;
		border-radius: 6px;
		font-size: 13px;
	}
	
	.search-box input:focus {
		outline: none;
		border-color: #3b82f6;
	}
	
	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}
	
	.icons-grid {
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}
	
	.item {
		padding: 16px 8px;
		background: white;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		transition: all 0.15s;
		min-width: 0;
	}
	
	.item:hover {
		border-color: #3b82f6;
		background: #f0f9ff;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0,0,0,0.1);
	}
	
	.item .icon {
		font-size: 32px;
	}
	
	.item .label {
		font-size: 10px;
		color: #666;
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}
	
	.icon-item {
		padding: 10px 6px;
	}
	
	.icon-item svg {
		color: #333;
	}
	
	/* Scrollbar styling */
	.content::-webkit-scrollbar {
		width: 6px;
	}
	
	.content::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.content::-webkit-scrollbar-thumb {
		background: #d0d0d0;
		border-radius: 3px;
	}
	
	.content::-webkit-scrollbar-thumb:hover {
		background: #b0b0b0;
	}
	
	/* Drawing mode indicator */
	.mode-indicator {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
		padding: 12px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		font-size: 12px;
		font-weight: 500;
		border-bottom: 1px solid #2563eb;
		flex-shrink: 0;
		animation: slideDown 0.3s ease-out;
	}
	
	@keyframes slideDown {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	.indicator-text {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	
	.exit-mode {
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 6px 12px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 11px;
		font-weight: 600;
		transition: all 0.15s;
		display: flex;
		align-items: center;
		gap: 4px;
	}
	
	.exit-mode:hover {
		background: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.5);
	}
	
	/* Active tool state */
	.item.active {
		border-color: #3b82f6;
		background: #dbeafe;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}
	
	.item.active .label {
		color: #1e40af;
		font-weight: 600;
	}

</style>

