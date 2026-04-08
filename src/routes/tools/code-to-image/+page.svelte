<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import { toast } from '../../../store/toast.store';
	import { createImagePublic } from '../../../api/image.js';
	import { user } from '../../../store/user.store';
	import ApiCodeSection from '$lib/components/tools/ApiCodeSection.svelte';
	import NextSteps from '$lib/components/tools/NextSteps.svelte';
	import GenerationLimitBanner from '$lib/components/tools/GenerationLimitBanner.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { generationLimits } from '../../../store/generationLimits.store';
	import { analytics } from '$lib/analytics.js';
	import RelatedTools from '$lib/components/tools/RelatedTools.svelte';
	import StickySignupBar from '$lib/components/tools/StickySignupBar.svelte';
	let stickyBar;

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

	const codeToImageExamples = [
		{
			id: 'javascript',
			label: 'JavaScript',
			fileName: 'code-screenshot.js',
			code: `<span class="text-[#6a9955]">// Generate a syntax-highlighted code screenshot</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">html</span> = <span class="text-[#ce9178]">'&lt;link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css"&gt;&lt;pre class="language-js" style="padding:32px"&gt;&lt;code&gt;const x = 42;&lt;/code&gt;&lt;/pre&gt;'</span>;

<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">response</span> = <span class="text-[#c586c0]">await</span> <span class="text-[#dcdcaa]">fetch</span>(<span class="text-[#ce9178]">'https://api.pictify.io/image'</span>, {
  <span class="text-[#9cdcfe]">method</span>: <span class="text-[#ce9178]">'POST'</span>,
  <span class="text-[#9cdcfe]">headers</span>: { <span class="text-[#ce9178]">'Content-Type'</span>: <span class="text-[#ce9178]">'application/json'</span>, <span class="text-[#ce9178]">'Authorization'</span>: <span class="text-[#ce9178]">'Bearer YOUR_API_KEY'</span> },
  <span class="text-[#9cdcfe]">body</span>: <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">stringify</span>({ <span class="text-[#9cdcfe]">html</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">800</span>, <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">400</span>, <span class="text-[#9cdcfe]">fileExtension</span>: <span class="text-[#ce9178]">'png'</span> })
});

<span class="text-[#c586c0]">const</span> { <span class="text-[#9cdcfe]">image</span> } = <span class="text-[#c586c0]">await</span> <span class="text-[#9cdcfe]">response</span>.<span class="text-[#dcdcaa]">json</span>();
<span class="text-[#9cdcfe]">console</span>.<span class="text-[#dcdcaa]">log</span>(<span class="text-[#9cdcfe]">image</span>.<span class="text-[#9cdcfe]">url</span>); <span class="text-[#6a9955]">// CDN-hosted code image</span>`
		},
		{
			id: 'python',
			label: 'Python',
			fileName: 'code_screenshot.py',
			code: `<span class="text-[#c586c0]">import</span> <span class="text-[#9cdcfe]">requests</span>

<span class="text-[#9cdcfe]">html</span> = <span class="text-[#ce9178]">'&lt;link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-dracula.min.css"&gt;&lt;pre class="language-python" style="padding:32px"&gt;&lt;code&gt;def fib(n): return n if n &lt; 2 else fib(n-1) + fib(n-2)&lt;/code&gt;&lt;/pre&gt;'</span>

<span class="text-[#9cdcfe]">resp</span> = <span class="text-[#9cdcfe]">requests</span>.<span class="text-[#dcdcaa]">post</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>,
    <span class="text-[#9cdcfe]">headers</span>={<span class="text-[#ce9178]">"Authorization"</span>: <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>},
    <span class="text-[#9cdcfe]">json</span>={<span class="text-[#ce9178]">"html"</span>: <span class="text-[#9cdcfe]">html</span>, <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">800</span>, <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">400</span>})

<span class="text-[#dcdcaa]">print</span>(<span class="text-[#9cdcfe]">resp</span>.<span class="text-[#dcdcaa]">json</span>()[<span class="text-[#ce9178]">"url"</span>])`
		},
		{
			id: 'go',
			label: 'Go',
			fileName: 'main.go',
			code: `<span class="text-[#c586c0]">package</span> <span class="text-[#9cdcfe]">main</span>

<span class="text-[#c586c0]">import</span> (<span class="text-[#ce9178]">"bytes"</span>; <span class="text-[#ce9178]">"encoding/json"</span>; <span class="text-[#ce9178]">"net/http"</span>)

<span class="text-[#c586c0]">func</span> <span class="text-[#dcdcaa]">main</span>() {
    <span class="text-[#9cdcfe]">body</span>, _ := <span class="text-[#9cdcfe]">json</span>.<span class="text-[#dcdcaa]">Marshal</span>(<span class="text-[#c586c0]">map</span>[<span class="text-[#c586c0]">string</span>]<span class="text-[#c586c0]">any</span>{
        <span class="text-[#ce9178]">"html"</span>: <span class="text-[#ce9178]">"&lt;pre class='language-go'&gt;&lt;code&gt;fmt.Println()&lt;/code&gt;&lt;/pre&gt;"</span>,
        <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">800</span>, <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">400</span>,
    })
    <span class="text-[#9cdcfe]">req</span>, _ := <span class="text-[#9cdcfe]">http</span>.<span class="text-[#dcdcaa]">NewRequest</span>(<span class="text-[#ce9178]">"POST"</span>, <span class="text-[#ce9178]">"https://api.pictify.io/image"</span>, <span class="text-[#9cdcfe]">bytes</span>.<span class="text-[#dcdcaa]">NewBuffer</span>(<span class="text-[#9cdcfe]">body</span>))
    <span class="text-[#9cdcfe]">req</span>.<span class="text-[#9cdcfe]">Header</span>.<span class="text-[#dcdcaa]">Set</span>(<span class="text-[#ce9178]">"Authorization"</span>, <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>)
    <span class="text-[#9cdcfe]">http</span>.<span class="text-[#9cdcfe]">DefaultClient</span>.<span class="text-[#dcdcaa]">Do</span>(<span class="text-[#9cdcfe]">req</span>)
}`
		}
	];

	const themeOptions = [
		// Dark themes
		{
			id: 'okaidia',
			name: 'Okaidia (Dark)',
			url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css'
		},
		{
			id: 'twilight',
			name: 'Twilight (Dark)',
			url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-twilight.min.css'
		},
		{
			id: 'dark',
			name: 'Dark',
			url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-dark.min.css'
		},
		{
			id: 'dracula',
			name: 'Dracula',
			url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-dracula.min.css'
		},
		{
			id: 'vs-dark',
			name: 'VS Dark',
			url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-vsc-dark-plus.min.css'
		},
		{
			id: 'atom-dark',
			name: 'Atom One Dark',
			url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-atom-dark.min.css'
		},
		{
			id: 'nord',
			name: 'Nord',
			url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-nord.min.css'
		},
		{
			id: 'material-dark',
			name: 'Material Dark',
			url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-material-dark.min.css'
		},
		{
			id: 'night-owl',
			name: 'Night Owl',
			url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-night-owl.min.css'
		},

		// Light themes
		{
			id: 'default',
			name: 'Default (Light)',
			url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css'
		},
		{
			id: 'coy',
			name: 'Coy (Light)',
			url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-coy.min.css'
		},
		{
			id: 'solarizedlight',
			name: 'Solarized Light',
			url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-solarizedlight.min.css'
		},
		{
			id: 'ghcolors',
			name: 'GitHub Colors',
			url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-ghcolors.min.css'
		},
		{
			id: 'material-light',
			name: 'Material Light',
			url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-material-light.min.css'
		},
		{
			id: 'xonokai',
			name: 'Xonokai',
			url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-xonokai.min.css'
		},
		{
			id: 'base16-ateliersulphurpool-light',
			name: 'Base16 Light',
			url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-base16-ateliersulphurpool.light.min.css'
		},
		{
			id: 'prism-duotone-light',
			name: 'Duotone Light',
			url: 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-duotone-light.min.css'
		}
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
		{
			id: 'jetbrains',
			name: 'JetBrains Mono',
			css: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap',
			family: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
		},
		{
			id: 'fira',
			name: 'Fira Code',
			css: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&display=swap',
			family: "'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
		},
		{
			id: 'source',
			name: 'Source Code Pro',
			css: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;600&display=swap',
			family: "'Source Code Pro', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
		},
		{
			id: 'roboto',
			name: 'Roboto Mono',
			css: 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap',
			family: "'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
		},
		{
			id: 'inconsolata',
			name: 'Inconsolata',
			css: 'https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;600&display=swap',
			family: "'Inconsolata', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
		},
		{
			id: 'ubuntu',
			name: 'Ubuntu Mono',
			css: 'https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;700&display=swap',
			family: "'Ubuntu Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
		},
		{
			id: 'space',
			name: 'Space Mono',
			css: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap',
			family: "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
		},
		{
			id: 'courier',
			name: 'Courier New',
			css: '',
			family:
				"'Courier New', Courier, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
		},
		{
			id: 'menlo',
			name: 'Menlo',
			css: '',
			family: 'Menlo, ui-monospace, SFMono-Regular, Monaco, Consolas, monospace'
		},
		{
			id: 'monaco',
			name: 'Monaco',
			css: '',
			family: 'Monaco, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
		},
		{
			id: 'consolas',
			name: 'Consolas',
			css: '',
			family: 'Consolas, ui-monospace, SFMono-Regular, Menlo, Monaco, monospace'
		},
		{
			id: 'cascadia',
			name: 'Cascadia Code',
			css: 'https://fonts.googleapis.com/css2?family=Cascadia+Code:wght@400;600&display=swap',
			family: "'Cascadia Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
		}
	];

	// Growth loop variables
	let usageKey = 'pictify_code_image_usage';
	let maxFreeGenerations = 5;
	let freeGenerationsUsed = 0;
	let shareBonusGenerations = 0; // +1/day via share (guest only)
	const bonusKey = usageKey + '_bonus';
	let isUserLoggedIn = false;
	let showUpgradePrompt = false;
	let showFirstGenerationPrompt = false;
	let totalImagesGenerated = 67891; // Social proof counter

	// Add user store subscription
	user.subscribe((userData) => {
		isUserLoggedIn = !!userData.email;
	});

	// Computed properties for usage tracking
	$: effectiveMaxFreeGenerations =
		maxFreeGenerations + (isUserLoggedIn ? 0 : shareBonusGenerations);
	$: remainingGenerations = effectiveMaxFreeGenerations - freeGenerationsUsed;
	$: usagePercentage = effectiveMaxFreeGenerations
		? (freeGenerationsUsed / effectiveMaxFreeGenerations) * 100
		: 0;

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

	$: filename = languageOptions.find((l) => l.id === language)?.file || 'snippet.txt';
	$: theme = themeOptions.find((t) => t.id === themeId) || themeOptions[0];
	$: font = fontOptions.find((f) => f.id === fontId) || fontOptions[0];

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
			return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
      pre[class*="language-"] { margin: 0; padding: var(--pad); font: 400 var(--font-size)/var(--line-height) ${
				font.family
			}; border-radius: 0 0 var(--radius) var(--radius); overflow: auto; tab-size: var(--tab-width); -moz-tab-size: var(--tab-width); }
      code[class*="language-"] { font-family: ${
				font.family
			}; font-size: var(--font-size); line-height: var(--line-height); tab-size: var(--tab-width); -moz-tab-size: var(--tab-width); }
      ${
				showLineNumbers
					? `.line-numbers code { counter-reset: linenumber; }
      .line-numbers code .line { padding-left: calc(var(--pad) * 0.5 + 1.8em); position: relative; }
      .line-numbers code .line::before { counter-increment: linenumber; content: counter(linenumber); position: absolute; left: calc(var(--pad) * 0.25); width: 0.8em; text-align: right; ${
				theme.id === 'coy' ||
				theme.id === 'default' ||
				theme.id === 'ghcolors' ||
				theme.id === 'material-light' ||
				theme.id === 'solarizedlight' ||
				theme.id === 'prism-duotone-light' ||
				theme.id === 'base16-ateliersulphurpool-light'
					? 'color: rgba(17,24,39,0.45);'
					: 'color: rgba(255,255,255,0.45);'
			} }`
					: ''
			}
      /* Light themes need a different card background */
      ${
				theme.id === 'coy' ||
				theme.id === 'default' ||
				theme.id === 'ghcolors' ||
				theme.id === 'material-light' ||
				theme.id === 'solarizedlight' ||
				theme.id === 'prism-duotone-light' ||
				theme.id === 'base16-ateliersulphurpool-light'
					? '.card { background: rgba(255,255,255,0.85); } .title { color: #111827; } .titlebar { background: rgba(255,255,255,0.6); border-bottom-color: rgba(0,0,0,0.06); }'
					: ''
			}
    [styleClose]`)}
  </head>
  <body>
    <div class="wrapper">
      <div class="card">
        ${windowChromeHtml()}
        <pre class="language-${prismLang}${
			showLineNumbers ? ' line-numbers' : ''
		}"><code class="language-${prismLang}">${codeHtml}</code></pre>
      </div>
    </div>
  </body>
</html>`;
	}

	// Explicitly track all dependencies for proper reactivity
	$: {
		// This block will re-run whenever any of these variables change
		code,
			language,
			theme,
			font,
			padding,
			borderRadius,
			backdrop,
			solidBackground,
			previewWidth,
			showWindowChrome,
			filename,
			fontSize,
			lineHeight,
			showLineNumbers,
			cardOpacity,
			shadowIntensity,
			blurEffect,
			customGradientStart,
			customGradientEnd,
			windowTitleBarStyle,
			codeTabWidth;
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
		// Track tool opened
		analytics.trackToolOpened({ tool_name: 'code_to_image' });

		// Apply presets from query params (used by /templates gallery)
		const params = $page?.url?.searchParams;
		if (params) {
			const qLang = params.get('language');
			const qTheme = params.get('theme');
			const qFont = params.get('font');
			const qW = parseInt(params.get('width') || '', 10);
			const qH = parseInt(params.get('height') || '', 10);

			if (qLang) language = qLang;
			if (qTheme && themeOptions.some((t) => t.id === qTheme)) themeId = qTheme;
			if (qFont && fontOptions.some((f) => f.id === qFont)) fontId = qFont;
			if (!Number.isNaN(qW) && !Number.isNaN(qH) && qW > 0 && qH > 0) {
				previewWidth = qW;
				previewHeight = qH;
			}
		}

		updatePreviewSize();

		if (typeof window !== 'undefined') {
			// Load usage from local storage
			const usage = localStorage.getItem(usageKey);
			if (usage) {
				freeGenerationsUsed = parseInt(usage);
			}

			// Load share bonus
			const bonus = localStorage.getItem(bonusKey);
			if (bonus) {
				shareBonusGenerations = parseInt(bonus);
			}

			// Reset usage if it's a new day
			const lastUsageDate = localStorage.getItem(usageKey + '_date');
			const lastBonusDate = localStorage.getItem(bonusKey + '_date');
			const today = new Date().toDateString();
			if (lastUsageDate !== today) {
				freeGenerationsUsed = 0;
				localStorage.setItem(usageKey, '0');
				localStorage.setItem(usageKey + '_date', today);
			}
			if (lastBonusDate !== today) {
				shareBonusGenerations = 0;
				localStorage.setItem(bonusKey, '0');
				localStorage.setItem(bonusKey + '_date', today);
			}
		}
	});

	function buildCurlSnippetFromHtml(html, width, height) {
		const payload = {
			html: String(html || ''),
			width: Number(width) || 1200,
			height: Number(height) || 630,
			fileExtension: 'png'
		};
		return `curl -X POST https://api.pictify.io/image \\\\\n  -H "Content-Type: application/json" \\\\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\\\n  -d '${JSON.stringify(
			payload,
			null,
			2
		)}'`;
	}

	$: nextStepsCurlSnippet = buildCurlSnippetFromHtml(buildSrcDoc(), previewWidth, previewHeight);
	$: nextStepsTemplateDraft = generatedImage?.url
		? {
				version: 1,
				name: 'Code card template',
				type: 'social-media',
				width: previewWidth,
				height: previewHeight,
				backgroundImageUrl: generatedImage.url,
				source: 'code-to-image'
		  }
		: null;

	async function generateImage() {
		// Check if non-logged in user has reached limit
		if (!isUserLoggedIn && freeGenerationsUsed >= effectiveMaxFreeGenerations) {
			showUpgradePrompt = true;
			return;
		}

		// Track generation in global limits store
		generationLimits.increment();
		isGenerating = true;
		currentTab = 'image';

		let html = buildSrcDoc();

		// Add watermark for ALL non-logged in users
		if (!isUserLoggedIn) {
			const watermarkDiv = `
        <div style="position: fixed; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9);
                    padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 9999;
                    font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          Created with <a href="https://pictify.io" style="color: #ff6b6b; text-decoration: none; font-weight: 600;">pictify.io</a>
        </div>
      `;

			html = html.replace('</body>', `${watermarkDiv}</body>`);
		}

		const width = previewFrame
			? parseInt(getComputedStyle(previewFrame).width.replace('px', ''))
			: previewWidth;
		const height = previewFrame
			? parseInt(getComputedStyle(previewFrame).height.replace('px', ''))
			: previewHeight;

		try {
			const { image } = await createImagePublic({
				html,
				width,
				height,
				fileExtension: 'png',
				selector: '.wrapper'
			});
			generatedImage = image;
			totalImagesGenerated++;

			// Track image generation
			analytics.trackImageGenerated({
				tool_name: 'code_to_image',
				format: 'png',
				with_watermark: !isUserLoggedIn
			});

			// Trigger sticky bar experiment
			if (!isUserLoggedIn && stickyBar) {
				stickyBar.triggerAfterGeneration();
			}

			// Update usage tracking for non-logged in users
			if (!isUserLoggedIn) {
				updateUsage();
			}

			// Show contextual prompts based on usage
			if (!isUserLoggedIn) {
				if (freeGenerationsUsed === 1) {
					showFirstGenerationPrompt = true;
				} else if (freeGenerationsUsed >= effectiveMaxFreeGenerations) {
					showUpgradePrompt = true;
				}
			}

			toast.set({ message: 'Image generated!', type: 'success', duration: 1500 });
		} catch (e) {
			toast.set({ message: 'Failed to generate image', type: 'error', duration: 2000 });
		} finally {
			isGenerating = false;
		}
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'Copied to clipboard !!', type: 'success', duration: 1500 });
		});
	}

	// Share reward: +1 guest generation today (once)
	function handleSocialShare(platform) {
		if (typeof window === 'undefined') return;
		const shareUrl = encodeURIComponent(window.location.href);
		const text = encodeURIComponent('Check out this awesome Code to Image Generator!');

		if (platform === 'twitter') {
			window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`, '_blank');
		} else if (platform === 'linkedin') {
			window.open(
				`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${encodeURIComponent(
					'Code to Image Generator'
				)}&summary=${text}`,
				'_blank'
			);
		}

		if (!isUserLoggedIn && shareBonusGenerations < 1) {
			shareBonusGenerations = 1;
			try {
				localStorage.setItem(bonusKey, String(shareBonusGenerations));
				localStorage.setItem(bonusKey + '_date', new Date().toDateString());
			} catch (e) {}
			toast.set({
				message: 'Thanks for sharing! +1 extra guest generation unlocked for today.',
				type: 'success',
				duration: 2500
			});
		}
	}
	// Avoid literal style tags so Svelte's CSS preprocessor doesn't try to parse runtime content
	function returnStyleTag(css) {
		// Build tag strings using character codes to completely avoid any style-like text
		const openTag = String.fromCharCode(60, 115, 116, 121, 108, 101, 62);
		const closeTag = String.fromCharCode(60, 47, 115, 116, 121, 108, 101, 62);
		const tagRegex = new RegExp(openTag + '([\\s\\S]*?)' + closeTag);
		const match = tagRegex.exec(css);
		if (match) {
			return css;
		}
		return css.replace('[styleOpen]', openTag).replace('[styleClose]', closeTag);
	}

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'What programming languages are supported?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'We support 25+ programming languages including JavaScript, TypeScript, Python, Java, C++, C#, PHP, Ruby, Go, Rust, Swift, HTML, CSS, SQL, JSON, YAML, Markdown, and many more.'
				}
			},
			{
				'@type': 'Question',
				name: 'Can I customize the appearance?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Yes! Choose from 18+ themes, 12+ coding fonts, customize padding, border radius, background styles, window frames, and advanced effects like shadows and blur.'
				}
			},
			{
				'@type': 'Question',
				name: 'What image formats are supported?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'We generate high-quality PNG images, perfect for social media, documentation, and presentations with crisp text rendering and transparency support.'
				}
			},
			{
				'@type': 'Question',
				name: 'Is there a limit on code length?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'No strict limit, but we recommend keeping snippets reasonably sized for best visual results. Focus on the most important parts of your code.'
				}
			},
			{
				'@type': 'Question',
				name: 'Can I use images commercially?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Yes! All generated images can be used for personal and commercial purposes. Guest limits may apply, and free accounts remove watermarks.'
				}
			}
		]
	};

</script>

<svelte:head>
	<title>Code to Image — Syntax Highlighted Screenshots | Pictify</title>
	<meta
		name="description"
		content="Free code to image generator with syntax highlighting. Convert code snippets to beautiful screenshot images in 25+ languages, 18+ themes. API available for automation."
	/>
	<link rel="canonical" href="https://pictify.io/tools/code-to-image" />
	<meta property="og:title" content="Code to Image — Syntax Highlighted Screenshots | Pictify" />
	<meta
		property="og:description"
		content="Create shareable code images with themes, fonts, and window frames. Free and fast."
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@pictify_io" />
	<meta name="twitter:title" content="Code to Image — Syntax Highlighted Screenshots | Pictify" />
	<meta name="twitter:description" content="Free code to image generator with syntax highlighting. Convert code snippets to beautiful screenshot images in 25+ languages, 18+ themes. API available for automation." />
	<meta property="og:url" content="https://pictify.io/tools/code-to-image" />
	<meta property="og:image" content="https://media.pictify.io/by55n-1775406886142.png" />
	<meta name="twitter:image" content="https://media.pictify.io/by55n-1775406886142.png" />
	{@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pictify.io/' },
			{ '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://pictify.io/tools' },
			{ '@type': 'ListItem', position: 3, name: 'Code to Image' }
		]
	})}</script>`}
</svelte:head>

<section class="w-full min-h-screen bg-[#FFFDF8] relative overflow-hidden font-['Manrope']">
	<Nav />

	<!-- Background Elements -->
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"
	/>
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"
	/>
	<div
		class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ff6b6b]/5 rounded-full blur-[80px] -z-10 pointer-events-none"
	/>

	<main
		class="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-24 md:pb-32 relative z-10"
	>
		<!-- Breadcrumb -->
		<nav class="mb-12 flex justify-center">
			<ol
				class="inline-flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937]"
			>
				<li><a href="/" class="text-gray-500 hover:text-gray-900 transition-colors">Home</a></li>
				<li class="text-gray-300">/</li>
				<li>
					<a href="/tools" class="text-gray-500 hover:text-gray-900 transition-colors">Tools</a>
				</li>
				<li class="text-gray-300">/</li>
				<li class="text-gray-900">Code to Image</li>
			</ol>
		</nav>

		<!-- Hero Section -->
		<div
			class="relative flex flex-col items-center justify-center text-center mb-8 sm:mb-12 lg:mb-16 pt-4 sm:pt-10"
		>
			<!-- Badge -->
			<div
				class="inline-flex transform -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-default mb-4 sm:mb-8"
			>
				<div
					class="px-4 sm:px-6 py-1.5 sm:py-2 bg-[#ffc480] border-[3px] sm:border-[4px] border-black text-black font-black text-xs sm:text-sm md:text-base uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					★ Free Tool
				</div>
			</div>

			<!-- Main Title -->
			<h1
				class="relative z-10 text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-tight mb-4 sm:mb-8"
			>
				<span class="block sm:inline">CODE TO</span>
				<span class="relative inline-block text-white mt-1 sm:mt-2 md:mt-0 md:ml-3">
					<span class="relative z-10 px-2 sm:px-3 md:px-4">IMAGE</span>
					<span
						class="absolute inset-0 bg-[#ff6b6b] transform -skew-x-3 border-[3px] sm:border-[4px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] -z-0"
					/>
				</span>
			</h1>

			<!-- Description -->
			<div class="max-w-2xl mx-auto px-2">
				<p
					class="text-base sm:text-lg md:text-xl text-gray-800 font-bold leading-relaxed border-[3px] border-black bg-white p-4 sm:p-6 shadow-[4px_4px_0_0_#e5e7eb] sm:shadow-[8px_8px_0_0_#e5e7eb]"
				>
					Create beautiful, <span
						class="bg-[#ffc480] px-1 border-b-[2px] sm:border-b-[3px] border-black"
						>syntax-highlighted</span
					>
					code screenshots.
					<span class="text-gray-500 text-sm sm:text-base mt-2 sm:mt-3 block font-semibold"
						>Perfect for social media, blogs, and documentation</span
					>
				</p>
			</div>
		</div>

		<!-- Generation Limit Banner -->
		<GenerationLimitBanner toolName="code_to_image" />

		<div class="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-8 items-start">
			<!-- Left Column: Controls -->
			<div
				class="bg-white border-[3px] border-black shadow-[6px_6px_0_0_#000] lg:shadow-[8px_8px_0_0_#000] lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] overflow-hidden order-2 lg:order-1"
			>
				<!-- Terminal Header -->
				<div
					class="bg-black text-white px-4 py-3 flex justify-between items-center border-b-[3px] border-black"
				>
					<h2 class="font-bold font-mono tracking-widest text-xs uppercase flex items-center gap-2">
						<span class="animate-pulse">_</span> CONFIG
					</h2>
					<div class="flex gap-2">
						<div class="w-3 h-3 bg-[#ff6b6b] border border-black" />
						<div class="w-3 h-3 bg-[#ffc480] border border-black" />
						<div class="w-3 h-3 bg-[#4ade80] border border-black" />
					</div>
				</div>
				<div
					class="p-4 sm:p-6 overflow-y-auto custom-scrollbar max-h-[60vh] lg:max-h-[calc(100vh-14rem)]"
				>
					<div class="space-y-6">
						<!-- Language & Theme -->
						<div class="space-y-4">
							<div>
								<label
									for="language"
									class="block text-xs font-black text-black mb-1.5 uppercase tracking-wider"
									>Language</label
								>
								<div class="relative">
									<select
										id="language"
										class="w-full bg-white border-[3px] border-black text-black text-sm font-bold shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none block p-2.5 appearance-none cursor-pointer"
										bind:value={language}
										on:change={() => {
											/* update filename via reactive */
										}}
									>
										{#each languageOptions as opt}
											<option value={opt.id}>{opt.name}</option>
										{/each}
									</select>
									<div
										class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-black"
									>
										<svg
											class="fill-current h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											><path
												d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
											/></svg
										>
									</div>
								</div>
							</div>

							<div>
								<label
									for="theme"
									class="block text-xs font-black text-black mb-1.5 uppercase tracking-wider"
									>Theme</label
								>
								<div class="relative">
									<select
										id="theme"
										class="w-full bg-white border-[3px] border-black text-black text-sm font-bold shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none block p-2.5 appearance-none cursor-pointer"
										bind:value={themeId}
									>
										{#each themeOptions as opt}
											<option value={opt.id}>{opt.name}</option>
										{/each}
									</select>
									<div
										class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-black"
									>
										<svg
											class="fill-current h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											><path
												d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
											/></svg
										>
									</div>
								</div>
							</div>

							<div>
								<label
									for="font"
									class="block text-xs font-black text-black mb-1.5 uppercase tracking-wider"
									>Font</label
								>
								<div class="relative">
									<select
										id="font"
										class="w-full bg-white border-[3px] border-black text-black text-sm font-bold shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none block p-2.5 appearance-none cursor-pointer"
										bind:value={fontId}
									>
										{#each fontOptions as opt}
											<option value={opt.id}>{opt.name}</option>
										{/each}
									</select>
									<div
										class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-black"
									>
										<svg
											class="fill-current h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											><path
												d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
											/></svg
										>
									</div>
								</div>
							</div>
						</div>

						<div class="h-[3px] bg-black" />

						<!-- Appearance -->
						<div class="space-y-4">
							<div>
								<label
									for="backdrop"
									class="block text-xs font-black text-black mb-1.5 uppercase tracking-wider"
									>Background</label
								>
								<div class="relative">
									<select
										id="backdrop"
										class="w-full bg-white border-[3px] border-black text-black text-sm font-bold shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none block p-2.5 appearance-none cursor-pointer"
										bind:value={backdrop}
									>
										{#each backdropOptions as option}
											<option value={option.id}>{option.name}</option>
										{/each}
									</select>
									<div
										class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-black"
									>
										<svg
											class="fill-current h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											><path
												d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
											/></svg
										>
									</div>
								</div>
							</div>

							{#if backdrop === 'solid'}
								<div>
									<label
										for="solidBg"
										class="block text-xs font-black text-black mb-1.5 uppercase tracking-wider"
										>Color</label
									>
									<div class="flex items-center gap-2">
										<input
											id="solidBg"
											class="h-10 w-full border-[3px] border-black cursor-pointer shadow-[2px_2px_0_0_#000] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
											type="color"
											bind:value={solidBackground}
										/>
										<input
											type="text"
											class="w-24 border-[3px] border-black p-2 text-sm font-mono shadow-[2px_2px_0_0_#000] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
											bind:value={solidBackground}
										/>
									</div>
								</div>
							{/if}
							{#if backdrop === 'custom-gradient'}
								<div class="grid grid-cols-2 gap-2">
									<div>
										<label
											for="gradientStart"
											class="block text-xs font-black text-black mb-1 uppercase tracking-wider"
											>Start</label
										>
										<input
											id="gradientStart"
											class="h-8 w-full border-[3px] border-black cursor-pointer shadow-[2px_2px_0_0_#000]"
											type="color"
											bind:value={customGradientStart}
										/>
									</div>
									<div>
										<label
											for="gradientEnd"
											class="block text-xs font-black text-black mb-1 uppercase tracking-wider"
											>End</label
										>
										<input
											id="gradientEnd"
											class="h-8 w-full border-[3px] border-black cursor-pointer shadow-[2px_2px_0_0_#000]"
											type="color"
											bind:value={customGradientEnd}
										/>
									</div>
								</div>
							{/if}

							<div>
								<label
									for="padding"
									class="block text-xs font-black text-black mb-1.5 uppercase tracking-wider"
									>Padding ({padding}px)</label
								>
								<input
									id="padding"
									type="range"
									min="16"
									max="128"
									bind:value={padding}
									class="w-full cursor-pointer"
								/>
							</div>
						</div>

						<div class="h-px bg-gray-200" />

						<!-- Window Settings -->
						<div class="space-y-3">
							<div
								class="flex items-center justify-between p-3 bg-[#f8f8f8] border-[2px] border-black"
							>
								<label for="chrome" class="text-xs font-black text-black uppercase tracking-wider"
									>Window Controls</label
								>
								<div class="relative inline-block w-12 align-middle select-none">
									<input
										type="checkbox"
										name="chrome"
										id="chrome"
										bind:checked={showWindowChrome}
										class="toggle-checkbox absolute block w-6 h-6 bg-white border-[3px] border-black appearance-none cursor-pointer transition-all checked:right-0 checked:bg-[#ff6b6b]"
									/>
									<label
										for="chrome"
										class="toggle-label block overflow-hidden h-6 bg-gray-200 cursor-pointer border-[3px] border-black"
									/>
								</div>
							</div>

							<div
								class="flex items-center justify-between p-3 bg-[#f8f8f8] border-[2px] border-black"
							>
								<label
									for="lineNumbers"
									class="text-xs font-black text-black uppercase tracking-wider">Line Numbers</label
								>
								<div class="relative inline-block w-12 align-middle select-none">
									<input
										type="checkbox"
										name="lineNumbers"
										id="lineNumbers"
										bind:checked={showLineNumbers}
										class="toggle-checkbox absolute block w-6 h-6 bg-white border-[3px] border-black appearance-none cursor-pointer transition-all checked:right-0 checked:bg-[#ff6b6b]"
									/>
									<label
										for="lineNumbers"
										class="toggle-label block overflow-hidden h-6 bg-gray-200 cursor-pointer border-[3px] border-black"
									/>
								</div>
							</div>
						</div>

						<div class="h-[3px] bg-black" />

						<!-- Advanced Styling -->
						<div class="space-y-4">
							<h3
								class="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2 pb-2 border-b-[2px] border-black"
							>
								<span
									class="w-5 h-5 bg-[#ffc480] border-[2px] border-black flex items-center justify-center text-xs"
									>⚙</span
								>
								Advanced Styling
							</h3>

							<div>
								<label
									for="fontSize"
									class="block text-xs font-black text-black mb-1.5 uppercase tracking-wider"
									>Font Size ({fontSize}px)</label
								>
								<input
									id="fontSize"
									type="range"
									min="10"
									max="24"
									bind:value={fontSize}
									class="w-full cursor-pointer"
								/>
							</div>

							<div>
								<label
									for="lineHeight"
									class="block text-xs font-black text-black mb-1.5 uppercase tracking-wider"
									>Line Height ({lineHeight})</label
								>
								<input
									id="lineHeight"
									type="range"
									min="1"
									max="2.5"
									step="0.1"
									bind:value={lineHeight}
									class="w-full cursor-pointer"
								/>
							</div>

							<div>
								<label
									for="opacity"
									class="block text-xs font-black text-black mb-1.5 uppercase tracking-wider"
									>Card Opacity ({Math.round(cardOpacity * 100)}%)</label
								>
								<input
									id="opacity"
									type="range"
									min="0"
									max="1"
									step="0.05"
									bind:value={cardOpacity}
									class="w-full cursor-pointer"
								/>
							</div>

							<div>
								<label
									for="shadow"
									class="block text-xs font-black text-black mb-1.5 uppercase tracking-wider"
									>Shadow Intensity</label
								>
								<input
									id="shadow"
									type="range"
									min="0"
									max="1"
									step="0.05"
									bind:value={shadowIntensity}
									class="w-full cursor-pointer"
								/>
							</div>

							<div>
								<label
									for="blur"
									class="block text-xs font-black text-black mb-1.5 uppercase tracking-wider"
									>Blur ({blurEffect}px)</label
								>
								<input
									id="blur"
									type="range"
									min="0"
									max="20"
									bind:value={blurEffect}
									class="w-full cursor-pointer"
								/>
							</div>

							<div>
								<label
									for="radius"
									class="block text-xs font-black text-black mb-1.5 uppercase tracking-wider"
									>Border Radius ({borderRadius}px)</label
								>
								<input
									id="radius"
									type="range"
									min="0"
									max="32"
									bind:value={borderRadius}
									class="w-full cursor-pointer"
								/>
							</div>

							<div>
								<label
									for="tabWidth"
									class="block text-xs font-black text-black mb-1.5 uppercase tracking-wider"
									>Tab Width ({codeTabWidth})</label
								>
								<input
									id="tabWidth"
									type="range"
									min="2"
									max="8"
									step="2"
									bind:value={codeTabWidth}
									class="w-full cursor-pointer"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Right Column: Preview & Editor -->
			<div class="space-y-4 sm:space-y-6 order-1 lg:order-2">
				<!-- Editor Area -->
				<div
					class="bg-white border-[3px] border-black shadow-[6px_6px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] overflow-hidden"
				>
					<!-- Terminal Header -->
					<div
						class="bg-black text-white px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between border-b-[3px] border-black"
					>
						<div class="flex items-center gap-2">
							<div class="flex gap-1.5 sm:gap-2 mr-2 sm:mr-4">
								<div class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ff6b6b] border border-black" />
								<div class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ffc480] border border-black" />
								<div class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#4ade80] border border-black" />
							</div>
							<span class="font-mono text-[10px] sm:text-xs tracking-widest uppercase"
								>~ code_editor</span
							>
						</div>
						<button
							class="px-2 sm:px-3 py-1 bg-[#ff6b6b] hover:bg-[#ff5252] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider border-[2px] border-black shadow-[2px_2px_0_0_#fff] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							on:click={() => {
								code = sampleCode[language] || '';
								isUsingSample = true;
							}}
						>
							Reset
						</button>
					</div>
					<textarea
						id="codeInput"
						class="w-full p-4 sm:p-6 font-mono text-xs sm:text-sm min-h-[150px] sm:min-h-[200px] focus:outline-none resize-y bg-white border-none"
						bind:value={code}
						on:input={() => {
							isUsingSample = false;
						}}
						placeholder="Paste your code here..."
						spellcheck="false"
					/>
				</div>

				<!-- Action Bar -->
				<div
					class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-[#e5e7eb] border-[3px] border-black p-3 sm:p-4"
				>
					<div class="flex items-center gap-2 sm:gap-3">
						{#if previewFrame}
							<div
								class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border-[3px] border-black"
							>
								<span class="text-[10px] font-bold text-black uppercase tracking-wider">SIZE:</span>
								<input
									type="number"
									class="w-12 bg-transparent text-center outline-none font-mono font-bold text-xs border-b-2 border-black focus:border-[#ff6b6b]"
									bind:value={previewWidth}
									min="400"
									max="1600"
									on:input={() => {
										if (previewFrame) {
											previewFrame.style.width = `${previewWidth}px`;
										}
									}}
								/>
								<span class="font-bold text-xs">×</span>
								<input
									type="number"
									class="w-12 bg-transparent text-center outline-none font-mono font-bold text-xs border-b-2 border-black focus:border-[#ff6b6b]"
									bind:value={previewHeight}
									min="300"
									max="1200"
									on:input={() => {
										if (previewFrame) {
											previewFrame.style.height = `${previewHeight}px`;
										}
									}}
								/>
							</div>
						{/if}
					</div>

					<button
						on:click={generateImage}
						disabled={isGenerating}
						class="bg-[#ff6b6b] hover:bg-[#ff5252] text-white px-4 sm:px-8 py-2.5 sm:py-3 border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all font-black uppercase tracking-wide flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto"
					>
						{#if isGenerating}
							<svg
								class="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							<span class="hidden xs:inline">GENERATING...</span>
							<span class="xs:hidden">...</span>
						{:else}
							<svg
								class="w-4 h-4 sm:w-5 sm:h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/></svg
							>
							<span class="hidden sm:inline">GENERATE IMAGE</span>
							<span class="sm:hidden">GENERATE</span>
						{/if}
					</button>
				</div>

				<!-- Preview Area -->
				<div
					class="bg-white border-[3px] border-black overflow-hidden relative min-h-[350px] sm:min-h-[500px] lg:min-h-[600px]"
				>
					<!-- Preview Header -->
					<div
						class="bg-[#e5e7eb] px-3 sm:px-4 py-2 border-b-[3px] border-black flex items-center justify-between"
					>
						<span class="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider"
							>PREVIEW OUTPUT</span
						>
						<div class="flex gap-1">
							<div class="w-2 h-2 bg-black" />
							<div class="w-2 h-2 bg-black" />
							<div class="w-2 h-2 bg-black" />
						</div>
					</div>
					<!-- Checkered Preview Background -->
					<div
						class="min-h-[300px] sm:min-h-[450px] lg:min-h-[550px] flex items-center justify-center overflow-auto"
						style="background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;"
					>
						{#if currentTab === 'preview'}
							<div
								class="w-full h-full overflow-auto p-4 sm:p-8 flex items-center justify-center"
								bind:this={iframeContainer}
							>
								{#key srcdocKey}
									<iframe
										class="bg-transparent transition-all duration-300 ease-out border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] sm:shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] max-w-full"
										title="code-image-preview"
										srcdoc={srcdocContent}
										bind:this={previewFrame}
										style="width: min({previewWidth}px, 100%); height: {previewHeight}px;"
									/>
								{/key}
							</div>
						{:else if generatedImage}
							<div class="flex items-center justify-center w-full h-full p-4 sm:p-8">
								<img
									src={generatedImage.url}
									alt="Generated output"
									class="max-w-full h-auto border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000]"
								/>
							</div>
						{/if}
					</div>

					<!-- Action bar below preview (only when image is generated) -->
					{#if generatedImage}
						<div
							class="bg-[#4ade80] border-t-[3px] border-black px-3 sm:px-5 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3"
						>
							<span class="font-black text-xs sm:text-sm uppercase tracking-widest text-black"
								>✓ Image generated</span
							>
							<div class="flex items-center gap-2 sm:gap-3 flex-wrap">
								<a
									href={generatedImage.url}
									target="_blank"
									class="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border-[2px] border-black font-bold uppercase tracking-wide text-xs shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
									>Open in Tab</a
								>
								<button
									on:click={() => copyToClipboard(generatedImage.url)}
									class="px-3 sm:px-4 py-1.5 sm:py-2 bg-black text-white border-[2px] border-black font-bold uppercase tracking-wide text-xs shadow-[2px_2px_0_0_#666] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
									>Copy URL</button
								>
								<button
									class="px-3 sm:px-4 py-1.5 sm:py-2 border-[2px] border-black font-bold bg-black text-white text-xs shadow-[2px_2px_0_0_#444] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase"
									on:click={() => handleSocialShare('twitter')}
								>
									<span class="inline-flex items-center gap-1.5 justify-center">
										<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
											<path
												d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
											/>
										</svg>
										X
									</span>
								</button>
								<button
									class="px-3 sm:px-4 py-1.5 sm:py-2 border-[2px] border-black font-bold bg-[#0A66C2] text-white text-xs shadow-[2px_2px_0_0_#084c94] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase"
									on:click={() => handleSocialShare('linkedin')}
								>
									<span class="inline-flex items-center gap-1.5 justify-center">
										<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
											<path
												d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.065 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
											/>
										</svg>
										LinkedIn
									</span>
								</button>
							</div>
						</div>
					{/if}
				</div>

				<!-- Next steps — outside preview panel -->
				{#if generatedImage}
					<NextSteps
						heading="Next steps"
						description="Copy the API request, save this output as a template background, and batch render variants."
						curlSnippet={nextStepsCurlSnippet}
						templateDraft={nextStepsTemplateDraft}
						generatedUrl={generatedImage?.url || ''}
						toolName="Code to Image"
					/>
				{/if}
			</div>
		</div>

		<!-- SEO Content Sections -->
		<div class="max-w-5xl mx-auto px-0 mt-12 sm:mt-16 lg:mt-20">
			<!-- Separator -->
			<div class="border-t-[3px] sm:border-t-[4px] border-black relative mb-8 sm:mb-12 lg:mb-16">
				<div class="absolute left-1/2 -top-4 sm:-top-5 -translate-x-1/2 bg-[#FFFDF8] px-4 sm:px-6">
					<div
						class="w-8 h-8 sm:w-10 sm:h-10 bg-[#ffc480] border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
					>
						<span class="font-black text-sm sm:text-lg">?</span>
					</div>
				</div>
			</div>

			<h2
				class="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black mb-8 sm:mb-12 lg:mb-16 text-center text-gray-900 tracking-tighter px-2"
			>
				LEARN MORE ABOUT <br class="md:hidden" />
				<span class="relative inline-block text-white mt-2">
					<span class="relative z-10 px-2 sm:px-4">CODE TO IMAGE</span>
					<span
						class="absolute inset-0 bg-[#ff6b6b] transform -skew-x-2 border-[3px] sm:border-[4px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] -z-0"
					/>
				</span>
			</h2>

			<ApiCodeSection
				title="Automate with the"
				titleHighlight="API"
				toolName="code_to_image"
				description="Generate syntax-highlighted code screenshots programmatically. Render code snippets as images in your docs pipeline, blog CMS, or CI/CD workflows."
				codeExamples={codeToImageExamples}
			/>

			<!-- Code to Image — Comparison -->
			<section class="mb-8 sm:mb-12 bg-[#fffdf8] border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 transition-all duration-300">
				<h3 class="text-xl sm:text-2xl font-black mb-6 text-black tracking-tight">Code Screenshot Tools Compared</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-left border-collapse text-sm">
						<thead>
							<tr class="border-b-[3px] border-black">
								<th class="p-3 font-black uppercase text-xs">Feature</th>
								<th class="p-3 font-black uppercase text-xs">Pictify</th>
								<th class="p-3 font-black uppercase text-xs">Carbon.sh</th>
								<th class="p-3 font-black uppercase text-xs">Ray.so</th>
							</tr>
						</thead>
						<tbody class="font-medium text-gray-700">
							<tr class="border-b border-gray-200">
								<td class="p-3 font-bold">API Access</td>
								<td class="p-3 text-green-600 font-bold">Yes</td>
								<td class="p-3 text-red-500">No</td>
								<td class="p-3 text-red-500">No</td>
							</tr>
							<tr class="border-b border-gray-200">
								<td class="p-3 font-bold">Batch Generation</td>
								<td class="p-3 text-green-600 font-bold">Yes</td>
								<td class="p-3 text-red-500">No</td>
								<td class="p-3 text-red-500">No</td>
							</tr>
							<tr class="border-b border-gray-200">
								<td class="p-3 font-bold">Custom Themes</td>
								<td class="p-3">18+</td>
								<td class="p-3">15+</td>
								<td class="p-3">8</td>
							</tr>
							<tr class="border-b border-gray-200">
								<td class="p-3 font-bold">Languages</td>
								<td class="p-3">25+</td>
								<td class="p-3">150+</td>
								<td class="p-3">20+</td>
							</tr>
							<tr class="border-b border-gray-200">
								<td class="p-3 font-bold">CI/CD Integration</td>
								<td class="p-3 text-green-600 font-bold">Yes</td>
								<td class="p-3 text-red-500">No</td>
								<td class="p-3 text-red-500">No</td>
							</tr>
							<tr>
								<td class="p-3 font-bold">Free Tier</td>
								<td class="p-3 text-green-600 font-bold">Yes</td>
								<td class="p-3 text-green-600">Yes</td>
								<td class="p-3 text-green-600">Yes</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- What is a Code to Image Generator Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#ffc480] border-[3px] border-black text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/></svg
					>
					Overview
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 text-black tracking-tight"
				>
					What is a Code to Image Generator?
				</h3>
				<p class="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4 font-medium">
					A Code to Image Generator is a powerful tool that converts your source code into
					beautiful, syntax-highlighted images. Perfect for sharing code snippets on social media,
					creating documentation, presentations, or blog posts.
				</p>
				<p class="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
					Whether you're a developer sharing code on Twitter, a technical writer creating
					documentation, or an educator preparing tutorials, our code to image generator makes your
					code visually appealing.
				</p>
			</section>

			<!-- Benefits Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#ff6b6b] border-[3px] border-black text-white text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
						/></svg
					>
					Features
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-8 text-black tracking-tight"
				>
					Benefits of Using Our Code to Image Generator
				</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000] flex items-start gap-4 hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="bg-[#ff6b6b] p-2 border-[2px] border-black text-white flex-shrink-0">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
								/></svg
							>
						</div>
						<span class="font-bold text-black text-sm"
							>Support for 25+ programming languages including JavaScript, Python, Java, C++, and
							more</span
						>
					</div>

					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000] flex items-start gap-4 hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="bg-[#ffc480] p-2 border-[2px] border-black text-black flex-shrink-0">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
								/></svg
							>
						</div>
						<span class="font-bold text-black text-sm"
							>18+ beautiful syntax highlighting themes including dark and light options</span
						>
					</div>

					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000] flex items-start gap-4 hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="bg-[#4ade80] p-2 border-[2px] border-black text-black flex-shrink-0">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
								/></svg
							>
						</div>
						<span class="font-bold text-black text-sm"
							>12+ popular coding fonts including JetBrains Mono, Fira Code, and more</span
						>
					</div>

					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000] flex items-start gap-4 hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="bg-[#60a5fa] p-2 border-[2px] border-black text-white flex-shrink-0">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
								/></svg
							>
						</div>
						<span class="font-bold text-black text-sm"
							>Customizable window frames and backgrounds for professional appearance</span
						>
					</div>

					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000] flex items-start gap-4 hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="bg-[#a78bfa] p-2 border-[2px] border-black text-white flex-shrink-0">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
								/></svg
							>
						</div>
						<span class="font-bold text-black text-sm"
							>Advanced styling options including opacity, shadows, and blur effects</span
						>
					</div>

					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000] flex items-start gap-4 hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="bg-[#f472b6] p-2 border-[2px] border-black text-white flex-shrink-0">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/></svg
							>
						</div>
						<span class="font-bold text-black text-sm"
							>Real-time preview to see exactly how your image will look</span
						>
					</div>

					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000] flex items-start gap-4 hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="bg-[#facc15] p-2 border-[2px] border-black text-black flex-shrink-0">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/></svg
							>
						</div>
						<span class="font-bold text-black text-sm"
							>High-quality PNG output perfect for social media and documentation</span
						>
					</div>

					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000] flex items-start gap-4 hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="bg-[#22c55e] p-2 border-[2px] border-black text-white flex-shrink-0">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/></svg
							>
						</div>
						<span class="font-bold text-black text-sm"
							>Free to try (guest limits may apply). Create a free account to remove watermarks.</span
						>
					</div>
				</div>
			</section>

			<!-- How to Use Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#4ade80] border-[3px] border-black text-black text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
						/><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					Guide
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-8 text-black tracking-tight"
				>
					How to Use Our Code to Image Generator
				</h3>
				<div class="space-y-5">
					<div class="flex items-start gap-4">
						<span
							class="bg-[#ff6b6b] text-white w-10 h-10 flex items-center justify-center font-black flex-shrink-0 border-[3px] border-black shadow-[3px_3px_0_0_#000]"
							>1</span
						>
						<div>
							<h4 class="font-black text-lg text-black mb-1">Choose Your Programming Language</h4>
							<p class="text-gray-600 text-sm">
								Select from 25+ supported programming languages including JavaScript, Python, Java,
								C++, TypeScript, and more.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-4">
						<span
							class="bg-[#ff6b6b] text-white w-10 h-10 flex items-center justify-center font-black flex-shrink-0 border-[3px] border-black shadow-[3px_3px_0_0_#000]"
							>2</span
						>
						<div>
							<h4 class="font-black text-lg text-black mb-1">Paste or Type Your Code</h4>
							<p class="text-gray-600 text-sm">
								Enter your code in the text area. You can use our sample code for each language or
								paste your own code snippet.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-4">
						<span
							class="bg-[#ff6b6b] text-white w-10 h-10 flex items-center justify-center font-black flex-shrink-0 border-[3px] border-black shadow-[3px_3px_0_0_#000]"
							>3</span
						>
						<div>
							<h4 class="font-black text-lg text-black mb-1">Customize the Appearance</h4>
							<p class="text-gray-600 text-sm">
								Choose from 18+ themes, 12+ fonts, and customize padding, border radius, background
								styles, and advanced effects.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-4">
						<span
							class="bg-[#ff6b6b] text-white w-10 h-10 flex items-center justify-center font-black flex-shrink-0 border-[3px] border-black shadow-[3px_3px_0_0_#000]"
							>4</span
						>
						<div>
							<h4 class="font-black text-lg text-black mb-1">Preview Your Image</h4>
							<p class="text-gray-600 text-sm">
								See exactly how your code image will look with our real-time preview. Adjust
								dimensions and settings as needed.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-4">
						<span
							class="bg-[#ff6b6b] text-white w-10 h-10 flex items-center justify-center font-black flex-shrink-0 border-[3px] border-black shadow-[3px_3px_0_0_#000]"
							>5</span
						>
						<div>
							<h4 class="font-black text-lg text-black mb-1">Generate and Download</h4>
							<p class="text-gray-600 text-sm">
								Click "Generate Image" to create your high-quality PNG image. Copy the URL or
								download directly to use in your projects.
							</p>
						</div>
					</div>
				</div>
			</section>

			<!-- Real-World Use Cases Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#ffc480] border-[3px] border-black text-black text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
						/></svg
					>
					Applications
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-8 text-black tracking-tight"
				>
					Real-World Use Cases
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-5 shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<h4 class="text-lg font-black mb-2 text-black flex items-center gap-3">
							<span
								class="w-8 h-8 bg-[#ff6b6b] border-[2px] border-black flex items-center justify-center flex-shrink-0"
							>
								<svg
									class="w-4 h-4 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
									/></svg
								>
							</span>
							Social Media Sharing
						</h4>
						<p class="text-gray-600 text-sm">
							Share beautiful code snippets on Twitter, LinkedIn, Instagram. Stand out with
							professional-looking code images.
						</p>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-5 shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<h4 class="text-lg font-black mb-2 text-black flex items-center gap-3">
							<span
								class="w-8 h-8 bg-[#ffc480] border-[2px] border-black flex items-center justify-center flex-shrink-0"
							>
								<svg
									class="w-4 h-4 text-black"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
									/></svg
								>
							</span>
							Documentation & Tutorials
						</h4>
						<p class="text-gray-600 text-sm">
							Create stunning code examples for technical documentation, API guides, and programming
							tutorials.
						</p>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-5 shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<h4 class="text-lg font-black mb-2 text-black flex items-center gap-3">
							<span
								class="w-8 h-8 bg-[#4ade80] border-[2px] border-black flex items-center justify-center flex-shrink-0"
							>
								<svg
									class="w-4 h-4 text-black"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
									/></svg
								>
							</span>
							Presentations & Slides
						</h4>
						<p class="text-gray-600 text-sm">
							Include beautiful code images in your technical presentations, conference talks, and
							educational slides.
						</p>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-5 shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<h4 class="text-lg font-black mb-2 text-black flex items-center gap-3">
							<span
								class="w-8 h-8 bg-[#60a5fa] border-[2px] border-black flex items-center justify-center flex-shrink-0"
							>
								<svg
									class="w-4 h-4 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/></svg
								>
							</span>
							Blog Posts & Articles
						</h4>
						<p class="text-gray-600 text-sm">
							Enhance your technical blog posts and articles with syntax-highlighted code images.
						</p>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-5 shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<h4 class="text-lg font-black mb-2 text-black flex items-center gap-3">
							<span
								class="w-8 h-8 bg-[#a78bfa] border-[2px] border-black flex items-center justify-center flex-shrink-0"
							>
								<svg
									class="w-4 h-4 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
									/></svg
								>
							</span>
							Education & Teaching
						</h4>
						<p class="text-gray-600 text-sm">
							Create clear, readable code examples for programming courses, workshops, and
							educational materials.
						</p>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-5 shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<h4 class="text-lg font-black mb-2 text-black flex items-center gap-3">
							<span
								class="w-8 h-8 bg-black border-[2px] border-black flex items-center justify-center flex-shrink-0"
							>
								<svg
									class="w-4 h-4 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/></svg
								>
							</span>
							Portfolio & Resume
						</h4>
						<p class="text-gray-600 text-sm">
							Showcase your coding skills in portfolios and resumes with beautiful code screenshots.
						</p>
					</div>
				</div>
			</section>

			<!-- Best Practices Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#ff6b6b] border-[3px] border-black text-white text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
						/></svg
					>
					Tips
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-8 text-black tracking-tight"
				>
					Best Practices for Creating Code Images
				</h3>
				<p class="text-base text-gray-600 leading-relaxed mb-6">
					To create the most effective and professional-looking code images, follow these best
					practices:
				</p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="space-y-4">
						<h4 class="font-black text-lg text-black flex items-center gap-2">
							<span
								class="w-8 h-8 bg-[#ff6b6b] text-white border-[2px] border-black flex items-center justify-center text-sm shadow-[2px_2px_0_0_#000]"
								>&lt;/&gt;</span
							>
							Code Quality
						</h4>
						<div class="space-y-2">
							<div
								class="bg-[#f8f8f8] border-[3px] border-black p-3 shadow-[3px_3px_0_0_#000] flex items-start gap-3 hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								<svg
									class="w-5 h-5 text-[#ff6b6b] flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<span class="font-bold text-black text-sm"
									>Keep code snippets concise and focused</span
								>
							</div>
							<div
								class="bg-[#f8f8f8] border-[3px] border-black p-3 shadow-[3px_3px_0_0_#000] flex items-start gap-3 hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								<svg
									class="w-5 h-5 text-[#ff6b6b] flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<span class="font-bold text-black text-sm"
									>Use proper indentation and formatting</span
								>
							</div>
							<div
								class="bg-[#f8f8f8] border-[3px] border-black p-3 shadow-[3px_3px_0_0_#000] flex items-start gap-3 hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								<svg
									class="w-5 h-5 text-[#ff6b6b] flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<span class="font-bold text-black text-sm"
									>Include meaningful comments when necessary</span
								>
							</div>
							<div
								class="bg-[#f8f8f8] border-[3px] border-black p-3 shadow-[3px_3px_0_0_#000] flex items-start gap-3 hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								<svg
									class="w-5 h-5 text-[#ff6b6b] flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<span class="font-bold text-black text-sm"
									>Remove sensitive information like API keys</span
								>
							</div>
						</div>
					</div>

					<div class="space-y-4">
						<h4 class="font-black text-lg text-black flex items-center gap-2">
							<span
								class="w-8 h-8 bg-[#4ade80] text-black border-[2px] border-black flex items-center justify-center text-sm shadow-[2px_2px_0_0_#000]"
								>🎨</span
							>
							Visual Design
						</h4>
						<div class="space-y-2">
							<div
								class="bg-[#f8f8f8] border-[3px] border-black p-3 shadow-[3px_3px_0_0_#000] flex items-start gap-3 hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								<svg
									class="w-5 h-5 text-[#4ade80] flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<span class="font-bold text-black text-sm">Choose themes that match your brand</span
								>
							</div>
							<div
								class="bg-[#f8f8f8] border-[3px] border-black p-3 shadow-[3px_3px_0_0_#000] flex items-start gap-3 hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								<svg
									class="w-5 h-5 text-[#4ade80] flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<span class="font-bold text-black text-sm"
									>Use high-contrast themes for readability</span
								>
							</div>
							<div
								class="bg-[#f8f8f8] border-[3px] border-black p-3 shadow-[3px_3px_0_0_#000] flex items-start gap-3 hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								<svg
									class="w-5 h-5 text-[#4ade80] flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<span class="font-bold text-black text-sm"
									>Select clear, professional-looking fonts</span
								>
							</div>
							<div
								class="bg-[#f8f8f8] border-[3px] border-black p-3 shadow-[3px_3px_0_0_#000] flex items-start gap-3 hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								<svg
									class="w-5 h-5 text-[#4ade80] flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<span class="font-bold text-black text-sm">Use appropriate padding and spacing</span
								>
							</div>
						</div>
					</div>
				</div>
				<div class="mt-8 p-5 bg-[#ffc480] border-[3px] border-black shadow-[4px_4px_0_0_#000]">
					<h4 class="font-black text-lg text-black mb-4 flex items-center gap-2">
						<span
							class="w-7 h-7 bg-black text-white border-[2px] border-black flex items-center justify-center text-sm"
							>💡</span
						>
						Pro Tips
					</h4>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div class="flex items-start gap-2 p-2">
							<span class="font-black text-black">→</span>
							<span class="font-bold text-black text-sm"
								>Use line numbers for longer code snippets</span
							>
						</div>
						<div class="flex items-start gap-2 p-2">
							<span class="font-black text-black">→</span>
							<span class="font-bold text-black text-sm">Test different background styles</span>
						</div>
						<div class="flex items-start gap-2 p-2">
							<span class="font-black text-black">→</span>
							<span class="font-bold text-black text-sm"
								>Consider platform-specific image sizes</span
							>
						</div>
						<div class="flex items-start gap-2 p-2">
							<span class="font-black text-black">→</span>
							<span class="font-bold text-black text-sm"
								>Save favorite settings for consistency</span
							>
						</div>
					</div>
				</div>
			</section>

			<!-- FAQ Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#4ade80] border-[3px] border-black text-black text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					FAQ
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-8 text-black tracking-tight"
				>
					Frequently Asked Questions
				</h3>
				<div class="space-y-3">
					<details
						class="group bg-[#f8f8f8] border-[3px] border-black overflow-hidden shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<summary
							class="flex items-center justify-between cursor-pointer p-4 font-bold text-black select-none"
						>
							<span class="text-sm">What programming languages are supported?</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-black group-open:rotate-180 transition-transform duration-300"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
						</summary>
						<div class="p-4 pt-0 text-gray-600 border-t-[3px] border-black bg-white text-sm">
							We support 25+ programming languages including JavaScript, TypeScript, Python, Java,
							C++, C#, PHP, Ruby, Go, Rust, Swift, HTML, CSS, SQL, JSON, YAML, Markdown, and many
							more.
						</div>
					</details>

					<details
						class="group bg-[#f8f8f8] border-[3px] border-black overflow-hidden shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<summary
							class="flex items-center justify-between cursor-pointer p-4 font-bold text-black select-none"
						>
							<span class="text-sm">Can I customize the appearance?</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-black group-open:rotate-180 transition-transform duration-300"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
						</summary>
						<div class="p-4 pt-0 text-gray-600 border-t-[3px] border-black bg-white text-sm">
							Yes! Choose from 18+ themes, 12+ coding fonts, customize padding, border radius,
							background styles, window frames, and advanced effects like shadows and blur.
						</div>
					</details>

					<details
						class="group bg-[#f8f8f8] border-[3px] border-black overflow-hidden shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<summary
							class="flex items-center justify-between cursor-pointer p-4 font-bold text-black select-none"
						>
							<span class="text-sm">What image formats are supported?</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-black group-open:rotate-180 transition-transform duration-300"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
						</summary>
						<div class="p-4 pt-0 text-gray-600 border-t-[3px] border-black bg-white text-sm">
							We generate high-quality PNG images, perfect for social media, documentation, and
							presentations with crisp text rendering and transparency support.
						</div>
					</details>

					<details
						class="group bg-[#f8f8f8] border-[3px] border-black overflow-hidden shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<summary
							class="flex items-center justify-between cursor-pointer p-4 font-bold text-black select-none"
						>
							<span class="text-sm">Is there a limit on code length?</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-black group-open:rotate-180 transition-transform duration-300"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
						</summary>
						<div class="p-4 pt-0 text-gray-600 border-t-[3px] border-black bg-white text-sm">
							No strict limit, but we recommend keeping snippets reasonably sized for best visual
							results. Focus on the most important parts of your code.
						</div>
					</details>

					<details
						class="group bg-[#f8f8f8] border-[3px] border-black overflow-hidden shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<summary
							class="flex items-center justify-between cursor-pointer p-4 font-bold text-black select-none"
						>
							<span class="text-sm">Can I use images commercially?</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-black group-open:rotate-180 transition-transform duration-300"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
						</summary>
						<div class="p-4 pt-0 text-gray-600 border-t-[3px] border-black bg-white text-sm">
							Yes! All generated images can be used for personal and commercial purposes. Guest
							limits may apply, and free accounts remove watermarks.
						</div>
					</details>
				</div>
			</section>

			<!-- Supported Languages Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#ffc480] border-[3px] border-black text-black text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
						/></svg
					>
					Languages
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 text-black tracking-tight"
				>
					Supported Programming Languages
				</h3>
				<p class="text-sm sm:text-base text-gray-600 leading-relaxed mb-4 sm:mb-6">
					Our code to image generator supports syntax highlighting for all major programming
					languages:
				</p>
				<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">⚡</div>
						<span class="font-bold text-black text-xs">JavaScript</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">🔷</div>
						<span class="font-bold text-black text-xs">TypeScript</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">🐍</div>
						<span class="font-bold text-black text-xs">Python</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">☕</div>
						<span class="font-bold text-black text-xs">Java</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">⚙️</div>
						<span class="font-bold text-black text-xs">C++</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">🔷</div>
						<span class="font-bold text-black text-xs">C#</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">🐘</div>
						<span class="font-bold text-black text-xs">PHP</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">💎</div>
						<span class="font-bold text-black text-xs">Ruby</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">🐹</div>
						<span class="font-bold text-black text-xs">Go</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">🦀</div>
						<span class="font-bold text-black text-xs">Rust</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">🍎</div>
						<span class="font-bold text-black text-xs">Swift</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">🌐</div>
						<span class="font-bold text-black text-xs">HTML</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">🎨</div>
						<span class="font-bold text-black text-xs">CSS</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">🗃️</div>
						<span class="font-bold text-black text-xs">SQL</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">📄</div>
						<span class="font-bold text-black text-xs">JSON</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">📝</div>
						<span class="font-bold text-black text-xs">YAML</span>
					</div>
					<div
						class="bg-[#f8f8f8] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">📋</div>
						<span class="font-bold text-black text-xs">Markdown</span>
					</div>
					<div
						class="bg-[#ff6b6b] border-[3px] border-black p-3 text-center shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						<div class="text-xl mb-1">+</div>
						<span class="font-bold text-white text-xs">More!</span>
					</div>
				</div>
			</section>

		</div>

		<!-- First Generation Prompt -->
		{#if showFirstGenerationPrompt}
			<div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
				<div
					class="bg-white border-[4px] border-black max-w-md w-full mx-auto shadow-[12px_12px_0_0_#000]"
				>
					<!-- Modal Header -->
					<div
						class="bg-[#4ade80] px-6 py-3 border-b-[4px] border-black flex justify-between items-center"
					>
						<h3 class="text-lg font-black text-black uppercase tracking-wider">
							🎉 Great First Image!
						</h3>
						<button
							class="w-8 h-8 bg-white border-[3px] border-black flex items-center justify-center hover:bg-[#ff6b6b] hover:text-white transition-colors"
							on:click={() => (showFirstGenerationPrompt = false)}
						>
							<span class="font-black">×</span>
						</button>
					</div>

					<div class="p-6">
						<p class="text-black font-bold mb-4">Create a free account to unlock:</p>

						<ul class="space-y-2 mb-6">
							<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
								<span class="font-black text-[#4ade80]">✓</span>
								<span class="font-bold text-black text-sm">Unlimited image generations</span>
							</li>
							<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
								<span class="font-black text-[#4ade80]">✓</span>
								<span class="font-bold text-black text-sm">No watermarks</span>
							</li>
							<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
								<span class="font-black text-[#4ade80]">✓</span>
								<span class="font-bold text-black text-sm">API Access</span>
							</li>
						</ul>

						<div class="space-y-3">
							<a
								href="/signup?redirect=/tools/code-to-image"
								on:click={() => analytics.track('tool_signup_click', { tool_name: 'code_to_image', cta_location: 'free_tier_card' })}
								class="block w-full py-3 px-6 border-[3px] border-black font-black bg-[#ff6b6b] uppercase tracking-wide text-center text-white shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								Create Free Account
							</a>

							<button
								class="w-full py-3 px-6 font-bold text-black hover:text-[#ff6b6b] transition-colors uppercase tracking-wide"
								on:click={() => (showFirstGenerationPrompt = false)}
							>
								Continue as Guest
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Upgrade Prompt -->
		{#if showUpgradePrompt}
			<div
				class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
				style="margin-top: 0px;"
			>
				<div
					class="bg-white border-[4px] border-black max-w-md w-full mx-auto shadow-[12px_12px_0_0_#000]"
				>
					<!-- Modal Header -->
					<div
						class="bg-[#ff6b6b] px-6 py-3 border-b-[4px] border-black flex justify-between items-center"
					>
						<h3 class="text-lg font-black text-white uppercase tracking-wider">
							🎨 Ready to Create More?
						</h3>
						<button
							class="w-8 h-8 bg-white border-[3px] border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
							on:click={() => (showUpgradePrompt = false)}
						>
							<span class="font-black">×</span>
						</button>
					</div>

					<div class="p-6">
						<p class="text-black font-bold mb-4">
							You've reached the guest limit. Sign up to unlock:
						</p>

						<ul class="space-y-2 mb-6">
							<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
								<span class="font-black text-[#ff6b6b]">✓</span>
								<span class="font-bold text-black text-sm">Unlimited image generations</span>
							</li>
							<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
								<span class="font-black text-[#ff6b6b]">✓</span>
								<span class="font-bold text-black text-sm">No watermarks</span>
							</li>
							<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
								<span class="font-black text-[#ff6b6b]">✓</span>
								<span class="font-bold text-black text-sm">API Access</span>
							</li>
							<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
								<span class="font-black text-[#ff6b6b]">✓</span>
								<span class="font-bold text-black text-sm">Priority support</span>
							</li>
						</ul>

						<div class="space-y-3">
							<a
								href="/signup?redirect=/tools/code-to-image"
								on:click={() => analytics.track('tool_signup_click', { tool_name: 'code_to_image', cta_location: 'limit_reached_modal' })}
								class="block w-full py-3 px-6 border-[3px] border-black font-black bg-[#ff6b6b] uppercase tracking-wide text-center text-white shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								Sign Up Free
							</a>

							<button
								class="w-full py-3 px-6 font-bold text-black hover:text-[#ff6b6b] transition-colors uppercase tracking-wide"
								on:click={() => (showUpgradePrompt = false)}
							>
								Maybe Later
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<RelatedTools tools={['json-to-image', 'markdown', 'api-response-card', 'changelog-card']} />

		<!-- Related Tools -->
		<section class="mb-12 max-w-5xl mx-auto px-4">
			<h3 class="text-xl font-black mb-4 text-black uppercase text-center">Related Tools</h3>
			<div class="flex flex-wrap gap-3 justify-center">
				<a href="/tools/html-to-png" class="px-4 py-2 border-[3px] border-black bg-white font-bold text-sm hover:bg-[#ffc480] hover:shadow-[4px_4px_0_0_#000] transition-all">HTML to PNG</a>
				<a href="/tools/url-to-image-generator" class="px-4 py-2 border-[3px] border-black bg-white font-bold text-sm hover:bg-[#ffc480] hover:shadow-[4px_4px_0_0_#000] transition-all">URL to Image</a>
				<a href="/tools/og-image-generator" class="px-4 py-2 border-[3px] border-black bg-white font-bold text-sm hover:bg-[#ffc480] hover:shadow-[4px_4px_0_0_#000] transition-all">OG Image Generator</a>
				<a href="/tools/markdown" class="px-4 py-2 border-[3px] border-black bg-white font-bold text-sm hover:bg-[#ffc480] hover:shadow-[4px_4px_0_0_#000] transition-all">Markdown to Image</a>
				<a href="/compare" class="px-4 py-2 border-[3px] border-black bg-white font-bold text-sm hover:bg-[#ffc480] hover:shadow-[4px_4px_0_0_#000] transition-all">Compare Tools</a>
			</div>
		</section>

		<Footer />
	</main>
	<Toast />
	<StickySignupBar bind:this={stickyBar} toolName="code_to_image" />

</section>

<style>
	/* Custom Scrollbar */
	.custom-scrollbar::-webkit-scrollbar {
		width: 12px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-left: 3px solid #111827;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #ffc480;
		border: 3px solid #111827;
		border-radius: 0;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #ffb05c;
	}

	/* Neo-Brutalist Range Input */
	input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		background: transparent;
	}

	input[type='range']:focus {
		outline: none;
	}

	/* Webkit (Chrome, Safari, Edge) */
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #ff6b6b;
		border: 3px solid #111827;
		cursor: pointer;
		margin-top: -8px;
		box-shadow: 2px 2px 0 0 #1f2937;
		transition: all 0.1s ease;
	}

	input[type='range']::-webkit-slider-thumb:hover {
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 0 #1f2937;
	}

	input[type='range']::-webkit-slider-thumb:active {
		transform: translate(1px, 1px);
		box-shadow: 0 0 0 0 #1f2937;
	}

	input[type='range']::-webkit-slider-runnable-track {
		width: 100%;
		height: 4px;
		cursor: pointer;
		background: #111827;
		border-radius: 2px;
	}

	/* Firefox */
	input[type='range']::-moz-range-thumb {
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #ff6b6b;
		border: 3px solid #111827;
		cursor: pointer;
		box-shadow: 2px 2px 0 0 #1f2937;
	}

	input[type='range']::-moz-range-track {
		width: 100%;
		height: 4px;
		cursor: pointer;
		background: #111827;
		border-radius: 2px;
	}
</style>
