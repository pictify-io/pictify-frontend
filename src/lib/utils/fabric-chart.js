/**
 * Fabric.js Chart Rendering Utilities
 * 
 * Creates charts as Fabric.js groups that can be placed on the canvas.
 * Supports bar, line, pie, and donut charts with variable data binding.
 */

import { Group, Rect, Path, Circle, IText, Line } from 'fabric';

// Default chart colors palette
const DEFAULT_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
  '#dfe6e9', '#fd79a8', '#a29bfe', '#6c5ce7', '#00b894'
];

/**
 * Generate unique ID for chart elements
 */
function generateId() {
  return 'chart_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Create a bar chart as a Fabric.js Group
 * @param {Object} config - Chart configuration
 * @returns {Group} Fabric.js Group containing the chart
 */
export function createBarChart(config = {}) {
  const {
    data = [
      { label: 'Jan', value: 30 },
      { label: 'Feb', value: 45 },
      { label: 'Mar', value: 60 },
      { label: 'Apr', value: 35 },
      { label: 'May', value: 55 }
    ],
    width = 400,
    height = 300,
    colors = DEFAULT_COLORS,
    title = 'Bar Chart',
    showLabels = true,
    showValues = true,
    showGrid = true,
    barSpacing = 0.2,
    backgroundColor = '#ffffff',
    borderColor = '#e5e5e5',
    titleColor = '#333333',
    labelColor = '#666666',
    gridColor = '#eeeeee'
  } = config;

  const objects = [];
  const padding = { top: 50, right: 20, bottom: 50, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Background
  const bg = new Rect({
    left: 0,
    top: 0,
    width,
    height,
    fill: backgroundColor,
    stroke: borderColor,
    strokeWidth: 1,
    rx: 8,
    ry: 8
  });
  objects.push(bg);

  // Title
  if (title) {
    const titleText = new IText(title, {
      left: width / 2,
      top: 20,
      fontSize: 16,
      fontWeight: 'bold',
      fill: titleColor,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Inter, system-ui, sans-serif'
    });
    objects.push(titleText);
  }

  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(d => d.value)) * 1.1;
  const barCount = data.length;
  const barWidth = (chartWidth / barCount) * (1 - barSpacing);
  const barGap = (chartWidth / barCount) * barSpacing;

  // Grid lines
  if (showGrid) {
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      const gridLine = new Line([padding.left, y, width - padding.right, y], {
        stroke: gridColor,
        strokeWidth: 1
      });
      objects.push(gridLine);

      // Y-axis labels
      const value = Math.round(maxValue - (maxValue / gridLines) * i);
      const yLabel = new IText(value.toString(), {
        left: padding.left - 10,
        top: y,
        fontSize: 10,
        fill: labelColor,
        originX: 'right',
        originY: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      });
      objects.push(yLabel);
    }
  }

  // Bars
  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * chartHeight;
    const x = padding.left + index * (barWidth + barGap) + barGap / 2;
    const y = padding.top + chartHeight - barHeight;

    const bar = new Rect({
      left: x,
      top: y,
      width: barWidth,
      height: barHeight,
      fill: colors[index % colors.length],
      rx: 4,
      ry: 4
    });
    objects.push(bar);

    // Value label on bar
    if (showValues) {
      const valueLabel = new IText(item.value.toString(), {
        left: x + barWidth / 2,
        top: y - 10,
        fontSize: 11,
        fontWeight: '600',
        fill: titleColor,
        originX: 'center',
        originY: 'bottom',
        fontFamily: 'Inter, system-ui, sans-serif'
      });
      objects.push(valueLabel);
    }

    // X-axis label
    if (showLabels) {
      const label = new IText(item.label, {
        left: x + barWidth / 2,
        top: height - padding.bottom + 15,
        fontSize: 10,
        fill: labelColor,
        originX: 'center',
        originY: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      });
      objects.push(label);
    }
  });

  // Create group
  const group = new Group(objects, {
    left: 0,
    top: 0
  });

  // Store chart metadata for editing
  group.set('chartType', 'bar');
  group.set('chartData', data);
  group.set('chartConfig', config);
  group.set('isChart', true);
  group.set('name', 'Bar Chart');
  group.set('id', generateId());

  return group;
}

/**
 * Create a line chart as a Fabric.js Group
 */
export function createLineChart(config = {}) {
  const {
    data = [
      { label: 'Jan', value: 30 },
      { label: 'Feb', value: 45 },
      { label: 'Mar', value: 25 },
      { label: 'Apr', value: 60 },
      { label: 'May', value: 55 }
    ],
    width = 400,
    height = 300,
    colors = DEFAULT_COLORS,
    title = 'Line Chart',
    showLabels = true,
    showPoints = true,
    showGrid = true,
    showArea = false,
    lineWidth = 3,
    backgroundColor = '#ffffff',
    borderColor = '#e5e5e5',
    titleColor = '#333333',
    labelColor = '#666666',
    gridColor = '#eeeeee'
  } = config;

  const objects = [];
  const padding = { top: 50, right: 20, bottom: 50, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Background
  const bg = new Rect({
    left: 0,
    top: 0,
    width,
    height,
    fill: backgroundColor,
    stroke: borderColor,
    strokeWidth: 1,
    rx: 8,
    ry: 8
  });
  objects.push(bg);

  // Title
  if (title) {
    const titleText = new IText(title, {
      left: width / 2,
      top: 20,
      fontSize: 16,
      fontWeight: 'bold',
      fill: titleColor,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Inter, system-ui, sans-serif'
    });
    objects.push(titleText);
  }

  // Calculate scaling
  const maxValue = Math.max(...data.map(d => d.value)) * 1.1;
  const pointCount = data.length;
  const stepX = chartWidth / (pointCount - 1);

  // Grid lines
  if (showGrid) {
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      const gridLine = new Line([padding.left, y, width - padding.right, y], {
        stroke: gridColor,
        strokeWidth: 1
      });
      objects.push(gridLine);

      const value = Math.round(maxValue - (maxValue / gridLines) * i);
      const yLabel = new IText(value.toString(), {
        left: padding.left - 10,
        top: y,
        fontSize: 10,
        fill: labelColor,
        originX: 'right',
        originY: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      });
      objects.push(yLabel);
    }
  }

  // Calculate points
  const points = data.map((item, index) => ({
    x: padding.left + index * stepX,
    y: padding.top + chartHeight - (item.value / maxValue) * chartHeight
  }));

  // Area fill (optional)
  if (showArea) {
    let areaPath = `M ${points[0].x} ${padding.top + chartHeight}`;
    points.forEach(p => {
      areaPath += ` L ${p.x} ${p.y}`;
    });
    areaPath += ` L ${points[points.length - 1].x} ${padding.top + chartHeight} Z`;

    const area = new Path(areaPath, {
      fill: colors[0] + '30', // 30% opacity
      stroke: '',
      strokeWidth: 0
    });
    objects.push(area);
  }

  // Line path
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    linePath += ` L ${points[i].x} ${points[i].y}`;
  }

  const line = new Path(linePath, {
    fill: '',
    stroke: colors[0],
    strokeWidth: lineWidth,
    strokeLineCap: 'round',
    strokeLineJoin: 'round'
  });
  objects.push(line);

  // Points and labels
  data.forEach((item, index) => {
    const point = points[index];

    if (showPoints) {
      const dot = new Circle({
        left: point.x,
        top: point.y,
        radius: 5,
        fill: '#ffffff',
        stroke: colors[0],
        strokeWidth: 2,
        originX: 'center',
        originY: 'center'
      });
      objects.push(dot);
    }

    if (showLabels) {
      const label = new IText(item.label, {
        left: point.x,
        top: height - padding.bottom + 15,
        fontSize: 10,
        fill: labelColor,
        originX: 'center',
        originY: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      });
      objects.push(label);
    }
  });

  const group = new Group(objects, {
    left: 0,
    top: 0
  });

  group.set('chartType', 'line');
  group.set('chartData', data);
  group.set('chartConfig', config);
  group.set('isChart', true);
  group.set('name', 'Line Chart');
  group.set('id', generateId());

  return group;
}

/**
 * Create a pie chart as a Fabric.js Group
 */
export function createPieChart(config = {}) {
  const {
    data = [
      { label: 'Sales', value: 40 },
      { label: 'Marketing', value: 25 },
      { label: 'Dev', value: 20 },
      { label: 'Support', value: 15 }
    ],
    width = 300,
    height = 300,
    colors = DEFAULT_COLORS,
    title = 'Pie Chart',
    showLabels = true,
    showPercentages = true,
    showLegend = true,
    donut = false,
    donutRatio = 0.5,
    backgroundColor = '#ffffff',
    borderColor = '#e5e5e5',
    titleColor = '#333333',
    labelColor = '#666666'
  } = config;

  const objects = [];
  const centerX = width / 2;
  const centerY = title ? (height - 30) / 2 + 40 : height / 2;
  const radius = Math.min(width, height) / 2 - (showLegend ? 60 : 30);
  const innerRadius = donut ? radius * donutRatio : 0;

  // Background
  const bg = new Rect({
    left: 0,
    top: 0,
    width,
    height,
    fill: backgroundColor,
    stroke: borderColor,
    strokeWidth: 1,
    rx: 8,
    ry: 8
  });
  objects.push(bg);

  // Title
  if (title) {
    const titleText = new IText(title, {
      left: width / 2,
      top: 20,
      fontSize: 16,
      fontWeight: 'bold',
      fill: titleColor,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Inter, system-ui, sans-serif'
    });
    objects.push(titleText);
  }

  // Calculate total and angles
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -Math.PI / 2; // Start at top

  // Draw pie segments
  data.forEach((item, index) => {
    const sliceAngle = (item.value / total) * Math.PI * 2;
    const endAngle = currentAngle + sliceAngle;

    // Create pie slice path
    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const x1 = centerX + radius * Math.cos(currentAngle);
    const y1 = centerY + radius * Math.sin(currentAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    let pathData;
    if (donut) {
      const ix1 = centerX + innerRadius * Math.cos(currentAngle);
      const iy1 = centerY + innerRadius * Math.sin(currentAngle);
      const ix2 = centerX + innerRadius * Math.cos(endAngle);
      const iy2 = centerY + innerRadius * Math.sin(endAngle);
      pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
    } else {
      pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }

    const slice = new Path(pathData, {
      fill: colors[index % colors.length],
      stroke: '#ffffff',
      strokeWidth: 2
    });
    objects.push(slice);

    // Label on slice
    if (showPercentages) {
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelRadius = donut ? (radius + innerRadius) / 2 : radius * 0.65;
      const lx = centerX + labelRadius * Math.cos(labelAngle);
      const ly = centerY + labelRadius * Math.sin(labelAngle);
      const percentage = Math.round((item.value / total) * 100);

      if (percentage >= 5) { // Only show if segment is large enough
        const pctLabel = new IText(`${percentage}%`, {
          left: lx,
          top: ly,
          fontSize: 12,
          fontWeight: 'bold',
          fill: '#ffffff',
          originX: 'center',
          originY: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        });
        objects.push(pctLabel);
      }
    }

    currentAngle = endAngle;
  });

  // Legend
  if (showLegend) {
    const legendY = height - 25;
    const legendWidth = width - 40;
    const itemWidth = legendWidth / data.length;

    data.forEach((item, index) => {
      const x = 20 + index * itemWidth;

      const colorBox = new Rect({
        left: x,
        top: legendY - 5,
        width: 10,
        height: 10,
        fill: colors[index % colors.length],
        rx: 2,
        ry: 2
      });
      objects.push(colorBox);

      const legendLabel = new IText(item.label, {
        left: x + 14,
        top: legendY,
        fontSize: 10,
        fill: labelColor,
        originX: 'left',
        originY: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      });
      objects.push(legendLabel);
    });
  }

  const group = new Group(objects, {
    left: 0,
    top: 0
  });

  group.set('chartType', donut ? 'donut' : 'pie');
  group.set('chartData', data);
  group.set('chartConfig', config);
  group.set('isChart', true);
  group.set('name', donut ? 'Donut Chart' : 'Pie Chart');
  group.set('id', generateId());

  return group;
}

/**
 * Create a horizontal bar chart
 */
export function createHorizontalBarChart(config = {}) {
  const {
    data = [
      { label: 'Product A', value: 75 },
      { label: 'Product B', value: 60 },
      { label: 'Product C', value: 45 },
      { label: 'Product D', value: 90 }
    ],
    width = 400,
    height = 250,
    colors = DEFAULT_COLORS,
    title = 'Horizontal Bar Chart',
    showValues = true,
    backgroundColor = '#ffffff',
    borderColor = '#e5e5e5',
    titleColor = '#333333',
    labelColor = '#666666'
  } = config;

  const objects = [];
  const padding = { top: 50, right: 50, bottom: 20, left: 100 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Background
  const bg = new Rect({
    left: 0,
    top: 0,
    width,
    height,
    fill: backgroundColor,
    stroke: borderColor,
    strokeWidth: 1,
    rx: 8,
    ry: 8
  });
  objects.push(bg);

  // Title
  if (title) {
    const titleText = new IText(title, {
      left: width / 2,
      top: 20,
      fontSize: 16,
      fontWeight: 'bold',
      fill: titleColor,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Inter, system-ui, sans-serif'
    });
    objects.push(titleText);
  }

  const maxValue = Math.max(...data.map(d => d.value)) * 1.1;
  const barHeight = (chartHeight / data.length) * 0.7;
  const barGap = (chartHeight / data.length) * 0.3;

  data.forEach((item, index) => {
    const barWidth = (item.value / maxValue) * chartWidth;
    const y = padding.top + index * (barHeight + barGap);
    const x = padding.left;

    // Label
    const label = new IText(item.label, {
      left: padding.left - 10,
      top: y + barHeight / 2,
      fontSize: 11,
      fill: labelColor,
      originX: 'right',
      originY: 'center',
      fontFamily: 'Inter, system-ui, sans-serif'
    });
    objects.push(label);

    // Bar
    const bar = new Rect({
      left: x,
      top: y,
      width: barWidth,
      height: barHeight,
      fill: colors[index % colors.length],
      rx: 4,
      ry: 4
    });
    objects.push(bar);

    // Value
    if (showValues) {
      const valueLabel = new IText(item.value.toString(), {
        left: x + barWidth + 8,
        top: y + barHeight / 2,
        fontSize: 11,
        fontWeight: '600',
        fill: titleColor,
        originX: 'left',
        originY: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      });
      objects.push(valueLabel);
    }
  });

  const group = new Group(objects, {
    left: 0,
    top: 0
  });

  group.set('chartType', 'horizontal-bar');
  group.set('chartData', data);
  group.set('chartConfig', config);
  group.set('isChart', true);
  group.set('name', 'Horizontal Bar Chart');
  group.set('id', generateId());

  return group;
}

/**
 * Update chart with new data
 * Recreates the chart group with new data while preserving position/scale
 */
export function updateChartData(chart, newData) {
  if (!chart || !chart.isChart) return chart;

  const config = { ...chart.chartConfig, data: newData };
  const position = {
    left: chart.left,
    top: chart.top,
    scaleX: chart.scaleX,
    scaleY: chart.scaleY,
    angle: chart.angle
  };

  let newChart;
  switch (chart.chartType) {
    case 'bar':
      newChart = createBarChart(config);
      break;
    case 'line':
      newChart = createLineChart(config);
      break;
    case 'pie':
    case 'donut':
      newChart = createPieChart({ ...config, donut: chart.chartType === 'donut' });
      break;
    case 'horizontal-bar':
      newChart = createHorizontalBarChart(config);
      break;
    default:
      return chart;
  }

  newChart.set(position);
  return newChart;
}

export const chartTypes = [
  { type: 'bar', name: 'Bar Chart', icon: 'fa-chart-bar' },
  { type: 'line', name: 'Line Chart', icon: 'fa-chart-line' },
  { type: 'pie', name: 'Pie Chart', icon: 'fa-chart-pie' },
  { type: 'donut', name: 'Donut Chart', icon: 'fa-circle-notch' },
  { type: 'horizontal-bar', name: 'Horizontal Bar', icon: 'fa-chart-bar fa-rotate-90' }
];

export const DEFAULT_CHART_DATA = {
  bar: [
    { label: 'Jan', value: 30 },
    { label: 'Feb', value: 45 },
    { label: 'Mar', value: 60 },
    { label: 'Apr', value: 35 },
    { label: 'May', value: 55 }
  ],
  line: [
    { label: 'Mon', value: 20 },
    { label: 'Tue', value: 35 },
    { label: 'Wed', value: 25 },
    { label: 'Thu', value: 50 },
    { label: 'Fri', value: 45 }
  ],
  pie: [
    { label: 'Sales', value: 40 },
    { label: 'Marketing', value: 25 },
    { label: 'Dev', value: 20 },
    { label: 'Support', value: 15 }
  ],
  donut: [
    { label: 'Complete', value: 70 },
    { label: 'In Progress', value: 20 },
    { label: 'Pending', value: 10 }
  ],
  'horizontal-bar': [
    { label: 'Product A', value: 75 },
    { label: 'Product B', value: 60 },
    { label: 'Product C', value: 45 },
    { label: 'Product D', value: 90 }
  ]
};

