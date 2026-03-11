---
title: 'feat: Scheduled & Expiring Images (Phase 3)'
type: feat
status: active
date: 2026-03-02
origin: docs/plans/2026-02-28-feat-experiments-ab-test-smart-links-scheduling-auto-optimization-plan.md
---

# feat: Scheduled & Expiring Images (Phase 3)

## Overview

Add time-based variant resolution to the experiments system. Each variant in a `scheduled` experiment has a time window (`startAt`/`endAt`). The router serves the currently-active variant based on server time. Experiments can hard-expire via `expiresAt`, returning a fallback image or 410 Gone. A BullMQ scheduler pre-renders variants before their window opens.

Phases 1 (A/B Test) and 2 (Smart Links) are complete. The Experiment model schema already has all required fields (`variants[].schedule`, `expiresAt`, `fallbackImageUrl`). Plan limits already gate `scheduled` type per plan tier.

## Problem Statement / Motivation

Users want to schedule different images for different time periods — seasonal promotions, event countdowns, time-zone-aware content, and auto-expiring campaign images. Currently there is no way to serve different variants based on time without manual intervention.

## Proposed Solution

### Backend (3 changes)

1. **Schedule Resolver** — Pure function `resolveScheduledVariant(experiment)` in new file `service/schedule-resolver.js`. Called from the `scheduled` case in `routes/experiment-render.js`.

2. **Experiment Scheduler Queue** — New BullMQ service `service/experiment-scheduler.js` following `binding-refresh-queue.js` pattern. Repeatable job every 5 min finds upcoming schedules and queues pre-render jobs.

3. **Server registration** — Register scheduler worker + add queue to Bull Board in `server.js`.

### Frontend (3 changes)

4. **ScheduleEditor.svelte** — New component for per-variant date/time editing with timeline visualization.

5. **Scheduled creation page** — New route `/dashboard/experiments/create/scheduled/+page.svelte` following the smart-link creation pattern.

6. **Enable UI** — Un-gate the "Scheduled" button in experiments list, update detail page for scheduled type display.

## Technical Approach

### 1. Schedule Resolver (`service/schedule-resolver.js`)

```javascript
// service/schedule-resolver.js
function resolveScheduledVariant(experiment) {
	const now = new Date();

	// Hard expiry check
	if (experiment.expiresAt && now > new Date(experiment.expiresAt)) {
		return { expired: true, fallbackUrl: experiment.fallbackImageUrl };
	}

	// Find variants with active time windows
	const active = experiment.variants
		.filter((v) => {
			if (!v.schedule?.startAt) return false;
			const start = new Date(v.schedule.startAt);
			const end = v.schedule.endAt ? new Date(v.schedule.endAt) : null;
			return start <= now && (!end || end > now);
		})
		.sort((a, b) => new Date(b.schedule.startAt) - new Date(a.schedule.startAt));

	// Latest startAt wins when multiple active
	if (active.length > 0) return { variant: active[0], expired: false };

	// Fallback: default variant or first
	const fallback = experiment.variants.find((v) => v.isDefault) || experiment.variants[0];
	return { variant: fallback, expired: false };
}
```

### 2. Router Integration (`routes/experiment-render.js`)

Replace the `case 'scheduled'` stub (~line 136):

```javascript
case 'scheduled': {
  const { variant, expired, fallbackUrl } = resolveScheduledVariant(experiment)
  if (expired) {
    if (fallbackUrl) return res.redirect(302, fallbackUrl)
    return res.status(410).send('This image has expired')
  }
  return { variant, isBot, viewerKey }
}
```

### 3. Scheduler Service (`service/experiment-scheduler.js`)

Pattern: copy `binding-refresh-queue.js` structure.

**Two job types:**

- `check-schedules` (repeatable, every 5 min): Queries MongoDB for scheduled experiments with variants starting within next 10 min that haven't been pre-rendered. Queues individual pre-render jobs.
- `expire-experiments` (repeatable, every 5 min): Finds experiments with `expiresAt < now` that are still `active: true`, sets `status: 'completed'`.

```javascript
// Scheduler query (find upcoming variants needing pre-render)
const upcoming = await Experiment.find({
	active: true,
	type: 'scheduled',
	status: 'running',
	'variants.schedule.startAt': {
		$lte: new Date(Date.now() + 10 * 60 * 1000), // Within 10 min
		$gte: new Date() // Not in the past
	}
}).lean();
```

### 4. ScheduleEditor.svelte

Per-variant schedule editing with:

- Date/time inputs (native `<input type="datetime-local">`) per variant
- Display in browser timezone, store as UTC ISO strings
- Visual timeline showing variant windows on a horizontal axis
- Overlap warnings (non-blocking)
- Experiment-level `expiresAt` date picker
- Fallback image URL input

### 5. Scheduled Creation Page

Route: `/dashboard/experiments/create/scheduled/+page.svelte`

Wizard steps:

1. **Setup** — Name, slug, template selection
2. **Variants** — Add variants with template/variables
3. **Schedule** — ScheduleEditor for time windows per variant + expiry
4. **Launch** — Goal config, review, create

### 6. Enable UI

- `experiments/+page.svelte`: Remove `opacity-50 cursor-not-allowed` from Scheduled button, add `href` to `/dashboard/experiments/create/scheduled`
- `experiments/[uid]/+page.svelte`: Add schedule display section for `type === 'scheduled'`

## Files to Create/Modify

### Backend (`/Users/suyashthakur/html-to-gif`)

| File                              | Action                             | Est. Lines |
| --------------------------------- | ---------------------------------- | ---------- |
| `service/schedule-resolver.js`    | CREATE                             | ~50        |
| `service/experiment-scheduler.js` | CREATE                             | ~200       |
| `routes/experiment-render.js`     | MODIFY (replace scheduled stub)    | ~15        |
| `server.js`                       | MODIFY (register scheduler worker) | ~15        |

### Frontend (`/Users/suyashthakur/front-end-html-to-gif`)

| File                                                             | Action                    | Est. Lines |
| ---------------------------------------------------------------- | ------------------------- | ---------- |
| `src/lib/components/experiments/ScheduleEditor.svelte`           | CREATE                    | ~500       |
| `src/routes/dashboard/experiments/create/scheduled/+page.svelte` | CREATE                    | ~800       |
| `src/routes/dashboard/experiments/+page.svelte`                  | MODIFY (enable button)    | ~10        |
| `src/routes/dashboard/experiments/[uid]/+page.svelte`            | MODIFY (schedule display) | ~100       |

## Acceptance Criteria

- [ ] `resolveScheduledVariant()` returns correct variant based on current time
- [ ] Expired experiments return 410 or redirect to fallback
- [ ] Multiple active variants: latest `startAt` wins
- [ ] No active variant: default/fallback served
- [ ] Scheduler pre-renders variants before their `startAt`
- [ ] Scheduler auto-completes expired experiments
- [ ] ScheduleEditor shows per-variant date/time pickers
- [ ] Dates display in browser timezone, store as UTC
- [ ] Timeline visualization shows variant windows
- [ ] Overlap warnings shown but non-blocking
- [ ] "Scheduled" button enabled in experiments list
- [ ] Detail page shows schedule timeline for scheduled experiments
- [ ] Vite build passes
- [ ] Existing A/B Test and Smart Link functionality unaffected

## Sources & References

- **Origin plan:** `docs/plans/2026-02-28-feat-experiments-ab-test-smart-links-scheduling-auto-optimization-plan.md` (Phase 3 section, lines 588-641)
- **BullMQ pattern:** `service/binding-refresh-queue.js`
- **Experiment model:** `models/Experiment.js` (schedule schema already defined)
- **Router:** `routes/experiment-render.js` (scheduled stub at line 136)
