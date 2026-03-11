# Dashboard UI/UX Audit Report

**Date:** February 23, 2026
**Scope:** Complete dashboard application audit
**Method:** Multi-agent parallel analysis across 6 review dimensions

---

## Executive Summary

The Pictify dashboard implements a **distinctive neo-brutalist design system** -- bold 3px borders, hard-offset shadows, DynaPuff headings, and a warm `#FFFDF8` background. This gives the product a memorable, playful identity that differentiates it from the sea of bland SaaS dashboards. The architecture is solid SvelteKit with Tailwind CSS and custom Svelte stores.

However, this audit across **60+ component files** reveals that the design system is **applied inconsistently**, with significant gaps in **accessibility**, **security**, **performance**, and **component reuse**. Below are the findings organized by severity, with actionable recommendations.

### Audit Score Card

| Dimension              | Score | Summary                                                                            |
| ---------------------- | ----- | ---------------------------------------------------------------------------------- |
| Visual Consistency     | 6/10  | Strong identity, but 7 shadow sizes, 2 different greens, inconsistent card headers |
| Accessibility          | 3/10  | Near-zero ARIA attributes, no keyboard navigation, no focus management             |
| Component Architecture | 5/10  | Good store patterns, but massive duplication (nav links, utilities, modals)        |
| Performance            | 7/10  | Server pagination works well, but duplicate API calls and render-blocking fonts    |
| Security               | 5/10  | Good XSS prevention (DOMPurify), but hardcoded tokens, no CSRF, open redirects     |
| UX Flows               | 6/10  | Good happy paths, but broken error states, missing confirmations, dead-end pages   |

---

## 1. CRITICAL FINDINGS (Fix Immediately)

### 1.1 Security: Hardcoded Chatwoot Token Over HTTP

**File:** `src/app.html`
**Risk:** Script injection via MitM
The Chatwoot widget loads over HTTP with a hardcoded website token. An attacker on the same network could inject arbitrary JavaScript into every page of the dashboard. Move to HTTPS and use environment variables for the token.

### 1.2 Security: Open Redirect in Login Flow

**File:** `src/lib/components/auth/login.svelte`
The `redirect` URL parameter is used without origin validation. An attacker can craft a login URL that redirects to a phishing page after authentication, stealing credentials.

### 1.3 Security: Full API Token Exposed in DOM

**File:** `src/lib/components/dashboard/ApiToken.svelte`
The full API token is placed in a `title` attribute, making it visible in browser dev tools, screen readers, and tooltip hover. Show only the last 4 characters with a "Copy" button.

### 1.4 Security: No CSRF Protection

**Files:** All state-changing API calls in `src/service/backend.js`
POST/PUT/DELETE requests use `credentials: 'include'` for cookies but send no CSRF token. An attacker could create a page that triggers billing actions, team changes, or API token operations on behalf of an authenticated user.

### 1.5 Accessibility: Zero ARIA Attributes Across Navigation

**Files:** `SideNav.svelte`, `TeamSwitcher.svelte`
The entire sidebar navigation (14 links, expandable sections, dropdown menus) has **zero** `aria-*` attributes. Screen reader users cannot:

- Identify the current page (`aria-current="page"` missing)
- Know if a dropdown is open (`aria-expanded` missing)
- Navigate dropdown items with keyboard (no arrow key support)
- Identify navigation landmarks (`aria-label` missing on `<nav>`)

### 1.6 UX: `alert()` Calls Break the Interface

**Files:** `WebhookSubscriptions.svelte` (3 calls), `ConnectorConfigs.svelte` (4 calls)
Browser `alert()` dialogs block the thread and break the neo-brutalist design language. These are the only components using native dialogs while every other component uses the toast system.

### 1.7 UX: Broken Overage Management Flow

**File:** `UsageBanner.svelte`
The "Manage Settings" link in the usage banner navigates to `?tab=billing` which is a non-existent route. Users hitting their usage limits encounter a dead end at the most critical moment.

---

## 2. HIGH SEVERITY FINDINGS

### 2.1 Architecture: Massive Navigation Link Duplication

**File:** `SideNav.svelte`
The active-state navigation link pattern is copy-pasted **9 times** (~150 lines). Each link repeats the same class logic, path-check expression (appears 23 times), and SVG icon inline. This should be a single `NavLink.svelte` component accepting `href`, `label`, `iconPath`, and an optional badge slot.

### 2.2 Architecture: 5 Different `copyToClipboard` Implementations

**Files:** `ApiToken.svelte`, `api-playground/+page.svelte`, `TeamSettings.svelte`, `TeamMembers.svelte`, `AuditLogs.svelte`
Each file implements its own clipboard copy with different error handling, toast messages, and durations. One shared utility would eliminate all duplication.

### 2.3 Architecture: Full Component Duplication (AuditLogs)

**Files:** `AuditLogs.svelte` (155 lines) and `activity-logs/+page.svelte` (500+ lines)
Two completely separate implementations of the same audit logs feature with different UX, different filtering, and different export behavior. One should be deleted.

### 2.4 Architecture: Team Members Duplicated Across Two Pages

**Files:** `TeamSettings.svelte`, `TeamMembers.svelte`
Both components implement member lists, invitation lists, invite forms, role management, and clipboard operations with slightly different styling (avatar 10x10 vs 12x12, different font sizes). Changes must be made in both files.

### 2.5 UX: No Delete Confirmation for API Token Revocation

**File:** `ApiToken.svelte`
Revoking an API token is the only destructive action in the entire dashboard with **zero confirmation**. Every other delete action has a confirmation dialog. Revoking an active API token could break production integrations.

### 2.6 UX: OverageWarningModal Uses Wrong Design Language

**File:** `OverageWarningModal.svelte`
This modal appears during a high-stakes moment (the user is about to be charged) but uses `border-4` instead of `border-[3px]`, `bg-white` instead of `bg-[#FFFDF8]`, a blue shadow `#c6e0ff` instead of the standard `#1f2937`, and different font weights. It looks like it belongs to a different product, undermining trust at the worst possible moment.

### 2.7 Performance: Duplicate PLG API Calls on Every Page Load

**Files:** `PLGProvider.svelte`, `UsageWidget.svelte`
Both components independently call `initPLG()` on mount, resulting in duplicate `getPlanDetails` API calls on every dashboard page load. They also set up separate polling intervals (2 minutes each), doubling network overhead.

### 2.8 Performance: Render-Blocking Font Loading

**File:** `src/app.html`
Google Fonts loads 9 weights of Inter, 4 weights of Manrope, variable DynaPuff, and Silkscreen. Font Awesome CSS (25KB gzipped) loads synchronously. Only Inter 400-700 and DynaPuff 400-700 are used in the dashboard. The rest blocks initial render for no benefit.

---

## 3. MEDIUM SEVERITY FINDINGS

### 3.1 Design Token Chaos: 7 Shadow Sizes, No Scale

Across just the 4 navigation files, there are **7 different shadow values**:
| Shadow | Context |
|--------|---------|
| `shadow-[1px_1px_0_0_#1f2937]` | Active indicator dot |
| `shadow-[2px_2px_0_0_#1f2937]` | Team avatar hover |
| `shadow-[2px_2px_0_0_#ffc480]` | Logo icon, focus states |
| `shadow-[3px_3px_0_0_#1f2937]` | Active nav items |
| `shadow-[4px_4px_0_0_#1f2937]` | Team switcher button |
| `shadow-[6px_6px_0_0_#1f2937]` | Dropdown menus, cards |
| `shadow-[8px_8px_0_0_#1f2937]` | Modals |

Define a shadow scale in `tailwind.config.js`: `sm: 2px`, `md: 3px`, `lg: 4px`, `xl: 6px`, `2xl: 8px`.

### 3.2 Two Different Greens for "Success"

- `#4ade80` (Tailwind green-400): Resume buttons, milestone celebrations, checkmarks
- `#10b981` (Tailwind emerald-500): Feature badges, time-saved indicators, benefit lists

Pick one. `#10b981` has better contrast on white backgrounds.

### 3.3 Card Header Pattern Inconsistency

**Pattern A** (SubscriptionCard, OverageSettings, UsageWidget): Gray background header, uppercase tracking-widest title, 3px bottom border.
**Pattern B** (InvoiceHistory): White background header, `text-lg font-black`, 2px bottom border.
InvoiceHistory breaks the card system.

### 3.4 `window.location.reload()` Instead of SvelteKit Navigation

**File:** `TeamSwitcher.svelte` (lines 73, 98)
After switching teams, the app does a full page reload instead of using `invalidateAll()`. This causes a white flash, reloads all fonts and scripts, and takes 2-3 seconds instead of 200ms.

### 3.5 Manual Store Subscription (Anti-Pattern)

**File:** `SideNav.svelte` (lines 27-42)
Uses `onMount` + `user.subscribe()` + `onDestroy` + `unsubscribe()` instead of the Svelte auto-subscription `$user`. This is 15 lines of boilerplate for what should be one reactive statement.

### 3.6 MediaList Empty State Has No Call-to-Action

**File:** `MediaList.svelte`
When there are no generated images/GIFs/PDFs, the empty state says "Start generating images from your templates" but provides no link to templates. Users hit a dead end.

### 3.7 Brand Assets Drag-and-Drop is Fake

**File:** `brand-assets/+page.svelte`
The upload area says "Drop file or click to upload" but has no `on:dragover`, `on:drop`, or `on:dragleave` handlers. Dropping a file does nothing.

### 3.8 InvoiceHistory Has No Error State

**File:** `InvoiceHistory.svelte`
If the invoices API call fails, the component shows an empty state ("No invoices yet") instead of an error with retry. Users may think they have no invoices when the API is down.

### 3.9 Import Path Inconsistency

The layout uses `$lib/` aliases for components but relative `../../` paths for stores. SideNav and TeamSwitcher use `../../../` everywhere. Convention should be `$lib/` for all non-sibling imports.

### 3.10 Toast Duration Inconsistency

Toast durations vary from 1500ms to 3000ms across components with no apparent logic. Success toasts in ApiToken show for 1.5s while success toasts in TeamMembers show for 2s. Standardize: 2000ms success, 3000ms error.

---

## 4. LOW SEVERITY FINDINGS (Polish)

### 4.1 No Shared Icon System

14 inline SVGs in SideNav, 4 in TeamSwitcher, 2 in Nav. The chevron icon `M19 9l-7 7-7-7` appears in multiple files. Extract into an icon dictionary or use a lightweight icon component.

### 4.2 `border-[2px]` vs `border-2` Mixed

**File:** `TeamSwitcher.svelte`
Both `border-[2px]` (arbitrary value) and `border-2` (Tailwind utility) produce the same result but are used interchangeably in the same file. Pick `border-2`.

### 4.3 Pagination Button Sizing Inconsistent

TemplateList uses responsive sizing (`w-8 h-8 sm:w-10 sm:h-10`) while MediaList uses fixed (`w-10 h-10`). Active page indicators also differ (`shadow-md scale-105` vs `shadow-[2px_2px_0_0_#ffc480]`). Extract a shared `<Pagination>` component.

### 4.4 Nav Height Jump at 640px

Nav is 64px on mobile, jumps to 80px at `sm:` (640px) with no transition. This creates a jarring layout shift.

### 4.5 Sidebar Width Hardcoded in Two Places

`w-64` / `16rem` is duplicated in layout and Nav. If one changes, the other will be out of sync. Use a CSS custom property.

### 4.6 Export Dropdown is Hover-Only

**File:** `activity-logs/+page.svelte`
The export format dropdown (CSV, JSON, PDF) only opens on hover, not click. Keyboard and touch users cannot access it.

### 4.7 Z-Index Scale is Fragile

`z-10`, `z-20`, `z-30`, `z-40`, `z-50` are used across layout, nav, sidebar, and dropdowns. The nav at `z-30` is below the mobile backdrop at `z-40`, hiding the top bar when the sidebar is open.

---

## 5. PERFORMANCE RECOMMENDATIONS

| Priority | Issue                                                                     | Impact                                   | Effort |
| -------- | ------------------------------------------------------------------------- | ---------------------------------------- | ------ |
| **P0**   | Fix duplicate `initPLG()` calls                                           | Eliminates 50% of API calls on page load | Low    |
| **P0**   | Consolidate polling intervals (2 timers -> 1)                             | Halves ongoing network overhead          | Low    |
| **P1**   | Parallelize dashboard initialization (`getUser` + `initTeam` + `initPLG`) | ~40% faster initial load                 | Medium |
| **P1**   | Make Font Awesome async or replace with inline SVGs                       | Removes 25KB render-blocking CSS         | Low    |
| **P1**   | Trim Google Fonts to used weights only (400-700)                          | ~60% smaller font payload                | Low    |
| **P2**   | Memoize SVG previews in TemplateList                                      | Prevents re-sanitization on every render | Low    |
| **P2**   | Add request deduplication to backend service                              | Prevents redundant parallel calls        | Medium |
| **P3**   | Debounce resize handler in layout                                         | Minor CPU savings                        | Low    |

### Scalability Assessment

| Metric                      | Current                   | 10x Users             | 100x Users                |
| --------------------------- | ------------------------- | --------------------- | ------------------------- |
| Template list render        | ~50ms (paginated)         | ~50ms                 | ~50ms                     |
| API calls on load           | 5-7 calls (3-4 redundant) | Same waste, 10x scale | Critical                  |
| Polling load (per user/min) | 3 req/2min (duplicate)    | Same                  | 1,500 req/min at 1K users |
| DOM nodes per page          | ~500-800                  | Same                  | Same                      |

Server-side pagination keeps renders bounded. The main scalability bottleneck is redundant polling.

---

## 6. SECURITY RECOMMENDATIONS

| Priority        | Finding                                                     | Effort | Impact                                 |
| --------------- | ----------------------------------------------------------- | ------ | -------------------------------------- |
| **Immediate**   | Move Chatwoot to HTTPS, externalize token                   | Low    | Eliminates MitM script injection       |
| **Immediate**   | Validate redirect URL origin in login flow                  | Low    | Prevents credential phishing           |
| **Immediate**   | Mask API token in DOM (show last 4 chars only)              | Low    | Reduces token exposure                 |
| **Short-term**  | Implement CSRF tokens on all POST/PUT/DELETE                | Medium | Prevents cross-site state manipulation |
| **Short-term**  | Add SSRF validation to webhook URL inputs                   | Low    | Blocks internal network probing        |
| **Short-term**  | Remove impersonation code from production bundle            | Low    | Reduces attack surface                 |
| **Medium-term** | Sanitize `@html` usage in API playground                    | Low    | Prevents DOM XSS                       |
| **Medium-term** | Add server-side route protection (not just client redirect) | Medium | Defense in depth                       |

### Positive Security Notes

- DOMPurify for SVG sanitization in TemplateList (strong XSS defense)
- Credential masking (`type="password"`) for storage connector secrets
- Webhook secrets shown only once at creation
- `noopener,noreferrer` on external links
- `encodeURIComponent` for URL parameters

---

## 7. ACCESSIBILITY ROADMAP

### Tier 1: Navigation & Landmarks (Week 1)

- [ ] Add `aria-label="Main navigation"` to `<nav>` in SideNav
- [ ] Add `aria-current="page"` to active nav links
- [ ] Add `aria-expanded` + `aria-controls` to media dropdown toggle
- [ ] Add `aria-haspopup="listbox"` + `aria-expanded` to TeamSwitcher
- [ ] Add keyboard navigation (Arrow Up/Down, Escape) to TeamSwitcher dropdown

### Tier 2: Modals & Dialogs (Week 2)

- [ ] Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` to all modals
- [ ] Implement focus trapping in all modal components
- [ ] Fix backdrop `role="button"` -> `role="presentation"` in ProactiveUpgradeModal
- [ ] Add Escape key handling to close all modals
- [ ] Return focus to trigger element on modal close

### Tier 3: Forms & Inputs (Week 3)

- [ ] Add `for`/`id` attributes to all label/input pairs
- [ ] Wrap form inputs in `<form>` elements for keyboard submit
- [ ] Add `aria-describedby` for error messages
- [ ] Make export dropdown click-toggleable (not hover-only)

### Tier 4: Focus Management (Week 4)

- [ ] Add `focus-visible` ring styling to all interactive elements
- [ ] Implement skip-to-content link
- [ ] Ensure all custom buttons have visible focus indicators matching neo-brutalist style

---

## 8. COMPONENT EXTRACTION ROADMAP

These refactors would eliminate the most duplication and improve maintainability:

### 8.1 `NavLink.svelte` (eliminates ~150 lines in SideNav)

```
Props: href, label, iconPath, badge?
Handles: active state detection, consistent styling, aria-current
```

### 8.2 `BaseModal.svelte` (standardizes 8+ modal implementations)

```
Props: title, size, variant (warning/danger/info)
Slots: content, actions
Handles: backdrop, focus trap, Escape key, aria attributes
```

### 8.3 `Pagination.svelte` (eliminates duplication in TemplateList + MediaList)

```
Props: page, totalPages, hasNext, hasPrev
Events: pageChange
Handles: responsive sizing, page number generation, scroll-to-top
```

### 8.4 Shared Utilities Module

```javascript
// src/lib/utils/shared.js
export function copyToClipboard(text, successMessage?)
export function formatDate(dateString, format?)
export function getPageNumbers(current, total, maxVisible)
export function formatNumber(num)
```

### 8.5 `use:clickOutside` Svelte Action

```
Extracted from TeamSwitcher's manual addEventListener pattern.
Reusable for all dropdown/popover components.
```

---

## 9. DESIGN SYSTEM RECOMMENDATIONS

### 9.1 Formalize the Token System in `tailwind.config.js`

```javascript
// Proposed additions to tailwind.config.js
theme: {
  extend: {
    colors: {
      brand: {
        bg: '#FFFDF8',
        accent: '#ffc480',
        danger: '#ff6b6b',
        success: '#10b981',
      }
    },
    boxShadow: {
      'brutal-sm': '2px 2px 0 0 #1f2937',
      'brutal-md': '3px 3px 0 0 #1f2937',
      'brutal-lg': '4px 4px 0 0 #1f2937',
      'brutal-xl': '6px 6px 0 0 #1f2937',
      'brutal-2xl': '8px 8px 0 0 #1f2937',
      'brutal-accent': '4px 4px 0 0 #ffc480',
    },
    borderWidth: {
      '3': '3px',
    }
  }
}
```

### 9.2 Component Hierarchy

```
Primitives (design tokens)
  -> Atoms (Button, Input, Badge, Icon)
    -> Molecules (NavLink, Card, Modal, Toast, Pagination)
      -> Organisms (SideNav, SubscriptionCard, FeatureGate)
        -> Templates (DashboardLayout, SettingsLayout)
          -> Pages (Billing, Team, Templates)
```

Currently the codebase jumps from design tokens directly to organisms, with no shared atom/molecule layer. This causes every component to reimplement buttons, cards, and inputs with slightly different styling.

---

## 10. TOP 10 PRIORITIZED ACTIONS

| #   | Action                                                       | Impact   | Effort  | Category      |
| --- | ------------------------------------------------------------ | -------- | ------- | ------------- |
| 1   | Fix Chatwoot HTTP + hardcoded token                          | Critical | 1 hour  | Security      |
| 2   | Fix open redirect in login flow                              | Critical | 1 hour  | Security      |
| 3   | Replace `alert()` with toast in integrations                 | High     | 2 hours | UX            |
| 4   | Add ARIA to SideNav + TeamSwitcher                           | High     | 4 hours | A11y          |
| 5   | Extract `NavLink.svelte` from SideNav                        | High     | 3 hours | Architecture  |
| 6   | Fix duplicate `initPLG()` + consolidate polling              | High     | 2 hours | Performance   |
| 7   | Fix OverageWarningModal design inconsistency                 | High     | 2 hours | Visual        |
| 8   | Add delete confirmation to API token revocation              | High     | 1 hour  | UX            |
| 9   | Formalize design tokens in tailwind.config.js                | Medium   | 4 hours | Design System |
| 10  | Extract shared utilities (clipboard, formatting, pagination) | Medium   | 4 hours | Architecture  |

**Estimated total: ~24 hours of focused work to address all critical and high-severity items.**

---

_Report generated via multi-agent analysis: 3 exploration agents (structure, design system, data flow), 4 pattern recognition agents (navigation, billing/PLG, template/media, team/integrations), 1 security sentinel, 1 performance oracle._
