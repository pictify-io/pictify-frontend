// FabricJS starter templates for automation recipe use cases
// These templates open in the Canvas Editor when users click on a workflow

const ICONS = {
	// Navigation & Actions
	ROCKET: 'M12 2.5c-4.42 0-8 3.58-8 8 0 1.84.63 3.54 1.68 4.9L4.6 18.1l2.83 2.83 2.7-1.08c1.36 1.05 3.06 1.68 4.9 1.68 4.42 0 8-3.58 8-8s-3.58-8-8-8zm0 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-4.5h-3v-6h3v6z',
	STAR: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
	SPARKLE: 'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zm6 12l.75 2.25L21 18l-2.25.75L18 21l-.75-2.25L15 18l2.25-.75L18 15zM6 15l.75 2.25L9 18l-2.25.75L6 21l-.75-2.25L3 18l2.25-.75L6 15z',
	
	// Status & Communication
	BUG: 'M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z',
	WRENCH: 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
	CHECK: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z',
	WARNING: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
	
	// Achievement & Rankings
	MEDAL: 'M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6L12 2z',
	TROPHY: 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z',
	GOLD_MEDAL: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
	SILVER_MEDAL: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v-2h-2v2zm2-3V9h-2v4h2z',
	BRONZE_MEDAL: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-11h-2v6h2V9zm0 8h-2v2h2v-2z',
	
	// People & Users
	USER: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
	WAVE: 'M7.5 5.6L10 7 8.6 4.5l1.9-4.4-4.4 1.9L3.6 0l1.4 2.5L3.1 6.9l4.4-1.3zM19.5 12.4L22 11l-2.5-1.4.3-2.9-2.9.3L15.5 5l-1.4 2.5-2.9-.3.3 2.9L10 11l2.5 1.4-.3 2.9 2.9-.3L16.5 17l1.4-2.5 2.9.3-.3-2.9zM22 19l-2.5 1.4.3 2.9-2.9-.3L15.5 25l-1.4-2.5L11.2 23l.3-2.9L9 18.6l2.5-1.4-.3-2.9 2.9.3 1.4-2.5 1.4 2.5 2.9-.3-.3 2.9L22 19z',
	
	// Location & Navigation
	PIN: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
	MAP: 'M20.5 3l-6 2-6-2-6 2v15l6-2 6 2 6-2V3zm-6.05 15.06l-5.95 1.98v-13l5.95-1.98 5.55 1.85v13.06l-5.55-1.91z',
	
	// Business & Finance
	DOLLAR: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z',
	BRIEFCASE: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z',
	BUILDING: 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z',
	CHART: 'M3 13h2v8H3v-8zm4-5h2v13H7V8zm4-5h2v18h-2V3zm4 9h2v9h-2v-9zm4-4h2v13h-2V8z',
	
	// Social & Engagement
	HEART: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
	RETWEET: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z',
	COMMENT: 'M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z',
	
	// Calendar & Time
	CALENDAR: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z',
	
	// Media & Content
	VIDEO: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
	LIVE: 'M12 12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm8-4c0-4.42-3.58-8-8-8s-8 3.58-8 8c0 .98.18 1.92.5 2.78l1.83-.64C6.11 15.45 6 14.74 6 14c0-3.31 2.69-6 6-6s6 2.69 6 6c0 .74-.11 1.45-.33 2.14l1.83.64c.32-.86.5-1.8.5-2.78z',
	
	// Events & Tickets
	TICKET: 'M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46 0-1.48-.8-2.77-1.99-3.46L4 6h16v2.54z',
	QR_CODE: 'M3 11h2v2H3v-2zm4-8h2v2H7V3zm0 4h2v2H7V7zm-4 0h2v2H3V7zM19 3h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm-4-8h2v2h-2V3zm-4 8h2v2h-2v-2zm0 4h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm0-4h2v2h-2v-2zm-4 0h2v2h-2v-2zm-4-4h2v2h-2V7zm8 0h2v2h-2V7zM3 3h2v2H3V3zm0 16h2v2H3v-2zm4 0h2v2H7v-2zm8 0h2v2h-2v-2zm4 0h2v2h-2v-2z',
	
	// Misc
	BOX: 'M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15zM5 15.91l6 3.38v-6.71L5 9.21v6.7z',
	MOON: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z',
	CELEBRATION: 'M2 22l14-5-9-9-5 14zm10.22-4.56l-4.43 1.58 1.58-4.43 2.85 2.85zM14.99 3.5L16 2.5l1.01 1 1.99-1L18 5.5l1 1.99-2.99-1-1.01 1L14 5.5l1.99-1-1-1.99zM21 8l-1.51 3L17 9.99l3-1.51L18.49 5.5l3 1.49L23 5.5l-1.51 3 3 1.49-3 1.51L23 14l-3-1.51L18.49 15.5l1.49-3-1.99-2.99L21 8zM7 9L5.49 12 3 10.49 5.01 7.5 3 4.51 6.01 6l1 .99L9.99 5 8.51 8 10 9l-3 .01z',
	LIGHTNING: 'M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z',
	ARROW_UP: 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z'
};

/**
 * Generate a unique ID for FabricJS objects
 * @returns {string} Unique ID
 */
function generateId() {
	return Math.random().toString(36).substring(2, 9);
}

/**
 * Base template structure with common elements
 */
function createBaseTemplate(config) {
	const {
		width = 1200,
		height = 630,
		backgroundColor = '#FFFDF8',
		badgeText = 'TEMPLATE',
		badgeColor = '#ff6b6b',
		title = 'Your Title Here',
		subtitle = 'Add your subtitle or description',
		titleVariable = 'title',
		subtitleVariable = 'subtitle'
	} = config;

	return {
		version: '6.0.0',
		objects: [
			// Background rectangle
			{
				type: 'rect',
				id: generateId(),
				left: 0,
				top: 0,
				width: width,
				height: height,
				fill: backgroundColor,
				selectable: false,
				evented: false
			},
			// Decorative border/card
			{
				type: 'rect',
				id: generateId(),
				left: 40,
				top: 40,
				width: width - 80,
				height: height - 80,
				fill: '#ffffff',
				stroke: '#1f2937',
				strokeWidth: 3,
				rx: 24,
				ry: 24,
				shadow: {
					color: '#1f2937',
					blur: 0,
					offsetX: 8,
					offsetY: 8
				}
			},
			// Badge
			{
				type: 'rect',
				id: generateId(),
				left: 80,
				top: 80,
				width: 120,
				height: 32,
				fill: badgeColor,
				stroke: '#1f2937',
				strokeWidth: 2,
				rx: 16,
				ry: 16
			},
			// Badge text
			{
				type: 'textbox',
				id: generateId(),
				left: 85,
				top: 85,
				width: 110,
				text: badgeText,
				fontSize: 12,
				fontWeight: 'bold',
				fontFamily: 'Inter',
				fill: '#ffffff',
				textAlign: 'center',
				selectable: true
			},
			// Title text (variable)
			{
				type: 'textbox',
				id: generateId(),
				left: 80,
				top: 140,
				width: width - 160,
				text: title,
				fontSize: 48,
				fontWeight: 'bold',
				fontFamily: 'Inter',
				fill: '#1f2937',
				isVariable: true,
				variableBindings: [
					{
						variableName: titleVariable,
						property: 'text',
						description: 'Main title text'
					}
				]
			},
			// Subtitle text (variable)
			{
				type: 'textbox',
				id: generateId(),
				left: 80,
				top: 210,
				width: width - 160,
				text: subtitle,
				fontSize: 20,
				fontWeight: 'normal',
				fontFamily: 'Inter',
				fill: '#6b7280',
				isVariable: true,
				variableBindings: [
					{
						variableName: subtitleVariable,
						property: 'text',
						description: 'Subtitle or description text'
					}
				]
			}
		],
		background: backgroundColor
	};
}

/**
 * Certificate template - formal, elegant design
 */
export function getCertificateTemplate() {
	return {
		name: 'Certificate Template',
		type: 'certificate',
		width: 1920,
		height: 1080,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Cream background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1920,
					height: 1080,
					fill: '#fefbf0',
					selectable: false,
					evented: false
				},
				// Decorative border
				{
					type: 'rect',
					id: generateId(),
					left: 60,
					top: 60,
					width: 1800,
					height: 960,
					fill: '#ffffff',
					stroke: '#c8a76b',
					strokeWidth: 6,
					rx: 24,
					ry: 24
				},
				// Inner decorative border
				{
					type: 'rect',
					id: generateId(),
					left: 90,
					top: 90,
					width: 1740,
					height: 900,
					fill: 'transparent',
					stroke: '#c8a76b',
					strokeWidth: 2,
					strokeDashArray: [10, 5],
					rx: 18,
					ry: 18
				},
				// Certificate title
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 140,
					width: 1680,
					text: 'CERTIFICATE OF ACHIEVEMENT',
					fontSize: 24,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#3b2f21',
					textAlign: 'center',
					letterSpacing: 400
				},
				// Organization name
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 200,
					width: 1680,
					text: 'Your Organization Name',
					fontSize: 56,
					fontWeight: 'bold',
					fontFamily: 'Georgia',
					fill: '#3b2f21',
					textAlign: 'center',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'organizationName',
							property: 'text',
							description: 'Name of the organization'
						}
					]
				},
				// "This certifies that" text
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 320,
					width: 1680,
					text: 'This certificate is proudly presented to',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b5b47',
					textAlign: 'center'
				},
				// Recipient name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 380,
					width: 1680,
					text: 'Recipient Name',
					fontSize: 64,
					fontWeight: 'bold',
					fontFamily: 'Georgia',
					fill: '#3b2f21',
					textAlign: 'center',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'recipientName',
							property: 'text',
							description: 'Name of the certificate recipient'
						}
					]
				},
				// Achievement text
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 500,
					width: 1520,
					text: 'for successfully completing the program on',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b5b47',
					textAlign: 'center'
				},
				// Date (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 550,
					width: 1520,
					text: 'December 14, 2024',
					fontSize: 28,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#3b2f21',
					textAlign: 'center',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'date',
							property: 'text',
							description: 'Date of certificate issuance'
						}
					]
				},
				// Signature line 1
				{
					type: 'line',
					id: generateId(),
					left: 300,
					top: 800,
					x1: 0,
					y1: 0,
					x2: 300,
					y2: 0,
					stroke: '#3b2f21',
					strokeWidth: 2
				},
				// Signature label 1
				{
					type: 'textbox',
					id: generateId(),
					left: 300,
					top: 810,
					width: 300,
					text: 'Instructor',
					fontSize: 16,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b5b47',
					textAlign: 'center'
				},
				// Signature line 2
				{
					type: 'line',
					id: generateId(),
					left: 1320,
					top: 800,
					x1: 0,
					y1: 0,
					x2: 300,
					y2: 0,
					stroke: '#3b2f21',
					strokeWidth: 2
				},
				// Signature label 2
				{
					type: 'textbox',
					id: generateId(),
					left: 1320,
					top: 810,
					width: 300,
					text: 'Program Director',
					fontSize: 16,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b5b47',
					textAlign: 'center'
				}
			],
			background: '#fefbf0'
		}
	};
}

/**
 * Badge/Achievement template
 */
export function getBadgeTemplate() {
	return {
		name: 'Badge Template',
		type: 'badge',
		width: 1080,
		height: 1080,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1080,
					height: 1080,
					fill: '#f0fdf4',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 920,
					height: 920,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 32,
					ry: 32,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 12,
						offsetY: 12
					}
				},
				// Badge circle background
				{
					type: 'circle',
					id: generateId(),
					left: 340,
					top: 180,
					radius: 200,
					fill: '#4ade80',
					stroke: '#1f2937',
					strokeWidth: 4
				},
				// Inner circle
				{
					type: 'circle',
					id: generateId(),
					left: 370,
					top: 210,
					radius: 170,
					fill: '#ffffff',
					stroke: '#4ade80',
					strokeWidth: 3
				},
				// Achievement icon (star)
				{
					type: 'path',
					id: generateId(),
					left: 490,
					top: 300,
					path: ICONS.STAR,
					fill: '#fbbf24',
					stroke: '#1f2937',
					strokeWidth: 1,
					scaleX: 4,
					scaleY: 4
				},
				// Badge label
				{
					type: 'rect',
					id: generateId(),
					left: 340,
					top: 600,
					width: 400,
					height: 48,
					fill: '#4ade80',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 24,
					ry: 24
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 340,
					top: 610,
					width: 400,
					text: 'ACHIEVEMENT',
					fontSize: 18,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				},
				// Badge name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 680,
					width: 840,
					text: 'Badge Name',
					fontSize: 48,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					textAlign: 'center',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'badgeName',
							property: 'text',
							description: 'Name of the badge/achievement'
						}
					]
				},
				// User name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 760,
					width: 840,
					text: 'Awarded to: User Name',
					fontSize: 24,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					textAlign: 'center',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'userName',
							property: 'text',
							description: 'Name of the user receiving the badge'
						}
					]
				},
				// Date (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 820,
					width: 840,
					text: 'December 2024',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#9ca3af',
					textAlign: 'center',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'date',
							property: 'text',
							description: 'Date of achievement'
						}
					]
				}
			],
			background: '#f0fdf4'
		}
	};
}

/**
 * Quote Card template
 */
export function getQuoteCardTemplate() {
	return {
		name: 'Quote Card Template',
		type: 'social-media',
		width: 1080,
		height: 1080,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1080,
					height: 1080,
					fill: '#fff7ed',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 60,
					top: 60,
					width: 960,
					height: 960,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 10,
						offsetY: 10
					}
				},
				// Quote badge
				{
					type: 'rect',
					id: generateId(),
					left: 100,
					top: 100,
					width: 100,
					height: 36,
					fill: '#ff6b6b',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 105,
					top: 107,
					width: 90,
					text: 'QUOTE',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				},
				// Opening quote mark
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 180,
					width: 100,
					text: '"',
					fontSize: 120,
					fontWeight: 'bold',
					fontFamily: 'Georgia',
					fill: '#ff6b6b',
					opacity: 0.3
				},
				// Quote text (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 100,
					top: 280,
					width: 880,
					text: 'Your inspiring quote goes here. Make it memorable and impactful.',
					fontSize: 42,
					fontWeight: 'normal',
					fontFamily: 'Georgia',
					fill: '#1f2937',
					lineHeight: 1.4,
					isVariable: true,
					variableBindings: [
						{
							variableName: 'quote',
							property: 'text',
							description: 'The quote text'
						}
					]
				},
				// Divider line
				{
					type: 'line',
					id: generateId(),
					left: 100,
					top: 750,
					x1: 0,
					y1: 0,
					x2: 880,
					y2: 0,
					stroke: '#e5e7eb',
					strokeWidth: 2
				},
				// Author name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 100,
					top: 790,
					width: 600,
					text: '— Author Name',
					fontSize: 28,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'author',
							property: 'text',
							description: 'Name of the quote author'
						}
					]
				},
				// Company/Role (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 100,
					top: 840,
					width: 600,
					text: 'Company or Role',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'company',
							property: 'text',
							description: 'Company or role of the author'
						}
					]
				}
			],
			background: '#fff7ed'
		}
	};
}

/**
 * Tweet Card template
 */
export function getTweetCardTemplate() {
	return {
		name: 'Tweet Card Template',
		type: 'social-media',
		width: 1200,
		height: 675,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 675,
					fill: '#f0f9ff',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 50,
					top: 50,
					width: 1100,
					height: 575,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 20,
					ry: 20,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 8,
						offsetY: 8
					}
				},
				// Tweet badge
				{
					type: 'rect',
					id: generateId(),
					left: 90,
					top: 90,
					width: 100,
					height: 36,
					fill: '#0ea5e9',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 95,
					top: 97,
					width: 90,
					text: 'TWEET',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				},
				// Avatar placeholder
				{
					type: 'circle',
					id: generateId(),
					left: 90,
					top: 160,
					radius: 32,
					fill: '#0ea5e9',
					stroke: '#1f2937',
					strokeWidth: 2
				},
				// Handle (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 170,
					top: 165,
					width: 400,
					text: '@yourhandle',
					fontSize: 20,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'handle',
							property: 'text',
							description: 'Twitter/X handle'
						}
					]
				},
				// Date
				{
					type: 'textbox',
					id: generateId(),
					left: 170,
					top: 195,
					width: 400,
					text: 'Dec 14, 2024',
					fontSize: 16,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'date',
							property: 'text',
							description: 'Date of the tweet'
						}
					]
				},
				// Tweet text (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 90,
					top: 270,
					width: 1020,
					text: 'Your tweet content goes here. Share your thoughts, announcements, or insights with the world!',
					fontSize: 32,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#1f2937',
					lineHeight: 1.4,
					isVariable: true,
					variableBindings: [
						{
							variableName: 'tweetText',
							property: 'text',
							description: 'The tweet content'
						}
					]
				},
				// Engagement stats row - Heart icon
				{
					type: 'path',
					id: generateId(),
					left: 90,
					top: 518,
					path: ICONS.HEART,
					fill: '#ef4444',
					scaleX: 0.9,
					scaleY: 0.9
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 118,
					top: 520,
					width: 80,
					text: '1.2K',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280'
				},
				// Retweet icon
				{
					type: 'path',
					id: generateId(),
					left: 210,
					top: 518,
					path: ICONS.RETWEET,
					fill: '#22c55e',
					scaleX: 0.9,
					scaleY: 0.9
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 238,
					top: 520,
					width: 80,
					text: '345',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280'
				},
				// Comment icon
				{
					type: 'path',
					id: generateId(),
					left: 320,
					top: 518,
					path: ICONS.COMMENT,
					fill: '#3b82f6',
					scaleX: 0.9,
					scaleY: 0.9
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 348,
					top: 520,
					width: 80,
					text: '89',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280'
				}
			],
			background: '#f0f9ff'
		}
	};
}

/**
 * Product Banner template - professional promotional design
 */
export function getProductBannerTemplate() {
	return {
		name: 'Product Banner Template',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 630,
					fill: '#faf5ff',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 1120,
					height: 550,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 8,
						offsetY: 8
					}
				},
				// Decorative accent bar
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 12,
					height: 550,
					fill: '#a855f7',
					rx: 6,
					ry: 6
				},
				// Promo badge
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 100,
					height: 36,
					fill: '#a855f7',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 85,
					top: 87,
					width: 90,
					text: 'PROMO',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				},
				// Product image placeholder
				{
					type: 'rect',
					id: generateId(),
					left: 720,
					top: 100,
					width: 400,
					height: 400,
					fill: '#f3e8ff',
					stroke: '#a855f7',
					strokeWidth: 3,
					rx: 20,
					ry: 20
				},
				// 1st Place Medal
				{
					type: 'path',
					id: generateId(),
					left: 80,
					top: 172,
					path: ICONS.MEDAL,
					fill: '#fbbf24', // yellow-400
					scaleX: 1,
					scaleY: 1
				},
				// Product Name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 150,
					width: 600,
					text: 'Product Name',
					fontSize: 52,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'productName',
							property: 'text',
							description: 'Name of the product'
						}
					]
				},
				// Tagline (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 220,
					width: 600,
					text: 'Your compelling tagline goes here',
					fontSize: 24,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					lineHeight: 1.4,
					isVariable: true,
					variableBindings: [
						{
							variableName: 'tagline',
							property: 'text',
							description: 'Product tagline or description'
						}
					]
				},
				// Price tag background
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 320,
					width: 200,
					height: 60,
					fill: '#a855f7',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 12,
					ry: 12,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 4,
						offsetY: 4
					}
				},
				// Price (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 330,
					width: 200,
					text: '$99',
					fontSize: 32,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'price',
							property: 'text',
							description: 'Product price'
						}
					]
				},
				// CTA Button background
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 420,
					width: 280,
					height: 60,
					fill: '#1f2937',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 12,
					ry: 12,
					shadow: {
						color: '#a855f7',
						blur: 0,
						offsetX: 4,
						offsetY: 4
					}
				},
				// CTA Text (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 432,
					width: 280,
					text: 'Shop Now →',
					fontSize: 22,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'ctaText',
							property: 'text',
							description: 'Call to action button text'
						}
					]
				},
				// Feature pills row
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 510,
					width: 140,
					height: 36,
					fill: '#f3e8ff',
					stroke: '#a855f7',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 517,
					width: 140,
					text: '✓ Free shipping',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#7c3aed',
					textAlign: 'center'
				},
				{
					type: 'rect',
					id: generateId(),
					left: 240,
					top: 510,
					width: 140,
					height: 36,
					fill: '#f3e8ff',
					stroke: '#a855f7',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 240,
					top: 517,
					width: 140,
					text: '✓ 30-day return',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#7c3aed',
					textAlign: 'center'
				},
				{
					type: 'rect',
					id: generateId(),
					left: 400,
					top: 510,
					width: 140,
					height: 36,
					fill: '#f3e8ff',
					stroke: '#a855f7',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 400,
					top: 517,
					width: 140,
					text: '✓ 2-year warranty',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#7c3aed',
					textAlign: 'center'
				}
			],
			background: '#faf5ff'
		}
	};
}

/**
 * Pricing Card template - professional pricing display
 */
export function getPricingCardTemplate() {
	return {
		name: 'Pricing Card Template',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 630,
					fill: '#fffbeb',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 1120,
					height: 550,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 8,
						offsetY: 8
					}
				},
				// Popular badge (top right)
				{
					type: 'rect',
					id: generateId(),
					left: 940,
					top: 60,
					width: 180,
					height: 40,
					fill: '#f59e0b',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 20,
					ry: 20
				},
				{
					type: 'path',
					id: generateId(),
					left: 958,
					top: 68,
					path: ICONS.STAR,
					fill: '#ffffff',
					scaleX: 0.8,
					scaleY: 0.8
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 985,
					top: 68,
					width: 130,
					text: 'MOST POPULAR',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'left'
				},
				// Plan name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 80,
					width: 500,
					text: 'Pro Plan',
					fontSize: 48,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'planName',
							property: 'text',
							description: 'Name of the pricing plan'
						}
					]
				},
				// Price section
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 160,
					width: 300,
					height: 100,
					fill: '#fef3c7',
					stroke: '#f59e0b',
					strokeWidth: 3,
					rx: 16,
					ry: 16
				},
				// Price (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 100,
					top: 175,
					width: 260,
					text: '$99',
					fontSize: 56,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'price',
							property: 'text',
							description: 'Plan price'
						}
					]
				},
				// Per month text
				{
					type: 'textbox',
					id: generateId(),
					left: 100,
					top: 230,
					width: 260,
					text: '/month',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280'
				},
				// Features section title
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 290,
					width: 400,
					text: "What's included:",
					fontSize: 20,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937'
				},
				// Feature 1 (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 330,
					width: 450,
					text: '✓ Unlimited projects',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#374151',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'feature1',
							property: 'text',
							description: 'First feature'
						}
					]
				},
				// Feature 2 (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 370,
					width: 450,
					text: '✓ Priority support',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#374151',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'feature2',
							property: 'text',
							description: 'Second feature'
						}
					]
				},
				// Feature 3 (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 410,
					width: 450,
					text: '✓ Advanced analytics',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#374151',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'feature3',
							property: 'text',
							description: 'Third feature'
						}
					]
				},
				// Feature 4 (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 450,
					width: 450,
					text: '✓ Team collaboration',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#374151',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'feature4',
							property: 'text',
							description: 'Fourth feature'
						}
					]
				},
				// CTA Button
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 510,
					width: 280,
					height: 56,
					fill: '#f59e0b',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 12,
					ry: 12,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 4,
						offsetY: 4
					}
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 522,
					width: 280,
					text: 'Get Started →',
					fontSize: 20,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				},
				// Right side decorative element
				{
					type: 'rect',
					id: generateId(),
					left: 600,
					top: 120,
					width: 500,
					height: 400,
					fill: '#fef3c7',
					stroke: '#f59e0b',
					strokeWidth: 3,
					rx: 24,
					ry: 24
				},
				// Decorative circles
				{
					type: 'circle',
					id: generateId(),
					left: 720,
					top: 200,
					radius: 80,
					fill: '#fcd34d',
					stroke: '#1f2937',
					strokeWidth: 3
				},
				{
					type: 'circle',
					id: generateId(),
					left: 850,
					top: 280,
					radius: 100,
					fill: '#fbbf24',
					stroke: '#1f2937',
					strokeWidth: 3
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 650,
					top: 420,
					width: 400,
					text: 'Best value for teams',
					fontSize: 24,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#92400e',
					textAlign: 'center'
				}
			],
			background: '#fffbeb'
		}
	};
}

/**
 * Changelog Card template - release announcement design
 */
export function getChangelogCardTemplate() {
	return {
		name: 'Changelog Card Template',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 630,
					fill: '#f0fdf4',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 1120,
					height: 550,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 8,
						offsetY: 8
					}
				},
				// Green accent bar left
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 12,
					height: 550,
					fill: '#22c55e',
					rx: 6,
					ry: 6
				},
				// Changelog badge
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 160,
					height: 36,
					fill: '#22c55e',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'path',
					id: generateId(),
					left: 95,
					top: 87,
					path: ICONS.ROCKET,
					fill: '#ffffff',
					scaleX: 0.75,
					scaleY: 0.75
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 118,
					top: 87,
					width: 115,
					text: 'CHANGELOG',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'left'
				},
				// Version badge (variable)
				{
					type: 'rect',
					id: generateId(),
					left: 240,
					top: 80,
					width: 120,
					height: 36,
					fill: '#dcfce7',
					stroke: '#22c55e',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 240,
					top: 87,
					width: 120,
					text: 'v2.0.0',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#166534',
					textAlign: 'center',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'version',
							property: 'text',
							description: 'Version number'
						}
					]
				},
				// Headline (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 150,
					width: 700,
					text: 'Major Release: New Features',
					fontSize: 48,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'headline',
							property: 'text',
							description: 'Release headline'
						}
					]
				},
				// Date (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 220,
					width: 400,
					text: 'December 14, 2024',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'date',
							property: 'text',
							description: 'Release date'
						}
					]
				},
				// Changes section
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 280,
					width: 600,
					text: "What's new:",
					fontSize: 18,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#374151'
				},
				// Change 1 (variable)
				{
					type: 'path',
					id: generateId(),
					left: 80,
					top: 320,
					path: ICONS.SPARKLE,
					fill: '#fbbf24',
					scaleX: 0.85,
					scaleY: 0.85
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 110,
					top: 320,
					width: 570,
					text: 'New dashboard with improved analytics',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#374151',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'change1',
							property: 'text',
							description: 'First change'
						}
					]
				},
				// Change 2 (variable)
				{
					type: 'path',
					id: generateId(),
					left: 80,
					top: 360,
					path: ICONS.LIGHTNING,
					fill: '#f59e0b',
					scaleX: 0.85,
					scaleY: 0.85
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 110,
					top: 360,
					width: 570,
					text: '2x faster rendering performance',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#374151',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'change2',
							property: 'text',
							description: 'Second change'
						}
					]
				},
				// Change 3 (variable)
				{
					type: 'path',
					id: generateId(),
					left: 80,
					top: 400,
					path: ICONS.BUG,
					fill: '#22c55e',
					scaleX: 0.85,
					scaleY: 0.85
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 110,
					top: 400,
					width: 570,
					text: 'Bug fixes and stability improvements',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#374151',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'change3',
							property: 'text',
							description: 'Third change'
						}
					]
				},
				// Read more link
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 470,
					width: 200,
					height: 50,
					fill: '#22c55e',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 12,
					ry: 12,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 4,
						offsetY: 4
					}
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 482,
					width: 200,
					text: 'Read More →',
					fontSize: 18,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				},
				// Right side decoration
				{
					type: 'rect',
					id: generateId(),
					left: 800,
					top: 100,
					width: 320,
					height: 420,
					fill: '#dcfce7',
					stroke: '#22c55e',
					strokeWidth: 3,
					rx: 24,
					ry: 24
				},
				// Decorative elements
				{
					type: 'circle',
					id: generateId(),
					left: 880,
					top: 180,
					radius: 60,
					fill: '#86efac',
					stroke: '#1f2937',
					strokeWidth: 3
				},
				{
					type: 'circle',
					id: generateId(),
					left: 940,
					top: 300,
					radius: 80,
					fill: '#4ade80',
					stroke: '#1f2937',
					strokeWidth: 3
				},
				{
					type: 'path',
					id: generateId(),
					left: 920,
					top: 420,
					path: ICONS.CELEBRATION,
					fill: '#22c55e',
					scaleX: 3.5,
					scaleY: 3.5
				}
			],
			background: '#f0fdf4'
		}
	};
}

/**
 * Testimonial Card template
 */
export function getTestimonialTemplate() {
	return {
		name: 'Testimonial Card Template',
		type: 'social-media',
		width: 1080,
		height: 1080,
		fabricJSData: getQuoteCardTemplate().fabricJSData // Reuse quote template
	};
}

/**
 * Receipt template
 */
export function getReceiptTemplate() {
	return {
		name: 'Receipt Template',
		type: 'invoice',
		width: 800,
		height: 1200,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 800,
					height: 1200,
					fill: '#f8fafc',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 720,
					height: 1120,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 16,
					ry: 16,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 8,
						offsetY: 8
					}
				},
				// Receipt badge
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 100,
					height: 36,
					fill: '#1f2937',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 82,
					top: 87,
					width: 96,
					text: 'RECEIPT',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				},
				// Order ID (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 150,
					width: 640,
					text: 'Order #12345',
					fontSize: 32,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'orderId',
							property: 'text',
							description: 'Order ID'
						}
					]
				},
				// Store name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 200,
					width: 640,
					text: 'Store Name',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'storeName',
							property: 'text',
							description: 'Name of the store'
						}
					]
				},
				// Divider
				{
					type: 'line',
					id: generateId(),
					left: 80,
					top: 280,
					x1: 0,
					y1: 0,
					x2: 640,
					y2: 0,
					stroke: '#e5e7eb',
					strokeWidth: 2,
					strokeDashArray: [8, 4]
				},
				// Items header
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 320,
					width: 400,
					text: 'Item',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#9ca3af'
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 520,
					top: 320,
					width: 200,
					text: 'Amount',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#9ca3af',
					textAlign: 'right'
				},
				// Sample item row
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 360,
					width: 400,
					text: 'Product Name × 1',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#1f2937'
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 520,
					top: 360,
					width: 200,
					text: '$99.00',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#1f2937',
					textAlign: 'right'
				},
				// Total divider
				{
					type: 'line',
					id: generateId(),
					left: 80,
					top: 900,
					x1: 0,
					y1: 0,
					x2: 640,
					y2: 0,
					stroke: '#1f2937',
					strokeWidth: 2
				},
				// Total label
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 940,
					width: 300,
					text: 'Total',
					fontSize: 24,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937'
				},
				// Total amount (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 420,
					top: 940,
					width: 300,
					text: '$99.00',
					fontSize: 32,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					textAlign: 'right',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'total',
							property: 'text',
							description: 'Total amount'
						}
					]
				},
				// Date (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 1040,
					width: 640,
					text: 'December 14, 2024',
					fontSize: 16,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#9ca3af',
					textAlign: 'center',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'date',
							property: 'text',
							description: 'Transaction date'
						}
					]
				}
			],
			background: '#f8fafc'
		}
	};
}

/**
 * Webinar Promo template - event marketing design
 */
export function getWebinarPromoTemplate() {
	return {
		name: 'Webinar Promo Template',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 630,
					fill: '#f0f9ff',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 1120,
					height: 550,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 8,
						offsetY: 8
					}
				},
				// Blue accent bar
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 12,
					height: 550,
					fill: '#0ea5e9',
					rx: 6,
					ry: 6
				},
				// Live badge
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 100,
					height: 36,
					fill: '#ef4444',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'circle',
					id: generateId(),
					left: 100,
					top: 92,
					radius: 6,
					fill: '#ffffff'
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 116,
					top: 87,
					width: 60,
					text: 'LIVE',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'left'
				},
				// Webinar badge
				{
					type: 'rect',
					id: generateId(),
					left: 200,
					top: 80,
					width: 120,
					height: 36,
					fill: '#0ea5e9',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 87,
					width: 120,
					text: 'WEBINAR',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				},
				// Title (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 150,
					width: 700,
					text: 'Webinar Title Here',
					fontSize: 48,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'webinarTitle',
							property: 'text',
							description: 'Title of the webinar'
						}
					]
				},
				// Date and time (variable)
				{
					type: 'path',
					id: generateId(),
					left: 80,
					top: 220,
					path: ICONS.CALENDAR,
					fill: '#6b7280',
					scaleX: 0.9,
					scaleY: 0.9
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 110,
					top: 220,
					width: 570,
					text: 'December 20, 2024 · 2:00 PM EST',
					fontSize: 22,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'dateTime',
							property: 'text',
							description: 'Date and time of webinar'
						}
					]
				},
				// Speaker section
				{
					type: 'circle',
					id: generateId(),
					left: 80,
					top: 300,
					radius: 40,
					fill: '#e0f2fe',
					stroke: '#0ea5e9',
					strokeWidth: 3
				},
				{
					type: 'path',
					id: generateId(),
					left: 95,
					top: 318,
					path: ICONS.USER,
					fill: '#0ea5e9',
					scaleX: 2,
					scaleY: 2
				},
				// Speaker name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 180,
					top: 310,
					width: 400,
					text: 'Speaker Name',
					fontSize: 24,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'speakerName',
							property: 'text',
							description: 'Name of the speaker'
						}
					]
				},
				// Speaker role (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 180,
					top: 345,
					width: 400,
					text: 'CEO at Company',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'speakerRole',
							property: 'text',
							description: "Speaker's role"
						}
					]
				},
				// Register button
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 430,
					width: 280,
					height: 60,
					fill: '#0ea5e9',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 12,
					ry: 12,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 4,
						offsetY: 4
					}
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 445,
					width: 280,
					text: 'Register Free →',
					fontSize: 22,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				},
				// Right side visual
				{
					type: 'rect',
					id: generateId(),
					left: 800,
					top: 100,
					width: 320,
					height: 420,
					fill: '#e0f2fe',
					stroke: '#0ea5e9',
					strokeWidth: 3,
					rx: 24,
					ry: 24
				},
				{
					type: 'path',
					id: generateId(),
					left: 890,
					top: 260,
					path: ICONS.VIDEO,
					fill: '#0ea5e9',
					scaleX: 5,
					scaleY: 5
				}
			],
			background: '#f0f9ff'
		}
	};
}

/**
 * Event Ticket template
 */
export function getEventTicketTemplate() {
	return {
		name: 'Event Ticket Template',
		type: 'ticket',
		width: 1200,
		height: 500,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 500,
					fill: '#f8fafc',
					selectable: false,
					evented: false
				},
				// Ticket main
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 900,
					height: 420,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 6,
						offsetY: 6
					}
				},
				// Ticket stub
				{
					type: 'rect',
					id: generateId(),
					left: 960,
					top: 40,
					width: 200,
					height: 420,
					fill: '#111827',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24
				},
				// Perforation line
				{
					type: 'line',
					id: generateId(),
					left: 940,
					top: 60,
					x1: 0,
					y1: 0,
					x2: 0,
					y2: 380,
					stroke: '#d1d5db',
					strokeWidth: 2,
					strokeDashArray: [8, 8]
				},
				// Ticket badge
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 120,
					height: 36,
					fill: '#111827',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'path',
					id: generateId(),
					left: 94,
					top: 87,
					path: ICONS.TICKET,
					fill: '#ffffff',
					scaleX: 0.7,
					scaleY: 0.7
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 118,
					top: 87,
					width: 70,
					text: 'TICKET',
					fontSize: 12,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'left'
				},
				// Event name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 140,
					width: 700,
					text: 'Event Name',
					fontSize: 42,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'eventName',
							property: 'text',
							description: 'Name of the event'
						}
					]
				},
				// Date (variable)
				{
					type: 'path',
					id: generateId(),
					left: 80,
					top: 200,
					path: ICONS.CALENDAR,
					fill: '#6b7280',
					scaleX: 0.85,
					scaleY: 0.85
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 108,
					top: 200,
					width: 370,
					text: 'December 25, 2024',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'date',
							property: 'text',
							description: 'Event date'
						}
					]
				},
				// Location (variable)
				{
					type: 'path',
					id: generateId(),
					left: 80,
					top: 240,
					path: ICONS.PIN,
					fill: '#6b7280',
					scaleX: 0.85,
					scaleY: 0.85
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 108,
					top: 240,
					width: 570,
					text: 'Convention Center, San Francisco',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'location',
							property: 'text',
							description: 'Event location'
						}
					]
				},
				// Attendee name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 320,
					width: 500,
					text: 'Attendee Name',
					fontSize: 28,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'attendeeName',
							property: 'text',
							description: 'Name of the attendee'
						}
					]
				},
				// Seat/ticket number (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 360,
					width: 300,
					text: 'Seat: A-42',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'seat',
							property: 'text',
							description: 'Seat or ticket number'
						}
					]
				},
				// QR code placeholder
				{
					type: 'rect',
					id: generateId(),
					left: 990,
					top: 140,
					width: 140,
					height: 140,
					fill: '#ffffff',
					stroke: '#374151',
					strokeWidth: 2,
					rx: 8,
					ry: 8
				},
				{
					type: 'path',
					id: generateId(),
					left: 1015,
					top: 165,
					path: ICONS.QR_CODE,
					fill: '#374151',
					scaleX: 3.5,
					scaleY: 3.5
				},
				// Admit one
				{
					type: 'textbox',
					id: generateId(),
					left: 990,
					top: 320,
					width: 140,
					text: 'ADMIT\nONE',
					fontSize: 24,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				}
			],
			background: '#f8fafc'
		}
	};
}

/**
 * KPI Card template
 */
export function getKpiCardTemplate() {
	return {
		name: 'KPI Card Template',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 630,
					fill: '#faf5ff',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 1120,
					height: 550,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 8,
						offsetY: 8
					}
				},
				// KPI badge
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 160,
					height: 36,
					fill: '#8b5cf6',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'path',
					id: generateId(),
					left: 95,
					top: 87,
					path: ICONS.CHART,
					fill: '#ffffff',
					scaleX: 0.75,
					scaleY: 0.75
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 87,
					width: 115,
					text: 'KPI REPORT',
					fontSize: 13,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'left'
				},
				// Period (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 240,
					top: 85,
					width: 300,
					text: 'Q4 2024',
					fontSize: 18,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#6b7280',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'period',
							property: 'text',
							description: 'Reporting period'
						}
					]
				},
				// KPI 1 Card
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 150,
					width: 320,
					height: 180,
					fill: '#f3e8ff',
					stroke: '#a855f7',
					strokeWidth: 3,
					rx: 16,
					ry: 16
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 100,
					top: 170,
					width: 280,
					text: 'Revenue',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'kpi1Label',
							property: 'text',
							description: 'First KPI label'
						}
					]
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 100,
					top: 200,
					width: 280,
					text: '$2.4M',
					fontSize: 48,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'kpi1Value',
							property: 'text',
							description: 'First KPI value'
						}
					]
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 100,
					top: 270,
					width: 280,
					text: '↑ 24% vs last quarter',
					fontSize: 16,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#22c55e',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'kpi1Change',
							property: 'text',
							description: 'First KPI change'
						}
					]
				},
				// KPI 2 Card
				{
					type: 'rect',
					id: generateId(),
					left: 440,
					top: 150,
					width: 320,
					height: 180,
					fill: '#dcfce7',
					stroke: '#22c55e',
					strokeWidth: 3,
					rx: 16,
					ry: 16
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 460,
					top: 170,
					width: 280,
					text: 'Active Users',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'kpi2Label',
							property: 'text',
							description: 'Second KPI label'
						}
					]
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 460,
					top: 200,
					width: 280,
					text: '45.2K',
					fontSize: 48,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'kpi2Value',
							property: 'text',
							description: 'Second KPI value'
						}
					]
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 460,
					top: 270,
					width: 280,
					text: '↑ 12% vs last quarter',
					fontSize: 16,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#22c55e',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'kpi2Change',
							property: 'text',
							description: 'Second KPI change'
						}
					]
				},
				// KPI 3 Card
				{
					type: 'rect',
					id: generateId(),
					left: 800,
					top: 150,
					width: 320,
					height: 180,
					fill: '#fef3c7',
					stroke: '#f59e0b',
					strokeWidth: 3,
					rx: 16,
					ry: 16
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 820,
					top: 170,
					width: 280,
					text: 'Conversion',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'kpi3Label',
							property: 'text',
							description: 'Third KPI label'
						}
					]
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 820,
					top: 200,
					width: 280,
					text: '8.7%',
					fontSize: 48,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'kpi3Value',
							property: 'text',
							description: 'Third KPI value'
						}
					]
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 820,
					top: 270,
					width: 280,
					text: '↑ 3.2% vs last quarter',
					fontSize: 16,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#22c55e',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'kpi3Change',
							property: 'text',
							description: 'Third KPI change'
						}
					]
				},
				// Summary row
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 370,
					width: 1040,
					height: 180,
					fill: '#faf5ff',
					stroke: '#a855f7',
					strokeWidth: 2,
					rx: 16,
					ry: 16
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 100,
					top: 390,
					width: 200,
					text: 'Summary',
					fontSize: 20,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937'
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 100,
					top: 430,
					width: 1000,
					text: 'Strong quarter with growth across all key metrics. Revenue exceeded targets by 15%.',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#374151',
					lineHeight: 1.4,
					isVariable: true,
					variableBindings: [
						{
							variableName: 'summary',
							property: 'text',
							description: 'KPI summary'
						}
					]
				}
			],
			background: '#faf5ff'
		}
	};
}

/**
 * Leaderboard template
 */
export function getLeaderboardTemplate() {
	return {
		name: 'Leaderboard Template',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 630,
					fill: '#fef3c7',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 1120,
					height: 550,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 8,
						offsetY: 8
					}
				},
				// Leaderboard badge
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 180,
					height: 36,
					fill: '#f59e0b',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'path',
					id: generateId(),
					left: 95,
					top: 87,
					path: ICONS.TROPHY,
					fill: '#ffffff',
					scaleX: 0.75,
					scaleY: 0.75
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 87,
					width: 135,
					text: 'LEADERBOARD',
					fontSize: 13,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'left'
				},
				// Title (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 140,
					width: 600,
					text: 'Top Performers',
					fontSize: 42,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'title',
							property: 'text',
							description: 'Leaderboard title'
						}
					]
				},
				// 1st Place
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 210,
					width: 1040,
					height: 90,
					fill: '#fef3c7',
					stroke: '#f59e0b',
					strokeWidth: 3,
					rx: 16,
					ry: 16
				},
				{
					type: 'path',
					id: generateId(),
					left: 108,
					top: 235,
					path: ICONS.MEDAL,
					fill: '#fbbf24',
					stroke: '#1f2937',
					strokeWidth: 0.5,
					scaleX: 1.8,
					scaleY: 1.8
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 180,
					top: 240,
					width: 400,
					text: 'First Place Name',
					fontSize: 28,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'first',
							property: 'text',
							description: 'First place name'
						}
					]
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 900,
					top: 240,
					width: 200,
					text: '1,250 pts',
					fontSize: 28,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#f59e0b',
					textAlign: 'right',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'firstScore',
							property: 'text',
							description: 'First place score'
						}
					]
				},
				// 2nd Place
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 320,
					width: 1040,
					height: 80,
					fill: '#f1f5f9',
					stroke: '#94a3b8',
					strokeWidth: 2,
					rx: 16,
					ry: 16
				},
				{
					type: 'path',
					id: generateId(),
					left: 108,
					top: 342,
					path: ICONS.MEDAL,
					fill: '#94a3b8',
					stroke: '#1f2937',
					strokeWidth: 0.5,
					scaleX: 1.5,
					scaleY: 1.5
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 180,
					top: 345,
					width: 400,
					text: 'Second Place Name',
					fontSize: 24,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'second',
							property: 'text',
							description: 'Second place name'
						}
					]
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 900,
					top: 345,
					width: 200,
					text: '980 pts',
					fontSize: 24,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#64748b',
					textAlign: 'right',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'secondScore',
							property: 'text',
							description: 'Second place score'
						}
					]
				},
				// 3rd Place
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 420,
					width: 1040,
					height: 80,
					fill: '#fef7ed',
					stroke: '#fb923c',
					strokeWidth: 2,
					rx: 16,
					ry: 16
				},
				{
					type: 'path',
					id: generateId(),
					left: 108,
					top: 442,
					path: ICONS.MEDAL,
					fill: '#fb923c',
					stroke: '#1f2937',
					strokeWidth: 0.5,
					scaleX: 1.5,
					scaleY: 1.5
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 180,
					top: 445,
					width: 400,
					text: 'Third Place Name',
					fontSize: 24,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'third',
							property: 'text',
							description: 'Third place name'
						}
					]
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 900,
					top: 445,
					width: 200,
					text: '875 pts',
					fontSize: 24,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ea580c',
					textAlign: 'right',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'thirdScore',
							property: 'text',
							description: 'Third place score'
						}
					]
				}
			],
			background: '#fef3c7'
		}
	};
}

/**
 * Status Update template
 */
export function getStatusUpdateTemplate() {
	return {
		name: 'Status Update Template',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 630,
					fill: '#fff1f2',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 1120,
					height: 550,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 8,
						offsetY: 8
					}
				},
				// Status indicator bar (changes color based on status)
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 12,
					height: 550,
					fill: '#ef4444',
					rx: 6,
					ry: 6
				},
				// Status badge (variable)
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 180,
					height: 40,
					fill: '#ef4444',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 20,
					ry: 20
				},
				{
					type: 'path',
					id: generateId(),
					left: 100,
					top: 88,
					path: ICONS.WARNING,
					fill: '#ffffff',
					scaleX: 0.85,
					scaleY: 0.85
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 130,
					top: 88,
					width: 120,
					text: 'INCIDENT',
					fontSize: 16,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'left',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'statusBadge',
							property: 'text',
							description: 'Status badge text'
						}
					]
				},
				// Timestamp (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 900,
					top: 88,
					width: 220,
					text: 'Dec 14, 2:30 PM',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					textAlign: 'right',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'time',
							property: 'text',
							description: 'Timestamp'
						}
					]
				},
				// Status title (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 160,
					width: 800,
					text: 'Service Degradation',
					fontSize: 48,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'status',
							property: 'text',
							description: 'Status title'
						}
					]
				},
				// Message (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 240,
					width: 1000,
					text: 'We are currently experiencing issues with our API endpoints. Our team is actively investigating the issue and working on a fix.',
					fontSize: 24,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#374151',
					lineHeight: 1.5,
					isVariable: true,
					variableBindings: [
						{
							variableName: 'message',
							property: 'text',
							description: 'Status message'
						}
					]
				},
				// Affected services label
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 380,
					width: 200,
					text: 'Affected:',
					fontSize: 18,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#6b7280'
				},
				// Affected services (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 190,
					top: 380,
					width: 800,
					text: 'API, Dashboard, Webhooks',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#ef4444',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'affected',
							property: 'text',
							description: 'Affected services'
						}
					]
				},
				// Update footer
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 450,
					width: 1040,
					height: 100,
					fill: '#fef2f2',
					stroke: '#fecaca',
					strokeWidth: 2,
					rx: 16,
					ry: 16
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 100,
					top: 470,
					width: 200,
					text: 'Next Update:',
					fontSize: 16,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#6b7280'
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 100,
					top: 500,
					width: 400,
					text: 'In 30 minutes or when resolved',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'nextUpdate',
							property: 'text',
							description: 'Next update time'
						}
					]
				},
				// Status icon
				{
					type: 'path',
					id: generateId(),
					left: 920,
					top: 180,
					path: ICONS.WRENCH,
					fill: '#be123c', // rose-700
					scaleX: 5,
					scaleY: 5
				}
			],
			background: '#fff1f2'
		}
	};
}

/**
 * Job Post template
 */
export function getJobPostTemplate() {
	return {
		name: 'Job Post Template',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 630,
					fill: '#f0fdfa',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 1120,
					height: 550,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 8,
						offsetY: 8
					}
				},
				// Hiring badge
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 200,
					height: 40,
					fill: '#14b8a6',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 20,
					ry: 20
				},
				{
					type: 'path',
					id: generateId(),
					left: 98,
					top: 88,
					path: ICONS.BRIEFCASE,
					fill: '#ffffff',
					scaleX: 0.85,
					scaleY: 0.85
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 128,
					top: 88,
					width: 145,
					text: "WE'RE HIRING",
					fontSize: 16,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'left'
				},
				// Job Title (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 160,
					width: 700,
					text: 'Senior Product Designer',
					fontSize: 56,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'jobTitle',
							property: 'text',
							description: 'Job title'
						}
					]
				},
				// Location icon (vector)
				{
					type: 'path',
					id: generateId(),
					left: 80,
					top: 242,
					path: ICONS.PIN,
					fill: '#1f2937',
					scaleX: 1,
					scaleY: 1
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 240,
					width: 400,
					text: 'San Francisco / Remote',
					fontSize: 24,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#4b5563',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'location',
							property: 'text',
							description: 'Job location'
						}
					]
				},
				// Salary icon (vector)
				{
					type: 'path',
					id: generateId(),
					left: 80,
					top: 292,
					path: ICONS.DOLLAR,
					fill: '#1f2937',
					scaleX: 1,
					scaleY: 1
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 290,
					width: 400,
					text: '$140k - $180k + Equity',
					fontSize: 24,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#4b5563',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'salary',
							property: 'text',
							description: 'Salary range'
						}
					]
				},
				// Type icon (vector)
				{
					type: 'path',
					id: generateId(),
					left: 80,
					top: 342,
					path: ICONS.BRIEFCASE,
					fill: '#1f2937',
					scaleX: 1,
					scaleY: 1
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 340,
					width: 400,
					text: 'Full-time',
					fontSize: 24,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#4b5563',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'type',
							property: 'text',
							description: 'Job type'
						}
					]
				},
				// Apply Button
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 450,
					width: 250,
					height: 60,
					fill: '#1f2937',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 12,
					ry: 12,
					shadow: {
						color: '#14b8a6',
						blur: 0,
						offsetX: 4,
						offsetY: 4
					}
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 465,
					width: 250,
					text: 'Apply Now →',
					fontSize: 20,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				},
				// Right side visual (Company placeholder)
				{
					type: 'rect',
					id: generateId(),
					left: 800,
					top: 100,
					width: 320,
					height: 320,
					fill: '#ccfbf1',
					stroke: '#14b8a6',
					strokeWidth: 3,
					rx: 24,
					ry: 24
				},
				// Building icon
				{
					type: 'path',
					id: generateId(),
					left: 880,
					top: 200,
					path: ICONS.BUILDING,
					fill: '#0f766e',
					scaleX: 6,
					scaleY: 6
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 800,
					top: 440,
					width: 320,
					text: 'Join our team!',
					fontSize: 24,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#0f766e',
					textAlign: 'center'
				}
			],
			background: '#f0fdfa'
		}
	};
}

/**
 * Feature Flag Banner template
 */
export function getFeatureFlagBannerTemplate() {
	return {
		name: 'Feature Flag Template',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 630,
					fill: '#fafaf9',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 1120,
					height: 550,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 8,
						offsetY: 8
					}
				},
				// Feature badge
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 160,
					height: 36,
					fill: '#78716c',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 87,
					width: 160,
					text: 'FEATURE FLAG',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				},
				// Key text
				{
					type: 'textbox',
					id: generateId(),
					left: 300,
					top: 87,
					width: 400,
					text: 'key: new-dashboard-v2',
					fontSize: 14,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#78716c',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'flagKey',
							property: 'text',
							description: 'Feature flag key'
						}
					]
				},
				// Feature toggle (Graphic)
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 180,
					width: 120,
					height: 60,
					fill: '#22c55e',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 30,
					ry: 30
				},
				{
					type: 'circle',
					id: generateId(),
					left: 140,
					top: 190,
					radius: 20,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 2
				},
				// Feature Name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 240,
					top: 175,
					width: 800,
					text: 'New Analytics Dashboard',
					fontSize: 48,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'featureName',
							property: 'text',
							description: 'Name of the feature'
						}
					]
				},
				// Status label
				{
					type: 'textbox',
					id: generateId(),
					left: 240,
					top: 240,
					width: 200,
					text: 'Status:',
					fontSize: 20,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#57534e'
				},
				// Status (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 320,
					top: 240,
					width: 400,
					text: 'Enabled for 20% of users',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#22c55e',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'status',
							property: 'text',
							description: 'Rollout status'
						}
					]
				},
				// Description box
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 320,
					width: 1040,
					height: 180,
					fill: '#f5f5f4',
					stroke: '#d6d3d1',
					strokeWidth: 2,
					rx: 16,
					ry: 16
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 110,
					top: 350,
					width: 980,
					text: 'This flag controls the visibility of the new React-based analytics dashboard. Enabling this will switch users from the legacy view to the new interactive charts.',
					fontSize: 24,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#44403c',
					lineHeight: 1.5,
					isVariable: true,
					variableBindings: [
						{
							variableName: 'description',
							property: 'text',
							description: 'Feature description'
						}
					]
				},
				// Bottom info
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 520,
					width: 1040,
					text: 'Manage in: Settings > Feature Flags',
					fontSize: 16,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#a8a29e',
					textAlign: 'center'
				}
			],
			background: '#fafaf9'
		}
	};
}

/**
 * Report Cover template
 */
export function getReportCoverTemplate() {
	return {
		name: 'Report Cover Template',
		type: 'og-image',
		width: 800,
		height: 1131, // A4 aspect ratio (approx)
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 800,
					height: 1131,
					fill: '#ffffff',
					selectable: false,
					evented: false
				},
				// Decorative top shape
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 800,
					height: 400,
					fill: '#1e293b',
					selectable: false
				},
				// Report Year/Date (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 60,
					top: 60,
					width: 680,
					text: '2024 ANNUAL REPORT',
					fontSize: 16,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#94a3b8',
					letterSpacing: 2,
					isVariable: true,
					variableBindings: [
						{
							variableName: 'reportType',
							property: 'text',
							description: 'Type or date of report'
						}
					]
				},
				// Title (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 60,
					top: 120,
					width: 680,
					text: 'Q4 Strategy & Performance',
					fontSize: 56,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					lineHeight: 1.1,
					isVariable: true,
					variableBindings: [
						{
							variableName: 'title',
							property: 'text',
							description: 'Main report title'
						}
					]
				},
				// Subtitle (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 60,
					top: 280,
					width: 680,
					text: 'Analysis of market trends, operational metrics, and growth initiatives for the upcoming fiscal year.',
					fontSize: 22,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#cbd5e1',
					lineHeight: 1.4,
					isVariable: true,
					variableBindings: [
						{
							variableName: 'subtitle',
							property: 'text',
							description: 'Report subtitle/abstract'
						}
					]
				},
				// Image placeholder graphic
				{
					type: 'rect',
					id: generateId(),
					left: 60,
					top: 450,
					width: 680,
					height: 400,
					fill: '#f1f5f9',
					stroke: '#cbd5e1',
					strokeWidth: 2
				},
				{
					type: 'circle',
					id: generateId(),
					left: 310,
					top: 560,
					radius: 80,
					fill: '#e2e8f0'
				},
				{
					type: 'rect',
					id: generateId(),
					left: 400,
					top: 620,
					width: 200,
					height: 150,
					fill: '#cbd5e1',
					rx: 8,
					ry: 8
				},
				// Prepared for (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 60,
					top: 900,
					width: 300,
					text: 'PREPARED FOR',
					fontSize: 12,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#64748b',
					letterSpacing: 1
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 60,
					top: 920,
					width: 300,
					text: 'Executive Board',
					fontSize: 18,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#0f172a',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'preparedFor',
							property: 'text',
							description: 'Recipient name'
						}
					]
				},
				// Prepared by (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 400,
					top: 900,
					width: 300,
					text: 'PREPARED BY',
					fontSize: 12,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#64748b',
					letterSpacing: 1
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 400,
					top: 920,
					width: 300,
					text: 'Strategy Team',
					fontSize: 18,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#0f172a',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'preparedBy',
							property: 'text',
							description: 'Author name'
						}
					]
				},
				// Logo placeholder
				{
					type: 'rect',
					id: generateId(),
					left: 60,
					top: 1020,
					width: 40,
					height: 40,
					fill: '#0f172a',
					rx: 8,
					ry: 8
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 110,
					top: 1030,
					width: 200,
					text: 'ACME Corp',
					fontSize: 16,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#0f172a'
				}
			],
			background: '#ffffff'
		}
	};
}

/**
 * Roadmap Card template
 */
export function getRoadmapCardTemplate() {
	return {
		name: 'Roadmap Card Template',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 630,
					fill: '#eff6ff',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 1120,
					height: 550,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 8,
						offsetY: 8
					}
				},
				// Roadmap badge
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 140,
					height: 36,
					fill: '#3b82f6',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'path',
					id: generateId(),
					left: 95,
					top: 88,
					path: ICONS.MAP,
					fill: '#ffffff',
					scaleX: 0.8,
					scaleY: 0.8
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 87,
					width: 100, // Adjusted width
					text: 'ROADMAP',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'left'
				},
				// Quarter/Timeline (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 240,
					top: 80,
					width: 400,
					text: 'Q1 2025 Targets',
					fontSize: 28,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1e3a8a',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'quarter',
							property: 'text',
							description: 'Timeframe for roadmap'
						}
					]
				},
				// Column 1: Now
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 150,
					width: 320,
					height: 400,
					fill: '#eff6ff',
					stroke: '#3b82f6',
					strokeWidth: 2,
					rx: 16,
					ry: 16
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 170,
					width: 320,
					text: 'NOW',
					fontSize: 18,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#3b82f6',
					textAlign: 'center'
				},
				// Item 1-1 (variable)
				{
					type: 'rect',
					id: generateId(),
					left: 100,
					top: 210,
					width: 280,
					height: 60,
					fill: '#ffffff',
					stroke: '#93c5fd',
					strokeWidth: 1,
					rx: 8,
					ry: 8
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 110,
					top: 228,
					width: 260,
					text: 'User Authentication',
					fontSize: 16,
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'now1',
							property: 'text',
							description: 'Now item 1'
						}
					]
				},
				// Item 1-2 (variable)
				{
					type: 'rect',
					id: generateId(),
					left: 100,
					top: 280,
					width: 280,
					height: 60,
					fill: '#ffffff',
					stroke: '#93c5fd',
					strokeWidth: 1,
					rx: 8,
					ry: 8
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 110,
					top: 298,
					width: 260,
					text: 'Dashboard v2',
					fontSize: 16,
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'now2',
							property: 'text',
							description: 'Now item 2'
						}
					]
				},
				// Column 2: Next
				{
					type: 'rect',
					id: generateId(),
					left: 440,
					top: 150,
					width: 320,
					height: 400,
					fill: '#f0fdf4',
					stroke: '#22c55e',
					strokeWidth: 2,
					rx: 16,
					ry: 16
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 440,
					top: 170,
					width: 320,
					text: 'NEXT',
					fontSize: 18,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#22c55e',
					textAlign: 'center'
				},
				// Item 2-1 (variable)
				{
					type: 'rect',
					id: generateId(),
					left: 460,
					top: 210,
					width: 280,
					height: 60,
					fill: '#ffffff',
					stroke: '#86efac',
					strokeWidth: 1,
					rx: 8,
					ry: 8
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 470,
					top: 228,
					width: 260,
					text: 'API Integration',
					fontSize: 16,
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'next1',
							property: 'text',
							description: 'Next item 1'
						}
					]
				},
				// Item 2-2 (variable)
				{
					type: 'rect',
					id: generateId(),
					left: 460,
					top: 280,
					width: 280,
					height: 60,
					fill: '#ffffff',
					stroke: '#86efac',
					strokeWidth: 1,
					rx: 8,
					ry: 8
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 470,
					top: 298,
					width: 260,
					text: 'Mobile App Beta',
					fontSize: 16,
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'next2',
							property: 'text',
							description: 'Next item 2'
						}
					]
				},
				// Column 3: Later
				{
					type: 'rect',
					id: generateId(),
					left: 800,
					top: 150,
					width: 320,
					height: 400,
					fill: '#f5f3ff',
					stroke: '#8b5cf6',
					strokeWidth: 2,
					rx: 16,
					ry: 16
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 800,
					top: 170,
					width: 320,
					text: 'LATER',
					fontSize: 18,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#8b5cf6',
					textAlign: 'center'
				},
				// Item 3-1 (variable)
				{
					type: 'rect',
					id: generateId(),
					left: 820,
					top: 210,
					width: 280,
					height: 60,
					fill: '#ffffff',
					stroke: '#c4b5fd',
					strokeWidth: 1,
					rx: 8,
					ry: 8
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 830,
					top: 228,
					width: 260,
					text: 'Enterprise SSO',
					fontSize: 16,
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'later1',
							property: 'text',
							description: 'Later item 1'
						}
					]
				}
			],
			background: '#eff6ff'
		}
	};
}

/**
 * Release Notes Card template
 */
export function getReleaseNotesCardTemplate() {
	return {
		name: 'Release Notes Template',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 630,
					fill: '#eef2ff',
					selectable: false,
					evented: false
				},
				// Main card
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 1120,
					height: 550,
					fill: '#ffffff',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 8,
						offsetY: 8
					}
				},
				// Release badge
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 140,
					height: 36,
					fill: '#6366f1',
					stroke: '#1f2937',
					strokeWidth: 2,
					rx: 18,
					ry: 18
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 87,
					width: 140,
					text: 'RELEASE',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				},
				// Title (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 150,
					width: 700,
					text: 'Release 2.4: Dark Mode',
					fontSize: 48,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1f2937',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'title',
							property: 'text',
							description: 'Release title'
						}
					]
				},
				// Summary (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 80,
					top: 220,
					width: 600,
					text: 'We\'ve completely overhauled the UI with a new dark mode, improved accessibility, and faster load times.',
					fontSize: 24,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#4b5563',
					lineHeight: 1.5,
					isVariable: true,
					variableBindings: [
						{
							variableName: 'summary',
							property: 'text',
							description: 'Release summary'
						}
					]
				},
				// Feature highlights container
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 360,
					width: 600,
					height: 180,
					fill: '#e0e7ff',
					stroke: '#6366f1',
					strokeWidth: 2,
					rx: 16,
					ry: 16
				},
				// Highlights content
				{
					type: 'textbox',
					id: generateId(),
					left: 110,
					top: 390,
					width: 540,
					text: '• Native Dark Mode support\n• WCAG 2.1 AA Compliance\n• 50% faster page transitions',
					fontSize: 22,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#312e81',
					lineHeight: 1.8
				},
				// Right side image/graphic
				{
					type: 'rect',
					id: generateId(),
					left: 750,
					top: 100,
					width: 380,
					height: 440,
					fill: '#1e293b',
					stroke: '#1f2937',
					strokeWidth: 3,
					rx: 24,
					ry: 24
				},
				{
					type: 'path',
					id: generateId(),
					left: 860,
					top: 260,
					path: ICONS.MOON,
					fill: '#94a3b8',
					scaleX: 8,
					scaleY: 8
				}
			],
			background: '#eef2ff'
		}
	};
}

/**
 * API Response Card template
 */
export function getApiResponseCardTemplate() {
	return {
		name: 'API Response Template',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1200,
					height: 630,
					fill: '#f8fafc',
					selectable: false,
					evented: false
				},
				// Main card (Browser style)
				{
					type: 'rect',
					id: generateId(),
					left: 100,
					top: 60,
					width: 1000,
					height: 510,
					fill: '#0f172a',
					stroke: '#1e293b',
					strokeWidth: 3,
					rx: 16,
					ry: 16,
					shadow: {
						color: '#1f2937',
						blur: 0,
						offsetX: 16,
						offsetY: 16
					}
				},
				// Browser dots
				{
					type: 'circle',
					id: generateId(),
					left: 130,
					top: 90,
					radius: 6,
					fill: '#ef4444'
				},
				{
					type: 'circle',
					id: generateId(),
					left: 155,
					top: 90,
					radius: 6,
					fill: '#f59e0b'
				},
				{
					type: 'circle',
					id: generateId(),
					left: 180,
					top: 90,
					radius: 6,
					fill: '#22c55e'
				},
				// Request Method Badge
				{
					type: 'rect',
					id: generateId(),
					left: 230,
					top: 82,
					width: 60,
					height: 24,
					fill: '#22c55e',
					rx: 4,
					ry: 4
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 230,
					top: 86,
					width: 60,
					text: 'GET',
					fontSize: 12,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center'
				},
				// URL Path
				{
					type: 'textbox',
					id: generateId(),
					left: 300,
					top: 86,
					width: 400,
					text: '/api/v1/users/me',
					fontSize: 14,
					fontFamily: 'Monaco, monospace',
					fill: '#94a3b8'
				},
				// Divider
				{
					type: 'line',
					id: generateId(),
					left: 100,
					top: 130,
					x1: 0,
					y1: 0,
					x2: 1000,
					y2: 0,
					stroke: '#334155',
					strokeWidth: 1
				},
				// Code content (simulated syntax highlighting)
				// Line 1: {
				{
					type: 'textbox',
					id: generateId(),
					left: 140,
					top: 160,
					width: 50,
					text: '{',
					fontSize: 20,
					fontFamily: 'Monaco, monospace',
					fill: '#e2e8f0'
				},
				// Line 2: "id": "..."
				{
					type: 'textbox',
					id: generateId(),
					left: 170,
					top: 200,
					width: 100,
					text: '"id":',
					fontSize: 20,
					fontFamily: 'Monaco, monospace',
					fill: '#7dd3fc'
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 250,
					top: 200,
					width: 300,
					text: '"user_12345"',
					fontSize: 20,
					fontFamily: 'Monaco, monospace',
					fill: '#bef264',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'id',
							property: 'text',
							description: 'User ID'
						}
					]
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 450,
					top: 200,
					width: 20,
					text: ',',
					fontSize: 20,
					fontFamily: 'Monaco, monospace',
					fill: '#e2e8f0'
				},
				// Line 3: "status": "..."
				{
					type: 'textbox',
					id: generateId(),
					left: 170,
					top: 240,
					width: 120,
					text: '"status":',
					fontSize: 20,
					fontFamily: 'Monaco, monospace',
					fill: '#7dd3fc'
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 290,
					top: 240,
					width: 300,
					text: '"active"',
					fontSize: 20,
					fontFamily: 'Monaco, monospace',
					fill: '#bef264',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'status',
							property: 'text',
							description: 'Status'
						}
					]
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 450,
					top: 240,
					width: 20,
					text: ',',
					fontSize: 20,
					fontFamily: 'Monaco, monospace',
					fill: '#e2e8f0'
				},
				// Line 4: "role": "..."
				{
					type: 'textbox',
					id: generateId(),
					left: 170,
					top: 280,
					width: 100,
					text: '"role":',
					fontSize: 20,
					fontFamily: 'Monaco, monospace',
					fill: '#7dd3fc'
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 270,
					top: 280,
					width: 300,
					text: '"admin"',
					fontSize: 20,
					fontFamily: 'Monaco, monospace',
					fill: '#bef264'
				},
				// Line 5: }
				{
					type: 'textbox',
					id: generateId(),
					left: 140,
					top: 320,
					width: 50,
					text: '}',
					fontSize: 20,
					fontFamily: 'Monaco, monospace',
					fill: '#e2e8f0'
				},
				// Overlay label
				{
					type: 'rect',
					id: generateId(),
					left: 900,
					top: 480,
					width: 140,
					height: 30,
					fill: '#334155',
					rx: 4,
					ry: 4
				},
				{
					type: 'textbox',
					id: generateId(),
					left: 900,
					top: 486,
					width: 140,
					text: 'JSON',
					fontSize: 12,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#94a3b8',
					textAlign: 'center'
				}
			],
			background: '#f8fafc'
		}
	};
}

/**
 * YouTube Thumbnail template - bold, attention-grabbing design
 */
export function getYoutubeThumbnailTemplate() {
	return {
		name: 'YouTube Thumbnail',
		type: 'og-image',
		width: 1280,
		height: 720,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1280, height: 720, fill: '#1a1a2e', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1280, height: 720, fill: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', opacity: 0.3, selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 40, top: 40, width: 200, height: 50, fill: '#ff0000', rx: 8, ry: 8 },
				{ type: 'textbox', id: generateId(), left: 50, top: 52, width: 180, text: 'NEW VIDEO', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 60, top: 180, width: 800, text: 'Your Video Title Here', fontSize: 72, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'title', property: 'text', description: 'Video title' }] },
				{ type: 'textbox', id: generateId(), left: 60, top: 320, width: 600, text: 'Episode 1 • Tutorial Series', fontSize: 32, fontFamily: 'Inter', fill: '#e0e0e0', isVariable: true, variableBindings: [{ variableName: 'subtitle', property: 'text', description: 'Episode info' }] },
				{ type: 'circle', id: generateId(), left: 950, top: 350, radius: 150, fill: '#ffffff', stroke: '#ff0000', strokeWidth: 8 },
				{ type: 'path', id: generateId(), left: 1020, top: 420, fill: '#ff0000', path: ICONS.VIDEO, scaleX: 4, scaleY: 4 }
			],
			background: '#1a1a2e'
		}
	};
}

/**
 * LinkedIn Banner template - professional design
 */
export function getLinkedinBannerTemplate() {
	return {
		name: 'LinkedIn Banner',
		type: 'og-image',
		width: 1584,
		height: 396,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1584, height: 396, fill: '#0077b5', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1584, height: 396, fill: 'linear-gradient(90deg, #0077b5 0%, #00a0dc 100%)', selectable: false, evented: false },
				{ type: 'textbox', id: generateId(), left: 80, top: 100, width: 900, text: 'Your Professional Headline', fontSize: 56, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'headline', property: 'text', description: 'Main headline' }] },
				{ type: 'textbox', id: generateId(), left: 80, top: 180, width: 800, text: 'Building innovative solutions | Open to opportunities', fontSize: 28, fontFamily: 'Inter', fill: '#e0f4ff', isVariable: true, variableBindings: [{ variableName: 'tagline', property: 'text', description: 'Tagline' }] },
				{ type: 'textbox', id: generateId(), left: 80, top: 280, width: 400, text: 'www.yourwebsite.com', fontSize: 20, fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'website', property: 'text', description: 'Website URL' }] },
				{ type: 'rect', id: generateId(), left: 1200, top: 80, width: 300, height: 236, fill: '#ffffff', rx: 12, ry: 12, opacity: 0.1 }
			],
			background: '#0077b5'
		}
	};
}

/**
 * Podcast Cover template - square format for directories
 */
export function getPodcastCoverTemplate() {
	return {
		name: 'Podcast Cover',
		type: 'og-image',
		width: 1400,
		height: 1400,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1400, height: 1400, fill: '#2c3e50', selectable: false, evented: false },
				{ type: 'circle', id: generateId(), left: 100, top: 100, radius: 600, fill: '#9b59b6', opacity: 0.3 },
				{ type: 'circle', id: generateId(), left: 700, top: 700, radius: 500, fill: '#3498db', opacity: 0.2 },
				{ type: 'rect', id: generateId(), left: 100, top: 100, width: 1200, height: 1200, fill: '#34495e', rx: 40, ry: 40, stroke: '#9b59b6', strokeWidth: 6 },
				{ type: 'circle', id: generateId(), left: 550, top: 300, radius: 150, fill: '#9b59b6' },
				{ type: 'path', id: generateId(), left: 620, top: 370, fill: '#ffffff', path: 'M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z', scaleX: 5, scaleY: 5 },
				{ type: 'textbox', id: generateId(), left: 150, top: 650, width: 1100, text: 'PODCAST NAME', fontSize: 80, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'showName', property: 'text', description: 'Podcast name' }] },
				{ type: 'textbox', id: generateId(), left: 150, top: 780, width: 1100, text: 'Weekly conversations about tech & innovation', fontSize: 36, fontFamily: 'Inter', fill: '#bdc3c7', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'tagline', property: 'text', description: 'Show tagline' }] },
				{ type: 'rect', id: generateId(), left: 500, top: 950, width: 400, height: 60, fill: '#9b59b6', rx: 30, ry: 30 },
				{ type: 'textbox', id: generateId(), left: 520, top: 965, width: 360, text: 'EPISODE {{number}}', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'episodeNumber', property: 'text', description: 'Episode number' }] }
			],
			background: '#2c3e50'
		}
	};
}

/**
 * Twitter/X Header template
 */
export function getTwitterHeaderTemplate() {
	return {
		name: 'Twitter Header',
		type: 'og-image',
		width: 1500,
		height: 500,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1500, height: 500, fill: '#15202b', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 750, height: 500, fill: '#1da1f2', opacity: 0.1 },
				{ type: 'textbox', id: generateId(), left: 80, top: 120, width: 900, text: 'Your Brand Message', fontSize: 64, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'headline', property: 'text', description: 'Main headline' }] },
				{ type: 'textbox', id: generateId(), left: 80, top: 220, width: 800, text: 'Building the future, one tweet at a time', fontSize: 28, fontFamily: 'Inter', fill: '#8899a6', isVariable: true, variableBindings: [{ variableName: 'subheadline', property: 'text', description: 'Sub headline' }] },
				{ type: 'rect', id: generateId(), left: 80, top: 320, width: 200, height: 50, fill: '#1da1f2', rx: 25, ry: 25 },
				{ type: 'textbox', id: generateId(), left: 100, top: 332, width: 160, text: 'Follow Us', fontSize: 20, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				{ type: 'circle', id: generateId(), left: 1200, top: 150, radius: 120, fill: '#1da1f2', opacity: 0.3 },
				{ type: 'circle', id: generateId(), left: 1100, top: 280, radius: 80, fill: '#1da1f2', opacity: 0.2 }
			],
			background: '#15202b'
		}
	};
}

/**
 * Instagram Story template - vertical format
 */
export function getInstagramStoryTemplate() {
	return {
		name: 'Instagram Story',
		type: 'og-image',
		width: 1080,
		height: 1920,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1080, height: 1920, fill: '#833ab4', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1080, height: 1920, fill: 'linear-gradient(180deg, #405de6 0%, #5851db 25%, #833ab4 50%, #c13584 75%, #fd1d1d 100%)', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 60, top: 200, width: 960, height: 1520, fill: '#ffffff', rx: 40, ry: 40 },
				{ type: 'rect', id: generateId(), left: 100, top: 250, width: 200, height: 50, fill: '#e1306c', rx: 25, ry: 25 },
				{ type: 'textbox', id: generateId(), left: 120, top: 262, width: 160, text: 'NEW POST', fontSize: 20, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 100, top: 400, width: 880, text: 'Your Amazing Headline Here', fontSize: 64, fontWeight: 'bold', fontFamily: 'Inter', fill: '#262626', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'headline', property: 'text', description: 'Main headline' }] },
				{ type: 'textbox', id: generateId(), left: 100, top: 600, width: 880, text: 'Share your story with the world. Add engaging content here.', fontSize: 32, fontFamily: 'Inter', fill: '#8e8e8e', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'caption', property: 'text', description: 'Caption text' }] },
				{ type: 'rect', id: generateId(), left: 340, top: 1500, width: 400, height: 80, fill: '#e1306c', rx: 40, ry: 40 },
				{ type: 'textbox', id: generateId(), left: 360, top: 1520, width: 360, text: 'SWIPE UP', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' }
			],
			background: '#833ab4'
		}
	};
}

/**
 * Email Header template
 */
export function getEmailHeaderTemplate() {
	return {
		name: 'Email Header',
		type: 'og-image',
		width: 600,
		height: 200,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 600, height: 200, fill: '#6366f1', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 600, height: 200, fill: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)', selectable: false, evented: false },
				{ type: 'textbox', id: generateId(), left: 30, top: 50, width: 400, text: 'Newsletter Title', fontSize: 36, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'title', property: 'text', description: 'Newsletter title' }] },
				{ type: 'textbox', id: generateId(), left: 30, top: 110, width: 350, text: 'Edition #42 • January 2024', fontSize: 18, fontFamily: 'Inter', fill: '#e0e7ff', isVariable: true, variableBindings: [{ variableName: 'edition', property: 'text', description: 'Edition info' }] },
				{ type: 'rect', id: generateId(), left: 450, top: 50, width: 120, height: 100, fill: '#ffffff', rx: 12, ry: 12, opacity: 0.2 }
			],
			background: '#6366f1'
		}
	};
}

/**
 * Blog Featured Image template
 */
export function getBlogFeaturedImageTemplate() {
	return {
		name: 'Blog Featured Image',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 630, fill: '#10b981', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 630, fill: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 60, top: 60, width: 1080, height: 510, fill: '#ffffff', rx: 20, ry: 20 },
				{ type: 'rect', id: generateId(), left: 100, top: 100, width: 140, height: 40, fill: '#10b981', rx: 20, ry: 20 },
				{ type: 'textbox', id: generateId(), left: 115, top: 108, width: 110, text: 'ARTICLE', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 100, top: 180, width: 1000, text: 'Your Blog Post Title Goes Here', fontSize: 52, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1f2937', isVariable: true, variableBindings: [{ variableName: 'title', property: 'text', description: 'Blog post title' }] },
				{ type: 'textbox', id: generateId(), left: 100, top: 320, width: 900, text: 'A compelling subtitle that summarizes your article content', fontSize: 24, fontFamily: 'Inter', fill: '#6b7280', isVariable: true, variableBindings: [{ variableName: 'subtitle', property: 'text', description: 'Post subtitle' }] },
				{ type: 'textbox', id: generateId(), left: 100, top: 480, width: 400, text: 'By John Doe • 5 min read', fontSize: 18, fontFamily: 'Inter', fill: '#9ca3af', isVariable: true, variableBindings: [{ variableName: 'author', property: 'text', description: 'Author and read time' }] }
			],
			background: '#10b981'
		}
	};
}

/**
 * Course Certificate template
 */
export function getCourseCertificateTemplate() {
	return {
		name: 'Course Certificate',
		type: 'og-image',
		width: 1200,
		height: 850,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 850, fill: '#fef3c7', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 40, top: 40, width: 1120, height: 770, fill: '#ffffff', stroke: '#f59e0b', strokeWidth: 4, rx: 0, ry: 0 },
				{ type: 'rect', id: generateId(), left: 60, top: 60, width: 1080, height: 730, fill: 'transparent', stroke: '#fbbf24', strokeWidth: 2, rx: 0, ry: 0 },
				{ type: 'textbox', id: generateId(), left: 100, top: 100, width: 1000, text: 'CERTIFICATE OF COMPLETION', fontSize: 32, fontWeight: 'bold', fontFamily: 'Inter', fill: '#f59e0b', textAlign: 'center', charSpacing: 200 },
				{ type: 'textbox', id: generateId(), left: 100, top: 180, width: 1000, text: 'This is to certify that', fontSize: 20, fontFamily: 'Inter', fill: '#6b7280', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 100, top: 240, width: 1000, text: 'John Doe', fontSize: 56, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1f2937', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'studentName', property: 'text', description: 'Student name' }] },
				{ type: 'textbox', id: generateId(), left: 100, top: 340, width: 1000, text: 'has successfully completed the course', fontSize: 20, fontFamily: 'Inter', fill: '#6b7280', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 100, top: 400, width: 1000, text: 'Advanced Web Development', fontSize: 42, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1f2937', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'courseName', property: 'text', description: 'Course name' }] },
				{ type: 'textbox', id: generateId(), left: 100, top: 520, width: 1000, text: 'Issued on January 15, 2024', fontSize: 18, fontFamily: 'Inter', fill: '#9ca3af', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'issueDate', property: 'text', description: 'Issue date' }] },
				{ type: 'rect', id: generateId(), left: 150, top: 620, width: 250, height: 2, fill: '#1f2937' },
				{ type: 'textbox', id: generateId(), left: 150, top: 640, width: 250, text: 'Instructor Signature', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280', textAlign: 'center' },
				{ type: 'rect', id: generateId(), left: 800, top: 620, width: 250, height: 2, fill: '#1f2937' },
				{ type: 'textbox', id: generateId(), left: 800, top: 640, width: 250, text: 'Certificate ID', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280', textAlign: 'center' }
			],
			background: '#fef3c7'
		}
	};
}

/**
 * Membership Card template
 */
export function getMembershipCardTemplate() {
	return {
		name: 'Membership Card',
		type: 'og-image',
		width: 1050,
		height: 600,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1050, height: 600, fill: '#1e1b4b', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1050, height: 600, fill: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a78bfa 100%)', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 40, top: 40, width: 970, height: 520, fill: 'rgba(255,255,255,0.1)', rx: 20, ry: 20, stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 },
				{ type: 'textbox', id: generateId(), left: 80, top: 80, width: 300, text: 'PREMIUM MEMBER', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter', fill: '#fbbf24', charSpacing: 100 },
				{ type: 'textbox', id: generateId(), left: 80, top: 150, width: 600, text: 'John Doe', fontSize: 48, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'memberName', property: 'text', description: 'Member name' }] },
				{ type: 'textbox', id: generateId(), left: 80, top: 230, width: 400, text: 'Member ID: MEM-2024-001', fontSize: 18, fontFamily: 'Inter', fill: '#c4b5fd', isVariable: true, variableBindings: [{ variableName: 'memberId', property: 'text', description: 'Member ID' }] },
				{ type: 'textbox', id: generateId(), left: 80, top: 350, width: 200, text: 'VALID THRU', fontSize: 12, fontFamily: 'Inter', fill: '#a78bfa' },
				{ type: 'textbox', id: generateId(), left: 80, top: 380, width: 200, text: '12/2025', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'validThru', property: 'text', description: 'Expiry date' }] },
				{ type: 'textbox', id: generateId(), left: 300, top: 350, width: 200, text: 'TIER', fontSize: 12, fontFamily: 'Inter', fill: '#a78bfa' },
				{ type: 'textbox', id: generateId(), left: 300, top: 380, width: 200, text: 'GOLD', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#fbbf24', isVariable: true, variableBindings: [{ variableName: 'tier', property: 'text', description: 'Membership tier' }] },
				{ type: 'circle', id: generateId(), left: 850, top: 400, radius: 60, fill: 'rgba(255,255,255,0.2)' }
			],
			background: '#1e1b4b'
		}
	};
}

/**
 * Event Invitation template
 */
export function getEventInvitationTemplate() {
	return {
		name: 'Event Invitation',
		type: 'og-image',
		width: 1080,
		height: 1080,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1080, height: 1080, fill: '#fdf2f8', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 60, top: 60, width: 960, height: 960, fill: '#ffffff', rx: 30, ry: 30, stroke: '#ec4899', strokeWidth: 3, shadow: { color: 'rgba(236,72,153,0.2)', blur: 20, offsetX: 0, offsetY: 10 } },
				{ type: 'textbox', id: generateId(), left: 120, top: 120, width: 840, text: "YOU'RE INVITED", fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ec4899', textAlign: 'center', charSpacing: 200 },
				{ type: 'textbox', id: generateId(), left: 120, top: 200, width: 840, text: 'Annual Gala Dinner', fontSize: 56, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1f2937', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'eventName', property: 'text', description: 'Event name' }] },
				{ type: 'rect', id: generateId(), left: 440, top: 320, width: 200, height: 4, fill: '#ec4899' },
				{ type: 'textbox', id: generateId(), left: 120, top: 380, width: 840, text: 'Saturday, February 14, 2024', fontSize: 28, fontFamily: 'Inter', fill: '#6b7280', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'eventDate', property: 'text', description: 'Event date' }] },
				{ type: 'textbox', id: generateId(), left: 120, top: 440, width: 840, text: '7:00 PM - 11:00 PM', fontSize: 24, fontFamily: 'Inter', fill: '#9ca3af', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'eventTime', property: 'text', description: 'Event time' }] },
				{ type: 'textbox', id: generateId(), left: 120, top: 540, width: 840, text: 'Grand Ballroom, The Ritz Hotel', fontSize: 22, fontFamily: 'Inter', fill: '#6b7280', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'venue', property: 'text', description: 'Venue' }] },
				{ type: 'textbox', id: generateId(), left: 120, top: 590, width: 840, text: '123 Luxury Lane, New York, NY', fontSize: 18, fontFamily: 'Inter', fill: '#9ca3af', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'address', property: 'text', description: 'Address' }] },
				{ type: 'rect', id: generateId(), left: 340, top: 720, width: 400, height: 70, fill: '#ec4899', rx: 35, ry: 35 },
				{ type: 'textbox', id: generateId(), left: 360, top: 738, width: 360, text: 'RSVP NOW', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' }
			],
			background: '#fdf2f8'
		}
	};
}

/**
 * Discount Coupon template
 */
export function getDiscountCouponTemplate() {
	return {
		name: 'Discount Coupon',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 630, fill: '#fef2f2', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 60, top: 60, width: 1080, height: 510, fill: '#ffffff', rx: 20, ry: 20, stroke: '#ef4444', strokeWidth: 3, strokeDashArray: [10, 5] },
				{ type: 'circle', id: generateId(), left: 30, top: 285, radius: 30, fill: '#fef2f2' },
				{ type: 'circle', id: generateId(), left: 1140, top: 285, radius: 30, fill: '#fef2f2' },
				{ type: 'textbox', id: generateId(), left: 100, top: 100, width: 600, text: '50% OFF', fontSize: 120, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ef4444', isVariable: true, variableBindings: [{ variableName: 'discount', property: 'text', description: 'Discount amount' }] },
				{ type: 'textbox', id: generateId(), left: 100, top: 250, width: 600, text: 'Your Next Purchase', fontSize: 36, fontFamily: 'Inter', fill: '#1f2937', isVariable: true, variableBindings: [{ variableName: 'offerText', property: 'text', description: 'Offer description' }] },
				{ type: 'rect', id: generateId(), left: 100, top: 340, width: 400, height: 60, fill: '#fef2f2', rx: 8, ry: 8, stroke: '#ef4444', strokeWidth: 2, strokeDashArray: [5, 3] },
				{ type: 'textbox', id: generateId(), left: 120, top: 355, width: 360, text: 'CODE: SAVE50', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ef4444', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'code', property: 'text', description: 'Coupon code' }] },
				{ type: 'textbox', id: generateId(), left: 100, top: 440, width: 500, text: 'Valid until: Dec 31, 2024', fontSize: 18, fontFamily: 'Inter', fill: '#9ca3af', isVariable: true, variableBindings: [{ variableName: 'expiry', property: 'text', description: 'Expiry date' }] },
				{ type: 'rect', id: generateId(), left: 750, top: 100, width: 350, height: 400, fill: '#ef4444', rx: 16, ry: 16 },
				{ type: 'textbox', id: generateId(), left: 770, top: 200, width: 310, text: 'SPECIAL OFFER', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 770, top: 280, width: 310, text: 'Limited Time Only!', fontSize: 20, fontFamily: 'Inter', fill: '#fecaca', textAlign: 'center' }
			],
			background: '#fef2f2'
		}
	};
}

/**
 * HTML Email template
 */
export function getHtmlEmailTemplate() {
	return {
		name: 'HTML Email to Image',
		type: 'og-image',
		width: 600,
		height: 800,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 600, height: 800, fill: '#f3f4f6', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 600, height: 80, fill: '#3b82f6', selectable: false, evented: false },
				{ type: 'textbox', id: generateId(), left: 30, top: 25, width: 300, text: 'COMPANY', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'companyName', property: 'text', description: 'Company name' }] },
				{ type: 'rect', id: generateId(), left: 30, top: 100, width: 540, height: 600, fill: '#ffffff', rx: 8, ry: 8, shadow: { color: 'rgba(0,0,0,0.1)', blur: 10, offsetX: 0, offsetY: 4 } },
				{ type: 'textbox', id: generateId(), left: 60, top: 140, width: 480, text: 'Newsletter Title', fontSize: 32, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1f2937', isVariable: true, variableBindings: [{ variableName: 'title', property: 'text', description: 'Email title' }] },
				{ type: 'rect', id: generateId(), left: 60, top: 200, width: 80, height: 4, fill: '#3b82f6' },
				{ type: 'textbox', id: generateId(), left: 60, top: 240, width: 480, text: 'Hi {name},\n\nWe have exciting news to share with you. Check out our latest updates and special offers.', fontSize: 16, fontFamily: 'Inter', fill: '#4b5563', lineHeight: 1.6, isVariable: true, variableBindings: [{ variableName: 'content', property: 'text', description: 'Email content' }] },
				{ type: 'rect', id: generateId(), left: 60, top: 450, width: 200, height: 50, fill: '#3b82f6', rx: 6, ry: 6 },
				{ type: 'textbox', id: generateId(), left: 80, top: 463, width: 160, text: 'Read More', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				{ type: 'rect', id: generateId(), left: 0, top: 720, width: 600, height: 80, fill: '#1f2937' },
				{ type: 'textbox', id: generateId(), left: 30, top: 745, width: 540, text: '© 2024 Company Inc. All rights reserved.', fontSize: 12, fontFamily: 'Inter', fill: '#9ca3af', textAlign: 'center' }
			],
			background: '#f3f4f6'
		}
	};
}

/**
 * Table to Image template
 */
export function getTableTemplate() {
	return {
		name: 'HTML Table to Image',
		type: 'og-image',
		width: 1200,
		height: 800,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 800, fill: '#f8fafc', selectable: false, evented: false },
				{ type: 'textbox', id: generateId(), left: 60, top: 40, width: 600, text: 'Data Report', fontSize: 36, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e293b', isVariable: true, variableBindings: [{ variableName: 'title', property: 'text', description: 'Table title' }] },
				{ type: 'textbox', id: generateId(), left: 60, top: 90, width: 400, text: 'Generated on Jan 15, 2024', fontSize: 14, fontFamily: 'Inter', fill: '#64748b', isVariable: true, variableBindings: [{ variableName: 'date', property: 'text', description: 'Report date' }] },
				// Table header
				{ type: 'rect', id: generateId(), left: 60, top: 140, width: 1080, height: 50, fill: '#1e293b', rx: 8, ry: 8 },
				{ type: 'textbox', id: generateId(), left: 80, top: 153, width: 200, text: 'Name', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff' },
				{ type: 'textbox', id: generateId(), left: 300, top: 153, width: 200, text: 'Category', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff' },
				{ type: 'textbox', id: generateId(), left: 520, top: 153, width: 200, text: 'Value', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff' },
				{ type: 'textbox', id: generateId(), left: 740, top: 153, width: 200, text: 'Status', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff' },
				{ type: 'textbox', id: generateId(), left: 960, top: 153, width: 160, text: 'Trend', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff' },
				// Table rows
				{ type: 'rect', id: generateId(), left: 60, top: 190, width: 1080, height: 50, fill: '#ffffff' },
				{ type: 'textbox', id: generateId(), left: 80, top: 203, width: 200, text: 'Product A', fontSize: 15, fontFamily: 'Inter', fill: '#334155', isVariable: true, variableBindings: [{ variableName: 'row1_name', property: 'text', description: 'Row 1 name' }] },
				{ type: 'textbox', id: generateId(), left: 300, top: 203, width: 200, text: 'Electronics', fontSize: 15, fontFamily: 'Inter', fill: '#64748b' },
				{ type: 'textbox', id: generateId(), left: 520, top: 203, width: 200, text: '$12,450', fontSize: 15, fontWeight: 'bold', fontFamily: 'Inter', fill: '#334155' },
				{ type: 'rect', id: generateId(), left: 740, top: 200, width: 80, height: 26, fill: '#dcfce7', rx: 13, ry: 13 },
				{ type: 'textbox', id: generateId(), left: 752, top: 203, width: 56, text: 'Active', fontSize: 12, fontFamily: 'Inter', fill: '#166534', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 960, top: 203, width: 100, text: '↑ 12%', fontSize: 15, fontWeight: 'bold', fontFamily: 'Inter', fill: '#16a34a' },
				// Row 2
				{ type: 'rect', id: generateId(), left: 60, top: 240, width: 1080, height: 50, fill: '#f8fafc' },
				{ type: 'textbox', id: generateId(), left: 80, top: 253, width: 200, text: 'Product B', fontSize: 15, fontFamily: 'Inter', fill: '#334155' },
				{ type: 'textbox', id: generateId(), left: 300, top: 253, width: 200, text: 'Software', fontSize: 15, fontFamily: 'Inter', fill: '#64748b' },
				{ type: 'textbox', id: generateId(), left: 520, top: 253, width: 200, text: '$8,920', fontSize: 15, fontWeight: 'bold', fontFamily: 'Inter', fill: '#334155' },
				{ type: 'rect', id: generateId(), left: 740, top: 250, width: 80, height: 26, fill: '#dcfce7', rx: 13, ry: 13 },
				{ type: 'textbox', id: generateId(), left: 752, top: 253, width: 56, text: 'Active', fontSize: 12, fontFamily: 'Inter', fill: '#166534', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 960, top: 253, width: 100, text: '↑ 8%', fontSize: 15, fontWeight: 'bold', fontFamily: 'Inter', fill: '#16a34a' },
				// Row 3
				{ type: 'rect', id: generateId(), left: 60, top: 290, width: 1080, height: 50, fill: '#ffffff' },
				{ type: 'textbox', id: generateId(), left: 80, top: 303, width: 200, text: 'Product C', fontSize: 15, fontFamily: 'Inter', fill: '#334155' },
				{ type: 'textbox', id: generateId(), left: 300, top: 303, width: 200, text: 'Services', fontSize: 15, fontFamily: 'Inter', fill: '#64748b' },
				{ type: 'textbox', id: generateId(), left: 520, top: 303, width: 200, text: '$5,200', fontSize: 15, fontWeight: 'bold', fontFamily: 'Inter', fill: '#334155' },
				{ type: 'rect', id: generateId(), left: 740, top: 300, width: 80, height: 26, fill: '#fef3c7', rx: 13, ry: 13 },
				{ type: 'textbox', id: generateId(), left: 752, top: 303, width: 56, text: 'Pending', fontSize: 12, fontFamily: 'Inter', fill: '#92400e', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 960, top: 303, width: 100, text: '↓ 3%', fontSize: 15, fontWeight: 'bold', fontFamily: 'Inter', fill: '#dc2626' }
			],
			background: '#f8fafc'
		}
	};
}

/**
 * Markdown to Image template
 */
export function getMarkdownTemplate() {
	return {
		name: 'Markdown to Image',
		type: 'og-image',
		width: 1200,
		height: 800,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 800, fill: '#1e1e1e', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 40, top: 40, width: 1120, height: 720, fill: '#282c34', rx: 12, ry: 12, stroke: '#3e4451', strokeWidth: 1 },
				// Header bar
				{ type: 'rect', id: generateId(), left: 40, top: 40, width: 1120, height: 45, fill: '#21252b', rx: 12, ry: 12 },
				{ type: 'rect', id: generateId(), left: 40, top: 73, width: 1120, height: 12, fill: '#21252b' },
				{ type: 'circle', id: generateId(), left: 60, top: 52, radius: 7, fill: '#e06c75' },
				{ type: 'circle', id: generateId(), left: 85, top: 52, radius: 7, fill: '#e5c07b' },
				{ type: 'circle', id: generateId(), left: 110, top: 52, radius: 7, fill: '#98c379' },
				{ type: 'textbox', id: generateId(), left: 550, top: 50, width: 200, text: 'README.md', fontSize: 14, fontFamily: 'JetBrains Mono, monospace', fill: '#abb2bf', textAlign: 'center' },
				// Content
				{ type: 'textbox', id: generateId(), left: 80, top: 120, width: 1040, text: '# Project Title', fontSize: 36, fontWeight: 'bold', fontFamily: 'Inter', fill: '#e5c07b', isVariable: true, variableBindings: [{ variableName: 'title', property: 'text', description: 'Document title' }] },
				{ type: 'textbox', id: generateId(), left: 80, top: 180, width: 1040, text: 'A brief description of what this project does and who it\'s for.', fontSize: 18, fontFamily: 'Inter', fill: '#abb2bf', lineHeight: 1.5, isVariable: true, variableBindings: [{ variableName: 'description', property: 'text', description: 'Description' }] },
				{ type: 'textbox', id: generateId(), left: 80, top: 260, width: 1040, text: '## Installation', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#61afef' },
				{ type: 'rect', id: generateId(), left: 80, top: 310, width: 1040, height: 80, fill: '#1e1e1e', rx: 6, ry: 6 },
				{ type: 'textbox', id: generateId(), left: 100, top: 330, width: 1000, text: 'npm install my-project', fontSize: 16, fontFamily: 'JetBrains Mono, monospace', fill: '#98c379' },
				{ type: 'textbox', id: generateId(), left: 80, top: 420, width: 1040, text: '## Features', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#61afef' },
				{ type: 'textbox', id: generateId(), left: 80, top: 470, width: 1040, text: '• Light/dark mode toggle\n• Live previews\n• Fullscreen mode\n• Cross platform', fontSize: 16, fontFamily: 'Inter', fill: '#abb2bf', lineHeight: 1.8, isVariable: true, variableBindings: [{ variableName: 'features', property: 'text', description: 'Feature list' }] }
			],
			background: '#1e1e1e'
		}
	};
}

/**
 * Code to Image template (enhanced)
 */
export function getCodeTemplate() {
	return {
		name: 'Code to Image',
		type: 'og-image',
		width: 1200,
		height: 800,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 800, fill: '#0d1117', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 60, top: 60, width: 1080, height: 680, fill: '#161b22', rx: 16, ry: 16, shadow: { color: 'rgba(0,0,0,0.5)', blur: 30, offsetX: 0, offsetY: 10 } },
				// Window header
				{ type: 'rect', id: generateId(), left: 60, top: 60, width: 1080, height: 50, fill: '#21262d', rx: 16, ry: 16 },
				{ type: 'rect', id: generateId(), left: 60, top: 94, width: 1080, height: 16, fill: '#21262d' },
				{ type: 'circle', id: generateId(), left: 90, top: 75, radius: 8, fill: '#ff5f56' },
				{ type: 'circle', id: generateId(), left: 120, top: 75, radius: 8, fill: '#ffbd2e' },
				{ type: 'circle', id: generateId(), left: 150, top: 75, radius: 8, fill: '#27c93f' },
				{ type: 'textbox', id: generateId(), left: 520, top: 72, width: 200, text: 'app.js', fontSize: 14, fontFamily: 'JetBrains Mono, monospace', fill: '#8b949e', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'filename', property: 'text', description: 'Filename' }] },
				// Line numbers
				{ type: 'textbox', id: generateId(), left: 80, top: 130, width: 40, text: '1\n2\n3\n4\n5\n6\n7\n8\n9', fontSize: 16, fontFamily: 'JetBrains Mono, monospace', fill: '#484f58', lineHeight: 1.8, textAlign: 'right' },
				// Code content
				{ type: 'textbox', id: generateId(), left: 140, top: 130, width: 980, text: 'const greeting = (name) => {\n  console.log(`Hello, ${name}!`);\n  return {\n    message: `Welcome, ${name}`,\n    timestamp: Date.now(),\n    success: true\n  };\n};\n\nexport default greeting;', fontSize: 16, fontFamily: 'JetBrains Mono, monospace', fill: '#c9d1d9', lineHeight: 1.8, isVariable: true, variableBindings: [{ variableName: 'code', property: 'text', description: 'Code content' }] },
				// Language badge
				{ type: 'rect', id: generateId(), left: 1020, top: 680, width: 100, height: 30, fill: '#238636', rx: 6, ry: 6 },
				{ type: 'textbox', id: generateId(), left: 1035, top: 686, width: 70, text: 'JavaScript', fontSize: 12, fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'language', property: 'text', description: 'Programming language' }] }
			],
			background: '#0d1117'
		}
	};
}

/**
 * JSON to Image template
 */
export function getJsonToImageTemplate() {
	return {
		name: 'JSON to Image',
		type: 'og-image',
		width: 1200,
		height: 800,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 800, fill: '#1a1a2e', selectable: false, evented: false },
				{ type: 'rect', id: generateId(), left: 50, top: 50, width: 1100, height: 700, fill: '#16213e', rx: 16, ry: 16, stroke: '#0f3460', strokeWidth: 2 },
				// Header
				{ type: 'rect', id: generateId(), left: 50, top: 50, width: 1100, height: 60, fill: '#0f3460', rx: 16, ry: 16 },
				{ type: 'rect', id: generateId(), left: 50, top: 94, width: 1100, height: 16, fill: '#0f3460' },
				{ type: 'textbox', id: generateId(), left: 80, top: 68, width: 200, text: '{ } JSON', fontSize: 20, fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace', fill: '#e94560' },
				{ type: 'textbox', id: generateId(), left: 900, top: 68, width: 200, text: 'data.json', fontSize: 14, fontFamily: 'JetBrains Mono, monospace', fill: '#94a3b8', textAlign: 'right', isVariable: true, variableBindings: [{ variableName: 'filename', property: 'text', description: 'Filename' }] },
				// JSON content
				{ type: 'textbox', id: generateId(), left: 80, top: 140, width: 1040, text: '{\n  "user": {\n    "id": 12345,\n    "name": "John Doe",\n    "email": "john@example.com",\n    "role": "admin",\n    "active": true\n  },\n  "settings": {\n    "theme": "dark",\n    "notifications": true\n  },\n  "lastLogin": "2024-01-15T10:30:00Z"\n}', fontSize: 16, fontFamily: 'JetBrains Mono, monospace', fill: '#a5f3fc', lineHeight: 1.6, isVariable: true, variableBindings: [{ variableName: 'json', property: 'text', description: 'JSON content' }] },
				// Decorative elements
				{ type: 'circle', id: generateId(), left: 1050, top: 650, radius: 40, fill: '#e94560', opacity: 0.3 },
				{ type: 'circle', id: generateId(), left: 1000, top: 680, radius: 25, fill: '#0f3460', opacity: 0.5 }
			],
			background: '#1a1a2e'
		}
	};
}

/**
 * Portfolio Card template
 */
export function getPortfolioCardTemplate() {
	return {
		name: 'Portfolio Card',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 630, fill: '#0f172a', selectable: false, evented: false },
				// Gradient overlay
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 600, height: 630, fill: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)', selectable: false, evented: false },
				// Content area
				{ type: 'rect', id: generateId(), left: 600, top: 0, width: 600, height: 630, fill: '#0f172a' },
				// Avatar placeholder
				{ type: 'circle', id: generateId(), left: 200, top: 200, radius: 100, fill: '#1e1b4b', stroke: '#ffffff', strokeWidth: 4 },
				{ type: 'textbox', id: generateId(), left: 200, top: 250, width: 200, text: 'JD', fontSize: 60, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				// Name and title
				{ type: 'textbox', id: generateId(), left: 650, top: 180, width: 500, text: 'John Doe', fontSize: 48, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'name', property: 'text', description: 'Full name' }] },
				{ type: 'textbox', id: generateId(), left: 650, top: 250, width: 500, text: 'Full Stack Developer', fontSize: 24, fontFamily: 'Inter', fill: '#a78bfa', isVariable: true, variableBindings: [{ variableName: 'title', property: 'text', description: 'Job title' }] },
				// Divider
				{ type: 'rect', id: generateId(), left: 650, top: 310, width: 100, height: 4, fill: '#6366f1' },
				// Skills
				{ type: 'textbox', id: generateId(), left: 650, top: 350, width: 500, text: 'React • Node.js • TypeScript • AWS', fontSize: 18, fontFamily: 'Inter', fill: '#94a3b8', isVariable: true, variableBindings: [{ variableName: 'skills', property: 'text', description: 'Skills list' }] },
				// Contact
				{ type: 'textbox', id: generateId(), left: 650, top: 420, width: 500, text: 'johndoe.dev', fontSize: 20, fontFamily: 'Inter', fill: '#e2e8f0', isVariable: true, variableBindings: [{ variableName: 'website', property: 'text', description: 'Website URL' }] },
				{ type: 'textbox', id: generateId(), left: 650, top: 460, width: 500, text: '@johndoe', fontSize: 18, fontFamily: 'Inter', fill: '#64748b', isVariable: true, variableBindings: [{ variableName: 'social', property: 'text', description: 'Social handle' }] }
			],
			background: '#0f172a'
		}
	};
}

/**
 * Resume Snapshot template
 */
export function getResumeSnapshotTemplate() {
	return {
		name: 'Resume Snapshot',
		type: 'og-image',
		width: 1200,
		height: 800,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 800, fill: '#ffffff', selectable: false, evented: false },
				// Sidebar
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 350, height: 800, fill: '#1e293b' },
				// Avatar area
				{ type: 'circle', id: generateId(), left: 125, top: 60, radius: 60, fill: '#334155' },
				{ type: 'textbox', id: generateId(), left: 125, top: 100, width: 120, text: 'JD', fontSize: 36, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				// Sidebar name
				{ type: 'textbox', id: generateId(), left: 30, top: 200, width: 290, text: 'John Doe', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'name', property: 'text', description: 'Full name' }] },
				{ type: 'textbox', id: generateId(), left: 30, top: 245, width: 290, text: 'Senior Developer', fontSize: 16, fontFamily: 'Inter', fill: '#94a3b8', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'title', property: 'text', description: 'Job title' }] },
				// Contact info
				{ type: 'textbox', id: generateId(), left: 30, top: 320, width: 290, text: 'CONTACT', fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter', fill: '#64748b', charSpacing: 100 },
				{ type: 'textbox', id: generateId(), left: 30, top: 350, width: 290, text: 'john@email.com', fontSize: 14, fontFamily: 'Inter', fill: '#e2e8f0', isVariable: true, variableBindings: [{ variableName: 'email', property: 'text', description: 'Email' }] },
				{ type: 'textbox', id: generateId(), left: 30, top: 380, width: 290, text: '+1 234 567 890', fontSize: 14, fontFamily: 'Inter', fill: '#e2e8f0' },
				// Skills
				{ type: 'textbox', id: generateId(), left: 30, top: 450, width: 290, text: 'SKILLS', fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter', fill: '#64748b', charSpacing: 100 },
				{ type: 'rect', id: generateId(), left: 30, top: 485, width: 200, height: 8, fill: '#334155', rx: 4, ry: 4 },
				{ type: 'rect', id: generateId(), left: 30, top: 485, width: 180, height: 8, fill: '#3b82f6', rx: 4, ry: 4 },
				{ type: 'textbox', id: generateId(), left: 30, top: 500, width: 150, text: 'JavaScript', fontSize: 12, fontFamily: 'Inter', fill: '#94a3b8' },
				{ type: 'rect', id: generateId(), left: 30, top: 530, width: 200, height: 8, fill: '#334155', rx: 4, ry: 4 },
				{ type: 'rect', id: generateId(), left: 30, top: 530, width: 160, height: 8, fill: '#10b981', rx: 4, ry: 4 },
				{ type: 'textbox', id: generateId(), left: 30, top: 545, width: 150, text: 'React', fontSize: 12, fontFamily: 'Inter', fill: '#94a3b8' },
				// Main content
				{ type: 'textbox', id: generateId(), left: 400, top: 60, width: 750, text: 'EXPERIENCE', fontSize: 14, fontWeight: 'bold', fontFamily: 'Inter', fill: '#64748b', charSpacing: 100 },
				{ type: 'textbox', id: generateId(), left: 400, top: 100, width: 750, text: 'Senior Software Engineer', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e293b', isVariable: true, variableBindings: [{ variableName: 'currentRole', property: 'text', description: 'Current role' }] },
				{ type: 'textbox', id: generateId(), left: 400, top: 140, width: 750, text: 'Tech Company Inc. | 2021 - Present', fontSize: 16, fontFamily: 'Inter', fill: '#64748b', isVariable: true, variableBindings: [{ variableName: 'company', property: 'text', description: 'Company and dates' }] },
				{ type: 'textbox', id: generateId(), left: 400, top: 180, width: 750, text: '• Led development of microservices architecture\n• Reduced deployment time by 60%\n• Mentored team of 5 junior developers', fontSize: 14, fontFamily: 'Inter', fill: '#475569', lineHeight: 1.8 }
			],
			background: '#ffffff'
		}
	};
}

/**
 * Menu Card template
 */
export function getMenuCardTemplate() {
	return {
		name: 'Menu Card',
		type: 'og-image',
		width: 1200,
		height: 800,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 800, fill: '#fef7ed', selectable: false, evented: false },
				// Decorative border
				{ type: 'rect', id: generateId(), left: 40, top: 40, width: 1120, height: 720, fill: 'transparent', stroke: '#92400e', strokeWidth: 2 },
				{ type: 'rect', id: generateId(), left: 50, top: 50, width: 1100, height: 700, fill: 'transparent', stroke: '#92400e', strokeWidth: 1 },
				// Header
				{ type: 'textbox', id: generateId(), left: 100, top: 80, width: 1000, text: 'LA BELLA CUCINA', fontSize: 42, fontWeight: 'bold', fontFamily: 'Georgia, serif', fill: '#92400e', textAlign: 'center', charSpacing: 150, isVariable: true, variableBindings: [{ variableName: 'restaurantName', property: 'text', description: 'Restaurant name' }] },
				{ type: 'textbox', id: generateId(), left: 100, top: 140, width: 1000, text: 'MENU', fontSize: 24, fontFamily: 'Georgia, serif', fill: '#b45309', textAlign: 'center', charSpacing: 200 },
				{ type: 'rect', id: generateId(), left: 500, top: 185, width: 200, height: 2, fill: '#92400e' },
				// Menu items
				{ type: 'textbox', id: generateId(), left: 100, top: 230, width: 500, text: 'APPETIZERS', fontSize: 18, fontWeight: 'bold', fontFamily: 'Georgia, serif', fill: '#92400e', charSpacing: 100 },
				{ type: 'textbox', id: generateId(), left: 100, top: 270, width: 800, text: 'Bruschetta Classica', fontSize: 20, fontFamily: 'Georgia, serif', fill: '#1c1917', isVariable: true, variableBindings: [{ variableName: 'item1', property: 'text', description: 'Menu item 1' }] },
				{ type: 'textbox', id: generateId(), left: 100, top: 300, width: 800, text: 'Fresh tomatoes, basil, garlic on toasted bread', fontSize: 14, fontFamily: 'Georgia, serif', fill: '#78716c', fontStyle: 'italic' },
				{ type: 'textbox', id: generateId(), left: 1000, top: 280, width: 100, text: '$12', fontSize: 20, fontWeight: 'bold', fontFamily: 'Georgia, serif', fill: '#92400e', textAlign: 'right', isVariable: true, variableBindings: [{ variableName: 'price1', property: 'text', description: 'Price 1' }] },
				// More items
				{ type: 'textbox', id: generateId(), left: 100, top: 360, width: 500, text: 'MAIN COURSES', fontSize: 18, fontWeight: 'bold', fontFamily: 'Georgia, serif', fill: '#92400e', charSpacing: 100 },
				{ type: 'textbox', id: generateId(), left: 100, top: 400, width: 800, text: 'Risotto ai Funghi', fontSize: 20, fontFamily: 'Georgia, serif', fill: '#1c1917', isVariable: true, variableBindings: [{ variableName: 'item2', property: 'text', description: 'Menu item 2' }] },
				{ type: 'textbox', id: generateId(), left: 100, top: 430, width: 800, text: 'Creamy arborio rice with wild mushrooms', fontSize: 14, fontFamily: 'Georgia, serif', fill: '#78716c', fontStyle: 'italic' },
				{ type: 'textbox', id: generateId(), left: 1000, top: 410, width: 100, text: '$28', fontSize: 20, fontWeight: 'bold', fontFamily: 'Georgia, serif', fill: '#92400e', textAlign: 'right' },
				{ type: 'textbox', id: generateId(), left: 100, top: 480, width: 800, text: 'Ossobuco alla Milanese', fontSize: 20, fontFamily: 'Georgia, serif', fill: '#1c1917' },
				{ type: 'textbox', id: generateId(), left: 100, top: 510, width: 800, text: 'Braised veal shank with gremolata', fontSize: 14, fontFamily: 'Georgia, serif', fill: '#78716c', fontStyle: 'italic' },
				{ type: 'textbox', id: generateId(), left: 1000, top: 490, width: 100, text: '$42', fontSize: 20, fontWeight: 'bold', fontFamily: 'Georgia, serif', fill: '#92400e', textAlign: 'right' },
				// Footer
				{ type: 'rect', id: generateId(), left: 500, top: 680, width: 200, height: 2, fill: '#92400e' },
				{ type: 'textbox', id: generateId(), left: 100, top: 700, width: 1000, text: 'Ask about our daily specials', fontSize: 14, fontFamily: 'Georgia, serif', fill: '#78716c', textAlign: 'center', fontStyle: 'italic' }
			],
			background: '#fef7ed'
		}
	};
}

/**
 * Real Estate Flyer template
 */
export function getRealEstateFlyerTemplate() {
	return {
		name: 'Real Estate Flyer',
		type: 'og-image',
		width: 1200,
		height: 800,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 800, fill: '#1e3a5f', selectable: false, evented: false },
				// Property image placeholder
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 700, height: 800, fill: '#2d5a87' },
				{ type: 'textbox', id: generateId(), left: 250, top: 350, width: 200, text: '🏠', fontSize: 100, textAlign: 'center' },
				// For Sale banner
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 200, height: 60, fill: '#ef4444' },
				{ type: 'textbox', id: generateId(), left: 20, top: 15, width: 160, text: 'FOR SALE', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				// Info panel
				{ type: 'rect', id: generateId(), left: 700, top: 0, width: 500, height: 800, fill: '#ffffff' },
				// Price
				{ type: 'textbox', id: generateId(), left: 740, top: 60, width: 420, text: '$875,000', fontSize: 48, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e3a5f', isVariable: true, variableBindings: [{ variableName: 'price', property: 'text', description: 'Property price' }] },
				// Address
				{ type: 'textbox', id: generateId(), left: 740, top: 130, width: 420, text: '123 Beautiful Lane', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#374151', isVariable: true, variableBindings: [{ variableName: 'address', property: 'text', description: 'Street address' }] },
				{ type: 'textbox', id: generateId(), left: 740, top: 170, width: 420, text: 'Los Angeles, CA 90210', fontSize: 18, fontFamily: 'Inter', fill: '#6b7280', isVariable: true, variableBindings: [{ variableName: 'city', property: 'text', description: 'City, State, ZIP' }] },
				// Divider
				{ type: 'rect', id: generateId(), left: 740, top: 220, width: 420, height: 2, fill: '#e5e7eb' },
				// Property details
				{ type: 'rect', id: generateId(), left: 740, top: 260, width: 130, height: 80, fill: '#f3f4f6', rx: 8, ry: 8 },
				{ type: 'textbox', id: generateId(), left: 755, top: 275, width: 100, text: '4', fontSize: 32, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e3a5f', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'bedrooms', property: 'text', description: 'Bedrooms' }] },
				{ type: 'textbox', id: generateId(), left: 755, top: 315, width: 100, text: 'Beds', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280', textAlign: 'center' },
				{ type: 'rect', id: generateId(), left: 885, top: 260, width: 130, height: 80, fill: '#f3f4f6', rx: 8, ry: 8 },
				{ type: 'textbox', id: generateId(), left: 900, top: 275, width: 100, text: '3', fontSize: 32, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e3a5f', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'bathrooms', property: 'text', description: 'Bathrooms' }] },
				{ type: 'textbox', id: generateId(), left: 900, top: 315, width: 100, text: 'Baths', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280', textAlign: 'center' },
				{ type: 'rect', id: generateId(), left: 1030, top: 260, width: 130, height: 80, fill: '#f3f4f6', rx: 8, ry: 8 },
				{ type: 'textbox', id: generateId(), left: 1045, top: 275, width: 100, text: '2,450', fontSize: 32, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e3a5f', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'sqft', property: 'text', description: 'Square feet' }] },
				{ type: 'textbox', id: generateId(), left: 1045, top: 315, width: 100, text: 'Sq Ft', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280', textAlign: 'center' },
				// Features
				{ type: 'textbox', id: generateId(), left: 740, top: 380, width: 420, text: 'Key Features', fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e3a5f' },
				{ type: 'textbox', id: generateId(), left: 740, top: 415, width: 420, text: '✓ Modern kitchen with granite countertops\n✓ Hardwood floors throughout\n✓ Large backyard with pool\n✓ Two-car garage', fontSize: 14, fontFamily: 'Inter', fill: '#4b5563', lineHeight: 1.8, isVariable: true, variableBindings: [{ variableName: 'features', property: 'text', description: 'Property features' }] },
				// Agent info
				{ type: 'rect', id: generateId(), left: 700, top: 620, width: 500, height: 180, fill: '#1e3a5f' },
				{ type: 'textbox', id: generateId(), left: 740, top: 650, width: 300, text: 'Jane Smith', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'agentName', property: 'text', description: 'Agent name' }] },
				{ type: 'textbox', id: generateId(), left: 740, top: 690, width: 300, text: 'Luxury Real Estate Agent', fontSize: 14, fontFamily: 'Inter', fill: '#94a3b8' },
				{ type: 'textbox', id: generateId(), left: 740, top: 730, width: 300, text: '(555) 123-4567', fontSize: 18, fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'phone', property: 'text', description: 'Phone number' }] },
				{ type: 'textbox', id: generateId(), left: 740, top: 760, width: 300, text: 'jane@realestate.com', fontSize: 14, fontFamily: 'Inter', fill: '#94a3b8', isVariable: true, variableBindings: [{ variableName: 'email', property: 'text', description: 'Email' }] }
			],
			background: '#1e3a5f'
		}
	};
}

/**
 * Sports Score Card template
 */
export function getSportsScoreCardTemplate() {
	return {
		name: 'Sports Score Card',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 630, fill: '#1a1a2e', selectable: false, evented: false },
				// Gradient accent
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 8, fill: 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #eab308 100%)' },
				// Live indicator
				{ type: 'rect', id: generateId(), left: 50, top: 40, width: 80, height: 32, fill: '#ef4444', rx: 4, ry: 4 },
				{ type: 'circle', id: generateId(), left: 65, top: 50, radius: 5, fill: '#ffffff' },
				{ type: 'textbox', id: generateId(), left: 80, top: 46, width: 40, text: 'LIVE', fontSize: 14, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff' },
				// Match info
				{ type: 'textbox', id: generateId(), left: 150, top: 44, width: 400, text: 'NBA Finals - Game 7', fontSize: 16, fontFamily: 'Inter', fill: '#9ca3af', isVariable: true, variableBindings: [{ variableName: 'matchInfo', property: 'text', description: 'Match info' }] },
				// Team 1
				{ type: 'rect', id: generateId(), left: 50, top: 120, width: 500, height: 180, fill: '#16213e', rx: 16, ry: 16 },
				{ type: 'circle', id: generateId(), left: 90, top: 170, radius: 50, fill: '#374151' },
				{ type: 'textbox', id: generateId(), left: 90, top: 200, width: 100, text: 'LAL', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#fbbf24', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 200, top: 160, width: 300, text: 'Lakers', fontSize: 36, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'team1', property: 'text', description: 'Team 1 name' }] },
				{ type: 'textbox', id: generateId(), left: 200, top: 210, width: 200, text: 'Los Angeles', fontSize: 16, fontFamily: 'Inter', fill: '#6b7280' },
				{ type: 'textbox', id: generateId(), left: 420, top: 160, width: 100, text: '108', fontSize: 72, fontWeight: 'bold', fontFamily: 'Inter', fill: '#fbbf24', textAlign: 'right', isVariable: true, variableBindings: [{ variableName: 'score1', property: 'text', description: 'Team 1 score' }] },
				// VS
				{ type: 'textbox', id: generateId(), left: 550, top: 190, width: 100, text: 'VS', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#4b5563', textAlign: 'center' },
				// Team 2
				{ type: 'rect', id: generateId(), left: 650, top: 120, width: 500, height: 180, fill: '#16213e', rx: 16, ry: 16 },
				{ type: 'textbox', id: generateId(), left: 680, top: 160, width: 100, text: '104', fontSize: 72, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ef4444', isVariable: true, variableBindings: [{ variableName: 'score2', property: 'text', description: 'Team 2 score' }] },
				{ type: 'textbox', id: generateId(), left: 800, top: 160, width: 300, text: 'Celtics', fontSize: 36, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'team2', property: 'text', description: 'Team 2 name' }] },
				{ type: 'textbox', id: generateId(), left: 800, top: 210, width: 200, text: 'Boston', fontSize: 16, fontFamily: 'Inter', fill: '#6b7280' },
				{ type: 'circle', id: generateId(), left: 1010, top: 170, radius: 50, fill: '#374151' },
				{ type: 'textbox', id: generateId(), left: 1010, top: 200, width: 100, text: 'BOS', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#22c55e', textAlign: 'center' },
				// Game time
				{ type: 'rect', id: generateId(), left: 450, top: 340, width: 300, height: 60, fill: '#0f3460', rx: 8, ry: 8 },
				{ type: 'textbox', id: generateId(), left: 470, top: 355, width: 260, text: 'Q4 - 2:45', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'gameTime', property: 'text', description: 'Game time' }] },
				// Stats bar
				{ type: 'rect', id: generateId(), left: 50, top: 440, width: 1100, height: 140, fill: '#0f3460', rx: 12, ry: 12 },
				{ type: 'textbox', id: generateId(), left: 100, top: 470, width: 150, text: 'FG%', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280' },
				{ type: 'textbox', id: generateId(), left: 100, top: 500, width: 150, text: '48.2%', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff' },
				{ type: 'textbox', id: generateId(), left: 350, top: 470, width: 150, text: 'REBOUNDS', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280' },
				{ type: 'textbox', id: generateId(), left: 350, top: 500, width: 150, text: '42', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff' },
				{ type: 'textbox', id: generateId(), left: 600, top: 470, width: 150, text: 'ASSISTS', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280' },
				{ type: 'textbox', id: generateId(), left: 600, top: 500, width: 150, text: '28', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff' },
				{ type: 'textbox', id: generateId(), left: 850, top: 470, width: 150, text: '3PT%', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280' },
				{ type: 'textbox', id: generateId(), left: 850, top: 500, width: 150, text: '38.5%', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff' }
			],
			background: '#1a1a2e'
		}
	};
}

/**
 * Weather Widget template
 */
export function getWeatherWidgetTemplate() {
	return {
		name: 'Weather Widget',
		type: 'og-image',
		width: 800,
		height: 600,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 800, height: 600, fill: 'linear-gradient(180deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)', selectable: false, evented: false },
				// Sun decoration
				{ type: 'circle', id: generateId(), left: 550, top: 50, radius: 80, fill: '#fbbf24', shadow: { color: 'rgba(251,191,36,0.5)', blur: 40, offsetX: 0, offsetY: 0 } },
				// Cloud decorations
				{ type: 'circle', id: generateId(), left: 100, top: 100, radius: 50, fill: 'rgba(255,255,255,0.3)' },
				{ type: 'circle', id: generateId(), left: 150, top: 90, radius: 60, fill: 'rgba(255,255,255,0.3)' },
				{ type: 'circle', id: generateId(), left: 200, top: 110, radius: 45, fill: 'rgba(255,255,255,0.3)' },
				// Location
				{ type: 'textbox', id: generateId(), left: 60, top: 200, width: 400, text: 'San Francisco', fontSize: 36, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'location', property: 'text', description: 'City name' }] },
				{ type: 'textbox', id: generateId(), left: 60, top: 250, width: 400, text: 'California, USA', fontSize: 18, fontFamily: 'Inter', fill: 'rgba(255,255,255,0.8)', isVariable: true, variableBindings: [{ variableName: 'region', property: 'text', description: 'Region/Country' }] },
				// Temperature
				{ type: 'textbox', id: generateId(), left: 60, top: 300, width: 300, text: '72°', fontSize: 140, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'temperature', property: 'text', description: 'Temperature' }] },
				{ type: 'textbox', id: generateId(), left: 280, top: 320, width: 100, text: 'F', fontSize: 48, fontFamily: 'Inter', fill: 'rgba(255,255,255,0.7)' },
				// Condition
				{ type: 'textbox', id: generateId(), left: 60, top: 450, width: 300, text: 'Sunny', fontSize: 28, fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'condition', property: 'text', description: 'Weather condition' }] },
				// Details card
				{ type: 'rect', id: generateId(), left: 450, top: 250, width: 300, height: 300, fill: 'rgba(255,255,255,0.2)', rx: 20, ry: 20 },
				{ type: 'textbox', id: generateId(), left: 480, top: 280, width: 120, text: 'Humidity', fontSize: 14, fontFamily: 'Inter', fill: 'rgba(255,255,255,0.8)' },
				{ type: 'textbox', id: generateId(), left: 480, top: 305, width: 120, text: '45%', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'humidity', property: 'text', description: 'Humidity %' }] },
				{ type: 'textbox', id: generateId(), left: 620, top: 280, width: 120, text: 'Wind', fontSize: 14, fontFamily: 'Inter', fill: 'rgba(255,255,255,0.8)' },
				{ type: 'textbox', id: generateId(), left: 620, top: 305, width: 120, text: '12 mph', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'wind', property: 'text', description: 'Wind speed' }] },
				{ type: 'rect', id: generateId(), left: 480, top: 370, width: 240, height: 1, fill: 'rgba(255,255,255,0.3)' },
				{ type: 'textbox', id: generateId(), left: 480, top: 400, width: 120, text: 'High', fontSize: 14, fontFamily: 'Inter', fill: 'rgba(255,255,255,0.8)' },
				{ type: 'textbox', id: generateId(), left: 480, top: 425, width: 120, text: '78°', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'high', property: 'text', description: 'High temp' }] },
				{ type: 'textbox', id: generateId(), left: 620, top: 400, width: 120, text: 'Low', fontSize: 14, fontFamily: 'Inter', fill: 'rgba(255,255,255,0.8)' },
				{ type: 'textbox', id: generateId(), left: 620, top: 425, width: 120, text: '64°', fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'low', property: 'text', description: 'Low temp' }] },
				{ type: 'rect', id: generateId(), left: 480, top: 480, width: 240, height: 1, fill: 'rgba(255,255,255,0.3)' },
				{ type: 'textbox', id: generateId(), left: 480, top: 500, width: 240, text: 'Updated: 2:30 PM', fontSize: 12, fontFamily: 'Inter', fill: 'rgba(255,255,255,0.6)', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'updated', property: 'text', description: 'Last updated' }] }
			],
			background: '#0ea5e9'
		}
	};
}

/**
 * Stock Chart Image template
 */
export function getStockChartTemplate() {
	return {
		name: 'Stock Chart Image',
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 1200, height: 630, fill: '#0a0a0a', selectable: false, evented: false },
				// Header
				{ type: 'textbox', id: generateId(), left: 60, top: 40, width: 200, text: 'AAPL', fontSize: 48, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'symbol', property: 'text', description: 'Stock symbol' }] },
				{ type: 'textbox', id: generateId(), left: 60, top: 100, width: 300, text: 'Apple Inc.', fontSize: 18, fontFamily: 'Inter', fill: '#6b7280', isVariable: true, variableBindings: [{ variableName: 'companyName', property: 'text', description: 'Company name' }] },
				// Price
				{ type: 'textbox', id: generateId(), left: 400, top: 40, width: 250, text: '$178.52', fontSize: 56, fontWeight: 'bold', fontFamily: 'Inter', fill: '#22c55e', isVariable: true, variableBindings: [{ variableName: 'price', property: 'text', description: 'Current price' }] },
				{ type: 'textbox', id: generateId(), left: 400, top: 110, width: 200, text: '+$3.24 (+1.85%)', fontSize: 20, fontFamily: 'Inter', fill: '#22c55e', isVariable: true, variableBindings: [{ variableName: 'change', property: 'text', description: 'Price change' }] },
				// Time period buttons
				{ type: 'rect', id: generateId(), left: 800, top: 50, width: 60, height: 35, fill: 'transparent', stroke: '#374151', strokeWidth: 1, rx: 4, ry: 4 },
				{ type: 'textbox', id: generateId(), left: 815, top: 58, width: 30, text: '1D', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280' },
				{ type: 'rect', id: generateId(), left: 870, top: 50, width: 60, height: 35, fill: 'transparent', stroke: '#374151', strokeWidth: 1, rx: 4, ry: 4 },
				{ type: 'textbox', id: generateId(), left: 885, top: 58, width: 30, text: '1W', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280' },
				{ type: 'rect', id: generateId(), left: 940, top: 50, width: 60, height: 35, fill: '#22c55e', rx: 4, ry: 4 },
				{ type: 'textbox', id: generateId(), left: 955, top: 58, width: 30, text: '1M', fontSize: 14, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff' },
				{ type: 'rect', id: generateId(), left: 1010, top: 50, width: 60, height: 35, fill: 'transparent', stroke: '#374151', strokeWidth: 1, rx: 4, ry: 4 },
				{ type: 'textbox', id: generateId(), left: 1025, top: 58, width: 30, text: '1Y', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280' },
				{ type: 'rect', id: generateId(), left: 1080, top: 50, width: 60, height: 35, fill: 'transparent', stroke: '#374151', strokeWidth: 1, rx: 4, ry: 4 },
				{ type: 'textbox', id: generateId(), left: 1092, top: 58, width: 40, text: 'ALL', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280' },
				// Chart area
				{ type: 'rect', id: generateId(), left: 60, top: 160, width: 1080, height: 300, fill: '#111111', rx: 8, ry: 8 },
				// Simulated chart line (simplified)
				{ type: 'line', id: generateId(), x1: 100, y1: 400, x2: 200, y2: 380, stroke: '#22c55e', strokeWidth: 3 },
				{ type: 'line', id: generateId(), x1: 200, y1: 380, x2: 300, y2: 350, stroke: '#22c55e', strokeWidth: 3 },
				{ type: 'line', id: generateId(), x1: 300, y1: 350, x2: 400, y2: 370, stroke: '#22c55e', strokeWidth: 3 },
				{ type: 'line', id: generateId(), x1: 400, y1: 370, x2: 500, y2: 320, stroke: '#22c55e', strokeWidth: 3 },
				{ type: 'line', id: generateId(), x1: 500, y1: 320, x2: 600, y2: 280, stroke: '#22c55e', strokeWidth: 3 },
				{ type: 'line', id: generateId(), x1: 600, y1: 280, x2: 700, y2: 300, stroke: '#22c55e', strokeWidth: 3 },
				{ type: 'line', id: generateId(), x1: 700, y1: 300, x2: 800, y2: 260, stroke: '#22c55e', strokeWidth: 3 },
				{ type: 'line', id: generateId(), x1: 800, y1: 260, x2: 900, y2: 240, stroke: '#22c55e', strokeWidth: 3 },
				{ type: 'line', id: generateId(), x1: 900, y1: 240, x2: 1000, y2: 220, stroke: '#22c55e', strokeWidth: 3 },
				{ type: 'line', id: generateId(), x1: 1000, y1: 220, x2: 1100, y2: 200, stroke: '#22c55e', strokeWidth: 3 },
				// Stats row
				{ type: 'rect', id: generateId(), left: 60, top: 500, width: 250, height: 90, fill: '#111111', rx: 8, ry: 8 },
				{ type: 'textbox', id: generateId(), left: 80, top: 520, width: 100, text: 'Open', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280' },
				{ type: 'textbox', id: generateId(), left: 80, top: 545, width: 150, text: '$175.28', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'open', property: 'text', description: 'Open price' }] },
				{ type: 'rect', id: generateId(), left: 340, top: 500, width: 250, height: 90, fill: '#111111', rx: 8, ry: 8 },
				{ type: 'textbox', id: generateId(), left: 360, top: 520, width: 100, text: 'High', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280' },
				{ type: 'textbox', id: generateId(), left: 360, top: 545, width: 150, text: '$179.89', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#22c55e', isVariable: true, variableBindings: [{ variableName: 'high', property: 'text', description: 'High price' }] },
				{ type: 'rect', id: generateId(), left: 620, top: 500, width: 250, height: 90, fill: '#111111', rx: 8, ry: 8 },
				{ type: 'textbox', id: generateId(), left: 640, top: 520, width: 100, text: 'Low', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280' },
				{ type: 'textbox', id: generateId(), left: 640, top: 545, width: 150, text: '$174.52', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ef4444', isVariable: true, variableBindings: [{ variableName: 'low', property: 'text', description: 'Low price' }] },
				{ type: 'rect', id: generateId(), left: 900, top: 500, width: 240, height: 90, fill: '#111111', rx: 8, ry: 8 },
				{ type: 'textbox', id: generateId(), left: 920, top: 520, width: 100, text: 'Volume', fontSize: 14, fontFamily: 'Inter', fill: '#6b7280' },
				{ type: 'textbox', id: generateId(), left: 920, top: 545, width: 180, text: '52.3M', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', isVariable: true, variableBindings: [{ variableName: 'volume', property: 'text', description: 'Trading volume' }] }
			],
			background: '#0a0a0a'
		}
	};
}

/**
 * Infographic template
 */
export function getInfographicTemplate() {
	return {
		name: 'Infographic',
		type: 'og-image',
		width: 800,
		height: 1200,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 800, height: 1200, fill: '#ffffff', selectable: false, evented: false },
				// Header
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 800, height: 200, fill: '#3b82f6' },
				{ type: 'textbox', id: generateId(), left: 50, top: 50, width: 700, text: '5 Tips for Better Productivity', fontSize: 42, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'title', property: 'text', description: 'Infographic title' }] },
				{ type: 'textbox', id: generateId(), left: 50, top: 120, width: 700, text: 'Boost your efficiency with these proven strategies', fontSize: 18, fontFamily: 'Inter', fill: 'rgba(255,255,255,0.9)', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'subtitle', property: 'text', description: 'Subtitle' }] },
				// Item 1
				{ type: 'circle', id: generateId(), left: 50, top: 250, radius: 40, fill: '#3b82f6' },
				{ type: 'textbox', id: generateId(), left: 50, top: 275, width: 80, text: '1', fontSize: 36, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 150, top: 250, width: 600, text: 'Start Your Day Early', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e293b', isVariable: true, variableBindings: [{ variableName: 'tip1Title', property: 'text', description: 'Tip 1 title' }] },
				{ type: 'textbox', id: generateId(), left: 150, top: 290, width: 600, text: 'Early risers have more productive hours and better focus.', fontSize: 16, fontFamily: 'Inter', fill: '#64748b', isVariable: true, variableBindings: [{ variableName: 'tip1Desc', property: 'text', description: 'Tip 1 description' }] },
				// Connector line
				{ type: 'line', id: generateId(), x1: 90, y1: 340, x2: 90, y2: 410, stroke: '#e2e8f0', strokeWidth: 3 },
				// Item 2
				{ type: 'circle', id: generateId(), left: 50, top: 420, radius: 40, fill: '#10b981' },
				{ type: 'textbox', id: generateId(), left: 50, top: 445, width: 80, text: '2', fontSize: 36, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 150, top: 420, width: 600, text: 'Eliminate Distractions', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e293b', isVariable: true, variableBindings: [{ variableName: 'tip2Title', property: 'text', description: 'Tip 2 title' }] },
				{ type: 'textbox', id: generateId(), left: 150, top: 460, width: 600, text: 'Turn off notifications and create a focused workspace.', fontSize: 16, fontFamily: 'Inter', fill: '#64748b' },
				// Connector line
				{ type: 'line', id: generateId(), x1: 90, y1: 510, x2: 90, y2: 580, stroke: '#e2e8f0', strokeWidth: 3 },
				// Item 3
				{ type: 'circle', id: generateId(), left: 50, top: 590, radius: 40, fill: '#f59e0b' },
				{ type: 'textbox', id: generateId(), left: 50, top: 615, width: 80, text: '3', fontSize: 36, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 150, top: 590, width: 600, text: 'Take Regular Breaks', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e293b', isVariable: true, variableBindings: [{ variableName: 'tip3Title', property: 'text', description: 'Tip 3 title' }] },
				{ type: 'textbox', id: generateId(), left: 150, top: 630, width: 600, text: 'Short breaks improve concentration and prevent burnout.', fontSize: 16, fontFamily: 'Inter', fill: '#64748b' },
				// Connector line
				{ type: 'line', id: generateId(), x1: 90, y1: 680, x2: 90, y2: 750, stroke: '#e2e8f0', strokeWidth: 3 },
				// Item 4
				{ type: 'circle', id: generateId(), left: 50, top: 760, radius: 40, fill: '#8b5cf6' },
				{ type: 'textbox', id: generateId(), left: 50, top: 785, width: 80, text: '4', fontSize: 36, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 150, top: 760, width: 600, text: 'Prioritize Important Tasks', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e293b', isVariable: true, variableBindings: [{ variableName: 'tip4Title', property: 'text', description: 'Tip 4 title' }] },
				{ type: 'textbox', id: generateId(), left: 150, top: 800, width: 600, text: 'Focus on high-impact tasks first using the 80/20 rule.', fontSize: 16, fontFamily: 'Inter', fill: '#64748b' },
				// Connector line
				{ type: 'line', id: generateId(), x1: 90, y1: 850, x2: 90, y2: 920, stroke: '#e2e8f0', strokeWidth: 3 },
				// Item 5
				{ type: 'circle', id: generateId(), left: 50, top: 930, radius: 40, fill: '#ef4444' },
				{ type: 'textbox', id: generateId(), left: 50, top: 955, width: 80, text: '5', fontSize: 36, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', textAlign: 'center' },
				{ type: 'textbox', id: generateId(), left: 150, top: 930, width: 600, text: 'Review and Reflect', fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e293b', isVariable: true, variableBindings: [{ variableName: 'tip5Title', property: 'text', description: 'Tip 5 title' }] },
				{ type: 'textbox', id: generateId(), left: 150, top: 970, width: 600, text: 'End each day by reviewing accomplishments and planning tomorrow.', fontSize: 16, fontFamily: 'Inter', fill: '#64748b' },
				// Footer
				{ type: 'rect', id: generateId(), left: 0, top: 1100, width: 800, height: 100, fill: '#f8fafc' },
				{ type: 'textbox', id: generateId(), left: 50, top: 1130, width: 700, text: 'Source: Productivity Research Institute | www.example.com', fontSize: 14, fontFamily: 'Inter', fill: '#94a3b8', textAlign: 'center', isVariable: true, variableBindings: [{ variableName: 'source', property: 'text', description: 'Source attribution' }] }
			],
			background: '#ffffff'
		}
	};
}

/**
 * Meme Generator template
 */
export function getMemeGeneratorTemplate() {
	return {
		name: 'Meme Generator',
		type: 'og-image',
		width: 800,
		height: 800,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				{ type: 'rect', id: generateId(), left: 0, top: 0, width: 800, height: 800, fill: '#1a1a1a', selectable: false, evented: false },
				// Image placeholder
				{ type: 'rect', id: generateId(), left: 0, top: 100, width: 800, height: 600, fill: '#2a2a2a' },
				{ type: 'textbox', id: generateId(), left: 300, top: 350, width: 200, text: '📷', fontSize: 100, textAlign: 'center' },
				// Top text
				{ type: 'textbox', id: generateId(), left: 20, top: 120, width: 760, text: 'TOP TEXT', fontSize: 64, fontWeight: 'bold', fontFamily: 'Impact, sans-serif', fill: '#ffffff', textAlign: 'center', stroke: '#000000', strokeWidth: 4, isVariable: true, variableBindings: [{ variableName: 'topText', property: 'text', description: 'Top meme text' }] },
				// Bottom text
				{ type: 'textbox', id: generateId(), left: 20, top: 620, width: 760, text: 'BOTTOM TEXT', fontSize: 64, fontWeight: 'bold', fontFamily: 'Impact, sans-serif', fill: '#ffffff', textAlign: 'center', stroke: '#000000', strokeWidth: 4, isVariable: true, variableBindings: [{ variableName: 'bottomText', property: 'text', description: 'Bottom meme text' }] },
				// Watermark
				{ type: 'textbox', id: generateId(), left: 600, top: 760, width: 180, text: 'made with Pictify', fontSize: 14, fontFamily: 'Inter', fill: '#666666', textAlign: 'right' }
			],
			background: '#1a1a1a'
		}
	};
}

/**
 * Generic template for use cases that don't have a specific design
 */
export function getGenericTemplate(useCaseId, label) {
	return {
		name: `${label} Template`,
		type: 'og-image',
		width: 1200,
		height: 630,
		fabricJSData: createBaseTemplate({
			width: 1200,
			height: 630,
			backgroundColor: '#FFFDF8',
			badgeText: useCaseId.toUpperCase().replace(/-/g, ' ').slice(0, 12),
			badgeColor: '#ff6b6b',
			title: label,
			subtitle: 'Customize this template with your content',
			titleVariable: 'title',
			subtitleVariable: 'subtitle'
		})
	};
}

/**
 * Map of use case IDs to their template generators
 */
export const useCaseTemplateMap = {
	// Original 20 templates
	'certificate': getCertificateTemplate,
	'badge': getBadgeTemplate,
	'quote-card': getQuoteCardTemplate,
	'tweet-card': getTweetCardTemplate,
	'product-banner': getProductBannerTemplate,
	'pricing-card': getPricingCardTemplate,
	'changelog-card': getChangelogCardTemplate,
	'testimonial': getTestimonialTemplate,
	'receipt': getReceiptTemplate,
	'webinar-promo': getWebinarPromoTemplate,
	'event-ticket': getEventTicketTemplate,
	'kpi-card': getKpiCardTemplate,
	'leaderboard': getLeaderboardTemplate,
	'status-update': getStatusUpdateTemplate,
	'job-post': getJobPostTemplate,
	'feature-flag-banner': getFeatureFlagBannerTemplate,
	'report-cover': getReportCoverTemplate,
	'roadmap-card': getRoadmapCardTemplate,
	'release-notes-card': getReleaseNotesCardTemplate,
	'api-response-card': getApiResponseCardTemplate,
	// Phase 3.1 templates - social media & content
	'youtube-thumbnail': getYoutubeThumbnailTemplate,
	'linkedin-banner': getLinkedinBannerTemplate,
	'podcast-cover': getPodcastCoverTemplate,
	'twitter-header': getTwitterHeaderTemplate,
	'instagram-story': getInstagramStoryTemplate,
	'email-header': getEmailHeaderTemplate,
	'blog-featured-image': getBlogFeaturedImageTemplate,
	'course-certificate': getCourseCertificateTemplate,
	'membership-card': getMembershipCardTemplate,
	'event-invitation': getEventInvitationTemplate,
	'discount-coupon': getDiscountCouponTemplate,
	// Additional templates - technical & data
	'html-email': getHtmlEmailTemplate,
	'table': getTableTemplate,
	'markdown': getMarkdownTemplate,
	'code': getCodeTemplate,
	'json-to-image': getJsonToImageTemplate,
	// Professional & business templates
	'portfolio-card': getPortfolioCardTemplate,
	'resume-snapshot': getResumeSnapshotTemplate,
	'menu-card': getMenuCardTemplate,
	'real-estate-flyer': getRealEstateFlyerTemplate,
	// Dynamic data templates
	'sports-score-card': getSportsScoreCardTemplate,
	'weather-widget': getWeatherWidgetTemplate,
	'stock-chart': getStockChartTemplate,
	// Creative templates
	'infographic': getInfographicTemplate,
	'meme-generator': getMemeGeneratorTemplate
};

/**
 * Get the FabricJS template for a use case
 * @param {string} useCaseId - The use case ID from config.js
 * @param {string} label - The label for the use case (used for generic templates)
 * @returns {Object} Template object with name, type, width, height, and fabricJSData
 */
export function getTemplateForUseCase(useCaseId, label) {
	const templateFn = useCaseTemplateMap[useCaseId];
	if (templateFn) {
		return templateFn();
	}
	return getGenericTemplate(useCaseId, label);
}
