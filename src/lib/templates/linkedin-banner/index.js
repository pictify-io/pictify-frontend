// LinkedIn Banner Templates Registry
// All templates are 1584 x 396 pixels

// Variable types for template customization
// Each variable has: id (matches element id), label (display name), type (text/badge/stat), default value
// Variables are rendered as input fields in the editor

// Developer Templates
export const developerTemplates = [
	{
		id: 'dev-dark-terminal',
		category: 'developer',
		name: 'Dark Terminal',
		popular: true,
		variables: [
			{ id: 'template-badge', label: 'Badge', type: 'text', default: 'Open to Work' },
			{ id: 'template-heading', label: 'Name', type: 'text', default: 'Your Name' },
			{
				id: 'template-subheading',
				label: 'Title',
				type: 'text',
				default: 'Full Stack Developer • React • Node.js'
			}
		],
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #0d1117;
      --secondary-color: #58a6ff;
      --tertiary-color: #8b949e;
      --accent-glow: rgba(88, 166, 255, 0.15);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      /* Left padding increased to 280px to clear profile picture safe zone */
      padding: 0 60px 0 600px;
      position: relative;
      overflow: hidden;
    }
    .grid-bg {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 50px 50px;
      mask-image: linear-gradient(to bottom, black, transparent);
    }
    .glow {
      position: absolute;
      width: 600px;
      height: 600px;
      background: var(--accent-glow);
      border-radius: 50%;
      filter: blur(80px);
      top: -100px;
      right: -100px;
      opacity: 0.6;
    }
    .window-chrome {
      position: absolute;
      top: 50%;
      right: -80px;
      transform: translateY(-50%);
      width: 480px;
      background: rgba(22, 27, 34, 0.6);
      border: 1px solid #30363d;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      padding: 20px;
      z-index: 1; /* Moved behind main content */
      backdrop-filter: blur(4px);
    }
    .chrome-header {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #30363d;
    }
    .dot { width: 12px; height: 12px; border-radius: 50%; }
    .red { background: #ff5f56; }
    .yellow { background: #ffbd2e; }
    .green { background: #27ca40; }

    .main-content {
      position: relative;
      z-index: 10;
      max-width: 500px; /* Limit text width to avoid crowd */
      text-shadow: 0 2px 10px rgba(13, 17, 23, 0.8); /* readable text */
    }
    h1 {
      font-size: 56px;
      font-weight: 800;
      color: #f0f6fc;
      margin-bottom: 12px;
      letter-spacing: -1.5px;
      line-height: 1.1;
      text-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    h1 span { color: var(--secondary-color); }
    p {
      font-size: 20px;
      color: var(--tertiary-color);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      background: rgba(56, 139, 253, 0.15);
      color: var(--secondary-color);
      font-size: 14px;
      font-weight: 600;
      border: 1px solid rgba(56, 139, 253, 0.4);
    }
    .code-block {
      font-size: 14px;
      line-height: 1.6;
      font-family: 'JetBrains Mono', monospace;
    }
    .k { color: #ff7b72; } /* Keyword */
    .f { color: #d2a8ff; } /* Function */
    .s { color: #a5d6ff; } /* String */
    .c { color: #8b949e; } /* Comment */
  </style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="glow"></div>

  <div class="main-content">
    <div class="badge" id="template-badge">Open to Work</div>
    <h1 id="template-heading"><span>&lt;/&gt;</span> Your Name</h1>
    <p id="template-subheading">Full Stack Developer • React • Node.js</p>
  </div>

  <div class="window-chrome">
    <div class="chrome-header">
      <div class="dot red"></div>
      <div class="dot yellow"></div>
      <div class="dot green"></div>
    </div>
    <div class="code-block">
      <span class="k">const</span> <span class="f">profile</span> = {<br>
      &nbsp;&nbsp;<span class="k">current</span>: <span class="s">'Building next-gen tools'</span>,<br>
      &nbsp;&nbsp;<span class="k">stack</span>: [<span class="s">'TypeScript'</span>, <span class="s">'Rust'</span>, <span class="s">'Go'</span>],<br>
      &nbsp;&nbsp;<span class="k">status</span>: <span class="s">'Ship it 🚀'</span><br>
      };
    </div>
  </div>
</body>
</html>`
	},
	{
		id: 'dev-gradient-tech',
		category: 'developer',
		name: 'Gradient Tech',
		popular: false,
		variables: [
			{ id: 'template-heading', label: 'Name', type: 'text', default: 'Your Name' },
			{
				id: 'template-subheading',
				label: 'Title',
				type: 'text',
				default: 'Software Engineer | Building the Future'
			}
		],
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --secondary-color: #ffffff;
      --tertiary-color: rgba(255,255,255,0.8);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 60px 48px 600px;
      position: relative;
    }
    .shapes {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }
    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
    }
    .shape-1 { width: 200px; height: 200px; top: -50px; right: 100px; }
    .shape-2 { width: 150px; height: 150px; bottom: -30px; right: 300px; }
    .shape-3 { width: 100px; height: 100px; top: 50px; right: 500px; }
    .content { position: relative; z-index: 1; }
    h1 {
      font-size: 72px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 16px;
      letter-spacing: -2px;
    }
    p {
      font-size: 28px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="shapes">
    <div class="shape shape-1"></div>
    <div class="shape shape-2"></div>
    <div class="shape shape-3"></div>
  </div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Software Engineer | Building the Future</p>
  </div>
</body>
</html>`
	},
	{
		id: 'dev-minimal-code',
		category: 'developer',
		name: 'Minimal Code',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #fafafa;
      --secondary-color: #18181b;
      --tertiary-color: #71717a;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      /* Shifted right for safe zone */
      padding: 0 60px 0 600px;
      position: relative;
      border-top: 8px solid #3b82f6;
    }
    .content { width: 100%; }
    h1 {
      font-size: 72px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 16px;
      letter-spacing: -2px;
    }
    p {
      font-size: 26px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
    .tech-stack {
      display: flex;
      gap: 12px;
      margin-top: 32px;
    }
    .tech-badge {
      padding: 10px 18px;
      background: #fff;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #3f3f46;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: #ccc; }
    .dot-act { background: #3b82f6; }
  </style>
</head>
<body>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Senior Software Engineer</p>
    <div class="tech-stack">
      <span class="tech-badge"><span class="dot dot-act"></span> React</span>
      <span class="tech-badge"><span class="dot dot-act"></span> TypeScript</span>
      <span class="tech-badge"><span class="dot"></span> Node.js</span>
      <span class="tech-badge"><span class="dot"></span> AWS</span>
    </div>
  </div>
</body>
</html>`
	},
	{
		id: 'dev-blueprint',
		category: 'developer',
		name: 'Code Architect',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #0f172a;
      --secondary-color: #38bdf8;
      --tertiary-color: #94a3b8;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'JetBrains Mono', monospace;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 0 60px 0 650px; /* Safe Zone */
      position: relative;
      overflow: hidden;
    }
    /* Blueprint Grid */
    .grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    /* Technical Markings */
    .ruler-top {
      position: absolute;
      top: 0; left: 0; right: 0; height: 20px;
      border-bottom: 1px solid rgba(56, 189, 248, 0.3);
      display: flex;
      justify-content: space-between;
      padding: 0 10px;
    }
    .mark { width: 1px; height: 100%; background: rgba(56, 189, 248, 0.3); }

    .content { position: relative; z-index: 10; }
    
    .frame {
      border: 2px dashed rgba(56, 189, 248, 0.4);
      padding: 40px;
      position: relative;
    }
    .frame::before {
      content: ''; position: absolute; top: -2px; left: -2px; width: 20px; height: 20px;
      border-top: 2px solid #38bdf8; border-left: 2px solid #38bdf8;
    }
    .frame::after {
      content: ''; position: absolute; bottom: -2px; right: -2px; width: 20px; height: 20px;
      border-bottom: 2px solid #38bdf8; border-right: 2px solid #38bdf8;
    }

    h1 {
      font-size: 64px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 12px;
      letter-spacing: -2px;
      text-transform: uppercase;
    }
    h1 span { color: var(--secondary-color); }
    
    p {
      font-size: 24px;
      color: var(--secondary-color);
      font-weight: 500;
      margin-bottom: 24px;
    }
    
    .specs {
      display: grid;
      grid-template-columns: auto auto;
      gap: 16px 40px;
      font-size: 14px;
      color: var(--tertiary-color);
    }
    .spec-item { display: flex; gap: 8px; }
    .spec-label { color: #38bdf8; opacity: 0.7; }

  </style>
</head>
<body>
  <div class="grid"></div>
  <div class="ruler-top">
    <div class="mark"></div><div class="mark"></div><div class="mark"></div><div class="mark"></div>
  </div>
  
  <div class="content">
    <div class="frame">
      <h1 id="template-heading">Your <span>Name</span></h1>
      <p id="template-subheading">System Architect_ v2.0</p>
      
      <div class="specs">
        <div class="spec-item"><span class="spec-label">STACK:</span> <span id="template-stack">React / Node / AWS</span></div>
        <div class="spec-item"><span class="spec-label">STATUS:</span> <span id="template-status">Deploying...</span></div>
        <div class="spec-item"><span class="spec-label">ROLE:</span> <span id="template-role">Tech Lead</span></div>
        <div class="spec-item"><span class="spec-label">EXP:</span> <span id="template-experience">10+ Years</span></div>
      </div>
    </div>
  </div>
</body>
</html>`
	}
];

// Designer Templates
export const designerTemplates = [
	{
		id: 'designer-creative',
		category: 'designer',
		name: 'Creative Bold',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #ffffff;
      --secondary-color: #000000;
      --tertiary-color: #4b5563;
      --accent-color: #ff3e3e;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      position: relative;
      overflow: hidden;
    }
    .grid {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: 568px 1fr 1fr;
      grid-template-rows: 1fr;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    .col {
      border-right: 1px solid #e5e5e5;
      height: 100%;
      position: relative;
    }
    .col-1 { background: #f9f9f9; } /* Safe zone areaish */
    .col-2 {
      padding: 60px 40px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .col-3 {
      background: #000;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    h1 {
      font-size: 64px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 0px;
      letter-spacing: -2px;
      line-height: 0.9;
      text-transform: uppercase;
    }
    p {
      font-size: 20px;
      color: var(--tertiary-color);
      font-weight: 500;
      margin-top: 24px;
      border-top: 4px solid var(--accent-color);
      padding-top: 20px;
      display: inline-block;
      max-width: 300px;
    }

    .big-glyph {
      font-size: 400px;
      font-weight: 900;
      opacity: 0.15;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    .vertical-text {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 4px;
      text-transform: uppercase;
      position: absolute;
      right: 20px;
      bottom: 20px;
      color: rgba(255,255,255,0.5);
    }
  </style>
</head>
<body>
  <div class="grid">
    <div class="col col-1">
      <!-- Left column reserved for profile picture visual balance -->
    </div>
    <div class="col col-2">
      <h1 id="template-heading">Your Name</h1>
      <p id="template-subheading">Senior Product Designer &amp; Art Director</p>
    </div>
    <div class="col col-3">
      <div class="big-glyph">Aa</div>
      <div class="vertical-text" id="template-tagline">Portfolio 2026</div>
    </div>
  </div>
</body>
</html>`
	},
	{
		id: 'designer-minimal',
		category: 'designer',
		name: 'Minimal Elegance',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #ffffff;
      --secondary-color: #000000;
      --tertiary-color: #525252;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      /* Padding left 300px to strictly avoid safe zone */
      padding: 0 60px 0 600px;
      position: relative;
    }
    .accent-bar {
      position: absolute;
      top: 60px;
      right: 60px;
      width: 120px;
      height: 8px;
      background: #000;
    }
    h1 {
      font-size: 82px;
      font-weight: 300;
      color: var(--secondary-color);
      margin-bottom: 20px;
      letter-spacing: -3px;
    }
    h1 span { font-weight: 700; }

    .meta-group {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    p {
      font-size: 22px;
      color: var(--tertiary-color);
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .separator {
      width: 40px;
      height: 1px;
      background: #e5e5e5;
    }
    .status {
      font-size: 14px;
      font-weight: 600;
      color: #16a34a;
      background: #dcfce7;
      padding: 6px 12px;
      border-radius: 100px;
    }
  </style>
</head>
<body>
  <div class="accent-bar"></div>
  <div class="content">
    <h1 id="template-heading">Your <span>Name</span></h1>
    <div class="meta-group">
      <p id="template-subheading">UI/UX Designer</p>
      <div class="separator"></div>
      <div class="status" id="template-status">Available</div>
    </div>
  </div>
</body>
</html>`
	},
	{
		id: 'designer-dark-studio',
		category: 'designer',
		name: 'Dark Studio',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #18181b;
      --secondary-color: #fafafa;
      --tertiary-color: #a1a1aa;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 60px 48px 600px;
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .gradient-blur {
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.4;
    }
    .blur-1 { background: #ec4899; right: 100px; top: -100px; }
    .blur-2 { background: #8b5cf6; right: 250px; bottom: -150px; }
    .content { position: relative; z-index: 1; }
    h1 {
      font-size: 76px;
      font-weight: 700;
      color: var(--secondary-color);
      margin-bottom: 16px;
      letter-spacing: -2px;
    }
    p {
      font-size: 26px;
      color: var(--tertiary-color);
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div class="gradient-blur blur-1"></div>
  <div class="gradient-blur blur-2"></div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Creative Director | Brand & Product Design</p>
  </div>
</body>
</html>`
	},
	{
		id: 'designer-bauhaus',
		category: 'designer',
		name: 'Bauhaus Studio',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #f0f0f0;
      --secondary-color: #111;
      --tertiary-color: #444;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 0 60px 0 650px;
      position: relative;
      overflow: hidden;
    }
    /* Bauhaus Geometry */
    .shape-container {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 600px;
      overflow: hidden;
    }
    .circle-red {
      position: absolute;
      width: 400px;
      height: 400px;
      background: #ef4444;
      border-radius: 50%;
      top: -100px;
      right: -50px;
      mix-blend-mode: multiply;
      opacity: 0.8;
    }
    .rect-blue {
      position: absolute;
      width: 200px;
      height: 500px;
      background: #3b82f6;
      top: -50px;
      right: 300px;
      transform: rotate(15deg);
      mix-blend-mode: multiply;
      opacity: 0.8;
    }
    .tri-yellow {
      position: absolute;
      width: 0; height: 0;
      border-left: 150px solid transparent;
      border-right: 150px solid transparent;
      border-bottom: 300px solid #eab308;
      bottom: -100px;
      right: 150px;
      mix-blend-mode: multiply;
      opacity: 0.8;
    }

    .content { position: relative; z-index: 10; }
    h1 {
      font-size: 80px;
      font-weight: 900;
      color: var(--secondary-color);
      margin-bottom: 0;
      letter-spacing: -3px;
      line-height: 0.9;
    }
    .line {
      width: 100px;
      height: 8px;
      background: #000;
      margin: 24px 0;
    }
    p {
      font-size: 28px;
      color: var(--secondary-color);
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .pill {
      display: inline-block;
      margin-top: 16px;
      background: #000;
      color: #fff;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="shape-container">
    <div class="rect-blue"></div>
    <div class="circle-red"></div>
    <div class="tri-yellow"></div>
  </div>
  
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <div class="line"></div>
    <p id="template-subheading">Multidisciplinary Designer</p>
    <div class="pill" id="template-tagline">Portfolio 2026</div>
  </div>
</body>
</html>`
	}
];

// Marketer Templates
export const marketerTemplates = [
	{
		id: 'marketer-growth',
		category: 'marketer',
		name: 'Growth Focus',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #f8fafc;
      --secondary-color: #0f172a;
      --tertiary-color: #64748b;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      /* Padding left 280px to avoid profile picture */
      padding: 0 60px 0 600px;
      position: relative;
      overflow: hidden;
    }
    .glass-shape {
      position: absolute;
      background: linear-gradient(120deg, rgba(255,255,255,0.8), rgba(255,255,255,0.1));
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.5);
      border-radius: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.05);
      z-index: 0;
    }
    /* Abstract decorative shapes */
    .shape-1 { width: 300px; height: 300px; top: -50px; right: 100px; background: #e0f2fe; border-radius: 50%; border: none; filter: blur(40px); opacity: 0.6; }
    .shape-2 { width: 250px; height: 250px; bottom: -50px; right: 350px; background: #f0fdf4; border-radius: 50%; border: none; filter: blur(50px); opacity: 0.7; }

    .card {
      position: absolute;
      right: 100px;
      bottom: 50px;
      width: 280px;
      padding: 24px;
      background: rgba(255,255,255,0.9);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      z-index: 2;
    }
    .chart-line {
      height: 4px;
      width: 100%;
      background: #e2e8f0;
      border-radius: 2px;
      margin-top: 16px;
      position: relative;
    }
    .chart-fill {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 75%;
      background: #10b981;
      border-radius: 2px;
    }

    h1 {
      font-size: 64px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 12px;
      letter-spacing: -2px;
      position: relative;
      z-index: 2;
    }
    p {
      font-size: 24px;
      color: var(--tertiary-color);
      font-weight: 500;
      position: relative;
      z-index: 2;
      max-width: 600px;
    }
    .stat-row {
      display: flex;
      gap: 24px;
      margin-top: 32px;
      position: relative;
      z-index: 2;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
    }
    .stat-val { font-size: 24px; font-weight: 800; color: #0f172a; }
    .stat-lbl { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

  </style>
</head>
<body>
  <div class="shape-1"></div>
  <div class="shape-2"></div>

  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Growth Marketing Lead at TechCo | Scaling revenue from $1M to $10M+</p>

    <div class="stat-row">
      <div class="stat-item">
        <span class="stat-val" id="template-stat1">10k+</span>
        <span class="stat-lbl" id="template-stat1-label">Community</span>
      </div>
      <div class="stat-item">
        <span class="stat-val" id="template-stat2">150%</span>
        <span class="stat-lbl" id="template-stat2-label">YoY Growth</span>
      </div>
    </div>
  </div>

  <div class="card">
    <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">Revenue Growth</div>
    <div style="font-size: 14px; color: #10b981; font-weight: 600;">+24.5% <span style="color: #64748b; font-weight: 400;">this month</span></div>
    <div class="chart-line">
      <div class="chart-fill"></div>
    </div>
  </div>
</body>
</html>`
	},
	{
		id: 'marketer-brand',
		category: 'marketer',
		name: 'Brand Builder',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #fdf4ff;
      --secondary-color: #1e1b4b;
      --tertiary-color: #6b7280;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 60px 48px 600px;
      position: relative;
      text-align: center;
    }
    .decorative {
      position: absolute;
      right: 60px;
      top: 50%;
      transform: translateY(-50%);
    }
    .ring {
      width: 200px;
      height: 200px;
      border: 4px solid;
      border-radius: 50%;
      position: absolute;
    }
    .ring-1 { border-color: #c084fc; top: -100px; left: 0; }
    .ring-2 { border-color: #f472b6; top: 0; left: 60px; }
    .ring-3 { border-color: #fb923c; top: -50px; left: 120px; }
    h1 {
      font-size: 72px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 16px;
      letter-spacing: -2px;
    }
    p {
      font-size: 26px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
    .skills {
      display: flex;
      gap: 12px;
      margin-top: 20px;
      justify-content: center;
    }
    .skill {
      padding: 8px 16px;
      background: white;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      color: #7c3aed;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
  </style>
</head>
<body>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Head of Marketing | Brand Strategist</p>
    <div class="skills">
      <span class="skill">Brand Strategy</span>
      <span class="skill">Content Marketing</span>
      <span class="skill">GTM</span>
    </div>
  </div>
  <div class="decorative">
    <div class="ring ring-1"></div>
    <div class="ring ring-2"></div>
    <div class="ring ring-3"></div>
  </div>
</body>
</html>`
	},
	{
		id: 'marketer-data',
		category: 'marketer',
		name: 'Data Driven',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #ffffff;
      --secondary-color: #0f172a;
      --tertiary-color: #64748b;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 60px 48px 600px;
      position: relative;
      text-align: center;
    }
    .grid-bg {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(15, 23, 42, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(15, 23, 42, 0.03) 1px, transparent 1px);
      background-size: 32px 32px;
    }
    .content { position: relative; z-index: 1; }
    h1 {
      font-size: 64px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 14px;
      letter-spacing: -2px;
    }
    p {
      font-size: 24px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
    .stats {
      display: flex;
      gap: 40px;
      margin-top: 20px;
      justify-content: center;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #3b82f6;
    }
    .stat-label {
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Performance Marketing | Analytics & Optimization</p>
    <div class="stats">
      <div class="stat">
        <div class="stat-value" id="template-stat1">$12M+</div>
        <div class="stat-label" id="template-stat1-label">Ad Spend Managed</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="template-stat2">3.2x</div>
        <div class="stat-label" id="template-stat2-label">Avg ROAS</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="template-stat3">50+</div>
        <div class="stat-label" id="template-stat3-label">Campaigns</div>
      </div>
    </div>
  </div>
</body>
</html>`
	},
	{
		id: 'marketer-analytics',
		category: 'marketer',
		name: 'Social Analytics',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #f8fafc;
      --secondary-color: #0f172a;
      --tertiary-color: #64748b;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 0 60px 0 650px;
      position: relative;
      overflow: hidden;
    }
    /* Background Elements */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.6;
    }
    .blob-1 { width: 400px; height: 400px; background: #60a5fa; top: -100px; right: -50px; }
    .blob-2 { width: 300px; height: 300px; background: #a78bfa; bottom: -50px; right: 400px; }

    /* Grid of Cards */
    .card-grid {
      position: absolute;
      right: 60px;
      top: 50%;
      transform: translateY(-50%);
      display: grid;
      grid-template-columns: 140px 140px;
      gap: 16px;
      opacity: 0.9;
    }
    .card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .card.highlight { background: rgba(255, 255, 255, 0.9); transform: scale(1.05); z-index: 2; box-shadow: 0 20px 40px rgba(59, 130, 246, 0.15); }
    
    .c-val { font-size: 24px; font-weight: 700; color: #0f172a; }
    .c-lbl { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 4px; }
    .c-icon { margin-bottom: 8px; font-size: 20px; }

    .content { position: relative; z-index: 10; max-width: 500px; }
    h1 {
      font-size: 60px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 16px;
      letter-spacing: -1.5px;
      line-height: 1.1;
    }
    p {
      font-size: 22px;
      color: var(--tertiary-color);
      font-weight: 500;
      line-height: 1.4;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #eff6ff;
      color: #2563eb;
      border-radius: 100px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>
  
  <div class="content">
    <div class="tag" id="template-badge">🚀 Growth Specialist</div>
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Driving Revenue through Data-Driven Social Strategies</p>
  </div>

  <div class="card-grid">
    <div class="card">
      <div class="c-val" id="template-stat1">2.5M</div>
      <div class="c-lbl" id="template-stat1-label">Reach</div>
    </div>
    <div class="card highlight">
      <div class="c-val" id="template-stat2">+40%</div>
      <div class="c-lbl" id="template-stat2-label">Conversion</div>
    </div>
    <div class="card">
      <div class="c-val" id="template-stat3">85k</div>
      <div class="c-lbl" id="template-stat3-label">Leads</div>
    </div>
    <div class="card">
      <div class="c-val" id="template-stat4">5.0</div>
      <div class="c-lbl" id="template-stat4-label">ROAS</div>
    </div>
  </div>
</body>
</html>`
	}
];

// Recruiter Templates
export const recruiterTemplates = [
	{
		id: 'recruiter-hiring',
		category: 'recruiter',
		name: "We're Hiring",
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #0ea5e9;
      --secondary-color: #ffffff;
      --tertiary-color: rgba(255,255,255,0.9);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      /* Shift content right */
      padding: 0 60px 0 600px;
      position: relative;
    }
    .bg-pattern {
      position: absolute;
      right: -100px;
      top: -100px;
      width: 600px;
      height: 600px;
      border: 80px solid rgba(255,255,255,0.05);
      border-radius: 50%;
    }
    .bg-pattern-2 {
      position: absolute;
      right: 100px;
      top: 50px;
      width: 400px;
      height: 400px;
      border: 40px solid rgba(255,255,255,0.05);
      border-radius: 50%;
    }

    .badge-container { margin-bottom: 24px; }
    .badge {
      display: inline-block;
      padding: 10px 24px;
      background: #ffffff;
      border-radius: 100px;
      font-size: 16px;
      font-weight: 800;
      color: #0284c7;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: rotate(-2deg);
    }
    h1 {
      font-size: 72px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 16px;
      letter-spacing: -2px;
      line-height: 1;
    }
    p {
      font-size: 26px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
    .contact-info {
      margin-top: 32px;
      display: flex;
      gap: 24px;
      font-size: 16px;
      font-weight: 600;
      color: rgba(255,255,255,0.8);
    }
    .contact-item { display: flex; align-items: center; gap: 8px; }
    .icon { width: 16px; height: 16px; background: currentColor; border-radius: 50%; opacity: 0.5; }
  </style>
</head>
<body>
  <div class="bg-pattern"></div>
  <div class="bg-pattern-2"></div>
  <div class="content">
    <div class="badge-container">
      <div class="badge" id="template-badge">WE'RE HIRING!</div>
    </div>
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Senior Tech Recruiter | Building Teams at HighGrowth</p>
    <div class="contact-info">
      <div class="contact-item"><div class="icon"></div> DM me for roles</div>
      <div class="contact-item"><div class="icon"></div> hiring@company.com</div>
    </div>
  </div>
</body>
</html>`
	},
	{
		id: 'recruiter-corporate',
		category: 'recruiter',
		name: 'Corporate Clean',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #f8fafc;
      --secondary-color: #0f172a;
      --tertiary-color: #475569;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 60px 48px 600px;
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .accent {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 12px;
      background: #2563eb;
    }
    .content { margin-left: 40px; }
    h1 {
      font-size: 68px;
      font-weight: 700;
      color: var(--secondary-color);
      margin-bottom: 12px;
      letter-spacing: -1px;
    }
    p {
      font-size: 24px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
    .specialties {
      display: flex;
      gap: 24px;
      margin-top: 24px;
      font-size: 14px;
      color: #64748b;
    }
    .specialty {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dot {
      width: 6px;
      height: 6px;
      background: #2563eb;
      border-radius: 50%;
    }
  </style>
</head>
<body>
  <div class="accent"></div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Talent Acquisition Partner | Tech & Engineering</p>
    <div class="specialties">
      <div class="specialty"><div class="dot"></div>Engineering</div>
      <div class="specialty"><div class="dot"></div>Product</div>
      <div class="specialty"><div class="dot"></div>Design</div>
      <div class="specialty"><div class="dot"></div>Data</div>
    </div>
  </div>
</body>
</html>`
	},
	{
		id: 'recruiter-modern',
		category: 'recruiter',
		name: 'Modern Talent',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #1e1b4b;
      --secondary-color: #ffffff;
      --tertiary-color: #c4b5fd;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 60px 48px 600px;
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .glow {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
      right: 0;
      top: 50%;
      transform: translateY(-50%);
    }
    .content { position: relative; z-index: 1; }
    h1 {
      font-size: 72px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 16px;
      letter-spacing: -2px;
    }
    p {
      font-size: 26px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
    .cta {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 24px;
      background: #8b5cf6;
      border-radius: 8px;
      color: white;
      font-size: 16px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Connecting Great Talent with Amazing Opportunities</p>
    <div class="cta" id="template-cta">Let's Connect</div>
  </div>
</body>
</html>`
	},
	{
		id: 'recruiter-global',
		category: 'recruiter',
		name: 'Global Talent',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #0b1120;
      --secondary-color: #f8fafc;
      --tertiary-color: #94a3b8;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 0 60px 0 650px;
      position: relative;
      overflow: hidden;
    }
    /* Map Background */
    .map-dots {
      position: absolute;
      right: -100px;
      top: -50px;
      width: 900px;
      height: 600px;
      background-image: radial-gradient(#334155 1.5px, transparent 1.5px);
      background-size: 24px 24px;
      opacity: 0.5;
      transform: perspective(1000px) rotateY(-15deg);
    }
    /* Connecting lines */
    .connection-line {
      position: absolute;
      background: linear-gradient(90deg, transparent, #38bdf8, transparent);
      height: 2px;
      opacity: 0.4;
    }
    .cl-1 { width: 300px; top: 100px; right: 200px; transform: rotate(15deg); }
    .cl-2 { width: 400px; bottom: 120px; right: 100px; transform: rotate(-10deg); }
    
    .node {
      position: absolute;
      width: 8px; height: 8px; background: #38bdf8; border-radius: 50%;
      box-shadow: 0 0 10px #38bdf8;
    }
    .n-1 { top: 120px; right: 400px; }
    .n-2 { bottom: 150px; right: 200px; }
    
    .content { position: relative; z-index: 10; }
    h1 {
      font-size: 64px;
      font-weight: 700;
      background: linear-gradient(to right, #f8fafc, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 16px;
      letter-spacing: -1.5px;
    }
    p {
      font-size: 24px;
      color: var(--tertiary-color);
      font-weight: 400;
      margin-bottom: 32px;
    }
    .hiring-badge {
      display: inline-flex;
      align-items: center;
      padding: 8px 20px;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 8px;
      color: #38bdf8;
      font-weight: 600;
      gap: 10px;
      text-transform: uppercase;
      font-size: 14px;
      letter-spacing: 1px;
    }
    .pulse {
      width: 8px; height: 8px; background: #38bdf8; border-radius: 50%;
      box-shadow: 0 0 0 rgba(56, 189, 248, 0.7);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(56, 189, 248, 0); }
      100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
    }
  </style>
</head>
<body>
  <div class="map-dots"></div>
  <div class="connection-line cl-1"></div>
  <div class="connection-line cl-2"></div>
  <div class="node n-1"></div>
  <div class="node n-2"></div>

  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Connecting Talent Across Borders</p>
    <div class="hiring-badge">
      <div class="pulse"></div> <span id="template-hiring">Now Hiring: Engineering & Product</span>
    </div>
  </div>
</body>
</html>`
	}
];

// Freelancer Templates
export const freelancerTemplates = [
	{
		id: 'freelancer-modern',
		category: 'freelancer',
		name: 'Modern Pro',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #111827;
      --secondary-color: #f9fafb;
      --tertiary-color: #9ca3af;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 60px 48px 600px;
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .gradient-line {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #f472b6 0%, #8b5cf6 50%, #06b6d4 100%);
    }
    .content { position: relative; z-index: 1; }
    .availability {
      display: inline-block;
      padding: 6px 12px;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #22c55e;
      margin-bottom: 16px;
    }
    .dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #22c55e;
      border-radius: 50%;
      margin-right: 6px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    h1 {
      font-size: 72px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 12px;
      letter-spacing: -2px;
    }
    p {
      font-size: 26px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="gradient-line"></div>
  <div class="content">
    <div class="availability" id="template-availability"><span class="dot"></span>Available for Projects</div>
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Freelance Developer | React, Node, TypeScript</p>
  </div>
</body>
</html>`
	},
	{
		id: 'freelancer-creative',
		category: 'freelancer',
		name: 'Creative Freelancer',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #fef9c3;
      --secondary-color: #1c1917;
      --tertiary-color: #57534e;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 60px 48px 600px;
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .squiggle {
      position: absolute;
      right: 100px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 200px;
      opacity: 0.1;
    }
    .content { position: relative; z-index: 1; }
    h1 {
      font-size: 80px;
      font-weight: 900;
      color: var(--secondary-color);
      margin-bottom: 12px;
      letter-spacing: -3px;
    }
    p {
      font-size: 26px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
    .services {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }
    .service {
      padding: 8px 16px;
      background: white;
      border: 2px solid var(--secondary-color);
      font-size: 14px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="squiggle">~</div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Independent Creative | Brand & Web Design</p>
    <div class="services">
      <span class="service">Branding</span>
      <span class="service">Web Design</span>
      <span class="service">UI/UX</span>
    </div>
  </div>
</body>
</html>`
	},
	{
		id: 'freelancer-minimal',
		category: 'freelancer',
		name: 'Clean Minimal',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #ffffff;
      --secondary-color: #171717;
      --tertiary-color: #737373;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 60px 48px 600px;
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .corner-accent {
      position: absolute;
      width: 120px;
      height: 120px;
      border: 3px solid #e5e5e5;
    }
    .corner-tl { top: 32px; left: 32px; border-right: none; border-bottom: none; }
    .corner-br { bottom: 32px; right: 32px; border-left: none; border-top: none; }
    .content { position: relative; z-index: 1; }
    h1 {
      font-size: 72px;
      font-weight: 700;
      color: var(--secondary-color);
      margin-bottom: 12px;
      letter-spacing: -2px;
    }
    p {
      font-size: 24px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
    .contact {
      margin-top: 24px;
      font-size: 16px;
      color: #a3a3a3;
    }
    .contact a {
      color: var(--secondary-color);
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="corner-accent corner-tl"></div>
  <div class="corner-accent corner-br"></div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Freelance Consultant | Strategy & Growth</p>
    <div class="contact" id="template-contact">hello@yourwebsite.com</div>
  </div>
</body>
</html>`
	},
	{
		id: 'freelancer-workspace',
		category: 'freelancer',
		name: 'Creative Studio',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #fafaf9;
      --secondary-color: #1c1917;
      --tertiary-color: #57534e;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 0 60px 0 650px;
      position: relative;
      overflow: hidden;
    }
    /* Abstract 3D Shapes */
    .shape {
      position: absolute;
      border-radius: 40px;
      transform: rotate(-15deg);
      box-shadow: 20px 20px 60px rgba(0,0,0,0.05), -20px -20px 60px rgba(255,255,255,0.8);
    }
    .s-1 {
      width: 300px; height: 300px;
      background: linear-gradient(135deg, #f5f5f4, #e7e5e4);
      right: 180px; top: -50px;
      z-index: 1;
    }
    .s-2 {
      width: 150px; height: 150px;
      background: linear-gradient(135deg, #fda4af, #fca5a5);
      right: 420px; bottom: 40px;
      z-index: 2;
    }
    .s-3 {
      width: 100px; height: 100px;
      background: linear-gradient(135deg, #fcd34d, #fbbf24);
      right: 100px; top: 180px;
      z-index: 3;
    }
    
    .content { position: relative; z-index: 10; }
    h1 {
      font-size: 72px;
      font-weight: 900;
      color: var(--secondary-color);
      margin-bottom: 20px;
      letter-spacing: -2px;
    }
    p {
      font-size: 26px;
      color: var(--tertiary-color);
      font-weight: 500;
      margin-bottom: 32px;
    }
    .tags {
      display: flex;
      gap: 12px;
    }
    .pill {
      padding: 8px 16px;
      border: 2px solid #e7e5e4;
      border-radius: 12px;
      font-weight: 600;
      color: #44403c;
      background: rgba(255,255,255,0.5);
    }
  </style>
</head>
<body>
  <div class="shape s-1"></div>
  <div class="shape s-2"></div>
  <div class="shape s-3"></div>

  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Digital Creator & Visual Storyteller</p>
    <div class="tags">
      <div class="pill">Photography</div>
      <div class="pill">Art Direction</div>
      <div class="pill">Content</div>
    </div>
  </div>
</body>
</html>`
	}
];

// Corporate Templates
export const corporateTemplates = [
	{
		id: 'corporate-executive',
		category: 'corporate',
		name: 'Executive Suite',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #0f172a;
      --secondary-color: #f1f5f9;
      --tertiary-color: #94a3b8;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 60px 48px 600px;
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .gold-accent {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 6px;
      background: linear-gradient(180deg, #fbbf24 0%, #d97706 100%);
    }
    .content { margin-left: 40px; }
    h1 {
      font-size: 68px;
      font-weight: 700;
      color: var(--secondary-color);
      margin-bottom: 12px;
      letter-spacing: -1px;
    }
    p {
      font-size: 26px;
      color: var(--tertiary-color);
      font-weight: 400;
    }
    .title-line {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .divider {
      width: 40px;
      height: 2px;
      background: #fbbf24;
    }
  </style>
</head>
<body>
  <div class="gold-accent"></div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <div class="title-line">
      <div class="divider"></div>
      <p id="template-subheading">Chief Executive Officer | Fortune 500</p>
    </div>
  </div>
</body>
</html>`
	},
	{
		id: 'corporate-minimal',
		category: 'corporate',
		name: 'Corporate Minimal',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #ffffff;
      --secondary-color: #18181b;
      --tertiary-color: #52525b;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 60px 48px 600px;
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .line-pattern {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 300px;
      background: repeating-linear-gradient(
        90deg,
        transparent,
        transparent 20px,
        #f4f4f5 20px,
        #f4f4f5 21px
      );
    }
    .content { position: relative; z-index: 1; }
    h1 {
      font-size: 72px;
      font-weight: 700;
      color: var(--secondary-color);
      margin-bottom: 16px;
      letter-spacing: -2px;
    }
    p {
      font-size: 24px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="line-pattern"></div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Vice President of Operations</p>
  </div>
</body>
</html>`
	},
	{
		id: 'corporate-brand',
		category: 'corporate',
		name: 'Brand Forward',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #1e3a8a;
      --secondary-color: #ffffff;
      --tertiary-color: #bfdbfe;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 60px 48px 600px;
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .wave {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 100px;
      background: rgba(255,255,255,0.05);
      clip-path: ellipse(80% 100% at 50% 100%);
    }
    .content { position: relative; z-index: 1; }
    h1 {
      font-size: 72px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 16px;
      letter-spacing: -2px;
    }
    p {
      font-size: 26px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="wave"></div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Director of Business Development</p>
  </div>
</body>
</html>`
	},
	{
		id: 'corporate-glass',
		category: 'corporate',
		name: 'Glass Tower',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #f1f5f9;
      --secondary-color: #0f172a;
      --tertiary-color: #475569;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 0 60px 0 650px;
      position: relative;
      overflow: hidden;
    }
    /* Glass Architecture Background */
    .bg-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, #f8fafc 0%, #e2e8f0 100%);
    }
    .glass-panel {
      position: absolute;
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.7);
      box-shadow: 0 8px 32px rgba(0,0,0,0.05);
    }
    .p-1 {
      width: 400px; height: 600px;
      top: -100px; right: 200px;
      transform: skewX(-15deg);
    }
    .p-2 {
      width: 250px; height: 500px;
      top: -50px; right: 50px;
      transform: skewX(-15deg);
      background: rgba(255, 255, 255, 0.6);
    }
    /* Abstract Building Lines */
    .line {
      position: absolute;
      background: rgba(148, 163, 184, 0.3);
      width: 1px; height: 100%;
      transform: skewX(-15deg);
    }
    .l-1 { right: 300px; }
    .l-2 { right: 450px; }
    
    .content { position: relative; z-index: 10; max-width: 550px; }
    h1 {
      font-size: 64px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 24px;
      letter-spacing: -1px;
      line-height: 1.1;
    }
    p {
      font-size: 22px;
      color: var(--tertiary-color);
      font-weight: 500;
      margin-bottom: 32px;
      line-height: 1.5;
    }
    .role-badge {
      display: inline-block;
      padding: 8px 16px;
      background: #0f172a;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="bg-gradient"></div>
  <div class="line l-1"></div>
  <div class="line l-2"></div>
  <div class="glass-panel p-1"></div>
  <div class="glass-panel p-2"></div>

  <div class="content">
    <div class="role-badge" id="template-badge">Executive Leadership</div>
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Driving Organization Strategy & Global Operations</p>
  </div>
</body>
</html> `
	}
];

// Neo-Brutalist Templates
export const neoBrutalistTemplates = [
	{
		id: 'neo-bold',
		category: 'neo-brutalist',
		name: 'Neo Bold',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #fffdf8;
      --secondary-color: #1f2937;
      --tertiary-color: #000000;
      --accent: #ff6b6b;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      /* Safe zone padding */
      padding: 0 60px 0 600px;
      position: relative;
      overflow: hidden;
    }
    .bg-grid {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
      background-size: 20px 20px;
      opacity: 0.8;
    }
    .shape-1 {
      position: absolute;
      right: 120px;
      top: 60px;
      width: 140px;
      height: 140px;
      background: #ffc480;
      border: 4px solid #1f2937;
      box-shadow: 8px 8px 0 0 #1f2937;
      border-radius: 50%;
      z-index: 1;
    }
    .shape-2 {
      position: absolute;
      right: 180px;
      bottom: 60px;
      width: 100px;
      height: 100px;
      background: #4ade80;
      border: 4px solid #1f2937;
      box-shadow: 8px 8px 0 0 #1f2937;
      transform: rotate(15deg);
      z-index: 2;
    }
    
    .card {
      background: #fff;
      border: 4px solid #1f2937;
      box-shadow: 12px 12px 0 0 #1f2937;
      padding: 40px;
      position: relative;
      z-index: 10;
      transform: rotate(-1deg);
      max-width: 900px;
    }
    h1 {
      font-size: 64px;
      font-weight: 900;
      color: var(--secondary-color);
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: -2px;
      line-height: 0.95;
    }
    p {
      font-size: 24px;
      color: var(--secondary-color);
      font-weight: 700;
      background: #e5e7eb;
      display: inline-block;
      padding: 4px 12px;
      border: 2px solid #1f2937;
    }
  </style>
</head>
<body>
  <div class="bg-grid"></div>
  <div class="shape-1"></div>
  <div class="shape-2"></div>
  
  <div class="card">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Product Designer & Developer</p>
  </div>
</body>
</html> `
	},
	{
		id: 'neo-retro',
		category: 'neo-brutalist',
		name: 'Retro Pop',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #c084fc;
      --secondary-color: #ffffff;
      --tertiary-color: #fff;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 0 60px 0 600px;
      position: relative;
      overflow: hidden;
    }
    .stripe {
      position: absolute;
      height: 40px;
      width: 200%;
      background: #1f2937;
      transform: rotate(-10deg) translateY(-50px);
      left: -50%;
    }
    .stripe:nth-child(2) {
      top: 40%;
      background: #fbbf24;
      height: 20px;
    }
    
    h1 {
      font-size: 80px;
      font-weight: 900;
      color: #fff;
      margin-bottom: 0px;
      letter-spacing: -4px;
      text-shadow: 6px 6px 0px #1f2937;
      line-height: 1;
      font-style: italic;
      transform: rotate(-2deg);
    }
    .subtitle-box {
      margin-top: 24px;
      background: #1f2937;
      color: #fff;
      padding: 16px 32px;
      border: 3px solid #fff;
      box-shadow: 6px 6px 0 0 rgba(0,0,0,0.2);
      transform: rotate(1deg);
      display: inline-block;
    }
    p {
      font-size: 28px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="stripe"></div>
  <div class="stripe"></div>
  
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <div class="subtitle-box">
      <p id="template-subheading">Creative Director</p>
    </div>
  </div>
</body>
</html> `
	},
	{
		id: 'neo-acid',
		category: 'neo-brutalist',
		name: 'Acid GRAPHICS',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #000000;
      --secondary-color: #ccff00;
      --tertiary-color: #ffffff;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 0 60px 0 650px;
      position: relative;
      overflow: hidden;
    }
    .grid {
      position: absolute;
      inset: 0;
      background-size: 40px 40px;
      background-image: linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px);
    }
    .barcode {
      position: absolute;
      right: 50px;
      top: 50px;
      width: 100px;
      height: 300px;
      background: repeating-linear-gradient(90deg, #fff, #fff 2px, #000 2px, #000 6px);
      transform: rotate(180deg);
    }
    .sticker {
      position: absolute;
      right: 200px;
      bottom: 50px;
      width: 180px;
      height: 180px;
      background: #ccff00;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 24px;
      text-align: center;
      transform: rotate(-15deg);
      border: 2px solid #fff;
      box-shadow: 0 0 20px rgba(204, 255, 0, 0.5);
      z-index: 2;
    }
    
    .content { position: relative; z-index: 10; width: 100%; }
    h1 {
      font-size: 96px;
      font-weight: 900;
      color: var(--secondary-color);
      margin-bottom: 0;
      letter-spacing: -6px;
      line-height: 0.8;
      text-transform: uppercase;
      mix-blend-mode: difference;
    }
    p {
      font-size: 32px;
      color: #fff;
      font-weight: 700;
      background: #000;
      display: inline-block;
      border: 1px solid #fff;
      padding: 8px 16px;
      margin-top: 24px;
      text-transform: uppercase;
    }
    .warning {
      position: absolute;
      top: 0; left: 650px;
      background: #ccff00;
      color: #000;
      font-weight: 700;
      padding: 4px 12px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="grid"></div>
  <div class="warning" id="template-badge">⚠️ SYSTEM READY</div>
  <div class="barcode"></div>
  <div class="sticker" id="template-tagline">Thinking<br>Different</div>

  <div class="content">
    <h1 id="template-heading">YOUR NAME</h1>
    <p id="template-subheading">Visual Designer_</p>
  </div>
</body>
</html>`
	}
];

// Personal Brand Templates
export const personalBrandTemplates = [
	{
		id: 'personal-influencer',
		category: 'personal-brand',
		name: 'Influencer Style',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #fdf2f8;
      --secondary-color: #111827;
      --tertiary-color: #831843;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #fff;
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      /* Padding left 300px for safe zone */
      padding: 0 60px 0 600px;
      position: relative;
      overflow: hidden;
    }
    .gradient-mesh {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%),
        radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%),
        radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%);
      background-size: 150% 150%;
    }
    .grain {
      position: absolute;
      inset: 0;
      opacity: 0.15;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opactiy='0.5'/%3E%3C/svg%3E");
    }

    .content { position: relative; z-index: 10; color: white; }
    h1 {
      font-size: 82px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 20px;
      letter-spacing: -2px;
      text-shadow: 0 4px 12px rgba(0,0,0,0.3);
      line-height: 1;
    }
    h1 span {
      background: linear-gradient(to right, #f472b6, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .p-container {
      display: flex;
      gap: 24px;
      align-items: center;
    }
    p {
      font-size: 26px;
      font-weight: 600;
      color: rgba(255,255,255,0.9);
      background: rgba(255,255,255,0.1);
      padding: 12px 24px;
      border-radius: 100px;
      border: 1px solid rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
    }
    .stats {
      font-family: 'JetBrains Mono', monospace;
      color: #f472b6;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="gradient-mesh"></div>
  <div class="grain"></div>
  <div class="content">
    <h1 id="template-heading">Your <span>Name</span></h1>
    <div class="p-container">
      <p id="template-subheading">Content Creator • Speaker</p>
      <div class="stats" id="template-handle">@yourhandle</div>
    </div>
  </div>
</body>
</html>`
	},
	{
		id: 'personal-speaker',
		category: 'personal-brand',
		name: 'Keynote Speaker',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #18181b;
      --secondary-color: #fafafa;
      --tertiary-color: #a1a1aa;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 60px 48px 600px;
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .spotlight {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%);
      top: 50%;
      left: 0;
      transform: translateY(-50%);
    }
    .content { position: relative; z-index: 1; }
    .badge {
      display: inline-block;
      padding: 8px 16px;
      background: #fbbf24;
      color: #18181b;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 72px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 12px;
      letter-spacing: -2px;
    }
    p {
      font-size: 26px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="spotlight"></div>
  <div class="content">
    <div class="badge" id="template-badge">KEYNOTE SPEAKER</div>
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Leadership | Innovation | Digital Transformation</p>
  </div>
</body>
</html>`
	},
	{
		id: 'personal-author',
		category: 'personal-brand',
		name: 'Author & Writer',
		popular: false,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #faf5ff;
      --secondary-color: #1e1b4b;
      --tertiary-color: #6b7280;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 60px 48px 600px;
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .quote-mark {
      position: absolute;
      right: 100px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 300px;
      color: rgba(139, 92, 246, 0.1);
      font-family: Georgia, serif;
      line-height: 1;
    }
    .content { position: relative; z-index: 1; }
    h1 {
      font-size: 72px;
      font-weight: 700;
      color: var(--secondary-color);
      margin-bottom: 16px;
      letter-spacing: -1px;
      font-family: Georgia, serif;
    }
    p {
      font-size: 24px;
      color: var(--tertiary-color);
      font-weight: 400;
      font-style: italic;
    }
    .books {
      margin-top: 20px;
      font-size: 14px;
      color: #8b5cf6;
      font-family: 'Inter', sans-serif;
      font-style: normal;
    }
  </style>
</head>
<body>
  <div class="quote-mark">"</div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Bestselling Author | Thought Leader</p>
    <div class="books" id="template-tagline">Author of "Your Book Title" • Featured in Forbes, HBR</div>
  </div>
</body>
</html>`
	},
	{
		id: 'personal-magazine',
		category: 'personal-brand',
		name: 'Editorial Magazine',
		popular: true,
		html: `<html>
<head>
  <style>
    :root {
      --primary-color: #f3f4f6;
      --secondary-color: #111827;
      --tertiary-color: #d1d5db;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Playfair Display', serif;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 0;
      position: relative;
      overflow: hidden;
    }
    .image-side {
      width: 40%;
      height: 100%;
      background: #e5e7eb;
      position: relative;
      overflow: hidden;
    }
    .image-placeholder {
      width: 100%; height: 100%;
      background: linear-gradient(45deg, #9ca3af, #d1d5db);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Inter', sans-serif;
      color: #fff; font-size: 24px; font-weight: 500;
    }
    .text-side {
      width: 60%;
      padding: 60px 80px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .eyebrow {
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #4b5563;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .line { height: 1px; width: 60px; background: #9ca3af; }
    
    h1 {
      font-size: 80px;
      font-weight: 400;
      color: var(--secondary-color);
      margin-bottom: 24px;
      letter-spacing: -2px;
      line-height: 0.95;
    }
    h1 i { font-family: 'Inter', sans-serif; font-weight: 300; font-style: normal; color: #6b7280; font-size: 0.7em; margin-left: 12px; vertical-align: middle; }
    
    p {
      font-family: 'Inter', sans-serif;
      font-size: 20px;
      color: #4b5563;
      font-weight: 400;
      line-height: 1.6;
      max-width: 600px;
    }
    .issue-number {
      position: absolute;
      top: 40px; right: 60px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #9ca3af;
      transform: rotate(90deg);
      transform-origin: right top;
    }
  </style>
</head>
<body>
  <div class="image-side">
    <div class="image-placeholder">Photo</div>
  </div>
  <div class="text-side">
    <div class="eyebrow"><div class="line"></div><span id="template-badge">The Strategist</span></div>
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Curating insights on leadership, culture, and the future of work.</p>
  </div>
  <div class="issue-number" id="template-tagline">VOL. 24</div>
</body>
</html>`
	}
];

// Export all templates combined
export const allTemplates = [
	...developerTemplates,
	...designerTemplates,
	...marketerTemplates,
	...recruiterTemplates,
	...freelancerTemplates,
	...corporateTemplates,
	...neoBrutalistTemplates,
	...personalBrandTemplates
];

// Get templates by category
export function getTemplatesByCategory(categoryId) {
	return allTemplates.filter((t) => t.category === categoryId);
}

// Get template by ID
export function getTemplateById(templateId) {
	return allTemplates.find((t) => t.id === templateId);
}

// Get popular templates
export function getPopularTemplates() {
	return allTemplates.filter((t) => t.popular);
}
