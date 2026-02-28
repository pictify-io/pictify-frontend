<script>
	import { editor } from '../../../store/editor.store';
	import PanelTabs from './ui/PanelTabs.svelte';
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

		switch (type) {
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

		switch (type) {
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
		switch (type) {
			case 'bar':
				return 'Sales Overview';
			case 'line':
				return 'Weekly Trend';
			case 'pie':
				return 'Distribution';
			case 'donut':
				return 'Progress';
			case 'horizontal-bar':
				return 'Comparison';
			default:
				return '';
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
			const hasLabelValue = parsed.every(
				(item) => typeof item === 'object' && 'label' in item && 'value' in item
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
		switch (selectedChartType) {
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
		bar: 'Compare values across categories',
		line: 'Show trends over time',
		pie: 'Display proportions of a whole',
		donut: 'Proportions with center space',
		'horizontal-bar': 'Horizontal comparison bars'
	};

	const tableDescriptions = {
		standard: 'Classic data table with rows and columns',
		stats: 'Metrics cards with change indicators',
		comparison: 'Compare features across options'
	};
</script>

<div class="library-panel">
	<!-- Tabs -->
	<PanelTabs
		tabs={[
			{ id: 'charts', label: 'Charts', icon: 'fa fa-chart-bar' },
			{ id: 'tables', label: 'Tables', icon: 'fa fa-table' }
		]}
		{activeTab}
		on:change={(e) => (activeTab = e.detail)}
	/>

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
							<i class="fa {chart.icon} icon" />
							<span class="label">{chart.name}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Custom Data Editor -->
			<div class="section">
				<button class="toggle-btn" on:click={() => (showDataEditor = !showDataEditor)}>
					<span class="flex items-center gap-2">
						<i class="fa fa-code text-sm" />
						Custom Data
					</span>
					<i class="fa fa-chevron-{showDataEditor ? 'up' : 'down'} text-xs" />
				</button>

				{#if showDataEditor}
					<div class="data-editor">
						<div class="chart-type-select">
							<label for="chart-type">Chart Type</label>
							<select id="chart-type" bind:value={selectedChartType}>
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
							<label for="chart-title">Title (optional)</label>
							<input type="text" bind:value={chartConfig.title} placeholder="Chart title..." />
						</div>

						<div class="input-group">
							<div class="flex justify-between items-center mb-1">
								<label for="data-json">Data (JSON)</label>
								<button class="text-link" on:click={loadSampleData}> Load Sample </button>
							</div>
							<textarea
								bind:value={dataInput}
								placeholder={`[\n  { "label": "Jan", "value": 30 },\n  { "label": "Feb", "value": 45 }\n]`}
								rows="6"
							/>
							{#if dataError}
								<p class="error-text">{dataError}</p>
							{/if}
						</div>

						<button class="add-btn" on:click={addChartWithCustomData}>
							<i class="fa fa-plus mr-1" />
							Add Chart
						</button>
					</div>
				{/if}
			</div>

			<!-- Variable Info -->
			<div class="info-box">
				<i class="fa fa-info-circle" />
				<p>
					Charts can be bound to variables for dynamic data. After adding, select the chart and
					enable "Variable" in Properties.
				</p>
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
							<i class="fa {table.icon} icon" />
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
							on:click={() => (selectedTableStyle = key)}
						>
							<div
								class="style-preview"
								style="background: {style.headerBg}; border-color: {style.borderColor};"
							>
								<div class="preview-row header" style="background: {style.headerBg};" />
								<div class="preview-row" style="background: {style.rowBg};" />
								<div class="preview-row" style="background: {style.altRowBg};" />
							</div>
							<span class="style-name">{style.name}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Variable Info -->
			<div class="info-box">
				<i class="fa fa-info-circle" />
				<p>
					Tables support variable data binding. Mark as variable to populate with dynamic data via
					API.
				</p>
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
		background: #fffdf8;
		overflow: hidden;
	}

	.content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 16px;
		min-height: 0;
		background: #fffdf8;
	}

	.section {
		margin-bottom: 20px;
	}

	.section-title {
		font-size: 11px;
		font-weight: 900;
		color: #111827;
		text-transform: uppercase;
		letter-spacing: 0.1em;
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
		border: 2px solid #111827;
		border-radius: 6px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		transition: all 0.1s;
		box-shadow: 2px 2px 0 0 #111827;
	}

	.item:hover {
		border-color: #111827;
		transform: translate(-2px, -2px);
		box-shadow: 4px 4px 0 0 #ffc480;
		background: #fff;
	}

	.item .icon {
		font-size: 24px;
		color: #111827;
		transition: color 0.15s;
	}

	.item:hover .icon {
		color: #000;
	}

	.item .label {
		font-size: 11px;
		color: #111827;
		text-align: center;
		font-weight: 700;
		text-transform: uppercase;
	}

	.toggle-btn {
		width: 100%;
		padding: 10px 12px;
		background: #fffdf8;
		border: 2px solid #111827;
		border-radius: 6px;
		cursor: pointer;
		font-size: 12px;
		font-weight: 700;
		color: #111827;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: all 0.15s;
		box-shadow: 2px 2px 0 0 #111827;
		text-transform: uppercase;
	}

	.toggle-btn:hover {
		background: #fff;
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 0 #111827;
	}

	.data-editor {
		margin-top: 12px;
		padding: 12px;
		background: #fff;
		border: 2px solid #111827;
		border-radius: 8px;
		box-shadow: 4px 4px 0 0 #1f2937;
	}

	.chart-type-select {
		margin-bottom: 12px;
	}

	.chart-type-select label {
		display: block;
		font-size: 11px;
		font-weight: 800;
		color: #111827;
		margin-bottom: 4px;
		text-transform: uppercase;
	}

	.chart-type-select select {
		width: 100%;
		padding: 8px;
		border: 2px solid #111827;
		border-radius: 6px;
		font-size: 12px;
		background: white;
		font-weight: 600;
		color: #111827;
		box-shadow: 2px 2px 0 0 #111827;
	}

	.chart-type-select select:focus {
		outline: none;
		box-shadow: 2px 2px 0 0 #ffc480;
	}

	.config-row {
		display: flex;
		gap: 12px;
		margin-bottom: 12px;
	}

	.config-row label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: #111827;
		cursor: pointer;
		font-weight: 600;
		text-transform: uppercase;
	}

	.config-row input[type='checkbox'] {
		width: 16px;
		height: 16px;
		accent-color: #111827;
		border: 2px solid #111827;
	}

	.input-group {
		margin-bottom: 12px;
	}

	.input-group label {
		display: block;
		font-size: 11px;
		font-weight: 800;
		color: #111827;
		margin-bottom: 4px;
		text-transform: uppercase;
	}

	.input-group input[type='text'],
	.input-group textarea {
		width: 100%;
		padding: 8px;
		border: 2px solid #111827;
		border-radius: 6px;
		font-size: 12px;
		font-family: inherit;
		background: #fff;
		color: #111827;
		font-weight: 500;
	}

	.input-group textarea {
		font-family: 'Monaco', 'Menlo', monospace;
		resize: vertical;
	}

	.input-group input:focus,
	.input-group textarea:focus {
		outline: none;
		border-color: #111827;
		box-shadow: 2px 2px 0 0 #ffc480;
	}

	.text-link {
		font-size: 10px;
		color: #111827;
		background: none;
		border: none;
		cursor: pointer;
		text-decoration: underline;
		font-weight: 700;
	}

	.text-link:hover {
		color: #000;
	}

	.error-text {
		font-size: 10px;
		color: #ef4444;
		margin-top: 4px;
		font-weight: 600;
	}

	.add-btn {
		width: 100%;
		padding: 10px;
		background: #111827;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 800;
		cursor: pointer;
		transition: all 0.15s;
		text-transform: uppercase;
		box-shadow: 2px 2px 0 0 #000;
	}

	.add-btn:hover {
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 0 #ffc480;
		color: #ffc480;
	}

	.style-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}

	.style-item {
		padding: 8px;
		background: white;
		border: 2px solid #111827;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		transition: all 0.15s;
		box-shadow: 2px 2px 0 0 #111827;
	}

	.style-item:hover {
		transform: translate(-2px, -2px);
		box-shadow: 4px 4px 0 0 #ffc480;
	}

	.style-item.active {
		border-color: #111827;
		background: #ffc480;
		box-shadow: inset 2px 2px 0 0 #111827;
		transform: translate(1px, 1px);
	}

	.style-preview {
		width: 100%;
		height: 32px;
		border-radius: 4px;
		overflow: hidden;
		border: 2px solid #111827;
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
		color: #111827;
		text-align: center;
		font-weight: 700;
		text-transform: uppercase;
	}

	.info-box {
		display: flex;
		gap: 8px;
		padding: 12px;
		background: #f0f9ff;
		border: 2px solid #111827;
		border-radius: 8px;
		margin-top: 16px;
		box-shadow: 4px 4px 0 0 #111827;
	}

	.info-box i {
		color: #111827;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.info-box p {
		font-size: 11px;
		color: #111827;
		line-height: 1.4;
		font-weight: 500;
	}

	/* Scrollbar */
	.content::-webkit-scrollbar {
		width: 6px;
	}

	.content::-webkit-scrollbar-track {
		background: transparent;
	}

	.content::-webkit-scrollbar-thumb {
		background: #111827;
		border-radius: 3px;
	}

	.content::-webkit-scrollbar-thumb:hover {
		background: #000;
	}
</style>
