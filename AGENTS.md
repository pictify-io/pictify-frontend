# AGENTS.md - Coding Agent Guidelines

## Project Overview

This is the frontend for **Pictify.io**, a dynamic media infrastructure platform that converts HTML templates to images, GIFs, and PDFs at scale.

- **Framework:** SvelteKit 2.x with Svelte 4.x
- **Language:** JavaScript (no TypeScript)
- **Styling:** Tailwind CSS
- **Deployment:** Cloudflare Pages
- **State Management:** Svelte stores + XState for complex state (editor)
- **Canvas:** Fabric.js v6 for template editing

## Build & Development Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build locally
npm run lint         # Check formatting (Prettier) and linting (ESLint)
npm run format       # Auto-format all files with Prettier
npm run deploy       # Build and deploy to Cloudflare Pages
```

**Note:** No test framework is currently configured. There are no test commands.

## Code Style Guidelines

### Formatting (Prettier)

- **Indentation:** Tabs (not spaces)
- **Quotes:** Single quotes (`'`)
- **Trailing commas:** None
- **Line width:** 100 characters
- **Semicolons:** Yes (default)

### ESLint

- Extends: `eslint:recommended`, `plugin:svelte/recommended`, `prettier`
- Environment: Browser, ES2017, Node

### Imports

```javascript
// SvelteKit aliases (preferred)
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import Component from '$lib/components/Component.svelte';

// Relative imports for local modules
import { loginAction } from '../../../store/user.store';
import backend from '../service/backend';
```

- Use `$lib` alias for anything in `src/lib/`
- Use `$env/static/public` for public environment variables
- Use relative paths for imports outside `$lib`

## Design Language

### Color Palette

| Purpose        | Color                  | Tailwind Class    |
| -------------- | ---------------------- | ----------------- |
| Background     | `#FFFDF8` (warm cream) | `bg-[#FFFDF8]`    |
| Primary CTA    | `#ff6b6b` (coral red)  | `bg-[#ff6b6b]`    |
| Secondary      | `#ffc480` (gold)       | `bg-[#ffc480]`    |
| Success        | `#4ade80` (green)      | `bg-[#4ade80]`    |
| Text Primary   | gray-900               | `text-gray-900`   |
| Text Secondary | gray-700, gray-500     | `text-gray-700`   |
| Borders        | gray-900               | `border-gray-900` |

### Neobrutalist UI Style

This project uses a **neobrutalist** design system with these key characteristics:

```html
<!-- Thick borders -->
<div class="border-[3px] border-gray-900">
	<!-- Hard drop shadows (offset, no blur) -->
	<div class="shadow-[6px_6px_0_0_#1f2937]">
		<!-- Interactive hover: translate + reduce shadow -->
		<button
			class="shadow-[6px_6px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] 
               hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
		>
			<!-- Rounded corners -->
			<div class="rounded-xl">
				<!-- Large elements -->
				<div class="rounded-lg"><!-- Smaller elements --></div>
			</div>
		</button>
	</div>
</div>
```

### Typography

- **Font families:** Inter (body), DynaPuff (headings) - defined in `tailwind.config.js`
- **Weights:** Bold (`font-bold`) and black (`font-black`) are prevalent
- **Labels/badges:** Uppercase with letter-spacing (`uppercase tracking-wider`)

### Button Patterns

```html
<!-- Primary button (coral) -->
<button
	class="bg-[#ff6b6b] text-white font-black py-4 px-8 rounded-xl 
               border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] 
               hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[3px] 
               hover:translate-y-[3px] transition-all uppercase tracking-wider"
>
	<!-- Secondary button (white) -->
	<button
		class="bg-white text-gray-900 font-bold py-4 px-8 rounded-xl 
               border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] 
               hover:shadow-[2px_2px_0_0_#1f2937] transition-all"
	>
		<!-- Active/selected state (gold background) -->
		<a
			class="bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 
          shadow-[3px_3px_0_0_#1f2937]"
		></a>
	</button>
</button>
```

## Architecture & Patterns

### Directory Structure

```
src/
├── api/            # API client functions (one file per resource)
├── service/        # Backend HTTP client wrapper
├── store/          # Svelte stores (*.store.js)
├── routes/         # SvelteKit file-based routing
├── lib/
│   ├── components/ # Reusable Svelte components
│   ├── utils/      # Utility functions
│   └── assets/     # Static assets (images, icons)
└── util/           # Simple utility functions
```

### Store Pattern

```javascript
// user.store.js - Example pattern
import { writable, get } from 'svelte/store';

// Create store
export const user = writable(defaultState);

// Export action functions (not methods on store)
export const loginAction = async (email, password) => {
	const response = await login({ email, password });
	user.set(normalizePayload(response));
	return response;
};

export const clearUser = () => user.set(defaultState);
```

### API Layer Pattern

```javascript
// api/template.js - Example pattern
import backend from '../service/backend';

const getTemplates = async (params = {}) => {
	try {
		const response = await backend.get('/templates', { params });
		return response;
	} catch (error) {
		return null; // Return null on error, or throw for critical errors
	}
};

export { getTemplates };
```

### Component Pattern

```svelte
<script>
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	// Props
	export let items = [];
	export let selected = null;

	// Events
	const dispatch = createEventDispatcher();

	// Local state
	let isOpen = false;

	// Lifecycle
	onMount(() => {
		/* ... */
	});
	onDestroy(() => {
		/* cleanup subscriptions */
	});

	// Handlers
	const handleClick = (item) => dispatch('select', item);
</script>
```

## Naming Conventions

| Type             | Convention     | Example                             |
| ---------------- | -------------- | ----------------------------------- |
| Files (JS)       | kebab-case     | `brand-fonts-loader.js`             |
| Files (Svelte)   | PascalCase     | `TemplateCard.svelte`               |
| Stores           | `*.store.js`   | `user.store.js`                     |
| Functions        | camelCase      | `getTemplates`, `handleClick`       |
| Action functions | verbNounAction | `loginAction`, `getTemplatesAction` |
| Components       | PascalCase     | `<TemplateList />`                  |
| CSS classes      | Tailwind       | Use Tailwind utilities              |

## Error Handling

### API Functions

```javascript
// Pattern 1: Return null (for non-critical fetches)
const getTemplates = async () => {
	try {
		return await backend.get('/templates');
	} catch (error) {
		return null;
	}
};

// Pattern 2: Throw user-friendly error (for critical actions)
const login = async ({ email, password }) => {
	try {
		return await backend.post('/auth/login', { email, password });
	} catch (error) {
		if (error.status === 401) throw new Error('Invalid email or password');
		throw new Error('Error logging in');
	}
};
```

### Backend Service

The `backend` service (`src/service/backend.js`) throws `HttpError` with status codes. Handle appropriately in API layer.

### User Feedback

Use toast store for user notifications:

```javascript
import { toast } from '../store/toast.store';
toast.set({ message: 'Template saved!', duration: 3000 });
```
