<script>
	import { editor } from '../../../store/editor.store';
	import { 
		createBarChart, 
		createLineChart, 
		createPieChart, 
		createHorizontalBarChart,
		chartTypes,
		DEFAULT_CHART_DATA
	} from '../../utils/fabric-chart';
	import { 
		createTable, 
		createStatsTable, 
		createComparisonTable,
		tableTypes,
		DEFAULT_TABLE_DATA,
		TABLE_STYLES
	} from '../../utils/fabric-table';

	let activeTab = 'charts'; // charts, tables
	let selectedChartType = 'bar';
	let selectedTableType = 'standard';
	let selectedTableStyle = 'modern';
	
	// Chart configuration
	let chartConfig = {
		title: '',
		showLabels: true,
		showValues: true,
		showGrid: true
	};
	
	// Custom data input
	let showDataEditor = false;
	let dataInput = '';
	let dataError = '';

	function addChart(type) {
		if (!$editor) return;
		
		const center = $editor.getCenter();
		let chart;
		const data = DEFAULT_CHART_DATA[type] || DEFAULT_CHART_DATA.bar;
		
		const config = {
			data,
			title: chartConfig.title || getDefaultTitle(type),
			showLabels: chartConfig.showLabels,
			showValues: chartConfig.showValues,
			showGrid: chartConfig.showGrid
		};
		
		switch(type) {
			case 'bar':
				chart = createBarChart(config);
				break;
			case 'line':
				chart = createLineChart({ ...config, showArea: true });
				break;
			case 'pie':
				chart = createPieChart({ ...config, showLegend: true });
				break;
			case 'donut':
				chart = createPieChart({ ...config, donut: true, showLegend: true });
				break;
			case 'horizontal-bar':
				chart = createHorizontalBarChart(config);
				break;
			default:
				chart = createBarChart(config);
		}
		
		if (chart) {
			chart.set({
				left: center.left,
				top: center.top,
				originX: 'center',
				originY: 'center'
			});
			
			$editor.add(chart);
			$editor.setActiveObject(chart);
			$editor.renderAll();
		}
	}
	
	function addTable(type) {
		if (!$editor) return;
		
		const center = $editor.getCenter();
		let table;
		
		switch(type) {
			case 'standard':
				table = createTable({
					...DEFAULT_TABLE_DATA.standard,
					style: selectedTableStyle
				});
				break;
			case 'stats':
				table = createStatsTable(DEFAULT_TABLE_DATA.stats);
				break;
			case 'comparison':
				table = createComparisonTable(DEFAULT_TABLE_DATA.comparison);
				break;
			default:
				table = createTable({
					...DEFAULT_TABLE_DATA.standard,
					style: selectedTableStyle
				});
		}
		
		if (table) {
			table.set({
				left: center.left,
				top: center.top,
				originX: 'center',
				originY: 'center'
			});
			
			$editor.add(table);
			$editor.setActiveObject(table);
			$editor.renderAll();
		}
	}
	
	function getDefaultTitle(type) {
		switch(type) {
			case 'bar': return 'Sales Overview';
			case 'line': return 'Weekly Trend';
			case 'pie': return 'Distribution';
			case 'donut': return 'Progress';
			case 'horizontal-bar': return 'Comparison';
			default: return '';
		}
	}
	
	function parseDataInput() {
		dataError = '';
		try {
			const parsed = JSON.parse(dataInput);
			if (!Array.isArray(parsed)) {
				dataError = 'Data must be an array';
				return null;
			}
			if (parsed.length === 0) {
				dataError = 'Array cannot be empty';
				return null;
			}
			// Validate structure
			const hasLabelValue = parsed.every(item => 
				typeof item === 'object' && 
				'label' in item && 
				'value' in item
			);
			if (!hasLabelValue) {
				dataError = 'Each item must have "label" and "value" properties';
				return null;
			}
			return parsed;
		} catch (e) {
			dataError = 'Invalid JSON format';
			return null;
		}
	}
	
	function addChartWithCustomData() {
		const data = parseDataInput();
		if (!data) return;
		
		if (!$editor) return;
		
		const center = $editor.getCenter();
		const config = {
			data,
			title: chartConfig.title,
			showLabels: chartConfig.showLabels,
			showValues: chartConfig.showValues,
			showGrid: chartConfig.showGrid
		};
		
		let chart;
		switch(selectedChartType) {
			case 'bar':
				chart = createBarChart(config);
				break;
			case 'line':
				chart = createLineChart({ ...config, showArea: true });
				break;
			case 'pie':
				chart = createPieChart({ ...config, showLegend: true });
				break;
			case 'donut':
				chart = createPieChart({ ...config, donut: true, showLegend: true });
				break;
			case 'horizontal-bar':
				chart = createHorizontalBarChart(config);
				break;
			default:
				chart = createBarChart(config);
		}
		
		if (chart) {
			chart.set({
				left: center.left,
				top: center.top,
				originX: 'center',
				originY: 'center'
			});
			
			$editor.add(chart);
			$editor.setActiveObject(chart);
			$editor.renderAll();
			
			showDataEditor = false;
			dataInput = '';
		}
	}
	
	function loadSampleData() {
		dataInput = JSON.stringify(DEFAULT_CHART_DATA[selectedChartType], null, 2);
		dataError = '';
	}

	// Chart type descriptions
	const chartDescriptions = {
		'bar': 'Compare values across categories',
		'line': 'Show trends over time',
		'pie': 'Display proportions of a whole',
		'donut': 'Proportions with center space',
		'horizontal-bar': 'Horizontal comparison bars'
	};
	
	const tableDescriptions = {
		'standard': 'Classic data table with rows and columns',
		'stats': 'Metrics cards with change indicators',
		'comparison': 'Compare features across options'
	};
</script>

<div class="library-panel">
	<!-- Tabs -->
	<div class="tabs">
		<button 
			class:active={activeTab === 'charts'}
			on:click={() => activeTab = 'charts'}
		>
			<i class="fa fa-chart-bar mr-1"></i>
			Charts
		</button>
		<button 
			class:active={activeTab === 'tables'}
			on:click={() => activeTab = 'tables'}
		>
			<i class="fa fa-table mr-1"></i>
			Tables
		</button>
	</div>
	
	<div class="content">
		{#if activeTab === 'charts'}
			<!-- Quick Add Charts -->
			<div class="section">
				<h3 class="section-title">Quick Add</h3>
				<div class="grid">
					{#each chartTypes as chart}
						<button 
							class="item"
							on:click={() => addChart(chart.type)}
							title={chartDescriptions[chart.type]}
						>
							<i class="fa {chart.icon} icon"></i>
							<span class="label">{chart.name}</span>
						</button>
					{/each}
				</div>
			</div>
			
			<!-- Custom Data Editor -->
			<div class="section">
				<button 
					class="toggle-btn"
					on:click={() => showDataEditor = !showDataEditor}
				>
					<span class="flex items-center gap-2">
						<i class="fa fa-code text-sm"></i>
						Custom Data
					</span>
					<i class="fa fa-chevron-{showDataEditor ? 'up' : 'down'} text-xs"></i>
				</button>
				
				{#if showDataEditor}
					<div class="data-editor">
						<div class="chart-type-select">
							<label>Chart Type</label>
							<select bind:value={selectedChartType}>
								{#each chartTypes as chart}
									<option value={chart.type}>{chart.name}</option>
								{/each}
							</select>
						</div>
						
						<div class="config-row">
							<label>
								<input type="checkbox" bind:checked={chartConfig.showLabels} />
								Labels
							</label>
							<label>
								<input type="checkbox" bind:checked={chartConfig.showValues} />
								Values
							</label>
							<label>
								<input type="checkbox" bind:checked={chartConfig.showGrid} />
								Grid
							</label>
						</div>
						
						<div class="input-group">
							<label>Title (optional)</label>
							<input 
								type="text" 
								bind:value={chartConfig.title}
								placeholder="Chart title..."
							/>
						</div>
						
						<div class="input-group">
							<div class="flex justify-between items-center mb-1">
								<label>Data (JSON)</label>
								<button class="text-link" on:click={loadSampleData}>
									Load Sample
								</button>
							</div>
							<textarea 
								bind:value={dataInput}
								placeholder={`[\n  { "label": "Jan", "value": 30 },\n  { "label": "Feb", "value": 45 }\n]`}
								rows="6"
							></textarea>
							{#if dataError}
								<p class="error-text">{dataError}</p>
							{/if}
						</div>
						
						<button 
							class="add-btn"
							on:click={addChartWithCustomData}
						>
							<i class="fa fa-plus mr-1"></i>
							Add Chart
						</button>
					</div>
				{/if}
			</div>
			
			<!-- Variable Info -->
			<div class="info-box">
				<i class="fa fa-info-circle"></i>
				<p>Charts can be bound to variables for dynamic data. After adding, select the chart and enable "Variable" in Properties.</p>
			</div>
			
		{:else if activeTab === 'tables'}
			<!-- Quick Add Tables -->
			<div class="section">
				<h3 class="section-title">Quick Add</h3>
				<div class="grid">
					{#each tableTypes as table}
						<button 
							class="item"
							on:click={() => addTable(table.type)}
							title={tableDescriptions[table.type]}
						>
							<i class="fa {table.icon} icon"></i>
							<span class="label">{table.name}</span>
						</button>
					{/each}
				</div>
			</div>
			
			<!-- Table Style Selection -->
			<div class="section">
				<h3 class="section-title">Table Style</h3>
				<div class="style-grid">
					{#each Object.entries(TABLE_STYLES) as [key, style]}
						<button 
							class="style-item"
							class:active={selectedTableStyle === key}
							on:click={() => selectedTableStyle = key}
						>
							<div class="style-preview" style="background: {style.headerBg}; border-color: {style.borderColor};">
								<div class="preview-row header" style="background: {style.headerBg};"></div>
								<div class="preview-row" style="background: {style.rowBg};"></div>
								<div class="preview-row" style="background: {style.altRowBg};"></div>
							</div>
							<span class="style-name">{style.name}</span>
						</button>
					{/each}
				</div>
			</div>
			
			<!-- Variable Info -->
			<div class="info-box">
				<i class="fa fa-info-circle"></i>
				<p>Tables support variable data binding. Mark as variable to populate with dynamic data via API.</p>
			</div>
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
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.tabs button:hover {
		color: #333;
		background: #f5f5f5;
	}
	
	.tabs button.active {
		color: #ff6b6b;
		border-bottom-color: #ff6b6b;
		background: white;
	}
	
	.content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 16px;
		min-height: 0;
	}
	
	.section {
		margin-bottom: 20px;
	}
	
	.section-title {
		font-size: 11px;
		font-weight: 600;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 10px;
	}
	
	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
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
	}
	
	.item:hover {
		border-color: #ff6b6b;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 107, 107, 0.15);
	}
	
	.item .icon {
		font-size: 24px;
		color: #666;
		transition: color 0.15s;
	}
	
	.item:hover .icon {
		color: #ff6b6b;
	}
	
	.item .label {
		font-size: 11px;
		color: #666;
		text-align: center;
	}
	
	.toggle-btn {
		width: 100%;
		padding: 10px 12px;
		background: #f8f9fa;
		border: 1px solid #e5e5e5;
		border-radius: 6px;
		cursor: pointer;
		font-size: 12px;
		font-weight: 500;
		color: #333;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: all 0.15s;
	}
	
	.toggle-btn:hover {
		background: #f0f0f0;
		border-color: #ccc;
	}
	
	.data-editor {
		margin-top: 12px;
		padding: 12px;
		background: #fafafa;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
	}
	
	.chart-type-select {
		margin-bottom: 12px;
	}
	
	.chart-type-select label {
		display: block;
		font-size: 11px;
		font-weight: 500;
		color: #666;
		margin-bottom: 4px;
	}
	
	.chart-type-select select {
		width: 100%;
		padding: 8px;
		border: 1px solid #e5e5e5;
		border-radius: 6px;
		font-size: 12px;
		background: white;
	}
	
	.config-row {
		display: flex;
		gap: 12px;
		margin-bottom: 12px;
	}
	
	.config-row label {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		color: #666;
		cursor: pointer;
	}
	
	.config-row input[type="checkbox"] {
		width: 14px;
		height: 14px;
		accent-color: #ff6b6b;
	}
	
	.input-group {
		margin-bottom: 12px;
	}
	
	.input-group label {
		display: block;
		font-size: 11px;
		font-weight: 500;
		color: #666;
		margin-bottom: 4px;
	}
	
	.input-group input[type="text"],
	.input-group textarea {
		width: 100%;
		padding: 8px;
		border: 1px solid #e5e5e5;
		border-radius: 6px;
		font-size: 12px;
		font-family: inherit;
	}
	
	.input-group textarea {
		font-family: 'Monaco', 'Menlo', monospace;
		resize: vertical;
	}
	
	.input-group input:focus,
	.input-group textarea:focus {
		outline: none;
		border-color: #ff6b6b;
		box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.1);
	}
	
	.text-link {
		font-size: 10px;
		color: #ff6b6b;
		background: none;
		border: none;
		cursor: pointer;
		text-decoration: underline;
	}
	
	.error-text {
		font-size: 10px;
		color: #ef4444;
		margin-top: 4px;
	}
	
	.add-btn {
		width: 100%;
		padding: 10px;
		background: linear-gradient(135deg, #ff6b6b 0%, #ffc480 100%);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}
	
	.add-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
	}
	
	.style-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}
	
	.style-item {
		padding: 8px;
		background: white;
		border: 2px solid #e5e5e5;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		transition: all 0.15s;
	}
	
	.style-item:hover {
		border-color: #ff6b6b;
	}
	
	.style-item.active {
		border-color: #ff6b6b;
		background: rgba(255, 107, 107, 0.05);
	}
	
	.style-preview {
		width: 100%;
		height: 32px;
		border-radius: 4px;
		overflow: hidden;
		border: 1px solid;
		display: flex;
		flex-direction: column;
	}
	
	.preview-row {
		flex: 1;
	}
	
	.preview-row.header {
		flex: 1.2;
	}
	
	.style-name {
		font-size: 9px;
		color: #666;
		text-align: center;
	}
	
	.info-box {
		display: flex;
		gap: 8px;
		padding: 12px;
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: 8px;
		margin-top: 16px;
	}
	
	.info-box i {
		color: #0284c7;
		flex-shrink: 0;
		margin-top: 2px;
	}
	
	.info-box p {
		font-size: 11px;
		color: #0369a1;
		line-height: 1.4;
	}
	
	/* Scrollbar */
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
</style>

