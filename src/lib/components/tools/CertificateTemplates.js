const generateId = () => Math.random().toString(36).substring(2, 10);

/**
 * Template 1: Elegant/Classic
 * Cream background, gold borders, Georgia font, decorative dashed inner border.
 * Ported from getCertificateTemplate() in useCaseTemplates.js with added achievementText variable.
 */
function getElegantTemplate() {
	return {
		id: 'elegant',
		name: 'Elegant',
		description: 'Classic formal certificate with gold borders and elegant serif typography',
		thumbnailColor: '#c8a76b',
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
				// Decorative outer border
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
				// Inner decorative dashed border
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
				// Corner flourish top-left
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 80,
					width: 40,
					height: 40,
					fill: '#c8a76b',
					rx: 4,
					ry: 4,
					opacity: 0.3
				},
				// Corner flourish top-right
				{
					type: 'rect',
					id: generateId(),
					left: 1800,
					top: 80,
					width: 40,
					height: 40,
					fill: '#c8a76b',
					rx: 4,
					ry: 4,
					opacity: 0.3
				},
				// Corner flourish bottom-left
				{
					type: 'rect',
					id: generateId(),
					left: 80,
					top: 960,
					width: 40,
					height: 40,
					fill: '#c8a76b',
					rx: 4,
					ry: 4,
					opacity: 0.3
				},
				// Corner flourish bottom-right
				{
					type: 'rect',
					id: generateId(),
					left: 1800,
					top: 960,
					width: 40,
					height: 40,
					fill: '#c8a76b',
					rx: 4,
					ry: 4,
					opacity: 0.3
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
				// Organization name (variable)
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
				// Achievement text (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 500,
					width: 1520,
					text: 'for successfully completing the Advanced JavaScript Course',
					fontSize: 22,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b5b47',
					textAlign: 'center',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'achievementText',
							property: 'text',
							description: 'Description of the achievement'
						}
					]
				},
				// Decorative gold divider line
				{
					type: 'line',
					id: generateId(),
					left: 660,
					top: 570,
					x1: 0,
					y1: 0,
					x2: 600,
					y2: 0,
					stroke: '#c8a76b',
					strokeWidth: 2
				},
				// Date label
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 600,
					width: 1520,
					text: 'Awarded on',
					fontSize: 16,
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
					top: 635,
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
 * Template 2: Modern Dark
 * Dark background (#1a1a2e), white text, Inter font, purple accent bar (#6c63ff), clean minimal layout.
 */
function getModernDarkTemplate() {
	return {
		id: 'modern-dark',
		name: 'Modern Dark',
		description: 'Sleek dark theme with purple accents and clean sans-serif typography',
		thumbnailColor: '#6c63ff',
		width: 1920,
		height: 1080,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// Dark background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1920,
					height: 1080,
					fill: '#1a1a2e',
					selectable: false,
					evented: false
				},
				// Top accent bar
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1920,
					height: 8,
					fill: '#6c63ff',
					selectable: false,
					evented: false
				},
				// Bottom accent bar
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 1072,
					width: 1920,
					height: 8,
					fill: '#6c63ff',
					selectable: false,
					evented: false
				},
				// Left vertical accent line
				{
					type: 'rect',
					id: generateId(),
					left: 100,
					top: 80,
					width: 4,
					height: 920,
					fill: '#6c63ff',
					opacity: 0.6
				},
				// Certificate title
				{
					type: 'textbox',
					id: generateId(),
					left: 160,
					top: 120,
					width: 1640,
					text: 'CERTIFICATE',
					fontSize: 20,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#6c63ff',
					textAlign: 'left',
					letterSpacing: 600
				},
				// Of achievement subtitle
				{
					type: 'textbox',
					id: generateId(),
					left: 160,
					top: 160,
					width: 1640,
					text: 'OF ACHIEVEMENT',
					fontSize: 48,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'left'
				},
				// Thin separator line
				{
					type: 'line',
					id: generateId(),
					left: 160,
					top: 240,
					x1: 0,
					y1: 0,
					x2: 200,
					y2: 0,
					stroke: '#6c63ff',
					strokeWidth: 3
				},
				// "Presented to" text
				{
					type: 'textbox',
					id: generateId(),
					left: 160,
					top: 280,
					width: 1640,
					text: 'This certificate is presented to',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#8888a8',
					textAlign: 'left'
				},
				// Recipient name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 160,
					top: 330,
					width: 1640,
					text: 'Recipient Name',
					fontSize: 72,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'left',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'recipientName',
							property: 'text',
							description: 'Name of the certificate recipient'
						}
					]
				},
				// Achievement text (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 160,
					top: 450,
					width: 1520,
					text: 'for successfully completing the Advanced JavaScript Course',
					fontSize: 22,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#8888a8',
					textAlign: 'left',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'achievementText',
							property: 'text',
							description: 'Description of the achievement'
						}
					]
				},
				// Organization name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 160,
					top: 540,
					width: 1640,
					text: 'Your Organization Name',
					fontSize: 32,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#6c63ff',
					textAlign: 'left',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'organizationName',
							property: 'text',
							description: 'Name of the organization'
						}
					]
				},
				// Date label
				{
					type: 'textbox',
					id: generateId(),
					left: 160,
					top: 700,
					width: 400,
					text: 'DATE',
					fontSize: 12,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#6c63ff',
					textAlign: 'left',
					letterSpacing: 300
				},
				// Date (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 160,
					top: 725,
					width: 400,
					text: 'December 14, 2024',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'left',
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
					left: 160,
					top: 880,
					x1: 0,
					y1: 0,
					x2: 300,
					y2: 0,
					stroke: '#444466',
					strokeWidth: 1
				},
				// Signature label 1
				{
					type: 'textbox',
					id: generateId(),
					left: 160,
					top: 890,
					width: 300,
					text: 'Instructor',
					fontSize: 14,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#8888a8',
					textAlign: 'center'
				},
				// Signature line 2
				{
					type: 'line',
					id: generateId(),
					left: 600,
					top: 880,
					x1: 0,
					y1: 0,
					x2: 300,
					y2: 0,
					stroke: '#444466',
					strokeWidth: 1
				},
				// Signature label 2
				{
					type: 'textbox',
					id: generateId(),
					left: 600,
					top: 890,
					width: 300,
					text: 'Director',
					fontSize: 14,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#8888a8',
					textAlign: 'center'
				},
				// Decorative circle element top-right
				{
					type: 'circle',
					id: generateId(),
					left: 1680,
					top: 80,
					radius: 80,
					fill: 'transparent',
					stroke: '#6c63ff',
					strokeWidth: 1,
					opacity: 0.2
				},
				// Decorative circle element top-right (smaller)
				{
					type: 'circle',
					id: generateId(),
					left: 1720,
					top: 120,
					radius: 40,
					fill: 'transparent',
					stroke: '#6c63ff',
					strokeWidth: 1,
					opacity: 0.15
				}
			],
			background: '#1a1a2e'
		}
	};
}

/**
 * Template 3: Corporate
 * White background, navy blue (#1e3a5f) header rectangle, professional serif+sans mix,
 * subtle gray bottom border, formal and businesslike.
 */
function getCorporateTemplate() {
	return {
		id: 'corporate',
		name: 'Corporate',
		description: 'Professional corporate design with navy header and formal layout',
		thumbnailColor: '#1e3a5f',
		width: 1920,
		height: 1080,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// White background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1920,
					height: 1080,
					fill: '#ffffff',
					selectable: false,
					evented: false
				},
				// Navy header band
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1920,
					height: 200,
					fill: '#1e3a5f'
				},
				// Gold accent strip below header
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 200,
					width: 1920,
					height: 6,
					fill: '#c9a84c'
				},
				// Subtle gray bottom border
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 1060,
					width: 1920,
					height: 20,
					fill: '#1e3a5f'
				},
				// Certificate title in header
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 50,
					width: 1680,
					text: 'CERTIFICATE OF ACHIEVEMENT',
					fontSize: 28,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ffffff',
					textAlign: 'center',
					letterSpacing: 500
				},
				// Organization name in header (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 110,
					width: 1680,
					text: 'Your Organization Name',
					fontSize: 44,
					fontWeight: 'bold',
					fontFamily: 'Georgia',
					fill: '#ffffff',
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
					top: 280,
					width: 1680,
					text: 'This is to certify that',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#666666',
					textAlign: 'center'
				},
				// Recipient name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 340,
					width: 1680,
					text: 'Recipient Name',
					fontSize: 68,
					fontWeight: 'bold',
					fontFamily: 'Georgia',
					fill: '#1e3a5f',
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
				// Underline below recipient name
				{
					type: 'line',
					id: generateId(),
					left: 460,
					top: 430,
					x1: 0,
					y1: 0,
					x2: 1000,
					y2: 0,
					stroke: '#c9a84c',
					strokeWidth: 2
				},
				// Achievement text (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 470,
					width: 1520,
					text: 'for successfully completing the Advanced JavaScript Course',
					fontSize: 22,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#444444',
					textAlign: 'center',
					isVariable: true,
					variableBindings: [
						{
							variableName: 'achievementText',
							property: 'text',
							description: 'Description of the achievement'
						}
					]
				},
				// Date label
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 560,
					width: 1520,
					text: 'Date of Issuance',
					fontSize: 14,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#999999',
					textAlign: 'center',
					letterSpacing: 200
				},
				// Date (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 590,
					width: 1520,
					text: 'December 14, 2024',
					fontSize: 26,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#1e3a5f',
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
				// Left decorative vertical stripe
				{
					type: 'rect',
					id: generateId(),
					left: 60,
					top: 240,
					width: 3,
					height: 760,
					fill: '#e8e8e8'
				},
				// Right decorative vertical stripe
				{
					type: 'rect',
					id: generateId(),
					left: 1857,
					top: 240,
					width: 3,
					height: 760,
					fill: '#e8e8e8'
				},
				// Signature line 1
				{
					type: 'line',
					id: generateId(),
					left: 300,
					top: 860,
					x1: 0,
					y1: 0,
					x2: 350,
					y2: 0,
					stroke: '#1e3a5f',
					strokeWidth: 2
				},
				// Signature label 1
				{
					type: 'textbox',
					id: generateId(),
					left: 300,
					top: 872,
					width: 350,
					text: 'Authorized Signatory',
					fontSize: 14,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#888888',
					textAlign: 'center'
				},
				// Signature line 2
				{
					type: 'line',
					id: generateId(),
					left: 1270,
					top: 860,
					x1: 0,
					y1: 0,
					x2: 350,
					y2: 0,
					stroke: '#1e3a5f',
					strokeWidth: 2
				},
				// Signature label 2
				{
					type: 'textbox',
					id: generateId(),
					left: 1270,
					top: 872,
					width: 350,
					text: 'Executive Director',
					fontSize: 14,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#888888',
					textAlign: 'center'
				},
				// Certificate number placeholder
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 970,
					width: 1680,
					text: 'Certificate No. 2024-001',
					fontSize: 12,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#bbbbbb',
					textAlign: 'center',
					letterSpacing: 200
				}
			],
			background: '#ffffff'
		}
	};
}

/**
 * Template 4: Minimalist
 * Pure white background, very thin gray border (#e5e7eb), large centered Inter typography,
 * lots of whitespace, understated elegance.
 */
function getMinimalistTemplate() {
	return {
		id: 'minimalist',
		name: 'Minimalist',
		description: 'Clean minimal design with generous whitespace and refined typography',
		thumbnailColor: '#374151',
		width: 1920,
		height: 1080,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// White background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1920,
					height: 1080,
					fill: '#ffffff',
					selectable: false,
					evented: false
				},
				// Thin outer border
				{
					type: 'rect',
					id: generateId(),
					left: 40,
					top: 40,
					width: 1840,
					height: 1000,
					fill: 'transparent',
					stroke: '#e5e7eb',
					strokeWidth: 1
				},
				// Certificate label
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 140,
					width: 1680,
					text: 'CERTIFICATE',
					fontSize: 14,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#9ca3af',
					textAlign: 'center',
					letterSpacing: 800
				},
				// Title
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 180,
					width: 1680,
					text: 'of Achievement',
					fontSize: 44,
					fontWeight: 'normal',
					fontFamily: 'Georgia',
					fill: '#374151',
					textAlign: 'center'
				},
				// Thin horizontal rule
				{
					type: 'line',
					id: generateId(),
					left: 860,
					top: 260,
					x1: 0,
					y1: 0,
					x2: 200,
					y2: 0,
					stroke: '#d1d5db',
					strokeWidth: 1
				},
				// "Presented to" text
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 300,
					width: 1680,
					text: 'Presented to',
					fontSize: 16,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#9ca3af',
					textAlign: 'center'
				},
				// Recipient name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 360,
					width: 1680,
					text: 'Recipient Name',
					fontSize: 80,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#111827',
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
				// Achievement text (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 300,
					top: 490,
					width: 1320,
					text: 'for successfully completing the Advanced JavaScript Course',
					fontSize: 20,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#6b7280',
					textAlign: 'center',
					lineHeight: 1.6,
					isVariable: true,
					variableBindings: [
						{
							variableName: 'achievementText',
							property: 'text',
							description: 'Description of the achievement'
						}
					]
				},
				// Organization name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 590,
					width: 1680,
					text: 'Your Organization Name',
					fontSize: 24,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#374151',
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
				// Date (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 120,
					top: 650,
					width: 1680,
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
							description: 'Date of certificate issuance'
						}
					]
				},
				// Signature line 1
				{
					type: 'line',
					id: generateId(),
					left: 400,
					top: 860,
					x1: 0,
					y1: 0,
					x2: 280,
					y2: 0,
					stroke: '#d1d5db',
					strokeWidth: 1
				},
				// Signature label 1
				{
					type: 'textbox',
					id: generateId(),
					left: 400,
					top: 872,
					width: 280,
					text: 'Instructor',
					fontSize: 12,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#9ca3af',
					textAlign: 'center'
				},
				// Signature line 2
				{
					type: 'line',
					id: generateId(),
					left: 1240,
					top: 860,
					x1: 0,
					y1: 0,
					x2: 280,
					y2: 0,
					stroke: '#d1d5db',
					strokeWidth: 1
				},
				// Signature label 2
				{
					type: 'textbox',
					id: generateId(),
					left: 1240,
					top: 872,
					width: 280,
					text: 'Director',
					fontSize: 12,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#9ca3af',
					textAlign: 'center'
				}
			],
			background: '#ffffff'
		}
	};
}

/**
 * Template 5: Creative
 * White background with coral/red accent (#ff6b6b), bold colored rectangle as side accent,
 * playful but professional, Inter font, shadow effects via overlapping colored rectangles.
 */
function getCreativeTemplate() {
	return {
		id: 'creative',
		name: 'Creative',
		description: 'Bold and colorful design with coral accents and playful geometric elements',
		thumbnailColor: '#ff6b6b',
		width: 1920,
		height: 1080,
		fabricJSData: {
			version: '6.0.0',
			objects: [
				// White background
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 1920,
					height: 1080,
					fill: '#ffffff',
					selectable: false,
					evented: false
				},
				// Left accent bar
				{
					type: 'rect',
					id: generateId(),
					left: 0,
					top: 0,
					width: 80,
					height: 1080,
					fill: '#ff6b6b'
				},
				// Shadow rectangle behind main content area
				{
					type: 'rect',
					id: generateId(),
					left: 134,
					top: 54,
					width: 1720,
					height: 976,
					fill: '#ffe0e0',
					rx: 12,
					ry: 12
				},
				// Main content area
				{
					type: 'rect',
					id: generateId(),
					left: 126,
					top: 46,
					width: 1720,
					height: 976,
					fill: '#ffffff',
					stroke: '#ff6b6b',
					strokeWidth: 3,
					rx: 12,
					ry: 12
				},
				// Top-right decorative circle (large)
				{
					type: 'circle',
					id: generateId(),
					left: 1620,
					top: 60,
					radius: 100,
					fill: '#fff0f0',
					stroke: '#ff6b6b',
					strokeWidth: 2,
					opacity: 0.5
				},
				// Top-right decorative circle (small)
				{
					type: 'circle',
					id: generateId(),
					left: 1700,
					top: 140,
					radius: 40,
					fill: '#ff6b6b',
					opacity: 0.15
				},
				// Bottom-left decorative circle
				{
					type: 'circle',
					id: generateId(),
					left: 140,
					top: 880,
					radius: 60,
					fill: '#ff6b6b',
					opacity: 0.1
				},
				// Small accent dot
				{
					type: 'circle',
					id: generateId(),
					left: 940,
					top: 120,
					radius: 6,
					fill: '#ff6b6b'
				},
				// Certificate label
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 130,
					width: 1560,
					text: 'CERTIFICATE OF ACHIEVEMENT',
					fontSize: 18,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ff6b6b',
					textAlign: 'center',
					letterSpacing: 600
				},
				// Decorative line under title
				{
					type: 'line',
					id: generateId(),
					left: 760,
					top: 175,
					x1: 0,
					y1: 0,
					x2: 400,
					y2: 0,
					stroke: '#ff6b6b',
					strokeWidth: 3
				},
				// "Proudly awarded to" text
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 210,
					width: 1560,
					text: 'Proudly awarded to',
					fontSize: 18,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#888888',
					textAlign: 'center'
				},
				// Recipient name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 270,
					width: 1560,
					text: 'Recipient Name',
					fontSize: 76,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#2d2d2d',
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
				// Accent underline for name
				{
					type: 'rect',
					id: generateId(),
					left: 600,
					top: 380,
					width: 720,
					height: 6,
					fill: '#ff6b6b',
					rx: 3,
					ry: 3
				},
				// Achievement text (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 260,
					top: 420,
					width: 1440,
					text: 'for successfully completing the Advanced JavaScript Course',
					fontSize: 22,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#666666',
					textAlign: 'center',
					lineHeight: 1.5,
					isVariable: true,
					variableBindings: [
						{
							variableName: 'achievementText',
							property: 'text',
							description: 'Description of the achievement'
						}
					]
				},
				// "Issued by" label
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 520,
					width: 1560,
					text: 'Issued by',
					fontSize: 14,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#aaaaaa',
					textAlign: 'center'
				},
				// Organization name (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 550,
					width: 1560,
					text: 'Your Organization Name',
					fontSize: 34,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#ff6b6b',
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
				// Date label
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 640,
					width: 1560,
					text: 'Date',
					fontSize: 12,
					fontWeight: 'bold',
					fontFamily: 'Inter',
					fill: '#cccccc',
					textAlign: 'center',
					letterSpacing: 300
				},
				// Date (variable)
				{
					type: 'textbox',
					id: generateId(),
					left: 200,
					top: 665,
					width: 1560,
					text: 'December 14, 2024',
					fontSize: 22,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#2d2d2d',
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
					left: 340,
					top: 870,
					x1: 0,
					y1: 0,
					x2: 300,
					y2: 0,
					stroke: '#ff6b6b',
					strokeWidth: 2
				},
				// Signature label 1
				{
					type: 'textbox',
					id: generateId(),
					left: 340,
					top: 882,
					width: 300,
					text: 'Instructor',
					fontSize: 13,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#999999',
					textAlign: 'center'
				},
				// Signature line 2
				{
					type: 'line',
					id: generateId(),
					left: 1280,
					top: 870,
					x1: 0,
					y1: 0,
					x2: 300,
					y2: 0,
					stroke: '#ff6b6b',
					strokeWidth: 2
				},
				// Signature label 2
				{
					type: 'textbox',
					id: generateId(),
					left: 1280,
					top: 882,
					width: 300,
					text: 'Director',
					fontSize: 13,
					fontWeight: 'normal',
					fontFamily: 'Inter',
					fill: '#999999',
					textAlign: 'center'
				}
			],
			background: '#ffffff'
		}
	};
}

export const certificateTemplates = [
	getElegantTemplate(),
	getModernDarkTemplate(),
	getCorporateTemplate(),
	getMinimalistTemplate(),
	getCreativeTemplate()
];
