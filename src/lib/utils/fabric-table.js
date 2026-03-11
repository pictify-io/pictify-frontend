/**
 * Fabric.js Table Rendering Utilities
 *
 * Creates tables as Fabric.js groups that can be placed on the canvas.
 * Supports various styling options and variable data binding.
 */

import { Group, Rect, IText, Line } from 'fabric';

/**
 * Generate unique ID for table elements
 */
function generateId() {
	return 'table_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Default table styles
 */
export const TABLE_STYLES = {
	modern: {
		name: 'Modern',
		headerBg: '#1a1a2e',
		headerText: '#ffffff',
		rowBg: '#ffffff',
		altRowBg: '#f8fafc',
		borderColor: '#e2e8f0',
		textColor: '#334155',
		headerFontWeight: 'bold',
		borderRadius: 8
	},
	minimal: {
		name: 'Minimal',
		headerBg: 'transparent',
		headerText: '#1a1a1a',
		rowBg: 'transparent',
		altRowBg: 'transparent',
		borderColor: '#e5e5e5',
		textColor: '#666666',
		headerFontWeight: 'bold',
		borderRadius: 0
	},
	colorful: {
		name: 'Colorful',
		headerBg: '#ff6b6b',
		headerText: '#ffffff',
		rowBg: '#ffffff',
		altRowBg: '#fff5f5',
		borderColor: '#ffccd5',
		textColor: '#333333',
		headerFontWeight: 'bold',
		borderRadius: 12
	},
	corporate: {
		name: 'Corporate',
		headerBg: '#0f172a',
		headerText: '#ffffff',
		rowBg: '#ffffff',
		altRowBg: '#f1f5f9',
		borderColor: '#cbd5e1',
		textColor: '#1e293b',
		headerFontWeight: 'bold',
		borderRadius: 4
	},
	gradient: {
		name: 'Gradient',
		headerBg: '#6366f1',
		headerText: '#ffffff',
		rowBg: '#ffffff',
		altRowBg: '#eef2ff',
		borderColor: '#c7d2fe',
		textColor: '#3730a3',
		headerFontWeight: 'bold',
		borderRadius: 16
	}
};

/**
 * Create a table as a Fabric.js Group
 * @param {Object} config - Table configuration
 * @returns {Group} Fabric.js Group containing the table
 */
export function createTable(config = {}) {
	const {
		headers = ['Name', 'Value', 'Status'],
		rows = [
			['Product A', '$1,200', 'Active'],
			['Product B', '$850', 'Pending'],
			['Product C', '$2,100', 'Active'],
			['Product D', '$450', 'Inactive']
		],
		style = 'modern',
		cellWidth = 120,
		cellHeight = 40,
		headerHeight = 45,
		fontSize = 12,
		headerFontSize = 13,
		padding = 12,
		showRowNumbers = false,
		alternateRows = true,
		title = '',
		customStyle = null,
		fontFamily = 'Inter, system-ui, sans-serif'
	} = config;

	const objects = [];
	const tableStyle = customStyle || TABLE_STYLES[style] || TABLE_STYLES.modern;

	// Calculate dimensions
	const columnCount = headers.length + (showRowNumbers ? 1 : 0);
	const rowCount = rows.length;
	const tableWidth = cellWidth * columnCount;
	const tableHeight = headerHeight + cellHeight * rowCount;
	const totalHeight = tableHeight + (title ? 40 : 0);

	// Title
	if (title) {
		const titleText = new IText(title, {
			left: tableWidth / 2,
			top: 15,
			fontSize: 16,
			fontWeight: 'bold',
			fill: tableStyle.headerText === '#ffffff' ? tableStyle.headerBg : tableStyle.textColor,
			originX: 'center',
			originY: 'center',
			fontFamily
		});
		objects.push(titleText);
	}

	const tableTop = title ? 40 : 0;

	// Table background with border radius
	const tableBg = new Rect({
		left: 0,
		top: tableTop,
		width: tableWidth,
		height: tableHeight,
		fill: tableStyle.rowBg,
		stroke: tableStyle.borderColor,
		strokeWidth: 1,
		rx: tableStyle.borderRadius,
		ry: tableStyle.borderRadius
	});
	objects.push(tableBg);

	// Header background (with top radius only)
	const headerBg = new Rect({
		left: 0,
		top: tableTop,
		width: tableWidth,
		height: headerHeight,
		fill: tableStyle.headerBg,
		rx: tableStyle.borderRadius,
		ry: tableStyle.borderRadius
	});
	objects.push(headerBg);

	// Mask bottom corners of header if needed
	if (tableStyle.borderRadius > 0) {
		const headerMask = new Rect({
			left: 0,
			top: tableTop + headerHeight - tableStyle.borderRadius,
			width: tableWidth,
			height: tableStyle.borderRadius,
			fill: tableStyle.headerBg
		});
		objects.push(headerMask);
	}

	// Header separator line
	const headerLine = new Line([0, tableTop + headerHeight, tableWidth, tableTop + headerHeight], {
		stroke: tableStyle.borderColor,
		strokeWidth: 1
	});
	objects.push(headerLine);

	// Column index offset for row numbers
	const colOffset = showRowNumbers ? 1 : 0;

	// Row number header if enabled
	if (showRowNumbers) {
		const numHeaderText = new IText('#', {
			left: cellWidth / 2,
			top: tableTop + headerHeight / 2,
			fontSize: headerFontSize,
			fontWeight: tableStyle.headerFontWeight,
			fill: tableStyle.headerText,
			originX: 'center',
			originY: 'center',
			fontFamily
		});
		objects.push(numHeaderText);
	}

	// Header text
	headers.forEach((header, colIndex) => {
		const x = (colIndex + colOffset) * cellWidth + cellWidth / 2;
		const headerText = new IText(header, {
			left: x,
			top: tableTop + headerHeight / 2,
			fontSize: headerFontSize,
			fontWeight: tableStyle.headerFontWeight,
			fill: tableStyle.headerText,
			originX: 'center',
			originY: 'center',
			fontFamily
		});
		objects.push(headerText);

		// Column separator line (except for last column)
		if (colIndex < headers.length - 1 || showRowNumbers) {
			const colLine = new Line(
				[
					(colIndex + colOffset + 1) * cellWidth,
					tableTop,
					(colIndex + colOffset + 1) * cellWidth,
					tableTop + tableHeight
				],
				{
					stroke: tableStyle.borderColor,
					strokeWidth: 1
				}
			);
			objects.push(colLine);
		}
	});

	// Row number column separator
	if (showRowNumbers) {
		const numColLine = new Line([cellWidth, tableTop, cellWidth, tableTop + tableHeight], {
			stroke: tableStyle.borderColor,
			strokeWidth: 1
		});
		objects.push(numColLine);
	}

	// Data rows
	rows.forEach((row, rowIndex) => {
		const y = tableTop + headerHeight + rowIndex * cellHeight;
		const isAlt = alternateRows && rowIndex % 2 === 1;

		// Alternate row background
		if (isAlt && tableStyle.altRowBg !== tableStyle.rowBg) {
			// Check if it's the last row for bottom radius
			const isLastRow = rowIndex === rows.length - 1;
			const rowBg = new Rect({
				left: 0,
				top: y,
				width: tableWidth,
				height: cellHeight,
				fill: tableStyle.altRowBg,
				rx: isLastRow ? tableStyle.borderRadius : 0,
				ry: isLastRow ? tableStyle.borderRadius : 0
			});
			objects.push(rowBg);
		}

		// Row separator line (except for last row)
		if (rowIndex < rows.length - 1) {
			const rowLine = new Line([0, y + cellHeight, tableWidth, y + cellHeight], {
				stroke: tableStyle.borderColor,
				strokeWidth: 1
			});
			objects.push(rowLine);
		}

		// Row number cell
		if (showRowNumbers) {
			const rowNumText = new IText((rowIndex + 1).toString(), {
				left: cellWidth / 2,
				top: y + cellHeight / 2,
				fontSize: fontSize,
				fill: tableStyle.textColor,
				originX: 'center',
				originY: 'center',
				fontFamily,
				opacity: 0.6
			});
			objects.push(rowNumText);
		}

		// Cell text
		row.forEach((cell, colIndex) => {
			const x = (colIndex + colOffset) * cellWidth + cellWidth / 2;
			// Truncate text if it exceeds cell width (minus padding)
			let displayText = String(cell);
			const maxTextWidth = cellWidth - padding * 2;
			if (displayText.length > Math.floor(maxTextWidth / (fontSize * 0.6))) {
				const maxChars = Math.floor(maxTextWidth / (fontSize * 0.6));
				displayText = displayText.slice(0, Math.max(1, maxChars - 1)) + '…';
			}
			const cellText = new IText(displayText, {
				left: x,
				top: y + cellHeight / 2,
				fontSize: fontSize,
				fill: tableStyle.textColor,
				originX: 'center',
				originY: 'center',
				fontFamily
			});
			objects.push(cellText);
		});
	});

	// Create group
	const group = new Group(objects, {
		left: 0,
		top: 0
	});

	// Store table metadata for editing
	group.set('tableType', 'standard');
	group.set('tableHeaders', headers);
	group.set('tableRows', rows);
	group.set('tableConfig', config);
	group.set('isTable', true);
	group.set('name', title || 'Data Table');
	group.set('id', generateId());

	return group;
}

/**
 * Create a simple stats/metrics table
 */
export function createStatsTable(config = {}) {
	const {
		stats = [
			{ label: 'Total Revenue', value: '$45,231', change: '+12%', positive: true },
			{ label: 'Active Users', value: '2,345', change: '+8%', positive: true },
			{ label: 'Conversion', value: '3.2%', change: '-0.5%', positive: false },
			{ label: 'Avg. Order', value: '$89', change: '+2%', positive: true }
		],
		columns = 2,
		cardWidth = 160,
		cardHeight = 90,
		gap = 12,
		style = 'modern',
		positiveColor = '#10b981',
		negativeColor = '#ef4444',
		title = '',
		fontFamily = 'Inter, system-ui, sans-serif',
		customStyle = null
	} = config;

	// Get style from TABLE_STYLES or use defaults
	const tableStyle = customStyle || TABLE_STYLES[style] || TABLE_STYLES.modern;

	// Map table style to stats card colors
	const backgroundColor = tableStyle.rowBg;
	const borderColor = tableStyle.borderColor;
	const labelColor = tableStyle.textColor + '99'; // Slightly transparent
	const valueColor =
		tableStyle.headerBg === 'transparent' ? tableStyle.textColor : tableStyle.headerBg;

	const objects = [];
	const rows = Math.ceil(stats.length / columns);
	const totalWidth = columns * cardWidth + (columns - 1) * gap;
	const totalHeight = rows * cardHeight + (rows - 1) * gap + (title ? 50 : 0);

	// Title
	if (title) {
		const titleText = new IText(title, {
			left: totalWidth / 2,
			top: 15,
			fontSize: 16,
			fontWeight: 'bold',
			fill: valueColor,
			originX: 'center',
			originY: 'center',
			fontFamily
		});
		objects.push(titleText);
	}

	const startY = title ? 40 : 0;

	// Create stat cards
	stats.forEach((stat, index) => {
		const col = index % columns;
		const row = Math.floor(index / columns);
		const x = col * (cardWidth + gap);
		const y = startY + row * (cardHeight + gap);

		// Card background
		const card = new Rect({
			left: x,
			top: y,
			width: cardWidth,
			height: cardHeight,
			fill: backgroundColor,
			stroke: borderColor,
			strokeWidth: 1,
			rx: tableStyle.borderRadius,
			ry: tableStyle.borderRadius
		});
		objects.push(card);

		// Label
		const label = new IText(stat.label, {
			left: x + 12,
			top: y + 16,
			fontSize: 11,
			fill: labelColor,
			originX: 'left',
			originY: 'center',
			fontFamily
		});
		objects.push(label);

		// Value
		const value = new IText(stat.value, {
			left: x + 12,
			top: y + 45,
			fontSize: 24,
			fontWeight: 'bold',
			fill: valueColor,
			originX: 'left',
			originY: 'center',
			fontFamily
		});
		objects.push(value);

		// Change indicator
		if (stat.change) {
			const changeColor = stat.positive ? positiveColor : negativeColor;
			const changeText = new IText(stat.change, {
				left: x + cardWidth - 12,
				top: y + cardHeight - 16,
				fontSize: 12,
				fontWeight: '600',
				fill: changeColor,
				originX: 'right',
				originY: 'center',
				fontFamily
			});
			objects.push(changeText);
		}
	});

	const group = new Group(objects, {
		left: 0,
		top: 0
	});

	group.set('tableType', 'stats');
	group.set('tableData', stats);
	group.set('tableStyle', style);
	group.set('tableConfig', config);
	group.set('isTable', true);
	group.set('name', title || 'Stats Cards');
	group.set('id', generateId());

	return group;
}

/**
 * Create a comparison table (good for pricing, features, etc.)
 */
export function createComparisonTable(config = {}) {
	const {
		features = ['Storage', 'Users', 'Support', 'API Access', 'Analytics'],
		plans = [
			{
				name: 'Basic',
				values: ['10GB', '1', 'Email', '✗', '✗'],
				price: '$9/mo',
				highlighted: false
			},
			{ name: 'Pro', values: ['100GB', '5', '24/7', '✓', '✓'], price: '$29/mo', highlighted: true },
			{
				name: 'Enterprise',
				values: ['Unlimited', '∞', 'Dedicated', '✓', '✓'],
				price: '$99/mo',
				highlighted: false
			}
		],
		cellWidth = 120,
		cellHeight = 40,
		headerHeight = 60,
		style = 'modern',
		title = '',
		fontFamily = 'Inter, system-ui, sans-serif',
		customStyle = null
	} = config;

	// Get style from TABLE_STYLES
	const tableStyle = customStyle || TABLE_STYLES[style] || TABLE_STYLES.modern;

	// Map table style to comparison table colors
	const backgroundColor = tableStyle.rowBg;
	const borderColor = tableStyle.borderColor;
	const textColor = tableStyle.textColor;
	const headerTextColor = tableStyle.headerText;
	const headerBgColor = tableStyle.headerBg;
	// Use header background as highlight color if not transparent
	const highlightColor = headerBgColor === 'transparent' ? '#6366f1' : headerBgColor;

	const objects = [];
	const columnCount = plans.length + 1; // +1 for feature labels
	const rowCount = features.length;
	const tableWidth = cellWidth * columnCount;
	const tableHeight = headerHeight + cellHeight * rowCount;
	const totalHeight = tableHeight + (title ? 40 : 0);

	// Title
	if (title) {
		const titleText = new IText(title, {
			left: tableWidth / 2,
			top: 15,
			fontSize: 18,
			fontWeight: 'bold',
			fill: textColor,
			originX: 'center',
			originY: 'center',
			fontFamily
		});
		objects.push(titleText);
	}

	const tableTop = title ? 40 : 0;

	// Table background
	const tableBg = new Rect({
		left: 0,
		top: tableTop,
		width: tableWidth,
		height: tableHeight,
		fill: backgroundColor,
		stroke: borderColor,
		strokeWidth: 1,
		rx: tableStyle.borderRadius,
		ry: tableStyle.borderRadius
	});
	objects.push(tableBg);

	// Plan headers
	plans.forEach((plan, index) => {
		const x = (index + 1) * cellWidth;
		const isHighlighted = plan.highlighted;

		if (isHighlighted) {
			// Highlighted column background
			const highlightBg = new Rect({
				left: x,
				top: tableTop,
				width: cellWidth,
				height: tableHeight,
				fill: highlightColor + '15',
				stroke: highlightColor,
				strokeWidth: 2,
				rx: index === plans.length - 1 ? tableStyle.borderRadius : 0,
				ry: index === plans.length - 1 ? tableStyle.borderRadius : 0
			});
			objects.push(highlightBg);
		}

		// Plan name
		const planName = new IText(plan.name, {
			left: x + cellWidth / 2,
			top: tableTop + 20,
			fontSize: 14,
			fontWeight: 'bold',
			fill: isHighlighted ? highlightColor : textColor,
			originX: 'center',
			originY: 'center',
			fontFamily
		});
		objects.push(planName);

		// Price
		const priceText = new IText(plan.price, {
			left: x + cellWidth / 2,
			top: tableTop + 42,
			fontSize: 12,
			fill: isHighlighted ? highlightColor : textColor + '99',
			originX: 'center',
			originY: 'center',
			fontFamily
		});
		objects.push(priceText);
	});

	// Features column header
	const featuresHeader = new IText('Features', {
		left: cellWidth / 2,
		top: tableTop + headerHeight / 2,
		fontSize: 12,
		fontWeight: 'bold',
		fill: textColor + '99',
		originX: 'center',
		originY: 'center',
		fontFamily
	});
	objects.push(featuresHeader);

	// Header separator
	const headerLine = new Line([0, tableTop + headerHeight, tableWidth, tableTop + headerHeight], {
		stroke: borderColor,
		strokeWidth: 1
	});
	objects.push(headerLine);

	// Feature rows
	features.forEach((feature, rowIndex) => {
		const y = tableTop + headerHeight + rowIndex * cellHeight;

		// Row separator
		if (rowIndex < features.length - 1) {
			const rowLine = new Line([0, y + cellHeight, tableWidth, y + cellHeight], {
				stroke: borderColor,
				strokeWidth: 1
			});
			objects.push(rowLine);
		}

		// Feature name
		const featureText = new IText(feature, {
			left: cellWidth / 2,
			top: y + cellHeight / 2,
			fontSize: 12,
			fill: textColor,
			originX: 'center',
			originY: 'center',
			fontFamily
		});
		objects.push(featureText);

		// Plan values
		plans.forEach((plan, colIndex) => {
			const x = (colIndex + 1) * cellWidth + cellWidth / 2;
			const value = plan.values[rowIndex];
			const isCheck = value === '✓';
			const isCross = value === '✗';

			const valueText = new IText(value, {
				left: x,
				top: y + cellHeight / 2,
				fontSize: isCheck || isCross ? 16 : 12,
				fill: isCheck ? '#10b981' : isCross ? '#ef4444' : textColor,
				originX: 'center',
				originY: 'center',
				fontFamily
			});
			objects.push(valueText);
		});
	});

	const group = new Group(objects, {
		left: 0,
		top: 0
	});

	group.set('tableType', 'comparison');
	group.set('tableFeatures', features);
	group.set('tablePlans', plans);
	group.set('tableStyle', style);
	group.set('tableConfig', config);
	group.set('isTable', true);
	group.set('name', title || 'Comparison Table');
	group.set('id', generateId());

	return group;
}

/**
 * Update table with new data
 */
export function updateTableData(table, newData) {
	if (!table || !table.isTable) return table;

	const config = { ...table.tableConfig };
	const position = {
		left: table.left,
		top: table.top,
		scaleX: table.scaleX,
		scaleY: table.scaleY,
		angle: table.angle
	};

	let newTable;
	switch (table.tableType) {
		case 'standard':
			if (newData.headers) config.headers = newData.headers;
			if (newData.rows) config.rows = newData.rows;
			newTable = createTable(config);
			break;
		case 'stats':
			if (newData.stats) config.stats = newData.stats;
			newTable = createStatsTable(config);
			break;
		case 'comparison':
			if (newData.features) config.features = newData.features;
			if (newData.plans) config.plans = newData.plans;
			newTable = createComparisonTable(config);
			break;
		default:
			return table;
	}

	newTable.set(position);
	return newTable;
}

export const tableTypes = [
	{ type: 'standard', name: 'Data Table', icon: 'fa-table' },
	{ type: 'stats', name: 'Stats Cards', icon: 'fa-th-large' },
	{ type: 'comparison', name: 'Comparison', icon: 'fa-columns' }
];

export const DEFAULT_TABLE_DATA = {
	standard: {
		headers: ['Product', 'Price', 'Stock'],
		rows: [
			['Widget A', '$29.99', '150'],
			['Widget B', '$49.99', '89'],
			['Widget C', '$19.99', '234'],
			['Widget D', '$99.99', '45']
		]
	},
	stats: {
		stats: [
			{ label: 'Total Revenue', value: '$45,231', change: '+12%', positive: true },
			{ label: 'Active Users', value: '2,345', change: '+8%', positive: true },
			{ label: 'Conversion', value: '3.2%', change: '-0.5%', positive: false },
			{ label: 'Avg. Order', value: '$89', change: '+2%', positive: true }
		]
	},
	comparison: {
		features: ['Storage', 'Users', 'Support', 'API Access'],
		plans: [
			{ name: 'Basic', values: ['10GB', '1', 'Email', '✗'], price: '$9/mo', highlighted: false },
			{ name: 'Pro', values: ['100GB', '5', '24/7', '✓'], price: '$29/mo', highlighted: true },
			{
				name: 'Enterprise',
				values: ['Unlimited', '∞', 'Dedicated', '✓'],
				price: '$99/mo',
				highlighted: false
			}
		]
	}
};
