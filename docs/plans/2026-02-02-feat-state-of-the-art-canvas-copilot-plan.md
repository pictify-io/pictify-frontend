---
title: "feat: State-of-the-Art Canvas Copilot"
type: feat
date: 2026-02-02
deepened: 2026-02-02
---

# State-of-the-Art Canvas Copilot

## Enhancement Summary

**Deepened on:** 2026-02-02
**Sections enhanced:** 8
**Research agents used:** kieran-typescript-reviewer, performance-oracle, security-sentinel, architecture-strategist, code-simplicity-reviewer, julik-frontend-races-reviewer, pattern-recognition-specialist, agent-native-reviewer, frontend-design skill, agent-native-architecture skill

### Key Improvements

1. **Simplified Architecture**: Reduced from 4 phases to 2 (MVP + Polish) with focus on 4 core tools instead of 12+
2. **Critical Race Condition Fixes**: Identified SSE cancellation gaps and undo-during-streaming hazards requiring AbortController cleanup and streaming state guards
3. **Agent-Native Parity**: Added missing tools (undo, redo, label_element, get_suggestions) to achieve 100% agent-accessible capabilities
4. **Unified History Architecture**: Replace fragmented undo systems and `window.__historyBatchStart/End` globals with proper Svelte store patterns

### Critical Issues Discovered

| Issue | Severity | Location | Recommendation |
|-------|----------|----------|----------------|
| Fragmented undo systems | 🔴 CRITICAL | CopilotPanel.svelte:27-29 + Canvas.svelte | Unify into single history store |
| Window globals anti-pattern | 🔴 CRITICAL | `window.__historyBatchStart/End` | Replace with store subscription |
| SSE cancellation leak | 🟡 HIGH | copilot-simple.js SSE reader | Add AbortController cleanup on unmount |
| No streaming state guard | 🟡 HIGH | CopilotPanel.svelte undo handler | Disable undo button during streaming |
| Missing agent-native tools | 🟡 HIGH | 9/17 tools present (53%) | Add undo, redo, labels, suggestions tools |

### New Considerations Discovered

- **Token Budget**: 8K context window requires aggressive summarization strategy
- **Element Indexing**: Need spatial index for O(log n) lookups on 50+ element canvases
- **Zod Validation**: Add runtime type validation for tool inputs to prevent injection
- **Confirmation UX**: Destructive actions need explicit user confirmation (not just AI deciding)

---

## Overview

Transform the current simple prompt-to-design copilot (`copilot-simple.js`) into a sophisticated AI design partner that understands design principles, maintains conversation context, performs targeted edits, provides explanations, and proactively suggests improvements.

## Problem Statement / Motivation

**Current Limitations:**
- **Single-turn only**: Each prompt starts fresh with no memory of previous interactions
- **Full canvas regeneration**: Cannot make surgical edits to specific elements
- **Limited prompt understanding**: Output is similar to hardcoded examples
- **No design intelligence**: Cannot analyze, critique, or explain design decisions
- **Separate undo systems**: Copilot undo disconnected from canvas history

**User Pain Points:**
- "Make the button blue" regenerates the entire design instead of changing one element
- Cannot iterate through conversation ("now make it bigger", "add more contrast")
- No explanation of why AI made certain design choices
- Losing context means re-explaining requirements each time

## Proposed Solution

A tool-based agentic copilot architecture with:

1. **Multi-turn conversation** with persistent context
2. **Tool use** for precise canvas manipulation
3. **Design intelligence** for analysis and suggestions
4. **Progressive refinement** over full regeneration
5. **Unified undo/redo** with canvas history

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COPILOT ORCHESTRATOR                          │
│         (Context Management, Tool Routing, Response Synthesis)     │
├─────────────────────────────────────────────────────────────────────┤
│                         TOOL LAYER                                  │
├────────────────┬────────────────┬────────────────┬──────────────────┤
│  Canvas Tools  │  Analysis Tools │  Design Tools  │  Utility Tools  │
│  - select      │  - analyze      │  - apply_style │  - explain      │
│  - modify      │  - critique     │  - apply_layout│  - suggest      │
│  - create      │  - check_a11y   │  - apply_color │  - undo         │
│  - delete      │  - check_hierarchy│              │                 │
├────────────────┴────────────────┴────────────────┴──────────────────┤
│                      CONTEXT LAYERS                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Short-Term Memory  │ Current session messages (last 10 turns)      │
│  Canvas Context     │ Current canvas state + selected elements      │
│  Brand Context      │ User's brand assets (colors, fonts, logos)    │
│  Design System      │ Spacing tokens, typography scale, constraints │
└─────────────────────────────────────────────────────────────────────┘
```

### Research Insights: Architecture

**From architecture-strategist:**
- Keep orchestrator stateless - all state in Svelte stores
- Tool layer should follow Command pattern for undo/redo integration
- Use dependency injection for canvas reference (not window globals)

**From code-simplicity-reviewer (CRITICAL):**
- **Reduce to 4 core tools**: `modify_element`, `create_element`, `delete_elements`, `get_canvas_state`
- `select_elements` is UI concern, not tool - AI describes, frontend resolves
- `regenerate_canvas` is just `delete_elements` + multiple `create_element` calls
- Analysis tools (`analyze_design`, `check_accessibility`) can be derived from canvas state client-side

**From agent-native-architecture skill:**
- Every UI action must have tool equivalent (agent-native parity)
- Tools should return structured data, not just success/failure
- Include `tool_call_id` for tracing and debugging

**Simplified Tool Set (4 primitives):**
```javascript
// Core tools - everything else composes from these
const CORE_TOOLS = [
  'modify_element',   // Change properties of existing element(s)
  'create_element',   // Add new element to canvas
  'delete_elements',  // Remove element(s) from canvas
  'get_canvas_state'  // Read current canvas for context
];

// Agent-native parity tools (agent can do anything user can do)
const PARITY_TOOLS = [
  'undo',             // Undo last action
  'redo',             // Redo undone action
  'label_element',    // Assign semantic label to element
  'get_suggestions'   // Get proactive design suggestions
];
```

### Implementation Phases

#### Phase 1: Foundation - Context & Tools

**Objective**: Enable multi-turn conversations with basic tool use

**Deliverables:**
- [ ] Conversation history persistence in copilot store
- [ ] Tool schema definitions for canvas operations
- [ ] Backend API updates to support tool-based generation
- [ ] Streaming protocol for tool execution feedback
- [ ] Element identification system (labels/names)

**Key Changes:**

**1.1 Copilot Store Enhancement** (`src/store/copilot.store.js`)
```javascript
// Add conversation history with context
export const copilotConversation = writable({
  messages: [],           // Full conversation history
  contextWindow: 10,      // Max turns to send to API
  canvasSnapshots: [],    // Canvas state at each turn
  elementLabels: new Map(), // User-defined element names
});

// Add tool execution state
export const copilotTools = writable({
  availableTools: [],     // Tool definitions
  pendingTools: [],       // Tools awaiting execution
  executedTools: [],      // Completed tool calls
});
```

**1.2 Tool Definitions** (new file: `src/lib/copilot/tools.js`)
```javascript
export const COPILOT_TOOLS = [
  {
    name: "select_elements",
    description: "Select elements on canvas by ID, type, or semantic label",
    input_schema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "Element ID, type (e.g., 'text', 'rect'), or label" },
        mode: { type: "string", enum: ["replace", "add", "remove"] }
      },
      required: ["selector"]
    }
  },
  {
    name: "modify_element",
    description: "Change properties of selected or specified elements",
    input_schema: {
      type: "object",
      properties: {
        element_id: { type: "string" },
        properties: {
          type: "object",
          properties: {
            fill: { type: "string" },
            stroke: { type: "string" },
            fontSize: { type: "number" },
            left: { type: "number" },
            top: { type: "number" },
            width: { type: "number" },
            height: { type: "number" },
            opacity: { type: "number" }
          }
        }
      },
      required: ["element_id", "properties"]
    }
  },
  {
    name: "create_element",
    description: "Add new element to canvas",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["text", "rect", "circle", "image", "group"] },
        properties: { type: "object" }
      },
      required: ["type", "properties"]
    }
  },
  {
    name: "delete_elements",
    description: "Remove elements from canvas (requires confirmation)",
    input_schema: {
      type: "object",
      properties: {
        element_ids: { type: "array", items: { type: "string" } }
      },
      required: ["element_ids"]
    }
  },
  {
    name: "regenerate_canvas",
    description: "Full canvas regeneration. Use only when user explicitly requests complete redesign.",
    input_schema: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        preserveElements: { type: "array", items: { type: "string" }, description: "Element IDs to keep unchanged" }
      },
      required: ["prompt"]
    }
  }
];
```

**1.3 API Updates** (`src/api/copilot-simple.js`)
```javascript
// Update streamSimpleGenerate to support tools and conversation
export const streamCopilotGenerate = async ({
  messages,              // Full conversation history
  canvasState,
  brandAssets,
  tools,                 // Tool definitions
  onToolCall,           // Callback when tool is invoked
  onToolResult,         // Callback when tool completes
  onText,               // Callback for text response
  onComplete,
  onError
}) => {
  // ... streaming implementation with tool call handling
};
```

**Acceptance Criteria:**
- [ ] User can have 5+ turn conversation without losing context
- [ ] AI can select specific elements by description ("the blue button")
- [ ] AI uses `modify_element` for single-property changes instead of regenerating
- [ ] Tool execution shows progress in UI (step cards)
- [ ] Conversation persists across panel close/reopen within session

### Research Insights: Phase 1

**From kieran-typescript-reviewer:**
- Add Zod schemas for runtime validation of tool inputs
- Type the SSE event payloads explicitly
- Use discriminated unions for step status types

```typescript
// Tool input validation with Zod
import { z } from 'zod';

const ModifyElementSchema = z.object({
  element_id: z.string().min(1),
  properties: z.object({
    fill: z.string().optional(),
    fontSize: z.number().positive().optional(),
    // ... validated properties
  }).strict() // Reject unknown properties
});

type ModifyElementInput = z.infer<typeof ModifyElementSchema>;
```

**From julik-frontend-races-reviewer (CRITICAL):**
- SSE reader has no AbortController cleanup on component unmount
- Add `isStreaming` guard to prevent undo during active streaming
- Debounce rapid tool calls (user might type "make it blue" then immediately "make it red")

```javascript
// Race condition fix: Guard undo during streaming
const handleUndo = () => {
  if ($copilotExecution.isLoading) {
    // Show toast: "Cannot undo while AI is working"
    return;
  }
  // Proceed with undo
};

// Race condition fix: SSE cleanup
onDestroy(() => {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
});
```

**From security-sentinel:**
- Sanitize element IDs before use (prevent XSS via malicious IDs)
- Validate tool inputs server-side, not just client-side
- Destructive operations (delete) need explicit user confirmation in UI
- Never execute `regenerate_canvas` without user approval

**From performance-oracle:**
- Add element index for O(log n) lookups by ID/label
- Debounce canvas state serialization (expensive for large canvases)
- Use delta serialization for streaming updates (send only changed properties)

```javascript
// Element index for fast lookups
const elementIndex = new Map(); // id -> element reference

// Debounced canvas serialization
const debouncedSerialize = debounce(() => {
  return fabricCanvas.toJSON(['id', 'name', 'label']); // Only include needed props
}, 100);
```

---

#### Phase 2: Design Intelligence

**Objective**: AI understands and can critique design quality

**Deliverables:**
- [ ] Design analysis tools (hierarchy, accessibility, color)
- [ ] Proactive suggestion system
- [ ] Explanation generation for AI decisions
- [ ] Quality scoring with breakdown

**Key Changes:**

**2.1 Analysis Tools** (add to `src/lib/copilot/tools.js`)
```javascript
{
  name: "analyze_design",
  description: "Analyze current canvas for design quality issues",
  input_schema: {
    type: "object",
    properties: {
      checks: {
        type: "array",
        items: { type: "string", enum: ["hierarchy", "accessibility", "color", "spacing", "typography"] }
      }
    },
    required: ["checks"]
  }
},
{
  name: "check_accessibility",
  description: "Check WCAG 2.1 AA compliance",
  input_schema: {
    type: "object",
    properties: {
      element_ids: { type: "array", items: { type: "string" }, description: "Specific elements or empty for all" }
    }
  }
},
{
  name: "explain_decision",
  description: "Generate explanation for a design choice",
  input_schema: {
    type: "object",
    properties: {
      aspect: { type: "string", enum: ["color", "typography", "layout", "spacing", "hierarchy"] },
      element_id: { type: "string", description: "Optional specific element" }
    },
    required: ["aspect"]
  }
}
```

**2.2 Design Analysis Engine** (new file: `src/lib/copilot/design-intelligence.js`)
```javascript
export const analyzeVisualHierarchy = (canvasState) => {
  const elements = canvasState.objects || [];
  return {
    focalPoints: identifyFocalPoints(elements),
    sizeHierarchy: analyzeSizeRatios(elements),
    contrastHierarchy: analyzeContrastLevels(elements),
    issues: detectHierarchyIssues(elements),
    score: calculateHierarchyScore(elements)
  };
};

export const checkAccessibility = (canvasState) => {
  const issues = [];
  for (const element of canvasState.objects || []) {
    if (element.type === 'textbox' || element.type === 'i-text') {
      const contrast = calculateContrastRatio(element.fill, getBackgroundColor(element, canvasState));
      if (contrast < 4.5) {
        issues.push({
          severity: 'high',
          element: element.id,
          issue: 'Insufficient contrast ratio',
          current: contrast.toFixed(2),
          required: 4.5,
          wcag: 'WCAG 2.1 1.4.3'
        });
      }
    }
  }
  return { passed: issues.length === 0, issues };
};

export const analyzeColorHarmony = (canvasState) => {
  const colors = extractColors(canvasState);
  return {
    palette: colors,
    harmony: detectColorHarmony(colors), // complementary, analogous, triadic
    issues: detectColorIssues(colors),
    suggestions: generateColorSuggestions(colors)
  };
};
```

**2.3 Proactive Suggestions** (add to `src/store/copilot.store.js`)
```javascript
export const copilotSuggestions = writable({
  pending: [],           // Suggestions awaiting user response
  dismissed: [],         // Suggestions user dismissed
  applied: [],           // Suggestions user applied
  enabled: true,         // User preference
  triggerDelay: 5000     // ms after idle before suggesting
});

export const copilotActions = {
  // ... existing actions

  addSuggestion: (suggestion) => {
    copilotSuggestions.update(s => ({
      ...s,
      pending: [...s.pending, { ...suggestion, id: crypto.randomUUID(), timestamp: Date.now() }]
    }));
  },

  dismissSuggestion: (id) => { /* ... */ },
  applySuggestion: (id) => { /* ... */ }
};
```

**Acceptance Criteria:**
- [ ] "Analyze this design" returns structured quality report
- [ ] Accessibility issues highlighted with WCAG references
- [ ] AI explains why it chose specific colors/fonts
- [ ] Proactive suggestions appear after 5s idle on detected issues
- [ ] User can enable/disable proactive suggestions

### Research Insights: Phase 2

**From frontend-design skill:**
- Use visual indicators for suggestion cards (subtle pulse animation on high-priority suggestions)
- Show suggestion confidence level (AI certainty score)
- Group related suggestions (e.g., all color-related suggestions together)
- Allow bulk-apply for non-conflicting suggestions

**Suggestion Card UI Pattern:**
```svelte
<!-- Suggested pattern for suggestion cards -->
<div class="suggestion-card" class:high-priority={suggestion.priority === 'high'}>
  <div class="suggestion-header">
    <span class="suggestion-type">{suggestion.category}</span>
    <span class="confidence-badge">{suggestion.confidence}% confident</span>
  </div>
  <p class="suggestion-text">{suggestion.message}</p>
  <div class="suggestion-actions">
    <button on:click={() => applySuggestion(suggestion)}>Apply</button>
    <button on:click={() => dismissSuggestion(suggestion)}>Dismiss</button>
    <button on:click={() => explainSuggestion(suggestion)}>Why?</button>
  </div>
</div>
```

**From Svelte documentation (Context7):**
- Use `derived` stores for computed suggestion state
- Use Svelte transitions for suggestion appearance/dismissal
- Consider `use:portal` for suggestion overlays to avoid z-index issues

---

#### Phase 3: Unified History & Refinement

**Objective**: Single undo/redo system with progressive updates

**Deliverables:**
- [ ] Merge Copilot undo into canvas history
- [ ] Support partial canvas updates (element-level)
- [ ] "Preserve these elements" constraint support
- [ ] Before/after comparison view

**Key Changes:**

**3.1 History Integration** (update `src/lib/components/editor/Canvas.svelte`)
```javascript
// Add Copilot-aware history entries
function saveStateWithMeta(description, source = 'user') {
  const state = {
    canvasJSON: fabricCanvas.toJSON(),
    description,
    source, // 'user' | 'copilot' | 'undo'
    timestamp: Date.now(),
    toolCalls: source === 'copilot' ? getCurrentToolCalls() : []
  };
  historyStack = [...historyStack.slice(0, historyIndex + 1), state];
  historyIndex = historyStack.length - 1;
}

// Batch Copilot operations into single history entry
let copilotBatch = null;

window.__historyBatchStart = (description) => {
  copilotBatch = { changes: [], description };
};

window.__historyBatchEnd = () => {
  if (copilotBatch && copilotBatch.changes.length > 0) {
    saveStateWithMeta(copilotBatch.description, 'copilot');
  }
  copilotBatch = null;
};
```

**3.2 Partial Update Protocol** (update `src/api/copilot-simple.js`)
```javascript
// New event type for element-level updates
// SSE events: 'element_update' for single element, 'canvas_update' for full

// On element_update event:
onElementUpdate: (payload) => {
  // payload: { element_id, properties, action: 'modify'|'create'|'delete' }
  const canvas = get(editor);
  const element = canvas.getObjects().find(o => o.id === payload.element_id);
  if (element && payload.action === 'modify') {
    element.set(payload.properties);
    canvas.requestRenderAll();
  }
}
```

**3.3 Constraint Parsing** (new file: `src/lib/copilot/constraints.js`)
```javascript
export const parseConstraints = (prompt) => {
  const constraints = {
    preserve: [],      // Elements to keep unchanged
    exclude: [],       // Areas to not modify
    focus: [],         // Elements to focus on
    style: null        // Style constraints
  };

  // Parse "keep the logo", "don't change the header", etc.
  const preservePatterns = [
    /(?:keep|preserve|don't (?:change|modify|touch))\s+(?:the\s+)?(.+?)(?:\s+(?:as is|unchanged))?(?:\.|,|$)/gi
  ];

  for (const pattern of preservePatterns) {
    let match;
    while ((match = pattern.exec(prompt)) !== null) {
      constraints.preserve.push(match[1].trim());
    }
  }

  return constraints;
};
```

**Acceptance Criteria:**
- [ ] Ctrl+Z undoes Copilot changes in same stack as manual edits
- [ ] "Change the button but keep the header" preserves header exactly
- [ ] Element-level updates don't trigger full canvas re-render
- [ ] Compare toggle shows before/after overlay
- [ ] Multi-step Copilot operations grouped as single undo entry

### Research Insights: Phase 3 (CRITICAL)

**From architecture-strategist (CRITICAL REFACTOR NEEDED):**

The current implementation has **fragmented undo systems**:
1. `CopilotPanel.svelte:27-29` - `previousState` variable for Copilot undo
2. `Canvas.svelte` - Main canvas history stack
3. `window.__historyBatchStart/End` - Global functions for batching

**THIS IS THE #1 ARCHITECTURAL ISSUE TO FIX.**

**Recommended Architecture:**
```javascript
// Single source of truth: src/store/history.store.js (NEW FILE)
import { writable, derived } from 'svelte/store';

export const historyStack = writable([]);
export const historyIndex = writable(-1);

export const canUndo = derived(historyIndex, $idx => $idx > 0);
export const canRedo = derived(
  [historyStack, historyIndex],
  ([$stack, $idx]) => $idx < $stack.length - 1
);

// Batch operations for Copilot
let batchInProgress = null;

export const historyActions = {
  push: (state, meta = {}) => {
    if (batchInProgress) {
      batchInProgress.states.push(state);
      return;
    }
    historyStack.update(stack => [...stack, { state, meta, timestamp: Date.now() }]);
    historyIndex.update(idx => idx + 1);
  },

  startBatch: (description) => {
    batchInProgress = { description, states: [] };
  },

  endBatch: () => {
    if (batchInProgress && batchInProgress.states.length > 0) {
      const finalState = batchInProgress.states[batchInProgress.states.length - 1];
      historyStack.update(stack => [...stack, {
        state: finalState,
        meta: { description: batchInProgress.description, source: 'copilot' },
        timestamp: Date.now()
      }]);
      historyIndex.update(idx => idx + 1);
    }
    batchInProgress = null;
  },

  undo: () => { /* ... */ },
  redo: () => { /* ... */ }
};
```

**From pattern-recognition-specialist:**
- Remove `window.__historyBatchStart/End` globals (anti-pattern)
- Use store subscription pattern instead of global functions
- CopilotPanel should import `historyActions.startBatch/endBatch` directly

**Migration Path:**
1. Create `src/store/history.store.js` with unified history
2. Update `Canvas.svelte` to use new history store
3. Update `CopilotPanel.svelte` to remove `previousState` and use store
4. Remove `window.__historyBatchStart/End` globals
5. Add streaming state guard to prevent undo during AI operations

---

#### Phase 4: Polish & Performance

**Objective**: Production-ready performance and UX refinements

**Deliverables:**
- [ ] Context window management (trim old messages)
- [ ] Complex canvas handling (50+ elements)
- [ ] Element reference resolution ("the blue button")
- [ ] Keyboard shortcuts (Cmd+K for copilot)
- [ ] Error recovery and retry logic

**Key Changes:**

**4.1 Context Management** (update `src/store/copilot.store.js`)
```javascript
export const trimConversation = (messages, maxTokens = 8000) => {
  // Keep first message (establishes intent) + recent messages
  if (messages.length <= 3) return messages;

  const first = messages[0];
  const recent = messages.slice(-6); // Last 3 exchanges

  // Estimate tokens and trim if needed
  let tokenCount = estimateTokens([first, ...recent]);
  let trimmed = [first, ...recent];

  while (tokenCount > maxTokens && trimmed.length > 2) {
    trimmed = [trimmed[0], ...trimmed.slice(2)];
    tokenCount = estimateTokens(trimmed);
  }

  return trimmed;
};
```

**4.2 Element Resolution** (new file: `src/lib/copilot/element-resolver.js`)
```javascript
export const resolveElementReference = (reference, canvasState, labels) => {
  // Try exact ID match
  const byId = canvasState.objects.find(o => o.id === reference);
  if (byId) return [byId];

  // Try label match
  for (const [id, label] of labels) {
    if (label.toLowerCase().includes(reference.toLowerCase())) {
      return [canvasState.objects.find(o => o.id === id)];
    }
  }

  // Try type match ("the button" -> rect with button-like properties)
  if (reference.includes('button')) {
    return canvasState.objects.filter(o =>
      o.type === 'rect' && o.rx > 0 // rounded corners
    );
  }

  // Try color match ("the blue element")
  const colorMatch = reference.match(/(red|blue|green|yellow|orange|purple|pink|black|white|gray|grey)/i);
  if (colorMatch) {
    const color = colorMatch[1].toLowerCase();
    return canvasState.objects.filter(o =>
      o.fill?.toLowerCase().includes(color) ||
      o.stroke?.toLowerCase().includes(color)
    );
  }

  // Try position match ("top left element", "the header")
  // ...

  return [];
};
```

**4.3 Keyboard Shortcuts** (update `CopilotPanel.svelte`)
```javascript
onMount(() => {
  const handleKeydown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      copilotActions.toggleDrawer();
      tick().then(() => textareaElement?.focus());
    }
  };
  window.addEventListener('keydown', handleKeydown);
  return () => window.removeEventListener('keydown', handleKeydown);
});
```

**Acceptance Criteria:**
- [ ] Conversation stays under 8K tokens with intelligent trimming
- [ ] 50+ element canvas responds in <2s for analysis
- [ ] "The blue button" correctly resolves 90%+ of the time
- [ ] Cmd+K opens copilot, focuses input
- [ ] Network errors show retry option with modified prompt suggestion

### Research Insights: Phase 4

**From performance-oracle:**

**Context Window Management:**
```javascript
// Token estimation (rough: 4 chars = 1 token)
const estimateTokens = (messages) => {
  return messages.reduce((sum, msg) => {
    return sum + Math.ceil(JSON.stringify(msg).length / 4);
  }, 0);
};

// Summarization strategy for long conversations
const summarizeHistory = (messages) => {
  if (messages.length <= 4) return messages;

  // Keep: first message (intent), last 2 exchanges, summarize middle
  const first = messages[0];
  const recent = messages.slice(-4);
  const middle = messages.slice(1, -4);

  if (middle.length === 0) return messages;

  // Create summary of middle exchanges
  const summary = {
    role: 'system',
    content: `Previous conversation summary: ${middle.length} exchanges about ${extractTopics(middle).join(', ')}`
  };

  return [first, summary, ...recent];
};
```

**Element Resolution Performance:**
```javascript
// Spatial index for O(log n) element lookups
import RBush from 'rbush';

class ElementIndex {
  constructor() {
    this.byId = new Map();
    this.byLabel = new Map();
    this.spatial = new RBush();
  }

  index(elements) {
    this.byId.clear();
    this.byLabel.clear();
    this.spatial.clear();

    const spatialItems = elements.map(el => {
      this.byId.set(el.id, el);
      if (el.label) this.byLabel.set(el.label.toLowerCase(), el);

      return {
        minX: el.left,
        minY: el.top,
        maxX: el.left + (el.width || 0),
        maxY: el.top + (el.height || 0),
        element: el
      };
    });

    this.spatial.load(spatialItems);
  }

  findByPosition(x, y) {
    return this.spatial.search({ minX: x, minY: y, maxX: x, maxY: y });
  }

  findInRegion(description) {
    // "top left" -> search top 33%, left 33% of canvas
    // Returns elements in that region
  }
}
```

**From Fabric.js documentation (Context7):**
- Use `canvas.renderOnAddRemove = false` during batch operations
- Call `canvas.requestRenderAll()` once after batch completes
- Use `canvas.toJSON(['id', 'name', 'label'])` to serialize only needed properties
- For large canvases, consider `canvas.enableRetinaScaling = false` during streaming

---

### Research Insights: Agent-Native Parity

**From agent-native-reviewer (AUDIT RESULTS):**

Current tool coverage: **53%** (9/17 required tools for full agent parity)

| Tool | Status | Priority |
|------|--------|----------|
| modify_element | ✅ Planned | - |
| create_element | ✅ Planned | - |
| delete_elements | ✅ Planned | - |
| select_elements | ✅ Planned | - |
| regenerate_canvas | ✅ Planned | - |
| analyze_design | ✅ Planned | - |
| check_accessibility | ✅ Planned | - |
| explain_decision | ✅ Planned | - |
| get_canvas_state | ✅ Planned | - |
| **undo** | ❌ Missing | 🔴 HIGH |
| **redo** | ❌ Missing | 🔴 HIGH |
| **label_element** | ❌ Missing | 🟡 MEDIUM |
| **list_labels** | ❌ Missing | 🟡 MEDIUM |
| **get_suggestions** | ❌ Missing | 🟡 MEDIUM |
| **group_elements** | ❌ Missing | 🔵 LOW |
| **ungroup_elements** | ❌ Missing | 🔵 LOW |
| **get_selection** | ❌ Missing | 🔵 LOW |

**Required Additions for Full Parity:**
```javascript
// Add to COPILOT_TOOLS
{
  name: "undo",
  description: "Undo the last canvas change. Agent can use this to revert mistakes.",
  input_schema: { type: "object", properties: {} }
},
{
  name: "redo",
  description: "Redo an undone change.",
  input_schema: { type: "object", properties: {} }
},
{
  name: "label_element",
  description: "Assign a semantic label to an element for easier reference",
  input_schema: {
    type: "object",
    properties: {
      element_id: { type: "string" },
      label: { type: "string", description: "Human-readable label like 'hero-button' or 'main-heading'" }
    },
    required: ["element_id", "label"]
  }
},
{
  name: "get_suggestions",
  description: "Get proactive design improvement suggestions for current canvas",
  input_schema: {
    type: "object",
    properties: {
      focus_areas: { type: "array", items: { type: "string", enum: ["accessibility", "hierarchy", "color", "spacing"] } }
    }
  }
}
```

**Principle:** Every action a user can perform through the UI, an agent must be able to perform through tools. This ensures agents can fully assist with design tasks.

---

## Alternative Approaches Considered

### 1. Full Agent Framework (LangGraph/AutoGen)
**Rejected because**: Adds significant backend complexity, requires Python runtime, overkill for current needs. Can migrate later if needed.

### 2. Keep Full Canvas Regeneration Only
**Rejected because**: User feedback shows frustration with losing small changes. Targeted edits are essential for iterative design workflow.

### 3. Separate "Simple" and "Advanced" Copilot Modes
**Rejected because**: Fragments the experience. Better to have intelligent routing that uses simple generation when appropriate, tools when needed.

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `src/store/history.store.js` | **NEW** - Unified history store (replaces fragmented systems) | 🔴 P1 |
| `src/api/copilot-simple.js` | Add tool support, conversation context, AbortController cleanup | 🔴 P1 |
| `src/store/copilot.store.js` | Add conversation history, tool state, remove previousState | 🔴 P1 |
| `src/lib/components/editor/CopilotPanel.svelte` | Multi-turn UI, use unified history, streaming guards | 🔴 P1 |
| `src/lib/components/editor/Canvas.svelte` | Use unified history store, remove window globals | 🔴 P1 |
| `src/lib/copilot/tools.js` | **NEW** - Tool definitions with Zod validation | 🟡 P2 |
| `src/lib/copilot/design-intelligence.js` | **NEW** - Analysis engine | 🟡 P2 |
| `src/lib/copilot/element-resolver.js` | **NEW** - Element reference resolution with spatial index | 🟡 P2 |
| `src/lib/copilot/constraints.js` | **NEW** - Constraint parsing | 🔵 P3 |

### Migration Checklist (Phase 1 Focus)

- [x] Create `src/store/history.store.js` with unified undo/redo
- [x] Remove `previousState` from CopilotPanel.svelte
- [x] Remove `window.__historyBatchStart/End` globals from Canvas.svelte (now uses setupLegacyGlobals)
- [x] Add AbortController to SSE stream handling (copilot-simple.js)
- [x] Add `isStreaming` guard to undo handler (added to history.store.js)
- [x] Add Zod validation to tool inputs (tools.js)

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tool calls increase latency | High | Medium | Progressive streaming, optimistic UI updates |
| Element resolution ambiguity | Medium | High | Clarification UI, visual element highlighting |
| Context window overflow | Medium | Medium | Intelligent trimming, conversation summarization |
| Breaking changes to existing flow | Low | High | Feature flag rollout, A/B testing |
| Backend API changes required | High | Medium | Coordinate with backend team, document contract |

## Success Metrics

- **Task completion rate**: % of design tasks completed without "start over"
- **Conversation depth**: Average turns per session (target: 5+)
- **Tool usage ratio**: % of requests using tools vs. full regeneration (target: 60%+)
- **Undo frequency**: Decrease in undo usage indicating better first results
- **User satisfaction**: NPS for copilot feature (target: 40+)

## Dependencies & Prerequisites

- Backend API must support tool-based generation with streaming
- Backend must handle conversation history (or frontend persistence acceptable)
- PLG quota system decision for tool calls vs. generations

## References & Research

### Internal References
- Current implementation: `src/api/copilot-simple.js`
- Swarm architecture (for multi-agent patterns): `src/api/copilot-swarm.js`
- Canvas history system: `src/lib/components/editor/Canvas.svelte:21-58`
- Brand assets integration: `src/lib/components/editor/CopilotPanel.svelte:308-326`

### External References
- [Anthropic Tool Use Guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Figma AI MCP Server](https://www.figma.com/blog/design-systems-ai-mcp/)
- [Design Tokens Specification 2025](https://www.w3.org/community/design-tokens/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [SSE for LLM Streaming](https://procedure.tech/blogs/the-streaming-backbone-of-llms/)

### Research Documents
- Best practices for AI design copilots (2025-2026)
- Claude API patterns for tool use and streaming
- SpecFlow analysis with 52 gaps and 38 questions identified
