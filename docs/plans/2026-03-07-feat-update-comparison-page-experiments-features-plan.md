---
title: "feat: Update comparison pages with experiments features"
type: feat
status: active
date: 2026-03-07
---

# Update Comparison Pages with Experiments Features

## Overview

The comparison pages (`src/lib/pseo/comparisons.js` and `src/routes/compare/[slug]/+page.svelte`) need to be updated to reflect Pictify's new experiments capabilities: A/B Testing, Smart Links, Scheduled Experiments, and Auto-Optimization (Bandit). Currently the comparison data has no feature keys for these capabilities.

## Problem Statement

Pictify now has a robust experiments platform (A/B testing, smart links, scheduled variants, auto-optimization) but the 37 competitor comparison pages don't reflect these features at all. This means potential customers comparing Pictify to competitors don't see these differentiators.

## Proposed Solution

1. **Add new feature keys** to `comparisons.js` for experiment capabilities
2. **Update Pictify's scores** (5 stars) for completed features, appropriate scores for TODO features
3. **Set competitor scores** accurately based on their actual capabilities
4. **Update feature label map** in `compare/[slug]/+page.svelte` with display labels for new keys
5. **Add experiments to the advantages** listed for Pictify in each comparison

## Files to Modify

### `src/lib/pseo/comparisons.js`
- Add feature keys: `abTesting`, `smartLinks`, `scheduledVariants`, `autoOptimization`, `contextTargeting`, `experimentAnalytics`
- Update `featureGroups` to include an "Experiments" category
- Update Pictify scores: `abTesting: 5`, `smartLinks: 5`, `scheduledVariants: 5`, `autoOptimization: 3` (TODO/planned), `contextTargeting: 5`, `experimentAnalytics: 5`
- Set competitor scores based on actual capabilities (most image gen APIs have 0-1 for these)
- Add experiments-related advantages to each competitor comparison

### `src/routes/compare/[slug]/+page.svelte`
- Add feature labels for new keys in the `featureLabels` map
- Ensure new features render correctly in the comparison table

## Acceptance Criteria

- [ ] New experiment feature keys added to all 37 competitor comparisons in `comparisons.js`
- [ ] Pictify scores accurately reflect implementation status (5 for complete, 3 for planned)
- [ ] Competitor scores are reasonable (most image APIs don't have A/B testing)
- [ ] Feature labels display correctly on comparison detail pages
- [ ] Feature group "Experiments & Optimization" added
- [ ] Build passes without errors
- [ ] Advantages sections updated to mention experiments where relevant

## Sources

- Experiments implementation: `src/routes/dashboard/experiments/`
- Backend experiments: `/Users/suyashthakur/html-to-gif/routes/experiment-render.js`
- Comparison data: `src/lib/pseo/comparisons.js`
- Comparison UI: `src/routes/compare/[slug]/+page.svelte`
