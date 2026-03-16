---
title: "feat: Visual Analytics Pillar — Conversion Tracking & Performance Benchmarks"
type: feat
status: completed
date: 2026-03-14
---

# Visual Analytics Pillar — Conversion Tracking & Performance Benchmarks

## Overview

Build the 4th product pillar: Visual Analytics. This closes the flywheel: Create image -> Track performance -> Feed AI -> Generate better image. It answers the question no other image platform answers: "Which image drove the most conversions?"

## What Already Exists (build on top of)

- **ExperimentEvent model**: Tracks impressions, views, clicks, conversions per variant with dimensional breakdowns (channel, device, country, referrer)
- **Event ingestion**: `POST /s/events` — public endpoint, Redis pipeline, BullMQ sync to MongoDB
- **CDN Analytics**: Per-asset views, bandwidth, referrers, countries, status codes
- **Experiment model**: goalConfig, statistical significance configs, Thompson Sampling, winner declaration
- **Frontend CDN dashboard**: Already shows views, bandwidth, referrers, countries at `/dashboard/analytics`

## What We're Building

### 1. `/visual-analytics` Landing Page (Frontend only)
Public marketing page following the same neobrutalist design as other pillar pages.

**Sections:**
- Hero: "Know Which Images Convert" — every image becomes a measurable asset
- How It Works: 3 steps (Render → Track → Optimize)
- Features grid: Conversion tracking, channel attribution, device breakdowns, geographic performance, statistical significance, industry benchmarks
- Interactive demo: Mock analytics dashboard showing variant comparison
- Pricing CTA + FAQ

### 2. Experiment Analytics Dashboard (Frontend — new page section)
Enhance `/dashboard/experiments/[uid]` with a rich analytics tab.

**What to show:**
- Variant comparison cards (impressions, clicks, CTR, conversions, conversion rate)
- Line chart: performance over time (daily impressions + clicks per variant)
- Channel breakdown: web vs email vs ad vs social (bar chart)
- Device split: mobile vs desktop vs tablet (donut/pie)
- Geographic heatmap or top countries table
- Statistical significance indicator with confidence percentage
- Winner declaration badge when significance is reached

### 3. Backend: Experiment Analytics Aggregation Endpoint
`GET /api/experiments/:uid/analytics` — returns aggregated analytics data.

**Response shape:**
```json
{
  "summary": {
    "totalImpressions": 15000,
    "totalClicks": 450,
    "totalConversions": 23,
    "overallCTR": 3.0,
    "overallConversionRate": 0.15
  },
  "variants": [
    {
      "id": "var_abc",
      "name": "Variant A",
      "impressions": 7500,
      "clicks": 280,
      "conversions": 15,
      "ctr": 3.73,
      "conversionRate": 0.20,
      "isWinner": true
    }
  ],
  "daily": [
    { "date": "2026-03-10", "variants": [{ "id": "var_abc", "impressions": 500, "clicks": 20 }] }
  ],
  "channels": { "web": { "impressions": 10000, "clicks": 300 }, "email": { "impressions": 5000, "clicks": 150 } },
  "devices": { "desktop": 60, "mobile": 35, "tablet": 5 },
  "countries": [{ "code": "US", "impressions": 5000 }, { "code": "GB", "impressions": 2000 }],
  "significance": {
    "isSignificant": true,
    "confidence": 0.97,
    "minimumSampleReached": true,
    "winnerVariantId": "var_abc"
  }
}
```

**Implementation:** Query ExperimentEvent collection grouped by variantId, aggregate daily/channel/device/country dimensions. This data already exists — we just need a formatted aggregation endpoint.

### 4. Industry Benchmarks (Phase 2 — deferred until user base grows)
Anonymized cross-user performance data. Marked as "Coming Soon" on the landing page.

## Acceptance Criteria

- [ ] `/visual-analytics` landing page renders with all sections, no emojis, SVG icons only
- [ ] Nav Solutions dropdown includes "Visual Analytics" link
- [ ] `GET /api/experiments/:uid/analytics` returns aggregated data
- [ ] Experiment detail page shows analytics tab with variant comparison, daily chart, channel/device/geo breakdowns
- [ ] Statistical significance shown with confidence percentage
- [ ] SEO metadata + schema markup on landing page
- [ ] Analytics events tracked (page views, tab clicks)
- [ ] Frontend builds without errors

## Implementation Order

1. Backend: Analytics aggregation endpoint (~30 min)
2. Frontend: Experiment analytics dashboard enhancement (~1 hr)
3. Frontend: `/visual-analytics` landing page (~45 min)
4. Nav: Add to Solutions dropdown (~5 min)
5. Build verification
