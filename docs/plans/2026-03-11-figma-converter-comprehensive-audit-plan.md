# Figma-to-FabricJS Converter: Comprehensive Property Audit & Fix Plan

**Date:** 2026-03-11
**Goal:** Ensure every Figma node type and property that can be represented in FabricJS is properly handled in the converter.

---

## Gap Analysis: Current Converter vs. Figma REST API

After thorough review of the Figma REST API spec (28 node types, ~100+ properties) and FabricJS v6 capabilities, here are the identified gaps:

---

### SECTION 1: Fill Handling Gaps

**1.1 Multiple fills not composited**

- **Current:** Only uses the topmost visible fill (`fills[fills.length - 1]`)
- **Figma:** Renders ALL fills bottom-to-top with their individual blend modes and opacities
- **Fix:** For multiple visible fills, composite them. For 2+ solid fills, the topmost one typically wins, but if any have opacity < 1 or non-NORMAL blend modes, we should note this. For simple cases (single fill or all opaque), current behavior is fine.
- **Priority:** LOW (edge case, most designs use single fill)

**1.2 Per-fill opacity not applied**

- **Current:** `getFill()` uses `fill.opacity` for SOLID fills
- **Figma:** Each paint has its own `opacity` field (0-1) AND the node has a separate `opacity`
- **Status:** HANDLED correctly - fill.opacity is applied via `figmaColorToRgba(fill.color, fill.opacity ?? 1)`

**1.3 Per-fill blendMode ignored**

- **Current:** Only node-level blendMode is handled
- **Figma:** Each individual fill paint has its own `blendMode`
- **Fix:** Not feasible in FabricJS (single object has single blend mode). Document as known limitation.
- **Priority:** SKIP (FabricJS limitation)

**1.4 IMAGE fill handling incomplete**

- **Current:** Returns placeholder gray `#cccccc` with `_hasImageFill: true`, relies on fallback PNG
- **Figma:** IMAGE fills have `scaleMode` (FILL/FIT/TILE/STRETCH), `imageTransform`, `filters`, `rotation`
- **Fix:** The fallback PNG approach is correct since we can't access the raw image data from JSON_REST_V1. No change needed.
- **Priority:** N/A (correctly handled via fallback)

---

### SECTION 2: Stroke Handling Gaps

**2.1 Individual stroke weights (per-side) not handled**

- **Current:** Only uses `node.strokeWeight` (uniform)
- **Figma:** `individualStrokeWeights: { top, right, bottom, left }` allows different widths per side
- **Fix:** When `individualStrokeWeights` is present, create separate line paths for each side with different stroke widths. Or use a single strokeWidth of the max and adjust visually.
- **FabricJS:** No native per-side stroke support. Best approximation: use the max stroke weight.
- **Priority:** MEDIUM

**2.2 Multiple strokes not handled**

- **Current:** Only uses `strokes[0]`
- **Figma:** Can have multiple stroke paints
- **Fix:** Use topmost visible stroke (similar to fills). Already partially correct.
- **Priority:** LOW

**2.3 Stroke gradient fills not handled**

- **Current:** Only extracts solid color from stroke
- **Figma:** Strokes can have gradient fills (same Paint types as fills)
- **Fix:** Apply gradient conversion to strokes when stroke type is gradient
- **FabricJS:** Supports gradient/pattern strokes via `stroke: new Gradient(...)`
- **Priority:** MEDIUM

**2.4 strokeCap arrow/diamond types not handled**

- **Current:** Only maps NONE/ROUND/SQUARE
- **Figma:** Also has LINE_ARROW, TRIANGLE_ARROW, DIAMOND_FILLED, CIRCLE_FILLED, TRIANGLE_FILLED
- **Fix:** These are connector-specific markers. Not relevant for shape strokes.
- **Priority:** SKIP (connector-only)

---

### SECTION 3: Effect Handling Gaps

**3.1 Multiple shadows not composited**

- **Current:** Uses `effects.find()` to get only the FIRST shadow
- **Figma:** Supports multiple shadows on one node, rendered in order
- **FabricJS:** Only supports ONE shadow per object
- **Fix:** Use the most prominent shadow (largest blur + offset). Document limitation.
- **Priority:** LOW (FabricJS limitation - use most prominent)

**3.2 Shadow spread not properly handled**

- **Current:** Adds spread to blur: `blur: (radius || 0) + (spread || 0)`
- **Figma:** Spread expands/contracts the shadow shape itself, independent of blur
- **Fix:** FabricJS has no spread concept. Adding to blur is the best approximation.
- **Priority:** N/A (best possible approximation)

**3.3 BACKGROUND_BLUR not handled**

- **Current:** Only handles LAYER_BLUR
- **Figma:** BACKGROUND_BLUR blurs content behind the element (like CSS backdrop-filter)
- **FabricJS:** No native support for backdrop blur
- **Fix:** Store as metadata `_backgroundBlur` for potential future use. Skip rendering.
- **Priority:** LOW

**3.4 Shadow blendMode ignored**

- **Current:** Not checked
- **Figma:** Each shadow effect has its own `blendMode`
- **FabricJS:** Shadow doesn't support blend modes
- **Priority:** SKIP (FabricJS limitation)

**3.5 showShadowBehindNode ignored**

- **Current:** Not checked
- **Figma:** Controls whether shadow renders behind translucent pixels
- **FabricJS:** No equivalent
- **Priority:** SKIP

---

### SECTION 4: Corner Radius Gaps

**4.1 Per-corner radius approximation is lossy**

- **Current:** Uses `Math.max(...rectangleCornerRadii)` — takes the largest corner
- **Figma:** `rectangleCornerRadii: [topLeft, topRight, bottomRight, bottomLeft]`
- **FabricJS:** Only supports uniform `rx`/`ry`
- **Fix:** Convert to a Path with proper arcs when corners differ significantly. This gives perfect fidelity.
- **Priority:** HIGH — this is a common design pattern (e.g., tab shapes, cards with only top corners rounded)

**4.2 cornerSmoothing (squircle) not handled**

- **Current:** Not implemented
- **Figma:** `cornerSmoothing` (0-1, 0.6 = iOS squircle) creates superellipse curves
- **FabricJS:** No native squircle support
- **Fix:** For non-zero cornerSmoothing, generate a superellipse Path approximation
- **Priority:** LOW (subtle visual difference, complex to implement)

---

### SECTION 5: Text Handling Gaps

**5.1 paragraphSpacing not handled**

- **Current:** Not implemented
- **Figma:** `style.paragraphSpacing` adds space between paragraphs
- **Fix:** FabricJS doesn't have native paragraph spacing. Could insert extra newlines or adjust per-line spacing.
- **Priority:** LOW

**5.2 paragraphIndent not handled**

- **Current:** Not implemented
- **Figma:** `style.paragraphIndent` indents first line of paragraphs
- **Fix:** FabricJS doesn't have native paragraph indent. Would need to prepend spaces or use custom render.
- **Priority:** LOW

**5.3 textAlignVertical not handled**

- **Current:** Not implemented
- **Figma:** `style.textAlignVertical` (TOP/CENTER/BOTTOM)
- **Fix:** Adjust `top` position of Textbox based on vertical alignment and actual text height vs bounding box height
- **Priority:** MEDIUM

**5.4 textAutoResize not handled**

- **Current:** Always creates fixed-width Textbox
- **Figma:** `WIDTH_AND_HEIGHT` (auto-width), `HEIGHT` (fixed width, auto height), `NONE` (fixed both)
- **Fix:** For WIDTH_AND_HEIGHT, don't set width constraint (use FabricText instead of Textbox). For HEIGHT, current Textbox behavior is correct. For NONE, set fixed dimensions.
- **Priority:** MEDIUM

**5.5 textTruncation + maxLines not handled**

- **Current:** Not implemented
- **Figma:** `textTruncation: 'ENDING'` with `maxLines` truncates text with ellipsis
- **FabricJS:** No native truncation support
- **Priority:** LOW

**5.6 lineTypes/lineIndentations (lists) not handled**

- **Current:** Not implemented
- **Figma:** `lineTypes` array with ORDERED/UNORDERED per line, `lineIndentations` for nesting
- **Fix:** Prepend bullet/number characters to the text content for list items
- **Priority:** MEDIUM

**5.7 hyperlinks not handled**

- **Current:** Not implemented
- **Figma:** `style.hyperlink` with URL or node reference
- **Fix:** Store as metadata on the text object for potential click handling
- **Priority:** LOW

**5.8 SMALL_CAPS textCase not handled**

- **Current:** Only handles UPPER, LOWER, TITLE
- **Figma:** Also has SMALL_CAPS and SMALL_CAPS_FORCED
- **Fix:** For SMALL_CAPS, convert lowercase letters to uppercase and apply smaller fontSize via character styles
- **Priority:** LOW

**5.9 lineHeightUnit not properly handled**

- **Current:** Uses `lineHeightPx / fontSize` always
- **Figma:** Has `lineHeightUnit`: PIXELS (use lineHeightPx), FONT*SIZE*% (use lineHeightPercentFontSize), INTRINSIC\_% (use default)
- **Fix:** Handle different line height units properly
- **Priority:** MEDIUM

---

### SECTION 6: Node Type Gaps

**6.1 STICKY not handled**

- **Current:** Falls through to default (skipped)
- **Figma:** Sticky note with text sublayer
- **Fix:** Render as a rounded rectangle with text
- **Priority:** LOW (FigJam element, rare in design files)

**6.2 SHAPE_WITH_TEXT not handled**

- **Current:** Falls through to default (skipped)
- **Figma:** Shape (many types) with text sublayer
- **Fix:** Render based on shapeType with text overlay
- **Priority:** LOW (FigJam element)

**6.3 CONNECTOR not handled**

- **Current:** Falls through to default (skipped)
- **Figma:** Line connector between nodes
- **Fix:** Render as a Path/Line with optional arrow markers
- **Priority:** LOW (FigJam element)

**6.4 TABLE / TABLE_CELL not handled**

- **Current:** Falls through to default (skipped)
- **Figma:** Table grid with cells
- **Fix:** Render as a Group of Rects with text
- **Priority:** LOW (relatively new Figma feature)

**6.5 SLICE not handled**

- **Current:** Falls through to default (skipped)
- **Figma:** Export region (not visual)
- **Fix:** Skip intentionally (not a visual element)
- **Priority:** N/A (correct to skip)

**6.6 WIDGET/EMBED/LINK_UNFURL not handled**

- **Current:** Falls through to default (skipped)
- **Figma:** Interactive widgets and embeds
- **Fix:** Use fallback PNG image if available
- **Priority:** LOW

---

### SECTION 7: Transform & Layout Gaps

**7.1 relativeTransform rotation extraction incomplete**

- **Current:** Uses `node.rotation` directly
- **Figma:** `relativeTransform` is a 2x3 affine matrix that encodes rotation, scale, skew, and translation
- **Fix:** Extract rotation from the matrix when `rotation` property is not present: `Math.atan2(matrix[1][0], matrix[0][0])`
- **Priority:** HIGH

**7.2 Skew transforms not handled**

- **Current:** Not implemented
- **Figma:** `relativeTransform` matrix can encode skew
- **Fix:** Extract skewX and skewY from the affine matrix
- **FabricJS:** Supports `skewX` and `skewY` properties
- **Priority:** MEDIUM

**7.3 Node flip (mirror) not handled**

- **Current:** Not implemented
- **Figma:** Negative scale in relativeTransform indicates flip
- **Fix:** Detect negative determinant in transform matrix, set `flipX`/`flipY`
- **FabricJS:** Supports `flipX` and `flipY` properties
- **Priority:** MEDIUM

---

### SECTION 8: Root Frame Background Gaps

**8.1 Root frame background not rendered**

- **Current:** Only children of root are processed, root frame's own fills/strokes are ignored
- **Fix:** Add root frame background rect when it has fills/strokes/effects
- **Priority:** HIGH

---

### SECTION 9: Mask Handling Gaps

**9.1 Mask nodes skipped but masking effect not applied to siblings**

- **Current:** Skips mask nodes (`isMask === true`)
- **Figma:** A mask node clips all subsequent siblings in the same group
- **Fix:** When a mask node is found, use it as a `clipPath` for a sub-group of the remaining siblings
- **FabricJS:** Supports clipPath on Groups
- **Priority:** MEDIUM

---

## Implementation Priority Order

### HIGH Priority (visual fidelity impact)

1. **4.1** Per-corner radius → Path conversion
2. **7.1** relativeTransform rotation extraction
3. **8.1** Root frame background rendering

### MEDIUM Priority

4. **2.1** Individual stroke weights
5. **2.3** Stroke gradient fills
6. **5.3** textAlignVertical
7. **5.4** textAutoResize
8. **5.6** List types (lineTypes/lineIndentations)
9. **5.9** lineHeightUnit handling
10. **7.2** Skew transforms
11. **7.3** Flip detection
12. **9.1** Mask → clipPath conversion

### LOW Priority (edge cases or FabricJS limitations)

13. **1.1** Multiple fill compositing
14. **3.3** Background blur metadata
15. **4.2** Corner smoothing (squircle)
16. **5.1** paragraphSpacing
17. **5.5** textTruncation
18. **5.7** hyperlinks
19. **5.8** SMALL_CAPS
20. **6.x** FigJam node types (STICKY, SHAPE_WITH_TEXT, CONNECTOR, TABLE)

### SKIP (FabricJS limitations, not fixable)

- Per-fill blendMode
- Multiple shadows (use most prominent)
- Shadow blendMode
- showShadowBehindNode
- Background blur rendering
- Angular/conic gradient (approximated as radial)

---

## Implementation Plan

### Step 1: Per-Corner Radius → Path

When `rectangleCornerRadii` has different values, generate an SVG path with proper rounded corners instead of using Rect.

### Step 2: Transform Matrix Parsing

Add `parseTransformMatrix()` to extract rotation, skew, and flip from `relativeTransform`.

### Step 3: Root Frame Background

Process root node's fills/strokes/effects and add background rect.

### Step 4: Individual Stroke Weights

Use max stroke weight as approximation, or render as 4 separate lines.

### Step 5: Stroke Gradients

Apply `figmaGradientToFabric` to strokes when stroke paint is a gradient type.

### Step 6: Text Improvements

- Handle `textAlignVertical` by adjusting top position
- Handle `textAutoResize` by choosing FabricText vs Textbox
- Handle `lineHeightUnit` variations
- Handle list types by prepending markers

### Step 7: Mask → ClipPath

Detect mask nodes, create clipPath groups for masked siblings.

### Step 8: Flip/Skew Detection

Extract flip and skew from transform matrix.
