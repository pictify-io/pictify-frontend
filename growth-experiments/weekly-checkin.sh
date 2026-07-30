#!/bin/bash
# Weekly check-in for live Pictify PostHog growth experiments.
# Invoked by launchd (~/Library/LaunchAgents/com.pictify.experiment-checkin.plist)
# every Wednesday 09:00 local. Runs `claude` headless against the local repo so it
# can read the phx_ PostHog key from pictify-seo-scoreboard/.env (a remote agent can't).

set -euo pipefail

# launchd gives a minimal PATH — make brew tools (claude, node, python3, curl) findable.
export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

REPO="/Users/suyashthakur/Developer/Personal/front-end-html-to-gif"
KEY_DIR="/Users/suyashthakur/Developer/Personal/pictify-seo-scoreboard"   # holds POSTHOG_API_KEY in .env
LOG_DIR="$REPO/growth-experiments/checkin-logs"
mkdir -p "$LOG_DIR"
STAMP="$(date +%Y-%m-%d_%H%M%S)"
LOG="$LOG_DIR/checkin-$STAMP.log"

cd "$REPO"

read -r -d '' PROMPT <<'EOF' || true
Run the weekly check-in for the live Pictify PostHog growth experiments. You are headless and unattended; be thorough but do not ask questions.

1. Read growth-experiments/03-one-week-checkin.md (query playbook) and growth-experiments/experiments.csv (tracking sheet + which experiments are 'live').
2. Load the PostHog personal key from /Users/suyashthakur/Developer/Personal/pictify-seo-scoreboard/.env (POSTHOG_API_KEY, a phx_ key), project 55738, host https://us.posthog.com. NEVER print, echo, or commit the key.
3. For every experiment whose status is 'live' in experiments.csv, run its HogQL query from the playbook (set START to that experiment's started_on date) against POST https://us.posthog.com/api/projects/55738/query/. Currently live: url-tool-capture-flow-v1 (374736, THE powered read — also evaluate the daily image_generated guardrail), tool-signup-cta-v2 (374737, directional), welcome-experiment-a (374738, assignment-health only — assigned_welcome/signups should be ~50%).
4. Apply the playbook's decision rules. Power constraint: only url-tool-capture-flow-v1 is powered for a significance call in a week; post-signup reads are directional/assignment-health — do NOT kill a post-signup experiment on week-1 numbers alone.
5. Write result_week1 + decision into experiments.csv for each live experiment (edit the file; do not commit).
6. If any flagged guardrail is breached (e.g. a url-tool-capture-flow-v1 treatment arm's gen_pct below control), call it out prominently as SAME-DAY ACTION NEEDED.
7. Check whether any sequenced experiment (onboarding-value-first-skip 374739, dashboard-checklist-value-first 374740, verify-copy-v1 374741) is now ready to launch (only after welcome-experiment-a shows healthy ~50% assignment); note it but do NOT launch anything.
8. Print a concise summary: per-experiment key ratios, guardrail status, decisions, recommended actions.
EOF

echo "=== Pictify experiment weekly check-in: $(date) ===" >"$LOG"
claude -p "$PROMPT" \
  --add-dir "$KEY_DIR" \
  --dangerously-skip-permissions \
  >>"$LOG" 2>&1

echo "=== done: $(date) ===" >>"$LOG"
