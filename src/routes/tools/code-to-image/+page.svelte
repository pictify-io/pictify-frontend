<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import { toast } from '../../../store/toast.store';
  import { createImagePublic } from '../../../api/image.js';
  import { user } from '../../../store/user.store';
  import ApiPromptSection from '$lib/components/tools/ApiPromptSection.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { onMount } from 'svelte';

  // Syntax highlighting via refractor (Prism under the hood)
  import { refractor } from 'refractor';
  import javascript from 'refractor/lang/javascript.js';
  import typescript from 'refractor/lang/typescript.js';
  import css from 'refractor/lang/css.js';
  import bash from 'refractor/lang/bash.js';
  import json from 'refractor/lang/json.js';
  import markdown from 'refractor/lang/markdown.js';
  import markup from 'refractor/lang/markup.js'; // HTML
  import python from 'refractor/lang/python.js';
  import java from 'refractor/lang/java.js';
  import c from 'refractor/lang/c.js';
  import cpp from 'refractor/lang/cpp.js';
  import csharp from 'refractor/lang/csharp.js';
  import php from 'refractor/lang/php.js';
  import ruby from 'refractor/lang/ruby.js';
  import go from 'refractor/lang/go.js';
  import rust from 'refractor/lang/rust.js';
  import swift from 'refractor/lang/swift.js';
  import sql from 'refractor/lang/sql.js';
  import yaml from 'refractor/lang/yaml.js';
  import jsx from 'refractor/lang/jsx.js';
  import tsx from 'refractor/lang/tsx.js';
  import scss from 'refractor/lang/scss.js';
  import { toHtml } from 'hast-util-to-html';

  refractor.register(javascript);
  refractor.register(typescript);
  refractor.register(css);
  refractor.register(bash);
  refractor.register(json);
  refractor.register(markdown);
  refractor.register(markup);
  refractor.register(python);
  refractor.register(java);
  refractor.register(c);
  refractor.register(cpp);
  refractor.register(csharp);
  refractor.register(php);
  refractor.register(ruby);
  refractor.register(go);
  refractor.register(rust);
  refractor.register(swift);
  refractor.register(sql);
  refractor.register(yaml);
  refractor.register(jsx);
  refractor.register(tsx);
  refractor.register(scss);

  const themeOptions = [
    // Dark themes
    { id: 'okaidia', name: 'Okaidia (Dark)', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css' },
    { id: 'twilight', name: 'Twilight (Dark)', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-twilight.min.css' },
    { id: 'dark', name: 'Dark', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-dark.min.css' },
    { id: 'dracula', name: 'Dracula', url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-dracula.min.css' },
    { id: 'vs-dark', name: 'VS Dark', url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-vsc-dark-plus.min.css' },
    { id: 'atom-dark', name: 'Atom One Dark', url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-atom-dark.min.css' },
    { id: 'nord', name: 'Nord', url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-nord.min.css' },
    { id: 'material-dark', name: 'Material Dark', url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-material-dark.min.css' },
    { id: 'night-owl', name: 'Night Owl', url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-night-owl.min.css' },

    // Light themes  
    { id: 'default', name: 'Default (Light)', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css' },
    { id: 'coy', name: 'Coy (Light)', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-coy.min.css' },
    { id: 'solarizedlight', name: 'Solarized Light', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-solarizedlight.min.css' },
    { id: 'ghcolors', name: 'GitHub Colors', url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-ghcolors.min.css' },
    { id: 'material-light', name: 'Material Light', url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-material-light.min.css' },
    { id: 'xonokai', name: 'Xonokai', url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-xonokai.min.css' },
    { id: 'base16-ateliersulphurpool-light', name: 'Base16 Light', url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-base16-ateliersulphurpool.light.min.css' },
    { id: 'prism-duotone-light', name: 'Duotone Light', url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-duotone-light.min.css' }
  ];

  const languageOptions = [
    // Popular web languages
    { id: 'javascript', name: 'JavaScript', file: 'snippet.js' },
    { id: 'typescript', name: 'TypeScript', file: 'snippet.ts' },
    { id: 'jsx', name: 'React (JSX)', file: 'Component.jsx' },
    { id: 'tsx', name: 'React TypeScript (TSX)', file: 'Component.tsx' },
    { id: 'html', name: 'HTML', file: 'index.html' },
    { id: 'css', name: 'CSS', file: 'styles.css' },
    { id: 'scss', name: 'SCSS', file: 'styles.scss' },
    
    // Backend languages
    { id: 'python', name: 'Python', file: 'script.py' },
    { id: 'java', name: 'Java', file: 'Main.java' },
    { id: 'csharp', name: 'C#', file: 'Program.cs' },
    { id: 'php', name: 'PHP', file: 'index.php' },
    { id: 'ruby', name: 'Ruby', file: 'script.rb' },
    { id: 'go', name: 'Go', file: 'main.go' },
    { id: 'rust', name: 'Rust', file: 'main.rs' },
    
    // Systems languages
    { id: 'c', name: 'C', file: 'main.c' },
    { id: 'cpp', name: 'C++', file: 'main.cpp' },
    
    // Mobile languages
    { id: 'swift', name: 'Swift', file: 'ViewController.swift' },
    
    // Data & config languages
    { id: 'sql', name: 'SQL', file: 'query.sql' },
    { id: 'json', name: 'JSON', file: 'data.json' },
    { id: 'yaml', name: 'YAML', file: 'config.yml' },
    
    // Shell & markup
    { id: 'bash', name: 'Bash', file: 'script.sh' },
    { id: 'markdown', name: 'Markdown', file: 'README.md' }
  ];

  const fontOptions = [
    // Popular coding fonts
    { id: 'jetbrains', name: 'JetBrains Mono', css: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap", family: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
    { id: 'fira', name: 'Fira Code', css: "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&display=swap", family: "'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
    { id: 'source', name: 'Source Code Pro', css: "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;600&display=swap", family: "'Source Code Pro', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
    { id: 'roboto', name: 'Roboto Mono', css: "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap", family: "'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
    { id: 'inconsolata', name: 'Inconsolata', css: "https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;600&display=swap", family: "'Inconsolata', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
    { id: 'ubuntu', name: 'Ubuntu Mono', css: "https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;700&display=swap", family: "'Ubuntu Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
    { id: 'space', name: 'Space Mono', css: "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap", family: "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
    { id: 'courier', name: 'Courier New', css: "", family: "'Courier New', Courier, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
    { id: 'menlo', name: 'Menlo', css: "", family: "Menlo, ui-monospace, SFMono-Regular, Monaco, Consolas, monospace" },
    { id: 'monaco', name: 'Monaco', css: "", family: "Monaco, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
    { id: 'consolas', name: 'Consolas', css: "", family: "Consolas, ui-monospace, SFMono-Regular, Menlo, Monaco, monospace" },
    { id: 'cascadia', name: 'Cascadia Code', css: "https://fonts.googleapis.com/css2?family=Cascadia+Code:wght@400;600&display=swap", family: "'Cascadia Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }
  ];

  // Growth loop variables
  let usageKey = 'pictify_code_image_usage';
  let maxFreeGenerations = 5;
  let freeGenerationsUsed = 0;
  let isUserLoggedIn = false;
  let showUpgradePrompt = false;
  let showFirstGenerationPrompt = false;
  let totalImagesGenerated = 67891; // Social proof counter

  // Add user store subscription
  user.subscribe(userData => {
    isUserLoggedIn = !!userData.email;
  });

  // Computed properties for usage tracking
  $: remainingGenerations = maxFreeGenerations - freeGenerationsUsed;
  $: usagePercentage = (freeGenerationsUsed / maxFreeGenerations) * 100;

  // Sample code snippets for different languages
  const sampleCode = {
    javascript: `function greet(name) {\n  console.log('Hello, ' + name + '!');\n}\n\nconst user = 'World';\ngreet(user);`,
    typescript: `interface User {\n  name: string;\n  age: number;\n}\n\nfunction greet(user: User): void {\n  console.log(\`Hello, \${user.name}!\`);\n}\n\nconst user: User = { name: 'World', age: 42 };\ngreet(user);`,
    python: `def greet(name: str) -> None:\n    print(f"Hello, {name}!")\n\nclass User:\n    def __init__(self, name: str):\n        self.name = name\n\nuser = User("World")\ngreet(user.name)`,
    rust: `fn greet(name: &str) {\n    println!("Hello, {}!", name);\n}\n\nstruct User {\n    name: String,\n}\n\nfn main() {\n    let user = User {\n        name: String::from("World"),\n    };\n    greet(&user.name);\n}`,
    go: `package main\n\nimport "fmt"\n\ntype User struct {\n    Name string\n}\n\nfunc greet(name string) {\n    fmt.Printf("Hello, %s!\\n", name)\n}\n\nfunc main() {\n    user := User{Name: "World"}\n    greet(user.Name)\n}`,
    html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Hello World</title>\n</head>\n<body>\n    <div class="container">\n        <h1>Hello, World!</h1>\n        <p>Welcome to our website.</p>\n    </div>\n</body>\n</html>`,
    css: `.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 2rem;\n}\n\n.header {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n  text-align: center;\n  padding: 3rem 1rem;\n  border-radius: 10px;\n}\n\n.header h1 {\n  font-size: 2.5rem;\n  margin: 0;\n}`,
    java: `public class HelloWorld {\n    private String name;\n    \n    public HelloWorld(String name) {\n        this.name = name;\n    }\n    \n    public void greet() {\n        System.out.println("Hello, " + this.name + "!");\n    }\n    \n    public static void main(String[] args) {\n        HelloWorld hello = new HelloWorld("World");\n        hello.greet();\n    }\n}`,
    php: `<?php\nclass User {\n    private $name;\n    \n    public function __construct($name) {\n        $this->name = $name;\n    }\n    \n    public function greet() {\n        echo "Hello, " . $this->name . "!\\n";\n    }\n}\n\n$user = new User("World");\n$user->greet();\n?>`,
    sql: `SELECT \n    u.name,\n    u.email,\n    COUNT(o.id) as order_count,\n    SUM(o.total) as total_spent\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.created_at >= '2024-01-01'\nGROUP BY u.id, u.name, u.email\nORDER BY total_spent DESC\nLIMIT 10;`,
    yaml: `version: '3.8'\nservices:\n  web:\n    build: .\n    ports:\n      - "8000:8000"\n    environment:\n      - DEBUG=1\n      - DATABASE_URL=postgres://user:pass@db:5432/myapp\n    depends_on:\n      - db\n      \n  db:\n    image: postgres:13\n    environment:\n      POSTGRES_DB: myapp\n      POSTGRES_USER: user\n      POSTGRES_PASSWORD: pass\n    volumes:\n      - postgres_data:/var/lib/postgresql/data\n\nvolumes:\n  postgres_data:`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct {\n    char* name;\n    int age;\n} User;\n\nvoid greet(User* user) {\n    printf("Hello, %s!\\n", user->name);\n}\n\nint main() {\n    User user = {"World", 42};\n    greet(&user);\n    return 0;\n}`,
    cpp: `#include <iostream>\n#include <string>\n\nclass User {\npublic:\n    std::string name;\n    int age;\n    \n    User(const std::string& n, int a) : name(n), age(a) {}\n    \n    void greet() const {\n        std::cout << "Hello, " << name << "!" << std::endl;\n    }\n};\n\nint main() {\n    User user("World", 42);\n    user.greet();\n    return 0;\n}`,
    csharp: `using System;\n\npublic class User\n{\n    public string Name { get; set; }\n    public int Age { get; set; }\n    \n    public User(string name, int age)\n    {\n        Name = name;\n        Age = age;\n    }\n    \n    public void Greet()\n    {\n        Console.WriteLine($"Hello, {Name}!");\n    }\n}\n\nclass Program\n{\n    static void Main()\n    {\n        var user = new User("World", 42);\n        user.Greet();\n    }\n}`,
    ruby: `class User\n  attr_reader :name, :age\n  \n  def initialize(name, age)\n    @name = name\n    @age = age\n  end\n  \n  def greet\n    puts "Hello, #{@name}!"\n  end\nend\n\nuser = User.new("World", 42)\nuser.greet`,
    swift: `import Foundation\n\nstruct User {\n    let name: String\n    let age: Int\n    \n    func greet() {\n        print("Hello, \\(name)!")\n    }\n}\n\nlet user = User(name: "World", age: 42)\nuser.greet()`,
    bash: `#!/bin/bash\n\ngreet() {\n    local name=$1\n    echo "Hello, $name!"\n}\n\n# Main script\nuser="World"\ngreet "$user"\n\n# Array example\nusers=("Alice" "Bob" "Charlie")\nfor user in "\${users[@]}"; do\n    greet "$user"\ndone`,
    json: `{\n  "users": [\n    {\n      "id": 1,\n      "name": "Alice Johnson",\n      "email": "alice@example.com",\n      "role": "admin",\n      "active": true,\n      "metadata": {\n        "last_login": "2024-01-15T10:30:00Z",\n        "preferences": {\n          "theme": "dark",\n          "notifications": true\n        }\n      }\n    },\n    {\n      "id": 2,\n      "name": "Bob Smith",\n      "email": "bob@example.com",\n      "role": "user",\n      "active": false\n    }\n  ]\n}`,
    jsx: `import React, { useState } from 'react';\n\nconst UserCard = ({ user }) => {\n  const [isExpanded, setIsExpanded] = useState(false);\n  \n  return (\n    <div className="user-card">\n      <h3>{user.name}</h3>\n      <p>{user.email}</p>\n      \n      <button \n        onClick={() => setIsExpanded(!isExpanded)}\n        className="toggle-btn"\n      >\n        {isExpanded ? 'Hide' : 'Show'} Details\n      </button>\n      \n      {isExpanded && (\n        <div className="details">\n          <p>Role: {user.role}</p>\n          <p>Status: {user.active ? 'Active' : 'Inactive'}</p>\n        </div>\n      )}\n    </div>\n  );\n};\n\nexport default UserCard;`,
    tsx: `import React, { useState } from 'react';\n\ninterface User {\n  id: number;\n  name: string;\n  email: string;\n  role: 'admin' | 'user';\n  active: boolean;\n}\n\ninterface Props {\n  user: User;\n}\n\nconst UserCard: React.FC<Props> = ({ user }) => {\n  const [isExpanded, setIsExpanded] = useState<boolean>(false);\n  \n  const toggleExpanded = (): void => {\n    setIsExpanded(!isExpanded);\n  };\n  \n  return (\n    <div className="user-card">\n      <h3>{user.name}</h3>\n      <p>{user.email}</p>\n      \n      <button onClick={toggleExpanded} className="toggle-btn">\n        {isExpanded ? 'Hide' : 'Show'} Details\n      </button>\n      \n      {isExpanded && (\n        <div className="details">\n          <p>Role: {user.role}</p>\n          <p>Status: {user.active ? 'Active' : 'Inactive'}</p>\n        </div>\n      )}\n    </div>\n  );\n};\n\nexport default UserCard;`,
    scss: `$primary-color: #667eea;\n$secondary-color: #764ba2;\n$border-radius: 8px;\n$box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n\n@mixin button-style($bg-color) {\n  background: linear-gradient(135deg, $bg-color, darken($bg-color, 10%));\n  border: none;\n  border-radius: $border-radius;\n  padding: 0.75rem 1.5rem;\n  color: white;\n  cursor: pointer;\n  transition: transform 0.2s ease;\n  \n  &:hover {\n    transform: translateY(-2px);\n    box-shadow: $box-shadow;\n  }\n}\n\n.user-card {\n  background: white;\n  border-radius: $border-radius;\n  padding: 1.5rem;\n  box-shadow: $box-shadow;\n  \n  h3 {\n    color: $primary-color;\n    margin: 0 0 0.5rem 0;\n  }\n  \n  .primary-btn {\n    @include button-style($primary-color);\n  }\n  \n  .secondary-btn {\n    @include button-style($secondary-color);\n  }\n}`,
    markdown: `# Code to Image Tool\n\n## Features\n\n- **Multi-language support**: JavaScript, TypeScript, Python, Rust, Go, and more\n- **Beautiful themes**: Choose from 18+ syntax highlighting themes\n- **Custom fonts**: 12 popular coding fonts including JetBrains Mono and Fira Code\n- **Advanced styling**: Control padding, blur effects, shadows, and more\n\n## Usage\n\n1. Select your preferred language\n2. Choose a theme that matches your style\n3. Customize the appearance with advanced options\n4. Generate your image!\n\n### Supported Languages\n\n| Language | File Extension | Sample Available |\n|----------|----------------|------------------|\n| JavaScript | .js | ✅ |\n| TypeScript | .ts | ✅ |\n| Python | .py | ✅ |\n| Rust | .rs | ✅ |\n| Go | .go | ✅ |\n\n> **Pro tip**: Use the custom gradient backgrounds for stunning visuals!\n\n## Code Example\n\n\`\`\`javascript\nfunction createBeautifulCode() {\n  return "Amazing syntax highlighting!";\n}\n\`\`\``
  };

  let code = sampleCode.javascript;
  let language = 'javascript';
  let themeId = themeOptions[0].id;
  let fontId = fontOptions[0].id;
  let theme = themeOptions[0];
  let font = fontOptions[0];
  let filename = 'snippet.js';
  let showWindowChrome = true;
  let padding = 24;
  let borderRadius = 14;
  let backdrop = 'gradient-dark'; // gradient-dark | gradient-light | solid | custom-gradient
  let solidBackground = '#0d1117';
  
  // New styling options
  let fontSize = 15;
  let lineHeight = 1.6;
  let showLineNumbers = false;
  let cardOpacity = 0.6;
  let shadowIntensity = 0.35;
  let blurEffect = 8;
  let customGradientStart = '#1f2937';
  let customGradientEnd = '#0d1117';
  let windowTitleBarStyle = 'default'; // default | minimal | macos-big-sur | ubuntu
  let codeTabWidth = 2;
  
  // Additional backdrop options
  const backdropOptions = [
    { id: 'gradient-dark', name: 'Gradient Dark' },
    { id: 'gradient-light', name: 'Gradient Light' },
    { id: 'solid', name: 'Solid Color' },
    { id: 'custom-gradient', name: 'Custom Gradient' },
    { id: 'mesh-gradient', name: 'Mesh Gradient' },
    { id: 'transparent', name: 'Transparent' }
  ];

  let previewFrame;
  let iframeContainer;
  let previewWidth = 1000;
  let previewHeight = 560;
  let currentTab = 'preview';
  let isGenerating = false;
  let generatedImage;

  const apiFeatureBullets = [
    'Generate branded code cards for release notes, changelogs, and blogs automatically',
    'Render at platform-specific dimensions for social media, docs, and in-app UIs',
    'Securely manage API tokens, usage analytics, and rate limits from the dashboard'
  ];

  const apiCodeSample = `curl -X POST https://api.pictify.io/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "html": "<div class=\"code-card\">' + code + '</div>",
    "width": 1600,
    "height": 900,
    "fileExtension": "png"
  }'`;

  // Rebuild iframe when inputs change
  let srcdocContent = '';
  let srcdocKey = '';

  $: filename = languageOptions.find(l => l.id === language)?.file || 'snippet.txt';
  $: theme = themeOptions.find(t => t.id === themeId) || themeOptions[0];
  $: font = fontOptions.find(f => f.id === fontId) || fontOptions[0];
  
  // Update code sample when language changes (but only if using a sample)
  let isUsingSample = true;
  $: if (isUsingSample && sampleCode[language]) {
    code = sampleCode[language];
  }

  function getPrismLanguageId(lang) {
    return lang === 'html' ? 'markup' : lang;
  }

  function highlighted() {
    try {
      const hast = refractor.highlight(code, getPrismLanguageId(language));
      return toHtml(hast);
    } catch (e) {
      return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }

  // Wrap each line in a span for CSS counter-based line numbers
  function addLineNumbers(html) {
    const lines = html.split('\n');
    return lines
      .map((line) => `<span class="line">${line.length ? line : '&nbsp;'}</span>`) 
      .join('\n');
  }

  function windowChromeHtml() {
    if (!showWindowChrome) return '';
    return `
      <div class="titlebar">
        <div class="traffic">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <div class="title">${filename}</div>
      </div>
    `;
  }

  function getWrapperBackgroundCss() {
    switch (backdrop) {
      case 'gradient-dark':
      return 'background: radial-gradient(1200px 600px at 10% -10%, #1f2937 0%, rgba(17,24,39,1) 35%, rgba(13,17,23,1) 100%);';
      case 'gradient-light':
      return 'background: radial-gradient(1200px 600px at 10% -10%, #e5e7eb 0%, #f3f4f6 35%, #ffffff 100%);';
      case 'custom-gradient':
        return `background: linear-gradient(135deg, ${customGradientStart} 0%, ${customGradientEnd} 100%);`;
      case 'mesh-gradient':
        return 'background: radial-gradient(circle at 20% 20%, #667eea 0%, transparent 50%), radial-gradient(circle at 80% 80%, #764ba2 0%, transparent 50%), radial-gradient(circle at 40% 40%, #f093fb 0%, transparent 50%), linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);';
      case 'transparent':
        return 'background: transparent;';
      case 'solid':
      default:
        return `background: ${solidBackground};`;
    }
  }

  function buildSrcDoc() {
    const codeHtmlRaw = highlighted();
    const codeHtml = showLineNumbers ? addLineNumbers(codeHtmlRaw) : codeHtmlRaw;
    const prismLang = getPrismLanguageId(language);
    return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="${theme.url}">
    ${font.css ? `<link rel="stylesheet" href="${font.css}">` : ''}
    ${returnStyleTag(`[styleOpen]
      :root { --pad: ${padding}px; --radius: ${borderRadius}px; --font-size: ${fontSize}px; --line-height: ${lineHeight}; --tab-width: ${codeTabWidth}; }
      html, body { margin: 0; padding: 0; }
      body { ${getWrapperBackgroundCss()} min-height: 100vh; display: flex; align-items: center; justify-content: center; }
      .wrapper { width: ${previewWidth}px; max-width: 100%; box-sizing: border-box; padding: calc(var(--pad) * 1.2); }
      .card { background: rgba(0,0,0,${cardOpacity}); backdrop-filter: blur(${blurEffect}px); border-radius: var(--radius); overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,${shadowIntensity}); }
      .titlebar { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(0,0,0,0.35); border-bottom: 1px solid rgba(255,255,255,0.06); }
      .traffic { display: flex; gap: 8px; }
      .dot { width: 10px; height: 10px; border-radius: 9999px; display: inline-block; }
      .dot.red { background: #ff5f56; }
      .dot.yellow { background: #ffbd2e; }
      .dot.green { background: #27c93f; }
      .title { color: rgba(255,255,255,0.8); font: 600 13px ${font.family}; }
      pre[class*="language-"] { margin: 0; padding: var(--pad); font: 400 var(--font-size)/var(--line-height) ${font.family}; border-radius: 0 0 var(--radius) var(--radius); overflow: auto; tab-size: var(--tab-width); -moz-tab-size: var(--tab-width); }
      code[class*="language-"] { font-family: ${font.family}; font-size: var(--font-size); line-height: var(--line-height); tab-size: var(--tab-width); -moz-tab-size: var(--tab-width); }
      ${showLineNumbers ? `.line-numbers code { counter-reset: linenumber; }
      .line-numbers code .line { padding-left: calc(var(--pad) * 0.5 + 1.8em); position: relative; }
      .line-numbers code .line::before { counter-increment: linenumber; content: counter(linenumber); position: absolute; left: calc(var(--pad) * 0.25); width: 0.8em; text-align: right; ${theme.id === 'coy' || theme.id === 'default' || theme.id === 'ghcolors' || theme.id === 'material-light' || theme.id === 'solarizedlight' || theme.id === 'prism-duotone-light' || theme.id === 'base16-ateliersulphurpool-light' ? 'color: rgba(17,24,39,0.45);' : 'color: rgba(255,255,255,0.45);'} }` : ''}
      /* Light themes need a different card background */
      ${theme.id === 'coy' || theme.id === 'default' || theme.id === 'ghcolors' || theme.id === 'material-light' || theme.id === 'solarizedlight' || theme.id === 'prism-duotone-light' || theme.id === 'base16-ateliersulphurpool-light' ? '.card { background: rgba(255,255,255,0.85); } .title { color: #111827; } .titlebar { background: rgba(255,255,255,0.6); border-bottom-color: rgba(0,0,0,0.06); }' : ''}
    [styleClose]`)}
  </head>
  <body>
    <div class="wrapper">
      <div class="card">
        ${windowChromeHtml()}
        <pre class="language-${prismLang}${showLineNumbers ? ' line-numbers' : ''}"><code class="language-${prismLang}">${codeHtml}</code></pre>
      </div>
    </div>
  </body>
</html>`;
  }

  // Explicitly track all dependencies for proper reactivity
  $: {
    // This block will re-run whenever any of these variables change
    code, language, theme, font, padding, borderRadius, backdrop, solidBackground, previewWidth, showWindowChrome, filename,
    fontSize, lineHeight, showLineNumbers, cardOpacity, shadowIntensity, blurEffect, customGradientStart, customGradientEnd, windowTitleBarStyle, codeTabWidth;
    srcdocContent = buildSrcDoc();
  }
  $: srcdocKey = srcdocContent;

  function updateScale(value) {
    iframeContainer.style.transform = `scale(${value})`;
    iframeContainer.style.transformOrigin = 'top left';
  }

  function updatePreviewSize() {
    if (!previewFrame) return;
    const width = parseInt(getComputedStyle(previewFrame).width.replace('px', ''));
    const height = parseInt(getComputedStyle(previewFrame).height.replace('px', ''));
    previewWidth = width;
    previewHeight = height;
  }

  // Function to update usage in local storage
  function updateUsage() {
    if (typeof window !== 'undefined') {
      freeGenerationsUsed++;
      localStorage.setItem(usageKey, freeGenerationsUsed.toString());
      localStorage.setItem(usageKey + '_date', new Date().toDateString());
    }
  }

  onMount(() => {
    updatePreviewSize();
    
    if (typeof window !== 'undefined') {
      // Load usage from local storage
      const usage = localStorage.getItem(usageKey);
      if (usage) {
        freeGenerationsUsed = parseInt(usage);
      }

      // Reset usage if it's a new day
      const lastUsageDate = localStorage.getItem(usageKey + '_date');
      const today = new Date().toDateString();
      if (lastUsageDate !== today) {
        freeGenerationsUsed = 0;
        localStorage.setItem(usageKey, '0');
        localStorage.setItem(usageKey + '_date', today);
      }
    }
  });

  async function generateImage() {
    // Check if non-logged in user has reached limit
    if (!isUserLoggedIn && freeGenerationsUsed >= maxFreeGenerations) {
      showUpgradePrompt = true;
      return;
    }

    isGenerating = true;
    currentTab = 'image';
    
    let html = buildSrcDoc();
    
    // Add watermark for non-logged in users after first generation
    if (!isUserLoggedIn && freeGenerationsUsed >= 1) {
      const watermarkDiv = `
        <div style="position: fixed; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9); 
                    padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 9999;
                    font-family: system-ui, -apple-system, sans-serif;">
          Created with <a href="https://pictify.io" style="color: #ff6b6b; text-decoration: none;">pictify.io</a>
        </div>
      `;
      
      html = html.replace('</body>', `${watermarkDiv}</body>`);
    }
    
    const width = previewFrame ? parseInt(getComputedStyle(previewFrame).width.replace('px','')) : previewWidth;
    const height = previewFrame ? parseInt(getComputedStyle(previewFrame).height.replace('px','')) : previewHeight;
    
    try {
      const { image } = await createImagePublic({ html, width, height, fileExtension: 'png' , selector:'.wrapper'});
      generatedImage = image;
      totalImagesGenerated++;

      // Update usage tracking for non-logged in users
      if (!isUserLoggedIn) {
        updateUsage();
      }

      // Show contextual prompts based on usage
      if (!isUserLoggedIn) {
        if (freeGenerationsUsed === 1) {
          showFirstGenerationPrompt = true;
        } else if (freeGenerationsUsed >= maxFreeGenerations) {
          showUpgradePrompt = true;
        }
      }
      
      toast.set({ message: 'Image generated!', duration: 1500 });
    } catch (e) {
      toast.set({ message: 'Failed to generate image', duration: 2000 });
    } finally {
      isGenerating = false;
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast.set({ message: 'Copied to clipboard !!', duration: 1500 });
    });
  }
  // Avoid literal <style> so Svelte's CSS preprocessor doesn't try to parse runtime styles
  function returnStyleTag(css) {
    const styleTagRegex = /<style>([\s\S]*?)<\/style>/;
    const match = styleTagRegex.exec(css);
    if (match) {
      return css;
    }
    return css
      .replace('[styleOpen]', '<$>')
      .replace('[styleClose]', '</$>')
      .replaceAll('$', 'style');
  }
</script>

<svelte:head>
  <title>Code Snippet to Image (Syntax Highlighter) | Pictify.io</title>
  <meta name="description" content="Convert code snippets to beautiful images with syntax highlighting. Free online tool powered by Pictify HTML to Image API." />
  <link rel="canonical" href="https://pictify.io/tools/code-to-image" />
  <meta property="og:title" content="Code to Image - Syntax Highlighted Code Screenshots" />
  <meta property="og:description" content="Create shareable code images with themes, fonts, and window frames. Free and fast." />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<section>
  <Nav />
  <main class="w-full py-6 px-6 flex flex-col items-center justify-center space-y-10 max-w-5xl mx-auto">
    <div class="text-center">
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter">Code Snippet <span class="text-[#ff6b6b]">to Image</span></h1>
      <p class="text-lg opacity-80 mt-3">Create beautiful, syntax‑highlighted code screenshots. Free tool powered by our HTML → Image API.</p>
    </div>

    <!-- Usage Progress Bar for non-logged in users -->
    {#if !isUserLoggedIn}
      <div class="w-full max-w-5xl mx-auto">
        <div class="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <div class="flex justify-between items-center mb-1.5">
                <span class="text-sm font-medium text-gray-700">Guest Generations</span>
                <span class="text-sm font-medium text-gray-700">{freeGenerationsUsed}/{maxFreeGenerations}</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-2">
                <div 
                  class="bg-gradient-to-r from-[#ff6b6b] to-[#ffc480] h-2 rounded-full transition-all duration-500" 
                  style="width: {usagePercentage}%" 
                />
              </div>
              {#if remainingGenerations > 0}
                <p class="text-sm text-gray-500 mt-1.5">Sign up free to unlock unlimited generations</p>
              {:else}
                <p class="text-sm text-gray-500 mt-1.5">Sign up free to unlock unlimited generations</p>
              {/if}
            </div>
            {#if remainingGenerations > 0}
              <div class="flex-shrink-0">
                <div class="relative group">
                  <div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
                  <a 
                    href="/signup?redirect=/tools/code-to-image"
                    class="py-2 px-4 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative border-[3px] border-gray-900 font-semibold bg-[#ff6b6b] tracking-wide text-white transition-all hover:shadow-lg hover:brightness-105 inline-block text-sm"
                  >
                    Sign Up Free
                  </a>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <div class="w-full bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="language" class="text-sm text-gray-600">Language</label>
          <select id="language" class="w-full border-2 border-gray-200 p-2 rounded-lg" bind:value={language} on:change={() => { /* update filename via reactive */ }}>
            {#each languageOptions as opt}
              <option value={opt.id}>{opt.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="theme" class="text-sm text-gray-600">Theme</label>
          <select id="theme" class="w-full border-2 border-gray-200 p-2 rounded-lg" bind:value={themeId}>
            {#each themeOptions as opt}
              <option value={opt.id}>
                {opt.name}
              </option>
            {/each}
          </select>
        </div>
        <div>
          <label for="font" class="text-sm text-gray-600">Font</label>
          <select id="font" class="w-full border-2 border-gray-200 p-2 rounded-lg" bind:value={fontId}>
            {#each fontOptions as opt}
              <option value={opt.id}>{opt.name}</option>
            {/each}
          </select>
        </div>
        <div class="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex items-center gap-2">
            <input id="chrome" type="checkbox" bind:checked={showWindowChrome} />
            <label for="chrome" class="text-sm text-gray-700">Show window frame</label>
          </div>
          <div>
            <label for="padding" class="text-sm text-gray-600">Padding</label>
            <input id="padding" class="w-full border-2 border-gray-200 p-2 rounded-lg" type="number" min="8" max="64" bind:value={padding} />
          </div>
          <div>
            <label for="radius" class="text-sm text-gray-600">Border radius</label>
            <input id="radius" class="w-full border-2 border-gray-200 p-2 rounded-lg" type="number" min="0" max="24" bind:value={borderRadius} />
          </div>
          <div>
            <label for="backdrop" class="text-sm text-gray-600">Backdrop</label>
            <select id="backdrop" class="w-full border-2 border-gray-200 p-2 rounded-lg" bind:value={backdrop}>
              {#each backdropOptions as option}
                <option value={option.id}>{option.name}</option>
              {/each}
            </select>
          </div>
          {#if backdrop === 'solid'}
            <div>
              <label for="solidBg" class="text-sm text-gray-600">Background</label>
              <input id="solidBg" class="w-full border-2 border-gray-200 p-2 rounded-lg" type="color" bind:value={solidBackground} />
            </div>
          {/if}
          {#if backdrop === 'custom-gradient'}
            <div>
              <label for="gradientStart" class="text-sm text-gray-600">Gradient Start</label>
              <input id="gradientStart" class="w-full border-2 border-gray-200 p-2 rounded-lg" type="color" bind:value={customGradientStart} />
            </div>
            <div>
              <label for="gradientEnd" class="text-sm text-gray-600">Gradient End</label>
              <input id="gradientEnd" class="w-full border-2 border-gray-200 p-2 rounded-lg" type="color" bind:value={customGradientEnd} />
            </div>
          {/if}
          <div>
            <label for="filename" class="text-sm text-gray-600">Filename</label>
            <input id="filename" class="w-full border-2 border-gray-200 p-2 rounded-lg" type="text" bind:value={filename} />
          </div>
        </div>
        
        <!-- Advanced Styling Options -->
        <div class="md:col-span-3 mt-6 pt-6 border-t border-gray-200">
          <h3 class="text-lg font-semibold text-gray-700 mb-4">Advanced Styling</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label for="fontSize" class="text-sm text-gray-600">Font Size</label>
              <input id="fontSize" class="w-full border-2 border-gray-200 p-2 rounded-lg" type="number" min="10" max="32" bind:value={fontSize} />
            </div>
            <div>
              <label for="lineHeight" class="text-sm text-gray-600">Line Height</label>
              <input id="lineHeight" class="w-full border-2 border-gray-200 p-2 rounded-lg" type="number" min="1" max="3" step="0.1" bind:value={lineHeight} />
            </div>
            <div>
              <label for="tabWidth" class="text-sm text-gray-600">Tab Width</label>
              <input id="tabWidth" class="w-full border-2 border-gray-200 p-2 rounded-lg" type="number" min="1" max="8" bind:value={codeTabWidth} />
            </div>
            <div class="flex items-center gap-2">
              <input id="lineNumbers" type="checkbox" bind:checked={showLineNumbers} />
              <label for="lineNumbers" class="text-sm text-gray-700">Show line numbers</label>
            </div>
            <div>
              <label for="cardOpacity" class="text-sm text-gray-600">Card Opacity</label>
              <input id="cardOpacity" class="w-full border-2 border-gray-200 p-2 rounded-lg" type="number" min="0" max="1" step="0.1" bind:value={cardOpacity} />
            </div>
            <div>
              <label for="shadowIntensity" class="text-sm text-gray-600">Shadow Intensity</label>
              <input id="shadowIntensity" class="w-full border-2 border-gray-200 p-2 rounded-lg" type="number" min="0" max="1" step="0.05" bind:value={shadowIntensity} />
            </div>
            <div>
              <label for="blurEffect" class="text-sm text-gray-600">Blur Effect</label>
              <input id="blurEffect" class="w-full border-2 border-gray-200 p-2 rounded-lg" type="number" min="0" max="20" bind:value={blurEffect} />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4">
        <div class="flex items-center justify-between">
        <label for="codeInput" class="text-sm text-gray-600">Code</label>
          <button 
            type="button" 
            class="text-xs text-blue-600 hover:text-blue-800 underline"
            on:click={() => { code = sampleCode[language] || ''; isUsingSample = true; }}
          >
            Load sample for {languageOptions.find(l => l.id === language)?.name}
          </button>
        </div>
        <textarea 
          id="codeInput" 
          class="w-full border-2 border-gray-200 p-3 rounded-xl font-mono text-sm min-h-[160px]" 
          bind:value={code}
          on:input={() => { isUsingSample = false; }}
          placeholder="Enter your code here or click 'Load sample' above..."
        />
      </div>
    </div>

    <div class="w-full grid grid-cols-1 gap-4">
      <div class="flex bg-black p-2 justify-between items-center rounded-lg">
        <div class="flex items-center gap-2">
          <button on:click={() => { currentTab = 'preview'; }} class="px-4 py-2 rounded text-sm {currentTab === 'preview' ? 'bg-white text-black' : 'bg-gray-500 text-white'}">Preview</button>
          <button on:click={generateImage} class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Generate Image
          </button>
        </div>
        {#if previewFrame}
          <div class="flex items-center gap-2 text-white">
            <span class="text-xs opacity-80">Size</span>
            <input id="widthInput" type="number" class="w-20 border-b-2 border-gray-300 focus:border-[#ff6b6b] text-xs bg-transparent text-center outline-none text-white" bind:value={previewWidth} min="400" max="1600" on:input={() => { if (previewFrame) { previewFrame.style.width = `${previewWidth}px`; } }} />
            <span class="text-gray-400">×</span>
            <input id="heightInput" type="number" class="w-20 border-b-2 border-gray-300 focus:border-[#ff6b6b] text-xs bg-transparent text-center outline-none text-white" bind:value={previewHeight} min="300" max="1200" on:input={() => { if (previewFrame) { previewFrame.style.height = `${previewHeight}px`; } }} />
            <span class="ml-4 text-xs opacity-80">Scale</span>
            <input type="number" class="w-16 border-b-2 border-gray-300 focus:border-[#ff6b6b] text-xs bg-transparent text-center outline-none text-white" value="1" min="0.5" max="2" step="0.1" on:input={(e) => updateScale(e.target.value)} />
          </div>
        {/if}
      </div>

      {#if currentTab === 'preview'}
        <div class="flex-1 flex flex-col border-4 border-black rounded-lg overflow-hidden">
          <div bind:this={iframeContainer} class="flex-1 overflow-auto">
            {#key srcdocKey}
              <iframe
                class="w-full h-[560px] bg-transparent"
                title="code-image-preview"
                srcdoc={srcdocContent}
                bind:this={previewFrame}
              />
            {/key}
          </div>
        </div>
      {:else}
        {#if isGenerating}
          <div class="flex flex-col justify-center items-center min-h-[400px] bg-gray-50 border-4 border-black rounded-lg">
            <Loader size="16" show={isGenerating} />
            <p class="mt-4 text-sm text-gray-600">Generating your image...</p>
          </div>
        {:else if generatedImage}
          <div class="flex flex-col border-4 border-black rounded-lg overflow-hidden">
            <div class="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-200">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-gray-900">Generated successfully!</span>
              </div>
              <div class="flex items-center gap-3">
                <a href={generatedImage.url} class="text-xs text-[#ff6b6b] hover:underline" target="_blank">Open in new tab →</a>
                <button on:click={() => copyToClipboard(generatedImage.url)} class="text-xs bg-black hover:bg-gray-800 text-white py-1.5 px-3 rounded flex items-center gap-2 transition-colors">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy URL
                </button>
              </div>
            </div>
            <div class="flex-1 overflow-auto bg-white">
              <img src={generatedImage.url} alt="Generated output" class="w-full h-auto" />
            </div>
          </div>

          <!-- Growth Loop Elements after image generation -->
          <div class="mt-8 bg-gradient-to-br from-[#ff6b6b]/5 to-[#ffc480]/5 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 md:p-8">
            <div class="text-center mb-8">
              <h3 class="text-2xl font-bold text-gray-900 mb-2">🎉 Your Code Image is Ready!</h3>
              <p class="text-gray-700">Join {totalImagesGenerated.toLocaleString()} others creating beautiful code images</p>
            </div>

            <!-- Growth Loop Elements -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <!-- Social Proof -->
              <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-12 h-12 bg-[#ff6b6b]/10 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#ff6b6b]" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900">Time Saved</h4>
                    <p class="text-sm text-gray-600">10+ minutes per image on average</p>
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-2 mt-4">
                  <div class="bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 text-center">
                    <p class="text-lg font-semibold text-gray-900">&lt; 3 sec</p>
                    <p class="text-xs text-gray-600">Generation Time</p>
                  </div>
                  <div class="bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 text-center">
                    <p class="text-lg font-semibold text-gray-900">25+</p>
                    <p class="text-xs text-gray-600">Languages</p>
                  </div>
                  <div class="bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 text-center">
                    <p class="text-lg font-semibold text-gray-900">18+</p>
                    <p class="text-xs text-gray-600">Themes</p>
                  </div>
                </div>
              </div>

              <!-- Usage Stats -->
              <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-12 h-12 bg-[#ff6b6b]/10 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#ff6b6b]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h10a1 1 0 110 2H9a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900">Growing Fast</h4>
                    <p class="text-sm text-gray-600">{Math.floor(totalImagesGenerated * 0.15).toLocaleString()} images this week</p>
                  </div>
                </div>
                <div class="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-[#ff6b6b] to-[#ffc480] w-[78%]" />
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {#if !isUserLoggedIn}
                <div class="relative w-auto flex-shrink-0 group">
                  <div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
                  <button 
                    class="py-4 rounded-lg px-8 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-semibold bg-[#ff6b6b] tracking-wide text-lg flex-shrink-0 text-white transition-all hover:shadow-lg hover:brightness-105"
                    on:click={() => window.location.href = '/signup?redirect=/tools/code-to-image'}
                  >
                    <span class="relative inline-flex items-center gap-2">
                      <span>Create Free Account</span>
                      <svg class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </span>
                  </button>
                </div>
              {/if}

              <!-- Share Buttons -->
              <div class="grid grid-cols-2 gap-4 {isUserLoggedIn ? 'md:col-span-2' : ''}">
                <div class="relative group w-full">
                  <div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
                  <button 
                    class="py-4 px-4 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-medium bg-black tracking-wide text-sm text-white transition-all hover:shadow-lg hover:brightness-105"
                    on:click={() => {
                      const shareUrl = encodeURIComponent(window.location.href);
                      const text = encodeURIComponent('Check out this awesome Code to Image Generator! Create beautiful syntax-highlighted code images instantly.');
                      window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`, '_blank');
                    }}
                  >
                    <span class="relative inline-flex items-center gap-2 justify-center">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span class="hidden md:inline">Share</span>
                    </span>
                  </button>
                </div>
                
                <div class="relative group w-full">
                  <div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
                  <button 
                    class="py-4 px-4 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-medium bg-[#0A66C2] tracking-wide text-sm text-white transition-all hover:shadow-lg hover:brightness-105"
                    on:click={() => {
                      const shareUrl = encodeURIComponent(window.location.href);
                      const text = encodeURIComponent('Check out this awesome Code to Image Generator! Create beautiful syntax-highlighted code images instantly.');
                      window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${encodeURIComponent('Code to Image Generator - Pictify.io')}&summary=${text}`, '_blank');
                    }}
                  >
                    <span class="relative inline-flex items-center gap-2 justify-center">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.065 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span class="hidden md:inline">Share</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <!-- SEO Content Sections -->
    <div class="max-w-6xl mx-auto px-6 md:px-0 mt-20">
      <!-- Separator -->
      <div class="border-t-4 border-gray-900 relative mb-16">
        <div class="absolute left-1/2 -top-4 -translate-x-1/2 bg-white px-4">
          <svg class="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
          </svg>
        </div>
      </div>

      <h2 class="text-4xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-r from-[#ff6b6b] to-[#ff8e8e] bg-clip-text text-transparent">Learn More About Code to Image Generation</h2>
      
      <!-- What is a Code to Image Generator Section -->
      <section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 class="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
          <span class="text-[#ff6b6b]">💻</span>
          What is a Code to Image Generator?
        </h3>
        <p class="text-lg text-gray-700 leading-relaxed mb-4">
          A Code to Image Generator is a powerful tool that converts your source code into beautiful, syntax-highlighted images. Perfect for sharing code snippets on social media, creating documentation, presentations, or blog posts. Our generator supports multiple programming languages and offers extensive customization options including themes, fonts, and styling.
        </p>
        <p class="text-lg text-gray-700 leading-relaxed">
          Whether you're a developer sharing code on Twitter, a technical writer creating documentation, or an educator preparing programming tutorials, our code to image generator makes your code visually appealing and professional-looking.
        </p>
      </section>

      <!-- Benefits Section -->
      <section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 class="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
          <span class="text-[#ff6b6b]">✨</span>
          Benefits of Using Our Code to Image Generator
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ul class="text-lg text-gray-700 space-y-4">
            <li class="flex items-start gap-3">
              <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Support for 25+ programming languages including JavaScript, Python, Java, C++, and more</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>18+ beautiful syntax highlighting themes including dark and light options</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>12+ popular coding fonts including JetBrains Mono, Fira Code, and more</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Customizable window frames and backgrounds for professional appearance</span>
            </li>
          </ul>
          <ul class="text-lg text-gray-700 space-y-4">
            <li class="flex items-start gap-3">
              <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Advanced styling options including opacity, shadows, and blur effects</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Real-time preview to see exactly how your image will look</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>High-quality PNG output perfect for social media and documentation</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-6 h-6 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>No watermarks and completely free to use</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- How to Use Section -->
      <section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 class="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
          <span class="text-[#ff6b6b]">🚀</span>
          How to Use Our Code to Image Generator
        </h3>
        <div class="space-y-6">
          <div class="flex items-start gap-4">
            <span class="bg-[#ff6b6b] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
            <div>
              <h4 class="font-semibold text-xl text-gray-900 mb-2">Choose Your Programming Language</h4>
              <p class="text-gray-700">Select from 25+ supported programming languages including JavaScript, Python, Java, C++, TypeScript, and more. Each language gets proper syntax highlighting automatically.</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <span class="bg-[#ff6b6b] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
            <div>
              <h4 class="font-semibold text-xl text-gray-900 mb-2">Paste or Type Your Code</h4>
              <p class="text-gray-700">Enter your code in the text area. You can use our sample code for each language or paste your own code snippet. The preview will update in real-time.</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <span class="bg-[#ff6b6b] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
            <div>
              <h4 class="font-semibold text-xl text-gray-900 mb-2">Customize the Appearance</h4>
              <p class="text-gray-700">Choose from 18+ themes, 12+ fonts, and customize padding, border radius, background styles, and advanced effects like shadows and blur.</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <span class="bg-[#ff6b6b] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">4</span>
            <div>
              <h4 class="font-semibold text-xl text-gray-900 mb-2">Preview Your Image</h4>
              <p class="text-gray-700">See exactly how your code image will look with our real-time preview. Adjust dimensions, scaling, and other settings as needed.</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <span class="bg-[#ff6b6b] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">5</span>
            <div>
              <h4 class="font-semibold text-xl text-gray-900 mb-2">Generate and Download</h4>
              <p class="text-gray-700">Click "Generate Image" to create your high-quality PNG image. Copy the URL or download the image directly to use in your projects.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Real-World Use Cases Section -->
      <section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 class="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
          <span class="text-[#ff6b6b]">🌍</span>
          Real-World Use Cases
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <h4 class="text-xl font-bold mb-3 text-gray-900 flex items-center gap-2">
              <span class="text-2xl">📱</span>
              Social Media Sharing
            </h4>
            <p class="text-gray-700">Share beautiful code snippets on Twitter, LinkedIn, Instagram, and other social platforms. Stand out with professional-looking code images that get more engagement.</p>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <h4 class="text-xl font-bold mb-3 text-gray-900 flex items-center gap-2">
              <span class="text-2xl">📚</span>
              Documentation & Tutorials
            </h4>
            <p class="text-gray-700">Create stunning code examples for technical documentation, API guides, and programming tutorials. Make your documentation more visually appealing and easier to follow.</p>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <h4 class="text-xl font-bold mb-3 text-gray-900 flex items-center gap-2">
              <span class="text-2xl">🎯</span>
              Presentations & Slides
            </h4>
            <p class="text-gray-700">Include beautiful code images in your technical presentations, conference talks, and educational slides. Perfect for highlighting key code concepts.</p>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <h4 class="text-xl font-bold mb-3 text-gray-900 flex items-center gap-2">
              <span class="text-2xl">✍️</span>
              Blog Posts & Articles
            </h4>
            <p class="text-gray-700">Enhance your technical blog posts and articles with syntax-highlighted code images. Make your content more engaging and professional-looking.</p>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <h4 class="text-xl font-bold mb-3 text-gray-900 flex items-center gap-2">
              <span class="text-2xl">🏫</span>
              Education & Teaching
            </h4>
            <p class="text-gray-700">Create clear, readable code examples for programming courses, workshops, and educational materials. Help students understand code structure visually.</p>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <h4 class="text-xl font-bold mb-3 text-gray-900 flex items-center gap-2">
              <span class="text-2xl">💼</span>
              Portfolio & Resume
            </h4>
            <p class="text-gray-700">Showcase your coding skills in portfolios and resumes with beautiful code screenshots. Demonstrate your expertise in various programming languages.</p>
          </div>
        </div>
      </section>

      <!-- Best Practices Section -->
      <section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 class="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
          <span class="text-[#ff6b6b]">⭐</span>
          Best Practices for Creating Code Images
        </h3>
        <p class="text-lg text-gray-700 leading-relaxed mb-6">
          To create the most effective and professional-looking code images, follow these best practices:
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h4 class="font-semibold text-xl text-gray-900">Code Quality & Readability</h4>
            <ul class="text-lg text-gray-700 space-y-3">
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Keep code snippets concise and focused on the main concept</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Use proper indentation and formatting for better readability</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Include meaningful comments when necessary</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Remove or replace sensitive information like API keys</span>
              </li>
            </ul>
          </div>
          <div class="space-y-4">
            <h4 class="font-semibold text-xl text-gray-900">Visual Design & Styling</h4>
            <ul class="text-lg text-gray-700 space-y-3">
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Choose themes that match your brand or presentation style</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Use high-contrast themes for better readability</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Select fonts that are clear and professional-looking</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Use appropriate padding and spacing for clean appearance</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="mt-8 p-6 bg-gradient-to-r from-[#ff6b6b]/5 to-[#ffc480]/5 rounded-xl border border-gray-200">
          <h4 class="font-semibold text-xl text-gray-900 mb-3 flex items-center gap-2">
            <span class="text-2xl">💡</span>
            Pro Tips
          </h4>
          <ul class="text-lg text-gray-700 space-y-3">
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Use line numbers for longer code snippets to help with references</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Test different background styles to find what works best for your use case</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Consider your target platform's image size requirements when setting dimensions</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-[#ff6b6b] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Save your favorite settings combinations for consistency across projects</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 class="text-3xl font-bold mb-8 text-gray-900 flex items-center gap-3">
          <span class="text-[#ff6b6b]">❓</span>
          Frequently Asked Questions
        </h3>
        <div class="space-y-4">
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
              <span class="font-semibold text-gray-900">What programming languages are supported?</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </summary>
            <div class="mt-4 px-4 text-gray-700">
              We support 25+ programming languages including JavaScript, TypeScript, Python, Java, C++, C#, PHP, Ruby, Go, Rust, Swift, HTML, CSS, SQL, JSON, YAML, Markdown, and many more. Each language gets proper syntax highlighting automatically.
            </div>
          </details>

          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
              <span class="font-semibold text-gray-900">Can I customize the appearance of my code images?</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </summary>
            <div class="mt-4 px-4 text-gray-700">
              Absolutely! You can choose from 18+ themes, 12+ coding fonts, customize padding, border radius, background styles, add window frames, and even apply advanced effects like shadows, blur, and opacity. The preview updates in real-time so you can see exactly how your image will look.
            </div>
          </details>

          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
              <span class="font-semibold text-gray-900">What image formats are supported?</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </summary>
            <div class="mt-4 px-4 text-gray-700">
              Currently, we generate high-quality PNG images, which are perfect for social media, documentation, and presentations. PNG format ensures crisp text rendering and supports transparency for flexible use in various contexts.
            </div>
          </details>

          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
              <span class="font-semibold text-gray-900">Is there a limit on code length?</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </summary>
            <div class="mt-4 px-4 text-gray-700">
              While there's no strict character limit, we recommend keeping code snippets reasonably sized for best visual results. Very long code may result in smaller text or require scrolling. For best results, focus on the most important parts of your code.
            </div>
          </details>

          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
              <span class="font-semibold text-gray-900">Can I use the generated images commercially?</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </summary>
            <div class="mt-4 px-4 text-gray-700">
              Yes! All images generated with our code to image generator can be used for both personal and commercial purposes. There are no watermarks and no licensing restrictions on the output images.
            </div>
          </details>

          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 transition-all hover:border-[#ff6b6b]/30">
              <span class="font-semibold text-gray-900">How do I share code images on social media?</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </summary>
            <div class="mt-4 px-4 text-gray-700">
              After generating your code image, you can download it directly or copy the image URL. Most social media platforms work well with our standard image dimensions. For Twitter, consider using a more horizontal aspect ratio, while Instagram works well with square formats.
            </div>
          </details>
        </div>
      </section>

      <!-- Supported Languages Section -->
      <section class="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 class="text-3xl font-bold mb-8 text-gray-900 flex items-center gap-3">
          <span class="text-[#ff6b6b]">🔧</span>
          Supported Programming Languages
        </h3>
        <p class="text-lg text-gray-700 leading-relaxed mb-6">
          Our code to image generator supports syntax highlighting for all major programming languages and file formats:
        </p>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">⚡</div>
            <span class="font-medium text-gray-900">JavaScript</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">🔷</div>
            <span class="font-medium text-gray-900">TypeScript</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">🐍</div>
            <span class="font-medium text-gray-900">Python</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">☕</div>
            <span class="font-medium text-gray-900">Java</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">⚙️</div>
            <span class="font-medium text-gray-900">C++</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">🔷</div>
            <span class="font-medium text-gray-900">C#</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">🐘</div>
            <span class="font-medium text-gray-900">PHP</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">💎</div>
            <span class="font-medium text-gray-900">Ruby</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">🐹</div>
            <span class="font-medium text-gray-900">Go</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">🦀</div>
            <span class="font-medium text-gray-900">Rust</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">🍎</div>
            <span class="font-medium text-gray-900">Swift</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">🌐</div>
            <span class="font-medium text-gray-900">HTML</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">🎨</div>
            <span class="font-medium text-gray-900">CSS</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">💅</div>
            <span class="font-medium text-gray-900">SCSS</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">🗃️</div>
            <span class="font-medium text-gray-900">SQL</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">📄</div>
            <span class="font-medium text-gray-900">JSON</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">📝</div>
            <span class="font-medium text-gray-900">YAML</span>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200 hover:border-[#ff6b6b]/30 transition-all">
            <div class="text-2xl mb-2">📋</div>
            <span class="font-medium text-gray-900">Markdown</span>
          </div>
        </div>
        <p class="text-center text-gray-600 mt-6">
          And many more! Each language gets proper syntax highlighting and formatting automatically.
        </p>
      </section>

      <!-- Social Sharing Section -->
      <section class="mb-16">
        <ApiPromptSection
          title="Automate code cards with our API"
          description="Push release notes, blog updates, and onboarding experiences live with consistent, on-brand code visuals rendered via API."
          featurePoints={apiFeatureBullets}
          codeSnippet={apiCodeSample}
          codeLanguage="bash"
          docsUrl="https://docs.pictify.io/"
          docsLabel="Explore HTML to Image API"
          secondaryCtaUrl="/dashboard/api-playground"
          secondaryCtaLabel="Try in API Playground"
          note="Need custom fonts or private templates? Talk to us for enterprise access."
        />
      </section>
    </div>

    <!-- First Generation Prompt -->
    {#if showFirstGenerationPrompt}
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white/90 backdrop-blur-sm rounded-2xl max-w-md w-full mx-auto p-8 shadow-lg">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900">🎉 Great First Image!</h3>
            <button 
              class="text-gray-500 hover:text-gray-700"
              on:click={() => showFirstGenerationPrompt = false}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="text-gray-700 mb-6">Create a free account to unlock:</p>
          
          <ul class="space-y-3 mb-6">
            <li class="flex items-center gap-2 text-gray-700">
              <svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="font-medium">Unlimited image generations</span>
            </li>
            <li class="flex items-center gap-2 text-gray-700">
              <svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              No watermarks
            </li>
            <li class="flex items-center gap-2 text-gray-700">
              <svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              API Access
            </li>
          </ul>

          <div class="space-y-4">
            <div class="relative group w-full">
              <div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
              <a 
                href="/signup?redirect=/tools/code-to-image"
                class="block w-full py-3 px-6 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative border-[3px] border-gray-900 font-semibold bg-[#ff6b6b] tracking-wide text-center text-white transition-all hover:shadow-lg hover:brightness-105"
              >
                Create Free Account
              </a>
            </div>

            <button
              class="w-full py-3 px-6 rounded-lg font-medium text-gray-700 hover:text-[#ff6b6b] transition-colors"
              on:click={() => showFirstGenerationPrompt = false}
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Upgrade Prompt -->
    {#if showUpgradePrompt}
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" style="margin-top: 0px;">
        <div class="bg-white/90 backdrop-blur-sm rounded-2xl max-w-md w-full mx-auto p-8 shadow-lg">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900">🎨 Ready to Create More?</h3>
            <button 
              class="text-gray-500 hover:text-gray-700"
              on:click={() => showUpgradePrompt = false}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="text-gray-700 mb-6">You've reached the guest limit. Create a free account to unlock:</p>
          
          <ul class="space-y-3 mb-6">
            <li class="flex items-center gap-2 text-gray-700">
              <svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="font-medium">Unlimited image generations</span>
            </li>
            <li class="flex items-center gap-2 text-gray-700">
              <svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              No watermarks
            </li>
            <li class="flex items-center gap-2 text-gray-700">
              <svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              API Access
            </li>
            <li class="flex items-center gap-2 text-gray-700">
              <svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Priority support
            </li>
          </ul>

          <div class="space-y-4">
            <div class="relative group w-full">
              <div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
              <a 
                href="/signup?redirect=/tools/code-to-image"
                class="block w-full py-3 px-6 rounded-lg group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative border-[3px] border-gray-900 font-semibold bg-[#ff6b6b] tracking-wide text-center text-white transition-all hover:shadow-lg hover:brightness-105"
              >
                Sign Up Free
              </a>
            </div>

            <button
              class="w-full py-3 px-6 rounded-lg font-medium text-gray-700 hover:text-[#ff6b6b] transition-colors"
              on:click={() => showUpgradePrompt = false}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    {/if}

    <Footer />
  </main>
  <Toast />
  
</section>


