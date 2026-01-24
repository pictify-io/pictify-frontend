// LinkedIn Banner Templates Registry
// All templates are 1584 x 396 pixels

// Developer Templates
export const developerTemplates = [
  {
    id: 'dev-dark-terminal',
    category: 'developer',
    name: 'Dark Terminal',
    popular: true,
    html: `<html>
<head>
  <style>
    :root {
      --primary-color: #0d1117;
      --secondary-color: #58a6ff;
      --tertiary-color: #8b949e;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      background: var(--primary-color);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 300px 48px 48px;
      position: relative;
      overflow: hidden;
    }
    .grid-bg {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(88, 166, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(88, 166, 255, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .content { position: relative; z-index: 1; }
    .terminal-header {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }
    .dot { width: 14px; height: 14px; border-radius: 50%; }
    .red { background: #ff5f56; }
    .yellow { background: #ffbd2e; }
    .green { background: #27ca40; }
    h1 {
      font-size: 64px;
      font-weight: 700;
      color: #f0f6fc;
      margin-bottom: 16px;
      letter-spacing: -1px;
    }
    h1 span { color: var(--secondary-color); }
    p {
      font-size: 24px;
      color: var(--tertiary-color);
      font-weight: 400;
    }
    .cursor {
      display: inline-block;
      width: 3px;
      height: 28px;
      background: var(--secondary-color);
      margin-left: 4px;
      animation: blink 1s infinite;
    }
    @keyframes blink { 50% { opacity: 0; } }
    .code-lines {
      position: absolute;
      right: 60px;
      top: 50%;
      transform: translateY(-50%);
      opacity: 0.3;
    }
    .code-line {
      font-size: 14px;
      color: #8b949e;
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="content">
    <div class="terminal-header">
      <div class="dot red"></div>
      <div class="dot yellow"></div>
      <div class="dot green"></div>
    </div>
    <h1 id="template-heading"><span>&gt;</span> Your Name</h1>
    <p id="template-subheading">Full Stack Developer | React | Node.js | TypeScript<span class="cursor"></span></p>
  </div>
  <div class="code-lines">
    <div class="code-line">const developer = {</div>
    <div class="code-line">&nbsp;&nbsp;skills: ['React', 'Node'],</div>
    <div class="code-line">&nbsp;&nbsp;passion: 'building'</div>
    <div class="code-line">};</div>
  </div>
</body>
</html>`
  },
  {
    id: 'dev-gradient-tech',
    category: 'developer',
    name: 'Gradient Tech',
    popular: false,
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
      padding: 48px 300px 48px 48px;
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
      padding: 48px 300px 48px 48px;
      position: relative;
    }
    .accent-line {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 8px;
      background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%);
    }
    .content { padding-left: 40px; }
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
      gap: 16px;
      margin-top: 24px;
    }
    .tech-badge {
      padding: 8px 16px;
      background: #f4f4f5;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #3f3f46;
    }
  </style>
</head>
<body>
  <div class="accent-line"></div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Senior Software Engineer</p>
    <div class="tech-stack">
      <span class="tech-badge">React</span>
      <span class="tech-badge">TypeScript</span>
      <span class="tech-badge">Node.js</span>
      <span class="tech-badge">AWS</span>
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
      --primary-color: #fef3c7;
      --secondary-color: #1f2937;
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
      padding: 48px 300px 48px 80px;
      position: relative;
    }
    .shapes {
      position: absolute;
      right: 100px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      gap: 20px;
    }
    .circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
    }
    .circle-1 { background: #f472b6; }
    .circle-2 { background: #60a5fa; transform: translateY(40px); }
    .circle-3 { background: #34d399; transform: translateY(-20px); }
    h1 {
      font-size: 80px;
      font-weight: 900;
      color: var(--secondary-color);
      margin-bottom: 12px;
      letter-spacing: -3px;
      line-height: 1;
    }
    p {
      font-size: 28px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
    .tag {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      background: var(--secondary-color);
      color: var(--primary-color);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Product Designer | Creating Digital Experiences</p>
    <div class="tag">Available for Work</div>
  </div>
  <div class="shapes">
    <div class="circle circle-1"></div>
    <div class="circle circle-2"></div>
    <div class="circle circle-3"></div>
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
      --secondary-color: #0a0a0a;
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
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .border-frame {
      position: absolute;
      inset: 24px;
      border: 2px solid #e5e5e5;
    }
    h1 {
      font-size: 72px;
      font-weight: 300;
      color: var(--secondary-color);
      margin-bottom: 16px;
      letter-spacing: 8px;
      text-transform: uppercase;
    }
    p {
      font-size: 18px;
      color: var(--tertiary-color);
      font-weight: 400;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="border-frame"></div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">UI/UX Designer</p>
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
      padding: 48px 300px 48px 80px;
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
      --primary-color: #0f172a;
      --secondary-color: #f8fafc;
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
      padding: 48px 300px 48px 80px;
      position: relative;
    }
    .chart {
      position: absolute;
      right: 80px;
      bottom: 0;
      display: flex;
      align-items: flex-end;
      gap: 16px;
      height: 280px;
    }
    .bar {
      width: 40px;
      background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
      border-radius: 8px 8px 0 0;
    }
    .bar-1 { height: 40%; }
    .bar-2 { height: 55%; }
    .bar-3 { height: 70%; }
    .bar-4 { height: 60%; }
    .bar-5 { height: 85%; }
    .bar-6 { height: 100%; }
    h1 {
      font-size: 68px;
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
    .metric {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 24px;
      padding: 12px 20px;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 8px;
      color: #22c55e;
      font-size: 16px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Growth Marketing | Driving 10x Revenue</p>
    <div class="metric">+127% YoY Growth</div>
  </div>
  <div class="chart">
    <div class="bar bar-1"></div>
    <div class="bar bar-2"></div>
    <div class="bar bar-3"></div>
    <div class="bar bar-4"></div>
    <div class="bar bar-5"></div>
    <div class="bar bar-6"></div>
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
      padding: 48px 300px 48px 80px;
      position: relative;
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
      padding: 48px 300px 48px 80px;
      position: relative;
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
      font-size: 68px;
      font-weight: 800;
      color: var(--secondary-color);
      margin-bottom: 16px;
      letter-spacing: -2px;
    }
    p {
      font-size: 24px;
      color: var(--tertiary-color);
      font-weight: 500;
    }
    .stats {
      display: flex;
      gap: 32px;
      margin-top: 24px;
    }
    .stat {
      text-align: left;
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
        <div class="stat-value">$12M+</div>
        <div class="stat-label">Ad Spend Managed</div>
      </div>
      <div class="stat">
        <div class="stat-value">3.2x</div>
        <div class="stat-label">Avg ROAS</div>
      </div>
      <div class="stat">
        <div class="stat-value">50+</div>
        <div class="stat-label">Campaigns</div>
      </div>
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
    name: 'We\'re Hiring',
    popular: true,
    html: `<html>
<head>
  <style>
    :root {
      --primary-color: #0ea5e9;
      --secondary-color: #ffffff;
      --tertiary-color: rgba(255,255,255,0.85);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 300px 48px 80px;
      position: relative;
    }
    .pattern {
      position: absolute;
      inset: 0;
      opacity: 0.1;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    .content { position: relative; z-index: 1; }
    .badge {
      display: inline-block;
      padding: 8px 16px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      font-size: 14px;
      font-weight: 700;
      color: white;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
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
  <div class="pattern"></div>
  <div class="content">
    <div class="badge">WE'RE HIRING</div>
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Senior Tech Recruiter | Building Amazing Teams</p>
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
      padding: 48px 300px 48px 80px;
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
      padding: 48px 300px 48px 80px;
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
    <div class="cta">Let's Connect</div>
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
      padding: 48px 300px 48px 80px;
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
    <div class="availability"><span class="dot"></span>Available for Projects</div>
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
      padding: 48px 300px 48px 80px;
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
      padding: 48px 300px 48px 80px;
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
    <div class="contact">hello@yourwebsite.com</div>
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
      padding: 48px 300px 48px 80px;
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
      padding: 48px 300px 48px 80px;
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
      padding: 48px 300px 48px 80px;
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
      --primary-color: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
      --secondary-color: #ffffff;
      --tertiary-color: rgba(255,255,255,0.85);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
      width: 1584px;
      height: 396px;
      display: flex;
      align-items: center;
      padding: 48px 300px 48px 80px;
      position: relative;
    }
    .sparkles {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .content { position: relative; z-index: 1; }
    h1 {
      font-size: 80px;
      font-weight: 900;
      color: var(--secondary-color);
      margin-bottom: 12px;
      letter-spacing: -2px;
      text-shadow: 2px 2px 20px rgba(0,0,0,0.2);
    }
    p {
      font-size: 28px;
      color: var(--tertiary-color);
      font-weight: 600;
    }
    .social-proof {
      margin-top: 20px;
      font-size: 16px;
      color: rgba(255,255,255,0.7);
    }
    .social-proof strong {
      color: white;
    }
  </style>
</head>
<body>
  <div class="sparkles"></div>
  <div class="content">
    <h1 id="template-heading">Your Name</h1>
    <p id="template-subheading">Content Creator | Speaker | Author</p>
    <div class="social-proof"><strong>100K+</strong> followers across platforms</div>
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
      padding: 48px 300px 48px 80px;
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
    <div class="badge">KEYNOTE SPEAKER</div>
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
      padding: 48px 300px 48px 80px;
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
    <div class="books">Author of "Your Book Title" • Featured in Forbes, HBR</div>
  </div>
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
  ...personalBrandTemplates
];

// Get templates by category
export function getTemplatesByCategory(categoryId) {
  return allTemplates.filter(t => t.category === categoryId);
}

// Get template by ID
export function getTemplateById(templateId) {
  return allTemplates.find(t => t.id === templateId);
}

// Get popular templates
export function getPopularTemplates() {
  return allTemplates.filter(t => t.popular);
}
