# Figma Import to FabricJS Canvas

## Overview

Import Figma designs directly into the Pictify editor by converting Figma nodes to FabricJS canvas objects. Users paste a Figma file URL or provide a personal access token to fetch designs, select a frame/page, and import it as editable FabricJS objects on the canvas.

## Architecture

### Approach: Figma REST API → Node Conversion → FabricJS Objects

- Use Figma REST API v1 to fetch file/node data
- Convert Figma node tree to FabricJS object tree
- Download image fills/exports via Figma image API
- Render onto existing FabricJS canvas using established patterns

### Why Not SVG Export?

- SVG export loses editability (text becomes paths)
- SVG flattens layer structure
- No variable binding possible on SVG imports
- Direct node conversion preserves individual object properties

## Implementation Plan

### Phase 1: Figma API Integration (Backend)

**Files to create:**

- `html-to-gif/routes/figma.js` - API proxy routes
- `html-to-gif/service/figma-api.js` - Figma REST API client

**Routes:**

- `POST /figma/fetch-file` - Fetch Figma file metadata (pages, frames)
- `POST /figma/fetch-nodes` - Fetch specific node data with children
- `POST /figma/fetch-images` - Get rendered images for nodes (fills, exports)

**Why proxy through backend:**

- Keeps Figma personal access tokens server-side
- Enables caching of Figma API responses
- Rate limit management
- Image asset proxying for CORS

### Phase 2: Figma-to-FabricJS Converter (Frontend)

**Files to create:**

- `front-end-html-to-gif/src/lib/utils/figma-converter.js` - Core conversion engine

**Node Type Mapping:**
| Figma Node | FabricJS Object | Notes |
|-----------|----------------|-------|
| FRAME | Group | Container with clip |
| GROUP | Group | Transparent container |
| RECTANGLE | Rect | With cornerRadius support |
| ELLIPSE | Circle/Ellipse | Based on dimensions |
| LINE | Line | Simple line |
| VECTOR | Path | SVG path data |
| TEXT | IText | Font mapping required |
| IMAGE (fill) | FabricImage | Downloaded via API |
| COMPONENT | Group | Resolved to instance |
| INSTANCE | Group | Flattened to children |
| BOOLEAN_OPERATION | Path | Union/subtract/intersect |

**Property Mapping:**
| Figma Property | FabricJS Property |
|---------------|-------------------|
| absoluteBoundingBox | left, top, width, height |
| fills[0].color | fill (rgba) |
| strokes[0].color | stroke |
| strokeWeight | strokeWidth |
| opacity | opacity |
| rotation | angle |
| cornerRadius | rx, ry (Rect) |
| effects (shadow) | shadow |
| blendMode | globalCompositeOperation |
| constraints | (ignored - static import) |
| layoutMode | (ignored - auto layout flattened) |

### Phase 3: Import UI Component (Frontend)

**Files to create:**

- `front-end-html-to-gif/src/lib/components/editor/FigmaImportModal.svelte` - Import dialog

**UI Flow:**

1. User clicks "Import from Figma" in AssetPanel
2. Modal opens - user enters Figma file URL + personal access token
3. Backend fetches file metadata → shows pages/frames list
4. User selects frame to import
5. Preview thumbnail shown (via Figma image export)
6. Click "Import" → converter processes nodes → adds to canvas
7. Objects added as a Group, centered on canvas

**Token Storage:**

- Save Figma PAT in localStorage (encrypted) for convenience
- Option to "remember token" checkbox
- Clear token button

### Phase 4: Integration with Editor

**Files to modify:**

- `front-end-html-to-gif/src/lib/components/editor/AssetPanel.svelte` - Add Figma import tab/button

**Integration Points:**

- Add "Figma" tab or button in AssetPanel sidebar
- Use existing `$editor.add()` pattern for adding objects
- Wrap in history batch (`__historyBatchStart`/`__historyBatchEnd`)
- Scale imported group to fit canvas (like existing image import)
- Set custom property `figmaSourceId` on imported objects for reference

## Technical Details

### Figma Color to FabricJS

```javascript
function figmaColorToRgba({ r, g, b, a = 1 }) {
	return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}
```

### Figma Gradient to FabricJS

- LINEAR_GRADIENT → fabric.Gradient({ type: 'linear', ... })
- RADIAL_GRADIENT → fabric.Gradient({ type: 'radial', ... })
- Map gradientHandlePositions to FabricJS coords

### Font Handling

- Extract font families from Figma text nodes
- Check if font available in browser
- Fall back to Google Fonts loading via existing `brand-fonts-loader.js`
- Last resort: system font fallback mapping

### Image Fill Handling

- Figma fills of type IMAGE have `imageRef`
- Use Figma Images API to download actual image data
- Upload to our CDN or use as data URL
- Apply as FabricImage or pattern fill

## Scope Limitations (V1)

- No real-time sync with Figma (one-time import)
- No component library import (instances flattened)
- No auto-layout preservation (positions flattened)
- No prototype/interaction import
- No plugin/widget import
- Boolean operations converted to rendered images
- Complex vectors (multi-path) exported as images
- No Figma comments/annotations

## File Summary

| Action | File Path                                                                 |
| ------ | ------------------------------------------------------------------------- |
| CREATE | `html-to-gif/routes/figma.js`                                             |
| CREATE | `html-to-gif/service/figma-api.js`                                        |
| CREATE | `front-end-html-to-gif/src/lib/utils/figma-converter.js`                  |
| CREATE | `front-end-html-to-gif/src/lib/components/editor/FigmaImportModal.svelte` |
| MODIFY | `front-end-html-to-gif/src/lib/components/editor/AssetPanel.svelte`       |
| MODIFY | `html-to-gif/routes/index.js` (register figma routes)                     |
