---
title: 'feat: Backend Copilot Aesthetic Diversity'
type: feat
date: 2026-02-02
deepened: 2026-02-02
---

# Backend Copilot Aesthetic Diversity

## Enhancement Summary

**Deepened on:** 2026-02-02
**Review agents used:** performance-oracle, architecture-strategist, code-simplicity-reviewer, security-sentinel, agent-native-reviewer, framework-docs-researcher

### Critical Recommendation: Minimal Viable Approach

The code-simplicity-reviewer identified that **Phases 2-5 can be eliminated entirely**. The core problem (biased outputs) can be solved with 3 simple changes to `copilot-simple.js`:

1. **Remove hardcoded colors** from system prompt (lines 166-170)
2. **Remove neo-brutalist style defaults** from system prompt
3. **Add anti-bias instructions** to system prompt
4. **Increase temperature** from 0.5 to 0.8

This achieves "diverse, aesthetic outputs" with **one small PR** instead of a multi-week infrastructure project.

### Key Findings by Category

#### Security Issues (P1 - Must Fix)

- **Prompt injection**: User prompts concatenated without sanitization (line 264)
- **SSRF risk**: Brand asset URLs not validated before fetching
- **Hardcoded secrets**: `.env.local` contains API keys in version control
- **Recommendation**: Add `sanitizePrompt()` function, validate URLs against allowlist

#### Performance Considerations (P2)

- Current temperature 0.5 is too deterministic - outputs converge
- Multi-temperature parallel calls (Phase 3) would 3x API costs
- **Recommendation**: Single call at temperature 0.8 achieves diversity without cost increase
- If embeddings needed, cache them at startup (not per-request)

#### Architecture Insights (P2)

- `copilot-v2/` already has 3-agent pipeline but unused
- `design-patterns.js` (2878 lines) is the real bias source
- **Recommendation**: Don't add new files - modify existing `copilot-simple.js`

#### Agent-Native Gap (P2)

- Frontend has 22 tools, backend exposes 0
- Aesthetic validator won't be callable by agents
- **Recommendation**: If building validator, expose as API endpoint with tool definition

### Revised Implementation Strategy

**PHASE 1 ONLY** - Minimal changes to `copilot-simple.js`:

```javascript
// 1. Remove hardcoded palette (delete lines 166-170)
// Instead of: const DEFAULT_PALETTE = {...}
// Use: Let the LLM choose colors based on prompt context

// 2. Update temperature (line 24)
// Before: temperature: 0.5
// After: temperature: 0.8

// 3. Add anti-bias instructions to system prompt
// Add to SYSTEM_PROMPT constant

// 4. Add prompt sanitization (new function)
function sanitizePrompt(userPrompt) {
	// Strip potential injection patterns
	return userPrompt.replace(/ignore previous|disregard|forget/gi, '').slice(0, 2000); // Limit length
}
```

**DEFER TO LATER** (if metrics show need):

- Phase 2: Style selector (adds complexity without proven benefit)
- Phase 3: Multi-temperature (3x cost for marginal gain)
- Phase 4: Aesthetic validator (solve with better prompts first)
- Phase 5: Template embeddings (over-engineering for 12 templates)

### Success Metrics Update

| Metric                  | Current | Target (Minimal) | Target (Full) |
| ----------------------- | ------- | ---------------- | ------------- |
| Unique layouts per 100  | ~12     | >30              | >50           |
| API cost per generation | 1x      | 1x               | 3x            |
| Implementation effort   | -       | 1 day            | 2+ weeks      |
| Files changed           | -       | 1                | 6+            |

---

## Overview

Transform the AI copilot backend to produce more aesthetic, diverse outputs that aren't biased by the 12 hardcoded golden examples. This involves restructuring the prompt engineering, removing hardcoded biases, implementing dynamic style selection, and adding aesthetic validation.

## Problem Statement / Motivation

**Current Limitations:**

- **12 Golden Examples Bias**: `design-patterns.js` (2878 lines) contains only 12 templates that all outputs converge toward
- **Hardcoded Color Palette**: Default cream/purple/red colors baked into system prompts
- **No Style Randomization**: Similar prompts produce nearly identical outputs
- **Simplistic Template Matching**: Uses substring matching, not semantic understanding
- **No Aesthetic Validation**: First output is final, even if flawed

**User Pain Points:**

- "All my designs look the same even with different prompts"
- "The AI keeps generating hackathon-style designs for everything"
- "I want variety but keep getting similar layouts"
- "Designs don't feel creative or unique"

## Proposed Solution

A multi-pronged approach:

1. **Dynamic Prompt Engineering** - Remove hardcoded biases, use adaptive style selection
2. **Multi-Temperature Generation** - Generate variations with different creativity levels
3. **Semantic Template Matching** - Use embeddings for better prompt-to-template matching
4. **Aesthetic Scoring System** - Validate outputs against design principles
5. **Style Diversity Injection** - Controlled randomness for visual variety

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COPILOT GENERATION PIPELINE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
│  │ Prompt        │───▶│ Style         │───▶│ LLM           │       │
│  │ Analysis      │    │ Selector      │    │ Generation    │       │
│  └───────────────┘    └───────────────┘    └───────────────┘       │
│         │                    │                    │                 │
│         ▼                    ▼                    ▼                 │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
│  │ Intent        │    │ Dynamic       │    │ Aesthetic     │       │
│  │ Extraction    │    │ Temperature   │    │ Validator     │       │
│  └───────────────┘    └───────────────┘    └───────────────┘       │
│                                                    │                │
│                                                    ▼                │
│                                           ┌───────────────┐        │
│                                           │ Output        │        │
│                                           │ Refinement    │        │
│                                           └───────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation Phases

#### Phase 1: Remove Hardcoded Biases (RECOMMENDED - DO THIS FIRST)

**Research Insights:**

- **Performance Oracle**: Temperature 0.5 is too deterministic; increase to 0.8 for natural diversity
- **Security Sentinel**: Add prompt sanitization before concatenation (prevents injection)
- **Code Simplicity**: This phase alone may achieve 80% of the goal

**Tasks:**

- [x] Remove hardcoded default color palette from `copilot-simple.js:166-170`
- [x] Increase temperature from 0.5 to 0.8 (line 24)
- [x] Remove neo-brutalist style defaults from system prompt
- [x] Add `sanitizePrompt()` function to prevent injection
- [x] Make shadow styles contextual (flat, soft, hard based on design type)
- [x] Remove prescriptive "MUST PLACE LOGO" instruction
- [x] Add anti-bias instructions to system prompt (see Phase 6)

**Files to modify:**

- `service/copilot-simple.js` - System prompt restructuring

**Security Addition (from security-sentinel):**

```javascript
// Add before line 264 where user prompt is concatenated
function sanitizePrompt(userPrompt) {
	if (!userPrompt || typeof userPrompt !== 'string') return '';
	return userPrompt
		.replace(/ignore previous|disregard|forget|system:|assistant:/gi, '[filtered]')
		.replace(/<[^>]*>/g, '') // Strip HTML/XML tags
		.slice(0, 2000); // Limit length to prevent context stuffing
}
```

```javascript
// service/copilot-simple.js - Before (hardcoded)
const DEFAULT_PALETTE = {
	background: '#FFFDF8',
	dark: '#1f2937',
	accent1: '#ff6b6b',
	accent2: '#ffc480',
	accent3: '#6366f1'
};

// After (dynamic based on prompt intent)
function generatePaletteFromIntent(prompt, brandAssets) {
	const moods = analyzeMood(prompt); // warm, cool, professional, playful, etc.
	if (brandAssets?.colors?.length > 0) {
		return buildPaletteFromBrand(brandAssets.colors, moods);
	}
	return generateMoodBasedPalette(moods);
}
```

#### Phase 2: Implement Dynamic Style Selection (DEFERRED - May Not Be Needed)

**Research Insights:**

- **Code Simplicity Reviewer**: "This adds an extra LLM call for style analysis before generation. The same diversity can be achieved by improving the system prompt instructions."
- **Architecture Strategist**: "If implemented, this duplicates responsibility already handled by the LLM. Consider adding style hints to the prompt instead of a separate analyzer."
- **Performance Oracle**: "Extra LLM call adds 1-2s latency and doubles cost per request."

**Recommendation**: Skip this phase initially. If Phase 1 doesn't achieve sufficient diversity after A/B testing, revisit.

**Tasks (if needed):**

- [ ] Create style intent analyzer using LLM pre-processing
- [ ] Build style profiles (minimalist, bold, elegant, playful, corporate, organic)
- [ ] Implement style weighting based on prompt keywords
- [ ] Add style diversity scoring to prevent repetition

**New file:** `service/style-selector.js`

```javascript
// service/style-selector.js
const STYLE_PROFILES = {
	minimalist: {
		characteristics: ['whitespace', 'clean lines', 'limited colors', 'sans-serif'],
		colorStrategy: 'monochromatic',
		layoutDensity: 0.3,
		decorativeElements: false
	},
	bold: {
		characteristics: ['high contrast', 'large text', 'strong colors', 'geometric'],
		colorStrategy: 'complementary',
		layoutDensity: 0.6,
		decorativeElements: true
	},
	elegant: {
		characteristics: ['serif fonts', 'subtle colors', 'balanced', 'refined'],
		colorStrategy: 'analogous',
		layoutDensity: 0.4,
		decorativeElements: 'minimal'
	}
	// ... more profiles
};

export async function selectStyle(prompt, history = []) {
	const intent = await analyzePromptIntent(prompt);
	const recentStyles = history.map((h) => h.style);

	// Avoid recent styles for diversity
	const candidates = Object.entries(STYLE_PROFILES).filter(
		([name]) => !recentStyles.slice(-3).includes(name)
	);

	return weightedRandomSelection(candidates, intent);
}
```

#### Phase 3: Multi-Temperature Generation (DEFERRED - Cost Concern)

**Research Insights:**

- **Performance Oracle**: "Parallel generation at 3 temperatures means 3x API cost and requires result synthesis (another LLM call = 4x cost total). This is expensive for marginal diversity gain."
- **Code Simplicity Reviewer**: "A single generation at temperature 0.8-0.85 provides natural variation without the complexity of parallel calls and synthesis."
- **LangChain Docs**: If implementing, use `Promise.allSettled()` with timeout, cache intermediate results.

**Recommendation**: Use single generation at temperature 0.8. Only implement multi-temp if users explicitly request "variations" feature.

**Tasks (if variations feature requested):**

- [ ] Implement parallel generation with varied temperatures (0.7, 0.85, 0.95)
- [ ] Add synthesis step to select best output
- [ ] Support "variations" mode for user-requested alternatives
- [ ] Add caching to avoid redundant embedding lookups

**Modify:** `service/copilot-simple.js`

```javascript
// service/copilot-simple.js
export async function generateWithDiversity(prompt, options = {}) {
	const { variations = 1, synthesize = true } = options;

	if (variations === 1) {
		return generateSingle(prompt, { temperature: 0.8 });
	}

	// Generate multiple with varied temperatures
	const temperatures = [0.7, 0.85, 0.95].slice(0, variations);
	const results = await Promise.all(
		temperatures.map((temp) => generateSingle(prompt, { temperature: temp }))
	);

	if (synthesize) {
		return selectBestOutput(results, prompt);
	}

	return results; // Return all variations
}
```

#### Phase 4: Aesthetic Scoring System (DEFERRED - Solve With Prompts First)

**Research Insights:**

- **Code Simplicity Reviewer**: "Aesthetic validation is a post-hoc fix for bad generation. Better to improve generation quality through prompts than to reject and retry."
- **Agent-Native Reviewer**: "If implemented, this MUST be exposed as an API endpoint with tool definition so agents can call it. Currently planned as internal-only."
- **Architecture Strategist**: "Contrast ratio checking is useful but can be done client-side in the frontend, closer to the actual rendering."

**Recommendation**: Add aesthetic guidelines to the system prompt. Implement programmatic validation only if rejection rate is high.

**If Implemented - Agent-Native Requirement:**

```javascript
// Expose as callable tool for agents
export const aestheticValidatorTool = {
	name: 'validate_aesthetics',
	description: 'Check design for WCAG contrast, hierarchy, spacing issues',
	input_schema: {
		type: 'object',
		properties: {
			canvas_state: { type: 'object', description: 'FabricJS canvas JSON' }
		},
		required: ['canvas_state']
	}
};
```

**Tasks (if needed):**

- [ ] Implement contrast ratio checker for text elements
- [ ] Add typography hierarchy validation
- [ ] Check spacing consistency
- [ ] Validate visual balance and alignment
- [ ] Score overall aesthetic quality
- [ ] **Expose as API endpoint with tool definition** (agent-native requirement)

**New file:** `service/aesthetic-validator.js`

```javascript
// service/aesthetic-validator.js
export function validateAesthetics(canvasState) {
	const scores = {
		contrast: checkContrastRatios(canvasState), // WCAG compliance
		hierarchy: checkTypographyHierarchy(canvasState), // Size progression
		spacing: checkSpacingConsistency(canvasState), // Grid alignment
		balance: checkVisualBalance(canvasState), // Element distribution
		harmony: checkColorHarmony(canvasState) // Color relationships
	};

	const overall = Object.values(scores).reduce((a, b) => a + b, 0) / 5;

	return {
		scores,
		overall,
		passed: overall >= 0.7,
		suggestions: generateImprovementSuggestions(scores)
	};
}
```

#### Phase 5: Enhanced Template System (DEFERRED - High Effort, Uncertain ROI)

**Research Insights:**

- **Code Simplicity Reviewer**: "Adding 20 templates and embeddings is a multi-week content creation project. The 12 existing templates aren't the core problem - the hardcoded styling applied TO them is."
- **Performance Oracle**: "Embedding lookups should be cached at startup, not computed per-request. Pre-compute and store in memory."
- **Architecture Strategist**: "The existing `template-matcher.js` in copilot-v2 uses tag-based matching which works well. Semantic embeddings are over-engineering for 12 templates."

**Recommendation**: Templates aren't the bottleneck. Focus on prompt diversity first. Only expand templates if users request specific missing categories.

**If Implementing Embeddings (Performance Best Practices):**

```javascript
// Cache embeddings at startup - not per request
const TEMPLATE_EMBEDDINGS = new Map(); // Populate on server start

async function initializeEmbeddings() {
	const templates = loadTemplates();
	for (const t of templates) {
		TEMPLATE_EMBEDDINGS.set(t.id, await embeddings.embedQuery(t.description));
	}
}

// Use cached embeddings in matching
export async function findSimilarTemplates(prompt, topK = 3) {
	const promptEmbed = await embeddings.embedQuery(prompt); // Only this is per-request
	// ... rest uses cached TEMPLATE_EMBEDDINGS
}
```

**Tasks (if needed):**

- [ ] Add 20+ new design templates for missing categories
- [ ] Implement semantic similarity matching using embeddings
- [ ] **Pre-compute and cache embeddings at startup** (performance requirement)
- [ ] Add template metadata for better filtering
- [ ] Support aspect ratio adaptation

**Modify:** `service/design-patterns.js`

```javascript
// New template categories to add:
const NEW_TEMPLATES = [
	'restaurant_menu',
	'wedding_invitation',
	'funeral_memorial',
	'job_posting',
	'testimonial_card',
	'pricing_table',
	'certificate',
	'business_card',
	'newsletter_header',
	'podcast_cover',
	'youtube_thumbnail',
	'linkedin_banner',
	'app_screenshot',
	'infographic_stat',
	'countdown_timer',
	'feature_comparison',
	'team_member_card',
	'event_ticket',
	'real_estate_listing',
	'recipe_card'
];
```

**New file:** `service/template-embeddings.js`

```javascript
// service/template-embeddings.js
import { OpenAIEmbeddings } from '@langchain/openai';

const embeddings = new OpenAIEmbeddings({
	modelName: 'text-embedding-3-small'
});

export async function findSimilarTemplates(prompt, templates, topK = 3) {
	const promptEmbedding = await embeddings.embedQuery(prompt);

	const scored = templates.map((template) => ({
		template,
		score: cosineSimilarity(promptEmbedding, template.embedding)
	}));

	return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
```

#### Phase 6: Anti-Bias System Prompt (INCLUDE IN PHASE 1)

**Research Insights:**

- **Code Simplicity Reviewer**: "This is the core fix. Merge into Phase 1 - it's just text changes to the system prompt."
- **Security Sentinel**: "Add output format validation to prevent the LLM from returning malformed JSON that could break the frontend."
- **Agent-Native Reviewer**: "Include reasoning field in output so agents understand design decisions."

**Recommendation**: Implement this as part of Phase 1, not as a separate phase.

**Tasks:**

- [x] Remove references to specific design styles as defaults (part of Phase 1)
- [x] Add explicit diversity instructions (part of Phase 1)
- [ ] Include cultural sensitivity guidelines
- [ ] Request style justification in output (reasoning field)

**New system prompt structure:**

```javascript
const ANTI_BIAS_SYSTEM_PROMPT = `
You are a versatile design generator that creates diverse, contextually appropriate designs.

DIVERSITY REQUIREMENTS:
- Do not default to any particular aesthetic style without justification
- Consider the prompt's mood, purpose, and target audience
- Vary layout structures between generations
- Use culturally appropriate design choices

AESTHETIC PRINCIPLES (apply contextually, not rigidly):
- Ensure readable contrast (4.5:1 minimum for text)
- Create clear visual hierarchy
- Maintain consistent spacing
- Balance positive and negative space

AVOID THESE BIASES:
- Do not always use the same color palette
- Do not default to "tech startup" or "hackathon" aesthetics
- Do not force decorative elements where simplicity serves better
- Do not assume Western design conventions without context

OUTPUT REQUIREMENTS:
- Explain style choices briefly in reasoning field
- Note any cultural or contextual influences
- Flag if the design intentionally breaks conventions
`;
```

## Acceptance Criteria

### Functional Requirements

- [ ] Backend generates designs with measurably different aesthetics for similar prompts
- [ ] No hardcoded default colors in system prompts
- [ ] Style selection adapts to prompt intent
- [ ] Aesthetic validation scores above 0.7 for all outputs
- [ ] At least 32 template categories available (current 12 + 20 new)
- [ ] Semantic template matching achieves >80% relevance score

### Non-Functional Requirements

- [ ] Generation latency < 5 seconds for single output
- [ ] Multi-variation mode completes in < 15 seconds
- [ ] Memory usage stable under load
- [ ] API maintains backward compatibility

### Quality Gates

- [ ] Unit tests for aesthetic validator
- [ ] Integration tests for style selector
- [ ] A/B test showing improved diversity scores
- [ ] No regression in generation success rate

## Success Metrics

| Metric                             | Current | Target |
| ---------------------------------- | ------- | ------ |
| Unique layouts per 100 generations | ~12     | >50    |
| Aesthetic validation pass rate     | N/A     | >85%   |
| User "regenerate" rate             | ~40%    | <20%   |
| Template match relevance           | ~60%    | >80%   |

## Dependencies & Risks

**Dependencies:**

- OpenRouter API for LLM calls
- Text embedding model for semantic matching
- Frontend already supports tool-based architecture

**Risks:**

- Increased latency from multi-step pipeline
- Higher API costs from multiple generation attempts
- Template expansion requires significant content creation

## Implementation Checklist

### Phase 1: Remove Hardcoded Biases

- [x] `service/copilot-simple.js` - Remove default palette
- [x] `service/copilot-simple.js` - Remove neo-brutalist defaults
- [x] `service/copilot-simple.js` - Make shadow styles dynamic
- [ ] Tests for palette generation (deferred - minimal approach)

### Phase 2: Dynamic Style Selection

- [ ] Create `service/style-selector.js`
- [ ] Define style profiles
- [ ] Implement intent analyzer
- [ ] Add style history tracking

### Phase 3: Multi-Temperature Generation

- [ ] Modify `service/copilot-simple.js` for parallel generation
- [ ] Implement output synthesis
- [ ] Add variations API endpoint
- [ ] Tests for variation quality

### Phase 4: Aesthetic Scoring

- [ ] Create `service/aesthetic-validator.js`
- [ ] Implement contrast checker
- [ ] Implement hierarchy validator
- [ ] Implement spacing checker
- [ ] Integration with generation pipeline

### Phase 5: Template Expansion

- [ ] Add 20 new template categories
- [ ] Create `service/template-embeddings.js`
- [ ] Pre-compute template embeddings
- [ ] Migrate template matching to semantic

### Phase 6: Anti-Bias Prompt

- [ ] Rewrite system prompt
- [ ] Add diversity instructions
- [ ] Add style justification requirement
- [ ] A/B test new vs old prompts

## References & Research

### Internal References

- Frontend copilot plan: `/docs/plans/2026-02-02-feat-state-of-the-art-canvas-copilot-plan.md`
- Current backend: `/Users/suyashthakur/html-to-gif/service/copilot-simple.js`
- Golden examples: `/Users/suyashthakur/html-to-gif/service/design-patterns.js`
- Frontend tools: `/src/lib/copilot/tools.js`

### External References

- Claude Structured Outputs: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- OpenRouter Best Practices: https://openrouter.ai/docs/api/reference/overview
- LangChain Streaming: https://docs.langchain.com/oss/javascript/langgraph/streaming
- Design Token Spec: https://www.w3.org/community/design-tokens/

### Best Practices Applied

- Multi-temperature generation for diversity (IBM Prompt Engineering Guide 2026)
- Constrained decoding for structured output (Anthropic Structured Outputs)
- Semantic similarity matching (OpenAI Embeddings)
- Anti-bias prompting patterns (Adobe Design Guidelines)

---

## Research Insights (from /deepen-plan)

### Security Findings (from security-sentinel)

**P1 - Critical Issues:**

1. **Prompt Injection** (copilot-simple.js:264): User prompts concatenated without sanitization
   - Fix: Add `sanitizePrompt()` function (see Phase 1)
2. **SSRF Risk**: Brand asset URLs fetched without validation
   - Fix: Validate URLs against allowlist of trusted domains
3. **Hardcoded Secrets**: `.env.local` may contain API keys
   - Fix: Use environment variables, add to `.gitignore`

**Recommended Security Additions:**

```javascript
// URL validation for brand assets
const ALLOWED_DOMAINS = ['storage.googleapis.com', 'cdn.yourdomain.com', 's3.amazonaws.com'];

function validateAssetUrl(url) {
	try {
		const parsed = new URL(url);
		return ALLOWED_DOMAINS.some((d) => parsed.hostname.endsWith(d));
	} catch {
		return false;
	}
}
```

### Agent-Native Findings (from agent-native-reviewer)

**Current State:** Frontend has 22 tools, backend exposes 0 tools to agents.

**Gap Analysis:**
| Capability | User Can | Agent Can | Gap |
|------------|----------|-----------|-----|
| Generate design | Yes | Yes | None |
| Validate aesthetics | N/A | No | **Missing** |
| Select style | N/A | No | **Missing** |
| Get template list | N/A | No | **Missing** |
| Regenerate with hints | Yes | No | **Missing** |

**Recommendation:** If implementing Phases 2-5, expose each as a tool:

- `get_style_profiles` - List available style profiles
- `validate_aesthetics` - Check design for issues
- `find_similar_templates` - Semantic template search
- `regenerate_with_style` - Regenerate with specific style hints

### Performance Findings (from performance-oracle)

**Key Recommendations:**

1. Temperature 0.8 provides natural diversity without extra calls
2. Cache embeddings at startup if using semantic matching
3. Avoid 3x parallel LLM calls - cost scales linearly
4. Use streaming for faster perceived response time

**LangChain Best Practices (from framework-docs-researcher):**

```javascript
// Streaming for better UX
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({
	streaming: true,
	temperature: 0.8
});

// With callbacks for real-time updates
const response = await model.invoke(prompt, {
	callbacks: [
		{
			handleLLMNewToken(token) {
				process.stdout.write(token);
			}
		}
	]
});
```

### Architecture Findings (from architecture-strategist)

**Current Architecture:**

- `copilot-simple.js` - Main zero-shot generation (currently used)
- `copilot-v2/` - Multi-agent pipeline (unused)
- `design-patterns.js` - Golden examples (source of bias)

**Recommendation:**

- Modify `copilot-simple.js` only (minimal change)
- Don't create new services - adds complexity
- If multi-agent needed later, use existing `copilot-v2/` structure

### Code Simplicity Findings (from code-simplicity-reviewer)

**Core Insight:** The plan over-engineers a prompt problem.

**Minimal Solution:**

```javascript
// copilot-simple.js - 4 changes total

// 1. Delete lines 166-170 (hardcoded palette)

// 2. Change line 24
temperature: 0.8, // was 0.5
	// 3. Add to SYSTEM_PROMPT
	`DIVERSITY REQUIREMENTS:
- Do not default to any particular aesthetic style
- Vary color palettes based on prompt mood and context
- Consider the design's purpose and target audience
- Do not assume "tech startup" or "hackathon" aesthetics`;

// 4. Add sanitization before line 264
const cleanPrompt = sanitizePrompt(userPrompt);
```

**Effort Comparison:**
| Approach | Files Changed | Estimated Effort | Diversity Improvement |
|----------|---------------|------------------|----------------------|
| Minimal (Phase 1 only) | 1 | 4 hours | 80% of goal |
| Full (Phases 1-6) | 6+ | 2+ weeks | 100% of goal |

**Recommendation:** Start with minimal approach. Measure. Add complexity only if needed.
